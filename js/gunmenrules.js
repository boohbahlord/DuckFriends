/* ---------- Survival: the gunmen (the owner's, Nov 19 19:27Z and 19:47Z) ----------
   One peak in four is gunmen instead of a horde (survrules.js survTick): "a group of ducks come in that have guns". This
   file is their rules, run by the host each heartbeat from l4ddrules.js (L4_HOOKS.gm); gunmenview.js draws them.
   - Criminals ("c"): about 8 for each player in all, 4 for each player at once; when one dies, one from the back line
     comes in a few seconds later ("4 front-line slots per player refilled from a back line"). Pistols, SMGs and
     shotguns (never the double barrel's slug). Hyena style: they shoot a while, hide out of sight, reload, wait there
     to ambush whoever comes ("wait about 10 s"), then come looking. Hurt badly, they run and hide. Their flashlights
     are off while they ambush or run. They defend themselves from walkers that come too close or claw them.
   - Every gunman: the zombies' HP range, the shared slow speed (npcshared.js), half damage to players, crits and gore,
     their own cooldowns nobody sees, endless ammo that still reloads, no grenades. They come in from outside the
     fences where nobody sees them. A kill is worth 5 times a zombie's points; now and then one drops a special.
   s.hang.gm = { n: the last one's number, gb: [gunman], k: this wave's side ("c" | "s" | ""), bk: how many are left in
   the back line, nb: when the next one from it comes in, fnb: the friendly squad's last names not used yet this game
   (allies.js) }
   A gunman: { i, k, x, y (world px), hp, l: [its most HP], f (facing: 1 right, -1 left), dk (its look: a duck's), wp
   { p: [its guns] }, mg (each gun's rounds left), rl (when each one's reload ends), hw (the gun in its hands), sh (its
   last shot: [when, x, y]), st (what it's doing: "in" coming, "fire", "hide", "wait", "look", "run"), u (until when),
   cv (where it hides), ls (where it last saw its target), tg (its target: "p:" a duck, "z:" a zombie), lo (its
   flashlight on), ad (where it aims, in degrees), mad ([who hurt it, until when]), nx (its next shot), bn (rounds left
   in this burst), bt (its last burn), w (its wounds: wounds.js codes), d (when it died) } */
import { L4_HOOKS, RX, RY } from "./l4ddrules.js";
import { critOf } from "./guns.js";
import { ARMS, GUN_BREEDS, reachOf as gunReach } from "./guns.js";
import { clearShot, chaseField, chaseStep, room } from "./zombies.js";
import { heightAt, slabBetween, PROPS } from "./hangout/layout.js";
import { zOf } from "./heights.js";
import { DECKS } from "./hangout/stationmap.js";
import { apart, otherWay, sideSpot, sideDone } from "./crowd.js";
import { hpHurt } from "./hpmath.js";
import { gunmanLook } from "./gunmen.js";
import {
  sees as npcSees,
  nearest,
  grudge,
  grudgeOf,
  roll,
  refill,
  spend,
  magOf as npcMag,
  reloadOf as npcReload,
  shotMark,
} from "./npcrules.js";
import { hitWounds, WOUND_BREEDS } from "./wounds.js";
import { hitOf } from "./blast.js";
import {
  friend,
  friendsTick,
  friendHurt,
  friendLit,
  friendsCome,
} from "./allies.js";

export const GM = {
  CRIM_EACH: 8, // criminals for each player in all …
  FRONT: 4, // … and at once
  BACK_MS: [3000, 6000], // ms before one from the back line takes a fallen one's place
  DMG: 0.5, // their hits on ducks: half ("criminals do half as much damage, like the soldiers do")
  PTS: 5, // a kill's points: 5 times a zombie's
  SOLDIER_HP: 2, // soldiers (both sides, the sniper too) get this much HP on top of their roll ("The soldiers, both enemy and ally versions, should have plus additional HP on top of what they randomly start out with": the owner's, Nov 19 22:25Z; the 2 is my pick)
  DROP: 0.15, // each one's chance of leaving a special where it falls
  DEFEND: 160, // world px: a zombie this near is shot first ("defend themselves from zombies that are walkers, that are too close")
  FIRE_MS: [2500, 5000], // ms a criminal shoots before it hides
  WAIT_MS: [8000, 12000], // ms it waits in hiding to ambush ("wait about 10 s, then come looking")
  RUN_HP: 0.35, // its HP's share when it runs off and hides
  PUSH: 3, // duck lengths: a duck this near one hiding has pushed into them …
  PACK: 6, // … and every one hiding this near it turns and fights …
  ROOM: 7, // … until no duck is this near (my numbers)
  RUN_MS: [3000, 5000],
  COVER: [140, 420], // world px: how far it looks for a place to hide
  DEAD_MS: 30000, // ms a body lies there
  BURN_MS: 2000, // ms between a flame's bites (as the merchant's, l4ddrules.js BURN.EVERY)
  DUCK: 64, // world px in a duck length
  SQUAD: [4, 7], // soldiers in a squad ("squads of 4-7")
  SQUADS: 4, // squads at most ("1 squadron, 2 squadrons, 3 squadrons, or 4 squadrons") …
  SQUAD_MORE: 0.5, // … and each one past the least for the players there, this likely (squads)
  FLANK: 3, // duck lengths: a duck this near is flanking it: it falls back, pistol out ("fall back when flanked")
  STAB: 1.2, // duck lengths: near enough for its knife ("knife up close")
  STAB_MS: 900, // ms between its knife's stabs
  RIFLE_MOVE: [1800, 2800], // ms a rifleman moves up …
  RIFLE_FIRE: [2200, 3600], // … and ms it stops and shoots
  SUPPRESS_MS: 1400, // ms my screen shakes and darkens after an LMG burst flies by me
  SUPPRESS_R: 120, // world px: how near its rounds fly to suppress a duck
  /* the owner's, Nov 19 19:27Z: "he will shoot at you in your direction continuously, even when you're behind cover":
     the LMG keeps firing at where its duck hides this long after it last saw it (into the cover: no hits) */
  BLIND_MS: 15000,
  SNIPER: 0.2, // a soldier wave's chance of a lone sniper (none while one lives)
  SNIPE: [6, 26], // duck lengths: how near and how far off he takes his shot from
  LOCK_MS: [1500, 2500], // ms his laser sits on a duck before the shot
  /* ms he keeps watching the spot where a duck went out of his sight (the owner's, Nov 20 18:23Z: "he might know that
     they're behind a surface when they walk behind it for 10 seconds if he last saw them there ... unless new
     information of a new player's location comes in") */
  MEMORY_MS: 10000,
  SNIPE_HIT: 0.85, // that shot's chance to hit
  MOVE_MS: [6000, 10000], // ms he's away, moving to a new spot nobody sees
  PERCH_MS: [14000, 22000], // ms he keeps to one spot with nothing in his sights before he moves on
  CLOSE: 2.5, // duck lengths: a duck this near and he fights it off (UMP, knife)
  SEEN: 12, // duck lengths: a duck this near with a clear line sees a soldier leave (it stays till it's gone from sight)
  MAD: 8000, // ms: one that hurt it, it goes after this long (npcrules.js grudge)
  GONE: 2.5, // duck lengths: a soldier going back the way it came is gone this near the spot it came in by (row 112: at 40 px, the squad crowding round it, most never got there and stood about at the map's edge for good)
};
/* the criminals' guns (how each is fired, its bursts and magazine: guns.js GUN_BREEDS.gunman) */
const CRIM_GUNS = [
  ["handgun", "revolver"],
  ["smg", "tommy", "ump"],
  ["shotgun"],
];
/* how far each gun is fired from (duck lengths) and how likely a round is to hit a duck there: AIM.near up close, less
   for each duck length, never under AIM.min; a sprinting duck is harder to hit */
