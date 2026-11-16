/* ---------- the effects, drawn as pixels (owner, Nov 16: "we are doing it by pixels now instead of making pictures that
   convert to pixels, since that is more simple and less things can go wrong") ----------
   Blood (drops, chunks, the splats they leave), gun smoke, muzzle flashes and laser sights, one square of the pixel grid
   each (pixel.js gridPx), on one small canvas over the board: as many pixels as the grid has squares, shown scaled up
   and sharp. Every particle lives in a fixed pool (typed arrays, nothing made or thrown away while playing); with
   none alive and no laser, nothing is drawn at all.
   Places are the board's css px. In Hangout and Dead Ducks Arcade the camera moves: game.js tells me where the
   world's corner is on the screen each frame (fxOrigin), and every particle keeps its place in the world. */
import { gridPx } from "./pixel.js";
import { sfx } from "./sound.js";

const MAX = 1200, // (particles at most: the oldest give way)
  DROP = 1,
  CHUNK = 2,
  SPLAT = 3,
  SMOKE = 4,
  FLASH = 5;
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
];

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
function add(kind, x, y, z, vx, vy, vz, life, col, size = 1) {
  const i = next;
  next = (next + 1) % MAX;
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
  SIZE[i] = size;
}
const rnd = (a, b) => a + Math.random() * (b - a);

