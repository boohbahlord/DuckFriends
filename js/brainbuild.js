/* ---------- Sandbox: M's Brain builder (the owner's, Nov 19) ----------
   "There should be a feature under M for make an NPC, where at the very top, you can create the brain file, and it
   doesn't take you to the numerat page, but instead, it will take you to a UI version of the brain in which you set it up
   yourself, and it's a brain file ... Any file that's created that isn't specified in location ... automatically goes
   inside a directory for user created number at files." So: a few "When" rows, each with what it does, written out as a
   Seriat file (notes/seriat-bible.md, part 14) in home/<me>/my-files/, ready for a spawn's Brain box (its arrow lists
   them: sbspawnview.js). The file's first line keeps the rows, so the builder can open it again. */
import { esc, openWindow, toast } from "./ui.js";
import { compileScript } from "./numberatrun.js";
import { LANG } from "./langname.js";
import { BRAIN_RULE } from "./gamedefaults.js";

export const MY_FILES = "my-files"; // (the folder, at the top of my Seriat folder)
const HEAD = "# Brain builder: "; // (the first line: the rows, as JSON)
const NAME_OK = /^[\w-]{1,36}$/;

/* what can start a row: [label, Seriat, the number it takes (or null)] */
export const BB_WHEN = {
  spawn: ["It spawns", "when spawn", null],
  hit: ["It's hit", "when hit", null],
  dead: ["It dies", "when dead", null],
  touch: ["It touches a duck", "when touch", null],
  near: [
    "A duck comes near",
    "when near duck",
    { name: "Tiles", min: 4, max: 80, def: 12 }, // (Seriat's distances: four to a duck length)
  ],
  every: [
    "Every few seconds",
    "every",
    { name: "Seconds", min: 0.5, max: 600, def: 3 },
  ],
};
/* what a row can do: [label, the number or words it takes (or null)] */
export const BB_DO = {
  attack: ["Attack", null],
  flee: ["Run away", null],
  go: ["Go to the nearest duck", null],
  say: ["Say", { text: true, def: "hi" }],
  wait: ["Wait (seconds)", { min: 0.1, max: 60, def: 1 }],
  hp: ["Set HP", { min: 1, max: 1000, def: 10 }],
  speed: ["Set speed", { min: 0.1, max: 5, def: 1 }],
  hitbox: ["Set size (%)", { min: 10, max: 152, def: 100 }], // (as a spawn's Size box: SB_BOXES.size)
};

