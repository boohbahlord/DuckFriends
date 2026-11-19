/* ---------- Sandbox: the Seriat window (stage 7a, the files without the language) ----------
   The owner's Sandbox file: "clicking “n” will bring up the numerat files you have made ... You can click (new file) OR
   (new directory) at the left (similar to VS code). You can also see a terminal line in the bottom half of this numerat
   window, and you can see the code above the long ractangle of terminal window (like VS code)."
   The files are the command line's own (shell.js numerat: notes/seriat/, kept on this device from game to game), so
   what's made here shows in ls and what's made there shows here. The code saves as it's typed. Run starts the open file
   (a stub until the language comes: it only runs until it's stopped); its terminal line is the command line itself.
   Every letter in it is Cascadia Code, as the command line's.
   The owner's (Nov 19 12:59Z): "the number lines should be able to be seen automatically, and text extends outwards without
   wrap unless text wrap is turned on" (the gutter, Wrap); "auto complete is there by default" (the code's words, the
   terminal's commands); "there should be other options besides run ... such as something to test code without running it"
   (Check); "the help files ... cannot be copied or deleted or changed" (the help/ folder, read-only here too);
   "anything can be done in that terminal as it can be in the terminal in the bottom left" (the command line itself).
   Part D (sbnumberat.js): a spawn's Brain box names a file here; what its NPCs print, and its mistakes, show in this
   terminal too, and a file a Brain uses goes to the room again once it's saved with no mistakes.
   The left side is File Explorer (the owner's, Nov 19 16:12Z and 17:15Z): one folder at a time; a folder is clicked
   into, ../ (or Back) clicks out of it, Back and Forward walk where I've been, and the path bar shows where I am and takes
   a Linux path (.., ~/notes/seriat/help, seriat/help/math) or, when nothing is there by that name, searches the
   folder shown for it. Folders never fold open or shut in place. */
import { esc, openWindow } from "./ui.js";
import { sfx } from "./sound.js";
import { numerat, shellRun, shellSuggest, shellHistory } from "./shell.js";
import { check, WORDS } from "./numerat.js";
import { shellCtx } from "./chat.js";
import { activeRoom } from "./net.js";
import { isSb, sbMay } from "./sandboxrules.js";
import { NB_TEXT } from "./sbnumberat.js";
import { boxText } from "./sbspawn.js";
import { LANG } from "./langname.js";

const SEND_MOST = 20; // (files sent with one Brain: 20 of 8,000 letters stay under what one action may carry)
/* a spawn's Brain box: the files it sends to the room, each by the name it's written with; null when there's no such
   file */
export function brainFiles(name) {
  const all = numerat.bundle(shellCtx(), name);
  if (!all) return null;
  return Object.fromEntries(
    Object.entries(all)
      .slice(0, SEND_MOST)
      .map(([n, t]) => [n, t.slice(0, NB_TEXT)]),
  );
}
/* every Brain in this room whose files aren't the room's any more (one was saved since): sent again */
function resendBrains() {
  const R = activeRoom(),
    s = R && R.state;
  if (!s || !isSb(s) || !sbMay(s, R.me, "b")) return;
  const names = new Set(
    Object.values((s.sb && s.sb.pts) || {})
      .filter((p) => p.k === "spawn")
      .map((p) => boxText(p, "brain").trim())
      .filter(Boolean),
  );
  for (const n of names) {
    const files = brainFiles(n);
    if (files && Object.entries(files).some(([k, v]) => (s.nb || {})[k] !== v))
      R.send({ t: "sb", k: "nbf", files });
  }
}

const NAME_OK = /^[\w.-]{1,40}$/;
let wrapOn = false; // (Wrap: off unless turned on; kept while the page is open)

/* the bible's button, top right: its window opens above this one (js/seriatbible.js) */
const $b = (w) =>
  w
    .querySelector("[data-bible]")
    .addEventListener("click", () =>
      import("./seriatbible.js").then((m) => m.openSeriatBible()),
    );

