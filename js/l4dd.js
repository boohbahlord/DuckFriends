/* ---------- Quacky Zombies on every screen ----------
   Duck Cabin's world draws it (an activity that runs only in this mode, registry.js): the zombies where the host says
   (gliding between its heartbeats), their thin HP bars, a red blink when hit, the claw's swipe, lying down and fading
   when they die; the boards over the openings; the extra candles; the dark over everything (the power is cut) with the
   fires, the candles and every duck's flashlight cut out of it (a cone the way it aims, stopped by the walls); "Round N"
   at the top, my points under it (a +N pops up for each one earned); the end. Hold E by a downed duck to revive it, or
   by an opening to board it up; key 0 switches my flashlight. Justin's Butler stands by the card table: E by him opens
   his shop. E at the fireplace spins it for a weapon: it flickers through them over the fire, lands on one, and E takes
   it (a ranged one only with a ranged weapon in hand to swap: else big words and a buzz say so). My duck walks at half
   speed (Speed: 10% faster) and has 7 seconds of sprint (a thin blue bar under my name). The rules are the host's
   (l4ddrules.js); the weapons bar is l4ddbar.js. */
import { activity } from "./hangout/registry.js";
import {
  CABIN,
  DECK,
  STAIRS,
  inCabin,
  sortY,
  heightAt,
  W,
  H,
  LIGHTS,
  PROPS,
} from "./hangout/layout.js";
import { sway, stutterOf, lightNow } from "./hangout/flicker.js";
import { play, setListener } from "./hangout/sounds.js";
import { svgDataURL } from "./hangout/art.js";
import { butlerSVG, justinSVG } from "./hangout/npcart.js";
import { FLAME, TELEPORT } from "./mgjart.js";
import { rainbowHTML } from "./art.js";
import { low } from "./gfx.js";
import { nameHTML } from "./name.js";
import { profile, save, statMode } from "./store.js";
import { sfx } from "./sound.js";
import { l4Hear, l4Steps, l4Reset } from "./l4ddsfx.js";
import { now as clockNow } from "./clock.js";
import {
  L4,
  OPENINGS,
  playable,
  zombiesOf,
  startSpot,
  SHOP,
  priceOf,
  upOf,
  ptsOf,
  slotsOf,
  BUTLER,
  BOX,
  POOL,
  boxNow,
  HELPER,
  weaponName,
  priceFor,
  saleOn,
  dropName,
  TOILET,
  waitNeed,
  waitVotes,
  isR16,
  GUN_SHOP,
  gunPrice,
  AMMO_PRICE,
  kitOf,
} from "./l4ddrules.js";
import { touchOnly } from "./pointer.js";
import { catalogHTML } from "./l4ddcatalog.js";
import { DROP_ICONS } from "./l4dddrops.js";
import { popHP } from "./hpmeter.js";
import {
  zombieURL,
  zombieBox,
  CANDLE,
  CANDLE_BOX,
  boardsSVG,
  boardsBox,
  orbHTML,
  UP_ICONS,
} from "./l4ddart.js";

const RX = 56,
  RY = 25.6; // (a zombie's room on the floor, as the rules')
const SPEED = 0.6 * 1.05; // my duck at 63% of Duck Cabin's walk: I wanted it 20% faster than the half it was, then 5% more (Nov 3; sprint goes from it)
const DARK = 0.84; // how dark the dark is: still dark, but I wanted it a little lighter than 0.93
const CONE = { far: 560, half: (27 * Math.PI) / 180 }; // the flashlight: how far, and half its width
const GLOW = 80; // world px: the faint light round every duck
const CANDLE_LIGHT = { r: 190, k: 0.62, flick: 1 };
/* where each opening's moonlight falls: just inside its wall (the deck's stairs: on their top) */
const MOON = Object.fromEntries(
  OPENINGS.map((o) => {
    const k =
      o.kind === "stairs"
        ? 0
        : Math.sign(o.axis === "y" ? o.in[0] - o.x : o.in[1] - o.y);
    return [o.id, o.axis === "y" ? [o.x + k * 36, o.y] : [o.x, o.y + k * 36]];
  }),
);
const P4 = (s, id) => ((s && s.hang && s.hang.l4p) || {})[id] || null;
const BUTLER_NAME = "Justin's Butler";
const NEAR = 130; // world px: how near E works at the Butler and the fireplace
const AWAY = 260; // walked this far off: his shop closes
/* the weapon in my hand (game.js tells me how to ask) */
let heldFn = () => "";
export const l4Held = (f) => (heldFn = f);
const up = (s, id) => {
  const p = P4(s, id);
  return !!p && !p.dn && !p.gh;
};

/* ---------- the walls, for the flashlights: their boxes on the floor ---------- */
const WALLS = PROPS.filter((p) => p.kind === "wall" && p.block).map(
  (p) => p.block,
); // [x0, y0, x1, y1]
/* how far a ray from (x, y) along (dx, dy) goes before a wall, at most far */
function rayTo(x, y, dx, dy, far) {
  let best = far;
  for (const [x0, y0, x1, y1] of WALLS) {
    let t0 = 0,
      t1 = best;
    if (Math.abs(dx) < 1e-9) {
      if (x < x0 || x > x1) continue;
    } else {
      let a = (x0 - x) / dx,
        b = (x1 - x) / dx;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
    }
    if (Math.abs(dy) < 1e-9) {
      if (y < y0 || y > y1) continue;
    } else {
      let a = (y0 - y) / dy,
        b = (y1 - y) / dy;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
    }
    if (t0 <= t1 && t0 > 0 && t0 < best) best = t0;
  }
  return best;
}

/* where an opening's boards sort: just in front of the wall piece they're on. A side wall's pieces sort by their own
   front, and a piece's top shows CABIN.wall higher up the screen than its foot, so a hole's boards go in front of every
   piece of that wall whose top covers them */
const WALL_PROPS = PROPS.filter((p) => p.kind === "wall" && p.block);
const boardKey = (o) => {
  const on = (p) => o.x >= p.block[0] - 1 && o.x <= p.block[2] + 1,
    reach = o.axis === "y" ? o.half + 14 : 0,
    up = o.axis === "y" ? CABIN.wall : 0,
    keys = WALL_PROPS.filter(
      (p) =>
        on(p) &&
        p.block[1] - 1 <= o.y + reach + up &&
        p.block[3] + 1 >= o.y - reach,
    ).map((p) => p.key);
  return (
    Math.round(keys.length ? Math.max(...keys) + 1 : sortY(o.x, o.y + 16, 0)) +
    10
  );
};

/* ---------- what this screen keeps ---------- */
const Z = new Map(); // zombie number → how it's drawn here
const B = new Map(); // opening id → its boards' element
const C = []; // the candles' elements
const D = new Map(); // a drop's number → its element
const DROP_LIGHT = { r: 120, k: 0.55 }; // the light round a drop on the floor
const DROP_ENDING = 10000; // ms: a drop blinks in its last 10 s
let layer = null,
  fxl = null,
  cv = null,
  g = null,
  hud = null,
  endEl = null, // the End turn button between rounds (Ready in round 0)
  endSig = "",
  over = null,
  zpSig = "",
  snapAt = 0,
  gap = 200,
  roundShown = -1, // (none yet)
  overShown = "",
  candleSig = "",
  stamina = 1,
  tired = false,
  holding = null,
  walkDir = [1, 0],
  lastXY = null,
  drawn = "";
