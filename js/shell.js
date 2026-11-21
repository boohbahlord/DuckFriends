/* ---------- the command line: a small bash ----------
   The language itself (pipes, ; && ||, > >> < 2>, variables, $( ), wildcards, loops, aliases, !! history) is bash.js;
   the text tools (grep, sed, awk, cut, sort …) are textutils.js; every command's page and help's topics are manual.js.
   This file is the shell around them: the files, and the commands that know the game.

   The files: / holds bin (the commands; nobody can read them, not even the host) and usr; /usr/<you> is your home:
   notes/ (your files, for this game only), log (everything you ran this game and what came out, read-only) and
   perma-notes/ (kept on this device from game to game; only you, superuser-<you>, can open it; its files can be removed,
   the folder can't). Other players' homes show in /usr, but their files live on their own devices.
   notes/seriat/ holds my Seriat files (Sandbox, stage 7a): unlike the rest of notes it is kept on this device from game
   to game, folders, files and their +x, and can be organized from here in any mode (mkdir, cp, mv, rm). A file runs only
   in Sandbox, from the Seriat window's Run button or as ./file once chmod +x; ps lists it and kill <pid> stops it.

   The room's commands go through the host: sudo runs a command as a member of the sudo group (the host always is);
   usermod, groupadd, groupmod and groupdel need it, and so does forgame (the game's settings mid-game, and mutes that
   everyone sees). A group's perms take something away (nocmd, nochat, nosend, nofun, nomute, slow or slow30) or give part
   of the host's job (canskip, canmute, cankick, cansettings); dumbasses has nofun and slow. Anyone in sudo can run the room
   like the host (lobby settings, map, game type, start, kick) and skip the stage the game is on.

   send posts a command's output to the chat (send @everyone roundstats, send \@name totalstats @name2, roundstats | send
   @everyone); sending a file by itself shows its name, and only sudo members can open it, unless chmod let its group (g+r)
   or everyone (o+r). The chat's \mute, \permmute and \show work here too. A line sends 3 times at most, and fires 3 silly
   commands at most, a second apart. */
import { profile, save, STAT_MODES } from "./store.js";
import {
  isSudo,
  may,
  denied,
  GROUP_PERMS,
  STAGE,
  slowMs,
} from "./roomrules.js";
import { MODES } from "./modes.js";
import { CMDS } from "./shellcmds.js";
import "./shellcmdfiles.js";
import "./shellcmdpeople.js";
import "./shellcmdroom.js";
import { SH_MAPS, STAGES } from "./shellstats.js";
import {
  FUN,
  HOME,
  IO,
  MINE,
  below,
  fail,
  findPath,
  fs,
  glob,
  guard,
  inNum,
  inRo,
  kind,
  list,
  needMay,
  needRoom,
  noSudo,
  norm,
  numKeep,
  numRoot,
  pids,
  pname,
  procs,
  readFile,
  resolve,
  roomGroups,
  roomS,
  shareCopies,
  shareNames,
  sync,
  table,
  takeWrites,
  theirText,
  theirs,
  unHome,
  unHomeN,
  wait,
  who,
  writeFile,
} from "./shellfs.js";
import { runLine, expandHistory, BUILTIN_NAMES } from "./bash.js";
import { TEXT, lines } from "./textutils.js";
import { MAN, PERMS_GIVE } from "./manual.js";
import { helpPage, helpIndex, HELP_NAMES, isHelpName } from "./helppages.js";
import { setPerf, perfOn } from "./perf.js";
import { secret } from "./unlocks.js";
import { uiCommand } from "./hideui.js";
import { SERIAT_THEMES, seriatTheme, setSeriatTheme } from "./seriattheme.js";
import { music } from "./music.js";
import { npcsHere, npcTag } from "./npcs.js";
import { isSb, sbMay } from "./sandboxrules.js";
import { LANG, LANG_DIR } from "./langname.js";
import { nbRights, nbGiven, nbCopy, nbCopies } from "./nbperms.js";
import { compileScript, brain, paramsOf } from "./numberatrun.js";

