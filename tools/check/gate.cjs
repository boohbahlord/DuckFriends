/* I want the weapon gate (js/weaponuse.js) held to the two ways it worked before it was one module (step 8f-1): the
   board's (rules.js: still waiting while now < its end, less a fifth of its wait for full auto) and the maps'
   (l4ddrules.js: still waiting while the time since the last use is under the wait, four fifths of it for full auto).
   A TEST room never shows the full-auto slack (its shots come exactly on time), so this asks the gate itself, around
   every edge, against those two ways written out as they were. */
const path = require("path");
const { fail } = require("./lib.cjs");
(async () => {
  const W = await import(
    "file://" + path.resolve(__dirname, "../../js/weaponuse.js")
  );
  const board = (now, ends, cool, auto) => now < ends - (auto ? cool * 0.2 : 0);
  const maps = (now, last, cool, auto) => now - last < cool * (auto ? 0.8 : 1);
  let n = 0,
    bad = [];
  for (const cool of [60, 85, 100, 120, 133, 400, 1500])
    for (const auto of [false, true])
      for (let d = -2; d <= cool + 2; d++) {
        const last = 1e6,
          now = last + d,
          ends = last + cool + (d % 3 === 0 ? 50 : 0); // (now and then a reload past the wait)
        const b = W.waiting(W.GATE_BREEDS.board, { auto, cool, ends }, now),
          m = W.waiting(W.GATE_BREEDS.maps, { auto, cool, last }, now);
        if (b !== board(now, ends, cool, auto))
          bad.push(`board ${cool} ${auto} ${d}`);
        if (m !== maps(now, last, cool, auto))
          bad.push(`maps ${cool} ${auto} ${d}`);
        n += 2;
      }
  const s = { zcake: null };
  if (
    W.heldBack(s, "zebra", () => true) ||
    !W.heldBack({ zcake: {} }, "zebra", () => false) ||
    !W.heldBack(s, "laser", () => true) ||
    W.heldBack(s, "laser", () => false) ||
    W.heldBack(s, "handgun", () => true)
  )
    bad.push("heldBack");
  for (const [A, left, want] of [
    [{ burst: 3 }, 5, 3],
    [{ burst: 3 }, 2, 2],
    [{}, 5, 1],
    [null, 5, 1],
  ])
    if (W.roundsOf(A, left) !== want) bad.push(`roundsOf ${left}`);
  for (const [left, many, empty] of [
    [3, 1, false],
    [1, 1, true],
    [2, 3, true],
  ]) {
    const r = W.afterShots(left, many);
    if (r.left !== left - many || r.empty !== empty)
      bad.push(`afterShots ${left} ${many}`);
  }
  if (bad.length)
    fail(
      `the weapon gate parted from the old ways: ${bad.slice(0, 6).join("; ")}`,
    );
  console.log(`gate: ${n} waits, held back, rounds and magazines as before`);
})();