/* the Butler, the fireplace's weapon, my points, the big words, his shop */
/* my sprint left (0 … 1) and whether I'm too tired to sprint, for the HP meter's blue bar (game.js) */
export const sprintLeft = () => [stamina, tired];
let butler = null,
  onEl = null,
  onSig = "",
  gotEl = null,
  boxEl = null,
  ptsEl = null,
  sayEl = null,
  shop = null,
  ptsShown = -1,
  boxSig = "",
  boxSpun = false,
  upSig = "",
  slotSig = "";

const LIT = {
  in: LIGHTS.filter((l) => l.only === "in" && !l.el),
  out: LIGHTS.filter((l) => l.only !== "in" && !l.el),
};

function zombieEl(z) {
  const el = document.createElement("div"),
    box = zombieBox(z.l);
  el.className = "l4z";
  el.innerHTML = `<div class="l4z-body"><img alt="" draggable="false" src="${zombieURL(z.l, z.i)}"></div><span class="l4z-hp"><i></i></span>`;
  const body = el.firstChild;
  body.style.width = box.w + "px";
  body.style.height = box.h.toFixed(1) + "px";
  body.style.left = (-box.w / 2).toFixed(1) + "px";
  body.style.top = (-box.feet).toFixed(1) + "px";
  body.style.transformOrigin = `${box.w / 2}px ${box.feet.toFixed(1)}px`;
  layer.append(el);
  return {
    el,
    body,
    bar: el.querySelector(".l4z-hp i"),
    x: z.x,
    y: z.y,
    fx: z.x,
    fy: z.y,
    tx: z.x,
    ty: z.y,
    t0: 0,
    face: 1,
    hp: z.hp,
    st: z.st,
    a: z.a,
    sh: "",
    hits: "",
    img: body.firstChild,
  };
}
function claw(x, y, dir, ctx) {
  if (!fxl) return;
  const px = x + Math.cos(dir) * 44,
    py = y + Math.sin(dir) * 22,
    f = ctx.world.toScreen(px, py, heightAt(px, py) + 36),
    el = document.createElement("div");
  el.className = "hang-npc-claw l4-claw";
  el.innerHTML =
    '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 6C16 16 18 26 14 36M19 4C25 14 27 24 23 34M28 6C34 16 36 26 32 36" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>';
  el.style.left = f.left.toFixed(1) + "px";
  el.style.top = f.top.toFixed(1) + "px";
  el.style.setProperty("--k", (ctx.world.sc * 1.25).toFixed(3)); // (a little bigger than the cats')
  fxl.append(el);
  setTimeout(() => el.remove(), 1100);
  play("swipe", { x: px, y: py });
}
/* the zombies in a new state: where each glides to, its hits, its swipes, its death */
function seeZombies(s, ctx, now) {
  const zs = zombiesOf(s),
    sig = (s.hang.zp || []).join();
  const fresh = sig !== zpSig;
  if (fresh) {
    gap = Math.max(120, Math.min(400, snapAt ? now - snapAt : 200));
    snapAt = now;
    zpSig = sig;
  }
  const seen = new Set();
  for (const z of zs) {
    seen.add(z.i);
    let o = Z.get(z.i);
    if (!o) {
      o = zombieEl(z);
      Z.set(z.i, o);
    }
    if (fresh && (z.x !== o.tx || z.y !== o.ty)) {
      o.fx = o.x;
      o.fy = o.y;
      o.tx = z.x;
      o.ty = z.y;
      o.t0 = now;
      if (Math.hypot(z.x - o.x, z.y - o.y) > 300) o.fx = o.x = z.x; // (far: there at once)
      if (Math.abs(z.x - o.x) > 2) o.face = z.x > o.x ? 1 : -1;
    }
    if (z.hp < o.hp && z.st !== 3) {
      o.el.classList.remove("hit");
      void o.el.offsetWidth;
      o.el.classList.add("hit");
    } // (hit: a red blink)
    if (o.hp !== undefined && z.hp !== o.hp && o.st !== 3)
      popHP(o.el, z.hp - o.hp, true); // (the HP it lost or got back, small over its head: hpmeter.js)
    if (z.st === 3 && o.st !== 3) {
      o.el.classList.add("dead");
      o.diedAt = now;
    }
    if (z.a !== o.a && z.a > 0 && z.st === 2)
      if (inCabin(o.x, o.y) === ctx.world.inside)
        claw(o.x, o.y, z.dir / 100, ctx);
    const fire = ((s.hang.l4fire || {}).z || {})[z.i],
      lit = !!fire && fire[0] > clockNow() && z.st !== 3;
    if (o.lit !== lit) {
      o.lit = lit;
      if (lit && !o.body.querySelector(".gduck-fire"))
        o.body.insertAdjacentHTML(
          "beforeend",
          `<span class="gduck-fire" aria-hidden="true">${FLAME}</span>`,
        );
      o.el.classList.toggle("onfire", lit);
    } // (set on fire by a fireball: one big flame over it, as a duck's)
    const hits = (s.hang.zw || {})[z.i] || "";
    if (o.hits !== hits) {
      o.hits = hits;
      o.img.src = zombieURL(z.l, z.i, hits);
    } // (the wounds its hits left: holes, cuts, bruises, an arrow, a chunk gone, its head blown off; l4ddart.js)
    const sh = (Math.max(0, z.hp) / (z.l[0] || 1)).toFixed(3);
    if (o.sh !== sh) {
      o.sh = sh;
      o.bar.style.setProperty("--hp", sh);
    }
    o.hp = z.hp;
    o.st = z.st;
    o.a = z.a;
  }
  for (const [i, o] of Z)
    if (!seen.has(i)) {
      o.el.remove();
      Z.delete(i);
    }
}
/* the boards: one element for each opening, its picture redrawn when its count changes */
function seeBoards(s) {
  const brd = s.hang.brd || {};
  for (const o of OPENINGS) {
    const n = brd[o.id] || 0;
    let b = B.get(o.id);
    if (!b) {
      const el = document.createElement("div");
      el.className = "l4-boards k-" + o.kind;
      layer.append(el);
      b = { el, n: -1, box: boardsBox(o) };
      B.set(o.id, b);
    }
    if (b.n !== n) {
      b.el.innerHTML = boardsSVG(o, n);
      b.n = n;
    }
  }
}
function seeCandles(s) {
  const spots = s.hang.l4c || [],
    sig = JSON.stringify(spots);
  if (sig === candleSig) return;
  candleSig = sig;
  for (const c of C) c.el.remove();
  C.length = 0;
  const url = svgDataURL(CANDLE);
  for (const [x, y] of spots) {
    const el = document.createElement("div");
    el.className = "l4-candle";
    el.innerHTML = `<img alt="" draggable="false" src="${url}">`;
    layer.append(el);
    C.push({ el, x, y });
  }
}

