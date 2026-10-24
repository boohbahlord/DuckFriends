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
  order: 'random',      // random | rotate: the order of the round's questions
  share: 0.75,          // how many players must end their turn: .5, .67, .75, 1
  answerTime: 30,       // the Round Lord's default answer time in seconds: 0 (off), 30, 60, 90
  catchUp: 15,          // 0 (off), 15, 30, 45: the rest's time once enough players are done (submit and answer)
  submitTime: 0,        // 0 (off), 60, 90, 120: a time limit on writing questions
  botWait: 30,          // TEST rooms: seconds before computers act
  lowGravity: 0,        // 1: jumps float, slower and higher
  fun: 1,               // the silly commands (lightning, love, kill, hotdog): 1 on, 0 off
  freeRoam: 0,          // 1: no answer lock and no talk-it-over step; ducks roam until the turn ends
  map: 'board',         // board | sky | pixel
};
export const MAX_DEFAULT = 8;
export const COUNTDOWN = 5;
export const VOTE_GRACE = 5;    // seconds at the start of a question before anyone can lock a vote (a stray Enter can't)

const clone = o => structuredClone(o);
export const colOf = x => Math.max(0, Math.min(6, Math.floor(x * 7)));
export const colX = c => (c + .5) / 7;
/* the edges of a column, a little inside, for ducks kept in their column */
export const colBounds = c => [c / 7 + .035, (c + 1) / 7 - .035];
const humanIds = s => s.seat.filter(id => !s.players[id].bot);
/* who plays this round: a player who joined mid-game watches and walks around until the next writing stage */
export const playing = s => s.seat.filter(id => !(s.players[id] || {}).late);
export const needed = s => Math.max(1, Math.ceil(playing(s).length * s.options.share - 1e-9));
/* one turn: the writing stage, one question (its vote and talk), or the stat screen */
export const turnKey = s => s.phase === 'submit' ? `w${s.round}` : ['answer', 'discuss'].includes(s.phase) ? `q${s.round}.${s.qi}` : `${s.phase}${s.round}`;
export const VOTE_TIME = 30;   // seconds a kick or back-to-lobby vote stays open
export const SHOT_SPEED = .22;  // the handgun special's bullet: board widths a second (slow enough to see, and to jump over)
const PRESS = ['coffee', 'watergun', 'hotdog', 'confgun', 'handgun', 'sound'];   // the specials used with E
/* who votes, and how many yes votes pass it: a kick needs every other player; back to the lobby needs the usual share */
export function voteNeeds(s, v = s.vote) {
  if (!v) return { voters: [], need: 0 };
  const voters = humanIds(s).filter(id => v.kind !== 'kick' || id !== v.target);
  return { voters, need: v.kind === 'kick' ? voters.length : Math.max(1, Math.ceil(voters.length * s.options.share - 1e-9)) };
}

export function newRoom({ id, name, host, test = false, open = true, passkey = '', max = MAX_DEFAULT, options = {} }) {
  return {
    v: 1, id, name, test, open, passkey, max, hostId: host.id,
    options: { ...OPTIONS_DEFAULT, ...options },
    players: { [host.id]: { ...host, bot: false, ready: false } }, seat: [host.id],
    phase: 'lobby', at: 0, ends: 0, catchEnds: 0, round: 0,
    qs: [], qi: 0, lordTime: 0, pos: {}, lock: {}, done: {}, fx: [], fxN: 0, history: [], reviewVotes: {}, review: false, jumps: {},
    log: [], logN: 0,
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
  if (phase === 'submit') { s.drafts = {}; for (const id of s.seat) if (s.players[id]) delete s.players[id].late; }   // late joiners play from here
  const lim = phaseLimit(s); s.ends = lim ? now + lim * 1000 : 0;
  return s;
}
/* the room's log (chat and notices); every line has a running number n, so new lines are easy to spot */
const logLine = (s, line) => { s.logN = (s.logN || 0) + 1; s.log.push({ n: s.logN, t: Date.now(), ...line }); if (s.log.length > 200) s.log.shift(); };
const say = (s, text) => logLine(s, { sys: true, text });

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
  s.pos = {}; s.lock = {};
  s.seat.forEach((id, k) => { s.pos[id] = { x: colX(3), y: (k + 1) / (s.seat.length + 1) }; });   // everyone starts on Neutral, lined up
  return enter(s, 'answer', now);
}

