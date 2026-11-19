/* ---------- Sandbox: presets, copy and paste, the right-click menu and cheat mode (wave 3) ----------
   The owner's, Nov 19 17:15Z: Shift-placing repeats, "right-click / long-press a Build item to preset it before placing
   (Shift-placing copies the preset)", right-click a placed thing for Properties, Copy and Cut, right-click an empty spot
   for Paste, Shift+V pastes, and cheat mode on Shift+C (the Sandbox rights only count while it's on, shown bottom left,
   only for players who have rights; C alone still opens the cheat sheet for everyone).
   A pattern is what a placed thing keeps of itself: { k, col, f: { box: text }, im, ap }. The host builds a new point from
   one (sbspawn.js fromPattern), reading each box as if it were typed. Kept on this device only. */
import { esc, openWindow, toast } from "./ui.js";
import { W, H } from "./hangout/layout.js";
import { SB_COLORS, SB_NOCOL, sbOnBoard, sbZoneBox } from "./sandboxrules.js";
import { kindsFor } from "./sbmake.js";

export const sbClip = { pt: null }; // (what Copy or Cut kept)
export const sbPresets = {}; // (kind: the pattern Build puts down for it)
/* cheat mode: on at the start (nothing changes until it's turned off, Shift+C), off: the Sandbox windows (B, M, N, G, P),
   Build's menus and Properties wait for it */
export const sbCheat = { on: true };

/* the color buttons: the eight, and No color after them where it may be (attr: data-col …; on: the one picked) */
export function colSwatches(on, attr, nocol) {
  return (
    Object.entries(SB_COLORS)
      .map(
        ([k, c]) =>
          `<button type="button" class="sb-col${on === k ? " on" : ""}" ${attr}="${k}" style="--c:${c}" aria-label="${k}" title="${k[0].toUpperCase() + k.slice(1)}"></button>`,
      )
      .join("") +
    (nocol
      ? `<button type="button" class="sb-col sb-col-none${on === SB_NOCOL ? " on" : ""}" ${attr}="${SB_NOCOL}" aria-label="No color" title="No color"></button>`
      : "")
  );
}
/* "maybe there's a note by that when you select it that pops up temporarily" */
export const NOCOL_NOTE =
  "No color: its ring slowly turns through the rainbow, and it keeps settings of its own (no other spawn shares them).";
/* the pattern of point p */
export function patternOf(p) {
  const f = {};
  for (const [k, v] of Object.entries(p.f || {}))
    if (v && typeof v.t === "string") f[k] = v.t;
  return {
    k: p.k,
    col: p.col,
    f,
    ...(p.im ? { im: [...p.im] } : {}),
    ...(p.ap ? { ap: JSON.parse(JSON.stringify(p.ap)) } : {}),
  };
}

/* the point under (x, y) (shares of the map), or null: a ring within reach, a zone inside its box; the nearest wins */
export function pointAt(s, at) {
  const board = sbOnBoard(s);
  let best = null,
    bd = Infinity;
  for (const [id, p] of Object.entries((s.sb && s.sb.pts) || {})) {
    if (p.grp) continue; // (a spawn's + page: its spawn's)
    if (p.k === "zone") {
      const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H);
      if (at.x >= x0 && at.x <= x1 && at.y >= y0 && at.y <= y1) {
        const d = 5; // (a ring on top of it wins)
        if (d < bd) {
          bd = d;
          best = id;
        }
      }
      continue;
    }
    const d = board
      ? Math.hypot((p.x - at.x) / 0.03, (p.y - at.y) / 0.08)
      : Math.hypot(((p.x - at.x) * W) / 48, ((p.y - at.y) * H) / 48);
    if (d < Math.min(1.2, bd)) {
      bd = d;
      best = id;
    }
  }
  return best;
}

/* a small menu at the screen point (cx, cy): items [{ label, act, off }]; it goes at the next click, Esc or wheel */
let menuEl = null,
  menuOff = null; // (takes away its listeners: a shut menu hears nothing more)
export function closeMenu() {
  if (menuEl) menuEl.remove();
  menuEl = null;
  if (menuOff) menuOff();
  menuOff = null;
}
export function showMenu(parent, cx, cy, items) {
  closeMenu();
  const m = document.createElement("div");
  m.className = "sb-ctx";
  m.setAttribute("role", "menu");
  m.innerHTML = items
    .map(
      (it, i) =>
        `<button type="button" role="menuitem" data-i="${i}"${it.off ? " disabled" : ""}>${esc(it.label)}</button>`,
    )
    .join("");
  parent.append(m);
  const r = m.getBoundingClientRect(),
    want = [
      Math.max(4, Math.min(innerWidth - r.width - 4, cx)),
      Math.max(4, Math.min(innerHeight - r.height - 4, cy)),
    ];
  m.style.left = want[0] + "px";
  m.style.top = want[1] + "px";
  const got = m.getBoundingClientRect(); // (inside a transformed screen, "fixed" counts from it: moved by what's off)
  if (Math.abs(got.left - want[0]) > 1 || Math.abs(got.top - want[1]) > 1) {
    m.style.left = want[0] - (got.left - want[0]) + "px";
    m.style.top = want[1] - (got.top - want[1]) + "px";
  }
  m.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (!b || b.disabled) return;
    e.stopPropagation();
    closeMenu();
    items[+b.dataset.i].act();
  });
  const away = (e) => {
    if (e.type === "keydown" && e.key !== "Escape") return;
    if (m.contains(e.target) && e.type === "pointerdown") return;
    if (e.type === "keydown") {
      e.preventDefault();
      e.stopImmediatePropagation(); // (Esc only shuts this menu: the pause menu stays down)
    }
    closeMenu();
  };
  const on = setTimeout(() => {
    addEventListener("pointerdown", away, true);
    addEventListener("keydown", away, true);
    addEventListener("wheel", away, true);
  });
  menuEl = m;
  menuOff = () => {
    clearTimeout(on);
    removeEventListener("pointerdown", away, true);
    removeEventListener("keydown", away, true);
    removeEventListener("wheel", away, true);
  };
}

