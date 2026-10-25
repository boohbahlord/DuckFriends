/* ---------- Hangout's two registries: what each activity adds ----------
   An activity (the lamps, the couches, the piano …) lives in one file of js/hangout/ and registers two parts here:

   rule(k, { init, act, tick, join, left }): its part of the room's rules, run by the host (rules.js' reduce). Its state
   lives in s.hang (keep it small: it goes online as one string).
     init()             → its fields of s.hang when the cabin opens, e.g. { lamps: {} }
     act(s, a, now)     → a player's { t: 'hang', k, … } action (a.id is who sent it; check everything in it): change
                          s.hang (s is already a copy) and return true, or return false for no change
     tick(s, now)       → the host's heartbeat (every 200 ms): physics (balls …); return true when s.hang changed
     join(s, id)        → someone arrived mid-game;  left(s, id) → someone left (free their seat …)

   activity({ id, … }): its part on every screen (world.js asks each one every frame; all are optional):
     mount(ctx) / unmount()      when the cabin opens or closes on this screen (ctx below)
     near(pos, ctx)              → { label, act, d } or null: the context button. pos = my duck { x, y, z } in world px
                                   and inside (in the cabin?); the nearest d wins (d < 0 claims it: "Get up")
     onState(s, ctx)             a new room state arrived
     step(dt, now, ctx)          every frame, before drawing
     draw(now, ctx)              every frame, after the camera moved (ctx.toScreen places things)
     hold(ctx)                   → true while my duck can't walk (seated, playing); push(dx, dy, ctx) then gets the
                                   direction pressed (once a press); heldZ(ctx) → the height it is held at (a seat:
                                   no falling), or null
     jump(ctx)                   → true when Space is taken (it gets the duck up instead of jumping)
     keydown(e, ctx) / keyup(e, ctx) → true when the key is taken (piano keys)
     pointer(kind, pt, e, ctx)   kind 'down' | 'move' | 'up', pt = world { x, y } on the ground; true on 'down' takes
                                   the pointer until 'up' (no walking, no joystick meanwhile)
     speed(pos, ctx)             → how fast my duck walks at pos { x, y, z } (world px): 1 as usual (the water: slower)
     after(me, ev, now, ctx)     after each step of my duck (me: x, y 0 … 1, z, j …; ev: world.step's events; set
                                 ev.force to send the move at once): the trampoline bounces it again
     propClass(prop, s)          → a class for a prop's element ('off' for a lamp switched off)
     light(prop, s)              → false turns a prop's light off
   ctx = { state(), me, send(action), world } (world: toScreen, heightAt, sc, board, propEl(id), at(id) → where a duck
   is drawn { x, y, z } in world px, or null). */
export const RULES = new Map();   // k → its rules
export const ACTS = new Map();    // id → its screen part
export const rule = (k, r) => { RULES.set(k, r); };
export const activity = a => { ACTS.set(a.id, a); };
