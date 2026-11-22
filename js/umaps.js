/* ---------- Made maps: making them, and keeping them on my device (the owner's, Nov 19 22:59Z) ----------
   "They click it and they can upload an image for the map background. And they can choose if it's the default UI or if
   it's the UI for one of the noose within Konoma UIs and its variations ... Background image gets compressed to the
   same pixel quality as all of the other maps, of course. And it does away with the old image and only keeps the
   processed after image ... they can upload it by itself with its own title, description, and image".
   Made in Sandbox's G (Make a map…) or from the Map page's My maps…; kept on this device (IndexedDB), with Edit, Delete,
   Export and Import. The picture is made into the pixel look as it comes in (UMAP.W × UMAP.H, the palette's colors:
   pixelpalette.js), and only that is kept, never the file. The host brings its maps into the room (umaprules.js), where
   they're maps like the others: picked on the Map page, or in the map vote.
   A map: { id, t: title, de: description, ui: its look (UMAP_UIS), d: the picture, at: when it was last saved } */
import { esc, openWindow, confirmBox, toast } from "./ui.js";
import { applyPalette } from "./pixelpalette.js";
import { cropFile } from "./picrop.js";
import { UMAP, UMAP_UIS, isUmap } from "./umaprules.js";
import { MAPS } from "./maps.js";
import { NWK_VARIANTS } from "./nwk.js";

/* ---------- the store ---------- */
const DB = "duckfriends-maps",
  KIND = "duckfriends-map";
