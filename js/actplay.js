/* ---------- a game's actions (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import { jumpKept } from "./jump.js";
import { bbWrite } from "./bbrules.js";
import {
  ARROW_SPEED,
  CHAIR_DUCKS,
  CHAIR_MS,
  DAGGER_SPEED,
  DUCK_PELLET_LIFE,
  PELLET_SPREAD,
  EFFECTS,
  GRENADE_FAR,
  KB_LAND,
  KB_MS,
  L4_OVER_MS,
  PELLET_V,
  PRESS,
  SB_OUT_MS,
  SHOT_SPEED,
  VOTE_GRACE,
  advance,
  aimOf,
  backToLobby,
  boardPhases,
  cabinCheck,
  cabinOver,
  cabinTick,
  canEndRound,
  clone,
  colAt,
  colBoundsAt,
  coolEnds,
  coolFor,
  counselBounds,
  goOnDone,
  heldCol,
  inWorld,
  isBb,
  isHang,
  isLaw,
  isSc,
  logLine,
  needed,
  onKeys,
  playing,
  question,
  reviewCount,
  say,
  shareOf,
} from "./rules.js";
import { cakeGone, throwCake } from "./boardfire.js";
import { hpOf } from "./hpmath.js";
import {
  GATE_BREEDS,
  waiting,
  heldBack,
  roundsOf,
  shotKind,
  coneOf,
  roundAt,
  nadeThrow,
} from "./weaponuse.js";
import { spreadAim } from "./heat.js";
import { isSb, boardDuck, sbBoardK, sbItemMods } from "./sandboxrules.js";
import { godHas } from "./sbgod.js";
import { capOf, infAmmo, magOf, reloadMag, shootMag } from "./ammo.js";
import { sbTick } from "./sbspawn.js";
import { sbOut, sbOutTick } from "./sbout.js";
import { sbSlots, sbGot, sbSpend } from "./sbhot.js";
import { sbLootTick } from "./sbloot.js";
import { sbZoneTick, sbLandAct } from "./sbzone.js";
import { sbGroupTick } from "./sbgroups.js";
import { sbEnd } from "./sbsave.js";
import { took } from "./perf.js";
import {
  isDn,
  DN_GRACE,
  dnVote,
  dnTick,
  isDefender,
  dnEndVote,
} from "./duncerules.js";
import {
  isVd,
  VD_PHASES,
  vdEnd,
  vdTimer,
  vdTick,
  vdWrite,
  seated,
} from "./vddrules.js";
import {
  isTv,
  TV_BOARD,
  tvWrite,
  tvPick,
  tvEnd,
  tvGrade,
  tvStop,
} from "./triviarules.js";
import {
  isQuack,
  QUACK_PHASES,
  startQuackRound,
  quackEnd,
  wqWord,
  holdStill,
  quackMoved,
} from "./quackrules.js";
import {
  shielded,
  comeBack,
  normalGame,
  downStill,
  standUps,
  isGhost,
} from "./hangout/death.js";
import { hangAction, hangTick, hangStill } from "./hangout/rules.js";
import { inCabin, W as HW, H as HH } from "./hangout/layout.js";
import { justinTick } from "./boardjustin.js";
import { pwTick } from "./wounds.js";
import {
  isL4dd,
  l4Use,
  l4Reload,
  l4Shots,
  l4Holds,
  laserHeat,
  l4Again,
} from "./l4ddrules.js";
import { ARMS, BOARD_GUNS, BOARD_WEAPONS, AUTO, THROWS } from "./guns.js";
import { modeOf } from "./modes.js";
import { SC_VOTES, scVote, scWrite } from "./scrules.js";
import {
  ATT_FAST,
  ATT_PHASES,
  attRole,
  canGiveUp,
  counselDone,
  counselOk,
  isCounsel,
  lawVote,
  verdict,
} from "./lawrules.js";
import {
  MELEE,
  SB_H,
  attacks,
  duckFlame,
  floorFirst,
  groundFire,
  gunSpeed,
  moveShots,
  strike,
} from "./boardfire.js";
import { dodRoom, dodSettle, dodStarts, dodVoting } from "./roomrules.js";
import { countdown, nextVote, rolling, sbHere, votesDue } from "./voterules.js";
import { zOf, fallHurt } from "./heights.js";
import {
  act_draw,
  draws,
  cooks,
  drawTaken,
  drawOf,
  drawMost,
  drawFast,
  cookedOff,
  cookedOut,
  drawSwitched,
} from "./bowdraw.js";
import { NADE } from "./gamedefaults.js";

/* ---------- the actions of a game: answers, moves, the specials, fights, the turn's end and the clock ---------- */
export function act_submit({ state, s, a, now, me }) {
  if (isVd(s)) return vdWrite(s, a, now, true) || state; // (Valentine's Duck Date: The Date's topic)
  if (isTv(s)) {
    const r = tvWrite(s, a, now, true);
    return !r ? state : r.phase === "tvwrite" ? advance(r, now) : r;
  } // (Trivia: a question, or a written answer)
  if (isBb(s)) return bbWrite(s, a, now, true);
  if (isSc(s)) return scWrite(s, a, now, true) || state;
  if (!me || s.phase !== "submit" || s.done[a.id]) return s;
  const q = question(s, a);
  s.subs = (s.subs || []).filter((x) => x.by !== a.id);
  if (q)
    s.subs.push({
      by: a.id,
      ...q,
      time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime,
    });
  s.done[a.id] = true;
  return advance(s, now);
}

