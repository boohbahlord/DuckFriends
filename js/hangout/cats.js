/* ---------- Duck Cabin's cats: Annabelle, Bubbles, Oreo and Opal ----------
   Their brains, run by the host (npc.js). They wander the cabin, meow (in the chat and a bubble), sit on the couches
   and jump on the tables. Nobody can hurt them and commands don't work on them; a swipe between cats only sends one
   running, except Annabelle's: she swipes Oreo when she catches him attacking another cat, and he plays dead a moment.
   - Annabelle: friendly. Walks up to ducks; E pets her and she purrs. Now and then goes out the front door, wanders the
     front and comes back.
   - Bubbles: shy. Picks one player to like; only they can pet him, a little (half the time he runs off when petted).
     A duck rushing at him scares him off; one walking up slowly may make him freeze (1 in 4). Swipes back at Oreo.
   - Oreo: sprints about now and then; sometimes meows, then swipes a nearby duck, who plays dead. Picks on the other
     cats too (never Annabelle, seldom Opal).
   - Opal: runs and hides from every duck; follows Bubbles when nobody is near.
   s.hang.npc[cat] = { w, a, f, z, say } (npc.js); what each one is up to stays with the host (mem). */
import { brain, npcAt, randomSpot, indoors, outFront, nearestOpen, DOORS, CABIN } from './npc.js';
import { PROPS } from './layout.js';

export const CAT_IDS = ['annabelle', 'bubbles', 'oreo', 'opal'];
const WALK = 110, TROT = 200, SPRINT = 560;
const MEOWS = ['Meow.', 'Mew!', 'Mrrp?', 'Meeeow.', 'Mrow.'];
const PURR = 'Purrrrr…', HISS = 'Hsss!';
const sec = (rand, a, b) => (a + rand() * (b - a)) * 1000;
const mem = new Map();   // cat → { next, mode, until, meow, … } (the host's own notes)
const M = (id, now, rand) => { if (!mem.has(id)) mem.set(id, { next: now + sec(rand, 1, 5), meow: now + sec(rand, 20, 70), mode: 'idle' }); return mem.get(id); };
export const resetCats = () => mem.clear();

/* the furniture a cat gets up on: couches (on the seat), tables and beds (on top) */
const PERCH = PROPS.filter(p => ['couch', 'table', 'bed'].includes(p.kind) && p.only === 'in')
  .map(p => ({ id: p.id, kind: p.kind, x: p.x + p.w / 2, y: p.y + p.d / 2, z: (p.z || 0) + (p.kind === 'couch' ? Math.round(p.h * .55) : p.h) }));
