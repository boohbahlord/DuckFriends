/* ---------- Justin on the boards (the Justin option) ----------
   I want Duck Cabin's Justin to be able to join any game as a joke. The host turns him on in Additional settings (or
   `sudo forgame justin on`). He isn't a player: he's never in s.seat, s.pos, s.done or s.lock, so he never counts in a
   vote, a turn, the results or the stats, and he never looks like he's voting.
   - He walks to the spot that shows the opposite of the room, a couple of seconds after the room leans: Agree or
     Disagree, the strong end against the room's average; two sides (Would You Rather, the brackets, the Lawyering jury,
     Quack's vote or more clues), the side fewer ducks are on; Quack's accusing, the duck the fewest stand on; Story
     Chain, the line or the word with the fewest ducks. On a tie he stays. Everywhere else he wanders.
   - Every 15 to 30 seconds he says one of his lines (every line once before any comes back), in the chat and his bubble.
   - With the silly commands on, every 45 to 90 seconds he fires the handgun's slow bullet at a random duck (never in
     Quack's reveal). A duck it hits plays dead until it moves, as with the Handgun special.
   - With the silly commands on, every 40 to 80 seconds he hurries up to a random duck and swings the hammer at it (a
     duck that steps away in time is missed); every 70 to 140 seconds he shouts a line from GOD_LINES (a shuffled
     playlist, "Frick you I am GOD!" among them) and lightning or fire strikes a random duck from the sky a moment later,
     and it plays dead.
   - Players can shoot him back: a bullet, a dagger or `kill @Justin` kills him outright with one of his death lines: he
     lies there, silent, and is back whole on the next turn (the owner's, Nov 18). E on him is Duck Cabin's only.
   s.justin = { x0, y0, x1, y1, t, v, k, key, next, say, shoot, list, down, w }: he walks from (x0, y0) to (x1, y1) from time t at
   v board widths a second (every screen moves him on its own); k is the spot he picked; key the stage he's in; down when
   he was knocked down; w his wounds (wounds.js codes, justinHit). In
   Hangout he stays Duck Cabin's own (js/hangout/justin.js).
   A zebra cake thrown (the Zebra cake special, s.zcake): he runs after it, wherever he is, and eats it once it has
   landed (j.eat); nothing else of his happens meanwhile. */
import { modeOf } from "./modes.js";

import { E_LINES, DEATH_LINES, GOD_LINES } from "./hangout/justin.js";

import { holdDown, invuln, hurtFx } from "./hangout/death.js";

import { JUSTIN } from "./hangout/npcart.js";

import { shuffle } from "./random.js";

import { hitWounds, WOUND_BREEDS } from "./wounds.js";

import { critOf, armOfShot } from "./guns.js";

import { isQuack, tileAt, tileCenter, stillIn } from "./quackrules.js";

import { r3, walkTo, stopAt, hammerFx, fxOf, nearSpot } from "./justinmoves.js";

import {
  twoSided,
  isSc,
  colAt,
  colBoundsAt,
  startX,
  boardPhases,
  playing,
  BOSS_SHOT_SPEED,
} from "./rules.js";

import { strike } from "./boardfire.js";

import { scZones, scLineOf, zoneAt } from "./scrules.js";

export const JUSTIN_ID = "justin";
export const JUSTIN_PLAYER = { name: "Justin", duck: JUSTIN };
const SPEED = 0.2; // board widths a second (about a duck's walk)
const LOOK = [2000, 3000],
  SAY = [15000, 30000],
  SHOOT = [45000, 90000],
  HAMMER = [40000, 80000],
  GOD = [70000, 140000],
  STRIKE = 1600;
const RX = 0.03,
  RY = 0.08; // a duck's length on the board, across and down (as rules.js' swing measures)
const rnd = ([a, b]) => a + Math.random() * (b - a);
const any = (xs) => xs[Math.floor(Math.random() * xs.length)];
/* the Zebra cake special (s.zcake, thrown: boardfire.js throwCake): it flies at CAKE_SPEED board widths a second to the
   board's edge, and he eats it for CAKE_EAT_MS once it has landed */
