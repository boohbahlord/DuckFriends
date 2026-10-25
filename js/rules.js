/* ---------- the rules of Agree or Disagree ----------
   The room's whole state and every change to it, as plain data: reduce(state, action, now) returns the next state. The host
   runs it (alone in a TEST room; for everyone online later), so every player sees the same game.

   A round: everyone submits a question (or none) → each question in turn: answer (move your duck onto a column, end your
   turn) → talk it over → the next question → the round's results → the next round. The rounds go on until the players
   vote to end the game.

   A phase ends when enough players have ended their turn (3 of 4 by default). In submit and answer, reaching that starts
   the catch-up timer (15 s by default) for the rest; a timer, when one is set, ends the phase too.

   Would You Rather is the same with two choices. Bicker Brackets (below) runs a tournament a round; Story Chain (below
   that) writes a paragraph a round. Who is the Quack? has its own rules in quackrules.js. Lawyering (at the end) argues
   each topic out: two attorneys in the middle, the jury walks to the one who convinced them. Hangout has no rounds: the
   room walks around Duck Cabin until it goes back to the lobby (its parts are in hangout/rules.js). */
import { isQuack, QUACK_PHASES, startQuackRound, quackEnd, quackAdvance, quackLeft, quackSkip, wqWord, holdStill, quackMoved, tileCenter } from './quackrules.js';
import { hangStart, hangAction, hangTick, hangJoin, hangLeft } from './hangout/rules.js';
import { inCabin, W as HW, H as HH } from './hangout/layout.js';

export const COLS = ['Strongly disagree', 'Disagree', 'Slightly disagree', 'Neutral', 'Slightly agree', 'Agree', 'Strongly agree'];
export const SHORT = ['−−−', '−−', '−', '0', '+', '++', '+++'];
export const OPTIONS_DEFAULT = {
  order: 'random',      // random | rotate: the order of the round's questions
  share: 0.75,          // how many players must end their turn: .5, .67, .75, 1
  answerTime: 30,       // the Round Lord's default answer time in seconds: 0 (off), 30, 60, 90
  catchUp: 15,          // 0 (off), 15, 30, 45: the rest's time once enough players are done (submit and answer)
  submitTime: 0,        // 0 (off), 60, 90, 120: a time limit on writing questions
  botWait: 5,           // TEST rooms: seconds before computers act
  lowGravity: 0,        // 1: jumps float, slower and higher
  fun: 1,               // the silly commands (lightning, love, kill, hotdog): 1 on, 0 off
  freeRoam: 0,          // 1: no answer lock and no talk-it-over step; ducks roam until the turn ends
  map: 'board',         // board | sky | pixel | carnival | stars | rabbit | ec | cabin (Duck Cabin: Hangout's own, and only Hangout's)
  mode: 'aod',          // the game: aod (Agree or Disagree) | wyr (Would You Rather) | bb (Bicker Brackets) | sc (Story Chain) | quack (Who is the Quack?) | law (Lawyering) | hang (Hangout)
  bbSeeds: 't8',        // Bicker Brackets: t8, t12, t16, t32 seeds shared out, or p1 … p4 seeds for each player
  bbTopic: 'vote',      // vote (everyone writes one, then votes) | random (one of BB_TOPICS)
  bbBlind: 0,           // 1: a seed's writer stays hidden until it is knocked out or wins
  bbTimer: 0,           // seconds a match vote may take (0: no timer, so players can sway each other)
  wqPicker: 'player',   // Who is the Quack?: player (a random player picks the word) | list (the built-in words)
  wqPickTime: 60,       // seconds to pick the word (then what they typed, or a word from the list)
  wqQuacks: 1,          // 1 or 2 (2 only with 6 or more players)
  wqTimer: 0,           // seconds a vote may take (0: none)
  scTime: 0,            // Story Chain: seconds to write a line (0: no timer)
  scVote: 'auto',       // … voting on lines and secret words: 1 | 0 | auto (none with 2 players, so a vote means something)
  lawDef: 'random',     // Lawyering: who picks the defense attorney: random | writer (the topic's writer) | vote (the room)
  lawOff: 'random',     // … and the offense attorney
  lawClose: 60,         // seconds of closing arguments when the jury is split: 30, 60, 120
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
export const isSc = s => s.options.mode === 'sc';
export const isLaw = s => s.options.mode === 'law';
export const isHang = s => s.options.mode === 'hang';
/* a match in Bicker Brackets: seed A on the left, B on the right; Who is the Quack?: vote (left) or more clues; Lawyering:
   the offense (sword) on the left, the defense (shield) on the right, and between them a wider strip with the attorneys'
   circle */
export const twoSided = s => isWyr(s) || isBb(s) || isLaw(s) || (isQuack(s) && s.phase === 'choice');
export const LAW_MID = [.42, .58];
export const colAt = (s, x) => isLaw(s) ? (x < LAW_MID[0] ? 0 : x > LAW_MID[1] ? 1 : -1) : twoSided(s) ? (x < .46 ? 0 : x > .54 ? 1 : -1) : colOf(x);
export const colXAt = (s, c) => twoSided(s) ? [.25, .75][c] ?? .5 : colX(c);
export const colBoundsAt = (s, c) => isLaw(s) ? ([[.03, .4], [.6, .97]][c] || [.44, .56]) : twoSided(s) ? ([[.03, .44], [.56, .97]][c] || [.47, .53]) : colBounds(c);
export const startX = s => twoSided(s) || isSc(s) ? .5 : colX(3);   // where ducks start: Neutral, or the OR strip
/* the phases with ducks on the board (Bicker Brackets: its stats fill the screen; ducks walk over the bracket instead;
   Story Chain: ducks walk up and down the story) */
export const boardPhases = s => isHang(s) ? ['hang'] : isBb(s) ? ['answer', 'tie', 'discuss', 'bracket'] : isSc(s) ? SC_BOARD : isQuack(s) ? ['clue', 'choice', 'accuse', 'reveal'] : isLaw(s) ? ['answer', 'discuss'] : ['answer', 'discuss', 'results'];
const humanIds = s => s.seat.filter(id => !s.players[id].bot);
/* who plays now: a player who joined in the middle of a turn they can't take part in walks around until the next one */
export const playing = s => s.seat.filter(id => !(s.players[id] || {}).late);
export const seatLate = s => { for (const id of s.seat) if (s.players[id]) delete s.players[id].late; };   // they play from here
export const needed = s => Math.max(1, Math.ceil(playing(s).length * s.options.share - 1e-9));
/* one turn: the writing stage, one question (its vote and talk), or the stat screen */
/* the turn a back-to-lobby (or skip) vote belongs to; Hangout has no turns, so a couple of minutes instead */
export const voteKey = (s, now) => isHang(s) ? 'hang' + Math.floor(now / 120000) : turnKey(s);
export const turnKey = s => s.phase === 'submit' ? `w${s.round}` : ['answer', 'discuss'].includes(s.phase) ? `q${s.round}.${s.qi}` : s.phase === 'write' && s.sc ? `write${s.round}.${s.sc.turn}` : `${s.phase}${s.round}.${s.qi}`;
export const VOTE_TIME = 30;   // seconds a kick or back-to-lobby vote stays open
export const SHOT_SPEED = .22;  // the handgun special's bullet: board widths a second (slow enough to see, and to jump over)
/* the thrown dagger: across the board at DAGGER_SPEED (board widths a second) while its height (in duck sizes) rises
   from the beak and falls: z = DAGGER_Z + DAGGER_UP·t − DAGGER_G·t²/2; it hits ducks only at their height, then falls
   on down off the screen */
export const DAGGER_SPEED = .45, DAGGER_Z = .45, DAGGER_UP = 1.2, DAGGER_G = 2.2, DAGGER_LIFE = 4500;   // (it never flies over a duck's head: everything in its way is hit)
export const daggerZ = t => DAGGER_Z + DAGGER_UP * t - DAGGER_G * t * t / 2;   // (t in seconds)
const PRESS = ['coffee', 'watergun', 'hotdog', 'confgun', 'handgun', 'dagger', 'sound', 'trombone', 'confetti'];   // the items, used with their number key
export const WEAPONS = ['handgun', 'dagger'];   // aimed (with the mouse), and kept out with Shift and their key
const EFFECTS = ['zap', 'flames', 'hearts', 'poison', 'notes', 'loserx', 'ducklings', 'disco'];   // the effects, shown around a duck
/* an aim from the player: a direction on the board (x, y), about one board width long on their screen */
const aimOf = (a, face) => { const ax = Math.max(-3, Math.min(3, +a.ax || 0)), ay = Math.max(-3, Math.min(3, +a.ay || 0)); return Math.hypot(ax, ay) > .05 ? [ax, ay] : [face, 0]; };
/* is this special on one of the duck's number keys? (a duck from before the keys had one special) */
const onKeys = (d, id) => !!d && (Array.isArray(d.keys) ? d.keys.slice(0, 10).includes(id) : d.special === id);
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
  if (s.phase === 'write') return +s.options.scTime || 0;
  if (['submit', 'topic', 'seeds'].includes(s.phase)) return s.options.submitTime;
  if (s.phase === 'answer') return s.lordTime;
  if (s.phase === 'podium') return PODIUM;
  if (s.phase === 'wqpick') return s.options.wqPickTime;
  if (s.phase === 'choice' || s.phase === 'accuse') return s.options.wqTimer;
  return 0;
}
export function enter(s, phase, now) {
  const was = STAGE[s.phase];
  s.phase = phase; s.at = now; s.done = {}; s.catchEnds = 0;
  countTurn(s, was);
  if (phase === 'submit') s.drafts = {};
  if (phase === 'submit' || phase === 'results') seatLate(s);   // late joiners play from here
  const lim = phaseLimit(s); s.ends = lim ? now + lim * 1000 : 0;
  return s;
}
/* the room's log (chat and notices); every line has a running number n, so new lines are easy to spot */
const logLine = (s, line) => { s.logN = (s.logN || 0) + 1; s.log.push({ n: s.logN, t: Date.now(), ...line }); if (s.log.length > 200) s.log.shift(); };
export const say = (s, text) => logLine(s, { sys: true, text });

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
  seatLate(s);
  const q = s.qs[s.qi];
  s.lordTime = s.options.answerOff ? 0 : q.time;   // (forgame can turn the answer timer off for the rest of the game)
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
  if (isQuack(s)) return enter(s, 'results', now);
  if (isBb(s)) { const { topic, topicBy, seeds, rounds, champ } = s.bb; s.bbPast = [...(s.bbPast || []), { round: s.round, topic, topicBy, seeds, rounds, champ }]; return enter(s, 'results', now); }   // the tournament joins the game's
  if (isLaw(s)) { s.law = null; s.lock = {}; return enter(s, 'results', now); }   // (the stats fill the screen)
  // each duck stays where it was, in the column it was locked into on the last question; a duck that never stood on
  // the board (it joined late) starts in Neutral
  s.lock = {};
  const off = [];
  for (const id of s.seat) { const p = s.pos[id], c = p && p.x >= 0 ? colAt(s, p.x) : -1; if (c >= 0) s.lock[id] = c; else { s.lock[id] = isWyr(s) ? -1 : 3; off.push(id); } }
  off.forEach((id, k) => { s.pos[id] = { x: startX(s), y: (k + 1) / (off.length + 1) }; });
  return enter(s, 'results', now);
}

