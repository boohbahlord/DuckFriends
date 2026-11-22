/* ---------- Sandbox: spawns and respawns (stage 2), on the screen ----------
   The owner's Sandbox file: a spawn is "a white transparent circle with a hollow middle and a white circle at it's
   center", in its own color, its name over it; a respawn looks the same "but instead they have points on four ends of
   the circle". E beside one (whoever may build) opens its settings: its name and color, what spawns, its key, the
   number boxes and the true or false boxes. A box written wrong turns red and says why; the spawn keeps its last good
   value (seriatbox.js). On the board the game draws them (game.js calls sbBoardMarks); on the worlds they are an activity
   of Sandbox's own (registry.js only: "sandbox"). */
import { LANG } from "./langname.js";
import { activity } from "./hangout/registry.js";
import { W, H, sortY } from "./hangout/layout.js";
import { npcPics } from "./sbnpcart.js";
import { colorField } from "./color.js";
import { momentHTML } from "./specials.js";
import { esc, openWindow, confirmBox, toast, foldHeads } from "./ui.js";
import {
  sbPresets,
  sbCheat,
  sbLevel,
  colSwatches,
  NOCOL_NOTE,
} from "./sbmenu.js";
import { activeRoom } from "./net.js";
import {
  isSb,
  sbMay,
  sbOnBoard,
  sbClimbAt,
  SB_SLOPE_DIRS,
  SB_BOXES,
  SB_FLAGS,
  SB_ACTS,
  SB_IMPORT,
  SB_OWN,
  SB_MSET,
  SB_WHAT,
  SB_PLAYER,
  SB_COLORS,
  SB_NOCOL,
  SB_ZONE,
  SB_FX,
  sbZoneBox,
  baseMode,
  SB_SHAPE,
  SB_SHAPES,
  sbShape,
  sbFills,
  sbSpread,
  sbSize,
  sbRot,
  SB_TABS,
  sbGrid,
  sbStep,
  sbActive,
  sbUnit,
  SB_ORDER,
  SB_ORDERS,
  SB_GOES,
  SB_SFX,
  sbSfx,
  SB_SFX_Z,
  sbSfxZ,
  sbCellMids,
  SB_LOOKS,
  sbLook,
  SB_CALL,
  SB_CALL_ERR,
  sbNeedsCall,
  sbTabLive,
  sbCallZone,
  sbTie,
  sbHeld,
  sbZonesOn,
  sbNameOf,
  SB_DIRS,
  SB_POINTS,
  sbInBlock,
  sbWalls,
  sbWallStops,
  sbWorksAt,
  sbOutline,
  sbOv,
  sbOrder,
  sbFlips,
  sbHasOl,
  sbOlColor,
  sbOlRows,
  SB_OL_DEF,
  boardDuck,
  SB_LOOT,
  SB_SA_ON,
  sbSaRows,
  sbSaText,
} from "./sandboxrules.js";
import {
  boxText,
  boxWhy,
  boxOf,
  spawnsHere,
  sbWalkOf,
  madeOf,
  kdOf,
  msetOf,
  ownOn,
  SB_TEXT,
} from "./sbspawn.js";
import { orbWrap, lootRing, lootPage, lootWire } from "./sblootview.js";
import { orbsOf } from "./sbloot.js";
import { valueOf, read as nbRead } from "./seriatbox.js";
import { drawNpcs, dropNpcs } from "./npcview.js";
import { groupOpts, grShown, jgRow } from "./sbgroupview.js";
import { olAdd } from "./outlines.js";
import { sbFloorsFrom, sbIsFloor, sbSlope, sbSlopeH } from "./sbfloors.js";
import {
  lookCSS,
  lookNames,
  lookPreview,
  lookTile,
  lookTileURL,
} from "./sblooks.js";
import {
  kindsFor,
  sendKinds,
  lookPage,
  lookFor,
  picFrom,
  sendPic,
  sendParts,
} from "./sbmake.js";
const LOOK_PX = 64; // (a zone's own picture: its longest side in pixels, twice a duck's height)

/* a color as CSS: No color is white (the owner's, Nov 20 02:37Z: "Its color is no color by default, which is white") */
export const colCSS = (col) => SB_COLORS[col] || SB_COLORS.white;
/* cheat mode on, and I may build: every zone shows, B or not (the owner's, Nov 20 02:37Z: "it is always visible in
   cheat mode. It shouldn't be hidden to where you have to hit B build mode to see it") */
function seeAll(s) {
  const R = activeRoom();
  return !!(sbCheat.on && R && s && sbMay(s, R.me, "b"));
}
/* "Hide (unless cheat mode)": a point I don't see now */
function hiddenNow(s, p) {
  if (boxText(p, "hide") !== "t") return false;
  const R = activeRoom();
  return !(sbCheat.on && R && s && sbMay(s, R.me, "b"));
}
/* a point's picture: the hollow ring and its middle dot (a respawn: four points on the ring too) */
function markSVG(p) {
  if (p.k === "loot") return lootRing(SB_COLORS[p.col] || "#fff"); // (a loot orb's spot: sblootview.js)
  const c = colCSS(p.col),
    pts =
      p.k === "respawn"
        ? [0, 90, 180, 270]
            .map((a) => {
              const r = (a * Math.PI) / 180;
              return `<circle cx="${(50 + 40 * Math.cos(r)).toFixed(1)}" cy="${(50 + 40 * Math.sin(r)).toFixed(1)}" r="7" fill="${c}" stroke="#fff" stroke-width="2"/>`;
            })
            .join("")
        : "";
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="12"/><circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-opacity="0.75" stroke-width="6"/><circle cx="50" cy="50" r="11" fill="#fff" fill-opacity="0.8" stroke="${c}" stroke-width="3"/>${pts}</svg>`;
}
/* what my screen shows of Sandbox's build: zones only while my Build window is up (sandbox.js sets it) or a zone's
   window is open ("Sections colored from board build is invisible", the owner's Sandbox file) */
export const sbView = { build: false, until: 0 };
/* spawns and respawns have no symbol: each is drawn just as a zone is, seen only while I build (the owner's, Nov 20
   02:32Z: "From now on, spawn or respawn doesn't have a symbol. It's just a zone, like it was for the zones") */
export const zoneLike = (p) =>
  p.k === "zone" || p.k === "spawn" || p.k === "respawn";
export const sbSel = new Set(); // (the blocks a Shift drag picked: sbdrag.js; they light up)
const building = () =>
  sbView.build ||
  sbView.until > performance.now() ||
  !!document.querySelector(".sb-zonewin");
/* a mark's element on the layer (made the first time) */
function markEl(layer, have, key, cls) {
  let n = have.get(key);
  if (!n) {
    n = document.createElement("div");
    n.className = cls;
    n.dataset.p = key;
    layer.append(n);
  }
  return n;
}
/* place a mark's element: its middle at c, size wide */
function placeAt(n, c, size) {
  const st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${size.toFixed(1)}`;
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: (c.left - size / 2).toFixed(1) + "px",
    top: (c.top - size * 0.3).toFixed(1) + "px",
    width: size.toFixed(1) + "px",
    height: (size * 0.6).toFixed(1) + "px",
    zIndex: Math.round(c.top - 5),
  });
}
/* a block's shape as pixels, made from the start as pixels (the owner's, Nov 19 23:41Z): one pixel per quarter-duck
   square of the box around it, set where that square's middle is inside the block (sandboxrules.js sbInBlock: on one of
   its hitbox tiles, its turn included), its inside see-through in its color and its edge squares stronger. Kept by
   shape, size, turn and color */
const SHAPE_PX = new Map();
function shapePic(s, p, css, solid = false) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    [ux, uy] = sbOnBoard(s) ? boardDuck(s) : [48 / W, 48 / H],
    cx = Math.max(1, Math.round(((x1 - x0) / ux) * 4)),
    cy = Math.max(1, Math.round(((y1 - y0) / uy) * 4)),
    key = `${sbShape(p)} ${sbSize(p)} ${sbRot(p)} ${sbFlips(p)} ${cx} ${cy} ${css} ${solid}`;
  let u = SHAPE_PX.get(key);
  if (u) return u;
  const cv = document.createElement("canvas");
  cv.width = cx;
  cv.height = cy;
  const g = cv.getContext("2d"),
    inn = (i, j) =>
      i >= 0 &&
      j >= 0 &&
      i < cx &&
      j < cy &&
      sbInBlock(
        s,
        p,
        x0 + ((i + 0.5) / cx) * (x1 - x0),
        y0 + ((j + 0.5) / cy) * (y1 - y0),
        W,
        H,
      );
  for (let j = 0; j < cy; j++)
    for (let i = 0; i < cx; i++) {
      if (!inn(i, j)) continue;
      const edge =
        !inn(i - 1, j) || !inn(i + 1, j) || !inn(i, j - 1) || !inn(i, j + 1);
      g.globalAlpha = solid ? 1 : edge ? 0.85 : 0.22; // (solid: a look's mask, sblooks.js)
      g.fillStyle = css;
      g.fillRect(i, j, 1, 1);
    }
  SHAPE_PX.set(key, (u = cv.toDataURL()));
  return u;
}
/* a block's box on the screen at its height: { left, top, width, height, sk: degrees to skew it down to the right }. A
   slope (sbfloors.js) is a tilted plane, so its box's top edge leans with it (skewY) and its sides stretch or shrink */
function slabGeo(s, p, at) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    sl = sbIsFloor(p) && sbSlope(p),
    z = (x, y) => (sl ? sbSlopeH(s, p, sl, x, y) : p.z || 0),
    a = at({ x: x0, y: y0, z: z(x0, y0) }),
    b = at({ x: x1, y: y0, z: z(x1, y0) }),
    c = at({ x: x0, y: y1, z: z(x0, y1) }),
    width = Math.max(1, b.left - a.left);
  return {
    left: a.left,
    top: a.top,
    width,
    height: Math.max(1, c.top - a.top),
    sk: sl ? (Math.atan2(b.top - a.top, width) * 180) / Math.PI : 0,
    zEnd: (x) => z(x, y1), // (its height along its bottom edge)
    ground: at({ x: x0, y: y1, z: 0 }).top, // (its front edge down on the ground: a block's face reaches it)
    me: (h) => {
      const R = activeRoom(),
        q = R && s.pos && s.pos[R.me];
      return q ? at({ x: q.x, y: q.y, z: h }) : { left: -1e9, top: -1e9 };
    }, // (my duck on the screen, at height h)
  };
}
const skewCSS = (g) => (g.sk ? `skewY(${g.sk.toFixed(2)}deg)` : "");
/* plan Phase 4 (the owner's: "the walls facing the camera ... become transparent when a player is behind them because
   they're set to elevation 2", "Those rectangles become transparent when you're underneath them"): a zone up high (an
   elevation over 1, or a floor or slope) is drawn in front of whatever is behind its front edge, as Downpour's roofs are
   (what stands on it is in front of it: layout.js sortY), and goes see-through while my duck is behind or under it.
   { zi: its z-index ("" when it lies on the ground), thru: my duck is hidden by it } */
const THRU = 0.3; // (how much of it shows while my duck is behind it)
/* row 161, a house from the menus (the owner's: "the walls facing the camera, let's say, because of their given height
   and how they're made, become transparent when a player is behind them because they're set to elevation 2"): a zone up
   high that isn't Ground is a block, its front side down to the ground, so walls up high read as walls and a house's
   front wall and roof hide who's inside it. A Ground zone stays a floor up there (its thin edge only) */
const upBlock = (p) => p.k === "zone" && (p.z || 0) > 0.5 && !sbIsFloor(p);
/* the plain board is flat: there an elevation of 2 or more puts the zone's look over every duck (a roof, row 161), and it goes
   see-through while my duck is under it */
const BOARD_UP = "99980"; // (under SFX_TOP.board: an effect shown above everything stays above it)
const boardUp = (p) =>
  p.k === "zone" && valueOf({ ok: boxText(p, "fl") }, SB_ZONE.fl) >= 2; // (a whole level up: a curb at 1.05 stays under the ducks)
/* my duck is inside a house: it stands under a zone up high (a roof) that overlaps zone p, so p goes see-through as a
   whole, as Downpour's buildings do from inside (their walls and roof together), not only the part in front of my duck */
function inHouse(s, p, me) {
  const board = sbOnBoard(s),
    z = +me.z || 0,
    b = sbZoneBox(s, p, W, H);
  for (const q of Object.values(ptsOf(s))) {
    if (q.grp || q.k !== "zone" || sbFills(q)) continue;
    if (board ? !boardUp(q) : (q.z || 0) <= z + 0.5) continue;
    const c = sbZoneBox(s, q, W, H);
    if (me.x < c[0] || me.x > c[2] || me.y < c[1] || me.y > c[3]) continue;
    if (c[0] <= b[2] && b[0] <= c[2] && c[1] <= b[3] && b[1] <= c[3])
      return true;
  }
  return false;
}
/* the plain board (row 161): duck id at pos stands under a roof (a zone at elevation 2 or more) that my duck isn't
   under, so the roof hides it whole (game.js drawDucks); on the board a duck's head would show past the roof's edge */
