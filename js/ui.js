/* ---------- small helpers every screen uses ----------
   Elements, windows (each with an X at its top right; an X on a question means No), toasts at the bottom middle, and hover
   tips that wait about a second before they show and never cover what they explain. */
import { sfx } from "./sound.js";
import { pxWords } from "./pxtext.js";
import { coverChanges } from "./loading.js";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
/* a class set only when it changes: toggled every frame for every duck, it was 35 calls a frame that changed nothing */
export const flag = (el, cls, on) => {
  const k = "_f" + cls;
  if (el[k] === on) return;
  el[k] = on;
  el.classList.toggle(cls, on);
};
/* a board's ducks layer, found once and kept on the board: on Duck Cabin and Downpour it comes after every prop, so each
   search for it walked all of them, many times a frame */
export const ducksLayer = (board) => {
  let l = board._ducksEl;
  if (!l || !board.contains(l))
    l = board._ducksEl = board.querySelector(".ducks");
  return l;
};
/* the ducks on a board: the layer's own children (never a search of the whole board) */
export function ducksOn(board) {
  const l = board && ducksLayer(board),
    out = [];
  if (l)
    for (const d of l.children) if (d.classList.contains("gduck")) out.push(d);
  return out;
}
export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
/* sets a part of the page only when it changed, so a click on it is never lost to a redraw (and the focus stays put) */
export function setHTML(node, html) {
  if (!node || node._html === html) return;
  const f = document.activeElement,
    sig = f && f !== document.body && node.contains(f) ? navSig(f) : "";
  node._html = html;
  node.innerHTML = html;
  if (sig) refocus(node, sig);
}
/* what a button is, so its copy can be found after a redraw: its data-* (not its tip), else its words */
export function navSig(b) {
  const d = Object.entries(b.dataset || {})
    .filter(([k]) => k !== "tip")
    .map((kv) => kv.join("="))
    .join(" ");
  return `${b.tagName} ${d || (b.textContent || "").trim().slice(0, 40)}`;
}
/* the focus back on the copy of what had it (or, failing that, on the item chosen, or the first) */
export function refocus(box, sig, list) {
  const all =
    list ||
    $$("button, a[href], input, select, textarea, summary, [tabindex]", box);
  const b =
    all.find((x) => navSig(x) === sig) ||
    (list &&
      (all.find((x) => x.getAttribute("aria-pressed") === "true") || all[0]));
  if (b) b.focus({ preventScroll: !list });
}
export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* a window over the page; resolves with what it was closed with (the X and Esc close it with null) */
export function openWindow(html, { cls = "", onOpen, cover = true } = {}) {
  return new Promise((done) => {
    const back =
      el(`<div class="win-back" role="presentation"><div class="win ${cls}" role="dialog" aria-modal="true">
      <button type="button" class="win-x" aria-label="Close">×</button>${html}</div></div>`);
    const win = back.firstElementChild,
      prev = document.activeElement;
    const close = (v) => {
      if (back.isConnected) sfx.uiClose();
      back.remove();
      uncover();
      removeEventListener("keydown", key, true);
      if (prev && prev.focus) prev.focus();
      done(v);
    };
    const key = (e) => {
      if (
        e.key === "Escape" &&
        back.isConnected &&
        back === $$(".win-back").pop()
      ) {
        e.preventDefault();
        e.stopPropagation();
        close(null);
      }
    };
    back.addEventListener("mousedown", (e) => {
      if (e.target === back) close(null);
    });
    win.querySelector(".win-x").onclick = () => close(null);
    addEventListener("keydown", key, true);
    document.body.appendChild(back);
    /* (its pages' pictures in behind the loading screen: loading.js; a window that loads its pictures itself says
       cover: false, as Customize) */
    const uncover = cover ? coverChanges(win) : () => {};
    sfx.uiOpen();
    win.close = close;
    if (onOpen) onOpen(win, close);
    const f = win.querySelector("[autofocus], input, button:not(.win-x)");
    if (f) f.focus();
  });
}
/* the window that asks for a private room's passkey (the friends list and the rooms list both open it): onKey gets the
   passkey typed; note is what went wrong last time; hint says what a passkey is when there is no note */
