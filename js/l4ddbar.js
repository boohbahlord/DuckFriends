/* ---------- Quacky Zombies' weapons bar ----------
   Five slots, each in its own color (the owner's): the melee weapon (1, blue), two ranged weapons (2 and 3, red: the
   magazine and the rest, or how many are left), the special (4, purple; empty until the fireplace gives one) and the
   grenades (G, white: how many). Then the flashlight (0). The one in hand glows. On a computer the bar sits in the
   bottom bar's right corner (where the specials' keys go), my HP under it as green blocks; a click on a slot picks it.
   On a phone the slots are the specials' slider in the bottom middle, as in every mode (hotbar.js, l4Slider below), the
   purple switch right of it, and the aim-and-attack stick with the jump button above it (phonepad.js); my HP shows on
   my duck's green bar. */
import { ICONS, weaponIcon } from "./l4ddart.js";
import { ARMS, slotsOf, kitOf, SLOT_KINDS, weaponName } from "./l4ddrules.js";

/* what a slot says under it: the magazine and the rest, or how many are left */
const count = (w, m) => {
  if (!m) return "";
  if (w === "grenade") return String(m.g);
  const c = (m.am || {})[w];
  if (w === "jetpack" && c) return Math.ceil(c[0] / 1000) + "s"; // (its flight left, in seconds)
  if (!c || ARMS[w].all <= 1) return "";
  return ARMS[w].mag ? `${m.rw === w ? "…" : c[0]} | ${c[1]}` : String(c[0]);
};
/* a slot with nothing left in it (no grenades, a weapon out of ammo) */
const spent = (w, m) => {
  const c = m && (m.am || {})[w];
  return w === "grenade" ? !m || m.g <= 0 : !!c && c[0] + c[1] <= 0;
};
const out = (s, me) => {
  const p = (s.hang.l4p || {})[me] || {};
  return !!(p.dn || p.gh);
};

/* api: state() → the room's state, me() → my id, held() → the weapon in hand, pick(slot), grenade(), flash() */
export function mountL4Bar(S, api) {
  const row = document.createElement("div");
  row.className = "l4bar";
  let sig = "";
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
      next = JSON.stringify([m, held, off, out]);
    if (next === sig) return;
    sig = next;
    /* one slot: [key, the weapon (or "" when empty), its kind, what a press does] */
    const slots = [
      ...sl.map((w, i) => [String(i + 1), w, SLOT_KINDS[i], String(i)]),
      ["G", "grenade", "grenade", "grenade"],
      ["0", "fl", "light", "fl"],
    ];
    const slot = ([key, w, kind, does]) => {
      const n = w ? count(w, m) : "",
        empty = !w || spent(w, m),
        name = w === "fl" ? "Flashlight" : w ? weaponName(w) : "Special",
        icon = w === "fl" ? ICONS.flashlight(!off) : w ? weaponIcon(w) : "";
      const on =
        (w === "jetpack" && m && m.jp) || (w === "longjump" && m && m.lj); // (switched on: a green ring)
      return `<button type="button" class="l4s k-${kind}${w && w === held ? " sel" : ""}${empty ? " empty" : ""}${on ? " on" : ""}" data-l4w="${does}" aria-label="${name}${n ? ", " + n : ""}"${out || (!w && does !== "fl") ? " disabled" : ""}><i>${icon}</i><kbd>${key}</kbd>${n ? `<small>${n}</small>` : ""}</button>`;
    };
    /* (my HP isn't here any more: it's the red meter under the hotbar, hpmeter.js; owner 2026-11-04 03:16Z) */
    row.innerHTML = `<div class="l4slots">${slots.map(slot).join("")}</div>`;
  }
  const press = (e) => {
    const b = e.target.closest("[data-l4w]");
    if (!b || b.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const w = b.dataset.l4w;
    if (w === "grenade") api.grenade();
    else if (w === "fl") api.flash();
    else api.pick(+w);
    setTimeout(draw, 60);
  };
  row.addEventListener("click", press);
  return {
    row,
    refresh: draw,
    destroy() {
      row.remove();
    },
  };
}

/* ---------- phones: the slots in the specials' slider ----------
   The slider (hotbar.js) holds my five slots in the bar's order, each in its color (not the flashlight: on a phone it
   just stays on, one thing less to think of; the owner's, Nov 4). Sliding to the melee or a ranged weapon puts it in
   hand (it stays there, as on a computer), and sliding to the special puts the special in hand instead. The grenades
   don't change what's in hand: with them in the middle the attack stick throws one. The purple switch takes the
   special out of hand again (the weapon before it comes back); a weapon in hand can't be switched off, so it shows on
   and can't be pressed. A tap on the middle one: the special is used (the medkit), or a grenade is thrown at the
   nearest zombie.
   api: as mountL4Bar's, plus fire(w) (uses w where I aim), slot() → the slot in hand. Gives the slider's api. */
export function l4Slider(api) {
  const kit = () => {
    const s = api.state(),
      me = api.me();
    return s && s.hang && s.hang.l4
      ? { s, me, m: kitOf(s, me), sl: slotsOf(s, me) }
      : null;
  };
  const lightOff = (k) => !!(k.s.hang.l4f || {})[k.me];
  /* the key index of a slot: 0 to 3 the slots, 4 the grenades, 5 the flashlight */
  const keys = () => {
    const k = kit();
    if (!k) return [];
    return [...k.sl.map((w) => w || null), "grenade"];
  };
  const kindAt = (i) => SLOT_KINDS[i] || (i === 4 ? "grenade" : "light");
  const look = (id) => {
    const k = id && kit();
    if (!k) return null;
    const i = id === "grenade" ? 4 : id === "fl" ? 5 : k.sl.indexOf(id);
    if (i < 0) return null;
    return {
      id,
      name: id === "fl" ? "Flashlight" : weaponName(id),
      icon: id === "fl" ? ICONS.flashlight(!lightOff(k)) : weaponIcon(id),
      off: out(k.s, k.me) || (i < 5 && spent(id, k.m)),
      keep: i === 3 || i === 5,
      cls: `k-${kindAt(i)}`,
    };
  };
  return {
    keys,
    look,
    kept() {
      const k = kit(),
        on = new Set();
      if (!k) return on;
      const w = api.held();
      if (w) on.add(w);
      if (!lightOff(k)) on.add("fl");
      if (
        k.m &&
        ((k.m.lj && k.sl[3] === "longjump") ||
          (k.m.jp && k.sl[3] === "jetpack"))
      )
        on.add(k.sl[3]); // (switched on beside the weapon in hand)
      return on;
    },
    use(i, keep) {
      const k = kit();
      if (!k || out(k.s, k.me)) return;
      if (i === 5) api.flash();
      else if (i === 3 && keep) api.pick(3);
      else if (i === 3) api.fire(k.sl[3]);
      else if (i === 4 && !keep) api.grenade();
    },
    select(i) {
      const k = kit();
      if (i === 3 && k && ["longjump", "jetpack"].includes(k.sl[3])) return; // (sliding to them changes nothing: a tap or the switch turns them on or off)
      if (i < 3 || (i === 3 && api.slot() !== 3)) api.pick(i);
    },
    current: () => api.held() || null,
    cool: () => [],
    dots(id) {
      const k = id && kit(),
        n = k ? count(id === "fl" ? "" : id, k.m) : "";
      return n ? `<small class="sp-n">${n}</small>` : "";
    },
    sig() {
      const k = kit();
      return k ? JSON.stringify([k.m, lightOff(k), out(k.s, k.me)]) : "";
    },
  };
}
