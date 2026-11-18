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
if (sw && inApp()) {
  sw.addEventListener("message", (e) => {
    const m = e.data || {};
    if (m.t !== "kept") return;
    st = { ...st, ...m, ready: !!m.ready };
    fns.forEach((f) => f(st));
  });
  const ask = (t) =>
    sw.ready.then((reg) => reg.active && reg.active.postMessage({ t }));
  ask("kept?");
  if (navigator.onLine !== false) ask("keep");
  addEventListener("online", () => ask("keep"));
}
