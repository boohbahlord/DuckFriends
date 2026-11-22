/* ---------- Sandbox: loot orbs (stage 4b), on the screen ----------
   The rules are sbloot.js. Here: an orb as it lies on its point (Dead Ducks Arcade's orb, in its kind's color, or the
   picture it was given), and the orb's part of its settings window (sbspawnview.js sbSettings): what it holds, "a
   dropdown menu with drop down arrows PER category of loot", its numbers, how it looks, and a picture of 2 MB at most */
import { esc, toast, openWindow } from "./ui.js";
import {
  SB_LOOT,
  SB_LOOT_STARTS,
  SB_LOOT_SHOWS,
  SB_DROPS,
  SB_GEAR,
  SB_FLAGS,
  SB_BOXES,
  SB_ITEM,
  baseMode,
  sbCan,
} from "./sandboxrules.js";
import { boxText } from "./sbspawn.js";
import { lootOk, ammoOf, sbOrbFor } from "./sbloot.js";
import { activity } from "./hangout/registry.js";
import { LOOT, lootOf } from "./sbhotview.js";
import { fullAmmo, weaponName } from "./l4ddrules.js";
import { ARMS } from "./guns.js";
import { orbHTML, weaponIcon, ICONS } from "./l4ddart.js";
import { DROP_ICONS } from "./l4dddrops.js";
import { specialById } from "./specials.js";
import { picFrom, sendParts } from "./sbmake.js";
import { coolFor } from "./rules.js";

/* on a world (Duck Cabin, Dead Ducks Arcade's maps): the E button over an orb I may take (sbloot.js sbOrbFor; the
   owner's, Nov 21 18:27Z: "You only pick them up by clicking E / Same for any loot on the ground now") */
activity({
  id: "sbloot",
  only: "sandbox",
  near(pos, ctx) {
    const o = sbOrbFor(ctx.state(), ctx.me);
    return (
      o && {
        label: `Take the ${nameOf(o.w)}`,
        d: 0,
        act: () => ctx.send({ t: "sbl", do: "take" }),
      }
    );
  },
});
export const nameOf = (w) =>
  (ammoOf(w) && `${nameOf(ammoOf(w))} ammo`) ||
  (SB_DROPS[w] && SB_DROPS[w][1]) ||
  SB_GEAR[w] ||
  (specialById(w) || {}).name ||
  (weaponName(w) !== w && weaponName(w)) || // (the zombie maps' own names: "Buckshot double barrel", not "Dbuck")
  w[0].toUpperCase() + w.slice(1);
/* the categories an orb can pick from here: the Customize groups on the board and Duck Cabin; the weapons and the
   zombies' drops on Dead Ducks Arcade's maps */
/* never in a loot list on the zombie maps: Survival's defibrillator (nobody dies for good in Sandbox), Safe Keeping (never
   used by hand) */
