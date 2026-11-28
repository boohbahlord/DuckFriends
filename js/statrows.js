/* I want one table for what a mode's all-time stats show (modes.js, each mode's `stats`), and one place that turns a row of
   it into what the Stats window draws and what the shell's totalstats prints, so a new row is written once. */
import { COLS, signed, nameOfValue, DDR_SIDES } from "./rules.js";
import { esc } from "./ui.js";
import { fmtJumps } from "./format.js";

const share = (t) => t.majority + t.minority;
const pct = (v) => `${Math.round(v * 100)}%`;
const ddrChip = (c) =>
  `<span class="chip ddr-chip ${c ? "no" : "yes"}">${esc(DDR_SIDES[c])}</span>`;
/* the rows that are worked out, not read: each gives { html, text } from the player's all-time numbers */
const KINDS = {
  aodMost(t) {
    const top = Math.max(...t.counts),
      most = top
        ? t.counts.map((k, c) => (k === top ? c : -1)).filter((c) => c >= 0)
        : [];
    return {
      html: most.length
        ? most
            .map((c) => `<span class="chip c${c + 1}">${esc(COLS[c])}</span>`)
            .join(" ")
        : "—",
      text: most.length ? most.map((c) => COLS[c]).join(", ") : "—",
    };
  },
  aodAvg(t) {
    const avg = t.answers
      ? t.counts.reduce((a, k, c) => a + k * (c - 3), 0) / t.answers
      : null;
    return {
      html:
        avg === null
          ? "—"
          : `${signed(Math.round(avg * 10) / 10)} <span class="dim">${esc(nameOfValue(avg))}</span>`,
      text: avg === null ? "—" : signed(Math.round(avg * 10) / 10),
    };
  },
  sideShare(t) {
    const v = share(t) ? pct(t.majority / share(t)) : "—";
    return { html: v, text: v };
  },
  ddrMost(t) {
    const html = share(t)
        ? t.majority > t.minority
          ? ddrChip(0)
          : t.majority < t.minority
            ? ddrChip(1)
            : ddrChip(0) + " " + ddrChip(1)
        : "—",
      side = t.majority > t.minority ? 0 : 1;
    return {
      html,
      text: !share(t)
        ? "—"
        : t.majority === t.minority
          ? `${DDR_SIDES[0]}, ${DDR_SIDES[1]}`
          : DDR_SIDES[side],
    };
  },
  ddrShare: (t) => KINDS.sideShare(t),
  best: (t, k) => ({
    html: t[k] ? fmtJumps(t[k]) : "—",
    text: t[k] ? String(t[k]) : "—",
  }),
};
/* one row [label, key, kind] of a mode's table for a player's all-time numbers t: { label, html, text } */
export const statRow = ([label, key, kind], t) => {
  const v = (
    KINDS[kind] ||
    ((u, k) => ({ html: fmtJumps(u[k] || 0), text: String(u[k] || 0) }))
  )(t, key);
  /* a plain number reads "12 rounds"; a worked-out one reads "chose most red" */
  return {
    label,
    html: v.html,
    text:
      kind && kind !== "best" && kind !== "clock"
        ? `${label.toLowerCase()} ${v.text}`
        : `${v.text} ${label.toLowerCase()}`,
  };
};
