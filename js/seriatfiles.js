/* ---------- the Seriat files: the folder kept on this device, home/ and the files other players share ----------
   What the Seriat window (seriatwin.js), a spawn's Brain box (sbseriat.js) and the Brain builder (brainbuild.js) read and
   write: notes/seriat/ in /usr/<me>, kept on this device from game to game, and home/<name> for each player's. It was the
   command line's (shellfs.js and shell.js numerat); we cut the command line on Nov 27 and kept only this. */
import { profile, save } from "./store.js";
import { activeRoom } from "./net.js";
import { isSb, sbMay, sbSettingsText, sbSettingsRead } from "./sandboxrules.js";
import { HELP, EXAMPLES } from "./seriathelp.js";
import { LANG, LANG_DIR } from "./langname.js";
import { compileScript, brain, paramsOf } from "./seriatrun.js";
import {
  nbBy,
  nbRights,
  nbGiven,
  canHomes,
  nbCopy,
  nbCopies,
  nbOut,
  NBS_FILES,
  NBS_TEXT,
} from "./nbperms.js";

const tag = (n) => String(n || "").replace(/\s+/g, "");
const fail = (msg, code = 1) => {
  throw Object.assign(new Error(msg), { code });
};
/* who I am and the room I'm in: what every numerat call takes */
export function filesCtx() {
  const r = activeRoom(),
    s = r && r.state,
    me = s && s.players[r.me];
  return { room: r, meName: tag(me ? me.name : profile.name) };
}

/* ---------- the files ---------- */
const fs = {
  game: "",
  files: {},
  dirs: new Set(),
  meta: {},
};
/* ---------- the Seriat folder (the owner's Sandbox file: "The spawns, loot, respawns, or board buid SHOULD automatically
   save the numerat files to a directory in the default pwd that can be organized in any game mode in terminial by a
   player where they can make directories, copy files, etc.") ----------
   It lives in notes like any folder while a game lasts; after each command (and each change in the Seriat window) what
   is in it is kept on this device, profile.numerat = { f: { path in it: text }, d: [its folders], x: [its +x files] },
   and it comes back at the start of every game. 100,000 characters in all, as perma-notes */
const NUM_MOST = 100000;
const numRoot = () => fs.home + "/notes/" + LANG_DIR; // (the language is Seriat: the owner, Nov 19 16:42Z; its name is langname.js')
const inNum = (path) => path.startsWith(numRoot() + "/");
/* the help/ folder in it: Seriat's read-only help files (seriathelp.js), made again at the start of every game, never
   kept in the profile, and refused every change, copy and delete (the owner's, Nov 19 12:59Z) */
const helpRoot = () => numRoot() + "/help";
const inHelp = (path) =>
  (path === helpRoot() || path.startsWith(helpRoot() + "/")) && !inEx(path);
/* help/examples/: ready brain files, read-only too (not changed or deleted), but they CAN be copied: that's what they're
   for (the owner's drawing, Nov 19 16:12Z: the .num files have their own folder inside help/) */
const exRoot = () => helpRoot() + "/examples";
const inEx = (path) => path === exRoot() || path.startsWith(exRoot() + "/");
const inRo = (path) => inHelp(path) || inEx(path);
const NO_HELP = (path) =>
  inEx(path)
    ? `✗ ${path}: Permission denied (the example files are read-only: copy one with cp, then change the copy).`
    : `✗ ${path}: Permission denied (the help files are read-only: they can't be changed, copied or deleted).`;
/* settings/limits (plan Phase 6, sandboxrules.js sbSettingsText): in Sandbox, the room's settings that no menu shows, as
   "name = value" lines. Never kept on the device (it's the room's); its write starts off each game (read-only by
   default); written, its lines go to the room (whoever may change Sandbox: sbRulesAct), and it shows the room's again */
