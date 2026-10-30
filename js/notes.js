/* ---------- Notes (bottom left): question ideas, written any time ----------
   A button at the bottom left of the lobby and the game; its panel opens in the left dock. Notes are kept on this device.
   When writing a question, Add a prompt from Notes puts one of them in the box. */
import { profile, save } from "./store.js";
import { el, esc, openWindow } from "./ui.js";

/* two parts the screen places: the Notes button (bottom bar) and the panel (the left dock, so it never covers anything) */
export function notesWidget() {
  const btn = el(
    `<button type="button" class="notes-tab" aria-pressed="false">Notes <span class="n"></span></button>`,
  );
  const panel = el(`<section class="notes-panel dock-panel" hidden>
      <header><h3>Notes</h3><button type="button" class="win-x" aria-label="Close the notes">×</button></header>
      <form class="notes-add"><input maxlength="200" placeholder="A question idea" aria-label="New note"><button type="submit" class="btn" aria-label="Add the note">+</button></form>
      <ul class="notes-list"></ul>
    </section>`);
  const w = { btn, panel },
    list = panel.querySelector(".notes-list"),
    inp = panel.querySelector("input");
  const paint = () => {
    btn.querySelector(".n").textContent = profile.notes.length
      ? `(${profile.notes.length})`
      : "";
    list.innerHTML =
      profile.notes
        .map(
          (n, i) =>
            `<li><span>${esc(n)}</span><button type="button" class="x" data-i="${i}" aria-label="Delete the note">×</button></li>`,
        )
        .join("") || '<li class="dim small">No notes yet.</li>';
  };
  const toggle = (open) => {
    panel.hidden = !open;
    btn.setAttribute("aria-pressed", String(open));
    if (w.onToggle) w.onToggle();
    if (open) inp.focus();
  };
  btn.onclick = () => toggle(panel.hidden);
  panel.querySelector(".win-x").onclick = () => toggle(false);
  panel.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const t = inp.value.trim();
    if (!t) return;
    profile.notes.push(t);
    save();
    inp.value = "";
    paint();
  };
  list.onclick = (e) => {
    const b = e.target.closest(".x");
    if (b) {
      profile.notes.splice(+b.dataset.i, 1);
      save();
      paint();
    }
  };
  inp.onkeydown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      toggle(false);
      inp.blur();
    }
  };
  paint();
  return w;
}

/* choose a note; resolves with its text, or null */
export function pickNote() {
  if (!profile.notes.length)
    return openWindow(
      '<h2>Notes</h2><p class="dim">No notes yet. Notes is at the bottom left.</p>',
      { cls: "win-small" },
    ).then(() => null);
  return openWindow(
    `<h2>Add a prompt from Notes</h2><ul class="note-pick">${profile.notes.map((n, i) => `<li><button type="button" class="tile" data-i="${i}">${esc(n)}</button></li>`).join("")}</ul>`,
    {
      cls: "win-small",
      onOpen: (w, close) => {
        w.querySelector(".note-pick").onclick = (e) => {
          const b = e.target.closest("[data-i]");
          if (b) close(profile.notes[+b.dataset.i]);
        };
      },
    },
  );
}
