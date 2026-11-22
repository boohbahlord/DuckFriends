/* ---------- the board: each mode's board HTML, the story's measure, the rows and where a duck stands ----------
   Moved out of game.js to keep that file small (a pure move). It imports back from game.js, which imports it. */
import {
  R,
  S,
  cam,
  caseKey,
  geo,
  hidden,
  knocked,
  late,
  lordHTML,
  matchKey,
  me,
  portrait,
  scT,
  scWalk,
  scY,
  setGeo,
  setScT,
  setScY,
  turned,
  world,
  writerFont,
} from "./game.js";
import { esc, $ } from "./ui.js";
import {
  COLS,
  SHORT,
  isWyr,
  isDdr,
  DDR_SIDES,
  isBb,
  isLaw,
  startX,
  isSc,
  isHang,
} from "./rules.js";
import { ATT_PHASES } from "./lawrules.js";
import { BOARD_HTML as HANG_HTML } from "./hangout/world.js";
import { boardHTML as storyHTML } from "./story.js";
import { lawColsHTML, lawTopHTML, LAW_BANNER } from "./court.js";
import {
  matchColsHTML,
  matchTopHTML,
  bracketHTML,
  bracketTopHTML,
} from "./brackets.js";
import { watching } from "./spectate.js";
import { sbOnBoard, sbBoardK } from "./sandboxrules.js";
import { fontHTML } from "./name.js";
import { now as clockNow } from "./clock.js";
import { isQuack, cardOf, gridOf } from "./quackrules.js";
import {
  quackBoardHTML,
  quackTopHTML,
  secretCardHTML,
  revealCardsHTML,
} from "./quack.js";
import { isDn, DN_BW } from "./duncerules.js";
import { dnColsHTML, dnTopHTML, DN_PODIUM as PODIUM_HTML } from "./dunce.js";
import { isMgj } from "./mgjrules.js";
import { mgjBoardHTML } from "./mgj.js";
import { isVd } from "./vddrules.js";
import { vdBoardHTML } from "./vdd.js";
import { isTv, TV_ROWS_END } from "./triviarules.js";
import { tvBoardHTML } from "./trivia.js";

/* ---------- the board ---------- */
/* Would You Rather: two tiles, each choice in its writer's font, with an OR strip between them */
function wyrColsHTML(s) {
  const q = ["answer", "discuss"].includes(s.phase) ? s.qs[s.qi] : null;
  const tile = (c, t) =>
    `<div class="col wyr-${c ? "b" : "a"}" data-c="${c}"><span class="wyr-txt">${q ? fontHTML(writerFont(s), esc(t)) : c ? "B" : "A"}</span></div>`;
  return `<div class="cols wyr-cols">${tile(0, q && q.a)}<div class="wyr-or"><span>OR</span></div>${tile(1, q && q.b)}</div>`;
}
/* Does Duck Relate?: the same two tiles, always Duck Does Relate (A) and Duck Doesn't Relate (B); the statement is on the cloud */
const ddrColsHTML = () =>
  `<div class="cols wyr-cols ddr-cols">${DDR_SIDES.map((t, c) => `<div class="col wyr-${c ? "b" : "a"}" data-c="${c}"><span class="wyr-txt">${esc(t)}</span></div>`).join('<div class="wyr-or"><span>OR</span></div>')}</div>`;
/* Bicker Brackets: a match's two seeds (no board drawn), or the bracket that ducks walk over */
const bbBoardHTML = (s) =>
  s.phase === "bracket"
    ? `<div class="board bb-board bb-bracket"><div class="cols bb-cols bb-none"></div><div class="bb-diagram">${bracketHTML(s)}</div>${bracketTopHTML(s)}<div class="ducks"></div><div class="fxl"></div></div>`
    : `<div class="board bb-board">${matchColsHTML(s)}<div class="ducks"></div><div class="fxl"></div>${matchTopHTML(s, knocked.has(matchKey(s)))}</div>`;
/* Lawyering: the offense's and the defense's sides, the attorneys' circle, both attorneys on the cloud */
const lawBoardHTML = (
  s,
) => `<div class="board law-board">${lawColsHTML(s)}<div class="ducks"></div><div class="fxl"></div>${LAW_BANNER}
  ${["answer", "discuss", ...ATT_PHASES].includes(s.phase) ? lawTopHTML(s, knocked.has(caseKey(s))) : ""}${ATT_PHASES.includes(s.phase) ? '<div class="law-vote-wrap"></div>' : ""}</div>`;
