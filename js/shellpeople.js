/* the people, the room and the game's helpers (fortunes, ducksay, cal, ps, top, last, finger ...) the commands print with (a pure move out of shell.js) */
import { groupsOf, isSudo, STAGE, inWorld } from "./rules.js";
import { modeOf } from "./modes.js";
import { clock, left, needRoom, pname, procs, table, tag } from "./shellfs.js";
import { mapName } from "./maps.js";
import { FONTS } from "./name.js";
import { specialById, keysOf, KEYS } from "./specials.js";
import { styleById, styleName } from "./styles.js";
import { hatById } from "./hats.js";
import { outfitById } from "./outfits.js";
import { isSb, sbWorld, SB_WORLD_NAMES } from "./sandboxrules.js";

/* ---------- people, the room and the game ---------- */
export const FORTUNES = [
  "A duck who quacks first quacks last.",
  "Walk to the tile in your heart, not the tile with the most ducks.",
  "Today's vote is tomorrow's argument.",
  "Even a rubber duck makes waves.",
  "The Round Lord is watching. Act natural.",
  "Ending your turn early is a kind of courage.",
  "Bread is temporary. Friendship is forever.",
  "A jump a day keeps the lobby away.",
  "Never trust a duck in a ski mask.",
  "If you disagree loudly enough, it counts as two votes. (It does not.)",
  "Behind every great bracket is a contender nobody expected.",
  "Quack twice before you hit Enter.",
  "The pond is wide, but the chat is wider.",
];
export function ducksay(text) {
  const words = String(text).split(/\s+/).filter(Boolean),
    rows = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > 36) {
      rows.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur || !rows.length) rows.push(cur);
  const W = Math.max(...rows.map((r) => r.length));
  const box =
    rows.length === 1
      ? [`< ${rows[0]} >`]
      : rows.map(
          (r, i) =>
            `${i === 0 ? "/" : i === rows.length - 1 ? "\\" : "|"} ${r.padEnd(W)} ${i === 0 ? "\\" : i === rows.length - 1 ? "/" : "|"}`,
        );
  return [
    " " + "_".repeat(W + 2),
    ...box,
    " " + "-".repeat(W + 2),
    "        \\",
    "         \\    __",
    "          \\ <(o )___",
    "             ( ._> /",
    "              `---'",
  ].join("\n");
}
export function cal(now = new Date()) {
  const y = now.getFullYear(),
    m = now.getMonth(),
    first = new Date(y, m, 1).getDay(),
    days = new Date(y, m + 1, 0).getDate();
  const title = now.toLocaleString("en-US", { month: "long" }) + " " + y,
    out = [
      title.padStart(10 + Math.ceil(title.length / 2)).trimEnd(),
      "Su Mo Tu We Th Fr Sa",
    ];
  let row = "   ".repeat(first);
  for (let d = 1; d <= days; d++) {
    row += String(d).padStart(2) + " ";
    if ((first + d) % 7 === 0) {
      out.push(row.trimEnd());
      row = "";
    }
  }
  if (row) out.push(row.trimEnd());
  out.push(
    `Today: ${now.toLocaleString("en-US", { weekday: "long" })} the ${now.getDate()}${[, "st", "nd", "rd"][(now.getDate() % 10) * (Math.floor(now.getDate() / 10) !== 1)] || "th"}.`,
  );
  return out.join("\n");
}
/* the Seriat files running: ps's lines for them */
const procLines = () =>
  procs.map(
    (p) =>
      `${String(p.pid).padStart(3)} seriat  ${p.name}, running ${left(Date.now() - p.at)}`,
  );
export function psLines(s, all) {
  const o = s.options,
    st = STAGE[s.phase] || "lobby",
    now = Date.now(),
    n = s.seat.length,
    done = s.seat.filter((id) => s.done && s.done[id]).length;
  const sb = isSb(s) && s.phase !== "lobby"; // (Sandbox: no rounds, no stages, no turns)
  const out = [
    "PID WHAT     DOING",
    `  1 game     ${modeOf(o.mode).name} on ${sbWorld(o) ? SB_WORLD_NAMES[sbWorld(o)] : mapName(o.map)}${s.phase === "lobby" ? ", in the lobby" : modeOf(o.mode).noRounds ? ", hanging out" : sb ? "" : `, round ${s.round + 1}`}`,
  ];
  if (s.phase !== "lobby" && !sb && !(modeOf(o.mode).noRounds && inWorld(s)))
    out.push(
      `  2 ${st.padEnd(8)} ${["answer", "discuss", "results", "bracket"].includes(s.phase) || s.done ? `${done} of ${n} have ended their turn` : ""}`,
    );
  if (s.ends && s.ends > now && !sb)
    out.push(`  3 timer    ${left(s.ends - now)} left`);
  if (s.catchEnds && s.catchEnds > now && !sb)
    out.push(`  4 catch-up ${left(s.catchEnds - now)} left for the rest`);
  if (s.vote)
    out.push(
      `  5 vote     ${s.vote.kind} vote, ${Object.keys(s.vote.yes).length} yes · ${Object.keys(s.vote.no).length} no`,
    );
  out.push(...procLines());
  if (all) {
    out.push(
      "",
      table([
        ["PLAYER", "STATE"],
        ...s.seat.map((id) => {
          const p = s.players[id];
          return [
            pname(s, id),
            [
              p.bot ? "computer" : "",
              p.idle ? "away" : "",
              p.late ? "plays next turn" : "",
              s.done && s.done[id]
                ? "turn ended"
                : s.phase === "lobby"
                  ? p.ready
                    ? "ready"
                    : "not ready"
                  : st,
            ]
              .filter(Boolean)
              .join(" · "),
          ];
        }),
      ]),
    );
  }
  return out.join("\n");
}
export const pingOf = (ctx, p) =>
  p.bot
    ? "computer"
    : !ctx.room.online
      ? "same device"
      : p.ms == null
        ? "… ms"
        : p.ms + " ms";
