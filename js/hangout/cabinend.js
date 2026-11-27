/* ---------- End Cabin / Exit Cabin ----------
   A small vote button at the board's top left in Hangout ("End Cabin"), Quacky Zombies ("Exit Cabin", or "Exit Downpour" on Downpour) and Sandbox ("Leave Sandbox", on any map). A click votes, a
   click again takes the vote back (never Enter or E). Half of the people (not the computers) start a 10 second timer
   that shows on the button; fewer than half stops it. The rules are in js/rules.js (`cabinEnd`, `cabinOver`). */
import { cabinVotes, cabinNeeded, isHang, inWorld } from "../rules.js";
import { isSb, sbOnBoard } from "../sandboxrules.js";
import {
  isL4dd,
  srVote,
  srCan,
  startOf,
  START_ROUNDS,
  START_PTS,
  waitNeed,
} from "../l4ddrules.js";

/* getR: () => the room; returns a function that takes the button away */
export function mountCabinEnd(S, getR) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn ghost cabin-end";
  b.onclick = () => {
    const R = getR();
    if (R && R.state.gmTest)
      import("../gmodes.js").then((m) => m.stopTest(R)); // (Sandbox's Test game mode: the host's Stop test)
    else if (R) R.send({ t: "cabinEnd" });
  };
  S.append(b);
  /* Quacky Zombies' round 0 (the owner's, Nov 16): "Change starting round" under the button, with "Starting round set to
     N" under it; pressing it picks a round and starts a vote, "Start at round N" at the top middle, Yes and No at the
     bottom middle (l4ddrules.js srVote) */
  const sr = document.createElement("div"),
    srv = document.createElement("div"),
    srb = document.createElement("div");
  sr.className = "l4-sr";
  srv.className = "l4-srv";
  srb.className = "l4-srb";
  srv.setAttribute("role", "status");
  let pick = false,
    srSig = "";
  const send = (o) => {
    const R = getR();
    if (R) R.send({ t: "hang", k: "l4", ...o });
  };
  sr.addEventListener("click", (e) => {
    const c = e.target.closest("button");
    if (!c) return;
    if (c.dataset.n) {
      pick = false;
      send({ do: "sr", n: +c.dataset.n });
    } else pick = !pick;
    srSig = "";
    paintSr();
  });
  srb.addEventListener("click", (e) => {
    const c = e.target.closest("button");
    if (c) send({ do: "srv", on: c.dataset.v === "1" });
  });
  S.append(sr, srv, srb);
  const paintSr = () => {
    const R = getR();
    if (!R) return;
    const s = R.state,
      L = s.hang && s.hang.l4,
      show =
        isL4dd(s) &&
        !isSb(s) && // (Sandbox: no rounds to start at)
        !!L &&
        L.r === 0 &&
        !L.over &&
        !(R.state.players[R.me] || {}).bot,
      v = show ? srVote(s) : null,
      can = show && srCan(s, R.me),
      mine = v ? (v.v || {})[R.me] : undefined,
      yes = v ? Object.values(v.v || {}).filter((x) => x === 1).length : 0,
      sig = JSON.stringify([
        show,
        show && startOf(s),
        can,
        pick,
        v,
        !!(show && L.srDone),
      ]);
    if (sig === srSig) return;
    srSig = sig;
    sr.hidden = !show;
    srv.hidden = !v;
    srb.hidden = !v || mine !== undefined;
    if (!show) return;
    sr.innerHTML =
      (can || pick
        ? `<button type="button" class="btn ghost">Change starting round</button>`
        : "") +
      (pick && can
        ? `<div class="l4-sr-pick">${START_ROUNDS.map((n) => `<button type="button" class="btn ghost" data-n="${n}">${n}${START_PTS[n] ? ` · ${START_PTS[n].toLocaleString("en-US")}` : ""}</button>`).join("")}</div>`
        : "") +
      `<span class="l4-sr-say">Starting round set to ${startOf(s)}</span>`;
    if (v) {
      const by = (s.players[v.by] || {}).name || "A duck";
      srv.textContent = `Start at round ${v.n} · ${yes}/${waitNeed(s)}`;
      srv.title = `${by} asked`;
      srb.innerHTML = `<button type="button" class="btn yellow" data-v="1">Yes</button><button type="button" class="btn" data-v="0">No</button>`;
    }
  };
  const paint = () => {
    paintSr();
    const R = getR();
    if (!R) return;
    const s = R.state,
      on =
        ((isHang(s) && inWorld(s)) ||
          (sbOnBoard(s) && s.phase === "sandbox")) &&
        !(R.state.players[R.me] || {}).bot, // (and Sandbox's Leave Sandbox, on the board too)
      c = s.cabinEnd || {},
      left = c.at ? Math.max(0, Math.ceil((c.at - Date.now()) / 1000)) : 0,
      test = isSb(s) && !!s.gmTest,
      txt = test
        ? "Stop test"
        : `${isSb(s) ? (s.gmPlay ? `Leave ${s.options.gmName || "the game"}` : "Leave Sandbox") : isL4dd(s) ? "Exit Downpour" : "End Cabin"} ${cabinVotes(s)}/${cabinNeeded(s)}${c.at ? ` · ${left}s` : ""}`;
    b.hidden = !on || (test && s.hostId !== R.me); // (Stop test: the host's own; the others wait)
    b.classList.toggle("on", !!(c.by || {})[R.me]);
    b.classList.toggle("ticking", !!c.at);
    b.setAttribute("aria-pressed", (c.by || {})[R.me] ? "true" : "false");
    if (b.textContent !== txt) b.textContent = txt;
  };
  paint();
  const t = setInterval(paint, 250);
  return () => {
    clearInterval(t);
    b.remove();
    sr.remove();
    srv.remove();
    srb.remove();
  };
}
