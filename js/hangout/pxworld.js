/* ---------- Duck Cabin's and Downpour's art as real pixels (the owner's, Nov 19 23:10Z and 23:26Z: "It should be saved as
   real pixels ... we don't have the leftover image behind. It's literally pixels ... imagine we're making a game on a
   32-bit only graphics system") ----------
   The ground and every prop are made into pixels once, ahead of time (tools/pixel-world.cjs), one pixel to ART world px,
   in the game's colors, and shipped that way: assets/px/world. The game only shows them; nothing is made on the device.
   A prop's looks (a lamp off, a door open, a fire out, the blackout) are pictures of their own. What isn't in the files
   (a drawing that changed since they were made, words on a sign) is still made on the device as before (pxdom.js). */
import { filesFor } from "../loading.js";

export const ART = 2; // world px to a pixel
/* the classes that give a prop another look (lamp.js, doors.js, power.js, l4dd.js propClass; a lamppost's stutter, flicker.js; the board's blackout) */
export const LOOKS = [
  "dim",
  "off",
  "open",
  "pb-off",
  "unlit-f",
  "unlit-c",
  "unlit-l",
  "blackout",
];
/* a drawing's name in the files: its text's hash (its ids, new each time it's drawn, renamed in order: pxdom.js) and its
   size in pixels */
export const artKey = (svg, box, hash, steady) =>
  hash(steady(svg)) +
  "@" +
  Math.max(1, Math.round(box.w / ART)) +
  "x" +
  Math.max(1, Math.round(box.h / ART));

/* one world's files (made by tools/pixel-world.cjs): { ground: { parts, x, y, w, h }, atlas: url, index }; the ground
   in bands across (each file within its budget), put back together here pixel for pixel */
const DATA = {
  "": () => import("./pxw-cabin.js"),
  l4: () => import("./pxw-cabin-l4.js"),
  l4gs: () => import("./pxw-downpour.js"),
};
const loaded = new Map();
export function worldArt(variant) {
  if (!loaded.has(variant))
    loaded.set(
      variant,
      filesFor(
        (DATA[variant] ? DATA[variant]() : Promise.resolve(null))
          .then(async (m) => {
            if (!m) return null;
            const img = (u) => {
              const i = new Image();
              i.src = u;
              return i.decode().then(() => i);
            };
            const [atlas, ...parts] = await Promise.all(
              [m.ATLAS, ...m.GROUND.parts].map(img),
            );
            const ground = document.createElement("canvas");
            ground.width = parts[0].width;
            ground.height = parts.reduce((t, p) => t + p.height, 0);
            const g = ground.getContext("2d");
            parts.reduce((y, p) => (g.drawImage(p, 0, y), y + p.height), 0);
            return {
              ...m.GROUND,
              img: ground,
              atlas,
              atlasURL: m.ATLAS,
              index: m.INDEX,
            };
          })
          .catch(() => null),
      ), // (the loading screen waits for them: loading.js)
    );
  return loaded.get(variant);
}

/* which of a drawing's looks to show for the classes it has now (and the board's blackout) */
export function lookOf(entry, classes, blackout) {
  const on = entry.k
    ? entry.k.filter((k) => (k === "blackout" ? blackout : classes.contains(k)))
    : [];
  return entry[on.join(" ")] || entry[""];
}
