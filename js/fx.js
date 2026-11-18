/* ---------- the effects, drawn as pixels (owner, Nov 16: "we are doing it by pixels now instead of making pictures that
   convert to pixels, since that is more simple and less things can go wrong") ----------
   Blood (drops, chunks, the splats they leave), gun smoke, muzzle flashes and laser sights, one square of the pixel grid
   each (pixel.js gridPx), on one small canvas over the board: as many pixels as the grid has squares, shown scaled up
   and sharp. Every particle lives in a fixed pool (typed arrays, nothing made or thrown away while playing); with
   none alive and no laser, nothing is drawn at all.
   Places are the board's css px. In Hangout and Dead Ducks Arcade the camera moves: game.js tells me where the
   world's corner is on the screen each frame (fxOrigin), and every particle keeps its place in the world. */
import { gridPx } from "./pixel.js";
import { applyPalette } from "./pixelpalette.js";
import { sfx } from "./sound.js";

const NONE = 255;
const MAX = 2000, // (particles at most: the oldest give way; on Low graphics half of them, LOW_MAX)
  LOW_MAX = 1000,
  DROP = 1,
  CHUNK = 2,
  SPLAT = 3,
  SMOKE = 4,
  FLASH = 5,
  FIRE = 6, // (the flamethrower's: a flame pixel flying out, cooling from white to red as it goes)
  SPARK = 7; // (the Angel machine's: a spark thrown up, falling, gone where it lands)
const X = new Float32Array(MAX),
  Y = new Float32Array(MAX),
  Z = new Float32Array(MAX),
  VX = new Float32Array(MAX),
  VY = new Float32Array(MAX),
  VZ = new Float32Array(MAX),
  BORN = new Float64Array(MAX),
  LIFE = new Float32Array(MAX), // (ms; 0: free)
  KIND = new Uint8Array(MAX),
  COL = new Uint8Array(MAX),
  FL = new Uint8Array(MAX).fill(NONE), // (a chunk of a duck: the blood on it, a color of INK; NONE: plain)
  SIZE = new Uint8Array(MAX);
let next = 0,
  alive = 0;

/* the colors, all from the game's palette (pixelpalette.js) */
const INK = [
  "#c7282a", // 0 blood
  "#99163b", // 1 blood, darker
  "#820a17", // 2 blood, darkest
  "#4c0110", // 3 a chunk's inside
  "#f92726", // 4 a fresh drop, bright
  "#849097", // 5 smoke
  "#565d77", // 6 smoke, darker
  "#d6ccd8", // 7 smoke, light
  "#ffffff", // 8 flash, hot
  "#fcdb4e", // 9 flash
  "#fe8508", // 10 flash, edge
  "#ee2e64", // 11 a laser
  "#ffffff", // 12 an eye's white
  "#1d100e", // 13 an eye's middle
  "#c7282a", // 14 a flame, cooling
  "#4c4a52", // 15 napalm smoke, dark
  "#ff3b3b", // 16 the Laser Rifle's flash
  "#ffd0d0", // 17 the Laser Rifle's flash, hot
]; // (and after these, the ducks' own colors, as their chunks fly: inkOf)
/* a duck's color as one of INK (added the first time, at most 200 of them) */
function inkOf(hex) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 0;
  let i = INK.indexOf(hex);
  if (i < 0 && INK.length < 216) i = INK.push(hex) - 1;
  return i < 0 ? 0 : i;
}

/* ---------- the canvas ---------- */
let cv = null,
  g = null,
  unit = 60, // (a duck's size on this board, css px: speeds and distances follow it)
  ox = 0,
  oy = 0, // (the world's corner on the screen now: Hangout's camera)
  last = 0,
  lasers = [],
  /* the box drawn in last frame (canvas pixels): only it is cleared, so a busy fight redraws a little of the canvas, not
     all of it */
  dx0 = 0,
  dy0 = 0,
  dx1 = 0,
  dy1 = 0;
const dirty = () => {
  dx0 = dy0 = 0;
  dx1 = dy1 = 1e5;
};
/* a square drawn at (x, y), sz across: the box grows to hold it */
function mark(x, y, sz) {
  if (x < dx0) dx0 = x;
  if (y < dy0) dy0 = y;
  if (x + sz > dx1) dx1 = x + sz;
  if (y + sz > dy1) dy1 = y + sz;
}

/* the canvas in this board's effects layer (or, where the dark falls, the board itself), as big as the board (W × H css
   px), a duck being `size` css px */