/* what ends a phase: enough players done (submit and answer then wait out the catch-up timer), or its timer */
function advance(s, now, force = false) {
  if (isSc(s) && SC_PHASES.includes(s.phase)) return scAdvance(s, now, force);
  if (isQuack(s) && QUACK_PHASES.includes(s.phase)) return quackAdvance(s, now, force);
  if (isHang(s)) return s;   // (no turns: the cabin stays open until the room goes back to the lobby)
  const on = playing(s), n = on.length, d = on.filter(id => s.done[id]).length, all = d >= n, enough = d >= needed(s);
  if (isLaw(s) && s.phase === 'answer') return lawCheck(s, now, force);   // a case waits for the jury (and closing arguments)
  const sway = isBb(s) && s.phase === 'answer';   // a bracket match waits for every vote (or its own timer, if the host set one)
  const timed = ['submit', 'answer', 'topic', 'tvote', 'seeds', 'counsel'].includes(s.phase) && !sway;
  const timeUp = s.ends && now >= s.ends;
  if (timed && enough && !all && s.options.catchUp && !s.catchEnds) s.catchEnds = now + s.options.catchUp * 1000;
  const go = force || all || timeUp || (!sway && enough && (!timed || !s.options.catchUp || now >= s.catchEnds));
  if (!go) return s;
  switch (s.phase) {
    case 'countdown': return s;
    case 'submit': {
      /* whatever someone had typed goes in as their question when time runs out (Send or "Don't submit one" ends it early) */
      for (const id of s.seat) { const d = (s.drafts || {})[id]; if (!s.done[id] && d && d.text) (s.subs = s.subs || []).push({ by: id, ...d }); }
      delete s.drafts;
      const subs = {}; for (const q of s.subs || []) subs[q.by] = q;
      s.qs = orderQuestions(s, subs).map(id => subs[id]); s.qi = 0; delete s.subs;
      if (!s.qs.length) { say(s, isLaw(s) ? 'No topics this round.' : 'No questions this round.'); s.round++; s.subs = []; return enter(s, 'submit', now); }
      return isLaw(s) ? startCase(s, now) : startQuestion(s, now);
    }
    case 'topic': return endTopics(s, now);
    case 'tvote': return pickTopic(s, now);
    case 'seeds': return endSeedTurn(s, now);
    case 'counsel': return endCounsel(s, now);
    case 'bracket': return s.bb.champ != null ? enter(s, 'podium', now) : nextMatch(s, now);
    case 'podium': return startResults(s, now);
    case 'tie': return settleTie(s, now);
    case 'answer':
      if (isBb(s)) return endMatch(s, now) ? (s.options.freeRoam ? nextMatch(s, now) : enter(s, 'discuss', now)) : enter(s, 'tie', now);
      recordAnswers(s);
      if (!s.options.freeRoam) return enter(s, 'discuss', now);
      if (++s.qi < s.qs.length) return startQuestion(s, now);   // free roam: straight to the next question
      return startResults(s, now);
    case 'discuss':
      if (isBb(s)) return nextMatch(s, now);
      if (isLaw(s)) return nextCase(s, now);
      if (++s.qi < s.qs.length) return startQuestion(s, now);
      return startResults(s, now);
    case 'results': s.round++; s.subs = []; s.qs = []; return isBb(s) ? startTourney(s, now) : isQuack(s) ? startQuackRound(s, now) : enter(s, 'submit', now);
  }
  return s;
}

/* someone joins a game in progress and plays at once: they vote on the question, the match or the case, write a line
   in Story Chain, get a tile in Who is the Quack?. While the room talks a turn over (or votes out a Quack) they walk
   around and chat, and play from the next turn */
function seatNewcomer(s, id) {
  const me = s.players[id], ph = s.phase;
  if (isHang(s)) { if (ph === 'hang') hangJoin(s, id); return; }   // Hangout: at the front door, at once
  if (boardPhases(s).includes(ph)) s.pos[id] = { x: startX(s), y: Math.random() };
  if (isQuack(s)) {   // (a tile mid-vote would move everyone's tiles under their feet: they get one at the next lap)
    const w = s.wq;
    if (!w || w.result || !['wqpick', 'clue', 'choice'].includes(ph)) { if (QUACK_PHASES.includes(ph)) me.late = true; return; }
    w.ids.push(id);
    if (ph === 'clue') s.pos[id] = { ...tileCenter(s, w.ids.length - 1, .62), j: 0 };
    return;
  }
  if (isSc(s)) {   // a line of their own at the end of this paragraph, with a game word
    const sc = s.sc, n = scZones(s, 'write').length;
    if (ph === 'write' && sc && !sc.order.includes(id)) {
      const used = new Set([...Object.values(sc.words), ...Object.values(sc.assign).map(x => x.word)].map(x => String(x).toLowerCase()));
      sc.order.push(id); sc.assign[id] = { word: anyOf(SC_WORDS.filter(x => !used.has(x))) || anyOf(SC_WORDS), by: null };
      s.pos[id] = { x: .1 + Math.random() * .8, y: (n - .98) / n };   // (just over the line being typed, like everyone)
    }
    if (ph === 'results') s.pos[id] = { x: .1 + Math.random() * .8, y: .125 };
    return;
  }
  if (ph === 'discuss') { me.late = true; return; }
  if (ph === 'seeds') s.done[id] = true;   // (the seeds were shared out: they vote on them)
  if (ph === 'counsel') s.done[id] = counselDone(s, id);
  if (ph === 'answer' && isLaw(s)) { const top = Math.random() < .5; s.pos[id] = { x: .45 + .1 * Math.random(), y: top ? .04 : .96 }; }   // with the jury, above or below the circle
  if (ph === 'results' && !isBb(s) && !isLaw(s)) s.lock[id] = isWyr(s) ? -1 : 3;   // (like a duck that never stood on the board)
}

