/* ---------- the rules of Agree or Disagree ----------
   The room's whole state and every change to it, as plain data: reduce(state, action, now) returns the next state. The host
   runs it (alone in a TEST room; for everyone online later), so every player sees the same game.

   A round: everyone submits a question (or none) → each question in turn: answer (move your duck onto a column, end your
   turn) → talk it over → the next question → the round's results → the next round. The rounds go on until the players
   vote to end the game.

   A phase ends when enough players have ended their turn (3 of 4 by default). In submit and answer, reaching that starts
   the catch-up timer (15 s by default) for the rest; a timer, when one is set, ends the phase too.

   Would You Rather is the same with two choices. Bicker Brackets (below) runs a tournament a round. */

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
  mode: 'aod',          // the game: aod (Agree or Disagree) | wyr (Would You Rather) | bb (Bicker Brackets)
  bbSeeds: 't8',        // Bicker Brackets: t8, t12, t16, t32 seeds shared out, or p1 … p4 seeds for each player
  bbTopic: 'vote',      // vote (everyone writes one, then votes) | random (one of BB_TOPICS)
  bbBlind: 0,           // 1: a seed's writer stays hidden until it is knocked out or wins
  bbSpeed: 0,           // 1: 10-second match votes
};
export const MAX_DEFAULT = 8;
export const COUNTDOWN = 5;
export const VOTE_GRACE = 5;    // seconds at the start of a question before anyone can lock a vote (a stray Enter can't)

const clone = o => structuredClone(o);
export const colOf = x => Math.max(0, Math.min(6, Math.floor(x * 7)));
export const colX = c => (c + .5) / 7;
/* the edges of a column, a little inside, for ducks kept in their column */
export const colBounds = c => [c / 7 + .035, (c + 1) / 7 - .035];
/* the board by game mode: Agree or Disagree has its seven columns; Would You Rather two tiles, A on the left and B on the
   right, with an OR strip between them where a duck has no answer (-1) */
export const isWyr = s => s.options.mode === 'wyr';
export const isBb = s => s.options.mode === 'bb';
export const twoSided = s => isWyr(s) || isBb(s);   // a match in Bicker Brackets: seed A on the left, B on the right
export const colAt = (s, x) => twoSided(s) ? (x < .46 ? 0 : x > .54 ? 1 : -1) : colOf(x);
export const colXAt = (s, c) => twoSided(s) ? [.25, .75][c] ?? .5 : colX(c);
export const colBoundsAt = (s, c) => twoSided(s) ? ([[.03, .44], [.56, .97]][c] || [.47, .53]) : colBounds(c);
export const startX = s => twoSided(s) ? .5 : colX(3);   // where ducks start: Neutral, or the OR strip
/* the phases with ducks on the board (Bicker Brackets: its stats fill the screen; ducks walk over the bracket instead) */
export const boardPhases = s => isBb(s) ? ['answer', 'discuss', 'bracket'] : ['answer', 'discuss', 'results'];
const humanIds = s => s.seat.filter(id => !s.players[id].bot);
/* who plays this round: a player who joined mid-game watches and walks around until the next writing stage */
export const playing = s => s.seat.filter(id => !(s.players[id] || {}).late);
export const needed = s => Math.max(1, Math.ceil(playing(s).length * s.options.share - 1e-9));
/* one turn: the writing stage, one question (its vote and talk), or the stat screen */
export const turnKey = s => s.phase === 'submit' ? `w${s.round}` : ['answer', 'discuss'].includes(s.phase) ? `q${s.round}.${s.qi}` : `${s.phase}${s.round}.${s.qi}`;
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
  if (['submit', 'topic', 'seeds'].includes(s.phase)) return s.options.submitTime;
  if (s.phase === 'answer') return s.lordTime;
  if (s.phase === 'podium') return PODIUM;
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
  s.seat.forEach((id, k) => { s.pos[id] = { x: startX(s), y: (k + 1) / (s.seat.length + 1) }; });   // everyone starts on Neutral (or the OR strip), lined up
  return enter(s, 'answer', now);
}

/* everyone's answers to the current question go into the history */
function recordAnswers(s) {
  const q = s.qs[s.qi], a = {};
  for (const id of playing(s)) { const p = s.pos[id], c = p && p.x >= 0 ? colAt(s, p.x) : -1; if (c >= 0) a[id] = c; }
  s.history.push({ round: s.round, by: q.by, text: q.text, ...(q.b !== undefined ? { qa: q.a, qb: q.b } : {}), a });
  s.lock = { ...a };   // after answering, each duck stays in the column it chose
}

