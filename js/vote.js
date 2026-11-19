/* ---------- Vote Mode & Map: the vote windows (owner 2026-11-04) ----------
   After the start's countdown (and again with Vote return), a window over the whole screen, on a phone too: first
   "Vote for Game Mode", the games in rows (their symbol, the title to the right, the votes' number under the symbol and
   the voters' ducks under the title), then "Vote for Map", every map as a picture, each form of a map a picture of its
   own next to it with the form in its title. The dice at the top of both is a random pick. Players vote by clicking
   (or tapping) once, and the same one again takes the vote back; a phone swipes through them like any list. A map's
   picture stands still until the pointer is over it, or a finger holds it, and the map you voted for keeps moving.
   rules.js keeps the votes (s.vt) and the clock; the lobby paints this window while it's up. */
import { fsBtnHTML } from "./corners.js";
import { esc } from "./ui.js";
import { rainbowHTML, artBackdrop, gameSymbol, diceSVG } from "./art.js";
import { modeOf, CATS, CABIN_MODES } from "./modes.js";
import { mapName, mapForm, mountPreview } from "./maps.js";
import { isNwk } from "./nwk.js";
import { duckSVG } from "./duck.js";
import { seenDuck } from "./looks.js";
import { voteIds, voteLeft, DICE, voteNeeds } from "./rules.js";
import { lobbyVote } from "./players.js";
import { now } from "./clock.js";
import { sfx } from "./sound.js";
import { coverPictures } from "./loading.js";

let W = null; // the window while it's up: { el, R, key, sig, hov, live, raf, hold, pause }

const phone = () => !document.documentElement.classList.contains("keyboard");
const TITLE = {
  mode: "Vote for Game Mode",
  map: "Vote for Map",
  zmap: "Vote for Map",
};
/* Single Player (the owner's, Nov 18): "Select" in place of "Vote", no clock and no Next; a click picks at once */
const SOLO_TITLE = {
  mode: "Select Game Mode",
  map: "Select Map",
  zmap: "Select Map",
};
const titleOf = (s, k) => (s.solo ? SOLO_TITLE : TITLE)[k];
/* Quacky Zombies' own map vote (rules.js ZMAPS): each of its maps as one picture of it */
const ZPIC = {
  cabin: ["assets/px/maps/duck-cabin-zombies.webp", "Duck Cabin"], // (closer in and a little lighter than the whole map's picture, so it reads as clearly as Downpour's: the owner, Nov 17)
  downpour: ["assets/px/maps/downpour.webp", "Downpour"],
};

/* one choice: a game's row or a map's picture */
function modeRow(id) {
  const dice = id === DICE,
    cabin = CABIN_MODES.includes(id);
  return `<button type="button" class="vt-mode${dice ? " vt-dice" : ""}" data-v="${id}"><span class="sym">${dice ? diceSVG(50) : gameSymbol(id, 50)}</span><span class="t">${esc(dice ? "Random" : modeOf(id).name)}${cabin ? "<small>Duck Cabin</small>" : ""}</span><span class="n"></span><span class="who"></span></button>`;
}
function mapTile(id) {
  if (id === DICE)
    return `<button type="button" class="vt-map vt-dice" data-v="${DICE}"><span class="vt-pic"><span class="vt-die">${diceSVG(96)}</span></span><span class="vt-name">Random</span><span class="vt-n"></span><span class="vt-ducks"></span></button>`;
  const f = mapForm(id),
    [name, form] = mapName(id).split(/ \((.+)\)$/);
  if (isNwk(f.map))
    return `<button type="button" class="vt-map" data-v="${id}"><span class="vt-pic" data-still="${id}"></span><span class="vt-name">${esc(name)}${form ? ` <i>(${esc(form)})</i>` : ""}</span><span class="vt-n"></span><span class="vt-ducks"></span></button>`; // (its picture: a still of the map itself, stills())
  return `<button type="button" class="vt-map" data-v="${id}"><span class="vt-pic"><svg class="vt-still${f.grey ? " grey" : ""}" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${artBackdrop(f.map)}</svg></span><span class="vt-name">${esc(name)}${form ? ` <i>(${esc(form)})</i>` : ""}</span><span class="vt-n"></span><span class="vt-ducks"></span></button>`;
}
function zmapTile(id) {
  if (id === DICE) return mapTile(DICE);
  const [src, name] = ZPIC[id];
  return `<button type="button" class="vt-map" data-v="${id}"><span class="vt-pic"><img class="vt-still" src="${src}" data-pxready data-pxok alt="" draggable="false"></span><span class="vt-name">${esc(name)}</span><span class="vt-n"></span><span class="vt-ducks"></span></button>`;
}
function bodyHTML(s, k) {
  const ids = voteIds(s, k);
  if (k === "zmap")
    return `<div class="vt-maps">${[DICE, ...ids].map(zmapTile).join("")}</div>`;
  if (k === "map")
    return `<div class="vt-maps">${[DICE, ...ids].map(mapTile).join("")}</div>`;
  return `<div class="vt-modes">${modeRow(DICE)}${CATS.map(([cat, name]) => {
    const rows = ids.filter((id) => modeOf(id).cat === cat);
    return rows.length
      ? `<h3 class="vt-cat">${esc(name)}</h3>${rows.map(modeRow).join("")}`
      : "";
  }).join("")}</div>`;
}