const NOT_LOOT = new Set(["defib", "safekeep"]);
export function lootCats(s) {
  const drops = Object.keys(SB_DROPS).filter((w) => lootOk(s, w)),
    cats = drops.length
      ? [
          [
            "Weapons",
            Object.keys(ARMS).filter((w) => !NOT_LOOT.has(w) && lootOk(s, w)),
          ],
          [
            "Ammo and magazines",
            Object.keys(ARMS)
              .map((w) => w + "ammo")
              .filter((w) => lootOk(s, w)),
          ],
          ["Zombie drops", drops],
          ["Gear", Object.keys(SB_GEAR).filter((w) => lootOk(s, w))],
        ]
      : LOOT.map(([k, n]) => [n, lootOf(k).map((x) => x.id)]);
  /* plan, Loot 2: "plus one \"All items\" list": every list's together, ticked as they are in theirs */
  return [...cats, ["All items", [...new Set(cats.flatMap(([, ws]) => ws))]]];
}
/* an orb's own picture (a data URL), or "" */
const picOf = (s, id) => ((s.sbpic || {})[(s.sbImg || {})[id]] || {}).d || "";
/* an orb's face: its picture, or what it looks like (its own thing, or the one in "Looks like") in an orb of its color */
/* item w's own picture (its hotbar key's, or the gun as it's drawn), with no orb around it */
export function pictureOf(w) {
  if (w === "flashlight") return ICONS.flashlight(true);
  if (ammoOf(w)) return DROP_ICONS.ammo || "";
  if (SB_DROPS[w]) return DROP_ICONS[SB_DROPS[w][0]] || "";
  const sp = specialById(w);
  return weaponIcon(w) || (sp && sp.icon) || "";
}
/* orb o of loot block id (point p) as it lies, whole: its face, its Size and how see-through (plan Loot 4) */
export function orbWrap(s, id, p, o) {
  const sz = Math.max(25, Math.min(400, +boxText(p, "lsize") || 100)) / 100,
    op = Math.max(0, Math.min(95, +boxText(p, "lop") || 0));
  return `<span class="sb-orb" style="--sz:${sz};opacity:${(1 - op / 100).toFixed(2)}">${orbFace(s, id, p, o)}</span>`;
}
export function orbFace(s, id, p, o = p.orb) {
  const img = picOf(s, id);
  if (img)
    return `<span class="l4orb k-special sb-orb-img"><i><img src="${esc(img)}" alt=""></i></span>`;
  const look = boxText(p, "look"),
    w =
      look &&
      (specialById(look) ||
        ARMS[look] ||
        SB_DROPS[look] ||
        SB_GEAR[look] ||
        ammoOf(look))
        ? look
        : o.w;
  const show = boxText(p, "lshow");
  if (show === "hand")
    return `<span class="sb-orb-bare"><i>${pictureOf(w)}</i></span>`; // (as it's drawn in a hand: no orb)
  if (show === "hotbar")
    return `<span class="sb-orb-key"><i>${pictureOf(w)}</i></span>`; // (its hotbar key's picture)
  if (w === "flashlight")
    return `<span class="l4orb k-grenade"><i>${ICONS.flashlight(true)}</i></span>`;
  if (ammoOf(w))
    return `<span class="l4orb k-ranged"><i>${DROP_ICONS.ammo || ""}</i></span>`; // (a gun's ammo: the ammo box, in the guns' color)
  return SB_DROPS[w]
    ? `<span class="l4orb k-grenade"><i>${DROP_ICONS[SB_DROPS[w][0]] || ""}</i></span>`
    : orbHTML(w);
}
/* the mark of a loot point: a dashed ring in its color, under its orb */
/* a loot spot's mark (plan Phase 2: "Orbs get their own spawn mark: an empty diamond with a small diamond in its
   middle"), made as pixels from the start (the owner's, Nov 19 23:41Z: "You do the pixels first"): 16 by 16, a pixel at
   (i, j) by its distance |dx| + |dy| from the middle; a white edge outside its color so it reads on any floor */
const DIAMONDS = new Map();
export function lootRing(c) {
  let u = DIAMONDS.get(c);
  if (!u) {
    const n = 16,
      cv = document.createElement("canvas");
    cv.width = cv.height = n;
    const g = cv.getContext("2d");
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const d = Math.abs(i - 7.5) + Math.abs(j - 7.5),
          fill =
            d > 6.5 && d <= 7.5
              ? "rgba(255,255,255,0.6)"
              : d > 5.5 && d <= 6.5
                ? c
                : d > 2 && d <= 3
                  ? "rgba(255,255,255,0.6)"
                  : d <= 2
                    ? c
                    : "";
        if (!fill) continue;
        g.fillStyle = fill;
        g.fillRect(i, j, 1, 1);
      }
    DIAMONDS.set(c, (u = cv.toDataURL()));
  }
  return `<img class="px sb-pxmark" src="${u}" alt="" aria-hidden="true" draggable="false">`;
}

/* ---------- the settings window's part ----------
   h: sbSettings' own makers { row, flagRow, typed, why, colorRow, sect (a numbered heading), act (a who list) } */
