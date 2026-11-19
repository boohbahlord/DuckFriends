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
   the back line, nb: when the next one from it comes in }
   A gunman: { i, k, x, y (world px), hp, l: [its most HP], f (facing: 1 right, -1 left), dk (its look: a duck's), wp
   { p: [its guns] }, mg (each gun's rounds left), rl (when each one's reload ends), hw (the gun in its hands), sh (its
   last shot: [when, x, y]), st (what it's doing: "in" coming, "fire", "hide", "wait", "look", "run"), u (until when),
   cv (where it hides), ls (where it last saw its target), tg (its target: "p:" a duck, "z:" a zombie), lo (its
   flashlight on), ad (where it aims, in degrees), mad ([who hurt it, until when]), nx (its next shot), bn (rounds left
   in this burst), bt (its last burn), w (its wounds: wounds.js codes), d (when it died) } */
import {
  L4_HOOKS,
  ARMS,
  clearShot,
  chaseField,
  chaseStep,
} from "./l4ddrules.js";
import { heightAt, slabBetween } from "./hangout/layout.js";
import { woundCode, DEATH } from "./wounds.js";
import { botDuck } from "./botduck.js";

export const GM = {
  CRIM_EACH: 8, // criminals for each player in all …
  FRONT: 4, // … and at once
  BACK_MS: [3000, 6000], // ms before one from the back line takes a fallen one's place
  DMG: 0.5, // their hits on ducks: half ("criminals do half as much damage, like the soldiers do")
  PTS: 5, // a kill's points: 5 times a zombie's
  DROP: 0.15, // each one's chance of leaving a special where it falls
  DEFEND: 160, // world px: a zombie this near is shot first ("defend themselves from zombies that are walkers, that are too close")
  FIRE_MS: [2500, 5000], // ms a criminal shoots before it hides
  WAIT_MS: [8000, 12000], // ms it waits in hiding to ambush ("wait about 10 s, then come looking")
  RUN_HP: 0.35, // its HP's share when it runs off and hides
  RUN_MS: [3000, 5000],
  COVER: [140, 420], // world px: how far it looks for a place to hide
  DEAD_MS: 30000, // ms a body lies there
  BURN_MS: 2000, // ms between a flame's bites (as the merchant's, l4ddrules.js BURN.EVERY)
  DUCK: 64, // world px in a duck length
};
/* the criminals' guns, and how each fires: rounds a burst, ms from one burst to the next (their hidden cooldowns), and
   the magazine a gun with none gets */
const CRIM_GUNS = [
  ["handgun", "revolver"],
  ["smg", "tommy", "ump"],
  ["shotgun", "dbuck"],
];
const FIRE = {
  handgun: { n: 1, gap: [1400, 2200] },
  revolver: { n: 1, gap: [1600, 2400] },
  smg: { n: 3, gap: [2200, 3200] },
  tommy: { n: 3, gap: [2200, 3200] },
  ump: { n: 3, gap: [2200, 3200] },
  shotgun: { n: 1, gap: [2000, 2800], mag: 6 },
  dbuck: { n: 1, gap: [1800, 2600] },
};
/* how far each gun is fired from (duck lengths) and how likely a round is to hit a duck there: AIM.near up close, less
   for each duck length, never under AIM.min; a sprinting duck is harder to hit */
const REACH = { shotgun: 3.5, dbuck: 3.5, revolver: 8 };
const reachOf = (w) => (REACH[w] || 7) * GM.DUCK;
const AIM = {
  near: 0.25,
  drop: 0.03,
  min: 0.06,
  sprint: 0.6,
  pellet: 0.35, // (a shotgun's: each pellet, up close, PELLET_DROP less for each duck length)
  pelletDrop: 0.08,
};

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const gmOf = (s) => (s.hang && s.hang.gm) || null;
const alive = (s) => ((gmOf(s) || {}).gb || []).filter((o) => !o.d);

/* a criminal's look: a random duck's color in street clothes, now and then something on its face or its head (the
   owner's: "maybe glasses versus other facial apparel, different collared ducks maybe"; Noah draws their own later) */
function crimLook() {
  const d = botDuck();
  return {
    ...d,
    pattern: "none",
    metal: "none",
    keys: null,
    style: "rubber",
    outfit: { id: pick(["hoodie", "leather", "jeans", "plaid", "shirt"]) },
    face:
      Math.random() < 0.6
        ? { id: pick(["ski", "shades", "glasses", "bag", "aviators", "patch"]) }
        : null,
    hat: Math.random() < 0.35 ? { id: pick(["cap", "bucket"]) } : null,
  };
}
function newGunman(s, k, x, y, H) {
  const gm = gmOf(s),
    i = gm.n + 1,
    hp = H.hp(),
    guns = [pick(pick(CRIM_GUNS))];
  if (!["handgun", "revolver"].includes(guns[0])) guns.push("handgun"); // (a pistol besides)
  gm.n = i;
  return {
    i,
    k,
    x: Math.round(x),
    y: Math.round(y),
    hp,
    l: [hp],
    f: 1,
    dk: crimLook(),
    wp: { p: guns },
    mg: guns.map(magOf),
    rl: guns.map(() => 0),
    hw: guns[0],
    st: "in",
    u: 0,
    lo: 1,
    ad: 0,
  };
}
const magOf = (w) => (FIRE[w] && FIRE[w].mag) || ARMS[w].mag || 6;
const reloadOf = (w) =>
  ARMS[w].reload || (ARMS[w].shell ? ARMS[w].shell * magOf(w) : 1500);

/* ---------- a wave ---------- */
/* a gunmen peak begins (kind "c" criminals, "s" soldiers): the first of them come in from outside */
function start(s, kind, now, H) {
  const n = Math.max(1, H.ids.length),
    all = GM.CRIM_EACH * n,
    front = GM.FRONT * n;
  s.hang.gm = {
    n: (gmOf(s) || {}).n || 0,
    gb: ((gmOf(s) || {}).gb || []).filter((o) => !o.d), // (bodies of the last wave go)
    k: kind,
    bk: all - front,
    nb: 0,
  };
  const gm = s.hang.gm;
  /* they come in a few groups, each at its own spot nobody sees */
  for (let made = 0; made < front; ) {
    const at = H.edge();
    if (!at) break;
    const g = Math.min(front - made, 2 + Math.floor(Math.random() * 2));
    for (let k = 0; k < g; k++, made++)
      gm.gb.push(
        newGunman(s, kind, at[0] + rnd(-30, 30), at[1] + rnd(-20, 20), H),
      );
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
        .map((o) => ({ ...o })),
    },
    dt = Math.min(0.35, Math.max(0.05, (now - (gm0.t || now - 200)) / 1000)),
    ducks = ids
      .filter((id) => H.up(id) && s.pos[id])
      .map((id) => {
        const p = s.pos[id],
          x = p.x * H.ww,
          y = p.y * H.wh;
        return { id, x, y, z: +p.z || 0, sp: !!p.sp, j: H.wild(id) };
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
  for (const o of gm.gb) {
    if (o.d) continue;
    crim(s, o, zs, ducks, pls, fieldTo, now, dt, H);
  }
  apart(gm.gb.filter((o) => !o.d));
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

/* one criminal's beat */
function crim(s, o, zs, ducks, pls, fieldTo, now, dt, H) {
  const sees = (t) =>
      clearShot(o.x, o.y, t.x, t.y, heightAt(o.x, o.y)) &&
      Math.abs(heightAt(o.x, o.y) - (t.z || 0)) < 60,
    dist = (t) => Math.hypot(t.x - o.x, t.y - o.y),
    go = (x, y, k = 1) => {
      const x0 = o.x;
      chaseStep(o, fieldTo(x, y), [x, y], H.speed * k * dt, pls);
      if (Math.abs(o.x - x0) > 0.5) o.f = o.x > x0 ? 1 : -1;
    };
  /* a zombie too near (or one that just clawed it) is shot first */
  const zt = zs
    .filter(
      (z) =>
        z.st !== 3 &&
        (Math.hypot(z.x - o.x, z.y - o.y) < GM.DEFEND || z.i === o.zc),
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - o.x, a.y - o.y) - Math.hypot(b.x - o.x, b.y - o.y),
    )[0];
  if (zt) {
    shoot(s, o, { z: zt, x: zt.x, y: zt.y }, now, H);
    return;
  }
  /* its duck: whoever hurt it a moment ago, else the nearest one (Justin out there only when there's nobody else) */
  const mad = o.mad && o.mad[1] > now && ducks.find((d) => d.id === o.mad[0]);
  const t =
    mad ||
    ducks
      .slice()
      .sort((a, b) => dist(a) * (a.j ? 3 : 1) - dist(b) * (b.j ? 3 : 1))[0];
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
      const g = see || !o.ls ? [t.x, t.y] : o.ls;
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
function shoot(s, o, t, now, H) {
  o.ad = Math.round((Math.atan2(t.y - o.y, t.x - o.x) * 180) / Math.PI);
  o.f = t.x < o.x ? -1 : 1;
  /* its guns: a reload that's done fills it; the one in its hands, or the other while that one reloads */
  o.wp.p.forEach((g, i) => {
    if (o.rl[i] && o.rl[i] <= now) {
      o.mg[i] = magOf(g);
      o.rl[i] = 0;
    }
  });
  const d = Math.hypot(t.x - o.x, t.y - o.y),
    i = o.wp.p.findIndex(
      (g, k) => o.mg[k] > 0 && !o.rl[k] && d <= reachOf(g) * 1.1,
    );
  if (i < 0) return;
  const g = o.wp.p[i],
    F = FIRE[g] || { n: 1, gap: [1200, 1800] };
  o.hw = g;
  if (now < (o.nx || 0)) return;
  /* a burst's rounds, a beat's worth at a time (its gun's own wait between them) */
  if (!o.bn) o.bn = F.n;
  const many = Math.min(
    o.bn,
    o.mg[i],
    Math.max(1, Math.floor(200 / ARMS[g].cool)),
  );
  o.bn -= many;
  o.mg[i] -= many;
  if (o.mg[i] <= 0) o.rl[i] = now + reloadOf(g);
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
      const chance = t.z
        ? 0.85
        : A.pellets
          ? Math.max(0, AIM.pellet - AIM.pelletDrop * len) *
            (t.sp ? AIM.sprint : 1)
          : Math.max(AIM.min, AIM.near - AIM.drop * len) *
            (t.sp ? AIM.sprint : 1);
      if (Math.random() >= chance) continue;
      hit = true;
      dmg += Array.isArray(A.dmg)
        ? A.dmg[0] + Math.floor(Math.random() * (A.dmg[1] - A.dmg[0] + 1))
        : +A.dmg || 1;
    }
  /* where it went: at its target, or by it (a miss) */
  const off = hit ? 0 : 30 + Math.random() * 40,
    a = Math.random() * 2 * Math.PI;
  o.sh = [
    now,
    Math.round(t.x + Math.cos(a) * off),
    Math.round(t.y + Math.sin(a) * off * 0.5),
  ];
  if (!hit) return;
  if (t.z) H.hitZ(t.z, dmg, g);
  else H.hurt(t.id, Math.round(dmg * GM.DMG * 10) / 10, g);
}

/* never in each other */
function apart(live) {
  for (let a = 0; a < live.length; a++)
    for (let b = a + 1; b < live.length; b++) {
      const A = live[a],
        B = live[b],
        dx = A.x - B.x,
        dy = A.y - B.y,
        e = Math.hypot(dx / 40, dy / 22);
      if (e >= 1) continue;
      const k = e > 1e-3 ? (1 - e) / 2 / e : 0.3,
        ux = e > 1e-3 ? dx * k : 4,
        uy = e > 1e-3 ? dy * k : 2;
      A.x += ux;
      A.y += uy;
      B.x -= ux;
      B.y -= uy;
    }
}

/* ---------- what hits them ---------- */
/* one takes a hit by duck `by` with weapon w (t: zombieTakes' { dmg, head }, or how many HP): its wounds, its points;
   how: "blast" tears it apart */
function takes(s, o, by, w, t, now, H, how = "") {
  const dmg = typeof t === "number" ? t : t.dmg,
    head = typeof t === "object" && t.head,
    took = Math.min(o.hp, dmg),
    hp = Math.max(0, Math.round((o.hp - dmg) * 10) / 10),
    had = o.w || "";
  o.w =
    !hp && head
      ? had.includes("x")
        ? had
        : had + "x0"
      : !hp && how === "blast"
        ? had + DEATH.filter((c) => !had.includes(c)).join("")
        : had + woundCode(had, w);
  o.hp = hp;
  if (by && s.players[by]) {
    H.pts(by, (head ? 25 : 5 * took) * GM.PTS); // (5 times a zombie's: the owner's, "I agree with the point system for killing soldiers or criminals")
    o.mad = [by, now + 8000];
  }
  if (!hp) {
    o.d = now;
    o.lo = 0;
    if (Math.random() < GM.DROP) H.drop(o.x, o.y);
  }
}
/* a shot or a swing at (x, y): on one of them? (hit: a swing's list, each once) */
function shot(s, by, x, y, now, w, rx, ry, from, hit, H) {
  const gm = gmOf(s);
  if (!gm || !gm.gb.some((o) => !o.d)) return false;
  const near = gm.gb.filter(
    (o) =>
      !o.d &&
      !(hit && hit.includes("g" + o.i)) &&
      Math.hypot((o.x - x) / rx, (o.y - y) / ry) < 1 &&
      (!from || !slabBetween(...from, o.x, o.y, heightAt(o.x, o.y))),
  );
  if (!near.length) return false;
  near.sort(
    (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
  );
  let any = false;
  s.hang.gm = { ...gm, gb: gm.gb.map((o) => ({ ...o })) };
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
/* a grenade's blast: all their HP (r: its reach, open(x, y, z): nothing solid between) */
function blast(s, by, bx, bY, r, open, now, w, H) {
  const gm = gmOf(s);
  if (!gm) return;
  let any = false;
  const gb = gm.gb.map((o) => {
    if (
      o.d ||
      Math.hypot(o.x - bx, (o.y - bY) * 1.25) >= r ||
      !open(o.x, o.y, heightAt(o.x, o.y))
    )
      return o;
    const q = { ...o };
    takes(s, q, by, w || "grenade", q.hp, now, H, "blast");
    any = true;
    return q;
  });
  if (any) s.hang.gm = { ...gm, gb };
}
/* in a flamethrower's flame (inFlame(x, y)): 1 HP every so often */
function fire(s, by, now, inFlame, H) {
  const gm = gmOf(s);
  if (!gm) return;
  let any = false;
  const gb = gm.gb.map((o) => {
    if (o.d || now - (o.bt || 0) < GM.BURN_MS || !inFlame(o.x, o.y)) return o;
    const q = { ...o, bt: now };
    takes(s, q, by, "flamer", 1, now, H);
    any = true;
    return q;
  });
  if (any) s.hang.gm = { ...gm, gb };
}
/* a zombie's claw on gunman i: true when it killed it */
function claw(s, i, z, dmg, now, H) {
  const gm = gmOf(s);
  if (!gm) return false;
  let dead = false;
  s.hang.gm = {
    ...gm,
    gb: gm.gb.map((o) => {
      if (o.i !== i || o.d) return o;
      const q = { ...o, zc: z.i };
      takes(s, q, null, "claw", dmg, now, H);
      dead = !!q.d;
      return q;
    }),
  };
  return dead;
}
/* the ones a zombie may go for */
const near = (s) => alive(s);

/* what l4ddrules.js asks (every call brings H: what it lends, gmHelp) */
L4_HOOKS.gm = { start, tick, done, shot, blast, fire, claw, near };
