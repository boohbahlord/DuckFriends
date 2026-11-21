/* ---------- Sandbox: the hotbar (stage 4a), the screen ----------
   The rules are sbhot.js. Here: a spawn button's picture (a simple 2D shape in one of the board's colors, or the head of
   one of the things its spawn makes), the loot in the cheat sheet (c), the h window's rows, and the popup that puts
   something on a key, as the special selection in Customize does ("which they have to add to their hotbar in a popup
   similar to the popup from special selection in customize") */
import { esc, openWindow } from "./ui.js";
import { profile, save } from "./store.js";
import { shareLook } from "./customize.js";
import { unlocked } from "./unlocks.js";
import { isSb, sbMay, SB_COLORS, SB_WHAT } from "./sandboxrules.js";
import { isL4dd } from "./l4ddrules.js";
import { BOARD_WEAPONS } from "./guns.js";
import { boxText } from "./sbspawn.js";
import { sbSlots, sbIcon, spawnOf, SB_SHAPES, SB_SLOTS } from "./sbhot.js";
import { SPECIALS, KEYS, specialById, looksOf, keysOf } from "./specials.js";
import { npcURL, npcBox } from "./sbnpcart.js";
import { zLook, ZOMBIE_BREEDS } from "./zombies.js";
import { botDuck } from "./botduck.js";
import { JUSTIN } from "./hangout/npcart.js";

const INK = "#1c1c28";
/* Sandbox's own hotbar is on (Dead Ducks Arcade's maps keep their slots) */
export const sbHotOn = (s) => isSb(s) && !isL4dd(s);

/* ---------- a spawn button's picture ---------- */
const SHAPE = {
  circle: `<circle cx="15" cy="15" r="11"/>`,
  square: `<rect x="4.5" y="4.5" width="21" height="21" rx="3"/>`,
  triangle: `<path d="M15 3.5L27 25.5H3Z"/>`,
  diamond: `<path d="M15 2.5L27.5 15L15 27.5L2.5 15Z"/>`,
  star: `<path d="M15 2.5L18.6 10.6L27.4 11.4L20.8 17.3L22.7 26L15 21.5L7.3 26L9.2 17.3L2.6 11.4L11.4 10.6Z"/>`,
};
export const shapeSVG = (sh, c) =>
  `<svg viewBox="0 0 30 30"><g fill="${SB_COLORS[c] || SB_COLORS.white}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round">${SHAPE[sh] || SHAPE.circle}</g></svg>`;
/* one of each kind, dressed once per page, so every head of a kind looks the same */
const ONE = {};
const oneOf = (k) =>
  ONE[k] ||
  (ONE[k] =
    k === "zombie"
      ? { k, l: zLook(ZOMBIE_BREEDS.sbBoard), i: 1 }
      : { k, dk: k === "justin" ? { ...JUSTIN } : botDuck() });
/* the top of its picture: its head */
export function headSVG(k) {
  const o = oneOf(k),
    b = npcBox(o);
  return `<svg viewBox="6 0 52 ${Math.min(52, b.h).toFixed(1)}"><image href="${npcURL(o)}" width="64" height="${b.h.toFixed(1)}"/></svg>`;
}
export function spawnIcon(s, p) {
  const [sh, c, h] = sbIcon(s, p);
  return h && SB_WHAT[h] ? headSVG(h) : shapeSVG(sh, c);
}
const ptOf = (s, p) => ((s.sb && s.sb.pts) || {})[p];
const spawnName = (s, p) => {
  const q = ptOf(s, p),
    n = q ? boxText(q, "name") : "";
  if (!q) return "Spawn";
  if (!n) return q.col + " spawn";
  return /^\d+$/.test(n) ? "Spawn " + n : n; // (a tab's own six digits read as "Spawn 415850", as on its tab)
};
/* a slot's look for the hotbar (hotbar.js look): a spawn button's, or null to leave it to the specials */
export function sbLook(s, id) {
  const p = spawnOf(id);
  if (!p || !ptOf(s, p)) return null;
  return {
    id,
    name: spawnName(s, p),
    icon: spawnIcon(s, p),
    tip: "Spawns it.",
  };
}
/* what makes the hotbar draw again (a spawn button's new look or name) */
export const sbHotSig = (s) =>
  JSON.stringify([(s.sb && s.sb.hb && s.sb.hb.ic) || 0]) +
  Object.entries((s.sb && s.sb.pts) || {})
    .filter(([, q]) => q.k === "spawn")
    .map(([p, q]) => p + boxText(q, "name"))
    .join();

/* any slot's picture and name */
function slotLook(s, id, duck) {
  if (!id) return null;
  return sbLook(s, id) || looksOf(specialById(id), duck);
}

