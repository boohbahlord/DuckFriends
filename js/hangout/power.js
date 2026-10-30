/* ---------- the power box, the blackout, the dark outside ----------
   Outside by the cabin's west wall stands the power box (art.js' powerBox). Beside it the context button says "Cut power":
   the lever goes down and every electric light goes out for everyone (s.hang.power 0, powerAt the room's time): the
   lamps, the windows and the string lights, the lampposts, the pool's lights, the stage's footlights, the sink's light,
   the TV. It can go back on 10 seconds later ("Power on"); till then a ring on the box counts down. Lever, power down
   and power up are heard at the box (sounds.js: near the box the machine, far off a soft thump); its transformer hums
   while the power is on.
   Natural light stays: the campfire, the fireplace, the candles (the mantel's, the piano's), the lanterns (the kitchen
   table's, the deck table's) and the fireflies. Beside one, the button puts it out (or lights it again) for everyone:
   s.hang.unlit = { its id: 1 } while it's out.
   Outside, the night is darker wherever no light reaches (a canvas over the world with the lights cut out of it; during
   a blackout only the natural ones), but for a faint glow round my own duck. Inside, a blackout dims the cabin but for
   its fires. My duck outside in the dark for 7 seconds straight hears the music muffled (music.setMuffle), till it's
   back in the light or inside. */
import { rule, activity } from "./registry.js";
import {
  PROPS,
  LIGHTS,
  POWER,
  DECK,
  POOL,
  CABIN,
  W,
  H,
  heightAt,
  inDeck,
  inPool,
} from "./layout.js";
import { svgDataURL } from "./art.js";
import { cabinSVG } from "./shapes.js";
import { sway, stutterOf, lightNow } from "./flicker.js";
import { play, loop } from "./sounds.js";
import { music } from "../music.js";

const WAIT = 10000; // ms before the power can go back on
const REACH = 110; // world px from the box (and from a flame's spot, past its bias)
const DARK = 0.55,
  DARK_IN = 0.5,
  Q = 0.5; // how dark outside, and inside in a blackout; the canvas' px per screen px
const ME_GLOW = 120; // world px: the soft glow round my own duck
const MUFFLE_AFTER = 7000; // ms in the dark before the music muffles
export const powered = (s) => ((s && s.hang) || {}).power !== 0;
const isOut = (s, id) => !!(((s && s.hang) || {}).unlit || {})[id];
const byKind = (k, f = () => true) => PROPS.find((p) => p.kind === k && f(p));
const BOX = byKind("powerbox"),
  ROOF = byKind("roof");

/* what can be put out: its prop (its class there: f fire, c candles, l lantern), where to stand (pts, the floor in
   front; d = the nearest, less bias), the button's words, the sound; pool: its prop's light on the ground goes with it */
const FIRE = ["Put out fire", "Light fire", "fireOut"],
  CANDLES = ["Blow out candles", "Light candles", "candleOut"],
  LANTERN = ["Put out lantern", "Light lantern", "candleOut"];
const fp = byKind("fireplace"),
  pn = byKind("piano"),
  kt = byKind("table", (p) => p.light),
  dt = byKind("deck-table"),
  cf = byKind("campfire");
const FLAMES = [
  {
    id: "campfire",
    p: cf,
    c: "f",
    pts: [[cf.light.x, cf.light.y]],
    bias: 70,
    out: true,
    pool: true,
    w: FIRE,
  },
  {
    id: "hearth",
    p: fp,
    c: "f",
    pts: [[fp.x + fp.w / 2, fp.y + fp.d + 10]],
    pool: true,
    w: FIRE,
  },
  {
    id: "mantel",
    p: fp,
    c: "c",
    pts: [
      [fp.x + 26, fp.y + fp.d + 10],
      [fp.x + fp.w - 26, fp.y + fp.d + 10],
    ],
    w: CANDLES,
  },
  {
    id: "piano",
    p: pn,
    c: "c",
    pts: [
      [pn.x + 14, pn.y + pn.d + 10],
      [pn.x + pn.w - 14, pn.y + pn.d + 10],
    ],
    pool: true,
    w: CANDLES,
  },
  {
    id: "kitchen",
    p: kt,
    c: "l",
    pts: [[kt.x + kt.w / 2, kt.y + kt.d]],
    bias: 30,
    pool: true,
    w: LANTERN,
  }, // (from the front, by the lantern: the chairs behind are seats.js')
  {
    id: "deck",
    p: dt,
    c: "l",
    pts: [[dt.x + dt.w / 2, dt.y + dt.d]],
    bias: 30,
    out: true,
    w: LANTERN,
  },
];
const FLAME_PROPS = new Set(FLAMES.map((f) => f.p.id));
const flameD = (f, x, y) =>
  Math.max(
    0,
    Math.min(...f.pts.map(([px, py]) => Math.hypot(x - px, y - py))) -
      (f.bias || 0),
  );

