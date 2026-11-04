/* ---------- Trivia: what the screen shows ----------
   Writing: a window like every mode's question box. The question on top, the Written Answer button under it (when both
   kinds of question are on), then the answer boxes, each with its letter "(A)" in the multicolored title letters: tap
   the letter to mark that answer right (it glows green). + adds a box, up to four; × takes an added one away. Every box
   carries data-note-box, so a note from Notes can go into any of them.
   The board: a see-through field over the map with the rows on it, one row a line of text like Story Chain's, each
   multiple choice answer starting with its letter. Under the rows a strip where a duck stands on no row. Over the board,
   the writer on the cloud (or the multicolored "?") and the question.
   Multiple choice: my own votes glow green (only on my screen); every vote is a small copy of its duck at the bottom
   middle of its row, side by side, the same size. Written: each answerer's row, with their small duck and name; the
   answer shows once the grading starts (only its writer sees it before), and then a green ✓ or a red ✗ as the writer
   marks it. The reveal lights up the right answers.
   Also the stats: Genius, Dumbo, Easiest Prompts, Hardest Prompts and Most Jumps, each player's box, and the round's
   questions. */
import { esc } from "./ui.js";
import { duckSVG } from "./duck.js";
import { nameHTML } from "./name.js";
import { cloudHTML, SECRET } from "./brackets.js";
import { rainbowHTML } from "./art.js";
import { fmtJumps } from "./format.js";
import { seenDuck, seenName } from "./looks.js";
import { touchOnly } from "./pointer.js";
import {
  tvQ,
  isWriter,
  answerers,
  needOf,
  doneN,
  endNeed,
  canEnd,
  tvRowAt,
  tvStats,
  mcOn,
  wrOn,
  multiOn,
  noWrongOn,
  hideWriter,
  LETTERS,
  Q_MAX,
  A_MAX,
  W_MAX,
} from "./triviarules.js";

const GONE = {
  name: "Gone",
  duck: { color: "#b7bccb" },
  card: { color: "#8a8fa3" },
  nameStyle: {},
};
const player = (s, id) => (id && s.players[id]) || GONE;
const nm = (p) => `<span class="wq-w">${nameHTML(p.name, seenName(p))}</span>`; // (a name never breaks across lines)
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const letter = (i) =>
  `<span class="tv-let">${rainbowHTML(`(${LETTERS[i]})`, { seed: 5 + i, from: i * 2 })}</span>`;
const mini = (p, size = 22) =>
  duckSVG(seenDuck(p), { size, shadow: false, title: p.name });

/* ---------- writing ---------- */
const choiceHTML = (i, extra) =>
  `<div class="tv-choice" data-i="${i}"><button type="button" class="tv-mark" data-mark="${i}" aria-pressed="false" aria-label="Mark ${LETTERS[i]} right">${letter(i)}<b class="tv-tick" aria-hidden="true">✓</b></button>
  <textarea class="tv-ain" data-note-box rows="1" maxlength="${A_MAX}" placeholder="Answer ${LETTERS[i]}" aria-label="Answer ${LETTERS[i]}" spellcheck="true"></textarea>${extra ? `<button type="button" class="tv-del" data-del="${i}" aria-label="Take answer ${LETTERS[i]} away">×</button>` : ""}</div>`;
