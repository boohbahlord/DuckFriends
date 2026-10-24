/* ---------- computers (TEST rooms) ----------
   Each computer waits the room's "computers wait" time (30 s by default) after a phase starts, then acts: writes a question,
   walks its duck to an answer (each computer leans one way) and ends its turn. Afterwards they follow the people: a
   computer moves on to the next question or round, or votes for the review or the end of the game, only once a person
   has. Now and then one wanders a little or jumps. */
import { colX } from './rules.js';

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

/* what the computers do now; returns a list of actions */
export function botActions(s, now) {
  const out = [], wait = (s.options.botWait ?? 30) * 1000;
  const bots = s.seat.filter(id => s.players[id] && s.players[id].bot);
  if (!bots.length) return out;
  const people = s.seat.filter(id => !s.players[id].bot);
  bots.forEach((id, i) => {
    const late = now - s.at >= wait + i * 700;   // they don't all move on the same instant
    switch (s.phase) {
      case 'lobby': case 'over':
        if (!s.players[id].ready) out.push({ t: 'ready', id, v: true }); break;
      case 'submit':
        if (late && !s.done[id]) out.push({ t: 'submit', id, text: Math.random() < .9 ? BOT_QUESTIONS[Math.floor(Math.random() * BOT_QUESTIONS.length)] : '', time: 0 });
        break;
      case 'answer': {
        if (!late || s.done[id]) break;
        const p = s.pos[id], want = colX(pick(id, s.round + ':' + s.qi));
        const x = p.x < 0 ? .5 : p.x, y = p.x < 0 ? .2 + (i * .23) % .7 : p.y, step = .035;   // each computer walks its own line
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
          if (!s.endVotes[id] && people.some(h => s.endVotes[h])) out.push({ t: 'voteEnd', id });
          if (s.endVotes[id] && !people.some(h => s.endVotes[h])) out.push({ t: 'voteEnd', id });   // a person took theirs back
        }
        break;
      }
    }
  });
  return out;
}