/* the vote's own top corners (owner, Nov 16): a vote to go back to the lobby on the left, the pause menu (☰) on the
   right next to the clock, so neither is lost under the window */
const lobbyBtnHTML = (s, me) => {
  const v = s.vote && s.vote.kind === "lobby" ? s.vote : null;
  if (!v)
    return `<button type="button" class="btn ghost vt-lobby" data-lv="1">${s.solo ? "Back to the lobby" : "Vote: back to the lobby"}</button>`;
  const { voters, need } = voteNeeds(s, v),
    yes = voters.filter((id) => v.yes[id]).length;
  return `<button type="button" class="btn red vt-lobby" data-lv="1"${v.yes[me] ? " disabled" : ""}>${v.yes[me] ? "Voted: back to the lobby" : "Vote yes: back to the lobby"} · ${yes}/${need}</button>`;
};
function build(R, pause) {
  const s = R.state,
    k = s.vt.k;
  closeVotes();
  const el = document.createElement("div");
  el.setAttribute("role", "dialog");
  el.className = `vt vt-k-${k}${s.solo ? " vt-solo" : ""}`;
  el.setAttribute("aria-label", titleOf(s, k));
  el.innerHTML = `<header class="vt-head"><div class="vt-left"><span class="vt-lv">${lobbyBtnHTML(s, R.me)}</span><button type="button" class="btn red vt-next" hidden>Next</button></div><h2 class="vt-title">${rainbowHTML(titleOf(s, k), { seed: k === "map" ? 11 : 5 })}</h2><div class="vt-right"><span class="vt-time" aria-live="off"></span><button type="button" class="btn red vt-next" hidden>Next</button>${fsBtnHTML()}<button type="button" class="btn ghost iconbtn vt-pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button></div></header><p class="vt-sub">${phone() ? "Tap" : "Click"} ${k === "mode" ? "a game" : "a map"} to ${s.solo ? "select" : "vote"}</p><div class="vt-box">${bodyHTML(s, k)}</div>`;
  document.body.append(el);
  W = {
    el,
    R,
    key: k + ":" + s.at,
    sig: "",
    hov: null,
    live: new Map(),
    raf: 0,
    hold: 0,
    pause,
    time: el.querySelector(".vt-time"),
    left: null, // the second the clock shows
    tick: setInterval(clock, 50),
    lv: "",
    stills: [],
  };
  stills();
  coverPictures(el); // (the maps' pictures in before it shows, behind the loading screen: the owner's, Nov 19 20:04Z)
  const pick = (e) => e.target.closest && e.target.closest("[data-v]");
  el.addEventListener("click", (e) => {
    if (e.target.closest(".vt-pause")) return W.pause && W.pause();
    if (e.target.closest("[data-lv]")) return lobbyVote(W.R);
    if (e.target.closest(".vt-next")) {
      W.R.send({ t: "vnext" }); // (Next: my press speeds the clock up by 1/players)
      sfx.tick();
      return;
    }
    const b = pick(e);
    if (!b) return;
    W.R.send({ t: "vote", v: b.dataset.v });
    sfx.tick();
  });
  if (k === "map") {
    // the picture moves under the mouse, under a finger held on it, or with the keys on it
    const hover = (id) => {
      if (W && W.hov !== id) {
        W.hov = id;
        sync();
      }
    };
    el.addEventListener("pointerover", (e) => {
      const b = pick(e);
      if (e.pointerType === "mouse") hover(b ? b.dataset.v : null);
    });
    el.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") hover(null);
    });
    el.addEventListener("pointerdown", (e) => {
      const b = pick(e);
      if (e.pointerType === "mouse" || !b) return;
      clearTimeout(W.hold);
      W.hold = setTimeout(() => hover(b.dataset.v), 220);
    });
    const letGo = (e) => {
      if (e.pointerType === "mouse" || !W) return;
      clearTimeout(W.hold);
      hover(null);
    };
    el.addEventListener("pointerup", letGo);
    el.addEventListener("pointercancel", letGo);
    el.addEventListener("focusin", (e) => {
      const b = pick(e);
      if (b && document.documentElement.classList.contains("keyboard"))
        hover(b.dataset.v);
    });
  }
}

/* Nous Within Kenoma's pictures (owner, Nov 17: "the nous within kenoma maps dont represent the maps well at all"): a
   drawing of them can't be its static, its one-pixel strings, its scan lines and its lights at the grid's own size, so
   each is the map itself, the same scene as the one that moves under the pointer, drawn once and then left still. A
   new size (the window turned or resized) draws it again at that size */
