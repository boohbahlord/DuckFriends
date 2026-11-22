/* ---------- Sandbox Phase 6: made game modes (the screen's half; the rules' is sbsave.js sbPick and rules.js sbTest) ----------
   The owner's, Nov 19 21:59Z: "When you upload your game mode, it can have a name, it can have a description ... Under
   game settings, under G, there should be a test game mode setting. That's where their save game mode would be as well,
   right? If you leave the title of the game mode the same, then it overrides the previous file unless it's renamed."
   And the plan: "Save game mode: a name and a description; saving under the same name replaces the old one. Test game
   mode starts it as players would see it."
   - A game mode is the Sandbox as it is (sbsave.js sbSnapshot: zones, NPCs, loot, Rules, Seriat files, the map), with a
     name, a description and its player limit (Seriat's settings/limits), kept on the device of whoever saves it.
   - Played, nobody can change it (sandboxrules.js sbPlaying): no tools, no cheat mode. The host picks it in Game
     Settings, under Custom; at the start the host's device hands it to the rules instead of the New Sandbox / saves pick.
   - Test game mode (the host, in G): the build is saved, then the Sandbox starts again from it as players would see it;
     Stop test (top left, where Leave Sandbox is) starts it again from the build as it was. */
import { esc, openWindow, toast } from "./ui.js";
import { isSb, sbRule } from "./sandboxrules.js";
import { sbSnapshot, newSaveId, oldPics } from "./sbsave.js";
import { idbStore, req, done } from "./idbstore.js";

/* ---------- the store: { id, name, desc, at, made, world, map, most, data (the snapshot's text) } ---------- */
const DB = "duckfriends-modes";
const { db } = idbStore(DB, "modes");
let cache = null; // (the list as last read: Game Settings draws it at once)
/* ---------- the game's own game modes (owner card, Nov 22 16:06Z: "Ship them in the game") ----------
   Files in modes/, named in modes/index.json (a list of file names: a web host can't list a folder), each the shape
   addMode takes: { name, desc, most, world, map, data, umap? } (umap: its own made map, as shared.js keeps it). Every
   host sees them under Custom next to their own and plays them the same way; their id starts with "game:", and they
   are never replaced or deleted. */
const GAME = "game:";
const isGame = (id) => String(id || "").startsWith(GAME);
let shipped = null; // (read once a visit)
function gameModes() {
  if (!shipped)
    shipped = fetch("modes/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((list) =>
        Promise.all(
          (Array.isArray(list) ? list : []).map((f) =>
            fetch("modes/" + f)
              .then((r) => r.json())
              .then((m) => ({
                ...m,
                id: GAME + String(f).replace(/\.json$/, ""),
                game: true,
                at: 0,
                data: typeof m.data === "string" ? JSON.parse(m.data) : m.data,
              }))
              .catch(() => null),
          ),
        ),
      )
      .then((a) => a.filter((m) => m && m.name && m.data && m.data.parts));
  return shipped;
}
const az = (a, b) => a.name.localeCompare(b.name);
/* every game mode: the game's own, then this device's, each A to Z, without its data */
export async function listModes() {
  const own = await db()
      .then((d) => req(d.transaction("modes").objectStore("modes").getAll()))
      .catch(() => []), // (a window that can't keep any still sees the game's own)
    ours = await gameModes();
  cache = [...[...ours].sort(az), ...own.sort(az)].map(
    ({ id, name, desc, at, made, world, map, most, game }) => ({
      id,
      name,
      desc,
      at,
      made,
      world,
      map,
      most,
      game: !!game,
    }),
  );
  return cache;
}
export const modesNow = () => cache || [];
/* the list read again, then fn (Game Settings paints) */
export function loadModes(fn) {
  listModes()
    .then(fn)
    .catch(() => {});
}
/* one game mode with its data read, or null */
export async function readMode(id) {
  if (isGame(id)) {
    const m = (await gameModes()).find((x) => x.id === id);
    if (!m) return null;
    const data = structuredClone(m.data); // (its own copy: the file as read stays as it is)
    await oldPics(data);
    return { ...m, data };
  }
  const d = await db(),
    r = await req(d.transaction("modes").objectStore("modes").get(id));
  if (!r) return null;
  let data;
  try {
    data = JSON.parse(r.data);
  } catch (e) {
    return null;
  }
  if (await oldPics(data))
    await putMode({ ...r, data: JSON.stringify(data) }).catch(() => {}); // (only the pixels kept from now on)
  return { ...r, data };
}
async function putMode(rec) {
  if (isGame(rec.id)) throw new Error("the game's own");
  const d = await db(),
    t = d.transaction("modes", "readwrite");
  t.objectStore("modes").put(rec);
  await done(t);
}
export async function deleteMode(id) {
  if (isGame(id)) return;
  const d = await db(),
    t = d.transaction("modes", "readwrite");
  t.objectStore("modes").delete(id);
  await done(t);
  cache = (cache || []).filter((m) => m.id !== id);
}