/* ---------- the actions ---------- */
export function reduce(state, a, now = Date.now()) {
  const s = clone(state), P = s.players, me = P[a.id], host = a.id === s.hostId, boss = !!me && isSudo(s, a.id);   // boss: the host, or anyone in sudo
  switch (a.t) {
    case 'join': {
      if (P[a.p.id]) { P[a.p.id] = { ...P[a.p.id], ...a.p }; return s; }
      if (s.seat.length >= s.max) return s;
      if ((s.banned || {})[a.p.id] || (a.p.acct && (s.banned || {})['acct:' + a.p.acct])) return state;   // voted out until the lobby
      P[a.p.id] = { ...a.p, ready: false, joined: now }; s.seat.push(a.p.id);
      if (!['lobby', 'over', 'countdown'].includes(s.phase)) seatNewcomer(s, a.p.id);
      say(s, `${a.p.name} joined.`); return s;
    }
    case 'leave': {
      if (!me) return s;
      say(s, `${me.name} left.`);
      reopenMatch(s, a.id); if (isHang(s)) hangLeft(s, a.id);
      delete P[a.id]; s.seat = s.seat.filter(id => id !== a.id); delete s.pos[a.id]; delete s.done[a.id];
      if (host) s.hostId = humanIds(s)[0] || null;
      if (s.vote) settleVote(s, now);
      if (isQuack(s)) quackLeft(s, now);
      return s.phase === 'lobby' || s.phase === 'over' ? s : advance(s, now);
    }
    case 'look': if (me) Object.assign(me, a.look); return s;
    case 'ready': if (me && (s.phase === 'lobby' || s.phase === 'over')) me.ready = a.v ?? !me.ready; return s;
    case 'roomName': { const n = String(a.name || '').replace(/\s+/g, ' ').trim().slice(0, 32); if (boss && n) s.name = n; return s; }
    case 'options': if (boss && (s.phase === 'lobby' || s.phase === 'over')) {
      Object.assign(s.options, a.options); if (a.max) s.max = Math.max(s.seat.length, a.max);
      if (isHang(s)) s.options.map = 'cabin'; else if (s.options.map === 'cabin') s.options.map = 'board';   // Hangout and Duck Cabin are one
    } return s;
    case 'kick': {   // the host (or sudo) removes a player at once, no vote; a person stays out until the room goes back to the lobby
      const p = P[a.who]; if (!may(s, a.id, 'cankick') || !p || a.who === s.hostId || a.who === a.id) return state;
      if (!p.bot) { s.banned = { ...(s.banned || {}), [a.who]: true, ...(p.acct ? { ['acct:' + p.acct]: true } : {}) }; say(s, `${me.name} removed ${p.name} from the room.`); }
      reopenMatch(s, a.who); if (isHang(s)) hangLeft(s, a.who);
      delete P[a.who]; s.seat = s.seat.filter(id => id !== a.who); delete s.pos[a.who]; delete s.done[a.who];
      if (s.vote) settleVote(s, now);
      return s.phase === 'lobby' || s.phase === 'over' || s.phase === 'countdown' ? s : advance(s, now);
    }
    case 'start':
      if (!boss || !(s.phase === 'lobby' || s.phase === 'over')) return s;
      if ((isQuack(s) || isLaw(s)) && s.seat.length < 3) return state;   // (the lobby says it needs 3)
      if (isHang(s) !== (s.options.map === 'cabin')) s.options.map = isHang(s) ? 'cabin' : 'board';   // (Hangout and Duck Cabin are one)
      s.phase = 'countdown'; s.at = now; s.ends = now + COUNTDOWN * 1000; return s;
    case 'cancel': if (boss && s.phase === 'countdown') { s.phase = 'lobby'; s.ends = 0; } return s;
    case 'submit': {
      if (isBb(s)) return bbWrite(s, a, now, true);
      if (isSc(s)) return scWrite(s, a, now, true) || state;
      if (!me || s.phase !== 'submit' || s.done[a.id]) return s;
      const q = question(s, a);
      s.subs = (s.subs || []).filter(x => x.by !== a.id);
      if (q) s.subs.push({ by: a.id, ...q, time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime });
      s.done[a.id] = true; return advance(s, now);
    }
    case 'draft': {   // what a player has typed so far (kept by the host, sent in for them at the end)
      if (isBb(s)) return bbWrite(s, a, now, false) || state;
      if (isSc(s)) return scWrite(s, a, now, false) || state;
      if (!me || s.phase !== 'submit' || s.done[a.id]) return state;
      s.drafts = { ...(s.drafts || {}), [a.id]: { ...(question(s, a) || { text: '' }), time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime } };
      return s;
    }
    case 'move': {   // x, y on the board; j = when the current jump started (0 = on the ground)
      if (!me || !s.pos[a.id]) return state;
      if (!boardPhases(s).includes(s.phase)) return state;
      const was = s.pos[a.id], j = +a.j || 0;
      if (holdStill(s, a.id, now)) return state;   // Who is the Quack?: the last duck plays dead for a moment
      let x = Math.max(0, Math.min(1, +a.x || 0)), y = Math.max(0, Math.min(1, +a.y || 0));
      // an ended turn keeps its answer (jumping still works; reset duck may move it inside the same column)
      if (s.phase === 'answer' && s.done[a.id] && !s.options.freeRoam && !isLaw(s) && !(a.reset && colAt(s, x) === colAt(s, was.x))) { x = was.x; y = was.y; }   // (a juror may walk over and change their vote)
      if (s.phase === 'answer' && isLaw(s) && isCounsel(s, a.id)) { const [lo, hi] = colBoundsAt(s, -1); x = Math.max(lo, Math.min(hi, x)); }   // the attorneys argue from the circle
      if (isQuack(s) && ['choice', 'accuse'].includes(s.phase) && s.done[a.id]) { x = was.x; y = was.y; }   // a vote holds its spot
      if (isSc(s) && SC_VOTES.includes(s.phase) && s.done[a.id]) { x = was.x; y = was.y; }   // a story vote holds its spot
      if (s.phase !== 'answer' && s.phase !== 'bracket' && !isSc(s) && !me.late && !isQuack(s) && !isHang(s)) {   // after answering: inside your own column; no answer, no board (late joiners roam; over the bracket anyone does)
        const c = s.lock[a.id];
        if (c === undefined) { x = was.x; y = was.y; } else { const [lo, hi] = colBoundsAt(s, c); x = Math.max(lo, Math.min(hi, x)); }
      }
      const dj = j && +a.dj > j ? +a.dj : 0;   // a double jump: when the second jump began
      const w = WEAPONS.includes(a.w) && onKeys(me.duck, a.w) && s.options.fun ? a.w : '', [ax, ay] = w ? aimOf(a, 1) : [0, 0];   // a weapon kept out, and where it aims
      const hz = v => Math.max(-400, Math.min(1200, Math.round(+v || 0)));   // Hangout: z, the height of its feet; b, where its jump began (world px)
      s.pos[a.id] = { x, y, j, q: /^[lrud]$/.test(a.q) ? a.q : '', sp: !!a.sp, ...(j && a.lj ? { lj: true } : {}), ...(dj ? { dj } : {}), ...(w ? { w, ax: +ax.toFixed(3), ay: +ay.toFixed(3) } : {}), ...(isHang(s) ? { z: hz(a.z), b: hz(a.b), ...(j && +a.tb > 0 ? { tb: Math.min(3.5, +a.tb) } : {}) } : {}) };   // q: squashed against l/r/u/d; sp: sprinting; lj: a long jump; tb: a trampoline bounce's height
      quackMoved(s, a.id);   // (Who is the Quack?: first onto the Quack's tile)
      if (me.dead && (x !== was.x || y !== was.y)) delete me.dead;
      return s;
    }
    case 'end': {   // end your turn (answer, discuss) or be ready for the next round (results)
      if (isQuack(s) && QUACK_PHASES.includes(s.phase)) return quackEnd(s, a, now) || state;
      if (isSc(s)) return scVote(s, a, now) || state;
      if (isHang(s)) return state;   // (Hangout's button is its own action, below)
      if (!me || me.late || ![...boardPhases(s), 'results'].includes(s.phase) || s.phase === 'tie') return s;   // (a tie is settled with tieVote)
      if (s.phase === 'answer' && !(s.pos[a.id] && s.pos[a.id].x >= 0 && colAt(s, s.pos[a.id].x) >= 0)) return s;   // stand on a column (a tile) first
      if (s.phase === 'answer' && now < s.at + VOTE_GRACE * 1000) return state;       // not in the first seconds
      if (s.phase === 'answer' && isLaw(s)) return lawVote(s, a, now) || state;
      s.done[a.id] = a.v ?? !s.done[a.id];
      if (s.phase === 'answer' && !s.options.freeRoam) s.done[a.id] = true;   // free roam: ready can be taken back
      return advance(s, now);
    }
    case 'voteReview':
      if (!me || s.phase !== 'results' || s.round < 1 || s.reviewVotes[a.id]) return s;
      s.reviewVotes[a.id] = true;
      if (s.seat.filter(id => s.reviewVotes[id]).length >= needed(s)) s.review = true;
      return s;
    case 'toLobby': if (boss && isHang(s) && s.phase === 'hang') return backToLobby(s, `${me.name} took everyone back to the lobby.`);   // (Hangout: the host ends it whenever)
      if (boss && s.phase === 'over') { s.phase = 'lobby'; s.round = 0; s.history = []; s.jumps = {}; for (const id of s.seat) P[id].ready = false; } return s;
    case 'fx': {   // the silly commands, seen by everyone on the board
      const who = (a.who || []).filter(id => P[id]);
      if (!me || !s.options.fun || denied(s, a.id, 'nofun') || !who.length || !['lightning', 'love', 'kill', 'hotdog', 'fire'].includes(a.kind)) return state;
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
    case 'use': {   // an item on the board, seen by everyone; the handgun's bullet or the dagger then flies the way it was aimed
      const sp = a.what || (me && me.duck && me.duck.special), p = s.pos[a.id];
      if (!me || !p || p.x < 0 || !boardPhases(s).includes(s.phase) || !PRESS.includes(sp) || !onKeys(me.duck, sp)) return state;
      if (WEAPONS.includes(sp) && !s.options.fun) return state;   // the silly-commands switch covers them
      const k = `${a.id} ${sp}`;   // (each item waits on its own)
      if (now - ((s.lastUse || {})[k] || 0) < ({ handgun: 3000, dagger: 2000, confetti: 15000 }[sp] || 1500)) return state;
      s.lastUse = { ...(s.lastUse || {}), [k]: now };
      const face = a.face < 0 ? -1 : 1, aim = WEAPONS.includes(sp) ? aimOf(a, face) : null;
      s.fxN = (s.fxN || 0) + 1; s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, kind: 'use', what: sp, by: a.id, who: [a.id], face, t: now, ...(aim ? { ax: +aim[0].toFixed(3), ay: +aim[1].toFixed(3) } : {}) }];
      if (aim) {
        const v = sp === 'dagger' ? DAGGER_SPEED : SHOT_SPEED, hang = isHang(s) ? { hz: Math.round(+p.z || 0), hin: inCabin(p.x * HW, p.y * HH) ? 1 : 0 } : {};   // (Hangout: the height it flies at, and which side of the cabin's walls)
        s.shots = [...(s.shots || []), { n: s.fxN, by: a.id, k: sp, x0: p.x, y0: p.y, vx: +(aim[0] * v).toFixed(4), vy: +(aim[1] * v).toFixed(4), t: now, lx: p.x, ly: p.y, ...hang }];
      }
      return s;
    }
    case 'aura': {   // an effect around a duck's head, seen by everyone: 5 seconds, or kept on (keep) until kept off
      const what = a.what;
      if (!me || !EFFECTS.includes(what) || !onKeys(me.duck, what)) return state;
      const cur = (s.aura || {})[a.id] || {}, next = {};
      for (const [k, u] of Object.entries(cur)) if (!u || u > now) next[k] = u;   // (0: kept on)
      if (a.keep) { if (cur[what] === 0) delete next[what]; else next[what] = 0; }
      else next[what] = now + 5000;   // (a kept one goes on for 5 more seconds)
      s.aura = { ...(s.aura || {}), [a.id]: next };
      return s;
    }
    case 'tieVote': {   // Bicker Brackets, a tied match: vote again, or a coin toss (it can be changed until everyone has chosen)
      if (!me || me.late || s.phase !== 'tie' || !['again', 'coin'].includes(a.v)) return state;
      s.bb.tie = { ...s.bb.tie, votes: { ...(s.bb.tie || {}).votes, [a.id]: a.v } }; s.done[a.id] = true;
      return advance(s, now);
    }
    case 'wqWord': return wqWord(s, a, now) || state;   // Who is the Quack?: the secret word, from its picker
    case 'hang': return me && isHang(s) && s.phase === 'hang' && hangAction(s, a, now) ? s : state;   // Hangout: an activity (k) did something
    case 'counsel': {   // Lawyering: my pick (as the writer) or my vote (the room) for an attorney; it can change until the picking ends
      const L = s.law, how = L && L.how && L.how[a.role];
      if (!me || me.late || s.phase !== 'counsel' || !how || (how === 'writer' && a.id !== s.qs[s.qi].by) || !counselOk(s, a.role, a.who)) return state;
      L.picks[a.role] = { ...L.picks[a.role], [a.id]: a.who };
      s.done[a.id] = counselDone(s, a.id);
      return advance(s, now);
    }
    case 'giveUp': {   // Lawyering: an attorney who isn't ahead in closing arguments gives the case to the other side
      const L = s.law;
      if (!me || !isLaw(s) || s.phase !== 'answer' || !L || !L.close || !canGiveUp(s, a.id)) return state;
      L.gave = a.id; say(s, `${me.name} gave up the case.`);
      return verdict(s, a.id === L.off ? 1 : 0, now);
    }
    case 'pick': {   // Bicker Brackets: my vote for a topic (it can be changed until the vote ends)
      if (!me || me.late || s.phase !== 'tvote' || !Number.isInteger(a.i) || !s.bb.topics[a.i]) return state;
      s.bb.tvotes = { ...s.bb.tvotes, [a.id]: a.i }; s.done[a.id] = true;
      return advance(s, now);
    }
    case 'voteStart': {   // a vote to kick a player, or to go back to the lobby; the one who starts it votes yes
      if (!me || me.bot || ['lobby', 'countdown', 'over'].includes(s.phase)) return state;
      if (s.vote) return state;
      const used = (s.voteUsed || {})[a.id] || {}, tk = voteKey(s, now);
      if (a.kind === 'kick') {
        if (!P[a.target] || a.target === a.id) return state;
        if (humanIds(s).length <= 2) return state;   // two people: no kick vote (it would pass on the starter's vote alone)
        if (used.kick !== undefined && s.round - used.kick < 2) return state;   // one kick vote every two rounds
      } else if (a.kind === 'lobby' || a.kind === 'skip' || a.kind === 'turn') {
        if (a.kind === 'turn' && isBb(s)) return state;   // (not in Bicker Brackets)
        if (a.kind !== 'lobby' && isHang(s)) return state;   // (Hangout has no turns or rounds to skip)
        if (used[a.kind] === tk) return state;   // one back-to-lobby (or skip) vote a turn
      } else return state;
      s.voteN = (s.voteN || 0) + 1;
      s.vote = { n: s.voteN, kind: a.kind, target: a.kind === 'kick' ? a.target : null, by: a.id, yes: { [a.id]: true }, no: {}, ends: now + VOTE_TIME * 1000 };
      s.voteUsed = { ...(s.voteUsed || {}), [a.id]: { ...used, [a.kind]: a.kind === 'kick' ? s.round : tk } };
      say(s, a.kind === 'kick' ? `${me.name} started a vote to kick ${P[a.target].name}.` : a.kind === 'skip' ? `${me.name} started a vote to skip this round.` : a.kind === 'turn' ? `${me.name} started a vote to skip this turn.` : `${me.name} started a vote to go back to the lobby.`);
      return settleVote(s, now);
    }
    case 'voteCast': {
      const v = s.vote; if (!me || !v || v.n !== a.n) return state;
      if (!voteNeeds(s).voters.includes(a.id)) return state;
      if (a.v) { v.yes[a.id] = true; delete v.no[a.id]; } else { v.no[a.id] = true; delete v.yes[a.id]; }
      return settleVote(s, now);
    }
    case 'chat': {   // a message; from the command line (send) it carries the command (cmd) and may be a file
      if (!me) return s;
      if (denied(s, a.id, 'nochat') || (a.cmd && (denied(s, a.id, 'nocmd') || denied(s, a.id, 'nosend')))) return state;
      if (now - ((s.lastChat || {})[a.id] || 0) < slowMs(s, a.id)) return state;   // slow: one message every 15 s (slow30: 30 s)
      const text = String(a.text || '').trim().slice(0, a.cmd ? 2000 : 500); if (!text) return state;
      if (a.to && !P[a.to]) return state;
      s.lastChat = { ...(s.lastChat || {}), [a.id]: now };
      logLine(s, { from: a.id, to: a.to || null, text, ...(a.cmd ? { cmd: String(a.cmd).slice(0, 200) } : {}), ...(a.file ? { file: String(a.file).slice(0, 40), ...(a.pub ? { pub: true } : {}), ...(a.grp && groupsOf0(s)[a.grp] ? { grp: String(a.grp) } : {}) } : {}) }); return s;
    }
    case 'hostMoved': {   // (only the host's own browser applies it) the host went quiet and this player took over: the old host keeps sudo
      if (!me || a.id === s.hostId) return state;
      const old = s.hostId; s.hostId = a.id;
      if (old && P[old]) {
        const g = groupsOf0(s).sudo; if (!g.members.includes(old)) g.members = [...g.members, old];
        say(s, `${P[old].name} went quiet, so ${me.name} hosts now. ${P[old].name} keeps sudo.`);
      }
      return s;
    }
    case 'usermod': {   // sudo: put a player in groups (add), take them out (remove), or give them exactly these (set)
      const G = groupsOf0(s), list = (a.groups || []).map(String).filter(g => G[g]);
      if (!me || !isSudo(s, a.id) || !P[a.target] || !list.length || !['add', 'remove', 'set'].includes(a.mode)) return state;
      for (const [name, g] of Object.entries(G)) {
        const has = g.members.includes(a.target);
        let want = a.mode === 'set' ? list.includes(name) : list.includes(name) ? a.mode === 'add' : has;
        if (name === 'sudo' && a.target === s.hostId) want = false;   // (the host is sudo without being listed, always)
        if (want !== has) g.members = want ? [...g.members, a.target] : g.members.filter(x => x !== a.target);
      }
      say(s, `${me.name} changed ${P[a.target].name}'s groups: ${groupsOf(s, a.target).join(', ') || 'none'}.`);
      return s;
    }
    case 'groupadd': {   // sudo: a new group with any of the restrictions
      const name = String(a.name || '').toLowerCase(), G = groupsOf0(s);
      if (!me || !isSudo(s, a.id) || !/^[a-z][a-z0-9_-]{0,19}$/.test(name) || G[name] || name.startsWith('superuser-') || Object.keys(G).length >= 20) return state;
      G[name] = { perms: [...new Set((a.perms || []).filter(permOk))], members: [] };
      say(s, `${me.name} made the group ${name}${G[name].perms.length ? ` (${G[name].perms.join(', ')})` : ''}.`);
      return s;
    }
    case 'groupdel': {
      const G = groupsOf0(s);
      if (!me || !isSudo(s, a.id) || !G[a.name] || ['sudo', 'dumbasses'].includes(a.name)) return state;
      delete G[a.name]; say(s, `${me.name} removed the group ${a.name}.`); return s;
    }
    case 'groupmod': {   // sudo: rename a group (newName), or set its perms (perms); not sudo, dumbasses or a superuser group
      const G = groupsOf0(s), g = G[a.name], to = String(a.newName || '').toLowerCase();
      if (!me || !isSudo(s, a.id) || !g || ['sudo', 'dumbasses'].includes(a.name)) return state;
      if (a.newName !== undefined) {
        if (!/^[a-z][a-z0-9_-]{0,19}$/.test(to) || G[to] || to.startsWith('superuser-')) return state;
        delete G[a.name]; G[to] = g; say(s, `${me.name} renamed the group ${a.name} to ${to}.`); return s;
      }
      if (!Array.isArray(a.perms)) return state;
      g.perms = [...new Set(a.perms.filter(permOk))]; say(s, `${me.name} set the group ${a.name}'s perms: ${g.perms.join(', ') || 'none'}.`); return s;
    }
    case 'forgame': return forgame(s, a, now) || state;
    case 'skip': {   // the host (or sudo): end the current stage now, as if everyone were done
      if (!may(s, a.id, 'canskip') || ['lobby', 'over'].includes(s.phase) || s.phase === 'hang') return state;
      say(s, `${me.name} skipped ahead.`);
      if (s.phase === 'countdown') { s.ends = now; return s; }   // the next tick starts the game
      return advance(s, now, true);
    }
    case 'music': {   // (the host's own browser) the room's songs: the one now and the one after it, so everyone hears the same (music.js)
      if (!host) return state;
      const song = e => e && typeof e.n === 'string' && Number.isFinite(e.at) ? { n: e.n.slice(0, 60), at: +e.at, seed: (+e.seed || 0) >>> 0 } : null;
      s.music = { a: song(a.a), b: song(a.b), off: (s.music && s.music.off) || [] }; return s;
    }
    case 'songs': {   // the host, sudo or cansettings: songs taken off the room's list (off) or put back (on); all: 'on' puts every song back
      if (!may(s, a.id, 'cansettings')) return state;
      const off = new Set((s.music && s.music.off) || []), names = v => (Array.isArray(v) ? v : []).filter(n => typeof n === 'string').map(n => n.slice(0, 60));
      if (a.all === 'on') off.clear();
      for (const n of names(a.off)) off.add(n);
      for (const n of names(a.on)) off.delete(n);
      s.music = { a: null, b: null, ...(s.music || {}), off: [...off].slice(0, 60) }; return s;
    }
    case 'tick': {   // the host's heartbeat; the same state comes back when nothing changed, so nothing redraws
      if (s.phase === 'countdown' && now >= s.ends) {
        s.startedAt = now; s.round = 0; s.history = []; s.subs = []; s.jumps = {}; s.bbPast = []; s.wqPast = []; s.wqScore = { quack: 0, room: 0 }; s.wqPickers = []; for (const id of s.seat) P[id].ready = false;
        if (isSc(s)) { s.sc = { stories: [] }; return startStory(s, now, true); }
        if (isHang(s)) { hangStart(s, now); return enter(s, 'hang', now); }
        return isBb(s) ? startTourney(s, now) : isQuack(s) ? startQuackRound(s, now) : enter(s, 'submit', now);
      }
      if (isQuack(s) && QUACK_PHASES.includes(s.phase) && s.wq && !s.hidden) { say(s, 'A new host took over, so a new secret word.'); return startQuackRound(s, now); }   // (the old host's Secret Cards can't be opened)
      if (s.phase === 'lobby' || s.phase === 'over' || s.phase === 'countdown') return state;
      if (s.vote && now >= s.vote.ends) { say(s, 'The vote ran out of time.'); s.vote = null; return s; }
      const shots = moveShots(s, now), hung = isHang(s) && s.phase === 'hang' && hangTick(s, now);
      const sig = () => [s.phase, s.qi, s.catchEnds, s.round, s.at].join(), was = sig();
      advance(s, now);
      return sig() === was && !shots && !hung ? state : s;
    }
  }
  return s;
}

