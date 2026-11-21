/* ---------- the board's weapons: hits, shots, blasts, melee, flames (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import {
  DAGGER_LIFE,
  FASTER,
  GRENADE_MS,
  GRENADE_R,
  boardPhases,
  critRoll,
  daggerZ,
  grenadeZ,
  hitSoaks,
  isHang,
  logLine,
  playing,
  pwOn,
  wounded,
} from "./rules.js";

import { flyShots, swingOn, swinging, swingMisses } from "./weaponuse.js";
import { KB_FAR, pushOf, pushAlong } from "./push.js";

import { jumpDodges } from "./jump.js";

import { duckBig, picGrow, scaleOf } from "./duck.js";

import { isSb, sbOnBoard, boardDuck, sbRule } from "./sandboxrules.js";

import { godOn } from "./sbgod.js";

import { sbPlaceDuck, sbHpOf } from "./sbspawn.js";

import { hpHeal, hundredths } from "./hpmath.js";

import { onCabin } from "./sbcabin.js";

import { ARM_SWING, BOARD_PX } from "./armspeed.js";

import { vdSafe } from "./vddrules.js";

import {
  holdDown,
  onGetUp,
  invuln,
  shielded,
  normalGame,
  hurtFx,
  isGhost,
} from "./hangout/death.js";

import { hangTargets, hangHit } from "./hangout/rules.js";

import { inCabin, standable, W as HW, H as HH } from "./hangout/layout.js";

import { justinHit, justinShown, justinAt, JUSTIN_ID } from "./boardjustin.js";

import { pwAdd, pwHit, DEATH } from "./wounds.js";

import {
  isMgj,
  mgjZombieHit,
  mgjStab,
  mgjHurt,
  mgjSoak,
  mgjGone,
  mgjShot,
  mgjHitAt,
  MGJ_SCALE,
  MGJ_HAMMER,
  DMG,
  mgjHalf,
  mgjLgren,
} from "./mgjrules.js";

import { picBody, duOfRoom } from "./sbbody.js";

import {
  isL4dd,
  l4Hurt,
  standing as l4Standing,
  l4Heal,
  maxHp,
} from "./l4ddrules.js";

import { ARMS } from "./guns.js";

import { l4Zups, l4SetHp } from "./zombies.js";

import { hOk, hLock, sameFloorAhead, floorLock } from "./heights.js";
import { zOf, nearH } from "./heights.js";

import { FLAME, flameReach, inCone } from "./flamer.js";
import { toPx } from "./units.js";

/* Justin knocked down by a player's weapon (the clown items unlock at 12): the last few, each numbered, so
   every device counts its own player's once (unlocks.js) */
function justinKilled(s, by, w) {
  if (!s.players[by]) return;
  s.jkN = (s.jkN || 0) + 1;
  s.jk = [...(s.jk || []).slice(-9), { n: s.jkN, by, w }];
}
/* a player knocked down by another player's weapon: the last few, each numbered, so every device counts its own player's
   kills once (unlocks.js: the shotgun opens at 144 kills, the grenade at 360, and Justin counts too) */
/* the normal game's HP (every mode but Mad God Justin and Dead Ducks Arcade): a duck has PHP HP before it plays dead
   (4: the owner's, Nov 18 16:50Z, "every player in other game modes has 4 hp by default"; it was 6), has them all back
   after PHP_BACK ms without a hit, and gets up with them all. s.php = { id: { n: HP lost, t: the last hit } }. True when the hit only took HP.
   What a hit takes (owner 2026-11-03 17:15Z, not in Quacky Zombies): the hammer, the chair and a grenade 3, the knife 2,
   the rest 1 */
export const PHP = 4;
const PHP_BACK = 6000;
export const phpLost = (s, id, now) => {
  const h = (s.php || {})[id];
  return h && now - h.t < PHP_BACK ? h.n : 0;
};
const HIT_DMG = {
  hammer: 3,
  axe: [1, 4], // (the fire axe 1 to 4, the short sword and the pan 1: the owner's, Nov 16)
  chair: 3,
  grenade: 3,
  knife: 2,
  sniper: [2, 3],
  ak: 2,
  ump: 2,
  burst: 2, // (the burst rifle: the AK-47's, the owner's, Nov 16 16:25Z)
  slug: PHP, // (the double barrel's slug: all of it)
  revolver: 2,
  chain: PHP,
}; // (Quacky Zombies' guns take what they take there: the sniper 2 or 3, the AK-47 and the revolver 2, the chain gun all)
export const dmgOf = (s, k) => {
  const d = isL4dd(s) ? 1 : HIT_DMG[k] || 1;
  return Array.isArray(d)
    ? d[0] + Math.floor(Math.random() * (d[1] - d[0] + 1))
    : d;
};
export function soaks(s, id, now, dmg = 1, by, raw = false) {
  if (isMgj(s)) return false;
  if (normalGame(s) && (shielded(s, id, now) || (by && shielded(s, by, now))))
    return true; // (spawn protection: nothing hurts a duck that just came back, and what it shoots hurts nobody)
  if (invuln(s)) return hurtFx(s, id, now); // (Invulnerability: the hit only flashes)
  const max = sbHpOf(s, id) || PHP, // (Sandbox: a spawn's or a respawn's HP for it, sbspawn.js)
    n = hundredths(phpLost(s, id, now) + (dmg >= PHP && !raw ? max : dmg)), // (the slug, the chain gun: all of it, whatever it has; in hundredths, up while any HP is left: hpmath.js)
    rest = { ...s.php };
  delete rest[id];
  s.php = n >= max ? rest : { ...rest, [id]: { n, t: now } };
  return n < max;
}
/* what Sandbox's spawns borrow (sbspawn.js): the ducks up on the board, and a zombie's swipe on one (dmg: its spawn's
   damage box) */
