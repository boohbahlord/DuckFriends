/* ---------- HP meters and the little "+1 HP" over a duck (owner 2026-11-03 23:17Z) ----------
   The owner's picture (notes/ref/hp-bar-reference.png): a round bronze badge with a pink-red heart, joined to a
   bronze-framed bar of separate red blocks, one for each HP, black where they're gone (black since 2026-11-04). Mine sits under the hotbar (on a
   phone, under the specials' slider), with a thin blue sprint bar under it where sprinting runs out (Quacky Zombies). At
   20% HP or less it slowly breathes a red glow. Justin's HP in Mad God Justin is the same bar, and in Quacky Zombies and
   Mad God Justin the other players' meters are small ones in the board's bottom right corner (a computer only; off in
   Settings). A duck, Justin or a zombie that gains or loses HP shows it for a moment over its head, in small letters. */
import { esc } from "./ui.js";
import { mirrorBars } from "./meters.js";
import { hurtSway } from "./fxmotion.js";
import { bakeFill } from "./pxbake.js";
import { hpText, tenths } from "./hpmath.js";

/* a meter shows one block for each HP; with more HP than this, each block holds a few, so the blocks stay blocks */
const MOST_BLOCKS = 40;

let uid = 0;
/* the badge: a bronze coin with a dark edge, a darker middle, and the heart in it (its own ids each time, so one
   removed never takes another's colors away; a picture drawn again and again passes its own fixed one) */
export function badgeSVG(key) {
  const a = "hpb" + (key || ++uid),
    b = a + "h";
  return `<svg class="hpm-badge" viewBox="0 0 32 32" aria-hidden="true"><defs>
<linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc06a"/><stop offset=".5" stop-color="#dc842f"/><stop offset="1" stop-color="#a3561b"/></linearGradient>
<linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b93"/><stop offset="1" stop-color="#df1f58"/></linearGradient></defs>
<circle cx="16" cy="16" r="15.3" fill="#2b1a10"/><circle cx="16" cy="16" r="13.7" fill="url(#${a})"/>
<path d="M6.2 12.4A10.6 10.6 0 0 1 25.8 12.4" fill="none" stroke="#ffe0a8" stroke-width="1.3" stroke-linecap="round" opacity=".75"/>
<circle cx="16" cy="16" r="9.9" fill="#7c3f1c" stroke="#4e260f" stroke-width="1.3"/><circle cx="16" cy="16.6" r="8.4" fill="#9a5326"/>
<path d="M16 22.8C10.6 19 8.7 16 9.4 13.4C10.2 10.7 13.5 10.1 16 12.9C18.5 10.1 21.8 10.7 22.6 13.4C23.3 16 21.4 19 16 22.8Z" fill="url(#${b})" stroke="#5e1029" stroke-width="1.1" stroke-linejoin="round"/>
<ellipse cx="12.7" cy="13.7" rx="1.5" ry="1.05" fill="#fff" opacity=".85" transform="rotate(-30 12.7 13.7)"/></svg>`;
}

/* the blocks: n of them, each k HP (k = 1 up to MOST_BLOCKS HP) */
const blocking = (max) => {
  const k = Math.max(1, Math.ceil(max / MOST_BLOCKS));
  return [Math.ceil(max / k), k];
};
/* how full block i is, 0 … 1 */
const fillOf = (i, k, hp, max) =>
  Math.max(0, Math.min(1, (hp - i * k) / Math.min(k, max - i * k)));

/* the whole meter as html, for a picture made once (Justin's bar, a mini meter): hp of max */
export function meterHTML(hp, max, cls = "", key = "") {
  const [n, k] = blocking(max);
  let bl = "";
  for (let i = 0; i < n; i++) {
    const f = fillOf(i, k, hp, max);
    bl +=
      f >= 1
        ? '<i class="on"></i>'
        : f > 0
          ? `<i style="--f:${f.toFixed(2)}"></i>`
          : "<i></i>";
  }
  return `<span class="hpm${cls ? " " + cls : ""}${low(hp, max) ? " low" : ""}" style="--nb:${n}" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${hpText(hp)}"><span class="hpm-row">${badgeSVG(key)}<span class="hpm-bar"><span class="hpm-blocks">${bl}</span></span></span></span>`;
}
const low = (hp, max) => hp > 0 && hp <= max * 0.2;

