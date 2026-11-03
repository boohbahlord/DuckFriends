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
} from "./l4ddrules.js";
import { walkOf } from "./rules.js";

const SEE = 460; // world px: how far a computer looks for a zombie to shoot
const TOO_CLOSE = 95;
const STEP_MS = 200; // (the TEST room's heartbeat: how far it walks each time)
const WISH = ["hp", "sp", "rl", "acc", "as"]; // what a computer buys first
const AT = 90; // world px: near enough to the Butler or the fireplace
const spinAt = new Map(); // computer → when it last spun the fireplace (one spin in a while, not every time it can)

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
     jump stays as it is) */
  const sp = sl[3];
  if (
    ["jaime", "fireball", "zebra", "adrenaline"].includes(sp) &&
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
  const b = boxNow(s, now),
    pts = ptsOf(s, id),
    mine = b && b.by === id;
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