export const SB_H = {
  ducks: (s) =>
    playing(s).filter(
      (id) =>
        s.pos[id] &&
        !godOn(s, id) && // (God mode: they ignore it)
        s.pos[id].x >= 0 &&
        !(s.players[id] || {}).dead &&
        (!isL4dd(s) || l4Standing(s, id)),
    ), // (the zombie maps: not one that's down)
  claw(s, id, dmg, now, w = "claw") {
    if (godOn(s, id)) return; // (God mode: it never dies)
    if (isL4dd(s)) return l4Hurt(s, id, dmg, now, w); // (the zombie maps: as their zombies hurt)
    const P = s.players[id],
      p = s.pos[id];
    if (!P || P.dead || !p || jumpDodges(p, now)) return;
    if (!soaks(s, id, now, dmg, null, true)) {
      P.dead = true;
      holdDown(s, id, now);
    } // (raw: a spawn's damage box is only that much, never "all of it")
    if (pwOn(s)) pwHit(s, id, w, now, !!P.dead); // (its claw wounds, as a Dead Ducks Arcade zombie leaves them; a made NPC's weapon, that weapon's)
  },
  l4heal: l4Heal, // (the zombie maps' heal and most HP, and their own zombies: a group's, sbgroups.js)
  l4max: maxHp,
  l4up: l4Zups,
  l4set: l4SetHp,
  /* a zone's heal (sbzone.js): amt of what duck id lost comes back */
  heal(s, id, amt, now) {
    const h = (s.php || {})[id];
    if (!h || now - h.t >= PHP_BACK) return;
    const max = sbHpOf(s, id) || PHP,
      n = hundredths(max - hpHeal(max - h.n, amt, max)), // (a part-empty block fills first: hpmath.js)
      rest = { ...s.php };
    if (n > 0) rest[id] = { ...h, n };
    else delete rest[id];
    s.php = rest;
  },
};
/* a duck on Sandbox's board or Duck Cabin that stands up again: at a respawn for players, if there is one (the zombie
   maps bring theirs back their own way: l4ddrules.js) */
onGetUp((s, id, now) => {
  if (!sbOnBoard(s) && !onCabin(s)) return false;
  /* G's Rules, Lives (0: unlimited): each getting up spends one, and out of them the duck stays down for good, as on the
     zombie maps (the owner's row 199 test, "fall and die", on Duck Cabin) */
  const most = isSb(s) ? sbRule(s, "lives") : 0;
  if (most && s.players[id]) {
    const used = ((s.sb && s.sb.died) || {})[id] || 0;
    s.sb = {
      ...s.sb,
      died: { ...((s.sb && s.sb.died) || {}), [id]: used + 1 },
    };
    if (used + 1 >= most) return true; // (out of lives: it stays down)
  }
  sbPlaceDuck(s, id, now);
  return false;
});
function playerKilled(s, by, id, w) {
  if (!s.players[by] || by === id) return;
  s.pkN = (s.pkN || 0) + 1;
  s.pk = [...(s.pk || []).slice(-19), { n: s.pkN, by, id, w }];
}
/* a duck knocked flying (the hammer, a grenade): `far` duck lengths along (ux, uy), a direction in duck lengths, as far
   as it goes before a wall, a tree or the edge (Hangout: only on its side of the cabin's walls), or the board's edge.
   pos.kb = { t, x, y: where it was } lets every screen draw it; a grenade's adds ms (how long it flies), h (how high)
   and l: 0 (it falls at once, not when a swing gets there) */
/* a player's own picture when it's a cut-out (cropped, or erased before it was uploaded: Customize, duck.js cut), else
   null */
export const cutPic = (P) =>
  (P && P.duck && P.duck.cut && P.duck.image) || null;
/* where on player id a hit from (x, y) lands: their feet, or, for a cut-out picture, the nearest part of it that shows
   (sbbody.js picBody; the owner's, Nov 20: "cropped images can also be used for players' custom avatars", hit only
   where they show), or null when none of it is in reach. [rx, ry]: the rules' duck room there; up: the hit's height */
function playerAt(s, id, x, y, rx, ry, up = 0.4) {
  const p = s.pos[id],
    pic = cutPic(s.players[id]);
  if (!pic) return p;
  return picBody(
    p,
    pic,
    duckBig(s, id),
    duOfRoom(rx, ry),
    picGrow(s.players[id].duck),
  ).at(x, y, up);
}
/* does a shot from (x0, y0) along (dx, dy), at height up, meet what shows of player id's cut-out picture (true for
   any other duck: the reach test says) */
function shotMeets(s, id, x0, y0, dx, dy, rx, ry, up) {
  const pic = cutPic(s.players[id]);
  return (
    !pic ||
    picBody(
      s.pos[id],
      pic,
      duckBig(s, id),
      duOfRoom(rx, ry),
      picGrow(s.players[id].duck),
    ).line(x0, y0, x0 + dx, y0 + dy, up) >= 0
  );
}
/* a shove counted in world px (Hangout and the maps' own): far world px whichever way, in shove's duck lengths */
export function shovePx(s, id, ux, uy, far, now, side) {
  const dX = 0.006 * HW,
    dY = 0.012 * HH;
  shove(s, id, ux, (uy * dX) / dY, far / dX, now, side);
}
export function shove(s, id, ux, uy, far, now, side, more = {}) {
  const p = s.pos[id],
    hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s),
    vx = ux * far * rx,
    vy = uy * far * ry,
    n = Math.ceil(far * 3),
    [x, y] = pushAlong(
      [p.x, p.y],
      n,
      (i) => [
        Math.max(0, Math.min(1, p.x + (vx * i) / n)),
        Math.max(0, Math.min(1, p.y + (vy * i) / n)),
      ],
      ([tx, ty], [x, y]) =>
        !hang ||
        (standable(tx * HW, ty * HH, zOf(p), undefined, [x * HW, y * HH]) &&
          (inCabin(tx * HW, ty * HH) ? 1 : 0) === side),
    ); // (one loop for every push: push.js)
  s.pos[id] = {
    ...p,
    x: +x.toFixed(4),
    y: +y.toFixed(4),
    j: 0,
    kb: { t: now, x: p.x, y: p.y, ...more },
  };
}
/* the knife's stab and the hammer's swing, from duck `by` toward its aim: every duck on the ground in reach plays dead
   (the knife: the nearest one right in front; the hammer: all of them in a third of a circle, shoved back). Distances
   are in a duck's room, as for the bullets; in Hangout only on the same side of the cabin's walls and at about the same
   height. Justin can be hit too. Returns who was hit (JUSTIN_ID for Justin); done: who this swing already hit, never hit
   twice (Duck Cabin's own, Justin and the cats, go in it as "h:" and their id). */
