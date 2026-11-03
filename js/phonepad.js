/* ---------- phones: the jump button and the attack button (the bottom bar's right corner) ----------
   I want phones to jump with a button of their own: a small round one with an up arrow, in the bottom bar's right
   corner. When the special in the slider's middle is a weapon, a crosshair button takes that corner and the jump button
   moves up above it. The crosshair is a joystick too: push it the way you want to attack and the duck attacks that way
   (held out, again each time the weapon is ready); a tap attacks the way the duck faces. Walking, sprinting and the
   rest of the board work as before. Only on touch phones (css/app.css shows it). */
import { el } from "./ui.js";

const PUSH = 14; // pushed this many pixels from the button's middle: it aims
const REACH = 44; // the knob goes no farther than this
const ARROW =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.2 19.4 12.4H14.6V19.6H9.4V12.4H4.6Z"/></svg>';
const CROSS =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.6"/><path d="M12 2.6V8.2M12 15.8V21.4M2.6 12H8.2M15.8 12H21.4"/><circle class="dot" cx="12" cy="12" r="1.5"/></svg>';

/* api: active() → the board is on (buttons show), weapon() → the weapon in the slider's middle (or null), aim(dx, dy)
   → aim that way on the screen (null: the way the duck faces), attack() → attacks, and says in ms when it can again,
   jump() */
export function mountPad(api) {
  const box = el(
    `<div class="tpad gone"><div class="tpad-ring" aria-hidden="true"><i></i></div><button type="button" class="tpad-atk" aria-label="Attack" hidden>${CROSS}</button><button type="button" class="tpad-jump" aria-label="Jump">${ARROW}</button></div>`,
  );
  const atk = box.querySelector(".tpad-atk"),
    jumpBtn = box.querySelector(".tpad-jump"),
    knob = box.querySelector(".tpad-ring i");
  let push = null; // the finger on the crosshair: { id, x, y (the button's middle), aimed, t (the next attack) }

  const sync = () => {
    const on = api.active(),
      w = on && api.weapon();
    box.classList.toggle("gone", !on);
    box.classList.toggle("armed", !!w);
    atk.hidden = !w;
    if (!w && push) letGo();
  };
  const tick = setInterval(sync, 150);
  sync();

  jumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (api.active()) api.jump();
  });

  /* the crosshair: held and pushed, it attacks that way as often as the weapon allows */
  const again = () => {
    if (!push) return;
    const ms = api.attack();
    push.t = setTimeout(again, Math.max(220, ms || 0));
  };
  atk.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (push) return;
    try {
      atk.setPointerCapture(e.pointerId);
    } catch {}
    const r = atk.getBoundingClientRect();
    push = {
      id: e.pointerId,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      aimed: false,
      t: 0,
    };
    knob.style.transform = "";
    box.classList.add("aiming");
  });
  atk.addEventListener("pointermove", (e) => {
    if (!push || e.pointerId !== push.id) return;
    const dx = e.clientX - push.x,
      dy = e.clientY - push.y,
      len = Math.hypot(dx, dy);
    const k = Math.min(len, REACH) / (len || 1);
    knob.style.transform = `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)`;
    if (len < PUSH) return;
    api.aim(dx, dy);
    if (!push.aimed) {
      push.aimed = true;
      again();
    } // (the first push attacks at once)
  });
  function letGo(e) {
    if (!push || (e && e.pointerId !== push.id)) return;
    const p = push;
    push = null;
    clearTimeout(p.t);
    box.classList.remove("aiming");
    knob.style.transform = "";
    if (!p.aimed && e && e.type === "pointerup") {
      api.aim(null);
      api.attack();
    } // a tap: the way the duck faces
  }
  atk.addEventListener("pointerup", letGo);
  atk.addEventListener("pointercancel", letGo);
  for (const b of [atk, jumpBtn])
    b.addEventListener("contextmenu", (e) => e.preventDefault());

  return {
    el: box,
    sync,
    destroy() {
      clearInterval(tick);
      letGo();
      box.remove();
    },
  };
}