/* the safety net: an action that throws is skipped (the room keeps going) and the room's log says so, once a minute at
   most, so a broken action can't stop a game */
export function safeReduce(state, a, now = Date.now()) {
  try { return reduce(state, a, now); } catch (e) {
    console.error('DuckFriends: an action failed and was skipped', a && a.t, e);
    if (state.errAt && now - state.errAt < 60000) return state;
    const s = clone(state); s.errAt = now;
    say(s, `Something went wrong (${String(a && a.t).slice(0, 20)}), so it was skipped. If the game seems stuck, the host can type skip in the command line.`);
    return s;
  }
}

/* ---------- groups, permissions and forgame (the command line's sudo commands) ----------
   sudo: may run usermod, groupadd, groupdel and forgame; the host is always in it. dumbasses: no silly commands, and one
   chat message every 15 seconds. A group made with groupadd takes any of: nocmd (no command line), nochat (no text
   chat), nofun (no silly commands), slow (one message every 15 seconds). */
export const GROUP_PERMS = ['nocmd', 'nochat', 'nosend', 'nofun', 'nomute', 'slow', 'canskip', 'canmute', 'cankick', 'cansettings'];
export const permOk = p => GROUP_PERMS.includes(p) || /^slow([5-9]|[1-9]\d|[1-5]\d\d|600)$/.test(p);   // slow30: one message every 30 s (5 to 600)
const SLOW_MS = 15000;
function groupsOf0(s) {   // the room's groups, made on first use
  if (!s.groups) s.groups = { sudo: { perms: [], members: [] }, dumbasses: { perms: ['nofun', 'slow'], members: [] } };
  return s.groups;
}
export const groupsOf = (s, id) => {
  const out = id === s.hostId ? ['sudo'] : [];
  for (const [name, g] of Object.entries(s.groups || { dumbasses: { perms: ['nofun', 'slow'], members: [] } })) if ((g.members || []).includes(id) && !out.includes(name)) out.push(name);
  return out;
};
export const isSudo = (s, id) => groupsOf(s, id).includes('sudo');
export const denied = (s, id, perm) => groupsOf(s, id).some(n => (((s.groups || {})[n] || {}).perms || []).includes(perm));
/* a perm that gives part of the host's job (canskip, canmute, cankick, cansettings): sudo has them all */
export const may = (s, id, perm) => !!s.players[id] && (isSudo(s, id) || denied(s, id, perm));
/* how long this player waits between chat messages (0: no wait) */
export function slowMs(s, id) {
  let ms = 0;
  for (const n of groupsOf(s, id)) for (const p of ((s.groups || {})[n] || {}).perms || []) { const m = p.match(/^slow(\d*)$/); if (m) ms = Math.max(ms, m[1] ? +m[1] * 1000 : SLOW_MS); }
  return ms;
}
/* may this player open a file someone sent from the command line? its sender, sudo, its group (chmod g+r), or everyone (o+r) */
export const canOpen = (s, id, m) => !m.file || m.from === id || isSudo(s, id) || !!m.pub || (!!m.grp && groupsOf(s, id).includes(m.grp));
/* the stage a phase belongs to, and the running count of turns and of each stage (for forgame's timed mutes) */
export const STAGE = { lobby: 'lobby', countdown: 'lobby', over: 'stats', submit: 'writing', topic: 'writing', seeds: 'writing', words: 'writing', write: 'writing', answer: 'voting', tvote: 'voting', tie: 'voting', lvote: 'voting', wvote: 'voting', counsel: 'voting', discuss: 'discussing', bracket: 'discussing', results: 'stats', podium: 'stats', wqpick: 'writing', clue: 'discussing', choice: 'voting', accuse: 'voting', reveal: 'discussing', hang: 'discussing' };
function countTurn(s, was) {
  const k = turnKey(s); if (k !== s.lastTurn) { s.lastTurn = k; s.turnN = (s.turnN || 0) + 1; }
  const st = STAGE[s.phase]; if (st !== was) s.stageN = { ...(s.stageN || {}), [st]: ((s.stageN || {})[st] || 0) + 1 };
}
/* forgame: the game's timers and turn share mid-game, or mutes that everyone sees, for good, for a number of turns, or
   in some stages (stage2 voting: the next two voting stages) */
