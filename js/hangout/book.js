/* ---------- the guestbook: a book on a stand in the great room ----------
   Standing by it, the context button says "Read": a page opens over the board (in the board, not a window) with the
   lines written so far, newest at the bottom, each with its writer's name as they style it, and a line to write in
   (120 letters; Enter writes it). Everyone sees every line; the room keeps the newest 60 while it is open, in
   s.hang.book = [{ n: name, s: name style, t: text }]. Esc, the × button, the context button ("Close") or walking away
   closes it. Typing in it never moves the duck or sets off a special (game.js leaves keys typed in a box alone). */
import { rule, activity } from "./registry.js";
import { PROPS, W, H } from "./layout.js";
import { nameHTML } from "../name.js";
import { rainbowHTML } from "../art.js";
import { esc } from "../ui.js";
import { denied } from "../rules.js";

const BOOK = PROPS.find((p) => p.kind === "book");
const FOOT = [BOOK.x + BOOK.w / 2, BOOK.y + BOOK.d];
const REACH = 130; // world px from the stand's foot: "Read"
const AWAY = 240; // walked this far off: the book closes
const MAX = 120,
  KEEP = 60;
const far = (x, y) => Math.hypot(x - FOOT[0], y - FOOT[1]);
const bookOf = (s) => ((s && s.hang) || {}).book || [];
const cleanText = (t) =>
  String(t || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX);

/* ---------- the rules (the host) ---------- */
rule("book", {
  init: () => ({ book: [] }),
  act(s, a) {
    const me = s.pos[a.id],
      P = s.players[a.id];
    if (!me || !P) return false;
    if (far(me.x * W, me.y * H) > AWAY + 60 || denied(s, a.id, "nochat"))
      return false; // (from beside it; not while muted)
    const t = cleanText(a.text);
    if (!t) return false;
    const st = P.nameStyle || {},
      style = {};
    if (typeof st.font === "string") style.font = st.font.slice(0, 20);
    if (typeof st.color === "string" && /^#[0-9a-f]{3,8}$/i.test(st.color))
      style.color = st.color;
    if (st.rainbow) style.rainbow = 1;
    s.hang.book = [
      ...bookOf(s),
      { n: String(P.name || "Player").slice(0, 20), s: style, t },
    ].slice(-KEEP);
    return true;
  },
});

/* ---------- on each screen: the page ---------- */
let v = null; // { ctx, el, list, input, open, shown }
const lineHTML = (l) =>
  `<li class="hang-book-line">${nameHTML(l.n, l.s || {})}<span class="hang-book-t">${esc(l.t)}</span></li>`;
function fill(s) {
  const lines = bookOf(s),
    sig =
      lines.length +
      ":" +
      (lines.length ? JSON.stringify(lines[lines.length - 1]) : "");
  if (sig === v.shown) return;
  v.shown = sig;
  const L = v.list,
    atEnd = L.scrollHeight - L.scrollTop - L.clientHeight < 40;
  L.innerHTML = lines.length
    ? lines.map(lineHTML).join("")
    : '<li class="hang-book-none">…</li>';
  if (atEnd || !v.seen) {
    L.scrollTop = L.scrollHeight;
    v.seen = true;
  }
}
function open() {
  if (!v || v.open) return;
  v.open = true;
  v.seen = false;
  v.shown = "";
  v.el.hidden = false;
  fill(v.ctx.state());
  if (!matchMedia("(hover: none) and (pointer: coarse)").matches)
    v.input.focus({ preventScroll: true }); // (a phone's keyboard waits for a tap)
  addEventListener("keydown", esc_, true);
}
function close() {
  if (!v || !v.open) return;
  v.open = false;
  v.el.hidden = true;
  if (v.el.contains(document.activeElement)) document.activeElement.blur();
  removeEventListener("keydown", esc_, true);
}
function esc_(e) {
  if (
    e.key === "Escape" &&
    v &&
    v.open &&
    !document.querySelector(".win-back, .ctx")
  ) {
    e.preventDefault();
    e.stopPropagation();
    close();
  }
} // (before the game's own Escape: the pause menu)
function write() {
  const t = cleanText(v.input.value);
  if (!t) return;
  v.ctx.send({ t: "hang", k: "book", text: t });
  v.input.value = "";
  v.seen = false;
}

activity({
  id: "book",
  mount(ctx) {
    const board = ctx.world.board,
      el = document.createElement("div");
    el.className = "hang-book";
    el.hidden = true;
    el.innerHTML = `<div class="hang-book-head"><h3 class="hang-book-title">${rainbowHTML("Guestbook", { seed: 11 })}</h3><button type="button" class="win-x hang-book-x" aria-label="Close">×</button></div>
      <ol class="hang-book-list" aria-live="polite"></ol>
      <form class="hang-book-write" autocomplete="off"><input class="hang-book-in" name="t" maxlength="${MAX}" enterkeyhint="send" placeholder="Write in the book…" aria-label="Write in the book"><button type="submit" class="btn small green">Write</button></form>`;
    for (const t of ["pointerdown", "click", "wheel", "touchstart"])
      el.addEventListener(t, (e) => e.stopPropagation(), { passive: true }); // (a tap on the page never walks the duck)
    board.append(el);
    v = {
      ctx,
      el,
      list: el.querySelector(".hang-book-list"),
      input: el.querySelector(".hang-book-in"),
      open: false,
      shown: "",
      seen: false,
    };
    el.querySelector(".hang-book-x").onclick = close;
    el.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      write();
    };
    v.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    });
  },
  unmount() {
    if (!v) return;
    close();
    v.el.remove();
    v = null;
  },
  near(pos, ctx) {
    if (!pos.inside || !v) return null;
    const d = far(pos.x, pos.y);
    if (d > REACH && !(v.open && d < AWAY)) return null;
    return v.open
      ? { label: "Close", d, act: close }
      : { label: "Read", d, act: open };
  },
  onState(s) {
    if (v && v.open) fill(s);
  },
  step(dt, now, ctx) {
    if (!v || !v.open) return;
    const me = ctx.duck();
    if (!me || !ctx.world.inside || far(me.x * W, me.y * H) > AWAY) close(); // walked off: it closes
  },
});
