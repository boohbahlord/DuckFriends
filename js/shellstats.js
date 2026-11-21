/* the stats and forgame commands' helpers (a pure move out of shell.js; the commands that use them stay in shell.js's table) */
import { profile, STAT_MODES } from "./store.js";
import { STAGE } from "./rules.js";
import { modeOf, statsOf } from "./modes.js";
import { statRow } from "./statrows.js";
import { fail, needMay, needRoom, pct, pname, tag, who } from "./shellfs.js";
import { GAME_LINES } from "./gamestats.js";
import { MAPS, MAP_VARIANTS, mapForm, mapName } from "./maps.js";
import { MAN } from "./manual.js";
import { npcByTag, npcById } from "./npcs.js";

/* the maps the command line knows: every map, and every variation that is a map of its own (Nous Within Kenoma's) */
export const SH_MAPS = [
  ...MAPS,
  ...MAP_VARIANTS.filter((v) => mapForm(v[0]).map === v[0]),
];

/* ---------- the stats ---------- */
export function statLines(ctx, scope, args) {
  const s = needRoom(ctx),
    mi = args.indexOf("-m"),
    mode = mi >= 0 ? args[mi + 1] : s.options.mode || "aod",
    at = args.filter((a) => a.startsWith("@"));
  if (modeOf(mode).noRounds)
    fail(
      "✗ Hangout keeps no stats of its own; try totalstats -m aod (or another game).",
    );
  if (!STAT_MODES.some(([m]) => m === mode))
    fail(`✗ -m ${STAT_MODES.map(([m]) => m).join(", ")}.`);
  const ids = at.length
    ? who(ctx, at)
    : s.seat.filter((id) => !(s.players[id] || {}).late || scope === "total");
  const nm = (id) => pname(s, id),
    out = [];
  if (scope === "total") {
    out.push(`All time · ${modeOf(mode).name}:`);
    for (const id of ids) {
      const st = (
        id === ctx.room.me ? profile.stats : s.players[id].stats || {}
      )[mode];
      if (!st) {
        out.push(`${nm(id)}: no stats yet`);
        continue;
      }
      out.push(
        `${nm(id)}: ${statsOf(mode)
          .rows.map((r) => statRow(r, st).text)
          .join(" · ")}`,
      );
    }
    return out.join("\n");
  }
  if (mode !== (s.options.mode || "aod"))
    fail(
      `✗ This game is ${modeOf(s.options.mode).name}; -m works with totalstats.`,
    );
  const round = scope === "round" ? s.round : null,
    jumps = (id) => (s.jumps || {})[id] || 0;
  out.push(
    `${scope === "round" ? `Round ${s.round + 1}` : "This game"} · ${modeOf(mode).name}:`,
  );
  out.push(
    ...(GAME_LINES[mode] || GAME_LINES.aod)({
      s,
      scope,
      round,
      ids,
      nm,
      jumps,
    }),
  );
  return out.join("\n");
}

