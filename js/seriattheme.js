/* ---------- Seriat's and the command line's look: Nous Within Kenoma ----------
   The owner's (Nov 19 21:59Z): "when you open the Seriat app, it will always have the theme of the Nous Within Kenoma
   site ... Same for when you go into terminal mode on the text chat ... Maybe there's like a color theme. We can choose
   between different color themes based on different variations of Nous Within Kenoma somewhere in the top right in the
   Seriat. And you can do the same thing too for the terminal by just typing a command for theme". While the Seriat window
   or the chat's command line is up, the page wears the book's look (the map-is-nwk classes on the page, css/app.css) in
   the variation I picked; when both are put away, the map's own look comes back. One choice for both, kept on this device
   (profile.settings.seriatTheme). */
import { profile, save } from "./store.js";

/* [name typed, class of its variation (none: the plain book page), what it's called] */
export const SERIAT_THEMES = [
  ["kenoma", "", "Nous Within Kenoma"],
  ["crossroads", "ec", "Ether's Crossroads"],
  ["architectured", "nwkarch", "Architectured"],
  ["ten", "nwkten", "Ten"],
  ["chalice", "nwkchalice", "Chalice"],
  ["fool", "nwkfool", "The Fool"],
];
const byName = (n) =>
  SERIAT_THEMES.find((t) => t[0] === String(n).toLowerCase()) || null;
export const seriatTheme = () =>
  (byName(profile.settings.seriatTheme) || SERIAT_THEMES[0])[0];

const users = new Set();
let saved = null; // (the look the page had before: its map-on and map-is-… classes)
const looks = () =>
  [...document.documentElement.classList].filter(
    (c) => c === "map-on" || c.startsWith("map-is-"),
  );
function refresh() {
  const h = document.documentElement;
  if (users.size) {
    if (!saved) saved = looks();
    looks().forEach((c) => h.classList.remove(c));
    const t = byName(seriatTheme());
    h.classList.add("map-on", "map-is-nwk");
    if (t[1]) h.classList.add("map-is-" + t[1]);
  } else if (saved) {
    looks().forEach((c) => h.classList.remove(c));
    saved.forEach((c) => h.classList.add(c));
    saved = null;
  }
}
/* the window or the command line is up (token: who asks) / put away */
export function useSeriatTheme(token) {
  users.add(token);
  refresh();
}
export function freeSeriatTheme(token) {
  users.delete(token);
  refresh();
}
/* a new choice (by the name typed); the words for the command line's answer */
export function setSeriatTheme(name) {
  const t = byName(name);
  if (!t) return null;
  profile.settings.seriatTheme = t[0];
  save();
  refresh();
  return t;
}
