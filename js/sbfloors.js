/* ---------- Sandbox Phase 4: floors (plan notes/plan-floors.md) ----------
   What I want: "Zone should be able to have it where ... they can be made to be a surface that can be walked on, which in
   ground level elevation does nothing. But if it's in, let's say second elevation, well, now you just made a roof", and
   "tiles that blink in and out with the algorithm, and you stand on top of them ... if you're not on the tiles ... you
   fall down". A zone with Ground on, at elevation 2 or more (sandboxrules.js SB_ZONE fl, gnd), is one more deck of the
   map (hangout/layout.js setExtraDecks): a floor at its height over its box, there only on its working squares. So
   ducks stand on it, walk off it and fall, shots and outlines see it as they see Downpour's roofs, on every world.
   Both the host and every screen hand me the room's state as they go (sbFloorsFrom); a state older than FRESH means
   Sandbox is over, and the floors go */
import {
  isSb,
  sbOnWorld,
  sbZoneBox,
  sbInBlock,
  sbActsAt,
  sbLocal,
  SB_ZONE,
  SB_SLOPE_DIRS,
} from "./sandboxrules.js";
import { valueOf } from "./numerat.js";
import { boxText } from "./sbspawn.js";
import {
  W,
  H,
  setExtraDecks,
  floorStep,
  SIGHT_UNIT,
} from "./hangout/layout.js";

const FRESH = 1500; // (ms)
const NONE = [];
let cur = null,
  seen = 0,
  made = { pts: null, list: NONE };

/* the room's state now (the host's heartbeat, a screen's draw) */
export function sbFloorsFrom(s) {
  cur = isSb(s) && sbOnWorld(s) ? s : null;
  seen = Date.now();
}
/* a slope's ends (world px) and the side it rises toward: { lo, hi, dir }, or null when it's flat */
export function sbSlope(p) {
  if (!p || p.k !== "zone" || !p.f || !p.f.slto) return null;
  const n = Math.round(valueOf({ ok: boxText(p, "slto") }, SB_ZONE.slto));
  if (!Number.isFinite(n) || n < 1) return null;
  const lo = p.z || 0,
    hi = (Math.min(6, n) - 1) * floorStep(),
    d = boxText(p, "sldir").trim();
  return Math.abs(hi - lo) < 0.5
    ? null
    : { lo, hi, dir: SB_SLOPE_DIRS[d] ? d : "n" };
}
/* how far along slope sl (x, y: shares of the map) is, 0 at its low end to 1 at its high end */
function along(s, p, sl, x, y) {
  const [u, v] = sbLocal(s, p, x, y, W, H),
    t =
      sl.dir === "n"
        ? 0.5 - v
        : sl.dir === "s"
          ? 0.5 + v
          : sl.dir === "e"
            ? 0.5 + u
            : 0.5 - u;
  return Math.min(1, Math.max(0, t));
}
/* slope sl's height at (x, y), in steps of 2.5% of the gas station roof (the sightline's smallest step) */
export function sbSlopeH(s, p, sl, x, y) {
  const U = floorStep() * SIGHT_UNIT;
  return Math.round((sl.lo + (sl.hi - sl.lo) * along(s, p, sl, x, y)) / U) * U;
}
/* is zone p ground over the map's own: Ground on, over elevation 1 (or a slope up from it) */
export const sbIsFloor = (p) =>
  !!p &&
  p.k === "zone" &&
  boxText(p, "gnd") === "t" &&
  ((p.z || 0) > 0.5 || !!sbSlope(p));

function decks() {
  if (!cur || Date.now() - seen > FRESH) return NONE;
  const pts = (cur.sb && cur.sb.pts) || null;
  if (!pts) return NONE;
  if (made.pts === pts) return made.list;
  const list = [];
  for (const [id, p] of Object.entries(pts)) {
    if (!sbIsFloor(p)) continue;
    const [x0, y0, x1, y1] = sbZoneBox(cur, p, W, H),
      sl = sbSlope(p);
    list.push({
      ...(sl
        ? {
            hAt: (x, y) => sbSlopeH(cur || {}, p, sl, x / W, y / H),
            slope: sl,
          }
        : {}),
      x0: x0 * W,
      y0: y0 * H,
      x1: x1 * W,
      y1: y1 * H,
      h: sl ? Math.min(sl.lo, sl.hi) : p.z,
      kind: "zone",
      sb: id,
      holes: NONE,
      /* on its shape, on a square working now (read from the state as it is at that moment: its steps move on) */
      inside: (x, y) =>
        !!cur &&
        sbInBlock(cur, p, x / W, y / H, W, H) &&
        sbActsAt(cur, id, p, x / W, y / H, W, H),
    });
  }
  made = { pts, list };
  return list;
}
setExtraDecks(decks, () => !!cur && Date.now() - seen <= FRESH);
