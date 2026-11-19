/* ---------- the rest of the game, once the first screen is up (the owner's, Nov 19: a slow phone's first load) ----------
   The front screen needs only a fifth of the game's files. So the page loads those first (main.js and what it imports,
   preloaded by index.html), draws the front screen, and only then asks for the rest: the rooms, the lobby, the game and
   everything they bring (the rules of every mode, Duck Cabin …), all at once (their list is in index.html, written by
   tools/stamp.py). Anything pressed before the rest is here waits on the loading screen. */
import { loadingScreen } from "./loading.js";
import { profile } from "./store.js";

let NET = null,
  all = null;

/* the room code (net.js), once it's here: no room can be open before that */
export const net = () => NET;
export const activeRoom = () => (NET ? NET.activeRoom() : null);

/* the rest's files, all asked for at once (one level after another would cost a round trip each) */
function preload() {
  let list = [];
  try {
    list = JSON.parse(document.getElementById("df-later").textContent);
  } catch {}
  for (const href of list) {
    const l = document.createElement("link");
    l.rel = "modulepreload";
    l.href = href;
    document.head.append(l);
  }
}

export function rest() {
  if (!all) {
    preload();
    all = Promise.all([
      import("./net.js"),
      import("./rooms.js"),
      import("./lobby.js"),
      import("./game.js"),
      import("./friends.js"),
    ]).then(([n]) => {
      NET = n;
      window.dfStarted = 1; // (the page's way out of a stuck start, in index.html, stands down)
      try {
        sessionStorage.removeItem("df-retry");
      } catch {}
    });
    /* a file that didn't come: the page's way out of a stuck start (fetch it all again, then load the page again) */
    all.catch(() => window.dfStuck && window.dfStuck());
  }
  return all;
}

/* something that has to load first (the rest, or a window's own file): the loading screen shows if it takes more than a
   moment, until it's here */
export function soon(load) {
  let done = false;
  const p = load();
  p.then(
    () => (done = true),
    () => (done = true),
  );
  setTimeout(() => {
    if (!done)
      loadingScreen({ duck: profile.duck, ready: () => p, max: 600000 });
  }, 150);
  return p;
}
