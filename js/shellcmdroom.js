/* the room, game and test commands (a pure move out of shell.js: the entries of its CMDS table, run by the same shell) */
import { profile } from "./store.js";
import { modeOf, modesFor, HIDDEN_MODES } from "./modes.js";
import {
  FORTUNES,
  allJumps,
  cal,
  ducksay,
  idle,
  pingOf,
  psLines,
  topLines,
  upLine,
} from "./shellpeople.js";
import { SH_MAPS, forgame, statLines } from "./shellstats.js";
import {
  VERSION,
  fail,
  needMay,
  needRoom,
  needSudo,
  pname,
  table,
  wait,
  who,
} from "./shellfs.js";
import { isWorldMap, mapName } from "./maps.js";
import { lines } from "./textutils.js";
import { MAN } from "./manual.js";
import { cheatCmd } from "./cheats.js";
import { isSb } from "./sandboxrules.js";
import {
  send,
  songs,
} from "./shell.js"; /* (called only when a command runs, long after both modules loaded) */
import { CMDS } from "./shellcmds.js";

Object.assign(CMDS, {
  hostname: (args, i, x) => {
    const s = needRoom(x.ctx);
    if (!args.length) return s.name || "DuckFriends";
    needSudo(x, "hostname");
    const n = args.join(" ").replace(/\s+/g, " ").trim().slice(0, 32);
    x.ctx.room.send({ t: "roomName", name: n });
    return `The room is now ${n}.`;
  },
  uname: (args, i, x) => {
    const s = x.ctx.room && x.ctx.room.state;
    if (!args.includes("-a")) return "DuckFriends";
    return `DuckFriends pond ${VERSION} ${s ? `${modeOf(s.options.mode).name} · ${mapName(s.options.map)}` : ""} duckbash`.replace(
      /\s+/g,
      " ",
    );
  },
  date: () => new Date().toString().replace(/ \(.*\)$/, ""),
  cal: () => cal(),
  uptime: (a, i, x) => {
    const s = needRoom(x.ctx);
    if (!s.startedAt || s.phase === "lobby") return "The game hasn't started.";
    return `${upLine(s)}${isSb(s) ? "" : `, round ${s.round + 1}`}`; // (Sandbox has no rounds)
  },
  ps: (args, i, x) =>
    psLines(
      needRoom(x.ctx),
      args.some((a) => /a|u|x|-e/.test(a)),
    ),
  top: async (a, i, x) => {
    const { ctx } = x;
    needRoom(ctx);
    if (!x.meta.screen) return topLines(ctx); // into a pipe or a file: once
    const t0 = Date.now();
    while (!ctx.cancelled() && Date.now() - t0 < 60000) {
      ctx.live(lines(topLines(ctx) + "\n(Ctrl+C to stop)"));
      await wait(1000, ctx);
    }
    ctx.live([]);
    return topLines(ctx);
  },
  jumps: (args, i, x) => {
    const s = needRoom(x.ctx),
      ids = args.length ? who(x.ctx, args) : [x.ctx.room.me];
    return ids
      .map(
        (id) =>
          `${pname(s, id)}: ${(s.jumps || {})[id] || 0} Jumps this game · ${allJumps(id === x.ctx.room.me ? profile.stats : s.players[id].stats) + ((s.jumps || {})[id] || 0)} of all time`,
      )
      .join("\n");
  },
  ping: (args, i, x) => {
    const s = needRoom(x.ctx),
      ids = args.length ? who(x.ctx, args) : s.seat;
    return ids
      .map((id) => `${pname(s, id)}: ${pingOf(x.ctx, s.players[id])}`)
      .join("\n");
  },
  roll: (args) => {
    const m = (args[0] || "1d6").match(/^(\d{0,2})d(\d{1,3})$/i);
    if (!m) fail("✗ roll NdM, like roll 2d6");
    const n = Math.min(20, +m[1] || 1),
      k = Math.max(2, +m[2]),
      r = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * k));
    return n > 1
      ? `${r.join(" + ")} = ${r.reduce((a, b) => a + b, 0)}`
      : String(r[0]);
  },
  flip: () => (Math.random() < 0.5 ? "Heads" : "Tails"),
  ducksay: (args, stdin) =>
    ducksay(args.length ? args.join(" ") : stdin.trim() || "Quack."),
  fortune: () => FORTUNES[Math.floor(Math.random() * FORTUNES.length)],
  cheat: (args, i, x) => cheatCmd(args, x, { needMay, who, fail }),
  skip: (args, i, x) => {
    const s = needMay(x, "canskip", "skip");
    if (idle(s)) fail("✗ skip works during a game.");
    if (modeOf(s.options.mode).noRounds)
      fail(
        "✗ skip: Hangout has nothing to skip. The pause menu takes everyone back to the lobby.",
      );
    x.ctx.room.send({ t: "skip" });
    return "Skipped ahead.";
  },
  kick: (args, i, x) => {
    const s = needMay(x, "cankick", "kick");
    if (!args.length) fail(`✗ ${MAN.kick}`);
    const out = [];
    for (const id of who(x.ctx, args)) {
      if (id === s.hostId) fail("✗ kick: nobody can kick the host.");
      if (id === x.ctx.room.me)
        fail("✗ kick: you can't kick yourself (leave from the pause menu).");
      x.ctx.room.send({ t: "kick", who: id });
      out.push(pname(s, id));
    }
    return `Removed ${out.join(", ")}.`;
  },
  map: (args, i, x) => {
    const s = needRoom(x.ctx);
    if (!args.length)
      return (
        table(
          SH_MAPS.map((m) => [
            m[0],
            m[1] + (m[0] === s.options.map ? "  (now)" : ""),
          ]),
        ) +
        `\nHangout brings its own: Duck Cabin${isWorldMap(s.options.map) ? "  (now)" : ""}`
      );
    const id = args.join(" ").toLowerCase(),
      m = SH_MAPS.find(
        (v) =>
          v[0] === id ||
          v[1].toLowerCase() === id ||
          v[1].toLowerCase().startsWith(id),
      );
    if (!m)
      fail(
        /^(cabin|duck cabin)$/.test(id)
          ? "✗ map: Duck Cabin comes with Hangout: sudo mode hang"
          : `✗ map: no map ${args.join(" ")} (map lists them)`,
      );
    needSudo(x, "map");
    if (modeOf(s.options.mode).cabinHome)
      fail("✗ map: Hangout is always in Duck Cabin.");
    if (!idle(s)) fail("✗ map: in the lobby.");
    x.ctx.room.send({ t: "options", options: { map: m[0] } });
    return `Map: ${m[1]}.`;
  },
  mode: (args, i, x) => {
    const s = needRoom(x.ctx);
    if (!args.length)
      return table(
        modesFor(s).map((m) => [
          m.id,
          m.name + (m.id === s.options.mode ? "  (now)" : ""),
        ]),
      );
    const id = args.join(" ").toLowerCase(),
      m = modesFor(s).find(
        (v) =>
          v.id === id ||
          v.name.toLowerCase() === id ||
          v.name.toLowerCase().startsWith(id),
      );
    if (!m) fail(`✗ mode: no game type ${args.join(" ")} (mode lists them)`);
    needSudo(x, "mode");
    if (!idle(s)) fail("✗ mode: in the lobby.");
    x.ctx.room.send({ t: "options", options: { mode: m.id } });
    return `Game: ${m.name}.`;
  },
  /* Survival stays hidden from every list until this turns it on for the room (modes.js HIDDEN_MODES) */
  survival: (args, i, x) => {
    const s = needSudo(x, "survival"),
      on = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(on))
      fail("✗ survival: sudo survival <on | off>");
    if (!idle(s)) fail("✗ survival: in the lobby.");
    const set = { survOn: on === "on" };
    if (on === "off" && HIDDEN_MODES[s.options.mode]) set.mode = "aod"; // (a hidden game being played goes back to the first)
    x.ctx.room.send({ t: "options", options: set });
    return on === "on"
      ? "Survival is in the game lists."
      : "Survival is hidden.";
  },
  start: (a, i, x) => {
    const s = needSudo(x, "start");
    if (!idle(s)) fail("✗ start: the game is already going.");
    x.ctx.room.send({ t: "start" });
    return "Starting…";
  },
  forgame: (args, i, x) => forgame(x, args),
  song: (args, i, x) => songs(x, args),
  songs: (args, i, x) => songs(x, []),
  roundstats: (args, i, x) => statLines(x.ctx, "round", args),
  gamestats: (args, i, x) => statLines(x.ctx, "game", args),
  totalstats: (args, i, x) => statLines(x.ctx, "total", args),
  send: (args, stdin, x) => send(args, stdin, x),
});