/* somewhere in the cabin to go */
const roomSpot = rand => randomSpot(rand, indoors, { dry: true });
/* up onto a perch: walk beside it, then hop on (the screens show the hop when z changes) */
function perch(me, c, mm, kinds) {
  const list = PERCH.filter(p => kinds.includes(p.kind)); if (!list.length) return false;
  const p = list[Math.floor(c.rand() * list.length)], beside = nearestOpen(p.x, p.y, { dry: true }, 12, indoors); if (!beside) return false;
  if (!c.go(me, beside[0], beside[1], WALK, { dry: true })) return false;
  mm.mode = 'toPerch'; mm.perch = p; me.a = '';
  return true;
}
const onPerch = (me, mm, now) => { const p = mm.perch; me.w = { p: [[p.x, p.y]], t: now, v: 1 }; me.z = p.z; me.a = mm.sitAs || 'sit'; mm.mode = 'perched'; };
/* the nearest duck (that isn't dead) within r */
const nearestDuck = (at, c, r = Infinity, ok = () => true) => {
  let best = null, bd = r;
  for (const d of c.ducks) { if (d.dead || !ok(d)) continue; const dd = c.dist(at, d); if (dd < bd) { bd = dd; best = d; } }
  return best && { d: best, dist: bd };
};
/* a spot in the cabin away from (fx, fy), r or so off */
function awayFrom(at, fx, fy, r, c) {
  const a = Math.atan2(at.y - fy, at.x - fx);
  for (let t = 0; t < 8; t++) {
    const b = a + (c.rand() - .5) * (1 + t * .4), x = at.x + Math.cos(b) * r, y = at.y + Math.sin(b) * r;
    const p = nearestOpen(x, y, { dry: true }, 4, indoors); if (p) return p;   // (they keep to the cabin)
  }
  return roomSpot(c.rand);
}
const run = (me, c, mm, to, v = SPRINT, mode = 'flee') => { if (!to || !c.go(me, to[0], to[1], v, { dry: true })) return false; me.a = ''; mm.mode = mode; mm.next = c.now + sec(c.rand, 3, 6); return true; };
/* every cat: meows now and then, wanders the cabin, sits somewhere */
function everyday(id, me, c, mm, at, { perchKinds = [], perchOdds = 0, sitOdds = .4 } = {}) {
  let ch = false;
  if (c.now > mm.meow) { mm.meow = c.now + sec(c.rand, 35, 110); c.say(id, MEOWS[Math.floor(c.rand() * MEOWS.length)]); }
  if (mm.mode === 'toPerch' && !at.moving) { onPerch(me, mm, c.now); mm.next = c.now + sec(c.rand, 15, 40); return true; }
  if (c.now < mm.next || at.moving) return ch;
  if (perchKinds.length && c.rand() < perchOdds && perch(me, c, mm, perchKinds)) return true;
  if (c.rand() < sitOdds) { c.stop(me); me.a = c.rand() < .5 ? 'sit' : 'loaf'; mm.mode = 'idle'; mm.next = c.now + sec(c.rand, 6, 18); return true; }
  const to = roomSpot(c.rand); if (to && c.go(me, to[0], to[1], WALK, { dry: true })) { me.a = ''; mm.mode = 'wander'; mm.next = c.now + sec(c.rand, 2, 6); return true; }
  mm.next = c.now + 1000; return ch;
}
const start = (rand, now) => { const p = roomSpot(rand) || [2400, 1000]; return { w: { p: [p], t: now, v: 1 }, a: 'sit', f: rand() < .5 ? 1 : -1 }; };

/* ---------- Annabelle ---------- */
brain('annabelle', {
  kind: 'cat', name: 'Annabelle',
  init: (now, rand) => start(rand, now),
  tick(me, c) {
    const mm = M('annabelle', c.now, c.rand), at = npcAt(me, c.now); if (!at) return false;
    /* she keeps Oreo honest: an attack on another cat near her and she swipes him */
    const o = mem.get('oreo');
    if (o && o.mode === 'catFight' && o.victim !== 'annabelle' && mm.mode !== 'punish') {
      const op = c.at('oreo'); if (op && c.dist(at, op) < 650 && c.go(me, op.x, op.y, SPRINT, { dry: true })) { me.a = ''; mm.mode = 'punish'; mm.until = c.now + 4000; return true; }
    }
    if (mm.mode === 'punish') {
      const op = c.at('oreo');
      if (op && c.dist(at, op) < 60) {
        c.stop(me); me.a = 'swipe'; me.f = op.x > at.x ? 1 : -1; c.say('annabelle', HISS); c.fx('annabelle', 'oreo', 'swipe');
        c.poke('oreo', r => { c.stop(r); r.a = 'dead'; });
        const om = mem.get('oreo'); if (om) { om.mode = 'dead'; om.until = c.now + 5000; }
        mm.mode = 'idle'; mm.next = c.now + 2500; return true;
      }
      if (c.now > mm.until) { mm.mode = 'idle'; mm.next = c.now; }
      return false;
    }
    if (mm.mode === 'petted' && c.now < mm.until) return false;
    /* outside: she wanders the front a while, then comes home */
    if (mm.mode === 'outside' || mm.mode === 'goingOut') {
      if (at.moving || c.now < mm.next) return false;
      if (c.now > mm.until) { const to = roomSpot(c.rand); if (to && c.go(me, to[0], to[1], WALK, { dry: true })) { mm.mode = 'wander'; mm.next = c.now + 3000; me.a = ''; return true; } return false; }
      mm.mode = 'outside';
      if (c.rand() < .35) { c.stop(me); me.a = 'sit'; mm.next = c.now + sec(c.rand, 5, 12); return true; }
      const to = randomSpot(c.rand, outFront, { dry: true }); if (to && c.go(me, to[0], to[1], WALK, { dry: true })) { me.a = ''; mm.next = c.now + sec(c.rand, 1, 4); return true; }
      return false;
    }
    if (!at.moving && c.now >= mm.next && mm.mode !== 'toPerch') {
      const r = c.rand();
      if (r < .07) {   // out the front door
        const to = randomSpot(c.rand, outFront, { dry: true });
        if (to && c.go(me, to[0], to[1], WALK, { dry: true })) { me.a = ''; mm.mode = 'goingOut'; mm.until = c.now + sec(c.rand, 25, 50); mm.next = c.now; return true; }
      } else if (r < .37) {   // up to a duck nearby
        const n = nearestDuck(at, c, 900, d => indoors(d.x, d.y));
        if (n && n.dist > 90) {
          const a = Math.atan2(at.y - n.d.y, at.x - n.d.x), x = n.d.x + Math.cos(a) * 60, y = n.d.y + Math.sin(a) * 60;
          if (c.go(me, x, y, WALK, { dry: true })) { me.a = ''; mm.mode = 'visit'; mm.next = c.now + sec(c.rand, 8, 16); return true; }
        }
      }
    }
    if (mm.mode === 'visit' && !at.moving && me.a !== 'sit') { me.a = 'sit'; return true; }
    return everyday('annabelle', me, c, mm, at, { perchKinds: ['couch', 'table'], perchOdds: .3 });
  },
  act(me, a, c) {   // E: a pet, and she purrs
    if (a.do !== 'pet') return false;
    const mm = M('annabelle', c.now, c.rand); c.stop(me); me.a = 'sit'; c.say('annabelle', PURR); c.fx('annabelle', a.id, 'purr');
    if (mm.mode !== 'perched') { mm.mode = 'petted'; mm.until = c.now + 5000; mm.next = c.now + 5000; }
    return true;
  },
});

