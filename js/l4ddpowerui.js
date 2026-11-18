/* ---------- Dead Ducks Arcade's power box on every screen (the rules: l4ddpower.js) ----------
   The box on the balcony with its four slots and its fuel sign, the count under it after E ("2/4"), what lies about to
   be taken (a part, a jerry can with its percent), everyone's pool of parts at the middle left of the screen (small on
   a phone), and the sounds: the power going out, coming on, a part found, fitted, gas poured. l4dd.js calls these. */
import { heightAt, seenFrom, sortY } from "./hangout/layout.js";
import { svgDataURL } from "./hangout/art.js";
import { play } from "./sound.js";
import {
  PW,
  PARTS,
  pwState,
  powerOn,
  powerNext,
  roundsLeft,
  canPct,
  partName,
  isPw,
  pwOf,
  pumpNear,
} from "./l4ddpower.js";
import { powerBoxSVG, PART_ICONS, jerrySVG } from "./powerart.js"; // (Noah's drawings)

export { PART_ICONS };

/* the gas meter (the owner, Nov 16 23:29Z): twelve boxes like the HP bar's, one for each round of a full can's fuel, in
   the yellow of electricity and a little see-through. One function for every place that has a power box (the cabin's
   now, Downpour's too): gasMeter(rounds) gives the meter's HTML for that many rounds left (0 to 12, more is a full one) */
export const GAS_BOXES = PW.FULL;
export function gasMeter(rounds) {
  const n = Math.max(0, Math.min(GAS_BOXES, Math.round(+rounds || 0)));
  return `<span class="l4-gas" role="img" aria-label="Gas: ${n} of ${GAS_BOXES} rounds">${Array.from({ length: GAS_BOXES }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("")}</span>`;
}

let box = null, // { el, img, n (the count), fuel (the sign's words), sig, tr, k }
  pool = null, // the pool at the middle left
  items = new Map(), // what lies about: its n → { el, o, tr, k }
  shownUntil = 0, // the count under the box shows till then (after my E)
  fxSeen = -1,
  wasOn = null,
  poolSig = "";

