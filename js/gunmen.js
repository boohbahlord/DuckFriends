/* ---------- the gunmen's looks (Dead Ducks Arcade's soldiers and criminals, Survival's sniper) ----------
   The owner, Nov 19 19:27Z: "I want Noah to send me pictures of all these different like raiders ... their looks and
   how they're handled, and maybe even small variations, like maybe glasses versus other facial apparel, different
   collar colors". Each is a duck look (duck.js) built from the players' items and the NPCs' own (outfits.js NPC_OUTFITS,
   hats.js NPC_HATS, faces.js NPC_FACES), so they match the game's art. gunmanLook(kind, n): the look of gunman number
   n, the same on every screen (the rules hand out the numbers); wounds and gore come from l4ddart.js hitsOf, as a
   zombie's. Preview: tools/gunmen-art.html */
import { CAMO } from "./outfits.js";

/* the picks, each from its number: one list per part of the look; "" is none */
const SOLDIER = {
  colors: ["#ffd23f", "#ffd23f", "#ffd23f", "#f2c230", "#ffdc5e"], // (rubber ducks: mostly the plain yellow)
  /* the camouflage they wear in the game: only what fits Downpour (the owner's, Nov 19 22:09Z: "it's not a desert").
     Every set, desert too, stays for Sandbox's appearances (CAMO_SETS) */
  camo: ["woodland", "urban"],
  vests: ["#3d4430", "#4a4536", "#2e3136", "#5a523c"],
  collars: ["#3b4a2a", "#7d7a4c", "#8a2a22", "#2b2e34", "#c9b37a", "#1f4f7a"],
  faces: [
    "",
    "",
    { id: "shades" },
    { id: "glasses", c1: "#1c1c28" },
    { id: "aviators" },
    { id: "gasmask" },
    { id: "ski", c1: "#3b4a2a" },
    { id: "ski", c1: "#26262e" },
  ],
};
const CRIMINAL = {
  colors: ["#ffd23f", "#ffd23f", "#f2c230", "#ffdc5e"],
  outfits: [
    { id: "hoodie", c1: "#2b2f3a" },
    { id: "hoodie", c1: "#6b1f2a" },
    { id: "hoodie", c1: "#8a8f9a" },
    { id: "leather", pants: "jeans" },
    { id: "plaid", c1: "#b3202a", c2: "#1c1c28" },
    { id: "plaid", c1: "#2f5fa8", c2: "#1c1c28" },
    { id: "tracksuit", c1: "#1d2a5e", c2: "#f2f2f2" },
    { id: "tracksuit", c1: "#1f6b3a", c2: "#ffd23f" },
    { id: "tracksuit", c1: "#26262e", c2: "#d7263d" },
    { id: "hoodie", c1: "#3d4a3a" },
  ],
  hats: [
    "",
    "",
    { id: "beanie", c1: "#26262e" },
    { id: "beanie", c1: "#7a2430" },
    { id: "beanie", c1: "#3d5a3a" },
    { id: "cap", c1: "#1c1c28" },
    { id: "cap", c1: "#d7263d" },
  ],
  faces: [
    "",
    { id: "ski", c1: "#26262e" },
    { id: "bandana", c1: "#b3202a" },
    { id: "bandana", c1: "#1c1c28" },
    { id: "bandana", c1: "#1f4fd8" },
    { id: "shades" },
    { id: "glasses", c1: "#1c1c28" },
  ],
};
/* a part from its list by number n and a salt, so each part varies on its own */
const at = (list, n, salt) =>
  list[
    ((Math.imul((n | 0) + 1, 2654435761) ^ Math.imul(salt, 40503)) >>> 0) %
      list.length
  ];

/* every camouflage set, each with all its soldiers' variations: Sandbox's appearances (the owner's, Nov 19 22:09Z: "here
   is the desert soldiers, and it shows all the variations of which") */
export const CAMO_SETS = ["woodland", "urban", "desert"];

/* kind: "soldier", "criminal" or "sniper". camo (soldiers): one set's name to wear only that one, or a list to pick
   from by number; the game's own list when left out */
export function gunmanLook(kind, n = 0, { camo: wear } = {}) {
  if (kind === "sniper")
    return {
      color: "#ffd23f",
      hat: { id: "ghillie" },
      outfit: { id: "ghillie" },
    };
  if (kind === "criminal") {
    const hat = at(CRIMINAL.hats, n, 3),
      face = at(CRIMINAL.faces, n, 4);
    return {
      color: at(CRIMINAL.colors, n, 1),
      outfit: { ...at(CRIMINAL.outfits, n, 2) },
      ...(hat ? { hat: { ...hat } } : {}),
      ...(face ? { face: { ...face } } : {}),
    };
  }
  const camo = typeof wear === "string" ? wear : at(wear || SOLDIER.camo, n, 2),
    face = at(SOLDIER.faces, n, 5);
  return {
    color: at(SOLDIER.colors, n, 1),
    hat: {
      id: "combat",
      c1: CAMO[camo][0], // (its cover the uniform's camouflage)
      c2: CAMO[camo][1],
      goggles: at([0, 0, 1], n, 7),
    },
    outfit: {
      id: "fatigues",
      camo,
      c2: at(SOLDIER.vests, n, 3),
      c3: at(SOLDIER.collars, n, 4),
    },
    ...(face ? { face: { ...face } } : {}),
  };
}
export const GUNMAN_PARTS = { SOLDIER, CRIMINAL };
