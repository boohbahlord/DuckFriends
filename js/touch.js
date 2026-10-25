/* ---------- touch controls on the board (phones and tablets) ----------
   Joystick (the default): hold a finger anywhere off the buttons and drag; a see-through stick appears under it and walks
   your duck that way, slower near the middle. A quick tap jumps (a second finger can tap while the first holds the stick).
   Flick the stick twice the same way to sprint; the sprint lasts while the stick is held away from the middle, in any
   direction.
   Tap to move (Settings → Controls): a tap walks your duck there, with a faint white circle on the spot; a slow drag
   leads it along; a quick double tap jumps without changing where it is going; a fast swipe sprints that way. */
import { profile } from './store.js';
import { el } from './ui.js';

export const stick = { x: 0, y: 0, sprint: false, shown: false };   // the joystick now: on-screen direction, length 0–1
const REACH = 60;                       // the stick's reach in pixels
const TAP = { ms: 260, px: 12 };        // a tap: short and still
const DOUBLE = { ms: 300, px: 70 };     // a double tap: the second tap this soon and this near
const FLICK = { out: 450, gap: 380, ang: .9 };   // two flicks: each out for under .45 s, back for under .38 s, about the same way
const SWIPE = { px: 40, ms: 350 };      // a swipe: this far, this fast
const NOT_HERE = 'button, a, input, select, textarea, label, .statpanel, .mc, .gbar, .bbar, .dock-l, .dock-r, .dock-b, .sc-write';
const angDiff = (a, b) => Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);

/* api: active(), jump(), walkTo(clientX, clientY, sprint), duckAt() → {x, y} on screen, getTarget(), setTarget(t) */
export function mountTouch(S, api) {
  let hold = null;           // the finger on the stick
  let push = null;           // the last flick out: { ang, at, back } (back: when it came back to the middle)
  let lastTap = null;        // tap to move: the last tap, for double taps
  const fingers = new Map(); // every other finger: id → where it went down and how far it moved
  let pad = null, knob = null;

  const reset = () => { stick.x = stick.y = 0; stick.sprint = false; stick.shown = false; if (pad) pad.classList.remove('on', 'sprint'); };
  const show = () => {
    if (!hold || stick.shown) return;
    if (!pad) { pad = el('<div class="stick" aria-hidden="true"><div class="stick-knob"></div></div>'); knob = pad.firstChild; document.body.append(pad); }
    stick.shown = true; pad.style.transform = `translate(${hold.ox}px, ${hold.oy}px)`; pad.classList.add('on');
  };
  const setKnob = (dx, dy, now) => {
    const len = Math.hypot(dx, dy), r = Math.min(1, len / REACH), m = r < .16 ? 0 : Math.min(1, (r - .16) / .54);
    stick.x = len ? dx / len * m : 0; stick.y = len ? dy / len * m : 0;
    if (!hold.out && r > .72) {          // pushed out: a second flick the same way soon after the first sprints
      hold.out = true;
      const ang = Math.atan2(dy, dx);
      if (push && push.back && now - push.back < FLICK.gap && push.back - push.at < FLICK.out && angDiff(ang, push.ang) < FLICK.ang) stick.sprint = true;
      push = { ang, at: now, back: 0 };
    } else if (hold.out && r < .3) {     // back in the middle: the sprint ends
      hold.out = false; push.back = now; stick.sprint = false;
    }
    if (knob) { const k = Math.min(len, REACH) / (len || 1); knob.style.transform = `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)`; }
    if (pad) pad.classList.toggle('sprint', stick.sprint);
  };

  function down(e) {
    if (e.pointerType === 'mouse' || !api.active() || !e.target.closest('.gmain') || e.target.closest(NOT_HERE)) return;
    const now = performance.now(), f = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, t: now, moved: 0 };
    if (profile.settings.touch === 'tap') {
      if (lastTap && now - lastTap.t < DOUBLE.ms && Math.hypot(f.x - lastTap.x, f.y - lastTap.y) < DOUBLE.px) {
        api.setTarget(lastTap.prev); api.jump(); lastTap = null; f.dbl = true;   // jump, and keep going where it was going
      } else { f.prev = api.getTarget(); api.walkTo(f.x, f.y, false); }
      fingers.set(f.id, f); return;
    }
    if (hold) { fingers.set(f.id, f); return; }
    hold = { ...f, ox: f.x, oy: f.y, out: false };
    setTimeout(() => { if (hold && hold.id === f.id) show(); }, TAP.ms);   // held still: the stick shows where it is
  }
  function move(e) {
    const now = performance.now();
    if (hold && e.pointerId === hold.id) {
      hold.moved = Math.max(hold.moved, Math.hypot(e.clientX - hold.sx, e.clientY - hold.sy));
      if (hold.moved > TAP.px) show();
      let dx = e.clientX - hold.ox, dy = e.clientY - hold.oy;
      const len = Math.hypot(dx, dy), far = REACH * 1.5;
      if (len > far) {                   // the stick follows a finger that goes well past it
        hold.ox += dx / len * (len - far); hold.oy += dy / len * (len - far);
        dx = e.clientX - hold.ox; dy = e.clientY - hold.oy;
        if (pad) pad.style.transform = `translate(${hold.ox}px, ${hold.oy}px)`;
      }
      setKnob(dx, dy, now);
      return;
    }
    const f = fingers.get(e.pointerId); if (!f) return;
    f.x = e.clientX; f.y = e.clientY; f.moved = Math.max(f.moved, Math.hypot(f.x - f.sx, f.y - f.sy));
    if (profile.settings.touch === 'tap' && !f.dbl && f.moved > TAP.px && now - f.t > SWIPE.ms) api.walkTo(f.x, f.y, false);   // a slow drag leads the duck along
  }
  function up(e) {
    const now = performance.now();
    if (hold && e.pointerId === hold.id) {
      const tap = hold.moved < TAP.px && now - hold.t < TAP.ms;
      if (hold.out && push) push.back = now;   // a flick that lets go counts as coming back
      hold = null; reset();
      if (tap && e.type === 'pointerup') api.jump();
      return;
    }
    const f = fingers.get(e.pointerId); if (!f) return;
    fingers.delete(e.pointerId);
    if (e.type !== 'pointerup' || f.dbl) return;
    const dur = now - f.t, dx = e.clientX - f.sx, dy = e.clientY - f.sy, dist = Math.hypot(dx, dy);
    if (profile.settings.touch !== 'tap') { if (dist < TAP.px && dur < TAP.ms) api.jump(); return; }
    if (dist > SWIPE.px && dur < SWIPE.ms) {   // a swipe: sprint that way from where the duck is, a good way past the swipe
      const at = api.duckAt(), go = Math.max(dist * 2.5, 180);
      if (at) api.walkTo(at.x + dx / dist * go, at.y + dy / dist * go, true);
      lastTap = null;
    } else lastTap = dist < TAP.px && dur < TAP.ms ? { t: now, x: e.clientX, y: e.clientY, prev: f.prev } : null;
  }

  S.addEventListener('pointerdown', down);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  return () => {
    S.removeEventListener('pointerdown', down);
    removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
    hold = null; reset(); if (pad) pad.remove(); pad = null;
  };
}