export function askPasskey(name, note, onKey, hint = false) {
  openWindow(
    `<h2>🔒 ${esc(name)}</h2><form class="pass-form" autocomplete="off"><input class="passkey" placeholder="Passkey" maxlength="20" aria-label="Passkey">
    ${note ? `<p class="small bad">${esc(note)}</p>` : hint ? '<p class="small dim">A private room: ask your friend for the passkey.</p>' : ""}<p class="acts"><button type="submit" class="btn green">Join</button></p></form>`,
    {
      cls: "win-small",
      onOpen: (w, close) => {
        const i = w.querySelector("input");
        i.focus();
        w.querySelector("form").onsubmit = (ev) => {
          ev.preventDefault();
          if (!i.value.trim()) {
            i.focus();
            return;
          }
          close();
          onKey(i.value);
        };
      },
    },
  );
}

/* Are you sure? Yes or No; the X is No */
export function confirmBox(title, line, yes = "Yes", no = "No") {
  return openWindow(
    `<h2>${esc(title)}</h2>${line ? `<p class="dim">${esc(line)}</p>` : ""}
    <p class="acts"><button type="button" class="btn" data-v="yes">${esc(yes)}</button><button type="button" class="btn ghost" data-v="no">${esc(no)}</button></p>`,
    {
      cls: "win-small",
      onOpen: (w, close) =>
        w
          .querySelectorAll("[data-v]")
          .forEach((b) => (b.onclick = () => close(b.dataset.v === "yes"))),
    },
  ).then((v) => v === true);
}

/* a toast at the bottom middle that fades on its own */
export function toast(text, ms = 3200) {
  let box = $("#toasts");
  if (!box) {
    box = el('<div id="toasts" aria-live="polite"></div>');
    document.body.appendChild(box);
  }
  const t = el(`<div class="toast"></div>`);
  t.textContent = text;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add("out");
    setTimeout(() => t.remove(), 400);
  }, ms);
}

/* a notice at the bottom middle with buttons (an invite, a friend request); it stays a while, X closes it */
export function notice(html, actions = [], ms = 25000) {
  let box = $("#notices");
  if (!box) {
    box = el('<div id="notices" aria-live="polite"></div>');
    document.body.appendChild(box);
  }
  const n = el(
    `<div class="notice"><div class="notice-text">${html}</div><div class="notice-acts"></div><button type="button" class="notice-x" aria-label="Close">×</button></div>`,
  );
  const close = () => {
    if (n.classList.contains("out")) return;
    n.classList.add("out");
    setTimeout(() => n.remove(), 300);
  };
  for (const [label, fn, cls = ""] of actions) {
    const b = el(
      `<button type="button" class="btn small ${cls}">${esc(label)}</button>`,
    );
    b.onclick = () => {
      close();
      fn();
    };
    n.querySelector(".notice-acts").appendChild(b);
  }
  n.querySelector(".notice-x").onclick = close;
  box.appendChild(n);
  setTimeout(close, ms);
  return close;
}

/* hover tips: data-tip on anything; about a second's wait; placed above or below so they never cover their subject */
let tipT = null,
  tipEl = null;
function hideTip() {
  clearTimeout(tipT);
  if (tipEl) {
    tipEl.remove();
    tipEl = null;
  }
}
document.addEventListener("pointerover", (e) => {
  const t = e.target.closest("[data-tip]");
  if (!t || e.pointerType === "touch") return;
  hideTip();
  tipT = setTimeout(() => {
    if (!t.isConnected) return;
    tipEl = el('<div class="tip" role="tooltip"></div>');
    tipEl.textContent = t.dataset.tip;
    document.body.appendChild(tipEl);
    pxWords(tipEl); // (its words on whole screen pixels: pxtext.js)
    const r = t.getBoundingClientRect(),
      w = tipEl.offsetWidth,
      h = tipEl.offsetHeight;
    const below = r.bottom + h + 10 < innerHeight;
    const dp = (v) => Math.round(v * devicePixelRatio) / devicePixelRatio; // (on a screen pixel, so its words' pixels are whole)
    tipEl.style.left =
      dp(
        Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)),
      ) + "px";
    tipEl.style.top = dp(below ? r.bottom + 8 : r.top - h - 8) + "px";
  }, 900);
});
document.addEventListener("pointerout", (e) => {
  if (e.target.closest && e.target.closest("[data-tip]")) hideTip();
});
document.addEventListener("pointerdown", hideTip, true);

/* is the player typing in a box? (keys then belong to the box) */
export const typing = (e) => {
  const t = e && e.target;
  return (
    !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
  );
};

