/* ---------- Quacky Zombies' weapons bar ----------
   Five slots, each in its own color (the owner's): the melee weapon (1, blue), two ranged weapons (2 and 3, red: the
   magazine and the rest, or how many are left), the special (4, purple; empty until the fireplace gives one) and the
   grenades (G, white: how many). Then the flashlight (0). The one in hand glows. On a computer the bar sits in the
   bottom bar's right corner (where the specials' keys go), my HP under it as green blocks; a click on a slot picks it.
   On a phone it stands at the board's bottom right as a column of round buttons, with a big Attack button that uses
   what's in hand toward the nearest zombie I can see (l4dd.js l4TouchAim); my HP shows on my duck's green bar there. */
import { ICONS, weaponIcon } from "./l4ddart.js";
import {
  L4,
  ARMS,
  slotsOf,
  kitOf,
  maxHp,
  SLOT_KINDS,
  weaponName,
} from "./l4ddrules.js";

const ATTACK = `<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="9.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 1.6V8.4M15 21.6V28.4M1.6 15H8.4M21.6 15H28.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="15" cy="15" r="2.2" fill="currentColor"/></svg>`;

/* api: state() → the room's state, me() → my id, held() → the weapon in hand, pick(slot), fire() (the Attack button),
   grenade(), flash() */
export function mountL4Bar(S, api) {
  const row = document.createElement("div");
  row.className = "l4bar";
  const pad = document.createElement("div");
  pad.className = "l4pad";
  let sig = "";
  /* what a slot says under it: the magazine and the rest, or how many are left */
  const count = (w, m) => {
    if (!m) return "";
    if (w === "grenade") return String(m.g);
    const c = (m.am || {})[w];
    if (!c || ARMS[w].all <= 1) return "";
    return ARMS[w].mag ? `${m.rw === w ? "…" : c[0]} | ${c[1]}` : String(c[0]);
  };
  function draw() {
    const s = api.state();
    if (!s || !s.hang || !s.hang.l4) return;
    const me = api.me(),
      m = kitOf(s, me),
      sl = slotsOf(s, me),
      p = (s.hang.l4p || {})[me] || {},
      out = !!(p.dn || p.gh),
      held = api.held(),
      off = !!(s.hang.l4f || {})[me],
      most = maxHp(s, me),
      next = JSON.stringify([m, held, off, p.hp, most, out]);
    if (next === sig) return;
    sig = next;
    /* one slot: [key, the weapon (or "" when empty), its kind, what a press does] */
    const slots = [
      ...sl.map((w, i) => [String(i + 1), w, SLOT_KINDS[i], String(i)]),
      ["G", "grenade", "grenade", "grenade"],
      ["0", "fl", "light", "fl"],
    ];
    const slot = ([key, w, kind, does], phone) => {
      const n = w ? count(w, m) : "",
        c = m && (m.am || {})[w],
        empty =
          !w || (w === "grenade" ? !m || m.g <= 0 : !!c && c[0] + c[1] <= 0),
        name = w === "fl" ? "Flashlight" : w ? weaponName(w) : "Special",
        icon = w === "fl" ? ICONS.flashlight(!off) : w ? weaponIcon(w) : "";
      return `<button type="button" class="l4s k-${kind}${w && w === held ? " sel" : ""}${empty ? " empty" : ""}" data-l4w="${does}" aria-label="${name}${n ? ", " + n : ""}"${out || (!w && does !== "fl") ? " disabled" : ""}><i>${icon}</i>${phone ? "" : `<kbd>${key}</kbd>`}${n ? `<small>${n}</small>` : ""}</button>`;
    };
    const hp = Math.max(0, p.hp ?? L4.HP);
    row.innerHTML = `<div class="l4slots">${slots.map((x) => slot(x, false)).join("")}</div><div class="l4hp" role="meter" aria-label="HP" aria-valuemin="0" aria-valuemax="${most}" aria-valuenow="${hp}">${Array.from({ length: most }, (_, i) => `<i${i < hp ? ' class="on"' : ""}></i>`).join("")}</div>`;
    pad.innerHTML = `${slots
      .filter(([, w, kind]) => w || kind !== "special")
      .map((x) => slot(x, true))
      .join(
        "",
      )}<button type="button" class="l4s l4-attack" data-l4w="attack" aria-label="Attack"${out ? " disabled" : ""}><i>${ATTACK}</i></button>`; // (a phone: the empty special slot isn't shown)
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
    else api.pick(+w);
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
