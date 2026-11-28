/* ---------- the thin bars under my duck's name (the owner's, Nov 17 12:45Z) ----------
   Top to bottom, each taking a row only while it shows, so they pop in and out and slide into place:
     - white: the cooldown running now (l4dd.js coolBar; game.js in the other modes); it flashes red when a reload
       can't be done;
     - yellow: the ammo of what's in my hand. A gun's magazine fades in and empties a step for each shot (the double
       barrel: to half, then empty); empty, it's a black bar blinking a slow dark grey; reloading, it blinks white;
       full and not fired again, it fades away. With no ammo left to reload it stays black, shown while that gun is
       in hand. Grenades and the bow: how many I have left, shown while I have fewer than all;
     - blue: my sprint, where sprinting runs out (Dead Ducks Arcade).
   The Laser Rifle's heat meter and the slot switch box go under all of them (css/app.css --bt). */
import { NADE } from "./gamedefaults.js";

/* the yellow bar: a, the ammo of what's in my hand, or null (nothing with ammo): { f: 0 … 1 left, rl: reloading,
   dry: none left to reload, keep: shown even when full (never: a full one fades) } */
export function ammoBar(tag, a) {
  let el = tag.querySelector(".l4-ammo");
  if (!el) {
    if (!a) return;
    el = document.createElement("span");
    el.className = "l4-ammo off";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = "<i></i>";
    tag.append(el);
  }
  const show = !!a && (a.f < 0.999 || a.rl || a.dry),
    f = a ? Math.max(0, Math.min(1, a.f)) : 1,
    look = !show ? "off" : a.dry ? "dry" : a.rl ? "rl" : f <= 0 ? "empty" : "";
  if (el._look !== look) {
    el._look = look;
    el.className = "l4-ammo" + (look ? " " + look : "");
  }
  const v = f.toFixed(3);
  if (show && el._v !== v) {
    el._v = v;
    el.style.setProperty("--am", v);
  } // (hidden, it keeps the last it showed while it fades)
}

/* a reload that can't be done (no ammo left for it): the white bar flashes red */
let noAt = -1e9;
export const noReload = () => (noAt = performance.now());
const NO_MS = 700;

/* the white bar flashing red, if a reload just failed (call once a frame, after the white bar is set) */
function flashNo(tag) {
  const el = tag.querySelector(".l4-cool");
  if (!el) return;
  const no = performance.now() - noAt < NO_MS;
  if (el._no !== no) {
    el._no = no;
    el.classList.toggle("no", no);
  }
}

/* the bow drawn (bowdraw.js, f: 0 … 1 drawn, -1 not drawing): the white bar fills light red to dark red, and flashes
   white once full (the owner's, Nov 21 17:48Z: "it shows that in your cooldown meter ... a light red as the meter grows
   and becomes a dark red ... When it reaches max ... it flashes a little white"). A grenade cooking (cook: its fuse,
   bowdraw.js cooks): white, yellow from NADE.YELLOW of it, red from NADE.RED (the director plan, Nov 28). Call it after
   the white bar is set */
export function drawBar(tag, f, cook = false) {
  let el = tag.querySelector(".l4-cool");
  if (!el && f < 0) return;
  if (!el) {
    el = document.createElement("span");
    el.className = "l4-cool off";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = "<i></i>";
    tag.append(el);
  }
  const v = f < 0 ? "" : f.toFixed(3);
  if (el._dr === v && f < 0) return;
  el._dr = v;
  el.classList.toggle("draw", f >= 0);
  el.classList.toggle("full", f >= 1 && !cook);
  el.classList.toggle("cook", cook && f >= 0);
  el.classList.toggle("y", cook && f >= NADE.YELLOW && f < NADE.RED);
  el.classList.toggle("r", cook && f >= NADE.RED);
  if (f >= 0) {
    el.classList.remove("off");
    el.style.setProperty("--cl", v);
  } else el._v = null; // (the cooldown's setter puts its own back next frame)
}

/* each bar's height and the room between them (rem) */
const BARS = [
  [".l4-cool", 0.12, (el) => el._no || !el.classList.contains("off")],
  [".l4-ammo", 0.14, (el) => !el.classList.contains("off")],
  [".l4-sprint", 0.2, (el) => !el.classList.contains("full")],
];
const GAP = 0.1;
/* stacks the bars that show, white, yellow, blue, from the top (call once a frame, after they're set) */
export function stackBars(tag) {
  flashNo(tag);
  let top = GAP;
  for (const [sel, h, on] of BARS) {
    const el = tag.querySelector(sel);
    if (!el || !on(el)) continue; // (a hidden one fades where it was)
    const t = top.toFixed(2);
    if (el._top !== t) {
      el._top = t;
      el.style.top = `calc(100% + ${t}rem)`;
    }
    top += h + GAP;
  }
  const bt = top.toFixed(2);
  if (tag._bt !== bt) {
    tag._bt = bt;
    tag.style.setProperty("--bt", bt + "rem");
  } // (where the heat meter and the slot switch box go: under them)
}

/* the same white and yellow bars under my HP meter at the bottom of the screen (the owner's, Nov 17 17:41Z: the meter
   there gets the cooldown, the sprint and the ammo too; the sprint is its own blue bar, hpmeter.js): host is the
   meter's row for them; each copies its bar under my name, its look and how full it is (tag: my name tag, or null) */
const MIRROR = [
  [".l4-cool", "hpm-cool", "--cl"],
  [".l4-ammo", "hpm-ammo", "--am"],
];
export function mirrorBars(tag, host) {
  if (!host) return;
  for (const [sel, cls, v] of MIRROR) {
    const src = tag && tag.querySelector(sel);
    let el = host.querySelector("." + cls);
    if (!el) {
      el = document.createElement("span"); // (made even before its bar is under my name: they always show, empty when off)
      el.innerHTML = "<i></i>";
      host.append(el);
    }
    const look = src
      ? cls + src.className.replace(/^\S+/, "") // (its looks: off, no, empty, dry, rl)
      : cls + " off";
    if (el._look !== look) {
      el._look = look;
      el.className = look;
    }
    const n = src ? src.style.getPropertyValue(v) : "";
    if (el._v !== n) {
      el._v = n;
      if (n) el.style.setProperty(v, n);
      else el.style.removeProperty(v);
    }
  }
}
