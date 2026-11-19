/* ---------- Sandbox: spawns and respawns (stage 2), on the screen ----------
   The owner's Sandbox file: a spawn is "a white transparent circle with a hollow middle and a white circle at it's
   center", in its own color, its name over it; a respawn looks the same "but instead they have points on four ends of
   the circle". E beside one (whoever may build) opens its settings: its name and color, what spawns, its key, the
   number boxes and the true or false boxes. A box written wrong turns red and says why; the spawn keeps its last good
   value (numerat.js). On the board the game draws them (game.js calls sbBoardMarks); on the worlds they are an activity
   of Sandbox's own (registry.js only: "sandbox"). */
import { activity } from "./hangout/registry.js";
import { W, H, heightAt, sortY, seenFrom, bodyZ } from "./hangout/layout.js";
import {
  npcURL,
  npcBox,
  npcName,
  isZombie,
  npcPics,
  npcReady,
  heldOf,
  handAt,
  npcShot,
} from "./sbnpcart.js";
import { goreFree } from "./wounds.js";
import { clawMark } from "./l4dd.js";
import { esc, openWindow, confirmBox } from "./ui.js";
import {
  isSb,
  sbCan,
  sbOnBoard,
  SB_BOXES,
  SB_FLAGS,
  SB_ACTS,
  SB_IMPORT,
  SB_PLAYER,
  SB_COLORS,
  SB_ZONE,
  SB_FX,
  sbZoneBox,
  baseMode,
} from "./sandboxrules.js";
import { boxText, boxWhy, spawnsHere, sbWalkOf, madeOf } from "./sbspawn.js";
import { orbFace, lootRing, lootPage, lootWire } from "./sblootview.js";
import {
  kindsFor,
  sendKinds,
  lookPage,
  lookFor,
  picFrom,
  sendPic,
} from "./sbmake.js";

/* a point's picture: the hollow ring and its middle dot (a respawn: four points on the ring too) */
function markSVG(p) {
  if (p.k === "loot") return lootRing(SB_COLORS[p.col] || "#fff"); // (a loot orb's spot: sblootview.js)
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
/* what my screen shows of Sandbox's build: zones only while my Build window is up (sandbox.js sets it) or a zone's
   window is open ("Sections colored from board build is invisible", the owner's Sandbox file) */
export const sbView = { build: false };
const building = () => sbView.build || !!document.querySelector(".sb-zonewin");
/* a mark's element on the layer (made the first time) */
function markEl(layer, have, key, cls) {
  let n = have.get(key);
  if (!n) {
    n = document.createElement("div");
    n.className = cls;
    n.dataset.p = key;
    layer.append(n);
  }
  return n;
}
/* place a mark's element: its middle at c, size wide */
function placeAt(n, c, size) {
  const st = `${c.left.toFixed(1)},${c.top.toFixed(1)},${size.toFixed(1)}`;
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: (c.left - size / 2).toFixed(1) + "px",
    top: (c.top - size * 0.3).toFixed(1) + "px",
    width: size.toFixed(1) + "px",
    height: (size * 0.6).toFixed(1) + "px",
    zIndex: Math.round(c.top - 5),
  });
}
/* a zone: its rectangle, see-through in its color, as the map draws it (its corners through at: the board and the
   worlds both draw it square to the screen), its name over it and a dot where its builder stood (E there opens it). A
   box of CSS, not a drawing: the pixel look (pxdom.js) would make a new picture of it each time the camera moves */
function zoneMark(n, p, at, s) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    z = p.z || 0,
    cs = [
      [x0, y0],
      [x1, y1],
      [p.x, p.y],
    ].map(([x, y]) => at({ x, y, z })),
    L = Math.min(cs[0].left, cs[1].left),
    T = Math.min(cs[0].top, cs[1].top),
    sig = `${p.col} ${boxText(p, "name")}`;
  if (n._sig !== sig) {
    n._sig = sig;
    n.style.setProperty("--c", SB_COLORS[p.col] || "#fff");
    n.innerHTML = `<span class="sb-zone-dot"></span><span class="sb-pt-name" style="color:var(--c)">${esc(boxText(p, "name"))}</span>`;
  }
  const st = cs
    .map((c) => `${c.left.toFixed(1)},${c.top.toFixed(1)}`)
    .join(" ");
  if (n._st === st) return;
  n._st = st;
  Object.assign(n.style, {
    left: L.toFixed(1) + "px",
    top: T.toFixed(1) + "px",
    width: Math.abs(cs[1].left - cs[0].left).toFixed(1) + "px",
    height: Math.abs(cs[1].top - cs[0].top).toFixed(1) + "px",
  });
  Object.assign(n.firstChild.style, {
    left: (cs[2].left - L).toFixed(1) + "px",
    top: (cs[2].top - T).toFixed(1) + "px",
  });
}
/* the points on a layer: at(p) → { left, top } where its middle is (board px), size its width; s: the room's state (a
   loot point's orb and its picture) */
