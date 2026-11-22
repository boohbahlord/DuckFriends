/* ---------- explosions: one module (the cornerstone, Nov 20: one module per mechanic) ----------
   Every blast goes through here: the board's and Hangout's (boardfire.js), and the zombie maps' (l4ddrules.js), with
   their gunmen (gunmenrules.js). Who is in one is measured one way (reach): an ellipse round where it went off, and only
   where its world lets it reach (ok: Hangout's side of the cabin's walls and its height, the maps' nothing solid
   between). What it does to each one stays that body's own: each kind's damage and push are the caller's (hit). */

/* the measure of a blast at (x, y): rx, ry, how far one unit is each way; r, its reach in those units; ok(x, y, z, side),
   whether it gets there at all. near(x, y, z, side, big) gives { d, dx, dy } (in units) for one in it, else null; big:
   a body bigger than one, its hitbox (a Seriat NPC's, a duck over 100%) */
export function reach(B) {
  return (px, py, pz, side = 0, big = 1) => {
    const dx = (px - B.x) / B.rx,
      dy = (py - B.y) / B.ry,
      d = Math.max(0, Math.hypot(dx, dy) - (big - 1) / 2);
    return d < B.r && (!B.ok || B.ok(px, py, pz, side)) ? { d, dx, dy } : null; // (the near test first: ok can cost)
  };
}

/* a blast over every kind of body in its world, in turn: [list (or a fn giving it, read when its turn comes), where(b) (its [x, y, z, side, big], or null when it
   can't be hit), hit(b, n) (its own effect; true when it counts as a hit)], or a kind that finds its own (fn(near)).
   True when any hit counted */
export function blast(near, kinds) {
  let any = false;
  for (const k of kinds) {
    if (typeof k === "function") {
      any = k(near) === true || any;
      continue;
    }
    const [list, where, hit] = k;
    for (const b of typeof list === "function" ? list() : list) {
      const at = where(b),
        n = at && near(...at);
      if (n && hit(b, n) === true) any = true;
    }
  }
  return any;
}
