/* ---------- Specials ----------
   Each special sits on a number key, 1 to 9 or 0, picked under Customize → Specials (the keys travel with the duck's look):
   - effects (electricity, flames, hearts, a poison cloud, music notes, the Loser's X, a disco ball, ducklings): their key
     shows them on the duck for 5 seconds, seen by everyone; Shift and the key keeps one on until Shift and the key again.
     They show only from the keys (the Loser's X also follows a duck that loses in brackets); the ducklings walk in a row
     behind their duck, along its path;
   - jumps: the Long jump's key does a long jump (Shift and the key: every jump is long); the Double jump's key jumps
     again in the air, once a jump, with a small see-through cloud (Shift and the key: Space does it too);
   - items, used with their key: coffee, a water gun, a hotdog, a confetti gun, a handgun whose bullets knock ducks
     down (they play dead until they move; seven shots, then it reloads), a thrown dagger that arcs down off the screen
     knocking down every duck in its way, a knife that stabs the duck in front, a hammer (or a wrench) whose swing knocks
     back every duck in front, a sound, a trombone's sour note, or confetti over everyone's screen. On a computer the
     weapons aim at the mouse, turning around the duck; Shift and the key keeps one out, and a left click uses it.
   On a phone, holding still on the board brings the specials around the finger (see hotbar.js). Effects and items take
   up to three colors (Primary, Secondary, Accent) under Customize → Colors. */
import { el } from "./ui.js";
import { fewer } from "./gfx.js";
export { SHOT_SPEED } from "./rules.js";

/* the trombone, side on: the mouthpiece at the left end (at the beak), the slide reaching forward, the bell above it */
const BONE = ([a, b]) => {
  const tube = (d, w) =>
    `<path d="${d}" fill="none" stroke="#5a3d00" stroke-width="${w + 1.4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${a}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 64 28"><path d="M0 12.6h3.4v4.8H0Z" fill="${b}" stroke="#5a3d00" stroke-width="1"/>${tube("M3 15H30M12 22H30", 1.8)}
    <g class="bone-slide">${tube("M24 15H52a3.5 3.5 0 0 1 0 7H24", 2.4)}<path d="M40 15v7" stroke="#5a3d00" stroke-width="1.6"/></g>
    ${tube("M12 22H8a3.5 3.5 0 0 1-3.5-3.5V9A3.5 3.5 0 0 1 8 5.5H22", 2.2)}
    <path d="M21 4.2L36 .6V11.9L21 6.8Z" fill="${a}" stroke="#5a3d00" stroke-width="1" stroke-linejoin="round"/><ellipse cx="36" cy="6.25" rx="1.8" ry="5.9" fill="${b}" stroke="#5a3d00" stroke-width="1"/>
    <path d="M24 4.6L33 2.4" stroke="#fff" stroke-width=".9" opacity=".6"/></svg>`;
};
/* the dagger, pointing right: the blade, the guard across it, the handle */
const DAGGER = ([a, b, c]) =>
  `<svg viewBox="0 0 44 16"><path d="M14 5.2H36L43 8 36 10.8H14Z" fill="${a}" stroke="#2a2d38" stroke-width="1.2" stroke-linejoin="round"/><path d="M15 8H38" stroke="#fff" stroke-width=".9" opacity=".55"/><rect x="11" y="1.5" width="3.6" height="13" rx="1.5" fill="${c}" stroke="#2a2d38" stroke-width="1.1"/><rect x="2" y="5.6" width="9.4" height="4.8" rx="2" fill="${b}" stroke="#2a2d38" stroke-width="1.1"/><circle cx="2.4" cy="8" r="2" fill="${c}" stroke="#2a2d38" stroke-width="1"/></svg>`;
const INK = "#2a2d38";
/* the knife: a kitchen knife, the spine straight to the tip and the edge curving up to it; a bolster, a handle with
   three rivets. Colors: blade, handle, rivets */
const KNIFE = ([a, b, c]) =>
  `<svg viewBox="0 0 48 16"><rect x="1.5" y="5.4" width="16" height="6.2" rx="2.6" fill="${b}" stroke="${INK}" stroke-width="1.1"/><path d="M3.6 7h11.6" stroke="#fff" stroke-width=".8" opacity=".25"/>${[5.6, 9.8, 14].map((x) => `<circle cx="${x}" cy="8.5" r="1.15" fill="${c}" stroke="${INK}" stroke-width=".7"/>`).join("")}<path d="M18.6 3.2H39.5Q44.8 3.4 47.4 4.7Q43.4 10.8 34.5 12.6H18.6Z" fill="${a}" stroke="${INK}" stroke-width="1.15" stroke-linejoin="round"/><path d="M20.5 11H34.2Q41 9.9 45.4 5.6" fill="none" stroke="#fff" stroke-width=".9" opacity=".6"/><path d="M20 5.2H38" stroke="${INK}" stroke-width=".6" opacity=".25"/><rect x="16.8" y="3.6" width="2.6" height="8.8" rx="1" fill="${c}" stroke="${INK}" stroke-width="1"/></svg>`;