const setRoot = () => numRoot() + "/settings";
const inSet = (path) => path === setRoot() || path.startsWith(setRoot() + "/");
let setMade = ""; // (the text I last put in it from the room)
function setSync() {
  const s = roomS(),
    f = setRoot() + "/limits";
  if (!fs.home) return;
  if (!s || !isSb(s)) {
    if (fs.dirs.has(setRoot())) {
      delete fs.files[f];
      delete fs.meta[f];
      fs.dirs.delete(setRoot());
    }
    return;
  }
  fs.dirs.add(setRoot());
  const now = sbSettingsText(s),
    cur = fs.files[f];
  if (cur === undefined) {
    fs.files[f] = setMade = now;
    fs.meta[f] = { nw: true, t: 0 };
    return;
  }
  if (cur !== setMade) {
    if (fs.room && fs.room.send)
      for (const [k, v] of sbSettingsRead(cur))
        fs.room.send({ t: "sbr", k, v });
    setMade = cur; // (the room's answer shows next time: the same text if it took it)
    return;
  }
  if (now !== setMade) fs.files[f] = setMade = now;
}
function numLoad() {
  const N = profile.numerat || {},
    root = numRoot();
  fs.dirs.add(root);
  for (const d of N.d || []) fs.dirs.add(root + "/" + d);
  for (const [f, t] of Object.entries(N.f || {})) fs.files[root + "/" + f] = t;
  for (const f of N.x || [])
    fs.meta[root + "/" + f] = { ...(fs.meta[root + "/" + f] || {}), x: true };
  for (const [k, l] of [
    ["nr", N.nr],
    ["nw", N.nw],
  ])
    for (const f of l || [])
      fs.meta[root + "/" + f] = {
        ...(fs.meta[root + "/" + f] || {}),
        [k]: true,
      }; // (my own read and write, turned off: chmod u-r, u-w)
  fs.dirs.add(helpRoot());
  for (const [f, t] of Object.entries(HELP)) {
    const at = helpRoot() + "/" + f,
      dir = at.slice(0, at.lastIndexOf("/")); // (a particular help's own folder: numbers/, math/ …)
    fs.dirs.add(dir);
    fs.meta[dir] = { ro: true, t: 0 };
    fs.files[at] = t;
    fs.meta[at] = { ro: true, t: 0 };
  }
  fs.meta[helpRoot()] = { ro: true, t: 0 };
  fs.dirs.add(exRoot());
  for (const [f, t] of Object.entries(EXAMPLES)) {
    fs.files[exRoot() + "/" + f] = t;
    fs.meta[exRoot() + "/" + f] = { ro: true, t: 0 };
  }
  fs.meta[exRoot()] = { ro: true, t: 0 };
}
function numKeep() {
  setSync();
  const root = numRoot(),
    rel = (p) => p.slice(root.length + 1),
    f = {},
    x = [],
    nr = [],
    nw = [];
  for (const [p, t] of Object.entries(fs.files))
    if (inNum(p) && !inRo(p) && !inSet(p)) {
      f[rel(p)] = t;
      const m = fs.meta[p] || {};
      if (m.x) x.push(rel(p));
      if (m.nr) nr.push(rel(p));
      if (m.nw) nw.push(rel(p));
    }
  const next = {
    f,
    d: [...fs.dirs]
      .filter((d) => inNum(d) && !inRo(d) && !inSet(d))
      .map(rel)
      .sort(),
    x,
    ...(nr.length ? { nr } : {}),
    ...(nw.length ? { nw } : {}),
  };
  shareNames();
  shareCopies();
  if (JSON.stringify(next) === JSON.stringify(profile.numerat || {})) return;
  profile.numerat = next;
  save();
}
/* every folder and file inside folder p (not the game's read-only ones), folders first */
function below(p) {
  const pre = p + "/";
  return [
    ...[...fs.dirs].filter((d) => d.startsWith(pre) && !inRo(d)).sort(),
    ...Object.keys(fs.files)
      .filter((f) => f.startsWith(pre) && !inRo(f))
      .sort(),
  ];
}
/* ---------- home/ (the owner's, Nov 19 16:12Z): /home/<name> is each player's Seriat folder; mine is the same folder as
   ~/notes/seriat. Another player's shows the names they have (nbperms.js) to whoever has canhomes, and to whoever they
   gave a right in it ---------- */
