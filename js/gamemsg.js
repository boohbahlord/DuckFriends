/* ---------- lines by the chat button: chat's newest message and the game's own messages ----------
   One column of see-through lines just above and beside the chat button, wherever Settings put it; every tap goes
   through them, each one fades and is gone, and nothing of it is kept. chat.js floats the newest chat message here (one
   at a time). gameMsg(text) is the game's (the owner's, Nov 28 04:05Z, cmsg_01LTpp6fzv8sfYUR5KoHADKtBFSt5xGqKea6TT5ehvSw7H,
   his UI principle: one module): a line like chat's, only on my screen and never in the chat's history, its text a
   little bigger, with a soft double ding and two soft blinks as it comes. The same words again while they still show:
   that line blinks and dings again. "The Merchant has Arrived" stays big at the top (l4dd.js l4Got) */
import { el } from "./ui.js";
import { sfx } from "./sound.js";

const MOST = 3; // lines at once: the oldest goes
let box = null;
/* the column, by the chat button: on a computer to its right, just above its top (clear of the map in the corner over
   it); on a phone, over it and the weapons beside it; on the right side of the screen, the other way round */
const WIDE = 700; // (css px: a computer's screen, or a phone on its side)
function place() {
  if (!box) {
    box = el('<div class="gmsgs" aria-live="polite"></div>');
    document.body.append(box);
  }
  const b = document.querySelector(".chat-btn"),
    r = b && b.isConnected ? b.getBoundingClientRect() : null,
    on = !!(r && r.width),
    right = on && r.left > innerWidth / 2,
    side = on && innerWidth >= WIDE;
  box.classList.toggle("right", right);
  box.style.left = right
    ? "auto"
    : `${Math.round(on ? (side ? r.right + 8 : Math.max(8, r.left)) : 8)}px`;
  box.style.right = right
    ? `${Math.round(Math.max(8, innerWidth - (side ? r.left - 8 : r.right)))}px`
    : "auto";
  /* over the chat button and the keys' words by it, however many lines they take (nothing overlaps: the owner's rule),
     and on a phone over the weapons beside it too (their caption included) */
  let top = on ? r.top : innerHeight;
  for (const e of document.querySelectorAll(
    on && !side ? ".hints, .sp-phone:not(.gone), .sp-cap" : ".hints",
  ))
    top = Math.min(top, e.getBoundingClientRect().top || top);
  watch();
  box.style.bottom = `${Math.round(Math.max(8, innerHeight - top + 8))}px`;
  /* and short of the touch pad (game.js: its ring and its column of buttons) */
  let to = innerWidth;
  if (on && !side && !right)
    for (const e of document.querySelectorAll(".tpad-ring, .tpad-col")) {
      const q = e.getBoundingClientRect();
      if (q.width) to = Math.min(to, q.left);
    }
  box.style.maxWidth =
    to < innerWidth
      ? `${Math.round(Math.max(120, to - box.offsetLeft - 8))}px`
      : "";
}
/* the keys' words change their lines (a tip comes, the window narrows): the column moves with them */
let seen = null;
const ro =
  typeof ResizeObserver === "function"
    ? new ResizeObserver(() => box && box.children.length && place())
    : null;
function watch() {
  const h = document.querySelector(".hints");
  if (!ro || h === seen) return;
  if (seen) ro.unobserve(seen);
  if ((seen = h)) ro.observe(h);
}
/* a line: html in it, kind its look ("chat": the chat's float, "game": a game message); returns it */
export function floatLine(html, kind) {
  place();
  const p = el(`<p class="gmsg ${kind}"></p>`);
  p.innerHTML = html;
  p.addEventListener("animationend", (e) => {
    if (/** @type {AnimationEvent} */ (e).animationName.startsWith("gmsg-out"))
      p.remove();
  });
  box.append(p);
  while (box.children.length > MOST) box.firstElementChild.remove();
  return p;
}
const again = (p) => {
  p.classList.remove("on");
  void p.offsetWidth;
  p.classList.add("on");
};
/* the game's message to me */
export function gameMsg(text) {
  if (!text) return;
  const same =
    box &&
    [...box.querySelectorAll(".gmsg.game")].find((p) => p.textContent === text);
  if (same) {
    box.append(same); // (newest at the bottom)
    again(same);
  } else {
    const p = floatLine("", "game");
    p.textContent = text;
    again(p);
  }
  sfx.gameMsg();
}
/* chat's newest message: the one before it goes */
export function chatFloat(html) {
  if (box) for (const p of box.querySelectorAll(".gmsg.chat")) p.remove();
  again(floatLine(html, "chat"));
}
/* leaving the room: every line gone */
export function clearLines() {
  if (box) box.replaceChildren();
}
