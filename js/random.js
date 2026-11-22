/* the two random helpers every mode's rules share: shuffle a list in place (Fisher-Yates) and take any one of a list */
export const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};
/* a steady number 0 … 0.999 from a text (a prop's id: the same drawing, and the same size, on every device) */
export const hash = (s) => {
  let h = 7;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((h >>> 0) % 1000) / 1000;
};
export const anyOf = (xs) => xs[Math.floor(Math.random() * xs.length)];
/* a damage as the weapons' tables write it: a number, or [lo, hi] for any whole number from lo to hi */
export const roll = (d) =>
  Array.isArray(d) ? d[0] + Math.floor(Math.random() * (d[1] - d[0] + 1)) : d;
