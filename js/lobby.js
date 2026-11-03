/* ---------- the lobby, laid out like Halo: Reach's custom game lobby ----------
   Left: the game's art, the room's name, who can join, then Game Settings (the game mode, the map and the game options,
   on a screen of their own: gamesettings.js) and Start Game for the host, or Ready for everyone else, with a line under
   them saying what the row under the pointer does. Right: the party, one player card per row; click your own to rename it; right-click any card for its
   options. Bottom left: the keys (the arrow keys move around the lobby, Enter picks, Shift+Enter right-clicks). The X at
   the top right leaves the room. */
import { register, go, leaveTo } from "./router.js";
import {
  el,
  esc,
  $,
  $$,
  openWindow,
  contextMenu,
  onMenu,
  typing,
  windowOpen,
  toast,
  setHTML,
} from "./ui.js";
import { activeRoom } from "./net.js";
import { now } from "./clock.js";
import { gameArtSVG } from "./art.js";
import { modeOf } from "./modes.js";
import { cardHTML } from "./card.js";
import { netHTML, kickItems } from "./players.js";
import { isSudo, minOf, dodRoom, dodOn, dodVoting, DOD_KEYS } from "./rules.js";
import { openDemocracy } from "./democracy.js";
import { openGameSettings } from "./gamesettings.js";
import { profile, cleanName } from "./store.js";
import { openCustomize, setName } from "./customize.js";
import { openStats } from "./stats.js";
import { sfx } from "./sound.js";
import { darken, brighten, loadingScreen } from "./loading.js";
import { mountDocks, DOCK_HTML, BAR_HTML } from "./dock.js";
import { mapName } from "./maps.js";
import { acct, onAccount, requestFriend, canAdd } from "./account.js";
import { openFriends } from "./friends.js";
import { NAV_HINTS } from "./keynav.js";
import { musicBarHTML, mountMusicBar } from "./musicbar.js";
import { openSettings } from "./settings.js";

let R = null,
  off = null,
  offAcct = null,
  lastCount = -1,
  counting = false, // the start's countdown is running here (the screen fades to black over it)
  lastSeat = 0,
  rang = new Set(), // Democracy of Ducklings: the votes the bell has rung for
  docks = null,
  mbarOff = null;

const INFO = {
  settings: "The game mode, the map and the game options.",
  dod: "The ducks vote on the room's rules.",
  start: "Starts the game for everyone.",
  ready: "Tells the host you're ready.",
  friends: "Invite your friends to this room, or add a friend by code.",
};

/* ---------- a player card's options (a click, a right-click or a long press) ----------
   Your own card: View stats, Customize, and your name in a box below them, to type a new one right there. */
function cardMenu(pid, x, y) {
  const s = R.state,
    p = s.players[pid];
  if (!p) return;
  const mine = pid === R.me,
    items = [["View stats", () => openStats(s, pid, R.me)]];
  if (mine) items.push(["Customize", () => openCustomize()]);
  if (isSudo(s, R.me) && p.bot && (s.phase === "lobby" || s.phase === "over"))
    items.push(["Remove computer", () => R.send({ t: "kick", who: pid })]);
  else if (!p.bot) items.push(...kickItems(R, pid));
  if (canAdd(p))
    items.push(["Add friend", async () => toast(await requestFriend(p.acct))]);
  contextMenu(
    x,
    y,
    items,
    !mine
      ? {}
      : {
          footer: `<label class="ctx-name"><span class="small dim">Name</span><input maxlength="20" spellcheck="false" value="${esc(profile.name)}" aria-label="Your name"></label>`,
          onMount(m, close) {
            const inp = m.querySelector(".ctx-name input"),
              was = profile.name;
            const done = () => {
              if (inp.value !== was && !setName(inp.value))
                toast("A name needs at least one letter or number.");
              $(".party-list", S)._html = "";
              paint();
            };
            inp.oninput = () => {
              const c = cleanName(inp.value);
              if (c !== inp.value) {
                inp.value = c;
                inp.classList.add("shake");
                setTimeout(() => inp.classList.remove("shake"), 300);
              }
            };
            inp.onkeydown = (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                done();
                close();
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                close();
              }
              e.stopPropagation();
            };
            inp.onchange = done;
          },
        },
  );
}

