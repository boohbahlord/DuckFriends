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
} from "./l4ddpower.js";

/* ---------- the pictures: stand-ins until Noah's (js/powerart.js, the same names): only this import changes ---------- */
const INK = "#1d1b26";
const ICON = {
  fuse: `<rect x="9" y="14" width="22" height="12" rx="3" fill="#d9d4c4" stroke="${INK}" stroke-width="1.6"/><rect x="4" y="16" width="5" height="8" rx="1" fill="#c9a24a" stroke="${INK}" stroke-width="1.4"/><rect x="31" y="16" width="5" height="8" rx="1" fill="#c9a24a" stroke="${INK}" stroke-width="1.4"/><path d="M12 20H28" stroke="#e8424d" stroke-width="1.6"/>`,
  lever: `<rect x="10" y="24" width="20" height="10" rx="2" fill="#6c6f7a" stroke="${INK}" stroke-width="1.6"/><path d="M20 26L28 8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M20 26L28 8" stroke="#b9bcc6" stroke-width="2" stroke-linecap="round"/><circle cx="28.5" cy="7.5" r="3.6" fill="#e8424d" stroke="${INK}" stroke-width="1.4"/>`,
  tools: `<path d="M14 13V9H26V13" fill="none" stroke="${INK}" stroke-width="2.4"/><rect x="5" y="13" width="30" height="18" rx="2" fill="#e8424d" stroke="${INK}" stroke-width="1.6"/><path d="M5 19H35" stroke="${INK}" stroke-width="1.4"/><rect x="17" y="17" width="6" height="4" fill="#d9d4c4" stroke="${INK}" stroke-width="1.2"/>`,
  gas: `<path d="M9 12L15 6H29V34H9Z" fill="#e8424d" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 6L11 2" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><rect x="13" y="16" width="12" height="12" rx="1.5" fill="#ffd23f" stroke="${INK}" stroke-width="1.3"/>`,
};
const icon = (inner) =>
  `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
export const PART_ICONS = Object.fromEntries(
  Object.entries(ICON).map(([k, v]) => [k, icon(v)]),
);
/* a jerry can, how full it is in its window, with its percent on a label */
export function jerrySVG(pct) {
  const h = Math.max(1.5, (16 * pct) / 100);
  return icon(
    `<path d="M7 9L12 4H33V36H7Z" fill="#4f7d3a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><rect x="11" y="10" width="5" height="18" rx="1" fill="#1d1b26"/><rect x="11" y="${(28 - h).toFixed(1)}" width="5" height="${h.toFixed(1)}" fill="#ffd23f"/><rect x="18" y="20" width="16" height="11" rx="2" fill="#f4f4f0" stroke="${INK}" stroke-width="1.2"/><text x="26" y="28.6" font-size="7.6" font-weight="800" font-family="system-ui, sans-serif" text-anchor="middle" fill="${INK}">${pct}%</text>`,
  );
}
/* the box: four slots (a part shows in each one fitted), a lever, a light; the fuel sign beside it with its needle (fuel
   0 to 1). Its foot is at h - 8 */
export function powerBoxSVG({ w = 96, h = 150, parts = [], on = false, fuel = 0 } = {}) {
  const slot = (k, i) => {
    const x = 10 + (i % 2) * 26,
      y = 34 + Math.floor(i / 2) * 30,
      have = parts.includes(k);
    return `<rect x="${x}" y="${y}" width="22" height="24" rx="2" fill="${have ? "#3a3d47" : "#121117"}" stroke="${INK}" stroke-width="1.4"/>${have ? `<svg x="${x + 1}" y="${y + 2}" width="20" height="20" viewBox="0 0 40 40">${ICON[k]}</svg>` : ""}`;
  };
  const a = (-60 + 120 * Math.max(0, Math.min(1, fuel))) * (Math.PI / 180),
    nx = 82 + 9 * Math.sin(a),
    ny = 60 - 9 * Math.cos(a);
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="34" cy="${h - 8}" rx="34" ry="6" fill="#0006"/>
<rect x="4" y="14" width="60" height="${h - 24}" rx="4" fill="#7b7f8a" stroke="${INK}" stroke-width="2"/>
<rect x="4" y="14" width="60" height="12" rx="4" fill="#9a9ea8" stroke="${INK}" stroke-width="1.6"/>
<circle cx="56" cy="20" r="3.4" fill="${on ? "#7dff9a" : "#3a1214"}" stroke="${INK}" stroke-width="1.2"/>
${PARTS.map(slot).join("")}
<rect x="22" y="${h - 46}" width="24" height="20" rx="2" fill="#5a5e68" stroke="${INK}" stroke-width="1.4"/>
<path d="M34 ${h - 36}L${on ? 44 : 24} ${h - (on ? 54 : 20)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
<circle cx="${on ? 44 : 24}" cy="${h - (on ? 54 : 20)}" r="3.6" fill="#e8424d" stroke="${INK}" stroke-width="1.4"/>
<rect x="70" y="44" width="24" height="28" rx="3" fill="#f4f4f0" stroke="${INK}" stroke-width="1.6"/>
<path d="M74 62A9 9 0 0 1 90 62" fill="none" stroke="${INK}" stroke-width="1.4"/>
<path d="M82 60L${nx.toFixed(1)} ${ny.toFixed(1)}" stroke="#e8424d" stroke-width="1.8" stroke-linecap="round"/>
<path d="M76 68H80M84 68H88" stroke="${INK}" stroke-width="1.2"/>
<path d="M82 72V${h - 8}" stroke="${INK}" stroke-width="2.4"/>
</svg>`;
}
/* ---------- */

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
    '<img alt="" draggable="false"><span class="l4-pw-n" hidden></span><span class="l4-pw-fuel"></span>';
  box.img = box.el.querySelector("img");
  box.n = box.el.querySelector(".l4-pw-n");
  box.fuel = box.el.querySelector(".l4-pw-fuel");
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
const ITEM_ICON = (o) =>
  o.k === "can" ? jerrySVG(canPct(o.r)) : PART_ICONS[o.k] || "";
/* a part or a jerry can in the fireplace's spin, as an orb */
export const pwOrbHTML = (w) => {
  const { k, r } = pwOf(w);
  return `<span class="l4orb k-part"><i>${k === "can" ? jerrySVG(canPct(r)) : PART_ICONS[k]}</i></span>`;
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
    el.className = "l4-pk" + (o.z ? " on-top" : "");
    el.innerHTML = `<i>${ITEM_ICON(o)}</i>`;
    box.el.before(el);
    items.set(o.n, { el, o, tr: "", k: 0 });
  }
  /* the pool: every part found and not fitted yet, and the jerry cans */
  const sig = pw ? JSON.stringify([pw.pool, pw.cans]) : "";
  if (sig !== poolSig) {
    poolSig = sig;
    const icons = pw
      ? [
          ...pw.pool.map(
            (k) =>
              `<i class="l4-part" title="${partName(k)}">${PART_ICONS[k]}</i>`,
          ),
          ...pw.cans.map(
            (r) =>
              `<i class="l4-part k-can" title="${partName("can")} ${canPct(r)}%">${jerrySVG(canPct(r))}</i>`,
          ),
        ]
      : [];
    pool.innerHTML = icons.join("");
    pool.hidden = !icons.length;
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
  return d < near ? { kind: "power", d } : null;
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