export const REACH = {
  knife: [2.3, 0.9],
  hammer: [3, 0.5],
  axe: [3, 0.5],
  sword: [2.3, 0.5],
  pan: [2.3, 0.5],
}; // how far (duck lengths), and how wide (the cosine of the half angle): the fire axe swings as far as the hammer, the short sword and the pan not as far out
/* the melees, swung or stabbed up close (the fire axe, the short sword and the pan: the owner's, Nov 16) */
export const MELEE = ["knife", "hammer", "axe", "sword", "pan"];
function swing(s, by, sp, aim, now, from = s.pos[by], done = []) {
  // (from: where the swing starts; Justin on the boards isn't in s.pos)
  const p0 = from,
    hang = isHang(s),
    rx = hang ? 0.006 : boardDuck(s)[0],
    ry = hang ? (0.006 * HW) / HH : boardDuck(s)[1], // (in Hangout's world, a duck length the same in world px up and down as across, so a swing reaches as far every way: the owner's, Nov 18 15:18Z "Make sure melee weapons have the same range in any direction". It was 0.012, half as far again up and down)
    [far0, wide] = REACH[sp],
    far =
      far0 *
      sizeOf(s, by) * // (a bigger duck's arm and weapon reach farther, a smaller one's not as far: as they're drawn, sizeShots)
      (sp === "hammer" && by === JUSTIN_ID && isMgj(s)
        ? MGJ_SCALE * MGJ_HAMMER
        : 1); // (Mad God Justin's bigger hammer reaches farther)
  const al = Math.hypot(aim[0] / rx, aim[1] / ry) || 1,
    ux = aim[0] / rx / al,
    uy = aim[1] / ry / al;
  const side = hang ? (inCabin(...toPx(p0)) ? 1 : 0) : 0,
    z0 = duckH(s, p0);
  const near = (x, y, z, inSide, big = 1) => {
    // where (x, y) is from the swinger, in duck lengths, if it's in reach (big: a Seriat NPC's hitbox, reached sooner)
    if (hang && (inSide !== side || !nearH(z, z0))) return null;
    const dx = (x - p0.x) / rx,
      dy = (y - p0.y) / ry,
      d = Math.max(0, Math.hypot(dx, dy) - (big - 1) / 2);
    if (d > far) return null;
    const along = dx * ux + dy * uy;
    return d < 0.7 || along / d >= wide ? { d, dx, dy } : null; // (one standing right on top is hit whatever the aim)
  };
  let hits = [];
  for (const id of s.seat) {
    const p = s.pos[id],
      P = s.players[id];
    if (id === by || !p || p.x < 0 || !P || P.dead || isGhost(s, id)) continue;
    if (done.includes(id)) continue;
    if (isMgj(s) && by !== JUSTIN_ID) continue; // (Mad God Justin: the ducks are on one side)
    if (vdSafe(s, id)) continue; // (Valentine's Duck Date: nothing knocks down the two at the table)
    if (jumpDodges(p, now)) continue; // (a duck in the air is missed)
    const q = playerAt(s, id, p0.x, p0.y, rx, ry); // (a cut-out picture: its nearest part that shows)
    if (!q) continue;
    const n = near(
      q.x,
      q.y,
      zOf(p),
      hang ? (inCabin(...toPx(p)) ? 1 : 0) : 0,
      cutPic(P) ? 1 : duckBig(s, id),
    ); // (a duck bigger than 100%: its hitbox too, duck.js; a cut-out's size is in its picture)
    if (n) hits.push({ id, ...n });
  }
  if (sp === "knife") hits = hits.sort((a, b) => a.d - b.d).slice(0, 1);
  for (const h of hits) {
    const crit = critRoll(s, sp);
    if (
      !(isMgj(s) ? mgjSoak(s, h.id, now) : hitSoaks(s, h.id, now, sp, crit, by))
    ) {
      s.players[h.id].dead = true;
      holdDown(s, h.id, now);
      playerKilled(s, by, h.id, sp);
    } // (the HP: a hit it can take keeps the duck up, still shoved back by a hammer)
    wounded(s, h.id, sp, now, crit); // (its wounds: wounds.js)
    if (sp === "hammer") {
      // shoved straight back from the swinger
      const k = h.d > 0.05 ? 1 / h.d : 0;
      shove(
        s,
        h.id,
        h.d > 0.05 ? h.dx * k : ux,
        h.d > 0.05 ? h.dy * k : uy,
        pushOf(s, "hammer"), // (the mode's own: push.js)
        now,
        side,
      );
    }
  }
  let stab = false;
  if (!hang && by !== JUSTIN_ID && !done.includes(JUSTIN_ID) && isMgj(s))
    stab = mgjHitAt(
      s,
      by,
      now,
      (b) =>
        !!near(
          p0.x + (b.x - p0.x) / MGJ_SCALE,
          p0.y + (b.y - p0.y) / MGJ_SCALE,
          0,
          0,
        ), // (he's bigger: a swing reaches him from MGJ_SCALE times as far)
      logLine,
      DMG[sp] || 1,
    );
  // (Mad God Justin: 1 damage; a hit on his double counts for nothing)
  else if (
    !hang &&
    by !== JUSTIN_ID &&
    !done.includes(JUSTIN_ID) &&
    justinShown(s) &&
    !s.justin.down
  ) {
    // (the Justin option: he can be hit back; the board's Mad God Justin takes HP off first)
    const n = justinAt(s.justin, now),
      got = near(n.x, n.y, 0, 0) ? justinHit(s, by, now, logLine, sp) : 0;
    if (got === 2) justinKilled(s, by, sp);
    stab = got > 0;
  }
  if (
    !hang &&
    by !== JUSTIN_ID &&
    (isMgj(s) || sbOnBoard(s)) &&
    mgjZombieHit(
      s,
      (x, y, big, body) => {
        if (!body) return !!near(x, y, 0, 0, big);
        const q = body.at(p0.x, p0.y, handUp(s, by)); // (Sandbox's: its nearest part that shows to my hand, sbbody.js)
        return !!q && !!near(q.x, q.y, 0, 0);
      },
      sp,
      now,
      by,
    )
  )
    stab = true; // (Mad God Justin's zombies in reach too)
  if (hang)
    for (const n of hangTargets(s, now, sp)) {
      if (done.includes("h:" + n.id)) continue;
      const q = n.at
        ? n.at(p0.x, p0.y, handUp(s, by))
        : { x: n.x / HW, y: n.y / HH }; // (Sandbox's NPCs: their nearest part that shows to my hand, sbbody.js)
      if (
        q &&
        near(q.x, q.y, n.z, inCabin(n.x, n.y) ? 1 : 0, n.at ? 1 : n.r) &&
        hangHit(s, n.id, by, now, sp)
      ) {
        done.push("h:" + n.id);
        if (n.id === "justin") justinKilled(s, by, sp);
      }
    }
  return [...hits.map((h) => h.id), ...(stab ? [JUSTIN_ID] : [])];
}
/* the knife and the hammer hit whatever they touch while they swing, not only what's there at the press: I want a duck
   that walks into a jab, or a hammer coming down, hit too. The attack lasts as long as its animation (game.js: the
   knife's jab, the hammer's swing down and its rest), and every move and every heartbeat checks it again. The knife
   hits once; the hammer everything it touches, each once.
   s.atk = [{ by, sp, ax, ay, t, until, hit: [who it hit] }] */
