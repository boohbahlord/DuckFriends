/* ---------- Sandbox: a zone's look (plan Phase 3, Looks) ----------
   What I want: "a texture from the maps (Cabin, Downpour, Euclid's Squares, the Kenoma looks; previews shown), a solid
   color with a hex picker, or an uploaded picture, always made into pixels (the original is never kept). See-through by
   1% steps". Everyone sees a zone's look, cheat mode or not; the zone's own dashed box shows over it while building.
   The tiled textures are cut from the maps' own ground pictures (tools/bake-looks.py); Euclid's Squares and the Kenoma
   looks are their maps' picture files (assets/px/pic), laid over the zone once. lookCSS(look, pics,
   scale) gives its CSS background (scale: screen px for a world px). */
import { SB_LOOK_TEX } from "./sandboxrules.js";
import { picURL } from "./art.js";

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
/* a whole map: its picture file, made into pixels ahead of time (tools/pixel-files.cjs; the owner's, Nov 19 23:26Z: "we
   don't have the leftover image behind. It's literally pixels") */
const wholeURL = picURL;
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
  return `url("${wholeURL(look.v)}") center / cover no-repeat`;
}
