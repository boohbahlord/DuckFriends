/* ---------- the wounds a hit leaves (Quacky Zombies' zombies, and every other mode's ducks: the owner's, Nov 4) ----------
   A wound is a code of 2 characters, its kind and its spot (l4ddart.js hitsOf draws them): b a small bullet hole, B a
   big one, s pellets, c a bleeding cut, r a bruise, a a stuck arrow, k a chunk torn out, p the beak shot off, x the head
   gone, g a grenade's gore (every chunk, cuts and big holes), f burnt. Which a weapon leaves, and how often: WOUND. */
const WOUND = {
  small: {
    p: 0.35,
    kinds: [
      ["b", 0.75],
      ["c", 0.25],
    ],
    chunk: 0.04,
  },
  big: {
    p: 0.55,
    kinds: [
      ["B", 0.85],
      ["c", 0.15],
    ],
    chunk: 0.1,
  },
  shot: {
    p: 0.2,
    kinds: [
      ["s", 0.9],
      ["c", 0.1],
    ],
    chunk: 0.06,
  },
  blade: { p: 0.45, kinds: [["c", 1]] },
  blunt: { p: 0.55, kinds: [["r", 1]] },
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
  revolver: "big",
  chaingun: "big",
  shotgun: "shot",
  pellet: "shot",
  knife: "blade",
  dagger: "blade",
  jaime: "blade",
  hammer: "blunt",
  chair: "blunt",
  bow: "arrow",
  arrow: "arrow",
};
/* a new wound for a hit by weapon w on something that has `had` (or "": none this time, or it has enough: 6) */
export function woundCode(had, w) {
  const W = WOUND[WOUND_OF[w]];
  if (!W || had.replace(/[gf]0/g, "").length >= 12 || Math.random() >= W.p)
    return "";
  let r = Math.random(),
    kind = W.kinds[W.kinds.length - 1][0];
  for (const [k, p] of W.kinds)
    if ((r -= p) < 0) {
      kind = k;
      break;
    }
  if (W.chunk && Math.random() < W.chunk)
    kind = Math.random() < 0.2 && !had.includes("p") ? "p" : "k";
  const spots = kind === "a" || kind === "k" ? 6 : 8,
    add = kind + Math.floor(Math.random() * spots);
  return had.includes(add) ? "" : add;
}

/* ---------- the ducks' wounds, outside Quacky Zombies ----------
   Each wound goes away by itself 6 to 12 seconds (a roll for each) after its duck is up again: the clock stops while it
   plays dead. A crit (PCRIT: a weapon's chance, as Quacky Zombies' headshots) takes all its HP, blows its head off
   (x0) and keeps it down CRIT_DOWN ms; a grenade or a Jaime Bomb that kills it leaves it as the Jaime Bomb leaves
   Jaime: torn apart, headless and burnt (DEATH). s.pw = { id: { m: [[code, ms left]], at: when its clock started
   (0: stopped, it's down) } } */
export const PCRIT = { handgun: 0.05, bow: 0.05, arrow: 0.05 };
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
    if (c && !m.some(([k]) => k === c)) m.push([c, fade()]);
  s.pw = { ...(s.pw || {}), [id]: { m, at: down ? 0 : now } };
}
/* a wound for a hit by weapon w (none if this one leaves nothing) */
export function pwHit(s, id, w, now, down) {
  const had = pwCodes(s, id, now),
    c = woundCode(had, w);
  if (c) pwAdd(s, id, [c], now, down);
}
/* the host's heartbeat: each duck's clock stops while it's down and starts once it's up; wounds that ran out go */
export function pwTick(s, now) {
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
/* the wounds duck id shows now (for l4ddart.js hitsOf) */
export function pwCodes(s, id, now) {
  const w = (s.pw || {})[id];
  if (!w) return "";
  return settled(w, now)
    .filter(([, l]) => l > 0)
    .map(([c]) => c)
    .join("");
}
