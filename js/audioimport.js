/* ---------- a player's own song, made small (S5, waiting on the owner: nothing calls this yet) ----------
   importAudio(file) takes an audio File (anything the browser can play), and gives back a small Ogg Opus file:
     { bytes: Uint8Array, secs: its length in seconds, kbps: what it averages }   or null if this browser can't
   It keeps the first MAX_SECS, mixes the channels to one, lowers the rate to RATE, keeps every peak under PEAK, fades
   in over FADE_IN and out over FADE_OUT (a wave that starts or stops away from 0 pops: CLAUDE.md's no-pop rules), and
   encodes it at KBPS (Opus at 6 kbps is the least WebCodecs' encoder takes: about 45 KB a minute, music still clear
   enough to know). The Ogg file plays in every browser's decodeAudioData, so it can be played like any recording. */
const MAX_SECS = 180, // (3 minutes)
  RATE = 16000, // samples a second (Opus' wideband: voices and tunes still clear)
  KBPS = 6, // (WebCodecs' lowest for Opus)
  FRAME_US = 60000, // 60 ms a packet (the least overhead per second)
  FADE_IN = 0.02, // s
  FADE_OUT = 0.25, // s
  HUSH = 0.08, // s of silence before the fade-in and after the fade-out (more than a packet)
  PEAK = 0.9;

export async function importAudio(file) {
  if (!window.AudioEncoder || !window.OfflineAudioContext) return null;
  const cfg = {
    codec: "opus",
    sampleRate: RATE,
    numberOfChannels: 1,
    bitrate: KBPS * 1000,
    opus: { frameDuration: FRAME_US, application: "audio", signal: "music" },
  };
  if (!(await AudioEncoder.isConfigSupported(cfg)).supported) return null;
  /* decode, then cut, mix to one channel and lower the rate in one render */
  const src = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(
      await file.arrayBuffer(),
    ),
    secs = Math.min(src.duration, MAX_SECS),
    n = Math.max(1, Math.round(secs * RATE)),
    ctx = new OfflineAudioContext(1, n, RATE),
    s = ctx.createBufferSource(),
    g = ctx.createGain(),
    fin = Math.min(FADE_IN, secs / 8),
    fout = Math.min(FADE_OUT, secs / 8);
  s.buffer = src;
  g.gain.value = 0;
  g.gain.setValueAtTime(0, HUSH);
  g.gain.linearRampToValueAtTime(1, HUSH + fin);
  g.gain.setValueAtTime(1, secs - HUSH - fout);
  g.gain.linearRampToValueAtTime(0, secs - HUSH); // (silent at both ends: the codec's own blur there stays at 0 too)
  s.connect(g).connect(ctx.destination); // (a mono destination: the channels are mixed to one)
  s.start(0);
  const x = (await ctx.startRendering()).getChannelData(0);
  let top = 0;
  for (const v of x) top = Math.max(top, Math.abs(v));
  if (top > PEAK) for (let i = 0; i < n; i++) x[i] *= PEAK / top;
  /* encode, then wrap the packets in Ogg */
  const packets = [];
  let head = null,
    fail = null;
  const enc = new AudioEncoder({
    output(chunk, meta) {
      const b = new Uint8Array(chunk.byteLength);
      chunk.copyTo(b);
      packets.push(b);
      const d = meta && meta.decoderConfig && meta.decoderConfig.description;
      if (d && !head) head = new Uint8Array(d.buffer || d);
    },
    error: (e) => (fail = e),
  });
  enc.configure(cfg);
  const step = RATE / 10; // (a tenth of a second at a time)
  for (let i = 0; i < n; i += step) {
    const part = x.slice(i, Math.min(n, i + step));
    const a = new AudioData({
      format: "f32-planar",
      sampleRate: RATE,
      numberOfFrames: part.length,
      numberOfChannels: 1,
      timestamp: Math.round((i / RATE) * 1e6),
      data: part,
    });
    enc.encode(a);
    a.close();
  }
  await enc.flush();
  enc.close();
  if (fail || !packets.length) return null;
  const bytes = ogg(packets, head, n);
  return {
    bytes,
    secs: n / RATE,
    kbps: (bytes.length * 8) / (n / RATE) / 1000,
  };
}

/* ---------- Ogg Opus (RFC 7845): the head, the tags, then the packets, about a second to a page ---------- */
const PRESKIP = 312; // 48 kHz samples the decoder drops at the start (libopus' own, when the encoder gives no head)
function ogg(packets, head, n) {
  const opusHead =
      head &&
      head.length >= 19 &&
      String.fromCharCode(...head.slice(0, 8)) === "OpusHead"
        ? head
        : opusHeadOf(),
    preskip = opusHead[10] | (opusHead[11] << 8),
    tags = new Uint8Array([
      ...ascii("OpusTags"),
      ...le32(11),
      ...ascii("DuckFriends"), // (who made it: 11 letters)
      ...le32(0), // (no comments)
    ]),
    serial = (Math.random() * 2 ** 32) >>> 0,
    pages = [];
  let seq = 0;
  pages.push(page([opusHead], 0, 2, serial, seq++)); // (2: the first page)
  pages.push(page([tags], 0, 0, serial, seq++));
  const per = Math.round(1e6 / FRAME_US), // packets a page (about a second)
    each = (FRAME_US / 1e6) * 48000, // 48 kHz samples a packet
    last = preskip + Math.round((n / RATE) * 48000); // (the end: the decoder trims what the last packet adds past it)
  for (let i = 0; i < packets.length; i += per) {
    const some = packets.slice(i, i + per),
      end = i + per >= packets.length,
      granule = end ? last : preskip + (i + some.length) * each;
    pages.push(page(some, granule, end ? 4 : 0, serial, seq++)); // (4: the last page)
  }
  const out = new Uint8Array(pages.reduce((t, p) => t + p.length, 0));
  let at = 0;
  for (const p of pages) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
function opusHeadOf() {
  return new Uint8Array([
    ...ascii("OpusHead"),
    1, // version
    1, // channels
    PRESKIP & 255,
    PRESKIP >> 8,
    ...le32(RATE),
    0,
    0, // output gain
    0, // channel map: mono
  ]);
}
function page(packets, granule, flags, serial, seq) {
  const lace = [];
  for (const p of packets) {
    let l = p.length;
    while (l >= 255) {
      lace.push(255);
      l -= 255;
    }
    lace.push(l);
  }
  const size = packets.reduce((t, p) => t + p.length, 0),
    b = new Uint8Array(27 + lace.length + size),
    v = new DataView(b.buffer);
  b.set(ascii("OggS"), 0);
  b[5] = flags;
  v.setUint32(6, granule % 2 ** 32, true);
  v.setUint32(10, Math.floor(granule / 2 ** 32), true);
  v.setUint32(14, serial, true);
  v.setUint32(18, seq, true);
  b[26] = lace.length;
  b.set(lace, 27);
  let at = 27 + lace.length;
  for (const p of packets) {
    b.set(p, at);
    at += p.length;
  }
  v.setUint32(22, crc(b), true);
  return b;
}
let TABLE = null;
function crc(b) {
  if (!TABLE) {
    TABLE = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let r = i << 24;
      for (let k = 0; k < 8; k++)
        r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
      TABLE[i] = r >>> 0;
    }
  }
  let c = 0;
  for (const x of b) c = ((c << 8) ^ TABLE[((c >>> 24) ^ x) & 255]) >>> 0;
  return c;
}
const ascii = (t) => [...t].map((c) => c.charCodeAt(0)),
  le32 = (x) => [x & 255, (x >> 8) & 255, (x >> 16) & 255, (x >>> 24) & 255];
