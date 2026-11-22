/* ---------- round ----------
   Moved out of game.js to keep that file small (a pure move). It imports back from game.js, which imports it. */
import {
  R,
  S,
  caseKey,
  knocked,
  losers,
  me,
  onBoardPhase,
  recorded,
  seedShift,
  setRecorded,
  setLosers,
  setSeedShift,
} from "./game.js";

import { boardHTML } from "./gameboard.js";

import { esc } from "./ui.js";

import {
  isWyr,
  isDdr,
  ddrStats,
  isBb,
  isLaw,
  wyrStats,
  isSc,
  textMax,
} from "./rules.js";

import { lawStats } from "./lawrules.js";

import { scStats } from "./scrules.js";

import { bbMatch, bbStats } from "./bbrules.js";

import { statsHTML as storyStatsHTML } from "./story.js";

import { lawStatsHTML, lawOverHTML, sideColor } from "./court.js";

import { cloudHTML, matchColors, allOut } from "./brackets.js";

import { hasKey, confettiRain } from "./specials.js";

import { isSb, sbOnBoard, boardDuck, sbMay } from "./sandboxrules.js";

import { sbCheat } from "./sbmenu.js";

import { sbSettings } from "./sbspawnview.js";

import { duckSVG } from "./duck.js";

import { seenDuck, seenName } from "./looks.js";

import { nameHTML } from "./name.js";

import { rainbowHTML } from "./art.js";

import { statBoxHTML, ddrBoxHTML } from "./stats.js";

import { profile, save, statMode } from "./store.js";

import { shareLook } from "./customize.js";

import { knockOff, bothOff } from "./duel.js";

import { isQuack } from "./quackrules.js";

import { quackStatsHTML } from "./quack.js";

import { isDn, dnStats } from "./duncerules.js";

import { DN_COLORS, dnStatsHTML, dnOverHTML } from "./dunce.js";

import { isMgj, mgjStats } from "./mgjrules.js";

import { mgjStatsHTML, mgjOverHTML } from "./mgj.js";

import { isVd, isDate, turnedDown, vdStats } from "./vddrules.js";

import { vdStatsHTML } from "./vdd.js";

import { isTv, tvStats } from "./triviarules.js";

import { tvStatsHTML } from "./trivia.js";

/* ---------- the views ---------- */
/* a question shows in its writer's font */
export const writerFont = (s) => {
  const q = s.qs[s.qi],
    p = q && s.players[q.by];
  return p && p.nameStyle && p.nameStyle.font;
}; // (its id)
export const lordHTML = (s) => cloudHTML(s.players[s.qs[s.qi].by] || null);

