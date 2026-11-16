/* ---------- the wounds a hit leaves (Quacky Zombies' zombies, and every other mode's ducks: the owner's, Nov 4) ----------
   A wound is a code of 2 characters, its kind and its spot (l4ddart.js hitsOf draws them): b a small bullet hole, B a
   big one, s pellets, c a bleeding cut, r a bruise, a a stuck arrow, k a chunk torn out, p the beak shot off, x the head
   gone, g a grenade's gore (every chunk, cuts and big holes), f burnt. Which a weapon leaves, and how often: WOUND.
   The owner's, Nov 16 15:55Z ("knocking off hats or face apparel … or even shooting their beak off their face or blowing
   their eyes out their face"): e its eye blown out, h its hat knocked off, m its face item knocked off. A hat or a face
   item comes back on by itself (KNOCKED ms): its spot says how far, 0 off, 1 fading back on. A hit through clothes
   rips them (hitsOf: gone.rips). */
const WOUND = {
  small: {
    p: 0.35,
    kinds: [
      ["b", 0.75],
      ["c", 0.25],
    ],
    chunk: 0.04,
    hat: 0.12,
  },
  big: {
    p: 0.55,
    kinds: [
      ["B", 0.85],
      ["c", 0.15],
    ],
    chunk: 0.1,
    hat: 0.25,
  },
  shot: {
    p: 0.2,
    kinds: [
      ["s", 0.9],
      ["c", 0.1],
    ],
    chunk: 0.06,
    hat: 0.22,
  },
  blade: { p: 0.45, kinds: [["c", 1]], beak: 0.07, eye: 0.06 }, // (a blade now and then cuts the beak off or an eye out)
  claw: {
    p: 0.6,
    kinds: [
      ["c", 0.75],
      ["r", 0.25],
    ],
  }, // (a zombie's claw on a duck in Quacky Zombies: cuts and bruises)
  blunt: { p: 0.55, kinds: [["r", 1]], beak: 0.08, eye: 0.07, hat: 0.3 }, // (a blow knocks the beak off, an eye out, the hat off)
  arrow: {
    p: 0.5,
    kinds: [
      ["c", 0.35],
      ["a", 0.65],
    ],
  },
};
const WOUND_OF = {
  handgun: "small",
  smg: "small",
  lmg: "small",
  sniper: "big",
  ak: "big",
  burst: "big",
  revolver: "big",
  dbarrel: "big",
  slug: "big",
  chaingun: "big",
  chain: "big", // (the chain gun's shot outside Quacky Zombies, rules.js chainShot)
  shotgun: "shot",
  pellet: "shot",
  knife: "blade",
  dagger: "blade",
  jaime: "blade",
  hammer: "blunt",
  pan: "blunt",
  axe: "blade",
  sword: "blade",
  chair: "blunt",
  bow: "arrow",
  arrow: "arrow",
  claw: "claw",
};
/* what can be knocked off: every hat and face item but hair, horns, what floats or grows on the head, a full helmet or
   head cover, and paint (the owner's "only appropriate ones, so not a full helmet like a motorcycle helmet or face
   paint") */
const STAYS = {
  hat: ["afro", "clownwig", "horns", "halo", "antenna", "antennae", "eye"],
  face: [
    "moto",
    "scifi",
    "ski",
    "pumpkin",
    "box",
    "bag",
    "gasmask",
    "clownpaint",
  ],
};
/* what duck look `d` wears that a hit could knock off: { hat, face, beak }. Jack in a Box and an uploaded picture
   show no hat or face item, and they and Dat Boi have no beak, so nothing of those flies off them */
const idOf = (v) => (v && typeof v === "object" ? v.id : v) || "";
export const knockable = (d) => {
  const hat = idOf(d && d.hat),
    face = idOf(d && d.face),
    style = d && d.style,
    shown = !(d && d.image) && style !== "jack";
  return {
    hat: shown && !!hat && hat !== "none" && !STAYS.hat.includes(hat),
    face: shown && !!face && face !== "none" && !STAYS.face.includes(face),
    beak: shown && style !== "datboi",
  };
};
export const KNOCKED = 10000; // (ms a knocked-off hat or face item stays off: the owner's "in like 10 seconds")
const BACK = 1500; // (its last ms of those it shows half see-through, coming back on)
/* a new wound for a hit by weapon w on something that has `had` (or "": none this time, or it has enough: 6); can:
   what it wears that could be knocked off (knockable) */
export function woundCode(had, w, can = {}) {
  const W = WOUND[WOUND_OF[w]];
  if (!W) return "";
  const off = (k) => !had.includes(k + "0") && !had.includes(k + "1");
  if (W.hat && Math.random() < W.hat) {
    if (can.hat && off("h")) return "h0";
    if (can.face && off("m")) return "m0";
  } // (knocked off: it doesn't count as a wound)
  if (had.replace(/[gfhm][01]/g, "").length >= 12 || Math.random() >= W.p)
    return "";
  const beak = can.beak !== false && !had.includes("p");
  if (W.beak && Math.random() < W.beak && beak) return "p0";
  if (W.eye && Math.random() < W.eye && !had.includes("e")) return "e0";
  let r = Math.random(),
    kind = W.kinds[W.kinds.length - 1][0];
  for (const [k, p] of W.kinds)
    if ((r -= p) < 0) {
      kind = k;
      break;
    }
  if (W.chunk && Math.random() < W.chunk) {
    const q = Math.random();
    kind = q < 0.2 && beak ? "p" : q < 0.35 && !had.includes("e") ? "e" : "k"; // (a bullet tears a chunk out, or shoots the beak off or an eye out)
  }
  if (kind === "p" || kind === "e") return kind + "0";
  const spots = kind === "a" || kind === "k" ? 6 : 8,
    add = kind + Math.floor(Math.random() * spots);
  return had.includes(add) ? "" : add;
}