export function sbRoofed(s, id, pos) {
  const R = activeRoom();
  if (!sbOnBoard(s) || !R || id === R.me || !pos) return false;
  const me = s.pos && s.pos[R.me];
  for (const q of Object.values(ptsOf(s))) {
    if (q.grp || q.k !== "zone" || sbFills(q) || !boardUp(q)) continue;
    const c = sbZoneBox(s, q, W, H),
      at = (o) => o.x >= c[0] && o.x <= c[2] && o.y >= c[1] && o.y <= c[3];
    if (at(pos) && !(me && at(me))) return true;
  }
  return false;
}
function upHigh(s, p, g) {
  if (sbOnBoard(s)) {
    if (!boardUp(p)) return { zi: "", thru: false };
    const q = g.me(0),
      R = activeRoom(),
      me = R && s.pos && s.pos[R.me];
    return {
      zi: BOARD_UP,
      thru:
        (q.left >= g.left &&
          q.left <= g.left + g.width &&
          q.top >= g.top &&
          q.top <= g.top + g.height) ||
        (!!me && inHouse(s, p, me)),
    };
  }
  if (!((p.z || 0) > 0.5 || sbIsFloor(p))) return { zi: "", thru: false };
  const front = sbZoneBox(s, p, W, H)[3] * H,
    zi = String(Math.round(front) + 10),
    R = activeRoom(),
    me = R && s.pos && s.pos[R.me];
  if (!me || !g.me) return { zi, thru: false };
  const z = +me.z || 0;
  if (sortY(me.x * W, me.y * H, z) >= front) return { zi, thru: false };
  const lean = Math.tan((g.sk * Math.PI) / 180) * g.width,
    y0 = g.top + Math.min(0, lean),
    y1 = Math.max(
      g.top + g.height + Math.max(0, lean),
      upBlock(p) ? g.ground : -Infinity,
    ), // (a block: behind its front side too)
    in_ = (q) =>
      q.left >= g.left &&
      q.left <= g.left + g.width &&
      q.top >= y0 &&
      q.top <= y1;
  return {
    zi,
    thru: in_(g.me(z)) || in_(g.me(z + 40)) || inHouse(s, p, me),
  };
}
/* a zone: its rectangle, see-through in its color, as the map draws it (its corners through at: the board and the
   worlds both draw it square to the screen), its name over it and a dot where its builder stood (E there opens it). A
   box of CSS, not a drawing: the pixel look (pxdom.js) would make a new picture of it each time the camera moves */
function zoneMark(n, p, at, s, bare = false) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    z = p.z || 0,
    cs0 = [
      [x0, y0],
      [x1, y1],
      [p.x, p.y],
    ].map(([x, y]) => at({ x, y, z })),
    L0 = Math.min(cs0[0].left, cs0[1].left),
    T0 = Math.min(cs0[0].top, cs0[1].top),
    shaped = (sbShape(p) !== "sq" || sbRot(p) !== 0) && !sbFills(p), // (a square, not turned, is its CSS box; the rest pixels)
    sig = `${p.col} ${boxText(p, "name")} ${shaped ? `${sbShape(p)} ${sbSize(p)} ${sbRot(p)} ${sbFlips(p)}` : ""} ${bare}`;
  if (n._sig !== sig) {
    n._sig = sig;
    const css = SB_COLORS[p.col] || "#fff";
    n.style.setProperty("--c", css);
    n.classList.toggle("sb-shaped", shaped);
    if (shaped) n.style.setProperty("--shape", `url("${shapePic(s, p, css)}")`);
    else n.style.removeProperty("--shape");
    n.innerHTML = bare
      ? "" // (a spawn's, respawn's or loot spot's area: its ring shows where it is)
      : `<span class="sb-zone-dot"></span><span class="sb-pt-name" style="color:var(--c)">${esc(boxText(p, "name"))}</span>`;
  }
  const g = sbIsFloor(p) && sbSlope(p) ? slabGeo(s, p, at) : null; // (a slope: tilted with it)
  let cs = cs0,
    L = L0,
    T = T0;
  if (g) {
    L = g.left;
    T = g.top;
    cs = [
      { left: g.left, top: g.top },
      { left: g.left + g.width, top: g.top + g.height },
      at({ x: p.x, y: p.y, z: p.z || 0 }),
    ];
  }
  cellsOn(n, s, p, cs);
  const st =
    cs.map((c) => `${c.left.toFixed(1)},${c.top.toFixed(1)}`).join(" ") +
    (g ? ` ${g.sk.toFixed(2)}` : "");
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: L.toFixed(1) + "px",
    top: T.toFixed(1) + "px",
    width: Math.abs(cs[1].left - cs[0].left).toFixed(1) + "px",
    height: Math.abs(cs[1].top - cs[0].top).toFixed(1) + "px",
    transformOrigin: "0 0",
    transform: g ? skewCSS(g) : "",
  });
  if (n.firstChild)
    Object.assign(n.firstChild.style, {
      left: (cs[2].left - L).toFixed(1) + "px",
      top: (cs[2].top - T).toFixed(1) + "px",
    });
}
/* a block's squares while building (plan Phase 3: "the squares a zone checks are shown while you build, big enough to
   see"): each square's edge, and the ones acting now filled in its color. Drawn as pixels on a canvas over its box,
   again only when its step, its squares or its size on the screen change. cs: its box's corners and middle (px) */