const TIME_OK = [0, 15, 30, 45, 60, 90, 120], SHARE_OK = [.5, .67, .75, 1], MUTE_KINDS = ['bubble', 'ping', 'text'];
function forgame(s, a, now) {
  const me = s.players[a.id]; if (!me || s.phase === 'lobby') return null;
  if (a.set) {
    if (!may(s, a.id, 'cansettings')) return null;
    const o = {};
    for (const [k, v] of Object.entries(a.set)) {
      if (k === 'order' && ['random', 'rotate'].includes(v)) o.order = v;
      if (['freeRoam', 'fun', 'lowGravity'].includes(k)) o[k] = v ? 1 : 0;
      if (k === 'share' && SHARE_OK.includes(v)) o.share = v;
      if (['catchUp', 'answerTime', 'submitTime'].includes(k) && TIME_OK.includes(v)) o[k] = v;
      if (k === 'answerOff') o.answerOff = v ? 1 : 0;
    }
    if (!Object.keys(o).length) return null;
    Object.assign(s.options, o);
    if (o.catchUp === 0) s.catchEnds = 0;
    if (o.answerOff && s.phase === 'answer') { s.lordTime = 0; s.ends = 0; }
    if (o.submitTime === 0 && ['submit', 'topic', 'seeds'].includes(s.phase)) s.ends = 0;
    const said = (k, v) => k === 'share' ? `turn ends with ${v === 1 ? 'everyone' : `${Math.round(v * 100)}%`}` : k === 'answerOff' ? `answer timer ${v ? 'off' : 'on'}` : k === 'order' ? `question order ${v}` : k === 'lowGravity' ? `gravity ${v ? 'low' : 'normal'}` : k === 'freeRoam' || k === 'fun' ? `${k === 'fun' ? 'silly commands' : 'free roam'} ${v ? 'on' : 'off'}` : `${{ catchUp: 'catch-up timer', answerTime: 'answer timer', submitTime: 'writing timer' }[k]} ${v ? v + ' s' : 'off'}`;
    say(s, `${me.name} changed the game: ${Object.entries(o).map(([k, v]) => said(k, v)).join(', ')}.`);
    return advance(s, now);
  }
  const m = a.mute; if (!m || !may(s, a.id, 'canmute')) return null;
  const who = (m.who || []).filter(id => s.players[id]), kinds = (m.kinds || []).filter(k => MUTE_KINDS.includes(k));
  const stages = (m.stages || []).filter(x => Object.values(STAGE).includes(x)), turns = Math.max(0, Math.min(99, m.turns | 0)), count = Math.max(0, Math.min(99, m.count | 0));
  if (!who.length || !kinds.length) return null;
  if (!m.on && !turns && !stages.length) s.gmutes = (s.gmutes || []).map(x => ({ ...x, who: x.who.filter(id => !who.includes(id)) })).filter(x => x.who.length);   // off for good: drop them
  else s.gmutes = [...(s.gmutes || []), { who, kinds, on: !!m.on, turns, stages, count, t0: s.turnN || 0, s0: { ...(s.stageN || {}) }, cur: STAGE[s.phase] }].slice(-40);
  say(s, `${me.name} ${m.on ? 'muted' : 'unmuted'} ${kinds.join(', ')} for ${who.map(id => s.players[id].name).join(', ')}${turns ? ` for ${turns} turn${turns > 1 ? 's' : ''}` : ''}${stages.length ? ` in ${count ? `the next ${count} ` : 'the '}${stages.join(', ')} stage${count === 1 && stages.length === 1 ? '' : 's'}` : ''}.`);
  return s;
}
/* is this player's bubble, ping or text muted for everyone now (by forgame)? the newest mute that applies wins */
export function gameMuted(s, id, kind) {
  let out = false;
  const st = STAGE[s.phase] || 'lobby';
  for (const m of s.gmutes || []) {
    if (!m.who.includes(id) || !m.kinds.includes(kind)) continue;
    if (m.turns && (s.turnN || 0) - m.t0 >= m.turns) continue;
    if (m.stages && m.stages.length) {
      if (!m.stages.includes(st)) continue;
      const k = ((s.stageN || {})[st] || 0) - ((m.s0 || {})[st] || 0) + (m.cur === st ? 1 : 0);
      if (m.count && k > m.count) continue;
    }
    out = m.on;
  }
  return out;
}

/* where a bullet or a dagger is, t ms after it was fired: on the board (x, y) and, for the dagger, its height z */
export const shotAt = (sh, t) => ({ x: sh.x0 + sh.vx * t / 1000, y: sh.y0 + sh.vy * t / 1000, z: sh.k === 'dagger' ? daggerZ(t / 1000) : .41 });
/* the handgun's bullets and the thrown daggers: a duck on the ground that one passes through plays dead (until it
   moves); a bullet flies on to the screen's edge, a dagger until it has fallen away. In Hangout one flies at the height
   it was fired from and hits only ducks standing about that high, on its side of the cabin's walls, and the walls stop
   it */
function moveShots(s, now) {
  if (!s.shots || !s.shots.length) return false;
  const keep = [];
  for (const sh of s.shots) {
    if (!sh.k) continue;   // (one fired before aiming: gone)
    const at = shotAt(sh, now - sh.t), x0 = sh.lx, y0 = sh.ly, dx = at.x - x0, dy = at.y - y0;
    const walled = sh.hin !== undefined && (inCabin(at.x * HW, at.y * HH) ? 1 : 0) !== sh.hin;   // (Hangout: it hit the cabin's wall)
    if (at.z > -.15 && at.z < 1.05) for (const id of s.seat) {   // (a dagger over a duck's head, or already fallen, hits nobody)
      const p = s.pos[id], P = s.players[id]; if (id === sh.by || !p || p.x < 0 || !P || P.dead) continue;
      if (sh.hin !== undefined && ((inCabin(p.x * HW, p.y * HH) ? 1 : 0) !== sh.hin || Math.abs((+p.z || 0) - sh.hz) > 48)) continue;   // (the other side of the walls, or above or below it)
      if (p.j && now - p.j < 1300) continue;   // jumped over it
      /* the nearest the shot came to the duck this beat, measured in a duck's room (.03 across, .08 deep; Hangout's world is far bigger than a board) */
      const rx = isHang(s) ? .006 : .03, ry = isHang(s) ? .012 : .08;
      const ux = dx / rx, uy = dy / ry, px = (p.x - x0) / rx, py = (p.y - y0) / ry, len = ux * ux + uy * uy;
      const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
      if (Math.hypot(px - k * ux, py - k * uy) < 1) P.dead = true;
    }
    sh.lx = at.x; sh.ly = at.y;
    const on = !walled && at.x > -.3 && at.x < 1.3 && at.y > -.6 && at.y < 1.6 && now - sh.t < (sh.k === 'dagger' ? DAGGER_LIFE : 12000);
    if (on && boardPhases(s).includes(s.phase)) keep.push(sh);   // (on past the board to the screen's edge)
  }
  s.shots = keep; return true;
}

