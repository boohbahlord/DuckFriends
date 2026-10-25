/* ---------- computers (TEST rooms) ----------
   Each computer waits the room's "computers wait" time (30 s by default) after a phase starts, then acts: writes a question,
   walks its duck to an answer (each computer leans one way) and ends its turn. Afterwards they follow the people: a
   computer moves on to the next question or round, or votes for the review or the end of the game, only once a person
   has. Now and then one wanders a little or jumps. In Bicker Brackets they write a topic and vote for one, type their
   seeds (for a ready-made topic, seeds that fit it) and back a side in each match. In Story Chain they write a secret word,
   type their line a few letters at a time (with their secret word in it), and vote once a person has. In Lawyering they
   pick or vote for attorneys, vote as jurors (now and then changing their minds in closing arguments) and, as an
   attorney behind in closing arguments, sometimes give up. */
import { colXAt, isWyr, isSc, isLaw, twoSided, isCounsel, jury, canGiveUp, BB_TOPICS, SC_WORDS, scWriter, scZones, scCanVote } from './rules.js';

export const BOT_QUESTIONS = [
  'Pineapple belongs on pizza.', 'A hot dog is a sandwich.', 'Cereal is a soup.', 'Cats are better than dogs.',
  'Mornings are the best part of the day.', 'Socks with sandals look good.', 'Water is wet.', 'Ducks are secretly plotting something.',
  'Cold pizza beats hot pizza.', 'The book is always better than the movie.', 'Everyone should learn to cook.',
  'Summer is the best season.', 'Video games are art.', 'Ketchup goes on eggs.', 'A tomato is a vegetable.',
  'Texting is better than calling.', 'Spoilers ruin a story.', 'Board games beat video games.', 'Naps are underrated.',
  'Aliens have visited Earth.', 'Homework should be banned.', 'Cake is better than pie.', 'Being early is being on time.',
  'Mint chocolate chip is the best ice cream.', 'Every party needs a rubber duck.', 'Dinosaurs were cooler than sharks.',
  'Breakfast for dinner is the best dinner.', 'You can be friends with your ex.', 'Clowns are scary.', 'Robots will be our friends.',
];

export const BOT_WYR = [
  ['fight one horse-sized duck', 'a hundred duck-sized horses'], ['only eat pizza', 'never eat pizza again'], ['be able to fly', 'be invisible'],
  ['always be ten minutes late', 'always be twenty minutes early'], ['live without music', 'live without movies'], ['talk to animals', 'speak every language'],
  ['have a rewind button', 'have a pause button'], ['never use a phone again', 'never watch TV again'], ['be a famous singer', 'be a famous athlete'],
  ['sweat syrup', 'cry maple syrup'], ['live on the moon', 'live under the sea'], ['have hiccups forever', 'always feel a sneeze coming'],
];
/* seeds for the ready-made topics (in BB_TOPICS' order), and some for any topic */
const BB_SEEDS = [
  ['Nachos', 'Popcorn', 'Cookies', 'Pretzels', 'Cheese puffs', 'Fruit snacks', 'Ice cream', 'Cold pizza'],
  ['Biting your nails', 'Being late', 'Snoozing the alarm', 'Doomscrolling', 'Interrupting', 'Leaving dishes out'],
  ['Darth Vader', 'The Joker', 'Thanos', 'Hannibal Lecter', 'Voldemort', 'Scar', 'The Wicked Witch'],
  ['Brunch', 'Avocado toast', 'Pumpkin spice', 'Sports cars', 'Fancy water', 'Reality TV'],
  ['Flying', 'Teleporting', 'Invisibility', 'Time travel', 'Super strength', 'Reading minds'],
  ['Folding laundry', 'Dishes', 'Taking out the trash', 'Scrubbing the toilet', 'Vacuuming', 'Making the bed'],
  ['Pepperoni', 'Pineapple', 'Mushrooms', 'Extra cheese', 'Olives', 'Sausage', 'Jalapeños'],
  ['Nails on a chalkboard', 'A dripping tap', 'Chewing loudly', 'An alarm clock', 'A car alarm', 'Snoring'],
];
const ANY_SEEDS = ['Rubber ducks', 'Grandma', 'Tacos', 'Naps', 'Dinosaurs', 'Socks', 'Wi-Fi', 'Pizza', 'Mondays', 'Cats', 'Glitter', 'The moon', 'Pickles', 'Bubble wrap'];
/* Story Chain: lines with a place for the secret word */
const SC_LINES = [
  w => `Out of nowhere a ${w} appeared, and everyone agreed not to talk about it.`,
  w => `The duck stared at the ${w} for a very long time, then quacked twice and walked away.`,
  w => `It was a perfectly normal day, apart from the ${w} sitting on the roof.`,
  w => `Grandma said the ${w} was hers, which explained a lot about last Thanksgiving.`,
  w => `So they hid the ${w} under the bed and hoped nobody would ask any questions.`,
  w => `Suddenly the lights went out, and someone in the dark whispered "${w}" very slowly.`,
  w => `Nobody could explain why the ${w} was wet, but it definitely was.`,
  w => `Then the mayor showed up holding a ${w}, looking extremely proud.`,
  w => `It turns out the ${w} had been the real hero all along.`,
  w => `They held a vote, and the ${w} won by a landslide.`,
];
const anyOf = xs => xs[Math.floor(Math.random() * xs.length)];
const hash = k => { let h = 7; for (const c of k) h = (h * 31 + c.charCodeAt(0)) | 0; return h >>> 0; };
const plan = new Map();   // computer id + question → its chosen column
const leanOf = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; return ((h >>> 0) % 1000) / 1000 * 3 - 1.5; };
const pick = (id, key) => {
  const k = id + '|' + key;
  if (!plan.has(k)) {
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 2.2;
    plan.set(k, Math.max(0, Math.min(6, Math.round(leanOf(id) + noise) + 3)));
    if (plan.size > 500) plan.delete(plan.keys().next().value);
  }
  return plan.get(k);
};

