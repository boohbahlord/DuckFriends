/* ---------- Sandbox: the Numerat window (stage 7a, the files without the language) ----------
   The owner's Sandbox file: "clicking “n” will bring up the numerat files you have made ... You can click (new file) OR
   (new directory) at the left (similar to VS code). You can also see a terminal line in the bottom half of this numerat
   window, and you can see the code above the long ractangle of terminal window (like VS code)."
   The files are the command line's own (shell.js numerat: notes/numerat/, kept on this device from game to game), so
   what's made here shows in ls and what's made there shows here. The code saves as it's typed. Run starts the open file
   (a stub until the language comes: it only runs until it's stopped); its terminal line is the command line itself.
   Every letter in it is Cascadia Code, as the command line's. */
import { esc, openWindow } from "./ui.js";
import { numerat, shellRun } from "./shell.js";
import { shellCtx } from "./chat.js";

const NAME_OK = /^[\w.-]{1,40}$/;

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
      <div class="nm-bar"><span class="nm-path"></span><button type="button" class="btn small" data-run disabled>Run</button></div>
      <textarea class="nm-code" spellcheck="false" autocomplete="off" aria-label="Code" placeholder="Pick a file, or make a new one" disabled></textarea>
      <div class="nm-term" aria-label="Terminal"><div class="nm-out" aria-live="polite"></div><form class="nm-line"><span class="nm-ps">$</span><input class="nm-in" spellcheck="false" autocomplete="off" aria-label="Command"></form></div>
    </section>
  </div>`;
  return openWindow(html, {
    cls: "nm-win",
    onOpen(w) {
      const $ = (q) => w.querySelector(q),
        code = $(".nm-code"),
        rel = (p) => "numerat" + p.slice(root.length);
      const say = (ls) => {
        st.out.push(...ls);
        if (st.out.length > 200) st.out.splice(0, st.out.length - 200);
        $(".nm-out").innerHTML = st.out
          .map((l) => `<div>${esc(l)}</div>`)
          .join("");
        $(".nm-out").scrollTop = 1e9;
      };
      const paint = () => {
        const items = numerat.tree(ctx);
        $(".nm-tree").innerHTML =
          `<li class="nm-item nm-dir${st.dir === root && !st.file ? " on" : ""}" data-p="${esc(root)}" data-dir style="--d:0">numerat/</li>` +
          items
            .map(
              (it) =>
                `<li class="nm-item${it.dir ? " nm-dir" : ""}${it.path === st.file || (it.dir && it.path === st.dir && !st.file) ? " on" : ""}" data-p="${esc(it.path)}"${it.dir ? " data-dir" : ""} style="--d:${it.depth + 1}">${esc(it.name)}${it.dir ? "/" : ""}</li>`,
            )
            .join("");
        $(".nm-path").textContent = st.file ? rel(st.file) : rel(st.dir) + "/";
        const run = $("[data-run]");
        run.disabled = !st.file;
        run.textContent = st.file && numerat.running(st.file) ? "Stop" : "Run";
        code.disabled = !st.file;
      };
      const open = (path) => {
        const t = numerat.read(ctx, path);
        if (t == null) return;
        st.file = path;
        st.dir = path.slice(0, path.lastIndexOf("/"));
        code.value = t;
        paint();
      };
      /* the code saves as it's typed */
      let timer = 0;
      const keep = () => {
        clearTimeout(timer);
        if (!st.file) return;
        try {
          numerat.write(ctx, st.file, code.value);
        } catch (e) {
          say([e.message]);
        }
      };
      code.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(keep, 400);
      });
      code.addEventListener("blur", keep);
      code.addEventListener("keydown", (e) => {
        if (e.key !== "Tab") return;
        e.preventDefault(); // (a tab in the code, as in an editor)
        code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end");
        code.dispatchEvent(new Event("input"));
      });
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
            code.value = "";
            paint();
          } else open(it.dataset.p);
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
            code.value = "";
          } else {
            numerat.write(ctx, path, "");
            st.file = path;
            code.value = "";
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
        lineIn = line.querySelector(".nm-in");
      line.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = lineIn.value.trim();
        if (!text || st.busy) return;
        lineIn.value = "";
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
          code.value = "";
        } else if (st.file) code.value = numerat.read(ctx, st.file);
        if (!numerat.tree(ctx).some((it) => it.path === st.dir)) st.dir = root;
        paint();
      });
      paint();
    },
  });
}
