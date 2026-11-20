/* ---------- Sandbox: songs players bring in (G's Music) ----------
   The owner's, Nov 20 18:46Z: "If we do allow music to be added, which I think we should, then it should be allowed to
   be in the shared games. And the music has to be compressed to the 32 bits automatically by something that takes the
   audio." An imported song is made small on the device that picks it, before anything is sent: one channel, 8,000
   samples a second, 4 bits a sample (IMA ADPCM), so 32 kbps, about 240 KB a minute, and 3 minutes at most. It goes to
   the room in parts as a picture does (sbspawn.js "song"), is kept in s.sbsong (so a save and a made game mode keep it,
   and a shared game mode carries it), and plays like the game's own songs, the same moment for everyone (music.js).
   No pops (CLAUDE.md): its level is set so it sits with the game's songs (never past 0.75), and its first and last
   20 ms fade from and to silence. */

export const SONG = {
  RATE: 8000, // (samples a second: with 4 bits each, 32 kbps)
  MOST_S: 180, // (3 minutes at most)
  FILE_MB: 60, // (the file picked, before it's made small)
  NAME: 40,
};
/* how long a song's text can be: 4 bits a sample, as base64 */
export const songChars = (secs) =>
  Math.ceil((Math.ceil((secs * SONG.RATE) / 2) * 4) / 3) + 64; // (and a little over: its seconds are rounded)

/* ---------- IMA ADPCM: each sample is 4 bits, the step to the next one ---------- */
const STEP = [
  7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
  50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230,
  253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963,
  1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327,
  3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442,
  11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794,
  32767,
];
const MOVE = [-1, -1, -1, -1, 2, 4, 6, 8];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
/* one step: the sample the code gives (the encoder works it out the same way, so the two never drift) */
function stepOf(st, code) {
  const step = STEP[st.i];
  let d = step >> 3;
  if (code & 4) d += step;
  if (code & 2) d += step >> 1;
  if (code & 1) d += step >> 2;
  st.p = clamp(st.p + (code & 8 ? -d : d), -32768, 32767);
  st.i = clamp(st.i + MOVE[code & 7], 0, 88);
  return st.p;
}
export function adpcmEncode(pcm) {
  const out = new Uint8Array(Math.ceil(pcm.length / 2)),
    st = { p: 0, i: 0 };
  for (let k = 0; k < pcm.length; k++) {
    const step = STEP[st.i];
    let diff = pcm[k] - st.p,
      code = 0;
    if (diff < 0) {
      code = 8;
      diff = -diff;
    }
    if (diff >= step) {
      code |= 4;
      diff -= step;
    }
    if (diff >= step >> 1) {
      code |= 2;
      diff -= step >> 1;
    }
    if (diff >= step >> 2) code |= 1;
    stepOf(st, code);
    out[k >> 1] |= k & 1 ? code << 4 : code;
  }
  return out;
}
export function adpcmDecode(bytes, n = bytes.length * 2) {
  const out = new Int16Array(n),
    st = { p: 0, i: 0 };
  for (let k = 0; k < n; k++)
    out[k] = stepOf(st, k & 1 ? bytes[k >> 1] >> 4 : bytes[k >> 1] & 15);
  return out;
}
const toB64 = (u8) => {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000)
    s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (t) => {
  const s = atob(t),
    u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
};

/* ---------- making a file small ----------
   file: what the player picked. on(p, words): how far along (0 to 1) for the green bar. Gives { n, l, d } (its name, its
   seconds, its text) or throws an Error with words for a toast */
