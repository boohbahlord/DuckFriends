/* ---------- Dead Ducks Arcade's power box on every screen (the rules: l4ddpower.js) ----------
   The box on the balcony with its fuel sign, what lies about to be taken (a jerry can with its percent), everyone's row
   of jerry cans at the middle left of the screen (canRow; with a very small line under it once it's full, gasFull),
   and the sounds: the power going out, coming on, a jerry can found, gas pumped, gas poured. l4dd.js calls these. */
import { heightAt, seenFrom, sortY, layoutVariant } from "./hangout/layout.js";
import { olAdd, olAway, olPic } from "./outlines.js";
import { svgDataURL } from "./svgurl.js";
import { play } from "./sound.js";
import { gameMsg } from "./gamemsg.js";
import {
  PW,
  pwState,
  powerOn,
  powerNext,
  roundsLeft,
  canPct,
  canRow,
  gasFull,
  partName,
  pumpNear,
} from "./l4ddpower.js";
import { powerBoxSVG, PART_ICONS, jerrySVG } from "./powerart.js"; // (Noah's drawings)

export { PART_ICONS };

/* the gas meter (the owner, Nov 16 23:29Z): twelve boxes like the HP bar's, one for each round of a full can's fuel, in
   the yellow of electricity and a little see-through. One function for every place that has a power box (the cabin's
   now, Downpour's too): gasMeter(rounds) gives the meter's HTML for that many rounds left (0 to 12, more is a full one) */
const GAS_BOXES = 12;
function gasMeter(rounds) {
  const n = Math.max(0, Math.min(GAS_BOXES, Math.round(+rounds || 0)));
  return `<span class="l4-gas" role="img" aria-label="Gas: ${n} of ${GAS_BOXES} rounds">${Array.from({ length: GAS_BOXES }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("")}</span>`;
}

let box = null, // { el, img, fuel (the sign's words), sig, tr, k }
  pool = null, // the row of jerry cans at the middle left
  items = new Map(), // what lies about: its n → { el, o, tr, k }
  fxSeen = -1,
  wasOn = null,
  poolSig = "";

export function pwMount(ctx, layer) {
  box = { el: document.createElement("div"), sig: "", tr: "", k: 0 };
  box.el.className = "l4-pw";
  box.el.innerHTML =
    '<img alt="" draggable="false"><span class="l4-pw-fuel"></span><span class="l4-pw-gas"></span>';
  box.img = box.el.querySelector("img");
  box.fuel = box.el.querySelector(".l4-pw-fuel");
  box.gas = box.el.querySelector(".l4-pw-gas");
  layer.append(box.el);
  pool = document.createElement("div");
  pool.className = "l4-parts";
  pool.setAttribute("role", "status");
  pool.hidden = true;
  ctx.world.board.append(pool);
  items = new Map();
  fxSeen = -1;
  wasOn = null;
  poolSig = "";
}
export function pwUnmount() {
  box?.el.remove();
  pool?.remove();
  for (const o of items.values()) o.el.remove();
  items.clear();
  box = pool = null;
}
const ITEM_ICON = (o) =>
  o.k === "can" ? jerrySVG(canPct(o.r)) : PART_ICONS[o.k] || "";

