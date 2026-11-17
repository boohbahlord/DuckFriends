/* ---------- Dead Ducks Arcade's power box (the owner's, Nov 16 17:22Z) ----------
   The game starts with the power cut. The box on the balcony, back left against the cabin wall, needs four parts: a
   fuse, a lever, a tool box and a gas can with gas in it. Every game they are somewhere else:
     - one is always in Justin's Butler's shop, for 250 points;
     - one is always carried by a zombie in rounds 1 to 5, dropped where it dies;
     - the other two are at two of these, picked at random: the bathroom sink, the kitchen counter, the couch, or the
       fireplace. The fireplace's rolls before its weapons and items: 5% on the first spin, 10% more on every spin after
       (anyone's), until someone gets it. The Butler sells that one too, for 750 (the owner's, Nov 16 21:21Z), except
       while it's out in a spin; bought, it's gone from the fireplace.
   A part on the floor stays there, never fading, until a duck walks over it. Every part goes into one pool everyone
   shares (the middle left of the screen). E at the box fits every part the pool holds; once all four are in, the next E
   turns the power on: every light, the balcony's and the porch's too, and the TV; every flashlight turns off by itself.
   The first time it lasts 6 rounds: it goes out as round 7 starts (the round it came on in counts as one). Then the
   flashlights turn back on.
   Once it has gone out, jerry cans come: 1% from the fireplace (rolled with the part, before the weapons), 1% from a
   zombie that dies, and 1% at each round's start in a part's spot (the sink, the counter, the couch). Only one is ever
   out at a time (on the floor, in the pool or in the fireplace), so another comes only once it's been poured. How full
   it is is rolled in this order: full 5% (12 rounds), else 3/4 25% (9), else 1/2 50% (6), else 1/4 75% (3), else almost
   empty (1). Its label is its fuel in percent of a full can's 12 rounds. E at the box pours it in: the power runs that
   many rounds, on top of what's left while it's still on.

   s.hang (online):
     pw  { fit: [parts in the box], pool: [parts found, not fitted yet], cans: [each jerry can's rounds], on: 1 while the
           power is on, left: the rounds it still lasts, this one included (between rounds: the next one counted too),
           ever: 1 once it has gone out the first time, tries: the fireplace's spins without its part, fire: the part in
           the fireplace (""), shop: the part the Butler sells (""), zp: the part a zombie will carry, zr: from which
           round, zi: the zombie that carries it (its number, 0 till its round), n: the last floor item's number }
     pk  [{ n, k (a part, or "can"), x, y, z (where it's drawn: on the sink, the counter or the couch), px, py (where a
           duck takes it), r (a jerry can's rounds) }]: what lies about to be taken
   s.hidden.l4seen { zombie: 1 }: the dead ones already rolled for a jerry can. */
import { PROPS, layoutVariant } from "./hangout/layout.js";
import * as GS from "./hangout/stationmap.js";
/* Downpour (Dead Ducks Arcade's second map, the owner's Nov 16 23:15Z): the generator's power box east of the gas
   station, running from the start with 8 rounds of gas and no parts to find (Nov 17 05:46Z: dpSetUp); jerry cans turn
   up at the spots in stationmap.js PART_SPOTS; the flashlights stay as they are when the power comes on (23:29Z);
   and a pump sells gas while the power is on: 3 rounds for 250 a round (23:29Z) */
const dpOn = () => layoutVariant() === "l4gs";

