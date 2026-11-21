/* ---------- the rules of Story Chain (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import {
  VOTE_GRACE,
  advance,
  backToLobby,
  bagPick,
  catchLen,
  catchUp,
  endBtnOn,
  enter,
  gameOver,
  needed,
  oneLine,
  playing,
  say,
  seatLate,
} from "./rules.js";
import { shuffle, anyOf } from "./random.js";

/* ---------- Story Chain ----------
   A round is one paragraph: everyone writes a secret word → the words are shared out so nobody gets their own, and a
   random order of writers is drawn → one at a time, each writer adds a sentence (160 letters at most) with their secret
   word in it, everyone watching it typed → everyone walks onto their favorite line and votes (not their own) → the secret
   words show below the story, each lit up in its line, and everyone votes for their favorite (not their own) → the stats,
   where everyone walks to what's next: continue the story (a new paragraph), a new story, or back to the lobby.

   The board is a column of zones, one under the other: the story's lines (and the line being typed), the word boxes, or
   the three choices. A duck's y covers the zones evenly (zone k is k/n to (k + 1)/n), so it stands on the same line on
   every screen however the lines wrap. */
export const SC_PHASES = ["words", "write", "lvote", "wvote", "results"];
export const SC_BOARD = ["write", "lvote", "wvote", "results"];
export const SC_VOTES = ["lvote", "wvote", "results"];
export const LINE_MAX = 160,
  WORD_MAX = 20;