/* Duncelation: Dunce and Not a Dunce, the defender's circle (and in the dunce's moment the LOSER podium), the defender on the cloud */
const dnBoardHTML = (
  s,
) => `<div class="board law-board dn-board">${dnColsHTML(s)}<div class="law-ring" aria-hidden="true"></div><div class="ducks">${s.phase === "dunced" ? PODIUM_HTML : ""}</div><div class="fxl"></div>
  ${["answer", "discuss", "dunced"].includes(s.phase) ? dnTopHTML(s, s.phase !== "dunced" || clockNow() - s.at >= DN_BW) : ""}</div>`;
/* Who is the Quack?: the ducks' tiles (or the two sides), the cloud, my Secret Card, and at the end the Quack's card */
export const myCard = (s) =>
  s.wq && s.wq.ids.includes(R.me)
    ? s.hidden
      ? cardOf(s, R.me)
      : R.secretCard
        ? R.secretCard(s)
        : null
    : undefined;
const quackBoard = (
  s,
) => `<div class="board wq-board${s.phase === "reveal" && s.wq.lastOut ? " late" : ""}">${quackBoardHTML(s, R.me)}<div class="ducks"></div><div class="fxl"></div>
  ${quackTopHTML(s, s.phase === "reveal" && s.wq.result ? revealCardsHTML(s) : myCard(s) !== undefined ? secretCardHTML(myCard(s)) : "")}</div>`;
export const boardHTML = (s) =>
  isHang(s)
    ? HANG_HTML
    : isQuack(s)
      ? quackBoard(s)
      : isSc(s)
        ? storyHTML(s, R.me)
        : isBb(s)
          ? bbBoardHTML(s)
          : isLaw(s)
            ? lawBoardHTML(s)
            : isDn(s)
              ? dnBoardHTML(s)
              : isMgj(s)
                ? mgjBoardHTML(s)
                : sbOnBoard(s)
                  ? SB_BOARD(s)
                  : isVd(s)
                    ? vdBoardHTML(s, R.me)
                    : isTv(s)
                      ? tvBoardHTML(s, R.me)
                      : `<div class="board${!isWyr(s) && !isDdr(s) && s.options.aodColors === "gr" ? " aod-gr" : ""}">
  ${isWyr(s) ? wyrColsHTML(s) : isDdr(s) ? ddrColsHTML() : `<div class="cols">${COLS.map((c, i) => `<div class="col c${i + 1}" data-c="${i}"><span class="col-name">${esc(c)}<span class="cb-mark">${SHORT[i]}</span></span></div>`).join("")}</div>`}
  <div class="ducks"></div><div class="fxl"></div>
  ${s.phase === "answer" || s.phase === "discuss" ? `<div class="topover">${lordHTML(s)}<p class="question">${fontHTML(writerFont(s), esc(isWyr(s) ? "Would you rather" : s.qs[s.qi].text))}</p></div>` : ""}</div>`; // (Would You Rather: the choices are on the tiles)

/* Sandbox on the board: the plain field, Mad God Justin's arena with nobody in it (the room's map shows through as on
   every board) */
const SB_BOARD = (s) =>
  `<div class="board sb-board${+s.options.sbTint === 1 ? " sb-tint" : ""}"><div class="cols mgj-cols"><div class="col mgj-field" data-c="0"></div></div><div class="ducks"></div><div class="fxl"></div></div>`;