/* the hammer (the owner's picture): a big mallet head with rounded corners across the handle's end, a shine along its
   top; a long wooden handle, a little wider at the grip. Colors: head, handle, the band under the head */
const HAMMER = ([a, b, c]) =>
  `<svg viewBox="0 0 56 30"><path d="M3 11.8Q1.4 11.8 1.4 13.6V16.6Q1.4 18.4 3.2 18.3L37 17.6V12.6L3.2 11.8Z" fill="${b}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><path d="M5 13.4L32 13.9" stroke="#fff" stroke-width="1.1" opacity=".3"/><path d="M6 16.8L30 16.4" stroke="${INK}" stroke-width=".7" opacity=".22"/><rect x="33.4" y="11.6" width="4.2" height="7" rx="1" fill="${c}" stroke="${INK}" stroke-width="1.1"/><rect x="37" y="1.4" width="17.4" height="27.2" rx="5.6" fill="${a}" stroke="${INK}" stroke-width="1.4"/><path d="M39.6 7.4Q39.6 4 43 4H45.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".4"/><path d="M40.2 10.4V20" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".22"/><path d="M51.6 6V24.6" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".2"/></svg>`;
/* the grenade: a round pineapple grenade, its body in a grid of rounded lumps with a shine at the top left; the metal cap
   with the lever curving down its right side, and the pin's ring at the left. Colors: body, metal, ring */
export const GRENADE = ([a, b, c]) =>
  `<svg viewBox="0 0 28 28"><ellipse cx="13.6" cy="17.4" rx="8.6" ry="9.4" fill="${a}" stroke="${INK}" stroke-width="1.3"/><g fill="none" stroke="${INK}" stroke-width=".8" opacity=".35"><path d="M5.6 14.4Q13.6 12.4 21.6 14.4M5.4 20.2Q13.6 22.4 21.8 20.2"/><path d="M10.2 8.6Q8.4 17.4 10.2 26.2M17 8.6Q18.8 17.4 17 26.2"/></g><ellipse cx="9.4" cy="12.2" rx="2.4" ry="1.5" fill="#fff" opacity=".35" transform="rotate(-30 9.4 12.2)"/><rect x="10.2" y="5.2" width="7" height="4.4" rx="1.3" fill="${b}" stroke="${INK}" stroke-width="1.1"/><path d="M14.6 5.6Q22.6 4.4 23 11.6L22.6 16.8Q21.2 17.2 21 15.8L21 11.6Q20.8 7.6 15.2 7.8Z" fill="${b}" stroke="${INK}" stroke-width="1.05" stroke-linejoin="round"/><path d="M16.4 6.4Q21 6.2 21.8 10.6" fill="none" stroke="#fff" stroke-width=".7" opacity=".5"/><circle cx="6.6" cy="5.6" r="3" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="6.6" cy="5.6" r="3" fill="none" stroke="${c}" stroke-width="1.2"/><path d="M9.4 6.6L11 7" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/></svg>`;
/* the wrench, after the owner's BioShock picture: an old pipe wrench, its red paint worn through in chips, a sunk panel
   down the handle and a hole at its end; the frame, the hook jaw over the heel jaw (their teeth facing), the knurled nut
   under them, worn metal with rust. Colors: paint, metal, rust */
