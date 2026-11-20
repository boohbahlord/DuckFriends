/* Sandbox, moving blocks with the mouse (plan Phase 2, the owner's Nov 19 words): "hold left click and move it around",
   while it's held "use the arrow keys to rotate it", a double click shows its handles to change its size "as you could
   with the build blocks", and Shift with a drag on an empty spot draws "a selection box" that "selects everything inside
   of it" so they move together; "it cannot be placed down if one of the shapes is outside of the map"; "clicking
   backspace undoes a selection. It doesn't delete it". Mouse only for now (a phone keeps its long press menu) */
import { W, H } from "./hangout/layout.js";
import { pointAt } from "./sbmenu.js";
import { sbSel, sbView, zoneLike } from "./sbspawnview.js";
import { sbFills, sbRot, sbSize, sbSpread, sbUnit } from "./sandboxrules.js";

const TURN = 15; // (degrees an arrow key turns what I hold)
const EVERY = 50; // (ms between the moves I send while dragging)
const HANDLES = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
];

/* S: the game's screen; getR: the room; may(): I may build now (rights, cheat mode, nothing in hand, no window);
   onMap(e): the event is on the map; spotAt(cx, cy) → { x, y } shares; screenAt({ x, y, z }) → { x, y } on the screen.
   Returns { destroy } */