/* the board's measurements, taken again when the window or the docks change */
export function measure() {
  const board = S && $(".board", S);
  if (!board) {
    setGeo(null);
    return;
  }
  if (isSc(R.state)) return measureStory(board);
  if (isHang(R.state)) {
    setGeo(world ? world.measure() : null);
    return;
  } // (the world's camera)
  const cols = $(".cols", board),
    r = board.getBoundingClientRect(),
    H = cols.offsetHeight,
    top0 = cols.offsetTop;
  const size = Math.max(
    34,
    Math.min(
      100,
      (turned()
        ? H / 7
        : isVd(R.state) && portrait()
          ? board.offsetWidth / 4.4
          : board.offsetWidth / 7) * 0.62,
    ),
  );
  const label = board.querySelector(".col-name"),
    labelH = turned() ? 0 : label ? label.offsetHeight + 12 : 30;
  setGeo({ W: r.width, H, top0, size, labelH, left: r.left, top: r.top });
  /* Who is the Quack?'s tiles: the grid sits where the ducks' feet can reach, so a duck is on the tile it looks to be on */
  const tiles = $(".wq-tiles", board),
    sides = $(".wq-sides", board),
    over = $(".wq-top", board);
  const side =
    !turned() &&
    over &&
    matchMedia("(orientation: landscape) and (max-height: 520px)").matches; // (a phone on its side: the cloud stands to the left, and the tiles or the two sides take the rest)
  if (sides)
    sides.style.marginLeft = side
      ? `${over.offsetLeft + over.offsetWidth + 8}px`
      : "";
  if (sides && side) {
    geo.size = Math.max(30, Math.min(size, H / 5));
    geo.qp = {
      t: geo.size * 1.08,
      b: labelH,
      l: over.offsetLeft + over.offsetWidth + 8,
      r: 0,
    };
  }
  if (tiles) {
    const below = over ? over.offsetTop + over.offsetHeight + 6 - top0 : 0; // (on a computer, the tiles start under the cloud)
    if (side) {
      // (a duck small enough to stand under its tile's name: it stands .62 down a tile, and the name takes the top ~26px)
      const rows = gridOf(R.state.wq.ids.length).R;
      geo.size = Math.max(
        30,
        Math.min(size, ((0.62 * H) / rows - 26) / (1 + 0.825 / rows)),
      );
    }
    const qp = turned()
      ? { t: size * 1.05, b: size * 0.15, l: r.width * 0.06, r: r.width * 0.06 }
      : side
        ? {
            t: geo.size * 1.08,
            b: geo.size * 0.25,
            l: over.offsetLeft + over.offsetWidth + 8,
            r: 0,
          }
        : { t: Math.max(size * 1.08, below), b: size * 0.25, l: 0, r: 0 };
    geo.qp = qp;
    tiles.style.inset = `${qp.t.toFixed(1)}px ${qp.r.toFixed(1)}px ${qp.b.toFixed(1)}px ${qp.l.toFixed(1)}px`;
  }
  /* Trivia: the rows start under the cloud and the question and stop over my answer box. Each row is as tall as its
     words and the ducks on it need (at least a duck), so they can reach past the bottom: then the view slides down them
     as my duck walks, like Story Chain's. Under the last row is the strip where a duck stands on no row */
  const tv = $(".tv-view", board);
  if (tv) {
    const ttop = $(".tv-top", board),
      form = $(".tv-ansform", board),
      t = Math.max(
        top0 + size * 0.4,
        ttop ? ttop.offsetTop + ttop.offsetHeight + 4 : 0,
      ),
      b = Math.max(
        size * 0.2,
        form ? board.offsetHeight - form.offsetTop + 6 : 0,
      );
    tv.style.top = `${t.toFixed(1)}px`;
    tv.style.bottom = `${b.toFixed(1)}px`;
    /* the ducks get smaller (down to 70%) when that lets every row and the strip fit, so on a short screen the view
       doesn't start slid down past (A); past that the view slides as before */
    const list = $(".tv-rows", tv);
    let d = size;
    for (let k = 0; k < 4; k++) {
      board.style.setProperty("--tvd", `${d.toFixed(1)}px`);
      const over = list.offsetHeight - tv.clientHeight;
      if (over <= 0 || d <= size * 0.7) break;
      d = Math.max(
        size * 0.7,
        d - over / ((list.children.length - 1) * 0.7 + 0.9) - 1,
      );
    }
    geo.size = d;
    board.style.setProperty(
      "--tvt",
      `${Math.max(0, t - d * 1.1).toFixed(1)}px`,
    ); // (the ducks show down to the view's edges, and a duck's height over its top)
    board.style.setProperty("--tvb", `${b.toFixed(1)}px`);
    geo.tl = {
      t,
      h: Math.max(1, tv.clientHeight),
      rows: [...list.children].map((e) => ({
        top: e.offsetTop,
        h: Math.max(1, e.offsetHeight),
      })),
      contentH: list.offsetHeight,
    };
  }
  /* Valentine's Duck Date's pick: the board starts under the cloud, so every tile is in sight */
  const vt = $(".vd-tiles", board),
    vtop = $(".vd-top", board);
  if (vt) {
    const below = vtop ? vtop.offsetTop + vtop.offsetHeight + 6 - top0 : 0;
    geo.qp = {
      t: Math.max(size * 1.08, below + geo.size * 0.9),
      b: geo.size * 0.25,
      l: 0,
      r: 0,
    };
  }
}
/* Story Chain: the rows' places in the story (its zones, in order) and the view over it */
function measureStory(board) {
  const view = $(".sc-view", board),
    list = $(".sc-rows", view);
  if (!view || !list) {
    setGeo(null);
    return;
  }
  const r = view.getBoundingClientRect(),
    size = Math.max(30, Math.min(56, r.height / 7));
  setGeo({
    W: r.width,
    H: r.height,
    top0: 0,
    size,
    labelH: 0,
    left: r.left,
    top: r.top,
    sc: true,
    rows: [...list.children].map((e) => ({
      top: e.offsetTop,
      h: Math.max(1, e.offsetHeight),
    })),
    contentH: list.offsetHeight,
  });
}
/* a list slides toward `want` (clamped to 0 .. max) a step each frame and shows more-up / more-down while there is more
   above or below (Story Chain's story and Trivia's rows: the owner's, Nov 22, one copy, A4) */
