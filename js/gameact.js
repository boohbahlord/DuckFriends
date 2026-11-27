/* ---------- the action window and the view's titles: what the buttons say each phase and mode ----------
   Moved out of game.js to keep that file small (a pure move). It imports back from game.js, which imports it. */
import { late } from "./game.js";

import { R, me, world } from "./game.js";
import {
  sbGo,
  viewOver,
  viewResults,
  viewSubmit,
  whoHTML,
} from "./gameround.js";

import { boardHTML } from "./gameboard.js";

import { graceLeft } from "./gamehand.js";

import { esc } from "./ui.js";
import {
  COLS,
  needed,
  canEndRound,
  reviewCount,
  playing,
  isWyr,
  isDdr,
  DDR_SIDES,
  isBb,
  isLaw,
  colAt,
  isSc,
  isHang,
  minOf,
  goOnVotes,
  goOnNeed,
} from "./rules.js";

import { votesDue } from "./voterules.js";

import { isSudo } from "./roomrules.js";

import {
  isCounsel,
  jury,
  lawTally,
  canGiveUp,
  ATT_PHASES,
} from "./lawrules.js";

import { SC_BOARD, zoneAt, scCanVote, scLineOf } from "./scrules.js";

import { bbMatch } from "./bbrules.js";

import { BOARD_HTML as HANG_HTML } from "./hangout/world.js";

import { wordsHTML } from "./story.js";

import { topicHTML, tvoteHTML, seedsHTML, podiumHTML } from "./brackets.js";

import { watching, watchHTML } from "./spectate.js";

import { sbOnBoard } from "./sandboxrules.js";

import { profile } from "./store.js";

import { now as clockNow } from "./clock.js";

import {
  isQuack,
  QUACK_PHASES,
  spotOf,
  speakerOf,
  frozen,
  stillIn,
  canAccuse,
} from "./quackrules.js";

import { pickHTML } from "./quack.js";

import {
  isDn,
  DN_SIDES,
  isDefender,
  voters,
  dnTally,
  endVotes,
  endNeed,
} from "./duncerules.js";

import {
  isVd,
  VD_PHASES,
  VD_AFTER,
  isDate,
  turnedDown,
  vdTileAt,
} from "./vddrules.js";

import { isTv, TV_BOARD } from "./triviarules.js";

import { tvWriteHTML, tvActHTML } from "./trivia.js";