function cellsOn(n, s, p, cs) {
  const id = n.dataset.p.split("~")[0],
    w = Math.round(Math.abs(cs[1].left - cs[0].left)),
    h = Math.round(Math.abs(cs[1].top - cs[0].top)),
    g = sbGrid(s, p, W, H),
    k = sbStep(s, id),
    on = sbActive(s, id, p, k, W, H),
    sig = `${w}x${h} ${g.nx}x${g.ny} ${g.cells.length} ${sbRot(p)} ${p.col} ${on ? [...on].join(",") : "all"}`;
  if (n._cells === sig && n.querySelector(".sb-cells")) return;
  n._cells = sig;
  let c = n.querySelector(".sb-cells");
  if (!c) {
    c = document.createElement("canvas");
    c.className = "sb-cells px";
    n.append(c);
  }
  if (!w || !h) return;
  c.width = w;
  c.height = h;
  const x = c.getContext("2d"),
    [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    [rx, ry] = sbUnit(s, W, H),
    a = (sbRot(p) * Math.PI) / 180,
    fill = sbFills(p),
    /* a spot in the block's own grid (-0.5 to 0.5 across) on the canvas */
    put = (u, v) => {
      let X, Y;
      if (fill) {
        X = u + 0.5;
        Y = v + 0.5;
      } else {
        const lx = u * g.w + g.ox,
          ly = v * g.h + g.oy;
        X = p.x + (lx * Math.cos(a) - ly * Math.sin(a)) * rx;
        Y = p.y + (lx * Math.sin(a) + ly * Math.cos(a)) * ry;
      }
      return [((X - x0) / (x1 - x0)) * w, ((Y - y0) / (y1 - y0)) * h];
    },
    css = SB_COLORS[p.col] || "#fff";
  x.clearRect(0, 0, w, h);
  x.lineWidth = 1;
  for (const cell of g.cells) {
    const i = cell % g.nx,
      j = Math.floor(cell / g.nx),
      u0 = i / g.nx - 0.5,
      v0 = j / g.ny - 0.5,
      u1 = (i + 1) / g.nx - 0.5,
      v1 = (j + 1) / g.ny - 0.5,
      q = [put(u0, v0), put(u1, v0), put(u1, v1), put(u0, v1)];
    x.beginPath();
    q.forEach(([X, Y], m) => (m ? x.lineTo(X, Y) : x.moveTo(X, Y)));
    x.closePath();
    if (!on || on.has(cell)) {
      x.globalAlpha = on ? 0.45 : 0.12;
      x.fillStyle = css;
      x.fill();
    }
    x.globalAlpha = 0.35;
    x.strokeStyle = css;
    x.stroke();
  }
  x.globalAlpha = 1;
}
/* the orbs of loot block p I see: never a zombie drop (it draws itself: l4dd.js), nor my own copy once I took it
   (sbloot.js, "Every player gets their own") */
function seen(p) {
  const me = activeRoom() && activeRoom().me;
  return orbsOf(p).filter((o) => o.dn == null && !(o.got || []).includes(me));
}
/* what an orb's look depends on: when it changes, it's drawn again (plan Loot 4: how it's shown, its size, see-through) */
const lookSig = (s, id, p, o) =>
  [
    o.w,
    ...["look", "lshow", "lsize", "lop"].map((f) => boxText(p, f)),
    ((s && s.sbImg) || {})[id],
  ].join("|");
/* orb o of loot block id (point p) as its own mark, key k, where it lies (in a zone) or on its block */
function orbMark(layer, have, want, k, id, p, o, at, size, s) {
  const el = markEl(layer, have, k, "sb-pt"),
    face = lookSig(s, id, p, o);
  want.add(k);
  if (el._sig !== face) {
    el._sig = face;
    el.innerHTML = orbWrap(s, id, p, o);
  }
  placeAt(el, at(o.x != null ? { x: o.x, y: o.y, z: o.z || 0 } : p), size);
}
/* the zones' marks in their drawing order, the top one last (sandboxrules.js sbOrder: Move up and Move down); moved only
   when the order changed */
function drawOrder(layer, pts) {
  const zs = [...layer.querySelectorAll(":scope > .sb-zone")],
    key = (n) => {
      const id = n.dataset.p.split("~")[0];
      return sbOrder(id, pts[id]);
    },
    want = [...zs].sort((a, b) => key(a) - key(b));
  if (want.every((n, i) => n === zs[i])) return;
  for (const n of want) layer.append(n);
}
/* the points on a layer: at(p) → { left, top } where its middle is (board px), size its width; s: the room's state (a
   loot point's orb and its picture) */
function drawMarks(layer, pts, at, size, s) {
  const have = new Map(),
    want = new Set(),
    seeZones = building() || seeAll(s); // (always in cheat mode, the owner's, Nov 20 02:37Z)
  for (const n of layer.querySelectorAll(".sb-pt")) have.set(n.dataset.p, n);
  for (const [id, p] of Object.entries(pts)) {
    if (p.k === "zone") sfxOn(layer, have, want, id, p, at, size, s); // (its squares' special or picture: everyone sees it)
    if (p.grp) {
      /* a spawn's + page or a block's tab: drawn as its block, but a Loot tab's orbs show where they lie */
      if (p.pg === "t" && p.k === "loot")
        seen(p).forEach((o, i) =>
          orbMark(
            layer,
            have,
            want,
            i ? `${id}~o${i}` : id,
            id,
            p,
            o,
            at,
            size,
            s,
          ),
        );
      continue;
    }
    const other = seeZones && sbOv(p) !== sbLevel.v, // (on another overlay level: only its orbs still show)
      hid = hiddenNow(s, p) || other,
      vis = p.k === "loot" ? seen(p) : [],
      orbOut = vis.length > 0;
    if (p.k === "zone") lookOn(layer, have, want, id, pts, at, size, s); // (its look: everyone sees it, hidden or not)
    if (sbIsFloor(p)) faceOn(layer, have, want, id, pts, at, size, s, seeZones);
    else if (upBlock(p) && !sbOnBoard(s))
      faceOn(layer, have, want, id, pts, at, size, s, false); // (a block up high: its front side, when it has a look)
    if (hid && !orbOut) continue; // (Hide: a loot point hides its ring and name, never its orb, the owner's "that appearance is hidden")
    if (zoneLike(p)) {
      if (!seeZones || other) continue;
      want.add(id);
      /* the zone it leads with sets how it looks: its color and its name (the owner's, Nov 20 02:45Z) */
      const lead = sbZonesOn(pts, id)[0],
        L = lead && lead !== id ? pts[lead] : null;
      zoneMark(
        markEl(layer, have, id, "sb-pt sb-zone"),
        L ? { ...p, col: L.col, f: { ...p.f, name: L.f.name } } : p,
        at,
        s,
      );
      continue;
    }
    want.add(id);
    /* a spawn, respawn or loot spot bigger than its spot: its area too, while building, as a zone's */
    if (seeZones && sbSpread(p) && !hid) {
      want.add(id + "~a");
      zoneMark(
        markEl(layer, have, id + "~a", "sb-pt sb-zone sb-area"),
        p,
        at,
        s,
        true,
      );
    }
    const orb = vis[0] || null,
      face = orb ? lookSig(s, id, p, orb) : "",
      away = !!orb && orb.x != null, // (its orb lies in a zone: drawn there, sbloot.js)
      n = markEl(layer, have, id, "sb-pt"),
      sig = `${p.k} ${p.col} ${boxText(p, "name")} ${away ? "" : face} ${hid}`;
    if (n._sig !== sig) {
      n._sig = sig;
      n.innerHTML = `${hid ? "" : `<span class="sb-pt-name" style="color:${colCSS(p.col)}">${esc(boxText(p, "name"))}</span>${markSVG(p)}`}${orb && !away ? orbWrap(s, id, p, orb) : ""}`;
    }
    placeAt(n, at(p), size);
    if (away) orbMark(layer, have, want, id + "~o", id, p, orb, at, size, s);
    vis
      .slice(1)
      .forEach((o, i) =>
        orbMark(layer, have, want, `${id}~o${i + 1}`, id, p, o, at, size, s),
      ); // (more than one lying: plan Loot 1, Spawn limit)
  }
  for (const [id, n] of have) if (!want.has(id)) n.remove();
  drawOrder(layer, pts);
  if (sbSel.size || layer._sel)
    for (const n of layer.querySelectorAll(".sb-pt:not(.sb-look)"))
      n.classList.toggle("sb-sel", sbSel.has(n.dataset.p.split("~")[0]));
  layer._sel = sbSel.size > 0;
  darkOut(layer, pts, at, s);
}
/* a zone's look (plan Phase 3, Looks: sblooks.js), the lead zone's when it leads with another (the owner's, Nov 20
   02:45Z: the first Zone tab sets the look), under everything standing on it. size: a duck's width on the screen, so a
   texture keeps the size it has on its map */
function lookOn(layer, have, want, id, pts, at, size, s) {
  const lead = sbZonesOn(pts, id)[0],
    p = pts[id],
    look = sbLook(lead && pts[lead] ? pts[lead] : p),
    bg = lookCSS(look, s && s.sbpic, size / 90);
  if (!bg) return;
  const key = id + "~l",
    n = markEl(layer, have, key, "sb-pt sb-look");
  want.add(key);
  const g = slabGeo(s, p, at),
    shaped = (sbShape(p) !== "sq" || sbRot(p) !== 0) && !sbFills(p),
    mask = shaped ? `url("${shapePic(s, p, "#000", true)}")` : "",
    u = upHigh(s, p, g),
    st = `${bg} ${mask} ${look.op} ${g.left.toFixed(1)},${g.top.toFixed(1)},${g.width.toFixed(1)},${g.height.toFixed(1)},${g.sk.toFixed(2)} ${u.zi} ${u.thru}`;
  if (n._st === st) return;
  n._st = st;
  n.style.background = bg;
  n.style.setProperty("--mask", mask || "none");
  n.classList.toggle("sb-thru", u.thru);
  Object.assign(n.style, {
    zIndex: u.zi,
    opacity: String((1 - look.op) * (u.thru ? THRU : 1)),
    left: g.left.toFixed(1) + "px",
    top: g.top.toFixed(1) + "px",
    width: g.width.toFixed(1) + "px",
    height: g.height.toFixed(1) + "px",
    transformOrigin: "0 0",
    transform: skewCSS(g),
  });
}
/* a zone's effect from the specials, on a few of its working squares, or its picture on each of them (the owner's: "It
   could be effect from the specials, only an effect", "an image can be uploaded as well ... takes up the size"); below every
   entity or above them, never over the map's own roofs (the owner's: "Effects can be chosen to either happen below all
   entities or above"). The ground fire, smoke, steam and sparks are pixels: game.js sbZoneLooks */
/* (the pixel ones are drawn over the world on the effects' canvas, so only these can go below) */
const domSfx = (k) => k === "pic" || k.startsWith("sp_");
const PIC_MOST = 200, // (squares that show its picture at once)
  SFX_MOST = 6, // (squares that show a special at once)
  SFX_TOP = { hang: "4999", board: "99990" }; // (under world.js CROWN_Z: the roofs stay over it)
function sfxOn(layer, have, want, id, p, at, size, s) {
  const k = sbSfx(p);
  if (!domSfx(k)) return;
  const below = sbSfxZ(p) === "below",
    hang = !!layer.closest(".hang-board"),
    g = slabGeo(s, p, at),
    u = upHigh(s, p, g),
    zi = below
      ? u.zi || "4" // (over its zone's look, 3, under every duck and NPC)
      : SFX_TOP[hang ? "hang" : "board"];
  if (k === "pic") {
    /* the owner's: "Every part of the algorithm's tile has an image uploaded of, let's say, a square ... And the square
       goes in different parts of the screen based on the algorithm": the picture on each square that acts now */
    const bg = lookCSS({ k: "pic", v: boxText(p, "sfxpic") }, s && s.sbpic, 1);
    if (!bg) return;
    const mids = sbCellMids(s, id, p, W, H, PIC_MOST),
      gr = sbGrid(s, p, W, H),
      [rx, ry] = sbUnit(s, W, H),
      cw = (gr.w / gr.nx) * rx,
      ch = (gr.h / gr.ny) * ry,
      z = p.z || 0;
    mids.forEach((m, i) => {
      const key = `${id}~x${i}`,
        n = markEl(layer, have, key, "sb-pt sb-sfxpic");
      want.add(key);
      const a = at({ x: m.x - cw / 2, y: m.y - ch / 2, z }),
        b = at({ x: m.x + cw / 2, y: m.y + ch / 2, z }),
        st = `${bg} ${a.left.toFixed(1)},${a.top.toFixed(1)},${b.left.toFixed(1)},${b.top.toFixed(1)} ${zi}`;
      if (n._st === st) return;
      n._st = st;
      n.style.background = bg;
      Object.assign(n.style, {
        zIndex: zi,
        left: a.left.toFixed(1) + "px",
        top: a.top.toFixed(1) + "px",
        width: Math.max(1, b.left - a.left).toFixed(1) + "px",
        height: Math.max(1, b.top - a.top).toFixed(1) + "px",
      });
    });
    return;
  }
  const mids = sbCellMids(s, id, p, W, H, 400);
  if (!mids.length) return;
  const every = Math.max(1, Math.floor(mids.length / SFX_MOST)),
    z = p.z || 0;
  for (let i = 0; i < SFX_MOST && i * every < mids.length; i++) {
    const m = mids[(i * every + (idHash(id) % every)) % mids.length],
      key = `${id}~x${i}`,
      n = markEl(layer, have, key, "sb-pt sb-sfx");
    want.add(key);
    if (n._k !== k) {
      n._k = k;
      n.innerHTML = momentHTML(k.slice(3), null);
    }
    const c = at({ x: m.x, y: m.y, z }),
      st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${size.toFixed(1)},${zi}`;
    if (n._st === st) continue;
    n._st = st;
    Object.assign(n.style, {
      left: (c.left - size / 2).toFixed(1) + "px",
      top: (c.top - size).toFixed(1) + "px",
      width: size.toFixed(1) + "px",
      height: size.toFixed(1) + "px",
      zIndex: zi,
    });
  }
}
const idHash = (id) =>
  [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/* plan Phase 4: a floor up high shows its front edge, a strip under its box as thick as a floor (layout.js SIGHT_SLAB),
   in its look made darker, or while building in its color; so it reads as a slab at its height */
const FACE = 16; // (world px)
function faceOn(layer, have, want, id, pts, at, size, s, seeZones) {
  const lead = sbZonesOn(pts, id)[0],
    p = pts[id],
    look = sbLook(lead && pts[lead] ? pts[lead] : p),
    bg = lookCSS(look, s && s.sbpic, size / 90);
  if (!bg && !seeZones) return;
  const key = id + "~f",
    n = markEl(layer, have, key, "sb-pt sb-face");
  want.add(key);
  const [x0, , x1, y1] = sbZoneBox(s, p, W, H),
    g = slabGeo(s, p, at),
    z0 = g.zEnd(x0),
    a = at({ x: x0, y: y1, z: z0 }),
    b = at({ x: x1, y: y1, z: g.zEnd(x1) }),
    d = at({ x: x0, y: y1, z: upBlock(p) ? 0 : Math.max(0, z0 - FACE) }),
    css = bg || SB_COLORS[p.col] || "#fff",
    u = upHigh(s, p, g),
    st = `${css} ${a.left.toFixed(1)},${a.top.toFixed(1)} ${b.left.toFixed(1)},${b.top.toFixed(1)} ${d.top.toFixed(1)} ${look ? look.op : ""} ${u.zi} ${u.thru}`;
  if (n._st === st) return;
  n._st = st;
  n.style.background = css;
  const w = Math.max(1, b.left - a.left),
    sk = (Math.atan2(b.top - a.top, w) * 180) / Math.PI;
  Object.assign(n.style, {
    zIndex: u.zi,
    opacity: String((bg ? 1 - look.op : 0.45) * (u.thru ? THRU : 1)),
    left: a.left.toFixed(1) + "px",
    top: a.top.toFixed(1) + "px",
    width: w.toFixed(1) + "px",
    height: Math.max(1, d.top - a.top).toFixed(1) + "px",
    transformOrigin: "0 0",
    transform: Math.abs(sk) > 0.01 ? `skewY(${sk.toFixed(2)}deg)` : "",
  });
}
/* Dark outside (plan Phase 3): while my duck stands where a zone with it works, everything round that zone goes dark,
   as round the building I'm in on the zombie maps. One zone's at a time: the first */
const DARK_FAR = 40000; // (px: the dark's outer edge, far past any screen)
function darkOut(layer, pts, at, s) {
  const R = activeRoom(),
    me = R && s && s.pos && s.pos[R.me];
  let hole = null;
  if (me)
    for (const [id, p] of Object.entries(pts))
      if (
        p.k === "zone" &&
        !sbFills(p) &&
        boxText(p, "dark") === "t" &&
        sbWorksAt(s, id, p, me.x, me.y, me.z, W, H)
      ) {
        hole = sbOutline(s, p, W, H).map((q) => at({ ...q, z: p.z || 0 }));
        break;
      }
  let el = layer.querySelector(":scope > .sb-dark");
  if (!hole) {
    if (el) el.classList.remove("on");
    return;
  }
  if (!el) {
    el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("class", "sb-dark");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<path fill-rule="evenodd"/>`;
    layer.append(el);
  }
  const F = DARK_FAR,
    d =
      `M${-F} ${-F}H${F}V${F}H${-F}Z` +
      `M${hole.map((c) => `${c.left.toFixed(1)} ${c.top.toFixed(1)}`).join("L")}Z`;
  if (el._d !== d) {
    el._d = d;
    el.firstChild.setAttribute("d", d);
  }
  if (!el.classList.contains("on"))
    requestAnimationFrame(() => el.classList.add("on")); // (it fades in)
}
const ptsOf = (s) => (isSb(s) && s.sb && s.sb.pts) || {};
/* the board: place(o) → { left, top } (game.js place), size: a duck's width */
export function sbBoardMarks(board, s, place, size) {
  const layer = board && board.querySelector(".ducks");
  if (!layer) return;
  drawMarks(layer, sbOnBoard(s) ? ptsOf(s) : {}, place, size * 1.3, s);
}
/* the point nearest my duck (me: its spot, shares of the map), within reach, or null: on the board 1.5 duck lengths, on
   a world 90 world px (as its E button: the zombie maps' own E would take the key first) */
export function sbNearPoint(s, me) {
  if (!me) return null;
  const board = sbOnBoard(s);
  let best = null,
    bd = board ? 1.5 : 90;
  for (const [id, p] of Object.entries(ptsOf(s))) {
    if (p.grp || sbOv(p) !== sbLevel.v) continue;
    const d = board
      ? Math.hypot(
          (p.x - me.x) / boardDuck(s)[0],
          (p.y - me.y) / boardDuck(s)[1],
        )
      : Math.hypot((p.x - me.x) * W, (p.y - me.y) * H);
    if (d < bd) {
      bd = d;
      best = id;
    }
  }
  return best;
}

/* ---------- its settings window ---------- */
const row = (f, b, t, why) =>
  `<label class="sb-row${why ? " bad" : ""}" data-row="${f}"><span>${esc(b.name)}</span><input class="sb-box" data-f="${f}" value="${esc(t)}" maxlength="${f === "key" ? 1 : 80}" spellcheck="false" autocomplete="off"${dfltBox(b) ? ` placeholder="default${b.def != null && b.def !== "" ? ` (${esc(b.def)})` : ""}"` : ""}><em class="sb-why">${esc(why)}</em></label>`;
/* a setting that left empty is its default (the owner's, Nov 20 17:25Z: "every setting for spawn or respawn or zone or loot
   should have a default setting ... like true, false, default", and "the values not typed into boxes for seriat assume
   default"): a number box or a true or false one. Unset, it shows empty (a switch: default), never the default's own
   value as if typed */
const dfltBox = (b) =>
  !!b && !b.check && ["int", "tenth", "half", "bool"].includes(b.kind);
export const typedOr = (o, f, p = o) =>
  o.f[f] ? o.f[f].t : dfltBox(boxOf(f)) ? "" : boxText(p, f);
/* the Brain box, with an arrow beside it that lists my-files/ (the owner's: "they can click an arrow beside the text
   box ... a selection that they can scroll through of their files within that directory"): brainbuild.js */
const brainRow = (t, why) =>
  `<div class="sb-row sb-brainrow${why ? " bad" : ""}" data-row="brain"><span>${esc(SB_TEXT.brain.name)}</span><span class="sb-brainbox"><input class="sb-box" data-f="brain" value="${esc(t)}" maxlength="80" spellcheck="false" autocomplete="off" aria-label="${esc(SB_TEXT.brain.name)}"><button type="button" class="sb-brainarrow" data-brainlist aria-label="My files" aria-expanded="false">&#9662;</button></span><em class="sb-why">${esc(why)}</em><div class="sb-brainlist" hidden></div></div>`;
/* a behavior list (sbbrain.js) as a dropdown of checkboxes: Players, Everything, each kind, each spawn (by its color,
   named as it's named). Its summary says what's picked */
const summaryOf = (on) =>
  on.map((c) => c.dataset.label).join(", ") || "Nothing";
/* the choices of a behavior list: Players, Everything, each kind, each spawn (by its color, named as it's named) */
const whoOpts = (s, kinds) => [
  ["players", "Players"],
  ["everything", "Everything"],
  ...kinds,
  ...Object.values(ptsOf(s))
    .filter((q) => q.k === "spawn")
    .map((q) => [q.col, `${boxText(q, "name")} spawn`]),
];
/* a zone's Outlines (plan Phase 3: "show outline for chosen entities, in a chosen color; a + duplicates the row for
   another color"): a row each, who it takes and its color; the rows go into one hidden box (sandboxrules.js sbOlRows) */
function olSect(s, p, kinds) {
  const opts = whoOpts(s, kinds).filter(
      (o, i, all) => all.findIndex((x) => x[0] === o[0]) === i,
    ),
    rows = sbOlRows(p),
    one = (who, c) => {
      const on = opts.filter(([v]) => who.includes(v)).map(([, n]) => n);
      return `<div class="sb-olrow"><details class="sb-acts sb-olwho"><summary>${esc(on.join(", ") || "Nothing")}</summary><span class="sb-what">${opts
        .map(
          ([v, n]) =>
            `<label><input type="checkbox" value="${esc(v)}" data-label="${esc(n)}"${who.includes(v) ? " checked" : ""}> ${esc(n)}</label>`,
        )
        .join(
          "",
        )}</span></details><input type="color" class="sb-olcol" value="${c}" aria-label="Outline color"><button type="button" class="btn small ghost sb-olx" data-olx aria-label="Remove this row">&minus;</button></div>`;
    };
  return `<div class="sb-row sb-olbox" data-row="ol"><span>${esc(SB_ZONE.ol.name)}</span><div class="sb-olrows">${(rows.length ? rows : [[[], SB_OL_DEF]]).map(([w, c]) => one(w, c)).join("")}<button type="button" class="btn small sb-olplus" data-olplus aria-label="Another row">+</button></div><input type="hidden" class="sb-box" data-f="ol" value="${esc(boxText(p, "ol"))}"><em class="sb-why"></em></div>`;
}
/* a zone's Look (plan Phase 3, Looks: sblooks.js): none, a texture from the maps (each with its picture), a solid
   color or my own picture (always made into pixels), and how see-through it is */
function lookSect(s, p, row, typed, why) {
  const now = (f) => {
      const k = p.f[f];
      return String(k && k.ok ? k.ok : SB_ZONE[f].def).trim();
    },
    lk = SB_LOOKS[now("lk")] ? now("lk") : "none",
    tex = now("lktex"),
    pic = now("lkpic"),
    img = pic && s.sbpic && s.sbpic[pic];
  return `<div class="sb-row" data-row="lk"><span>${esc(SB_ZONE.lk.name)}</span><select class="sb-box" data-f="lk" aria-label="${esc(SB_ZONE.lk.name)}">${Object.entries(
    SB_LOOKS,
  )
    .map(
      ([v, n]) =>
        `<option value="${v}"${v === lk ? " selected" : ""}>${esc(n)}</option>`,
    )
    .join("")}</select><em class="sb-why"></em></div>
    <div class="sb-lktexs" data-lkrow="tex"${lk === "tex" ? "" : " hidden"}>${lookNames()
      .map(
        ([v, n]) =>
          `<label class="sb-lktex${v === tex ? " on" : ""}"><input type="radio" name="sb-lktex" data-lktex="${v}"${v === tex ? " checked" : ""}>${lookTile(v) ? `<span class="sb-lkprev" style="background-image:url('${lookTileURL(v)}')"></span>` : `<img data-lkprev="${v}" src="${esc(lookPreview(v))}" alt="">`}<span>${esc(n)}</span></label>`,
      )
      .join("")}</div>
    <div class="sb-row" data-row="lkcol" data-lkrow="col"${lk === "col" ? "" : " hidden"}><span>${esc(SB_ZONE.lkcol.name)}</span><span class="sb-lkcolf" data-c="${esc(now("lkcol"))}"></span><input type="hidden" class="sb-box" data-f="lkcol" value="${esc(now("lkcol"))}"><em class="sb-why"></em></div>
    <div class="sb-row sb-up" data-lkrow="pic"${lk === "pic" ? "" : " hidden"}><span>${esc(SB_ZONE.lkpic.name)}</span><span class="sb-what"><label class="btn small"><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden data-lkup>Upload</label>${img ? `<img class="sb-up-pic" src="${img.d}" alt="The zone's picture">` : ""}<em class="small dim sb-lk-note">2 MB at most. Made into pixels.</em></span></div>
    <div data-lkrow="op"${lk === "none" ? " hidden" : ""}>${row("lkop", SB_ZONE.lkop, typed("lkop"), why("lkop"))}</div>`;
}
/* the whole maps' pictures come once they're made: fill them in */
function lookPrevs(w, n = 0) {
  let left = 0;
  for (const i of w.querySelectorAll("img[data-lkprev]"))
    if (!i.getAttribute("src")) {
      const u = lookPreview(i.dataset.lkprev);
      if (u) i.src = u;
      else left++;
    }
  if (left && n < 40 && w.isConnected)
    setTimeout(() => lookPrevs(w, n + 1), 100);
}
/* its rows, read back into its hidden box (and sent, as typing in a box is) */
function olWrite(box) {
  const rows = [...box.querySelectorAll(".sb-olrow")].map((r) => {
    const on = [...r.querySelectorAll("input[type=checkbox]:checked")];
    r.querySelector("summary").textContent =
      on.map((c) => c.dataset.label).join(", ") || "Nothing";
    return `${on.map((c) => c.value).join(", ")}=${r.querySelector(".sb-olcol").value}`;
  });
  const h = box.querySelector('.sb-box[data-f="ol"]');
  h.value = rows.join("; ");
  h.dispatchEvent(new Event("input", { bubbles: true }));
}
function actRow(s, p, f, kinds) {
  const k = p.f[f],
    what = boxText(p, "what").split(/[\s,]+/),
    made = what.length === 1 && madeOf(s, what[0]), // (one made NPC: its own lists, sbnpcs.js)
    picked = (
      k || SB_ZONE[f] || SB_LOOT[f]
        ? boxText(p, f) // (a zone's "Who it hits", a loot's "Who can take it": Players unless set)
        : made
          ? made.beh[f] || ""
          : f === "target" && what.includes("zombie")
            ? "players"
            : ""
    )
      .toLowerCase()
      .split(/[\s,]+/), // (never set: a zombie goes after the players, sbbrain.js)
    opts = whoOpts(s, kinds),
    gs = groupOpts(s, activeRoom() && activeRoom().me); // (the groups: sbgroupview.js)
  /* the groups in a dropdown of their own, under the entities' (the owner's: "For entity dropdown, we'll have another
     dropdown list and option below entities. That's just groups ... It's within the same section"); both make one list */
  return (
    pickRow(f, SB_ACTS[f] || (SB_ZONE[f] || SB_LOOT[f]).name, opts, picked) +
    (gs.length ? pickRow(f, "Groups", gs, picked, f + "-g") : "")
  );
}
/* a dropdown of checkboxes for box f: opts [value, name], the values picked (the first of each value only) */
function pickRow(f, label, opts, picked, rowId = f) {
  const one = opts.filter(
      (o, i, all) => o[0] == null || all.findIndex((x) => x[0] === o[0]) === i,
    ),
    boxes = one.map(([v, n]) =>
      v == null
        ? `<em class="sb-ghead">${esc(n)}</em>` // (a part's header: the groups under the entities)
        : `<label><input type="checkbox" value="${esc(v)}" data-label="${esc(n)}"${picked.includes(v) ? " checked" : ""}> ${esc(n)}</label>`,
    ),
    on = one.filter(([v]) => picked.includes(v)).map(([, n]) => n);
  return `<div class="sb-row" data-row="${rowId}"><span>${esc(label)}</span><details class="sb-acts" data-act="${f}"><summary>${esc(on.join(", ") || "Nothing")}</summary><span class="sb-what">${boxes.join("") || `<em class="sb-none">None placed yet</em>`}</span></details></div>`;
}
/* ---------- the settings window ----------
   A spawn's window has tabs at the top (the owner's Sandbox file): Entities (what it spawns), Players (ducks spawning
   there) and a + that adds a page of either kind, each with its own name (sbspawn.js "page": a point of its own at the
   same spot, its grp the spawn's). A respawn's has Import settings (importWin). id: the point; tab: "pl" for a spawn's
   Players tab; getR: () => the room */
const nameOf = (f) =>
  (SB_BOXES[f] || SB_FLAGS[f] || SB_PLAYER[f] || {}).name || SB_ACTS[f] || f;
/* one Seriat box of a zone's Act (the owner's, Nov 20 17:25Z: "seriat shows a box, then another box appears below it, and it
   is a dropdown list. the dropdown list can be scrolled through ... multiple options can be selected", and "the seriat
   boxes that await input has a small input button on the right for importing files"): the box, its import button, a
   remove button, and what it acts on (SB_SA_ON) as a dropdown of checkboxes under it */
const saWhy = (v) => {
  if (!String(v).trim()) return "";
  const r = nbRead(v, SA_BOX);
  return r.ok ? "" : r.why;
};
const SA_BOX = { kind: "tenth", min: -1000, max: 1000, def: "" };
const saRow = (r) => {
  const why = saWhy(r.v);
  return `<div class="sb-sarow"><div class="sb-row${why ? " bad" : ""}"><span>Seriat</span><span class="sb-sabox"><input class="sb-saval" value="${esc(r.v)}" maxlength="120" spellcheck="false" autocomplete="off" placeholder="-1, 1:3 …" aria-label="Seriat"><button type="button" class="sb-saimp" data-saimp aria-label="Import a file" title="Import a file">&#8615;</button><button type="button" class="sb-sax" data-sax aria-label="Remove this box" title="Remove">&#215;</button></span><em class="sb-why">${esc(why)}</em></div><div class="sb-row"><span>Acts on</span><details class="sb-acts sb-saon"><summary>${esc(r.on.map((k) => SB_SA_ON[k]).join(", ") || "Nothing")}</summary><span class="sb-what">${Object.entries(
    SB_SA_ON,
  )
    .map(
      ([k, n]) =>
        `<label><input type="checkbox" value="${k}" data-label="${esc(n)}"${r.on.includes(k) ? " checked" : ""}> ${esc(n)}</label>`,
    )
    .join(
      "",
    )}</span></details></div><div class="sb-brainlist sb-salist" hidden></div></div>`;
};
/* every Seriat box of the window, as the room keeps them (sandboxrules.js sbSaText) */
const saRead = (w) =>
  sbSaText(
    [...w.querySelectorAll(".sb-sarow")].map((el) => ({
      v: el.querySelector(".sb-saval").value,
      on: [...el.querySelectorAll(".sb-saon input:checked")].map(
        (c) => c.value,
      ),
    })),
  );
/* a true or false setting as a button on the right that reads true or false (the owner's, Nov 19 21:59Z: "make it a
   button ... when you click the button, it will say true or false"), or default (Nov 20 17:25Z: "true, false, default"):
   each press goes default, true, false, default. A hidden box under it carries the value as t, f or empty (the default:
   M's for that kind where it sets one, else the game's own, which its title says) */
const triOf = (t) => {
  const v = String(t).trim().toLowerCase();
  return !v ? "" : /^f/.test(v) ? "f" : "t";
};
const triWord = (v) => (v === "t" ? "true" : v === "f" ? "false" : "default");
const flagRow = (f, b, t, why) => {
  const v = triOf(t),
    d = triWord(triOf(b.def));
  return `<div class="sb-row${why ? " bad" : ""}" data-row="${f}"><span>${esc(b.name)}</span><button type="button" class="sb-tog sb-tri${v === "t" ? " on" : v ? "" : " mid"}" data-tog="${f}" aria-pressed="${v === "t" ? "true" : v ? "false" : "mixed"}" title="Default: ${d}">${triWord(v)}</button><input type="hidden" class="sb-box" data-f="${f}" value="${v}"><em class="sb-why">${esc(why)}</em></div>`;
};
/* a header over one part of a spawn's window, numbered like Word's headings as the settings go deeper (plan Phase 2:
   3, 3.4, 3.4.1): SECT is [the section it's under, how many came before] while a block's window is made */
let SECT = null,
  SUB = 0;
const FOLDED = new Set(); // (the headings I folded in a block's window: still folded when it's drawn again, ui.js foldHeads)
/* the number a part gets: 4.2 on a block's front (under its 4.), 2. on a tab's own page, and 4.2.1 for a part inside a
   part (the owner's: "heading 3.4, 3.5 ... 3.6.1") */
const num = () => (SECT[0] ? `${SECT[0]}.${SECT[1]}` : `${SECT[1]}`);
const sect = (t) => {
  if (!SECT) return `<h3 class="sb-sect">${t}</h3>`;
  SECT[1]++;
  SUB = 0;
  return `<h3 class="sb-sect">${num()}${SECT[0] ? "" : "."} ${t}</h3>`;
};
const sub = (t, attr = "") =>
  `<h4 class="sb-sect sb-sect-sub"${attr}>${SECT ? `${num()}.${++SUB} ` : ""}${t}</h4>`;
/* a section of the block's front, with its fold arrow */
const fold = (n, t, html) =>
  `<details class="sb-fold" open><summary class="sb-sect">${n}. ${t}</summary>${html}</details>`;
/* the Type box's words (the owner's, Nov 20 04:39Z: "description of type and how (simple) > list of types inside of
   property > the names of variable names that match and/or matching color") */
const TYPE_SAYS = {
  zone: "A zone. The Spawn, Respawn and Loot tabs here that share its variable name or its color work inside it.",
  spawn: "Spawns in the zone it shares its variable name or color with.",
  respawn:
    "Brings players back in the zone it shares its variable name or color with.",
  loot: "Drops its loot in the zone it shares its variable name or color with.",
};
const colWord = (c) => c[0].toUpperCase() + c.slice(1);
/* the ties, one line each: who (its type), then the variable name and the color they share */
function tiesList(pts, held, who, q) {
  return `<ul class="sb-ties">${held
    .map(([id, t]) => {
      const o = q || pts[id],
        how = [
          t.name ? `variable ${esc(sbNameOf(o))}` : "",
          t.col ? `color ${esc(colWord(o.col))}` : "",
        ]
          .filter(Boolean)
          .join(" and ");
      return `<li>${esc(who(id))}: ${how}</li>`;
    })
    .join("")}</ul>`;
}
/* a zone's Type: what it is, and each tab it holds */
function heldHTML(pts, zid) {
  const held = sbHeld(pts, zid);
  return `<p class="sb-tip">${esc(TYPE_SAYS.zone)}</p>${
    held.length
      ? tiesList(pts, held, (q) => {
          const k = pts[q].k;
          return (PURPOSES.find(([v]) => v === k) || [k, k])[1];
        })
      : `<p class="sb-ties">Nothing in it yet.</p>`
  }`;
}
/* what a zone is: just a zone, a spawn or a respawn (the owner's, Nov 20 02:37Z: "it will have you choose if it's just a
   default zone, if it's a spawn, if it's a respawn"); loot is a tab now, and a loot spot of an older save keeps its own */
const PURPOSES = [
  ["zone", "Zone"],
  ["spawn", "Spawn"],
  ["respawn", "Respawn"],
  ["loot", "Loot"],
];
export function sbSettings(getR, id, tab = "") {
  const R = getR(),
    pts = R && ptsOf(R.state),
    p = pts && pts[id];
  if (!p || !sbMay(R.state, R.me, "b")) return;
  const typed = (f) => typedOr(p, f),
    why = (f) => (p.f[f] ? boxWhy(f, p.f[f].t) : ""),
    spawn = p.k === "spawn",
    loot = p.k === "loot", // (a loot orb's spot: sblootview.js)
    zone = p.k === "zone", // (a zone: sbzone.js)
    baseId = p.grp && pts[p.grp] ? p.grp : id,
    pages = Object.entries(pts).filter(([, q]) => q.grp === baseId),
    players = p.pg === "pl" || (!p.grp && tab === "pl"),
    zmaps = baseMode(R.state.options) === "l4dd",
    what = boxText(p, "what").split(/[\s,]+/),
    kinds = grShown(R.state, R.me, kindsFor(R.state)), // (less the made NPCs I keep out of my lists: sbgroupview.js)
    onlyZ = (ks) => zmaps && !ks.some((k) => k && k !== "zombie"), // (the zombie maps' zombies walk their own way: l4ddrules.js)
    look = spawn && !players && tab === "ap", // (its Appearance tab: sbmake.js)
    pick = boxText(p, "pick"),
    base = pts[baseId],
    purpose = (k) => (PURPOSES.find((x) => x[0] === k) || [k, k])[1],
    tabs = [
      ...(base.k === "spawn"
        ? [
            [baseId, "", "Entities"],
            [baseId, "pl", "Players"],
            [baseId, "ap", "Appearance"],
          ]
        : [[baseId, "", purpose(base.k)]]),
      ...pages.map(([q, P]) => [
        q,
        "",
        P.pg === "t"
          ? `${purpose(P.k)}${P.f.name ? " " + P.f.name.t : ""}` // (its type and its variable name)
          : boxText(P, "name"),
      ]),
    ],
    on = (t) =>
      t[0] === id &&
      (p.grp ? true : t[1] === (players ? "pl" : look ? "ap" : ""));
  const head = `<div class="sb-tabs" role="tablist">${tabs
      .map(
        (t) =>
          `<button type="button" class="sb-tab${on(t) ? " on" : ""}" role="tab" aria-selected="${on(t)}" data-tab="${t[0]}" data-tk="${t[1]}">${esc(t[2])}</button>`,
      )
      .join(
        "",
      )}<span class="sb-plus"><button type="button" class="sb-tab" data-plus aria-label="Add a page">+</button><span class="sb-plus-pick" hidden>${base.k === "spawn" ? `<button type="button" class="sb-tab" data-page="ent">Entity page</button><button type="button" class="sb-tab" data-page="pl">Player page</button>` : ""}${SB_TABS.map(([k, l]) => `<button type="button" class="sb-tab" data-page="${k}">${l}</button>`).join("")}</span></span></div>`,
    linked = (spawn || p.k === "respawn") && !p.grp;
  let colorRow = `<div class="sb-row"><span>Color</span><span class="sb-cols">${colSwatches(p.col, "data-col", true)}</span></div>${
      ["spawn", "respawn", "loot", "zone"].includes(p.k) && p.col !== SB_NOCOL
        ? `<p class="sb-tip">Every ${p.pg === "pl" ? "Player page" : p.k} of this color has these settings.</p>`
        : ""
    }${linked ? flagRow("hide", SB_FLAGS.hide, typed("hide"), why("hide")) : ""}`,
    /* a spawn's Trigger together: the colors whose spawns go off with it (sbspawn.js press) */
    tgRow = () => {
      const used = [
        ...new Set(
          Object.values(pts)
            .filter((q) => q.k === "spawn" && !q.grp && q.pg !== "pl")
            .map((q) => q.col),
        ),
      ].filter((c) => c !== p.col || c === SB_NOCOL);
      return pickRow(
        "tg",
        SB_TEXT.tg.name,
        used.map((c) => [
          c,
          c === SB_NOCOL ? "No color" : c[0].toUpperCase() + c.slice(1),
        ]),
        boxText(p, "tg")
          .toLowerCase()
          .split(/[\s,]+/),
      );
    };
  /* the block's front (plan Phase 2: "Front of each tab, in this order, each a section with a header and a fold arrow:
     Shape (with its size), Color ..., Purpose"): on the block itself, not on a spawn's pages, Players or Appearance */
  const front = !p.grp && !players && !look,
    shapeNow = sbShape(p),
    /* what the block is (the owner's, Nov 20 02:37Z): a zone (a block's own kind) shows Spawn or Respawn once it has
       that tab; a block of an older kind shows its own */
    typeNow =
      p.k !== "zone"
        ? p.k
        : (pages.find(
            ([, q]) => q.pg === "t" && /^(spawn|respawn)$/.test(q.k),
          ) || [, { k: "zone" }])[1].k,
    zonesHere = sbZonesOn(pts, id),
    /* a Spawn, Respawn or Loot tab: its Caller, and the error at its top while it names no zone (the owner's, Nov 20
       02:45Z: "the error will say make tab that shares caller or variable name") */
    /* a Spawn, Respawn or Loot tab: what it is, and the zone it's tied to, or the error at its top while none is (the
       owner's, Nov 20 04:39Z: tied "by color or variable or both, not by a selection"); a Zone tab: what it holds */
    callHTML = sbNeedsCall(p)
      ? `<p class="sb-tip">${esc(TYPE_SAYS[p.k])}</p>${sbTabLive(pts, id) ? tiesList(pts, [[sbCallZone(pts, id), sbTie(p, pts[sbCallZone(pts, id)])]], (z) => `In zone ${sbNameOf(pts[z])}`, p) : `<p class="sb-err" role="alert">${esc(SB_CALL_ERR)}</p>`}${flagRow("inv", SB_FLAGS.inv, typed("inv"), why("inv"))}`
      : p.grp && p.k === "zone"
        ? heldHTML(pts, id)
        : "",
    frontHTML = front
      ? fold(
          1,
          "Type",
          `${p.k === "zone" ? heldHTML(pts, id) : ""}<div class="sb-row"><span>This zone is</span><span class="sb-what">${PURPOSES.filter(
            ([v]) => v !== "loot" || p.k === "loot",
          )
            .map(
              ([v, n]) =>
                `<label><input type="radio" name="sb-purpose" data-purpose value="${v}"${typeNow === v ? " checked" : ""}> ${n}</label>`,
            )
            .join(
              "",
            )}</span></div>${zonesHere.length > 1 ? `<div class="sb-row" data-row="lead"><span>${esc(SB_CALL.lead.name)}</span><select class="sb-box" data-f="lead" aria-label="${esc(SB_CALL.lead.name)}">${zonesHere.map((z) => `<option value="${z === id ? "" : z}"${z === zonesHere[0] ? " selected" : ""}>${esc(sbNameOf(pts[z]))}${z === id ? " (this tab)" : ""}</option>`).join("")}</select><em class="sb-why"></em></div>` : ""}`,
        ) +
        fold(
          2,
          "Shape",
          `<div class="sb-row"><span>${SB_SHAPE.sh.name}</span><span class="sb-what">${Object.entries(
            SB_SHAPES,
          )
            .map(
              ([v, n]) =>
                `<label><input type="radio" name="sb-sh" data-sh="${v}"${shapeNow === v ? " checked" : ""}> ${n}</label>`,
            )
            .join("")}</span></div>
          ${row("zw", SB_ZONE.zw, p.f.zw ? typed("zw") : String(sbSize(p)[0] / SB_ZONE.zw.per), why("zw"))}
          ${row("zh", SB_ZONE.zh, p.f.zh ? typed("zh") : String(sbSize(p)[1] / SB_ZONE.zh.per), why("zh"))}
          ${flagRow("fill", SB_SHAPE.fill, typed("fill"), why("fill"))}`,
        ) +
        fold(3, "Color", colorRow)
      : "";
  if (front) colorRow = ""; // (it's in the front now)
  SECT = front ? [4, 0] : [0, 0];
  /* the settings "Use these settings" switches: marked, and hidden while it's off (they don't count then) */
  const own = (html) =>
    SB_OWN.reduce(
      (h, f) =>
        h.replace(
          `data-row="${f}"`,
          `data-row="${f}" data-own${ownOn(p) ? "" : " hidden"}`,
        ),
      html,
    );
  const entity = () =>
    own(`${sect("Spawn")}${colorRow}
    ${p.grp ? "" : tgRow()}
    ${row("name", { name: "Variable name" }, typed("name"), why("name"))}
    <div class="sb-row"><span>Spawns</span><span class="sb-what">${kinds
      .map(
        ([k, n]) =>
          `<label><input type="checkbox" data-what="${esc(k)}"${what.includes(k) ? " checked" : ""}> ${esc(n)}</label>`,
      )
      .join("")}</span></div>
    ${p.grp ? `<div class="sb-row"><span>Appearance</span><span class="sb-what"><button type="button" class="btn small ghost" data-ap>Change…</button></span></div>` : ""}
    <div class="sb-row" data-row="pick"${what.filter((k) => kinds.some((x) => x[0] === k)).length > 1 ? "" : " hidden"}><span>Which one</span><span class="sb-what">${[
      ["random", "Random"],
      ["shuffle", "Shuffle"],
    ]
      .map(
        ([v, n]) =>
          `<label><input type="radio" name="sb-pick" data-pick="${v}"${pick === v ? " checked" : ""}> ${n}</label>`,
      )
      .join("")}</span></div>
    ${sub("Who they go after", ` data-row="actshead"${onlyZ(what) ? " hidden" : ""}`)}<div class="sb-actrows" data-row="acts"${onlyZ(what) ? " hidden" : ""}>${Object.keys(
      SB_ACTS,
    )
      .map((f) => actRow(R.state, p, f, kinds))
      .join("")}</div>
    ${row("key", { name: "Spawn key" }, typed("key"), why("key"))}
    ${brainRow(typed("brain"), why("brain"))}
    ${sect("True or false")}
    ${flagRow("sets", SB_FLAGS.sets, typed("sets"), why("sets"))}
    ${Object.entries(SB_FLAGS)
      .filter(
        ([f]) =>
          f !== "sets" && f !== "hide" && !(f === "inv" && sbNeedsCall(p)),
      ) // (a tab's Inverse sits at its top, by its zone: once is enough)
      .map(([f, b]) => flagRow(f, b, typed(f), why(f)))
      .join("")}
    ${sect("Numbers")}
    ${Object.entries(SB_BOXES)
      .map(([f, b]) => row(f, b, typed(f), why(f)))
      .join("")}`);
  const playersPage =
    () => `${p.grp ? row("name", { name: "Variable name" }, typed("name"), why("name")) : ""}
    ${flagRow("pon", SB_PLAYER.pon, typed("pon"), why("pon"))}
    ${row("pwho", { name: "Who spawns here" }, typed("pwho"), why("pwho"))}
    ${row("php", { name: "HP (blank: the game's)" }, typed("php"), why("php"))}
    ${row("pspd", { name: "Speed (blank: the game's)" }, typed("pspd"), why("pspd"))}`;
  const respawn = () => `${colorRow}
    ${row("name", { name: "Variable name" }, typed("name"), why("name"))}
    ${row("who", { name: "Who respawns here" }, typed("who"), why("who"))}
    ${(p.im || [])
      .filter((f) => f !== "ap")
      .map((f) =>
        SB_ACTS[f]
          ? actRow(R.state, p, f, kindsFor(R.state))
          : SB_FLAGS[f]
            ? flagRow(f, SB_FLAGS[f], typed(f), why(f))
            : row(f, SB_BOXES[f], typed(f), why(f)),
      )
      .join(
        "",
      )}${(p.im || []).includes("ap") ? `<p class="sb-none">Appearance: the look its spawn had when it was imported.</p>` : ""}`;
  /* a zone's page: what it does and to whom, its size, and what spawns in it (sandboxrules.js SB_ZONE) */
  const zonePage = () => {
    const named = (k, end) =>
        Object.values(pts)
          .filter((q) => q.k === k && !q.grp && q.pg !== "pl")
          .map((q) => [q.col, `${boxText(q, "name")} ${end}`]),
      picked = (f) =>
        boxText(p, f)
          .toLowerCase()
          .split(/[\s,]+/);
    return `${row("name", { name: "Variable name" }, typed("name"), why("name"))}
    ${colorRow}${flagRow("hide", SB_FLAGS.hide, typed("hide"), why("hide"))}${flagRow("inv", SB_FLAGS.inv, typed("inv"), why("inv"))}${flagRow("dark", SB_FLAGS.dark, typed("dark"), why("dark"))}
    ${(() => {
      /* "Is wall" (the owner's: "you select is wall, and now players can't go through it. Like it's a true or false"):
         true stops everything until "Who can't pass" says who; false stops nobody */
      const on = !!boxText(p, "wall").trim();
      return `<div class="sb-row" data-row="iswall"><span>Is wall</span><button type="button" class="sb-tog${on ? " on" : ""}" data-iswall aria-pressed="${on}">${on ? "true" : "false"}</button></div><div data-fxrow="wall"${on ? "" : " hidden"}>${actRow(R.state, p, "wall", kinds)}</div>`;
    })()}
    ${
      sbOnBoard(R.state)
        ? row("fl", SB_ZONE.fl, typed("fl"), why("fl")) // (the flat board: only how high it is, over the ducks from 2: a roof, row 161)
        : `${row("fl", SB_ZONE.fl, typed("fl"), why("fl"))}${flagRow("gnd", SB_ZONE.gnd, typed("gnd"), why("gnd"))}${row("land", SB_ZONE.land, typed("land"), why("land"))}${row("slto", SB_ZONE.slto, typed("slto"), why("slto"))}<div class="sb-row" data-row="sldir"><span>${esc(SB_ZONE.sldir.name)}</span><select class="sb-box" data-f="sldir" aria-label="${esc(SB_ZONE.sldir.name)}">${Object.entries(
            SB_SLOPE_DIRS,
          )
            .map(
              ([v, n]) =>
                `<option value="${v}"${v === (boxText(p, "sldir").trim() || "n") ? " selected" : ""}>${esc(n)}</option>`,
            )
            .join(
              "",
            )}</select><em class="sb-why"></em></div>${actRow(R.state, p, "clm", kinds)}`
    }
    ${olSect(R.state, p, kinds)}
    ${lookSect(R.state, p, row, typed, why)}
    ${brainRow(typed("brain"), why("brain"))}
    <div class="sb-row" data-row="sfx"><span>${esc(SB_ZONE.sfx.name)}</span><select class="sb-box" data-f="sfx" aria-label="${esc(SB_ZONE.sfx.name)}">${Object.entries(
      SB_SFX,
    )
      .map(
        ([v, n]) =>
          `<option value="${v}"${v === sbSfx(p) ? " selected" : ""}>${esc(n)}</option>`,
      )
      .join("")}</select><em class="sb-why"></em></div>${(() => {
      const pk = boxText(p, "sfxpic"),
        img = pk && R.state.sbpic && R.state.sbpic[pk];
      return `<div class="sb-row sb-up" data-sfxrow="pic"${sbSfx(p) === "pic" ? "" : " hidden"}><span>${esc(SB_ZONE.sfxpic.name)}</span><span class="sb-what"><label class="btn small"><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden data-lkup="sfxpic">Upload</label>${img ? `<img class="sb-up-pic" src="${img.d}" alt="The effect's picture">` : ""}<em class="small dim sb-lk-note">2 MB at most. Made into pixels.</em></span></div><div class="sb-row" data-row="sfxz" data-sfxrow="z"${domSfx(sbSfx(p)) ? "" : " hidden"}><span>${esc(SB_ZONE.sfxz.name)}</span><span class="sb-what">${Object.entries(
        SB_SFX_Z,
      )
        .map(
          ([v, n]) =>
            `<label><input type="radio" name="sb-sfxz" data-sfxz="${v}"${sbSfxZ(p) === v ? " checked" : ""}> ${n}</label>`,
        )
        .join("")}</span></div>`;
    })()}
    ${flagRow("pon", SB_PLAYER.pon, typed("pon"), why("pon"))}
    ${row("pwho", { name: "Who spawns here" }, typed("pwho"), why("pwho"))}
    ${pickRow("ent", SB_ZONE.ent.name, named("spawn", "spawn"), picked("ent"))}
    ${pickRow("lt", SB_ZONE.lt.name, named("loot", "loot"), picked("lt"))}`;
  };
  /* its potential order, the last section of every tab (plan Phase 3): which of its squares act, and when */
  const ordT = (f) => (p.f[f] ? p.f[f].t : SB_ORDER[f].def),
    sel = (f, opts) =>
      `<select class="sb-box" data-f="${f}" aria-label="${esc(SB_ORDER[f].name)}">${Object.entries(
        opts,
      )
        .map(
          ([v, n]) =>
            `<option value="${v}"${v === ordT(f).trim() ? " selected" : ""}>${esc(n)}</option>`,
        )
        .join("")}</select>`,
    /* a zone's Act, the first row of its potential order (sandboxrules.js SB_FX): a dropdown, and under it only the rows
       that matter to what's picked: Seriat's boxes, HP each time, Seconds between, Who it hits */
    fx = SB_FX[boxText(p, "fx").trim()] ? boxText(p, "fx").trim() : "none",
    actSect = () =>
      `<div class="sb-row" data-row="fx"><span>${esc(SB_ZONE.fx.name)}</span><select class="sb-box" data-f="fx" aria-label="${esc(SB_ZONE.fx.name)}">${Object.entries(
        SB_FX,
      )
        .map(
          ([v, n]) =>
            `<option value="${v}"${v === fx ? " selected" : ""}>${esc(n)}</option>`,
        )
        .join("")}</select><em class="sb-why"></em></div>
    <div data-fxrow="sa"${fx === "seriat" ? "" : " hidden"}><div class="sb-sarows">${sbSaRows(
      p,
    )
      .map(saRow)
      .join(
        "",
      )}</div><p class="acts sb-saadd"><button type="button" class="btn small" data-saadd aria-label="Another Seriat box">+</button></p></div>
    <div data-fxrow="amt"${fx === "damage" || fx === "heal" ? "" : " hidden"}>${row("amt", SB_ZONE.amt, typed("amt"), why("amt"))}</div>
    <div data-fxrow="rate"${fx === "none" ? " hidden" : ""}>${row("rate", SB_ZONE.rate, typed("rate"), why("rate"))}</div>
    <div data-fxrow="zwho"${fx === "none" ? " hidden" : ""}>${actRow(R.state, p, "zwho", kinds)}</div>`,
    orderSect = () =>
      `${sect("Potential order")}${zone ? actSect() : ""}<div class="sb-row" data-row="ord"><span>${esc(SB_ORDER.ord.name)}</span><span class="sb-ordbox">${sel("ord", SB_ORDERS)}${sel("dir", SB_DIRS)}</span><em class="sb-why"></em></div>
    ${row("n", SB_ORDER.n, ordT("n"), "")}
    ${row("sq", SB_ORDER.sq, ordT("sq"), "")}
    ${row("st", SB_ORDER.st, ordT("st"), "")}
    ${row("off", SB_ORDER.off, ordT("off"), "")}
    <div class="sb-row" data-row="go"><span>${esc(SB_ORDER.go.name)}</span>${sel("go", SB_GOES)}<em class="sb-why"></em></div>`;
  const html = `<h2>${loot && !p.grp ? "Loot" : "Zone"}</h2>${head}
  ${base.lock ? `<p class="sb-tip sb-lockd">Locked: right-click it and pick Unlock to change it.</p>` : ""}<div class="sb-set"${base.lock ? " inert" : ""}>${callHTML}${frontHTML}${front ? `<h3 class="sb-sect sb-sect-top">4. ${PURPOSES.find(([v]) => v === p.k)[1]} settings</h3>` : ""}${
    loot
      ? lootPage(R.state, id, p, {
          row,
          flagRow,
          typed,
          why,
          colorRow,
          sect,
          act: (f) => actRow(R.state, p, f, kinds),
        })
      : zone
        ? zonePage()
        : !spawn
          ? respawn()
          : players
            ? playersPage()
            : look
              ? lookPage(R.state, p)
              : entity()
  }${look ? "" : jgRow(R.state, R.me, p)}${players || look ? "" : orderSect()}</div>
  <p class="acts">${spawn && !players && !look ? `<button type="button" class="btn" data-go>Spawn</button>` : ""}${!spawn && !loot && !zone ? `<button type="button" class="btn" data-imp>Import settings</button>` : ""}${base.lock ? "" : `<button type="button" class="btn ghost" data-del>${p.grp ? (p.pg === "t" ? "Delete tab" : "Delete page") : "Delete"}</button>`}</p>`;
  openWindow(html, {
    cls: zoneLike(p) ? "sb-setwin sb-zonewin" : "sb-setwin",
    onOpen(w, close) {
      lookPrevs(w); // (a zone's Look: the whole maps' pictures)
      const set = w.querySelector(".sb-set");
      if (set)
        foldHeads(
          set,
          "h3.sb-sect, h4.sb-sect",
          (h) =>
            h.classList.contains("sb-sect-top")
              ? 1
              : h.classList.contains("sb-sect-sub")
                ? 3
                : 2,
          FOLDED,
        );
      const send = (a) => {
        const r = getR();
        if (r) r.send({ t: "sb", p: id, ...a });
      };
      /* a zone's Look color: the ready colors and the paintbrush, as the customize menu has them (the owner's: "solid
         colors ... like you do in the customization menu") */
      for (const f of w.querySelectorAll(".sb-lkcolf")) {
        const box = f.parentNode.querySelector('.sb-box[data-f="lkcol"]');
        f.append(
          colorField(f.dataset.c, (c) => {
            box.value = c;
            box.dispatchEvent(new Event("input", { bubbles: true }));
          }),
        );
      }
      const timers = {};
      /* a Brain: its file (and the files it uses) go to the room first, from my Seriat folder (seriatwin.js, loaded
         when it's wanted: it brings the command line) */
      const sendBrain = (i) =>
        brainCheck(i).then((files) => {
          if (!files) return;
          send({ k: "nbf", files });
          send({ k: "set", f: "brain", v: i.value.trim() });
        });
      if (loot) lootWire(w, id, send, getR);
      w.addEventListener("input", (e) => {
        const sv = e.target.closest(".sb-saval");
        if (sv) {
          const bad = saWhy(sv.value),
            lab = sv.closest(".sb-row");
          lab.classList.toggle("bad", !!bad);
          lab.querySelector(".sb-why").textContent = bad;
          clearTimeout(timers.sa);
          timers.sa = setTimeout(
            () => send({ k: "set", f: "sa", v: saRead(w) }),
            250,
          );
          return;
        } // (a zone's Seriat box: all of them go as one)
        const i = e.target.closest(".sb-box");
        if (!i) return;
        const f = i.dataset.f,
          bad = boxWhy(f, i.value),
          lab = i.closest(".sb-row");
        lab.classList.toggle("bad", !!bad);
        lab.querySelector(".sb-why").textContent = bad;
        if (f === "sets" && !bad)
          w.querySelectorAll("[data-own]").forEach(
            (r) => (r.hidden = /^f/i.test(i.value.trim())),
          ); // (off: what it spawns comes as it is)
        clearTimeout(timers[f]);
        if (f === "brain" && !bad && i.value.trim())
          return (timers[f] = setTimeout(() => sendBrain(i), 250));
        timers[f] = setTimeout(() => send({ k: "set", f, v: i.value }), 250);
      });
      w.addEventListener("change", (e) => {
        const t = e.target;
        if (t.closest(".sb-olbox")) return olWrite(t.closest(".sb-olbox")); // (a zone's Outlines rows)
        if (t.closest(".sb-saon")) {
          const d = t.closest(".sb-saon");
          d.querySelector("summary").textContent = summaryOf([
            ...d.querySelectorAll("input:checked"),
          ]);
          return send({ k: "set", f: "sa", v: saRead(w) });
        } // (what a Seriat box acts on)
        if (t.matches('[data-f="fx"]')) {
          const v = t.value,
            show = {
              sa: v === "seriat",
              amt: v === "damage" || v === "heal",
              rate: v !== "none",
              zwho: v !== "none",
            };
          for (const [r, on] of Object.entries(show))
            w.querySelector(`[data-fxrow="${r}"]`).hidden = !on;
        } // (a zone's Act: only the rows that matter to it; the box itself is sent as picked)
        if (t.matches('.sb-box[data-f="name"]') && !boxWhy("name", t.value)) {
          clearTimeout(timers.name);
          send({ k: "set", f: "name", v: t.value });
          setTimeout(() => w.isConnected && again(id, tab), 400); // (a new name: the tabs it's tied to, and its error, show anew)
          return;
        }
        if (t.matches('[data-f="lk"]'))
          for (const r of w.querySelectorAll("[data-lkrow]"))
            r.hidden =
              r.dataset.lkrow === "op"
                ? t.value === "none"
                : r.dataset.lkrow !== t.value; // (a zone's Look: only its own rows; the box itself is sent as typed)
        if (t.matches("[data-lktex]")) {
          w.querySelectorAll(".sb-lktex").forEach((l) =>
            l.classList.toggle("on", l.contains(t)),
          );
          return send({ k: "set", f: "lktex", v: t.dataset.lktex });
        }
        if (t.matches("[data-lkup]")) {
          const r = getR(),
            f = t.dataset.lkup || "lkpic", // (the Look's picture, or the effect's)
            note = t.closest(".sb-row").querySelector(".sb-lk-note");
          const file = t.files[0];
          t.value = ""; // (the same file can be picked again)
          return picFrom(file, LOOK_PX).then(
            (pic) => {
              if (!pic) return; // (closed without cropping)
              note.textContent = "Sending…";
              send({ k: "set", f, v: sendParts(r, pic) });
              setTimeout(() => again(id), 400);
            },
            (err) => {
              note.textContent = err.message;
            },
          );
        }
        if (t.matches("[data-sfxz]"))
          return send({ k: "set", f: "sfxz", v: t.dataset.sfxz });
        if (t.matches('[data-f="sfx"]')) {
          w.querySelector('[data-sfxrow="pic"]').hidden = t.value !== "pic";
          w.querySelector('[data-sfxrow="z"]').hidden = !domSfx(t.value);
        } // (the box itself is sent as typed)
        if (t.matches("[data-sh]"))
          return send({ k: "set", f: "sh", v: t.dataset.sh });
        if (t.matches("[data-purpose]")) {
          const v = t.value;
          /* a zone stays a zone: Spawn or Respawn adds that tab, tied to it by its Caller, and opens it (the owner's, Nov
             20 02:45Z: "every build option is going to have a tab for zones regardless") */
          if (p.k === "zone" && (v === "spawn" || v === "respawn")) {
            const r = getR(),
              had = new Set(Object.keys(ptsOf(r.state))),
              has = pages.find(([, q]) => q.pg === "t" && q.k === v);
            if (has) return again(has[0]);
            if (had.size >= SB_POINTS)
              return toast(
                `The zone budget is full (${SB_POINTS}). Delete a block or a tab first.`,
              );
            send({ k: "page", kind: v, tie: 1 }); // (tied to this zone by its variable name and color)
            return setTimeout(() => {
              const made = Object.keys(ptsOf(getR().state)).find(
                (q) => !had.has(q),
              );
              if (w.isConnected) again(made || id);
            }, 400);
          }
          if (p.k === "zone") {
            const tabs = pages.filter(
              ([, q]) => q.pg === "t" && /^(spawn|respawn)$/.test(q.k),
            );
            if (tabs.length)
              toast(
                "It's a zone with a Spawn or Respawn tab: delete that tab to make it just a zone.",
              );
            return setTimeout(() => w.isConnected && again(id), 50);
          }
          send({ k: "kind", v }); // (a block of an older kind: it becomes what's picked)
          return setTimeout(() => w.isConnected && again(id), 400); // (that purpose's own settings, once the room has it)
        }
        if (t.matches("[data-pick]"))
          return send({ k: "set", f: "pick", v: t.dataset.pick });
        const act = t.closest("[data-act]");
        if (act) {
          const f = act.dataset.act,
            on = [...w.querySelectorAll(`[data-act="${f}"] input:checked`)]; // (the entities' dropdown and the groups' under it: one list)
          act.querySelector("summary").textContent = summaryOf([
            ...act.querySelectorAll("input:checked"),
          ]);
          return send({
            k: "set",
            f,
            v:
              on.map((c) => c.value).join(", ") ||
              (f === "zwho" || f === "ltake" ? "nobody" : ""), // (a zone that hits nobody, a loot nobody takes: their default is Players)
          });
        }
        if (t.matches("[data-look]")) {
          w.querySelectorAll(".sb-ap").forEach((l) =>
            l.classList.toggle("on", l.contains(t)),
          );
          return send({ k: "look", ap: lookFor(t.dataset.look) });
        }
        if (t.matches("[data-up]")) {
          const r = getR(),
            note = w.querySelector(".sb-up-note");
          const file = t.files[0];
          t.value = ""; // (the same file can be picked again)
          return picFrom(file).then(
            (pic) => {
              if (!pic) return; // (closed without cropping)
              note.textContent = "Sending…";
              sendPic(r, id, pic);
              setTimeout(() => again(id, "ap"), 400);
            },
            (err) => {
              note.textContent = err.message;
            },
          );
        }
        if (!t.matches("[data-what]")) return;
        const on = [...w.querySelectorAll("[data-what]:checked")];
        w.querySelector('[data-row="pick"]').hidden = on.length < 2; // (Random or Shuffle: only with more than one)
        const acts = w.querySelector('[data-row="acts"]');
        if (acts) acts.hidden = onlyZ(on.map((c) => c.dataset.what));
        const ah = w.querySelector('[data-row="actshead"]');
        if (ah && acts) ah.hidden = acts.hidden;
        sendKinds(
          getR(),
          on.map((c) => c.dataset.what),
        ); // (a made NPC of mine: to the room first)
        send({
          k: "set",
          f: "what",
          v: on.map((c) => c.dataset.what).join(", "),
        });
      });
      /* again, as it is now (another tab, a new page, what was imported) */
      const again = (to, tk = "") => {
        close(null);
        setTimeout(() => sbSettings(getR, to, tk), 0);
      };
      w.addEventListener("click", (e) => {
        const olb = e.target.closest("[data-olplus], [data-olx]");
        if (olb) {
          const box = olb.closest(".sb-olbox"),
            rows = box.querySelectorAll(".sb-olrow");
          if (olb.matches("[data-olplus]")) {
            const r = rows[rows.length - 1].cloneNode(true);
            r.querySelector("details").open = false;
            olb.before(r); // (a copy of the last row, for another color)
          } else if (rows.length > 1) olb.closest(".sb-olrow").remove();
          else {
            const r = olb.closest(".sb-olrow");
            r.querySelectorAll("input[type=checkbox]").forEach(
              (c) => (c.checked = false),
            );
            r.querySelector(".sb-olcol").value = SB_OL_DEF;
          } // (the last row: emptied)
          return olWrite(box);
        }
        if (e.target.closest("[data-iswall]")) {
          const on = !e.target
            .closest("[data-iswall]")
            .classList.contains("on");
          send({ k: "set", f: "wall", v: on ? "everything" : "" });
          return setTimeout(() => w.isConnected && again(id, tab), 300);
        }
        /* a zone's Seriat boxes (saRow): another one, one taken away, a file brought in */
        const saSend = () => send({ k: "set", f: "sa", v: saRead(w) });
        if (e.target.closest("[data-saadd]")) {
          w.querySelector(".sb-sarows").insertAdjacentHTML(
            "beforeend",
            saRow({ v: "", on: [] }),
          );
          return w.querySelector(".sb-sarow:last-child .sb-saval").focus();
        }
        if (e.target.closest("[data-sax]")) {
          const rows = w.querySelectorAll(".sb-sarow"),
            el = e.target.closest(".sb-sarow");
          if (rows.length > 1) el.remove();
          else el.outerHTML = saRow({ v: "", on: [] }); // (the last one: emptied, never gone)
          return saSend();
        }
        const sf = e.target.closest("[data-safile]");
        if (sf) {
          const el = sf.closest(".sb-sarow"),
            box = el.querySelector(".sb-saval");
          box.value = sf.dataset.safile;
          el.querySelector(".sb-salist").hidden = true;
          return box.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (e.target.closest("[data-saimp]")) {
          const list = e.target
            .closest(".sb-sarow")
            .querySelector(".sb-salist");
          if (!list.hidden) return (list.hidden = true);
          return import("./brainbuild.js").then(async (m) => {
            /* a file's value: its first line that isn't blank or a # note (a value file holds one) */
            const first = (t) =>
                String(t || "")
                  .split("\n")
                  .map((l) => l.trim())
                  .find((l) => l && !l.startsWith("#")) || "",
              files = (await m.myFiles()).filter((f) => first(f.text));
            list.innerHTML =
              `<span class="sb-brainhead">My files</span>` +
              (files.length
                ? files
                    .map(
                      (f) =>
                        `<button type="button" class="sb-brainfile" data-safile="${esc(first(f.text).slice(0, 120))}">${esc(f.name)}</button>`,
                    )
                    .join("")
                : `<em class="sb-none">Nothing in ${m.MY_FILES}/ yet</em>`);
            list.hidden = false;
          });
        }
        if (npcSetClick(e, w)) return; // (a switch, the Brain box's arrow: shared with M's windows)
        const c = e.target.closest("[data-col]");
        if (c) {
          w.querySelectorAll(".sb-col").forEach((b) =>
            b.classList.toggle("on", b === c),
          );
          send({ k: "set", f: "col", v: c.dataset.col });
          if (c.dataset.col === SB_NOCOL) toast(NOCOL_NOTE, 4500);
          setTimeout(() => w.isConnected && again(id, tab), 400); // (its new color's settings show, once the room has it)
          return;
        }
        const tb = e.target.closest("[data-tab]");
        if (tb && !tb.classList.contains("on"))
          return again(tb.dataset.tab, tb.dataset.tk);
        if (e.target.closest("[data-plus]")) {
          w.querySelector(".sb-plus-pick").hidden = false;
          e.target.closest("[data-plus]").hidden = true;
        }
        const pg = e.target.closest("[data-page]");
        if (pg) {
          const r = getR(),
            had = new Set(Object.keys(ptsOf(r.state)));
          if (had.size >= SB_POINTS)
            return toast(
              `The zone budget is full (${SB_POINTS}). Delete a block or a tab first.`,
            );
          const kind = pg.dataset.page;
          // (a Spawn, Respawn or Loot tab made from a zone's own window is tied to that zone, like the Type radio)
          r.send({
            t: "sb",
            k: "page",
            p: baseId,
            kind,
            ...(SB_TABS.some(([k]) => k === kind) ? { tie: 1 } : {}),
          });
          setTimeout(() => {
            const made = Object.keys(ptsOf(getR().state)).find(
              (q) => !had.has(q),
            );
            again(made || id);
          }, 300);
        }
        if (e.target.closest("[data-ap]")) return again(id, "ap");
        if (e.target.closest("[data-go]")) send({ k: "go" });
        if (e.target.closest("[data-imp]"))
          importWin(getR, id, () => again(id));
        if (e.target.closest("[data-del]")) {
          send({ k: "del" });
          close(null);
        }
      });
    },
  });
}
/* ---------- an NPC's settings, as a spawn sets them, for M ----------
   The owner's, Nov 20 17:25Z: "in ai behaviors, things like ai should be able to have very similiar options to spawn IN
   their UI settings for M". A kind's defaults (kindDefaults) and an NPC I made (customize.js, madeSet) show the same
   rows a spawn's page does, drawn and wired here once: who they go after, their Brain, what they can do, their numbers
   (sandboxrules.js SB_MSET) */
/* a switch's click (default, true, false, default …) or the Brain box's arrow, in any of these windows: true when it
   was one */
function npcSetClick(e, w) {
  const tog = e.target.closest("[data-tog]");
  if (tog) {
    const box = tog.closest(".sb-row").querySelector(".sb-box"),
      v = box.value === "" ? "t" : box.value === "t" ? "f" : ""; // (default, true, false, default …)
    box.value = v;
    tog.classList.toggle("on", v === "t");
    tog.classList.toggle("mid", v === "");
    tog.setAttribute(
      "aria-pressed",
      v === "t" ? "true" : v ? "false" : "mixed",
    );
    tog.textContent = triWord(v);
    box.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  /* the Brain box's arrow: my-files/, and the builder for a new one */
  const bl = e.target.closest(
    "[data-brainlist], [data-brainfile], [data-brainnew]",
  );
  if (bl) {
    const rowEl = bl.closest("[data-row=brain]"),
      list = rowEl.querySelector(".sb-brainlist"),
      input = rowEl.querySelector("[data-f=brain]"),
      arrow = rowEl.querySelector("[data-brainlist]"),
      pick = (v) => {
        list.hidden = true;
        arrow.setAttribute("aria-expanded", "false");
        input.value = v;
        input.dispatchEvent(new Event("input", { bubbles: true })); // (as if typed: it goes to the room)
      };
    if (bl.dataset.brainfile != null) {
      pick(bl.dataset.brainfile);
      return true;
    }
    if (bl.hasAttribute("data-brainnew")) {
      import("./brainbuild.js").then((m) =>
        m.openBrainBuilder((path) => w.isConnected && pick(path)),
      );
      return true;
    }
    if (!list.hidden) {
      list.hidden = true;
      arrow.setAttribute("aria-expanded", "false");
      return true;
    }
    Promise.all([import("./brainbuild.js"), import("./seriathelp.js")]).then(
      async ([m, h]) => {
        const files = await m.myFiles();
        list.innerHTML =
          `<span class="sb-brainhead">My files</span>` +
          (files.length
            ? files
                .map(
                  (f) =>
                    `<button type="button" class="sb-brainfile" data-brainfile="${esc(f.path)}">${esc(f.name)}</button>`,
                )
                .join("")
            : `<em class="sb-none">Nothing in ${m.MY_FILES}/ yet</em>`) +
          `<span class="sb-brainhead">Examples</span>` +
          Object.keys(h.EXAMPLES)
            .map(
              (n) =>
                `<button type="button" class="sb-brainfile" data-brainfile="help/examples/${esc(n)}">${esc(n)}</button>`,
            )
            .join("") +
          `<button type="button" class="sb-brainfile sb-brainnew" data-brainnew>Build a brain…</button>`;
        list.hidden = false;
        arrow.setAttribute("aria-expanded", "true");
      },
    );
    return true;
  }
  return false;
}
/* a Brain box's file (and the files it uses), from my Seriat folder, or null (the row says why): seriatwin.js, loaded
   when it's wanted (it brings the command line) */
const brainCheck = (i) =>
  import("./seriatwin.js").then((m) => {
    const v = i.value.trim(),
      files = v ? m.brainFiles(v) : {},
      lab = i.closest(".sb-row");
    lab.classList.toggle("bad", !files);
    lab.querySelector(".sb-why").textContent = files
      ? ""
      : v.startsWith("~")
        ? `No file by that name that its owner lets you run (x)`
        : `No file by that name in your ${LANG} folder (n)`;
    return files;
  });
/* the rows: p is the NPC as a spawn of it alone would be (its boxes in p.f), typed and why as a spawn's page has them;
   acts: with its behavior lists (a made NPC has them in its own Behavior part) */
function npcSetHTML(s, p, typed, why, kinds, acts = true) {
  SECT = null; // (plain headings: these windows aren't numbered)
  const one = (f) =>
    SB_ACTS[f]
      ? actRow(s, p, f, kinds)
      : f === "brain"
        ? brainRow(typed(f), why(f))
        : SB_FLAGS[f]
          ? flagRow(f, SB_FLAGS[f], typed(f), why(f))
          : row(f, SB_BOXES[f], typed(f), why(f));
  return `<div class="sb-set sb-npcset">${[
    ["Who they go after", Object.keys(SB_ACTS), acts],
    ["Brain", ["brain"], true],
    ["True or false", SB_MSET.filter((f) => SB_FLAGS[f]), true],
    ["Numbers", SB_MSET.filter((f) => SB_BOXES[f]), true],
  ]
    .filter(([, , on]) => on)
    .map(([t, fs]) => sub(t) + fs.map(one).join(""))
    .join("")}</div>`;
}
/* the rows' wiring: put(f, v, files) once a box settles (files: a Brain's, to send to the room first) */
function npcSetWire(w, put) {
  const timers = {};
  w.addEventListener("input", (e) => {
    const i = e.target.closest(".sb-npcset .sb-box");
    if (!i) return;
    const f = i.dataset.f;
    clearTimeout(timers[f]);
    if (f === "brain")
      return (timers[f] = setTimeout(
        () =>
          brainCheck(i).then((files) => files && put(f, i.value.trim(), files)),
        400,
      ));
    const bad = i.value.trim() ? boxWhy(f, i.value) : "",
      lab = i.closest(".sb-row");
    lab.classList.toggle("bad", !!bad);
    lab.querySelector(".sb-why").textContent = bad;
    timers[f] = setTimeout(() => put(f, i.value.trim()), 250); // (emptied: the default again)
  });
  w.addEventListener("change", (e) => {
    const act = e.target.closest(".sb-npcset [data-act]");
    if (!act) return;
    const on = [...act.querySelectorAll("input:checked")];
    act.querySelector("summary").textContent = summaryOf(on);
    put(act.dataset.act, on.map((c) => c.value).join(", "));
  });
  w.addEventListener("click", (e) => {
    if (e.target.closest(".sb-npcset")) npcSetClick(e, w);
  });
}
/* ---------- M: a kind's defaults (sbspawn.js kdOf) ----------
   The four kinds that come with Sandbox, each with the settings a spawn can give it; what's written here is what every
   one of that kind starts with, wherever a spawn didn't write its own (or has "Use these settings" off). The rows in M */
export const kdRows = (R) =>
  Object.entries(SB_WHAT).map(([k, n]) => ({
    label: `${n}: defaults`,
    win: true,
    act: (r) => kindDefaults(() => r, k),
  }));
export function kindDefaults(getR, kind) {
  const R = getR();
  if (!R || !SB_WHAT[kind] || !sbMay(R.state, R.me, "m")) return;
  const kd = kdOf(R.state, kind) || { f: {} },
    p = { k: "kd", col: "red", f: { ...kd.f, what: { t: kind, ok: kind } } }, // (as a spawn of it alone would be)
    html = `<h2>${esc(SB_WHAT[kind])}: defaults</h2>
  <p class="small dim">Every ${esc(SB_WHAT[kind])} starts with these, unless its spawn sets its own.</p>
  ${npcSetHTML(
    R.state,
    p,
    (f) => typedOr(kd, f, p),
    (f) => (kd.f[f] ? boxWhy(f, kd.f[f].t) : ""),
    kindsFor(R.state),
  )}
  <p class="acts"><button type="button" class="btn ghost" data-kdreset>The game's own</button></p>`;
  openWindow(html, {
    cls: "sb-setwin",
    onOpen(w, close) {
      const send = (a) => {
        const r = getR();
        if (r) r.send({ t: "sb", ...a });
      };
      npcSetWire(w, (f, v, files) => {
        if (files) send({ k: "nbf", files });
        send({ k: "kd", kind, f, v });
      });
      w.addEventListener("click", (e) => {
        if (!e.target.closest("[data-kdreset]")) return;
        send({ k: "kd", kind, reset: true });
        close(null);
        setTimeout(() => kindDefaults(getR, kind), 300);
      });
    },
  });
}
/* an NPC I made (sbnpcs.js): the same rows in its Customize, under its behavior lists. n.set keeps what was typed
   (f: text); save() keeps it (on my device, or back to the room for another player's) */
export const madeSet = {
  html(n) {
    const R = activeRoom(),
      fs = msetOf(n.set || {}),
      p = {
        k: "kd",
        col: "red",
        f: { ...fs, what: { t: "c:" + n.id, ok: "c:" + n.id } },
      };
    return npcSetHTML(
      R ? R.state : {},
      p,
      (f) => typedOr({ f: fs }, f, p),
      (f) => (fs[f] ? boxWhy(f, fs[f].t) : ""),
      [],
      false,
    );
  },
  wire(w, n, save) {
    npcSetWire(w, (f, v, files) => {
      const R = activeRoom();
      if (files && R) R.send({ t: "sb", k: "nbf", files });
      const set = { ...(n.set || {}) };
      if (v === "") delete set[f];
      else set[f] = v;
      n.set = set;
      save();
    });
  },
};
/* a respawn's Import settings (the owner's Sandbox file): the spawn's settings by category, each a dropdown whose bold
   first row checks all of it; "Import" for the ones checked, or with none checked "Import all options" after an "Are you
   sure?". The button stays at the bottom while the list scrolls; options import in the spawn menu's order (sbspawn.js) */
function importWin(getR, id, then) {
  const p = ptsOf(getR().state)[id];
  if (!p) return;
  const had = p.im || [],
    html = `<h2>Import settings</h2>
  <div class="sb-imp">${SB_IMPORT.map(
    ([cat, fs], i) =>
      `<details class="sb-cat"><summary>${esc(cat)}</summary><label class="sb-cat-all"><input type="checkbox" data-cat="${i}"> <b>${esc(cat)}</b></label>${fs
        .map(
          (f) =>
            `<label><input type="checkbox" data-in="${i}" value="${f}"${had.includes(f) ? " checked disabled" : ""}> ${esc(nameOf(f))}</label>`,
        )
        .join("")}</details>`,
  ).join("")}</div>
  <p class="acts sb-imp-go"><button type="button" class="btn" data-imp-go>Import all options</button></p>`;
  openWindow(html, {
    cls: "sb-impwin",
    onOpen(w, close) {
      const picked = () =>
          [...w.querySelectorAll("[data-in]:checked:not(:disabled)")].map(
            (c) => c.value,
          ),
        label = () =>
          (w.querySelector("[data-imp-go]").textContent = picked().length
            ? "Import"
            : "Import all options");
      w.addEventListener("change", (e) => {
        const t = e.target;
        if (t.matches("[data-cat]"))
          w.querySelectorAll(
            `[data-in="${t.dataset.cat}"]:not(:disabled)`,
          ).forEach((c) => (c.checked = t.checked));
        if (t.matches("[data-in]")) {
          const i = t.dataset.in,
            all = [...w.querySelectorAll(`[data-in="${i}"]`)];
          w.querySelector(`[data-cat="${i}"]`).checked = all.every(
            (c) => c.checked,
          );
        }
        label();
      });
      w.addEventListener("click", async (e) => {
        if (!e.target.closest("[data-imp-go]")) return;
        let fs = picked();
        if (!fs.length) {
          if (!(await confirmBox("Import all options", "Are you sure?")))
            return;
          fs = SB_IMPORT.flatMap(([, f]) => f);
        }
        const r = getR();
        if (r) r.send({ t: "sb", k: "imp", p: id, fs });
        close(null);
        setTimeout(then, 300);
      });
    },
  });
}

/* the Build window's options (sandbox.js): a spawn, a respawn, loot (an orb's spot: sbloot.js) or a zone (sbzone.js).
   Picking one puts it on my mouse, and a click on the map puts it down there; a phone's next tap does (the owner's, Nov
   19 12:59Z: "what it has is selected by mouse and then placed on your mouse for you to choose where to place it on the
   board with your mouse"). sbPlace.start: sandbox.js' */
export const sbPlace = { start: null };
/* B puts down zones only: a spawn, respawn or loot is what a zone does, picked in its window (the owner's, Nov 20 02:37Z:
   "Zone is the only thing left of those original four") */
const BUILD = [["zone", "Zone"]];
export const buildRows = (R) =>
  spawnsHere(R.state)
    ? BUILD.map(([kind, label]) => ({
        label: sbPresets[kind] ? `${label} (preset)` : label,
        kind,
        name: label,
        win: true, // (the window goes: what I picked is on my mouse now)
        act: (r) =>
          sbPlace.start
            ? sbPlace.start(kind, label)
            : r.send({ t: "sb", k: "add", kind, ov: sbLevel.v }),
      }))
    : [];
/* what I'm putting down, drawn on my mouse: a zone's box, dashed, in the color it will get (a loot spot of an older
   save: its mark) */
export function ghostHTML(s, kind, picked) {
  const col = picked || SB_NOCOL; // (every new zone: no color, white)
  return zoneLike({ k: kind })
    ? `<span class="sb-ghost-zone" style="--c:${colCSS(col)}"></span>`
    : markSVG({ k: kind, col });
}

/* the worlds (the zombie cabin, Downpour): the points drawn on the ground, and E beside one opens it */
activity({
  id: "sbpoints",
  only: "sandbox",
  /* my walk: a spawn's Players tab or a respawn may give me another speed (sbspawn.js sbWalkOf) */
  speed: (pos, ctx) => sbWalkOf(ctx.state(), ctx.me),
  /* a zone I can climb here (plan Phase 4, sandboxrules.js sbClimbAt): { top, x, y } or null (world px in, shares out) */
  climbAt(x, y, z) {
    const R = activeRoom(),
      s = R && R.state;
    if (!s || !s.sb) return null;
    return sbClimbAt(
      s,
      { duck: (s.players[R.me] || {}).name || "" },
      x / W,
      y / H,
      z,
      W,
      H,
    );
  },
  /* a zone that's a wall to me (plan Phase 3) */
  blocked(x, y, z, ctx, fx, fy) {
    const s = ctx.state();
    if (!s || !s.sb || fx == null) return false;
    const walls = sbWalls(s, { duck: (s.players[ctx.me] || {}).name || "" });
    return sbWallStops(s, walls, fx / W, fy / H, x / W, y / H, z, W, H);
  },
  draw(now, ctx) {
    const s = ctx.state(),
      layer = ctx.world.board.querySelector(".ducks");
    if (!layer || !s) return;
    sbFloorsFrom(s); // (its ground zones are floors under my duck: sbfloors.js)
    const size = 90 * ctx.world.sc;
    drawMarks(
      layer,
      spawnsHere(s) ? ptsOf(s) : {},
      (p) => {
        const f = ctx.world.toScreen(p.x * W, p.y * H, p.z || 0),
          [left, top] = ctx.world.local(f.left, f.top); // (the ducks' layer is in the world's box: world.js)
        return { left, top };
      },
      size,
      s,
    );
  },
  near(pos, ctx) {
    const s = ctx.state();
    if (!s || !sbMay(s, ctx.me, "b")) return null;
    let best = null,
      bd = 90;
    for (const [id, p] of Object.entries(ptsOf(s))) {
      if (p.grp || sbOv(p) !== sbLevel.v) continue;
      const d = Math.hypot(p.x * W - pos.x, p.y * H - pos.y);
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    if (!best) return null;
    const k = ptsOf(s)[best].k;
    return {
      label:
        k === "spawn"
          ? "Spawn settings"
          : k === "loot"
            ? "Loot settings"
            : k === "zone"
              ? "Zone settings"
              : "Respawn settings",
      d: bd,
      act: () =>
        sbSettings(
          () => ({ state: ctx.state(), me: ctx.me, send: ctx.send }),
          best,
        ),
    };
  },
});

/* ---------- Duck Cabin's zombies (sbcabin.js), drawn as Dead Ducks Arcade's are: the same picture, HP bar, wounds,
   claw marks and fall, each gliding from where it was to where the host says over one heartbeat ---------- */
const ZB = new Map();
activity({
  id: "sbzombies",
  only: "sandbox",
  unmount() {
    dropNpcs(ZB);
  },
  draw(now, ctx) {
    const s = ctx.state(),
      Wd = ctx.world,
      layer = Wd.board.querySelector(".hang-props"),
      fxl = Wd.board.querySelector(".fxl"),
      zb = (s && s.hang && s.hang.sbz && s.hang.sbz.zb) || [];
    if (!layer) return;
    npcPics(s.sbpic); // (the room's uploaded pictures: a spawn's Appearance tab)
    drawNpcs(
      ctx,
      zb,
      ZB,
      layer,
      fxl,
      sbHasOl(s)
        ? {
            /* in a zone whose Outlines take it: that row's color (sandboxrules.js sbOlColor) */
            ol: (o, z, f, unseen, h, sc) => {
              const c = sbOlColor(
                s,
                { k: o.k, sp: o.sp },
                z.x / W,
                z.y / H,
                h,
                W,
                H,
              );
              if (c)
                olAdd({
                  id: "sbz" + o.i,
                  img: z.img,
                  x: f.left - (z.box.w * sc) / 2,
                  y: f.top - z.box.feet * sc,
                  w: z.box.w * sc,
                  h: z.box.h * sc,
                  flip: (o.f || 1) < 0,
                  kind: c,
                });
              return false;
            },
          }
        : {},
    );
  },
});
