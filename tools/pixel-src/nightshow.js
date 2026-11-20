/* ---------- Night Show's drawing (tools/pixel-maps.cjs and tools/pixel-files.cjs only: never loaded by the game) ----------
   The game shows Night Show, and the menus' background, as the pixel files made from this (js/pxm/board.js,
   js/pxmap.js): no drawing of it ships (the owner's, Nov 19 23:26Z: "we don't have the leftover image behind. It's
   literally pixels"). Change it here, then run node tools/pixel-maps.cjs board and board-light */
import { rnd } from "../../js/art.js";
import { playroom } from "./playroom.js";

/* the page's background: a little indoor carnival. Twister dots across the whole floor in perspective, breathing like
   lights, bunting (and, in the dark, glowing string lights) across the top, and a few ball-pit balls and bits of confetti
   drifting. Drawn to the window's size; redrawn when it changes or the theme does.
   backdropParts draws the pieces; backdropSVG puts them in one still picture (the small previews); backdropHTML lays
   them out as layers for the page and the Night Show map: the still part as one picture, each row of dots of one color
   and each set of bulbs as a small picture that fades in and out a little after the last (so the light rolls across the
   floor in diagonal waves), and each ball or confetti as its own small picture that drifts. Fading or moving a whole picture is cheap for the browser; redrawing a big animated drawing every frame
   is not (it made scrolling lag). */
function backdropParts(w, h, dark) {
  const r = rnd(77),
    base = [],
    dots = [],
    bulbs = [[], [], []],
    shapes = [],
    cols = ["#ef3b3b", "#2fa4ff", "#ffd23f", "#37d421"];
  const hz = h * 0.46,
    K = (h - hz) * 1.05,
    K2 = w * 0.16;
  /* the floor: Twister dots in rows to the horizon and out past both edges; each row and color breathes (glows up and
     fades) a little after the last, so the light rolls across the floor */
  base.push(
    `<rect y="${hz}" width="${w}" height="${h - hz}" fill="url(#bdfloor)"/>`,
  );
  const px = (x, z) => w / 2 + (x * K2) / z,
    py = (z) => hz + K / z;
  for (let z = 0.95, row = 0; z < 16; z *= 1.24, row++) {
    const rx = (0.42 * K2) / z,
      ry = rx * 0.42,
      y = py(z);
    if (y > h + ry) continue;
    const groups = cols.map((_, c) => ({
      dl: (row * 0.55 + c * 1.1) % 4.4,
      y0: Math.max(hz, y - ry * 2),
      y1: Math.min(h, y + ry * 2),
      items: [],
    }));
    for (let X = -60; X <= 60; X++) {
      const x = px(X + 0.5, z);
      if (x < -rx * 1.8 || x > w + rx * 1.8) continue;
      const c = ((X % 4) + 4) % 4;
      groups[c].items.push(
        dark
          ? `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * 1.7).toFixed(1)}" ry="${(ry * 1.9).toFixed(1)}" fill="url(#bdg${c})"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`
          : `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${cols[c]}"/>`,
      );
    }
    dots.push(...groups.filter((g) => g.items.length && g.y1 - g.y0 > 1));
  }
  /* bunting along two sagging strings; bulbs between the flags glow in the dark */
  const string = (y1, y2, sag, n, k) => {
    const pt = (t) => [
      -30 + (w + 60) * t,
      y1 + (y2 - y1) * t + sag * 4 * t * (1 - t),
    ];
    const pts = Array.from({ length: n + 1 }, (_, i) => pt(i / n));
    let g = `<path d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}" stroke="${dark ? "#8a8fb5" : "#5d6072"}" stroke-width="1.5" fill="none" opacity=".6"/>`;
    for (let i = 0; i < n; i++) {
      const [x, y] = pt((i + 0.5) / n),
        c = ["#ef3b3b", "#ffd23f", "#2fa4ff", "#37d421", "#9b5de5", "#ff8c2b"][
          (i + k) % 6
        ],
        f = 15 + r() * 6;
      g += `<path d="M${(x - f * 0.7).toFixed(1)} ${(y - 2).toFixed(1)}L${(x + f * 0.7).toFixed(1)} ${(y - 2).toFixed(1)}L${x.toFixed(1)} ${(y + f * 1.25).toFixed(1)}Z" fill="${c}" opacity="${dark ? 0.55 : 0.8}"/>`;
      if (dark) {
        const [bx, by] = pt((i + 1) / n);
        r();
        bulbs[(i + k) % 3].push(
          `<circle cx="${bx.toFixed(1)}" cy="${(by + 3).toFixed(1)}" r="3.6" fill="${["#ffe9a8", "#ffd0f0", "#c6f0ff"][(i + k) % 3]}"/>`,
        );
      }
    }
    return g;
  };
  const n = Math.max(8, Math.round(w / 90));
  base.push(
    `<g${dark ? ' filter="url(#bdglow)"' : ""}>${string(h * 0.03, h * 0.08, h * 0.09, n, 0)}${string(h * 0.13, h * 0.06, h * 0.1, n + 1, 3)}</g>`,
  );
  /* drifting ball-pit balls and confetti, with white space between them */
  const placed = [];
  for (
    let k = 0, tries = 0;
    k < Math.round(Math.max(6, (w * h) / 160000)) && tries < 400;
    tries++
  ) {
    const s = 12 + r() * 20,
      x = r() * w,
      y = h * 0.18 + r() * h * 0.55;
    if (placed.some((p) => Math.hypot(p[0] - x, p[1] - y) < (p[2] + s) * 3))
      continue;
    placed.push([x, y, s]);
    k++;
    const c = cols[k % 4],
      vars = `--d:${(12 + r() * 10).toFixed(1)}s;--dl:-${(r() * 10).toFixed(1)}s;--dx:${((r() - 0.5) * 26).toFixed(0)}px;--dy:${((r() - 0.5) * 30).toFixed(0)}px;--dr:${((r() - 0.5) * 30).toFixed(0)}deg`;
    const inner =
      k % 3
        ? `<circle r="${s.toFixed(1)}" fill="${c}" opacity="${dark ? 0.5 : 0.55}"/><ellipse cx="${(-s * 0.35).toFixed(1)}" cy="${(-s * 0.38).toFixed(1)}" rx="${(s * 0.32).toFixed(1)}" ry="${(s * 0.2).toFixed(1)}" fill="#fff" opacity=".55" transform="rotate(-30 ${(-s * 0.35).toFixed(1)} ${(-s * 0.38).toFixed(1)})"/>`
        : `<g transform="rotate(${(r() * 360).toFixed(0)})"><rect x="${-s * 0.5}" y="${-s * 0.2}" width="${s}" height="${s * 0.4}" rx="2" fill="${c}" opacity="${dark ? 0.5 : 0.6}"/></g>`;
    shapes.push({ x, y, s, inner, vars });
  }
  const defs = `<defs>
<linearGradient id="bdsky" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#101225"/><stop offset=".46" stop-color="#1f1640"/>' : '<stop offset="0" stop-color="#e3f4ff"/><stop offset=".46" stop-color="#fff7fb"/>'}</linearGradient>
<linearGradient id="bdfloor" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#191a33"/><stop offset="1" stop-color="#0d0e1c"/>' : '<stop offset="0" stop-color="#f4f1ff"/><stop offset="1" stop-color="#e8f3ff"/>'}</linearGradient>
${cols.map((c, k) => `<radialGradient id="bdg${k}"><stop offset=".35" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join("")}
<filter id="bdglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
  const room = playroom(w, h, dark);
  return {
    w,
    h,
    defs: defs.replace("</defs>", room.defs + "</defs>"),
    base,
    dots,
    bulbs,
    shapes,
    room,
  };
}
/* a drawing of some parts; y0, y1: only that band of the page (the fading layers stay small: the floor, the lights);
   x0, x1: only that much of its width (the blocks' letters: only their pile) */