export function fxMount(fxl, W, H, size) {
  unit = size || unit;
  const gp = gridPx(),
    cw = Math.max(1, Math.ceil(W / gp)),
    ch = Math.max(1, Math.ceil(H / gp));
  if (!cv || cv.parentNode !== fxl) {
    cv = document.createElement("canvas");
    cv.className = "fx-px";
    cv.setAttribute("aria-hidden", "true");
    g = cv.getContext("2d");
    fxl.prepend(cv);
    LIFE.fill(0); // (a new board: what was flying on the last one is gone)
    alive = 0;
    dirty(); // (cleared on the next frame)
  }
  if (cv.width !== cw || cv.height !== ch) {
    cv.width = cw;
    cv.height = ch;
    cv.style.width = (cw * gp).toFixed(2) + "px";
    cv.style.height = (ch * gp).toFixed(2) + "px";
    dirty();
  }
}
/* where the world's corner shows on the screen now (0, 0 on a board without a camera) */
export function fxOrigin(x, y) {
  ox = x;
  oy = y;
}
/* this frame's laser sights: [x0, y0, x1, y1] in css px on the screen (drawn this frame only) */
export function fxLasers(list) {
  lasers = list;
}

/* ---------- making particles ---------- */
function add(kind, x, y, z, vx, vy, vz, life, col, size = 1, fl = NONE) {
  const i = next;
  next = (next + 1) % (low ? LOW_MAX : MAX);
  if (!LIFE[i]) alive++;
  X[i] = x - ox;
  Y[i] = y - oy;
  Z[i] = z;
  VX[i] = vx;
  VY[i] = vy;
  VZ[i] = vz;
  BORN[i] = performance.now();
  LIFE[i] = life;
  KIND[i] = kind;
  COL[i] = col;
  FL[i] = fl;
  SIZE[i] = size;
}
const rnd = (a, b) => a + Math.random() * (b - a);

/* how a hit bleeds, by what made it (wounds.js' kinds): drops, chunks, bits of the duck itself (flesh: in its own color,
   bloody; the owner's Nov 16 "chunks of a duck flying out of their body"), how fast, how wide, how long it squirts after.
   Since Nov 16 ("blood effects are too small") the drops are two pixels across, some three, and there are more */
const BLEED = {
  small: {
    flesh: [0, 1],
    drops: [8, 13],
    chunks: 0,
    speed: 1.6,
    wide: 0.9,
    squirt: 0,
    big: 0.1,
  }, // (a pistol, an SMG, the LMG: a spill)
  big: {
    flesh: [1, 3],
    drops: [16, 24],
    chunks: [1, 2],
    speed: 2.4,
    wide: 0.8,
    squirt: 2,
    big: 0.3,
  }, // (the AK, the revolver: a spray)
  heavy: {
    flesh: [4, 7],
    drops: [26, 35],
    chunks: [3, 5],
    speed: 3.2,
    wide: 0.9,
    squirt: 3,
    big: 0.45,
    chunk: 3,
  }, // (the sniper, the chain gun: chunks fly)
  shot: {
    flesh: [0, 2],
    drops: [6, 10],
    chunks: [0, 1],
    speed: 2,
    wide: 1.4,
    squirt: 0,
    big: 0.15,
  }, // (each shotgun pellet)
  blade: {
    flesh: [0, 1],
    drops: [8, 13],
    chunks: 0,
    speed: 1.2,
    wide: 0.7,
    squirt: 1,
    big: 0.2,
  }, // (a knife, a dagger: a slosh)
  blunt: {
    flesh: [3, 5],
    drops: [16, 22],
    chunks: [3, 5],
    speed: 2.6,
    wide: 1.6,
    squirt: 0,
    big: 0.4,
    chunk: 3,
  }, // (the hammer, a chair: chunks out)
  arrow: {
    flesh: 0,
    drops: [6, 10],
    chunks: 0,
    speed: 1.3,
    wide: 0.6,
    squirt: 1,
    big: 0.1,
  },
  claw: {
    flesh: [0, 1],
    drops: [6, 11],
    chunks: 0,
    speed: 1.3,
    wide: 1.2,
    squirt: 0,
    big: 0.15,
  },
};
export const BLEED_OF = {
  handgun: "small",
  smg: "small",
  tommy: "small",
  ump: "small",
  lmg: "small",
  ak: "big",
  burst: "big",
  revolver: "big",
  sniper: "heavy",
  slug: "heavy",
  dbarrel: "heavy",
  chaingun: "heavy",
  chain: "heavy",
  pellet: "shot",
  shotgun: "shot",
  knife: "blade",
  dagger: "blade",
  jaime: "blade",
  hammer: "blunt",
  pan: "blunt",
  axe: "blade",
  sword: "blade",
  chair: "blunt",
  arrow: "arrow",
  bow: "arrow",
  claw: "claw",
  laser: "small",
};
/* the room's two switches (Game Settings): gore off (no blood at all) and heavy effects off (no smoke, muzzle flashes or
   screen shake). game.js sets them every frame from the options; every blood and smoke maker below checks them.
   And my own Low graphics (Settings → Performance: Graphics Low, Data saving or Poor connection; html.low), on my
   screen only (the owner's, Nov 16 19:41Z: everyone's gun effects and animations still show): no smoke and no screen
   shake, only a tiny muzzle flash, half the particles, pools that last half as long, the Angel machine's sparks one
   every 120 ms, and this canvas drawn 30 times a second instead of every frame */
let noGore = false,
  noHeavy = false,
  low = false;