const HOME = "/home";
const meHome = () => HOME + "/" + fs.me;
const unHome = (p) =>
  p === meHome() || p.startsWith(meHome() + "/")
    ? numRoot() + p.slice(meHome().length)
    : p;
const roomS = () => (fs.room && fs.room.state) || null;
const idOf = (name) => {
  const s = roomS();
  return s
    ? s.seat.find((id) => s.players[id] && tag(s.players[id].name) === name)
    : null;
};
/* /home/<someone else>/…: { id, name, rel } */
function theirs(path) {
  const m = path.match(/^\/home\/([^/]+)(?:\/(.+))?$/);
  if (!m || m[1] === fs.me) return null;
  const id = idOf(m[1]);
  return id ? { id, name: m[1], rel: m[2] || "" } : null;
}
/* the names in their folder I may see: all of them with canhomes, else only what they gave me a right on */
function theirNames(t) {
  const s = roomS(),
    n = nbBy(s, t.id).n || [];
  if (canHomes(s, fs.meId)) return n;
  const ok = n.filter(
    (x) => nbRights(s, t.id, x.replace(/\/$/, ""), fs.meId) !== "---",
  );
  return [
    ...new Set(
      ok.flatMap((x) => {
        const parts = x.replace(/\/$/, "").split("/");
        return parts.map(
          (_, i) =>
            parts.slice(0, i + 1).join("/") +
            (i < parts.length - 1 || x.endsWith("/") ? "/" : ""),
        );
      }),
    ),
  ];
}
/* my folder's names, told to the room once they change (in Sandbox only) */
let namesSent = "";
function shareNames() {
  const s = roomS();
  if (!s || !isSb(s) || !fs.room.send || !fs.me) return;
  const root = numRoot(),
    names = [
      ...Object.keys(fs.files).filter((p) => inNum(p) && !inRo(p)),
      ...[...fs.dirs].filter((d) => inNum(d) && !inRo(d)).map((d) => d + "/"),
    ]
      .map((p) => p.slice(root.length + 1))
      .sort()
      .slice(0, 300);
  const k = s.startedAt + ":" + names.join("|");
  if (k === namesSent) return;
  namesSent = k;
  fs.room.send({ t: "nbn", names });
}
/* my shared copies (nbperms.js): what someone else may read or run goes to the room, and what someone with w wrote
   there comes into my own files first */
let copiesSent = "",
  copiesAt = 0;
