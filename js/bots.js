/* ---------- computers (TEST rooms) ----------
   Each computer waits the room's "computers wait" time (30 s by default) after a phase starts, then acts: writes a question,
   walks its duck to an answer (each computer leans one way) and ends its turn. Afterwards they follow the people: a
   computer moves on to the next question or round, or votes for the review or the end of the game, only once a person
   has. Now and then one wanders a little or jumps. In Bicker Brackets they write a topic and vote for one, type their
   seeds (for a ready-made topic, seeds that fit it) and back a side in each match. In Story Chain they write a secret word,
   type their line a few letters at a time (with their secret word in it), and vote once a person has. In Who is the Quack?
   they pick a word from the list, "say" a clue in a chat bubble (they can't talk), skip a turn only once a person has, and
   vote for a random duck, leaning a little toward the real Quack (a TEST room's computers can see the host's secrets). In
   Lawyering they pick or vote for attorneys, vote as jurors (now and then changing their minds in closing arguments) and,
   as an attorney behind in closing arguments, sometimes give up. In Duncelation they write a take, walk to Dunce or Not a
   Dunce once the grace period is over and vote (now and then changing their minds); a defender stays in the circle. In
   Mad God Justin they walk at Justin, stab him up close and now and then jump (his bullets fly under a jump). In
   Hangout they wander about Duck Cabin, stopping now and
   then, and jump once in a while (they never walk off an edge or up a wall). */
import * as HL from "./hangout/layout.js";
import { bjBot } from "./hangout/blackjack.js";
import { findPath } from "./hangout/npc.js";
import {
  colXAt,
  isHang,
  isWyr,
  isSc,
  isLaw,
  twoSided,
  isCounsel,
  jury,
  canGiveUp,
  BB_TOPICS,
  SC_WORDS,
  scWriter,
  scZones,
  scCanVote,
} from "./rules.js";
import {
  anyWord,
  tileCenter,
  spotOf,
  speakerOf,
  stillIn,
  canAccuse,
  CLUE_GRACE,
} from "./quackrules.js";
import {
  isDn,
  isDefender,
  voters,
  DN_GRACE,
  DUNCE_TAKES,
} from "./duncerules.js";
import { isMgj, mgjGone } from "./mgjrules.js";
import { justinAt } from "./boardjustin.js";

export const BOT_QUESTIONS = [
  "Pineapple belongs on pizza.",
  "A hot dog is a sandwich.",
  "Cereal is a soup.",
  "Cats are better than dogs.",
  "Mornings are the best part of the day.",
  "Socks with sandals look good.",
  "Water is wet.",
  "Ducks are secretly plotting something.",
  "Cold pizza beats hot pizza.",
  "The book is always better than the movie.",
  "Everyone should learn to cook.",
  "Summer is the best season.",
  "Video games are art.",
  "Ketchup goes on eggs.",
  "A tomato is a vegetable.",
  "Texting is better than calling.",
  "Spoilers ruin a story.",
  "Board games beat video games.",
  "Naps are underrated.",
  "Aliens have visited Earth.",
  "Homework should be banned.",
  "Cake is better than pie.",
  "Being early is being on time.",
  "Mint chocolate chip is the best ice cream.",
  "Every party needs a rubber duck.",
  "Dinosaurs were cooler than sharks.",
  "Breakfast for dinner is the best dinner.",
  "You can be friends with your ex.",
  "Clowns are scary.",
  "Robots will be our friends.",
];