function slideList(list, want, max, now) {
  const dt = Math.min(0.1, Math.max(0, (now - (scT || now)) / 1000));
  setScT(now);
  want = Math.max(0, Math.min(max, want));
  setScY(
    Math.abs(want - scY) < 0.5
      ? want
      : scY + (want - scY) * Math.min(1, dt * 5),
  );
  const tr = `translateY(${(-scY).toFixed(1)}px)`;
  if (list._tr !== tr) {
    list._tr = tr;
    list.style.transform = tr;
    const v = list.parentNode;
    v.classList.toggle("more-up", scY > 8);
    v.classList.toggle("more-down", scY < max - 8);
  }
}
/* the story slides to keep my duck in view; while a line is typed and my duck stands still, it shows that line */
export function panStory(pos, now) {
  const list = S.querySelector(".sc-rows");
  if (!list || !geo || !geo.rows.length) return;
  const n = geo.rows.length,
    max = Math.max(0, geo.contentH - geo.H),
    last = geo.rows[n - 1];
  let want;
  if (R.state.phase === "write" && now - scWalk > 2500)
    want = last.top + last.h - geo.H + geo.size * 0.9; // (room for the names under the ducks)
  else if (pos) {
    const u = Math.max(0, Math.min(0.9999, pos.y)) * n,
      row = geo.rows[Math.floor(u)];
    want = row.top + row.h * (u % 1) - geo.H * 0.55;
  } else want = scY;
  slideList(list, want, max, now);
}
/* Trivia: the row (or the strip) at a duck's y, and how far down it the duck stands. The rows share y up to
   TV_ROWS_END, each the same part of it, whatever their height; the strip takes the rest */
export function tvSeg(y) {
  const rows = geo.tl.rows,
    n = rows.length - 1;
  y = Math.max(0, Math.min(0.9999, y));
  if (n < 1) return { row: rows[0] || { top: 0, h: geo.tl.h }, f: y, share: 1 };
  if (y < TV_ROWS_END) {
    const u = (y / TV_ROWS_END) * n;
    return { row: rows[Math.floor(u)], f: u % 1, share: TV_ROWS_END / n };
  }
  return {
    row: rows[n],
    f: (y - TV_ROWS_END) / (1 - TV_ROWS_END),
    share: 1 - TV_ROWS_END,
  };
}
const tvFeet = (y) => {
  const { row, f } = tvSeg(y);
  return row.top + row.h * f;
};
/* Trivia's view slides to keep my duck in sight */
export function panRows(pos, now) {
  const list = S.querySelector(".tv-rows");
  if (!list || !geo.tl) return;
  const max = Math.max(0, geo.tl.contentH - geo.tl.h);
  slideList(
    list,
    pos && pos.x >= 0 ? tvFeet(pos.y) - geo.tl.h * 0.55 : scY,
    max,
    now,
  );
}
export const TAG_ROOM = 24; // px under a duck's feet: its name tag
/* where a duck stands: x along the answers (0 strongly disagree … 1 strongly agree), y across */
/* Sandbox's Board size (G's Rules, sandboxrules.js sbBoardK): the plain board k times as big as the screen's, and the
   camera following my duck over it, as on Downpour (the owner's, Nov 19 21:59Z: "if the map is bigger, the camera follows
   the duck as they move around"). geo.big is the whole board measured as if it were on the screen; geo.ox, geo.oy how
   far it's slid; the map behind and the field slide and grow with it */
