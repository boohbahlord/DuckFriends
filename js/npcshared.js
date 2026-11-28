/* ---------- what every NPC shares, whatever mode it's in ----------
   The owner (Nov 19 19:27Z): "The code needs to do a better job at universalizing certain behaviors besides Justin, doing a
   better job at universalizing certain behaviors across different game modes". So what Justin, the merchants, the
   soldiers, the criminals and Sandbox's NPCs all do the same way lives here once, and each mode's brain reads it:
   - NPC_RUN: the one slow speed they run at (a merchant getting away, Justin running off, the gunmen moving up), so none
     of them outruns a walking duck. Change it here and it changes for all of them.
   - npcDown: an NPC that's down or dead, in any mode: whatever it was saying stops at once (game.js cuts its bubble; the
     owner's: "His dialogue, or anyone's dialogue, is instantly cut off for the NPCs, only for the NPCs, when they die").
   This file has no imports, so the rules and the screen can both read it. */

/* the shared slow speed, in a duck's walks: a duck's own walk (Adam's pick, Nov 19). Justin's sprint and a merchant's
   escape were a duck's sprint (1.75) before: "Merchants should be less fast when they try to escape", "if he does
   sprint, he sprints slower" */
export const NPC_RUN = 1;
/* every NPC's hit on a player does this share of its damage (the owner's, Nov 28, cmsg_01LTpp6fzv8sfYUR5KoHADKtCoUNw94KGwZjNsEiuJRsw8:
   all NPCs do half damage to players) */
export const NPC_DMG = 0.5;

/* is player `id` an NPC (Justin in Dead Ducks Arcade: helper)? Players and TEST rooms' computers are not: the owner's
   "only for the NPCs" */
export const isNpc = (s, id) => {
  const p = s && s.players && s.players[id];
  return !!p && (!!p.helper || !!p.npc);
};
/* is NPC `id` down or dead now? Dead Ducks Arcade's (s.hang.l4p: dn, ex) and any mode's own dead flag */
export function npcDown(s, id) {
  const p = s && s.players && s.players[id];
  if (!p) return true;
  if (p.dead) return true;
  const q = s.hang && s.hang.l4p && s.hang.l4p[id];
  return !!q && (!!q.dn || !!q.ex);
}
