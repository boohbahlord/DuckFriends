/* ---------- the rules of Quacky Zombies ----------
   A zombie mode on Duck Cabin (the owner's, Nov 3). The power is cut and the outside can't be reached: only the cabin
   and the deck (the owner's balcony) are played on. Slow green ducks with X eyes come in at the front door, up the
   deck's stairs (boarded at the top) and through holes in the walls, round after round without end, each after the
   nearest duck by walking distance. Everyone has 3 HP, the knife, the pistol, the bow and 2 grenades; a duck at 0 HP is
   down until a teammate holds E by it for 10 seconds, or it bleeds out and walks as a ghost until the next round. The
   game ends when nobody is left standing. The host runs it all (this file); every screen draws it (l4dd.js).
   Points (the owner's): 50 to start, 5 for each point of damage to a zombie, 25 for a headshot (a crit that kills), 10
   for each board put up (50 a round at most). They buy upgrades from Justin's Butler, who stands by the card table, and
   a weapon at the fireplace (210: it flickers through the weapons, then lands on one only the payer can take). Each duck
   has five slots: one melee, two ranged, one special and the grenades.

   It is Duck Cabin's world (rules.js' isHang is true for it too), with only the activities it keeps (keepOnly below),
   and its own rule 'l4'. s.hang, each key online as its own string (so the zombies walking never send the boards again):
     l4   { r: round, t0: when its zombies start coming (the round's "Round N" shows BREAK before), n: zombies in it,
            made: how many came so far, owe: held back while the board is full, acc, sec: the spawning's clock, next:
            the next zombie's number, over: { at, r } once nobody is standing, bp: { "id opening": points for boards there this round } }
     zp   [i, x, y, k, i, x, y, k, …]: every zombie's spot in world px (whole numbers) and k = hp · 16 + st (st 0 coming,
          1 tearing the boards, 4 climbing in, 2 in, 3 dead; Downpour: 5 over the fence, 6 up a wall onto a roof, 7 on a
          roof, 8 jumping onto the canopy), sent every heartbeat
     zs   { i: [a, dir] }: a zombie's last swipe (ms since t0) and its way (1/100 radians), only for one that swiped
     (the host keeps the rest to itself, in s.hidden, which never goes online: l4z { i: [n, d, { cm, k, fl, wp, j }] }, n since when it's at a
     duck (0: not), d its tear clock (st 1) or when it died (st 3); l4tk its last heartbeat)
     zw   { i: "B3c1…" }: the wounds hits left on a zombie, two letters each (wound(), wounds.js hitsOf)
     zl   { i: [max hp, speed (px a second at the Normal Walking speed), opening, size, build, hat, outfit] }: set once, when it comes
     brd  { opening: boards up, 0 … BOARDS }
     l4p  { id: { hp, at (its last hit or heal), dn (down: bleeds out then), rv: { by, at } (being revived), gh (a ghost
          this round) } }
     l4a  { id: { sl: [melee, ranged, ranged, special] (weapon ids, "" for an empty slot), am: { weapon: [in the
          magazine (or all of it, without one), the rest] }, rl: when a reload ends (0: none), rw: the weapon reloading,
          g: grenades, u: { weapon: when last used } } }
     l4pt { id: points }
     l4u  { id: { acc, as, hp, sp, rl } }: the upgrades bought (accuracy, attack speed, max HP, speed, faster reload)
     l4box { id: { by, t, w } }: the fireplace's weapons, one for each duck that paid (at t), landing on w after BOX.spin
     (each duck's fireplace bags are the host's only: s.hidden.l4sb, fireRoll)
     l4b  { id: { o, at } }: who is boarding up which opening, since when (one more board each BOARD_MS)
     l4f  { id: 1 }: flashlights switched off (key 0; nothing else happens, it's only a choice)
     l4k  [{ by, w, dx, dy, t, hit }]: melee weapons mid-swing (each hurts a zombie once, only for its swing's ms) */
import {
  GATE_BREEDS,
  waiting,
  heldBack,
  roundsOf,
  afterShots,
  shotKind,
  coneOf,
  roundAt,
  flyShots,
  swingOn,
  swinging,
  swingMisses,
  knockOf,
  KNOCK_DUCK,
} from "./weaponuse.js";
import {
  ARMS,
  kindOf,
  GUN_NAMES,
  WEAPONS,
  rollDmg,
  critOf,
  START_WEAR,
  loadTo,
} from "./guns.js";
import { JUMP, jumpDodges } from "./jump.js";
import { SPRINT as GAME_SPRINT, POCKET_CHANGE } from "./gamedefaults.js";
import { hpHeal, hpHurt, hundredths, hpBreed, regenOf } from "./hpmath.js";
import {
  baseMode,
  isSb,
  sbPlayerSpot,
  SB_BACK_MS,
  sbRule,
  sbZombieWall,
  sbItemMods,
} from "./sandboxrules.js";
import { godOn, godHas } from "./sbgod.js";

import { rule, keepOnly } from "./hangout/registry.js";
import {
  W,
  H,
  CABIN,
  DECK,
  STAIRS,
  STEP,
  inCabin,
  inDeck,
  heightAt,
  slabBetween,
  whereIn,
  standable,
  solidsAt,
  onPlatform,
  BJ,
  layoutRev,
  wetK,
  layoutVariant,
  deckAt,
  floorH,
} from "./hangout/layout.js";
import * as GS from "./hangout/stationmap.js";
import {
  GRENADE_MS,
  daggerZ,
  inWorld,
  FASTER,
  shareOf,
  say,
  shovePx,
} from "./rules.js";
import { JUSTIN, ETHAN, jerseyOf } from "./hangout/npcart.js";
import { MERCHANTS, merchantById, merchantLook } from "./merchants.js";
import { linesOf } from "./merchantlines.js";
import { invuln } from "./hangout/death.js";
import { hOk, hLock, shotFeet, SAME_FLOOR, zOf, swingH } from "./heights.js";
import { toPx, DUCK } from "./units.js";
import { blast, reach, hitOf, REACH } from "./blast.js";
import { carsBlast, carsSwing } from "./carpush.js";
import { pushAlong, walkOf, pushTaken, immobile, sizeOf } from "./push.js";
import { FLAME, flameReach, inCone } from "./flamer.js";
import {
  hitWounds,
  WOUND_BREEDS,
  pwHit,
  pwAdd,
  explodedLook,
  DEATH,
} from "./wounds.js";
/* a line in the chat (as rules.js' logLine) */
function logIn(s, line) {
  if (!s.log) return;
  s.logN = (s.logN || 0) + 1;
  s.log = [...s.log.slice(-199), { n: s.logN, t: Date.now(), ...line }];
}
import {
  GOD_LINES,
  E_LINES,
  DEATH_LINES,
  SAY_EVERY,
  GOD_EVERY,
} from "./hangout/justin.js";
import {
  powerSetUp,
  powerRound,
  powerTick,
  powerAct,
  powerPump,
  powerGas,
  isPw,
  pwName,
} from "./l4ddpower.js";
import { ANGEL, angelOf, angelAmmo, angelAct, angelLeft } from "./l4ddangel.js";

import { NPC_RUN } from "./npcshared.js";
import { sees as npcSees, shotMark } from "./npcrules.js";
import { grHp, grCool } from "./sbgroups.js";
import {
  isSurv,
  survOn,
  SV,
  survStart,
  survTick,
  wholeIn,
} from "./survrules.js";
import {
  GW,
  GH,
  setGrid,
  walk,
  mid,
  cells,
  openNear,
  flowFrom,
  heading,
} from "./zombiepath.js";
import { CELL } from "./walkgrid.js";
import { chairReach } from "./chair.js";
import {
  zOk,
  Z_MOST,
  room,
  zombies,
  store,
  minus,
  newZombie,
  roadEnd,
  fenceSpot,
  zombieAt,
  moveZombies,
  STATION,
  zFloor,
  duckFloor,
  boardsAhead,
  walkTo,
  setZWall,
  stepZombie,
  walkable,
  clearShot,
} from "./zombies.js";

/* what Sandbox lends these rules (sbcabin.js): npc(s, by, x, y, now, w, rx, ry, from, hit) puts a shot or a swing at
   (x, y) into its NPCs there (hit: a swing's list, each in reach once; none: a shot, the first, true if it landed) */
export const L4_HOOKS = { npc: null, gm: null }; // (gm: Survival's gunmen, gunmenrules.js: { tick, shot, blast, fire, near, claw })
export const isL4dd = (s) => !!s && baseMode(s.options) === "l4dd"; // (and Sandbox on its cabin or Downpour: sandboxrules.js)
/* I want only the lights' stutter, the air (the wind, the rain, the fires: ambience.js) and the darker below (below.js) on of
   Hangout's activities. The couches, the stage, the card table and the piano's keys are still drawn, but quiet: nothing to
   sit on, sing into or play at, and nothing else to write in or switch. */
keepOnly(
  "l4dd",
  [],
  ["flicker", "ambience", "below"],
  ["seats", "stage", "bj", "piano", "tv"],
); // (the TV only shows while the power is on: l4ddpower.js)

/* ---------- the numbers ---------- */
export const L4 = {
  HP: 3,
  REGEN: 15000, // ms for 1 HP to come back on its own, a hundredth at a time (hpmath.js regenOf)
  REVIVE: 5000, // ms of holding E by a downed duck (5 s: the owner's, Nov 17 11:07Z; it was 10)
  QUICK: 3000, // … with Quick Revive bought (the Butler's, 750: the owner's, Nov 17 11:19Z)
  BACK_HP: 2, // a revived duck comes up with 2 HP
  BLEED: 30000, // ms a downed duck waits for a revive, then it's a ghost for the rest of the round
  SPRINT: GAME_SPRINT.ms, // ms of sprint (the whole game's, gamedefaults.js); it fills GAME_SPRINT.refill times as slowly
  BREAK: 7000, // ms between rounds ("Round N" shows meanwhile)
  FIRST: 4000, // ms before the first round's zombies come
  BOARDS: 5,
  BOARD_MS: 900, // ms of holding E for each board
  TEAR_MS: 1500, // ms a zombie takes to tear one board down
  REACH: 110, // world px: how near E works (a downed duck, an opening)
  DEAD_MS: 4000, // ms a dead zombie lies there, fading (3 s longer than its first second: the owner's, Nov 4)
  FELL_MS: 1000, // ms a zombie counts as just killed (a drop due falls where it lies)
};
/* Safe Keeping (the owner's, Nov 16): a halo in the special slot, never used by hand. When its duck goes down it keeps
   everything bought from the Butler, and it gets the duck up again: at once when nobody else is standing (or alone, or
   a computer), else when its player presses the revive key (E) while down. First GLOW ms of a light blue glow, then up
   with INV ms of nothing hurting it; spent. The fireplace has it with the items, and a merchant may sell it (its color's
   price, purple: MERCH) */
const SAFE = {
  GLOW: 1200,
  INV: 6000,
};
/* an item that can run out, still with a use left in duck id's slot (one used up stays in the slot, empty: the owner's,
   Nov 18 12:19Z, "Items that can run out now simply stay in their slot without being removed") */
export const hasLeft = (s, id, w) =>
  slotsOf(s, id).includes(w) &&
  (((kitOf(s, id) || {}).am || {})[w] || [0])[0] > 0;
const hasSafe = (s, id) => hasLeft(s, id, "safekeep");
const invulnOf = (s, id, now) =>
  ((s && s.hang && s.hang.l4inv) || {})[id] > now;
export const WALK = 380 * 0.6 * 1.05; // world px a second: ducks at 63% of Duck Cabin's walk (world.js SPEED, l4dd.js SPEED: 5% faster than 60%, the owner's, Nov 3), at the Normal Walking speed; every zombie's speed is a share of it
export const Z_SLOW = 0.8 / 1.05; // (and the zombies 20% slower than they were, whatever the ducks' speed did)
/* the owner's rounds: up to which round, the zombies' speed as a share of the ducks' [slowest, fastest] and the most on
   the board at once. The steps come every 4 rounds, not 5 (the owner's, Nov 4: 5, 10, 15 and 25 became 4, 8, 12 and
   20). How many come: zombiesFor. Their swipes are rounds 1 to 4's in every round (zombies.js SWIPE) */
const ROUNDS = [
  [4, [0.5, 0.67], Infinity],
  [8, [0.5, 0.75], 35],
  [12, [0.75, 0.75], 35],
  [20, [0.75, 0.75], 45],
  [Infinity, [0.75, 0.75], 50],
]; // (after round 12, every zombie keeps round 9-12's speed and swipes; only the most at once still grows: the owner's, Nov 18 13:46Z, "the stat for every zombie AFTER round 12 now (but ignore the most at map at once, that still changes as the rounds go up)")
export const roundOf = (r) => ROUNDS.find((x) => r <= x[0]);
/* the zombies in round r with p players (the owner's, Nov 16 22:11Z and 22:16Z; the sheet: charts/zombies-per-round.xlsx).
   Each phase of rounds has its base [first round, last round, base]; every player past the first adds a share of it
   that grows through the phase, the round's place in it over the phase's length (1/4, 2/4 …), rounded down. Never
   more than 100 a player nor 400 in all, and never fewer than the round before (a round that would have fewer keeps
   the round before's). From round 21 on: 144 (as far as the cap lets), and never fewer than round 20 */
/* Nov 18 12:39Z + 12:40Z: every player earns about what one player alone earns, each round. So each round is its own
   phase (its share is then always the whole base: every extra player adds as many zombies as one player gets), rounds
   1-4 have as many as rounds 5-8 (24; it was 12), and the caps in all are 800 (8 players x 100). Spawn rates stay. The
   chart: sheets/zombie-spawns-per-player.xlsx */
const PHASE_BASE = [
  [8, 24],
  [12, 36],
  [20, 72],
]; // (up to which round, the zombies a round for one player)
const PHASES = Array.from({ length: 20 }, (_, i) => [
  i + 1,
  i + 1,
  PHASE_BASE.find(([last]) => i + 1 <= last)[1],
]);
const Z_EACH = 72, // the most zombies a round for each player …
  Z_LATE = 800; // from round 21 on (was 144), and Z_MOST in all (zombies.js)
function zombiesFor(r, p) {
  const cap = Math.min(Z_EACH * p, Z_MOST);
  let n = 0;
  for (let k = 1; k <= Math.min(r, 20); k++) {
    const [a, b, base] = PHASES.find((f) => k <= f[1]),
      d = b - a + 1,
      raw = Math.floor((base * (d + (p - 1) * (k - a + 1))) / d);
    n = Math.max(n, Math.min(raw, cap));
  }
  return r > 20 ? Math.max(n, Math.min(Z_LATE, cap)) : n;
}
/* spawning (the owner's): a zombie a second, 50% more for each player past the first, never more than 5 a second (3
   more for each player past the first), all twice that (Nov 16 21:21Z), and twice that again once a round is 10 s old
   (Nov 16 22:21Z); each second a 25% chance that none comes. A round's first 4 s, half as many (Nov 18 10:38Z: "let's
   make zombies spawn rate half as much for the first four seconds") */
const SKIP = 0.25,
  LATER = 10000, // ms into a round before they come twice as fast
  EARLY = 4000; // ms into a round they come half as fast
const BLAST_HALF = 0.5; // (a grenade's wide here, which the Angelic ones' are against: its rings, blast.js; the owner's, Nov 19 19:27Z, "half the blast radius")
/* a hit's damage: the weapon's, or a roll in its range (guns.js rollDmg) */
const dmgOf = (A) => (Array.isArray(A.dmg) ? rollDmg(A) : A.dmg || 1);
/* one of two, at even odds (the double barrel's 1 or 1.5); 0 with none */
const oneOf = (two) => (two ? two[Math.random() < 0.5 ? 0 : 1] : 0);
/* fire (the owner's): a zombie burns 8 s and takes 1 every 2 s (the first as it's lit: 4 in all), and fire on a zombie
   already burning starts its 8 s again (the owner's, Nov 18 16:43Z, "1 damage for every 2 seconds for 8 seconds per
   enemy"; it was 6 s and 3 s); a duck takes 1 as it's lit and burns 3 s, and anyone on fire who touches a duck lights
   it (not again for a second after its fire goes out) */
export const BURN = { Z: 8000, EVERY: 2000, P: 3000, AGAIN: 1000, SPREAD: 500 }; // (SPREAD: ms a zombie burns before its fire goes on to the ones it touches, the owner's, Nov 18 13:46Z)
/* Downpour's water over the road, shallow or deep: fire never stays on it, and nothing in it burns; a zombie or a duck
   on fire that goes in is put out (the owner's, Nov 18 10:38Z: "flamethrower's fire doesnt stay in the water ...
   enemies in the water of the road do not catch on fire and if were on fire are no longer on fire, and swimming in
   water has the same effect"). Up on a car over it isn't in it. The rain changes nothing */
const flood = (x, y) => dp() && (GS.inDeep(x, y) || GS.inShallow(x, y));
const wetZ = (z) => flood(z.x, z.y) && zFloor(z) === null;
function wetDuck(p) {
  if (!p) return false;
  const [x, y] = toPx(p);
  return flood(x, y) && duckFloor(p) === null && zOf(p) <= heightAt(x, y) + 4;
}
/* Downpour: is duck id swimming in the deep flood? Its guns, its bow and its melee are put away until it's out (the
   owner's, Nov 17 05:46Z) */
export function swims(s, id) {
  const p = s && s.pos && s.pos[id];
  return !!p && dp() && GS.inDeep(...toPx(p));
}
/* what a duck holds out (a special used up isn't there) */
export const inHand = (w, s, id) => {
  if (!w || w === "longjump" || w === "safekeep") return ""; // (Safe Keeping, picked, holds nothing out)
  const c = s && kindOf(w) === "special" && ((kitOf(s, id) || {}).am || {})[w];
  return c && c[0] <= 0 ? "" : w;
};
/* the slots, in order (keys 1 to 4; the grenades are 5): blue, red, red, purple, and the grenades white. Dead Ducks
   Arcade and Survival have a second item slot after the grenades, key 6 (the owner's, Nov 19 22:25Z: "In Dead Ducks
   Arcade and in Survival, there is now 2 item slots"): the kit's fifth (freshKit); Sandbox keeps one */
const START = ["knife", "handgun", "bow", ""];
export const SLOT_KINDS = ["melee", "ranged", "ranged", "special", "special"];
/* the item slots in a kit's slots (3, and 4 when there are two) */
const ITEM_SLOTS = [3, 4];
/* a pick (game.js l4Pick: 0 to 3 the slots, 4 the second item, 5 the grenades, as keys 1 to 6: the owner's, Nov 20 21:17Z,
   "The secondary item slot is number 5. The grenade is number 6") and its slot, -1 for the grenades */
export const slotOfPick = (i) => (i < 5 ? i : -1);
export const pickOfSlot = (k) => (k < 5 ? k : -1);
/* the fireplace's bags (the owner's, Nov 18 12:19Z, and the answers to Adam's questions at 12:32Z). Rolled the rarest
   first, each only if the one before it failed: the Chair bag 1% (the golden chair), the Special bag 5%, the Item bag
   20%, else the Weapon bag. The Weapon bag holds seven bags that take turns; each bag then gives the next one of its
   own. "Shuffle": a bag gives each of its things once, in a shuffled order, before any comes again (the owner's:
   "an item is removed from it's bag and does not reappear within it's bag until every other item has had a chance").
   Every duck has its own bags, new each game (fireBags). The bow is in the weak bag; the grenade is in none */
export const SLOT_ODDS = { chair: 0.01, special: 0.05, item: 0.2 };
export const SLOT_BAGS = {
  chair: ["chair"],
  special: ["chaingun", "flamer", "laser"],
  item: ["medkit", "zebra", "adrenaline", "safekeep"],
};
export const WEAPON_BAGS = {
  melee: ["axe", "sword", "hammer"],
  weak: ["dagger", "knife", "pan", "bow"],
  shotgun: ["shotgun", "dbarrel"],
  pistol: ["revolver", "handgun"],
  smg: ["tommy", "ump", "smg"],
  rifle: ["ak", "burst"],
  heavy: ["sniper", "glauncher", "lmg"],
};
/* Survival's bags: no Laser Rifle, chain gun or cast iron pan; the sniper is a special; twice the items ("They also have
   twice as many options for items") */
const SURV_BAGS = {
  odds: { ...SLOT_ODDS, item: SLOT_ODDS.item * 2 },
  slot: { ...SLOT_BAGS, special: ["flamer", "sniper"] },
  weapon: {
    ...WEAPON_BAGS,
    weak: ["dagger", "knife", "bow"],
    heavy: ["glauncher", "lmg"],
  },
};
const bagsNow = () =>
  survOn()
    ? SURV_BAGS
    : { odds: SLOT_ODDS, slot: SLOT_BAGS, weapon: WEAPON_BAGS };
export const weaponName = (w) => (isPw(w) ? pwName(w) : GUN_NAMES[w] || w);
/* each one's own color, in its slot and as its orb (the owner's, Nov 18 12:19Z: "every weapon, melee, or item has a
   corresponding color to it's slot now ... The purples all glow. Any weapon made angelic now has a red slot color and
   orb"): green, blue, purple (glowing) or the chair's gold. The dagger, the knife, the pistol, the pan, the adrenaline
   shot and the bow have no color: a plain slot, as in the other games (the owner's, 12:32Z: "they are a normal looking
   slot like it is in the default game, so no color"). One not here keeps its slot's color (the grenades) */
/* what each color costs at a merchant (MERCH.PRICES) */
const TIER_PRICES = {
  plain: 300,
  green: 500,
  blue: 750,
  purple: 1500,
  gold: 3000,
};
/* Survival's defibrillator (the owner's, Nov 19 22:25Z): a merchant has one 25% of the time on his first visit, and 15%
   more likely each visit after ("25% chance every time a merchant shows up ... let's make it 15% every time the merchant
   comes"), back to 25% once one came (my reading). Held while I go up to a dead player, it brings them back; they stack
   ("It's kind of like ammo"). It costs 950 rounded up to a color's price, and has that color ("Whatever it rounds up to
   in cost. Of whatever tier it rounds up to. And that will determine its color"): purple, 1,500 */
const DEFIB = { FIRST: 0.25, UP: 0.15, ASK: 950 };
const tierFor = (p) =>
  Object.keys(TIER_PRICES).find((k) => TIER_PRICES[k] >= p) || "gold";
const TINTS = {
  dagger: "plain",
  knife: "plain",
  handgun: "plain",
  pan: "plain",
  adrenaline: "plain",
  bow: "plain",
  medkit: "green",
  axe: "green",
  sword: "green",
  hammer: "green",
  shotgun: "green",
  revolver: "green",
  zebra: "blue",
  dbarrel: "blue",
  tommy: "blue",
  ump: "blue",
  smg: "blue",
  ak: "blue",
  burst: "blue",
  glauncher: "blue",
  lmg: "blue",
  safekeep: "purple",
  sniper: "purple",
  chaingun: "purple",
  flamer: "purple",
  laser: "purple",
  chair: "gold",
  defib: tierFor(DEFIB.ASK),
};
/* its color's class (css .l4s, .l4orb, .sp-slot: c-plain, c-green, c-blue, c-purple, c-gold, c-red), "" for its slot's own;
   holy: an Angelic one, red */
export const tintOf = (w, holy = false) =>
  holy ? "c-red" : TINTS[w] ? "c-" + TINTS[w] : "";
/* points (the owner's) */
/* what flies a little faster, as in every mode (rules.js FASTER): the arrows, the bullets and the daggers */
const BULLETS = new Set([
  "handgun",
  "bow",
  "dagger",
  "sniper",
  "smg",
  "tommy",
  "ump",
  "ak",
  "revolver",
  "lmg",
  "dbarrel",
  "burst",
]);
const PTS = {
  START: 50,
  HIT: 5,
  HEAD: 25,
  BOARD: 5,
  BOARDS: 50,
  NUKE_CRIT: 250,
}; // (a board: 5, the owner's, Nov 3)
/* Justin's Butler's upgrades (the owner's prices; attack speed's are Adam's plan's guess, question 3): the price of the
   next one when n are bought already, how many at most */
export const SHOP = [
  /* the upgrades never run out at the merchant (the owner's, Nov 19 19:27Z: "they do not go away. They are not a
     limited resource anymore"), and each one stacks up to 5 ("it can increase to 5"), so crits, cooldowns and reloads
     never run away. Quick Revive is a switch, so it stays one */
  {
    id: "acc",
    name: "Critical Chance",
    what: "+2.5% crits",
    most: 5,
  }, // (600 each, +2.5%: the owner's, Nov 16 21:47Z)
  {
    id: "as",
    name: "Attack speed",
    what: "Cooldowns 10% faster",
    most: 5,
  }, // (each one 10% faster than the last)
  {
    id: "hp",
    name: "Increase HP",
    what: "+1 HP until you die",
    most: 5,
  }, // (it was "Max HP": the owner's, Nov 19 19:27Z)
  {
    id: "rl",
    name: "Faster reload",
    what: "Reloads 30% faster",
    most: 5,
  },
  {
    id: "qr",
    name: "Quick Revive",
    what: "Revive others in 3 s until you die",
    most: 1,
  }, // (750, kept until I go down: the owner's, Nov 17 11:07Z + 11:19Z)
];
/* his guns and their ammo went with the merchants (the owner's, Nov 18 13:46Z: "never any ammo"): what a merchant sells
   is his stock (merchantStock). Every upgrade is 20% dearer (the owner's, Nov 4) */
const SHOP_MORE = 1.2;
/* a number of points as a whole number of fives: dir 1 rounds up, -1 down, 0 to the nearest (5 points is the smallest
   unit of money, for everything: the owner's, Nov 17 19:11Z) */
const fives = (n, dir = 0) =>
  5 *
  (dir > 0
    ? Math.ceil(n / 5)
    : dir < 0
      ? Math.floor(n / 5)
      : Math.round(n / 5));
export const priceOf = (id, n) =>
  id === "acc"
    ? ACC_PRICE
    : id === "qr"
      ? QR_PRICE
      : fives(
          UP_TIMES *
            SHOP_MORE *
            {
              acc: 300 + 50 * n,
              as: 250 + 50 * n,
              hp: n ? 125 : 100,
              sp: 250,
              rl: 300,
            }[id],
        );
const ACC_PRICE = 600; // (every Critical Chance the same: the owner's, Nov 16 21:47Z)
const QR_PRICE = 750; // (Quick Revive: "it costs only 750", the owner's, Nov 17 11:19Z)
/* how long duck `by` holds E to get a downed duck up: Quick Revive makes it 3 s */
export const reviveMs = (s, by) => (upOf(s, by).qr ? L4.QUICK : L4.REVIVE);
const UP_TIMES = 2; // (every upgrade twice its old price, for now: the owner's, Nov 3; then 20% more, SHOP_MORE)
/* the price I pay now: a Sale (a drop) halves what I buy for the rest of the round, each of the Butler's upgrades only
   once (the owner's: "increased health or accuracy is only half off for that item once"), the fireplace every time.
   It lasts 45 s (DROP.FOR, the owner's, Nov 16; it was the rest of the round) */
export const saleOn = (s) => !!(s && s.hang && s.hang.l4sale); // (for DROP.FOR: dropTick ends it)
export const priceFor = (s, id, what, n) => {
  const full = what === "box" ? BOX.price : priceOf(what, n);
  if (!saleOn(s)) return full;
  const used = (s.hang.l4sale.used || {})[id] || {};
  return what !== "box" && used[what] ? full : fives(full / 2, 1); // (half, in fives)
};
/* where Justin's Butler stands: beside his stool at the card table (anyone walks through him; nothing hurts him), and
   the fireplace's front, where E spins it */
export const BUTLER = { x: BJ.bx + 84, y: BJ.by - 18 };
export const BOX = {
  x: 2300,
  y: 742,
  sx: 2300,
  zx: 2300,
  sy: 706,
  sz: 58,
  price: 950, // (the owner's, Nov 18 12:39Z: "the slot now costs 950 points"; it was 650)
  spin: 4200,
  keep: 10000,
}; // (500 a spin: the owner's, Nov 15. sx, sy, sz: where it shows, CABIN_SPOTS below)
/* … and on Downpour (the second map): the Priest at the chapel's south end does the Butler's job, the car with its hood up the
   fireplace's (syncMap swaps them in) */
/* box: where a duck spins and takes (x, y), and where the weapons spin in sight (sx, sy, up sz): over the cabin's
   fireplace; on Downpour over the hood-up car, on its hood (the owner's, Nov 17 12:28Z; it was on the ground behind it, 11:07Z) */
const CABIN_SPOTS = {
    butler: { ...BUTLER },
    box: { x: BOX.x, y: BOX.y, zx: BOX.x, sx: BOX.x, sy: BOX.y - 36, sz: 58 },
  },
  DP_SPOTS = {
    butler: { x: GS.PRIEST.x, y: GS.PRIEST.y },
    box: {
      x: GS.HOOD.spot.x,
      y: GS.HOOD.spot.y,
      zx: GS.HOOD.spot.x + 90, // (the yellow square's middle: the owner's, Nov 17: over the car, not on the duck at the spot)
      /* the orb's middle exactly where I circled the S on my screenshot (refs/nov17-1228-batch/orb-over-car-S.png, Nov 17
         12:45Z and 17:41Z): the middle of the car's windshield, 58 by 243 into the car's drawing (stationart.js
         carSVG, 380 by 420 there, the front to the west; its top is the car's height and its hood's over its north edge).
         Its depth is the car's south edge, so it shows in front of the car; sz lifts it up to that spot (the orb hangs
         54 over its point, its middle 27 over) */
      sx: GS.HOOD.x0 + 58 * GS.K,
      sy: GS.HOOD.y1,
      sz: GS.HOOD.y1 - (GS.HOOD.y0 - 220 * GS.K + 243 * GS.K) - 27,
    },
  };