export function fxLimits(gore, heavy) {
  noGore = !!+gore;
  noHeavy = !!+heavy;
  low = document.documentElement.classList.contains("low");
}
export const heavyOff = () => noHeavy || low; // (no screen shake, a plain Nuke screen, a still crimson)
export const lowFx = () => low;
const many = (r) => (Array.isArray(r) ? Math.round(rnd(r[0], r[1])) : r);

/* blood out of something hit at (x, y) (css px on the screen), h px over its feet, by weapon w; (dx, dy): the way the
   hit went (most of the blood goes on that way, some back toward the shooter); body: the duck's color (its chunks) */
export function fxBlood(x, y, h, w, dx = 0, dy = 0, body = "") {
  sfx.flesh(BLEED_OF[w] || "small", w); // (its sound: by what went in, or the weapon's own: sound.js OWN_HIT)
  if (noGore) return;
  const B = BLEED[BLEED_OF[w] || "small"],
    u = unit,
    l = Math.hypot(dx, dy),
    ang = l > 0 ? Math.atan2(dy, dx) : -Math.PI / 2 + rnd(-1.4, 1.4),
    own = body ? inkOf(body) : -1;
  /* kind: 0 drops, 1 blood chunks, 2 the duck's own chunks */
  const spray = (n, kind, speed, wide, back) => {
    for (let k = 0; k < n; k++) {
      const a =
          (Math.random() < back ? ang + Math.PI : ang) + rnd(-wide, wide) / 2,
        v = u * speed * rnd(0.45, 1);
      const sz =
        kind === 2
          ? Math.random() < 0.5
            ? 3
            : 4
          : kind
            ? Math.random() < 0.5
              ? B.chunk || 3
              : 3
            : Math.random() < B.big
              ? 3
              : 2; // (drops two pixels across, some three; chunks three or four)
      add(
        kind ? CHUNK : DROP,
        x + rnd(-0.08, 0.08) * u,
        y,
        h + rnd(-0.12, 0.12) * u,
        Math.cos(a) * v,
        Math.sin(a) * v * 0.55, // (the floor seen at a slant: less depth than width)
        u * rnd(0.6, 2.1),
        kind === 2 ? 3200 : 2600,
        kind === 2
          ? own
          : kind
            ? Math.random() < 0.5
              ? 2
              : 3
            : [0, 1, 2, 4][k % 4],
        sz,
        kind === 2 ? (Math.random() < 0.5 ? 0 : 3) : NONE,
      );
    }
  };
  spray(many(B.drops), 0, B.speed, B.wide, 0.2);
  if (B.chunks) spray(many(B.chunks), 1, B.speed * 0.8, B.wide * 1.3, 0.1);
  if (own >= 0 && B.flesh)
    spray(many(B.flesh), 2, B.speed * 0.75, B.wide * 1.4, 0.1);
  for (let k = 0; k < B.squirt; k++)
    setTimeout(
      () => spray(4 + k, 0, B.speed * 0.55, 0.5, 0),
      140 + k * 170 + rnd(0, 60),
    ); // (a hole keeps squirting a moment: more for bigger rounds)
}
/* ---------- what hit what ----------
   Something losing HP bleeds by what hit it: the shot that vanished by it a moment ago (its kind: a pistol's round, a
   sniper's, a pellet), a knife or a hammer that just touched it, or (none found) a little. */
const IMPACTS = [], // [x, y, kind, dx, dy, when]
  MELEE = new Map(); // a duck's id → [weapon, when, the attacker's [x, y]]
/* a shot gone at (x, y) on the screen, kind k, flying (dx, dy) */
export function fxImpact(x, y, k, dx, dy) {
  const e = [x, y, k, dx, dy, performance.now(), false];
  IMPACTS.push(e);
  if (IMPACTS.length > 40) IMPACTS.shift();
  /* its sound: in flesh (fxBlood, once something bleeds by it), or else landing on the floor or a wall a moment later,
     by its round, if it went out on the board (not off its edge) */
  const W = cv ? cv.width * gridPx() : 0,
    H = cv ? cv.height * gridPx() : 0;
  if (x >= 0 && y >= 0 && x <= W && y <= H)
    setTimeout(() => e[6] || sfx.land(k), 120);
}
/* a knife, a hammer… that just touched duck id, swung from `from` ([x, y] on the screen) */
export function fxMelee(id, w, from) {
  MELEE.set(id, [w, performance.now(), from]);
}
/* something hit, its feet at (x, y) on the screen, bleeding h px over them; id if it's a duck; size: a duck's size;
   or: what hit it when no shot or blade is known (a little, from a pistol, if nothing says); body: its color */
