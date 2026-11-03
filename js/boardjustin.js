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
   - Players can shoot him back: a bullet, a dagger or `kill @Justin` knocks him down with one of his death lines, and he
     gets up by himself after 5 seconds. E on him is Duck Cabin's only.
   s.justin = { x0, y0, x1, y1, t, v, k, key, next, say, shoot, list, down }: he walks from (x0, y0) to (x1, y1) from time t at
   v board widths a second (every screen moves him on its own); k is the spot he picked; key the stage he's in; down when
   he was knocked down. In
   Hangout he stays Duck Cabin's own (js/hangout/justin.js).
   The board's Mad God Justin (the mgjBoard option, only with Justin on): he has BJ_HP HP (j.hp of j.max), and a duck
   that hurts him is his target for RAGE_MS (j.rage): he goes after it with Mad God Justin's attacks (the hammer, his
   pistol, the controllers, the chair and the fireball; never the edge lightning). A duck he hits by accident doesn't
   become his target for it, nor does a duck a mode keeps safe (The Date and the Suitor at the table). At 0 HP he goes
   down for the room's knocked-down time, then gets up with his HP full. */
import { E_LINES, DEATH_LINES, GOD_LINES } from "./hangout/justin.js";
import { holdDown, downFor } from "./hangout/death.js";
import { JUSTIN } from "./hangout/npcart.js";
import { isQuack, tileAt, tileCenter, stillIn } from "./quackrules.js";
import {
  isMgj,
  mgjTick,
  throwIt,
  DMG,
  THROW_TELL,
  CHAIR_TELL,
  FB_TELL,
  FB_EVERY,
} from "./mgjrules.js";
import { vdSafe } from "./vddrules.js";
import {
  twoSided,
  isSc,
  scZones,
  scLineOf,
  zoneAt,
  colAt,
  colBoundsAt,
  startX,
  boardPhases,
  playing,
  SHOT_SPEED,
  strike,
} from "./rules.js";

export const JUSTIN_ID = "justin";
export const JUSTIN_PLAYER = { name: "Justin", duck: JUSTIN };
const SPEED = 0.2; // board widths a second (about a duck's walk)
const LOOK = [2000, 3000],
  SAY = [15000, 30000],
  SHOOT = [45000, 90000],
  DOWN = 5000,
  HAMMER = [40000, 80000],
  GOD = [70000, 140000],
  STRIKE = 1600;
const RX = 0.03,
  RY = 0.08; // a duck's length on the board, across and down (as rules.js' swing measures)
const rnd = ([a, b]) => a + Math.random() * (b - a);
const any = (xs) => xs[Math.floor(Math.random() * xs.length)];
const r3 = (v) => Math.round(v * 1000) / 1000;

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
  (!!s.options.justin || isMgj(s)) &&
  s.options.mode !== "hang" &&
  s.options.mode !== "vdd" &&
  boardPhases(s).includes(s.phase);
/* shot or killed: down where he stands, one of his death lines, up again by himself after DOWN */
export function justinDown(s, now, log) {
  const j = s.justin;
  if (!justinShown(s) || j.down || isMgj(s)) return false; // (Mad God Justin: he takes damage instead)
  const at = justinAt(j, now);
  Object.assign(j, {
    down: now,
    k: null,
    x0: r3(at.x),
    y0: r3(at.y),
    x1: r3(at.x),
    y1: r3(at.y),
    t: now,
  });
  delete j.rage;
  delete j.tell;
  delete j.swing;
  log(s, { npc: JUSTIN_ID, name: "Justin", text: any(DEATH_LINES) });
  return true;
}

/* ---------- the board's Mad God Justin ---------- */
export const BJ_HP = 10,
  RAGE_MS = 10000;
export const boardMgj = (s) =>
  !isMgj(s) && !!s.options.mgjBoard && justinShown(s);
/* a duck's weapon hit him: 0 nothing, 1 a hit he takes (the board's Mad God Justin: HP off, and the duck is his
   target), 2 he went down */
