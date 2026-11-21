/* What goes in my duck's hand when I pick a hotbar key, in every mode (step 8e): the board's weapons, Quacky Zombies'
   slots and Mad God Justin's. game.js hands it the room through pickWith(); hotbar.js draws the bar. */
import { now as clockNow } from "./clock.js";
import { toast } from "./ui.js";
import { unlocked } from "./unlocks.js";
import { hasKey, keysOf, specialById } from "./specials.js";
import { BOARD_WEAPONS, MGJ_MELEE, THROWS } from "./guns.js";
import { CAKE_EVERY, isMgj } from "./mgjrules.js";
import {
  isL4dd,
  downArmed,
  kitOf,
  l4Hp,
  slotOfPick,
  slotsOf,
} from "./l4ddrules.js";
import { isSb } from "./sandboxrules.js";
import { whyNot } from "./sandbox.js";
import { sbHotOn } from "./sbhotview.js";
import { sbSlots, spawnOf } from "./sbhot.js";

/* what's in hand: the board's weapon kept out (held), the key last pressed (lastKey: V presses it again); Quacky
   Zombies' pick (l4Slot: 0 melee, 1 and 2 ranged, 3 the item, 4 the second item, 5 the grenades: keys 1 to 6,
   l4ddrules.js slotOfPick) and the weapon's before an item (l4Last); Mad God Justin's (mgjHold: the short sword, the
   pistol, the weapon picked up, the zebra cake), what goes back in hand once a picked-up weapon is used up or the
   zebra cake thrown (mgjBack), and the fight it was set for (mgjFight: each fight starts with the pistol out, the
   owner's, Nov 16) */
export const hand = {
  held: null,
  lastKey: -1,
  l4Slot: 0,
  l4Last: 0,
  mgjHold: "handgun",
  mgjBack: "handgun",
  mgjFight: -1,
};
/* game.js's side: R, me, bar (getters), sendMove, fire, myPick, onBoardPhase, playDuck, turned */
let C = null;
export const pickWith = (c) => (C = c);
/* Mad God Justin: a picked-up weapon used up, or the zebra cake thrown: back to the one out before (on each new state,
   and when the slider asks what's in hand, so it never picks the next one over by itself) */
export function mgjBackIfGone(s) {
  if (s.mgj && s.mgj.n !== hand.mgjFight) {
    hand.mgjFight = s.mgj.n;
    hand.mgjHold = hand.mgjBack = "handgun"; // (a new fight: the pistol in hand, the short sword on 1)
  }
  const thrown =
    hand.mgjHold === "zebra" &&
    s.mgj &&
    (s.mgj.cake || clockNow() - (s.mgj.zebraAt || 0) < CAKE_EVERY);
  if (
    (hand.mgjHold !== MGJ_MELEE &&
      hand.mgjHold !== "none" && // (an empty slot picked: nothing in hand)
      hand.mgjHold !== "handgun" &&
      hand.mgjHold !== "zebra" &&
      hand.mgjHold !== C.myPick()) ||
    thrown
  ) {
    hand.mgjHold = hand.mgjBack || MGJ_MELEE;
    if (C.me && s.phase === "boss") setTimeout(() => C.sendMove(true), 0);
  }
  hand.held = s.phase === "boss" ? hand.mgjHold : null;
}
/* Mad God Justin: what a key puts out in my hand, kept there (the owner's, Nov 3) */
export const mgjToggles = (id) =>
  id === MGJ_MELEE ||
  id === "handgun" ||
  id === "zebra" ||
  (!!id && id === C.myPick());
export function mgjOut2(id) {
  if (
    hand.mgjHold !== id &&
    (hand.mgjHold === MGJ_MELEE || hand.mgjHold === "handgun")
  )
    hand.mgjBack = hand.mgjHold; // (the one to go back to)
  hand.mgjHold = hand.held = id;
  C.sendMove(true);
}
/* the weapon in my duck's hand: the one kept out (Shift and its key); Quacky Zombies: always the one in the slot
   picked (the melee weapon at first; back to the one before when the special is used up), none while I'm down or a
   ghost */
export function heldNow() {
  if (C.R && isL4dd(C.R.state)) {
    const sl = slotsOf(C.R.state, C.R.me);
    const kit = kitOf(C.R.state, C.R.me);
    if (hand.l4Slot === 5 && !(kit && kit.g > 0))
      hand.l4Slot = sl[hand.l4Last] ? hand.l4Last : 0; // (the last grenade thrown: the weapon before it comes back)
    if (hand.l4Slot !== 5 && !sl[slotOfPick(hand.l4Slot)])
      hand.l4Slot = sl[hand.l4Last] ? hand.l4Last : 0;
    if (downArmed(C.R.state, C.R.me)) return "handgun"; // (down: the down pistol)
    if (l4Hp(C.R.state, C.R.me) <= 0) return "";
    return hand.l4Slot === 5 ? "grenade" : sl[slotOfPick(hand.l4Slot)] || "";
  }
  return hand.held && hasKey(C.playDuck(), hand.held) ? hand.held : "";
}
/* key i (0 is key 1 … 9 is key 0): an effect for 5 seconds (keep: on until kept off), a jump, or an item */
/* a number key toggles a weapon (the owner's, Nov 16): the key picks it and puts it in hand, the same key again puts it
   away, another key puts it away and takes the other. One weapon at a time, and a weapon has to be in hand to be used (a
   click, V, a phone's attack button): nothing fires beside it. toggle: a keyboard's key (a tap on a phone only picks). */
