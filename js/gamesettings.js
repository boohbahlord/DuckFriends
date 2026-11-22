/* ---------- Game Settings: the whole screen, like Customize ----------
   On the left, plain rows in three pages: Game mode, Map, then Game Options; the back arrow goes up a page, the X closes.
   On the right, a preview of the row under the pointer: the game on the picked map, the map large with the game's board
   on it (Duck Cabin as the real map, one picture of all of it), or a setting's description. The host (or sudo) picks;
   everyone else looks. With Vote Mode & Map on, the game and the map are voted on in their own windows as the game
   starts (vote.js). */
import { SB_WORLDS, SB_WORLD_NAMES } from "./sandboxrules.js";
import { esc, openWindow, setHTML } from "./ui.js";

import { modesFor, modeOf, modeName, CABIN_MODES, CATS } from "./modes.js";

import { modesNow, loadModes } from "./gmodes.js";

import {
  MAPS,
  MAP_VARIANTS,
  isWorldMap,
  mapName,
  mapForm,
  umapOf,
} from "./maps.js";

import { isUmap, umapIds } from "./umaprules.js";

import { bringMaps, myMaps } from "./umaps.js";

import { OPTIONS_DEFAULT, GEN_RULES, ruleFor } from "./rules.js";
import { isSudo, dodOn } from "./roomrules.js";

import { profile, save } from "./store.js";

import { BY_MODE, CAT_NAMES, GEN_SWITCH, HOST } from "./gssettings.js";

import {
  CABIN_TIP,
  GREY,
  PICK_TEXT,
  VOTE_SETS,
  ZOOM,
  games,
  genFor,
  infoUnder,
  paintMenu,
  picked,
  showsCollage,
  showsZoom,
  valueOf,
  voting,
} from "./gstext.js";

import { gamePic, mapPic } from "./gspreview.js";

export { infoUnder, paintMenu, settingText } from "./gstext.js";

/* ---------- the screen ---------- */
const openFolds = new Set([
  "host:rules",
  "mode:rules",
  "cat:social",
  "cat:comp",
  "cat:special",
]); // (the categories left open, from one visit to the next)
/* the Modes in Random & Vote row's value: All, or how many are on */
const poolVal = (s) => {
  const all = modesFor(s),
    off = (s.options.modesOff || []).filter((id) =>
      all.some((m) => m.id === id),
    );
  return off.length ? `${all.length - off.length} of ${all.length}` : "All";
};
/* ---------- save slots (owner 2026-11-15): 5 per player, kept on this device with the profile ----------
   Save copies every Game Setting of the room; Load sends them back, and only in the lobby (never mid-game) */
const SLOTS = 5;
const slots = () =>
  Array.from({ length: SLOTS }, (_, n) => {
    const x = (profile.saves || [])[n];
    return x && x.options ? x : null;
  });
const when = (t) =>
  new Date(t).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