export const BOT_WYR = [
  ["fight one horse-sized duck", "a hundred duck-sized horses"],
  ["only eat pizza", "never eat pizza again"],
  ["be able to fly", "be invisible"],
  ["always be ten minutes late", "always be twenty minutes early"],
  ["live without music", "live without movies"],
  ["talk to animals", "speak every language"],
  ["have a rewind button", "have a pause button"],
  ["never use a phone again", "never watch TV again"],
  ["be a famous singer", "be a famous athlete"],
  ["sweat syrup", "cry maple syrup"],
  ["live on the moon", "live under the sea"],
  ["have hiccups forever", "always feel a sneeze coming"],
];
/* seeds for the ready-made topics (in BB_TOPICS' order), and some for any topic */
const BB_SEEDS = [
  [
    "Nachos",
    "Popcorn",
    "Cookies",
    "Pretzels",
    "Cheese puffs",
    "Fruit snacks",
    "Ice cream",
    "Cold pizza",
  ],
  [
    "Biting your nails",
    "Being late",
    "Snoozing the alarm",
    "Doomscrolling",
    "Interrupting",
    "Leaving dishes out",
  ],
  [
    "Darth Vader",
    "The Joker",
    "Thanos",
    "Hannibal Lecter",
    "Voldemort",
    "Scar",
    "The Wicked Witch",
  ],
  [
    "Brunch",
    "Avocado toast",
    "Pumpkin spice",
    "Sports cars",
    "Fancy water",
    "Reality TV",
  ],
  [
    "Flying",
    "Teleporting",
    "Invisibility",
    "Time travel",
    "Super strength",
    "Reading minds",
  ],
  [
    "Folding laundry",
    "Dishes",
    "Taking out the trash",
    "Scrubbing the toilet",
    "Vacuuming",
    "Making the bed",
  ],
  [
    "Pepperoni",
    "Pineapple",
    "Mushrooms",
    "Extra cheese",
    "Olives",
    "Sausage",
    "Jalapeños",
  ],
  [
    "Nails on a chalkboard",
    "A dripping tap",
    "Chewing loudly",
    "An alarm clock",
    "A car alarm",
    "Snoring",
  ],
];
const ANY_SEEDS = [
  "Rubber ducks",
  "Grandma",
  "Tacos",
  "Naps",
  "Dinosaurs",
  "Socks",
  "Wi-Fi",
  "Pizza",
  "Mondays",
  "Cats",
  "Glitter",
  "The moon",
  "Pickles",
  "Bubble wrap",
];
/* Story Chain: lines with a place for the secret word */
const SC_LINES = [
  (w) =>
    `Out of nowhere a ${w} appeared, and everyone agreed not to talk about it.`,
  (w) =>
    `The duck stared at the ${w} for a very long time, then quacked twice and walked away.`,
  (w) =>
    `It was a perfectly normal day, apart from the ${w} sitting on the roof.`,
  (w) =>
    `Grandma said the ${w} was hers, which explained a lot about last Thanksgiving.`,
  (w) =>
    `So they hid the ${w} under the bed and hoped nobody would ask any questions.`,
  (w) =>
    `Suddenly the lights went out, and someone in the dark whispered "${w}" very slowly.`,
  (w) => `Nobody could explain why the ${w} was wet, but it definitely was.`,
  (w) => `Then the mayor showed up holding a ${w}, looking extremely proud.`,
  (w) => `It turns out the ${w} had been the real hero all along.`,
  (w) => `They held a vote, and the ${w} won by a landslide.`,
];
const anyOf = (xs) => xs[Math.floor(Math.random() * xs.length)];
const hash = (k) => {
  let h = 7;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h >>> 0;
};
const CLUES = [
  "Hmm… you see it everywhere.",
  "My uncle has strong feelings about it.",
  "It shows up in stories.",
  "Pretty famous.",
  "Kids love it.",
  "Not my favorite, honestly.",
  "It can get messy.",
  "Everybody knows one.",
  "Better with friends.",
  "I think about it way too much.",
  "Sometimes loud.",
  "Classic.",
];
const said = new Set(); // computer + clue turn: its clue is out
/* a step of a computer's walk toward (x, y); then, there, what it does next */
function walk(s, id, to, then, now) {
  const p = s.pos[id],
    step = 0.035,
    dx = to.x - p.x,
    dy = to.y - p.y,
    d = Math.hypot(dx, dy);
  if (d <= step)
    return [
      { t: "move", id, x: to.x, y: to.y, j: p.j && now - p.j < 1400 ? p.j : 0 },
      ...then,
    ];
  return [
    {
      t: "move",
      id,
      x: p.x + (dx / d) * step,
      y: p.y + (dy / d) * step,
      j: p.j && now - p.j < 1400 ? p.j : 0,
    },
  ];
}
const plan = new Map(); // computer id + question → its chosen column
const leanOf = (id) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (((h >>> 0) % 1000) / 1000) * 3 - 1.5;
};
const pick = (id, key) => {
  const k = id + "|" + key;
  if (!plan.has(k)) {
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 2.2;
    plan.set(k, Math.max(0, Math.min(6, Math.round(leanOf(id) + noise) + 3)));
    if (plan.size > 500) plan.delete(plan.keys().next().value);
  }
  return plan.get(k);
};

