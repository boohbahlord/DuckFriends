/* ---------- the installed app's service worker ----------
   I want Duck Friends installable from the site (a phone's home screen or a computer's apps). This worker does nothing
   else: no copies kept, no requests touched, so it can never hold back or stall a file. The game's files carry their
   version (tools/stamp.py), so the app takes a deploy like the site does. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
