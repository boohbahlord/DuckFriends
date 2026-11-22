/* ---------- the rules of Lawyering (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import {
  bagPick,
  colAt,
  discussOn,
  enter,
  lostRound,
  playing,
  say,
  seatLate,
  startResults,
  waitFor,
} from "./rules.js";

/* ---------- Lawyering ----------
   Everyone writes a topic in secret; each topic is a court case. Its attorneys: the defense (argues for it; never its
   writer) and the offense (argues against it; may be its writer), picked at random, by the writer or by a vote of the
   room (the host's choice, for each) → the attorneys stand in the circle in the middle and argue over voice while the
   jury (everyone else) walks to a side and votes: left with the offense, right with the defense. A vote can change at
   any time. No timer until every juror has voted: all on one side ends the case at once; a split jury gets closing
   arguments (a minute by default), and when it runs out the bigger side wins (a tie: nobody does). In closing arguments
   an attorney who isn't ahead may give up. → the verdict, talked over → the next case → the round's stats. */
export const isCounsel = (s, id) =>
  !!(s.law && (s.law.def === id || s.law.off === id));
/* the jury: everyone playing but the two attorneys */
export const jury = (s) =>
  playing(s).filter((id) => s.players[id] && !isCounsel(s, id));
/* the jury's votes: [offense, defense] */
export function lawTally(s) {
  const n = [0, 0];
  for (const id of jury(s)) {
    const v = (s.law.votes || {})[id];
    if (v === 0 || v === 1) n[v]++;
  }
  return n;
}
/* in closing arguments, an attorney may give up while their side isn't ahead */
export function canGiveUp(s, id) {
  const L = s.law;
  if (!L || !L.close || L.w != null || !isCounsel(s, id)) return false;
  const [o, d] = lawTally(s);
  return id === L.off ? o <= d : d <= o;
}
export function startCase(s, now) {
  seatLate(s);
  const q = s.qs[s.qi],
    on = playing(s).filter((id) => s.players[id]);
  s.lordTime = 0;
  s.pos = {};
  s.lock = {};
  s.ends = 0;
  s.law = {
    def: null,
    off: null,
    how: {},
    picks: { def: {}, off: {} },
    votes: {},
    flips: {},
    close: 0,
    start: null,
    w: null,
    gave: null,
  };
  if (s.seat.length < 3) {
    s.law = null;
    return waitFor(s, now, "case");
  } // (two attorneys and a jury: the case waits for players)
  if (on.length < 3) {
    say(s, `Not enough players for a jury, so "${q.text}" is dismissed.`);
    return nextCase(s, now);
  } // (the rest joined mid-round)
  const writer = s.players[q.by] && on.includes(q.by) ? q.by : null,
    how = { def: s.options.lawDef, off: s.options.lawOff };
  for (const k of ["def", "off"])
    if (how[k] === "writer" && !writer) how[k] = "random"; // (the writer left: random)
  if (+s.options.lawVote) {
    s.law.how = { def: "vote", off: "vote" };
    s.seat.forEach((id, k) => {
      s.pos[id] = { x: (k + 1) / (s.seat.length + 1), y: 0.96 };
    }); // (everyone along the bottom edge, under the window)
    return enter(s, "lawdef", now);
  } // (the attorney vote: the defense first, then the offense)
  s.law.how = Object.fromEntries(
    Object.entries(how).filter(([, v]) => v === "writer" || v === "vote"),
  );
  if (!Object.keys(s.law.how).length) return openCase(s, now);
  enter(s, "counsel", now);
  for (const id of on) s.done[id] = counselDone(s, id);
  return s;
}
export function nextCase(s, now) {
  if (++s.qi < s.qs.length) return startCase(s, now);
  return startResults(s, now);
}
/* who can be picked: the defense never the writer; the offense never the defense (once it's known) */
export function counselOk(s, role, who) {
  const q = s.qs[s.qi];
  if (!playing(s).includes(who) || !s.players[who]) return false;
  if (+s.options.noOwn && who === q.by) return false; // (Don't get your own prompt: the writer is no attorney)
  return role === "def" ? who !== q.by : who !== s.law.def;
}
/* has this player picked everything they're asked to? */
export function counselDone(s, id) {
  const q = s.qs[s.qi];
  return Object.entries(s.law.how).every(
    ([role, how]) =>
      (how === "writer" && id !== q.by) || s.law.picks[role][id] !== undefined,
  );
}
/* one role's votes counted: the most-voted player who can be it, a tie settled by chance, nobody voted for chance to pick
   (a pick that clashes falls to the next best); best and top tell how it went */
