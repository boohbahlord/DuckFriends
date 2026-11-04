/* ---------- the rules of Trivia ----------
   A round: every duck writes one question at the same time (3:30 by default; the host can make it 2:00, 5:00 or no limit)
   → each question is played once, in a random order → the round's stats → the next round.
   A question is multiple choice (2 to 4 answers, A to D, every one filled in; the writer marks the right ones) or, with
   the Written Answer button, written. With "Multiple answers" on (the default) several answers can be right, never all of
   them; off, exactly one is. Unless "No wrong answers" is on, at least one has to be marked; with it on, a question
   with nothing marked counts for nobody's stats. A duck that sends no question, or one that isn't valid, gets an auto
   question instead (triviabank.js): multiple choice, "?" as its writer, and it never counts toward anyone as a writer
   (the ducks who answer it still get their right or wrong).
   Multiple choice (tvq): the answers are rows on the board. A duck walks onto a row and presses Enter (on a phone, taps
   it) to vote; Enter again takes it back. With more than one right answer the round says how many, and a duck votes for
   several rows; it counts as done once it has voted for as many rows as there are right answers. No time limit: the End
   round button shows up once the needed share (Turn ends when done) is done, and anyone can press it. The writer
   doesn't answer their own question. Right means exactly the right answers, no more and no fewer; it only counts for
   the stats.
   Written (tvw, then tvg): every answerer types in their own row at the same time, for 2:00. Then the writer walks onto
   a row and marks it Correct or Wrong, one row at a time, in any order; everyone watches the marks come in. No timer
   unless the host turns on Grading timer: 1:00 a row, and a row still ungraded when it runs out counts as right. A row
   left empty is marked Wrong by itself. There's no answer key.
   After each question a short reveal (tvr) shows what was right, then the next question.
   s.tv = { qs (this round's questions: { by, auto, text, kind 'mc' | 'wr', ans, ok }), qi, n (counts questions, for
   the screens), subs and drafts (the writing), votes { id: [row] }, ids (a written question's rows, one per answerer),
   text { id: answer }, sent { id: true }, grades { id: true | false }, used (auto questions dealt), log (every played
   question: { round, by, auto, kind, text, right, wrong, none }) } */
import { enter, say, playing, seatLate, toStats, shareOf } from "./rules.js";
import { TV_BANK } from "./triviabank.js";

export const isTv = (s) => s.options.mode === "trivia";
export const TV_PHASES = ["tvwrite", "tvq", "tvw", "tvg", "tvr"];
export const TV_BOARD = ["tvq", "tvw", "tvg", "tvr"]; // (the writing is a screen of its own)
export const TV_ANSWER = 120; // seconds to type a written answer
export const TV_GRADE = 60; // seconds a row, with the Grading timer on
export const TV_REVEAL = 5; // seconds of the reveal after each question
export const Q_MAX = 200; // the most characters a question can have
export const A_MAX = 100; // … an answer box
export const W_MAX = 140; // … a written answer
export const LETTERS = ["A", "B", "C", "D"];
/* the rows fill the board down to here; under them is a strip where a duck stands on no row */
export const TV_ROWS_END = 0.84;
/* what a computer types as a written answer */
export const TV_BOT_ANSWERS = [
  "No idea, honestly.",
  "42",
  "Pretty sure it's the second one.",
  "Photosynthesis?",
  "The French, probably.",
  "I learned this in class once.",
  "Isaac Newton",
  "Something about the brain.",
  "About a thousand.",
  "Yes",
];

const anyOf = (xs) => xs[Math.floor(Math.random() * xs.length)];
const shuffle = (xs) => {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
};
const line = (v, max) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/* ---------- the settings ---------- */
export const multiOn = (s) => +(s.options.tvMulti ?? 1) !== 0;
export const noWrongOn = (s) => !!+s.options.tvNoWrong;
export const mcOn = (s) => +(s.options.tvMc ?? 1) !== 0;
export const wrOn = (s) => +(s.options.tvWr ?? 1) !== 0 || !mcOn(s); // (never both off)
export const hideWriter = (s) => !!+s.options.tvHide;

/* a question as its writer sent it, checked: null when it isn't valid. With multiple choice off every question is
   written; with written answers off none is */