/* a vote passes once enough say yes, and fails once it can't pass any more */
function settleVote(s, now) {
  const v = s.vote; if (!v) return s;
  const { voters, need } = voteNeeds(s, v), yes = voters.filter(id => v.yes[id]).length, no = voters.filter(id => v.no[id]).length;
  if (v.kind === 'kick' && !s.players[v.target]) { s.vote = null; return s; }
  if (v.kind === 'kick' && humanIds(s).length <= 2) { s.vote = null; say(s, 'Only two players left, so the kick vote ended.'); return s; }
  if (yes >= need) {
    s.vote = null;
    if (v.kind === 'kick') {
      const p = s.players[v.target];
      s.banned = { ...(s.banned || {}), [v.target]: true, ...(p.acct ? { ['acct:' + p.acct]: true } : {}) };
      say(s, `${p.name} was voted out until the room goes back to the lobby.`);
      reopenMatch(s, v.target); if (isHang(s)) hangLeft(s, v.target);
      delete s.players[v.target]; s.seat = s.seat.filter(id => id !== v.target); delete s.pos[v.target]; delete s.done[v.target];
      if (v.target === s.hostId) s.hostId = humanIds(s)[0] || null;
      return advance(s, now);
    }
    if (v.kind === 'skip') return skipRound(s, now);
    if (v.kind === 'turn') {   // the whole turn, as if everyone were done: a question's voting and its talk
      say(s, 'The room voted to skip this turn.');
      const k = turnKey(s);
      for (let i = 0; i < 3 && turnKey(s) === k && !['lobby', 'over'].includes(s.phase); i++) advance(s, now, true);
      return s;
    }
    return backToLobby(s, 'Everyone voted to go back to the lobby.');
  }
  if (no > voters.length - need) { s.vote = null; say(s, 'The vote didn\'t pass.'); }
  return s;
}
/* someone leaves (or is kicked) in the middle of a bracket match or its tie vote: the match isn't settled by them going.
   The others' votes open again, so it waits for the players still here to end their turn (or for its own timer). In the
   tie vote the others keep their picks; only the one who left loses theirs */
function reopenMatch(s, id) {
  if (!isBb(s) || !['answer', 'tie'].includes(s.phase) || !s.players[id] || s.players[id].late) return;
  if (s.phase === 'tie') { const t = s.bb.tie; if (t && t.votes) { const { [id]: _, ...rest } = t.votes; t.votes = rest; } return; }
  if (!Object.keys(s.done).some(x => x !== id && s.done[x])) return;   // nobody else had voted yet: nothing to reopen
  s.done = {};
  say(s, 'The vote is open again: end your turn when you\'re ready.');
}
/* a vote passed to skip the round: the rest of its questions (or the tournament) are dropped. Agree or Disagree and
   Would You Rather go to the round's stats with what was answered; Bicker Brackets starts a new tournament; Story Chain
   ends the paragraph with what was written (or draws new words, if no line was written yet); on the stats
   screen, the next round starts */
