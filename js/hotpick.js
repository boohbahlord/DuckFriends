/* What goes in my duck's hand when I pick a hotbar key, in every mode (step 8e): the board's weapons, Quacky Zombies'
   slots and Mad God Justin's. game.js hands it the room through pickWith(); hotbar.js draws the bar.
   THE ONE HAND RULE, every mode (the owner's, Nov 22 19:24Z: "MAKE THE FUCKING GAME'S HOTBAR IN EVERY MODE NOT HAVE
   TOGGLE AND THE ITEM ALWAYS IN YOUR HAND IF IT ISNT AN EMPTY SLOT OR SOMETHING LIKE FLASHLIGHT"): the slot picked is
   what's in my hand. Its key again keeps it there (nothing toggles a weapon away); an empty slot, or a slot whose item
   is used rather than held (an effect, a thrown chair, Dead Ducks Arcade's flashlight), leaves the hand empty. A new
   game starts with slot 1 picked. */
import { now as clockNow } from "./clock.js";
import { toast } from "./ui.js";
import { unlocked } from "./unlocks.js";
import { hasKey, keysOf, specialById } from "./specials.js";
import { BOARD_WEAPONS, MGJ_MELEE, THROWS, loadTo } from "./guns.js";
import { CAKE_EVERY, isMgj, mgjMag } from "./mgjrules.js";
import { magOf, magSize } from "./rules.js";
import { l4Ammo } from "./l4dd.js";
import { isL4dd, downArmed, kitOf, l4Hp, slotsOf } from "./l4ddrules.js";
import { GRENADE, slotOfPick, staysPick } from "./kitslots.js";
import { whyNot } from "./sandbox.js";
import { sbHotOn, mountHotWin } from "./sbhotview.js";
import { sbSlots, spawnOf } from "./sbhot.js";

/* One machine for every mode: what's out in my hand (hand.in) and what comes back once it's put away or used up
   (hand.back). Each mode is a row of data:
   - in: the board and Mad God Justin keep a weapon's id; Quacky Zombies a pick (a slot of the kit, then the grenades:
     key = pick + 1, kitslots.js)
   - start: what's in hand at first (Mad God Justin: the pistol, each fight; the owner's, Nov 16)
   - stays: a weapon that stays in hand once picked; toggles: picked again, it goes away and the one back comes back
     (only Dead Ducks Arcade's items that switch on and off: the flashlight)
   - self: picking a weapon that stays makes it the one to come back (Quacky Zombies), or else the one before stays it
   - held(s): the weapon out in hand, for the board's ways (the board: the one in the slot picked)
   - mag(w): a gun's magazine [shots, reload ms]; reloads(s): the gun R reloads (null: none; Quacky Zombies: the one
     in hand, "" too, the rules say no); ready(s, w, now): R can reload it now; dry(s, w): no ammo left to reload with
   - empty(s): the hand empties itself (Quacky Zombies: no grenades or no slot left; Mad God Justin: the picked-up
     weapon used up or the zebra cake thrown), and backTo(s) is what comes back then */
/* a magazine that isn't full, or is full and takes one more in the chamber (guns.js loadTo), and isn't reloading (the
   board and Mad God Justin) */
