/* ---------- test commands: cheat round N, cheat give WEAPON, cheat gunmen SIDE, cheat goto PLACE ----------
   The owner's, Nov 21 00:31Z: "If you need to make codes in the terminal to make testing easier and more usage
   efficient, you can. Just have it to where that disables stats within a game when those certain things are turned on".
   The command line's cheat (shell.js) sends { t: 'hang', k: 'cheat', do, … }; the host runs it here. The first one used
   marks the game (cheatflag.js): no stats, unlocks, records or jumps for the rest of it. Dead Ducks Arcade (Duck Cabin and Downpour) and Survival; jumping to a round is Dead Ducks
   Arcade's alone (Survival and Sandbox have no rounds to jump to). */
import { rule } from "./hangout/registry.js";
import {
  GO_MS,
  cheatGunmen,
  give,
  kitOf,
  merchantGo,
  newRound,
} from "./l4ddrules.js";
import { W, H, floorAt } from "./hangout/layout.js";
import { DECKS } from "./hangout/stationmap.js";
import { ARMS } from "./guns.js";
import { isSb } from "./sandboxrules.js";
import { isSurv } from "./survrules.js";
import { may } from "./rules.js";
import { cheated, markCheat } from "./cheatflag.js";

const ROUND_MAX = 999;
const game = (s) => s && s.hang && s.hang.l4;
const noRounds = (s) => isSurv(s) || isSb(s);

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
  } else if (a.do === "gunmen") {
    if (!cheatGunmen(s, a.side, now)) return false;
  } else if (a.do === "goto") {
    const p = s.pos[a.id];
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

/* the places cheat goto knows (Downpour's roofs and the pumps' canopy): the first spot of each, from its middle out, that
   has the floor itself under it (the gas station's roof has holes a duck falls through) */
const SPOTS = {
  station: (d) => d.kind === "roof" && d.bldg === 1,
  chapel: (d) => d.kind === "roof" && d.bldg === 2,
  canopy: (d) => d.kind === "canopy",
};
export function spotOf(name) {
  const d = DECKS.find(SPOTS[name] || (() => false));
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

/* the command line's side: cheat round N | cheat give WEAPON [@player … | all]; h = shell.js' needMay, who and fail */
export function cheatCmd(args, x, h) {
  const room = x.ctx.room,
    [sub, ...rest] = args;
  if (!sub && room)
    return cheated(room.state)
      ? "Test commands were used: this game counts no stats."
      : "No test commands used in this game."; // (anyone may ask)
  const s = h.needMay(x, "cansettings", "cheat");
  if (!["l4dd", "surv"].includes(s.options.mode) || !game(s))
    h.fail("✗ cheat works in Dead Ducks Arcade or Survival, during a game.");
  if (sub === "round") {
    const n = Math.floor(+rest[0]);
    if (noRounds(s)) h.fail("✗ cheat round: this mode has no rounds.");
    if (!(n >= 1 && n <= ROUND_MAX))
      h.fail(`✗ cheat round N: N from 1 to ${ROUND_MAX}.`);
    room.send({ t: "hang", k: "cheat", do: "round", n });
    return `Round ${n}. Stats are off for the rest of this game.`;
  }
  if (sub === "give") {
    const w = (rest[0] || "").toLowerCase(),
      to = rest.slice(1);
    if (!ARMS[w])
      h.fail(`✗ cheat give WEAPON: one of ${Object.keys(ARMS).join(", ")}.`);
    const ids = to.includes("all")
      ? ["all"]
      : to.length
        ? h.who(x.ctx, to)
        : [room.me];
    for (const id of ids)
      room.send({ t: "hang", k: "cheat", do: "give", w, who: id });
    return `Gave ${w}. Stats are off for the rest of this game.`;
  }
  if (sub === "gunmen") {
    if (!isSurv(s)) h.fail("✗ cheat gunmen: Survival only.");
    const side = { criminals: "c", soldiers: "s" }[
      (rest[0] || "").toLowerCase()
    ];
    if (!side) h.fail("✗ cheat gunmen criminals | soldiers");
    room.send({ t: "hang", k: "cheat", do: "gunmen", side });
    return `${rest[0].toLowerCase()} are coming. Stats are off for the rest of this game.`;
  }
  if (sub === "goto") {
    const spot = SPOTS[(rest[0] || "").toLowerCase()]
        ? spotOf(rest[0].toLowerCase())
        : null,
      [x, y, z] = spot ? [spot.x, spot.y, spot.z] : rest.map(Number);
    if (!(x >= 0 && y >= 0))
      h.fail(
        `✗ cheat goto ${Object.keys(SPOTS).join(" | ")} | X Y [Z]: Downpour's roofs and canopy, or a spot in map units (Z how high).`,
      );
    room.send({ t: "hang", k: "cheat", do: "goto", x, y, ...(z ? { z } : {}) });
    return `Moved. Stats are off for the rest of this game.`;
  }
  h.fail(
    "✗ usage: cheat round N | cheat give WEAPON [@player … | all] | cheat gunmen criminals|soldiers | cheat goto station|chapel|canopy|X Y [Z]",
  );
}