export function fxHitAt(x, y, h, id, size, or = "small", body = "") {
  const now = performance.now(),
    m = id && MELEE.get(id);
  let w = "",
    dx = 0,
    dy = 0,
    best = size * 1.6;
  if (m && now - m[1] < 500) {
    w = m[0];
    if (m[2]) [dx, dy] = [x - m[2][0], y - m[2][1]];
  } else {
    let hit = null;
    for (const e of IMPACTS) {
      const [ix, iy, k, vx, vy, t] = e,
        d = Math.hypot(ix - x, iy - y);
      if (now - t < 450 && d < best) {
        best = d;
        w = k;
        dx = vx;
        dy = vy;
        hit = e;
      }
    }
    if (hit) hit[6] = true; // (it went in: no landing sound)
  }
  fxBlood(x, y, h, w || or, dx, dy, body);
}

/* blood bursting out all around (a crit's head, a grenade): n drops, chunks too; body: the duck's color, for chunks of
   it among them */
export function fxBurst(x, y, h, n, chunks = 0, body = "") {
  if (noGore) return;
  const u = unit,
    own = body ? inkOf(body) : -1;
  for (let k = 0; k < n + chunks; k++) {
    const a = rnd(0, Math.PI * 2),
      v = u * rnd(0.8, 2.6),
      big = k >= n,
      duck = big && own >= 0 && k % 2 === 0; // (half the chunks: bits of the duck)
    add(
      big ? CHUNK : DROP,
      x,
      y,
      h,
      Math.cos(a) * v,
      Math.sin(a) * v * 0.55,
      u * rnd(1, 2.6),
      duck ? 3200 : 2600,
      duck ? own : big ? 3 : [0, 1, 4][k % 3],
      big ? (duck ? 4 : 3) : 2,
      duck ? 0 : NONE,
    );
  }
}

/* a gun going off at its barrel's end (x, y, on the screen, `ang` the way it points). Each gun has its own flash and
   smoke (owner 2026-11-16): reach, the flash's length in ducks; cone, how wide it fans out (narrow and long for the
   sniper, a wide spray for the shotgun); n, its pixels; core, the size of the hot pixels in the middle; smoke, its
   puffs; puff, their size; drift, how far they travel; shake and kick, the screen's shake and the gun's recoil
   (fxmotion.js). Weaker and smaller guns get the least; the chain gun, the sniper, the LMG and the shotgun the most.
   More for the big guns (the owner's, Nov 17 11:07Z: "LMG, Sniper, especially chain gun, shotguns somewhat, and high
   caliber weapons in general SHOULD shake the screen more"): the chain gun and the LMG fire fast enough that it builds
   up while held (the chain gun the most), the sniper the biggest single shake */