export function act_draft({ state, s, a, now, me }) {
  // what a player has typed so far (kept by the host, sent in for them at the end)
  if (isVd(s)) return vdWrite(s, a, now, false) || state;
  if (isTv(s)) return tvWrite(s, a, now, false) || state;
  if (isBb(s)) return bbWrite(s, a, now, false) || state;
  if (isSc(s)) return scWrite(s, a, now, false) || state;
  if (!me || s.phase !== "submit" || s.done[a.id]) return state;
  s.drafts = {
    ...(s.drafts || {}),
    [a.id]: {
      ...(question(s, a) || { text: "" }),
      time: [0, 30, 60, 90].includes(a.time) ? a.time : s.options.answerTime,
    },
  };
  return s;
}

export function act_move({ state, s, a, now, me }) {
  // x, y on the board; j = when the current jump started (0 = on the ground)
  if (!me || !s.pos[a.id]) return state;
  if (!boardPhases(s).includes(s.phase)) return state;
  const was = s.pos[a.id],
    j = +a.j || 0,
    keep = drawSwitched(s, a.id, a.w) ? s : state; // (another weapon picked: a cooking grenade put away, bowdraw.js, even by a duck that can't move now)
  if (holdStill(s, a.id, now)) return keep; // Who is the Quack?: the last duck plays dead for a moment
  if (
    (isL4dd(s) || isSb(s)) &&
    was.tp &&
    now - was.tp < 1500 &&
    Math.hypot((+a.x || 0) - was.x, (+a.y || 0) - was.y) > 0.03
  )
    return keep; // (Quacky Zombies and Sandbox: the host just put it at a start spot; a move sent before that got there is old)
  if (isHang(s) && hangStill(s, a.id, now)) return keep; // Hangout: shot by Justin, it can't move for a while
  if (downStill(s, a.id, now)) return keep; // the boards: knocked down, it can't move for the host's time (1 s unless set)
  if (sbOut(s, a.id)) return keep; // (Sandbox: out of lives, it stays down: sbout.js)
  if (seated(s, a.id)) return keep; // (Valentine's Duck Date: the two at the table stay in their seats)
  let x = Math.max(0, Math.min(1, +a.x || 0)),
    y = Math.max(0, Math.min(1, +a.y || 0));
  // a vote keeps its answer: the duck walks only inside its own column until Vote is pressed again (a juror may walk over and change their vote)
  {
    const c = heldCol(s, a.id);
    if (c != null && c >= 0) {
      const [lo, hi] = colBoundsAt(s, c);
      x = Math.max(lo, Math.min(hi, x));
    }
  }
  if (s.phase === "answer" && isLaw(s) && isCounsel(s, a.id)) {
    const [lo, hi] = counselBounds(s, a.id);
    x = Math.max(lo, Math.min(hi, x));
  } // the attorneys argue from their own side, the offense left, the defense right
  if (s.phase === "answer" && isDn(s) && isDefender(s, a.id)) {
    const [lo, hi] = colBoundsAt(s, -1);
    x = Math.max(lo, Math.min(hi, x));
  } // (Duncelation: the defender from the circle)
  if (isDn(s) && s.phase === "dunced" && isDefender(s, a.id)) return state; // the dunce stays on the podium
  if (isQuack(s) && ["choice", "accuse"].includes(s.phase) && s.done[a.id]) {
    x = was.x;
    y = was.y;
  } // a vote holds its spot
  if (isSc(s) && SC_VOTES.includes(s.phase) && s.done[a.id]) {
    x = was.x;
    y = was.y;
  } // a story vote holds its spot
  if (
    s.phase !== "answer" &&
    s.phase !== "bracket" &&
    s.phase !== "dunced" &&
    !isSc(s) &&
    !me.late &&
    !isQuack(s) &&
    !isHang(s) &&
    !isVd(s) &&
    !isTv(s) &&
    !isSb(s)
  ) {
    // after answering: inside your own column; no answer, no board (late joiners roam; over the bracket anyone does)
    const c = s.lock[a.id];
    if (c === undefined) {
      x = was.x;
      y = was.y;
    } else {
      const [lo, hi] = colBoundsAt(s, c);
      x = Math.max(lo, Math.min(hi, x));
    }
  }
  const w = (
      isL4dd(s)
        ? l4Holds(s, a.id, a.w)
        : BOARD_WEAPONS.includes(a.w) && onKeys(me.duck, a.w) && s.options.fun
    )
      ? a.w
      : "",
    [ax, ay] = w ? aimOf(a, 1) : [0, 0]; // a weapon kept out, and where it aims
  const hz = (v) => Math.max(-400, Math.min(1200, Math.round(+v || 0))); // Hangout: z, the height of its feet; b, where its jump began (world px)
  s.pos[a.id] = {
    x,
    y,
    j,
    q: /^[lrud]$/.test(a.q) ? a.q : "",
    sp: !!a.sp,
    ...(w ? { w, ax: +ax.toFixed(3), ay: +ay.toFixed(3) } : {}),
    ...(isHang(s)
      ? {
          z: hz(a.z),
          b: hz(a.b),
          ...jumpKept(j, a),
        }
      : {}),
    ...(was &&
    was.kb &&
    now - was.kb.t < (was.kb.l ?? KB_LAND) + (was.kb.ms || KB_MS)
      ? { kb: was.kb }
      : {}),
  }; // q: squashed against l/r/u/d; sp: sprinting; tb: a trampoline bounce's height
  quackMoved(s, a.id); // (Who is the Quack?: first onto the Quack's tile)
  if (me.dead && (x !== was.x || y !== was.y)) {
    delete me.dead;
    comeBack(s, a.id, now);
  }
  attacks(s, now); // (walked into a swing, or swung into a duck)
  return s;
}

