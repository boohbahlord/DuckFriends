/* ---------- Hangout's rules: s.hang and the { t: 'hang', k, … } action (the host runs them) ----------
   rules.js calls these: hangStart as the countdown ends, hangAction for a 'hang' action (k picks the activity's rule in
   registry.js), hangTick on the host's heartbeat, hangJoin and hangLeft as players come and go. Everyone starts (and a
   newcomer arrives) outside the front door. */
import { RULES } from './registry.js';
import { spawnAt, heightAt, W, H } from './layout.js';
import './activities.js';

/* s.hang when the cabin opens: each activity's fields */
export function newHang() { const h = {}; for (const r of RULES.values()) if (r.init) Object.assign(h, r.init()); return h; }
const spot = (k, n) => { const p = spawnAt(k, n); return { x: +(p.x / W).toFixed(5), y: +(p.y / H).toFixed(5), j: 0, z: Math.round(heightAt(p.x, p.y)), b: 0 }; };
export function hangStart(s) {
  s.hang = newHang(); s.pos = {}; s.lock = {};
  s.seat.forEach((id, k) => { s.pos[id] = spot(k, s.seat.length); });
}
export function hangJoin(s, id) {
  if (!s.hang) s.hang = newHang();
  s.pos[id] = spot(s.seat.length - 1 + Math.floor(Math.random() * 6), s.seat.length);
  for (const r of RULES.values()) r.join?.(s, id);
}
export function hangLeft(s, id) { if (s.hang) for (const r of RULES.values()) r.left?.(s, id); }
/* a player's action: true when s.hang changed */
export function hangAction(s, a, now) {
  const r = RULES.get(String(a.k)); if (!r || !r.act) return false;
  if (!s.hang) s.hang = newHang();
  return !!r.act(s, a, now);
}
/* the host's heartbeat: true when s.hang changed */
export function hangTick(s, now) {
  if (!s.hang) return false;
  let ch = false; for (const r of RULES.values()) if (r.tick && r.tick(s, now)) ch = true;
  return ch;
}
/* what a bullet or a dagger can knock down besides the players (Justin): [{ id, x, y, z }] in world px */
export function hangTargets(s, now) { const out = []; if (s.hang) for (const r of RULES.values()) if (r.targets) out.push(...r.targets(s, now)); return out; }
/* one of them was hit by player `by`: true when s.hang changed */
export function hangHit(s, id, by, now) { let ch = false; if (s.hang) for (const r of RULES.values()) if (r.hit && r.hit(s, id, by, now)) ch = true; return ch; }