export const MUZZLE = {
  handgun: {
    reach: 0.45,
    cone: 0.35,
    n: 12,
    core: 3,
    smoke: 2,
    puff: 3,
    drift: 0.5,
    shake: 0.1,
    kick: 0.45,
  },
  smg: {
    reach: 0.5,
    cone: 0.3,
    n: 14,
    core: 3,
    smoke: 2,
    puff: 3,
    drift: 0.5,
    shake: 0.08,
    kick: 0.3,
  },
  tommy: {
    reach: 0.5,
    cone: 0.3,
    n: 14,
    core: 3,
    smoke: 2,
    puff: 3,
    drift: 0.5,
    shake: 0.08,
    kick: 0.3,
  },
  ump: {
    reach: 0.5,
    cone: 0.3,
    n: 14,
    core: 3,
    smoke: 2,
    puff: 3,
    drift: 0.5,
    shake: 0.08,
    kick: 0.3,
  },
  revolver: {
    reach: 0.7,
    cone: 0.5,
    n: 22,
    core: 4,
    smoke: 4,
    puff: 4,
    drift: 0.6,
    shake: 0.4,
    kick: 0.9,
  },
  ak: {
    reach: 0.85,
    cone: 0.4,
    n: 30,
    core: 4,
    smoke: 5,
    puff: 4,
    drift: 0.7,
    shake: 0.2,
    kick: 0.55,
  },
  burst: {
    reach: 0.8,
    cone: 0.36,
    n: 26,
    core: 4,
    smoke: 4,
    puff: 4,
    drift: 0.7,
    shake: 0.14,
    kick: 0.5,
  },
  slug: {
    reach: 1.1,
    cone: 0.8,
    n: 52,
    core: 6,
    smoke: 12,
    puff: 6,
    drift: 0.8,
    shake: 0.75, // (as the sniper's: the owner's, Nov 18 13:46Z)
    kick: 1.5,
  }, // (the double barrel: the biggest flash and kick of all)
  shotgun: {
    reach: 0.7,
    cone: 1.1,
    n: 40,
    core: 5,
    smoke: 8,
    puff: 5,
    drift: 0.6,
    shake: 0.45,
    kick: 1,
  },
  lmg: {
    reach: 0.95,
    cone: 0.45,
    n: 34,
    core: 4,
    smoke: 6,
    puff: 5,
    drift: 0.7,
    shake: 0.28,
    kick: 0.5,
  },
  sniper: {
    reach: 1.4,
    cone: 0.22,
    n: 36,
    core: 5,
    smoke: 7,
    puff: 5,
    drift: 0.9,
    shake: 0.75,
    kick: 1.2,
  },
  chaingun: {
    reach: 1.1,
    cone: 0.7,
    n: 44,
    core: 5,
    smoke: 4,
    puff: 4,
    drift: 0.8,
    shake: 0.24,
    kick: 0.45,
  },
  laser: {
    reach: 0.45,
    cone: 0.25,
    n: 14,
    core: 3,
    smoke: 0,
    puff: 3,
    drift: 0.4,
    shake: 0, // (no shake and no recoil: the owner's, Nov 17 17:41Z, "laser gun doesnt make player vibrate nor has recoil")
    kick: 0,
    ink: [17, 16, 16], // (red, not a gun's yellow: its middle, then out)
  }, // (the Laser Rifle: a small red flash at its lens, no smoke)
  glauncher: {
    reach: 0.5,
    cone: 0.9,
    n: 20,
    core: 5,
    smoke: 10,
    puff: 6,
    drift: 0.4,
    shake: 0.35,
    kick: 1.1,
  },
};
export function fxMuzzle(x, y, ang, gun) {
  const M = MUZZLE[gun];
  if (!M || noHeavy) return;
  const u = unit,
    c = Math.cos(ang),
    s = Math.sin(ang),
    reach = u * M.reach * (low ? 0.3 : 1);
  if (low) {
    /* Low: a tiny flash, two or three pixels at the barrel's end, so every shot still shows (no smoke) */
    for (let k = 0; k < 3; k++)
      add(
        FLASH,
        x + c * rnd(0, reach),
        y + s * rnd(0, reach),
        0,
        0,
        0,
        0,
        rnd(60, 100),
        k ? 9 : 8,
        2,
      );
    return;
  }
  /* the flash: pixels in a cone out of the barrel, hot in the middle, gone in a few frames */
  const [hot, mid, edge] = M.ink || [8, 9, 10];
  for (let k = 0; k < M.n; k++) {
    const d = rnd(0, reach),
      side = rnd(-0.5, 0.5) * (d * M.cone + u * 0.08);
    add(
      FLASH,
      x + c * d - s * side,
      y + s * d + c * side,
      0,
      0,
      0,
      0,
      rnd(70, 130),
      d < reach * 0.3 ? hot : Math.random() < 0.6 ? mid : edge,
      d < reach * 0.4 ? M.core : d < reach * 0.75 ? Math.max(2, M.core - 2) : 2, // (bigger pixels in the middle)
    );
  }
  /* the smoke: puffs that drift on the way it fired, rise, spread and thin out */
  for (let k = 0; k < M.smoke; k++) {
    const v = u * M.drift * rnd(0.4, 1.1),
      d = rnd(0, reach * 0.8);
    add(
      SMOKE,
      x + c * d + rnd(-0.5, 0.5) * M.cone * u * 0.2,
      y + s * d + rnd(-0.5, 0.5) * M.cone * u * 0.2,
      0,
      c * v + rnd(-0.25, 0.25) * u * M.cone,
      s * v * 0.6,
      u * rnd(0.3, 0.7),
      rnd(800, 1400) + M.smoke * 60,
      5 + (k % 3),
      M.puff,
    );
  }
}

/* the flamethrower's stream this frame, out of its nozzle at (x, y) on the screen toward `ang`, reaching `far` css px:
   n new flame pixels (flamer.js: rate by how long it's held), each at its place across the cone (bands out from the
   middle, each half as likely: flamer.js band), flying out to its end; some dark napalm smoke over it. `cone`: the
   cone's half width (radians) */
export function fxFlame(x, y, ang, far, n, cone, band) {
  if (n <= 0) return;
  const c = Math.cos(ang),
    s = Math.sin(ang),
    u = unit,
    life = 260;
  for (let k = 0; k < n; k++) {
    const a = ang + band() * cone,
      v = (far / life) * 1000 * rnd(0.85, 1.05),
      ahead = Math.random() * 0.35; // (each starts a little way along its path: the stream stays whole between frames)
    add(
      FIRE,
      x + Math.cos(a) * v * (life / 1000) * ahead,
      y + Math.sin(a) * v * (life / 1000) * ahead,
      0,
      Math.cos(a) * v,
      Math.sin(a) * v,
      0,
      life * (1 - ahead) * rnd(0.8, 1),
      8,
      Math.random() < 0.3 ? 2 : 1,
    );
  }
  if (noHeavy || low) return;
  for (let k = 0; k < Math.ceil(n / 8); k++) {
    const d = far * rnd(0.3, 1);
    add(
      SMOKE,
      x + c * d + rnd(-0.3, 0.3) * u,
      y + s * d + rnd(-0.3, 0.3) * u,
      u * 0.3,
      c * u * 0.3 + rnd(-0.2, 0.2) * u,
      s * u * 0.2,
      u * rnd(0.5, 0.9),
      rnd(900, 1500),
      Math.random() < 0.6 ? 15 : 6,
      3,
    );
  } // (napalm: dark smoke rising off it)
}
/* a patch of burning ground at (x, y) on the screen, r css px across: a few flickering flame pixels this frame */
export function fxGroundFire(x, y, r, n = 2) {
  for (let k = 0; k < n; k++) {
    const a = rnd(0, Math.PI * 2),
      d = r * Math.sqrt(Math.random());
    add(
      FIRE,
      x + Math.cos(a) * d,
      y + Math.sin(a) * d * 0.55,
      0,
      0,
      0,
      unit * rnd(0.4, 0.9),
      rnd(180, 320),
      Math.random() < 0.4 ? 9 : 10,
      Math.random() < 0.25 ? 2 : 1,
    );
  }
}

