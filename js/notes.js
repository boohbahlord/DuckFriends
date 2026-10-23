/* ---------- Notes (bottom left): question ideas, written any time ----------
   A small fold at the bottom left of the lobby and the game. Notes are kept on this device. When writing a question,
   Add a prompt from Notes puts one of them in the box. */
import { profile, save } from './store.js';
import { el, esc, openWindow } from './ui.js';

export function notesWidget() {
  const w = el(`<div class="notes" data-open="false">
    <button type="button" class="notes-tab" aria-expanded="false">Notes <span class="n"></span></button>
    <div class="notes-body" hidden>
      <form class="notes-add"><input maxlength="200" placeholder="A question idea" aria-label="New note"><button type="submit" class="btn" aria-label="Add the note">+</button></form>
      <ul class="notes-list"></ul>
    </div></div>`);
  const body = w.querySelector('.notes-body'), tab = w.querySelector('.notes-tab'), list = w.querySelector('.notes-list'), inp = w.querySelector('input');
  const paint = () => {
    w.querySelector('.n').textContent = profile.notes.length ? `(${profile.notes.length})` : '';
    list.innerHTML = profile.notes.map((n, i) => `<li><span>${esc(n)}</span><button type="button" class="x" data-i="${i}" aria-label="Delete the note">×</button></li>`).join('')
      || '<li class="dim small">No notes yet.</li>';
  };
  tab.onclick = () => { body.hidden = !body.hidden; tab.setAttribute('aria-expanded', !body.hidden); w.dataset.open = !body.hidden; if (!body.hidden) inp.focus(); };
  w.querySelector('form').onsubmit = e => { e.preventDefault(); const t = inp.value.trim(); if (!t) return; profile.notes.push(t); save(); inp.value = ''; paint(); };
  list.onclick = e => { const b = e.target.closest('.x'); if (b) { profile.notes.splice(+b.dataset.i, 1); save(); paint(); } };
  inp.onkeydown = e => { if (e.key === 'Escape') { e.stopPropagation(); tab.click(); inp.blur(); } };
  paint();
  return w;
}

/* choose a note; resolves with its text, or null */
export function pickNote() {
  if (!profile.notes.length) return openWindow('<h2>Notes</h2><p class="dim">No notes yet. Notes sit at the bottom left.</p>', { cls: 'win-small' }).then(() => null);
  return openWindow(`<h2>Add a prompt from Notes</h2><ul class="note-pick">${profile.notes.map((n, i) => `<li><button type="button" class="tile" data-i="${i}">${esc(n)}</button></li>`).join('')}</ul>`, {
    cls: 'win-small',
    onOpen: (w, close) => { w.querySelector('.note-pick').onclick = e => { const b = e.target.closest('[data-i]'); if (b) close(profile.notes[+b.dataset.i]); }; },
  });
}
