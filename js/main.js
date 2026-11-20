/* ---------- the start: settings on the page, the background, the jump counter, the first screen ---------- */
import "./pointer.js"; // (first: a computer or a phone, before anything asks)
import "./upbar.js"; // (the green bar on every upload button)
import { applySettings, askConnection } from "./settings.js";
import { floorCanvas } from "./art.js";
import { mountWorld } from "./pxmap.js";
import BOARD from "./pxm/board.js";
import BOARD_LIGHT from "./pxm/board-light.js";
import { profile, save } from "./store.js";
import { $, toast } from "./ui.js";
import { start, current } from "./router.js";
import { showJumps } from "./jumps.js";
import { checkUnlocks, takeOffLocked } from "./unlocks.js";
import "./homeapp.js"; // (early: it keeps the browser's install offer for the front page's button)
import "./front.js";
import { pixelOn, pxImgWatch, gridPx } from "./pixel.js"; // (first: the pixel look's class goes on before anything draws)
import { pxWatch } from "./pxdom.js";
import { pxEmojiWatch } from "./pxtext.js";
import "./music.js";
import "./keynav.js";
import { acct, onAccount, accountStart, signIn } from "./account.js";
import { rest, soon } from "./later.js";
import { showSplash } from "./splash.js";
import { fullOnFirstTap, fsBtnHTML } from "./corners.js";
import { loadingScreen, pageReady } from "./loading.js";
import { squarePixels, DUCK_PIC_PX, CARD_PIC_PX } from "./duck.js";

applySettings();

/* the carnival behind the page (Night Show's world, as pixel files: js/pxmap.js), the light one in the light theme */
let lastBD = "",
  shapes = null;
const drawShapes = () => {
  const dark = profile.settings.theme === "dark";
  if (String(dark) === lastBD) return;
  lastBD = String(dark);
  const sh = $("#shapes");
  if (shapes) shapes.destroy();
  sh.replaceChildren();
  const world = dark ? BOARD : BOARD_LIGHT;
  shapes = mountWorld(sh, world);
  floorCanvas(shapes.stage, world.G); // (the floor's breathing rows, on one canvas: art.js)
  sh.classList.add("px-own"); // (pixels already: the filter leaves it)
};
document.addEventListener("settings", drawShapes);
drawShapes();

/* the jump counter at the bottom middle; anything already earned and not yet announced says so a moment later. Anything
   worn from before it was locked (the dunce hat) comes off first */
if (takeOffLocked().length) save();
showJumps();
setTimeout(checkUnlocks, 2500);

/* ---------- Sign in (top right); once signed in it opens Friends, with a count of invites and requests ---------- */
const corner = $("#signin");
corner.insertAdjacentHTML("beforebegin", fsBtnHTML()); // (full screen, left of Sign in / Friends)
const paintCorner = () => {
  corner.classList.remove("off");
  if (acct.uid) {
    const n = Object.keys(acct.reqs).length + Object.keys(acct.invs).length;
    corner.innerHTML = `Friends${n ? ` <span class="badge">${n}</span>` : ""}`;
    corner.dataset.tip = "Friends, your friend code and sign out (Shift+\\)";
  } else {
    corner.textContent = "Sign in";
    corner.dataset.tip =
      "Sign in with Google: your duck, name and settings follow you to any device, and you can have friends.";
  }
};
corner.onclick = () =>
  acct.uid
    ? soon(rest).then(() => import("./friends.js").then((m) => m.openFriends()))
    : signIn();
onAccount(paintCorner);
paintCorner();
/* a duck's or a card's picture saved before pictures were made into real pixels (a 128 px JPEG): made into them now,
   and only they are kept (the owner's, Nov 19 23:26Z: "we don't have the leftover image behind") */
async function oldPictures() {
  let changed = false;
  for (const [o, px] of [
    [profile.duck, DUCK_PIC_PX],
    [profile.card, CARD_PIC_PX],
  ]) {
    if (!o || !o.image) continue;
    const d = await squarePixels(o.image, px);
    if (d !== o.image) {
      o.image = d;
      changed = true;
    }
  }
  if (changed) save();
}
oldPictures();
/* the account's profile came in: show it */
addEventListener("duck-profile", () => {
  oldPictures();
  if (takeOffLocked().length) save();
  applySettings();
  showJumps();
  if (["front", "rooms"].includes(current())) start(current());
  toast("Signed in: your profile is here.");
  setTimeout(checkUnlocks, 3500);
});

/* the browser's own drag (a ghost of the picture or text under the mouse) never starts anywhere in the game: mid-fight it
   swallowed the key-ups, so the duck walked on by itself into the zombies (the owner's, Nov 20 21:41Z: "my mouse might
   click on a zombie and drag its images ... make me lose control of my duck"). Nothing in the game uses the browser's
   drag; typing boxes keep their own. Text can't be selected in a game either (css/app.css) */
const typing = (t) =>
  t && t.closest && t.closest("input, textarea, select, [contenteditable]");
addEventListener(
  "dragstart",
  (e) => typing(e.target) || e.preventDefault(),
  true,
);
addEventListener(
  "selectstart",
  (e) =>
    document.body.dataset.screen === "game" &&
    !typing(e.target) &&
    e.preventDefault(),
  true,
);
start("front");
showSplash();
fullOnFirstTap(); // (a phone: the first tap on the start screen goes full screen)
/* the installed app: sw.js lets the browser offer "Install" (a phone's home screen, a computer's apps) */
if ("serviceWorker" in navigator && isSecureContext)
  navigator.serviceWorker
    .register("sw.js", { updateViaCache: "none" })
    .catch(() => {});
const firstUp = pageReady();
loadingScreen({ duck: profile.duck, ready: () => firstUp, max: 90000 }); // (the page's own loading screen, in index.html, goes when the first screen is drawn, its pictures in: never after a fixed time)
document.getElementById("lite-link")?.remove(); // (the light install link on the page's loading screen: the game came, so it goes)
/* the rest of the game (the rooms, the lobby, the game, every mode's rules), once the first screen is up with its
   pictures in: later.js. Before, it was asked for at once, and on a slow line its code took the line from the start
   screen's pictures (the owner's, Nov 20 20:31Z). A press before then asks for it at once (router.js) */
firstUp.then(rest);
setTimeout(accountStart, 300);
setTimeout(askConnection, 600); // once, on the first visit   // a device that signed in before connects after the first screen is up

/* the pixel look (pixel.js): every drawing on the page shown as pixels, as it comes and as it changes (pxdom.js). The
   maps and the menus' backdrop are left to the grid filter (their parts move too much for pictures: data-nopx) */
let pxStop = null;
const pxStart = () => {
  if (!pixelOn() || pxStop) return;
  pxStop = pxWatch(document.body);
  pxImgWatch(document.body); // (and every <img>: pixel.js)
  pxEmojiWatch(document.body); // (and every emoji: pxtext.js)
};
pxStart();