const reachOf = (w) => gunReach(w, "gunman") * GM.DUCK; // (guns.js)
const AIM = {
  near: 0.25,
  drop: 0.03,
  min: 0.06,
  sprint: 0.6,
  pellet: 0.35, // (a shotgun's: each pellet, up close, PELLET_DROP less for each duck length)
  pelletDrop: 0.08,
  lmg: 0.02, // (the LMG's rounds: "very unlikely to hit")
};

export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
export const gmOf = (s) => (s.hang && s.hang.gm) || null;
const alive = (s) => ((gmOf(s) || {}).gb || []).filter((o) => !o.d);

/* a gunman's look from its number: Noah's (gunmen.js gunmanLook), the same on every screen; a plain rubber duck
   under it */
const lookOf = (kind, i) => ({
  pattern: "none",
  metal: "none",
  keys: null,
  style: "rubber",
  outfit: null,
  face: null,
  hat: null,
  ...gunmanLook(kind, i),
});
/* a soldier's guns by its part in the squad: the LMG, the ones with him (an AK-47), or a rifleman (an AK-47 or the
   burst rifle); a pistol and a knife besides */
const SOLDIER_GUNS = {
  lmg: () => ["lmg", "handgun"],
  sup: () => ["ak", "handgun"],
  rifle: () => [pick(["ak", "burst"]), "handgun"],
};
export function newGunman(s, k, x, y, H, ro = "") {
  const gm = gmOf(s),
    i = gm.n + 1,
    hp = H.hp() + (k === "c" ? 0 : GM.SOLDIER_HP), // (criminals: their roll alone)
    guns = ro ? SOLDIER_GUNS[ro]() : [pick(pick(CRIM_GUNS))];
  if (!["handgun", "revolver"].includes(guns[0]) && !guns.includes("handgun"))
    guns.push("handgun"); // (a pistol besides)
  gm.n = i;
  return {
    i,
    k,
    ...(ro ? { ro } : {}),
    x: Math.round(x),
    y: Math.round(y),
    hp,
    l: [hp],
    f: 1,
    dk: lookOf(k === "c" ? "criminal" : "soldier", i),
    wp: { p: guns },
    mg: guns.map(magOf),
    rl: guns.map(() => 0),
    hw: guns[0],
    st: "in",
    u: 0,
    lo: k === "c" ? 1 : 0, // (soldiers: laser sights, no flashlights)
    ...(k === "c" ? otherWay("criminal") : {}), // (one of the 5% that come another way round: roundSide)
    ad: 0,
  };
}
const magOf = (w) => npcMag(w, "gunman"),
  reloadOf = (w) => npcReload(w, "gunman");

/* a spot round (x, y), up to rx and ry off, where it can stand (H.open), else (x, y) itself. Row 112 (the owner: "It
   should not feel like an Easter egg hunt"): a group spread round a spot just inside a fence put some of them on the
   far side of it, where they stood stuck for good, out of everyone's way, and the wave never ended */
function standNear(x, y, rx, ry, H) {
  for (let t = 0; t < 8; t++) {
    const a = x + rnd(-rx, rx),
      b = y + rnd(-ry, ry);
    if (!H.open || H.open(a, b)) return [a, b];
  }
  return [x, y];
}
/* ---------- a wave ---------- */
/* a gunmen peak begins (kind "c" criminals, "s" soldiers): the first of them come in from outside */
function start(s, kind, now, H) {
  const n = Math.max(1, H.ids.length),
    all = GM.CRIM_EACH * n,
    front = GM.FRONT * n;
  s.hang.gm = {
    ...(gmOf(s) || {}), // (the friendly squad's own: allies.js)
    sq: {},
    sp: {},
    n: (gmOf(s) || {}).n || 0,
    gb: ((gmOf(s) || {}).gb || []).filter((o) => !o.d), // (bodies of the last wave go)
    k: kind,
    bk: all - front,
    nb: 0,
    wv: ((gmOf(s) || {}).wv || 0) + 1, // (this wave's number: the sniper's one shot a wave)
  };
  const gm = s.hang.gm;
  if (kind === "s") return squads(s, n, H);
  /* they come in a few groups, each at its own spot nobody sees */
  for (let made = 0; made < front; ) {
    const at = H.edge();
    if (!at) break;
    const g = Math.min(front - made, 2 + Math.floor(Math.random() * 2));
    for (let k = 0; k < g; k++, made++)
      gm.gb.push(newGunman(s, kind, ...standNear(at[0], at[1], 30, 20, H), H));
  }
  return true;
}
/* where the sniper can lie in wait: under a tree's crown inside the fences, or up on the gas station's roof; one far
   enough off from every duck, nobody seeing it (ducks: { x, y }) */
