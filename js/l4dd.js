/* ---------- Left 4 Dead Ducks on every screen ----------
   Duck Cabin's world draws it (an activity that runs only in this mode, registry.js): the zombies where the host says
   (gliding between its heartbeats), their thin HP bars, a red blink when hit, the claw's swipe, lying down and fading
   when they die; the boards over the openings; the extra candles; the dark over everything (the power is cut) with the
   fires, the candles and every duck's flashlight cut out of it (a cone the way it aims, stopped by the walls); "Round N"
   at the top; the end. Hold E by a downed duck to revive it, or by an opening to board it up; key 0 switches my
   flashlight. My duck walks at half speed and has 7 seconds of sprint (a thin blue bar under my name). The rules are
   the host's (l4ddrules.js); the weapons bar is l4ddbar.js. */
import { activity } from "./hangout/registry.js";
import {
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
import { low } from "./gfx.js";
import { nameHTML } from "./name.js";
import { L4, OPENINGS, playable, zombiesOf, startSpot } from "./l4ddrules.js";
import {
  zombieURL,
  zombieBox,
  CANDLE,
  CANDLE_BOX,
  boardsSVG,
  boardsBox,
} from "./l4ddart.js";

const RX = 56,
  RY = 25.6; // (a zombie's room on the floor, as the rules')
const SPEED = 0.5; // my duck at half of Duck Cabin's walk (the owner's)
const DARK = 0.93; // how dark the dark is
const CONE = { far: 560, half: (27 * Math.PI) / 180 }; // the flashlight: how far, and half its width
const GLOW = 80; // world px: the faint light round every duck
const CANDLE_LIGHT = { r: 190, k: 0.62, flick: 1 };
const P4 = (s, id) => ((s && s.hang && s.hang.l4p) || {})[id] || null;
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

/* where an opening's boards sort: just in front of the wall piece they're on (a side wall's pieces sort by their own
   front, so a hole's boards go just after its piece) */
const WALL_PROPS = PROPS.filter((p) => p.kind === "wall" && p.block);
const boardKey = (o) => {
  const w = WALL_PROPS.find(
    (p) =>
      o.x >= p.block[0] - 1 &&
      o.x <= p.block[2] + 1 &&
      o.y >= p.block[1] - 1 &&
      o.y <= p.block[3] + 1,
  );
  return Math.round(w ? w.key + 1 : sortY(o.x, o.y + 16, 0)) + 10;
};

/* ---------- what this screen keeps ---------- */
const Z = new Map(); // zombie number → how it's drawn here
const B = new Map(); // opening id → its boards' element
const C = []; // the candles' elements
let layer = null,
  fxl = null,
  cv = null,
  g = null,
  hud = null,
  over = null,
  zpSig = "",
  snapAt = 0,
  gap = 200,
  roundShown = 0,
  overShown = "",
  candleSig = "",
  stamina = 1,
  tired = false,
  holding = null,
  walkDir = [1, 0],
  lastXY = null,
  drawn = "";

const LIT = {
  in: LIGHTS.filter((l) => l.only === "in" && !l.el),
  out: LIGHTS.filter((l) => l.only !== "in" && !l.el),
};

function zombieEl(z) {
  const el = document.createElement("div"),
    box = zombieBox(z.l);
  el.className = "l4z";
  el.innerHTML = `<div class="l4z-body"><img alt="" draggable="false" src="${zombieURL(z.l)}"></div><span class="l4z-hp"><i></i></span>`;
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
    if (z.st === 3 && o.st !== 3) {
      o.el.classList.add("dead");
      o.diedAt = now;
    }
    if (z.a !== o.a && z.a > 0 && z.st === 2)
      if (inCabin(o.x, o.y) === ctx.world.inside)
        claw(o.x, o.y, z.dir / 100, ctx);
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

/* ---------- the HUD: "Round N", and the end ---------- */
function seeHud(s, ctx) {
  const L = s.hang.l4;
  if (!hud || !L) return;
  if (roundShown !== L.r) {
    hud.innerHTML = `<span class="l4-round-w">Round</span> <b>${L.r}</b>`;
    hud.classList.remove("new");
    void hud.offsetWidth;
    if (roundShown) hud.classList.add("new"); // (a new round: it pulses)
    roundShown = L.r;
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

/* ---------- holding E: reviving a downed duck, boarding up an opening ---------- */
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
  return best;
}
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
    ctx.world.board.append(hud, over);
    ctx.world.board.classList.add("blackout", "l4-board");
    Z.clear();
    B.clear();
    C.length = 0;
    zpSig = candleSig = overShown = drawn = "";
    roundShown = 0;
    stamina = 1;
    tired = false;
    holding = null;
  },
  unmount(ctx) {
    for (const o of Z.values()) o.el.remove();
    for (const b of B.values()) b.el.remove();
    for (const c of C) c.el.remove();
    Z.clear();
    B.clear();
    C.length = 0;
    cv?.remove();
    hud?.remove();
    over?.remove();
    cv = g = hud = over = layer = fxl = null;
    ctx?.world?.board.classList.remove("blackout", "l4-board");
  },
  onState(s, ctx) {
    if (!layer || !s.hang || !s.hang.l4) return;
    const now = performance.now();
    seeZombies(s, ctx, now);
    seeBoards(s);
    seeCandles(s);
    seeHud(s, ctx);
    if (holding && !up(s, ctx.me)) holding = null;
  },
  step(dt, now, ctx) {
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
    paint(now, ctx);
    /* my sprint: a thin blue bar under my name, while it isn't full */
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
      act: () => (holding ? stopHold(ctx) : startHold(t, ctx)), // (a tap on the button holds until I walk away)
    };
  },
  keydown(e, ctx) {
    if (e.code === "Digit0" || e.code === "Numpad0") {
      if (!e.repeat) ctx.send({ t: "hang", k: "l4", do: "fl" });
      return true;
    }
    if (e.code === "KeyE") {
      e.preventDefault();
      if (e.repeat || holding) return true;
      const me = ctx.duck();
      if (me) startHold(holdTarget({ x: me.x * W, y: me.y * H }, ctx), ctx);
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
  propClass(p) {
    if (["lamp", "sink", "post", "tv"].includes(p.kind)) return "off";
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
  speed: () => SPEED,
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
