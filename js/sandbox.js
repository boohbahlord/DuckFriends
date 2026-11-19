/* ---------- Sandbox: the key windows (stage 1, the shell) ----------
   The owner's Sandbox file (Nov 19): c shows the cheat sheet, b build, m make an NPC, n Numerat, h the hotbar, g the
   game's settings and p the players' settings. Each one works like Tab: held down, its window shows and letting go
   closes it; a quick double tap keeps it up, and one tap of its key closes it again "IF they are already open". While a
   window is up, the number keys pick its options instead of switching weapons, and a mouse click on an option does the
   same. The cheat sheet is "somewhat" see-through and larger than Tab's window. Only c is for everyone: the others
   belong to whoever sbCan says (the host; everyone when Democracy of Ducklings lets everyone change the settings).
   The options inside b, m, n, h, g and p come with the later stages; for now those windows are empty. */
import { esc, typing, windowOpen } from "./ui.js";
import { isSb, sbCan } from "./sandboxrules.js";

/* each window: its key, its title, and whether it needs the host's rights */
export const SB_WINS = {
  c: { name: "Cheat sheet", all: true },
  b: { name: "Build" },
  m: { name: "Make an NPC" },
  n: { name: "Numerat" },
  h: { name: "Hotbar" },
  g: { name: "Game settings" },
  p: { name: "Player settings" },
};
/* the cheat sheet's words (a first draft; the head planner writes the real ones). The loot preview (stage 4) goes under
   them */
export const SB_SHEET = [
  ["C", "This cheat sheet"],
  ["B", "Build: spawns, respawns, loot and boards"],
  ["M", "Make an NPC"],
  ["N", "Numerat"],
  ["H", "Hotbar"],
  ["G", "Game settings"],
  ["P", "Player settings"],
  ["1-9", "Pick an option while a window is up"],
  ["Esc", "Close the window"],
];
/* how fast two taps must be to count as a double tap, and how short a press is a tap */
const TAP_MS = 300;
const DOUBLE_MS = 350;

/* p, for now: one switch a player, to give them the rights or take them back (the owner's answer 2, Nov 19 01:34Z: the
   host "decide[s] who else gets it"); the rest of p comes later */
const rightsRows = (R) => {
  const s = R.state;
  return Object.values(s.players)
    .filter((p) => !p.bot && p.id !== s.hostId && p.id !== R.me)
    .map((p) => {
      const on = !!(s.sb && s.sb.ok && s.sb.ok[p.id]);
      return {
        label: `${p.name}: ${on ? "can change Sandbox" : "can't change Sandbox"}`,
        on,
        act: (r) => r.send({ t: "sbOk", who: p.id, on: !on }),
      };
    });
};
/* the options in a window (the later stages fill the rest): [{ label, act }], or a function of the room that makes them */
const OPTIONS = { c: [], b: [], m: [], n: [], h: [], g: [], p: rightsRows };
export const sbOptions = (k, R) => {
  const o = OPTIONS[k] || [];
  return typeof o === "function" ? (R ? o(R) : []) : o;
};

/* the key windows' state, kept apart from the screen so the tests can run it without a page:
   open: the window up ("" none), sticky: kept up by a double tap, at: when its key went down, tap: when a quick tap of
   it ended (for the double tap), swallow: the key-up that belongs to a press that closed it */
export function sbKeys() {
  return { open: "", sticky: false, at: 0, tap: 0, tapKey: "", swallow: "" };
}
/* a window's key went down (not a repeat) at t: what is up now */
export function sbDown(k, key, t) {
  if (k.open === key && k.sticky) {
    // (one tap of its key closes a window kept up)
    k.open = "";
    k.sticky = false;
    k.swallow = key;
    return k;
  }
  const dbl = k.tapKey === key && t - k.tap < DOUBLE_MS;
  k.open = key;
  k.sticky = dbl;
  k.at = t;
  k.swallow = dbl ? key : "";
  k.tap = 0;
  k.tapKey = "";
  return k;
}
/* a window's key came up at t */
export function sbUp(k, key, t) {
  if (k.swallow === key) {
    k.swallow = "";
    return k;
  }
  if (k.open !== key || k.sticky) return k;
  if (t - k.at < TAP_MS) {
    k.tap = t;
    k.tapKey = key;
  }
  k.open = "";
  return k;
}
/* close whatever is up (Esc, a lost window focus while a key is held, leaving the game) */
export function sbClose(k, held) {
  if (held && k.sticky) return k; // (a window kept up stays up when the browser loses the keys)
  k.open = "";
  k.sticky = false;
  k.swallow = "";
  return k;
}

