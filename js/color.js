/* ---------- choosing a color ----------
   A row of ready colors and, at its end, the paintbrush: Invent a color. It opens a hex box (with the browser's color
   picker beside it) and a circled "i" that explains hex on hover or click. */
import { el, esc } from "./ui.js";
import { METAL, DUCK_METALS, SKIN_TONES } from "./duck.js";
import { styleById } from "./styles.js";
import { isLocked, unlocked, lockHint } from "./unlocks.js";

const SWATCHES = [
  "#1c1c28",
  "#ffffff",
  "#ef3b3b",
  "#ff8c2b",
  "#ffd23f",
  "#37d421",
  "#14c6b4",
  "#2fa4ff",
  "#9b5de5",
  "#ff7eb6",
  "#8b5a2b",
  "#9aa0aa",
];
/* the Colors screen's grid, after Halo: Reach's: each row one color, dark to light */
const SHADES = [
  ["#1c1c28", "#6b7078", "#ffffff"],
  ["#5a3a22", "#8b5a2b", "#c8996a"],
  ["#3f4a1f", "#6b7a2e", "#a8b860"],
  ["#1f6b2a", "#37d421", "#9ef08a"],
  ["#0d5c57", "#14c6b4", "#8fe8de"],
  ["#1d4f7a", "#2fa4ff", "#9fd3ff"],
  ["#2b2f7a", "#4a5ad8", "#a7b0f5"],
  ["#4b2479", "#9b5de5", "#d2b6f5"],
  ["#6b0f1e", "#ef3b3b", "#ff9a9a"],
  ["#8a3a0c", "#ff8c2b", "#ffc38a"],
  ["#9a7a00", "#ffd23f", "#fff0a3"],
  ["#8a1f55", "#ff7eb6", "#ffc7df"],
];
/* a duck's body color picked: a metal (kind "metal", c "m:" and its id), a skin from the list (drawn flat) or any other
   color */
export function paintBody(D, key, c, kind) {
  D.image = null;
  if (kind === "metal") return void (D.metal = c.slice(2));
  D[key] = c;
  D.metal = "none";
  D.matte = kind === "skin";
}
/* the metals in Colors' Metallic list (cur: the color being picked, as Customize lists it: [id, label, value …]): for
   a duck's body (Jack and Dat Boi take none) and a hat's or an outfit's color places, the owner's, Nov 21 15:28Z: "skin
   and metallic colors can be used on apparel too". [id, name, its lock hint while locked, picked]; locked as on the
   Skin page until the owner says otherwise (unlocks.js) */
export function metalChoices(D, [id, , value]) {
  const st = styleById(D.style),
    body =
      !st.pages && (id === "duck" || (st.colors || []).some(([k]) => k === id));
  if (!body && !/^(hat|outfit)-/.test(id)) return null;
  return DUCK_METALS.slice(1).map(([v, n]) => {
    const lock = isLocked("skin", "m:" + v) && !unlocked("skin", "m:" + v);
    return [
      v,
      n,
      lock ? lockHint("skin", "m:" + v) : "",
      body ? D.metal === v : value === "m:" + v,
    ];
  });
}
/* a metal's little chip: its bands, as on the duck */
const chip = (m) =>
  `linear-gradient(160deg, ${m[1]} 0 30%, ${m[2]} 55%, ${m[3]} 62%, ${m[4]} 85%)`;
let openList = ""; // (the drop-down left open: it stays open as the page is drawn again)
const HEX_INFO =
  "A hex color is # and six characters, each 0–9 or A–F: two for red, two for green, two for blue. 00 is none, FF is the most. #FF0000 is red, #00FF00 green, #FFFFFF white, #000000 black.";
