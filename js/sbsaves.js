/* ---------- Sandbox's saves: kept on the host's device, the window that picks one, and the saving itself ----------
   The owner's, Nov 19 23:46Z (sbsave.js has his words and what a save holds). This is the screen's half:
   - The saves live on the host's device, in the browser's IndexedDB (no size cap, works offline). Each is written whole
     or not at all (one transaction), the one it replaces is kept beside it, and it's read back and checked after each
     write; a save that doesn't check out opens from the copy kept before it. Export and Import move one between devices
     as a file.
   - When a Sandbox game starts, the host's window lists New Sandbox and every save, newest first (rename, export,
     delete); everyone else sees "<host> is choosing: a new Sandbox or a saved one".
   - It saves by itself every minute while the Sandbox is played, the moment it ends (back to the lobby, the room closed),
     and when the tab is hidden or closed, so a crash or a closed tab never loses more than a minute. Only the host's
     device saves; Save and Save as are in G. */
import { esc, openWindow, confirmBox, toast } from "./ui.js";
import { req, done } from "./idbstore.js"; // (the opener stays here: Sandbox keeps two stores, saves and prev)
import { rainbowHTML } from "./art.js";
import { fsBtnHTML } from "./corners.js";
import { lobbyVote } from "./players.js";
import { activeRoom } from "./net.js";
import {
  isSb,
  SB_WORLD_NAMES,
  SB_RULES,
  sbRule,
  sbCan,
  sbOnBoard,
} from "./sandboxrules.js";
import { mapName, mapForm } from "./maps.js";
import { sbSnapshot, newSaveId, SAVE_V, oldPics } from "./sbsave.js";
import { lobbyBtnHTML } from "./vote.js";
import { music, allowSongs, allowedSongs, songsOf } from "./music.js";
import { songFrom, songKey, SONG } from "./sbaudio.js";
import { upBar } from "./upbar.js";
import { SB_PIC, SB_SONG } from "./sbspawn.js";
import { sfx } from "./sound.js";
import {
  saveModeWin,
  startTest,
  autoPick,
  listModes,
  readMode,
  bringModeMap,
} from "./gmodes.js";

/* ---------- the store ---------- */
const DB = "duckfriends-sandbox",
  KIND = "duckfriends-sandbox-save";
let dbP = null;
function db() {
  if (!dbP)
    dbP = new Promise((ok, no) => {
      const q = indexedDB.open(DB, 1);
      q.onupgradeneeded = () => {
        const d = q.result;
        if (!d.objectStoreNames.contains("saves"))
          d.createObjectStore("saves", { keyPath: "id" });
        if (!d.objectStoreNames.contains("prev"))
          d.createObjectStore("prev", { keyPath: "id" }); // (each save's copy before its last write)
      };
      q.onsuccess = () => ok(q.result);
      q.onerror = () => no(q.error);
      q.onblocked = () => no(new Error("blocked"));
    }).catch((e) => {
      dbP = null;
      throw e;
    });
  return dbP;
}
/* a save's check: FNV-1a over its text, and its length */
function sumOf(t) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + "." + t.length.toString(36);
}
const good = (r) =>
  !!r && typeof r.data === "string" && r.sum === sumOf(r.data);

/* the tab closing: the browser may stop before IndexedDB has written, so the save also goes in localStorage at once (it
   holds about 5 MB: most Sandboxes, pictures and all), and goes into the store the next time this page opens */
const RESCUE = "duckfriends-sandbox-rescue";
function rescue(rec) {
  try {
    localStorage.setItem(RESCUE, JSON.stringify(rec));
  } catch (e) {
    /* too big: the last minute's save stands */
  }
}
let rescued = null;
function takeRescue() {
  if (!rescued)
    rescued = (async () => {
      let rec = null;
      try {
        rec = JSON.parse(localStorage.getItem(RESCUE) || "null");
      } catch (e) {
        /* nothing to take */
      }
      if (!good(rec)) return localStorage.removeItem(RESCUE);
      const d = await db(),
        was = await req(
          d.transaction("saves").objectStore("saves").get(rec.id),
        );
      if (!good(was) || was.at < rec.at) await put(rec);
      localStorage.removeItem(RESCUE);
    })().catch(() => {});
  return rescued;
}

