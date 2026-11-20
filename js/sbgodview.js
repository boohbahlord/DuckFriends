/* ---------- Sandbox: invisible players, on the screen (the owner's, Nov 19 23:17Z) ----------
   "to everyone else, they cannot see you or the weapons you hold or your flashlight or your laser sight or anything":
   no duck, weapon, name or bar of an invisible player shows to anyone else (their flashlight: l4dd.js; their laser sight
   only ever showed to themselves). Their own screen shows them see-through (game.js .see) */
import { invOn } from "./sbgod.js";

let style = null,
  last = "";
export function syncHidden(s, me) {
  const ids =
    s && s.sb && s.sb.gd
      ? Object.keys(s.sb.gd).filter((id) => id !== me && invOn(s, id))
      : [];
  const sig = ids.join(",");
  if (sig === last) return;
  last = sig;
  if (!ids.length) {
    if (style) style.remove();
    style = null;
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = "sb-hidden";
    document.head.append(style);
  }
  style.textContent = ids
    .map((id) => {
      const q = `[data-pid="${CSS.escape(id)}"]`;
      return `.gduck${q},.held${q},.hpo-one${q},.mgj-rv${q},.mgj-snack${q}`;
    })
    .join(",")
    .concat("{display:none!important}");
}
