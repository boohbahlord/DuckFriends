/* ---------- the wounds a hit leaves (Quacky Zombies' zombies, and every other mode's ducks: the owner's, Nov 4) ----------
   A wound is a code of 2 characters, its kind and its spot (hitsOf, below, draws them): b a small bullet hole, B a
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
  laser: {
    p: 0.6,
    kinds: [
      ["b", 0.4],
      ["B", 0.2],
      ["c", 0.4],
    ],
    beak: 0.1,
    eye: 0.1,
  }, // (the Laser Rifle's beam: holes, cuts, an eye or the beak burnt off; the owner's, Nov 17)
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
  tommy: "small",
  ump: "small",
  lmg: "small",
  sniper: "big",
  ak: "big",
  burst: "big",
  revolver: "big",
  dbarrel: "big",
  slug: "big",
  shotgun: "shot",
  pellet: "shot",
  knife: "blade",
  dagger: "blade",
  hammer: "blunt",
  pan: "blunt",
  axe: "blade",
  sword: "blade",
  chair: "blunt",
  bow: "arrow",
  arrow: "arrow",
  claw: "claw",
  laser: "laser",
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
const knockable = (d) => {
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
const KNOCKED = 10000; // (ms a knocked-off hat or face item stays off: the owner's "in like 10 seconds")
const BACK = 1500; // (its last ms of those it shows half see-through, coming back on)
/* a new wound for a hit by weapon w on something that has `had` (or "": none this time, or it has enough: 6); can:
   what it wears that could be knocked off (knockable) */
