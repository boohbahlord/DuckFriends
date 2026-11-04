/* ---------- Vote Mode & Map: the vote windows (owner 2026-11-04) ----------
   After the start's countdown (and again with Vote return), a window over the whole screen, on a phone too: first
   "Vote for Game Mode", the games in rows (their symbol, the title to the right, the votes' number under the symbol and
   the voters' ducks under the title), then "Vote for Map", every map as a picture, each form of a map a picture of its
   own next to it with the form in its title. The dice at the top of both is a random pick. Players vote by clicking
   (or tapping) once, and the same one again takes the vote back; a phone swipes through them like any list. A map's
   picture stands still until the pointer is over it, or a finger holds it, and the map you voted for keeps moving.
   rules.js keeps the votes (s.vt) and the clock; the lobby paints this window while it's up. */
import { esc } from "./ui.js";
import { rainbowHTML, artBackdrop, gameSymbol, diceSVG } from "./art.js";
import { modeOf, CATS, CABIN_MODES } from "./modes.js";
import { mapName, mapForm, mountPreview } from "./maps.js";
import { duckSVG } from "./duck.js";
import { seenDuck } from "./looks.js";
import { voteIds, voteLeft, DICE } from "./rules.js";
import { now } from "./clock.js";
import { sfx } from "./sound.js";

let W = null; // the window while it's up: { el, R, key, sig, hov, live, raf, hold }

const phone = () => !document.documentElement.classList.contains("keyboard");
const TITLE = { mode: "Vote for Game Mode", map: "Vote for Map" };

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
  return `<button type="button" class="vt-map" data-v="${id}"><span class="vt-pic"><svg class="vt-still${f.grey ? " grey" : ""}" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${artBackdrop(f.map)}</svg></span><span class="vt-name">${esc(name)}${form ? ` <i>(${esc(form)})</i>` : ""}</span><span class="vt-n"></span><span class="vt-ducks"></span></button>`;
}
function bodyHTML(s, k) {
  const ids = voteIds(s, k);
  if (k === "map")
    return `<div class="vt-maps">${[DICE, ...ids].map(mapTile).join("")}</div>`;
  return `<div class="vt-modes">${modeRow(DICE)}${CATS.map(([cat, name]) => {
    const rows = ids.filter((id) => modeOf(id).cat === cat);
    return rows.length
      ? `<h3 class="vt-cat">${esc(name)}</h3>${rows.map(modeRow).join("")}`
      : "";
  }).join("")}</div>`;
}

function build(R) {
  const s = R.state,
    k = s.vt.k;
  closeVotes();
  const el = document.createElement("div");
  el.className = `vt vt-k-${k}`;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", TITLE[k]);
  el.innerHTML = `<header class="vt-head"><h2 class="vt-title">${rainbowHTML(TITLE[k], { seed: k === "map" ? 11 : 5 })}</h2><span class="vt-time" aria-live="off"></span></header><p class="vt-sub">${phone() ? "Tap" : "Click"} ${k === "map" ? "a map" : "a game"} to vote</p><div class="vt-box">${bodyHTML(s, k)}</div>`;
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
  };
  const pick = (e) => e.target.closest && e.target.closest("[data-v]");
  el.addEventListener("click", (e) => {
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

/* the window as the state has it: built once for each vote, then only the clock, the numbers and the ducks change */
export function paintVotes(R) {
  const s = R.state,
    vt = s.phase === "countdown" ? s.vt : null;
  if (!vt) return closeVotes();
  if (!W || W.key !== vt.k + ":" + s.at || W.R !== R) build(R);
  const left = Math.ceil(voteLeft(s, now()) / 1000),
    time = W.el.querySelector(".vt-time");
  time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  time.classList.toggle("fast", !!vt.fast);
  const votes = vt.votes || {},
    sig = JSON.stringify([votes, s.seat]);
  if (sig === W.sig) return;
  W.sig = sig;
  const by = {};
  for (const id of s.seat)
    if (votes[id] && s.players[id])
      (by[votes[id]] = by[votes[id]] || []).push(id);
  const size = W.el.classList.contains("vt-k-map") ? 44 : 36;
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
  clearTimeout(W.hold);
  cancelAnimationFrame(W.raf);
  for (const p of W.live.values()) p.destroy();
  W.el.remove();
  W = null;
}