export const tvChoiceHTML = choiceHTML;
function markHint(s) {
  if (!multiOn(s))
    return noWrongOn(s)
      ? "Tap a letter to mark the right answer, or none."
      : "Tap a letter to mark the right answer.";
  return noWrongOn(s)
    ? "Tap the letters of the right answers (not all of them), or none."
    : "Tap the letters of the right answers (not all of them).";
}
export function tvWriteHTML(s, me, who) {
  const T = s.tv || {};
  if (s.done[me]) {
    const q = (T.subs || {})[me];
    return `<div class="submit-wrap"><div class="panel submit-card done-card"><h2>${q ? "Question sent ✓" : "No question from you"}</h2>
      ${q ? `<p class="q-echo">${esc(q.text)}</p>` : '<p class="dim">An auto question plays in its place.</p>'}<p class="dim">Waiting for the others.</p></div>
      <div class="who">${who}</div></div>`;
  }
  const mc = mcOn(s),
    both = mc && wrOn(s);
  return `<div class="submit-wrap"><form class="panel submit-card tv-form${mc ? "" : " tv-written"}" autocomplete="off" novalidate>
    <h2>Write a question</h2>
    <textarea class="tv-qin" data-note-box rows="2" maxlength="${Q_MAX}" placeholder="Ask anything…" aria-label="Your question" spellcheck="true"></textarea>
    ${both ? '<p class="tv-kindrow"><button type="button" class="btn ghost tv-kind" data-tvk aria-pressed="false">Written Answer</button></p>' : ""}
    ${
      mc
        ? `<div class="tv-mc"><p class="small dim tv-hint">${markHint(s)}</p><div class="tv-choices">${choiceHTML(0)}${choiceHTML(1)}</div>
      <p class="tv-addrow"><button type="button" class="btn ghost tv-add" aria-label="Add an answer">+</button></p></div>`
        : ""
    }
    <p class="tv-wnote small dim">Everyone types their answer, then you mark each one Correct or Wrong.</p>
    <p class="tv-err small" role="alert"></p>
    <p class="acts"><button type="button" class="btn ghost" data-a="notes">Notes</button><button type="button" class="btn ghost" data-a="none">Don't write one</button><button type="submit" class="btn green">Send <kbd>Enter</kbd></button></p>
  </form><div class="who">${who}</div></div>`;
}
/* what's in the window now, as the host takes it (it checks it again itself) */
export function formQ(f) {
  const wr =
    f.classList.contains("tv-written") ||
    (f.querySelector("[data-tvk]") || {}).ariaPressed === "true";
  const rows = [...f.querySelectorAll(".tv-choice")];
  return {
    text: f.querySelector(".tv-qin").value,
    kind: wr ? "wr" : "mc",
    ans: rows.map((r) => r.querySelector(".tv-ain").value),
    ok: rows
      .map((r, i) =>
        r.querySelector(".tv-mark").getAttribute("aria-pressed") === "true"
          ? i
          : -1,
      )
      .filter((i) => i >= 0),
  };
}
/* the window's buttons: a mark, +, ×, Written Answer. True when it was one of them */
export function tvFormClick(e, s, changed) {
  const f = e.target.closest("form.tv-form");
  if (!f) return false;
  const mark = e.target.closest("[data-mark]"),
    add = e.target.closest(".tv-add"),
    del = e.target.closest("[data-del]"),
    kind = e.target.closest("[data-tvk]");
  if (mark) {
    const on = mark.getAttribute("aria-pressed") !== "true";
    if (on && !multiOn(s))
      f.querySelectorAll(".tv-mark").forEach((m) =>
        m.setAttribute("aria-pressed", "false"),
      ); // (one right answer: marking one unmarks the other)
    mark.setAttribute("aria-pressed", String(on));
    mark.closest(".tv-choice").classList.toggle("right", on);
    if (!multiOn(s))
      f.querySelectorAll(".tv-choice").forEach((c) =>
        c.classList.toggle(
          "right",
          c.querySelector(".tv-mark").getAttribute("aria-pressed") === "true",
        ),
      );
  } else if (add) {
    const box = f.querySelector(".tv-choices"),
      n = box.children.length;
    if (n < 4) {
      box.insertAdjacentHTML("beforeend", choiceHTML(n, true));
      box.lastElementChild.querySelector("textarea").focus();
    }
  } else if (del) {
    del.closest(".tv-choice").remove();
    renumber(f);
  } else if (kind) {
    const on = kind.getAttribute("aria-pressed") !== "true";
    kind.setAttribute("aria-pressed", String(on));
    f.classList.toggle("tv-written", on);
  } else return false;
  f.querySelector(".tv-add")?.toggleAttribute(
    "hidden",
    f.querySelectorAll(".tv-choice").length >= 4,
  );
  f.querySelector(".tv-err").textContent = "";
  changed();
  return true;
}
/* after × the boxes keep their order, A to D (only the added ones can be taken away) */
function renumber(f) {
  f.querySelectorAll(".tv-choice").forEach((c, i) => {
    c.dataset.i = i;
    const m = c.querySelector(".tv-mark"),
      a = c.querySelector(".tv-ain"),
      d = c.querySelector(".tv-del");
    m.dataset.mark = i;
    m.setAttribute("aria-label", `Mark ${LETTERS[i]} right`);
    m.querySelector(".tv-let").outerHTML = letter(i);
    a.placeholder = `Answer ${LETTERS[i]}`;
    a.setAttribute("aria-label", `Answer ${LETTERS[i]}`);
    if (d) d.dataset.del = i;
  });
}
/* Send: what's missing, said in the window (null: it's good to go) */
export function formProblem(s, q) {
  if (!q.text.trim()) return ["tv-qin", "Write a question first."];
  if (q.kind === "wr") return null;
  const empty = q.ans.findIndex((a) => !a.trim());
  if (empty >= 0)
    return [
      `tv-choice[data-i="${empty}"] .tv-ain`,
      "Fill in every answer, or take the extra one away.",
    ];
  if (!q.ok.length && !noWrongOn(s))
    return [null, "Mark the right answer: tap its letter."];
  if (q.ok.length >= q.ans.length)
    return [null, "They can't all be right: unmark one."];
  return null;
}

