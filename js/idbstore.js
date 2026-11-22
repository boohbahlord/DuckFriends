/* One place that opens a small IndexedDB with one object store (keyPath "id") and turns its requests into promises. I
   wanted this once, not a copy in every file that keeps a list on the device (the owner's, Nov 22: the same twenty
   lines were in gmodes.js and umaps.js, a third is Sandbox's saves). A reason it is a module of its own: it is the one
   place that knows IndexedDB's open/upgrade/blocked dance (Fowler: Extract Function across files). */
/* the db() that opens (once, and again after a failure) database `name` with its store `store`; req(r) and done(t) wait
   for a request or a transaction */
export function idbStore(name, store) {
  let dbP = null;
  const db = () => {
    if (!dbP)
      dbP = new Promise((ok, no) => {
        const q = indexedDB.open(name, 1);
        q.onupgradeneeded = () => {
          if (!q.result.objectStoreNames.contains(store))
            q.result.createObjectStore(store, { keyPath: "id" });
        };
        q.onsuccess = () => ok(q.result);
        q.onerror = () => no(q.error);
        q.onblocked = () => no(new Error("blocked"));
      }).catch((e) => {
        dbP = null;
        throw e;
      });
    return dbP;
  };
  return { db };
}
export const req = (r) =>
  new Promise((ok, no) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
export const done = (t) =>
  new Promise((ok, no) => {
    t.oncomplete = () => ok();
    t.onerror = () => no(t.error);
    t.onabort = () => no(t.error || new Error("aborted"));
  });
