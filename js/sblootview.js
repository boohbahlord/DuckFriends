/* ---------- Sandbox: loot orbs (stage 4b), on the screen ----------
   The rules are sbloot.js. Here: an orb as it lies on its point (Dead Ducks Arcade's orb, in its kind's color, or the
   picture it was given), and the orb's part of its settings window (sbspawnview.js sbSettings): what it holds, "a
   dropdown menu with drop down arrows PER category of loot", its numbers, how it looks, and a picture of 2 MB at most */
import { esc, toast } from "./ui.js";
import { SB_LOOT, SB_DROPS, SB_GEAR, SB_FLAGS } from "./sandboxrules.js";
import { boxText } from "./sbspawn.js";
import { lootOk } from "./sbloot.js";
import { LOOT, lootOf } from "./sbhotview.js";
import { ARMS } from "./l4ddrules.js";
import { orbHTML, weaponIcon, ICONS } from "./l4ddart.js";
import { DROP_ICONS } from "./l4dddrops.js";
import { specialById } from "./specials.js";
import { picFrom, sendParts } from "./sbmake.js";

const nameOf = (w) =>
  (SB_DROPS[w] && SB_DROPS[w][1]) ||
  SB_GEAR[w] ||
  (specialById(w) || {}).name ||
  w[0].toUpperCase() + w.slice(1);
/* the categories an orb can pick from here: the Customize groups on the board and Duck Cabin; the weapons and the
   zombies' drops on Dead Ducks Arcade's maps */
export function lootCats(s) {
  const drops = Object.keys(SB_DROPS).filter((w) => lootOk(s, w));
  if (drops.length)
    return [
      [
        "Weapons",
        Object.keys(ARMS).filter((w) => w !== "defib" && lootOk(s, w)), // (Survival's alone: nobody dies for good in Sandbox)
      ],
      ["Zombie drops", drops],
      ["Gear", Object.keys(SB_GEAR).filter((w) => lootOk(s, w))],
    ];
  return LOOT.map(([k, n]) => [n, lootOf(k).map((x) => x.id)]);
}
/* an orb's own picture (a data URL), or "" */
const picOf = (s, id) => ((s.sbpic || {})[(s.sbImg || {})[id]] || {}).d || "";
/* an orb's face: its picture, or what it looks like (its own thing, or the one in "Looks like") in an orb of its color */
export function orbFace(s, id, p) {
  const img = picOf(s, id);
  if (img)
    return `<span class="l4orb k-special sb-orb-img"><i><img src="${esc(img)}" alt=""></i></span>`;
  const look = boxText(p, "look"),
    w =
      look &&
      (specialById(look) || ARMS[look] || SB_DROPS[look] || SB_GEAR[look])
        ? look
        : p.orb.w;
  if (w === "flashlight")
    return `<span class="l4orb k-grenade"><i>${ICONS.flashlight(true)}</i></span>`;
  return SB_DROPS[w]
    ? `<span class="l4orb k-grenade"><i>${DROP_ICONS[SB_DROPS[w][0]] || ""}</i></span>`
    : orbHTML(w);
}
/* the mark of a loot point: a dashed ring in its color, under its orb */
export const lootRing = (c) =>
  `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="10" stroke-dasharray="14 10"/><circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-opacity="0.8" stroke-width="5" stroke-dasharray="14 10"/></svg>`;

/* ---------- the settings window's part ----------
   h: sbSettings' own makers { row, flagRow, typed, why, colorRow } */