/* ---------- the board ---------- */
const HIDDEN_WRITER = SECRET;
function writerOnCloud(s) {
  const q = tvQ(s);
  if (!q) return null;
  if (q.auto || hideWriter(s)) return HIDDEN_WRITER;
  return s.players[q.by] || GONE;
}
function subHTML(s, me) {
  const T = s.tv,
    q = tvQ(s);
  const writer = q.by && s.players[q.by],
    by = writer && !hideWriter(s) ? nm(writer) : "The writer",
    mine = isWriter(s, me);
  if (s.phase === "tvq") {
    if (mine) return "You wrote this one: watch them answer.";
    const k = q.ok.length,
      what = k > 1 ? "each right answer" : "the right answer";
    return `${k > 1 ? `<b>${k} answers are right.</b> ` : ""}${touchOnly() ? `Tap ${what}.` : `Walk onto ${what} and press Enter.`}`;
  }
  if (s.phase === "tvw")
    return mine
      ? "Everyone's writing an answer. Then you grade them."
      : "Type your answer in your row.";
  if (s.phase === "tvg")
    return mine
      ? "Walk onto a row, then press Correct or Wrong."
      : `${by} is grading the answers.`;
  if (s.phase === "tvr") {
    const x = T.log[T.log.length - 1];
    if (!x) return "";
    if (x.none) return "No wrong answers on this one.";
    const n = x.right.length + x.wrong.length;
    const key =
      q.kind === "mc"
        ? ` The right answer${q.ok.length > 1 ? "s" : ""}: ${q.ok.map((i) => LETTERS[i]).join(", ")}.`
        : "";
    return `<b>${x.right.length} of ${n} got it right.</b>${key}`;
  }
  return "";
}
export function tvTopHTML(s, me) {
  const q = tvQ(s);
  if (!q) return "";
  return `<div class="topover tv-top">${cloudHTML(writerOnCloud(s), "Wrote it")}<div class="question tv-qbox"><span class="tv-qtext">${esc(q.text)}</span><span class="small tv-sub">${subHTML(s, me)}</span></div></div>`;
}
/* the votes on a row: a small copy of each voter's duck, side by side */
const votesHTML = (s, i) =>
  Object.entries(s.tv.votes || {})
    .filter(([id, v]) => v.includes(i) && s.players[id])
    .map(([id]) => mini(s.players[id], 22))
    .join("");