function counselVote(s, role, on) {
  const ok = (id) => counselOk(s, role, id),
    n = {};
  for (const [voter, who] of Object.entries(s.law.picks[role] || {}))
    if (s.players[voter] && on.includes(who) && ok(who))
      n[who] = (n[who] || 0) + 1;
  const top = Math.max(0, ...Object.values(n)),
    best = Object.keys(n).filter((id) => n[id] === top && top > 0);
  return {
    who: bagPick(s, `law ${role}`, best.length ? best : on.filter(ok)),
    best,
    top,
  };
}
/* the picking is over: the defense first, then the offense (a pick that clashes falls to the next best, then to chance) */
export function endCounsel(s, now) {
  const L = s.law,
    on = playing(s).filter((id) => s.players[id]);
  for (const role of ["def", "off"]) L[role] = counselVote(s, role, on).who;
  return openCase(s, now);
}
/* ---------- the attorney vote (the host's setting lawVote, off by default) ----------
   Each case, once its topic shows on the cloud, a window over the board lists every duck who can be picked: the room votes
   the defense first, then the offense. Anyone may vote for themselves or anyone else, the new defense attorney too. Each
   vote lasts 0:20 and drops to 0:05 once the lobby's vote share of the room has voted. The most votes win; a tie, or no
   vote at all, is settled by the shuffle bag */
export const ATT_PHASES = ["lawdef", "lawoff"];
export const ATT_TIME = 20000,
  ATT_FAST = 5000;
export const attRole = (s) => (s.phase === "lawdef" ? "def" : "off");
export const attCands = (s) =>
  playing(s).filter((id) => s.players[id] && counselOk(s, attRole(s), id)); // (who can be voted for now)
export function attCheck(s, now, force) {
  if (!force && !(s.ends && now >= s.ends)) return s;
  const L = s.law,
    role = attRole(s),
    on = playing(s).filter((id) => s.players[id]),
    { who, best, top } = counselVote(s, role, on);
  L[role] = who;
  L.fast = 0;
  const p = s.players[L[role]];
  if (p)
    say(
      s,
      `${p.name} is the ${role === "def" ? "defense" : "offense"} attorney${best.length > 1 ? " (a tie, settled by chance)" : !top ? " (nobody voted, so chance picked)" : ""}.`,
    );
  if (role === "def") return enter(s, "lawoff", now);
  if (!s.players[L.def]) L.def = null; // (the defense left during the offense vote: openCase picks one)
  return openCase(s, now);
}
/* the case opens: random attorneys where nobody picks; each attorney on their own side (I want no circle), the jury lined
   up along the middle strip's top and bottom */
function openCase(s, now) {
  const L = s.law,
    q = s.qs[s.qi],
    on = playing(s).filter((id) => s.players[id]);
  const noOwn = +s.options.noOwn ? q.by : null; // (Don't get your own prompt: the writer is no attorney, either side)
  if (!L.def)
    L.def = bagPick(
      s,
      "law def",
      on.filter((id) => id !== q.by && id !== L.off),
    );
  if (!L.off)
    L.off = bagPick(
      s,
      "law off",
      on.filter((id) => id !== L.def && id !== noOwn),
    );
  s.pos = {};
  s.lock = {};
  s.pos[L.off] = { x: 0.3, y: 0.5 };
  s.pos[L.def] = { x: 0.7, y: 0.5 };
  const rest = s.seat.filter((id) => !isCounsel(s, id)),
    half = Math.ceil(rest.length / 2);
  rest.forEach((id, k) => {
    const top = k < half,
      i = top ? k : k - half,
      n = top ? half : rest.length - half;
    s.pos[id] = { x: 0.44 + (0.12 * (i + 1)) / (n + 1), y: top ? 0.04 : 0.96 };
  });
  const D = s.players[L.def].name,
    O = s.players[L.off].name,
    t = q.text.trim();
  say(
    s,
    `The Court Case, ${D} is defending this idea: ${t}${/[.!?…]$/.test(t) ? "" : "."} ${O} is against it.`,
  );
  return enter(s, "answer", now);
}
/* a juror votes for the side they stand on (again, to change it) */
export function lawVote(s, a, now) {
  const L = s.law,
    p = s.pos[a.id];
  if (!L || L.w != null || isCounsel(s, a.id) || !jury(s).includes(a.id))
    return null;
  const c = colAt(s, p.x);
  if (c < 0) return null;
  const was = L.votes[a.id];
  if (was === c) return null;
  if (was !== undefined)
    L.flips = { ...L.flips, [a.id]: (L.flips[a.id] || 0) + 1 };
  L.votes = { ...L.votes, [a.id]: c };
  s.done[a.id] = true;
  return lawCheck(s, now);
}
/* the case goes on until the jury has voted: all on one side wins at once; a split starts closing arguments, and when
   they run out the bigger side wins. An attorney who leaves loses the case. */