const WRENCH = ([a, b, c]) => {
  const chip = (x, y, w) =>
    `<path d="M${x} ${y}l${w} -.5l${w * 0.5} ${w * 0.45}l${-w * 0.9} .5Z" fill="#d6cec4" opacity=".55"/>`;
  const rust = (x, y, w) =>
    `<path d="M${x} ${y}q${w * 0.6} -${w * 0.5} ${w} 0q-.2 ${w * 0.5} -${w} ${w * 0.35}Z" fill="${c}" opacity=".7"/>`;
  return `<svg viewBox="0 0 56 28"><path d="M5 12.6Q1.6 12.6 1.6 16Q1.6 19.4 5 19.4L37 18.4V13.6Z" fill="${a}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="5.2" cy="16" r="1.7" fill="#14161c" stroke="${INK}" stroke-width=".8"/><path d="M10 14.5L33.4 14.2V17.8L10 17.5Z" fill="none" stroke="${INK}" stroke-width=".8" opacity=".45"/><path d="M10.6 14.3L33 14" stroke="#fff" stroke-width=".7" opacity=".3"/>${chip(12.5, 16.4, 1.6)}${chip(20, 15.6, 1.1)}${chip(26.5, 17, 1.4)}${chip(31, 15.4, 0.9)}${chip(7.6, 18.6, 1)}
  <path d="M36.4 12.2H43.6V19.8H36.4Z" fill="${b}" stroke="${INK}" stroke-width="1.1"/>
  <rect x="38.4" y="19.4" width="5.4" height="6.6" rx="1.6" fill="${b}" stroke="${INK}" stroke-width="1"/><path d="M38.8 21.6l1.6 -1.8M38.8 24.2l3.6 -4M40.4 25.6l3 -3.4" stroke="${INK}" stroke-width=".6" opacity=".7"/>
  <path d="M39.2 12.4V6Q39.2 1.8 43.4 1.8H50Q54.6 1.8 54.6 6.4V9H50.2V7.2Q50.2 6.2 49.2 6.2H43.8V12.4Z" fill="${b}" stroke="${INK}" stroke-width="1.15" stroke-linejoin="round"/><path d="M44 9H50.2M44 9l.8 1.2l.8 -1.2l.8 1.2l.8 -1.2l.8 1.2l.8 -1.2l.8 1.2l.8 -1.2" fill="none" stroke="${INK}" stroke-width=".7"/>
  <path d="M43.6 13.6H52.8Q54.4 13.6 54.4 15.2V17.6H43.6Z" fill="${b}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M44 13.6l.8 -1.2l.8 1.2l.8 -1.2l.8 1.2l.8 -1.2l.8 1.2l.8 -1.2l.8 1.2" fill="none" stroke="${INK}" stroke-width=".7"/>
  <path d="M40.6 4.6Q41.6 3 43.4 3H49.6" stroke="#fff" stroke-width=".8" opacity=".5" fill="none"/>${rust(51.4, 4.4, 2)}${rust(39.8, 9.4, 1.6)}${rust(37.4, 17.6, 1.8)}${rust(50.6, 16.4, 1.4)}</svg>`;
};
/* a tile's picture: the item turned 45°, its handle down at the left, filling a square */
const iconOf = (svg, k = 1) => {
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/),
    S = w * 0.78 * k;
  return svg
    .replace(/viewBox="[^"]+"/, `viewBox="0 0 ${S.toFixed(1)} ${S.toFixed(1)}"`)
    .replace(
      /^<svg ([^>]*)>/,
      `<svg $1><g transform="translate(${(S / 2).toFixed(1)} ${(S / 2).toFixed(1)}) rotate(-45) translate(${-w / 2} ${-h / 2})">`,
    )
    .replace(/<\/svg>$/, "</g></svg>");
};
/* a duckling, facing right, in its colors (body, beak) */
export const DUCKLING = ([a, b]) =>
  `<svg viewBox="0 0 30 26"><ellipse cx="15" cy="24.6" rx="9" ry="1.6" fill="#0005"/><path d="M4 15c0-5 5-7 10-6l3-1c0-4 3-7 6.5-6.5S29 5 28 9c-.4 2-1.6 3-2.6 3.6C27 16 25 22 16 22 8 22 4 19 4 15Z" fill="${a}" stroke="#3a2a10" stroke-width="1.2" stroke-linejoin="round"/><path d="M27.2 7.6l2.6 1.1-2.9 1.2Z" fill="${b}" stroke="#3a2a10" stroke-width=".8" stroke-linejoin="round"/><circle cx="24.4" cy="6.6" r="1.2" fill="#1c1c28"/><path d="M8 14c3 3 7 3 9 0" fill="none" stroke="#3a2a10" stroke-width="1" opacity=".55"/><path d="M4.6 13.4 1.4 11.6 4.4 16Z" fill="${a}" stroke="#3a2a10" stroke-width=".9" stroke-linejoin="round"/></svg>`;
/* the pump shotgun (Mad God Justin's, and a player's once it's unlocked): a classic pump-action with a short barrel; the wooden stock and pump, the dark
   receiver with its trigger guard, the magazine tube under the barrel and a bead sight at the muzzle */
