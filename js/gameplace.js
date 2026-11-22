/* ---------- where things are put on the screen: the dining table and its seats, the pick's tiles, the cake, the desk, the story's lines, the bracket's pan and zoom ----------
   Moved out of game.js to keep that file small (a pure move). It imports back from game.js, which imports it. */
import {
  JUSTIN2,
  R,
  S,
  bbZoom,
  geo,
  hidden,
  me,
  mgjRv,
  scZone,
  setBbZoom,
  setCam,
  setMgjRv,
  setScZone,
  turned,
  world,
} from "./game.js";
import { place } from "./gameboard.js";
import { actHTML } from "./gameact.js";
import { fire } from "./gamehand.js";
import { hurt } from "./gamefx.js";
import { ZEBRA } from "./gunart.js";
import { go } from "./router.js";
import { el, esc, $, setHTML, ducksLayer } from "./ui.js";
import { boardPhases } from "./rules.js";
import { REACH } from "./boardfire.js";
import { SC_VOTES, scZones, zoneAt, scCanVote, scLineOf } from "./scrules.js";
import { treeSize } from "./brackets.js";
import { hand, handIn } from "./hotpick.js";
import { olAdd } from "./outlines.js";
import { zombieLook } from "./l4ddrules.js";
import { clawMark } from "./claw.js";
import { popHP } from "./hpmeter.js";
import { sbOnBoard, noGoreOf, sbHasOl, sbOlColor } from "./sandboxrules.js";
import { sbRoofed } from "./sbspawnview.js";
import { justinAt, justinShown, JUSTIN_ID } from "./boardjustin.js";
import { sfx } from "./sound.js";
import { feet } from "./feet.js";
import { now as clockNow } from "./clock.js";
import {
  isMgj,
  mgjFrozen,
  PICK_FADE,
  XB,
  MGJ_SCALE,
  MGJ_HAMMER,
  downNear,
  REVIVE,
  EDGE_WARN,
  GUN_TELL,
  HAMMER_TELL,
  BURST,
  SPREAD,
  DUCK_LEN,
  cakeAt,
} from "./mgjrules.js";
import { FLAME, FOODS, edgeHTML } from "./mgjart.js";
import {
  npcURL,
  npcBox,
  npcName,
  npcSay,
  isZombie,
  npcPics,
  npcReady,
  heldOf,
  handAt,
  npcShot,
} from "./sbnpcart.js";
import { goreFree, BY_WOUND, newWound } from "./wounds.js";
import { DESK, pickHTML as mgjPickHTML } from "./mgj.js";
import { VD_TABLE, seatOf, vdTileRects } from "./vddrules.js";
import { TABLE_W, SEAT_OUT } from "./vdd.js";
import { touchOnly } from "./pointer.js";
import { fxHitAt, fxEye } from "./fx.js";
import { vibrate, hitPx, HIT } from "./fxmotion.js";

/* ---------- Valentine's Duck Date: the table, its chairs and the two seated at it; the pick's tiles ---------- */
/* the table's feet on this screen, and its width */
const tableAt = () => {
  const c = place(VD_TABLE, 0, 1);
  return { ...c, w: geo.size * TABLE_W };
};
/* where a duck at the table is drawn: right beside it on this screen, whatever the board's shape (null: not seated) */
export function seatAt(s, id) {
  const k = seatOf(s, id);
  if (k < 0 || !geo) return null;
  const c = tableAt();
  return { left: c.left + (k ? 1 : -1) * SEAT_OUT * geo.size, top: c.top };
}
/* the table stands just behind the two at it (their name tags stay in sight) and keeps its place in depth with everyone
   walking about; each chair stands just behind its duck */
