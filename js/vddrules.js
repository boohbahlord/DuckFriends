/* ---------- the rules of Valentine's Duck Date ----------
   A random duck is The Date; everyone else is a Suitor. The Date sits at the fancy dining table in the middle for the
   whole game. A turn: each Suitor still in takes the other seat in turn, for one date → before each date The Date writes
   the topic, shown over the table (the talking itself happens on the call or in the chat; nothing here judges it) → the
   date runs its timer (1 min by default after 10 s of grace; the host can turn it off), and The Date can end it early
   with Next duck → after the last date of the turn, every Suitor gets their own tile (like Who is the Quack?), and The
   Date walks onto one and turns that duck down; standing on no tile turns nobody down → the next turn, until one Suitor
   is left: the Valentine → the stats (Sweet Valentine and Most Jumps) → back to the lobby (VD_AFTER).
   Everyone walks around the whole time, but I want nothing to knock down the two ducks at the table (vdSafe). A Turned
   Down duck stays black and white for the rest of the game; that's only drawn from s.vd.out, never put on anyone's own
   duck.
   Joining and leaving: a duck that joins mid-game is a Suitor from the next turn; one that drops keeps its place. If The
   Date leaves, the game waits for them with the usual vote to go on; going on draws a new Date from the Suitors. */
import {
  enter,
  say,
  playing,
  seatLate,
  toStats,
  backToLobby,
  lostRound,
  VOTE_GRACE,
} from "./rules.js";

export const isVd = (s) => s.options.mode === "vdd";
export const VD_PHASES = ["vdprompt", "vddate", "vdpick", "vddown", "vdval"];
export const VD_GRACE = 10; // seconds of grace before the date's timer starts
export const VD_WRITE = 60; // seconds The Date has to write the topic (then what they typed, or one from VD_TOPICS)
export const VD_DOWN = 5; // seconds of the Turned Down moment
export const VD_VAL = 9; // seconds of the Valentine's moment, then the stats
/* what comes after the stats: "lobby" (the host starts a new game from the lobby) or "again" (a new Date at once). We
   guessed the lobby, so it's one word to change */
export const VD_AFTER = "lobby";
export const TOPIC_MAX = 120;
/* topics for The Date who didn't write one (and for computers) */
export const VD_TOPICS = [
  "Your dream first date.",
  "What would you cook for me?",
  "Your most embarrassing moment.",
  "Where should we go on vacation?",
  "What is your hidden talent?",
  "Describe your perfect pond.",
  "Who would play you in a movie?",
  "Your worst date ever.",
  "Cats or dogs, and why?",
  "Sing me a love song.",
  "Why should I pick you?",
  "Your best pickup line.",
  "Your biggest red flag.",
  "What's in your fridge right now?",
  "Where do you see us in five years?",
  "Your favorite snack.",
  "Tell me a joke.",
  "What scares you the most?",
  "Your perfect Sunday.",
  "What would your friends say about you?",
  "Bread or crackers?",
  "Your guilty pleasure song.",
  "The pet you'd love to have.",
  "What would you do with a million dollars?",
];

const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};
const anyOf = (xs) => xs[Math.floor(Math.random() * xs.length)];

/* ---------- who is who ---------- */
export const dateOf = (s) => (s.vd && s.vd.date) || null;
export const isDate = (s, id) => !!id && dateOf(s) === id;
/* turned down this game (an account keeps it through a rejoin) */
export function turnedDown(s, id) {
  const p = s.players[id];
  if (!s.vd || !p) return false;
  return (s.vd.out || []).some(
    (o) => o.id === id || (o.acct && o.acct === p.acct),
  );
}
/* the Suitors still in: here, playing and not turned down */
export const suitors = (s) =>
  playing(s).filter(
    (id) => s.players[id] && !isDate(s, id) && !turnedDown(s, id),
  );
/* at the table: The Date and this date's Suitor (in the Valentine's moment, the Valentine); The Date gets up only to walk
   to the tiles */
export function seated(s, id) {
  const V = s.vd;
  if (!isVd(s) || !V || !id) return false;
  if (["vdprompt", "vddate"].includes(s.phase))
    return id === V.date || id === V.cur;
  if (s.phase === "vdval") return id === V.date || id === V.val;
  return false;
}
/* nothing knocks down the two at the table: no weapon, no grenade, no kill */
export const vdSafe = seated;
/* which seat: 0 The Date's (left), 1 the Suitor's (right), -1 none */
export const seatOf = (s, id) => (!seated(s, id) ? -1 : isDate(s, id) ? 0 : 1);

/* ---------- where things stand on the board (x, y from 0 to 1) ---------- */
/* the table's feet, and the two seats beside it (each screen draws the two at the table right beside it; these are the
   host's numbers for them) */
