/* ---------- the rules of Agree or Disagree ----------
   The room's whole state and every change to it, as plain data: reduce(state, action, now) returns the next state. The host
   runs it (alone in a TEST room; for everyone online later), so every player sees the same game.

   A round: everyone submits a question (or none) → each question in turn: answer (move your duck onto a column, end your
   turn) → talk it over → the next question → the round's results → the next round. The rounds go on until the players
   vote to end the game.

   A phase ends when enough players have ended their turn (3 of 4 by default). In submit and answer, reaching that starts
   the catch-up timer (15 s by default) for the rest; a timer, when one is set, ends the phase too. */

export const COLS = ['Strongly disagree', 'Disagree', 'Slightly disagree', 'Neutral', 'Slightly agree', 'Agree', 'Strongly agree'];
export const SHORT = ['−−−', '−−', '−', '0', '+', '++', '+++'];
export const OPTIONS_DEFAULT = {
  order: 'rotate',      // rotate | random: the order of the round's questions
  share: 0.75,          // how many players must end their turn: .5, .67, .75, 1
  answerTime: 0,        // the Round Lord's default answer time in seconds: 0 (off), 30, 60, 90
  catchUp: 15,          // 0 (off), 15, 30, 45: the rest's time once enough players are done (submit and answer)
  submitTime: 0,        // 0 (off), 60, 90, 120: a time limit on writing questions
  botWait: 30,          // TEST rooms: seconds before computers act
};
export const MAX_DEFAULT = 8;
export const COUNTDOWN = 5;

const clone = o => structuredClone(o);
export const colOf = x => Math.max(0, Math.min(6, Math.floor(x * 7)));
export const colX = c => (c + .5) / 7;
const humanIds = s => s.seat.filter(id => !s.players[id].bot);
export const needed = s => Math.max(1, Math.ceil(s.seat.length * s.options.share - 1e-9));

export function newRoom({ id, name, host, test = false, open = true, passkey = '', max = MAX_DEFAULT, options = {} }) {
  return {
    v: 1, id, name, test, open, passkey, max, hostId: host.id,
    options: { ...OPTIONS_DEFAULT, ...options },
    players: { [host.id]: { ...host, bot: false, ready: false } }, seat: [host.id],
    phase: 'lobby', at: 0, ends: 0, catchEnds: 0, round: 0,
    qs: [], qi: 0, lordTime: 0, pos: {}, done: {}, history: [], reviewVotes: {}, endVotes: {}, review: false, clicks: {},
    log: [],
  };
}

/* the time limit of the current phase (0 = none) */
function phaseLimit(s) {
  if (s.phase === 'submit') return s.options.submitTime;
  if (s.phase === 'answer') return s.lordTime;
  return 0;
}
function enter(s, phase, now) {
  s.phase = phase; s.at = now; s.done = {}; s.catchEnds = 0;
  const lim = phaseLimit(s); s.ends = lim ? now + lim * 1000 : 0;
  return s;
}
const say = (s, text) => { s.log.push({ t: Date.now(), sys: true, text }); if (s.log.length > 200) s.log.shift(); };

/* the order of a round's questions: rotating (who goes first moves along each round) or random */
function orderQuestions(s, subs) {
  const ids = s.seat.filter(id => subs[id]);
  if (s.options.order === 'random') {
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids;
  }
  const k = s.round % Math.max(1, s.seat.length);
  const rot = [...s.seat.slice(k), ...s.seat.slice(0, k)];
  return rot.filter(id => subs[id]);
}

function startQuestion(s, now) {
  const q = s.qs[s.qi];
  s.lordTime = q.time;
  s.pos = {};
  for (const id of s.seat) s.pos[id] = { x: -1, y: .5 + (Math.random() - .5) * .5 };   // x < 0: not on the board yet
  return enter(s, 'answer', now);
}

/* everyone's answers to the current question go into the history */
function recordAnswers(s) {
  const q = s.qs[s.qi], a = {};
  for (const id of s.seat) { const p = s.pos[id]; if (p && p.x >= 0) a[id] = colOf(p.x); }
  s.history.push({ round: s.round, by: q.by, text: q.text, a });
}

