/* ---------- the rules of Duncelation ----------
   A rotation: everyone writes one controversial take in secret → the takes are handed out (Takes: Random, so you might
   get your own, by default; Write your own; Never your own) and a new random turn order is drawn → a turn: the defender
   stands in the circle in the middle and defends their take out loud. After a 15 s grace period the Take timer runs (2 min
   by default); with it off, the turn ends like any other, once enough have voted and the catch-up timer runs out.
   Everyone else walks to Dunce (left) or Not a Dunce (right) and votes, and can change it any time; where a duck stands
   counts if it never voted → more Dunce votes than Not a Dunce: a dunce (a tie is not) → the next defender, and after the
   last one a new rotation.
   A dunce: lightning strikes it three times as the dunce hat lands on it, then it stands on the LOSER podium playing the
   trombone and gets struck once more → the stats → a new rotation, until the room goes back to the lobby.
   A dunce wears the dunce hat and stays black and white for the rest of the game. That's only drawn from s.dn.dunces,
   never put on anyone's own duck, so nothing can stay behind after the game (leaving, lag or a reload included). Each
   dunce is numbered (s.dn.dk), so each player's device counts its own once toward unlocking the dunce hat (unlocks.js).
   The writer of a take is never shown. */
import {
  enter,
  say,
  playing,
  seatLate,
  waitFor,
  discussOn,
  colAt,
  shareOf,
  lostRound,
} from "./rules.js";

export const isDn = (s) => s.options.mode === "dunce";
export const DN_SIDES = ["Dunce", "Not a Dunce"];
export const DN_GRACE = 15; // seconds before the Take timer starts (and before anyone can vote)
export const DN_CEREMONY = 12; // seconds of the dunce's moment, then the stats
export const TAKE_MAX = 200;
/* the dunce's moment, in ms from its start: the hat lands with the first of three strikes, the podium rises, then the
   trombone over and over and one more strike */
export const DN_HAT = 800,
  DN_BW = 2800,
  DN_PODIUM = 3600;
const DN_FX = [
  [800, "bolt"],
  [1800, "bolt"],
  [2800, "bolt"],
  [4600, "horn"],
  [5900, "horn"],
  [7200, "horn"],
  [8000, "bolt"],
  [8500, "horn"],
  [9800, "horn"],
  [11000, "horn"],
];
/* takes for whoever didn't write one */
export const DUNCE_TAKES = [
  "Cereal is a soup.",
  "A hot dog is a sandwich.",
  "Pineapple belongs on pizza.",
  "Water is not wet.",
  "Cold pizza beats hot pizza.",
  "The book is never better than the movie.",
  "Socks with sandals look good.",
  "Breakfast is the most overrated meal.",
  "Ketchup goes on eggs.",
  "Cats are better than dogs.",
  "Mornings are the best part of the day.",
  "Homework should be banned.",
  "Cake is better than pie.",
  "Being early is worse than being late.",
  "Spoilers make a story better.",
  "Naps are a waste of time.",
  "Texting is better than calling.",
  "Dinosaurs were cooler than sharks.",
  "Summer is the worst season.",
  "Clowns are not scary.",
  "Mint chocolate chip tastes like toothpaste.",
  "Board games beat video games.",
  "Ducks are smarter than people.",
  "You should always clap when the plane lands.",
];

const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};
const anyOf = (xs) => xs[Math.floor(Math.random() * xs.length)];

/* the turn now: s.dn.cur = { def, votes (their side: 0 Dunce, 1 Not a Dunce), first (their first vote), w (the verdict:
   0 a dunce, 1 not), end ([Dunce, Not a Dunce]) } */
export const defenderOf = (s) => (s.dn && s.dn.cur && s.dn.cur.def) || null;
export const isDefender = (s, id) => !!id && defenderOf(s) === id;
/* who votes: everyone playing but the defender */
export const voters = (s) =>
  playing(s).filter((id) => s.players[id] && !isDefender(s, id));