export function selectKey(i, toggle) {
  const id = keysOf(C.playDuck())[i];
  hand.lastKey = i;
  hand.held =
    BOARD_WEAPONS.includes(id) && !(toggle && hand.held === id) ? id : null;
  if (C.bar) C.bar.show(i);
  C.sendMove(true);
}
export function useKey(i, keep, toggle = false) {
  if (!C.R || !C.onBoardPhase()) return;
  if (isL4dd(C.R.state)) {
    l4Pick(i);
    return;
  }
  if (sbHotOn(C.R.state)) {
    const v = sbSlots(C.R.state, C.R.me)[i];
    if (spawnOf(v)) {
      if (C.bar) C.bar.show(i);
      const why = whyNot(C.R.state, [spawnOf(v)]); // (why it won't: at its limit, or its tab tied to no zone)
      C.R.send({ t: "sbh", k: "go", v }); // (a spawn button: it spawns)
      if (why) toast(why);
      return;
    }
  }
  if (C.bar) C.bar.show(i);
  /* an empty slot puts the weapon away (the owner's, Nov 19 21:59Z: no Shift to put it away; "you just switch to an empty
     hotbar using the number key") */
  if (!keysOf(C.playDuck())[i]) {
    if (isMgj(C.R.state)) hand.mgjHold = "none";
    hand.held = isMgj(C.R.state) ? "none" : null;
    C.sendMove(true);
    return;
  }
  if (isMgj(C.R.state)) {
    const id = keysOf(C.playDuck())[i];
    if (mgjToggles(id)) mgjOut2(id); // (kept out once picked: a click or V uses it)
    if (C.bar) setTimeout(() => C.bar && C.bar.refresh(), 60);
    return;
  } // (Mad God Justin's own keys)
  const id = keysOf(C.playDuck())[i],
    sp = specialById(id);
  if (!sp || sp.off || !(unlocked("special", id) || sbHotOn(C.R.state))) return; // (a special that's off for now, or still locked, does nothing; in Sandbox the loot is everyone's)
  hand.lastKey = i;
  if (BOARD_WEAPONS.includes(id)) {
    selectKey(i, toggle);
    if (C.bar) setTimeout(() => C.bar && C.bar.refresh(), 60);
    return;
  } // (a weapon: the number key picks it and toggles it)
  if (sp.kind === "effect")
    C.R.send({
      t: "aura",
      what: id,
      keep: !!keep || id === "invisible",
    });
  // (the Invisible duck: the key turns it on and off)
  else if (THROWS.includes(id)) {
    if (hand.held && isSb(C.R.state)) {
      hand.held = null; // (Sandbox: the key puts the weapon in hand away and throws; the owner's, Nov 19 16:38Z, "WHY THE FUCK CAN I NOT THROW THE CHAIR IN SANDBOX")
      C.sendMove(true);
    }
    if (!hand.held) C.fire(id); // (the Chair and the Zebra cake: thrown toward the mouse, but not with a weapon in hand)
  } else if (C.me && C.me.x >= 0)
    C.R.send({ t: "use", what: id, face: C.turned() ? 1 : C.me.face || 1 }); // (an item: Shift and its key use it the same way)
  if (C.bar) setTimeout(() => C.bar && C.bar.refresh(), 60);
}
/* Quacky Zombies: keys 1 to 4 pick a slot, 5 the second item and 6 the grenades (Dead Ducks Arcade and Survival). A
   melee or ranged weapon stays in hand once picked; an item (4, 5) switches on and off: on, it's in hand instead of the
   weapon, and off (or used up) that weapon is back. */
export function l4Pick(i) {
  const sl = slotsOf(C.R.state, C.R.me),
    kit = kitOf(C.R.state, C.R.me);
  if (i === 5) {
    /* the grenades are a number key now (6), and picked like a weapon: the key again puts them away (the owner's, Nov 16) */
    if (hand.l4Slot === 5) hand.l4Slot = hand.l4Last;
    else if (kit && kit.g > 0) {
      if (hand.l4Slot < 3) hand.l4Last = hand.l4Slot;
      hand.l4Slot = 5;
    } else return;
    C.sendMove(true);
    if (C.bar) C.bar.refresh();
    return;
  }
  const k = slotOfPick(i),
    item = k >= 3;
  if (k < 0 || !sl[k]) return;
  if (item) {
    if (hand.l4Slot === i) hand.l4Slot = hand.l4Last;
    else {
      if (hand.l4Slot < 3) hand.l4Last = hand.l4Slot;
      hand.l4Slot = i;
    }
  } else hand.l4Slot = hand.l4Last = i;
  C.sendMove(true);
  if (C.bar) C.bar.refresh();
}
