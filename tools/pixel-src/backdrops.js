/* ---------- the maps' drawings for their pictures (tools/pixel-files.cjs only: never loaded by the game) ----------
   The lobby's and Game Settings' picture of a map, and the map vote's, is a pixel file (assets/px/pic, assets/px/vote).
   Each is made from the drawing here, drawn big and made into pixels the game's way. Nous Within Kenoma's are made from
   the map itself instead (the tool takes a still of it). Change a drawing, then run node tools/pixel-files.cjs */
import { cloud, rnd } from "../../js/art.js";
import { carnivalSVG } from "./carnival.js";
import { backdropSVG } from "./nightshow.js";
import { drawCollage } from "../../js/collage.js";
import { euclidMiniURL } from "../../js/euclid.js";
import { vellumBackdrop } from "../../js/vellum.js";

/* Shelter Sky & Null's real drawing, as a PNG */
function collageURL() {
  const cv = document.createElement("canvas");
  cv.width = 480;
  cv.height = 270;
  for (const _ of drawCollage(cv, 480, 270, false));
  return cv.toDataURL("image/png");
}

export function backdropDrawing(map) {
  if (map === "collage")
    return `<image href="${collageURL()}" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>`; // my collage map's real drawing
  if (map === "euclid" || map === "euclidzoom")
    return `<image href="${euclidMiniURL()}" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>`; // Euclid's Squares' real drawing
  if (map === "vellum") return vellumBackdrop(); // the book page, as it is
  if (map === "tiles")
    return '<defs><pattern id="arttiles" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#fff"/><rect width="60" height="60" fill="#000"/><rect x="60" y="60" width="60" height="60" fill="#000"/></pattern></defs><rect width="480" height="270" fill="url(#arttiles)"/>'; // Tiles' checkerboard, 8 tiles across
  if (map === "rabbit")
    return '<image href="assets/px/maps/rabbit-hole.webp" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>';
  if (map === "stars")
    return '<image href="assets/px/maps/starry-night.webp" width="480" height="270" preserveAspectRatio="xMidYMid slice"/>';
  if (map === "sky")
    return `<defs><linearGradient id="artsky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ab8f5"/><stop offset="1" stop-color="#ffd6a8"/></linearGradient></defs>
<rect width="480" height="270" fill="url(#artsky2)"/><circle cx="392" cy="58" r="30" fill="#ffd84a"/><circle cx="392" cy="58" r="44" fill="#ffd84a" opacity=".25"/>
${cloud(90, 70, 0.5, "#ffffffdd", "#ffffff77")}${cloud(330, 150, 0.55, "#ffffffcc", "#ffffff66")}`;
  if (map === "pixel") {
    const bands = [
      "#171a45",
      "#2b2a6b",
      "#5b3586",
      "#8a3f86",
      "#bb4f78",
      "#e2685e",
      "#f58e48",
      "#ffb44d",
    ];
    const r = rnd(9);
    let px = bands
      .map(
        (c, i) =>
          `<rect x="0" y="${i * 17}" width="480" height="18" fill="${c}"/>`,
      )
      .join("");
    px +=
      '<rect x="356" y="118" width="40" height="40" fill="#ffdf6b"/><rect x="350" y="112" width="52" height="52" fill="#ffdf6b" opacity=".3"/>';
    const isle = (x, y, b, w) => {
      let g = "";
      for (let k = 0; k < w; k++)
        g += `<rect x="${x + k * b}" y="${y}" width="${b}" height="${b}" fill="#5fa83a"/><rect x="${x + k * b}" y="${y + b}" width="${b}" height="${b * 2}" fill="#8a5a33"/>`;
      for (let row = 3, lo = 1, hi = w - 1; hi > lo; row++, lo++, hi--)
        for (let k = lo; k < hi; k++)
          g += `<rect x="${x + k * b}" y="${y + row * b}" width="${b}" height="${b}" fill="${(k + row) % 3 ? "#808080" : "#6a6a6a"}"/>`;
      return (
        g +
        `<rect x="${x + 2 * b}" y="${y - 3 * b}" width="${b}" height="${b * 3}" fill="#6b4a2a"/><rect x="${x + b}" y="${y - 6 * b}" width="${b * 3}" height="${b * 3}" fill="#3f8f2f"/>`
      );
    };
    px += isle(60, 60, 8, 8) + isle(250, 40, 6, 7);
    for (let y = 136, b = 6; y < 270; y += b, b = Math.min(18, b + 2))
      for (let x = 0; x < 480; x += b)
        px += `<rect x="${x}" y="${y}" width="${b}" height="${b}" fill="${["#2a5e22", "#2f6b26", "#3b7f2c", "#4a9433"][Math.floor(r() * 4)]}"/>`;
    return `<g shape-rendering="crispEdges">${px}</g>`;
  }
  if (map === "carnival")
    return carnivalSVG().replace("<svg ", '<svg width="480" height="270" ');
  if (map === "cabin") {
    // Duck Cabin at night: the moon, pines, the cabin with its warm windows, string lights on the deck
    const r = rnd(5),
      stars = Array.from(
        { length: 40 },
        () =>
          `<circle cx="${(r() * 480).toFixed(0)}" cy="${(r() * 120).toFixed(0)}" r="${(0.6 + r() * 1.2).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`,
      ).join("");
    const pine = (x, y, k) =>
      `<path d="M${x} ${y - 70 * k}L${x + 22 * k} ${y - 28 * k}H${x + 12 * k}L${x + 30 * k} ${y}H${x - 30 * k}L${x - 12 * k} ${y - 28 * k}H${x - 22 * k}Z" fill="#14301f" stroke="#0a1a10" stroke-width="2"/>`;
    return `<defs><linearGradient id="artcabin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#22305e"/></linearGradient></defs>
<rect width="480" height="270" fill="url(#artcabin)"/>${stars}<circle cx="70" cy="52" r="22" fill="#fff4cf"/><circle cx="70" cy="52" r="36" fill="#fff4cf" opacity=".15"/>
<rect y="196" width="480" height="74" fill="#1e3b2b"/>${pine(30, 210, 1.2)}${pine(450, 214, 1.3)}${pine(400, 205, 0.9)}${pine(96, 206, 0.8)}
<path d="M300 196V130L360 92L420 130V196Z" fill="#8a4a20" stroke="#1c1c28" stroke-width="3" stroke-linejoin="round"/><path d="M290 134L360 84L430 134" fill="none" stroke="#5a2f14" stroke-width="10" stroke-linecap="round"/>
<rect x="318" y="146" width="24" height="20" rx="3" fill="#ffc861" stroke="#1c1c28" stroke-width="2.5"/><rect x="380" y="146" width="24" height="20" rx="3" fill="#ffc861" stroke="#1c1c28" stroke-width="2.5"/><rect x="350" y="160" width="20" height="36" rx="3" fill="#5a2f14" stroke="#1c1c28" stroke-width="2.5"/>
<ellipse cx="330" cy="200" rx="60" ry="10" fill="#ffc861" opacity=".18"/>
<path d="M290 182Q330 194 360 182T430 182" fill="none" stroke="#1c1c28" stroke-width="1.5"/>${[300, 315, 330, 345, 375, 390, 405, 420].map((x, i) => `<circle cx="${x}" cy="${(185 + Math.sin(i * 1.3) * 3).toFixed(1)}" r="3" fill="${["#ffd23f", "#ff6b6b", "#5ce1ff", "#7dff7a"][i % 4]}"/>`).join("")}`;
  }
  return backdropSVG(480, 270, true).replace(
    "<svg ",
    '<svg width="480" height="270" ',
  ); // Night Show
}