/* a small menu at the pointer (right-click, or a long press on a phone); items = [[label, fn, {disabled}]…] */
export function contextMenu(x, y, items, { footer = "", onMount } = {}) {
  // footer: more below the items (onMount wires it)
  $$(".ctx").forEach((m) => m.remove());
  const prev = document.activeElement; // (the focus goes back there when the menu closes)
  const m = el(
    `<div class="ctx" role="menu">${items
      .map(
        ([label, , o = {}], i) =>
          `<button type="button" role="menuitem" data-i="${i}"${o.disabled ? " disabled" : ""}>${esc(label)}</button>`,
      )
      .join("")}${footer}</div>`,
  );
  document.body.appendChild(m);
  m.style.left =
    Math.max(6, Math.min(innerWidth - m.offsetWidth - 6, x)) + "px";
  m.style.top =
    Math.max(6, Math.min(innerHeight - m.offsetHeight - 6, y)) + "px";
  const off = (e) => {
    if (!m.contains(e.target)) close();
  };
  const key = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };
  const close = () => {
    const had = m.contains(document.activeElement);
    m.remove();
    removeEventListener("pointerdown", off, true);
    removeEventListener("keydown", key, true);
    if (had && prev && prev !== document.body && prev.isConnected)
      prev.focus({ preventScroll: true });
  };
  m.onclick = (e) => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    close();
    items[+b.dataset.i][1]();
  };
  setTimeout(() => {
    addEventListener("pointerdown", off, true);
    addEventListener("keydown", key, true);
  });
  if (onMount) onMount(m, close);
  m.querySelector("button:not([disabled])")?.focus();
}
/* right-click on a computer, a long press on a phone */
export function onMenu(node, fn) {
  node.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    fn(e.clientX, e.clientY, e);
  });
  let t = null;
  node.addEventListener(
    "touchstart",
    (e) => {
      const p = e.touches[0];
      t = setTimeout(() => fn(p.clientX, p.clientY, e), 550);
    },
    { passive: true },
  );
  ["touchend", "touchmove", "touchcancel"].forEach((k) =>
    node.addEventListener(k, () => clearTimeout(t), { passive: true }),
  );
}
/* a window is open over the page. Asked every frame in a game: both go straight into <body> (openWindow, contextMenu),
   so only its children are looked at, never the whole page (that search was 1.7 s a minute at 4x CPU on Downpour) */
export const windowOpen = () => {
  for (const c of document.body.children)
    if (c.classList.contains("win-back") || c.classList.contains("ctx"))
      return true;
  return false;
};

/* headings that fold, as in Word (the owner's, Nov 20 02:37Z: "the headings to be collapsible with an arrow down to their
   left ... you click it, boom, it collapses the information"): every heading among root's own children that matches
   sel gets an arrow at its left; a click folds what follows it, up to the next heading of its level or above (level(h):
   1 the top). Folded headings are remembered by their text in kept, so a window drawn again keeps them folded. */
export function foldHeads(root, sel, level, kept = new Set()) {
  const heads = () => [...root.children].filter((n) => n.matches(sel));
  const lay = () => {
    const stack = [];
    for (const n of root.children) {
      const head = n.matches(sel);
      if (head) {
        const L = level(n);
        while (stack.length && stack[stack.length - 1] >= L) stack.pop();
      }
      n.classList.toggle("fold-hid", stack.length > 0);
      if (head && n.classList.contains("folded")) stack.push(level(n));
    }
  };
  for (const h of heads()) {
    h.classList.add("fold-head");
    h.tabIndex = 0;
    h.setAttribute("role", "button");
    const folded = kept.has(h.textContent.trim());
    h.classList.toggle("folded", folded);
    h.setAttribute("aria-expanded", String(!folded));
  }
  const flip = (h) => {
    const t = h.textContent.trim(),
      folded = !h.classList.contains("folded");
    h.classList.toggle("folded", folded);
    h.setAttribute("aria-expanded", String(!folded));
    if (folded) kept.add(t);
    else kept.delete(t);
    lay();
  };
  root.addEventListener("click", (e) => {
    const h = e.target.closest(".fold-head");
    if (h && h.parentElement === root) flip(h);
  });
  root.addEventListener("keydown", (e) => {
    const h = e.target.closest(".fold-head");
    if (!h || h.parentElement !== root || (e.key !== "Enter" && e.key !== " "))
      return;
    e.preventDefault();
    flip(h);
  });
  lay();
}
