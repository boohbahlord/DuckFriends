/* ---------- touch controls on the board (phones and tablets) ----------
   Joystick (the default): hold a finger anywhere off the buttons (the bars too) and drag; a see-through stick appears under it and walks
   your duck that way, slower near the middle. Flick the stick twice the same way to sprint; the sprint lasts while the
   stick is held away from the middle, in any direction.
   Tap to move (Settings → Controls): a tap walks your duck there, with a faint white circle on the spot; a slow drag
   leads it along; a fast swipe sprints that way.
   Jumping is the up-arrow button's (phonepad.js): I want it to replace tapping the board to jump.
   Either way, a finger held still for half a second brings up the specials around it (hotbar.js); held still on a duck,
   it opens that duck's menu instead. */
import { profile } from "./store.js";
import { el } from "./ui.js";

export const stick = { x: 0, y: 0, sprint: false, shown: false }; // the joystick now: on-screen direction, length 0–1
const REACH = 60; // the stick's reach in pixels
const TAP = { ms: 260, px: 12 }; // a tap: short and still
const FLICK = { out: 450, gap: 380, ang: 0.9 }; // two flicks: each out for under .45 s, back for under .38 s, about the same way
const SWIPE = { px: 40, ms: 350 }; // a swipe: this far, this fast
const STILL = 520; // held still this long: the specials (on a duck: its menu)
/* where a finger never starts the stick: on something it presses or types in, or reads and scrolls (the docked Notes and
   chat, the specials' slider, the music bar). Anywhere else it does, the bars' empty spots too, right beside a button
   (the owner's, Nov 4) */
const NOT_HERE =
  "button, a, input, select, textarea, label, [role=button], [role=slider], .statpanel, .mc, .dock-panel, .sp-phone, .mbar, .pmenu, .votebox, .sc-write";
const BARS = ".gbar, .bbar, .dock-l, .dock-r, .dock-b"; // (Tap to move walks where I tap: never under a bar)
const angDiff = (a, b) =>
  Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);

/* api: active(), walkTo(clientX, clientY, sprint), duckAt() → {x, y} on screen, getTarget(), setTarget(t),
   hold(clientX, clientY) → true when the specials came up */