function drawMarks(layer, pts, at, size, s) {
  const have = new Map(),
    want = new Set(),
    seeZones = building();
  for (const n of layer.querySelectorAll(".sb-pt")) have.set(n.dataset.p, n);
  for (const [id, p] of Object.entries(pts)) {
    if (p.grp) continue; // (a spawn's + page: drawn as its spawn)
    if (p.k === "zone") {
      if (!seeZones) continue;
      want.add(id);
      zoneMark(markEl(layer, have, id, "sb-pt sb-zone"), p, at, s);
      continue;
    }
    want.add(id);
    const orb = p.k === "loot" && p.orb && p.orb.dn == null, // (a zombie drop draws itself: l4dd.js)
      face = orb
        ? p.orb.w + boxText(p, "look") + ((s && s.sbImg) || {})[id]
        : "",
      away = orb && p.orb.x != null, // (its orb lies in a zone: drawn there, sbloot.js)
      n = markEl(layer, have, id, "sb-pt"),
      sig = `${p.k} ${p.col} ${boxText(p, "name")} ${away ? "" : face}`;
    if (n._sig !== sig) {
      n._sig = sig;
      n.innerHTML = `<span class="sb-pt-name" style="color:${SB_COLORS[p.col] || "#fff"}">${esc(boxText(p, "name"))}</span>${markSVG(p)}${orb && !away ? `<span class="sb-orb">${orbFace(s, id, p)}</span>` : ""}`;
    }
    placeAt(n, at(p), size);
    if (away) {
      const o = markEl(layer, have, id + "~o", "sb-pt");
      want.add(id + "~o");
      if (o._sig !== face) {
        o._sig = face;
        o.innerHTML = `<span class="sb-orb">${orbFace(s, id, p)}</span>`;
      }
      placeAt(o, at({ x: p.orb.x, y: p.orb.y, z: p.orb.z || 0 }), size);
    }
  }
  for (const [id, n] of have) if (!want.has(id)) n.remove();
}
const ptsOf = (s) => (isSb(s) && s.sb && s.sb.pts) || {};
/* the board: place(o) → { left, top } (game.js place), size: a duck's width */
export function sbBoardMarks(board, s, place, size) {
  const layer = board && board.querySelector(".ducks");
  if (!layer) return;
  drawMarks(layer, sbOnBoard(s) ? ptsOf(s) : {}, place, size * 1.3, s);
}
/* the point nearest my duck (me: its spot, shares of the map), within reach, or null: on the board 1.5 duck lengths, on
   a world 90 world px (as its E button: the zombie maps' own E would take the key first) */
