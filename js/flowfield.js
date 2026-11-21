/* ---------- the zombies' flow field, worked out off the page's own thread (the owner's, Nov 18 14:20Z: "sure to move
   path for zombies thingy i think for off the main thread") ----------
   fieldOf is the walking distance from every cell of the grid to the nearest of `starts` (Dijkstra from all of them at
   once), as l4ddrules.js worked it out itself before. It stands alone (nothing from outside this file), so the same function
   runs in two places: on the page, when it has to have a field at once, and in a Web Worker made from its own text, so
   a big crowd's field never holds up a frame. I looked for a small library first: path-finding libraries (PathFinding.js,
   EasyStar.js) find one way from one spot to another, not a field from many ducks at once, and EasyStar's worker mode
   is gone; this is the textbook Dijkstra we already had, moved.
   grid: { walk (1 open, 0 not, per cell), hts (each cell's floor height), extra (each cell's added cost), gw, gh (cells
   across and down), climb (the most height a step between two cells may change) } */
/* the eight neighbors: across, down, and the diagonals, with each step's length */
const N8 = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];
/* the step for this grid: can a zombie step from cell c to its neighbor k? That cell, or -1 (no climbing more than
   climb; no cutting a corner past a wall). One for both the field here and the way a zombie heads (zombiepath.js) */
export function stepper(grid) {
  const { walk, hts, gw, gh, climb } = grid;
  return (c, k) => {
    const di = N8[k][0],
      dj = N8[k][1],
      i = (c % gw) + di,
      j = Math.floor(c / gw) + dj;
    if (i < 0 || j < 0 || i >= gw || j >= gh) return -1;
    const b = j * gw + i;
    if (!walk[b] || Math.abs(hts[b] - hts[c]) > climb) return -1;
    if (di && dj && (!walk[c + di] || !walk[c + dj * gw])) return -1;
    return b;
  };
}
export function fieldOf(grid, starts) {
  const { extra, gw, gh } = grid,
    n = gw * gh,
    dist = new Float64Array(n).fill(Infinity), // (64-bit: a 32-bit copy can be a hair under the heap's number, and its cell was never looked past)
    nextTo = stepper(grid);
  /* the heap: distances and cells side by side in typed arrays (every cell can be pushed once per neighbor) */
  const heapD = new Float64Array(n * 8 + 8),
    heapC = new Int32Array(n * 8 + 8);
  let size = 0;
  const push = (d, c) => {
    let k = size++;
    while (k) {
      const p = (k - 1) >> 1;
      if (heapD[p] <= d) break;
      heapD[k] = heapD[p];
      heapC[k] = heapC[p];
      k = p;
    }
    heapD[k] = d;
    heapC[k] = c;
  };
  const popTo = () => {
    // takes the smallest off the top; the caller has read heapD[0] and heapC[0] first
    const d = heapD[--size],
      c = heapC[size];
    let k = 0;
    for (;;) {
      const l = 2 * k + 1,
        r = l + 1;
      let m = -1,
        md = d;
      if (l < size && heapD[l] < md) {
        m = l;
        md = heapD[l];
      }
      if (r < size && heapD[r] < md) m = r;
      if (m < 0) break;
      heapD[k] = heapD[m];
      heapC[k] = heapC[m];
      k = m;
    }
    heapD[k] = d;
    heapC[k] = c;
  };
  for (const c of starts) {
    dist[c] = 0;
    push(0, c);
  }
  while (size) {
    const d = heapD[0],
      c = heapC[0];
    popTo();
    if (d > dist[c]) continue;
    for (let k = 0; k < 8; k++) {
      const b = nextTo(c, k);
      if (b < 0) continue;
      const nd = d + N8[k][2] + extra[b];
      if (nd < dist[b]) {
        dist[b] = nd;
        push(nd, b);
      }
    }
  }
  return dist;
}

/* ---------- the worker ----------
   Made once from fieldOf's own text (a blob: no file of its own, so it can never be an older copy than the page's).
   The page sends it the grid once each time the map's grid is made again (rev), then asks for fields by their key; it
   answers each with its field, handed over (transferred, not copied). No Worker (an old browser, the rules run without a
   page): null, and the page works its fields out itself, as before */
let worker = null,
  tried = false,
  sentRev = -1;
const waiting = new Set(); // (keys asked and not answered yet)
function theWorker(onField) {
  if (tried) return worker;
  tried = true;
  try {
    if (typeof Worker === "undefined" || typeof Blob === "undefined")
      return null;
    const src = `const N8 = ${JSON.stringify(N8)};
const stepper = ${stepper.toString()};
const fieldOf = ${fieldOf.toString()};
let grid = null, rev = -1;
onmessage = (e) => {
  const m = e.data;
  if (m.grid) { grid = m.grid; rev = m.rev; return; }
  if (!grid || m.rev !== rev) { postMessage({ key: m.key, rev: m.rev, dist: null }); return; }
  const dist = fieldOf(grid, m.starts);
  postMessage({ key: m.key, rev: m.rev, dist }, [dist.buffer]);
};`;
    worker = new Worker(
      URL.createObjectURL(new Blob([src], { type: "text/javascript" })),
    );
    worker.onmessage = (e) => {
      const { key, rev, dist } = e.data;
      waiting.delete(key);
      if (dist) onField(key, rev, dist);
    };
    worker.onerror = () => {
      worker = null; // (it broke: the page works its fields out itself from now on)
      waiting.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}
/* asks the worker for the field from `starts` (its key: the cells, sorted), on the grid made for rev. Returns false
   when there's no worker (then the caller works it out itself); true once asked, or already asked. onField(key, rev,
   dist) gets the answer */
export function askField(key, starts, grid, rev, onField) {
  const w = theWorker(onField);
  if (!w) return false;
  if (sentRev !== rev) {
    sentRev = rev;
    waiting.clear();
    w.postMessage({
      grid: {
        walk: grid.walk.slice(),
        hts: grid.hts.slice(),
        extra: grid.extra.slice(),
        gw: grid.gw,
        gh: grid.gh,
        climb: grid.climb,
      },
      rev,
    }); // (copies: the page keeps its own)
  }
  if (!waiting.has(key)) {
    waiting.add(key);
    w.postMessage({ key, starts, rev });
  }
  return true;
}
