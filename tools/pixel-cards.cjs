/* ---------- the player cards' patterns as pixel files (the owner's C1: every picture saved and drawn as pixels) ----------
   Each pattern's motif (js/card.js motif: polka dots, stripes … the sport balls, the faces) is made into pixels here,
   once, at every size a card shows it at (4 to 24 pixels across, and 28, 32, 40, 48 for the big ones), in two layers:
   - fixed: what keeps its own colors (a ball, a face, confetti's red, blue and green), through the game's colors;
   - tint: what takes the player's pattern color (the dots, the stripes …), white, for the game to color, each pixel
     as see-through as it is uncovered.
   A hat whose color the player picks is two layers too: the hat with that color black (base.webp), and a grey layer in
   tint.webp saying how much of the color each pixel takes (mix in js/pxcard.js), so its shades follow the color as the
   drawing's did. tint and base hold numbers, not colors (tools/pixel-budget.py only weighs them).
   Both go in one sheet each (a row for each size, a motif after another along it, each with a quarter of its size
   round it): assets/px/cards/fixed.webp and
   tint.webp, and where each one is in js/pxcard.js. The game lays a card's pattern out from them (js/card.js).
     node tools/pixel-cards.cjs
   then python3 tools/stamp.py as for any other change. Needs Playwright's Chromium and Python's Pillow. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, ".."),
  OUT = path.join(ROOT, "assets", "px", "cards");
const SIZES = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  28, 32, 40, 48,
];
/* the patterns whose motif is all the player's color but for some pieces of their own (confetti) */
const TINT = [
  "dots",
  "stripes",
  "zigzag",
  "checks",
  "confetti",
  "bubbles",
  "stars",
];

function serve() {
  const types = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname),
      f = path.join(ROOT, u);
    if (
      !f.startsWith(ROOT) ||
      !fs.existsSync(f) ||
      fs.statSync(f).isDirectory()
    ) {
      res.writeHead(u === "/" ? 200 : 404, { "content-type": "text/html" });
      return res.end(
        u === "/"
          ? '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'
          : "",
      );
    }
    res.writeHead(200, {
      "content-type": types[path.extname(f)] || "application/octet-stream",
    });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