export function placeTable(board) {
  const tb = board.querySelector(".vd-table");
  if (!tb || !geo) return;
  const c = tableAt(),
    h = (c.w * 150) / 240,
    cw = geo.size * 0.8,
    ch = (cw * 132) / 80,
    st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${c.w.toFixed(1)}`;
  if (tb._st === st) return;
  tb._st = st;
  Object.assign(tb.style, {
    left: (c.left - c.w / 2).toFixed(1) + "px",
    top: (c.top - (h * 138) / 150).toFixed(1) + "px",
    width: c.w.toFixed(1) + "px",
    height: h.toFixed(1) + "px",
    zIndex: Math.round(c.top) - 1,
  });
  for (const ch0 of board.querySelectorAll(".vd-chair")) {
    const k = +ch0.dataset.k,
      x = c.left + (k ? 1 : -1) * (SEAT_OUT + 0.12) * geo.size;
    Object.assign(ch0.style, {
      left: (x - cw / 2).toFixed(1) + "px",
      top: (c.top - (ch * 128) / 132).toFixed(1) + "px",
      width: cw.toFixed(1) + "px",
      height: ch.toFixed(1) + "px",
      zIndex: Math.round(c.top) - 2,
    });
  }
}
/* the pick's tiles, on the same spots as the host's (so a duck is on the tile it looks to be on) */
export function placeTiles(board) {
  const box = board.querySelector(".vd-tiles");
  if (!box || !geo) return;
  const rs = vdTileRects(box.children.length),
    st = `${geo.W},${geo.H},${geo.size},${rs.length}`;
  if (box._st === st) return;
  box._st = st;
  [...box.children].forEach((t, k) => {
    const a = place({ x: rs[k].x0, y: rs[k].y0 }, 0, 1),
      b = place({ x: rs[k].x1, y: rs[k].y1 }, 0, 1);
    Object.assign(t.style, {
      left: a.left.toFixed(1) + "px",
      top: a.top.toFixed(1) + "px",
      width: (b.left - a.left).toFixed(1) + "px",
      height: (b.top - a.top).toFixed(1) + "px",
    });
  });
}

/* Mad God Justin: his Xbox's desk, where it came in; dark once he turns it off, gone a moment after he's back */
export function placeDesk(board, s, now) {
  const x = isMgj(s) && s.mgj && s.mgj.xb,
    layer = ducksLayer(board);
  let n = layer && layer.querySelector(".mgj-desk");
  const on =
    !!x &&
    ["boss", "mgjend"].includes(s.phase) &&
    (!x.done || now - x.done < XB.OUT);
  if (n && (!on || +n.dataset.at !== x.at)) {
    n.remove();
    n = null;
  }
  if (!on || !layer || !geo) return;
  if (!n) {
    n = el(`<div class="mgj-desk" data-at="${x.at}">${DESK}</div>`);
    n.style.setProperty("--in", XB.IN + "ms");
    n.style.setProperty("--out", XB.OUT + "ms");
    layer.append(n);
  }
  n.classList.toggle("off", !!x.off && now >= x.off);
  n.classList.toggle("out", !!x.done);
  const c = place(x, 0, 1),
    w = geo.size * 2.2,
    st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${w.toFixed(1)}`;
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: c.left + "px",
    top: c.top + "px",
    width: w + "px",
    zIndex: Math.round(c.top - 3),
  });
}

/* Mad God Justin: his zombie waves (mgjrules.js wavesTick), each where the host says it is, gliding there (css), the
   way it last clawed; a dead one falls over and fades */
const ZB_GLIDE = 100;
/* Sandbox on the board: how big a duck is on my screen, in the board's shares, [a, b, c, d] (one duck width across the
   screen is (a, b) on the board, one down is (c, d)), so the host hits its NPCs where I see them (sbbody.js). Sent when
   it changes, and again if the room lost it */
let duAt = 0;
function sendDu(s) {
  if (!geo || geo.hang || geo.sc || geo.tl || geo.qp || !sbOnBoard(s)) return;
  const { W, H, size, labelH } = geo,
    du = (
      turned()
        ? [0, size / (0.8 * W), -size / H, 0]
        : [size / W, 0, 0, size / (H - size * 1.08 - labelH)]
    ).map((v) => +v.toFixed(4)), // (as place() puts the board on the screen)
    had = ((s.sb && s.sb.du) || {})[R.me];
  if (!du.every(Number.isFinite) || (had && had.join() === du.join())) return;
  const t = performance.now();
  if (t - duAt < 1500) return; // (one on its way)
  duAt = t;
  R.send({ t: "sb", k: "du", du });
}
/* the way a zombie on the board walks (n: its element, x: where it is now): turned only once it keeps going the other way
   a moment (FACE_HOLD). Bumping into another or a wall pushed it back and forth a few px, and its picture flipped each
   time, as if squished (the owner's, Nov 19 19:27Z: "I do not want a squish effect on zombies, for example, when they
   walk into each other or walk into a wall"); as Dead Ducks Arcade's zombies, l4dd.js */
