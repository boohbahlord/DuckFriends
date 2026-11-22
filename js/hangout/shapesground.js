/* ---------- Duck Cabin's props, drawn: the ground and the decor ----------
   Moved out of shapes.js to keep that file small (a pure move; the owner's, Nov 22). */
import * as A from "./art.js";
import * as L from "./layout.js";
import { downpourGround, dpGroundColor } from "./dpground.js";

import { C, calm, n1, part, still } from "./shapesbase.js";

import { treeBox } from "./shapeswalls.js";

/* ---------- the ground ---------- */
const LO = -L.SLOPE.low; // how much lower the downhill draws (240)
const LOWY = L.SLOPE.y1 + LO; // where the downhill starts on the screen
const X0 = -260,
  X1 = L.W + 260,
  Y0 = -460,
  Y1 = L.H + LO + 260;
const piece = (svg, x, y, w, h) => ({ svg, x, y, w, h });
/* a patch of forest floor that fades into the grass toward `to` ('n' | 's' | 'e' | 'w': the open side) */
let fid = 0;
function forestFloor(w, h, to) {
  const id = "hgff" + ++fid,
    [x1, y1, x2, y2] = {
      s: [0, 0, 0, 1],
      n: [0, 1, 0, 0],
      e: [0, 0, 1, 0],
      w: [1, 0, 0, 0],
    }[to];
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible"><defs><linearGradient id="${id}g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}m"><rect width="${w}" height="${h}" fill="url(#${id}g)"/></mask></defs><g mask="url(#${id}m)">${A.ground({ w, h, kind: "forest", seed: fid })}<rect width="${w}" height="${h}" fill="#050d09" opacity=".35"/></g></svg>`;
}
/* a dark stone footing under the cabin's south wall, where the ground falls away from it */
function footing(w, h) {
  let s = `<rect width="${w}" height="${h}" fill="#3a3c44" stroke="#1c1c28" stroke-width="3"/>`;
  for (let y = 3, r = 0; y < h - 4; y += 19, r++)
    for (let x = 3 - (r % 2) * 22, i = 0; x < w - 4; x += 46, i++)
      s += `<rect x="${Math.max(3, x)}" y="${y}" width="${Math.min(42, w - 3 - Math.max(3, x))}" height="${Math.min(16, h - 3 - y)}" rx="4" fill="${["#6c717b", "#7e838d", "#75706a"][(i + r) % 3]}"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${s}<rect width="${w}" height="${h}" fill="#000" opacity=".25"/></svg>`;
}
function groundPieces() {
  const G = [];
  /* the three grounds: the highground's grass, the darker slope, the downhill */
  G.push(
    piece(
      A.ground({ w: X1 - X0, h: L.SLOPE.y0 - Y0, kind: "grass", seed: 2 }),
      X0,
      Y0,
      X1 - X0,
      L.SLOPE.y0 - Y0,
    ),
  );
  G.push(
    piece(
      A.ground({ w: X1 - X0, h: LOWY - L.SLOPE.y0, kind: "slope", seed: 3 }),
      X0,
      L.SLOPE.y0,
      X1 - X0,
      LOWY - L.SLOPE.y0,
    ),
  );
  G.push(
    piece(
      A.ground({ w: X1 - X0, h: Y1 - LOWY, kind: "downhill", seed: 4 }),
      X0,
      LOWY,
      X1 - X0,
      Y1 - LOWY,
    ),
  );
  /* the forest floor, thick at the edges */
  const B = 360;
  G.push(piece(forestFloor(X1 - X0, B - Y0, "s"), X0, Y0, X1 - X0, B - Y0));
  G.push(
    piece(
      forestFloor(X1 - X0, Y1 - (L.H + LO - B), "n"),
      X0,
      L.H + LO - B,
      X1 - X0,
      Y1 - (L.H + LO - B),
    ),
  );
  G.push(piece(forestFloor(B - X0, Y1 - Y0, "e"), X0, Y0, B - X0, Y1 - Y0));
  G.push(
    piece(
      forestFloor(X1 - (L.W - B), Y1 - Y0, "w"),
      L.W - B,
      Y0,
      X1 - (L.W - B),
      Y1 - Y0,
    ),
  );
  /* the dirt path from the forest to the front door */
  const P = L.PATH,
    pw = P.y1 - P.y0,
    ph = pw + 80,
    py = (P.y0 + P.y1) / 2;
  G.push(
    piece(
      A.dirtPath({
        w: P.x1 + 100,
        h: ph,
        pts: [
          [0, ph / 2],
          [P.x1 + 100 - 75 - 40, ph / 2],
        ],
        width: pw,
      }),
      -100,
      py - ph / 2,
      P.x1 + 100,
      ph,
    ),
  );
  /* the soccer field's lines: its east goal line through the net's mouth, centered on the net */
  const goal = L.PROPS.find((p) => p.kind === "goal"),
    fx1 = goal ? goal.x + 10 + 30 : L.FIELD.x1,
    fcy = goal ? goal.y + 10 + 250 : (L.FIELD.y0 + L.FIELD.y1) / 2,
    fh = 1300,
    fw = fx1 - L.FIELD.x0;
  G.push(
    piece(A.soccerField({ w: fw, h: fh }), L.FIELD.x0, fcy - fh / 2, fw, fh),
  );
  /* the pool: pavers round it, then its coping, water and lights, the lane rope */
  const PL = L.POOL,
    c = 30;
  G.push(
    piece(
      A.ground({
        w: PL.x1 - PL.x0 + 200,
        h: PL.y1 - PL.y0 + 160,
        kind: "pavers",
        seed: 5,
      }),
      PL.x0 - 100,
      PL.y0 - 80 + LO,
      PL.x1 - PL.x0 + 200,
      PL.y1 - PL.y0 + 160,
    ),
  );
  const pw0 = PL.x1 - PL.x0 + 2 * c,
    pd0 = PL.y1 - PL.y0 + 2 * c;
  G.push(
    piece(
      still(
        calm(
          A.pool({ w: pw0, d: pd0, depth: L.SLOPE.low - PL.h, c, lights: 5 })
            .back,
        ),
      ),
      PL.x0 - c,
      PL.y0 - c + LO,
      pw0,
      pd0,
    ),
  );
  const ry0 = PL.y0 + LO + (L.SLOPE.low - PL.h),
    ry1 = PL.y1 + LO;
  G.push(
    piece(
      A.laneRope({ w: 22, h: ry1 - ry0 }),
      PL.rope - 11,
      ry0,
      22,
      ry1 - ry0,
    ),
  );
  /* the cabin: its stone footing on the slope, the floors (wood; the kitchen's tiles, the bathroom's), the rugs */
  const fz = -L.terrainAt(C.y1);
  G.push(
    piece(
      footing(L.DECK.x0 - C.x0 + 24, fz + 6),
      C.x0 - 12,
      C.y1 - 2,
      L.DECK.x0 - C.x0 + 24,
      fz + 6,
    ),
  );
  G.push(
    piece(
      A.ground({ w: C.x1 - C.x0, h: C.y1 - C.y0, kind: "wood", seed: 6 }),
      C.x0,
      C.y0,
      C.x1 - C.x0,
      C.y1 - C.y0,
    ),
  );
  G.push(
    piece(
      A.ground({ w: C.x1 - 3500, h: 1100 - C.y0, kind: "tile" }),
      3500,
      C.y0,
      C.x1 - 3500,
      1100 - C.y0,
    ),
  );
  G.push(
    piece(A.ground({ w: 400, h: 350, kind: "bath" }), 3500, 1100, 400, 350),
  );
  const RUG = {
    rug1: { kind: "oval" },
    rug2: { kind: "rect" },
    rug3: {
      kind: "rect",
      colors: ["#3e6d8c", "#e0b04a", "#a8402e", "#1c1c28"],
    },
  };
  for (const p of L.PROPS.filter((q) => q.kind === "rug"))
    G.push(
      piece(
        A.rug({ w: p.w, h: p.d, ...(RUG[p.id] || {}) }),
        p.x,
        p.y,
        p.w,
        p.d,
      ),
    );
  /* the deck's boards (and its west railing), the stairs' landing, treads and risers */
  const D = L.DECK,
    S = L.STAIRS,
    rail = 40,
    drop = -L.terrainAt(D.y1);
  G.push(
    piece(
      A.deck({
        w: D.x1 - D.x0,
        d: D.y1 - D.y0,
        rail,
        drop,
        gapE: [0, D.y1 - D.y0],
        lights: [],
      }).back,
      D.x0,
      D.y0 - rail,
      D.x1 - D.x0,
      D.y1 - D.y0 + rail + drop,
    ),
  );
  G.push(
    piece(
      A.deckStairs({
        w: S.x1 - S.x0,
        d: S.y1 - S.y0,
        rise: LO,
        steps: S.n,
        landing: S.land - S.y0,
        rail,
      }).back,
      S.x0,
      S.y0 - rail,
      S.x1 - S.x0,
      S.y1 - S.y0 + rail + LO,
    ),
  );
  /* shadows: the trees', the jeep's */
  for (const p of L.PROPS.filter((q) => q.kind === "tree")) {
    const b = treeBox(p),
      rx = b.w * 0.38,
      ry = b.w * 0.14;
    G.push({
      raw: `<ellipse cx="${n1(b.cx)}" cy="${n1(b.sy - 4)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="#000" opacity=".33"/>`,
      x: b.cx - rx,
      y: b.sy - 4 - ry,
      w: 2 * rx,
      h: 2 * ry,
    });
  }
  const jp = L.PROPS.find((p) => p.kind === "jeep");
  if (jp)
    G.push(
      piece(
        A.jeep({ facing: "e" }).back,
        jp.x + L.JEEP.left,
        jp.y + jp.d - jp.z - 214 * L.JEEP.s,
        292 * L.JEEP.s,
        214 * L.JEEP.s,
      ),
    );
  /* the forest past the ring of trees, behind everything: north, west and east, in small pieces (a tile paints the few
     it touches) */
  for (let x = X0, k = 0; x < X1; x += 256, k++)
    G.push(
      piece(
        A.forest({ w: 256, h: 420, top: 300, seed: 100 + k, floor: false }),
        x,
        -60 - 314,
        256,
        420,
      ),
    );
  for (let y = Y0 + 140, k = 0; y < Y1; y += 256, k++)
    for (const x of [-235, L.W - 25])
      G.push(
        piece(
          A.forest({
            w: 260,
            h: 556,
            top: 300,
            seed: 200 + k + x,
            density: 0.9,
            floor: false,
          }),
          x,
          y - 300,
          260,
          556,
        ),
      );
  return G;
}
let ground = null,
  dpGround = null;