/* everyone's answers to the current question go into the history */
function recordAnswers(s) {
  const q = s.qs[s.qi], a = {};
  for (const id of playing(s)) { const p = s.pos[id]; if (p && p.x >= 0) a[id] = colOf(p.x); }
  s.history.push({ round: s.round, by: q.by, text: q.text, a });
  s.lock = { ...a };   // after answering, each duck stays in the column it chose
}

function startResults(s, now) {
  s.reviewVotes = {}; s.review = false;
  // each duck stays where it was, in the column it was locked into on the last question; a duck that never stood on
  // the board (it joined late) starts in Neutral
  s.lock = {};
  const off = [];
  for (const id of s.seat) { const p = s.pos[id]; if (p && p.x >= 0) s.lock[id] = colOf(p.x); else { s.lock[id] = 3; off.push(id); } }
  off.forEach((id, k) => { s.pos[id] = { x: colX(3), y: (k + 1) / (off.length + 1) }; });
  return enter(s, 'results', now);
}

/* what ends a phase: enough players done (submit and answer then wait out the catch-up timer), or its timer */
function advance(s, now) {
  const on = playing(s), n = on.length, d = on.filter(id => s.done[id]).length, all = d >= n, enough = d >= needed(s);
  const timed = s.phase === 'submit' || s.phase === 'answer';
  const timeUp = s.ends && now >= s.ends;
  if (timed && enough && !all && s.options.catchUp && !s.catchEnds) s.catchEnds = now + s.options.catchUp * 1000;
  const go = all || timeUp || (enough && (!timed || !s.options.catchUp || now >= s.catchEnds));
  if (!go) return s;
  switch (s.phase) {
    case 'countdown': return s;
    case 'submit': {
      /* whatever someone had typed goes in as their question when time runs out (Send or "Don't submit one" ends it early) */
      for (const id of s.seat) { const d = (s.drafts || {})[id]; if (!s.done[id] && d && d.text) (s.subs = s.subs || []).push({ by: id, text: d.text, time: d.time }); }
      delete s.drafts;
      const subs = {}; for (const q of s.subs || []) subs[q.by] = q;
      s.qs = orderQuestions(s, subs).map(id => subs[id]); s.qi = 0; delete s.subs;
      if (!s.qs.length) { say(s, 'No questions this round.'); s.round++; s.subs = []; return enter(s, 'submit', now); }
      return startQuestion(s, now);
    }
    case 'answer':
      recordAnswers(s);
      if (!s.options.freeRoam) return enter(s, 'discuss', now);
      if (++s.qi < s.qs.length) return startQuestion(s, now);   // free roam: straight to the next question
      return startResults(s, now);
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
      if ((s.banned || {})[a.p.id] || (a.p.acct && (s.banned || {})['acct:' + a.p.acct])) return state;   // voted out until the lobby
      P[a.p.id] = { ...a.p, ready: false }; s.seat.push(a.p.id);
      if (['answer', 'discuss', 'results'].includes(s.phase)) P[a.p.id].late = true;   // mid-round: plays from the next writing stage
      if (s.phase === 'answer' || s.phase === 'discuss' || s.phase === 'results') s.pos[a.p.id] = { x: colX(3), y: Math.random() };
      say(s, `${a.p.name} joined.`); return s;
    }
    case 'leave': {
      if (!me) return s;
      say(s, `${me.name} left.`);
      delete P[a.id]; s.seat = s.seat.filter(id => id !== a.id); delete s.pos[a.id]; delete s.done[a.id];
      if (host) s.hostId = humanIds(s)[0] || null;
      if (s.vote) settleVote(s, now);
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
    case 'draft': {   // what a player has typed so far (kept by the host, sent in for them at the end)
      if (!me || s.phase !== 'submit' || s.done[a.id]) return state;
      const text = String(a.text || '').trim().slice(0, 200);
      s.drafts = { ...(s.drafts || {}), [a.id]: { text, time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime } };
      return s;
    }
    case 'move': {   // x, y on the board; j = when the current jump started (0 = on the ground)
      if (!me || !s.pos[a.id]) return state;
      if (!['answer', 'discuss', 'results'].includes(s.phase)) return state;
      const was = s.pos[a.id], j = +a.j || 0;
      let x = Math.max(0, Math.min(1, +a.x || 0)), y = Math.max(0, Math.min(1, +a.y || 0));
      // an ended turn keeps its answer (jumping still works; reset duck may move it inside the same column)
      if (s.phase === 'answer' && s.done[a.id] && !s.options.freeRoam && !(a.reset && colOf(x) === colOf(was.x))) { x = was.x; y = was.y; }
      if (s.phase !== 'answer' && !me.late) {   // after answering: inside your own column; no answer, no board (late joiners roam)
        const c = s.lock[a.id];
        if (c === undefined) { x = was.x; y = was.y; } else { const [lo, hi] = colBounds(c); x = Math.max(lo, Math.min(hi, x)); }
      }
      s.pos[a.id] = { x, y, j, q: /^[lrud]$/.test(a.q) ? a.q : '', sp: !!a.sp };   // q: squashed against l/r/u/d; sp: sprinting
      if (me.dead && (x !== was.x || y !== was.y)) delete me.dead;
      return s;
    }
    case 'end': {   // end your turn (answer, discuss) or be ready for the next round (results)
      if (!me || me.late || !['answer', 'discuss', 'results'].includes(s.phase)) return s;
      if (s.phase === 'answer' && !(s.pos[a.id] && s.pos[a.id].x >= 0)) return s;   // stand on a column first
      if (s.phase === 'answer' && now < s.at + VOTE_GRACE * 1000) return state;       // not in the first seconds
      s.done[a.id] = a.v ?? !s.done[a.id];
      if (s.phase === 'answer' && !s.options.freeRoam) s.done[a.id] = true;   // free roam: ready can be taken back
      return advance(s, now);
    }
    case 'voteReview':
      if (!me || s.phase !== 'results' || s.round < 1 || s.reviewVotes[a.id]) return s;
      s.reviewVotes[a.id] = true;
      if (s.seat.filter(id => s.reviewVotes[id]).length >= needed(s)) s.review = true;
      return s;
    case 'toLobby': if (host && s.phase === 'over') { s.phase = 'lobby'; s.round = 0; s.history = []; s.jumps = {}; for (const id of s.seat) P[id].ready = false; } return s;
    case 'fx': {   // the silly commands, seen by everyone on the board
      const who = (a.who || []).filter(id => P[id]);
      if (!me || !s.options.fun || !who.length || !['lightning', 'love', 'kill', 'hotdog', 'fire'].includes(a.kind)) return state;
      if (a.kind === 'kill') { for (const id of who) P[id].dead = true; }
      logLine(s, { sys: true, small: true, text: `${me.name} used ${a.kind} on ${who.map(id => P[id].name).join(' and ')}.` });   // who did it, in small print
      s.fxN = (s.fxN || 0) + 1; s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, kind: a.kind, who, by: a.id, t: now }];
      return s;
    }
    case 'jumps': if (me) s.jumps[a.id] = Math.max(0, +a.n || 0); return s;   // completed jumps this game
    case 'ping': {   // a player's connection: milliseconds to the game server and back
      const ms = Math.max(0, Math.min(9999, Math.round(+a.ms || 0)));
      if (!me || me.ms === ms) return state;
      me.ms = ms; return s;
    }
    case 'idle': if (!me || !!me.idle === !!a.v) return state; me.idle = !!a.v; return s;   // no key, click or touch in 2 minutes
    case 'use': {   // an E special on the board, seen by everyone; the handgun's bullet then crosses the board
      const sp = me && me.duck && me.duck.special, p = s.pos[a.id];
      if (!me || !p || p.x < 0 || !['answer', 'discuss', 'results'].includes(s.phase) || !PRESS.includes(sp)) return state;
      if (sp === 'handgun' && !s.options.fun) return state;   // the silly-commands switch covers it
      if (now - ((s.lastUse || {})[a.id] || 0) < (sp === 'handgun' ? 3000 : 1500)) return state;
      s.lastUse = { ...(s.lastUse || {}), [a.id]: now };
      const face = a.face < 0 ? -1 : 1;
      s.fxN = (s.fxN || 0) + 1; s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, kind: 'use', what: sp, by: a.id, who: [a.id], face, t: now }];
      if (sp === 'handgun') s.shots = [...(s.shots || []), { n: s.fxN, by: a.id, x0: p.x, y: p.y, dir: face, t: now, lx: p.x }];
      return s;
    }
    case 'voteStart': {   // a vote to kick a player, or to go back to the lobby; the one who starts it votes yes
      if (!me || me.bot || ['lobby', 'countdown', 'over'].includes(s.phase)) return state;
      if (s.vote) return state;
      const used = (s.voteUsed || {})[a.id] || {};
      if (a.kind === 'kick') {
        if (!P[a.target] || a.target === a.id) return state;
        if (used.kick !== undefined && s.round - used.kick < 2) return state;   // one kick vote every two rounds
      } else if (a.kind === 'lobby') {
        if (used.lobby === turnKey(s)) return state;   // one back-to-lobby vote a turn
      } else return state;
      s.voteN = (s.voteN || 0) + 1;
      s.vote = { n: s.voteN, kind: a.kind, target: a.kind === 'kick' ? a.target : null, by: a.id, yes: { [a.id]: true }, no: {}, ends: now + VOTE_TIME * 1000 };
      s.voteUsed = { ...(s.voteUsed || {}), [a.id]: { ...used, [a.kind]: a.kind === 'kick' ? s.round : turnKey(s) } };
      say(s, a.kind === 'kick' ? `${me.name} started a vote to kick ${P[a.target].name}.` : `${me.name} started a vote to go back to the lobby.`);
      return settleVote(s, now);
    }
    case 'voteCast': {
      const v = s.vote; if (!me || !v || v.n !== a.n) return state;
      if (!voteNeeds(s).voters.includes(a.id)) return state;
      if (a.v) { v.yes[a.id] = true; delete v.no[a.id]; } else { v.no[a.id] = true; delete v.yes[a.id]; }
      return settleVote(s, now);
    }
    case 'chat': {
      if (!me) return s;
      const text = String(a.text || '').trim().slice(0, 500); if (!text) return state;
      if (a.to && !P[a.to]) return state;
      logLine(s, { from: a.id, to: a.to || null, text }); return s;
    }
    case 'tick': {   // the host's heartbeat; the same state comes back when nothing changed, so nothing redraws
      if (s.phase === 'countdown' && now >= s.ends) { s.startedAt = now; s.round = 0; s.history = []; s.subs = []; s.jumps = {}; for (const id of s.seat) P[id].ready = false; return enter(s, 'submit', now); }
      if (s.phase === 'lobby' || s.phase === 'over' || s.phase === 'countdown') return state;
      if (s.vote && now >= s.vote.ends) { say(s, 'The vote ran out of time.'); s.vote = null; return s; }
      const shots = moveShots(s, now);
      const sig = () => [s.phase, s.qi, s.catchEnds, s.round, s.at].join(), was = sig();
      advance(s, now);
      return sig() === was && !shots ? state : s;
    }
  }
  return s;
}