export const VD_TABLE = { x: 0.5, y: 0.62 };
const SEAT = [
  { x: 0.4, y: VD_TABLE.y },
  { x: 0.6, y: VD_TABLE.y },
];
/* a spot on the floor in front of the table, for a Suitor getting up (or anyone without one) */
const floorSpot = () => ({
  x:
    Math.random() < 0.5
      ? 0.08 + Math.random() * 0.24
      : 0.68 + Math.random() * 0.24,
  y: 0.84 + Math.random() * 0.12,
  j: 0,
});
const nearTable = (p) =>
  !p ||
  p.x < 0 ||
  (Math.abs(p.x - VD_TABLE.x) < 0.17 && Math.abs(p.y - VD_TABLE.y) < 0.14);
/* the two at the table in their seats; whoever has no spot (or stands in the table) gets one on the floor */
function seatAll(s) {
  const V = s.vd;
  for (const id of s.seat) {
    const k = seatOf(s, id);
    if (k >= 0) {
      s.pos[id] = { ...SEAT[k], j: 0 };
      delete s.players[id].dead;
      if (s.up) delete s.up[id];
      if (s.down) delete s.down[id];
    } // (sat down on their feet, even if they were just knocked down)
    else if (nearTable(s.pos[id])) s.pos[id] = floorSpot();
  }
  if (V.cur && !s.players[V.cur]) V.cur = null;
}

/* the tiles of the pick: one for each Suitor in a grid as square as it gets (so they're not too narrow on a phone held
   upright), over the top of the board, with room around and under them where a duck stands on no tile. The last row is
   centered */