export const GROUND = () =>
  L.layoutVariant() === "l4gs"
    ? dpGround || (dpGround = downpourGround()) // (dpground.js)
    : ground || (ground = groundPieces());
/* the ground's plain colors (before its tiles are painted): by screen-world y */
export const groundColor = (y) =>
  L.layoutVariant() === "l4gs"
    ? dpGroundColor(y)
    : y < L.SLOPE.y0
      ? "#24503d"
      : y < LOWY
        ? "#1a3a2e"
        : "#1f4636";

/* ---------- decor: what no prop owns ---------- */
function decor() {
  const out = [];
  /* the forest past the ring of trees in the south: in front of everything (nobody gets near enough to be behind it) */
  for (let x = X0, k = 0; x < X1; x += 512, k++)
    out.push(
      part(
        () =>
          A.forest({ w: 512, h: 420, top: 300, seed: 300 + k, floor: false }),
        x,
        L.H + LO + 120 - 314,
        512,
        420,
        99999,
        { img: true },
      ),
    );
  /* the deck: its railing on the south side, the lattice under it down to the slope */
  const D = L.DECK,
    rail = 40,
    drop = -L.terrainAt(D.y1),
    dk = A.deck({
      w: D.x1 - D.x0,
      d: D.y1 - D.y0,
      rail,
      drop,
      gapE: [0, D.y1 - D.y0],
      lights: [],
      bulbs: false,
    });
  out.push(
    part(
      dk.front,
      D.x0,
      D.y0 - rail,
      D.x1 - D.x0,
      D.y1 - D.y0 + rail + drop,
      D.y1,
      { img: true, part: "front", only: "out" },
    ),
  );
  /* its string lights, apart from the picture: they twinkle, and now and then stutter (flicker.js) */
  out.push(
    part(
      A.deckBulbs({ w: D.x1 - D.x0, d: D.y1 - D.y0, rail, drop }),
      D.x0,
      D.y0 - rail,
      D.x1 - D.x0,
      D.y1 - D.y0 + rail + drop,
      D.y1 + 1,
      { only: "out", cls: "hg-porch" },
    ),
  );
  /* the chimney's smoke over the cabin (outside) */
  out.push(
    part(
      `<svg class="hg" viewBox="0 0 80 60" width="80" height="60" overflow="visible" aria-hidden="true"><g class="hg-smoke" style="animation-delay:-1s"><circle cx="46" cy="44" r="20" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-3.4s"><circle cx="36" cy="44" r="16" fill="#c9cfdb"/></g><g class="hg-smoke" style="animation-delay:-5.6s"><circle cx="42" cy="44" r="18" fill="#c9cfdb"/></g></svg>`,
      2300 - 40,
      C.y0 + A.CHIMNEY.d0 - A.chimneyTop(C.wall) - 56,
      80,
      60,
      C.y1 + 16,
      { only: "out" },
    ),
  );
  /* the pool's light moving on the water (the whole picture fades in and out: cheap) */
  const PL = L.POOL,
    wy = PL.y0 + LO + (L.SLOPE.low - PL.h),
    ww = PL.x1 - PL.x0,
    wh = PL.y1 + LO - wy;
  for (const [k, sz, dl] of [
    ["a", 140, 0],
    ["b", 180, 1.8],
  ]) {
    const pat =
      k === "a"
        ? `<path d="M0 20Q35 4 70 20T140 20M0 55Q35 40 70 55T140 55M20 0Q30 35 15 70M95 0Q110 35 90 70" stroke="#c8fbff" stroke-width="2.2" fill="none" opacity=".35"/>`
        : `<path d="M0 30Q45 10 90 30T180 30M0 75Q45 55 90 75T180 75M50 0Q65 45 45 90" stroke="#e2fdff" stroke-width="1.8" fill="none" opacity=".3"/>`;
    out.push(
      part(
        `<svg class="hg" viewBox="0 0 ${ww} ${wh}" width="${ww}" height="${wh}" aria-hidden="true"><defs><pattern id="hgpw${k}" width="${sz}" height="${sz / 2}" patternUnits="userSpaceOnUse"${k === "b" ? ' patternTransform="translate(40 20)"' : ""}>${pat}</pattern></defs><rect width="${ww}" height="${wh}" fill="url(#hgpw${k})"/></svg>`,
        PL.x0,
        wy,
        ww,
        wh,
        0,
        {
          layer: "floor",
          cls: "hang-shimmer",
          style: `animation-delay:-${dl}s`,
        },
      ),
    );
  }
  return out;
}
let deco = null;
export const DECOR = () =>
  L.layoutVariant() === "l4gs" ? [] : deco || (deco = decor()); // (Downpour: none yet)
