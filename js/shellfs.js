/* ---------- the shell's files and what every command leans on ----------
   Moved out of shell.js (the owner's Nov 21 split: shell.js was 3,356 lines), no change to the code but two things (MINE, the /bin list, is filled in by shell.js, and the next pid is one object, `pids`, since two files count it): the files (fs: the
   folders and files of a game, /usr/<you>, perma-notes, the Seriat folder kept on this device), reading and writing
   them, listing, the helpers every command uses (who, needRoom, needSudo, table …). It imports nothing from shell.js. */
import { profile, save } from "./store.js";
import { isSudo, denied } from "./roomrules.js";
import { globRe } from "./bash.js";
import { isSb, sbSettingsText, sbSettingsRead } from "./sandboxrules.js";
import { HELP, EXAMPLES } from "./numerathelp.js";
import { LANG, LANG_DIR } from "./langname.js";
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

/* the commands in /bin (shell.js fills it in once all of them are there; the files code lists it) */
export const MINE = [];
export const tag = (n) => String(n || "").replace(/\s+/g, "");
export const fail = (msg, code = 1) => {
  throw Object.assign(new Error(msg), { code });
};
export const FUN = ["lightning", "love", "kill", "hotdog", "fire"];
export const VERSION = (import.meta.url.match(/[?&]v=(\w+)/) || [])[1] || "dev";
export const clock = (t) => new Date(t).toTimeString().slice(0, 5);
export const wait = (ms, ctx) =>
  new Promise((done) => {
    const t0 = Date.now(),
      k = setInterval(() => {
        if (Date.now() - t0 >= ms || ctx.cancelled()) {
          clearInterval(k);
          done();
        }
      }, 50);
  });

/* ---------- the files ---------- */
export const fs = {
  game: "",
  files: {},
  dirs: new Set(),
  meta: {},
  cwd: "",
  old: "",
  log: [],
  hist: [],
  vars: {},
  code: 0,
};
const perma = () => (profile.permaNotes = profile.permaNotes || {});
/* ---------- the Seriat folder (the owner's Sandbox file: "The spawns, loot, respawns, or board buid SHOULD automatically
   save the numerat files to a directory in the default pwd that can be organized in any game mode in terminial by a
   player where they can make directories, copy files, etc.") ----------
   It lives in notes like any folder while a game lasts; after each command (and each change in the Seriat window) what
   is in it is kept on this device, profile.numerat = { f: { path in it: text }, d: [its folders], x: [its +x files] },
   and it comes back at the start of every game. 100,000 characters in all, as perma-notes */
const NUM_MOST = 100000;
export const numRoot = () => fs.home + "/notes/" + LANG_DIR; // (the language is Seriat: the owner, Nov 19 16:42Z; its name is langname.js')
export const inNum = (path) => path.startsWith(numRoot() + "/");
/* the help/ folder in it: Seriat's read-only help files (numerathelp.js), made again at the start of every game, never
   kept in the profile, and refused every change, copy and delete (the owner's, Nov 19 12:59Z) */
const helpRoot = () => numRoot() + "/help";
export const inHelp = (path) =>
  (path === helpRoot() || path.startsWith(helpRoot() + "/")) && !inEx(path);
/* help/examples/: ready brain files, read-only too (not changed or deleted), but they CAN be copied: that's what they're
   for (the owner's drawing, Nov 19 16:12Z: the .num files have their own folder inside help/) */