/* Lawyering: a juror walks to the side it leans to and votes; in closing arguments it may be talked round (it walks over
   and votes again). An attorney stays on its own side, and behind in closing arguments may give up. */
const swayed = new Map(); // computer id + case → the side it was talked round to
function lawBot(s, id, late, now, out) {
  const L = s.law;
  if (!L || L.w != null || !late) return;
  if (isCounsel(s, id)) {
    if (
      canGiveUp(s, id) &&
      now - (L.close - (+s.options.lawClose || 60) * 1000) > 8000 &&
      Math.random() < 0.004
    )
      out.push({ t: "giveUp", id });
    return;
  }
  if (!jury(s).includes(id)) return;
  const key = `${id}|${s.round}:${s.qi}`;
  if (
    L.close &&
    L.votes[id] !== undefined &&
    !swayed.has(key) &&
    Math.random() < 0.003
  ) {
    swayed.set(key, 1 - L.votes[id]);
    if (swayed.size > 300) swayed.delete(swayed.keys().next().value);
  }
  const side = swayed.has(key)
    ? swayed.get(key)
    : L.votes[id] !== undefined
      ? L.votes[id]
      : pick(id, s.round + ":" + s.qi) < 3 ||
          (pick(id, s.round + ":" + s.qi) === 3 && Math.random() < 0.5)
        ? 0
        : 1;
  if (L.votes[id] === side) return;
  const p = s.pos[id],
    want = colXAt(s, side),
    step = 0.035;
  if (Math.abs(p.x - want) <= step)
    out.push({ t: "move", id, x: want, y: p.y, j: p.j || 0 }, { t: "end", id });
  else
    out.push({
      t: "move",
      id,
      x: p.x + Math.sign(want - p.x) * step,
      y: p.y,
      j: p.j || 0,
    });
}

/* Duncelation: a voter walks to the side it leans to once the grace period is over, and votes; now and then it's talked
   round (it walks over and votes again) */
function dnBot(s, id, late, now, out) {
  const C = s.dn && s.dn.cur;
  if (
    !C ||
    C.w != null ||
    !late ||
    isDefender(s, id) ||
    !voters(s).includes(id) ||
    now < s.at + DN_GRACE * 1000
  )
    return;
  const key = `${id}|${s.round}:${s.qi}`,
    mine = C.votes[id];
  if (mine !== undefined && !swayed.has(key) && Math.random() < 0.002) {
    swayed.set(key, 1 - mine);
    if (swayed.size > 300) swayed.delete(swayed.keys().next().value);
  }
  const c = pick(id, s.round + ":" + s.qi),
    side = swayed.has(key)
      ? swayed.get(key)
      : mine !== undefined
        ? mine
        : c < 3 || (c === 3 && hash(key) % 2)
          ? 0
          : 1;
  if (mine === side) return;
  const p = s.pos[id],
    want = colXAt(s, side),
    step = 0.035;
  if (Math.abs(p.x - want) <= step)
    out.push({ t: "move", id, x: want, y: p.y, j: p.j || 0 }, { t: "end", id });
  else
    out.push({
      t: "move",
      id,
      x: p.x + Math.sign(want - p.x) * step,
      y: p.y,
      j: p.j || 0,
    });
}