export function sbNearPoint(s, me) {
  if (!me) return null;
  const board = sbOnBoard(s);
  let best = null,
    bd = board ? 1.5 : 90;
  for (const [id, p] of Object.entries(ptsOf(s))) {
    if (p.grp) continue;
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
/* a behavior list (sbbrain.js) as a dropdown of checkboxes: Players, Everything, each kind, each spawn (by its color,
   named as it's named). Its summary says what's picked */
const summaryOf = (on) =>
  on.map((c) => c.dataset.label).join(", ") || "Nothing";
function actRow(s, p, f, kinds) {
  const k = p.f[f],
    what = boxText(p, "what").split(/[\s,]+/),
    made = what.length === 1 && madeOf(s, what[0]), // (one made NPC: its own lists, sbnpcs.js)
    picked = (
      k || SB_ZONE[f]
        ? boxText(p, f) // (a zone's "Who it hits": Players unless set)
        : made
          ? made.beh[f] || ""
          : f === "target" && what.includes("zombie")
            ? "players"
            : ""
    )
      .toLowerCase()
      .split(/[\s,]+/), // (never set: a zombie goes after the players, sbbrain.js)
    opts = [
      ["players", "Players"],
      ["everything", "Everything"],
      ...kinds,
      ...Object.values(ptsOf(s))
        .filter((q) => q.k === "spawn")
        .map((q) => [q.col, `${boxText(q, "name")} spawn`]),
    ];
  return pickRow(f, SB_ACTS[f] || SB_ZONE[f].name, opts, picked);
}
/* a dropdown of checkboxes for box f: opts [value, name], the values picked (the first of each value only) */
function pickRow(f, label, opts, picked) {
  const one = opts.filter(
      (o, i, all) => all.findIndex((x) => x[0] === o[0]) === i,
    ),
    boxes = one.map(
      ([v, n]) =>
        `<label><input type="checkbox" value="${esc(v)}" data-label="${esc(n)}"${picked.includes(v) ? " checked" : ""}> ${esc(n)}</label>`,
    ),
    on = one.filter(([v]) => picked.includes(v)).map(([, n]) => n);
  return `<div class="sb-row" data-row="${f}"><span>${esc(label)}</span><details class="sb-acts" data-act="${f}"><summary>${esc(on.join(", ") || "Nothing")}</summary><span class="sb-what">${boxes.join("") || `<em class="sb-none">None placed yet</em>`}</span></details></div>`;
}
/* ---------- the settings window ----------
   A spawn's window has tabs at the top (the owner's Sandbox file): Entities (what it spawns), Players (ducks spawning
   there) and a + that adds a page of either kind, each with its own name (sbspawn.js "page": a point of its own at the
   same spot, its grp the spawn's). A respawn's has Import settings (importWin). id: the point; tab: "pl" for a spawn's
   Players tab; getR: () => the room */
const nameOf = (f) =>
  (SB_BOXES[f] || SB_FLAGS[f] || SB_PLAYER[f] || {}).name || SB_ACTS[f] || f;
const flagRow = (f, b, t, why) =>
  row(f, { name: `${b.name} (t or f)` }, t, why);
export function sbSettings(getR, id, tab = "") {
  const R = getR(),
    pts = R && ptsOf(R.state),
    p = pts && pts[id];
  if (!p || !sbCan(R.state, R.me)) return;
  const typed = (f) => (p.f[f] ? p.f[f].t : boxText(p, f)),
    why = (f) => (p.f[f] ? boxWhy(f, p.f[f].t) : ""),
    spawn = p.k === "spawn",
    loot = p.k === "loot", // (a loot orb's spot: sblootview.js)
    zone = p.k === "zone", // (a zone: sbzone.js)
    baseId = p.grp && pts[p.grp] ? p.grp : id,
    pages = Object.entries(pts).filter(([, q]) => q.grp === baseId),
    players = p.pg === "pl" || (!p.grp && tab === "pl"),
    zmaps = baseMode(R.state.options) === "l4dd",
    what = boxText(p, "what").split(/[\s,]+/),
    kinds = kindsFor(R.state),
    onlyZ = (ks) => zmaps && !ks.some((k) => k && k !== "zombie"), // (the zombie maps' zombies walk their own way: l4ddrules.js)
    look = spawn && !players && tab === "ap", // (its Appearance tab: sbmake.js)
    pick = boxText(p, "pick"),
    tabs = [
      [baseId, "", "Entities"],
      [baseId, "pl", "Players"],
      [baseId, "ap", "Appearance"],
      ...pages.map(([q, P]) => [q, "", boxText(P, "name")]),
    ],
    on = (t) =>
      t[0] === id &&
      (p.grp ? true : t[1] === (players ? "pl" : look ? "ap" : ""));
  const head = spawn
      ? `<div class="sb-tabs" role="tablist">${tabs
          .map(
            (t) =>
              `<button type="button" class="sb-tab${on(t) ? " on" : ""}" role="tab" aria-selected="${on(t)}" data-tab="${t[0]}" data-tk="${t[1]}">${esc(t[2])}</button>`,
          )
          .join(
            "",
          )}<span class="sb-plus"><button type="button" class="sb-tab" data-plus aria-label="Add a page">+</button><span class="sb-plus-pick" hidden><button type="button" class="sb-tab" data-page="ent">Entity page</button><button type="button" class="sb-tab" data-page="pl">Player page</button></span></span></div>`
      : "",
    colorRow = `<div class="sb-row"><span>Color</span><span class="sb-cols">${Object.entries(
      SB_COLORS,
    )
      .map(
        ([k, c]) =>
          `<button type="button" class="sb-col${p.col === k ? " on" : ""}" data-col="${k}" style="--c:${c}" aria-label="${k}"></button>`,
      )
      .join("")}</span></div>`;
  const entity =
    () => `${row("name", { name: "Name" }, typed("name"), why("name"))}
    ${colorRow}
    <div class="sb-row"><span>Spawns</span><span class="sb-what">${kinds
      .map(
        ([k, n]) =>
          `<label><input type="checkbox" data-what="${esc(k)}"${what.includes(k) ? " checked" : ""}> ${esc(n)}</label>`,
      )
      .join("")}</span></div>
    ${p.grp ? `<div class="sb-row"><span>Appearance</span><span class="sb-what"><button type="button" class="btn small ghost" data-ap>Change…</button></span></div>` : ""}
    <div class="sb-row" data-row="pick"${what.filter((k) => kinds.some((x) => x[0] === k)).length > 1 ? "" : " hidden"}><span>Which one</span><span class="sb-what">${[
      ["random", "Random"],
      ["shuffle", "Shuffle"],
    ]
      .map(
        ([v, n]) =>
          `<label><input type="radio" name="sb-pick" data-pick="${v}"${pick === v ? " checked" : ""}> ${n}</label>`,
      )
      .join("")}</span></div>
    <div class="sb-actrows" data-row="acts"${onlyZ(what) ? " hidden" : ""}>${Object.keys(
      SB_ACTS,
    )
      .map((f) => actRow(R.state, p, f, kinds))
      .join("")}</div>
    ${row("key", { name: "Spawn key" }, typed("key"), why("key"))}
    ${Object.entries(SB_BOXES)
      .map(([f, b]) => row(f, b, typed(f), why(f)))
      .join("")}
    ${Object.entries(SB_FLAGS)
      .map(([f, b]) => flagRow(f, b, typed(f), why(f)))
      .join("")}`;
  const playersPage =
    () => `${p.grp ? row("name", { name: "Name" }, typed("name"), why("name")) : ""}
    ${flagRow("pon", SB_PLAYER.pon, typed("pon"), why("pon"))}
    ${row("pwho", { name: "Who spawns here" }, typed("pwho"), why("pwho"))}
    ${row("php", { name: "HP (blank: the game's)" }, typed("php"), why("php"))}
    ${row("pspd", { name: "Speed (blank: the game's)" }, typed("pspd"), why("pspd"))}`;
  const respawn =
    () => `${row("name", { name: "Name" }, typed("name"), why("name"))}
    ${colorRow}
    ${row("who", { name: "Who respawns here" }, typed("who"), why("who"))}
    ${(p.im || [])
      .map((f) =>
        SB_ACTS[f]
          ? actRow(R.state, p, f, kindsFor(R.state))
          : SB_FLAGS[f]
            ? flagRow(f, SB_FLAGS[f], typed(f), why(f))
            : row(f, SB_BOXES[f], typed(f), why(f)),
      )
      .join("")}`;
  /* a zone's page: what it does and to whom, its size, and what spawns in it (sandboxrules.js SB_ZONE) */
  const zonePage = () => {
    const fx = SB_FX[boxText(p, "fx").trim()]
        ? boxText(p, "fx").trim()
        : "none",
      named = (k, end) =>
        Object.values(pts)
          .filter((q) => q.k === k && !q.grp && q.pg !== "pl")
          .map((q) => [q.col, `${boxText(q, "name")} ${end}`]),
      picked = (f) =>
        boxText(p, f)
          .toLowerCase()
          .split(/[\s,]+/);
    return `${row("name", { name: "Name" }, typed("name"), why("name"))}
    ${colorRow}
    <div class="sb-row"><span>${esc(SB_ZONE.fx.name)}</span><span class="sb-what">${Object.entries(
      SB_FX,
    )
      .map(
        ([v, n]) =>
          `<label><input type="radio" name="sb-fx" data-fx="${v}"${fx === v ? " checked" : ""}> ${n}</label>`,
      )
      .join("")}</span></div>
    <div data-fxrow="amt"${fx === "damage" || fx === "heal" ? "" : " hidden"}>${row("amt", SB_ZONE.amt, typed("amt"), why("amt"))}</div>
    <div data-fxrow="rate"${fx === "none" ? " hidden" : ""}>${row("rate", SB_ZONE.rate, typed("rate"), why("rate"))}</div>
    <div data-fxrow="zwho"${fx === "none" ? " hidden" : ""}>${actRow(R.state, p, "zwho", kinds)}</div>
    ${row("zw", SB_ZONE.zw, typed("zw"), why("zw"))}
    ${row("zh", SB_ZONE.zh, typed("zh"), why("zh"))}
    ${flagRow("pon", SB_PLAYER.pon, typed("pon"), why("pon"))}
    ${row("pwho", { name: "Who spawns here" }, typed("pwho"), why("pwho"))}
    ${pickRow("ent", SB_ZONE.ent.name, named("spawn", "spawn"), picked("ent"))}
    ${pickRow("lt", SB_ZONE.lt.name, named("loot", "loot"), picked("lt"))}`;
  };
  const html = `<h2>${loot ? "Loot" : zone ? "Zone" : spawn ? "Spawn" : "Respawn"}</h2>${head}
  <div class="sb-set">${loot ? lootPage(R.state, id, p, { row, flagRow, typed, why, colorRow }) : zone ? zonePage() : !spawn ? respawn() : players ? playersPage() : look ? lookPage(R.state, p) : entity()}</div>
  <p class="acts">${spawn && !players && !look ? `<button type="button" class="btn" data-go>Spawn</button>` : ""}${!spawn && !loot && !zone ? `<button type="button" class="btn" data-imp>Import settings</button>` : ""}<button type="button" class="btn ghost" data-del>${p.grp ? "Delete page" : "Delete"}</button></p>`;
  openWindow(html, {
    cls: zone ? "sb-setwin sb-zonewin" : "sb-setwin",
    onOpen(w, close) {
      const send = (a) => {
        const r = getR();
        if (r) r.send({ t: "sb", p: id, ...a });
      };
      const timers = {};
      if (loot) lootWire(w, id, send, getR);
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
        const t = e.target;
        if (t.matches("[data-pick]"))
          return send({ k: "set", f: "pick", v: t.dataset.pick });
        if (t.matches("[data-fx]")) {
          const v = t.dataset.fx,
            show = { amt: v === "damage" || v === "heal", rate: v !== "none" };
          show.zwho = show.rate;
          for (const [r, on] of Object.entries(show))
            w.querySelector(`[data-fxrow="${r}"]`).hidden = !on;
          return send({ k: "set", f: "fx", v });
        } // (a zone's: only the rows that matter to it)
        const act = t.closest("[data-act]");
        if (act) {
          const on = [...act.querySelectorAll("input:checked")],
            f = act.dataset.act;
          act.querySelector("summary").textContent = summaryOf(on);
          return send({
            k: "set",
            f,
            v:
              on.map((c) => c.value).join(", ") ||
              (f === "zwho" ? "nobody" : ""), // (a zone that hits nobody: its default is Players)
          });
        }
        if (t.matches("[data-look]")) {
          w.querySelectorAll(".sb-ap").forEach((l) =>
            l.classList.toggle("on", l.contains(t)),
          );
          return send({ k: "look", ap: lookFor(t.dataset.look) });
        }
        if (t.matches("[data-up]")) {
          const r = getR(),
            note = w.querySelector(".sb-up-note");
          note.textContent = "Sending…";
          return picFrom(
            t.files[0],
            w.querySelector("[data-squash]").checked,
          ).then(
            (pic) => {
              sendPic(r, id, pic);
              setTimeout(() => again(id, "ap"), 400);
            },
            (err) => {
              note.textContent = err.message;
            },
          );
        }
        if (!t.matches("[data-what]")) return;
        const on = [...w.querySelectorAll("[data-what]:checked")];
        w.querySelector('[data-row="pick"]').hidden = on.length < 2; // (Random or Shuffle: only with more than one)
        const acts = w.querySelector('[data-row="acts"]');
        if (acts) acts.hidden = onlyZ(on.map((c) => c.dataset.what));
        sendKinds(
          getR(),
          on.map((c) => c.dataset.what),
        ); // (a made NPC of mine: to the room first)
        send({
          k: "set",
          f: "what",
          v: on.map((c) => c.dataset.what).join(", "),
        });
      });
      /* again, as it is now (another tab, a new page, what was imported) */
      const again = (to, tk = "") => {
        close(null);
        setTimeout(() => sbSettings(getR, to, tk), 0);
      };
      w.addEventListener("click", (e) => {
        const c = e.target.closest("[data-col]");
        if (c) {
          w.querySelectorAll(".sb-col").forEach((b) =>
            b.classList.toggle("on", b === c),
          );
          send({ k: "set", f: "col", v: c.dataset.col });
        }
        const tb = e.target.closest("[data-tab]");
        if (tb && !tb.classList.contains("on"))
          return again(tb.dataset.tab, tb.dataset.tk);
        if (e.target.closest("[data-plus]")) {
          w.querySelector(".sb-plus-pick").hidden = false;
          e.target.closest("[data-plus]").hidden = true;
        }
        const pg = e.target.closest("[data-page]");
        if (pg) {
          const r = getR(),
            had = new Set(Object.keys(ptsOf(r.state)));
          r.send({ t: "sb", k: "page", p: baseId, kind: pg.dataset.page });
          setTimeout(() => {
            const made = Object.keys(ptsOf(getR().state)).find(
              (q) => !had.has(q),
            );
            again(made || id);
          }, 300);
        }
        if (e.target.closest("[data-ap]")) return again(id, "ap");
        if (e.target.closest("[data-go]")) send({ k: "go" });
        if (e.target.closest("[data-imp]"))
          importWin(getR, id, () => again(id));
        if (e.target.closest("[data-del]")) {
          send({ k: "del" });
          close(null);
        }
      });
    },
  });
}
/* a respawn's Import settings (the owner's Sandbox file): the spawn's settings by category, each a dropdown whose bold
   first row checks all of it; "Import" for the ones checked, or with none checked "Import all options" after an "Are you
   sure?". The button stays at the bottom while the list scrolls; options import in the spawn menu's order (sbspawn.js) */
