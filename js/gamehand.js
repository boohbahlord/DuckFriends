/* ---------- the hand: the number-key specials, firing, reloading, the wheel and the aim keys ----------
   Moved out of game.js to keep that file small (a pure move). It imports back from game.js, which imports it. */
import { onBoardPhase } from "./game.js";
import {
  R,
  S,
  bar,
  cam,
  kept,
  keys,
  me,
  myAim,
  sendMove,
  world,
} from "./game.js";
import { typing, windowOpen } from "./ui.js";
import { grCool } from "./sbgroups.js";

import {
  VOTE_GRACE,
  twoSided,
  colAt,
  isSc,
  coolFor,
  coolEnds,
  isHang,
} from "./rules.js";
import { barOf, capOf, magOf, sizeOf } from "./ammo.js";
import { unlimited } from "./actplay.js";

import { SC_VOTES } from "./scrules.js";

import { W as HW, H as HH } from "./hangout/layout.js";

import { unlocked } from "./unlocks.js";

import { chatNote } from "./chat.js";

import { specialById, keysOf, hasKey, ammoHTML } from "./specials.js";

import {
  hand,
  handIn,
  heldNow,
  reloadsNow,
  reloadReady,
  reloadDry,
  selectKey,
  useKey,
  l4Pick,
} from "./hotpick.js";
import { ammoBar, stackBars, noReload, drawBar } from "./meters.js";

import { isL4dd, downArmed, slotsOf, l4Cool, kitOf } from "./l4ddrules.js";
import { GRENADE, slotOfPick, kitKeys } from "./kitslots.js";

import { ARMS, BOARD_WEAPONS, THROWS, AUTO } from "./guns.js";

import { sprintLeft, safeKeepLine } from "./l4dd.js";

import { isSb } from "./sandboxrules.js";

import { sbHotOn } from "./sbhotview.js";

import { sbSlots } from "./sbhot.js";

import { profile } from "./store.js";

import { sfx, hush, OTHERS } from "./sound.js";

import { now as clockNow } from "./clock.js";
import { draws, cooks, drawMost, myDraw, myDrawShare } from "./bowdraw.js";

import { isQuack, CLUE_GRACE, tileAt } from "./quackrules.js";

import { isDn, DN_GRACE } from "./duncerules.js";

import { isVd, VD_GRACE } from "./vddrules.js";

import { isTv } from "./triviarules.js";

/* ---------- the specials on the number keys ---------- */
/* … where the arrow keys aim (on the screen), when they moved last: null when the mouse did; and where the mouse is on
   the screen. Both are set from the keys and the pointer below, and from the screen's start and end */
export let keyAim = null,
  mouse = null;
export const setKeyAim = (v) => {
  keyAim = v;
};
export const setMouse = (v) => {
  mouse = v;
};
const myDuck = () => ((R && R.state.players[R.me]) || {}).duck || profile.duck;
/* the duck my keys play with: in Quacky Zombies its slots, then the grenades (kitslots.js); in Mad God
   Justin its own keys: 1 the knife, 2 the pistol (it never reloads: in place of the bow, the owner's, Nov 16),
   3 the weapon picked up, 4 the zebra cake (my own keys stay as they are) */
export const playDuck = () =>
  R && isL4dd(R.state)
    ? {
        ...myDuck(),
        keys: Array.from(
          { length: 10 },
          (x, i) => (i < GRENADE && kitKeys(slotsOf(R.state, R.me))[i]) || null,
        ), // (the grenades' key and the rest: none)
      }
    : R && sbHotOn(R.state)
      ? { ...myDuck(), keys: sbSlots(R.state, R.me) } // (Sandbox's own hotbar: sbhot.js; its spawn buttons aren't specials)
      : myDuck();
/* L (PC, every mode; the owner's, Nov 19 21:59Z): my laser sight on or off, and my flashlight with it. Starts
   the way the mode had it: on in Dead Ducks Arcade, off in the others */
let sightPref = null;
export const sightOn = () =>
  sightPref != null ? sightPref : !!R && isL4dd(R.state);
export function toggleSight() {
  const on = !sightOn();
  sightPref = on;
  if (R && isL4dd(R.state)) {
    const off = !!((R.state.hang.l4f || {})[R.me] || 0);
    if (off === on) R.send({ t: "hang", k: "l4", do: "fl" }); // (the flashlight goes with it)
  }
  sendMove(true);
}
/* down with the down pistol (Dead Ducks Arcade) */
export const downGunNow = () =>
  !!R && isL4dd(R.state) && downArmed(R.state, R.me);