/* ---------- the drops: on the floor, what's on now (top right), and the big words when one is taken ---------- */
function seeDrops(s) {
  const list = s.hang.l4dr || [],
    have = new Set(list.map((d) => d.n));
  for (const [n, o] of D)
    if (!have.has(n)) {
      o.el.remove();
      D.delete(n);
    }
  for (const d of list) {
    if (D.has(d.n)) continue;
    const el = document.createElement("div");
    el.className = "l4-drop k-" + d.k;
    el.innerHTML = `<i>${DROP_ICONS[d.k] || ""}</i>`;
    layer.append(el);
    D.set(d.n, { el, x: d.x, y: d.y, until: d.until });
  }
}
/* Instant Kill, Double Points and Speed Boost, with the seconds they have left; Sale, until the round ends */
function seeOn(s) {
  if (!onEl) return;
  const now = clockNow(),
    on = s.hang.l4on || {},
    rows = ["kill", "double", "speed"]
      .filter((k) => on[k] > now)
      .map((k) => [k, Math.ceil((on[k] - now) / 1000)]);
  if (saleOn(s)) rows.push(["sale", "Sale"]);
  const sig = JSON.stringify(rows);
  if (sig === onSig) return;
  onSig = sig;
  onEl.innerHTML = rows
    .map(
      ([k, t]) =>
        `<span class="l4-on-k k-${k}" title="${dropName(k)}"><i>${DROP_ICONS[k]}</i><b>${t}</b></span>`,
    )
    .join("");
  onEl.hidden = !rows.length;
}
/* a duck walked over a drop: its name in big letters for everyone, and a sound (the Nuke: a white flash too) */
export function l4Got(k) {
  if (!gotEl) return;
  gotEl.innerHTML = `<span class="l4-got-ic">${DROP_ICONS[k] || ""}</span>${rainbowHTML(dropName(k) + "!", { seed: DROPS_SEED[k] || 1 })}`;
  gotEl.classList.remove("on");
  void gotEl.offsetWidth;
  gotEl.classList.add("on");
  if (k === "nuke") {
    const fl = document.createElement("div");
    fl.className = "l4-nukeflash";
    gotEl.before(fl);
    setTimeout(() => fl.remove(), 1300);
    sfx.boom();
  } else sfx.bell();
}
const DROPS_SEED = { kill: 3, ammo: 7, nuke: 2, speed: 9, double: 4, sale: 6 };

/* my all-time stats (not in test rooms): a game once its first round starts, a round each time one is cleared, and the
   best round reached; with Round 16 Start on, its own stats (store.js statMode) */
function record(s, L, cleared) {
  if (s.test) return;
  const st = profile.stats[statMode(s)];
  if (!st) return;
  const game = `${s.id}:${s.startedAt}:${L.g || 0}`;
  if (profile.stats.lastGame !== game) {
    profile.stats.lastGame = game;
    st.games++;
  } else if (cleared) st.rounds++; // (round 0 to 1, or to 16, isn't one cleared)
  st.titles = Math.max(st.titles || 0, L.r);
  save();
}
/* ---------- the HUD: "Round N", and the end ---------- */
function seeHud(s, ctx) {
  const L = s.hang.l4;
  if (!hud || !L) return;
  if (roundShown !== L.r) {
    if (roundShown >= 0 && L.r > roundShown)
      record(s, L, L.r - roundShown === 1);
    hud.innerHTML = `<span class="l4-round-w">Round</span> <b>${L.r}</b>`;
    hud.classList.remove("new");
    void hud.offsetWidth;
    if (roundShown >= 0) hud.classList.add("new"); // (a new round: it pulses)
    roundShown = L.r;
  }
  /* between rounds: End turn (Ready before round 1), with how many pressed it and how many it takes */
  const w = !L.over && L.wait,
    mine = !!(w && w.v[ctx.me]),
    es = w ? [L.r, mine, waitVotes(s), waitNeed(s), isR16(s)].join() : "";
  if (es !== endSig) {
    endSig = es;
    endEl.hidden = !w;
    ctx.world.board.classList.toggle("l4-waiting", !!w);
    if (w) {
      const word = L.r === 0 ? "Ready" : "End turn",
        next = L.r === 0 && isR16(s) ? 16 : w.r;
      endEl.innerHTML = `<button type="button" class="btn ${mine ? "purple" : "yellow"}" aria-pressed="${mine}">${word}${mine ? " ✓" : ""} <span class="l4-end-n">${waitVotes(s)}/${waitNeed(s)}</span></button><span class="l4-end-say">${mine ? `Round ${next} starts when ${waitNeed(s)} ${waitNeed(s) === 1 ? "duck is" : "ducks are"} ${L.r === 0 ? "ready" : "done"}` : L.r === 0 ? `Ready for round ${next}?` : `Round ${L.r} cleared`}</span>`;
    }
  }
  const end = L.over ? JSON.stringify(L.over) + (s.hostId === ctx.me) : "";
  if (end === overShown) return;
  overShown = end;
  if (!L.over) {
    over.hidden = true;
    return;
  }
  const host = s.hostId === ctx.me,
    hostName = (s.players[s.hostId] || {}).name || "the host";
  over.innerHTML = `<div class="l4-over-card"><h2>Everyone's down</h2><p>You made it to <b>Round ${L.over.r}</b>.</p>${
    host
      ? '<div class="l4-over-btns"><button type="button" class="btn yellow" data-l4="again">Play again</button><button type="button" class="btn" data-a="lobby">Back to the lobby</button></div>'
      : `<p class="small dim">Waiting for ${nameHTML(hostName)} to play again or go back to the lobby.</p>`
  }</div>`;
  over.hidden = false;
}

