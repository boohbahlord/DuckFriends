/* ---------- the room's duck-look settings ----------
   Four settings in Game options change how ducks look during a game (never in the lobby):
   - Hide customization (hideLooks): every duck is the plain yellow duck, and every name tag is plain. Name tags always
     show with it on. A duck keeps its specials: only the look goes.
   - Rainbow Ducks (rainbowDucks, only with Hide customization): each duck is one of eight looks, dealt at random when
     the game starts: the seven colors of the rainbow, and a brown duck in Justin's costume (his glasses and jeans).
     Knocking down that duck is never a Justin kill (fakeJustin()).
   - Vote colors (voteColor, never with Rainbow Ducks, never in Mad God Justin): a duck takes the color of the tile it
     stands on, and goes back to its own color off the tiles. Every style takes it in its own way (tinted()).
   - Change player tag color (tagColor, with Vote colors): the name tag takes the duck's vote color too. */
import { DUCK_DEFAULT, mix } from "./duck.js";
import { activeRoom } from "./net.js";
import {
  RAINBOW,
  BROWN,
  FAKE_JUSTIN,
  hidesLooks,
  rainbowOn,
} from "./looksrules.js";
export * from "./looksrules.js";

/* a duck's specials stay with it whatever it looks like */
const keepPlay = (L) => ({
  special: L.special ?? null,
  keys: L.keys ?? null,
  spc: L.spc ?? null,
});

/* the eight looks: a rainbow duck is the plain duck in one color; the eighth is brown, in Justin's glasses and jeans */
export const rainbowLook = (k) =>
  k === FAKE_JUSTIN
    ? {
        ...DUCK_DEFAULT,
        color: BROWN,
        face: { id: "glasses" },
        outfit: { id: "jeans" },
      }
    : { ...DUCK_DEFAULT, color: RAINBOW[k % RAINBOW.length] };

/* the look a game draws for a player (p: one of s.players, with its id) */
export function shownDuck(s, p) {
  const L = (p && p.duck) || DUCK_DEFAULT;
  if (!hidesLooks(s)) return L;
  if (rainbowOn(s) && s.rainbow && p.id in s.rainbow)
    return { ...rainbowLook(s.rainbow[p.id]), ...keepPlay(L) };
  return { ...DUCK_DEFAULT, ...keepPlay(L) };
}
/* the name tag's style: plain while looks are hidden */
export const shownNameStyle = (s, p) =>
  hidesLooks(s) ? {} : (p && p.nameStyle) || {};

/* Vote colors: a look in the tile's color c. Every style takes it its own way: the body (and its stripes, wings or
   second suit in shades of it); the mallard keeps its head, Jack's box takes the color and his suit lighter and darker
   shades, and Dat Boi turns that color with his unicycle a shade darker. Metals, patterns and pictures give way to the color. */
export function tinted(L, c) {
  const d = mix(c, 0, 0.35),
    t = {
      ...L,
      color: c,
      metal: "none",
      pattern: "none",
      image: null,
      tint: c,
    };
  switch (L.style) {
    case "raptor":
      return { ...t, color2: d, color3: mix(c, 255, 0.3) };
    case "pelican":
      return { ...t, color2: d };
    case "jack":
      return { ...t, color2: c, color: mix(c, 255, 0.35), color3: d };
    case "datboi":
      return { ...t, frog: c, cycle: d, rank: null };
    default:
      return t;
  }
}

/* the color of the tile under a duck, read from the board itself so every board and palette works (a see-through
   tile's alpha is dropped): "" when the duck stands on no tile */
export function tileColor(board, c) {
  const col = c >= 0 && board && board.querySelector(`.col[data-c="${c}"]`);
  if (!col) return "";
  const cs = getComputedStyle(col);
  return solid(cs.backgroundColor) || solid(cs.getPropertyValue("--c"));
}
/* any css color to #rrggbb, rounded a little so a fading tile doesn't redraw the duck every frame */
function solid(v) {
  v = String(v || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  let m = v.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?/);
  let rgb = m && [m[1], m[2], m[3]].map((x) => +x * 255);
  if (!rgb) {
    m = v.match(/^rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/);
    rgb = m && [m[1], m[2], m[3]].map(Number);
  }
  if (!rgb || (m[4] !== undefined && +m[4] === 0)) return ""; // (a clear tile has no color of its own)
  return (
    "#" +
    rgb
      .map((x) =>
        Math.min(255, Math.round(x / 6) * 6)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
/* the letters on a colored name tag: dark on a light color, white on a dark one */
export function inkOn(hex) {
  const n = parseInt(String(hex).slice(1), 16),
    [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1c1c28" : "#fff";
}

/* the same for every other picture of a player in a game (stat boxes, chips, the cloud, cards): the active room's
   state decides; p.shown marks a look that is already the one to show (a dunce's, made from seenDuck) */
const roomState = () => {
  const r = activeRoom();
  return r && r.state;
};
export const seenDuck = (p) =>
  p && p.id && !p.shown ? shownDuck(roomState(), p) : p && p.duck;
export const seenName = (p) =>
  p && p.id && !p.shown
    ? shownNameStyle(roomState(), p)
    : (p && p.nameStyle) || {};