/* every save, newest first: { id, name, at, made, world, map } (no data) */
export async function listSaves() {
  await takeRescue();
  const d = await db(),
    t = d.transaction("saves");
  const all = await req(t.objectStore("saves").getAll());
  return all
    .map(({ id, name, at, made, world, map }) => ({
      id,
      name,
      at,
      made,
      world,
      map,
    }))
    .sort((a, b) => b.at - a.at);
}
/* one save, whole, its data read: the last good copy when the newest doesn't check out */
export async function readSave(id) {
  await takeRescue();
  const d = await db(),
    t = d.transaction(["saves", "prev"]);
  const [a, b] = await Promise.all([
    req(t.objectStore("saves").get(id)),
    req(t.objectStore("prev").get(id)),
  ]);
  const r = good(a) ? a : good(b) ? b : null;
  if (!r) return null;
  let data;
  try {
    data = JSON.parse(r.data);
  } catch (e) {
    return null;
  }
  await oldPics(data); // (the next save keeps only the pixels)
  return { ...r, data };
}
/* write rec whole, keeping the one it replaces; then read it back and check it (a bad write puts the old one back) */
let chain = Promise.resolve();
function put(rec) {
  const job = chain.then(async () => {
    const d = await db(),
      t = d.transaction(["saves", "prev"], "readwrite"),
      S = t.objectStore("saves"),
      P = t.objectStore("prev");
    const was = await req(S.get(rec.id));
    if (good(was)) P.put(was);
    S.put(rec);
    await done(t);
    const back = await req(
      d.transaction("saves").objectStore("saves").get(rec.id),
    );
    if (good(back) && back.sum === rec.sum) return true;
    if (good(was)) {
      const t2 = d.transaction("saves", "readwrite");
      t2.objectStore("saves").put(was);
      await done(t2);
    }
    return false;
  });
  chain = job.catch(() => false);
  return job;
}
async function patch(id, fn) {
  const d = await db(),
    t = d.transaction(["saves", "prev"], "readwrite");
  for (const k of ["saves", "prev"]) {
    const st = t.objectStore(k),
      r = await req(st.get(id));
    if (r) st.put(fn(r));
  }
  await done(t);
}
async function drop(id) {
  const d = await db(),
    t = d.transaction(["saves", "prev"], "readwrite");
  t.objectStore("saves").delete(id);
  t.objectStore("prev").delete(id);
  await done(t);
}

/* ---------- saving ---------- */
const lastText = {}; // (save id: the text last written, so an unchanged Sandbox isn't written again)
/* save room state s under its session (s.sbsv): true when written (or nothing had changed) */
function recOf(s) {
  const sv = s && s.sbsv;
  if (!sv || !sv.id || !isSb(s)) return null;
  const data = sbSnapshot(s),
    text = JSON.stringify(data);
  return {
    id: sv.id,
    name: sv.name || "Sandbox",
    made: sv.made || Date.now(),
    at: Date.now(),
    v: SAVE_V,
    world: data.world,
    map: data.map,
    sum: sumOf(text),
    data: text,
  };
}
export async function saveState(s) {
  const rec = recOf(s);
  if (!rec) return false;
  if (lastText[rec.id] === rec.data) return true;
  try {
    const ok = await put(rec);
    if (ok) lastText[rec.id] = rec.data;
    return ok;
  } catch (e) {
    return false;
  }
}

/* by itself: every minute while the host plays a Sandbox, once it ends, and when the tab goes away */
const EVERY = 60000;
const A = { room: null, off: null, last: null, at: 0 };
const playing = (s, r) =>
  !!s &&
  !!r &&
  isSb(s) &&
  !!s.sbsv &&
  s.hostId === r.me &&
  !s.gmPlay && // (a made game mode played, or tested: the build isn't changed by playing it)
  !["lobby", "over", "countdown"].includes(s.phase);