export function viewSubmit(s) {
  const mineDone = s.done[R.me],
    sent = (s.subs || []).find((q) => q.by === R.me);
  const what = isLaw(s)
    ? "topic"
    : isDn(s)
      ? "take"
      : isDdr(s)
        ? "statement"
        : "question";
  return `<div class="submit-wrap">${
    mineDone
      ? `<div class="panel submit-card done-card"><h2>${sent ? `${what[0].toUpperCase() + what.slice(1)} sent ✓` : `No ${what} this round`}</h2>
      ${sent ? `<p class="q-echo">${esc(sent.text)}</p>` : ""}<p class="dim">Waiting for the others.</p></div>`
      : isLaw(s)
        ? `<form class="panel submit-card" autocomplete="off"><h2>Your topic</h2>
      <p class="small dim">Someone else will have to defend it, so make it worth arguing about. Nobody sees it until its case.</p>
      <textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="Pineapple belongs on pizza." aria-label="Your topic"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
        : isDn(s)
          ? `<form class="panel submit-card" autocomplete="off"><h2>Your take</h2>
      <p class="small dim">Something controversial enough to argue about. ${s.options.dunceTakes === "own" ? "You defend your own take." : s.options.dunceTakes === "notOwn" || +s.options.noOwn ? "Someone else will have to defend it." : "It goes to a random duck, maybe you."} Nobody is told who wrote it.</p>
      <textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="Cereal is a soup." aria-label="Your take"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
          : isDdr(s)
            ? `<form class="panel submit-card" autocomplete="off"><h2>Your statement</h2>
      <p class="small dim">Something people might relate to, or might not.</p>
      <textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="I've laughed at my own joke before anyone else." aria-label="Your statement"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
            : `<form class="panel submit-card" autocomplete="off"><h2>Your question</h2>
      ${
        isWyr(s)
          ? `<p class="wyr-head">Would you rather…</p><div class="wyr-pair">
        <textarea data-note-box class="wyr-in" data-side="a" maxlength="${Math.min(100, textMax(s))}" rows="3" placeholder="Lose every right ever and become data breached" aria-label="The first choice"></textarea>
        <span class="wyr-or-word">OR</span>
        <textarea data-note-box class="wyr-in" data-side="b" maxlength="${Math.min(100, textMax(s))}" rows="3" placeholder="Admit Justin is right about data breaching" aria-label="The second choice"></textarea></div>`
          : `<textarea data-note-box maxlength="${textMax(s)}" rows="3" placeholder="Data breaching is a serious problem, and IDIOTS don't understand what I am saying!" aria-label="Your question"></textarea>`
      }
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <div class="sect"><h3 data-tip="How long everyone gets to answer your question.">Answer time</h3><div class="row">${[
        [0, "Off"],
        [30, "30 s"],
        [60, "60 s"],
        [90, "90 s"],
      ]
        .map(
          ([v, n]) =>
            `<button type="button" class="tile" data-time="${v}" aria-pressed="${v === s.options.answerTime}">${n}</button>`,
        )
        .join("")}</div></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
  }
    <div class="who">${whoHTML(s)}</div></div>`;
}
export const whoHTML = (s) =>
  s.seat
    .map(
      (id) =>
        `<span class="who-chip${s.done[id] ? " done" : ""}">${duckSVG(seenDuck(s.players[id]), { size: 26, shadow: false })}${nameHTML(s.players[id].name, seenName(s.players[id]))}${s.done[id] ? " ✓" : ""}</span>`,
    )
    .join("");