/* Mad God Justin: up to him (stopping a little short, off to one side), a stab once he's in reach, a jump now and then */
const stabbed = new Map(); // computer id → when it last stabbed
function mgjBot(s, id, now, out) {
  const p = s.pos[id],
    P = s.players[id];
  if (!p || !P || P.dead || !s.justin || mgjGone(s, now)) return;
  const j = justinAt(s.justin, now),
    dx = (j.x - p.x) / 0.03,
    dy = (j.y - p.y) / 0.08,
    d = Math.hypot(dx, dy) || 1,
    len = Math.hypot(j.x - p.x, j.y - p.y) || 1,
    ax = +((j.x - p.x) / len).toFixed(3),
    ay = +((j.y - p.y) / len).toFixed(3);
  const air = p.j && now - p.j < 700,
    jump = !air && Math.random() < 0.015 ? now : air ? p.j : 0;
  const m = s.mgj || {},
    mine = (m.held || {})[id],
    pk = m.pick;
  if (mine && (mine !== "hammer" || d < 2.4)) {
    out.push({ t: "use", id, what: mine, face: ax < 0 ? -1 : 1, ax, ay });
    return;
  } // (a picked-up weapon: fire it at him; the hammer up close)
  if (
    pk &&
    ["hammer", "dagger", "handgun", "shotgun"].includes(pk.k) &&
    Math.hypot((pk.x - p.x) / 0.03, (pk.y - p.y) / 0.08) < d
  ) {
    const q = Math.hypot((pk.x - p.x) / 0.03, (pk.y - p.y) / 0.08) || 1,
      k = Math.min(1, 0.7 / q);
    out.push({
      t: "move",
      id,
      x: p.x + (pk.x - p.x) * k,
      y: p.y + (pk.y - p.y) * k,
      j: jump,
      w: "knife",
      ax,
      ay,
    });
    return;
  } // (a weapon nearer than he is: go get it)
  if (d > 1.6) {
    const k = Math.min(1, 0.7 / d);
    out.push({
      t: "move",
      id,
      x: p.x + (j.x - p.x) * k,
      y: p.y + (j.y - p.y) * k,
      j: jump,
      w: "knife",
      ax,
      ay,
    });
    return;
  }
  if (jump !== (p.j || 0))
    out.push({ t: "move", id, x: p.x, y: p.y, j: jump, w: "knife", ax, ay });
  if (now - (stabbed.get(id) || 0) > 1100 + Math.random() * 600) {
    stabbed.set(id, now);
    if (stabbed.size > 100) stabbed.delete(stabbed.keys().next().value);
    out.push({ t: "use", id, what: "knife", face: ax < 0 ? -1 : 1, ax, ay });
  }
}
/* what the computers do now; returns a list of actions */
export function botActions(s, now) {
  const out = [],
    wait = (s.options.botWait ?? 5) * 1000;
  const bots = s.seat.filter((id) => s.players[id] && s.players[id].bot);
  if (!bots.length) return out;
  const people = s.seat.filter((id) => !s.players[id].bot);
  bots.forEach((id, i) => {
    const late = now - s.at >= wait + i * 700; // they don't all move on the same instant
    if (isSc(s)) {
      storyBot(s, id, now, wait, late, people, out);
      return;
    }
    if (isMgj(s) && s.phase === "boss") {
      if (now - s.at > 1500 + i * 300) mgjBot(s, id, now, out);
      return;
    }
    if (isHang(s)) {
      if (s.phase === "hang") hangBot(s, id, now, out);
      else if (s.phase === "lobby" && !s.players[id].ready)
        out.push({ t: "ready", id, v: true });
      return;
    }
    switch (s.phase) {
      case "lobby":
      case "over":
        if (!s.players[id].ready) out.push({ t: "ready", id, v: true });
        break;
      case "topic":
        if (late && !s.done[id])
          out.push({
            t: "submit",
            id,
            text: Math.random() < 0.8 ? anyOf(BB_TOPICS) : "",
          });
        break;
      case "tvote":
        if (late && !s.done[id])
          out.push({
            t: "pick",
            id,
            i: Math.floor(Math.random() * s.bb.topics.length),
          });
        break;
      case "seeds":
        if (late && !s.done[id]) {
          const k = BB_TOPICS.indexOf(s.bb.topic),
            have = new Set(s.bb.seeds.map((x) => x.text)),
            pool = [...(BB_SEEDS[k] || []), ...ANY_SEEDS].filter(
              (x) => !have.has(x),
            );
          out.push({
            t: "submit",
            id,
            text: anyOf(pool.length ? pool : ANY_SEEDS),
          });
        }
        break;
      case "bracket":
        if (late && !s.done[id] && people.some((h) => s.done[h]))
          out.push({ t: "end", id, v: true });
        break;
      case "tie":
        if (late && !s.done[id])
          out.push({
            t: "tieVote",
            id,
            v: Math.random() < 0.5 ? "again" : "coin",
          });
        break;
      case "wqpick":
        if (late && s.wq.picker === id)
          out.push({ t: "wqWord", id, ...anyWord() });
        break;
      case "clue": {
        const w = s.wq,
          sp = speakerOf(s),
          key = id + "|" + s.round + "|" + s.qi;
        if (!w.ids.includes(id) || w.out[id]) break;
        if (sp === id) {
          if (now - s.at > 2500 && !said.has(key)) {
            said.add(key);
            if (said.size > 300) said.delete(said.values().next().value);
            out.push({ t: "chat", id, text: anyOf(CLUES) });
          }
          if (now - s.at > Math.max(wait, CLUE_GRACE * 1000 + 1500))
            out.push({ t: "end", id });
        } else if (
          !s.done[id] &&
          now - s.at > CLUE_GRACE * 1000 &&
          people.some((h) => s.done[h])
        )
          out.push({ t: "end", id });
        break;
      }
      case "choice":
      case "accuse": {
        const w = s.wq;
        if (!late || s.done[id] || !w.ids.includes(id) || w.out[id]) break;
        let to;
        if (s.phase === "choice") {
          const c = pick(id, s.round + ":" + s.qi);
          to = {
            x: colXAt(s, (w.lap > 1 ? c < 5 : c < 3) ? 0 : 1),
            y: s.pos[id].y,
          };
        } else {
          const q = (s.hidden || { quacks: [] }).quacks,
            them = stillIn(s).filter((t) => canAccuse(s, id, t));
          if (!them.length) break;
          const k = id + "|v|" + s.round + "|" + s.qi;
          if (!plan.has(k))
            plan.set(
              k,
              !q.includes(id) &&
                Math.random() < 0.4 &&
                them.some((t) => q.includes(t))
                ? them.find((t) => q.includes(t))
                : anyOf(them),
            );
          to = tileCenter(s, w.ids.indexOf(plan.get(k)));
        }
        out.push(
          ...walk(s, id, to, spotOf(s, to) >= 0 ? [{ t: "end", id }] : [], now),
        );
        break;
      }
      case "reveal":
        if (late && !s.done[id] && people.some((h) => s.done[h]))
          out.push({ t: "end", id, v: true });
        break;
      case "submit":
        if (late && !s.done[id]) {
          const pair = BOT_WYR[Math.floor(Math.random() * BOT_WYR.length)],
            skip = Math.random() >= 0.9;
          out.push(
            isWyr(s)
              ? {
                  t: "submit",
                  id,
                  a: skip ? "" : pair[0],
                  b: skip ? "" : pair[1],
                  time: 0,
                }
              : {
                  t: "submit",
                  id,
                  text: skip
                    ? ""
                    : anyOf(isDn(s) ? DUNCE_TAKES : BOT_QUESTIONS),
                  time: 0,
                },
          );
        }
        break;
      case "counsel": {
        if (!late || s.done[id]) break;
        const q = s.qs[s.qi],
          on = s.seat.filter((x) => s.players[x] && !s.players[x].late);
        for (const role of ["def", "off"]) {
          const how = s.law.how[role];
          if (
            !how ||
            (how === "writer" && id !== q.by) ||
            s.law.picks[role][id] !== undefined
          )
            continue;
          const can = on.filter((x) =>
            role === "def" ? x !== q.by : x !== s.law.def,
          );
          if (can.length) out.push({ t: "counsel", id, role, who: anyOf(can) });
        }
        break;
      }
      case "answer": {
        if (isLaw(s)) {
          lawBot(s, id, late, now, out);
          break;
        }
        if (isDn(s)) {
          dnBot(s, id, late, now, out);
          break;
        }
        if (!late || s.done[id]) break;
        const key = s.round + ":" + s.qi,
          c = pick(id, key),
          p = s.pos[id];
        const want = colXAt(
          s,
          twoSided(s) ? (c < 3 || (c === 3 && hash(id + key) % 2) ? 0 : 1) : c,
        ); // (a neutral one picks a side once, not every step)
        const x = p.x,
          y = p.y,
          step = 0.035;
        if (Math.abs(x - want) <= step)
          out.push(
            { t: "move", id, x: want, y, j: p.j || 0 },
            { t: "end", id, v: true },
          );
        // (v: a vote, never a take-back)
        else
          out.push({
            t: "move",
            id,
            x: x + Math.sign(want - x) * step,
            y,
            j: p.j || 0,
          });
        break;
      }
      case "discuss":
      case "results": {
        // ready for what's next only once a person is (so the results stay up until people vote them off)
        if (late && !s.done[id] && people.some((h) => s.done[h]))
          out.push({ t: "end", id, v: true });
        // now and then a little wander inside their column, or a jump
        const p = s.pos[id];
        if (p && p.x >= 0 && Math.random() < 0.012) {
          const jumpNow = !p.j && Math.random() < 0.35;
          out.push({
            t: "move",
            id,
            x: p.x + (Math.random() - 0.5) * 0.04,
            y: Math.max(0, Math.min(1, p.y + (Math.random() - 0.5) * 0.2)),
            j: jumpNow ? now : p.j && now - p.j < 1400 ? p.j : 0,
          });
        }
        if (s.phase === "results") {
          if (
            s.round >= 1 &&
            !s.reviewVotes[id] &&
            people.some((h) => s.reviewVotes[h])
          )
            out.push({ t: "voteReview", id });
        }
        break;
      }
    }
  });
  return out;
}
/* a computer in Hangout: walks toward a spot near it (world px), a little at a time; stops there a while; picks another
   spot when it gets there or something is in the way; now and then jumps */
