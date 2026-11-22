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
import {
  AXE,
  BOW,
  CHAIR,
  DAGGER,
  GRENADE,
  GUNS,
  gwOf,
  HAMMER,
  iconOf,
  KNIFE,
  MEDKIT,
  PAN,
  PISTOL,
  SHOTGUN,
  SWORD,
  WRENCH,
  ZEBRA,
} from "./gunart.js";
import { HANDGUN } from "./gamedefaults.js";
import { nameOf } from "./guns.js";
import { el } from "./ui.js";
import { gridPx, pxSVG, rasterReady, pixelOn } from "./pixel.js";
import { hashText } from "./pxdom.js";
import { fewer } from "./gfx.js";
import { duckSVG, DUCK_DEFAULT } from "./duck.js";
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
/* a duckling, facing right, in its colors (body, beak) */
export const DUCKLING = ([a, b]) =>
  `<svg viewBox="0 0 30 26"><ellipse cx="15" cy="24.6" rx="9" ry="1.6" fill="#0005"/><path d="M4 15c0-5 5-7 10-6l3-1c0-4 3-7 6.5-6.5S29 5 28 9c-.4 2-1.6 3-2.6 3.6C27 16 25 22 16 22 8 22 4 19 4 15Z" fill="${a}" stroke="#3a2a10" stroke-width="1.2" stroke-linejoin="round"/><path d="M27.2 7.6l2.6 1.1-2.9 1.2Z" fill="${b}" stroke="#3a2a10" stroke-width=".8" stroke-linejoin="round"/><circle cx="24.4" cy="6.6" r="1.2" fill="#1c1c28"/><path d="M8 14c3 3 7 3 9 0" fill="none" stroke="#3a2a10" stroke-width="1" opacity=".55"/><path d="M4.6 13.4 1.4 11.6 4.4 16Z" fill="${a}" stroke="#3a2a10" stroke-width=".9" stroke-linejoin="round"/></svg>`;
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
    id: "invisible",
    name: "Invisible duck",
    kind: "effect",
    get icon() {
      return `<span class="sp-see">${duckSVG(DUCK_DEFAULT, { size: 40, shadow: false })}</span>`;
    }, // (a see-through duck, as the shadow duck; made when it's asked for, so duck.js is ready)
    tip: "Its key turns your duck see-through, like the shadow duck; press it again to turn it back.",
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
    name: HANDGUN.name, // (one gun everywhere: gamedefaults.js)
    kind: "item",
    get icon() {
      return PISTOL(["#2b2d35", "#5a3a22"]); // (the pistol in the hand, not the emoji: the owner's, Nov 19; looksOf paints it in my colors)
    },
    tip: "Bullets fly toward your mouse; any duck one passes through plays dead. Nine shots, then it reloads (R reloads sooner). Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#2b2d35"],
      ["b", S2, "#5a3a22"],
      ["c", A, "#c9a24a"],
    ],
  },
  {
    id: "dagger",
    name: nameOf("dagger", "board"),
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
    name: nameOf("knife", "board"),
    kind: "item",
    icon: iconOf(KNIFE(["#d9dee8", "#3b2a22", "#c9a24a"])),
    tip: "Stab the duck right in front of you, toward your mouse: it plays dead. Four times a second. Shift and its key keeps it out: left click stabs. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#d9dee8"],
      ["b", S2, "#3b2a22"],
      ["c", A, "#c9a24a"],
    ],
  },
  {
    id: "axe",
    name: nameOf("axe", "board"),
    kind: "item",
    icon: iconOf(AXE(["#c62f2f", "#b8864e", "#c9ced8"])),
    tip: "A big swing in front of you, toward your mouse: 1 to 4 damage to every duck in it. A little faster than the hammer. Shift and its key keeps it out: left click swings. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#c62f2f"],
      ["b", S2, "#b8864e"],
      ["c", A, "#c9ced8"],
    ],
  },
  {
    id: "sword",
    name: nameOf("sword", "board"),
    kind: "item",
    icon: iconOf(SWORD(["#d9dee8", "#5a3a26", "#c9a24a"])),
    tip: "A quick short swing in front of you, toward your mouse: 1 damage to every duck in it. Faster than the knife. Shift and its key keeps it out: left click swings. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#d9dee8"],
      ["b", S2, "#5a3a26"],
      ["c", A, "#c9a24a"],
    ],
  },
  {
    id: "pan",
    name: nameOf("pan", "board"),
    kind: "item",
    icon: iconOf(PAN(["#2b2d33", "#1c1d22", "#6a6f7c"])),
    tip: "A short heavy swing in front of you, toward your mouse: it misses half the time, but half its hits are critical. 1 damage. Shift and its key keeps it out: left click swings. (Off when the host turns off the silly commands.)",
    colors: [
      ["a", P, "#2b2d33"],
      ["b", S2, "#1c1d22"],
      ["c", A, "#6a6f7c"],
    ],
  },
  {
    id: "hammer",
    name: nameOf("hammer", "board"),
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
    name: nameOf("shotgun", "board"),
    kind: "item",
    icon: iconOf(SHOTGUN, 0.82),
    tip: "A blast of pellets in a cone toward your mouse: every duck one hits plays dead. Then a pump before the next. Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  {
    id: "grenade",
    name: nameOf("grenade", "board"),
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
    id: "bow",
    name: nameOf("bow", "board"),
    kind: "item",
    icon: iconOf(BOW, 1.2),
    tip: "An arrow flies straight toward your mouse, fast: any duck it hits plays dead. One every 0.4 seconds. Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  /* Quacky Zombies' guns, in every mode (the owner's, Nov 4 07:43Z): locked until the owner says how they unlock
     (unlocks.js) */
  {
    id: "sniper",
    name: nameOf("sniper", "board"),
    kind: "item",
    get icon() {
      return GUNS.sniper.icon;
    },
    tip: "A fast bullet toward your mouse that goes through every duck in its way, and takes 2 or 3 HP from each. Five shots, then it reloads (R reloads sooner). Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  {
    id: "smg",
    name: nameOf("smg", "board"),
    kind: "item",
    get icon() {
      return GUNS.smg.icon;
    },
    tip: "Fires toward your mouse as long as the button is down. 20 shots, then it reloads (R reloads sooner). Shift and its key keeps it out: hold the left button. (Off when the host turns off the silly commands.)",
  },
  {
    id: "tommy",
    name: nameOf("tommy", "board"),
    kind: "item",
    get icon() {
      return GUNS.tommy.icon;
    },
    tip: "Fires toward your mouse as long as the button is down. A 50-round drum, then it reloads (R reloads sooner). Shift and its key keeps it out: hold the left button. (Off when the host turns off the silly commands.)",
  },
  {
    id: "ump",
    name: nameOf("ump", "board"),
    kind: "item",
    get icon() {
      return GUNS.ump.icon;
    },
    tip: "Fires toward your mouse as long as the button is down, 2 HP a bullet, a little slower than the Tommy gun. 20 shots, then it reloads (R reloads sooner). Shift and its key keeps it out: hold the left button. (Off when the host turns off the silly commands.)",
  },
  {
    id: "ak",
    name: nameOf("ak", "board"),
    kind: "item",
    get icon() {
      return GUNS.ak.icon;
    },
    tip: "Fires toward your mouse as long as the button is down, 2 HP a bullet. 30 shots, then it reloads (R reloads sooner). Shift and its key keeps it out: hold the left button. (Off when the host turns off the silly commands.)",
  },
  {
    id: "revolver",
    name: nameOf("revolver", "board"),
    kind: "item",
    get icon() {
      return GUNS.revolver.icon;
    },
    tip: "A bullet toward your mouse, 2 HP a shot. Five in its cylinder, then it reloads (R reloads sooner). Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  {
    id: "lmg",
    name: nameOf("lmg", "board"),
    kind: "item",
    get icon() {
      return GUNS.lmg.icon;
    },
    tip: "Fires toward your mouse as long as the button is down. 75 shots, then a long reload (R reloads sooner). Shift and its key keeps it out: hold the left button. (Off when the host turns off the silly commands.)",
  },
  {
    id: "dbarrel",
    name: nameOf("dbarrel", "board"),
    kind: "item",
    get icon() {
      return GUNS.dbarrel.icon;
    },
    tip: "A slug toward your mouse that takes all the HP of every duck in its way and throws them back. Two shells, then a second to load each (R reloads sooner). Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  {
    id: "flamer",
    name: nameOf("flamer", "board"),
    kind: "item",
    get icon() {
      return GUNS.flamer.icon;
    },
    tip: "Fire toward your mouse as long as the button is down, reaching farther the longer you hold it. Every duck in it burns (1 HP a second), and the ground it hits burns for 5 seconds. Its tank lasts 50 seconds, then it fills again. Shift and its key keeps it out: hold the left button. (Off when the host turns off the silly commands.)",
  },
  {
    id: "burst",
    name: nameOf("burst", "board"),
    kind: "item",
    get icon() {
      return GUNS.burst.icon;
    },
    tip: "Three bullets toward your mouse with each click, 2 HP a bullet. 21 in its clip, then it reloads (R reloads sooner). Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  {
    id: "glauncher",
    name: nameOf("glauncher", "board"),
    kind: "item",
    get icon() {
      return GUNS.glauncher.icon;
    },
    tip: "A grenade flies straight toward your mouse and goes off on the first duck it gets to, or at its range, as a grenade does. Three, then it reloads (R reloads sooner). Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)",
  },
  {
    id: "chair",
    name: nameOf("chair", "board"),
    kind: "item",
    icon: CHAIR.replace("<svg ", '<svg class="sp-chair" '), // (upright, as he throws it; a light edge so it shows on the dark keys)
    tip: "Throw Justin's office chair toward your mouse: it rolls along slowly, and every duck it hits plays dead and is shoved back. Once every 15 seconds. (Off when the host turns off the silly commands.)",
  },
  {
    id: "zebra",
    name: nameOf("zebra", "board"),
    kind: "item",
    icon: ZEBRA,
    tip: "Throw a zebra cake toward your mouse: Justin runs after it and eats it, and does nothing else meanwhile. Once every 30 seconds. (In Mad God Justin everyone shares one.)",
  },
  /* Quacky Zombies' own (never in Customize; Mad God Justin's is gone, the owner's, Nov 3): the medkit, here for its
     picture (the zebra cake is everyone's too, above) */
  {
    id: "medkit",
    name: nameOf("medkit", "board"),
    kind: "item",
    only: "l4dd",
    icon: MEDKIT,
    tip: "Gets your HP back.",
  },
  {
    id: "laser",
    name: nameOf("laser", "board"),
    kind: "item",
    only: "mgj", // (never a duck's own special: Dead Ducks Arcade's weapon spin gives it, and Mad God Justin's pickups)
    get icon() {
      return GUNS.laser.icon;
    },
    tip: "A red beam once a second through everything in its line, as long as the button is down. Never runs out, but six in a row overheat it for 8 seconds.",
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
/* a special's colors: [Primary, Secondary, Accent], the special's own. Specials aren't colored any more (the owner's,
   Nov 20 21:38Z): a duck's old colors for them (duck.spc) are left as they are and no longer shown */
export function colorsOf(duck, id) {
  const sp = specialById(id);
  return ((sp && sp.colors) || []).map(([, , def]) => def);
}
const vars = (c) => c.map((v, i) => `--k${i + 1}:${v}`).join(";");

/* ---------- the flames special, drawn by code in pixels of the grid's size ----------
   Four tongues of fire over the duck's head, side by side, each flickering taller and shorter (0.34 s, one after
   another): white-hot (Accent) at their foot, then Secondary, then Primary, fading out at their edge. Every canvas of
   them on the page is drawn again 30 times a second while one is there (Animations off: once). */
const FL_DEF = ["#ff5a1a", "#ffb347", "#fff2b0"];
const hexRGB = (c) => {
  const x = document.createElement("canvas").getContext("2d");
  x.fillStyle = c;
  const v = x.fillStyle; // (#rrggbb, or rgba() for a see-through one)
  return v.startsWith("#")
    ? [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16))
    : v
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number);
};
let flTimer = 0;
function flamesGo() {
  if (!flTimer) flTimer = requestAnimationFrame(flamesTick);
}
let flLast = 0;
function flamesTick(now) {
  flTimer = 0;
  const all = document.querySelectorAll("canvas.spx-fl");
  if (!all.length) return;
  const moving = document.documentElement.classList.contains("moving");
  if (now - flLast >= 33 || !moving) {
    flLast = now;
    all.forEach((c) => flamesDraw(c, moving ? now / 1000 : 0));
  }
  if (moving) flTimer = requestAnimationFrame(flamesTick);
  else setTimeout(flamesGo, 500); // (still: looked at now and then, for a new one)
}
const flEase = (p) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2); // (near enough css's ease-in-out)
function flamesDraw(c, t) {
  const g = gridPx() || 2,
    box = c.parentNode,
    W = Math.max(1, Math.round(box.clientWidth / g)),
    H = Math.max(1, Math.round(box.clientHeight / g));
  if (c.width !== W || c.height !== H) {
    c.width = W;
    c.height = H;
  }
  if (!c._ink) {
    const cs = getComputedStyle(box);
    c._ink = [1, 2, 3].map((k) =>
      hexRGB(cs.getPropertyValue("--k" + k).trim() || FL_DEF[k - 1]),
    );
  }
  const [k1, k2, k3] = c._ink,
    x = c.getContext("2d"),
    img = x.createImageData(W, H),
    d = img.data;
  for (let i = 0; i < 4; i++) {
    /* its box (css: left 24% + 9% each, 17% wide, 42% tall, its foot at the middle) and its flicker */
    let u = ((((t - i * 0.09) / 0.34) % 2) + 2) % 2;
    if (u > 1) u = 2 - u;
    const e = flEase(u),
      sy = 0.85 + 0.27 * e,
      ty = 0.04 - 0.1 * e,
      fw = 0.17 * W,
      fh0 = 0.42 * H,
      fh = fh0 * sy,
      cy = 0.5 * H - fh0 / 2 + ty * fh0, // (its middle: scaled round it, then moved)
      x0 = (0.24 + 0.09 * i) * W,
      y0 = cy - fh / 2;
    for (let py = Math.max(0, Math.floor(y0)); py < Math.min(H, y0 + fh); py++)
      for (
        let px = Math.max(0, Math.floor(x0));
        px < Math.min(W, x0 + fw);
        px++
      ) {
        const a = (px + 0.5 - x0) / fw,
          b = (py + 0.5 - y0) / fh; // (0 … 1 across it and down it)
        /* its rounded outline (border-radius 50% 50% 45% 45% / 60% 60% 40% 40%) */
        const rx = b < 0.5 ? 0.5 : 0.45,
          ry = b < 0.5 ? 0.6 : 0.4,
          ex = a < rx ? rx - a : a > 1 - rx ? a - (1 - rx) : 0,
          ey = b < ry ? ry - b : b > 1 - ry ? b - (1 - ry) : 0;
        if (ex && ey && (ex / rx) ** 2 + (ey / ry) ** 2 > 1) continue;
        /* its colors, from 50% 70% outward (ellipse to the farthest corner) */
        const f = Math.hypot((a - 0.5) / 0.5, (b - 0.7) / 0.7) / Math.SQRT2;
        if (f >= 0.75) continue;
        const [A, B, q, al] =
          f < 0.35
            ? [k3, k2, f / 0.35, 1]
            : f < 0.65
              ? [k2, k1, (f - 0.35) / 0.3, 1]
              : [k1, k1, 0, 1 - (f - 0.65) / 0.1];
        const o = (py * W + px) * 4,
          na = al * 255;
        if (na <= d[o + 3]) continue; // (where two meet, the brighter one)
        d[o] = A[0] + (B[0] - A[0]) * q;
        d[o + 1] = A[1] + (B[1] - A[1]) * q;
        d[o + 2] = A[2] + (B[2] - A[2]) * q;
        d[o + 3] = na;
      }
  }
  x.putImageData(img, 0, 0);
}

