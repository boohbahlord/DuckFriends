/* ---------- HP meters and the little "+1 HP" over a duck (owner 2026-11-03 23:17Z) ----------
   The owner's picture (notes/ref/hp-bar-reference.png): a round bronze badge with a pink-red heart, joined to a
   bronze-framed bar of separate red blocks, one for each HP, black where they're gone (black since 2026-11-04). Mine sits under the hotbar (on a
   phone, under the specials' slider), with a thin blue sprint bar under it where sprinting runs out (Quacky Zombies). At
   20% HP or less it slowly breathes a red glow. Justin's HP in Mad God Justin is the same bar, and in Quacky Zombies and
   Mad God Justin the other players' meters are small ones in the board's bottom right corner (a computer only; off in
   Settings). A duck, Justin or a zombie that gains or loses HP shows it for a moment over its head, in small letters. */
import { esc } from "./ui.js";

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
  return `<span class="hpm${cls ? " " + cls : ""}${low(hp, max) ? " low" : ""}" style="--nb:${n}" role="meter" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${hp}"><span class="hpm-row">${badgeSVG(key)}<span class="hpm-bar"><span class="hpm-blocks">${bl}</span></span></span></span>`;
}
const low = (hp, max) => hp > 0 && hp <= max * 0.2;

/* my meter: mounted once, then set every frame (it only changes what changed). set(hp, max, sprint, tired): sprint is
   0 … 1, or null where sprinting never runs out (no blue bar then) */
export function mountMeter() {
  const el = document.createElement("div");
  el.className = "hpm hpm-me gone";
  el.setAttribute("role", "meter");
  el.setAttribute("aria-label", "Your HP");
  el.setAttribute("aria-valuemin", "0");
  el.innerHTML = `<span class="hpm-row">${badgeSVG()}<span class="hpm-bar"><span class="hpm-blocks"></span></span></span><span class="hpm-stam" hidden><i></i></span>`;
  const blocks = el.querySelector(".hpm-blocks"),
    stam = el.querySelector(".hpm-stam");
  let max = -1,
    hp = -1,
    k = 1,
    sp = "",
    shown = false;
  return {
    el,
    set(h, m, sprint = null, tired = false) {
      if (!shown) {
        shown = true;
        el.classList.remove("gone");
      }
      if (m !== max) {
        max = m;
        hp = -1;
        const [n, kk] = blocking(m);
        k = kk;
        el.style.setProperty("--nb", n);
        blocks.innerHTML = "<i></i>".repeat(n);
        el.setAttribute("aria-valuemax", m);
      }
      if (h !== hp) {
        hp = h;
        [...blocks.children].forEach((b, i) => {
          const f = fillOf(i, k, h, max);
          b.classList.toggle("on", f >= 1);
          if (f > 0 && f < 1) b.style.setProperty("--f", f.toFixed(2));
          else b.style.removeProperty("--f");
        });
        el.setAttribute("aria-valuenow", h);
        el.classList.toggle("low", low(h, max));
      }
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
export function popHP(host, n, small = false) {
  if (!host || !n) return;
  const p = document.createElement("span");
  p.className = `hp-pop ${n > 0 ? "up" : "down"}${small ? " small" : ""}`;
  p.setAttribute("aria-hidden", "true");
  p.textContent = `${n > 0 ? "+" : "−"}${Math.abs(n)} HP`;
  const live = host.querySelectorAll(".hp-pop").length;
  p.style.setProperty("--dx", (Math.random() * 16 - 8).toFixed(0) + "px");
  p.style.setProperty("--up", live);
  host.append(p);
  setTimeout(() => p.remove(), 1100);
}