export function lootPage(s, id, p, h) {
  const picked = boxText(p, "loot")
      .toLowerCase()
      .split(/[\s,]+/),
    look = boxText(p, "look"),
    img = picOf(s, id),
    cats = lootCats(s),
    drops = cats.some(([, ws]) => ws.some((w) => SB_DROPS[w])), // (Dead Ducks Arcade's maps: unlimited ammo too, where guns keep ammo; a weapon there stays, as one bought does)
    icon = pictureOf,
    drop = ([n, ws], i, all) => {
      const on = ws.filter((w) => picked.includes(w));
      return `<div class="sb-row"><span>${esc(n)}</span><details class="sb-acts" data-lcat><summary>${esc(on.map(nameOf).join(", ") || "Nothing")}</summary><span class="sb-what sb-lootpick">${ws
        .map(
          (w) =>
            `<label><input type="checkbox" value="${w}" data-label="${esc(nameOf(w))}"${picked.includes(w) ? " checked" : ""}><i class="sb-lic">${icon(w)}</i>${esc(nameOf(w))}</label>`,
        )
        .join("")}</span></details></div>${
        i < all.length - 1 // (each item's numbers under its own kind's list, never twice under All items: plan Loot 3)
          ? ws
              .map((w) => itemRows(w, picked.includes(w), icon, p, h, drops))
              .join("")
          : ""
      }`;
    };
  const tip = (t) => `<p class="sb-tip sb-rowtip">${esc(t)}</p>`,
    flag = (f, b, t) =>
      h.flagRow(f, b, h.typed(f), h.why(f)) + (t ? tip(t) : ""),
    num = (f, b, t) => h.row(f, b, h.typed(f), h.why(f)) + (t ? tip(t) : ""),
    when = boxText(p, "lst");
  return `${h.row("name", { name: "Variable name" }, h.typed("name"), h.why("name"))}
    ${h.colorRow}
    ${h.flagRow("hide", SB_FLAGS.hide, h.typed("hide"), h.why("hide"))}
    ${h.sect("Spawning")}
    <div class="sb-row" data-row="lst"><span>${esc(SB_LOOT.lst.name)}</span><select class="sb-sel" data-lst>${Object.entries(
      SB_LOOT_STARTS,
    )
      .map(
        ([v, n]) =>
          `<option value="${v}"${when === v ? " selected" : ""}>${esc(n)}</option>`,
      )
      .join("")}</select></div>
    ${tip("When the first one comes: at the start, when a player steps into its zone, or when something spawns there.")}
    ${flag("back", SB_LOOT.back, "A new one comes after one is taken.")}
    ${num("again", SB_LOOT.again)}
    ${flag("cont", SB_FLAGS.cont, "A new one every few seconds, taken or not.")}
    ${num("every", SB_BOXES.every)}
    ${num("limit", { name: "Spawn limit (0: none)" }, "The most lying on the map at once.")}
    ${num("llim", SB_LOOT.llim, "The most it lays in the whole game. G has one for the whole map.")}
    ${h.act("ltake")}
    ${flag("lown", SB_LOOT.lown, "Off: the first to reach it takes it.")}
    ${h.sect("What it holds")}
    ${cats.map(drop).join("")}
    <p class="sb-none" data-row="loot">${noteOf(picked.filter((w) => lootOk(s, w)).length, boxText(p, "lall"))}</p>
    ${flag("lall", SB_LOOT.lall, "Off: one of them at random each time, all as likely.")}
    ${h.sect("When it's taken")}
    ${(drops ? ["hurt"] : ["keep", "hurt"]).map((f) => num(f, SB_LOOT[f])).join("")}
    ${drops ? flag("inf", SB_LOOT.inf) : ""}
    ${h.sect("How it looks")}
    <div class="sb-row" data-row="lshow"><span>${esc(SB_LOOT.lshow.name)}</span><select class="sb-sel" data-lshow>${Object.entries(
      SB_LOOT_SHOWS,
    )
      .map(
        ([v, n]) =>
          `<option value="${v}"${boxText(p, "lshow") === v ? " selected" : ""}>${esc(n)}</option>`,
      )
      .join("")}</select></div>
    ${num("lsize", SB_LOOT.lsize)}
    ${num("lop", SB_LOOT.lop, "0 is solid.")}
    <div class="sb-row"><span>Looks like</span><select class="sb-sel" data-lsel><option value="">Itself</option>${cats
      .slice(0, -1)
      .map(
        ([n, ws]) =>
          `<optgroup label="${esc(n)}">${ws.map((w) => `<option value="${w}"${look === w ? " selected" : ""}>${esc(nameOf(w))}</option>`).join("")}</optgroup>`,
      )
      .join("")}</select></div>
    <div class="sb-row"><span>Picture</span><span class="sb-pic">${img ? `<img src="${esc(img)}" alt=""><button type="button" class="btn ghost small" data-noimg>Remove</button>` : ""}<label class="btn ghost small">${img ? "Change" : "Upload"}<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden data-img></label></span></div>
    <p class="small dim sb-up-note">2 MB at most. Made into pixels.</p>`;
}
/* ---------- each picked item's numbers (plan Loot 3: "These rows sit under the item's own dropdown") ----------
   Only the rows that mean something for it; a blank box is the item's own (shown greyed in it) */
