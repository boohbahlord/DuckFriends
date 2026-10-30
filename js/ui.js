/* ---------- small helpers every screen uses ----------
   Elements, windows (each with an X at its top right; an X on a question means No), toasts at the bottom middle, and hover
   tips that wait about a second before they show and never cover what they explain. */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
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
export function openWindow(html, { cls = "", onOpen } = {}) {
  return new Promise((done) => {
    const back =
      el(`<div class="win-back" role="presentation"><div class="win ${cls}" role="dialog" aria-modal="true">
      <button type="button" class="win-x" aria-label="Close">×</button>${html}</div></div>`);
    const win = back.firstElementChild,
      prev = document.activeElement;
    const close = (v) => {
      back.remove();
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
    win.close = close;
    if (onOpen) onOpen(win, close);
    const f = win.querySelector("[autofocus], input, button:not(.win-x)");
    if (f) f.focus();
  });
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
    const r = t.getBoundingClientRect(),
      w = tipEl.offsetWidth,
      h = tipEl.offsetHeight;
    const below = r.bottom + h + 10 < innerHeight;
    tipEl.style.left =
      Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) +
      "px";
    tipEl.style.top = (below ? r.bottom + 8 : r.top - h - 8) + "px";
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
/* a window is open over the page */
export const windowOpen = () => !!document.querySelector(".win-back, .ctx");
