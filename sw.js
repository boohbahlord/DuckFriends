/* ---------- the installed app's service worker ----------
   I want Duck Friends installable from the site (a phone's home screen or a computer's apps) and opening in full
   screen without Chrome's "To exit full screen" pop-up. An installed app must never play old files: so this keeps no
   copies at all. Every file comes from the site, and the page itself skips the browser's 10-minute cache, so a deploy
   reaches every installed app on its next open. The game's files carry their version (tools/stamp.py), so they're
   always the new ones once the page is. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.mode !== "navigate") return; // (everything else: the browser as usual)
  e.respondWith(fetch(r, { cache: "no-cache" }).catch(() => fetch(r)));
});
