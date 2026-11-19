/* ---------- Sandbox: spawns and respawns (stage 2), on the screen ----------
   The owner's Sandbox file: a spawn is "a white transparent circle with a hollow middle and a white circle at it's
   center", in its own color, its name over it; a respawn looks the same "but instead they have points on four ends of
   the circle". E beside one (whoever may build) opens its settings: its name and color, what spawns, its key, the
   number boxes and the true or false boxes. A box written wrong turns red and says why; the spawn keeps its last good
   value (numerat.js). On the board the game draws them (game.js calls sbBoardMarks); on the worlds they are an activity
   of Sandbox's own (registry.js only: "sandbox"). */
import { activity } from "./hangout/registry.js";
import { W, H } from "./hangout/layout.js";
import { esc, openWindow } from "./ui.js";
import {
  isSb,
  sbCan,
  sbOnBoard,
  SB_BOXES,
  SB_FLAGS,
  SB_WHAT,
  SB_COLORS,
} from "./sandboxrules.js";
import { boxText, boxWhy, spawnsHere } from "./sbspawn.js";

/* a point's picture: the hollow ring and its middle dot (a respawn: four points on the ring too) */
function markSVG(p) {
  const c = SB_COLORS[p.col] || "#fff",
    pts =
      p.k === "respawn"
        ? [0, 90, 180, 270]
            .map((a) => {
              const r = (a * Math.PI) / 180;
              return `<circle cx="${(50 + 40 * Math.cos(r)).toFixed(1)}" cy="${(50 + 40 * Math.sin(r)).toFixed(1)}" r="7" fill="${c}" stroke="#fff" stroke-width="2"/>`;
            })
            .join("")
        : "";
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="12"/><circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-opacity="0.75" stroke-width="6"/><circle cx="50" cy="50" r="11" fill="#fff" fill-opacity="0.8" stroke="${c}" stroke-width="3"/>${pts}</svg>`;
}
/* the points on a layer: at(p) → { left, top } where its middle is (board px), size its width */
function drawMarks(layer, pts, at, size) {
  const have = new Map();
  for (const n of layer.querySelectorAll(".sb-pt")) have.set(n.dataset.p, n);
  for (const [id, n] of have) if (!pts[id]) n.remove();
  for (const [id, p] of Object.entries(pts)) {
    let n = have.get(id);
    const sig = `${p.k} ${p.col} ${boxText(p, "name")}`;
    if (!n) {
      n = document.createElement("div");
      n.className = "sb-pt";
      n.dataset.p = id;
      layer.append(n);
    }
    if (n._sig !== sig) {
      n._sig = sig;
      n.innerHTML = `<span class="sb-pt-name" style="color:${SB_COLORS[p.col] || "#fff"}">${esc(boxText(p, "name"))}</span>${markSVG(p)}`;
    }
    const c = at(p),
      st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${size.toFixed(1)}`;
    if (n._st === st) continue;
    n._st = st;
    Object.assign(n.style, {
      left: (c.left - size / 2).toFixed(1) + "px",
      top: (c.top - size * 0.3).toFixed(1) + "px",
      width: size.toFixed(1) + "px",
      height: (size * 0.6).toFixed(1) + "px",
      zIndex: Math.round(c.top - 5),
    });
  }
}
const ptsOf = (s) => (isSb(s) && s.sb && s.sb.pts) || {};
/* the board: place(o) → { left, top } (game.js place), size: a duck's width */
export function sbBoardMarks(board, s, place, size) {
  const layer = board && board.querySelector(".ducks");
  if (!layer) return;
  drawMarks(layer, sbOnBoard(s) ? ptsOf(s) : {}, place, size * 1.3);
}
/* the point nearest my duck (me: its spot, shares of the map), within reach, or null: on the board 1.5 duck lengths, on
   a world 90 world px (as its E button: the zombie maps' own E would take the key first) */
export function sbNearPoint(s, me) {
  if (!me) return null;
  const board = sbOnBoard(s);
  let best = null,
    bd = board ? 1.5 : 90;
  for (const [id, p] of Object.entries(ptsOf(s))) {
    const d = board
      ? Math.hypot((p.x - me.x) / 0.03, (p.y - me.y) / 0.08)
      : Math.hypot((p.x - me.x) * W, (p.y - me.y) * H);
    if (d < bd) {
      bd = d;
      best = id;
    }
  }
  return best;
}

/* ---------- its settings window ---------- */
const row = (f, b, t, why) =>
  `<label class="sb-row${why ? " bad" : ""}" data-row="${f}"><span>${esc(b.name)}</span><input class="sb-box" data-f="${f}" value="${esc(t)}" maxlength="${f === "key" ? 1 : 80}" spellcheck="false" autocomplete="off"><em class="sb-why">${esc(why)}</em></label>`;
/* id: the point; getR: () => the room */
export function sbSettings(getR, id) {
  const R = getR(),
    p = R && ptsOf(R.state)[id];
  if (!p || !sbCan(R.state, R.me)) return;
  const typed = (f) => (p.f[f] ? p.f[f].t : boxText(p, f)),
    why = (f) => (p.f[f] ? boxWhy(f, p.f[f].t) : ""),
    spawn = p.k === "spawn",
    what = boxText(p, "what").split(/[\s,]+/);
  const html = `<h2>${spawn ? "Spawn" : "Respawn"}</h2>
  <div class="sb-set">
    ${row("name", { name: "Name" }, typed("name"), why("name"))}
    <div class="sb-row"><span>Color</span><span class="sb-cols">${Object.entries(
      SB_COLORS,
    )
      .map(
        ([k, c]) =>
          `<button type="button" class="sb-col${p.col === k ? " on" : ""}" data-col="${k}" style="--c:${c}" aria-label="${k}"></button>`,
      )
      .join("")}</span></div>
    ${
      spawn
        ? `<div class="sb-row"><span>Spawns</span><span class="sb-what">${Object.entries(
            SB_WHAT,
          )
            .map(
              ([k, n]) =>
                `<label><input type="checkbox" data-what="${k}"${what.includes(k) ? " checked" : ""}> ${esc(n)}</label>`,
            )
            .join("")}</span></div>
    ${row("key", { name: "Spawn key" }, typed("key"), why("key"))}
    ${Object.entries(SB_BOXES)
      .map(([f, b]) => row(f, b, typed(f), why(f)))
      .join("")}
    ${Object.entries(SB_FLAGS)
      .map(([f, b]) => row(f, { name: `${b.name} (t or f)` }, typed(f), why(f)))
      .join("")}`
        : row("who", { name: "Who respawns here" }, typed("who"), why("who"))
    }
  </div>
  <p class="acts">${spawn ? `<button type="button" class="btn" data-go>Spawn</button>` : ""}<button type="button" class="btn ghost" data-del>Delete</button></p>`;
  openWindow(html, {
    cls: "sb-setwin",
    onOpen(w, close) {
      const send = (a) => {
        const r = getR();
        if (r) r.send({ t: "sb", p: id, ...a });
      };
      const timers = {};
      w.addEventListener("input", (e) => {
        const i = e.target.closest(".sb-box");
        if (!i) return;
        const f = i.dataset.f,
          bad = boxWhy(f, i.value),
          lab = i.closest(".sb-row");
        lab.classList.toggle("bad", !!bad);
        lab.querySelector(".sb-why").textContent = bad;
        clearTimeout(timers[f]);
        timers[f] = setTimeout(() => send({ k: "set", f, v: i.value }), 250);
      });
      w.addEventListener("change", (e) => {
        if (!e.target.matches("[data-what]")) return;
        const v = [...w.querySelectorAll("[data-what]:checked")]
          .map((c) => c.dataset.what)
          .join(", ");
        send({ k: "set", f: "what", v });
      });
      w.addEventListener("click", (e) => {
        const c = e.target.closest("[data-col]");
        if (c) {
          w.querySelectorAll(".sb-col").forEach((b) =>
            b.classList.toggle("on", b === c),
          );
          send({ k: "set", f: "col", v: c.dataset.col });
        }
        if (e.target.closest("[data-go]")) send({ k: "go" });
        if (e.target.closest("[data-del]")) {
          send({ k: "del" });
          close(null);
        }
      });
    },
  });
}

/* the Build window's options (sandbox.js): place a spawn or a respawn where I stand */
export const buildRows = (R) =>
  spawnsHere(R.state)
    ? [
        {
          label: "Place a spawn here",
          act: (r) => r.send({ t: "sb", k: "add", kind: "spawn" }),
        },
        {
          label: "Place a respawn here",
          act: (r) => r.send({ t: "sb", k: "add", kind: "respawn" }),
        },
      ]
    : [];

/* the worlds (the zombie cabin, Downpour): the points drawn on the ground, and E beside one opens it */
activity({
  id: "sbpoints",
  only: "sandbox",
  draw(now, ctx) {
    const s = ctx.state(),
      layer = ctx.world.board.querySelector(".ducks");
    if (!layer || !s) return;
    const size = 90 * ctx.world.sc;
    drawMarks(
      layer,
      spawnsHere(s) ? ptsOf(s) : {},
      (p) => ctx.world.toScreen(p.x * W, p.y * H, p.z || 0),
      size,
    );
  },
  near(pos, ctx) {
    const s = ctx.state();
    if (!s || !sbCan(s, ctx.me)) return null;
    let best = null,
      bd = 90;
    for (const [id, p] of Object.entries(ptsOf(s))) {
      const d = Math.hypot(p.x * W - pos.x, p.y * H - pos.y);
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    if (!best) return null;
    const k = ptsOf(s)[best].k;
    return {
      label: k === "spawn" ? "Spawn settings" : "Respawn settings",
      d: bd,
      act: () =>
        sbSettings(
          () => ({ state: ctx.state(), me: ctx.me, send: ctx.send }),
          best,
        ),
    };
  },
});