const magReady = (s, w, now) => {
  const mm = magOf(s, C.R.me, now, w);
  return (mm.n > 0 || (mm.n === 0 && !!loadTo(w, 1, 1))) && !(mm.r > now);
};
const ROWS = {
  board: {
    start: null,
    held: () => weaponAt(Math.max(0, hand.lastKey)), // (the slot picked; none picked yet: slot 1)
    stays: () => false,
    toggles: () => false,
    mag: magSize,
    /* the gun in hand, or the handgun, or the first gun with a magazine on my keys */
    reloads: () => {
      const d = C.playDuck(),
        k = keysOf(d);
      return hand.held && magSize(hand.held)
        ? hand.held
        : k.includes("handgun")
          ? "handgun"
          : k.find((id) => id && magSize(id)) || null;
    },
    ready: magReady,
  },
  l4: {
    start: 0,
    held: () => null,
    stays: staysPick,
    toggles: (i) => !staysPick(i),
    self: true,
    empty: (s) => {
      const sl = slotsOf(s, C.R.me),
        kit = kitOf(s, C.R.me);
      return hand.in === GRENADE
        ? !(kit && kit.g > 0)
        : !sl[slotOfPick(hand.in)]; // (the last grenade thrown, or the item used up)
    },
    backTo: (s) => (slotsOf(s, C.R.me)[hand.back] ? hand.back : 0),
    mag: magSize,
    reloads: () => heldNow(),
    /* a gun with a magazine, or the down pistol (the bow's and the flamethrower's have none) */
    ready: (s, w) => {
      const a = l4Ammo(s, C.R.me, w);
      return (
        !!a &&
        !a.rl &&
        !a.dry &&
        !a.nr &&
        (a.up || a.f < 0.999) &&
        (a.nr !== undefined || downArmed(s, C.R.me))
      );
    },
    dry: (s, w) => {
      const a = l4Ammo(s, C.R.me, w);
      return !!(a && (a.dry || a.nr));
    },
  },
  mgj: {
    start: "handgun",
    held: (s) => (s.phase === "boss" ? hand.in : null), // (only in the fight)
    byFight: true, // (a new screen keeps it: it starts over each fight)
    stays: (id) => id === MGJ_MELEE || id === "handgun",
    toggles: () => false,
    empty: (s) =>
      (hand.in !== MGJ_MELEE &&
        hand.in !== "none" && // (an empty slot picked: nothing in hand)
        hand.in !== "handgun" &&
        hand.in !== "zebra" &&
        hand.in !== C.myPick()) ||
      (hand.in === "zebra" &&
        !!s.mgj &&
        !!(s.mgj.cake || clockNow() - (s.mgj.zebraAt || 0) < CAKE_EVERY)),
    backTo: () => hand.back || MGJ_MELEE,
    mag: mgjMag,
    /* the gun picked up, out in my hand, or the down pistol */
    reloads: () =>
      C.mgjDownGun()
        ? "handgun"
        : hand.held && hand.held === C.myPick() && mgjMag(hand.held)
          ? hand.held
          : null,
    ready: magReady,
  },
};
const rowOf = (s) => (isL4dd(s) ? "l4" : isMgj(s) ? "mgj" : "board");
/* the key last pressed (lastKey: V presses it again); fight: the Mad God Justin fight the hand was set for */
export const hand = {
  of: "",
  in: null,
  back: null,
  lastKey: -1,
  fight: -1,
  bare: false, // (Dead Ducks Arcade: an empty slot picked, nothing in hand)
  /* the board's and Mad God Justin's weapon out in hand (Mad God Justin: only in the fight), or null */
  get held() {
    return mine().held(C && C.R && C.R.state);
  },
};
/* the board's weapon on key i, usable now (a special that's off, or locked outside Sandbox, isn't), or null: what the
   slot picked puts in hand */
function weaponAt(i) {
  const id = C && C.playDuck && keysOf(C.playDuck())[i],
    sp = id && specialById(id);
  return BOARD_WEAPONS.includes(id) &&
    sp &&
    !sp.off &&
    (unlocked("special", id) || sbHotOn(C.R.state))
    ? id
    : null;
}
/* my mode's row, the hand set to its start when the mode changed */
function mine() {
  const k = C && C.R ? rowOf(C.R.state) : "board";
  if (hand.of !== k) {
    hand.of = k;
    hand.in = hand.back = ROWS[k].start;
    hand.bare = false;
  }
  return ROWS[k];
}
/* what's in hand now, in my mode's way (Quacky Zombies: the pick) */
export const handIn = () => (mine(), hand.in);
/* a new screen: the board and Quacky Zombies start over (Mad God Justin's hand goes by its fight) */
export function handReset() {
  hand.lastKey = -1;
  if (win) win.close();
  if (!(ROWS[hand.of] || {}).byFight) hand.of = "";
}
/* the bars and R ask the hand: a gun's magazine in my mode, the gun R reloads, can it now, is it out of ammo */
export const magFor = (w) => mine().mag(w);
export const reloadsNow = () => mine().reloads(C.R.state);
export const reloadReady = (s, w, now) => mine().ready(s, w, now);
export const reloadDry = (s, w) => !!(mine().dry && mine().dry(s, w));
/* x picked: the one machine */
function put(x) {
  const M = mine();
  hand.bare = false;
  if (M.toggles(x) && hand.in === x) hand.in = hand.back;
  else {
    if (M.stays(x)) {
      if (M.self) hand.back = x;
      else if (hand.in !== x && M.stays(hand.in)) hand.back = hand.in;
    } else if (M.stays(hand.in)) hand.back = hand.in;
    hand.in = x;
  }
}
/* the hand emptied itself: the one back comes back (true when it did) */
function settle(s) {
  const M = mine();
  if (hand.bare || !M.empty || !M.empty(s)) return false;
  hand.in = M.backTo(s);
  return true;
}
/* game.js's side: R, me, bar (getters), sendMove, fire, myPick, mgjDownGun, onBoardPhase, playDuck, turned */
let C = null;
export const pickWith = (c) => (C = c);
/* Mad God Justin: a picked-up weapon used up, or the zebra cake thrown: back to the one out before (on each new state,
   and when the slider asks what's in hand, so it never picks the next one over by itself) */
export function mgjBackIfGone(s) {
  mine();
  if (s.mgj && s.mgj.n !== hand.fight) {
    hand.fight = s.mgj.n;
    hand.in = hand.back = "handgun"; // (a new fight: the pistol in hand, the short sword on 1)
  }
  if (settle(s) && C.me && s.phase === "boss")
    setTimeout(() => C.sendMove(true), 0);
}
/* Mad God Justin: what a key puts out in my hand, kept there (the owner's, Nov 3) */
export const mgjInHand = (id) =>
  id === MGJ_MELEE ||
  id === "handgun" ||
  id === "zebra" ||
  (!!id && id === C.myPick());