const SHOP_REACH = 130;
const SHOT_LIFE = 2000;
/* a zombie's room on the floor, as the ducks' (world.js crowd): an ellipse 56 across and 25.6 deep; every zombie the
   same, whatever its size. Its claw reaches a little past touching */
export const RX = 56,
  RY = 25.6,
  CLAW = 1.35,
  /* a zombie waiting behind another that's at a duck (it never walks into it: stepZombie, roofStep) claws from where it
     stands, this much farther (duck lengths), so a crowd hits a duck as hard as when they squeezed in on top of each
     other: one that's at the duck counts if it's within CLAW + near of it */
  QUEUE = { reach: 1, near: 0.4 },
  ROOF_BACK = 1.25; // (on a roof: one pushed back by the others (separate) goes for its duck again only past this, still in reach, so it doesn't shake there)
/* a new zombie's HP (the owner's, Nov 16 21:47Z: 3, then a 50% roll for 4; if that fails, a 50% roll for 5): 5 a
   quarter of the time, 3 a quarter, 4 half. Rolled the rarer first (the owner's, Nov 18 10:38Z), the same odds */
export const hp0 = () => {
  const r = Math.random();
  return (r < 0.25 ? 5 : r < 0.5 ? 3 : 4) - 0.5; // (half an HP less: the owner's, Nov 19 19:27Z, "decrease that by half a health point")
};
export const ZHATS = [
  "cap",
  "cowboy",
  "bucket",
  "sombrero",
  "afro",
  "police",
  "fire",
  "doctor",
  "nightcap",
  "helmet",
  "pumpkin",
  "birthday",
  "wizard",
  "jester",
];
export const ZOUTFITS = [
  "shirt",
  "hoodie",
  "jeans",
  "pajamas",
  "hawaiian",
  "suit",
  "leather",
  "muscle",
  "doctor",
  "police",
  "firefighter",
  "military",
];
/* 1 zombie in 400 was Justin (the owner's, Nov 4: 0.25%): his glasses and jeans, as a zombie. 0 since Nov 16, with
   HELPER.on: Justin never shows up in this mode */
export const Z_JUSTIN = 0;
export const zombieLook = (l) => ({
  color: "#3f7a34",
  pattern: "none",
  metal: "none",
  style: "rubber",
  beak: "default",
  beakColor: "#b06a1e",
  beakColor2: "#6e3a0c",
  size: l[3] || 0,
  build: l[4] || 0,
  ...(l[5] >= 0 ? { hat: { id: ZHATS[l[5]] } } : {}),
  ...(l[6] >= 0 ? { outfit: { id: ZOUTFITS[l[6]] } } : {}),
  ...(l[7] ? { face: { id: "glasses" }, outfit: { id: "jeans" } } : {}),
});

/* ---------- the map: only inside and the deck ----------
   The deck's stairs are boarded at the top (their landing is part of the deck). The openings: where zombies come in,
   and where boards go up. Each has its line in the wall (x, y; axis 'x' for an east-west wall, half: half its width),
   the spot just outside where a zombie tears the boards down (out), the spot just inside where it's in (in), and for
   the stairs the foot of the stairs where they appear (from) */
/* about how far a player sees from its duck, either way (a computer's view, the wider one) */
export const VIEW = { x: 720, y: 460 };
const LAND = { x0: STAIRS.x0, x1: STAIRS.x1, y0: STAIRS.y0, y1: STAIRS.land };
/* Downpour: the forest, short of the world's edge (the forest line stops nobody: the owner's, Nov 17 03:34Z). Past the
   fences only the road is open, so zombies there still climb them */
const inWoods = (x, y) => x >= 70 && x <= W - 70 && y >= 70 && y <= H - 70;
/* Duck Cabin (Sandbox's zombies there, sbcabin.js): the whole world; only what stands in it stops them (standable) */
const hangMap = () => layoutVariant() === "";
export const playable = (x, y) =>
  (hangMap() && x > 0 && x < W && y > 0 && y < H) ||
  (dp() && (GS.inOpen(x, y) || inWoods(x, y))) ||
  (!dp() && inCabin(x, y)) ||
  inDeck(x, y) ||
  (!dp() && x >= LAND.x0 && x < LAND.x1 && y >= LAND.y0 && y < LAND.y1);
const CABIN_OPENINGS = [
  {
    id: "front",
    kind: "door",
    x: 2000,
    y: CABIN.y0,
    axis: "x",
    half: 40,
    out: [2000, 546],
    in: [2000, 668],
  },
  {
    id: "stairs",
    kind: "stairs",
    x: 4400,
    y: LAND.y1,
    axis: "x",
    half: 92,
    out: [4400, 2410],
    in: [4400, 2296],
    from: [4400, 2860],
  },
  {
    id: "w1",
    kind: "hole",
    x: CABIN.x0,
    y: 1040,
    axis: "y",
    half: 46,
    out: [1244, 1040],
    in: [1362, 1040],
  },
  {
    id: "w2",
    kind: "hole",
    x: CABIN.x0,
    y: 1830,
    axis: "y",
    half: 46,
    out: [1244, 1830],
    in: [1362, 1830],
  },
  {
    id: "s1",
    kind: "hole",
    x: 1790,
    y: CABIN.y1,
    axis: "x",
    half: 46,
    out: [1790, 2262],
    in: [1790, 2138],
  },
  {
    id: "e1",
    kind: "hole",
    x: CABIN.x1,
    y: 930,
    axis: "y",
    half: 46,
    out: [4356, 930],
    in: [4238, 930],
  },
  {
    id: "e2",
    kind: "hole",
    x: CABIN.x1,
    y: 1530,
    axis: "y",
    half: 46,
    out: [4356, 1530],
    in: [4238, 1530],
  },
  {
    id: "e3",
    kind: "hole",
    x: CABIN.x1,
    y: 2110,
    axis: "y",
    half: 46,
    out: [4356, 2110],
    in: [4238, 2110],
  },
];
/* Downpour (the second map, stationmap.js): the boarded holes in the gas station and the chapel, and the fence round the
   whole map, which zombies climb over anywhere along its four sides but its corners (the owner's, Nov 17 12:28Z:
   "zombies spawn outside the fence and climb over it like i said, no longer spawning inside the map"). nb: no boards
   on them. A side's fence: axis "y" the west and east sides (its line at x = at), "x" the north and south (at y = at);
   out: the side the zombies come from (-1 west or north, 1 east or south); climb: from … to along it */
const RIM_CORNER = 60;
/* how far out from a fence's line a zombie comes (from), starts climbing (out), is at the top (out - mid) and lands
   (out - across), and how long the drop takes (s) */
export const FENCE = { from: 45, out: 22, mid: 34, across: 68, FALL: 0.35 };
/* how far out from fence f's line (x, y) is (inside: below 0) */
export const acrossFence = (f, x, y) =>
  ((f.axis === "y" ? x : y) - f.at) * f.out;
const RIM_SIDES = () => [
  { axis: "y", at: GS.RIM.x0, out: -1, climb: [GS.RIM.y0, GS.RIM.y1] },
  { axis: "y", at: GS.RIM.x1, out: 1, climb: [GS.RIM.y0, GS.RIM.y1] },
  { axis: "x", at: GS.RIM.y0, out: -1, climb: [GS.RIM.x0, GS.RIM.x1] },
  { axis: "x", at: GS.RIM.y1, out: 1, climb: [GS.RIM.x0, GS.RIM.x1] },
];
/* a spot by a fence: u across its line (outward), v along it */
export const byFence = (f, u, v) =>
  f.axis === "y" ? [f.at + f.out * u, v] : [v, f.at + f.out * u];
const DP_OPENINGS = [
  ...RIM_SIDES().map((f, k) => {
    const [a, b] = [f.climb[0] + RIM_CORNER, f.climb[1] - RIM_CORNER],
      m = (a + b) / 2;
    f.climb = [a, b];
    return {
      id: "fence" + k,
      kind: "fence",
      nb: true,
      x: f.axis === "y" ? f.at : m,
      y: f.axis === "y" ? m : f.at,
      axis: f.axis,
      half: (b - a) / 2,
      out: byFence(f, FENCE.out, 0), // (along it: the zombie's own)
      in: byFence(f, FENCE.out - FENCE.across, 0),
      from: byFence(f, FENCE.from, 0),
      fence: f,
      ...(f.axis === "x" ? { rim: true } : {}), // (no moonlight pooled at its middle: l4dd.js)
    };
  }),
  ...GS.BOARDED.map((o) => {
    const m = (o.a + o.b) / 2,
      half = (o.b - o.a) / 2,
      sg = o.out === "n" || o.out === "w" ? -1 : 1;
    return o.axis === "x"
      ? {
          id: o.id,
          kind: "hole",
          x: m,
          y: o.at,
          axis: "x",
          half,
          a: o.a,
          b: o.b,
          out: [m, o.at + sg * 60],
          in: [m, o.at - sg * 60],
        }
      : {
          id: o.id,
          kind: "hole",
          x: o.at,
          y: m,
          axis: "y",
          half,
          a: o.a,
          b: o.b,
          out: [o.at + sg * 60, m],
          in: [o.at - sg * 60, m],
        };
  }),
];
export const OPENINGS = [...CABIN_OPENINGS];
/* is the room on Downpour? (layout.js' useMode has turned to it: the rules call it for every action) */
export const dp = () => layoutVariant() === "l4gs";
/* the map's own roofs only (Sandbox's floors, sbfloors.js, aren't climbed to yet) */
export const mapDeck = (d) => (d && !d.sb ? d : null);
/* the map's own numbers in: its openings, the Butler's and the fireplace's spots, the start spots, the zombies' grid.
   Called wherever they're read; it does something only when layout.js has turned to the other map */
let mapRev = -1;
export function syncMap() {
  if (mapRev === layoutRev()) return;
  mapRev = layoutRev();
  const on = dp();
  OPENINGS.length = 0;
  OPENINGS.push(...(on ? DP_OPENINGS : CABIN_OPENINGS));
  const sp = on ? DP_SPOTS : CABIN_SPOTS;
  Object.assign(BUTLER, sp.butler);
  Object.assign(BOX, sp.box);
  spots = null;
  setGrid(
    on
      ? [0, 0, Math.ceil(GS.GS_W / CELL), Math.ceil(GS.GS_H / CELL)]
      : hangMap()
        ? [0, 0, Math.ceil(W / CELL), Math.ceil(H / CELL)]
        : [1280, 580, 82, 52],
  );
}
export const openingById = (id) => {
  syncMap();
  return OPENINGS.find((o) => o.id === id) || null;
};
/* where everyone starts, and comes back at the next round: free spots in the great room, nearest the middle first */
let spots = null;
export function startSpot(k = 0) {
  syncMap();
  if (!spots && dp()) {
    // (Downpour: in the gas station, by the front door)
    spots = [];
    for (let y = 1520 * GS.K; y <= 1680 * GS.K; y += 65)
      for (let x = 2250 * GS.K; x <= 3000 * GS.K; x += 65)
        if (standable(x, y, heightAt(x, y), 0)) spots.push({ x, y });
    spots.sort(
      (a, b) =>
        Math.hypot(a.x - GS.START.x, a.y - GS.START.y) -
        Math.hypot(b.x - GS.START.x, b.y - GS.START.y),
    );
  }
  if (!spots) {
    spots = [];
    for (let y = 1300; y <= 1560; y += 65)
      for (let x = 2560; x <= 3080; x += 65)
        if (standable(x, y, heightAt(x, y), 0) && !onPlatform(x, y))
          spots.push({ x, y });
    spots.sort(
      (a, b) =>
        Math.hypot(a.x - 2800, a.y - 1420) - Math.hypot(b.x - 2800, b.y - 1420),
    );
  }
  return spots[k % spots.length];
}

/* ---------- small helpers ---------- */
export const rnd = (a, b) => a + Math.random() * (b - a);
export const rint = (a, b) => Math.floor(rnd(a, b + 1));
export const players = (s) => s.seat.filter((id) => s.players[id] && s.pos[id]);
const P4 = (s, id) => ((s.hang && s.hang.l4p) || {})[id] || null;
const isDown = (s, id) => !!(P4(s, id) && P4(s, id).dn);
const isGhost4 = (s, id) => !!(P4(s, id) && P4(s, id).gh);
/* a ghost that comes back at the next round (Survival's stays one, ex: only a defibrillator brings it back) */
const returns = (s, id) => isGhost4(s, id) && !P4(s, id).ex;
export const standing = (s, id) =>
  !!P4(s, id) && !isDown(s, id) && !isGhost4(s, id);
/* a duck in the middle of a jump dodges a hit: not in its first fifth or its last (the owner's) */
export const dodging = (s, p, now) => jumpDodges(p, now, JUMP.T * 1000);

/* ---------- a duck's slots, points and upgrades ---------- */
/* a weapon's ammo, full: [in the magazine, the rest], or [all of it, 0] without a magazine; none for melee */
/* a ranged weapon whose ammo never runs out (no `all`: the Laser Rifle, the bow) */
export const endless = (w) =>
  !!ARMS[w] &&
  ARMS[w].kind === "ranged" &&
  ARMS[w].all === undefined &&
  !(w === "bow" && survOn()); // (Survival: the bow has 300 arrows)
/* Survival: every gun holds half as much ("every weapon now has half as much ammo"), never less than a magazine; the
   bow 300 arrows */
export const fullAmmo = (w) => {
  const a = ARMS[w];
  if (w === "bow" && survOn()) return [SV.ARROWS, 0];
  if (!a || a.all === undefined) return null;
  const all =
    survOn() && a.kind === "ranged"
      ? Math.max(a.mag || 1, Math.ceil(a.all / 2))
      : a.all;
  return a.mag ? [a.mag, all - a.mag] : [all, 0];
};
/* … and as full as duck id's own is: an Angelic weapon holds more (l4ddangel.js) */
export const fullFor = (s, id, w) =>
  angelOf(s, id, w) ? angelAmmo(ARMS[w], w) : fullAmmo(w);
/* a magazine's size in kit m: the Angelic pistols' is twice the pistol's (l4ddangel.js) */
export const magIn = (m, w) =>
  ARMS[w] && ARMS[w].mag
    ? ARMS[w].mag *
      (w === "handgun" &&
      m.dg === undefined &&
      m.ang &&
      m.ang[w] &&
      (m.sl || []).includes(w)
        ? ANGEL.PISTOL.MAG
        : 1)
    : 0;
function freshKit(s) {
  const am = {},
    sl = [...(survOn() ? SV.KIT : START)]; // (Survival: the pistol only)
  for (const w of sl) if (fullAmmo(w)) am[w] = fullAmmo(w);
  if (!isSb(s)) sl.push(""); // (the second item slot: not in Sandbox)
  const melee = !isSb(s) && sl.find((w) => kindOf(w) === "melee"),
    du = melee ? { [melee]: hundredths(ARMS[melee].dur * START_WEAR) } : null; // (the melee I start with: a quarter of its wear left, guns.js START_WEAR)
  return {
    sl,
    am,
    rl: 0,
    rw: "",
    g: ARMS.grenade.start,
    u: {},
    ...(du ? { du } : {}),
  };
}
/* the damage a melee weapon in kit m can still deal (its full dur until it has been used): kit.du { weapon: left } */
export const durLeft = (m, w) =>
  m && m.du && m.du[w] != null ? m.du[w] : (ARMS[w] || {}).dur || 0;
export const kitOf = (s, id) => ((s && s.hang && s.hang.l4a) || {})[id] || null;
/* Sandbox's loot (plan Loot 3, sbloot.js): what a loot orb set for weapon w in duck id's hands, kept in its kit as
   lm = { w: { d: its damage, dp: its damage in % of its own, c: its wait between uses (ms), r: 0 (it can't reload),
   b: 1 (it breaks when empty) } }; null when it came plain */
const lmOf = (s, id, w) => {
  const k = kitOf(s, id),
    own = (k && k.lm && k.lm[w]) || null;
  if (!isSb(s) || !s.sb || !s.sb.it) return own;
  /* G's rows for this item rule every copy, over what its loot set (plan Loot 5) */
  const g = sbItemMods(s, w),
    lm = { ...(own || {}) };
  if (g.dmg != null) {
    lm.d = g.dmg;
    delete lm.dp;
  } else if (g.dmgP != null) {
    lm.dp = g.dmgP;
    delete lm.d;
  }
  if (g.cool) lm.c = g.cool;
  if (g.rl != null) lm.r = g.rl ? 1 : 0;
  if (g.brk != null) lm.b = g.brk ? 1 : 0;
  return Object.keys(lm).length ? lm : null;
};
export const slotsOf = (s, id) => (kitOf(s, id) || {}).sl || START;
/* is w one of this duck's weapons? (what it can hold out and use; the grenades are always there) */
export const l4Holds = (s, id, w) =>
  !!w &&
  kindOf(w) !== "grenade" &&
  w !== "safekeep" &&
  slotsOf(s, id).includes(w);
export const ptsOf = (s, id) => ((s && s.hang && s.hang.l4pt) || {})[id] ?? 0;
export const upOf = (s, id) => ((s && s.hang && s.hang.l4u) || {})[id] || {};
export const maxHp = (s, id) =>
  isWild(s, id) ? wildMax(s, id) : grHp(s, id, L4.HP + (upOf(s, id).hp || 0)); // (Sandbox: a group's Max HP over it, sbgroups.js)
/* a weapon's wait between uses (each Attack speed: 10% shorter), a reload's time (Faster reload: 30% shorter), the
   headshot chance (headOf, below) */
export const l4Cool = (s, id, w) =>
  ARMS[w]
    ? (((lmOf(s, id, w) || {}).c ||
        (w === "laser" && angelOf(s, id, w)
          ? ANGEL.LASER.cool // (the Angelic Laser Rifle: its own, a beam every 0.75 s)
          : ARMS[w].cool *
            (angelOf(s, id, w)
              ? w === "handgun"
                ? ANGEL.PISTOL.FIRE
                : ANGEL.FAST
              : 1))) * // (Angelic: 20% faster; the dual pistols twice as fast, l4ddangel.js; a loot orb's own wait first)
        Math.pow(0.9, upOf(s, id).as || 0)) /
      grCool(s, id) // (Sandbox: a group's Cooldown speed, sbgroups.js)
    : 400;
/* ---------- the Laser Rifle's heat ----------
   Kept in the kit as lz { h: its heat in beams at t, t: the last beam, o: overheated until (0: not) }. After a beam
   it holds its heat for one wait between beams, then loses one beam's worth each wait; overheated, it cools from past
   its limit back to nothing in ARMS.laser.over. laserHeat → { h (0 … max + 1), max, over (ms left overheated, 0: not) },
   which every screen reads for the gun's glow, the meter under my duck and the steam */
const laserMax = (s, id) =>
  angelOf(s, id, "laser") ? ANGEL.LASER.heat : ARMS.laser.heat;
export function laserHeat(s, id, now) {
  const m = kitOf(s, id),
    z = m ? m.lz : ((s && s.mgj && s.mgj.lz) || {})[id], // (Mad God Justin, picked up: s.mgj.lz, rules.js)
    max = laserMax(s, id);
  if (!z) return { h: 0, max, over: 0 };
  if (z.o > now)
    return {
      h: ((max + 1) * (z.o - now)) / ARMS.laser.over,
      max,
      over: z.o - now,
    };
  const c = l4Cool(s, id, "laser");
  return { h: Math.max(0, z.h - Math.max(0, now - z.t - c) / c), max, over: 0 };
}
/* its heat after one more beam now: { lz (to keep), hot: this beam overheated it (the meter was full) } */
export function laserNext(s, id, now) {
  const { h, max } = laserHeat(s, id, now),
    hot = Math.round(h) >= max;
  return {
    lz: hot
      ? { h: max + 1, t: now, o: now + ARMS.laser.over }
      : { h: Math.min(max, h + 1), t: now, o: 0 },
    hot,
  };
}
export const reloadOf = (s, id, w, c) =>
  (ARMS[w].shell
    ? ARMS[w].shell *
      Math.max(
        1,
        Math.min(ARMS[w].mag - (c ? c[0] : 0), c ? c[1] : ARMS[w].mag),
      )
    : ARMS[w].reload || 1500) *
  Math.pow(0.7, upOf(s, id).rl || 0) *
  (angelOf(s, id, w)
    ? w === "handgun"
      ? ANGEL.PISTOL.RELOAD
      : ANGEL.RELOAD
    : 1); // (the double barrel: a second for each shell it loads; Angelic: 20% faster, the dual pistols twice as long)
/* crits and misses (the owner's, Nov 16 21:47Z): a weapon's own crit chance is guns.js critOf (25% divided by its shots
   a second, the owner's, Nov 21 17:25Z); each Critical Chance upgrade adds 2.5% to every one of them; an Angelic
   weapon's own chance is doubled (not the upgrades'). A hit misses ("critical failure") 2.5% of the time, a fast
   weapon's 5% (those that fire as long as the button is down, and the burst rifle). The cast iron pan keeps its own:
   half its swings miss, half its hits crit. The thrown grenade and the flamethrower never miss (the owner's, Nov 16
   22:21Z); the grenade launcher's shell can */
const CRIT_UP = 0.025;
const MISS = { SLOW: 0.025, FAST: 0.05 };
const fastArm = (w) =>
  !!(ARMS[w] && !ARMS[w].slow && (ARMS[w].auto || ARMS[w].burst)); // (the Tommy gun and the UMP-45 fire on and hit as the slow ones: 5% crits, 2.5% misses)
const canHit = (w) =>
  !!ARMS[w] && (ARMS[w].kind === "melee" || ARMS[w].kind === "ranged");
/* a weapon's miss chance (0: never) */
export const missOf = (w) =>
  !canHit(w) || w === "pan" || w === "flamer"
    ? 0
    : fastArm(w)
      ? MISS.FAST
      : MISS.SLOW;
const headOf = (s, id, w) => {
  const own = critOf(w);
  if (!own || (isSb(s) && !sbRule(s, "crit"))) return 0; // (Sandbox's Rules: crits off)
  if (isSb(s) && sbRule(s, "critp") >= 0) return sbRule(s, "critp") / 100; // (Sandbox's settings file: one crit chance for every weapon that crits, just as set)
  const holy = w !== "pan" && angelOf(s, id, w) ? 2 : 1; // (the pan has its own: not doubled)
  return own * holy + CRIT_UP * (upOf(s, id).acc || 0);
};
function addPts(s, id, n) {
  if (isWild(s, id)) return; // (Justin out there earns nothing: he never has a gun, the owner's, Nov 17 20:02Z)
  n = fives(n); // (never anything but fives, whatever adds them: the owner's, Nov 17 19:11Z)
  if (!n || !id || !s.players[id]) return;
  s.hang.l4pt = { ...(s.hang.l4pt || {}), [id]: ptsOf(s, id) + n };
}

/* ---------- a game, a round ---------- */
const countFor = (s, r) => zombiesFor(r, Math.max(1, players(s).length));
export function newRound(s, r, now, wait) {
  s.hang.l4 = {
    ...s.hang.l4,
    r,
    t0: now + wait,
    n: countFor(s, r),
    made: 0,
    owe: 0,
    acc: 0,
    sec: -1,
    bp: {},
    dq: dropPlan(),
    due: [],
    wait: null,
    sv: null,
  };
  s.hang.l4lt =
    dp() && Math.random() < BOLT.P
      ? { next: now + wait + rnd(BOLT.FROM, BOLT.TO) }
      : null; // (Downpour: a strike of lightning this round, now and then: boltTick)
  powerRound(s, r, now, PH);
}
/* everyone up again, full: a new game, or a ghost back at the next round (where it stands now, or at a start spot) */
function bringBack(s, id, now, k, fresh) {
  const p4 = { ...(s.hang.l4p || {}) },
    was = p4[id] || {};
  if (isWild(s, id) && (fresh || !(s.hang.l4jhp || {})[id]))
    s.hang.l4jhp = { ...(s.hang.l4jhp || {}), [id]: hp0() }; // (Justin out there: his HP rolled as a zombie's, each game)
  p4[id] = { hp: isWild(s, id) ? wildMax(s, id) : L4.HP, at: now };
  s.hang.l4p = p4;
  downGun(s, id, false);
  if (fresh) {
    s.hang.l4a = { ...(s.hang.l4a || {}), [id]: freshKit(s) };
    s.hang.l4pt = {
      ...(s.hang.l4pt || {}),
      [id]: PTS.START + ((s.hang.l4 && s.hang.l4.bonus) || 0),
    }; // (a starting round's bonus points: a duck joining later gets them too)
    s.hang.l4u = { ...(s.hang.l4u || {}), [id]: {} };
  } // (a ghost back at the next round keeps its weapons, its points and what it bought; its max HP went when it went down)
  if (s.players[id]) delete s.players[id].dead;
  const still = { ...(s.hang.still || {}) };
  delete still[id];
  s.hang.still = still;
  if (s.hang.ghost && s.hang.ghost[id]) {
    const g = { ...s.hang.ghost };
    delete g[id];
    s.hang.ghost = g;
  }
  if (fresh || was.gh) {
    const q = startSpot(k);
    s.pos[id] = {
      x: +(q.x / W).toFixed(5),
      y: +(q.y / H).toFixed(5),
      j: 0,
      z: 0,
      b: 0,
      tp: now,
    };
  }
}
/* bare floor: flat, nothing standing on it or right beside it, not by an opening or the fireplace, and far enough from
   the spots in out (the other drops) */
const bare = (x, y, out, far) =>
  playable(x, y) &&
  (!dp() || GS.inOpen(x, y)) && // (Downpour: drops come down inside the forest line, never out under the trees)
  Math.abs(heightAt(x, y)) < 1 &&
  !onPlatform(x, y) &&
  [
    [0, 0],
    [-50, 0],
    [50, 0],
    [0, -40],
    [0, 40],
  ].every(([dx, dy]) => !solidsAt(x + dx, y + dy, 0).length) &&
  OPENINGS.every((o) => Math.hypot(x - o.in[0], y - o.in[1]) > 200) &&
  Math.hypot(x - 2800, y - 1420) > 320 &&
  out.every(([a, b]) => Math.hypot(x - a, y - b) > far);
/* ---------- the drops (Stage 4, the owner's) ----------
   Each round: a 25% chance of one in its first 30 s, and then a 25% chance of a second 30 s after it; and on their own,
   a 5% chance of a Max Ammo in the first minute. When its time comes, the next zombie killed drops it where it fell
   (the owner's, Nov 3); it lies there 30 s (the owner's, Nov 17), into the next round too, and the first duck to walk
   over it takes it for everyone. Instant Kill, Double Points and Sale last 45 s, Speed Boost a minute (the owner's, Nov
   16). Which drop comes is a shuffle, one bag for the game: each comes once before any comes again, and Max Ammo never
   leaves the bag (the owner's, Nov 16). */
export const DROPS = ["kill", "nuke", "speed", "double", "sale", "ammo"]; // (Max Ammo, the likeliest, last: the owner's, Nov 18 10:38Z)
export const DROP = {
  CHANCE: 0.25,
  IN: 30000, // ms: the first drop, somewhere in the round's first 30 s
  AGAIN: 0.25, // and a second one
  GAP: 30000, // 30 s after the first
  AMMO: 0.05, // the Max Ammo of its own
  AMMO_IN: 60000, // in the round's first minute
  LIFE: 30000, // ms a drop lies there (it stays through a round's end; 30 s: the owner's, Nov 17 13:43Z)
  FOR: 45000, // ms Instant Kill, Double Points and Sale last, into the next round too (the owner's, Nov 16)
  SPEED_FOR: 60000, // ms Speed Boost lasts (the owner's, Nov 4)
  AMMO_W: 1.2, // once a drop comes, Max Ammo is this likely against 1 for each of the others (the owner's, Nov 4)
  REACH: 70, // world px: how near a duck walks over one
};
const DROP_NAMES = {
  kill: "Instant Kill",
  ammo: "Max Ammo",
  nuke: "Nuke",
  speed: "Speed Boost",
  double: "Double Points",
  sale: "Sale",
  coins: "Pocket Change",
};
export const dropName = (k) => DROP_NAMES[k] || k;
/* which drop: one from the game's bag (s.hang.l4bag: the ones not come yet), each as likely as the others, Max Ammo
   AMMO_W times as likely and always in it; the bag fills again once it's empty */