const FACE_HOLD = 300;
function walkFace(n, x, now) {
  const f = n._f || 1,
    dir =
      n._x === undefined || Math.abs(x - n._x) < 0.5 ? 0 : x < n._x ? -1 : 1;
  if (!dir || dir === f) {
    if (dir) n._went = 1;
    n._turn = 0;
    return f;
  }
  if (!n._went) {
    n._went = 1;
    return dir; // (its first steps: the way it goes at once)
  }
  if (n._turn !== dir) {
    n._turn = dir;
    n._turnAt = now;
    return f;
  }
  return now - n._turnAt >= FACE_HOLD ? dir : f;
}
export function placeZombies(board, s, now) {
  const layer = ducksLayer(board),
    zb =
      (((isMgj(s) && s.phase === "boss") || sbOnBoard(s)) && s.mz && s.mz.zb) ||
      []; // (and Sandbox's board: its spawns' zombies, sbspawn.js)
  if (!layer || !geo) return;
  sendDu(s);
  npcPics(s.sbpic); // (the room's uploaded pictures: a spawn's Appearance tab)
  const sbOl = sbOnBoard(s) && sbHasOl(s),
    want = new Set(zb.map((o) => String(o.i))),
    fxl = $(".fxl", board),
    ng = noGoreOf(s),
    have = new Map(); // (found once a frame, not one search for each of up to 800)
  /* claw marks: a few at a time (Sandbox can have 800 clawing at once, and each mark is a drawing made into pixels) */
  let marks = fxl
    ? 4 - Math.floor(fxl.querySelectorAll(".l4-claw").length / 4)
    : 0;
  /* a crowd (more than ZB_GLIDE) steps from beat to beat instead of gliding: 800 transitions cost even a graphics card */
  layer.classList.toggle("zb-many", zb.length > ZB_GLIDE);
  for (const n of layer.querySelectorAll(".mgj-z"))
    if (!want.has(n.dataset.i)) n.remove();
    else have.set(n.dataset.i, n);
  for (const o of zb) {
    let n = have.get(String(o.i));
    if (!n) {
      n = document.createElement("div");
      n.className = "mgj-z";
      n.dataset.i = o.i;
      n.innerHTML = `<img alt="" draggable="false" src="${npcURL(o)}"><span class="l4z-hp"><b></b><i></i></span>${npcName(o)}`; // (Sandbox's: a zombie, or a duck of another kind, its name over it: sbnpcart.js)
      n._img = n.firstChild;
      n._bar = n.querySelector(".l4z-hp");
      n._w = "";
      n._pic = "";
      n._shot = o.sh ? o.sh[0] : 0; // (only shots from now on are drawn)
      layer.append(n);
    }
    if (sbOnBoard(s)) {
      // (the plain board: under a roof I'm not under, an NPC is hidden whole, as a duck is: row 161, a house)
      const rf = sbRoofed(s, "npc:" + o.i, o);
      if (n._rf !== rf) {
        n._rf = rf;
        n.classList.toggle("hang-hid", rf);
      }
    }
    const c = place(o, 0, 1),
      box = npcBox(o),
      ds = geo.size * (o.sz || 1), // (its size: a duck's, at its spawn's Size, sbspawn.js)
      k = ds / 64, // (px to one of its box's units: a duck's box is 64 wide)
      w = box.w * k,
      face =
        o.wp || (sbOnBoard(s) && o.f)
          ? o.f || 1 // (a made NPC: the way the host turned it, so its weapon points at what it shoots: sbarms.js; Sandbox's: the way it walks, as its hits are worked out, sbbody.js)
          : walkFace(n, c.left, now), // (the way it walks)
      st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${w.toFixed(1)},${face},${o.d ? 1 : 0}`;
    n._x = c.left;
    n._f = face;
    const was = n._hp,
      wc = o.w || "";
    /* a hit, as on Dead Ducks Arcade's zombies (l4dd.js seeZombies; the owner's, Nov 19 01:34Z: "this is the new feel and
       vibe of the game"): it shakes once by the HP it lost and once more as it dies, blinks red, "−N HP" over it, and
       bleeds by the wound it got, an eye flying when that's what it lost */
    if (was !== undefined && o.hp < was && !n._dead) {
      vibrate(n._img, hitPx(was - o.hp), !!o.d);
      if (!o.d) n._img.animate(HIT, 320);
      popHP(n, o.hp - was, true);
      const nw = newWound(n._w, wc);
      fxHitAt(
        c.left,
        c.top,
        box.h * k * 0.55,
        null,
        ds,
        BY_WOUND[nw],
        (isZombie(o) ? zombieLook(o.l) : o.dk || {}).color,
      );
      if (nw === "e" && !ng)
        fxEye(c.left, c.top, box.h * k * 0.75, Math.random() < 0.5 ? -1 : 1);
    }
    n._hp = o.hp;
    n._w = wc;
    /* on fire (the flamethrower or any fire: rules.js flameThings, o.bn): the burning duck's flame over it for 3 s */
    const lit = (o.bn || 0) > clockNow() && !o.d;
    if (n._lit !== lit) {
      n._lit = lit;
      if (lit && !n.querySelector(".gduck-fire"))
        n.insertAdjacentHTML(
          "beforeend",
          `<span class="gduck-fire" aria-hidden="true">${FLAME}</span>`,
        );
      n.classList.toggle("onfire", lit);
    }
    /* its wounds on its picture (Gore off: only a knocked-off hat), made only when they change */
    const pic =
      (ng ? goreFree(wc) : wc) +
      (o.d && !isZombie(o) ? "+dead" : "") +
      npcReady(o);
    if (n._pic !== pic) {
      n._pic = pic;
      n._img.src = npcURL(o, ng ? goreFree(wc) : wc);
    }
    /* a made NPC: the weapon in its hand, and its shots (sbarms.js) */
    const hd = heldOf(o);
    if ((hd && hd.w) !== n._hw) {
      n._hw = hd && hd.w;
      n.querySelector(".sb-held")?.remove();
      if (hd)
        n.insertAdjacentHTML(
          "beforeend",
          `<img class="sb-held" alt="" draggable="false" src="${hd.url}" style="--gw:${hd.gw}">`,
        );
    }
    if (o.sh && o.sh[0] !== n._shot) {
      const fresh = now - o.sh[0] < 1500;
      n._shot = o.sh[0];
      if (fresh && fxl) {
        const hand = handAt(box),
          t = place({ x: o.sh[1], y: o.sh[2] }, 0, 1);
        npcShot(
          fxl,
          c.left + (hand.x - box.w / 2) * k * face,
          c.top - (box.feet - hand.y) * k,
          t.left,
          t.top - geo.size * 0.45, // (a duck's middle, where it went)
          o.hw,
        );
      }
    }
    const sh = (Math.max(0, o.hp) / (o.l[0] || 1)).toFixed(3); // (its HP bar: shown once it's hurt, then stays; a hit's white drains to the red, css/app.css .l4z-hp)
    if (n._sh !== sh) {
      n._sh = sh;
      n._bar.style.setProperty("--hp", sh);
      if (+sh < 1) n.classList.add("hurt");
    }
    if (!!o.d !== !!n._dead) {
      n._dead = !!o.d;
      n.classList.toggle("dead", !!o.d);
    } // (dead: it falls over, lies there, then fades, its 4 s as Dead Ducks Arcade's: zombies.js ZOMBIE_BREEDS, deadMs)
    const clawing = !o.d && now - (o.a || 0) < 350;
    n.classList.toggle("claw", clawing);
    if (clawing && n._a !== o.a && fxl && marks-- > 0)
      clawMark(
        fxl,
        c.left + (o.f || face) * ds * 0.55,
        c.top - ds * 0.45,
        k * 1.25,
        (o.f || face) < 0 ? Math.PI : 0,
      ); // (its claw marks and swipe on the duck it swiped, as Dead Ducks Arcade's: claw.js)
    n._a = o.a;
    npcSay(n, o); // (Sandbox: what its Seriat file has it say, sbseriat.js)
    const oc = sbOl && !o.d && sbOlColor(s, { k: o.k, sp: o.sp }, o.x, o.y, 0);
    if (oc)
      olAdd({
        id: "mz" + o.i,
        img: n._img,
        x: c.left - w / 2,
        y: c.top - box.feet * k,
        w,
        h: box.h * k,
        flip: face < 0,
        kind: oc,
      }); // (Sandbox: in a zone whose Outlines take it, that color)
    if (n._st === st) continue;
    n._st = st;
    /* moved by transform, not left and top: 800 gliding left and top made the page lay itself out again every frame
       (Sandbox's board: about 10 frames a second) */
    n.style.transform = `translate(${(c.left - w / 2).toFixed(1)}px, ${(c.top - box.feet * k).toFixed(1)}px)`;
    const wh = `${w.toFixed(1)},${(box.h * k).toFixed(1)}`;
    if (n._wh !== wh) {
      n._wh = wh;
      n.style.width = w.toFixed(1) + "px";
      n.style.height = (box.h * k).toFixed(1) + "px";
    }
    n.style.zIndex = o.d ? 1 : Math.round(c.top); // (dead: under every duck, the owner's, Nov 19 10:22Z)
    n.style.setProperty("--face", face);
    n.style.setProperty("--feet", (box.feet * k).toFixed(1) + "px");
    n.style.setProperty("--k", k.toFixed(3));
  }
}
/* Mad God Justin: the pickup that faded in, where it lies (it goes once taken, or when the next one comes) */
export function placePick(board, s) {
  const m = isMgj(s) && s.phase === "boss" && s.mgj;
  placeToken(board, m && m.pick, "");
  placeToken(board, m && m.plus, "plus"); // (the little plus sign every 30 s: the owner's, Nov 17)
}
function placeToken(board, P, tag) {
  const layer = ducksLayer(board),
    sel = tag ? ".mgj-pick.k-" + tag : ".mgj-pick:not(.k-plus)";
  let n = layer && layer.querySelector(sel);
  if (n && (!P || +n.dataset.n !== P.n)) {
    n.remove();
    n = null;
  }
  if (!P || !layer || !geo) return;
  if (!n) {
    n = el(mgjPickHTML(P));
    n.style.setProperty("--fade", PICK_FADE + "ms");
    layer.append(n);
  }
  const c = place(P, 0, 1),
    w = geo.size * 0.9,
    st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${w.toFixed(1)}`;
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: c.left + "px",
    top: c.top + "px",
    width: w + "px",
    height: w + "px",
    zIndex: Math.round(c.top - 2),
  });
}

