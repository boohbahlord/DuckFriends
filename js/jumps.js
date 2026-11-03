/* ---------- the jump counter ----------
   Counts completed jumps: a jump counts when the duck lands, not when Space is pressed. The total is kept on this device
   across games; the room also keeps this game's jumps for the stat boxes. The counter sits at the bottom middle: in the
   bottom bar where a screen has one (so nothing overlaps it), otherwise on its own. */
import { profile, save, statMode } from "./store.js";
import { fmtJumps } from "./format.js";
import { activeRoom } from "./net.js";
import { checkUnlocks, justinIn } from "./unlocks.js";

/* in a room's bottom bar (.jumps-slot), Justin Kills goes under Jumps in the same box whenever Justin is in the game */
export function showJumps(root) {
  const r = activeRoom(),
    html = `Jumps <b>${fmtJumps(profile.jumps)}</b>`,
    slot =
      r && justinIn(r.state)
        ? `<span class="jumps-n">${html}</span><span class="jumps-jk">Justin Kills <b>${fmtJumps(profile.justinKills)}</b></span>`
        : html;
  const nodes = [
    ...document.querySelectorAll("#jumps, .jumps-slot"),
    ...(root && root.querySelectorAll
      ? root.querySelectorAll(".jumps-slot")
      : []),
  ];
  nodes.forEach((n) => {
    const h = n.id === "jumps" ? html : slot;
    if (n._html !== h) {
      n._html = h;
      n.innerHTML = h;
      n.classList.toggle("jk", h !== html);
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
  const st = profile.stats[statMode(r.state)];
  if (st) st.jumps++; // all-time, test rooms too
}
document.addEventListener("settings", showJumps);
document.addEventListener("jumpsbox", () => showJumps()); // (unlocks.js: a Justin kill, or Justin came into the game or left it)
