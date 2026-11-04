/* ---------- End Cabin / Exit Cabin ----------
   A small vote button at the board's top left in Hangout ("End Cabin") and Quacky Zombies ("Exit Cabin"). A click votes, a
   click again takes the vote back (never Enter or E). Half of the people (not the computers) start a 10 second timer
   that shows on the button; fewer than half stops it. The rules are in js/rules.js (`cabinEnd`, `cabinOver`). */
import { cabinVotes, cabinNeeded, isHang } from "../rules.js";
import { isL4dd } from "../l4ddrules.js";

/* getR: () => the room; returns a function that takes the button away */
export function mountCabinEnd(S, getR) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn ghost cabin-end";
  b.onclick = () => {
    const R = getR();
    if (R) R.send({ t: "cabinEnd" });
  };
  S.append(b);
  const paint = () => {
    const R = getR();
    if (!R) return;
    const s = R.state,
      on =
        isHang(s) && s.phase === "hang" && !(R.state.players[R.me] || {}).bot,
      c = s.cabinEnd || {},
      left = c.at ? Math.max(0, Math.ceil((c.at - Date.now()) / 1000)) : 0,
      txt = `${isL4dd(s) ? "Exit Cabin" : "End Cabin"} ${cabinVotes(s)}/${cabinNeeded(s)}${c.at ? ` · ${left}s` : ""}`;
    b.hidden = !on;
    b.classList.toggle("on", !!(c.by || {})[R.me]);
    b.classList.toggle("ticking", !!c.at);
    b.setAttribute("aria-pressed", (c.by || {})[R.me] ? "true" : "false");
    if (b.textContent !== txt) b.textContent = txt;
  };
  paint();
  const t = setInterval(paint, 250);
  return () => {
    clearInterval(t);
    b.remove();
  };
}