function bigGeo() {
  const g = geo;
  return g.big || (g.big = { ...g, k: 1, W: g.W * g.k, H: g.H * g.k });
}
export function boardCam() {
  if (!geo || geo.hang || geo.sc || geo.tl || geo.qp) return;
  const s = R.state,
    k = sbOnBoard(s) && s.phase === "sandbox" ? sbBoardK(s) : 1,
    cols = S && $(".board .cols", S),
    layer = S && $(".map-layer", S);
  if (k !== (geo.k || 1)) {
    geo.k = k;
    geo.big = null;
    geo.ox = geo.oy = 0;
    S.classList.toggle("sb-big", k > 1);
  }
  if (k === 1) {
    if (cols && cols.style.transform) cols.style.transform = "";
    if (layer && layer.style.transform) layer.style.transform = "";
    return;
  }
  const g = geo,
    big = bigGeo();
  setGeo(big);
  const w = watching(s, R.me),
    who = (w && w !== R.me && s.pos[w]) || me; // (out of lives: the duck I watch, spectate.js)
  const o =
    who && who.x >= 0 ? place(who) : { left: big.W / 2, top: big.H / 2 };
  setGeo(g);
  const cl = (v, lo) => Math.max(lo, Math.min(0, v));
  g.ox = cl(g.W / 2 - o.left, g.W - big.W);
  g.oy = cl(g.top0 + g.H / 2 - o.top, g.H - big.H);
  const tr = `translate(${g.ox.toFixed(1)}px, ${g.oy.toFixed(1)}px) scale(${k.toFixed(3)})`;
  if (cols && cols._tr !== tr) {
    cols._tr = tr;
    cols.style.transformOrigin = "0 0";
    cols.style.transform = tr;
  }
  if (layer && layer._tr !== tr) {
    layer._tr = tr;
    layer.style.transformOrigin = `${g.left.toFixed(1)}px ${(g.top + g.top0).toFixed(1)}px`;
    layer.style.transform = tr;
  }
}
export function place(p, i, n, free = false) {
  if (geo && geo.k > 1 && !geo.hang) {
    const g = geo;
    setGeo(bigGeo());
    try {
      const o = place(p, i, n, free);
      return { left: o.left + (g.ox || 0), top: o.top + (g.oy || 0) };
    } finally {
      setGeo(g);
    }
  } // (Sandbox's bigger board: on it, slid by the camera)
  if (geo && geo.hang) return world.place(p); // Hangout: through the camera
  if (geo && geo.sc) {
    // Story Chain: y runs down the rows, each row the same share of it
    const k = geo.rows.length;
    if (!k) return { left: geo.W * p.x, top: geo.H / 2 };
    const u = Math.max(0, Math.min(0.9999, p.y)) * k,
      row = geo.rows[Math.floor(u)];
    return { left: geo.W * p.x, top: row.top + row.h * (u % 1) - scY };
  }
  if (cam && R.state.phase === "bracket")
    return {
      left: cam.dx + cam.ox + p.x * cam.W * cam.z,
      top: cam.dy + cam.oy + p.y * cam.H * cam.z,
    }; // on the bracket itself, the same spot on every screen
  if (geo.tl)
    return {
      left: geo.W * Math.max(0, p.x),
      top: geo.tl.t + tvFeet(p.y) - scY,
    }; // Trivia: down the rows, as tall as each one is
  const { W, H, top0, size, labelH, qp } = geo;
  if (p.x < 0 && !free) p = { ...p, x: startX(R.state) }; // (ducks start on the board; this only covers an old state. free: a shot or a blast, which can be off the board)
  if (qp) {
    const w = W - qp.l - qp.r,
      h = H - qp.t - qp.b;
    return turned()
      ? { left: qp.l + p.y * w, top: top0 + qp.t + (1 - p.x) * h }
      : { left: qp.l + p.x * w, top: top0 + qp.t + p.y * h };
  } // on Who is the Quack?'s tiles
  if (turned() && free)
    return {
      left: W * (0.1 + p.y * 0.8),
      top: top0 + H * (1 - p.x) + size * 0.45,
    }; // (a shot or a blast: where it is, on the board or off it)
  if (turned())
    return {
      left: W * (0.1 + p.y * 0.8),
      top: Math.max(
        top0 + size * 1.08,
        Math.min(top0 + H - TAG_ROOM, top0 + H * (1 - p.x) + size * 0.45),
      ),
    }; // (upright on a phone: the whole duck and its name tag stay on the board, never under a bar: the owner's, Nov 4)
  return {
    left: W * p.x,
    top: top0 + size * 1.08 + p.y * (H - size * 1.08 - labelH),
  };
}
export function unplace(px, py) {
  // the inverse, for clicks
  if (geo.k > 1 && !geo.hang) {
    const g = geo;
    setGeo(bigGeo());
    try {
      return unplace(px - (g.ox || 0), py - (g.oy || 0));
    } finally {
      setGeo(g);
    }
  } // (Sandbox's bigger board)
  if (geo.hang) return world.unplace(px, py);
  const { W, H, size, labelH, qp } = geo,
    cl = (v) => Math.max(0, Math.min(1, v));
  if (geo.sc) {
    const y = py + scY,
      rows = geo.rows;
    if (!rows.length) return { x: cl(px / W), y: 0.5 };
    let k = rows.findIndex((r) => y < r.top + r.h);
    if (k < 0) k = rows.length - 1;
    return {
      x: cl(px / W),
      y: cl((k + cl((y - rows[k].top) / rows[k].h) * 0.999) / rows.length),
    };
  }
  if (cam && R.state.phase === "bracket")
    return {
      x: cl((px - cam.dx - cam.ox) / (cam.W * cam.z)),
      y: cl((py - cam.dy - cam.oy) / (cam.H * cam.z)),
    };
  if (geo.tl) {
    const y = py - geo.tl.t + scY,
      rows = geo.tl.rows,
      n = rows.length - 1;
    let k = rows.findIndex((r) => y < r.top + r.h);
    if (k < 0) k = rows.length - 1;
    const f = cl((y - rows[k].top) / rows[k].h) * 0.999;
    return {
      x: cl(px / W),
      y:
        n < 1
          ? f
          : k < n
            ? ((k + f) / n) * TV_ROWS_END
            : TV_ROWS_END + f * (1 - TV_ROWS_END),
    };
  } // (Trivia's rows)
  py -= geo.top0;
  if (qp) {
    const a = cl((px - qp.l) / (W - qp.l - qp.r)),
      b = cl((py - qp.t) / (H - qp.t - qp.b));
    return turned() ? { x: 1 - b, y: a } : { x: a, y: b };
  }
  if (turned())
    return { x: cl(1 - (py - size * 0.45) / H), y: cl((px / W - 0.1) / 0.8) };
  return {
    x: cl(px / W),
    y: cl((py - size * 1.08) / (H - size * 1.08 - labelH)),
  };
}