export const PARTS = ["fuse", "lever", "tools", "gas"];
const NAMES = {
  fuse: "Fuse",
  lever: "Lever",
  tools: "Tool box",
  gas: "Gas can",
  can: "Jerry can",
};
export const PW = {
  // the box on the balcony: its foot's middle, back left, against the cabin's south wall (clear of the hole); Downpour's
  // by its generator
  get X() {
    return dpOn() ? GS.POWER_SPOT.x : 2300;
  },
  get Y() {
    return dpOn() ? GS.POWER_SPOT.y + 14 : 2236;
  },
  // where E works from: the deck in front of it (Downpour: the grass in front of it)
  get E() {
    return dpOn() ? [GS.POWER_SPOT.x, GS.POWER_SPOT.y + 80] : [2300, 2300];
  },
  PUMP: 250, // Downpour: a round of gas at a pump …
  PUMP_ROUNDS: 3, // … sold 3 rounds at a time
  REACH: 130, // world px from there
  SHOP: 250, // the Butler's part
  SHOP_FIRE: 750, // the fireplace's part, bought from the Butler instead (the owner's, Nov 16 21:21Z)
  FIRST: 6, // rounds the power lasts the first time
  DP_GAS: 8, // Downpour: the rounds of gas the generator holds as the game starts
  ZOMBIE_BY: 5, // a zombie in rounds 1 to 5 carries a part
  FIRE: 0.05, // the fireplace's part: 5% on the first spin …
  FIRE_MORE: 0.1, // … and 10% more for each spin after
  CAN_FIRE: 0.01, // jerry cans (once the power has gone out): from the fireplace,
  CAN_ZOMBIE: 0.01, // from a zombie that dies,
  CAN_ROUND: 0.01, // at a round's start in a part's spot (each 1% only: the owner's, Nov 17 13:43Z)
  FULL: 12, // rounds in a full jerry can
  TAKE: 75, // world px: how near a duck walks to take what lies on the floor
  TAKE_SPOT: 110, // … and what lies on the sink, the counter or the couch (from the floor in front)
};
/* a jerry can's rounds, rolled in the owner's order: each fill only if the one before it failed */
const CANS = [
  [12, 0.05],
  [9, 0.25],
  [6, 0.5],
  [3, 0.75],
];
export function canRounds() {
  for (const [n, p] of CANS) if (Math.random() < p) return n;
  return 1;
}
/* its fuel in percent of a full can: 100, 75, 50, 25, 8 */
export const canPct = (r) => Math.round((r / PW.FULL) * 100);
export const partName = (k) => NAMES[k] || k;
/* the fireplace's weapon string for a part or a jerry can: "pw:fuse", "pw:can:9" */
export const isPw = (w) => typeof w === "string" && w.startsWith("pw:");
export const pwOf = (w) => {
  const [, k, r] = w.split(":");
  return { k, r: +r || 0 };
};
export const pwName = (w) => {
  const { k, r } = pwOf(w);
  return k === "can" ? `${partName(k)} (${canPct(r)}%)` : partName(k);
};

/* where the parts lie: on the bathroom's sink, the kitchen's first counter, the great room's couch; each with the floor
   in front of it, where a duck takes it */
const prop = (k, f = () => true) => PROPS.find((p) => p.kind === k && f(p));
export function spotOf(k) {
  if (String(k).startsWith("dp")) {
    const q = GS.PART_SPOTS[+k.slice(2)];
    return {
      x: q.x,
      y: q.y,
      z: q.z,
      px: q.x,
      py: q.y + (q.z ? 60 : 0),
      key: q.y + 2,
    };
  }
  if (k === "sink") {
    const p = prop("sink");
    return {
      x: p.x + p.w / 2,
      y: p.y + p.d - 12, // (at the front of its top)
      z: 40, // (its top as drawn)
      px: p.x + p.w / 2,
      py: p.y + p.d + 60,
      key: p.key + 2,
    };
  }
  if (k === "counter") {
    const p = prop("counter");
    return {
      x: p.x + p.w / 2,
      y: p.y + p.d - 12, // (at the front of its top)
      z: 40, // (its top as drawn)
      px: p.x + p.w / 2,
      py: p.y + p.d + 60,
      key: p.key + 2,
    };
  }
  const p = prop("couch", (c) => c.w > c.d && c.y > 2000); // (against the south wall, its back to us: sat on from the north)
  return {
    x: p.x + p.w / 2,
    y: p.y + p.d / 2,
    z: 40,
    px: p.x + p.w / 2,
    py: p.y - 50,
    key: p.key + 2,
  };
}
const CABIN_SPOTS = ["sink", "counter", "couch"];
const spots = () =>
  dpOn() ? GS.PART_SPOTS.map((_, k) => "dp" + k) : CABIN_SPOTS;