const BAGGED = DROPS.filter((k) => k !== "ammo");
function pickDrop(s) {
  const bag = s.hang.l4bag && s.hang.l4bag.length ? s.hang.l4bag : BAGGED,
    can = [...bag, "ammo"],
    w = (k) => (k === "ammo" ? DROP.AMMO_W : 1);
  let r = Math.random() * can.reduce((a, k) => a + w(k), 0),
    k = can[can.length - 1];
  for (const c of can)
    if ((r -= w(c)) < 0) {
      k = c;
      break;
    }
  const left = bag.filter((c) => c !== k);
  s.hang.l4bag = left.length ? left : [...BAGGED];
  return k;
}
/* when this round's drops come (ms after its start) and which: a random one, or the Max Ammo */
function dropPlan() {
  const q = [];
  if (Math.random() < DROP.AMMO)
    q.push([Math.round(rnd(0, DROP.AMMO_IN)), "ammo"]); // (the rarer, 5%, first: the owner's, Nov 18 10:38Z)
  if (Math.random() < DROP.CHANCE) {
    const t = rnd(0, DROP.IN);
    q.push([Math.round(t), ""]);
    if (Math.random() < DROP.AGAIN) q.push([Math.round(t + DROP.GAP), ""]);
  }
  return q.sort((a, b) => a[0] - b[0]);
}
/* a bare spot for a drop, inside or on the deck, away from the other drops */
function dropSpot(s) {
  const out = (s.hang.l4dr || []).map((d) => [d.x, d.y]);
  for (let k = 0; k < 400; k++) {
    const deck = Math.random() < 0.15,
      R = deck ? DECK : CABIN,
      x = Math.round(rnd(R.x0 + 110, R.x1 - 110)),
      y = Math.round(rnd(R.y0 + 80, R.y1 - 70));
    if (bare(x, y, out, 120)) return [x, y];
  }
  return null;
}
/* the drops due now come down, the old ones go, a duck walking over one takes it; and what was taken wears off */
function dropTick(s, L, zs, now, T, ids) {
  if (L.dq && L.dq.length && T >= L.dq[0][0]) {
    const [, k0] = L.dq[0];
    L.dq = L.dq.slice(1); // (L: the round, as l4Tick keeps it)
    L.due = [...(L.due || []), k0 || pickDrop(s)]; // (it waits for the next kill)
  }
  const was = s.hang.l4dr || [];
  let dr = was.filter((d) => now < d.until);
  for (const d of [...dr]) {
    const by = ids.find((id) => {
      const p = s.pos[id];
      return (
        standing(s, id) &&
        p &&
        Math.hypot(p.x * W - d.x, p.y * H - d.y) < DROP.REACH
      );
    });
    if (!by) continue;
    dr = dr.filter((x) => x !== d);
    takeDrop(s, d.k, by, zs, now, ids);
  }
  if (dr.length !== was.length) s.hang.l4dr = dr; // (only when one came or went: the state stays the same object)
  /* a drop due: the next zombie killed (a Nuke taken just now too) drops it where it fell */
  const fell = zs.filter((z) => z.st === 3 && T - z.d <= L4.FELL_MS); // (killed in the last second)
  if (L.due && L.due.length && fell.length) {
    const z = fell[Math.floor(Math.random() * fell.length)],
      [x, y] = playable(z.x, z.y) ? [z.x, z.y] : dropSpot(s) || [z.x, z.y];
    s.hang.l4dr = [
      ...(s.hang.l4dr || []),
      {
        n: now,
        k: L.due[0],
        x: Math.round(x),
        y: Math.round(y),
        until: now + DROP.LIFE,
      },
    ];
    L.due = L.due.slice(1);
  }
  const on = s.hang.l4on || {};
  if (Object.values(on).some((u) => u <= now)) {
    s.hang.l4on = Object.fromEntries(
      Object.entries(on).filter(([, u]) => u > now),
    ); // (what wore off)
    if (s.hang.l4sale && !s.hang.l4on.sale) s.hang.l4sale = null;
  }
}
/* the Nuke: each zombie it kills has a 5% chance of +250 more (the owner's, Nov 4) */
const NUKE_CRIT = 0.05;
/* what a drop does, for every duck */
function takeDrop(s, k, by, zs, now, ids) {
  addFx(s, { kind: "l4drop", k, by, who: [], t: now });
  if (k === "kill" || k === "double")
    s.hang.l4on = { ...(s.hang.l4on || {}), [k]: now + DROP.FOR };
  else if (k === "speed") {
    s.hang.l4on = { ...(s.hang.l4on || {}), speed: now + DROP.SPEED_FOR };
    const ad = { ...(s.hang.l4ad || {}) };
    for (const id of ids) ad[id] = Math.max(ad[id] || 0, now + DROP.SPEED_FOR);
    s.hang.l4ad = ad; // (the adrenaline shot's speed, for everyone)
  } else if (k === "sale") {
    s.hang.l4on = { ...(s.hang.l4on || {}), sale: now + DROP.FOR };
    s.hang.l4sale = { used: {} }; // (a new Sale: every half price can be spent again)
  } else if (k === "coins") addPts(s, by, POCKET_CHANGE.POINTS);
  else if (k === "ammo") maxAmmo(s);
  else if (k === "nuke") s.hang.l4nk = { at: now + NUKE.SWEEP }; // (it goes off once the sweep covers the screen: nukeTick)
}
/* the Nuke on every screen (owner 2026-11-16, l4dd.js nukeScreen): grey static sweeps out over the screen in a second,
   then every zombie dies at once, burnt and blown apart, while the static covers them, so only the aftermath is ever
   drawn. Their bodies lie there 15 s (the others' 4 s) */
const NUKE = { SWEEP: 1000, DEAD: 15000 };
function nukeTick(s, zs, now, ids) {
  const N = s.hang.l4nk;
  if (!N || N.ids || now < N.at) return;
  const T = now - s.hang.l4.t0,
    killed = [];
  let hp = 0,
    crits = 0;
  for (const z of zs)
    if (z.st !== 3) {
      hp += z.hp;
      z.hp = 0;
      die(z, T);
      s.hang.zw = { ...(s.hang.zw || {}), [z.i]: explodedLook(z.i + N.at) }; // (every one burnt and blown apart, in one of the few looks made beforehand: some headless, some with the beak and an eye gone; wounds.js)
      killed.push(z.i);
      if (Math.random() < NUKE_CRIT) crits++;
    }
  s.hang.l4nk = { at: N.at, ids: killed.length ? killed : [-1] };
  const each =
    (hp * PTS.HIT + crits * PTS.NUKE_CRIT) *
    ((s.hang.l4on || {}).double ? 2 : 1);
  for (const id of ids) addPts(s, id, each); // (every duck gets the points for all of it: the owner's, Nov 4)
}
/* Downpour: the trooper's body in the gas station (stationmap.js TROOPER) is gone from round 12 on, its pool of blood
   left where it lay, but only once nobody can see it: whoever is in the gas station or near it would, so it waits for
   a round or a rest when they're all away (the owner's, Nov 19 10:22Z: "the corpse in the gas station disapears but
   the puddle of blood stays IF the body isnt on a players screen ... The check for this should be every 30 secods maybe
   or something slow"). s.hang.l4.tg: gone. The host's clock for the next look: s.hidden.l4tg */
const TROOP = { ROUND: 12, EVERY: 30000, SEE_X: 1100, SEE_Y: 800 };
function troopTick(s, now, ids) {
  const L = s.hang.l4,
    hid = s.hidden || {};
  if (!dp() || !L || L.tg || (L.r || 0) < TROOP.ROUND) return;
  if (hid.l4tg && now < hid.l4tg) return;
  s.hidden = { ...hid, l4tg: now + TROOP.EVERY };
  const sees = (id) => {
    const p = s.pos[id];
    if (!p || isWild(s, id) || p.x < 0) return false;
    const x = p.x * W,
      y = p.y * H;
    return (
      whereIn(x, y, zOf(p)) === STATION ||
      Math.hypot(
        (x - GS.TROOPER.x) / TROOP.SEE_X,
        (y - GS.TROOPER.y) / TROOP.SEE_Y,
      ) < 1
    ); // (in there, or near enough that a screen could show it through a window or a hole in the roof)
  };
  if (!ids.some(sees)) s.hang.l4 = { ...L, tg: 1 };
}
/* Downpour's lightning (the owner's, Nov 16 23:15Z): each round has a 1% chance of a strike, some time in it, on a
   zombie out in the open that a duck has on screen. It dies burnt (no points: nobody killed it), and each strike has a
   1% chance of another one right after. Waits while there's no such zombie. s.hang.l4lt { next: when it strikes (0:
   no more this round), hit: [x, y, when] the last strike, for every screen's bolt and flash (l4ddrain.js) } */
const BOLT = {
  P: 0.01,
  AGAIN: 0.01,
  FROM: 5000,
  TO: 40000,
  RETRY: 2000,
  NEXT: 450,
};
function boltTick(s, zs, now, ids) {
  const B = s.hang.l4lt;
  if (!B || !B.next || now < B.next) return;
  const pts = ids.filter((id) => standing(s, id)).map((id) => toPx(s.pos[id])),
    can = zs.filter(
      (z) =>
        z.st !== 3 &&
        !GS.buildingAt(z.x, z.y) &&
        pts.some(
          ([a, b]) =>
            Math.abs(z.x - a) < VIEW.x * 0.7 &&
            Math.abs(z.y - b) < VIEW.y * 0.7, // (well inside the screen, so it's seen)
        ),
    );
  if (!can.length) {
    s.hang.l4lt = { ...B, next: now + BOLT.RETRY };
    return;
  }
  const z = can[Math.floor(Math.random() * can.length)];
  z.hp = 0;
  die(z, now - s.hang.l4.t0);
  s.hang.zw = { ...(s.hang.zw || {}), [z.i]: explodedLook(z.i + now) }; // (burnt, as the Nuke leaves them: wounds.js)
  s.hang.l4lt = {
    next: Math.random() < BOLT.AGAIN ? now + BOLT.NEXT : 0,
    hit: [Math.round(z.x), Math.round(z.y), now],
  };
}
/* a body the Nuke left: it lies there longer */
const nuked = (s, z) => !!s.hang.l4nk && (s.hang.l4nk.ids || []).includes(z.i);
/* Max Ammo: every weapon that refills is full again, the grenades too (3); the medkit and Survival's defibrillator
   don't come back this way (the medkit never refills, the defibrillator only comes from the merchant). Before, a Max Ammo gave every used defibrillator back: "merchant always has unlimited defibs" (the
   owner's, Nov 20 03:58Z) */
function maxAmmo(s) {
  const am = { ...(s.hang.l4a || {}) };
  for (const id of Object.keys(am)) {
    const m = { ...am[id], am: { ...am[id].am }, g: ARMS.grenade.most };
    for (const w of m.sl || [])
      if (
        fullAmmo(w) &&
        w !== "medkit" &&
        w !== "defib" &&
        !angelOf(s, id, w) // (an Angelic gun never refills, not even here: the owner's, Nov 16 22:21Z)
      )
        m.am[w] = fullFor(s, id, w);
    m.rl = 0;
    m.rw = "";
    am[id] = m;
  }
  s.hang.l4a = am;
}
function setUp(s, now) {
  helperOut(s); // (a new game: the fireplace's Justin goes)
  s.hang.l4 = { r: 1, next: 1, over: null, g: now }; // (g: when this game began, for the stats)
  s.hang.zp = [];
  s.hang.zs = {};
  s.hang.zl = {};
  s.hang.zw = {};
  syncMap();
  s.hang.brd = Object.fromEntries(
    OPENINGS.filter((o) => !o.nb).map((o) => [o.id, L4.BOARDS]),
  ); // (Downpour's fences have no boards)
  delete s.pw; // (every duck starts the game whole: no wounds or head off left from the last one, wounds.js)
  s.hang.l4p = {};
  s.hang.l4a = {};
  s.hang.l4pt = {};
  s.hang.l4u = {};
  s.hang.l4box = {};
  s.hidden = { ...(s.hidden || {}), l4sb: {} }; // (every duck's fireplace bags, new: fireRoll)
  s.hang.l4inv = {};
  s.hang.l4dr = [];
  s.hang.l4nk = null;
  s.hang.l4on = {};
  s.hang.l4sale = null;
  s.hang.l4bag = [...BAGGED];
  s.hang.l4b = {};
  s.hang.l4f = {};
  s.hang.l4am = null; // (the Angel machine, empty: l4ddangel.js)
  powerSetUp(s); // (the power is cut: the lamps are dark; the fires burn. Its box and its four parts: l4ddpower.js)
  s.hang.l4k = [];
  s.shots = [];
  s.hidden = { ...(s.hidden || {}), l4back: {} }; // (the ducks that left this game: what they had, for when they're back)
  players(s).forEach((id, k) => bringBack(s, id, now, k, true));
  if (dp() || s.options.wildJustin)
    for (const b of Object.keys(WILD_BREEDS)) helperIn(s, null, now, true, b); // (Downpour: Justin is out there, unarmed; the Justin in Duck Cabin setting brings him to the cabin too)
  newRound(s, 0, now, 0);
  s.hang.l4 = {
    ...s.hang.l4,
    n: 0,
    dq: [],
    wait: { r: 1, v: {} },
    sr: START_ROUNDS.includes(+s.options.l4start) ? +s.options.l4start : 1,
    bonus: 0,
    sv: null,
    srNo: {},
    srDone: 0,
  }; // (round 0: no zombies until enough ducks are ready)
  giveBonus(s, s.hang.l4.sr);
  merchantSetUp(s);
  if (isSurv(s)) return survSetUp(s, now);
  merchantCome(s, now); // (round zero's rest: half the time, as every rest)
}
/* Survival (survrules.js): no round 0 and no Ready, a rest at once, with the merchant and a few walkers about. No power
   ("The power for survival is off. There's no electricity. There is no angel machine"): no lights, no gas, no pump */
function survSetUp(s, now) {
  s.hang.l4 = { ...s.hang.l4, r: wholeIn(SV.FIRST), wait: null, n: 0, dq: [] }; // (a round from 5 to 8: a number, never the pair, or every round lookup breaks)
  s.hang.pw = null;
  s.hang.pk = [];
  s.hang.power = 0;
  survStart(s, now);
  merchantCome(s, now, true);
  const L = { ...s.hang.l4 },
    zs = [],
    ids = players(s).filter((id) => !isWild(s, id));
  for (let k = SV.START[0] + SV.START[1] * ids.length; k > 0; k--) {
    const z = survWalker(s, L, ids);
    if (z) zs.push(z);
  }
  s.hang.l4 = L;
  store(s, zs, false);
}
/* a walker, somewhere far from every duck that none of them sees, inside the fences where it can reach them; null when
   there's no such spot. L: the round, as l4Tick keeps it (its numbers go on) */
const walkSpeed = () => Math.round(WALK * Z_SLOW * ROUNDS[0][1][0] * SV.WALK_K);
function survWalker(s, L, ids) {
  syncMap();
  const pts = ids.filter((id) => standing(s, id)).map((id) => toPx(s.pos[id]));
  if (!pts.length) return null;
  const dist = flowFrom(pts.map((q) => openNear(...q))),
    away = SV.FAR * W;
  for (let t = 0; t < 60; t++) {
    const x = rnd(40, W - 40),
      y = rnd(40, H - 40),
      c = openNear(x, y);
    if (c < 0 || !(dist[c] < Infinity) || !zOk(x, y, heightAt(x, y))) continue;
    if (
      pts.some(
        ([a, b]) =>
          Math.hypot(x - a, y - b) < away ||
          (Math.abs(x - a) < VIEW.x + 60 && Math.abs(y - b) < VIEW.y + 140),
      )
    )
      continue;
    return zombieAt(L, x, y, { v: walkSpeed(), wk: 1 });
  }
  return null;
}
/* the starting round (the owner's, Nov 16): every game begins in round 0 and goes on to round `sr` (the "Start on round"
   setting: 1, 5, 9, 13 or 21) once everyone is ready; a starting round past 1 gives every duck bonus points, in round 0
   at once (L.bonus: what they were given, so changing the starting round gives or takes back only the difference) */
export const START_ROUNDS = [1, 5, 9, 13, 21];
export const START_PTS = { 1: 0, 5: 750, 9: 1750, 13: 2500, 21: 5000 };
export const startOf = (s) => (s && s.hang && s.hang.l4 && s.hang.l4.sr) || 1;
function giveBonus(s, sr) {
  const L = s.hang.l4,
    want = START_PTS[sr] || 0,
    d = want - (L.bonus || 0);
  if (d) {
    const pt = { ...(s.hang.l4pt || {}) };
    for (const id of players(s)) pt[id] = Math.max(0, (pt[id] || 0) + d);
    s.hang.l4pt = pt;
  }
  s.hang.l4 = { ...L, bonus: want };
}
export const GO_MS = 3000; // ms of "Round N" after the vote, before its zombies come
const SR_VOTE_MS = 30000; // ms a "Start at round N" vote stays up
/* the starting-round vote: who may start one (not after a No, only in round 0, none up), and what it needs */
const srOpen = (s) => {
  const L = s.hang && s.hang.l4;
  return !!L && L.r === 0 && !L.over && !!L.wait;
};
export const srVote = (s) => {
  const L = s.hang && s.hang.l4;
  return (srOpen(s) && L.sv) || null;
};
export const srCan = (s, id) =>
  srOpen(s) && !srVote(s) && !s.hang.l4.srDone && !(s.hang.l4.srNo || {})[id];
/* who End turn waits on: the fireplace's Justin never counts toward a turn */
const voters = (s) => players(s).filter((id) => !isHelper(s, id));
export const waitNeed = (s) =>
  Math.max(1, Math.ceil(voters(s).length * shareOf(s) - 1e-9));
export const waitVotes = (s) => {
  const w = s.hang && s.hang.l4 && s.hang.l4.wait;
  return w ? voters(s).filter((id) => w.v[id]).length : 0;
};
function waitTick(s, now) {
  const L = s.hang.l4,
    w = L.wait;
  if (!w || isSb(s)) return false; // (Sandbox: the rest never ends, so no zombies ever come: sandboxrules.js)
  const v = L.sv;
  if (v && L.r === 0 && now >= v.until) {
    s.hang.l4 = { ...L, sv: null }; // (a vote that ran out: nothing changes)
    return true;
  }
  if (waitVotes(s) < waitNeed(s)) return false;
  merchantGo(s, now); // (the zombies are coming: he runs)
  newRound(s, L.r === 0 ? L.sr || 1 : w.r, now, GO_MS);
  return true;
}
rule("l4", {
  only: "l4dd",
  ghosts: true,
  init: () => ({ power: 0, ghost: {}, still: {} }),
  start(s, now) {
    setUp(s, now);
  },
  join(s, id) {
    const now = Date.now(),
      back = ((s.hidden || {}).l4back || {})[id],
      others = players(s).filter(
        (o) => o !== id && !isWild(s, o) && !isHelper(s, o),
      );
    if (back) {
      /* a duck that was in this game before (lag, a rejoin) gets back exactly what it had (the owner's, Nov 19 19:27Z:
         "it should just carry over with what they last had during that game") */
      bringBack(s, id, now, players(s).indexOf(id), false);
      s.hang.l4a = { ...(s.hang.l4a || {}), [id]: back.a };
      s.hang.l4pt = { ...(s.hang.l4pt || {}), [id]: back.pt };
      s.hang.l4u = { ...(s.hang.l4u || {}), [id]: back.u };
      const gone = { ...s.hidden.l4back };
      delete gone[id];
      s.hidden = { ...s.hidden, l4back: gone };
      return;
    }
    bringBack(s, id, now, players(s).indexOf(id), true);
    /* a brand-new joiner: the average of the players' points, in fives, and the pistol (the fresh kit's) */
    if (others.length)
      s.hang.l4pt = {
        ...s.hang.l4pt,
        [id]: fives(
          others.reduce((n, o) => n + ptsOf(s, o), 0) / others.length,
        ),
      };
  },
  left(s, id) {
    if (s.hang.l4a && s.hang.l4a[id] && !isWild(s, id) && !isHelper(s, id))
      s.hidden = {
        ...(s.hidden || {}),
        l4back: {
          ...((s.hidden || {}).l4back || {}),
          [id]: {
            a: s.hang.l4a[id],
            pt: ptsOf(s, id),
            u: (s.hang.l4u || {})[id] || {},
          },
        },
      };
    for (const k of ["l4p", "l4a", "l4b", "l4f", "l4pt", "l4u"])
      if (s.hang[k] && s.hang[k][id] !== undefined) {
        const o = { ...s.hang[k] };
        delete o[id];
        s.hang[k] = o;
      }
    dropBox(s, id);
    angelLeft(s, id);
    const p4 = s.hang.l4p || {},
      now = Date.now();
    for (const [t, p] of Object.entries(p4))
      if (p.rv && p.rv.by === id)
        s.hang.l4p = {
          ...p4,
          [t]: { ...p, rv: null, dn: p.dn + (now - p.rv.at) },
        }; // (the bleeding-out waited meanwhile)
  },
  act(s, a, now) {
    return l4Act(s, a, now);
  },
  tick(s, now) {
    return l4Tick(s, now);
  },
});

/* ---------- what a duck does: E (revive, board up), key 0 (the flashlight), Play again ---------- */
/* a starting-round vote passes with the room's share of Yes (like End turn), and falls when that can't happen any more */
function srCheck(s) {
  const L = s.hang.l4,
    sv = L.sv;
  if (!sv) return;
  const ids = voters(s),
    yes = ids.filter((id) => sv.v[id] === 1).length,
    no = ids.filter((id) => sv.v[id] === 0).length,
    need = waitNeed(s);
  if (yes >= need) {
    s.hang.l4 = { ...L, sv: null, sr: sv.n, srDone: 1 }; // (passed: the button goes, the text stays)
    giveBonus(s, sv.n);
    s.options.l4start = sv.n; // (its stats and the setting follow)
  } else if (ids.length - no < need) s.hang.l4 = { ...L, sv: null };
}
/* the zombie game starts over (Play again, or Sandbox's "Start over" when everyone's out: rules.js); in Sandbox every
   life comes back, and every duck stands at a start spot of the Sandbox's */
export function l4Again(s, now) {
  setUp(s, now);
  if (!isSb(s)) return;
  s.sb = { ...s.sb, died: {} };
  for (const id of players(s)) {
    const q = sbPlayerSpot(s, id, W, H, (x, y, z) =>
      standable(x * W, y * H, z),
    );
    if (q && s.pos[id])
      s.pos[id] = { ...s.pos[id], x: q.x, y: q.y, z: q.z || 0, tp: now }; // (tp: my own screen takes the host's word for it, game.js)
  }
}
function l4Act(s, a, now) {
  const id = a.id,
    L = s.hang.l4,
    me = s.pos[id];
  if (!L || !me) return false;
  if (a.do === "again") {
    if (!L.over || s.hostId !== id) return false;
    l4Again(s, now);
    return true;
  }
  if (a.do === "fl") {
    const f = { ...(s.hang.l4f || {}) };
    if (f[id]) delete f[id];
    else f[id] = 1;
    s.hang.l4f = f;
    return true;
  }
  if (a.do === "endturn") {
    if (L.over || !L.wait || isHelper(s, id) || isSb(s)) return false; // (Sandbox: round 0 for good, no End turn) // (Justin can't end a rest phase: the owner's, Nov 17 13:38Z)
    const v = { ...L.wait.v };
    if (a.on === false) delete v[id];
    else v[id] = 1;
    s.hang.l4 = { ...L, wait: { ...L.wait, v } };
    waitTick(s, now);
    return true;
  } // (End turn, or Ready in round 0; ghosts and downed ducks may press it too)
  if (a.do === "sr") {
    // Change starting round: a vote "Start at round N", the asker's Yes in it
    const n = +a.n;
    if (!START_ROUNDS.includes(n) || !srCan(s, id) || isSb(s) || isSurv(s))
      return false;
    s.hang.l4 = {
      ...L,
      sv: { n, by: id, v: { [id]: 1 }, until: now + SR_VOTE_MS },
    };
    srCheck(s);
    return true;
  }
  if (a.do === "srv") {
    const sv = srVote(s);
    if (!sv || (sv.v || {})[id] !== undefined || !voters(s).includes(id))
      return false;
    const no = a.on === false;
    s.hang.l4 = {
      ...L,
      sv: { ...sv, v: { ...sv.v, [id]: no ? 0 : 1 } },
      ...(no ? { srNo: { ...(L.srNo || {}), [id]: 1 } } : {}), // (a No: this duck can't start another one)
    };
    srCheck(s);
    return true;
  }
  if (a.do === "sk") {
    const p4 = s.hang.l4p || {},
      p = p4[id];
    if (L.over || !p || !p.dn || !p.sk || p.skAt || !hasSafe(s, id))
      return false;
    s.hang.l4p = { ...p4, [id]: { ...p, skAt: now + SAFE.GLOW, rv: null } };
    return true;
  } // (Safe Keeping: I get myself up, E while down)
  if (L.over || !standing(s, id)) return false;
  const [mx, my] = toPx(me);
  if (a.do === "rev") {
    const t = String(a.on || ""),
      p4 = s.hang.l4p || {},
      tp = p4[t],
      pos = s.pos[t];
    const body = !!tp && !!tp.gh && !!tp.ex && !!(s.hang.ghost || {})[t]; // (Survival's ghost: its body lies where it fell)
    if (!tp || (!tp.dn && !body) || !pos || t === id) return false;
    if (!a.hold) {
      if (!tp.rv || tp.rv.by !== id) return false;
      s.hang.l4p = {
        ...p4,
        [t]: { ...tp, rv: null, dn: tp.dn + (now - tp.rv.at) },
      }; // (a revive pauses the bleeding-out: it goes on from where it was, the owner's, Nov 17 11:07Z)
      return true;
    }
    const [tx, ty] = toPx(body ? s.hang.ghost[t] : pos);
    if (Math.hypot(tx - mx, ty - my) > L4.REACH * 1.6) return false;
    if (tp.ex) return defibUse(s, id, t, me, now); // (dead for good: only Survival's defibrillator brings a player back)
    if (tp.rv && tp.rv.by !== id && s.pos[tp.rv.by]) return false; // (someone else is at it)
    if (me.w === "medkit" && hasLeft(s, id, "medkit")) {
      /* a medkit in my hand: up at once, full, with what they bought; the medkit is used up (the owner's, Nov 16), and
         stays in its slot, empty (Nov 18 12:19Z) */
      getUp(s, t, now, true);
      const kit = kitOf(s, id);
      s.hang.l4a = {
        ...s.hang.l4a,
        [id]: { ...kit, am: { ...kit.am, medkit: [0, 0] } },
      };
      addFx(s, { kind: "l4medrev", by: id, who: [t], t: now });
      return true;
    }
    s.hang.l4p = { ...p4, [t]: { ...tp, rv: { by: id, at: now } } };
    return true;
  }
  if (a.do === "board") {
    const o = openingById(a.o),
      b = { ...(s.hang.l4b || {}) };
    if (!a.hold) {
      if (!b[id]) return false;
      delete b[id];
      s.hang.l4b = b;
      return true;
    }
    if (!o || o.nb || Math.hypot(o.in[0] - mx, o.in[1] - my) > L4.REACH * 1.6)
      return false;
    if ((s.hang.brd || {})[o.id] >= L4.BOARDS) return false;
    b[id] = { o: o.id, at: now };
    s.hang.l4b = b;
    return true;
  }
  if (a.do === "buy")
    return buy(s, id, String(a.what || ""), mx, my, a.hand, now);
  if (isSurv(s) && ["box", "power", "pump", "angel"].includes(a.do))
    return false; // (Survival: no slot machine, no power, no pump, no Angel machine)
  if (a.do === "box") return fireplace(s, id, a, now, mx, my);
  if (a.do === "power") return powerAct(s, id, now, mx, my, PH);
  if (a.do === "pump") return powerPump(s, id, now, mx, my, PH);
  if (a.do === "angel") return angelAct(s, id, a, now, mx, my, PH);
  return false;
}
/* Survival: the defibrillator in my hand brings dead player t back (the owner's, Nov 19 22:25Z: "you go up to a dead duck
   that is a player and only a player, and you revive them"): up at once, as after a revive, and one defibrillator is
   used (the slot stays, empty, as a medkit's) */
function defibUse(s, id, t, me, now) {
  if (!isSurv(s) || isWild(s, t) || isHelper(s, t) || !s.players[t])
    return false;
  if (me.w !== "defib" || !hasLeft(s, id, "defib")) return false;
  const g = (s.hang.ghost || {})[t];
  if (g && s.pos[t]) {
    /* a ghost: it gets up where its body lies, and the ghost is gone */
    s.pos[t] = {
      ...s.pos[t],
      x: g.x,
      y: g.y,
      z: g.z || 0,
      j: 0,
      b: g.z || 0, // (as Duck Cabin's ghosts: hangout/ghosts.js)
      tp: now,
    };
    const gs = { ...s.hang.ghost };
    delete gs[t];
    s.hang.ghost = gs;
  }
  getUp(s, t, now, false);
  const kit = kitOf(s, id),
    c = kit.am.defib;
  s.hang.l4a = {
    ...s.hang.l4a,
    [id]: { ...kit, am: { ...kit.am, defib: [c[0] - 1, 0] } },
  };
  addFx(s, { kind: "l4defib", by: id, who: [t], t: now }); // (its shock: l4ddsfx.js)
  return true;
}
/* what a merchant sold, said in the chat by the buyer's tag (the owner's, Nov 19 19:27Z: "what the merchant sells to a
   player should be said in the text chat in the bottom left"); chat.js shows the name as it shows a tag */
const soldSays = (s, id, text) => {
  setMh(s, { sold: 1 }); // (bought from: he may come straight back, merchantCome)
  logIn(s, {
    sys: true,
    by: id,
    buy: text,
    text: (s.players[id] || {}).name + " " + text,
  });
};
/* the merchant: the one upgrade he offers me this visit (upOffer; the Butler's, SHOP), from beside him while he's
   selling, while I have the points; gas in the cabin (powerGas); or something from his stock (merchantBuy) */