function importWin(getR, id, then) {
  const p = ptsOf(getR().state)[id];
  if (!p) return;
  const had = p.im || [],
    html = `<h2>Import settings</h2>
  <div class="sb-imp">${SB_IMPORT.map(
    ([cat, fs], i) =>
      `<details class="sb-cat"><summary>${esc(cat)}</summary><label class="sb-cat-all"><input type="checkbox" data-cat="${i}"> <b>${esc(cat)}</b></label>${fs
        .map(
          (f) =>
            `<label><input type="checkbox" data-in="${i}" value="${f}"${had.includes(f) ? " checked disabled" : ""}> ${esc(nameOf(f))}</label>`,
        )
        .join("")}</details>`,
  ).join("")}</div>
  <p class="acts sb-imp-go"><button type="button" class="btn" data-imp-go>Import all options</button></p>`;
  openWindow(html, {
    cls: "sb-impwin",
    onOpen(w, close) {
      const picked = () =>
          [...w.querySelectorAll("[data-in]:checked:not(:disabled)")].map(
            (c) => c.value,
          ),
        label = () =>
          (w.querySelector("[data-imp-go]").textContent = picked().length
            ? "Import"
            : "Import all options");
      w.addEventListener("change", (e) => {
        const t = e.target;
        if (t.matches("[data-cat]"))
          w.querySelectorAll(
            `[data-in="${t.dataset.cat}"]:not(:disabled)`,
          ).forEach((c) => (c.checked = t.checked));
        if (t.matches("[data-in]")) {
          const i = t.dataset.in,
            all = [...w.querySelectorAll(`[data-in="${i}"]`)];
          w.querySelector(`[data-cat="${i}"]`).checked = all.every(
            (c) => c.checked,
          );
        }
        label();
      });
      w.addEventListener("click", async (e) => {
        if (!e.target.closest("[data-imp-go]")) return;
        let fs = picked();
        if (!fs.length) {
          if (!(await confirmBox("Import all options", "Are you sure?")))
            return;
          fs = SB_IMPORT.flatMap(([, f]) => f);
        }
        const r = getR();
        if (r) r.send({ t: "sb", k: "imp", p: id, fs });
        close(null);
        setTimeout(then, 300);
      });
    },
  });
}

