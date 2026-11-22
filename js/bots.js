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
   then, and jump once in a while (they never walk off an edge or up a wall). In Quacky Zombies they fight the zombies
   and revive each other (below: the computers on a walkable map). */
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
  canEndRound,
  endDone,
  playing,
  OPTIONS_DEFAULT,
  inWorld,
} from "./rules.js";
import { walkOf } from "./push.js";
import { voteIds, DICE } from "./voterules.js";
import { isCounsel, jury, canGiveUp, attCands, attRole } from "./lawrules.js";
import { SC_WORDS, scWriter, scZones, scCanVote } from "./scrules.js";
import { BB_TOPICS } from "./bbrules.js";
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
import { isMgj, mgjGone, PICK_WEAPONS } from "./mgjrules.js";
import {
  isL4dd,
  L4,
  WALK,
  startSpot,
  playable,
  l4Up,
  l4Cool,
  kitOf,
  ptsOf,
  upOf,
  priceOf,
  maxHp,
  SHOP,
  merchantOf,
  upOffer,
  selling,
  BOX,
  boxNow,
  isHelper,
  laserHeat,
  wildCrying,
  isWild,
  endless,
  hasLeft,
} from "./l4ddrules.js";
import { kindOf, MGJ_MELEE } from "./guns.js";
import { draws } from "./bowdraw.js";
import { gunsIn, itemsIn, PRIMARY } from "./kitslots.js";
import { lootAt } from "./l4ddloot.js";
import {
  isVd,
  VD_PHASES,
  VD_TOPICS,
  isDate,
  seated,
  vdTileRects,
} from "./vddrules.js";
import { justinAt } from "./boardjustin.js";
import {
  isTv,
  TV_PHASES,
  TV_ROWS_END,
  tvQ,
  isWriter,
  answerers,
  needOf,
  doneN,
  canEnd,
  rowCount,
  tvRowAt,
  mcOn,
} from "./triviarules.js";
import { TV_BANK } from "./triviabank.js";
import { SPRINT as GAME_SPRINT } from "./gamedefaults.js";
import { W, H, heightAt, standable, STEP } from "./hangout/layout.js";
import { spotIn } from "./walkgrid.js";
import { zombiesOf, wayTo, clearShot } from "./zombies.js";
import { isSurv } from "./survrules.js";
import { WANDER } from "./hangout/justin.js";
import { NPC_RUN } from "./npcshared.js";
import { anyOf, shuffle } from "./random.js";
import { sees as npcSees } from "./npcrules.js";
import {
  BOT_QUESTIONS,
  BOT_WYR,
  BB_SEEDS,
  ANY_SEEDS,
  SC_LINES,
  CLUES,
  TV_BOT_WRITTEN,
  TV_BOT_ANSWERS,
} from "./botlines.js";

const hash = (k) => {
  let h = 7;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h >>> 0;
};
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

/* Lawyering and Duncelation: a voter walks to the side it leans to and votes; now and then it's talked round (it walks over
   and votes again). In Lawyering only in closing arguments; an attorney stays on its own side, and behind in closing
   arguments may give up. In Duncelation it waits for the grace period, and a defender stays in the circle */
const swayed = new Map(); // computer id + case → the side it was talked round to
/* talked round, now and then (chance each heartbeat), once it has voted */
function sway(key, mine, chance) {
  if (mine !== undefined && !swayed.has(key) && Math.random() < chance) {
    swayed.set(key, 1 - mine);
    if (swayed.size > 300) swayed.delete(swayed.keys().next().value);
  }
}
/* the side it wants: talked round, else its vote, else its lean (c, 0 … 6; a 3 goes either way: tie()) */
const sideOf = (key, mine, c, tie) =>
  swayed.has(key)
    ? swayed.get(key)
    : mine !== undefined
      ? mine
      : c() < 3 || (c() === 3 && tie())
        ? 0
        : 1;
/* a step toward that side's column; there, it votes */
function toSide(s, id, side, out) {
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
  if (L.close) sway(key, L.votes[id], 0.003);
  const side = sideOf(
    key,
    L.votes[id],
    () => pick(id, s.round + ":" + s.qi),
    () => Math.random() < 0.5,
  );
  if (L.votes[id] !== side) toSide(s, id, side, out);
}
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
  sway(key, mine, 0.002);
  const c = pick(id, s.round + ":" + s.qi),
    side = sideOf(
      key,
      mine,
      () => c,
      () => hash(key) % 2,
    );
  if (mine !== side) toSide(s, id, side, out);
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
  if (mine === "medkit" && (m.lost || {})[id] > 0)
    out.push({ t: "use", id, what: mine, face: 1 }); // (hurt: the medkit)
  else if (mine && mine !== "medkit") {
    out.push({ t: "use", id, what: mine, face: ax < 0 ? -1 : 1, ax, ay });
    return;
  } // (a gun picked up: fire it at him)
  if (
    pk &&
    PICK_WEAPONS.includes(pk.k) &&
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
      w: MGJ_MELEE,
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
      w: MGJ_MELEE,
      ax,
      ay,
    });
    return;
  }
  if (jump !== (p.j || 0))
    out.push({ t: "move", id, x: p.x, y: p.y, j: jump, w: MGJ_MELEE, ax, ay });
  if (now - (stabbed.get(id) || 0) > 1100 + Math.random() * 600) {
    stabbed.set(id, now);
    if (stabbed.size > 100) stabbed.delete(stabbed.keys().next().value);
    out.push({ t: "use", id, what: MGJ_MELEE, face: ax < 0 ? -1 : 1, ax, ay });
  }
}
/* Valentine's Duck Date: a computer that is The Date writes a topic, lets the date run (with the timer off, it moves on
   after a while) and picks a tile (now and then none); everyone else not at the table wanders about and jumps now and
   then */