function buy(s, id, what, mx, my, hand, now) {
  if (what === "gas") {
    const ok = !dp() && atMerchant(s, mx, my) && powerGas(s, id, now, PH);
    if (ok) soldSays(s, id, "bought 25% of a jerry can from the merchant.");
    return ok;
  }
  if (!SHOP.some((x) => x.id === what))
    return merchantBuy(s, id, what, mx, my, hand, now);
  const it = SHOP.find((x) => x.id === what),
    up = upOf(s, id),
    n = up[what] || 0;
  if (!it || n >= it.most || !atMerchant(s, mx, my)) return false;
  if (upOffer(s, id) !== what) return false; // (only the one he offers me)
  const price = priceFor(s, id, what, n);
  if (ptsOf(s, id) < price) return false;
  addPts(s, id, -price);
  if (saleOn(s) && price < priceOf(what, n)) {
    const sale = s.hang.l4sale,
      used = sale.used || {};
    s.hang.l4sale = {
      ...sale,
      used: { ...used, [id]: { ...(used[id] || {}), [what]: 1 } },
    };
  } // (its half price is spent)
  s.hang.l4u = { ...(s.hang.l4u || {}), [id]: { ...up, [what]: n + 1 } };
  soldSays(s, id, `bought ${it.name} from the merchant for ${price}.`);
  /* he never runs out of upgrades (the owner's, Nov 19 22:25Z: "Upgrades are unlimited in terms of however many there
     are"): the same one again while I can have more of it, else another I can still get */
  const mm = merchantOf(s);
  s.hang.l4m = {
    ...mm,
    ups: { ...(mm.ups || {}), [id]: n + 1 < it.most ? what : upFor(s, id) },
  };
  if (what === "hp") {
    const p4 = s.hang.l4p || {};
    if (p4[id]) s.hang.l4p = { ...p4, [id]: { ...p4[id], hp: p4[id].hp + 1 } };
  } // (the new HP comes full)
  return true;
}
/* the fireplace: E pays and it spins; once it has landed, E takes the weapon (only whoever paid): a melee weapon or a
   special takes its own slot, a ranged one the ranged weapon in hand (a.hand, else the one the duck holds out, else the
   first ranged slot). Every duck spins its own (the owner's, Nov 3: one duck's weapon kept everyone else waiting) */
const boxesOf = (s) => {
  const b = s && s.hang && s.hang.l4box;
  return b && !b.by ? b : {};
};
function dropBox(s, id) {
  const b = { ...boxesOf(s) };
  if (!b[id]) return;
  delete b[id];
  s.hang.l4box = b;
}
/* the weapon the fireplace shows for duck `id`; with no id, the newest one anyone spun */
export const boxNow = (s, now, id) => {
  const live = (b) => b && now < b.t + BOX.spin + BOX.keep;
  if (id) return live(boxesOf(s)[id]) ? boxesOf(s)[id] : null;
  return (
    Object.values(boxesOf(s))
      .filter(live)
      .sort((a, b) => b.t - a.t)[0] || null
  );
};
function fireplace(s, id, a, now, mx, my) {
  if (Math.hypot(BOX.x - mx, BOX.y - my) > SHOP_REACH * 2) return false;
  const b = boxNow(s, now, id),
    kit = kitOf(s, id);
  if (!kit) return false;
  if (!b) {
    const price = priceFor(s, id, "box");
    if (ptsOf(s, id) < price) return false;
    const w = fireRoll(s, id, kit);
    if (!w) return false; // (nothing left it could give this duck)
    addPts(s, id, -price);
    s.hang.l4hood = 1; // (Downpour: the hood-up car stops glowing once it's first used)
    s.hang.l4box = {
      ...boxesOf(s),
      [id]: {
        by: id,
        t: now,
        w,
      },
    };
    return true;
  }
  if (b.by !== id || now < b.t + BOX.spin || b.w === HELPER.w) return false; // (Justin isn't taken: he climbs out)
  if (!give(s, id, b.w, a.hand)) return false;
  dropBox(s, id);
  addFx(s, { kind: "l4take", by: id, who: [], w: b.w, t: now });
  return true;
}
/* the next one a bag gives duck by duck (bag: its things left, in their shuffled order; all: everything in it): the
   first one left the duck doesn't have. What it has is skipped and keeps its place (the owner's, 12:32Z: owned things
   are skipped and keep their place; a used-up item or an empty gun is still in its slot, so it never comes again). A
   bag with nothing left it can give is filled again, shuffled. Null: the duck has all of it (that bag is skipped).
   Returns [the one, what's left] */
function fromBag(left, all, has) {
  const one = (list) => list.find((w) => !has(w));
  let rest = left && left.length ? left : shuffled(all),
    w = one(rest);
  if (w === undefined && rest.length < all.length) {
    rest = shuffled(all);
    w = one(rest);
  }
  if (w === undefined) return [null, rest];
  return [w, rest.filter((x) => x !== w)];
}
function shuffled(xs) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/* duck id's bags (s.hidden.l4sb, the host's only, new each game): { chair, special, item: [left], w: [the weapon
   bags' turns left], b: { bag: [left] } } */
const fireBags = (s, id) =>
  ((s.hidden && s.hidden.l4sb) || {})[id] || { b: {} };
function fireRoll(s, id, kit) {
  const [got, bags] = bagRoll(fireBags(s, id), (w) => kit.sl.includes(w));
  s.hidden = {
    ...(s.hidden || {}),
    l4sb: { ...((s.hidden && s.hidden.l4sb) || {}), [id]: bags },
  };
  return got;
}
/* one roll from a set of bags (a duck's fireplace, or a merchant's: merchantStock): the chair, the specials and the
   items by SLOT_ODDS, else the weapon bags; has(w): skipped, kept in place. [what it gave (or null), the bags after] */
function bagRoll(bags0, has) {
  const bags = { ...bags0, b: { ...(bags0.b || {}) } },
    { odds, slot, weapon } = bagsNow();
  for (const k of ["chair", "special", "item"]) {
    if (Math.random() >= odds[k]) continue;
    const [w, rest] = fromBag(bags[k], slot[k], has);
    bags[k] = rest;
    if (w) return [w, bags]; // (the duck has all of that bag: on to the next)
  }
  /* the weapon bags, in turns: the next one that still has something for this duck (one it has all of is skipped and
     keeps its turn) */
  const names = Object.keys(weapon),
    can = (n) => weapon[n].some((w) => !has(w));
  const [n, turns] = fromBag(bags.w, names, (x) => !can(x));
  bags.w = turns;
  if (!n) return [null, bags];
  const [w, rest] = fromBag(bags.b[n], weapon[n], has);
  bags.b[n] = rest;
  return [w, bags];
}
/* the fireplace's Justin (the owner's, Nov 4): 1 spin in 100 lands on him (never while he's already here), and a
   moment later he climbs out of the fire and joins as another player, to help. He starts with 1,500 points of his own,
   all his HP, the knife, the chain gun and the pistol; every rule is the same for him as for any duck (bots.js
   plays him). He goes when the game does: Play again, or back to the lobby.
   Off since Nov 16 (the owner's: "Justin will be removed from the zombie game because I do not want to force him into
   it"): the fireplace never lands on him, and the General Settings Justin switch doesn't bring him in */
export const HELPER = {
  on: false,
  id: "b-justin",
  w: "justin",
  chance: 0.01,
  pts: 1500,
  out: 1200,
};
export const isHelper = (s, id) => !!(s.players[id] && s.players[id].helper);
/* Justin in Dead Ducks Arcade (the owner's, Nov 17; Duck Cabin too, by default, Nov 17 20:02Z: "he spawns in cabin now
   by default the same, without a weapon and cannot get a weapon"): the map starts with him out there, unarmed and
   running from the zombies, for good: nobody can give him a weapon, and he has no down pistol. He has WILD.hp HP and
   gets 1 back every WILD.regen ms; zombies and players can hurt and kill him (ex: dead for good: his body stays, nobody
   can revive him, he never comes back, not at a new round either). He is the fireplace's Justin (helperIn, the same
   player and brain) with no weapon and no points */
export const WILD = { hp: 6, regen: 60000 };
/* who is out there (the owner's, Nov 21 16:40Z: "Ethan is a character like Justin, and he spawns in cabin, or he spawns in
   downpour"; 16:45Z: "We can make it to where Ethan can spawn in and Justin ... they both spawn in"): one brain, a breed
   for each, every one out at once, each with its own slot id and its own HP, crying and lines. look: what he wears (a
   function, so a spawn can vary it); lines: what he says, or none (Ethan says nothing until I write his); kill: whether
   a player who downs him gets a Justin kill (unlocks.js) */
export const WILD_BREEDS = {
  justin: {
    id: "b-justin",
    name: "Justin",
    look: () => ({ ...JUSTIN }),
    lines: {
      say: E_LINES,
      god: GOD_LINES,
      death: DEATH_LINES,
      angry: GOD_LINES,
    },
    kill: true,
  },
  ethan: {
    id: "b-ethan",
    name: "Ethan",
    look: () => ({ ...ETHAN, outfit: { ...ETHAN.outfit, ...jerseyOf() } }),
    lines: null,
    kill: false,
  },
};
const wildBreedOf = (s, id) =>
  WILD_BREEDS[
    (s && s.players && s.players[id] && s.players[id].breed) || "justin"
  ] || WILD_BREEDS.justin;
/* every one of them out there, standing or not */
export const wilds = (s) => players(s).filter((id) => isWild(s, id));
/* his HP: rolled as a zombie's is, once a game (s.hang.l4jhp: the owner's, Nov 19 22:25Z, "Justin, I don't know if he
   has as much HP as the zombies, but he should. And you know, HP can be randomly determined in that way"); WILD.hp
   before a roll */
const wildMax = (s, id) => ((s && s.hang && s.hang.l4jhp) || {})[id] || WILD.hp;
/* the zombies and Justin out there (the owner's, Nov 17 20:37Z: "zombies dont chase justin forever they give up very
   quickly and the last 1/10th of zombies never chase justin. ZOmbies need to be twice as close to justin to want to
   chase him compared to a player"): to a zombie he counts as far times as far as he is; one that has chased him give ms
   lets him be for off ms; the last tenth (last) of a round's zombies never go for him */
export const JCHASE = { far: 2, give: 5000, off: 20000, last: 0.1 };
/* hurt, he cries (the tears eyes, as Mad God Justin's when he loses) for CRY.ms while he sprints away from where it came
   from (the owner's, Nov 17 20:37Z: "his character should use the cry effect already in the game for ten seconds after
   taking one damage", "JUSTIN CRIES AND SPRINTS ! HE DOESNT STAND AROUND"): s.hang.l4jcry { t, x, y } */
const CRY = { ms: 10000 };
export const wildCrying = (s, id, now) => {
  const c = isWild(s, id) && s.hang && (s.hang.l4jcry || {})[id];
  return !!c && now < c.t + CRY.ms && !isDown(s, id);
};
/* what Justin says besides his everyday lines: hurt by a player, an aggressive line; going down, a death line. Each
   list is a shuffled bag, every line once before any comes again (s.hang.l4jl { key: [line numbers left] }) */
/* hurt by a player, an aggressive line (his GOD_LINES, a bag of them), every single time (the owner's, Nov 19 19:27Z:
   "He should dialogue every time you damage him in an aggressive way"); a new line takes the place of the one over him
   (one bubble for each duck, game.js bubbles), so they never stack */
/* his everyday lines, all of them, as often as in Duck Cabin (the owner's, Nov 17 20:02Z: "he sounds off all his annoying
   lines unrestricted like he does in cabin with the same frequency"): justin.js' own timings, a random one of E_LINES
   every SAY_EVERY seconds and one of his GOD_LINES every GOD_EVERY seconds, whatever is going on round him */
