/* the people and groups commands (a pure move out of shell.js: the entries of its CMDS table, run by the same shell) */
import {
  groupsOf,
  isSudo,
  denied,
  permOk,
  GROUP_PERMS,
  STAGE,
} from "./roomrules.js";
import { finger, lastLines, pingOf, upLine } from "./shellpeople.js";
import {
  fail,
  fs,
  groupNameWrong,
  needRoom,
  needSudo,
  pname,
  roomGroups,
  table,
  userGroup,
  wait,
  who,
} from "./shellfs.js";
import { getopt } from "./textutils.js";
import { MAN } from "./manual.js";
import { CMDS } from "./shellcmds.js";

Object.assign(CMDS, {
  history: (args) => {
    if (args[0] === "-c") {
      fs.hist = [];
      return "";
    }
    const n = +args[0] || fs.hist.length,
      from = Math.max(0, fs.hist.length - n);
    return fs.hist
      .slice(from)
      .map((h, i) => `${String(from + i + 1).padStart(4)}  ${h}`)
      .join("\n");
  },
  sleep: async (args, i, x) => {
    const n = parseFloat(args[0]);
    if (!(n >= 0)) fail("✗ sleep: usage: sleep seconds");
    if (n > 30) fail("✗ sleep: 30 seconds at most here");
    await wait(n * 1000, x.ctx);
    if (x.ctx.cancelled()) fail("^C", 130);
    return "";
  },
  /* people */
  whoami: (a, i, x) => x.ctx.meName,
  id: (args, i, x) => {
    const { o, rest } = getopt(args, "gGnu", "id"),
      s = needRoom(x.ctx),
      [id] = rest.length ? who(x.ctx, rest) : [x.ctx.room.me],
      n = pname(s, id),
      gs = [...groupsOf(s, id), "superuser-" + n];
    if (o.u) return n;
    if (o.g) return gs[0];
    if (o.G) return gs.join(" ");
    return `uid=${n} gid=${gs[0]} groups=${gs.join(",")}`;
  },
  groups: (args, i, x) => {
    const s = needRoom(x.ctx),
      [id] = args.length ? who(x.ctx, args) : [x.ctx.room.me];
    return [...groupsOf(s, id), "superuser-" + pname(s, id)].join(" ");
  },
  members: (args, i, x) => {
    const s = needRoom(x.ctx),
      g = (args[0] || "").toLowerCase();
    if (!g) fail("✗ members <group>");
    if (g.startsWith("superuser-")) return g.slice(10);
    if (!roomGroups(s)[g])
      fail(`✗ members: no group ${g}. getent group lists them.`);
    return (
      s.seat
        .filter((id) => groupsOf(s, id).includes(g))
        .map((id) => pname(s, id))
        .join(" ") || "(nobody)"
    );
  },
  getent: (args, i, x) => {
    if ((args[0] || "") !== "group") fail("✗ getent group [group]");
    const s = needRoom(x.ctx),
      G = roomGroups(s),
      line = (g) =>
        `${g}:x:${s.seat
          .filter((id) => groupsOf(s, id).includes(g))
          .map((id) => pname(s, id))
          .join(",")}:${(G[g].perms || []).join(",")}`;
    if (!args[1]) return Object.keys(G).map(line).join("\n");
    const g = args[1].toLowerCase();
    if (g.startsWith("superuser-")) return `${g}:x:${g.slice(10)}:`;
    if (!G[g]) return { out: "", code: 2 };
    return line(g);
  },
  users: (a, i, x) => {
    const s = needRoom(x.ctx);
    return s.seat
      .map((id) => pname(s, id))
      .sort()
      .join(" ");
  },
  who: (a, i, x) => {
    const s = needRoom(x.ctx);
    return table(
      s.seat.map((id) => [
        pname(s, id),
        [
          id === s.hostId ? "host" : "",
          isSudo(s, id) ? "sudo" : "",
          s.players[id].bot ? "computer" : "",
        ]
          .filter(Boolean)
          .join(", "),
      ]),
    );
  },
  w: (a, i, x) => {
    const s = needRoom(x.ctx),
      st = STAGE[s.phase] || "lobby";
    return [
      ` ${new Date().toTimeString().slice(0, 8)} ${upLine(s)}, ${st}`,
      table([
        ["PLAYER", "PING", "WHAT"],
        ...s.seat.map((id) => {
          const p = s.players[id];
          return [
            pname(s, id) + (id === s.hostId ? "*" : ""),
            pingOf(x.ctx, p),
            [
              p.idle ? "away" : "",
              p.late
                ? "waits for the next turn"
                : s.done && s.done[id]
                  ? "ended their turn"
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
      "(* the host)",
    ].join("\n");
  },
  finger: (args, i, x) => {
    const s = needRoom(x.ctx),
      ids = args.length ? who(x.ctx, args) : [x.ctx.room.me];
    return ids.map((id) => finger(x.ctx, id)).join("\n\n");
  },
  last: (a, i, x) => lastLines(needRoom(x.ctx)),
  write: (args, i, x) => {
    const s = needRoom(x.ctx),
      me = x.ctx.room.me;
    if (!args[0] || !args[0].startsWith("@") || args.length < 2)
      fail("✗ write: usage: write @name message");
    const [to] = who(x.ctx, [args[0]]);
    if (denied(s, me, "nochat")) fail("✗ write: your group can't chat.");
    if (denied(s, me, "nosend"))
      fail("✗ write: your group can't send from the command line.");
    const w = x.ctx.slowLeft();
    if (w > 0) fail(`✗ write: slow down (${Math.ceil(w / 1000)} s).`);
    if (++x.rs.sends > 3) fail("✗ write: 3 sends a line at most.");
    x.ctx.room.send({
      t: "chat",
      to,
      text: args.slice(1).join(" ").slice(0, 500),
    });
    x.ctx.sent();
    return `To ${pname(s, to)}, privately.`;
  },
  sudo: () => fail("✗ usage: sudo <command> (sudo -l: what sudo lets you do)"),
  usermod: (args, i, x) => {
    // usermod [-a | -r] -G group[,group] name… (a name with or without @)
    const as = x.as || "usermod",
      s = needSudo(x, as),
      { o, rest: at } = getopt(args, "arG:", "usermod");
    if (!at.length) fail(`✗ ${MAN.usermod}`);
    const groups = o.G
        ? String(o.G)
            .split(",")
            .filter(Boolean)
            .map((g) => g.toLowerCase())
        : ["sudo"],
      G = roomGroups(s);
    for (const g of groups) {
      if (g.startsWith("superuser-"))
        fail(`✗ ${as}: ${g} can't be changed, not even by its player.`);
      if (!G[g])
        fail(`✗ ${as}: group '${g}' does not exist (getent group lists them)`);
    }
    const mode = !o.G ? "add" : o.r ? "remove" : o.a ? "add" : "set",
      ids = who(x.ctx, at);
    for (const id of ids) {
      if (id === s.hostId && groups.includes("sudo") && mode !== "add")
        fail(`✗ ${as}: the host is always in sudo, and that can't be undone.`);
      x.ctx.room.send({ t: "usermod", target: id, groups, mode });
    }
    return `${mode === "add" ? "Added to" : mode === "remove" ? "Taken out of" : "Set to"} ${groups.join(", ")}: ${ids.map((id) => pname(s, id)).join(", ")}`;
  },
  gpasswd: (args, i, x) => {
    // gpasswd -a name group, gpasswd -d name group
    needSudo(x, "gpasswd");
    const { o, rest } = getopt(args, "a:d:", "gpasswd"),
      at = o.a ?? o.d,
      g = rest[0];
    if (!at || !g || (o.a && o.d)) fail(`✗ ${MAN.gpasswd}`);
    return CMDS.usermod([o.a ? "-aG" : "-rG", g, at], i, {
      ...x,
      as: "gpasswd",
    });
  },
  adduser: (args, i, x) => {
    const s = needSudo(x, "adduser"),
      [at, g] = userGroup(args, s);
    if (!at || !g) fail(`✗ ${MAN.adduser}`);
    return CMDS.usermod(["-aG", g, at], i, { ...x, as: "adduser" });
  },
  deluser: (args, i, x) => {
    const s = needSudo(x, "deluser"),
      [at, g] = userGroup(args, s);
    if (!at || !g) fail(`✗ ${MAN.deluser}`);
    return CMDS.usermod(["-rG", g, at], i, { ...x, as: "deluser" });
  },
  useradd: (args, i, x) => {
    // the ducks are already here: useradd -G puts one in groups, like usermod -aG
    needSudo(x, "useradd");
    const { o, rest } = getopt(args, "G:m", "useradd");
    if (!o.G || !rest.length) fail(`✗ ${MAN.useradd}`);
    return CMDS.usermod(["-aG", o.G, ...rest], i, { ...x, as: "useradd" });
  },
  userdel: (args, i, x) => {
    needSudo(x, "userdel");
    fail(
      "✗ userdel: ducks can't be deleted. kick @name removes one from the room; usermod -rG group @name takes one out of a group.",
    );
  },
  groupadd: (args, i, x) => {
    const s = needSudo(x, "groupadd"),
      { o, rest } = getopt(args, "p:", "groupadd"),
      perms = String(o.p || "")
        .split(",")
        .filter(Boolean),
      name = rest[0];
    if (!name) fail(`✗ ${MAN.groupadd}`);
    const why = groupNameWrong(name);
    if (why) fail(`✗ groupadd: '${name}' ${why}`);
    const bad = perms.filter((p) => !permOk(p));
    if (bad.length)
      fail(
        `✗ groupadd: ${bad.join(", ")}? Perms: ${GROUP_PERMS.join(", ")}, slow30`,
      );
    if (roomGroups(s)[name.toLowerCase()])
      fail(`✗ groupadd: group '${name}' already exists`);
    if (Object.keys(roomGroups(s)).length >= 20)
      fail("✗ groupadd: 20 groups at most");
    x.ctx.room.send({ t: "groupadd", name: name.toLowerCase(), perms });
    return `Group ${name.toLowerCase()}${perms.length ? ` (${perms.join(", ")})` : ""}. Add players: sudo usermod -aG ${name.toLowerCase()} @name`;
  },
  groupmod: (args, i, x) => {
    const s = needSudo(x, "groupmod"),
      { o, rest } = getopt(args, "n:p:", "groupmod"),
      g = (rest[0] || "").toLowerCase(),
      G = roomGroups(s);
    if (!g || (o.n === undefined && o.p === undefined))
      fail(`✗ ${MAN.groupmod}`);
    if (g.startsWith("superuser-"))
      fail(`✗ groupmod: ${g} can't be changed, not even by its player.`);
    if (!G[g]) fail(`✗ groupmod: group '${g}' does not exist`);
    if (["sudo", "dumbasses"].includes(g))
      fail(`✗ groupmod: ${g} stays as it is.`);
    if (o.n !== undefined) {
      const to = String(o.n).toLowerCase();
      const why = groupNameWrong(to);
      if (why) fail(`✗ groupmod: '${o.n}' ${why}`);
      if (G[to]) fail(`✗ groupmod: group '${to}' already exists`);
      x.ctx.room.send({ t: "groupmod", name: g, newName: to });
      return `Renamed ${g} to ${to}.`;
    }
    const perms = String(o.p).split(",").filter(Boolean),
      bad = perms.filter((p) => !permOk(p));
    if (bad.length)
      fail(
        `✗ groupmod: ${bad.join(", ")}? Perms: ${GROUP_PERMS.join(", ")}, slow30`,
      );
    x.ctx.room.send({ t: "groupmod", name: g, perms });
    return `${g}'s perms: ${perms.join(", ") || "none"}.`;
  },
  groupdel: (args, i, x) => {
    const s = needSudo(x, "groupdel"),
      g = (args[0] || "").toLowerCase();
    if (!g)
      fail("✗ groupdel: usage: sudo groupdel group (getent group lists them)");
    if (["sudo", "dumbasses"].includes(g)) fail(`✗ groupdel: ${g} stays.`);
    if (g.startsWith("superuser-")) fail(`✗ groupdel: ${g} can't be removed.`);
    if (!roomGroups(s)[g]) fail(`✗ groupdel: group '${g}' does not exist`);
    x.ctx.room.send({ t: "groupdel", name: g });
    return `Removed ${g}.`;
  },
  newgrp: () => MAN.newgrp.split(": ")[1],
  visudo: () => fail(`✗ visudo: ${MAN.visudo.split(": ")[1]}`),
  su: () => fail(`✗ su: ${MAN.su.split(": ")[1]}`),
  passwd: () => fail("✗ passwd: Ducks don't have passwords."),
});