/* steam off something hot at (x, y) on the screen (the Laser Rifle's barrel, the owner's Nov 17): n light puffs that rise
   slowly and spread; none with heavy effects off, half of them on Low */
export function fxSteam(x, y, n = 1) {
  if (noHeavy || (low && Math.random() < 0.5)) return;
  const u = unit;
  for (let k = 0; k < n; k++)
    add(
      SMOKE,
      x + rnd(-0.08, 0.08) * u,
      y,
      0,
      rnd(-0.15, 0.15) * u,
      rnd(-0.05, 0.05) * u,
      u * rnd(0.45, 0.85),
      rnd(700, 1200),
      Math.random() < 0.75 ? 7 : 5,
      2,
    );
}

/* what the Laser Rifle's beam went through (a zombie, a duck) smokes and steams (the owner's, Nov 17 17:41Z: "it makes
   smoke and steam rise up from ducks or zombies it hits"): at (x, y) on the screen, h px up its body, n puffs, dark
   smoke and light steam rising off it; none with heavy effects off, half of them on Low */
export function fxSmolder(x, y, h, n = 4) {
  if (noHeavy) return;
  const u = unit;
  for (let k = 0; k < n; k++) {
    if (low && Math.random() < 0.5) continue;
    const steam = k % 2 === 0;
    add(
      SMOKE,
      x + rnd(-0.12, 0.12) * u,
      y,
      h * rnd(0.6, 1.1),
      rnd(-0.12, 0.12) * u,
      rnd(-0.04, 0.04) * u,
      u * (steam ? rnd(0.5, 0.9) : rnd(0.35, 0.6)),
      steam ? rnd(700, 1100) : rnd(900, 1500),
      steam ? 7 : 6,
      steam ? 2 : 3,
    );
  }
}

/* the Angel machine at work (the owner's, Nov 16): sparks thrown up out of its hatch at (x, y) on the screen, h px over
   the floor, falling back; now and then a puff of light smoke */
let sparkAt = 0;
export function fxSparks(x, y, h, n = 2) {
  const u = unit;
  if (low) {
    const t = performance.now();
    if (t - sparkAt < 120) return;
    sparkAt = t;
    n = 1;
  }
  for (let k = 0; k < n; k++)
    add(
      SPARK,
      x + rnd(-0.15, 0.15) * u,
      y,
      h,
      rnd(-1.2, 1.2) * u,
      rnd(-0.3, 0.3) * u,
      u * rnd(1.4, 2.6),
      rnd(500, 900),
      Math.random() < 0.5 ? 8 : 9,
      1,
    );
  if (!noHeavy && !low && Math.random() < 0.3)
    add(
      SMOKE,
      x + rnd(-0.2, 0.2) * u,
      y,
      h,
      rnd(-0.15, 0.15) * u,
      0,
      u * rnd(0.4, 0.8),
      rnd(900, 1500),
      7,
      3,
    );
}

