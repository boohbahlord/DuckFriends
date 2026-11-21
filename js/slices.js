/* ---------- long work cut into slices (the owner's, Nov 20 22:23Z: "the game hangs up") ----------
   A task that holds the page for more than a moment freezes everything on it: the pointer, the music bar, the
   animations. So long work is done a slice at a time, and between slices the page gets a turn (CLAUDE.md "Smooth frames
   and loading": no task over 50 ms; 8 ms while playing). */

/* give the page a turn: scheduler.yield where the browser has it (it comes back ahead of other waiting work), else a
   new task */
export const yieldNow = () =>
  globalThis.scheduler && scheduler.yield
    ? scheduler.yield()
    : new Promise((ok) => setTimeout(ok, 0));

/* a slice's clock: true once budget ms have gone by since the slice began (then yield and start a new one) */
export function sliceClock(budget = 8) {
  let t0 = performance.now();
  return {
    over: () => performance.now() - t0 > budget,
    async next() {
      await yieldNow();
      t0 = performance.now();
    },
  };
}