export function actHTML(s) {
  const sbg = sbGo(s);
  if (sbg)
    return `<div class="act-row"><button type="button" class="btn hang-btn" data-a="sbgo">${esc(sbg.label)} <kbd>E</kbd></button></div>`;
  const on = playing(s),
    n = on.length,
    d = on.filter((id) => s.done[id]).length,
    need = needed(s),
    mine = s.done[R.me];
  if (s.waiting && s.waiting.for) {
    const g = goOnVotes(s).length,
      mineG = !!(s.waiting.go || {})[R.me];
    return `<div class="act-row"><span class="progress wait-bar" role="status">Waiting for ${esc(s.waiting.name || "a player")} to come back</span><button type="button" class="btn${mineG ? " yellow" : " green"}" data-a="goon" aria-pressed="${mineG}" data-tip="Go on without them">${mineG ? "Next round ✓" : "Next round"} · ${g}/${goOnNeed(s)}</button></div>`;
  } // (Lawyering, Duncelation: an attorney or the defender left mid-case)
  if (s.waiting)
    return `<span class="progress wait-bar" role="status">Waiting for players to continue <b>${s.seat.length}/${minOf(s)}</b></span>`; // (a game below its fewest players: ducks still walk)
  if (isQuack(s) && QUACK_PHASES.includes(s.phase)) return quackActHTML(s);
  if (isVd(s) && VD_PHASES.includes(s.phase)) return vdActHTML(s);
  if (isTv(s) && TV_BOARD.includes(s.phase)) return tvActHTML(s, R.me, me);
  if ((isHang(s) || sbOnBoard(s)) && watching(s, R.me))
    return watchHTML(s, R.me); // (Survival, my duck dead: the card of the one I watch: spectate.js)
  if (isHang(s)) return world ? world.buttonHTML() : ""; // Hangout: the nearest activity's button (Light off …)
  if (late())
    return `<span class="progress">You joined mid-turn: walk around and chat. You play from the next ${isBb(s) ? "match" : isLaw(s) ? "case" : isDn(s) ? "take" : "question"}. · ${d}/${n} done</span>`;
  const count = `<span class="progress">${d}/${n} done${need < n ? ` · ${need} needed` : ""}</span>`;
  if (isSc(s)) return storyActHTML(s, d, n, need, count);
  if (
    ["submit", "topic", "tvote", "seeds", "counsel", "tvwrite"].includes(
      s.phase,
    )
  )
    return count;
  if (isLaw(s) && ATT_PHASES.includes(s.phase) && s.law) {
    const p = s.law.picks[s.phase === "lawdef" ? "def" : "off"] || {},
      v = on.filter((id) => p[id] !== undefined).length;
    return `<span class="progress">${v}/${n} voted</span>`;
  } // (the attorney vote)
  if (s.phase === "podium") return "";
  if (s.phase === "tie") {
    // the tied match: vote again or toss a coin (a choice can change until everyone has chosen)
    const v = (s.bb.tie || {}).votes || {},
      n = (k) => Object.values(v).filter((x) => x === k).length,
      mineV = v[R.me];
    return `<div class="act-row"><button type="button" class="btn${mineV === "again" ? " green" : " ghost"}" data-a="tieagain" aria-pressed="${mineV === "again"}">Vote again · ${n("again")}</button><button type="button" class="btn${mineV === "coin" ? " yellow" : " ghost"}" data-a="tiecoin" aria-pressed="${mineV === "coin"}">Coin toss · ${n("coin")}</button>${count}</div>`;
  }
  if (s.phase === "bracket")
    return `<div class="act-row"><button type="button" class="btn theme-btn${mine ? " done" : ""}" data-a="end">${mine ? "Waiting ✓" : s.bb.champ != null ? "On to the podium" : "Next match"} <kbd>Enter</kbd></button>${count}</div>`;
  if (s.phase === "answer" && isLaw(s) && s.law) return lawActHTML(s);
  if (s.phase === "answer" && isDn(s) && s.dn && s.dn.cur) return dnActHTML(s);
  if (s.phase === "dunced") {
    const p = s.players[((s.dn && s.dn.cur) || {}).def];
    return `<span class="progress">${p ? `${esc(p.name)} is the dunce` : "A dunce"}</span>`;
  }
  if (s.phase === "answer") {
    /* Vote: the button takes the color of the column you stand on; no voting in the first seconds; once locked it waits
       for everyone (End turn comes after, when the votes are in) */
    const onBoard = me && me.x >= 0,
      wait = graceLeft(s),
      col = onBoard ? colAt(s, me.x) : -1;
    const votes = `<span class="progress">${d}/${n} voted${need < n && !isBb(s) ? ` · ${need} needed` : ""}</span>`; // (a bracket match waits for every vote or its timer)
    const q = s.qs[s.qi],
      m = bbMatch(s);
    const choices = m
      ? [
          [s.bb.seeds[m.a].text, "bb-a"],
          [s.bb.seeds[m.b].text, "bb-b"],
        ]
      : isWyr(s)
        ? [
            [q.a, "wyr-a"],
            [q.b, "wyr-b"],
          ]
        : isDdr(s)
          ? DDR_SIDES.map((t, c) => [t, `wyr-${c ? "b" : "a"}`])
          : COLS.map((c, i) => [c, `c${i + 1}`]);
    const mc =
      profile.settings.multipleChoice && (!mine || s.options.freeRoam)
        ? `<div class="mc">${choices.map(([c, k], i) => `<button type="button" class="mc-b ${k}" data-col="${i}">${esc(c)}</button>`).join("")}</div>`
        : "";
    const label = wait
      ? `Vote in ${wait}`
      : s.options.freeRoam
        ? mine
          ? "Ready ✓"
          : "Ready"
        : mine
          ? "Voted ✓"
          : "Vote";
    const off = wait || !onBoard || col < 0; // (Voted ✓ stays pressable: pressing it again takes the vote back)
    const tip = s.options.freeRoam
      ? "Free roam: keep moving; where you stand when the turn ends is your vote."
      : mine
        ? "Press again to take your vote back."
        : "";
    return `${mc}<div class="act-row"><button type="button" class="btn vote-btn${mine ? " voted" : ""}" data-a="end" data-col="${col}"${off ? " disabled" : ""}${tip ? ` data-tip="${tip}"` : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>${endRoundHTML(s)}${votes}</div>`;
  }
  if (s.phase === "discuss")
    return `<div class="act-row"><button type="button" class="btn theme-btn${mine ? " done" : ""}" data-a="end">${mine ? "Waiting ✓" : "End turn"} <kbd>Enter</kbd></button>${count}</div>`;
  if (s.phase === "results" && isVd(s))
    return `<div class="act-row"><button type="button" class="btn${mine ? " yellow" : " green"}" data-a="end">${mine ? "Waiting ✓" : VD_AFTER === "lobby" ? "Back to the lobby" : "New game"} <kbd>Enter</kbd></button>${count}</div>`; // (Valentine's Duck Date: one game, one Valentine)
  if (s.phase === "results") {
    const rv = reviewCount(s),
      lv = s.vote && s.vote.kind === "lobby";
    return `<div class="act-row"><button type="button" class="btn${mine ? " yellow" : " green"}" data-a="end">${mine ? "Waiting ✓" : isBb(s) ? "Next tournament" : "Next round"} <kbd>Enter</kbd></button>
      ${s.round >= 1 && !s.review ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? " disabled" : ""} data-tip="Adds every round's stats after this round's. One vote each round.">All-rounds review ${rv}/${need}</button>` : ""}
      <button type="button" class="btn ${lv ? "red" : "ghost"}" data-a="lobbyvote"${s.round === 1 ? ' data-tip="You can also vote to go back to the lobby on the all-rounds stats screen."' : ""}>${lv ? "Vote yes: back to the lobby" : "Vote: back to the lobby"}</button>${newGameHTML(s)}${count}${voteBackNote(s)}</div>`;
  }
  if (s.phase === "over")
    return `<div class="act-row">${isSudo(s, R.me) ? '<button type="button" class="btn green" data-a="lobby">Back to the lobby</button>' : '<span class="dim">The host takes everyone back to the lobby.</span>'}<button type="button" class="btn ghost" data-a="leave">Leave</button></div>`;
  return "";
}

/* Vote Mode & Map on: the stats screen's "Vote: new game now" button (the votes come back at once once the room says
   yes), and a line that says when the votes come back on their own (Vote return) */
function newGameHTML(s) {
  const due = votesDue(s);
  if (!due.length) return "";
  const nv = s.vote && s.vote.kind === "newgame",
    what = due.includes("mode") ? "game" : "map";
  return `<button type="button" class="btn ${nv ? "green" : "ghost"}" data-a="newvote">${nv ? `Vote yes: new ${what} now` : `Vote: new ${what} now`}</button>`;
}
function voteBackNote(s) {
  const due = votesDue(s),
    v = s.options.voteBack;
  if (!due.length || !(+v > 0 || v === "r")) return "";
  const what = due.includes("mode") ? "game" : "map",
    every =
      v === "r"
        ? "Every 1 to 6 games (picked at random)"
        : +v === 1
          ? "After every game"
          : `Every ${+v} games`,
    left = Math.max(1, +s.gamesLeft || 1);
  return `<div class="vote-back-note dim small">${every}, everyone votes on the next ${what}. Games until that vote: ${left}.</div>`;
}

/* Valentine's Duck Date: The Date's buttons (Next duck in a date, Turn down in the pick), and what everyone else sees */
function vdActHTML(s) {
  const V = s.vd;
  if (!V) return "";
  const name = (id) => esc((s.players[id] || { name: "Gone" }).name),
    wait = graceLeft(s);
  if (late())
    return `<span class="progress">You joined mid-game: walk around and chat. You're a Suitor from the next turn.</span>`;
  if (s.phase === "vdprompt")
    return `<span class="progress">${isDate(s, R.me) ? "Write the topic for this turn's dates (empty: a random one)." : "The Date is writing the topic for this turn…"}</span>`;
  if (s.phase === "vddate") {
    /* the date's timer: it starts when The Date presses Start timer, and pressing it again pauses it */
    const tm = V.tm,
      ms = tm ? (tm.run ? Math.max(0, s.ends - clockNow()) : tm.left) : 0,
      left = Math.ceil(ms / 1000),
      lefts = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    if (isDate(s, R.me))
      return `<div class="act-row">${tm ? `<button type="button" class="btn ${tm.run ? "yellow" : "purple"}" data-a="vdtimer" aria-pressed="${tm.run}" data-tip="${tm.run ? "Pause the timer" : "Start the timer, or go on where it stopped"}">${tm.run ? "Pause timer" : `${tm.left < (+s.options.vdTime || 0) * 1000 ? "Timer paused" : "Start timer"} · ${lefts}`}</button>` : ""}<button type="button" class="btn green" data-a="end"${wait ? " disabled" : ""} data-tip="End this date and go on to the next Suitor">${wait ? `Next duck in ${wait}` : "Next duck <kbd>Enter</kbd>"}</button></div>`;
    return `<span class="progress">${V.cur === R.me ? "Your date! Win The Date over (on the call or in the chat)." : `${V.cur ? name(V.cur) : "A Suitor"} is on a date with The Date.`}${tm && !tm.run ? ` Timer ${tm.left < (+s.options.vdTime || 0) * 1000 ? "paused" : "not started"}.` : ""}</span>`;
  }
  if (s.phase === "vdpick") {
    if (!isDate(s, R.me))
      return `<span class="progress">The Date is picking who is Turned Down.</span>`;
    const k = me && me.x >= 0 ? vdTileAt(s, me) : -1,
      who = k >= 0 ? V.ids[k] : null;
    return `<div class="act-row"><button type="button" class="btn vote-btn ${who ? "red" : "ghost"}" data-a="end" data-col="${k}"${wait ? " disabled" : ""}>${wait ? `Turn down in ${wait}` : who ? `Turn down ${name(who)} <kbd>Enter</kbd>` : "Turn down nobody <kbd>Enter</kbd>"}</button></div>`;
  }
  if (s.phase === "vddown")
    return `<span class="progress">${suitorsLeft(s)} still in. The next turn is coming.</span>`;
  if (s.phase === "vdval")
    return `<span class="progress">${V.val ? `${name(V.val)} is The Date's Valentine!` : "The game is over."} The stats are next.</span>`;
  return "";
}
const suitorsLeft = (s) => {
  const n = (s.vd.ids || []).filter((id) => !turnedDown(s, id)).length;
  return `${n} Suitor${n === 1 ? "" : "s"}`;
};