/* the Build window's options (sandbox.js): place a spawn, a respawn, loot or a zone where I stand */
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
        {
          label: "Place loot here",
          act: (r) => r.send({ t: "sb", k: "add", kind: "loot" }),
        }, // (an orb's spot: sbloot.js)
        {
          label: "Place a zone here",
          act: (r) => r.send({ t: "sb", k: "add", kind: "zone" }),
        }, // (a zone round where I stand: sbzone.js)
      ]
    : [];

/* the worlds (the zombie cabin, Downpour): the points drawn on the ground, and E beside one opens it */
activity({
  id: "sbpoints",
  only: "sandbox",
  /* my walk: a spawn's Players tab or a respawn may give me another speed (sbspawn.js sbWalkOf) */
  speed: (pos, ctx) => sbWalkOf(ctx.state(), ctx.me),
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
      s,
    );
  },
  near(pos, ctx) {
    const s = ctx.state();
    if (!s || !sbCan(s, ctx.me)) return null;
    let best = null,
      bd = 90;
    for (const [id, p] of Object.entries(ptsOf(s))) {
      if (p.grp) continue;
      const d = Math.hypot(p.x * W - pos.x, p.y * H - pos.y);
      if (d < bd) {
        bd = d;
        best = id;
      }
    }
    if (!best) return null;
    const k = ptsOf(s)[best].k;
    return {
      label:
        k === "spawn"
          ? "Spawn settings"
          : k === "loot"
            ? "Loot settings"
            : k === "zone"
              ? "Zone settings"
              : "Respawn settings",
      d: bd,
      act: () =>
        sbSettings(
          () => ({ state: ctx.state(), me: ctx.me, send: ctx.send }),
          best,
        ),
    };
  },
});

