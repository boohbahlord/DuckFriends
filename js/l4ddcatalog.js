/* ---------- Quacky Zombies: the Butler's Items tab ----------
   Every item in this mode, each in its own category (melee, guns, specials, grenades, the drops and his upgrades): a
   row with its picture and name, and a tap or a click opens what it does and its numbers (the owner's, Nov 4). The
   numbers come from the rules (l4ddrules.js), so they stay right when the rules change. */
import {
  BURN,
  SLOT_BAGS,
  SHOP,
  DROPS,
  weaponName,
  dropName,
  priceOf,
  WEAPON_BAGS,
  merchantPrice,
  missOf,
} from "./l4ddrules.js";
import { endless } from "./ammo.js";
import {
  ARMS,
  kindOf,
  POOL,
  critOf,
  recoilOf,
  recoilWord,
  caliberOf,
  barrelOf,
} from "./guns.js";
import { orbHTML, UP_ICONS } from "./l4ddart.js";
import { DROP_ICONS } from "./l4dddrops.js";
import { draws } from "./bowdraw.js";

/* what each one does, in a line */
const SAY = {
  knife: "Quick stabs up close.",
  hammer: "A slow, heavy swing that hits a wide spot.",
  axe: "A big swing, a little faster than the hammer: 1 to 4 damage.",
  sword: "Short, quick swings, faster than the knife.",
  pan: "Misses half the time, but half its hits are headshots.",
  handgun: "The gun you start with.",
  revolver: "Five big shots, three a second, then a reload.",
  bow: "Arrows that never run out, one at a time.",
  dagger: "Thrown. It falls to the floor after.",
  shotgun:
    "A cone of pellets that doesn't fly far. A tube of 8 shells, loaded one at a time.",
  sniper:
    "Each bullet goes through 3 zombies, 1 less damage to each after the first. A bolt action between shots.",
  smg: "Hold to fire. Fast, light bullets.",
  tommy: "Hold to fire. A 50-round drum.",
  ump: "Hold to fire. 2 damage a bullet, 7 a second.",
  ak: "Hold to fire. Harder hits.",
  lmg: "Hold to fire. A huge magazine.",
  dbarrel:
    "Two slugs. Each goes through zombie after zombie: 6 damage to the first, then 1 or 1.5 less to each one after.",
  flamer:
    "Hold to burn everything in front of you; the longer you hold, the farther it reaches. The ground burns and the fire spreads.",
  burst: "Three rounds a click, as hard as the AK-47.",
  laser:
    "Hold to fire. A red beam once a second through every zombie in its line. Never runs out, but six in a row overheat it for 8 seconds.",
  glauncher:
    "Its grenades fly straight and go off on the first zombie or wall they hit, and kill every zombie in the blast.",
  medkit:
    "Puts your HP back to full. Held while you revive someone, it gets them up at once.",
  bandage: "Gives back half the HP you've lost, at least 1. You can hold one.",
  safekeep:
    "A halo, used once. When you go down it gets you up: E while down, or by itself when nobody else is standing, and 6 seconds nothing hurts you after. If you die instead, you come back with your upgrades.",
  zebra:
    "Thrown. Every zombie goes for it and bites it until it's gone. Justin's favorite.",
  adrenaline: "You walk at the game's usual speed for 20 seconds.",
  grenade: "Thrown with G. Kills every zombie in its blast.",
  kill: "Every hit kills, for 45 seconds.",
  ammo: "Fills everyone's ammo and grenades (not the medkit).",
  nuke: "Kills every zombie on the map, and everyone gets the points.",
  speed: "Everyone walks faster for a minute.",
  double: "Double points for 45 seconds.",
  sale: "Half price at the merchant for 45 seconds (each upgrade once).",
};

/* a number without its trailing zeros (1.75, 5, 0.4) */
const num = (n, d = 2) => String(+n.toFixed(d));
const secs = (ms) => `${num(ms / 1000, 1)} s`;

