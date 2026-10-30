/* ---------- Updates ----------
   What changed, newest first, one page per day, each a "Version N" (N counts the deployments of the game: the merges to main up to that day). The Updates button on the front page opens this window and shows a dot
   until the newest page has been opened on this device. I want short, plain words for players, not a list of everything. */
import { openWindow, esc } from "./ui.js";
import { rainbowHTML } from "./art.js";
import { openReport, reportLinkHTML } from "./report.js";

export const UPDATES = [
  {
    id: "2026-10-30",
    version: 101,
    date: "Oct 30, 2026",
    title: "Duncelation and Mad God Justin",
    news: [
      "A new game, Mad God Justin: everyone gets a knife, and together you stab Justin down before the timer runs out. He shoots back.",
      "Late in the fight he calls a meteor down on everyone and comes back with a pump shotgun.",
      "Beat him 10 times to unlock his lightning eyes.",
      "A new game, Duncelation: defend the take you get while everyone walks to Dunce or Not a Dunce.",
      "Voted a dunce: lightning, the LOSER podium, and the dunce hat in black and white for the rest of the game.",
      "The dunce hat is now locked: be voted a dunce 10 times to wear it.",
      "Report Bug or Suggest Ideas, at the bottom of this window and of Settings.",
      "Duncelation: End round, beside Vote. It ends the take once the defender and enough players press it.",
    ],
  },
  {
    id: "2026-10-29",
    version: 98,
    date: "Oct 29, 2026",
    title: "Waiting for players and floating chat",
    news: [
      "A game that drops below the players it needs waits for them instead of ending.",
      "The newest chat message floats by the chat button for a moment (Settings → Chat).",
      "Justin swings a hammer now and then, and calls down lightning or fire.",
      "Lawyering is now Lawyering; Juryful of Ducklings, and Bicker Brackets can have 64 contenders.",
      "The last writers get 30 seconds once enough have sent theirs, and unvoting stops the countdown.",
      "Duck Cabin: no ghost while you're busy at the piano, the chalk, a table or a seat.",
      "Upcoming Updates and Release Dates, at the bottom of this window.",
    ],
    fixed: [
      "Who is the Quack? never shows who is picking the secret word.",
      "Tapping on a phone no longer selects words or pops up a search.",
      "On phones, a toggled special shows its wait on the Specials button.",
    ],
  },
  {
    id: "2026-10-28",
    version: 96,
    date: "Oct 28, 2026",
    title: "Weapons, ghosts and poker",
    news: [
      "New specials: a knife, a hammer (or wrench) and a pistol that holds 7 shots; R reloads.",
      "In Duck Cabin, a new setting turns knocked-out ducks into ghosts that can walk around; Space brings the body back.",
      "Poker at the card table, and you can invite Justin to play.",
      "A knocked-down duck stands up by itself, so you can stay at the table.",
      "Low graphics in Settings, and the font list folds away.",
      "A Stats screen switch for every game, and Review each round for Bicker Brackets (off by default).",
      "Story Chain: a glowing hint from the cloud and an arrow down to the secret words.",
    ],
    fixed: [
      "2/3 of votes now ends the turn at 2 of 3 players.",
      "Bicker Brackets shows the right side on phones.",
      "The piano's get-up button says Esc.",
      "Colorblind mode recolors the two-sided boards.",
      "The music bar stays still when the music is turned all the way down.",
    ],
  },
  {
    id: "2026-10-27",
    version: 87,
    date: "Oct 27, 2026",
    title: "Blackjack, Jack in a Box and outfits",
    news: [
      "Blackjack on the round table, with eight stools and Justin's Butler dealing.",
      "Jack and Jill in a Box, plus jester and clown items; locked ones show how to get them.",
      "A real pumpkin, antenna eyes and color dropdowns.",
      "Justin joins every game mode.",
    ],
    fixed: [
      "Outfit fixes: the biker jacket, Swiss cheese, the gold crown and the coolest-first metals.",
      "The wing shows under tank tops and jerseys.",
      "Fewer pops and crackles in songs and the piano.",
    ],
  },
  {
    id: "2026-10-26",
    version: 80,
    date: "Oct 26, 2026",
    title: "Power box and the dark",
    news: [
      "Duck Cabin has a power box: flip the lever and the lights, the TV and the music go out.",
      "It is darker outside, flames can be put out, and the music sounds muffled in the dark.",
    ],
    fixed: [
      "The Duck Cabin phone button no longer sits under tips.",
      "Key hints are hidden on touch-only phones.",
    ],
  },
  {
    id: "2026-10-25",
    version: 58,
    date: "Oct 25, 2026",
    title: "Night Show and the toy train",
    news: [
      "The Night Show room has a toy train.",
      "Duck Cabin's cats, Justin and the shadow duck.",
    ],
    fixed: ["Players who join mid-game play right away."],
  },
];