export function mountSbDrag(S, getR, { may, onMap, spotAt, screenAt }) {
  const pts = () => {
    const R = getR();
    return (R && R.state.sb && R.state.sb.pts) || {};
  };
  /* a zone is grabbed only while it shows (Build open, or cheat mode: sbspawnview.js drawMarks) */
  const shown = (id) => !!document.querySelector(`.sb-pt[data-p="${id}"]`);
  /* what's under the mouse: a zone only while the zones show */
  const blockAt = (at, e) => {
    const R = getR();
    if (!R || !at) return null;
    const id = pointAt(R.state, at),
      p = id && pts()[id];
    if (!p || (zoneLike(p) && !shown(id))) return null;
    /* its area shows only while I build: otherwise only its ring is a handle, so a click near it still walks */
    if (!sbView.build && sbSpread(p)) {
      const m = midOf(id, p);
      if (!m || Math.hypot(m.x - e.clientX, m.y - e.clientY) > 28) return null;
    }
    return id;
  };
  let drag = null, // { ids, x0, y0 (the first's spot), at0, sent, moved }
    size = null, // { id, hx, hy, p0 }
    box = null, // { x0, y0 } the selection box's corner on the screen
    eatTill = 0,
    raf = 0,
    handlesOf = ""; // (the block showing its handles)
  const boxEl = document.createElement("div");
  boxEl.className = "sb-selbox";
  boxEl.hidden = true;
  const hdl = document.createElement("div");
  hdl.className = "sb-hdls";
  hdl.hidden = true;
  hdl.innerHTML = HANDLES.map(
    ([x, y], i) =>
      `<span class="sb-hdl" data-h="${i}" style="cursor:${x * y > 0 ? "nwse" : x * y < 0 ? "nesw" : x ? "ew" : "ns"}-resize"></span>`,
  ).join("");
  document.body.append(boxEl, hdl); // (on the page itself: inside the screen, a growing box scrolled the map away)
  const send = (a) => {
    const R = getR();
    if (R) R.send({ t: "sb", ...a });
  };
  const stop = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  /* a block's middle on the screen: its mark's middle (where it is drawn), else from the map */
  const midOf = (id, p) => {
    const n = S.querySelector(`.sb-pt[data-p="${id}"]`);
    if (!n) return screenAt(p);
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  /* a block's corner or edge (hx, hy from -1 to 1) on the screen, turned as it is: its step from the middle, measured on
     the map, added to where its mark is drawn */
  const cornerAt = (s, id, p, hx, hy) => {
    const [rx, ry] = sbUnit(s, W, H),
      [w, h] = sbSize(p),
      a = (sbRot(p) * Math.PI) / 180,
      lx = (hx * w) / 2,
      ly = (hy * h) / 2;
    const c = screenAt({
        x: p.x + (lx * Math.cos(a) - ly * Math.sin(a)) * rx,
        y: p.y + (lx * Math.sin(a) + ly * Math.cos(a)) * ry,
        z: p.z || 0,
      }),
      o = screenAt(p),
      m = midOf(id, p);
    return c && o && m && { x: m.x + c.x - o.x, y: m.y + c.y - o.y };
  };
  const showHandles = () => {
    const R = getR(),
      p = R && handlesOf && pts()[handlesOf];
    if (!p || sbFills(p) || !may()) {
      handlesOf = "";
      hdl.hidden = true;
      raf = 0;
      return;
    }
    hdl.hidden = false;
    HANDLES.forEach(([hx, hy], i) => {
      const c = cornerAt(R.state, handlesOf, p, hx, hy),
        n = hdl.children[i];
      if (!c) return;
      n.style.left = c.x.toFixed(1) + "px";
      n.style.top = c.y.toFixed(1) + "px";
    });
    raf = requestAnimationFrame(showHandles);
  };
  const handles = (id) => {
    handlesOf = id;
    if (!id) hdl.hidden = true;
    else if (!raf) raf = requestAnimationFrame(showHandles);
  };
  /* while dragging: where the first block should be now, sent as a step from where it is (so a refused step, one that
     would take a block off the map, is simply tried again from where it stands) */
  const dragTo = (at, force) => {
    const p = pts()[drag.ids[0]];
    if (!p || !at) return;
    const now = performance.now();
    if (!force && now - drag.sent < EVERY) return;
    const dx = +(drag.x0 + at.x - drag.at0.x - p.x).toFixed(4),
      dy = +(drag.y0 + at.y - drag.at0.y - p.y).toFixed(4);
    if (!dx && !dy) return;
    drag.sent = now;
    send({ k: "move", ps: drag.ids, dx, dy });
  };
  /* while pulling a handle: its edge follows the mouse, the other edge stays */
  const sizeTo = (at, force) => {
    const R = getR(),
      { id, hx, hy, p0 } = size;
    if (!R || !at || !pts()[id]) return;
    const now = performance.now();
    if (!force && now - size.sent < EVERY) return;
    const [rx, ry] = sbUnit(R.state, W, H),
      [w0, h0] = sbSize(p0),
      a = (sbRot(p0) * Math.PI) / 180,
      dx = (at.x - p0.x) / rx,
      dy = (at.y - p0.y) / ry,
      lx = dx * Math.cos(-a) - dy * Math.sin(-a),
      ly = dx * Math.sin(-a) + dy * Math.cos(-a),
      fit = (v) => Math.max(1, Math.min(40, Math.round(v))),
      w = hx ? fit(hx * lx + w0 / 2) : w0,
      h = hy ? fit(hy * ly + h0 / 2) : h0,
      cx = (hx * (w - w0)) / 2,
      cy = (hy * (h - h0)) / 2,
      x = p0.x + (cx * Math.cos(a) - cy * Math.sin(a)) * rx,
      y = p0.y + (cx * Math.sin(a) + cy * Math.cos(a)) * ry,
      key = `${w} ${h}`;
    if (key === size.key) return;
    size.key = key;
    size.sent = now;
    send({
      k: "size",
      p: id,
      zw: w,
      zh: h,
      x: +Math.min(1, Math.max(0, x)).toFixed(4),
      y: +Math.min(1, Math.max(0, y)).toFixed(4),
    });
  };
  const down = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const h = e.target.closest && e.target.closest(".sb-hdl");
    if (h && handlesOf && may()) {
      const [hx, hy] = HANDLES[+h.dataset.h];
      size = { id: handlesOf, hx, hy, p0: { ...pts()[handlesOf] }, sent: 0 };
      eatTill = Infinity;
      return stop(e);
    }
    if (!may() || !onMap(e)) return;
    const at = spotAt(e.clientX, e.clientY),
      id = blockAt(at, e);
    if (e.shiftKey && !id) {
      box = { x0: e.clientX, y0: e.clientY };
      Object.assign(boxEl.style, {
        left: e.clientX + "px",
        top: e.clientY + "px",
        width: "0px",
        height: "0px",
      });
      boxEl.hidden = false;
      eatTill = Infinity;
      return stop(e);
    }
    if (!id) return handles(""); // (an empty spot: my duck walks there as always)
    if (!sbSel.has(id)) sbSel.clear();
    const ids = sbSel.size ? [id, ...[...sbSel].filter((q) => q !== id)] : [id],
      p = pts()[id];
    if (handlesOf !== id) handles("");
    drag = {
      ids,
      x0: p.x,
      y0: p.y,
      at0: at,
      sent: 0,
      cx: e.clientX,
      cy: e.clientY,
      moved: false,
    };
    eatTill = Infinity;
    stop(e); // (no walking, no swing, no shot while I hold a block)
  };
  const move = (e) => {
    if (e.pointerType !== "mouse") return;
    if (drag) {
      if (Math.hypot(e.clientX - drag.cx, e.clientY - drag.cy) > 4)
        drag.moved = true;
      if (drag.moved) dragTo(spotAt(e.clientX, e.clientY));
    } else if (size) sizeTo(spotAt(e.clientX, e.clientY));
    else if (box)
      Object.assign(boxEl.style, {
        left: Math.min(box.x0, e.clientX) + "px",
        top: Math.min(box.y0, e.clientY) + "px",
        width: Math.abs(e.clientX - box.x0) + "px",
        height: Math.abs(e.clientY - box.y0) + "px",
      });
    else return;
    stop(e);
  };
  const up = (e) => {
    if (e.pointerType !== "mouse" || !(drag || size || box)) return;
    const at = spotAt(e.clientX, e.clientY);
    if (drag && drag.moved) dragTo(at, true);
    if (size) sizeTo(at, true);
    if (box) {
      /* everything whose middle is inside the box (zones only while they show) */
      const R = getR(),
        L = Math.min(box.x0, e.clientX),
        T = Math.min(box.y0, e.clientY),
        Rt = Math.max(box.x0, e.clientX),
        B = Math.max(box.y0, e.clientY);
      sbSel.clear();
      if (R)
        for (const [id, p] of Object.entries(pts())) {
          if (p.grp || (zoneLike(p) && !shown(id))) continue;
          const c = midOf(id, p);
          if (c && c.x >= L && c.x <= Rt && c.y >= T && c.y <= B) sbSel.add(id);
        }
      boxEl.hidden = true;
    }
    drag = size = box = null;
    eatTill = performance.now() + 300; // (the mouseup and click this makes are mine too)
    stop(e);
  };
  /* the mouse's own down, up and click while I hold something, or just after: never the game's */
  const eat = (e) => {
    if (drag || size || box || performance.now() < eatTill) stop(e);
  };
  const dbl = (e) => {
    if (!may() || !onMap(e)) return;
    const id = blockAt(spotAt(e.clientX, e.clientY), e);
    if (!id || sbFills(pts()[id])) return;
    handles(id);
    stop(e);
  };
  const key = (e) => {
    if (drag && /^Arrow(Left|Right|Up|Down)$/.test(e.key)) {
      send({
        k: "turn",
        ps: drag.ids,
        deg: /Left|Down/.test(e.key) ? -TURN : TURN,
      });
      return stop(e);
    }
    if (
      e.key === "Backspace" &&
      sbSel.size &&
      !e.target.closest("input, textarea, [contenteditable]")
    ) {
      sbSel.clear(); // ("it doesn't delete it. It just undoes a selection")
      return stop(e);
    }
    if (e.key === "Escape" && handlesOf) {
      handles(""); // (Escape puts the handles away, and only that)
      return stop(e);
    }
  };
  addEventListener("pointerdown", down, true);
  addEventListener("pointermove", move, true);
  addEventListener("pointerup", up, true);
  addEventListener("pointercancel", up, true);
  for (const t of ["mousedown", "mouseup", "click"])
    addEventListener(t, eat, true);
  addEventListener("dblclick", dbl, true);
  addEventListener("keydown", key, true);
  return {
    /* the blocks a right click acts on: the selection when the click is on one of them */
    picked: (id) => (id && sbSel.has(id) && sbSel.size > 1 ? [...sbSel] : null),
    clear: () => sbSel.clear(),
    destroy() {
      removeEventListener("pointerdown", down, true);
      removeEventListener("pointermove", move, true);
      removeEventListener("pointerup", up, true);
      removeEventListener("pointercancel", up, true);
      for (const t of ["mousedown", "mouseup", "click"])
        removeEventListener(t, eat, true);
      removeEventListener("dblclick", dbl, true);
      removeEventListener("keydown", key, true);
      cancelAnimationFrame(raf);
      sbSel.clear();
      boxEl.remove();
      hdl.remove();
    },
  };
}