/* where a duck has walked (on the board, newest first), for its ducklings */
export function trail(d, pos) {
  const path = d._trail || (d._trail = []),
    last = path[0];
  if (pos.x < 0) return;
  if (!last || Math.hypot(pos.x - last.x, (pos.y - last.y) * 0.4) > 0.004) {
    path.unshift({ x: pos.x, y: pos.y });
    if (path.length > 60) path.length = 60;
    if (last) d._walk = clockNow();
  }
}
/* the spot dist pixels back along a duck's path from its feet (at), and which way it faces there */
export function along(path, at, dist, face) {
  let px = at.left,
    py = at.top,
    left = dist;
  for (const p of path) {
    const q = place(p, 0, 1),
      dx = q.left - px,
      dy = q.top - py,
      d = Math.hypot(dx, dy);
    if (d < 0.5) continue;
    if (d >= left) {
      const k = left / d;
      return {
        left: px + dx * k,
        top: py + dy * k,
        face: Math.abs(dx) > 1 ? (dx < 0 ? 1 : -1) : face,
      };
    }
    left -= d;
    px = q.left;
    py = q.top;
    if (Math.abs(dx) > 1) face = dx < 0 ? 1 : -1;
  }
  return { left: px - face * left, top: py, face }; // (a short path: on behind, in a line)
}