/* what's coming: the owner sets each date (blank: "Date to be announced"); a thing leaves this list once it's out */
export const UPCOMING = [];

const KEY = "duckfriends-updates-seen";
export const seenUpdate = () => {
  try {
    return localStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
};
export const hasNewUpdate = () => seenUpdate() !== UPDATES[0].id;
const markSeen = () => {
  try {
    localStorage.setItem(KEY, UPDATES[0].id);
  } catch (e) {
    /* blocked */
  }
};

const list = (cls, head, items = []) =>
  items.length
    ? `<h3 class="up-h ${cls}">${head}</h3><ul class="up-list">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
    : "";

export function openUpdates() {
  markSeen();
  return openWindow(
    `<h2 class="up-title">${rainbowHTML("Updates")}</h2>
    <div class="up-nav"><button type="button" class="btn ghost up-arrow" data-d="1" aria-label="Older update">◀</button>
      <div class="up-head"><b class="up-ver"></b><span class="up-date"></span><span class="up-name"></span></div>
      <button type="button" class="btn ghost up-arrow" data-d="-1" aria-label="Newer update">▶</button></div>
    <div class="up-body"></div><p class="up-count dim"></p>
    <p class="up-count"><button type="button" class="linkbtn" data-a="upcoming">Upcoming Updates and Release Dates</button></p>${reportLinkHTML()}`,
    {
      cls: "win-updates",
      onOpen(w) {
        let i = 0;
        const show = (n) => {
          i = Math.max(0, Math.min(UPDATES.length - 1, n));
          const u = UPDATES[i];
          w.querySelector(".up-ver").textContent = `Version ${u.version}`;
          w.querySelector(".up-date").textContent = u.date;
          w.querySelector(".up-name").textContent = u.title;
          const body = w.querySelector(".up-body");
          body.innerHTML =
            list("new", "New", u.news) + list("fix", "Fixed", u.fixed);
          body.scrollTop = 0; // each version starts at its top
          w.querySelector(".up-count").textContent =
            `${i + 1} of ${UPDATES.length}`;
          w.querySelector('[data-d="1"]').disabled = i === UPDATES.length - 1;
          w.querySelector('[data-d="-1"]').disabled = i === 0;
        };
        w.querySelectorAll(".up-arrow").forEach(
          (b) => (b.onclick = () => show(i + +b.dataset.d)),
        );
        w.querySelector('[data-a="upcoming"]').onclick = openUpcoming;
        w.querySelector('[data-a="report"]').onclick = openReport;
        const key = (e) => {
          if (!w.isConnected) return removeEventListener("keydown", key, true);
          if (e.key === "ArrowLeft") {
            show(i + 1);
            e.preventDefault();
          } else if (e.key === "ArrowRight") {
            show(i - 1);
            e.preventDefault();
          }
        };
        addEventListener("keydown", key, true);
        show(0);
      },
    },
  );
}

/* what's coming next, and when (over the Updates window; its X or Esc goes back to it) */
export function openUpcoming() {
  return openWindow(
    `<h2 class="up-title">${rainbowHTML("Upcoming")}</h2>
    <div class="up-body">${UPCOMING.length ? `<ul class="up-list">${UPCOMING.map((u) => `<li><b>${esc(u.title)}</b><br><span class="dim small">${u.date ? `Release date: ${esc(u.date)}` : "Release date to be announced"}</span></li>`).join("")}</ul>` : '<p class="dim">Nothing announced yet.</p>'}</div>`,
    { cls: "win-updates" },
  );
}