export function act_end({ state, s, a, now, me }) {
  // end your turn (answer, discuss) or be ready for the next round (results)
  if (isQuack(s) && QUACK_PHASES.includes(s.phase))
    return quackEnd(s, a, now) || state;
  if (isSc(s)) return scVote(s, a, now) || state;
  if (isHang(s)) return state; // (Hangout's button is its own action, below)
  if (isVd(s) && VD_PHASES.includes(s.phase)) return vdEnd(s, a, now) || state; // (Valentine's Duck Date: only The Date's Next duck and Turn down)
  if (isTv(s) && TV_BOARD.includes(s.phase)) return state; // (Trivia: its own action, below)
  if (
    !me ||
    me.late ||
    ![...boardPhases(s), "results"].includes(s.phase) ||
    s.phase === "tie"
  )
    return s; // (a tie is settled with tieVote)
  if (s.phase === "dunced") return state; // (Duncelation: the dunce's moment runs its time, then the stats)
  if (
    s.phase === "answer" &&
    !(s.pos[a.id] && s.pos[a.id].x >= 0 && colAt(s, s.pos[a.id].x) >= 0)
  )
    return s; // stand on a column (a tile) first
  if (
    s.phase === "answer" &&
    now < s.at + (isDn(s) ? DN_GRACE : VOTE_GRACE) * 1000
  )
    return state; // not in the first seconds (Duncelation: its grace period)
  if (s.phase === "answer" && isLaw(s)) return lawVote(s, a, now) || state;
  if (s.phase === "answer" && isDn(s)) return dnVote(s, a, now) || state;
  s.done[a.id] = a.v ?? !s.done[a.id]; // pressing Vote again takes the vote back (and frees the duck to walk)
  return advance(s, now);
}

export function act_endRound({ state, s, a, now, me }) {
  // the End round button: anyone playing, once enough have voted
  if (!me || me.late || !playing(s).includes(a.id) || !canEndRound(s))
    return state;
  return advance(s, now, true);
}