/* ---------- each frame: move and draw ---------- */
const G = 7.5; // (gravity, in ducks a second, each second)
export function fxFrame(now = performance.now()) {
  if (!cv) return;
  if (low && last && now - last < 30) return; // (Low: 30 times a second)
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
  last = now;
  if (dx1 > dx0) g.clearRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  dx0 = dy0 = 1e5;
  dx1 = dy1 = -1e5;
  if (!alive && !lasers.length && !SPR.length) return;
  const gp = gridPx(),
    W = cv.width,
    H = cv.height;
  let n = 0;
  for (let i = 0; i < MAX; i++) {
    if (!LIFE[i]) continue;
    const age = now - BORN[i];
    if (age >= LIFE[i]) {
      LIFE[i] = 0;
      alive--;
      continue;
    }
    n++;
    const k = KIND[i];
    if (k === DROP || k === CHUNK) {
      VZ[i] -= G * unit * dt;
      X[i] += VX[i] * dt;
      Y[i] += VY[i] * dt;
      Z[i] += VZ[i] * dt;
      if (Z[i] <= 0) {
        // (it lands: a splat on the floor that stays a moment, then goes)
        Z[i] = 0;
        KIND[i] = SPLAT;
        BORN[i] = now;
        LIFE[i] = (k === CHUNK ? 4500 : 3200) * (low ? 0.5 : 1); // (pools that stay a while: the owner's Nov 16 "gorey"; Low: half as long)
        if (COL[i] === 4) COL[i] = 1;
        if (FL[i] === NONE && Math.random() < 0.6) SIZE[i] = SIZE[i] + 1; // (blood spreads a little where it lands)
      }
    } else if (k === SPARK) {
      VZ[i] -= G * unit * dt;
      X[i] += VX[i] * dt;
      Y[i] += VY[i] * dt;
      Z[i] += VZ[i] * dt;
      if (Z[i] <= 0) {
        LIFE[i] = 0;
        alive--;
        continue;
      }
      if (age > LIFE[i] * 0.5) COL[i] = 10; // (cooling: orange)
    } else if (k === FIRE) {
      const fdt = Math.min(dt, age / 1000); // (one born since the last frame moves only for its own age)
      X[i] += VX[i] * fdt;
      Y[i] += VY[i] * fdt;
      Z[i] += VZ[i] * fdt;
      const f = age / LIFE[i];
      COL[i] = f < 0.2 ? 8 : f < 0.45 ? 9 : f < 0.75 ? 10 : 14; // (white, yellow, orange, then red as it cools)
    } else if (k === SMOKE) {
      X[i] += VX[i] * dt;
      Y[i] += VY[i] * dt;
      Z[i] += VZ[i] * dt;
      VX[i] *= 1 - 1.6 * dt;
      VY[i] *= 1 - 1.6 * dt;
      if (age > LIFE[i] * 0.45 && SIZE[i] < 7) SIZE[i] = SIZE[i] + 3; // (it spreads out, once)
    }
    /* see-through in steps, as the pixel look's pictures (none, half, all): fading things go half first */
    const u = age / LIFE[i];
    g.globalAlpha =
      k === SMOKE ? (u < 0.4 ? 0.7 : 0.4) : k === SPLAT && u > 0.6 ? 0.5 : 1;
    g.fillStyle = INK[COL[i]];
    const px = Math.round((X[i] + ox) / gp),
      py = Math.round((Y[i] + oy - Z[i]) / gp),
      sz = SIZE[i];
    if (px < -3 || py < -3 || px > W + 3 || py > H + 3) continue;
    g.fillRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
    if (FL[i] !== NONE) {
      const fs = sz > 3 ? 2 : 1; // (a bit of a duck: blood on its torn side)
      g.fillStyle = INK[FL[i]];
      g.fillRect(px - (sz >> 1) + sz - fs, py - (sz >> 1) + sz - fs, fs, fs);
    }
    mark(px - (sz >> 1), py - (sz >> 1), sz);
  }
  if (SPR.length) sprites(now, dt, gp, W, H);
  /* the laser sights: one line of pixels each, see-through, a brighter dot where it ends */
  if (lasers.length) {
    g.fillStyle = INK[11];
    for (const [x0, y0, x1, y1] of lasers) {
      let ax = Math.round(x0 / gp),
        ay = Math.round(y0 / gp);
      const bx = Math.round(x1 / gp),
        by = Math.round(y1 / gp),
        sx = Math.sign(bx - ax),
        sy = Math.sign(by - ay),
        dx = Math.abs(bx - ax),
        dy = -Math.abs(by - ay);
      let e = dx + dy,
        steps = 0;
      mark(Math.min(ax, bx), Math.min(ay, by), 1);
      mark(Math.max(ax, bx), Math.max(ay, by), 1);
      g.globalAlpha = 0.7;
      while (steps++ < 2000) {
        if (ax >= 0 && ay >= 0 && ax < W && ay < H) g.fillRect(ax, ay, 1, 1);
        if (ax === bx && ay === by) break;
        const e2 = 2 * e;
        if (e2 >= dy) {
          e += dy;
          ax += sx;
        }
        if (e2 <= dx) {
          e += dx;
          ay += sy;
        }
      } // (Bresenham's line, a square at a time)
      g.globalAlpha = 1;
      g.fillRect(bx, by, 1, 1);
    }
  }
  g.globalAlpha = 1;
  if (!n) alive = 0;
}

/* ---------- things knocked off a duck (the owner's, Nov 16: hats, face items, a beak, an eye) ----------
   A small picture each, already in pixels at the grid's size, flying off the way the hit went, turning over a quarter at
   a time (pixels never turn by less), landing, lying a moment and going. At most SPR_MAX at once */
const SPR = [],
  SPR_MAX = 24;
function sprites(now, dt, gp, W, H) {
  g.imageSmoothingEnabled = false;
  for (let i = SPR.length - 1; i >= 0; i--) {
    const o = SPR[i],
      age = now - o.born;
    if (age >= o.life || !o.pic) {
      if (age >= o.life) SPR.splice(i, 1);
      continue;
    }
    if (o.z > 0 || o.vz > 0) {
      o.vz -= G * unit * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.z = Math.max(0, o.z + o.vz * dt);
      if (o.z === 0) {
        o.vz = 0;
        o.turn = Math.round(o.turn); // (it lands flat on a side)
      } else o.turn += o.spin * dt;
    }
    const c = o.pic,
      q = ((Math.round(o.turn) % 4) + 4) % 4,
      w = q % 2 ? c.height : c.width,
      h = q % 2 ? c.width : c.height,
      px = Math.round((o.x + ox) / gp),
      py = Math.round((o.y + oy - o.z) / gp);
    if (px < -w || py < -h || px > W + w || py > H + h) continue;
    g.globalAlpha = age > o.life - 600 ? 0.5 : 1; // (going: half see-through first, as everything in the pixel look)
    g.save();
    g.translate(px, py);
    g.rotate((q * Math.PI) / 2);
    g.drawImage(c, -(c.width >> 1), -(c.height >> 1));
    g.restore();
    mark(px - (w >> 1) - 1, py - (h >> 1) - 1, Math.max(w, h) + 2);
  }
  g.globalAlpha = 1;
}
/* a drawing (SVG text, w css px wide) as a little canvas of the grid's pixels, through the palette, its empty edges cut
   off; made once for each drawing and size */