const goal = new Map(); // computer id + pick → the spot it walks to
function vdBot(s, id, now, late, out) {
  const p = s.pos[id],
    V = s.vd;
  if (!p || !V) return;
  if (isDate(s, id)) {
    if (s.phase === "vdprompt" && late)
      out.push({ t: "submit", id, text: anyOf(VD_TOPICS) });
    if (s.phase === "vddate" && V.tm && !V.tm.run && now - s.at > 2500)
      out.push({ t: "vdTimer", id }); // (a computer as The Date starts the timer, and the timer ends the date)
    if (s.phase === "vddate" && !V.tm && now - s.at > 20000)
      out.push({ t: "end", id });
    if (s.phase === "vdpick" && late) {
      const key = `${id}|${V.n}`;
      if (!goal.has(key)) {
        const rs = vdTileRects((V.ids || []).length),
          r = Math.random() < 0.15 ? null : anyOf(rs);
        goal.set(
          key,
          r
            ? { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 }
            : { x: p.x, y: p.y },
        );
        if (goal.size > 100) goal.delete(goal.keys().next().value);
      }
      out.push(...walk(s, id, goal.get(key), [{ t: "end", id }], now));
    }
    return;
  }
  if (seated(s, id) || Math.random() > 0.02) return;
  const jumpNow = !p.j && Math.random() < 0.3;
  out.push({
    t: "move",
    id,
    x: Math.max(0.03, Math.min(0.97, p.x + (Math.random() - 0.5) * 0.12)),
    y: Math.max(0, Math.min(1, p.y + (Math.random() - 0.5) * 0.12)),
    j: jumpNow ? now : p.j && now - p.j < 1400 ? p.j : 0,
  });
}
/* Trivia: a computer writes one of the auto questions (now and then a written one), walks onto answers and votes for
   them (right a little more often than not: a TEST room's computers can see the answer), types a written answer, and as
   the writer walks to each row and grades it. It presses End round only once every duck has voted and a while has
   passed, so a person usually gets there first */
const tvPlan = new Map(); // computer id + question → the rows it votes for
function tvBot(s, id, now, late, out) {
  const T = s.tv,
    q = tvQ(s),
    p = s.pos[id];
  if (s.phase === "tvwrite") {
    if (!late || s.done[id]) return;
    if (!mcOn(s) || Math.random() < 0.2) {
      out.push({
        t: "submit",
        id,
        q: { text: anyOf(TV_BOT_WRITTEN), kind: "wr", ans: [], ok: [] },
      });
      return;
    }
    const [text, ans, ok = 0] = anyOf(TV_BANK);
    out.push({ t: "submit", id, q: { text, kind: "mc", ans, ok: [ok] } });
    return;
  }
  if (!q || !p) return;
  const rowSpot = (i) => ({
    x: 0.2 + (hash(id) % 60) / 100,
    y: ((i + 0.55) / rowCount(s)) * TV_ROWS_END,
  });
  if (
    s.phase === "tvq" &&
    canEnd(s) &&
    doneN(s) >= answerers(s).length &&
    now - s.at > 15000 + (hash(id) % 5000)
  ) {
    out.push({ t: "tv", id, k: "end" });
    return;
  }
  if (s.phase === "tvq" && late && answerers(s).includes(id)) {
    const key = `${id}|${T.n}`;
    if (!tvPlan.has(key)) {
      const rows = q.ans.map((_, i) => i),
        right = Math.random() < 0.6 && q.ok.length,
        k = needOf(q);
      tvPlan.set(key, right ? [...q.ok] : shuffle(rows).slice(0, k));
      if (tvPlan.size > 200) tvPlan.delete(tvPlan.keys().next().value);
    }
    const mine = T.votes[id] || [],
      next = tvPlan.get(key).find((i) => !mine.includes(i));
    if (next === undefined) return;
    out.push(
      ...walk(s, id, rowSpot(next), [{ t: "tv", id, k: "pick", i: next }], now),
    );
    return;
  }
  if (s.phase === "tvw" && late && T.ids.includes(id) && !T.sent[id]) {
    out.push({ t: "submit", id, text: anyOf(TV_BOT_ANSWERS) });
    return;
  }
  if (s.phase === "tvg" && isWriter(s, id) && now - s.at > 2500) {
    const k = T.ids.findIndex((x) => T.grades[x] === undefined && T.text[x]);
    if (k < 0) return;
    const there = tvRowAt(s, p) === k;
    out.push(
      ...walk(
        s,
        id,
        rowSpot(k),
        there
          ? [{ t: "tv", id, k: "grade", i: k, ok: Math.random() < 0.6 }]
          : [],
        now,
      ),
    );
    return;
  }
  if (Math.random() > 0.015) return;
  out.push({
    t: "move",
    id,
    x: Math.max(0.03, Math.min(0.97, p.x + (Math.random() - 0.5) * 0.12)),
    y: Math.max(0, Math.min(1, p.y + (Math.random() - 0.5) * 0.06)),
    j: !p.j && Math.random() < 0.3 ? now : 0,
  });
}
/* what the computers do now; returns a list of actions. A computer draws the bow again the moment it lets go, as a
   player holding the button would (bowdraw.js): its next arrow flies with the draw it held since */
