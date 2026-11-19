/* ---------- Survival: the friendly squad (the owner's, Nov 19 19:27Z and 19:47Z) ----------
   Now and then, as a rest begins ("4% each rest phase (only when none alive)"), a squad of soldiers on our side shows up
   in the church by its front doors, with "Help has Arrived" as the merchant's notice. Each has a name under it and a
   light green outline; one of them talks at a time (the lines the owner approved, each list played through before any
   line comes again). They hang about through the rest, then fight with us: zombies and the gunmen, at half damage, and
   they can die. The gunmen shoot at them as they do at us (gunmenrules.js).
   Friendly fire (only the player who did it is ever targeted):
   - in a peak, one killed is forgiven; 2 killed within 15 s (never by an explosive) turn the squad on that player;
     lighting more than one with fire within 15 s does too;
   - in a rest, killing one turns them;
   - turned, they go for that player above the zombies, unless a zombie is about to hit them (then the knife);
   - a player's explosive does them only 1 damage, and fire never spreads from one of them to another.
   They live in s.hang.gm.gb with the gunmen (k "f", nm their name, hm their spot by the doors, ldr the leader), and
   s.hang.gm keeps: turn { id: 1 } the players they've turned on, fk { id: [kill times] }, fl { id: { i: when lit } },
   fs (until when one is talking), fb { list: [what's left of its bag] }, fph (the phase they saw last), pd { id: 1 }
   the ducks down, tk { id: when they answered it } (until it walks off) */
import {
  GM,
  gmOf,
  pick,
  newGunman,
  shoot,
  stab,
  suppress,
} from "./gunmenrules.js";
import { clearShot, chaseStep } from "./l4ddrules.js";
import { heightAt } from "./hangout/layout.js";
import { CHAPEL, CHAPEL_DOOR } from "./hangout/stationmap.js";

export const FR = {
  CHANCE: 0.04, // each rest's chance, while none of them is alive
  FF_MS: 15000, // ms: two kills (or two lit) inside this turn them, in a peak
  SAY_MS: 3200, // ms a line shows over its head
  TALK_R: 1.8, // duck lengths: walk up this near in a rest and one of them answers
  NEAR: 4, // duck lengths: in a fight they keep about this near the nearest duck
};
const BOOMS = ["grenade", "glauncher", "jaimebomb"]; // (explosives: kills by these are never counted)

/* the owner's approved words (friendly-squad-words.md, Nov 19 19:40Z) */
const RANKS = ["Pvt.", "Cpl.", "Sgt."];
const NAMES = [
  "Hale",
  "Brooks",
  "Ortega",
  "Novak",
  "Reyes",
  "Okafor",
  "Walsh",
  "Kowalski",
  "Tran",
  "Mercer",
  "Delgado",
  "Haynes",
  "Petrov",
  "Lindqvist",
  "Abara",
  "Castillo",
  "Dunn",
  "Fischer",
  "Grady",
  "Ibarra",
  "Kane",
  "Laszlo",
  "Moreau",
  "Nakamura",
  "Pike",
  "Quinn",
  "Rourke",
  "Sato",
  "Vance",
  "Wolfe",
];
const LINES = {
  arrive: [
    "Easy. We're on your side.",
    "Friendlies coming in. Don't shoot.",
    "We saw your lights. Mind if we stay?",
    "Squad, hold the doors.",
    "We'll take the next wave with you.",
  ],
  talk: [
    "Get some rest while you can.",
    "Reload now. You won't have time later.",
    "How long have you been out here?",
    "We lost contact with base three days ago.",
    "Keep away from the windows.",
    "You hear that? Neither do I. I don't like it.",
    "Got any spare ammo? Never mind, keep it.",
    "This church has good walls.",
    "My feet hurt.",
    "Stay close when it starts.",
    "We'll hold the left. You take the right.",
    "Don't stand in the doorway.",
    "I used to work at a bank.",
    "I miss pizza on Fridays.",
    "My daughter had a soccer game the day it started.",
  ],
  fight: [
    "Here they come!",
    "Weapons up!",
    "Contact front!",
    "Hold the line!",
    "On me!",
    "Watch your corners!",
  ],
  ff: [
    "Watch your fire!",
    "Hey! Same side!",
    "Check your target!",
    "I'm friendly!",
    "Not me!",
  ],
  down: ["Man down!", "We lost one!", "Keep fighting!", "Close the gap!"],
  pdown: ["Get them up!", "Cover them!", "Pull them back!"],
  clear: [
    "Clear!",
    "That's the last of them.",
    "Good work.",
    "Catch your breath.",
  ],
};