/* my meter's moves (the owner's, Nov 17 17:41Z):
     - a hit: the blocks I lost blink, getting whiter, fully white in half a second, then drain away. Another hit while
       that runs: a third longer, blinking faster, and the new ones lost join in;
     - regen (Dead Ducks Arcade): the next block slowly fills with a very faint red; once that HP is back, it turns white
       and blinks into full red in a second. A hit starts the regen over (the rules do: game.js gives me how far it is);
     - and under the blocks, the same thin bars as under my name: the cooldown (white), the ammo (yellow), the sprint
       (blue): meters.js mirrorBars */
const WHITE_MS = 500, // a hit's blocks: fully white in this long
  DRAIN_MS = 220, // then drained in this long
  BACK_MS = 1000, // an HP back: from white to full red in this long
  BLINK_MS = 120; // one blink (on and off) while a hit's blocks whiten; faster with each hit more

/* the hurt corners (.hurt-edge: four circles of --hc fading out by --hr, css/app.css), drawn as pixels by pxbake.js */
export function hurtPaint(x, w, h, el) {
  x.fillStyle = getComputedStyle(el).getPropertyValue("--hc");
  const c = x.fillStyle, // (read back as rgba(r, g, b, a) or #rrggbb)
    clear = c.startsWith("#") ? c + "00" : c.replace(/,\s*[\d.]+\)$/, ", 0)"), // (the same color, see-through: a fade to it stays red)
    r = Math.min(
      0.27 * Math.max(innerWidth, innerHeight),
      0.4 * Math.hypot(w, h),
    ); // (--hr: min(27vmax, 40%))
  for (const [cx, cy] of [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ]) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, c);
    g.addColorStop(1, clear);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }
}
/* my meter: mounted once, then set every frame (it only changes what changed). set(hp, max, sprint, tired, regen):
   sprint is 0 … 1, or null where sprinting never runs out (no blue bar then); regen is how far the next HP is to coming
   back, 0 … 1, or null (no regen) */
