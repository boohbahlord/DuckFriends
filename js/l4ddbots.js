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
  BUTLER,
  BOX,
  boxNow,
  ARMS,
  gunPrice,
  isHelper,
} from "./l4ddrules.js";
import { walkOf } from "./rules.js";

const SEE = 460; // world px: how far a computer looks for a zombie to shoot
const TOO_CLOSE = 95;
const STEP_MS = 200; // (the TEST room's heartbeat: how far it walks each time)
const WISH = ["hp", "sp", "rl", "acc", "as"]; // what a computer buys first
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
  /* a teammate down: go to it and hold E (the hold goes on by itself until the revive is done) */
  const down = s.seat
    .filter((t) => t !== id && ((h.l4p || {})[t] || {}).dn && s.pos[t])
    .map((t) => ({ t, x: s.pos[t].x * W, y: s.pos[t].y * H }))
    .sort(
      (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
    )[0];
  if (down && Math.hypot(down.x - x, down.y - y) < 900) {
    const d = Math.hypot(down.x - x, down.y - y),
      rv = ((h.l4p || {})[down.t] || {}).rv;
    if (d < L4.REACH * 0.9) {
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
  const sp = sl[3];
  if (
    ["jaime", "jaimebomb", "fireball", "zebra", "adrenaline"].includes(sp) &&
    m.am[sp] &&
    m.am[sp][0] > 0 &&
    bd < 400 &&
    now - (u[sp] || 0) > 6000
  ) {
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
  const loaded = [sl[1], sl[2]].filter(
      (w) => w && m.am[w] && m.am[w][0] > 0 && m.rw !== w,
    ),
    hp = ((h.l4p || {})[id] || {}).hp,
    w =
      sl[3] === "medkit" && hp <= 1 && hp < maxHp(s, id)
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
      const left = (w) => (m.am[w] ? m.am[w][0] + m.am[w][1] : 0);
      hand = left(m.sl[1]) <= left(m.sl[2]) ? m.sl[1] : m.sl[2];
    } // (it gives up the emptier one)
    to = BOX;
    act = { t: "hang", k: "l4", do: "box", hand, id };
  } else {
    const up = upOf(s, id),
      want = WISH.map((k) => SHOP.find((it) => it.id === k)).find(
        (it) =>
          (up[it.id] || 0) < it.most && pts >= priceOf(it.id, up[it.id] || 0),
      );
    if (want) {
      to = BUTLER;
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
   zombie is on it, ends the turn between rounds, buys ammo with his points (B), and shops like the others when the
   room is clear. He walks exactly as fast as a duck would: by the time since his last step, at the Walking speed, the
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
  "ak",
  "smg",
  "sniper",
  "revolver",
  "shotgun",
  "handgun",
  "glauncher",
  "bow",
  "dagger",
];
const leftIn = (m, w) => (m.am[w] ? m.am[w][0] + m.am[w][1] : 0);

function justinBot(s, id, now, out) {
  const p = s.pos[id],
    h = s.hang;
  const wait = h.l4.wait;
  if (wait && !wait.v[id]) {
    const k = `${id} ${h.l4.r}`;
    if (!readyAt.has(k)) readyAt.set(k, now + 1000 + Math.random() * 1500);
    if (now >= readyAt.get(k)) {
      readyAt.delete(k);
      out.push({ t: "hang", k: "l4", do: "endturn", on: true, id });
    }
  }
  const x = p.x * W,
    y = p.y * H,
    dt = Math.min(400, Math.max(0, now - (lastAt.get(id) || now - STEP_MS)));
  lastAt.set(id, now);
  const fast = ((h.l4ad || {})[id] || 0) > now,
    walkPx =
      (fast ? WALK / (0.6 * 1.05) : WALK * (upOf(s, id).sp ? 1.1 : 1)) *
      walkOf(s) *
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
    return go ? walkPx * 1.75 : walkPx; // (world.js SPRINT)
  };
  const send = (nx, ny, w, ax, ay) =>
    out.push({
      t: "move",
      id,
      x: +(nx / W).toFixed(5),
      y: +(ny / H).toFixed(5),
      j: 0,
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
  /* what he'd shoot: the nearest zombie he can see */
  const seen = near.find(
    (n) => n.d < SEE * 1.3 && clearShot(x, y, n.z.x, n.z.y, heightAt(x, y)),
  );
  /* his gun: the best one with something in it (not reloading); the chain gun when a zombie is close or they crowd */
  const loaded = (w) => w && m.am[w] && m.am[w][0] > 0 && m.rw !== w;
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
  {
    const buyable = [sl[1], sl[2]].find(
      (w) =>
        w &&
        !leftIn(m, w) &&
        gunPrice(s, id, w) &&
        ptsOf(s, id) >= gunPrice(s, id, w),
    );
    if (buyable) {
      out.push({ t: "hang", k: "l4", do: "ammo", what: buyable, id });
      if (!gun) {
        send(x, y, buyable, 1, 0);
        return;
      }
    }
  } // (an empty gun of the Butler's: B fills it, with his points)
  /* a downed teammate with no zombie on it (nor on him): go and hold E by it */
  const down = s.seat
    .filter((t) => t !== id && ((h.l4p || {})[t] || {}).dn && s.pos[t])
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
  const want = d0 < CLOSE,
    far = run(want);
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
function shoot(s, id, now, m, w, ax, ay, out) {
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
