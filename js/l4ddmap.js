/* ---------- Quacky Zombies' minimap ----------
   Bottom left, in Quacky Zombies only: the whole map (the cabin's floor, its walls, the deck and its stairs) as plain
   shapes, no furniture; every duck's head where it stands (mine ringed in white); a red dot for every zombie some
   duck's camera sees right now. A dot fades in as its zombie comes into any camera and fades out quickly once none sees
   it. I want it dead simple and cheap: the map is drawn once, and the canvas only 12 times a second. */
import {
  CABIN,
  DECK,
  STAIRS,
  PROPS,
  inCabin,
  seenFrom,
} from "./hangout/layout.js";
import { shownDuck } from "./looks.js";

const X0 = 1250,
  X1 = 4550,
  Y0 = 560,
  Y1 = 2640; // the world it shows: the cabin, the deck and the stairs' landing, a little round them
const EVERY = 80; // ms between drawings
const IN_MS = 250,
  OUT_MS = 400; // a dot's fade in, and its quicker fade out (it's gone in under half a second)
const LAND = { x0: STAIRS.x0, x1: STAIRS.x1, y0: STAIRS.y0, y1: STAIRS.land };

let cv = null,
  g = null,
  bg = null, // the map, drawn once at this size
  size = "",
  drawnAt = 0,
  board = null,
  bar = null;
const dots = new Map(), // zombie number -> its dot: [x, y, alpha, seen]
  faces = new Map(); // duck id -> [last x, which way it faces]

export function mapMount(b) {
  board = b;
  cv = document.createElement("canvas");
  cv.className = "l4-map";
  cv.setAttribute("aria-hidden", "true");
  board.append(cv);
  g = cv.getContext("2d");
  size = "";
  dots.clear();
  faces.clear();
  addEventListener("resize", place);
  place();
  setTimeout(place, 600); // (the bottom bar may still be settling)
}
export function mapUnmount() {
  removeEventListener("resize", place);
  cv?.remove();
  cv = g = bg = board = null;
  dots.clear();
  faces.clear();
}
/* just over the bottom bar (Notes, the keys), whatever its height on this screen; only when the screen changes */
function place() {
  if (!cv || !board) return;
  bar = document.querySelector(".bbar");
  const br = board.getBoundingClientRect(),
    top = bar && bar.offsetParent ? bar.getBoundingClientRect().top : br.bottom;
  cv.style.bottom = Math.max(8, Math.round(br.bottom - top + 8)) + "px";
}

/* the map's own px for a world spot */
function frame(w, h) {
  const k = Math.min(w / (X1 - X0), h / (Y1 - Y0));
  return {
    k,
    x: (x) => (x - X0) * k,
    y: (y) => (y - Y0) * k,
  };
}
function drawMap(w, h, dpr) {
  const c = document.createElement("canvas");
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const m = c.getContext("2d"),
    f = frame(w, h);
  m.scale(dpr, dpr);
  const box = (x0, y0, x1, y1) =>
    m.fillRect(f.x(x0), f.y(y0), (x1 - x0) * f.k, (y1 - y0) * f.k);
  m.fillStyle = "rgba(196,150,96,.55)"; // the cabin's floor
  box(CABIN.x0, CABIN.y0, CABIN.x1, CABIN.y1);
  m.fillStyle = "rgba(150,104,62,.6)"; // the deck and the stairs' landing
  box(DECK.x0, DECK.y0, DECK.x1, DECK.y1);
  box(LAND.x0, LAND.y0, LAND.x1, LAND.y1);
  m.fillStyle = "rgba(246,236,216,.9)"; // the walls (the doors are their gaps)
  const t = Math.max(1.5 / f.k, 0); // (at least 1.5 px thick)
  for (const p of PROPS) {
    if (p.kind !== "wall" || !p.block) continue; // (the room's cabin's: Quacky Zombies' has its holes)
    const [x0, y0, x1, y1] = p.block;
    const cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2,
      ww = Math.max(x1 - x0, t),
      hh = Math.max(y1 - y0, t);
    box(cx - ww / 2, cy - hh / 2, cx + ww / 2, cy + hh / 2);
  }
  return c;
}