/* the Vote button of the two games that vote by the side you stand on (Lawyering and Duncelation; votes: who voted for
   which side): Vote, Voted ✓ or Change vote, and Vote in n while the grace lasts (the owner's, Nov 22: one copy, A4) */
function voteBtn(s, votes) {
  const onBoard = me && me.x >= 0,
    wait = graceLeft(s),
    col = onBoard ? colAt(s, me.x) : -1,
    mine = votes[R.me];
  const label = wait
    ? `Vote in ${wait}`
    : mine !== undefined && (col < 0 || mine === col)
      ? "Voted ✓"
      : mine !== undefined
        ? "Change vote"
        : "Vote";
  const off = !!wait || col < 0 || mine === col;
  return `<button type="button" class="btn vote-btn${mine !== undefined ? " voted" : ""}" data-a="end" data-col="${col}"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>`;
}
/* Lawyering: an attorney argues (and, behind in closing arguments, may give up); a juror votes for the side they stand on,
   and can change it at any time */
function lawActHTML(s) {
  const L = s.law,
    j = jury(s),
    voted = j.filter((id) => L.votes[id] !== undefined).length,
    [o, d] = lawTally(s);
  const tally = L.close
    ? `<span class="progress">Offense ${o} · Defense ${d}</span>`
    : `<span class="progress">${voted}/${j.length} voted</span>`;
  if (isCounsel(s, R.me)) {
    const give = canGiveUp(s, R.me)
      ? '<button type="button" class="btn red" data-a="giveup" data-tip="In honor of the better argument (or in shame): the other side wins the case.">Give up</button>'
      : "";
    return `<div class="act-row"><span class="law-you">You're the ${L.off === R.me ? "offense" : "defense"} attorney: convince them!</span>${give}${tally}</div>`;
  }
  const btn = voteBtn(s, L.votes);
  const names = [L.off, L.def].map(
    (id) => (s.players[id] || { name: "?" }).name,
  );
  const mc = profile.settings.multipleChoice
    ? `<div class="mc">${names.map((n, i) => `<button type="button" class="mc-b law-${i ? "b" : "a"}" data-col="${i}">${i ? "Defense" : "Offense"}: ${esc(n)}</button>`).join("")}</div>`
    : "";
  return `${mc}<div class="act-row">${btn}${tally}</div>`;
}
/* Duncelation: the defender defends; everyone else votes for the side they stand on, and can change it at any time */
function dnActHTML(s) {
  const v = voters(s),
    voted = v.filter((id) => s.dn.cur.votes[id] !== undefined).length,
    [d, n] = dnTally(s);
  const tally = `<span class="progress">${voted}/${v.length} voted · Dunce ${d} · Not a Dunce ${n}</span>`;
  /* End round, beside Vote for everyone: it passes once the defender pressed it too and enough players did */
  const ev = endVotes(s),
    endMine = ev.includes(R.me);
  const end = `<button type="button" class="btn dn-end${endMine ? " yellow" : " ghost"}" data-a="dnend" aria-pressed="${endMine}" data-tip="Ends the take now once the defender presses it too and ${endNeed(s)} players in all have.">${endMine ? "End round ✓" : "End round"} · ${ev.length}/${endNeed(s)}</button>`;
  if (isDefender(s, R.me))
    return `<div class="act-row"><span class="law-you">Defend your take: it isn't a dunce take!</span>${end}${tally}</div>`;
  const btn = voteBtn(s, s.dn.cur.votes);
  const mc = profile.settings.multipleChoice
    ? `<div class="mc">${DN_SIDES.map((t, i) => `<button type="button" class="mc-b law-${i ? "b" : "a"}" data-col="${i}">${esc(t)}</button>`).join("")}</div>`
    : "";
  return `${mc}<div class="act-row">${btn}${end}${tally}</div>`;
}
/* Who is the Quack?: Done (the speaker) or Skip (everyone else) in a clue turn; Vote; End turn after the reveal */
function quackActHTML(s) {
  const w = s.wq,
    row = (x) => `<div class="act-row">${x}</div>`,
    P = (id) => esc((s.players[id] || {}).name || "Gone");
  if (s.phase === "wqpick")
    return `<span class="progress">${w.picker === R.me ? "Only you see the word you pick." : "Someone is picking the secret word."}</span>`;
  if (!w.ids.includes(R.me))
    return `<span class="progress">You joined mid-vote: walk around and chat. You play from the next ${w.result ? "round" : "lap of clues"}.</span>`;
  if (s.phase === "reveal") {
    const on = playing(s),
      d = on.filter((id) => s.done[id]).length,
      need = needed(s),
      mine = s.done[R.me],
      hold = frozen(s, R.me, clockNow());
    return row(
      `<button type="button" class="btn theme-btn${mine ? " done" : ""}" data-a="end"${hold ? " disabled" : ""}>${mine ? "Waiting ✓" : w.result ? "On to the stats" : "More clues"} <kbd>Enter</kbd></button><span class="progress">${d}/${on.length} done${need < on.length ? ` · ${need} needed` : ""}</span>`,
    );
  }
  if (w.out[R.me])
    return `<span class="progress">You're out this round: walk around and talk, but no clues or votes.</span>`;
  const g = graceLeft(s),
    inn = stillIn(s);
  if (s.phase === "clue") {
    const sp = speakerOf(s),
      others = inn.filter((id) => id !== sp),
      d = others.filter((id) => s.done[id]).length;
    if (sp === R.me)
      return row(
        `<button type="button" class="btn green" data-a="end"${g ? " disabled" : ""}>${g ? `Done in ${g}` : "Done <kbd>Enter</kbd>"}</button><span class="progress">Say your clue out loud</span>`,
      );
    const mine = s.done[R.me];
    return row(
      `<button type="button" class="btn ${mine ? "yellow" : "ghost"}" data-a="end"${g || mine ? " disabled" : ""} data-tip="Everyone else has to skip it to move on.">${mine ? "Skipped ✓" : g ? `Skip in ${g}` : `Skip ${P(sp)}'s turn <kbd>Enter</kbd>`}</button><span class="progress">${d}/${others.length} skipped</span>`,
    );
  }
  /* choice and accuse: stand on a side or a tile, then Vote (it holds your spot) */
  const d = inn.filter((id) => s.done[id]).length,
    mine = s.done[R.me],
    k = me && me.x >= 0 ? spotOf(s, me) : -1;
  const ok = k >= 0 && (s.phase === "choice" || canAccuse(s, R.me, w.ids[k])),
    off = g || !ok || mine;
  const tint =
    s.phase === "choice" && k >= 0 ? ` wq-side-${k ? "b" : "a"}` : "";
  const label = g
    ? `Vote in ${g}`
    : mine
      ? "Voted ✓"
      : s.phase === "accuse" && k >= 0 && !ok
        ? w.ids[k] === R.me
          ? "Not yourself!"
          : "Not that one"
        : "Vote";
  return row(
    `<button type="button" class="btn vote-btn${mine ? " voted" : ""}${tint}" data-a="end" data-col="${k}"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button><span class="progress">${d}/${inn.length} voted</span>`,
  );
}

