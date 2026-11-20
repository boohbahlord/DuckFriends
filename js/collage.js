/* ---------- Shelter Sky & Null (id: collage) ----------
   A map very much in the likeness of the owner's Sheltering Sky picture (a yellow-green sky cracked by red veins, green
   swirls under a blue net, a huge black tree, a rubber duck in yellow halftone looking up at it), as a pixel file made
   once by tools/pixel-maps.cjs (its drawing: tools/pixel-src/collage.js), one in color and one in greys for "Black and
   white" (options.mapGrey). Alive on top, in the world's pixels:
   small see-through blue, cyan and purple squares that fade in and out, each jumping to another tile of an imagined
   grid while it's hidden, in the world's pixels. */
import COLLAGE from "./pxm/collage.js";
import { mountWorld } from "./pxmap.js";

/* the squares that live on top: small and see-through, each fading in and out over and over, and while it's hidden it
   jumps to another free spot on an imagined grid of tiles over what the screen sees (x, y, w, h: css px of the world,
   each a whole number of its pixels) */
const SQ = ["#1a2cff", "#19b8ff", "#6a2a9a", "#2f4f8f", "#1b6a6a"];
function squaresOf(box, x, y, w, h, n) {
  const G = COLLAGE.G,
    side = 9 * G,
    cell = 12 * G,
    x0 = Math.ceil(x / G) * G,
    y0 = Math.ceil(y / G) * G,
    cols = Math.max(1, Math.floor(w / cell)),
    rows = Math.max(1, Math.floor(h / cell)),
    used = new Set(),
    free = () => {
      for (let t = 0; t < 40; t++) {
        const c = Math.floor(Math.random() * cols * rows);
        if (!used.has(c)) return (used.add(c), c);
      }
      return 0;
    },
    put = (e) => {
      if (e.dataset.cell) used.delete(+e.dataset.cell);
      const c = free();
      e.dataset.cell = c;
      e.style.left = x0 + (c % cols) * cell + "px";
      e.style.top = y0 + Math.floor(c / cols) * cell + "px";
    };
  box.innerHTML = Array.from(
    { length: n },
    (_, i) =>
      `<i class="cl-sq" style="width:${side}px;--c:${SQ[i % SQ.length]};--a:${(0.16 + Math.random() * 0.2).toFixed(2)};--t:${(1.6 + Math.random() * 1.6).toFixed(2)}s;animation-delay:-${(Math.random() * 3).toFixed(2)}s"></i>`,
  ).join("");
  box.querySelectorAll(".cl-sq").forEach(put);
  /* each time a square has faded out, it moves */
  box.onanimationiteration = (e) =>
    e.target.classList.contains("cl-sq") && put(e.target);
}

/* the scene: scene(layer, s) → { update(now), destroy() } */
export function collageScene(layer, s) {
  const sc = document.createElement("div");
  sc.className = "scene collage";
  /* black and white: the form the vote or Random landed on (s.mapGreyed), or the host's Colors setting */
  const grey = () => !!(s && (s.mapGreyed ?? (s.options && s.options.mapGrey)));
  sc.classList.toggle("grey", grey());
  layer.append(sc);
  const w = mountWorld(sc, COLLAGE, { fx: 0.25, fy: 0.5 }), // (a phone: the slice with the duck looking up at the tree)
    st = w.stage;
  layer.classList.add("px-own"); // (pixels already: the filter leaves it)
  st.innerHTML = `<img class="px-file cl-pic" alt="" draggable="false" style="left:0;top:0;width:${COLLAGE.W}px;height:${COLLAGE.H}px" src="${grey() ? COLLAGE.grey : COLLAGE.pic}"><div class="cl-live"></div>`;
  const pic = st.querySelector(".cl-pic"),
    live = st.querySelector(".cl-live");
  /* the squares over what the screen sees of the world (fewer on a tall screen), laid again when its size changes */
  let seen = "";
  const lay = () => {
    const r = st.getBoundingClientRect(),
      b = sc.getBoundingClientRect();
    if (!r.width || !b.width) return;
    const k = r.width / COLLAGE.W,
      x = Math.max(0, (b.left - r.left) / k),
      y = Math.max(0, (b.top - r.top) / k),
      key = [x, y, b.width, b.height].map(Math.round).join();
    if (key === seen) return;
    seen = key;
    squaresOf(
      live,
      x,
      y,
      Math.min(COLLAGE.W - x, b.width / k),
      Math.min(COLLAGE.H - y, b.height / k),
      b.width < b.height ? 26 : 36,
    );
  };
  const ro = new ResizeObserver(() => requestAnimationFrame(lay));
  ro.observe(sc);
  lay();
  return {
    update() {
      if (sc.classList.contains("grey") !== grey()) {
        sc.classList.toggle("grey", grey());
        pic.src = grey() ? COLLAGE.grey : COLLAGE.pic;
      }
    },
    destroy() {
      ro.disconnect();
      w.destroy();
      layer.classList.remove("px-own");
      sc.remove();
    },
  };
}