/* "when you select spawn, it asks you what color before you place it down": the colors and No color; done(color) */
export function pickColor(label, cur, done) {
  openWindow(
    `<h2>${esc(label)}: which color?</h2>
    <div class="sb-cols sb-pickcols">${colSwatches(cur, "data-pick", true)}</div>`,
    {
      cls: "sb-setwin sb-putwin sb-colwin",
      onOpen(w, close) {
        w.addEventListener("click", (e) => {
          const c = e.target.closest("[data-pick]");
          if (!c) return;
          close();
          if (c.dataset.pick === SB_NOCOL) toast(NOCOL_NOTE, 4500);
          done(c.dataset.pick);
        });
      },
    },
  );
}

/* Build's preset for a kind: its name, color and, for a spawn, what it spawns (set before placing; each placing, Shift's
   repeats too, comes out as it says) */
export function openPreset(getR, kind, label, done) {
  const R = getR();
  if (!R) return;
  /* a spawn's or a respawn's settings are its color's (wave 2): "if you right-click it to configure it, it'll ask you
     which color first" */
  const linked = kind === "spawn" || kind === "respawn",
    cur = sbPresets[kind] || { f: {} },
    what = (cur.f.what || "").split(/[\s,]+/).filter(Boolean),
    kinds = kind === "spawn" ? kindsFor(R.state) : [];
  openWindow(
    `<h2>${esc(label)} preset</h2>
    <p class="sb-tip">Everything you put down as ${esc(label.toLowerCase())} comes out like this. Shift while you put it down keeps going.</p>
    <div class="sb-set">
    ${
      linked
        ? `<div class="sb-row"><span>Color first</span><span class="sb-cols">${colSwatches(cur.col, "data-pcol", true)}</span></div>
    <p class="sb-tip">What you set here is that color's: every ${esc(label.toLowerCase())} of it takes it.</p>`
        : ""
    }
    <label class="sb-row"><span>Name</span><input class="sb-box" data-pf="name" maxlength="20" value="${esc(cur.f.name || "")}" placeholder="its color's name"></label>
    ${
      linked
        ? ""
        : `<div class="sb-row"><span>Color</span><span class="sb-cols"><button type="button" class="sb-col${cur.col ? "" : " on"}" data-pcol="" aria-label="next free color" style="--c:#8888">·</button>${colSwatches(cur.col, "data-pcol", false)}</span></div>`
    }
    ${
      kind === "spawn"
        ? `<div class="sb-row"><span>Spawns</span><span class="sb-what">${kinds
            .map(
              ([k, n]) =>
                `<label><input type="checkbox" data-pwhat="${esc(k)}"${what.includes(k) ? " checked" : ""}> ${esc(n)}</label>`,
            )
            .join("")}</span></div>`
        : ""
    }
    </div>
    <p class="acts"><button type="button" class="btn" data-psave>Keep preset</button><button type="button" class="btn ghost" data-pclear>No preset</button></p>`,
    {
      cls: "sb-setwin sb-putwin",
      onOpen(w, close) {
        let col = cur.col || "";
        w.addEventListener("click", (e) => {
          const c = e.target.closest("[data-pcol]");
          if (c) {
            col = c.dataset.pcol;
            if (col === SB_NOCOL) toast(NOCOL_NOTE, 4500);
            w.querySelectorAll("[data-pcol]").forEach((x) =>
              x.classList.toggle("on", x === c),
            );
            return;
          }
          if (e.target.closest("[data-pclear]")) {
            delete sbPresets[kind];
            close();
            done && done();
            return;
          }
          if (e.target.closest("[data-psave]")) {
            const f = {},
              name = w.querySelector("[data-pf=name]").value.trim(),
              picked = [...w.querySelectorAll("[data-pwhat]:checked")].map(
                (x) => x.dataset.pwhat,
              );
            if (name) f.name = name;
            if (picked.length) f.what = picked.join(", ");
            if (col || Object.keys(f).length) sbPresets[kind] = { col, f };
            else delete sbPresets[kind];
            close();
            done && done();
          }
        });
      },
    },
  );
}
