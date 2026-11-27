/* ---------- the board's weapons: hits, shots, blasts, melee, flames (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import { CRIT_DOWN } from "./wounds.js";

import { critOf, armOfShot, armDmg } from "./guns.js";
import { drawDmg } from "./bowdraw.js";

import {
  DAGGER_LIFE,
  FASTER,
  GRENADE_MS,
  boardPhases,
  daggerZ,
  grenadeZ,
  isHang,
  logLine,
  playing,
} from "./rules.js";

import { flyShots, swingOn, swinging, swingMisses } from "./weaponuse.js";
import {
  KB_FAR,
  pushOf,
  pushAlong,
  pushTaken,
  sizeOf,
  weightOf,
} from "./push.js";

import { jumpDodges } from "./jump.js";

import { duckBig } from "./duck.js";

import { isSb, sbOnBoard, boardDuck, sbRule } from "./sandboxrules.js";

import { godOn } from "./sbgod.js";

import { sbPlaceDuck, sbHpOf } from "./sbspawn.js";

import { hpHeal, hundredths, hpBreed } from "./hpmath.js";
import { grHp } from "./sbgroups.js";

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

import {
  justinHit,
  justinShown,
  justinAt,
  JUSTIN_ID,
  CAKE_SPEED,
  CAKE_EAT_MS,
} from "./boardjustin.js";

import { pwAdd, pwHit, DEATH } from "./wounds.js";

import { zombieHit, zombieShot } from "./boardzombies.js";

import { isL4dd, l4Hurt, standing as l4Standing } from "./l4ddrules.js";

import { ARMS } from "./guns.js";

import { l4Zups, l4SetHp } from "./zombies.js";

import { hOk, hLock, sameFloorAhead, floorLock } from "./heights.js";

import { zOf, nearH, overlapH } from "./heights.js";
import { chairReach } from "./chair.js";

import { FLAME, flameReach, inCone } from "./flamer.js";
import { toPx, DUCK } from "./units.js";
import { blast as boom, reach, hitOf, REACH as BLAST_REACH } from "./blast.js";

/* Justin knocked down by a player's weapon (the clown items unlock at 12): the last few, each numbered, so
   every device counts its own player's once (unlocks.js) */
function justinKilled(s, by, w) {
  if (!s.players[by]) return;
  s.jkN = (s.jkN || 0) + 1;
  s.jk = [...(s.jk || []).slice(-9), { n: s.jkN, by, w }];
}
/* a player knocked down by another player's weapon: the last few, each numbered, so every device counts its own player's
   kills once (unlocks.js: the shotgun opens at 144 kills, the grenade at 360, and Justin counts too) */
/* the normal game's HP (every mode but Dead Ducks Arcade): a duck has PHP HP before it plays dead
   (4: the owner's, Nov 18 16:50Z, "every player in other game modes has 4 hp by default"; it was 6), has them all back
   after PHP_BACK ms without a hit, and gets up with them all. s.php = { id: { n: HP lost, t: the last hit } }. True when the hit only took HP.
   What a hit takes (owner 2026-11-03 17:15Z, not in Quacky Zombies): the hammer, the chair and a grenade 3, the knife 2,
   the rest 1 */
const PHP = 4;
const PHP_BACK = 6000;
const phpLost = (s, id, now) => {
  const h = (s.php || {})[id];
  return h && now - h.t < PHP_BACK ? h.n : 0;
};
/* a hit of weapon (or shot kind) k: the same damage as in Dead Ducks Arcade, from its caliber and barrel (guns.js
   armDmg; the owner's, Nov 22 20:51Z: one gun mechanic in every mode, no table of the board's own) */
export const dmgOf = (s, k) => (isL4dd(s) ? 1 : armDmg(ARMS[armOfShot(k)]));
export function soaks(s, id, now, dmg = 1, by, raw = false) {
  if (normalGame(s) && (shielded(s, id, now) || (by && shielded(s, by, now))))
    return true; // (spawn protection: nothing hurts a duck that just came back, and what it shoots hurts nobody)
  if (invuln(s)) return hurtFx(s, id, now); // (Invulnerability: the hit only flashes)
  const max = sbHpOf(s, id) || PHP, // (Sandbox: a spawn's or a respawn's HP for it, sbspawn.js)
    n = hundredths(phpLost(s, id, now) + (dmg >= PHP && !raw ? max : dmg)), // (not raw, a blast: PHP or more takes all of it, whatever it has; in hundredths, up while any HP is left: hpmath.js)
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
  l4up: l4Zups, // (the zombie maps' own zombies: a group's, sbgroups.js)
  l4set: l4SetHp,
};
/* the board's HP (hpmath.js, every mode without its own: modes.js hp): a duck's PHP (a Sandbox spawn's or respawn's
   for it), back after a while without a hit; Justin on the board has 1 */
