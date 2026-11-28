/* ---------- The cloud's words and what each mode announces ----------
   Moved out of game.js to keep that file small (a pure move; the owner's, Nov 22). */
import { graceLeftMs } from "./gamehand.js";
import { el, esc, $ } from "./ui.js";
import { isBb, isLaw, isSc } from "./rules.js";
import { sfx } from "./sound.js";
import { isQuack } from "./quackrules.js";
import { quackLines } from "./quack.js";
import { isDn } from "./duncerules.js";
import { isVd } from "./vddrules.js";
import { isTv } from "./triviarules.js";
import { R, S } from "./game.js";

/* the announcement counter: a newer one (or leaving the screen) makes the older stop */
let sayJob = 0;
export const stopSays = () => ++sayJob;

/* ---------- the cloud's words: letters that fade in (with a sparkle) and out (with a breath) ---------- */
export function say(text, small = false) {
  const el = S && $(".topover .lord-say", S);
  if (!el) return;
  let i = 0;
  el.className = "lord-say" + (small ? " small" : "");
  el.innerHTML = text
    .split(" ")
    .map(
      (w) =>
        `<span class="w">${[...w].map((ch) => `<span style="animation-delay:${i++ * 38}ms">${esc(ch)}</span>`).join("")}</span>`,
    )
    .join(" ");
  sfx.letters(text.length);
}
function unsay() {
  const el = S && $(".topover .lord-say", S);
  if (!el || !el.textContent) return;
  el.classList.add("out");
  sfx.fade();
}
export const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
/* a question starts: "Vote" once voting opens; the votes are in: the news, then the question to talk over */
export async function announce(phase) {
  if (isQuack(R.state)) return announceQuack(R.state);
  if (isDn(R.state)) return announceDunce(R.state, phase);
  if (isVd(R.state)) return announceVd(R.state, phase);
  if (isTv(R.state)) return; // (Trivia: the question says it all)
  const job = ++sayJob;
  if (
    phase === "answer" ||
    (isSc(R.state) && ["lvote", "wvote"].includes(phase))
  ) {
    await pause(Math.max(250, graceLeftMs(R.state)));
    if (job === sayJob) say(isLaw(R.state) ? "Who will convince?" : "Vote");
    return;
  }
  if (phase === "closing") {
    sfx.boop();
    say("Reconsider?");
    return;
  }
  if (phase === "tie") {
    sfx.boop();
    say("Tie!");
    return;
  }
  if (phase !== "discuss") return;
  sfx.boop(); // End turn is open
  await pause(350);
  if (job !== sayJob) return;
  if (isLaw(R.state)) {
    // the verdict, then the winner bumps the loser off the cloud
    const L = R.state.law || {},
      w = L.w === 0 ? L.off : L.w === 1 ? L.def : null,
      p = w && R.state.players[w];
    const wn = p ? p.name : "The " + (L.w ? "defense" : "offense");
    say(
      L.w === -1
        ? "Hung jury!"
        : L.left
          ? `${wn} wins: the other side left!`
          : L.gave
            ? `${wn} wins: the other side gave up!`
            : `${wn} convinced the jury!`,
    );
    await pause(3200);
    if (job !== sayJob) return;
    unsay();
    await pause(650);
    if (job !== sayJob) return;
    say("Who argued it best?", true);
    return;
  }
  say("The votes are in!");
  await pause(2400);
  if (job !== sayJob) return;
  unsay();
  await pause(650);
  if (job !== sayJob) return;
  say(
    isBb(R.state) ? "Why that one?" : "Why did you choose what you chose?",
    true,
  );
}

/* Duncelation: the cloud asks "Dunce or Not?" as a take starts; the verdict; the dunce */
async function announceDunce(s, phase) {
  const job = ++sayJob,
    C = s.dn && s.dn.cur,
    p = C && s.players[C.def],
    [d, n] = (C && C.end) || [0, 0];
  if (phase === "answer") {
    sfx.boop();
    say("Dunce or Not?");
    return;
  }
  if (phase === "discuss") {
    sfx.boop();
    await pause(350);
    if (job === sayJob) say(`Not a dunce! ${n}–${d}`);
    return;
  }
  if (phase !== "dunced" || !p) return;
  sfx.drum();
  say(`${p.name} is a DUNCE!`);
  await pause(3400);
  if (job !== sayJob) return;
  unsay();
  await pause(650);
  if (job !== sayJob) return;
  say("LOSER!");
}
/* Valentine's Duck Date: the cloud as a date starts, at the pick, and the news */
async function announceVd(s, phase) {
  const job = ++sayJob,
    V = s.vd;
  if (!V) return;
  if (phase === "vddate") {
    sfx.boop();
    say("Date time!");
    return;
  }
  if (phase === "vdpick") {
    sfx.drum();
    say("Who's out?");
    return;
  }
  if (phase === "vddown") {
    const last = V.picks[V.picks.length - 1];
    sfx.boop();
    say(last && last.id ? "Turned Down!" : "Nobody!");
    return;
  }
  if (phase === "vdval") {
    sfx.drum();
    await pause(400);
    if (job === sayJob) say("Valentine!");
  }
}
/* Who is the Quack?: whose clue it is; the vote; then the drumroll and the news, a line at a time */
async function announceQuack(s) {
  const job = ++sayJob,
    lines = quackLines(s),
    w = s.wq;
  if (!lines.length) return;
  if (s.phase === "clue") {
    sfx.boop();
    say(lines[0]);
    return;
  }
  if (s.phase !== "reveal") {
    await pause(Math.max(250, graceLeftMs(s)));
    if (job === sayJob) say(lines[0]);
    return;
  }
  for (let i = 0; i < lines.length; i++) {
    if (i) {
      await pause(w.lastOut && i === 1 ? 2600 : 2200);
      if (job !== sayJob) return;
      unsay();
      await pause(650);
      if (job !== sayJob) return;
    }
    say(lines[i]);
    if (i === 0 && w.lastOut) sfx.drum();
    if (i === 1 && w.lastOut)
      (w.result && w.result.quacks.includes(w.lastOut) ? sfx.done : sfx.bonk)();
  }
}