function perch(ducks, H, not = null) {
  const out = [],
    roof = DECKS.find((d) => d.kind === "roof" && d.bldg === 1);
  for (const p of PROPS) {
    if (p.kind !== "tree") continue;
    const x = p.x + 18,
      y = p.y - 26; // (just behind its trunk: under its crown)
    if (H.open(x, y)) out.push([x, y, 0, "tree"]);
  }
  if (roof)
    for (let k = 0; k < 12; k++) {
      const x = roof.x0 + 60 + Math.random() * (roof.x1 - roof.x0 - 120),
        y = roof.y0 + 60 + Math.random() * (roof.y1 - roof.y0 - 120);
      if (
        !roof.holes.some(
          (h) =>
            x > h.x0 - 40 && x < h.x1 + 40 && y > h.y0 - 40 && y < h.y1 + 40,
        )
      )
        out.push([x, y, roof.h, "roof"]);
    }
  const fit = out.filter(([x, y, z]) => {
    if (not && Math.hypot(x - not[0], y - not[1]) < 6 * GM.DUCK) return false;
    const ds = ducks.map((d) => Math.hypot(d.x - x, d.y - y)),
      near = Math.min(...ds, 1e9);
    return (
      near > GM.SNIPE[0] * GM.DUCK * 1.3 &&
      near < GM.SNIPE[1] * GM.DUCK * 0.8 &&
      !ducks.some(
        (d) =>
          Math.abs(d.x - x) < 700 &&
          Math.abs(d.y - y) < 500 &&
          clearShot(d.x, d.y, x, y, Math.max(z, d.z || 0)) &&
          !z,
      ) // (one under a tree nobody sees from close by; the roof, nobody walks up there unseen)
    );
  });
  return fit.length ? pick(fit) : null;
}
function newSniper(s, at) {
  const gm = gmOf(s),
    i = gm.n + 1,
    hp = gm.hp0() + GM.SOLDIER_HP;
  gm.n = i;
  return {
    i,
    k: "sn",
    ro: "sn",
    x: Math.round(at[0]),
    y: Math.round(at[1]),
    ...(at[2] ? { z: at[2] } : {}),
    pk: at[3],
    hp,
    l: [hp],
    f: 1,
    dk: lookOf("sniper", i),
    wp: { p: ["sniper", "ump"] },
    mg: [magOf("sniper"), magOf("ump")],
    rl: [0, 0],
    hw: "sniper",
    st: "perch",
    u: 0,
    lo: 0,
    ad: 0,
  };
}
/* soldiers: at least 1 squad for 1-2 players, 2 for 3-4, 3 for 5-6, and always 4 for 7-8 ("always, if it's not the
   maximum, indicates a minimum": the owner's, Nov 19 19:27Z); past the least, each one more half the time (my pick), 4 at
   most. Each of 4 to 7 coming in together at a spot
   nobody sees: its LMG, 1-2 with him, the rest riflemen ("One LMG for suppressive fire, 1-2 with him; the rest AK-47 /
   burst rifle move up") */
function squads(s, n, H) {
  const gm = s.hang.gm;
  gm.bk = 0;
  gm.sq = {};
  /* now and then a lone sniper too, while there's none already */
  if (Math.random() < GM.SNIPER && !gm.gb.some((o) => o.k === "sn" && !o.d)) {
    const at = perch(
      H.ids
        .filter((id) => s.pos[id])
        .map((id) => ({
          x: s.pos[id].x * H.ww,
          y: s.pos[id].y * H.wh,
          z: +s.pos[id].z || 0,
        })),
      H,
    );
    if (at) {
      gm.hp0 = H.hp;
      gm.gb.push(newSniper(s, at));
      delete gm.hp0;
    }
  }
  let many = Math.min(GM.SQUADS, Math.ceil(n / 2));
  while (many < GM.SQUADS && Math.random() < GM.SQUAD_MORE) many++;
  for (let q = 1; q <= many; q++) {
    const at = H.edge();
    if (!at) break;
    const size =
        GM.SQUAD[0] +
        Math.floor(Math.random() * (GM.SQUAD[1] - GM.SQUAD[0] + 1)),
      sup = 1 + Math.floor(Math.random() * 2);
    gm.sq[q] = { n: size, at: [Math.round(at[0]), Math.round(at[1])] };
    for (let k = 0; k < size; k++) {
      const o = newGunman(
        s,
        "s",
        ...standNear(at[0], at[1], 50, 30, H),
        H,
        k === 0 ? "lmg" : k <= sup ? "sup" : "rifle",
      );
      o.sq = q;
      gm.gb.push(o);
    }
  }
  return true;
}
/* is the wave over? (every one of them dead, and nobody left in the back line) */
const done = (s) => {
  const gm = gmOf(s);
  return !gm || (!gm.bk && !alive(s).some((o) => o.k === "c" || o.k === "s"));
};

/* ---------- every heartbeat ---------- */
function tick(s, zs, now, ids, H) {
  const gm0 = gmOf(s);
  if (!gm0 || !gm0.gb.length) return;
  const gm = {
      ...gm0,
      gb: gm0.gb
        .filter((o) => !o.d || now - o.d < GM.DEAD_MS)
        .map((o) => ({
          ...o,
          ...(o.mg ? { mg: [...o.mg], rl: [...o.rl] } : {}),
        })),
    },
    dt = Math.min(0.35, Math.max(0.05, (now - (gm0.t || now - 200)) / 1000)),
    ducks = ids
      .filter((id) => H.up(id) && s.pos[id])
      .map((id) => {
        const p = s.pos[id],
          x = p.x * H.ww,
          y = p.y * H.wh;
        return { id, x, y, z: zOf(p), sp: !!p.sp, j: H.wild(id) };
      }),
    pls = ducks.map((d) => ({ xy: [d.x, d.y], zz: d.z })),
    fields = new Map(),
    fieldTo = (x, y) => {
      const k = Math.floor(x / 80) * 1000 + Math.floor(y / 80);
      if (!fields.has(k) && fields.size < 6)
        fields.set(k, chaseField([[x, y]]));
      return fields.get(k) || null;
    };
  s.hang.gm = gm;
  if (gm.sp)
    gm.sp = Object.fromEntries(
      Object.entries(gm.sp).filter(([, u]) => u > now),
    );
  /* the friendly squad (allies.js) are shot at too, as the ducks are; the sniper keeps to the ducks */
  const m = s.hang.l4m,
    foes = [
      ...ducks,
      ...gm.gb
        .filter((o) => o.k === "f" && !o.d)
        .map((o) => ({ id: "@f" + o.i, x: o.x, y: o.y, z: 0, fr: o })),
      /* the merchant too, when nothing else is near (as Justin out there): armed, he shoots back (l4ddrules.js) */
      ...(m &&
      ["in", "here", "out", "shoot", "hide", "flee"].includes(m.st) &&
      !m.c
        ? [{ id: "@m", x: m.x, y: m.y, z: 0, j: true, mc: 1 }]
        : []),
    ];
  friendsTick(s, gm, ducks, now, H);
  for (const o of gm.gb) {
    if (o.d) continue;
    if (o.k === "f") friend(s, o, zs, ducks, pls, fieldTo, now, dt, H);
    else if (o.k === "sn") sniper(s, o, zs, ducks, now, H);
    else if (o.k === "s") soldier(s, o, zs, foes, pls, fieldTo, now, dt, H);
    else crim(s, o, zs, foes, pls, fieldTo, now, dt, H);
  }
  gm.gb = gm.gb.filter((o) => !o.gone); // (soldiers who got away)
  keepApart(
    gm.gb.filter((o) => !o.d && o.k !== "sn"),
    H,
  );
  /* the back line: one takes a fallen one's place, a moment later */
  const front = GM.FRONT * Math.max(1, ids.length),
    up = gm.gb.filter((o) => !o.d && o.k === "c").length;
  if (gm.k === "c" && gm.bk > 0 && up < front) {
    if (!gm.nb) gm.nb = now + rnd(...GM.BACK_MS);
    else if (now >= gm.nb) {
      const at = H.edge();
      if (at) {
        gm.gb.push(newGunman(s, "c", at[0], at[1], H));
        gm.bk--;
      }
      gm.nb = 0;
    }
  }
  gm.t = now;
  for (const o of gm.gb) {
    o.x = Math.round(o.x);
    o.y = Math.round(o.y);
  }
}