/* how a hit bleeds, by what made it (wounds.js' kinds): drops, chunks, how fast, how wide, how long it squirts after */
const BLEED = {
  small: {
    drops: [5, 8],
    chunks: 0,
    speed: 1.6,
    wide: 0.9,
    squirt: 0,
    big: 0.1,
  }, // (a pistol, an SMG, the LMG: a spill)
  big: {
    drops: [10, 15],
    chunks: [1, 2],
    speed: 2.4,
    wide: 0.8,
    squirt: 2,
    big: 0.3,
  }, // (the AK, the revolver: a spray)
  heavy: {
    drops: [16, 22],
    chunks: [3, 5],
    speed: 3.2,
    wide: 0.9,
    squirt: 3,
    big: 0.45,
    chunk: 3,
  }, // (the sniper, the chain gun: chunks fly)
  shot: {
    drops: [4, 6],
    chunks: [0, 1],
    speed: 2,
    wide: 1.4,
    squirt: 0,
    big: 0.15,
  }, // (each shotgun pellet)
  blade: {
    drops: [5, 8],
    chunks: 0,
    speed: 1.2,
    wide: 0.7,
    squirt: 1,
    big: 0.2,
  }, // (a knife, a dagger: a slosh)
  blunt: {
    drops: [10, 14],
    chunks: [3, 5],
    speed: 2.6,
    wide: 1.6,
    squirt: 0,
    big: 0.4,
    chunk: 3,
  }, // (the hammer, a chair: chunks out)
  arrow: {
    drops: [4, 6],
    chunks: 0,
    speed: 1.3,
    wide: 0.6,
    squirt: 1,
    big: 0.1,
  },
  claw: {
    drops: [4, 7],
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
  lmg: "small",
  ak: "big",
  revolver: "big",
  sniper: "heavy",
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
};
/* the room's two switches (Game Settings): gore off (no blood at all) and heavy effects off (no smoke, muzzle flashes or
   screen shake). game.js sets them every frame from the options; every blood and smoke maker below checks them */
let noGore = false,
  noHeavy = false;
export function fxLimits(gore, heavy) {
  noGore = !!+gore;
  noHeavy = !!+heavy;
}
export const heavyOff = () => noHeavy;
const many = (r) => (Array.isArray(r) ? Math.round(rnd(r[0], r[1])) : r);

/* blood out of something hit at (x, y) (css px on the screen), h px over its feet, by weapon w; (dx, dy): the way the
   hit went (most of the blood goes on that way, some back toward the shooter) */
export function fxBlood(x, y, h, w, dx = 0, dy = 0) {
  sfx.flesh(BLEED_OF[w] || "small"); // (its sound: by what went in)
  if (noGore) return;
  const B = BLEED[BLEED_OF[w] || "small"],
    u = unit,
    l = Math.hypot(dx, dy),
    ang = l > 0 ? Math.atan2(dy, dx) : -Math.PI / 2 + rnd(-1.4, 1.4);
  const spray = (n, size, speed, wide, back) => {
    for (let k = 0; k < n; k++) {
      const a =
          (Math.random() < back ? ang + Math.PI : ang) + rnd(-wide, wide) / 2,
        v = u * speed * rnd(0.45, 1);
      const sz =
        size > 1
          ? Math.random() < 0.5
            ? B.chunk || 2
            : 2
          : Math.random() < B.big
            ? 2
            : 1; // (drops one pixel, some two by two for bigger rounds; chunks two or three)
      add(
        size > 1 ? CHUNK : DROP,
        x + rnd(-0.08, 0.08) * u,
        y,
        h + rnd(-0.12, 0.12) * u,
        Math.cos(a) * v,
        Math.sin(a) * v * 0.55, // (the floor seen at a slant: less depth than width)
        u * rnd(0.6, 2.1),
        2600,
        size > 1 ? (Math.random() < 0.5 ? 2 : 3) : [0, 1, 2, 4][k % 4],
        sz,
      );
    }
  };
  spray(many(B.drops), 1, B.speed, B.wide, 0.2);
  if (B.chunks) spray(many(B.chunks), 2, B.speed * 0.8, B.wide * 1.3, 0.1);
  for (let k = 0; k < B.squirt; k++)
    setTimeout(
      () => spray(3 + k, 1, B.speed * 0.55, 0.5, 0),
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
   or: what hit it when no shot or blade is known (a little, from a pistol, if nothing says) */
export function fxHitAt(x, y, h, id, size, or = "small") {
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
  fxBlood(x, y, h, w || or, dx, dy);
}

/* blood bursting out all around (a crit's head, a grenade): n drops, chunks too */
export function fxBurst(x, y, h, n, chunks = 0) {
  if (noGore) return;
  const u = unit;
  for (let k = 0; k < n + chunks; k++) {
    const a = rnd(0, Math.PI * 2),
      v = u * rnd(0.8, 2.6),
      big = k >= n;
    add(
      big ? CHUNK : DROP,
      x,
      y,
      h,
      Math.cos(a) * v,
      Math.sin(a) * v * 0.55,
      u * rnd(1, 2.6),
      2600,
      big ? 3 : k % 3,
      big ? 2 : 1,
    );
  }
}

/* a gun going off at its barrel's end (x, y, on the screen, `ang` the way it points). Each gun has its own flash and
   smoke (owner 2026-11-16): reach, the flash's length in ducks; cone, how wide it fans out (narrow and long for the
   sniper, a wide spray for the shotgun); n, its pixels; core, the size of the hot pixels in the middle; smoke, its
   puffs; puff, their size; drift, how far they travel; shake and kick, the screen's shake and the gun's recoil
   (fxmotion.js). Weaker and smaller guns get the least; the chain gun, the sniper, the LMG and the shotgun the most */
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
  revolver: {
    reach: 0.7,
    cone: 0.5,
    n: 22,
    core: 4,
    smoke: 4,
    puff: 4,
    drift: 0.6,
    shake: 0.22,
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
    shake: 0.16,
    kick: 0.55,
  },
  shotgun: {
    reach: 0.7,
    cone: 1.1,
    n: 40,
    core: 5,
    smoke: 8,
    puff: 5,
    drift: 0.6,
    shake: 0.32,
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
    shake: 0.15,
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
    shake: 0.42,
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
    shake: 0.13,
    kick: 0.45,
  },
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
    reach = u * M.reach;
  /* the flash: pixels in a cone out of the barrel, hot in the middle, gone in a few frames */
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
      d < reach * 0.3 ? 8 : Math.random() < 0.6 ? 9 : 10,
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

/* ---------- each frame: move and draw ---------- */
const G = 7.5; // (gravity, in ducks a second, each second)
export function fxFrame(now = performance.now()) {
  if (!cv) return;
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
  last = now;
  if (dx1 > dx0) g.clearRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  dx0 = dy0 = 1e5;
  dx1 = dy1 = -1e5;
  if (!alive && !lasers.length) return;
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
        LIFE[i] = k === CHUNK ? 2200 : 1500;
        if (COL[i] === 4) COL[i] = 1;
        if (k === CHUNK && Math.random() < 0.5) SIZE[i] = 3; // (a chunk spreads a little)
      }
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
    mark(px - (sz >> 1), py - (sz >> 1), sz);
  }
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
          );
        }
      },
      200 + (k * ms) / n,
    );
}
