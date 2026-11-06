/* ---------- The King's Festival (id: vellum) ----------
   The page of No. 54 of my book (Nous Within Kenoma) under the board: only the page the letters were written on, with
   nothing on it. A real photograph of blank aged vellum (a spare leaf of the Towneley Lectionary, about 1550, New York
   Public Library, public domain), from the book's own site, the edges only a little darker than the middle, as there.
   While it's played the interface takes the Ether & Kenoma look, burnt amber, in the chapter's blackletter (Grenze
   Gotisch): css/app.css, html.map-is-vellum. */

export const VELLUM = "assets/maps/vellum/vellum.webp";

/* the map: the page (css draws it) and its darker edges */
export function vellumScene(layer) {
  const sc = document.createElement("div");
  sc.className = "scene vellum";
  sc.innerHTML = '<i class="vl-edge"></i>';
  layer.append(sc);
  return {
    update() {},
    destroy: () => sc.remove(),
  };
}

/* the small picture for the Map window */
export const vellumMini = () => '<div class="mini-map mm-vellum"></div>';

/* the page in the Game Settings and lobby pictures and the map vote (16 : 9) */
export const vellumBackdrop = () =>
  `<defs><radialGradient id="vledge" cx=".5" cy=".48" r=".75"><stop offset=".55" stop-color="#462a12" stop-opacity="0"/><stop offset="1" stop-color="#462a12" stop-opacity=".22"/></radialGradient></defs>
<rect width="480" height="270" fill="#ba966c"/><image href="${VELLUM}" width="480" height="270" preserveAspectRatio="xMidYMid slice"/><rect width="480" height="270" fill="url(#vledge)"/>`;
