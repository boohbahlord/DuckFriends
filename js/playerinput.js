/* ---------- what I ask my duck to do: one walk, every mode ----------
   WASD (and the arrows, unless they aim: Mad God Justin, arrowsAim in game.js), else the phone's stick, slower near
   its middle; Shift or the stick's edge sprints. The board and the maps both walk by this, each in its own units
   (game.js step and hangStep); a mode only changes what follows (no sprint in Mad God Justin, the board turned). */
import { stick } from "./touch.js";
import { WALK_EASE } from "./gamedefaults.js";

/* keys: the codes held down (game.js); aims: the arrows aim instead of walking. { x, y }: on screen, right and down
   (-1 … 1), sprint: asked for */
export function walkIntent(keys, aims) {
  const k = (c) => keys.has(c);
  let x =
      (k("KeyD") || (!aims && k("ArrowRight")) ? 1 : 0) -
      (k("KeyA") || (!aims && k("ArrowLeft")) ? 1 : 0),
    y =
      (k("KeyS") || (!aims && k("ArrowDown")) ? 1 : 0) -
      (k("KeyW") || (!aims && k("ArrowUp")) ? 1 : 0);
  if (!x && !y && (stick.x || stick.y)) {
    x = stick.x;
    y = stick.y;
  } // the joystick: slower near its middle
  return {
    x,
    y,
    sprint: k("ShiftLeft") || k("ShiftRight") || !!stick.sprint,
  };
}
/* the walk asked for, eased (WALK_EASE): it goes toward w at a steady rate, the whole way in `up` seconds while I ask
   for a way, `down` while I let go (a steady acceleration, as a platformer's run). dt: seconds since the last frame */
let eased = { x: 0, y: 0 };
export function easeWalk(w, dt) {
  const dx = w.x - eased.x,
    dy = w.y - eased.y,
    d = Math.hypot(dx, dy),
    most = dt / (w.x || w.y ? WALK_EASE.up : WALK_EASE.down);
  eased =
    d <= most
      ? { x: w.x, y: w.y }
      : { x: eased.x + (dx / d) * most, y: eased.y + (dy / d) * most };
  return { ...w, ...eased };
}