/* a new state: what lies about, the pool, the sounds */
export function pwSee(s, ctx) {
  if (!box) return;
  const pw = pwState(s);
  const list = (s.hang && s.hang.pk) || [],
    have = new Set(list.map((o) => o.n));
  for (const [n, o] of items)
    if (!have.has(n)) {
      o.el.remove();
      items.delete(n);
    }
  for (const o of list) {
    if (items.has(o.n)) continue;
    const el = document.createElement("div");
    el.className =
      "l4-pk" + (o.z ? " on-top" : "") + (o.k === "can" ? " k-can" : "");
    el.innerHTML =
      o.k === "can"
        ? `<i><span class="l4orb c-orange">${ITEM_ICON(o)}</span></i>`
        : `<i>${ITEM_ICON(o)}</i>`; // (a jerry can on the ground: in its orange orb that glows, the owner's, Nov 18 12:19Z)
    box.el.before(el);
    items.set(o.n, { el, o, tr: "", k: 0 });
  }
  /* the pool at the left, in two rows (the owner's, Nov 18 12:19Z: "the jerry cans have their own row apart from the
     items you pick up in cabin (fuse and etc) / the two rows are both on the left side of screen"): every part found
     and not fitted yet (none now: the box is built); then the jerry cans, the fullest first, each with its gas in
     percent under it, an empty one when there are none ("when there is no jerry cans, the players have a 0% jerry can
     on the left"), and under the row, not over it, a very small line once the most are held. The rules give the row
     (canRow: each can's gas in quarter cans) and whether it's full (gasFull) */
  const parts = (pw && pw.pool) || [],
    cans = pw ? canRow(s) : [],
    full = gasFull(s),
    sig = JSON.stringify([parts, cans, full]);
  if (sig !== poolSig) {
    poolSig = sig;
    if (!pw) pool.innerHTML = "";
    else {
      const top = parts
          .map(
            (k) =>
              `<i class="l4-part" title="${partName(k)}">${PART_ICONS[k]}</i>`,
          )
          .join(""),
        row = cans
          .map(
            (r) =>
              `<i class="l4-part k-can" title="${partName("can")} ${canPct(r)}%">${jerrySVG(canPct(r))}<small>${canPct(r)}%</small></i>`,
          )
          .join("");
      pool.innerHTML =
        (top ? `<div class="l4-row">${top}</div>` : "") +
        `<div class="l4-row l4-cans">${row}</div>` +
        (full ? '<small class="l4-cans-max">Max jerry cans</small>' : "");
    }
    pool.hidden = !pw;
  }
  /* the sounds: the power (everywhere alike), a part found (where it was taken), fitted and poured (at the box) */
  const on = powerOn(s);
  if (wasOn !== null && on !== wasOn) play(on ? "powerUp" : "powerDown");
  wasOn = on;
  if (fxSeen < 0) fxSeen = s.fxN || 0;
  if ((s.fxN || 0) > fxSeen) {
    for (const f of s.fx || []) {
      if (f.n <= fxSeen) continue;
      if (f.kind === "l4pwgot") {
        const a = ctx.world.at(f.by);
        play("partGot", a ? { x: a.x, y: a.y } : {});
        if (f.k === "can" && f.by === ctx.me) gameMsg(GAS_TIP);
      } else if (f.kind === "l4pwfill") {
        const a = ctx.world.at(f.by);
        play("gasPour", a ? { x: a.x, y: a.y } : {}); // (a pump filling the row)
        if (f.by === ctx.me) gameMsg(GAS_TIP);
      } else if (f.kind === "l4pwgas") play("gasPour", { x: PW.X, y: PW.Y });
    }
    fxSeen = s.fxN || 0;
  }
}
/* every frame: the box and what lies about, where the camera has them */
export function pwDraw(ctx) {
  if (!box) return;
  const Wd = ctx.world,
    sc = Wd.sc,
    s = ctx.state(),
    pw = pwState(s);
  const z0 = heightAt(PW.X, PW.Y),
    p = Wd.toScreen(PW.X, PW.Y, z0),
    hide =
      !pw ||
      !seenFrom(PW.X, PW.Y, Wd.inside) ||
      !Wd.onView(p.left - 60 * sc, p.top - 160 * sc, 120 * sc, 180 * sc);
  if (box.el.hidden !== hide) box.el.hidden = hide;
  if (!hide) {
    const on = powerOn(s),
      left = roundsLeft(s),
      sig = JSON.stringify([pw.fit, on, left]);
    if (sig !== box.sig) {
      box.sig = sig;
      box.img.src = svgDataURL(
        powerBoxSVG({
          on,
          fuel: Math.min(1, left / GAS_BOXES),
        }),
      );
      box.fuel.textContent = on
        ? `${left} ${left === 1 ? "round" : "rounds"}`
        : "Fuel";
      box.gas.innerHTML = gasMeter(left); // (the meter under the box: a block for each round left)
      box.el.classList.toggle("on", on);
    }
    const tr = Wd.boxTr(p.left, p.top); // (in the world's box: world.js)
    if (box.tr !== tr) {
      box.tr = tr;
      box.el.style.transform = tr;
      box.el.style.zIndex = Math.round(sortY(PW.X, PW.Y, z0)) + 10;
    }
    if (box.k !== sc) {
      box.k = sc;
      box.el.style.setProperty("--k", sc.toFixed(3));
    }
  }
  const me = Wd.at(ctx.me),
    myFloor = me ? olAway(me.x, me.y, me.z).f : 0;
  for (const o of items.values()) {
    const z = (o.o.z || 0) + heightAt(o.o.x, o.o.y),
      q = Wd.toScreen(o.o.x, o.o.y, z),
      unseen = !seenFrom(o.o.x, o.o.y, Wd.inside),
      onCam = Wd.onView(q.left - 40, q.top - 80, 80, 100),
      off = unseen || !onCam;
    if (o.el.hidden !== off) o.el.hidden = off;
    if (onCam && o.o.k === "can") canOutline(Wd, o, q, z, sc, unseen, myFloor);
    if (off) continue;
    const tr = Wd.boxTr(q.left, q.top); // (in the world's box, as the power box above: world.js)
    if (o.tr !== tr) {
      o.tr = tr;
      o.el.style.transform = tr;
      o.el.style.zIndex = o.o.z
        ? Math.round(o.o.key || o.o.py) + 12
        : Math.round(sortY(o.o.x, o.o.y, 0)) + 10;
    }
    if (o.k !== sc) {
      o.k = sc;
      o.el.style.setProperty("--k", sc.toFixed(3));
    }
  }
}
/* a jerry can on the ground: an orange outline round its orb, and the arrow when it's a floor away, like the drops
   (outlines.js DROP_OL, the owner's, Nov 18 13:58Z: "gas gets an orange outline"); gone once it's picked up (pwSee) */
