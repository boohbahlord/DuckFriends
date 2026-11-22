/* ---------- Sandbox's windows, saves and maps (the part of rules.js that is its own) ----------
   Moved out of rules.js to keep that file under control: rules.js runs the shared turn and the actions, this file the
   mode's own phases. It imports back from rules.js as duncerules.js does; rules.js calls it from the phase table and the
   actions. */
import { backToLobby, say } from "./rules.js";
import { epAct } from "./sbep.js";
import { isSb, sbCan, SB_RIGHTS, sbRulesAct, sbRule } from "./sandboxrules.js";
import { sbGodAct } from "./sbgod.js";
import { sbAct } from "./sbspawn.js";
import { sbAgainAct } from "./sbout.js";
import { sbHotAct } from "./sbhot.js";
import { sbLootAct } from "./sbloot.js";
import { nbPermAct, nbShareAct } from "./nbperms.js";
import { sbLandAct } from "./sbzone.js";
import { sbGroupAct } from "./sbgroups.js";
import { sbPick, sbRename, saveMap } from "./sbsave.js";
import { umapAct } from "./umaprules.js";
import { SB_H } from "./boardfire.js";
import { beginGame, countdown, nextVote, placeMap } from "./voterules.js";

/* ---------- the actions of Sandbox's windows, saves and maps (dispatch only: its rules live in the sb files) ---------- */
export function act_sbOk({ state, s, a, me, host }) {
  // Sandbox: whoever has the rights gives them to a player or takes them back (the owner's answer 2, Nov 19
  // 01:34Z: the host "decide[s] who else gets it"). The host's own rights never go
  /* with a window's letter (win): that window opens to every player or shuts again (Player settings, p; the owner's,
         Nov 19 17:15Z: "determines what settings players get ... if they can access every menu or only certain ones") */
  if (a.win !== undefined) {
    const w = SB_RIGHTS.find(([k]) => k === a.win);
    if (!sbCan(s, a.id) || !w) return state;
    s.options["sbOk" + w[0].toUpperCase()] = a.on ? 1 : 0;
    say(
      s,
      `${me ? me.name : "The host"} ${a.on ? "opened" : "closed"} ${w[1]} to every player.`,
    );
    return s;
  }
  const who = s.players[a.who];
  if (!sbCan(s, a.id) || !who || who.bot || a.who === s.hostId) return state;
  const ok = { ...((s.sb || {}).ok || {}) };
  if (a.on) ok[a.who] = true;
  else delete ok[a.who];
  s.sb = { ...(s.sb || {}), ok };
  say(
    s,
    `${me ? me.name : "The host"} ${a.on ? "let" : "stopped"} ${who.name} ${a.on ? "change" : "changing"} Sandbox.`,
  );
  return s;
}

export function act_sb({ state, s, a, now }) {
  // Sandbox's spawns and respawns: place one, change a box, press one (sbspawn.js)
  if (a.k === "land") return sbLandAct(s, a, now, SB_H) ? s : state; // (a fall onto a zone that hurts: sbzone.js)
  return sbAct(s, a, now) ? s : state;
}

export function act_sbg({ state, s, a }) {
  // Sandbox's God mode and invisibility: mine, or a player's if I have the rights (sbgod.js)
  return sbGodAct(s, a) ? s : state;
}

export function act_sbr({ state, s, a, now }) {
  // Sandbox's Rules in G: lives, down phase, crits, watching when out (sandboxrules.js)
  if (a.k === "again") return sbAgainAct(s, a, now) ? s : state; // (everyone out, off the zombie maps: the host's Play again, sbout.js)
  return sbRulesAct(s, a) ? s : state;
}

export function act_sbh({ state, s, a, now }) {
  // Sandbox's hotbar: its slots, the lock, a spawn button's look and press (sbhot.js)
  return sbHotAct(s, a, now) ? s : state;
}

export function act_sbep({ state, s, a }) {
  // Sandbox: what others may do with my made NPCs and groups, for this Sandbox (P, sbep.js)
  return epAct(s, a) ? s : state;
}

export function act_nbn({ state, s, a }) {
  // Seriat: my folder's names and the rights I give other players, for this Sandbox (nbperms.js)
  return nbPermAct(s, a) ? s : state;
}

export function act_nbs({ state, s, a }) {
  // Seriat: my shared copies, and a write into another player's file they let me write (nbperms.js)
  return nbShareAct(s, a) ? s : state;
}

export function act_sbl({ state, s, a, now }) {
  // Sandbox's loot orbs: an orb's own picture, and E on one (sbloot.js)
  return sbLootAct(s, a, now) ? s : state;
}

export function act_sbgr({ state, s, a }) {
  // Sandbox's groups (sbgroups.js)
  return sbGroupAct(s, a) ? s : state;
}

export function act_sbPick({ state, s, a, now, me, host }) {
  // Sandbox's start: the host's pick, a new Sandbox or a save from its device (sbsave.js)
  if (!host || s.phase !== "countdown" || !s.sbpk) return state;
  delete s.sbpk;
  if (!sbPick(s, a, now)) return state;
  if (a.save) {
    if (
      s.options.sbMap ||
      (s.gmPlay && !sbRule(s, "pickmap")) ||
      saveMap(s, a.save.data, a.play)
    )
      s.voteQ = (s.voteQ || []).filter((k) => k !== "map"); // (a world save brings its own map; a board save or a made game mode, its own: sbsave.js saveMap)
    say(s, `${me.name} is loading a save: ${s.sbsv.name}`);
  } else say(s, `${me.name} started a new Sandbox.`);
  return nextVote(s, now);
}

export function act_umap({ state, s, a }) {
  // a map the host made, brought into the room or taken out (umaprules.js)
  return umapAct(s, a) ? s : state;
}

export function act_sbTest({ state, s, a, now, me, host }) {
  /* G's Test game mode (gmodes.js): the host's device hands the build, and the Sandbox starts again from it as players
         would see it, no tools (on: 1); Stop test starts it again from the build as it was (on: 0) */
  if (!host || !isSb(s) || !["sandbox", "hang"].includes(s.phase)) return state;
  if (!a.on && !s.gmTest) return state;
  const banned = s.banned;
  backToLobby(
    s,
    a.on
      ? `${me.name} is testing the game mode.`
      : `${me.name} stopped the test.`,
  );
  s.banned = banned;
  s.sbAsked = 1;
  if (!sbPick(s, { save: a.save, play: a.on ? 1 : 0, test: 1 }, now))
    return state;
  placeMap(s);
  return beginGame(s, now);
}

export function act_sbsv({ state, s, a, now, host }) {
  // Sandbox: Save as, the session's new name (and id) on the host's device (sbsave.js)
  return host && sbRename(s, a, now) ? s : state;
}
export const SB_ACTS = {
  sbOk: act_sbOk,
  sb: act_sb,
  sbg: act_sbg,
  sbr: act_sbr,
  sbh: act_sbh,
  sbep: act_sbep,
  nbn: act_nbn,
  nbp: act_nbn,
  nbs: act_nbs,
  nbw: act_nbs,
  sbl: act_sbl,
  sbgr: act_sbgr,
  sbPick: act_sbPick,
  umap: act_umap,
  sbTest: act_sbTest,
  sbsv: act_sbsv,
};