export const CAKE_SPEED = 0.45,
  CAKE_EAT_MS = 2500;
export const cakeAt = (c, now) => {
  const t = (Math.min(now, c.stop) - c.t) / 1000;
  return { x: c.x0 + c.vx * t, y: c.y0 + c.vy * t };
};
/* he sprints at a duck (id) to swing the hammer once he's there */
const dashTo = (j, at, to, now, v, id) => {
  walkTo(j, at, to, now, v);
  j.swing = {
    id,
    at: now + (Math.hypot(to.x - at.x, to.y - at.y) / v) * 1000 + 250,
  };
};
/* his pistol's slow bullet from where he stands toward (ax, ay), numbered n */
const bossShot = (s, n, at, ax, ay, now) => {
  s.shots = [
    ...(s.shots || []),
    {
      n,
      by: JUSTIN_ID,
      k: "handgun",
      x0: at.x,
      y0: at.y,
      vx: +(ax * BOSS_SHOT_SPEED).toFixed(4),
      vy: +(ay * BOSS_SHOT_SPEED).toFixed(4),
      t: now,
      lx: at.x,
      ly: at.y,
    },
  ];
};
/* where he is at a moment (board units, like s.pos), and whether he's walking */
export function justinAt(j, now) {
  if (!j) return null;
  const dx = j.x1 - j.x0,
    dy = j.y1 - j.y0,
    d = Math.hypot(dx, dy),
    k = d ? Math.max(0, Math.min(1, (((now - j.t) / 1000) * j.v) / d)) : 1;
  return {
    x: j.x0 + dx * k,
    y: j.y0 + dy * k,
    moving: k < 1,
    f: dx < 0 ? -1 : 1,
  };
}
/* is he on the board now? */
export const justinShown = (s) =>
  !!s.justin &&
  !!s.options.justin &&
  !modeOf(s.options.mode).noBoardJustin &&
  boardPhases(s).includes(s.phase);
/* the turn he is in (a question, a round): not each stage of it */
const turnKey = (s) => [s.round, s.qi, s.startedAt].join();
/* shot or killed: down where he stands, one of his death lines, back on the next turn */
export function justinDown(s, now, log) {
  const j = s.justin;
  if (!justinShown(s) || j.down) return false;
  const at = justinAt(j, now);
  Object.assign(j, {
    down: now,
    dkey: turnKey(s), // (the turn he went down in: he stays down till the next one, see justinTick)
  });
  stopAt(j, at, now);
  delete j.swing;
  if (j.eat) {
    delete j.eat;
    if (s.zcake && s.zcake.eat) s.zcake = null;
  } // (knocked down eating the zebra cake: it's gone)
  log(s, { npc: JUSTIN_ID, name: "Justin", text: any(DEATH_LINES) });
  return true;
}

/* a duck's weapon hit him: 0 nothing, 2 he went down */
export function justinHit(s, by, now, log, w, sh) {
  const j = s.justin;
  if (!justinShown(s) || j.down) return 0;
  const at = justinAt(j, now),
    crit = Math.random() < critOf(armOfShot(w), sh && sh.dr); // (a crit doubles it: guns.js critOf; w can be a shot's kind; a drawn arrow: its draw's)
  /* the hit feel of Dead Ducks Arcade on him too (the owner's, Nov 19 01:34Z: "not just players, not just Justin, but any
     NPC that can take damage"): its hitmarker, the wound it leaves (game.js draws them, his blood and "−1 HP"), and on
     the hit that kills him now and then a crit, his head blown off with a CRIT over it, as a duck's (rules.js wounded).
     Gone when he's back up (justinTick: "spawns back with gore effects lost on the next turn") */
  j.w = hitWounds(j.w, w, WOUND_BREEDS.justin, {
    head: crit,
    dead: true,
    look: JUSTIN,
  });
  if (crit) {
    s.fxN = (s.fxN || 0) + 1;
    s.fx = [
      ...(s.fx || []).slice(-19),
      {
        n: s.fxN,
        kind: "pcrit",
        who: [JUSTIN_ID],
        t: now,
        x: r3(at.x),
        y: r3(at.y),
      },
    ];
  }
  return justinDown(s, now, log) ? 2 : 0;
}