function stills() {
  for (const pic of W.el.querySelectorAll("[data-still]")) {
    const p = mountPreview(pic, pic.dataset.still);
    pic.lastElementChild.classList.add("vt-still", "vt-nwk");
    W.stills.push(p);
  }
  const draw = () => {
    if (W) for (const p of W.stills) p.update(now());
  };
  draw();
  requestAnimationFrame(draw); // (and once it's laid out, in case it wasn't yet)
  W.redraw = draw;
  addEventListener("resize", draw);
}

/* the maps that move: the one under the pointer or a finger, and the one you voted for (the dice has no map) */
function sync() {
  if (!W) return;
  const s = W.R.state,
    mine = ((s.vt || {}).votes || {})[W.R.me],
    want = new Set(
      (s.vt || {}).k === "map"
        ? [W.hov, mine].filter((id) => id && id !== DICE)
        : [],
    );
  for (const [id, p] of W.live)
    if (!want.has(id)) {
      p.destroy();
      W.live.delete(id);
      const b = W.el.querySelector(`[data-v="${id}"]`);
      if (b) b.classList.remove("moving");
    }
  for (const id of want)
    if (!W.live.has(id)) {
      const b = W.el.querySelector(`[data-v="${id}"]`);
      if (!b) continue;
      W.live.set(id, mountPreview(b.querySelector(".vt-pic"), id));
      b.classList.add("moving");
    }
  if (W.live.size && !W.raf) {
    const loop = () => {
      if (!W || !W.live.size) {
        if (W) W.raf = 0;
        return;
      }
      W.raf = requestAnimationFrame(loop);
      const t = now();
      for (const p of W.live.values()) p.update(t);
    };
    W.raf = requestAnimationFrame(loop);
  }
}

/* the clock, every 50 ms while the window is up, so each new second shows (and beeps) on time, however fast it runs:
   the owner (Nov 17) wants a very soft beep on each second the clock shows, the last five as the lobby countdown's
   and its ding at 0, all quieter (sound.js voteCount). Not on the first number: the lobby's ding has just played */
function clock() {
  const s = W && W.R.state,
    vt = s && s.phase === "countdown" ? s.vt : null;
  if (!vt || s.solo) return; // (Single Player: no clock)
  W.time.classList.toggle("fast", !!vt.fast);
  const left = Math.ceil(voteLeft(s, now()) / 1000);
  if (left === W.left) return;
  if (W.left != null && left < W.left) sfx.voteCount(left);
  W.left = left;
  W.time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}

/* the window as the state has it: built once for each vote, then only the clock, the numbers and the ducks change */
export function paintVotes(R, pause) {
  const s = R.state,
    vt = s.phase === "countdown" ? s.vt : null;
  if (!vt) return closeVotes();
  if (!W || W.key !== vt.k + ":" + s.at || W.R !== R) build(R, pause);
  const lv = lobbyBtnHTML(s, R.me);
  if (lv !== W.lv) {
    W.lv = lv;
    W.el.querySelector(".vt-lv").innerHTML = lv;
  }
  clock();
  /* Next shows once I've voted (the owner's, Nov 17 13:30Z), and stays pressed once I've pressed it */
  const voted = !!(vt.votes || {})[R.me],
    pressed = !!(vt.next || {})[R.me];
  for (const nx of W.el.querySelectorAll(".vt-next")) {
    nx.hidden = !voted || !!s.solo;
    nx.disabled = pressed;
  } // (two of them: by the clock on a computer, beside the lobby vote on a phone, where the top row has no room)
  const votes = vt.votes || {},
    sig = JSON.stringify([votes, s.seat]);
  if (sig === W.sig) return;
  W.sig = sig;
  const by = {};
  for (const id of s.seat)
    if (votes[id] && s.players[id])
      (by[votes[id]] = by[votes[id]] || []).push(id);
  const size = W.el.classList.contains("vt-k-mode") ? 36 : 44;
  for (const b of W.el.querySelectorAll("[data-v]")) {
    const v = b.dataset.v,
      who = by[v] || [],
      mine = votes[R.me] === v;
    b.classList.toggle("mine", mine);
    b.setAttribute("aria-pressed", String(mine));
    b.querySelector(".n, .vt-n").innerHTML = who.length
      ? rainbowHTML(String(who.length), { seed: who.length + 3 })
      : "";
    b.querySelector(".who, .vt-ducks").innerHTML = who
      .map((id) =>
        duckSVG(seenDuck(s.players[id]), {
          size,
          shadow: false,
          title: s.players[id].name,
        }),
      )
      .join("");
  }
  sync();
}

export function closeVotes() {
  if (!W) return;
  if (W.left === 1) sfx.voteCount(0); // (the vote closed before I saw its 0: its ding all the same)
  clearInterval(W.tick);
  clearTimeout(W.hold);
  cancelAnimationFrame(W.raf);
  for (const p of W.live.values()) p.destroy();
  for (const p of W.stills) p.destroy();
  removeEventListener("resize", W.redraw);
  W.el.remove();
  W = null;
}