const applied = {}; // (path -> the write I saved last, this Sandbox)
function takeWrites() {
  const s = roomS();
  if (!s || !isSb(s) || !fs.meId) return false;
  const root = numRoot();
  let got = false;
  for (const [rel, c] of Object.entries(nbCopies(s, fs.meId))) {
    const k = s.startedAt + ":" + rel;
    if (c.w === fs.meId || c.n <= (applied[k] || 0)) continue;
    applied[k] = c.n;
    const path = root + "/" + rel,
      dir = path.slice(0, path.lastIndexOf("/"));
    if (dir !== root && !fs.dirs.has(dir)) continue; // (its folder is gone)
    fs.files[path] = String(c.t);
    got = true;
  }
  return got;
}
function shareCopies() {
  const s = roomS();
  if (!s || !isSb(s) || !fs.room.send || !fs.meId) return;
  const root = numRoot(),
    files = {};
  for (const [p, t] of Object.entries(fs.files)) {
    if (!inNum(p) || inRo(p) || Object.keys(files).length >= NBS_FILES)
      continue;
    const rel = p.slice(root.length + 1);
    if (nbOut(s, fs.meId, rel)) files[rel] = t.slice(0, NBS_TEXT);
  }
  const have = nbCopies(s, fs.meId),
    same =
      Object.keys(have).length === Object.keys(files).length &&
      Object.entries(files).every(
        ([rel, t]) => have[rel] && have[rel].w === fs.meId && have[rel].t === t,
      );
  if (same) return;
  const k = s.startedAt + ":" + JSON.stringify(files);
  if (k === copiesSent && Date.now() - copiesAt < 10000) return; // (sent: on its way)
  copiesSent = k;
  copiesAt = Date.now();
  const seen = {};
  for (const rel of Object.keys(have))
    seen[rel] = applied[s.startedAt + ":" + rel] || 0;
  fs.room.send({ t: "nbs", files, seen });
}
/* the Seriat files running (a stub until the language comes: each only waits to be stopped), for this game */
let procs = [];
const pids = { next: 100 };
function sync(ctx) {
  const s = ctx.room && ctx.room.state,
    me = ctx.meName,
    home = `/usr/${me}`;
  const game = s ? `${s.id}:${s.startedAt || 0}` : "none";
  if (fs.game !== game) {
    fs.game = game;
    fs.files = {};
    fs.dirs = new Set();
    fs.meta = {};
    procs = [];
    fs.numAt = "";
  } // (what is made lasts one game; the Seriat folder comes back from the device: numLoad)
  fs.home = home;
  fs.me = me;
  fs.room = ctx.room || null;
  fs.meId = ctx.room ? ctx.room.me : null;
  if (fs.numAt !== home) {
    fs.numAt = home;
    numLoad();
  }
  fs.people = s ? s.seat.map((id) => tag(s.players[id].name)) : [me];
  setSync();
}
const norm = (p) => {
  const out = [];
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return "/" + out.join("/");
};
const unHomeN = (p) => unHome(norm(p)); // (/home/<me>/… is ~/notes/seriat/…)
/* what a path is: a folder, a file, or nothing */
function kind(path) {
  const h = fs.home,
    parts = path.split("/").filter(Boolean);
  if (["/", "/usr", HOME].includes(path)) return "dir";
  const t = theirs(path);
  if (t) {
    if (!t.rel) return "dir";
    const n = theirNames(t);
    return n.includes(t.rel)
      ? "file"
      : n.includes(t.rel + "/") || n.some((x) => x.startsWith(t.rel + "/"))
        ? "dir"
        : null;
  }
  if (parts[0] !== "usr" || !parts[1]) return null;
  if (!fs.people.includes(parts[1]) && path.slice(0, h.length) !== h)
    return null;
  if (parts.length === 2) return "dir";
  if (parts.length === 3 && parts[2] === "notes") return "dir";
  if (path.startsWith(h + "/"))
    return fs.files[path] !== undefined
      ? "file"
      : fs.dirs.has(path)
        ? "dir"
        : null;
  return null;
}
function guard(path, write, into) {
  if (write && inRo(path)) fail(NO_HELP(path));
  const t = theirs(path);
  if (t) {
    const s = roomS(),
      r = t.rel ? nbRights(s, t.id, t.rel, fs.meId) : "---";
    if (
      !canHomes(s, fs.meId) &&
      ((!kind(path) && !(write && into && r.includes("w"))) || // (a new file where I may write)
        (!t.rel && !theirNames(t).length))
    )
      fail(
        `✗ ${path}: Permission denied (looking in other players' folders takes canhomes, or a right ${t.name} gives you)`,
      );
    if (write && !r.includes("w"))
      fail(`✗ ${path}: Permission denied (${t.name} hasn't given you w on it)`);
    if (write && !into)
      fail(
        `✗ ${path}: it is on ${t.name}'s device: only its words can be written (in the n window)`,
      );
    return;
  }
  const parts = path.split("/").filter(Boolean),
    h = fs.home;
  if (
    parts[0] === "usr" &&
    parts[1] &&
    path.slice(0, h.length + 1) !== h + "/" &&
    path !== h
  ) {
    if (!fs.people.includes(parts[1]))
      fail(
        write
          ? `✗ ${path}: Permission denied (you can write in ${h}/notes).`
          : `✗ ${path}: No such file or directory`,
      );
    fail(`✗ ${path}: Permission denied (that is on ${parts[1]}'s own device).`);
  }
  if (write && !path.startsWith(h + "/notes/"))
    fail(`✗ ${path}: Permission denied (you can write in ${h}/notes).`);
}
function readFile(p) {
  const path = unHomeN(p),
    k = kind(path);
  guard(path, false);
  if (!k) fail(`✗ ${p}: No such file or directory`);
  if (k === "dir") fail(`✗ ${p}: Is a directory`);
  const t = theirs(path);
  if (t) {
    if (!nbRights(roomS(), t.id, t.rel, fs.meId).includes("r"))
      fail(`✗ ${p}: Permission denied (${t.name} hasn't given you r on it)`);
    return theirText(t);
  }
  if ((fs.meta[path] || {}).nr)
    fail(`✗ ${p}: Permission denied (its read is off: Permissions)`);
  return fs.files[path];
}
/* another player's file I may read or run: its copy in the room (nbperms.js), put there by their device */
function theirText(t) {
  const c = nbCopy(roomS(), t.id, t.rel);
  if (!c)
    fail(
      `✗ ${t.rel}: ${t.name}'s copy isn't here yet (it comes a few seconds after a right is given, while ${t.name} is in the room)`,
    );
  return c.t;
}
/* writing another player's file they gave me w on: through the room, and their device saves it into their own file.
   > empties the file first and >> then adds what came out, faster than the room answers: so what I sent last (these
   10 seconds) is what >> adds to */