/* a weapon's numbers, as rows of [name, value] */
function stats(w) {
  const A = ARMS[w] || {},
    out = [];
  if (A.dmg !== undefined)
    out.push([
      "Damage",
      A.dmg >= 99 || A.dmg === "all"
        ? "Kills"
        : Array.isArray(A.dmg)
          ? `${num(A.dmg[0])} to ${num(A.dmg[1])}`
          : num(A.dmg),
    ]);
  if (w === "glauncher" || w === "grenade") out.push(["Damage", "Kills"]);
  if (caliberOf(w)) out.push(["Caliber", caliberOf(w)]);
  if (barrelOf(w)) out.push(["Barrel", barrelOf(w)]);
  if (A.kind === "ranged" || A.kind === "grenade")
    out.push(["Recoil", recoilWord(recoilOf(w))]); // (K14: "none" for what has no recoil)
  if (A.pellets) out.push(["Pellets", A.pellets]);
  if (A.cool && A.kind !== "special" && w !== "flamer")
    out.push(["Rate", `${num(1000 / A.cool, 1)} a second`]);
  if (A.mag) out.push(["Magazine", A.mag]);
  if (A.kind === "ranged" && A.all && w !== "flamer") out.push(["Ammo", A.all]);
  else if (endless(w)) out.push(["Ammo", "Unlimited"]);
  if (A.reload) out.push(["Reload", secs(A.reload)]);
  if (A.shell) out.push(["Reload", `${secs(A.shell)} a shell`]);
  if (A.burst) out.push(["Burst", `${A.burst} rounds`]);
  if (w === "flamer") {
    out.push(["Tank", `${num((1000 / A.cool / A.all) * 100)}% a second`]);
    out.push(["Burns", `1 every ${secs(BURN.EVERY)} for ${secs(BURN.Z)}`]);
  }
  if (draws(w))
    out.push(["Crit", "Up to 100%, drawn"]); // (bowdraw.js drawCrit)
  else if (critOf(w)) out.push(["Crit", `${num(critOf(w) * 100, 1)}%`]);
  if (missOf(w)) out.push(["Misses", `${num(missOf(w) * 100, 1)}%`]);
  else if (w === "pan") out.push(["Misses", "50% of swings"]);
  if (A.pierce) out.push(["Goes through", `${A.pierce} zombies`]);
  if (w === "grenade") {
    out.push(["You start with", A.start]);
    out.push(["You can hold", A.most]);
  }
  if (A.kind === "special") {
    if (A.all) out.push(["Uses", A.all]);
    if (A.ms) out.push(["Lasts", secs(A.ms)]);
    if (A.dmg) out.push(["Damage", A.dmg]);
  }
  /* a merchant: the bow always, anything in the bags maybe (the owner's, Nov 18 13:46Z) */
  if (w === "bow") out.push(["Every merchant sells it", merchantPrice(w)]);
  else if (
    [...Object.values(SLOT_BAGS), ...Object.values(WEAPON_BAGS)].some((b) =>
      b.includes(w),
    )
  )
    out.push(["A merchant may sell it", merchantPrice(w)]);
  return out;
}

const row = (ic, name, say, list, item = "") =>
  `<li${item ? ` data-item="${item}"` : ""}><details class="l4-cat-it"><summary><i class="l4-up-ic">${ic}</i><b>${name}</b></summary><div class="l4-cat-body"><p>${say}</p>${
    list.length
      ? `<dl>${list.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`
      : ""
  }</div></details></li>`;

const weaponRow = (w) =>
  row(orbHTML(w), weaponName(w), SAY[w] || "", stats(w), w);
/* what one does, in a line (a game message as it's switched to: l4ddbar.js) */
export const noteOf = (w) => SAY[w] || "";
/* a weapon's numbers in one line for the merchant's list: damage, rate, caliber and barrel, and its recoil as a word (only a gun that has recoil) */
export const statLineOf = (w) => {
  const m = Object.fromEntries(stats(w));
  return [
    m.Damage && `Damage ${m.Damage}`,
    m.Rate,
    m.Caliber &&
      [m.Caliber, m.Barrel && `${m.Barrel} barrel`].filter(Boolean).join(", "),
    m.Recoil && `Recoil ${m.Recoil}`,
  ]
    .filter(Boolean)
    .join(" · ");
};
/* an item's card, the popup held I shows over it: its name, what it does and its numbers (the same rows as the Items tab) */
export const itemCardHTML = (w) =>
  ARMS[w] || w === "grenade"
    ? `<b class="itip-name">${weaponName(w)}</b><p>${SAY[w] || ""}</p>${(() => {
        const list = stats(w);
        return list.length
          ? `<dl>${list.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`
          : "";
      })()}`
    : "";

/* the whole tab: a heading and a list for each category */
export function catalogHTML() {
  const all = [...POOL, "grenade"],
    of = (k) => all.filter((w) => kindOf(w) === k);
  const cats = [
    ["Melee", of("melee").map(weaponRow)],
    ["Guns", of("ranged").map(weaponRow)],
    ["Specials", of("special").map(weaponRow)],
    ["Grenades", of("grenade").map(weaponRow)],
    [
      "Drops",
      DROPS.map((k) =>
        row(
          `<span class="l4-cat-drop">${DROP_ICONS[k] || ""}</span>`,
          dropName(k),
          SAY[k] || "",
          [],
        ),
      ),
    ],
    [
      "Upgrades",
      SHOP.map((it) =>
        row(UP_ICONS[it.id], it.name, it.what, [
          ["Most", isFinite(it.most) ? it.most : "No limit"],
          [
            it.most > 1 ? "Prices" : "Price",
            Array.from({ length: isFinite(it.most) ? it.most : 3 }, (_, n) =>
              priceOf(it.id, n),
            ).join(", ") + (isFinite(it.most) ? "" : ", …"),
          ],
        ]),
      ),
    ],
  ];
  return cats
    .map(
      ([h, rows]) =>
        `<h4 class="l4-shop-h">${h}</h4><ul class="l4-cat">${rows.join("")}</ul>`,
    )
    .join("");
}
