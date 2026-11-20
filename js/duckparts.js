/* ---------- the ducks made from pixel parts (the owner's, Nov 19 23:26Z: "It's literally pixels ... imagine we're making a
   game on a 32-bit only graphics system") ----------
   Every layer of a duck (duck.js LAYERS: its shadow, its body, its clothes, its wing, its outline, its beak, its eyes,
   its face item, its hat) is made into pixels once, ahead of time, at each of a few sizes (tools/duck-parts.cjs), and
   shipped as part sheets (assets/px/ducks). A duck is put together here from them, a pixel at a time, as 16-bit era
   games did:
   - a part that takes the player's colors (the body, the beak, a hat's color …) is kept as shade numbers: its pixels
     with every color black, and for each color how much of it each pixel takes. Here they're mixed with the player's
     colors (a palette swap), then the whole duck goes through the game's palette as before;
   - the duck's own Size picks the sheet nearest to the size it shows at, so its pixels stay the size of everyone
     else's;
   - what's knocked off it (a hat, a face item, its eyes or beak) is left out, a hat coming back on is half see-through,
     and a hole through it is cut out of the pixels.
   Nothing is drawn on the device. A duck the sheets can't make (a new drawing, Jack in a Box, Dat Boi, a picture, the
   rainbow skin, a zombie's skin: duck.js partsOK) is still made whole, as before. */
import { duckSVG, LAYERS, DUCK_DEFAULT, BUILDS } from "./duck.js";
import { styleById, styleColor } from "./styles.js";
import { hatById } from "./hats.js";
import { faceById } from "./faces.js";
import { outfitById } from "./outfits.js";
import { applyPalette } from "./pixelpalette.js";
import { hashText, steadyText } from "./pxdom.js";

/* the sizes the sheets are made at: a duck's box (120 duck units) in pixels */
export const SIZES = [12, 14, 16, 19, 22, 26, 29, 32, 36, 41, 46, 52, 58, 64]; // (bigger: a menu's big duck, made whole)
export const FRAME = 152; // (duck units: the box and a hat's room over it, HAT_TOP)
const TOP = FRAME - 120;
export const BLACK = "#000000";

/* ---------- the colors a duck's parts take: [path, its color now] ----------
   path: a field of the look ("color"), or of its hat, face item or outfit ("hat.c1") */
export function duckVars(look) {
  const L = { ...DUCK_DEFAULT, ...look },
    st = styleById(L.style),
    out = [];
  if (st.fixed) out.push(["tint", L.tint || st.body]);
  else {
    out.push(["color", styleColor(L, st, "color")]);
    for (const [k] of st.colors || [])
      if (k !== "color") out.push([k, styleColor(L, st, k)]);
  }
  out.push(["patternColor", L.patternColor || "#ffffff"]);
  out.push(["beakColor", L.beakColor], ["beakColor2", L.beakColor2]);
  const own = (part, def, o) => {
    for (const [k, , d] of (def && def.colors) || [])
      out.push([part + "." + k, (o && o[k]) || d]);
  };
  if (L.hat) own("hat", hatById(L.hat.id), L.hat);
  if (L.face) own("face", faceById(L.face.id), L.face);
  if (L.outfit) own("outfit", outfitById(L.outfit.id), L.outfit);
  return out.filter(([, v]) => /^#[0-9a-f]{6}$/i.test(v || ""));
}
/* the look with one of its colors set (path as duckVars) */
export function withColor(L, path, v) {
  const [a, b] = path.split(".");
  if (!b) return { ...L, [a]: v };
  return { ...L, [a]: { ...(L[a] || {}), [b]: v } };
}
/* the look with every color black: each part's pixels are made from it */
export const blackLook = (L) =>
  duckVars(L).reduce((o, [p]) => withColor(o, p, BLACK), {
    ...DUCK_DEFAULT,
    ...L,
  });
/* … and with each color its own made-up one, from its name: a part's name in the sheets is drawn from this, so it says
   which color goes where (black, a rubber duck's head and an eagle's look the same, but the eagle's takes its second
   color) */
const codeOf = (path) =>
  "#" +
  ((parseInt(hashText(path), 36) % 0xfffff0) + 8).toString(16).padStart(6, "0");
export const codedLook = (L) =>
  duckVars(L).reduce((o, [p]) => withColor(o, p, codeOf(p)), {
    ...DUCK_DEFAULT,
    ...L,
  });

/* a layer's name in the sheets: its drawing from codedLook (its ids renamed in order), hashed */
export function partKey(layer, svg) {
  return layer + ":" + hashText(steadyText(svg));
}

/* ---------- the sheets, one per size: an index, and its files (one per outfit, one per face item, the rest), each
   fetched the first time a duck needs it ---------- */
const sheets = new Map(); // size -> Promise<{ index: { f: [file], p: { key: entry } }, files: Map<c, Promise<{ px, W }>>, dir }>
let made = null; // (ducksheets.js: what the files are called)
function sheet(n) {
  if (!sheets.has(n))
    sheets.set(
      n,
      (made ||= import("./ducksheets.js"))
        .then(async ({ SHEETS }) => {
          const s = SHEETS[n];
          if (!s) return null;
          return {
            index: await fetch(s.index).then((r) => r.json()),
            dir: s.index.slice(0, s.index.lastIndexOf("/") + 1),
            files: new Map(),
          };
        })
        .catch(() => null),
    );
  return sheets.get(n);
}
/* one of its files, as pixels */
function file(S, c) {
  if (!S.files.has(c))
    S.files.set(
      c,
      (async () => {
        const img = new Image();
        img.src = S.dir + S.index.f[c];
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.naturalWidth;
        cv.height = img.naturalHeight;
        const g = cv.getContext("2d", { willReadFrequently: true });
        g.drawImage(img, 0, 0);
        return {
          px: g.getImageData(0, 0, cv.width, cv.height).data,
          W: cv.width,
        };
      })().catch(() => {
        S.files.delete(c); // (asked again next time)
        return null;
      }),
    );
  return S.files.get(c);
}
const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};