function flush() {
  const l = A.last;
  A.last = null;
  if (l) saveState(l);
}
function seen(s) {
  if (playing(s, A.room)) {
    if (!A.last) A.at = Date.now(); // (the first minute counts from the start)
    A.last = s;
  } else if (A.last) flush(); // (it ended: its last moment, before the lobby)
}
function watch() {
  const r = activeRoom();
  if (r !== A.room) {
    flush(); // (the room closed or changed: its last moment)
    if (A.off) A.off();
    A.room = r;
    A.off = r ? r.on((s) => seen(s)) : null;
    if (r) seen(r.state);
  }
  if (A.last && Date.now() - A.at >= EVERY) {
    A.at = Date.now();
    saveState(A.last);
  }
}
if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
  setInterval(watch, 1000);
  const away = () => {
    if (!A.last) return;
    const rec = recOf(A.last);
    if (rec && lastText[rec.id] !== rec.data) rescue(rec); // (written at once, in case the tab is gone before the store)
    saveState(A.last); // (A.last stays: the game may go on)
  };
  addEventListener("pagehide", away);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") away();
  });
  setTimeout(takeRescue, 3000); // (a save the last visit left in localStorage)
}

/* ---------- G: Save, Save as and Music ----------
   win: a row that opens a window of its own puts G away first, so one press of G brings it back after (it took two) */
export function saveRows(R) {
  const s = R.state,
    rows = [];
  if (s.hostId === R.me && s.sbsv)
    rows.push(
      {
        label: `Save: ${s.sbsv.name || "Sandbox"}`,
        act: async (r) => {
          const ok = await saveState(r.state);
          toast(
            ok
              ? `Saved: ${r.state.sbsv.name}`
              : "It couldn't be saved on this device.",
          );
        },
      },
      { label: "Save as…", win: true, act: (r) => saveAs(r) },
    );
  rows.push(
    {
      label: "Make a map…",
      win: true,
      act: (r) => import("./umaps.js").then((m) => m.makeMap(r)),
    },
    {
      label: "My maps…",
      win: true,
      act: (r) => import("./umaps.js").then((m) => m.myMaps(r)),
    },
  ); // (a map from a picture, kept on this device: umaps.js; the owner's, Nov 19 22:59Z, "In Sandbox ... They click it and they can upload an image")
  rows.push({ label: "Rules…", win: true, act: (r) => rulesWin(r) }); // (plan Phase 6: lives, the down phase, crits, watching when out)
  rows.push({
    label: "Weapons and items…",
    win: true,
    act: (r) => import("./sblootview.js").then((m) => m.itemsWin(r)),
  }); // (plan Loot 5: every copy of an item, bought or picked up; it wins over a loot's own numbers)
  rows.push({
    label: "Save game mode…",
    win: true,
    act: (r) => saveModeWin(r),
  }); // (plan Phase 6: kept on this device, gmodes.js)
  if (s.hostId === R.me && s.sbsv)
    rows.push({ label: "Test game mode", act: (r) => startTest(r) }); // (as players would see it; Stop test at the top left)
  const on = allowedSongs(s); // (Miles Jr.'s song list, music.js: only these play, and everyone hears the same)
  rows.push({
    label: `Music: ${on.length ? `${on.length} of ${music.tracks.length + songsOf(s).size} songs` : "no music"}…`,
    win: true,
    act: (r) => musicWin(r),
  }); // (its own window: the owner's, Nov 20 04:44Z, "music settings among others in game settings are a window that pops up")
  return rows;
}
/* G's Music: every song with its tick, and all on or off at once; only the ticked ones play. Import a song brings one of
   the player's own (the owner's, Nov 20 18:46Z): made small on this device (sbaudio.js), with a green bar on the button
   while it's made and sent; an imported one can be taken out again (×) */