export const pwState = (s) => (s && s.hang && s.hang.pw) || null;
export const powerOn = (s) => !!(s && s.hang && s.hang.power);
/* the rounds the power still lasts, the one being played included (0 while it's off) */
export function roundsLeft(s) {
  const pw = pwState(s);
  if (!pw || !pw.on) return 0;
  return Math.max(0, pw.left - (s.hang.l4 && s.hang.l4.wait ? 1 : 0));
}
/* is a jerry can out: on the floor, in the pool, or in someone's fireplace spin? */
function canOut(s) {
  const pw = s.hang.pw;
  return (
    pw.cans.length > 0 ||
    (s.hang.pk || []).some((o) => o.k === "can") ||
    Object.values(s.hang.l4box || {}).some(
      (b) => b && isPw(b.w) && pwOf(b.w).k === "can",
    )
  );
}
const canCome = (s) => !!s.hang.pw.ever && !canOut(s);

/* ---------- the rules' side (l4ddrules.js calls these; h: its helpers) ---------- */
/* a new game: the four parts shuffled into their places */
export function powerSetUp(s) {
  if (dpOn()) return dpSetUp(s);
  const p = [...PARTS].sort(() => Math.random() - 0.5),
    where = [...CABIN_SPOTS, "fire"]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
  const pw = {
    fit: [],
    pool: [],
    cans: [],
    on: 0,
    left: 0,
    ever: 0,
    tries: 0,
    fire: "",
    shop: p[0],
    zp: p[1],
    zr: 1 + Math.floor(Math.random() * PW.ZOMBIE_BY),
    zi: 0,
    n: 0,
  };
  const pk = [];
  where.forEach((w, k) => {
    if (w === "fire") pw.fire = p[2 + k];
    else pk.push({ n: ++pw.n, k: p[2 + k], ...spotOf(w), at: w });
  });
  s.hang.pw = pw;
  s.hang.pk = pk;
  s.hang.power = 0;
}
/* Downpour: the generator is already running, with no parts to find (the owner's, Nov 17 05:46Z): every part is in,
   and it holds DP_GAS rounds of gas (the round about to start counted too: it goes out as the round after them starts).
   The players still feed it: the pumps sell gas while it runs, and jerry cans turn up from the start (ever) */
function dpSetUp(s) {
  s.hang.pw = {
    fit: [...PARTS],
    pool: [],
    cans: [],
    on: 1,
    left: PW.DP_GAS + 1,
    ever: 1,
    tries: 0,
    fire: "",
    shop: "",
    zp: "",
    zr: 0,
    zi: 0,
    n: 0,
  };
  s.hang.pk = [];
  s.hang.power = 1;
}
/* the power on or off, for everyone: the lights, the TV, and every flashlight off (on) or back on (off) */
function setPower(s, on, now, h) {
  s.hang.power = on ? 1 : 0;
  s.hang.pw = { ...s.hang.pw, on: on ? 1 : 0, ...(on ? {} : { ever: 1 }) };
  if (!dpOn())
    s.hang.l4f = on
      ? Object.fromEntries(h.players(s).map((id) => [id, 1]))
      : {}; // (Downpour: the flashlights stay as they are)
  h.addFx(s, { kind: on ? "l4pwon" : "l4pwoff", by: "", who: [], t: now });
}
/* a round starts (newRound): the power counts it, maybe goes out; the zombie with the part is picked; a jerry can may
   turn up in a part's spot */
