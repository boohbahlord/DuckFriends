/* ---------- Sandbox: the key windows (stage 1, the shell) ----------
   The owner's Sandbox file (Nov 19): c shows the cheat sheet, b build, m make an NPC, n Seriat, h the hotbar, g the
   game's settings and p the players' settings. One press of its key opens its window and the same key
   again closes it (the owner, Nov 19 16:17Z: "clicked only once instead of twice to get it up, and clicking again closes it"). While a
   window is up, the number keys pick its options instead of switching weapons, and a mouse click on an option does the
   same. The cheat sheet is "somewhat" see-through and larger than Tab's window. Only c is for everyone: the others
   belong to whoever sbCan says (the host; everyone when Democracy of Ducklings lets everyone change the settings), or to
   everyone for the windows Game Settings gives everyone (sbMay).
   b places spawns (sbspawnview.js), m makes NPCs (sbmake.js) and p gives the rights; the options inside n, h and g come
   with the later stages.
   A phone has no keys: a Tools button under Leave Sandbox lists the windows, a tap on one keeps it up, and its × puts it
   away (the owner's answer 7, Nov 19 10:22Z: "you can start working on i now"). */
import { LANG } from "./langname.js";
import { GOD_SW, godMay } from "./sbgod.js";
import { coverChanges } from "./loading.js";
import { esc, toast, typing, windowOpen } from "./ui.js";
import {
  isSb,
  sbMay,
  sbCan,
  SB_KEYS_TAKEN,
  SB_KEY_IN_BUILD,
  SB_POINTS,
  SB_RIGHTS,
} from "./sandboxrules.js";
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
import { sbCheatSound } from "./sbsfx.js";
import { sbSlots } from "./sbhot.js";
import { saveRows } from "./sbsaves.js";
import {
  hotKeyPut,
  hotRows,
  hotWinHTML,
  openPut,
  sbHotOn,
  sbHotSig,
} from "./sbhotview.js";
import {
  closeMenu,
  openPreset,
  patternOf,
  pickColor,
  pointAt,
  sbCheat,
  sbClip,
  sbPresets,
  showMenu,
} from "./sbmenu.js";

/* each window: its key, its title, and whether it needs the host's rights */
export const SB_WINS = {
  c: { name: "Cheat sheet", all: true },
  b: { name: "Build" },
  m: { name: "Make an NPC" },
  n: { name: LANG },
  h: { name: "Hotbar", all: true }, // (its rows say who may do what: sbhotview.js hotRows)
  g: { name: "Game settings" },
  p: { name: "Player settings" },
};
/* the cheat sheet's words: what every key does in Sandbox (the owner's file: "Cheat sheet describes a shit ton in a large
   page popup"). Each later stage adds its own lines here as it lands. The loot lives in the h window now: sbhotview.js hotWinHTML */
