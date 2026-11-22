/* ---------- the courtroom's seats: Lawyering and Duncelation stand their ducks the same way ----------
   Both modes put the ones who are not on the stand in two rows, as even as can be, and only differ in how high the
   upper row is (the owner's, Nov 22: this was written out in each, A4). A leaf: it imports nothing. */
/* place the ducks ids in two rows across the middle of the room, the first half on the upper row (y: upper) and the
   rest on the lower one (y: lower), in the board units of s.pos */
export function seatRows(s, ids, upper, lower) {
  const half = Math.ceil(ids.length / 2);
  ids.forEach((id, k) => {
    const top = k < half,
      i = top ? k : k - half,
      n = top ? half : ids.length - half;
    s.pos[id] = {
      x: 0.44 + (0.12 * (i + 1)) / (n + 1),
      y: top ? upper : lower,
    };
  });
}
