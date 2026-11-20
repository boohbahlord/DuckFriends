/* ---------- Sandbox: spawns and respawns (stage 2), on the screen ----------
   The owner's Sandbox file: a spawn is "a white transparent circle with a hollow middle and a white circle at it's
   center", in its own color, its name over it; a respawn looks the same "but instead they have points on four ends of
   the circle". E beside one (whoever may build) opens its settings: its name and color, what spawns, its key, the
   number boxes and the true or false boxes. A box written wrong turns red and says why; the spawn keeps its last good
   value (numerat.js). On the board the game draws them (game.js calls sbBoardMarks); on the worlds they are an activity
   of Sandbox's own (registry.js only: "sandbox"). */
import { LANG } from "./langname.js";
import { activity } from "./hangout/registry.js";
import { W, H } from "./hangout/layout.js";
import { npcPics } from "./sbnpcart.js";
import { esc, openWindow, confirmBox, toast } from "./ui.js";
import { sbPresets, sbCheat, colSwatches, NOCOL_NOTE } from "./sbmenu.js";
import { activeRoom } from "./net.js";
import {
  isSb,
  sbMay,
  sbOnBoard,
  SB_BOXES,
  SB_FLAGS,
  SB_ACTS,
  SB_IMPORT,
  SB_OWN,
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
  sbCells,
  sbCellIn,
  sbSize,
} from "./sandboxrules.js";
import {
  boxText,
  boxWhy,
  spawnsHere,
  sbWalkOf,
  madeOf,
  kdOf,
  ownOn,
  SB_TEXT,
} from "./sbspawn.js";
import { orbFace, lootRing, lootPage, lootWire } from "./sblootview.js";
import { drawNpcs, dropNpcs } from "./npcview.js";
import {
  kindsFor,
  sendKinds,
  lookPage,
  lookFor,
  picFrom,
  sendPic,
} from "./sbmake.js";

/* a color as CSS: No color is the rainbow's (the element under it has .sb-rb, which turns currentColor round the rainbow,
   very slowly) */
export const colCSS = (col) =>
  col === SB_NOCOL ? "currentColor" : SB_COLORS[col] || "#fff";
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
/* a block's shape as pixels, made from the start as pixels (the owner's, Nov 19 23:41Z): one pixel per grid square the
   block checks (sandboxrules.js sbCellIn), its inside see-through in its color and its edge squares stronger. Kept by
   shape, size and color */
const SHAPE_PX = new Map();
function shapePic(p, css) {
  const [cx, cy] = sbCells(p),
    key = `${sbShape(p)} ${cx} ${cy} ${css}`;
  let u = SHAPE_PX.get(key);
  if (u) return u;
  const cv = document.createElement("canvas");
  cv.width = cx;
  cv.height = cy;
  const g = cv.getContext("2d"),
    inn = (i, j) => i >= 0 && j >= 0 && i < cx && j < cy && sbCellIn(p, i, j);
  for (let j = 0; j < cy; j++)
    for (let i = 0; i < cx; i++) {
      if (!inn(i, j)) continue;
      const edge =
        !inn(i - 1, j) || !inn(i + 1, j) || !inn(i, j - 1) || !inn(i, j + 1);
      g.globalAlpha = edge ? 0.85 : 0.22;
      g.fillStyle = css;
      g.fillRect(i, j, 1, 1);
    }
  SHAPE_PX.set(key, (u = cv.toDataURL()));
  return u;
}
/* a zone: its rectangle, see-through in its color, as the map draws it (its corners through at: the board and the
   worlds both draw it square to the screen), its name over it and a dot where its builder stood (E there opens it). A
   box of CSS, not a drawing: the pixel look (pxdom.js) would make a new picture of it each time the camera moves */
