/* ---------- Sandbox Phase 7: Shared, the game modes and maps players put online ----------
   The owner's, Nov 19: "somewhere there is a place where you can click ... game modes that other players have uploaded",
   and 23:10Z: "It's a tab on the rooms list. Like you click the tab at the top, like you would in a window, and it takes
   you to the shared page ... the tab should be big enough to where they aren't missed."
   - The Shared tab (rooms.js) lists what players shared, newest first, by kind: Social and Special game modes, and Maps.
     Each shows its name, description, picture, who shared it and its player limit; Download keeps a copy on this device
     (a game mode in Game Settings under Custom, gmodes.js; a map in My maps, umaps.js). Delete takes back my own; Report
     sends a report (report.js).
   - Sharing needs signing in (top right), so a share stays mine on any device and only I can take it back.
   - In the database (rules in database.rules.json): shared/{id} what the list shows; sharedData/{id} the game mode or
     map itself, read on Download; sharedLast/{uid} one share every 30 s. A map comes back in as a picture made into the
     pixel look again (umaps.js mapFromObj), so nothing but a picture ever comes in; a game mode's Seriat only runs in the
     game's Sandbox. */
import { esc, openWindow, toast, confirmBox } from "./ui.js";
import { profile } from "./store.js";
import { acct, acctLink, signIn, onAccount } from "./account.js";
import { applyPalette } from "./pixelpalette.js";
import { cropFile } from "./picrop.js";
import { isUmap } from "./umaprules.js";

export const SHARE = {
  NAME: 40,
  DESC: 300,
  PIC_W: 160, // (a share's picture: the pixel look at 160 × 90)
  PIC_H: 90,
  BIG: 3000000, // (a game mode or map's letters at most)
  LIST: 150, // (the newest this many show)
};
const CATS = [
  ["all", "All"],
  ["social", "Social"],
  ["special", "Special"],
  ["maps", "Maps"],
  ["mine", "Mine"],
];
const CAT_NAME = {
  social: "Social game mode",
  special: "Special game mode",
  maps: "Map",
};
const clean = (v, n) =>
  String(v == null ? "" : v)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
const guest = () => import("./online.js").then((m) => m.connect()); // (reading: the guest sign-in, like the rooms)
const whyNot = (e) => import("./online.js").then((m) => m.whyNot(e));

/* ---------- a picture made into the pixel look, 160 × 90 ---------- */
async function smallPic(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const W = SHARE.PIC_W,
    H = SHARE.PIC_H,
    c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d", { willReadFrequently: true }),
    k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  x.imageSmoothingQuality = "high";
  x.fillStyle = "#000";
  x.fillRect(0, 0, W, H);
  x.drawImage(
    img,
    (W - img.naturalWidth * k) / 2,
    (H - img.naturalHeight * k) / 2,
    img.naturalWidth * k,
    img.naturalHeight * k,
  );
  const px = applyPalette(x.getImageData(0, 0, W, H));
  for (let p = 3; p < px.data.length; p += 4) px.data[p] = 255;
  x.putImageData(px, 0, 0);
  return c.toDataURL("image/png");
}
const fileText = (f) =>
  new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => no(r.error);
    r.readAsDataURL(f);
  });