export function mgjOut2(id) {
  put(id);
  C.sendMove(true);
}
/* the weapon in my duck's hand: the one in the slot picked; Quacky Zombies: the one in the slot picked (the melee
   weapon at first; back to the one before when the special is used up), none while I'm down or a ghost */
export function heldNow() {
  if (C.R && isL4dd(C.R.state)) {
    settle(C.R.state); // (the last grenade thrown, or the item used up: the weapon before it comes back)
    if (downArmed(C.R.state, C.R.me)) return "handgun"; // (down: the down pistol)
    if (l4Hp(C.R.state, C.R.me) <= 0 || hand.bare) return ""; // (bare: an empty slot picked)
    return hand.in === GRENADE
      ? "grenade"
      : slotsOf(C.R.state, C.R.me)[slotOfPick(hand.in)] || "";
  }
  return hand.held && hasKey(C.playDuck(), hand.held) ? hand.held : "";
}
/* key i picked (a number key, the wheel, a phone's slider): the board's slot picked is what's in hand */
export function selectKey(i) {
  hand.lastKey = i;
  if (C.bar) C.bar.show(i);
  C.sendMove(true);
}
/* key i (0 is key 1 … 9 is key 0): a weapon (in hand, the one rule above), an effect for 5 seconds (keep: on until kept
   off), a jump, or an item. One weapon at a time, and a weapon has to be in hand to be used (a click, V, a phone's
   attack button): nothing fires beside it */
export function useKey(i, keep) {
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
    if (mine() === ROWS.board && C.bar && C.bar.flash) C.bar.flash(); // ("Press H" over the bar: P5)
    if (isMgj(C.R.state)) hand.in = "none";
    else hand.lastKey = i;
    C.sendMove(true);
    return;
  }
  if (isMgj(C.R.state)) {
    const id = keysOf(C.playDuck())[i];
    if (mgjInHand(id)) mgjOut2(id); // (kept out once picked: a click or V uses it)
    if (C.bar) setTimeout(() => C.bar && C.bar.refresh(), 60);
    return;
  } // (Mad God Justin's own keys)
  const id = keysOf(C.playDuck())[i],
    sp = specialById(id);
  if (!sp || sp.off || !(unlocked("special", id) || sbHotOn(C.R.state))) return; // (a special that's off for now, or still locked, does nothing; in Sandbox the loot is everyone's)
  hand.lastKey = i;
  if (BOARD_WEAPONS.includes(id)) {
    selectKey(i);
    if (C.bar) setTimeout(() => C.bar && C.bar.refresh(), 60);
    return;
  } // (a weapon: the number key puts it in hand)
  if (sp.kind === "effect")
    C.R.send({
      t: "aura",
      what: id,
      keep: !!keep || id === "invisible",
    });
  // (the Invisible duck: the key turns it on and off)
  else if (THROWS.includes(id)) {
    C.sendMove(true); // (its slot picked: the weapon in hand is away, the owner's, Nov 19 16:38Z, "WHY THE FUCK CAN I NOT THROW THE CHAIR IN SANDBOX")
    C.fire(id); // (the Chair and the Zebra cake: thrown toward the mouse)
  } else if (C.me && C.me.x >= 0)
    C.R.send({ t: "use", what: id, face: C.turned() ? 1 : C.me.face || 1 }); // (an item: Shift and its key use it the same way)
  if (C.bar) setTimeout(() => C.bar && C.bar.refresh(), 60);
}
/* ---------- the board's H (P5, the owner's, Nov 21 18:59Z: "just click H for hotbar and you change only your hotbar")
   ----------
   my hotbar's window, Sandbox's h window as the board's breed (sbhotview.js), over the board; Sandbox has its own h,
   Quacky Zombies and Mad God Justin their own keys */
let win = null;
export const hotHOn = () =>
  !!C &&
  !!C.R &&
  C.onBoardPhase() &&
  rowOf(C.R.state) === "board" &&
  !sbHotOn(C.R.state);
export function hotH() {
  if (!hotHOn()) return false;
  if (!win || !win.el.isConnected)
    win = mountHotWin(
      document.querySelector(".game") || document.body,
      () => C.R,
    );
  win.toggle();
  return true;
}
/* Quacky Zombies: a number key picks a slot, the one after the last slot the grenades (kitslots.js). A melee or ranged
   weapon stays in hand once picked, an empty slot leaves the hand empty; an item switches on and off: on, it's in hand
   instead of the weapon, and off (or used up) that weapon is back. */
export function l4Pick(i) {
  const sl = slotsOf(C.R.state, C.R.me),
    kit = kitOf(C.R.state, C.R.me);
  mine();
  if (slotOfPick(i) < 0 && i !== GRENADE) return;
  if (i === GRENADE ? !(kit && kit.g > 0) : !sl[slotOfPick(i)])
    hand.bare = true; // (an empty slot, or no grenades: nothing in hand, the one rule)
  else put(i);
  C.sendMove(true);
  if (C.bar) C.bar.refresh();
}