export const SHOTGUN = `<svg viewBox="0 0 62 20"><path d="M2.6 6.4L15.6 8V13.4L5.6 17.2Q1.4 18.4 1.4 14.8V8.2Q1.4 6.3 2.6 6.4Z" fill="#8a4b2a" stroke="${INK}" stroke-width="1.15" stroke-linejoin="round"/><path d="M1.6 8.4V14.8" stroke="#2b1a10" stroke-width="2.2"/><path d="M5 9.2L14 10.2" stroke="#fff" stroke-width=".8" opacity=".3"/>
<path d="M19.6 12.4Q19.4 16.6 22.6 16.6Q25.6 16.6 25.4 12.4" fill="none" stroke="${INK}" stroke-width="1.1"/><path d="M22.4 12L23.2 15" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>
<rect x="14.6" y="6" width="15.6" height="6.6" rx="1.4" fill="#33384a" stroke="${INK}" stroke-width="1.15"/><path d="M16.4 7.6H28.4" stroke="#fff" stroke-width=".8" opacity=".25"/><rect x="21" y="8.4" width="4.6" height="1.6" rx=".6" fill="#1c1c28" opacity=".55"/>
<rect x="29.4" y="9.6" width="23" height="2.6" rx="1" fill="#2a2e3c" stroke="${INK}" stroke-width="1"/>
<rect x="29.4" y="6" width="30.4" height="3.2" rx="1" fill="#454b5e" stroke="${INK}" stroke-width="1.1"/><path d="M31 6.9H58" stroke="#fff" stroke-width=".7" opacity=".3"/><circle cx="58.4" cy="5.6" r=".9" fill="#ffd23f" stroke="${INK}" stroke-width=".5"/>
<rect x="34.4" y="8.4" width="13.6" height="5.2" rx="1.8" fill="#a0612f" stroke="${INK}" stroke-width="1.1"/>${[37.2, 39.8, 42.4, 45].map((x) => `<path d="M${x} 9.4V12.6" stroke="#5a3218" stroke-width=".8"/>`).join("")}</svg>`;
const P = "Primary",
  S2 = "Secondary",
  A = "Accent";