export function mountMeter() {
  const el = document.createElement("div");
  el.className = "hpm hpm-me gone";
  el.setAttribute("role", "meter");
  el.setAttribute("aria-label", "Your HP");
  el.setAttribute("aria-valuemin", "0");
  el.innerHTML = `<span class="hpm-row">${badgeSVG()}<span class="hpm-bar"><span class="hpm-blocks"></span></span></span><span class="hpm-bars"></span><span class="hpm-stam" hidden><i></i></span>`;
  const blocks = el.querySelector(".hpm-blocks"),
    bars = el.querySelector(".hpm-bars"),
    stam = el.querySelector(".hpm-stam");
  /* the corners of my playable screen (the board: game.js puts it there) blink a see-through blood red each time I lose
     HP (owner, Nov 17: zombie hits and every other hit; stronger, and the screen sways a little, 17:41Z): one layer over
     the board, never over the bars round it, still while nothing hurts me */
  const edge = document.createElement("div");
  edge.className = "hurt-edge";
  edge.setAttribute("aria-hidden", "true");
  document.body.append(edge);
  let bakedAt = -1e9;
  const blink = () => {
    const now = performance.now();
    if (now - bakedAt > 1000) {
      bakedAt = now;
      bakeFill(edge, hurtPaint);
    } // (its corners as pixels, made once: no filter on the whole board. Looked at once a second at most: it measures the board, and a crowd of zombies hit me many times a second)
    /* a second hit starts it over: two copies of it, on and on-b (css/app.css), swapped, so the page doesn't measure
       itself for every hit */
    const b = edge.classList.contains("on");
    edge.classList.toggle("on", !b);
    edge.classList.toggle("on-b", b);
    hurtSway(now); // (and my screen sways a little: fxmotion.js)
  };
  edge.addEventListener("animationend", () =>
    edge.classList.remove("on", "on-b"),
  );
  let max = -1,
    hp = -1,
    k = 1,
    sp = "",
    shown = false,
    hurt = null, // a hit's blocks: { t0, from, to, white (ms till fully white), n (hits) }
    back = null, // an HP back: { t0, from, to }
    moving = false; // (something drawn over the blocks last frame: cleared once it stops)
  /* each block's overlay: [left, width, how white] of it, and its faint red regen [from, to] of it */
  const paint = (now, regen) => {
    const hurtEnd = hurt ? hurt.t0 + hurt.white + DRAIN_MS : 0,
      backEnd = back ? back.t0 + BACK_MS : 0;
    if (hurt && now >= hurtEnd) hurt = null;
    if (back && now >= backEnd) back = null;
    const ghost = regen != null && regen > 0 && hp < max ? regen : 0;
    if (!hurt && !back && !ghost && !moving) return;
    moving = !!(hurt || back || ghost);
    [...blocks.children].forEach((b, i) => {
      let ol = 0,
        ow = 0,
        oa = 0,
        g0 = 0,
        g1 = 0;
      if (hurt) {
        const a = fillOf(i, k, hurt.to, max),
          z = fillOf(i, k, hurt.from, max);
        if (z > a) {
          const t = now - hurt.t0;
          ol = a;
          if (t < hurt.white) {
            const u = t / hurt.white,
              on = Math.floor(t / (BLINK_MS / (1 + hurt.n))) % 2 === 0;
            ow = z - a;
            oa = on ? 0.45 + 0.55 * u : 0.1 + 0.6 * u; // (blinking, whiter and whiter)
          } else {
            ow = (z - a) * Math.max(0, 1 - (t - hurt.white) / DRAIN_MS); // (white: draining away)
            oa = 1;
          }
        }
      }
      if (!ow && back) {
        const a = fillOf(i, k, back.from, max),
          z = fillOf(i, k, back.to, max);
        if (z > a) {
          const t = now - back.t0,
            u = t / BACK_MS,
            on = Math.floor(t / BLINK_MS) % 2 === 0;
          ol = a;
          ow = z - a;
          oa = (1 - u) * (on ? 1 : 0.55); // (white, blinking into red)
        }
      }
      if (ghost && !ow) {
        g0 = fillOf(i, k, hp, max);
        g1 = fillOf(i, k, hp + ghost, max);
        if (g1 <= g0) g0 = g1 = 0;
      }
      const v = ow
        ? `${ol.toFixed(3)} ${ow.toFixed(3)} ${oa.toFixed(2)}`
        : g1
          ? `g${g0.toFixed(3)} ${g1.toFixed(3)}`
          : "";
      if (b._ov === v) return;
      b._ov = v;
      if (ow) {
        b.style.setProperty("--ol", ol.toFixed(3));
        b.style.setProperty("--ow", ow.toFixed(3));
        b.style.setProperty("--oa", oa.toFixed(2));
      } else
        for (const n of ["--ol", "--ow", "--oa"]) b.style.removeProperty(n);
      if (g1) {
        b.style.setProperty("--g0", g0.toFixed(3));
        b.style.setProperty("--g1", g1.toFixed(3));
      } else for (const n of ["--g0", "--g1"]) b.style.removeProperty(n);
    });
  };
  return {
    el,
    edge,
    remove: () => edge.remove(),
    set(h, m, sprint = null, tired = false, regen = null) {
      const now = performance.now();
      if (!shown) {
        shown = true;
        el.classList.remove("gone");
      }
      if (m !== max) {
        max = m;
        hp = -1;
        hurt = back = null;
        const [n, kk] = blocking(m);
        k = kk;
        el.style.setProperty("--nb", n);
        blocks.innerHTML = "<i></i>".repeat(n);
        el.setAttribute("aria-valuemax", m);
      }
      if (h !== hp) {
        if (hp >= 0 && h < hp) {
          blink(); // (not when the meter first shows, nor when the most HP changes)
          if (hurt && now < hurt.t0 + hurt.white + DRAIN_MS) {
            hurt.to = Math.min(hurt.to, h);
            hurt.white += WHITE_MS / 3; // (another hit while it runs: a third longer, blinking faster)
            hurt.n++;
          } else hurt = { t0: now, from: hp, to: h, white: WHITE_MS, n: 0 };
          back = null;
        } else if (hp >= 0 && h > hp) {
          back = { t0: now, from: hp, to: h };
          if (hurt && h >= hurt.from) hurt = null;
          else if (hurt) hurt.to = Math.max(hurt.to, h);
        }
        hp = h;
        [...blocks.children].forEach((b, i) => {
          const f = fillOf(i, k, h, max);
          b.classList.toggle("on", f >= 1);
          if (f > 0 && f < 1) b.style.setProperty("--f", f.toFixed(2));
          else b.style.removeProperty("--f");
        });
        el.setAttribute("aria-valuenow", hpText(h));
        el.classList.toggle("low", low(h, max));
      }
      paint(now, regen);
      const v = sprint == null ? "" : sprint.toFixed(3) + (tired ? "t" : "");
      if (v !== sp) {
        sp = v;
        stam.hidden = sprint == null;
        if (sprint != null) {
          stam.style.setProperty("--sp", sprint.toFixed(3));
          stam.classList.toggle("tired", !!tired);
        }
      }
    },
    /* the cooldown and the ammo bars under my name, the same under the blocks (tag: my name tag, or null) */
    bars(tag) {
      mirrorBars(tag, bars);
    },
    hide() {
      if (!shown) return;
      shown = false;
      el.classList.add("gone");
    },
  };
}

