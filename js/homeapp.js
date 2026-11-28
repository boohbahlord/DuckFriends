/* ---------- Download Duck Friends (the front page's button, under Updates, where My Other Website was: the owner's,
   Nov 28, his book site is down and he couldn't find how to download the game) ----------
   I want installing to be one press from the main menu. Chrome and Edge offer the install once the page qualifies
   (manifest.webmanifest, sw.js): I keep that offer and show it when the button is pressed. Where the browser makes no
   offer (Safari, Firefox, or already installed) the button says how instead. Inside the installed app it's hidden. */
import { inApp } from "./corners.js";
import { toast } from "./ui.js";

let offer = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // (kept for the button)
  offer = e;
});
addEventListener("appinstalled", () => {
  offer = null;
  for (const b of document.querySelectorAll("[data-a=install]")) b.remove();
});

export const installBtnHTML = () =>
  inApp()
    ? ""
    : '<button type="button" class="btn big ghost site-btn" data-a="install">Download<small>Duck Friends</small></button>';

export async function install() {
  if (offer) {
    const o = offer;
    offer = null;
    o.prompt();
    await o.userChoice.catch(() => {}); // (an offer is good once; turned down, the browser offers it again later)
    return;
  }
  const ua = navigator.userAgent;
  const apple =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  toast(
    apple
      ? "To install: tap Share, then Add to Home Screen."
      : /Firefox/.test(ua)
        ? "Firefox can't install it: open this page in Chrome or Edge, then press Download Duck Friends."
        : "Already installed, or your browser isn't ready yet: look for Duck Friends in your apps, or use the browser menu's Install app.",
    6000,
  );
}