export function pwMount(ctx, layer) {
  box = { el: document.createElement("div"), sig: "", tr: "", k: 0 };
  box.el.className = "l4-pw";
  box.el.innerHTML =
    '<img alt="" draggable="false"><span class="l4-pw-n" hidden></span><span class="l4-pw-fuel"></span><span class="l4-pw-gas"></span>';
  box.img = box.el.querySelector("img");
  box.n = box.el.querySelector(".l4-pw-n");
  box.fuel = box.el.querySelector(".l4-pw-fuel");
  box.gas = box.el.querySelector(".l4-pw-gas");
  layer.append(box.el);
  pool = document.createElement("div");
  pool.className = "l4-parts";
  pool.setAttribute("role", "status");
  pool.hidden = true;
  ctx.world.board.append(pool);
  items = new Map();
  shownUntil = 0;
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
const CANS_MOST = PW.CANS_MOST || 3; // (the most jerry cans the players hold in a game: the owner's, Nov 18 12:19Z)
const ITEM_ICON = (o) =>
  o.k === "can" ? jerrySVG(canPct(o.r)) : PART_ICONS[o.k] || "";
/* a part or a jerry can in the fireplace's spin, as an orb */
export const pwOrbHTML = (w) => {
  const { k, r } = pwOf(w);
  return `<span class="l4orb k-part${k === "can" ? " c-orange" : ""}"><i>${k === "can" ? jerrySVG(canPct(r)) : PART_ICONS[k]}</i></span>`; // (a jerry can's orb orange, glowing)
};
export { isPw };

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
     and not fitted yet; then the jerry cans, the fullest first, each with its gas in percent under it, an empty one
     when there are none ("when there is no jerry cans, the players have a 0% jerry can on the left"), and under the
     row, not over it, a very small line once the most are held */
  const sig = pw ? JSON.stringify([pw.pool, pw.cans]) : "";
  if (sig !== poolSig) {
    poolSig = sig;
    if (!pw) pool.innerHTML = "";
    else {
      const cans = pw.cans.length ? [...pw.cans].sort((a, b) => b - a) : [0],
        parts = pw.pool
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
        (parts ? `<div class="l4-row">${parts}</div>` : "") +
        `<div class="l4-row l4-cans">${row}</div>` +
        (pw.cans.length >= CANS_MOST
          ? '<small class="l4-cans-max">Max jerry cans</small>'
          : "");
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
      } else if (f.kind === "l4pwfit") {
        play("partIn", { x: PW.X, y: PW.Y });
        if (f.by === ctx.me) shownUntil = performance.now() + 4000;
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
      !Wd.seen(p.left - 60 * sc, p.top - 160 * sc, 120 * sc, 180 * sc);
  if (box.el.hidden !== hide) box.el.hidden = hide;
  if (!hide) {
    const on = powerOn(s),
      left = roundsLeft(s),
      sig = JSON.stringify([pw.fit, on, left]);
    if (sig !== box.sig) {
      box.sig = sig;
      box.img.src = svgDataURL(
        powerBoxSVG({
          parts: pw.fit,
          on,
          fuel: Math.min(1, left / PW.FULL),
        }),
      );
      box.fuel.textContent = on
        ? `${left} ${left === 1 ? "round" : "rounds"}`
        : "Fuel";
      box.gas.innerHTML = gasMeter(left); // (the meter under the box: a block for each round left)
      box.el.classList.toggle("on", on);
    }
    const tr = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
    if (box.tr !== tr) {
      box.tr = tr;
      box.el.style.transform = tr;
      box.el.style.zIndex = Math.round(sortY(PW.X, PW.Y, z0)) + 10;
    }
    if (box.k !== sc) {
      box.k = sc;
      box.el.style.setProperty("--k", sc.toFixed(3));
    }
    const show = performance.now() < shownUntil,
      n = `${pw.fit.length}/${PARTS.length}`;
    if (box.n.hidden === show) box.n.hidden = !show;
    if (box.n.textContent !== n) box.n.textContent = n;
  }
  for (const o of items.values()) {
    const q = Wd.toScreen(o.o.x, o.o.y, (o.o.z || 0) + heightAt(o.o.x, o.o.y)),
      off =
        !seenFrom(o.o.x, o.o.y, Wd.inside) ||
        !Wd.seen(q.left - 40, q.top - 80, 80, 100);
    if (o.el.hidden !== off) o.el.hidden = off;
    if (off) continue;
    const tr = `translate(${q.left.toFixed(1)}px, ${q.top.toFixed(1)}px)`;
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
/* E by the box: what it does now */
export function pwTarget(pos, s, near) {
  if (!pwState(s)) return null;
  const d = Math.hypot(PW.E[0] - pos.x, PW.E[1] - pos.y);
  if (d < near) return { kind: "power", d };
  return pumpNear(pos.x, pos.y) ? { kind: "pump", d: 0 } : null; // (Downpour's gas pumps: by their south side only)
}
/* Downpour: a gas pump's button */
export function pumpLabel(s) {
  if (!powerOn(s)) return "Gas pump · no power";
  return `Gas · ${PW.PUMP_ROUNDS} rounds · ${PW.PUMP * PW.PUMP_ROUNDS}`;
}
export function pwLabel(s) {
  const pw = pwState(s),
    next = powerNext(s);
  if (next === "fit")
    return `Fit ${pw.pool.length === 1 ? "the part" : `${pw.pool.length} parts`} · ${pw.fit.length}/${PARTS.length}`;
  if (next === "on") return "Turn the power on";
  if (next === "pour") return `Pour in the jerry can · ${canPct(pw.cans[0])}%`;
  if (pw.fit.length < PARTS.length)
    return `Power box · ${pw.fit.length}/${PARTS.length}`;
  if (pw.on) {
    const n = roundsLeft(s);
    return `Power on · ${n} ${n === 1 ? "round" : "rounds"} of fuel`;
  }
  return "Out of fuel · find a jerry can";
}
export function pwTap(ctx) {
  shownUntil = performance.now() + 4000; // (E shows the count under the box)
  ctx.send({ t: "hang", k: "l4", do: "power" });
}
