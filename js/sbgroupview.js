/* ---------- Sandbox: groups (plan Phase 5), on the screen ----------
   B's Groups row opens the list of groups and a New group button; a group opens its window: its name and outline, who
   joins (the conditions: a block by its color and purpose, a variable name, a loot taken; and who can join), what joining
   does, and the rights it gives or takes. Every block's page has a "Joins groups" list (sbspawnview.js), and every list of
   entities has the groups under the entities (my words: "Groups are added at the bottom of the list of entities"). B and G
   also have "My lists", where I keep made NPCs and groups out of my own lists. Rules: sbgroups.js */
import { epMay } from "./sbep.js";
import { esc, openWindow, toast } from "./ui.js";
import { colSwatches } from "./sbmenu.js";
import {
  isSb,
  sbMay,
  SB_COLORS,
  SB_NOCOL,
  SB_RIGHTS,
  SB_WHAT,
} from "./sandboxrules.js";
import { boxText } from "./sbspawn.js";
import { kindsFor } from "./sbmake.js";
import { lootList } from "./sbloot.js";
import {
  GR_BOX,
  GR_LISTS,
  GR_MOST,
  GR_YN,
  grOf,
  grWhy,
  grHidden,
  grLine,
  nameWord,
} from "./sbgroups.js";

const words = (t) =>
  String(t || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const ptsOf = (s) => (isSb(s) && s.sb && s.sb.pts) || {};
const PURPOSE = {
  spawn: "spawn",
  respawn: "respawn",
  zone: "zone",
  loot: "loot",
};

/* ---------- the lists ---------- */
/* the groups, as a list's options ("g:" and the id, its name), less the ones I keep out of my lists */
export function groupOpts(s, me) {
  const hid = grHidden(s, me);
  return Object.entries(grOf(s))
    .filter(
      ([id, g]) => !hid.includes("g:" + id) && epMay(s, g.by, me, "u"), // (another's: only if they let me, P: sbep.js)
    )
    .map(([id, g]) => ["g:" + id, g.n]);
}
/* the kinds a spawn can make, less the made NPCs I keep out of my lists and those their owners keep to themselves */
export function grShown(s, me, kinds) {
  const hid = grHidden(s, me),
    cn = (s.sb && s.sb.cn) || {};
  return kinds.filter(([k]) => {
    if (hid.includes(k)) return false;
    const n = String(k).startsWith("c:") && cn[k.slice(2)];
    return !n || epMay(s, n.by, me, "u");
  });
}
/* a dropdown of checkboxes, as sbspawnview.js pickRow makes them (opts: [value, name], a [null, header] starts a part) */
function drop(f, label, opts, picked, attr = "data-gact", rowId = f) {
  const seen = new Set(),
    on = [];
  const boxes = opts
    .filter(([v]) => v == null || (!seen.has(v) && seen.add(v)))
    .map(([v, n]) => {
      if (v == null) return `<em class="sb-ghead">${esc(n)}</em>`;
      if (picked.includes(v)) on.push(n);
      return `<label><input type="checkbox" value="${esc(v)}" data-label="${esc(n)}"${picked.includes(v) ? " checked" : ""}> ${esc(n)}</label>`;
    })
    .filter(
      (h, i, all) =>
        !h.startsWith("<em") || (all[i + 1] && !all[i + 1].startsWith("<em")),
    );
  return `<div class="sb-row" data-row="${rowId}"><span>${esc(label)}</span><details class="sb-acts" ${attr}="${f}"><summary>${esc(on.join(", ") || "Nothing")}</summary><span class="sb-what">${boxes.join("") || `<em class="sb-none">None placed yet</em>`}</span></details></div>`;
}
/* a block's "Joins groups" row (sbspawnview.js puts it on every page): its change goes as the block's box jg */
export function jgRow(s, me, p) {
  const opts = groupOpts(s, me).map(([v, n]) => [v.slice(2), n]);
  if (!opts.length) return "";
  return drop("jg", "Joins groups", opts, words(boxText(p, "jg")), "data-act");
}
/* who a group's lists can name: Players, Everything, the kinds, the spawns (the groups: their own dropdown under it) */
function whoOpts(s, me) {
  return [
    ["players", "Players"],
    ["everything", "Everything"],
    ...grShown(s, me, kindsFor(s)),
    ...Object.values(ptsOf(s))
      .filter((q) => q.k === "spawn")
      .map((q) => [q.col, `${boxText(q, "name")} spawn`]),
  ];
}
/* a list of who: the entities' dropdown, and the groups' own under it (the owner's: "another dropdown list and option
   below entities. That's just groups ... within the same section"); both make one list */
function whoDrops(s, me, f, label, picked) {
  const gs = groupOpts(s, me);
  return (
    drop(f, label, whoOpts(s, me), picked) +
    (gs.length ? drop(f, "Groups", gs, picked, "data-gact", f + "-g") : "")
  );
}
/* a block as a hint: "Purple zone", or "Zone, no color" */
const blockSays = (q) =>
  q.col === SB_NOCOL ? `${cap(q.k)}, no color` : `${cap(q.col)} ${q.k}`;
/* a group's conditions: each block by its color and purpose (not a colorless one: every new zone is colorless, so it would
   be all of them), each variable name with the block it's on, each loot by what it holds */
function condOpts(s) {
  const all = Object.values(ptsOf(s)).filter((q) => PURPOSE[q.k]),
    pts = all.filter((q) => q.col !== SB_NOCOL),
    named = all.filter((q) => q.f && q.f.name && q.f.name.ok),
    loot = [
      ...new Set(
        pts.filter((q) => q.k === "loot").flatMap((q) => lootList(s, q)),
      ),
    ];
  return [
    [null, "Spawned at, or stepped in"],
    ...pts.map((q) => [`${q.k}:${q.col}`, blockSays(q)]),
    [null, "Variable name"],
    ...named.map((q) => [
      `name:${nameWord(q)}`,
      `"${boxText(q, "name")}" (${blockSays(q)})`,
    ]),
    [null, "Picked up"],
    ...pts
      .filter((q) => q.k === "loot")
      .map((q) => [`loot:${q.col}`, `${cap(q.col)} loot (any)`]),
    ...loot.map((w) => [`got:${w}`, cap(w)]),
  ];
}

/* ---------- B's rows ---------- */
export const groupRows = (R) =>
  isSb(R.state) && sbMay(R.state, R.me, "b")
    ? [
        {
          label: `Groups (${Object.keys(grOf(R.state)).length})`,
          name: "Groups",
          win: true,
          act: (r) => groupsWin(() => r),
        },
        listsRow,
      ]
    : [];
/* B's and G's "My lists": the made NPCs and groups I keep out of my lists */
export const listsRow = {
  label: "My lists",
  win: true,
  act: (r) => listsWin(() => r),
};

/* the list of groups, and New group */
export function groupsWin(getR) {
  const R = getR();
  if (!R || !sbMay(R.state, R.me, "b")) return;
  const gr = grOf(R.state),
    n = Object.keys(gr).length;
  openWindow(
    `<h2>Groups</h2><div class="sb-set sb-glist">${
      Object.entries(gr)
        .map(
          ([id, g]) =>
            `<button type="button" class="btn ghost sb-gbtn" data-g="${esc(id)}">${g.ol && SB_COLORS[g.ol] ? `<i class="sb-gdot" style="--c:${SB_COLORS[g.ol]}"></i>` : ""}${esc(g.n)}</button>`,
        )
        .join("") || `<p class="sb-none">No groups yet.</p>`
    }</div><p class="acts"><button type="button" class="btn" data-gnew${n >= GR_MOST ? " disabled" : ""}>New group</button></p>`,
    {
      cls: "sb-setwin",
      onOpen(w, close) {
        w.addEventListener("click", (e) => {
          const b = e.target.closest("[data-g]");
          if (b) {
            close(null);
            return setTimeout(() => groupWin(getR, b.dataset.g), 0);
          }
          if (!e.target.closest("[data-gnew]")) return;
          const r = getR(),
            had = new Set(Object.keys(grOf(r.state)));
          if (had.size >= GR_MOST)
            return toast(`${GR_MOST} groups at most. Delete one first.`);
          r.send({ t: "sbgr", k: "new" });
          close(null);
          setTimeout(() => {
            const made = Object.keys(grOf(getR().state)).find(
              (g) => !had.has(g),
            );
            if (made) groupWin(getR, made);
          }, 300);
        });
      },
    },
  );
}

/* a group's window */
export function groupWin(getR, gid) {
  const R = getR(),
    s = R && R.state,
    g = s && grOf(s)[gid];
  if (!g || !sbMay(s, R.me, "b")) return;
  const box = (f) => {
      const b = GR_BOX[f],
        t = g[f] || "";
      return `<label class="sb-row" data-row="${f}"><span>${esc(b.name)}</span><input class="sb-box" data-gf="${f}" value="${esc(t)}" maxlength="40" spellcheck="false" autocomplete="off"><em class="sb-why"></em></label>`;
    },
    fold = (n, t, html) =>
      `<details class="sb-fold" open><summary class="sb-sect">${n}. ${t}</summary>${html}</details>`,
    right = ([k, name]) => {
      const v = g.r && (g.r[k] === 1 || g.r[k] === 0) ? g.r[k] : null;
      return `<div class="sb-row" data-row="r${k}"><span>${esc(name)}</span><span class="sb-what">${[
        [null, "Default"], // ("true, false, default": the owner's, Nov 20 17:25Z; it was Neutral)
        [1, "On"],
        [0, "Off"],
      ]
        .map(
          ([x, l]) =>
            `<button type="button" class="sb-tab${x === v ? " on" : ""}" data-gr="${k}" data-v="${x == null ? "" : x}" aria-pressed="${x === v}">${l}</button>`,
        )
        .join("")}</span></div>`;
    };
  const html = `<h2>Group</h2><div class="sb-set">
    ${fold(
      1,
      "Group",
      `<label class="sb-row" data-row="n"><span>Name</span><input class="sb-box" data-gf="n" value="${esc(g.n)}" maxlength="20" spellcheck="false" autocomplete="off"><em class="sb-why"></em></label>
      <div class="sb-row"><span>Outline</span><span class="sb-cols"><button type="button" class="sb-tab${g.ol ? "" : " on"}" data-gol="">None</button>${colSwatches(g.ol, "data-gol", false)}</span></div>`,
    )}
    ${fold(
      2,
      "Who joins",
      `${drop("c", "When", condOpts(s), words(g.c))}
      ${whoDrops(s, R.me, "who", "Who can join", words(g.who || "everything"))}
      ${Object.entries(GR_YN)
        .map(
          ([f, l]) =>
            `<div class="sb-row" data-row="${f}"><span>${esc(l)}</span><span class="sb-what">${[
              ["", "No"],
              ["1", "Yes"],
            ]
              .map(
                ([v, n]) =>
                  `<button type="button" class="sb-tab${(g[f] || "") === v ? " on" : ""}" data-gyn="${f}" data-v="${v}" aria-pressed="${(g[f] || "") === v}">${n}</button>`,
              )
              .join("")}</span></div>`,
        )
        .join("")}
      <p class="sb-tip">A block's own "Joins groups" adds to these.</p>`,
    )}
    ${fold(
      3,
      "What joining does",
      `${Object.keys(GR_BOX).map(box).join("")}
      ${Object.entries(GR_LISTS)
        .map(([f, l]) => whoDrops(s, R.me, f, l, words(g[f])))
        .join("")}`,
    )}
    ${fold(4, "Rights", SB_RIGHTS.map(right).join(""))}
  </div><p class="acts"><button type="button" class="btn ghost" data-gdel>Delete group</button></p>`;
  openWindow(html, {
    cls: "sb-setwin",
    onOpen(w, close) {
      const send = (a) => {
          const r = getR();
          if (r) r.send({ t: "sbgr", g: gid, ...a });
        },
        timers = {};
      w.addEventListener("input", (e) => {
        const i = e.target.closest("[data-gf]");
        if (!i) return;
        const f = i.dataset.gf,
          bad = grWhy(f, i.value),
          row = i.closest(".sb-row");
        row.classList.toggle("bad", !!bad);
        row.querySelector(".sb-why").textContent = bad;
        clearTimeout(timers[f]);
        if (!bad)
          timers[f] = setTimeout(() => send({ k: "set", f, v: i.value }), 250);
      });
      w.addEventListener("change", (e) => {
        const d = e.target.closest("[data-gact]");
        if (!d) return;
        const mine = [...d.querySelectorAll("input:checked")],
          on = [
            ...w.querySelectorAll(
              `[data-gact="${d.dataset.gact}"] input:checked`,
            ),
          ]; // (the entities' dropdown and the groups' under it: one list)
        d.querySelector("summary").textContent =
          mine.map((c) => c.dataset.label).join(", ") || "Nothing";
        send({
          k: "set",
          f: d.dataset.gact,
          v:
            on.map((c) => c.value).join(", ") ||
            (d.dataset.gact === "who" ? "nobody" : ""),
        });
      });
      w.addEventListener("click", (e) => {
        const c = e.target.closest("[data-gol]");
        if (c) {
          w.querySelectorAll("[data-gol]").forEach((b) =>
            b.classList.toggle("on", b === c),
          );
          return send({ k: "set", f: "ol", v: c.dataset.gol });
        }
        const yn = e.target.closest("[data-gyn]");
        if (yn) {
          yn.parentNode.querySelectorAll("[data-gyn]").forEach((b) => {
            b.classList.toggle("on", b === yn);
            b.setAttribute("aria-pressed", b === yn);
          });
          return send({ k: "set", f: yn.dataset.gyn, v: yn.dataset.v });
        }
        const r = e.target.closest("[data-gr]");
        if (r) {
          r.parentNode.querySelectorAll("[data-gr]").forEach((b) => {
            b.classList.toggle("on", b === r);
            b.setAttribute("aria-pressed", b === r);
          });
          return send({
            k: "right",
            f: r.dataset.gr,
            v: r.dataset.v === "" ? null : +r.dataset.v,
          });
        }
        if (e.target.closest("[data-gdel]")) {
          send({ k: "del" });
          close(null);
        }
      });
    },
  });
}

/* My lists: each made NPC and group, ticked while it's in my lists */
function listsWin(getR) {
  const R = getR();
  if (!R || !isSb(R.state)) return;
  const s = R.state,
    hid = grHidden(s, R.me),
    made = kindsFor(s).filter(([k]) => !SB_WHAT[k]),
    groups = Object.entries(grOf(s)).map(([id, g]) => ["g:" + id, g.n]),
    part = (t, list) =>
      list.length
        ? `<h3 class="sb-sect">${t}</h3><span class="sb-what sb-mylist">${list
            .map(
              ([k, n]) =>
                `<label><input type="checkbox" value="${esc(k)}"${hid.includes(k) ? "" : " checked"}> ${esc(n)}</label>`,
            )
            .join("")}</span>`
        : "";
  openWindow(
    `<h2>My lists</h2><div class="sb-set">${
      part("Made NPCs", made) + part("Groups", groups) ||
      `<p class="sb-none">No made NPCs or groups yet.</p>`
    }</div>`,
    {
      cls: "sb-setwin",
      onOpen(w) {
        w.addEventListener("change", () => {
          const r = getR();
          if (r)
            r.send({
              t: "sbgr",
              k: "hide",
              v: [...w.querySelectorAll("input:not(:checked)")].map(
                (c) => c.value,
              ),
            });
        });
      },
    },
  );
}

/* ---------- the outlines: each member of a group with an Outline, in its color, wherever it is drawn ---------- */
let had = new Set(),
  last = 0;
export function grLook(root, s) {
  const gm = (isSb(s) && s.sb && s.sb.gm) || {},
    t = performance.now();
  if (!root || (!had.size && !Object.keys(gm).length) || t - last < 200) return;
  last = t;
  const now = new Set(),
    color = new Map();
  for (const k of Object.keys(gm)) {
    const c = grLine(s, k);
    if (c) color.set(k, c);
  }
  if (color.size)
    for (const e of root.querySelectorAll(
      ".gduck[data-pid], .mgj-z[data-i], .l4z[data-sbi]",
    )) {
      const k = e.dataset.pid
          ? "p:" + e.dataset.pid
          : e.dataset.sbi
            ? "n:c" + e.dataset.sbi
            : "n:" + e.dataset.i,
        c = color.get(k);
      if (!c) continue;
      if (e.style.getPropertyValue("--gol") !== c)
        e.style.setProperty("--gol", c);
      e.classList.add("sb-gol");
      now.add(e);
    }
  for (const e of had) if (!now.has(e)) e.classList.remove("sb-gol");
  had = now;
}
