/* What goes in my duck's hand when I pick a hotbar key, in every mode (step 8e): the board's weapons, Quacky Zombies'
   slots. game.js hands it the room through pickWith(); hotbar.js draws the bar.
   THE ONE HAND RULE, every mode (the owner's, Nov 22 19:24Z: "MAKE THE FUCKING GAME'S HOTBAR IN EVERY MODE NOT HAVE
   TOGGLE AND THE ITEM ALWAYS IN YOUR HAND IF IT ISNT AN EMPTY SLOT OR SOMETHING LIKE FLASHLIGHT"): the slot picked is
   what's in my hand. Its key again keeps it there (nothing toggles a weapon away); an empty slot, or a slot whose item
   is used rather than held (an effect, a thrown chair, Dead Ducks Arcade's flashlight), leaves the hand empty. A new
   game starts with slot 1 picked. */
import { now as clockNow } from "./clock.js";
import { toast } from "./ui.js";
import { unlocked } from "./unlocks.js";
import { hasKey, keysOf, specialById } from "./specials.js";
import { BOARD_WEAPONS, THROWS, loadTo } from "./guns.js";
import { capOf, magOf, reloadTo } from "./ammo.js";
import { unlimited } from "./actplay.js";
import { l4Ammo } from "./l4dd.js";
import { isL4dd, downArmed, kitOf, l4Hp, slotsOf } from "./l4ddrules.js";
import { GRENADE, slotOfPick, staysPick } from "./kitslots.js";
import { whyNot } from "./sandbox.js";
import { sbHotOn, mountHotWin } from "./sbhotview.js";
import { sbSlots, spawnOf } from "./sbhot.js";

/* One machine for every mode: what's out in my hand (hand.in) and what comes back once it's put away or used up
   (hand.back). Each mode is a row of data:
   - in: the board keeps a weapon's id; Quacky Zombies a pick (a slot of the kit, then the grenades:
     key = pick + 1, kitslots.js)
   - start: what's in hand at first
   - stays: a weapon that stays in hand once picked; toggles: picked again, it goes away and the one back comes back
     (only Dead Ducks Arcade's items that switch on and off: the flashlight)
   - self: picking a weapon that stays makes it the one to come back (Quacky Zombies), or else the one before stays it
   - held(s): the weapon out in hand, for the board's ways (the board: the one in the slot picked)
   - reloads(s): the gun R reloads (null: none; Quacky Zombies: the one
     in hand, "" too, the rules say no); ready(s, w, now): R can reload it now; dry(s, w): no ammo left to reload with
   - empty(s): the hand empties itself (Quacky Zombies: no grenades or no slot left), and backTo(s) is what comes back then */
/* the board's gun w in my hand (ammo.js): R can reload it now (its magazine not full, or full and
   one more in the chamber, guns.js loadTo; not reloading; something left to load), or it has nothing left to load */
const magReady = (s, w, now) => {
  const m = magOf(s, C.R.me, now, w);
  return (
    !!m && !(m.r > now) && !!reloadTo(w, m.c, capOf(w), unlimited(s, C.R.me, w))
  );
};
const magDry = (s, w) => {
  const m = magOf(s, C.R.me, clockNow(), w);
  return (
    !!m &&
    !!capOf(w) &&
    !m.r &&
    !!loadTo(w, m.c[0], capOf(w)) &&
    !reloadTo(w, m.c, capOf(w), unlimited(s, C.R.me, w))
  );
};
const ROWS = {
  board: {
    start: null,
    held: () => weaponAt(Math.max(0, hand.lastKey)), // (the slot picked; none picked yet: slot 1)
    stays: () => false,
    toggles: () => false,
    /* the gun in hand, or the handgun, or the first gun with a magazine on my keys */
    reloads: () => {
      const d = C.playDuck(),
        k = keysOf(d);
      return hand.held && capOf(hand.held)
        ? hand.held
        : k.includes("handgun")
          ? "handgun"
          : k.find((id) => id && capOf(id)) || null;
    },
    ready: magReady,
    dry: magDry,
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
};
const rowOf = (s) => (isL4dd(s) ? "l4" : "board");
/* the key last pressed (lastKey: V presses it again) */
export const hand = {
  of: "",
  in: null,
  back: null,
  lastKey: -1,
  bare: false, // (Dead Ducks Arcade: an empty slot picked, nothing in hand)
  /* the board's weapon out in hand, or null */
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
/* a new screen: the hand starts over */
export function handReset() {
  hand.lastKey = -1;
  if (win) win.close();
  hand.of = "";
}
/* the bars and R ask the hand: the gun R reloads, can it now, is it out of ammo */
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
/* game.js's side: R, me, bar (getters), sendMove, fire, onBoardPhase, playDuck, turned */
let C = null;
export const pickWith = (c) => (C = c);
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
    hand.lastKey = i;
    C.sendMove(true);
    return;
  }
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