function startResults(s, now) {
  s.reviewVotes = {}; s.review = false;
  if (isBb(s)) { const { topic, topicBy, seeds, rounds, champ } = s.bb; s.bbPast = [...(s.bbPast || []), { round: s.round, topic, topicBy, seeds, rounds, champ }]; return enter(s, 'results', now); }   // the tournament joins the game's
  // each duck stays where it was, in the column it was locked into on the last question; a duck that never stood on
  // the board (it joined late) starts in Neutral
  s.lock = {};
  const off = [];
  for (const id of s.seat) { const p = s.pos[id], c = p && p.x >= 0 ? colAt(s, p.x) : -1; if (c >= 0) s.lock[id] = c; else { s.lock[id] = isWyr(s) ? -1 : 3; off.push(id); } }
  off.forEach((id, k) => { s.pos[id] = { x: startX(s), y: (k + 1) / (off.length + 1) }; });
  return enter(s, 'results', now);
}

/* what ends a phase: enough players done (submit and answer then wait out the catch-up timer), or its timer */
function advance(s, now) {
  const on = playing(s), n = on.length, d = on.filter(id => s.done[id]).length, all = d >= n, enough = d >= needed(s);
  const timed = ['submit', 'answer', 'topic', 'tvote', 'seeds'].includes(s.phase);
  const timeUp = s.ends && now >= s.ends;
  if (timed && enough && !all && s.options.catchUp && !s.catchEnds) s.catchEnds = now + s.options.catchUp * 1000;
  const go = all || timeUp || (enough && (!timed || !s.options.catchUp || now >= s.catchEnds));
  if (!go) return s;
  switch (s.phase) {
    case 'countdown': return s;
    case 'submit': {
      /* whatever someone had typed goes in as their question when time runs out (Send or "Don't submit one" ends it early) */
      for (const id of s.seat) { const d = (s.drafts || {})[id]; if (!s.done[id] && d && d.text) (s.subs = s.subs || []).push({ by: id, ...d }); }
      delete s.drafts;
      const subs = {}; for (const q of s.subs || []) subs[q.by] = q;
      s.qs = orderQuestions(s, subs).map(id => subs[id]); s.qi = 0; delete s.subs;
      if (!s.qs.length) { say(s, 'No questions this round.'); s.round++; s.subs = []; return enter(s, 'submit', now); }
      return startQuestion(s, now);
    }
    case 'topic': return endTopics(s, now);
    case 'tvote': return pickTopic(s, now);
    case 'seeds': return endSeedTurn(s, now);
    case 'bracket': return s.bb.champ != null ? enter(s, 'podium', now) : nextMatch(s, now);
    case 'podium': return startResults(s, now);
    case 'answer':
      if (isBb(s)) { endMatch(s); return s.options.freeRoam ? nextMatch(s, now) : enter(s, 'discuss', now); }
      recordAnswers(s);
      if (!s.options.freeRoam) return enter(s, 'discuss', now);
      if (++s.qi < s.qs.length) return startQuestion(s, now);   // free roam: straight to the next question
      return startResults(s, now);
    case 'discuss':
      if (isBb(s)) return nextMatch(s, now);
      if (++s.qi < s.qs.length) return startQuestion(s, now);
      return startResults(s, now);
    case 'results': s.round++; s.subs = []; s.qs = []; return isBb(s) ? startTourney(s, now) : enter(s, 'submit', now);
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
      if ((isBb(s) ? ['seeds', 'answer', 'discuss', 'bracket', 'podium', 'results'] : ['answer', 'discuss', 'results']).includes(s.phase)) P[a.p.id].late = true;   // mid-round: plays from the next writing stage (the next tournament)
      if (boardPhases(s).includes(s.phase)) s.pos[a.p.id] = { x: startX(s), y: Math.random() };
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
      if (isBb(s)) return bbWrite(s, a, now, true);
      if (!me || s.phase !== 'submit' || s.done[a.id]) return s;
      const q = question(s, a);
      s.subs = (s.subs || []).filter(x => x.by !== a.id);
      if (q) s.subs.push({ by: a.id, ...q, time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime });
      s.done[a.id] = true; return advance(s, now);
    }
    case 'draft': {   // what a player has typed so far (kept by the host, sent in for them at the end)
      if (isBb(s)) return bbWrite(s, a, now, false) || state;
      if (!me || s.phase !== 'submit' || s.done[a.id]) return state;
      s.drafts = { ...(s.drafts || {}), [a.id]: { ...(question(s, a) || { text: '' }), time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime } };
      return s;
    }
    case 'move': {   // x, y on the board; j = when the current jump started (0 = on the ground)
      if (!me || !s.pos[a.id]) return state;
      if (!boardPhases(s).includes(s.phase)) return state;
      const was = s.pos[a.id], j = +a.j || 0;
      let x = Math.max(0, Math.min(1, +a.x || 0)), y = Math.max(0, Math.min(1, +a.y || 0));
      // an ended turn keeps its answer (jumping still works; reset duck may move it inside the same column)
      if (s.phase === 'answer' && s.done[a.id] && !s.options.freeRoam && !(a.reset && colAt(s, x) === colAt(s, was.x))) { x = was.x; y = was.y; }
      if (s.phase !== 'answer' && s.phase !== 'bracket' && !me.late) {   // after answering: inside your own column; no answer, no board (late joiners roam; over the bracket anyone does)
        const c = s.lock[a.id];
        if (c === undefined) { x = was.x; y = was.y; } else { const [lo, hi] = colBoundsAt(s, c); x = Math.max(lo, Math.min(hi, x)); }
      }
      s.pos[a.id] = { x, y, j, q: /^[lrud]$/.test(a.q) ? a.q : '', sp: !!a.sp };   // q: squashed against l/r/u/d; sp: sprinting
      if (me.dead && (x !== was.x || y !== was.y)) delete me.dead;
      return s;
    }
    case 'end': {   // end your turn (answer, discuss) or be ready for the next round (results)
      if (!me || me.late || ![...boardPhases(s), 'results'].includes(s.phase)) return s;
      if (s.phase === 'answer' && !(s.pos[a.id] && s.pos[a.id].x >= 0 && colAt(s, s.pos[a.id].x) >= 0)) return s;   // stand on a column (a tile) first
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
      if (!me || !p || p.x < 0 || !boardPhases(s).includes(s.phase) || !PRESS.includes(sp)) return state;
      if (sp === 'handgun' && !s.options.fun) return state;   // the silly-commands switch covers it
      if (now - ((s.lastUse || {})[a.id] || 0) < (sp === 'handgun' ? 3000 : 1500)) return state;
      s.lastUse = { ...(s.lastUse || {}), [a.id]: now };
      const face = a.face < 0 ? -1 : 1;
      s.fxN = (s.fxN || 0) + 1; s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, kind: 'use', what: sp, by: a.id, who: [a.id], face, t: now }];
      if (sp === 'handgun') s.shots = [...(s.shots || []), { n: s.fxN, by: a.id, x0: p.x, y: p.y, dir: face, t: now, lx: p.x }];
      return s;
    }
    case 'pick': {   // Bicker Brackets: my vote for a topic (it can be changed until the vote ends)
      if (!me || me.late || s.phase !== 'tvote' || !Number.isInteger(a.i) || !s.bb.topics[a.i]) return state;
      s.bb.tvotes = { ...s.bb.tvotes, [a.id]: a.i }; s.done[a.id] = true;
      return advance(s, now);
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
      if (s.phase === 'countdown' && now >= s.ends) {
        s.startedAt = now; s.round = 0; s.history = []; s.subs = []; s.jumps = {}; s.bbPast = []; for (const id of s.seat) P[id].ready = false;
        return isBb(s) ? startTourney(s, now) : enter(s, 'submit', now);
      }
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
    if (x > -.05 && x < 1.05 && boardPhases(s).includes(s.phase)) keep.push(sh);
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
  s.done = {}; s.vote = null; s.voteUsed = {}; s.banned = {}; s.pos = {}; s.lock = {}; s.bb = null; s.bbPast = [];
  for (const id of s.seat) { s.players[id].ready = false; delete s.players[id].late; }
  say(s, why);
  return s;
}