function rowsHTML(s, me) {
  const T = s.tv,
    q = tvQ(s),
    shown = s.phase === "tvr";
  if (q.kind === "mc") {
    const mine = T.votes[me] || [];
    return q.ans
      .map((a, i) => {
        const pick = mine.includes(i),
          right = shown && q.ok.includes(i),
          cls = `${pick ? " picked" : ""}${right ? " right" : ""}${shown && pick && !right ? " wrong" : ""}`;
        return `<div class="tv-row${cls}" data-c="${i}" data-i="${i}"><p class="tv-line">${letter(i)}<span class="tv-txt">${esc(a)}</span>${right ? '<b class="tv-ok">✓</b>' : ""}</p><div class="tv-votes">${votesHTML(s, i)}</div></div>`;
      })
      .join("");
  }
  const open = s.phase === "tvg" || shown;
  return T.ids
    .map((id, k) => {
      const p = player(s, id),
        g = T.grades[id],
        text = T.text[id] || "",
        own = id === me;
      const words =
        open || own
          ? text
            ? `<span class="tv-txt">${esc(text)}</span>`
            : `<span class="tv-txt dim">${open ? "No answer" : "…"}</span>`
          : `<span class="tv-txt dim">${T.sent[id] ? "✓ Sent" : "✎ writing…"}</span>`;
      return `<div class="tv-row tv-wrow${g === true ? " right" : g === false ? " wrong" : ""}${own ? " own" : ""}" data-c="${k}" data-i="${k}" data-pid="${esc(id)}"><p class="tv-line"><span class="tv-who">${mini(p, 24)}${nm(p)}</span>${words}${g === true ? '<b class="tv-ok">✓</b>' : g === false ? '<b class="tv-no">✗</b>' : ""}</p></div>`;
    })
    .join("");
}
/* my answer box, under the rows, while written answers are typed */
function answerFormHTML(s, me) {
  const T = s.tv;
  if (s.phase !== "tvw" || !T.ids.includes(me) || T.sent[me]) return "";
  return `<form class="tv-ansform panel" autocomplete="off"><textarea class="tv-win" rows="1" maxlength="${W_MAX}" placeholder="Your answer" aria-label="Your answer" spellcheck="true"></textarea><button type="submit" class="btn green">Send <kbd>Enter</kbd></button></form>`;
}
export const tvBoardHTML = (
  s,
  me,
) => `<div class="board tv-board"><div class="cols tv-cols"><div class="col tv-field" data-c="0"></div></div><div class="tv-rows">${tvQ(s) ? rowsHTML(s, me) : ""}</div>
  <div class="ducks"></div><div class="fxl"></div>${tvTopHTML(s, me)}${answerFormHTML(s, me)}</div>`;
/* within a question, what changes as votes, answers and grades come in: the rows and the words under the question
   (redrawn only when they change). True when the rows were redrawn, so the board is measured again */
export function tvRefresh(root, s, me) {
  const rows = root.querySelector(".tv-rows"),
    sub = root.querySelector(".tv-top .tv-sub");
  if (!rows || !tvQ(s)) return false;
  const html = rowsHTML(s, me),
    n = rows.children.length;
  if (rows._html !== html) {
    rows._html = html;
    rows.innerHTML = html;
  }
  if (sub) {
    const h = subHTML(s, me);
    if (sub._html !== h) {
      sub._html = h;
      sub.innerHTML = h;
    }
  }
  const form = root.querySelector("form.tv-ansform");
  if (form && s.tv.sent[me]) form.remove();
  return rows.children.length !== n;
}
/* my own row shows what I type at once */
export function tvTyped(root, s, me, text) {
  const k = s.tv ? s.tv.ids.indexOf(me) : -1,
    row = k >= 0 && root.querySelector(`.tv-row[data-i="${k}"] .tv-txt`);
  if (row) {
    row.classList.toggle("dim", !text);
    row.textContent = text || "…";
  }
}