let dbP = null;
function db() {
  if (!dbP)
    dbP = new Promise((ok, no) => {
      const q = indexedDB.open(DB, 1);
      q.onupgradeneeded = () => {
        if (!q.result.objectStoreNames.contains("maps"))
          q.result.createObjectStore("maps", { keyPath: "id" });
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
const req = (r) =>
  new Promise((ok, no) => {
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
/* every map on this device, newest first */
export async function listMaps() {
  try {
    const d = await db(),
      all = await req(d.transaction("maps").objectStore("maps").getAll());
    return all
      .filter((m) => m && isUmap(m.id))
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  } catch (e) {
    return [];
  }
}
async function putMap(m) {
  const d = await db();
  await req(d.transaction("maps", "readwrite").objectStore("maps").put(m));
}
async function delMap(id) {
  const d = await db();
  await req(d.transaction("maps", "readwrite").objectStore("maps").delete(id));
}
const newId = () => {
  let id = "um";
  for (let i = 0; i < 8; i++)
    id += "abcdefghijklmnopqrstuvwxyz0123456789"[(Math.random() * 36) | 0];
  return id;
};

/* ---------- the picture: into the pixel look, at the size every made map has ---------- */
const PIC_TYPES = /^image\/(png|jpeg|gif|webp|bmp|avif)$/;
function readAs(file) {
  return new Promise((ok, bad) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => bad(new Error("That picture could not be read."));
    r.readAsDataURL(file);
  });
}
/* a picture (a file's data URL, or an imported map's) made into the map's pixels: cut to fill UMAP.W × UMAP.H from its
   middle, then every pixel the nearest of the game's colors; a PNG data URL */
export async function mapPixels(src) {
  const img = new Image();
  img.src = src;
  try {
    await img.decode();
  } catch (e) {
    throw new Error("That picture could not be read.");
  }
  const c = document.createElement("canvas");
  c.width = UMAP.W;
  c.height = UMAP.H;
  const x = c.getContext("2d", { willReadFrequently: true }),
    k = Math.max(UMAP.W / img.naturalWidth, UMAP.H / img.naturalHeight);
  x.imageSmoothingQuality = "high";
  x.fillStyle = "#000";
  x.fillRect(0, 0, UMAP.W, UMAP.H);
  x.drawImage(
    img,
    (UMAP.W - img.naturalWidth * k) / 2,
    (UMAP.H - img.naturalHeight * k) / 2,
    img.naturalWidth * k,
    img.naturalHeight * k,
  );
  const px = applyPalette(x.getImageData(0, 0, UMAP.W, UMAP.H));
  for (let p = 3; p < px.data.length; p += 4) px.data[p] = 255; // (a map has no holes: see-through is black)
  x.putImageData(px, 0, 0);
  return c.toDataURL("image/png");
}

/* ---------- into the room (the host's) ---------- */
const host = (R) => !!R && R.state && R.state.hostId === R.me;
/* one map into the room (again, if it changed) */
export function bringMap(R, m) {
  if (!host(R) || !m) return;
  const was = (R.state.umap || {})[m.id];
  if (
    was &&
    was.d === m.d &&
    was.t === m.t &&
    was.de === m.de &&
    was.ui === m.ui
  )
    return;
  R.send({
    t: "umap",
    k: "put",
    mid: m.id,
    m: { t: m.t, de: m.de, ui: m.ui, d: m.d },
  });
}
/* the host's maps into the room, the newest first, as many as a room holds: so they're on the Map page and in the map
   vote. Called when the host opens the Map page */
export async function bringMaps(R) {
  if (!host(R)) return;
  const all = await listMaps(),
    room = Object.keys(R.state.umap || {}),
    room0 = room.length;
  let n = room0;
  for (const m of all) {
    if (room.includes(m.id)) bringMap(R, m);
    else if (n < UMAP.MOST) {
      bringMap(R, m);
      n++;
    }
  }
}

/* ---------- the windows ---------- */
/* the looks: the game's own, the book's, and each of the book's forms (nwk.js) */
const LOOK_NAMES = {
  "": "The game's own",
  nwk: MAPS.find((m) => m[0] === "nwk")[1],
  ...Object.fromEntries(NWK_VARIANTS.map(([id, name]) => [id, name])),
};
/* Make a map (or change one): its picture, title, description and look. Resolves with the saved map, or null */
export function makeMap(R, was = null) {
  const m0 = was || { id: newId(), t: "", de: "", ui: "", d: "" };
  let d = m0.d;
  return openWindow(
    `<h2>${was ? "Change the map" : "Make a map"}</h2>
    <form class="um-form">
      <div class="um-pic">${d ? `<img src="${d}" alt="The map's picture">` : '<span class="dim">No picture yet</span>'}</div>
      <p class="acts"><label class="btn small"><input type="file" accept="image/*" hidden data-up><span data-upl>${d ? "Another picture" : "Upload a picture"}</span></label></p>
      <label class="um-row"><span>Title</span><input class="um-in" name="t" maxlength="${UMAP.T}" value="${esc(m0.t)}" required></label>
      <label class="um-row"><span>Description</span><textarea class="um-in" name="de" maxlength="${UMAP.DE}" rows="2">${esc(m0.de)}</textarea></label>
      <label class="um-row"><span>Look</span><select class="um-in" name="ui">${UMAP_UIS.map((u) => `<option value="${u}"${u === m0.ui ? " selected" : ""}>${esc(LOOK_NAMES[u] || u)}</option>`).join("")}</select></label>
      <p class="acts"><button type="submit" class="btn">Save</button><button type="button" class="btn ghost" data-no>Cancel</button></p>
    </form>`,
    {
      cls: "win-small um-win",
      onOpen(w, close) {
        const f = w.querySelector("form"),
          box = w.querySelector(".um-pic"),
          up = w.querySelector("[data-up]");
        up.onchange = async () => {
          const file = up.files && up.files[0];
          up.value = "";
          if (!file) return;
          if (!PIC_TYPES.test(file.type))
            return toast("That file is not a picture.");
          let part;
          try {
            part = await cropFile(file, {
              aspect: UMAP.W / UMAP.H,
              px: [UMAP.W / 4, UMAP.H / 4],
              most: UMAP.W * 2,
            }); // (cropped first, as every picture: picrop.js)
          } catch (e) {
            return toast(e.message);
          }
          if (!part) return;
          box.innerHTML = '<span class="dim">Making it into pixels…</span>';
          try {
            d = await mapPixels(await readAs(part)); // (only the pixels are kept: the file goes)
            box.innerHTML = `<img src="${d}" alt="The map's picture">`;
            w.querySelector("[data-upl]").textContent = "Another picture";
          } catch (e) {
            box.innerHTML = d
              ? `<img src="${d}" alt="The map's picture">`
              : '<span class="dim">No picture yet</span>';
            toast(e.message);
          }
        };
        w.querySelector("[data-no]").onclick = () => close(null);
        f.onsubmit = async (e) => {
          e.preventDefault();
          const t = f.t.value.replace(/\s+/g, " ").trim().slice(0, UMAP.T);
          if (!d) return toast("Upload a picture for the map first.");
          if (!t) return toast("Give the map a title.");
          const m = {
            id: m0.id,
            t,
            de: f.de.value.replace(/\s+/g, " ").trim().slice(0, UMAP.DE),
            ui: UMAP_UIS.includes(f.ui.value) ? f.ui.value : "",
            d,
            at: Date.now(),
          };
          try {
            await putMap(m);
          } catch (err) {
            return toast("It couldn't be saved on this device.");
          }
          bringMap(R, m); // (the host's: into the room at once)
          toast(`Saved: ${m.t}`);
          close(m);
        };
      },
    },
  );
}
/* a file to my device (Export) */
function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const fileName = (t) =>
  (t
    .replace(/[^\w -]+/g, "")
    .trim()
    .replace(/\s+/g, " ") || "map") + ".duckmap.json";
/* an exported map, read back (Import): its picture made into pixels again, so nothing but a picture ever comes in */
/* what a wrong file gets, in words (the owner's, Nov 22 01:37Z: "if I select something, nothing ever comes of it") */
const NOT_MAP =
    "That file is not a map file. Import only opens a map saved with Export.",
  A_PICTURE =
    "That's a picture, not a map file. To make a map from a picture, use New map.";
async function importMap(file) {
  if (/^(image|video)\//.test(file.type)) throw new Error(A_PICTURE);
  let o = null;
  try {
    o = JSON.parse(await file.text());
  } catch (e) {
    throw new Error(NOT_MAP);
  }
  if (!o || o.kind !== KIND) throw new Error(NOT_MAP);
  return mapFromObj(o);
}
/* a map from outside this device (a file, or the Shared page: shared.js), kept here: its picture made into pixels again,
   so nothing but a picture ever comes in. keep: the id it had where it was made (a shared game mode's own map) */
export async function mapFromObj(o, keep = "") {
  if (!o || typeof o.d !== "string" || !/^data:image\//.test(o.d))
    throw new Error("That is not a map.");
  const m = {
    id: isUmap(keep) ? keep : newId(),
    t:
      String(o.t || "A made map")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, UMAP.T) || "A made map",
    de: String(o.de || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, UMAP.DE),
    ui: UMAP_UIS.includes(o.ui) ? o.ui : "",
    d: await mapPixels(o.d),
    at: Date.now(),
  };
  await putMap(m);
  return m;
}
/* My maps: the maps on this device, each with Play (the host, between games), Change, Share (online: shared.js), Export
   and Delete; New map and
   Import at the top */
export function myMaps(R) {
  if (document.querySelector(".um-list-win")) return;
  const draw = async (w) => {
    const all = await listMaps(),
      can = host(R) && ["lobby", "over"].includes(R.state.phase),
      cur = R && R.state.options.map;
    w.querySelector(".um-list").innerHTML = all.length
      ? all
          .map(
            (m) =>
              `<li class="um-item" data-id="${m.id}"><div class="mini-map mm-made"><img src="${m.d}" alt="" draggable="false"></div><div class="um-say"><b>${esc(m.t)}</b>${m.de ? `<small class="dim">${esc(m.de)}</small>` : ""}<small class="dim">${esc(LOOK_NAMES[m.ui] || "")}</small><span class="um-acts">${can ? `<button type="button" class="btn small${cur === m.id ? " purple" : " yellow"}" data-play>${cur === m.id ? "Playing" : "Play it"}</button>` : ""}<button type="button" class="btn small ghost" data-edit>Change</button><button type="button" class="btn small ghost" data-share>Share</button><button type="button" class="btn small ghost" data-out>Export</button><button type="button" class="btn small ghost" data-del>Delete</button></span></div></li>`,
          )
          .join("")
      : '<li class="dim um-none">No maps made yet.</li>';
  };
  return openWindow(
    `<h2>My maps</h2><p class="small dim">Made from a picture, kept on this device.</p>
    <p class="acts"><button type="button" class="btn small" data-new>New map</button><label class="btn small ghost"><input type="file" accept=".json,application/json" hidden data-in>Import a map file</label></p>
    <p class="small dim um-hint">Import opens a map file saved with Export (a .json file), not a picture.</p>
    <ul class="um-list"></ul>`,
    {
      cls: "um-list-win",
      onOpen(w) {
        draw(w);
        w.querySelector("[data-new]").onclick = async () => {
          if (await makeMap(R)) draw(w);
        };
        const inp = w.querySelector("[data-in]"),
          hint = w.querySelector(".um-hint"),
          say = (t, bad) => {
            hint.textContent = t;
            hint.classList.toggle("bad", bad);
            hint.classList.toggle("dim", !bad);
          }; // (what came of it, in the window under the button: a toast alone was missed behind it)
        inp.onchange = async () => {
          const file = inp.files && inp.files[0];
          inp.value = "";
          if (!file) return;
          try {
            const m = await importMap(file);
            bringMap(R, m);
            say(`Imported: ${m.t}`, false);
            toast(`Imported: ${m.t}`);
            draw(w);
          } catch (e) {
            say(e.message, true);
          }
        };
        w.querySelector(".um-list").addEventListener("click", async (e) => {
          const li = e.target.closest("[data-id]"),
            b = e.target.closest("button");
          if (!li || e.target.closest("label, a")) return;
          const all = await listMaps(),
            m = all.find((x) => x.id === li.dataset.id);
          if (!m) return draw(w);
          /* a tap on the map itself picks it at once, like Play it (the owner's, Nov 22: it showed its description and
             picked nothing), the same as a tap on a map in Game Settings */
          if (
            b
              ? b.hasAttribute("data-play")
              : host(R) && ["lobby", "over"].includes(R.state.phase)
          ) {
            bringMap(R, m);
            R.send({ t: "options", options: { map: m.id, mapPick: "" } });
            setTimeout(() => w.isConnected && draw(w), 200);
          } else if (!b) return;
          else if (b.hasAttribute("data-share"))
            import("./shared.js").then((x) => x.shareWin("map", m));
          else if (b.hasAttribute("data-edit")) {
            if (await makeMap(R, m)) draw(w);
          } else if (b.hasAttribute("data-out"))
            download(
              fileName(m.t),
              JSON.stringify({
                kind: KIND,
                v: 1,
                t: m.t,
                de: m.de,
                ui: m.ui,
                d: m.d,
              }),
            );
          else if (b.hasAttribute("data-del")) {
            if (
              !(await confirmBox(
                `Delete ${m.t}?`,
                "It's gone from this device.",
                "Delete",
                "Keep it",
              ))
            )
              return;
            await delMap(m.id);
            if (host(R) && (R.state.umap || {})[m.id])
              R.send({ t: "umap", k: "del", mid: m.id });
            draw(w);
          }
        });
      },
    },
  );
}
