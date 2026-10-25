/* ---------- the rules of Who is the Quack? ----------
   A round is one secret word: a random player picks the word and its category in secret (or the built-in list does) →
   everyone's Secret Card shows the word and the category, except the Quack's, which shows the category and "You are
   the Quack" → clue turns: the duck on the cloud says a clue out loud; nobody can end a turn in its first 12 seconds,
   then the speaker ends it, or every other duck still in skips it → after a lap, the room walks to a side: Vote Out the
   Quack (left) or Another round of clues (right); a tie goes to the vote → the vote: everyone still in walks onto the
   tile of the duck they suspect and votes (a tie gets one revote between the tied; tied again, nobody is out) → the
   reveal: a caught Quack (the room wins), or an innocent duck who goes grey and sits out the round while the clues go
   on; once only one other duck is left in, the Quack wins → the stats → the next round.

   The word and who the Quack is are in s.hidden, which only the host has: online.js never writes it, and each player's
   Secret Card goes to that player alone, locked (secret.js). Everyone else sees s.wq. */
import { enter, say, playing, needed, backToLobby, VOTE_GRACE } from './rules.js';

export const CLUE_GRACE = 12;   // seconds before a clue turn can end
export const WORD_MAX = 24, CAT_MAX = 20;
export const QUACK_PHASES = ['wqpick', 'clue', 'choice', 'accuse', 'reveal'];
export const isQuack = s => (s.options || {}).mode === 'quack';
const shuffle = xs => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
const anyOf = xs => xs[Math.floor(Math.random() * xs.length)];
const oneLine = (v, n) => String(v || '').replace(/\s+/g, ' ').slice(0, n).trim();

/* the built-in words, by category (for "Need an idea?", the computers, and rooms set to the built-in list) */
export const WORDS = {
  Food: ['Pancake', 'Pizza', 'Taco', 'Sushi', 'Spaghetti', 'Popcorn', 'Burrito', 'Donut', 'Cheeseburger', 'Pickle', 'Waffle', 'Ice cream'],
  Animals: ['Penguin', 'Giraffe', 'Octopus', 'Kangaroo', 'Elephant', 'Shark', 'Owl', 'Sloth', 'Flamingo', 'Raccoon', 'Turtle', 'Hamster'],
  Places: ['Beach', 'Library', 'Airport', 'Hospital', 'Zoo', 'Casino', 'Castle', 'Volcano', 'Gym', 'Bowling alley', 'Movie theater', 'Desert'],
  Jobs: ['Firefighter', 'Dentist', 'Pilot', 'Chef', 'Lifeguard', 'Plumber', 'Astronaut', 'Magician', 'Mail carrier', 'Barber', 'Farmer', 'Detective'],
  Sports: ['Soccer', 'Basketball', 'Golf', 'Bowling', 'Surfing', 'Boxing', 'Tennis', 'Skateboarding', 'Hockey', 'Baseball', 'Ping pong', 'Skiing'],
  'Things at home': ['Toaster', 'Couch', 'Bathtub', 'Vacuum', 'Pillow', 'Microwave', 'Lamp', 'Fridge', 'Toilet', 'Remote', 'Blender', 'Ceiling fan'],
  Clothes: ['Hoodie', 'Flip-flops', 'Tuxedo', 'Pajamas', 'Raincoat', 'Sombrero', 'Mittens', 'Cowboy boots', 'Tie', 'Swimsuit', 'Crocs', 'Scarf'],
  Vehicles: ['Bicycle', 'Helicopter', 'Submarine', 'Tractor', 'Skateboard', 'Ambulance', 'Hot air balloon', 'Canoe', 'Motorcycle', 'Train', 'Rocket', 'Golf cart'],
  Parties: ['Birthday', 'Halloween', 'Wedding', 'Christmas', 'New Year\'s Eve', 'Sleepover', 'Graduation', 'Thanksgiving', 'Valentine\'s Day', 'Baby shower', 'Prom', 'Fourth of July'],
  'Video games': ['Minecraft', 'Mario Kart', 'Fortnite', 'Tetris', 'Pac-Man', 'Pokémon', 'Halo', 'Among Us', 'Zelda', 'Roblox', 'Sonic', 'Animal Crossing'],
  'Movies and shows': ['Shrek', 'Star Wars', 'Titanic', 'Frozen', 'Jurassic Park', 'SpongeBob', 'The Office', 'Toy Story', 'Harry Potter', 'Finding Nemo', 'Spider-Man', 'Scooby-Doo'],
  Nature: ['Rainbow', 'Tornado', 'Waterfall', 'Cactus', 'Moon', 'Thunderstorm', 'Iceberg', 'Mushroom', 'Sunflower', 'Cave', 'Snowflake', 'Lava'],
  Music: ['Guitar', 'Drums', 'Karaoke', 'Piano', 'Tuba', 'Opera', 'DJ', 'Banjo', 'Violin', 'Kazoo', 'Harmonica', 'Boy band'],
  School: ['Homework', 'Recess', 'Cafeteria', 'Backpack', 'Detention', 'Field trip', 'Pop quiz', 'Yearbook', 'Principal', 'Gym class', 'Spelling bee', 'Lunch box'],
  Fantasy: ['Dragon', 'Wizard', 'Unicorn', 'Mermaid', 'Vampire', 'Zombie', 'Ghost', 'Robot', 'Alien', 'Pirate', 'Ninja', 'Knight'],
};
export const anyWord = () => { const cat = anyOf(Object.keys(WORDS)); return { word: anyOf(WORDS[cat]), cat }; };

