/* ---------- Sandbox: the Numerat window (stage 7a, the files without the language) ----------
   The owner's Sandbox file: "clicking “n” will bring up the numerat files you have made ... You can click (new file) OR
   (new directory) at the left (similar to VS code). You can also see a terminal line in the bottom half of this numerat
   window, and you can see the code above the long ractangle of terminal window (like VS code)."
   The files are the command line's own (shell.js numerat: notes/numerat/, kept on this device from game to game), so
   what's made here shows in ls and what's made there shows here. The code saves as it's typed. Run starts the open file
   (a stub until the language comes: it only runs until it's stopped); its terminal line is the command line itself.
   Every letter in it is Cascadia Code, as the command line's.
   The owner's (Nov 19 12:59Z): "the number lines should be able to be seen automatically, and text extends outwards without
   wrap unless text wrap is turned on" (the gutter, Wrap); "auto complete is there by default" (the code's words, the
   terminal's commands); "there should be other options besides run ... such as something to test code without running it"
   (Check); "the help files ... cannot be copied or deleted or changed" (the help/ folder, read-only here too);
   "anything can be done in that terminal as it can be in the terminal in the bottom left" (the command line itself). */
import { esc, openWindow } from "./ui.js";
import { numerat, shellRun, shellSuggest, shellHistory } from "./shell.js";
import { check, WORDS } from "./numerat.js";
import { shellCtx } from "./chat.js";

const NAME_OK = /^[\w.-]{1,40}$/;
let wrapOn = false; // (Wrap: off unless turned on; kept while the page is open)

export function openNumerat() {
  const ctx = shellCtx(),
    root = numerat.root(ctx),
    st = { file: "", dir: root, out: [], busy: false };
  const html = `<h2>Numerat</h2>
  <div class="nm">
    <aside class="nm-side">
      <div class="nm-new"><button type="button" class="btn small ghost" data-new="file">New file</button><button type="button" class="btn small ghost" data-new="dir">New directory</button></div>
      <form class="nm-name" hidden><input class="nm-in" maxlength="40" spellcheck="false" autocomplete="off" aria-label="Name"><em class="nm-why"></em></form>
      <ul class="nm-tree" role="tree"></ul>
    </aside>
    <section class="nm-main">
      <div class="nm-bar"><span class="nm-path"></span><label class="nm-wrap"><input type="checkbox" data-wrap> Wrap</label><button type="button" class="btn small ghost" data-check disabled>Check</button><button type="button" class="btn small" data-run disabled>Run</button></div>
      <div class="nm-ed"><pre class="nm-gut" aria-hidden="true"><div>1</div></pre><textarea class="nm-code" wrap="off" spellcheck="false" autocomplete="off" aria-label="Code" placeholder="Pick a file, or make a new one" disabled></textarea><div class="nm-mirror" aria-hidden="true"></div><ul class="nm-ac" role="listbox" hidden></ul></div>
      <div class="nm-term" aria-label="Terminal"><div class="nm-out" aria-live="polite"></div><ul class="nm-sugg" role="listbox" hidden></ul><form class="nm-line"><span class="nm-ps">$</span><input class="nm-in" spellcheck="false" autocomplete="off" aria-label="Command"></form></div>
    </section>
  </div>`;
  return openWindow(html, {
    cls: "nm-win",
    onOpen(w) {
      const $ = (q) => w.querySelector(q),
        code = $(".nm-code"),
        ed = $(".nm-ed"),
        gut = $(".nm-gut"),
        mirror = $(".nm-mirror"),
        ac = $(".nm-ac"),
        rel = (p) => "numerat" + p.slice(root.length);
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
      const paint = () => {
        const items = numerat.tree(ctx);
        $(".nm-tree").innerHTML =
          `<li class="nm-item nm-dir${st.dir === root && !st.file ? " on" : ""}" data-p="${esc(root)}" data-dir style="--d:0">numerat/</li>` +
          items
            .map(
              (it) =>
                `<li class="nm-item${it.ro ? " nm-ro" : ""}${it.dir ? " nm-dir" : ""}${it.path === st.file || (it.dir && it.path === st.dir && !st.file) ? " on" : ""}" data-p="${esc(it.path)}"${it.dir ? " data-dir" : ""} style="--d:${it.depth + 1}">${esc(it.name)}${it.dir ? "/" : ""}</li>`,
            )
            .join("");
        $(".nm-path").textContent = st.file ? rel(st.file) : rel(st.dir) + "/";
        const run = $("[data-run]"),
          ro = !!st.file && numerat.ro(st.file); // (the help files)
        run.disabled = !st.file || ro;
        run.textContent = st.file && numerat.running(st.file) ? "Stop" : "Run";
        $("[data-check]").disabled = !st.file || ro;
        code.disabled = !st.file;
        code.readOnly = ro;
        if (ro) $(".nm-path").textContent += "  (read-only)";
      };
      const open = (path) => {
        const t = numerat.read(ctx, path);
        if (t == null) return;
        st.file = path;
        st.dir = path.slice(0, path.lastIndexOf("/"));
        setText(t);
        paint();
      };
      /* the code saves as it's typed */
      let timer = 0;
      const keep = () => {
        clearTimeout(timer);
        if (!st.file || numerat.ro(st.file)) return;
        try {
          numerat.write(ctx, st.file, code.value);
        } catch (e) {
          say([e.message]);
        }
      };
      /* autocomplete in the code: the words Numerat has (true, false) for what's typed since the last space; Tab takes it */
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
        const it = e.target.closest(".nm-item");
        if (it) {
          keep();
          if (it.hasAttribute("data-dir")) {
            st.dir = it.dataset.p;
            st.file = "";
            setText("");
            paint();
          } else open(it.dataset.p);
          return;
        }
        if (e.target.closest("[data-check]") && st.file) {
          keep();
          const r = check(code.value),
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
        if (numerat.tree(ctx).some((it) => it.path === path))
          return (why.textContent = "That name is taken here");
        try {
          if (making === "dir") {
            numerat.mkdir(ctx, path);
            st.dir = path;
            st.file = "";
            setText("");
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
        if (!numerat.tree(ctx).some((it) => it.path === st.dir)) st.dir = root;
        paint();
      });
      setWrap(wrapOn);
      paint();
    },
  });
}