function musicWin(R) {
  if (document.querySelector(".sb-musicwin")) return;
  const draw = (w) => {
    const on = allowedSongs(R.state),
      mine = songsOf(R.state),
      all = [...music.tracks, ...mine.keys()];
    w.querySelector(".sb-musiclist").innerHTML = all
      .map((n) => {
        const m = mine.get(n);
        return `<div class="sb-song"><label><input type="checkbox" data-song="${esc(n)}"${on.includes(n) ? " checked" : ""}> ${esc(n)}</label>${m ? `<span class="small dim">${Math.floor(m.e.l / 60)}:${String(Math.round(m.e.l % 60)).padStart(2, "0")}</span><button type="button" class="btn ghost small sb-songx" data-songrm="${esc(m.key)}" aria-label="Take out ${esc(n)}">×</button>` : ""}</div>`;
      })
      .join("");
    w.querySelector("[data-all]").textContent = on.length
      ? "Turn all off"
      : "Turn all on";
    const full = mine.size >= SB_SONG.KEEP;
    w.querySelector(".sb-songup").classList.toggle("off", full);
    w.querySelector("[data-songup]").disabled = full;
  };
  return openWindow(
    `<h2>Music</h2><p class="small dim">Only the ticked songs play, the same for everyone. The save keeps the list.</p><p class="acts"><button type="button" class="btn small" data-all></button><label class="btn small ghost sb-songup">Import a song<input type="file" accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac,.opus,.webm" hidden data-songup data-nobar></label></p><p class="small dim sb-songnote">3 minutes at most, made small (32 kbps, one channel). Only music you have the right to use.</p><div class="sb-musiclist"></div>`,
    {
      cls: "win-small sb-musicwin",
      onOpen(w) {
        draw(w);
        w.addEventListener("change", async (e) => {
          const up = e.target.closest("[data-songup]");
          if (up) {
            const f = up.files && up.files[0];
            up.value = "";
            if (!f) return;
            const bar = upBar(up);
            try {
              const song = await songFrom(f, (p) => bar.set(p * 0.85));
              const h = songKey(song.d),
                parts = Math.ceil(song.d.length / SB_PIC.PART);
              for (let i = 0; i < parts; i++) {
                R.send({
                  t: "sb",
                  k: "song",
                  h,
                  n: i,
                  of: parts,
                  nm: song.n,
                  l: song.l,
                  d: song.d.slice(i * SB_PIC.PART, (i + 1) * SB_PIC.PART),
                });
                bar.set(0.85 + ((i + 1) / parts) * 0.15);
                await new Promise((r) => setTimeout(r, 30));
              }
              bar.done();
              toast(
                song.l >= SONG.MOST_S - 0.5
                  ? `${song.n}: in, cut to 3 minutes.`
                  : `${song.n}: in.`,
              );
            } catch (err) {
              bar.done();
              toast(err.why || "That song couldn't be brought in.");
            }
            setTimeout(() => w.isConnected && draw(w), 300);
            return;
          }
          const c = e.target.closest("[data-song]");
          if (!c) return;
          const on = allowedSongs(R.state),
            n = c.dataset.song;
          allowSongs(c.checked ? [...on, n] : on.filter((x) => x !== n));
          setTimeout(() => w.isConnected && draw(w), 150);
        });
        w.addEventListener("click", (e) => {
          const x = e.target.closest("[data-songrm]");
          if (!x) return;
          R.send({ t: "sb", k: "songrm", h: x.dataset.songrm });
          setTimeout(() => w.isConnected && draw(w), 150);
        });
        w.querySelector("[data-all]").onclick = () => {
          allowSongs(allowedSongs(R.state).length ? [] : undefined);
          setTimeout(() => w.isConnected && draw(w), 150);
        };
      },
    },
  );
}
/* G's Rules (plan Phase 6, sandboxrules.js SB_RULES): lives, the down phase, crits, watching the others when out; only
   whoever may change Sandbox changes them, everyone sees them. On the zombie maps' worlds */