/* ---------- Bicker Brackets ----------
   A round is one tournament: everyone writes a topic (24 letters at most) and votes for one, or the room gets a random
   topic → the seeds: each player has a few to write and types one a turn, everyone seeing everyone's words as they type
   → the seeds are drawn into a bracket at random (byes fill it up to 4, 8, 16 …) and the bracket shows → match by match,
   each duck walks onto the seed it backs and votes, then the room talks it over (the winner goes on the cloud; a tie is
   a coin flip) → after each bracket round, the bracket again → the final (both seeds silver), the champion (gold), the
   bracket one last time → the podium for ten seconds → the stats, until the room moves on to the next tournament. */
export const PODIUM = 10;   // seconds
export const BB_TOPICS = ['Best snack', 'Worst habit', 'Greatest movie villain', 'Most overrated thing', 'Best superpower', 'Worst chore', 'Best pizza topping', 'Most annoying sound'];
export const TOPIC_MAX = 24, SEED_MAX = 32;
const shuffle = xs => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
const oneLine = (v, n) => String(v || '').replace(/\s+/g, ' ').slice(0, n);
const anyOf = xs => xs[Math.floor(Math.random() * xs.length)];

function startTourney(s, now) {
  for (const id of s.seat) if (s.players[id]) delete s.players[id].late;   // late joiners play from here
  s.bb = { topic: '', topicBy: null, topics: [], tvotes: {}, seeds: [], per: {}, turn: 0, turns: 0, rounds: [], r: 0, m: -1, champ: null };
  s.subs = []; s.drafts = {}; s.qi = 0; s.pos = {}; s.lock = {};
  if (s.options.bbTopic === 'random') { s.bb.topic = anyOf(BB_TOPICS); say(s, `The topic: ${s.bb.topic}.`); return startSeeds(s, now); }
  return enter(s, 'topic', now);
}
/* the topics are in: none → a random one; one → that one; more → a vote */
function endTopics(s, now) {
  for (const id of s.seat) { const d = (s.drafts || {})[id]; if (!s.done[id] && d && d.text.trim()) s.subs.push({ by: id, text: d.text.trim() }); }
  const tops = (s.subs || []).filter(t => s.players[t.by]); s.subs = []; s.drafts = {};
  if (tops.length > 1) { s.bb.topics = shuffle(tops); s.bb.tvotes = {}; return enter(s, 'tvote', now); }
  if (tops.length) { s.bb.topic = tops[0].text; s.bb.topicBy = tops[0].by; say(s, `The topic: ${s.bb.topic}.`); }
  else { s.bb.topic = anyOf(BB_TOPICS); say(s, `No topics written, so a random one: ${s.bb.topic}.`); }
  return startSeeds(s, now);
}
function pickTopic(s, now) {
  const b = s.bb, n = b.topics.map(() => 0);
  for (const [id, i] of Object.entries(b.tvotes || {})) if (s.players[id] && n[i] !== undefined) n[i]++;
  const top = Math.max(...n), best = n.map((k, i) => k === top ? i : -1).filter(i => i >= 0), t = b.topics[anyOf(best)];
  b.topic = t.text; b.topicBy = t.by; b.topicVotes = n;
  say(s, best.length > 1 ? `A tie! A coin flip picked the topic: ${t.text}.` : `The topic: ${t.text}.`);
  return startSeeds(s, now);
}
/* how many seeds each player writes: a total shared out (the extra ones to random players), or so many each */
function startSeeds(s, now) {
  const ids = playing(s), plan = String(s.options.bbSeeds || 't8'), k = Math.max(1, Math.min(32, +plan.slice(1) || 8)), per = {};
  if (plan[0] === 'p') ids.forEach(id => { per[id] = Math.min(k, 8); });
  else shuffle([...ids]).forEach((id, i) => { per[id] = Math.floor(k / ids.length) + (i < k % ids.length ? 1 : 0); });
  s.bb.per = per; s.bb.turns = Math.max(0, ...Object.values(per)); s.bb.turn = 0;
  return s.bb.turns ? seedTurn(s, now) : buildBracket(s, now);
}
function seedTurn(s, now) {
  s.qi++; s.subs = []; s.drafts = {};
  enter(s, 'seeds', now);
  for (const id of s.seat) if (!((s.bb.per[id] || 0) > s.bb.turn)) s.done[id] = true;   // nothing left to write this turn
  return s;
}
/* a typing turn ends: what each player sent (or had typed) becomes a seed */
function endSeedTurn(s, now) {
  const b = s.bb;
  for (const id of s.seat) {
    if ((b.per[id] || 0) <= b.turn) continue;
    const sub = (s.subs || []).find(x => x.by === id), d = (s.drafts || {})[id];
    const text = (sub ? sub.text : !s.done[id] && d ? d.text : '').trim();
    if (text) b.seeds.push({ by: id, text });
  }
  s.subs = []; s.drafts = {};
  return ++b.turn < b.turns ? seedTurn(s, now) : buildBracket(s, now);
}
/* the draw: the seeds in a random order, two to a match; byes (a seed with no one to face goes straight through) are
   spread out so the bracket fills to a power of two */