hpBreed("board", {
  of(s, id, now, seated) {
    if (id === JUSTIN_ID)
      return !justinShown(s) ? null : [s.justin.down ? 0 : 1, 1]; // (one hit takes his 1, as always)
    if (!seated || !boardPhases(s).includes(s.phase)) return null;
    const max = sbHpOf(s, id) || PHP;
    return [
      s.players[id].dead ? 0 : Math.max(0, max - phpLost(s, id, now)),
      max,
    ];
  },
  /* amt of what duck id lost comes back (a zone's, a group's: sbzone.js, sbgroups.js) */
  heal(s, id, amt, now) {
    const h = (s.php || {})[id];
    if (!h || now - h.t >= PHP_BACK) return;
    const max = sbHpOf(s, id) || PHP,
      n = hundredths(max - hpHeal(max - h.n, amt, max)), // (just what it is, a point or a part of one: hpmath.js)
      rest = { ...s.php };
    if (n > 0) rest[id] = { ...h, n };
    else delete rest[id];
    s.php = rest;
  },
  most: (s, id) => grHp(s, id, PHP), // (a group's Max HP over it, sbgroups.js)
  store: (s) => s.php,
  /* the bar over him (hpmath.js hpBarOf): Justin's while he's up on the board, a seated duck's in the board's phases,
     always shown, as Dead Ducks Arcade's (it was shown only while a hit was still counted, so the first HP lost still
     comes from a full bar: full) */
  bar(s, id, now, seated) {
    if (id === JUSTIN_ID) {
      if (!justinShown(s)) return null;
      return { hp: 1, most: 1 };
    }
    if (!seated || !boardPhases(s).includes(s.phase)) return null;
    const most = sbHpOf(s, id) || PHP;
    return { hp: most - phpLost(s, id, now), most, full: true };
  },
});
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
/* a shove counted in world px (Hangout and the maps' own): far world px whichever way, in shove's duck lengths */
export function shovePx(s, id, ux, uy, far, now, side) {
  const dX = 0.006 * HW,
    dY = 0.012 * HH;
  shove(s, id, ux, (uy * dX) / dY, far / dX, now, side);
}
function shove(s, id, ux, uy, far0, now, side, more = {}) {
  const far = pushTaken(far0, weightOf(s, id)), // (the ratio: a bigger duck is moved less far, push.js)
    p = s.pos[id],
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
const REACH = {
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
    far = far0 * sizeOf(s, by); // (a bigger duck's arm and weapon reach farther, a smaller one's not as far: as they're drawn, sizeShots)
  const al = Math.hypot(aim[0] / rx, aim[1] / ry) || 1,
    ux = aim[0] / rx / al,
    uy = aim[1] / ry / al;
  const side = hang ? (inCabin(...toPx(p0)) ? 1 : 0) : 0,
    z0 = duckH(s, p0, now),
    h0 = DUCK * sizeOf(s, by); // (my height: a swing reaches only within it, heights.js overlapH)
  const near = (x, y, z, inSide, big = 1) => {
    // where (x, y) is from the swinger, in duck lengths, if it's in reach (big: a Seriat NPC's hitbox, reached sooner)
    if (hang && (inSide !== side || !overlapH(z0, h0, z, DUCK * big)))
      return null;
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
    if (vdSafe(s, id)) continue; // (Valentine's Duck Date: nothing knocks down the two at the table)
    if (jumpDodges(p, now)) continue; // (a duck in the air is missed)
    const n = near(
      p.x,
      p.y,
      zOf(p),
      hang ? (inCabin(...toPx(p)) ? 1 : 0) : 0,
      duckBig(s, id),
    ); // (a duck bigger than 100%: its hitbox too, duck.js; an uploaded picture is hit as a duck, never where it shows: the owner's, Nov 21 19:07Z, "only the duck does. Same with the images players upload")
    if (n) hits.push({ id, ...n });
  }
  if (sp === "knife") hits = hits.sort((a, b) => a.d - b.d).slice(0, 1);
  for (const h of hits) {
    const crit = critRoll(s, sp);
    if (!hitSoaks(s, h.id, now, sp, crit, by, sizeOf(s, by))) {
      s.players[h.id].dead = true;
      holdDown(s, h.id, now);
      playerKilled(s, by, h.id, sp);
    } // (the HP: a hit it can take keeps the duck up, still shoved back by a hammer)
    wounded(s, h.id, sp, now, crit); // (its wounds: wounds.js)
    if (sp === "hammer" || sp === "axe") {
      // shoved straight back from the swinger (the fire axe half as far: push.js)
      const k = h.d > 0.05 ? 1 / h.d : 0;
      shove(
        s,
        h.id,
        h.d > 0.05 ? h.dx * k : ux,
        h.d > 0.05 ? h.dy * k : uy,
        pushOf(s, sp) * sizeOf(s, by), // (the mode's own, and a bigger swinger's harder: push.js)
        now,
        side,
      );
    }
  }
  let stab = false;
  if (
    !hang &&
    by !== JUSTIN_ID &&
    !done.includes(JUSTIN_ID) &&
    justinShown(s) &&
    !s.justin.down
  ) {
    // (the Justin option: he can be hit back)
    const n = justinAt(s.justin, now),
      got = near(n.x, n.y, 0, 0) ? justinHit(s, by, now, logLine, sp) : 0;
    if (got === 2) justinKilled(s, by, sp);
    stab = got > 0;
  }
  if (
    !hang &&
    by !== JUSTIN_ID &&
    zombieHit(
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
    stab = true; // (Sandbox's board zombies in reach too)
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
          ? justinShown(s) && !s.justin.down && justinAt(s.justin, now)
          : !(s.players[a.by] || {}).dead && s.pos[a.by];
    if (!from || from.x < 0) {
      ch = true;
      continue;
    } // (the swinger is down, or gone)
    const before = a.hit.length,
      hit = swing(s, a.by, a.sp, [a.ax, a.ay], now, from, a.hit);
    if (hit.length) {
      a.hit.push(...hit);
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
    const sc = sizeOf(s, sh.by);
    return { ...sh, sc, ...(sh.k === "chair" ? { r: chairReach(sc) } : {}) }; // (the chair: its picture is its hitbox, chair.js)
  });
  if (ch) s.shots = out;
}
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
/* a grenade going off at (x, y): every duck in its rings takes its ring's damage (blast.js) and is thrown away from it,
   three times as far as the hammer throws one, higher the nearer it was (the owner's, Nov 21 17:48Z: "Explosions should
   change the height of a thing it knocks back based on how close they are"); Justin is knocked down, Duck Cabin's Justin and cats are hit. Every screen draws the blast (the boom fx) */
function blast(s, sh, x, y, now, o = {}) {
  const hang = isHang(s),
    w = o.w || "grenade",
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s),
    side = sh.hin || 0,
    mine = sh.by !== JUSTIN_ID,
    hit = [];
  const near = reach({
    x,
    y,
    rx,
    ry,
    wide: o.wide,
    ok: (px, py, pz, inSide) =>
      !hang || (inSide === side && nearH(pz, sh.hz || 0)),
  }); // (Hangout: only on its side of the cabin's walls and at about its height)
  boom(near, [
    [
      s.seat,
      (id) => {
        const p = s.pos[id],
          P = s.players[id];
        if (!p || p.x < 0 || !P || isGhost(s, id)) return null;
        if (vdSafe(s, id)) return null; // (Valentine's Duck Date: the two at the table)
        return [
          p.x,
          p.y,
          zOf(p),
          hang ? (inCabin(...toPx(p)) ? 1 : 0) : 0,
          duckBig(s, id),
        ]; // (a duck bigger than 100%: its hitbox too, duck.js)
      },
      (id, n) => {
        const P = s.players[id];
        const killed = !P.dead && !soaks(s, id, now, hitOf(n).dmg, sh.by); // (its ring's)
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
          { ms: 650, h: 0.9 * Math.max(0, 1 - n.d / BLAST_REACH), l: 0 }, // (the lift: higher nearer the middle)
        );
        hit.push(id);
      },
    ],
    (near) =>
      mine &&
      zombieHit(
        s,
        (zx, zy, big, body) => {
          if (!body) return near(zx, zy, 0, 0, big);
          const q = body.at(x, y); // (Sandbox's: its nearest part that shows, sbbody.js)
          return q && near(q.x, q.y, 0, 0);
        },
        "grenade",
        now,
        sh.by,
        null,
        hitOf,
      ), // (Sandbox's board zombies in it: their ring's damage, blast.js)
    [
      !hang && mine && justinShown(s) ? [justinAt(s.justin, now)] : [],
      (j) => j && [j.x, j.y, 0, 0],
      () => {
        const got = justinHit(s, sh.by, now, logLine, w, sh);
        if (got) {
          if (got === 2) justinKilled(s, sh.by, w);
          hit.push(JUSTIN_ID);
        }
      },
    ],
    [
      hang ? hangTargets(s, now, "grenade") : [],
      (n) => {
        const q = n.at ? n.at(x, y) : { x: n.x / HW, y: n.y / HH }; // (Sandbox's NPCs: their nearest part that shows, sbbody.js)
        return q && [q.x, q.y, n.z, inCabin(n.x, n.y) ? 1 : 0, n.at ? 1 : n.r];
      },
      (n) => {
        if (hangHit(s, n.id, sh.by, now, w) && n.id === "justin")
          justinKilled(s, sh.by, w);
      },
    ],
  ]);
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
      rr: BLAST_REACH * (o.wide || 1),
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
const duckH = (s, p, now) => (isHang(s) ? zOf(p, "body", now) : 0);
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
/* can shot sh hit duck id at all? Not the shooter, a duck that's off the board, out or a ghost, the other side of the
   cabin's walls or above or below it (heights.js), jumping over it, one of the two at Valentine's Duck Date's table,
   or, against Mad God Justin, anyone's but his (the ducks are on one side). One rule for a bullet's hits (shotHits)
   and for the first duck in its way (firstDuck) */
function shotCan(s, sh, id, now) {
  const p = s.pos[id],
    P = s.players[id];
  if (id === sh.by || !p || p.x < 0 || !P || P.dead || isGhost(s, id))
    return false;
  if (sh.hin !== undefined && (inCabin(...toPx(p)) ? 1 : 0) !== sh.hin)
    return false;
  return shotReach(s, sh, p) && !jumpDodges(p, now) && !vdSafe(s, id);
}
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
    if (!shotCan(s, sh, id, now)) continue;
    const p = s.pos[id];
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
  const d = firstDuck(s, sh, at, now);
  if (!d) return false;
  at.x = d.x;
  at.y = d.y;
  return true;
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
    if (vdSafe(s, id) || jumpDodges(q, now)) continue;
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
   board, Justin (the board's and the cabin's), the cabin's cats and made
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
  if (!hang && sbOnBoard(s) && s.mz && s.mz.zb) {
    /* Sandbox's NPCs: the ones not burning already */
    const ok = new Map(
      s.mz.zb
        .filter((o) => !o.d && !(o.bn > now))
        .map((o) => [o.x + "," + o.y, o]),
    );
    const hp0 = new Map([...ok.values()].map((o) => [o, o.hp]));
    if (
      ok.size &&
      zombieHit(
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
  if (!hang && justinShown(s) && !s.justin.down) {
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
    if (!q || q.x < 0 || !P || P.dead || isGhost(s, id)) continue;
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
/* what a shot hit this beat, between (x0, y0) and at: the ducks, Sandbox's board zombies, Justin, Duck Cabin's
   Justin and cats; true when it's gone */
function shotHits(s, sh, at, x0, y0, dx, dy, now) {
  if (at.z > -0.15)
    for (const id of s.seat) {
      // (a dagger over a duck's head, or already fallen, hits nobody: a bigger duck's head is higher, duck.js)
      if (at.z >= 1.05 * duckBig(s, id)) continue;
      if (!shotCan(s, sh, id, now)) continue;
      const p = s.pos[id],
        P = s.players[id];
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
      if (od < (sh.r || 1) + (duckBig(s, id) - 1) / 2) {
        // (a duck bigger than 100%: its hitbox too, duck.js; an uploaded picture as a duck)
        if (sh.got && sh.got.includes(id)) continue; // (it already took HP from this duck)
        hLock(sh, duckH(s, p)); // (the first it passes over sets its height)
        if (sh.fake) continue; // (a shot that harms nobody)
        const crit = critRoll(s, sh.k, sh);
        if (hitSoaks(s, id, now, sh.k, crit, sh.by, 1, drawDmg(sh.dr)))
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
        if (sh.k === "chair") {
          const ul = Math.sqrt(len) || 1;
          if (od > 0.2)
            shove(s, id, ox / od, oy / od, KB_FAR, now, sh.hin || 0);
          else shove(s, id, ux / ul, uy / ul, KB_FAR, now, sh.hin || 0);
        } // (the Chair special's: shoved back, as the hammer does, away from it)
      }
    }
  if (zombieShot(s, sh, x0, y0, dx, dy, now, at.z)) return true; // (Sandbox's board: a zombie stopped it)
  if (
    sh.hin === undefined &&
    sh.by !== JUSTIN_ID &&
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
      if (hangHit(s, n.id, sh.by, now, sh.k, sh.dr) && n.id === "justin")
        justinKilled(s, sh.by, sh.k);
    }
  return false;
}

/* ---------- the Zebra cake special ----------
   One in the room at a time: s.zcake = { n, by, x0, y0, vx, vy, t, stop, eat, hin }. It flies the way it was thrown,
   and lands at the board's edge or after 6 s (Hangout: at the cabin's walls or the world's edge
   too; hin, the side it's on). Justin runs after it wherever he is and eats it, and does nothing else meanwhile
   (boardjustin.js, hangout/justin.js: eat, when he started); with no Justin to eat it, it's gone 12 s after it lands */
const CAKE_LEFT = 12000;
export function throwCake(s, by, p, aim, now) {
  const vx = aim[0] * CAKE_SPEED,
    vy = aim[1] * CAKE_SPEED;
  let stop = 6;
  if (isHang(s)) {
    const side = inCabin(p.x * HW, p.y * HH) ? 1 : 0;
    for (let t = 0.05; t <= 6; t += 0.05) {
      const x = p.x + vx * t,
        y = p.y + vy * t;
      if (
        x < 0.005 ||
        x > 0.995 ||
        y < 0.005 ||
        y > 0.995 ||
        (inCabin(x * HW, y * HH) ? 1 : 0) !== side
      ) {
        stop = t - 0.05;
        break;
      }
    }
  } else {
    const tx =
        vx > 0 ? (0.97 - p.x) / vx : vx < 0 ? (0.03 - p.x) / vx : Infinity,
      ty = vy > 0 ? (0.96 - p.y) / vy : vy < 0 ? (0.04 - p.y) / vy : Infinity;
    stop = Math.min(tx, ty, 6);
  }
  s.zcake = {
    n: s.fxN,
    by,
    x0: p.x,
    y0: p.y,
    vx: +vx.toFixed(4),
    vy: +vy.toFixed(4),
    t: now,
    stop: now + Math.max(0, stop) * 1000,
    eat: 0,
    ...(isHang(s) ? { hin: inCabin(p.x * HW, p.y * HH) ? 1 : 0 } : {}),
  };
}
/* a cake nobody ate (no Justin, or he's down), or one out of its stage: gone */
export function cakeGone(s, now) {
  const c = s.zcake;
  if (!c) return false;
  if (
    !boardPhases(s).includes(s.phase) ||
    (c.eat ? now > c.eat + CAKE_EAT_MS + 3000 : now > c.stop + CAKE_LEFT)
  ) {
    s.zcake = null;
    return true;
  }
  return false;
}

/* ---------- the ducks' wounds and crits outside Dead Ducks Arcade (wounds.js) ---------- */
export const pwOn = (s) => !isL4dd(s);
export const critRoll = (s, w, sh) =>
  pwOn(s) && Math.random() < critOf(armOfShot(w), sh && sh.dr); // (a drawn arrow: its draw's, bowdraw.js)
/* a hit of weapon (or shot kind) k on duck id: a crit doubles it (guns.js critOf); it takes exactly that much (raw),
   so a big hit on a Sandbox duck with more HP takes its damage, never all of it */
export function hitSoaks(s, id, now, k, crit, by, big = 1, more = 0) {
  const d = dmgOf(s, k) * big + more; // (big: a melee swinger's Size, push.js; more: a drawn arrow's, bowdraw.js)
  return soaks(s, id, now, crit ? d * 2 : d, by, true);
}
/* duck id was hit by weapon w: a wound, or (crit, and it went down) its head blown off, down CRIT_DOWN ms, and a
   smaller CRIT over it on every screen (the pcrit fx) */
export function wounded(s, id, w, now, crit) {
  const P = s.players[id];
  if (!pwOn(s) || !P) return;
  if (normalGame(s) && shielded(s, id, now)) return; // (spawn protection: no wounds either)
  const head = crit && P.dead;
  if (head) {
    pwAdd(s, id, ["x0"], now, true);
    holdDown(s, id, now, CRIT_DOWN);
  } else pwHit(s, id, w, now, !!P.dead);
  if (!crit) return;
  const p = s.pos[id] || {};
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [
    ...(s.fx || []).slice(-19),
    {
      n: s.fxN,
      kind: "pcrit",
      who: [id],
      t: now,
      x: p.x,
      y: p.y,
      ...(head ? {} : { m: 1 }), // (a crit that didn't put it down: only the small CRIT, Adam's, Nov 21 18:31Z)
      ...(isHang(s) ? { hz: Math.round(+p.z || 0) } : {}),
    },
  ];
}
/* a vote passes once enough say yes, and fails once it can't pass any more */