rule("power", {
  init: () => ({ power: 1, powerAt: 0 }),
  act(s, a, now) {
    const me = s.pos[a.id];
    if (!me || Math.hypot(me.x * W - POWER.x, me.y * H - POWER.y) > REACH * 2)
      return false; // (only from beside it)
    if (now - (s.hang.powerAt || 0) < (powered(s) ? 800 : WAIT)) return false; // (back on only after the wait; a double press does nothing)
    s.hang.power = powered(s) ? 0 : 1;
    s.hang.powerAt = now;
    return true;
  },
});
rule("flame", {
  init: () => ({ unlit: {} }), // flame id → 1 while it's out
  act(s, a) {
    const f = FLAMES.find((f) => f.id === a.f),
      me = s.pos[a.id];
    if (!f || !me || flameD(f, me.x * W, me.y * H) > REACH * 2) return false;
    const u = { ...(s.hang.unlit || {}) };
    if (u[f.id]) delete u[f.id];
    else u[f.id] = 1;
    s.hang.unlit = u;
    return true;
  },
});

/* ---------- the dark ----------
   Lights only the dark knows (the ground's pools are world.js'): the deck's string lights along its rail, the pool's
   lights under the water, the jeep in the first lamppost's light, the deck table's lantern */
const EXTRA = [
  { x: 710, y: 560, r: 300, k: 0.5, el: true },
  { x: dt.x + dt.w / 2, y: dt.y, r: 240, k: 0.5, flick: 0.5, flame: "deck" },
];
for (let x = DECK.x0 + 150; x < DECK.x1; x += 300)
  EXTRA.push({ x, y: DECK.y1 - 120, r: 300, k: 0.5, el: true });
for (let x = POOL.x0 + 150; x < POOL.x1; x += 300)
  for (let y = POOL.y0 + 120; y < POOL.y1; y += 260)
    EXTRA.push({ x, y, r: 280, k: 0.45, el: true });
const OUT = [...LIGHTS.filter((l) => l.only !== "in"), ...EXTRA],
  IN = LIGHTS.filter((l) => l.only === "in" && !l.el);
const shines = (l, s, w) =>
  l.prop || !l.flame
    ? w.shines(l)
    : (!l.el || powered(s)) && !isOut(s, l.flame);
/* in the light (for the music): near a light that shines, or (the power on) on the deck or by the pool */
function lit(x, y, s, w) {
  if (powered(s) && (inDeck(x, y) || inPool(x, y))) return true;
  return OUT.some(
    (l) => Math.hypot(x - l.x, y - l.y) < l.r * 0.8 && shines(l, s, w),
  );
}

let cv = null,
  g = null,
  last = 0,
  was = null,
  hum = null,
  darkSince = 0,
  muffled = false,
  roofDark = null,
  drawn = "";
const darkURL = () => darkURL.u || (darkURL.u = svgDataURL(cabinSVG(true)));
/* the dark: first what goes on it (each number in the canvas' px), then the drawing, only when that changed (the camera
   moved, a light flickered: flicker.js' clock, 20 times a second); with nothing on it (inside, the power on) it's hidden */