export function cleanQ(s, raw) {
  if (!raw || typeof raw !== "object") return null;
  const text = line(raw.text, Q_MAX);
  if (!text) return null;
  const wr = !mcOn(s) || (raw.kind === "wr" && wrOn(s));
  if (wr) return { text, kind: "wr" };
  const ans = Array.isArray(raw.ans) ? raw.ans.map((a) => line(a, A_MAX)) : [];
  if (ans.length < 2 || ans.length > 4 || ans.some((a) => !a)) return null;
  const ok = [...new Set((Array.isArray(raw.ok) ? raw.ok : []).map(Number))]
    .filter((i) => Number.isInteger(i) && i >= 0 && i < ans.length)
    .sort((a, b) => a - b);
  if (ok.length >= ans.length) return null; // (never all of them)
  if (!ok.length && !noWrongOn(s)) return null;
  if (ok.length > 1 && !multiOn(s)) return null;
  return { text, kind: "mc", ans, ok };
}
/* what a writer has typed so far, kept small, for when the time runs out */
function draftOf(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    text: line(raw.text, Q_MAX),
    kind: raw.kind === "wr" ? "wr" : "mc",
    ans: (Array.isArray(raw.ans) ? raw.ans : [])
      .slice(0, 4)
      .map((a) => line(a, A_MAX)),
    ok: (Array.isArray(raw.ok) ? raw.ok : [])
      .slice(0, 4)
      .map(Number)
      .filter(Number.isInteger),
  };
}
/* an auto question, one not dealt yet this game (once they've all been dealt, any of them) */
export function autoQ(s) {
  const T = s.tv,
    free = TV_BANK.map((_, i) => i).filter((i) => !T.used.includes(i)),
    k = anyOf(free.length ? free : TV_BANK.map((_, i) => i));
  if (!free.length) T.used = [];
  T.used.push(k);
  const [text, ans, ok = 0] = TV_BANK[k],
    tf = ans[0] === "True" && ans[1] === "False",
    order = tf ? ans.map((_, i) => i) : shuffle(ans.map((_, i) => i));
  return {
    text,
    kind: "mc",
    ans: order.map((i) => ans[i]),
    ok: [order.indexOf(ok)],
  };
}

/* ---------- who is who ---------- */
export const tvQ = (s) => (s.tv && s.tv.qs[s.tv.qi]) || null;
export const isWriter = (s, id) => {
  const q = tvQ(s);
  return !!q && !!q.by && q.by === id;
};
/* who answers this question: everyone playing but its writer */
export const answerers = (s) =>
  playing(s).filter((id) => s.players[id] && !isWriter(s, id));
/* how many rows a duck votes for to be done: as many as are right (at least one) */
export const needOf = (q) => Math.max(1, (q && q.ok && q.ok.length) || 0);
export const doneN = (s) => answerers(s).filter((id) => s.done[id]).length;
/* the End round button: once the needed share of the answerers is done */
export const endNeed = (s) =>
  Math.max(
    1,
    Math.min(
      answerers(s).length,
      Math.ceil(answerers(s).length * shareOf(s) - 1e-9),
    ),
  );
export const canEnd = (s) =>
  s.phase === "tvq" && answerers(s).length > 0 && doneN(s) >= endNeed(s);

/* ---------- the board's rows (y from 0 to TV_ROWS_END; under that, no row) ---------- */
export function rowCount(s) {
  const T = s.tv,
    q = tvQ(s);
  if (!T || !q) return 0;
  return q.kind === "mc" ? q.ans.length : T.ids.length;
}
export function tvRowAt(s, p) {
  const n = rowCount(s);
  if (!n || !p || p.x < 0 || p.y >= TV_ROWS_END) return -1;
  return Math.max(0, Math.min(n - 1, Math.floor((p.y / TV_ROWS_END) * n)));
}
/* everyone in a line along the strip under the rows */
function lineUp(s) {
  s.pos = {};
  const ids = s.seat.filter((id) => s.players[id]);
  ids.forEach((id, k) => {
    s.pos[id] = {
      x: (k + 1) / (ids.length + 1),
      y: (TV_ROWS_END + 1) / 2 + 0.02,
      j: 0,
    };
  });
}
const stripSpot = () => ({
  x: 0.08 + Math.random() * 0.84,
  y: (TV_ROWS_END + 1) / 2 + 0.02,
  j: 0,
});

