/* ---------- The King's Festival (id: vellum) ----------
   The page of No. 54 of my book (Nous Within Kenoma) under the board: only the page the letters were written on, with
   nothing on it. A real photograph of blank aged vellum (a spare leaf of the Towneley Lectionary, about 1550, New York
   Public Library, public domain), from the book's own site, the edges only a little darker than the middle, as there:
   one pixel file at the world's size, made by tools/pixel-maps.cjs. While it's played the interface takes the Ether &
   Kenoma look, burnt amber, in the chapter's blackletter (Grenze Gotisch): css/app.css, html.map-is-vellum. */
import PAGE from "./pxm/vellum.js";
import { mountWorld } from "./pxmap.js";

/* the map: the page, in the world's pixels */
export function vellumScene(layer) {
  const sc = document.createElement("div");
  sc.className = "scene vellum";
  layer.append(sc);
  const w = mountWorld(sc, {
    ...PAGE,
    html: `<img class="px-file" alt="" draggable="false" style="left:0;top:0;width:${PAGE.W}px;height:${PAGE.H}px" src="${PAGE.pic}">`,
  });
  layer.classList.add("px-own"); // (pixels already: the filter leaves it)
  return {
    update() {},
    destroy() {
      w.destroy();
      layer.classList.remove("px-own");
      sc.remove();
    },
  };
}