/* ---------- Duck Cabin's zombies (sbcabin.js), drawn as Dead Ducks Arcade's are: the same picture, HP bar, wounds,
   claw marks and fall, each gliding from where it was to where the host says over one heartbeat ---------- */
const ZB = new Map(),
  GLIDE = 220; // ms (a heartbeat is 200)
function zbEl(o, layer) {
  const el = document.createElement("div"),
    box = npcBox(o);
  el.className = "l4z";
  el.innerHTML = `<div class="l4z-body"><img alt="" draggable="false"></div><span class="l4z-hp"><b></b><i></i></span>${npcName(o)}`;
  const body = el.firstChild;
  Object.assign(body.style, {
    width: box.w + "px",
    height: box.h.toFixed(1) + "px",
    left: (-box.w / 2).toFixed(1) + "px",
    top: (-box.feet).toFixed(1) + "px",
    transformOrigin: `${box.w / 2}px ${box.feet.toFixed(1)}px`,
  });
  body.style.setProperty("--feet", box.feet.toFixed(1) + "px"); // (a made NPC's weapon, at its middle: css .sb-held)
  layer.append(el);
  return {
    el,
    body,
    box,
    rd: npcReady(o),
    shot: o.sh ? o.sh[0] : 0, // (only shots from now on are drawn)
    img: body.firstChild,
    bar: el.querySelector(".l4z-hp"),
    nm: el.querySelector(".sb-npc-name"),
    tall: box.feet,
    x: o.x,
    y: o.y,
    fx: o.x,
    fy: o.y,
    tx: o.x,
    ty: o.y,
    t0: 0,
    a: o.a,
    hits: null,
  };
}
activity({
  id: "sbzombies",
  only: "sandbox",
  unmount() {
    for (const z of ZB.values()) z.el.remove();
    ZB.clear();
  },
  draw(now, ctx) {
    const s = ctx.state(),
      Wd = ctx.world,
      layer = Wd.board.querySelector(".hang-props"),
      fxl = Wd.board.querySelector(".fxl"),
      zb = (s && s.hang && s.hang.sbz && s.hang.sbz.zb) || [];
    if (!layer) return;
    npcPics(s.sbpic); // (the room's uploaded pictures: a spawn's Appearance tab)
    const t = performance.now(),
      sc = Wd.sc,
      seen = new Set();
    for (const o of zb) {
      seen.add(o.i);
      let z = ZB.get(o.i);
      if (z && z.rd !== npcReady(o)) {
        z.el.remove(); // (its picture came in: its box is the picture's now)
        z = null;
      }
      if (!z) ZB.set(o.i, (z = zbEl(o, layer)));
      if (o.x !== z.tx || o.y !== z.ty) {
        z.fx = z.x;
        z.fy = z.y;
        z.tx = o.x;
        z.ty = o.y;
        z.t0 = t;
      }
      const u = Math.min(1, (t - z.t0) / GLIDE);
      z.x = z.fx + (z.tx - z.fx) * u;
      z.y = z.fy + (z.ty - z.fy) * u;
      const h = heightAt(z.x, z.y),
        f = Wd.toScreen(z.x, z.y, h),
        hide =
          !seenFrom(z.x, z.y, Wd.inside, h) ||
          !Wd.onView(f.left - 40 * sc, f.top - 90 * sc, 80 * sc, 100 * sc);
      if (z.el.hidden !== hide) z.el.hidden = hide;
      if (o.a !== z.a) {
        if (o.a > 0 && !o.d && !hide && fxl)
          clawMark(
            fxl,
            f.left + (o.f || 1) * 44 * sc,
            f.top - 36 * sc,
            sc * 1.25,
          );
        z.a = o.a;
      }
      if (hide) continue;
      const hits = s.options.noGore ? goreFree(o.w || "") : o.w || "",
        pic = hits + (o.d && !isZombie(o) ? "+dead" : "");
      if (z.hits !== pic) {
        z.hits = pic;
        z.img.src = npcURL(o, hits);
      }
      /* a made NPC: the weapon in its hand, and its shots (sbarms.js) */
      const hd = heldOf(o);
      if ((hd && hd.w) !== z.hw) {
        z.hw = hd && hd.w;
        z.body.querySelector(".sb-held")?.remove();
        if (hd)
          z.body.insertAdjacentHTML(
            "beforeend",
            `<img class="sb-held" alt="" draggable="false" src="${hd.url}" style="--gw:${hd.gw}">`,
          );
      }
      if (o.sh && o.sh[0] !== z.shot) {
        const fresh = Date.now() - o.sh[0] < 1500;
        z.shot = o.sh[0];
        if (fresh && fxl) {
          const hand = handAt(z.box),
            to = Wd.toScreen(o.sh[1], o.sh[2], heightAt(o.sh[1], o.sh[2]));
          npcShot(
            fxl,
            f.left + (hand.x - z.box.w / 2) * sc * (o.f || 1),
            f.top - (z.box.feet - hand.y) * sc,
            to.left,
            to.top - 29 * sc,
            o.hw,
          );
        }
      }
      const hp = (Math.max(0, o.hp) / (o.l[0] || 1)).toFixed(3);
      if (z.hp !== hp) {
        z.hp = hp;
        z.bar.style.setProperty("--hp", hp);
        if (+hp < 1) z.el.classList.add("hurt");
      }
      if (o.d && !z.dead) {
        z.dead = true;
        z.el.classList.add("dead");
      }
      const tr = `translate(${f.left.toFixed(1)}px, ${f.top.toFixed(1)}px)`;
      if (z.tr !== tr) z.el.style.transform = z.tr = tr;
      const body = `scale(${((o.f || 1) < 0 ? -sc : sc).toFixed(4)}, ${sc.toFixed(4)})${o.d ? " rotate(-100deg)" : ""}`;
      if (z.bt !== body) z.body.style.transform = z.bt = body;
      if (z.k !== sc) {
        z.k = sc;
        z.el.style.setProperty("--k", sc.toFixed(3));
        if (z.nm)
          z.nm.style.setProperty("--top", (-z.tall * sc - 2).toFixed(1) + "px"); // (its name over its head)
      }
      const zi = o.d ? bodyZ(z.x, z.y, h) : Math.round(sortY(z.x, z.y, h)) + 10; // (dead: under every duck, layout.js)
      if (z.zi !== zi) z.el.style.zIndex = z.zi = zi;
    }
    for (const [i, z] of ZB)
      if (!seen.has(i)) {
        z.el.remove();
        ZB.delete(i);
      }
  },
});
