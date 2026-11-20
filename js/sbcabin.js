/* ---------- Sandbox: the zombies on Duck Cabin (stage 2b), the rules ----------
   A spawn on Duck Cabin makes Dead Ducks Arcade's zombie (its look, its hits, its claw), walking the way every map's
   zombies walk (l4ddrules.js chaseField and chaseStep: the flow field over the map's own solids, then turns round
   what's in the way), never a route drawn by hand. They live in s.hang.sbz = { n, zb: [{ i, x, y (world px), hp, a (its
   last claw), f (which way it faces), l (its look: mgjrules.js zLook), sp (its spawn), sv (its speed), dm (its damage
   box), run (it may sprint), w (its wounds), d (when it died), and a duck-shaped one's k, dk, nm and weapons (sbarms.js)
   }] }.
   Shots, daggers and swings hit them as they hit Justin (hangout/rules.js hangTargets and hangHit); each takes what a
   Dead Ducks Arcade zombie takes (zombieTakes). On the zombie maps every kind but a zombie is one of these too, and
   the guns and swings there hit them (L4_HOOKS, l4ddrules.js wildHurt). */
import { rule } from "./hangout/registry.js";
import {
  W,
  H,
  STEP,
  heightAt,
  floorH,
  floorStep,
  fallsByFloors,
  slabBetween,
} from "./hangout/layout.js";
import { isGhost } from "./hangout/death.js";
import {
  baseMode,
  isSb,
  sbNpcWalls,
  sbZombieWall,
  sbWallGo,
  sbWallStops,
  sbClimbAt,
} from "./sandboxrules.js";
import {
  chaseField,
  chaseStep,
  setZWall,
  zWalk,
  Z_ROOM,
  zombieTakes,
  ALL_HP,
  L4_HOOKS,
} from "./l4ddrules.js";
import { hitCode } from "./wounds.js";
import { hpHurt } from "./hpmath.js";
import { WAVE, zLook } from "./mgjrules.js";
import { MAD } from "./sbbrain.js";
import { fight, keepAt, reachTo } from "./sbarms.js";
import { npcBody, DU_WORLD } from "./sbbody.js";
import { sees as npcSees, nearPairs, grudge } from "./npcrules.js";

export const onCabin = (s) => isSb(s) && baseMode(s.options) === "hang";
/* the worlds these walk on: Duck Cabin and the zombie maps (there, every kind but a zombie: those are the map's own) */
export const sbzOn = (s) =>
  isSb(s) && ["hang", "l4dd"].includes(baseMode(s.options));
const SPRINT = { K: 1.5, FAR: 300 }; // (half as fast again, while more than 300 px off)
const NEAR = 12, // (the most others each one is kept apart from in a beat)
  FIELDS = 6; // (the most new ways worked out in a beat, besides the one to the ducks)

const zbOf = (s) => (s.hang && s.hang.sbz && s.hang.sbz.zb) || [];
/* the zombies standing now, each { i, x, y (shares of the map), sp } */
export const cabinLive = (s) =>
  zbOf(s)
    .filter((o) => !o.d)
    .map((o) => ({ i: "c" + o.i, x: o.x / W, y: o.y / H, sp: o.sp, k: o.k })); // ("c": never the same as a zombie map's own; k: its kind)

/* one zombie at (x, y), shares of the map: its number */
export function cabinSpawn(s, x, y, o) {
  if (!s.hang) return 0;
  const z = s.hang.sbz || { n: 0, zb: [] },
    i = z.n + 1,
    l = zLook();
  l[0] = o.hp;
  s.hang = {
    ...s.hang,
    sbz: {
      n: i,
      zb: [
        ...z.zb,
        {
          i,
          x: Math.round(x * W + (Math.random() - 0.5) * 30),
          y: Math.round(y * H + (Math.random() - 0.5) * 20),
          hp: o.hp,
          a: 0,
          f: 1,
          l,
          sp: o.sp,
          sv: o.sv,
          dm: o.dm,
          ...(o.run ? { run: 1 } : {}),
          ...(o.up != null ? { up: o.up } : {}),
          ...(o.z > heightAt(x * W, y * H) + 0.5 ? { z: Math.round(o.z) } : {}), // (up on a floor, or in the air: it falls, plan Phase 4)
          ...(o.look || {}), // (its kind, look, name and weapons: sbspawn.js makeOne)
        },
      ],
    },
  };
  return i;
}