function rulesWin(R) {
  if (document.querySelector(".sb-ruleswin")) return;
  const draw = (w) => {
    const s = R.state,
      may = sbCan(s, R.me);
    w.querySelector(".sb-rules").innerHTML = Object.entries(SB_RULES)
      .filter(([, b]) => !b.file && (!b.board || sbOnBoard(s))) // (Board size: the plain boards only; the settings file's: Seriat's settings/limits)
      .map(([k, b]) => {
        const v = sbRule(s, k);
        if (b.kind === "pick")
          return `<div class="sb-row sb-pickrow" data-row="${k}"><span>${esc(b.name)}</span><span class="sb-what">${b.opts
            .map(
              ([o, n]) =>
                `<button type="button" class="sb-tab${v === o ? " on" : ""}" data-rulepick="${k}" data-v="${o}" aria-pressed="${v === o}"${may ? "" : " disabled"}>${esc(n)}</button>`,
            )
            .join("")}</span></div>`;
        return b.kind === "bool"
          ? `<div class="sb-row" data-row="${k}"><span>${esc(b.name)}</span><button type="button" class="sb-tog${v ? " on" : ""}" data-rule="${k}" aria-pressed="${v}"${may ? "" : " disabled"}>${v ? "true" : "false"}</button></div>`
          : `<div class="sb-row" data-row="${k}"><span>${esc(b.name)}</span><input class="sb-box" type="number" min="${b.min}" max="${b.max}" step="1" value="${v}" data-rule="${k}" aria-label="${esc(b.name)}"${may ? "" : " disabled"}></div>`;
      })
      .join("");
  };
  return openWindow(
    `<h2>Rules</h2><p class="small dim">Lives, watching and everyone out count on every map; the down phase and crits are for the zombie maps (the arcade's cabin and Downpour); Board size for the plain boards; a game mode's look on every map. Saved with the Sandbox.</p><div class="sb-rules sb-set"></div>`,
    {
      cls: "win-small sb-ruleswin",
      onOpen(w) {
        draw(w);
        const later = () => setTimeout(() => w.isConnected && draw(w), 150);
        w.addEventListener("click", (e) => {
          const pk = e.target.closest("button[data-rulepick]");
          if (pk) {
            R.send({ t: "sbr", k: pk.dataset.rulepick, v: pk.dataset.v });
            return later();
          }
          const b = e.target.closest("button[data-rule]");
          if (!b) return;
          R.send({
            t: "sbr",
            k: b.dataset.rule,
            v: b.classList.contains("on") ? "f" : "t",
          });
          later();
        });
        w.addEventListener("change", (e) => {
          const i = e.target.closest("input[data-rule]");
          if (!i) return;
          R.send({ t: "sbr", k: i.dataset.rule, v: i.value });
          later();
        });
      },
    },
  );
}
/* a name typed in a small window: the name, or null */
function askName(title, was, yes) {
  return openWindow(
    `<h2>${esc(title)}</h2><form class="sbp-form"><input class="sbp-in" maxlength="60" value="${esc(was)}" aria-label="Name" autofocus><p class="acts"><button type="submit" class="btn">${esc(yes)}</button><button type="button" class="btn ghost" data-no>Cancel</button></p></form>`,
    {
      cls: "win-small",
      onOpen: (w, close) => {
        const f = w.querySelector("form"),
          i = w.querySelector("input");
        i.select();
        w.querySelector("[data-no]").onclick = () => close(null);
        f.onsubmit = (e) => {
          e.preventDefault();
          const v = i.value.replace(/\s+/g, " ").trim();
          if (v) close(v.slice(0, 60));
        };
      },
    },
  );
}
async function saveAs(R) {
  const name = await askName(
    "Save as",
    (R.state.sbsv && R.state.sbsv.name) || "",
    "Save",
  );
  if (!name) return;
  R.send({ t: "sbsv", name, sid: newSaveId() });
  const ok = await saveState(R.state);
  toast(ok ? `Saved: ${name}` : "It couldn't be saved on this device.");
}

/* ---------- the pick at the start ---------- */
let W = null; // the window while it's up: { el, R, key, list }
const picOf = (sv) => {
  if (sv.world === "downpour") return "assets/px/maps/downpour.webp";
  if (sv.world === "zcabin") return "assets/px/maps/duck-cabin-zombies.webp";
  if (sv.world === "cabin") return "assets/px/maps/duck-cabin.webp";
  const m = mapForm(sv.map || "board").map;
  return `assets/px/vote/${["board", "carnival", "collage", "euclid", "pixel", "rabbit", "sky", "stars", "tiles", "vellum"].includes(m) ? m : "board"}.webp`;
};
const placeOf = (sv) =>
  sv.world
    ? SB_WORLD_NAMES[sv.world] || "A world"
    : `The board${sv.map && sv.map !== "board" ? ` (last on ${mapName(sv.map)})` : ""}`;
const whenOf = (t) =>
  new Date(t).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
function rowHTML(sv) {
  return `<div class="sbp-row" data-id="${esc(sv.id)}"><button type="button" class="sbp-open" data-open="${esc(sv.id)}"><img class="sbp-pic" src="${picOf(sv)}" alt="" draggable="false" data-pxok><span class="sbp-t"><b>${esc(sv.name || "Sandbox")}</b><small>${esc(placeOf(sv))} · saved ${esc(whenOf(sv.at))}</small></span></button><span class="sbp-acts"><button type="button" class="btn ghost small" data-ren="${esc(sv.id)}">Rename</button><button type="button" class="btn ghost small" data-exp="${esc(sv.id)}">Export</button><button type="button" class="btn ghost small" data-del="${esc(sv.id)}">Delete</button></span></div>`;
}
/* one of my game modes, to keep building it (the owner's: "they can scroll through their previous sandbox sessions, their
   game modes, and everything like that. And choosing the game modes or sandbox sessions determines what map it is") */