export function dnTally(s) {
  const C = s.dn && s.dn.cur,
    n = [0, 0];
  if (!C) return n;
  for (const id of voters(s)) {
    const v = C.votes[id];
    if (v === 0 || v === 1) n[v]++;
  }
  return n;
}
/* voted a dunce this game (an account keeps it through a rejoin) */
export function wearsDunce(s, id) {
  const p = s.players[id];
  if (!s.dn || !p) return false;
  return (s.dn.dunces || []).some(
    (d) => d.id === id || (d.acct && d.acct === p.acct),
  );
}
/* the dunce on the podium can't walk off it */
export const dnStill = (s, id) =>
  isDn(s) && s.phase === "dunced" && isDefender(s, id);

/* the game starts */
export function dnStart(s) {
  s.dn = { cur: null, dunces: [], dk: [], dkN: 0, fxi: 0 };
}

/* the writing is over: everyone gets a take, in a new random order */
export function dealTakes(s, now) {
  if (!s.dn) dnStart(s);
  for (const id of s.seat) {
    const d = (s.drafts || {})[id];
    if (!s.done[id] && d && d.text)
      (s.subs = s.subs || []).push({ by: id, text: d.text });
  } // (whatever was typed when time ran out)
  delete s.drafts;
  seatLate(s);
  const order = shuffle(playing(s).filter((id) => s.players[id])),
    mine = {};
  for (const q of s.subs || [])
    if (s.players[q.by] && String(q.text || "").trim())
      mine[q.by] = { by: q.by, text: String(q.text).trim().slice(0, TAKE_MAX) };
  delete s.subs;
  const how = s.options.dunceTakes,
    ok =
      how === "own"
        ? (id, t) => t.by === id
        : how === "notOwn"
          ? (id, t) => t.by !== id
          : () => true;
  /* the takes shuffled, each defender getting the first one that suits them; a few tries for the fewest left without one */
  let best = null;
  for (let k = 0; k < 30 && !(best && !best.miss); k++) {
    const pool = shuffle(Object.values(mine)),
      out = order.map((id) => {
        const i = pool.findIndex((t) => ok(id, t));
        return i < 0 ? null : pool.splice(i, 1)[0];
      });
    const miss = out.filter((x) => !x).length;
    if (!best || miss < best.miss) best = { out, miss };
  }
  const used = new Set(Object.values(mine).map((t) => t.text));
  s.qs = order.map((id, i) => {
    const t = best.out[i] || {
      by: null,
      text:
        anyOf(DUNCE_TAKES.filter((x) => !used.has(x))) || anyOf(DUNCE_TAKES),
    };
    used.add(t.text);
    return { def: id, by: t.by, text: t.text };
  });
  s.qi = 0;
  return startTake(s, now);
}
/* a turn starts: the defender in the circle, everyone else in two rows below it (clear of the cloud), still in the strip */
export function startTake(s, now) {
  seatLate(s);
  s.ends = 0;
  s.catchEnds = 0;
  if (s.seat.length < 3) {
    s.dn.cur = null;
    s.done = {};
    return waitFor(s, now, "take");
  } // (a defender and two voters: the turn waits for players)
  while (s.qi < s.qs.length && !s.players[s.qs[s.qi].def]) s.qi++; // (a defender who left: their turn is skipped)
  const q = s.qs[s.qi];
  if (!q) return endRotation(s, now);
  s.dn.cur = { def: q.def, votes: {}, first: {}, w: null };
  s.pos = {};
  s.lock = {};
  s.pos[q.def] = { x: 0.5, y: 0.5 };
  const rest = s.seat.filter((id) => id !== q.def),
    half = Math.ceil(rest.length / 2);
  rest.forEach((id, k) => {
    const top = k < half,
      i = top ? k : k - half,
      n = top ? half : rest.length - half;
    s.pos[id] = { x: 0.44 + (0.12 * (i + 1)) / (n + 1), y: top ? 0.8 : 0.96 };
  });
  const T = +s.options.dunceTime || 0;
  s.lordTime = T ? DN_GRACE + T : 0;
  const t = q.text.trim();
  say(
    s,
    `Dunce or Not? ${s.players[q.def].name} defends this take: ${t}${/[.!?…]$/.test(t) ? "" : "."}`,
  );
  return enter(s, "answer", now);
}
function endRotation(s, now) {
  s.dn.cur = null;
  s.round++;
  s.subs = [];
  s.qs = [];
  s.qi = 0;
  return enter(s, "submit", now);
}
export function nextTake(s, now) {
  s.dn.cur = null;
  if (++s.qi < s.qs.length) return startTake(s, now);
  return endRotation(s, now);
}
/* a voter votes for the side they stand on (again, to change it) */
export function dnVote(s, a, now) {
  const C = s.dn && s.dn.cur,
    p = s.pos[a.id];
  if (!C || C.w != null || !p || !voters(s).includes(a.id)) return null;
  const c = colAt(s, p.x);
  if (c < 0) return null;
  const was = C.votes[a.id];
  if (was === c) return null;
  if (was === undefined) C.first = { ...C.first, [a.id]: c };
  C.votes = { ...C.votes, [a.id]: c };
  s.done[a.id] = true;
  return dnCheck(s, now);
}
/* the End round button: every player may press it (again, to take it back). I want it to end the take at once only when
   the defender pressed it too and the presses reach the lobby's share of everyone playing, like any vote */