const ARM_ROWS = {
  melee: ["dmg", "cd", "brk"],
  ranged: ["dmg", "ammo", "inf", "rl", "cd", "brk"],
  grenade: ["n"],
  special: ["n", "cd", "brk"],
};
export function rowsFor(w, zm) {
  if (!zm) return ["n", "cd", "brk"]; // (the board and Duck Cabin: its uses, its wait, and whether it breaks when used up)
  if (ammoOf(w)) return ["n"];
  const A = ARMS[w];
  if (!A) return []; // (a zombie drop, the flashlight)
  return (ARM_ROWS[A.kind] || [])
    .filter((k) => k !== "dmg" || (A.dmg != null && A.dmg !== "all"))
    .filter((k) => k !== "rl" || A.mag)
    .filter((k) => (k !== "n" && k !== "brk") || A.kind !== "special" || A.all)
    .map((k) => (k === "cd" && A.auto ? "sps" : k)); // (a gun that fires while held: shots per second)
}
/* what a blank box means for item w: its own number */
export function ownOf(w, k, zm) {
  if (!zm)
    return k === "n"
      ? "no limit"
      : k === "cd"
        ? String(+(coolFor(w) / 1000).toFixed(2))
        : "";
  const A = ARMS[w] || {};
  if (k === "dmg")
    return Array.isArray(A.dmg) ? `${A.dmg[0]} to ${A.dmg[1]}` : String(A.dmg);
  if (k === "ammo") return "100%";
  if (k === "n") return ammoOf(w) ? "1" : String(A.all || ARMS.grenade.most);
  if (k === "cd") return String(+((A.cool || 0) / 1000).toFixed(2));
  if (k === "sps") return String(+(1000 / (A.cool || 1000)).toFixed(1));
  return "";
}
/* is true/false row k on for item w when nobody set it: Unlimited ammo for the laser and the bow, Reload on */
const flagOwn = (w, k) =>
  k === "inf" ? !fullAmmo(w) : k === "rl" ? true : false;
export const ownFlag = (w, k, zm) => (zm && flagOwn(w, k) ? "true" : "false");
/* a switch with three states (plan Loot 5: "every switch has true, false and neutral"): neutral (blank) steps aside
   for the next level down, here the item's own (own: what that is). Its box carries "", t or f; data-tri cycles it */