/* ---------- heights (plan Phase 4, Sandbox's floors: sbfloors.js) ----------
   One stands on the floor under its feet (the ground, a roof, a Sandbox floor or slope), steps up or down a step, walks
   off an edge and falls (a fall of D lasting D / roof times the roof's own, as a duck's: world.js), and climbs a zone
   that lets it while what it's after is higher. o.z: its feet, when it isn't on the ground; o.vz, o.top: falling */
const FALL_T = 0.35, // (s: a fall from the gas station roof, as a duck's)
  CLIMB = 150; // (px a second, as a duck's)
export const npcZ = (o) => (o.z != null ? o.z : heightAt(o.x, o.y));
function heights(s, o, to, dt, x0, y0) {
  const z0 = npcZ(o),
    roof = floorStep();
  /* a climb: up it while its foe is higher, holding still */
  const c = sbClimbAt(
    s,
    { k: o.k || "zombie", sp: o.sp },
    x0 / W,
    y0 / H,
    z0,
    W,
    H,
  );
  if (o.vz == null && c && z0 < c.top - 0.5 && to && (to.z || 0) > z0 + STEP) {
    o.x = x0;
    o.y = y0;
    o.z = Math.min(c.top, z0 + CLIMB * dt);
    return;
  }
  const g = floorH(o.x, o.y, z0 + STEP),
    hold = c && z0 >= c.top - 0.5 ? c.top : -Infinity, // (at a climb's top, still in it: holding on)
    f = Math.max(g, hold);
  if (o.vz != null) {
    o.vz -= ((2 * roof) / (FALL_T * FALL_T)) * (o.fg || 1) * dt;
    o.z = z0 + o.vz * dt;
    if (o.z <= f) {
      o.z = f;
      delete o.vz;
      delete o.fg;
    }
  } else if (f < z0 - STEP) {
    const D = z0 - floorH(o.x, o.y, z0);
    o.vz = 0;
    o.z = z0;
    if (fallsByFloors() && D > roof) o.fg = roof / D;
  } else o.z = f;
  if (o.vz == null && Math.abs(o.z - heightAt(o.x, o.y)) < 0.5) delete o.z;
  else o.z = Math.round(o.z * 10) / 10;
}

/* ---------- the host's heartbeat ----------
   H: what the rules lend it (rules.js SB_H): ducks(s) the ducks up, claw(s, id, dmg, now) a swipe on one */
