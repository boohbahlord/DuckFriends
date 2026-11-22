/* ---------- the silly commands (lightning, love, kill, hotdog) and the room's shots and blasts, as they are drawn ----------
   Moved out of game.js to keep that file small (a pure move). It imports back from game.js, which imports it. */
import {
  JUSTIN2,
  R,
  RECOIL,
  S,
  bigOf,
  bloodBurst,
  boomShake,
  follows,
  frameNo,
  geo,
  hotdogs,
  me,
  neckSpray,
  podLift,
  setRecoil,
  shows,
  toScreen,
  world,
} from "./game.js";
import { place } from "./gameboard.js";
import { heard } from "./gamehand.js";
import { CHAIR, TRACE } from "./gunart.js";

import { el, $ } from "./ui.js";

import { isLaw, KB_LAND } from "./rules.js";

import { W as HW, H as HH } from "./hangout/layout.js";

import { zOf } from "./heights.js";

import { grenadeBoom } from "./grenade.js";

import { confettiRain, pressFX } from "./specials.js";

import { heatUp, heldOn } from "./barrelheat.js";

import { BEAM } from "./laserart.js";

import { isL4dd, inHand } from "./l4ddrules.js";

import { ARMS, BOARD_WEAPONS, AUTO } from "./guns.js";

import { l4Got } from "./l4dd.js";

import { isSb, boardDuck, sbSfx, sbCellMids } from "./sandboxrules.js";

import { duckSVG } from "./duck.js";

import { seenDuck } from "./looks.js";

import { justinAt, justinShown, JUSTIN_ID } from "./boardjustin.js";

import { sfx } from "./sound.js";

import { now as clockNow } from "./clock.js";

import { isMgj, MGJ_SCALE } from "./mgjrules.js";

import { POOF, TELEPORT, HITMARK, edgeHTML } from "./mgjart.js";

import { dropMeteor, CONTROLLER } from "./mgj.js";

import {
  fxImpact,
  fxSmolder,
  fxSteam,
  fxSparks,
  fxMelee,
  fxBurst,
  fxMuzzle,
  fxFlame,
  fxGroundFire,
  fxGround,
  fxBlood,
  heavyOff,
  MUZZLE,
} from "./fx.js";

import { FLAME as FLAMER, flameRate, band } from "./flamer.js";

import { low } from "./gfx.js";

import { kick, shake, vibrate, VIB } from "./fxmotion.js";

/* ---------- the silly commands: lightning, love, kill, hotdog ---------- */
const HOTDOG = `<svg viewBox="-34 -24 68 30" width="100%"><path d="M-24-13C-26-18-20-21-12-19L14-19C22-21 27-17 25-12Z" fill="#e2a65a" stroke="#1c1c28" stroke-width="1.6"/><rect x="-31" y="-17" width="62" height="10" rx="5" fill="#c0502b" stroke="#1c1c28" stroke-width="1.6"/><path d="M-24-13l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3" stroke="#f2c230" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-27-9C-28-1-20 2-10 2L10 2C20 2 28-1 27-9C18-6-18-6-27-9Z" fill="#eab36a" stroke="#1c1c28" stroke-width="1.6"/></svg>`;
/* a card's color, lifted when it's too dark to see on the name tag (a black card's meter showed black on black) */
export function seen(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return hex;
  const n = parseInt(m[1], 16),
    [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255);
  if (0.2126 * r + 0.7152 * g + 0.0722 * b >= 0.3) return hex;
  const hi = Math.max(r, g, b),
    lo = Math.min(r, g, b),
    c = hi - lo,
    h =
      c === 0
        ? 0
        : hi === r
          ? ((g - b) / c) % 6
          : hi === g
            ? (b - r) / c + 2
            : (r - g) / c + 4,
    sat = c === 0 ? 0 : Math.round((c / (1 - Math.abs(hi + lo - 1))) * 100);
  return `hsl(${Math.round(h * 60)} ${sat}% 62%)`;
}
/* a color that stands out inside a card's color: the opposite hue, light on a dark color and dark on a light one (the
   down meter's streaks) */
export function against(hex) {
  const l = /^hsl\(\d+ \d+% (\d+)%\)$/.exec(hex || "");
  if (l) return "#1c1c28"; // (a lifted dark card: dark streaks on it)
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16),
    [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255),
    hi = Math.max(r, g, b),
    lo = Math.min(r, g, b),
    c = hi - lo;
  const h =
    c === 0
      ? 0
      : hi === r
        ? ((g - b) / c) % 6
        : hi === g
          ? (b - r) / c + 2
          : (r - g) / c + 4;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return `hsl(${Math.round(h * 60 + 180)} 85% ${lum > 0.45 ? 22 : 88}%)`;
}
/* the flamethrowers firing (flamer.js), each frame: a stream out of each one's nozzle the way its gun points, as far as
   the room's state says it reaches, its pixels coming faster the longer it's held (an exponential growth); and every
   patch of burning ground flickering until it burns out. s.flame (s.hang.l4fl in Dead Ducks Arcade): { id: [the hold's
   start, its last puff, ux, uy, reach] }; s.gfire (s.hang.l4gf): [[x, y, until …]] (Dead Ducks Arcade's with its
   floor's height last: [x, y, until, by, h]) */