/* each frame from l4dd.js: zs = its zombies (x, y, st: 3 is dead), alive(id) = a duck that's up (not downed, not a ghost) */
export function mapDraw(now, ctx, s, zs, alive) {
  if (!cv) return;
  const Wd = ctx.world;
  if (!Wd.sc || !Wd.vw) return;
  const phone = Wd.vw < 600,
    w = phone ? 124 : 196,
    h = Math.round((w * (Y1 - Y0)) / (X1 - X0)),
    dpr = Math.min(2, devicePixelRatio || 1),
    key = w + "x" + h + "@" + dpr;
  if (key !== size) {
    size = key;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    bg = drawMap(w, h, dpr);
    drawnAt = 0;
  }
  if (now - drawnAt < EVERY) return;
  const dt = drawnAt ? now - drawnAt : EVERY;
  drawnAt = now;
  /* every duck's camera: the box round it, as big as mine, on its side of the cabin's walls (or through a hole in them,
     Quacky Zombies' onto the deck) */
  const hw = Wd.vw / 2 / Wd.sc,
    hh = Wd.vh / 2 / Wd.sc,
    cams = [];
  const ducks = [];
  for (const id of s.seat || []) {
    const a = Wd.at(id);
    if (!a) continue;
    const ins = inCabin(a.x, a.y);
    cams.push([a.x, a.y, ins]);
    ducks.push([id, a.x, a.y]);
  }
  const sees = (x, y) => {
    for (const [cx, cy, ci] of cams)
      if (Math.abs(x - cx) < hw && Math.abs(y - cy) < hh && seenFrom(x, y, ci))
        return true;
    return false;
  };
  const live = new Set();
  for (const z of zs) {
    live.add(z.i);
    let d = dots.get(z.i);
    if (!d) dots.set(z.i, (d = [z.x, z.y, 0]));
    d[0] = z.x;
    d[1] = z.y;
    const on = z.st !== 3 && sees(z.x, z.y);
    d[2] = on
      ? Math.min(1, d[2] + dt / IN_MS)
      : Math.max(0, d[2] - dt / OUT_MS);
  }
  for (const [i, d] of dots)
    if (!live.has(i)) {
      d[2] = Math.max(0, d[2] - dt / OUT_MS);
      if (d[2] <= 0) dots.delete(i);
    }
  /* draw: the map, the dots, then the heads over them */
  const f = frame(w, h);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.drawImage(bg, 0, 0, w, h);
  const r = phone ? 2.4 : 3;
  g.fillStyle = "#ff3b3b";
  for (const [x, y, a] of dots.values()) {
    if (a <= 0) continue;
    g.globalAlpha = a;
    g.beginPath();
    g.arc(f.x(x), f.y(y), r, 0, 2 * Math.PI);
    g.fill();
  }
  g.globalAlpha = 1;
  const hr = phone ? 4 : 5;
  for (const [id, x, y] of ducks) {
    let fc = faces.get(id);
    if (!fc) faces.set(id, (fc = [x, 1]));
    if (Math.abs(x - fc[0]) > 2) fc[1] = x > fc[0] ? 1 : -1;
    fc[0] = x;
    const p = s.players[id];
    if (!p) continue;
    const L = shownDuck(s, { ...p, id }),
      cx = f.x(x),
      cy = f.y(y),
      dir = fc[1];
    g.globalAlpha = alive(id) ? 1 : 0.45; // (downed or a ghost: faint)
    // the beak, then the head over it, then the eye
    g.fillStyle = L.beakColor || "#ff9f1c";
    g.beginPath();
    g.moveTo(cx + dir * (hr - 1), cy - hr * 0.35);
    g.lineTo(cx + dir * (hr + hr * 0.75), cy + hr * 0.05);
    g.lineTo(cx + dir * (hr - 1), cy + hr * 0.45);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(cx, cy, hr, 0, 2 * Math.PI);
    g.fillStyle = L.color || "#ffd23f";
    g.fill();
    g.lineWidth = id === ctx.me ? 1.6 : 1;
    g.strokeStyle = id === ctx.me ? "#fff" : "rgba(0,0,0,.7)";
    g.stroke();
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(
      cx + dir * hr * 0.35,
      cy - hr * 0.25,
      Math.max(0.8, hr * 0.2),
      0,
      2 * Math.PI,
    );
    g.fill();
  }
  g.globalAlpha = 1;
}