/* what a gunman's beat shares: what it sees, how far a thing is, and a step toward a place along the field (turning to
   face the way it moved) */
function legsOf(o, fieldTo, H, dt, pls) {
  return {
    sees: (t) => npcSees(o, t),
    dist: (t) => Math.hypot(t.x - o.x, t.y - o.y),
    go: (x, y, k = 1) => {
      const x0 = o.x;
      chaseStep(o, fieldTo(x, y), [x, y], H.speed * k * dt, pls);
      if (Math.abs(o.x - x0) > 0.5) o.f = o.x > x0 ? 1 : -1;
    },
  };
}

/* one criminal's beat */
function crim(s, o, zs, ducks, pls, fieldTo, now, dt, H) {
  const { sees, dist, go } = legsOf(o, fieldTo, H, dt, pls);
  /* a zombie too near (or one that just clawed it) is shot first */
  const zt = nearest(
    zs,
    (z) => Math.hypot(z.x - o.x, z.y - o.y),
    (z) =>
      z.st !== 3 &&
      (Math.hypot(z.x - o.x, z.y - o.y) < GM.DEFEND || z.i === o.zc),
  );
  if (zt) {
    shoot(s, o, { z: zt, x: zt.x, y: zt.y }, now, H);
    return;
  }
  /* its duck: whoever hurt it a moment ago, else the nearest one (Justin out there only when there's nobody else) */
  const t =
    grudgeOf(o, now, ducks) || nearest(ducks, (d) => dist(d) * (d.j ? 3 : 1));
  if (!t) {
    o.st = o.st === "fire" ? "look" : o.st;
    return;
  }
  o.tg = "p:" + t.id;
  const see = sees(t),
    d = dist(t),
    reach = reachOf(o.hw);
  if (see) o.ls = [Math.round(t.x), Math.round(t.y)];
  if (o.hp < o.l[0] * GM.RUN_HP && !o.ran) {
    o.ran = 1;
    o.st = "run";
    o.u = now + rnd(...GM.RUN_MS);
    o.lo = 0;
  }
  /* pushed into while hiding (the ones held back, out of the fight): every one hiding near it turns on that duck, and
     they fight until they have room to get away (the owner's, Nov 19 19:27Z: "if you push really hard into the ones in
     the back, and all of them will attack you until they have enough space to get away from you") */
  if (["hide", "wait", "run"].includes(o.st) && d < GM.PUSH * GM.DUCK)
    for (const q of gmOf(s).gb)
      if (
        !q.d &&
        q.k === "c" &&
        ["hide", "wait", "run"].includes(q.st) &&
        Math.hypot(q.x - o.x, q.y - o.y) < GM.PACK * GM.DUCK
      ) {
        q.st = "fire";
        q.cn = 1;
        q.lo = 1;
        q.mad = grudge(t.id, now, GM.MAD);
      }
  switch (o.st) {
    case "run": {
      const dx = o.x - t.x,
        dy = o.y - t.y,
        n = Math.hypot(dx, dy) || 1;
      go(o.x + (dx / n) * 240, o.y + (dy / n) * 240);
      if (now >= o.u) hide(o, t, now, H);
      return;
    }
    case "hide": {
      if (
        !o.cv ||
        now >= o.u ||
        Math.hypot(o.x - o.cv[0], o.y - o.cv[1]) < 24
      ) {
        reload(o, now);
        o.st = "wait";
        o.u = now + rnd(...GM.WAIT_MS);
        o.lo = 0;
        return;
      }
      go(o.cv[0], o.cv[1]);
      return;
    }
    case "wait": {
      /* in hiding: whoever walks into its sight close enough gets ambushed */
      if (see && d < reach * 0.7) {
        o.st = "fire";
        o.u = now + rnd(...GM.FIRE_MS);
        o.lo = 1;
        break;
      }
      if (now >= o.u) {
        o.st = "look";
        o.lo = 1;
      }
      return;
    }
    case "fire":
      if (o.cn) {
        if (d < GM.ROOM * GM.DUCK) break;
        o.cn = 0;
        hide(o, t, now, H); // (room enough: away)
        return;
      } // (cornered: it fights on)
      if (now >= o.u || (!see && now - (o.seen || 0) > 1500)) {
        hide(o, t, now, H);
        return;
      }
      break;
    default: {
      // coming in, or looking: to it (or where it was last seen) until it's in sight and in reach
      if (see && d < reach * 0.85) {
        o.st = "fire";
        o.u = now + rnd(...GM.FIRE_MS);
        o.lo = 1;
        break;
      }
      let g = see || !o.ls ? [t.x, t.y] : o.ls;
      if (o.fl) g = roundSide(o, t, H) || g; // (one of the 5%: round the side first)
      go(g[0], g[1]);
      if (!see && o.ls && Math.hypot(o.x - g[0], o.y - g[1]) < 40) o.ls = null; // (it got where it last saw it: on to where it is)
      o.ad = Math.round((Math.atan2(g[1] - o.y, g[0] - o.x) * 180) / Math.PI);
      return;
    }
  }
  /* firing */
  if (see) o.seen = now;
  if (see && d < reach) shoot(s, o, t, now, H);
  else o.ad = Math.round((Math.atan2(t.y - o.y, t.x - o.x) * 180) / Math.PI);
}
/* the other way round for criminal o going for t (crowd.js sideSpot, as the zombies' flankers): its spot round the side
   (o.fw [x, y, the duck, done]), then straight on as the others. No room either side: as the others */
function roundSide(o, t, H) {
  const at = [t.x, t.y];
  if (!o.fw || o.fw[2] !== t.id) {
    const w = sideSpot("criminal", o, at, o.fl, RX, RY, (x, y) =>
      H.stands(x, y, heightAt(x, y)),
    );
    o.fw = w ? [...w, t.id, 0] : [0, 0, t.id, 1];
  }
  if (o.fw[3]) return null;
  if (sideDone("criminal", o, o.fw, at, room, RX)) {
    o.fw = [...o.fw.slice(0, 3), 1];
    return null;
  }
  return o.fw.slice(0, 2);
}
/* one soldier's beat. They leave zombies alone unless one claws them; shoot Justin only when there's nobody else; the
   squad keeps on one duck, but a soldier turns on whoever shoots it or comes near ("switch target when shot or
   approached"); one too near is knifed, or shot with the pistol as it falls back; at half strength the squad goes back
   the way it came and leaves */