function startResults(s, now) {
  s.reviewVotes = {}; s.endVotes = {}; s.review = false;
  // each duck stands in the column of its round average
  for (const id of s.seat) {
    const st = statsFor(s, id, s.round);
    s.pos[id] = { x: st.n ? colX(Math.round(st.avg) + 3) : colX(3), y: .5 + (Math.random() - .5) * .5 };
  }
  return enter(s, 'results', now);
}

/* what ends a phase: enough players done (submit and answer then wait out the catch-up timer), or its timer */
function advance(s, now) {
  const n = s.seat.length, d = s.seat.filter(id => s.done[id]).length, all = d >= n, enough = d >= needed(s);
  const timed = s.phase === 'submit' || s.phase === 'answer';
  const timeUp = s.ends && now >= s.ends;
  if (timed && enough && !all && s.options.catchUp && !s.catchEnds) s.catchEnds = now + s.options.catchUp * 1000;
  const go = all || timeUp || (enough && (!timed || !s.options.catchUp || now >= s.catchEnds));
  if (!go) return s;
  switch (s.phase) {
    case 'countdown': return s;
    case 'submit': {
      const subs = {}; for (const q of s.subs || []) subs[q.by] = q;
      s.qs = orderQuestions(s, subs).map(id => subs[id]); s.qi = 0; delete s.subs;
      if (!s.qs.length) { say(s, 'No questions this round.'); s.round++; s.subs = []; return enter(s, 'submit', now); }
      return startQuestion(s, now);
    }
    case 'answer': recordAnswers(s); return enter(s, 'discuss', now);
    case 'discuss':
      if (++s.qi < s.qs.length) return startQuestion(s, now);
      return startResults(s, now);
    case 'results': s.round++; s.subs = []; s.qs = []; return enter(s, 'submit', now);
  }
  return s;
}

