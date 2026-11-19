/* ---------- Sandbox: the key windows (stage 1, the shell) ----------
   The owner's Sandbox file (Nov 19): c shows the cheat sheet, b build, m make an NPC, n Numerat, h the hotbar, g the
   game's settings and p the players' settings. Each one works like Tab: held down, its window shows and letting go
   closes it; a quick double tap keeps it up, and one tap of its key closes it again "IF they are already open". While a
   window is up, the number keys pick its options instead of switching weapons, and a mouse click on an option does the
   same. The cheat sheet is "somewhat" see-through and larger than Tab's window. Only c is for everyone: the others
   belong to whoever sbCan says (the host; everyone when Democracy of Ducklings lets everyone change the settings), or to
   everyone for the windows Game Settings gives everyone (sbMay).
   b places spawns (sbspawnview.js), m makes NPCs (sbmake.js) and p gives the rights; the options inside n, h and g come
   with the later stages.
   A phone has no keys: a Tools button under Leave Sandbox lists the windows, a tap on one keeps it up, and its × puts it
   away (the owner's answer 7, Nov 19 10:22Z: "you can start working on i now"). */
import { esc, typing, windowOpen } from "./ui.js";
import { isSb, sbMay, SB_KEYS_TAKEN, SB_KEY_IN_BUILD } from "./sandboxrules.js";
import {
  buildRows,
  ghostHTML,
  kdRows,
  sbNearPoint,
  sbPlace,
  sbSettings,
  sbView,
} from "./sbspawnview.js";
import { boxText } from "./sbspawn.js";
import { npcRows } from "./sbmake.js";
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
    "Build: pick a spawn, respawn, loot or board zone, then click or tap the map to put it there (Esc or right-click lets go). Hold, double-tap or tap it like C.",
  ],
  ["M", "Make an NPC: its look, its weapons and who it goes after."],
  [
    "N",
    "Numerat: your files, kept on this device, with a terminal line. Run a file there, or chmod +x it and ./file it. Numerat only runs in Sandbox.",
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
    "In Build, pick a spawn and click where it goes, then give it a key, or put it on the hotbar in H. Its key spawns any time. E on it changes it.",
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
  m: (R) => {
    const rows = npcRows(R);
    return [rows[0], ...kdRows(R), ...rows.slice(1)]; // (New NPC, then the four kinds' defaults, then the made ones)
  },
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

/* getR: () => the room; onOpen: called when a window comes up (the game closes Tab's window); spotAt(clientX, clientY):
   the spot on the map under that point of the screen ({ x, y }: shares of it), or null (game.js); returns a function
   that takes the windows away */
export function mountSandboxKeys(S, getR, onOpen, spotAt) {
  const box = document.createElement("div");
  box.className = "sb-win";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  S.append(box);
  const k = sbKeys();
  let shown = "";
  const paint = () => {
    const R = getR();
    sbView.build = !!R && k.open === "b" && sbMay(R.state, R.me, "b"); // (the zones show while I build: sbspawnview.js)
    if (!k.open || !R || !isSb(R.state)) {
      box.hidden = true;
      shown = "";
      return;
    }
    const w = SB_WINS[k.open],
      can = w.all || sbMay(R.state, R.me, k.open), // (the rights, or Game Settings giving everyone this window)
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
      box.innerHTML = `<header><span class="sb-tip">Double-tap <kbd>${k.open.toUpperCase()}</kbd> to keep it open</span><h2>${esc(w.name)}</h2><button type="button" class="sb-x" aria-label="Close">×</button></header>${body}`;
    }
    box.hidden = false;
  };
  /* a phone's Tools button and its list of the windows (css/app.css shows it only on a phone or tablet) */
  const tools = document.createElement("div");
  tools.className = "sb-tools";
  tools.innerHTML = `<button type="button" class="btn ghost sb-tools-btn" aria-expanded="false">Tools</button><div class="sb-tools-list" hidden></div>`;
  S.append(tools);
  const tBtn = tools.firstChild,
    tList = tools.lastChild;
  const showList = (on) => {
    const R = getR();
    tList.hidden = !on;
    tBtn.setAttribute("aria-expanded", on ? "true" : "false");
    if (!on || !R) return;
    tList.innerHTML = Object.entries(SB_WINS)
      .filter(([key, w]) => w.all || sbMay(R.state, R.me, key))
      .map(
        ([key, w]) =>
          `<button type="button" class="sb-tools-opt" data-k="${key}">${esc(w.name)}</button>`,
      )
      .join("");
  };
  const openWin = (key) => {
    showList(false);
    if (key === "n") {
      sbClose(k, false);
      paint();
      import("./numeratwin.js").then((m) => m.openNumerat());
      return;
    }
    k.open = key;
    k.sticky = true; // (kept up, as a double tap keeps it: its × or Esc puts it away)
    k.swallow = "";
    if (onOpen) onOpen();
    paint();
    seat();
  };
  tools.addEventListener("click", (e) => {
    const o = e.target.closest(".sb-tools-opt");
    if (o) return openWin(o.dataset.k);
    if (e.target.closest(".sb-tools-btn")) showList(tList.hidden);
  });
  /* it sits under Leave Sandbox, wherever that button is (it takes two lines on a narrow phone); Cancel takes its place
     while I'm putting something down */
  const seat = () => {
    const R = getR(),
      end = S.querySelector(".cabin-end");
    tools.hidden = !R || !isSb(R.state) || !!k.open || windowOpen() || !!carry;
    if (tools.hidden) showList(false);
    if (!end) return;
    const r = end.getBoundingClientRect(),
      top = Math.round(r.bottom + 6) + "px",
      left = Math.round(r.left) + "px";
    for (const el of [tools, cancel]) {
      if (el.style.top !== top) el.style.top = top;
      if (el.style.left !== left) el.style.left = left;
    }
  };
  const seating = setInterval(seat, 250);
  /* ---------- putting down what Build picked: it rides on my mouse until a click on the map puts it there (a phone:
     the next tap). Esc, a right click or Cancel puts it back. Nothing else on the map hears that click ---------- */
  const ghost = document.createElement("div"),
    cancel = document.createElement("button");
  ghost.className = "sb-ghost";
  ghost.hidden = true;
  ghost.setAttribute("aria-hidden", "true");
  cancel.type = "button";
  cancel.className = "btn ghost sb-cancel";
  cancel.hidden = true;
  S.append(ghost, cancel);
  let carry = null, // ({ kind, label }: what I'm putting down)
    eat = 0, // (the click after the press that put it down: nobody else's)
    mx = -1,
    my = -1;
  const follow = () => {
    if (!carry || mx < 0) return;
    ghost.style.transform = `translate(${mx}px, ${my}px)`;
  };
  const drop = () => {
    carry = null;
    ghost.hidden = cancel.hidden = true;
    S.classList.remove("sb-placing");
    seat();
  };
  sbPlace.start = (kind, label) => {
    const R = getR();
    if (!R || !sbMay(R.state, R.me, "b")) return;
    carry = { kind, label };
    ghost.innerHTML = ghostHTML(R.state, kind);
    ghost.classList.toggle("zone", kind === "zone");
    ghost.hidden = mx < 0; // (a phone: nothing on a finger until it taps)
    cancel.textContent = `Cancel ${label.toLowerCase()}`;
    cancel.hidden = false;
    S.classList.add("sb-placing");
    follow();
    seat();
  };
  cancel.addEventListener("click", drop);
  const onMap = (e) =>
    !!e.target.closest(".board") &&
    !e.target.closest(
      "button, .btn, a, input, textarea, select, .win, .sb-win, .tpad, .sb-tools, .cabin-end, .sb-cancel",
    );
  const pmove = (e) => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX;
    my = e.clientY;
    if (!carry) return;
    if (ghost.hidden) ghost.hidden = false;
    follow();
  };
  const pdown = (e) => {
    if (!carry) return;
    if (e.button === 2) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return drop(); // (a right click: put it back)
    }
    if (!onMap(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation(); // (no walking there, no swing, no shot)
    const R = getR(),
      at = spotAt && spotAt(e.clientX, e.clientY);
    if (R && at)
      R.send({ t: "sb", k: "add", kind: carry.kind, x: at.x, y: at.y });
    eat = performance.now();
    drop();
  };
  const swallow = (e) => {
    if (performance.now() - eat > 600) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const menu = (e) => {
    if (carry) e.preventDefault();
  };
  addEventListener("pointermove", pmove, true);
  addEventListener("pointerdown", pdown, true);
  for (const t of ["mousedown", "mouseup", "pointerup", "click"])
    addEventListener(t, swallow, true);
  addEventListener("contextmenu", menu, true);
  seat();
  const pick = (i) => {
    const R = getR(),
      o = R && sbOptions(k.open, R)[i];
    if (!o || !R || !(SB_WINS[k.open].all || sbMay(R.state, R.me, k.open)))
      return;
    if (o.win) {
      sbClose(k, false); // (a popup of its own takes the place)
      paint();
    }
    o.act(R);
  };
  box.addEventListener("click", (e) => {
    if (e.target.closest(".sb-x")) {
      sbClose(k, false);
      paint();
      seat();
      return;
    }
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
    if (e.key === "Escape" && carry && !k.open) {
      e.preventDefault();
      e.stopImmediatePropagation();
      drop();
      return;
    }
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
      const id = sbMay(s, R.me, "b") ? sbNearPoint(s, s.pos[R.me]) : null;
      if (id) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sbClose(k, false);
        paint();
        sbSettings(getR, id);
        return;
      }
    }
    /* a spawn's key: it spawns (any time: SB_KEY_IN_BUILD) */
    const sk = /^Key([A-Z])$/.exec(e.code);
    if (sk && (k.open === "b" || !SB_KEY_IN_BUILD)) {
      const key = sk[1].toLowerCase(),
        R = getR(),
        s = R.state;
      if (
        !SB_KEYS_TAKEN.includes(key) &&
        sbMay(s, R.me, "b") &&
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
    /* n opens the Numerat window itself (numeratwin.js), for whoever may write Numerat */
    if (l === "n" && sbMay(getR().state, getR().me, "n")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      sbClose(k, false); // (another window up: Numerat takes its place)
      paint();
      k.swallow = "n";
      import("./numeratwin.js").then((m) => m.openNumerat()); // (loaded when it's wanted: it brings the command line)
      return;
    }
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
      clearInterval(seating);
      removeEventListener("pointermove", pmove, true);
      removeEventListener("pointerdown", pdown, true);
      for (const t of ["mousedown", "mouseup", "pointerup", "click"])
        removeEventListener(t, swallow, true);
      removeEventListener("contextmenu", menu, true);
      sbPlace.start = null;
      box.remove();
      tools.remove();
      ghost.remove();
      cancel.remove();
      sbView.build = false;
    },
  };
}