function soldier(s, o, zs, ducks, pls, fieldTo, now, dt, H) {
  const gm = gmOf(s),
    sq = (gm.sq || {})[o.sq] || { n: 1, at: [o.x, o.y] },
    mates = gm.gb.filter((q) => !q.d && q.k === "s" && q.sq === o.sq),
    { sees, dist, go } = legsOf(o, fieldTo, H, dt, pls),
    away = (t, far = 200) => {
      const dx = o.x - t.x,
        dy = o.y - t.y,
        n = Math.hypot(dx, dy) || 1;
      go(o.x + (dx / n) * far, o.y + (dy / n) * far);
    };
  o.ld = 0;
  /* a zombie that clawed it, still near: that one first */
  const zt = o.zc && zs.find((z) => z.i === o.zc && z.st !== 3);
  if (zt && Math.hypot(zt.x - o.x, zt.y - o.y) < GM.DEFEND * 1.5) {
    if (Math.hypot(zt.x - o.x, zt.y - o.y) < GM.STAB * GM.DUCK)
      stab(o, { z: zt, x: zt.x, y: zt.y }, now, H, s);
    else shoot(s, o, { z: zt, x: zt.x, y: zt.y }, now, H);
    return;
  }
  if (!zt) o.zc = 0;
  /* half the squad down: back the way they came, and gone */
  if (!sq.out && mates.length * 2 <= sq.n) sq.out = 1;
  const near = nearest(
      ducks,
      dist,
      (d) => !d.j && dist(d) < GM.FLANK * GM.DUCK,
    ),
    mad = grudgeOf(o, now, ducks),
    lead = mates.reduce(
      (c, q) => [c[0] + q.x / mates.length, c[1] + q.y / mates.length],
      [0, 0],
    ),
    t =
      near ||
      mad ||
      nearest(
        ducks,
        (d) => Math.hypot(d.x - lead[0], d.y - lead[1]) * (d.j ? 3 : 1),
      );
  if (sq.out) {
    o.st = "out";
    go(sq.at[0], sq.at[1], 1.15);
    const by = Math.hypot(o.x - sq.at[0], o.y - sq.at[1]);
    if (
      by < 40 ||
      (by < GM.GONE * GM.DUCK &&
        !ducks.some((d) => !d.j && dist(d) < GM.SEEN * GM.DUCK && sees(d)))
    )
      o.gone = 1; // (near the spot they came in by, and nobody sees it go: the squad crowds round that spot, so not all of them can stand on it)
    if (t && sees(t) && dist(t) < reachOf("handgun")) {
      o.hw = "handgun";
      shoot(s, o, t, now, H);
      o.ld = Math.round(dist(t));
    }
    return;
  }
  if (!t) {
    o.st = "look";
    return;
  }
  o.tg = "p:" + t.id;
  const see = sees(t),
    d = dist(t);
  if (see) {
    o.ls = [Math.round(t.x), Math.round(t.y)];
    o.seen = now;
  }
  const aim = () =>
    (o.ad = Math.round((Math.atan2(t.y - o.y, t.x - o.x) * 180) / Math.PI));
  /* flanked: the knife up close, else the pistol as it falls back toward the others */
  if (near && t === near) {
    o.st = "back";
    if (d < GM.STAB * GM.DUCK) {
      stab(o, t, now, H, s);
      return;
    }
    away(t);
    if (see) {
      o.hw = "handgun";
      shoot(s, o, t, now, H, ["handgun"]);
      o.ld = Math.round(d);
    }
    return;
  }
  const reach = reachOf(o.wp.p[0]),
    lmg = mates.find((q) => q.ro === "lmg"),
    /* the LMG and the rest take turns (the owner's, Nov 19 19:27Z: "When he's reloading, the other ducks take turn
       firing at you. They take out their AK-47s, maybe their burst rifles"): while he fires, they move up and hold
       their fire; while he reloads, or with him gone or not firing, they shoot */
    lmgOn =
      !!lmg && lmg !== o && lmg.st === "fire" && !(lmg.rl && lmg.rl[0] > now);
  if (o.ro === "lmg") {
    /* the LMG: somewhere it sees its duck from well off, then long bursts; whoever its rounds fly by is suppressed. Its
       duck gone behind cover, it keeps firing at it a while (blind: into the cover) */
    const blind =
      !see && !!o.seen && now - o.seen < GM.BLIND_MS && d <= reach * 0.9;
    if ((!see && !blind) || d > reach * 0.9) {
      const g = see || !o.ls ? [t.x, t.y] : o.ls;
      go(g[0], g[1]);
      o.st = "in";
      aim();
      return;
    }
    if (d < 5 * GM.DUCK) away(t, 160);
    o.st = "fire";
    o.ld = Math.round(d);
    if (shoot(s, o, t, now, H, null, blind)) suppress(s, o, t, ducks, now);
    return;
  }
  if (o.ro === "sup") {
    /* with the LMG: keeps by him, shooting what he shoots at */
    const m = mates.find((q) => q.ro === "lmg");
    if (m && Math.hypot(m.x - o.x, m.y - o.y) > 2 * GM.DUCK)
      go(m.x + rnd(-60, 60), m.y + rnd(-40, 40));
    else if (!m && (!see || d > reach * 0.85)) {
      const g = see || !o.ls ? [t.x, t.y] : o.ls;
      go(g[0], g[1]);
    }
    if (see && d < reach && !lmgOn) {
      o.st = "fire";
      o.ld = Math.round(d);
      shoot(s, o, t, now, H);
    } else aim();
    return;
  }
  /* a rifleman: moves up a while, then stops and shoots a while, closer each time (never too close) */
  if (!o.u || now >= o.u) {
    const moving = o.st !== "move" && (!see || d > reach * 0.55);
    o.st = moving ? "move" : "fire";
    o.u = now + rnd(...(moving ? GM.RIFLE_MOVE : GM.RIFLE_FIRE));
  }
  if (o.st === "move") {
    const g = see || !o.ls ? [t.x, t.y] : o.ls;
    go(g[0], g[1]);
    aim();
    if (see && d < reach * 0.45) o.u = now; // (close enough: it stops)
    return;
  }
  if (see && d < reach && !lmgOn) {
    o.ld = Math.round(d);
    shoot(s, o, t, now, H);
  } else {
    aim();
    if (!see)
      o.u = Math.min(o.u, now + 400); // (it lost sight: it moves again soon)
    else if (lmgOn && d > reach * 0.45) o.st = "move"; // (his turn: it moves up meanwhile, "They will slowly move up towards you")
  }
}
/* the sniper's beat (the owner's, Nov 19 19:47Z): no flashlight; his long laser sits on a duck 1.5 to 2.5 s, following
   one that moves slowly, then the shot; one shot a wave. A duck sprinting breaks it, and he moves to a new spot nobody
   sees (away a while: nobody sees him go). A duck too near: his UMP, or his knife. Under a tree's crown zombies never
   find him; a zombie that claws him anyway (on the roof) is shot.
   What he sees is what he can shoot (the owner's, Nov 20 18:23Z: "if he can't shoot them, then de facto, he can't see
   them"): the one rule every shot keeps, nothing solid between (walls on the way, and layout.js slabBetween's
   sightline across roofs and floors, so from far enough he sees under the pumps' canopy and from closer he doesn't). He
   has no range (18:27Z: "Sniper can shoot through the entire map if it doesn't hit a wall"), only a nearest: closer
   than GM.SNIPE[0] it's his UMP. A duck that goes out of his sight: he watches the spot it was last seen at for
   GM.MEMORY_MS (o.mem), and takes it again if it shows there, or another one that shows anywhere */
