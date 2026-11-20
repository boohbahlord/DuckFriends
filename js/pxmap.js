/* ---------- a map as pixel files (the owner's, Nov 19 23:26Z: "we don't have the leftover image behind. It's
   literally pixels") ----------
   A map drawn by its code (SVG and CSS pictures) is made into pixel files once, ahead of time (tools/pixel-maps.cjs):
   the world at the computer's size (1366 × 768 css px, two to a pixel), each picture on it a file in its place, what
   moves a strip of frames played at its own timing (css/app.css .pxs). Here it's shown as it is, grown to cover the
   screen: a pixel of the world is a whole number of the screen's pixels (the grid's two css px on a computer's 1366 ×
   768, a little bigger on a bigger screen), and a narrower screen (a phone) sees its middle, or the slice round
   (fx, fy) (shares of the world) where the map's centerpiece is. Nothing of the map is drawn on the device */
export function mountWorld(root, world, { fx = 0.5, fy = 0.5 } = {}) {
  const st = document.createElement("div");
  st.className = "pxw-stage";
  st.style.width = world.W + "px";
  st.style.height = world.H + "px";
  st.innerHTML = world.html || ""; // (none: its scene lays out its own, Sky)
  root.append(st);
  let at = "";
  const fit = () => {
    const w = root.clientWidth,
      h = root.clientHeight,
      d = devicePixelRatio || 1,
      key = [w, h, d].join();
    if (!w || !h || key === at) return;
    at = key;
    const G = world.G,
      k =
        Math.ceil(Math.max(w / world.W, h / world.H) * G * d - 1e-6) / (G * d),
      sw = world.W * k,
      sh = world.H * k,
      ox = Math.min(0, Math.max(w - sw, w / 2 - fx * sw)),
      oy = Math.min(0, Math.max(h - sh, h / 2 - fy * sh));
    st.style.transform = `translate(${Math.round(ox * d) / d}px, ${Math.round(oy * d) / d}px) scale(${k})`;
  };
  const ro = new ResizeObserver(fit);
  ro.observe(root);
  addEventListener("resize", fit); // (the browser zoomed: its pixels changed size)
  fit();
  return {
    stage: st,
    destroy() {
      ro.disconnect();
      removeEventListener("resize", fit);
      st.remove();
    },
  };
}
