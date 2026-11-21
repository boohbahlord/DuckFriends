/* ---------- the rules of Bicker Brackets (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   tournament (topics, seeds, the bracket, the matches, the podium and the stats). It imports back from rules.js as
   duncerules.js does; rules.js calls it from the phase table and the actions. */
import {
  enter,
  say,
  playing,
  seatLate,
  discussOn,
  colAt,
  lostRound,
  advance,
  oneLine,
} from "./rules.js";
import { shuffle, anyOf } from "./random.js";

/* ---------- Bicker Brackets ----------
   A round is one tournament: everyone writes a topic (24 letters at most) and votes for one, or the room gets a random
   topic → the seeds: each player has a few to write and types one a turn, everyone seeing everyone's words as they type
   → the seeds are drawn into a bracket at random (byes fill it up to 4, 8, 16 …) and the bracket shows → match by match,
   each duck walks onto the seed it backs and votes, then the room talks it over (the winner goes on the cloud; a tie is
   a coin flip) → after each bracket round, the bracket again → the final (both seeds silver), the champion (gold), the
   bracket one last time → the podium for ten seconds → the stats, until the room moves on to the next tournament. */
export const PODIUM = 10; // seconds
export const BB_TOPICS = [
  "Best snack",
  "Worst habit",
  "Greatest movie villain",
  "Most overrated thing",
  "Best superpower",
  "Worst chore",
  "Best pizza topping",
  "Most annoying sound",
];
export const TOPIC_MAX = 24,
  SEED_MAX = 32;

export function startTourney(s, now) {
  seatLate(s);
  s.bb = {
    topic: "",
    topicBy: null,
    topics: [],
    tvotes: {},
    seeds: [],
    per: {},
    turn: 0,
    turns: 0,
    rounds: [],
    r: 0,
    m: -1,
    champ: null,
  };
  s.subs = [];
  s.drafts = {};
  s.qi = 0;
  s.pos = {};
  s.lock = {};
  if (s.options.bbTopic === "random") {
    s.bb.topic = anyOf(BB_TOPICS);
    say(s, `The topic: ${s.bb.topic}.`);
    return startSeeds(s, now);
  }
  return enter(s, "topic", now);
}
/* the topics are in: none → a random one; one → that one; more → a vote */
export function endTopics(s, now) {
  for (const id of s.seat) {
    const d = (s.drafts || {})[id];
    if (!s.done[id] && d && d.text.trim())
      s.subs.push({ by: id, text: d.text.trim() });
  }
  const tops = (s.subs || []).filter((t) => s.players[t.by]);
  s.subs = [];
  s.drafts = {};
  if (tops.length > 1) {
    s.bb.topics = shuffle(tops);
    s.bb.tvotes = {};
    return enter(s, "tvote", now);
  }
  if (tops.length) {
    s.bb.topic = tops[0].text;
    s.bb.topicBy = tops[0].by;
    say(s, `The topic: ${s.bb.topic}.`);
  } else {
    s.bb.topic = anyOf(BB_TOPICS);
    say(s, `No topics written, so a random one: ${s.bb.topic}.`);
  }
  return startSeeds(s, now);
}
export function pickTopic(s, now) {
  const b = s.bb,
    n = b.topics.map(() => 0);
  for (const [id, i] of Object.entries(b.tvotes || {}))
    if (s.players[id] && n[i] !== undefined) n[i]++;
  const top = Math.max(...n),
    best = n.map((k, i) => (k === top ? i : -1)).filter((i) => i >= 0),
    t = b.topics[anyOf(best)];
  b.topic = t.text;
  b.topicBy = t.by;
  b.topicVotes = n;
  say(
    s,
    best.length > 1
      ? `A tie! A coin flip picked the topic: ${t.text}.`
      : `The topic: ${t.text}.`,
  );
  return startSeeds(s, now);
}
/* how many seeds each player writes: a total shared out (the extra ones to random players), or so many each */
function startSeeds(s, now) {
  const ids = playing(s),
    plan = String(s.options.bbSeeds || "t8"),
    k = Math.max(1, Math.min(64, +plan.slice(1) || 8)),
    per = {};
  if (plan[0] === "p")
    ids.forEach((id) => {
      per[id] = Math.min(k, 8);
    });
  else
    shuffle([...ids]).forEach((id, i) => {
      per[id] = Math.floor(k / ids.length) + (i < k % ids.length ? 1 : 0);
    });
  s.bb.per = per;
  s.bb.turns = Math.max(0, ...Object.values(per));
  s.bb.turn = 0;
  return s.bb.turns ? seedTurn(s, now) : buildBracket(s, now);
}
function seedTurn(s, now) {
  s.qi++;
  s.subs = [];
  s.drafts = {};
  enter(s, "seeds", now);
  for (const id of s.seat)
    if (!((s.bb.per[id] || 0) > s.bb.turn)) s.done[id] = true; // nothing left to write this turn
  return s;
}
/* a typing turn ends: what each player sent (or had typed) becomes a seed */
export function endSeedTurn(s, now) {
  const b = s.bb;
  for (const id of s.seat) {
    if ((b.per[id] || 0) <= b.turn) continue;
    const sub = (s.subs || []).find((x) => x.by === id),
      d = (s.drafts || {})[id];
    const text = (sub ? sub.text : !s.done[id] && d ? d.text : "").trim();
    if (text) b.seeds.push({ by: id, text });
  }
  s.subs = [];
  s.drafts = {};
  return ++b.turn < b.turns ? seedTurn(s, now) : buildBracket(s, now);
}
/* the draw: the seeds in a random order, two to a match; byes (a seed with no one to face goes straight through) are
   spread out so the bracket fills to a power of two */