const pause = () => new Promise((r) => setTimeout(r, 0));
const fail = (why) => Object.assign(new Error(why), { why });
export async function songFrom(file, on = () => {}) {
  if (!file) throw fail("No file picked.");
  if (file.size > SONG.FILE_MB * 1024 * 1024)
    throw fail(`That file is over ${SONG.FILE_MB} MB.`);
  on(0.02, "Reading");
  const raw = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onprogress = (e) =>
      e.lengthComputable && on((e.loaded / e.total) * 0.35);
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fail("That file couldn't be read."));
    fr.readAsArrayBuffer(file);
  });
  on(0.36, "Opening");
  const AC = window.AudioContext || window.webkitAudioContext,
    OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AC || !OAC) throw fail("This browser can't open sound files.");
  const ac = new OAC(1, 1, 44100);
  let buf;
  try {
    buf = await ac.decodeAudioData(raw);
  } catch (e) {
    throw fail("That isn't a sound file this browser can open.");
  }
  on(0.55, "Making it small");
  const secs = Math.min(SONG.MOST_S, buf.duration),
    n = Math.max(1, Math.floor(secs * SONG.RATE));
  /* one channel at 8,000 a second: the browser mixes and resamples it (with its own filter, so no hiss from above) */
  const oc = new OAC(1, n, SONG.RATE),
    src = oc.createBufferSource();
  src.buffer = buf;
  src.connect(oc.destination);
  src.start(0);
  const mono = (await oc.startRendering()).getChannelData(0);
  on(0.75);
  /* its level: about as loud as the game's songs (-18 dB on average), never past 0.75: 4 bits a step can overshoot a little */
  let peak = 0,
    sum = 0;
  for (let i = 0; i < n; i++) {
    const v = Math.abs(mono[i]);
    if (v > peak) peak = v;
    sum += mono[i] * mono[i];
  }
  const rms = Math.sqrt(sum / n);
  if (peak < 1e-4) throw fail("That file is silent.");
  const g = Math.min(0.75 / peak, 0.126 / Math.max(rms, 1e-6)),
    fade = Math.floor(SONG.RATE * 0.02),
    pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const f = Math.min(1, i / fade, (n - 1 - i) / fade); // (from silence, to silence)
    pcm[i] = clamp(Math.round(mono[i] * g * f * 32767), -32768, 32767);
    if (i % 200000 === 0) {
      on(0.75 + (i / n) * 0.1);
      await pause();
    }
  }
  on(0.88, "Packing");
  await pause();
  const d = toB64(adpcmEncode(pcm));
  on(0.97);
  const name =
    String(file.name || "My song")
      .replace(/\.[a-z0-9]{1,5}$/i, "")
      .replace(/[^\p{L}\p{N} .,'!?&()-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, SONG.NAME) || "My song";
  return { n: name, l: Math.round((n / SONG.RATE) * 100) / 100, d };
}

/* a song's samples, decoded; its first and last 20 ms faded again (4 bits a step can leave it a hair off silence at its
   end) and 50 ms of silence after, so it starts and ends at 0 */
export function songPcm(d, n) {
  const raw = adpcmDecode(fromB64(d), n),
    fade = Math.floor(SONG.RATE * 0.02),
    pcm = new Int16Array(n + Math.floor(SONG.RATE * 0.05));
  for (let i = 0; i < n; i++)
    pcm[i] = Math.round(raw[i] * Math.min(1, i / fade, (n - 1 - i) / fade));
  return pcm;
}
/* ---------- playing one ----------
   A song's text made into a WAV file the music's players can play (16 bits, one channel, 8,000 a second), once a song */
const URLS = new Map();
export function songUrl(key, e) {
  if (URLS.has(key)) return URLS.get(key);
  const n = Math.floor(e.l * SONG.RATE),
    pcm = songPcm(e.d, n),
    head = new DataView(new ArrayBuffer(44)),
    w = (o, t) =>
      [...t].forEach((c, i) => head.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  head.setUint32(4, 36 + pcm.length * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  head.setUint32(16, 16, true);
  head.setUint16(20, 1, true);
  head.setUint16(22, 1, true);
  head.setUint32(24, SONG.RATE, true);
  head.setUint32(28, SONG.RATE * 2, true);
  head.setUint16(32, 2, true);
  head.setUint16(34, 16, true);
  w(36, "data");
  head.setUint32(40, pcm.length * 2, true);
  const url = URL.createObjectURL(
    new Blob([head.buffer, pcm.buffer], { type: "audio/wav" }),
  );
  URLS.set(key, url);
  return url;
}
/* a song's key, as a picture's (FNV-1a over its text, and its length: sbspawn.js picKey) */
export function songKey(t) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + t.length.toString(36);
}