const ATK_MS = ARM_SWING;
export function strike(s, by, sp, aim, now, from = s.pos[by]) {
  if (swingMisses(sp)) return []; // (the pan, half its swings: it swings through nothing)
  const hit = swing(s, by, sp, aim, now, from);
  s.atk = swingOn(
    s.atk,
    {
      by,
      sp,
      ax: aim[0],
      ay: aim[1],
      t: now,
      until: now + ATK_MS[sp],
      hit: [...hit],
      ...(from !== s.pos[by]
        ? { at: { x: from.x, y: from.y, z: from.z } }
        : {}), // (Justin's swing: from where he stood)
    },
    now,
  );
  return hit;
}
export function attacks(s, now) {
  if (!s.atk || !s.atk.length) return false;
  const keep = [];
  let ch = false;
  for (const a of s.atk) {
    if (!swinging(a, now) || (a.sp === "knife" && a.hit.length)) {
      ch = true;
      continue;
    }
    const J = a.by === JUSTIN_ID,
      from = a.at
        ? a.at
        : J
          ? (isMgj(s) ? !mgjGone(s, now) : justinShown(s) && !s.justin.down) &&
            justinAt(s.justin, now)
          : !(s.players[a.by] || {}).dead && s.pos[a.by];
    if (!from || from.x < 0) {
      ch = true;
      continue;
    } // (the swinger is down, or gone)
    const before = a.hit.length,
      hit = swing(s, a.by, a.sp, [a.ax, a.ay], now, from, a.hit);
    if (hit.length) {
      a.hit.push(...hit);
      if (J) for (const id of hit) mgjHurt(s, id);
      s.fxN = (s.fxN || 0) + 1;
      s.fx = [
        ...(s.fx || []).slice(-19),
        { n: s.fxN, kind: "hit", what: a.sp, by: a.by, who: [], t: now, hit },
      ];
    }
    if (hit.length || a.hit.length !== before) ch = true;
    keep.push(a);
  }
  s.atk = keep.length ? keep : null;
  return ch;
}
/* where a bullet or a dagger is, t ms after it was fired: on the board (x, y) and, for the dagger, its height z */
/* a duck's shots and throws leave its hand at its own Size (duck.js scaleOf: the owner's, Nov 19 16:50Z "make sure their
   laser sights, bullets, melee attacks, item throws, and everything is consistent between sizes big and small"): each
   new shot of a duck that isn't 100% keeps its size as sc, and flies that much higher (shotAt) and is drawn that much
   bigger when thrown (game.js) */
export function sizeShots(s) {
  if (!s.shots || !s.shots.length) return;
  let ch = false;
  const out = s.shots.map((sh) => {
    if (sh.sc !== undefined || !sh.by) return sh;
    ch = true;
    return { ...sh, sc: sizeOf(s, sh.by) };
  });
  if (ch) s.shots = out;
}
/* a duck's Size, as a share (1: 100%); Justin and the computers' made ducks without one: 1 */
const sizeOf = (s, id) =>
  (s.players && s.players[id] && scaleOf(s.players[id].duck)) || 1;
/* how high a swing is, in duck widths over the swinger's feet: their hand, as the screens draw it (game.js bodyAt) */
const handUp = (s, id) => 0.45 * sizeOf(s, id);
export const shotAt = (sh, t) => ({
  x: sh.x0 + (sh.vx * t) / 1000,
  y: sh.y0 + (sh.vy * t) / 1000,
  z:
    (sh.k === "dagger"
      ? daggerZ(t / 1000)
      : sh.k === "grenade"
        ? grenadeZ(t / 1000)
        : 0.41) * (sh.sc || 1), // (a bigger duck's from higher up: its hand, sizeShots)
});
/* a grenade going off at (x, y): every duck within GRENADE_R plays dead and is thrown away from it, three times as far as
   the hammer throws one; Justin is knocked down (Mad God Justin: 1 damage), Duck Cabin's Justin and cats are hit. In
   Hangout only on its side of the cabin's walls and at about its height. Every screen draws the blast (the boom fx) */
function blast(s, sh, x, y, now, o = {}) {
  const hang = isHang(s),
    w = o.w || "grenade",
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s),
    side = sh.hin || 0,
    hit = [];
  const near = (px, py, pz, inSide, big = 1) => {
    if (hang && (inSide !== side || !nearH(pz, sh.hz || 0))) return null;
    const dx = (px - x) / rx,
      dy = (py - y) / ry,
      d = Math.max(0, Math.hypot(dx, dy) - (big - 1) / 2); // (big: a Seriat NPC's hitbox)
    return d <= GRENADE_R * (o.wide || 1) ? { d, dx, dy } : null;
  };
  for (const id of s.seat) {
    const p = s.pos[id],
      P = s.players[id];
    if (!p || p.x < 0 || !P || isGhost(s, id)) continue;
    const self = id === sh.by && (w === "grenade" || w === "glauncher"); // (my own grenade hurts me too: the owner's, Nov 16)
    if (isMgj(s) && sh.by !== JUSTIN_ID && !self) continue; // (Mad God Justin: the ducks are on one side)
    if (vdSafe(s, id)) continue; // (Valentine's Duck Date: the two at the table)
    const n = near(
      p.x,
      p.y,
      zOf(p),
      hang ? (inCabin(...toPx(p)) ? 1 : 0) : 0,
      duckBig(s, id),
    ); // (a duck bigger than 100%: its hitbox too, duck.js)
    if (!n) continue;
    if (self && isMgj(s)) {
      if (mgjHalf(s, id, now)) hit.push(id);
      continue;
    } // (Mad God Justin: half my HP, rounded down, never down by it; no knock-back)
    const killed = !P.dead && !soaks(s, id, now, dmgOf(s, "grenade"), sh.by);
    if (P.dead || killed) {
      if (!P.dead) playerKilled(s, sh.by, id, w);
      P.dead = true;
      holdDown(s, id, now);
    } // (the normal game's HP: one hit's worth, and it still flies)
    if (killed && pwOn(s)) pwAdd(s, id, DEATH, now, true); // (killed by it: torn apart, headless and burnt)
    const a = n.d > 0.05 ? null : Math.random() * Math.PI * 2,
      [tx, ty] = n.d > 0.05 ? [n.dx / n.d, n.dy / n.d] : [0, 0];
    shove(
      s,
      id,
      a === null ? tx : Math.cos(a),
      a === null ? ty : Math.sin(a),
      pushOf(s, "grenade"), // (the mode's own: push.js)
      now,
      side,
      { ms: 650, h: 0.9, l: 0 },
    );
    hit.push(id);
  }
  if ((isMgj(s) || sbOnBoard(s)) && sh.by !== JUSTIN_ID)
    mgjZombieHit(
      s,
      (zx, zy, big, body) => {
        if (!body) return !!near(zx, zy, 0, 0, big);
        const q = body.at(x, y); // (Sandbox's: its nearest part that shows, sbbody.js)
        return !!q && !!near(q.x, q.y, 0, 0);
      },
      "grenade",
      now,
      sh.by,
    ); // (Mad God Justin's zombies in it: all their HP, as a grenade's blast in Dead Ducks Arcade)
  if (!hang && sh.by !== JUSTIN_ID && justinShown(s)) {
    const j = justinAt(s.justin, now);
    if (j && near(j.x, j.y, 0, 0)) {
      const got = isMgj(s)
        ? mgjStab(s, sh.by, now, logLine, w === "glauncher" ? DMG.lgren : 1)
        : justinHit(s, sh.by, now, logLine, w);
      if (got) {
        if (got === 2) justinKilled(s, sh.by, w);
        hit.push(JUSTIN_ID);
      }
    }
  }
  if (hang)
    for (const n of hangTargets(s, now, "grenade")) {
      const q = n.at ? n.at(x, y) : { x: n.x / HW, y: n.y / HH }; // (Sandbox's NPCs: their nearest part that shows, sbbody.js)
      if (
        q &&
        near(q.x, q.y, n.z, inCabin(n.x, n.y) ? 1 : 0, n.at ? 1 : n.r) &&
        hangHit(s, n.id, sh.by, now, w) &&
        n.id === "justin"
      )
        justinKilled(s, sh.by, w);
    }
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    {
      n: s.fxN,
      kind: "boom",
      by: sh.by,
      who: [],
      t: now,
      x: +x.toFixed(4),
      y: +y.toFixed(4),
      hit,
      ...(hang ? { hz: sh.hz || 0 } : {}),
      ...(o.wide ? { wide: o.wide } : {}),
    },
  ];
  return hit;
}
/* the handgun's bullets and the thrown daggers: a duck on the ground that one passes through plays dead (until it
   moves); a bullet flies on to the screen's edge, a dagger until it has fallen away. In Hangout one flies at the height
   it was fired from and hits only ducks standing about that high, on its side of the cabin's walls, and the walls stop
   it */