/* send: posts what a command prints (or a file, or what came through |) to the chat */
export async function send(args, stdin, x) {
  const { ctx, meta, rs } = x,
    s = needRoom(ctx),
    me = ctx.room.me,
    targets = [];
  const toks = [...args];
  while (toks.length && /^\\?@/.test(toks[0])) targets.push(toks.shift());
  if (!targets.length) fail(`✗ ${MAN.send}`);
  if (denied(s, me, "nochat")) fail("✗ send: your group can't chat.");
  if (denied(s, me, "nosend"))
    fail("✗ send: your group can't send from the command line.");
  const wait = ctx.slowLeft();
  if (wait > 0)
    fail(
      `✗ send: slow down: one message every ${Math.round(slowMs(s, me) / 1000)} seconds (${Math.ceil(wait / 1000)} s).`,
    );
  if (++rs.sends > 3) fail("✗ send: 3 sends a line at most.");
  const pub = targets.filter((t) => t.startsWith("@")),
    priv = targets.filter((t) => t.startsWith("\\@"));
  const privIds = who(ctx, priv),
    pubIds = pub.filter((t) => t.toLowerCase() !== "@everyone");
  if (pubIds.length) who(ctx, pubIds);
  /* a file by itself: its name goes, and its words (only sudo, its group or everyone can open them, as chmod says) */
  let body,
    file = null,
    cmd,
    extra = {};
  if (
    !toks.length &&
    !stdin &&
    !/\|\s*send\b/.test(meta.pipeRaw || "") &&
    !/<|<<</.test(meta.raw || "")
  )
    fail(`✗ send: nothing to send. ${MAN.send}`);
  if (!toks.length) {
    body = stdin;
    cmd =
      (meta.pipeRaw || "").replace(/\|\s*send\b[^|]*$/, "").trim() || "send";
  } else if (
    toks.length === 1 &&
    !isCommand(toks[0], ctx) &&
    kind(findPath(toks[0])) === "file"
  ) {
    const path = findPath(toks[0]),
      m = fs.meta[path] || {};
    body = readFile(toks[0]);
    file = toks[0].split("/").pop();
    cmd = toks[0];
    if (m.o) extra.pub = true;
    else if (m.g && m.grp) extra.grp = m.grp;
  } else if (toks.length === 1 && !isCommand(toks[0], ctx))
    fail(`✗ send: ${toks[0]}: no such file or command (ls shows your files).`);
  else {
    const r = await one(toks, stdin, meta, ctx, rs);
    body = r && typeof r === "object" ? r.out || "" : (r ?? "");
    cmd =
      (meta.raw || "").replace(/^\s*(?:sudo\s+)?send(\s+\\*@\S+)+\s*/, "") ||
      toks.join(" ");
  }
  body = String(body).replace(/\n+$/, "");
  if (!body.trim()) body = file ? "(empty)" : "(no output)";
  const msg = {
    t: "chat",
    text: (pubIds.length ? pubIds.join(" ") + "\n" : "") + body,
    cmd,
    ...(file ? { file, ...extra } : {}),
  };
  if (pub.length) ctx.room.send(msg);
  for (const id of privIds) ctx.room.send({ ...msg, to: id });
  ctx.sent();
  return `Sent to ${targets.join(" ")}.`;
}

/* ---------- the commands: (args, stdin, x) → the output; x: ctx, sudo, meta, rs (this line's counts) ---------- */
Object.assign(CMDS, {
  help: (args) => {
    const t = args.join("-").toLowerCase();
    if (!t) return helpIndex();
    if (t === "all")
      return `Every command (man <command> for one):\n${[...new Set([...MINE, ...BUILTIN_NAMES])].sort().join(" ")}\nand the chat's \\mute \\permmute \\show.\nThe Help pages: ${HELP_NAMES.join(" ")}`;
    const p = (t === "help" && helpPage("help-help")) || helpPage(t);
    if (p) return p;
    if (MAN[args[0]] || MAN[args[0].toLowerCase()])
      return MAN[args[0]] || MAN[args[0].toLowerCase()];
    fail(`✗ help: no page ${args.join(" ")}. help lists them.`);
  },
  man: (args) => {
    if (args[0] === "-k") {
      const w = (args[1] || "").toLowerCase();
      if (!w) fail("✗ man -k word");
      const hit = Object.entries(MAN).filter(
        ([k, v]) => k.includes(w) || v.toLowerCase().includes(w),
      );
      return hit.length
        ? hit
            .map(
              ([k, v]) =>
                `${k.padEnd(11)} - ${v.split(": ").slice(1).join(": ").split(". ")[0]}`,
            )
            .join("\n")
        : { out: `${w}: nothing appropriate.`, code: 1 };
    }
    if (!args[0])
      return "What manual page do you want? man <command> (help lists them; man -k word searches).";
    return (
      MAN[args[0]] ||
      MAN[args[0].toLowerCase()] ||
      helpPage(args.join("-")) ||
      fail(`✗ No manual entry for ${args[0]} (help lists the Help pages)`)
    );
  },
  apropos: (args, i, x) => CMDS.man(["-k", ...args], i, x),
  /* the secret codes (kept out of help, /bin and Tab): Secret <code> on|off */
  secret: (args, i, x) => {
    const msg = secret(args[0], (args[1] || "").toLowerCase());
    if (x.ctx.look) x.ctx.look();
    return msg;
  },
  /* the frame-rate readout (perf.js), kept out of help, /bin and Tab like secret: fps on|off */
  fps: (args) => {
    const want = (args[0] || "").toLowerCase();
    const on = setPerf(want ? want === "on" : !perfOn());
    return on ? "Frame-rate readout on (top left)." : "Frame-rate readout off.";
  },
  /* hide ui: the bars, the words at the bottom and the song bar go, mine alone (again, or show ui: back; hideui.js) */
  hide: (args) => uiCommand("hide", args[0]),
  /* theme <name>: the look of Seriat and the command line (the book's variations, seriattheme.js) */
  theme: (args) => {
    if (!args[0])
      return [
        `theme: ${SERIAT_THEMES.find((t) => t[0] === seriatTheme())[2]} (${seriatTheme()})`,
        `theme <name>, one of: ${SERIAT_THEMES.map((t) => t[0]).join(", ")}`,
      ].join("\n");
    const t = setSeriatTheme(args[0]);
    if (!t)
      fail(
        `✗ theme: ${args[0]}: no such theme (${SERIAT_THEMES.map((x) => x[0]).join(", ")})`,
      );
    return `Theme: ${t[2]}.`;
  },
  show: (args) => uiCommand("show", args[0]),
  clear: () => null,
  exit: (a, i, x) => {
    x.ctx.close();
    return "";
  },
  /* the room and the game */
});
CMDS.logout = CMDS.exit;
/* the commands in /bin: everything with a manual page */
MINE.push(
  ...[...new Set([...Object.keys(CMDS), ...Object.keys(TEXT)])]
    .filter((k) => k !== "sudo" && k !== "secret" && k !== "fps")
    .sort(),
);

