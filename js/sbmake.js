/* ---------- Sandbox: making NPCs and dressing spawns (stage 3), the screen ----------
   The owner's Sandbox file, "Entity Creation": m opens the duck customization menu for an NPC (customize.js with an NPC
   in it: no card, no font, its weapons and behavior at the bottom). I can make several; they're kept on my device
   (sbnpcs.js) and come into the room when a spawn takes one (sbspawn.js "npc"). "Custom NPCs (there may be multiple, which
   the players custom made NPCs are found down here)" in a spawn's list of what it spawns.
   A spawn's Appearance tab (the file's line 56): what those it spawns look like, "either a duck already made can be
   selected (one made by the character), one from the NPC selections, and another based on an image upload from the
   device". An upload is 2 MB at most and always made into the game's pixel look; the original is never kept (plan Phase
   3: "Every uploaded picture is made into pixels, and the original is never kept", which replaced the Compress tick). */
import { npcList, npcById, npcNew } from "./sbnpcs.js";
import { profile } from "./store.js";
import { duckSVG, squareOf, DUCK_PIC_PX } from "./duck.js";
import { esc, toast } from "./ui.js";
import { applyPalette } from "./pixelpalette.js";
import { SB_WHAT } from "./sandboxrules.js";
import { zombieURL } from "./l4ddart.js";
import { zLook } from "./mgjrules.js";
import { JUSTIN } from "./hangout/npcart.js";
import { botDuck } from "./botduck.js";
import { SB_PIC, picKey, madeOf } from "./sbspawn.js";

/* a made NPC goes to the room (again, if it's there already: it changed) */
export function shareNpc(R, n) {
  if (!R || !n) return;
  R.send({
    t: "sb",
    k: "npc",
    n: { id: n.id, name: n.name, duck: n.duck, w: n.w, beh: n.beh },
  });
}
/* the m window's options: a new NPC, then each of mine to change. Each opens Customize for it; when it shuts, the room
   gets it again if a spawn there has it */
export const npcRows = (R) => {
  const open = (r, n) => {
    if (!n) return toast("That's as many NPCs as can be kept.");
    import("./customize.js") // (loaded when it's wanted: the rules load this file too, through the screens' activities)
      .then((m) => m.openCustomize(null, { npc: n }))
      .then(() => {
        const s = r.state,
          still = npcById(n.id);
        if (still && s.sb && s.sb.cn && s.sb.cn[n.id]) shareNpc(r, still);
      });
  };
  return [
    { label: "New NPC", win: true, act: (r) => open(r, npcNew()) }, // (win: the m window goes, Customize takes the screen)
    ...npcList().map((n) => ({
      label: `Change ${n.name}`,
      win: true,
      act: (r) => open(r, npcById(n.id)),
    })),
  ];
};

/* the kinds a spawn can make, with their names: the four, the room's made NPCs (anyone's), then mine not in it yet */
export function kindsFor(s) {
  const cn = (s.sb && s.sb.cn) || {},
    mine = npcList().filter((n) => !cn[n.id]);
  return [
    ...Object.entries(SB_WHAT),
    ...Object.entries(cn).map(([id, n]) => ["c:" + id, n.name]),
    ...mine.map((n) => ["c:" + n.id, n.name]),
  ];
}
/* a kind picked in a spawn: one of my made NPCs goes to the room first (the host then knows it) */
export function sendKinds(R, ks) {
  for (const k of ks)
    if (k.startsWith("c:") && npcById(k.slice(2)))
      shareNpc(R, npcById(k.slice(2)));
}
export const kindName = (s, k) =>
  SB_WHAT[k] || (madeOf(s, k) || npcById(String(k).slice(2)) || {}).name || k;