export function mountTouch(S, api) {
  let hold = null; // the finger on the stick
  let push = null; // the last flick out: { ang, at, back } (back: when it came back to the middle)
  const fingers = new Map(); // every other finger: id → where it went down and how far it moved
  let pad = null,
    knob = null;

  const reset = () => {
    stick.x = stick.y = 0;
    stick.sprint = false;
    stick.shown = false;
    if (pad) pad.classList.remove("on", "sprint");
  };
  const show = () => {
    if (!hold || stick.shown) return;
    if (!pad) {
      pad = el(
        '<div class="stick" aria-hidden="true"><div class="stick-knob"></div></div>',
      );
      knob = pad.firstChild;
      document.body.append(pad);
    }
    stick.shown = true;
    pad.style.transform = `translate(${hold.ox}px, ${hold.oy}px)`;
    pad.classList.add("on");
  };
  const setKnob = (dx, dy, now) => {
    const len = Math.hypot(dx, dy),
      r = Math.min(1, len / REACH),
      m = r < 0.16 ? 0 : Math.min(1, (r - 0.16) / 0.54);
    stick.x = len ? (dx / len) * m : 0;
    stick.y = len ? (dy / len) * m : 0;
    if (!hold.out && r > 0.72) {
      // pushed out: a second flick the same way soon after the first sprints
      hold.out = true;
      const ang = Math.atan2(dy, dx);
      if (
        push &&
        push.back &&
        now - push.back < FLICK.gap &&
        push.back - push.at < FLICK.out &&
        angDiff(ang, push.ang) < FLICK.ang
      )
        stick.sprint = true;
      push = { ang, at: now, back: 0 };
    } else if (hold.out && r < 0.3) {
      // back in the middle: the sprint ends
      hold.out = false;
      push.back = now;
      stick.sprint = false;
    }
    if (knob) {
      const k = Math.min(len, REACH) / (len || 1);
      knob.style.transform = `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)`;
    }
    if (pad) pad.classList.toggle("sprint", stick.sprint);
  };

  function down(e) {
    if (
      e.pointerType === "mouse" ||
      !api.active() ||
      e.target.closest(NOT_HERE) ||
      (profile.settings.touch === "tap" && e.target.closest(BARS))
    )
      return;
    const now = performance.now(),
      f = {
        id: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        x: e.clientX,
        y: e.clientY,
        t: now,
        moved: 0,
      },
      onDuck = !!e.target.closest(".gduck");
    if (profile.settings.touch === "tap") {
      f.prev = api.getTarget();
      api.walkTo(f.x, f.y, false);
      fingers.set(f.id, f);
      if (fingers.size === 1 && !onDuck)
        setTimeout(() => {
          if (
            fingers.get(f.id) === f &&
            f.moved < TAP.px &&
            api.hold(f.x, f.y)
          ) {
            fingers.delete(f.id);
            api.setTarget(f.prev);
          }
        }, STILL);
      return;
    }
    if (hold) {
      fingers.set(f.id, f);
      return;
    }
    hold = { ...f, ox: f.x, oy: f.y, out: false };
    setTimeout(() => {
      if (hold && hold.id === f.id) show();
    }, TAP.ms); // held still: the stick shows where it is
    setTimeout(() => {
      // held still longer: the specials, or (on a duck) the stick goes so the duck's menu can open
      if (!hold || hold.id !== f.id || hold.moved >= TAP.px) return;
      if (onDuck || api.hold(f.x, f.y)) {
        hold = null;
        reset();
      }
    }, STILL);
  }
  function move(e) {
    const now = performance.now();
    if (hold && e.pointerId === hold.id) {
      hold.moved = Math.max(
        hold.moved,
        Math.hypot(e.clientX - hold.sx, e.clientY - hold.sy),
      );
      if (hold.moved > TAP.px) show();
      let dx = e.clientX - hold.ox,
        dy = e.clientY - hold.oy;
      const len = Math.hypot(dx, dy),
        far = REACH * 1.5;
      if (len > far) {
        // the stick follows a finger that goes well past it
        hold.ox += (dx / len) * (len - far);
        hold.oy += (dy / len) * (len - far);
        dx = e.clientX - hold.ox;
        dy = e.clientY - hold.oy;
        if (pad) pad.style.transform = `translate(${hold.ox}px, ${hold.oy}px)`;
      }
      setKnob(dx, dy, now);
      return;
    }
    const f = fingers.get(e.pointerId);
    if (!f) return;
    f.x = e.clientX;
    f.y = e.clientY;
    f.moved = Math.max(f.moved, Math.hypot(f.x - f.sx, f.y - f.sy));
    if (
      profile.settings.touch === "tap" &&
      f.moved > TAP.px &&
      now - f.t > SWIPE.ms
    )
      api.walkTo(f.x, f.y, false); // a slow drag leads the duck along
  }
  function up(e) {
    const now = performance.now();
    if (hold && e.pointerId === hold.id) {
      if (hold.out && push) push.back = now; // a flick that lets go counts as coming back
      hold = null;
      reset();
      return;
    }
    const f = fingers.get(e.pointerId);
    if (!f) return;
    fingers.delete(e.pointerId);
    if (e.type !== "pointerup" || profile.settings.touch !== "tap") return;
    const dur = now - f.t,
      dx = e.clientX - f.sx,
      dy = e.clientY - f.sy,
      dist = Math.hypot(dx, dy);
    if (dist > SWIPE.px && dur < SWIPE.ms) {
      // a swipe: sprint that way from where the duck is, a good way past the swipe
      const at = api.duckAt(),
        go = Math.max(dist * 2.5, 180);
      if (at)
        api.walkTo(at.x + (dx / dist) * go, at.y + (dy / dist) * go, true);
    }
  }

  S.addEventListener("pointerdown", down);
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);
  return () => {
    S.removeEventListener("pointerdown", down);
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    removeEventListener("pointercancel", up);
    hold = null;
    reset();
    if (pad) pad.remove();
    pad = null;
  };
}