export function cabinTick(s, now, H0) {
  const z = s.hang && s.hang.sbz;
  if (!z || !z.zb.length) return false;
  const dt = Math.min(0.35, Math.max(0, (now - (z.t || now)) / 1000)),
    zb = z.zb.map((o) => ({ ...o })),
    live = zb.filter((o) => !o.d),
    Hs = { ...H0, ducks: (s) => H0.ducks(s).filter((id) => !isGhost(s, id)) },
    duckAt = (id) => ({
      x: s.pos[id].x * W,
      y: s.pos[id].y * H,
      z: +s.pos[id].z || 0,
    }),
    pls = Hs.ducks(s).map((id) => {
      const q = duckAt(id);
      return { xy: [q.x, q.y], zz: +s.pos[id].z || heightAt(q.x, q.y) };
    }); // (the ducks it never walks into)
  const sbfl = fallsByFloors(), // (Sandbox on a world: floors, slopes and climbs)
    { RX, RY, CLAW } = Z_ROOM,
    far = (a, b) => Math.hypot((a.x - b.x) / RX, (a.y - b.y) / RY);
  /* the ways: one field to every duck (most go after the ducks), and a few more a beat to whatever else they're after
     (the others walk straight, turning round what's in the way, until there's one for them) */
  const toDucks =
      pls.length && live.length ? chaseField(pls.map((q) => q.xy)) : null,
    fields = new Map(),
    fieldTo = (t) => {
      if (t.duck) return toDucks;
      const k = Math.floor(t.x / 40) * 1000 + Math.floor(t.y / 40);
      if (!fields.has(k) && fields.size < FIELDS)
        fields.set(k, chaseField([[t.x, t.y]]));
      return fields.get(k) || null;
    };
  const wallsOf = sbNpcWalls(s), // (the zones that are walls to each: plan Phase 3)
    unwall = (o, x0, y0) => {
      const ws = wallsOf(o);
      if (!ws.length) return;
      const z = npcZ(o),
        [x, y] = sbWallGo(s, ws, x0 / W, y0 / H, o.x / W, o.y / H, z, W, H, o);
      o.x = x * W;
      o.y = y * H;
    };
  setZWall(sbZombieWall(s, W, H)); // (they turn round a wall as round anything in the way)
  const plans = H0.think(
    s,
    now,
    live,
    (o) => ({ x: o.x, y: o.y }),
    Hs,
    far,
    duckAt,
  );
  const moved = new Set();
  for (const { me, o, d } of plans) {
    const to = d.goal || d.flee;
    if (!to) continue;
    moved.add(o);
    const bd = far(me, to),
      claw = reachTo(CLAW, o, to, s), // (its hitbox, and its foe's: sbarms.js)
      v =
        zWalk() *
        (o.sv || 1) *
        (o.run && Math.hypot(o.x - to.x, o.y - to.y) > SPRINT.FAR
          ? SPRINT.K
          : 1),
      x0 = o.x,
      y0 = o.y;
    if (d.flee) {
      const dx = o.x - to.x,
        dy = o.y - to.y,
        n = Math.hypot(dx, dy) || 1;
      chaseStep(
        o,
        null,
        [o.x + (dx / n) * 200, o.y + (dy / n) * 200],
        v * dt,
        pls,
      );
    } else if (
      bd > (d.foe ? keepAt(o, claw) : claw * 0.9) ||
      (d.foe && o.wp && bd > claw && !sees(o, to))
    )
      chaseStep(o, fieldTo(to), [to.x, to.y], v * dt, pls); // (a gun keeps its distance, once nothing's in the way: sbarms.js)
    unwall(o, x0, y0); // (round a wall, never through it)
    if (sbfl) heights(s, o, d.flee ? null : to, dt, x0, y0); // (Sandbox's floors: plan Phase 4)
    if (Math.abs(o.x - x0) > 0.5) o.f = o.x > x0 ? 1 : -1;
    if (
      d.foe &&
      (!sbfl || Math.abs(npcZ(o) - (to.z ?? npcZ(o))) < 48) && // (on its floor: never a claw through one)
      fight(
        o,
        to,
        bd,
        claw,
        now,
        WAVE.CLAW_MS,
        (dm, w) => H0.strike(s, now, me, d.foe, Hs, o, dm, w),
        (t) => sees(o, t),
      )
    )
      o.f = to.x < o.x ? -1 : 1;
  }
  setZWall(null);
  if (sbfl)
    for (const o of live)
      if (!moved.has(o) && (o.z != null || o.vz != null))
        heights(s, o, null, dt, o.x, o.y); // (standing still: it still falls, and it rides a floor that goes)
  const was = live.map((o) => [o.x, o.y]);
  apart(live, RX, RY);
  live.forEach((o, i) => {
    const ws = wallsOf(o),
      [x0, y0] = was[i];
    if (
      ws.length &&
      sbWallStops(s, ws, x0 / W, y0 / H, o.x / W, o.y / H, npcZ(o), W, H)
    ) {
      o.x = x0;
      o.y = y0;
    } // (never pushed through a wall)
  });
  for (const o of live) {
    o.x = Math.round(o.x);
    o.y = Math.round(o.y);
  }
  s.hang = {
    ...s.hang,
    sbz: {
      ...z,
      t: now,
      zb: zb.filter((o) => !o.d || now - o.d < WAVE.DEAD_MS), // (the bodies go after a moment)
    },
  };
  return true;
}
/* a made NPC's shot from o to t goes through no wall */
const sees = (o, t) => npcSees(o, t, npcZ(o), 0);
/* never in each other: two too close are pushed apart, each only against a few in its own and the next cells */
function apart(live, RX, RY) {
  nearPairs(
    live,
    RX,
    RY,
    (A, B) => {
      const ex = (A.x - B.x) / RX,
        ey = (A.y - B.y) / RY,
        e = Math.hypot(ex, ey);
      if (e >= 0.9) return;
      const k = e > 1e-3 ? (0.9 - e) / 2 / e : 0.2,
        ux = e > 1e-3 ? ex * k : Math.random() - 0.5,
        uy = e > 1e-3 ? ey * k : Math.random() - 0.5;
      A.x += ux * RX;
      A.y += uy * RY;
      B.x -= ux * RX;
      B.y -= uy * RY;
    },
    1,
    NEAR,
  );
}