/* ---------- drawing ---------- */
let S = null; // the screen
function paint() {
  if (!R || !S) return;
  const s = R.state,
    host = isSudo(s, R.me),
    mine = s.players[R.me];
  if (!mine) return;
  const title = $(".lobby-title", S);
  if (!title.querySelector("input")) {
    title.textContent = s.name;
    title.classList.toggle("can-rename", host);
    if (host) title.dataset.tip = "Click to rename the room";
    else delete title.dataset.tip;
  }
  const bots = s.seat.filter((id) => s.players[id].bot).length;
  $(".lobby-sub", S).textContent = [
    s.test
      ? "TEST room"
      : s.open
        ? "Open room"
        : R.passkey
          ? `Private room · passkey: ${R.passkey}`
          : "Private room",
    bots
      ? `${bots} computer${bots === 1 ? "" : "s"}, acting after ${s.options.botWait} s`
      : "",
    s.hostId === R.me
      ? "You are the host"
      : host
        ? "You have sudo: you can run the room too"
        : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const st = $(".lobby-status", S);
  if (s.phase === "countdown") {
    const left = Math.max(0, Math.ceil((s.ends - now()) / 1000));
    setHTML(
      st,
      `<span class="count">Starting in <b>${left}</b></span><button type="button" class="btn red" data-a="cancel">Cancel <kbd>X</kbd></button>`,
    );
  } else setHTML(st, "");
  /* Democracy of Ducklings: its row shows a "!" while a vote is up, and a soft bell rings once for each new vote */
  const dodRow = $('[data-m="dod"]', S),
    voting = dodVoting(s),
    votes = (s.dod || {}).votes || {};
  dodRow.hidden = !dodRoom(s);
  dodRow.classList.toggle("dod-up", voting);
  setHTML(
    $("span", dodRow),
    `Democracy of Ducklings${voting ? '<b class="dod-bang" aria-label="A vote is up">!</b>' : ""}`,
  );
  const rules = DOD_KEYS.filter((k) => dodOn(s, k)).length;
  $(".val", dodRow).textContent = voting
    ? "A vote is up"
    : rules
      ? `${rules} rule${rules === 1 ? "" : "s"} on`
      : "";
  for (const [k, x] of Object.entries(votes))
    if (!rang.has(`${k}:${x.at}`)) {
      rang.add(`${k}:${x.at}`);
      sfx.bell();
    }
  /* the host (or sudo) has Start Game; everyone else has Ready. With Host must ready on, or while a vote is up, the host
     readies too, and a popup at the top says why */
  const startRow = $('[data-m="start"]', S),
    readyRow = $('[data-m="ready"]', S),
    few = !s.options.modePick && s.seat.length < minOf(s), // (Who is the Quack? and Lawyering need 3 ducks)
    starts = host && !dodOn(s, "ready") && !voting;
  startRow.hidden = !starts;
  readyRow.hidden = starts;
  startRow.toggleAttribute("data-nav-start", starts); // (the arrow keys start on it)
  readyRow.toggleAttribute("data-nav-start", !starts);
  const pop = $(".dod-pop", S);
  pop.hidden = !(host && voting);
  if (!pop.hidden)
    pop.textContent =
      "A vote is up: you can't start the game until it ends, only ready.";
  startRow.setAttribute(
    "aria-disabled",
    String(s.phase === "countdown" || few),
  );
  $(".val", startRow).textContent = few
    ? `Needs ${minOf(s)} players`
    : s.phase === "countdown"
      ? ""
      : `${s.seat.filter((id) => s.players[id].ready).length}/${s.seat.length} ready`;
  readyRow.setAttribute("aria-pressed", String(!!mine.ready));
  readyRow.classList.toggle("on", !!mine.ready);
  $("span", readyRow).textContent = mine.ready ? "Ready ✓" : "Ready";
  $(".val", readyRow).textContent = mine.ready ? "" : "Not ready";
  setHTML(
    $('[data-m="settings"] .val', S),
    esc(
      `${
        s.options.modePick === "vote"
          ? "Vote Game Mode"
          : s.options.modePick === "random"
            ? "Random"
            : modeOf(s.options.mode).name
      } · ${
        s.options.mapPick === "vote"
          ? "Vote Maps"
          : s.options.mapPick === "random"
            ? "Random"
            : mapName(s.options.map)
      }`,
    ),
  );
  const fr = $('[data-m="friends"] .val', S);
  if (fr)
    fr.textContent = acct.uid
      ? `${Object.values(acct.friends).filter((f) => f.on).length} online`
      : "Sign in";
  const mode = s.options.mode || "aod",
    art = $(".lobby-art", S),
    artSig = (s.options.map || "board") + mode + JSON.stringify(profile.duck); // the picture shows the game and the map
  if (art._sig !== artSig) {
    art._sig = artSig;
    art.innerHTML = gameArtSVG({
      width: 480,
      duck: profile.duck,
      map: s.options.map || "board",
      mapLabel: mapName(s.options.map),
      mode,
    });
  }
  $(".party-count", S).textContent = `In lobby ${s.seat.length}/${s.max}`;
  const list = $(".party-list", S);
  if (!list.querySelector("input.rename"))
    setHTML(
      list,
      s.seat
        .map((id) =>
          cardHTML(s.players[id], {
            me: id === R.me,
            host: id === s.hostId,
            ready: !!s.players[id].ready,
            net:
              R.online && !s.players[id].bot
                ? netHTML(s.players[id], true)
                : "",
          }),
        )
        .join(""),
    );
  if (s.seat.length > lastSeat && lastSeat) sfx.pop();
  lastSeat = s.seat.length;
}

function onState(s) {
  if (!S) return;
  if (!["lobby", "countdown"].includes(s.phase)) {
    if (lastCount > 0) sfx.count(true);
    const started = counting;
    lastCount = -1;
    counting = false;
    const room = R;
    go("game", room);
    if (started)
      loadingScreen({
        duck: profile.duck,
        ping: () => (room.ping ? room.ping() : 0),
        ready: () =>
          new Promise((r) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                (document.fonts
                  ? document.fonts.ready
                  : Promise.resolve()
                ).then(r),
              ),
            ),
          ),
      });
    return;
  } // the countdown's last tone, at zero
  if (s.phase === "countdown") {
    const left = Math.max(0, Math.ceil((s.ends - now()) / 1000));
    if (!counting) {
      counting = true;
      darken(Math.max(0, s.ends - now()));
    }
    if (left !== lastCount) {
      sfx.count(left === 0);
      lastCount = left;
    }
  } else {
    if (counting) brighten(); // (cancelled: the screen comes back)
    counting = false;
    lastCount = -1;
  }
  paint();
}