export function moveShots(s, now) {
  if (!s.shots || !s.shots.length) return false;
  const on = () => boardPhases(s).includes(s.phase),
    walled = (sh, at) =>
      sh.hin !== undefined && (inCabin(...toPx(at)) ? 1 : 0) !== sh.hin; // (Hangout: it hit the cabin's wall)
  s.shots = flyShots(
    s.shots.filter((sh) => sh.k), // (one fired before aiming: gone)
    now,
    {
      fuse: GRENADE_MS,
      U: [1, 1],
      at: shotAt,
      walled,
      boom: (sh, at) => on() && blast(s, sh, at.x, at.y, now), // (a grenade hits nothing on its way)
      launched: (sh, age) => {
        // the grenade launcher's: straight, and it goes off on the first duck it gets to, a wall, or at its range
        const at = shotAt(sh, Math.min(age, sh.life)),
          wall = walled(sh, at);
        if (
          wall ||
          age >= sh.life ||
          lgrenHits(s, sh, at, now) ||
          at.x < -0.05 ||
          at.x > 1.05 ||
          at.y < -0.05 ||
          at.y > 1.05
        ) {
          if (on())
            blast(s, sh, wall ? sh.lx : at.x, wall ? sh.ly : at.y, now, {
              w: "glauncher",
            });
          return false;
        }
        sh.lx = at.x;
        sh.ly = at.y;
        return true;
      },
      bullet: (sh, age) => {
        const at = shotAt(sh, age),
          x0 = sh.lx,
          y0 = sh.ly,
          wall = walled(sh, at);
        if (shotHits(s, sh, at, x0, y0, at.x - x0, at.y - y0, now))
          return false;
        sh.lx = at.x;
        sh.ly = at.y;
        return (
          !wall &&
          at.x > -0.3 &&
          at.x < 1.3 &&
          at.y > -0.6 &&
          at.y < 1.6 &&
          age < (sh.k === "dagger" ? DAGGER_LIFE : sh.life || 12000) && // (a shotgun's pellet: its own short life)
          on()
        ); // (on past the board to the screen's edge)
      },
    },
  );
  return true;
}
/* how fast one of Quacky Zombies' guns' bullets flies here: its speed there, in board widths a second, a little faster
   as every duck's bullets are (the grenade launcher's grenade keeps its own) */
export const gunSpeed = (w) =>
  (ARMS[w].speed / BOARD_PX) * (w === "glauncher" ? 1 : FASTER);
/* a duck's height for a shot (heights.js): in Hangout and Quacky Zombies its feet's (world px); on the boards 0 */
const duckH = (s, p) => (isHang(s) ? zOf(p) : 0);
/* Doom's same floor first, as in Dead Ducks Arcade (heights.js sameFloorAhead, the one rule for every mode): a duck (or,
   in Hangout, Justin or the shadow duck) on my floor in the line of my shot keeps the shot on my floor: { lh }, else {}
   (it goes to the first target at any height). Measured in duck lengths; in Hangout the cabin's walls stop the look */
export function floorFirst(s, id, p, aim, now) {
  const hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s),
    l = Math.hypot(aim[0] / rx, aim[1] / ry) || 1,
    hz = duckH(s, p),
    side = hang && !!inCabin(...toPx(p)),
    t = s.seat
      .filter((o) => o !== id && s.pos[o] && !(s.players[o] || {}).dead)
      .map((o) => ({
        x: s.pos[o].x / rx,
        y: s.pos[o].y / ry,
        z: duckH(s, s.pos[o]),
      }));
  if (hang)
    for (const n of hangTargets(s, now, ""))
      t.push({ x: n.x / HW / rx, y: n.y / HH / ry, z: n.z || 0 });
  const mine = sameFloorAhead(
    t,
    p.x / rx,
    p.y / ry,
    hz,
    aim[0] / rx / l,
    aim[1] / ry / l,
    hang ? 70 : 40,
    [1, 1],
    0.5,
    hang ? (x, y) => !!inCabin(x * rx * HW, y * ry * HH) !== side : null,
  );
  return mine ? { lh: floorLock(hz) } : {};
}
/* can shot sh reach duck p at its height (and no roof between: Downpour)? */
const shotReach = (s, sh, p) =>
  isHang(s)
    ? hOk(sh, duckH(s, p), ...toPx(p), sh.x0 * HW, sh.y0 * HH)
    : hOk(sh, duckH(s, p));