const roam = new Map(); // computer id → { x, y, rest (until when it stands still) }
function hangBot(s, id, now, out) {
  const p = s.pos[id];
  if (!p) return;
  const bj = bjBot(s, id, now); // (the blackjack table: playing at it, or off to a free stool while a person plays)
  if (Array.isArray(bj)) {
    out.push(...bj);
    return;
  }
  if (Object.values((s.hang || {}).seats || {}).some((v) => v && v[0] === id))
    return; // (seated: it stays)
  const jumping = p.j && now - p.j < 1400;
  let x = p.x * HL.W,
    y = p.y * HL.H,
    z = HL.heightAt(x, y),
    g = roam.get(id);
  const there = g && Math.hypot(g.x - x, g.y - y) < 20;
  if (there && !g.rest) g.rest = now + 1000 + Math.random() * 4000; // there: it stands still a while
  if (bj) {
    // off to a stool: along a path round what's in the way (npc.js), then sit
    if (Math.hypot(bj.x - x, bj.y - y) < 30) {
      out.push({ t: "hang", k: "sit", seat: bj.seat, id });
      return;
    }
    if (!g || g.seat !== bj.seat || !g.path) {
      g = {
        seat: bj.seat,
        path: findPath(x, y, bj.x, bj.y) || [[bj.x, bj.y]],
        i: 0,
        rest: 0,
      };
      roam.set(id, g);
    }
    while (
      g.i < g.path.length - 1 &&
      Math.hypot(g.path[g.i][0] - x, g.path[g.i][1] - y) < 20
    )
      g.i++;
    [g.x, g.y] = g.path[g.i];
  } else if (g && g.seat) g = null;
  if (!g || (!g.seat && there && now > g.rest)) {
    g = {
      x: Math.max(
        HL.EDGE,
        Math.min(HL.W - HL.EDGE, x + (Math.random() - 0.5) * 900),
      ),
      y: Math.max(
        HL.EDGE,
        Math.min(HL.H - HL.EDGE, y + (Math.random() - 0.5) * 700),
      ),
      rest: 0,
    };
    roam.set(id, g);
    if (roam.size > 100) roam.delete(roam.keys().next().value);
  }
  const jump = !jumping && Math.random() < 0.006;
  if (Math.hypot(g.x - x, g.y - y) < 20 && !jump) return;
  const d = Math.hypot(g.x - x, g.y - y),
    n = Math.min(6, Math.ceil(d / 12)),
    ux = d ? (g.x - x) / d : 0,
    uy = d ? (g.y - y) / d : 0;
  for (let i = 0; i < n; i++) {
    // 12 px at a time: up or down a step at most, never through a wall
    const nx = x + ux * Math.min(12, d - i * 12),
      ny = y + uy * Math.min(12, d - i * 12),
      nz = HL.heightAt(nx, ny);
    if (
      Math.abs(nz - z) > HL.STEP ||
      !HL.standable(nx, ny, z, HL.STEP, [x, y])
    ) {
      if (g.seat) g.path = null;
      else {
        g.x = x;
        g.y = y;
        g.rest = now + 800;
      }
      break;
    } // in the way: another spot soon (or another path)
    x = nx;
    y = ny;
    z = nz;
  }
  out.push({
    t: "move",
    id,
    x: +(x / HL.W).toFixed(5),
    y: +(y / HL.H).toFixed(5),
    j: jump ? now : jumping ? p.j : 0,
    z: Math.round(z),
    b: jump ? Math.round(z) : jumping ? p.b || 0 : Math.round(z),
  });
}
/* a computer in Story Chain */
function storyBot(s, id, now, wait, late, people, out) {
  const p = s.pos[id],
    wander = () => {
      // now and then a little walk, or a jump
      if (p && Math.random() < 0.012)
        out.push({
          t: "move",
          id,
          x: Math.max(0.03, Math.min(0.97, p.x + (Math.random() - 0.5) * 0.1)),
          y: Math.max(0, Math.min(1, p.y + (Math.random() - 0.5) * 0.04)),
          j:
            !p.j && Math.random() < 0.35
              ? now
              : p.j && now - p.j < 1400
                ? p.j
                : 0,
        });
    };
  switch (s.phase) {
    case "lobby":
    case "over":
      if (!s.players[id].ready) out.push({ t: "ready", id, v: true });
      return;
    case "words":
      if (late && !s.done[id])
        out.push({ t: "submit", id, text: anyOf(SC_WORDS) });
      return;
    case "write": {
      if (scWriter(s) !== id) {
        wander();
        return;
      }
      if (!late || s.done[id]) return;
      const word = (s.sc.assign[id] || {}).word || "duck",
        line =
          SC_LINES[hash(id + s.round + ":" + s.sc.turn) % SC_LINES.length](
            word,
          );
      const k = Math.floor(((now - s.at - wait) / 1000) * 16),
        have = ((s.drafts || {})[id] || {}).text || ""; // 16 letters a second
      if (k >= line.length) out.push({ t: "submit", id, text: line });
      else if (k > have.length)
        out.push({ t: "draft", id, text: line.slice(0, k) });
      return;
    }
    case "lvote":
    case "wvote":
    case "results": {
      if (
        s.phase === "results" &&
        s.round >= 1 &&
        !s.reviewVotes[id] &&
        people.some((h) => s.reviewVotes[h])
      )
        out.push({ t: "voteReview", id });
      if (!p || s.done[id] || !late || !people.some((h) => s.done[h])) {
        wander();
        return;
      }
      const zones = scZones(s),
        ok = zones.map((z, j) => [z, j]).filter(([z]) => scCanVote(s, id, z));
      if (!ok.length) return;
      const pref =
        s.phase === "results" && hash(id + s.round) % 10 < 7
          ? ok.find(([z]) => z === "C:cont")
          : null;
      const [, j] = pref || ok[hash(id + s.phase + s.round) % ok.length],
        want = (j + 0.5) / zones.length,
        step = 0.5 / zones.length;
      if (Math.abs(p.y - want) <= step)
        out.push(
          { t: "move", id, x: p.x, y: want, j: p.j || 0 },
          { t: "end", id, y: want },
        );
      else
        out.push({
          t: "move",
          id,
          x: p.x,
          y: p.y + Math.sign(want - p.y) * step,
          j: p.j || 0,
        });
    }
  }
}
