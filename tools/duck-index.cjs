/* ---------- the ducks' part indexes, small (slimming step 4: the owner's, Nov 20 19:11Z, "how people did 32 bits right
   in the olden days") ----------
   Every size has the same parts (their names come from their drawings, not their size), so their names are kept once,
   in a keys file the sizes share, each one cut short (K characters of its hash: as few as still tell every part of its
   layer apart), and each size's index is only numbers, in the keys' order:
     assets/px/ducks/keys-<hash>.json         { K, k: { layer: "hash hash …" } }  (layers and hashes in sorted order)
     assets/px/ducks/<size>/index-<hash>.json { k: its keys file, f: [file], c: [[color path]], s: { layer: stride },
                                                e: [x, y, w, h, ox, oy, colors (c's index, -1: nothing at this size),
                                                    file, (a cat's two more), …] }
   duckparts.js puts it back together. Used by tools/duck-parts.cjs as it writes the sheets; run on its own
   (node tools/duck-index.cjs) it packs the indexes already there again, then js/ducksheets.js and stamp.py */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, ".."),
  OUT = path.join(ROOT, "assets", "px", "ducks");
const named = (name, buf, ext) =>
  `${name}-${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8)}.${ext}`;

/* p: { "layer:hash": entry or 0 } → the keys file's text and the index's text (its k left to fill in) */
function pack(names, p) {
  const keys = Object.keys(p).sort(),
    split = keys.map((k) => {
      const i = k.indexOf(":");
      return [k.slice(0, i), k.slice(i + 1)];
    });
  /* as short as they can be and still each its own in its layer */
  let K = 5;
  for (;;) {
    const seen = new Set();
    if (
      split.every(
        ([l, h]) => !seen.has(l + h.slice(0, K)) && seen.add(l + h.slice(0, K)),
      )
    )
      break;
    K++;
  }
  const k = {},
    stride = {};
  for (const [l, h] of split) {
    (k[l] ||= []).push(h.slice(0, K));
    const v = p[l + ":" + h];
    if (v) stride[l] = Math.max(stride[l] || 8, v.length);
  }
  const colors = [],
    at = new Map(),
    e = [];
  split.forEach(([l], i) => {
    const v = p[keys[i]],
      st = stride[l] || 8;
    if (!v) {
      e.push(0, 0, 0, 0, 0, 0, -1, ...Array(st - 7).fill(0));
      return;
    }
    const ck = JSON.stringify(v[6]);
    if (!at.has(ck)) {
      at.set(ck, colors.length);
      colors.push(v[6]);
    }
    e.push(...v.slice(0, 6), at.get(ck), ...v.slice(7));
    for (let j = v.length; j < st; j++) e.push(0);
  });
  const s = Object.fromEntries(
    Object.entries(stride).filter(([, v]) => v !== 8),
  );
  return {
    keys: JSON.stringify({
      K,
      k: Object.fromEntries(
        Object.entries(k).map(([l, hs]) => [l, hs.join(" ")]),
      ),
    }),
    index: (kf) => JSON.stringify({ k: kf, f: names, c: colors, s, e }),
  };
}

/* the old form back from the new (to pack again) */
function unpack(ix, keysText) {
  if (ix.p) return ix.p;
  const ks = JSON.parse(keysText),
    p = {};
  let at = 0;
  for (const [l, hs] of Object.entries(ks.k)) {
    const st = (ix.s && ix.s[l]) || 8;
    for (const h of hs.split(" ")) {
      const e = ix.e.slice(at, at + st);
      at += st;
      p[l + ":" + h] =
        e[6] < 0 ? 0 : [...e.slice(0, 6), ix.c[e[6]], ...e.slice(7)];
    }
  }
  return p;
}

/* writes a size's index (and the keys file, if it's new) into dir; its index file's name */
function writeIndex(dir, names, p) {
  const r = pack(names, p),
    kf = named("keys", Buffer.from(r.keys), "json");
  fs.writeFileSync(path.join(OUT, kf), r.keys);
  const json = r.index(kf),
    idx = named("index", Buffer.from(json), "json");
  fs.writeFileSync(path.join(dir, idx), json);
  return [idx, json.length];
}
/* keys files no size uses any more */
function sweepKeys() {
  const used = new Set();
  for (const d of fs.readdirSync(OUT)) {
    const dir = path.join(OUT, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir))
      if (f.startsWith("index-")) {
        const ix = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        if (ix.k) used.add(ix.k);
      }
  }
  for (const f of fs.readdirSync(OUT))
    if (f.startsWith("keys-") && !used.has(f)) fs.rmSync(path.join(OUT, f));
}

module.exports = { pack, unpack, writeIndex, sweepKeys, named };

/* on its own: the indexes there now, packed again */
if (require.main === module) {
  const sheets = {};
  for (const d of fs.readdirSync(OUT).sort((a, b) => a - b)) {
    const dir = path.join(OUT, d);
    if (!/^\d+$/.test(d) || !fs.statSync(dir).isDirectory()) continue;
    const old = fs.readdirSync(dir).find((f) => f.startsWith("index-")),
      ix = JSON.parse(fs.readFileSync(path.join(dir, old), "utf8")),
      p = unpack(
        ix,
        ix.k ? fs.readFileSync(path.join(OUT, ix.k), "utf8") : null,
      ),
      before = fs.statSync(path.join(dir, old)).size;
    fs.rmSync(path.join(dir, old));
    const [idx, bytes] = writeIndex(dir, ix.f, p);
    sheets[d] = { index: `assets/px/ducks/${d}/${idx}` };
    console.log(
      d,
      Object.keys(p).length,
      "parts,",
      before,
      "→",
      bytes,
      "bytes",
    );
  }
  sweepKeys();
  fs.writeFileSync(
    path.join(ROOT, "js", "ducksheets.js"),
    `/* made by tools/duck-parts.cjs: don't change it by hand (duckparts.js) */\nexport const SHEETS = ${JSON.stringify(sheets)};\n`,
  );
}