/* ---------- the board: one tile per duck in the round, in a grid that fits the count ---------- */
export function gridOf(n) {
  if (n <= 3) return { C: Math.max(1, n), R: 1 };
  if (n === 4) return { C: 2, R: 2 };
  if (n <= 6) return { C: 3, R: 2 };
  if (n <= 8) return { C: 4, R: 2 };
  if (n === 9) return { C: 3, R: 3 };
  if (n <= 12) return { C: 4, R: 3 };
  return { C: 4, R: Math.ceil(n / 4) };
}
/* the tile under a spot on the board (x, y from 0 to 1), or -1 */
export function tileAt(s, p) {
  const w = s.wq; if (!w || !p || p.x < 0) return -1;
  const { C, R } = gridOf(w.ids.length), k = Math.min(R - 1, Math.floor(p.y * R)) * C + Math.min(C - 1, Math.floor(p.x * C));
  return k < w.ids.length ? k : -1;
}
export const tileCenter = (s, k, dy = .5) => { const { C, R } = gridOf(s.wq.ids.length); return { x: (k % C + .5) / C, y: (Math.floor(k / C) + dy) / R }; };   // (dy .62: clear of the tile's own duck, top left)
/* the spot a duck stands on: a side of the two (choice) or a duck's tile */
export const spotOf = (s, p) => !p || p.x < 0 ? -1 : s.phase === 'choice' ? (p.x < .46 ? 0 : p.x > .54 ? 1 : -1) : tileAt(s, p);

/* who is still in the round: here, playing it and not voted out */
export const stillIn = s => s.wq ? s.wq.ids.filter(id => s.players[id] && !s.wq.out[id]) : [];
const quacksOf = s => (s.hidden && s.hidden.quacks) || [];
/* grey on the board: voted out, or the last duck when the Quack wins */
export const isGrey = (s, id) => !!(s.wq && (s.wq.out[id] || (s.wq.dead || []).includes(id)));
export const canAccuse = (s, by, target) => { const w = s.wq; return !!target && target !== by && w.ids.includes(target) && !w.out[target] && !!s.players[target] && (!w.tie || w.tie.includes(target)); };
export const frozen = (s, id, now) => !!(s.wq && s.wq.freeze && s.wq.freeze[id] > now);
/* a player's Secret Card (the host only: it needs s.hidden); null for anyone not in the round */
export function cardOf(s, id) {
  const h = s.hidden, w = s.wq; if (!h || !w || !h.word || !w.ids.includes(id)) return null;
  return h.quacks.includes(id) ? { deal: w.deal, cat: w.cat, quack: true } : { deal: w.deal, cat: w.cat, word: h.word };
}