/* ---------- the bar under the board ---------- */
export function tvActHTML(s, me, pos) {
  const q = tvQ(s);
  if (!q) return "";
  const row = tvRowAt(s, pos),
    anchor = `<span class="vote-btn" data-col="${row}" hidden></span>`; // (game.js redraws the bar when my row changes)
  if (s.phase === "tvq") {
    const n = answerers(s).length,
      d = doneN(s),
      count = `<span class="progress">${d}/${n} done${endNeed(s) < n ? ` · ${endNeed(s)} needed` : ""}</span>`,
      end = canEnd(s)
        ? '<button type="button" class="btn yellow" data-a="tvend">End round</button>'
        : "";
    if (isWriter(s, me))
      return `<div class="act-row">${anchor}${end}${count}</div>`;
    const mine = (s.tv.votes[me] || []).includes(row),
      vote =
        row >= 0
          ? `<button type="button" class="btn${mine ? " green voted" : ""}" data-a="tvpick">${mine ? `Take back (${LETTERS[row]})` : `Vote (${LETTERS[row]})`} <kbd>Enter</kbd></button>`
          : `<button type="button" class="btn" disabled>${touchOnly() ? "Tap an answer" : "Walk onto an answer"}</button>`;
    const need = needOf(q),
      left =
        need > 1
          ? `<span class="progress">${Math.min(need, (s.tv.votes[me] || []).length)}/${need} picked</span>`
          : "";
    return `<div class="act-row">${anchor}${vote}${left}${end}${count}</div>`;
  }
  if (s.phase === "tvw") {
    const ids = s.tv.ids,
      d = ids.filter((id) => s.tv.sent[id]).length;
    return `<div class="act-row">${anchor}<span class="progress">${d}/${ids.length} answered</span></div>`;
  }
  if (s.phase === "tvg") {
    const ids = s.tv.ids,
      d = ids.filter((id) => s.tv.grades[id] !== undefined).length,
      count = `<span class="progress">${d}/${ids.length} graded</span>`,
      id = ids[row];
    if (isWriter(s, me) && id !== undefined && s.tv.text[id]) {
      const g = s.tv.grades[id];
      return `<div class="act-row">${anchor}<button type="button" class="btn green tv-gb" data-a="tvok" aria-pressed="${g === true}">Correct ✓</button><button type="button" class="btn red tv-gb" data-a="tvno" aria-pressed="${g === false}">Wrong ✗</button>${count}</div>`;
    }
    return `<div class="act-row">${anchor}${isWriter(s, me) ? '<span class="progress">Walk onto a row</span>' : ""}${count}</div>`;
  }
  return `<div class="act-row">${anchor}<span class="progress">Question ${s.tv.qi + 1} of ${s.tv.qs.length}</span></div>`;
}
/* the round label over the board */
export const tvRound = (s) =>
  s.tv && s.tv.qs.length && ["tvq", "tvw", "tvg", "tvr"].includes(s.phase)
    ? ` · Question ${s.tv.qi + 1} of ${s.tv.qs.length}`
    : "";
export const TV_TITLES = {
  tvwrite: "Write a question",
  tvq: "Pick the answer",
  tvw: "Write your answer",
  tvg: "Grading",
  tvr: "The answer",
  results: "Results",
};