function buildBracket(s, now) {
  const b = s.bb, n = b.seeds.length;
  if (n < 2) { say(s, `${n ? 'Only one seed' : 'No seeds'}: not enough for a bracket. A new tournament!`); s.round++; return startTourney(s, now); }
  const order = shuffle(b.seeds.map((_, i) => i)), M = 2 ** Math.ceil(Math.log2(n)) / 2, byes = 2 * M - n;
  b.rounds = []; for (let k = M; k >= 1; k /= 2) b.rounds.push(Array.from({ length: k }, () => ({ a: null, b: null })));
  let q = 0;
  b.rounds[0].forEach((m, i) => {
    m.a = order[q++];
    if (Math.floor((i + 1) * byes / M) > Math.floor(i * byes / M)) { m.b = -1; m.w = m.a; } else m.b = order[q++];
  });
  b.rounds[0].forEach((m, i) => { if (m.w != null) feed(b, 0, i); });
  b.r = 0; b.m = -1; b.champ = null;
  return enterBracket(s, now);
}
const feed = (b, r, i) => { const nx = b.rounds[r + 1]; if (nx) nx[i >> 1][i % 2 ? 'b' : 'a'] = b.rounds[r][i].w; };   // the winner moves on
function enterBracket(s, now) {
  s.seat.forEach((id, k) => { if (!s.pos[id]) s.pos[id] = { x: .5, y: (k + 1) / (s.seat.length + 1) }; });
  s.lock = {};
  return enter(s, 'bracket', now);
}
/* the next match of this bracket round; with none left, the bracket shows (or the champion is crowned) */
function nextMatch(s, now) {
  const b = s.bb, round = b.rounds[b.r], i = round.findIndex(m => m.w == null);
  if (i < 0) {
    b.m = -1;
    if (b.r === b.rounds.length - 1) { b.champ = round[0].w; say(s, `"${b.seeds[b.champ].text}" is the champion!`); }
    else b.r++;
    return enterBracket(s, now);
  }
  b.m = i; s.qi++; s.lordTime = s.options.bbSpeed ? 10 : s.options.answerTime;
  s.pos = {}; s.lock = {};
  s.seat.forEach((id, k) => { s.pos[id] = { x: .5, y: (k + 1) / (s.seat.length + 1) }; });   // everyone starts between the two seeds
  return enter(s, 'answer', now);
}
/* the votes are in: the side with more ducks wins (a tie is a coin flip), and its seed moves on */
function endMatch(s) {
  const b = s.bb, m = b.rounds[b.r][b.m], who = {};
  for (const id of playing(s)) { const p = s.pos[id], c = p && p.x >= 0 ? colAt(s, p.x) : -1; if (c >= 0) who[id] = c; }
  const va = Object.values(who).filter(c => c === 0).length, vb = Object.values(who).length - va, tie = va === vb;
  const side = tie ? (Math.random() < .5 ? 0 : 1) : va > vb ? 0 : 1;
  Object.assign(m, { w: side ? m.b : m.a, va, vb, who }, tie ? { coin: true } : {});
  feed(b, b.r, b.m);
  const w = b.seeds[m.w];
  say(s, tie ? `Tied ${va}–${vb}! A coin flip sends "${w.text}" through.` : `"${w.text}" wins ${Math.max(va, vb)}–${Math.min(va, vb)}.`);
  s.lock = { ...who };   // each duck stays on the side it chose while the room talks it over
}
/* a topic or a seed: sent (send) or typed so far (a draft, which everyone sees as it's typed) */
function bbWrite(s, a, now, send) {
  const me = s.players[a.id], seeds = s.phase === 'seeds';
  if (!me || me.late || s.done[a.id] || !(s.phase === 'topic' || (seeds && (s.bb.per[a.id] || 0) > s.bb.turn))) return send ? s : null;
  const text = oneLine(a.text, seeds ? SEED_MAX : TOPIC_MAX);
  if (!send) { s.drafts = { ...(s.drafts || {}), [a.id]: { text } }; return s; }
  s.subs = (s.subs || []).filter(x => x.by !== a.id);
  if (text.trim()) s.subs.push({ by: a.id, text: text.trim() });
  s.done[a.id] = true; return advance(s, now);
}
/* the match a bracket is on, its two seeds, and what a seed's writer is called (hidden in a blind bracket until the
   seed is knocked out or wins it all) */