/* ---------- a round ---------- */
export function startQuackRound(s, now) {
  for (const id of s.seat) if (s.players[id]) delete s.players[id].late;   // late joiners play from here
  const ids = playing(s);
  s.pos = {}; s.lock = {}; s.qi = 0; s.subs = []; s.drafts = {}; delete s.cards;   // (online: an old host's locked cards)
  if (ids.length < 3) return backToLobby(s, 'Who is the Quack? needs at least 3 ducks.');
  s.wq = { ids, picker: null, cat: '', deal: 0, order: [], turn: 0, lap: 0, out: {}, dead: [], freeze: {}, tie: null, votes: [], result: null, lastOut: null };
  s.hidden = { word: '', quacks: [], draft: null };
  s.seat.forEach((id, k) => { s.pos[id] = { x: .5, y: (k + 1) / (s.seat.length + 1) }; });
  if (s.options.wqPicker === 'list') return deal(s, anyWord(), now);
  let pool = ids.filter(id => !(s.wqPickers || []).includes(id));   // everyone gets a turn at picking
  if (!pool.length) { s.wqPickers = []; pool = ids; }
  s.wq.picker = anyOf(pool); s.wqPickers = [...(s.wqPickers || []), s.wq.picker];
  return enter(s, 'wqpick', now);
}
/* the picker sends the word (or, as they type, a draft that goes in if time runs out) */
export function wqWord(s, a, now) {
  if (s.phase !== 'wqpick' || !s.wq || a.id !== s.wq.picker || !s.hidden) return null;
  const word = oneLine(a.word, WORD_MAX), cat = oneLine(a.cat, CAT_MAX);
  if (a.draft) { s.hidden.draft = { word, cat }; return s; }
  if (!word) return null;
  return deal(s, { word, cat: cat || 'No hint' }, now);
}
/* the Secret Cards: the Quack (never the picker) gets the category alone */
function deal(s, { word, cat }, now) {
  const w = s.wq, ids = w.ids.filter(id => s.players[id]), can = ids.filter(id => id !== w.picker);
  const n = s.options.wqQuacks === 2 && ids.length >= 6 ? 2 : 1;
  s.hidden = { word, quacks: shuffle([...can]).slice(0, n), draft: null };
  w.cat = cat; w.deal = Math.floor(Math.random() * 1e9) + 1;
  say(s, `The Secret Cards are dealt. The category: ${cat}.`);
  return startLap(s, now);
}
/* each duck on its own tile */
function toTiles(s) {
  const w = s.wq;
  for (const id of s.seat) {
    const k = w.ids.indexOf(id);
    s.pos[id] = k >= 0 ? { ...tileCenter(s, k, .62), j: 0 } : { x: .1 + Math.random() * .8, y: Math.random(), j: 0 };   // (a late joiner: anywhere)
  }
}
/* a lap of clues, in a new random order (never a Quack first) */
function startLap(s, now) {
  const w = s.wq, qs = quacksOf(s), order = shuffle(stillIn(s));
  if (qs.includes(order[0])) { const k = order.findIndex(id => !qs.includes(id)); if (k > 0) [order[0], order[k]] = [order[k], order[0]]; }
  w.lap++; w.order = order; w.turn = -1; w.tie = null; w.lastOut = null;
  toTiles(s);
  return nextClue(s, now);
}
function nextClue(s, now) {
  const w = s.wq; let t = w.turn + 1;
  while (t < w.order.length && (!s.players[w.order[t]] || w.out[w.order[t]])) t++;   // (gone, or voted out)
  if (t >= w.order.length) return startChoice(s, now);
  w.turn = t; s.qi++;
  return enter(s, 'clue', now);
}
export const speakerOf = s => s.wq && s.phase === 'clue' ? s.wq.order[s.wq.turn] : null;
function startChoice(s, now) {
  s.seat.forEach((id, k) => { s.pos[id] = { x: .5, y: (k + 1) / (s.seat.length + 1), j: 0 }; });   // on the strip between the two sides
  s.qi++;
  return enter(s, 'choice', now);
}
function startAccuse(s, now) {
  toTiles(s); s.qi++;
  return enter(s, 'accuse', now);
}
/* the votes are in: the duck with the most votes is out; a tie gets one revote between the tied ducks */
function endAccuse(s, now) {
  const w = s.wq, who = {}, n = {};
  for (const id of stillIn(s)) { const k = spotOf(s, s.pos[id]), t = k >= 0 ? w.ids[k] : null; if (canAccuse(s, id, t)) { who[id] = t; n[t] = (n[t] || 0) + 1; } }
  const top = Math.max(0, ...Object.values(n)), best = Object.keys(n).filter(t => n[t] === top);
  w.votes.push({ lap: w.lap, who, out: top && best.length === 1 ? best[0] : null });
  if (!top) { say(s, 'Nobody voted.'); return reveal(s, null, now); }
  if (best.length > 1) {
    if (!w.tie) { w.tie = best; say(s, `A tie! Vote again between ${best.map(id => s.players[id].name).join(' and ')}.`); s.qi++; return enter(s, 'accuse', now); }
    say(s, 'Tied again: nobody is voted out.'); w.tie = null;
    return reveal(s, null, now);
  }
  w.tie = null;
  return reveal(s, best[0], now);
}
/* someone is voted out (or nobody): did the room catch the Quack, or is only one other duck left? */
function reveal(s, out, now) {
  const w = s.wq; w.lastOut = out;
  if (out) { w.out[out] = true; say(s, `${s.players[out].name} was voted out.`); }
  checkEnd(s, now, true);
  return enter(s, 'reveal', now);
}
/* the round is over once no Quack is left in, or the Quacks are as many as everyone else (by a vote: the Quack wins; by
   players leaving: nobody does) */