function sniper(s, o, zs, ducks, now, H) {
  const gm = gmOf(s),
    h = o.z || heightAt(o.x, o.y),
    dist = (t) => Math.hypot(t.x - o.x, t.y - o.y),
    nearestFirst = (a, b) => (a.j ? 1 : 0) - (b.j ? 1 : 0) || dist(a) - dist(b), // (the ducks before Justin)
    sees = (t) =>
      !o.hid &&
      npcSees(o, t, Math.max(h, t.z || 0), 0) &&
      !slabBetween(o.x, o.y, h, t.x, t.y, t.z || heightAt(t.x, t.y)),
    /* a duck he may take aim at: in sight, not sprinting, not too near (his UMP's) */
    mark = (d) => !d.sp && dist(d) > GM.SNIPE[0] * GM.DUCK && sees(d),
    lockOn = (t) => {
      delete o.mem;
      o.st = "aim";
      o.tg = "p:" + t.id;
      o.u = now + rnd(...GM.LOCK_MS);
    },
    move = () => {
      delete o.mem;
      o.hid = 1;
      o.st = "move";
      o.ld = 0;
      o.tg = "";
      o.u = now + rnd(...GM.MOVE_MS);
    };
  if (o.hid) {
    if (now < o.u) return;
    const at = perch(ducks, H, [o.x, o.y]);
    if (!at) {
      o.u = now + 2000;
      return;
    }
    o.x = Math.round(at[0]);
    o.y = Math.round(at[1]);
    if (at[2]) o.z = at[2];
    else delete o.z;
    o.pk = at[3];
    o.hid = 0;
    o.st = "perch";
    o.u = now + rnd(...GM.PERCH_MS);
    return;
  }
  const zt = o.zc && zs.find((z) => z.i === o.zc && z.st !== 3);
  if (zt && dist(zt) < GM.DEFEND * 1.5) {
    o.ld = 0;
    if (dist(zt) < GM.STAB * GM.DUCK)
      stab(o, { z: zt, x: zt.x, y: zt.y }, now, H, s);
    else shoot(s, o, { z: zt, x: zt.x, y: zt.y }, now, H, ["ump"]);
    return;
  }
  if (!zt) o.zc = 0;
  const close = ducks.find((d) => dist(d) < GM.CLOSE * GM.DUCK && sees(d));
  if (close) {
    o.ld = 0;
    o.st = "close";
    if (dist(close) < GM.STAB * GM.DUCK) stab(o, close, now, H, s);
    else shoot(s, o, close, now, H, ["ump"]);
    return;
  }
  if (o.st === "close") move(); // (it got away from him, or he from it: he moves on)
  if (o.st === "watch") {
    /* watching where a duck went out of sight: it shows again (anywhere he can see it), or another one does; else, once
       his memory of it runs out, he moves on */
    const was = ducks.find((d) => "p:" + d.id === o.tg),
      t = was && mark(was) ? was : ducks.filter(mark).sort(nearestFirst)[0];
    if (t) lockOn(t);
    else if (!o.mem || now >= o.mem.u) move();
    return;
  }
  if (o.st === "aim") {
    const t = ducks.find((d) => "p:" + d.id === o.tg);
    if (!t || t.sp) {
      move(); // (it sprinted off, or went down: he moves to safety)
      return;
    }
    if (!sees(t)) {
      /* out of his sight: his laser stays on the spot he last saw it at (o.ad, o.ld as they were) */
      o.st = "watch";
      o.mem = { u: now + GM.MEMORY_MS };
      const other = ducks
        .filter((d) => d !== t && mark(d))
        .sort(nearestFirst)[0];
      if (other) lockOn(other); // (another one in sight: news of where they are)
      return;
    }
    o.ad = Math.round((Math.atan2(t.y - o.y, t.x - o.x) * 180) / Math.PI);
    o.f = t.x < o.x ? -1 : 1;
    o.ld = Math.round(dist(t));
    if (now < o.u) return;
    /* the shot */
    o.wv = gm.wv;
    o.hw = "sniper";
    const hit = Math.random() < GM.SNIPE_HIT,
      A = ARMS.sniper,
      dmg = Array.isArray(A.dmg)
        ? A.dmg[0] + Math.floor(Math.random() * (A.dmg[1] - A.dmg[0] + 1))
        : +A.dmg || 4,
      a = Math.random() * 2 * Math.PI,
      off = hit ? 0 : 30 + Math.random() * 40;
    o.sh = shotMark(now, t, a, off);
    if (hit) H.hurt(t.id, Math.round(dmg * GM.DMG * 10) / 10, "sniper");
    move();
    return;
  }
  /* on his perch: his one shot this wave, on a duck in his sights that isn't sprinting */
  o.st = "perch";
  o.ld = 0;
  if (!o.u) o.u = now + rnd(...GM.PERCH_MS);
  if (o.wv !== gm.wv && gm.k) {
    const t = ducks.filter(mark).sort(nearestFirst)[0];
    if (t) {
      lockOn(t);
      return;
    }
  }
  if (now >= o.u) move(); // (a long while with nobody in his sights: he moves on)
}
/* its knife on t (a duck or a zombie): the knife's own damage, half on a duck */
export function stab(o, t, now, H, s = null) {
  o.ad = Math.round((Math.atan2(t.y - o.y, t.x - o.x) * 180) / Math.PI);
  o.f = t.x < o.x ? -1 : 1;
  if (now - (o.ka || 0) < GM.STAB_MS) return;
  o.ka = o.a = now; // (o.a: its claw marks show: a swing)
  hitOn(s, o, t, +ARMS.knife.dmg || 1, "knife", now, H);
}
/* a target that's a zombie ({ z: the zombie }); a duck's z is the height of its feet, a number */
const zombieOf = (t) => (t.z && typeof t.z === "object" ? t.z : null);
/* one of them lands dmg on t with weapon w: a zombie, one of the others (the friendly squad, or the gunmen the squad
   shoots at), or a duck. Half on a duck and on each other ("half damage"), and the friendly squad's half on zombies too
   ("fight with you at half damage") */