/* ---------- killed by an explosion (the owner's nuke, Nov 16 16:13Z) ----------
   A few looks made beforehand, put on in one step (no animation): torn apart and burnt, with the head blown off, or
   the beak and the eye gone, or more chunks out. explodedLook(seed) gives one look's codes, the same for the same seed:
   a zombie's s.hang.zw string, or a duck's wounds (pwExploded). */
const EXPLODED = [
  "g0f0x0",
  "g0f0p0e0",
  "g0f0e0k1k4B5",
  "g0f0p0k2k5B3",
  "g0f0x0k0k3",
];
export const explodedLook = (seed = 0) =>
  EXPLODED[
    (((seed | 0) % EXPLODED.length) + EXPLODED.length) % EXPLODED.length
  ];
/* the codes of a look with gore off (Game Settings' Gore): only a hat or a face item knocked off is left */
export const goreFree = (codes = "") =>
  (codes.match(/[hm][01]/g) || []).join("");

/* ---------- the ducks' wounds (in Quacky Zombies too: a zombie's claw, the owner's, Nov 4 08:05Z) ----------
   Each wound goes away by itself 6 to 12 seconds (a roll for each) after its duck is up again: the clock stops while it
   plays dead. A crit (PCRIT: a weapon's chance, as Quacky Zombies' headshots) takes all its HP, blows its head off
   (x0) and keeps it down CRIT_DOWN ms; a grenade or a Jaime Bomb that kills it leaves it as the Jaime Bomb leaves
   Jaime: torn apart, headless and burnt (DEATH). s.pw = { id: { m: [[code, ms left]], at: when its clock started
   (0: stopped, it's down) } } */
export const PCRIT = {
  handgun: 0.05,
  bow: 0.05,
  arrow: 0.05,
  sniper: 0.05,
  smg: 0.0175,
  ak: 0.03,
  revolver: 0.04,
  lmg: 0.0125,
  pan: 0.5, // (half the pan's hits: the owner's, Nov 16)
  burst: 0.03,
  dbarrel: 0.1,
  slug: 0.1,
}; // (Quacky Zombies' guns: their headshot chances there, l4ddrules.js ARMS)
export const CRIT_DOWN = 4000;
export const DEATH = ["g0", "x0", "f0"];
const FADE = [6000, 12000];
const fade = () => Math.round(FADE[0] + Math.random() * (FADE[1] - FADE[0]));
/* the time left on each wound, as of now (a running clock taken off) */
const settled = (w, now) =>
  w.at ? w.m.map(([c, l]) => [c, l - (now - w.at)]) : w.m;
/* wound codes onto duck id (down: it's down now, so its clock waits) */
export function pwAdd(s, id, codes, now, down) {
  const w = (s.pw || {})[id] || { m: [], at: 0 },
    m = settled(w, now).filter(([, l]) => l > 0);
  for (const c of codes)
    if (
      c &&
      !m.some(([k]) => k[0] === c[0] && (k === c || "hm".includes(c[0])))
    )
      m.push([c, "hm".includes(c[0]) ? KNOCKED : fade()]);
  s.pw = { ...(s.pw || {}), [id]: { m, at: down ? 0 : now } };
}
/* a wound for a hit by weapon w (none if this one leaves nothing) */
export function pwHit(s, id, w, now, down) {
  const had = pwCodes(s, id, now),
    c = woundCode(had, w, knockable((s.players[id] || {}).duck));
  if (c) pwAdd(s, id, [c], now, down);
}
/* the host's heartbeat: each duck's clock stops while it's down and starts once it's up; wounds that ran out go */
export function pwTick(s, now, keep = false) {
  if (!s.pw) return false;
  let ch = false;
  const next = {};
  for (const [id, w] of Object.entries(s.pw)) {
    const P = s.players[id];
    if (!P) {
      ch = true;
      continue;
    }
    let o = w;
    if (keep) {
      /* the normal games: a wound stays until the duck dies and comes back (rules.js), so a live duck's clock is stopped */
      if (!P.dead && w.at) {
        o = { m: settled(w, now), at: 0 };
        ch = true;
      }
      next[id] = o;
      continue;
    }
    if (P.dead && w.at) o = { m: settled(w, now), at: 0 };
    else if (!P.dead && !w.at) o = { m: w.m, at: now };
    const m = settled(o, now);
    if (m.some(([, l]) => l <= 0))
      o = { m: m.filter(([, l]) => l > 0), at: o.at ? now : 0 };
    if (o !== w) ch = true;
    if (o.m.length) next[id] = o;
    else ch = true;
  }
  if (ch) s.pw = Object.keys(next).length ? next : null;
  return ch;
}
/* a duck killed by an explosion (the nuke): one of the looks made beforehand, on at once (it's down) */
export function pwExploded(s, id, seed, now) {
  const codes = explodedLook(seed).match(/../g);
  pwAdd(s, id, codes, now, true);
}
/* the wounds duck id shows now (for l4ddart.js hitsOf): a knocked-off hat or face item in its last BACK ms shows
   coming back on (spot 1) */
/* the modes that aren't the normal games: there a knocked-off hat comes back by itself, as it did (in the normal games it
   stays off until the duck comes back from dying: rules.js) */
const NOT_NORMAL = ["l4dd", "mgj", "hang"];
export function pwCodes(s, id, now) {
  const w = (s.pw || {})[id];
  if (!w) return "";
  return settled(w, now)
    .filter(([, l]) => l > 0)
    .map(([c, l]) =>
      "hm".includes(c[0]) && l < BACK && NOT_NORMAL.includes(s.options.mode)
        ? c[0] + "1"
        : c,
    )
    .join("");
}