export const SPECIALS = [
  {
    id: "zap",
    name: "Electricity",
    kind: "effect",
    icon: "⚡",
    tip: "Sparks crackle over your head.",
    colors: [
      ["a", P, "#fff36a"],
      ["b", S2, "#2fa4ff"],
      ["c", A, "#7fd0ff"],
    ],
  },
  {
    id: "flames",
    name: "Flames",
    kind: "effect",
    icon: "🔥",
    tip: "Your head burns with dancing flames.",
    colors: [
      ["a", P, "#ff5a1a"],
      ["b", S2, "#ffb347"],
      ["c", A, "#fff2b0"],
    ],
  },
  {
    id: "hearts",
    name: "Hearts",
    kind: "effect",
    icon: "💕",
    tip: "Hearts float around your head.",
    colors: [["a", P, "#ff4f8b"]],
  },
  {
    id: "poison",
    name: "Poison cloud",
    kind: "effect",
    icon: "☠️",
    tip: "A green cloud swirls around your head.",
    colors: [
      ["a", P, "#8cff6a"],
      ["b", S2, "#3fae2a"],
    ],
  },
  {
    id: "notes",
    name: "Music notes",
    kind: "effect",
    icon: "🎵",
    tip: "Music notes float around your head.",
    colors: [
      ["a", P, "#ffffff"],
      ["b", S2, "#9b5de5"],
    ],
  },
  {
    id: "loserx",
    name: "Loser's X",
    kind: "effect",
    icon: "❌",
    tip: "A big red X over your duck. It also follows you when you lose in Bicker Brackets.",
    colors: [["a", P, "#ef3b3b"]],
  },
  {
    id: "disco",
    name: "Disco ball",
    kind: "effect",
    icon: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#c9ced8" stroke="#3a3d48" stroke-width="1.4"/><g fill="none" stroke="#3a3d48" stroke-width="1" opacity=".6"><ellipse cx="15" cy="15" rx="6" ry="13"/><path d="M2 15h26M4 9h22M4 21h22"/></g><circle cx="10" cy="9" r="2.6" fill="#fff"/><path d="M22 6l1-3 1 3 3 1-3 1-1 3-1-3-3-1Z" fill="#ffe94a"/></svg>',
    tip: "A disco ball spins over your head, its colored lights sweeping over you.",
    colors: [
      ["a", P, "#ff4fd8"],
      ["b", S2, "#3fd0ff"],
      ["c", A, "#ffe94a"],
    ],
  },
  {
    id: "ducklings",
    name: "Ducklings",
    kind: "effect",
    icon: "🐤",
    tip: "Three little ducklings follow you in a row, wherever you walk.",
    colors: [
      ["a", P, "#ffd23f"],
      ["b", S2, "#ff8c2b"],
    ],
  },
  {
    id: "longjump",
    name: "Long jump",
    kind: "jump",
    icon: "🦘",
    tip: "Its key does a long jump: longer and a little higher. Shift and the key: every jump is long.",
  },
  {
    id: "double",
    name: "Double jump",
    kind: "jump",
    icon: "☁️",
    tip: "In the air, its key jumps again off a little cloud, once a jump. Shift and the key: Space does it too.",
    colors: [["a", P, "#ffffff"]],
  },
  {
    id: "coffee",
    name: "Coffee",
    kind: "item",
    icon: "☕",
    tip: "Your duck sips coffee from a mug.",
    colors: [
      ["a", P, "#f4f1ea"],
      ["b", S2, "#6b3e1e"],
    ],
  },
  {
    id: "watergun",
    name: "Water gun",
    kind: "item",
    icon: "💦",
    tip: "Your duck sprays a water gun the way it faces.",
    colors: [
      ["a", P, "#2fa4ff"],
      ["b", S2, "#ffd23f"],
      ["c", A, "#7fd0ff"],
    ],
  },
  {
    id: "hotdog",
    name: "Hotdog",
    kind: "item",
    icon: "🌭",
    tip: "Your duck munches a hotdog, crumbs flying.",
  },
  {
    id: "confgun",
    name: "Confetti gun",
    kind: "item",
    icon: "🎉",
    tip: "A burst of confetti the way your duck faces.",
  },
  {
    id: "handgun",
    name: "Handgun",
    kind: "item",
    icon: "🔫",
    tip: "Bullets fly toward your mouse; any duck one passes through plays dead. Seven shots, then it reloads (R reloads sooner). Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#2b2d35"],
      ["b", S2, "#5a3a22"],
      ["c", A, "#c9a24a"],
    ],
  },
  {
    id: "dagger",
    name: "Dagger",
    kind: "item",
    icon: DAGGER(["#d9dee8", "#6b3e1e", "#c9a24a"]).replace(
      "<svg ",
      '<svg style="transform:rotate(-40deg)" ',
    ),
    tip: "Throw a dagger toward your mouse: it spins in an arc and falls off the screen, and every duck it hits plays dead until it moves. Shift and its key keeps it out: left click throws. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#d9dee8"],
      ["b", S2, "#6b3e1e"],
      ["c", A, "#c9a24a"],
    ],
  },
  {
    id: "knife",
    name: "Knife",
    kind: "item",
    icon: iconOf(KNIFE(["#d9dee8", "#3b2a22", "#c9a24a"])),
    tip: "Stab the duck right in front of you, toward your mouse: it plays dead. Once a second. Shift and its key keeps it out: left click stabs. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#d9dee8"],
      ["b", S2, "#3b2a22"],
      ["c", A, "#c9a24a"],
    ],
  },
  {
    id: "hammer",
    name: "Hammer",
    kind: "item",
    icon: iconOf(HAMMER(["#5f646e", "#c98a3a", "#3a3d48"])),
    tip: "A big swing in front of you, toward your mouse: every duck in it is knocked back and plays dead. Once every 2.25 seconds. Shift and its key keeps it out: left click swings. Its ⚙ makes it a wrench. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#5f646e"],
      ["b", S2, "#c98a3a"],
      ["c", A, "#3a3d48"],
    ],
  },
  {
    id: "shotgun",
    name: "Shotgun",
    kind: "item",
    icon: iconOf(SHOTGUN, 0.82),
    tip: "A blast of pellets in a cone toward your mouse: every duck one hits plays dead. Then a pump before the next. Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  {
    id: "grenade",
    name: "Grenade",
    kind: "item",
    icon: GRENADE(["#5d8a3a", "#a4a8b4", "#c9a24a"]),
    tip: "Throw a grenade toward your mouse: where it lands it blows up, and every duck near it (three ducks across) plays dead, flies off and is burnt for a while. Shift and its key keeps it out: left click throws. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#5d8a3a"],
      ["b", S2, "#a4a8b4"],
      ["c", A, "#c9a24a"],
    ],
  },
  {
    id: "sound",
    name: "Sound",
    kind: "item",
    off: true,
    icon: "🔊",
    tip: "Everyone hears your sound.",
    colors: [["a", P, "#ffffff"]],
  },
  {
    id: "trombone",
    name: "Trombone",
    kind: "item",
    icon: BONE(["#e8b73a", "#fff2b0"]),
    tip: "Your duck plays the trombone. Every note comes out wrong.",
    colors: [
      ["a", P, "#e8b73a"],
      ["b", S2, "#fff2b0"],
    ],
  },
  {
    id: "confetti",
    name: "Confetti rain",
    kind: "item",
    icon: "🎊",
    tip: "Confetti rains over everyone's screen. It also rains when your question comes up, when you win, and on the podium.",
  },
];
export const specialById = (id) => SPECIALS.find((x) => x.id === id) || null;
/* a special that's off for now (faded everywhere, can't be picked or used; a duck that has it keeps it on its key) */
export const isOff = (id) => !!(specialById(id) || {}).off;
export const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]; // the number keys, in the order of the row
/* a duck's ten keys: a special's id or null on each (a duck from before the keys had one special: it is on key 1) */
export function keysOf(duck) {
  const d = duck || {},
    k = Array.isArray(d.keys) ? d.keys : [d.special];
  return KEYS.map((_, i) => (specialById(k[i]) ? k[i] : null));
}
export const hasKey = (duck, id) => keysOf(duck).includes(id);
/* a special's colors on a duck: [Primary, Secondary, Accent], each the duck's own or the special's */
const HEX = /^#[0-9a-f]{3,8}$/i;
export function colorsOf(duck, id) {
  const sp = specialById(id),
    mine = ((duck || {}).spc || {})[id] || {};
  return ((sp && sp.colors) || []).map(([k, , def]) =>
    HEX.test(mine[k]) ? mine[k] : def,
  );
}
const vars = (c) => c.map((v, i) => `--k${i + 1}:${v}`).join(";");