/* ---------- Bubbles ---------- */
brain('bubbles', {
  kind: 'cat', name: 'Bubbles',
  init: (now, rand) => start(rand, now),
  tick(me, c) {
    const mm = M('bubbles', c.now, c.rand), at = npcAt(me, c.now); if (!at) return false;
    /* the one he likes (picked again if they've gone) */
    if (!mm.likes || !c.ducks.some(d => d.id === mm.likes)) { const pick = c.ducks[Math.floor(c.rand() * c.ducks.length)]; mm.likes = pick ? pick.id : null; mm.pets = 0; }
    /* Oreo too close, or swiping at him: he swipes back */
    const op = c.at('oreo'), om = mem.get('oreo');
    if (op && mm.mode !== 'flee' && c.dist(at, op) < 55 && c.now > (mm.swiped || 0) && !(om && om.mode === 'dead')) {
      mm.swiped = c.now + 6000; c.stop(me); me.a = 'swipe'; me.f = op.x > at.x ? 1 : -1; c.say('bubbles', HISS); c.fx('bubbles', 'oreo', 'swipe');
      if (om) { om.mode = 'idle'; om.next = c.now + 4000; }
      c.poke('oreo', r => { const p = npcAt(r, c.now); if (p) { const to = awayFrom(p, at.x, at.y, 260, c); if (to && c.send(r, to[0], to[1], SPRINT, { dry: true })) r.a = ''; } });
      mm.next = c.now + 1500; return true;
    }
    if (mm.mode === 'frozen') { if (c.now < mm.until) return false; mm.mode = 'idle'; }
    /* ducks coming at him: running at him scares him off; a slow one may freeze him */
    if (mm.mode !== 'flee') {
      for (const d of c.ducks) {
        if (d.dead) continue; const dist = c.dist(at, d); if (dist > 260) continue;
        const coming = mm.close && mm.close[d.id] !== undefined && mm.close[d.id] > dist + 15;
        if (d.speed > 450 && coming) { c.say('bubbles', HISS); if (run(me, c, mm, awayFrom(at, d.x, d.y, 520, c))) return true; }
        else if (coming && d.id !== mm.likes && c.rand() < .25 && !(mm.frozeFor || {})[d.id]) { mm.frozeFor = { ...(mm.frozeFor || {}), [d.id]: 1 }; c.stop(me); me.a = 'sit'; mm.mode = 'frozen'; mm.until = c.now + sec(c.rand, 3, 6); return true; }
      }
      mm.close = Object.fromEntries(c.ducks.map(d => [d.id, c.dist(at, d)]));
      if (!c.ducks.some(d => c.dist(at, d) < 300)) mm.frozeFor = {};
    }
    if (mm.mode === 'flee') { if (at.moving) return false; mm.mode = 'idle'; me.a = 'sit'; mm.next = c.now + sec(c.rand, 4, 9); return true; }
    if (mm.mode === 'petted') { if (c.now < mm.until) return false; mm.mode = 'idle'; mm.next = c.now; }
    return everyday('bubbles', me, c, mm, at, { perchKinds: ['bed'], perchOdds: .15 });
  },
  act(me, a, c) {
    if (a.do !== 'pet') return false;
    const mm = M('bubbles', c.now, c.rand), at = npcAt(me, c.now);
    if (a.id !== mm.likes) { c.say('bubbles', HISS); return run(me, c, mm, awayFrom(at, at.x - 1, at.y, 300, c), TROT, 'flee') || true; }
    if (c.rand() < .5) { return run(me, c, mm, awayFrom(at, at.x - me.f, at.y, 420, c), SPRINT) || true; }   // even from his favorite, half the time
    mm.pets = (mm.pets || 0) + 1; c.stop(me); me.a = 'sit'; c.say('bubbles', PURR); c.fx('bubbles', a.id, 'purr');
    if (mm.pets >= 2) { mm.pets = 0; mm.mode = 'idle'; mm.next = c.now + 3000; }   // only a little: then off he walks
    else { mm.mode = 'petted'; mm.until = c.now + 3500; }
    return true;
  },
});