/* Mad God Justin: getting a downed duck up (the owner's, Nov 3: hold 5 s, no medkit). Over the downed duck nearest me
   a Revive button (hold it, or E), filling up while it's held; every revive going on shows its fill to everyone */
export function placeRevive(board, s, now) {
  const fxl = $(".fxl", board),
    m = isMgj(s) && s.phase === "boss" && s.mgj,
    near = m && me && !(s.players[R.me] || {}).dead && downNear(s, R.me),
    want = new Map();
  if (m) {
    for (const [by, r] of Object.entries(m.rv || {}))
      if (s.pos[r.id]) want.set(r.id, Math.min(1, (now - r.at) / REVIVE.MS));
    if (near && !want.has(near)) want.set(near, 0);
  }
  for (const b of fxl.querySelectorAll(".mgj-rv"))
    if (!want.has(b.dataset.pid)) b.remove();
  if (!want.size && mgjRv) mgjRevive(false);
  for (const [id, k] of want) {
    let b = fxl.querySelector(`.mgj-rv[data-pid="${CSS.escape(id)}"]`);
    if (!b) {
      b = el(
        `<button type="button" class="mgj-rv" data-pid="${esc(id)}"><i></i><span>${touchOnly() ? "Hold" : "Hold <kbd>E</kbd>"}</span></button>`,
      );
      const go = (on) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (on !== mgjRv) mgjRevive(on);
      };
      b.addEventListener("pointerdown", go(true));
      for (const ev of ["pointerup", "pointercancel", "pointerleave"])
        b.addEventListener(ev, go(false));
      fxl.append(b);
    }
    const at = place(s.pos[id], 0, 1);
    b.style.left = at.left.toFixed(1) + "px";
    b.style.top = (at.top - geo.size * 1.25).toFixed(1) + "px";
    b.style.setProperty("--rv", k.toFixed(3));
    b.disabled = id !== near;
  }
}
/* holding a revive (E, or the Revive button) or letting go */
export function mgjRevive(on) {
  setMgjRv(on);
  if (R)
    R.send({
      t: "use",
      what: "revive",
      hold: on ? 1 : 0,
      face: 1,
      w: handIn() === "none" ? "" : handIn(),
    }); // (w: the medkit out in my hand gets it up at once)
}
/* Mad God Justin's zebra cake, or the Zebra cake special's (s.zcake): spinning on its way, then lying where it landed
   until Justin eats it (Hangout: hidden on the other side of the cabin's walls) */