function checkEnd(s, now, byVote) {
  const w = s.wq, qs = quacksOf(s); if (w.result || !s.hidden) return;
  const inn = stillIn(s), qIn = inn.filter(id => qs.includes(id)), others = inn.filter(id => !qs.includes(id));
  if (!qIn.length) return finish(s, qs.some(id => w.out[id]) ? 'room' : null, qs.some(id => w.out[id]) ? 'caught' : 'fled');
  if (others.length <= qIn.length) {
    if (!byVote) return finish(s, null, 'few');
    w.dead = others; for (const id of others) { s.players[id].dead = true; w.freeze[id] = now + 11000; }   // the last duck plays dead and can't move for a moment (5 s after the drumroll's news at 6.1 s)
    return finish(s, 'quack', 'last');
  }
}
function finish(s, win, why) {
  const w = s.wq, h = s.hidden;
  w.result = { win, why, word: h.word, quacks: [...h.quacks] };
  if (win) s.wqScore = { ...(s.wqScore || { quack: 0, room: 0 }), [win]: ((s.wqScore || {})[win] || 0) + 1 };
  s.wqPast = [...(s.wqPast || []), { round: s.round, word: h.word, cat: w.cat, picker: w.picker, quacks: [...h.quacks], ids: [...w.ids], win, why, votes: w.votes, laps: w.lap }];
  say(s, why === 'caught' ? `The room caught the Quack! The word was ${h.word}.` : why === 'last' ? `The Quack wins! The word was ${h.word}.` : why === 'fled' ? `The Quack fled! The word was ${h.word}.` : `Not enough ducks left. The word was ${h.word}.`);
}