const sentTheirs = new Map(); // (id/path -> { text, at })
function writeTheirs(t, p, text, append) {
  if (!t.rel || kind(unHomeN(p)) === "dir") fail(`✗ ${p}: Is a directory`);
  const name = t.rel.split("/").pop(),
    up = t.rel.includes("/") ? t.rel.slice(0, t.rel.lastIndexOf("/")) : "";
  if (!/^[\w.-]{1,40}$/.test(name))
    fail(
      `✗ ${name}: a file name is letters, numbers, ., - and _ (40 at most).`,
    );
  if (up && kind(`${HOME}/${t.name}/${up}`) !== "dir")
    fail(`✗ ${p}: No such file or directory`);
  const k = t.id + "/" + t.rel,
    was = sentTheirs.get(k),
    all =
      (append
        ? was && Date.now() - was.at < 10000
          ? was.text
          : theirText(t)
        : "") + text;
  if (all.length > NBS_TEXT)
    fail(
      `✗ ${p}: ${NBS_TEXT.toLocaleString("en-US")} letters at most in another player's file.`,
    );
  if (
    !kind(unHomeN(p)) &&
    Object.keys(nbCopies(roomS(), t.id)).length >= NBS_FILES
  )
    fail(`✗ ${p}: ${t.name} has ${NBS_FILES} files shared already.`);
  const c = nbCopy(roomS(), t.id, t.rel);
  if ((was && Date.now() - was.at < 10000 ? was.text : c && c.t) === all && c)
    return; // (nothing changed: a write would only undo what they changed since)
  sentTheirs.set(k, { text: all, at: Date.now() });
  fs.room.send({ t: "nbw", owner: t.id, path: t.rel, text: all });
}
function writeFile(p, text, append) {
  const path = unHomeN(p);
  guard(path, true, true);
  const t = theirs(path);
  if (t) return writeTheirs(t, p, text, append);
  if (kind(path) === "dir") fail(`✗ ${p}: Is a directory`);
  if (fs.files[path] !== undefined && (fs.meta[path] || {}).nw)
    fail(`✗ ${p}: Permission denied (its write is off: Permissions)`);
  const parent = path.slice(0, path.lastIndexOf("/"));
  if (kind(parent) !== "dir") fail(`✗ ${p}: No such file or directory`);
  const name = path.split("/").pop();
  if (!/^[\w.-]{1,40}$/.test(name))
    fail(
      `✗ ${name}: a file name is letters, numbers, ., - and _ (40 at most).`,
    );
  const total = Object.entries(fs.files).reduce(
    (a, [k, t]) => a + (inRo(k) ? 0 : t.length),
    0,
  );
  if (total + text.length > 200000)
    fail("✗ Your notes are full (200,000 characters this game).");
  if (inNum(path)) {
    const all = Object.entries(fs.files).reduce(
      (a, [k, t]) => a + (inNum(k) && !inRo(k) && k !== path ? t.length : 0),
      0,
    );
    if (
      all +
        (append && fs.files[path] ? fs.files[path].length : 0) +
        text.length >
      NUM_MOST
    )
      fail(
        `✗ ${name}: the ${LANG} folder is full (100,000 characters in all).`,
      );
  }
  fs.meta[path] = { ...(fs.meta[path] || {}), t: Date.now() };
  fs.files[path] = (append && fs.files[path] ? fs.files[path] : "") + text;
}
function list(path) {
  const h = fs.home,
    under = (pre) =>
      [...Object.keys(fs.files), ...fs.dirs]
        .filter(
          (f) =>
            f.startsWith(pre + "/") && !f.slice(pre.length + 1).includes("/"),
        )
        .map((f) => f.slice(pre.length + 1) + (fs.dirs.has(f) ? "/" : ""))
        .sort();
  if (path === "/") return ["home/", "usr/"];
  if (path === HOME) return fs.people.map((n) => n + "/");
  const t = theirs(path);
  if (t) {
    guard(path, false);
    const pre = t.rel ? t.rel + "/" : "";
    return [
      ...new Set(
        theirNames(t)
          .filter((x) => x.startsWith(pre) && x !== pre)
          .map((x) => {
            const rest = x.slice(pre.length),
              i = rest.indexOf("/");
            return i < 0 ? rest : rest.slice(0, i + 1);
          }),
      ),
    ].sort();
  }
  if (path === "/usr") return fs.people.map((n) => n + "/");
  if (path.startsWith(h + "/")) return under(path);
  guard(path, false);
  return ["notes/"];
}