export function placeCake(board, s, now) {
  const c = isMgj(s)
      ? s.phase === "boss" && s.mgj && s.mgj.cake
      : boardPhases(s).includes(s.phase) && s.zcake,
    layer = ducksLayer(board);
  let n = layer && layer.querySelector(".mgj-cake");
  if (n && (!c || c.eat || +n.dataset.n !== c.n)) {
    n.remove();
    n = null;
  }
  if (!c || c.eat || !layer || !geo) return;
  if (!n) {
    n = el(
      `<div class="mgj-cake" data-n="${c.n}"><i class="${c.vx < 0 ? "ccw" : ""}">${ZEBRA}</i></div>`,
    );
    layer.append(n);
  }
  n.classList.toggle("down", now >= c.stop);
  const p = cakeAt(c, now),
    bowl = geo.hang && c.toilet && now >= c.stop, // (Quacky Zombies: in the toilet's bowl, over the toilet)
    at = bowl ? world.place(p, c.toilet) : place(p, 0, 1),
    w = geo.size * (bowl ? 0.5 : 0.7);
  const [cl, ct] = geo.hang ? world.local(at.left, at.top) : [at.left, at.top]; // (Hangout: the ducks' layer is in the world's box, world.js)
  Object.assign(n.style, {
    left: cl.toFixed(1) + "px",
    top: (ct - w * 0.3).toFixed(1) + "px",
    width: w.toFixed(1) + "px",
    zIndex: bowl
      ? world.key("", { x: p.x, y: p.y + 0.012 }) + 1
      : geo.hang
        ? world.key("", p) - 1
        : Math.round(at.top - 1),
    visibility: geo.hang && world.hidden("", p) ? "hidden" : "",
  });
}
/* Mad God Justin's snack (a look only), or the zebra cake he picked up (the board's Justin too: the Zebra cake
   special): at his beak, the way he faces, a bite at a time (his double eats too) */