/* ---------- Oreo ---------- */
brain('oreo', {
  kind: 'cat', name: 'Oreo',
  init: (now, rand) => start(rand, now),
  tick(me, c) {
    const mm = M('oreo', c.now, c.rand), at = npcAt(me, c.now); if (!at) return false;
    if (!mm.zoom) { mm.zoom = c.now + sec(c.rand, 30, 80); mm.hunt = c.now + sec(c.rand, 50, 120); mm.fight = c.now + sec(c.rand, 80, 180); }
    if (mm.mode === 'dead') { if (c.now < mm.until) return false; mm.mode = 'idle'; me.a = 'sit'; mm.next = c.now + 3000; return true; }
    /* the zoomies: a few sprints round the cabin */
    if (mm.mode === 'zoom') {
      if (at.moving) return false;
      if (mm.laps-- > 0) { const to = roomSpot(c.rand); if (to && c.go(me, to[0], to[1], SPRINT, { dry: true })) { me.a = ''; return true; } }
      mm.mode = 'idle'; mm.next = c.now + 2000; return false;
    }
    if (c.now > mm.zoom && !at.moving && mm.mode !== 'hunt' && mm.mode !== 'catFight') { mm.zoom = c.now + sec(c.rand, 40, 90); mm.mode = 'zoom'; mm.laps = 2 + Math.floor(c.rand() * 3); return false; }
    /* a duck: up to it, a meow, then a swipe and it plays dead */
    if (mm.mode === 'hunt') {
      const d = c.ducks.find(q => q.id === mm.prey);
      if (!d || d.dead || !indoors(d.x, d.y) || c.now > mm.until) { mm.mode = 'idle'; mm.next = c.now + 2000; return false; }
      const dist = c.dist(at, d);
      if (dist < 70) {
        if (!mm.meowed) { mm.meowed = c.now; c.stop(me); me.f = d.x > at.x ? 1 : -1; c.say('oreo', 'Meow.'); return true; }
        if (c.now - mm.meowed > 900) { c.stop(me); me.a = 'swipe'; me.f = d.x > at.x ? 1 : -1; c.kill('oreo', d.id, 'swipe'); mm.mode = 'idle'; mm.next = c.now + 2500; return true; }
        return false;
      }
      if (c.now > (mm.chase || 0)) { mm.chase = c.now + 700; mm.meowed = 0; if (c.go(me, d.x, d.y, dist > 250 ? SPRINT : TROT, { dry: true })) { me.a = ''; return true; } }
      return false;
    }
    if (c.now > mm.hunt && !at.moving) {
      mm.hunt = c.now + sec(c.rand, 60, 140);
      const n = nearestDuck(at, c, 600, d => indoors(d.x, d.y)); if (n) { mm.mode = 'hunt'; mm.prey = n.d.id; mm.until = c.now + 15000; mm.meowed = 0; mm.chase = 0; return false; }
    }
    /* another cat (never Annabelle; Opal seldom) */
    if (mm.mode === 'catFight') {
      const v = c.at(mm.victim);
      if (!v || c.now > mm.until) { mm.mode = 'idle'; mm.next = c.now + 2000; return false; }
      if (c.dist(at, v) < 60) {
        c.stop(me); me.a = 'swipe'; me.f = v.x > at.x ? 1 : -1; c.say('oreo', HISS); c.fx('oreo', mm.victim, 'swipe');
        const vm = mem.get(mm.victim); if (vm) { vm.mode = 'flee'; vm.next = c.now + 3000; }
        if (mm.victim === 'bubbles' && c.rand() < .5) {   // Bubbles swipes back, and off Oreo runs
          const bm = mem.get('bubbles'); if (bm) bm.swiped = c.now + 6000;
          c.poke('bubbles', r => { c.stop(r); r.a = 'swipe'; r.f = at.x > v.x ? 1 : -1; });
          c.say('bubbles', HISS); c.fx('bubbles', 'oreo', 'swipe');
          const to = awayFrom(at, v.x, v.y, 300, c); if (to && c.send(me, to[0], to[1], SPRINT, { dry: true })) me.a = '';
          if (vm) vm.mode = 'idle';
        }
        c.poke(mm.victim, r => { const p = npcAt(r, c.now); if (p) { const to = awayFrom(p, at.x, at.y, 400, c); if (to && c.send(r, to[0], to[1], SPRINT, { dry: true })) r.a = ''; } });
        mm.until = c.now + 1200; mm.victim = mm.victim + ''; mm.mode = 'afterFight'; mm.next = c.now + 3000; return true;
      }
      if (c.now > (mm.chase || 0)) { mm.chase = c.now + 800; if (c.go(me, v.x, v.y, TROT, { dry: true })) { me.a = ''; return true; } }
      return false;
    }
    if (mm.mode === 'afterFight') { if (c.now < mm.until) return false; mm.mode = 'idle'; }
    if (c.now > mm.fight && mm.mode !== 'hunt' && mm.mode !== 'zoom') {
      mm.fight = c.now + sec(c.rand, 60, 150);
      const pick = c.rand() < .15 ? 'opal' : 'bubbles';
      if (c.at(pick) && c.dist(at, c.at(pick)) < 1800) { mm.mode = 'catFight'; mm.victim = pick; mm.until = c.now + 12000; mm.chase = 0; return false; }
    }
    return everyday('oreo', me, c, mm, at, { perchKinds: ['couch', 'table'], perchOdds: .3, sitOdds: .3 });
  },
});

