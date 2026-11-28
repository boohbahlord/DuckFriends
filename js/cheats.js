/* ---------- test commands: round N, give WEAPON, goto PLACE ----------
   The owner's, Nov 21 00:31Z: "If you need to make codes in the terminal to make testing easier and more usage
   efficient, you can. Just have it to where that disables stats within a game when those certain things are turned on".
   A test sends { t: 'hang', k: 'cheat', do, … } itself (the command line that typed it is gone); the host runs it here. The first one used
   marks the game (cheatflag.js): no stats, unlocks, records or jumps for the rest of it. Dead Ducks Arcade; Sandbox has
   no rounds to jump to. */
import { rule } from "./hangout/registry.js";
import { GO_MS, give, kitOf, merchantGo, newRound } from "./l4ddrules.js";
import { W, H, floorAt } from "./hangout/layout.js";
import { DECKS } from "./hangout/stationmap.js";
import { ARMS } from "./guns.js";
import { isSb } from "./sandboxrules.js";
import { may } from "./roomrules.js";
import { markCheat } from "./cheatflag.js";

const ROUND_MAX = 999;
const game = (s) => s && s.hang && s.hang.l4;
const noRounds = isSb;

function act(s, a, now) {
  const L = game(s);
  if (!L || L.over || !may(s, a.id, "cansettings")) return false;
  if (a.do === "round") {
    const n = Math.floor(+a.n);
    if (noRounds(s) || !(n >= 1 && n <= ROUND_MAX)) return false;
    if (L.wait) merchantGo(s, now); // (between rounds: the zombies are coming, he runs)
    newRound(s, n, now, GO_MS);
  } else if (a.do === "give") {
    const ids = a.who === "all" ? s.seat || [] : [a.who];
    if (!ARMS[a.w]) return false;
    let any = false;
    for (const id of ids)
      if (s.players[id] && kitOf(s, id) && give(s, id, a.w)) any = true;
    if (!any) return false;
  } else if (a.do === "goto") {
    const p = s.pos[a.id];
    if (a.spot) a = { ...a, ...spotOf(a.spot) }; // (a place by its name: station, chapel, canopy)
    if (!p || !(a.x >= 0 && a.x <= W && a.y >= 0 && a.y <= H)) return false;
    /* put there through the host (tp: every screen, mine too, takes the host's word for it, game.js); z: how high, in
       the map's units, standing on whatever floor is at that height */
    const z = +a.z || floorAt(a.x, a.y, 0).h;
    s.pos[a.id] = {
      ...p,
      x: +(a.x / W).toFixed(5),
      y: +(a.y / H).toFixed(5),
      z,
      b: z,
      j: 0,
      tp: now,
    };
  } else return false;
  markCheat(s);
  return true;
}
rule("cheat", { only: "l4dd", ghosts: true, act });

/* the places goto knows by name (Downpour's roofs and the pumps' canopy): the first spot of each, from its middle out, that
   has the floor itself under it (the gas station's roof has holes a duck falls through) */
const SPOTS = {
  station: (d) => d.kind === "roof" && d.bldg === 1,
  chapel: (d) => d.kind === "roof" && d.bldg === 2,
  canopy: (d) => d.kind === "canopy",
};
function spotOf(name) {
  const d = Object.hasOwn(SPOTS, name) && DECKS.find(SPOTS[name]);
  if (!d) return null;
  const cx = (d.x0 + d.x1) / 2,
    cy = (d.y0 + d.y1) / 2,
    out = [];
  for (let x = d.x0 + 40; x < d.x1; x += 40)
    for (let y = d.y0 + 40; y < d.y1; y += 40) out.push([x, y]);
  out.sort(
    (p, q) =>
      Math.hypot(p[0] - cx, p[1] - cy) - Math.hypot(q[0] - cx, q[1] - cy),
  );
  const at = out.find(([x, y]) => floorAt(x, y, d.h + 1).deck === d);
  return at ? { x: at[0], y: at[1], z: d.h } : null;
}