/* ---------- the Appearance tab ---------- */
const pic = (dk) => duckSVG(dk, { size: 44, shadow: false });
/* each kind's own picture on its tile (a Blank or Test NPC: one random look, as they wear) */
let kindPics = null;
const kindPic = (k) => {
  kindPics = kindPics || {
    zombie: `<img src="${zombieURL(zLook(), 0, "")}" alt="">`,
    blank: pic(botDuck()),
    justin: pic(JUSTIN),
    test: pic(botDuck()),
  };
  return kindPics[k] || "";
};
/* its choices: [value, picture, name] ("own", "me", "c:" a made NPC's id, a kind) */
function looks() {
  return [
    ["own", '<b class="sb-ap-own">↺</b>', "Their own look"],
    ["me", pic(profile.duck), "My duck"],
    ...npcList().map((n) => ["c:" + n.id, pic(n.duck), n.name]),
    ...Object.entries(SB_WHAT).map(([k, n]) => [k, kindPic(k), n]),
  ];
}
export function lookPage(s, p) {
  const ap = p.ap || {},
    cur = ap.im ? "pic" : ap.from || ap.k || "own",
    img = ap.im && s.sbpic && s.sbpic[ap.im];
  return `<div class="sb-aps" role="radiogroup" aria-label="Appearance">${looks()
    .map(
      ([v, svg, n]) =>
        `<label class="arm-tile sb-ap${v === cur ? " on" : ""}"><input type="radio" name="sb-ap" data-look="${esc(v)}"${v === cur ? " checked" : ""}><span class="sb-ap-pic">${svg}</span><span>${esc(n)}</span></label>`,
    )
    .join("")}</div>
  <div class="sb-row sb-up"><span>A picture</span><span class="sb-what"><label class="btn small"><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden data-up>Upload</label>${img ? `<img class="sb-up-pic" src="${img.d}" alt="The picture they wear">` : ""}</span></div>
  <p class="small dim sb-up-note">2 MB at most. Made into pixels.</p>`;
}
/* the look picked: what goes to the room */
export function lookFor(v) {
  if (v === "own") return null;
  if (v === "me") return { dk: { ...profile.duck }, from: "me" };
  if (v.startsWith("c:")) {
    const n = npcById(v.slice(2));
    return n ? { dk: { ...n.duck }, from: v } : null;
  }
  return SB_WHAT[v] ? { k: v } : null;
}
/* a file made ready to send: made into the pixel look (its longest side `most` pixels, 32 as a duck is tall, through the
   game's palette, pixelpalette.js), never kept as it was; and its height over its width */
function readAs(file) {
  return new Promise((ok, bad) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => bad(new Error("That picture could not be read."));
    r.readAsDataURL(file);
  });
}
async function sizeOf(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}
export async function picFrom(file, most = 32) {
  if (!file || !/^image\/(png|jpeg|gif|webp)$/.test(file.type))
    throw new Error("That file is not a picture (PNG, JPEG, GIF or WebP).");
  if (file.size > SB_PIC.MOST) throw new Error("That picture is over 2 MB.");
  const img = await sizeOf(await readAs(file));
  return {
    d: pixelsOf(img, most),
    a: img.naturalHeight / img.naturalWidth || 1,
  };
}
/* a loaded picture, its longest side most pixels (never bigger than it is), through the game's colors: a PNG */
function pixelsOf(img, most) {
  const k = Math.min(1, most / Math.max(img.naturalWidth, img.naturalHeight)),
    c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingQuality = "high";
  x.drawImage(img, 0, 0, c.width, c.height);
  x.putImageData(applyPalette(x.getImageData(0, 0, c.width, c.height)), 0, 0);
  return c.toDataURL("image/png");
}
/* a save's or a made game mode's pictures (s.sbpic: { key: { d, a } }) kept from before every upload was made into
   pixels (an NPC's whole file, a duck's 128 px JPEG): made into pixels now, as an upload is (a square one is a duck's
   picture: duck.js DUCK_PIC_PX; any other, picFrom's 32), so only the pixels are kept (the owner's, Nov 19 23:26Z: "we
   don't have the leftover image behind"). One that already is (a PNG, 64 pixels or less) stays. Changes pics; true if
   any changed */
export async function pixelsOnly(pics) {
  let changed = false;
  for (const p of Object.values(pics && typeof pics === "object" ? pics : {})) {
    if (!p || typeof p.d !== "string" || !p.d.startsWith("data:image/"))
      continue;
    let img;
    try {
      img = await sizeOf(p.d);
    } catch (e) {
      continue;
    }
    const w = img.naturalWidth,
      h = img.naturalHeight;
    if (p.d.startsWith("data:image/png") && Math.max(w, h) <= 64) continue;
    p.d = w === h ? squareOf(img, DUCK_PIC_PX) : pixelsOf(img, 32);
    changed = true;
  }
  return changed;
}
/* the picture to the room, part by part (an online action is less than 200,000 letters), then on spawn id */
export function sendPic(R, id, pic) {
  R.send({ t: "sb", k: "look", p: id, ap: { im: sendParts(R, pic) } });
}
/* only the parts: its key in s.sbpic (a loot orb's picture too: sblootview.js) */
export function sendParts(R, { d, a }) {
  const h = picKey(d),
    n = Math.ceil(d.length / SB_PIC.PART);
  if (!(R.state.sbpic && R.state.sbpic[h]))
    for (let i = 0; i < n; i++)
      R.send({
        t: "sb",
        k: "pic",
        h,
        n: i,
        of: n,
        a,
        d: d.slice(i * SB_PIC.PART, (i + 1) * SB_PIC.PART),
      });
  return h;
}
