/* ---------- Quacky Zombies' computers (TEST rooms) ----------
   A computer goes to a downed teammate and holds E by it; otherwise it shoots the nearest zombie it can see (a ranged
   weapon with something left in it, the melee weapon up close, the medkit when it's hurt), backs away from one that's
   too close, throws a grenade into a crowd now and then, and keeps near the middle of the great room. With no zombie in
   sight it spends its points: an upgrade from Justin's Butler, or a spin at the fireplace (and it goes to take what
   lands, swapping its emptier ranged weapon). A ghost or a downed computer does nothing. */
import { W, H, heightAt, standable, STEP } from "./hangout/layout.js";
import {
  L4,
  WALK,
  zombiesOf,
  startSpot,
  playable,
  wayTo,
  clearShot,
  l4Up,
  l4Cool,
  kitOf,
  kindOf,
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
  ARMS,
  isHelper,
  laserHeat,
  wildOpen,
  wildCrying,
  isWild,
  jaimeBody,
  JBODY,
  endless,
  wetSlow,
  hasLeft,
} from "./l4ddrules.js";
import { isSurv } from "./survrules.js";
import { walkOf } from "./rules.js";
import { WANDER } from "./hangout/justin.js";
import { NPC_RUN } from "./npcshared.js";

const SEE = 460; // world px: how far a computer looks for a zombie to shoot
const TOO_CLOSE = 95;
const STEP_MS = 200; // (the TEST room's heartbeat: how far it walks each time)
const AT = 90; // world px: near enough to the Butler or the fireplace
const spinAt = new Map(); // computer → when it last spun the fireplace (one spin in a while, not every time it can)
const readyAt = new Map(); // "computer round" → when it presses End turn (Ready in round 0): a few seconds into the wait

/* a few small steps toward (tx, ty), never off the cabin and the deck, never up a wall */
function walk(x, y, tx, ty, far) {
  const d = Math.hypot(tx - x, ty - y);
  if (d < 1) return [x, y];
  const n = Math.ceil(Math.min(far, d) / 8),
    ux = (tx - x) / d,
    uy = (ty - y) / d;
  for (let k = 0; k < n; k++) {
    const nx = x + ux * Math.min(8, d - k * 8),
      ny = y + uy * Math.min(8, d - k * 8),
      z = heightAt(x, y);
    if (!playable(nx, ny) || !standable(nx, ny, z, STEP, [x, y])) break;
    x = nx;
    y = ny;
  }
  return [x, y];
}