/* a headshot (the owner's, Nov 20 18:23Z, principles kept from now on: "headshots are based on critical hits only"; "Justin
   and NPCs and anyone else do lose their head on any headshot, no matter what"; "gunmen can get critical on other
   people, but they can't get it on a player ... No enemy can get a headshot critical hit on a player if they had
   guns"): one of theirs crits as a duck's does with that weapon (guns.js critOf), on anyone but a player: twice the
   damage, and the head only when it kills (the owner's, Nov 21 17:25Z) */
export function hitOn(s, o, t, dmg, w, now, H) {
  const half = Math.round(dmg * GM.DMG * 10) / 10,
    player = !zombieOf(t) && !t.fr && !t.mc && !H.wild(t.id),
    crit = !player && Math.random() < critOf(w);
  if (zombieOf(t)) H.hitZ(t.z, o.k === "f" ? half : dmg, w, crit);
  else if (t.fr) {
    if (!s) return;
    const q = gmOf(s).gb.find((g) => g.i === t.fr.i);
    if (q && !q.d)
      takes(s, q, null, w, crit ? { dmg: half * 2, crit } : half, now, H);
  } else if (t.mc) {
    if (o.k !== "f") H.mhurt(o.i, half, w, crit);
  } else H.hurt(t.id, half, w, crit); // (crit: only ever Justin, never a player)
}
/* an LMG burst at t: every duck its rounds fly near is suppressed a moment (its screen shakes and darkens) */
export function suppress(s, o, t, ducks, now) {
  const gm = gmOf(s),
    sp = { ...(gm.sp || {}) },
    dx = t.x - o.x,
    dy = t.y - o.y,
    L = Math.hypot(dx, dy) || 1;
  for (const d of ducks) {
    const u = Math.max(
        0,
        Math.min(1.3, ((d.x - o.x) * dx + (d.y - o.y) * dy) / L / L),
      ),
      off = Math.hypot(o.x + dx * u - d.x, o.y + dy * u - d.y);
    if (off < GM.SUPPRESS_R) sp[d.id] = now + GM.SUPPRESS_MS;
  }
  gm.sp = sp;
}
/* off to a place it can't be seen from where its duck stands, to reload there */
function hide(o, t, now, H) {
  o.st = "hide";
  o.u = now + 5000;
  o.lo = 0;
  o.cv = null;
  let best = null;
  for (let k = 0; k < 16; k++) {
    const a = Math.random() * 2 * Math.PI,
      r = rnd(...GM.COVER),
      x = o.x + Math.cos(a) * r,
      y = o.y + Math.sin(a) * r;
    if (!H.open(x, y) || clearShot(t.x, t.y, x, y, heightAt(x, y))) continue;
    const far = Math.hypot(x - t.x, y - t.y);
    if (far < Math.max(3 * GM.DUCK, Math.hypot(o.x - t.x, o.y - t.y) * 0.9))
      continue; // (never past its duck, nor nearer to it)
    const cost = Math.hypot(x - o.x, y - o.y) - far * 0.3;
    if (!best || cost < best[2]) best = [Math.round(x), Math.round(y), cost];
  }
  if (best) o.cv = [best[0], best[1]];
}
/* a full magazine for the gun in its hands, after its reload time */
function reload(o, now) {
  const i = o.wp.p.indexOf(o.hw);
  if (i < 0 || o.mg[i] >= magOf(o.hw) || o.rl[i] > now) return;
  o.mg[i] = 0;
  o.rl[i] = now + reloadOf(o.hw);
}

/* ---------- shooting: t is a duck { id, x, y, sp } or a zombie { z, x, y } ---------- */
export function shoot(s, o, t, now, H, only = null, blind = false) {
  o.ad = Math.round((Math.atan2(t.y - o.y, t.x - o.x) * 180) / Math.PI);
  o.f = t.x < o.x ? -1 : 1;
  /* its guns: a reload that's done fills it; the one in its hands, or the other while that one reloads */
  refill(o.wp.p, o.mg, o.rl, now, "gunman");
  const d = Math.hypot(t.x - o.x, t.y - o.y),
    i = o.wp.p.findIndex(
      (g, k) =>
        (!only || only.includes(g)) &&
        o.mg[k] > 0 &&
        !o.rl[k] &&
        d <= reachOf(g) * 1.1,
    );
  if (i < 0) return false;
  const g = o.wp.p[i],
    F = GUN_BREEDS.gunman.burst[g] || { n: 1, gap: [1200, 1800] };
  o.hw = g;
  if (now < (o.nx || 0)) return false;
  /* a burst's rounds, a beat's worth at a time (its gun's own wait between them) */
  if (!o.bn) o.bn = F.n;
  const many = Math.min(
    o.bn,
    o.mg[i],
    Math.max(1, Math.floor(200 / ARMS[g].cool)),
  );
  o.bn -= many;
  spend(o.mg, o.rl, i, g, many, now, "gunman");
  if (o.bn <= 0) {
    o.bn = 0;
    o.nx = now + rnd(...F.gap);
  } else o.nx = now + ARMS[g].cool;
  const A = ARMS[g],
    len = d / GM.DUCK;
  let dmg = 0,
    hit = false;
  for (let k = 0; k < many; k++)
    for (let p = 0; p < (A.pellets || 1); p++) {
      const chance = zombieOf(t)
        ? 0.85
        : A.pellets
          ? Math.max(0, AIM.pellet - AIM.pelletDrop * len) *
            (t.sp ? AIM.sprint : 1)
          : g === "lmg"
            ? AIM.lmg
            : Math.max(AIM.min, AIM.near - AIM.drop * len) *
              (t.sp ? AIM.sprint : 1);
      if (blind || Math.random() >= chance) continue; // (blind: into the cover in front of it)
      hit = true;
      dmg += roll(A.dmg);
    }
  /* where it went: at its target, or by it (a miss) */
  const off = hit ? 0 : 30 + Math.random() * 40,
    a = Math.random() * 2 * Math.PI;
  o.sh = shotMark(now, t, a, off);
  if (hit) hitOn(s, o, t, dmg, g, now, H);
  return true;
}

