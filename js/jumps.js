/* ---------- the jump counter ----------
   Counts completed jumps: a jump counts when the duck lands, not when Space is pressed. The total is kept on this device
   across games; the room also keeps this game's jumps for the stat boxes. The counter sits at the bottom middle: in the
   bottom bar where a screen has one (so nothing overlaps it), otherwise on its own. */
import { profile, save } from "./store.js";
import { fmtJumps } from "./format.js";
import { activeRoom } from "./net.js";
import { checkUnlocks } from "./unlocks.js";

export function showJumps(root) {
  const html = `Jumps <b>${fmtJumps(profile.jumps)}</b>`;
  const nodes = [
    ...document.querySelectorAll("#jumps, .jumps-slot"),
    ...(root && root.querySelectorAll
      ? root.querySelectorAll(".jumps-slot")
      : []),
  ];
  nodes.forEach((n) => {
    if (n._html !== html) {
      n._html = html;
      n.innerHTML = html;
    }
  });
}
export function countJump() {
  profile.jumps = (profile.jumps || 0) + 1;
  save();
  showJumps();
  checkUnlocks();
  const r = activeRoom();
  if (!r) return;
  r.send({ t: "jumps", n: (r.state.jumps[r.me] || 0) + 1 });
  const st = profile.stats[(r.state.options && r.state.options.mode) || "aod"];
  if (st) st.jumps++; // all-time, test rooms too
}
document.addEventListener("settings", showJumps);