/* an effect around a duck's head (sits over the duck picture; the head is up and to the right) */
export function momentHTML(id, duck) {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i)).join(""),
    st = `style="${vars(colorsOf(duck, id))}"`;
  switch (id) {
    case "zap":
      return `<span class="spx spx-zap" ${st}>${n(3, (i) => `<svg viewBox="0 0 40 60" style="--i:${i}"><path d="M22 0L8 30h12L12 60l22-36H20L30 0Z"/></svg>`)}</span>`;
    case "flames":
      return `<span class="spx spx-flames" ${st}>${n(4, (i) => `<i style="--i:${i}"></i>`)}</span>`;
    case "hearts":
      return `<span class="spx spx-float" ${st}>${n(5, (i) => `<i style="--i:${i}">♥</i>`)}</span>`;
    case "poison":
      return `<span class="spx spx-poison" ${st}>${n(5, (i) => `<i style="--i:${i}"></i>`)}</span>`;
    case "notes":
      return `<span class="spx spx-float spx-notes" ${st}>${n(5, (i) => `<i style="--i:${i}">${"♪♫♩♬♪"[i]}</i>`)}</span>`;
    case "loserx":
      return `<span class="spx spx-x" ${st}><svg viewBox="0 0 40 40"><path d="M8 8L32 32M32 8L8 32"/></svg></span>`;
    case "disco":
      return `<span class="spx spx-disco" ${st}><i class="disco-beams"></i>${n(5, (i) => `<i class="disco-spot" style="--i:${i}"></i>`)}<i class="disco-string"></i><svg class="disco-ball" viewBox="0 0 30 30"><defs><radialGradient id="dball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9ced8"/><stop offset="1" stop-color="#6c7280"/></radialGradient></defs><circle cx="15" cy="15" r="13" fill="url(#dball)" stroke="#3a3d48" stroke-width="1"/><g fill="none" stroke="#3a3d48" stroke-width=".7" opacity=".55"><ellipse cx="15" cy="15" rx="6" ry="13"/><ellipse cx="15" cy="15" rx="11" ry="13"/><path d="M2 15h26M4 9h22M4 21h22M8 4.2h14M8 25.8h14"/></g><circle cx="10" cy="9" r="2.2" fill="#fff" opacity=".9"/></svg></span>`;
    case "ducklings":
      return `<span class="spx spx-ducklings" ${st}>${n(3, (i) => `<i style="--i:${i}">${DUCKLING(colorsOf(duck, id))}</i>`)}</span>`; // (a still row, for the menus; on the board they follow their duck's path)
    default:
      return "";
  }
}