export function triRow(f, name, v, own, attr = "") {
  const lab = v === "t" ? "true" : v === "f" ? "false" : "default"; // ("true, false, default": the owner's, Nov 20 17:25Z; it was "neutral")
  return `<div class="sb-row" data-row="${f}"><span>${esc(name)}</span><button type="button" class="sb-tog sb-tri${v === "t" ? " on" : v ? "" : " mid"}" data-tri="${f}" data-own="${esc(own)}" title="Default: ${esc(own)}"${attr}>${lab}</button><input type="hidden" class="sb-box" data-f="${f}" value="${esc(v)}"><em class="sb-why"></em></div>`;
}
/* the next state of a three-state switch: default, true, false, default … */
export function triNext(btn) {
  const box = btn.parentElement.querySelector("input"),
    v = box.value === "" ? "t" : box.value === "t" ? "f" : "";
  box.value = v;
  btn.classList.toggle("on", v === "t");
  btn.classList.toggle("mid", v === "");
  btn.textContent = v === "t" ? "true" : v === "f" ? "false" : "default";
  return v;
}
function itemRows(w, on, icon, p, h, zm) {
  const rows = rowsFor(w, zm);
  if (!rows.length) return "";
  const out = rows.map((k) => {
    const f = `i_${w}_${k}`,
      b = SB_ITEM[k],
      t = h.typed(f),
      name = k === "n" && ammoOf(w) ? "Magazines you get" : b.name;
    if (b.kind === "bool")
      return triRow(f, name, String(t).trim(), ownFlag(w, k, zm));
    const why = h.why(f);
    return `<label class="sb-row${why ? " bad" : ""}" data-row="${f}"><span>${esc(name)}</span><input class="sb-box" data-f="${f}" value="${esc(t)}" placeholder="${esc(ownOf(w, k, zm))}" maxlength="12" spellcheck="false" autocomplete="off"><em class="sb-why">${esc(why)}</em></label>`;
  });
  return `<div class="sb-item" data-item="${w}"${on ? "" : " hidden"}><p class="sb-item-h"><i class="sb-lic">${icon(w)}</i>${esc(nameOf(w))}</p>${out.join("")}</div>`;
}
/* the line under the lists: how many are ticked, and what that does */
const noteOf = (n, all) =>
  n > 1
    ? /^t/i.test(String(all).trim())
      ? "All of these at once each time."
      : "One of these at random each time."
    : n
      ? ""
      : "Nothing comes until you pick something.";