/* the roomiest of a few spots in x0..x1, y0..y1: the one furthest from the other ducks (so he never stands on one) */
function roomy(ducks, x0, x1, y0, y1) {
  let best = null,
    bd = -1;
  for (let i = 0; i < 12; i++) {
    const x = x0 + Math.random() * (x1 - x0),
      y = y0 + Math.random() * (y1 - y0),
      d = Math.min(
        9,
        ...ducks.map((p) => Math.hypot(p.x - x, (p.y - y) * 0.6)),
      );
    if (d > bd) {
      bd = d;
      best = { x, y };
    }
  }
  return best;
}
/* the spots of this stage, and where the room stands on them: { keys, count(k), point(k) }, or null (he wanders) */
function spotsOf(s, ducks) {
  const ph = s.phase;
  if (isQuack(s)) {
    if (ph === "choice") return sides();
    if (ph !== "accuse" || !s.wq) return null;
    const tiles = stillIn(s)
      .map((id) => s.wq.ids.indexOf(id))
      .filter((k) => k >= 0);
    return {
      keys: tiles.map(String),
      count: (k) => ducks.filter((p) => tileAt(s, p) === +k).length,
      point: (k) => {
        const c = tileCenter(s, +k, 0.62);
        return roomy(ducks, c.x - 0.06, c.x + 0.06, c.y - 0.03, c.y + 0.05);
      },
    };
  }
  if (isSc(s)) {
    if (ph !== "lvote" && ph !== "wvote") return null;
    const zones = scZones(s),
      keys = zones.filter((z) =>
        ph === "wvote" ? /^W:/.test(z) : (scLineOf(s, z) || {}).now,
      );
    return {
      keys,
      count: (z) => ducks.filter((p) => zoneAt(s, p.y, zones) === z).length,
      point: (z) => {
        const y = (zones.indexOf(z) + 0.5) / zones.length;
        return roomy(ducks, 0.2, 0.8, y, y);
      },
    };
  }
  if (ph !== "answer" && ph !== "discuss") return null;
  if (twoSided(s)) return sides();
  /* Agree or Disagree: the strong end against the room's average (everyone on Neutral: a strong end at random) */
  if (!ducks.length) return null;
  const lean = ducks.reduce((m, p) => m + colAt(s, p.x), 0) / ducks.length;
  const keys = lean > 3 + 1e-9 ? ["0"] : lean < 3 - 1e-9 ? ["6"] : ["0", "6"];
  return { keys, all: ["0", "6"], count: () => 0, point: (k) => col(+k) };
  function sides() {
    return {
      keys: ["0", "1"],
      count: (k) => ducks.filter((p) => colAt(s, p.x) === +k).length,
      point: (k) => col(+k),
    };
  }
  /* the half of a side nearer the board's middle: clear of its edges and the labels over them */
  function col(c) {
    const [a, b] = colBoundsAt(s, c),
      m = (a + b) / 2;
    return roomy(
      ducks,
      b <= 0.5 ? m : a + (b - a) * 0.25,
      a >= 0.5 ? m : b - (b - a) * 0.25,
      0.2,
      0.8,
    );
  }
}
/* the spot he wants (cur: the one he's on): the one the fewest stand on; on a tie he keeps his own (or, standing on none
   of them, he stays) */
function pick(sp, cur) {
  if (sp.all)
    return sp.keys.length === 1
      ? sp.keys[0]
      : sp.keys.includes(cur)
        ? cur
        : any(sp.keys); // (Agree or Disagree)
  const n = sp.keys.map(sp.count),
    least = Math.min(...n),
    best = sp.keys.filter((k, i) => n[i] === least);
  if (best.includes(cur)) return cur;
  if (best.length === sp.keys.length) return cur; // (all even: he stays)
  return any(best);
}

/* the Zebra cake special (s.zcake): he runs after it, and once it has landed he eats it (j.eat, drawn at his beak) for
   CAKE_EAT_MS; then it's gone and he's back to his spot. True when anything changed */