export function powerRound(s, r, now, h) {
  const pw = s.hang.pw,
    L = s.hang.l4;
  if (!pw || !L || r < 1) return;
  if (pw.on) {
    const left = pw.left - 1;
    s.hang.pw = { ...pw, left };
    if (left <= 0) setPower(s, false, now, h);
  }
  const w = s.hang.pw;
  if (w.zp && !w.zi && r >= w.zr && L.n > 0)
    s.hang.pw = { ...w, zi: L.next + Math.floor(Math.random() * L.n) }; // (one of this round's zombies, by its number)
  if (canCome(s) && Math.random() < PW.CAN_ROUND) {
    const busy = (s.hang.pk || []).map((o) => o.at),
      free = spots().filter((k) => !busy.includes(k));
    if (free.length) {
      const at = free[Math.floor(Math.random() * free.length)];
      lay(s, { k: "can", r: canRounds(), ...spotOf(at), at });
    }
  }
}
function lay(s, o) {
  const n = s.hang.pw.n + 1;
  s.hang.pw = { ...s.hang.pw, n };
  s.hang.pk = [...(s.hang.pk || []), { n, ...o }];
}
/* every heartbeat: a zombie dying drops the part it carries (or, 1 in 100, a jerry can); a duck walking over something
   takes it into the pool */
export function powerTick(s, zs, now, ids, h) {
  const pw = s.hang.pw;
  if (!pw) return;
  const seen = (s.hidden && s.hidden.l4seen) || {},
    next = {};
  let changed = false;
  for (const z of zs) {
    if (z.st !== 3) continue;
    next[z.i] = 1;
    if (seen[z.i]) continue;
    changed = true;
    const [x, y] = h.playable(z.x, z.y)
      ? [z.x, z.y]
      : h.dropSpot(s) || [z.x, z.y];
    const spot = { x: Math.round(x), y: Math.round(y), z: 0, px: x, py: y };
    if (s.hang.pw.zi && z.i === s.hang.pw.zi) {
      const k = s.hang.pw.zp;
      s.hang.pw = { ...s.hang.pw, zp: "", zi: 0 };
      lay(s, { k, ...spot });
    } else if (canCome(s) && Math.random() < PW.CAN_ZOMBIE)
      lay(s, { k: "can", r: canRounds(), ...spot });
  }
  if (changed || Object.keys(seen).length !== Object.keys(next).length)
    s.hidden = { ...(s.hidden || {}), l4seen: next };
  const pk = s.hang.pk || [];
  if (!pk.length) return;
  let left = pk;
  for (const o of pk) {
    const far = o.z ? PW.TAKE_SPOT : PW.TAKE,
      by = ids.find((id) => {
        const p = s.pos[id];
        return (
          p &&
          h.standing(s, id) &&
          Math.hypot(p.x * h.W - o.px, p.y * h.H - o.py) < far
        );
      });
    if (!by) continue;
    left = left.filter((x) => x !== o);
    take(s, o.k, o.r, by, now, h);
  }
  if (left !== pk) s.hang.pk = left;
}
/* something found goes into everyone's pool */
function take(s, k, r, by, now, h) {
  const pw = s.hang.pw;
  s.hang.pw =
    k === "can"
      ? { ...pw, cans: [...pw.cans, r] }
      : { ...pw, pool: [...pw.pool, k] };
  h.addFx(s, { kind: "l4pwgot", k, r, by, who: [], t: now });
}
/* the fireplace's turn, before its weapons: the part it holds, or a jerry can; "" for neither */
/* is the fireplace's part out in its spin right now (to be taken there, not bought)? */
const fireOut = (s, pw) =>
  Object.values(s.hang.l4box || {}).some(
    (b) => b && isPw(b.w) && pwOf(b.w).k === pw.fire,
  );
export function powerFire(s) {
  const pw = s.hang.pw;
  if (!pw) return "";
  const held = fireOut(s, pw);
  if (pw.fire && !held) {
    if (Math.random() < PW.FIRE + PW.FIRE_MORE * pw.tries)
      return "pw:" + pw.fire;
    s.hang.pw = { ...pw, tries: pw.tries + 1 };
  }
  if (canCome(s) && Math.random() < PW.CAN_FIRE) return "pw:can:" + canRounds();
  return "";
}
/* the fireplace's part or jerry can, taken (E, by whoever paid) */
export function powerTake(s, w, by, now, h) {
  const { k, r } = pwOf(w);
  if (k === s.hang.pw.fire) s.hang.pw = { ...s.hang.pw, fire: "" };
  take(s, k, r, by, now, h);
}
/* the Butler's part: 250 points, once (whoever buys it first). fire: the fireplace's part instead, for 750; once it's
   bought it's gone from the fireplace too (and once the fireplace gives it, gone from the Butler) */
