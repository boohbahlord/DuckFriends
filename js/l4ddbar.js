/* ---------- Quacky Zombies' weapons bar ----------
   Five slots, each in its own color (the owner's): the melee weapon (1, blue), two ranged weapons (2 and 3, red: the
   magazine and the rest, or how many are left), the special (4, purple; empty until the fireplace gives one) and the
   grenades (5, white: how many). Then the flashlight (0). The one in hand glows. On a computer the bar sits in the
   bottom bar's right corner (where the specials' keys go), my HP under it as green blocks; a click on a slot picks it.
   On a phone the slots are the specials' slider in the bottom middle, as in every mode (hotbar.js, l4Slider below), the
   purple switch right of it, and the aim-and-attack stick with the jump button above it (phonepad.js); my HP shows on
   my duck's green bar. */
import { ICONS, weaponIcon } from "./l4ddart.js";
import { angelic } from "./powerart.js";
import { angelOf } from "./l4ddangel.js";
/* my duck's look (its pistol's colors) */
const duckOf = (s, me) => (s.players[me] || {}).duck;
/* an Angelic weapon's icon: Noah's look on a drawing; an emoji (the pistol's) gets the same glow and halo from css */
const holy = (icon) => {
  const a = angelic(icon);
  return a !== icon ? a : `<span class="l4-holy">${icon}</span>`;
};
import {
  ARMS,
  slotsOf,
  kitOf,
  SLOT_KINDS,
  weaponName,
  reloadOf,
  downArmed,
  tintOf,
  endless,
  slotFor,
  slotOfPick,
  pickOfSlot,
  durLeft,
} from "./l4ddrules.js";
import { now as clockNow } from "./clock.js";
import { sbNoLight } from "./sandboxrules.js";

/* what a slot says under it: the magazine and the rest, or how many are left */
const count = (w, m) => {
  if (!m) return "";
  if (w === "dg") return `${m.rw === "dg" ? "…" : m.dg} | ∞`; // (the down pistol: its bullets never run out)
  if (w === "grenade") return String(m.g);
  const c = (m.am || {})[w];
  if (endless(w)) return "∞"; // (the Laser Rifle never runs out, it only overheats; nor do the bow's arrows)
  if (w === "jetpack" && c) return Math.ceil(c[0] / 1000) + "s"; // (its flight left, in seconds)
  if (w === "defib" && c) return String(c[0]); // (they stack: how many I have)
  if (w === "flamer" && c)
    return Math.ceil((c[0] / ARMS.flamer.all) * 100) + "%"; // (its tank left)
  if (ARMS[w] && ARMS[w].kind === "melee" && ARMS[w].dur)
    return m.ang && m.ang[w]
      ? "∞"
      : Math.ceil((durLeft(m, w) / ARMS[w].dur) * 100) + "%"; // (a melee weapon's bar, in percent: it breaks at 0; Angelic: never)
  if (!c || ARMS[w].all <= 1) return "";
  return ARMS[w].mag ? `${m.rw === w ? "…" : c[0]} | ${c[1]}` : String(c[0]);
};
/* a slot with nothing left in it (no grenades, a weapon out of ammo) */
const spent = (w, m) => {
  const c = m && (m.am || {})[w];
  return w === "grenade" ? !m || m.g <= 0 : !!c && c[0] + c[1] <= 0;
};
/* a reload going on fills the weapon's box from the bottom with a darker color until it's done (the owner's, Nov 16):
   a CSS animation as long as the reload, started where it is now */
const reloadMeter = (s, me, w, m) => {
  const now = clockNow();
  if (!m || m.rw !== w || !(m.rl > now)) return "";
  const all = m.rt || reloadOf(s, me, w),
    gone = Math.max(0, all - (m.rl - now));
  return `<span class="l4s-rl" style="--rl:${Math.round(all)}ms;--rd:-${Math.round(gone)}ms" aria-hidden="true"></span>`;
};
/* the pick (game.js l4Pick: keys 1 to 6) of the slot the weapon I'm about to take would go to (api.to: l4dd.js l4To),
   -1 for none, and that weapon. That slot gets a ring (it stays with animations off) and a glow inside in the weapon's
   own color (the owner's, Nov 19 19:27Z) */
