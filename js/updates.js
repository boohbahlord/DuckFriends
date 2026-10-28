/* ---------- Updates ----------
   What changed, newest first, one page per day. The Updates button on the front page opens this window and shows a dot
   until the newest page has been opened on this device. I want short, plain words for players, not a list of everything. */
import { openWindow, esc } from './ui.js';
import { rainbowHTML } from './art.js';

export const UPDATES = [
  { id: '2026-10-28', date: 'Oct 28', title: 'Weapons, ghosts and poker',
    news: ['New specials: a knife, a hammer (or wrench) and a pistol that holds 7 shots; R reloads.',
      'In Duck Cabin, a new setting turns knocked-out ducks into ghosts that can walk around; Space brings the body back.',
      'Poker at the card table, and you can invite Justin to play.',
      'A knocked-down duck stands up by itself, so you can stay at the table.',
      'Low graphics in Settings, and the font list folds away.'],
    fixed: ['2/3 of votes now ends the turn at 2 of 3 players.',
      'Bicker Brackets shows the right side on phones.',
      'The piano\'s get-up button says Esc.',
      'Colorblind mode recolors the two-sided boards.'] },
  { id: '2026-10-27', date: 'Oct 27', title: 'Blackjack, Jack in a Box and outfits',
    news: ['Blackjack on the round table, with eight stools and Justin\'s Butler dealing.',
      'Jack and Jill in a Box, plus jester and clown items; locked ones show how to get them.',
      'A real pumpkin, antenna eyes and color dropdowns.',
      'Justin joins every game mode.'],
    fixed: ['Outfit fixes: the biker jacket, Swiss cheese, the gold crown and the coolest-first metals.',
      'The wing shows under tank tops and jerseys.',
      'Fewer pops and crackles in songs and the piano.'] },
  { id: '2026-10-26', date: 'Oct 26', title: 'Power box and the dark',
    news: ['Duck Cabin has a power box: flip the lever and the lights, the TV and the music go out.',
      'It is darker outside, flames can be put out, and the music sounds muffled in the dark.'],
    fixed: ['The Duck Cabin phone button no longer sits under tips.',
      'Key hints are hidden on touch-only phones.'] },
  { id: '2026-10-25', date: 'Oct 25', title: 'Night Show and the toy train',
    news: ['The Night Show room has a toy train.',
      'Duck Cabin\'s cats, Justin and the shadow duck.'],
    fixed: ['Players who join mid-game play right away.'] },
];

const KEY = 'duckfriends-updates-seen';
export const seenUpdate = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
export const hasNewUpdate = () => seenUpdate() !== UPDATES[0].id;
const markSeen = () => { try { localStorage.setItem(KEY, UPDATES[0].id); } catch (e) { /* blocked */ } };

const list = (cls, head, items) => items.length ? `<h3 class="up-h ${cls}">${head}</h3><ul class="up-list">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';

export function openUpdates() {
  markSeen();
  return openWindow(`<h2 class="up-title">${rainbowHTML('Updates')}</h2>
    <div class="up-nav"><button type="button" class="btn ghost up-arrow" data-d="1" aria-label="Older update">◀</button>
      <div class="up-head"><b class="up-date"></b><span class="up-name"></span></div>
      <button type="button" class="btn ghost up-arrow" data-d="-1" aria-label="Newer update">▶</button></div>
    <div class="up-body"></div><p class="up-count dim"></p>`, {
    cls: 'win-updates',
    onOpen(w) {
      let i = 0;
      const show = n => {
        i = Math.max(0, Math.min(UPDATES.length - 1, n));
        const u = UPDATES[i];
        w.querySelector('.up-date').textContent = u.date;
        w.querySelector('.up-name').textContent = u.title;
        w.querySelector('.up-body').innerHTML = list('new', 'New', u.news) + list('fix', 'Fixed', u.fixed);
        w.querySelector('.up-count').textContent = `${i + 1} of ${UPDATES.length}`;
        w.querySelector('[data-d="1"]').disabled = i === UPDATES.length - 1;
        w.querySelector('[data-d="-1"]').disabled = i === 0;
      };
      w.querySelectorAll('.up-arrow').forEach(b => b.onclick = () => show(i + +b.dataset.d));
      const key = e => {
        if (!w.isConnected) return removeEventListener('keydown', key, true);
        if (e.key === 'ArrowLeft') { show(i + 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { show(i - 1); e.preventDefault(); }
      };
      addEventListener('keydown', key, true);
      show(0);
    },
  });
}