/* the room's songs: everyone hears the same one; the host, sudo or cansettings can take songs off the list and put them
   back. A name with a space (or ' or ?) goes in quotes, as in bash: song off "Bouncy Chicks" */
const qn = (n) => (/[\s'"?*\[\]$`\\|&;<>()]/.test(n) ? `"${n}"` : n);
export function songs(x, args) {
  const s = needRoom(x.ctx),
    off = new Set((s.music && s.music.off) || []),
    np = music.nowPlaying(),
    names = music.tracks;
  const [sub, ...rest] = args;
  if (!sub || sub === "list" || sub === "-l")
    return table(
      names.map((n) => [
        qn(n),
        off.has(n) ? "off" : "on",
        np && np.name === n ? (np.next ? "(next)" : "(playing now)") : "",
      ]),
    );
  if (sub === "now")
    return np && np.name
      ? `${np.next ? `Next, in ${np.in} s` : "Playing now"}: ${np.name}`
      : "No song is on.";
  if (sub !== "on" && sub !== "off")
    fail(
      `✗ song: usage: song [list] · song now · song on|off name… · song on|off all (man song)`,
    );
  needMay(x, "cansettings", `song ${sub}`);
  if (!rest.length)
    fail(
      `✗ song ${sub}: which song? song lists them. A name with spaces goes in quotes: song ${sub} "Bouncy Chicks"`,
    );
  if (rest.length === 1 && rest[0].toLowerCase() === "all") {
    x.ctx.room.send(
      sub === "on" ? { t: "songs", all: "on" } : { t: "songs", off: names },
    );
    return sub === "on"
      ? "Every song is on."
      : "Every song is off: no music until song on.";
  }
  const found = [];
  for (const w of rest) {
    const n = names.find((v) => v.toLowerCase() === w.toLowerCase());
    if (n) {
      if (!found.includes(n)) found.push(n);
      continue;
    }
    const whole =
      names.find((v) => v.toLowerCase() === rest.join(" ").toLowerCase()) ||
      names.find((v) =>
        v.toLowerCase().startsWith(rest.join(" ").toLowerCase()),
      );
    fail(
      whole && rest.length > 1
        ? `✗ song: no song named ${w}. A name with spaces goes in quotes, as in bash: song ${sub} ${qn(whole)}`
        : `✗ song: no song named ${qn(w)} (song lists them)`,
    );
  }
  x.ctx.room.send({ t: "songs", [sub]: found });
  const playing = np && np.name && !np.next && found.includes(np.name);
  return `${sub === "off" ? "Off" : "On"}: ${found.join(", ")}${/[.?!]$/.test(found[found.length - 1]) ? "" : "."}${sub === "off" && playing ? " It stops now; the next song comes in 3 seconds." : ""}${sub === "off" && names.every((n) => off.has(n) || found.includes(n)) ? " Every song is off now." : ""}`;
}

/* what sudo lets you do */
function sudoList(ctx) {
  const s = needRoom(ctx),
    me = ctx.room.me;
  if (!isSudo(s, me)) {
    const gives = Object.keys(PERMS_GIVE).filter((p) => may(s, me, p));
    return {
      out: `${noSudo(ctx).slice(2)}${gives.length ? `\nYour groups give you: ${gives.map((p) => `${p} (${PERMS_GIVE[p]})`).join(", ")}.` : ""}`,
      code: 1,
    };
  }
  return [
    `${ctx.meName} may run, as sudo:`,
    "  usermod useradd gpasswd adduser deluser groupadd groupmod groupdel hostname",
    "  skip, kick, forgame, map, mode, start, song on|off",
    "(Type sudo first: sudo skip.)",
    ...(me === s.hostId ? ["(You are the host: always in sudo.)"] : []),
  ].join("\n");
}

/* ---------- running a command ---------- */
const isCommand = (name, ctx) =>
  !!(
    isHelpName(name) ||
    CMDS[name] ||
    TEXT[name] ||
    BUILTIN_NAMES.includes(name) ||
    ctx.legacyHas(String(name).toLowerCase()) ||
    name === "sudo"
  );
const dq = (w) => (/\s/.test(w) ? `"${w}"` : w);
/* one command, its words already expanded (sudo first if given) */
async function one(argv, stdin, meta, ctx, rs) {
  let sudo = false,
    words = argv;
  if (words[0] === "sudo") {
    const f = words[1] || "";
    if (f === "-l" || f === "--list") return sudoList(ctx);
    if (f === "-h" || f === "--help") return MAN.sudo;
    if (f === "-v" || f === "--validate") {
      if (!isSudo(needRoom(ctx), ctx.room.me)) fail(noSudo(ctx));
      return "";
    }
    if (f === "-k" || f === "-K") return "";
    if (/^-[is]$|^--(login|shell)$/.test(f))
      fail(
        "✗ sudo: there is no sudo shell here. Put sudo in front of each command (sudo -l lists them).",
      );
    if (/^-u|^--user/.test(f))
      fail(
        "✗ sudo: -u: there is nobody else to be here. sudo <command> runs it as sudo.",
      );
    if (f.startsWith("-"))
      fail(
        `✗ sudo: invalid option '${f}' (sudo -l, sudo -v, sudo -h, or sudo <command>)`,
      );
    sudo = true;
    words = words.slice(1);
    if (!words.length) fail("✗ usage: sudo <command>");
    const s = needRoom(ctx);
    if (!isSudo(s, ctx.room.me)) fail(noSudo(ctx));
  }
  const [c, ...args] = words,
    low = c.toLowerCase();
  if (/^\\(mute|permmute|show|togglesuggest)$/i.test(c))
    return ctx.chat(words.map(dq).join(" "));
  const x = { ctx, sudo, meta, rs };
  if (c.includes("/")) return runFile(c, ctx, sudo); // (./file: a Seriat file, chmod +x first)
  if (
    low === "kill" &&
    args.length &&
    args.every((a) => /^-?\d+$|^-[A-Z]+$/.test(a))
  )
    return killProcs(args); // (kill <pid>: a Seriat file; kill <name> stays the silly one)
  if (isHelpName(c)) return helpPage([c, ...args].join("-")) || helpPage(c); // HelpChat, HelpGame-How, HelpGame How
  if (args.includes("--help") && MAN[low] && (CMDS[low] || TEXT[low]))
    return `${MAN[low]}\n(man ${low} shows the same; help lists the Help pages.)`;
  if (CMDS[c] || CMDS[low])
    return CMDS[c] ? CMDS[c](args, stdin, x) : CMDS[low](args, stdin, x);
  if (TEXT[c] || TEXT[low]) return (TEXT[c] || TEXT[low])(args, stdin, IO);
  if (ctx.legacyHas(low)) {
    if (FUN.includes(low)) {
      // the silly commands: 3 a line at most, a second apart
      if (++rs.fun > 3) fail(`✗ ${low}: 3 silly commands a line at most.`);
      const gap = 1000 - (Date.now() - rs.funAt);
      if (gap > 0) await wait(gap, ctx);
      rs.funAt = Date.now();
    }
    const out = ctx.legacy([low, ...args].map(dq).join(" "));
    if (out === null) return null;
    const text = out.join("\n");
    return { out: text, code: text.startsWith("✗") ? 1 : 0 };
  }
  if (BUILTIN_NAMES.includes(low))
    return fail(`✗ ${c}: command not found (did you mean ${low}?)`, 127);
  fail(`✗ ${c}: command not found. help lists them.`, 127);
}

/* ---------- running a Seriat file (a stub: the language comes later) ----------
   Only in Sandbox, and only for whoever may write Seriat there (sandboxrules.js sbCan), or with sudo. Returns what to
   say; ps lists it until kill <pid> stops it */
function startFile(path, ctx, sudo) {
  const s = ctx.room && ctx.room.state,
    t = theirs(path),
    name = t ? `~${t.name}/${t.rel}` : path.slice(fs.home.length + 1);
  if (!s || !isSb(s))
    fail(`✗ ${name}: ${LANG} files only run in Sandbox.`, 126);
  if (!sbMay(s, ctx.room.me, "n") && !(sudo && isSudo(s, ctx.room.me)))
    fail(
      `✗ ${name}: only the host, or whoever the host lets, runs ${LANG} files here${isSudo(s, ctx.room.me) ? " (sudo runs it as sudo)" : ""}.`,
      126,
    );
  const was = procs.find((p) => p.path === path);
  if (was) return `${name} is already running (pid ${was.pid}).`;
  /* read it first: a file with mistakes doesn't start, and says where they are */
  const c = compileScript((t ? theirText(t) : fs.files[path]) || "", {
    file: (n) => useText(path, n),
    params: t ? [] : paramsOf(fs.files),
  });
  if (c.errs.length)
    fail(
      [
        ...c.errs
          .slice(0, 10)
          .map((e) => `✗ ${name}, line ${e.line}: ${e.why}`),
        ...(c.errs.length > 10 ? [`… ${c.errs.length - 10} more`] : []),
        `${name} didn't start.`,
      ].join("\n"),
      1,
    );
  const out = playTop(c.plan, s, name);
  const pid = pids.next++;
  procs.push({ pid, path, name, at: Date.now() });
  const npc = c.plan.whens.length + c.plan.everys.length;
  return [
    ...out,
    `▶ ${name} is running (pid ${pid}).${npc ? " Its when and every parts are for NPCs: write its name in a spawn's Brain box (b)." : ""} kill ${pid} stops it.`,
  ].join("\n");
}
/* a file's own lines (not its when's and every's), played now: what they print, in order. Its waits go by at once */
function playTop(plan, s, name) {
  const lines = [];
  let t = 0;
  const host = {
    now: () => t,
    stat: () => 0,
    set() {},
    most: () => 0,
    get: (w) =>
      w === "wave"
        ? (s.hang && s.hang.l4 && s.hang.l4.r) || 0
        : w === "time"
          ? t
          : w === "alive"
            ? ((s.mz && s.mz.zb) || []).filter((o) => !o.d).length
            : 0,
    who: () => [],
    act() {},
    say: (me, text) => lines.push(text),
    print: (text) => lines.push(text),
    file: () => null,
    shared: numShared,
    error: (line, why) => lines.push(`✗ ${name}, line ${line}: ${why}`),
  };
  const b = brain(plan, host);
  b.start();
  for (let k = 0; k < 1000 && b.tasks.length; k++) {
    t = Math.min(...b.tasks.map((x) => x.wake));
    b.tick();
  }
  return lines.slice(0, 200);
}
const numShared = new Map(); // (give and take between files)
/* use 'name': the file next to the one using it, or at the Seriat folder's top; .se (or the old .num) may be left off */
function useText(from, name) {
  const t = theirs(from);
  if (t) {
    const c = nbCopies(roomS(), t.id),
      dir = t.rel.includes("/")
        ? t.rel.slice(0, t.rel.lastIndexOf("/") + 1)
        : "";
    for (const d of [dir, ""])
      for (const n of [name, name + ".se", name + ".num"])
        if (c[d + n]) return c[d + n].t;
    return null;
  }
  const dir = from.slice(0, from.lastIndexOf("/"));
  for (const d of [dir, numRoot()])
    for (const n of [name, name + ".se", name + ".num"]) {
      const p = d + "/" + n;
      if (inNum(p) && fs.files[p] != null) return fs.files[p];
    }
  return null;
}
function runFile(c, ctx, sudo) {
  const path = resolve(c),
    k = kind(path);
  if (!k) fail(`✗ ${c}: No such file or directory`, 127);
  guard(path, false);
  if (k === "dir") fail(`✗ ${c}: Is a directory`, 126);
  const t = theirs(path);
  if (t && !nbRights(roomS(), t.id, t.rel, fs.meId).includes("x"))
    fail(`✗ ${c}: Permission denied (${t.name} hasn't given you x on it)`, 126);
  if (!t && !(fs.meta[path] || {}).x)
    fail(
      `✗ ${c}: Permission denied (chmod +x ${c.split("/").pop()} first)`,
      126,
    );
  return startFile(path, ctx, sudo);
}
function killProcs(args) {
  const out = [];
  for (const a of args.filter((a) => /^\d+$/.test(a))) {
    const i = procs.findIndex((p) => p.pid === +a);
    if (i < 0) fail(`✗ kill: (${a}) - No such process`);
    out.push(`■ ${procs[i].name} stopped.`);
    procs.splice(i, 1);
  }
  return out.join("\n");
}

/* the game's own variables, which can't be changed */
function gameVar(name, ctx) {
  const s = ctx.room && ctx.room.state;
  switch (name) {
    case "USER":
    case "LOGNAME":
      return ctx.meName;
    case "HOME":
      return fs.home;
    case "PWD":
      return fs.cwd;
    case "OLDPWD":
      return fs.old || "";
    case "SHELL":
      return "/bin/duckbash";
    case "RANDOM":
      return String(Math.floor(Math.random() * 32768));
    case "HOST":
      return s ? pname(s, s.hostId) : "";
    case "ROOM":
      return s ? s.name || "" : "";
    case "MODE":
      return s ? s.options.mode || "aod" : "";
    case "MAP":
      return s ? s.options.map || "board" : "";
    case "ROUND":
      return s ? String(s.round + 1) : "";
    case "STAGE":
      return s ? STAGE[s.phase] || "lobby" : "";
    case "PLAYERS":
      return s ? s.seat.map((id) => pname(s, id)).join(" ") : ctx.meName;
  }
  return undefined;
}
const GAME_VARS = [
  "USER",
  "LOGNAME",
  "HOME",
  "PWD",
  "OLDPWD",
  "SHELL",
  "RANDOM",
  "HOST",
  "ROOM",
  "MODE",
  "MAP",
  "ROUND",
  "STAGE",
  "PLAYERS",
];
function env(ctx, rs) {
  return {
    exec: (argv, stdin, meta) => one(argv, stdin, meta, ctx, rs),
    has: (n) => isCommand(n, ctx),
    getVar: (n) => gameVar(n, ctx) ?? fs.vars[n],
    setVar: (n, v) => {
      if (GAME_VARS.includes(n))
        fail(`✗ ${n}: readonly variable (the game keeps it)`);
      if (Object.keys(fs.vars).length >= 100 && !(n in fs.vars))
        fail("✗ 100 variables at most");
      v = String(v);
      if (v.length > 5000)
        fail(
          `✗ ${n}: a variable holds 5,000 characters at most (this was ${v.length.toLocaleString("en-US")}). Put it in a file: > notes/file`,
        );
      fs.vars[n] = v;
    },
    unsetVar: (n) => {
      if (GAME_VARS.includes(n))
        fail(`✗ unset: ${n}: cannot unset: readonly variable`);
      delete fs.vars[n];
    },
    listVars: () => [
      ...GAME_VARS.map((n) => [n, gameVar(n, ctx)]),
      ...Object.entries(fs.vars),
    ],
    aliases: (profile.aliases = profile.aliases || {}),
    saveAliases: () => save(),
    read: (p) => readFile(p),
    write: (p, t, a) => writeFile(p, t, a),
    glob,
    fileTest: (f, p) => {
      try {
        const path = findPath(p),
          k = kind(path);
        if (!k) return false;
        guard(path, false);
        return f === "-d"
          ? k === "dir"
          : f === "-e"
            ? true
            : f === "-s"
              ? k === "file" && readFile(p).length > 0
              : k === "file";
      } catch {
        return false;
      }
    },
    home: fs.home,
    cancelled: () => ctx.cancelled(),
    code: fs.code,
  };
}

/* runs what was typed: the lines to show, and whether the window was cleared first */
export async function shellRun(text, ctx) {
  sync(ctx);
  let line = text;
  const res = [];
  try {
    line = expandHistory(text, fs.hist);
    if (line !== text) res.push(line);
  } catch (e) {
    // bash shows what !! became
    return { lines: [e.message], cleared: false };
  } // (bash doesn't keep a line whose !! failed)
  fs.hist.push(line);
  if (fs.hist.length > 200) fs.hist.shift();
  const s = ctx.room && ctx.room.state;
  if (s && denied(s, ctx.room.me, "nocmd"))
    return {
      lines: [
        +s.options.noTerm
          ? "✗ The command line is off in this room."
          : "✗ Your group can't use the command line.",
      ],
      cleared: false,
    };
  const r = await runLine(line, env(ctx, { fun: 0, funAt: 0, sends: 0 }));
  numKeep(); // (the Seriat folder, kept on this device)
  fs.code = r.code;
  res.push(...lines(r.text));
  if (res.length > 1000)
    res.splice(1000, res.length, `… (${res.length - 1000} more lines)`);
  fs.log.push("$ " + text, ...res);
  if (fs.log.length > 2000) fs.log.splice(0, fs.log.length - 2000);
  return { lines: res, cleared: r.cleared };
}
/* ---------- the Seriat window (numeratwin.js): its folder, read and written as the command line does ----------
   ctx: the command line's (chat.js shellCtx) */
export const numerat = {
  root(ctx) {
    sync(ctx);
    return numRoot();
  },
  /* everything in the folder, each { path, name, dir, depth }, folders first at each level */
  tree(ctx) {
    sync(ctx);
    const out = [],
      walk = (dir, depth) => {
        const names = list(dir).sort(
          (a, b) => b.endsWith("/") - a.endsWith("/") || a.localeCompare(b),
        );
        for (const n of names) {
          const dirN = n.endsWith("/"),
            path = dir + "/" + n.replace(/\/$/, "");
          out.push({
            path,
            name: n.replace(/\/$/, ""),
            dir: dirN,
            depth,
            ro: inRo(path), // (the help files: read-only)
          });
          if (dirN) walk(path, depth + 1);
        }
      };
    walk(numRoot(), 0);
    return out;
  },
  /* one folder's own files and folders (the window's left side, as File Explorer: the owner's, Nov 19 16:12Z and
     17:15Z), folders first, each { path, name, dir, ro } */
  list(ctx, dir) {
    sync(ctx);
    if (dir === HOME)
      return [fs.me, ...fs.people.filter((n) => n !== fs.me)].map((name) => ({
        path: name === fs.me ? numRoot() : HOME + "/" + name,
        name,
        dir: true,
        ro: false,
        other: name !== fs.me,
      })); // (home/: mine first, then everyone else's)
    return list(dir)
      .sort((a, b) => b.endsWith("/") - a.endsWith("/") || a.localeCompare(b))
      .map((n) => {
        const name = n.replace(/\/$/, ""),
          path = dir + "/" + name;
        return {
          path,
          name,
          dir: n.endsWith("/"),
          ro: inRo(path),
          other: !!theirs(path),
        };
      });
  },
  home: () => HOME,
  /* my folder's names to the room (sandbox.js asks every few seconds) */
  share(ctx) {
    sync(ctx);
    if (takeWrites()) numKeep();
    shareNames();
    shareCopies();
  },
  /* the window's way of writing a path: home/<me>/…, home/<them>/… */
  rel: (path) =>
    path === numRoot() || inNum(path)
      ? "home/" + fs.me + path.slice(numRoot().length)
      : path.replace(/^\//, ""),
  /* a path typed in the window's path bar, as Linux reads it, from the folder shown: /usr/…, ~/…, .., ., or
     seriat/… (the way the window writes it); "file", "dir" or null for what's there */
  at(ctx, text, from) {
    sync(ctx);
    const t = text.trim().replace(/\/+$/, "") || "/",
      top = numRoot().slice(0, numRoot().lastIndexOf("/")),
      p = norm(
        t === "~"
          ? fs.home
          : t.startsWith("~/")
            ? fs.home + t.slice(1)
            : t.startsWith("/")
              ? t
              : t === LANG_DIR || t.startsWith(LANG_DIR + "/")
                ? top + "/" + t
                : (t === "home" || t.startsWith("home/")) &&
                    !kind(unHomeN(from + "/" + t))
                  ? "/" + t
                  : from + "/" + t,
      );
    const q = unHome(p);
    let k = null;
    try {
      k = kind(q);
    } catch {
      k = null;
    }
    return {
      path: q,
      kind: k,
      inside: q === HOME || !!theirs(q) || q === numRoot() || inNum(q),
    };
  },
  /* every file and folder under dir whose name has q in it (the path bar's search) */
  find(ctx, q, dir) {
    sync(ctx);
    const w = q.trim().toLowerCase();
    if (!w) return [];
    return [...Object.keys(fs.files), ...fs.dirs]
      .filter(
        (p) =>
          p.startsWith(dir + "/") &&
          p.split("/").pop().toLowerCase().includes(w),
      )
      .sort((a, b) => fs.dirs.has(b) - fs.dirs.has(a) || a.localeCompare(b))
      .slice(0, 100)
      .map((p) => ({
        path: p,
        name: p.slice(dir.length + 1),
        dir: fs.dirs.has(p),
        ro: inRo(p),
      }));
  },
  /* a file's words; another player's, or one whose read I turned off, throws why not */
  read(ctx, path) {
    sync(ctx);
    if (theirs(path) || (fs.meta[path] || {}).nr) return readFile(path);
    return fs.files[path] ?? null;
  },
  /* the Permissions button: for one of my files or folders, my own bits (files), what each player, group and everyone
     has, and who's in the room to give rights to; null when it isn't mine */
  perms(ctx, path) {
    sync(ctx);
    if ((path !== numRoot() && !inNum(path)) || inRo(path)) return null;
    const s = roomS(),
      rel = path === numRoot() ? "" : path.slice(numRoot().length + 1),
      m = fs.meta[path] || {},
      sb = !!s && isSb(s);
    return {
      rel,
      file: kind(path) === "file",
      own: (m.nr ? "" : "r") + (m.nw ? "" : "w") + (m.x ? "x" : ""),
      /* a folder: the bits every file in it has (the Recursive switch's Me row) */
      ownAll:
        kind(path) === "dir"
          ? "rwx"
              .split("")
              .filter((b) => {
                const fl = below(path).filter((f) => kind(f) === "file");
                return (
                  fl.length &&
                  fl.every((f) => {
                    const q = fs.meta[f] || {};
                    return b === "r" ? !q.nr : b === "w" ? !q.nw : !!q.x;
                  })
                );
              })
              .join("")
          : "",
      sb,
      given: sb ? nbGiven(s, fs.meId, rel) : [],
      players: s
        ? s.seat
            .filter(
              (id) => id !== fs.meId && s.players[id] && !s.players[id].bot,
            )
            .map((id) => [id, s.players[id].name])
        : [],
      groups: s ? Object.keys(s.groups || {}) : [],
      label: (w) =>
        w === "@o"
          ? "Everyone"
          : w.startsWith("@g:")
            ? "Group " + w.slice(3)
            : s && s.players[w]
              ? s.players[w].name
              : w,
    };
  },
  /* my own bits on a file ("rw", "rx" …), kept on this device; deep: on every file in a folder */
  setOwn(ctx, path, bits, deep = false) {
    sync(ctx);
    CMDS.chmod([...(deep ? ["-R"] : []), `u=${bits}`, path]);
  },
  /* a player's (a group's, everyone's) rights on my file or folder, this Sandbox; deep: on the folder and everything
     in it */
  give(ctx, path, who, bits, deep = false) {
    sync(ctx);
    const s = roomS();
    if (!s || !isSb(s) || !fs.room.send) return;
    const all = deep && kind(path) === "dir" ? [path, ...below(path)] : [path];
    for (const p of all.slice(0, 300))
      fs.room.send({
        t: "nbp",
        path: p === numRoot() ? "" : p.slice(numRoot().length + 1),
        who,
        bits,
      });
  },
  write(ctx, path, text) {
    sync(ctx);
    if (theirs(path)) return writeFile(path, text, false); // (through the room: their device saves it)
    if (!inNum(path)) fail(`✗ That is not in the ${LANG} folder.`);
    writeFile(path, text, false);
    numKeep();
  },
  /* the rights I have on another player's file or folder ("rw-" …), or null when it's mine (or not in home/) */
  theirs(ctx, path) {
    sync(ctx);
    const t = theirs(path);
    return t ? nbRights(roomS(), t.id, t.rel, fs.meId) : null;
  },
  mkdir(ctx, path) {
    sync(ctx);
    if (!inNum(path)) fail(`✗ That is not in the ${LANG} folder.`);
    CMDS.mkdir([path]);
    numKeep();
  },
  ro: (path) => inRo(path),
  /* another file, for use 'name': next to the file using it, then at the folder's top; .se (or the old .num) may be left off */
  use(ctx, from, name) {
    sync(ctx);
    return useText(from, name);
  },
  /* a spawn's Brain box (sbnumberat.js): the file it names, from the folder's top, and every file it uses, each kept
     under the name it's written with; null when there's no such file */
  bundle(ctx, name) {
    sync(ctx);
    /* ~<them>/file: another player's file they gave me x on (its copy in the room), and the files it uses are theirs */
    const m = name.match(/^~([^/]+)\/(.+)$/),
      top = m ? `${HOME}/${m[1]}/${m[2]}` : numRoot() + "/" + name,
      t = m && theirs(top);
    if (m && (!t || !/x/.test(nbRights(roomS(), t.id, t.rel, fs.meId))))
      return null;
    const pre = m ? `~${m[1]}/` : "",
      text = m
        ? (
            nbCopy(roomS(), t.id, t.rel) ||
            nbCopy(roomS(), t.id, t.rel + ".se") ||
            nbCopy(roomS(), t.id, t.rel + ".num") || { t: null }
          ).t
        : useText(top, name.split("/").pop());
    if (text == null) return null;
    const files = { [name]: text },
      seen = (n) => {
        if (!(pre + n in files)) files[pre + n] = useText(top, n);
        return files[pre + n];
      };
    compileScript(text, { file: seen });
    for (const [n, t] of Object.entries(files)) if (t == null) delete files[n];
    return files;
  },
  running: (path) => procs.find((p) => p.path === path) || null,
  run(ctx, path) {
    sync(ctx);
    return startFile(path, ctx, false);
  },
  stop: (pid) => killProcs([String(pid)]),
};
/* ↑ and ↓, and Ctrl+R */
export const shellHistory = () => fs.hist;

/* ---------- suggestions: commands, then files, @names, groups and each command's own words ---------- */
const FILE_CMDS = [
  "cat",
  "less",
  "more",
  "ls",
  "cd",
  "rm",
  "rmdir",
  "head",
  "tail",
  "wc",
  "sort",
  "grep",
  "touch",
  "uniq",
  "cp",
  "mv",
  "tree",
  "find",
  "stat",
  "file",
  "chmod",
  "chgrp",
  "chown",
  "setfacl",
  "getfacl",
  "source",
  ".",
  "cut",
  "tr",
  "sed",
  "awk",
  "rev",
  "tac",
  "nl",
  "fold",
  "column",
  "diff",
  "tee",
  "shuf",
  "bc",
  "mkdir",
  "send",
];
const WORDS = {
  theme: SERIAT_THEMES.map((t) => t[0]),
  help: ["all", ...HELP_NAMES.map((n) => n.slice(4).toLowerCase())],
  forgame: [
    "show",
    "all-timer",
    "timer",
    "turn-end",
    "order",
    "freeroam",
    "discussion",
    "unvote-stops",
    "silly",
    "justin",
    "ghosts",
    "on",
    "off",
    "catch-up",
    "answer",
    "writing",
    "everyone",
    "half",
    "2/3",
    "3/4",
    "random",
    "rotate",
    "low",
    "normal",
    "stage",
    "stage2",
    "rounds8",
    ...STAGES,
    "\\mute",
    "bubble",
    "ping",
    "text",
    "all",
  ],
  map: SH_MAPS.map((m) => m[0]),
  mode: MODES.map((m) => m.id),
  song: ["list", "now", "on", "off", "all", ...music.tracks.map(qn)],
  chmod: ["+x", "u-w", "u+w", "o+r", "o-r", "g+r", "g-r", "755", "644", "600"],
  setfacl: ["-m", "-x", "-b"],
  totalstats: ["-m", ...STAT_MODES.map(([m]) => m)],
  gamestats: ["-m"],
  roundstats: ["-m"],
  ps: ["aux"],
  uname: ["-a"],
  sudo: ["-l"],
  gpasswd: ["-a", "-d"],
  groupmod: ["-n", "-p"],
  getent: ["group"],
  history: ["-c"],
  ls: ["-l", "-a", "-la", "-R"],
};
export function shellSuggest(line, ctx) {
  sync(ctx);
  const seg = line
      .split(/\||;|&&/)
      .pop()
      .replace(/^\s+/, ""),
    pre = line.slice(0, line.length - seg.length);
  const ws = seg.split(/\s+/),
    last = ws[ws.length - 1],
    done = ws.slice(0, -1).filter(Boolean);
  const words0 = done[0] === "sudo" ? done.slice(1) : done,
    cmd = (words0[0] || "").toLowerCase();
  const from = line.length - last.length,
    put = (w) => ({
      label: w,
      apply: () => line.slice(0, from) + w + (w.endsWith("/") ? "" : " "),
    });
  const s = ctx.room && ctx.room.state,
    G = s ? Object.keys(roomGroups(s)) : ["sudo", "dumbasses"];
  let opts = [];
  if (!words0.length)
    opts = [
      ...HELP_NAMES,
      ...MINE,
      ...BUILTIN_NAMES.filter((b) => /^\w/.test(b)),
      ...ctx.legacyTop(),
      ...Object.keys(profile.aliases || {}),
      "\\mute",
      "\\permmute",
      "\\show",
    ];
  else if (ctx.legacyHas(cmd))
    return ctx.legacySuggest(seg.replace(/^sudo\s+/, "")).map((x) => ({
      label: x.label,
      apply: () => pre + (done[0] === "sudo" ? "sudo " : "") + x.apply(),
    }));
  else if (last.startsWith("@") || last.startsWith("\\@")) {
    opts = s
      ? s.seat.map((id) => (last.startsWith("\\") ? "\\@" : "@") + pname(s, id))
      : [];
    if (cmd === "send" && !last.startsWith("\\")) opts.unshift("@everyone");
    if ((/^\\(mute|permmute)$/.test(cmd) || cmd === "forgame") && s)
      opts.push(...npcsHere(s).map((n) => "@" + npcTag(n)));
  } // (the characters can be muted too)
  else if (last.startsWith("$"))
    opts = [...GAME_VARS, ...Object.keys(fs.vars)].map((v) => "$" + v);
  else if (cmd === "man" || cmd === "type" || cmd === "which")
    opts = Object.keys(MAN);
  else if (
    [
      "usermod",
      "members",
      "gpasswd",
      "adduser",
      "deluser",
      "groupdel",
      "chgrp",
    ].includes(cmd) ||
    (cmd === "getent" && done.length > 1) ||
    (cmd === "groupmod" &&
      done.length > 1 &&
      !/^-[np]$/.test(done[done.length - 1]))
  )
    opts = [...(WORDS[cmd] || []), ...G];
  else if (
    cmd === "groupadd" ||
    (cmd === "groupmod" && done[done.length - 1] === "-p")
  )
    opts = ["-p", ...GROUP_PERMS, "slow30"];
  else if (WORDS[cmd] && !(FILE_CMDS.includes(cmd) && done.length > 1))
    opts = WORDS[cmd];
  if (
    (FILE_CMDS.includes(cmd) && !opts.length) ||
    last.includes("/") ||
    (cmd === "ls" && last && !last.startsWith("-"))
  ) {
    const slash = last.lastIndexOf("/"),
      dirPart = last.slice(0, slash + 1),
      base = dirPart ? findPath(dirPart.replace(/\/$/, "") || "/") : fs.cwd;
    try {
      opts = [
        ...opts,
        ...(kind(base) === "dir" ? list(base).map((n) => dirPart + n) : []),
      ];
    } catch {
      /* not yours */
    }
  }
  const p = last.toLowerCase();
  return [...new Set(opts)]
    .filter((o) => o.toLowerCase().startsWith(p) && o.toLowerCase() !== p)
    .slice(0, 30)
    .map(put);
}