function woundCode(had, w, can = {}) {
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

/* ---------- who takes hits (Type Object: every mode's hit is Dead Ducks Arcade's; these say how each kind differs) ----------
   head: when a crit blows its head off, once: "kill" only on one that kills it (the owner's, Nov 21 17:25Z: "a critical
   hit on any duck will give a headshot effect only if it is the killing blow"), never without (a duck's crit is its
   own: rules.js wounded). blast: a blast that kills it tears it apart (every DEATH code
   it hasn't got). can(look): what a hit can knock off it (a hat, a face item) */
const NONE = () => ({});
export const WOUND_BREEDS = {
  zombie: { head: "kill", can: NONE }, // (Dead Ducks Arcade's, Mad God Justin's waves, Sandbox's on a map)
  justin: { head: "kill", can: knockable }, // (on the board and in Hangout)
  merchant: { head: "kill", blast: true, can: knockable },
  duck: { can: knockable }, // (its wounds come and go: pwHit)
};
/* the wounds one of breed b has after a hit by weapon w (had: its wounds so far). how: head (a crit),
   dead (the hit killed it), blast (it was a blast), look (what it looks like: what can be knocked off) */
export function hitWounds(had, w, b, { head, dead, blast, look } = {}) {
  had = had || "";
  if (head && b.head === "kill" && dead)
    return had.includes("x") ? had : had + "x0";
  if (b.blast && dead && blast)
    return had + DEATH.filter((c) => !had.includes(c)).join("");
  return had + woundCode(had, w, b.can(look));
}
/* the weapon a newest wound tells of, for its blood when no shot hit it (a knife, a hammer): fx.js fxHitAt's kinds */
export const BY_WOUND = {
  b: "handgun",
  B: "ak",
  s: "pellet",
  c: "knife",
  r: "hammer",
  a: "arrow",
  k: "sniper",
  g: "sniper",
};
/* the kind of the wound added between `had` and `now` (codes only ever grow at the end), or "" */
export const newWound = (had = "", now = "") =>
  now.length > had.length ? now[had.length] : "";

/* ---------- killed by an explosion (the owner's nuke, Nov 16 16:13Z) ----------
   A few looks made beforehand, put on in one step (no animation): torn apart and burnt, with the head blown off, or
   the beak and the eye gone, or more chunks out. explodedLook(seed) gives one look's codes, the same for the same seed:
   a zombie's s.hang.zw string. */
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
   plays dead. A crit (guns.js critOf, as everywhere) that puts it down blows its head off (x0) and keeps it down
   CRIT_DOWN ms; a grenade that kills it leaves it torn apart, headless and burnt (DEATH). s.pw = { id: { m: [[code, ms left]], at: when its clock started
   (0: stopped, it's down) } } */
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
    c = hitWounds(had, w, WOUND_BREEDS.duck, {
      look: (s.players[id] || {}).duck,
    }).slice(had.length);
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
/* the wounds duck id shows now (for hitsOf): a knocked-off hat or face item in its last BACK ms shows
   coming back on (spot 1) */
/* the modes that aren't the normal games: there a knocked-off hat comes back by itself, as it did (in the normal games it
   stays off until the duck comes back from dying: rules.js) */
const NOT_NORMAL = ["l4dd", "hang"];
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

/* ---------- how a wound looks ----------
   The blood and the shapes every wound is drawn with (the zombies' own scars, cuts and rot use them too: l4ddart.js). */
export const BLOOD = "#7d1424",
  BLOOD_D = "#3d0910",
  BLOOD_L = "#d2384a";
/* a shape drawn around 0 0, put at x y, turned a degrees and k times as big */
export const place = (svg, x, y, a = 0, k = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})">${svg}</g>`;
/* a cut, a drop of blood and a bruise, each around 0 0 */
export const CUT = `<path d="M-9 3.4Q0 -3.4 9.4 -2.4Q1 1.8 -9 3.4Z" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width="1" stroke-linejoin="round"/>
<path d="M-5.6 1.8Q0 -1.2 6 -1.6" stroke="${BLOOD_L}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
const DRIP = `<path d="M-1.6 .4C-1.4 3 -2.2 5.6 -2.2 7.4a2 2 0 0 0 4 0C1.8 5.6 1 3 1 -.4Z" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width=".8"/>`;
export const BRUISE = `<ellipse rx="8.8" ry="7.6" fill="#6b1f5c" opacity=".5"/><ellipse rx="5.8" ry="4.8" fill="#3a0f34" opacity=".4"/>`;
/* a cut that bleeds: the cut, turned, and a drop running straight down from its middle */
export const bleeding = (x, y, a, k, drops = 1) =>
  (drops > 1 ? place(DRIP, x - 3 * k, y + 0.6 * k, 0, k * 0.8) : "") +
  place(DRIP, x, y, 0, k) +
  place(CUT, x, y, a, k);
/* ---------- the wounds a zombie gets from hits (owner 2026-11-04 04:01Z) ----------
   The host picks them (l4ddrules.js, s.hang.zw: two letters each, a kind and a spot), so every screen shows the same:
   b a small bleeding bullet hole (the handgun, the SMG, the LMG), B a big one with spatter (the sniper, the AK-47, the
   revolver), s the shotgun's spread of pellet holes, c a bleeding cut (a knife, a dagger, now and then a
   bullet or an arrow), r a bruise (the hammer, the chair), a an arrow left sticking in it, k a bloody chunk torn out of
   it, p its beak shot off (a bloody mess in its place), x its head blown off (a headshot), g a grenade's (owner
   2026-11-04 06:44Z: every chunk torn out, bleeding cuts and big bullet holes, all at once), f burnt by fire (black and
   brown scorch with embers, for good). Each in the 120 box. */
const FLESH = "#2a0508";
const HIT_AT = [
  [88, 78],
  [66, 96],
  [30, 70],
  [60, 44],
  [92, 90],
  [48, 100],
  [84, 52],
  [22, 60],
];
/* a bullet hole goes right through the skin (owner, Nov 16: "holes in ducks should be literally holes through the skin
   of a duck"): the hole is cut out of the duck (duck.js' gone.holes, as a chunk), and these are its torn rims */
const SMALL_R = 2.6,
  BIG_R = 4.2;
const SMALL_HOLE = `<circle r="${SMALL_R + 2.2}" fill="${BLOOD}" opacity=".55"/><circle r="${SMALL_R + 0.6}" fill="none" stroke="${BLOOD_D}" stroke-width="1.4"/>${place(DRIP, 0.4, SMALL_R + 1.2, 0, 0.7)}`;
const BIG_HOLE = `<circle r="${BIG_R + 3}" fill="${BLOOD}" opacity=".55"/><circle r="${BIG_R + 0.9}" fill="none" stroke="${BLOOD_D}" stroke-width="1.8"/><circle r="${BIG_R + 0.3}" fill="none" stroke="${FLESH}" stroke-width=".8"/>
<circle cx="7.6" cy="-5" r="1.3" fill="${BLOOD}"/><circle cx="-7" cy="-4.2" r="1" fill="${BLOOD}"/><circle cx="8.8" cy="1.6" r=".8" fill="${BLOOD}"/>${place(DRIP, 0.6, BIG_R + 1.6, 0, 1.1)}`;
const PELLETS = `<ellipse rx="9.4" ry="7.4" fill="${BLOOD}" opacity=".35"/>${[
  [-4.6, -3],
  [1.4, -4.4],
  [5.2, -0.6],
  [-1.2, 0.6],
  [-5, 3],
  [2.6, 3.8],
]
  .map(
    ([x, y]) =>
      `<circle cx="${x}" cy="${y}" r="1.45" fill="${FLESH}" stroke="${BLOOD_D}" stroke-width=".5"/>`,
  )
  .join("")}${place(DRIP, -1.2, 1.4, 0, 0.6)}${place(DRIP, 2.6, 4.6, 0, 0.55)}`;
/* where an arrow sticks in, and which way its shaft points out (degrees) */
const ARROW_AT = [
  [30, 68, 190],
  [96, 80, -15],
  [60, 27, -120],
  [56, 101, 100],
  [18, 56, 205],
  [92, 92, 25],
];
const ARROW = `<path d="M0 0H19" stroke="#7a4a22" stroke-width="2.2" stroke-linecap="round"/>
<path d="M15 0l5 -4h5l-3 4l3 4h-5Z" fill="#e8463a" stroke="#5a1a14" stroke-width=".7" stroke-linejoin="round"/>
<circle r="2.6" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width=".6"/>`;
/* the chunks: bites out of its outline (x, y, r), never the whole head */
const CHUNK_AT = [
  [38, 62, 8.5],
  [14, 50.5, 7.5],
  [62, 104, 9],
  [98.5, 76, 8.5],
  [24, 92, 8.5],
  [57.5, 26.5, 7.5],
];
const chunkRim = ([x, y, r]) =>
  `<circle cx="${x}" cy="${y}" r="${r + 1.5}" fill="none" stroke="${BLOOD}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${r + 0.5}" fill="none" stroke="${FLESH}" stroke-width="1.2"/>${place(DRIP, x, y + r + 1.4, 0, 0.8)}`;
const BEAK_GONE = `<ellipse cx="98" cy="42" rx="4.6" ry="6.2" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width="1"/><ellipse cx="98.6" cy="41.6" rx="2.4" ry="3.6" fill="${FLESH}"/>
<path d="M101.6 36.6l3 -1.4l-1 2.8ZM101.4 47l3.2 1l-2.6 1.6Z" fill="#ff9a1f" stroke="#c45f00" stroke-width=".6"/>${place(DRIP, 97.6, 47, 0, 0.9)}`;
const HEADLESS = `<ellipse cx="75" cy="60.6" rx="14.4" ry="4.8" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width="1.1"/><ellipse cx="75" cy="60.2" rx="9.4" ry="2.7" fill="${FLESH}"/><ellipse cx="72.4" cy="59.6" rx="2.2" ry="1" fill="#efe2d0"/>
${place(DRIP, 66, 63, 0, 1.1)}${place(DRIP, 83.6, 63.4, 0, 0.9)}<circle cx="69" cy="51" r="1.3" fill="${BLOOD}"/><circle cx="80" cy="47.6" r="1.1" fill="${BLOOD}"/><circle cx="76" cy="43" r=".9" fill="${BLOOD}"/><circle cx="86" cy="53" r=".8" fill="${BLOOD}"/>`;
/* its eye blown out (the owner's, Nov 16): a bloody socket where the eye was, the eye's flesh torn round it, a drip
   down the cheek */
const EYE_GONE = `<ellipse cx="83" cy="34.4" rx="6.2" ry="7" fill="${BLOOD}" stroke="${BLOOD_D}" stroke-width="1"/><ellipse cx="83.2" cy="34.6" rx="3.6" ry="4.4" fill="${FLESH}"/><ellipse cx="82" cy="33" rx="1.1" ry=".8" fill="#5a0a14"/>
<circle cx="90" cy="30" r="1.1" fill="${BLOOD}"/><circle cx="77" cy="28.4" r=".9" fill="${BLOOD}"/>${place(DRIP, 82.4, 40.6, 0, 0.9)}`;
/* burnt: scorch over the body and the head (clipped to the duck), darker in the middle, and a few embers */
const BURNT = `<g opacity=".92">${[
  [40, 80, 25, 15, -12],
  [78, 92, 19, 10, 8],
  [60, 30, 11, 9, -20],
  [22, 62, 12, 10, 30],
  [99, 72, 11, 9, 0],
  [56, 60, 10, 6, 10],
]
  .map(
    ([x, y, rx, ry, a]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#2a1a10" opacity=".78"/><ellipse cx="${x + 1}" cy="${y}" rx="${(rx * 0.6).toFixed(1)}" ry="${(ry * 0.55).toFixed(1)}" transform="rotate(${a} ${x} ${y})" fill="#0b0705" opacity=".9"/>`,
  )
  .join("")}</g>${[
  [36, 80],
  [44, 75],
  [74, 94],
  [60, 30],
  [26, 66],
  [98, 75],
]
  .map(
    ([x, y]) =>
      `<circle cx="${x}" cy="${y}" r=".9" fill="#ff8a2a" opacity=".85"/>`,
  )
  .join("")}`;
/* a grenade's: every chunk, three big holes and three bleeding cuts */
const GORE = () => ({
  inner: [
    ...CHUNK_AT.map(chunkRim),
    ...[0, 3, 6].map((i) => place(BIG_HOLE, ...HIT_AT[i])),
    ...[1, 4, 7].map((i) => bleeding(...HIT_AT[i], i * 37 - 60, 1.15)),
  ],
  holes: CHUNK_AT,
});
/* the hits as duckSVG's skin and gone: codes is s.hang.zw's string for one zombie. inner and out are lists of marks */
export function hitsOf(codes = "") {
  const inner = [],
    out = [],
    holes = [],
    rips = [],
    gone = {};
  for (let i = 0; i + 1 < codes.length; i += 2) {
    const kind = codes[i],
      at = +codes[i + 1] || 0,
      [x, y] = HIT_AT[at % HIT_AT.length];
    if (kind === "b" || kind === "B") {
      inner.push(place(kind === "b" ? SMALL_HOLE : BIG_HOLE, x, y));
      holes.push([x, y, kind === "b" ? SMALL_R : BIG_R]); // (seen through)
      rips.push([x, y, (kind === "b" ? SMALL_R : BIG_R) * 1.6 + 5.5]); // (and its clothes torn round it)
    } else if (kind === "s") {
      inner.push(place(PELLETS, x, y));
      rips.push([x, y, 11.5]);
    } else if (kind === "c") {
      inner.push(bleeding(x, y, at * 37 - 60, 1.15));
      rips.push([x, y, 8.5]);
    } else if (kind === "e") {
      gone.eyes = true;
      out.push(EYE_GONE);
    } else if (kind === "h") gone.hat = at ? 0.5 : 0;
    else if (kind === "m") gone.face = at ? 0.5 : 0;
    else if (kind === "r") inner.push(place(BRUISE, x, y, 0, 0.95));
    else if (kind === "a") {
      const [ax, ay, a] = ARROW_AT[at % ARROW_AT.length];
      out.push(place(ARROW, ax, ay, a));
    } else if (kind === "k") {
      const c = CHUNK_AT[at % CHUNK_AT.length];
      holes.push(c);
      rips.push([c[0], c[1], c[2] + 6]);
      inner.push(chunkRim(c));
    } else if (kind === "p") {
      gone.beak = true;
      out.push(BEAK_GONE);
    } else if (kind === "x") gone.head = true;
    else if (kind === "g") {
      const g = GORE();
      inner.push(...g.inner);
      for (const c of g.holes)
        if (!holes.includes(c)) {
          holes.push(c);
          rips.push([c[0], c[1], c[2] + 6]);
        }
      for (const i of [0, 3, 6]) rips.push([...HIT_AT[i], BIG_R * 1.6 + 5.5]);
    } else if (kind === "f") inner.unshift(BURNT); // (under the other wounds)
  }
  if (gone.head) out.push(HEADLESS);
  if (holes.length) gone.holes = holes;
  if (rips.length) gone.rips = rips;
  return { inner, out, gone }; // (lists, a mark to each: duckSVG's skin takes them so)
}
/* a look's wounds as duckSVG takes them: its skin (the marks) and what it has lost. One for every duck, zombie, NPC and
   Justin, made once for each set of codes; none: nothing */
const LOOKED = new Map();
export function woundLook(wc) {
  if (!wc) return {};
  if (!LOOKED.has(wc)) {
    if (LOOKED.size > 200) LOOKED.clear();
    const h = hitsOf(wc);
    LOOKED.set(wc, { skin: { head: h.inner, out: h.out }, gone: h.gone });
  }
  return LOOKED.get(wc);
}