export function openGameSettings(R, start = null) {
  let page = start, // null (the three pages) | mode | cat:<kind> | map | opts
    peek = null, // what the preview shows: { kind: mode | map | set | text, … }
    W = null,
    off = null;
  const S = () => R.state,
    host = () =>
      isSudo(S(), R.me) || (dodOn(S(), "settings") && !!S().players[R.me]); // (Democracy of Ducklings: everyone can)
  const head = (title) =>
    `<header class="arm-h">${page ? '<button type="button" class="arm-back" data-a="back" aria-label="Back">‹</button>' : '<span class="arm-mark">◆</span>'}<h2>${esc(title)}</h2></header>`;
  const row = (attrs, label, val = "", on = false, dis = false) =>
    `<li><button type="button" class="arm-row" ${attrs} aria-pressed="${on}"${dis ? ' aria-disabled="true"' : ""}><span>${esc(label)}</span><span class="val">${esc(val)}</span></button></li>`;
  const LINE = '<li class="arm-line" aria-hidden="true"></li>';
  /* Vote Mode & Map: under the line, above Game mode (owner 2026-11-16: Game Options, Modes in Random & Vote and Save
     slots on top, then a line, then Vote Mode & Map, Game mode and Map); its page has the On/Off row
     and, while it's on, each vote and Vote return */
  const voteVal = (s) =>
    s.options.modePick === "vote" && s.options.mapPick === "vote"
      ? "On"
      : s.options.modePick === "vote"
        ? "Game mode only"
        : s.options.mapPick === "vote"
          ? "Map only"
          : "Off";
  const modeVal = (s) =>
    s.options.modePick === "vote"
      ? "Vote Mode & Map"
      : s.options.modePick === "random"
        ? s.options.trueRandom
          ? "True Random"
          : "Random"
        : modeName(s);
  const mapVal = (s) =>
    s.options.mapPick === "vote"
      ? "Vote Mode & Map"
      : s.options.mapPick === "random"
        ? "Random"
        : mapName(s.options.map);

  /* Gore and Heavy effects: a "Low" chip by their name while my own Low graphics (Settings → Performance: Graphics Low,
     Data saving or Poor connection) lighten them on my screen, whatever the room picked (fx.js) */
  const lowChip = (k) =>
    (k === "noGore" || k === "noFx") &&
    document.documentElement.classList.contains("low")
      ? ` <span class="gs-low" data-tip="${esc(k === "noGore" ? "Your Low graphics: less blood on your screen, and it goes sooner." : "Your Low graphics: no smoke or screen shake on your screen, only a tiny muzzle flash.")}">Low</span>`
      : "";
  /* a setting as the old Game options showed it: its name over its choices. mr: the game mode whose Mode Rule this is
     (with Same as General first) */
  const tiles = (s, o, mr = "") => {
    const gen = GEN_RULES.includes(o.k),
      need = (k) => (mr ? ruleFor(s, mr, k) : valueOf(s, k)),
      faded =
        (o.need && !+need(o.need)) || // (it needs another setting on first: shown faded)
        (gen && !mr && +s.options.genOff), // (the General Rules are off)
      ro = host() && !faded ? "" : ' aria-disabled="true"',
      mine = mr && ((s.options.modeRules || {})[mr] || {}),
      cur = !mr ? valueOf(s, o.k) : o.k in mine ? mine[o.k] : "same",
      c = [
        ...(mr ? [["same", "Same as General"]] : []),
        ...(o.k === "downMs" && !modeOf(s.options.mode).cabinHome
          ? o.c.filter((x) => x[0] !== 6000)
          : o.c),
      ];
    return `<div class="sect gs-set${faded ? " faded" : ""}" data-d="${esc(o.k)}"${mr ? ` data-mr="${esc(mr)}"` : ""}><h3>${esc(o.n)}${lowChip(o.k)}</h3><div class="row">${c
      .map(
        ([v, n]) =>
          `<button type="button" class="tile" data-k="${o.k}" data-v="${v}"${mr ? ` data-mr="${esc(mr)}"` : ""} aria-pressed="${cur === v}"${ro}>${esc(n)}</button>`,
      )
      .join("")}</div></div>`;
  };
  /* a game mode's Mode Rules: the General Rules again, each Same as General until one is picked, and that one wins in
     this mode only */
  const modeRules = (s, g) => {
    const list = genFor(s, g),
      k = `mode:${g}:moderules`,
      n = Object.keys((s.options.modeRules || {})[g] || {}).length;
    return list.length
      ? `<details class="arm-fold gs-fold" data-fold="${esc(k)}"${openFolds.has(k) ? " open" : ""}><summary>Mode Rules${n ? ` <span class="small dim">(${n} set)</span>` : ""}</summary><p class="small dim gs-note">${esc(`These replace the General Rules in ${modeOf(g).name} only.`)}</p>${list.map((o) => tiles(s, o, g)).join("")}</details>`
      : "";
  };
  const room = (s) => {
    const dis = host() ? "" : " disabled";
    return `<div class="sect gs-set" data-d="max"><h3>Room</h3><div class="row"><label class="numfield">Players up to <select data-k="max"${dis}>${[
      2, 3, 4, 5, 6, 7, 8, 10, 12, 16,
    ]
      .filter((n) => n >= s.seat.length)
      .map((n) => `<option${n === s.max ? " selected" : ""}>${n}</option>`)
      .join("")}</select></label>${
      s.test
        ? `<label class="numfield">Computers <select data-k="computers"${dis}>${Array.from(
            { length: s.max },
            (_, n) => n,
          )
            .map(
              (n) =>
                `<option${n === s.seat.filter((id) => s.players[id].bot).length ? " selected" : ""}>${n}</option>`,
            )
            .join("")}</select></label>`
        : ""
    }</div></div>`;
  };
  /* the four categories under a heading; a category with nothing in it isn't shown */
  const folds = (s, list, pre, extra = {}) =>
    Object.entries(CAT_NAMES)
      .map(([cat, name]) => {
        const body =
          list
            .filter((o) => o.cat === cat)
            .map((o) => tiles(s, o))
            .join("") + (extra[cat] || "");
        const k = `${pre}:${cat}`;
        return body
          ? `<details class="arm-fold gs-fold" data-fold="${esc(k)}"${openFolds.has(k) ? " open" : ""}><summary>${name}</summary>${pre === "host" && cat === "rules" ? `<p class="small dim gs-note">These apply to all game modes.</p>${tiles(s, GEN_SWITCH)}` : ""}${body}</details>`
          : "";
      })
      .join("");

  function menuHTML() {
    const s = S(),
      o = s.options;
    if (!page)
      return (
        head("Game Settings") +
        `<div class="arm-body"><ul class="arm-list">${row('data-p="opts"', "Game Options", host() ? "Edit" : "View")}${row('data-p="pool"', "Modes in Random & Vote", poolVal(s))}${row('data-p="saves"', "Save slots", `${slots().filter(Boolean).length} of ${SLOTS}`)}${LINE}${row('data-p="vote"', "Vote Mode & Map", voteVal(s))}${row('data-p="mode"', "Game mode", modeVal(s))}${row('data-p="map"', "Map", mapVal(s))}</ul></div>`
      );
    if (page === "pool") {
      const off = o.modesOff || [],
        mid = !["lobby", "over", "countdown"].includes(s.phase);
      return (
        head("Modes in Random & Vote") +
        `<div class="arm-body"><ul class="arm-list">${modesFor(s)
          .map((m) =>
            row(
              `data-pool="${esc(m.id)}"`,
              m.name,
              off.includes(m.id) ? "Off" : "On",
              !off.includes(m.id),
              !host() || (mid && m.id === o.mode),
            ),
          )
          .join("")}</ul></div>`
      );
    }
    if (page === "saves") {
      const inLobby = s.phase === "lobby",
        list = slots();
      return (
        head("Save slots") +
        `<div class="arm-body"><ul class="arm-list gs-slots">${list
          .map(
            (x, n) =>
              `<li class="gs-slot"><span class="gs-slot-name">Slot ${n + 1}<span class="small dim">${x ? esc(`${modeOf(x.options.mode).name} · ${when(x.at)}`) : "Empty"}</span></span><button type="button" class="btn ghost small" data-a="save" data-n="${n}">Save</button><button type="button" class="btn ghost small" data-a="load" data-n="${n}"${x && inLobby && host() ? "" : " disabled"}>Load</button></li>${n ? "" : `<li class="gs-slot-note small dim">Save keeps these Game Settings on this device. Load works only in the lobby, before a game${host() ? "" : ", and only for the host (or sudo)"}.</li>`}`,
          )
          .join("")}</ul></div>`
      );
    }
    if (page === "vote")
      return (
        head("Vote Mode & Map") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="vote" data-v="vote"', "Vote Mode & Map", voting(s) ? "On" : "Off", voting(s), !host() || dodOn(s, "vote"))}</ul>${voting(s) ? VOTE_SETS.map((x) => tiles(s, x)).join("") : ""}</div>`
      );
    /* Game mode: each category (Social, Social Competitive, Special) is a heading with an arrow that folds its modes
       away; they start open, with their modes listed under them (owner, Nov 16 22:36Z) */
    if (page === "mode") {
      const dis = !host() || dodOn(s, "vote");
      return (
        head("Game mode") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="mode" data-v="random"', "Random", "", o.modePick === "random", dis)}${LINE}</ul>${CATS.filter(
          ([id]) => modesFor(s).some((m) => m.cat === id),
        )
          .map(
            ([id, name]) =>
              `<details class="arm-fold gs-fold gs-cat" data-fold="cat:${id}"${openFolds.has("cat:" + id) ? " open" : ""}><summary>${esc(name)}</summary><ul class="arm-list">${modesFor(
                s,
              )
                .filter((m) => m.cat === id)
                .map((m) =>
                  row(
                    `data-mode="${m.id}"`,
                    m.name,
                    "",
                    !o.modePick && o.mode === m.id && !o.gm,
                    dis,
                  ),
                )
                .join("")}</ul></details>`,
          )
          .join("")}${
          host() && modesNow().length
            ? `<details class="arm-fold gs-fold gs-cat" data-fold="cat:custom"${openFolds.has("cat:custom") ? " open" : ""}><summary>Custom</summary><ul class="arm-list">${modesNow()
                .map((m) =>
                  row(
                    `data-gm="${esc(m.id)}"`,
                    m.name,
                    "",
                    !o.modePick && o.mode === "sandbox" && o.gm === m.id,
                    dis,
                  ),
                )
                .join("")}</ul></details>`
            : ""
        }</div>`
      );
    }
    if (page.startsWith("cat:")) {
      const cat = page.slice(4),
        dis = !host() || dodOn(s, "vote");
      return (
        head(CATS.find((c) => c[0] === cat)[1]) +
        `<div class="arm-body"><ul class="arm-list">${modesFor(s)
          .filter((m) => m.cat === cat)
          .map((m) =>
            row(
              `data-mode="${m.id}"`,
              m.name,
              "",
              !o.modePick && o.mode === m.id,
              dis,
            ),
          )
          .join("")}</ul></div>`
      );
    }
    if (isWorldMap(page)) {
      const dis = !host() || dodOn(s, "vote");
      return (
        head("Duck Cabin") +
        `<div class="arm-body"><ul class="arm-list">${CABIN_MODES.map((id) =>
          row(
            `data-mode="${id}"`,
            modeOf(id).name,
            "",
            !o.modePick && o.mode === id,
            dis,
          ),
        ).join("")}</ul></div>`
      );
    }
    if (page === "map") {
      /* the maps aren't voted on here: Vote Mode & Map has its own window as the game starts; a map picked here is just
         played (Vote for map and Random go off) */
      const dis = !host() || dodOn(s, "vote");
      if (modeOf(o.mode).onlyMap)
        return (
          head("Map") +
          `<div class="arm-body"><ul class="arm-list">${row('data-map="surv"', modeOf(o.mode).onlyMap, "", true, true)}</ul></div>`
        ); // (Survival plays only Downpour: nothing else is offered, the owner's, Nov 20)
      return (
        head("Map") +
        `<div class="arm-body"><ul class="arm-list">${row('data-pick="map" data-v="random"', "Random", "", o.mapPick === "random", dis)}${
          o.mode === "sandbox"
            ? Object.keys(SB_WORLDS)
                .map((k) =>
                  row(
                    `data-sb="${k}"`,
                    SB_WORLD_NAMES[k],
                    "",
                    !o.mapPick && o.sbMap === k,
                    dis,
                  ),
                )
                .join("") // (Sandbox: the maps with a world of their own, walked whole: sandboxrules.js)
            : `${row('data-map="cabin"', "Duck Cabin", "", isWorldMap(o.map) && o.l4map !== "downpour", dis)}${row('data-map="downpour"', "Downpour", "", modeOf(o.mode).l4map && o.l4map === "downpour", dis)}`
        }${LINE}${MAPS.map(([id, name]) =>
          row(
            `data-map="${id}"`,
            name,
            "",
            !o.mapPick && picked(o) === id,
            dis,
          ),
        ).join("")}${LINE}${MAP_VARIANTS.map(([id, name]) =>
          row(
            `data-map="${id}"`,
            name,
            "",
            !o.mapPick && picked(o) === id,
            dis,
          ),
        ).join("")}${
          o.mode === "sandbox"
            ? ""
            : `${umapIds(s).length ? LINE : ""}${umapIds(s)
                .map((id) =>
                  row(
                    `data-map="${id}"`,
                    mapName(id),
                    "",
                    !o.mapPick && o.map === id,
                    dis,
                  ),
                )
                .join("")}` // (the maps the host made and brought in: umaps.js)
        }${host() ? `${LINE}${row("data-umaps", "My maps…")}` : ""}</ul>${showsCollage(s) ? `<h3 class="gs-sub">${esc(mapName("collage"))}</h3>${tiles(s, GREY)}` : ""}${showsZoom(s) ? `<h3 class="gs-sub">${esc(mapName("euclid"))}</h3>${tiles(s, ZOOM)}` : ""}</div>`
      );
    }
    /* Game Options: Host Settings for every game, then Game mode Settings for the picked one (or each one a vote or
       Random can land on) */
    const gs = games(s),
      hostList = HOST.filter(
        (x) =>
          (x.when ? x.when(s) : true) &&
          gs.some(
            (g) =>
              !(x.off || []).includes(g) && (!x.only || x.only.includes(g)),
          ),
      );
    const own = gs
      .map((g) => {
        const body =
          modeRules(s, g) +
          folds(
            s,
            (BY_MODE[g] || []).filter((x) => !x.when || x.when(s)),
            `mode:${g}`,
          );
        return body
          ? `${gs.length > 1 ? `<h3 class="gs-sub">${esc(modeOf(g).name)}</h3>` : ""}${body}`
          : "";
      })
      .join("");
    return (
      head("Game Options") +
      `<div class="arm-body gs-opts">${host() ? "" : '<p class="small dim gs-ro">Only the host (or sudo) changes these.</p>'}<h3 class="gs-h">Host Settings</h3>${folds(s, hostList, "host", { more: s.solo ? "" : room(s) })}<h3 class="gs-h gs-big">Game mode Settings</h3>${own || `<p class="small dim gs-none">${esc(gs.length > 1 ? "These games have no settings of their own." : `${modeOf(gs[0]).name} has no settings of its own.`)}</p>`}${host() ? '<p class="acts"><button type="button" class="btn ghost" data-a="reset">Defaults</button></p>' : ""}</div>`
    );
  }

  /* the preview: what the row under the pointer (or the picked one) looks like, with its name and what it is */
  function stageHTML() {
    const s = S(),
      o = s.options,
      html = stageCard(s, o);
    if (page === "opts" || html.includes('<div class="gs-pic">')) return html;
    /* a row with no picture of its own (Vote, Random, a kind of game) keeps the picked game's or map's picture on a
       phone, so the rows under a finger never move */
    const keep =
      page === "map" ? mapPic(s, o.map, o.mode) : gamePic(s, o.mode || "aod");
    return html.replace(
      '<div class="gs-text">',
      `<div class="gs-pic gs-keep">${keep}</div><div class="gs-text">`,
    );
  }
  function stageCard(s, o) {
    let p = peek;
    if (!p)
      p = isWorldMap(page)
        ? CABIN_MODES.includes(o.mode)
          ? { kind: "mode", id: o.mode }
          : { kind: "map", id: "cabin" }
        : page === "map"
          ? { kind: "map", id: o.mapPick ? o.mapPick : o.map }
          : page === "opts"
            ? { kind: "opts" }
            : page && page.startsWith("cat:")
              ? { kind: "cat", id: page.slice(4) }
              : page === "vote"
                ? { kind: "mode", id: "vote" }
                : page === "pool"
                  ? {
                      kind: "set",
                      title: "Modes in Random & Vote",
                      text: "Turn a game off and Random and the vote leave it out. During a game, every one but the game being played can change.",
                    }
                  : { kind: "mode", id: o.modePick || o.mode };
    const card = (title, text, pic = "") =>
      `<div class="gs-pic${pic ? "" : " empty"}">${pic}</div><div class="gs-text"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
    if (p.kind === "gm") {
      const m = modesNow().find((x) => x.id === p.id) || {};
      return card(
        m.name || "Custom",
        `${m.desc ? m.desc + " " : ""}Made in Sandbox. Up to ${m.most || 8} players.`,
        gamePic(s, "sandbox"),
      );
    }
    if (p.kind === "mode") {
      if (p.id === "vote" || p.id === "random")
        return card(
          p.id === "vote" ? "Vote Mode & Map" : "Random",
          PICK_TEXT[p.id === "vote" ? "vote" : "modeRandom"],
        );
      const m = modeOf(p.id);
      return card(m.name, m.tip, gamePic(s, m.id));
    }
    if (p.kind === "cat")
      return card(
        CATS.find((c) => c[0] === p.id)[1],
        modesFor(s)
          .filter((m) => m.cat === p.id)
          .map((m) => m.name)
          .join(", "),
      );
    if (p.kind === "map") {
      if (p.id === "vote" || p.id === "random")
        return card(
          p.id === "vote" ? "Vote Mode & Map" : "Random",
          PICK_TEXT[p.id === "vote" ? "vote" : "mapRandom"],
        );
      const mode = CABIN_MODES.includes(o.mode)
          ? o.mode
          : isWorldMap(p.id)
            ? "hang"
            : o.modePick
              ? "aod"
              : o.mode,
        tip = isWorldMap(p.id)
          ? CABIN_TIP
          : isUmap(p.id)
            ? (umapOf(p.id) || {}).de || ""
            : ([...MAPS, ...MAP_VARIANTS].find((m) => m[0] === p.id) ||
                [])[2] || "";
      return card(mapName(p.id), tip, mapPic(s, p.id, mode));
    }
    if (p.kind === "set") return card(p.title, p.text);
    const gs = games(s);
    return card(
      "Game Options",
      gs.length > 1
        ? "Host Settings apply to every game; under Game mode Settings, each game Vote Game Mode or Random can land on has its own, and its Mode Rules win over the General Rules in that game."
        : `Host Settings apply to every game; Game mode Settings are ${modeOf(gs[0]).name}'s own, and its Mode Rules win over the General Rules in it.`,
    );
  }

  const paint = (keep = true) => paintMenu(W, menuHTML, stageHTML, place, keep);
  /* the row the preview is about: the one under the pointer, or else the picked one */
  let peekSel = null;
  const keyOf = (el) =>
    el.classList.contains("gs-set")
      ? `.gs-set[data-d="${el.dataset.d}"]${el.dataset.mr ? `[data-mr="${el.dataset.mr}"]` : ":not([data-mr])"}`
      : ".arm-row" +
        ["mode", "map", "pick", "v", "cat", "p"]
          .filter((k) => k in el.dataset)
          .map((k) => `[data-${k}="${el.dataset[k]}"]`)
          .join("");
  const place = () => {
    const menu = W.querySelector(".arm-menu"),
      cat = modeOf(S().options.mode).cat;
    infoUnder(
      W,
      (peekSel && menu.querySelector(peekSel)) ||
        menu.querySelector('.arm-row[aria-pressed="true"]') ||
        (page === "mode" &&
          menu.querySelector(`[data-fold="cat:${cat}"] > summary`)) ||
        (!page && menu.querySelector('[data-p="mode"]')),
    );
  };
  const go = (p) => {
    page = p;
    if (p === "mode") loadModes(() => page === "mode" && paint(false)); // (the game modes made in Sandbox, on this device: gmodes.js)
    if (p === "map") bringMaps(R); // (the host's made maps into the room, so they're on the list: umaps.js)
    peek = null;
    peekSel = null;
    paint(false);
    const f = W.querySelector(".arm-menu .arm-back, .arm-menu .arm-row");
    if (f) f.focus();
  };
  if (start === "map") bringMaps(R);
  loadModes(() => page === "mode" && paint(false)); // (Custom: the game modes made in Sandbox, gmodes.js)
  /* the description of a setting (its name and what it does) */
  const describe = (k) => {
    const all = [
        ...HOST,
        GEN_SWITCH,
        GREY,
        ZOOM,
        ...VOTE_SETS,
        ...Object.values(BY_MODE).flat(),
      ],
      mode = S().options.mode,
      o =
        (BY_MODE[mode] || []).find((x) => x.k === k) ||
        all.find((x) => x.k === k);
    if (k === "max")
      return {
        kind: "set",
        title: "Room",
        text: "Players up to: the most players the room holds. Computers (TEST rooms): the number of computer players.",
      };
    return o ? { kind: "set", title: o.n, text: o.d } : null;
  };
  const peekAt = (t) => {
    let p = null;
    const r = t.closest(".arm-row"),
      set = t.closest(".gs-set");
    if (r && r.dataset.mode) p = { kind: "mode", id: r.dataset.mode };
    else if (r && r.dataset.gm) p = { kind: "gm", id: r.dataset.gm };
    else if (r && r.dataset.map) p = { kind: "map", id: r.dataset.map };
    else if (r && r.dataset.pick)
      p = {
        kind:
          r.dataset.pick === "vote"
            ? page === "map"
              ? "map"
              : "mode"
            : r.dataset.pick,
        id: r.dataset.v,
      };
    else if (r && r.dataset.cat) p = { kind: "cat", id: r.dataset.cat };
    else if (r && r.dataset.p === "vote") p = { kind: "mode", id: "vote" };
    else if (r && r.dataset.p === "mode")
      p = { kind: "mode", id: S().options.modePick || S().options.mode };
    else if (r && r.dataset.p === "map")
      p = { kind: "map", id: S().options.mapPick || S().options.map };
    else if (r && r.dataset.p === "opts") p = { kind: "opts" };
    else if (set) p = describe(set.dataset.d);
    if (!p || JSON.stringify(p) === JSON.stringify(peek)) return;
    peek = p;
    peekSel = keyOf(r || set);
    setHTML(W.querySelector(".gs-stage"), stageHTML());
    place();
  };

  return openWindow(
    `<div class="armory gs"><div class="arm-menu"></div><div class="arm-stage gs-stage" data-nonav></div></div>`,
    {
      cls: "win-armory win-full win-gs",
      onOpen(w) {
        W = w;
        paint(false);
        off = R.on(() => paint());
        const menu = w.querySelector(".arm-menu");
        menu.addEventListener("pointerover", (e) => peekAt(e.target));
        menu.addEventListener("focusin", (e) => peekAt(e.target));
        menu.addEventListener(
          "toggle",
          (e) => {
            const d =
              e.target.closest && e.target.closest("details[data-fold]");
            if (!d) return;
            if (d.open) openFolds.add(d.dataset.fold);
            else openFolds.delete(d.dataset.fold);
          },
          true,
        );
        menu.addEventListener("click", (e) => {
          const s = S(),
            o = s.options,
            boss = host(),
            send = (options) => R.send({ t: "options", options });
          const a = e.target.closest("[data-a]");
          if (a && a.dataset.a === "back")
            return go(
              page && page.startsWith("cat:")
                ? "mode"
                : isWorldMap(page)
                  ? "map"
                  : null,
            );
          if (a && a.dataset.a === "save") {
            const list = slots();
            list[+a.dataset.n] = { at: Date.now(), options: { ...o } };
            profile.saves = list;
            save();
            paint(false);
            return;
          }
          if (a && a.dataset.a === "load") {
            const x = slots()[+a.dataset.n];
            if (x && boss && s.phase === "lobby") send({ ...x.options });
            return;
          }
          if (a && a.dataset.a === "reset" && boss) {
            send({ ...OPTIONS_DEFAULT, modeRules: 0 }); // (0: no Mode Rules; an empty {} doesn't make it through Firebase)
            return;
          }
          const t = e.target.closest(".tile[data-k]");
          if (t && t.dataset.mr) {
            // a Mode Rule: set for that game mode, or Same as General again
            if (!boss || t.getAttribute("aria-disabled") === "true") return;
            const g = t.dataset.mr,
              k = t.dataset.k,
              v = t.dataset.v,
              all = JSON.parse(JSON.stringify(o.modeRules || {})),
              mine = (all[g] = all[g] || {});
            if (v === "same") delete mine[k];
            else mine[k] = v !== "" && !isNaN(v) ? +v : v;
            if (!Object.keys(mine).length) delete all[g];
            send({ modeRules: Object.keys(all).length ? all : 0 });
            return;
          }
          if (t && boss && t.getAttribute("aria-disabled") !== "true") {
            const v = t.dataset.v;
            send({ [t.dataset.k]: v !== "" && !isNaN(v) ? +v : v });
            return;
          }
          const r = e.target.closest(".arm-row");
          if (!r) return;
          peekAt(r);
          if (r.dataset.p) return go(r.dataset.p);
          if (r.dataset.cat) return go("cat:" + r.dataset.cat);
          if (r.dataset.pool) {
            if (!boss || r.getAttribute("aria-disabled") === "true") return;
            const off = o.modesOff || [],
              id = r.dataset.pool;
            send({
              modesOff: off.includes(id)
                ? off.filter((x) => x !== id)
                : [...off, id],
            });
            return;
          }
          if (r.dataset.pick === "vote" && boss) {
            // Vote Mode & Map: on, both votes; off, the host's game and map
            const v = voting(S()) ? "" : "vote";
            send({ modePick: v, mapPick: v });
            return;
          }
          if (r.dataset.pick && boss) {
            const k = r.dataset.pick === "mode" ? "modePick" : "mapPick";
            send({ [k]: o[k] === r.dataset.v ? "" : r.dataset.v });
            return;
          }
          if (r.dataset.mode) {
            if (boss)
              send({
                mode: r.dataset.mode,
                ...(o.gm ? { gm: "", gmName: "", gmMost: 0 } : {}),
              }); // (a made game mode picked before gives way)
            return;
          }
          if (r.dataset.gm) {
            const m = modesNow().find((x) => x.id === r.dataset.gm);
            if (boss && m)
              send({
                mode: "sandbox",
                modePick: "",
                gm: m.id,
                gmName: m.name,
                gmMost: m.most || 8,
              }); // (a game mode made in Sandbox, on this device: gmodes.js; its own map comes with it)
            return;
          }
          if (r.dataset.sb) {
            if (boss) send({ sbMap: r.dataset.sb }); // (Sandbox on a world: rules.js sbMapPicked)
            return;
          }
          if ("umaps" in r.dataset) {
            myMaps(R); // (the maps on the host's device: make, change, play)
            return;
          }
          if (isWorldMap(r.dataset.map)) return go("cabin"); // (Duck Cabin's own games, on a page of their own)
          if (r.dataset.map === "downpour") {
            if (boss) send({ mode: "l4dd", l4map: "downpour" }); // (Downpour: Dead Ducks Arcade's own map; its map vote still comes first, the owner's, Nov 17)
            return;
          }
          if (r.dataset.map && boss) {
            const f = mapForm(r.dataset.map); // (Vote Maps and Random go off: rules.js)
            send(
              f.map === "euclid"
                ? { map: f.map, mapZoom: f.zoom ? 1 : 0 }
                : f.map === "collage"
                  ? { map: f.map, mapGrey: f.grey ? 1 : 0 }
                  : { map: f.map },
            ); // (a variation in another form: its map, with its setting)
          }
        });
        menu.addEventListener("change", (e) => {
          const k = e.target.dataset.k;
          if (!host()) return;
          if (k === "max")
            R.send({ t: "options", options: {}, max: +e.target.value });
          if (k === "computers") R.setComputers(+e.target.value);
        });
      },
    },
  ).then((v) => {
    if (off) off();
    W = null;
    return v;
  });
}