const PICS = new Map();
function pixelPic(svg, w) {
  const gp = gridPx(),
    key = svg.length + ":" + w.toFixed(1) + ":" + gp.toFixed(3) + ":" + svg;
  if (PICS.has(key)) return PICS.get(key);
  if (PICS.size > 60) PICS.clear();
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg),
    k = vb ? +vb[4] / +vb[3] : 1,
    cw = Math.max(2, Math.round(w / gp)),
    ch = Math.max(2, Math.round((w * k) / gp));
  const p = new Promise((done) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.imageSmoothingQuality = "high";
      x.drawImage(img, 0, 0, cw, ch);
      const d = applyPalette(x.getImageData(0, 0, cw, ch));
      let x0 = cw,
        y0 = ch,
        x1 = -1,
        y1 = -1;
      for (let yy = 0; yy < ch; yy++)
        for (let xx = 0; xx < cw; xx++)
          if (d.data[(yy * cw + xx) * 4 + 3] > 40) {
            x0 = Math.min(x0, xx);
            y0 = Math.min(y0, yy);
            x1 = Math.max(x1, xx);
            y1 = Math.max(y1, yy);
          }
      if (x1 < 0) return done(null);
      const out = document.createElement("canvas");
      out.width = x1 - x0 + 1;
      out.height = y1 - y0 + 1;
      x.putImageData(d, 0, 0);
      out.getContext("2d").drawImage(c, -x0, -y0);
      done(out);
    };
    img.onerror = () => done(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
  PICS.set(key, p);
  return p;
}
/* something knocked off a duck: drawing svg (w css px wide), from (x, y) h px over the feet, flying the way (dx: -1
   left, 1 right) the hit pushed it; up: how hard it pops up (1 a hat; more for an eye). Not with gore off when it's
   gore (a beak, an eye) */
export function fxKnock(svg, w, x, y, h, dx = 1, up = 1, gore = false) {
  if (gore && noGore) return;
  if (SPR.length >= SPR_MAX) SPR.shift();
  const u = unit,
    o = {
      pic: null,
      x: x - ox,
      y: y - oy,
      z: h,
      vx: dx * u * rnd(0.5, 1.3),
      vy: rnd(-0.25, 0.25) * u,
      vz: u * rnd(1.4, 2.2) * up,
      turn: 0,
      spin: dx * rnd(5, 9),
      born: performance.now(),
      life: 3800,
    };
  SPR.push(o);
  pixelPic(svg, w).then((c) => (o.pic = c));
  dirty();
}
/* an eye blown out: a white ball with its dark middle, and blood after it */
export function fxEye(x, y, h, dx = 1) {
  if (noGore) return;
  const u = unit,
    a = -Math.PI / 2 + dx * rnd(0.5, 1.1);
  add(
    CHUNK,
    x,
    y,
    h,
    Math.cos(a) * u * 1.2,
    rnd(-0.2, 0.2) * u,
    u * rnd(1.8, 2.6),
    3400,
    12,
    3,
    13,
  );
  for (let k = 0; k < 8; k++)
    add(
      DROP,
      x,
      y,
      h,
      Math.cos(a) * u * rnd(0.4, 1.3),
      rnd(-0.3, 0.3) * u,
      u * rnd(1, 2.4),
      2600,
      k % 3,
      2,
    );
}
/* blood spurting up out of (x, y) (a headless neck): n small spurts, one after another over ms */
export function fxSpurt(x, y, h, n = 10, ms = 1400) {
  if (noGore) return;
  const u = unit,
    o = [ox, oy];
  for (let k = 0; k < n; k++)
    setTimeout(
      () => {
        const dx = ox - o[0],
          dy = oy - o[1]; // (the camera may have moved since: it keeps its place in the world)
        for (let j = 0; j < 3; j++) {
          const a = -Math.PI / 2 + rnd(-0.5, 0.5),
            v = u * rnd(0.4, 1);
          add(
            DROP,
            x + dx,
            y + dy,
            h,
            Math.cos(a) * v * 0.5,
            rnd(-0.2, 0.2) * u,
            u * rnd(1.2, 2.2),
            2600,
            j % 3,
            2,
          );
        }
      },
      200 + (k * ms) / n,
    );
}
