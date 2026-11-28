/* Justin's moves on the board (boardjustin.js): his walk, his hammer's swing and the number on a flash, on `s.justin`
   ({ k, x0, y0, x1, y1, t, v }, board units). A leaf: it imports nothing. */
export const r3 = (v) => Math.round(v * 1000) / 1000;
/* Justin starts a walk from at to to (board units) at time now, at v a second (left out: the speed he had) */
export const walkTo = (j, at, to, now, v) =>
  Object.assign(j, {
    k: null,
    x0: r3(at.x),
    y0: r3(at.y),
    x1: r3(to.x),
    y1: r3(to.y),
    t: now,
    ...(v === undefined ? {} : { v }),
  });
/* the spot 1.4 duck lengths from duck p toward Justin (at), on the line between them and kept on the board: where he
   dashes to before a hammer swing (rx, ry: a duck's length across and down) */
export const nearSpot = (at, p, rx, ry) => {
  const ux = (at.x - p.x) / rx,
    uy = (at.y - p.y) / ry,
    d = Math.hypot(ux, uy) || 1;
  return {
    x: Math.max(0.03, Math.min(0.97, p.x + (ux / d) * 1.4 * rx)),
    y: Math.max(0, Math.min(1, p.y + (uy / d) * 1.4 * ry)),
  };
};
/* Justin stops where he stands (at, at time now): no walk left to make */
export const stopAt = (j, at, now) => walkTo(j, at, at, now);
/* the hammer's swing, toward aim, the hit ducks with it */
export const hammerFx = (fx, aim, hit) =>
  fx({
    kind: "use",
    what: "hammer",
    who: [],
    face: aim[0] < 0 ? -1 : 1,
    ax: +aim[0].toFixed(3),
    ay: +aim[1].toFixed(3),
    ...(hit.length ? { hit } : {}),
  });
/* what makes a numbered flash (by: who it's by, Justin's id) in the room's list of the last twenty */
export const fxOf = (s, now, by) => (o) => {
  s.fxN = (s.fxN || 0) + 1;
  s.fx = [...(s.fx || []).slice(-19), { n: s.fxN, by, t: now, ...o }];
};