export const fireForSale = (s) => {
  const pw = s && s.hang && s.hang.pw;
  return pw && pw.fire && !fireOut(s, pw) ? pw.fire : "";
};
export function powerBuy(s, id, now, h, fire = false) {
  const pw = s.hang.pw,
    k = fire ? fireForSale(s) : pw && pw.shop,
    price = fire ? PW.SHOP_FIRE : PW.SHOP;
  if (!k || h.ptsOf(s, id) < price) return false;
  h.addPts(s, id, -price);
  s.hang.pw = { ...pw, ...(fire ? { fire: "" } : { shop: "" }) };
  take(s, k, 0, id, now, h);
  h.addFx(s, { kind: "l4buy", by: id, who: [], w: "part", t: now });
  return true;
}
/* E at the box: every part the pool holds goes in; with all four in, the power comes on; with a jerry can, it's poured
   in (on top of what's left while the power is on) */
export function powerAct(s, id, now, mx, my, h) {
  const pw = s.hang.pw,
    L = s.hang.l4;
  if (!pw || Math.hypot(mx - PW.E[0], my - PW.E[1]) > PW.REACH * 1.6)
    return false;
  const between = !!(L && L.wait); // (between rounds the next one is counted too)
  if (pw.pool.length) {
    s.hang.pw = { ...pw, fit: [...pw.fit, ...pw.pool], pool: [] };
    h.addFx(s, { kind: "l4pwfit", n: pw.pool.length, by: id, who: [], t: now });
    return true;
  }
  if (pw.fit.length < PARTS.length) return false;
  if (!pw.on && !pw.ever) {
    s.hang.pw = { ...pw, left: PW.FIRST + (between ? 1 : 0) };
    setPower(s, true, now, h);
    return true;
  }
  if (!pw.cans.length) return false;
  const [r, ...rest] = pw.cans;
  s.hang.pw = {
    ...pw,
    cans: rest,
    left: pw.on ? pw.left + r : r + (between ? 1 : 0),
  };
  h.addFx(s, { kind: "l4pwgas", r, by: id, who: [], t: now });
  if (!pw.on) setPower(s, true, now, h);
  return true;
}
/* Downpour: E at a pump, while the power is on, buys 3 rounds of gas (250 a round). Only close by it, on its bottom
   (south) side (the owner's, Nov 17 18:05Z: "the pumps effective range where u use them has changed"): over its width
   and PUMP_SIDE either side, from its front face out to PUMP_OUT (world px) */
const PUMP_SIDE = 30,
  PUMP_OUT = 100;
export const pumpNear = (mx, my) =>
  dpOn() &&
  GS.PUMPS.some(
    (p) =>
      mx > p.x0 - PUMP_SIDE &&
      mx < p.x1 + PUMP_SIDE &&
      my >= p.y1 - 4 &&
      my < p.y1 + PUMP_OUT,
  );
export function powerPump(s, id, now, mx, my, h) {
  const pw = s.hang.pw,
    price = PW.PUMP * PW.PUMP_ROUNDS;
  if (!pw || !pw.on || !pumpNear(mx, my)) return false;
  if (h.ptsOf(s, id) < price) return false;
  h.addPts(s, id, -price);
  s.hang.pw = { ...pw, left: pw.left + PW.PUMP_ROUNDS };
  h.addFx(s, { kind: "l4pwgas", r: PW.PUMP_ROUNDS, by: id, who: [], t: now });
  return true;
}
/* what E at the box would do now, for its button: "fit", "on", "pour" or "" (it only shows the count) */
export function powerNext(s) {
  const pw = pwState(s);
  if (!pw) return "";
  if (pw.pool.length) return "fit";
  if (pw.fit.length < PARTS.length) return "";
  if (!pw.on && !pw.ever) return "on";
  return pw.cans.length ? "pour" : "";
}