export function l4Bot(s, id, now, out) {
  const p = s.pos[id],
    h = s.hang;
  if (!p || !h || !h.l4 || h.l4.over || !l4Up(s, id)) return;
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
    far = WALK * walkOf(s) * (STEP_MS / 1000) * (upOf(s, id).sp ? 1.1 : 1), // (as fast as my duck: the Walking speed, the Butler's Speed)
    m = kitOf(s, id) || { sl: [], am: {}, u: {} },
    sl = m.sl,
    send = (nx, ny, w, ax, ay) =>
      out.push({
        t: "move",
        id,
        x: +(nx / W).toFixed(5),
        y: +(ny / H).toFixed(5),
        j: 0,
        z: Math.round(heightAt(nx, ny)),
        b: Math.round(heightAt(nx, ny)),
        w,
        ax: +(ax / W).toFixed(4),
        ay: +(ay / H).toFixed(4),
      });
  /* a teammate down: go to it and hold E (the hold goes on by itself until the revive is done); in Survival with a
     defibrillator, a dead player too (the defibrillator out in hand) */
  const defib = isSurv(s) && hasLeft(s, id, "defib"),
    dead = (t) => !!((h.l4p || {})[t] || {}).ex,
    down = s.seat
      .filter(
        (t) =>
          t !== id &&
          ((h.l4p || {})[t] || {}).dn &&
          (!dead(t) || (defib && !isWild(s, t) && !isHelper(s, t))) &&
          s.pos[t],
      ) // (down, not dead: the dead are never revived, but by the defibrillator)
      .map((t) => ({ t, x: s.pos[t].x * W, y: s.pos[t].y * H }))
      .sort(
        (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
      )[0];
  if (down && Math.hypot(down.x - x, down.y - y) < 900) {
    const d = Math.hypot(down.x - x, down.y - y),
      rv = ((h.l4p || {})[down.t] || {}).rv;
    if (d < L4.REACH * 0.9) {
      if (dead(down.t)) send(x, y, "defib", down.x - x, down.y - y); // (in hand first)
      if (!rv || rv.by !== id)
        out.push({ t: "hang", k: "l4", do: "rev", on: down.t, hold: true, id });
      return;
    }
    const to = wayTo(x, y, down.x, down.y, now) || [down.x, down.y],
      [nx, ny] = walk(x, y, to[0], to[1], far);
    send(nx, ny, "knife", to[0] - x, to[1] - y);
    return;
  }
  /* the nearest zombie in sight */
  const zs = zombiesOf(s).filter((z) => z.st === 2 || z.st === 4);
  let best = null,
    bd = SEE;
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
        ? walk(
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
  const crowd = zs.filter(
    (z) => Math.hypot(z.x - best.x, z.y - best.y) < 130,
  ).length;
  if (crowd >= 4 && m.g > 0 && bd > 200 && now - (u.grenade || 0) > 4000) {
    out.push({
      t: "use",
      id,
      what: "grenade",
      face: ax < 0 ? -1 : 1,
      ax: ax / W,
      ay: ay / H,
    });
    return;
  }
  /* the special from the fireplace, now and then, with a zombie close (the medkit waits for low HP below; the long
     jump and the jetpack stay as they are) */
  const sp = [sl[3], sl[4]].find(
    (w) =>
      ["jaime", "jaimebomb", "zebra", "adrenaline"].includes(w) &&
      m.am[w] &&
      m.am[w][0] > 0,
  ); // (either item slot)
  if (sp && bd < 400 && now - (u[sp] || 0) > 6000) {
    out.push({
      t: "use",
      id,
      what: sp,
      face: ax < 0 ? -1 : 1,
      ax: ax / W,
      ay: ay / H,
    });
    return;
  }
  const loaded = [sl[1], sl[2]].filter((w) =>
      w === "laser"
        ? laserOk(s, id, now)
        : endless(w) || (w && m.am[w] && m.am[w][0] > 0 && m.rw !== w),
    ),
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
    [nx, ny] = walk(x, y, x - ax, y - ay, far);
  send(nx, ny, w, ax, ay);
  if (now - (u[w] || 0) >= l4Cool(s, id, w))
    out.push({
      t: "use",
      id,
      what: w,
      face: ax < 0 ? -1 : 1,
      ax: ax / W,
      ay: ay / H,
    });
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
      hand = left(m.sl[1]) <= left(m.sl[2]) ? m.sl[1] : m.sl[2];
    } // (it gives up the emptier one)
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
    [nx, ny] = walk(x, y, way[0], way[1], far);
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
  "dbuck",
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
      walkOf(s) *
      wetSlow(x, y) * // (Downpour's flood: as a player's duck is slowed)
      (dt / 1000),
    m = kitOf(s, id) || { sl: [], am: {}, u: {} },
    sl = m.sl,
    u = m.u || {};
  const br = breath.get(id) || { left: 1, out: false };
  breath.set(id, br);
  const run = (want) => {
    const go = want && !br.out && br.left > 0;
    if (go) {
      br.left = Math.max(0, br.left - dt / L4.SPRINT);
      if (br.left <= 0) br.out = true;
    } else {
      if (!want) br.out = false;
      br.left = Math.min(1, br.left + dt / L4.SPRINT);
    }
    return go ? walkPx * NPC_RUN : walkPx; // (the shared slow speed, npcshared.js: "if he does sprint, he sprints slower", the owner's, Nov 19 19:27Z. It was a duck's sprint, world.js SPRINT)
  };
  const send = (nx, ny, w, ax, ay, j = 0) =>
    out.push({
      t: "move",
      id,
      x: +(nx / W).toFixed(5),
      y: +(ny / H).toFixed(5),
      j,
      z: Math.round(heightAt(nx, ny)),
      b: Math.round(heightAt(nx, ny)),
      w,
      ax: +((ax || 1) / W).toFixed(4),
      ay: +(ay / H).toFixed(4),
    });
  const zs = zombiesOf(s).filter((z) => z.st === 2 || z.st === 4),
    near = zs
      .map((z) => ({ z, d: Math.hypot(z.x - x, z.y - y) }))
      .sort((a, b) => a.d - b.d),
    d0 = near.length ? near[0].d : Infinity;
  if (
    isWild(s, id) &&
    h.l4.wait &&
    !wildCrying(s, id, now) &&
    jaimeVisit(s, id, now, p, x, y, run, out)
  )
    return; // (a rest phase: he may stop by Jaime's body)
  if (wildOpen(s, id)) return wildMove(s, id, now, p, x, y, near, run, out); // (Justin out there: never armed, the owner's, Nov 17 20:02Z)
  /* what he'd shoot: the nearest zombie he can see */
  const seen = near.find(
    (n) => n.d < SEE * 1.3 && clearShot(x, y, n.z.x, n.z.y, heightAt(x, y)),
  );
  /* his gun: the best one with something in it (not reloading); the chain gun when a zombie is close or they crowd */
  const loaded = (w) =>
    w === "laser"
      ? laserOk(s, id, now)
      : endless(w) || (w && m.am[w] && m.am[w][0] > 0 && m.rw !== w);
  const crowd = seen
    ? zs.filter((z) => Math.hypot(z.x - seen.z.x, z.y - seen.z.y) < 150).length
    : 0;
  const guns = [sl[1], sl[2]].filter(loaded),
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
  const down = s.seat
    .filter(
      (t) =>
        t !== id &&
        ((h.l4p || {})[t] || {}).dn &&
        !((h.l4p || {})[t] || {}).ex &&
        s.pos[t],
    ) // (down, not dead: the dead are never revived)
    .map((t) => ({ t, x: s.pos[t].x * W, y: s.pos[t].y * H }))
    .filter((t) => zs.every((z) => Math.hypot(z.x - t.x, z.y - t.y) > KEEP))
    .sort(
      (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
    )[0];
  if (down && d0 > CLOSE && Math.hypot(down.x - x, down.y - y) < 1200) {
    const d = Math.hypot(down.x - x, down.y - y),
      rv = ((h.l4p || {})[down.t] || {}).rv;
    if (d < L4.REACH * 0.9) {
      if (!rv || rv.by !== id)
        out.push({ t: "hang", k: "l4", do: "rev", on: down.t, hold: true, id });
      if (seen && gun)
        shoot(s, id, now, m, gun, seen.z.x - x, seen.z.y - y, out); // (he shoots while he holds E)
      return;
    }
    const to = wayTo(x, y, down.x, down.y, now) || [down.x, down.y],
      [nx, ny] = walk(x, y, to[0], to[1], run(false));
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
        [nx, ny] = walk(x, y, to[0], to[1], run(false));
      send(nx, ny, gun || sl[1], nx - x, ny - y);
    } else run(false);
    return;
  }
  /* step: where every zombie is farthest and the floor ahead is open; staying put is one of the choices */
  const far = run(d0 < CLOSE);
  let [nx, ny] = [x, y];
  if (d0 < KEEP) [nx, ny] = away(x, y, far, near);
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
  if (
    seen &&
    crowd >= 4 &&
    m.g > 0 &&
    seen.d > 220 &&
    now - (u.grenade || 0) > 3000
  )
    out.push({
      t: "use",
      id,
      what: "grenade",
      face: ax < 0 ? -1 : 1,
      ax: ax / W,
      ay: ay / H,
    });
}
/* Justin out there with no weapon (the owner's, Nov 17; Nov 19 19:27Z: "he still tries to protect himself"): he walks
   away from the nearest zombies (running only from one really close, with his meter: a duck's own, at the shared slow
   speed), cries and runs off when he's hurt, never jumps or dodges, and otherwise strolls about as he does in Duck
   Cabin */
const wander = new Map(); // Justin → { x, y, until }
/* where Justin strolls to, his Duck Cabin way (hangout/justin.js WANDER, the owner's, Nov 17 19:11Z: "HE SHOULD BE CASUALLY
   WALKING AROUND WHICH IS ALREADY IN HIS CHARACTER SHEET! STOP REWRITING CODE TERRIBLY FOR THINGS ALREADY FIGURED OUT!"):
   a spot anywhere on the map, walked to; once he's there he stands about (rest: true) until WANDER seconds have gone by
   since he set off, then the next spot */
function wanderSpot(id, now, x, y) {
  let w = wander.get(id);
  if (w && now <= w.until)
    return Math.hypot(w.x - x, w.y - y) < 90 ? { ...w, rest: true } : w;
  w = null;
  for (let i = 0; i < 24 && !w; i++) {
    const tx = Math.random() * W,
      ty = Math.random() * H;
    if (playable(tx, ty) && standable(tx, ty, heightAt(tx, ty), STEP))
      w = {
        x: tx,
        y: ty,
        until:
          now + (WANDER[0] + Math.random() * (WANDER[1] - WANDER[0])) * 1000,
      };
  }
  if (w) wander.set(id, w);
  return w;
}
/* in a rest phase Justin may go to Jaime's body: he asks the rules for this phase's plan once (half the time two visits),
   walks there, and the rules make him say a line each time he's there; true while it's walking him */
function jaimeVisit(s, id, now, p, x, y, run, out) {
  const B = jaimeBody(),
    v = s.hang.l4jv,
    r = s.hang.l4.wait.r;
  if (!B) return false;
  if (!v || v.r !== r) {
    out.push({ t: "hang", k: "l4", do: "jplan", id });
    return false;
  }
  if (v.left <= 0) return false;
  const d = Math.hypot(B.x - x, B.y - y);
  if (d < JBODY.near * 0.8) {
    if (now - v.at >= JBODY.gap)
      out.push({ t: "hang", k: "l4", do: "jbody", id });
    return false; // (he has said his line: he wanders off again until the next visit)
  }
  if (now - v.at < JBODY.gap) return false;
  const to = wayTo(x, y, B.x, B.y, now) || [B.x, B.y],
    [nx, ny] = walk(x, y, to[0], to[1], run(false));
  out.push({
    t: "move",
    id,
    x: +(nx / W).toFixed(5),
    y: +(ny / H).toFixed(5),
    j: 0,
    z: Math.round(heightAt(nx, ny)),
    b: Math.round(heightAt(nx, ny)),
    w: p.w || "",
    ax: +((nx - x || 1) / W).toFixed(4),
    ay: +((ny - y) / H).toFixed(4),
  });
  return true;
}
function wildMove(s, id, now, p, x, y, near, run, out, forced = false) {
  /* only the zombies scare him, and being hurt; never the ducks themselves (the owner's, Nov 17 18:05Z: "justin should be
     running from zombies not every player"), and no longer the shots flying by him: running from those before they
     landed was the dodging (the owner's, Nov 19 19:27Z: "Justin should stop dodging bullets like a fucking god") */
  const threats = [...near],
    cry = wildCrying(s, id, now) && s.hang.l4jcry; // (hurt: crying, he runs off from where it came from, l4ddrules.js CRY)
  if (cry)
    threats.push({
      z: { x: cry.x, y: cry.y },
      d: Math.hypot(cry.x - x, cry.y - y),
    });
  threats.sort((a, b) => a.d - b.d);
  const d0 = threats.length ? threats[0].d : Infinity,
    scared = forced || !!cry || d0 < KEEP * 1.4;
  const w = scared ? null : wanderSpot(id, now, x, y);
  let [nx, ny] = [x, y];
  /* he runs only with a reason, and less often (the owner's, Nov 17 19:11Z: "WHY IS JUSTIN ALWAYS SPRINTING WITHOUT EVER
     STOPPING", and Nov 19 19:27Z: "he shouldn't sprint as often"): hurt, or a zombie really close (CLOSE); one farther off
     and he walks away from it. His meter is a duck's own (run: L4.SPRINT to empty, as long to fill, and none until he
     stops wanting it once it ran out) */
  const far = run(forced || !!cry || d0 < CLOSE);
  if (scared) [nx, ny] = away(x, y, far, threats);
  else if (w && !w.rest) {
    const to = wayTo(x, y, w.x, w.y, now) || [w.x, w.y];
    [nx, ny] = walk(x, y, to[0], to[1], far);
    if (Math.hypot(nx - x, ny - y) < far * 0.2) wander.delete(id); // (stuck: another spot next time)
  }
  /* no jumps: he gets out of the way only by moving, as a player does (the owner's, Nov 17 20:37Z: "WHEN HE TRIES TO DODGE,
     IT ISNT SOME ANIMATION THAT IS DONE BY MATH, HE SIMPLLY TRIES MOVING OUT THE WAY LIKE A PLAYER DOES") */
  out.push({
    t: "move",
    id,
    x: +(nx / W).toFixed(5),
    y: +(ny / H).toFixed(5),
    j: 0,
    z: Math.round(heightAt(nx, ny)),
    b: Math.round(heightAt(nx, ny)),
    w: "",
    ax: +((nx - x || 1) / W).toFixed(4),
    ay: +((ny - y) / H).toFixed(4),
  });
}
function shoot(s, id, now, m, w, ax, ay, out) {
  if (!w) return; // (a melee weapon that broke: nothing in that slot)
  if (now - ((m.u || {})[w] || 0) < l4Cool(s, id, w)) return;
  out.push({
    t: "use",
    id,
    what: w,
    face: ax < 0 ? -1 : 1,
    ax: ax / W,
    ay: ay / H,
  });
}
/* the best step away: farthest from the zombies (the nearest counts most), with room ahead to keep going */
function away(x, y, far, near) {
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
      [nx, ny] = walk(x, y, x + ux * far, y + uy * far, far);
    if (Math.hypot(nx - x, ny - y) < far * 0.3) continue; // (a wall that way)
    const [fx, fy] = walk(nx, ny, nx + ux * LOOK, ny + uy * LOOK, LOOK),
      room = Math.hypot(fx - nx, fy - ny),
      v = score(nx, ny, room) + Math.min(500, score(fx, fy, 0)) * 0.35;
    if (v > top) {
      top = v;
      best = [nx, ny];
    }
  }
  return best;
}