function modeHTML(m) {
  return `<div class="sbp-row" data-id="${esc(m.id)}"><button type="button" class="sbp-open" data-mode="${esc(m.id)}"><img class="sbp-pic" src="${picOf(m)}" alt="" draggable="false" data-pxok><span class="sbp-t"><b>${esc(m.name || "Game mode")}</b><small>${esc(placeOf(m))} · game mode${m.game ? " · comes with the game" : m.at ? ` · saved ${esc(whenOf(m.at))}` : ""}</small></span></button></div>`;
}
const modesHTML = (h, modes, game) => {
  const ms = (modes || []).filter((m) => !!m.game === game);
  return ms.length
    ? `<h3 class="vt-cat">${h}</h3>${ms.map(modeHTML).join("")}`
    : "";
};
function listHTML(list, modes) {
  if (list === null) return `<p class="sbp-note">Looking for your saves…</p>`;
  if (list === false)
    return `<p class="sbp-note">This browser window can't keep saves (a private window, or saving turned off), so only a new Sandbox can start.</p>`;
  return `${
    list.length
      ? `<h3 class="vt-cat">Your saves</h3>${list.map(rowHTML).join("")}`
      : `<p class="sbp-note">No saves yet. A Sandbox saves itself every minute, and in G you can save it whenever you like.</p>`
  }${modesHTML("Game modes in the game", modes, true)}${modesHTML("Your game modes", modes, false)}`;
}
async function refresh() {
  if (!W) return;
  try {
    W.list = await listSaves();
  } catch (e) {
    W.list = false;
  }
  if (!W) return;
  const modes = W.list ? await listModes().catch(() => []) : [];
  if (!W) return;
  W.el.querySelector(".sbp-list").innerHTML = listHTML(W.list, modes);
}
function hostHTML() {
  return `<button type="button" class="sbp-new" data-new><span class="sbp-plus">+</span><span class="sbp-t"><b>New Sandbox</b><small>Start from nothing</small></span></button><div class="sbp-list">${listHTML(null)}</div><p class="sbp-foot"><label class="btn ghost small">Import a save<input type="file" accept=".json,application/json" hidden data-imp></label></p>`;
}
function build(R, pause) {
  closeSbPick();
  const s = R.state,
    mine = s.hostId === R.me,
    host = (s.players[s.hostId] || {}).name || "The host";
  const el = document.createElement("div");
  el.setAttribute("role", "dialog");
  el.className = "vt sbp";
  el.setAttribute("aria-label", "Sandbox");
  el.innerHTML = `<header class="vt-head"><div class="vt-left"><span class="vt-lv">${lobbyBtnHTML(s, R.me)}</span></div><h2 class="vt-title">${rainbowHTML("Sandbox", { seed: 9 })}</h2><div class="vt-right">${fsBtnHTML()}<button type="button" class="btn ghost iconbtn vt-pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button></div></header><p class="vt-sub">${mine ? "A new Sandbox, or pick up one of your saves or game modes" : `${esc(host)} is choosing: a new Sandbox, a saved one or a game mode`}</p><div class="vt-box">${mine ? hostHTML() : `<p class="sbp-wait">${esc(host)} is choosing…</p>`}</div>`;
  document.body.append(el);
  W = {
    el,
    R,
    key: s.at + ":" + s.hostId + ":" + R.me,
    list: null,
    lv: "",
    busy: false,
    pause,
  };
  if (mine) refresh();
  el.addEventListener("click", (e) => click(e));
  el.addEventListener("change", (e) => {
    if (e.target.matches("[data-imp]")) importFile(e.target);
  });
}
async function click(e) {
  const t = e.target.closest("button, [data-lv]");
  if (!t || !W) return;
  const R = W.R;
  if (t.closest(".vt-pause")) return W.pause && W.pause();
  if (t.closest("[data-lv]")) return lobbyVote(R);
  if (W.busy) return;
  if (t.matches("[data-new]")) {
    sfx.tick();
    R.send({ t: "sbPick" });
    return;
  }
  if (t.dataset.mode) {
    /* a game mode, to keep building it: as a save of it (its own made map into the room first, as gmodes.js autoPick) */
    W.busy = true;
    sfx.tick();
    const m = await readMode(t.dataset.mode).catch(() => null);
    if (m) await bringModeMap(R, m);
    if (W) W.busy = false;
    if (!m) return toast("That game mode couldn't be read on this device.");
    R.send({
      t: "sbPick",
      save: { id: newSaveId(), name: m.name, made: Date.now(), data: m.data },
    });
    return;
  }
  const open = t.dataset.open,
    ren = t.dataset.ren,
    exp = t.dataset.exp,
    del = t.dataset.del;
  if (open) {
    W.busy = true;
    sfx.tick();
    const sv = await readSave(open).catch(() => null);
    if (W) W.busy = false;
    if (!sv)
      return toast(
        "That save couldn't be read on this device. Your other saves are fine.",
      );
    await bringModeMap(R, sv); // (its own made map into the room first: it plays on it, no map vote, sbsave.js saveMap)
    R.send({
      t: "sbPick",
      save: { id: sv.id, name: sv.name, made: sv.made, v: sv.v, data: sv.data },
    });
    return;
  }
  if (ren) {
    const was = (W.list || []).find((x) => x.id === ren);
    const name = await askName("Rename", (was && was.name) || "", "Rename");
    if (!name) return;
    await patch(ren, (r) => ({ ...r, name })).catch(() => null);
    return refresh();
  }
  if (exp) {
    const sv = await readSave(exp).catch(() => null);
    if (!sv) return toast("That save couldn't be read on this device.");
    const file = JSON.stringify({
      kind: KIND,
      v: sv.v,
      id: sv.id,
      name: sv.name,
      made: sv.made,
      at: sv.at,
      world: sv.world,
      map: sv.map,
      data: sv.data,
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([file], { type: "application/json" }),
    );
    a.download = `${(sv.name || "Sandbox").replace(/[^\w ,.-]+/g, "").trim() || "Sandbox"}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return;
  }
  if (del) {
    const was = (W.list || []).find((x) => x.id === del);
    const yes = await confirmBox(
      `Delete ${(was && was.name) || "this save"}?`,
      "It can't be brought back.",
      "Delete",
      "Keep it",
    );
    if (!yes) return;
    await drop(del).catch(() => null);
    return refresh();
  }
}
/* Import: a save file from another device goes in the list (as a copy when this device has one by its id) */
async function importFile(input) {
  const f = input.files && input.files[0];
  input.value = "";
  if (!f) return;
  let o = null;
  try {
    o = JSON.parse(await f.text());
  } catch (e) {
    /* not a save */
  }
  if (!o || o.kind !== KIND || !o.data || typeof o.data !== "object")
    return toast("That file isn't a Duck Friends Sandbox save.");
  const text = JSON.stringify(o.data);
  let id =
    typeof o.id === "string" && /^[a-z0-9]{6,40}$/.test(o.id)
      ? o.id
      : newSaveId();
  try {
    if ((await listSaves()).some((x) => x.id === id)) id = newSaveId();
    const ok = await put({
      id,
      name: String(o.name || "Sandbox").slice(0, 60),
      made: +o.made || Date.now(),
      at: Date.now(),
      v: +o.v || 1,
      world: o.data.world || "",
      map: o.data.map || "",
      sum: sumOf(text),
      data: text,
    });
    toast(ok ? `Imported: ${o.name || "Sandbox"}` : "It couldn't be imported.");
  } catch (e) {
    toast("This browser window can't keep saves.");
  }
  refresh();
}

/* the window as the state has it: up while the host picks (lobby.js paints it with the votes) */
export function paintSbPick(R, pause) {
  const s = R.state;
  if (!(s.phase === "countdown" && s.sbpk)) return closeSbPick();
  if (autoPick(R)) return closeSbPick(); // (a made game mode: the host's device hands it over, no pick: gmodes.js)
  if (!W || W.R !== R || W.key !== s.at + ":" + s.hostId + ":" + R.me)
    build(R, pause);
  const lv = lobbyBtnHTML(s, R.me);
  if (lv !== W.lv) {
    W.lv = lv;
    W.el.querySelector(".vt-lv").innerHTML = lv;
  }
}
export function closeSbPick() {
  if (!W) return;
  W.el.remove();
  W = null;
}
