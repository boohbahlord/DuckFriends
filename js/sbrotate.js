/* Sandbox, Direction's Rotate in the right-click menu (the owner's, Nov 20 18:46Z): "it just shows the shape having like
   a little like circular arrow that points into itself ... you can just click that and move it around in a circle ... the
   little circle thingy on the pop-up is inside of the shape, not above it, because what if like a shape is near the top
   of the map": a ring in the middle of the block with a circular arrow on it. Held and moved round, the block turns to
   face where it's pulled (a quarter at a time while it snaps: sandboxrules.js sbSnapTurn). A press anywhere else, Esc,
   or the block going away puts it away. A finger works as the mouse does */
import { sbRot } from "./sandboxrules.js";

const EVERY = 50; // (ms between the turns I send while pulling it)
const ARROW = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a8 8 0 1 0 8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M12 0.6 17 4l-5 3.4z" fill="currentColor"/></svg>`;

/* S: the game's screen; getR: the room; may(): I may build now. Returns { show(id), hide(), destroy() } */
export function mountRotate(S, getR, may) {
  const el = document.createElement("div");
  el.className = "sb-rot";
  el.hidden = true;
  el.innerHTML = `<button type="button" class="sb-rot-knob" aria-label="Rotate">${ARROW}</button>`;
  document.body.append(el); // (on the page itself, over the map, as the size handles are: sbdrag.js)
  const knob = el.firstChild;
  let id = "",
    raf = 0,
    held = null; // { sent: when I last sent a turn }
  const block = () => {
    const R = getR();
    return (R && R.state.sb && R.state.sb.pts && R.state.sb.pts[id]) || null;
  };
  /* the block's middle on the screen: its mark's middle, where it is drawn */
  const midOf = () => {
    const n = S.querySelector(`.sb-pt[data-p="${id}"]`);
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const hide = () => {
    id = "";
    held = null;
    el.hidden = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const place = () => {
    raf = 0;
    const p = block(),
      m = p && midOf();
    if (!p || p.lock || !m || !may()) return hide();
    el.hidden = false;
    el.style.left = m.x.toFixed(1) + "px";
    el.style.top = m.y.toFixed(1) + "px";
    el.style.setProperty("--a", sbRot(p) + "deg");
    raf = requestAnimationFrame(place);
  };
  const show = (pid) => {
    id = pid;
    if (!raf) raf = requestAnimationFrame(place);
  };
  /* where it's pulled: degrees from straight up, as the block's turn counts them */
  const turnTo = (e, force) => {
    const m = midOf(),
      R = getR();
    if (!m || !R || !held) return;
    const now = performance.now();
    if (!force && now - held.sent < EVERY) return;
    held.sent = now;
    const a =
      (Math.atan2(e.clientY - m.y, e.clientX - m.x) * 180) / Math.PI + 90;
    R.send({ t: "sb", k: "turn", ps: [id], to: Math.round(a) });
  };
  knob.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    knob.setPointerCapture(e.pointerId);
    held = { sent: 0 };
  });
  knob.addEventListener("pointermove", (e) => {
    if (held) turnTo(e, false);
  });
  const up = (e) => {
    if (!held) return;
    turnTo(e, true);
    held = null;
  };
  knob.addEventListener("pointerup", up);
  knob.addEventListener("pointercancel", () => (held = null));
  const away = (e) => {
    if (!el.hidden && !el.contains(e.target)) hide();
  };
  const esc = (e) => {
    if (e.key === "Escape" && !el.hidden) hide();
  };
  addEventListener("pointerdown", away, true);
  addEventListener("keydown", esc, true);
  return {
    show,
    hide,
    destroy() {
      hide();
      removeEventListener("pointerdown", away, true);
      removeEventListener("keydown", esc, true);
      el.remove();
    },
  };
}
