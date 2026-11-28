/* ---------- Dead Ducks Arcade's power box (the owner's, Nov 16 17:22Z; reworked Nov 18 12:19Z) ----------
   The box on the balcony, back left against the cabin wall, is built from the start now (the owner's, Nov 18 12:19Z:
   "the power box is already put together by default in cabin now ... the cabin starts without power still until
   gasoline is added"): no parts to find, buy or spin for. The power stays off until gas is poured in.
   The gas (the owner's, Nov 18 12:19Z): everyone shares one row of jerry cans at the left of the screen, three at most.
   It is one amount of gas, in quarter cans (pw.gas, 0 to 12; a quarter is one round of power), shown as cans filled one
   after the other, the fullest first: 0 shows one empty can; 150% a full one and a half one; 200% two full ones and an
   empty one; 300% three full ones (canRow). A jerry can found adds its gas into the row (what doesn't fit stays where it
   lay, smaller). A found can is always full, 100% (4 rounds: the owner's, Nov 18 12:32Z). They come from a zombie that
   dies (1%) and at each round's start in a part's spot (1%), never from the fireplace, the Butler or the Priest; one a
   round at most, and one nobody took stays there into the next rounds.
   On Downpour a pump puts a quarter can (25%) into the row for 150 points. E at the box pours the fullest can in: the
   power runs that many rounds, on top of what's left while it's still on.

   s.hang (online):
     pw  { fit: [the box's parts, all of them], on: 1 while the power is on, left: the rounds it still lasts, this one
           included (between rounds: the next one counted too), gas: the row's gas in quarter cans, cr: the round the
           last jerry can came in, n: the last floor item's number }
     pk  [{ n, k ("can"), x, y, z (where it's drawn: on the sink, the counter or the couch), px, py (where a duck takes
           it), r (its gas, in quarter cans) }]: what lies about to be taken
   s.hidden.l4seen { zombie: 1 }: the dead ones already rolled for a jerry can. */
import { PROPS, layoutVariant } from "./hangout/layout.js";
import * as GS from "./hangout/stationmap.js";
/* Downpour (Dead Ducks Arcade's second map, the owner's Nov 16 23:15Z): the generator's power box east of the gas
   station, running from the start with 8 rounds of gas (Nov 17 05:46Z: dpSetUp); jerry cans turn up at the spots in
   stationmap.js PART_SPOTS; the flashlights stay as they are when the power comes on (23:29Z); and the pumps fill the
   row's jerry cans (Nov 18 12:19Z: "the gas station now fills up an empty jerry can every player shares on the left
   screen ONLY in downpour") */
const dpOn = () => layoutVariant() === "l4gs";

const PARTS = ["fuse", "lever", "tools", "gas"];
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
  PUMP: 300, // a quarter can (25%) of gas: at a pump on Downpour, and from Cabin's merchant, the same (was 150, the owner's, Nov 18 12:19Z; Nov 20 18:46Z: "For gas, on number 6, raise it to 300")
  REACH: 130, // world px from there
  DP_GAS: 8, // Downpour: the rounds of gas the generator holds as the game starts
  CAN_ZOMBIE: 0.00375, // jerry cans: from a zombie that dies (half again, the owner's, Nov 23 00:32Z: "Gasoline should be half as likely to drop"; before: the owner's, Nov 18 12:19Z: "Gasoline is still a 1% chance of dropping in zombies"; then 75% of that, Nov 19 19:27Z: "multiplying it by 3/4"; Duck Cabin and Downpour share it),
  CAN_ROUND: 0.00375, // (half, Nov 23) and at a round's start in a part's spot (each 1% only: the owner's, Nov 17 13:43Z; 75% of that now)
  FULL: 4, // quarter cans (rounds) in a full jerry can (the owner's, Nov 18 12:19Z: "4 rounds for a 100% full jerry can, 3 rounds for 75%, and 2 rounds for 50%, and 1 round for 25%")
  CANS: 3, // jerry cans the row holds at most (the owner's, Nov 18 12:19Z: "only three Jerry cans can be held on the left screen by all players")
  TAKE: 75, // world px: how near a duck walks to take what lies on the floor
  TAKE_SPOT: 110, // … and what lies on the sink, the counter or the couch (from the floor in front)
};
const GAS_MAX = PW.FULL * PW.CANS;
/* a found jerry can's gas, in quarter cans: always a full one (the owner's, Nov 18 12:32Z, through Adam: a found can is
   always 100%) */