export function lawCheck(s, now, force) {
  const L = s.law;
  if (!L || L.w != null) return s;
  const hereO = !!s.players[L.off],
    hereD = !!s.players[L.def];
  if (!hereO || !hereD) {
    if (!hereO && !hereD) {
      say(s, "Both attorneys left, so the case is dismissed.");
      return nextCase(s, now);
    }
    L.left = hereO ? L.def : L.off;
    return verdict(s, hereO ? 0 : 1, now);
  }
  const j = jury(s),
    [o, d] = lawTally(s);
  if (!j.length) {
    say(s, "Nobody is left on the jury, so the case is dismissed.");
    return nextCase(s, now);
  }
  if (force) return verdict(s, o > d ? 0 : d > o ? 1 : -1, now); // skipped: the votes so far decide
  if (!L.close) {
    if (j.some((id) => L.votes[id] === undefined)) return s;
    if (!o || !d) return verdict(s, d ? 1 : 0, now);
    L.close = now + (+s.options.lawClose || 60) * 1000;
    L.start = [o, d];
    s.ends = L.close;
    say(
      s,
      `Closing arguments! The jury is split ${o}–${d}: last chance to win them over.`,
    );
    return s;
  }
  if (now < L.close) return s;
  return verdict(s, o > d ? 0 : d > o ? 1 : -1, now);
}
/* the verdict: side 0 (offense), 1 (defense) or -1 (a tie); the case joins the game's history, then the room talks it over */
export function verdict(s, side, now) {
  const L = s.law,
    q = s.qs[s.qi],
    [o, d] = lawTally(s),
    votes = {};
  for (const id of jury(s))
    if (L.votes[id] !== undefined) votes[id] = L.votes[id];
  L.w = side;
  L.end = [o, d];
  s.ends = 0;
  s.history.push({
    round: s.round,
    by: q.by,
    text: q.text,
    law: {
      def: L.def,
      off: L.off,
      votes,
      flips: { ...L.flips },
      w: side,
      start: L.start,
      end: [o, d],
      gave: L.gave,
      left: L.left || null,
    },
  });
  const W = side === 0 ? L.off : side === 1 ? L.def : null;
  if (side === 0 || side === 1) lostRound(s, [side ? L.off : L.def], "law");
  const wn = s.players[W]
    ? s.players[W].name
    : "The " + (side ? "defense" : "offense");
  if (L.left)
    say(
      s,
      `The ${side ? "offense" : "defense"} attorney left the courtroom, so ${wn} wins the case.`,
    );
  else if (!L.gave)
    say(
      s,
      W
        ? `${wn} wins the case ${Math.max(o, d)}–${Math.min(o, d)}.`
        : `A hung jury: ${o}–${d}. Nobody wins the case.`,
    );
  s.lock = { ...votes, [L.off]: -1, [L.def]: -1 };
  for (const id of s.seat)
    if (s.lock[id] === undefined && s.pos[id]) {
      const c = colAt(s, s.pos[id].x);
      s.lock[id] = c;
    }
  return discussOn(s) ? enter(s, "discuss", now) : nextCase(s, now);
}
/* the numbers behind Lawyering's stats: each player's cases (argued, won, lost, by side, given up, won against their own
   topic) and jury votes (and how often they switched sides), and every case's score; round = null for the whole game.
   A hung jury is neither a win nor a loss. */
export function lawStats(s, round = null) {
  const per = {},
    cases = [];
  const P = (id) =>
    (per[id] = per[id] || {
      argued: 0,
      won: 0,
      lost: 0,
      wonDef: 0,
      wonOff: 0,
      gave: 0,
      ownWin: 0,
      votes: 0,
      flips: 0,
    });
  for (const h of s.history.filter(
    (h) => h.law && (round === null || h.round === round),
  )) {
    const c = h.law,
      [o, d] = c.end || [0, 0];
    cases.push({
      by: h.by,
      text: h.text,
      off: c.off,
      def: c.def,
      o,
      d,
      w: c.w,
      gave: c.gave,
      left: c.left,
    });
    P(c.off).argued++;
    P(c.def).argued++;
    if (c.w === 0 || c.w === 1) {
      const W = c.w ? c.def : c.off,
        L = c.w ? c.off : c.def;
      P(W).won++;
      P(W)[c.w ? "wonDef" : "wonOff"]++;
      P(L).lost++;
      if (!c.w && c.off === h.by) P(W).ownWin++; // argued against their own topic, and won
    }
    if (c.gave) P(c.gave).gave++;
    for (const id of Object.keys(c.votes || {})) {
      P(id).votes++;
      P(id).flips += (c.flips || {})[id] || 0;
    }
  }
  return { per, cases };
}
