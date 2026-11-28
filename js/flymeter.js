/* ---------- the Flyer's meter under my duck (the owner's, Nov 28) ----------
   While a Flyer holds my duck: a black meter, a red line sweeping it fast one way and back, a white line flashing at a
   random spot. My click (the attack button on a phone) strikes the Flyer instead of swinging: how near the red line is
   to the white one is the damage (the host's, zombies.js meterDmg), and the white line jumps somewhere new. The Flyer's
   HP shows inside the meter instead of over its head. Numbers: gamedefaults.js SPECIAL_Z.flyer.meter */
import { SPECIAL_Z } from "./gamedefaults.js";

const M = SPECIAL_Z.flyer.meter,
  EDGE = 0.08; // (the white line never right at an end)
let on = null; // { i: the Flyer's number, t0, white, moved, hp, max } while one holds me

const spot = () => EDGE + Math.random() * (1 - 2 * EDGE);
/* the red line now, 0 … 1 across: one way in M.sweep ms, then back */
const red = (now) => {
  const u = ((now - on.t0) / M.sweep) % 2;
  return u < 1 ? u : 2 - u;
};

/* is a Flyer holding my duck? (gamehand.js: a click strikes it) */
export const meterOn = () => !!on;

/* my strike: how far the red line is from the white one now (a share of the meter); the white one jumps */
export function meterStrike(now = performance.now()) {
  const off = Math.abs(red(now) - on.white);
  on.white = spot();
  on.moved = now;
  on.hit = now;
  return +off.toFixed(3);
}

/* once a frame (l4dd.js): z, the Flyer holding my duck ({ i, hp, max }) or null; tag, my name tag */
export function flyMeter(tag, z, now = performance.now()) {
  let el = tag.querySelector(".l4-fly");
  if (!z) {
    on = null;
    if (el && !el.classList.contains("off")) el.classList.add("off");
    tag.classList.remove("flying");
    return;
  }
  if (!on || on.i !== z.i)
    on = { i: z.i, t0: now, white: spot(), moved: now, hit: -1e9 };
  if (now - on.moved >= M.move) {
    on.white = spot();
    on.moved = now;
  }
  if (!el) {
    el = document.createElement("span");
    el.className = "l4-fly off";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<b class="w"></b><b class="r"></b><em></em>';
    tag.append(el);
  }
  el.classList.remove("off");
  tag.classList.add("flying"); // (the slot box and the heat meter step aside: css/app.css)
  el.style.setProperty("--r", red(now).toFixed(3));
  el.style.setProperty("--w", on.white.toFixed(3));
  el.classList.toggle("hit", now - on.hit < 150);
  const hp = `${Math.max(0, Math.ceil(z.hp))}/${z.max}`;
  if (el._hp !== hp) {
    el._hp = hp;
    el.lastChild.textContent = hp;
  }
}