export const VD_FREE_Y = 0.95; // where The Date starts the pick: under every tile
export function vdTileRects(n) {
  const C = Math.max(1, Math.ceil(Math.sqrt(n))),
    R = Math.max(1, Math.ceil(n / C)),
    X0 = 0.04,
    X1 = 0.96,
    Y0 = 0.02,
    Y1 = 0.8,
    gx = 0.03,
    gy = 0.07,
    w = (X1 - X0 - gx * (C - 1)) / C,
    h = (Y1 - Y0 - gy * (R - 1)) / R;
  return Array.from({ length: n }, (_, k) => {
    const r = Math.floor(k / C),
      inRow = Math.min(C, n - r * C),
      c = k % C,
      x0 = X0 + ((C - inRow) * (w + gx)) / 2 + c * (w + gx),
      y0 = Y0 + r * (h + gy);
    return { x0, y0, x1: x0 + w, y1: y0 + h };
  });
}
/* the tile under a spot (its index in s.vd.ids), or -1 */
export function vdTileAt(s, p) {
  const ids = s.vd && s.vd.ids;
  if (!ids || !p || p.x < 0) return -1;
  return vdTileRects(ids.length).findIndex(
    (r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1,
  );
}
const tileSpot = (n, k) => {
  const r = vdTileRects(n)[k];
  return { x: (r.x0 + r.x1) / 2, y: r.y0 + (r.y1 - r.y0) * 0.72, j: 0 };
};

/* ---------- the game ---------- */
/* it starts: a random Date, and the first turn. s.vd = { date (and acct), turn, order (this turn's Suitors), k (whose
   date: an index in order), cur (the Suitor at the table), n (counts the dates and picks, for the screens), topic,
   draft (what The Date has typed so far), early (Next duck pressed), dates ([{ turn, id, topic, ms, early }]), ids (the
   pick's tiles), out (the Turned Down: [{ id, acct, turn }]), picks ([{ turn, id or null }]), val (the Valentine), fxi } */
export function vdStart(s, now) {
  seatLate(s);
  const ids = playing(s).filter((id) => s.players[id]),
    date = anyOf(ids),
    p = s.players[date];
  s.vd = {
    date,
    ...(p.acct ? { acct: p.acct } : {}),
    turn: 0,
    order: [],
    k: 0,
    cur: null,
    n: 0,
    topic: "",
    dates: [],
    ids: null,
    out: [],
    picks: [],
    val: null,
    fxi: 0,
  };
  s.pos = {};
  s.lock = {};
  say(s, `${p.name} is The Date! Everyone else is a Suitor.`);
  return startTurn(s, now);
}
/* a turn: every Suitor still in gets a date, in a new random order (one who joined late is in from here) */
function startTurn(s, now) {
  seatLate(s);
  const V = s.vd,
    live = suitors(s);
  if (live.length <= 1)
    return live.length ? crown(s, live[0], now) : vdOver(s, now);
  V.turn++;
  s.round = V.turn - 1;
  V.order = shuffle([...live]);
  V.k = 0;
  V.ids = null;
  say(s, `Turn ${V.turn}: a date with each of the ${live.length} Suitors.`);
  return startDate(s, now);
}
/* the next Suitor takes the seat (one who left is skipped, and keeps their place for the next turn), and The Date writes
   the topic */
function startDate(s, now) {
  const V = s.vd;
  while (
    V.k < V.order.length &&
    !(s.players[V.order[V.k]] && !turnedDown(s, V.order[V.k]))
  )
    V.k++;
  if (V.k >= V.order.length) return startPick(s, now);
  const was = V.cur;
  V.cur = V.order[V.k];
  V.n++;
  s.qi = V.n;
  V.topic = "";
  V.draft = "";
  V.early = false;
  s.lock = {};
  s.lordTime = 0;
  if (was && was !== V.cur && s.pos[was]) s.pos[was] = floorSpot(); // (up from the table, onto the floor)
  enter(s, "vdprompt", now);
  seatAll(s);
  return s;
}
/* The Date types the topic (send: it's done; else the draft kept for when time runs out) */
export function vdWrite(s, a, now, send) {
  const V = s.vd;
  if (!V || s.phase !== "vdprompt" || !isDate(s, a.id)) return null;
  const t = String(a.text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TOPIC_MAX);
  if (!send) {
    if (V.draft === t) return null;
    V.draft = t;
    return s;
  }
  return startTalk(s, now, t);
}
/* the date starts: the topic over the table (an empty one: what was typed, or one from the list) */
function startTalk(s, now, text) {
  const V = s.vd;
  V.topic = text || V.draft || anyOf(VD_TOPICS);
  delete V.draft;
  const T = +s.options.vdTime || 0;
  s.lordTime = T ? VD_GRACE + T : 0;
  const p = s.players[V.cur];
  say(
    s,
    `Date ${V.k + 1} of ${V.order.length}: ${p ? p.name : "a Suitor"}. The topic: ${V.topic}`,
  );
  return enter(s, "vddate", now);
}
function endDate(s, now) {
  const V = s.vd,
    p = s.players[V.cur];
  if (V.cur)
    V.dates.push({
      turn: V.turn,
      id: V.cur,
      ...(p && p.acct ? { acct: p.acct } : {}),
      topic: V.topic,
      ms: Math.max(0, now - s.at),
      early: !!V.early,
    });
  V.k++;
  return startDate(s, now);
}
/* every Suitor still in on their own tile; The Date under them all, the rest along the bottom */
function startPick(s, now) {
  const V = s.vd;
  if (V.cur && s.pos[V.cur]) s.pos[V.cur] = floorSpot();
  V.cur = null;
  const ids = suitors(s);
  if (ids.length <= 1)
    return ids.length ? crown(s, ids[0], now) : vdOver(s, now);
  V.ids = ids;
  V.n++;
  s.qi = V.n;
  s.lock = {};
  s.lordTime = 0;
  ids.forEach((id, k) => {
    s.pos[id] = tileSpot(ids.length, k);
  });
  s.pos[V.date] = { x: 0.5, y: VD_FREE_Y, j: 0 };
  const rest = s.seat.filter((id) => !ids.includes(id) && id !== V.date);
  rest.forEach((id, k) => {
    const left = k % 2 === 0,
      i = Math.floor(k / 2);
    s.pos[id] = {
      x: left ? 0.36 - i * 0.07 : 0.64 + i * 0.07,
      y: VD_FREE_Y,
      j: 0,
    };
  });
  say(
    s,
    "The Date walks onto a Suitor's tile to turn them down, or onto no tile to turn nobody down.",
  );
  return enter(s, "vdpick", now);
}
/* The Date's pick: the tile they stand on (none: nobody this turn) */
function pickOut(s, now) {
  const V = s.vd,
    k = vdTileAt(s, s.pos[V.date]),
    id = k >= 0 ? V.ids[k] : null,
    p = id && s.players[id];
  V.picks = [...(V.picks || []), { turn: V.turn, id }];
  if (id) {
    V.out = [
      ...V.out,
      { id, ...(p && p.acct ? { acct: p.acct } : {}), turn: V.turn },
    ];
    lostRound(s, [id], "vdd");
    say(s, `${p ? p.name : "A Suitor"} is Turned Down.`);
  } else say(s, "The Date turned nobody down this turn.");
  s.lordTime = 0;
  return enter(s, "vddown", now);
}
/* one Suitor left: the Valentine, at the table with The Date */
function crown(s, id, now) {
  const V = s.vd,
    p = s.players[id];
  V.val = id;
  V.cur = null;
  V.ids = null;
  V.fxi = 0;
  V.n++;
  s.qi = V.n;
  s.lock = {};
  s.lordTime = 0;
  say(s, `${p ? p.name : "A Suitor"} is The Date's Valentine!`);
  enter(s, "vdval", now);
  seatAll(s);
  return s;
}
/* the game is over: its stats (with the stats screen off, straight to what comes after) */
function vdOver(s, now) {
  s.lock = {};
  return toStats(s, now);
}
/* after the stats */
export function vdAfter(s, now) {
  if (VD_AFTER === "lobby")
    return backToLobby(s, "The Date found their Valentine. Back to the lobby!");
  s.history = [];
  s.jumps = {};
  return vdStart(s, now);
}
/* The Date left and the room went on without them: a new Date from the Suitors (this turn starts again) */
function newDate(s, now) {
  const V = s.vd,
    pool = suitors(s),
    date = anyOf(pool.length ? pool : playing(s).filter((id) => s.players[id]));
  if (!date) return s;
  const p = s.players[date];
  V.date = date;
  if (p.acct) V.acct = p.acct;
  else delete V.acct;
  V.cur = null;
  V.turn = Math.max(0, V.turn - 1);
  say(s, `${p.name} is the new Date!`);
  return startTurn(s, now);
}

/* what moves the game on: the timers, someone gone, a skip (force) */
export function vdAdvance(s, now, force = false) {
  const V = s.vd;
  if (!V) return s;
  if (!s.players[V.date] && s.phase !== "vdval") return newDate(s, now);
  const up = force || (s.ends && now >= s.ends);
  switch (s.phase) {
    case "vdprompt":
      if (!s.players[V.cur]) {
        V.k++;
        return startDate(s, now);
      } // (the Suitor left before their date)
      return up ? startTalk(s, now, "") : s;
    case "vddate":
      if (!s.players[V.cur]) {
        say(s, "The Suitor left, so the date is over.");
        return endDate(s, now);
      }
      return up ? endDate(s, now) : s;
    case "vdpick":
      return force ? pickOut(s, now) : s; // (a skip: where The Date stands counts)
    case "vddown":
      return up ? startTurn(s, now) : s;
    case "vdval":
      return up ? vdOver(s, now) : s;
  }
  return s;
}
/* The Date's button: Next duck (a date) or Turn down (the pick); not in the first seconds, so a stray Enter can't */
export function vdEnd(s, a, now) {
  if (!isDate(s, a.id) || now < s.at + VOTE_GRACE * 1000) return null;
  if (s.phase === "vddate") {
    s.vd.early = true;
    return endDate(s, now);
  }
  if (s.phase === "vdpick") return pickOut(s, now);
  return null;
}
/* a vote to skip the round: the dates of this turn end and the pick starts (from the pick: nobody is turned down) */
export function vdSkip(s, now) {
  if (["vdprompt", "vddate"].includes(s.phase)) return startPick(s, now);
  if (s.phase === "vdpick") {
    s.vd.picks = [...(s.vd.picks || []), { turn: s.vd.turn, id: null }];
    return startTurn(s, now);
  }
  return vdAdvance(s, now, true);
}
/* someone joins mid-game: a Suitor from the next turn (they walk around until then) */
export function vdJoin(s, id) {
  if (!VD_PHASES.includes(s.phase)) return;
  s.players[id].late = true;
  s.pos[id] = floorSpot();
}
/* the Valentine's moment, on the host's heartbeat: hearts over the two at the table, seen by everyone */
const VAL_FX = [300, 2600, 4900, 7200];
export function vdTick(s, now) {
  const V = s.vd;
  if (!isVd(s) || s.phase !== "vdval" || !V || !V.val) return false;
  const due = VAL_FX.filter((t) => t <= now - s.at).length,
    who = [V.date, V.val].filter((id) => s.players[id]);
  let ch = false;
  while ((V.fxi || 0) < due) {
    V.fxi = (V.fxi || 0) + 1;
    s.fxN = (s.fxN || 0) + 1;
    s.fx = [
      ...(s.fx || []).slice(-19),
      { n: s.fxN, kind: "love", who, by: V.date, t: now },
    ];
    ch = true;
  }
  return ch;
}

/* ---------- the stats ---------- */
/* each player's dates (how many, their time, how many The Date ended early), the turn they were turned down in, and who
   was The Date and the Valentine; an account's dates count for the same duck after a rejoin */
export function vdStats(s) {
  const V = s.vd || { dates: [], out: [] },
    per = {};
  const idOf = (x) =>
    s.players[x.id]
      ? x.id
      : (x.acct && s.seat.find((id) => s.players[id].acct === x.acct)) || x.id;
  const P = (id) =>
    (per[id] = per[id] || { dates: 0, ms: 0, early: 0, out: 0 });
  for (const d of V.dates || []) {
    const me = P(idOf(d));
    me.dates++;
    me.ms += d.ms || 0;
    if (d.early) me.early++;
  }
  for (const o of V.out || []) P(idOf(o)).out = o.turn;
  return { per, date: V.date, val: V.val, dates: V.dates || [] };
}