/* the effects kept on for my duck (in the room's state), and the jumps and the weapon kept on here */
export function keptNow() {
  const out = new Set(
      [...kept, ...(hand.held ? [hand.held] : [])].filter((id) =>
        hasKey(playDuck(), id),
      ),
    ),
    a = ((R && R.state.aura) || {})[R && R.me] || {};
  for (const [id, u] of Object.entries(a)) if (u === 0) out.add(id);
  return out;
}
/* phones: the slider picked key i */
export function slidPick(i) {
  if (R && onBoardPhase()) selectKey(i); // (the one in the middle is the one picked: a weapon goes in hand)
}
/* phones: the special in the slider's middle tapped: used (a weapon attacks the way the duck faces) */
export function slidTap(i) {
  const id = keysOf(playDuck())[i];
  if (R && BOARD_WEAPONS.includes(id) && id === hand.held)
    fire(id); // (a weapon picked: a tap on it uses it)
  else useKey(i, false);
}
/* phones: the weapon in the slider's middle, which the attack button uses (or null) */
export function padWeapon() {
  if (downGunNow()) return "handgun"; // (down: the down pistol, whatever the slider shows)
  const id = bar && bar.current && bar.current();
  if (id && R && isL4dd(R.state)) {
    if (id === "grenade") return id;
    return ARMS[id] && ARMS[id].kind !== "special" && id === heldNow()
      ? id
      : null; // (the flashlight and the medkit don't attack: a tap on the slider uses them)
  } // (Quacky Zombies: the weapon in hand, or the grenades)
  if (!id || !R || !hasKey(playDuck(), id)) return null;
  const sp = specialById(id);
  return (BOARD_WEAPONS.includes(id)
    ? id === hand.held
    : THROWS.includes(id) && (!hand.held || isSb(R.state))) &&
    sp &&
    !sp.off &&
    (unlocked("special", id) || sbHotOn(R.state))
    ? id
    : null; // (a weapon is used only while it is the one in hand)
}
/* phones: the attack button: the weapon in the slider's middle, where the button aims; says when it can again (ms) */
export function padAttack() {
  const id = padWeapon();
  if (!id) return 500;
  if (isL4dd(R.state)) {
    fire(id);
    return l4Cool(R.state, R.me, id);
  }
  fire(id);
  return coolFor(id) / grCool(R.state, R.me); // (Sandbox: a group's Cooldown speed)
}
/* the handgun or the dagger, toward the mouse */
export function fire(id) {
  if (!me || me.x < 0 || !R || !onBoardPhase()) return;
  if (id === "safekeep") {
    /* Safe Keeping can't be used by hand: the chat says what it does, every time (the lone duck's line, or the room's) */
    const s = R.state;
    chatNote(
      safeKeepLine(
        s.seat.filter((q) => s.players[q] && !s.players[q].bot).length,
      ),
    );
    return;
  }
  const [ax, ay] = myAim();
  R.send({ t: "use", what: id, face: ax < 0 ? -1 : 1, ax, ay });
  if (bar) setTimeout(() => bar && bar.refresh(), 60); // (the handgun's dots, a cooldown's bar)
}
/* the bow (bowdraw.js): a press draws it (the host keeps when), letting go shoots, toward where I aim then. mouse
   (true: the left button, a grenade; "right": the bow, the director plan, Nov 28): the button's coming up anywhere lets
   go, and so does anything that ends a press (game.js' held trigger's list; the right button's own menu doesn't, it
   never opens over the board: game.js drawPress); a key or the phone's attack stick let go themselves (drawLet) */
let drawing = null; // { w, tm (a grenade's fuse's timer) }: my bow drawn (since when: bowdraw.js myDraw, for the meter)
const DRAW_END = ["pointerup", "pointercancel", "blur", "contextmenu"];
/** @param {string} w @param {boolean | "right"} [mouse] */
export function drawHold(w, mouse = false) {
  if (!draws(w) || !R || !onBoardPhase() || drawing) return !!drawing;
  const d = (drawing = { w, tm: 0 });
  myDraw(clockNow(), drawMost(w));
  R.send({ t: "draw", w });
  if (cooks(w))
    d.tm = setTimeout(() => drawing === d && drawLet(false), drawMost(w)); // (a grenade held to its fuse's end went off in my hand: the host's, l4ddrules.js)
  if (mouse)
    for (const t of DRAW_END)
      if (mouse !== "right" || t !== "contextmenu")
        addEventListener(t, drawUp, true);
  return true;
}
const drawUp = () => drawLet();
export function drawLet(shoot = true) {
  for (const t of DRAW_END) removeEventListener(t, drawUp, true);
  const d = drawing;
  drawing = null;
  if (d) clearTimeout(d.tm);
  myDraw(null);
  if (d && shoot && heldNow() === d.w) fire(d.w);
}
/* phones: the attack stick pushed (on) or let go: the bow draws and shoots instead of firing again and again */
export const padDraw = (on) =>
  on ? drawHold(padWeapon()) : (drawLet(), false);