function buildBracket(s, now) {
  const b = s.bb,
    n = b.seeds.length;
  if (n < 2) {
    if (!playing(s).length) return s; // nobody left to play (a new tournament would loop forever)
    say(
      s,
      `${n ? "Only one contender" : "No contenders"}: not enough for a bracket. A new tournament!`,
    );
    s.round++;
    return startTourney(s, now);
  }
  const order = shuffle(b.seeds.map((_, i) => i)),
    M = 2 ** Math.ceil(Math.log2(n)) / 2,
    byes = 2 * M - n;
  b.rounds = [];
  for (let k = M; k >= 1; k /= 2)
    b.rounds.push(Array.from({ length: k }, () => ({ a: null, b: null })));
  let q = 0;
  b.rounds[0].forEach((m, i) => {
    m.a = order[q++];
    if (Math.floor(((i + 1) * byes) / M) > Math.floor((i * byes) / M)) {
      m.b = -1;
      m.w = m.a;
    } else m.b = order[q++];
  });
  b.rounds[0].forEach((m, i) => {
    if (m.w != null) feed(b, 0, i);
  });
  b.r = 0;
  b.m = -1;
  b.champ = null;
  return enterBracket(s, now);
}
const feed = (b, r, i) => {
  const nx = b.rounds[r + 1];
  if (nx) nx[i >> 1][i % 2 ? "b" : "a"] = b.rounds[r][i].w;
}; // the winner moves on
function enterBracket(s, now) {
  // ducks stand on the bracket (x, y across it), lined up by the round that's up next
  seatLate(s);
  const b = s.bb,
    col = b.champ != null ? b.rounds.length : b.r,
    x = Math.min(0.97, (col + 0.45) / (b.rounds.length + 1));
  s.seat.forEach((id, k) => {
    s.pos[id] = { x, y: (k + 1) / (s.seat.length + 1) };
  });
  s.lock = {};
  return enter(s, "bracket", now);
}
/* the next match of this bracket round; with none left, the bracket shows (or the champion is crowned) */
export function nextMatch(s, now) {
  const b = s.bb,
    round = b.rounds[b.r],
    i = round.findIndex((m) => m.w == null);
  if (i < 0) {
    b.m = -1;
    if (b.r === b.rounds.length - 1) {
      b.champ = round[0].w;
      say(s, `"${b.seeds[b.champ].text}" is the champion!`);
    } else b.r++;
    return b.champ == null && !+s.options.bbReview
      ? nextMatch(s, now)
      : enterBracket(s, now); // (the bracket between rounds is the Review option; the champion's always shows)
  }
  b.m = i;
  s.qi++;
  s.lordTime = s.options.answerOff ? 0 : +s.options.bbTimer || 0;
  delete b.tie;
  s.pos = {};
  s.lock = {};
  seatLate(s);
  s.seat.forEach((id, k) => {
    s.pos[id] = { x: 0.5, y: (k + 1) / (s.seat.length + 1) };
  }); // everyone starts between the two seeds
  return enter(s, "answer", now);
}
/* the votes are in: the side with more ducks wins and moves on; a tie goes to the room (vote again or a coin toss).
   Returns false on a tie. */