const ORB = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#000"/></svg>`;
function canOutline(Wd, o, q, z, sc, unseen, myFloor) {
  const w = 40 * sc,
    x = q.left - 20 * sc,
    y = q.top - (o.o.z ? 40 : 46) * sc, // (css .l4-pk, .l4-pk.on-top)
    img = olPic("can-orb", ORB, w, w);
  if (!img) return;
  olAdd({
    id: "pk" + o.o.n,
    img,
    x,
    y,
    w,
    h: w,
    kind: "drop_can",
    hidden:
      unseen ||
      Wd.coverAt(
        x,
        x + w,
        y,
        y + w,
        o.o.z
          ? Math.round(o.o.key || o.o.py) + 12
          : Math.round(sortY(o.o.x, o.o.y, 0)) + 10,
      ),
    ...olAway(o.o.x, o.o.y, z, myFloor),
  });
}
/* E by the box: what it does now */
export function pwTarget(pos, s, near) {
  if (!pwState(s)) return null;
  const d = Math.hypot(PW.E[0] - pos.x, PW.E[1] - pos.y);
  if (d < near) return { kind: "power", d };
  return pumpNear(pos.x, pos.y) ? { kind: "pump", d: 0 } : null; // (Downpour's gas pumps: by their south side only)
}
/* Downpour: a gas pump's button */
export function pumpLabel(s) {
  if (gasFull(s)) return "Gas · jerry cans full";
  return `Gas · 25% · ${PW.PUMP}`;
}
export function pwLabel(s) {
  const next = powerNext(s);
  if (next === "pour")
    return `Pour in the jerry can · ${canPct(canRow(s)[0])}%`;
  if (powerOn(s)) {
    const n = roundsLeft(s);
    return `Power on · ${n} ${n === 1 ? "round" : "rounds"} of fuel`;
  }
  if ((pwState(s) || {}).left > 0) return "Switched off · hold to turn on";
  return layoutVariant() === "l4gs"
    ? "Out of fuel · fill a jerry can"
    : "No power · find a jerry can";
}
/* E at the box: a tap pours in a can, held (sw) it switches the power on or off (l4ddpower.js powerAct); a phone's
   button, a tap only, switches it when there's no can to pour */
export function pwTap(ctx, sw = powerNext(ctx.state()) === "switch") {
  ctx.send({ t: "hang", k: "l4", do: "power", sw });
}
/* the tip, each time I come up to the box (gamemsg.js) */
/* gas I picked up or bought says where it goes, in the chat at the bottom left (the owner's, Nov 28 03:28Z,
   cmsg_01LTpp6fzv8sfYUR5KoHADKtLgUjArf16XwsJeAqka2pZ7: "picking up gas says to add it to the generator in the same chat") */
const GAS_TIP = "Gas! Take it to the generator and tap E to pour it in.";
export const PW_TIP =
  "Tap E to pour in a jerry can. Hold E to turn the generator on or off.";
