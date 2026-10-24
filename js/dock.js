/* ---------- the docks: where Notes and the chat open ----------
   The lobby and the game are grids with a dock on each side and one above the bottom bar. Notes opens in the left dock;
   the chat opens at the side chosen in Settings (left, right or bottom; hidden still opens on T, at the left). The board
   or the lobby gets narrower or shorter to make room, so nothing ever covers anything. The bottom bar holds the Notes and
   chat buttons, the small key hints, and the jump counter in the middle. */
import { $ } from './ui.js';
import { profile } from './store.js';
import { notesWidget } from './notes.js';
import { chatWidget } from './chat.js';
import { showJumps } from './jumps.js';

export function mountDocks(S, hints = '') {
  const notes = notesWidget(), chat = chatWidget();
  const place = () => {
    const side = profile.settings.chatSide;
    $('.bbar-l', S).replaceChildren(notes.btn, ...(side === 'right' || side === 'hidden' ? [] : [chat.btn]));
    if (hints) { const h = document.createElement('span'); h.className = 'hints'; h.innerHTML = hints; $('.bbar-l', S).append(h); }
    $('.bbar-r', S).replaceChildren(...(side === 'right' ? [chat.btn] : []));
    $('.dock-l', S).replaceChildren(notes.panel, ...(side === 'left' || side === 'hidden' ? [chat.panel] : []));
    $('.dock-r', S).replaceChildren(...(side === 'right' ? [chat.panel] : []));
    $('.dock-b', S).replaceChildren(...(side === 'bottom' ? [chat.panel] : []));
    sync();
  };
  /* empty docks take no room */
  const sync = () => {
    for (const d of S.querySelectorAll('.dock-l, .dock-r, .dock-b')) d.classList.toggle('open', [...d.children].some(c => !c.hidden));
    dispatchEvent(new Event('resize'));
  };
  notes.onToggle = chat.onToggle = sync;
  place(); showJumps(S);
  document.addEventListener('settings', place);
  return { destroy() { chat.destroy(); document.removeEventListener('settings', place); } };
}
/* the grid pieces every docked screen has */
export const DOCK_HTML = '<div class="dock-l"></div><div class="dock-r"></div><div class="dock-b"></div>';
export const BAR_HTML = (center = '') => `<footer class="bbar"><div class="bbar-l"></div><div class="bbar-c">${center}<span class="jumps-slot"></span></div><div class="bbar-r"></div></footer>`;
