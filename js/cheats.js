/* ---------- test commands: cheat round N, cheat give WEAPON ----------
   The owner's, Nov 21 00:31Z: "If you need to make codes in the terminal to make testing easier and more usage
   efficient, you can. Just have it to where that disables stats within a game when those certain things are turned on".
   The command line's cheat (shell.js) sends { t: 'hang', k: 'cheat', do, … }; the host runs it here. The first one used
   marks the game (cheatflag.js): no stats, unlocks, records or jumps for the rest of it. Dead Ducks Arcade (Duck Cabin and Downpour) and Survival; jumping to a round is Dead Ducks
   Arcade's alone (Survival and Sandbox have no rounds to jump to). */
import { rule } from "./hangout/registry.js";
import { ARMS, GO_MS, give, kitOf, merchantGo, newRound } from "./l4ddrules.js";
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
  } else return false;
  markCheat(s);
  return true;
}
rule("cheat", { only: "l4dd", ghosts: true, act });

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
  h.fail("✗ usage: cheat round N | cheat give WEAPON [@player … | all]");
}