/* ---------- the loot: every special Customize offers, in its groups ---------- */
export const LOOT = [
  ["effect", "Effects"],
  ["jump", "Jumps"],
  ["weapon", "Weapons"], // (the owner's, Nov 19 17:15Z: a dropdown per category, "some are weapons, some are items")
  ["item", "Items"],
];
export const lootOf = (kind) =>
  SPECIALS.filter(
    (x) =>
      !x.only &&
      !x.off &&
      (kind === "weapon"
        ? x.kind === "item" && BOARD_WEAPONS.includes(x.id)
        : kind === "item"
          ? x.kind === "item" && !BOARD_WEAPONS.includes(x.id)
          : x.kind === kind), // (each list holds only its own kind: Jumps only the jumps)
  );
/* a row of my hotbar's keys: slots (the ids on them), off (can't be changed), v (the one picked: its keys show pressed) */
function keysHTML(s, duck, slots, off, v) {
  return `<div class="sp-keys sp-pick sb-put" role="group">${KEYS.slice(
    0,
    SB_SLOTS,
  )
    .map((n, i) => {
      const x = slotLook(s, slots[i], duck);
      return `<button type="button" class="sp-key${x ? " full" : ""}" data-to="me" data-i="${i}" aria-pressed="${!!v && slots[i] === v}" aria-label="Key ${n}${x ? ": " + esc(x.name) : ": empty"}"${off ? " disabled" : ""}><b>${n}</b>${x ? `<i>${x.icon}</i>` : ""}</button>`;
    })
    .join("")}</div>`;
}
/* ---------- the hotbar window, one for every mode (P5, the owner's, Nov 21 18:59Z: "just click H for hotbar and you
   change only your hotbar"): Sandbox's h window, and the board's H. Each is a breed of data:
   - slots(R): my ten slots; put(R, i, v): slot i of mine gets v (null: emptied), one slot each
   - loot(kind): what its list offers of each group (LOOT); spawns: Sandbox's spawn buttons are in it too
   - locked(R): I can't change mine (Sandbox's lock); rows(R): its option rows; sig(R): what else makes it draw again
   Nobody's hotbar is handed to anyone: everyone starts empty (Sandbox's default hotbar is gone) */
const sbHb = (s) => (s.sb && s.sb.hb) || {};
const HOT_BREEDS = {
  sb: {
    slots: (R) => sbSlots(R.state, R.me),
    put: (R, i, v) => R.send({ t: "sbh", k: "put", to: "me", i, v }),
    loot: (kind) => lootOf(kind),
    spawns: true,
    locked: (R) => !!sbHb(R.state).lock,
    rows: (R) => hotRows(R),
    sig: (R) =>
      JSON.stringify(sbHb(R.state)) +
      sbHotSig(R.state) +
      Object.keys((R.state.sb || {}).pts || {}).length,
  },
  board: {
    slots: () => keysOf(profile.duck),
    put: (R, i, v) => {
      const keys = keysOf(profile.duck);
      if (v) keys.forEach((w, j) => w === v && (keys[j] = null)); // (one slot each, as in Customize)
      keys[i] = v;
      profile.duck.keys = keys;
      save();
      shareLook(); // (the room gets my duck's new keys)
    },
    loot: (kind) => lootOf(kind).filter((x) => unlocked("special", x.id)), // (what Customize offers me)
    spawns: false,
    locked: () => false,
    rows: () => [
      {
        label: "Empty my hotbar",
        act: (R) => {
          profile.duck.keys = Array(SB_SLOTS).fill(null);
          save();
          shareLook();
        },
      },
    ],
    sig: () => JSON.stringify(profile.duck.keys),
  },
};
/* the h window's part under its option rows (the owner's, Nov 19 17:15Z: "any loot at all, you get on the hotbar menu ...
   the hotbar that is yours ... will be below all those options you're scrolling through"): all the loot by group in a
   list that scrolls, and my hotbar always under it. Pick a loot, then a key; the loot stays picked, so the next key
   takes it too, with no way back to go. picked: the loot's id */