/* the items on my keys still waiting to work again: [ends (room clock), how long it waits, now] for each key, or null */
export function cool() {
  if (!R) return [];
  const now = clockNow();
  return keysOf(playDuck()).map((id) => coolOne(id, now));
}
/* … one item's: [ends, how long it waits, now] or null */
function coolOne(id, now) {
  {
    const sp = specialById(id);
    if (!sp || sp.kind !== "item") return null;
    const mm = capOf(id) && magOf(R.state, R.me, now, id);
    if (mm) {
      const r = mm.r;
      return r > now
        ? [r, mm.d, now] // (the double barrel's: a second for each shell it loads)
        : AUTO.includes(id)
          ? null
          : (() => {
              const end = coolEnds(R.state, R.me, id);
              return end > now + 250
                ? [end, coolFor(id) / grCool(R.state, R.me), now]
                : null;
            })();
    } // (between quick shots no bar: only the reload, and the sniper's bolt or the launcher's wait)
    const end = coolEnds(R.state, R.me, id);
    return end > now ? [end, coolFor(id) / grCool(R.state, R.me), now] : null;
  }
}
/* the white, the yellow and the blue bars under my duck in the modes besides Dead Ducks Arcade (which has its own,
   l4dd.js): what's in my hand, its cooldown or reload, its magazine, and my sprint while it isn't full (meters.js; the
   sprint every mode has now, stamina.js; the owner's, Nov 18 16:50Z) */
export function handBars(s) {
  const tag = S && S.querySelector(".gduck.mine .gduck-name");
  if (!tag || !R) return;
  const now = clockNow(),
    w = hand.held,
    c = w ? coolOne(w, now) : null;
  let el = tag.querySelector(".l4-cool");
  if (!el && c) {
    el = document.createElement("span");
    el.className = "l4-cool off";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = "<i></i>";
    tag.append(el);
  }
  const v = c ? Math.min(1, (c[0] - now) / c[1]).toFixed(3) : "0";
  if (el && el._v !== v) {
    el._v = v;
    el.style.setProperty("--cl", v);
    el.classList.toggle("off", v === "0");
  }
  const mm = w && magOf(s, R.me, now, w);
  const a = mm ? barOf(mm, w, now, unlimited(s, R.me, w)) : null;
  ammoBar(tag, a);
  let sp = tag.querySelector(".l4-sprint");
  if (!sp) {
    sp = document.createElement("span");
    sp.className = "l4-sprint full";
    sp.setAttribute("aria-hidden", "true");
    sp.innerHTML = "<i></i>";
    tag.append(sp);
  }
  if (sp) {
    const [left, tired] = sprintLeft(),
      sv = left.toFixed(3);
    if (sp._v !== sv) {
      sp._v = sv;
      sp.style.setProperty("--sp", sv);
      sp.classList.toggle("full", left >= 1);
    }
    sp.classList.toggle("tired", tired);
  }
  drawBar(tag, myDrawShare(now), cooks(hand.held));
  stackBars(tag);
}
/* the handgun's shots left in its magazine (for the dots under its key), or another gun's (ammo.js) */
export function ammo(id = "handgun") {
  const m = R && magOf(R.state, R.me, clockNow(), id);
  return m ? m.c[0] : sizeOf(id);
}
/* the dots under a key: a gun's shots in its magazine (a number past 8: the SMG's 25 … the LMG's 100; the
   flamethrower's tank in percent), and what's left besides (Dead Ducks Arcade's ammo, ammo.js) */
export const dots = (id) => {
  if (!sizeOf(id)) return "";
  const m = R && magOf(R.state, R.me, clockNow(), id),
    n = ammo(id),
    rest = m && capOf(id) ? m.c[1] : 0;
  return id === "flamer"
    ? `<span class="ammo ammo-n" aria-label="Tank">${Math.ceil((n / sizeOf(id)) * 100)}%</span>`
    : sizeOf(id) > 8 || rest
      ? `<span class="ammo ammo-n" aria-label="${n} shots left${rest ? `, ${rest} more` : ""}">${n}${rest ? `/${rest}` : ""}</span>`
      : ammoHTML(n, sizeOf(id));
};
/* the small R on a phone (phonepad.js) shows in every mode, but only while what's in my hand can be reloaded: it has a
   magazine, it isn't full, and no reload is going on (the owner's, Nov 18 16:50Z: "r only shows up on mobile for anything
   IF something CAN be reloaded") */