export const SC_NEXT = [
  ["cont", "Continue the story"],
  ["new", "A new story"],
  ["lobby", "Back to the lobby"],
];
/* a secret word for a writer nobody else wrote one for */
export const SC_WORDS = [
  "pineapple",
  "kazoo",
  "sunglasses",
  "crumbs",
  "trampoline",
  "mustache",
  "volcano",
  "spaghetti",
  "penguin",
  "glitter",
  "toaster",
  "pickle",
  "unicorn",
  "noodle",
  "bathtub",
  "banana",
];
export const cleanWord = (v) =>
  (
    String(v || "")
      .trim()
      .split(/\s+/)[0] || ""
  )
    .replace(/[^\p{L}\p{N}'-]/gu, "")
    .slice(0, WORD_MAX);
/* where the word sits in a line (any capitals, inside a longer word too), or -1 */
export const wordAt = (text, word) =>
  word ? String(text).toLowerCase().indexOf(String(word).toLowerCase()) : -1;
export const scStory = (s) => s.sc && s.sc.stories[s.sc.stories.length - 1];
export const scPara = (s) => {
  const st = scStory(s);
  return st && st.paras[st.paras.length - 1];
};
export const scWriter = (s) => s.sc && s.sc.order[s.sc.turn];
/* the board's zones in a phase: "p.i" line i of paragraph p, T the line being typed, W:id the word id wrote, H the top of
   the choices, C:cont / C:new / C:lobby the choices */
export function scZones(s, phase = s.phase) {
  const st = scStory(s);
  if (!st) return [];
  if (phase === "results") return ["H", ...SC_NEXT.map((c) => "C:" + c[0])];
  const z = [];
  st.paras.forEach((p, i) => p.lines.forEach((l, j) => z.push(i + "." + j)));
  if (phase === "write") z.push("T");
  if (phase === "wvote")
    for (const l of scPara(s).lines)
      if (l.wordBy && s.players[l.wordBy] && !z.includes("W:" + l.wordBy))
        z.push("W:" + l.wordBy);
  return z;
}
export const zoneAt = (s, y, zones = scZones(s)) =>
  zones.length
    ? zones[
        Math.max(0, Math.min(zones.length - 1, Math.floor(y * zones.length)))
      ]
    : null;
/* the line a zone holds: { p, i, line } (current paragraph or not) */
export function scLineOf(s, z) {
  const m = /^(\d+)\.(\d+)$/.exec(z || ""),
    st = scStory(s);
  if (!m || !st) return null;
  const p = +m[1],
    i = +m[2],
    para = st.paras[p],
    line = para && para.lines[i];
  return line ? { p, i, line, now: p === st.paras.length - 1 } : null;
}
/* can this player vote for what's in this zone? (their own line or word: no) */
export function scCanVote(s, id, z, phase = s.phase) {
  if (phase === "lvote") {
    const l = scLineOf(s, z);
    return !!(l && l.now && l.line.by !== id);
  }
  if (phase === "wvote") return /^W:/.test(z || "") && z.slice(2) !== id;
  if (phase === "results") return /^C:/.test(z || "");
  return false;
}
/* ducks keep their zone when the zones change (a line is added, the word boxes come): from, to = the zones before and
   after; alias names where a zone went (the line being typed became a line) */
function scRezone(s, from, to, alias = {}) {
  if (!to.length) return;
  for (const p of Object.values(s.pos)) {
    const u = Math.max(0, Math.min(0.9999, p.y)) * Math.max(1, from.length),
      k = Math.floor(u),
      f = u - k,
      key = alias[from[k]] ?? from[k];
    let j = to.indexOf(key);
    if (j < 0) j = Math.min(k, to.length - 1);
    p.y = (j + f) / to.length;
  }
}
/* a round: a new paragraph of the story (fresh: a new story) */
export function startStory(s, now, fresh) {
  seatLate(s);
  if (fresh || !s.sc.stories.length) s.sc.stories.push({ paras: [] });
  Object.assign(s.sc, { words: {}, order: [], turn: 0, assign: {}, next: {} });
  s.subs = [];
  s.drafts = {};
  s.qi = 0;
  s.pos = {};
  s.lock = {};
  return enter(s, "words", now);
}
/* the words are in: shared out so nobody writes with their own (a game word for anyone left over), the writers drawn in
   a random order, and the first one starts the paragraph */
function endWords(s, now) {
  const sc = s.sc;
  for (const id of s.seat) {
    const d = (s.drafts || {})[id];
    if (!sc.words[id] && d && cleanWord(d.text))
      sc.words[id] = cleanWord(d.text);
  }
  s.drafts = {};
  const order = shuffle(playing(s)),
    first = bagPick(s, "sc first", order);
  if (first) order.unshift(...order.splice(order.indexOf(first), 1)); // (the first writer comes from the bag)
  const authors = Object.keys(sc.words).filter((id) => s.players[id]);
  if (!order.length) return s;
  let best = null;
  for (let k = 0; k < 40 && !(best && best.left === 0); k++) {
    // a few random tries; the one with the fewest game words wins
    const pool = shuffle([...authors]),
      out = {};
    let left = 0;
    for (const w of order) {
      const i = pool.findIndex((a) => a !== w);
      if (i < 0) {
        left++;
        continue;
      }
      out[w] = pool.splice(i, 1)[0];
    }
    if (!best || left < best.left) best = { out, left };
  }
  const spare = shuffle(
    SC_WORDS.filter(
      (w) => !Object.values(sc.words).some((x) => x.toLowerCase() === w),
    ),
  );
  /* Lines per player: the writers go round that many times before the paragraph ends */
  const laps = Math.max(1, Math.min(4, Math.round(+s.options.scLines) || 1));
  sc.order = Array.from({ length: laps }, () => order).flat();
  sc.turn = 0;
  sc.assign = Object.fromEntries(
    order.map((w, i) => {
      const by = best.out[w];
      return [
        w,
        by
          ? { word: sc.words[by], by }
          : { word: spare[i % spare.length] || anyOf(SC_WORDS), by: null },
      ];
    }),
  );
  scStory(s).paras.push({ round: s.round, lines: [], votes: {}, wvotes: {} });
  const n = scZones(s, "write").length;
  s.seat.forEach((id, k) => {
    s.pos[id] = { x: (k + 1) / (s.seat.length + 1), y: (n - 0.98) / n };
  }); // everyone starts just over the line being typed, so it shows
  return writeTurn(s, now);
}
function writeTurn(s, now) {
  s.qi++;
  s.subs = [];
  s.drafts = {};
  return enter(s, "write", now);
}
/* a writer is done (sent it, ran out of time, or left): their line joins the story, and the next writer goes */
function endTurn(s, now) {
  const sc = s.sc,
    w = scWriter(s),
    para = scPara(s),
    sub = (s.subs || []).find((x) => x.by === w),
    d = (s.drafts || {})[w];
  const text = oneLine(sub ? sub.text : d ? d.text : "", LINE_MAX).trim(),
    from = scZones(s, "write");
  if (text && s.players[w]) {
    const as = sc.assign[w] || {};
    para.lines.push({
      by: w,
      text,
      word: as.word || "",
      wordBy: as.by || null,
      ms: Math.max(0, now - s.at),
    });
    scRezone(s, from, scZones(s, "write"), {
      T: scStory(s).paras.length - 1 + "." + (para.lines.length - 1),
    });
  } else if (s.players[w]) say(s, `${s.players[w].name} skipped their line.`);
  s.subs = [];
  s.drafts = {};
  if (++sc.turn < sc.order.length) return writeTurn(s, now);
  if (!para.lines.length) {
    say(s, "No lines this time.");
    scStory(s).paras.pop();
    return startNext(s, now);
  }
  if (!scVoting(s)) {
    para.noVote = true;
    return startNext(s, now);
  } // no voting: on to the stats and what comes next
  scRezone(s, scZones(s, "write"), scZones(s, "lvote")); // (a duck by the line being typed: onto the last line)
  return enter(s, "lvote", now);
}
/* is there voting on this paragraph's lines and words (the lobby's Voting option)? */
const scVoting = (s) =>
  s.options.scVote === "auto" || s.options.scVote == null
    ? playing(s).length >= 4
    : !!+s.options.scVote;
/* the stats, with the three choices: everyone starts at the top of them */
export function startNext(s, now) {
  s.sc.next = {};
  s.reviewVotes = {};
  s.review = false;
  if (+s.options.stats === 0) {
    s.round++;
    return startStory(s, now, false);
  } // (no stats screen, so no choices: the story goes on)
  s.seat.forEach((id, k) => {
    s.pos[id] = { x: (k + 1) / (s.seat.length + 1), y: 0.125 };
  });
  return enter(s, "results", now);
}
/* a vote: stand on a line, a word or a choice and end your turn; it can't be taken back */
export function scVote(s, a, now) {
  const me = s.players[a.id];
  if (
    !me ||
    me.late ||
    !SC_VOTES.includes(s.phase) ||
    s.done[a.id] ||
    !s.pos[a.id] ||
    now < s.at + VOTE_GRACE * 1000
  )
    return null;
  if (typeof a.y === "number" && isFinite(a.y))
    s.pos[a.id].y = Math.max(0, Math.min(1, +a.y)); // (where I stood when I voted)
  const z = zoneAt(s, s.pos[a.id].y);
  if (!scCanVote(s, a.id, z)) return null;
  const para = scPara(s);
  if (s.phase === "lvote") para.votes[a.id] = scLineOf(s, z).i;
  if (s.phase === "wvote") para.wvotes[a.id] = z.slice(2);
  if (s.phase === "results") s.sc.next[a.id] = z.slice(2);
  s.done[a.id] = true;
  return advance(s, now);
}
/* a secret word or a line: sent (send) or typed so far (a draft; everyone sees a line as it's typed) */
export function scWrite(s, a, now, send) {
  const me = s.players[a.id];
  if (!me || me.late || s.done[a.id]) return null;
  if (s.phase === "words") {
    if (!send) {
      s.drafts = { ...(s.drafts || {}), [a.id]: { text: cleanWord(a.text) } };
      return s;
    }
    const w = cleanWord(a.text);
    if (w) s.sc.words[a.id] = w;
    else delete s.sc.words[a.id];
    s.done[a.id] = true;
    return advance(s, now);
  }
  if (s.phase !== "write" || scWriter(s) !== a.id) return null;
  const text = oneLine(a.text, LINE_MAX);
  if (!send) {
    s.drafts = { [a.id]: { text } };
    return s;
  }
  if (!text.trim() || wordAt(text, (s.sc.assign[a.id] || {}).word) < 0)
    return null; // the secret word has to be in it
  s.subs = [{ by: a.id, text: text.trim() }];
  s.done[a.id] = true;
  return advance(s, now);
}
/* who is through with a Story Chain step: done, or with nothing to vote for (only their own line or word left) */
export const scFreeOf = (s) => {
  const zs = SC_VOTES.includes(s.phase) ? scZones(s) : [];
  return (id) =>
    s.done[id] || (zs.length && !zs.some((z) => scCanVote(s, id, z)));
};
/* what ends a Story Chain phase: the words when enough are in (then the catch-up timer for the rest); a line when its
   writer is done, out of time or gone; a vote once enough have voted (no timer: there is time to sway each other) */
export function scAdvance(s, now, force = false) {
  // force: the skip command or a skip vote, as if everyone were done
  const free = scFreeOf(s);
  const on = playing(s),
    d = force ? on.length : on.filter(free).length,
    timeUp = force || (s.ends && now >= s.ends),
    enough = force || d >= needed(s);
  switch (s.phase) {
    case "words":
      catchUp(s, now, enough && d < on.length);
      return d >= on.length ||
        timeUp ||
        ((enough || s.catchEnds) &&
          (!catchLen(s) || (s.catchEnds && now >= s.catchEnds)))
        ? endWords(s, now)
        : s;
    case "write": {
      const w = scWriter(s);
      return !s.players[w] || s.done[w] || timeUp ? endTurn(s, now) : s;
    }
    case "lvote":
      if (endBtnOn(s) && !force) return s; // (End round: only the button ends the vote)
      if (!enough) return s;
      if (!scPara(s).lines.some((l) => l.wordBy && s.players[l.wordBy]))
        return startNext(s, now); // no words to vote on
      {
        const from = scZones(s);
        s.phase = "wvote";
        const to = scZones(s);
        s.phase = "lvote";
        scRezone(s, from, to);
      }
      return enter(s, "wvote", now);
    case "wvote":
      if (endBtnOn(s) && !force) return s;
      return enough ? startNext(s, now) : s;
    case "results": {
      if (!enough) return s;
      const n = { cont: 0, new: 0, lobby: 0 };
      for (const [id, c] of Object.entries(s.sc.next))
        if (s.players[id] && n[c] !== undefined) n[c]++;
      if (force && !n.cont && !n.new && !n.lobby) n.cont = 1; // skipped with no choices made: the story goes on
      const top = Math.max(...Object.values(n)),
        best = Object.keys(n).filter((k) => n[k] === top),
        pick = anyOf(best),
        name = SC_NEXT.find((c) => c[0] === pick)[1];
      say(
        s,
        best.length > 1
          ? `A tie! A coin toss: ${name.toLowerCase()}.`
          : `${name}!`,
      );
      if (pick === "lobby") return backToLobby(s, "Back to the lobby.");
      const over = gameOver(s, now); // (Vote return, or Random: the next paragraph is the next game)
      if (over) return over;
      s.round++;
      return startStory(s, now, pick === "new");
    }
  }
  return s;
}
/* the numbers behind the stats, over a list of paragraphs: votes for each player's lines and words, time spent writing */
export function scStats(paras) {
  const per = {},
    P = (id) =>
      (per[id] = per[id] || {
        lines: 0,
        lvotes: 0,
        wvotes: 0,
        ms: 0,
        best: null,
        bestN: 0,
        word: "",
        wordN: 0,
      });
  for (const para of paras) {
    const ln = para.lines.map(() => 0),
      wn = {};
    for (const i of Object.values(para.votes || {}))
      if (ln[i] !== undefined) ln[i]++;
    for (const by of Object.values(para.wvotes || {}))
      wn[by] = (wn[by] || 0) + 1;
    para.lines.forEach((l, i) => {
      const p = P(l.by);
      p.lines++;
      p.lvotes += ln[i];
      p.ms += l.ms || 0;
      if (ln[i] > p.bestN) {
        p.best = l.text;
        p.bestN = ln[i];
      }
      if (l.wordBy) {
        const q = P(l.wordBy),
          k = wn[l.wordBy] || 0;
        if (k > q.wordN || !q.word) {
          q.word = l.word;
          q.wordN = Math.max(q.wordN, k);
        }
      }
    });
    for (const [by, k] of Object.entries(wn)) P(by).wvotes += k;
  }
  return per;
}
