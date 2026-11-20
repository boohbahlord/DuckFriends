/* ---------- Quacky Zombies: the Butler's Items tab ----------
   Every item in this mode, each in its own category (melee, guns, specials, grenades, the drops and his upgrades): a
   row with its picture and name, and a tap or a click opens what it does and its numbers (the owner's, Nov 4). The
   numbers come from the rules (l4ddrules.js), so they stay right when the rules change. */
import {
  ARMS,
  BURN,
  POOL,
  WEAPONS,
  SLOT_ODDS,
  SLOT_BAGS,
  SHOP,
  DROPS,
  weaponName,
  dropName,
  kindOf,
  priceOf,
  BOX,
  WEAPON_BAGS,
  bagThings,
  merchantPrice,
  critOf,
  missOf,
  endless,
} from "./l4ddrules.js";
import { survOn } from "./survrules.js";
import { orbHTML, UP_ICONS } from "./l4ddart.js";
import { DROP_ICONS } from "./l4dddrops.js";

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
  shotgun: "A cone of pellets that doesn't fly far. No magazine.",
  sniper:
    "Each bullet goes through 3 zombies, 1 less damage to each after the first. A bolt action between shots.",
  smg: "Hold to fire. Fast, light bullets.",
  tommy: "Hold to fire. A 50-round drum.",
  ump: "Hold to fire. 2 damage a bullet, 7 a second.",
  ak: "Hold to fire. Harder hits.",
  lmg: "Hold to fire. A huge magazine.",
  dbarrel:
    "Two slugs. Each goes through zombie after zombie: 6 damage to the first, then 1 or 1.5 less to each one after.",
  dbuck: "Two shells of buckshot: the shotgun's pellets, each 1 or 1.5 harder.",
  flamer:
    "Hold to burn everything in front of you; the longer you hold, the farther it reaches. The ground burns and the fire spreads.",
  burst: "Three rounds a click, as hard as the AK-47.",
  laser:
    "Hold to fire. A red beam once a second through every zombie in its line. Never runs out, but six in a row overheat it for 8 seconds.",
  chaingun: "Hold to fire. Hits at once, and never reloads.",
  glauncher:
    "Its grenades fly straight and go off on the first zombie or wall they hit, and kill every zombie in the blast.",
  medkit:
    "Puts your HP back to full. Held while you revive someone, it gets them up at once.",
  defib:
    "Survival only. Hold it out by a dead player and press E: they're back up. They stack.",
  safekeep:
    "A halo, used once. When you go down it gets you up: E while down, or by itself when nobody else is standing, and 6 seconds nothing hurts you after. If you die instead, you come back with your upgrades.",
  zebra:
    "Thrown. Every zombie goes for it and bites it until it's gone. Justin's favorite.",
  adrenaline: "You walk at the game's usual speed for 20 seconds.",
  jetpack:
    "Each use turns it on or off. While it's on, Space flies. A Max Ammo fills it.",
  chair:
    "Justin's office chair, thrown the way you aim, as often as you like; it shoves what it hits.",
  grenade: "Thrown with G. Kills every zombie in its blast.",
  kill: "Every hit kills, for 45 seconds.",
  ammo: "Fills everyone's ammo and grenades (not the medkit).",
  nuke: "Kills every zombie on the map, and everyone gets the points.",
  speed: "Everyone walks faster for a minute.",
  double: "Double points for 45 seconds.",
  sale: "Half price at the merchant and the fireplace for 45 seconds (each upgrade once).",
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
          ? `${num(A.dmg[0] + (A.plus ? A.plus[0] : 0))} to ${num(A.dmg[1] + (A.plus ? A.plus[1] : 0))}` // (the buckshot double barrel's pellets: 1 or 1.5 more)
          : num(A.dmg),
    ]);
  if (w === "glauncher" || w === "grenade") out.push(["Damage", "Kills"]);
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
  if (critOf(w)) out.push(["Headshot", `${num(critOf(w) * 100, 1)}%`]);
  if (missOf(w)) out.push(["Misses", `${num(missOf(w) * 100, 1)}%`]);
  else if (w === "pan") out.push(["Misses", "50% of swings"]);
  if (A.pierce) out.push(["Goes through", `${A.pierce} zombies`]);
  if (w === "grenade") {
    out.push(["You start with", A.start]);
    out.push(["You can hold", A.most]);
  }
  if (A.kind === "special") {
    if (w === "jetpack") out.push(["Flight", secs(A.all)]);
    else if (A.round) out.push(["Uses", `${A.all} a round`]);
    else if (A.all) out.push(["Uses", A.all]);
    if (A.ms) out.push(["Lasts", secs(A.ms)]);
    if (A.dmg) out.push(["Damage", A.dmg]);
  }
  /* a merchant: the bow always, anything in the bags maybe (the owner's, Nov 18 13:46Z) */
  if (w === "bow") out.push(["Every merchant sells it", merchantPrice(w)]);
  else if (w === "defib")
    out.push(["A merchant may sell it", merchantPrice(w)]); // (DEFIB: his own roll)
  else if (
    [...Object.values(SLOT_BAGS), ...Object.values(WEAPON_BAGS)].some((b) =>
      bagThings(b).includes(w),
    )
  )
    out.push(["A merchant may sell it", merchantPrice(w)]);
  /* where the fireplace has it: its bag, and that bag's chance on a spin (l4ddrules.js fireRoll) */
  const bag = Object.keys(SLOT_BAGS).find((k) => SLOT_BAGS[k].includes(w));
  if (bag)
    out.push([
      "Where",
      `The fireplace, the ${bag === "chair" ? "golden chair" : bag} bag (${Math.round(SLOT_ODDS[bag] * 100)}% of spins)`,
    ]);
  else if (WEAPONS.includes(w) && POOL.includes(w))
    out.push(["Where", "The fireplace, the weapon bags (the rest of spins)"]);
  return out;
}

const row = (ic, name, say, list) =>
  `<li><details class="l4-cat-it"><summary><i class="l4-up-ic">${ic}</i><b>${name}</b></summary><div class="l4-cat-body"><p>${say}</p>${
    list.length
      ? `<dl>${list.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`
      : ""
  }</div></details></li>`;

const weaponRow = (w) => row(orbHTML(w), weaponName(w), SAY[w] || "", stats(w));

/* the whole tab: a heading and a list for each category */
export function catalogHTML() {
  const all = [...POOL, ...(survOn() ? ["defib"] : []), "grenade"], // (Survival: the defibrillator) // (no Jaime Bomb in the zombie modes any more: the owner's, Nov 18 12:19Z)
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
  return (
    cats
      .map(
        ([h, rows]) =>
          `<h4 class="l4-shop-h">${h}</h4><ul class="l4-cat">${rows.join("")}</ul>`,
      )
      .join("") +
    `<p class="l4-shop-key">A spin at the fireplace: ${BOX.price} points.</p>`
  );
}
