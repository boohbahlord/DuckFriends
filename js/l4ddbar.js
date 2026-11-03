/* ---------- Left 4 Dead Ducks' weapons bar ----------
   Every duck has the knife (1), the pistol (2: its magazine and the rest of its bullets), the bow (3: its arrows), the
   grenades (G: how many) and the flashlight (0). The one in hand glows. On a computer the bar sits in the bottom bar's
   right corner (where the specials' keys go), my HP under it as three green blocks; a click on a slot picks it.
   On a phone it stands at the board's bottom right as a column of round buttons, with a big Attack button that uses
   what's in hand toward the nearest zombie I can see (l4dd.js l4TouchAim); my HP shows on my duck's green bar there. */
import { heldHTML } from "./specials.js";
import { ICONS } from "./l4ddart.js";
import { L4 } from "./l4ddrules.js";

const SLOTS = [
  ["knife", "1", "Knife"],
  ["handgun", "2", "Pistol"],
  ["bow", "3", "Bow"],
  ["grenade", "G", "Grenade"],
  ["fl", "0", "Flashlight"],
];
const ATTACK = `<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="9.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 1.6V8.4M15 21.6V28.4M1.6 15H8.4M21.6 15H28.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="15" cy="15" r="2.2" fill="currentColor"/></svg>`;

/* api: state() → the room's state, me() → my id, duck() → my duck's look, held() → the weapon in hand, pick(w),
   fire() (the Attack button), grenade(), flash() */
export function mountL4Bar(S, api) {
  const row = document.createElement("div");
  row.className = "l4bar";
  const pad = document.createElement("div");
  pad.className = "l4pad";
  let sig = "";
  const icon = (w, s) =>
    w === "bow"
      ? ICONS.bow
      : w === "fl"
        ? ICONS.flashlight(!((s.hang && s.hang.l4f) || {})[api.me()])
        : heldHTML(w, api.duck());
  const count = (w, m) =>
    !m
      ? ""
      : w === "handgun"
        ? `${m.rl ? "…" : m.m} | ${m.r}`
        : w === "bow"
          ? String(m.b)
          : w === "grenade"
            ? String(m.g)
            : "";
  function draw() {
    const s = api.state();
    if (!s || !s.hang || !s.hang.l4) return;
    const me = api.me(),
      m = (s.hang.l4a || {})[me],
      p = (s.hang.l4p || {})[me] || {},
      out = !!(p.dn || p.gh),
      held = api.held(),
      next = JSON.stringify([
        m,
        held,
        ((s.hang.l4f || {})[me] && 1) || 0,
        p.hp,
        out,
      ]);
    if (next === sig) return;
    sig = next;
    const slot = ([w, key, name], phone) => {
      const n = count(w, m),
        empty =
          (w === "handgun" && m && m.m + m.r <= 0) ||
          (w === "bow" && m && m.b <= 0) ||
          (w === "grenade" && m && m.g <= 0);
      return `<button type="button" class="l4s${w === held ? " sel" : ""}${empty ? " empty" : ""}" data-l4w="${w}" aria-label="${name}${n ? ", " + n : ""}"${out ? " disabled" : ""}><i>${icon(w, s)}</i>${phone ? "" : `<kbd>${key}</kbd>`}${n ? `<small>${n}</small>` : ""}</button>`;
    };
    const hp = Math.max(0, p.hp ?? L4.HP);
    row.innerHTML = `<div class="l4slots">${SLOTS.map((x) => slot(x, false)).join("")}</div><div class="l4hp" role="meter" aria-label="HP" aria-valuemin="0" aria-valuemax="${L4.HP}" aria-valuenow="${hp}">${Array.from({ length: L4.HP }, (_, i) => `<i${i < hp ? ' class="on"' : ""}></i>`).join("")}</div>`;
    pad.innerHTML = `${SLOTS.map((x) => slot(x, true)).join("")}<button type="button" class="l4s l4-attack" data-l4w="attack" aria-label="Attack"${out ? " disabled" : ""}><i>${ATTACK}</i></button>`;
  }
  const press = (e) => {
    const b = e.target.closest("[data-l4w]");
    if (!b || b.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const w = b.dataset.l4w;
    if (w === "attack") api.fire();
    else if (w === "grenade") api.grenade();
    else if (w === "fl") api.flash();
    else api.pick(w);
    setTimeout(draw, 60);
  };
  row.addEventListener("click", press);
  pad.addEventListener("pointerdown", press); // (a phone: at once, no waiting for the tap to end)
  pad.addEventListener("click", (e) => e.stopPropagation());
  const place = () => {
    const board = S.querySelector(".hang-board");
    if (board && pad.parentNode !== board) board.append(pad);
  };
  return {
    row,
    show() {},
    hide() {},
    wheel: () => false,
    refresh() {
      place();
      draw();
    },
    destroy() {
      row.remove();
      pad.remove();
    },
  };
}