export function act_voteReview({ s, a, me }) {
  if (!me || s.phase !== "results" || s.round < 1 || s.reviewVotes[a.id])
    return s;
  s.reviewVotes[a.id] = true;
  if (reviewCount(s) >= needed(s)) s.review = true;
  return s;
}

export function act_cabinEnd({ state, s, a, now, me }) {
  // Hangout's End Cabin and Quacky Zombies' Exit Cabin: a click votes, another takes it back; half the people
  // (never the computers) start a CABIN_END_MS timer, and the cabin game ends when it runs out
  // (and Sandbox's Leave Sandbox, on the board too)
  if (!sbHere(s) || !me || me.bot) return state;
  const c = (s.cabinEnd = s.cabinEnd || { by: {}, at: 0 });
  c.by = c.by || {}; // (online, an empty list of votes doesn't come back)
  if (c.by[a.id]) delete c.by[a.id];
  else c.by[a.id] = true;
  cabinCheck(s, now);
  return s;
}

export function act_toLobby({ s, a, P, me, boss }) {
  /* Single Player: leaving a game goes back to its own lobby, whatever the game (the owner's, Nov 19 23:10Z: "When
         you quit a game in single player, it should not take you back to the rooms for multiplayer") */
  if (boss && s.solo && s.phase !== "lobby")
    return backToLobby(s, "Back to the lobby.");
  if (boss && sbHere(s))
    return backToLobby(s, `${me.name} took everyone back to the lobby.`); // (Hangout and Sandbox: the host ends it whenever)
  if (boss && s.phase === "over") {
    s.phase = "lobby";
    s.round = 0;
    s.history = [];
    s.jumps = {};
    s.dn = null;
    s.vd = null;
    for (const id of s.seat) P[id].ready = false;
  }
  return s;
}

export function act_jumps({ s, a, me }) {
  if (me) s.jumps[a.id] = Math.max(0, +a.n || 0);
  return s; // completed jumps this game
}

export function act_ping({ state, s, a, me }) {
  // a player's connection: milliseconds to the game server and back
  const ms = Math.max(0, Math.min(9999, Math.round(+a.ms || 0)));
  if (!me || me.ms === ms) return state;
  me.ms = ms;
  return s;
}

export function act_idle({ state, s, a, me }) {
  if (!me || !!me.idle === !!a.v) return state;
  me.idle = !!a.v;
  return s; // no key, click or touch in 2 minutes
}