/* ---------- a duck from its parts ----------
   d: what duck.js wrote on the drawing (data-dk: { L, dead, shadow, gone, sk (its skin's marks) }); cw × ch: the pixels
   it's wanted at (its box and, when it wears a hat, the hat's room). A canvas in the game's colors, or null when the
   sheets can't make it */
/* its build, as the sheets have them (the five of Customize): a zombie's is anywhere between, and a pixel or so of width
   is all that tells them apart */
const nearBuild = (b) =>
  BUILDS.reduce(
    (m, [v]) => (Math.abs(v - (+b || 0)) < Math.abs(m - (+b || 0)) ? v : m),
    0,
  );
const SKIN = { skinBody: "body", skinHead: "head", skinOut: "out" };
const RIPPED = new Set(["cloth", "sleeve", "ofOver"]); // (what a rip tears: duck.js ripped())
export async function duckFromParts(d, cw, ch) {
  const L = { ...DUCK_DEFAULT, ...d.L, build: nearBuild(d.L.build) },
    k = 1 + 0.1 * Math.max(-1, Math.min(1, +L.size || 0)), // (its Size within its box: duck.js)
    want = cw * k;
  if (want > SIZES[SIZES.length - 1] * 1.08) return null; // (a big duck in a menu: made whole, as before)
  let n = SIZES[0];
  for (const s of SIZES) if (Math.abs(s - want) < Math.abs(n - want)) n = s;
  const S = await sheet(n);
  if (!S) return null;
  const C = codedLook(L),
    vars = Object.fromEntries(duckVars(L).map(([p, v]) => [p, hex(v)])),
    flat = styleById(L.style).flat, // (a flat duck shows no holes, tears or headshot: duck.js)
    gone = flat
      ? (({ hat, face, eyes, beak }) => ({ hat, face, eyes, beak }))(
          d.gone || {},
        )
      : d.gone || {},
    sk = d.sk || {},
    H = Math.round((n * FRAME) / 120),
    acc = new Float32Array(n * H * 4), // (premultiplied, 0 … 1)
    /* holes through it: cut out of every layer but its shadow and what sticks out of it (as duck.js' mask); its clothes
       torn round a hit: cut out of them too, a dark frayed edge round each tear on the cloth */
    s = n / 120,
    circles = (list, grow = 0) => {
      const m = new Uint8Array(n * H);
      for (const [x, y, r] of list || []) {
        const cx = x * s,
          cy = (y + TOP) * s,
          rr = (r + grow) * s;
        for (
          let j = Math.max(0, Math.floor(cy - rr));
          j < Math.min(H, Math.ceil(cy + rr));
          j++
        )
          for (
            let i = Math.max(0, Math.floor(cx - rr));
            i < Math.min(n, Math.ceil(cx + rr));
            i++
          )
            if ((i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= rr * rr)
              m[j * n + i] = 1;
      }
      return m;
    },
    holes = gone.holes && gone.holes.length ? circles(gone.holes) : null,
    rips =
      L.outfit && gone.rips && gone.rips.length ? circles(gone.rips) : null,
    torn = rips && holes ? rips.map((v, i) => v | holes[i]) : rips || holes,
    clothA = rips ? new Float32Array(n * H) : null,
    /* headless: its marks are the ones made with a head, cut to its body (where its fill is) */
    bodyA = gone.head ? new Float32Array(n * H) : null;
  /* every part it needs, back to front (none missing), then their files, then each over what's there */
  const plan = [];
  for (const layer of LAYERS) {
    if (gone.eyes && (layer === "eyes" || layer === "eyesZap")) continue;
    if (gone.beak && layer === "beak") continue;
    const fade =
      layer === "hatBack" || layer === "hatFront"
        ? gone.hat
        : layer === "face"
          ? gone.face
          : undefined;
    if (fade === 0) continue;
    const o = {
      layer,
      size: 0, // (no jersey names: duck.js marks)
      dead: !!d.dead,
      shadow: d.shadow !== false,
      ...(gone.head && !SKIN[layer] ? { gone: { head: true } } : {}), // (headless: a zombie's headshot. Its parts are their own)
    };
    /* its skin: a part for each mark */
    const marks = SKIN[layer]
      ? (sk[SKIN[layer]] || []).map((m) => ({
          ...o,
          skin: { [SKIN[layer]]: [m] },
        }))
      : [o];
    for (const m of marks) {
      const svg = duckSVG(C, m);
      if (!svg) continue;
      const e = S.index.p[partKey(layer, svg)];
      if (!e) return null; // (a part the sheets don't have: the whole duck is made as before)
      plan.push([layer, e, fade === undefined ? 1 : fade]);
    }
  }
  const got = new Map();
  for (const c of new Set(plan.map(([, e]) => e[7]))) {
    const f = await file(S, c);
    if (!f) return null;
    got.set(c, f);
  }
  let bare = null; // (bodyA as a cut: where there's no body, or a hole)
  plan.forEach(([layer, e, fade], i) => {
    if (bodyA && !bare && SKIN[layer] && layer !== "skinOut")
      bare = bodyA.map((a, q) => (a < 0.01 || (holes && holes[q]) ? 1 : 0));
    const cut =
      layer === "shadow" || layer === "skinOut"
        ? null
        : RIPPED.has(layer)
          ? torn
          : SKIN[layer] && bare
            ? bare
            : holes;
    blit(
      acc,
      n,
      H,
      got.get(e[7]),
      e,
      vars,
      fade,
      cut,
      layer === "cloth" ? clothA : layer === "fill" ? bodyA : null,
    );
    /* the frays, once its cloth is all there */
    if (layer === "cloth" && clothA && (plan[i + 1] || [])[0] !== "cloth")
      frays(acc, n, H, gone.rips, clothA, holes);
  });
  /* into the box it's wanted in: the hat's room only when it has a hat; its Size from its feet (60, 108) */
  const top = ch > cw * 1.1 ? TOP : 0,
    ow = cw,
    oh = ch,
    dx = Math.round(60 * (ow / 120) - 60 * (n / 120)),
    dy = Math.round((108 + top) * (oh / (120 + top)) - (108 + TOP) * (n / 120)),
    img = new ImageData(ow, oh),
    o = img.data;
  for (let j = 0; j < H; j++) {
    const y = j + dy;
    if (y < 0 || y >= oh) continue;
    for (let i = 0; i < n; i++) {
      const x = i + dx;
      if (x < 0 || x >= ow) continue;
      const a = (j * n + i) * 4,
        al = acc[a + 3];
      if (al <= 0) continue;
      const b = (y * ow + x) * 4;
      o[b] = (acc[a] / al) * 255;
      o[b + 1] = (acc[a + 1] / al) * 255;
      o[b + 2] = (acc[a + 2] / al) * 255;
      o[b + 3] = al * 255;
    }
  }
  const c = document.createElement("canvas");
  c.width = ow;
  c.height = oh;
  c.getContext("2d").putImageData(applyPalette(img), 0, 0);
  return c;
}

/* one part over what's there: its pixels with every color black, plus each color times how much of it each pixel takes
   (e: [x, y, w, h, ox, oy, [color paths]]; the shade numbers lie to the right of the part, three colors to a tile) */
function blit(acc, n, H, S, e, vars, fade, cut, keepA) {
  const [x0, y0, w, h, ox, oy, paths] = e,
    px = S.px,
    W = S.W,
    cs = paths.map((p) => vars[p] || [0, 0, 0]);
  for (let j = 0; j < h; j++) {
    const y = oy + j;
    if (y < 0 || y >= H) continue;
    for (let i = 0; i < w; i++) {
      const x = ox + i;
      if (x < 0 || x >= n) continue;
      if (cut && cut[y * n + x]) {
        if (keepA)
          keepA[y * n + x] = Math.max(
            keepA[y * n + x],
            px[((y0 + j) * W + x0 + i) * 4 + 3] / 255,
          );
        continue;
      }
      const s = ((y0 + j) * W + x0 + i) * 4,
        a = (px[s + 3] / 255) * fade;
      if (!a) continue;
      if (keepA) keepA[y * n + x] = Math.max(keepA[y * n + x], a);
      let r = (px[s] / 255) * a,
        g = (px[s + 1] / 255) * a,
        b = (px[s + 2] / 255) * a;
      for (let v = 0; v < cs.length; v++) {
        const t =
            ((y0 + j) * W + x0 + (1 + ((v / 3) | 0)) * (w + 1) + i) * 4 +
            (v % 3),
          q = (px[t] / 255) * fade;
        r += q * (cs[v][0] / 255);
        g += q * (cs[v][1] / 255);
        b += q * (cs[v][2] / 255);
      }
      const d = (y * n + x) * 4,
        k = 1 - a;
      acc[d] = r + acc[d] * k;
      acc[d + 1] = g + acc[d + 1] * k;
      acc[d + 2] = b + acc[d + 2] * k;
      acc[d + 3] = a + acc[d + 3] * k;
    }
  }
}

/* the dark frayed edge round each tear in its cloth (duck.js frays: a dashed ring, #1c1c28 at .7, 2.6 wide, on the cloth
   only): where the cloth was, round each rip, not over a hole through it */
function frays(acc, n, H, rips, clothA, holes) {
  const s = n / 120;
  for (const [x, y, r] of rips) {
    const cx = x * s,
      cy = (y + TOP) * s,
      R = (r + 0.6) * s,
      half = 1.3 * s + 0.35, // (half its width, and never thinner than a pixel)
      dashes = 3.6 * s >= 2; // (the dashes once they're bigger than a pixel; smaller, the ring at their average)
    for (
      let j = Math.max(0, Math.floor(cy - R - half));
      j < Math.min(H, Math.ceil(cy + R + half));
      j++
    )
      for (
        let i = Math.max(0, Math.floor(cx - R - half));
        i < Math.min(n, Math.ceil(cx + R + half));
        i++
      ) {
        const q = j * n + i,
          dx = i + 0.5 - cx,
          dy = j + 0.5 - cy,
          dist = Math.hypot(dx, dy);
        if (Math.abs(dist - R) > half || !clothA[q] || (holes && holes[q]))
          continue;
        let a = 0.7 * clothA[q];
        if (dashes) {
          const arc =
            (((Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI)) * (r + 0.6)) %
            3.6;
          if (arc > 2.2) continue;
        } else a *= 2.2 / 3.6;
        const d = q * 4,
          k = 1 - a;
        acc[d] = (0x1c / 255) * a + acc[d] * k;
        acc[d + 1] = (0x1c / 255) * a + acc[d + 1] * k;
        acc[d + 2] = (0x28 / 255) * a + acc[d + 2] * k;
        acc[d + 3] = a + acc[d + 3] * k;
      }
  }
}