const toSlot = (s, me, api) => {
  const w = (api.to && api.to()) || "";
  return w ? [pickOfSlot(slotFor(s, me, w, api.held())), w] : [-1, ""];
};
const toGlow = (w) =>
  `<b class="l4to ${tintOf(w) || "c-plain"}" aria-hidden="true"></b>`;
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
      dark = sbNoLight(s, me), // (Sandbox: no flashlight till one is taken from loot)
      down = downArmed(s, me),
      [to, toW] = toSlot(s, me, api),
      next = JSON.stringify([m, held, off, out, down, dark, to, toW]);
    if (next === sig) return;
    sig = next;
    /* one slot: [key, the weapon (or "" when empty), its kind, what a press does]; down, only the down pistol (the
       owner's, Nov 17 11:07Z). The second item slot (Dead Ducks Arcade, Survival) comes after the grenades, key 6 */
    const one = (w, i) => [
        String(pickOfSlot(i) + 1),
        w,
        SLOT_KINDS[i],
        String(pickOfSlot(i)),
      ],
      slots = down
        ? [["", "handgun", "ranged", "dg"]]
        : [
            ...sl.slice(0, 4).map(one),
            ["5", "grenade", "grenade", "grenade"],
            ...sl.slice(4, 5).map((w) => one(w, 4)),
            ...(dark ? [] : [["0", "fl", "light", "fl"]]),
          ];
    if (down) {
      const n = count("dg", m);
      row.innerHTML = `<div class="l4slots"><button type="button" class="l4s k-ranged c-plain sel l4s-down" aria-label="Pistol, ${n}" disabled>${reloadMeter(s, me, "dg", m)}<i>${weaponIcon("handgun", duckOf(s, me))}</i><kbd>R</kbd><small>${n}</small></button></div>`;
      return;
    } // (R reloads it; it fires as the pistol always does)
    const slot = ([key, w, kind, does]) => {
      const n = w ? count(w, m) : "",
        empty = !w || spent(w, m),
        name = w === "fl" ? "Flashlight" : w ? weaponName(w) : "Special",
        icon =
          w === "fl"
            ? ICONS.flashlight(!off)
            : w && angelOf(s, me, w)
              ? holy(weaponIcon(w, duckOf(s, me))) // (Angelic: l4ddangel.js)
              : w
                ? weaponIcon(w, duckOf(s, me))
                : "";
      const on =
        (w === "jetpack" && m && m.jp) || (w === "longjump" && m && m.lj); // (switched on: a green ring)
      const tint = w && w !== "fl" ? tintOf(w, angelOf(s, me, w)) : ""; // (its own color: l4ddrules.js tintOf)
      const into = does === String(to); // (what I'm about to take goes here)
      return `<button type="button" class="l4s k-${kind}${tint ? " " + tint : ""}${w && w === held ? " sel" : ""}${empty ? " empty" : ""}${on ? " on" : ""}${into ? " l4s-to" : ""}" data-l4w="${does}" aria-label="${name}${n ? ", " + n : ""}"${out || (!w && does !== "fl") ? " disabled" : ""}>${w ? reloadMeter(s, me, w, m) : ""}${into ? toGlow(toW) : ""}<i>${icon}</i><kbd>${key}</kbd>${n ? `<small>${n}</small>` : ""}</button>`;
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
   The slider (hotbar.js) holds my slots in the bar's order (the second item after the grenades), each in its color (not the flashlight: on a phone it
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
  const lightOff = (k) => !!(k.s.hang.l4f || {})[k.me] || sbNoLight(k.s, k.me);
  /* the key index of a slot: its pick (0 to 3 the slots, 4 the grenades, 5 the second item), 6 the flashlight */
  const keys = () => {
    const k = kit();
    if (!k) return [];
    if (downArmed(k.s, k.me)) return ["handgun"]; // (down: only the down pistol)
    return [
      ...k.sl.slice(0, 4).map((w) => w || null),
      "grenade",
      ...k.sl.slice(4, 5).map((w) => w || null),
    ];
  };
  const kindAt = (i) =>
    i === 4 ? "grenade" : i === 6 ? "light" : SLOT_KINDS[slotOfPick(i)];
  const isItem = (i) => i === 3 || i === 5;
  const look = (id) => {
    const k = id && kit();
    if (!k) return null;
    if (downArmed(k.s, k.me))
      return id === "handgun"
        ? {
            id,
            name: weaponName("handgun"),
            icon: weaponIcon(id, duckOf(k.s, k.me)),
            off: false,
            keep: false,
            cls: "k-ranged c-plain",
          }
        : null; // (down: the down pistol, never Angelic; a plain slot, as the pistol's always is)
    const i =
      id === "grenade" ? 4 : id === "fl" ? 6 : pickOfSlot(k.sl.indexOf(id));
    if (i < 0) return null;
    return {
      id,
      name: id === "fl" ? "Flashlight" : weaponName(id),
      icon:
        id === "fl"
          ? ICONS.flashlight(!lightOff(k))
          : angelOf(k.s, k.me, id)
            ? holy(weaponIcon(id, duckOf(k.s, k.me)))
            : weaponIcon(id, duckOf(k.s, k.me)),
      off: out(k.s, k.me) || (i !== 6 && spent(id, k.m)),
      keep: isItem(i) || i === 6,
      cls: `k-${kindAt(i)}${id === "fl" ? "" : " " + tintOf(id, angelOf(k.s, k.me, id))}${i === toSlot(k.s, k.me, api)[0] ? " l4s-to" : ""}`.trim(), // (its own color; the ring where what I'm about to take goes)
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
      if (i === 6) api.flash();
      else if (isItem(i) && keep) api.pick(i);
      else if (isItem(i)) api.fire(k.sl[slotOfPick(i)]);
      else if (i === 4 && !keep) api.fire("grenade"); // (a tap on the grenades picked: one is thrown)
    },
    select(i) {
      const k = kit();
      if (k && downArmed(k.s, k.me)) return; // (down: nothing else to pick)
      if (
        isItem(i) &&
        k &&
        ["longjump", "jetpack"].includes(k.sl[slotOfPick(i)])
      )
        return; // (sliding to them changes nothing: a tap or the switch turns them on or off)
      if (i < 3 || (i >= 3 && api.slot() !== i)) api.pick(i); // (the one in the middle is the one picked, grenades too)
    },
    current: () => api.held() || null,
    cool: () => [],
    dots(id) {
      const k = id && kit(),
        w = k && downArmed(k.s, k.me) ? "dg" : id, // (down: the down pistol's bullets)
        n = k ? count(w === "fl" ? "" : w, k.m) : "";
      const [to, toW] = k ? toSlot(k.s, k.me, api) : [-1, ""];
      return (
        (k ? reloadMeter(k.s, k.me, w, k.m) : "") +
        (to >= 0 && k.sl[slotOfPick(to)] === id ? toGlow(toW) : "") +
        (n ? `<small class="sp-n">${n}</small>` : "")
      );
    },
    sig() {
      const k = kit();
      return k
        ? JSON.stringify([
            k.m,
            lightOff(k),
            out(k.s, k.me),
            toSlot(k.s, k.me, api),
          ])
        : "";
    },
  };
}