export const bbMatch = s => s.bb && s.bb.m >= 0 ? s.bb.rounds[s.bb.r][s.bb.m] : null;
export const roundName = (b, r) => { const left = b.rounds.length - r; return left === 1 ? 'The final' : left === 2 ? 'Semifinals' : left === 3 ? 'Quarterfinals' : `Round of ${b.rounds[r].length * 2}`; };
export function seedOut(b, i) {   // knocked out: lost a match
  for (const round of b.rounds) for (const m of round) if (m.w != null && m.b !== -1 && (m.a === i || m.b === i) && m.w !== i) return true;
  return false;
}
export const writerShown = (s, b, i) => !s.options.bbBlind || b.champ === i || seedOut(b, i) || s.phase === 'results';
/* the podium: 1st the champion's writer, 2nd the runner-up's, 3rd both semifinal losers' */
export function podium(b) {
  if (b.champ == null) return null;
  const loser = m => m && m.w != null && m.b !== -1 ? (m.w === m.a ? m.b : m.a) : null, R = b.rounds.length;
  const fin = b.rounds[R - 1][0], semis = R > 1 ? b.rounds[R - 2].map(loser).filter(x => x != null) : [];
  return { first: b.champ, second: loser(fin), third: semis };
}
/* the numbers behind the stats, over a list of finished tournaments */
export function bbStats(list) {
  const per = {}, P = id => (per[id] = per[id] || { wins: 0, losses: 0, own: 0, votes: 0, king: 0, titles: 0 });
  for (const t of list) {
    if (t.champ != null && t.seeds[t.champ]) P(t.seeds[t.champ].by).titles++;
    for (const round of t.rounds || []) for (const m of round) {
      if (m.w == null || m.a == null || m.b == null || m.b === -1) continue;   // (a bye isn't a win)
      const W = t.seeds[m.w], L = t.seeds[m.w === m.a ? m.b : m.a], wSide = m.w === m.a ? 0 : 1, close = Math.abs((m.va || 0) - (m.vb || 0)) === 1;
      if (W) P(W.by).wins++;
      if (L) P(L.by).losses++;
      for (const [id, c] of Object.entries(m.who || {})) {
        P(id).votes++;
        const backed = t.seeds[c ? m.b : m.a]; if (backed && backed.by === id) P(id).own++;
        if (close && c === wSide) P(id).king++;   // their vote decided a one-vote match
      }
    }
  }
  return per;
}