export function placeSnack(board, s, now) {
  const e =
      (isMgj(s) ? s.phase === "boss" : justinShown(s)) &&
      s.justin &&
      s.justin.eat,
    layer = ducksLayer(board);
  if (!layer) return;
  for (const id of [JUSTIN_ID, JUSTIN2]) {
    let n = layer.querySelector(`.mgj-snack[data-pid="${id}"]`);
    const dk = layer.querySelector(`.gduck[data-pid="${id}"]`);
    if (n && (!e || !dk || n.dataset.k !== `${e.k} ${e.at}`)) {
      n.remove();
      n = null;
    }
    if (!e || !dk || !geo || now >= e.until) continue;
    if (!n) {
      n = el(
        `<div class="mgj-snack" data-pid="${id}" data-k="${e.k} ${e.at}"><i>${FOODS[e.k] || FOODS.zebra}</i></div>`,
      );
      n.style.setProperty("--eat", e.until - e.at + "ms");
      layer.append(n);
    }
    const j = justinAt(s.justin, now),
      p = id === JUSTIN2 ? { x: 1 - j.x, y: 1 - j.y } : j,
      at = place(p, 0, 1),
      side = (turned() ? 1 : dk._face) || 1,
      w = geo.size * 0.42;
    Object.assign(n.style, {
      left: (at.left + side * geo.size * 0.5).toFixed(1) + "px",
      top: (at.top - geo.size * 0.78).toFixed(1) + "px",
      width: w.toFixed(1) + "px",
      zIndex: Math.round(at.top + 1),
    });
    n.classList.toggle("left", side < 0);
  }
}
/* Mad God Justin's edge lightning: the edges glow for EDGE_WARN before it strikes (the strike itself: the "edge" fx) */
export function placeEdge(board, s, now) {
  const m = isMgj(s) && s.phase === "boss" && s.mgj,
    warn =
      !!m && !mgjFrozen(s) && m.edgeAt - now <= EDGE_WARN && m.edgeAt > now;
  let n = board.querySelector(".mgj-edge.warn");
  if (n && (!warn || +n.dataset.at !== m.edgeAt)) {
    n.remove();
    n = null;
  }
  if (!warn || n) return;
  n = el(edgeHTML("warn"));
  n.dataset.at = m.edgeAt;
  n.style.animationDelay = -(EDGE_WARN - (m.edgeAt - now)) + "ms";
  n.style.setProperty("--ew", EDGE_WARN + "ms");
  board.append(n);
  sfx.warn(Math.max(0.05, (m.edgeAt - now) / 1000));
}