export function hotWinHTML(R, picked, B = HOT_BREEDS.sb) {
  const s = R.state,
    can = B.spawns && sbMay(s, R.me, "h"),
    duck = (s.players[R.me] || {}).duck || profile.duck,
    btn = (id, sp, tip) =>
      `<button type="button" class="sb-lt" data-v="${esc(id)}" aria-pressed="${picked === id}" data-tip="${esc(tip || "")}"><i>${sp.icon}</i><span>${esc(sp.name)}</span></button>`,
    /* every spawn a button can press: an older lone spawn, or a zone's Spawn tab (since zones only, every spawn is a
       tab: sbspawn.js press); never a spawn's Players page */
    spawns = can
      ? Object.entries((s.sb && s.sb.pts) || {}).filter(
          ([, q]) =>
            q.k === "spawn" && (!q.grp || q.pg === "t") && q.pg !== "pl",
        )
      : [],
    it = picked && slotLook(s, picked, duck);
  const list = `<div class="sb-lootlist" tabindex="0" aria-label="Loot">${LOOT.map(
    ([k, n]) =>
      B.loot(k).length
        ? `<h4>${esc(n)}</h4><div class="sb-lts">${B.loot(k)
            .map((x) => btn(x.id, looksOf(x, duck), looksOf(x, duck).tip))
            .join("")}</div>`
        : "", // (a group with nothing in it for me isn't shown)
  ).join("")}${
    spawns.length
      ? `<h4>Spawn buttons</h4><div class="sb-lts">${spawns
          .map(([p]) =>
            btn("sp:" + p, slotLook(s, "sp:" + p, duck), "Spawns it."),
          )
          .join("")}</div>`
      : ""
  }</div>`;
  const now = it
    ? `<p class="sb-picked"><i>${it.icon}</i><span><b>${esc(it.name)}</b>: pick a key to put it there, again to take it off.</span>${picked.startsWith("sp:") && can ? ` <button type="button" class="btn small ghost" data-look>Its look…</button>` : ""}</p>`
    : `<p class="sb-none sb-picked">Pick a loot above, then a key below.</p>`;
  return `${list}${now}<h3>Your hotbar</h3>${B.locked(R) ? `<p class="sb-none">The hotbar is locked.</p>` : ""}${keysHTML(s, duck, B.slots(R), B.locked(R), picked)}`;
}
/* a key of the h window pressed with `v` picked: put it there, or take it off if it is there already */
function hotKeyPut(R, v, el, B) {
  const i = +el.dataset.i;
  B.put(R, i, B.slots(R)[i] === v ? null : v);
}
/* the h window's own state, kept by whichever screen holds it: the loot picked */
export const hotState = () => ({ picked: "" });
/* what makes the h window draw again */
export const hotWinSig = (R, hot, B = HOT_BREEDS.sb) =>
  hot.picked + JSON.stringify(B.slots(R)) + B.sig(R);
/* a click in the h window: a loot picked (again to let go), a key given it, or its look's popup (close: the window
   goes first). True when it must draw again */
export function hotClick(e, getR, hot, close, B = HOT_BREEDS.sb) {
  const lt = e.target.closest(".sb-lt");
  if (lt) hot.picked = hot.picked === lt.dataset.v ? "" : lt.dataset.v;
  const key = e.target.closest(".sp-key[data-i]");
  if (key && !key.disabled && hot.picked) hotKeyPut(getR(), hot.picked, key, B);
  if (e.target.closest("[data-look]")) {
    const v = hot.picked;
    close();
    openPut(getR, v); // (a spawn button's look and name)
  }
  return !!lt;
}

/* ---------- the h window's rows: Sandbox's ---------- */
export function hotRows(R) {
  const s = R.state,
    hb = sbHb(s),
    can = sbMay(s, R.me, "h"),
    duck = (s.players[R.me] || {}).duck,
    rows = [];
  if (!sbHotOn(s))
    return [
      {
        label: "Dead Ducks Arcade's maps keep their own slots",
        act: () => {},
      },
    ];
  if (hb.lock && !can)
    rows.push({
      label: "The hotbar is locked: nobody can change theirs",
      act: () => {},
    });
  if (!hb.lock) {
    rows.push({
      label: "Use my Customize hotbar",
      act: (r) => r.send({ t: "sbh", k: "mine", v: keysOf(duck) }),
    });
    rows.push({
      label: "Empty my hotbar",
      act: (r) => r.send({ t: "sbh", k: "clear" }),
    });
  }
  if (!can) return rows;
  rows.push({
    label: `Lock the hotbar: ${hb.lock ? "on" : "off"}`,
    on: !!hb.lock,
    act: (r) => r.send({ t: "sbh", k: "lock", on: !hb.lock }),
  });
  return rows;
}

/* ---------- the board's H: the same window, over the board (P5) ----------
   H opens it and H again (Esc, ×) closes it (game.js and phonepad.js, through hotpick.js hotH); its rows, its loot and my keys as the h window's, the board's breed */