/* forgame: show the settings, change them, or mute */
export const STAGES = [...new Set(Object.values(STAGE))];
const SHARES = {
  everyone: 1,
  all: 1,
  half: 0.5,
  "2/3": 0.67,
  "two-thirds": 0.67,
  "3/4": 0.75,
  "three-quarters": 0.75,
};
function forgameShow(s) {
  const o = s.options,
    t = (v) => (v ? v + " s" : "off"),
    sh =
      o.share === 1
        ? "everyone"
        : Object.keys(SHARES).find(
            (k) => SHARES[k] === o.share && k.includes("/"),
          ) || pct(o.share);
  const mutes = (s.gmutes || [])
    .filter((m) => m.on)
    .map(
      (m) =>
        `${m.who
          .filter((id) => s.players[id] || npcById(id))
          .map((id) => (s.players[id] ? pname(s, id) : npcById(id).name))
          .join(
            ", ",
          )} (${m.kinds.join(", ")}${m.turns ? `, ${m.turns} turns` : ""}${m.stages && m.stages.length ? `, in ${m.stages.join(" ")}` : ""})`,
    );
  return [
    `${modeOf(o.mode).name} on ${mapName(o.map)}${s.phase === "lobby" ? " (in the lobby)" : modeOf(o.mode).noRounds ? ", hanging out" : `, round ${s.round + 1}`}`,
    `  timers:    writing ${t(o.submitTime)} · answer ${o.answerOff ? "off" : t(o.answerTime)} · catch-up ${t(o.catchUp)}`,
    `  turn-end:  ${sh}`,
    `  order ${o.order} · freeroam ${o.freeRoam ? "on" : "off"}${modeOf(o.mode).noRounds ? "" : ` · discussion ${o.discuss ? "on" : "off"} · unvote-stops ${o.unvoteStops ? "on" : "off"}`} · silly ${o.fun ? "on" : "off"}${modeOf(o.mode).cabinHome ? ` · ghosts ${o.ghosts ? "on" : "off"}` : ` · justin ${o.justin ? "on" : "off"}`}`,
    `  mutes for everyone: ${mutes.join("; ") || "none"}`,
  ].join("\n");
}
export function forgame(x, args) {
  const ctx = x.ctx,
    s = needRoom(ctx),
    a0 = (args[0] || "").toLowerCase(),
    onOff = args.find((a) => /^(on|off)$/i.test(a)),
    on = /^on$/i.test(onOff || "");
  if (a0 === "show" || !args.length) return forgameShow(s);
  if (s.phase === "lobby")
    fail(
      "✗ forgame works during a game (in the lobby, the Game options do this).",
    );
  const set = (v) => {
    needMay(x, "cansettings", "forgame");
    ctx.room.send({ t: "forgame", set: v });
  };
  if (a0 === "all-timer") {
    if (!onOff) fail("✗ forgame all-timer off (or on)");
    set(
      on
        ? { catchUp: 15, answerTime: 30, answerOff: 0 }
        : { catchUp: 0, answerTime: 0, submitTime: 0, answerOff: 1 },
    );
    return `Every timer ${on ? "on" : "off"} for the rest of the game.`;
  }
  if (a0 === "timer") {
    const which = args.slice(1).find((a) => !/^(on|off|\d+)$/i.test(a)),
      secs = +(args.find((a) => /^\d+$/.test(a)) || 0);
    if (!onOff || !which)
      fail("✗ forgame timer off|on catch-up | answer | writing [seconds]");
    if (secs && ![15, 30, 45, 60, 90, 120].includes(secs))
      fail("✗ seconds: 15, 30, 45, 60, 90 or 120");
    const v = {
      "catch-up": { catchUp: on ? secs || 15 : 0 },
      answer: on
        ? { answerTime: secs || 30, answerOff: 0 }
        : { answerTime: 0, answerOff: 1 },
      writing: { submitTime: on ? secs || 90 : 0 },
    }[which.toLowerCase()];
    if (!v) fail("✗ catch-up, answer or writing");
    set(v);
    return `The ${which} timer: ${on ? `on${secs ? `, ${secs} s` : ""}` : "off"}.`;
  }
  if (a0 === "turn-end") {
    const v = SHARES[(args[1] || "").toLowerCase()];
    if (!v) fail("✗ forgame turn-end everyone | half | 2/3 | 3/4");
    set({ share: v });
    return `A turn now ends when ${v === 1 ? "everyone is" : `${args[1]} of the players are`} done.`;
  }
  if (a0 === "order") {
    const v = (args[1] || "").toLowerCase();
    if (!["random", "rotate"].includes(v))
      fail("✗ forgame order random | rotate");
    set({ order: v });
    return `Questions now come in ${v === "random" ? "a random order" : "turn"}.`;
  }
  if (["discussion", "unvote-stops"].includes(a0)) {
    if (!onOff) fail(`✗ forgame ${a0} on | off`);
    set({ [a0 === "discussion" ? "discuss" : "unvoteStops"]: on ? 1 : 0 });
    return a0 === "discussion"
      ? `Discussion round ${on ? "on" : "off"}.`
      : `Unvoting ${on ? "stops" : "doesn't stop"} the countdown.`;
  }
  if (["freeroam", "silly"].includes(a0)) {
    if (!onOff) fail(`✗ forgame ${a0} on | off`);
    set({ [a0 === "silly" ? "fun" : "freeRoam"]: on ? 1 : 0 });
    return `${a0 === "silly" ? "Silly commands" : "Free roam"} ${on ? "on" : "off"}.`;
  }
  if (a0 === "ghosts") {
    if (!onOff) fail("✗ forgame ghosts on | off");
    if (!modeOf(s.options.mode).cabinHome)
      fail("✗ Ghosts are only in Duck Cabin.");
    set({ ghosts: on ? 1 : 0 });
    return `Ghosts ${on ? "on: a knocked-down duck's ghost walks about until Space" : "off"}.`;
  }
  if (a0 === "justin") {
    if (!onOff) fail("✗ forgame justin on | off");
    if (modeOf(s.options.mode).cabinHome)
      fail("✗ Justin already lives in Duck Cabin.");
    if (["l4dd", "surv", "mgj"].includes(s.options.mode))
      fail("✗ Not in this game: Justin can't be called in here.");
    set({ justin: on ? 1 : 0 });
    return `Justin ${on ? "on: he walks the board" : "off"}.`;
  }
  const mi = args.findIndex((a) => /^\\mute$/i.test(a));
  if (mi < 0) fail(`✗ ${MAN.forgame}`);
  needMay(x, "canmute", "forgame");
  const pre = args.slice(0, mi),
    post = args.slice(mi + 1),
    mute = { on: false, kinds: [], who: [], turns: 0, stages: [], count: 0 };
  for (let i = 0; i < pre.length; i++) {
    const w = pre[i].toLowerCase(),
      r = w.match(/^(?:rounds|turns)(\d+)$/),
      st = w.match(/^stage(\d*)$/);
    if (r) mute.turns = +r[1];
    else if (st) {
      mute.count = +st[1] || 0;
      while (STAGES.includes((pre[i + 1] || "").toLowerCase()))
        mute.stages.push(pre[++i].toLowerCase());
      if (!mute.stages.length) fail(`✗ stage: then ${STAGES.join(", ")}`);
    } else
      fail(
        `✗ ${pre[i]}? Before \\mute: roundsN, stage or stageN and the stages.`,
      );
  }
  for (const w of post) {
    if (/^(on|off)$/i.test(w)) mute.on = /^on$/i.test(w);
    else if (w.startsWith("@")) {
      const n =
        !ctx.room.state.seat.some(
          (i) =>
            tag(ctx.room.state.players[i].name).toLowerCase() ===
            w.slice(1).toLowerCase(),
        ) && npcByTag(w.slice(1));
      mute.who.push(...(n ? [n.id] : who(ctx, [w])));
    } // (Justin and the other characters too)
    else if (/^all$/i.test(w)) mute.kinds.push("bubble", "ping", "text");
    else if (["bubble", "ping", "text"].includes(w.toLowerCase()))
      mute.kinds.push(w.toLowerCase());
    else
      fail(
        `✗ ${w}? \\mute on|off, then bubble, ping, text or all, then @names.`,
      );
  }
  if (
    !post.some((w) => /^(on|off)$/i.test(w)) ||
    !mute.kinds.length ||
    !mute.who.length
  )
    fail("✗ \\mute on|off, then bubble, ping, text or all, then @names.");
  ctx.room.send({ t: "forgame", mute });
  return `${mute.on ? "Muted" : "Unmuted"} ${[...new Set(mute.kinds)].join(", ")} for everyone${mute.turns ? `, for ${mute.turns} turns` : ""}${mute.stages.length ? `, in ${mute.count ? `the next ${mute.count} ` : "the "}${mute.stages.join(", ")} stage${mute.count === 1 && mute.stages.length === 1 ? "" : "s"}` : ""}.`;
}