/* Mad God Justin's hints, one for every attack that had none (the owner's, Nov 17 11:07Z: "Every player should have an
   animated hint or something PER attack IF there isnt one"): while he winds up his hammer, the red wedge it will
   sweep; while he aims a burst, a red sight line to its duck; while he aims the shotgun, its red cone. Each fills in
   as the moment comes, with a red "!" over his head (his throws, his charge and the lightning have their own) */
export function placeTells(board, s, now) {
  const fxl = $(".fxl", board),
    j = isMgj(s) && s.phase === "boss" && !mgjFrozen(s) && s.justin,
    t = !j
      ? null
      : j.swing && s.pos[j.swing.id]
        ? { k: "hammer", id: j.swing.id, at: j.swing.at, all: HAMMER_TELL }
        : j.sg && s.pos[j.sg.id]
          ? { k: "shotgun", id: j.sg.id, at: j.sg.at, all: GUN_TELL }
          : j.burst &&
              j.burst.left === BURST[j.burst.w].n &&
              now < j.burst.at &&
              s.pos[j.burst.id]
            ? { k: "gun", id: j.burst.id, at: j.burst.at, all: GUN_TELL }
            : null;
  let n = fxl && fxl.querySelector(".mgj-tells"),
    b = fxl && fxl.querySelector(".mgj-bang");
  if (!t || !fxl || !geo) {
    if (n) n.remove();
    if (b) b.remove();
    return;
  }
  if (!n) {
    n = el(
      `<svg class="mgj-tells" aria-hidden="true"><path class="w"/><line class="l"/><circle class="c" r="14"/></svg>`,
    );
    b = el(`<div class="mgj-bang" aria-hidden="true">!</div>`);
    fxl.append(n, b);
  }
  const at = justinAt(j, now),
    c = place(at, 0, 1, true),
    q = t.id === R.me && me ? me : s.pos[t.id],
    d = place(q, 0, 1, true),
    /* a duck length along the board's x and along its y, on the screen (a phone held upright turns the board) */
    px = place({ x: at.x + DUCK_LEN.x, y: at.y }, 0, 1, true),
    py = place({ x: at.x, y: at.y + DUCK_LEN.y }, 0, 1, true),
    ex = [px.left - c.left, px.top - c.top],
    ey = [py.left - c.left, py.top - c.top],
    det = ex[0] * ey[1] - ex[1] * ey[0] || 1,
    ox = d.left - c.left,
    oy = d.top - c.top,
    a = Math.atan2(
      (ex[0] * oy - ex[1] * ox) / det,
      (ey[1] * ox - ey[0] * oy) / det,
    ), // (the way to the duck, in duck lengths)
    k = Math.max(0, Math.min(1, 1 - (t.at - now) / t.all)); // (how near it is: 0 to 1)
  n.setAttribute("class", `mgj-tells k-${t.k}`);
  n.style.setProperty("--k", k.toFixed(3));
  const wedge = (far, half) => {
    let p = `M${c.left.toFixed(1)} ${c.top.toFixed(1)}`;
    for (let i = 0; i <= 12; i++) {
      const u = a - half + (2 * half * i) / 12;
      const fx = Math.cos(u) * far,
        fy = Math.sin(u) * far;
      p += `L${(c.left + fx * ex[0] + fy * ey[0]).toFixed(1)} ${(c.top + fx * ex[1] + fy * ey[1]).toFixed(1)}`;
    }
    return p + "Z";
  };
  const w = n.querySelector(".w"),
    l = n.querySelector(".l"),
    o = n.querySelector(".c");
  if (t.k === "hammer")
    w.setAttribute(
      "d",
      wedge(
        REACH.hammer[0] * MGJ_SCALE * MGJ_HAMMER,
        Math.acos(REACH.hammer[1]),
      ),
    );
  // (where his swing hits: rules.js swing)
  else if (t.k === "shotgun") w.setAttribute("d", wedge(9, SPREAD + 0.05));
  else w.removeAttribute("d");
  l.setAttribute("x1", c.left.toFixed(1));
  l.setAttribute("y1", (c.top - geo.size * 0.5).toFixed(1));
  l.setAttribute("x2", d.left.toFixed(1));
  l.setAttribute("y2", (d.top - geo.size * 0.4).toFixed(1));
  o.setAttribute("cx", d.left.toFixed(1));
  o.setAttribute("cy", (d.top - geo.size * 0.4).toFixed(1));
  /* the "!" over his head */
  b.style.left = c.left.toFixed(1) + "px";
  b.style.top = (c.top - geo.size * MGJ_SCALE * 1.3).toFixed(1) + "px";
}
/* Story Chain: the row under my duck lights up while voting, and the Vote button wears its color */
export function storyMarks(s, board) {
  const zones = scZones(s),
    z = me ? zoneAt(s, me.y, zones) : null,
    k = zones.indexOf(z),
    vote = SC_VOTES.includes(s.phase);
  const can = vote && scCanVote(s, R.me, z); // (a row you can't vote for lights up grey)
  board.querySelectorAll(".sc-row").forEach((r) => {
    const on = vote && z !== "H" && +r.dataset.z === k;
    r.classList.toggle("here", on);
    r.classList.toggle("nope", on && !can);
  });
  if (z === scZone) return;
  setScZone(z);
  const l = scLineOf(s, z),
    who = l ? l.line.by : /^W:/.test(z || "") ? z.slice(2) : null,
    p = who && s.players[who];
  S.style.setProperty(
    "--vb",
    p
      ? (p.card && p.card.color) || "#8a8fa3"
      : {
          "C:cont": "var(--green)",
          "C:new": "var(--blue)",
          "C:lobby": "var(--orange)",
        }[z] || "var(--green)",
  );
  if (vote) setHTML($(".gact", S), actHTML(s)); // (your own line or word can't be voted for)
}
/* the ducks walk on the bracket itself (x, y across the whole bracket), so everyone sees them over the same matches; the
   bracket slides to keep my duck in view */