export function act_use({ state, s, a, now, me, boss }) {
  // an item on the board, seen by everyone; the handgun's bullet or the dagger then flies the way it was aimed
  const sp = a.what || (me && me.duck && me.duck.special),
    p = s.pos[a.id];
  if (!me || !p || p.x < 0 || !boardPhases(s).includes(s.phase)) return state;
  if (draws(sp)) {
    if (cooks(sp) && !drawOf(s, a.id, sp)) return state; // (a grenade let go after it went off in the hand: bowdraw.js cookedOff)
    a = { ...a, dr: drawTaken(s, a.id, now, drawMost(sp), sp) }; // (the bow: how long it was drawn; a grenade: how long it cooked, bowdraw.js)
  }
  if (isL4dd(s)) return l4Use(s, a, now) ? s : state; // (Quacky Zombies: its own weapons, l4ddrules.js)
  /* the normal games: a downed duck can't use a weapon, and neither can one just back from dying, in its spawn protection,
         where what it shot or swung hurt nobody anyway (the owner's, Nov 19 16:30Z: "when players are downed in normal modes
         they should not be able to do damage or use their weapons" and "they still get their invulnerability frames where they
         cannot fire or attack with weapons during"). Sandbox keeps its own downs */
  if (normalGame(s) && !isSb(s) && (me.dead || shielded(s, a.id, now)))
    return state;
  if (isSb(s) && me.dead) return state; // (Sandbox: a downed duck can't use a weapon either)
  if (
    !PRESS.includes(sp) ||
    !(isSb(s) ? sbSlots(s, a.id).includes(sp) : onKeys(me.duck, sp))
  )
    return state;
  if ((BOARD_WEAPONS.includes(sp) || sp === "chair") && !s.options.fun)
    return state; // the silly-commands switch covers them
  if (isGhost(s, a.id)) return state; // (Duck Cabin: a ghost can't use anything)
  const gotM = isSb(s) && sbGot(s, a.id, sp); // (Sandbox: taken from a loot orb with its own numbers, sbhot.js)
  if (gotM && gotM.u === 0) return state; // (used up, still in its slot)
  if (sp === "sound") return state; // (Sound is off for now: specials.js off)
  const k = `${a.id} ${sp}`; // (each item waits on its own)
  if (
    (!cookedOut(sp, a.dr) && // (bowdraw.js)
      waiting(
        GATE_BREEDS.board,
        {
          auto: AUTO.includes(sp),
          cool: coolFor(sp),
          ends: coolEnds(s, a.id, sp),
        },
        now,
      )) ||
    heldBack(s, sp, () => laserHeat(s, a.id, now).over)
  )
    return state; // (weaponuse.js: its wait, the one zebra cake, a Laser Rifle overheated)
  const m = magOf(s, a.id, now, sp),
    many = sp === "burst" && m ? roundsOf(ARMS.burst, m.c[0]) : 1; // (the burst rifle: three rounds a press, or the rest of its clip)
  if (!shootMag(s, a.id, now, sp, many, unlimited(s, a.id, sp))) return state; // (Dead Ducks Arcade's ammo in every mode, ammo.js: empty, or reloading)
  s.lastUse = { ...(s.lastUse || {}), [k]: now };
  if (gotM) sbSpend(s, a.id, sp); // (one of its uses: sbhot.js)
  const face = a.face < 0 ? -1 : 1,
    u = isHang(s) ? [0.006, 0.012] : boardDuck(s), // (a duck's size each way)
    aim = spreadAim(
      s,
      a.id,
      sp,
      BOARD_WEAPONS.includes(sp) || THROWS.includes(sp) ? aimOf(a, face) : null,
      now,
      many,
      u,
    ); // (a gun fired fast: off its aim within a cone as wide as its heat, heat.js)
  const hit = MELEE.includes(sp) ? strike(s, a.id, sp, aim, now) : null; // (the melees hit at once, up close, and while they swing: attacks)
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    {
      n: s.fxN,
      kind: "use",
      what: sp,
      by: a.id,
      who: [a.id],
      face,
      t: now,
      ...(aim ? { ax: +aim[0].toFixed(3), ay: +aim[1].toFixed(3) } : {}),
      ...(hit ? { hit } : {}),
    },
  ];
  if (aim && !hit && sp === "flamer") duckFlame(s, a.id, p, aim, now);
  else if (aim && !hit) {
    const v =
        (sp === "dagger"
          ? DAGGER_SPEED
          : sp === "bow"
            ? ARROW_SPEED * drawFast(a.dr)
            : BOARD_GUNS.includes(sp)
              ? gunSpeed(sp)
              : SHOT_SPEED) / sbBoardK(s), // (Sandbox's bigger board: the same speed in ducks)
      hang = {
        ...(isHang(s)
          ? {
              hz: Math.round(zOf(p, "body", now)), // (in a jump: its arc now, heights.js)
              hin: inCabin(p.x * HW, p.y * HH) ? 1 : 0,
            }
          : {}), // (Hangout: the height it flies at, and which side of the cabin's walls)
        ...(["grenade", "glauncher", "chair", "zebra"].includes(sp)
          ? {}
          : floorFirst(s, a.id, p, aim, now)), // (a duck on my floor in its line: it stays on my floor)
      };
    const shot = (n, k, vx, vy, more) => ({
      n,
      by: a.id,
      k,
      x0: p.x,
      y0: p.y,
      vx: +vx.toFixed(4),
      vy: +vy.toFixed(4),
      t: now,
      lx: p.x,
      ly: p.y,
      ...hang,
      ...(a.dr != null ? { dr: a.dr } : {}), // (an arrow: its draw, bowdraw.js)
      ...more,
    });
    const [rx, ry] = u,
      dx = aim[0] / rx,
      dy = aim[1] / ry,
      dl = Math.hypot(dx, dy) || 1; // (the aim in duck lengths: the shotgun's cone and the grenade's throw are measured in them)
    if (sp === "shotgun") {
      // a cone of pellets
      const out = [];
      for (const [i, an] of coneOf(
        Math.atan2(dy, dx),
        ARMS.shotgun.pellets,
        PELLET_SPREAD,
      ).entries()) {
        const bx = Math.cos(an) * rx,
          by = Math.sin(an) * ry,
          bl = Math.hypot(bx, by);
        out.push(
          shot(
            s.fxN * 10 + i,
            shotKind(sp),
            (bx / bl) * (PELLET_V / sbBoardK(s)),
            (by / bl) * (PELLET_V / sbBoardK(s)),
            { life: DUCK_PELLET_LIFE },
          ),
        );
      }
      s.shots = [...(s.shots || []), ...out];
    } else if (sp === "chair") {
      const k = CHAIR_DUCKS / dl;
      s.shots = [
        ...(s.shots || []),
        shot(s.fxN, "chair", dx * k * rx, dy * k * ry, { life: CHAIR_MS }), // (its reach: its picture's, boardfire.js sizeShots)
      ];
    } else if (sp === "zebra") throwCake(s, a.id, p, aim, now);
    else if (sp === "grenade")
      s.shots = [
        ...(s.shots || []),
        shot(s.fxN, "grenade", 0, 0, {
          hz: hang.hz || 0, // (a board: its flat ground)
          ...nadeThrow(
            dx / dl,
            dy / dl,
            GRENADE_FAR,
            NADE.T,
            NADE.PEAK,
            now + NADE.FUSE - Math.min(NADE.FUSE, a.dr || 0),
            now,
            [1 / rx, 1 / ry],
          ),
        }),
      ];
    // (the maps' grenade, in duck lengths: cooked while held, an arc, it lies there till its fuse ends, weaponuse.js)
    else if (sp === "glauncher")
      s.shots = [
        ...(s.shots || []),
        shot(s.fxN, "lgren", aim[0] * v, aim[1] * v, {
          life: Math.round((ARMS.glauncher.far / ARMS.glauncher.speed) * 1000),
        }),
      ];
    // (straight, and it goes off on the first duck or at its range: moveShots)
    else
      for (let i = 0; i < many; i++)
        s.shots = [
          ...(s.shots || []),
          shot(
            s.fxN,
            shotKind(sp),
            aim[0] * v,
            aim[1] * v,
            roundAt(s.fxN, i, now, ARMS[sp] && ARMS[sp].gap),
          ),
        ]; // (a burst's rounds leave one after another: each waits until its time, t)
  }
  return s;
}

