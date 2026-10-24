/* ---------- one clock for the room ----------
   Online, every device counts in the server's time (its own clock plus the difference Firebase measured), so timers,
   countdowns and jumps line up on every screen. In a room on this device the difference stays 0. */
export const clock = { offset: 0 };
export const now = () => Date.now() + clock.offset;