export function canReloadNow() {
  if (!R || !onBoardPhase()) return false;
  const w = reloadsNow();
  return !!w && reloadReady(R.state, w, clockNow());
}
/* R: the gun in hand reloads (Quacky Zombies: the weapon in hand; the board: the handgun, or the first gun with a magazine on my keys) */
export function reload() {
  if (!R || !onBoardPhase()) return false;
  const w = reloadsNow();
  if (w == null) return false;
  if (reloadDry(R.state, w)) noReload(); // (no ammo left to reload it with: the white bar flashes red, meters.js)
  R.send({ t: "reload", w });
  return true;
}
/* each reload of mine (by R, or on its own once a magazine is empty) makes its gun's own reload sound: the room's
   state says when a reload ends (s.mag in every mode, my kit's rl in Dead Ducks Arcade); a new end is a new reload */
export const setReloadsSeen = (v) => {
  reloadsSeen = v;
};
let reloadsSeen = {},
  reloadVoices = {}; // (each weapon's reload sound playing, to stop it when the reload is given up)
export function heardReloads(s) {
  const now = clockNow(),
    seen = {};
  if (isL4dd(s)) {
    const k = kitOf(s, R.me);
    if (k && k.rl > now && k.rw) seen[k.rw === "dg" ? "handgun" : k.rw] = k.rl; // (the down pistol's: the pistol's sound)
  } else
    for (const [key, m] of Object.entries(s.mag || {}))
      if (m && m.r > now && (key === R.me || key.startsWith(R.me + " ")))
        seen[key === R.me ? "handgun" : key.slice(R.me.length + 1)] = m.r;
  for (const [w, r] of Object.entries(seen))
    if (reloadsSeen[w] !== r) {
      hush(reloadVoices[w]);
      reloadVoices[w] = sfx.reload(w, { secs: (r - now) / 1000 }); // (to end as it ends)
    }
  for (const [w, r] of Object.entries(reloadsSeen))
    if (!seen[w] && r > now + 100) hush(reloadVoices[w]); // (given up before its end: switched weapons)
  reloadsSeen = seen;
}
/* stepping onto another tile or answer (the owner, Nov 16: "a sound for stepping over different tiles"): a faint
   knock as my duck enters it, a little higher toward the right (Agree, B, Not a Dunce), nothing on the strip between
   tiles; Story Chain and Trivia have rows, not tiles */
let tileWas = null,
  tileAtMs = 0;
export function tileKnock(s, p, now) {
  if (!p || p.x < 0 || isSc(s) || isTv(s) || cam) return void (tileWas = null);
  const c = isQuack(s) && s.phase !== "choice" ? tileAt(s, p) : colAt(s, p.x),
    n =
      isQuack(s) && s.phase !== "choice"
        ? (s.wq.ids || []).length
        : twoSided(s)
          ? 2
          : 7;
  if (c === tileWas) return;
  const was = tileWas;
  tileWas = c;
  if (was === null || c < 0 || now - tileAtMs < 120) return; // (the first look, the strip, or a duck wobbling on an edge)
  tileAtMs = now;
  sfx.tileIn({ rate: 0.88 + (0.24 * (c % n)) / Math.max(1, n - 1) });
}
/* how a duck's sound is heard: mine as it is, another's quieter; in Duck Cabin and Dead Ducks Arcade from where it
   stands (sound.js fades it with its distance from my duck) */
export function heard(id) {
  const o = { id, k: id === R.me ? 1 : OTHERS, mine: id === R.me }; // (id: whose it is, for a sound that's each duck's own: sound.js flamer; mine: never left out, sound.js voice)
  if (world && R && isHang(R.state)) {
    const p = (R.state.pos || {})[id];
    if (p && p.x >= 0) Object.assign(o, { x: p.x * HW, y: p.y * HH });
  }
  return o;
}
let mouseAt = 0; // when the mouse last moved
const MOUSE_IDLE = 2500; // ms without the mouse before the arrow keys aim
export const aimAt = (e) => {
  mouse = { x: e.clientX, y: e.clientY };
  mouseAt = performance.now();
  keyAim = null;
}; // (the handgun and the dagger aim at the mouse; the arrow keys too, whichever moved last)
/* the arrow keys aim instead of walking (WASD walks): in every mode while a weapon is in hand and the mouse is still
   (a player who isn't aiming with the mouse) */
