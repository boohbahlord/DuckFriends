/* the two random helpers every mode's rules share: shuffle a list in place (Fisher-Yates) and take any one of a list */
export const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};
export const anyOf = (xs) => xs[Math.floor(Math.random() * xs.length)];