export function act_reload({ state, s, a, now, me }) {
  // R: the handgun reloads before its magazine is empty
  if (me && isL4dd(s)) return l4Reload(s, a, now) ? s : state;
  if (!me) return state;
  const w = capOf(a.w) ? a.w : "handgun"; // (the board: the gun named, or the handgun)
  if (
    !(isSb(s) ? sbSlots(s, a.id).includes(w) : onKeys(me.duck, w)) ||
    !s.options.fun
  )
    return state;
  return reloadMag(s, a.id, now, w, unlimited(s, a.id, w)) ? s : state;
}
/* G's Unlimited ammo, or Sandbox's God mode or a loot's own Unlimited ammo: the rest never goes down (ammo.js) */
export const unlimited = (s, id, w) =>
  infAmmo(s) ||
  (isSb(s) && (godHas(s, id, "ammo") || sbItemMods(s, w).inf === true));

export function act_aura({ state, s, a, now, me }) {
  // an effect around a duck's head, seen by everyone: 5 seconds, or kept on (keep) until kept off
  const what = a.what;
  if (!me || !EFFECTS.includes(what) || !onKeys(me.duck, what)) return state;
  const cur = (s.aura || {})[a.id] || {},
    next = {};
  for (const [k, u] of Object.entries(cur)) if (!u || u > now) next[k] = u; // (0: kept on)
  if (a.keep) {
    if (cur[what] === 0) delete next[what];
    else next[what] = 0;
  } else next[what] = now + 5000; // (a kept one goes on for 5 more seconds)
  s.aura = { ...(s.aura || {}), [a.id]: next };
  return s;
}

export function act_tieVote({ state, s, a, now, me }) {
  // Bicker Brackets, a tied match: vote again, or a coin toss (it can be changed until everyone has chosen)
  if (!me || me.late || s.phase !== "tie" || !["again", "coin"].includes(a.v))
    return state;
  s.bb.tie = {
    ...s.bb.tie,
    votes: { ...(s.bb.tie || {}).votes, [a.id]: a.v },
  };
  s.done[a.id] = true;
  return advance(s, now);
}

export function act_wqWord({ state, s, a, now }) {
  return wqWord(s, a, now) || state; // Who is the Quack?: the secret word, from its picker
}

export function act_hang({ state, s, a, now, me }) {
  return me && isHang(s) && inWorld(s) && hangAction(s, a, now) ? s : state; // Hangout: an activity (k) did something
}

