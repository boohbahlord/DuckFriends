/* ---------- a map's pixel files on sheets (slimming step 3: the owner's, Nov 20 19:11Z, "how people did 32 bits right
   in the olden days") ----------
   A map of hundreds of small pixel files (Night Show's breathing rows, Carnival Night's bulbs) cost a request each and
   a file's own overhead each. Like an old console's sprite sheet, its files go on a sheet or two
   (tools/pixel-sheet.py) and each picture shows its piece of it: the same element, classes and style, its picture as
   its background (a piece of the sheet, at the map's grid, G css px to a pixel). The floor's rows (art.js
   floorPixels) find their piece by data-sp. Used by tools/pixel-maps.cjs as it writes each map; run on its own
   (node tools/pixel-sheets.cjs board carnival …) it puts the files a map shows now on sheets, then stamp.py */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const attr = (a, k) => (a.match(new RegExp(`\\b${k}="([^"]*)"`)) || [])[1];

/* where a picture stands, in its style: { top, left, width, height } (css px), or null when its box sets it */
const px = (s, k) => {
  const m = s.match(new RegExp(`(?:^|;)\\s*${k}:\\s*(-?[\\d.]+)px`));
  return m ? +m[1] : null;
};
function placeOf(style) {
  const s = style || "",
    inset = s.match(/inset:\s*(-?[\d.]+)px auto auto (-?[\d.]+)px/),
    top = inset ? +inset[1] : px(s, "top"),
    left = inset ? +inset[2] : px(s, "left"),
    width = px(s, "width"),
    height = px(s, "height");
  return [top, left, width, height].includes(null)
    ? null
    : { top, left, width, height, inset: !!inset };
}

/* the map's markup (its pixel files as <img class="… px-file" …>) → the same with its files on sheets; the files no
   longer shown are deleted. G: css px to a pixel */
function sheetMarkup(id, html, G) {
  const dir = path.join("assets", "px", "mapw", id),
    tags = [...html.matchAll(/<img ([^>]*)>/g)].map((m) => ({
      all: m[0],
      a: m[1],
      src: attr(m[1], "src"),
      file: path.join(ROOT, attr(m[1], "src") || ""),
      place: placeOf(attr(m[1], "style")),
    })),
    mine = tags.filter(
      (t) =>
        t.src &&
        t.src.startsWith(dir + "/") &&
        /\bpx-file\b/.test(attr(t.a, "class") || ""),
    );
  if (mine.length < 2) return html;
  /* a file is cut to what it shows only if every picture showing it says where it stands (not a strip of frames in
     its box, .pxs) */
  const whole = new Set(mine.filter((t) => !t.place).map((t) => t.file));
  const at = JSON.parse(
    execFileSync(
      "python3",
      [
        path.join(__dirname, "pixel-sheet.py"),
        path.join(ROOT, dir),
        ...new Set(mine.map((t) => t.file + (whole.has(t.file) ? "!" : ""))),
      ],
      { maxBuffer: 1 << 26 },
    ).toString(),
  );
  /* (each sheet's size, for the background's) */
  const sheets = [...new Set(Object.values(at).map((v) => v[0]))],
    sizeOf = JSON.parse(
      execFileSync("python3", [
        "-c",
        "import sys,json;from PIL import Image;print(json.dumps({f:Image.open(f).size for f in sys.argv[1:]}))",
        ...sheets,
      ]).toString(),
    );
  let out = html;
  for (const t of mine) {
    const v = at[t.file];
    if (!v) continue; // (too big for a sheet: its own file still)
    const [sh, x, y, w, h, cx, cy, W, H] = v,
      p = t.place;
    if (p && (p.width !== W * G || p.height !== H * G)) continue; // (not shown at the grid's size: its own file)
    const [sw, shh] = sizeOf[sh],
      url = path.relative(ROOT, sh).split(path.sep).join("/"),
      cls = attr(t.a, "class");
    let style = attr(t.a, "style") || "";
    if (p) {
      /* (cut: it starts where its first pixel is) */
      const top = p.top + cy * G,
        left = p.left + cx * G;
      style = style
        .replace(/(^|;)\s*(inset|top|left|width|height):[^;]*/g, "")
        .replace(/^;+/, "");
      style =
        (p.inset
          ? `inset:${top}px auto auto ${left}px;`
          : `left:${left}px;top:${top}px;`) +
        `width:${w * G}px;height:${h * G}px` +
        (style ? ";" + style : "");
    }
    let rest = t.a
      .replace(/\b(class|style|src|alt|draggable)="[^"]*"\s*/g, "")
      .trim();
    const da = attr(t.a, "data-at");
    if (da) {
      const [ax, ay] = da.split(" ").map(Number);
      rest = rest.replace(`data-at="${da}"`, `data-at="${ax + cx} ${ay + cy}"`);
    }
    const bg = `background:url(${url}) ${-x * G}px ${-y * G}px/${sw * G}px ${shh * G}px`;
    out = out.replace(
      t.all,
      `<i class="${cls}" style="${style ? style.replace(/;?\s*$/, ";") : ""}${bg}"${rest ? " " + rest : ""}${da ? ` data-sp="${url} ${x} ${y} ${w} ${h}"` : ""}></i>`,
    );
  }
  /* the files on sheets, gone (a file another picture still shows, kept) */
  const still = new Set(
    [...out.matchAll(/src="([^"]*)"/g)].map((m) => path.join(ROOT, m[1])),
  );
  let gone = 0;
  for (const f of Object.keys(at))
    if (!still.has(f)) {
      fs.rmSync(f);
      gone++;
    }
  console.log(`${id}: ${gone} files on ${sheets.length} sheet(s)`);
  return out;
}

module.exports = { sheetMarkup };

/* on its own: the maps named, from what they show now */
if (require.main === module)
  for (const id of process.argv.slice(2)) {
    const file = path.join(ROOT, "js", "pxm", id + ".js"),
      text = fs.readFileSync(file, "utf8"),
      head = text.slice(0, text.indexOf("export default")),
      box = { module: {} };
    vm.runInNewContext(text.replace("export default", "module.exports ="), box);
    const world = box.module.exports;
    if (typeof world.html !== "string") continue;
    world.html = sheetMarkup(id, world.html, world.G);
    fs.writeFileSync(file, `${head}export default ${JSON.stringify(world)};\n`);
    execFileSync("npx", ["-y", "prettier@3.6.2", "--write", file]);
  }
