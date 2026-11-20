/* ---------- Made maps: the room's part (the owner's, Nov 19 22:59Z) ----------
   "In Sandbox ... They click it and they can upload an image for the map background. And they can choose if it's the
   default UI or if it's the UI for one of the noose within Konoma UIs and its variations ... Background image gets
   compressed to the same pixel quality as all of the other maps ... and only keeps the processed after image ... they
   can make their own custom map and you don't even need to play the game mode in order to play their custom map because
   they can upload it by itself with its own title, description, and image ... It's just a fucking image".
   A made map lives on the host's device (umaps.js); the host brings it into the room, and from then on it is a map like
   the others there: in the Map page's list and the map vote. Only the host's device holds maps, so only the host brings
   them in or takes them out.
   s.umap: { id: { t: title, de: description, ui: "" (the game's own look) or a Nous Within Kenoma look (UMAP_UIS), d:
   the picture (a PNG, UMAP.W × UMAP.H, in the pixel look's colors) } } */

export const UMAP = {
  W: 640, // (the picture's pixels: every made map the same, the owner's, Nov 19 23:10Z: "the amount of pixels there are
  H: 360, //  should be consistent across every map"; about as many as a computer screen shows of any other map)
  T: 40, // (a title's letters at most)
  DE: 200, // (a description's)
  MOST: 12, // (made maps in a room at once)
  BIG: 1500000, // (a picture's letters at most: far over any picture of that size in the palette's colors)
};
/* the looks a made map can wear: the game's own, or one of the book's (nwk.js) */
export const UMAP_UIS = [
  "",
  "nwk",
  "ec",
  "nwkarch",
  "nwkten",
  "nwkchalice",
  "nwkfool",
];
/* a made map's id: "um" and eight letters or digits (never one of the game's own maps) */
export const isUmap = (id) =>
  typeof id === "string" && /^um[a-z0-9]{8}$/.test(id);
const clean = (v, n) =>
  String(v == null ? "" : v)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
const isPng = (d) =>
  typeof d === "string" &&
  d.length <= UMAP.BIG &&
  /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(d);
/* the room's made maps: its title, or "" */
export const umapTitle = (s, id) => ((s && s.umap) || {})[id]?.t || "";
export const umapIds = (s) => Object.keys((s && s.umap) || {});

/* { t: "umap", k: "put", mid, m: { t, de, ui, d } } brings map mid in (or a new version of it); { k: "del", mid } takes
   it out (between games only, when it's the room's map: the room goes back to Night Show). The host only: the maps are
   on its device */
export function umapAct(s, a) {
  if (a.id !== s.hostId || !isUmap(a.mid)) return false;
  const all = { ...(s.umap || {}) };
  if (a.k === "del") {
    if (!all[a.mid]) return false;
    if (s.options.map === a.mid) {
      if (s.phase !== "lobby" && s.phase !== "over") return false;
      s.options.map = "board";
    }
    delete all[a.mid];
    s.umap = all;
    return true;
  }
  if (a.k !== "put" || !a.m || typeof a.m !== "object") return false;
  const m = a.m,
    t = clean(m.t, UMAP.T),
    ui = UMAP_UIS.includes(m.ui) ? m.ui : "";
  if (!t || !isPng(m.d)) return false;
  if (!all[a.mid] && Object.keys(all).length >= UMAP.MOST) return false;
  all[a.mid] = { t, de: clean(m.de, UMAP.DE), ui, d: m.d };
  s.umap = all;
  return true;
}