export function mountHotWin(S, getR, B = HOT_BREEDS.board) {
  const box = document.createElement("div"),
    hot = hotState();
  box.className = "sb-win sb-hotwin";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Hotbar");
  S.append(box);
  let shown = "",
    tick = 0;
  const draw = () => {
    const R = getR();
    if (!R || box.hidden) return;
    const sig = hotWinSig(R, hot, B);
    if (sig === shown) return;
    shown = sig;
    box.innerHTML = `<header><span class="sb-tip">Press <kbd>H</kbd> again to close</span><h2>Hotbar</h2><button type="button" class="sb-x" aria-label="Close">×</button></header><div class="sb-opts sb-hotopts">${B.rows(
      R,
    )
      .map(
        (o, i) =>
          `<button type="button" class="sb-opt" data-i="${i}">${esc(o.label)}</button>`, // (no number: the number keys stay my keys)
      )
      .join("")}</div>${hotWinHTML(R, hot.picked, B)}`;
  };
  /* Esc closes it first (caught on the way down, so the game's Esc doesn't pause too) */
  const esc1 = (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    close();
  };
  const close = () => {
    box.hidden = true;
    clearInterval(tick);
    removeEventListener("keydown", esc1, true);
  };
  box.addEventListener("click", (e) => {
    const R = getR();
    if (!R) return;
    if (e.target.closest(".sb-x")) return close();
    const o = e.target.closest(".sb-opt");
    if (o) {
      const row = B.rows(R)[+o.dataset.i];
      if (row) row.act(R);
    }
    if (hotClick(e, getR, hot, close, B)) shown = "";
    draw();
  });
  return {
    toggle() {
      if (!box.hidden) return close();
      box.hidden = false;
      shown = "";
      draw();
      tick = setInterval(draw, 200); // (my keys come back from the room a moment after each click)
      addEventListener("keydown", esc1, true);
    },
    el: box,
    close,
  };
}

/* ---------- the popup: put v on a key of my hotbar ---------- */
function openPut(getR, v) {
  const R0 = getR();
  if (!R0) return;
  const p = spawnOf(v);
  let sig = "",
    tick = 0;
  const body = (R) => {
    const s = R.state,
      hb = (s.sb && s.sb.hb) || {},
      can = sbMay(s, R.me, "h"),
      duck = (s.players[R.me] || {}).duck,
      it = slotLook(s, v, duck);
    if (!it)
      return `<h2>Gone</h2><p class="sb-none">It isn't here anymore.</p>`;
    let look = "";
    if (p && can) {
      const [sh, c, h] = sbIcon(s, p),
        what = boxText(ptOf(s, p), "what")
          .split(/[\s,]+/)
          .filter((k) => SB_WHAT[k]);
      look = `<h3>Its look</h3><div class="sb-looks">${SB_SHAPES.map(
        (x) =>
          `<button type="button" class="sb-look" data-ic="${x}|${c}|" aria-pressed="${!h && x === sh}" aria-label="${x}">${shapeSVG(x, c)}</button>`,
      ).join("")}</div><div class="sb-cols">${Object.entries(SB_COLORS)
        .map(
          ([k, col]) =>
            `<button type="button" class="sb-col${!h && k === c ? " on" : ""}" data-ic="${sh}|${k}|" style="--c:${col}" aria-label="${k}"></button>`,
        )
        .join("")}</div>${
        what.length
          ? `<div class="sb-looks">${what
              .map(
                (k) =>
                  `<button type="button" class="sb-look" data-ic="${sh}|${c}|${k}" aria-pressed="${h === k}" aria-label="${esc(SB_WHAT[k])}'s head">${headSVG(k)}</button>`,
              )
              .join("")}</div>`
          : ""
      }`;
    }
    return `<h2 class="sb-put-h"><i>${it.icon}</i>${esc(it.name)}</h2>${it.tip ? `<p class="sb-none">${esc(it.tip)}</p>` : ""}${look}
      <h3>Your hotbar</h3>${hb.lock ? `<p class="sb-none">The hotbar is locked.</p>` : ""}${keysHTML(s, duck, sbSlots(s, R.me), !!hb.lock || (!!p && !can), v)}
      <p class="sb-none">Pick a key to put it there; pick it again to take it off.</p>`;
  };
  openWindow(`<div class="sb-putwin"></div>`, {
    cls: "sb-setwin",
    onOpen(w) {
      const box = w.querySelector(".sb-putwin");
      const draw = () => {
        const R = getR();
        if (!R || !w.isConnected) return clearInterval(tick);
        const now = JSON.stringify([
          (R.state.sb || {}).hb || 0,
          (R.state.sb || {}).pts || 0,
          sbMay(R.state, R.me, "h"),
        ]);
        if (now === sig) return;
        sig = now;
        box.innerHTML = body(R);
      };
      draw();
      tick = setInterval(draw, 200); // (the room's state comes back a moment after each click)
      box.addEventListener("click", (e) => {
        const R = getR();
        if (!R) return;
        const k = e.target.closest(".sp-key[data-i]");
        if (k && !k.disabled) {
          hotKeyPut(R, v, k, HOT_BREEDS.sb);
          return;
        }
        const ic = e.target.closest("[data-ic]");
        if (ic && p)
          R.send({ t: "sbh", k: "icon", p, v: ic.dataset.ic.split("|") });
      });
    },
  }).then(() => clearInterval(tick));
}
