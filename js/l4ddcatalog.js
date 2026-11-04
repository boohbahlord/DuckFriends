/* ---------- Quacky Zombies: the Butler's Items tab ----------
   Every item in this mode, each in its own category (melee, guns, specials, grenades, the drops and his upgrades): a
   row with its picture and name, and a tap or a click opens what it does and its numbers (the owner's, Nov 4). The
   numbers come from the rules (l4ddrules.js), so they stay right when the rules change. */
import {
  ARMS,
  POOL,
  SHOP,
  GUN_SHOP,
  DROPS,
  weaponName,
  dropName,
  kindOf,
  priceOf,
  buyPrice,
  BOX,
} from "./l4ddrules.js";
import { BOMB } from "./jaimebomb.js";
import { orbHTML, UP_ICONS } from "./l4ddart.js";
import { DROP_ICONS } from "./l4dddrops.js";

/* what each one does, in a line */
const SAY = {
  knife: "Quick stabs up close.",
  hammer: "A slow, heavy swing that hits a wide spot.",
  handgun: "The gun you start with.",
  revolver: "Five big shots, then a reload.",
  bow: "Lots of arrows, one at a time.",
  dagger: "Thrown. It falls to the floor after.",
  shotgun: "A cone of pellets that doesn't fly far. No magazine.",
  sniper: "Each bullet goes through 3 zombies. A bolt action between shots.",
  smg: "Hold to fire. Fast, light bullets.",
  ak: "Hold to fire. Harder hits.",
  lmg: "Hold to fire. A huge magazine.",
  chaingun: "Hold to fire. Kills whatever it hits, and never reloads.",
  glauncher:
    "Its grenades fly straight and go off on the first zombie or wall they hit, and kill every zombie in the blast.",
  medkit: "Puts your HP back to full.",
  zebra:
    "Thrown. Every zombie goes for it and bites it until it's gone. Justin's favorite.",
  fireball: "Sets the zombie it hits on fire.",
  adrenaline: "You walk at the game's usual speed for 20 seconds.",
  longjump: "Each use turns long jumps on or off.",
  jaime:
    "Jaime runs at the nearest zombie and stabs it until one gets him. Back each round.",
  jaimebomb: "As Jaime, but he carries a bomb that goes off where he is.",
  jetpack:
    "Each use turns it on or off. While it's on, Space flies. A Max Ammo fills it.",
  chair:
    "Justin's office chair, thrown the way you aim. A Max Ammo gives the throws back.",
  grenade: "Thrown with G. Kills every zombie in its blast.",
  kill: "Every hit kills, for a minute.",
  ammo: "Fills everyone's ammo and grenades (not the medkit or Jaime).",
  nuke: "Kills every zombie on the map, and everyone gets the points.",
  speed: "Everyone walks faster for a minute.",
  double: "Double points for a minute.",
  sale: "Half price at the Butler and the fireplace for the rest of the round (each upgrade once).",
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
      A.dmg >= 99
        ? "Kills"
        : Array.isArray(A.dmg)
          ? `${A.dmg[0]} to ${A.dmg[1]}`
          : num(A.dmg),
    ]);
  if (w === "glauncher" || w === "grenade") out.push(["Damage", "Kills"]);
  if (A.pellets) out.push(["Pellets", A.pellets]);
  if (A.cool && A.kind !== "special")
    out.push(["Rate", `${num(1000 / A.cool, 1)} a second`]);
  if (A.mag) out.push(["Magazine", A.mag]);
  if (A.kind === "ranged" && A.all) out.push(["Ammo", A.all]);
  if (A.reload) out.push(["Reload", secs(A.reload)]);
  if (A.crit) out.push(["Headshot", `${num(A.crit * 100)}%`]);
  if (A.pierce) out.push(["Goes through", `${A.pierce} zombies`]);
  if (w === "grenade") {
    out.push(["You start with", A.start]);
    out.push(["You can hold", A.most]);
  }
  if (A.kind === "special") {
    if (w === "jetpack") out.push(["Flight", secs(A.all)]);
    else if (A.round) out.push(["Uses", `${A.all} a round`]);
    else if (A.all && w !== "longjump") out.push(["Uses", A.all]);
    if (A.ms) out.push(["Lasts", secs(A.ms)]);
    if (A.dmg) out.push(["Damage", A.dmg]);
  }
  if (w === "jaimebomb") out.push(["Blast", `${num(BOMB.wide)}x a grenade's`]);
  if (GUN_SHOP.includes(w)) out.push(["The Butler sells it", buyPrice(w)]);
  else if (POOL.includes(w)) out.push(["Where", "The fireplace"]);
  else if (w === "jaimebomb")
    out.push([
      "Where",
      `The fireplace, 1 spin in ${Math.round(1 / BOMB.fire)}`,
    ]);
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
  const all = [...POOL, "jaimebomb", "grenade"],
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
          ["Most", it.most],
          [
            it.most > 1 ? "Prices" : "Price",
            Array.from({ length: it.most }, (_, n) => priceOf(it.id, n)).join(
              ", ",
            ),
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