export function act_counsel({ state, s, a, now, me }) {
  // Lawyering: my pick (as the writer) or my vote (the room) for an attorney; it can change until the picking ends
  const L = s.law,
    how = L && L.how && L.how[a.role];
  if (
    !me ||
    me.late ||
    s.phase !== "counsel" ||
    !how ||
    (how === "writer" && a.id !== s.qs[s.qi].by) ||
    !counselOk(s, a.role, a.who)
  )
    return state;
  L.picks[a.role] = { ...L.picks[a.role], [a.id]: a.who };
  s.done[a.id] = counselDone(s, a.id);
  return advance(s, now);
}

export function act_attvote({ state, s, a, now, me }) {
  // Lawyering's attorney vote: my vote for the defense (then the offense); it can change until the clock runs out
  const L = s.law;
  if (
    !me ||
    me.late ||
    !isLaw(s) ||
    !L ||
    !ATT_PHASES.includes(s.phase) ||
    !counselOk(s, attRole(s), a.who)
  )
    return state;
  const role = attRole(s),
    picks = (L.picks[role] = { ...L.picks[role], [a.id]: a.who }),
    on = playing(s).filter((id) => s.players[id]);
  if (
    !L.fast &&
    on.filter((id) => picks[id] !== undefined).length >=
      Math.max(1, Math.ceil(on.length * shareOf(s) - 1e-9))
  ) {
    L.fast = 1;
    s.ends = now + Math.min(Math.max(0, s.ends - now), ATT_FAST);
  } // (the share of the room is in: 0:05 left)
  return s;
}

export function act_goOn({ state, s, a, now, me }) {
  // Next round: go on without the attorney (the defender) who left, once enough press it (again: take it back)
  const w = s.waiting;
  if (!me || me.late || !w || !w.for) return state;
  w.go = { ...w.go };
  if (w.go[a.id]) delete w.go[a.id];
  else w.go[a.id] = true;
  return goOnDone(s, now) || s;
}

export function act_tv({ state, s, a, now, me }) {
  // Trivia: a vote on a row (pick), End round (end), the writer's Correct or Wrong (grade), the reveal's Stop timer (stop)
  if (!me || !isTv(s)) return state;
  const r =
    a.k === "pick"
      ? tvPick(s, a, now)
      : a.k === "end"
        ? tvEnd(s, a, now)
        : a.k === "grade"
          ? tvGrade(s, a, now)
          : a.k === "stop"
            ? tvStop(s, a, now)
            : null;
  return r || state;
}

export function act_vdTimer({ state, s, a, now, me }) {
  return me && isVd(s) ? vdTimer(s, a, now) || state : state; // Valentine's Duck Date: The Date's Start timer (pause, go on)
}

export function act_dnEnd({ state, s, a, now, me }) {
  return me && isDn(s) ? dnEndVote(s, a, now) || state : state; // Duncelation: End round (or take it back)
}

export function act_giveUp({ state, s, a, now, me }) {
  // Lawyering: an attorney who isn't ahead in closing arguments gives the case to the other side
  const L = s.law;
  if (
    !me ||
    !isLaw(s) ||
    s.phase !== "answer" ||
    !L ||
    !L.close ||
    !canGiveUp(s, a.id)
  )
    return state;
  L.gave = a.id;
  say(s, `${me.name} gave up the case.`);
  return verdict(s, a.id === L.off ? 1 : 0, now);
}