export const endVotes = (s) => {
  const e = (s.dn && s.dn.cur && s.dn.cur.endv) || {};
  return playing(s).filter((id) => e[id]);
};
export const endNeed = (s) =>
  Math.max(1, Math.ceil(playing(s).length * shareOf(s) - 1e-9));
const endPasses = (s) => {
  const e = endVotes(s);
  return e.includes(defenderOf(s)) && e.length >= endNeed(s);
};
export function dnEndVote(s, a, now) {
  const C = s.dn && s.dn.cur;
  if (!C || C.w != null || s.phase !== "answer" || !playing(s).includes(a.id))
    return null;
  const e = { ...(C.endv || {}) };
  if (e[a.id]) delete e[a.id];
  else e[a.id] = true;
  C.endv = e;
  return dnCheck(s, now);
}
/* does the turn end? With the Take timer the defender gets all of it; without it, everyone voting ends it, and the
   needed share starts the catch-up timer. A defender who leaves drops the take. force: skipped, the votes so far decide */
export function dnCheck(s, now, force = false) {
  const C = s.dn && s.dn.cur;
  if (!C || C.w != null || s.waiting) return s;
  if (!s.players[C.def]) {
    say(s, "The defender left, so the take is dropped.");
    return nextTake(s, now);
  }
  const v = voters(s);
  if (!v.length) {
    say(s, "Nobody is left to vote, so the take is dropped.");
    return nextTake(s, now);
  }
  if (force || endPasses(s)) return dnVerdict(s, now); // (End round: the defender and the share pressed it)
  if (s.lordTime) return s.ends && now >= s.ends ? dnVerdict(s, now) : s;
  if (now < s.at + DN_GRACE * 1000) return s;
  const d = v.filter((id) => C.votes[id] !== undefined).length,
    need = Math.max(1, Math.ceil(v.length * shareOf(s) - 1e-9)),
    len = +s.options.catchUp || 0;
  if (d >= v.length || (d >= need && !len)) return dnVerdict(s, now);
  if (d >= need && !s.catchEnds) s.catchEnds = now + len * 1000;
  if (d < need && s.catchEnds && s.options.unvoteStops) s.catchEnds = 0;
  return s.catchEnds && now >= s.catchEnds ? dnVerdict(s, now) : s;
}
/* the verdict: the votes (where a duck stands, if it never voted) → a dunce, or not; the take joins the game's history */
function dnVerdict(s, now) {
  const C = s.dn.cur,
    q = s.qs[s.qi],
    votes = {};
  for (const id of voters(s)) {
    let c = C.votes[id];
    if (c === undefined && s.pos[id] && s.pos[id].x >= 0) {
      const k = colAt(s, s.pos[id].x);
      if (k >= 0) c = k;
    }
    if (c !== undefined) votes[id] = c;
  }
  const vs = Object.values(votes),
    d = vs.filter((c) => c === 0).length,
    n = vs.filter((c) => c === 1).length,
    dunce = d > n;
  C.w = dunce ? 0 : 1;
  C.end = [d, n];
  s.ends = 0;
  s.catchEnds = 0;
  s.history.push({
    round: s.round,
    set: s.dn.dkN || 0,
    by: q.by,
    text: q.text,
    dn: { def: C.def, votes, first: { ...C.first }, end: [d, n], dunce },
  });
  const p = s.players[C.def];
  s.lock = { ...votes, [C.def]: -1 };
  for (const id of s.seat)
    if (s.lock[id] === undefined && s.pos[id])
      s.lock[id] = colAt(s, s.pos[id].x);
  if (!dunce) {
    say(s, `${p.name} is not a dunce${d + n ? ` (${n}–${d})` : ""}.`);
    return discussOn(s) ? enter(s, "discuss", now) : nextTake(s, now);
  }
  if (!wearsDunce(s, C.def))
    s.dn.dunces = [
      ...(s.dn.dunces || []),
      { id: C.def, ...(p.acct ? { acct: p.acct } : {}) },
    ];
  s.dn.dkN = (s.dn.dkN || 0) + 1;
  s.dn.dk = [...(s.dn.dk || []).slice(-9), { n: s.dn.dkN, id: C.def }];
  lostRound(s, [C.def], "dunce");
  s.dn.fxi = 0;
  say(s, `${p.name} is a DUNCE! ${d}–${n}.`);
  s.lock = {};
  s.pos[C.def] = { x: 0.5, y: 0.5 }; // (onto the podium in the middle; everyone else walks about)
  return enter(s, "dunced", now);
}
/* the dunce's moment, on the host's heartbeat: the strikes and the trombone, each once, seen by everyone */
export function dnTick(s, now) {
  const id = defenderOf(s);
  if (!isDn(s) || s.phase !== "dunced" || !id || !s.players[id]) return false;
  const due = DN_FX.filter((f) => f[0] <= now - s.at).length;
  let ch = false;
  while ((s.dn.fxi || 0) < due) {
    const k = DN_FX[s.dn.fxi++][1];
    s.fxN = (s.fxN || 0) + 1;
    s.fx = [
      ...(s.fx || []).slice(-19),
      {
        n: s.fxN,
        t: now,
        ...(k === "bolt"
          ? { kind: "lightning", who: [id], by: id }
          : { kind: "use", what: "trombone", by: id, who: [id], face: 1 }),
      },
    ];
    ch = true;
  }
  return ch;
}

/* the numbers behind the stats: each player's takes defended, the votes they got, the votes they turned from Dunce to
   Not a Dunce (Comeback), the times they were voted a dunce and the votes they cast; set = the takes since the last
   dunce (null: the whole game) */
export function dnStats(s, set = null) {
  const per = {},
    takes = [];
  const P = (id) =>
    (per[id] = per[id] || {
      turns: 0,
      not: 0,
      dunce: 0,
      comeback: 0,
      dunced: 0,
      votes: 0,
    });
  for (const h of s.history.filter(
    (h) => h.dn && (set === null || h.set === set),
  )) {
    const c = h.dn,
      [d, n] = c.end || [0, 0],
      turned = Object.keys(c.votes || {}).filter(
        (id) => (c.first || {})[id] === 0 && c.votes[id] === 1,
      ).length;
    takes.push({ text: h.text, def: c.def, d, n, dunce: c.dunce, turned });
    const me = P(c.def);
    me.turns++;
    me.not += n;
    me.dunce += d;
    me.comeback += turned;
    if (c.dunce) me.dunced++;
    for (const id of Object.keys(c.votes || {})) P(id).votes++;
  }
  return { per, takes };
}