export function openNumerat() {
  const ctx = shellCtx(),
    root = numerat.root(ctx),
    st = { file: "", dir: root, q: "", out: [], busy: false };
  const html = `<h2>${esc(LANG)}</h2><button type="button" class="btn small ghost nm-bible" data-bible>${esc(LANG)} bible</button>
  <div class="nm">
    <aside class="nm-side">
      <div class="nm-nav"><button type="button" class="btn small ghost nm-arrow" data-back aria-label="Back" title="Back">&larr;</button><button type="button" class="btn small ghost nm-arrow" data-fwd aria-label="Forward" title="Forward">&rarr;</button><form class="nm-go"><input class="nm-in nm-addr" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Path or search" placeholder="Path or search"></form></div>
      <div class="nm-new"><button type="button" class="btn small ghost" data-new="file">New file</button><button type="button" class="btn small ghost" data-new="dir">New directory</button></div>
      <form class="nm-name" hidden><input class="nm-in" maxlength="40" spellcheck="false" autocomplete="off" aria-label="Name"><em class="nm-why"></em></form>
      <ul class="nm-tree" role="list"></ul>
    </aside>
    <section class="nm-main">
      <div class="nm-bar"><span class="nm-path"></span><label class="nm-wrap"><input type="checkbox" data-wrap> Wrap</label><button type="button" class="btn small ghost" data-perm disabled>Permissions</button><button type="button" class="btn small ghost" data-check disabled>Check</button><button type="button" class="btn small" data-run disabled>Run</button></div>
      <div class="nm-perm" hidden></div><div class="nm-ed"><pre class="nm-gut" aria-hidden="true"><div>1</div></pre><textarea class="nm-code" wrap="off" spellcheck="false" autocomplete="off" aria-label="Code" placeholder="Pick a file, or make a new one" disabled></textarea><div class="nm-mirror" aria-hidden="true"></div><ul class="nm-ac" role="listbox" hidden></ul></div>
      <div class="nm-term" aria-label="Terminal"><div class="nm-out" aria-live="polite"></div><ul class="nm-sugg" role="listbox" hidden></ul><form class="nm-line"><span class="nm-ps">$</span><input class="nm-in" spellcheck="false" autocomplete="off" aria-label="Command"></form></div>
    </section>
  </div>`;
  return openWindow(html, {
    cls: "nm-win",
    onOpen(w) {
      $b(w);
      const $ = (q) => w.querySelector(q),
        code = $(".nm-code"),
        ed = $(".nm-ed"),
        gut = $(".nm-gut"),
        mirror = $(".nm-mirror"),
        ac = $(".nm-ac"),
        rel = (p) => numerat.rel(p),
        top = numerat.home(), // (home/: everyone's folder; mine is root)
        up = (d) => (d === root ? top : d.slice(0, d.lastIndexOf("/"))),
        addr = $(".nm-addr");
      /* where I've been, for Back and Forward: each { dir, q } (q: a search) */
      const hist = [{ dir: root, q: "" }];
      let hi = 0;
      const say = (ls) => {
        st.out.push(...ls);
        if (st.out.length > 200) st.out.splice(0, st.out.length - 200);
        $(".nm-out").innerHTML = st.out
          .map((l) => `<div>${esc(l)}</div>`)
          .join("");
        $(".nm-out").scrollTop = 1e9;
      };
      /* the line numbers: always there; with Wrap on, each number stands as tall as its line is folded (measured in a hidden
         copy of the text at the code's own width) */
      const gutter = () => {
        const lines = code.value.split("\n");
        let h = [];
        if (wrapOn) {
          mirror.style.width = code.clientWidth + "px";
          mirror.innerHTML = lines
            .map((l) => `<div>${esc(l) || "&#8203;"}</div>`)
            .join("");
          h = [...mirror.children].map((d) => d.offsetHeight);
        }
        gut.innerHTML = lines
          .map(
            (_, i) =>
              `<div${h[i] ? ` style="height:${h[i]}px"` : ""}>${i + 1}</div>`,
          )
          .join("");
        gut.style.paddingBottom = code.offsetHeight - code.clientHeight + "px"; // (the code's scroll bar: both end together)
        gut.scrollTop = code.scrollTop;
      };
      code.addEventListener("scroll", () => (gut.scrollTop = code.scrollTop));
      if (window.ResizeObserver) new ResizeObserver(gutter).observe(code);
      const setWrap = (on) => {
        wrapOn = on;
        code.wrap = on ? "soft" : "off";
        ed.classList.toggle("nm-wrap-on", on);
        $("[data-wrap]").checked = on;
        gutter();
      };
      const setText = (t) => {
        code.value = t;
        hideAc();
        gutter();
      };
      const row = (it, label = it.name) =>
        `<li class="nm-item${it.ro ? " nm-ro" : ""}${it.other ? " nm-other" : ""}${it.dir ? " nm-dir" : ""}${it.path === st.file ? " on" : ""}" data-p="${esc(it.path)}"${it.dir ? " data-dir" : ""}>${esc(label)}${it.dir ? "/" : ""}</li>`;
      const paint = () => {
        const items = st.q
          ? numerat.find(ctx, st.q, st.dir)
          : numerat.list(ctx, st.dir);
        $(".nm-tree").innerHTML =
          (st.q
            ? `<li class="nm-note">Search for “${esc(st.q)}” in ${esc(rel(st.dir))}/</li>`
            : st.dir !== top
              ? row({ path: up(st.dir), dir: true }, "..")
              : "") +
          (items.map((it) => row(it)).join("") ||
            `<li class="nm-note">${st.q ? "Nothing here by that name" : "Empty folder"}</li>`);
        if (document.activeElement !== addr)
          addr.value = st.q || rel(st.dir) + "/";
        $("[data-back]").disabled = hi <= 0;
        $("[data-fwd]").disabled = hi >= hist.length - 1;
        $(".nm-path").textContent = st.file ? rel(st.file) : rel(st.dir) + "/";
        const run = $("[data-run]"),
          mine = !!st.file && !!numerat.perms(ctx, st.file),
          given = st.file ? numerat.theirs(ctx, st.file) : null, // (another player's: the rights they gave me)
          ro =
            !!st.file &&
            (numerat.ro(st.file) || // (the help files)
              (given
                ? !given.includes("w")
                : !mine || // (not in home/)
                  !numerat.perms(ctx, st.file).own.includes("w"))); // (my own, with its write off)
        run.disabled = !st.file || !(mine || (given && given.includes("x")));
        $("[data-perm]").disabled = !numerat.perms(ctx, st.file || st.dir);
        if (!permEl.hidden) permPaint();
        run.textContent = st.file && numerat.running(st.file) ? "Stop" : "Run";
        $("[data-check]").disabled = !st.file || ro;
        code.disabled = !st.file;
        code.readOnly = ro;
        if (ro) $(".nm-path").textContent += "  (read-only)";
      };
      /* a folder (or a search in it) shown: a new step for Back, unless it's Back or Forward itself */
      const go = (dir, q = "", step = true) => {
        st.dir = dir;
        st.q = q;
        if (step && (hist[hi].dir !== dir || hist[hi].q !== q)) {
          hist.splice(hi + 1);
          hist.push({ dir, q });
          if (hist.length > 100) hist.shift();
          hi = hist.length - 1;
        }
        $(".nm-tree").scrollTop = 0;
        paint();
      };
      const walk = (by) => {
        if (hi + by < 0 || hi + by >= hist.length) return;
        hi += by;
        const h = hist[hi];
        go(
          numerat.at(ctx, h.dir, root).kind === "dir" ? h.dir : root,
          h.q,
          false,
        ); // (a folder removed since: the top)
      };
      const open = (path) => {
        let t = null;
        try {
          t = numerat.read(ctx, path);
        } catch (err) {
          say([err.message]); // (another player's file, or one whose read I turned off: why it doesn't open)
          return;
        }
        if (t == null) return;
        st.file = path;
        setText(t);
        paint();
      };
      /* the code saves as it's typed; once it has no mistakes, the Brains that use it get it */
      let timer = 0,
        sendT = 0;
      const keep = () => {
        clearTimeout(timer);
        if (!st.file || numerat.ro(st.file)) return;
        try {
          numerat.write(ctx, st.file, code.value);
        } catch (e) {
          say([e.message]);
          return;
        }
        clearTimeout(sendT);
        sendT = setTimeout(() => {
          if (
            !check(code.value, (n) => numerat.use(ctx, st.file, n)).errs.length
          )
            resendBrains();
        }, 600);
      };
      /* the room's Seriat log (what Brains print, and their mistakes): shown here as it comes */
      let seen = 0,
        lastNbp = null,
        lastNbs = null;
      const logT = setInterval(() => {
        if (!w.isConnected) return clearInterval(logT);
        const R = activeRoom(),
          log = (R && R.state && R.state.nbo) || [];
        const n = (log.at(-1) || {}).n || 0;
        if (n < seen) seen = 0; // (another room)
        const fresh = log.filter((l) => l.n > seen);
        seen = n;
        if (fresh.length) say(fresh.map((l) => "🧠 " + l.t));
        const np = R && R.state && R.state.nbp,
          ns = R && R.state && R.state.nbs;
        if (np !== lastNbp) {
          lastNbp = np;
          paint(); // (names and rights other players gave: home/ and Permissions as they are now)
        }
        if (ns !== lastNbs) {
          lastNbs = ns;
          if (st.file && document.activeElement !== code) {
            let t = null;
            try {
              t = numerat.read(ctx, st.file);
            } catch {
              /* (their copy went: what's shown stays) */
            }
            if (t != null && t !== code.value) setText(t); // (another player's file, or mine that someone wrote)
          }
        }
      }, 500);
      /* autocomplete in the code: the words Seriat has (true, false) for what's typed since the last space; Tab takes it */
      let acList = [];
      const hideAc = () => {
        acList = [];
        ac.hidden = true;
      };
      const showAc = () => {
        const at = code.selectionStart,
          line = code.value.slice(code.value.lastIndexOf("\n", at - 1) + 1, at),
          m = /([A-Za-z]+)$/.exec(line);
        acList =
          m && !code.readOnly && !line.trim().startsWith("#")
            ? WORDS.filter(
                (x) => x.startsWith(m[1].toLowerCase()) && x !== m[1],
              ).map((x) => [x, m[1].length])
            : [];
        ac.hidden = !acList.length;
        ac.innerHTML = acList
          .map(
            ([x], i) =>
              `<li role="option" data-i="${i}" aria-selected="${i === 0}">${esc(x)}</li>`,
          )
          .join("");
      };
      const takeAc = (i = 0) => {
        const [x, had] = acList[i];
        code.setRangeText(
          x.slice(had),
          code.selectionStart,
          code.selectionStart,
          "end",
        );
        hideAc();
        code.dispatchEvent(new Event("input"));
      };
      ac.addEventListener("mousedown", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        e.preventDefault();
        takeAc(+li.dataset.i);
        code.focus();
      });
      code.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(keep, 400);
        gutter();
        showAc();
      });
      code.addEventListener("blur", () => {
        keep();
        setTimeout(hideAc, 120);
      });
      code.addEventListener("click", hideAc);
      code.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && acList.length) {
          e.preventDefault();
          e.stopPropagation(); // (Escape puts the suggestion away, not the window)
          hideAc();
          return;
        }
        if (e.key !== "Tab" || code.readOnly) return;
        e.preventDefault();
        if (acList.length) return takeAc(); // (the suggestion)
        code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end"); // (a tab in the code, as in an editor)
        code.dispatchEvent(new Event("input"));
      });
      $("[data-wrap]").addEventListener("change", (e) =>
        setWrap(e.target.checked),
      );
      /* a new file or directory: its name typed at the top of the list, in the folder picked */
      let making = "";
      const form = $(".nm-name"),
        nameIn = form.querySelector(".nm-in");
      w.addEventListener("click", (e) => {
        const nw = e.target.closest("[data-new]");
        if (nw) {
          making = nw.dataset.new;
          form.hidden = false;
          nameIn.value = "";
          nameIn.placeholder =
            making === "file"
              ? "File name, then Enter"
              : "Directory name, then Enter";
          form.querySelector(".nm-why").textContent = "";
          nameIn.focus();
          return;
        }
        if (e.target.closest("[data-perm]")) {
          permEl.hidden = !permEl.hidden;
          return paint();
        }
        if (e.target.closest("[data-back]")) return walk(-1);
        if (e.target.closest("[data-fwd]")) return walk(1);
        const it = e.target.closest(".nm-item");
        if (it) {
          keep();
          if (it.hasAttribute("data-dir")) go(it.dataset.p);
          else open(it.dataset.p);
          return;
        }
        if (e.target.closest("[data-check]") && st.file) {
          keep();
          const r = check(code.value, (n) => numerat.use(ctx, st.file, n)),
            name = rel(st.file);
          say(
            r.errs.length
              ? [
                  ...r.errs
                    .slice(0, 20)
                    .map((x) => `✗ ${name}, line ${x.line}: ${x.why}`),
                  ...(r.errs.length > 20
                    ? [`… ${r.errs.length - 20} more`]
                    : []),
                  `${r.errs.length} error${r.errs.length === 1 ? "" : "s"} in ${r.n} line${r.n === 1 ? "" : "s"} (nothing was run).`,
                ]
              : [
                  `✓ ${name}: ${r.n} line${r.n === 1 ? "" : "s"} read, no errors (nothing was run).`,
                ],
          );
          return;
        }
        if (e.target.closest("[data-run]") && st.file) {
          keep();
          const on = numerat.running(st.file);
          try {
            say([on ? numerat.stop(on.pid) : numerat.run(ctx, st.file)]);
            sfx[on ? "seStop" : "seRun"](); // (a quiet tick: running, or stopped)
          } catch (err) {
            say([err.message]);
          }
          paint();
        }
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const n = nameIn.value.trim(),
          why = form.querySelector(".nm-why");
        if (!NAME_OK.test(n))
          return (why.textContent =
            "Letters, numbers, ., - and _ (40 at most)");
        const path = st.dir + "/" + n;
        if (numerat.at(ctx, path, root).kind)
          return (why.textContent = "That name is taken here");
        try {
          if (making === "dir") {
            numerat.mkdir(ctx, path);
            go(path);
          } else {
            numerat.write(ctx, path, "");
            st.file = path;
            setText("");
          }
        } catch (err) {
          return (why.textContent = err.message.replace(/^✗ /, ""));
        }
        form.hidden = true;
        paint();
        if (making === "file") code.focus();
      });
      nameIn.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation(); // (Escape puts the name away, not the window)
          form.hidden = true;
        }
      });
      /* Permissions (the owner's, Nov 19 16:12Z): for my open file, or the folder shown when no file is open: my own
         Read, Write and Run (a file's), and what a player picked in the list (or a group, or everyone) may do, until a
         new Sandbox starts */
      const permEl = $(".nm-perm");
      let permWho = "";
      const permAt = () => st.file || st.dir;
      const box = (k, on, attr, off = false) =>
        `<label><input type="checkbox" ${attr}="${k}"${on ? " checked" : ""}${off ? " disabled" : ""}> ${{ r: "Read", w: "Write", x: "Run" }[k]}</label>`;
      function permPaint() {
        const P = numerat.perms(ctx, permAt());
        if (!P) {
          permEl.hidden = true;
          return;
        }
        const whos = [
          ...P.players.map(([id, n]) => [id, n]),
          ...P.groups.map((g) => ["@g:" + g, "Group " + g]),
          ["@o", "Everyone"],
        ];
        if (!whos.some(([w]) => w === permWho)) permWho = (whos[0] || [""])[0];
        const has = (P.given.find(([w]) => w === permWho) || [, ""])[1] || "";
        permEl.innerHTML =
          `<div class="nm-perm-row"><b>${esc(P.rel ? P.rel.split("/").pop() : "home/" + rel(root).split("/")[1])}</b></div>` +
          (P.file
            ? `<div class="nm-perm-row"><span class="nm-perm-who">Me</span>${["r", "w", "x"].map((k) => box(k, P.own.includes(k), "data-own")).join("")}</div>`
            : "") +
          `<div class="nm-perm-row"><select class="nm-in nm-perm-sel" aria-label="Player"${P.sb ? "" : " disabled"}>${whos.map(([w, n]) => `<option value="${esc(w)}"${w === permWho ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>${["r", "w", "x"].map((k) => box(k, has.includes(k), "data-give", !P.sb)).join("")}</div>` +
          `<div class="nm-perm-row nm-perm-list">${
            P.sb
              ? P.given.length
                ? P.given
                    .map(([w, b]) => `${esc(P.label(w))}: ${esc(b)}`)
                    .join(" · ")
                : "Nobody else can read, change or run it."
              : `Rights for other players work in Sandbox.`
          }</div>` +
          `<em class="nm-perm-note">${P.sb ? "Given rights last until a new Sandbox starts." : ""}</em>`;
      }
      permEl.addEventListener("change", (e) => {
        const P = numerat.perms(ctx, permAt());
        if (!P) return;
        if (e.target.matches(".nm-perm-sel")) {
          permWho = e.target.value;
          return permPaint();
        }
        const pick = (attr) =>
          [...permEl.querySelectorAll(`[${attr}]`)]
            .filter((c) => c.checked)
            .map((c) => c.getAttribute(attr))
            .join("");
        try {
          if (e.target.hasAttribute("data-own"))
            numerat.setOwn(ctx, permAt(), pick("data-own"));
          else if (e.target.hasAttribute("data-give"))
            numerat.give(ctx, permAt(), permWho, pick("data-give"));
        } catch (err) {
          say([err.message]);
        }
        setTimeout(paint, 0); // (the room's answer: online it comes a moment later, and the log poll paints again)
      });
      /* the path bar: a Linux path goes there (a file opens, in its folder); anything else is searched for in the folder
         shown */
      $(".nm-go").addEventListener("submit", (e) => {
        e.preventDefault();
        const t = addr.value.trim();
        addr.blur();
        if (!t) return paint();
        const r = numerat.at(ctx, t, st.dir);
        if (r.kind && !r.inside) {
          say([
            `✗ ${t}: only home/ shows here (the terminal below reaches the rest)`,
          ]);
          return paint();
        }
        if (r.kind === "dir") return go(r.path);
        if (r.kind === "file") {
          keep();
          go(r.path.slice(0, r.path.lastIndexOf("/")));
          return open(r.path);
        }
        go(st.dir, t.replace(/^.*\//, "") || t); // (the last part of what was typed)
      });
      addr.addEventListener("focus", () => addr.select());
      addr.addEventListener("blur", () => setTimeout(paint, 0));
      /* the terminal line: the command line itself */
      const line = $(".nm-line"),
        lineIn = line.querySelector(".nm-in"),
        sugg = $(".nm-sugg");
      /* its autocomplete is the command line's own (shell.js shellSuggest): Tab takes the picked one, the arrows pick, and
         with none showing they walk back through what was typed */
      let list = [],
        sel = 0,
        back = -1;
      const drawSugg = () => {
        sugg.hidden = !list.length || document.activeElement !== lineIn;
        sugg.innerHTML = list
          .slice(0, 8)
          .map(
            (x, i) =>
              `<li role="option" data-i="${i}" aria-selected="${i === sel}">${esc(x.label)}</li>`,
          )
          .join("");
      };
      const refresh = () => {
        list = lineIn.value ? shellSuggest(lineIn.value, shellCtx()) : [];
        sel = Math.min(sel, Math.max(0, list.length - 1));
        drawSugg();
      };
      lineIn.addEventListener("input", () => {
        back = -1;
        refresh();
      });
      lineIn.addEventListener("blur", () => setTimeout(drawSugg, 120));
      lineIn.addEventListener("focus", refresh);
      sugg.addEventListener("mousedown", (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        e.preventDefault();
        lineIn.value = list[+li.dataset.i].apply();
        sel = 0;
        refresh();
        lineIn.focus();
      });
      lineIn.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          if (list.length) {
            lineIn.value = list[sel].apply();
            sel = 0;
            refresh();
          }
          return;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          const up = e.key === "ArrowUp",
            n = Math.min(8, list.length);
          if (n) {
            e.preventDefault();
            sel = (sel + (up ? -1 : 1) + n) % n;
            drawSugg();
            return;
          }
          const h = shellHistory();
          if (!h.length) return;
          e.preventDefault();
          back = up ? Math.min(h.length - 1, back + 1) : Math.max(-1, back - 1);
          lineIn.value = back < 0 ? "" : h[h.length - 1 - back];
          return;
        }
        if (e.key === "Escape" && list.length) {
          e.preventDefault();
          e.stopPropagation(); // (Escape puts the suggestions away, not the window)
          list = [];
          drawSugg();
        }
      });
      line.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = lineIn.value.trim();
        if (!text || st.busy) return;
        lineIn.value = "";
        list = [];
        back = -1;
        drawSugg();
        st.busy = true;
        keep();
        say(["$ " + text]);
        try {
          const r = await shellRun(text, shellCtx());
          if (r.cleared) st.out = [];
          say(r.lines);
        } finally {
          st.busy = false;
        }
        if (st.file && numerat.read(ctx, st.file) == null) {
          st.file = ""; // (removed or moved from here)
          setText("");
        } else if (st.file) setText(numerat.read(ctx, st.file));
        if (numerat.at(ctx, st.dir, root).kind !== "dir") go(root);
        else paint();
      });
      setWrap(wrapOn);
      paint();
    },
  });
}
