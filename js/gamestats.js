/* what `stats` and `roundstats` print for the game that is on: each mode's lines, one per player, from its own numbers
   (the per-mode stats functions). The shell asks this table by the mode, never by its name. Each entry gets
   { s, scope, round, ids, nm, jumps } and returns its lines. (The all-time lines come from modes.js's `stats`.) */
import {
  statsFor,
  ddrStats,
  wyrStats,
  scStats,
  lawStats,
  COLS,
  signed,
  nameOfValue,
} from "./rules.js";
import { bbStats } from "./bbrules.js";
import { quackStats, quackBlank } from "./quackrules.js";
import { dnStats } from "./duncerules.js";
import { mgjStats } from "./mgjrules.js";
import { vdStats, turnedDown } from "./vddrules.js";
import { tvStats } from "./triviarules.js";

const pct = (v) => `${Math.round(v * 100)}%`;
export const GAME_LINES = {
  quack: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const past = s.wqPast || [],
      per = quackStats(scope === "round" ? past.slice(-1) : past);
    for (const id of ids) {
      const p = per[id] || quackBlank();
      out.push(
        `${nm(id)}: ${p.right} of ${p.votes} votes for the real Quack · ${p.wins} rounds won · ${p.quack} as the Quack (${p.quackWins} won) · ${jumps(id)} jumps`,
      );
    }
    return out;
  },
  bb: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const past = s.bbPast || [],
      cur =
        s.bb && s.bb.rounds && s.bb.rounds.length && s.phase !== "results"
          ? [s.bb]
          : [];
    const per = bbStats(
      scope === "round"
        ? cur.length
          ? cur
          : past.slice(-1)
        : [...past, ...cur],
    );
    for (const id of ids) {
      const p = per[id] || {
        wins: 0,
        losses: 0,
        own: 0,
        votes: 0,
        king: 0,
        titles: 0,
      };
      out.push(
        `${nm(id)}: ${p.titles} won · ${p.wins} contender wins · ${p.losses} losses · voted for their own ${p.own} · ${p.votes} votes · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  law: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const per = lawStats(s, round).per;
    for (const id of ids) {
      const p = per[id] || {
        argued: 0,
        won: 0,
        lost: 0,
        wonDef: 0,
        wonOff: 0,
        gave: 0,
        votes: 0,
        flips: 0,
      };
      out.push(
        `${nm(id)}: ${p.argued} cases argued · ${p.won} won (${p.wonDef} as defense, ${p.wonOff} as offense) · ${p.lost} lost · gave up ${p.gave} · ${p.votes} jury votes · switched sides ${p.flips} · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  dunce: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const per = dnStats(s).per;
    for (const id of ids) {
      const p = per[id] || {
        turns: 0,
        not: 0,
        dunce: 0,
        comeback: 0,
        dunced: 0,
        votes: 0,
      };
      out.push(
        `${nm(id)}: ${p.turns} takes defended · ${p.not} Not a Dunce votes · ${p.dunce} Dunce votes · comeback ${p.comeback} · voted a dunce ${p.dunced} · ${p.votes} votes · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  vdd: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const V = s.vd || {},
      per = vdStats(s).per;
    for (const id of ids) {
      const p = per[id] || { dates: 0, ms: 0, early: 0 },
        role =
          V.date === id
            ? "The Date"
            : V.val === id
              ? "Valentine"
              : turnedDown(s, id)
                ? "Turned Down"
                : "Suitor";
      out.push(
        `${nm(id)}: ${role} · ${p.dates} dates · ${Math.round(p.ms / 1000)} s on dates · ended early ${p.early} · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  trivia: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const per = tvStats(s, round).per;
    for (const id of ids) {
      const p = per[id] || { right: 0, wrong: 0, asked: 0, got: 0, of: 0 };
      out.push(
        `${nm(id)}: right ${p.right} · wrong ${p.wrong} · ${p.asked} questions written${p.of ? ` · ${pct(p.got / p.of)} of their answers right` : ""} · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  mgj: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const per = mgjStats(s, scope !== "round").per;
    for (const id of ids) {
      const p = per[id] || { dmg: 0, hits: 0, kills: 0, fights: 0, wins: 0 };
      out.push(
        `${nm(id)}: damage ${p.dmg} · knocked down ${p.hits} · killing blows ${p.kills} · ${p.fights} fights (${p.wins} won) · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  wyr: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const per = wyrStats(s, round).per;
    for (const id of ids) {
      const p = per[id] || { answers: 0, written: 0, split: 0, maj: 0, min: 0 };
      out.push(
        `${nm(id)}: ${p.answers} answers · bigger side ${p.maj} · smaller side ${p.min}${p.written ? ` · their questions split ${pct(p.split / p.written)} evenly` : ""} · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  ddr: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    for (const id of ids) {
      const p = ddrStats(s, id, round);
      out.push(
        `${nm(id)}: ${p.n} answers · related ${p.yes} · didn't ${p.no}${p.n ? ` (${pct(p.yes / p.n)} related)` : ""} · ${p.jumps} Jumps`,
      );
    }
    return out;
  },
  sc: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    const paras = s.sc
        ? s.sc.stories
            .flatMap((x) => x.paras)
            .filter((x) => round === null || x.round === round)
        : [],
      per = scStats(paras);
    for (const id of ids) {
      const p = per[id] || { lines: 0, lvotes: 0, wvotes: 0 };
      out.push(
        `${nm(id)}: ${p.lines} lines · ${p.lvotes} votes for their lines · ${p.wvotes} for their words · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
  aod: ({ s, scope, round, ids, nm, jumps }) => {
    const out = [];
    for (const id of ids) {
      const st = statsFor(s, id, round);
      out.push(
        `${nm(id)}: ${st.n} answers · chose most ${st.most.length ? st.most.map((c) => COLS[c]).join(", ") : "—"} · median ${signed(st.median)}${st.median !== null ? ` (${nameOfValue(st.median)})` : ""} · average ${st.avg === null ? "—" : signed(Math.round(st.avg * 10) / 10)} · ${jumps(id)} Jumps`,
      );
    }
    return out;
  },
};