function justinChat(s, now) {
  for (const id of wilds(s)) {
    const L = wildBreedOf(s, id).lines,
      q = P4(s, id);
    if (!L || !q || q.dn || q.gh) continue;
    const all = { ...(s.hang.l4jc || {}) },
      at = { ...(all[id] || {}) },
      sec = ([a, b]) => rnd(a, b) * 1000;
    if (!at.e) at.e = now + sec(SAY_EVERY) * 0.5;
    if (!at.g) at.g = now + sec(GOD_EVERY);
    let text = null;
    if (now >= at.e) {
      at.e = now + sec(SAY_EVERY);
      text = L.say[Math.floor(Math.random() * L.say.length)];
    } else if (now >= at.g) {
      at.g = now + sec(GOD_EVERY);
      text = L.god[Math.floor(Math.random() * L.god.length)];
    }
    if (JSON.stringify(at) !== JSON.stringify(all[id]))
      s.hang.l4jc = { ...all, [id]: at };
    if (text) logIn(s, { from: id, to: null, text });
  }
}
function justinSays(s, id, key) {
  const L = wildBreedOf(s, id).lines,
    list = L && L[key],
    bags = { ...(s.hang.l4jl || {}) };
  if (!list) return;
  const mine = { ...(bags[id] || {}) };
  let bag = mine[key] && mine[key].length ? [...mine[key]] : null;
  if (!bag) {
    bag = list.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  const n = bag.pop();
  mine[key] = bag;
  bags[id] = mine;
  s.hang.l4jl = bags;
  logIn(s, { from: id, to: null, text: list[n] });
}
export function isWild(s, id) {
  return !!(s && s.players && s.players[id] && s.players[id].wild);
}
function helperIn(s, by, now, wild = false, breed = "justin") {
  const B = WILD_BREEDS[breed],
    id = wild ? B.id : HELPER.id;
  if (s.players[id]) return;
  s.players[id] = {
    id,
    name: B.name,
    ...(breed !== "justin" ? { breed } : {}),
    bot: true,
    helper: 1,
    ...(wild ? { wild: 1 } : {}),
    duck: B.look(),
    card: {},
    nameStyle: {},
    ready: true,
    joined: now,
  };
  s.seat.push(id);
  bringBack(s, id, now, players(s).length, true);
  const kit = freshKit(s);
  kit.sl = wild ? ["", "", "", ""] : ["knife", "chaingun", "handgun", ""];
  kit.am = wild
    ? {}
    : { chaingun: fullAmmo("chaingun"), handgun: fullAmmo("handgun") };
  s.hang.l4a = { ...s.hang.l4a, [id]: kit };
  s.hang.l4pt = { ...s.hang.l4pt, [id]: wild ? 0 : HELPER.pts };
  if (wild) {
    s.pos[id] = { ...s.pos[id], w: "" };
    return;
  }
  const out = [BOX.x, BOX.y + 70];
  if (playable(...out) && standable(...out, heightAt(...out), STEP))
    s.pos[id] = {
      ...s.pos[id],
      x: +(out[0] / W).toFixed(5),
      y: +(out[1] / H).toFixed(5),
      w: "chaingun",
    };
  else s.pos[id] = { ...s.pos[id], w: "chaingun" };
  addFx(s, { kind: "l4justin", by, who: [], t: now });
  say(s, "Justin joined.");
}
/* Justin goes (a new game, the lobby) */
export function helperOut(s) {
  for (const id of [HELPER.id, ...Object.values(WILD_BREEDS).map((b) => b.id)])
    helperDrop(s, id);
}
function helperDrop(s, id) {
  if (!s.players[id]) return;
  delete s.players[id];
  s.seat = s.seat.filter((t) => t !== id);
  if (s.pos) delete s.pos[id];
  if (s.rainbow) delete s.rainbow[id];
  if (s.pw && s.pw[id]) {
    const pw = { ...s.pw };
    delete pw[id];
    s.pw = pw;
  } // (his wounds go with him: a retry's Justin starts whole, his head on. The owner's, Nov 19 01:00Z: "Justin spawned in without his head in a retry of the game")
  if (s.hang)
    for (const k of ["l4p", "l4a", "l4b", "l4f", "l4pt", "l4u", "l4box"])
      if (s.hang[k] && s.hang[k][id] !== undefined) {
        const o = { ...s.hang[k] };
        delete o[id];
        s.hang[k] = o;
      }
}
/* weapon w into duck id's slots, full: a melee weapon or a special takes its own slot, a ranged one the ranged weapon
   in hand (hand, else the one the duck holds out, else the first ranged slot) */
/* the slot w would go to in duck id's bar (hand0: the weapon it holds), or -1 when it can't take it: a melee weapon the
   first, a ranged weapon the place of the ranged one in hand, else the first ranged slot; a special an empty item slot,
   else one used up, else the one in hand, else the first (ITEM_SLOTS). The hotbar shows it before (l4ddbar.js) */
export function slotFor(s, id, w, hand0) {
  const kit = kitOf(s, id),
    kind = kindOf(w);
  if (!kit || kit.sl.includes(w)) return -1;
  const hand = kit.sl.includes(hand0) ? hand0 : ((s.pos || {})[id] || {}).w;
  if (kind === "ranged")
    return (
      [1, 2].find((i) => kit.sl[i] === hand) ?? SLOT_KINDS.indexOf("ranged")
    ); // (no ranged weapon in hand: it takes the first ranged slot's place)
  if (kind !== "special") return kind === "melee" ? 0 : -1;
  const its = ITEM_SLOTS.filter((i) => i < kit.sl.length),
    used = (i) => {
      const c = (kit.am || {})[kit.sl[i]];
      return !!c && c[0] + c[1] <= 0;
    };
  return (
    its.find((i) => !kit.sl[i]) ??
    its.find(used) ??
    its.find((i) => kit.sl[i] === hand) ??
    ITEM_SLOTS[0]
  );
}
export function give(s, id, w, hand0) {
  const kit = kitOf(s, id),
    k = slotFor(s, id, w, hand0);
  if (k < 0) return false;
  const old = kit.sl[k],
    am = { ...kit.am },
    ang = { ...(kit.ang || {}) };
  delete am[old];
  delete ang[old]; // (its Angelic power goes with it: l4ddangel.js)
  const du = { ...(kit.du || {}) };
  delete du[old];
  delete du[w]; // (a melee weapon comes whole)
  const lm = { ...(kit.lm || {}) };
  delete lm[old];
  delete lm[w]; // (it comes plain: a loot orb's numbers are set after, l4Loot)
  if (fullAmmo(w)) am[w] = fullAmmo(w);
  if (isSb(s) && s.sb && s.sb.it) {
    const g = sbItemMods(s, w); // (Sandbox: G's ammo for every copy of it, plan Loot 5)
    if (g.ammo != null || g.ammoP != null || g.inf != null || g.n != null)
      am[w] = ammoFor(w, g, g.inf) || am[w];
  }
  const sl = [...kit.sl];
  sl[k] = w;
  s.hang.l4a = {
    ...s.hang.l4a,
    [id]: {
      ...kit,
      sl,
      am,
      ang,
      du,
      lm,
      ...(kit.rw === old ? { rl: 0, rw: "" } : {}),
    },
  };
  return true;
}
/* ---------- the merchant (the owner's, Nov 18 13:46Z) ----------
   Justin's Butler and the Priest are now two of many merchants (merchants.js: who they are and how they look). One
   comes on round zero for sure, and then as each round ends, 1 time in 4 ("There is a 25% chance the merchant arrives
   every round AND one merchant is always there on round zero"), with "The Merchant has Arrived" where a drop's name
   shows. In the cabin he comes up the balcony's stairs, breaking their boards if they're up, and walks to the Butler's
   spot; on Downpour he climbs over the fence nearest the chapel and walks to the Priest's. Any merchant on either map.
   What he sells (MERCH): the bow always, for 250 ("priest or butler ALWAYS sells bow now, and for 250 points"); then one
   thing for sure from his own bags, the fireplace's (bagRoll: the golden chair 1%, the specials 5%, the items 20%, else
   the weapon bags in turns), and a 50% chance of another, each one after it 10% less likely, and 2.5% more likely for
   each player past the first; never ammo, never the grenade. Its price is its color's: plain 300, green 500, blue 750,
   purple 1,500, the golden chair 3,000. He has one of each, half the time two, and a quarter of the time three
   (MERCH.MORE_OF); the last one bought is gone for this visit, for everyone. In Survival he may have the defibrillator
   too (DEFIB). He offers each duck one of the Butler's upgrades (SHOP), one it can still get (upOffers), and never runs
   out of them (buy), and
   in the cabin he always has gas (the pump's 25% for the pump's price, never running out). The Sale halves his prices
   too.
   Walking up to him he greets you; a player who hurts him and doesn't kill him gets one line, and he runs: off the
   balcony in the cabin, over the fence on Downpour. When the next round's zombies come he says a leaving line and runs
   the same way, and the zombies chase him as they do a duck (as they do Justin out there: JCHASE) until he's over the
   fence or off the balcony. He can be killed (by anyone's weapons, or the zombies' claws), and stays dead for the rest
   of the game, his body left where he fell (the zombies leave it be); no revive. The merchants come in turn from a line
   (merchantCome): the last one goes to its end, one somebody bought from may come straight back (MERCH.BACK), and one a
   player hurt never comes back. He has 3 or 4 HP and walks as a duck does, and gets away no faster: the shared slow
   speed (npcshared.js NPC_RUN, merchantSprints).
   s.hang.l4m (online): { v: the visit, id: who (merchants.js), roll: his look, st: "in" (walking in), "here", "out"
   (running away), "fight" (Phil going after foe, the duck that hurt him), "jump" (off the balcony or over the fence:
   gone in a moment) or "dead", x, y (world px), f: his facing, hits: the times a player hurt him,
   hp, stock: [[weapon, price]], say: { n, t, text } his last line, c: 1 while he's past the zombies' reach }
   s.hidden.l4mh (the host's): { left: the merchants' line, dead: [ids], ban: [ids] (hurt by a player: never again),
   cur: the last one to come, sold: 1 once somebody bought from him, bags: his weapon bags (bagRoll), lines: the
   three line bags, near: { id: 1 } the ducks he greeted standing by him, route: [legs], p: the leg he's on, t: since
   when, tk: his last step } */
export const MERCH = {
  COME: 0.5, // (each rest's chance, round zero's too: the owner's, Nov 18 15:35Z "they come in at the rest phase, and it's a 50% chance that they do. It's not guaranteed")
  BOW: 250,
  PRICES: TIER_PRICES,
  MORE: 0.5, // (the second thing's chance …
  LESS: 0.1, // … each one after it less likely by this …
  EACH: 0.025, // … and more likely by this for each player past the first)
  MORE_OF: 0.5, // (each thing he has: the chance he has a second, then again a third: the owner's, Nov 19 22:25Z, "there's a 50% chance they sell one more ... and there's another 50% chance that's rolled again to see if they sell 3", for "any item that's sold, whether it be gun or otherwise")
  BACK: 0.2, // (one somebody bought from: the chance he comes again at the very next visit, else the end of the line)
  /* each visit's merchant rolls his HP as a zombie's (hp0: the owner's, Nov 19 19:47Z, merchants among those with "the
     same range of health points as the zombies"; at 19:27Z it was "3 to 4 HP") */
  WALK: 1, // (his walk: a duck's, the owner's, Nov 18 14:22Z: "he walks at the speed of any other player and will use his
  //  sprint to get away if he has to (limited amount of sprint)")
  SPRINT: NPC_RUN, // (getting away: the shared slow speed, npcshared.js; "Merchants should be less fast when they try to escape" (the owner's, Nov 19 19:27Z). His meter still runs as long as a duck's (L4.SPRINT), and as long to fill …
  CHASED: 450, // … used running away when a zombie is this near (world px) or a player just hurt him (HURT_MS)
  HURT_MS: 3000,
  CHASE_NEAR: 8, // (duck lengths: Survival, a zombie coming for him this close and he leaves his spot; my guess)
  STAB: 70, // (world px: Phil's knife reaches a duck this near …
  STAB_MS: 600, // … and stabs this often (my guesses) …
  FOE_FAR: 900, // … and lets a duck this far off be, and runs)
  GREET: 220, // (world px: a duck this near gets a greeting)
  SAY: 3500, // (ms a line shows: l4dd.js)
  LATE: 25000, // (ms: stuck on his way in, he's at his spot; running away this long, he's gone)
  /* Survival (the owner's, Nov 19 19:27Z and 19:47Z): each rest a 50% chance he has a gun, and shot or hurt he fights
     back with it (a pistol, half the time a revolver; Dyson a chain gun; Lucifer never: he always runs); after the
     fight he runs off half the time, else stays on the map, hiding */
  ARMED: 0.5,
  GUN_GAP: {
    handgun: [900, 1400],
    revolver: [1000, 1500],
    chaingun: [500, 800],
  }, // (ms between his shots: my guesses)
  FIGHT_MS: 8000, // (ms he fights back before he runs or hides)
  /* the owner's, Nov 19 19:27Z: "Merchants have unlimited ammo, even if they have to reload": his gun's own magazine
     and reload (the chain gun has none of its own: a belt of 100, my guess) */
  MAG: { chaingun: 100 },
  RELOAD: { chaingun: 2500 },
  /* the owner's, same message: "merchants that get in a gunfight with the soldiers will not try to run out of the map.
     They will try to protect their life and run away to another part of the map": a spot this far at least from every
     gunman, out of their sight if he can */
  FLEE_FAR: 700,
};
const merchMag = (g) => MERCH.MAG[g] || ARMS[g].mag || 6;
const merchReload = (g) => MERCH.RELOAD[g] || ARMS[g].reload || 1500;
export const merchantOf = (s) => (s && s.hang && s.hang.l4m) || null;
/* is he standing at his spot, selling? */
export const selling = (s) => (merchantOf(s) || {}).st === "here";
const mh = (s) => (s.hidden && s.hidden.l4mh) || {};
const setMh = (s, o) => {
  s.hidden = { ...(s.hidden || {}), l4mh: { ...mh(s), ...o } };
};
export const merchantPrice = (w) =>
  w === "bow" ? MERCH.BOW : MERCH.PRICES[TINTS[w] || "plain"];
/* what he asks for it now (a Sale halves it, in fives) */
export const stockPrice = (s, p) => (saleOn(s) ? fives(p / 2, 1) : p);
/* a new game: every merchant alive again, his bags new */
function merchantSetUp(s) {
  s.hang.l4m = null;
  s.hang.l4mc = []; // (the bodies of the ones killed: a new game, none)
  setMh(s, {
    left: [],
    dead: [],
    ban: [],
    cur: "",
    bags: { b: {} },
    route: null,
  });
}
/* a line of one kind ("greet", "hurt", "leave"), from his bag of them */
function merchantSays(s, kind, now) {
  const m = merchantOf(s);
  if (!m) return;
  const h = mh(s),
    lines = { ...(h.lines || {}) },
    all = linesOf(m.id, kind),
    [text, rest] = fromBag(lines[kind], all, () => false);
  lines[kind] = rest;
  setMh(s, { lines });
  s.hang.l4m = {
    ...m,
    say: { n: ((m.say && m.say.n) || 0) + 1, t: now, text },
  };
}
/* how many of a thing he has: 1, a 50% chance of 2, and of those half have 3 (MERCH.MORE_OF) */
const howMany = () =>
  Math.random() < MERCH.MORE_OF ? (Math.random() < MERCH.MORE_OF ? 3 : 2) : 1;
/* Survival: does this visit's merchant have the defibrillator? (DEFIB: more likely each visit he hasn't) */
function defibRoll(s) {
  const miss = mh(s).dfMiss || 0,
    yes = Math.random() < DEFIB.FIRST + DEFIB.UP * miss;
  setMh(s, { dfMiss: yes ? 0 : miss + 1 });
  return yes;
}
/* his stock for a visit: the bow, one sure thing, then the chances of more (each different); [weapon, price, how many] */
function merchantStock(s) {
  const stock = [["bow", MERCH.BOW]],
    has = (w) => stock.some(([x]) => x === w),
    extra = Math.max(0, players(s).filter((id) => !isWild(s, id)).length - 1);
  let bags = mh(s).bags || { b: {} },
    w;
  for (let k = survOn() ? 2 : 1; k > 0; k--) {
    [w, bags] = bagRoll(bags, has);
    if (w) stock.push([w, merchantPrice(w)]);
  } // (Survival: he's where the weapons come from now, "they're going to have more options for guns": two sure things)
  for (let k = 0; ; k++) {
    const p = MERCH.MORE - MERCH.LESS * k + MERCH.EACH * extra;
    if (p <= 0 || Math.random() >= p) break;
    [w, bags] = bagRoll(bags, has);
    if (!w) break;
    stock.push([w, merchantPrice(w)]);
  }
  setMh(s, { bags });
  if (isSurv(s) && defibRoll(s)) stock.push(["defib", merchantPrice("defib")]);
  return stock.map(([w, p]) => [w, p, howMany()]);
}
/* his upgrades this visit: one for each duck, from the ones it can still get (the owner's, Nov 18 14:20Z); bought, it's
   there again (buy); { id: upgrade id, or "" (none left) } */
function upOffers(s) {
  const ups = {};
  for (const id of players(s)) if (!isWild(s, id)) ups[id] = upFor(s, id);
  return ups;
}
/* one upgrade duck id can still get, at random ("" none) */
function upFor(s, id) {
  const up = upOf(s, id),
    can = SHOP.filter((it) => (up[it.id] || 0) < it.most);
  return can.length ? can[rint(0, can.length - 1)].id : "";
}
/* the upgrade he offers duck id this visit ("" none) */
export const upOffer = (s, id) => ((merchantOf(s) || {}).ups || {})[id] || "";
/* the fences round Downpour (its openings', their ends trimmed) */
const fences = () =>
  OPENINGS.filter((o) => o.kind === "fence").map((o) => o.fence);
const alongOf = (f, x, y) =>
  Math.max(f.climb[0] + 40, Math.min(f.climb[1] - 40, f.axis === "y" ? y : x));
/* his way in: [where he starts, legs] (a leg: to [x, y], how: "line" straight or "flow" by the zombies' field, k: speed,
   brk: an opening whose boards he breaks there, c: past the zombies' reach) */
function wayIn() {
  syncMap();
  const to = [BUTLER.x, BUTLER.y];
  if (!dp()) {
    const o = openingById("stairs");
    return [
      o.from,
      [
        { to: o.out, how: "line", brk: o.id },
        { to: o.in, how: "line" },
        { to, how: "flow" },
      ],
    ];
  }
  const f = fences().reduce((a, b) =>
      Math.abs(acrossFence(b, ...to)) < Math.abs(acrossFence(a, ...to)) ? b : a,
    ),
    v = alongOf(f, ...to);
  return [
    byFence(f, FENCE.from, v),
    [
      { to: byFence(f, FENCE.out, v), how: "line" },
      { to: byFence(f, FENCE.out - FENCE.across, v), how: "line", k: 0.5 },
      { to, how: "flow" },
    ],
  ];
}
/* his way out from (x, y): off the balcony's edge nearest him, or over the nearest fence */
function wayOut(x, y) {
  syncMap();
  if (!dp()) {
    const gx = Math.max(DECK.x0 + 160, Math.min(DECK.x1 - 160, x)),
      edge = [gx, DECK.y1 - 70];
    return [
      { to: edge, how: "flow" },
      { to: [gx, DECK.y1 + 260], how: "line", c: 1, jump: 1 },
    ];
  }
  const f = fences().reduce((a, b) =>
      acrossFence(b, x, y) > acrossFence(a, x, y) ? b : a,
    ),
    v = alongOf(f, x, y);
  return [
    {
      to: byFence(f, FENCE.out - FENCE.across - 20, v),
      how: "flow",
    },
    { to: byFence(f, FENCE.out, v), how: "line", k: 0.6, c: 1 },
    {
      to: byFence(f, FENCE.from + 80, v),
      how: "line",
      c: 1,
      jump: 1,
    },
  ];
}
/* a merchant comes, in a rest (round zero's, or between two rounds), half the time */
function merchantCome(s, now, sure = false) {
  if (!sure && Math.random() >= MERCH.COME) return; // (Survival: every rest, sure)
  const m0 = merchantOf(s);
  if (m0 && m0.st !== "dead") return; // (one at a time)
  const h = mh(s),
    dead = h.dead || [],
    ban = [...(h.ban || [])],
    prev = h.cur;
  /* the line (the owner's, Nov 19 19:27Z): the last one to come goes to the end of it. One a player hurt and who lived
     never comes back ("Merchants that are shot at go straight to the back of the line forever"); one somebody bought
     from may come straight back ("they have a 20% chance of coming back, and they're not removed from the shuffle") */
  if (prev && h.hurt && !dead.includes(prev) && !ban.includes(prev))
    ban.push(prev);
  const alive = MERCHANTS.map((m) => m.id).filter(
    (id) => !dead.includes(id) && !ban.includes(id),
  );
  if (!alive.length) return setMh(s, { ban, cur: "" }); // (every one of them killed or shot at)
  let left = (h.left || []).filter((id) => alive.includes(id));
  for (const id of shuffled(alive)) if (!left.includes(id)) left.push(id); // (a new game's, or one missing)
  if (prev && alive.includes(prev)) {
    left = left.filter((id) => id !== prev);
    if (h.sold && Math.random() < MERCH.BACK) left.unshift(prev);
    else left.push(prev);
  }
  const id = left[0],
    [from, route] = wayIn();
  const hp = hp0(),
    vn = (h.vn || 0) + 1; // (his visit's number this game: before, it started over at 1 whenever the last one had left)
  setMh(s, {
    vn,
    left,
    ban,
    cur: id,
    sold: 0,
    lines: {},
    hurt: 0,
    sp: 1,
    tired: false,
    near: {},
    route,
    p: 0,
    t: now,
    tk: now,
    mg: -1, // (Survival: his gun's rounds left, -1 a full magazine; mrl: when his reload ends)
    mrl: 0,
  });
  s.hang.l4m = {
    v: vn,
    id,
    roll: rint(0, 999),
    st: "in",
    x: Math.round(from[0]),
    y: Math.round(from[1]),
    f: 1,
    hp,
    max: hp,
    w: "",
    sp: 1,
    stock: merchantStock(s),
    ups: upOffers(s),
    say: null,
    ...(isSurv(s) && id !== "lucifer" && Math.random() < MERCH.ARMED
      ? {
          gun:
            id === "dyson"
              ? "chaingun"
              : Math.random() < 0.5
                ? "revolver"
                : "handgun",
        }
      : {}),
  };
}
/* the zombies are coming: a leaving line, and he runs */
export function merchantGo(s, now) {
  const m = merchantOf(s);
  if (!m || !["in", "here", "fight", "shoot", "hide", "flee"].includes(m.st))
    return;
  merchantSays(s, "leave", now);
  merchantRun(s, now);
}
function merchantRun(s, now) {
  const m = merchantOf(s);
  setMh(s, { route: wayOut(m.x, m.y), p: 0, t: now });
  s.hang.l4m = { ...merchantOf(s), st: "out", stock: [] };
}
/* Survival, after a gunfight with the soldiers: off to another part of the map (never out of it), then he hides there.
   A walkable spot far from every gunman left standing, out of their sight when one is; none: he hides where he is */
function merchantFlee(s, now) {
  const m = merchantOf(s),
    gs = ((s.hang.gm && s.hang.gm.gb) || []).filter((q) => !q.d);
  cells();
  const from = flowFrom([openNear(m.x, m.y)]); // (only spots he can walk to)
  let best = null;
  for (let k = 0; k < 80; k++) {
    const c = Math.floor(Math.random() * GW * GH);
    if (!walk[c] || !(from[c] < Infinity)) continue;
    const [x, y] = mid(c);
    if (
      dp() &&
      (x < GS.RIM.x0 + 80 ||
        x > GS.RIM.x1 - 80 ||
        y < GS.RIM.y0 + 80 ||
        y > GS.RIM.y1 - 80)
    )
      continue; // (inside the fence)
    const near = gs.length
      ? Math.min(...gs.map((q) => Math.hypot(q.x - x, q.y - y)))
      : Math.hypot(m.x - x, m.y - y);
    if (near < MERCH.FLEE_FAR) continue;
    const seen = gs.some((q) => clearShot(q.x, q.y, x, y, heightAt(x, y))),
      score = near - (seen ? 2000 : 0) - Math.hypot(m.x - x, m.y - y) * 0.2;
    if (!best || score > best[2]) best = [Math.round(x), Math.round(y), score];
  }
  if (!best) {
    s.hang.l4m = { ...m, st: "hide", foe: "" };
    return;
  }
  setMh(s, {
    route: [{ to: [best[0], best[1]], how: "flow" }],
    p: 0,
    t: now,
    hurtAt: now, // (he runs for it: his sprint, merchantSprints)
  });
  s.hang.l4m = { ...m, st: "flee", foe: "" };
}
/* he's hurt: by player `by` (a line, once a visit, then he runs) or by a zombie (null); n HP. True when it killed him */
export function merchantHurt(s, by, n, now, w = "", how = "", from = "") {
  const m = merchantOf(s);
  if (!m || m.st === "dead" || m.st === "jump") return false;
  const hp = Math.max(0, m.hp - n),
    had = m.w || "";
  /* his wounds, a duck's (wounds.js codes, drawn as a player's: the owner's, Nov 18 15:35Z "any merchant that gets damage
     gets gore effects ... all the gore effects that everyone else gets"): a crit that kills him blows his head off
     ("there's a chance you might get a crit on them, so their head explodes just like a zombie will"), a blast tears
     him apart (as it does a duck), any other hit leaves its weapon's wound */
  const wd = hitWounds(had, w, WOUND_BREEDS.merchant, {
    dead: !hp,
    head: how === "crit",
    blast: how === "blast",
    look: merchantLook(merchantById(m.id), m.roll),
  });
  if (!hp) {
    s.hang.l4m = {
      ...m,
      st: "dead",
      hp: 0,
      w: wd,
      stock: [],
      say: null,
      c: 1,
    };
    setMh(s, { dead: [...(mh(s).dead || []), m.id], route: null });
    s.hang.l4mc = [
      ...(s.hang.l4mc || []),
      {
        v: m.v,
        id: m.id,
        roll: m.roll,
        x: m.x,
        y: m.y,
        f: m.f,
        w: wd,
        t: now,
      },
    ]; // (his body, for good: "their corpse stays there permanently", even after the next merchant comes)
    addFx(s, { kind: "l4mdie", by, who: [], t: now, x: m.x, y: m.y });
    return true;
  }
  const hits = (m.hits || 0) + (by ? 1 : 0);
  if (by) setMh(s, { hurtAt: now });
  s.hang.l4m = { ...m, hp, hits, w: wd };
  if (by && !mh(s).hurt) {
    setMh(s, { hurt: 1 });
    merchantSays(s, "hurt", now); // ("these are the lines they will say once when they take damage from a player")
  }
  /* Survival: armed, he fights back at whoever hurt him (from: a gunman, "g" + its number; a zombie: the nearest) */
  if (m.gun && m.st !== "shoot") {
    s.hang.l4m = {
      ...merchantOf(s),
      st: "shoot",
      foe: by || from || "",
      ...((by ? "" : from || "")[0] === "g" ? { gf: 1 } : {}), // (in a gunfight with the soldiers: merchantFlee after it)
      fu: now + MERCH.FIGHT_MS,
      stock: [],
    };
    setMh(s, { route: null, t: now });
    return false;
  }
  if (m.gun) return false; // (fighting already)
  /* Phil the Murderous (merchants.js fights) hits back: from his second hit on he goes after whoever hurt him with
     his knife (the owner's, Nov 18 14:10Z: "he will hit back at players when he takes second damage with a knife (has
     a 50% chance of missing when he uses it and it does 1 damage only)") */
  const F = (merchantById(m.id) || {}).fights;
  if (by && F && hits >= F.after && s.players[by]) {
    s.hang.l4m = { ...merchantOf(s), st: "fight", foe: by };
    setMh(s, { route: null, t: now });
    return false;
  }
  if (by && m.st !== "out" && m.st !== "fight") merchantRun(s, now);
  return false;
}
/* Phil, fighting: after his foe (by the zombies' field when there's something in the way), a stab whenever it's near
   enough; he runs once his foe is down, gone or far off */
function merchantFight(s, m0, now, dt) {
  const F = (merchantById(m0.id) || {}).fights || {},
    p = s.pos[m0.foe];
  if (!p || !standing(s, m0.foe)) return merchantRun(s, now);
  const [fx, fy] = toPx(p),
    d = Math.hypot(fx - m0.x, fy - m0.y);
  if (d > MERCH.FOE_FAR) return merchantRun(s, now);
  const m = { x: m0.x, y: m0.y };
  if (d > MERCH.STAB) {
    const aim = walkable(m.x, m.y, fx, fy)
      ? [fx, fy]
      : heading(flowFrom([openNear(fx, fy)]), m.x, m.y) || [fx, fy];
    stepZombie(m, aim, WALK * walkOf(s) * MERCH.WALK * wetK(m.x, m.y) * dt, []);
  } else if (now - (mh(s).stab || 0) >= MERCH.STAB_MS) {
    setMh(s, { stab: now });
    addFx(s, {
      kind: "l4mstab",
      by: m0.foe,
      who: [],
      t: now,
      x: m0.x,
      y: m0.y,
    });
    if (Math.random() >= (F.miss || 0)) {
      const p4 = { ...(s.hang.l4p || {}) };
      for (let k = 0; k < (F.dmg || 1); k++)
        hurtDuck(s, p4, m0.foe, now, F.weapon || "knife");
      s.hang.l4p = p4;
    }
  }
  s.hang.l4m = {
    ...merchantOf(s),
    x: Math.round(m.x),
    y: Math.round(m.y),
    f: fx < m.x ? -1 : 1,
  };
}
/* Survival: armed and hurt, he shoots back (zs: the zombies, live, as l4Tick moves them) at whoever hurt him: a duck,
   one of the gunmen, or else the nearest zombie; when it's gone, far off or the fight's time is up, he runs half the
   time, else hides where he is */
function merchantShoots(s, zs, now) {
  const m = merchantOf(s);
  if (!m || m.st !== "shoot") return;
  const foe = m.foe || "",
    gm = s.hang.gm,
    dist = (q) => Math.hypot(q.x - m.x, q.y - m.y);
  let t = null;
  if (s.players[foe]) {
    if (standing(s, foe) && s.pos[foe]) {
      const [x, y] = toPx(s.pos[foe]);
      t = { id: foe, x, y };
    }
  } else if (foe[0] === "g" && gm) {
    const g = gm.gb.find((q) => "g" + q.i === foe && !q.d && !q.hid);
    if (g) t = { g, x: g.x, y: g.y };
  }
  if (!t) {
    const z = zs
      .filter((q) => q.st !== 3 && dist(q) < 400)
      .sort((a, b) => dist(a) - dist(b))[0];
    if (z) t = { z, x: z.x, y: z.y };
  }
  if (!t || dist(t) > MERCH.FOE_FAR || now > m.fu) {
    const soldiers = foe[0] === "g" || m.gf;
    if (Math.random() < 0.5)
      soldiers ? merchantFlee(s, now) : merchantRun(s, now);
    else s.hang.l4m = { ...m, st: "hide", foe: "" };
    return;
  }
  const f = t.x < m.x ? -1 : 1;
  if (now < (mh(s).gx || 0) || !npcSees(m, t, undefined, 0)) {
    if (m.f !== f) s.hang.l4m = { ...m, f };
    return;
  }
  /* his magazine: empty, he reloads first (unlimited rounds, every reload taken) */
  const h = mh(s),
    full = merchMag(m.gun),
    left = h.mg < 0 || h.mg == null ? full : h.mg;
  if (h.mrl && now < h.mrl) {
    if (m.f !== f) s.hang.l4m = { ...m, f };
    return;
  }
  const rounds = h.mrl ? full : left,
    burst = m.gun === "chaingun" ? Math.min(5, rounds) : 1,
    after = rounds - burst;
  setMh(s, {
    gx: now + rnd(...MERCH.GUN_GAP[m.gun]),
    mg: after,
    mrl: after <= 0 ? now + merchReload(m.gun) : 0,
  });
  const A = ARMS[m.gun],
    len = dist(t) / 64,
    chance = t.z ? 0.85 : Math.max(0.06, 0.25 - 0.03 * len); // (as the gunmen aim, gunmenrules.js AIM)
  let dmg = 0;
  for (let k = 0; k < burst; k++)
    if (Math.random() < chance)
      dmg += Array.isArray(A.dmg) ? rollDmg(A) : +A.dmg || 1;
  const a = Math.random() * 2 * Math.PI,
    off = dmg ? 0 : 30 + Math.random() * 40;
  s.hang.l4m = {
    ...m,
    f,
    sh: shotMark(now, t, a, off),
  };
  if (!dmg) return;
  if (t.z) {
    if (strike(s, t.z, dmg, false, null, m.gun)) die(t.z, now - s.hang.l4.t0);
  } else if (t.g) {
    if (L4_HOOKS.gm)
      L4_HOOKS.gm.hurt(s, t.g.i, dmg / 2, m.gun, now, gmHelp(s, now));
  } else {
    const p4 = { ...(s.hang.l4p || {}) };
    hurtDuck(s, p4, t.id, now, m.gun, Math.round(dmg * 5) / 10); // (half, as the gunmen's)
    s.hang.l4p = p4;
  }
}
/* a shot or a swing at (x, y) by duck `by` with weapon w: on him? (as wildHurt for Justin: 1 HP, a crit 2) */
function merchantShot(s, by, x, y, now, w, rx, ry, from) {
  const m = merchantOf(s);
  if (!m || m.st === "dead" || m.st === "jump" || !s.players[by]) return false;
  if (Math.hypot((m.x - x) / rx, (m.y - y) / ry) >= 1) return false;
  if (from && slabBetween(...from, m.x, m.y, heightAt(m.x, m.y))) return false;
  const n = Math.random() < critOf(w) ? 2 : 1, // (a crit doubles it)
    head = n > 1 && m.hp <= n; // (a crit that kills him: his head bursts as a zombie's does, game.js draws it)
  if (n > 1)
    addFx(s, {
      kind: "l4crit",
      by,
      who: [],
      t: now,
      x: Math.round(m.x),
      y: Math.round(m.y),
      ...(head ? {} : { m: 1 }),
    }); // (m: only the CRIT mark)
  merchantHurt(s, by, n, now, w, head ? "crit" : "");
  return true;
}
/* every heartbeat: he walks his way (in, or out), breaks the boards in it, and greets the ducks that walk up to him */
function merchantTick(s, now) {
  const m0 = merchantOf(s);
  if (!m0 || m0.st === "dead") return;
  const h = mh(s);
  if (m0.st === "here") {
    const near = { ...(h.near || {}) };
    let greet = false;
    for (const id of players(s)) {
      if (!standing(s, id) || isWild(s, id)) continue;
      const [x, y] = toPx(s.pos[id]),
        d = Math.hypot(x - m0.x, y - m0.y);
      if (d < MERCH.GREET && !near[id]) {
        near[id] = 1;
        greet = true;
      } else if (d > MERCH.GREET * 1.5 && near[id]) delete near[id];
    }
    setMh(s, { near, tk: now });
    if (greet && now - ((m0.say && m0.say.t) || 0) > 2500)
      merchantSays(s, "greet", now);
    return;
  }
  const route = h.route || [],
    leg = route[h.p || 0],
    dt = Math.min(0.35, Math.max(0.05, (now - (h.tk || now - 200)) / 1000));
  setMh(s, { tk: now });
  if (m0.st === "fight") return merchantFight(s, m0, now, dt);
  if (m0.st === "shoot" || m0.st === "hide") return; // (Survival: he stands his ground, merchantShoots; or hides there)
  if (!leg || now - (h.t || now) > MERCH.LATE) {
    /* his way done (or taking too long): at his spot, or gone */
    if (m0.st === "in") {
      s.hang.l4m = {
        ...m0,
        st: "here",
        x: Math.round(BUTLER.x),
        y: Math.round(BUTLER.y),
      };
      addFx(s, { kind: "l4drop", k: "merchant", who: [], t: now }); // ("The Merchant has Arrived", l4dd.js l4Got: as he gets to his spot. When he set off it was often at the game's very start, round zero, before anyone's screen was up to show it, and the owner never saw it)
    } else if (m0.st === "flee")
      s.hang.l4m = { ...m0, st: "hide" }; // (got away to another part of the map: he hides there)
    else s.hang.l4m = null;
    return;
  }
  const m = { x: m0.x, y: m0.y },
    far =
      WALK *
      walkOf(s) *
      (leg.k || MERCH.WALK) *
      wetK(m0.x, m0.y) *
      dt *
      (merchantSprints(s, m0, now, dt) ? MERCH.SPRINT : 1);
  let done = false;
  if (leg.how === "line") done = walkTo(m, leg.to[0], leg.to[1], far);
  else {
    const d = Math.hypot(leg.to[0] - m.x, leg.to[1] - m.y);
    if (d < 14) done = true;
    else {
      const aim =
        d < 160 && walkable(m.x, m.y, ...leg.to)
          ? leg.to
          : heading(flowFrom([openNear(...leg.to)]), m.x, m.y) || leg.to;
      const brd = s.hang.brd || {},
        bh = dp() && boardsAhead(m, aim, brd);
      if (bh) breakBoards(s, bh.o.id, now); // (a boarded hole in his way: he breaks it)
      stepZombie(m, aim, far, []);
    }
  }
  if (done && leg.brk) breakBoards(s, leg.brk, now);
  const dx = m.x - m0.x;
  s.hang.l4m = {
    ...m0,
    x: Math.round(m.x),
    y: Math.round(m.y),
    f: Math.abs(dx) > 0.5 ? Math.sign(dx) : m0.f,
    sp: Math.round((mh(s).sp ?? 1) * 100) / 100, // (his sprint left, online for his meter: a player's thin blue bar, l4dd.js)
    ...(leg.c ? { c: 1 } : {}),
    ...(leg.jump ? { st: "jump" } : {}),
  };
  if (done) setMh(s, { p: (h.p || 0) + 1 });
}
/* running away, does he sprint this step? Only if he has to (a zombie near, or just hurt by a player) and has breath
   left; it drains in L4.SPRINT ms and fills again as slowly, and once empty he walks until it's full (h.sp: what's
   left, 0 to 1; h.tired) */
function merchantSprints(s, m, now, dt) {
  const h = mh(s);
  let sp = h.sp ?? 1,
    tired = !!h.tired,
    run = false;
  const must =
    (m.st === "out" || m.st === "flee") &&
    (now - (h.hurtAt || 0) < MERCH.HURT_MS ||
      zombies(s).some(
        (z) => z.st !== 3 && Math.hypot(z.x - m.x, z.y - m.y) < MERCH.CHASED,
      ));
  if (must && !tired && sp > 0) {
    sp = Math.max(0, sp - (dt * 1000) / L4.SPRINT);
    if (sp <= 0) tired = true;
    run = true;
  } else {
    sp = Math.min(1, sp + (dt * 1000) / (L4.SPRINT * GAME_SPRINT.refill));
    if (sp >= 1) tired = false;
  }
  setMh(s, { sp, tired });
  return run;
}
/* the boards of opening `o` torn down at once (the merchant on his way in: "breaks the barricade (the wooden
   barricade) IF it is in the way") */
function breakBoards(s, o, now) {
  const brd = s.hang.brd || {};
  if (!(brd[o] > 0)) return;
  s.hang.brd = { ...brd, [o]: 0 };
  addFx(s, { kind: "l4mbreak", o, who: [], t: now });
}
/* is (x, y) by him while he's selling? */
const atMerchant = (s, x, y) => {
  const m = merchantOf(s);
  return (
    !!m && m.st === "here" && Math.hypot(m.x - x, m.y - y) <= SHOP_REACH * 2
  );
};
/* a buy from his stock: into my slots, as the fireplace's (an item of mine that's used up: full again) */
function merchantBuy(s, id, w, mx, my, hand, now) {
  const m = merchantOf(s);
  if (!atMerchant(s, mx, my)) return false;
  const i = m.stock.findIndex(([x]) => x === w),
    kit = kitOf(s, id);
  if (i < 0 || !kit) return false;
  const price = stockPrice(s, m.stock[i][1]),
    have = kit.sl.includes(w);
  if (ptsOf(s, id) < price) return false;
  if (have && w === "defib") {
    const c = (kit.am || {}).defib || [0, 0];
    s.hang.l4a = {
      ...s.hang.l4a,
      [id]: { ...kit, am: { ...kit.am, defib: [c[0] + 1, 0] } },
    }; // (they stack: one more)
  } else if (have) {
    if (kindOf(w) !== "special" || hasLeft(s, id, w)) return false; // (one I have, or a gun of mine: no ammo from him)
    s.hang.l4a = {
      ...s.hang.l4a,
      [id]: { ...kit, am: { ...kit.am, [w]: fullAmmo(w) } },
    };
  } else if (!give(s, id, w, hand)) return false;
  addPts(s, id, -price);
  soldSays(
    s,
    id,
    `bought the ${weaponName(w)} from the merchant for ${price}.`,
  );
  addFx(s, { kind: "l4buy", by: id, who: [], w, t: now }); // (the cash register: l4ddsfx.js)
  const left = (m.stock[i][2] || 1) - 1;
  s.hang.l4m = {
    ...m,
    stock: left
      ? m.stock.map((x, k) => (k === i ? [x[0], x[1], left] : x))
      : m.stock.filter((_, k) => k !== i),
  }; // (one fewer; the last one bought, gone for this visit)
  return true;
}

/* ---------- the weapons (rules.js sends the 'use' and 'reload' actions here) ---------- */
const aimDir = (a) => {
  const ax = (+a.ax || 0) * W,
    ay = (+a.ay || 0) * H,
    l = Math.hypot(ax, ay);
  return l > 1e-6 ? [ax / l, ay / l] : [a.face < 0 ? -1 : 1, 0];
};
/* a reload that's done: the magazine fills from the rest */
function finishReload(m, now) {
  if (!m.rl || now < m.rl) return false;
  const w = m.rw,
    c = m.am && m.am[w];
  if (w === "dg" && m.dg !== undefined)
    m.dg = ARMS.handgun.mag; // (the down pistol: its bullets never run out)
  else if (c && magIn(m, w)) {
    const k = Math.min((m.rf || magIn(m, w)) - c[0], c[1]); // (rf: what it fills to, one more for a full one)
    m.am = { ...m.am, [w]: [c[0] + k, c[1] - k] };
  }
  m.rl = 0;
  m.rw = "";
  return true;
}
/* R: the ranged weapon in hand reloads (one with a magazine, not full, with bullets left) */
function startReload(s, id, m, w, now) {
  if (w === "dg") {
    if (m.rl || m.dg === undefined || m.dg >= ARMS.handgun.mag) return false;
    m.rt = reloadOf(s, id, "handgun", [m.dg, ARMS.handgun.mag]);
    m.rl = now + m.rt;
    m.rw = "dg";
    return true;
  } // (the down pistol)
  const c = m.am[w];
  if (!magIn(m, w) || !c || m.rl) return false;
  if (m.lm && m.lm[w] && m.lm[w].r === 0) return false; // (Sandbox's loot: Reload off, sbloot.js)
  const to = loadTo(w, c[0], magIn(m, w)); // (a full one: one more in the chamber, faster: guns.js)
  if (!to || c[1] <= 0) return false;
  m.rt = reloadOf(s, id, w, c) * to[1];
  if (to[1] < 1) m.rf = to[0];
  else delete m.rf;
  m.rl = now + m.rt;
  m.rw = w;
  return true;
}
export function l4Reload(s, a, now) {
  const m0 = kitOf(s, a.id),
    down = downArmed(s, a.id),
    w = down ? "dg" : l4Holds(s, a.id, a.w) ? a.w : (s.pos[a.id] || {}).w;
  if (!m0 || !(down || (standing(s, a.id) && l4Holds(s, a.id, w))))
    return false;
  const m = { ...m0 };
  finishReload(m, now);
  if (!startReload(s, a.id, m, w, now)) return false;
  s.hang.l4a = { ...s.hang.l4a, [a.id]: m };
  return true;
}
/* what the power box's rules (l4ddpower.js) use of these */
const PH = {
  players: (s) => players(s),
  standing: (s, id) => standing(s, id),
  ptsOf: (s, id) => ptsOf(s, id),
  addPts: (s, id, n) => addPts(s, id, n),
  addFx: (s, f) => addFx(s, f),
  playable: (x, y) => playable(x, y),
  dropSpot: (s) => dropSpot(s),
  kitOf: (s, id) => kitOf(s, id),
  give: (s, id, w, hand) => give(s, id, w, hand),
  full: (w) => fullAmmo(w),
  arm: (w) => ARMS[w],
  weapons: WEAPONS,
  /* the world's size now (layout.js changes it for Downpour): read when used, never kept from when this was made, or
     on Downpour a duck stood on a part and never took it (the owner's, Nov 17 05:46Z: the restroom's pickup) */
  get W() {
    return W;
  },
  get H() {
    return H;
  },
};
export const addFx = (s, f) => {
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, ...f }];
  return s.fxN;
};
export function l4Use(s, a, now) {
  const id = a.id,
    what = String(a.what || ""),
    p = s.pos[id],
    L = s.hang && s.hang.l4,
    m0 = kitOf(s, id),
    A = ARMS[what],
    kind = kindOf(what),
    down = what === "handgun" && downArmed(s, id), // (the down pistol: the only thing a downed duck uses)
    rw = down ? "dg" : what;
  if (!L || L.over || !p || !m0 || !(down || standing(s, id)) || !A)
    return false;
  if (!down && kind !== "grenade" && !m0.sl.includes(what)) return false;
  if ((kind === "melee" || kind === "ranged") && swims(s, id)) return false; // (swimming: put away)
  if (what === "safekeep") return false; // (never by hand: it works by itself)
  if (what === "defib") return false; // (only on a dead player: the revive's hold, defibUse)
  const m = { ...m0, u: { ...m0.u }, am: { ...m0.am } };
  finishReload(m, now);
  if (
    waiting(
      GATE_BREEDS.maps,
      { auto: !!A.auto, cool: l4Cool(s, id, what), last: m.u[what] || 0 },
      now,
    )
  )
    return false; // (weaponuse.js: full auto's shots may come a little bunched over the network)
  const c = down ? [m.dg, ARMS.handgun.mag] : m.am[what];
  if (kind === "grenade" ? m.g <= 0 : c && (c[0] <= 0 || m.rw === rw))
    return false; // (empty, or reloading)
  if (what === "medkit" && (P4(s, id) || {}).hp >= maxHp(s, id)) return false; // (nothing to heal)
  if (heldBack(s, what, () => laserHeat(s, id, now).over)) return false; // (one zebra cake in the room at a time; the Laser Rifle overheated)
  m.u[what] = now;
  if (m.rw && m.rw !== rw) {
    m.rl = 0;
    m.rw = ""; // (something else used before the reload was done: it's lost, the owner's, Nov 16)
  }
  const [dx, dy] = aimDir(a),
    face = dx < 0 ? -1 : 1,
    [px, py] = toPx(p),
    hz = Math.round(zOf(p, "body", now));
  const n = addFx(s, {
    kind: "use",
    what,
    by: id,
    who: [id],
    face,
    t: now,
    ax: +(dx / W).toFixed(5),
    ay: +(dy / H).toFixed(5),
  });
  const dual = what === "handgun" && angelOf(s, id, what), // (the Angelic pistols: they take turns, one bullet each press)
    many = roundsOf(A, c && c[0]); // (the burst rifle: three rounds a press, or the rest of its clip)
  if (dual) m.alt = (m.alt || 0) ^ 1; // (which pistol fires: the left, then the right …)
  /* God mode's switches (sbgod.js): items (grenades, medkits, chairs …) and ammo never run out; no reloading keeps the
     magazine full while the spare rounds go down */
  const item = kind === "grenade" || kind === "special",
    spare = godHas(s, id, item ? "items" : "ammo");
  if (kind === "grenade") {
    if (!spare) m.g--;
  } else if (down) {
    if (!spare) {
      const shot = afterShots(c[0], 1);
      m.dg = shot.left;
      if (shot.empty) startReload(s, id, m, "dg", now);
    }
  } else if (c && !spare) {
    if (godHas(s, id, "reload") && c[1] > 0)
      m.am[what] = [c[0], Math.max(0, c[1] - many)];
    else {
      const shot = afterShots(c[0], many);
      m.am[what] = [shot.left, c[1]];
      if (shot.empty) startReload(s, id, m, what, now); // (empty: it reloads by itself)
    }
  }
  if (kind === "melee") {
    s.hang.l4k = swingOn(
      s.hang.l4k,
      {
        by: id,
        w: what,
        dx,
        dy,
        t: now,
        hit: [],
        ...(swingMisses(what) ? { miss: 1 } : {}), // (the pan: it swings through nothing)
      },
      now,
    );
    meleeHits(s, now);
  } else if (what === "medkit") {
    const p4 = s.hang.l4p || {};
    s.hang.l4p = { ...p4, [id]: { ...p4[id], hp: maxHp(s, id), at: now } };
    if (!spare) m.am.medkit = [0, 0]; // (used up: it stays in its slot, empty, the owner's, Nov 18 12:19Z)
  } else if (what === "adrenaline")
    s.hang.l4ad = { ...(s.hang.l4ad || {}), [id]: now + A.ms };
  else if (what === "zebra") cakeOut(s, id, p, dx, dy, now);
  else if (what === "chaingun") trace(s, id, px, py, dx, dy, hz, now);
  else if (what === "laser") laser(s, id, m, px, py, dx, dy, hz, now);
  else if (what === "flamer") flame(s, id, m, px, py, dx, dy, hz, now);
  else {
    const shot = (k, ux, uy, v, more) => ({
      n,
      by: id,
      w: what,
      k,
      x0: p.x,
      y0: p.y,
      vx: +((ux * v) / W).toFixed(5),
      vy: +((uy * v) / H).toFixed(5),
      t: now,
      lx: p.x,
      ly: p.y,
      hz,
      hin: inCabin(px, py) ? 1 : 0,
      ...more,
    });
    if (A.pellets) {
      const out = coneOf(Math.atan2(dy, dx), A.pellets, A.spread).map((an, i) =>
        shot(shotKind(what), Math.cos(an), Math.sin(an), A.speed * FASTER, {
          n: n * 10 + i,
          life: A.life,
        }),
      );
      s.shots = [...(s.shots || []), ...out];
    } else {
      const v =
          what === "grenade"
            ? ARMS.grenade.far / (GRENADE_MS / 1000)
            : A.speed * (BULLETS.has(what) ? FASTER : 1), // (arrows, bullets and daggers: a little faster, as in every mode)
        k = shotKind(what); // (the new guns' bullets each look their own way)
      const out = [];
      for (let i = 0; i < many; i++)
        out.push(
          shot(k, dx, dy, v, {
            ...(what === "glauncher"
              ? { life: (A.far / A.speed) * 1000 }
              : roundAt(n, i, now, A.gap || 60)),
            ...(dual ? { al: m.alt } : {}), // (the Angelic pistols: which one fired it, game.js' muzzle flash)
          }),
        ); // (a burst's rounds leave one after another: each waits until its time, t)
      s.shots = [...(s.shots || []), ...out];
    }
  }
  if (!down && m.lm && m.lm[what] && m.lm[what].b) emptyBreaks(s, id, m, what);
  s.hang.l4a = { ...s.hang.l4a, [id]: m };
  return true;
}
/* Sandbox's loot, Breaks when empty (plan Loot 3: "when its ammo or count reaches 0, the item breaks and leaves the
   hotbar, its slot empty ... It looks and sounds the same as a melee weapon breaking"): kit m, weapon w just used */
