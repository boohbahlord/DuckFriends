/* ---------- the front page ----------
   The name at the top in the middle (on a phone, above the buttons); Play (it opens the choice of Single player and Multiplayer), Customize, Settings, Updates and Download Duck Friends on the left with one short line
   under them; a ball pit across the whole bottom of the page with the duck sitting in it on the right. */
import { register, go } from "./router.js";
import { el, openWindow } from "./ui.js";
import { pitSVG, heroDuckSVG, rainbowHTML } from "./art.js";
import { openSettings } from "./settings.js";
import { rest, net, soon } from "./later.js";
/* the Updates page (every version's words: one of the biggest files) comes once the first screen is up, not before it
   (the owner's, Nov 19: a slow phone's first load) */
const updates = () => import("./updates.js");
import { mountCornerMusicBar } from "./musicbar.js";
import { installBtnHTML, install } from "./homeapp.js";
import { inApp } from "./corners.js";
import { keptState, onKept } from "./offline.js";

let mbarOff = null;
/* Play opens the choice (the owner's, Nov 21 18:05Z: "You click play and it says single player, multiplayer. There we
   go, boom. Single player, no internet needed ... if you put your mouse over it, it will like give a description that like
   maybe in the bottom of the screen for mobile players, and then maybe somewhere else on the screen for computer players.
   And it'll say that you need to download the game in order to play single player"). Single Player (the owner's, Nov
   18): a room on this device only, with no internet: Hangout, Dead Ducks Arcade and Mad God Justin; it needs the whole
   game on the device (offline.js, the installed app) */
const soloNote = (k) =>
  !inApp()
    ? "You need to download the game to play Single player: use Download Duck Friends on the front page."
    : k.ready
      ? "Plays on this device: no internet needed."
      : k.total
        ? `Downloading the game to this device: ${Math.floor((100 * k.done) / k.total)}%`
        : navigator.onLine === false
          ? "You need to download the game to play Single player: it needs internet once."
          : "Getting the game ready on this device …";
const soloReady = (k) => inApp() && k.ready;
/* (the room code and Customize come with the rest of the game, after the first screen: later.js) */
const openCustomize = () =>
  soon(() => import("./customize.js")).then((m) => m.openCustomize());
function playSolo() {
  soon(rest).then(() =>
    go(
      "lobby",
      net().createLocalRoom({
        name: "Single Player",
        test: false,
        computers: 0,
        max: 1,
        solo: true,
        options: { dod: 0, mode: "l4dd" },
      }),
    ),
  );
}

/* the window: Single player (no internet) and Multiplayer. The note about downloading sits at the window's bottom: on a
   phone (no hover) always, on a computer while the mouse is over Single player (or it has the keys' focus) */
function openPlay() {
  const touch = matchMedia("(hover: none)").matches;
  openWindow(
    `<h2>Play</h2>
    <div class="play-choice">
      <button type="button" class="btn big green site-btn" data-a="multi">Multiplayer<small>With friends, online</small></button>
      <button type="button" class="btn big ghost site-btn" data-a="solo" aria-disabled="true">Single player<small>No internet needed</small></button>
    </div>
    <p class="play-note" aria-live="polite"></p>`,
    {
      cls: "play-win",
      onOpen(win, close) {
        const solo = win.querySelector('[data-a="solo"]'),
          note = win.querySelector(".play-note");
        const show = () => {
          note.textContent = soloNote(keptState());
          note.classList.toggle("shown", true);
        };
        let off = () => {};
        const paint = (k) => {
          if (!win.isConnected) return off(); // (closed: stop listening)
          solo.setAttribute("aria-disabled", soloReady(k) ? "false" : "true");
          if (touch || note.classList.contains("shown"))
            note.textContent = soloNote(k);
        };
        win.querySelector('[data-a="multi"]').onclick = () => {
          close();
          go("rooms");
        };
        solo.onclick = () => {
          if (soloReady(keptState())) {
            close();
            playSolo();
          } else show();
        };
        if (touch) show();
        else {
          solo.onmouseenter = solo.onfocus = show;
          solo.onmouseleave = solo.onblur = () => {
            note.classList.remove("shown");
            note.textContent = "";
          };
        }
        paint(keptState());
        off = onKept(paint);
      },
    },
  ).then(() => {});
}

register("front", {
  leave() {
    if (mbarOff) mbarOff();
    mbarOff = null;
  },
  render() {
    const s = el(`<section class="screen front">
      <h1 class="brand">${rainbowHTML("DuckFriends")}</h1>
      <div class="front-left">
        <div class="front-btns">
          <button type="button" class="btn big green" data-a="play">Play</button>
          <button type="button" class="btn big ghost" data-a="customize">Customize</button>
          <button type="button" class="btn big ghost" data-a="settings">Settings</button>
          <button type="button" class="btn big ghost up-btn" data-a="updates">Updates</button>
          ${installBtnHTML()}
        </div>
        <p class="front-line">Party games for friends on a voice call.</p>
      </div>
      <div class="pit" aria-hidden="true">${pitSVG("back")}<div class="hero-duck bob">${heroDuckSVG()}</div>${pitSVG("front")}</div>
    </section>`);
    s.querySelector('[data-a="play"]').onclick = () => openPlay();
    s.querySelector('[data-a="customize"]').onclick = () => openCustomize();
    s.querySelector('[data-a="settings"]').onclick = () => openSettings();
    const upBtn = s.querySelector('[data-a="updates"]');
    let upOpened = false;
    upBtn.onclick = () => {
      upOpened = true;
      updates().then((m) => m.openUpdates());
      const d = s.querySelector(".up-dot");
      if (d) d.remove();
    };
    updates().then((m) => {
      if (m.hasNewUpdate() && !upOpened && !upBtn.querySelector(".up-dot"))
        upBtn.insertAdjacentHTML(
          "beforeend",
          '<i class="up-dot" aria-label="New"></i>',
        );
    });
    const ib = s.querySelector('[data-a="install"]');
    if (ib) ib.onclick = () => install();
    if (mbarOff) mbarOff();
    mbarOff = mountCornerMusicBar();
    return s;
  },
});
