/* ---------- the installed app's service worker ----------
   I want Duck Friends installable from the site (a phone's home screen or a computer's apps), and in the installed app
   playable with no internet at all: Single Player (the owner's, Nov 18). The app asks this worker (js/offline.js) to
   keep the whole game on the device: the page, the scripts and the stylesheet with the versions index.html names, and
   every file offline.json lists (tools/stamp.py writes it), each one downloaded again only when its fingerprint
   changed. The page moves to a new version only once every file of that version is kept, so the copy on the device
   always works as a whole.
   Answering: with nothing kept (the website), every request goes to the network as before. With the copy kept, a file
   whose name carries its version (?v=) comes from the device; anything else comes from the network, or from the device
   when the network fails or takes more than 4 s, so a bad connection never stalls the game. */
const CACHE = "df-files";
const SLOW = 4000;
const here = (p) => new URL(p, self.registration.scope).href;
const PAGE = () => here("index.html");
const META = () => here("df-meta"); // (in the cache: { v, files: { path: fingerprint }, done })

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(answer(r));
});

async function answer(r) {
  if (!(await caches.has(CACHE))) return fetch(r);
  const c = await caches.open(CACHE),
    page = r.mode === "navigate",
    key = page ? PAGE() : r.url;
  if (!page && new URL(r.url).searchParams.has("v")) {
    const hit = await c.match(key);
    if (hit) return hit;
  }
  const net = fetch(r);
  net.catch(() => {}); // (answered from the device instead, its failure is nobody's business)
  try {
    const res = await Promise.race([
      net,
      new Promise((ok) => setTimeout(ok, SLOW, null)), // (too slow: null)
    ]);
    if (res && (res.ok || !page)) return res;
    throw new Error(res ? String(res.status) : "slow");
  } catch {
    const hit = await c.match(key, { ignoreSearch: !page });
    return hit || net;
  }
}

/* ---------- keeping the game on the device ---------- */
self.addEventListener("message", (e) => {
  const m = e.data || {};
  if (m.t === "keep") e.waitUntil(keep());
  if (m.t === "kept?")
    e.waitUntil(state().then((st) => e.source && e.source.postMessage(st)));
});

let job = null;
const keep = () => job || (job = keepAll().finally(() => (job = null)));

async function meta(c) {
  const r = await c.match(META());
  return r ? r.json() : { files: {} };
}
async function state(extra = {}) {
  if (!(await caches.has(CACHE))) return { t: "kept", ready: false, ...extra };
  const c = await caches.open(CACHE),
    M = await meta(c);
  return {
    t: "kept",
    ready: !!M.done && !!(await c.match(PAGE())),
    ...extra,
  };
}
async function tell(m) {
  for (const w of await self.clients.matchAll({ includeUncontrolled: true }))
    w.postMessage(m);
}
/* a file from the site; a busy answer (5xx) is tried again after a second, twice at most (GitHub Pages answers 503 to
   many requests at once) */
async function get(url, how = {}, again = 2) {
  const res = await fetch(url, how);
  if (res.status >= 500 && again) {
    await new Promise((ok) => setTimeout(ok, 1000));
    return get(url, how, again - 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

async function keepAll() {
  const c = await caches.open(CACHE),
    M = await meta(c),
    page = await get(PAGE(), { cache: "no-cache" }),
    html = await page.clone().text(),
    list = await (
      await get(here("offline.json"), { cache: "no-cache" })
    ).json();
  /* the page's own files, with the versions it names */
  const named = new Set(),
    map = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  if (map)
    for (const u of Object.values(JSON.parse(map[1]).imports || {}))
      named.add(here(u));
  for (const m of html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+\?v=\w+)"/g))
    named.add(here(m[1]));
  const want = [];
  for (const u of named) if (!(await c.match(u))) want.push([u, {}]);
  for (const [p, sum] of Object.entries(list.files || {}))
    if (M.files[p] !== sum || !(await c.match(here(p))))
      want.push([here(p), { cache: "no-cache" }]);
  const total = want.length;
  let done = 0,
    i = 0;
  const lane = async () => {
    while (i < want.length) {
      const [u, how] = want[i++];
      await c.put(u, await get(u, how));
      if (++done % 10 === 0 || done === total)
        tell(await state({ done, total }));
    }
  };
  await Promise.all([lane(), lane(), lane(), lane(), lane(), lane()]);
  /* every file is in: the page goes over to this version, then what it no longer uses goes */
  await c.put(PAGE(), page);
  await c.put(
    META(),
    new Response(JSON.stringify({ v: list.v, files: list.files, done: 1 })),
  );
  const used = new Set([
    ...named,
    ...Object.keys(list.files || {}).map(here),
    PAGE(),
    META(),
  ]);
  for (const r of await c.keys()) if (!used.has(r.url)) await c.delete(r);
  tell(await state({ done: total, total }));
}