function emptyBreaks(s, id, m, w) {
  const c = m.am[w],
    i = (m.sl || []).indexOf(w);
  if (i < 0 || !c || c[0] > 0 || c[1] > 0) return;
  m.sl = [...m.sl];
  m.sl[i] = "";
  m.am = { ...m.am };
  delete m.am[w];
  m.lm = { ...m.lm };
  delete m.lm[w];
  if (m.rw === w) {
    m.rl = 0;
    m.rw = "";
  }
  s.hang.l4brk = { n: ((s.hang.l4brk || {}).n || 0) + 1, by: id }; // (everyone hears it break: l4ddsfx.js)
}
/* the zombies one of duck by's shots from weapon w goes through (0: it stops at the first): the sniper's 3; Angelic,
   the bow through one zombie and the sniper through two more (l4ddangel.js) */
export const pierceOf = (s, by, w) =>
  !angelOf(s, by, w)
    ? (ARMS[w] && ARMS[w].pierce) || 0
    : w === "bow"
      ? ANGEL.BOW
      : w === "sniper"
        ? ARMS.sniper.pierce + ANGEL.SNIPER
        : (ARMS[w] && ARMS[w].pierce) || 0;
/* a hit from duck by's weapon w on a zombie anywhere else (Mad God Justin's waves: the owner's, Nov 17 16:23Z, "guns do
   their normal damage from zombies"), as it lands on one here: null when it misses (missOf), else { dmg, crit }. A
   crit (headOf) doubles it, and blows the head off only if it kills (the taker's to say: crit and dead); the
   grenades' blasts take all its HP; Angelic adds its 1. The Laser Rifle never misses or crits (laser, below) */
export const ALL_HP = 999;
/* Survival: every bullet, pellet, arrow, thrown dagger and beam a duck fires does 0.5 less (the owner's, Nov 20 04:09Z,
   "reduce all ammo by 0.5 damage"); never under 0.5. Melee, grenades and the merchant's own gun stay as they were */
const SV_GUN_LESS = 0.5;
const svGun = (s, by, w, dmg0) => {
  const lm = by && w && lmOf(s, by, w), // (Sandbox's loot: its own damage, or a share of its own, sbloot.js)
    dmg = !lm
      ? dmg0
      : lm.d != null
        ? lm.d
        : lm.dp != null
          ? Math.max(0.1, hundredths((dmg0 * lm.dp) / 100))
          : dmg0;
  return survOn() && by && s.players[by] && ARMS[w] && ARMS[w].kind === "ranged"
    ? Math.max(0.5, hundredths(dmg - SV_GUN_LESS))
    : dmg;
};
export function zombieTakes(s, by, w) {
  const A = ARMS[w];
  if (!A) return { dmg: 1, crit: false };
  const beam = w === "laser";
  if (!beam && Math.random() < missOf(w)) return null;
  const crit = !beam && Math.random() < headOf(s, by, w),
    all = A.dmg === "all" || w === "grenade" || w === "glauncher";
  return {
    dmg: all
      ? ALL_HP
      : (svGun(s, by, w, dmgOf(A)) +
          (!beam && angelOf(s, by, w) ? ANGEL.DMG : 0)) *
        (crit ? 2 : 1) *
        (A.kind === "melee" ? sizeOf(s, by) : 1), // (a melee's, times its swinger's Size: push.js)
    crit,
  };
}
/* a zombie takes damage from a duck, and the duck gets its points: 5 for each HP it took, or 25 for a headshot. A crit
   doubles the damage; one that kills blows the head off with a CRIT over it (the owner's, Nov 21 17:25Z: "a critical hit
   on any duck will give a headshot effect only if it is the killing blow"); true when it died */
function strike(s, z, dmg, crit, by, w = "", now = 0) {
  if (z.st === 3) return false;
  dmg = svGun(s, by, w, dmg);
  if (w && w !== "laser" && angelOf(s, by, w)) dmg += ANGEL.DMG; // (Angelic: +1, l4ddangel.js; the Laser Rifle has its own, laser)
  if (crit) dmg *= 2;
  const on = s.hang.l4on || {},
    all = !!on.kill, // (Instant Kill: every hit takes all its HP, 5 points for each)
    took = all ? z.hp : Math.min(z.hp, dmg);
  z.hp = all ? 0 : hpHurt(z.hp, dmg);
  const head = !!crit && z.hp <= 0;
  if (w) wound(s, z, w, crit);
  if (crit)
    addFx(s, {
      kind: "l4crit",
      by,
      z: z.i,
      who: [],
      t: now,
      x: Math.round(z.x),
      y: Math.round(z.y),
      ...(head ? {} : { m: 1 }),
    }); // (every crit shows a small CRIT; m: only the mark, it didn't kill: Adam, Nov 21 18:31Z)
  addPts(s, by, (head ? PTS.HEAD : PTS.HIT * took) * (on.double ? 2 : 1));
  if (z.hp <= 0) {
    /* the zombies each duck killed this game (the overall stats' Zombies killed: l4dd.js record) */
    if (by && s.players[by])
      s.hang.l4kz = {
        ...(s.hang.l4kz || {}),
        [by]: ((s.hang.l4kz || {})[by] || 0) + 1,
      };
  }
  return z.hp <= 0;
}
/* the wounds a hit leaves (owner 2026-11-04 04:01Z), drawn by wounds.js hitsOf: zw { i: "B3c1…" }, two letters for
   each, its kind and its spot (0 … 7, or 0 … 5 for an arrow or a chunk). Small guns leave small bullet holes, the big
   ones big holes, the shotgun its pellets, now and then a bleeding cut instead; knives cut; the hammer and the chair
   bruise; an arrow cuts or stays stuck in it; a bullet now and then tears a chunk out, or the beak off; a headshot
   blows the head off. At most 6 on a zombie, and a headless one keeps its head off */
function wound(s, z, w, crit) {
  const zw = s.hang.zw || {},
    had = zw[z.i] || "";
  const wd = hitWounds(had, w, WOUND_BREEDS.zombie, {
    head: crit,
    dead: z.hp <= 0,
  }); // (wounds.js)
  if (wd !== had) s.hang.zw = { ...zw, [z.i]: wd };
}
/* a mark that comes once and stays, past the 6 wounds (owner 2026-11-04 06:44Z): g a grenade's gore, f burnt by fire */
function mark(s, z, code) {
  const zw = s.hang.zw || {},
    had = zw[z.i] || "";
  if (!had.includes(code)) s.hang.zw = { ...zw, [z.i]: had + code };
}
/* a crit, now and then (the weapon's chance and the duck's Accuracy): strike doubles it */
const critRoll = (s, by, w) => Math.random() < headOf(s, by, w);
/* a miss, now and then (missOf): the hit doesn't land, and every screen shows "missed" over that zombie */
function missed(s, by, w, z, now) {
  if (Math.random() >= missOf(w)) return false;
  addFx(s, {
    kind: "l4miss",
    by,
    z: z.i,
    who: [],
    t: now,
    x: Math.round(z.x),
    y: Math.round(z.y),
  });
  return true;
}
/* the chain gun: it hits at once, along the aim to the first zombie or wall (4 to 5 to that zombie); every screen draws
   the thin yellow line (the l4line fx) */
function trace(s, id, px, py, dx, dy, hz, now) {
  const A = ARMS.chaingun,
    zs = zombies(s),
    T = now - s.hang.l4.t0,
    most = angelOf(s, id, "chaingun") ? ANGEL.CHAIN : 1, // (Angelic: through two zombies, l4ddangel.js)
    hits = [],
    past = []; // (the ones it missed: it goes on past them)
  let x = px,
    y = py;
  for (let d = 0; d < A.far; d += 12) {
    const nx = x + dx * 12,
      ny = y + dy * 12;
    if (walled(nx, ny, hz)) break;
    x = nx;
    y = ny;
    if (wildHurt(s, id, x, y, now, "chaingun", 26, 22, [px, py, hz])) break; // (Justin in its way: it hits him and stops there, the owner's, Nov 17 20:37Z: "YOU CAN USE A FUCKING CHAIN GUN AND HE WILL DODGE EVERY FUCKING BULLET")
    const hit = zs.find(
      (z) =>
        z.st !== 3 &&
        !hits.includes(z) &&
        !past.includes(z) &&
        Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
        canShoot(z, px, py, hz),
    );
    if (hit) (missed(s, id, "chaingun", hit, now) ? past : hits).push(hit);
    if (hits.length >= most) break;
  }
  for (const hit of hits)
    if (
      strike(s, hit, dmgOf(A), critRoll(s, id, "chaingun"), id, "chaingun", now)
    )
      die(hit, T);
  if (hits.length) store(s, zs, true);
  addFx(s, {
    kind: "l4line",
    by: id,
    who: [],
    t: now,
    x0: Math.round(px + dx * 40),
    y0: Math.round(py + dy * 40),
    x1: Math.round(x),
    y1: Math.round(y),
    hz,
  });
}
/* the Laser Rifle's beam: at once, along the aim to the first wall, through every zombie on its line, 1 to each and
   never a crit or a miss (Angelic: each has a 1 in 3 chance of taking 2); one it kills is left burnt (the charred look,
   not on fire). Then its heat goes up a beam (laserHeat); a beam with the meter already full overheats it: every
   screen hears the hiss and sees its duck burnt and shaking (the l4hot fx). Every screen draws the red beam (the l4line
   fx, w: "laser"), with where it went through each zombie (hit) for their blood */
function laser(s, id, m, px, py, dx, dy, hz, now) {
  const A = ARMS.laser,
    holy = angelOf(s, id, "laser"),
    zs = zombies(s),
    T = now - s.hang.l4.t0,
    hits = [];
  let burnt = false,
    x = px,
    y = py;
  for (let d = 0; d < A.far; d += 12) {
    const nx = x + dx * 12,
      ny = y + dy * 12;
    if (walled(nx, ny, hz)) break;
    x = nx;
    y = ny;
    if (!burnt && wildHurt(s, id, x, y, now, "laser", 26, 22, [px, py, hz]))
      burnt = true; // (Justin on its line: 1, once a beam; it goes on through him)
    for (const z of zs)
      if (
        z.st !== 3 &&
        !hits.includes(z) &&
        Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
        canShoot(z, px, py, hz)
      )
        hits.push(z);
  }
  for (const z of hits) {
    const dmg = holy && Math.random() < ANGEL.LASER.two ? 2 : A.dmg;
    if (strike(s, z, dmg, false, id, "laser")) {
      mark(s, z, "f0");
      die(z, T);
    }
  }
  if (hits.length) store(s, zs, true);
  const next = laserNext(s, id, now);
  m.lz = next.lz;
  if (next.hot) addFx(s, { kind: "l4hot", by: id, who: [], t: now });
  addFx(s, {
    kind: "l4line",
    w: "laser",
    by: id,
    who: [],
    t: now,
    x0: Math.round(px + dx * 40),
    y0: Math.round(py + dy * 40),
    x1: Math.round(x),
    y1: Math.round(y),
    hz,
    hit: hits.map((z) => [Math.round(z.x), Math.round(z.y)]),
  });
}
/* the zebra cake: thrown the way I aim, it lands at its range or where a wall stops it (rules.js' s.zcake, so every
   screen draws it as the Zebra cake special's); every zombie goes for it and bites it until it's gone (moveZombies) */
export const CAKE_R = 40, // world px: how near a zombie bites it
  CAKE_BITE = 900; // ms a zombie stands there chewing
function cakeOut(s, id, p, dx, dy, now) {
  const A = ARMS.zebra,
    [px, py] = toPx(p),
    hz = Math.round(zOf(p));
  let t = 0;
  while (t < A.far / A.speed) {
    const n = t + 0.02;
    if (walled(px + dx * A.speed * n, py + dy * A.speed * n, hz)) break;
    t = n;
  }
  /* (a secret, kept out of Updates: a cake landing in the bathroom, near the toilet, goes in the bowl, and Justin
     teleports in and eats it there for as long as it lasts; the zombies leave that one be. Off since Nov 16, with
     HELPER.on: Justin is never dropped into this mode) */
  const lx = px + dx * A.speed * t,
    ly = py + dy * A.speed * t,
    bowl =
      HELPER.on &&
      inBath(lx, ly) &&
      Math.hypot(lx - TOILET.x, ly - TOILET.y) <= TOILET.near;
  if (bowl) {
    const d = Math.hypot(TOILET.x - px, TOILET.y - py) || 1;
    dx = (TOILET.x - px) / d;
    dy = (TOILET.y - py) / d;
    t = d / A.speed;
  }
  s.zcake = {
    n: s.fxN,
    by: id,
    x0: p.x,
    y0: p.y,
    vx: +((dx * A.speed) / W).toFixed(5),
    vy: +((dy * A.speed) / H).toFixed(5),
    t: now,
    stop: now + Math.round(t * 1000),
    eat: 0,
    hin: inCabin(px, py) ? 1 : 0,
    ...(bowl ? { toilet: TOILET.z } : {}),
  };
}
/* the toilet's bowl (world px; z: how high the cake sits in it) and how near a cake must land: 4 duck lengths */
export const TOILET = { x: 3752, y: 1150, z: 26, near: 4 * RX };
const inBath = (x, y) => x > 3500 && x < 3900 && y > 1100 && y < 1450;
/* where the cake lies (world px), once it has landed and while nobody ate it */
export function cakeDown(s, now) {
  const c = s.zcake;
  if (!c || c.eat || c.toilet || now < c.stop) return null; // (the one in the toilet: Justin's)
  const t = (c.stop - c.t) / 1000;
  return [(c.x0 + c.vx * t) * W, (c.y0 + c.vy * t) * H];
}
/* fire, every heartbeat (BURN): burning zombies lose 1 every 3 s, the ducks' fires go out, and anyone burning lights a
   duck touched. s.hang.l4fire = { z: { zombie: [until, next hurt, by, when its fire spreads] }, p: { id: until } } */
function light(s, z, by, now) {
  mark(s, z, "f0"); // (burnt for good, even once the fire is out)
  const F = s.hang.l4fire || {};
  s.hang.l4fire = {
    ...F,
    z: {
      ...(F.z || {}),
      [z.i]: [now + BURN.Z, now + BURN.EVERY, by, now + BURN.SPREAD],
    },
  };
}
/* a zombie in the flamethrower's fire (or touching one it lit, or on a patch of its burning ground): lit (1 HP as it's
   lit), or, burning already, its fire goes on BURN.Z ms more from now (its next hurt stays). Its fire spreads from
   BURN.SPREAD ms after it was lit (the 4th). True when it died */
function catchFire(s, z, by, now, T) {
  if (wetZ(z)) return false; // (in the water: never lit)
  const F = s.hang.l4fire || {},
    f = (F.z || {})[z.i];
  if (f && now < f[0]) {
    if (f[0] - now < BURN.Z - 250 || !f[3])
      s.hang.l4fire = {
        ...F,
        z: {
          ...F.z,
          [z.i]: [now + BURN.Z, f[1], f[2], f[3] || now + BURN.SPREAD],
        },
      }; // (a quarter second at a time: not a new object every puff)
    return false;
  }
  if (strike(s, z, 1, false, by)) {
    die(z, T);
    mark(s, z, "f0");
    return true;
  }
  light(s, z, by, now);
  return false;
}
/* the flamethrower (flamer.js), one puff: it reaches farther the longer it's held, up to a wall; every zombie in its
   cone catches fire, and the ground at its end burns for a while. s.hang.l4fl = { id: [the hold's start, this puff,
   ax, ay, reach] } (every screen draws the stream from it: l4dd.js), s.hang.l4gf = [[x, y, until, by, h]] the burning
   patches (h: the height of the floor each is on) */
function flame(s, id, m, px, py, dx, dy, hz, now) {
  const fl = { ...(s.hang.l4fl || {}) },
    was = fl[id],
    t0 = was && now - was[1] < FLAME.GAP ? was[0] : now,
    D = FLAME.DUCK,
    ang = angelOf(s, id, "flamer"), // (Angelic: farther, sooner, and its ground burns longer: l4ddangel.js)
    far0 =
      flameReach((now - t0) * (ang ? ANGEL.FLAME_SOON : 1)) *
      D *
      (ang ? ANGEL.FLAME_FAR : 1);
  let far = 24;
  while (far < far0 && !walled(px + dx * (far + 12), py + dy * (far + 12), hz))
    far += 12; // (a wall cuts the stream short)
  fl[id] = [t0, now, +dx.toFixed(3), +dy.toFixed(3), Math.round(far)];
  s.hang.l4fl = fl;
  const zs = zombies(s),
    T = now - s.hang.l4.t0;
  let any = false;
  /* the stream goes as a bullet does (the owner's, Nov 19 21:59Z: "The fire that's shot from a flamethrower can in the
     ways in which the bullets do, but it cannot go through the bottom of the roof"): over a roof's ledge, never under
     a roof to one below it, nor up through one (canShoot: layout.js slabBetween) */
  for (const z of zs)
    if (
      z.st !== 3 &&
      inCone((z.x - px) / D, (z.y - py) / D, dx, dy, far / D + 0.4) &&
      canShoot(z, px, py, hz)
    ) {
      catchFire(s, z, id, now, T);
      any = true;
    }
  if (any) store(s, zs, true);
  for (const j of wilds(s)) {
    const jp = s.pos[j],
      [jx, jy] = toPx(jp);
    if (
      inCone((jx - px) / D, (jy - py) / D, dx, dy, far / D + 0.4) &&
      !slabBetween(px, py, hz, jx, jy, zOf(jp))
    )
      wildFire(s, j, id, now); // (Justin with no weapon burns too)
  }
  if (L4_HOOKS.gm && s.hang.gm)
    L4_HOOKS.gm.fire(
      s,
      id,
      now,
      (x, y, z = heightAt(x, y)) =>
        inCone((x - px) / D, (y - py) / D, dx, dy, far / D + 0.4) &&
        !slabBetween(px, py, hz, x, y, z),
      gmHelp(s, now),
    ); // (Survival's gunmen in the flame, as the zombies: over a ledge, never under a roof; gunmenrules.js)
  const mm = merchantOf(s);
  if (
    mm &&
    mm.st !== "dead" &&
    mm.st !== "jump" &&
    now - (mm.burnt || 0) >= BURN.EVERY &&
    inCone((mm.x - px) / D, (mm.y - py) / D, dx, dy, far / D + 0.4) &&
    !slabBetween(px, py, hz, mm.x, mm.y, heightAt(mm.x, mm.y))
  ) {
    s.hang.l4m = { ...mm, burnt: now };
    merchantHurt(s, id, 1, now, "flamer"); // (the merchant in the flame: 1 HP, once every 3 s while he's in it)
  }
  const gx = px + dx * far,
    gy = py + dy * far,
    gd = deckAt(gx, gy, hz),
    gz = floorH(gx, gy, hz); // (the floor it lands on: the roof I'm on, or the ground past its ledge)
  if (
    now - (m.gf || 0) >= FLAME.PATCH &&
    !(flood(gx, gy) && !gd) &&
    !(dp() && slabBetween(px, py, hz, gx, gy, gz)) // (none under a roof I'm on top of)
  ) {
    m.gf = now;
    s.hang.l4gf = [
      ...(s.hang.l4gf || []).filter((g) => g[2] > now).slice(1 - FLAME.MOST),
      [
        Math.round(gx),
        Math.round(gy),
        now + FLAME.GROUND + (ang ? ANGEL.FLAME_GROUND : 0),
        id,
        Math.round(gz),
      ],
    ];
  }
}
/* every heartbeat: the flamethrower's fire spreads to the zombies that touch one burning, once that one has burnt
   BURN.SPREAD ms (half a second), and so on from each one it lights; the burning ground lights any zombie on it; old
   streams and patches go (the owner's, Nov 18 13:46Z: "make sure the zombies burn other zombies it touches relatively
   easier AND it takes 0.5 seconds AFTER a zombie is on fire for it's flame to spread to other zombies, and this repeats
   for every zombie on fire"). Fire never crosses floors (the owner's, Nov 19 21:59Z: "Fire does not spread across
   verticality ... the flame that spreads between zombies, they actually have to touch the zombie on the same elevation
   level"): a patch lights only a zombie on its own floor (its height, g[4]), and a burning zombie only one at its own
   height (SAME_FLOOR), so one on a roof and one below never light each other */
const TOUCH_Z = 2.2; // (in a zombie's hit room, 26 by 22 world px: was 1.6, now a little farther, so it catches easier)
function flameTick(s, zs, now, T) {
  const gf = s.hang.l4gf;
  if (gf && gf.length) {
    const left = gf.filter((g) => g[2] > now),
      r = FLAME.PATCH_R * FLAME.DUCK;
    if (left.length !== gf.length) s.hang.l4gf = left.length ? left : null;
    for (const [x, y, , by, h] of left)
      for (const z of zs)
        if (
          z.st !== 3 &&
          Math.hypot(z.x - x, (z.y - y) * 1.3) < r &&
          (!dp() || Math.abs(zOf(z, "zombie") - (h || 0)) < SAME_FLOOR)
        )
          catchFire(s, z, by, now, T);
  }
  const fz = (s.hang.l4fire || {}).z;
  if (fz) {
    const hot = zs.filter(
      (z) =>
        z.st !== 3 &&
        fz[z.i] &&
        fz[z.i][3] &&
        now >= fz[z.i][3] &&
        fz[z.i][0] > now,
    );
    for (const a of hot)
      for (const b of zs)
        if (
          b !== a &&
          b.st !== 3 &&
          !(fz[b.i] && fz[b.i][0] > now) &&
          Math.hypot((a.x - b.x) / 26, (a.y - b.y) / 22) < TOUCH_Z &&
          (!dp() || Math.abs(zOf(a, "zombie") - zOf(b, "zombie")) < SAME_FLOOR)
        )
          catchFire(s, b, fz[a.i][2], now, T);
  }
  const fl = s.hang.l4fl;
  if (fl && Object.values(fl).some((f) => now - f[1] > 1000)) {
    const keep = {};
    for (const [id, f] of Object.entries(fl))
      if (now - f[1] <= 1000) keep[id] = f;
    s.hang.l4fl = Object.keys(keep).length ? keep : null;
  }
}
export function fireTick(s, zs, now, T, p4) {
  flameTick(s, zs, now, T);
  const F = s.hang.l4fire;
  if (!F) return;
  const fz = { ...(F.z || {}) },
    fp = { ...(F.p || {}) };
  for (const k of Object.keys(fz)) {
    const z = zs.find((q) => q.i === +k),
      f = fz[k];
    if (!z || z.st === 3 || now >= f[0] || wetZ(z)) {
      delete fz[k];
      continue;
    } // (gone, out, or in the water: put out)
    if (now >= f[1]) {
      if (strike(s, z, 1, false, f[2])) die(z, T);
      else fz[k] = [f[0], f[1] + BURN.EVERY, ...f.slice(2)];
    }
  }
  for (const id of Object.keys(fp))
    if (now >= fp[id] + BURN.AGAIN || !standing(s, id)) delete fp[id];
    else if (fp[id] > now && wetDuck(s.pos[id])) fp[id] = now; // (in the water: put out, as its own fire going out)
  const ids = players(s).filter((id) => standing(s, id)),
    hot = [
      ...zs
        .filter((z) => z.st === 2 && fz[z.i])
        .map((z) => ["", z.x, z.y, zFloor(z)]),
      ...ids
        .filter((id) => fp[id] > now)
        .map((id) => [id, ...toPx(s.pos[id]), duckFloor(s.pos[id])]),
    ];
  for (const id of ids) {
    if (fp[id] || dodging(s, s.pos[id], now) || wetDuck(s.pos[id])) continue; // (burning, just put out, mid-jump, or in the water)
    const [x, y] = toPx(s.pos[id]),
      f = duckFloor(s.pos[id]);
    if (
      !hot.some(
        ([o, hx, hy, hf]) => o !== id && hf === f && room(hx, hy, x, y) < CLAW,
      )
    )
      continue; // (only one on its own floor: zFloor)
    fp[id] = now + BURN.P;
    if (hurtDuck(s, p4, id, now)) {
      delete fp[id];
      if (isWild(s, id)) pwAdd(s, id, ["f0"], now, true); // (Justin out there, burnt to death: left burnt)
    }
  }
  const out =
    Object.keys(fz).length || Object.keys(fp).length ? { z: fz, p: fp } : null;
  if (JSON.stringify(out) !== JSON.stringify(F)) s.hang.l4fire = out;
}
/* a zombie's claw: 0.6 to 1, in tenths */
export const clawDmg = () => 0.6 + Math.floor(Math.random() * 5) / 10;
/* a duck takes 1 (a claw, fire); true when that put it down. A claw leaves a wound on it now and then, as hits do in
   every other mode, and it goes away by itself 6 to 12 seconds after the duck is up (wounds.js) */
export function hurtDuck(s, p4, id, now, w = "", dmg = 1) {
  const p = p4[id];
  if (!p || p.dn || p.gh || godOn(s, id)) return false; // (God mode: it never dies)
  const safe = invuln(s) || invulnOf(s, id, now); // (Invulnerability, or just up from Safe Keeping: it only flashes)
  const hp = safe ? p.hp : hpHurt(p.hp, dmg); // (dmg: 1, or a Sandbox spawn's damage box; in hundredths, and up while above 0: hpmath.js)
  if (w && !safe) pwHit(s, id, w, now, hp <= 0);
  if (hp > 0) {
    p4[id] = { ...p, hp, at: now };
    return false;
  }
  if (isWild(s, id)) {
    /* Justin out there dies outright: no bleeding out, nobody can get him up, his body stays (the owner's, Nov 18
       12:19Z: "he dies outright, justin does, and only in the zombie mode") */
    p4[id] = { hp: 0, at: now, dn: now + 1e13, ex: 1 };
    if (s.players[id]) s.players[id].dead = true;
    justinSays(s, id, "death"); // (his death line as he falls; nothing after it: justinChat)
    s.hang.still = { ...(s.hang.still || {}), [id]: now + 1e13 };
    return true;
  }
  /* Sandbox's Rules (G): with no down phase it just dies, the bleeding out done at once (the owner's: "is there a down
     phase where they can be revived? Disabled by default. So they just die") */
  p4[id] = {
    hp: 0,
    at: now,
    dn: isSb(s) && !sbRule(s, "down") ? now : now + L4.BLEED,
  };
  downGun(s, id, true);
  if (hasSafe(s, id)) {
    /* Safe Keeping: it gets the duck up, or keeps its stuff if it dies; up at once when nobody else is standing (or a computer), else on E */
    const alone = !players(s).some((o) => {
      const q = p4[o] || P4(s, o);
      return o !== id && !!q && !q.dn && !q.gh;
    });
    p4[id] =
      s.players[id] && !s.players[id].bot && !alone
        ? { ...p4[id], sk: 1 }
        : { ...p4[id], sk: 1, skAt: now + SAFE.GLOW };
  } // (down keeps every upgrade: they go when the duck dies, bleedOut: the owner's, Nov 19 19:27Z, "you do not lose your upgrades. You only lose your upgrades when you die")
  if (s.players[id]) s.players[id].dead = true;
  if (isWild(s, id)) justinSays(s, id, "death"); // (a death line, as he says one in Duck Cabin)
  s.hang.still = { ...(s.hang.still || {}), [id]: now + L4.BLEED + 60000 };
  const b = { ...(s.hang.l4b || {}) };
  delete b[id];
  s.hang.l4b = b;
  return true;
}
/* the down pistol (the owner's, Nov 17 11:07Z): a downed duck holds a pistol of its own with endless bullets that still
   reloads (8 to a magazine, as the pistol's), kept in its kit as dg (the bullets in the magazine); it goes when the duck
   is up again or bleeds out. Never Angelic, whatever pistol the duck has besides */