export function justinHit(s, by, now, log, w) {
  const j = s.justin;
  if (!justinShown(s) || j.down || isMgj(s)) return 0;
  if (!boardMgj(s)) return justinDown(s, now, log) ? 2 : 0;
  j.max = BJ_HP;
  j.hp = Math.max(0, (j.hp ?? BJ_HP) - (DMG[w] || 1));
  const at = justinAt(j, now);
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    {
      n: s.fxN,
      kind: "hitmark",
      by,
      who: [],
      t: now,
      x: r3(at.x),
      y: r3(at.y),
    },
  ];
  if (j.hp <= 0) return justinDown(s, now, log) ? 2 : 1;
  if (s.players[by] && !vdSafe(s, by)) {
    if (!j.rage) j.rage = { fireAt: now + 500, hamAt: now + 800 };
    Object.assign(j.rage, { id: by, until: now + RAGE_MS });
    j.ctlAt ??= now + 2500;
    j.chairAt ??= now + 6000;
    j.fbAt ??= now + 4000;
  } // (the latest duck to hurt him is the one he goes after, for 10 s from its last hit)
  return 1;
}
/* his rage: true while he is busy with his target (nothing else of his happens then) */
function rageTick(s, now, at, fx, calm) {
  const j = s.justin,
    r = j.rage,
    P = s.players[r.id],
    p = s.pos[r.id];
  const stop = () =>
    Object.assign(j, {
      k: null,
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(at.x),
      y1: r3(at.y),
      t: now,
    });
  if (now >= r.until || !P || !p || p.x < 0 || vdSafe(s, r.id) || calm) {
    delete j.rage;
    delete j.tell;
    delete j.swing;
    j.next = now + 1000;
    return true;
  }
  if (P.dead) return false; // (his target is down: he waits by it)
  const far = Math.hypot((p.x - at.x) / RX, (p.y - at.y) / RY),
    dx = p.x - at.x,
    dy = p.y - at.y,
    d = Math.hypot(dx, dy) || 1;
  /* a throw held up (the tell), then the controllers every way, or the chair or the fireball at the duck */
  if (j.tell) {
    if (now < j.tell.at) return false;
    const k = j.tell.k;
    delete j.tell;
    throwIt(s, k, at, p, now, fx);
    r.fireAt = Math.max(r.fireAt, now + 900);
    return true;
  }
  /* the hammer: on his way to the duck, then the swing toward where it stands by then */
  if (j.swing) {
    if (now < j.swing.at) return false;
    delete j.swing;
    const aim = Math.hypot(dx, dy) > 1e-4 ? [dx, dy] : [1, 0],
      hit = strike(s, JUSTIN_ID, "hammer", aim, now, at);
    fx({
      kind: "use",
      what: "hammer",
      who: [],
      face: aim[0] < 0 ? -1 : 1,
      ax: +aim[0].toFixed(3),
      ay: +aim[1].toFixed(3),
      ...(hit.length ? { hit } : {}),
    });
    r.fireAt = Math.max(r.fireAt, now + 600);
    return true;
  }
  if (now >= r.hamAt) {
    r.hamAt = now + rnd([3200, 4200]);
    if (far < 1.8) {
      stop();
      j.swing = { id: r.id, at: now + 350 };
      return true;
    } // (up close: a moment's wind-up, so it can step away)
    const ux = -dx / RX,
      uy = -dy / RY,
      u = Math.hypot(ux, uy) || 1;
    const to = {
        x: Math.max(0.03, Math.min(0.97, p.x + (ux / u) * 1.4 * RX)),
        y: Math.max(0, Math.min(1, p.y + (uy / u) * 1.4 * RY)),
      },
      v = SPEED * 1.9;
    Object.assign(j, {
      k: null,
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(to.x),
      y1: r3(to.y),
      t: now,
      v,
    });
    j.swing = {
      id: r.id,
      at: now + (Math.hypot(to.x - at.x, to.y - at.y) / v) * 1000 + 250,
    };
    return true;
  } // (further off: he sprints at it, then swings)
  if (now >= j.fbAt || now >= j.chairAt || now >= j.ctlAt) {
    const k =
      now >= j.fbAt ? "fireball" : now >= j.chairAt ? "chair" : "controller";
    stop();
    j.tell = {
      k,
      at:
        now +
        (k === "chair" ? CHAIR_TELL : k === "fireball" ? FB_TELL : THROW_TELL),
    };
    if (k === "fireball") j.fbAt = now + FB_EVERY;
    else if (k === "chair") j.chairAt = now + rnd([15000, 22000]);
    else j.ctlAt = now + rnd([8000, 12000]);
    j.ctlAt = Math.max(j.ctlAt, now + 2500);
    j.chairAt = Math.max(j.chairAt, now + 2500);
    fx({ kind: "mgjtell", what: k, until: j.tell.at });
    return true;
  }
  /* his pistol */
  if (now >= r.fireAt) {
    r.fireAt = now + rnd([650, 1150]);
    const ax = dx / d,
      ay = dy / d;
    fx({
      kind: "use",
      what: "handgun",
      who: [],
      face: ax < 0 ? -1 : 1,
      ax: +ax.toFixed(3),
      ay: +ay.toFixed(3),
    });
    s.shots = [
      ...(s.shots || []),
      {
        n: s.fxN * 10,
        by: JUSTIN_ID,
        k: "handgun",
        x0: at.x,
        y0: at.y,
        vx: +(ax * SHOT_SPEED).toFixed(4),
        vy: +(ay * SHOT_SPEED).toFixed(4),
        t: now,
        lx: at.x,
        ly: at.y,
      },
    ];
    return true;
  }
  /* where to stand: a few duck lengths from it, looked at again every 1.5 to 2.5 seconds */
  if (now < (r.next || 0)) return false;
  r.next = now + rnd([1500, 2500]);
  const want = rnd([5, 8]),
    ang = Math.atan2((at.y - p.y) / RY, (at.x - p.x) / RX) + rnd([-0.9, 0.9]);
  Object.assign(j, {
    k: null,
    x0: r3(at.x),
    y0: r3(at.y),
    x1: r3(Math.max(0.05, Math.min(0.95, p.x + Math.cos(ang) * want * RX))),
    y1: r3(Math.max(0.06, Math.min(0.94, p.y + Math.sin(ang) * want * RY))),
    t: now,
    v: SPEED,
  });
  return true;
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

/* the host's part, every heartbeat: true when s.justin changed. log: the rules' chat line */
export function justinTick(s, now, log) {
  if (isMgj(s)) return mgjTick(s, now, log); // (Mad God Justin: his boss brain, mgjrules.js)
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
  if (j.key !== key) {
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
    if (now - j.down < (boardMgj(s) ? downFor(s) : DOWN)) return ch;
    delete j.down;
    if (j.max) j.hp = j.max; // (the board's Mad God Justin: up with his HP full)
    j.next = now + 1000;
    j.say = Math.max(j.say, now + 4000);
    ch = true;
  }
  /* his lines, a shuffled playlist */
  if (now >= j.say) {
    if (!j.list.length)
      j.list = E_LINES.map((_, i) => i).sort(() => Math.random() - 0.5);
    log(s, { npc: JUSTIN_ID, name: "Justin", text: E_LINES[j.list.shift()] });
    j.say = now + rnd(SAY);
    ch = true;
  }
  if (!boardPhases(s).includes(s.phase)) return ch;
  const at = justinAt(j, now),
    ducks = playing(s)
      .map((id) => s.pos[id])
      .filter((p) => p && p.x >= 0);
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
      s.shots = [
        ...(s.shots || []),
        {
          n: s.fxN,
          by: JUSTIN_ID,
          k: "handgun",
          x0: at.x,
          y0: at.y,
          vx: +(ax * SHOT_SPEED).toFixed(4),
          vy: +(ay * SHOT_SPEED).toFixed(4),
          t: now,
          lx: at.x,
          ly: at.y,
        },
      ];
      ch = true;
    }
  }
  const fx = (o) => {
    s.fxN = (s.fxN || 0) + 1;
    s.fx = [
      ...(s.fx || []).slice(-19),
      { n: s.fxN, by: JUSTIN_ID, t: now, ...o },
    ];
  };
  const targets = () =>
    playing(s).filter(
      (id) => s.pos[id] && s.pos[id].x >= 0 && !s.players[id].dead,
    );
  const calm = !s.options.fun || (isQuack(s) && s.phase === "reveal");
  /* the board's Mad God Justin: his HP, and the duck that hurt him */
  if (boardMgj(s)) {
    if (j.hp == null) {
      j.hp = j.max = BJ_HP;
      ch = true;
    }
    if (j.rage)
      return rageTick(s, now, at, fx, isQuack(s) && s.phase === "reveal") || ch;
  } else if (j.hp != null || j.rage) {
    delete j.hp;
    delete j.max;
    delete j.rage;
    ch = true;
  }
  /* lightning or fire from the sky, a moment after his line */
  if (j.god && now >= j.god.at) {
    const id = j.god.id,
      P = s.players[id],
      p = s.pos[id];
    delete j.god;
    ch = true;
    if (P && p && p.x >= 0 && !calm) {
      P.dead = true;
      holdDown(s, id, now);
      fx({ kind: Math.random() < 0.5 ? "lightning" : "fire", who: [id] });
    }
  }
  j.godAt ??= now + rnd(GOD);
  if (now >= j.godAt && !j.god) {
    j.godAt = now + rnd(GOD);
    const them = targets();
    if (!calm && them.length) {
      if (!(j.gods || []).length)
        j.gods = GOD_LINES.map((_, i) => i).sort(() => Math.random() - 0.5);
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
    fx({
      kind: "use",
      what: "hammer",
      who: [],
      face: aim[0] < 0 ? -1 : 1,
      ax: +aim[0].toFixed(3),
      ay: +aim[1].toFixed(3),
      ...(hit.length ? { hit } : {}),
    });
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
        ux = (at.x - p.x) / RX,
        uy = (at.y - p.y) / RY,
        d = Math.hypot(ux, uy) || 1;
      const to = {
          x: Math.max(0.03, Math.min(0.97, p.x + (ux / d) * 1.4 * RX)),
          y: Math.max(0, Math.min(1, p.y + (uy / d) * 1.4 * RY)),
        },
        v = SPEED * 1.8;
      Object.assign(j, {
        k: null,
        x0: r3(at.x),
        y0: r3(at.y),
        x1: r3(to.x),
        y1: r3(to.y),
        t: now,
        v,
      });
      j.swing = {
        id,
        at: now + (Math.hypot(to.x - at.x, to.y - at.y) / v) * 1000 + 250,
      };
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
    Object.assign(j, {
      k,
      x0: r3(at.x),
      y0: r3(at.y),
      x1: r3(to.x),
      y1: r3(to.y),
      t: now,
      v: SPEED,
    });
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