/* ---------- the dark ---------- */
function paint(now, ctx) {
  const Wd = ctx.world,
    s = ctx.state(),
    q = low() ? 0.35 : 0.5,
    w = Math.round(Wd.vw * q),
    h = Math.round(Wd.vh * q),
    sc = Wd.sc * q,
    ln = lightNow(now),
    holes = [],
    cones = [];
  const on = (x, y, r) => x + r > 0 && x - r < w && y + r > 0 && y - r < h;
  for (const l of Wd.inside ? LIT.in : LIT.out) {
    const fl = sway(l, ln),
      p = Wd.toScreen(l.x, l.y, heightAt(l.x, l.y) + (l.z || 0)),
      x = p.left * q,
      y = p.top * q,
      r = l.r * 0.9 * fl * sc;
    if (on(x, y, r))
      holes.push([x, y, r, Math.min(0.72, l.k * 1.45) * fl * stutterOf(l, ln)]); // (dimmer than Hangout's blackout: the owner wants it very dark)
  }
  for (const c of C) {
    if (inCabin(c.x, c.y) !== Wd.inside) continue;
    const fl = sway({ ...CANDLE_LIGHT, x: c.x, y: c.y }, ln),
      p = Wd.toScreen(c.x, c.y, 20),
      r = CANDLE_LIGHT.r * fl * sc;
    if (on(p.left * q, p.top * q, r))
      holes.push([p.left * q, p.top * q, r, CANDLE_LIGHT.k * fl]);
  }
  /* each opening lets a little moonlight in, more as its boards come down: the way in shows in the dark */
  const brd = s.hang.brd || {};
  for (const o of OPENINGS) {
    const [x0, y0] = MOON[o.id];
    if (inCabin(x0, y0) !== Wd.inside) continue;
    const p = Wd.toScreen(x0, y0, heightAt(x0, y0)),
      r = 120 * sc;
    if (on(p.left * q, p.top * q, r))
      holes.push([
        p.left * q,
        p.top * q,
        r,
        0.2 + 0.05 * (5 - (brd[o.id] ?? 5)),
      ]);
  }
  /* Justin's Butler stands in a little light, and the fireplace's weapon glows while it's out */
  if (Wd.inside) {
    const p = Wd.toScreen(BUTLER.x, BUTLER.y, 30);
    if (on(p.left * q, p.top * q, 100 * sc))
      holes.push([p.left * q, p.top * q, 100 * sc, 0.5]);
    if (boxNow(s, clockNow())) {
      const o = Wd.toScreen(BOX.x, 706, 58);
      holes.push([o.left * q, o.top * q, 130 * sc, 0.6]);
    }
  }
  /* the drops glow on the floor */
  for (const o of D.values()) {
    if (inCabin(o.x, o.y) !== Wd.inside) continue;
    const p = Wd.toScreen(o.x, o.y, 30),
      r = DROP_LIGHT.r * sc;
    if (on(p.left * q, p.top * q, r))
      holes.push([p.left * q, p.top * q, r, DROP_LIGHT.k]);
  }
  /* every duck: a faint glow round it, and its flashlight (not a ghost's, not a downed duck's, not one switched off) */
  const off = s.hang.l4f || {},
    rays = low() ? 12 : 22;
  for (const id of s.seat) {
    const a = Wd.at(id),
      pos = s.pos[id];
    if (!a || !pos || inCabin(a.x, a.y) !== Wd.inside) continue;
    const p4 = P4(s, id);
    if (p4 && p4.gh) continue;
    const c = Wd.toScreen(a.x, a.y, a.z + 26);
    holes.push([c.left * q, c.top * q, GLOW * sc, 0.55]);
    if (!up(s, id) || off[id]) continue;
    const aim = id === ctx.me ? ctx.duck() && ctx.duck().aim : [pos.ax, pos.ay];
    let dx = aim && aim[0] !== undefined ? aim[0] * W : 0,
      dy = aim && aim[1] !== undefined ? aim[1] * H : 0;
    if (Math.hypot(dx, dy) < 1e-6) [dx, dy] = [1, 0];
    const t = Math.atan2(dy, dx),
      pts = [];
    for (let k = 0; k <= rays; k++) {
      const u = t - CONE.half + (2 * CONE.half * k) / rays,
        ux = Math.cos(u),
        uy = Math.sin(u),
        d = rayTo(a.x, a.y, ux, uy, CONE.far),
        e = Wd.toScreen(a.x + ux * d, a.y + uy * d, a.z);
      pts.push([e.left * q, e.top * q, d]);
    }
    const o = Wd.toScreen(a.x, a.y, a.z);
    cones.push([o.left * q, o.top * q, pts, CONE.far * sc]);
  }
  const f = (v) => v.toFixed(1),
    key = [
      w,
      h,
      ...holes.map((o) => f(o[0]) + f(o[1]) + f(o[2]) + o[3].toFixed(2)),
      ...cones.map(
        (c) => f(c[0]) + f(c[1]) + c[2].map((p) => f(p[0]) + f(p[1])).join(),
      ),
    ].join();
  if (key === drawn) return;
  drawn = key;
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, w, h);
  g.fillStyle = `rgba(3,4,10,${DARK})`;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "destination-out";
  for (const [x, y, r, k] of holes) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(0,0,0,${k.toFixed(3)})`);
    rg.addColorStop(0.45, `rgba(0,0,0,${(k * 0.8).toFixed(3)})`);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  /* a cone: three passes, each a little narrower, so its middle is as bright as the lights on and its edges soft */
  for (const [ox, oy, pts, far] of cones) {
    const rg = g.createRadialGradient(ox, oy, 0, ox, oy, far);
    rg.addColorStop(0, "rgba(0,0,0,.62)");
    rg.addColorStop(0.7, "rgba(0,0,0,.55)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    const n = pts.length - 1;
    for (const cut of [0, 0.18, 0.34]) {
      const a = Math.round(n * cut),
        b = n - a;
      g.beginPath();
      g.moveTo(ox, oy);
      for (let k = a; k <= b; k++) g.lineTo(pts[k][0], pts[k][1]);
      g.closePath();
      g.fill();
    }
  }
  g.globalCompositeOperation = "source-over";
}

/* ---------- Justin's Butler, standing by the card table ---------- */
function butlerEl(svg = butlerSVG({ size: 64 }), name = BUTLER_NAME) {
  const v = svg
      .match(/viewBox="([^"]+)"/)[1]
      .split(" ")
      .map(Number),
    h = (64 * v[3]) / v[2],
    feet = (64 * (v[3] - 10)) / v[2],
    el = document.createElement("div");
  el.className = "hang-npc duck l4-butler";
  el.innerHTML = `<div class="hang-npc-body"><img alt="" draggable="false" src="${svgDataURL(svg)}"></div><span class="gduck-name hang-npc-name">${nameHTML(name)}</span>`;
  const body = el.firstChild;
  body.style.width = "64px";
  body.style.height = h.toFixed(1) + "px";
  body.style.left = "-32px";
  body.style.top = (-feet).toFixed(1) + "px";
  body.style.transformOrigin = `32px ${feet.toFixed(1)}px`;
  layer.append(el);
  return { el, body };
}

/* a secret (not in Updates): a zebra cake in the toilet's bowl, and Justin teleported in beside it, eating it for as
   long as it lasts (the rules' s.zcake.toilet) */
const EGG = { x: TOILET.x + 62, y: TOILET.y + 78 }; // (where he stands: in front of the sink, facing the bowl)
let egg = null;
function drawEgg(ctx, now) {
  const s = ctx.state(),
    c = s.zcake,
    on = !!(c && c.toilet && !c.eat && now >= c.stop),
    Wd = ctx.world,
    z = heightAt(EGG.x, EGG.y),
    p = Wd.toScreen(EGG.x, EGG.y, z),
    sc = Wd.sc;
  if (on !== !!egg.on) {
    egg.on = on;
    if (Wd.inside) {
      const n = document.createElement("div");
      n.className = "mgj-tp";
      n.style.cssText = `left:${p.left.toFixed(1)}px;top:${p.top.toFixed(1)}px;width:${(90 * sc).toFixed(0)}px;z-index:${Math.round(sortY(EGG.x, EGG.y, z)) + 12}`;
      n.innerHTML = TELEPORT;
      (fxl || layer).append(n);
      setTimeout(() => n.remove(), 600);
      const me = ctx.duck();
      if (me && Math.hypot(me.x * W - EGG.x, me.y * H - EGG.y) < 1200)
        sfx.teleport();
    } // (a blue flash as he comes and goes)
    egg.chomp = now + 400;
  }
  const hide = !on || !Wd.inside || !Wd.seen(p.left - 40, p.top - 90, 80, 110);
  if (egg.el.hidden !== hide) egg.el.hidden = hide;
  if (hide) return;
  const tr = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
  if (egg.tr !== tr) {
    egg.tr = tr;
    egg.el.style.transform = tr;
    egg.el.style.zIndex = Math.round(sortY(EGG.x, EGG.y, z)) + 10;
  }
  const gd = Wd.board.querySelector(".gduck .gduck-body"),
    k = gd && gd.offsetWidth ? gd.offsetWidth / 64 : sc; // (as big as the ducks are drawn)
  if (egg.k !== k) {
    egg.k = k;
    egg.body.style.transform = `scale(${(-k).toFixed(4)}, ${k.toFixed(4)})`; // (facing left, toward the bowl)
    egg.el.style.setProperty("--nt", (2 * k).toFixed(1) + "px");
  }
  if (now >= egg.chomp) {
    egg.chomp = now + 1100;
    const me = ctx.duck();
    if (me && Math.hypot(me.x * W - EGG.x, me.y * H - EGG.y) < 900) sfx.chomp();
  } // (a bite now and then)
}

/* ---------- the fireplace's weapon ---------- */
/* what it shows at `now`: flickering through the weapons, fast and then slower (the same on every screen), until it
   lands on the one the host picked; [weapon, landed] */
const FLICKS = 30;
function boxShows(b, now, s) {
  const u = (now - b.t) / BOX.spin;
  if (u >= 1) return [b.w, true];
  const f = Math.floor(FLICKS * (1 - Math.pow(1 - Math.max(0, u), 2))),
    sl = slotsOf(s, b.by),
    pool = POOL.filter((w) => !sl.includes(w)); // (never a weapon its duck has: the owner's, Nov 4)
  return [pool[(b.t + f) % pool.length] || b.w, false];
}
function drawBox(ctx) {
  const s = ctx.state(),
    now = clockNow(),
    b = boxNow(s, now, ctx.me) || boxNow(s, now), // (mine, else the newest anyone spun)
    Wd = ctx.world;
  if (!b || !Wd.inside) {
    if (!boxEl.hidden) boxEl.hidden = true;
    if (!b) {
      boxSig = "";
      boxSpun = false;
    }
    return;
  }
  const [w, landed] = boxShows(b, now, s),
    sig = w + (landed ? "!" : "") + b.t;
  if (sig !== boxSig) {
    const first = !boxSig;
    boxSig = sig;
    boxEl.querySelector(".l4-box-orb").innerHTML = orbHTML(w);
    const me = ctx.duck(),
      close =
        me && Math.hypot(me.x * W - BOX.x, me.y * H - BOX.y) < 900 && !first;
    if (landed && boxSpun && close) sfx.ping();
    else if (!landed && close) sfx.tick();
    boxSpun = !landed;
    const P = s.players[b.by] || {};
    boxEl.querySelector(".l4-box-who").innerHTML = nameHTML(
      P.name || "",
      P.nameStyle || {},
    );
  }
  boxEl.classList.toggle("landed", landed);
  boxEl.classList.toggle(
    "ending",
    landed && b.t + BOX.spin + BOX.keep - now < 3000,
  ); // (its last 3 seconds: it blinks)
  const sc = Wd.sc,
    p = Wd.toScreen(BOX.x, 706, 58),
    hide = !Wd.seen(p.left - 60, p.top - 80, 120, 140);
  if (boxEl.hidden !== hide) boxEl.hidden = hide;
  if (hide) return;
  const tr = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
  if (boxEl._tr !== tr) {
    boxEl._tr = tr;
    boxEl.style.transform = tr;
    boxEl.style.zIndex = Math.round(sortY(BOX.x, 712, 0)) + 20;
  }
  if (boxEl._k !== sc) {
    boxEl._k = sc;
    boxEl.style.setProperty("--k", sc.toFixed(3));
  }
}

/* ---------- my points, and big words when something can't be done ---------- */
function seePts(s, ctx) {
  const n = ptsOf(s, ctx.me);
  if (n === ptsShown) return;
  const got = ptsShown >= 0 && n > ptsShown ? n - ptsShown : 0;
  ptsShown = n;
  ptsEl.querySelector("b").textContent = n;
  if (got) {
    const pop = document.createElement("span");
    pop.className = "l4-pts-pop" + (got >= 25 ? " big" : "");
    pop.textContent = "+" + got;
    ptsEl.append(pop);
    setTimeout(() => pop.remove(), 900);
  }
}
function say(text) {
  if (!sayEl) return;
  sayEl.textContent = text;
  sayEl.classList.remove("on");
  void sayEl.offsetWidth;
  sayEl.classList.add("on");
  sfx.nope();
}

/* ---------- Justin's Butler's shop: a page over the board, as the guestbook's ---------- */
function shopFill(s, ctx) {
  const me = ctx.me,
    up = upOf(s, me),
    pts = ptsOf(s, me),
    kit = kitOf(s, me),
    sig = JSON.stringify([
      up,
      pts,
      s.hang.l4sale,
      saleOn(s),
      kit && kit.sl,
      kit && kit.am,
    ]);
  if (sig === shop.sig) return;
  shop.sig = sig;
  shop.pts.textContent = pts;
  shop.list.innerHTML = SHOP.map((it) => {
    const n = up[it.id] || 0,
      max = n >= it.most,
      price = priceFor(s, me, it.id, n),
      was = price < priceOf(it.id, n) ? `<s>${priceOf(it.id, n)}</s> ` : ""; // (a Sale: the old price struck through)
    return `<li class="l4-up"><i class="l4-up-ic">${UP_ICONS[it.id]}</i><span class="l4-up-t"><b>${it.name}</b><small>${it.what}</small></span><span class="l4-up-lv" aria-label="${n} of ${it.most}">${Array.from({ length: it.most }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("")}</span><button type="button" class="btn small ${max ? "" : "yellow"} l4-up-buy" data-buy="${it.id}"${max || pts < price ? " disabled" : ""}>${max ? "Max" : was + price}</button></li>`;
  }).join("");
  /* his guns: Buy (a price), Refill (a price) once I have it, Full when it's full (the knife: Owned) */
  shop.guns.innerHTML = GUN_SHOP.map((w) => {
    const have = !!kit && kit.sl.includes(w),
      price = gunPrice(s, me, w),
      off = !price || pts < price,
      label = have
        ? price
          ? `Refill ${price}`
          : price === 0
            ? "Full"
            : "Owned"
        : `Buy ${price}`;
    return `<li class="l4-up l4-buyw"><i class="l4-up-ic">${orbHTML(w)}</i><span class="l4-up-t"><b>${weaponName(w)}</b><small>${gunWhat(w)}</small></span><button type="button" class="btn small ${price ? "yellow" : ""} l4-up-buy" data-buy="${w}"${off ? " disabled" : ""}>${label}</button></li>`;
  }).join("");
}
const gunWhat = (w) => {
  if (w === "knife") return "Melee";
  const [p, n] = AMMO_PRICE[w] || AMMO_PRICE.gun;
  return `${p} points for ${n} ${w === "bow" ? "arrows" : "bullets"}`;
};
function openShop(ctx) {
  if (!shop || shop.open) return;
  shop.open = true;
  ctx.world.board.classList.add("l4-shopping");
  shop.sig = "";
  shop.el.hidden = false;
  shopFill(ctx.state(), ctx);
  addEventListener("keydown", shopEsc, true);
}
function closeShop() {
  if (!shop || !shop.open) return;
  shop.open = false;
  shop.el.hidden = true;
  shop.el.parentNode?.classList.remove("l4-shopping");
  if (shop.el.contains(document.activeElement)) document.activeElement.blur();
  removeEventListener("keydown", shopEsc, true);
}
function shopEsc(e) {
  if (!shop || !shop.open || document.querySelector(".win-back, .ctx")) return;
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    closeShop();
  } else if (e.key.startsWith("Arrow")) closeShop(); // (the arrows close it at once too, and still do what they do)
} // (before the game's own Escape: the pause menu)
function shopEl(ctx) {
  const el = document.createElement("div");
  el.className = "hang-book l4-shop";
  el.hidden = true;
  el.innerHTML = `<div class="hang-book-head"><h3 class="hang-book-title">${rainbowHTML(BUTLER_NAME, { seed: 5 })}</h3><span class="l4-shop-pts"><b>0</b> points</span><button type="button" class="win-x hang-book-x" aria-label="Close">×</button></div>
      <div class="tabs l4-shop-tabs" role="tablist"><button type="button" class="tab" role="tab" aria-selected="true" data-tab="buy">Shop</button><button type="button" class="tab" role="tab" aria-selected="false" data-tab="items">Items</button></div>
      <div class="l4-shop-list" data-pane="buy"><ul class="l4-shop-ups"></ul><h4 class="l4-shop-h">Weapons</h4><ul class="l4-shop-guns"></ul></div>
      <div class="l4-shop-list l4-shop-items" data-pane="items" hidden>${catalogHTML()}</div>
      ${touchOnly() ? "" : '<p class="l4-shop-key"><kbd>B</kbd> buys ammo for the gun in your hand, at his price</p>'}
      <p class="l4-shop-say"><span class="l4-shop-me">${butlerSVG({ size: 40 })}</span><q>The fireplace is where you see what weapon you get.</q></p>`;
  for (const t of ["pointerdown", "click", "wheel", "touchstart"])
    el.addEventListener(t, (e) => e.stopPropagation(), { passive: true }); // (a tap on the page never walks the duck)
  el.querySelector(".hang-book-x").onclick = closeShop;
  el.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      /* the tabs: his shop, or every item in this mode (l4ddcatalog.js) */
      for (const t of el.querySelectorAll("[data-tab]"))
        t.setAttribute("aria-selected", t === tab);
      for (const p of el.querySelectorAll("[data-pane]"))
        p.hidden = p.dataset.pane !== tab.dataset.tab;
      return;
    }
    const b = e.target.closest("[data-buy]");
    if (b && !b.disabled)
      ctx.send({
        t: "hang",
        k: "l4",
        do: "buy",
        what: b.dataset.buy,
        hand: heldFn(),
      }); // (a gun takes the place of the ranged one in hand, as the fireplace's)
  });
  ctx.world.board.append(el);
  return {
    el,
    open: false,
    sig: "",
    pts: el.querySelector(".l4-shop-pts b"),
    list: el.querySelector(".l4-shop-ups"),
    guns: el.querySelector(".l4-shop-guns"),
  };
}

/* ---------- holding E: reviving a downed duck, boarding up an opening; E at the fireplace and the Butler ---------- */
function holdTarget(pos, ctx) {
  const s = ctx.state(),
    me = ctx.me;
  if (!s.hang || !s.hang.l4 || s.hang.l4.over || !up(s, me)) return null;
  let best = null;
  for (const id of s.seat) {
    const p = P4(s, id);
    if (id === me || !p || !p.dn) continue;
    const a = ctx.world.at(id);
    if (!a) continue;
    const d = Math.hypot(a.x - pos.x, a.y - pos.y);
    if (d < L4.REACH && (!best || d < best.d))
      best = { kind: "rev", on: id, d, name: (s.players[id] || {}).name };
  }
  if (best) return best;
  for (const o of OPENINGS) {
    const d = Math.hypot(o.in[0] - pos.x, o.in[1] - pos.y),
      n = (s.hang.brd || {})[o.id] || 0;
    if (d < L4.REACH && n < L4.BOARDS && (!best || d < best.d))
      best = { kind: "board", o: o.id, d, n };
  }
  if (best) return best;
  const now = clockNow(),
    db = Math.hypot(BOX.x - pos.x, BOX.y - pos.y);
  if (db < NEAR) {
    const b = boxNow(s, now, me); // (my own spin: anyone else's doesn't stop me)
    if (!b) return { kind: "box", d: db };
    if (now >= b.t + BOX.spin && b.w !== HELPER.w)
      return { kind: "take", d: db, w: b.w }; // (Justin climbs out by himself)
  }
  const ds = Math.hypot(BUTLER.x - pos.x, BUTLER.y - pos.y);
  if (ds < NEAR || (shop && shop.open && ds < AWAY))
    return { kind: "shop", d: ds };
  return null;
}
/* B: ammo for the gun in hand, at the Butler's price, from anywhere (only one of his guns, not full, with the points) */
function buyAmmo(ctx) {
  const s = ctx.state(),
    me = ctx.me,
    w = heldFn();
  if (!s.hang || !s.hang.l4 || s.hang.l4.over || !up(s, me)) return;
  const kit = kitOf(s, me),
    price = gunPrice(s, me, w);
  if (!kit || !kit.sl.includes(w) || !GUN_SHOP.includes(w) || w === "knife")
    return say("The Butler doesn't sell ammo for that");
  if (!price) return say("It's full");
  if (ptsOf(s, me) < price) return say("Not enough points");
  ctx.send({ t: "hang", k: "l4", do: "ammo", what: w });
}
/* E (a tap) at the Butler or the fireplace */
function tap(t, ctx) {
  if (t.kind === "shop") return shop.open ? closeShop() : openShop(ctx);
  const s = ctx.state(),
    me = ctx.me;
  if (t.kind === "box") {
    if (ptsOf(s, me) < priceFor(s, me, "box")) return say("Not enough points");
    ctx.send({ t: "hang", k: "l4", do: "box" });
  } else if (t.kind === "take") {
    ctx.send({ t: "hang", k: "l4", do: "box", hand: heldFn() }); // (a ranged weapon takes the place of the one in hand, else the first)
  }
}
const TAPS = ["box", "take", "shop"];
function startHold(t, ctx) {
  if (!t) return;
  holding = t;
  ctx.send(
    t.kind === "rev"
      ? { t: "hang", k: "l4", do: "rev", on: t.on, hold: true }
      : { t: "hang", k: "l4", do: "board", o: t.o, hold: true },
  );
}
function stopHold(ctx) {
  if (!holding) return;
  const t = holding;
  holding = null;
  ctx.send(
    t.kind === "rev"
      ? { t: "hang", k: "l4", do: "rev", on: t.on, hold: false }
      : { t: "hang", k: "l4", do: "board", hold: false },
  );
}
/* the button's words: what holding E does, or how far along it is */
function holdLabel(t, s, ctx, now) {
  if (t.kind === "box")
    return `Spin for a weapon · ${priceFor(s, ctx.me, "box")}${saleOn(s) ? " (Sale)" : ""}`;
  if (t.kind === "take") return `Take the ${weaponName(t.w)}`;
  if (t.kind === "shop") return shop && shop.open ? "Close" : "Shop";
  if (t.kind === "rev") {
    const rv = (P4(s, t.on) || {}).rv;
    if (rv && rv.by === ctx.me)
      return `Reviving… ${Math.max(0, Math.ceil((L4.REVIVE - (now - rv.at)) / 1000))}`;
    return `Revive ${t.name || ""}`.trim();
  }
  const mine = ((s.hang.l4b || {})[ctx.me] || {}).o === t.o;
  return mine
    ? `Boarding up… ${t.n}/${L4.BOARDS}`
    : `Board up ${t.n}/${L4.BOARDS}`;
}

/* ---------- phones: where my duck aims without a mouse ---------- */
/* the nearest zombie I can see (in front of me first), else the way I last walked: a direction in board units */
export function l4TouchAim(me) {
  if (!me) return null;
  const x = me.x * W,
    y = me.y * H,
    inside = inCabin(x, y);
  let best = null,
    bd = 520;
  for (const o of Z.values()) {
    if (o.st === 3 || inCabin(o.x, o.y) !== inside) continue;
    const dx = o.x - x,
      dy = o.y - y,
      d = Math.hypot(dx, dy),
      ahead = (dx * walkDir[0] + dy * walkDir[1]) / (d || 1),
      score = d * (ahead > 0.3 ? 1 : 1.6); // (one behind me counts as further)
    if (score < bd && rayTo(x, y, dx / d, dy / d, d) >= d - 1) {
      bd = score;
      best = [dx, dy];
    }
  }
  const [ax, ay] = best || walkDir;
  return [ax / W, ay / H];
}

activity({
  id: "l4",
  only: "l4dd",
  /* the only ground anyone sees: the cabin, the deck and its stairs (the zombies come up them). The forest, the pool and
     the yard can't be reached, so the world doesn't make them: the deck runs smoother */
  area: [
    [CABIN.x0, CABIN.y0, CABIN.x1, CABIN.y1],
    [DECK.x0, DECK.y0, DECK.x1, DECK.y1],
    [STAIRS.x0, STAIRS.y0, STAIRS.x1, STAIRS.y1],
  ],
  mount(ctx) {
    setListener(() => ctx.world.at(ctx.me));
    layer = ctx.world.board.querySelector(".hang-props");
    fxl = ctx.world.board.querySelector(".fxl");
    cv = document.createElement("canvas");
    cv.className = "hang-dark l4-dark";
    cv.setAttribute("aria-hidden", "true");
    ctx.world.board.querySelector(".hang-shade")?.after(cv);
    g = cv.getContext("2d");
    hud = document.createElement("div");
    hud.className = "l4-hud";
    hud.setAttribute("role", "status");
    over = document.createElement("div");
    over.className = "l4-over";
    over.hidden = true;
    over.addEventListener("click", (e) => {
      if (e.target.closest("[data-l4='again']"))
        ctx.send({ t: "hang", k: "l4", do: "again" });
    });
    endEl = document.createElement("div");
    endEl.className = "l4-end";
    endEl.hidden = true;
    for (const t of ["pointerdown", "touchstart", "wheel"])
      endEl.addEventListener(t, (e) => e.stopPropagation(), { passive: true }); // (a tap on it never walks or attacks)
    endEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.target.closest("button");
      if (b)
        ctx.send({
          t: "hang",
          k: "l4",
          do: "endturn",
          on: b.getAttribute("aria-pressed") !== "true",
        });
    });
    ptsEl = document.createElement("div");
    ptsEl.className = "l4-pts";
    ptsEl.setAttribute("role", "status");
    ptsEl.innerHTML = "<span><b>0</b> points</span>";
    sayEl = document.createElement("div");
    sayEl.className = "l4-say";
    sayEl.setAttribute("role", "alert");
    onEl = document.createElement("div");
    onEl.className = "l4-on";
    onEl.hidden = true;
    gotEl = document.createElement("div");
    gotEl.className = "l4-got";
    gotEl.setAttribute("role", "status");
    boxEl = document.createElement("div");
    boxEl.className = "l4-box";
    boxEl.hidden = true;
    boxEl.innerHTML =
      '<div class="l4-box-orb"></div><span class="gduck-name l4-box-who"></span>';
    layer.append(boxEl);
    ctx.world.board.append(hud, over, ptsEl, endEl, sayEl, onEl, gotEl);
    shop = shopEl(ctx);
    butler = butlerEl();
    egg = butlerEl(justinSVG({ size: 64 }), "Justin");
    egg.el.classList.replace("l4-butler", "l4-egg");
    egg.el.hidden = true;
    ctx.world.board.classList.add("blackout", "l4-board");
    Z.clear();
    B.clear();
    C.length = 0;
    D.clear();
    zpSig =
      candleSig =
      overShown =
      endSig =
      drawn =
      boxSig =
      upSig =
      slotSig =
      onSig =
        "";
    roundShown = -1;
    ptsShown = -1;
    l4Reset();
    boxSpun = false;
    stamina = 1;
    tired = false;
    holding = null;
  },
  unmount(ctx) {
    for (const o of Z.values()) o.el.remove();
    for (const b of B.values()) b.el.remove();
    for (const c of C) c.el.remove();
    for (const o of D.values()) o.el.remove();
    Z.clear();
    B.clear();
    C.length = 0;
    D.clear();
    cv?.remove();
    hud?.remove();
    over?.remove();
    closeShop();
    ctx.world.board.classList.remove("l4-waiting");
    for (const e of [
      ptsEl,
      endEl,
      sayEl,
      onEl,
      gotEl,
      boxEl,
      butler && butler.el,
      egg && egg.el,
      shop && shop.el,
    ])
      e?.remove();
    cv = g = hud = endEl = over = layer = fxl = null;
    ptsEl = sayEl = onEl = gotEl = boxEl = butler = shop = null;
    ctx?.world?.board.classList.remove("blackout", "l4-board");
  },
  onState(s, ctx) {
    if (!layer || !s.hang || !s.hang.l4) return;
    const now = performance.now();
    seeZombies(s, ctx, now);
    seeBoards(s);
    seeCandles(s);
    seeDrops(s);
    seeOn(s);
    seeHud(s, ctx);
    seePts(s, ctx);
    l4Hear(s, ctx); // (its sounds: l4ddsfx.js)
    if (shop.open) shopFill(s, ctx);
    /* a ding: a weapon from the fireplace taken (an upgrade bought rings the Butler's till: l4ddsfx.js) */
    const u = JSON.stringify(upOf(s, ctx.me)),
      sl = slotsOf(s, ctx.me),
      had = slotSig.split(",");
    if (
      slotSig &&
      sl.some((w) => w && !had.includes(w)) &&
      !(
        ctx.duck() &&
        Math.hypot(ctx.duck().x * W - BUTLER.x, ctx.duck().y * H - BUTLER.y) <
          320
      )
    )
      sfx.done();
    upSig = u;
    slotSig = sl.join();
    if (holding && !up(s, ctx.me)) holding = null;
  },
  step(dt, now, ctx) {
    l4Steps(dt, ctx); // (footsteps and groans: l4ddsfx.js)
    /* the way I last walked (a phone's aim without a zombie in sight) */
    const me = ctx.duck();
    if (me) {
      const x = me.x * W,
        y = me.y * H;
      if (lastXY) {
        const dx = x - lastXY[0],
          dy = y - lastXY[1],
          d = Math.hypot(dx, dy);
        if (d > 0.5 && d < 60) walkDir = [dx / d, dy / d]; // (not a jump back to a start spot)
      }
      lastXY = [x, y];
      if (
        shop.open &&
        (!up(ctx.state(), ctx.me) ||
          !ctx.world.inside ||
          Math.hypot(BUTLER.x - x, BUTLER.y - y) > AWAY)
      )
        closeShop(); // (walked off, or down: it closes)
      if (holding) {
        const t = holdTarget({ x, y }, ctx);
        if (
          !t ||
          t.kind !== holding.kind ||
          (t.kind === "rev" ? t.on !== holding.on : t.o !== holding.o)
        )
          stopHold(ctx); // (walked away from it)
      }
    }
  },
  draw(now, ctx) {
    if (!layer) return;
    const Wd = ctx.world,
      sc = Wd.sc,
      t = performance.now();
    /* the zombies, gliding from where they were to where the host says, one heartbeat's time */
    for (const o of Z.values()) {
      const u = Math.min(1, (t - o.t0) / gap);
      o.x = o.fx + (o.tx - o.fx) * u;
      o.y = o.fy + (o.ty - o.fy) * u;
      const z = heightAt(o.x, o.y),
        f = Wd.toScreen(o.x, o.y, z),
        hide =
          inCabin(o.x, o.y) !== Wd.inside ||
          !Wd.seen(f.left - 40 * sc, f.top - 90 * sc, 80 * sc, 100 * sc);
      if (o.el.hidden !== hide) o.el.hidden = hide;
      if (hide) continue;
      const tr = `translate(${f.left.toFixed(1)}px, ${f.top.toFixed(1)}px)`;
      if (o.tr !== tr) {
        o.tr = tr;
        o.el.style.transform = tr;
      }
      const body = `scale(${(o.face < 0 ? -sc : sc).toFixed(4)}, ${sc.toFixed(4)})${o.st === 3 ? " rotate(-100deg)" : ""}`;
      if (o.bt !== body) {
        o.bt = body;
        o.body.style.transform = body;
      }
      if (o.k !== sc) {
        o.k = sc;
        o.el.style.setProperty("--k", sc.toFixed(3));
      }
      const zi = Math.round(sortY(o.x, o.y, z)) + 10;
      if (o.zi !== zi) {
        o.zi = zi;
        o.el.style.zIndex = zi;
      }
    }
    /* the boards: inside, the door's and the holes'; outside (on the deck), the stairs' */
    for (const o of OPENINGS) {
      const b = B.get(o.id);
      if (!b) continue;
      const out = o.kind === "stairs",
        p = Wd.toScreen(o.x, o.y, 0),
        hide =
          out === Wd.inside ||
          !Wd.seen(
            p.left + b.box.l * sc,
            p.top + b.box.t * sc,
            b.box.w * sc,
            b.box.h * sc,
          );
      if (b.el.hidden !== hide) b.el.hidden = hide;
      if (hide) continue;
      const tr = `translate(${(p.left + b.box.l * sc).toFixed(1)}px, ${(p.top + b.box.t * sc).toFixed(1)}px) scale(${sc.toFixed(4)})`;
      if (b.tr !== tr) {
        b.tr = tr;
        b.el.style.transform = tr;
        b.el.style.zIndex = boardKey(o);
      }
    }
    for (const c of C) {
      const p = Wd.toScreen(c.x, c.y, 0),
        hide =
          inCabin(c.x, c.y) !== Wd.inside ||
          !Wd.seen(p.left - 20, p.top - 50, 40, 60);
      if (c.el.hidden !== hide) c.el.hidden = hide;
      if (hide) continue;
      const tr = `translate(${(p.left - (CANDLE_BOX.w / 2) * sc).toFixed(1)}px, ${(p.top - (CANDLE_BOX.h - 6) * sc).toFixed(1)}px) scale(${sc.toFixed(4)})`;
      if (c.tr !== tr) {
        c.tr = tr;
        c.el.style.transform = tr;
        c.el.style.zIndex = Math.round(sortY(c.x, c.y, 0)) + 10;
      }
    }
    /* the drops, blinking in their last seconds; and the seconds left on what's on */
    const tn = clockNow();
    for (const o of D.values()) {
      const p = Wd.toScreen(o.x, o.y, 0),
        hide =
          inCabin(o.x, o.y) !== Wd.inside ||
          !Wd.seen(p.left - 40, p.top - 80, 80, 100);
      if (o.el.hidden !== hide) o.el.hidden = hide;
      if (hide) continue;
      const tr = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
      if (o.tr !== tr) {
        o.tr = tr;
        o.el.style.transform = tr;
        o.el.style.zIndex = Math.round(sortY(o.x, o.y, 0)) + 10;
      }
      if (o.k !== sc) {
        o.k = sc;
        o.el.style.setProperty("--k", sc.toFixed(3));
      }
      const end = o.until - tn < DROP_ENDING;
      if (o.end !== end) {
        o.end = end;
        o.el.classList.toggle("ending", end);
      }
    }
    seeOn(ctx.state());
    /* Justin's Butler */
    {
      const z = heightAt(BUTLER.x, BUTLER.y),
        p = Wd.toScreen(BUTLER.x, BUTLER.y, z),
        hide = !Wd.inside || !Wd.seen(p.left - 40, p.top - 90, 80, 110);
      if (butler.el.hidden !== hide) butler.el.hidden = hide;
      if (!hide) {
        const tr = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
        if (butler.tr !== tr) {
          butler.tr = tr;
          butler.el.style.transform = tr;
          butler.el.style.zIndex =
            Math.round(sortY(BUTLER.x, BUTLER.y, z)) + 10;
        }
        if (butler.k !== sc) {
          butler.k = sc;
          butler.body.style.transform = `scale(${sc.toFixed(4)})`;
          butler.el.style.setProperty("--nt", (2 * sc).toFixed(1) + "px");
        }
      }
    }
    drawEgg(ctx, now);
    drawBox(ctx);
    paint(now, ctx);
    /* my sprint: a thin blue bar under my name, while it isn't full (and under my HP meter: game.js asks sprintLeft()) */
    const tag = Wd.board.querySelector(".gduck.mine .gduck-name");
    if (tag) {
      let sp = tag.querySelector(".l4-sprint");
      if (!sp) {
        sp = document.createElement("span");
        sp.className = "l4-sprint";
        sp.setAttribute("aria-hidden", "true");
        sp.innerHTML = "<i></i>";
        tag.append(sp);
      }
      const v = stamina.toFixed(3);
      if (sp._v !== v) {
        sp._v = v;
        sp.style.setProperty("--sp", v);
        sp.classList.toggle("full", stamina >= 1);
        sp.classList.toggle("tired", tired);
      }
    }
  },
  near(pos, ctx) {
    const t = holdTarget(pos, ctx);
    if (!t) return null;
    const s = ctx.state();
    return {
      label: holdLabel(t, s, ctx, Date.now()),
      d: t.d,
      act: () =>
        TAPS.includes(t.kind)
          ? tap(t, ctx)
          : holding
            ? stopHold(ctx)
            : startHold(t, ctx), // (a tap on the button holds until I walk away)
    };
  },
  keydown(e, ctx) {
    if (e.code === "KeyB") {
      if (!e.repeat) buyAmmo(ctx);
      return true;
    }
    if (e.code === "Digit0" || e.code === "Numpad0") {
      if (!e.repeat) ctx.send({ t: "hang", k: "l4", do: "fl" });
      return true;
    }
    if (e.code === "KeyE") {
      e.preventDefault();
      if (e.repeat || holding) return true;
      const me = ctx.duck(),
        t = me && holdTarget({ x: me.x * W, y: me.y * H }, ctx);
      if (t && TAPS.includes(t.kind)) tap(t, ctx);
      else startHold(t, ctx);
      return true;
    }
    return false;
  },
  keyup(e, ctx) {
    if (e.code === "KeyE") {
      stopHold(ctx);
      return true;
    }
    return false;
  },
  propClass(p, s) {
    if (["lamp", "sink", "post", "tv"].includes(p.kind)) return "off";
    if (p.id === "door-front")
      return ((s.hang && s.hang.brd) || {}).front > 0 ? "" : "open"; // (boarded shut; open once the zombies tear the last board down)
    if (p.kind === "door") return "open";
    return "";
  },
  light: (p, s, l) => (l && l.el ? false : undefined), // (the power is cut: only the fires and the candles shine)
  blocked: (x, y) => !playable(x, y), // (only the cabin and the deck; the deck's edge is the map's)
  crowd(x, y) {
    let d = 0;
    for (const o of Z.values()) {
      if (o.st === 3 || o.st === 0 || o.st === 1) continue;
      const dx = (x - o.x) / RX,
        dy = (y - o.y) / RY;
      d = Math.max(d, 1 - (dx * dx + dy * dy));
    }
    return d;
  },
  speed: (pos, ctx) =>
    ((ctx.state().hang.l4ad || {})[ctx.me] || 0) > clockNow()
      ? 1
      : SPEED * (upOf(ctx.state(), ctx.me).sp ? 1.1 : 1), // (Speed, from the Butler: 10% faster; an adrenaline shot: Duck Cabin's own walk, for 20 s)
  sprint(on, dt) {
    if (on && !tired && stamina > 0) {
      stamina = Math.max(0, stamina - (dt * 1000) / L4.SPRINT);
      if (stamina <= 0) tired = true;
      return true;
    }
    if (!on) tired = false; // (it can sprint again as soon as Shift is let go)
    stamina = Math.min(1, stamina + (dt * 1000) / L4.SPRINT);
    return false;
  },
  spawn(ctx) {
    const s = ctx.state(),
      k = Math.max(0, s.seat.indexOf(ctx.me));
    return startSpot(k);
  },
});