/* a written question: one line of text, or in Would You Rather the two choices (A or B) */
function question(s, a) {
  if (isWyr(s)) {
    const qa = String(a.a || '').trim().slice(0, 100), qb = String(a.b || '').trim().slice(0, 100);
    return qa && qb ? { a: qa, b: qb, text: `Would you rather ${qa} or ${qb}?` } : null;
  }
  const text = String(a.text || '').trim().slice(0, 200);
  return text ? { text } : null;
}

/* Would You Rather: how each question split the room, and each player's sides; round = null for the whole game */
export function wyrStats(s, round = null) {
  const per = {}, questions = [];
  const P = id => (per[id] = per[id] || { answers: 0, written: 0, split: 0, maj: 0, min: 0 });
  for (const h of s.history.filter(h => round === null || h.round === round)) {
    const votes = Object.values(h.a), A = votes.filter(c => c === 0).length, B = votes.filter(c => c === 1).length, n = A + B;
    const split = n ? 1 - Math.abs(A - B) / n : null, major = A > B ? 0 : B > A ? 1 : null;   // split: 1 = an even split
    questions.push({ by: h.by, text: h.text, A, B, split });
    if (split !== null) { P(h.by).written++; P(h.by).split += split; }
    for (const [id, c] of Object.entries(h.a)) { P(id).answers++; if (major !== null) { if (c === major) P(id).maj++; else P(id).min++; } }
  }
  return { per, questions };
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