function skipRound(s, now) {
  say(s, 'The room voted to skip this round.');
  if (s.phase === 'results') return advance(s, now, true);
  if (isBb(s)) { s.round++; return startTourney(s, now); }
  if (isQuack(s)) return quackSkip(s, now);   // Who is the Quack?: no winner, the word shown
  if (isSc(s)) {   // Story Chain: the paragraph ends with what was written; with nothing written yet, new words are drawn
    const none = s.phase === 'words' || (s.phase === 'write' && !scPara(s).lines.length);
    if (s.phase === 'write' && none) scStory(s).paras.pop();   // (no empty paragraph left in the story)
    if (none) { s.round++; return startStory(s, now, false); }
    return startNext(s, now);
  }
  if (s.phase === 'submit') { s.round++; s.subs = []; s.qs = []; return enter(s, 'submit', now); }   // nothing asked yet: on to the next round's writing
  return startResults(s, now);
}
/* the room goes back to the lobby: a fresh game next time, and the voted-out may come back */
export function backToLobby(s, why) {
  const was = STAGE[s.phase]; s.phase = 'lobby'; countTurn(s, was); s.at = 0; s.ends = 0; s.catchEnds = 0; s.round = 0; s.history = []; s.jumps = {}; s.qs = []; s.qi = 0; s.subs = [];
  s.done = {}; s.vote = null; s.voteUsed = {}; s.banned = {}; s.pos = {}; s.lock = {}; s.hang = null; s.bb = null; s.bbPast = []; s.sc = null; s.law = null; s.wq = null; delete s.hidden; s.wqPast = []; s.wqScore = null; s.wqPickers = [];
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
  seatLate(s);
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
  if (n < 2) {
    if (!playing(s).length) return s;   // nobody left to play (a new tournament would loop forever)
    say(s, `${n ? 'Only one contender' : 'No contenders'}: not enough for a bracket. A new tournament!`); s.round++; return startTourney(s, now);
  }
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
function enterBracket(s, now) {   // ducks stand on the bracket (x, y across it), lined up by the round that's up next
  seatLate(s);
  const b = s.bb, col = b.champ != null ? b.rounds.length : b.r, x = Math.min(.97, (col + .45) / (b.rounds.length + 1));
  s.seat.forEach((id, k) => { s.pos[id] = { x, y: (k + 1) / (s.seat.length + 1) }; });
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
  b.m = i; s.qi++; s.lordTime = s.options.answerOff ? 0 : +s.options.bbTimer || 0; delete b.tie;
  s.pos = {}; s.lock = {}; seatLate(s);
  s.seat.forEach((id, k) => { s.pos[id] = { x: .5, y: (k + 1) / (s.seat.length + 1) }; });   // everyone starts between the two seeds
  return enter(s, 'answer', now);
}
/* the votes are in: the side with more ducks wins and moves on; a tie goes to the room (vote again or a coin toss).
   Returns false on a tie. */
function endMatch(s, now) {
  const b = s.bb, m = b.rounds[b.r][b.m], who = {};
  for (const id of playing(s)) { const p = s.pos[id], c = p && p.x >= 0 ? colAt(s, p.x) : -1; if (c >= 0) who[id] = c; }
  const va = Object.values(who).filter(c => c === 0).length, vb = Object.values(who).length - va;
  s.lock = { ...who };   // each duck stays on the side it chose while the room talks it over (or settles the tie)
  if (va === vb) { b.tie = { va, vb, who, votes: {} }; say(s, `Tied ${va}–${vb}! Vote again, or toss a coin?`); return false; }
  decide(s, va > vb ? 0 : 1, va, vb, who, false);
  return true;
}
function decide(s, side, va, vb, who, coin) {
  const b = s.bb, m = b.rounds[b.r][b.m];
  Object.assign(m, { w: side ? m.b : m.a, va, vb, who }, coin ? { coin: true } : {});
  feed(b, b.r, b.m);
  const w = b.seeds[m.w];
  say(s, coin ? `The coin sends "${w.text}" through.` : `"${w.text}" wins ${Math.max(va, vb)}–${Math.min(va, vb)}.`);
}
/* the tie is settled: more for "vote again" runs the match again; else (or a tie again) the coin decides */
function settleTie(s, now) {
  const b = s.bb, t = b.tie, n = { again: 0, coin: 0 };
  for (const [id, v] of Object.entries(t.votes || {})) if (s.players[id]) n[v]++;
  if (n.again > n.coin) {
    say(s, 'Voting again.'); delete b.tie;
    s.qi++; s.pos = {}; s.lock = {}; s.lordTime = s.options.answerOff ? 0 : +s.options.bbTimer || 0; seatLate(s);
    s.seat.forEach((id, k) => { s.pos[id] = { x: .5, y: (k + 1) / (s.seat.length + 1) }; });
    return enter(s, 'answer', now);
  }
  decide(s, Math.random() < .5 ? 0 : 1, t.va, t.vb, t.who, true); delete b.tie;
  return s.options.freeRoam ? nextMatch(s, now) : enter(s, 'discuss', now);
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

/* ---------- Story Chain ----------
   A round is one paragraph: everyone writes a secret word → the words are shared out so nobody gets their own, and a
   random order of writers is drawn → one at a time, each writer adds a sentence (160 letters at most) with their secret
   word in it, everyone watching it typed → everyone walks onto their favorite line and votes (not their own) → the secret
   words show below the story, each lit up in its line, and everyone votes for their favorite (not their own) → the stats,
   where everyone walks to what's next: continue the story (a new paragraph), a new story, or back to the lobby.

   The board is a column of zones, one under the other: the story's lines (and the line being typed), the word boxes, or
   the three choices. A duck's y covers the zones evenly (zone k is k/n to (k + 1)/n), so it stands on the same line on
   every screen however the lines wrap. */
export const SC_PHASES = ['words', 'write', 'lvote', 'wvote', 'results'];
export const SC_BOARD = ['write', 'lvote', 'wvote', 'results'];
export const SC_VOTES = ['lvote', 'wvote', 'results'];
export const LINE_MAX = 160, WORD_MAX = 20;
export const SC_NEXT = [['cont', 'Continue the story'], ['new', 'A new story'], ['lobby', 'Back to the lobby']];
/* a secret word for a writer nobody else wrote one for */
export const SC_WORDS = ['pineapple', 'kazoo', 'sunglasses', 'crumbs', 'trampoline', 'mustache', 'volcano', 'spaghetti', 'penguin', 'glitter', 'toaster', 'pickle', 'unicorn', 'noodle', 'bathtub', 'banana'];
export const cleanWord = v => (String(v || '').trim().split(/\s+/)[0] || '').replace(/[^\p{L}\p{N}'-]/gu, '').slice(0, WORD_MAX);
/* where the word sits in a line (any capitals, inside a longer word too), or -1 */
export const wordAt = (text, word) => word ? String(text).toLowerCase().indexOf(String(word).toLowerCase()) : -1;
export const scStory = s => s.sc && s.sc.stories[s.sc.stories.length - 1];
export const scPara = s => { const st = scStory(s); return st && st.paras[st.paras.length - 1]; };
export const scWriter = s => s.sc && s.sc.order[s.sc.turn];
/* the board's zones in a phase: "p.i" line i of paragraph p, T the line being typed, W:id the word id wrote, H the top of
   the choices, C:cont / C:new / C:lobby the choices */
export function scZones(s, phase = s.phase) {
  const st = scStory(s); if (!st) return [];
  if (phase === 'results') return ['H', ...SC_NEXT.map(c => 'C:' + c[0])];
  const z = [];
  st.paras.forEach((p, i) => p.lines.forEach((l, j) => z.push(i + '.' + j)));
  if (phase === 'write') z.push('T');
  if (phase === 'wvote') for (const l of scPara(s).lines) if (l.wordBy && s.players[l.wordBy] && !z.includes('W:' + l.wordBy)) z.push('W:' + l.wordBy);
  return z;
}
export const zoneAt = (s, y, zones = scZones(s)) => zones.length ? zones[Math.max(0, Math.min(zones.length - 1, Math.floor(y * zones.length)))] : null;
/* the line a zone holds: { p, i, line } (current paragraph or not) */
export function scLineOf(s, z) {
  const m = /^(\d+)\.(\d+)$/.exec(z || ''), st = scStory(s); if (!m || !st) return null;
  const p = +m[1], i = +m[2], para = st.paras[p], line = para && para.lines[i];
  return line ? { p, i, line, now: p === st.paras.length - 1 } : null;
}
/* can this player vote for what's in this zone? (their own line or word: no) */
export function scCanVote(s, id, z, phase = s.phase) {
  if (phase === 'lvote') { const l = scLineOf(s, z); return !!(l && l.now && l.line.by !== id); }
  if (phase === 'wvote') return /^W:/.test(z || '') && z.slice(2) !== id;
  if (phase === 'results') return /^C:/.test(z || '');
  return false;
}
/* ducks keep their zone when the zones change (a line is added, the word boxes come): from, to = the zones before and
   after; alias names where a zone went (the line being typed became a line) */
function scRezone(s, from, to, alias = {}) {
  if (!to.length) return;
  for (const p of Object.values(s.pos)) {
    const u = Math.max(0, Math.min(.9999, p.y)) * Math.max(1, from.length), k = Math.floor(u), f = u - k, key = alias[from[k]] ?? from[k];
    let j = to.indexOf(key); if (j < 0) j = Math.min(k, to.length - 1);
    p.y = (j + f) / to.length;
  }
}
/* a round: a new paragraph of the story (fresh: a new story) */
function startStory(s, now, fresh) {
  seatLate(s);
  if (fresh || !s.sc.stories.length) s.sc.stories.push({ paras: [] });
  Object.assign(s.sc, { words: {}, order: [], turn: 0, assign: {}, next: {} });
  s.subs = []; s.drafts = {}; s.qi = 0; s.pos = {}; s.lock = {};
  return enter(s, 'words', now);
}
/* the words are in: shared out so nobody writes with their own (a game word for anyone left over), the writers drawn in
   a random order, and the first one starts the paragraph */
function endWords(s, now) {
  const sc = s.sc;
  for (const id of s.seat) { const d = (s.drafts || {})[id]; if (!sc.words[id] && d && cleanWord(d.text)) sc.words[id] = cleanWord(d.text); }
  s.drafts = {};
  const order = shuffle(playing(s)), authors = Object.keys(sc.words).filter(id => s.players[id]);
  if (!order.length) return s;
  let best = null;
  for (let k = 0; k < 40 && !(best && best.left === 0); k++) {   // a few random tries; the one with the fewest game words wins
    const pool = shuffle([...authors]), out = {}; let left = 0;
    for (const w of order) { const i = pool.findIndex(a => a !== w); if (i < 0) { left++; continue; } out[w] = pool.splice(i, 1)[0]; }
    if (!best || left < best.left) best = { out, left };
  }
  const spare = shuffle(SC_WORDS.filter(w => !Object.values(sc.words).some(x => x.toLowerCase() === w)));
  sc.order = order; sc.turn = 0;
  sc.assign = Object.fromEntries(order.map((w, i) => { const by = best.out[w]; return [w, by ? { word: sc.words[by], by } : { word: spare[i % spare.length] || anyOf(SC_WORDS), by: null }]; }));
  scStory(s).paras.push({ round: s.round, lines: [], votes: {}, wvotes: {} });
  const n = scZones(s, 'write').length;
  s.seat.forEach((id, k) => { s.pos[id] = { x: (k + 1) / (s.seat.length + 1), y: (n - .98) / n }; });   // everyone starts just over the line being typed, so it shows
  return writeTurn(s, now);
}
function writeTurn(s, now) {
  s.qi++; s.subs = []; s.drafts = {};
  return enter(s, 'write', now);
}
/* a writer is done (sent it, ran out of time, or left): their line joins the story, and the next writer goes */
function endTurn(s, now) {
  const sc = s.sc, w = scWriter(s), para = scPara(s), sub = (s.subs || []).find(x => x.by === w), d = (s.drafts || {})[w];
  const text = oneLine(sub ? sub.text : d ? d.text : '', LINE_MAX).trim(), from = scZones(s, 'write');
  if (text && s.players[w]) {
    const as = sc.assign[w] || {};
    para.lines.push({ by: w, text, word: as.word || '', wordBy: as.by || null, ms: Math.max(0, now - s.at) });
    scRezone(s, from, scZones(s, 'write'), { T: (scStory(s).paras.length - 1) + '.' + (para.lines.length - 1) });
  } else if (s.players[w]) say(s, `${s.players[w].name} skipped their line.`);
  s.subs = []; s.drafts = {};
  if (++sc.turn < sc.order.length) return writeTurn(s, now);
  if (!para.lines.length) { say(s, 'No lines this time.'); scStory(s).paras.pop(); return startNext(s, now); }
  if (!scVoting(s)) { para.noVote = true; return startNext(s, now); }   // no voting: on to the stats and what comes next
  scRezone(s, scZones(s, 'write'), scZones(s, 'lvote'));   // (a duck by the line being typed: onto the last line)
  return enter(s, 'lvote', now);
}
/* is there voting on this paragraph's lines and words (the lobby's Voting option)? */
export const scVoting = s => s.options.scVote === 'auto' || s.options.scVote == null ? playing(s).length >= 3 : !!+s.options.scVote;
/* the stats, with the three choices: everyone starts at the top of them */
function startNext(s, now) {
  s.sc.next = {}; s.reviewVotes = {}; s.review = false;
  s.seat.forEach((id, k) => { s.pos[id] = { x: (k + 1) / (s.seat.length + 1), y: .125 }; });
  return enter(s, 'results', now);
}
/* a vote: stand on a line, a word or a choice and end your turn; it can't be taken back */
function scVote(s, a, now) {
  const me = s.players[a.id];
  if (!me || me.late || !SC_VOTES.includes(s.phase) || s.done[a.id] || !s.pos[a.id] || now < s.at + VOTE_GRACE * 1000) return null;
  if (typeof a.y === 'number' && isFinite(a.y)) s.pos[a.id].y = Math.max(0, Math.min(1, +a.y));   // (where I stood when I voted)
  const z = zoneAt(s, s.pos[a.id].y); if (!scCanVote(s, a.id, z)) return null;
  const para = scPara(s);
  if (s.phase === 'lvote') para.votes[a.id] = scLineOf(s, z).i;
  if (s.phase === 'wvote') para.wvotes[a.id] = z.slice(2);
  if (s.phase === 'results') s.sc.next[a.id] = z.slice(2);
  s.done[a.id] = true;
  return advance(s, now);
}
/* a secret word or a line: sent (send) or typed so far (a draft; everyone sees a line as it's typed) */
function scWrite(s, a, now, send) {
  const me = s.players[a.id]; if (!me || me.late || s.done[a.id]) return null;
  if (s.phase === 'words') {
    if (!send) { s.drafts = { ...(s.drafts || {}), [a.id]: { text: cleanWord(a.text) } }; return s; }
    const w = cleanWord(a.text); if (w) s.sc.words[a.id] = w; else delete s.sc.words[a.id];
    s.done[a.id] = true; return advance(s, now);
  }
  if (s.phase !== 'write' || scWriter(s) !== a.id) return null;
  const text = oneLine(a.text, LINE_MAX);
  if (!send) { s.drafts = { [a.id]: { text } }; return s; }
  if (!text.trim() || wordAt(text, (s.sc.assign[a.id] || {}).word) < 0) return null;   // the secret word has to be in it
  s.subs = [{ by: a.id, text: text.trim() }]; s.done[a.id] = true;
  return advance(s, now);
}
/* what ends a Story Chain phase: the words when enough are in (then the catch-up timer for the rest); a line when its
   writer is done, out of time or gone; a vote once enough have voted (no timer: there is time to sway each other) */
function scAdvance(s, now, force = false) {   // force: the skip command or a skip vote, as if everyone were done
  const zs = SC_VOTES.includes(s.phase) ? scZones(s) : [], free = id => s.done[id] || (zs.length && !zs.some(z => scCanVote(s, id, z)));   // (nothing to vote for: only their own line or word left)
  const on = playing(s), d = force ? on.length : on.filter(free).length, timeUp = force || (s.ends && now >= s.ends), enough = force || d >= needed(s);
  switch (s.phase) {
    case 'words':
      if (enough && d < on.length && s.options.catchUp && !s.catchEnds) s.catchEnds = now + s.options.catchUp * 1000;
      return d >= on.length || timeUp || (enough && (!s.options.catchUp || now >= s.catchEnds)) ? endWords(s, now) : s;
    case 'write': { const w = scWriter(s); return !s.players[w] || s.done[w] || timeUp ? endTurn(s, now) : s; }
    case 'lvote':
      if (!enough) return s;
      if (!scPara(s).lines.some(l => l.wordBy && s.players[l.wordBy])) return startNext(s, now);   // no words to vote on
      { const from = scZones(s); s.phase = 'wvote'; const to = scZones(s); s.phase = 'lvote'; scRezone(s, from, to); }
      return enter(s, 'wvote', now);
    case 'wvote': return enough ? startNext(s, now) : s;
    case 'results': {
      if (!enough) return s;
      const n = { cont: 0, new: 0, lobby: 0 };
      for (const [id, c] of Object.entries(s.sc.next)) if (s.players[id] && n[c] !== undefined) n[c]++;
      if (force && !n.cont && !n.new && !n.lobby) n.cont = 1;   // skipped with no choices made: the story goes on
      const top = Math.max(...Object.values(n)), best = Object.keys(n).filter(k => n[k] === top), pick = anyOf(best), name = SC_NEXT.find(c => c[0] === pick)[1];
      say(s, best.length > 1 ? `A tie! A coin toss: ${name.toLowerCase()}.` : `${name}!`);
      if (pick === 'lobby') return backToLobby(s, 'Back to the lobby.');
      s.round++;
      return startStory(s, now, pick === 'new');
    }
  }
  return s;
}
/* the numbers behind the stats, over a list of paragraphs: votes for each player's lines and words, time spent writing */
export function scStats(paras) {
  const per = {}, P = id => (per[id] = per[id] || { lines: 0, lvotes: 0, wvotes: 0, ms: 0, best: null, bestN: 0, word: '', wordN: 0 });
  for (const para of paras) {
    const ln = para.lines.map(() => 0), wn = {};
    for (const i of Object.values(para.votes || {})) if (ln[i] !== undefined) ln[i]++;
    for (const by of Object.values(para.wvotes || {})) wn[by] = (wn[by] || 0) + 1;
    para.lines.forEach((l, i) => {
      const p = P(l.by); p.lines++; p.lvotes += ln[i]; p.ms += l.ms || 0;
      if (ln[i] > p.bestN) { p.best = l.text; p.bestN = ln[i]; }
      if (l.wordBy) { const q = P(l.wordBy), k = wn[l.wordBy] || 0; if (k > q.wordN || !q.word) { q.word = l.word; q.wordN = Math.max(q.wordN, k); } }
    });
    for (const [by, k] of Object.entries(wn)) P(by).wvotes += k;
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

/* ---------- Lawyering ----------
   Everyone writes a topic in secret; each topic is a court case. Its attorneys: the defense (argues for it; never its
   writer) and the offense (argues against it; may be its writer), picked at random, by the writer or by a vote of the
   room (the host's choice, for each) → the attorneys stand in the circle in the middle and argue over voice while the
   jury (everyone else) walks to a side and votes: left with the offense, right with the defense. A vote can change at
   any time. No timer until every juror has voted: all on one side ends the case at once; a split jury gets closing
   arguments (a minute by default), and when it runs out the bigger side wins (a tie: nobody does). In closing arguments
   an attorney who isn't ahead may give up. → the verdict, talked over → the next case → the round's stats. */
export const LAW_TOPIC_MAX = 200;
export const isCounsel = (s, id) => !!(s.law && (s.law.def === id || s.law.off === id));
/* the jury: everyone playing but the two attorneys */
export const jury = s => playing(s).filter(id => s.players[id] && !isCounsel(s, id));
/* the jury's votes: [offense, defense] */
export function lawTally(s) {
  const n = [0, 0]; for (const id of jury(s)) { const v = (s.law.votes || {})[id]; if (v === 0 || v === 1) n[v]++; }
  return n;
}
/* in closing arguments, an attorney may give up while their side isn't ahead */
export function canGiveUp(s, id) {
  const L = s.law; if (!L || !L.close || L.w != null || !isCounsel(s, id)) return false;
  const [o, d] = lawTally(s);
  return id === L.off ? o <= d : d <= o;
}
const pickOne = xs => xs[Math.floor(Math.random() * xs.length)];
function startCase(s, now) {
  seatLate(s);
  const q = s.qs[s.qi], on = playing(s).filter(id => s.players[id]);
  s.lordTime = 0; s.pos = {}; s.lock = {}; s.ends = 0;
  s.law = { def: null, off: null, how: {}, picks: { def: {}, off: {} }, votes: {}, flips: {}, close: 0, start: null, w: null, gave: null };
  if (s.seat.length < 3) { s.law = null; return backToLobby(s, 'Lawyering needs at least 3 players: two attorneys and a jury.'); }
  if (on.length < 3) { say(s, `Not enough players for a jury, so "${q.text}" is dismissed.`); return nextCase(s, now); }   // (the rest joined mid-round)
  const writer = s.players[q.by] && on.includes(q.by) ? q.by : null, how = { def: s.options.lawDef, off: s.options.lawOff };
  for (const k of ['def', 'off']) if (how[k] === 'writer' && !writer) how[k] = 'random';   // (the writer left: random)
  s.law.how = Object.fromEntries(Object.entries(how).filter(([, v]) => v === 'writer' || v === 'vote'));
  if (!Object.keys(s.law.how).length) return openCase(s, now);
  enter(s, 'counsel', now);
  for (const id of on) s.done[id] = counselDone(s, id);
  return s;
}
function nextCase(s, now) {
  if (++s.qi < s.qs.length) return startCase(s, now);
  return startResults(s, now);
}
/* who can be picked: the defense never the writer; the offense never the defense (once it's known) */
function counselOk(s, role, who) {
  const q = s.qs[s.qi]; if (!playing(s).includes(who) || !s.players[who]) return false;
  return role === 'def' ? who !== q.by : who !== s.law.def;
}
/* has this player picked everything they're asked to? */
function counselDone(s, id) {
  const q = s.qs[s.qi];
  return Object.entries(s.law.how).every(([role, how]) => (how === 'writer' && id !== q.by) || s.law.picks[role][id] !== undefined);
}
/* the picking is over: the defense first, then the offense (a pick that clashes falls to the next best, then to chance) */
function endCounsel(s, now) {
  const L = s.law, q = s.qs[s.qi], on = playing(s).filter(id => s.players[id]);
  for (const role of ['def', 'off']) {
    const ok = id => role === 'def' ? id !== q.by : id !== L.def, n = {};
    for (const [voter, who] of Object.entries(L.picks[role] || {})) if (s.players[voter] && on.includes(who) && ok(who)) n[who] = (n[who] || 0) + 1;
    const top = Math.max(0, ...Object.values(n)), best = Object.keys(n).filter(id => n[id] === top && top > 0);
    L[role] = best.length ? pickOne(best) : pickOne(on.filter(ok));
  }
  return openCase(s, now);
}
/* the case opens: random attorneys where nobody picks; the attorneys in the circle, the jury lined up above and below it */
function openCase(s, now) {
  const L = s.law, q = s.qs[s.qi], on = playing(s).filter(id => s.players[id]);
  if (!L.def) L.def = pickOne(on.filter(id => id !== q.by));
  if (!L.off) L.off = pickOne(on.filter(id => id !== L.def));
  s.pos = {}; s.lock = {};
  s.pos[L.off] = { x: .47, y: .39 }; s.pos[L.def] = { x: .53, y: .61 };   // (apart, inside the circle, on a computer and on a phone held upright)
  const rest = s.seat.filter(id => !isCounsel(s, id)), half = Math.ceil(rest.length / 2);
  rest.forEach((id, k) => { const top = k < half, i = top ? k : k - half, n = top ? half : rest.length - half; s.pos[id] = { x: .44 + .12 * (i + 1) / (n + 1), y: top ? .04 : .96 }; });
  const D = s.players[L.def].name, O = s.players[L.off].name, t = q.text.trim();
  say(s, `The Court Case, ${D} is defending this idea: ${t}${/[.!?…]$/.test(t) ? '' : '.'} ${O} is against it.`);
  return enter(s, 'answer', now);
}
/* a juror votes for the side they stand on (again, to change it) */
function lawVote(s, a, now) {
  const L = s.law, p = s.pos[a.id]; if (!L || L.w != null || isCounsel(s, a.id) || !jury(s).includes(a.id)) return null;
  const c = colAt(s, p.x); if (c < 0) return null;
  const was = L.votes[a.id]; if (was === c) return null;
  if (was !== undefined) L.flips = { ...L.flips, [a.id]: (L.flips[a.id] || 0) + 1 };
  L.votes = { ...L.votes, [a.id]: c }; s.done[a.id] = true;
  return lawCheck(s, now);
}
/* the case goes on until the jury has voted: all on one side wins at once; a split starts closing arguments, and when
   they run out the bigger side wins. An attorney who leaves loses the case. */
function lawCheck(s, now, force) {
  const L = s.law; if (!L || L.w != null) return s;
  const hereO = !!s.players[L.off], hereD = !!s.players[L.def];
  if (!hereO || !hereD) {
    if (!hereO && !hereD) { say(s, 'Both attorneys left, so the case is dismissed.'); return nextCase(s, now); }
    L.left = hereO ? L.def : L.off; return verdict(s, hereO ? 0 : 1, now);
  }
  const j = jury(s), [o, d] = lawTally(s);
  if (!j.length) { say(s, 'Nobody is left on the jury, so the case is dismissed.'); return nextCase(s, now); }
  if (force) return verdict(s, o > d ? 0 : d > o ? 1 : -1, now);   // skipped: the votes so far decide
  if (!L.close) {
    if (j.some(id => L.votes[id] === undefined)) return s;
    if (!o || !d) return verdict(s, d ? 1 : 0, now);
    L.close = now + (+s.options.lawClose || 60) * 1000; L.start = [o, d]; s.ends = L.close;
    say(s, `Closing arguments! The jury is split ${o}–${d}: last chance to win them over.`);
    return s;
  }
  if (now < L.close) return s;
  return verdict(s, o > d ? 0 : d > o ? 1 : -1, now);
}
/* the verdict: side 0 (offense), 1 (defense) or -1 (a tie); the case joins the game's history, then the room talks it over */
function verdict(s, side, now) {
  const L = s.law, q = s.qs[s.qi], [o, d] = lawTally(s), votes = {};
  for (const id of jury(s)) if (L.votes[id] !== undefined) votes[id] = L.votes[id];
  L.w = side; L.end = [o, d]; s.ends = 0;
  s.history.push({ round: s.round, by: q.by, text: q.text, law: { def: L.def, off: L.off, votes, flips: { ...L.flips }, w: side, start: L.start, end: [o, d], gave: L.gave, left: L.left || null } });
  const W = side === 0 ? L.off : side === 1 ? L.def : null;
  const wn = s.players[W] ? s.players[W].name : 'The ' + (side ? 'defense' : 'offense');
  if (L.left) say(s, `The ${side ? 'offense' : 'defense'} attorney left the courtroom, so ${wn} wins the case.`);
  else if (!L.gave) say(s, W ? `${wn} wins the case ${Math.max(o, d)}–${Math.min(o, d)}.` : `A hung jury: ${o}–${d}. Nobody wins the case.`);
  s.lock = { ...votes, [L.off]: -1, [L.def]: -1 };
  for (const id of s.seat) if (s.lock[id] === undefined && s.pos[id]) { const c = colAt(s, s.pos[id].x); s.lock[id] = c; }
  return enter(s, 'discuss', now);
}
/* the numbers behind Lawyering's stats: each player's cases (argued, won, lost, by side, given up, won against their own
   topic) and jury votes (and how often they switched sides), and every case's score; round = null for the whole game.
   A hung jury is neither a win nor a loss. */
export function lawStats(s, round = null) {
  const per = {}, cases = [];
  const P = id => (per[id] = per[id] || { argued: 0, won: 0, lost: 0, wonDef: 0, wonOff: 0, gave: 0, ownWin: 0, votes: 0, flips: 0 });
  for (const h of s.history.filter(h => h.law && (round === null || h.round === round))) {
    const c = h.law, [o, d] = c.end || [0, 0];
    cases.push({ by: h.by, text: h.text, off: c.off, def: c.def, o, d, w: c.w, gave: c.gave, left: c.left });
    P(c.off).argued++; P(c.def).argued++;
    if (c.w === 0 || c.w === 1) {
      const W = c.w ? c.def : c.off, L = c.w ? c.off : c.def;
      P(W).won++; P(W)[c.w ? 'wonDef' : 'wonOff']++; P(L).lost++;
      if (!c.w && c.off === h.by) P(W).ownWin++;   // argued against their own topic, and won
    }
    if (c.gave) P(c.gave).gave++;
    for (const id of Object.keys(c.votes || {})) { P(id).votes++; P(id).flips += (c.flips || {})[id] || 0; }
  }
  return { per, cases };
}