/* the stat boxes: this round's, then every round's once the review vote passes (redrawn as jumps and votes come in) */
export function statsHTML(s) {
  if (isQuack(s)) return quackStatsHTML(s);
  if (isSc(s)) return storyStatsHTML(s);
  if (isWyr(s)) return wyrStatsHTML(s);
  if (isLaw(s)) return s.phase === "over" ? lawOverHTML(s) : lawStatsHTML(s);
  if (isDn(s)) return s.phase === "over" ? dnOverHTML(s) : dnStatsHTML(s);
  if (isMgj(s)) return s.phase === "over" ? mgjOverHTML(s) : mgjStatsHTML(s);
  if (isVd(s)) return vdStatsHTML(s);
  if (isTv(s)) return tvStatsHTML(s);
  const boxes = (r) =>
    s.seat
      .map((id) => (isDdr(s) ? ddrBoxHTML : statBoxHTML)(s, id, r))
      .join("");
  if (s.phase === "over") return boxes(null);
  return `<h2>Round ${s.round + 1}</h2><div class="statboxes">${boxes(s.round)}</div>
    ${s.review ? `<h2 class="all-h">All rounds</h2><div class="statboxes">${boxes(null)}</div>` : ""}`;
}
/* Would You Rather's stats: the round's awards (ties named together), then each player's sides */
function wyrStatsHTML(s) {
  const nm = (id) =>
    s.players[id]
      ? nameHTML(s.players[id].name, seenName(s.players[id]))
      : "Gone";
  const block = (round) => {
    const { per, questions } = wyrStats(s, round),
      ids = Object.keys(per).filter((id) => s.players[id]);
    /* the best (or the least) of a number; everyone tied at the top is named */
    const top = (f, low = false, ok = () => true) => {
      const xs = ids.filter(ok).map((id) => [id, f(per[id])]);
      if (!xs.length) return null;
      const v = low
        ? Math.min(...xs.map((x) => x[1]))
        : Math.max(...xs.map((x) => x[1]));
      return { v, who: xs.filter((x) => x[1] === v).map((x) => x[0]) };
    };
    const writers = (id) => per[id].written > 0,
      avg = (p) => p.split / p.written;
    const jx = s.seat.map((id) => [id, (s.jumps || {})[id] || 0]),
      jv = Math.max(0, ...jx.map((x) => x[1])),
      jumps = jv
        ? { v: jv, who: jx.filter((x) => x[1] === jv).map((x) => x[0]) }
        : null;
    const award = (title, r, line) =>
      r && r.who.length
        ? `<div class="award"><h3>${esc(title)}</h3><p>${r.who.map(nm).join(r.who.length > 2 ? ", " : " and ")}${r.who.length > 1 ? ' <span class="dim">(tie)</span>' : ""}</p><p class="small dim">${line(r.v)}</p></div>`
        : "";
    const most = top(avg, false, writers),
      least = top(avg, true, writers),
      contra = top((p) => p.min),
      band = top((p) => p.maj);
    return `<div class="awards">${award("Started the most disagreement", most && most.v > 0 ? most : null, (v) => (v >= 0.999 ? "Their questions split the room right down the middle." : `Their questions split the room the most evenly (${Math.round(v * 100)}% of an even split).`))}
      ${award("Started the least disagreement", least && most && least.v !== most.v ? least : null, (v) => (v === 0 ? "Everyone picked the same side on their questions." : `Their questions split the room the least (${Math.round(v * 100)}% of an even split).`))}
      ${award("Contrarian", contra && contra.v ? contra : null, (v) => `On the smaller side ${v} time${v === 1 ? "" : "s"}.`)}
      ${award("Bandwagoner", band && band.v ? band : null, (v) => `With the bigger side ${v} time${v === 1 ? "" : "s"}.`)}
      ${award("Most jumps", jumps, (v) => `${v} jump${v === 1 ? "" : "s"}.`)}</div>
      <div class="wyr-qs panel">${questions.map((q) => `<p class="small"><span class="dim">${q.by && s.players[q.by] ? esc(s.players[q.by].name) : "?"}:</span> ${esc(q.text)} <b class="wyr-split"><span class="a">${q.A}</span> · <span class="b">${q.B}</span></b></p>`).join("")}</div>`;
  };
  return `<h2>Round ${s.round + 1}</h2>${block(s.round)}${s.review ? `<h2 class="all-h">All rounds</h2>${block(null)}` : ""}`;
}
export const viewResults = (s) =>
  `<div class="results"><div class="stage">${boardHTML(s)}</div><aside class="statpanel"></aside></div>`;
export const viewOver = (
  s,
) => `<div class="over"><h1 class="over-title">${rainbowHTML("Game over")}</h1>
    <p class="dim">${s.round + 1} round${s.round ? "s" : ""} · ${isMgj(s) ? `${(s.mgjPast || []).length} fight${(s.mgjPast || []).length === 1 ? "" : "s"}` : `${s.history.length} ${isLaw(s) ? "case" : isDn(s) ? "take" : "question"}${s.history.length === 1 ? "" : "s"}`}</p>
    <div class="statboxes grid"></div></div>`;