export function act_tick({ state, s, a, now, host }) {
  // the host's heartbeat; the same state comes back when nothing changed, so nothing redraws
  if (s.phase === "countdown" && now >= s.ends) return nextVote(s, now);
  if (isQuack(s) && QUACK_PHASES.includes(s.phase) && s.wq && !s.hidden) {
    say(s, "A new host took over, so a new secret word.");
    return startQuackRound(s, now);
  } // (the old host's Secret Cards can't be opened)
  if (s.phase === "lobby" || s.phase === "over") {
    if (!dodRoom(s)) return state;
    const changed = dodSettle(s, now);
    if (dodStarts(s)) {
      const c = countdown(clone(s), now);
      if (c) return c;
    }
    return changed ? s : state;
  }
  if (s.phase === "countdown") return state;
  const dv = dodVoting(s) && dodSettle(s, now); // (Democracy of Ducklings: a vote during a game passes or runs out here)
  if (s.vote && now >= s.vote.ends) {
    say(s, "The vote ran out of time.");
    s.vote = null;
    return s;
  }
  if (sbHere(s) && cabinTick(s, now)) return s;
  if (
    isL4dd(s) &&
    inWorld(s) &&
    s.hang &&
    s.hang.l4 &&
    s.hang.l4.over &&
    (votesDue(s).length || rolling(s)) &&
    now - s.hang.l4.over.at >= L4_OVER_MS
  )
    return cabinOver(s, now, "Everyone's down.");
  const sbOut =
    isL4dd(s) && inWorld(s) && s.hang && s.hang.l4 && s.hang.l4.over;
  if (
    sbOut &&
    isSb(s) &&
    (sbOut.sb === "lobby" || sbOut.sb === "again") &&
    now - sbOut.at >= SB_OUT_MS
  ) {
    if (sbOut.sb === "lobby") return backToLobby(s, "Everyone's out.");
    l4Again(s, now);
    return s;
  } // (Sandbox's Rules: everyone out of lives, then the lobby or a new start)
  const sbEnd = sbOutTick(s, now); // (the same off the zombie maps: sbout.js)
  if (sbEnd === "lobby") return backToLobby(s, "Everyone's out.");
  if (sbEnd) return s;
  if (inWorld(s) && modeOf(s.options.mode).timed && s.ends && now >= s.ends)
    return cabinOver(s, now, "Time's up in the cabin."); // (Hangout from Random or the vote: its time limit)
  const nades = cookedOff(s, now, (a) =>
    act_use({ state: s, s, a, now, me: s.players[a.id], boss: null }),
  ); // (a grenade held to its fuse's end: every mode's, bowdraw.js)
  const shots = isL4dd(s) ? l4Shots(s, now) : moveShots(s, now),
    hung = isHang(s) && inWorld(s) && hangTick(s, now),
    jus =
      justinTick(s, now, logLine) |
      dnTick(s, now) |
      vdTick(s, now) |
      attacks(s, now) | // (the knife and the hammer, still swinging)
      cakeGone(s, now) |
      (isL4dd(s) ? 0 : groundFire(s, now)) | // (the flamethrower's burning ground)
      pwTick(s, now, normalGame(s)) | // (the ducks' wounds going away: wounds.js)
      (isSb(s)
        ? +sbTick(s, now, SB_H) |
          +sbLootTick(s, now, SB_H) |
          +sbZoneTick(s, now, SB_H) |
          +sbGroupTick(s, now, SB_H)
        : 0), // (Sandbox: its spawns, respawns and the board's zombies; its loot orbs; its zones; its groups)
    up = standUps(s, now); // (a knocked-down duck stands up by itself when its time is up)
  const sig = () => [s.phase, s.qi, s.catchEnds, s.round, s.at].join(),
    was = sig();
  advance(s, now);
  return sig() === was && !nades && !shots && !hung && !jus && !up && !dv
    ? state
    : s;
}
export function act_land({ state, s, a, now, me }) {
  // my duck landed from a fall a.h world px high and a.s across (game.js: its own screen works the fall out): fall
  // damage in every mode with HP (heights.js fallHurt), and a Sandbox zone that hurts whoever lands on it (sbzone.js)
  if (!me || !s.pos[a.id] || !SB_H.ducks(s).includes(a.id)) return state;
  let ch = sbLandAct(s, a, now, SB_H);
  const hp = hpOf(s, a.id, now),
    k = fallHurt(a.h, Math.min(+a.s || 0, 4000));
  if (hp && hp[0] > 0 && k > 0) {
    SB_H.claw(s, a.id, Math.round(k * 100) / 100, now, "fall");
    ch = true;
  }
  return ch ? s : state;
}
export const PLAY_ACTS = {
  land: act_land,
  submit: act_submit,
  draft: act_draft,
  move: act_move,
  end: act_end,
  endRound: act_endRound,
  voteReview: act_voteReview,
  cabinEnd: act_cabinEnd,
  toLobby: act_toLobby,
  jumps: act_jumps,
  ping: act_ping,
  idle: act_idle,
  draw: act_draw,
  use: act_use,
  reload: act_reload,
  aura: act_aura,
  tieVote: act_tieVote,
  wqWord: act_wqWord,
  hang: act_hang,
  counsel: act_counsel,
  attvote: act_attvote,
  goOn: act_goOn,
  tv: act_tv,
  vdTimer: act_vdTimer,
  dnEnd: act_dnEnd,
  giveUp: act_giveUp,
  tick: act_tick,
};
