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

/* puts nodes in a container only when they aren't there already (moving a node would take the focus from a box in it) */
const put = (box, nodes) => {
  const now = [...box.children];
  if (now.length === nodes.length && now.every((n, i) => n === nodes[i])) return;
  box.replaceChildren(...nodes);
};
export function mountDocks(S, hints = '') {
  const notes = notesWidget(), chat = chatWidget();
  const hintEl = hints ? Object.assign(document.createElement('span'), { className: 'hints', innerHTML: hints }) : null;
  const place = () => {
    const side = profile.settings.chatSide;
    put($('.bbar-l', S), [notes.btn, ...(side === 'right' || side === 'hidden' ? [] : [chat.btn]), ...(hintEl ? [hintEl] : [])]);
    put($('.bbar-r', S), side === 'right' ? [chat.btn] : []);
    put($('.dock-l', S), [notes.panel, ...(side === 'left' || side === 'hidden' ? [chat.panel] : [])]);
    put($('.dock-r', S), side === 'right' ? [chat.panel] : []);
    put($('.dock-b', S), side === 'bottom' ? [chat.panel] : []);
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