export function lootPage(s, id, p, h) {
  const picked = boxText(p, "loot")
      .toLowerCase()
      .split(/[\s,]+/),
    look = boxText(p, "look"),
    img = picOf(s, id),
    cats = lootCats(s),
    drops = cats.some(([, ws]) => ws.some((w) => SB_DROPS[w])), // (Dead Ducks Arcade's maps: unlimited ammo too, where guns keep ammo; a weapon there stays, as one bought does)
    icon = (w) =>
      w === "flashlight"
        ? ICONS.flashlight(true)
        : SB_DROPS[w]
          ? DROP_ICONS[SB_DROPS[w][0]] || ""
          : weaponIcon(w) || "",
    drop = ([n, ws]) => {
      const on = ws.filter((w) => picked.includes(w));
      return `<div class="sb-row"><span>${esc(n)}</span><details class="sb-acts" data-lcat><summary>${esc(on.map(nameOf).join(", ") || "Nothing")}</summary><span class="sb-what sb-lootpick">${ws
        .map(
          (w) =>
            `<label><input type="checkbox" value="${w}" data-label="${esc(nameOf(w))}"${picked.includes(w) ? " checked" : ""}><i class="sb-lic">${icon(w)}</i>${esc(nameOf(w))}</label>`,
        )
        .join("")}</span></details></div>`;
    };
  return `${h.row("name", { name: "Variable name" }, h.typed("name"), h.why("name"))}
    ${h.colorRow}
    ${h.flagRow("hide", SB_FLAGS.hide, h.typed("hide"), h.why("hide"))}
    ${cats.map(drop).join("")}
    <p class="sb-none" data-row="loot">${picked.filter((w) => lootOk(s, w)).length > 1 ? "One of these at random each time." : picked.some((w) => lootOk(s, w)) ? "" : "Pick at least one."}</p>
    ${(drops ? ["again", "hurt"] : ["again", "keep", "hurt"]).map((f) => h.row(f, SB_LOOT[f], h.typed(f), h.why(f))).join("")}
    ${(drops ? ["back", "inf"] : ["back"]).map((f) => h.flagRow(f, SB_LOOT[f], h.typed(f), h.why(f))).join("")}
    <div class="sb-row"><span>Looks like</span><select class="sb-sel" data-lsel><option value="">Itself</option>${cats
      .map(
        ([n, ws]) =>
          `<optgroup label="${esc(n)}">${ws.map((w) => `<option value="${w}"${look === w ? " selected" : ""}>${esc(nameOf(w))}</option>`).join("")}</optgroup>`,
      )
      .join("")}</select></div>
    <div class="sb-row"><span>Picture</span><span class="sb-pic">${img ? `<img src="${esc(img)}" alt=""><button type="button" class="btn ghost small" data-noimg>Remove</button>` : ""}<label class="btn ghost small">${img ? "Change" : "Upload"}<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden data-img></label><label><input type="checkbox" data-lsquash> Compress (pixel look)</label></span></div>
    <p class="small dim sb-up-note">2 MB at most. Kept as it is unless Compress is ticked.</p>`;
}
/* its listeners: send({ k, f, v }) sends Sandbox's "sb" action for this point; getR: () => the room */
export function lootWire(w, id, send, getR) {
  w.addEventListener("change", async (e) => {
    const t = e.target;
    const cat = t.closest("[data-lcat]");
    if (cat) {
      const on = [...cat.querySelectorAll("input:checked")];
      cat.querySelector("summary").textContent =
        on.map((c) => c.dataset.label).join(", ") || "Nothing";
      const all = [...w.querySelectorAll(".sb-lootpick input:checked")].map(
        (c) => c.value,
      );
      const note = w.querySelector('[data-row="loot"]');
      if (note)
        note.textContent =
          all.length > 1
            ? "One of these at random each time."
            : all.length
              ? ""
              : "Pick at least one.";
      if (all.length) send({ k: "set", f: "loot", v: all.join(", ") });
      return;
    }
    if (t.matches("[data-lsel]"))
      return send({ k: "set", f: "look", v: t.value });
    if (t.matches("[data-img]")) {
      const f = t.files && t.files[0];
      if (!f) return;
      try {
        const pic = await picFrom(
            f,
            !!w.querySelector("[data-lsquash]:checked"),
          ), // (as a made NPC's: 2 MB, kept as it is unless Compress is ticked)
          r = getR();
        if (!r) return;
        r.send({ t: "sbl", k: "img", p: id, v: sendParts(r, pic) });
        picShow(w, pic.d);
      } catch (err) {
        toast(err.message);
      }
    }
  });
  w.addEventListener("click", (e) => {
    if (!e.target.closest("[data-noimg]")) return;
    const r = getR();
    if (r) r.send({ t: "sbl", k: "img", p: id, v: "" });
    picShow(w, "");
  });
}
function picShow(w, v) {
  const box = w.querySelector(".sb-pic");
  if (!box) return;
  box.querySelector("img")?.remove();
  box.querySelector("[data-noimg]")?.remove();
  if (v)
    box.insertAdjacentHTML(
      "afterbegin",
      `<img src="${esc(v)}" alt=""><button type="button" class="btn ghost small" data-noimg>Remove</button>`,
    );
  const lab = box.querySelector("label");
  if (lab && lab.firstChild)
    lab.firstChild.textContent = v ? "Change" : "Upload";
}