/* Space: ready */
function key(e) {
  if (!S || typing(e) || windowOpen()) return;
  if (e.code === "Space" && !e.repeat) {
    e.preventDefault();
    toggleReady();
  }
  if (e.key === "Escape" && !e.repeat) {
    e.preventDefault();
    openPause();
  }
  if (
    (e.key === "x" || e.key === "X") &&
    !e.repeat &&
    R &&
    R.state.phase === "countdown"
  ) {
    e.preventDefault();
    R.send({ t: "cancel" });
  }
}
/* the pause menu, as in a game (☰ at the top right, or Esc) */
function openPause() {
  if (windowOpen()) return;
  openWindow(
    `<h2>Paused</h2><div class="pause-list">
    <button type="button" class="btn green" data-a="resume">Resume</button>
    <button type="button" class="btn ghost" data-a="custom">Customize</button>
    <button type="button" class="btn ghost" data-a="settings">Settings</button>
    <button type="button" class="btn ghost" data-a="friends">Friends</button>
    <button type="button" class="btn red" data-a="leave">Leave room</button></div>`,
    {
      cls: "win-small",
      onOpen: (w, close) =>
        (w.querySelector(".pause-list").onclick = (e) => {
          const a = e.target.closest("[data-a]");
          if (!a) return;
          close();
          ({
            resume() {},
            custom: () => openCustomize(),
            settings: () => openSettings(),
            friends: () => openFriends(),
            leave: () => leaveTo("rooms"),
          })[a.dataset.a]();
        }),
    },
  );
}
const toggleReady = () => {
  R.send({ t: "ready" });
  sfx.tick();
};
/* the host renames the room in place (Enter or clicking away keeps it, Esc doesn't) */
function renameRoom() {
  const title = $(".lobby-title", S);
  if (!title || title.querySelector("input")) return;
  const inp = el(
    `<input class="room-rename" maxlength="32" spellcheck="false" aria-label="Room name">`,
  );
  inp.value = R.state.name;
  title.textContent = "";
  title.append(inp);
  inp.focus();
  inp.select();
  let done = false;
  const finish = (keep) => {
    if (done) return;
    done = true;
    const v = inp.value.trim();
    inp.remove();
    if (keep && v && v !== R.state.name) R.send({ t: "roomName", name: v });
    paint();
  };
  inp.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }
  };
  inp.onblur = () => finish(true);
}

