/* Click and pop finder for the game's made-on-the-spot sound (no build step: import it in a page or run it in node).
   A click is a sudden, short burst of very high sound: the wave jumps (a gain that steps, a note that starts or stops
   part way through its swing, a late note whose fade-in was skipped) and the jump splashes energy across every pitch,
   up where music has almost none. So: keep only the sound above 10 kHz, measure it every millisecond, and flag a moment
   that is far louder than the 0.4 s around it and loud enough to hear. Also counts clipped samples, DC offset (the wave
   sitting off center), NaN, and a recording that starts or ends away from silence.

     findClicks(samples, sampleRate, opts?) → { clicks: [{ t, db, over }], clipped, dc, nan, edge, worst }
       samples: a Float32Array (one channel) · t: seconds · db: the burst's loudness above 10 kHz (dBFS) · over: dB above
       the moment's surroundings. opts: { hz = 10000, over = 18, floor = -72, win = .4 }
     checkBuffer(audioBuffer, opts?) → the same, for every channel ({ ch, ...}) */

const hp = (x, sr, hz) => {   // two 2nd-order high-passes in a row (24 dB per octave), RBJ's recipe
  const w = 2 * Math.PI * hz / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2), a0 = 1 + al;
  const b0 = (1 + c) / 2 / a0, b1 = -(1 + c) / a0, a1 = -2 * c / a0, a2 = (1 - al) / a0;
  let y = x;
  for (let pass = 0; pass < 2; pass++) {
    const o = new Float32Array(y.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let n = 0; n < y.length; n++) { const v = y[n], r = b0 * v + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = r; o[n] = r; }
    y = o;
  }
  return y;
};
const db = v => 20 * Math.log10(Math.max(v, 1e-12));

export function findClicks(x, sr, { hz = 10000, over = 18, floor = -72, win = .4 } = {}) {
  let clipped = 0, nan = 0, sum = 0;
  for (let n = 0; n < x.length; n++) { const v = x[n]; if (v !== v) { nan++; continue; } if (Math.abs(v) >= .999) clipped++; sum += v; }
  const dc = sum / Math.max(1, x.length);
  const edge = Math.max(Math.abs(x[0] || 0), Math.abs(x[x.length - 1] || 0)) > 1e-3;
  const h = hp(x, sr, hz), F = Math.max(1, Math.round(sr / 1000)), nf = Math.floor(h.length / F);
  const e = new Float32Array(nf);   // the burst level each millisecond (RMS)
  for (let i = 0; i < nf; i++) { let s = 0; for (let k = i * F, z = k + F; k < z; k++) s += h[k] * h[k]; e[i] = Math.sqrt(s / F); }
  // the surroundings: the median of the 0.4 s around each moment (worked out every 10 ms)
  const half = Math.round(win * 500), step = 10, med = new Float32Array(Math.ceil(nf / step) + 1);
  for (let j = 0; j * step < nf; j++) {
    const a = Math.max(0, j * step - half), b = Math.min(nf, j * step + half), w = Array.from(e.subarray(a, b)).sort((p, q) => p - q);
    med[j] = w[w.length >> 1] || 0;
  }
  const clicks = []; let worst = null;
  for (let i = 0; i < nf; i++) {
    const lv = db(e[i]), rise = lv - db(med[Math.round(i / step)]);
    if (lv < floor || rise < over) continue;
    const t = i / 1000, last = clicks[clicks.length - 1];
    if (last && t - last.end < .005) { if (lv > last.db) { last.db = lv; last.over = rise; } last.end = t; continue; }
    clicks.push({ t, end: t, db: lv, over: rise });
  }
  for (const c of clicks) { delete c.end; c.t = +c.t.toFixed(3); c.db = +c.db.toFixed(1); c.over = +c.over.toFixed(1); if (!worst || c.db > worst.db) worst = c; }
  return { clicks, clipped, dc: +dc.toFixed(5), nan, edge, worst };
}

export function checkBuffer(buf, opts) {
  const out = [];
  for (let ch = 0; ch < buf.numberOfChannels; ch++) out.push({ ch, ...findClicks(buf.getChannelData(ch), buf.sampleRate, opts) });
  return out;
}
