/* ---------- the walk-around hotbar: which key holds what (K2c) ----------
   The owner's, Nov 21 17:48Z: "in zombies and survival and every mode like that, the pistol has its own dedicated slot
   after the knife or melee. And its slot is your secondary. And your secondary is either the pistols, the bow ... The
   secondary could be daggers, though ... And then you get two primary slots, which is where all the other ranged
   weapons go". So a kit's slots are, in order: the melee weapon (key 1), the secondary (key 2), two primaries (keys 3
   and 4), two items (keys 5 and 6), then the grenades (key 7) and the flashlight (key 0). Sandbox keeps one item slot.
   Why its own file: Dead Ducks Arcade, Survival, Downpour and Sandbox's zombies all read this one table (the rules, the
   hotbar, the keys, the computer players), so moving a key is one line here: SLOTS is the kit's slots by kind, and the
   grenades come right after the last of them */
const KIT = {
  SLOTS: ["melee", "ranged", "ranged", "ranged", "special", "special"],
  SECONDARY: ["handgun", "revolver", "bow", "dagger"],
};
/* each slot's kind (its color on the bar: k-melee, k-ranged, k-special) */
export const SLOT_KINDS = KIT.SLOTS;
/* the picks (game.js l4Pick; key = pick + 1) of the grenades and of the flashlight (key 0) */
export const GRENADE = SLOT_KINDS.length;
export const LIGHT = GRENADE + 1;
/* a pick's slot in the kit, -1 for the grenades and the light; and back */
export const slotOfPick = (i) => (i >= 0 && i < GRENADE ? i : -1);
export const pickOfSlot = (k) => (k >= 0 && k < GRENADE ? k : -1);
/* the slots of each kind: the items, the secondary (the first ranged slot) and the primaries (the others) */
const slotsOfKind = (kind) =>
  SLOT_KINDS.map((k, i) => (k === kind ? i : -1)).filter((i) => i >= 0);
export const ITEM_SLOTS = slotsOfKind("special");
const GUN_SLOTS = slotsOfKind("ranged");
const SECONDARY = GUN_SLOTS[0];
export const PRIMARY = GUN_SLOTS.slice(1);
/* is weapon w a secondary (the pistols, the revolver, the bow, the daggers)? */
const isSecondary = (w) => KIT.SECONDARY.includes(w);
/* a pick that stays in hand once picked (a melee or ranged weapon); the items and the grenades switch on and off */
export const staysPick = (i) =>
  i >= 0 && i < GRENADE && SLOT_KINDS[i] !== "special";
export const isItemPick = (i) => SLOT_KINDS[i] === "special";
/* a kit's starting slots, from what it starts with (melee and secondary first), items cut to n */
export const kitSlots = (start, items = ITEM_SLOTS.length) =>
  SLOT_KINDS.map((k, i) => start[i] || "").slice(
    0,
    GRENADE - ITEM_SLOTS.length + items,
  );
/* the slot ranged weapon w goes to in slots sl (hand: the weapon in hand): a secondary its own slot; a primary an
   empty primary slot, else the primary in hand, else the first */
export const gunSlotFor = (sl, w, hand) =>
  isSecondary(w)
    ? SECONDARY
    : (PRIMARY.find((i) => !sl[i]) ??
      PRIMARY.find((i) => hand && sl[i] === hand) ??
      PRIMARY[0]);
/* the bar's row of slots, by pick (a slot not in this kit: null), then the grenades */
export const kitKeys = (sl) => [
  ...SLOT_KINDS.map((k, i) => sl[i] || null),
  "grenade",
];
/* the kit's guns and items (computer players: bots.js) */
export const gunsIn = (sl) => GUN_SLOTS.map((i) => sl[i]).filter(Boolean);
export const itemsIn = (sl) => ITEM_SLOTS.map((i) => sl[i]).filter(Boolean);
