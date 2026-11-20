/* The friendly squad's chance, tried without a game (the owner's, Nov 19: "we could like maybe test the code without
   running it in a game to see if maybe that was too frequent, based on the amount of time it took for them to show
   up"). It plays many Survival games on the phase clock alone: a rest (SV.REST, and SV.BIG_REST after a big horde), a
   peak (how long a horde takes to kill: given below, as that depends on the players), a tail (SV.TAIL). At each rest
   the squad comes with allies.js' chance while none of it is alive; once it came it stays a few waves (given below).
   Run: node tools/sim-allies.mjs [chance], e.g. node tools/sim-allies.mjs 0.04 */
import { readFileSync } from "node:fs";
import { SV } from "../js/survrules.js";

const own = +(readFileSync(
  new URL("../js/allies.js", import.meta.url),
  "utf8",
).match(/CHANCE:\s*([\d.]+)/) || [0, 0.04])[1];
const CHANCE = +(process.argv[2] || own);
const GAMES = 20000;
const whole = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
const between = (a, b) => a + Math.random() * (b - a);

/* one game, minutes long: when the squad came (seconds from the start), each time */
function game(minutes, peak, stay) {
  const end = minutes * 60,
    came = [];
  let t = 0,
    big = false,
    aliveFor = 0; // (waves the squad has left, 0: none alive)
  while (t < end) {
    if (aliveFor === 0 && Math.random() < CHANCE) {
      came.push(t);
      aliveFor = whole(stay);
    }
    t += whole(SV.REST) + (big ? SV.BIG_REST : 0);
    const size = SV.SIZES[Math.floor(Math.random() * SV.SIZES.length)];
    big = size === Math.max(...SV.SIZES);
    t += between(...peak) * (big ? 1.6 : 1);
    t += whole(SV.TAIL);
    if (aliveFor > 0) aliveFor--;
  }
  return came;
}

const pct = (x) => (100 * x).toFixed(0).padStart(3) + "%";
console.log(
  `Friendly squad: ${(CHANCE * 100).toFixed(1)}% each rest (allies.js has ${(own * 100).toFixed(1)}%)`,
);
console.log(
  "peak length | stays | seen in a 20 / 30 / 45 min game | first one, median | times in 45 min",
);
for (const peak of [
  [45, 75],
  [75, 120],
  [120, 180],
])
  for (const stay of [
    [1, 2],
    [2, 4],
  ]) {
    const r = { 20: 0, 30: 0, 45: 0 },
      first = [];
    let n45 = 0;
    for (let g = 0; g < GAMES; g++) {
      const c = game(45, peak, stay);
      for (const m of [20, 30, 45]) if (c.some((t) => t < m * 60)) r[m]++;
      if (c.length) first.push(c[0]);
      n45 += c.length;
    }
    first.sort((a, b) => a - b);
    const med = first.length ? first[Math.floor(first.length / 2)] / 60 : NaN;
    console.log(
      `${peak[0]}-${peak[1]} s`.padEnd(11),
      "|",
      `${stay[0]}-${stay[1]} waves`.padEnd(5),
      "|",
      [20, 30, 45].map((m) => pct(r[m] / GAMES)).join(" /"),
      "         |",
      `${med.toFixed(1)} min`.padStart(9),
      "       |",
      (n45 / GAMES).toFixed(2),
    );
  }