/* the handgun's bullets: a duck on the ground that a bullet passes through plays dead (until it moves) */
function moveShots(s, now) {
  if (!s.shots || !s.shots.length) return false;
  const keep = [];
  for (const sh of s.shots) {
    const x = sh.x0 + sh.dir * SHOT_SPEED * (now - sh.t) / 1000, lo = Math.min(sh.lx, x) - .02, hi = Math.max(sh.lx, x) + .02;
    for (const id of s.seat) {
      const p = s.pos[id], P = s.players[id]; if (id === sh.by || !p || p.x < 0 || !P || P.dead) continue;
      if (p.j && now - p.j < 1300) continue;   // jumped over it
      if (p.x >= lo && p.x <= hi && Math.abs(p.y - sh.y) < .08) P.dead = true;
    }
    sh.lx = x;
    if (x > -.05 && x < 1.05 && ['answer', 'discuss', 'results'].includes(s.phase)) keep.push(sh);
  }
  s.shots = keep; return true;
}

/* a vote passes once enough say yes, and fails once it can't pass any more */
function settleVote(s, now) {
  const v = s.vote; if (!v) return s;
  const { voters, need } = voteNeeds(s, v), yes = voters.filter(id => v.yes[id]).length, no = voters.filter(id => v.no[id]).length;
  if (v.kind === 'kick' && !s.players[v.target]) { s.vote = null; return s; }
  if (yes >= need) {
    s.vote = null;
    if (v.kind === 'kick') {
      const p = s.players[v.target];
      s.banned = { ...(s.banned || {}), [v.target]: true, ...(p.acct ? { ['acct:' + p.acct]: true } : {}) };
      say(s, `${p.name} was voted out until the room goes back to the lobby.`);
      delete s.players[v.target]; s.seat = s.seat.filter(id => id !== v.target); delete s.pos[v.target]; delete s.done[v.target];
      if (v.target === s.hostId) s.hostId = humanIds(s)[0] || null;
      return advance(s, now);
    }
    return backToLobby(s, 'Everyone voted to go back to the lobby.');
  }
  if (no > voters.length - need) { s.vote = null; say(s, 'The vote didn\'t pass.'); }
  return s;
}
/* the room goes back to the lobby: a fresh game next time, and the voted-out may come back */
function backToLobby(s, why) {
  s.phase = 'lobby'; s.at = 0; s.ends = 0; s.catchEnds = 0; s.round = 0; s.history = []; s.jumps = {}; s.qs = []; s.qi = 0; s.subs = [];
  s.done = {}; s.vote = null; s.voteUsed = {}; s.banned = {}; s.pos = {}; s.lock = {};
  for (const id of s.seat) { s.players[id].ready = false; delete s.players[id].late; }
  say(s, why);
  return s;
}

/* ---------- stats: on the −3 (strongly disagree) … +3 (strongly agree) scale ---------- */
export function statsFor(s, id, round = null) {
  const vals = s.history.filter(h => round === null || h.round === round).map(h => h.a[id]).filter(c => c !== undefined);
  const n = vals.length;
  if (!n) return { n: 0, most: [], median: null, avg: null, jumps: (s.jumps || {})[id] || 0 };
  const count = Array(7).fill(0); vals.forEach(c => count[c]++);
  const top = Math.max(...count), most = count.map((k, c) => k === top ? c : -1).filter(c => c >= 0);
  const sorted = vals.map(c => c - 3).sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const avg = sorted.reduce((a, b) => a + b, 0) / n;
  return { n, most, median, avg, jumps: (s.jumps || {})[id] || 0 };
}
export const signed = v => v === null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(Number.isInteger(v) ? 0 : 1);
export const nameOfValue = v => v === null ? '' : COLS[Math.max(0, Math.min(6, Math.round(v) + 3))];