/* ---------- the actions ---------- */
export function reduce(state, a, now = Date.now()) {
  const s = clone(state), P = s.players, me = P[a.id], host = a.id === s.hostId;
  switch (a.t) {
    case 'join': {
      if (P[a.p.id]) { P[a.p.id] = { ...P[a.p.id], ...a.p }; return s; }
      if (s.seat.length >= s.max) return s;
      P[a.p.id] = { ...a.p, ready: false }; s.seat.push(a.p.id);
      if (s.phase === 'answer' || s.phase === 'discuss' || s.phase === 'results') s.pos[a.p.id] = { x: -1, y: .5 };
      say(s, `${a.p.name} joined.`); return s;
    }
    case 'leave': {
      if (!me) return s;
      say(s, `${me.name} left.`);
      delete P[a.id]; s.seat = s.seat.filter(id => id !== a.id); delete s.pos[a.id]; delete s.done[a.id];
      if (host) s.hostId = humanIds(s)[0] || null;
      return s.phase === 'lobby' || s.phase === 'over' ? s : advance(s, now);
    }
    case 'look': if (me) Object.assign(me, a.look); return s;
    case 'ready': if (me && (s.phase === 'lobby' || s.phase === 'over')) me.ready = a.v ?? !me.ready; return s;
    case 'options': if (host && (s.phase === 'lobby' || s.phase === 'over')) { Object.assign(s.options, a.options); if (a.max) s.max = Math.max(s.seat.length, a.max); } return s;
    case 'kick': if (host && P[a.who] && a.who !== s.hostId) { delete P[a.who]; s.seat = s.seat.filter(id => id !== a.who); } return s;
    case 'start':
      if (!host || !(s.phase === 'lobby' || s.phase === 'over')) return s;
      s.phase = 'countdown'; s.at = now; s.ends = now + COUNTDOWN * 1000; return s;
    case 'cancel': if (host && s.phase === 'countdown') { s.phase = 'lobby'; s.ends = 0; } return s;
    case 'submit': {
      if (!me || s.phase !== 'submit' || s.done[a.id]) return s;
      const text = String(a.text || '').trim().slice(0, 200);
      s.subs = (s.subs || []).filter(q => q.by !== a.id);
      if (text) s.subs.push({ by: a.id, text, time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime });
      s.done[a.id] = true; return advance(s, now);
    }
    case 'move': {
      if (!me || !s.pos[a.id]) return s;
      if (s.phase === 'answer' && s.done[a.id]) return s;   // an ended turn keeps its answer
      if (!['answer', 'discuss', 'results'].includes(s.phase)) return s;
      let x = Math.max(0, Math.min(1, +a.x || 0)), y = Math.max(0, Math.min(1, +a.y || 0));
      if (s.phase === 'results') x = s.pos[a.id].x;   // results: only along your column
      s.pos[a.id] = { x, y }; return s;
    }
    case 'end': {   // end your turn (answer, discuss) or be ready for the next round (results)
      if (!me || !['answer', 'discuss', 'results'].includes(s.phase)) return s;
      if (s.phase === 'answer' && !(s.pos[a.id] && s.pos[a.id].x >= 0)) return s;   // stand on a column first
      s.done[a.id] = a.v ?? !s.done[a.id];
      if (s.phase === 'answer') s.done[a.id] = true;
      return advance(s, now);
    }
    case 'voteReview':
      if (!me || s.phase !== 'results' || s.round < 1 || s.reviewVotes[a.id]) return s;
      s.reviewVotes[a.id] = true;
      if (s.seat.filter(id => s.reviewVotes[id]).length >= needed(s)) s.review = true;
      return s;
    case 'voteEnd':
      if (!me || s.phase !== 'results') return s;
      s.endVotes[a.id] = !s.endVotes[a.id];
      return s.seat.filter(id => s.endVotes[id]).length >= needed(s) ? enter(s, 'over', now) : s;
    case 'toLobby': if (host && s.phase === 'over') { s.phase = 'lobby'; s.round = 0; s.history = []; s.clicks = {}; for (const id of s.seat) P[id].ready = false; } return s;
    case 'clicks': if (me) s.clicks[a.id] = a.n; return s;
    case 'chat': {
      if (!me) return s;
      s.log.push({ t: now, from: a.id, to: a.to || null, text: String(a.text || '').slice(0, 300) });
      if (s.log.length > 200) s.log.shift(); return s;
    }
    case 'tick': {   // the host's heartbeat; the same state comes back when nothing changed, so nothing redraws
      if (s.phase === 'countdown' && now >= s.ends) { s.round = 0; s.history = []; s.subs = []; s.clicks = {}; for (const id of s.seat) P[id].ready = false; return enter(s, 'submit', now); }
      if (s.phase === 'lobby' || s.phase === 'over' || s.phase === 'countdown') return state;
      const sig = () => [s.phase, s.qi, s.catchEnds, s.round, s.at].join(), was = sig();
      advance(s, now);
      return sig() === was ? state : s;
    }
  }
  return s;
}

/* ---------- stats: on the −3 (strongly disagree) … +3 (strongly agree) scale ---------- */
export function statsFor(s, id, round = null) {
  const vals = s.history.filter(h => round === null || h.round === round).map(h => h.a[id]).filter(c => c !== undefined);
  const n = vals.length;
  if (!n) return { n: 0, most: [], median: null, avg: null, clicks: s.clicks[id] || 0 };
  const count = Array(7).fill(0); vals.forEach(c => count[c]++);
  const top = Math.max(...count), most = count.map((k, c) => k === top ? c : -1).filter(c => c >= 0);
  const sorted = vals.map(c => c - 3).sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const avg = sorted.reduce((a, b) => a + b, 0) / n;
  return { n, most, median, avg, clicks: s.clicks[id] || 0 };
}
export const signed = v => v === null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(Number.isInteger(v) ? 0 : 1);
export const nameOfValue = v => v === null ? '' : COLS[Math.max(0, Math.min(6, Math.round(v) + 3))];