function zoneMark(n, p, at, s, bare = false) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    z = p.z || 0,
    cs = [
      [x0, y0],
      [x1, y1],
      [p.x, p.y],
    ].map(([x, y]) => at({ x, y, z })),
    L = Math.min(cs[0].left, cs[1].left),
    T = Math.min(cs[0].top, cs[1].top),
    shaped = sbShape(p) !== "sq" && !sbFills(p), // (a square is its CSS box; any other shape its pixels)
    sig = `${p.col} ${boxText(p, "name")} ${shaped ? sbShape(p) + sbCells(p) : ""} ${bare}`;
  if (n._sig !== sig) {
    n._sig = sig;
    const css = SB_COLORS[p.col] || "#fff";
    n.style.setProperty("--c", css);
    n.classList.toggle("sb-shaped", shaped);
    if (shaped) n.style.setProperty("--shape", `url("${shapePic(p, css)}")`);
    else n.style.removeProperty("--shape");
    n.innerHTML = bare
      ? "" // (a spawn's, respawn's or loot spot's area: its ring shows where it is)
      : `<span class="sb-zone-dot"></span><span class="sb-pt-name" style="color:var(--c)">${esc(boxText(p, "name"))}</span>`;
  }
  const st = cs
    .map((c) => `${c.left.toFixed(1)},${c.top.toFixed(1)}`)
    .join(" ");
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: L.toFixed(1) + "px",
    top: T.toFixed(1) + "px",
    width: Math.abs(cs[1].left - cs[0].left).toFixed(1) + "px",
    height: Math.abs(cs[1].top - cs[0].top).toFixed(1) + "px",
  });
  if (n.firstChild)
    Object.assign(n.firstChild.style, {
      left: (cs[2].left - L).toFixed(1) + "px",
      top: (cs[2].top - T).toFixed(1) + "px",
    });
}
/* the points on a layer: at(p) → { left, top } where its middle is (board px), size its width; s: the room's state (a
   loot point's orb and its picture) */