function downGun(s, id, on) {
  if (on && isWild(s, id)) return; // (Justin out there: no down pistol, the owner's, Nov 17 20:02Z "when he goes down he doesnt have a pistol")
  const kit = kitOf(s, id);
  if (!kit || (!on && kit.dg === undefined)) return;
  const m = { ...kit };
  if (m.rw === "dg" || on) {
    m.rl = 0;
    m.rw = "";
  } // (a reload I was in the middle of: lost)
  if (on) m.dg = ARMS.handgun.mag;
  else delete m.dg;
  s.hang.l4a = { ...s.hang.l4a, [id]: m };
}
export const downArmed = (s, id) =>
  isDown(s, id) && !!kitOf(s, id) && kitOf(s, id).dg !== undefined;
/* a downed duck up again at once: by a medkit (full HP, and the max HP it bought back) or by its own Safe Keeping (spent;
   INV ms of nothing hurting it; it lost nothing) */
function getUp(s, id, now, full, safe) {
  const p4 = { ...(s.hang.l4p || {}) },
    p = p4[id];
  if (!p) return;
  p4[id] = { hp: full ? maxHp(s, id) : L4.BACK_HP, at: now };
  s.hang.l4p = p4;
  downGun(s, id, false);
  if (s.players[id]) delete s.players[id].dead;
  const still = { ...(s.hang.still || {}) };
  delete still[id];
  s.hang.still = still;
  if (safe) {
    const kit = kitOf(s, id);
    if (kit)
      s.hang.l4a = {
        ...s.hang.l4a,
        [id]: { ...kit, am: { ...kit.am, safekeep: [0, 0] } },
      }; // (used up: it stays in its slot, empty)
    s.hang.l4inv = { ...(s.hang.l4inv || {}), [id]: now + SAFE.INV };
    addFx(s, { kind: "l4safe", by: id, who: [id], t: now });
  }
}
/* the melee weapons mid-swing hit every zombie in their bubble, each once */
/* a shot or swing at (x, y) by duck by, on Justin out there with no weapon: he takes 1 (the owner's: players can kill
   him); true when it landed. Whatever reaches him hits him: no dodging by numbers, he only gets out of the way by
   walking (the owner's, Nov 17 20:37Z: "WHEN HE TRIES TO DODGE, IT ISNT SOME ANIMATION THAT IS DONE BY MATH, HE SIMPLLY
   TRIES MOVING OUT THE WAY LIKE A PLAYER DOES! ... Justin isnt supposed to be hard for players to kill"). from: the
   shooter's [x, y, feet], for the one rule (nothing solid between: layout.js slabBetween) */
function wildHurt(
  s,
  by,
  x,
  y,
  now,
  w,
  rx = 26,
  ry = 22,
  from = null,
  npc = true,
  only = null,
) {
  if (merchantShot(s, by, x, y, now, w, rx, ry, from)) return true; // (the merchant in its way: merchantShot)
  if (npc && L4_HOOKS.npc && L4_HOOKS.npc(s, by, x, y, now, w, rx, ry, from))
    return true; // (one of Sandbox's NPCs in its way: sbcabin.js)
  if (
    npc &&
    L4_HOOKS.gm &&
    s.hang.gm &&
    L4_HOOKS.gm.shot(s, by, x, y, now, w, rx, ry, from, null, gmHelp(s, now))
  )
    return true; // (one of Survival's gunmen in its way: gunmenrules.js)
  for (const id of only ? [only] : wilds(s)) {
    const p = s.pos[id],
      q = P4(s, id);
    if (by === id || !isWild(s, id) || !p || !q || q.dn || q.gh) continue;
    const [px, py] = toPx(p);
    if (Math.hypot((px - x) / rx, (py - y) / ry) >= 1) continue;
    if (from && slabBetween(...from, px, py, zOf(p))) continue;
    /* a crit (guns.js critOf, a weapon's chance as on any duck) doubles it, and blows his head off if it puts him down */
    const crit = Math.random() < critOf(w);
    wildDown(s, id, by, now, w, false, crit ? ["x0"] : null, crit ? 2 : 1);
    if (crit)
      addFx(s, {
        kind: "l4crit",
        by,
        who: [],
        t: now,
        x: Math.round(px),
        y: Math.round(py),
        m: 1,
      }); // (the small CRIT over him; his head, if it put him down, is his gore's x0)
    return true;
  }
  return false;
}
/* Justin out there takes a hit of dmg from duck by with weapon w (all: every HP he has, a blast); codes: the gore he's
   left with if it puts him down (the owner's, Nov 17 18:05Z: "all gore works on him"). wildHurt, boom, wildFire */
function wildDown(s, id, by, now, w, all, codes, dmg = 1) {
  const p4 = { ...(s.hang.l4p || {}) };
  if (all && p4[id] && !invuln(s) && !invulnOf(s, id, now))
    p4[id] = { ...p4[id], hp: 1 };
  const was = p4[id] && p4[id].hp,
    down = hurtDuck(s, p4, id, now, w, dmg);
  if (!down && p4[id] && p4[id].hp < was) {
    const [hx, hy] = s.pos[by] ? toPx(s.pos[by]) : toPx(s.pos[id]);
    s.hang.l4jcry = {
      ...(s.hang.l4jcry || {}),
      [id]: { t: now, x: Math.round(hx), y: Math.round(hy) },
    }; // (he cries, and runs from there: CRY)
    if (s.players[by] && by !== id) justinSays(s, id, "angry"); // (a player hurt him: one of his aggressive lines, the owner's, Nov 19 19:27Z: "He should dialogue every time you damage him in an aggressive way, based off of his aggressive lines")
  }
  if (down) {
    if (codes) pwAdd(s, id, codes, now, true);
    if (s.players[by] && !s.players[by].bot) {
      /* a player knocked Justin down: a Justin kill for that player (unlocks.js watchKills), the same numbers rules.js
         justinKilled writes; the owner's, Nov 17 13:30Z */
      if (wildBreedOf(s, id).kill) {
        s.jkN = (s.jkN || 0) + 1;
        s.jk = [...(s.jk || []).slice(-9), { n: s.jkN, by, w }];
      }
      if (Math.random() < POCKET_CHANGE.CHANCE) pocketChange(s, id, now); // (and a rare orb of coins where he fell)
    }
  }
  s.hang.l4p = p4;
}
/* Justin's pocket change: an orb of gold coins lies where he fell, like a drop (the first duck over it takes it, for
   itself: POCKET_CHANGE.POINTS, takeDrop), and the chat says so */
function pocketChange(s, id, now) {
  const [x, y] = toPx(s.pos[id]);
  s.hang.l4dr = [
    ...(s.hang.l4dr || []),
    {
      n: now,
      k: "coins",
      x: Math.round(x),
      y: Math.round(y),
      until: now + DROP.LIFE,
    },
  ];
  say(s, POCKET_CHANGE.SAYS);
}
/* the flamethrower's fire on Justin out there with no weapon: lit as a duck is (1 HP as it's lit, burning BURN.P ms, and
   fireTick spreads it from him), left burnt if it puts him down */
function wildFire(s, id, by, now) {
  const q = P4(s, id),
    F = s.hang.l4fire || {};
  if (by === id || !isWild(s, id) || !q || q.dn || q.gh) return;
  if ((F.p || {})[id] || wetDuck(s.pos[id])) return; // (burning, just put out, or in the water)
  s.hang.l4fire = { z: F.z || {}, p: { ...(F.p || {}), [id]: now + BURN.P } };
  wildDown(s, id, by, now, "flamer", false, ["f0"]);
}
/* a melee weapon wears down by the HP it took off (the owner's, Nov 19 22:41Z): at 0 it is gone, its slot empty, for
   good. Angelic ones never wear; not in Sandbox */
function wearDown(s, by, w, dealt) {
  const kit = kitOf(s, by),
    i = kit ? kit.sl.indexOf(w) : -1;
  if (i < 0 || !(dealt > 0) || !ARMS[w] || !ARMS[w].dur) return;
  if (isSb(s) && !(kit.lm && kit.lm[w] && kit.lm[w].b)) return; // (Sandbox: only with its loot's Breaks when empty)
  if (ARMS[w].kind !== "melee" || angelOf(s, by, w)) return;
  const left = hundredths(durLeft(kit, w) - dealt),
    du = { ...(kit.du || {}) },
    sl = [...kit.sl];
  if (left <= 0) {
    sl[i] = "";
    delete du[w];
    s.hang.l4brk = { n: ((s.hang.l4brk || {}).n || 0) + 1, by }; // (everyone hears it break: l4ddsfx.js)
  } else du[w] = left;
  s.hang.l4a = { ...s.hang.l4a, [by]: { ...kit, sl, du } };
}
function meleeHits(s, now) {
  const ks = (s.hang.l4k || []).filter((k) => swinging(k, now));
  if (!ks.length) {
    if (s.hang.l4k && s.hang.l4k.length) s.hang.l4k = [];
    return false;
  }
  const zs = zombies(s),
    T = now - s.hang.l4.t0;
  let any = false;
  for (const k of ks) {
    const p = s.pos[k.by],
      A = ARMS[k.w] || ARMS.knife;
    if (!p || k.miss || !standing(s, k.by)) continue;
    const sz = sizeOf(s, k.by), // (my Size: a bigger duck's swing reaches farther and wider, a smaller one's not as far, as they're drawn; the owner's, Nov 19 16:50Z)
      R = (A.r + 22) * sz,
      hz = zOf(p, "body", now), // (in a jump: its arc now)
      h = DUCK * sz, // (my height: a swing reaches only within it, heights.js swingH)
      [px, py] = toPx(p),
      bx = px + k.dx * A.at * sz,
      by = py + k.dy * A.at * sz;
    for (const z of zs) {
      if (z.st === 3 || k.hit.includes(z.i)) continue;
      if (!swingH(hz, h, zOf(z, "zombie"))) continue;
      if (Math.hypot(z.x - bx, z.y - by) > R) continue; // (a round bubble: as far up and down as to the sides, the owner's, Nov 18 15:18Z "Make sure melee weapons have the same range in any direction". It was squashed up and down, 1.4 times shorter)
      k.hit.push(z.i);
      if (missed(s, k.by, k.w, z, now)) continue; // (this one isn't hit by this swing; the others in it still can be)
      const dmg = Array.isArray(A.dmg)
        ? A.dmg[0] + Math.floor(Math.random() * (A.dmg[1] - A.dmg[0] + 1))
        : A.dmg; // (the fire axe: 1 to 4; times my Size, push.js)
      const hp0 = z.hp,
        dead = strike(s, z, dmg * sz, critRoll(s, k.by, k.w), k.by, k.w, now);
      wearDown(s, k.by, k.w, hp0 - Math.max(0, z.hp)); // (the HP it took off, not the overkill)
      if (dead) die(z, T);
      else if (z.st === 2) knockZ(z, k.dx, k.dy, knockOf(k.w) * sz); // (alive: pushed back, ARMS knock, harder from a bigger duck)
      any = true;
    }
    /* another duck in the swing: a slight shove, no HP lost (nothing hurts another duck here) */
    for (const id of s.seat) {
      const q = s.pos[id];
      if (id === k.by || !q || k.hit.includes("p" + id) || !standing(s, id))
        continue;
      const [qx, qy] = toPx(q);
      if (Math.hypot(qx - bx, qy - by) > R) continue;
      if (!swingH(hz, h, zOf(q, "body", now), DUCK * sizeOf(s, id))) continue;
      k.hit.push("p" + id);
      shovePx(
        s,
        id,
        k.dx,
        k.dy,
        knockOf(k.w) * KNOCK_DUCK * sz,
        now,
        inCabin(qx, qy) ? 1 : 0,
      ); // (world px: boardfire.js)
    }
    if (dp()) carsSwing(s, bx, by, R, k, knockOf(k.w) * KNOCK_DUCK * sz); // (Downpour's cars in it: carpush.js)
    if (L4_HOOKS.npc)
      L4_HOOKS.npc(s, k.by, bx, by, now, k.w, R, R, null, k.hit); // (Sandbox's NPCs in its bubble, each once a swing: sbcabin.js)
    if (L4_HOOKS.gm && s.hang.gm)
      L4_HOOKS.gm.shot(
        s,
        k.by,
        bx,
        by,
        now,
        k.w,
        R,
        R,
        null,
        k.hit,
        gmHelp(s, now),
      ); // (Survival's gunmen too: gunmenrules.js)
    for (const j of wilds(s))
      if (
        !k.hit.includes("j" + j) &&
        wildHurt(s, k.by, bx, by, now, k.w, R, R, null, false, j)
      )
        k.hit.push("j" + j); // (each one out in Downpour, once for each swing)
  }
  s.hang.l4k = ks;
  if (any) store(s, zs, true);
  return any;
}
/* dead on a roof, it lies on it (z.k kept: zombies.js zombieZ, asked through heights.js zOf); up a wall or jumping, it drops (the owner's, Nov 21
   08:46 ET: "corpses go below the cieling of where they were, that should be fixed") */
const die = (z, T) => {
  if (z.st !== 7) delete z.k;
  Object.assign(z, { st: 3, d: T });
};
/* melee knockback (the owner's, Nov 18 15:25Z: "Every melee has slight knockback EVEN to players AND especially to
   zombies EVEN WHILE THEY ARE ALIVE ... Fireaxe has more knockback and the hammer has most knockback"): guns.js ARMS
   knock, read by weaponuse.js knockOf */
/* a living zombie inside pushed `far` world px along (ux, uy) (a unit), a few px at a time, stopping where it can't
   stand (a wall, furniture, a step too high) */
function knockZ(z, ux, uy, far0) {
  const far = pushTaken(far0, immobile(z) ? Infinity : 1), // (a zombie weighs 1; an immobile one never moves: push.js)
    n = Math.max(1, Math.ceil(far / 8)),
    h = heightAt(z.x, z.y);
  [z.x, z.y] = pushAlong(
    [z.x, z.y],
    n,
    (i, [x, y]) => [x + (ux * far) / n, y + (uy * far) / n],
    ([x, y]) => zOk(x, y, h),
    ([x, y]) => [Math.round(x), Math.round(y)],
  ); // (one loop for every push: push.js)
}
/* the shots in the air (instead of rules.js' moveShots here): walls and furniture stop them, a zombie stops a bullet
   or an arrow (a crit now and then doubles it), a grenade goes off where it lands or where a wall stops it */
const OPEN_PAD = 30;
/* by an opening: a shot goes on through its boards and the wall either side of it, out to the zombies beating on them
   (the owner's, Nov 15), never further out than they stand */
const OPEN_IN = OPEN_PAD + 40, // (inside: as far in from the wall as before)
  OPEN_OUT = 130, // (outside: past the spot a zombie tears the boards from, and the ones crowding round it)
  OPEN_SIDE = 70; // (along the wall, either side of the opening)
const inOpening = (x, y) =>
  OPENINGS.some((o) => {
    if (o.kind === "fence") return false; // (Downpour's fence: shots go through it anywhere: walled)
    const [ax, ay, a, c] = o.axis === "x" ? [x, y, o.x, o.y] : [y, x, o.y, o.x],
      out = Math.sign((o.axis === "x" ? o.out[1] : o.out[0]) - c) || 1,
      across = (ay - c) * out;
    return (
      Math.abs(ax - a) < o.half + OPEN_SIDE &&
      across > -OPEN_IN &&
      across < OPEN_OUT
    );
  });
/* Downpour: no invisible walls stop a shot, only what's there, and its fence is chain-link (the owner's, Nov 17 12:28Z:
   "invisible walls do not stop bullets ... and zombies climbing the fence can be shot from below the ground no matter
   how high up they are") */
const SEE_THRU = new Set(["fence", "fencex"]);
export const walled = (x, y, z) =>
  dp()
    ? !inOpening(x, y) &&
      solidsAt(x, y, z + 20).some(
        (b) => b.top > z + 20 && !SEE_THRU.has(b.kind),
      )
    : (!playable(x, y) && !inOpening(x, y)) ||
      (!inOpening(x, y) && solidsAt(x, y, z + 20).some((b) => b.top > z + 20));
/* a shot's weapon (ARMS), by what it is; and does a wall stop shot sh at (x, y) (world px)? Here and on every screen,
   which draws a shot ending where it stops (l4dd.js shotStop) */
export const shotArm = (sh) =>
  ARMS[sh.w]
    ? sh.w
    : sh.k === "arrow"
      ? "bow"
      : sh.k === "pellet"
        ? "shotgun"
        : "handgun";
export const shotWalled = (sh, x, y) => walled(x, y, shotFeet(sh));
/* may a shot from my duck (feet at hz, at (px, py)) hit zombie z? Only with nothing solid between us: the one rule
   (layout.js slabBetween, the owner's, Nov 17 20:02Z); the walls on the way are the shot's own walk */
const canShoot = (z, px, py, hz) =>
  !dp() || !slabBetween(px, py, hz, z.x, z.y, zOf(z, "zombie"));
/* the zombies by 64-px square (a spatial grid), so a shot only looks at the few round it instead of every zombie on the
   map: the same hits, far fewer looks. A zombie's hit room (26 by 22 px) never reaches past the squares next to its own */
const HIT_CELL = 64;
const hitKey = (x, y) =>
  Math.floor(x / HIT_CELL) + 1000 * Math.floor(y / HIT_CELL);
function hitGrid(zs) {
  const g = new Map();
  zs.forEach((z, i) => {
    if (z.st === 3) return;
    const k = hitKey(z.x, z.y);
    let c = g.get(k);
    if (!c) g.set(k, (c = []));
    c.push(i);
  });
  return g;
}
/* the zombies that could be at (x, y), in the order of the list (as a look along it would meet them) */
function nearby(g, zs, x, y) {
  const i = Math.floor(x / HIT_CELL),
    j = Math.floor(y / HIT_CELL),
    out = [];
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const c = g.get(i + di + 1000 * (j + dj));
      if (c) out.push(...c);
    }
  return out.length > 1
    ? out.sort((a, b) => a - b).map((k) => zs[k])
    : out.map((k) => zs[k]);
}
export function l4Shots(s, now) {
  const list = s.shots || [];
  if (!list.length || !s.hang || !s.hang.l4) return false;
  const L = s.hang.l4,
    T = now - L.t0,
    zs = zombies(s),
    grid = hitGrid(zs),
    slugs = []; // (the double barrel's kills this beat: [x, y, crit])
  /* does shot sh fly on past zombie z? It missed it, now or before (sh.ms: the ones it missed, each rolled once); then
     it goes on to the next one, which rolls again */
  const past = (sh, w, z) => {
    if ((sh.ms || []).includes(z.i)) return true;
    if (!missed(s, sh.by, w, z, now)) return false;
    sh.ms = [...(sh.ms || []), z.i];
    return true;
  };
  let hitAny = false;
  const launched = (sh, age) => {
    /* the grenade launcher's: straight, and off at the first zombie, a wall or its range */
    const u = age / 1000,
      x0 = sh.lx * W,
      y0 = sh.ly * H,
      x1 = (sh.x0 + sh.vx * u) * W,
      y1 = (sh.y0 + sh.vy * u) * H,
      n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12));
    let at = null;
    for (let k = 1; k <= n && !at; k++) {
      const x = x0 + ((x1 - x0) * k) / n,
        y = y0 + ((y1 - y0) * k) / n;
      if (walled(x, y, shotFeet(sh)))
        at = [x0 + ((x1 - x0) * (k - 1)) / n, y0 + ((y1 - y0) * (k - 1)) / n];
      else if (
        nearby(grid, zs, x, y).some(
          (z) =>
            z.st !== 3 &&
            Math.hypot((z.x - x) / 26, (z.y - y) / 22) < 1 &&
            hOk(sh, zOf(z, "zombie"), z.x, z.y, sh.x0 * W, sh.y0 * H) &&
            !past(sh, "glauncher", z),
        )
      )
        at = [x, y];
    }
    if (!at && age >= sh.life) at = [x1, y1];
    if (at) {
      const ang = angelOf(s, sh.by, "glauncher");
      hitAny =
        boom(
          s,
          sh,
          at[0],
          at[1],
          zs,
          T,
          now,
          BLAST_HALF * (ang ? ANGEL.GL_RADIUS : 1),
        ) || hitAny;
      if (ang)
        burnAt(s, sh.by, at[0], at[1], now, blastZ(at[0], at[1], sh.hz || 0)); // (Angelic: a smaller blast, and the ground there on fire)
      return false;
    }
    sh.lx = x1 / W;
    sh.ly = y1 / H;
    return true;
  };
  const bullet = (sh, age) => {
    const x0 = sh.lx * W,
      y0 = sh.ly * H,
      u = age / 1000,
      x1 = (sh.x0 + sh.vx * u) * W,
      y1 = (sh.y0 + sh.vy * u) * H,
      len = Math.hypot(x1 - x0, y1 - y0),
      steps = Math.max(1, Math.ceil(len / 12));
    let gone =
        age > (sh.life || SHOT_LIFE) ||
        (sh.k === "dagger" && daggerZ(age / 1000) <= 0), // (a pellet goes only so far; a dagger falls to the floor)
      endX = x1,
      endY = y1;
    for (let k = 1; k <= steps && !gone; k++) {
      const x = x0 + ((x1 - x0) * k) / steps,
        y = y0 + ((y1 - y0) * k) / steps;
      if (walled(x, y, shotFeet(sh))) {
        gone = true;
        endX = x;
        endY = y;
        break;
      } // (a wall taller than the shot: heights.js)
      const w = shotArm(sh),
        A = ARMS[w],
        big = w === "chair" ? chairReach(sh.sc) : 1, // (the chair: as far as its picture, chair.js)
        near = (z) =>
          z.st !== 3 &&
          Math.hypot((z.x - x) / (26 * big), (z.y - y) / (22 * big)) < 1 &&
          hOk(sh, zOf(z, "zombie"), z.x, z.y, sh.x0 * W, sh.y0 * H) &&
          !hLock(sh, zOf(z, "zombie")); // (at its height, the first one setting it: heights.js)
      if (
        wildHurt(s, sh.by, x, y, now, w, 26, 22, [
          sh.x0 * W,
          sh.y0 * H,
          sh.hz || 0,
        ])
      ) {
        gone = true; // (Justin out in Downpour with no weapon: it hit him)
        endX = x;
        endY = y;
        break;
      }
      if (w === "dbarrel") {
        /* the slug double barrel's slug: through every zombie in its way, each once, 6 to the first and 1 or 1.5 less
           to each one after (sh.d: the next one's), until it does nothing (the owner's, Nov 19 19:27Z). A crit doubles
           that one's. One it kills blows to pieces (no bullet knocks back: the owner's, Nov 21 17:48Z) */
        let stop = false;
        for (const z of nearby(grid, zs, x, y))
          if (near(z) && !(sh.hit || []).includes(z.i) && !past(sh, w, z)) {
            const crit = critRoll(s, sh.by, w),
              dmg = sh.d === undefined ? dmgOf(A) : sh.d;
            sh.hit = [...(sh.hit || []), z.i];
            if (strike(s, z, dmg, crit, sh.by, w, now)) {
              die(z, T);
              mark(s, z, "g0"); // (chunks blown through it: l4ddart.js)
              slugs.push([Math.round(z.x), Math.round(z.y), crit ? 1 : 0]);
            }
            hitAny = true;
            sh.d = hundredths(dmg - oneOf(A.less));
            if (sh.d <= 0) {
              stop = true;
              break;
            }
          }
        if (stop) gone = true;
        continue;
      }
      const pierce = w === "chair" ? Infinity : pierceOf(s, sh.by, w); // (the chair: through every one it's over)
      if (pierce) {
        /* the sniper's: through the zombies it meets, each once, until the third (the owner's, Nov 3), or the wall. Once
           it crits, it crits every one after it, still only up to its limit (the owner's, Nov 18 12:19Z). Each one
           takes its roll less 1 for each zombie it went through before it (the owner's, Nov 18 16:43Z: "it does 1
           damage less per zombie it passes"; this replaced the first one taking its most): 4 to 5, 3 to 4, 2 to 3 */
        for (const z of big > 1 ? zs : nearby(grid, zs, x, y))
          if (near(z) && !(sh.hit || []).includes(z.i) && !past(sh, w, z)) {
            const sniper = w === "sniper",
              crit = (sniper && !!sh.crit) || critRoll(s, sh.by, w),
              dmg = sniper
                ? Math.max(1, dmgOf(A) - (sh.hit || []).length)
                : dmgOf(A);
            if (sniper && crit) sh.crit = 1;
            sh.hit = [...(sh.hit || []), z.i];
            if (strike(s, z, dmg, crit, sh.by, w, now)) die(z, T);
            else if (w === "chair" && z.st === 2)
              knockZ(z, sh.vx * W, sh.vy * H, knockOf("hammer")); // (the chair shoves like the hammer: the owner's, Nov 20 21:17Z)
            hitAny = true;
            if (sh.hit.length >= pierce) break;
          }
        if ((sh.hit || []).length >= pierce) gone = true;
        continue;
      }
      const z = nearby(grid, zs, x, y).find((z) => near(z) && !past(sh, w, z));
      if (z) {
        if (w === "handgun" && angelOf(s, sh.by, w)) {
          /* the Angelic pistol: every bullet kills at once, and a crit sets off a grenade's blast there (its shooter
             isn't hurt by it: no sh.k) */
          const crit = critRoll(s, sh.by, w);
          strike(s, z, z.hp, crit, sh.by, w, now);
          die(z, T);
          if (crit)
            boom(
              s,
              { by: sh.by, hz: sh.hz },
              z.x,
              z.y,
              zs,
              T,
              now,
              ANGEL.PISTOL.BOOM,
              zOf(z, "zombie"),
            ); // (half a grenade's blast, its boom weaker: the owner's, Nov 17 11:07Z; it goes off where that zombie is)
        } else if (strike(s, z, dmgOf(A), critRoll(s, sh.by, w), sh.by, w, now))
          die(z, T);
        hitAny = true;
        gone = true;
      }
    }
    if (slugs.length) {
      addFx(s, {
        kind: "slug",
        by: sh.by,
        who: [],
        t: now,
        ax: sh.vx,
        ay: sh.vy,
        gore: slugs.splice(0),
      }); // (every screen: the chunks and the blood blown out of each, more from a crit's head: l4dd.js)
    }
    if (gone) return false;
    sh.lx = endX / W;
    sh.ly = endY / H;
    return true;
  };
  s.shots = flyShots(
    list.map((sh) => ({ ...sh })),
    now,
    {
      fuse: GRENADE_MS,
      U: [W, H],
      at: (sh, t) => ({
        x: (sh.x0 + sh.vx * (t / 1000)) * W,
        y: (sh.y0 + sh.vy * (t / 1000)) * H,
      }),
      walled: (sh, at) => walled(at.x, at.y, sh.hz),
      boom: (sh, at) => {
        hitAny = boom(s, sh, at.x, at.y, zs, T, now, BLAST_HALF) || hitAny;
      },
      launched,
      bullet,
    },
  );
  if (hitAny) store(s, zs, true);
  return true;
}

/* the Angelic grenade launcher's fire: a few burning patches round where it went off, as the flamethrower's ground */
function burnAt(s, by, x, y, now, z0 = 0) {
  const r = REACH * DUCK * ANGEL.GL_RADIUS, // (its blast's rings: blast.js)
    out = [];
  for (let k = 0; k < ANGEL.GL_FIRE; k++) {
    const a = (k / ANGEL.GL_FIRE) * Math.PI * 2,
      d = k ? r * 0.6 : 0;
    const px = x + Math.cos(a) * d,
      py = y + Math.sin(a) * d * 0.8;
    if (playable(px, py) && !flood(px, py))
      out.push([
        Math.round(px),
        Math.round(py),
        now + FLAME.GROUND,
        by,
        Math.round(blastZ(px, py, z0)),
      ]); // (none on the water; each on its own floor: the roof where it went off, or the ground past its ledge)
  }
  s.hang.l4gf = [
    ...(s.hang.l4gf || [])
      .filter((g) => g[2] > now)
      .slice(out.length - FLAME.MOST),
    ...out,
  ];
}
/* a blast (a grenade, the grenade launcher's, the Angelic pistol's crit) at (bx, by), its feet at bz (left out: the floor
   there at its shooter's height, sh.hz): every zombie in it dies, and the duck that threw it, in it, loses half its HP;
   true when it got any zombie. Who is in it: blast.js, reaching only what the shots' one rule lets it: nothing solid
   between (layout.js slabBetween; the owner's, Nov 17 20:02Z, "IT IS PHYISCALLY RETARDED"), so one on a roof never gets
   anything inside or under it, and one inside never gets anything up on it */