/* ---------- the actions ---------- */
/* end: the speaker ends their clue turn, the others skip it; a vote on the two sides or for a duck; ready to move on */
export function quackEnd(s, a, now) {
  const w = s.wq, me = s.players[a.id]; if (!me || me.late || !w) return null;
  const inRound = w.ids.includes(a.id) && !w.out[a.id];
  if (s.phase === 'clue') {
    if (!inRound || now < s.at + CLUE_GRACE * 1000) return null;
    if (a.id === speakerOf(s)) return nextClue(s, now);
    if (s.done[a.id]) return null;
    s.done[a.id] = true; return quackAdvance(s, now);
  }
  if (s.phase === 'choice' || s.phase === 'accuse') {
    if (!inRound || s.done[a.id] || now < s.at + VOTE_GRACE * 1000) return null;
    const k = spotOf(s, s.pos[a.id]); if (k < 0) return null;
    if (s.phase === 'accuse' && !canAccuse(s, a.id, w.ids[k])) return null;
    s.done[a.id] = true; return quackAdvance(s, now);
  }
  if (s.phase === 'reveal') { if (frozen(s, a.id, now)) return null; s.done[a.id] = a.v ?? !s.done[a.id]; return quackAdvance(s, now); }
  return null;
}
/* what ends a phase of the round */
export function quackAdvance(s, now) {
  const w = s.wq; if (!w) return s;
  if (['clue', 'choice', 'accuse'].includes(s.phase)) { quackLeft(s, now); if (s.phase === 'reveal') return s; }   // (a Quack kicked or gone)
  const inn = stillIn(s), timeUp = !!s.ends && now >= s.ends;
  switch (s.phase) {
    case 'wqpick': {
      if (!timeUp && s.players[w.picker]) return s;
      const d = s.hidden && s.hidden.draft;   // what they had typed, or (none, or the picker left) a word from the list
      if (!s.players[w.picker]) say(s, 'The word picker left, so the word comes from the list.');
      return deal(s, d && d.word ? { word: d.word, cat: d.cat || 'No hint' } : anyWord(), now);
    }
    case 'clue': {
      const sp = speakerOf(s);
      if (!s.players[sp] || w.out[sp]) return nextClue(s, now);
      const others = inn.filter(id => id !== sp);
      if (others.length && others.every(id => s.done[id])) { say(s, `Everyone skipped ${s.players[sp].name}'s turn.`); return nextClue(s, now); }
      return s;
    }
    case 'choice': {
      if (!timeUp && !inn.every(id => s.done[id])) return s;
      let va = 0, vb = 0; for (const id of inn) { const c = spotOf(s, s.pos[id]); if (c === 0) va++; else if (c === 1) vb++; }
      if (vb > va) { say(s, `Another round of clues (${vb}–${va}).`); return startLap(s, now); }
      say(s, va === vb ? `Tied ${va}–${vb}, so it's time to vote.` : `Time to vote out the Quack (${va}–${vb}).`);
      return startAccuse(s, now);
    }
    case 'accuse':
      if (!timeUp && !inn.every(id => s.done[id])) return s;
      return endAccuse(s, now);
    case 'reveal': {
      const on = playing(s), d = on.filter(id => s.done[id]).length;
      if (d < on.length && d < needed(s)) return s;
      if (w.result) { for (const id of w.dead || []) if (s.players[id]) delete s.players[id].dead; return enter(s, 'results', now); }
      return startLap(s, now);
    }
  }
  return s;
}
/* someone left mid-round: a Quack gone, or too few left, ends it (a missing speaker or picker is passed over by advance) */
export function quackLeft(s, now) {
  if (!s.wq || !QUACK_PHASES.includes(s.phase) || s.phase === 'wqpick' || s.wq.result) return;
  checkEnd(s, now, false);
  if (s.wq.result && s.phase !== 'reveal') { s.wq.lastOut = null; enter(s, 'reveal', now); }
}
/* a moved duck: the last duck playing dead can't move for a moment */
export const holdStill = (s, id, now) => isQuack(s) && frozen(s, id, now);

/* ---------- stats ---------- */
/* over a list of finished rounds: correct votes (for a real Quack), votes, rounds as the Quack and won as the Quack, rounds won */
export function quackStats(list) {
  const per = {}, P = id => (per[id] = per[id] || { right: 0, votes: 0, quack: 0, quackWins: 0, wins: 0, losses: 0, outs: 0 });
  for (const r of list) {
    for (const v of r.votes || []) for (const [id, t] of Object.entries(v.who || {})) { P(id).votes++; if (r.quacks.includes(t)) P(id).right++; }
    for (const v of r.votes || []) if (v.out && !r.quacks.includes(v.out)) P(v.out).outs++;
    for (const id of r.ids || []) {
      const q = r.quacks.includes(id); if (q) P(id).quack++;
      if (!r.win) continue;
      if ((r.win === 'quack') === q) { P(id).wins++; if (q) P(id).quackWins++; } else P(id).losses++;
    }
  }
  return per;
}