(async () => {
  const srv = await serve(),
    b = await chromium.launch(),
    page = await b.newPage();
  page.on("pageerror", (e) => console.log("page error:", e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/`);
  const out = await page.evaluate(
    async ([SIZES, TINT]) => {
      await import("/js/rules.js"); // (first: the modules' circle starts there)
      const { motif, CARD_PATTERNS } = await import("/js/card.js");
      const { applyPalette } = await import("/js/pixelpalette.js");
      const { hatTile, hatById } = await import("/js/hats.js");
      const kinds = CARD_PATTERNS.map(([k]) => k).filter((k) => k !== "none"),
        hat = (k) => k.startsWith("hat:"),
        recolors = (k) =>
          hat(k) &&
          (hatById(k.slice(4)).colors || []).some(([c]) => c === "c1");
      /* a motif's two layers as svg: what keeps its colors, and what takes the player's (white) */
      const layers = (k) => {
        /* a hat whose color the player picks: drawn with that color black and with it white; how far apart the two are
           is how much of the color each pixel takes (its shades too) */
        if (recolors(k))
          return [
            hatTile(k.slice(4), "#000000"),
            hatTile(k.slice(4), "#ffffff"),
          ];
        if (!TINT.includes(k)) return [motif(k, "#ffffff"), ""];
        const fixed = motif(k, "none"),
          tint = motif(k, "#ffffff").replace(
            /(fill|stroke)="#(?!ffffff)[0-9a-f]{3,8}"/gi,
            '$1="none"',
          );
        return [fixed, tint];
      };
      /* drawn with a quarter of its box round it (what a motif draws past its box: the stripes; the layouts that turn
         their motifs show it, the others cut it off) */
      const pad = (s) => Math.round(s / 4),
        P = (s) => s + 2 * pad(s);
      /* drawn as a vector right at the size it's made at, so each pixel is what it covers (never a big picture made small) */
      const pic = async (inner, n) => {
        const im = new Image();
        im.src =
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="-8 -8 48 48">${inner}</svg>`,
          );
        await im.decode();
        return im;
      };
      const W = P(Math.max(...SIZES)) * kinds.length,
        H = SIZES.reduce((a, s) => a + P(s), 0),
        sheets = [0, 1, 2].map(() => {
          const c = document.createElement("canvas");
          c.width = W;
          c.height = H;
          return c;
        }),
        rows = {},
        has = [[], []];
      let y = 0;
      for (const s of SIZES) {
        rows[s] = y;
        y += P(s);
      }
      for (const [i, k] of kinds.entries()) {
        const two = layers(k);
        for (const L of [0, 1]) {
          if (!two[L]) continue;
          let any = false;
          for (const s of SIZES) {
            const c = document.createElement("canvas");
            const n = P(s),
              im = await pic(two[L], n);
            c.width = c.height = n;
            const x = c.getContext("2d", { willReadFrequently: true });
            x.drawImage(im, 0, 0, n, n);
            const d = x.getImageData(0, 0, n, n);
            if (recolors(k)) {
              if (L === 1) {
                /* the mix layer: grey, each pixel how much of the hat's color it takes (white: all of it) */
                x.clearRect(0, 0, n, n);
                x.drawImage(await pic(two[0], n), 0, 0, n, n);
                const b = x.getImageData(0, 0, n, n).data;
                for (let p = 0; p < d.data.length; p += 4) {
                  const v = b[p + 3]
                    ? Math.round(
                        Math.max(
                          0,
                          Math.min(
                            255,
                            (d.data[p] -
                              b[p] +
                              d.data[p + 1] -
                              b[p + 1] +
                              d.data[p + 2] -
                              b[p + 2]) /
                              3,
                          ),
                        ),
                      )
                    : 0;
                  d.data[p] = d.data[p + 1] = d.data[p + 2] = v;
                  d.data[p + 3] = b[p + 3] ? 255 : 0;
                  if (v) any = true;
                }
                sheets[L].getContext("2d").putImageData(d, i * n, rows[s]);
                continue;
              } // (its other layer: the hat with that color black, as it is; the game adds the color and makes it the game's colors)
            } else if (L === 0) applyPalette(d);
            else
              for (let p = 0; p < d.data.length; p += 4) {
                d.data[p] = d.data[p + 1] = d.data[p + 2] = 255; // (how much of each pixel it covers stays: the game mixes it with the card's color and puts that in the game's colors, js/card.js)
              }
            for (let p = 3; p < d.data.length; p += 4)
              if (d.data[p]) any = true;
            sheets[recolors(k) && L === 0 ? 2 : L] // (a hat's own layer, its color black, holds numbers to add the color to: in a sheet of its own, base)
              .getContext("2d")
              .putImageData(d, i * n, rows[s]);
          }
          has[L][i] = any;
        }
      }
      return {
        kinds,
        rows,
        fixed: kinds.map((k, i) => !recolors(k) && !!has[0][i]),
        tint: kinds.map((_, i) => !!has[1][i]),
        mix: kinds.filter(recolors),
        files: sheets.map((c) => c.toDataURL("image/png")),
        W,
        H,
      };
    },
    [SIZES, TINT],
  );
  fs.mkdirSync(OUT, { recursive: true });
  ["fixed", "tint", "base"].forEach((n, L) => {
    const tmp = path.join(OUT, n + ".png"),
      dst = path.join(OUT, n + ".webp");
    fs.writeFileSync(tmp, Buffer.from(out.files[L].split(",")[1], "base64"));
    execFileSync("python3", [
      "-c",
      "import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).save(sys.argv[2], 'WEBP', lossless=True, method=6)",
      tmp,
      dst,
    ]); // (lossless: the pixels stay exactly as made)
    fs.unlinkSync(tmp);
    console.log(n, Math.round(fs.statSync(dst).size / 1024), "KB");
  });
  const js = path.join(ROOT, "js", "pxcard.js");
  fs.writeFileSync(
    js,
    `/* the player cards' pattern motifs as pixel files: written by tools/pixel-cards.cjs, never by hand. kinds: the
   patterns, in the sheets' order; rows: where each size's row starts; fixed / tint: which have that layer */
export default ${JSON.stringify({
      fixed: "assets/px/cards/fixed.webp",
      tint: "assets/px/cards/tint.webp",
      base: "assets/px/cards/base.webp",
      sizes: SIZES,
      rows: out.rows,
      kinds: out.kinds,
      hasFixed: out.fixed,
      hasTint: out.tint,
      mix: out.mix,
    })};\n`,
  );
  execFileSync("npx", ["-y", "prettier@3.6.2", "--write", js]);
  await b.close();
  srv.close();
})();