/* Lawyering: a juror walks to the side it leans to and votes; in closing arguments it may be talked round (it walks over
   and votes again). An attorney stays in the circle, and behind in closing arguments may give up. */
const swayed = new Map();   // computer id + case → the side it was talked round to
function lawBot(s, id, late, now, out) {
  const L = s.law; if (!L || L.w != null || !late) return;
  if (isCounsel(s, id)) { if (canGiveUp(s, id) && now - (L.close - (+s.options.lawClose || 60) * 1000) > 8000 && Math.random() < .004) out.push({ t: 'giveUp', id }); return; }
  if (!jury(s).includes(id)) return;
  const key = `${id}|${s.round}:${s.qi}`;
  if (L.close && L.votes[id] !== undefined && !swayed.has(key) && Math.random() < .003) { swayed.set(key, 1 - L.votes[id]); if (swayed.size > 300) swayed.delete(swayed.keys().next().value); }
  const side = swayed.has(key) ? swayed.get(key) : L.votes[id] !== undefined ? L.votes[id] : (pick(id, s.round + ':' + s.qi) < 3 || (pick(id, s.round + ':' + s.qi) === 3 && Math.random() < .5) ? 0 : 1);
  if (L.votes[id] === side) return;
  const p = s.pos[id], want = colXAt(s, side), step = .035;
  if (Math.abs(p.x - want) <= step) out.push({ t: 'move', id, x: want, y: p.y, j: p.j || 0 }, { t: 'end', id });
  else out.push({ t: 'move', id, x: p.x + Math.sign(want - p.x) * step, y: p.y, j: p.j || 0 });
}