/* ---------- Opal ---------- */
brain('opal', {
  kind: 'cat', name: 'Opal',
  init: (now, rand) => start(rand, now),
  tick(me, c) {
    const mm = M('opal', c.now, c.rand), at = npcAt(me, c.now); if (!at) return false;
    if (mm.mode === 'flee' && at.moving) return false;
    const n = nearestDuck(at, c, 320);
    if (n) { if (c.now > (mm.ran || 0)) { mm.ran = c.now + 1500; if (run(me, c, mm, awayFrom(at, n.d.x, n.d.y, 600, c), SPRINT)) return true; } return false; }
    if (mm.mode === 'flee') { mm.mode = 'hide'; me.a = 'loaf'; mm.next = c.now + sec(c.rand, 4, 10); return true; }
    /* nobody near: after Bubbles */
    const b = c.at('bubbles'), lonely = !nearestDuck(at, c, 550);
    if (b && lonely && indoors(b.x, b.y) && c.dist(at, b) > 110 && c.now > (mm.follow || 0)) {
      mm.follow = c.now + 2500;
      const a = Math.atan2(at.y - b.y, at.x - b.x), to = nearestOpen(b.x + Math.cos(a) * 70, b.y + Math.sin(a) * 70, { dry: true }, 3, indoors);
      if (to && c.go(me, to[0], to[1], c.dist(at, b) > 400 ? TROT : WALK, { dry: true })) { me.a = ''; mm.mode = 'follow'; return true; }
    }
    if (mm.mode === 'follow') { if (at.moving) return false; if (me.a !== 'sit') { me.a = 'sit'; return true; } return false; }
    return everyday('opal', me, c, mm, at, { sitOdds: .55 });
  },
});
export { DOORS, CABIN };