/* ---------- Share: one of my maps (umaps.js) or game modes (gmodes.js) online ---------- */
/* kind "map" with the map, or "mode" with the game mode's id */
export async function shareWin(kind, what) {
  if (document.querySelector(".sh-sharewin")) return;
  let item = null;
  if (kind === "map") item = what;
  else {
    const G = await import("./gmodes.js");
    item = await G.readMode(what).catch(() => null);
    if (!item) return toast("That game mode isn't on this device any more.");
  }
  const name0 = kind === "map" ? item.t : item.name,
    desc0 = kind === "map" ? item.de || "" : item.desc || "",
    special = kind === "mode" && !!item.world, // (made on one of the special maps: Downpour, the cabins)
    mapPic = kind === "map" ? item.d : "";
  let pic = "";
  try {
    if (mapPic) pic = await smallPic(mapPic);
    else if (kind === "mode" && isUmap(item.map)) {
      const U = await import("./umaps.js"),
        m = (await U.listMaps()).find((x) => x.id === item.map);
      if (m) pic = await smallPic(m.d);
    }
  } catch (e) {
    pic = "";
  }
  return openWindow(
    `<h2>Share ${kind === "map" ? "a map" : "a game mode"}</h2><form class="sbp-form sh-form" autocomplete="off">
      <label class="gm-lab">Name<input class="sbp-in" maxlength="${SHARE.NAME}" value="${esc(name0)}" data-name></label>
      <label class="gm-lab">Description<textarea class="sbp-in gm-desc" maxlength="${SHARE.DESC}" rows="3" data-desc>${esc(desc0)}</textarea></label>
      ${kind === "mode" ? `<label class="gm-lab">Kind<select class="sbp-in" data-cat><option value="social"${special ? "" : " selected"}>Social</option><option value="special"${special ? " selected" : ""}>Special</option></select></label>` : ""}
      <div class="sh-picrow"><div class="sh-pic${pic ? "" : " empty"}" data-pic>${pic ? `<img src="${pic}" alt="">` : "No picture"}</div>${kind === "mode" ? `<label class="btn small ghost"><input type="file" accept="image/*" hidden data-file>Picture…</label>` : ""}</div>
      <p class="small dim sh-who" data-who></p>
      <p class="acts"><button type="submit" class="btn green" data-go>Share</button><button type="button" class="btn ghost" data-no>Cancel</button></p></form>`,
    {
      cls: "win-small sh-sharewin",
      onOpen(w, close) {
        const f = w.querySelector("form"),
          go = w.querySelector("[data-go]"),
          who = w.querySelector("[data-who]");
        const signed = () => {
          who.innerHTML = acct.uid
            ? `Shared as ${esc(profile.name)}. Anyone can download it; only you can take it back.`
            : `Sharing needs signing in, so only you can take it back. <button type="button" class="btn small" data-in>Sign in</button>`;
          go.disabled = !acct.uid;
          const b = who.querySelector("[data-in]");
          if (b)
            b.onclick = async () => {
              await signIn();
              setTimeout(() => w.isConnected && signed(), 600);
            };
        };
        signed();
        w.querySelector("[data-no]").onclick = () => close(null);
        const file = w.querySelector("[data-file]");
        if (file)
          file.onchange = async () => {
            const fl = file.files && file.files[0];
            file.value = "";
            if (!fl) return;
            try {
              const part = await cropFile(fl, {
                aspect: SHARE.PIC_W / SHARE.PIC_H,
                px: [SHARE.PIC_W, SHARE.PIC_H],
                most: SHARE.PIC_W * 4,
              }); // (cropped first, as every picture: picrop.js)
              if (!part) return;
              pic = await smallPic(await fileText(part)); // (only the pixel copy is kept)
              const box = w.querySelector("[data-pic]");
              box.classList.remove("empty");
              box.innerHTML = `<img src="${pic}" alt="">`;
            } catch (e) {
              toast("That picture could not be read.");
            }
          };
        f.onsubmit = async (e) => {
          e.preventDefault();
          const name = clean(w.querySelector("[data-name]").value, SHARE.NAME);
          if (!name || !acct.uid) return;
          go.disabled = true;
          go.textContent = "Sharing…";
          try {
            await upload(kind, item, {
              name,
              desc: clean(w.querySelector("[data-desc]").value, SHARE.DESC),
              cat:
                kind === "map"
                  ? "maps"
                  : w.querySelector("[data-cat]").value === "special"
                    ? "special"
                    : "social",
              pic,
            });
            close(true);
            toast(`Shared: ${name}`);
          } catch (err) {
            go.disabled = false;
            go.textContent = "Share";
            toast(
              /permission/i.test(String(err && (err.code || err.message)))
                ? "It couldn't share just now (one share every 30 seconds). Try again soon."
                : err && err.why
                  ? err.why
                  : await whyNot(err),
              5000,
            );
          }
        };
      },
    },
  );
}
/* what Download brings back: { v, kind, ... } as text */
async function bodyOf(kind, item) {
  if (kind === "map")
    return {
      v: 1,
      kind,
      id: item.id,
      t: item.t,
      de: item.de || "",
      ui: item.ui || "",
      d: item.d,
    };
  const data = { ...item.data, who: {} }; // (players' names stay on this device)
  let umap = null;
  if (isUmap(item.map)) {
    const U = await import("./umaps.js"),
      m = (await U.listMaps()).find((x) => x.id === item.map);
    if (m) umap = { id: m.id, t: m.t, de: m.de || "", ui: m.ui || "", d: m.d }; // (its own map comes with it)
  }
  return {
    v: 1,
    kind,
    world: item.world || "",
    map: item.map || "",
    most: item.most || 8,
    data,
    umap,
  };
}
async function upload(kind, item, o) {
  const text = JSON.stringify(await bodyOf(kind, item));
  if (text.length > SHARE.BIG) {
    const e = new Error("big");
    e.why = "That's too big to share.";
    throw e;
  }
  const A = await acctLink(),
    uid = acct.uid,
    key = A.D.push(A.ref("shared")).key,
    meta = {
      uid,
      kind,
      cat: o.cat,
      name: o.name,
      desc: o.desc,
      by: clean(profile.name, 20).replace(/@/g, "") || "Guest",
      at: A.D.serverTimestamp(),
      size: text.length,
    };
  if (kind === "mode") {
    meta.most = Math.max(1, Math.min(16, +item.most || 8));
    meta.world = clean(item.world, 40);
  }
  if (o.pic) meta.pic = o.pic;
  await A.D.update(A.root(), {
    [`shared/${key}`]: meta,
    [`sharedData/${key}`]: text,
    [`sharedLast/${uid}`]: A.D.serverTimestamp(),
  });
  return key;
}