const canRounds = () => PW.FULL;
/* a can's gas in percent: 100, 75, 50, 25, 0 */
export const canPct = (r) => Math.round((r / PW.FULL) * 100);
export const partName = (k) => NAMES[k] || k;
/* the fireplace's weapon string for a part or a jerry can ("pw:fuse", "pw:can:3"): none come from it any more, but a
   spin already turning keeps working */
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
function spotOf(k) {
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
  if (k === "sink" || k === "counter") {
    const p = prop(k);
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
/* the row of jerry cans at the left of the screen, each its gas in quarter cans, the fullest first: the full ones, then
   the one being filled; an empty one after the full ones while there is room for it (the owner's, Nov 18 12:19Z: "when
   there is no jerry cans, the players have a 0% jerry can on the left, and when they have three full jerry cans, then
   empty is tranformed like the other ones, and the empty only follows the full one if the previous is full") */
export function canRow(s) {
  const pw = pwState(s),
    q = Math.max(0, Math.min(GAS_MAX, (pw && pw.gas) || 0)),
    full = Math.floor(q / PW.FULL),
    rest = q % PW.FULL,
    row = Array(full).fill(PW.FULL);
  if (rest) row.push(rest);
  else if (full < PW.CANS) row.push(0);
  return row;
}
/* the row is full: three full cans (the owner's: "a very small text below the items ... says they have the max amount
   of jerry cans") */
export const gasFull = (s) => ((pwState(s) || {}).gas || 0) >= GAS_MAX;
/* can a jerry can come now? Once a round at most (pw.cr: the round the last one came in); one nobody took stays where
   it is, and others still come in later rounds (the owner's, Nov 18 12:19Z: "If the jerry can isn't found within that
   round on the ground ... then it can still lay on the ground while other gasoline can be dropped by zombies in later
   rounds") */
const canCome = (s) => {
  const L = s.hang.l4;
  return !!L && L.r >= 1 && s.hang.pw.cr !== L.r;
};
/* a jerry can's odds, base times CAN_ODDS: more when the generator is low, rarely when it's full (the owner's, Nov 28
   02:07Z, on whether gas drops too often). How full: its rounds left and the row's, against Downpour's DP_GAS */
const CAN_ODDS = { dry: 3, full: 0.25 };
const canOdds = (s, base) => {
  const pw = s.hang.pw,
    f = Math.min(1, ((pw.on ? pw.left : 0) + (pw.gas || 0)) / PW.DP_GAS);
  return base * (CAN_ODDS.dry + (CAN_ODDS.full - CAN_ODDS.dry) * f);
};

/* ---------- the rules' side (l4ddrules.js calls these; h: its helpers) ---------- */
/* a new game: the box built, the power off and no gas (Downpour: dpSetUp) */
export function powerSetUp(s) {
  if (dpOn()) return dpSetUp(s);
  s.hang.pw = { fit: [...PARTS], on: 0, left: 0, gas: 0, cr: 0, n: 0 };
  s.hang.pk = [];
  s.hang.power = 0;
}
/* Downpour: the generator is already running, holding DP_GAS rounds of gas (the round about to start counted too: it
   goes out as the round after them starts) */
function dpSetUp(s) {
  s.hang.pw = {
    fit: [...PARTS],
    on: 1,
    left: PW.DP_GAS + 1,
    gas: 0,
    cr: 0,
    n: 0,
  };
  s.hang.pk = [];
  s.hang.power = 1;
}
/* the power on or off, for everyone: the lights, the TV, and every flashlight off (on) or back on (off). I want every
   flashlight to turn back on by itself when the power goes out, on Cabin and on every map where it can (Downpour's
   generator running dry too), even one switched off with 0 (owner, Nov 20 18:46Z) */
function setPower(s, on, now, h) {
  s.hang.power = on ? 1 : 0;
  s.hang.pw = { ...s.hang.pw, on: on ? 1 : 0 };
  if (!on) s.hang.l4f = {};
  else if (!dpOn())
    s.hang.l4f = Object.fromEntries(h.players(s).map((id) => [id, 1])); // (Downpour: the power back on leaves them as they are)
  h.addFx(s, { kind: on ? "l4pwon" : "l4pwoff", by: "", who: [], t: now });
}
/* a round starts (newRound): the power counts it, maybe goes out; a jerry can may turn up in a part's spot */
export function powerRound(s, r, now, h) {
  const pw = s.hang.pw,
    L = s.hang.l4;
  if (!pw || !L || r < 1) return;
  if (pw.on) {
    const left = pw.left - 1;
    s.hang.pw = { ...pw, left };
    if (left <= 0) setPower(s, false, now, h);
  }
  if (canCome(s) && Math.random() < canOdds(s, PW.CAN_ROUND)) {
    const busy = (s.hang.pk || []).map((o) => o.at),
      free = spots().filter((k) => !busy.includes(k));
    if (free.length) {
      const at = free[Math.floor(Math.random() * free.length)];
      lay(s, { k: "can", r: canRounds(), ...spotOf(at), at });
    }
  }
}
/* a jerry can laid down to be found (it counts as this round's) */
function lay(s, o) {
  const n = s.hang.pw.n + 1;
  s.hang.pw = { ...s.hang.pw, n, cr: s.hang.l4.r };
  s.hang.pk = [...(s.hang.pk || []), { n, ...o }];
}
/* every heartbeat: a zombie dying may drop a jerry can (canOdds); a duck walking over one pours what fits of it into
   the row, no E needed */
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
    if (!canCome(s) || Math.random() >= canOdds(s, PW.CAN_ZOMBIE)) continue;
    const [x, y] = h.playable(z.x, z.y)
      ? [z.x, z.y]
      : h.dropSpot(s) || [z.x, z.y];
    lay(s, {
      k: "can",
      r: canRounds(),
      x: Math.round(x),
      y: Math.round(y),
      z: 0,
      px: x,
      py: y,
    });
  }
  if (changed || Object.keys(seen).length !== Object.keys(next).length)
    s.hidden = { ...(s.hidden || {}), l4seen: next };
  const pk = s.hang.pk || [];
  if (!pk.length) return;
  let left = pk;
  for (const o of pk) {
    const room = GAS_MAX - (s.hang.pw.gas || 0);
    if (room <= 0) break; // (the row is full: it stays where it lies)
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
    const got = Math.min(room, o.r);
    left = left
      .map((x) => (x === o ? { ...o, r: o.r - got } : x))
      .filter((x) => x.r > 0); // (what didn't fit stays, smaller)
    s.hang.pw = { ...s.hang.pw, gas: (s.hang.pw.gas || 0) + got };
    h.addFx(s, { kind: "l4pwgot", k: "can", r: got, by, who: [], t: now });
  }
  if (left !== pk) s.hang.pk = left;
}
/* E at the box: the row's fullest can is poured in, and the power comes on (or runs that many rounds longer) */
export function powerAct(s, id, now, mx, my, h) {
  const pw = s.hang.pw,
    L = s.hang.l4;
  if (!pw || Math.hypot(mx - PW.E[0], my - PW.E[1]) > PW.REACH * 1.6)
    return false;
  const r = canRow(s)[0];
  if (!r) return false;
  const between = !!(L && L.wait); // (between rounds the next one is counted too)
  s.hang.pw = {
    ...pw,
    gas: pw.gas - r,
    left: pw.on ? pw.left + r : r + (between ? 1 : 0),
  };
  h.addFx(s, { kind: "l4pwgas", r, by: id, who: [], t: now });
  if (!pw.on) setPower(s, true, now, h);
  return true;
}
/* Downpour: E at a pump puts a quarter can of gas into the row (PW.PUMP points), power or not. Only close by it, on
   its bottom (south) side (the owner's, Nov 17 18:05Z: "the pumps effective range where u use them has changed"): over its width
   and PUMP_SIDE either side, from its front face out to PUMP_OUT (world px) */
