/* ---------- what the game's loading screen waits for (the owner's, Nov 20 20:46Z: "countless moments of like jittering,
   like pop-ins, things being unloaded ... I don't care if you have good frames, if the game plays like you see it in
   this footage") ----------
   Whatever a game needs before it can be seen says so here: a map's pixel files, every piece of the map made and
   decoded, every duck and zombie picture made into pixels. The loading screen (lobby.js) stays up until none is still on
   its way, so nothing pops in once the game shows. Anything held after that is waited for by nobody: it's only
   counted, so a test can see what came late. */
const held = new Set();
export function holdGame(p) {
  if (!p || typeof p.then !== "function") return p;
  held.add(p);
  const off = () => held.delete(p);
  p.then(off, off);
  return p;
}
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
/* every hold settled, and none new for two frames after (what a game draws first asks for more: its map's pieces, then
   their pixels) */
export async function gameHeld(maxMs = 60000) {
  const t0 = performance.now();
  for (;;) {
    await frame();
    await frame();
    if (!held.size || performance.now() - t0 > maxMs) return;
    await Promise.race([
      Promise.allSettled([...held]),
      new Promise((r) =>
        setTimeout(r, Math.max(0, maxMs - (performance.now() - t0))),
      ),
    ]);
  }
}

/* a piece out of view: unseen but still laid out at the size it shows (opacity 0; its place far off to the side is the
   caller's), so pxdom.js makes its pixels while the game loads and keeps them, never the moment it comes into view
   (display:none it can't measure; visibility it would copy into the picture). Its own fade (.hp, .l4-boards) skipped:
   it's there or it isn't */
export function offView(el, off) {
  const v = off ? "0" : "";
  if (el._off === v) return;
  el._off = v;
  el.style.transition = "none";
  el.style.opacity = v;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => (el.style.transition = "")),
  );
}
