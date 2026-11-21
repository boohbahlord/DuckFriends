/* ---------- Sandbox: a made NPC's weapons in a fight (stage 3) ----------
   The owner's Sandbox file, "Entity Creation": a made NPC can hold two primary weapons and/or a melee weapon from the
   zombie mode, "it will have infinite ammo AND have to reload", and the zombie's swipe can be given as well. Its spawn
   gives it o.wp = { p: [two primaries], m (melee), sw (the swipe) }; in a fight it keeps as far off as its guns reach and
   shoots, with the other gun while one reloads, and up close it swings its melee weapon or swipes. Each weapon hits as
   hard and as often as it does in the zombie mode (l4ddrules.js ARMS). Its fight lives on it: mg (the rounds left in
   each gun's magazine), rl (when each one's reload ends), fa (its last shot), ma (its last melee swing), hw (what it
   holds now) and sh (its last shot: [when, x, y of where it went], for the screen's tracer) */
import { duckBig } from "./duck.js";
import { ARMS, WEAPONS, reachOf } from "./guns.js";
import { roll, reloadMs, refill } from "./npcrules.js";

/* what it can hold: its guns and the bow (not the thrown dagger), and the melee weapons (made the first time they're
   asked for) */
let arms = null;
export const npcArms = () =>
  (arms ??= {
    guns: WEAPONS.filter(
      (w) =>
        ARMS[w].kind === "ranged" &&
        ARMS[w].dmg !== undefined &&
        w !== "dagger",
    ),
    melee: WEAPONS.filter((w) => ARMS[w].kind === "melee"),
  });
const reach = (w) => reachOf(w, "sbnpc"); // (how far it fires each gun from: guns.js)
/* a kit as a player sent it, cleaned: only weapons it can hold, each in its own place */
export function cleanArms(w) {
  const x = w || {},
    p = Array.isArray(x.p) ? x.p : [],
    gun = (g) => (npcArms().guns.includes(g) ? g : "");
  return {
    p: [gun(p[0]), gun(p[1])],
    m: npcArms().melee.includes(x.m) ? x.m : "",
    sw: !!x.sw,
  };
}
const gunsOf = (o) => ((o.wp && o.wp.p) || []).filter(Boolean);
/* a new one's kit in its hands: full magazines, the first gun out (or its melee weapon) */
export function armUp(wp) {
  const W = cleanArms(wp),
    guns = W.p.filter(Boolean);
  if (!guns.length && !W.m) return W.sw ? {} : { wp: W }; // (only the swipe: a plain one; nothing: it never attacks)
  return {
    wp: W,
    mg: W.p.map((g) => (g && ARMS[g].mag) || 0),
    hw: guns[0] || W.m,
  };
}
/* how near it keeps to what it's after: most of its shortest gun's reach, else close enough to swing (claw) */
/* how far o's claw reaches to t: a Seriat file's hitbox (o.hb, sbnumberat.js) and its Size (o.sz) make it reach
   further, and a bigger one is reached sooner (all 1: the claw as it was) */
export const reachTo = (claw, o, t, s = null) =>
  (claw *
    (bigOf(o) + (t && t.o ? bigOf(t.o) : t && t.duck ? duckBig(s, t.id) : 1))) /
  2; // (and its spawn's Size, o.sz; a duck bigger than 100%: duck.js)
const bigOf = (o) => (o.hb || 1) * (o.sz || 1);
export const keepAt = (o, claw) => {
  const g = gunsOf(o);
  return g.length
    ? Math.max(claw * 0.9, Math.min(...g.map(reach)) * 0.7)
    : claw * 0.9;
};
const BEAT = 250; // ms: the most time a beat's shots are counted over (the host's heartbeat is 200)

/* one beat of NPC o fighting what it's after (to, its spot; bd duck lengths off). claw: how near a swing reaches; clawMs:
   the swipe's wait. hit(dmg, w) lands a blow (dmg null: the spawn's own damage box, the swipe); sees(to), where there
   are walls: nothing's in the way of a shot. Gives "claw" (a swing or a swipe: its claw marks show), "shot", or "" */
export function fight(o, to, bd, claw, now, clawMs, hit, sees = null) {
  const W = o.wp;
  if (!W) {
    if (bd > claw || now - o.a < clawMs) return ""; // (a plain one: the zombie's swipe)
    o.a = now;
    hit(null, "claw");
    return "claw";
  }
  if (bd <= claw) {
    if (W.m && now - (o.ma || 0) >= ARMS[W.m].cool) {
      o.ma = o.a = now;
      o.hw = W.m;
      hit(roll(ARMS[W.m].dmg), W.m);
      return "claw";
    }
    if (W.sw && now - o.a >= clawMs) {
      o.a = now;
      hit(null, "claw");
      return "claw";
    }
  }
  /* its guns: reloads that are done fill the magazine; it shoots the one in hand, or the other while that reloads */
  const mg = [...(o.mg || [0, 0])],
    rl = [...(o.rl || [0, 0])];
  refill(
    W.p,
    mg,
    rl,
    now,
    (g) => ARMS[g].mag,
    (g, i) => g && ARMS[g].mag && mg[i] <= 0,
  );
  const ready = (i) =>
      W.p[i] && (!ARMS[W.p[i]].mag || mg[i] > 0) && bd <= reach(W.p[i]),
    i = [0, 1]
      .filter(ready)
      .sort((a, b) => +(W.p[b] === o.hw) - +(W.p[a] === o.hw))[0]; // (the one in hand first)
  o.mg = mg;
  o.rl = rl;
  if (i === undefined || (sees && !sees(to))) return "";
  const g = W.p[i],
    A = ARMS[g];
  if (now - (o.fa || 0) < A.cool) return "";
  /* a beat is longer than the fast guns' wait: every shot it had time for in the last beat (never a whole magazine at
     once after a wait), up to what's left in its magazine */
  let n = Math.max(1, Math.floor(Math.min(BEAT, now - (o.fa || 0)) / A.cool));
  if (A.mag) n = Math.min(n, mg[i]);
  let dmg = 0;
  for (let k = 0; k < n; k++)
    dmg +=
      (roll(A.dmg) + (A.plus ? A.plus[Math.random() < 0.5 ? 0 : 1] : 0)) *
      (A.pellets
        ? bd < reach(g) / 2
          ? A.pellets
          : Math.ceil(A.pellets / 2)
        : 1); // (a shotgun: every pellet up close)
  o.fa = now;
  o.hw = g;
  o.sh = [now, Math.round(to.x * 1000) / 1000, Math.round(to.y * 1000) / 1000];
  if (A.mag) {
    mg[i] -= n;
    if (mg[i] <= 0) rl[i] = now + reloadMs(g);
  }
  hit(Math.round(dmg * 10) / 10, g);
  return "shot";
}
