/* ---------- Sandbox: the key windows (stage 1, the shell) ----------
   The owner's Sandbox file (Nov 19): c shows the cheat sheet, b build, m make an NPC, n Numerat, h the hotbar, g the
   game's settings and p the players' settings. Each one works like Tab: held down, its window shows and letting go
   closes it; a quick double tap keeps it up, and one tap of its key closes it again "IF they are already open". While a
   window is up, the number keys pick its options instead of switching weapons, and a mouse click on an option does the
   same. The cheat sheet is "somewhat" see-through and larger than Tab's window. Only c is for everyone: the others
   belong to whoever sbCan says (the host; everyone when Democracy of Ducklings lets everyone change the settings).
   The options inside b, m, n, h, g and p come with the later stages; for now those windows are empty. */
import { esc, typing, windowOpen } from "./ui.js";
import { isSb, sbCan, SB_KEYS_TAKEN, SB_KEY_IN_BUILD } from "./sandboxrules.js";
import { buildRows, sbNearPoint, sbSettings } from "./sbspawnview.js";
import { boxText } from "./sbspawn.js";
import { hotRows, lootHTML, openPut, sbHotOn } from "./sbhotview.js";

/* each window: its key, its title, and whether it needs the host's rights */
export const SB_WINS = {
  c: { name: "Cheat sheet", all: true },
  b: { name: "Build" },
  m: { name: "Make an NPC" },
  n: { name: "Numerat" },
  h: { name: "Hotbar", all: true }, // (its rows say who may do what: sbhotview.js hotRows)
  g: { name: "Game settings" },
  p: { name: "Player settings" },
};
/* the cheat sheet's words: what every key does in Sandbox (the owner's file: "Cheat sheet describes a shit ton in a large
   page popup"). Each later stage adds its own lines here as it lands. The loot preview (stage 4) goes under them: sbhotview.js lootHTML */
export const SB_SHEET = [
  [
    "C",
    "This cheat sheet. Hold it to look, double-tap it to keep it up, tap it once to put it away.",
  ],
  [
    "B",
    "Build: place spawns, respawns, loot and board zones. Hold, double-tap or tap it like C.",
  ],
  ["M", "Make an NPC: its look, its weapons and who it goes after."],
  [
    "N",
    "Numerat: your files and their help page. Numerat only runs in Sandbox.",
  ],
  [
    "H",
    "Hotbar: use your Customize hotbar or empty it. The host can lock it, make one everyone's default and add spawn buttons.",
  ],
  [
    "G",
    "Game settings for this Sandbox: where Numerat files are brought in to run.",
  ],
  ["P", "Player settings: who else may change Sandbox."],
  [
    "1-9",
    "While a window is up, pick its options by number or with the mouse. Weapons don't switch then.",
  ],
  ["E", "Use what you stand next to, a spawn too."],
  [
    "Spawns",
    "In Build, place a spawn and give it a key, or put it on the hotbar in H. While Build is up, its key spawns. E on it changes it.",
  ],
  [
    "Loot",
    "In Build, place loot: an orb that gives what it holds to whoever walks over it. E on it changes it.",
  ],
  [
    "Numbers",
    "2 is always 2. 2:4 is 2 to 4. 2,4 is 2 or 4. Speed and damage take tenths (0.8:1.2). t or f for yes or no.",
  ],
  ["Esc", "Close the window."],
  ["Leave Sandbox", "Top left. Half the room's votes, or the host, ends it."],
  [
    "Who",
    "The host can change everything. With Democracy of Ducklings letting all change settings, everyone can.",
  ],
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
const OPTIONS = {
  c: [],
  b: buildRows,
  m: [],
  n: [],
  h: (R) => hotRows(R, openPut),
  g: [],
  p: rightsRows,
};
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
          ? `<dl class="sb-keys">${SB_SHEET.map(([kk, t]) => `<dt><kbd>${kk}</kbd></dt><dd>${esc(t)}</dd>`).join("")}</dl>${sbHotOn(R.state) ? lootHTML((R.state.players[R.me] || {}).duck) : ""}`
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
    if (o.win) {
      sbClose(k, false); // (a popup of its own takes the place)
      paint();
    }
    o.act(R);
  };
  box.addEventListener("click", (e) => {
    const b = e.target.closest(".sb-opt");
    if (b) pick(+b.dataset.i);
    const lt = e.target.closest(".sb-lt");
    if (lt) {
      sbClose(k, false);
      paint();
      openPut(getR, lt.dataset.v); // (the cheat sheet's loot: onto a key)
    }
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
    /* E beside a spawn or a respawn opens its settings */
    if (e.code === "KeyE" && !e.repeat) {
      const R = getR(),
        s = R.state;
      const id = sbCan(s, R.me) ? sbNearPoint(s, s.pos[R.me]) : null;
      if (id) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sbClose(k, false);
        paint();
        sbSettings(getR, id);
        return;
      }
    }
    /* a spawn's key: it spawns (only while Build is up: SB_KEY_IN_BUILD) */
    const sk = /^Key([A-Z])$/.exec(e.code);
    if (sk && (k.open === "b" || !SB_KEY_IN_BUILD)) {
      const key = sk[1].toLowerCase(),
        R = getR(),
        s = R.state;
      if (
        !SB_KEYS_TAKEN.includes(key) &&
        sbCan(s, R.me) &&
        Object.values((s.sb && s.sb.pts) || {}).some(
          (p) => p.k === "spawn" && boxText(p, "key").toLowerCase() === key,
        )
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) R.send({ t: "sb", k: "key", key });
        return;
      }
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
