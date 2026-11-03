/* ---------- Hangout's rules: s.hang and the { t: 'hang', k, … } action (the host runs them) ----------
   rules.js calls these: hangStart as the countdown ends, hangAction for a 'hang' action (k picks the activity's rule in
   registry.js), hangTick on the host's heartbeat, hangJoin and hangLeft as players come and go. Everyone starts (and a
   newcomer arrives) outside the front door. */
import { rulesOf } from "./registry.js";
import { isGhost } from "./death.js";
import { spawnAt, deckSpawnAt, heightAt, W, H } from "./layout.js";
import "./activities.js";

/* s.hang when the cabin opens: each activity's fields (the ones the room's mode runs) */
export function newHang(s) {
  const h = {};
  for (const [, r] of rulesOf(s)) if (r.init) Object.assign(h, r.init(s));
  return h;
}
const spot = (k) => {
  const p = deckSpawnAt(k);
  return {
    x: +(p.x / W).toFixed(5),
    y: +(p.y / H).toFixed(5),
    j: 0,
    z: Math.round(heightAt(p.x, p.y)),
    b: 0,
  };
};
export function hangStart(s, now) {
  s.hang = newHang(s);
  s.pos = {};
  s.lock = {};
  s.seat.forEach((id, k) => {
    s.pos[id] = spot(k);
  });
  for (const [, r] of rulesOf(s)) r.start?.(s, now); // (a mode of its own sets everyone up its way: Quacky Zombies)
}
export function hangJoin(s, id) {
  if (!s.hang) s.hang = newHang(s);
  const taken = Object.values(s.pos || {});
  let k = 0; // a joiner: the first free spot (nobody standing on it)
  while (
    k < 40 &&
    taken.some((p) => {
      const q = deckSpawnAt(k);
      return Math.hypot(p.x * W - q.x, p.y * H - q.y) < 60;
    })
  )
    k++;
  s.pos[id] = spot(k);
  for (const [, r] of rulesOf(s)) r.join?.(s, id);
}
export function hangLeft(s, id) {
  if (s.hang) for (const [, r] of rulesOf(s)) r.left?.(s, id);
}
/* a player's action: true when s.hang changed */
export function hangAction(s, a, now) {
  const r = new Map(rulesOf(s)).get(String(a.k));
  if (!r || !r.act) return false;
  if (a.k !== "ghost" && !r.ghosts && isGhost(s, a.id)) return false; // (a ghost can't use anything; a rule with ghosts: true hears them too)
  if (!s.hang) s.hang = newHang(s);
  return !!r.act(s, a, now);
}
/* the host's heartbeat: true when s.hang changed */
export function hangTick(s, now) {
  if (!s.hang) return false;
  let ch = false;
  for (const [, r] of rulesOf(s)) if (r.tick && r.tick(s, now)) ch = true;
  return ch;
}
/* what a bullet or a dagger can knock down besides the players (Justin): [{ id, x, y, z }] in world px */
export function hangTargets(s, now) {
  const out = [];
  if (s.hang)
    for (const [, r] of rulesOf(s))
      if (r.targets) out.push(...r.targets(s, now));
  return out;
}
/* one of them was hit by player `by`: true when s.hang changed */
export function hangHit(s, id, by, now) {
  let ch = false;
  if (s.hang)
    for (const [, r] of rulesOf(s))
      if (r.hit && r.hit(s, id, by, now)) ch = true;
  return ch;
}
/* a duck that can't move for now (shot by Justin: s.hang.still = { id: until }) */
export const hangStill = (s, id, now) =>
  !!(s.hang && s.hang.still && s.hang.still[id] > now);