function paint(now, ctx) {
  const Wd = ctx.world,
    s = ctx.state(),
    on = powered(s),
    w = Math.round(Wd.vw * Q),
    h = Math.round(Wd.vh * Q),
    ln = lightNow(now),
    sc = Wd.sc * Q;
  const empty = Wd.inside && on;
  if (cv.hidden !== empty) cv.hidden = empty;
  if (empty) {
    drawn = "";
    return;
  }
  const f = (v) => v.toFixed(1),
    holes = [];
  let base,
    pool = null;
  if (Wd.inside) {
    // a blackout inside: the cabin dims (the shade covers the rest), but for its fires
    const a = Wd.toScreen(CABIN.x0, CABIN.y0 - CABIN.wall - 30),
      b = Wd.toScreen(CABIN.x1, CABIN.y1 + 14);
    base = [a.left * Q, a.top * Q, (b.left - a.left) * Q, (b.top - a.top) * Q];
  } else if (!on) {
    // the pool's lights out under the water: darker still over it, its edge soft
    const c = Wd.toScreen(
      (POOL.x0 + POOL.x1) / 2,
      (POOL.y0 + POOL.y1) / 2,
      POOL.h,
    );
    pool = [
      c.left * Q,
      c.top * Q,
      (POOL.x1 - POOL.x0) * 0.62 * sc,
      (POOL.y1 - POOL.y0) * 0.62 * sc,
    ];
  }
  for (const l of Wd.inside ? IN : OUT) {
    if (!shines(l, s, Wd)) continue;
    const fl = sway(l, ln),
      p = Wd.toScreen(l.x, l.y, heightAt(l.x, l.y) + (l.z || 0)),
      x = p.left * Q,
      y = p.top * Q,
      r = l.r * 1.2 * fl * sc;
    if (x + r < 0 || x - r > w || y + r < 0 || y - r > h) continue;
    holes.push([x, y, r, Math.min(1, l.k * 1.8) * fl * stutterOf(l, ln)]);
  }
  /* a faint glow round my own duck (only mine), so I can find myself in the dark */
  const me = Wd.at(ctx.me),
    mp = me && Wd.toScreen(me.x, me.y, me.z + 24);
  const key = [
    w,
    h,
    base && base.map(f),
    pool && pool.map(f),
    mp && f(mp.left) + f(mp.top),
    sc.toFixed(4),
    ...holes.map((o) => f(o[0]) + f(o[1]) + f(o[2]) + o[3].toFixed(3)),
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
  if (base) {
    g.fillStyle = `rgba(4,6,16,${DARK_IN})`;
    g.fillRect(...base);
  } else {
    g.fillStyle = `rgba(4,6,16,${DARK})`;
    g.fillRect(0, 0, w, h);
    if (pool) {
      const [x, y, rx, ry] = pool;
      g.save();
      g.translate(x, y);
      g.scale(1, ry / rx);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      rg.addColorStop(0, "rgba(2,6,18,.4)");
      rg.addColorStop(0.75, "rgba(2,6,18,.34)");
      rg.addColorStop(1, "rgba(2,6,18,0)");
      g.fillStyle = rg;
      g.fillRect(-rx, -rx, 2 * rx, 2 * rx);
      g.restore();
    }
  }
  g.globalCompositeOperation = "destination-out";
  for (const [x, y, r, k] of holes) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(0,0,0,${k.toFixed(3)})`);
    rg.addColorStop(0.45, `rgba(0,0,0,${(k * 0.85).toFixed(3)})`);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  if (mp) {
    const x = mp.left * Q,
      y = mp.top * Q,
      r = ME_GLOW * sc,
      rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, "rgba(0,0,0,.5)");
    rg.addColorStop(0.4, "rgba(0,0,0,.32)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  g.globalCompositeOperation = "source-over";
}
function setMuffle(on) {
  if (on === muffled) return;
  muffled = on;
  music.setMuffle?.(on);
}
function quiet() {
  if (hum) hum.stop();
  hum = null;
}

activity({
  id: "power",
  kinds: ["powerbox", "sink", "post", ...new Set(FLAMES.map((f) => f.p.kind))],
  mount(ctx) {
    cv = document.createElement("canvas");
    cv.className = "hang-dark";
    cv.setAttribute("aria-hidden", "true");
    ctx.world.board.querySelector(".hang-shade")?.after(cv);
    g = cv.getContext("2d");
    was = null;
    darkSince = 0;
    roofDark = null;
    drawn = "";
  },
  unmount(ctx) {
    cv?.remove();
    cv = g = null;
    quiet();
    setMuffle(false);
    ctx?.world?.board.classList.remove("blackout");
    was = null;
  },
  near(pos, ctx) {
    const s = ctx.state();
    if (!pos.inside) {
      const d = Math.hypot(pos.x - POWER.x, pos.y - POWER.y);
      if (d < REACH) {
        if (!powered(s) && last - ((s.hang || {}).powerAt || 0) < WAIT)
          return null; // (the ring counts down meanwhile)
        return {
          label: powered(s) ? "Cut power" : "Power on",
          d,
          act: () => ctx.send({ t: "hang", k: "power" }),
        };
      }
    }
    let best = null,
      bd = REACH;
    for (const f of FLAMES) {
      if (!!f.out === pos.inside) continue;
      const d = flameD(f, pos.x, pos.y);
      if (d < bd) {
        bd = d;
        best = f;
      }
    }
    if (!best) return null;
    const out = isOut(s, best.id);
    return {
      label: best.w[out ? 1 : 0],
      d: bd,
      act: () => ctx.send({ t: "hang", k: "flame", f: best.id }),
    };
  },
  onState(s, ctx) {
    const now = { on: powered(s), unlit: { ...((s.hang || {}).unlit || {}) } };
    if (was) {
      if (now.on !== was.on) {
        play("lever", POWER);
        play(now.on ? "powerUp" : "powerDown", POWER);
      }
      for (const f of FLAMES) {
        const at = { x: f.pts[0][0], y: f.pts[0][1] };
        if (now.unlit[f.id] && !was.unlit[f.id]) play(f.w[2], at);
        else if (!now.unlit[f.id] && was.unlit[f.id]) play("relight", at); // (lit again: a match; sounds.js plays nothing till it has one)
      }
    }
    was = now;
    ctx.world.board.classList.toggle("blackout", !now.on);
  },
  step(dt, now, ctx) {
    last = now;
    const s = ctx.state(),
      me = ctx.world.at(ctx.me);
    if (!me) return;
    /* the transformer hums while the power is on, near the box (sounds.js fades it with the distance) */
    const far = Math.hypot(me.x - POWER.x, me.y - POWER.y);
    if (powered(s) && far < 650) {
      if (!hum) hum = loop("hum", { x: POWER.x, y: POWER.y });
    } else if (!powered(s) || far > 750) quiet();
    /* outside in the dark long enough: the music muffles; back in the light or inside: at once clear again */
    if (!ctx.world.inside && !lit(me.x, me.y, s, ctx.world)) {
      darkSince = darkSince || now;
      if (now - darkSince >= MUFFLE_AFTER) setMuffle(true);
    } else {
      darkSince = 0;
      setMuffle(false);
    }
  },
  draw(now, ctx) {
    if (!cv) return;
    paint(now, ctx);
    const s = ctx.state(),
      on = powered(s),
      Wd = ctx.world;
    /* the ring on the box: full as the lever goes down, empty when the power can go back on */
    const box = Wd.propEl(BOX.id),
      left = on
        ? 0
        : Math.max(0, WAIT - (now - ((s.hang || {}).powerAt || 0))) / WAIT,
      off = Math.round(100 - left * 100);
    if (box && box._ring !== off) {
      box._ring = off;
      const r = box.querySelector(".pb-ring");
      if (r) {
        r.style.strokeDashoffset = off;
        r.style.opacity = off < 100 ? 1 : 0;
      }
    }
    /* the cabin from outside: its windows dark while the power's out (the picture swapped once it's ready) */
    const roof = Wd.propEl(ROOF.id)?.querySelector("img");
    if (roof && roofDark !== !on) {
      roofDark = !on;
      roof._lit = roof._lit || roof.src;
      if (on) roof.src = roof._lit;
      else {
        const im = new Image();
        im.src = darkURL();
        im.decode().then(
          () => {
            if (roofDark) roof.src = im.src;
          },
          () => {
            if (roofDark) roof.src = im.src;
          },
        );
      }
    }
  },
  propClass(p, s) {
    if (p.kind === "powerbox") return powered(s) ? "" : "pb-off";
    if (p.kind === "sink" || p.kind === "post") return powered(s) ? "" : "off";
    if (!FLAME_PROPS.has(p.id)) return "";
    return [
      ...new Set(
        FLAMES.filter((f) => f.p === p && isOut(s, f.id)).map(
          (f) => "unlit-" + f.c,
        ),
      ),
    ].join(" ");
  },
  /* the ground's pools: an electric one is out in a blackout; a fire's, a candle's or a lantern's while it's put out */
  light(p, s, l) {
    if (l && l.el && !powered(s)) return false;
    if (
      p &&
      FLAME_PROPS.has(p.id) &&
      FLAMES.some((f) => f.pool && f.p === p && isOut(s, f.id))
    )
      return false;
    return undefined;
  },
});