/* getR: () => the room; onOpen: called when a window comes up (the game closes Tab's window); returns a function that
   takes the windows away */
export function mountSandboxKeys(S, getR, onOpen) {
  const box = document.createElement("div");
  box.className = "sb-win";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  S.append(box);
  const k = sbKeys();
  let shown = "";
  const paint = () => {
    const R = getR();
    if (!k.open || !R || !isSb(R.state)) {
      box.hidden = true;
      shown = "";
      return;
    }
    const w = SB_WINS[k.open],
      can = w.all || sbCan(R.state, R.me),
      opts = can ? sbOptions(k.open, R) : [];
    const sig = k.open + (can ? 1 : 0) + opts.map((o) => o.label).join("|");
    if (sig !== shown) {
      shown = sig;
      box.classList.toggle("sb-sheet", k.open === "c");
      box.setAttribute("aria-label", w.name);
      const body =
        k.open === "c"
          ? `<dl class="sb-keys">${SB_SHEET.map(([kk, t]) => `<dt><kbd>${kk}</kbd></dt><dd>${esc(t)}</dd>`).join("")}</dl>`
          : !can
            ? `<p class="sb-none">Only the host can change this.</p>`
            : opts.length
              ? `<div class="sb-opts">${opts.map((o, i) => `<button type="button" class="sb-opt${o.on ? " on" : ""}" data-i="${i}">${i < 9 ? `<kbd>${i + 1}</kbd>` : ""}${esc(o.label)}</button>`).join("")}</div>`
              : `<p class="sb-none">Nothing here yet.</p>`;
      box.innerHTML = `<header><span class="sb-tip">Double-tap <kbd>${k.open.toUpperCase()}</kbd> to keep it open</span><h2>${esc(w.name)}</h2></header>${body}`;
    }
    box.hidden = false;
  };
  const pick = (i) => {
    const R = getR(),
      o = R && sbOptions(k.open, R)[i];
    if (!o || !R || !(SB_WINS[k.open].all || sbCan(R.state, R.me))) return;
    o.act(R);
  };
  box.addEventListener("click", (e) => {
    const b = e.target.closest(".sb-opt");
    if (b) pick(+b.dataset.i);
  });
  const mine = (e) => {
    const R = getR();
    return (
      R &&
      isSb(R.state) &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !typing(e) &&
      !windowOpen() &&
      !document.querySelector(".pk") // (the piano's keyboard mode plays these letters)
    );
  };
  const letter = (e) => {
    const m = /^Key([A-Z])$/.exec(e.code);
    const l = m && m[1].toLowerCase();
    return l && SB_WINS[l] ? l : "";
  };
  const keydown = (e) => {
    if (e.key === "Tab" && k.open) {
      sbClose(k, false); // (Tab's window takes the place)
      paint();
      return;
    }
    if (!mine(e)) return;
    if (e.key === "Escape" && k.open) {
      e.preventDefault();
      e.stopImmediatePropagation();
      sbClose(k, false);
      paint();
      return;
    }
    const l = letter(e);
    if (l) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      const was = k.open;
      sbDown(k, l, performance.now());
      if (k.open && !was && onOpen) onOpen();
      paint();
      return;
    }
    const d = /^(?:Digit|Numpad)([0-9])$/.exec(e.code);
    if (d && k.open) {
      e.preventDefault();
      e.stopImmediatePropagation(); // (the number keys belong to the window: no weapon switches)
      if (!e.repeat && d[1] !== "0") pick(+d[1] - 1);
    }
  };
  const keyup = (e) => {
    const l = letter(e);
    if (!l) return;
    if (k.open || k.swallow) e.stopImmediatePropagation();
    sbUp(k, l, performance.now());
    paint();
  };
  const blur = () => {
    sbClose(k, true);
    paint();
  };
  addEventListener("keydown", keydown, true);
  addEventListener("keyup", keyup, true);
  addEventListener("blur", blur);
  return {
    paint,
    isOpen: () => !!k.open,
    destroy() {
      removeEventListener("keydown", keydown, true);
      removeEventListener("keyup", keyup, true);
      removeEventListener("blur", blur);
      box.remove();
    },
  };
}