/* its listeners: send({ k, f, v }) sends Sandbox's "sb" action for this point; getR: () => the room */
export function lootWire(w, id, send, getR) {
  w.addEventListener("change", async (e) => {
    const t = e.target;
    const cat = t.closest("[data-lcat]");
    if (cat) {
      /* its numbers show while it's ticked */
      for (const b of w.querySelectorAll(`.sb-item[data-item="${t.value}"]`))
        b.hidden = !t.checked;
      /* the same thing in another list (All items, or its own kind's) ticks with it */
      for (const c of w.querySelectorAll(
        `.sb-lootpick input[value="${t.value}"]`,
      ))
        c.checked = t.checked;
      for (const d of w.querySelectorAll("[data-lcat]"))
        d.querySelector("summary").textContent =
          [...d.querySelectorAll("input:checked")]
            .map((c) => c.dataset.label)
            .join(", ") || "Nothing";
      const all = [
        ...new Set(
          [...w.querySelectorAll(".sb-lootpick input:checked")].map(
            (c) => c.value,
          ),
        ),
      ];
      const note = w.querySelector('[data-row="loot"]');
      if (note)
        note.textContent = noteOf(
          all.length,
          w.querySelector('[data-f="lall"]')?.value || "f",
        );
      send({ k: "set", f: "loot", v: all.join(", ") });
      return;
    }
    if (t.matches("[data-lshow]"))
      return send({ k: "set", f: "lshow", v: t.value });
    if (t.matches("[data-lst]"))
      return send({ k: "set", f: "lst", v: t.value });
    if (t.matches("[data-lsel]"))
      return send({ k: "set", f: "look", v: t.value });
    if (t.matches("[data-img]")) {
      const f = t.files && t.files[0];
      t.value = ""; // (the same file can be picked again)
      if (!f) return;
      try {
        const pic = await picFrom(f), // (as a made NPC's: 2 MB, cropped, made into pixels)
          r = getR();
        if (!r || !pic) return;
        r.send({ t: "sbl", k: "img", p: id, v: sendParts(r, pic) });
        picShow(w, pic.d);
      } catch (err) {
        toast(err.message);
      }
    }
  });
  w.addEventListener("click", (e) => {
    const tri = e.target.closest("[data-tri]");
    if (tri) {
      triNext(tri);
      return tri.parentElement
        .querySelector("input")
        .dispatchEvent(new Event("input", { bubbles: true })); // (sent as a typed box is)
    }
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

/* ---------- G: Weapons and items (plan, Loot 5) ----------
   "G: has the same rows for every weapon and item, and \"Breaks when empty\" can be set for all items or for one. Any
   row set there rules every copy of that item in the game. For example, the AK-47 can fire faster or slower
   everywhere." Its own window (the owner's, Nov 20 04:46Z: a G setting with many options opens its own window). Pick an
   item; its rows are the loot's (blank: the next level down decides: groups, then loot, then the player's) */
export function itemsWin(R) {
  if (document.querySelector(".sb-itemswin")) return;
  const s0 = R.state,
    zm = baseMode(s0.options) === "l4dd",
    cats = lootCats(s0).slice(0, -1), // (each kind's list, without All items)
    all = cats.flatMap(([, ws]) => ws).filter((w) => rowsFor(w, zm).length);
  let pick = all[0] || "";
  const it = () => (R.state.sb && R.state.sb.it) || {},
    may = () => sbCan(R.state, R.me),
    rowsHTML = (w) =>
      rowsFor(w, zm)
        .map((k) => {
          const f = `${w}_${k}`,
            b = SB_ITEM[k],
            v = it()[f] || "",
            name = k === "n" && ammoOf(w) ? "Magazines you get" : b.name;
          if (b.kind === "bool")
            return triRow(
              f,
              name,
              v,
              ownFlag(w, k, zm),
              may() ? "" : " disabled",
            );
          return `<label class="sb-row" data-row="${f}"><span>${esc(name)}</span><input class="sb-box" data-it="${f}" value="${esc(v)}" placeholder="${esc(ownOf(w, k, zm))}" maxlength="12" spellcheck="false" autocomplete="off"${may() ? "" : " disabled"}><em class="sb-why"></em></label>`;
        })
        .join(""),
    draw = (w) => {
      w.querySelector(".sb-itrows").innerHTML = pick
        ? `<p class="sb-item-h"><i class="sb-lic">${pictureOf(pick)}</i>${esc(nameOf(pick))}</p>${rowsHTML(pick)}`
        : "";
      const a = w.querySelector('[data-row="all_brk"]');
      if (a)
        a.outerHTML = triRow(
          "all_brk",
          "Every item: breaks when empty",
          it().all_brk || "",
          "each item's own",
          may() ? "" : " disabled",
        );
    };
  return openWindow(
    `<h2>Weapons and items</h2><p class="small dim">Set here, a row rules every copy of the item in this Sandbox, over its loot's. Blank or default: the loot (or the item's own) decides.</p><div class="sb-set">${triRow("all_brk", "Every item: breaks when empty", "", "each item's own")}<div class="sb-row"><span>Item</span><select class="sb-sel" data-itpick>${cats
      .map(
        ([n, ws]) =>
          `<optgroup label="${esc(n)}">${ws
            .filter((w) => all.includes(w))
            .map(
              (w) =>
                `<option value="${w}"${w === pick ? " selected" : ""}>${esc(nameOf(w))}</option>`,
            )
            .join("")}</optgroup>`,
      )
      .join("")}</select></div><div class="sb-item sb-itrows"></div></div>`,
    {
      cls: "win-small sb-win sb-itemswin",
      onOpen(w) {
        draw(w);
        const send = (f, v) => R.send({ t: "sbr", k: "it", f, v });
        w.addEventListener("change", (e) => {
          const t = e.target;
          if (t.matches("[data-itpick]")) {
            pick = t.value;
            draw(w);
          }
        });
        const timers = {};
        w.addEventListener("input", (e) => {
          const i = e.target.closest("input[data-it]");
          if (!i) return;
          const f = i.dataset.it,
            b = SB_ITEM[f.split("_").pop()],
            v = i.value.trim(),
            bad =
              v && b.check
                ? b.check(v)
                : v && !/^\d+(\.\d)?$/.test(v)
                  ? "A number"
                  : "";
          i.closest(".sb-row").classList.toggle("bad", !!bad);
          i.closest(".sb-row").querySelector(".sb-why").textContent = bad;
          clearTimeout(timers[f]);
          if (!bad) timers[f] = setTimeout(() => send(f, v), 300);
        });
        w.addEventListener("click", (e) => {
          const tri = e.target.closest("[data-tri]");
          if (!tri || tri.disabled) return;
          send(tri.dataset.tri, triNext(tri));
        });
      },
    },
  );
}
