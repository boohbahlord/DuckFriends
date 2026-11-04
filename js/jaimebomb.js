/* ---------- the Jaime Bomb (the owner's, Nov 4) ----------
   1 Jaime in 20, in every mode, comes with dynamite strapped to his chest, and the Jaime Bomb special sends that one
   every time. He has 3 HP (in Mad God Justin each of Justin's hits takes 1), and as he comes in he says one of the
   owner's lines; any Justin who sees him snaps back a moment later with one of his own "shut up" or "I don't care"
   lines (hangout/justin.js, word for word). Once he gets to who he's after, his time runs out, or his HP is gone, the
   bomb goes off: a blast half again as wide as a grenade's, all the HP of everything in it (Mad God Justin takes only
   3), and his body flies off the other way from where he was running, headless and torn apart (game.js: the jbomb fx).
   rules.js, l4ddrules.js and mgjrules.js each run their own Jaimes; this is what they share. */
import { E_LINES } from "./hangout/justin.js";

export const BOMB = {
  chance: 0.05, // (1 Jaime in 20 has the bomb)
  hp: 3,
  wide: 1.5, // (the blast: a grenade's, half again as wide)
  mgj: 3, // (all it takes off Mad God Justin)
  snap: 900, // (ms after his line: Justin's; sooner if the bomb goes off first)
  fly: 3, // (duck lengths his body flies)
  unlock: 864, // (Jaimes sent plus Jaime's hits on me)
  fire: 0.02, // (Quacky Zombies' fireplace: 1 spin in 50)
};
/* the owner's lines, word for word */
export const BOMB_LINES = [
  "I go nuclear Justin",
  "Fuck you Justin",
  "For you Justin",
  "Justin, why are you making me do this?",
  "Justin, don't make me do this",
];
/* more of the owner's lines for Jaime, word for word (Nov 4): what he says now and then as he stabs Justin, and when
   Justin hits him */
export const JAIME_MAD = [
  "I'm tired of your shit Justin!",
  "I'm not Mexican!",
  "I hate you Justin!",
  "Die Justin!",
  "You're a piece of shit Justin!",
  "I'm not your slave Justin!",
  "Justin, I'm not your slave anymore!",
  "Why are you like this Justin!",
  "Justin no!",
  "Justin, you piece of shit!",
];
export const JAIME_HURT = [
  "I am tired of being hit with controllers!",
  "I hate the chair! Not the chair!",
  "Not the controller! Ouch!",
  "Ouch Justin!",
  "Stop hitting me Justin!",
  "That hurts Justin!",
];
/* the owner's new lines for Justin against Jaime, word for word (Nov 4): when a Jaime hits him, and his answer to a
   Jaime Bomb */
export const JUSTIN_AT_JAIME = [
  "You deserve that flipping controller!",
  "I should beat Jaime!!!",
  "I'M GOING TO KILL YOU JAIME!!!!!!",
  "Die Jaime!!!",
  "JAIME!!!!!",
  "JAIME STOP!!!!",
  "KILL JAIME!!!!!!",
  "Somone kill Jaime!",
  "Jaime is a STUPID IDIOT!!!!",
  "JAIME!!! I SAID STOP!!!",
  "I WON'T FEED YOU JAIME!!!!",
  "GO BACK TO MY CLOSET JAIME!!!!!!",
  "JAIME I'M TRYING TO SOUND WHORE!!!",
  "JAIME!!! YOU STUPID MEXICAN!!!!",
  "I HATE YOU JAIME!!!!!",
  "JAIIIIIMEE!!!!!!",
  "You're a piece of SHIT Jaime!!!!",
  "Someone?! Beat Jaime!!!",
  "EVERYONE!!! BEAT JAIME!!!!",
  "WE NEED TO BEAT THE POOP OUT OF JAIME!!!!!",
  "JAIME! YOU STUPID MEXICAN!!!!",
  "I HATE MEXICANS!!!!!",
  "I AM GOING TO THROW A CHAIR AT JAIMEM, AGAIN!!!",
  "JAIME!!! YOU ARE WHY I'M NOT PLAT!!!!",
  "WHY DO WOMEN LIKE JAIME BUT NOT ME!?!?!?!",
  "Jaime isn't a civil engineer!!!!",
  "WHY DOES JAIME HAVE MORE GIRLFRIENDS THEN ME!!?!?!?!?!?!?",
  "STOP EATING MY ZEBRA CAKES JAIME!!! YOU STUPID IDIOT!!!",
];
/* Justin's answers to a Jaime Bomb: his own lines that start "Shut up" or "I don't care", and his lines against Jaime */
export const SNAP_LINES = [
  ...E_LINES.filter((l) => /^(shut up|i don't care)/i.test(l)),
  ...JUSTIN_AT_JAIME,
];
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
export const snapLine = () => pick(SNAP_LINES);
export const anyOf = pick;
/* a Jaime says a line: over him (game.js) and in the chat */
export const jaimeSays = (s, id, text) =>
  logIn(s, { npc: "jaime", jid: id, name: "Jaime", text });
/* does this Jaime have the bomb? (sp: the special that sent him) */
export const bombRoll = (sp) =>
  sp === "jaimebomb" || Math.random() < BOMB.chance;
/* a line in the chat (as rules.js' logLine) */
export function logIn(s, line) {
  if (!s.log) return;
  s.logN = (s.logN || 0) + 1;
  s.log = [...s.log.slice(-199), { n: s.logN, t: Date.now(), ...line }];
}
/* a bomb Jaime comes in: his HP, his line (over him and in the chat) and when Justin answers it */
export function bombIn(s, id, J, now) {
  J.bomb = 1;
  J.hp = BOMB.hp;
  J.snapAt = now + BOMB.snap;
  jaimeSays(s, id, pick(BOMB_LINES));
}
/* where his body lands: BOMB.fly duck lengths the other way from (ux, uy), the way he was running (rx, ry: a duck
   length in board units), kept on the board */
export const flyTo = (x, y, ux, uy, rx, ry) => {
  const l = Math.hypot(ux, uy) || 1,
    c = (v) => +Math.max(0, Math.min(1, v)).toFixed(4);
  return [c(x - (ux / l) * BOMB.fly * rx), c(y - (uy / l) * BOMB.fly * ry)];
};
/* toward the Jaime Bomb's unlock (unlocks.js): { by } a Jaime sent, { id } a Jaime's hit on a duck, { got } a Jaime
   Bomb taken from Quacky Zombies' fireplace */
export function jaimeCount(s, o) {
  s.jmkN = (s.jmkN || 0) + 1;
  s.jmk = [...(s.jmk || []).slice(-19), { n: s.jmkN, ...o }];
}
/* the Jaime Guard's weapons (rules.js runs him): the one picked in Customize (duck.jg), or the knife */
export const GUARD_W = [
  "knife",
  "hammer",
  "handgun",
  "dagger",
  "bow",
  "shotgun",
  "grenade",
];
export const guardWeapon = (duck) =>
  GUARD_W.includes((duck || {}).jg) ? duck.jg : "knife";