/* ---------- what hits them: the same as hits Justin ---------- */
rule("sbz", {
  only: "sandbox",
  targets(s) {
    return zbOf(s)
      .filter((o) => !o.d)
      .map((o) => {
        const b = npcBody(s, o, DU_WORLD); // (only where its picture shows, at its size and its Seriat hitbox: sbbody.js)
        return {
          id: "sbz" + o.i,
          x: o.x,
          y: o.y,
          z: npcZ(o),
          at(fx, fy, up = 0) {
            const q = b.at(fx * W, fy * H, up);
            return q && { x: q.x / W, y: q.y / H };
          }, // (in shares of the world, as rules.js has them)
          line: (x0, y0, x1, y1, up = 0) =>
            b.line(x0 * W, y0 * H, x1 * W, y1 * H, up),
        };
      });
  },
  hit(s, id, by, now, w) {
    if (!String(id).startsWith("sbz")) return false;
    return npcHit(s, +String(id).slice(3), by, now, w);
  },
});

/* NPC i takes a hit from duck by with weapon w: what a Dead Ducks Arcade zombie takes (zombieTakes); false on a miss */
function npcHit(s, i, by, now, w) {
  const z = s.hang.sbz,
    o = z && z.zb.find((q) => q.i === i && !q.d);
  if (!o) return false;
  const t = zombieTakes(s, by, w);
  if (!t) return false; // (a miss)
  const hp = t.dmg >= ALL_HP ? 0 : hpHurt(o.hp, t.dmg), // (in tenths, as every HP: hpmath.js)
    wd = (o.w || "") + hitCode(o.w || "", w, t.head);
  s.hang = {
    ...s.hang,
    sbz: {
      ...z,
      zb: z.zb.map((q) =>
        q === o
          ? {
              ...q,
              hp,
              w: wd,
              mad: grudge("p:" + by, now, MAD), // (it goes after whoever hurt it: sbbrain.js)
              ...(hp <= 0 ? { d: now } : {}),
            }
          : q,
      ),
    },
  };
  return true;
}

/* … and on the zombie maps, where shots and swings are Dead Ducks Arcade's own (l4ddrules.js wildHurt) */
const HIT_UP = 0.41; // (duck widths over the ground: where a shot flies, rules.js shotAt)
L4_HOOKS.npc = (s, by, x, y, now, w, rx, ry, from, hit) => {
  if (!isSb(s) || baseMode(s.options) !== "l4dd") return false;
  const near = zbOf(s).filter((o) => {
    if (o.d || (hit && hit.includes("c" + o.i))) return false;
    const q = npcBody(s, o, DU_WORLD).at(x, y, HIT_UP); // (its nearest part that shows, from the height a shot flies: sbbody.js)
    if (!q || Math.hypot((q.x - x) / rx, (q.y - y) / ry) >= 1) return false;
    const h = npcZ(o);
    return (
      !from ||
      (Math.abs(from[2] - h) <= 48 && !slabBetween(...from, o.x, o.y, h))
    ); // (on its floor, nothing solid between)
  });
  if (hit) {
    for (const o of near) {
      hit.push("c" + o.i);
      npcHit(s, o.i, by, now, w);
    }
    return near.length > 0;
  }
  near.sort(
    (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
  );
  return near.some((o) => npcHit(s, o.i, by, now, w)); // (a miss goes on by)
};
