/* ---------- Sandbox: the NPCs I make (stage 3, the m window) ----------
   The owner's Sandbox file, "Entity Creation": m shows the duck customization menu for an NPC, with no player card and
   no font, a weapon section at the bottom (two primary weapons and/or a melee weapon from the zombie mode, endless ammo
   that still reloads, and the zombie's swipe) and the NPC's default behavior lists, which its spawns take on unless they
   set their own. I can make as many as I like; they're kept on this device, as my duck is (store.js), under their own
   key. Each one: { id, name, duck (a look, as profile.duck), w: { p: [two primaries], m (melee), sw (the swipe) }, beh:
   { target, ignore, avoid, protect } (the spawn boxes' words, sbbrain.js), set: { f: text } (its spawn-like settings, typed
   in M: HP, Speed, Can jump, its Brain …, sandboxrules.js SB_MSET; empty: the defaults) } */
import { botDuck } from "./botduck.js";

const KEY = "df-npcs";
export const NPC_MOST = 50; // (the most I keep)
/* a new NPC's behavior: it goes after the players, as a zombie does */
export const NPC_BEH = {
  target: "players",
  ignore: "",
  avoid: "",
  protect: "",
};

function load() {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(a) ? a.filter((n) => n && n.id && n.duck) : [];
  } catch (e) {
    return [];
  }
}
let list = load();
const write = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* full or blocked: the game goes on */
  }
};

export const npcList = () => list;
export const npcById = (id) => list.find((n) => n.id === id) || null;
/* a new one, with a random look and only the swipe, kept */
export function npcNew() {
  if (list.length >= NPC_MOST) return null;
  let k = list.length + 1;
  while (list.some((n) => n.name === "NPC " + k)) k++;
  const duck = botDuck();
  duck.keys = []; // (an NPC has no specials on keys)
  const n = {
    id:
      "n" +
      Date.now().toString(36) +
      Math.floor(Math.random() * 1296).toString(36),
    name: "NPC " + k,
    duck,
    w: { p: ["", ""], m: "", sw: true },
    beh: { ...NPC_BEH },
  };
  list = [...list, n];
  write();
  return n;
}
/* n changed (it is one of the list's own objects): kept */
export function npcSave() {
  write();
}
export function npcDel(id) {
  list = list.filter((n) => n.id !== id);
  write();
}
/* the name over it: 20 letters at most, never empty */
export const npcName = (t) =>
  String(t || "")
    .trim()
    .slice(0, 20);