const svgOf = (P, body, sky = false, y0 = 0, y1 = P.h, x0 = 0, x1 = P.w) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${(x1 - x0).toFixed(1)} ${(y1 - y0).toFixed(1)}" width="${(x1 - x0).toFixed(0)}" height="${(y1 - y0).toFixed(0)}" preserveAspectRatio="none" aria-hidden="true">${P.defs}${sky ? `<rect width="${P.w}" height="${P.h}" fill="url(#bdsky)"/>` : ""}${body}</svg>`;
/* the whole backdrop as one still drawing */
export function backdropSVG(w = innerWidth, h = innerHeight, dark = false) {
  const P = backdropParts(w, h, dark);
  return svgOf(
    P,
    P.base[0] +
      `<g opacity=".5">${P.dots.map((d) => d.items.join("")).join("")}</g>` +
      P.room.still +
      P.room.bulbs.flat().join("") +
      P.room.letters.map((g) => g[0].join("")).join("") +
      P.base.slice(1).join("") +
      P.bulbs.flat().join("") +
      P.shapes
        .map(
          (x) =>
            `<g transform="translate(${x.x.toFixed(0)} ${x.y.toFixed(0)})">${x.inner}</g>`,
        )
        .join(""),
    true,
  ).replace(' xmlns="http://www.w3.org/2000/svg"', "");
}
/* the playroom's layers: the still part, the bulbs, the letters and the train (see playroom.js) */
const pct = (y, h) => ((y / h) * 100).toFixed(3) + "%";
function roomHTML(P, img, dark) {
  const R = P.room,
    h = P.h,
    band = (y0, y1) => `top:${pct(y0, h)};height:${pct(y1 - y0, h)}`,
    T = R.train;
  return (
    img(
      svgOf(P, R.still, false, R.stillTop, R.stillBottom),
      "",
      band(R.stillTop, R.stillBottom),
    ) +
    R.bulbs
      .map((b, k) =>
        b.length
          ? img(
              svgOf(P, b.join(""), false, R.bulbTop, R.bulbBottom),
              "bd-pgb",
              `${band(R.bulbTop, R.bulbBottom)};--dl:-${(k * 0.4).toFixed(1)}s`,
            )
          : "",
      )
      .join("") +
    /* each color of letters as two small pictures, one over each pile of blocks (not one as wide as the page: the
       browser blends every fading picture again each frame, so a smaller one costs less), fading together */
    R.letters
      .map((g, k) =>
        g
          .map((L, c) =>
            R.letterX
              .map(([x0, x1]) =>
                img(
                  svgOf(
                    P,
                    `<g${dark ? ' filter="url(#pgglow)"' : ""}>${L.join("")}</g>`,
                    false,
                    R.letterTop,
                    R.letterBottom,
                    x0,
                    x1,
                  ),
                  `bd-bk bd-bk${c}`,
                  `${band(R.letterTop, R.letterBottom)};left:${pct(x0, P.w)};width:${pct(x1 - x0, P.w)};--dl:-${(c * 1.5 + k * 0.45).toFixed(2)}s`,
                ),
              )
              .join(""),
          )
          .join(""),
      )
      .join("") +
    trainHTML(T, P.w, h)
  );
}
/* the train runs across in 60% of its 26 s and waits off the page for the rest; its wheels turn at its speed */
function trainHTML(T, w, h) {
  const dur = 26,
    speed = (w + T.W) / (dur * 0.6),
    src = (svg) =>
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return (
    `<div class="pg-train" style="top:${pct(T.top, h)};width:${T.W.toFixed(0)}px;height:${T.H.toFixed(0)}px;--run:${w}px;--dur:${dur}s">` +
    `<img class="pg-body" alt="" draggable="false" src="${src(T.svg)}">` +
    T.wheels
      .map(
        (q) =>
          `<img class="pg-wheel" alt="" draggable="false" style="left:${(q.x - q.r).toFixed(1)}px;top:${(q.y - q.r).toFixed(1)}px;width:${(q.r * 2).toFixed(1)}px;--wd:${((Math.PI * 2 * q.r) / speed).toFixed(2)}s" src="${src(q.svg)}">`,
      )
      .join("") +
    [0, 1, 2]
      .map(
        (k) =>
          `<span class="pg-smoke" style="left:${T.smoke.x.toFixed(0)}px;top:${T.smoke.y.toFixed(0)}px;--s:${(T.ut * 0.5).toFixed(0)}px;--dl:-${(k * 0.8).toFixed(1)}s"></span>`,
      )
      .join("") +
    "</div>"
  );
}
/* the backdrop as layers that animate cheaply (see above) */
export function backdropHTML(w = innerWidth, h = innerHeight, dark = false) {
  const P = backdropParts(w, h, dark),
    img = (svg, cls = "", style = "") =>
      `<img class="bd-layer${cls ? " " + cls : ""}" alt="" draggable="false"${style ? ` style="${style}"` : ""} src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
  return (
    img(svgOf(P, P.base[0], true)) +
    P.dots
      .map(
        (d) =>
          img(
            svgOf(P, d.items.join(""), false, d.y0, d.y1),
            "bd-dots",
            `top:${((d.y0 / h) * 100).toFixed(3)}%;height:${(((d.y1 - d.y0) / h) * 100).toFixed(3)}%;--dl:-${d.dl.toFixed(2)}s`,
          ).replace(
            "<img ",
            `<img data-y="${d.y0.toFixed(2)} ${d.y1.toFixed(2)} ${d.dl.toFixed(2)}" `,
          ), // (for floorCanvas)
      )
      .join("") +
    roomHTML(P, img, dark) +
    img(
      svgOf(P, P.base.slice(1).join(""), false, 0, P.h * 0.3),
      "",
      "height:30%",
    ) + // (the bunting: only the top of the page, where it hangs)
    P.bulbs
      .map((b, k) =>
        b.length
          ? img(
              svgOf(
                P,
                `<g filter="url(#bdglow)">${b.join("")}</g>`,
                false,
                0,
                h * 0.3,
              ),
              "bd-bulbs",
              `height:30%;--dl:-${(k * 0.87).toFixed(2)}s`,
            )
          : "",
      )
      .join("") +
    P.shapes
      .map((x) => {
        const k = Math.ceil(x.s * 1.6);
        return `<div class="bd-sh" style="left:${((x.x / w) * 100).toFixed(2)}%;top:${((x.y / h) * 100).toFixed(2)}%;width:${k * 2}px;height:${k * 2}px;margin:-${k}px 0 0 -${k}px;${x.vars}"><svg viewBox="${-k} ${-k} ${k * 2} ${k * 2}" aria-hidden="true">${x.inner}</svg></div>`;
      })
      .join("")
  );
}