/* never in each other (crowd.js apart, CROWD_BREEDS.gunman): two too close are pushed apart (each half), but only
   where it's open, by the zombies' own check at their floor (as l4ddrules' nudge), so a crowd never pushes one through
   a wall */
const keepApart = (live, H) =>
  apart(live, "gunman", { move: (o, dx, dy) => push(o, dx, dy, H) });
function push(o, dx, dy, H) {
  const x = o.x + dx,
    y = o.y + dy;
  if (H.stands(x, y, heightAt(o.x, o.y))) {
    o.x = x;
    o.y = y;
  }
}

/* ---------- what hits them ---------- */
/* one takes a hit by duck `by` with weapon w (t: zombieTakes' { dmg, crit }, or how many HP): its wounds, its points (25
   for a headshot: a crit that kills); how: "blast" tears it apart */
function takes(s, o, by, w, t, now, H, how = "") {
  const dmg = typeof t === "number" ? t : t.dmg,
    took = Math.min(o.hp, dmg),
    hp = hpHurt(o.hp, dmg),
    head = typeof t === "object" && t.crit && !hp;
  o.w = hitWounds(o.w, w, WOUND_BREEDS.gunman, {
    dead: !hp,
    head,
    blast: how === "blast",
  });
  o.hp = hp;
  if (!hp) {
    o.d = now;
    o.lo = 0;
  }
  if (o.k === "f") return friendHurt(s, o, by, w, now, how); // (the friendly squad: no points, no drops; friendly fire)
  if (by && s.players[by]) {
    H.pts(by, (head ? 25 : 5 * took) * GM.PTS); // (5 times a zombie's: the owner's, "I agree with the point system for killing soldiers or criminals")
    o.mad = grudge(by, now, GM.MAD);
  }
  if (!hp && Math.random() < GM.DROP) H.drop(o.x, o.y);
}
/* a shot or a swing at (x, y): on one of them? (hit: a swing's list, each once) */
function shot(s, by, x, y, now, w, rx, ry, from, hit, H) {
  const gm = gmOf(s);
  if (!gm || !gm.gb.some((o) => !o.d)) return false;
  const near = gm.gb.filter(
    (o) =>
      !o.d &&
      !o.hid &&
      !(hit && hit.includes("g" + o.i)) &&
      Math.hypot((o.x - x) / rx, (o.y - y) / ry) < 1 &&
      (!from || !slabBetween(...from, o.x, o.y, o.z || heightAt(o.x, o.y))),
  );
  if (!near.length) return false;
  near.sort(
    (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
  );
  let any = false;
  s.hang.gm = { ...gm, gb: gm.gb.map((o) => ({ ...o })) }; // (its own copy: allies.js writes into it too)
  for (const o0 of near) {
    const o = s.hang.gm.gb.find((q) => q.i === o0.i),
      t = H.takes(by, w);
    if (!t) continue; // (a miss: it goes on by)
    takes(s, o, by, w, t, now, H);
    any = true;
    if (hit) hit.push("g" + o.i);
    else break;
  }
  return any;
}
/* a grenade's blast: its ring's damage, a crit twice (near(x, y, z): who is in it and how hard, blast.js) */
function blast(s, by, near, now, w, H) {
  if (!gmOf(s)) return;
  const gm = (s.hang.gm = { ...gmOf(s) }); // (its own copy: allies.js writes the squad's friendly fire into it)
  let any = false;
  gm.gb = gm.gb.map((o) => {
    const n = !o.d && !o.hid && near(o.x, o.y, o.z || heightAt(o.x, o.y));
    if (!n) return o;
    const q = { ...o };
    takes(
      s,
      q,
      by,
      w || "grenade",
      q.k === "f" ? 1 : hitOf(n),
      now,
      H,
      "blast",
    ); // (a player's explosive does 1 to the friendly squad)
    any = true;
    return q;
  });
  return any;
}
/* in a flamethrower's flame (inFlame(x, y, z): its cone, with nothing solid between, so a sniper on a roof is never lit
   from under it): 1 HP every so often */
function fire(s, by, now, inFlame, H) {
  if (!gmOf(s)) return;
  const gm = (s.hang.gm = { ...gmOf(s) });
  let any = false;
  gm.gb = gm.gb.map((o) => {
    if (
      o.d ||
      o.hid ||
      now - (o.bt || 0) < GM.BURN_MS ||
      !inFlame(o.x, o.y, o.z)
    )
      return o;
    const q = { ...o, bt: now };
    if (q.k === "f") friendLit(s, q, by, now);
    takes(s, q, by, "flamer", 1, now, H);
    any = true;
    return q;
  });
  return any;
}
/* a zombie's claw on gunman i: true when it killed it */
function claw(s, i, z, dmg, now, H) {
  if (!gmOf(s)) return false;
  const gm = (s.hang.gm = { ...gmOf(s) });
  let dead = false;
  gm.gb = gm.gb.map((o) => {
    if (o.i !== i || o.d) return o;
    const q = { ...o, zc: z.i };
    takes(s, q, null, "claw", dmg, now, H);
    dead = !!q.d;
    return q;
  });
  return dead;
}
/* one of them hit by the merchant (l4ddrules.js merchantShoots): dmg HP, nobody's points */
function hurt(s, i, dmg, w, now, H) {
  if (!gmOf(s)) return;
  const gm = (s.hang.gm = { ...gmOf(s) });
  gm.gb = gm.gb.map((o) => {
    if (o.i !== i || o.d) return o;
    const q = { ...o };
    takes(s, q, null, w, dmg, now, H);
    if (!q.d) q.mad = grudge("@m", now, GM.MAD); // (the merchant shot it: it goes for him as for a player, "Their likelihood to target them depends on if they're attacked by the merchant. Then they will treat them like a player")
    return q;
  });
}
/* the ones a zombie may go for (never the sniper under a tree's crown, nor while he's away: "zombies can't find him") */
const near = (s) =>
  alive(s).filter((o) => !o.hid && !(o.k === "sn" && o.pk === "tree"));

/* how many of the wave are still up (the back line counts as one): Survival ends a wave that stops dying out
   (survrules.js SV.STALL) */
const left = (s) => {
  const gm = gmOf(s);
  return gm
    ? alive(s).filter((o) => o.k === "c" || o.k === "s").length +
        (gm.bk ? 1 : 0)
    : 0;
};
/* what l4ddrules.js asks (every call brings H: what it lends, gmHelp) */
L4_HOOKS.gm = {
  hurt,
  start,
  tick,
  done,
  left,
  shot,
  blast,
  fire,
  claw,
  near,
  rest: friendsCome,
};