/* my all-time stats: a round counts once its stats are up (not in test rooms), a game with its first round I played */
export function recordRound(s) {
  const key = `${s.id}:${s.startedAt}:${s.round}`;
  if (key === recorded) return;
  setRecorded(key);
  if (s.test) return;
  const st = profile.stats[statMode(s)];
  if (isQuack(s)) {
    // Who is the Quack?: my votes (and the right ones), the round won or lost, and won as the Quack
    const r = (s.wqPast || []).slice(-1)[0];
    if (!st || !r || !r.ids.includes(R.me)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    const mine = r.votes.map((v) => v.who[R.me]).filter(Boolean),
      q = r.quacks.includes(R.me);
    st.rounds++;
    st.answers += mine.length;
    st.majority += mine.filter((t) => r.quacks.includes(t)).length;
    if (r.win) {
      if ((r.win === "quack") === q) {
        st.wins++;
        if (q) st.titles++;
      } else st.losses++;
    }
    save();
    shareLook();
    return;
  }
  if (isLaw(s)) {
    // Lawyering: my cases argued, won, lost and given up, and my jury votes
    const p = lawStats(s, s.round).per[R.me];
    if (!st || !p || !(p.argued || p.votes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.votes;
    st.argued += p.argued;
    st.wins += p.won;
    st.losses += p.lost;
    st.gave += p.gave;
    save();
    shareLook();
    return;
  }
  if (isDn(s)) {
    // Duncelation: my takes defended, not a dunce and a dunce, and my votes
    const p = dnStats(s, Math.max(0, ((s.dn && s.dn.dkN) || 0) - 1)).per[R.me];
    if (!st || !p || !(p.turns || p.votes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.votes;
    st.argued += p.turns;
    st.wins += p.turns - p.dunced;
    st.losses += p.dunced;
    save();
    shareLook();
    return;
  }
  if (isTv(s)) {
    // Trivia: my answers this round, right and wrong, and the questions I wrote
    const w = tvStats(s, s.round).per[R.me];
    if (!st) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    if (w) {
      st.answers += w.right + w.wrong;
      st.wins += w.right;
      st.losses += w.wrong;
      st.titles += w.asked;
    }
    save();
    shareLook();
    return;
  }
  if (isVd(s)) {
    // Valentine's Duck Date: my dates, the game won (the Valentine) or lost (Turned Down), and my games as The Date
    const V = s.vd,
      p = vdStats(s).per[R.me];
    if (!st || !V) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds += V.turn || 0;
    st.argued += p ? p.dates : 0;
    if (V.val === R.me) st.wins++;
    else if (turnedDown(s, R.me)) st.losses++;
    if (isDate(s, R.me)) st.titles++;
    save();
    shareLook();
    return;
  }
  if (isMgj(s)) {
    // Mad God Justin: my fights, won and lost, my stabs, the times he got me, my killing blows
    const f = (s.mgjPast || []).slice(-1)[0],
      p = mgjStats(s).per[R.me];
    if (!st || !f || !p || !(f.ids || []).includes(R.me)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.dmg;
    st.majority += p.hits;
    st.titles += p.kills;
    if (f.won) st.wins++;
    else st.losses++;
    save();
    shareLook();
    return;
  }
  if (isSc(s)) {
    // Story Chain: my lines, and the votes for my lines and my secret word
    const p = scStats(
      s.sc.stories.flatMap((x) => x.paras).filter((x) => x.round === s.round),
    )[R.me];
    if (!st || !p || !(p.lines || p.lvotes || p.wvotes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.lines;
    st.wins += p.lvotes;
    st.titles += p.wvotes;
    save();
    shareLook();
    return;
  }
  if (isBb(s)) {
    // Bicker Brackets: my votes in matches, my seeds' wins and losses, and a tournament won
    const t = (s.bbPast || []).slice(-1),
      p = bbStats(t)[R.me];
    if (!st || !p || !(p.votes || p.wins || p.losses)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) {
      profile.stats.lastGame = game;
      st.games++;
    }
    st.rounds++;
    st.answers += p.votes;
    st.wins += p.wins;
    st.losses += p.losses;
    st.titles += p.titles;
    save();
    shareLook();
    return;
  }
  const mine = s.history.filter(
    (h) => h.round === s.round && h.a[R.me] !== undefined,
  );
  if (!st || !mine.length) return;
  const game = `${s.id}:${s.startedAt}`;
  if (profile.stats.lastGame !== game) {
    profile.stats.lastGame = game;
    st.games++;
  }
  st.rounds++;
  st.answers += mine.length;
  if (isWyr(s)) {
    const p = wyrStats(s, s.round).per[R.me] || {};
    st.majority += p.maj || 0;
    st.minority += p.min || 0;
  } // which side I was on
  else if (isDdr(s)) {
    const p = ddrStats(s, R.me, s.round);
    st.majority += p.yes;
    st.minority += p.no;
  } // (Does Duck Relate?: related, and didn't)
  else for (const h of mine) st.counts[h.a[R.me]]++;
  save();
  shareLook();
}

/* Sandbox on the board: the build (spawn, respawn, loot or zone) my duck stands by, { id, label }, or null: its settings
   open with E or the button, as on Duck Cabin and Downpour (sbspawnview.js near). The owner, Nov 19 16:17Z: "interact
   button shows on the interactable builds". Only for who may build (B) */
export let lastSbGo = "";
export const setLastSbGo = (v) => {
  lastSbGo = v;
};
const SB_LABELS = {
  spawn: "Spawn settings",
  loot: "Loot settings",
  zone: "Zone settings",
};
export function sbGo(s) {
  if (!isSb(s) || !sbOnBoard(s) || !me || !onBoardPhase()) return null;
  if (!sbMay(s, R.me, "b") || !sbCheat.on) return null;
  let best = null,
    bd = 1.6;
  for (const [id, p] of Object.entries((s.sb && s.sb.pts) || {})) {
    if (p.grp) continue;
    const d = Math.hypot(
      (p.x - me.x) / boardDuck(s)[0],
      (p.y - me.y) / boardDuck(s)[1],
    );
    if (d < bd) {
      bd = d;
      best = { id, label: SB_LABELS[p.k] || "Respawn settings" };
    }
  }
  return best;
}
export const sbGoOpen = () => {
  const g = sbGo(R.state);
  if (g) sbSettings(() => R, g.id);
};
/* the middle of the bottom bar: what you can do now, and how many are done */
/* the moment specials that fire on their own: confetti over the screen for the Round Lord, a match's winner and the champion */
export function celebrate(s) {
  if (isQuack(s)) {
    // the round's winners (after the drumroll)
    const r = s.phase === "reveal" && s.wq.result;
    if (!r || !r.win) return;
    const won = s.wq.ids.filter(
      (id) => (r.win === "quack") === r.quacks.includes(id) && s.players[id],
    );
    if (won.some((id) => hasKey(s.players[id].duck, "confetti")))
      setTimeout(confettiRain, s.wq.lastOut ? 6100 : 600);
    return;
  }
  let p = null;
  if (s.phase === "answer" && !isBb(s) && !isLaw(s))
    p = s.players[(s.qs[s.qi] || {}).by];
  if (s.phase === "discuss" && isLaw(s) && s.law && s.law.w >= 0)
    p = s.players[s.law.w ? s.law.def : s.law.off];
  const m = isBb(s) && bbMatch(s);
  if (s.phase === "discuss" && m && m.w != null && !s.options.bbBlind)
    p = s.players[s.bb.seeds[m.w].by];
  if (s.phase === "podium" && s.bb && s.bb.champ != null)
    p = s.players[s.bb.seeds[s.bb.champ].by];
  if (p && hasKey(p.duck, "confetti")) confettiRain();
}
/* Bicker Brackets: who wears the Loser's X (their seed just lost, or all of theirs are out), and the colors of the
   match's two sides (the writers' cards) */
export function bbMarks(s) {
  setLosers(new Set());
  if (isQuack(s) && s.wq && s.wq.result && s.wq.result.win === "room") {
    for (const id of s.wq.result.quacks) {
      const p = s.players[id];
      if (p && hasKey(p.duck, "loserx")) losers.add(id);
    }
    return;
  } // a caught Quack
  if (isDn(s)) {
    S.style.setProperty("--law-a", DN_COLORS[0]);
    S.style.setProperty("--law-b", DN_COLORS[1]);
    return;
  } // Duncelation: the sides' red and green
  if (isLaw(s) && s.law) {
    // Lawyering: the losing attorney wears the Loser's X; the sides' colors are the attorneys' cards
    const L = s.law,
      lost =
        s.phase === "discuss" && L.w != null
          ? L.w === -1
            ? [L.off, L.def]
            : [L.w ? L.off : L.def]
          : [];
    for (const id of lost) {
      const p = s.players[id];
      if (p && hasKey(p.duck, "loserx")) losers.add(id);
    }
    S.style.setProperty("--law-a", sideColor(s.players[L.off]));
    S.style.setProperty("--law-b", sideColor(s.players[L.def]));
    return;
  }
  if (!isBb(s) || !s.bb) return;
  const m = bbMatch(s),
    justLost =
      s.phase === "discuss" && m && m.w != null
        ? s.bb.seeds[m.w === m.a ? m.b : m.a]
        : null;
  for (const id of s.seat) {
    const p = s.players[id];
    if (
      p &&
      hasKey(p.duck, "loserx") &&
      ((justLost && justLost.by === id) || allOut(s, id))
    )
      losers.add(id);
  }
  if (m) {
    const [ca, cb] = matchColors(s, seedShift);
    S.style.setProperty("--seed-a", ca);
    S.style.setProperty("--seed-b", cb);
  }
}
/* while a match is voted on, its two sides slowly turn through the colors (together, so they stay apart); when the vote
   ends they keep the colors they stopped on */
export function shiftSides(s, now) {
  if (
    !isBb(s) ||
    s.phase !== "answer" ||
    !bbMatch(s) ||
    !document.documentElement.classList.contains("moving")
  )
    return;
  const deg = Math.round((Math.max(0, now - s.at) / 1000) * 4) % 360; // 4° a second: once around in a minute and a half
  if (deg === seedShift) return;
  setSeedShift(deg);
  bbMarks(s);
}
export const matchKey = (s) =>
  s.bb ? [s.startedAt, s.bb.r, s.bb.m].join() : "";
/* Bicker Brackets: the championship's votes are in, so the champion bumps the loser off the cloud (once) */
export function duel(s) {
  if (isLaw(s)) {
    // Lawyering: the winning attorney bumps the loser off; a hung jury: both jump
    const L = s.law,
      key = caseKey(s);
    if (s.phase !== "discuss" || !L || L.w == null || knocked.has(key)) return;
    knocked.add(key);
    const lord = S.querySelector(".law-top .lord.duel");
    setTimeout(() => {
      if (lord && lord.isConnected)
        L.w === -1 ? bothOff(lord) : knockOff(lord, L.w ? 0 : 1);
    }, 900);
    return;
  }
  const m =
      isBb(s) &&
      s.phase === "discuss" &&
      s.bb.r === s.bb.rounds.length - 1 &&
      bbMatch(s),
    key = matchKey(s);
  if (!m || m.w == null || knocked.has(key)) return;
  knocked.add(key);
  const lord = S.querySelector(".bb-top .lord.duel");
  setTimeout(() => {
    if (lord.isConnected) knockOff(lord, m.w === m.a ? 1 : 0);
  }, 900);
}
/* the colors of the most-voted tile (or tiles, when they tie), as the board shows them */
export function topColors(s) {
  const n = {};
  for (const id of s.seat) {
    const c = s.lock[id];
    if (c >= 0) n[c] = (n[c] || 0) + 1;
  }
  const most = Math.max(0, ...Object.values(n));
  return Object.keys(n)
    .filter((c) => n[c] === most)
    .map((c) => {
      const t = S.querySelector(`.board .cols > .col[data-c="${c}"]`);
      return t ? getComputedStyle(t).getPropertyValue("--c").trim() : "";
    })
    .filter(Boolean);
}
/* the screen as the state has it (timed for the frame-rate readout, perf.js) */
