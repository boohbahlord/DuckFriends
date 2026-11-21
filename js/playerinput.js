/* ---------- what I ask my duck to do: one walk, every mode ----------
   WASD (and the arrows, unless they aim: Mad God Justin, arrowsAim in game.js), else the phone's stick, slower near
   its middle; Shift or the stick's edge sprints. The board and the maps both walk by this, each in its own units
   (game.js step and hangStep); a mode only changes what follows (no sprint in Mad God Justin, the board turned). */
import { stick } from "./touch.js";

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