/* Story Chain: whose line it is, or Vote (stand on a line, a word or a choice; not your own) */
/* the End round button (the host's End round setting), next to Vote once enough have voted */
const endRoundHTML = (s) =>
  canEndRound(s) && !late() && playing(s).includes(R.me)
    ? '<button type="button" class="btn yellow" data-a="endround">End round</button>'
    : "";
function storyActHTML(s, d, n, need, count) {
  if (s.phase === "words") return count;
  if (s.phase === "write") return ""; // (the top bar says which line it is; the writer's window has Send)
  const onBoard = me && me.x >= 0,
    wait = graceLeft(s),
    z = onBoard ? zoneAt(s, me.y) : null,
    mine = s.done[R.me],
    ok = !!z && scCanVote(s, R.me, z);
  const l = scLineOf(s, z),
    own =
      !ok &&
      (s.phase === "lvote"
        ? l && l.now && l.line.by === R.me
        : s.phase === "wvote" && z === "W:" + R.me);
  const label = wait
      ? `Vote in ${wait}`
      : mine
        ? "Voted ✓"
        : own
          ? s.phase === "lvote"
            ? "Your line"
            : "Your word"
          : "Vote",
    off = wait || !ok || mine;
  const review =
    s.phase === "results" && s.round >= 1 && !s.review
      ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? " disabled" : ""} data-tip="Adds every round's stats and the finished stories. One vote each round.">All-rounds review ${reviewCount(s)}/${need}</button>`
      : "";
  return `<div class="act-row"><button type="button" class="btn vote-btn sc-vote${mine ? " voted" : ""}" data-a="end"${off ? " disabled" : ""}>${label}${off ? "" : " <kbd>Enter</kbd>"}</button>${endRoundHTML(s)}<span class="progress">${d}/${n} voted${need < n ? ` · ${need} needed` : ""}</span>${review}</div>`;
}
export const TITLES = {
  hang: "Duck Cabin",
  sandbox: "Sandbox",
  submit: "Write a question",
  answer: "Vote",
  discuss: "Talk it over",
  results: "Results",
  over: "",
  topic: "Write a topic",
  tvote: "Pick the topic",
  tie: "A tie",
  seeds: "Write the contenders",
  bracket: "The bracket",
  podium: "The podium",
  words: "Write a secret word",
  write: "Write the story",
  lvote: "Favorite line",
  wvote: "Favorite secret word",
  wqpick: "The secret word",
  clue: "Clues",
  choice: "Vote or more clues?",
  accuse: "Vote Out the Quack",
  reveal: "The reveal",
};
export const LAW_TITLES = {
  submit: "Write a topic",
  counsel: "Pick the attorneys",
  lawdef: "Vote the defense",
  lawoff: "Vote the offense",
  answer: "Court is in session",
  discuss: "The verdict",
};
export const DN_TITLES = {
  submit: "Write a take",
  answer: "Dunce or Not?",
  discuss: "The verdict",
  dunced: "The dunce",
};
export const VD_TITLES = {
  vdprompt: "The topic",
  vddate: "On a date",
  vdpick: "Who is Turned Down?",
  vddown: "Turned Down",
  vdval: "Valentine",
  results: "Sweet Valentine",
};
/* Valentine's Duck Date: the turn, and the date in it */
export const vdRound = (s) => {
  const V = s.vd;
  if (!V || !V.turn) return "";
  return `Turn ${V.turn}${["vdprompt", "vddate"].includes(s.phase) && V.order.length ? ` · Date ${Math.min(V.k + 1, V.order.length)} of ${V.order.length}` : ""}`;
};
/* what the middle of the screen shows */
export function viewHTML(s) {
  if (isHang(s)) return `<div class="stage hang-stage">${HANG_HTML}</div>`;
  if (isLaw(s) && s.phase === "counsel")
    return '<div class="law-counsel-wrap"></div>';
  if (isTv(s) && s.phase === "tvwrite") return tvWriteHTML(s, R.me, whoHTML(s));
  if ((isLaw(s) || isDn(s) || isVd(s) || isTv(s)) && s.phase === "results")
    return '<div class="bb-results"><div class="statpanel law-statpanel"></div></div>';
  if (isQuack(s))
    switch (s.phase) {
      case "wqpick":
        return pickHTML(s, R.me);
      case "results":
        return '<div class="bb-results"><div class="statpanel bb-statpanel"></div></div>';
    }
  if (isSc(s)) {
    if (s.phase === "words") return wordsHTML(s, R.me, whoHTML(s));
    if (s.phase === "results")
      return `<div class="results sc-results"><div class="stage">${boardHTML(s)}</div><aside class="statpanel"></aside></div>`;
    if (SC_BOARD.includes(s.phase))
      return `<div class="stage">${boardHTML(s)}</div>`;
  }
  if (isBb(s))
    switch (s.phase) {
      case "topic":
        return topicHTML(s, R.me, whoHTML(s));
      case "tvote":
        return tvoteHTML(s, R.me);
      case "seeds":
        return seedsHTML(s, R.me);
      case "podium":
        return podiumHTML(s);
      case "results":
        return '<div class="bb-results"><div class="statpanel bb-statpanel"></div></div>';
    }
  return s.phase === "submit"
    ? viewSubmit(s)
    : s.phase === "results"
      ? viewResults(s)
      : s.phase === "over"
        ? viewOver(s)
        : `<div class="stage">${boardHTML(s)}</div>`;
}
