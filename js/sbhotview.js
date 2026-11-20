/* ---------- Sandbox: the hotbar (stage 4a), the screen ----------
   The rules are sbhot.js. Here: a spawn button's picture (a simple 2D shape in one of the board's colors, or the head of
   one of the things its spawn makes), the loot in the cheat sheet (c), the h window's rows, and the popup that puts
   something on a key, as the special selection in Customize does ("which they have to add to their hotbar in a popup
   similar to the popup from special selection in customize") */
import { esc, openWindow } from "./ui.js";
import { isSb, sbMay, SB_COLORS, SB_WHAT } from "./sandboxrules.js";
import { isL4dd } from "./l4ddrules.js";
import { WEAPONS } from "./rules.js";
import { boxText } from "./sbspawn.js";
import { sbSlots, sbIcon, spawnOf, SB_SHAPES, SB_SLOTS } from "./sbhot.js";
import { SPECIALS, KEYS, specialById, looksOf, keysOf } from "./specials.js";
import { npcURL, npcBox } from "./sbnpcart.js";
import { zLook } from "./mgjrules.js";
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
      ? { k, l: zLook(), i: 1 }
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
        ? x.kind === "item" && WEAPONS.includes(x.id)
        : kind === "item"
          ? x.kind === "item" && !WEAPONS.includes(x.id)
          : x.kind === kind), // (each list holds only its own kind: Jumps only the jumps)
  );
/* a row of the hotbar's keys: slots (the ids on them), to ("me" or "def"), off (can't be changed), v (the one picked: its keys
   show pressed) */
function keysHTML(s, duck, slots, to, off, v) {
  return `<div class="sp-keys sp-pick sb-put" role="group">${KEYS.slice(
    0,
    SB_SLOTS,
  )
    .map((n, i) => {
      const x = slotLook(s, slots[i], duck);
      return `<button type="button" class="sp-key${x ? " full" : ""}" data-to="${to}" data-i="${i}" aria-pressed="${!!v && slots[i] === v}" aria-label="Key ${n}${x ? ": " + esc(x.name) : ": empty"}"${off ? " disabled" : ""}><b>${n}</b>${x ? `<i>${x.icon}</i>` : ""}</button>`;
    })
    .join("")}</div>`;
}
/* the h window's part under its option rows (the owner's, Nov 19 17:15Z: "any loot at all, you get on the hotbar menu ... the
   hotbar that is yours, the hotbar that is the default, will be below all those options you're scrolling through"): all the
   loot by group in a list that scrolls, and your hotbar and the default one always under it. Pick a loot, then a key; the
   loot stays picked, so the next key takes it too, with no way back to go. picked: the loot's id */
export function hotWinHTML(R, picked) {
  const s = R.state,
    hb = (s.sb && s.sb.hb) || {},
    can = sbMay(s, R.me, "h"),
    duck = (s.players[R.me] || {}).duck,
    btn = (id, sp, tip) =>
      `<button type="button" class="sb-lt" data-v="${esc(id)}" aria-pressed="${picked === id}" data-tip="${esc(tip || "")}"><i>${sp.icon}</i><span>${esc(sp.name)}</span></button>`,
    /* every spawn a button can press: an older lone spawn, or a zone's Spawn tab (since zones only, every spawn is a
       tab: sbspawn.js press); never a spawn's Players page */
    spawns = Object.entries((s.sb && s.sb.pts) || {}).filter(
      ([, q]) => q.k === "spawn" && (!q.grp || q.pg === "t") && q.pg !== "pl",
    ),
    it = picked && slotLook(s, picked, duck);
  const list = `<div class="sb-lootlist" tabindex="0" aria-label="Loot">${LOOT.map(
    ([k, n]) =>
      `<h4>${esc(n)}</h4><div class="sb-lts">${lootOf(k)
        .map((x) => btn(x.id, looksOf(x, duck), looksOf(x, duck).tip))
        .join("")}</div>`,
  ).join("")}${
    spawns.length && can
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
  return `${list}${now}<h3>Your hotbar</h3>${hb.lock ? `<p class="sb-none">The hotbar is locked.</p>` : ""}${keysHTML(s, duck, sbSlots(s, R.me), "me", !!hb.lock, picked)}${can ? `<h3>Everyone's default</h3>${keysHTML(s, duck, hb.d || [], "def", false, picked)}` : ""}`;
}
/* a key of the h window pressed with `v` picked: put it there, or take it off if it is there already */
export function hotKeyPut(R, v, el) {
  const to = el.dataset.to,
    i = +el.dataset.i,
    slots =
      to === "def"
        ? ((R.state.sb || {}).hb || {}).d || []
        : sbSlots(R.state, R.me);
  R.send({ t: "sbh", k: "put", to, i, v: slots[i] === v ? null : v });
}

/* ---------- the h window ---------- */
export function hotRows(R, openPut) {
  const s = R.state,
    hb = (s.sb && s.sb.hb) || {},
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
      label: "The hotbar is locked: everyone has the same one",
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
  rows.push(
    {
      label: `Lock the hotbar: ${hb.lock ? "on" : "off"}`,
      on: !!hb.lock,
      act: (r) => r.send({ t: "sbh", k: "lock", on: !hb.lock }),
    },
    {
      label: "Make my hotbar everyone's default",
      act: (r) => r.send({ t: "sbh", k: "def" }),
    },
    {
      label: "Empty the default hotbar",
      act: (r) => r.send({ t: "sbh", k: "clear", to: "def" }),
    },
  );
  return rows;
}

/* ---------- the popup: put v on a key of my hotbar or of the default ---------- */
export function openPut(getR, v) {
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
    const keys = (slots, to, off) => keysHTML(s, duck, slots, to, off, v);
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
      <h3>Your hotbar</h3>${hb.lock ? `<p class="sb-none">The hotbar is locked.</p>` : ""}${keys(sbSlots(s, R.me), "me", !!hb.lock || (!!p && !can))}
      ${can ? `<h3>Everyone's default</h3>${keys(((s.sb && s.sb.hb) || {}).d || [], "def", false)}` : ""}
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
          const to = k.dataset.to,
            i = +k.dataset.i,
            slots =
              to === "def"
                ? ((R.state.sb || {}).hb || {}).d || []
                : sbSlots(R.state, R.me);
          R.send({
            t: "sbh",
            k: "put",
            to,
            i,
            v: slots[i] === v ? null : v,
          });
          return;
        }
        const ic = e.target.closest("[data-ic]");
        if (ic && p)
          R.send({ t: "sbh", k: "icon", p, v: ic.dataset.ic.split("|") });
      });
    },
  }).then(() => clearInterval(tick));
}