const exRoot = () => helpRoot() + "/examples";
const inEx = (path) => path === exRoot() || path.startsWith(exRoot() + "/");
export const inRo = (path) => inHelp(path) || inEx(path);
export const NO_HELP = (path) =>
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
export function numKeep() {
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
export function below(p) {
  const pre = p + "/";
  return [
    ...[...fs.dirs].filter((d) => d.startsWith(pre) && !inRo(d)).sort(),
    ...Object.keys(fs.files)
      .filter((f) => f.startsWith(pre) && !inRo(f))
      .sort(),
  ];
}
/* a class's rights on a Seriat path, changed by chmod (only the bits it names): null outside Sandbox */
export function give(p, who, ch) {
  if (!Object.keys(ch).length) return false;
  const s = roomS();
  if (!s || !isSb(s) || !fs.room.send) return null;
  const rel = p === numRoot() ? "" : p.slice(numRoot().length + 1),
    cur = (nbGiven(s, fs.meId, rel).find(([w]) => w === who) || [, ""])[1],
    bits = "rwx"
      .split("")
      .filter((b) => (b in ch ? ch[b] : cur.includes(b)))
      .join("");
  if (bits !== cur) fs.room.send({ t: "nbp", path: rel, who, bits });
  return true;
}
/* ---------- home/ (the owner's, Nov 19 16:12Z): /home/<name> is each player's Seriat folder; mine is the same folder as
   ~/notes/seriat. Another player's shows the names they have (nbperms.js) to whoever has canhomes, and to whoever they
   gave a right in it ---------- */
export const HOME = "/home";
const meHome = () => HOME + "/" + fs.me;
export const unHome = (p) =>
  p === meHome() || p.startsWith(meHome() + "/")
    ? numRoot() + p.slice(meHome().length)
    : p;
export const roomS = () => (fs.room && fs.room.state) || null;
export const idOf = (name) => {
  const s = roomS();
  return s
    ? s.seat.find((id) => s.players[id] && tag(s.players[id].name) === name)
    : null;
};
export const nameOf = (id) => {
  const s = roomS();
  return s && s.players[id] ? tag(s.players[id].name) : id;
};
/* /home/<someone else>/…: { id, name, rel } */
export function theirs(path) {
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
export function shareNames() {
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
export function takeWrites() {
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
export function shareCopies() {
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
export let procs = [];
export const pids = { next: 100 }; // (the next pid: one object, as shell.js's startFile counts it up too)
export function sync(ctx) {
  const s = ctx.room && ctx.room.state,
    me = ctx.meName,
    home = `/usr/${me}`;
  const game = s ? `${s.id}:${s.startedAt || 0}` : "none";
  if (fs.game !== game) {
    fs.game = game;
    fs.files = {};
    fs.dirs = new Set();
    fs.meta = {};
    fs.log = [];
    fs.vars = {};
    procs = [];
    fs.numAt = "";
  } // notes, the log and variables last one game (the Seriat folder comes back from the device: numLoad)
  if (!fs.cwd || !fs.cwd.startsWith("/")) fs.cwd = home + "/notes";
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
export const norm = (p) => {
  const out = [];
  for (const part of p.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return "/" + out.join("/");
};
export const resolve = (p) =>
  unHomeN(
    p === "~"
      ? fs.home
      : p.startsWith("~/")
        ? fs.home + p.slice(1)
        : p.startsWith("/")
          ? p
          : fs.cwd + "/" + p,
  );
export const unHomeN = (p) => unHome(norm(p)); // (/home/<me>/… is ~/notes/seriat/…)
export const isPerma = (path) => path.startsWith(fs.home + "/perma-notes/");
/* what a path is: a folder, a file, or nothing */
export function kind(path) {
  const h = fs.home,
    parts = path.split("/").filter(Boolean);
  if (["/", "/usr", "/bin", "/dev", HOME].includes(path)) return "dir";
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
  if (path === "/dev/null") return "file";
  if (parts[0] === "bin")
    return MINE.includes(parts[1]) && parts.length === 2 ? "file" : null;
  if (parts[0] !== "usr" || !parts[1]) return null;
  if (!fs.people.includes(parts[1]) && path.slice(0, h.length) !== h)
    return null;
  if (parts.length === 2) return "dir";
  if (path === h + "/log") return "file";
  if (parts.length === 3 && ["notes", "perma-notes"].includes(parts[2]))
    return "dir";
  if (isPerma(path))
    return parts.length === 4 && perma()[parts[3]] !== undefined
      ? "file"
      : null;
  if (path.startsWith(h + "/"))
    return fs.files[path] !== undefined
      ? "file"
      : fs.dirs.has(path)
        ? "dir"
        : null;
  return null;
}
/* a path to read: as given, else counted from /usr (cat player1/notes/file1) */
export const findPath = (p) => {
  const a = resolve(p);
  if (kind(a) || p.startsWith("/")) return a;
  const b = norm("/usr/" + p);
  return kind(b) ? b : a;
};
export function guard(path, write, into) {
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
        `✗ ${path}: it is on ${t.name}'s device: only its words can be written (echo … > ${path.split("/").pop()}, or the n window)`,
      );
    return;
  }
  const parts = path.split("/").filter(Boolean),
    h = fs.home;
  if (parts[0] === "bin")
    fail(
      `✗ ${path}: Permission denied (no one can open the commands, not even the host).`,
    );
  if (
    parts[0] === "usr" &&
    parts[1] &&
    path.slice(0, h.length + 1) !== h + "/" &&
    path !== h
  ) {
    if (!fs.people.includes(parts[1]))
      fail(
        write
          ? `✗ ${path}: Permission denied (you can write in ${h}/notes and ${h}/perma-notes).`
          : `✗ ${path}: No such file or directory`,
      );
    if (parts[2] === "perma-notes")
      fail(
        `✗ ${path}: Permission denied (only superuser-${parts[1]} can open it).`,
      );
    fail(`✗ ${path}: Permission denied (that is on ${parts[1]}'s own device).`);
  }
  if (write && path === h + "/log")
    fail("✗ log: Permission denied (the log is read-only).");
  if (
    write &&
    !path.startsWith(h + "/notes/") &&
    !isPerma(path) &&
    path !== "/dev/null"
  )
    fail(
      `✗ ${path}: Permission denied (you can write in ${h}/notes and ${h}/perma-notes).`,
    );
}
export function readFile(p) {
  if (p === "/dev/null" || p === "-") return "";
  const path = findPath(p),
    k = kind(path);
  guard(path, false);
  if (!k) fail(`✗ ${p}: No such file or directory`);
  if (k === "dir") fail(`✗ ${p}: Is a directory`);
  if (path === fs.home + "/log")
    return fs.log.join("\n") + (fs.log.length ? "\n" : "");
  if (isPerma(path)) return perma()[path.split("/").pop()];
  const t = theirs(path);
  if (t) {
    if (!nbRights(roomS(), t.id, t.rel, fs.meId).includes("r"))
      fail(`✗ ${p}: Permission denied (${t.name} hasn't given you r on it)`);
    return theirText(t);
  }
  if ((fs.meta[path] || {}).nr)
    fail(
      `✗ ${p}: Permission denied (its read is off: chmod u+r ${path.split("/").pop()})`,
    );
  return fs.files[path];
}
/* another player's file I may read or run: its copy in the room (nbperms.js), put there by their device */
export function theirText(t) {
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
  if (!t.rel || kind(resolve(p)) === "dir") fail(`✗ ${p}: Is a directory`);
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
    !kind(resolve(p)) &&
    Object.keys(nbCopies(roomS(), t.id)).length >= NBS_FILES
  )
    fail(`✗ ${p}: ${t.name} has ${NBS_FILES} files shared already.`);
  const c = nbCopy(roomS(), t.id, t.rel);
  if ((was && Date.now() - was.at < 10000 ? was.text : c && c.t) === all && c)
    return; // (nothing changed: a write would only undo what they changed since)
  sentTheirs.set(k, { text: all, at: Date.now() });
  fs.room.send({ t: "nbw", owner: t.id, path: t.rel, text: all });
}
export function writeFile(p, text, append) {
  if (p === "/dev/null") return;
  const path = resolve(p);
  guard(path, true, true);
  const t = theirs(path);
  if (t) return writeTheirs(t, p, text, append);
  if (kind(path) === "dir") fail(`✗ ${p}: Is a directory`);
  if (fs.files[path] !== undefined && (fs.meta[path] || {}).nw)
    fail(
      `✗ ${p}: Permission denied (its write is off: chmod u+w ${path.split("/").pop()})`,
    );
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
        `✗ ${name}: the ${LANG} folder is full (100,000 characters in all). rm a file there to make room.`,
      );
  }
  fs.meta[path] = { ...(fs.meta[path] || {}), t: Date.now() };
  if (isPerma(path)) {
    // kept on this device: 100,000 characters in all, so the profile still saves
    const P = perma(),
      next = (append && P[name] ? P[name] : "") + text,
      all = Object.entries(P).reduce(
        (a, [k, t]) => a + (k === name ? 0 : t.length),
        0,
      );
    if (all + next.length > 100000)
      fail(
        `✗ ${name}: perma-notes are full (100,000 characters in all, ${Math.max(0, 100000 - all - (next.length - text.length)).toLocaleString("en-US")} left). rm a file there to make room.`,
      );
    P[name] = next;
    save();
    return;
  }
  fs.files[path] = (append && fs.files[path] ? fs.files[path] : "") + text;
}
export function removePath(p) {
  if (isPerma(p)) {
    delete perma()[p.split("/").pop()];
    save();
    return;
  }
  for (const x of Object.keys(fs.files))
    if (x === p || x.startsWith(p + "/")) delete fs.files[x];
  for (const x of [...fs.dirs])
    if (x === p || x.startsWith(p + "/")) fs.dirs.delete(x);
}
export function list(path) {
  const h = fs.home,
    under = (pre) =>
      [...Object.keys(fs.files), ...fs.dirs]
        .filter(
          (f) =>
            f.startsWith(pre + "/") && !f.slice(pre.length + 1).includes("/"),
        )
        .map((f) => f.slice(pre.length + 1) + (fs.dirs.has(f) ? "/" : ""))
        .sort();
  if (path === "/") return ["bin/", "dev/", "home/", "usr/"];
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
  if (path === "/dev") return ["null"];
  if (path === "/usr") return fs.people.map((n) => n + "/");
  if (path === "/bin") return MINE;
  if (path === h) return ["log", "notes/", "perma-notes/"];
  if (path === h + "/perma-notes") return Object.keys(perma()).sort();
  if (path.startsWith(h + "/")) return under(path);
  guard(path, false);
  return ["log", "notes/", "perma-notes/"];
}
/* file names that match a pattern (only the last part of a path may have * ? [ ]) */
export function glob(pat) {
  const k = pat.lastIndexOf("/"),
    dirPart = pat.slice(0, k + 1),
    base = pat.slice(k + 1);
  if (/[*?[]/.test(dirPart)) return [];
  const dir = dirPart ? findPath(dirPart.replace(/\/$/, "") || "/") : fs.cwd;
  try {
    if (kind(dir) !== "dir") return [];
    const re = globRe(base);
    return list(dir)
      .map((n) => n.replace(/\/$/, ""))
      .filter((n) => re.test(n) && (base.startsWith(".") || !n.startsWith(".")))
      .map((n) => dirPart + n);
  } catch {
    return [];
  }
}
export const owner = (path) => path.split("/")[2] || "root";
export const size = (path) => {
  try {
    return kind(path) === "file" ? readFile(path).length : 0;
  } catch {
    return 0;
  }
};
const stamp = (t) =>
  t
    ? new Date(t)
        .toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", "")
    : "     -      ";
export function longRow(path, name) {
  const k = kind(path),
    m = fs.meta[path] || {};
  const fmt = (b) =>
      ["r", "w", "x"].map((c) => (b.includes(c) ? c : "-")).join(""),
    t = theirs(path),
    s = roomS(),
    num = inNum(path) || path === numRoot(),
    rel = path === numRoot() ? "" : path.slice(numRoot().length + 1),
    given = num && !inRo(path) && s && isSb(s) ? nbGiven(s, fs.meId, rel) : [],
    of = (w) => (given.find(([x]) => x === w) || [, ""])[1];
  const perms = path.startsWith("/bin")
    ? "----x--x--x"
    : t
      ? `${k === "dir" ? "d" : "-"}${t.rel ? nbRights(s, t.id, t.rel, fs.meId) : "r-x"}------`
      : path === fs.home + "/log"
        ? "-r--------"
        : k === "dir" && !num
          ? "drwx------"
          : `${k === "dir" ? "d" : "-"}${k === "dir" ? "rwx" : fmt((m.nr ? "" : "r") + (m.nw ? "" : "w") + (m.x ? "x" : ""))}${fmt(of("@g:" + m.grp) || m.gb || (m.g ? "r" : ""))}${fmt(of("@o") || (m.o ? "r" : ""))}${given.some(([w]) => !w.startsWith("@")) ? "+" : ""}`;
  return [
    perms,
    owner(path),
    m.grp || (isPerma(path) ? "superuser-" + owner(path) : owner(path)),
    size(path),
    stamp(m.t),
    name,
  ];
}

/* ---------- helpers for the commands ---------- */
const input = (rest, stdin) =>
  rest.length
    ? rest
        .map((f) => {
          const t = readFile(f);
          return t && !t.endsWith("\n") ? t + "\n" : t;
        })
        .join("")
    : stdin;
/* grep -r: a file, or every file in a folder and the folders in it (yours only) */
function files(p) {
  const path = p === "." ? fs.cwd : findPath(p),
    k = kind(path);
  guard(path, false);
  if (!k) fail(`✗ ${p}: No such file or directory`);
  if (k === "file") return [p];
  const out = [],
    walk = (dir, shown) => {
      for (const n of list(dir)) {
        const b = n.replace(/\/$/, ""),
          sub = `${dir === "/" ? "" : dir}/${b}`,
          sh = shown === "." ? b : `${shown.replace(/\/$/, "")}/${b}`;
        if (
          sub.startsWith("/usr/") &&
          !sub.startsWith(fs.home + "/") &&
          sub !== fs.home
        )
          continue;
        if (sub.startsWith("/bin")) continue;
        if (n.endsWith("/")) walk(sub, sh);
        else out.push(sh);
      }
    };
  walk(path, p);
  return out;
}
export const IO = { read: readFile, write: writeFile, input, files };
export const who = (ctx, names) => {
  const s = ctx.room.state,
    ids = [];
  for (const n of names) {
    const id = s.seat.find(
      (i) =>
        tag(s.players[i].name).toLowerCase() ===
        n.replace(/^\\?@/, "").toLowerCase(),
    );
    if (!id) fail(`✗ No player named ${n.replace(/^\\?@/, "")}.`);
    ids.push(id);
  }
  return ids;
};
export const needRoom = (ctx) => {
  if (!ctx.room) fail("✗ That works in a room.");
  return ctx.room.state;
};
export const noSudo = (ctx) =>
  `✗ ${ctx.meName} is not in the sudoers file. This incident will be reported.`;
/* the host's job: sudo's powers take the word sudo, the host's too (sudo groupadd …); a group given the perm (canskip …)
   runs its command without it; anyone else is told they aren't in sudo */
const needPower = (x, cmd, perm) => {
  const s = needRoom(x.ctx),
    me = x.ctx.room.me;
  if (perm && denied(s, me, perm)) return s;
  if (isSudo(s, me)) {
    if (!x.sudo)
      fail(
        `✗ ${cmd}: Permission denied (put sudo in front: sudo ${((x.meta && x.meta.raw) || "").trim() || cmd + " …"})`,
      );
    return s;
  }
  fail(
    x.sudo
      ? noSudo(x.ctx)
      : `✗ ${cmd}: Permission denied (only sudo${perm ? `, or a group with ${perm},` : ""} can)`,
  );
};
export const needSudo = (x, cmd) => needPower(x, cmd);
export const needMay = (x, perm, what) => needPower(x, what, perm);
/* adduser and deluser: the player and the group, in either order (the @ or the group's name tells them apart) */
export const userGroup = (args, s) => {
  const G = roomGroups(s),
    g =
      args.find((a) => !a.startsWith("@") && G[a.toLowerCase()]) ??
      args.findLast((a) => !a.startsWith("@")),
    at = args.find((a) => a !== g);
  return [at, at === undefined ? undefined : g];
};
/* what is wrong with a new group's name, if anything */
export const groupNameWrong = (n) =>
  n.length > 20
    ? "is too long (20 letters at most)"
    : /^superuser-/i.test(n)
      ? "starts with superuser-, which belongs to each player"
      : !/^[a-z]/i.test(n)
        ? "must start with a letter (a to z)"
        : !/^[a-z0-9_-]+$/i.test(n)
          ? "can only have letters a to z, numbers, - and _"
          : "";
export const pct = (v) => `${Math.round(v * 100)}%`;
export const roomGroups = (s) =>
  s.groups || {
    sudo: { perms: [], members: [] },
    dumbasses: { perms: ["nofun", "slow"], members: [] },
  };
export const pname = (s, id) => tag(s.players[id].name);
/* rows lined up in columns, each as wide as its widest word (the window is narrow, so no wider); right: columns to the right */
export const table = (rows, right = []) => {
  const w = [];
  for (const r of rows)
    r.forEach((c, i) => {
      w[i] = Math.max(w[i] || 0, String(c).length);
    });
  return rows
    .map((r) =>
      r
        .map((c, i) =>
          i === r.length - 1 && !right.includes(i)
            ? String(c)
            : right.includes(i)
              ? String(c).padStart(w[i])
              : String(c).padEnd(w[i]),
        )
        .join("  ")
        .trimEnd(),
    )
    .join("\n");
};
export const left = (ms) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