/* ---------- G: Save game mode ---------- */
const lastName = {}; // (the session's id: the name it was last saved as a game mode, to offer it again)
export async function saveModeWin(R) {
  if (document.querySelector(".gm-savewin")) return;
  const s = R.state,
    sid = (s.sbsv && s.sbsv.id) || "",
    was = lastName[sid] || { name: (s.sbsv && s.sbsv.name) || "", desc: "" };
  const got = await openWindow(
    `<h2>Save game mode</h2><form class="sbp-form gm-form"><label class="gm-lab">Name<input class="sbp-in" maxlength="40" value="${esc(was.name)}" data-name autofocus></label><label class="gm-lab">Description<textarea class="sbp-in gm-desc" maxlength="300" rows="3" data-desc>${esc(was.desc)}</textarea></label><p class="small dim">The same name replaces the one saved before. Its player limit is in Seriat's settings/limits (now ${sbRule(s, "most")}).</p><p class="acts"><button type="submit" class="btn">Save</button><button type="button" class="btn ghost" data-no>Cancel</button></p></form>`,
    {
      cls: "win-small gm-savewin",
      onOpen: (w, close) => {
        const f = w.querySelector("form"),
          n = w.querySelector("[data-name]"),
          d = w.querySelector("[data-desc]");
        n.select();
        w.querySelector("[data-no]").onclick = () => close(null);
        f.onsubmit = (e) => {
          e.preventDefault();
          const name = n.value.replace(/\s+/g, " ").trim().slice(0, 40);
          if (name)
            close({
              name,
              desc: d.value.replace(/\s+/g, " ").trim().slice(0, 300),
            });
        };
      },
    },
  );
  if (!got) return;
  try {
    const same = (await listModes()).find(
        (m) => !m.game && m.name.toLowerCase() === got.name.toLowerCase(),
      ),
      st = R.state,
      data = sbSnapshot(st),
      now = Date.now();
    await putMode({
      id: same ? same.id : newSaveId(),
      name: got.name,
      desc: got.desc,
      at: now,
      made: same ? same.made : now,
      world: data.world,
      map: data.map,
      most: sbRule(st, "most"),
      data: JSON.stringify(data),
    });
    lastName[sid] = got;
    await listModes();
    toast(
      same ? `Game mode replaced: ${got.name}` : `Game mode saved: ${got.name}`,
    );
  } catch (e) {
    toast("This browser window can't keep game modes.");
  }
}

/* ---------- G: Test game mode, and Stop test ---------- */
let testSnap = null; // (the build before the test, on the host's device)
export async function startTest(R) {
  const s = R.state;
  if (s.hostId !== R.me || !isSb(s) || s.gmPlay || !s.sbsv) return;
  testSnap = {
    id: s.sbsv.id,
    name: s.sbsv.name,
    made: s.sbsv.made,
    data: sbSnapshot(s),
  };
  import("./sbsaves.js").then((m) => m.saveState(s)); // (kept on the device too, in case this page closes mid-test)
  R.send({ t: "sbTest", on: 1, save: testSnap });
}
export async function stopTest(R) {
  const s = R.state;
  if (s.hostId !== R.me || !s.gmTest) return;
  let back = testSnap;
  if (!back && s.sbsv) {
    const m = await import("./sbsaves.js"),
      sv = await m.readSave(s.sbsv.id).catch(() => null); // (the page closed mid-test: the build as it was saved)
    if (sv) back = { id: sv.id, name: sv.name, made: sv.made, data: sv.data };
  }
  if (!back) return toast("The build before the test wasn't found.");
  R.send({ t: "sbTest", on: 0, save: back });
  testSnap = null;
}

/* ---------- the start of a made game mode: the host's device hands it to the rules ---------- */
let autoKey = "";
/* true while the room waits on a made game mode (nobody gets the New Sandbox / saves pick) */
export function autoPick(R) {
  const s = R.state;
  if (!(s.phase === "countdown" && s.sbpk && s.options.gm)) return false;
  if (s.hostId !== R.me) return true;
  const key = s.at + ":" + s.options.gm;
  if (autoKey === key) return true;
  autoKey = key;
  readMode(s.options.gm)
    .catch(() => null)
    .then(async (m) => {
      if (!m) {
        toast(
          "That game mode isn't on this device any more: a new Sandbox starts.",
        );
        return R.send({ t: "sbPick" });
      }
      await bringModeMap(R, m);
      R.send({
        t: "sbPick",
        play: 1,
        save: { id: newSaveId(), name: m.name, made: Date.now(), data: m.data },
      });
    });
  return true;
}

/* a game mode's own made map into the room first (a shared one too: shared.js; the game's own carries it as umap) */
export async function bringModeMap(R, m) {
  const id = (m && m.data && m.data.map) || "";
  if (!/^um[a-z0-9]{8}$/.test(id)) return;
  await import("./umaps.js")
    .then(async (U) => {
      const um = m.umap
        ? { ...m.umap, id }
        : (await U.listMaps()).find((x) => x.id === id);
      if (um) U.bringMap(R, um);
    })
    .catch(() => {});
}

/* ---------- a game mode from the Shared page (shared.js), kept on this device ---------- */
/* its name stays, with a number after it when a game mode here already has that name (a download never replaces one) */
export async function addMode(m) {
  const names = new Set((await listModes()).map((x) => x.name.toLowerCase()));
  let name = m.name,
    n = 2;
  while (names.has(name.toLowerCase()))
    name = `${m.name.slice(0, 35)} (${n++})`;
  const now = Date.now();
  await putMode({
    id: newSaveId(),
    name,
    desc: m.desc,
    at: now,
    made: now,
    world: m.world,
    map: m.map,
    most: m.most,
    data: JSON.stringify(m.data),
  });
  await listModes();
  return name;
}