function drawMarks(layer, pts, at, size, s) {
  const have = new Map(),
    want = new Set(),
    seeZones = building();
  for (const n of layer.querySelectorAll(".sb-pt")) have.set(n.dataset.p, n);
  for (const [id, p] of Object.entries(pts)) {
    if (p.grp) continue; // (a spawn's + page: drawn as its spawn)
    const hid = hiddenNow(s, p),
      orbOut = p.k === "loot" && !!p.orb && p.orb.dn == null;
    if (hid && !orbOut) continue; // (Hide: a loot point hides its ring and name, never its orb, the owner's "that appearance is hidden")
    if (p.k === "zone") {
      if (!seeZones) continue;
      want.add(id);
      zoneMark(markEl(layer, have, id, "sb-pt sb-zone"), p, at, s);
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
    const orb = p.k === "loot" && p.orb && p.orb.dn == null, // (a zombie drop draws itself: l4dd.js)
      face = orb
        ? p.orb.w + boxText(p, "look") + ((s && s.sbImg) || {})[id]
        : "",
      away = orb && p.orb.x != null, // (its orb lies in a zone: drawn there, sbloot.js)
      n = markEl(layer, have, id, "sb-pt"),
      sig = `${p.k} ${p.col} ${boxText(p, "name")} ${away ? "" : face} ${hid}`;
    if (n._sig !== sig) {
      n._sig = sig;
      n.classList.toggle("sb-rb", p.col === SB_NOCOL);
      n.innerHTML = `${hid ? "" : `<span class="sb-pt-name" style="color:${colCSS(p.col)}">${esc(boxText(p, "name"))}</span>${markSVG(p)}`}${orb && !away ? `<span class="sb-orb">${orbFace(s, id, p)}</span>` : ""}`;
    }
    placeAt(n, at(p), size);
    if (away) {
      const o = markEl(layer, have, id + "~o", "sb-pt");
      want.add(id + "~o");
      if (o._sig !== face) {
        o._sig = face;
        o.innerHTML = `<span class="sb-orb">${orbFace(s, id, p)}</span>`;
      }
      placeAt(o, at({ x: p.orb.x, y: p.orb.y, z: p.orb.z || 0 }), size);
    }
  }
  for (const [id, n] of have) if (!want.has(id)) n.remove();
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
    if (p.grp) continue;
    const d = board
      ? Math.hypot((p.x - me.x) / 0.03, (p.y - me.y) / 0.08)
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
  `<label class="sb-row${why ? " bad" : ""}" data-row="${f}"><span>${esc(b.name)}</span><input class="sb-box" data-f="${f}" value="${esc(t)}" maxlength="${f === "key" ? 1 : 80}" spellcheck="false" autocomplete="off"><em class="sb-why">${esc(why)}</em></label>`;
/* the Brain box, with an arrow beside it that lists my-files/ (the owner's: "they can click an arrow beside the text
   box ... a selection that they can scroll through of their files within that directory"): brainbuild.js */
const brainRow = (t, why) =>
  `<div class="sb-row sb-brainrow${why ? " bad" : ""}" data-row="brain"><span>${esc(SB_TEXT.brain.name)}</span><span class="sb-brainbox"><input class="sb-box" data-f="brain" value="${esc(t)}" maxlength="80" spellcheck="false" autocomplete="off" aria-label="${esc(SB_TEXT.brain.name)}"><button type="button" class="sb-brainarrow" data-brainlist aria-label="My files" aria-expanded="false">&#9662;</button></span><em class="sb-why">${esc(why)}</em><div class="sb-brainlist" hidden></div></div>`;
/* a behavior list (sbbrain.js) as a dropdown of checkboxes: Players, Everything, each kind, each spawn (by its color,
   named as it's named). Its summary says what's picked */
const summaryOf = (on) =>
  on.map((c) => c.dataset.label).join(", ") || "Nothing";
function actRow(s, p, f, kinds) {
  const k = p.f[f],
    what = boxText(p, "what").split(/[\s,]+/),
    made = what.length === 1 && madeOf(s, what[0]), // (one made NPC: its own lists, sbnpcs.js)
    picked = (
      k || SB_ZONE[f]
        ? boxText(p, f) // (a zone's "Who it hits": Players unless set)
        : made
          ? made.beh[f] || ""
          : f === "target" && what.includes("zombie")
            ? "players"
            : ""
    )
      .toLowerCase()
      .split(/[\s,]+/), // (never set: a zombie goes after the players, sbbrain.js)
    opts = [
      ["players", "Players"],
      ["everything", "Everything"],
      ...kinds,
      ...Object.values(ptsOf(s))
        .filter((q) => q.k === "spawn")
        .map((q) => [q.col, `${boxText(q, "name")} spawn`]),
    ];
  return pickRow(f, SB_ACTS[f] || SB_ZONE[f].name, opts, picked);
}
/* a dropdown of checkboxes for box f: opts [value, name], the values picked (the first of each value only) */
function pickRow(f, label, opts, picked) {
  const one = opts.filter(
      (o, i, all) => all.findIndex((x) => x[0] === o[0]) === i,
    ),
    boxes = one.map(
      ([v, n]) =>
        `<label><input type="checkbox" value="${esc(v)}" data-label="${esc(n)}"${picked.includes(v) ? " checked" : ""}> ${esc(n)}</label>`,
    ),
    on = one.filter(([v]) => picked.includes(v)).map(([, n]) => n);
  return `<div class="sb-row" data-row="${f}"><span>${esc(label)}</span><details class="sb-acts" data-act="${f}"><summary>${esc(on.join(", ") || "Nothing")}</summary><span class="sb-what">${boxes.join("") || `<em class="sb-none">None placed yet</em>`}</span></details></div>`;
}
/* ---------- the settings window ----------
   A spawn's window has tabs at the top (the owner's Sandbox file): Entities (what it spawns), Players (ducks spawning
   there) and a + that adds a page of either kind, each with its own name (sbspawn.js "page": a point of its own at the
   same spot, its grp the spawn's). A respawn's has Import settings (importWin). id: the point; tab: "pl" for a spawn's
   Players tab; getR: () => the room */
const nameOf = (f) =>
  (SB_BOXES[f] || SB_FLAGS[f] || SB_PLAYER[f] || {}).name || SB_ACTS[f] || f;
/* a true or false setting as a button on the right that reads true or false (the owner's, Nov 19 21:59Z: "make it a
   button ... when you click the button, it will say true or false"); a hidden box under it carries the value as t or f */
const flagRow = (f, b, t, why) => {
  const on = !/^f/i.test(String(t).trim()) && String(t).trim() !== "";
  return `<div class="sb-row${why ? " bad" : ""}" data-row="${f}"><span>${esc(b.name)}</span><button type="button" class="sb-tog${on ? " on" : ""}" data-tog="${f}" aria-pressed="${on}">${on ? "true" : "false"}</button><input type="hidden" class="sb-box" data-f="${f}" value="${on ? "t" : "f"}"><em class="sb-why">${esc(why)}</em></div>`;
};
/* a header over one part of a spawn's window, numbered like Word's headings as the settings go deeper (plan Phase 2:
   3, 3.4, 3.4.1): SECT is [the section it's under, how many came before] while a block's window is made */
let SECT = null;
const sect = (t) =>
  `<h3 class="sb-sect">${SECT ? `${SECT[0]}.${++SECT[1]} ` : ""}${t}</h3>`;
/* a section of the block's front, with its fold arrow */
const fold = (n, t, html) =>
  `<details class="sb-fold" open><summary class="sb-sect">${n}. ${t}</summary>${html}</details>`;
const PURPOSES = [
  ["spawn", "Spawn"],
  ["respawn", "Respawn"],
  ["loot", "Loot"],
  ["zone", "Zone"],
];
export function sbSettings(getR, id, tab = "") {
  const R = getR(),
    pts = R && ptsOf(R.state),
    p = pts && pts[id];
  if (!p || !sbMay(R.state, R.me, "b")) return;
  const typed = (f) => (p.f[f] ? p.f[f].t : boxText(p, f)),
    why = (f) => (p.f[f] ? boxWhy(f, p.f[f].t) : ""),
    spawn = p.k === "spawn",
    loot = p.k === "loot", // (a loot orb's spot: sblootview.js)
    zone = p.k === "zone", // (a zone: sbzone.js)
    baseId = p.grp && pts[p.grp] ? p.grp : id,
    pages = Object.entries(pts).filter(([, q]) => q.grp === baseId),
    players = p.pg === "pl" || (!p.grp && tab === "pl"),
    zmaps = baseMode(R.state.options) === "l4dd",
    what = boxText(p, "what").split(/[\s,]+/),
    kinds = kindsFor(R.state),
    onlyZ = (ks) => zmaps && !ks.some((k) => k && k !== "zombie"), // (the zombie maps' zombies walk their own way: l4ddrules.js)
    look = spawn && !players && tab === "ap", // (its Appearance tab: sbmake.js)
    pick = boxText(p, "pick"),
    tabs = [
      [baseId, "", "Entities"],
      [baseId, "pl", "Players"],
      [baseId, "ap", "Appearance"],
      ...pages.map(([q, P]) => [q, "", boxText(P, "name")]),
    ],
    on = (t) =>
      t[0] === id &&
      (p.grp ? true : t[1] === (players ? "pl" : look ? "ap" : ""));
  const head = spawn
      ? `<div class="sb-tabs" role="tablist">${tabs
          .map(
            (t) =>
              `<button type="button" class="sb-tab${on(t) ? " on" : ""}" role="tab" aria-selected="${on(t)}" data-tab="${t[0]}" data-tk="${t[1]}">${esc(t[2])}</button>`,
          )
          .join(
            "",
          )}<span class="sb-plus"><button type="button" class="sb-tab" data-plus aria-label="Add a page">+</button><span class="sb-plus-pick" hidden><button type="button" class="sb-tab" data-page="ent">Entity page</button><button type="button" class="sb-tab" data-page="pl">Player page</button></span></span></div>`
      : "",
    linked = (spawn || p.k === "respawn") && !p.grp;
  let colorRow = `<div class="sb-row"><span>Color</span><span class="sb-cols">${colSwatches(
      p.col,
      "data-col",
      linked,
    )}</span></div>${
      linked
        ? `${p.col === SB_NOCOL ? "" : `<p class="sb-tip">Every ${p.k} of this color has these settings.</p>`}${flagRow("hide", SB_FLAGS.hide, typed("hide"), why("hide"))}`
        : ""
    }`,
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
    frontHTML = front
      ? fold(
          1,
          "Shape",
          `<div class="sb-row"><span>${SB_SHAPE.sh.name}</span><span class="sb-what">${Object.entries(
            SB_SHAPES,
          )
            .map(
              ([v, n]) =>
                `<label><input type="radio" name="sb-sh" data-sh="${v}"${shapeNow === v ? " checked" : ""}> ${n}</label>`,
            )
            .join("")}</span></div>
          ${row("zw", SB_ZONE.zw, p.f.zw ? typed("zw") : String(sbSize(p)[0]), why("zw"))}
          ${row("zh", SB_ZONE.zh, p.f.zh ? typed("zh") : String(sbSize(p)[1]), why("zh"))}
          ${flagRow("fill", SB_SHAPE.fill, typed("fill"), why("fill"))}`,
        ) +
        fold(2, "Color", colorRow) +
        fold(
          3,
          "Purpose",
          `<div class="sb-row"><span>Purpose</span><select class="sb-purpose" data-purpose aria-label="Purpose">${PURPOSES.map(
            ([v, n]) =>
              `<option value="${v}"${p.k === v ? " selected" : ""}>${n}</option>`,
          ).join("")}</select></div>`,
        )
      : "";
  if (front) colorRow = ""; // (it's in the front now)
  SECT = front ? [4, 0] : null;
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
    <div class="sb-actrows" data-row="acts"${onlyZ(what) ? " hidden" : ""}>${Object.keys(
      SB_ACTS,
    )
      .map((f) => actRow(R.state, p, f, kinds))
      .join("")}</div>
    ${row("key", { name: "Spawn key" }, typed("key"), why("key"))}
    ${brainRow(typed("brain"), why("brain"))}
    ${sect("True or false")}
    ${flagRow("sets", SB_FLAGS.sets, typed("sets"), why("sets"))}
    ${Object.entries(SB_FLAGS)
      .filter(([f]) => f !== "sets" && f !== "hide")
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
    const fx = SB_FX[boxText(p, "fx").trim()]
        ? boxText(p, "fx").trim()
        : "none",
      named = (k, end) =>
        Object.values(pts)
          .filter((q) => q.k === k && !q.grp && q.pg !== "pl")
          .map((q) => [q.col, `${boxText(q, "name")} ${end}`]),
      picked = (f) =>
        boxText(p, f)
          .toLowerCase()
          .split(/[\s,]+/);
    return `${row("name", { name: "Variable name" }, typed("name"), why("name"))}
    ${colorRow}${flagRow("hide", SB_FLAGS.hide, typed("hide"), why("hide"))}
    <div class="sb-row"><span>${esc(SB_ZONE.fx.name)}</span><span class="sb-what">${Object.entries(
      SB_FX,
    )
      .map(
        ([v, n]) =>
          `<label><input type="radio" name="sb-fx" data-fx="${v}"${fx === v ? " checked" : ""}> ${n}</label>`,
      )
      .join("")}</span></div>
    <div data-fxrow="amt"${fx === "damage" || fx === "heal" ? "" : " hidden"}>${row("amt", SB_ZONE.amt, typed("amt"), why("amt"))}</div>
    <div data-fxrow="rate"${fx === "none" ? " hidden" : ""}>${row("rate", SB_ZONE.rate, typed("rate"), why("rate"))}</div>
    <div data-fxrow="zwho"${fx === "none" ? " hidden" : ""}>${actRow(R.state, p, "zwho", kinds)}</div>
    ${flagRow("pon", SB_PLAYER.pon, typed("pon"), why("pon"))}
    ${row("pwho", { name: "Who spawns here" }, typed("pwho"), why("pwho"))}
    ${pickRow("ent", SB_ZONE.ent.name, named("spawn", "spawn"), picked("ent"))}
    ${pickRow("lt", SB_ZONE.lt.name, named("loot", "loot"), picked("lt"))}`;
  };
  const html = `<h2>${loot ? "Loot" : zone ? "Zone" : spawn ? "Spawn" : "Respawn"}</h2>${head}
  <div class="sb-set">${frontHTML}${front ? `<h3 class="sb-sect sb-sect-top">4. ${PURPOSES.find(([v]) => v === p.k)[1]} settings</h3>` : ""}${loot ? lootPage(R.state, id, p, { row, flagRow, typed, why, colorRow }) : zone ? zonePage() : !spawn ? respawn() : players ? playersPage() : look ? lookPage(R.state, p) : entity()}</div>
  <p class="acts">${spawn && !players && !look ? `<button type="button" class="btn" data-go>Spawn</button>` : ""}${!spawn && !loot && !zone ? `<button type="button" class="btn" data-imp>Import settings</button>` : ""}<button type="button" class="btn ghost" data-del>${p.grp ? "Delete page" : "Delete"}</button></p>`;
  openWindow(html, {
    cls: zone ? "sb-setwin sb-zonewin" : "sb-setwin",
    onOpen(w, close) {
      const send = (a) => {
        const r = getR();
        if (r) r.send({ t: "sb", p: id, ...a });
      };
      const timers = {};
      /* a Brain: its file (and the files it uses) go to the room first, from my Seriat folder (numeratwin.js, loaded
         when it's wanted: it brings the command line) */
      const sendBrain = (i) =>
        import("./numeratwin.js").then((m) => {
          const v = i.value.trim(),
            files = m.brainFiles(v),
            lab = i.closest(".sb-row");
          lab.classList.toggle("bad", !files);
          lab.querySelector(".sb-why").textContent = files
            ? ""
            : v.startsWith("~")
              ? `No file by that name that its owner lets you run (x)`
              : `No file by that name in your ${LANG} folder (n)`;
          if (!files) return;
          send({ k: "nbf", files });
          send({ k: "set", f: "brain", v });
        });
      if (loot) lootWire(w, id, send, getR);
      w.addEventListener("input", (e) => {
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
        if (t.matches("[data-sh]"))
          return send({ k: "set", f: "sh", v: t.dataset.sh });
        if (t.matches("[data-purpose]")) {
          send({ k: "kind", v: t.value });
          return setTimeout(() => w.isConnected && again(id), 400); // (that purpose's own settings, once the room has it)
        }
        if (t.matches("[data-pick]"))
          return send({ k: "set", f: "pick", v: t.dataset.pick });
        if (t.matches("[data-fx]")) {
          const v = t.dataset.fx,
            show = { amt: v === "damage" || v === "heal", rate: v !== "none" };
          show.zwho = show.rate;
          for (const [r, on] of Object.entries(show))
            w.querySelector(`[data-fxrow="${r}"]`).hidden = !on;
          return send({ k: "set", f: "fx", v });
        } // (a zone's: only the rows that matter to it)
        const act = t.closest("[data-act]");
        if (act) {
          const on = [...act.querySelectorAll("input:checked")],
            f = act.dataset.act;
          act.querySelector("summary").textContent = summaryOf(on);
          return send({
            k: "set",
            f,
            v:
              on.map((c) => c.value).join(", ") ||
              (f === "zwho" ? "nobody" : ""), // (a zone that hits nobody: its default is Players)
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
          note.textContent = "Sending…";
          return picFrom(
            t.files[0],
            w.querySelector("[data-squash]").checked,
          ).then(
            (pic) => {
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
        const tog = e.target.closest("[data-tog]");
        if (tog) {
          const box = tog.closest(".sb-row").querySelector(".sb-box"),
            on = !/^t/i.test(box.value);
          box.value = on ? "t" : "f";
          tog.classList.toggle("on", on);
          tog.setAttribute("aria-pressed", on);
          tog.textContent = on ? "true" : "false";
          return box.dispatchEvent(new Event("input", { bubbles: true }));
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
          if (bl.dataset.brainfile != null) return pick(bl.dataset.brainfile);
          if (bl.hasAttribute("data-brainnew"))
            return import("./brainbuild.js").then((m) =>
              m.openBrainBuilder((path) => w.isConnected && pick(path)),
            );
          if (!list.hidden) {
            list.hidden = true;
            return arrow.setAttribute("aria-expanded", "false");
          }
          return Promise.all([
            import("./brainbuild.js"),
            import("./numerathelp.js"),
          ]).then(async ([m, h]) => {
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
          });
        }
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
          r.send({ t: "sb", k: "page", p: baseId, kind: pg.dataset.page });
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
    typed = (f) => (kd.f[f] ? kd.f[f].t : boxText(p, f)),
    why = (f) => (kd.f[f] ? boxWhy(f, kd.f[f].t) : ""),
    kinds = kindsFor(R.state),
    html = `<h2>${esc(SB_WHAT[kind])}: defaults</h2>
  <p class="small dim">Every ${esc(SB_WHAT[kind])} starts with these, unless its spawn sets its own.</p>
  <div class="sb-set">${SB_OWN.map((f) =>
    SB_ACTS[f]
      ? actRow(R.state, p, f, kinds)
      : SB_FLAGS[f]
        ? flagRow(f, SB_FLAGS[f], typed(f), why(f))
        : row(f, SB_BOXES[f], typed(f), why(f)),
  ).join("")}</div>
  <p class="acts"><button type="button" class="btn ghost" data-kdreset>The game's own</button></p>`;
  openWindow(html, {
    cls: "sb-setwin",
    onOpen(w, close) {
      const send = (a) => {
        const r = getR();
        if (r) r.send({ t: "sb", k: "kd", kind, ...a });
      };
      const timers = {};
      w.addEventListener("input", (e) => {
        const i = e.target.closest(".sb-box");
        if (!i) return;
        const f = i.dataset.f,
          bad = i.value.trim() ? boxWhy(f, i.value) : "",
          lab = i.closest(".sb-row");
        lab.classList.toggle("bad", !!bad);
        lab.querySelector(".sb-why").textContent = bad;
        clearTimeout(timers[f]);
        timers[f] = setTimeout(() => send({ f, v: i.value.trim() }), 250); // (emptied: the game's own again)
      });
      w.addEventListener("change", (e) => {
        const act = e.target.closest("[data-act]");
        if (!act) return;
        const on = [...act.querySelectorAll("input:checked")];
        act.querySelector("summary").textContent = summaryOf(on);
        send({ f: act.dataset.act, v: on.map((c) => c.value).join(", ") });
      });
      w.addEventListener("click", (e) => {
        if (!e.target.closest("[data-kdreset]")) return;
        send({ reset: true });
        close(null);
        setTimeout(() => kindDefaults(getR, kind), 300);
      });
    },
  });
}
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
const BUILD = [
  ["spawn", "Spawn"],
  ["respawn", "Respawn"],
  ["loot", "Loot"],
  ["zone", "Zone"],
];
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
            : r.send({ t: "sb", k: "add", kind }),
      }))
    : [];
/* what I'm putting down, drawn on my mouse: its mark in the color it will get (picked first for a spawn or a respawn; a
   zone: its box, dashed) */
export function ghostHTML(s, kind, picked) {
  const used = Object.values(ptsOf(s)).map((p) => p.col),
    col =
      picked ||
      Object.keys(SB_COLORS).find((c) => !used.includes(c)) ||
      Object.keys(SB_COLORS)[0];
  return kind === "zone"
    ? `<span class="sb-ghost-zone" style="--c:${SB_COLORS[col]}"></span>`
    : col === SB_NOCOL
      ? `<span class="sb-rb">${markSVG({ k: kind, col })}</span>`
      : markSVG({ k: kind, col });
}

/* the worlds (the zombie cabin, Downpour): the points drawn on the ground, and E beside one opens it */
activity({
  id: "sbpoints",
  only: "sandbox",
  /* my walk: a spawn's Players tab or a respawn may give me another speed (sbspawn.js sbWalkOf) */
  speed: (pos, ctx) => sbWalkOf(ctx.state(), ctx.me),
  draw(now, ctx) {
    const s = ctx.state(),
      layer = ctx.world.board.querySelector(".ducks");
    if (!layer || !s) return;
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
      if (p.grp) continue;
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
    drawNpcs(ctx, zb, ZB, layer, fxl);
  },
});
