/* ---------- Lobby Settings (owner, Nov 15) ----------
   A button of its own in a game, between the players button and ☰ (never faded; I keep it out of the pause menu):
   it opens the Lobby Settings window (democracy.js), with Game Settings at the top and the Democracy of Ducklings rules
   under it. The button blinks when a setting changes and shows a "!" while a Democracy vote is up. When a vote starts, a
   small see-through note shows under the cloud for a moment ("Democracy of Ducklings: New Legislation is Being
   Passed"); the same line goes in the chat (chat.js) */
import { openDemocracy } from "./democracy.js";
import { dodVoting } from "./rules.js";
import { el } from "./ui.js";

export const DOD_NEWS =
  "Democracy of Ducklings: New Legislation is Being Passed";

/* a gear with a small ballot box in its middle: the room's settings, and the votes on them */
const ICON = `<svg class="lset-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M10.3 1.6h3.4l.5 2.6a8.2 8.2 0 0 1 2.1.9l2.2-1.5 2.4 2.4-1.5 2.2c.4.7.7 1.4.9 2.1l2.6.5v3.4l-2.6.5a8.2 8.2 0 0 1-.9 2.1l1.5 2.2-2.4 2.4-2.2-1.5a8.2 8.2 0 0 1-2.1.9l-.5 2.6h-3.4l-.5-2.6a8.2 8.2 0 0 1-2.1-.9l-2.2 1.5-2.4-2.4 1.5-2.2a8.2 8.2 0 0 1-.9-2.1L1.6 13.7v-3.4l2.6-.5c.2-.7.5-1.4.9-2.1L3.6 5.5 6 3.1l2.2 1.5c.7-.4 1.4-.7 2.1-.9zM12 6.4a5.6 5.6 0 1 0 0 11.2 5.6 5.6 0 0 0 0-11.2z"/><rect x="8.6" y="11" width="6.8" height="4.6" rx=".6" fill="currentColor"/><rect x="11" y="8.4" width="2" height="4" rx=".4" fill="currentColor"/></svg>`;

export const lsetBtnHTML = () =>
  `<button type="button" class="btn ghost iconbtn lset-btn" data-a="lset" aria-label="Lobby Settings" data-tip="Lobby Settings">${ICON}<b class="lset-bang" aria-label="A vote is up" hidden>!</b></button>`;

export const openLobbySettings = (R) => openDemocracy(R, { lobby: true });

/* what counts as "a setting changed": the game settings and the Democracy rules that are on */
const sigOf = (s) =>
  JSON.stringify([s.options || {}, (s.dod && s.dod.on) || {}]);

/* keeps a screen's button (and the note) up to date; call it with each new state */
export function lsetWatch(screen) {
  let sig = null,
    votes = null,
    blinkK = 0;
  return (s) => {
    const btn = screen.querySelector(".lset-btn"),
      v = Object.keys((s.dod && s.dod.votes) || {});
    if (btn) {
      const bang = btn.querySelector(".lset-bang"),
        up = dodVoting(s);
      if (bang.hidden === up) bang.hidden = !up;
      const now = sigOf(s);
      if (sig !== null && now !== sig) {
        // (two names for one blink, so a change during a blink starts it over)
        btn.classList.remove("blink" + blinkK);
        blinkK = 1 - blinkK;
        btn.classList.add("blink" + blinkK);
      }
      sig = now;
    }
    if (votes !== null && v.some((k) => !votes.includes(k))) news(screen);
    votes = v;
  };
}

/* the note under the cloud: fades in, stays a moment, fades out; its X closes it at once */
function news(screen) {
  const old = document.querySelector("body > .dod-news");
  if (old) old.remove();
  const board = screen.querySelector(".board"),
    cloud = board && board.querySelector(".topover .lord"),
    at = (cloud || board || screen).getBoundingClientRect(),
    top = cloud ? at.bottom + 6 : at.top + Math.min(90, at.height * 0.12);
  const pop = el(
    `<div class="dod-news" role="status"><span>${DOD_NEWS}</span><button type="button" class="dod-news-x" aria-label="Close">×</button></div>`,
  );
  pop.style.top = `${Math.round(top)}px`;
  pop.querySelector(".dod-news-x").onclick = () => pop.remove();
  pop.addEventListener("animationend", (e) => {
    if (e.animationName === "dod-news") pop.remove();
  });
  document.body.append(pop); // (over the screen, where the screen's own layout rules can't move it; it goes by itself)
  /* centered under the cloud, kept inside the screen */
  const half = pop.offsetWidth / 2,
    mid = board ? at.left + at.width / 2 : innerWidth / 2;
  pop.style.left = `${Math.round(Math.max(half + 8, Math.min(innerWidth - half - 8, mid)))}px`;
}