/* the first duck in the way of a shot from (sh.lx, sh.ly) to at, within a duck's room of the line: its id, how far
   along (0 … 1) and where, or null (not the shooter, a duck that's down or jumping over it, a ghost, the other side
   of the cabin's walls) */
function firstDuck(s, sh, at, now) {
  const hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s),
    ux = (at.x - sh.lx) / rx,
    uy = (at.y - sh.ly) / ry,
    len = ux * ux + uy * uy;
  let best = null;
  for (const id of s.seat) {
    const p = s.pos[id],
      P = s.players[id];
    if (id === sh.by || !p || p.x < 0 || !P || P.dead || isGhost(s, id))
      continue;
    if (
      (sh.hin !== undefined && (inCabin(...toPx(p)) ? 1 : 0) !== sh.hin) ||
      !shotReach(s, sh, p)
    )
      continue;
    if (jumpDodges(p, now) || vdSafe(s, id)) continue;
    if (isMgj(s) && sh.by !== JUSTIN_ID) continue; // (Mad God Justin: the ducks are on one side)
    const px = (p.x - sh.lx) / rx,
      py = (p.y - sh.ly) / ry,
      k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    if (Math.hypot(px - k * ux, py - k * uy) < 1 && (!best || k < best.k))
      best = {
        id,
        k,
        x: sh.lx + k * (at.x - sh.lx),
        y: sh.ly + k * (at.y - sh.ly),
      };
  }
  return best;
}
/* the grenade launcher's grenade got to a duck: it stops there (where it goes off) */
function lgrenHits(s, sh, at, now) {
  if (isMgj(s)) return mgjLgren(s, sh, sh.lx, sh.ly, at, now); // (Mad God Justin: it goes off on him)
  const d = firstDuck(s, sh, at, now);
  if (!d) return false;
  at.x = d.x;
  at.y = d.y;
  return true;
}
/* the chain gun's shot: at once, along the aim to the first duck (all its HP) or on past the board's edge; anything
   else on that line is hit as a bullet hits it. Every screen draws its thin yellow line (the l4line fx) */
const CHAIN_FAR = 1.6; // (board widths: on past the board's edge)
export function chainShot(s, by, p, aim, now, w = "chaingun") {
  const hang = isHang(s),
    l = Math.hypot(aim[0], aim[1]) || 1,
    sh = {
      n: s.fxN,
      by,
      k: w === "laser" ? "laser" : "chain", // (the Laser Rifle's beam: 1 damage, mgjrules.js shotDmg)
      x0: p.x,
      y0: p.y,
      lx: p.x,
      ly: p.y,
      vx: 0,
      vy: 0,
      t: now,
      ...(hang
        ? {
            hz: Math.round(zOf(p)),
            hin: inCabin(...toPx(p)) ? 1 : 0,
          }
        : {}),
      ...floorFirst(s, by, p, aim, now), // (a duck on my floor in its line: it stays on my floor)
    },
    far = hang ? CHAIN_FAR * 0.25 : CHAIN_FAR, // (Hangout's world is far bigger than a board)
    up = 0.41 * sizeOf(s, by); // (out of its gun, at my Size: sizeShots)
  let at = {
    x: p.x + (aim[0] / l) * far,
    y: p.y + (aim[1] / l) * far,
    z: up,
  };
  if (hang) {
    // the cabin's walls stop it
    for (let i = 1; i <= 80; i++) {
      const x = p.x + ((aim[0] / l) * far * i) / 80,
        y = p.y + ((aim[1] / l) * far * i) / 80;
      if ((inCabin(x * HW, y * HH) ? 1 : 0) !== sh.hin) {
        at = { x, y, z: up };
        break;
      }
    }
  }
  const d = firstDuck(s, sh, at, now);
  if (d) {
    const [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s);
    at = {
      x: d.x + ((aim[0] / l) * rx) / 2,
      y: d.y + ((aim[1] / l) * ry) / 2,
      z: up,
    }; // (a little past it, so the duck is surely on the line)
  }
  shotHits(s, sh, at, p.x, p.y, at.x - p.x, at.y - p.y, now);
  const k = hang ? [HW, HH] : [1, 1];
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    {
      n: s.fxN,
      kind: "l4line",
      by,
      who: [],
      t: now,
      ...(w === "laser" ? { w, ...(d ? { hd: 1 } : {}) } : {}), // (hd: it stopped at a duck, which smokes: game.js)
      ...(hang ? {} : { b: 1 }),
      x0: +(p.x * k[0]).toFixed(4),
      y0: +(p.y * k[1]).toFixed(4),
      x1: +(at.x * k[0]).toFixed(4),
      y1: +(at.y * k[1]).toFixed(4),
      hz: Math.round(zOf(p)),
    },
  ]; // (b: board units; in Hangout, the world's pixels, as Quacky Zombies' own)
}
/* the flamethrower's puff (flamer.js), outside Dead Ducks Arcade: it reaches farther the longer it's held (Hangout: up to
   the cabin's walls); every duck in its cone is scorched (scorch), and the ground at its end burns for a while.
   s.flame = { id: [the hold's start, this puff, ux, uy (a unit, in duck lengths), reach (duck lengths), last patch] }:
   every screen draws the stream from it (game.js); s.gfire = [[x, y, until, by, side, height]] the burning patches */
