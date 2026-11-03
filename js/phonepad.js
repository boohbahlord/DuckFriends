/* ---------- phones: the aim-and-attack stick and the jump button (over the board's bottom right) ----------
   I want phones to jump with a button of their own, a small round one with an up arrow; a tap on the board no longer
   jumps (touch.js). When the special in the slider's middle can attack (picked, kept on or not), the attack stick comes
   in where the jump button was and the jump button moves up above it (a phone on its side: beside it). Both sit over
   the board, a little in from the right edge; the slider and everything else stay in the bottom bar.
   The attack stick looks like the walking stick (see-through, with the crosshair as its knob) and is never instant:
   push the knob out and the duck aims that way; push it a little further, past the stick's edge, and it attacks that
   way, again each time the weapon is ready, for as long as it's held out there. Coming back inside the edge stops the
   attacks and keeps aiming; letting go stops both. Only on touch phones (css/app.css shows it). */
import { el } from "./ui.js";

const AIM = 10; // pushed this many pixels from the stick's middle: it aims
const FIRE = 30; // this far (about the stick's edge): it attacks
const BACK = 24; // attacking, it stops again once back under this (so a shaky thumb doesn't start and stop it)
const REACH = 42; // the knob goes no farther than this
const ARROW =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.2 19.4 12.4H14.6V19.6H9.4V12.4H4.6Z"/></svg>';
const CROSS =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.6"/><path d="M12 2.6V8.2M12 15.8V21.4M2.6 12H8.2M15.8 12H21.4"/><circle class="dot" cx="12" cy="12" r="1.5"/></svg>';

/* api: active() → the board is on (buttons show), weapon() → the weapon in the slider's middle (or null), aim(dx, dy)
   → aim that way on the screen (null: stop aiming), attack() → attacks, and says in ms when it can again, jump() */
export function mountPad(api) {
  const box = el(
    `<div class="tpad gone"><div class="tpad-atk" role="button" aria-label="Aim and attack" hidden><div class="tpad-ring" aria-hidden="true"></div><i aria-hidden="true">${CROSS}</i></div><button type="button" class="tpad-jump" aria-label="Jump">${ARROW}</button></div>`,
  );
  const atk = box.querySelector(".tpad-atk"),
    jumpBtn = box.querySelector(".tpad-jump"),
    knob = atk.querySelector("i");
  let push = null; // the finger on the stick: { id, x, y (the stick's middle), firing, t (the next attack) }

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

  /* pushed past the edge: it attacks as often as the weapon allows */
  const again = () => {
    if (!push || !push.firing) return;
    const ms = api.attack();
    push.t = setTimeout(again, Math.max(60, ms || 0)); // (Quacky Zombies' full-auto guns: as fast as 80 ms)
  };
  const firing = (on) => {
    if (!push || push.firing === on) return;
    push.firing = on;
    box.classList.toggle("firing", on);
    clearTimeout(push.t);
    if (on) again();
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
      firing: false,
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
    if (len >= AIM) api.aim(dx, dy);
    firing(push.firing ? len >= BACK : len >= FIRE);
  });
  function letGo(e) {
    if (!push || (e && e.pointerId !== push.id)) return;
    const p = push;
    push = null;
    clearTimeout(p.t);
    box.classList.remove("aiming", "firing");
    knob.style.transform = "";
    api.aim(null);
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