const blastZ = (x, y, hz) => (dp() ? floorH(x, y, hz) : heightAt(x, y));
function boom(s, sh, bx, by, zs, T, now, wide = 1, bz = null) {
  const gore = [],
    z0 = bz ?? blastZ(bx, by, sh.hz || 0),
    near = reach({
      x: bx,
      y: by,
      rx: DUCK,
      ry: DUCK,
      wide: wide / BLAST_HALF, // (its rings: blast.js; a grenade's is BLAST_HALF, the Angelic ones smaller)
      ok: (x, y, z) => !slabBetween(bx, by, z0, x, y, z),
    }),
    mine = sh.k && s.pos[sh.by];
  const any = blast(near, [
    [
      zs,
      (z) => z.st !== 3 && [z.x, z.y, zOf(z, "zombie")],
      (z, n) => {
        if (!strike(s, z, n.dmg, n.crit, sh.by)) return true; // (its ring's damage, a crit twice: blast.js; it lives)
        die(z, T);
        mark(s, z, "g0"); // (every chunk, cuts and big holes: l4ddart.js)
        gore.push([Math.round(z.x), Math.round(z.y)]);
        return true;
      },
    ],
    [
      wilds(s),
      (j) => {
        const jq = P4(s, j);
        return jq && !jq.dn && !jq.gh && [...toPx(s.pos[j]), zOf(s.pos[j])];
      },
      (j) => wildDown(s, j, sh.by, now, "grenade", true, DEATH),
    ], // (Justin out there with no weapon: all his HP, torn apart, headless and burnt, wounds.js DEATH; no jump dodges it: the owner's, Nov 17 20:37Z)
    (near) => {
      if (L4_HOOKS.gm && s.hang.gm)
        L4_HOOKS.gm.blast(s, sh.by, near, now, sh.w, gmHelp(s, now)); // (Survival's gunmen in it: gunmenrules.js)
      if (dp()) carsBlast(s, near, bx, by); // (Downpour's cars: pushed, carpush.js)
    },
    [
      () =>
        [merchantOf(s)].filter((m) => m && m.st !== "dead" && m.st !== "jump"),
      (m) => [m.x, m.y, heightAt(m.x, m.y)],
      (m, n) =>
        merchantHurt(
          s,
          s.players[sh.by] ? sh.by : null,
          hitOf(n).dmg,
          now,
          "grenade",
          "blast",
        ),
    ], // (the merchant: his ring's damage)
    [
      () =>
        [mine && (s.hang.l4p || {})[sh.by]].filter(
          (q) =>
            q &&
            !q.dn &&
            !q.gh &&
            !invuln(s) &&
            !invulnOf(s, sh.by, now) &&
            Math.floor(q.hp / 2) > 0,
        ),
      () => [...toPx(mine), zOf(mine)],
      (q) =>
        (s.hang.l4p = {
          ...s.hang.l4p,
          [sh.by]: {
            ...q,
            hp: hundredths(q.hp - Math.floor(q.hp / 2)),
            at: now,
          },
        }),
    ], // (the one who threw or launched it: half its HP, rounded down, and never down by it: the owner's, Nov 16)
  ]);
  addFx(s, {
    kind: "boom",
    by: sh.by,
    who: [],
    t: now,
    x: +(bx / W).toFixed(4),
    y: +(by / H).toFixed(4),
    hit: [],
    hz: sh.hz || 0,
    gore: gore.slice(0, 12), // (blood bursting out of each zombie it got: game.js)
    ...(wide !== 1 ? { wide } : {}),
    rr: (REACH * wide) / BLAST_HALF, // (its rings' reach, as the screens draw it)
  });
  return any;
}

/* a test command (cheats.js): Survival's next wave is gunmen now, "c" criminals or "s" soldiers, as its peak sends them
   (survrules.js survTick): the phase goes to a peak with them, so the clock and the bags go on after it */
export function cheatGunmen(s, side, now) {
  const L = s.hang.l4,
    sv = s.hang.sv;
  if (!isSurv(s) || !L || !sv || !L4_HOOKS.gm || !["c", "s"].includes(side))
    return false;
  L4_HOOKS.gm.start(s, side, now, gmHelp(s, now));
  s.hang.l4 = { ...L, t0: now, n: 0, made: 0, owe: 0, acc: 0, sec: -1 };
  s.hang.sv = { ...sv, ph: "peak", t: now, until: 0, big: 0, g: side };
  return true;
}
/* ---------- the host's heartbeat ---------- */
function l4Tick(s, now) {
  const L = s.hang.l4;
  if (!L) return false;
  if (L.over) return false;
  meleeHits(s, now); // (first: the zombies below are read after it)
  const T = now - (isSb(s) && L.t0 == null ? 0 : L.t0), // (Sandbox: no round started, its zombies still claw)
    zs = zombies(s);
  /* the ducks: HP coming back, revives, bleeding out, boards going up, reloads */
  const p4 = { ...(s.hang.l4p || {}) },
    ids = players(s);
  for (const id of ids) {
    let p = p4[id];
    if (!p) continue;
    if (p.dn) {
      if (
        p.sk &&
        !p.skAt &&
        !ids.some((o) => o !== id && p4[o] && !p4[o].dn && !p4[o].gh)
      )
        p = { ...p, skAt: now + SAFE.GLOW }; // (Safe Keeping, and nobody else standing now: up by itself)
      const rv = p.rv,
        by = rv && s.pos[rv.by];
      if (
        rv &&
        (!by ||
          !standing(s, rv.by) ||
          Math.hypot(...minus(toPx(by), toPx(s.pos[id]))) > L4.REACH * 1.8)
      )
        p = { ...p, rv: null, dn: p.dn + (now - rv.at) }; // (the bleeding-out waited while they were at it)
      else if (p.skAt && now >= p.skAt) {
        s.hang.l4p = p4;
        getUp(s, id, now, false, true);
        p = s.hang.l4p[id];
      } else if (rv && now - rv.at >= reviveMs(s, rv.by)) {
        p = { hp: L4.BACK_HP, at: now };
        downGun(s, id, false);
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
      } else if (!rv && !p.skAt && now >= p.dn && isWild(s, id)) {
        p = { hp: 0, at: now, dn: now + 1e13, ex: 1 }; // (Justin in Downpour bled out: dead for good, his body stays)
        s.hang.still = { ...(s.hang.still || {}), [id]: now + 1e13 };
      } else if (!rv && !p.skAt && now >= p.dn) {
        const safe = !!p.sk || hasSafe(s, id);
        /* bled out: a ghost until the next round; in Survival (ex) it stays one, no coming back at a rest (the owner's, Nov 19
           22:25Z: "in survival, when players die, they do not come back"), only a defibrillator brings it back (defibUse), at its
           body (the owner's, Nov 21 15:39Z: "remove spectators mode from survival and just use the mechanic we already do
           where the duck becomes a ghost and they can walk around") */
        p = { hp: 0, at: now, gh: 1, ...(isSurv(s) ? { ex: 1 } : {}) };
        /* the duck died: its upgrades go, unless it holds Safe Keeping, which then keeps them (and is spent: the
           owner's, Nov 19 19:27Z, "you can either revive yourself, or if you die, you come back with your stuff") */
        if (safe) {
          const kit = kitOf(s, id);
          if (kit && hasSafe(s, id))
            s.hang.l4a = {
              ...s.hang.l4a,
              [id]: { ...kit, am: { ...kit.am, safekeep: [0, 0] } },
            };
          addFx(s, { kind: "l4safe", by: id, who: [id], t: now });
        } else s.hang.l4u = { ...(s.hang.l4u || {}), [id]: {} };
        downGun(s, id, false);
        const q = s.pos[id];
        if (s.players[id]) delete s.players[id].dead;
        const still = { ...(s.hang.still || {}) };
        delete still[id];
        s.hang.still = still;
        s.hang.ghost = {
          ...(s.hang.ghost || {}),
          [id]: { x: q.x, y: q.y, z: Math.round(zOf(q)), t: now, l4: 1 },
        };
        const b = { ...(s.hang.l4b || {}) };
        delete b[id];
        s.hang.l4b = b;
      }
      p4[id] = p;
      continue;
    }
    if (p.gh && isSb(s) && now - (p.at || 0) >= SB_BACK_MS) {
      /* Sandbox's Rules: each coming back spends a life; out of them, it's dead for good and watches the others
         (spectate.js), as in Survival */
      const most = sbRule(s, "lives"),
        used = ((s.sb && s.sb.died) || {})[id] || 0;
      s.sb = {
        ...s.sb,
        died: { ...((s.sb && s.sb.died) || {}), [id]: used + 1 },
      };
      if (most && used + 1 >= most) {
        p4[id] = { hp: 0, at: now, dn: now + 1e13, ex: 1 };
        if (s.players[id]) s.players[id].dead = true;
        const g = { ...(s.hang.ghost || {}) };
        delete g[id];
        s.hang.ghost = g;
        s.hang.still = { ...(s.hang.still || {}), [id]: now + 1e13 };
        continue;
      }
      s.hang.l4p = p4;
      bringBack(s, id, now, ids.indexOf(id), false);
      p4[id] = s.hang.l4p[id];
      const q = sbPlayerSpot(s, id, W, H, (x, y, z) =>
        standable(x * W, y * H, z),
      ); // (at a respawn for players, a spawn whose Players tab is on, or in a zone: sandboxrules.js)
      if (q && s.pos[id])
        s.pos[id] = { ...s.pos[id], x: q.x, y: q.y, z: q.z || 0 };
      continue;
    } // (Sandbox: no next round to wait for, so a ghost is back up a moment later, at a start spot, with its weapons)
    if (p.gh) continue;
    if (p.hp < maxHp(s, id)) {
      const w = isWild(s, id),
        [amt, at] = regenOf(s, p.at, now, w ? WILD.regen : L4.REGEN, w); // (a duck's in hundredths, smoothly; Justin's in whole HP: hpmath.js)
      if (amt) p4[id] = { ...p, hp: hpHeal(p.hp, amt, maxHp(s, id)), at };
    }
  }
  s.hang.l4p = p4;
  const am = s.hang.l4a || {};
  for (const id of Object.keys(am))
    if (am[id].rl && now >= am[id].rl) {
      const m = { ...am[id] };
      finishReload(m, now);
      s.hang.l4a = { ...s.hang.l4a, [id]: m };
    } else if (
      am[id].rl &&
      am[id].rw !== "dg" &&
      s.pos[id] &&
      s.pos[id].w !== am[id].rw
    )
      s.hang.l4a = { ...s.hang.l4a, [id]: { ...am[id], rl: 0, rw: "" } }; // (switched to another slot: the reload is lost, the owner's, Nov 16)
  justinChat(s, now);
  for (const b of Object.values(boxesOf(s)))
    if (b.w === HELPER.w && now >= b.t + BOX.spin + HELPER.out) {
      dropBox(s, b.by);
      helperIn(s, b.by, now);
    } else if (now >= b.t + BOX.spin + BOX.keep) dropBox(s, b.by); // (nobody took it: the fire keeps it)
  const brd = { ...(s.hang.brd || {}) },
    bl = { ...(s.hang.l4b || {}) };
  for (const [id, b] of Object.entries(bl)) {
    const o = openingById(b.o),
      p = s.pos[id];
    if (
      !o ||
      !p ||
      !standing(s, id) ||
      Math.hypot(o.in[0] - p.x * W, o.in[1] - p.y * H) > L4.REACH * 1.8 ||
      brd[o.id] >= L4.BOARDS
    ) {
      delete bl[id];
      continue;
    }
    if (now - b.at >= L4.BOARD_MS) {
      brd[o.id] = Math.min(L4.BOARDS, (brd[o.id] || 0) + 1);
      bl[id] = { ...b, at: now };
      const bp = s.hang.l4.bp || {},
        k = `${id} ${o.id}`;
      if ((bp[k] || 0) < PTS.BOARDS) {
        addPts(s, id, PTS.BOARD);
        s.hang.l4 = {
          ...s.hang.l4,
          bp: { ...bp, [k]: (bp[k] || 0) + PTS.BOARD },
        };
      } // (5 a board, 50 a round at most for each opening: one cap for them all left the east wall paying nothing after the others)
    }
  }
  s.hang.brd = brd;
  s.hang.l4b = bl;
  /* nobody standing: the game is over (a duck Safe Keeping is getting up counts as standing) */
  const mine = ids.filter((id) => !isWild(s, id)), // (Justin out there doesn't keep the game going, nor end it)
    up = mine.filter((id) => standing(s, id) || !!(P4(s, id) || {}).skAt);
  if (!up.length && mine.length && !isSb(s)) {
    s.hang.l4 = { ...s.hang.l4, over: { at: now, r: L.r } };
    s.hang.l4b = {};
    return true;
  }
  /* Sandbox: everyone out of lives (G's Rules, Lives and "When everyone is out of lives"): the game over card, or after it
     the lobby or a new start (rules.js), or nothing, as it always was */
  if (isSb(s) && mine.length && sbRule(s, "out") !== "keep") {
    const most = sbRule(s, "lives"),
      died = (s.sb && s.sb.died) || {};
    if (most && mine.every((id) => (died[id] || 0) >= most)) {
      s.hang.l4 = {
        ...s.hang.l4,
        over: { at: now, r: L.r, sb: sbRule(s, "out") },
      };
      s.hang.l4b = {};
      return true;
    }
  }
  merchantTick(s, now); // (the merchant walks in or out, and greets)
  troopTick(s, now, ids); // (the rests between rounds too)
  /* between rounds: no zombies; the drops still lie there to be taken */
  if (s.hang.l4.wait && !isSb(s)) {
    if (waitTick(s, now)) return true;
    const Lw = { ...s.hang.l4 };
    dropTick(s, Lw, zs, now, T, ids);
    s.hang.l4 = Lw;
    powerTick(s, zs, now, ids, PH);
    return true;
  }
  /* more zombies come */
  const R = roundOf(L.r),
    live = zs.filter((z) => z.st !== 3).length,
    extra = Math.max(0, ids.length - 1),
    L2 = { ...s.hang.l4 };
  if (T >= 0 && !isSb(s) && L2.made + L2.owe < L2.n) {
    const sec = Math.floor(T / 1000);
    if (sec > L2.sec) {
      L2.sec = sec;
      if (Math.random() >= SKIP) {
        const fast = dp() ? 4 : T >= LATER ? 2 : 1; // (after a round's first 10 s: twice as fast again. Downpour: twice that, from the start, the map's so big: the owner's, Nov 16 23:23Z)
        const half = T < EARLY ? 0.5 : 1; // (a round's first 4 s: half as many)
        L2.acc += 2 * fast * half * Math.pow(1.5, extra); // (twice as fast: the owner's, Nov 16 21:21Z)
        const k = Math.min(
          Math.floor(L2.acc),
          (10 + 6 * extra) * fast * half,
          L2.n - L2.made - L2.owe,
        );
        L2.acc -= Math.floor(L2.acc);
        L2.owe += Math.max(0, k);
      }
    }
  }
  if (L2.owe > 0) {
    const room = Math.max(0, R[2] - live),
      k = Math.min(L2.owe, room);
    for (let q = 0; q < k; q++) {
      zs.push(newZombie(s, L2, T, zs));
      L2.made++; // (one by one: newZombie reads it for the round's last tenth)
    }
    L2.owe -= k;
  }
  /* the zombies walk, tear boards down, climb in, swipe: at every duck standing, Justin out there too (the owner's,
     Nov 17 20:02Z: "zombies will attack justin now, because they literally arent"; he only doesn't keep the game going) */
  setZWall(sbZombieWall(s, W, H, true)); // (Sandbox: its walls)
  moveZombies(s, zs, now, T, [
    ...up.filter((id) => !godOn(s, id)), // (God mode: the zombies ignore it)
    ...ids.filter((id) => isWild(s, id) && standing(s, id)),
  ]);
  setZWall(null);
  if (isSurv(s) && L4_HOOKS.gm)
    L4_HOOKS.gm.tick(s, zs, now, mine, gmHelp(s, now)); // (Survival's gunmen: gunmenrules.js)
  if (isSurv(s)) merchantShoots(s, zs, now); // (and an armed merchant fighting back)
  nukeTick(s, zs, now, ids);
  boltTick(s, zs, now, ids);
  dropTick(s, L2, zs, now, T, ids);
  powerTick(s, zs, now, ids, PH);
  const ad = s.hang.l4ad;
  if (ad && Object.values(ad).some((u) => u <= now))
    s.hang.l4ad = Object.fromEntries(
      Object.entries(ad).filter(([, u]) => u > now),
    ); // (the adrenaline shots that wore off)
  /* the dead go */
  const left = zs.filter(
      (z) => !(z.st === 3 && T - z.d > (nuked(s, z) ? NUKE.DEAD : L4.DEAD_MS)),
    ),
    bodies = left.filter((z) => z.st === 3 && nuked(s, z)); // (the Nuke's: they don't hold up the next round)
  if (s.hang.l4nk && s.hang.l4nk.ids && !bodies.length) s.hang.l4nk = null; // (the last of them gone)
  /* Survival: no rounds, its phases instead (survrules.js); a rest brings the merchant and the ghosts back */
  if (isSurv(s)) {
    survTick(s, L2, left, now, Math.max(1, mine.length), {
      gunmen: (kind) =>
        L4_HOOKS.gm && L4_HOOKS.gm.start(s, kind, now, gmHelp(s, now)),
      gunDone: () => !L4_HOOKS.gm || L4_HOOKS.gm.done(s),
      gunLeft: () =>
        L4_HOOKS.gm && L4_HOOKS.gm.left ? L4_HOOKS.gm.left(s) : 0,
      walker: () => survWalker(s, L2, mine),
      speedAt: (r) =>
        Math.round(WALK * Z_SLOW * rnd(roundOf(r)[1][0], roundOf(r)[1][1])),
      /* a walker left from the tail turns into one of the next peak's: a new look (another hat, outfit and size), so
         you see it change (the owner's: "start to change their model and start chasing you") */
      remodel: (z) => {
        const l = [...z.l],
          other = (was, n) =>
            n < 2 ? 0 : (Math.max(0, was) + rint(1, n - 1)) % n;
        l[3] = +rnd(-1, 1).toFixed(2);
        l[4] = 0;
        l[5] = other(l[5], ZHATS.length);
        l[6] = other(l[6], ZOUTFITS.length);
        z.l = l;
      },
      merchantComing: () => {
        const m = merchantOf(s);
        return (
          !!m &&
          (m.st === "in" || (m.st === "jump" && !!(m.stock || []).length))
        ); // (on his way in: over the fence; one leaving has no stock)
      },
      rest: () => {
        merchantCome(s, now, true);
        if (L4_HOOKS.gm) L4_HOOKS.gm.rest(s, now, gmHelp(s, now)); // (the friendly squad, now and then: allies.js)
        ids.forEach((id, k) => {
          if (returns(s, id)) bringBack(s, id, now, k, false);
        });
      },
    });
    s.hang.l4 = L2;
    store(s, left, false);
    return true;
  }
  /* every zombie of the round came and died: the next round, and the ghosts come back */
  if (L2.made >= L2.n && left.length === bodies.length && T >= 0 && !isSb(s)) {
    s.hang.l4 = { ...L2, wait: { r: L2.r + 1, v: {} } }; // (the next round waits for End turn)
    store(s, bodies, false);
    merchantCome(s, now); // (the rest before the next round: half the time)
    ids.forEach((id, k) => {
      if (returns(s, id)) bringBack(s, id, now, k, false);
    });
    return true;
  }
  s.hang.l4 = L2;
  store(s, left, false);
  return true; // (the zombies move every heartbeat)
}
/* what Survival's gunmen (gunmenrules.js) borrow from these rules, now */
export function gmHelp(s, now) {
  const T = now - ((s.hang.l4 && s.hang.l4.t0) || now);
  return {
    ids: players(s).filter((id) => !isWild(s, id)),
    ww: W,
    wh: H,
    hp: () => Math.max(1, hp0()),
    open: (x, y) => openNear(x, y) >= 0 && zOk(x, y, heightAt(x, y)),
    stands: (x, y, z) => zOk(x, y, z), // (where a zombie at height z may stand: apart's walls)
    hurt(id, dmg, w, crit = false) {
      if (crit && isWild(s, id)) {
        const q = P4(s, id),
          up = q && !q.dn && !q.gh;
        wildDown(s, id, "", now, w, false, ["x0"], dmg * 2); // (a gunman's crit on Justin: twice, and his head if it puts him down, as a duck's crit)
        return up && !!P4(s, id).dn;
      }
      const p4 = { ...(s.hang.l4p || {}) },
        down = hurtDuck(s, p4, id, now, w, dmg);
      s.hang.l4p = p4;
      return down;
    }, // (a duck, Justin out there too: true when it went down. A player never takes a headshot from them: gunmenrules.js hitOn)
    hitZ(z, dmg, w, crit = false) {
      if (strike(s, z, dmg, crit, null, w, now)) die(z, T);
    }, // (a zombie: nobody's points; a crit doubles it, and takes its head if it kills)
    pts: (id, n) => addPts(s, id, n),
    takes: (by, w) => zombieTakes(s, by, w),
    up: (id) => standing(s, id),
    wild: (id) => isWild(s, id),
    drop(x, y) {
      const k = pickDrop(s);
      s.hang.l4dr = [
        ...(s.hang.l4dr || []),
        {
          n: now,
          k,
          x: Math.round(x),
          y: Math.round(y),
          until: now + DROP.LIFE,
        },
      ];
    }, // (a special where one fell: the owner's, "Special drops can still happen from criminals or soldiers")
    edge() {
      syncMap();
      const pts = players(s)
        .filter((id) => standing(s, id))
        .map((id) => toPx(s.pos[id]));
      if (!pts.length) return null;
      /* the owner's, Nov 19 19:27Z: "they're climbing the fence or they're coming through the roads": a group in
         three comes along the road, from one of its ends nobody sees */
      if (dp() && Math.random() < GM_ROAD) {
        const road = roadEnd(pts);
        if (road) return road;
      }
      const pick = fenceSpot(pts);
      return pick ? pick.land : null;
    }, // (a spot just inside a fence that nobody sees: where they come in, "they show up from the outside")
    mhurt: (i, dmg, w, crit = false) =>
      merchantHurt(
        s,
        null,
        crit ? dmg * 2 : dmg,
        now,
        w,
        crit && ((merchantOf(s) || {}).hp || 0) <= dmg * 2 ? "crit" : "",
        "g" + i,
      ), // (one of them shot the merchant; a crit: twice, and his head if it kills him)
    notice: (k) => addFx(s, { kind: "l4drop", k, who: [], t: now }), // (a notice for everyone, as "The Merchant has Arrived": l4dd.js l4Got)
    speed: WALK * walkOf(s) * NPC_RUN, // (the shared slow speed, npcshared.js)
    T,
  };
}
const GM_ROAD = 1 / 3; // (my guess: a third of the groups come along the road)
export const Z_ROOM = { RX, RY, CLAW };
export { standing as l4Up };

/* what the screens ask: a duck's HP, its bleeding out, the round */
export const l4Hp = (s, id) => (P4(s, id) || { hp: -1 }).hp;
/* how far a downed duck is into its bleeding-out (k, 0 to 1), and whether someone is reviving it (wait: it's stopped) */
export const l4Dying = (s, id, now) => {
  const p = P4(s, id);
  if (!p || !p.dn) return { k: -1, wait: false };
  const left = p.dn - (p.rv ? p.rv.at : now);
  return { k: Math.min(1, Math.max(0, 1 - left / L4.BLEED)), wait: !!p.rv };
};
export const l4Down = (s, id) =>
  isDown(s, id) && !P4(s, id).ex ? P4(s, id).dn : 0; // (Justin dead for good: no down meter, the owner's, Nov 17 13:30Z)

/* ---------- Sandbox's loot orbs on these maps (sbloot.js) ----------
   a weapon taken from an orb goes into duck id's slots as one bought or spun does (give), full; inf: unlimited ammo (as
   much as never runs out in a sitting); and an orb's damage on the duck that takes it (as a claw does) */
/* the ammo weapon w comes with, set by loot or G (M: sbloot.js modsOf's form; inf: Unlimited ammo, or null for its own):
   [in the magazine, spare], or null for none kept (unlimited, as the laser's and the bow's own) */
function ammoFor(w, M, inf) {
  const full = fullAmmo(w),
    unl =
      inf != null
        ? inf || (w === "laser" && M.ammoP >= 100) // (the laser's 100% is unlimited: the owner's, Nov 19 22:55Z)
        : !full; // (the laser and the bow: unlimited unless it's turned off)
  if (unl) return full ? [full[0], 9999] : null;
  /* Ammo: a number, or a share where 100% is Dead Ducks Arcade's own (the bow's 100% is 300); How many you get for an
     item (a medkit, a zebra cake, a chair: its uses) */
  const own = full ? full[0] + full[1] : w === "bow" ? 300 : 100,
    n =
      M.n && (!full || !ARMS[w].mag)
        ? M.n
        : M.ammo != null
          ? M.ammo
          : M.ammoP != null
            ? Math.max(1, Math.round((own * M.ammoP) / 100))
            : own,
    mag = ARMS[w].mag;
  return mag ? [Math.min(mag, n), Math.max(0, n - mag)] : [n, 0];
}
export function l4Loot(s, id, w, inf, mods = null) {
  if (!ARMS[w]) return false;
  if (w === "grenade") {
    const k = kitOf(s, id);
    if (!k) return false;
    s.hang.l4a = {
      ...s.hang.l4a,
      [id]: {
        ...k,
        g: mods && mods.n ? Math.min(99, mods.n) : ARMS.grenade.most,
      },
    }; // (grenades: How many you get, or a full belt)
    return true;
  }
  if (!give(s, id, w)) return false;
  const kit = kitOf(s, id),
    am = { ...kit.am },
    M = mods || {};
  if (inf === undefined) inf = M.inf;
  const a = ammoFor(w, M, inf);
  if (a) am[w] = a;
  else delete am[w]; // (unlimited, as the laser's and the bow's own)
  const lm = {};
  if (M.dmg != null) lm.d = M.dmg;
  if (M.dmgP != null) lm.dp = M.dmgP;
  if (M.cool) lm.c = M.cool;
  if (M.rl === false) lm.r = 0;
  if (M.brk) lm.b = 1;
  const lms = { ...(kit.lm || {}) };
  if (Object.keys(lm).length) lms[w] = lm;
  else delete lms[w];
  s.hang.l4a = { ...s.hang.l4a, [id]: { ...kit, am, lm: lms } };
  return true;
}
/* Sandbox's loot (sbloot.js, plan Loot 2 "Ammo and magazines"): duck id gets one more magazine of gun w (a quarter of
   its full amount for a gun without one), never past its full amount; false when it doesn't carry w */
export function l4Ammo(s, id, w) {
  const kit = kitOf(s, id),
    full = ARMS[w] && fullFor(s, id, w);
  if (!kit || !full || !(kit.sl || []).includes(w)) return false;
  const [m, r] = (kit.am || {})[w] || [0, 0],
    add = ARMS[w].mag || Math.max(1, Math.ceil((full[0] + full[1]) / 4)),
    am =
      full[1] > 0
        ? [m, Math.min(full[1], r + add)]
        : [Math.min(full[0], m + add), r];
  s.hang.l4a = { ...s.hang.l4a, [id]: { ...kit, am: { ...kit.am, [w]: am } } };
  return true;
}
export function l4Hurt(s, id, dmg, now, w = "claw") {
  const p4 = { ...(s.hang.l4p || {}) };
  hurtDuck(s, p4, id, now, w, dmg);
  s.hang.l4p = p4;
}
/* the zombie maps' HP (hpmath.js): a zone's or a group's heal gives a duck up amt HP back, up to its most */
hpBreed("maps", {
  of: (s, id, now, seated) =>
    seated && inWorld(s) ? [Math.max(0, l4Hp(s, id) || 0), maxHp(s, id)] : null,
  heal(s, id, amt) {
    const p = (s.hang.l4p || {})[id],
      max = maxHp(s, id);
    if (!p || p.dn || p.gh || p.hp >= max) return;
    s.hang.l4p = { ...s.hang.l4p, [id]: { ...p, hp: hpHeal(p.hp, amt, max) } };
  },
  most: maxHp,
  store: (s) => s.hang && s.hang.l4p,
});
/* Sandbox's zones: each zombie standing where on({ x, y: shares of the map, z: the ground's height there, sp }) says
   loses amt HP ("damage", whole HP, at least 1), gets it back ("heal", up to its most) or dies ("kill") */
export function l4Zone(s, on, fx, amt, now) {
  if (!s.hang || !s.hang.zp) return false;
  const zs = zombies(s);
  let any = false;
  for (const z of zs) {
    if (
      z.st === 3 ||
      !on({ x: z.x / W, y: z.y / H, z: heightAt(z.x, z.y), sp: z.sp })
    )
      continue;
    const hp =
      fx === "heal"
        ? Math.min(z.l[0], z.hp + Math.max(1, Math.round(amt)))
        : fx === "kill"
          ? 0
          : Math.max(0, z.hp - Math.max(1, Math.round(amt)));
    if (hp === z.hp) continue;
    z.hp = hp;
    if (hp <= 0) die(z, now);
    any = true;
  }
  if (any) store(s, zs, true);
  return any;
}
