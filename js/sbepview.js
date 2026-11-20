/* ---------- Sandbox Phase 7: what other players may do with my made NPCs and groups (P), the screen ----------
   P's "My NPCs and groups…" window (its own window: the owner's, Nov 20 04:46Z, a setting with many options opens one):
   who may put them in their spawns, zones and lists; change them (M for my NPCs, G for my groups); change their code (my
   brain files: Seriat's own rights on my my-files folder, nbperms.js); and change my saved NPCs on my device too, which
   is advised against. All for this Sandbox only (sbep.js). My lists (sbgroupview.js) sits at its foot: what of the
   others' I keep out of my own lists ("players can deselect what custom-made entities or custom-made groups are
   available for selection within the build mode ... for themselves").
   Also here: M's rows for the others' NPCs I may change (borrowed: changed in the room only, never kept on my device),
   and the watch that keeps an NPC of mine that someone I let changed (epKeep, from sbsfx.js every state). */
import { esc, openWindow, toast } from "./ui.js";
import { activeRoom } from "./net.js";
import { epOf, epMay } from "./sbep.js";
import { nbGiven } from "./nbperms.js";
import { npcById, npcSave } from "./sbnpcs.js";
import { isSb } from "./sandboxrules.js";

const MY_FILES = "my-files"; // (brainbuild.js: where my brain files are kept)
const ROWS = [
  ["u", "Use them in their spawns, zones and lists"],
  ["m", "Change them (NPCs in M, groups in B)"],
  ["c", "Change my brain files' code"],
  ["f", "Change my saved NPCs on my device too"],
];
/* who has right k now: { who: 1 } */
function whoHas(s, me, k) {
  if (k !== "c") return epOf(s, me, k);
  const out = {};
  for (const [who, bits] of nbGiven(s, me, MY_FILES))
    if (bits.includes("w")) out[who] = 1;
  return out;
}
function pickHTML(s, me, k) {
  const has = whoHas(s, me, k),
    others = Object.values(s.players).filter((p) => !p.bot && p.id !== me),
    opts = [["@o", "Everyone"], ...others.map((p) => [p.id, p.name])],
    on = opts.filter(([v]) => has[v]).map(([, n]) => n);
  return `<details class="sb-acts" data-ep="${k}"><summary>${esc(on.join(", ") || "Nobody")}</summary><span class="sb-what">${opts
    .map(
      ([v, n]) =>
        `<label><input type="checkbox" value="${esc(v)}"${has[v] ? " checked" : ""}> ${esc(n)}</label>`,
    )
    .join("")}</span></details>`;
}
export function epWin(getR) {
  if (document.querySelector(".sb-epwin")) return;
  const draw = (w) => {
    const R = getR();
    if (!R || !isSb(R.state)) return;
    const open = new Set(
      [...w.querySelectorAll("details[data-ep][open]")].map(
        (d) => d.dataset.ep,
      ),
    );
    w.querySelector(".sb-eprows").innerHTML = ROWS.map(
      ([k, label]) =>
        `<div class="sb-row" data-row="ep-${k}"><span>${esc(label)}</span>${pickHTML(R.state, R.me, k)}</div>${k === "f" ? '<p class="small sb-epwarn">Not advised: what they change in M is kept in your own NPCs, in every game you bring them to.</p>' : ""}`,
    ).join("");
    open.forEach((k) => {
      const d = w.querySelector(`details[data-ep="${k}"]`);
      if (d) d.open = true;
    });
  };
  return openWindow(
    `<h2>My NPCs and groups</h2><p class="small dim">What the others may do with the NPCs and groups you made. For this Sandbox only.</p><h3 class="sb-sect">Others may</h3><div class="sb-set sb-eprows"></div><p class="acts"><button type="button" class="btn small ghost" data-lists>My lists…</button></p>`,
    {
      cls: "win-small sb-win sb-epwin",
      onOpen(w) {
        draw(w);
        w.addEventListener("change", (e) => {
          const c = e.target.closest("details[data-ep] input"),
            R = getR();
          if (!c || !R) return;
          const k = c.closest("details").dataset.ep;
          if (k === "c")
            R.send({
              t: "nbp",
              path: MY_FILES,
              who: c.value,
              bits: c.checked ? "rw" : "",
            });
          else R.send({ t: "sbep", k, who: c.value, on: c.checked });
          setTimeout(() => w.isConnected && draw(w), 200);
        });
        w.querySelector("[data-lists]").onclick = () =>
          import("./sbgroupview.js").then((m) => m.listsRow.act(getR()));
      },
    },
  );
}

/* ---------- M: the others' NPCs I may change (in the room only) ---------- */
export function borrowRows(R) {
  const s = R.state,
    cn = (s.sb && s.sb.cn) || {};
  return Object.entries(cn)
    .filter(
      ([id, n]) =>
        n.by && n.by !== R.me && !npcById(id) && epMay(s, n.by, R.me, "m"),
    )
    .map(([id, n]) => ({
      label: `Change ${(s.players[n.by] || {}).name || "their"}'s ${n.name}`,
      win: true,
      act: (r) => {
        const was = ((r.state.sb && r.state.sb.cn) || {})[id];
        if (!was) return;
        const copy = JSON.parse(
          JSON.stringify({
            id,
            name: was.name,
            duck: was.duck,
            w: was.w,
            beh: was.beh,
            set: Object.fromEntries(
              Object.entries(was.f || {}).map(([f, b]) => [f, b.t]),
            ), // (its settings, as typed)
          }),
        );
        Promise.all([import("./customize.js"), import("./sbspawnview.js")])
          .then(([m, v]) =>
            m.openCustomize(null, {
              npc: copy,
              borrowed: true,
              set: v.madeSet,
            }),
          )
          .then(() =>
            r.send({
              t: "sb",
              k: "npc",
              n: copy,
            }),
          ); // (back to the room, changed; never kept on my device)
      },
    }));
}

/* ---------- my NPCs that someone I let changed: kept on my device too (f) ---------- */
const kept = {}; // id → the change I last kept (its et)
export function epKeep(s) {
  const R = activeRoom();
  if (!R || !isSb(s)) return;
  const cn = (s.sb && s.sb.cn) || {};
  for (const [id, n] of Object.entries(cn)) {
    if (n.by !== R.me || !n.ed || n.ed === R.me || !n.et || kept[id] >= n.et)
      continue;
    kept[id] = n.et;
    if (!epMay(s, R.me, n.ed, "f")) continue;
    const mine = npcById(id);
    if (!mine) continue;
    mine.name = n.name;
    mine.duck = JSON.parse(JSON.stringify(n.duck));
    mine.w = JSON.parse(JSON.stringify(n.w || {}));
    mine.beh = { ...mine.beh, ...(n.beh || {}) };
    mine.set = Object.fromEntries(
      Object.entries(n.f || {}).map(([f, b]) => [f, b.t]),
    );
    npcSave();
    toast(
      `${(s.players[n.ed] || {}).name || "Someone"} changed ${n.name}: kept in your NPCs.`,
    );
  }
}
