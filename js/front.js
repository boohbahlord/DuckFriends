/* ---------- the front page ----------
   The name at the top in the middle (on a phone, above the buttons); Play, Single Player (the app only), Customize, Settings, Updates and Install Duck Friends on the left with one short line
   under them; a ball pit across the whole bottom of the page with the duck sitting in it on the right. */
import { register, go } from "./router.js";
import { el } from "./ui.js";
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

let mbarOff = null,
  keptOff = null;
/* Single Player (the owner's, Nov 18): in the installed app, under Play; greyed out until the whole game is on the
   device (offline.js), then a room on this device only, with no internet: Hangout, Dead Ducks Arcade and Mad God
   Justin */
const soloNote = (k) =>
  k.ready
    ? "No internet needed"
    : k.total
      ? `Downloading ${Math.floor((100 * k.done) / k.total)}%`
      : navigator.onLine === false
        ? "Needs internet once"
        : "Getting ready …";
const soloBtnHTML = () =>
  inApp()
    ? `<button type="button" class="btn big ghost site-btn solo-btn" data-a="solo"${keptState().ready ? "" : " disabled"}>Single Player<small>${soloNote(keptState())}</small></button>`
    : "";
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

register("front", {
  leave() {
    if (mbarOff) mbarOff();
    if (keptOff) keptOff();
    mbarOff = keptOff = null;
  },
  render() {
    const s = el(`<section class="screen front">
      <h1 class="brand">${rainbowHTML("DuckFriends")}</h1>
      <div class="front-left">
        <div class="front-btns">
          <button type="button" class="btn big green" data-a="play">Play</button>
          ${soloBtnHTML()}
          <button type="button" class="btn big ghost" data-a="customize">Customize</button>
          <button type="button" class="btn big ghost" data-a="settings">Settings</button>
          <button type="button" class="btn big ghost up-btn" data-a="updates">Updates</button>
          ${installBtnHTML()}
          <a class="btn big ghost site-btn" href="https://boohbahlord.github.io/Nous-Within-Kenoma/">My Other Website<small>Nous Within Kenoma</small></a>
        </div>
        <p class="front-line">Party games for friends on a voice call.</p>
      </div>
      <div class="pit" aria-hidden="true">${pitSVG("back")}<div class="hero-duck bob">${heroDuckSVG()}</div>${pitSVG("front")}</div>
    </section>`);
    s.querySelector('[data-a="play"]').onclick = () => go("rooms");
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
    const solo = s.querySelector('[data-a="solo"]');
    if (solo) {
      solo.onclick = () => keptState().ready && playSolo();
      if (keptOff) keptOff();
      keptOff = onKept((k) => {
        solo.disabled = !k.ready;
        solo.querySelector("small").textContent = soloNote(k);
      });
    }
    const ib = s.querySelector('[data-a="install"]');
    if (ib) ib.onclick = () => install();
    if (mbarOff) mbarOff();
    mbarOff = mountCornerMusicBar();
    return s;
  },
});