/* what the computers do now; returns a list of actions */
export function botActions(s, now) {
  const out = [], wait = (s.options.botWait ?? 5) * 1000;
  const bots = s.seat.filter(id => s.players[id] && s.players[id].bot);
  if (!bots.length) return out;
  const people = s.seat.filter(id => !s.players[id].bot);
  bots.forEach((id, i) => {
    const late = now - s.at >= wait + i * 700;   // they don't all move on the same instant
    if (isSc(s)) { storyBot(s, id, now, wait, late, people, out); return; }
    switch (s.phase) {
      case 'lobby': case 'over':
        if (!s.players[id].ready) out.push({ t: 'ready', id, v: true }); break;
      case 'topic':
        if (late && !s.done[id]) out.push({ t: 'submit', id, text: Math.random() < .8 ? anyOf(BB_TOPICS) : '' });
        break;
      case 'tvote':
        if (late && !s.done[id]) out.push({ t: 'pick', id, i: Math.floor(Math.random() * s.bb.topics.length) });
        break;
      case 'seeds':
        if (late && !s.done[id]) {
          const k = BB_TOPICS.indexOf(s.bb.topic), have = new Set(s.bb.seeds.map(x => x.text)), pool = [...(BB_SEEDS[k] || []), ...ANY_SEEDS].filter(x => !have.has(x));
          out.push({ t: 'submit', id, text: anyOf(pool.length ? pool : ANY_SEEDS) });
        }
        break;
      case 'bracket':
        if (late && !s.done[id] && people.some(h => s.done[h])) out.push({ t: 'end', id, v: true });
        break;
      case 'tie':
        if (late && !s.done[id]) out.push({ t: 'tieVote', id, v: Math.random() < .5 ? 'again' : 'coin' });
        break;
      case 'submit':
        if (late && !s.done[id]) {
          const pair = BOT_WYR[Math.floor(Math.random() * BOT_WYR.length)], skip = Math.random() >= .9;
          out.push(isWyr(s) ? { t: 'submit', id, a: skip ? '' : pair[0], b: skip ? '' : pair[1], time: 0 } : { t: 'submit', id, text: skip ? '' : BOT_QUESTIONS[Math.floor(Math.random() * BOT_QUESTIONS.length)], time: 0 });
        }
        break;
      case 'counsel': {
        if (!late || s.done[id]) break;
        const q = s.qs[s.qi], on = s.seat.filter(x => s.players[x] && !s.players[x].late);
        for (const role of ['def', 'off']) {
          const how = s.law.how[role]; if (!how || (how === 'writer' && id !== q.by) || s.law.picks[role][id] !== undefined) continue;
          const can = on.filter(x => role === 'def' ? x !== q.by : x !== s.law.def);
          if (can.length) out.push({ t: 'counsel', id, role, who: anyOf(can) });
        }
        break;
      }
      case 'answer': {
        if (isLaw(s)) { lawBot(s, id, late, now, out); break; }
        if (!late || s.done[id]) break;
        const key = s.round + ':' + s.qi, c = pick(id, key), p = s.pos[id];
        const want = colXAt(s, twoSided(s) ? (c < 3 || (c === 3 && hash(id + key) % 2) ? 0 : 1) : c);   // (a neutral one picks a side once, not every step)
        const x = p.x, y = p.y, step = .035;
        if (Math.abs(x - want) <= step) out.push({ t: 'move', id, x: want, y, j: p.j || 0 }, { t: 'end', id });
        else out.push({ t: 'move', id, x: x + Math.sign(want - x) * step, y, j: p.j || 0 });
        break;
      }
      case 'discuss': case 'results': {
        // ready for what's next only once a person is (so the results stay up until people vote them off)
        if (late && !s.done[id] && people.some(h => s.done[h])) out.push({ t: 'end', id, v: true });
        // now and then a little wander inside their column, or a jump
        const p = s.pos[id];
        if (p && p.x >= 0 && Math.random() < .012) {
          const jumpNow = !p.j && Math.random() < .35;
          out.push({ t: 'move', id, x: p.x + (Math.random() - .5) * .04, y: Math.max(0, Math.min(1, p.y + (Math.random() - .5) * .2)), j: jumpNow ? now : (p.j && now - p.j < 1400 ? p.j : 0) });
        }
        if (s.phase === 'results') {
          if (s.round >= 1 && !s.reviewVotes[id] && people.some(h => s.reviewVotes[h])) out.push({ t: 'voteReview', id });
        }
        break;
      }
    }
  });
  return out;
}
/* a computer in Story Chain */
function storyBot(s, id, now, wait, late, people, out) {
  const p = s.pos[id], wander = () => {   // now and then a little walk, or a jump
    if (p && Math.random() < .012) out.push({ t: 'move', id, x: Math.max(.03, Math.min(.97, p.x + (Math.random() - .5) * .1)), y: Math.max(0, Math.min(1, p.y + (Math.random() - .5) * .04)), j: !p.j && Math.random() < .35 ? now : (p.j && now - p.j < 1400 ? p.j : 0) });
  };
  switch (s.phase) {
    case 'lobby': case 'over': if (!s.players[id].ready) out.push({ t: 'ready', id, v: true }); return;
    case 'words': if (late && !s.done[id]) out.push({ t: 'submit', id, text: anyOf(SC_WORDS) }); return;
    case 'write': {
      if (scWriter(s) !== id) { wander(); return; }
      if (!late || s.done[id]) return;
      const word = (s.sc.assign[id] || {}).word || 'duck', line = SC_LINES[hash(id + s.round + ':' + s.sc.turn) % SC_LINES.length](word);
      const k = Math.floor((now - s.at - wait) / 1000 * 16), have = ((s.drafts || {})[id] || {}).text || '';   // 16 letters a second
      if (k >= line.length) out.push({ t: 'submit', id, text: line });
      else if (k > have.length) out.push({ t: 'draft', id, text: line.slice(0, k) });
      return;
    }
    case 'lvote': case 'wvote': case 'results': {
      if (s.phase === 'results' && s.round >= 1 && !s.reviewVotes[id] && people.some(h => s.reviewVotes[h])) out.push({ t: 'voteReview', id });
      if (!p || s.done[id] || !late || !people.some(h => s.done[h])) { wander(); return; }
      const zones = scZones(s), ok = zones.map((z, j) => [z, j]).filter(([z]) => scCanVote(s, id, z)); if (!ok.length) return;
      const pref = s.phase === 'results' && hash(id + s.round) % 10 < 7 ? ok.find(([z]) => z === 'C:cont') : null;
      const [, j] = pref || ok[hash(id + s.phase + s.round) % ok.length], want = (j + .5) / zones.length, step = .5 / zones.length;
      if (Math.abs(p.y - want) <= step) out.push({ t: 'move', id, x: p.x, y: want, j: p.j || 0 }, { t: 'end', id, y: want });
      else out.push({ t: 'move', id, x: p.x, y: p.y + Math.sign(want - p.y) * step, j: p.j || 0 });
    }
  }
}