const HEX_OK = /^#[0-9a-f]{6}$/i;
const normHex = (s) => {
  s = String(s || "").trim();
  if (!s.startsWith("#")) s = "#" + s;
  if (/^#[0-9a-f]{3}$/i.test(s))
    s = "#" + [...s.slice(1)].map((c) => c + c).join("");
  return HEX_OK.test(s) ? s.toLowerCase() : null;
};

/* a color field; onPick(hex, kind) runs on every change (kind "skin" from the skin list; "metal", with a metal's id,
   from the metals: [[id, name, lock tip or "", picked]], the ready-made ones, no hex) */
export function colorField(
  value,
  onPick,
  { swatches = SWATCHES, grid = false, metals = null } = {},
) {
  if (grid) swatches = SHADES.flat();
  if (/^m:/.test(value || "")) value = ""; // (a metal: no hex, its tile is marked in the Metallic list)
  const box = el(`<div class="colors${grid ? " grid3" : ""}">
    <div class="swatches">${swatches.map((c) => `<button type="button" class="sw" style="background:${c}" data-c="${c}" aria-label="${c}" aria-pressed="${c === value}"></button>`).join("")}
      <button type="button" class="sw brush" aria-label="Invent a color" data-tip="Invent a color" aria-expanded="false">🖌</button></div>
    <div class="invent" hidden>
      <input type="color" value="${esc(value || "#2fa4ff")}" aria-label="Color picker">
      <input class="hex" value="${esc(value || "#2fa4ff")}" maxlength="7" spellcheck="false" aria-label="Hex color">
      <button type="button" class="info" aria-label="What hex is" data-tip="${esc(HEX_INFO)}">i</button>
      <p class="info-text small dim" hidden>${esc(HEX_INFO)}</p>
    </div>
    <div class="cdrops"><button type="button" class="cdrop" data-l="skin" aria-expanded="false">Skin colors</button>${metals ? `<button type="button" class="cdrop" data-l="metal" aria-expanded="false">Metallic colors</button>` : ""}</div>
    <div class="clist" data-l="skin" hidden>${SKIN_TONES.map((c) => `<button type="button" class="sw" style="background:${c}" data-c="${c}" data-k="skin" aria-label="${c}" data-tip="${c.toUpperCase()}" aria-pressed="${c === value}"></button>`).join("")}</div>
    ${metals ? `<div class="clist cmetals" data-l="metal" hidden>${metals.map(([id, name, lock, on]) => `<button type="button" class="sw cmetal" style="background:${chip(METAL[id])}" data-m="${id}" aria-label="${esc(name)}" data-tip="${esc(lock || name)}" aria-pressed="${!!on}"${lock ? ` aria-disabled="true"` : ""}></button>`).join("")}</div>` : ""}
    </div>`);
  const inv = box.querySelector(".invent"),
    picker = inv.querySelector("[type=color]"),
    hex = inv.querySelector(".hex");
  const mark = (c) =>
    box
      .querySelectorAll(".sw[data-c], .cmetal")
      .forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === c));
  const set = (c, kind) => {
    mark(c);
    picker.value = c;
    if (document.activeElement !== hex) hex.value = c;
    onPick(c, kind);
  };
  /* the drop-downs: one list open at a time */
  const drop = (l) => {
    openList = l;
    for (const b of box.querySelectorAll(".cdrop"))
      b.setAttribute("aria-expanded", b.dataset.l === l);
    for (const d of box.querySelectorAll(".clist"))
      d.hidden = d.dataset.l !== l;
  };
  if (openList && box.querySelector(`.clist[data-l="${openList}"]`))
    drop(openList);
  box.querySelector(".cdrops").onclick = (e) => {
    const b = e.target.closest(".cdrop");
    if (b) drop(openList === b.dataset.l ? "" : b.dataset.l);
  };
  for (const d of box.querySelectorAll(".clist"))
    d.onclick = (e) => {
      const b = e.target.closest(".sw, .cmetal");
      if (!b || b.getAttribute("aria-disabled") === "true") return;
      if (b.dataset.c) return set(b.dataset.c, "skin");
      mark("");
      b.setAttribute("aria-pressed", "true");
      onPick("m:" + b.dataset.m, "metal");
    };
  box.querySelector(".swatches").onclick = (e) => {
    const b = e.target.closest(".sw");
    if (!b) return;
    if (b.classList.contains("brush")) {
      inv.hidden = !inv.hidden;
      b.setAttribute("aria-expanded", !inv.hidden);
      if (!inv.hidden) hex.focus();
      return;
    }
    set(b.dataset.c);
  };
  picker.oninput = () => set(picker.value);
  hex.oninput = () => {
    const c = normHex(hex.value);
    hex.classList.toggle("bad", !c && hex.value.length > 0);
    if (c) set(c);
  };
  inv.querySelector(".info").onclick = () => {
    const t = inv.querySelector(".info-text");
    t.hidden = !t.hidden;
  };
  if (value && !swatches.includes(value) && !SKIN_TONES.includes(value)) {
    inv.hidden = false;
    box.querySelector(".brush").setAttribute("aria-expanded", "true");
  }
  return box;
}