/* ---------- running a Seriat file (a stub: the language comes later) ----------
   Only in Sandbox, and only for whoever may write Seriat there (sandboxrules.js sbCan). Returns what to say; it runs
   until Stop */
function startFile(path, ctx) {
  const s = ctx.room && ctx.room.state,
    t = theirs(path),
    name = t ? `~${t.name}/${t.rel}` : path.slice(fs.home.length + 1);
  if (!s || !isSb(s))
    fail(`✗ ${name}: ${LANG} files only run in Sandbox.`, 126);
  if (!sbMay(s, ctx.room.me, "n"))
    fail(
      `✗ ${name}: only the host, or whoever the host lets, runs ${LANG} files here.`,
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
    `▶ ${name} is running (pid ${pid}).${npc ? " Its when and every parts are for NPCs: write its name in a spawn's Brain box (b)." : ""} Stop stops it.`,
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

/* ---------- the Seriat window (seriatwin.js): its folder ----------
   ctx: filesCtx() */
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
      .sort((a, b) => +fs.dirs.has(b) - +fs.dirs.has(a) || a.localeCompare(b))
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
    const all = deep && kind(path) === "dir" ? [path, ...below(path)] : [path];
    for (const p of all) {
      guard(p, true);
      if (kind(p) !== "file") continue;
      const m = { ...(fs.meta[p] || {}), x: bits.includes("x") };
      if (bits.includes("r")) delete m.nr;
      else m.nr = true;
      if (bits.includes("w")) delete m.nw;
      else m.nw = true;
      fs.meta[p] = m;
    }
    numKeep();
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
    guard(path, true);
    if (kind(path)) fail(`✗ ${path.split("/").pop()}: File exists`);
    if (kind(path.slice(0, path.lastIndexOf("/"))) !== "dir")
      fail(`✗ ${path}: No such file or directory`);
    fs.dirs.add(path);
    fs.meta[path] = { t: Date.now() };
    numKeep();
  },
  ro: (path) => inRo(path),
  /* another file, for use 'name': next to the file using it, then at the folder's top; .se (or the old .num) may be left off */
  use(ctx, from, name) {
    sync(ctx);
    return useText(from, name);
  },
  /* a spawn's Brain box (sbseriat.js): the file it names, from the folder's top, and every file it uses, each kept
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
    return startFile(path, ctx);
  },
  stop(pid) {
    const i = procs.findIndex((p) => p.pid === pid);
    if (i < 0) return "";
    const [p] = procs.splice(i, 1);
    return `■ ${p.name} stopped.`;
  },
};