/* ---------- the stats ---------- */
const share = (w) => (w.of ? w.got / w.of : null);
function awardsHTML(s, round) {
  const { per } = tvStats(s, round),
    ids = s.seat.filter((id) => s.players[id]);
  const top = (f, low = false, only = () => true) => {
    const xs = ids
      .filter((id) => per[id] && only(per[id]))
      .map((id) => [id, f(per[id])]);
    if (!xs.length) return null;
    const v = low
      ? Math.min(...xs.map((x) => x[1]))
      : Math.max(...xs.map((x) => x[1]));
    return { v, who: xs.filter((x) => x[1] === v).map((x) => x[0]) };
  };
  const award = (title, r, words) =>
    r && r.who.length
      ? `<div class="award"><h3>${esc(title)}</h3><p>${r.who.map((id) => nm(player(s, id))).join(r.who.length > 2 ? ", " : " and ")}${r.who.length > 1 ? ' <span class="dim">(tie)</span>' : ""}</p><p class="small dim">${words(r.v)}</p></div>`
      : "";
  const writers = (w) => w.of > 0,
    easy = top((w) => share(w), false, writers),
    hard = top((w) => share(w), true, writers),
    genius = top((w) => w.right),
    dumbo = top((w) => w.wrong);
  const jx = s.seat.map((id) => [id, (s.jumps || {})[id] || 0]),
    jv = Math.max(0, ...jx.map((x) => x[1])),
    jumps = jv
      ? { v: jv, who: jx.filter((x) => x[1] === jv).map((x) => x[0]) }
      : null;
  const pct = (v) => `${Math.round(v * 100)}%`;
  return `<div class="awards">${award("Genius", genius && genius.v ? genius : null, (v) => `${plural(v, "right answer")}.`)}
    ${award("Dumbo", dumbo && dumbo.v ? dumbo : null, (v) => `${plural(v, "wrong answer")}.`)}
    ${award("Easiest Prompts", easy, (v) => `${pct(v)} of the answers to their questions were right.`)}
    ${award("Hardest Prompts", hard && easy && hard.v !== easy.v ? hard : null, (v) => `Only ${pct(v)} of the answers to their questions were right.`)}
    ${award("Most Jumps", jumps, (v) => `${plural(v, "jump")}.`)}</div>`;
}
/* the round's questions: who wrote each one and how many got it right */
function questionsHTML(s, round) {
  const { log } = tvStats(s, round);
  if (!log.length) return "";
  return `<div class="wyr-qs panel">${log
    .map((x) => {
      const by = x.auto
        ? "Auto question"
        : x.by && s.players[x.by] && !hideWriter(s)
          ? esc(s.players[x.by].name)
          : "?";
      const n = x.right.length + x.wrong.length;
      return `<p class="small"><span class="dim">${by}:</span> ${esc(x.text)} <b class="tv-score">${x.none ? "no wrong answers" : `${x.right.length}/${n} right`}</b></p>`;
    })
    .join("")}</div>`;
}
/* a player's box: right, wrong, and their questions */
export function tvBoxHTML(s, id, round = null) {
  const p = s.players[id];
  if (!p) return "";
  const w = tvStats(s, round).per[id] || {
      right: 0,
      wrong: 0,
      asked: 0,
      got: 0,
      of: 0,
    },
    sh = share(w);
  return `<article class="statbox" data-pid="${esc(id)}"><header>${mini(p, 46)}<div>${nameHTML(p.name, seenName(p))}<div class="small dim">${plural(w.right + w.wrong, "answer")}</div></div></header>
    <dl><dt>Right</dt><dd>${w.right}</dd><dt>Wrong</dt><dd>${w.wrong}</dd><dt>Questions written</dt><dd>${w.asked}</dd>
      <dt>Answered right (their questions)</dt><dd>${sh === null ? "—" : `${Math.round(sh * 100)}%`}</dd><dt>Jumps this game</dt><dd>${fmtJumps((s.jumps || {})[id] || 0)}</dd></dl></article>`;
}
export function tvStatsHTML(s) {
  const boxes = (r) => s.seat.map((id) => tvBoxHTML(s, id, r)).join("");
  return `<h2>Round ${s.round + 1}</h2>${awardsHTML(s, s.round)}<div class="statboxes">${boxes(s.round)}</div>${questionsHTML(s, s.round)}
    ${s.review ? `<h2 class="all-h">All rounds</h2>${awardsHTML(s, null)}<div class="statboxes">${boxes(null)}</div>` : ""}`;
}
