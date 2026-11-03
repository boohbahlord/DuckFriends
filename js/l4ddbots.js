/* ---------- Left 4 Dead Ducks' computers (TEST rooms) ----------
   A computer goes to a downed teammate and holds E by it; otherwise it shoots the nearest zombie it can see (the pistol
   while it has bullets, then the bow, the knife up close), backs away from one that's too close, throws a grenade into
   a crowd now and then, and keeps near the middle of the great room. A ghost or a downed computer does nothing. */
import { W, H, heightAt, standable, STEP } from "./hangout/layout.js";
import {
  L4,
  ARMS,
  WALK,
  zombiesOf,
  startSpot,
  playable,
  wayTo,
  clearShot,
  l4Up,
} from "./l4ddrules.js";

const SEE = 460; // world px: how far a computer looks for a zombie to shoot
const TOO_CLOSE = 95;
const STEP_MS = 200; // (the TEST room's heartbeat: how far it walks each time)

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
    far = WALK * (STEP_MS / 1000),
    m = (h.l4a || {})[id] || {},
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
    const [nx, ny] =
      Math.hypot(home.x - x, home.y - y) > 140
        ? walk(
            x,
            y,
            ...(wayTo(x, y, home.x, home.y, now) || [home.x, home.y]),
            far,
          )
        : [x, y];
    if (nx !== x || ny !== y) send(nx, ny, "handgun", nx - x || 1, ny - y);
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
  const w =
    bd < 75
      ? "knife"
      : m.m > 0 && !m.rl
        ? "handgun"
        : m.b > 0
          ? "bow"
          : "knife";
  /* too close: back away while it shoots */
  let [nx, ny] = [x, y];
  if (bd < TOO_CLOSE && w !== "knife")
    [nx, ny] = walk(x, y, x - ax, y - ay, far);
  send(nx, ny, w, ax, ay);
  if (now - (u[w] || 0) >= ARMS[w].cool)
    out.push({
      t: "use",
      id,
      what: w,
      face: ax < 0 ? -1 : 1,
      ax: ax / W,
      ay: ay / H,
    });
}