const alive = (gm) => gm.gb.filter((o) => o.k === "f" && !o.d);
/* one of them (o, or any of them) says a line from list k, if nobody else is talking: true when it did */
function say(gm, k, now, o = null, force = false) {
  const who = o || pick(alive(gm));
  if (!who || who.d || (!force && (gm.fs || 0) > now)) return false;
  const fb = { ...(gm.fb || {}) };
  let bag = fb[k] && fb[k].length ? [...fb[k]] : null;
  if (!bag) {
    bag = LINES[k].map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  const line = LINES[k][bag.pop()];
  fb[k] = bag;
  gm.fb = fb;
  for (const q of alive(gm)) delete q.nbs; // (one at a time)
  who.nbs = [line, now + FR.SAY_MS];
  gm.fs = now + FR.SAY_MS;
  return true;
}

/* a rest begins: maybe they come (H: gunmenrules.js' helper from l4ddrules.js) */
export function friendsCome(s, now, H) {
  const gm0 = gmOf(s);
  if (gm0 && alive(gm0).length) return;
  if (Math.random() >= FR.CHANCE) return;
  const gm = (s.hang.gm = {
    n: 0,
    gb: [],
    k: "",
    bk: 0,
    nb: 0,
    wv: 0,
    ...(gm0 || {}),
  });
  gm.gb = gm.gb.filter((o) => !o.d || o.k !== "f");
  gm.turn = {};
  gm.fk = {};
  gm.fl = {};
  gm.pd = {};
  /* just inside the church's front doors, in its north wall */
  const y = CHAPEL.y0 + 110,
    size =
      GM.SQUAD[0] + Math.floor(Math.random() * (GM.SQUAD[1] - GM.SQUAD[0] + 1)),
    sup = 1 + Math.floor(Math.random() * 2);
  /* their last names from a bag kept all game (gm.fnb): no name comes again till every one has been used (the owner's,
     Nov 19 22:25Z: "the ally soldiers should have different random name variations, and names don't repeat") */
  let names = gm.fnb && gm.fnb.length ? [...gm.fnb] : [...NAMES];
  for (let k = 0; k < size; k++) {
    /* two rows, every other one further in, so their names never overlap */
    const x0 = CHAPEL_DOOR.a - 60,
      x = x0 + ((CHAPEL_DOOR.b + 60 - x0) * (k + 0.5)) / size,
      y1 = y + (k % 2) * 90,
      at = H.open(x, y1)
        ? [x, y1]
        : H.open(x, y1 + 60)
          ? [x, y1 + 60]
          : [x, y1 + 120],
      o = newGunman(
        s,
        "f",
        at[0],
        at[1],
        H,
        k === 0 ? "lmg" : k <= sup ? "sup" : "rifle",
      ),
      last = names.splice(Math.floor(Math.random() * names.length), 1)[0];
    if (!names.length) names = NAMES.filter((n) => n !== last); // (all used: a new bag)
    o.nm = `${k === size - 1 ? "Lt." : pick(RANKS)} ${last}`;
    o.hm = [Math.round(at[0]), Math.round(at[1])];
    o.st = "rest";
    if (k === size - 1) o.ldr = 1;
    gm.gb.push(o);
  }
  gm.fnb = names;
  H.notice("help"); // ("Help has Arrived", as the merchant's)
  say(
    gm,
    "arrive",
    now,
    gm.gb.find((o) => o.ldr),
    true,
  );
}

/* every heartbeat, before each of them moves: their lines (talking, the fight starting, a wave over, a duck down) */
export function friendsTick(s, gm, ducks, now, H) {
  const us = alive(gm);
  for (const o of gm.gb)
    if (o.k === "f" && o.nbs && o.nbs[1] <= now) delete o.nbs;
  const ph = (s.hang.sv || {}).ph || "";
  if (!us.length) {
    gm.fph = ph;
    return;
  }
  if (gm.fph !== ph) {
    if (ph === "peak" && gm.fph === "rest") say(gm, "fight", now, null, true);
    if ((ph === "tail" || ph === "rest") && gm.fph === "peak")
      say(gm, "clear", now, null, true);
    gm.fph = ph;
  }
  /* a duck down: "Get them up!" */
  const pd = { ...(gm.pd || {}) };
  for (const id of H.ids) {
    if (!s.pos[id] || H.wild(id)) continue;
    if (!H.up(id) && !pd[id]) {
      pd[id] = 1;
      say(gm, "pdown", now);
    } else if (H.up(id) && pd[id]) delete pd[id];
  }
  gm.pd = pd;
  /* in a rest, a duck that walks up to them: the nearest one answers */
  if (ph !== "rest") return;
  const tk = { ...(gm.tk || {}) };
  for (const d of ducks) {
    if (d.j) continue;
    const o = us
      .map((q) => [q, Math.hypot(q.x - d.x, q.y - d.y)])
      .sort((a, b) => a[1] - b[1])[0];
    if (!o) continue;
    if (o[1] > FR.TALK_R * GM.DUCK * 2.5)
      delete tk[d.id]; // (it walked off: next time it walks up, they answer again)
    else if (
      !tk[d.id] &&
      o[1] < FR.TALK_R * GM.DUCK &&
      say(gm, "talk", now, o[0])
    )
      tk[d.id] = now; // (once each time it walks up)
  }
  gm.tk = tk;
}

/* one of them, its beat. o is its own copy in gm.gb (gunmenrules.js tick) */
export function friend(s, o, zs, ducks, pls, fieldTo, now, dt, H) {
  const gm = gmOf(s),
    sv = s.hang.sv || {},
    sees = (t) =>
      clearShot(o.x, o.y, t.x, t.y, heightAt(o.x, o.y)) &&
      Math.abs(heightAt(o.x, o.y) - (t.z || 0)) < 60,
    dist = (t) => Math.hypot(t.x - o.x, t.y - o.y),
    go = (x, y) => {
      const x0 = o.x;
      chaseStep(o, fieldTo(x, y), [x, y], H.speed * dt, pls);
      if (Math.abs(o.x - x0) > 0.5) o.f = o.x > x0 ? 1 : -1;
    };
  o.ld = 0;
  const live = zs.filter((z) => z.st !== 3),
    zn = live
      .map((z) => ({ z, x: z.x, y: z.y }))
      .sort((a, b) => dist(a) - dist(b));
  /* a zombie about to hit: the knife */
  if (zn[0] && dist(zn[0]) < GM.STAB * GM.DUCK) {
    o.st = "fire";
    stab(o, zn[0], now, H, s);
    return;
  }
  const bad = ducks.find((d) => (gm.turn || {})[d.id]),
    hostile = gm.gb
      .filter((q) => !q.d && !q.hid && ["c", "s", "sn"].includes(q.k))
      .map((q) => ({ fr: q, x: q.x, y: q.y, z: q.z || 0 })),
    reach = 9 * GM.DUCK,
    t = (bad ? [bad] : [...hostile, ...zn])
      .filter((c) => dist(c) < reach && sees(c))
      .sort((a, b) => dist(a) - dist(b))[0];
  if (t) {
    o.st = "fire";
    o.ld = Math.round(dist(t));
    if (shoot(s, o, t, now, H) && bad && o.ro === "lmg")
      suppress(s, o, t, ducks, now); // ("They keep the suppressive-fire tactics")
    return;
  }
  if (bad) {
    o.st = "in";
    go(bad.x, bad.y);
    return;
  }
  /* nothing in its sights: in a rest by the doors; else with the ducks */
  const fighting = sv.ph !== "rest" || hostile.length;
  if (!fighting) {
    o.st = "rest";
    if (o.hm && Math.hypot(o.hm[0] - o.x, o.hm[1] - o.y) > 40) go(...o.hm);
    return;
  }
  const d = ducks.filter((q) => !q.j).sort((a, b) => dist(a) - dist(b))[0];
  o.st = "in";
  /* each its own place round that duck (a ring, by its number), so they spread out instead of piling up */
  const a = o.i * 2.4,
    spot = d && [
      d.x + Math.cos(a) * FR.NEAR * 0.6 * GM.DUCK,
      d.y + Math.sin(a) * FR.NEAR * 0.4 * GM.DUCK,
    ];
  if (spot && Math.hypot(spot[0] - o.x, spot[1] - o.y) > GM.DUCK)
    go(spot[0], spot[1]);
  o.ad = d
    ? Math.round((Math.atan2(d.y - o.y, d.x - o.x) * 180) / Math.PI)
    : o.ad;
}

/* one of them hurt (o: its copy, already with its HP) by player `by` (or nothing, null) with weapon w; how "blast": an
   explosive's */
export function friendHurt(s, o, by, w, now, how) {
  const gm = gmOf(s);
  if (!o.hp) {
    say(
      gm,
      "down",
      now,
      alive(gm).find((q) => q.i !== o.i),
    ); // (one of the others)
  }
  if (!by || !s.players[by]) return;
  if (o.hp) {
    say(gm, "ff", now, o); // ("Watch your fire!")
    return;
  }
  if (how === "blast" || BOOMS.includes(w)) return; // (never counted)
  if (((s.hang.sv || {}).ph || "") === "rest") return turn(gm, by);
  const ks = [
    ...((gm.fk || {})[by] || []).filter((t) => now - t < FR.FF_MS),
    now,
  ];
  gm.fk = { ...(gm.fk || {}), [by]: ks };
  if (ks.length >= 2) turn(gm, by);
}
/* one of them caught fire from player `by`: more than one within 15 s turns them */
export function friendLit(s, o, by, now) {
  if (!by || !s.players[by]) return;
  const gm = gmOf(s),
    mine = Object.fromEntries(
      Object.entries((gm.fl || {})[by] || {}).filter(
        ([, t]) => now - t < FR.FF_MS,
      ),
    );
  mine[o.i] = now;
  gm.fl = { ...(gm.fl || {}), [by]: mine };
  if (Object.keys(mine).length >= 2) turn(gm, by);
}
function turn(gm, by) {
  gm.turn = { ...(gm.turn || {}), [by]: 1 };
}