register("lobby", {
  guard: () => !!activeRoom(),
  exit() {
    const r = activeRoom();
    if (r) {
      r.send({ t: "leave" });
      r.close();
    }
  },
  leave() {
    if (off) off();
    off = null;
    if (mbarOff) mbarOff();
    mbarOff = null;
    if (offAcct) offAcct();
    offAcct = null;
    if (docks) docks.destroy();
    docks = null;
    if (counting) brighten(); // (left the room in the countdown)
    counting = false;
    clearInterval(S && S._tick);
    S = null;
    removeEventListener("keydown", key);
  },
  render(arg) {
    R = arg || activeRoom();
    if (!R) return null;
    if (!["lobby", "countdown"].includes(R.state.phase)) {
      setTimeout(() => go("game", R));
    }
    S = el(`<section class="screen lobby docked">
      <header class="lbar">${musicBarHTML()}<button type="button" class="btn ghost iconbtn lobby-pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button><button type="button" class="win-x lobby-x" aria-label="Leave the room" data-tip="Leave the room">×</button></header>
      <div class="gmain lmain">
      <div class="lobby-left">
        <p class="dod-pop" role="status" hidden></p>
        <div class="lobby-art">${gameArtSVG({ width: 480, duck: profile.duck })}</div>
        <h1 class="lobby-title"></h1>
        <p class="lobby-sub dim"></p>
        <div class="lobby-status"></div>
        <div class="lmenu" role="menu">
          <button type="button" role="menuitem" data-m="settings"><span>Game Settings</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="dod" class="dod" hidden><span>Democracy of Ducklings</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="start" class="start" hidden><span>Start Game</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="ready" class="ready" hidden><span>Ready</span><span class="val"></span></button>
          ${R.online ? '<button type="button" role="menuitem" data-m="friends"><span>Friends</span><span class="val"></span></button>' : ""}
        </div>
        <p class="lmenu-info dim">${INFO.start}</p>
      </div>
      <aside class="party"><header><h2>Party</h2><span class="party-count dim"></span></header><div class="party-list"></div></aside>
      </div>${DOCK_HTML}${BAR_HTML()}
    </section>`);
    docks = mountDocks(
      S,
      `<kbd>Space</kbd> Ready <kbd>T</kbd> Chat <kbd>Right-click</kbd> Card options ${NAV_HINTS}`,
    );
    lastSeat = 0;
    mbarOff = mountMusicBar(S);
    S.querySelector(".lobby-x").onclick = () => leaveTo("rooms");
    S.querySelector(".lobby-pause").onclick = () => openPause();
    const info = S.querySelector(".lmenu-info");
    S.querySelector(".lmenu").addEventListener("pointerover", (e) => {
      const b = e.target.closest("[data-m]");
      if (b) info.textContent = INFO[b.dataset.m];
    });
    S.querySelector(".lmenu").addEventListener("focusin", (e) => {
      const b = e.target.closest("[data-m]");
      if (b) info.textContent = INFO[b.dataset.m];
    });
    S.querySelector(".lmenu").onclick = (e) => {
      const b = e.target.closest("[data-m]");
      if (!b) return;
      const m = b.dataset.m;
      if (m === "settings") openGameSettings(R);
      if (m === "dod") openDemocracy(R);
      if (m === "ready") toggleReady();
      if (m === "start" && b.getAttribute("aria-disabled") !== "true")
        R.send({ t: "start" });
      if (m === "friends") openFriends();
    };
    S.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]");
      if (a && a.dataset.a === "ready") toggleReady();
      if (a && a.dataset.a === "cancel") R.send({ t: "cancel" });
      if (
        e.target.closest(".lobby-title.can-rename") &&
        !e.target.closest("input")
      )
        renameRoom();
      const c = e.target.closest(".party .pcard");
      if (c && !e.target.closest("input")) {
        const r = c.getBoundingClientRect();
        cardMenu(
          c.dataset.pid,
          Math.min(e.clientX, r.right - 20),
          r.bottom - 6,
        );
      }
    });
    onMenu(S.querySelector(".party"), (x, y, e) => {
      const c = e.target.closest && e.target.closest(".pcard");
      if (c) cardMenu(c.dataset.pid, x, y);
    });
    off = R.on(onState);
    offAcct = onAccount(() => paint());
    addEventListener("keydown", key);
    S._tick = setInterval(() => {
      if (R && R.state.phase === "countdown") onState(R.state);
    }, 250);
    queueMicrotask(paint);
    return S;
  },
});