const bracketZoom = (box, b) => {
  const { W, H } = treeSize(b);
  return { W, H, fit: Math.min(1, box.clientWidth / W, box.clientHeight / H) };
};
export function panTree(pos) {
  const box = S.querySelector(".bb-diagram"),
    tree = box && box.firstElementChild;
  if (!tree || !geo) {
    setCam(null);
    return;
  }
  const { W, H, fit } = bracketZoom(box, R.state.bb),
    z = bbZoom || Math.max(fit, 0.55),
    bw = box.clientWidth,
    bh = box.clientHeight;
  const p = pos && pos.x >= 0 ? pos : { x: 0.5, y: 0.5 };
  const follow = (size, view, f) =>
    size <= view
      ? (view - size) / 2
      : Math.max(view - size, Math.min(0, view / 2 - f * size)); // centered on my duck, never past the edges
  const ox = follow(W * z, bw, p.x),
    oy = follow(H * z, bh, p.y);
  setCam({ dx: box.offsetLeft, dy: box.offsetTop, ox, oy, z, W, H });
  const tr = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${z.toFixed(3)})`;
  if (tree._tr !== tr) {
    tree._tr = tr;
    tree.style.transform = tr;
  }
}
export function zoom(how) {
  const box = S && S.querySelector(".bb-diagram");
  if (!box) return;
  const { fit } = bracketZoom(box, R.state.bb),
    z = bbZoom || Math.max(fit, 0.55);
  setBbZoom(
    how === "fit"
      ? fit
      : Math.max(0.2, Math.min(2.5, z * (how === "in" ? 1.25 : 0.8))),
  );
}
