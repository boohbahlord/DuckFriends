/* ---------- Game Settings: the pictures in the preview box ----------
   Moved out of gamesettings.js to keep that file small (a pure move; the owner's, Nov 22). */
import { esc } from "./ui.js";

import { artBackdrop } from "./art.js";

import { modeOf, CABIN_MODES } from "./modes.js";

import { isWorldMap, mapName, mapForm, umapOf } from "./maps.js";

import { isUmap } from "./umaprules.js";

/* ---------- the pictures in the preview box ---------- */
/* a game's board over a map, drawn simply and see-through as in a game: Agree or Disagree's seven columns, the two tiles
   of the two-sided games (with the middle strip, and the circle for Lawyering and Duncelation), Story Chain's page */
function boardSketch(mode) {
  const x0 = 26,
    y0 = 46,
    w = 428,
    h = 200,
    tile = (x, tw, fill) =>
      `<rect x="${x}" y="${y0}" width="${tw}" height="${h}" rx="6" style="fill:${fill}" fill-opacity=".5" stroke="#1c1c28" stroke-opacity=".35"/>`;
  const own = {
    aod: () =>
      Array.from({ length: 7 }, (_, i) =>
        tile(x0 + (i * w) / 7 + 1, w / 7 - 2, `var(--c${i + 1})`),
      ).join(""),
    sc: () =>
      `<rect x="120" y="${y0}" width="240" height="${h}" rx="10" fill="#fff" fill-opacity=".72" stroke="#1c1c28" stroke-opacity=".35"/>${[
        0, 1, 2, 3, 4,
      ]
        .map(
          (i) =>
            `<rect x="140" y="${y0 + 22 + i * 34}" width="${[190, 160, 200, 150, 120][i]}" height="7" rx="3.5" fill="#1c1c28" fill-opacity=".45"/>`,
        )
        .join("")}`,
  }[mode];
  if (own) return own();
  const two = {
    wyr: ["#2fa4ff", "#ff8c2b", 0.46],
    ddr: ["var(--c6)", "var(--c2)", 0.46],
    bb: ["var(--c7)", "var(--c3)", 0.46],
    law: ["var(--c2)", "var(--c7)", 0.42],
    dunce: ["var(--c2)", "var(--c6)", 0.42],
  }[mode];
  if (two) {
    const [a, b, m] = two,
      side = w * m,
      ring =
        m < 0.45
          ? `<circle cx="${x0 + w / 2}" cy="${y0 + h / 2}" r="26" fill="#ffffff22" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`
          : "";
    return tile(x0, side, a) + tile(x0 + w - side, side, b) + ring;
  }
  return "";
}
/* the map large: Duck Cabin as the real map (one picture of all of it; Downpour for Dead Ducks Arcade), any other map
   with the picked game's board on it */
export function mapPic(s, id, mode) {
  if (isUmap(id)) {
    const m = umapOf(id); // (a made map: its own picture, umaps.js)
    return m
      ? `<img class="gs-made" src="${m.d}" alt="${esc(m.t)}" draggable="false">`
      : "";
  }
  if (isWorldMap(id))
    return modeOf(mode).l4map
      ? `<img src="assets/px/maps/downpour.webp" data-pxready data-pxok alt="Downpour" draggable="false">`
      : `<img class="gs-cabin" src="assets/px/maps/duck-cabin.webp" data-pxready data-pxok alt="Duck Cabin" draggable="false">`;
  const f = mapForm(id),
    grey = f.grey || (id === "collage" && s.options.mapGrey) ? " grey" : "";
  return `<svg class="gs-map${grey}" viewBox="0 0 480 270" role="img" aria-label="${esc(mapName(id))}"><g class="gs-back">${artBackdrop(f.grey ? f.map : id)}</g>${CABIN_MODES.includes(mode) ? "" : boardSketch(mode)}</svg>`;
}
/* a game mode's picture: one screenshot of the mode (every name tag hidden, rainbow ducks), its board drawn over the
   picked map. The screenshots were taken with the map left out, so any map shows through; Duck Cabin's games are
   screenshots of the cabin itself */
export function gamePic(s, mode) {
  const shot =
    mode === "sandbox"
      ? "" // (Sandbox: its map alone, till it has a screenshot of its own)
      : `<image href="assets/px/modes/${mode}.webp" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>`;
  if (CABIN_MODES.includes(mode))
    return `<svg class="gs-map" viewBox="0 0 480 270" role="img" aria-label="${esc(modeOf(mode).name)}">${shot}</svg>`;
  const map =
      s.options.map && !isWorldMap(s.options.map) ? s.options.map : "board",
    grey = map === "collage" && s.options.mapGrey ? " grey" : "";
  return `<svg class="gs-map${grey}" viewBox="0 0 480 270" role="img" aria-label="${esc(modeOf(mode).name)}: ${esc(mapName(map))}"><g class="gs-back">${artBackdrop(map)}</g>${shot}</svg>`;
}
