/* ---------- Sandbox: the zombies on Duck Cabin (stage 2b), the rules ----------
   A spawn on Duck Cabin makes Dead Ducks Arcade's zombie (its look, its hits, its claw), walking the way every map's
   zombies walk (l4ddrules.js chaseField and chaseStep: the flow field over the map's own solids, then turns round
   what's in the way), never a route drawn by hand. They live in s.hang.sbz = { n, zb: [{ i, x, y (world px), hp, a (its
   last claw), f (which way it faces), l (its look: mgjrules.js zLook), sp (its spawn), sv (its speed), dm (its damage
   box), run (it may sprint), w (its wounds), d (when it died) }] }.
   Shots, daggers and swings hit them as they hit Justin (hangout/rules.js hangTargets and hangHit); each takes what a
   Dead Ducks Arcade zombie takes (zombieTakes). */
import { rule } from "./hangout/registry.js";
import { W, H, heightAt } from "./hangout/layout.js";
import { isGhost } from "./hangout/death.js";
import { baseMode, isSb, SB_BOXES } from "./sandboxrules.js";
import { valueOf } from "./numerat.js";
import {
  chaseField,
  chaseStep,
  zWalk,
  Z_ROOM,
  zombieTakes,
  ALL_HP,
} from "./l4ddrules.js";
import { hitCode } from "./wounds.js";
import { WAVE, zLook } from "./mgjrules.js";

export const onCabin = (s) => isSb(s) && baseMode(s.options) === "hang";
const SPRINT = { K: 1.5, FAR: 300 }; // (half as fast again, while more than 300 px off)
const NEAR = 12; // (the most others each one is kept apart from in a beat)

const zbOf = (s) => (s.hang && s.hang.sbz && s.hang.sbz.zb) || [];
/* the zombies standing now, each { i, x, y (shares of the map), sp } */
export const cabinLive = (s) =>
  zbOf(s)
    .filter((o) => !o.d)
    .map((o) => ({ i: o.i, x: o.x / W, y: o.y / H, sp: o.sp }));

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
        },
      ],
    },
  };
  return i;
}

/* ---------- the host's heartbeat ----------
   H: what the rules lend it (rules.js SB_H): ducks(s) the ducks up, claw(s, id, dmg, now) a swipe on one */
export function cabinTick(s, now, H0) {
  const z = s.hang && s.hang.sbz;
  if (!z || !z.zb.length) return false;
  const dt = Math.min(0.35, Math.max(0, (now - (z.t || now)) / 1000)),
    zb = z.zb.map((o) => ({ ...o })),
    live = zb.filter((o) => !o.d),
    ducks = H0.ducks(s)
      .filter((id) => !isGhost(s, id))
      .map((id) => {
        const p = s.pos[id],
          x = p.x * W,
          y = p.y * H;
        return { id, xy: [x, y], zz: +p.z || heightAt(x, y) };
      });
  const { RX, RY, CLAW } = Z_ROOM,
    room = (o, q) => Math.hypot((o.x - q.xy[0]) / RX, (o.y - q.xy[1]) / RY);
  const dist =
    ducks.length && live.length ? chaseField(ducks.map((q) => q.xy)) : null;
  for (const o of live) {
    let best = null,
      bd = Infinity;
    for (const q of ducks) {
      const d = room(o, q);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    if (!best) continue;
    const far = Math.hypot(o.x - best.xy[0], o.y - best.xy[1]),
      v = zWalk() * (o.sv || 1) * (o.run && far > SPRINT.FAR ? SPRINT.K : 1);
    if (bd > CLAW * 0.9) {
      const x0 = o.x;
      chaseStep(o, dist, best.xy, v * dt, ducks);
      if (Math.abs(o.x - x0) > 0.5) o.f = o.x > x0 ? 1 : -1;
    }
    if (bd <= CLAW && now - o.a >= WAVE.CLAW_MS) {
      o.a = now;
      o.f = best.xy[0] < o.x ? -1 : 1;
      H0.claw(
        s,
        best.id,
        Math.max(0.1, valueOf({ ok: o.dm }, SB_BOXES.damage) || 1),
        now,
      );
    }
  }
  apart(live, RX, RY);
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
/* never in each other: two too close are pushed apart, each only against a few in its own and the next cells */
function apart(live, RX, RY) {
  const grid = new Map(),
    key = (cx, cy) => cx * 4096 + cy,
    cell = (o) => [Math.floor(o.x / RX), Math.floor(o.y / RY)];
  for (const o of live) {
    const k = key(...cell(o));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(o);
  }
  for (const A of live) {
    const [cx, cy] = cell(A);
    let seen = 0;
    for (let gx = cx - 1; gx <= cx + 1 && seen < NEAR; gx++)
      for (let gy = cy - 1; gy <= cy + 1 && seen < NEAR; gy++)
        for (const B of grid.get(key(gx, gy)) || []) {
          if (B.i <= A.i) continue;
          if (++seen > NEAR) break;
          const ex = (A.x - B.x) / RX,
            ey = (A.y - B.y) / RY,
            e = Math.hypot(ex, ey);
          if (e >= 0.9) continue;
          const k = e > 1e-3 ? (0.9 - e) / 2 / e : 0.2,
            ux = e > 1e-3 ? ex * k : Math.random() - 0.5,
            uy = e > 1e-3 ? ey * k : Math.random() - 0.5;
          A.x += ux * RX;
          A.y += uy * RY;
          B.x -= ux * RX;
          B.y -= uy * RY;
        }
  }
}

/* ---------- what hits them: the same as hits Justin ---------- */
rule("sbz", {
  only: "sandbox",
  targets(s) {
    return zbOf(s)
      .filter((o) => !o.d)
      .map((o) => ({
        id: "sbz" + o.i,
        x: o.x,
        y: o.y,
        z: heightAt(o.x, o.y),
      }));
  },
  hit(s, id, by, now, w) {
    if (!String(id).startsWith("sbz")) return false;
    const i = +String(id).slice(3),
      z = s.hang.sbz,
      o = z && z.zb.find((q) => q.i === i && !q.d);
    if (!o) return false;
    const t = zombieTakes(s, by, w);
    if (!t) return false; // (a miss)
    const hp = t.dmg >= ALL_HP ? 0 : o.hp - t.dmg,
      wd = (o.w || "") + hitCode(o.w || "", w, t.head);
    s.hang = {
      ...s.hang,
      sbz: {
        ...z,
        zb: z.zb.map((q) =>
          q === o
            ? {
                ...q,
                hp: Math.max(0, hp),
                w: wd,
                ...(hp <= 0 ? { d: now } : {}),
              }
            : q,
        ),
      },
    };
    return true;
  },
});