export function endMatch(s, now) {
  const b = s.bb,
    who = {};
  for (const id of playing(s)) {
    const p = s.pos[id],
      c = p && p.x >= 0 ? colAt(s, p.x) : -1;
    if (c >= 0) who[id] = c;
  }
  const va = Object.values(who).filter((c) => c === 0).length,
    vb = Object.values(who).length - va;
  s.lock = { ...who }; // each duck stays on the side it chose while the room talks it over (or settles the tie)
  if (va === vb) {
    b.tie = { va, vb, who, votes: {} };
    say(s, `Tied ${va}–${vb}! Vote again, or toss a coin?`);
    return false;
  }
  decide(s, va > vb ? 0 : 1, va, vb, who, false);
  return true;
}
function decide(s, side, va, vb, who, coin) {
  const b = s.bb,
    m = b.rounds[b.r][b.m];
  Object.assign(
    m,
    { w: side ? m.b : m.a, va, vb, who },
    coin ? { coin: true } : {},
  );
  feed(b, b.r, b.m);
  const w = b.seeds[m.w],
    out = b.seeds[side ? m.a : m.b];
  if (out) lostRound(s, [out.by], "bb"); // (the knocked-out contender's writer)
  say(
    s,
    coin
      ? `The coin sends "${w.text}" through.`
      : `"${w.text}" wins ${Math.max(va, vb)}–${Math.min(va, vb)}.`,
  );
}
/* the tie is settled: more for "vote again" runs the match again; else (or a tie again) the coin decides */
export function settleTie(s, now) {
  const b = s.bb,
    t = b.tie,
    n = { again: 0, coin: 0 };
  for (const [id, v] of Object.entries(t.votes || {}))
    if (s.players[id]) n[v]++;
  if (n.again > n.coin) {
    say(s, "Voting again.");
    delete b.tie;
    s.qi++;
    s.pos = {};
    s.lock = {};
    s.lordTime = s.options.answerOff ? 0 : +s.options.bbTimer || 0;
    seatLate(s);
    s.seat.forEach((id, k) => {
      s.pos[id] = { x: 0.5, y: (k + 1) / (s.seat.length + 1) };
    });
    return enter(s, "answer", now);
  }
  decide(s, Math.random() < 0.5 ? 0 : 1, t.va, t.vb, t.who, true);
  delete b.tie;
  return discussOn(s) ? enter(s, "discuss", now) : nextMatch(s, now);
}
/* a topic or a seed: sent (send) or typed so far (a draft, which everyone sees as it's typed) */
export function bbWrite(s, a, now, send) {
  const me = s.players[a.id],
    seeds = s.phase === "seeds";
  if (
    !me ||
    me.late ||
    s.done[a.id] ||
    !(s.phase === "topic" || (seeds && (s.bb.per[a.id] || 0) > s.bb.turn))
  )
    return send ? s : null;
  const text = oneLine(a.text, seeds ? SEED_MAX : TOPIC_MAX);
  if (!send) {
    s.drafts = { ...(s.drafts || {}), [a.id]: { text } };
    return s;
  }
  s.subs = (s.subs || []).filter((x) => x.by !== a.id);
  if (text.trim()) s.subs.push({ by: a.id, text: text.trim() });
  s.done[a.id] = true;
  return advance(s, now);
}
/* the match a bracket is on, its two seeds, and what a seed's writer is called (hidden in a blind bracket until the
   seed is knocked out or wins it all) */
export const bbMatch = (s) =>
  s.bb && s.bb.m >= 0 ? s.bb.rounds[s.bb.r][s.bb.m] : null;
export const roundName = (b, r) => {
  const left = b.rounds.length - r;
  return left === 1
    ? "The final"
    : left === 2
      ? "Semifinals"
      : left === 3
        ? "Quarterfinals"
        : `Round of ${b.rounds[r].length * 2}`;
};
export function seedOut(b, i) {
  // knocked out: lost a match
  for (const round of b.rounds)
    for (const m of round)
      if (m.w != null && m.b !== -1 && (m.a === i || m.b === i) && m.w !== i)
        return true;
  return false;
}
export const writerShown = (s, b, i) =>
  !s.options.bbBlind || b.champ === i || seedOut(b, i) || s.phase === "results";
/* the podium: 1st the champion's writer, 2nd the runner-up's, 3rd both semifinal losers' */
export function podium(b) {
  if (b.champ == null) return null;
  const loser = (m) =>
      m && m.w != null && m.b !== -1 ? (m.w === m.a ? m.b : m.a) : null,
    R = b.rounds.length;
  const fin = b.rounds[R - 1][0],
    semis = R > 1 ? b.rounds[R - 2].map(loser).filter((x) => x != null) : [];
  return { first: b.champ, second: loser(fin), third: semis };
}
/* the numbers behind the stats, over a list of finished tournaments */
export function bbStats(list) {
  const per = {},
    P = (id) =>
      (per[id] = per[id] || {
        wins: 0,
        losses: 0,
        own: 0,
        votes: 0,
        king: 0,
        titles: 0,
      });
  for (const t of list) {
    if (t.champ != null && t.seeds[t.champ]) P(t.seeds[t.champ].by).titles++;
    for (const round of t.rounds || [])
      for (const m of round) {
        if (m.w == null || m.a == null || m.b == null || m.b === -1) continue; // (a bye isn't a win)
        const W = t.seeds[m.w],
          L = t.seeds[m.w === m.a ? m.b : m.a],
          wSide = m.w === m.a ? 0 : 1,
          close = Math.abs((m.va || 0) - (m.vb || 0)) === 1;
        if (W) P(W.by).wins++;
        if (L) P(L.by).losses++;
        for (const [id, c] of Object.entries(m.who || {})) {
          P(id).votes++;
          const backed = t.seeds[c ? m.b : m.a];
          if (backed && backed.by === id) P(id).own++;
          if (close && c === wSide) P(id).king++; // their vote decided a one-vote match
        }
      }
  }
  return per;
}
