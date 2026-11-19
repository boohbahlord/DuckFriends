/* ---------- Single Player's files on the device (the owner's, Nov 18) ----------
   In the installed app only: the service worker (sw.js) keeps the whole game on the device, so Single Player plays with
   no internet. Each start with a connection (and each time the connection comes back) it brings the copy up to the
   site's version, downloading only what changed. The front page's Single Player button stays greyed out until the copy
   is whole. keptState(): { ready, done, total } */
import { inApp } from "./corners.js";

let st = { ready: false, done: 0, total: 0 };
const fns = new Set();
export const keptState = () => st;
export const onKept = (f) => {
  fns.add(f);
  return () => fns.delete(f);
};

const sw =
  "serviceWorker" in navigator && isSecureContext
    ? navigator.serviceWorker
    : null;
/* a device that got the game from the light install page (get/index.html, the owner's, Nov 19: for a bad connection)
   keeps its copy up to date on the website too */
let lite = false;
try {
  lite = localStorage.getItem("df-lite") === "1";
} catch {}
if (sw && (inApp() || lite)) {
  sw.addEventListener("message", (e) => {
    const m = e.data || {};
    if (m.t !== "kept") return;
    st = { ...st, ...m, ready: !!m.ready };
    fns.forEach((f) => f(st));
  });
  const ask = (t) =>
    sw.ready.then((reg) => reg.active && reg.active.postMessage({ t }));
  const start = () => {
    ask("kept?");
    if (navigator.onLine !== false) ask("keep");
  };
  start();
  addEventListener("online", () => ask("keep"));
  /* the first start after a new version: the asking above reached the old worker, which doesn't know these messages,
     so the button sat on "Getting ready" until the app was opened again (the owner's, Nov 18). The new worker takes
     the page over a moment later; ask it again then */
  sw.addEventListener("controllerchange", start);
}
