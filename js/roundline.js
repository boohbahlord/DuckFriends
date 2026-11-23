/* Dead Ducks Arcade's round line, under my points at the top middle (the owner's, Nov 23 00:32Z): "Round N" fades in,
   stays 12 s once fully shown, then fades away; "Rest phase" stays till the next round starts, then fades out quick
   enough for the new "Round N" to fade in. The fading is on the line inside (.l4-rline, css/app.css): the box's own
   opacity is the UI opacity setting. roundLine(box) gives say(text) and reset() */
const FADE_MS = 400, // a line fading out, or in
  STAYS_MS = 12000; // "Round N", fully shown, before it fades away
export const REST = "Rest phase";
export function roundLine(box) {
  let said = "",
    t = 0;
  const show = (text) => {
    const el = document.createElement("span");
    el.className = "l4-rline";
    el.textContent = text;
    box().replaceChildren(el);
    void el.offsetWidth;
    el.classList.add("on");
    if (text !== REST)
      t = setTimeout(() => el.classList.add("gone"), FADE_MS + STAYS_MS);
  };
  return {
    say(text) {
      if (text === said || !box()) return;
      const line = said && box().querySelector(".l4-rline:not(.gone)");
      said = text;
      clearTimeout(t);
      if (!line) return show(text);
      line.classList.remove("on");
      t = setTimeout(() => box() && show(text), FADE_MS);
    },
    reset() {
      said = "";
      clearTimeout(t);
    },
  };
}
