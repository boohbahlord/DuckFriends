/* ---------- Sandbox: a zone's look (plan Phase 3, Looks) ----------
   What I want: "a texture from the maps (Cabin, Downpour, Euclid's Squares, the Kenoma looks; previews shown), a solid
   color with a hex picker, or an uploaded picture, always made into pixels (the original is never kept). See-through by
   1% steps". Everyone sees a zone's look, cheat mode or not; the zone's own dashed box shows over it while building.
   The tiled textures are cut from the maps' own ground pictures (tools/bake-looks.py); Euclid's Squares and the Kenoma
   looks are their maps drawn whole, made small and kept as pixels, laid over the zone once. lookCSS(look, pics,
   scale) gives its CSS background (scale: screen px for a world px). */
import { SB_LOOK_TEX } from "./sandboxrules.js";
import { euclidMiniURL } from "./euclid.js";
import { nwkSVG } from "./nwk.js";

/* the whole maps, as pixels: their size, 16 : 9 */
const WHOLE_W = 192,
  WHOLE_H = 108;
export const lookTile = (id) => /^(cabin|downpour)-/.test(id);
const isTile = lookTile;
export const lookTileURL = (id) => `assets/px/looks/${id}.webp`;

const imgs = new Map(); // url → an Image, loading or loaded
function img(url) {
  let i = imgs.get(url);
  if (!i) {
    i = new Image();
    i.src = url;
    imgs.set(url, i);
  }
  return i;
}
/* a whole map made into pixels once: "" until it's ready */
const whole = new Map();
function wholeURL(id) {
  if (whole.has(id)) return whole.get(id);
  whole.set(id, "");
  const src =
    id === "euclid"
      ? euclidMiniURL()
      : id === "ec"
        ? "assets/px/maps/ethers-crossroads.webp" // (its picture is that one: an SVG made into a picture can't load it)
        : "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">${nwkSVG(id)}</svg>`,
          );
  const i = new Image();
  i.onload = () => {
    const c = document.createElement("canvas");
    c.width = WHOLE_W;
    c.height = WHOLE_H;
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    /* cover: its middle, cut to 16 : 9 */
    const k = Math.max(WHOLE_W / i.naturalWidth, WHOLE_H / i.naturalHeight),
      w = i.naturalWidth * k,
      h = i.naturalHeight * k;
    g.drawImage(i, (WHOLE_W - w) / 2, (WHOLE_H - h) / 2, w, h);
    whole.set(id, c.toDataURL("image/png"));
  };
  i.src = src;
  return "";
}
/* a texture's small picture for its button in the window */
export function lookPreview(id) {
  return isTile(id) ? lookTileURL(id) : wholeURL(id);
}
export const lookNames = () => Object.entries(SB_LOOK_TEX);
/* a look's CSS background, or "" while its picture loads. pics: the room's uploaded pictures (s.sbpic) */
export function lookCSS(look, pics, scale) {
  if (!look) return "";
  if (look.k === "col") return look.v;
  if (look.k === "pic") {
    const p = pics && pics[look.v];
    return p ? `url("${p.d}") center / 100% 100% no-repeat` : "";
  }
  if (isTile(look.v)) {
    const url = lookTileURL(look.v),
      i = img(url);
    if (!i.naturalWidth) return "";
    return `url("${url}") 0 0 / ${(i.naturalWidth * scale).toFixed(2)}px ${(i.naturalHeight * scale).toFixed(2)}px repeat`;
  }
  const u = wholeURL(look.v);
  return u ? `url("${u}") center / cover no-repeat` : "";
}