/* confetti over the whole screen for a few seconds (a few dozen pieces, then gone) */
export function confettiRain(ms = 5000) {
  if (
    document.documentElement.classList.contains("lite") ||
    document.querySelector(".confetti-rain")
  )
    return;
  const colors = [
    "#ef3b3b",
    "#ffd23f",
    "#37d421",
    "#2fa4ff",
    "#9b5de5",
    "#ff7eb6",
    "#ff8c2b",
  ];
  const node = el(
    `<div class="confetti-rain" aria-hidden="true">${Array.from(
      { length: fewer(42) },
      (_, i) =>
        `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 1.6).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 1.6).toFixed(2)}s;--r:${Math.round(Math.random() * 720 - 360)}deg"></i>`,
    ).join("")}</div>`,
  );
  document.body.appendChild(node);
  setTimeout(() => node.remove(), ms);
}

/* the double jump's little cloud, left in the air where the second jump began: x, y = the duck's feet in pixels */
export function puffHTML(x, y, size, color) {
  return `<div class="spe spe-puff" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--s:${size.toFixed(0)}px;--k1:${color}"><svg viewBox="0 0 60 30"><g><circle cx="16" cy="18" r="10"/><circle cx="30" cy="13" r="12"/><circle cx="44" cy="18" r="10"/><rect x="14" y="16" width="32" height="12" rx="6"/></g></svg></div>`;
}

/* an item's moment, at a duck: x, y = its feet in pixels, size = the duck's size, face = 1 right or -1 left, duck = its
   look (for the item's colors) */
const MUG = ([a, b]) =>
  `<svg viewBox="0 0 30 30"><path d="M5 9h16v13a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" fill="${a}" stroke="#1c1c28" stroke-width="1.6"/><path d="M21 12h3a3.5 3.5 0 0 1 0 7h-3" fill="none" stroke="#1c1c28" stroke-width="1.6"/><path d="M6.5 11h13" stroke="${b}" stroke-width="2.4"/><path d="M9 4c1 2-1 3 0 5M13 3c1 2-1 3 0 5M17 4c1 2-1 3 0 5" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/></svg>`;
const WGUN = ([a, b]) =>
  `<svg viewBox="0 0 40 24"><path d="M4 8h24l4-3h5v8h-5l-2 2H18l-2 7h-6l2-7H4Z" fill="${a}" stroke="#1c1c28" stroke-width="1.5" stroke-linejoin="round"/><rect x="12" y="2" width="9" height="6" rx="2" fill="${b}" stroke="#1c1c28" stroke-width="1.3"/></svg>`;
const PISTOL = ([a, b]) =>
  `<svg viewBox="0 0 40 24"><path d="M17 11l-2 10H8l2-10Z" fill="${b}" stroke="#0e0e14" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 5h30v6H4Z" fill="${a}" stroke="#0e0e14" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 11l4 4" stroke="#0e0e14" stroke-width="1.4"/></svg>`;
const DOG =
  '<svg viewBox="0 0 40 20"><rect x="2" y="5" width="36" height="10" rx="5" fill="#eab36a" stroke="#1c1c28" stroke-width="1.4"/><rect x="5" y="7" width="30" height="6" rx="3" fill="#c0502b"/><path d="M7 9l3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2" stroke="#ffd23f" stroke-width="1.4" fill="none"/></svg>';