const FLAME_CARRY = new Map();
/* Sandbox: what a zone's working squares show (plan Phase 3, sandboxrules.js SB_SFX), on every screen: ground fire as
   the flamethrower's burning ground (each square a patch), or now and then a puff of smoke, steam or sparks on a few
   squares at random. spot(x, y, z) → its place on my screen, as the fire's */
function sbZoneLooks(s, spot, ground, size, half) {
  const pts = (s.sb && s.sb.pts) || {};
  for (const [id, p] of Object.entries(pts)) {
    const k = sbSfx(p);
    if (!["fire", "smoke", "steam", "sparks"].includes(k)) continue; // (a special's or a picture: sbspawnview.js sfxOn)
    const mids = sbCellMids(s, id, p, HW, HH, half < 1 ? 60 : 120),
      z = p.z || 0;
    for (const m of mids) {
      const a = spot(m.x, m.y, z);
      if (k === "fire") {
        ground.push([
          a.left,
          a.top,
          size * 0.45,
          false,
          m.c * 7919 + idSeed(id),
        ]);
        if (Math.random() < 0.02 * half)
          fxGroundFire(a.left, a.top, size * 0.4, 1);
      } else if (Math.random() < 0.03 * half) {
        if (k === "smoke") fxSmolder(a.left, a.top, size * 0.5, 1);
        else if (k === "steam") fxSteam(a.left, a.top, 1);
        else fxSparks(a.left, a.top, size * 0.3, 1);
      }
    }
  }
}
const idSeed = (id) =>
  [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
let flamesAt = 0;
export function flames(s, now, hang, size, fxl, heldAll) {
  const dt = Math.min(0.05, flamesAt ? (now - flamesAt) / 1000 : 0),
    l4 = isL4dd(s),
    [rx, ry] = hang ? [0.006, 0.012] : boardDuck(s),
    half = l4 && low() ? 0.5 : 1; // (Dead Ducks Arcade on Low graphics or Data saving: half the stream's pixels and half the burning ground's, on my screen only; the fire itself is the rules' and stays the same)
  flamesAt = now;
  const spot = (x, y, z) =>
    hang ? world.place({ x, y }, z) : place({ x, y }, 0, 1, true);
  for (const [id, f] of Object.entries((l4 ? s.hang.l4fl : s.flame) || {})) {
    const hd = heldAll.get(id),
      e = hd && heldOn(hd, fxl) && hd._end,
      p = s.pos[id];
    if (now - f[1] > 220 || !e || !p) {
      FLAME_CARRY.delete(id);
      continue;
    }
    const z = zOf(p),
      a = spot(p.x, p.y, z),
      b = l4
        ? spot(p.x + (f[2] * f[4]) / HW, p.y + (f[3] * f[4]) / HH, z)
        : spot(p.x + f[2] * f[4] * rx, p.y + f[3] * f[4] * ry, z),
      far = Math.hypot(b.left - a.left, b.top - a.top),
      want = flameRate(now - f[0]) * dt * half + (FLAME_CARRY.get(id) || 0),
      n = Math.floor(want);
    FLAME_CARRY.set(id, want - n);
    fxFlame(e[0], e[1], e[2], far, n, FLAMER.CONE, band);
  }
  /* the burning ground: each patch's little pixel flames (fx.js fxGround), and a few embers flying up off it */
  const ground = [];
  for (const g of (l4 ? s.hang.l4gf : s.gfire) || []) {
    const left = g[2] - now;
    if (left <= 0) continue;
    const a = l4
      ? spot(g[0] / HW, g[1] / HH, g[4] || 0) // (on its own floor: a roof's, or the ground)
      : spot(g[0], g[1], hang ? g[5] || 0 : 0);
    ground.push([
      a.left,
      a.top,
      size * 0.45,
      left < 1000, // (dying down in its last second)
      Math.round((g[0] * 7.31 + g[1]) * (l4 ? 1 : 1e4)), // (its own, from where it is: its flames keep their places)
    ]);
    if (!(half < 1 && frameNo % 2) && Math.random() < 0.5)
      fxGroundFire(a.left, a.top, size * 0.4, 1); // (half: its embers every other frame)
  }
  if (isSb(s)) sbZoneLooks(s, spot, ground, size, half);
  fxGround(ground);
}
/* my screen blinks in and out of crimson while it shakes (the flamethrower's fire on my duck, the owner's, Nov 16): a
   steady faint red instead with the heavy effects off (css/app.css html.crimson) */
let crimsonT = 0;
export function crimson(ms) {
  const root = document.documentElement;
  root.classList.add("crimson");
  root.classList.toggle("crimson-still", heavyOff());
  shake(0.4);
  clearTimeout(crimsonT);
  crimsonT = setTimeout(() => root.classList.remove("crimson"), ms);
}
/* the owner's three new guns (Nov 16 16:25Z), heard, each its own (sound.js): the double barrel's blast; the burst
   rifle's crack once for each of its three rounds; the flamethrower's fire, lit by its first puff and roaring while
   the puffs keep coming */
const NEW_GUN_SFX = {
  laser: (o) => sfx.laser(o),
  dbarrel: (o) => sfx.dbarrel(o),
  burst: (o) => {
    for (let i = 0; i < ARMS.burst.burst; i++)
      setTimeout(() => sfx.burst(o), i * ARMS.burst.gap);
  },
  flamer: (o) => sfx.flamer(o),
};
/* charred, then the burns fade in a few seconds; with flames first for `fire` ms (the fire special, not a grenade).
   lite: only a little (the Laser Rifle overheated, the owner's, Nov 19 19:27Z: "Player doesn't get the burnt effect as
   badly, just a little bit") */
function burn(dk, fire = 0, lite = false) {
  if (!dk) return;
  clearTimeout(dk._fireT);
  clearTimeout(dk._burnT);
  dk.classList.remove("burnt", "unburn", "onfire");
  dk.classList.toggle("burnt-lite", lite);
  dk.classList.add(fire ? "onfire" : "burnt");
  if (fire)
    dk._fireT = setTimeout(() => {
      dk.classList.remove("onfire");
      dk.classList.add("burnt");
    }, fire);
  dk._burnT = setTimeout(() => {
    dk.classList.remove("burnt", "burnt-lite");
    dk.classList.add("unburn");
    dk._burnT = setTimeout(() => dk.classList.remove("unburn"), 2600);
  }, fire + 2400);
}
/* Lawyering: an attorney ('off', the sword, or 'def', the shield) while their case is argued and talked over */
export const LAW_GLOW = 2400; // ms: one breath of the attorneys' glow (css/app.css law-glow)
export const lawRole = (s, id) =>
  isLaw(s) && s.law && ["answer", "discuss"].includes(s.phase)
    ? id === s.law.off
      ? "off"
      : id === s.law.def
        ? "def"
        : ""
    : "";
/* a short, see-through red flash on a duck: Justin hit, or a duck knocked down */
export const shooterBody = (id) => {
  const d = S && S.querySelector(`.gduck[data-pid="${CSS.escape(id)}"]`);
  return d && d.querySelector(".gduck-body");
};
export function hurt(d, px = 3, twice = false) {
  if (!d) return;
  const t = performance.now();
  if (!(t - (d._vibAt || 0) < 250))
    vibrate(d.querySelector(".gduck-body"), px, twice); // (once per hit, not twice when two rules see the same one)
  d._vibAt = t; // (a hit shakes it once, and once more as it goes down: the owner's, Nov 17, 32 and 34)
  /* the red flash started over: two copies of it, hurt and hurt-b (css/app.css), swapped, so the page doesn't measure
     itself for every hit (a crowd of zombies clawing one duck did, several times a frame) */
  const b = d.classList.contains("hurt");
  d.classList.toggle("hurt", !b);
  d.classList.toggle("hurt-b", b);
}
export function playFx(f) {
  const s = R.state,
    fxl = S && $(".fxl", S);
  if (!fxl || !geo) return;
  /* a small CRIT rising at (x, y), with no blood: a crit that didn't kill (Adam, Nov 21 18:31Z: every crit shows one) */
  const critMark = (x, y) => {
    const word = el(
      `<div class="l4-crit small" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px" aria-hidden="true">CRIT</div>`,
    );
    fxl.append(word);
    setTimeout(() => word.remove(), 1200);
  };
  const now = clockNow(),
    size = geo.size,
    posOf = (id) =>
      id === JUSTIN_ID
        ? justinShown(s) && justinAt(s.justin, now)
        : id === R.me && me
          ? me
          : s.pos[id];
  const spot = (id) => {
    const p = posOf(id);
    return p ? place(p.x < 0 ? { ...p, x: 0.5 } : p, 0, 1) : null;
  };
  if (f.kind === "lightning") {
    const at = spot(f.who[0]);
    if (!at) return;
    let d = `M${at.left + (Math.random() - 0.5) * 40} 0`,
      y = 0;
    const x0 = at.left,
      yEnd = at.top - size * (0.6 + podLift(s, f.who[0], now));
    while (y < yEnd - 30) {
      y += 24 + Math.random() * 30;
      d += `L${(x0 + (Math.random() - 0.5) * 46).toFixed(1)} ${Math.min(y, yEnd).toFixed(1)}`;
    }
    d += `L${x0} ${yEnd}`;
    const bolt = el(
      `<svg class="fx-bolt" width="${geo.W}" height="${geo.top0 + geo.H}"><path d="${d}" stroke="#fff6b0" stroke-width="7" fill="none" stroke-linejoin="bevel" opacity=".55"/><path d="${d}" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linejoin="bevel"/></svg>`,
    );
    const flash = el('<div class="fx-flash"></div>');
    fxl.append(bolt, flash);
    setTimeout(() => {
      bolt.remove();
      flash.remove();
    }, 700);
    const dk = S.querySelector(`.gduck[data-pid="${f.who[0]}"]`);
    if (dk) {
      dk.classList.add("zapped");
      setTimeout(() => dk.classList.remove("zapped"), 1400);
    }
    sfx.zap();
  } else if (f.kind === "love") {
    const a = spot(f.who[0]),
      b = spot(f.who[1]);
    if (!a || !b) return;
    const pa = s.players[f.who[0]],
      pb = s.players[f.who[1]];
    const x = (a.left + b.left) / 2,
      y = Math.min(a.top, b.top) - size * 0.4;
    const heart =
      el(`<div class="fx-heart" style="left:${x}px;top:${y}px;--rise:${(-y - 40).toFixed(0)}px"><svg viewBox="0 0 100 90" class="fx-heart-bg"><path d="M50 86C14 60 2 42 4 26 6 10 20 2 32 3c8 1 14 6 18 13 4-7 10-12 18-13 12-1 26 7 28 23 2 16-10 34-46 60z" fill="#ff4f8b" stroke="#fff" stroke-width="3"/></svg>
      <div class="fx-heart-ducks">${pa ? duckSVG(seenDuck(pa), { size: 40, shadow: false, title: pa.name }) : ""}${pb ? duckSVG(seenDuck(pb), { size: 40, shadow: false, title: pb.name }).replace("<svg ", '<svg style="transform:scaleX(-1)" ') : ""}</div></div>`);
    fxl.append(heart);
    setTimeout(() => heart.remove(), 4200);
    sfx.love();
  } else if (f.kind === "kill") {
    sfx.hit();
  } else if (f.kind === "boom") {
    // a grenade went off: the blast where it landed, and the ducks it caught burnt for a while (their hit sound comes
    // as they go down)
    const board = $(".board", S);
    if (!board) return;
    const at = geo.hang
      ? world.place({ x: f.x, y: f.y }, f.hz || 0)
      : place({ x: f.x, y: f.y }, 0, 1, true);
    grenadeBoom(fxl, board, at, size * (f.wide || 1));
    boomShake(at, f.wide || 1);
    (f.wide > 1 ? sfx.boomBig : f.wide < 1 ? sfx.boomSmall : sfx.boom)(
      geo.hang ? { x: f.x * HW, y: f.y * HH } : {},
    ); // (a smaller blast, as the Angelic pistol's, its own, weaker)
    if (geo.hang)
      for (const [x, y] of f.gore || []) {
        const z = world.place({ x: x / HW, y: y / HH }, 0);
        bloodBurst(
          z.left,
          z.top - size * 0.4,
          12,
          Math.PI * 2,
          size * 0.3,
          size * 0.6,
        ); // (Quacky Zombies: blood out of every zombie it got)
      }
    for (const id of f.hit) {
      const dk = S.querySelector(`.gduck[data-pid="${CSS.escape(id)}"]`);
      if (id === JUSTIN_ID && isMgj(s)) {
        hurt(dk);
        sfx.hit();
      }
      burn(dk);
    }
  } else if (f.kind === "hit") {
    // the knife or the hammer touched someone after the press, while it swung
    const by = S.querySelector(`.gduck[data-pid="${CSS.escape(f.by)}"]`);
    for (const id of f.hit || []) fxMelee(id, f.what, by && by._at); // (its blood: fx.js fxHitAt)
    if (f.hit.includes(JUSTIN_ID) && isMgj(s)) {
      hurt(S.querySelector(`.gduck[data-pid="${JUSTIN_ID}"]`));
      sfx.hit();
    }
    if (f.what === "hammer") setTimeout(() => sfx.bonk(), KB_LAND);
  } else if (f.kind === "use") {
    // an item at its duck, moving with it (drawDucks places it each frame)
    if (f.what === "confetti") {
      confettiRain(4500);
      return;
    } // confetti over everyone's screen
    if (!spot(f.by)) return;
    if (f.what === "controller" || f.what === "chair") {
      (f.what === "chair" ? sfx.chair : sfx.throw)(heard(f.by));
      return;
    } // (Mad God Justin's throws: they fly from the room's state)
    if (isL4dd(s) && ARMS[f.what]) {
      if (inHand(f.what))
        shows[f.by] = {
          what: f.what,
          t: now,
          until: now + (f.what === "knife" ? 350 : 700),
          ax: f.ax || f.face || 1,
          ay: f.ay || 0,
        };
      ({
        handgun: sfx.handgun,
        bow: sfx.bow,
        knife: sfx.knife,
        hammer: sfx.hammer,
        axe: sfx.axe,
        sword: sfx.sword,
        pan: sfx.pan,
        dagger: sfx.throw,
        shotgun: sfx.shotgun,
        medkit: sfx.medkit,
        grenade: sfx.throw,
        sniper: sfx.sniper,
        revolver: sfx.revolver,
        smg: sfx.smg,
        tommy: sfx.tommy,
        ump: sfx.ump,
        ak: sfx.ak,
        lmg: sfx.lmg,
        chaingun: sfx.chaingun,
        glauncher: sfx.glauncher,
        ...NEW_GUN_SFX,
        zebra: sfx.cakeThrow,
        adrenaline: sfx.adrenaline,
      })[f.what]?.(heard(f.by));
      return;
    } // (Quacky Zombies: the weapon turns toward the aim; the shot flies from the room's state)
    if (f.what === "zebra") {
      sfx.cakeThrow(heard(f.by));
      return;
    } // (Mad God Justin's zebra cake: it flies from the room's state)
    if (f.what === "shotgun") {
      // Mad God Justin's shotgun: the blast, then the pump
      shows[f.by] = {
        what: "shotgun",
        t: now,
        until: now + 900,
        ax: f.ax || f.face || 1,
        ay: f.ay || 0,
      };
      sfx.shotgun(heard(f.by));
      setTimeout(() => sfx.pump(heard(f.by)), 520);
      return;
    }
    if (
      isMgj(s) &&
      f.by === JUSTIN_ID &&
      (f.what === "lmg" || f.what === "smg")
    ) {
      // Mad God Justin's LMG and SMG (in place of his pistol): turned toward each bullet's aim, the quick rattle
      shows[f.by] = {
        what: f.what,
        t: now,
        until: now + 400,
        ax: f.ax || f.face || 1,
        ay: f.ay || 0,
      };
      if (s.mgj && s.mgj.dup)
        shows[JUSTIN2] = {
          ...shows[f.by],
          ax: -shows[f.by].ax,
          ay: -shows[f.by].ay,
        }; // (his double does the same, mirrored)
      (f.what === "lmg" ? sfx.lmg : sfx.smg)(heard(f.by));
      return;
    }
    if (BOARD_WEAPONS.includes(f.what)) {
      if ((f.hit || []).includes(JUSTIN_ID) && isMgj(s)) {
        hurt(S.querySelector(`.gduck[data-pid="${JUSTIN_ID}"]`));
        sfx.hit();
      } // (Mad God Justin stabbed: he flashes red, and the hit sound; anyone else flashes as they go down)
      shows[f.by] = {
        what: f.what,
        t: now,
        until:
          now +
          ({
            dagger: 900,
            grenade: 900,
            knife: 700,
            hammer: 1000,
            axe: 1000,
            sword: 600,
            pan: 1000,
            burst: 700,
          }[f.what] || (AUTO.includes(f.what) ? 500 : 1400)),
        ax: f.ax || f.face || 1,
        ay: f.ay || 0,
      };
      if (f.by === JUSTIN_ID && isMgj(s) && s.mgj && s.mgj.dup)
        shows[JUSTIN2] = {
          ...shows[f.by],
          ax: -shows[f.by].ax,
          ay: -shows[f.by].ay,
        }; // (his double does the same, mirrored)
      (
        ({
          handgun: sfx.handgun,
          bow: sfx.bow,
          sniper: sfx.sniper,
          revolver: sfx.revolver,
          smg: sfx.smg,
          tommy: sfx.tommy,
          ump: sfx.ump,
          ak: sfx.ak,
          lmg: sfx.lmg,
          chaingun: sfx.chaingun,
          glauncher: sfx.glauncher,
          ...NEW_GUN_SFX,
          shotgun: sfx.shotgun,
          knife: sfx.knife,
          hammer: sfx.hammer,
          axe: sfx.axe,
          sword: sfx.sword,
          pan: sfx.pan,
        })[f.what] || sfx.throw
      )(heard(f.by)); // (the dagger and the grenade: thrown) // (every gun its own sound, as in Dead Ducks Arcade)
      if (f.what === "hammer" && f.hit && f.hit.length)
        setTimeout(() => sfx.bonk(), KB_LAND); // (the hammer's duck landed; a knife's hit is the hit sound as it goes down)
      return;
    } // (it turns toward the aim; the bullet or the dagger flies from the room's state)
    const wrap = el('<div class="spe-follow"></div>');
    wrap.append(
      ...pressFX(f.what, 0, 0, size, f.face || 1, (s.players[f.by] || {}).duck),
    );
    fxl.append(wrap);
    follows.push({ id: f.by, el: wrap, until: now + 2200, face: f.face || 1 });
    ({
      coffee: sfx.sip,
      hotdog: sfx.chomp,
      watergun: sfx.splash,
      confgun: sfx.pop,
      handgun: sfx.handgun,
      sound: sfx.quack,
      trombone: sfx.trombone,
    })[f.what]?.(heard(f.by));
  } else if (f.kind === "fire") {
    // flames for a moment, then charred; the burns fade in a few seconds
    const dk = S.querySelector(`.gduck[data-pid="${f.who[0]}"]`);
    if (!dk) return;
    burn(dk, 1600);
    sfx.fire(heard(f.who[0]));
  } else if (f.kind === "meteor") {
    // Mad God Justin's meteor, onto the middle of the board
    const board = $(".board", S);
    if (!board) return;
    dropMeteor(
      fxl,
      board,
      place(f.x != null ? { x: f.x, y: f.y } : { x: 0.5, y: 0.55 }, 0, 1),
      f.small ? size * 0.6 : size,
      f.land - now,
    );
    sfx.meteor(Math.max(0.15, (f.land - now) / 1000));
  } else if (f.kind === "pump") {
    // he's back, with the shotgun
    sfx.pump();
  } else if (f.kind === "xboff") {
    sfx.tick(); // (Mad God Justin turns his Xbox off: a click, and the light and the screen go dark)
  } else if (f.kind === "mgjtell") {
    // Mad God Justin holds up what he's about to throw: the controllers, or the chair over his head
    const lift = S.querySelector(`.gduck[data-pid="${JUSTIN_ID}"] .gduck-lift`),
      left = (f.until || 0) - now;
    if (!lift || left <= 0) return;
    const up = el(
      `<div class="mgj-tellup k-${f.what}" style="--tell:${left}ms">${f.what === "chair" ? CHAIR : CONTROLLER.repeat(2)}</div>`,
    );
    lift.append(up);
    setTimeout(() => up.remove(), left);
    sfx.boop();
  } else if (f.kind === "mgjcharge") {
    // Mad God Justin about to charge a duck: he shakes, flushed red, for the tell (his double too)
    const left = (f.until || 0) - now;
    if (left <= 0) return;
    for (const pid of [JUSTIN_ID, JUSTIN2]) {
      const d = S.querySelector(`.gduck[data-pid="${pid}"]`);
      if (!d) continue;
      d.classList.add("mgj-charge");
      setTimeout(() => d.classList.remove("mgj-charge"), left);
    }
    sfx.boop();
  } else if (f.kind === "mgjbonk") {
    sfx.bonk(); // (his charge sent a duck flying)
  } else if (f.kind === "pickup") {
    sfx.pop(); // (Mad God Justin: a weapon picked up)
  } else if (f.kind === "teleport") {
    // Mad God Justin's blue flash where he leaves and where he lands (his double: where it shows up)
    for (const [x, y] of f.dup
      ? [[f.x, f.y]]
      : [
          [f.x0, f.y0],
          [f.x, f.y],
        ]) {
      const at = place({ x, y }, 0, 1),
        n = el(
          `<div class="mgj-tp" style="left:${at.left.toFixed(1)}px;top:${at.top.toFixed(1)}px;width:${(size * 1.6).toFixed(0)}px">${TELEPORT}</div>`,
        );
      fxl.append(n);
      setTimeout(() => n.remove(), 600);
    }
    sfx.teleport();
  } else if (f.kind === "hitmark") {
    // a hit on Justin, his double (the same marker: the owner's): the hitmarker
    const at = geo.hang
        ? world.place({ x: f.x, y: f.y }, f.hz || 0)
        : place({ x: f.x, y: f.y }, 0, 1),
      n = el(
        `<div class="mgj-hit" style="left:${at.left.toFixed(1)}px;top:${(at.top - size * 0.5 * MGJ_SCALE).toFixed(1)}px;width:${(size * 0.55).toFixed(0)}px">${HITMARK}</div>`,
      );
    fxl.append(n);
    setTimeout(() => n.remove(), 500);
  } else if (f.kind === "poof") {
    // Good Justin God gone in a cloud
    const at = place({ x: f.x, y: f.y }, 0, 1),
      n = el(
        `<div class="mgj-poof" style="left:${at.left.toFixed(1)}px;top:${(at.top - size * 0.4).toFixed(1)}px;width:${(size * 1.3).toFixed(0)}px">${POOF}</div>`,
      );
    fxl.append(n);
    setTimeout(() => n.remove(), 800);
    sfx.puff();
  } else if (f.kind === "revive") {
    // a downed duck got up (held 5 s by another: the owner's, in place of the medkit): a pop
    sfx.pop();
  } else if (f.kind === "l4line") {
    /* the chain gun's shot: thin yellow lines popping in and out, all from the end of its barrel: one out to what it
       hit, and one or two shorter ones pointing a little off to the sides */
    if (!geo.hang && !f.b) return;
    /* a shot that went on past the board's edge: place() only knows the board (it pins a spot off it to the edge, or
       to where ducks start), so I aim the line by a short step along it, still on the board, and it runs on that way
       past the screen's edge */
    const off = (v) => v < 0 || v > 1,
      past = !!f.b && (off(f.x1) || off(f.y1)),
      step = past
        ? Math.min(
            0.05 / (Math.hypot(f.x1 - f.x0, f.y1 - f.y0) || 1),
            ...[
              [f.x0, f.x1],
              [f.y0, f.y1],
            ].map(([v0, v1]) =>
              v1 > v0 ? (1 - v0) / (v1 - v0) : v1 < v0 ? v0 / (v0 - v1) : 1,
            ),
          )
        : 1;
    const a = f.b
        ? place({ x: f.x0, y: f.y0 }, 0, 1)
        : world.place({ x: f.x0 / HW, y: f.y0 / HH }, f.hz || 0),
      b = f.b
        ? place(
            {
              x: f.x0 + (f.x1 - f.x0) * step,
              y: f.y0 + (f.y1 - f.y0) * step,
            },
            0,
            1,
          )
        : world.place({ x: f.x1 / HW, y: f.y1 / HH }, f.hz || 0),
      up = size * 0.41 * (R.state ? bigOf(R.state, f.by) : 1), // (from its gun, at its duck's Size)
      kind = f.w === "laser" ? "laser" : "chaingun", // (the Laser Rifle's beam: one red line, laserart.js BEAM)
      hd = fxl._held && fxl._held.get(f.by),
      gun = heldOn(hd, fxl) && hd.dataset.w === kind ? hd : null,
      [x0, y0, aim] = (gun && gun._tip) || [
        a.left,
        a.top - up,
        Math.atan2(b.top - a.top, b.left - a.left),
      ];
    let ang = past
        ? Math.atan2(b.top - a.top, b.left - a.left)
        : Math.atan2(b.top - up - y0, b.left - x0),
      far = past
        ? Math.hypot(geo.W, geo.H) * 1.5
        : Math.hypot(b.left - x0, b.top - up - y0);
    if (!past && Math.cos(ang - aim) < 0.5) {
      // (what it hit is beside the barrel or behind its end: the lines still only go forward)
      ang = aim;
      far = size * 0.8;
    }
    const lz = kind === "laser",
      [c, g, ms] = lz
        ? [BEAM.color, BEAM.glow, BEAM.ms]
        : [TRACE.color, TRACE.glow, TRACE.ms];
    const line = (turn, long, wait) => {
      const n = el(
        `<div class="l4-line${lz ? " l4-beam" : ""}" style="left:${x0.toFixed(1)}px;top:${y0.toFixed(1)}px;width:${long.toFixed(1)}px;transform:rotate(${(ang + turn).toFixed(3)}rad);--c:${c};--g:${g};--core:${BEAM.core};--ms:${ms}ms;animation-delay:${wait.toFixed(0)}ms"></div>`,
      );
      fxl.append(n);
      setTimeout(() => n.remove(), ms + wait + 40);
    };
    line(0, far, 0);
    fxMuzzle(x0, y0, ang, kind);
    kick(f.by, kind, now);
    if (!lz) heatUp(f.by, "chaingun"); // (and the chain gun's; the Laser Rifle's heat is the room's: laserfx.js)
    vibrate(shooterBody(f.by), VIB[kind]);
    if (f.by === R.me) {
      shake(MUZZLE[kind].shake);
      if (!lz)
        setRecoil({
          until: performance.now() + RECOIL.MS,
          dx: f.x0 - f.x1,
          dy: f.y0 - f.y1,
        });
    }
    if (lz) {
      /* the beam went through every zombie on its line: each bleeds as it loses its HP (fx.js fxHitAt), and smokes and
         steams where it went through (fx.js fxSmolder; no recoil or shake from it: the owner's, Nov 17 17:41Z) */
      for (const [hx, hy] of f.hit || []) {
        const at = world.place({ x: hx / HW, y: hy / HH }, f.hz || 0);
        fxImpact(at.left, at.top, "laser", Math.cos(ang), Math.sin(ang));
        fxSmolder(at.left, at.top, size * 0.5);
      }
      /* the other modes: it stopped at a duck (hd), which smokes and steams the same */
      if (f.hd && !past) fxSmolder(b.left, b.top, size * 0.5);
      return;
    }
    if (!past)
      fxImpact(
        x0 + Math.cos(ang) * far,
        y0 + up + Math.sin(ang) * far,
        "chaingun",
        Math.cos(ang),
        Math.sin(ang),
      ); // (its flash, smoke and kick; what it hit bleeds as a chain gun's: fx.js)
    for (let i = Math.random() < 0.5 ? 1 : 2; i > 0; i--)
      line(
        (Math.random() - 0.5) * TRACE.spread,
        far * (0.25 + Math.random() * 0.5),
        Math.random() * 30,
      );
  } else if (f.kind === "l4hot") {
    /* a Laser Rifle overheated: its hiss, and its duck burnt and shaking a moment (no damage; the owner's, Nov 17:
       "the toasted charred look already existent"); laserfx.js shows the fire pixels and the steam off the gun */
    sfx.laserHiss(heard(f.by));
    const dk = S.querySelector(`.gduck[data-pid="${CSS.escape(f.by)}"]`);
    if (dk) {
      burn(dk, 0, true);
      clearTimeout(dk._joltT);
      dk.classList.add("l4-jolt"); // (already jolting: it lasts longer; its jitter needs no start over, no layout)
      dk._joltT = setTimeout(() => dk.classList.remove("l4-jolt"), 1400);
    }
    if (f.by === R.me) shake(0.25);
  } else if (f.kind === "slug") {
    /* the double barrel's slug got something: chunks and blood blown on through it the way the slug flew, and out of a
       crit's head more blood and chunks than any other crit's (Dead Ducks Arcade: f.gore, [x, y, crit] in the world;
       elsewhere the duck it killed, where it stood before it flew) */
    const [dx, dy] = toScreen(f.ax, f.ay),
      spots = f.gore
        ? geo.hang
          ? f.gore.map(([x, y, c]) => [
              world.place({ x: x / HW, y: y / HH }, 0),
              c,
            ])
          : []
        : (f.who || [])
            .map((id) => {
              const p = s.pos[id],
                o = p && p.kb ? { x: p.kb.x, y: p.kb.y } : p;
              return o
                ? [geo.hang ? world.place(o, zOf(p)) : place(o, 0, 1), f.crit]
                : null;
            })
            .filter(Boolean);
    for (const [a, crit] of spots) {
      fxBlood(a.left, a.top, size * 0.45, "slug", dx, dy);
      fxBurst(a.left, a.top, size * 0.45, 8, 6); // (chunks blown out of it)
      if (crit) {
        bloodBurst(
          a.left,
          a.top - size * 0.78,
          30,
          2.6,
          size * 0.3,
          size * 0.6,
        );
        fxBurst(a.left, a.top - size * 0.28, size * 0.78, 10, 8);
        neckSpray(a.left + size * 0.12, a.top - size * 0.5);
        neckSpray(a.left + size * 0.12, a.top - size * 0.5);
      } // (the head blown off: twice the spray)
    }
  } else if (f.kind === "scorch") {
    // the flamethrower's fire on a duck: it flames a moment, then it's charred, and on my own screen a crimson blink
    for (const id of f.who || [])
      burn(S.querySelector(`.gduck[data-pid="${CSS.escape(id)}"]`), 700);
    if ((f.who || []).includes(R.me)) crimson(1100);
  } else if (f.kind === "l4crit") {
    /* a headshot in Quacky Zombies: its head bursts in blood (l4ddart.js draws it headless after) and a CRIT rises over
       it, so it's never missed (owner 2026-11-04 04:01Z), smaller since (the owner's, Nov 4) */
    if (!geo.hang && !f.b) return;
    const a = f.b
        ? place({ x: f.x, y: f.y }, 0, 1)
        : world.place({ x: f.x / HW, y: f.y / HH }, 0),
      top = a.top - size * 0.78; // (f.b: on a board, Mad God Justin's zombies; mgjrules.js mgjZombieHit)
    if (f.m) return critMark(a.left, top - size * 0.3); // (a crit that didn't kill: only the small CRIT)
    sfx.gore(f.b ? {} : { x: f.x, y: f.y }); // (a gush of gore: the owner's, Nov 17 12:28Z)
    bloodBurst(a.left, top, 12, 2.6, size * 0.3, size * 0.5); // (a smaller burst than it was, as a duck's crit: the owner's, Nov 4)
    neckSpray(a.left + size * 0.12, a.top - size * 0.5); // (then blood keeps spurting out of its neck for a moment)
    const word = el(
      `<div class="l4-crit" style="left:${a.left.toFixed(1)}px;top:${(top - size * 0.35).toFixed(1)}px" aria-hidden="true">CRIT</div>`,
    );
    fxl.append(word);
    setTimeout(() => word.remove(), 1200);
  } else if (f.kind === "l4miss") {
    /* a miss in Dead Ducks Arcade (the owner's, Nov 16 21:47Z): "missed", small and white over that zombie, rising and
       fading as the HP numbers do */
    if (!geo.hang && !f.b) return;
    sfx.miss(f.b ? {} : { x: f.x, y: f.y }); // (a wispy blip: the owner's, Nov 17 12:28Z)
    const a = f.b
        ? place({ x: f.x, y: f.y }, 0, 1)
        : world.place({ x: f.x / HW, y: f.y / HH }, 0),
      word = el(
        `<div class="l4-miss" style="left:${a.left.toFixed(1)}px;top:${(a.top - size * 1.05).toFixed(1)}px" aria-hidden="true">missed</div>`,
      );
    fxl.append(word);
    setTimeout(() => word.remove(), 1100);
  } else if (f.kind === "l4drop") {
    l4Got(f.k); // (a drop was taken: its name for everyone)
  } else if (f.kind === "l4bite") {
    sfx.chomp(); // (a zombie ate the zebra cake)
  } else if (f.kind === "pcrit") {
    /* a crit on a duck (wounds.js): its head bursts in blood, its neck spurts a moment, and a CRIT smaller than Quacky
       Zombies' rises over it */
    const a = geo.hang
        ? world.place({ x: f.x, y: f.y }, f.hz || 0)
        : place({ x: f.x, y: f.y }, 0, 1),
      top = a.top - size * 0.78;
    if (f.m) return critMark(a.left, top - size * 0.3); // (a crit that didn't put it down: only the small CRIT)
    sfx.gore(geo.hang ? { x: f.x * HW, y: f.y * HH } : {}); // (a gush of gore: the owner's, Nov 17 12:28Z)
    bloodBurst(a.left, top, 12, 2.6, size * 0.3, size * 0.5);
    neckSpray(a.left + size * 0.12, a.top - size * 0.5);
    const word = el(
      `<div class="l4-crit small" style="left:${a.left.toFixed(1)}px;top:${(top - size * 0.3).toFixed(1)}px" aria-hidden="true">CRIT</div>`,
    );
    fxl.append(word);
    setTimeout(() => word.remove(), 1200);
  } else if (f.kind === "eat") {
    sfx.chomp();
  } else if (f.kind === "edge") {
    // the edge lightning strikes (its glow before it: drawEdge)
    const board = $(".board", S);
    if (!board) return;
    board.querySelector(".mgj-edge.warn")?.remove();
    const n = el(edgeHTML("zap"));
    board.append(n);
    setTimeout(() => n.remove(), 400);
    sfx.zap();
  } else if (f.kind === "hotdog") {
    const node = el(
      `<div class="fx-hotdog" style="width:${(size * 0.8).toFixed(0)}px">${HOTDOG}</div>`,
    );
    fxl.append(node);
    hotdogs.push({ id: f.who[0], el: node, until: now + 7000 });
    sfx.hotdog();
  }
}