const PUMP_SIDE = 30,
  PUMP_OUT = 100;
/* the spot by one pump where E works, as [x0, y0, x1, y1]: l4dd.js draws its yellow square from it too, so the two
   can't disagree */
export const pumpZone = (p) => [
  p.x0 - PUMP_SIDE,
  p.y1 - 4,
  p.x1 + PUMP_SIDE,
  p.y1 + PUMP_OUT,
];
export const pumpNear = (mx, my) =>
  dpOn() &&
  GS.PUMPS.some((p) => {
    const [x0, y0, x1, y1] = pumpZone(p);
    return mx > x0 && mx < x1 && my >= y0 && my < y1;
  });
export function powerPump(s, id, now, mx, my, h) {
  const pw = s.hang.pw;
  if (!pw || !pumpNear(mx, my) || gasFull(s)) return false;
  return buyGas(s, id, now, h);
}
/* one more gas at the pump's price (the pump's, and the merchant's in Duck Cabin) */
function buyGas(s, id, now, h) {
  const pw = s.hang.pw;
  if (h.ptsOf(s, id) < PW.PUMP) return false;
  h.addPts(s, id, -PW.PUMP);
  s.hang.pw = { ...pw, gas: (pw.gas || 0) + 1 };
  h.addFx(s, { kind: "l4pwfill", by: id, who: [], t: now });
  return true;
}
/* Duck Cabin: a merchant's gas, the pump's 25% at the pump's price, and he never runs out (the owner's, Nov 18 14:20Z:
   "Merchant always has gas to sell now in cabin AND the gas costs as much as it does from the pump in gas station AND
   the gas never runs out from the merchant"). The rules check he's there */
export function powerGas(s, id, now, h) {
  const pw = s.hang.pw;
  if (!pw || gasFull(s)) return false;
  return buyGas(s, id, now, h);
}
/* what E at the box would do now, for its button: "pour" or "" */
export function powerNext(s) {
  return pwState(s) && canRow(s)[0] ? "pour" : "";
}