export const SB_SHEET = [
  ["C", "This cheat sheet. Press it once to open it, again to close it."],
  [
    "B",
    "Build: pick a spawn, respawn, loot or board zone, then click or tap the map to put it there (Esc or right-click lets go). Press it once to open it, again to close it.",
  ],
  [
    "M",
    "Make an NPC: its look, its weapons and who it goes after. Build a brain (its first row) makes a Brain file without typing.",
  ],
  [
    "N",
    `${LANG}: your files, kept on this device, with a terminal line. Run a file there, or chmod +x it and ./file it. ${LANG} only runs in Sandbox.`,
  ],
  [
    "H",
    "Hotbar: use your Customize hotbar or empty it. The host can lock it, make one everyone's default and add spawn buttons.",
  ],
  [
    "G",
    "Game settings for this Sandbox: Save and Save as (the host's, kept on the host's device; it also saves itself every minute), and the Music: which songs play, or none.",
  ],
  [
    "P",
    "Player settings: God mode and Invisible for yourself, whether other players may use them, who else may change Sandbox, and each player on their own.",
  ],
  [
    "1-9",
    "While a window is up, pick its options by number or with the mouse. Weapons don't switch then.",
  ],
  ["E", "Use what you stand next to, a spawn too."],
  [
    "Shift+C",
    "Cheat mode on or off, for whoever may build. While it is off, B, M, N, G, P, E on a build and the right-click menu wait. It starts on.",
  ],
  [
    "Right-click",
    "On a thing you placed: Properties, Copy, Cut. On an empty spot: Paste. A long press does it on a phone. Shift+V pastes where the mouse is.",
  ],
  [
    "Presets",
    "Right-click (or long press) a row in Build to set its name, color and what it spawns before you place it. Hold Shift while you place and it keeps placing.",
  ],
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

/* p, for now: one switch a player, to give them the rights or take them back (the owner's answer 2, Nov 19 01:34Z: the
   host "decide[s] who else gets it"); the rest of p comes later */
const rightsRows = (R) => {
  const s = R.state;
  /* the windows everyone may use, one switch each (not when Game Settings gave everyone all of them) */
  const wins =
    +s.options.sbAll === 1
      ? []
      : SB_RIGHTS.map(([k, n]) => {
          const on = +s.options["sbOk" + k.toUpperCase()] === 1;
          return {
            label: `${n} for everyone: ${on ? "on" : "off"}`,
            on,
            act: (r) => r.send({ t: "sbOk", win: k, on: !on }),
          };
        });
  const who = Object.values(s.players)
    .filter((p) => !p.bot && p.id !== s.hostId && p.id !== R.me)
    .map((p) => {
      const on = !!(s.sb && s.sb.ok && s.sb.ok[p.id]);
      return {
        label: `${p.name}: ${on ? "can change Sandbox" : "can't change Sandbox"}`,
        on,
        act: (r) => r.send({ t: "sbOk", who: p.id, on: !on }),
      };
    });
  return [...wins, ...who];
};
/* God mode and Invisible, for me or for player who (the last row of P): God mode first (key 1), Invisible second, then the
   switches under God mode while it is on (sbgod.js) */
const godRows = (R, who) => {
  const g = ((R.state.sb || {}).gd || {})[who || R.me] || {},
    send = (k, on) => R.send({ t: "sbg", k, on, ...(who ? { who } : {}) }),
    sw = (k, label) => ({
      label: `${label}: ${g[k] ? "on" : "off"}`,
      on: !!g[k],
      act: () => send(k, !g[k]),
    });
  return [
    sw("god", "God mode"),
    sw("inv", "Invisible"),
    ...(g.god ? GOD_SW.map(([k, n]) => sw(k, n)) : []),
  ];
};
let pWho = ""; // (the player whose settings the last row of P is showing)
/* the last option of every window: a big help window with pages (sbhelp.js) */
const helpRow = (key) => ({
  label: "Help",
  win: true,
  act: () => import("./sbhelp.js").then((m) => m.openSbHelp(key)),
});
const pRows = (R) => {
  const s = R.state,
    rights = sbCan(s, R.me);
  if (pWho && (!rights || (pWho !== "*" && !s.players[pWho]))) pWho = "";
  if (pWho === "*")
    return [
      { label: "Back", act: () => (pWho = "") },
      ...Object.values(s.players)
        .filter((p) => !p.bot)
        .map((p) => ({ label: p.name, act: () => (pWho = p.id) })),
      helpRow("p"),
    ];
  if (pWho)
    return [
      {
        label: `Back to all players (${(s.players[pWho] || {}).name})`,
        act: () => (pWho = "*"),
      },
      ...godRows(R, pWho),
      helpRow("p"),
    ];
  const rows = godMay(s, R.me) ? godRows(R) : [];
  if (rights) {
    const on = !!(s.sb && s.sb.gperm);
    rows.push({
      label: `Players may use God mode and Invisible: ${on ? "on" : "off"}`,
      on,
      act: (r) => r.send({ t: "sbg", perm: true, on: !on }),
    });
    rows.push(...rightsRows(R));
    rows.push({ label: "Each player", act: () => (pWho = "*") });
  }
  return [...rows, helpRow("p")];
};
/* the options in a window (the later stages fill the rest): [{ label, act }], or a function of the room that makes them */
/* M's first row: the Brain builder, a window of its own (loaded when it's wanted: it brings the command line) */
const BRAIN_ROW = {
  label: "Build a brain",
  win: true,
  act: () => import("./brainbuild.js").then((m) => m.openBrainBuilder()),
};
const OPTIONS = {
  c: [],
  b: (R) => [...buildRows(R), helpRow("b")],
  m: (R) => {
    const rows = npcRows(R);
    return [
      BRAIN_ROW, // ("at the very top, you can create the brain file": brainbuild.js)
      rows[0],
      ...kdRows(R),
      ...rows.slice(1),
      helpRow("m"),
    ]; // (Build a brain, New NPC, then the four kinds' defaults, then the made ones)
  },
  n: [],
  h: (R) => [...hotRows(R, openPut), helpRow("h")],
  g: (R) => [...saveRows(R), helpRow("g")], // (Save, Save as and Music: sbsaves.js)
  p: pRows,
};
export const sbOptions = (k, R) => {
  const o = OPTIONS[k] || [];
  return typeof o === "function" ? (R ? o(R) : []) : o;
};

/* the key windows' state, kept apart from the screen so the tests can run it without a page:
   open: the window up ("" none), sticky: always true now (a window stays up until its key is pressed again, Esc or ×),
   swallow: the key-up that belongs to a press that closed it. The owner, Nov 19 16:17Z: "the buttons for sanbox unique
   to it like b, m, or h ... is now clicked only once instead of twice to get it up, and clicking again closes it" */
export function sbKeys() {
  return { open: "", sticky: false, at: 0, tap: 0, tapKey: "", swallow: "" };
}
/* a window's key went down (not a repeat) at t: what is up now. One press opens it, the same key again closes it */
export function sbDown(k, key, t) {
  if (k.open === key) {
    k.open = "";
    k.sticky = false;
    k.swallow = key;
    return k;
  }
  k.open = key;
  k.sticky = true;
  k.at = t;
  k.swallow = "";
  return k;
}
/* a window's key came up: nothing to do, but the key-up of a press that closed it is eaten */
export function sbUp(k, key) {
  if (k.swallow === key) k.swallow = "";
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
  const uncover = coverChanges(box); // (a window's pictures in behind the loading screen: loading.js)
  const k = sbKeys();
  let shown = "";
  let hotPick = ""; // (the loot picked in the h window: then a key puts it there)
  const mayBuild = (R) =>
    ["b", "m", "n", "g"].some((x) => sbMay(R.state, R.me, x)); // (cheat mode is theirs)
  const paint = () => {
    const R = getR();
    sbView.build =
      !!R && (k.open === "b" || !!carry) && sbMay(R.state, R.me, "b"); // (the zones show while I build, and while I put something down: sbspawnview.js)
    if (!k.open || !R || !isSb(R.state)) {
      box.hidden = true;
      shown = "";
      return;
    }
    const w = SB_WINS[k.open],
      can =
        w.all ||
        sbMay(R.state, R.me, k.open) ||
        (k.open === "p" && godMay(R.state, R.me)), // (the rights, or Game Settings giving everyone this window)
      opts = can ? sbOptions(k.open, R) : [];
    const hotWin = k.open === "h" && can && sbHotOn(R.state);
    const sig =
      k.open +
      (can ? 1 : 0) +
      opts.map((o) => o.label).join("|") +
      (k.open === "c" ? sbCheat.on + "" + mayBuild(R) : "") +
      (hotWin
        ? hotPick +
          JSON.stringify((R.state.sb || {}).hb || {}) +
          JSON.stringify(sbSlots(R.state, R.me)) +
          sbHotSig(R.state) +
          Object.keys((R.state.sb || {}).pts || {}).length
        : "");
    if (sig !== shown) {
      shown = sig;
      box.classList.toggle("sb-sheet", k.open === "c");
      box.setAttribute("aria-label", w.name);
      const body =
        k.open === "c"
          ? `${mayBuild(R) ? `<p class="sb-cheatrow"><button type="button" class="btn small${sbCheat.on ? "" : " ghost"}" data-cheat aria-pressed="${sbCheat.on}">Cheat mode: ${sbCheat.on ? "on" : "off"}</button> <kbd>Shift</kbd>+<kbd>C</kbd></p>` : ""}<dl class="sb-keys">${SB_SHEET.map(([kk, t]) => `<dt><kbd>${kk}</kbd></dt><dd>${esc(t)}</dd>`).join("")}</dl>`
          : !can
            ? `<p class="sb-none">Only the host can change this.</p>`
            : opts.length
              ? `<div class="sb-opts${hotWin ? " sb-hotopts" : ""}">${opts.map((o, i) => `<button type="button" class="sb-opt${o.on ? " on" : ""}" data-i="${i}">${i < 9 ? `<kbd>${i + 1}</kbd>` : ""}${esc(o.label)}</button>`).join("")}</div>${hotWin ? hotWinHTML(R, hotPick) : ""}`
              : `<p class="sb-none">Nothing here yet.</p>`;
      box.innerHTML = `<header><span class="sb-tip">Press <kbd>${k.open.toUpperCase()}</kbd> again to close</span><h2>${esc(w.name)}</h2><button type="button" class="sb-x" aria-label="Close">×</button></header>${body}`;
    }
    box.hidden = false;
  };
  /* a phone's Tools button and its list of the windows (css/app.css shows it only on a phone or tablet) */
  const tools = document.createElement("div");
  tools.className = "sb-tools";
  tools.innerHTML = `<button type="button" class="btn ghost sb-tools-btn" aria-expanded="false">Tools</button><div class="sb-tools-list" hidden></div>`;
  S.append(tools);
  /* the Seriat bible's own button, bottom left, where the cheat mode note used to sit (the owner's, Nov 19 23:17Z) */
  const bible = document.createElement("button");
  bible.type = "button";
  bible.className = "btn ghost sb-bible";
  bible.hidden = true;
  bible.textContent = `${LANG} bible`;
  bible.onclick = () =>
    import("./seriatbible.js").then((m) => m.openSeriatBible());
  S.append(bible);
  /* the note, bottom left, as Sandbox comes up: which key is the cheat sheet and, for whoever may build, cheat mode;
     then it fades away. Cheat mode's own switch is in the cheat sheet (the owner's, Nov 19 21:59Z: "cheat mode on or
     off in the bottom left, we move that somewhere else ... It should be in the cheat sheet ... all in one text that
     pops on and then fades away when you load into Sandbox") */
  const chip = document.createElement("div");
  chip.className = "sb-cheat";
  chip.setAttribute("aria-hidden", "true");
  chip.hidden = true;
  S.append(chip);
  let chipFrom = 0; // (from when it is first seen: not under the loading screen)
  const CHIP_MS = 7000; // (6 s, then a 1 s fade: css/app.css .sb-cheat)
  const hasRights = () => {
    const R = getR();
    return (
      !!R &&
      isSb(R.state) &&
      ["b", "m", "n", "g"].some((x) => sbMay(R.state, R.me, x))
    );
  };
  const paintChip = () => {
    const R = getR();
    if (
      !chipFrom &&
      R &&
      isSb(R.state) &&
      !document.querySelector(".veil.loading")
    )
      chipFrom = performance.now();
    if (!chipFrom || performance.now() - chipFrom > CHIP_MS) {
      chip.hidden = true;
      return;
    }
    const keys = document.documentElement.classList.contains("keyboard"),
      sig = hasRights() + "" + sbCheat.on + keys;
    chip.hidden = false;
    if (chip.dataset.sig === sig) return;
    chip.dataset.sig = sig;
    chip.innerHTML = keys
      ? `<kbd>C</kbd> Cheat sheet${hasRights() ? ` · <kbd>Shift</kbd>+<kbd>C</kbd> Cheat mode ${sbCheat.on ? "on" : "off"}` : ""}`
      : `Tools: the cheat sheet${hasRights() ? ` and cheat mode (${sbCheat.on ? "on" : "off"})` : ""}`;
  };
  const toggleCheat = () => {
    if (!hasRights()) return;
    sbCheat.on = !sbCheat.on;
    sbCheatSound(sbCheat.on); // (a short chime up, or down: sbsfx.js)
    if (!sbCheat.on) {
      closeMenu();
      if (k.open && k.open !== "c" && k.open !== "h") {
        sbClose(k, false);
        paint();
      }
    }
    paintChip();
    if (k.open === "c")
      paint(); // (its button says on or off)
    else toast(`Cheat mode ${sbCheat.on ? "on" : "off"}.`);
  };
  /* the windows that are rights (c and h are for everyone): shut while cheat mode is off */
  const cheatShut = (key) => {
    if (sbCheat.on || key === "c" || key === "h" || !hasRights()) return false;
    toast("Cheat mode is off. Press Shift+C to turn it on.");
    return true;
  };
  const tBtn = tools.firstChild,
    tList = tools.lastChild;
  const showList = (on) => {
    const R = getR();
    tList.hidden = !on;
    tBtn.setAttribute("aria-expanded", on ? "true" : "false");
    if (!on || !R) return;
    tList.innerHTML = Object.entries(SB_WINS)
      .filter(
        ([key, w]) =>
          w.all ||
          sbMay(R.state, R.me, key) ||
          (key === "p" && godMay(R.state, R.me)),
      )
      .map(
        ([key, w]) =>
          `<button type="button" class="sb-tools-opt" data-k="${key}">${esc(w.name)}</button>`,
      )
      .join("");
  };
  const openWin = (key) => {
    showList(false);
    if (cheatShut(key)) return;
    if (key === "n") {
      sbClose(k, false);
      paint();
      import("./numeratwin.js").then((m) => m.openNumerat());
      return;
    }
    k.open = key;
    k.sticky = true; // (kept up: its key again, its × or Esc puts it away)
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
  /* the cheat note rides just above whatever is lowest at the bottom left (the Jumps count on a phone, the bar on a
     computer), so it never sits on the Notes button */
  const seatBible = () => {
    const R = getR(),
      a = S.querySelector(".jumps-slot, .bbar");
    bible.hidden = !R || !isSb(R.state) || !!k.open || windowOpen() || !a;
    if (bible.hidden) return;
    /* on the zombie worlds the minimap sits there too: the button goes above it (UI never overlaps) */
    const map = document.querySelector(".l4-map"),
      mr = map && !map.hidden && map.getBoundingClientRect(),
      over = mr && mr.height > 0 && mr.top < a.getBoundingClientRect().top,
      top =
        Math.round(
          (over ? mr.top : a.getBoundingClientRect().top) -
            bible.offsetHeight -
            6,
        ) + "px";
    if (bible.style.top !== top) {
      bible.style.top = top;
      bible.style.bottom = "auto";
    }
  };
  const seatChip = () => {
    if (chip.hidden) return;
    const a = bible.hidden ? S.querySelector(".jumps-slot, .bbar") : bible;
    if (!a) return;
    const r = a.getBoundingClientRect(),
      top = Math.round(r.top - chip.offsetHeight - 6) + "px";
    if (chip.style.top !== top) {
      chip.style.top = top;
      chip.style.bottom = "auto";
    }
  };
  const seating = setInterval(() => {
    seat();
    paintChip();
    seatBible();
    seatChip();
  }, 250);
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
    sbView.build = k.open === "b";
    sbView.until = performance.now() + 4000; // (the zones stay up a moment after: I see where it went)
    ghost.hidden = cancel.hidden = true;
    S.classList.remove("sb-placing");
    seat();
  };
  sbPlace.start = (kind, label, col) => {
    const R = getR();
    if (!R || !sbMay(R.state, R.me, "b")) return;
    /* a spawn or a respawn: its color first (wave 2), then it rides on my mouse in that color */
    if ((kind === "spawn" || kind === "respawn") && !col)
      return pickColor(label, (sbPresets[kind] || {}).col || "", (c) =>
        sbPlace.start(kind, label, c),
      );
    carry = { kind, label, col };
    sbView.build = true;
    ghost.innerHTML = ghostHTML(R.state, kind, col);
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
    if (R && at && !full(R))
      R.send({
        t: "sb",
        k: "add",
        kind: carry.kind,
        x: at.x,
        y: at.y,
        ...(carry.col ? { col: carry.col } : {}),
        ...(sbPresets[carry.kind] ? { pt: sbPresets[carry.kind] } : {}),
      });
    eat = performance.now();
    if (e.shiftKey && e.pointerType === "mouse") return; // (Shift held: it keeps going, the next click puts down another)
    drop();
  };
  const swallow = (e) => {
    if (performance.now() - eat > 600) return;
    /* a finger's pointerup is never eaten: the walking stick (touch.js) listens for it on the window, and a finger lifted
       within 600 ms of a placing left the duck walking for good (the owner, Nov 19 17:15Z: "phone joystick stuck after
       picking Zone in Build"). Only the mouse's own up and the click it makes belong to the placing */
    if (e.type.startsWith("pointer") && e.pointerType !== "mouse") return;
    if (
      e.target.closest &&
      e.target.closest(".tpad, .sb-tools, .sb-win, button")
    )
      return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  /* the right-click menu: on a placed thing Properties, Copy and Cut; on an empty spot Paste (a long press on a phone makes
     the same event). Only for whoever may build, with cheat mode on */
  const rights = () => {
    const R = getR();
    return !!R && isSb(R.state) && sbMay(R.state, R.me, "b");
  };
  /* the map holds SB_POINTS things at most: past that a click or a paste says so instead of doing nothing */
  const full = (R) => {
    if (Object.keys((R.state.sb && R.state.sb.pts) || {}).length < SB_POINTS)
      return false;
    toast(`A map holds ${SB_POINTS} things at most. Delete one first.`);
    return true;
  };
  const paste = (at) => {
    const R = getR();
    if (!R || !sbClip.pt || !at || full(R)) return;
    R.send({
      t: "sb",
      k: "add",
      kind: sbClip.pt.k,
      x: at.x,
      y: at.y,
      pt: sbClip.pt,
    });
  };
  const menuAt = (cx, cy, pointOnly) => {
    const R = getR(),
      at = spotAt && spotAt(cx, cy);
    if (!at) return false;
    const id = pointAt(R.state, at),
      p = id && R.state.sb.pts[id];
    if (!p && (pointOnly || !sbClip.pt)) return false; // (nothing to offer: the browser's own menu, or the game's)
    showMenu(
      S,
      cx,
      cy,
      p
        ? [
            {
              label: "Properties",
              act: () => sbSettings(getR, id),
            },
            { label: "Copy", act: () => (sbClip.pt = patternOf(p)) },
            {
              label: "Cut",
              act: () => {
                sbClip.pt = patternOf(p);
                getR().send({ t: "sb", k: "del", p: id });
              },
            },
          ]
        : [{ label: "Paste", act: () => paste(at) }],
    );
    return true;
  };
  const menu = (e) => {
    if (carry) return e.preventDefault();
    if (!rights() || !sbCheat.on || !onMap(e) || windowOpen()) return;
    if (!menuAt(e.clientX, e.clientY)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  /* a finger held still on the map (touch.js, before the specials come up): on a placed thing its menu comes up instead
     of the specials, so a phone's long press on a spawn always gives Properties, Copy and Cut */
  const hold = (cx, cy) => {
    const t = document.elementFromPoint(cx, cy);
    if (carry || !t || !rights() || !sbCheat.on || windowOpen()) return false;
    if (!onMap({ target: t })) return false;
    return menuAt(cx, cy, true);
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
    if (
      !o ||
      !R ||
      !(
        SB_WINS[k.open].all ||
        sbMay(R.state, R.me, k.open) ||
        (k.open === "p" && godMay(R.state, R.me))
      )
    )
      return;
    if (o.win) {
      sbClose(k, false); // (a popup of its own takes the place)
      paint();
    }
    o.act(R);
  };
  /* a Build row's preset: a right-click, or a long press on a phone */
  const presetOf = (b) => {
    const R = getR(),
      row = R && sbOptions("b", R)[+b.dataset.i];
    if (!row || !row.kind) return;
    sbClose(k, false);
    paint();
    openPreset(getR, row.kind, row.name || row.label, seat);
  };
  box.addEventListener("contextmenu", (e) => {
    const b = k.open === "b" && e.target.closest(".sb-opt");
    if (!b) return;
    e.preventDefault();
    presetOf(b);
  });
  /* the finger that held a row down lifts on the window that came up under it: what the browser makes of that lift
     (a mousedown on the window's backdrop shut the preset at once) is not a press there. Eaten until 400 ms after the
     finger is up */
  const eatLift = (id) => {
    let until = performance.now() + 3000;
    const types = ["mousedown", "mouseup", "click"];
    const off = () => {
      for (const t of types) removeEventListener(t, eat, true);
      removeEventListener("pointerup", up, true);
      removeEventListener("pointercancel", up, true);
    };
    const eat = (e) => {
      if (performance.now() > until) return off();
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const up = (e) => {
      if (e.pointerId === id) until = performance.now() + 400;
    };
    for (const t of types) addEventListener(t, eat, true);
    addEventListener("pointerup", up, true);
    addEventListener("pointercancel", up, true);
    setTimeout(off, 3000);
  };
  let lp = 0,
    lpAt = null; // (where the finger went down: a shaky finger still holds, a slide doesn't)
  box.addEventListener("pointerdown", (e) => {
    const b =
      k.open === "b" &&
      e.pointerType === "touch" &&
      e.target.closest(".sb-opt");
    clearTimeout(lp);
    lpAt = b ? { x: e.clientX, y: e.clientY } : null;
    if (b)
      lp = setTimeout(() => {
        lpAt = null;
        eatLift(e.pointerId);
        presetOf(b);
      }, 550);
  });
  box.addEventListener("pointermove", (e) => {
    if (lpAt && Math.hypot(e.clientX - lpAt.x, e.clientY - lpAt.y) > 10)
      clearTimeout(lp);
  });
  for (const t of ["pointerup", "pointercancel"])
    box.addEventListener(t, () => clearTimeout(lp));
  box.addEventListener("click", (e) => {
    if (e.target.closest("[data-cheat]")) {
      toggleCheat();
      return;
    }
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
      hotPick = hotPick === lt.dataset.v ? "" : lt.dataset.v; // (picked; again to let go)
      shown = "";
      paint();
    }
    const key = e.target.closest(".sp-key[data-i]");
    if (key && hotPick) hotKeyPut(getR(), hotPick, key);
    if (e.target.closest("[data-look]")) {
      const v = hotPick;
      sbClose(k, false);
      paint();
      openPut(getR, v); // (a spawn button's look and name)
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
    if (e.shiftKey && e.code === "KeyC") {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) toggleCheat();
      return;
    }
    if (e.shiftKey && e.code === "KeyV" && !e.repeat) {
      const R = getR(),
        at = spotAt && mx >= 0 && spotAt(mx, my);
      if (rights() && sbCheat.on && sbClip.pt) {
        e.preventDefault();
        e.stopImmediatePropagation();
        paste(
          at || { x: R.state.pos[R.me].x, y: R.state.pos[R.me].y }, // (no mouse yet: where I stand)
        );
        return;
      }
    }
    /* E beside a spawn or a respawn opens its settings */
    if (e.code === "KeyE" && !e.repeat && sbCheat.on) {
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
    if (l && !e.repeat && cheatShut(l)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    /* n opens the Seriat window itself (numeratwin.js), for whoever may write Seriat */
    if (l === "n" && sbMay(getR().state, getR().me, "n")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      sbClose(k, false); // (another window up: Seriat takes its place)
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
  /* my Seriat folder's names go to the room, so home/ shows it to whoever may look (nbperms.js): every few seconds,
     sent only when they changed or a new Sandbox started */
  const share = setInterval(async () => {
    const R = getR();
    if (!R || !isSb(R.state) || R.state.phase === "lobby") return;
    const [{ numerat }, { shellCtx }] = await Promise.all([
      import("./shell.js"),
      import("./chat.js"),
    ]);
    numerat.share(shellCtx());
  }, 3000);
  return {
    paint,
    hold,
    isOpen: () => !!k.open,
    destroy() {
      removeEventListener("keydown", keydown, true);
      removeEventListener("keyup", keyup, true);
      removeEventListener("blur", blur);
      clearInterval(seating);
      clearInterval(share);
      removeEventListener("pointermove", pmove, true);
      removeEventListener("pointerdown", pdown, true);
      for (const t of ["mousedown", "mouseup", "pointerup", "click"])
        removeEventListener(t, swallow, true);
      removeEventListener("contextmenu", menu, true);
      closeMenu();
      chip.remove();
      bible.remove();
      sbPlace.start = null;
      uncover();
      box.remove();
      tools.remove();
      ghost.remove();
      cancel.remove();
      sbView.build = false;
    },
  };
}