export const arrowsAim = () =>
  !!R &&
  onBoardPhase() &&
  !!heldNow() &&
  (!mouse || performance.now() - mouseAt > MOUSE_IDLE);
export const ARROWS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};
export function keyAimNow() {
  let x = 0,
    y = 0;
  for (const [k, [dx, dy]] of Object.entries(ARROWS))
    if (keys.has(k)) {
      x += dx;
      y += dy;
    }
  if (x || y) keyAim = [x * 100, y * 100]; // (on the screen; let go, it keeps aiming that way)
}
/* the scroll wheel: the next (or last) special in the hotbar. A weapon goes in hand, anything else is the one V uses
   (Quacky Zombies: the next slot) */
let wheelSum = 0,
  wheelAt = 0;
function wheelPick(dir) {
  if (!R || !onBoardPhase()) return false;
  const s = R.state;
  if (isL4dd(s)) {
    /* the next slot that has something: an empty one between is skipped, and the grenades (after the slots) are in the row when I
       have some (the owner's, Nov 17 17:41Z: "bow at key number 3, nothing at 4, but a grenade at five, then the scroll
       wheel will skip the empty one and go straight to the grenade"); Safe Keeping is picked like any slot (the owner, Nov 21) */
    const sl = slotsOf(s, R.me),
      kit = kitOf(s, R.me),
      has = (i) => (i === GRENADE ? !!(kit && kit.g > 0) : !!sl[slotOfPick(i)]),
      n = GRENADE + 1; // (the slots, then the grenades: an empty one is skipped)
    let i = handIn();
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (i !== handIn() && has(i)) {
        l4Pick(i);
        return true;
      }
    }
    return false;
  }
  const ids = keysOf(playDuck())
    .map((id, i) => [id, i])
    .filter(([id]) => id);
  if (!ids.length) return false;
  const at = ids.findIndex(([, i]) => i === hand.lastKey),
    [, i] =
      ids[
        (at < 0 ? (dir > 0 ? 0 : ids.length - 1) : at + dir + ids.length) %
          ids.length
      ];
  selectKey(i);
  return true;
}
export const onWheel = (e) => {
  if (!R || !onBoardPhase() || windowOpen() || typing(e) || e.ctrlKey) return; // (Ctrl: the browser's zoom)
  /* with my duck in the game, the wheel over the board is the hotbar's and never moves the board (the camera follows
     the duck, owner 2026-11-04 07:12Z); without one (watching), or over a list off the board, it scrolls as always */
  const onBoard =
    !!me &&
    !!R.state.pos[R.me] &&
    !!(e.target.closest && e.target.closest(".gmain"));
  if (onBoard) e.preventDefault(); // (a touchpad's small steps and sideways swipes too)
  if (!e.deltaY) return;
  if (!onBoard)
    for (let el = e.target; el && el !== document.body; el = el.parentElement)
      if (
        el.scrollHeight > el.clientHeight + 2 &&
        /auto|scroll/.test(getComputedStyle(el).overflowY)
      )
        return; // (a list scrolling: leave it)
  const now = performance.now();
  wheelSum = now - wheelAt > 400 ? 0 : wheelSum;
  wheelAt = now;
  wheelSum += e.deltaY;
  if (Math.abs(wheelSum) < 40) return;
  const dir = wheelSum > 0 ? 1 : -1;
  wheelSum = 0;
  if (wheelPick(dir)) e.preventDefault();
};
const KEY_CODES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
export const keyIndex = (e) => {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
  return m ? KEY_CODES.indexOf(m[1]) : -1;
};

/* the first seconds of a vote (no voting yet), or of a clue turn in Who is the Quack? (12 s before it can end) */
export const graceOf = (s) =>
  isVd(s) && s.phase === "vddate"
    ? VD_GRACE
    : isVd(s) && s.phase === "vdpick"
      ? VOTE_GRACE
      : s.phase === "answer" && isDn(s)
        ? DN_GRACE
        : s.phase === "answer" ||
            (isSc(s) && SC_VOTES.includes(s.phase)) ||
            (isQuack(s) && ["choice", "accuse"].includes(s.phase))
          ? VOTE_GRACE
          : isQuack(s) && s.phase === "clue"
            ? CLUE_GRACE
            : 0;
export const graceLeftMs = (s) =>
  graceOf(s) ? Math.max(0, s.at + graceOf(s) * 1000 - clockNow()) : 0;
export const graceLeft = (s) => Math.ceil(graceLeftMs(s) / 1000);
