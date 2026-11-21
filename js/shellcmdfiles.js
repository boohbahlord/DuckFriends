/* the files and folders commands (a pure move out of shell.js: the entries of its CMDS table, run by the same shell) */
import { groupsOf, isSudo } from "./rules.js";
import {
  NO_HELP,
  below,
  fail,
  findPath,
  fs,
  give,
  guard,
  idOf,
  inHelp,
  inNum,
  inRo,
  isPerma,
  kind,
  list,
  longRow,
  nameOf,
  needRoom,
  numKeep,
  numRoot,
  owner,
  readFile,
  removePath,
  resolve,
  roomGroups,
  roomS,
  size,
  table,
  theirs,
  writeFile,
} from "./shellfs.js";
import { globRe } from "./bash.js";
import { getopt, lines } from "./textutils.js";
import { MAN } from "./manual.js";
import { isSb } from "./sandboxrules.js";
import { nbRights, nbGiven } from "./nbperms.js";
import { CMDS } from "./shellcmds.js";

Object.assign(CMDS, {
  pwd: () => fs.cwd,
  cd: (args) => {
    const to =
        args[0] === "-"
          ? fs.old || fs.cwd
          : args[0]
            ? resolve(args[0])
            : fs.home,
      k = kind(to);
    if (k !== "dir")
      fail(
        `✗ cd: ${args[0]}: ${k ? "Not a directory" : "No such file or directory"}`,
      );
    if (
      to.startsWith("/usr/") &&
      to.split("/").length > 3 &&
      !to.startsWith(fs.home)
    )
      guard(to, false);
    fs.old = fs.cwd;
    fs.cwd = to;
    return args[0] === "-" ? to : "";
  },
  ls: (args) => {
    const { o, rest } = getopt(args, "al1R", "ls"),
      paths = rest.length ? rest : ["."],
      out = [];
    const show = (p, label) => {
      const path = p === "." ? fs.cwd : findPath(p),
        k = kind(path);
      if (!k) fail(`✗ ls: cannot access '${p}': No such file or directory`);
      if (k === "file") {
        out.push(o.l ? table([longRow(path, p)], [3]) : p);
        return;
      }
      let names = list(path);
      if (o.a) names = ["./", "../", ...names];
      if (label) out.push(`${label}:`);
      if (o.l) {
        out.push(`total ${names.length}`);
        if (names.length)
          out.push(
            table(
              names.map((n) =>
                longRow(
                  n.startsWith(".")
                    ? path
                    : `${path === "/" ? "" : path}/${n.replace(/\/$/, "")}`,
                  n,
                ),
              ),
              [3],
            ),
          );
      } else out.push(names.join(o[1] ? "\n" : "  "));
      if (o.R)
        for (const n of names.filter(
          (n) => n.endsWith("/") && !n.startsWith("."),
        )) {
          const sub = `${path === "/" ? "" : path}/${n.slice(0, -1)}`;
          try {
            out.push("");
            show(sub, sub);
          } catch {
            /* not yours */
          }
        }
    };
    paths.forEach((p) =>
      show(p, paths.length > 1 || o.R ? (p === "." ? fs.cwd : p) : ""),
    );
    return out.join("\n");
  },
  touch: (args) => {
    if (!args.length) fail("✗ touch: missing file operand");
    for (const a of args) {
      const p = resolve(a);
      if (inRo(p)) fail(NO_HELP(p));
      if (!kind(p)) writeFile(a, "", true);
      else fs.meta[p] = { ...(fs.meta[p] || {}), t: Date.now() };
    }
    return "";
  },
  mkdir: (args) => {
    const { o, rest } = getopt(args, "p", "mkdir");
    if (!rest.length) fail("✗ mkdir: missing operand");
    for (const a of rest) {
      const p = resolve(a);
      guard(p, true);
      if (!p.startsWith(fs.home + "/notes/"))
        fail(`✗ mkdir: ${a}: folders go in your notes.`);
      if (kind(p)) {
        if (o.p) continue;
        fail(`✗ mkdir: cannot create directory '${a}': File exists`);
      }
      const parent = p.slice(0, p.lastIndexOf("/"));
      if (kind(parent) !== "dir") {
        if (!o.p)
          fail(
            `✗ mkdir: cannot create directory '${a}': No such file or directory`,
          );
        let q = fs.home + "/notes";
        for (const part of parent.slice(q.length + 1).split("/")) {
          q += "/" + part;
          if (kind(q) === "file") fail(`✗ mkdir: ${q}: Not a directory`);
          fs.dirs.add(q);
        }
      }
      fs.dirs.add(p);
      fs.meta[p] = { t: Date.now() };
    }
    return "";
  },
  rmdir: (args) => {
    for (const a of args) {
      const p = findPath(a);
      guard(p, true);
      if (kind(p) !== "dir" || !fs.dirs.has(p) || p === numRoot())
        fail(
          `✗ rmdir: ${a}: ${kind(p) ? "that folder stays" : "No such file or directory"}`,
        );
      if (list(p).length)
        fail(`✗ rmdir: failed to remove '${a}': Directory not empty`);
      fs.dirs.delete(p);
    }
    return "";
  },
  rm: (args) => {
    const { o, rest } = getopt(args, "rRfi", "rm");
    if (!rest.length) fail("✗ rm: missing operand");
    for (const a of rest) {
      const p = findPath(a),
        k = kind(p);
      if (
        p === fs.home + "/perma-notes" ||
        p === fs.home + "/notes" ||
        p === numRoot() ||
        p === fs.home
      )
        fail(`✗ rm: ${a}: that folder stays.`);
      if (!k) {
        if (o.f) continue;
        fail(`✗ rm: cannot remove '${a}': No such file or directory`);
      }
      guard(p, true);
      if (k === "dir" && !o.r && !o.R)
        fail(`✗ rm: cannot remove '${a}': Is a directory (rm -r)`);
      removePath(p);
    }
    return "";
  },
  cp: (args) => {
    const { o, rest } = getopt(args, "rRf", "cp");
    if (rest.length < 2) fail("✗ cp: usage: cp from to");
    const dst = rest.pop(),
      dk = kind(resolve(dst));
    if (rest.length > 1 && dk !== "dir")
      fail(`✗ cp: target '${dst}' is not a directory`);
    for (const src of rest) {
      const sp = findPath(src),
        sk = kind(sp);
      guard(sp, false);
      if (!sk) fail(`✗ cp: cannot stat '${src}': No such file or directory`);
      if (inHelp(sp)) fail(NO_HELP(sp)); // (the help files can't be copied)
      const to =
        dk === "dir" ? resolve(dst) + "/" + sp.split("/").pop() : resolve(dst);
      if (sk === "file") {
        writeFile(to, readFile(src), false);
        continue;
      }
      if (!o.r && !o.R)
        fail(`✗ cp: -r not specified; omitting directory '${src}'`);
      CMDS.mkdir(["-p", to]);
      for (const f of Object.keys(fs.files).filter(
        (f) => f.startsWith(sp + "/") && !inHelp(f),
      )) {
        const t = to + f.slice(sp.length);
        CMDS.mkdir(["-p", t.slice(0, t.lastIndexOf("/"))]);
        writeFile(t, fs.files[f], false);
      }
      for (const d of [...fs.dirs].filter(
        (d) => d.startsWith(sp + "/") && !inHelp(d),
      ))
        fs.dirs.add(to + d.slice(sp.length));
    }
    return "";
  },
  mv: (args) => {
    const { rest } = getopt(args, "f", "mv");
    if (rest.length < 2) fail("✗ mv: usage: mv from to");
    const dst = rest.pop(),
      dk = kind(resolve(dst));
    for (const src of rest) {
      const sp = findPath(src);
      guard(sp, true);
      if (
        sp === fs.home + "/log" ||
        sp === fs.home + "/notes" ||
        sp === fs.home + "/perma-notes" ||
        sp === numRoot()
      )
        fail(`✗ mv: ${src}: that stays where it is.`);
      if (!kind(sp))
        fail(`✗ mv: cannot stat '${src}': No such file or directory`);
      const to =
        dk === "dir" ? resolve(dst) + "/" + sp.split("/").pop() : resolve(dst);
      if (to === sp || to.startsWith(sp + "/"))
        fail(`✗ mv: cannot move '${src}' into itself`);
      CMDS.cp(["-r", src, to]);
      fs.meta[to] = { ...(fs.meta[sp] || {}), t: Date.now() };
      removePath(sp);
    }
    return "";
  },
  tree: (args) => {
    const root = args[0] ? findPath(args[0]) : fs.cwd;
    if (kind(root) !== "dir") fail(`✗ tree: ${args[0]}: not a folder`);
    const out = [args[0] || "."];
    let nd = 0,
      nf = 0;
    const walk = (p, pre) => {
      let names;
      try {
        names = list(p);
      } catch {
        return;
      }
      names.forEach((n, i) => {
        const lastOne = i === names.length - 1,
          sub = `${p === "/" ? "" : p}/${n.replace(/\/$/, "")}`;
        out.push(pre + (lastOne ? "└── " : "├── ") + n.replace(/\/$/, ""));
        if (n.endsWith("/")) {
          nd++;
          if (!sub.startsWith("/usr/") || sub.startsWith(fs.home))
            walk(sub, pre + (lastOne ? "    " : "│   "));
        } else nf++;
      });
    };
    walk(root, "");
    return (
      out.join("\n") +
      `\n\n${nd} director${nd === 1 ? "y" : "ies"}, ${nf} file${nf === 1 ? "" : "s"}`
    );
  },
  find: (args) => {
    const start = args[0] && !args[0].startsWith("-") ? args.shift() : ".",
      root = start === "." ? fs.cwd : findPath(start);
    let name = null,
      type = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-name" || args[i] === "-iname") {
        name = globRe(args[++i] || "");
        if (args[i - 1] === "-iname") name = new RegExp(name.source, "i");
      } else if (args[i] === "-type") type = args[++i];
      else fail(`✗ find: unknown predicate '${args[i]}'`);
    }
    if (!kind(root)) fail(`✗ find: '${start}': No such file or directory`);
    const out = [],
      ok = (p, k) =>
        (!name || name.test(p.split("/").pop())) &&
        (!type || (type === "d" ? k === "dir" : k === "file"));
    const walk = (p, shown) => {
      const k = kind(p);
      if (ok(p, k)) out.push(shown);
      if (k !== "dir") return;
      let names;
      try {
        names = list(p);
      } catch {
        return;
      }
      for (const n of names) {
        const b = n.replace(/\/$/, ""),
          sub = `${p === "/" ? "" : p}/${b}`;
        if (
          sub.startsWith("/usr/") &&
          sub.split("/").length > 3 &&
          !sub.startsWith(fs.home)
        )
          continue;
        walk(sub, `${shown === "/" ? "" : shown}/${b}`);
      }
    };
    walk(root, start);
    return out.join("\n");
  },
  stat: (args) => {
    if (!args.length) fail("✗ stat: missing operand");
    return args
      .map((a) => {
        const p = findPath(a),
          k = kind(p);
        if (!k) fail(`✗ stat: cannot stat '${a}': No such file or directory`);
        guard(p, false);
        const m = fs.meta[p] || {},
          l = longRow(p, a);
        return [
          `  File: ${a}`,
          `  Size: ${size(p)}\t${k === "dir" ? "directory" : size(p) ? "regular file" : "regular empty file"}`,
          `Access: (${l[0]})  Owner: ${owner(p)}  Group: ${l[2]}`,
          `Modify: ${m.t ? new Date(m.t).toString().replace(/ \(.*\)$/, "") : "-"}`,
        ].join("\n");
      })
      .join("\n");
  },
  file: (args) =>
    args
      .map((a) => {
        const p = findPath(a),
          k = kind(p);
        if (!k) return `${a}: cannot open (No such file or directory)`;
        if (p.startsWith("/bin/"))
          return `${a}: a DuckFriends command (nobody can open it)`;
        if (k === "dir") return `${a}: directory`;
        guard(p, false);
        const t = readFile(a);
        return `${a}: ${t ? `text, ${lines(t).length} line${lines(t).length === 1 ? "" : "s"}` : "empty"}`;
      })
      .join("\n"),
  /* the modes: u (mine: r, w, x), g (the file's group) and o (everyone). On a Seriat file or folder, g and o are also
     the rights the room's players get, this Sandbox only (nbperms.js); g+r and o+r still let a sent file be opened */
  chmod: (args) => {
    const deep = args[0] === "-R" || args[0] === "--recursive"; // (a whole folder at once: the owner's "recursive" switch, plan Phase 6)
    if (deep) args = args.slice(1);
    const [mode, ...named] = args;
    if (!mode || !named.length) fail(`✗ chmod: usage: ${MAN.chmod}`);
    const files = deep
      ? named.flatMap((f) => {
          const p = findPath(f);
          return kind(p) === "dir" ? [f, ...below(p)] : [f];
        })
      : named;
    const ch = { u: {}, g: {}, o: {} },
      nm = mode.match(/^[0-7]?([0-7])([0-7])([0-7])$/);
    if (nm)
      ["u", "g", "o"].forEach((c, k) => {
        const d = +nm[k + 1];
        ch[c] = { r: !!(d & 4), w: !!(d & 2), x: !!(d & 1) };
      });
    else
      for (const part of mode.split(",")) {
        const m = part.match(/^([ugoa]*)([+-=])([rwx]*)$/);
        if (!m || (!m[3] && m[2] !== "="))
          fail(`✗ chmod: invalid mode: '${mode}'`);
        const who = (m[1] || "a").replace("a", "ugo");
        for (const c of "ugo")
          if (who.includes(c))
            for (const b of "rwx")
              if (m[3].includes(b)) ch[c][b] = m[2] !== "-";
              else if (m[2] === "=") ch[c][b] = false;
      }
    let away = false;
    for (const f of files) {
      const p = findPath(f),
        k = kind(p);
      guard(p, true);
      if (!k) fail(`✗ chmod: cannot access '${f}': No such file`);
      if (isPerma(p))
        fail(
          `✗ chmod: ${f}: perma-notes stay private (only superuser-${owner(p)}).`,
        );
      const num = inNum(p) || p === numRoot();
      if (k === "dir" && !num)
        fail(
          `✗ chmod: ${f}: only files, and the folders in home/${fs.me} (for other players)`,
        );
      if (k === "file") {
        const m = { ...(fs.meta[p] || {}) };
        if ("x" in ch.u) m.x = ch.u.x; // (+x: a Seriat file runs as ./file)
        if ("r" in ch.u) m.nr = !ch.u.r;
        if ("w" in ch.u) m.nw = !ch.u.w;
        if ("r" in ch.g) m.g = ch.g.r;
        const gb = "rwx"
          .split("")
          .filter((b) => (b in ch.g ? ch.g[b] : (m.gb || "").includes(b)))
          .join("");
        if (Object.keys(ch.g).length) m.gb = gb; // (its group's bits, as ls -l shows them; with a group, the room's too)
        if ("r" in ch.o) m.o = ch.o.r;
        if (!m.nr) delete m.nr;
        if (!m.nw) delete m.nw;
        fs.meta[p] = m;
      }
      if (num) {
        const grp = (fs.meta[p] || {}).grp;
        if (
          give(p, "@o", ch.o) === null ||
          (grp && give(p, "@g:" + grp, ch.g) === null)
        )
          away = true;
      }
    }
    numKeep();
    return away && (ch.g.w || ch.g.x || ch.o.w || ch.o.x)
      ? "(Rights for other players work in Sandbox, and a new Sandbox starts with none.)"
      : "";
  },
  /* another player can't be given a file (it stays on its maker's device): chown :group sets its group, as chgrp */
  chown: (args, i, x) => {
    const [spec, ...files] = args;
    if (!spec || !files.length) fail(`✗ chown: usage: ${MAN.chown}`);
    const [u, g] = spec.split(":");
    if (u && u !== fs.me)
      fail(
        `✗ chown: changing ownership of '${files[0]}': Operation not permitted (a file stays with the player who made it, on their device; give ${u} rights with setfacl -m u:${u}:rw ${files[0]})`,
      );
    return g ? CMDS.chgrp([g, ...files], i, x) : "";
  },
  /* one player's rights (and a group's, and everyone's) on my Seriat files and folders, this Sandbox only:
     setfacl -m u:Pat:rw,g:friends:r file, setfacl -x u:Pat file, setfacl -b file (all of them away) */
  setfacl: (args) => {
    let op = "",
      spec = "";
    const files = [];
    for (let k = 0; k < args.length; k++) {
      const a = args[k];
      if (a === "-m" || a === "-x") {
        op = a[1];
        spec = args[++k] || "";
      } else if (a === "-b") op = "b";
      else files.push(a);
    }
    if (!op || !files.length || (op !== "b" && !spec))
      fail(`✗ setfacl: usage: ${MAN.setfacl}`);
    const s = roomS();
    if (!s || !isSb(s))
      fail(
        "✗ setfacl: rights for other players work in Sandbox (and a new Sandbox starts with none)",
      );
    const ents =
      op === "b"
        ? []
        : spec
            .split(",")
            .filter(Boolean)
            .map((e) => {
              const m = e.match(
                /^(u|user|g|group|o|other):([^:]*)(?::([rwx-]*))?$/,
              );
              if (!m || (op === "m" && m[3] === undefined))
                fail(
                  `✗ setfacl: ${e}: write it u:name:rwx, g:group:rwx or o::rwx`,
                );
              const c = m[1][0];
              let who = "@o";
              if (c === "u") {
                if (!m[2] || m[2] === fs.me)
                  fail(`✗ setfacl: ${e}: your own rights are chmod u+rwx`);
                who = idOf(m[2]);
                if (!who)
                  fail(`✗ setfacl: ${m[2]}: no player by that name here`);
              } else if (c === "g") {
                if (!(s.groups || {})[m[2]])
                  fail(`✗ setfacl: ${m[2]}: no such group (groups shows them)`);
                who = "@g:" + m[2];
              }
              return [who, (m[3] || "").replace(/-/g, "")];
            });
    for (const f of files) {
      const p = findPath(f);
      guard(p, true);
      if (!kind(p)) fail(`✗ setfacl: ${f}: No such file or directory`);
      if (!inNum(p) && p !== numRoot())
        fail(`✗ setfacl: ${f}: only your files and folders in home/${fs.me}`);
      const rel = p === numRoot() ? "" : p.slice(numRoot().length + 1);
      const list =
        op === "b"
          ? nbGiven(s, fs.meId, rel).map(([w]) => [w, ""])
          : ents.map(([w, b]) => [w, op === "x" ? "" : b]);
      for (const [who, bits] of list)
        fs.room.send({
          t: "nbp",
          path: rel,
          who,
          bits: "rwx"
            .split("")
            .filter((c) => bits.includes(c))
            .join(""),
        });
    }
    return "";
  },
  /* who may do what with a file or folder: its owner, mine, its group, the players and everyone */
  getfacl: (args) =>
    args
      .map((f) => {
        const p = findPath(f),
          k = kind(p);
        guard(p, false);
        if (!k) fail(`✗ getfacl: ${f}: No such file or directory`);
        const s = roomS(),
          t = theirs(p);
        if (t)
          return [
            `# file: home/${t.name}/${t.rel}`,
            `# owner: ${t.name}`,
            `your rights: ${nbRights(s, t.id, t.rel, fs.meId)}`,
          ].join("\n");
        const m = fs.meta[p] || {},
          num = inNum(p) || p === numRoot(),
          rel = p === numRoot() ? "" : p.slice(numRoot().length + 1),
          given = num && s && isSb(s) ? nbGiven(s, fs.meId, rel) : [],
          fmt = (b) =>
            ["r", "w", "x"].map((c) => (b.includes(c) ? c : "-")).join(""),
          of = (w) => (given.find(([x]) => x === w) || [, ""])[1];
        return [
          `# file: ${num ? `home/${fs.me}${rel ? "/" + rel : ""}` : f}`,
          `# owner: ${fs.me}`,
          `# group: ${m.grp || fs.me}`,
          `user::${k === "dir" ? "rwx" : fmt((m.nr ? "" : "r") + (m.nw ? "" : "w") + (m.x ? "x" : ""))}`,
          ...given
            .filter(([w]) => !w.startsWith("@"))
            .map(([w, b]) => `user:${nameOf(w)}:${fmt(b)}`),
          ...given
            .filter(([w]) => w.startsWith("@g:"))
            .map(([w, b]) => `group:${w.slice(3)}:${fmt(b)}`),
          `other::${fmt(of("@o") || (m.o ? "r" : ""))}`,
        ].join("\n");
      })
      .join("\n\n"),
  chgrp: (args, i, x) => {
    const [g, ...files] = args,
      s = needRoom(x.ctx),
      me = x.ctx.room.me;
    if (!g || !files.length) fail("✗ chgrp: usage: chgrp group file");
    const G = roomGroups(s);
    if (!G[g.toLowerCase()]) fail(`✗ chgrp: invalid group: '${g}'`);
    if (!isSudo(s, me) && !groupsOf(s, me).includes(g.toLowerCase()))
      fail(
        `✗ chgrp: changing group of '${files[0]}': Operation not permitted (you aren't in ${g})`,
      );
    for (const f of files) {
      const p = findPath(f);
      guard(p, true);
      if (kind(p) !== "file")
        fail(`✗ chgrp: cannot access '${f}': No such file`);
      if (isPerma(p))
        fail(`✗ chgrp: ${f}: perma-notes stay in superuser-${owner(p)}.`);
      fs.meta[p] = { ...(fs.meta[p] || {}), grp: g.toLowerCase() };
    }
    return "";
  },
});