/* ---------- Download, Delete, Report ---------- */
async function download(e) {
  const { D, ref } = await guest(),
    snap = await D.get(ref(`sharedData/${e.id}`));
  let o = null;
  try {
    o = JSON.parse(snap.val());
  } catch (err) {
    o = null;
  }
  if (!o || o.kind !== e.kind)
    throw Object.assign(new Error("gone"), { why: "It isn't there any more." });
  if (e.kind === "map") {
    const U = await import("./umaps.js"),
      m = await U.mapFromObj(o, o.id); // (its own id: downloaded again, it replaces the copy here, never a second one)
    return `Downloaded: ${m.t}. It's in My maps.`;
  }
  if (!o.data || typeof o.data !== "object" || !o.data.parts)
    throw Object.assign(new Error("bad"), {
      why: "That game mode couldn't be read.",
    });
  let map = clean(o.map, 40);
  if (o.umap) {
    const U = await import("./umaps.js"),
      m = await U.mapFromObj(o.umap, o.umap.id); // (its own map, under the id the game mode knows it by)
    map = m.id;
  }
  const G = await import("./gmodes.js"),
    name = await G.addMode({
      name: clean(e.name, SHARE.NAME) || "A shared game mode",
      desc: clean(e.desc, SHARE.DESC),
      world: clean(o.world, 40),
      map,
      most: Math.max(1, Math.min(16, +o.most || 8)),
      data: o.data,
    });
  return `Downloaded: ${name}. It's in Game Settings, under Custom.`;
}
async function takeBack(e) {
  const A = await acctLink();
  await A.D.update(A.root(), {
    [`shared/${e.id}`]: null,
    [`sharedData/${e.id}`]: null,
  });
}
function reportWin(e) {
  return openWindow(
    `<h2>Report ${esc(e.name)}</h2><form class="sbp-form" autocomplete="off"><textarea class="sbp-in gm-desc" maxlength="400" rows="4" placeholder="What's wrong with it?" aria-label="What's wrong with it"></textarea><p class="acts"><button type="submit" class="btn">Send</button><button type="button" class="btn ghost" data-no>Cancel</button></p></form>`,
    {
      cls: "win-small sh-reportwin",
      onOpen(w, close) {
        const t = w.querySelector("textarea");
        w.querySelector("[data-no]").onclick = () => close(null);
        w.querySelector("form").onsubmit = async (ev) => {
          ev.preventDefault();
          const why = clean(t.value, 400);
          if (!why) return;
          try {
            const R = await import("./report.js");
            await R.sendReport(
              `Shared ${e.kind === "map" ? "map" : "game mode"} "${e.name}" (${e.id}, by ${e.by}): ${why}`,
            );
            close(true);
            toast("Thanks! Your report is in.");
          } catch (err) {
            toast("It couldn't send just now (one report a minute).", 4000);
          }
        };
        t.focus();
      },
    },
  );
}

/* ---------- Share one of mine: my maps and game modes on this device ---------- */
async function mineWin() {
  if (document.querySelector(".sh-minewin")) return;
  const [U, G] = await Promise.all([
      import("./umaps.js"),
      import("./gmodes.js"),
    ]),
    maps = await U.listMaps(),
    modes = (await G.listModes().catch(() => [])).filter((m) => !m.game); // (the game's own aren't mine to share)
  const li = (kind, id, name, sub) =>
    `<li class="sh-mine"><span><b>${esc(name)}</b><small class="dim">${esc(sub)}</small></span><button type="button" class="btn small" data-k="${kind}" data-id="${esc(id)}">Share</button></li>`;
  return openWindow(
    `<h2>Share one of mine</h2><p class="small dim">Game modes are saved in Sandbox (G, Save game mode); maps are made in My maps.</p><ul class="sh-minelist">${
      modes.map((m) => li("mode", m.id, m.name, "Game mode")).join("") +
        maps.map((m) => li("map", m.id, m.t, "Map")).join("") ||
      '<li class="dim">Nothing made on this device yet.</li>'
    }</ul>`,
    {
      cls: "win-small sh-minewin",
      onOpen(w, close) {
        w.querySelector(".sh-minelist").addEventListener("click", (e) => {
          const b = e.target.closest("[data-k]");
          if (!b) return;
          close(null);
          if (b.dataset.k === "map")
            shareWin(
              "map",
              maps.find((m) => m.id === b.dataset.id),
            );
          else shareWin("mode", b.dataset.id);
        });
      },
    },
  );
}