export const allJumps = (st) =>
  Object.values(st || {}).reduce((a, m) => a + ((m && m.jumps) || 0), 0);
/* "up 1:05, 3 players": how long the game has gone (0:00 in the lobby), for top, w and uptime */
export const upLine = (s) => {
  const m =
    s.startedAt && s.phase !== "lobby"
      ? Math.floor((Date.now() - s.startedAt) / 60000)
      : 0;
  return `up ${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}, ${s.seat.length} players`;
};
export const idle = (s) => ["lobby", "over"].includes(s.phase); // (no game going)
export function topLines(ctx) {
  const s = needRoom(ctx),
    J = s.jumps || {};
  const ids = [...s.seat].sort((a, b) => (J[b] || 0) - (J[a] || 0));
  return [
    `top - ${new Date().toTimeString().slice(0, 8)} ${upLine(s)}, ${STAGE[s.phase] || "lobby"}`,
    "",
    table(
      [
        ["PLAYER", "JUMPS", "PING"],
        ...ids.map((id) => [
          pname(s, id),
          J[id] || 0,
          pingOf(ctx, s.players[id]) + (s.players[id].idle ? " · away" : ""),
        ]),
      ],
      [1],
    ),
  ].join("\n");
}
export function lastLines(s) {
  const rows = [];
  for (const m of [...(s.log || [])].reverse()) {
    if (!m.sys) continue;
    let r;
    if ((r = m.text.match(/^(.+) joined\.$/)))
      rows.push([tag(r[1]), "came in", clock(m.t)]);
    else if ((r = m.text.match(/^(.+) left\.$/)))
      rows.push([tag(r[1]), "left", clock(m.t)]);
    else if ((r = m.text.match(/^.+ removed (.+) from the room\.$/)))
      rows.push([tag(r[1]), "removed", clock(m.t)]);
  }
  const first = (s.log || [])[0];
  return (
    (rows.length ? table(rows) + "\n\n" : "") +
    `The room's log begins ${first ? clock(first.t) : "now"}.`
  );
}
export function finger(ctx, id) {
  const s = ctx.room.state,
    p = s.players[id],
    d = p.duck || {},
    c = p.card || {},
    ns = p.nameStyle || {},
    sp = keysOf(d)
      .map((id, i) => id && `${KEYS[i]} ${specialById(id).name}`)
      .filter(Boolean)
      .join(", ");
  const pretty = (v) => (v ? String(v).replace(/[-_]/g, " ") : "none"),
    jk = d.style === "jack"; // (Jack in a Box wears no hat, outfit or picture)
  return [
    `Login: ${pname(s, id)}${id === s.hostId ? " (host)" : isSudo(s, id) ? " (sudo)" : ""}${p.bot ? " (a computer)" : ""}`,
    `Duck:  ${jk ? styleName(d) : d.image ? "a picture" : `${styleById(d.style).name || pretty(d.style)}, ${d.color || "?"}`} · hat ${d.hat && !jk ? (hatById(d.hat.id || d.hat) || {}).name || pretty(d.hat.id || d.hat) : "none"} · outfit ${d.outfit && !jk ? (outfitById(d.outfit.id || d.outfit) || {}).name || pretty(d.outfit.id || d.outfit) : "none"} · specials ${sp || "none"}`,
    `Card:  ${c.kind === "image" ? "a picture" : `${c.color || "?"}, pattern ${pretty(c.pattern)}`}`,
    `Font:  ${(FONTS.find((f) => f.id === ns.font) || FONTS[0]).name}${ns.rainbow ? ", rainbow" : ns.color ? ", " + ns.color : ""}`,
    `Groups: ${[...groupsOf(s, id), "superuser-" + pname(s, id)].join(", ")}`,
    `${p.joined ? `In the room since ${clock(p.joined)}` : "In the room"} · ${(s.jumps || {})[id] || 0} Jumps this game · ${pingOf(ctx, p)}${p.idle ? " · away" : ""}`,
  ].join("\n");
}
