/* ---------- Low graphics ----------
   Settings, Performance: Graphics Normal or Low (Data saving and Poor connection turn Low on too). Low puts the class
   "low" on the page: nothing moving (as with Animations off), still map backgrounds, the cabin's ground at half its
   sharpness, no fireflies or light on the pool, and fewer bits flying in specials, confetti and splashes. */
const html = document.documentElement;
export const low = () => html.classList.contains("low");
/* how many of n bits to make (a third of them on Low) */
export const fewer = (n) => (low() ? Math.max(1, Math.round(n / 3)) : n);