export function pressFX(id, x, y, size, face, duck) {
  const head = { x: x + face * size * 0.2, y: y - size * 0.72 },
    beak = { x: x + face * size * 0.38, y: y - size * 0.6 },
    out = [],
    c = colorsOf(duck, id);
  const at = (cls, html, px, py, extra = "") =>
    el(
      `<div class="spe ${cls}" style="left:${px.toFixed(0)}px;top:${py.toFixed(0)}px;--f:${face};--s:${size.toFixed(0)}px;${extra}">${html}</div>`,
    );
  if (id === "coffee")
    out.push(
      at("spe-mug", MUG(c), head.x + face * size * 0.28, head.y + size * 0.08),
    );
  if (id === "hotdog") {
    out.push(
      at("spe-dog", DOG, head.x + face * size * 0.3, head.y + size * 0.12),
    );
    for (let i = 0, n = fewer(6); i < n; i++)
      out.push(
        at(
          "spe-crumb",
          "",
          head.x + face * size * 0.3,
          head.y + size * 0.15,
          `--dx:${(Math.random() * 60 - 30).toFixed(0)}px;--dy:${(20 + Math.random() * 30).toFixed(0)}px;animation-delay:${(i * 0.18).toFixed(2)}s`,
        ),
      );
  }
  if (id === "watergun") {
    out.push(at("spe-gun", WGUN(c), x + face * size * 0.45, y - size * 0.38));
    for (let i = 0, n = fewer(14); i < n; i++)
      out.push(
        at(
          "spe-drop",
          "",
          x + face * size * 0.75,
          y - size * 0.43,
          `--dx:${(face * (90 + Math.random() * 120)).toFixed(0)}px;--dy:${(Math.random() * 40 - 10).toFixed(0)}px;animation-delay:${(i * 0.05).toFixed(2)}s;--k1:${c[2]}`,
        ),
      );
  }
  if (id === "confgun") {
    const colors = [
      "#ef3b3b",
      "#ffd23f",
      "#37d421",
      "#2fa4ff",
      "#9b5de5",
      "#ff7eb6",
    ];
    for (let i = 0, n = fewer(22); i < n; i++)
      out.push(
        at(
          "spe-conf",
          "",
          x + face * size * 0.42,
          y - size * 0.28,
          `background:${colors[i % 6]};--dx:${(face * (40 + Math.random() * 140)).toFixed(0)}px;--dy:${(-Math.random() * 120 + 20).toFixed(0)}px;--r:${Math.round(Math.random() * 540)}deg`,
        ),
      );
  }
  if (id === "handgun")
    out.push(
      at(
        "spe-gun spe-pistol",
        PISTOL(c),
        x + face * size * 0.45,
        y - size * 0.38,
      ),
    );
  if (id === "sound")
    for (let i = 0; i < 3; i++)
      out.push(
        at(
          "spe-ring",
          "",
          beak.x,
          beak.y,
          `animation-delay:${(i * 0.25).toFixed(2)}s;--k1:${c[0]}`,
        ),
      );
  if (id === "trombone") {
    // the mouthpiece at the beak's tip; a sour note wobbles out of the bell
    out.push(at("spe-bone", BONE(c), x + face * size * 0.44, y - size * 0.58));
    for (let i = 0; i < 3; i++)
      out.push(
        at(
          "spe-sour",
          "♪",
          x + face * size * 0.78,
          y - size * 0.78,
          `animation-delay:${(0.15 + i * 0.3).toFixed(2)}s;--dx:${(face * (18 + i * 10)).toFixed(0)}px`,
        ),
      );
  }
  return out;
}
/* a weapon in a duck's hand, pointing right (the game turns it toward where it aims); the hammer is a wrench on a duck
   that picked the wrench (its ⚙ under Customize → Specials: duck.wrench) */
const WRENCH_COLORS = ["#a8322a", "#a4a8ad", "#7a4a2e"]; // (the BioShock wrench keeps its own colors)
export function heldHTML(id, duck) {
  if (id === "shotgun") return SHOTGUN;
  const c = colorsOf(duck, id);
  return id === "grenade"
    ? GRENADE(c)
    : id === "dagger"
      ? DAGGER(c)
      : id === "knife"
        ? KNIFE(c)
        : id === "hammer"
          ? (duck || {}).wrench
            ? WRENCH(WRENCH_COLORS)
            : HAMMER(c)
          : PISTOL(c);
}
/* a special as this duck shows it: the hammer is "Wrench", with its picture, on a duck that picked the wrench */
const WRENCH_ICON = iconOf(WRENCH(WRENCH_COLORS));
export const looksOf = (sp, duck) =>
  sp && sp.id === "hammer" && duck && duck.wrench
    ? { ...sp, name: "Wrench", icon: WRENCH_ICON }
    : sp;
/* the handgun's magazine under its key: a dot for each of its seven shots, full until fired */
export const ammoHTML = (left, n = 7) =>
  `<span class="ammo" aria-label="${left} of ${n} shots">${Array.from({ length: n }, (_, i) => `<i${i < left ? ' class="full"' : ""}></i>`).join("")}</span>`;
export const daggerHTML = (duck) => DAGGER(colorsOf(duck, "dagger"));
/* the handgun's bullet, in the shooter's Accent color */
export const BULLET = (c = "#c9a24a") =>
  `<svg viewBox="0 0 24 10"><path d="M2 5h14" stroke="#ffd84a" stroke-width="2" opacity=".6"/><path d="M14 2h5a3 3 0 0 1 0 6h-5Z" fill="${c}" stroke="#5a4310" stroke-width="1"/></svg>`;