const clamp = (v, b) => {
  const n = v === "" || v == null ? NaN : +v; // (an emptied box: its default)
  if (!Number.isFinite(n)) return b.def;
  return Math.round(Math.min(b.max, Math.max(b.min, n)) * 10) / 10;
};
/* a row's chance in whole percents, 1 to 100: left empty, 100 (every time); 0 or less is 1, never "every time" */
const chanceOf = (v) => {
  const n = v === "" || v == null ? 100 : +v;
  return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(1, n))) : 100;
};
/* words to say: kept as typed (in single quotes, so nothing in them is worked out) */
const words = (t) =>
  String(t ?? "")
    .replace(/['\n\r\\]/g, "")
    .slice(0, 80)
    .trim();

/* one thing done, as Seriat */
function doLine(a) {
  const b = BB_DO[a.k] && BB_DO[a.k][1];
  switch (a.k) {
    case "attack":
    case "flee":
      return a.k;
    case "go":
      return "go nearest duck";
    case "say":
      return `say '${words(a.v) || "hi"}'`;
    case "wait":
      return `wait ${clamp(a.v, b)}`;
    case "hitbox":
      return `((hitbox ${clamp(a.v, b)}%))`;
    case "hp":
    case "speed":
      return `((${a.k} ${clamp(a.v, b)}))`;
    default:
      return "";
  }
}
/* the rows as a Seriat file */
export function bbCode(rows) {
  const keep = rows
    .filter((r) => BB_WHEN[r.on])
    .map((r) => ({
      on: r.on,
      ...(BB_WHEN[r.on][2] ? { n: clamp(r.n, BB_WHEN[r.on][2]) } : {}),
      ch: chanceOf(r.ch),
      acts: (r.acts || [])
        .filter((a) => BB_DO[a.k])
        .map((a) => ({ k: a.k, ...(a.v != null ? { v: a.v } : {}) })),
    }));
  const lines = [HEAD + JSON.stringify(keep)];
  for (const r of keep) {
    const [, start, num] = BB_WHEN[r.on],
      head = num
        ? r.on === "every"
          ? `every ${r.n}s`
          : `${start} ${r.n}`
        : start,
      body = r.acts.map(doLine).filter(Boolean).join("; ");
    if (!body) continue;
    lines.push(
      `${head} { ${r.ch < 100 ? `\\if ${r.ch}%\\ { ${body} }` : body} }`,
    );
  }
  return lines.join("\n") + "\n";
}
/* a file the builder wrote: its rows again (null: not one of the builder's) */
export function bbRows(text) {
  const first = String(text || "").split("\n")[0];
  if (!first.startsWith(HEAD)) return null;
  try {
    const rows = JSON.parse(first.slice(HEAD.length));
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

/* the command line's Seriat folder, loaded when it's wanted (it brings the command line) */
const folder = async () => {
  const [{ numerat }, { shellCtx }] = await Promise.all([
    import("./shell.js"),
    import("./chat.js"),
  ]);
  const c = shellCtx();
  return { numerat, c, dir: numerat.root(c) + "/" + MY_FILES };
};
/* the files in my-files/: [{ name, path }] (the Brain box's arrow and the builder's Open list) */
export async function myFiles() {
  const { numerat, c, dir } = await folder();
  if (numerat.at(c, dir, numerat.root(c)).kind !== "dir") return [];
  try {
    return numerat
      .list(c, dir)
      .filter((it) => !it.dir && /\.(se|num)$/.test(it.name))
      .map((it) => ({
        name: it.name,
        path: MY_FILES + "/" + it.name,
        text: numerat.read(c, it.path),
      }));
  } catch {
    return [];
  }
}

const NEW_ROW = () => ({ on: "spawn", ch: 100, acts: [{ k: "say", v: "hi" }] });

/* the builder's window; done(path) once it saved (path: "my-files/name.se") */
export async function openBrainBuilder(done) {
  const mine = (await myFiles()).filter((f) => bbRows(f.text));
  let rows = [NEW_ROW()];
  const numRow = (label, attr, v, b) =>
    `<label class="brb-num"><span>${esc(label)}</span><input class="sb-box" type="number" ${attr} value="${esc(v)}" min="${b.min}" max="${b.max}" step="0.1"></label>`;
  const rowHTML = (r, i) => {
    const w = BB_WHEN[r.on] || BB_WHEN.spawn,
      n = w[2];
    return `<div class="brb-rule" data-r="${i}">
      <div class="brb-when"><span class="brb-label">When</span><span class="brb-mid"><select class="sb-box" data-on>${Object.entries(
        BB_WHEN,
      )
        .map(
          ([k, [l]]) =>
            `<option value="${k}"${k === r.on ? " selected" : ""}>${esc(l)}</option>`,
        )
        .join(
          "",
        )}</select>${n ? numRow(n.name, "data-n", r.n ?? n.def, n) : ""}${numRow("Chance (%)", "data-ch", r.ch ?? BRAIN_RULE.CHANCE, { min: 1, max: 100 })}</span><button type="button" class="brb-del" data-rdel aria-label="Remove this When">×</button></div>
      ${(r.acts || [])
        .map((a, j) => {
          const b = BB_DO[a.k] && BB_DO[a.k][1];
          return `<div class="brb-do" data-a="${j}"><span class="brb-label">${j ? "then" : "Do"}</span><span class="brb-mid"><select class="sb-box" data-k>${Object.entries(
            BB_DO,
          )
            .map(
              ([k, [l]]) =>
                `<option value="${k}"${k === a.k ? " selected" : ""}>${esc(l)}</option>`,
            )
            .join("")}</select>${
            b
              ? b.text
                ? `<input class="sb-box" data-v maxlength="80" value="${esc(a.v ?? b.def)}" aria-label="Words">`
                : `<input class="sb-box" type="number" data-v value="${esc(a.v ?? b.def)}" min="${b.min}" max="${b.max}" step="0.1" aria-label="Amount">`
              : ""
          }</span><button type="button" class="brb-del" data-adel aria-label="Remove">×</button></div>`;
        })
        .join("")}
      <button type="button" class="btn small ghost" data-aadd>+ Do</button>
    </div>`;
  };
  openWindow(
    `<h2>Brain builder</h2>
    <p class="sb-tip">Pick what it does. It's saved as a ${esc(LANG)} file in ${MY_FILES}/, for a spawn's Brain box.</p>
    <div class="sb-set">
      <label class="sb-row"><span>File name</span><input class="sb-box" data-bname maxlength="36" spellcheck="false" autocomplete="off" placeholder="guard"></label>
      ${
        mine.length
          ? `<label class="sb-row"><span>Open one</span><select class="sb-box" data-bopen><option value="">New</option>${mine
              .map(
                (f) => `<option value="${esc(f.name)}">${esc(f.name)}</option>`,
              )
              .join("")}</select></label>`
          : ""
      }
    </div>
    <div class="brb-rules"></div>
    <p class="acts brb-add"><button type="button" class="btn small ghost" data-radd>+ When</button></p>
    <details class="brb-see"><summary>See the ${esc(LANG)}</summary><pre class="brb-code"></pre></details>
    <p class="sb-why brb-why"></p>
    <p class="acts"><button type="button" class="btn" data-bsave>Save</button></p>`,
    {
      cls: "sb-setwin brb-win",
      onOpen(w, close) {
        const $ = (s) => w.querySelector(s),
          box = $(".brb-rules");
        /* the code as it is, and whether it can be saved */
        const check = () => {
          const code = bbCode(rows),
            name = $("[data-bname]").value.trim(),
            errs = compileScript(code, { file: () => null }).errs,
            why = !name
              ? "Give it a file name."
              : !NAME_OK.test(name)
                ? "A file name is letters, numbers, - and _."
                : !rows.some((r) => (r.acts || []).length)
                  ? "Give it something to do."
                  : errs.length
                    ? `Line ${errs[0].line}: ${errs[0].why}`
                    : "";
          $(".brb-code").textContent = code.slice(code.indexOf("\n") + 1); // (without its first line: the rows, for the builder)
          $(".brb-why").textContent = why;
          $("[data-bsave]").disabled = !!why;
          return { code, name, why };
        };
        const paint = () => {
          box.innerHTML = rows.map(rowHTML).join("");
          check();
        };
        const at = (e) => {
          const r = e.target.closest("[data-r]"),
            a = e.target.closest("[data-a]");
          return { i: r ? +r.dataset.r : -1, j: a ? +a.dataset.a : -1 };
        };
        w.addEventListener("input", (e) => {
          const t = e.target,
            { i, j } = at(e);
          if (i >= 0) {
            const r = rows[i];
            if (t.matches("[data-n]")) r.n = t.value;
            else if (t.matches("[data-ch]")) r.ch = t.value;
            else if (t.matches("[data-v]") && j >= 0) r.acts[j].v = t.value;
          }
          check();
        });
        w.addEventListener("change", async (e) => {
          const t = e.target,
            { i, j } = at(e);
          if (t.matches("[data-on]")) {
            rows[i].on = t.value;
            delete rows[i].n;
            return paint();
          }
          if (t.matches("[data-k]")) {
            rows[i].acts[j] = { k: t.value };
            return paint();
          }
          /* a number box left past its limits shows the number the brain will use */
          if (t.matches("[data-n]"))
            t.value = clamp(t.value, BB_WHEN[rows[i].on][2]);
          if (t.matches("[data-ch]")) t.value = chanceOf(t.value);
          if (t.matches("[data-v]") && t.type === "number") {
            const b = BB_DO[rows[i].acts[j].k][1];
            t.value = rows[i].acts[j].v = clamp(t.value, b);
            check();
          }
          if (t.matches("[data-bopen]")) {
            const f = mine.find((x) => x.name === t.value);
            rows = f ? bbRows(f.text) : [NEW_ROW()];
            $("[data-bname]").value = f
              ? f.name.replace(/\.(se|num)$/, "")
              : "";
            return paint();
          }
        });
        w.addEventListener("click", async (e) => {
          const { i, j } = at(e);
          if (e.target.closest("[data-radd]")) {
            rows.push(NEW_ROW());
            return paint();
          }
          if (e.target.closest("[data-rdel]")) {
            rows.splice(i, 1);
            return paint();
          }
          if (e.target.closest("[data-aadd]")) {
            rows[i].acts.push({ k: "attack" });
            return paint();
          }
          if (e.target.closest("[data-adel]")) {
            rows[i].acts.splice(j, 1);
            return paint();
          }
          if (e.target.closest("[data-bsave]")) {
            const { code, name, why } = check();
            if (why) return;
            try {
              const { numerat, c, dir } = await folder();
              if (numerat.at(c, dir, numerat.root(c)).kind !== "dir")
                numerat.mkdir(c, dir);
              numerat.write(c, `${dir}/${name}.se`, code);
            } catch (err) {
              $(".brb-why").textContent = err.message;
              return;
            }
            const path = `${MY_FILES}/${name}.se`;
            toast(
              `Saved ${path}: write it in a spawn's Brain box, or pick it with its arrow.`,
              4500,
            );
            close();
            if (done) done(path);
          }
        });
        paint();
      },
    },
  );
}
