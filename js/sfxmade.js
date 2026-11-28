/* ---------- the sounds made in code, not recorded (sound.js plays them as it plays the files) ----------
   Each is made once, at the clock's own rate, the first time it plays: name → (sample rate) → its samples. Every one
   starts and ends at silence and has no step anywhere in it (.claude/rules/sound.md; tools/clickcheck.js finds none). */

/* a smooth random number for every sample: white noise, the same each time it is made (a small fixed-seed generator) */
function noise(n, seed = 7) {
  const x = new Float32Array(n);
  let s = seed >>> 0;
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    x[i] = s / 2147483648 - 1;
  }
  return x;
}
/* the supply crate's helicopter (l4ddrules.js crateCome; we have no recording, so it's made here): its rotor's thump, a
   burst of dark noise HZ times a second over a low beat, coming in over RISE s, overhead as the crate falls, and gone
   over FALL s after; its beat a little faster coming and slower going (it passes). The crate lands HEAR ms in
   (gamedefaults.js DIRECTOR.CRATE) */
const HELI = {
  s: 7.5,
  rise: 4.5,
  top: 1.3,
  hz: [12, 15, 13],
  cut: [300, 900],
  beat: 70,
  peak: 0.5,
};
function heli(sr) {
  const H = HELI,
    n = Math.round(H.s * sr),
    w = noise(n),
    out = new Float32Array(n);
  let ph = 0,
    big = 0;
  const lo = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    const t = i / sr,
      near =
        t < H.rise
          ? 0.5 - 0.5 * Math.cos((Math.PI * t) / H.rise)
          : t < H.rise + H.top
            ? 1
            : 0.5 +
              0.5 *
                Math.cos(
                  (Math.PI * (t - H.rise - H.top)) / (H.s - H.rise - H.top),
                ), // (in, overhead, away: each a half cosine, so it never steps)
      coming = t < H.rise + H.top,
      hz = coming
        ? H.hz[0] + (H.hz[1] - H.hz[0]) * near
        : H.hz[2] + (H.hz[1] - H.hz[2]) * near,
      cut = H.cut[0] + (H.cut[1] - H.cut[0]) * near, // (nearer: brighter)
      k = 1 - Math.exp((-2 * Math.PI * cut) / sr);
    ph = (ph + hz / sr) % 1;
    const blade = 0.2 + 0.8 * (0.5 - 0.5 * Math.cos(2 * Math.PI * ph)) ** 2; // (each thump: a smooth swell over a hum, nothing sudden)
    let v = w[i];
    for (let j = 0; j < 4; j++) v = lo[j] += k * (v - lo[j]); // (the noise darkened four times over: no hiss to crackle)
    v = (v * 5 + 0.35 * Math.sin(2 * Math.PI * H.beat * t)) * blade * near;
    out[i] = v;
    big = Math.max(big, Math.abs(v));
  }
  const g = big ? H.peak / big : 0;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}
export const MADE = { heli };