/* an effect around a duck's head (sits over the duck picture; the head is up and to the right) */
export function momentHTML(id, duck) {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i)).join(""),
    st = `style="${vars(colorsOf(duck, id))}"`;
  switch (id) {
    case "zap":
      return `<span class="spx spx-zap" ${st}>${n(3, (i) => `<svg viewBox="0 0 40 60" style="--i:${i}"><path d="M22 0L8 30h12L12 60l22-36H20L30 0Z"/></svg>`)}</span>`;
    case "flames":
      flamesGo();
      return `<span class="spx spx-flames" ${st}><canvas class="spx-fl" aria-hidden="true"></canvas></span>`; // (drawn by code as pixels: flamesDraw)
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

/* a little see-through cloud (the chalk's eraser): x, y = the duck's feet in pixels */
export function puffHTML(x, y, size, color) {
  return `<div class="spe spe-puff" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--s:${size.toFixed(0)}px;--k1:${color}"><svg viewBox="0 0 60 30"><g><circle cx="16" cy="18" r="10"/><circle cx="30" cy="13" r="12"/><circle cx="44" cy="18" r="10"/><rect x="14" y="16" width="32" height="12" rx="6"/></g></svg></div>`;
}

/* an item's moment, at a duck: x, y = its feet in pixels, size = the duck's size, face = 1 right or -1 left, duck = its
   look (for the item's colors) */
const MUG = ([a, b]) =>
  `<svg viewBox="0 0 30 30"><path d="M5 9h16v13a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" fill="${a}" stroke="#1c1c28" stroke-width="1.6"/><path d="M21 12h3a3.5 3.5 0 0 1 0 7h-3" fill="none" stroke="#1c1c28" stroke-width="1.6"/><path d="M6.5 11h13" stroke="${b}" stroke-width="2.4"/><path d="M9 4c1 2-1 3 0 5M13 3c1 2-1 3 0 5M17 4c1 2-1 3 0 5" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/></svg>`;
const WGUN = ([a, b]) =>
  `<svg viewBox="0 0 40 24"><path d="M4 8h24l4-3h5v8h-5l-2 2H18l-2 7h-6l2-7H4Z" fill="${a}" stroke="#1c1c28" stroke-width="1.5" stroke-linejoin="round"/><rect x="12" y="2" width="9" height="6" rx="2" fill="${b}" stroke="#1c1c28" stroke-width="1.3"/></svg>`;
/* the Angelic default pistol (the owner's, Nov 16): two pistols, one in each hand, the far one a little behind and
   up, darker. Set further apart (the owner, Nov 17): the far one's muzzle at DUAL.far, the near one's at DUAL.near (in
   its viewBox, DUAL.box), so each gets its own laser sight (game.js). As wide in the hand as DUAL.w duck sizes (one
   pistol is 0.34) */
export const DUAL = { box: [48, 42], far: [42, 8], near: [34, 26], w: 0.56 };
export function dualPistolHTML(duck) {
  const c = colorsOf(duck, "handgun"),
    one = PISTOL(c).replace(/^<svg[^>]*>|<\/svg>$/g, "");
  return `<svg viewBox="0 0 48 42"><defs><filter id="dual-far"><feComponentTransfer><feFuncR type="linear" slope=".62"/><feFuncG type="linear" slope=".62"/><feFuncB type="linear" slope=".62"/></feComponentTransfer></filter></defs><g transform="translate(8 0)" filter="url(#dual-far)">${one}</g><g transform="translate(0 18)">${one}</g></svg>`;
}
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
/* a weapon in a duck's hand as the game shows it (game.js) and Customize's preview does (customize.js), one code for
   both (the owner's, Nov 20 21:38Z: some previews were small or wrong): size, the duck's size in css px; a gun as long
   as its gunart.js w (--gw, css .held i). cls, attrs and style go on the box; art in place of its own picture */
export function heldBoxHTML(
  w,
  duck,
  size,
  { cls = "", attrs = "", style = "", art } = {},
) {
  return `<div class="held${cls}" data-w="${w}"${attrs} style="--s:${Math.round(size)}px;--gw:${gwOf(w)}${style}"><i>${art ?? heldHTML(w, duck)}</i></div>`;
}
/* a weapon in a hand as one picture made into pixels (pixel.js pxSVG), its duck `size` css px (heldBoxHTML's --s): the
   same weapon, colors and size are one picture, made once, and warmHeld makes it while the game loads. As a drawing on
   the page pxdom.js made it the moment it was first held, mid-game (the owner's, Nov 20 20:46Z: "pop-ins") */
const heldW = (w, size) => Math.round(size) * gwOf(w);
function sizedSVG(svg) {
  const head = svg.slice(0, svg.indexOf(">")),
    vb = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(head);
  if (/\swidth=/.test(head) || !vb) return svg;
  return svg.replace(
    "<svg ",
    `<svg${/\sxmlns=/.test(head) ? "" : ' xmlns="http://www.w3.org/2000/svg"'} width="${vb[1]}" height="${vb[2]}" `,
  ); // (a size of its own: pxSVG takes its shape from it, and Firefox won't draw an SVG with none)
}
export const heldPicHTML = (w, duck, size) =>
  pixelOn()
    ? pxSVG(sizedSVG(heldHTML(w, duck)), heldW(w, size))
    : heldHTML(w, duck);
function warmHeld(w, duck, size) {
  if (!pixelOn()) return;
  const svg = sizedSVG(heldHTML(w, duck)),
    head = svg.slice(0, svg.indexOf(">")),
    W = +(/\swidth="([\d.]+)"/.exec(head) || [])[1] || 1,
    H = +(/\sheight="([\d.]+)"/.exec(head) || [])[1] || W,
    pw = heldW(w, size);
  rasterReady("s" + hashText(svg), svg, pw, (pw * H) / W); // (pxSVG's key)
}
/* the guns a hand can hold in a world (Duck Cabin, Downpour), as pixels while it loads (warmHeld): the pistol in each
   duck's own colors and in the plain ones (a computer squad member's), and every gun picked up, the same for everyone;
   once for each size and set of ducks */
const handsWarm = new Set();
export function warmHands(s, size) {
  const k = size + "|" + s.seat.join();
  if (!pixelOn() || handsWarm.has(k)) return;
  handsWarm.add(k);
  const guns = Object.keys(GUNS).filter(
    (w) => typeof GUNS[w].held === "string",
  );
  for (const id of [null, ...s.seat]) {
    const duck = id && s.players[id] ? s.players[id].duck : null;
    warmHeld("handgun", duck, size);
    if (!id) for (const w of guns) warmHeld(w, null, size);
  }
}
/* a weapon in a duck's hand, pointing right (the game turns it toward where it aims); the hammer is a wrench on a duck
   that picked the wrench (its ⚙ under Customize → Specials: duck.wrench) */
const WRENCH_COLORS = ["#a8322a", "#a4a8ad", "#7a4a2e"]; // (the BioShock wrench keeps its own colors)
export function heldHTML(id, duck) {
  if (id === "shotgun") return SHOTGUN;
  if (id === "bow") return BOW;
  if (id === "medkit") return MEDKIT;
  if (GUNS[id]) return GUNS[id].held; // (Quacky Zombies' new guns)
  if (id === "zebra") return ZEBRA;
  if (id === "chair") return CHAIR; // (Quacky Zombies: the chair from the fireplace, held out before it's thrown)
  const c = colorsOf(duck, id);
  if (id === "axe") return AXE(c);
  if (id === "sword") return SWORD(c);
  if (id === "pan") return PAN(c);
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
    : sp && sp.id === "handgun" && duck
      ? { ...sp, icon: pistolIcon(duck) } // (the pistol as the one in my hand, in my colors, wherever it's shown)
      : sp;
/* the pistol in a hotbar: drawn as the one in my duck's hand, in my colors (the owner, Nov 17 12:28Z: "the pistol in
   the hotbar should resemble the pistol in the hand of the player, so it shouldnt be green"), never the emoji */
export const pistolIcon = (duck) => PISTOL(colorsOf(duck, "handgun"));
/* the handgun's magazine under its key: a dot for each of its seven shots, full until fired */
export const ammoHTML = (left, n = HANDGUN.mag) =>
  `<span class="ammo" aria-label="${left} of ${n} shots">${Array.from({ length: n }, (_, i) => `<i${i < left ? ' class="full"' : ""}></i>`).join("")}</span>`;
export const daggerHTML = (duck) => DAGGER(colorsOf(duck, "dagger"));