function cakeChase(s, now, at) {
  const j = s.justin,
    c = s.zcake;
  delete j.god;
  delete j.swing;
  if (c.eat) {
    if (now < c.eat + CAKE_EAT_MS) return false;
    delete j.eat;
    s.zcake = null;
    j.k = null;
    j.next = now + 500;
    return true;
  }
  const p = cakeAt(c, now),
    d = Math.hypot((p.x - at.x) / RX, (p.y - at.y) / RY);
  if (now >= c.stop && d < 1.3) {
    c.eat = now;
    stopAt(j, at, now);
    j.eat = { k: "zebra", at: now, until: now + CAKE_EAT_MS, cake: true };
    fxOf(s, now, JUSTIN_ID)({ kind: "eat", what: "zebra", who: [] });
    return true;
  }
  if (Math.abs(j.x1 - p.x) < 0.004 && Math.abs(j.y1 - p.y) < 0.004)
    return false;
  walkTo(j, at, p, now, SPEED * 1.9); // (he runs after it)
  return true;
}
/* the host's part, every heartbeat: true when s.justin changed. log: the rules' chat line */
export function justinTick(s, now, log) {
  if (!s.options.justin || ["hang", "l4dd"].includes(s.options.mode)) {
    if (!s.justin) return false;
    delete s.justin;
    return true;
  }
  if (["lobby", "over", "countdown"].includes(s.phase)) return false;
  let ch = false;
  const key = [s.phase, s.round, s.qi, s.startedAt].join();
  if (!s.justin) {
    s.justin = {
      next: now + 1500,
      say: now + rnd(SAY) * 0.5,
      shoot: now + rnd(SHOOT),
      list: [],
    };
    ch = true;
  }
  const j = s.justin;
  /* a new stage: he starts where the ducks start */
  if (j.key !== key && j.down && j.dkey === turnKey(s)) {
    j.key = key; // (dead: he stays where he fell through the turn's stages)
    ch = true;
  } else if (j.key !== key) {
    delete j.swing;
    delete j.god;
    const x = startX(s),
      y = r3(0.2 + Math.random() * 0.6);
    Object.assign(j, {
      key,
      x0: x,
      y0: y,
      x1: x,
      y1: y,
      t: now,
      v: SPEED,
      k: null,
      next: now + rnd(LOOK),
    });
    ch = true;
  }
  /* knocked down: he lies there a while, then gets up */
  if (j.down) {
    /* in the normal modes he dies outright (the owner's, Nov 18 12:19Z: "Justin cannot be revived and he dies outright and
       spawns back with gore effects lost on the next turn", "justin cannot make dialog when outright dead"): he lies there,
       says nothing, and is back, whole, on the next turn */
    if (j.dkey === turnKey(s)) return ch;
    delete j.down;
    delete j.dkey;
    delete j.w; // (whole again: his wounds are gone)
    j.next = now + 1000;
    j.say = Math.max(j.say, now + 4000);
    ch = true;
  }
  /* his lines, a shuffled playlist */
  if (now >= j.say) {
    if (!j.list.length) j.list = shuffle(E_LINES.map((_, i) => i));
    log(s, { npc: JUSTIN_ID, name: "Justin", text: E_LINES[j.list.shift()] });
    j.say = now + rnd(SAY);
    ch = true;
  }
  if (!boardPhases(s).includes(s.phase)) return ch;
  const at = justinAt(j, now),
    ducks = playing(s)
      .map((id) => s.pos[id])
      .filter((p) => p && p.x >= 0);
  if (s.zcake) return cakeChase(s, now, at) || ch; // (the Zebra cake special: nothing else of his meanwhile)
  /* the slow bullet at a random duck (the silly commands' switch covers it) */
  if (now >= j.shoot) {
    j.shoot = now + rnd(SHOOT);
    const them = playing(s).filter(
      (id) => s.pos[id] && s.pos[id].x >= 0 && !s.players[id].dead,
    );
    if (s.options.fun && them.length && !(isQuack(s) && s.phase === "reveal")) {
      const p = s.pos[any(them)],
        dx = p.x - at.x,
        dy = p.y - at.y,
        d = Math.hypot(dx, dy) || 1,
        ax = dx / d,
        ay = dy / d;
      s.fxN = (s.fxN || 0) + 1;
      s.fx = [
        ...(s.fx || []).slice(-19),
        {
          n: s.fxN,
          kind: "use",
          what: "handgun",
          by: JUSTIN_ID,
          who: [],
          face: ax < 0 ? -1 : 1,
          t: now,
          ax: +ax.toFixed(3),
          ay: +ay.toFixed(3),
        },
      ];
      bossShot(s, s.fxN, at, ax, ay, now);
      ch = true;
    }
  }
  const fx = fxOf(s, now, JUSTIN_ID);
  const targets = () =>
    playing(s).filter(
      (id) => s.pos[id] && s.pos[id].x >= 0 && !s.players[id].dead,
    );
  const calm = !s.options.fun || (isQuack(s) && s.phase === "reveal");
  /* lightning or fire from the sky, a moment after his line */
  if (j.god && now >= j.god.at) {
    const id = j.god.id,
      P = s.players[id],
      p = s.pos[id];
    delete j.god;
    ch = true;
    if (P && p && p.x >= 0 && !calm) {
      if (invuln(s)) hurtFx(s, id, now);
      else {
        P.dead = true;
        holdDown(s, id, now);
      }
      fx({ kind: Math.random() < 0.5 ? "lightning" : "fire", who: [id] });
    }
  }
  j.godAt ??= now + rnd(GOD);
  if (now >= j.godAt && !j.god) {
    j.godAt = now + rnd(GOD);
    const them = targets();
    if (!calm && them.length) {
      if (!(j.gods || []).length) j.gods = shuffle(GOD_LINES.map((_, i) => i));
      log(s, {
        npc: JUSTIN_ID,
        name: "Justin",
        text: GOD_LINES[j.gods.shift()],
      });
      j.god = { id: any(them), at: now + STRIKE };
      ch = true;
    }
  }
  /* the hammer: up to the duck, then the swing (toward where it stands by then) */
  if (j.swing) {
    const p = s.pos[j.swing.id];
    if (
      !p ||
      p.x < 0 ||
      (s.players[j.swing.id] || {}).dead ||
      calm ||
      now > j.swing.at + 3000
    ) {
      delete j.swing;
      return true;
    }
    if (now < j.swing.at) return ch; // (still on his way: nothing else)
    const dx = p.x - at.x,
      dy = p.y - at.y,
      aim = Math.hypot(dx, dy) > 1e-4 ? [dx, dy] : [1, 0];
    const hit = strike(s, JUSTIN_ID, "hammer", aim, now, at);
    hammerFx(fx, aim, hit);
    delete j.swing;
    j.next = now + 1500;
    return true;
  }
  j.hammer ??= now + rnd(HAMMER);
  if (now >= j.hammer) {
    j.hammer = now + rnd(HAMMER);
    const them = targets();
    if (!calm && them.length) {
      const id = any(them),
        p = s.pos[id],
        to = nearSpot(at, p, RX, RY),
        v = SPEED * 1.8;
      dashTo(j, at, to, now, v, id);
      return true;
    }
  }
  /* where to stand: looked at again every 2 to 3 seconds; he walks only when the spot he wants changes */
  if (now < j.next) return ch;
  j.next = now + rnd(LOOK);
  const sp = spotsOf(s, ducks);
  if (sp) {
    const k = pick(sp, j.k);
    if (k == null || k === j.k) return ch;
    const to = sp.point(k);
    walkTo(j, at, to, now, SPEED);
    j.k = k; // (he stands at spot k: the walk above made it null, and the key keeps its place)
    return true;
  }
  if (at.moving || Math.random() > 0.35) return ch; // (wandering: now and then a few steps somewhere)
  const x = Math.max(0.08, Math.min(0.92, at.x + (Math.random() - 0.5) * 0.4)),
    y = Math.max(0.1, Math.min(0.9, at.y + (Math.random() - 0.5) * 0.5));
  Object.assign(j, {
    k: null,
    x0: r3(at.x),
    y0: r3(at.y),
    x1: +x.toFixed(3),
    y1: +y.toFixed(3),
    t: now,
    v: SPEED * 0.6,
  });
  return true;
}