/* the other players' small meters in the board's bottom right corner (Quacky Zombies and Mad God Justin, a computer
   only): list = [[id, name, hp, max]]. My duck walking into them makes them see-through on my screen */
export function othersHpHTML(list) {
  return list
    .map(
      ([id, name, hp, max], i) =>
        `<div class="hpo-one" data-pid="${esc(id)}"><span class="hpo-name">${esc(name)}</span>${meterHTML(hp, max, "mini", "o" + i)}</div>`,
    )
    .join("");
}

/* "+1 HP" or "-2 HP" over something, small, rising and fading: host is the element it rises from (a duck's lift, a
   zombie); a few at once stack up a little */
/* the numbers are kept when done and handed out again (a pool: owner 2026-11-15), instead of a new element for every
   hit; put back in the page, the rise starts over by itself */
const POPS_KEPT = [];
export function popHP(host, n0, small = false) {
  const n = tenths(n0); // (in tenths: "−1.5 HP", the owner's, Nov 19 10:30Z)
  if (!host || !n) return;
  let p = POPS_KEPT.pop();
  if (!p) {
    p = document.createElement("span");
    p.setAttribute("aria-hidden", "true");
  }
  p.className = `hp-pop ${n > 0 ? "up" : "down"}${small ? " small" : ""}`;
  p.textContent = `${n > 0 ? "+" : "−"}${hpText(Math.abs(n))} HP`;
  const live = host.querySelectorAll(".hp-pop").length;
  p.style.setProperty("--dx", (Math.random() * 16 - 8).toFixed(0) + "px");
  p.style.setProperty("--up", live);
  host.append(p);
  setTimeout(() => {
    p.remove();
    if (POPS_KEPT.length < 40) POPS_KEPT.push(p);
  }, 1100);
}