/* ---------- the Shared page (the rooms screen's second tab) ---------- */
/* draws into box; returns its stop */
export function mountShared(box) {
  let cat = "all",
    all = [],
    off = null,
    gone = false,
    note = "Connecting…";
  box.innerHTML = `<div class="sh-top"><div class="sh-cats" role="group" aria-label="Kind">${CATS.map(
    ([k, n]) =>
      `<button type="button" class="btn small sh-cat${k === cat ? " on" : ""}" data-cat="${k}" aria-pressed="${k === cat}">${n}</button>`,
  ).join(
    "",
  )}</div><button type="button" class="btn small green" data-mine>Share one of mine…</button></div><ul class="sh-list"></ul>`;
  const list = box.querySelector(".sh-list");
  const card = (e) => {
    const mine = acct.uid && e.uid === acct.uid,
      sub = [
        CAT_NAME[e.cat] || "",
        e.kind === "mode" ? `up to ${e.most || 8} players` : "",
        `by ${e.by || "Guest"}`,
      ]
        .filter(Boolean)
        .join(" · ");
    return `<li class="sh-item" data-id="${esc(e.id)}"><div class="sh-pic${e.pic ? "" : " empty"}">${e.pic ? `<img src="${esc(e.pic)}" alt="" draggable="false">` : e.kind === "map" ? "Map" : "Game mode"}</div><div class="sh-say"><b>${esc(e.name)}</b>${e.desc ? `<small>${esc(e.desc)}</small>` : ""}<small class="dim">${esc(sub)}</small><span class="sh-acts"><button type="button" class="btn small yellow" data-get>Download</button>${mine ? '<button type="button" class="btn small ghost" data-del>Delete</button>' : ""}<button type="button" class="btn small ghost" data-rep>Report</button></span></div></li>`;
  };
  const draw = () => {
    const show = all.filter((e) =>
      cat === "all"
        ? true
        : cat === "mine"
          ? acct.uid && e.uid === acct.uid
          : e.cat === cat,
    );
    list.innerHTML = show.length
      ? show.map(card).join("")
      : `<li class="dim sh-none">${esc(
          note ||
            (cat === "mine"
              ? acct.uid
                ? "You haven't shared anything yet."
                : "Sign in (top right) to share your own."
              : "Nothing shared here yet. Be the first!"),
        )}</li>`;
  };
  draw();
  const unAcct = onAccount(() => !gone && draw()); // (signing in or out: Mine and Delete follow)
  box.querySelector(".sh-cats").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    cat = b.dataset.cat;
    box.querySelectorAll("[data-cat]").forEach((x) => {
      x.classList.toggle("on", x === b);
      x.setAttribute("aria-pressed", x === b);
    });
    draw();
  });
  box.querySelector("[data-mine]").onclick = () => mineWin();
  list.addEventListener("click", async (ev) => {
    const b = ev.target.closest("button"),
      li = ev.target.closest("[data-id]");
    if (!b || !li) return;
    const e = all.find((x) => x.id === li.dataset.id);
    if (!e) return;
    if (b.hasAttribute("data-rep")) return reportWin(e);
    if (b.hasAttribute("data-del")) {
      if (
        !(await confirmBox(
          `Take back ${e.name}?`,
          "It's gone from Shared. Copies already downloaded stay.",
          "Delete",
          "Keep it",
        ))
      )
        return;
      try {
        await takeBack(e);
        toast(`Deleted: ${e.name}`);
      } catch (err) {
        toast(await whyNot(err), 5000);
      }
      return;
    }
    if (b.hasAttribute("data-get")) {
      b.disabled = true;
      b.textContent = "Downloading…";
      try {
        toast(await download(e), 4000);
        b.textContent = "Downloaded";
      } catch (err) {
        b.disabled = false;
        b.textContent = "Download";
        toast(err && err.why ? err.why : await whyNot(err), 5000);
      }
    }
  });
  guest()
    .then(({ D, ref }) => {
      if (gone) return;
      off = D.onValue(
        D.query(ref("shared"), D.orderByChild("at"), D.limitToLast(SHARE.LIST)),
        (snap) => {
          all = [];
          snap.forEach((c) => {
            const v = c.val();
            if (v && v.name && (v.kind === "map" || v.kind === "mode"))
              all.push({ id: c.key, ...v });
          });
          all.reverse(); // (the newest first)
          note = "";
          draw();
        },
        async (err) => {
          note = /permission/i.test(String(err && (err.code || err.message)))
            ? "Shared isn't open yet: the database's new rules need publishing (Firebase → Realtime Database → Rules)."
            : await whyNot(err);
          draw();
        },
      );
    })
    .catch(async (err) => {
      note = await whyNot(err);
      draw();
    });
  return () => {
    gone = true;
    unAcct();
    if (off) off();
  };
}