/* ---------- the game ---------- */
export function tvStart(s, now) {
  s.tv = { qs: [], qi: 0, n: 0, used: [], log: [] };
  return tvRound(s, now);
}
/* a round starts: everyone writes */
export function tvRound(s, now) {
  seatLate(s);
  const T = s.tv || (s.tv = { qs: [], qi: 0, n: 0, used: [], log: [] });
  Object.assign(T, {
    qs: [],
    qi: 0,
    subs: {},
    drafts: {},
    votes: {},
    ids: [],
    text: {},
    sent: {},
    grades: {},
  });
  s.qi = 0;
  s.qs = [];
  s.lock = {};
  return enter(s, "tvwrite", now);
}
/* what a duck sends or types: its question (tvwrite) or its written answer (tvw) */
export function tvWrite(s, a, now, send) {
  const T = s.tv,
    me = s.players[a.id];
  if (!T || !me || me.late) return null;
  if (s.phase === "tvwrite") {
    if (s.done[a.id]) return null;
    if (!send) {
      T.drafts[a.id] = draftOf(a.q);
      return s;
    }
    T.subs[a.id] = cleanQ(s, a.q); // (null: an auto question in its place)
    delete T.drafts[a.id];
    s.done[a.id] = true;
    return s; // (rules.js moves the round on)
  }
  if (s.phase === "tvw") {
    if (!T.ids.includes(a.id) || T.sent[a.id]) return null;
    T.text[a.id] = line(a.text, W_MAX);
    if (!send) return s;
    T.sent[a.id] = true;
    s.done[a.id] = true;
    return T.ids.every((id) => T.sent[id] || !s.players[id])
      ? startGrading(s, now)
      : s;
  }
  return null;
}
/* the writing is over: each duck's question (or what it had typed, if it's valid; or else an auto one), in a random order */
export function tvDeal(s, now) {
  const T = s.tv,
    ids = shuffle(playing(s).filter((id) => s.players[id]));
  T.qs = ids.map((id) => {
    const q = (id in T.subs ? T.subs[id] : null) || cleanQ(s, T.drafts[id]);
    return q
      ? { by: id, ...q }
      : { by: null, auto: true, for: id, ...autoQ(s) };
  });
  T.drafts = {};
  T.subs = {};
  T.qi = 0;
  if (!T.qs.length) return tvRound(s, now);
  return startQ(s, now);
}
/* a question starts: everyone on the strip under the rows */
function startQ(s, now) {
  seatLate(s);
  const T = s.tv,
    q = tvQ(s);
  T.n++;
  s.qi = T.qi;
  T.votes = {};
  T.text = {};
  T.sent = {};
  T.grades = {};
  T.ids = q.kind === "wr" ? answerers(s) : [];
  s.lock = {};
  lineUp(s);
  const who =
    q.by && s.players[q.by] && !hideWriter(s) ? s.players[q.by].name : "";
  say(
    s,
    `Question ${T.qi + 1} of ${T.qs.length}${who ? `, by ${who}` : ""}: ${q.text}`,
  );
  return enter(s, q.kind === "mc" ? "tvq" : "tvw", now);
}
/* a vote: Enter (or a tap) over a row; again takes it back. With one right answer a new row takes the vote's place */
export function tvPick(s, a, now) {
  const T = s.tv,
    q = tvQ(s);
  if (!T || !q || s.phase !== "tvq" || !answerers(s).includes(a.id))
    return null;
  const i = +a.i;
  if (!Number.isInteger(i) || i < 0 || i >= q.ans.length) return null;
  const mine = T.votes[a.id] || [];
  let next;
  if (mine.includes(i)) next = mine.filter((x) => x !== i);
  else if (needOf(q) === 1) next = [i];
  else next = [...mine, i].sort((x, y) => x - y);
  if (next.length) T.votes[a.id] = next;
  else delete T.votes[a.id];
  s.done[a.id] = next.length >= needOf(q);
  return s;
}
/* End round: anyone, once enough are done */
export function tvEnd(s, a, now) {
  if (!canEnd(s) || !s.players[a.id]) return null;
  return reveal(s, now);
}
/* written: the answering is over; empty rows are marked Wrong by themselves, then the writer grades the rest */
function startGrading(s, now) {
  const T = s.tv;
  for (const id of T.ids) if (!T.text[id]) T.grades[id] = false;
  s.lock = {};
  enter(s, "tvg", now);
  return settle(s, now);
}
/* every row graded (or nobody left to grade it): the reveal; a row still ungraded then counts as right */
function settle(s, now) {
  const T = s.tv,
    q = tvQ(s),
    open = T.ids.filter((id) => T.grades[id] === undefined);
  if (open.length && q.by && s.players[q.by]) return s;
  for (const id of open) T.grades[id] = true;
  return reveal(s, now);
}
/* the writer's Correct or Wrong on a row (a.i), changed as often as they like until every row has one */
export function tvGrade(s, a, now) {
  const T = s.tv;
  if (!T || s.phase !== "tvg" || !isWriter(s, a.id)) return null;
  const id = T.ids[+a.i];
  if (id === undefined || !T.text[id]) return null;
  T.grades[id] = !!a.ok;
  if (s.ends) s.ends = now + TV_GRADE * 1000; // (the Grading timer: a fresh minute for the next row)
  return settle(s, now);
}
/* the Grading timer ran out: the row the writer stands on (or else the first one left) counts as right */
function gradeLate(s, now) {
  const T = s.tv,
    at = T.ids[tvRowAt(s, s.pos[tvQ(s).by])],
    open = T.ids.filter((id) => T.grades[id] === undefined),
    id = open.includes(at) ? at : open[0];
  if (id !== undefined) T.grades[id] = true;
  s.ends = now + TV_GRADE * 1000;
  return settle(s, now);
}
/* the question is over: who got it right goes in the log, and everyone sees the answer */
function reveal(s, now) {
  const T = s.tv,
    q = tvQ(s),
    right = [],
    wrong = [];
  if (q.kind === "mc") {
    const key = q.ok.join(",");
    for (const id of answerers(s))
      ((T.votes[id] || []).join(",") === key && q.ok.length
        ? right
        : wrong
      ).push(id);
  } else
    for (const id of T.ids)
      if (T.grades[id] !== undefined) (T.grades[id] ? right : wrong).push(id);
  const none = q.kind === "mc" && !q.ok.length; // (No wrong answers, nothing marked: it counts for nobody)
  T.log.push({
    round: s.round,
    by: q.by,
    auto: !!q.auto,
    kind: q.kind,
    text: q.text,
    right: none ? [] : right,
    wrong: none ? [] : wrong,
    none,
  });
  say(
    s,
    none
      ? "No wrong answers on this one."
      : `${right.length} of ${right.length + wrong.length} got it right.`,
  );
  return enter(s, "tvr", now);
}
/* after the reveal: the next question, or the round's stats */
function nextQ(s, now) {
  const T = s.tv;
  if (++T.qi < T.qs.length) return startQ(s, now);
  s.lock = {};
  return toStats(s, now);
}
/* what moves a question on: its timers, a writer gone, a skip (force) */
export function tvAdvance(s, now, force = false) {
  const T = s.tv;
  if (!T || !tvQ(s)) return s;
  const up = s.ends && now >= s.ends;
  switch (s.phase) {
    case "tvq":
      return force ? reveal(s, now) : s;
    case "tvw":
      if (force || up || T.ids.every((id) => T.sent[id] || !s.players[id]))
        return startGrading(s, now);
      return s;
    case "tvg":
      if (force) {
        for (const id of T.ids)
          if (T.grades[id] === undefined) T.grades[id] = true;
        return reveal(s, now);
      }
      if (up) return gradeLate(s, now);
      return settle(s, now); // (the writer left: the rows left count as right)
    case "tvr":
      return force || up ? nextQ(s, now) : s;
  }
  return s;
}
/* a vote to skip the round: the rest of its questions are dropped, on to the stats */
export function tvSkip(s, now) {
  if (s.phase === "tvwrite") return tvDeal(s, now);
  if (TV_BOARD.includes(s.phase)) {
    if (s.phase !== "tvr") reveal(s, now);
    s.tv.qi = s.tv.qs.length;
    s.lock = {};
    return toStats(s, now);
  }
  return s;
}
/* someone joins mid-game: they play at once (a row of their own in a written question that's still being answered) */
export function tvJoin(s, id) {
  if (!TV_BOARD.includes(s.phase)) return;
  s.pos[id] = stripSpot();
  if (s.phase === "tvw" && !s.tv.ids.includes(id) && !isWriter(s, id))
    s.tv.ids.push(id);
}
/* a Trivia phase's time limit (0: none) */
export function tvLimit(s) {
  if (s.phase === "tvwrite") return +(s.options.tvWrite ?? 210) || 0;
  if (s.phase === "tvw") return TV_ANSWER;
  if (s.phase === "tvg") return +s.options.tvGrade ? TV_GRADE : 0;
  if (s.phase === "tvr") return TV_REVEAL;
  return 0;
}

/* ---------- the stats ---------- */
/* each duck's right and wrong answers, and as a writer how many answers their questions got and how many were right;
   round = null for the whole game. An auto question counts for whoever answered it, never for a writer */
export function tvStats(s, round = null) {
  const per = {},
    log = ((s.tv && s.tv.log) || []).filter(
      (x) => round === null || x.round === round,
    );
  const P = (id) =>
    (per[id] = per[id] || { right: 0, wrong: 0, asked: 0, got: 0, of: 0 });
  for (const x of log) {
    for (const id of x.right) P(id).right++;
    for (const id of x.wrong) P(id).wrong++;
    if (x.by && !x.auto) {
      const w = P(x.by);
      w.asked++;
      if (!x.none) {
        w.got += x.right.length;
        w.of += x.right.length + x.wrong.length;
      }
    }
  }
  return { per, log };
}