export const botActions = (s, now) =>
  botThink(s, now).flatMap((a) =>
    a.t === "use" && draws(a.what)
      ? [a, { t: "draw", id: a.id, w: a.what }]
      : [a],
  );
function botThink(s, now) {
  const out = [],
    wait = (s.options.botWait ?? OPTIONS_DEFAULT.botWait) * 1000;
  const bots = s.seat.filter((id) => s.players[id] && s.players[id].bot);
  if (!bots.length) return out;
  const people = s.seat.filter((id) => !s.players[id].bot);
  bots.forEach((id, i) => {
    const late = now - s.at >= wait + i * 700; // they don't all move on the same instant
    if (s.phase === "countdown") {
      // Vote Mode & Map: each clicks a game or a map (now and then the dice), a few seconds in
      const vt = s.vt;
      if (vt && !(vt.votes || {})[id] && now - s.at > 2500 + i * 900) {
        const ids = [...voteIds(s, vt.k), DICE];
        out.push({ t: "vote", id, v: ids[hash(id + s.at) % ids.length] });
      }
      return;
    }
    /* the End round button (the host's setting): a computer presses it once every duck has voted and a while has passed */
    if (
      canEndRound(s) &&
      endDone(s) >= playing(s).length &&
      now - s.at > 15000 + (hash(id) % 5000)
    ) {
      out.push({ t: "endRound", id });
      return;
    }
    if (isSc(s)) {
      storyBot(s, id, now, wait, late, people, out);
      return;
    }
    if (isMgj(s) && s.phase === "boss") {
      if (now - s.at > 1500 + i * 300) mgjBot(s, id, now, out);
      return;
    }
    if (isVd(s) && VD_PHASES.includes(s.phase)) {
      vdBot(s, id, now, late, out);
      return;
    }
    if (isTv(s) && TV_PHASES.includes(s.phase)) {
      tvBot(s, id, now, late, out);
      return;
    }
    if (isHang(s)) {
      if (inWorld(s))
        (isL4dd(s) ? l4Bot : hangBot)(s, id, now, out); // (Quacky Zombies: they fight, l4Bot below)
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
      case "lawdef":
      case "lawoff": {
        // the attorney vote: a computer votes for anyone it may (itself too)
        const k = attRole(s),
          can = attCands(s);
        if (!late || !s.law || (s.law.picks[k] || {})[id] !== undefined) break;
        if (can.length) out.push({ t: "attvote", id, who: anyOf(can) });
        break;
      }
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
  let stopped;
  [x, y, stopped] = stepToward(
    x,
    y,
    g.x,
    g.y,
    72,
    12,
    (nx, ny, z0, x0, y0) =>
      Math.abs(heightAt(nx, ny) - z0) <= STEP &&
      standable(nx, ny, z0, STEP, [x0, y0]),
  ); // (12 px at a time: up or down a step at most, never through a wall)
  z = heightAt(x, y);
  if (stopped) {
    if (g.seat) g.path = null;
    else {
      g.x = x;
      g.y = y;
      g.rest = now + 800;
    }
  } // in the way: another spot soon (or another path)
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
/* ---------- the computers on a walkable map: Quacky Zombies, Survival, Sandbox (TEST rooms) ----------
   A computer goes to a downed teammate and holds E by it; otherwise it shoots the nearest zombie it can see (a ranged
   weapon with something left in it, the melee weapon up close, the medkit when it's hurt), backs away from one that's
   too close, throws a grenade into a crowd now and then, and keeps near the middle of the great room. With no zombie in
   sight it spends its points: an upgrade from Justin's Butler, or a spin at the fireplace (and it goes to take what
   lands, swapping its emptier ranged weapon). A ghost or a downed computer does nothing. */
const SEE = 460; // world px: how far a computer looks for a zombie to shoot
const TOO_CLOSE = 95;
const STEP_MS = 200; // (the TEST room's heartbeat: how far it walks each time)
const AT = 90; // world px: near enough to the Butler or the fireplace
const spinAt = new Map(); // computer → when it last spun the fireplace (one spin in a while, not every time it can)
const readyAt = new Map(); // "computer round" → when it presses End turn (Ready in round 0): a few seconds into the wait

/* the one walk on a walkable map: steps of px toward (tx, ty), as far as far, each one only if ok(nx, ny, z, x, y) lets it
   (z: the height where it stands); [x, y, stopped] */
function stepToward(x, y, tx, ty, far, px, ok) {
  const d = Math.hypot(tx - x, ty - y);
  if (d < 1) return [x, y, false];
  const n = Math.ceil(Math.min(far, d) / px),
    ux = (tx - x) / d,
    uy = (ty - y) / d;
  for (let k = 0; k < n; k++) {
    const nx = x + ux * Math.min(px, d - k * px),
      ny = y + uy * Math.min(px, d - k * px);
    if (!ok(nx, ny, heightAt(x, y), x, y)) return [x, y, true];
    x = nx;
    y = ny;
  }
  return [x, y, false];
}
/* a few small steps toward (tx, ty), never off the cabin and the deck, never up a wall */
const mapWalk = (x, y, tx, ty, far) =>
  stepToward(
    x,
    y,
    tx,
    ty,
    far,
    8,
    (nx, ny, z, x0, y0) =>
      playable(nx, ny) && standable(nx, ny, z, STEP, [x0, y0]),
  );
/* the actions of a computer on a walkable map (world px): a move holding w, aimed (ax, ay), and a use */
const moveOf = (id, nx, ny, w, ax, ay, j = 0) => ({
  t: "move",
  id,
  x: +(nx / W).toFixed(5),
  y: +(ny / H).toFixed(5),
  j,
  z: Math.round(heightAt(nx, ny)),
  b: Math.round(heightAt(nx, ny)),
  w,
  ax: +(ax / W).toFixed(4),
  ay: +(ay / H).toFixed(4),
});
const useOf = (id, what, ax, ay) => ({
  t: "use",
  id,
  what,
  face: ax < 0 ? -1 : 1,
  ax: ax / W,
  ay: ay / H,
});
/* what tells the two kinds of computer apart (Type Object): the room's computers, and the fireplace's Justin (better:
   he sees farther, goes farther to revive, and throws a grenade sooner into a crowd a little farther off) */
const BOT_BREEDS = {
  computer: { see: SEE, revive: 900, crowd: 130, nadeMin: 200, nadeGap: 4000 },
  justin: {
    see: SEE * 1.3,
    revive: 1200,
    crowd: 150,
    nadeMin: 220,
    nadeGap: 3000,
  },
};
/* a gun with something in it (not reloading); the Laser Rifle while it's cool enough */
const loadedIn = (s, id, now, m) => (w) =>
  w === "laser"
    ? laserOk(s, id, now)
    : endless(w) || (w && m.am[w] && m.am[w][0] > 0 && m.rw !== w);
/* how many of zs are within r of z, and whether that's a crowd worth a grenade from d away */
const crowdOf = (zs, z, r) =>
  zs.filter((o) => Math.hypot(o.x - z.x, o.y - z.y) < r).length;
const nadeOk = (b, crowd, m, d, now) =>
  crowd >= 4 &&
  m.g > 0 &&
  d > b.nadeMin &&
  now - ((m.u || {}).grenade || 0) > b.nadeGap;
/* the nearest downed teammate: down, not dead (the dead only with a defibrillator, and never the wild or Justin); with zs,
   only one with no zombie within KEEP of it */
function downMate(s, id, x, y, defib, zs) {
  const l4p = s.hang.l4p || {},
    dead = (t) => !!(l4p[t] || {}).ex,
    body = (t) => !!(l4p[t] || {}).gh && dead(t) && !!(s.hang.ghost || {})[t];
  return s.seat
    .filter(
      (t) =>
        t !== id &&
        ((l4p[t] || {}).dn || body(t)) &&
        (!dead(t) || (defib && !isWild(s, t) && !isHelper(s, t))) &&
        s.pos[t],
    )
    .map((t) => {
      const q = body(t) ? s.hang.ghost[t] : s.pos[t]; // (Survival's ghost: its body, where it fell)
      return { t, x: q.x * W, y: q.y * H, dead: dead(t) };
    })
    .filter(
      (t) => !zs || zs.every((z) => Math.hypot(z.x - t.x, z.y - t.y) > KEEP),
    )
    .sort(
      (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
    )[0];
}
/* by it: hold E (the hold goes on by itself until the revive is done) */
function holdE(s, id, t, out) {
  const rv = ((s.hang.l4p || {})[t] || {}).rv;
  if (!rv || rv.by !== id)
    out.push({ t: "hang", k: "l4", do: "rev", on: t, hold: true, id });
}

export function l4Bot(s, id, now, out) {
  const p = s.pos[id],
    h = s.hang;
  if (!p || !h || !h.l4 || h.l4.over || !l4Up(s, id)) return;
  if (lootAt(s, p.x * W, p.y * H, now))
    out.push({ t: "hang", k: "l4", do: "pick", id }); // (on something on the ground: E, as a player presses it, l4ddloot.js)
  if (isHelper(s, id)) return justinBot(s, id, now, out); // (the fireplace's Justin: his own, better brain)
  const wait = h.l4.wait;
  if (wait && !wait.v[id]) {
    const k = `${id} ${h.l4.r}`;
    if (!readyAt.has(k)) readyAt.set(k, now + 1500 + Math.random() * 2500);
    if (now >= readyAt.get(k)) {
      readyAt.delete(k);
      out.push({ t: "hang", k: "l4", do: "endturn", on: true, id });
    }
  }
  const x = p.x * W,
    y = p.y * H,
    far = WALK * walkOf(s, id) * (STEP_MS / 1000) * (upOf(s, id).sp ? 1.1 : 1), // (as fast as my duck: the Walking speed, the Butler's Speed)
    m = kitOf(s, id) || { sl: [], am: {}, u: {} },
    sl = m.sl,
    b = BOT_BREEDS.computer,
    send = (nx, ny, w, ax, ay) => out.push(moveOf(id, nx, ny, w, ax, ay));
  /* a teammate down: go to it and hold E (the hold goes on by itself until the revive is done); in Survival with a
     defibrillator, a dead player too (the defibrillator out in hand) */
  const down = downMate(s, id, x, y, isSurv(s) && hasLeft(s, id, "defib"));
  if (down && Math.hypot(down.x - x, down.y - y) < b.revive) {
    const d = Math.hypot(down.x - x, down.y - y);
    if (d < L4.REACH * 0.9) {
      if (down.dead) send(x, y, "defib", down.x - x, down.y - y); // (in hand first)
      holdE(s, id, down.t, out);
      return;
    }
    const to = wayTo(x, y, down.x, down.y, now) || [down.x, down.y],
      [nx, ny] = mapWalk(x, y, to[0], to[1], far);
    send(nx, ny, "knife", to[0] - x, to[1] - y);
    return;
  }
  /* the nearest zombie in sight */
  const zs = zombiesOf(s).filter((z) => z.st === 2 || z.st === 4);
  let best = null,
    bd = b.see;
  for (const z of zs) {
    const d = Math.hypot(z.x - x, z.y - y);
    if (d < bd && clearShot(x, y, z.x, z.y, heightAt(x, y))) {
      bd = d;
      best = z;
    }
  }
  const home = startSpot(s.seat.indexOf(id));
  if (!best) {
    if (shopping(s, id, now, x, y, far, m, send, out)) return;
    const [nx, ny] =
      Math.hypot(home.x - x, home.y - y) > 140
        ? mapWalk(
            x,
            y,
            ...(wayTo(x, y, home.x, home.y, now) || [home.x, home.y]),
            far,
          )
        : [x, y];
    if (nx !== x || ny !== y) send(nx, ny, sl[1], nx - x || 1, ny - y);
    return;
  }
  const ax = best.x - x,
    ay = best.y - y,
    u = m.u || {};
  /* a crowd: a grenade now and then */
  if (nadeOk(b, crowdOf(zs, best, b.crowd), m, bd, now)) {
    out.push(useOf(id, "grenade", ax, ay));
    return;
  }
  /* the special from the fireplace, now and then, with a zombie close (the medkit waits for low HP below; the long
     jump stays as it is) */
  const sp = itemsIn(sl).find(
    (w) => ["zebra", "adrenaline"].includes(w) && m.am[w] && m.am[w][0] > 0,
  ); // (either item slot)
  if (sp && bd < 400 && now - (u[sp] || 0) > 6000) {
    out.push(useOf(id, sp, ax, ay));
    return;
  }
  const loaded = gunsIn(sl).filter(loadedIn(s, id, now, m)),
    hp = ((h.l4p || {})[id] || {}).hp,
    w =
      hasLeft(s, id, "medkit") && hp <= 1 && hp < maxHp(s, id)
        ? "medkit"
        : bd < 75 || !loaded.length
          ? sl[0]
          : (bd < 220 && loaded.find((v) => v === "shotgun")) || loaded[0];
  /* too close: back away while it shoots */
  let [nx, ny] = [x, y];
  if (bd < TOO_CLOSE && kindOf(w) !== "melee")
    [nx, ny] = mapWalk(x, y, x - ax, y - ay, far);
  send(nx, ny, w, ax, ay);
  if (now - (u[w] || 0) >= l4Cool(s, id, w)) out.push(useOf(id, w, ax, ay));
}
/* no zombie in sight: walk to the Butler or the fireplace and spend points there, or take what the fireplace landed on;
   true while it's busy with that */
function shopping(s, id, now, x, y, far, m, send, out) {
  const b = boxNow(s, now, id),
    pts = ptsOf(s, id),
    mine = !!b;
  let to = null,
    act = null,
    hand = m.sl[1];
  if (mine) {
    if (now < b.t + BOX.spin) return true; // (it waits by the fire while it spins)
    if (kindOf(b.w) === "ranged") {
      const left = (w) =>
        endless(w) ? Infinity : m.am[w] ? m.am[w][0] + m.am[w][1] : 0;
      hand = PRIMARY.map((i) => m.sl[i]).sort((a, c) => left(a) - left(c))[0];
    } // (a primary: it gives up the emptier one, an empty slot first; kitslots.js)
    to = BOX;
    act = { t: "hang", k: "l4", do: "box", hand, id };
  } else {
    const up = upOf(s, id),
      want = SHOP.find(
        (it) =>
          it.id === upOffer(s, id) &&
          (up[it.id] || 0) < it.most &&
          pts >= priceOf(it.id, up[it.id] || 0),
      ); // (only the one the merchant offers it this visit)
    if (want && selling(s)) {
      to = merchantOf(s); // (only while a merchant is here and selling)
      act = { t: "hang", k: "l4", do: "buy", what: want.id, id };
    } else if (!b && pts >= BOX.price && now - (spinAt.get(id) || 0) > 45000) {
      to = BOX;
      act = { t: "hang", k: "l4", do: "box", id };
    }
  }
  if (!to) return false;
  const d = Math.hypot(to.x - x, to.y - y);
  if (d < AT) {
    send(x, y, hand, to.x - x || 1, to.y - y);
    out.push(act);
    if (act.do === "box" && !mine) spinAt.set(id, now);
    return true;
  }
  const way = wayTo(x, y, to.x, to.y, now) || [to.x, to.y],
    [nx, ny] = mapWalk(x, y, way[0], way[1], far);
  send(nx, ny, hand, way[0] - x, way[1] - y);
  return true;
}

/* ---------- the fireplace's Justin (the owner's, Nov 4: "make his npc decent or good at the game") ----------
   He plays by every rule a duck does, through the same actions, only better than the computers above: a gun over the
   knife whenever one has anything in it (the chain gun kept for when it counts: a zombie close, or a crowd), the
   knife only once every gun is empty and nothing can be bought. He keeps his distance: each heartbeat he tries 16 ways
   to step and takes the one that leaves him farthest from every zombie with the most open floor ahead (so never into a
   corner), sprinting (with a duck's own 7 seconds of breath) when one gets too close. He revives a downed duck when no
   zombie is on it, ends the turn between rounds, and shops like the others when the room is clear (no ammo to buy:
   the merchants never sell it, the owner's, Nov 18 13:46Z). He walks exactly as fast as a duck would: by the time since his last step, at the Walking speed, the
   Butler's Speed and an adrenaline shot (a Speed Boost) */
const KEEP = 240, // world px: the room he keeps from every zombie
  CLOSE = 150, // nearer than this he sprints away
  LOOK = 220, // how far ahead he checks a way is open
  WAYS = 16;
const lastAt = new Map(), // Justin → when he last walked
  breath = new Map(); // Justin → his sprint left (0 … 1), and whether he's run out until he stops
/* how much a gun is worth to him (more is better): what kills fastest first; the chain gun on its own below */
const GUN_RANK = [
  "lmg",
  "dbarrel",
  "ak",
  "burst",
  "laser",
  "tommy",
  "ump",
  "smg",
  "sniper",
  "revolver",
  "shotgun",
  "handgun",
  "glauncher",
  "flamer",
  "bow",
  "dagger",
];
/* the Laser Rifle has no ammo: a computer fires it only while it's cool enough not to overheat it (its meter not full) */
const laserOk = (s, id, now) => {
  const q = laserHeat(s, id, now);
  return !q.over && Math.round(q.h) < q.max;
};

function justinBot(s, id, now, out) {
  const p = s.pos[id],
    h = s.hang;
  // (Justin never presses End turn or Ready: only the players end a rest phase, the owner's, Nov 17 13:38Z)
  const x = p.x * W,
    y = p.y * H,
    dt = Math.min(400, Math.max(0, now - (lastAt.get(id) || now - STEP_MS)));
  lastAt.set(id, now);
  const fast = ((h.l4ad || {})[id] || 0) > now,
    walkPx =
      (fast ? WALK / (0.6 * 1.05) : WALK * (upOf(s, id).sp ? 1.1 : 1)) *
      walkOf(s, id) *
      HL.wetK(x, y, p.z) * // (Downpour's flood: as a player's duck is slowed)
      (dt / 1000),
    m = kitOf(s, id) || { sl: [], am: {}, u: {} },
    sl = m.sl;
  const br = breath.get(id) || { left: 1, out: false };
  breath.set(id, br);
  const run = (want) => {
    const go = want && !br.out && br.left > 0;
    if (go) {
      br.left = Math.max(0, br.left - dt / L4.SPRINT);
      if (br.left <= 0) br.out = true;
    } else {
      br.left = Math.min(1, br.left + dt / (L4.SPRINT * GAME_SPRINT.refill));
      if (br.left >= 1) br.out = false; // (like a player's: empty, it sprints again only once full, stamina.js)
    }
    return go ? walkPx * NPC_RUN : walkPx; // (the shared slow speed, npcshared.js: "if he does sprint, he sprints slower", the owner's, Nov 19 19:27Z. It was a duck's sprint, world.js SPRINT)
  };
  const b = BOT_BREEDS.justin,
    send = (nx, ny, w, ax, ay) => out.push(moveOf(id, nx, ny, w, ax || 1, ay));
  const zs = zombiesOf(s).filter((z) => z.st === 2 || z.st === 4),
    near = zs
      .map((z) => ({ z, d: Math.hypot(z.x - x, z.y - y) }))
      .sort((a, b) => a.d - b.d),
    d0 = near.length ? near[0].d : Infinity;
  if (isWild(s, id)) return wildMove(s, id, now, p, x, y, near, run, out); // (Justin out there: never armed, the owner's, Nov 17 20:02Z)
  /* what he'd shoot: the nearest zombie he can see */
  const seen = near.find(
    (n) => n.d < b.see && npcSees({ x, y }, n.z, undefined, 0),
  );
  /* his gun: the best one with something in it (not reloading); the chain gun when a zombie is close or they crowd */
  const crowd = seen ? crowdOf(zs, seen.z, b.crowd) : 0;
  const guns = gunsIn(sl).filter(loadedIn(s, id, now, m)),
    others = guns
      .filter(
        (w) => w !== "chaingun" && !(w === "shotgun" && seen && seen.d > 260),
      )
      .sort(
        (a, b) =>
          ((GUN_RANK.indexOf(a) + 99) % 99) - ((GUN_RANK.indexOf(b) + 99) % 99),
      );
  let gun =
    guns.includes("chaingun") && (d0 < 300 || crowd >= 3 || !others.length)
      ? "chaingun"
      : others[0] || (guns.includes("shotgun") ? "shotgun" : "");
  /* a downed teammate with no zombie on it (nor on him): go and hold E by it */
  const down = downMate(s, id, x, y, false, zs);
  if (down && d0 > CLOSE && Math.hypot(down.x - x, down.y - y) < b.revive) {
    const d = Math.hypot(down.x - x, down.y - y);
    if (d < L4.REACH * 0.9) {
      holdE(s, id, down.t, out);
      if (seen && gun)
        shoot(s, id, now, m, gun, seen.z.x - x, seen.z.y - y, out); // (he shoots while he holds E)
      return;
    }
    const to = wayTo(x, y, down.x, down.y, now) || [down.x, down.y],
      [nx, ny] = mapWalk(x, y, to[0], to[1], run(false));
    send(nx, ny, gun || sl[0], to[0] - x, to[1] - y);
    if (seen && gun) shoot(s, id, now, m, gun, seen.z.x - x, seen.z.y - y, out);
    return;
  }
  /* nothing to fear and nothing to shoot: shop like the others, else stay by the nearest duck */
  if (!seen && d0 > KEEP * 1.5) {
    if (shopping(s, id, now, x, y, run(false), m, send, out)) return;
    const mate = s.seat
        .filter((t) => t !== id && s.pos[t] && l4Up(s, t))
        .map((t) => ({ x: s.pos[t].x * W, y: s.pos[t].y * H }))
        .sort(
          (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
        )[0],
      home = mate || startSpot(s.seat.indexOf(id));
    if (Math.hypot(home.x - x, home.y - y) > 150) {
      const to = wayTo(x, y, home.x, home.y, now) || [home.x, home.y],
        [nx, ny] = mapWalk(x, y, to[0], to[1], run(false));
      send(nx, ny, gun || sl[1], nx - x, ny - y);
    } else run(false);
    return;
  }
  /* step: where every zombie is farthest and the floor ahead is open; staying put is one of the choices */
  const far = run(d0 < CLOSE);
  let [nx, ny] = [x, y];
  if (d0 < KEEP) [nx, ny] = away(id, x, y, far, near);
  /* the gun on the nearest he can see; with no gun at all, the knife on one at arm's length */
  const ax = seen ? seen.z.x - x : nx - x,
    ay = seen ? seen.z.y - y : ny - y;
  if (gun) {
    send(nx, ny, gun, ax, ay);
    if (seen) shoot(s, id, now, m, gun, ax, ay, out);
  } else if (seen && seen.d < 80) {
    send(nx, ny, sl[0], ax, ay);
    shoot(s, id, now, m, sl[0], ax, ay, out);
  } else send(nx, ny, sl[0], ax, ay);
  /* a grenade into a crowd that isn't on him */
  if (seen && nadeOk(b, crowd, m, seen.d, now))
    out.push(useOf(id, "grenade", ax, ay));
}
/* Justin out there with no weapon (the owner's, Nov 17; Nov 19 19:27Z: "he still tries to protect himself"): he walks
   away from the nearest zombies (running only from one really close, with his meter: a duck's own, at the shared slow
   speed), cries and runs off when he's hurt, never jumps or dodges, and otherwise strolls about as he does in Duck
   Cabin */
const wander = new Map(), // Justin → { x, y, until }
  fleeing = new Set(); // (Justin while he's walking away from zombies)
/* where Justin strolls to, his Duck Cabin way (hangout/justin.js WANDER, the owner's, Nov 17 19:11Z: "HE SHOULD BE CASUALLY
   WALKING AROUND WHICH IS ALREADY IN HIS CHARACTER SHEET! STOP REWRITING CODE TERRIBLY FOR THINGS ALREADY FIGURED OUT!"):
   a spot anywhere on the map, walked to; once he's there he stands about (rest: true) until WANDER seconds have gone by
   since he set off, then the next spot */
function wanderSpot(id, now, x, y, from = null) {
  let w = wander.get(id);
  if (w && now <= w.until)
    return Math.hypot(w.x - x, w.y - y) < 90 ? { ...w, rest: true } : w;
  const p = spotIn(
    Math.random,
    (tx, ty) =>
      playable(tx, ty) &&
      standable(tx, ty, heightAt(tx, ty), STEP) &&
      (!from || (tx - x) * (x - from.x) + (ty - y) * (y - from.y) > 0), // (a zombie about: never back past it)
    { x0: 0, y0: 0, x1: W, y1: H, tries: 24 },
  ); // (walkgrid.js: every stroll's next spot)
  if (!p) return null;
  w = {
    x: p[0],
    y: p[1],
    until: now + (WANDER[0] + Math.random() * (WANDER[1] - WANDER[0])) * 1000,
  };
  wander.set(id, w);
  return w;
}
function wildMove(s, id, now, p, x, y, near, run, out, forced = false) {
  /* only the zombies scare him, and being hurt; never the ducks themselves (the owner's, Nov 17 18:05Z: "justin should be
     running from zombies not every player"), and no longer the shots flying by him: running from those before they
     landed was the dodging (the owner's, Nov 19 19:27Z: "Justin should stop dodging bullets like a fucking god") */
  const threats = [...near],
    cry = wildCrying(s, id, now) && s.hang.l4jcry[id]; // (hurt: crying, he runs off from where it came from, l4ddrules.js CRY)
  if (cry)
    threats.push({
      z: { x: cry.x, y: cry.y },
      d: Math.hypot(cry.x - x, cry.y - y),
    });
  threats.sort((a, b) => a.d - b.d);
  /* scared by a zombie within KEEP * 1.4, he walks away; calm again, he strolls on to a new spot away from the zombies
     about (within KEEP * 4), never back through them: he went back to the old spot, a step towards them, was scared, a step
     away, and so on every heartbeat, shaking on the spot (the owner's, Nov 21 08:46 ET: "justin is also jitterying in the
     bottom corner, he has been doing that a lot when there are zombies") */
  /* once scared he stays so until they're a little farther (KEEP * 1.7): right at the line, a zombie walking by at about
     KEEP * 1.4 had him a step away, calm, a step back towards his spot, scared again, every heartbeat */
  const d0 = threats.length ? threats[0].d : Infinity,
    scared = forced || !!cry || d0 < KEEP * (fleeing.has(id) ? 1.7 : 1.4);
  if (scared) fleeing.add(id);
  else fleeing.delete(id);
  if (scared) wander.delete(id); // (where he was strolling to: maybe through them)
  const w = scared
    ? null
    : wanderSpot(id, now, x, y, d0 < KEEP * 4 ? threats[0].z : null);
  let [nx, ny] = [x, y];
  /* he runs only with a reason, and less often (the owner's, Nov 17 19:11Z: "WHY IS JUSTIN ALWAYS SPRINTING WITHOUT EVER
     STOPPING", and Nov 19 19:27Z: "he shouldn't sprint as often"): hurt, or a zombie really close (CLOSE); one farther off
     and he walks away from it. His meter is a duck's own (run: L4.SPRINT to empty, as long to fill, and none until he
     stops wanting it once it ran out) */
  const far = run(forced || !!cry || d0 < CLOSE);
  if (scared) [nx, ny] = away(id, x, y, far, threats);
  else if (w && !w.rest) {
    const to = wayTo(x, y, w.x, w.y, now) || [w.x, w.y];
    [nx, ny] = mapWalk(x, y, to[0], to[1], far);
    if (Math.hypot(nx - x, ny - y) < far * 0.2) wander.delete(id); // (stuck: another spot next time)
  }
  /* no jumps: he gets out of the way only by moving, as a player does (the owner's, Nov 17 20:37Z: "WHEN HE TRIES TO DODGE,
     IT ISNT SOME ANIMATION THAT IS DONE BY MATH, HE SIMPLLY TRIES MOVING OUT THE WAY LIKE A PLAYER DOES") */
  out.push(moveOf(id, nx, ny, "", nx - x || 1, ny - y));
}
function shoot(s, id, now, m, w, ax, ay, out) {
  if (!w) return; // (a melee weapon that broke: nothing in that slot)
  if (now - ((m.u || {})[w] || 0) < l4Cool(s, id, w)) return;
  out.push(useOf(id, w, ax, ay));
}
/* the best step away: farthest from the zombies (the nearest counts most), with room ahead to keep going, and on the
   way he was already going (TURN for keeping on): against a wall the best way flipped back and forth every heartbeat
   (a step out, a step back), so he shook there (the owner's, Nov 21 08:46 ET: "justin is also jitterying in the bottom
   corner, he has been doing that a lot when there are zombies") */
const heading = new Map(), // Justin → his last step away (a unit vector)
  TURN = 40;
function away(id, x, y, far, near) {
  const was = heading.get(id);
  const zs = near.slice(0, 12).map((n) => n.z),
    score = (px, py, ahead) => {
      let low = Infinity,
        press = 0;
      for (const z of zs) {
        const d = Math.hypot(z.x - px, z.y - py);
        low = Math.min(low, d);
        press += 1 / Math.max(40, d);
      }
      return Math.min(low, 500) - press * 900 + ahead * 0.5;
    };
  let best = [x, y],
    top = score(x, y, 0) - 40; // (staying put: no room ahead to count, and a little worse than a good step)
  for (let k = 0; k < WAYS; k++) {
    const a = (k / WAYS) * Math.PI * 2,
      ux = Math.cos(a),
      uy = Math.sin(a),
      [nx, ny] = mapWalk(x, y, x + ux * far, y + uy * far, far);
    if (Math.hypot(nx - x, ny - y) < far * 0.3) continue; // (a wall that way)
    const [fx, fy] = mapWalk(nx, ny, nx + ux * LOOK, ny + uy * LOOK, LOOK),
      room = Math.hypot(fx - nx, fy - ny),
      v =
        score(nx, ny, room) +
        Math.min(500, score(fx, fy, 0)) * 0.35 +
        (was ? (ux * was[0] + uy * was[1]) * TURN : 0);
    if (v > top) {
      top = v;
      best = [nx, ny];
    }
  }
  const d = Math.hypot(best[0] - x, best[1] - y);
  if (d) heading.set(id, [(best[0] - x) / d, (best[1] - y) / d]);
  return best;
}
