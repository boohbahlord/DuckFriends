/* ---------- the start: settings on the page, the background, the jump counter, the first screen ---------- */
import "./pointer.js"; // (first: a computer or a phone, before anything asks)
import { applySettings, askConnection } from "./settings.js";
import { backdropHTML, floorCanvas } from "./art.js";
import { bakeBackdrop } from "./pxbake.js";
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

/* the carnival behind the page, redrawn to fit when the window or the theme changes */
let lastBD = "";
const drawShapes = () => {
  const k = [innerWidth, innerHeight, profile.settings.theme, gridPx()].join();
  if (k === lastBD) return;
  lastBD = k;
  const sh = $("#shapes");
  sh.classList.remove("px-own"); // (the filter again until the new one is made into pixels)
  sh.innerHTML = backdropHTML(
    innerWidth,
    innerHeight,
    profile.settings.theme === "dark",
  );
  if (!pixelOn()) return floorCanvas(sh);
  bakeBackdrop(sh).then((ok) =>
    floorCanvas(sh, ok && sh.isConnected ? gridPx() : 0),
  ); // (its pictures made into pixels once: pxbake.js)
};
document.addEventListener("settings", drawShapes);
addEventListener("pxgrid", drawShapes);
let rsT = null;
addEventListener("resize", () => {
  clearTimeout(rsT);
  rsT = setTimeout(drawShapes, 200);
});
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

start("front");
showSplash();
fullOnFirstTap(); // (a phone: the first tap on the start screen goes full screen)
/* the installed app: sw.js lets the browser offer "Install" (a phone's home screen, a computer's apps) */
if ("serviceWorker" in navigator && isSecureContext)
  navigator.serviceWorker
    .register("sw.js", { updateViaCache: "none" })
    .catch(() => {});
loadingScreen({ duck: profile.duck, ready: pageReady }); // (the page's own loading screen, in index.html, goes when the first screen is drawn)
document.getElementById("lite-link")?.remove(); // (the light install link on the page's loading screen: the game came, so it goes)
/* the rest of the game (the rooms, the lobby, the game, every mode's rules), now that the first screen is up: later.js */
rest();
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