export function duckFlame(s, by, p, aim, now) {
  const hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s),
    al = Math.hypot(aim[0] / rx, aim[1] / ry) || 1,
    ux = aim[0] / rx / al,
    uy = aim[1] / ry / al,
    was = (s.flame || {})[by],
    t0 = was && now - was[1] < FLAME.GAP ? was[0] : now,
    side = hang ? (inCabin(...toPx(p)) ? 1 : 0) : 0,
    z0 = duckH(s, p);
  let far = flameReach(now - t0);
  if (hang)
    for (let d = 0.25; d <= far; d += 0.25)
      if (
        (inCabin((p.x + ux * d * rx) * HW, (p.y + uy * d * ry) * HH)
          ? 1
          : 0) !== side
      ) {
        far = d - 0.25;
        break;
      } // (the cabin's walls stop it)
  const patch = !was || now - (was[5] || 0) >= FLAME.PATCH;
  s.flame = {
    ...(s.flame || {}),
    [by]: [
      t0,
      now,
      +ux.toFixed(3),
      +uy.toFixed(3),
      +far.toFixed(2),
      patch ? now : was[5],
    ],
  };
  for (const id of s.seat) {
    const q = s.pos[id],
      P = s.players[id];
    if (id === by || !q || q.x < 0 || !P || P.dead || isGhost(s, id)) continue;
    if (isMgj(s) || vdSafe(s, id) || jumpDodges(q, now)) continue;
    if (hang && ((inCabin(...toPx(q)) ? 1 : 0) !== side || !nearH(zOf(q), z0)))
      continue;
    if (inCone((q.x - p.x) / rx, (q.y - p.y) / ry, ux, uy, far + 0.3))
      scorch(s, by, id, now);
  }
  flameThings(
    s,
    by,
    (x, y, z, sd, big = 1) =>
      (!hang || (sd === side && Math.abs((+z || 0) - z0) <= 48)) &&
      inCone((x - p.x) / rx, (y - p.y) / ry, ux, uy, far + 0.3 * big),
    now,
  );
  if (patch)
    s.gfire = [
      ...(s.gfire || []).filter((g) => g[2] > now).slice(1 - FLAME.MOST),
      [
        +(p.x + ux * far * rx).toFixed(4),
        +(p.y + uy * far * ry).toFixed(4),
        now + FLAME.GROUND,
        by,
        side,
        Math.round(z0),
      ],
    ];
}
/* everything that isn't a duck, in the flamethrower's fire or on its burning ground (the owner's, Nov 19 16:21Z:
   "everyone should be able to be on fire not just zombies, from the flamethrower or otherwise"): Sandbox's NPCs on the
   board, Justin (the board's, Mad God Justin's and the cabin's), his double, the cabin's cats and made
   NPCs. Each takes 1 HP as it's lit, burns THING_BURN ms and isn't lit again while it burns, as a duck is in Dead Ducks
   Arcade (BURN.P). near(x, y, z, side, big): is that spot, in shares of the map, in the fire. True when something
   was lit */
const THING_BURN = 3000;
function flameThings(s, by, near, now) {
  if (by === JUSTIN_ID) return false;
  const fl = {};
  for (const [k, u] of Object.entries(s.flamed || {})) if (u > now) fl[k] = u;
  const lit = (k) => {
    if (fl[k] > now) return false;
    fl[k] = now + THING_BURN;
    return true;
  };
  const hang = isHang(s);
  let any = false;
  if (!hang && (isMgj(s) || sbOnBoard(s)) && s.mz && s.mz.zb) {
    /* Sandbox's NPCs and Mad God Justin's zombies: the ones not burning already */
    const ok = new Map(
      s.mz.zb
        .filter((o) => !o.d && !(o.bn > now))
        .map((o) => [o.x + "," + o.y, o]),
    );
    const hp0 = new Map([...ok.values()].map((o) => [o, o.hp]));
    if (
      ok.size &&
      mgjZombieHit(
        s,
        (x, y, big) => ok.has(x + "," + y) && !!near(x, y, 0, 0, big),
        "flamer",
        now,
        by,
      )
    )
      for (const [o, hp] of hp0)
        if (o.hp < hp || o.d) {
          o.bn = now + THING_BURN;
          any = true;
        }
  }
  if (!hang && isMgj(s)) {
    if (
      mgjHitAt(
        s,
        by,
        now,
        (b) => !!near(b.x, b.y, 0, 0, MGJ_SCALE) && lit("mgj:" + (b.id || "j")),
        logLine,
        DMG.flamer || 1,
      )
    )
      any = true;
  } else if (!hang && justinShown(s) && !s.justin.down) {
    const j = justinAt(s.justin, now);
    if (j && near(j.x, j.y, 0, 0) && lit("justin")) {
      const got = justinHit(s, by, now, logLine, "flamer");
      if (got === 2) justinKilled(s, by, "flamer");
      if (got) any = true;
    }
  }
  if (hang)
    for (const n of hangTargets(s, now, "flamer"))
      if (
        near(n.x / HW, n.y / HH, n.z, inCabin(n.x, n.y) ? 1 : 0, n.r) &&
        lit("h:" + n.id) &&
        hangHit(s, n.id, by, now, "flamer")
      ) {
        any = true;
        if (n.id === "justin") justinKilled(s, by, "flamer");
      }
  if (any || Object.keys(fl).length !== Object.keys(s.flamed || {}).length)
    s.flamed = { ...(s.flamed || {}), ...fl };
  return any;
}
/* a duck in the flamethrower's fire or on its burning ground: 1 HP, once a FLAME.BURN ms at most, set burning a moment
   then burnt (and on its own screen, a crimson blink and a shake: game.js) */
function scorch(s, by, id, now) {
  const P = s.players[id];
  if (!P || P.dead || ((s.flamed || {})[id] || 0) > now) return;
  const left = {};
  for (const [k, u] of Object.entries(s.flamed || {})) if (u > now) left[k] = u;
  s.flamed = { ...left, [id]: now + FLAME.BURN };
  if (!soaks(s, id, now, 1, by)) {
    P.dead = true;
    holdDown(s, id, now);
    playerKilled(s, by, id, "flamer");
  }
  if (pwOn(s)) pwAdd(s, id, ["f0"], now, !!P.dead); // (burnt for a while)
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    { n: s.fxN, kind: "scorch", by, who: [id], t: now },
  ];
}
/* every heartbeat: a duck on burning ground is scorched (not the one who set it burning), the patches burn out, and
   streams no longer fired go */
export function groundFire(s, now) {
  let ch = false;
  if (s.flame && Object.values(s.flame).some((f) => now - f[1] > 1000)) {
    const keep = {};
    for (const [id, f] of Object.entries(s.flame))
      if (now - f[1] <= 1000) keep[id] = f;
    s.flame = Object.keys(keep).length ? keep : null;
    ch = true;
  }
  const gf = s.gfire;
  if (!gf || !gf.length) return ch;
  const left = gf.filter((g) => g[2] > now),
    hang = isHang(s),
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s);
  if (left.length !== gf.length) {
    s.gfire = left.length ? left : null;
    ch = true;
  }
  if (!boardPhases(s).includes(s.phase)) return ch;
  for (const id of s.seat) {
    const q = s.pos[id],
      P = s.players[id];
    if (!q || q.x < 0 || !P || P.dead || isGhost(s, id) || isMgj(s)) continue;
    if (vdSafe(s, id) || jumpDodges(q, now)) continue;
    const g = left.find(
      ([x, y, , by, side, z]) =>
        by !== id &&
        Math.hypot((q.x - x) / rx, (q.y - y) / ry) < FLAME.PATCH_R &&
        (!hang || ((inCabin(...toPx(q)) ? 1 : 0) === side && nearH(zOf(q), z))),
    );
    if (g && ((s.flamed || {})[id] || 0) <= now) {
      scorch(s, g[3], id, now);
      ch = true;
    }
  }
  for (const [gx, gy, , by, side, z] of left)
    if (
      flameThings(
        s,
        by,
        (x, y, zz, sd) =>
          Math.hypot((x - gx) / rx, (y - gy) / ry) < FLAME.PATCH_R &&
          (!hang || (sd === side && nearH(+zz || 0, z))),
        now,
      )
    )
      ch = true;
  return ch;
}
/* what a shot hit this beat, between (x0, y0) and at: the ducks, Mad God Justin, Justin, Duck Cabin's
   Justin and cats; true when it's gone (Mad God Justin's own) */
function shotHits(s, sh, at, x0, y0, dx, dy, now) {
  if (at.z > -0.15)
    for (const id of s.seat) {
      // (a dagger over a duck's head, or already fallen, hits nobody: a bigger duck's head is higher, duck.js)
      if (at.z >= 1.05 * duckBig(s, id)) continue;
      const p = s.pos[id],
        P = s.players[id];
      if (id === sh.by || !p || p.x < 0 || !P || P.dead || isGhost(s, id))
        continue;
      if (
        (sh.hin !== undefined && (inCabin(...toPx(p)) ? 1 : 0) !== sh.hin) ||
        !shotReach(s, sh, p)
      )
        continue; // (the other side of the walls, or above or below it: heights.js)
      if (jumpDodges(p, now)) continue; // jumped over it
      if (isMgj(s) && sh.by !== JUSTIN_ID) continue; // (Mad God Justin: the ducks are on one side)
      if (vdSafe(s, id)) continue; // (Valentine's Duck Date: the two at the table)
      /* the nearest the shot came to the duck this beat, measured in a duck's room (.03 across, .08 deep; Hangout's world is far bigger than a board) */
      const [rx, ry] = isHang(s) ? [0.006, 0.012] : boardDuck(s);
      const ux = dx / rx,
        uy = dy / ry,
        px = (p.x - x0) / rx,
        py = (p.y - y0) / ry,
        len = ux * ux + uy * uy;
      const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
      const ox = px - k * ux,
        oy = py - k * uy,
        od = Math.hypot(ox, oy);
      if (
        od < (sh.r || 1) + (duckBig(s, id) - 1) / 2 &&
        shotMeets(s, id, x0, y0, dx, dy, rx, ry, Math.max(0, at.z))
      ) {
        // (a duck bigger than 100%: its hitbox too, duck.js; a cut-out picture: only where it shows, shotMeets)
        if (sh.got && sh.got.includes(id)) continue; // (it already took HP from this duck)
        hLock(sh, duckH(s, p)); // (the first it passes over sets its height)
        if (sh.fake) continue; // (Mad God Justin: his double's, or his own while the double is the real one: no harm)
        const crit = critRoll(s, sh.k);
        if (
          isMgj(s)
            ? mgjSoak(s, id, now, sh.k === "chair" ? 2 : 1)
            : hitSoaks(s, id, now, sh.k, crit, sh.by)
        )
          sh.got = [...(sh.got || []), id];
        else {
          P.dead = true;
          holdDown(s, id, now);
          playerKilled(s, sh.by, id, sh.k);
          if (sh.k === "slug") {
            if (pwOn(s)) pwAdd(s, id, ["g0"], now, true);
            s.fxN = (s.fxN || 0) + 1;
            s.fx = [
              ...(s.fx || []).slice(-19),
              {
                n: s.fxN,
                kind: "slug",
                by: sh.by,
                who: [id],
                t: now,
                ax: sh.vx,
                ay: sh.vy,
                crit: crit ? 1 : 0,
              },
            ];
          } // (the double barrel's slug: chunks blown through it where it stands, game.js; no bullet knocks back, the owner's, Nov 21 17:48Z)
        } // (the HP: a hit it can take keeps the duck up)
        wounded(s, id, sh.k, now, crit); // (its wounds: wounds.js)
        if (sh.by === JUSTIN_ID) mgjHurt(s, id);
        if (sh.k === "chair") {
          const ul = Math.sqrt(len) || 1;
          if (od > 0.2)
            shove(s, id, ox / od, oy / od, KB_FAR, now, sh.hin || 0);
          else shove(s, id, ux / ul, uy / ul, KB_FAR, now, sh.hin || 0);
        } // (Mad God Justin's office chair, or the Chair special's: shoved back, as the hammer does, away from it)
      }
    }
  if (
    (isMgj(s) || sbOnBoard(s)) &&
    mgjShot(s, sh, x0, y0, dx, dy, now, logLine, at.z)
  )
    return true; // (Mad God Justin: a duck's shot hit him, or his hit Good Justin)
  if (
    sh.hin === undefined &&
    sh.by !== JUSTIN_ID &&
    !isMgj(s) &&
    at.z > -0.15 &&
    at.z < 1.05 &&
    justinShown(s) &&
    !s.justin.down &&
    !(sh.got && sh.got.includes(JUSTIN_ID))
  ) {
    // (the Justin option: he can be shot back, once by each shot)
    const n = justinAt(s.justin, now),
      [jx, jy] = boardDuck(s),
      ux = dx / jx,
      uy = dy / jy,
      px = (n.x - x0) / jx,
      py = (n.y - y0) / jy,
      len = ux * ux + uy * uy;
    const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
    const got =
      Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1)
        ? justinHit(s, sh.by, now, logLine, sh.k)
        : 0;
    if (got) sh.got = [...(sh.got || []), JUSTIN_ID];
    if (got === 2) justinKilled(s, sh.by, sh.k);
  }
  if (sh.hin !== undefined && at.z > -0.15 && at.z < 1.05)
    for (const n of hangTargets(s, now, sh.k)) {
      // (Hangout: Justin can be knocked down too, and a chair whooshes the shadow duck away)
      if (
        (inCabin(n.x, n.y) ? 1 : 0) !== sh.hin ||
        !hOk(sh, n.z, n.x, n.y, sh.x0 * HW, sh.y0 * HH)
      )
        continue;
      const ux = dx / 0.006,
        uy = dy / 0.012,
        px = (n.x / HW - x0) / 0.006,
        py = (n.y / HH - y0) / 0.012,
        len = ux * ux + uy * uy;
      const k = len ? Math.max(0, Math.min(1, (px * ux + py * uy) / len)) : 0;
      if (
        n.line
          ? n.line(x0, y0, x0 + dx, y0 + dy, at.z) >= 0 // (Sandbox's NPCs: where the shot, at its height, meets what shows of them, sbbody.js)
          : Math.hypot(px - k * ux, py - k * uy) < (sh.r || 1) * (n.r || 1)
      )
        hLock(sh, n.z); // (n.r: a Seriat NPC's hitbox)
      else continue;
      if (hangHit(s, n.id, sh.by, now, sh.k) && n.id === "justin")
        justinKilled(s, sh.by, sh.k);
    }
  return false;
}
