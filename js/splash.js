/* ---------- the start screen: your duck on a cloud, "TAP TO START" on letter blocks below ----------
   Browsers hold every sound until the page is first used, so the game asks for that first tap here. A tap, a click or a
   key anywhere: the duck drops through the cloud with a falling whistle, and the screen turns see-through and fades away,
   showing the front page (whose music that same tap starts). Leaving the front page any other way takes it away at once. */
import { duckSVG } from './duck.js';
import { cloudSVG, FRIDGE } from './art.js';
import { profile } from './store.js';
import { dive } from './sound.js';

const block = (ch, i) => `<span class="sb-block" style="--c:${FRIDGE[i % FRIDGE.length]};--r:${(((i * 37) % 9) - 4) * .9}deg;--d:${(i * .09).toFixed(2)}s">${ch}</span>`;

export function showSplash() {
  if (document.querySelector('.splash')) return;
  let i = 0;
  const words = ['TAP', 'TO', 'START'].map(w => `<span class="sb-word">${[...w].map(ch => block(ch, i++)).join('')}</span>`).join('');
  const s = document.createElement('div');
  s.className = 'splash'; s.setAttribute('role', 'button'); s.setAttribute('aria-label', 'Tap to start'); s.tabIndex = 0;
  s.innerHTML = `<div class="sp-stage"><div class="sp-duck">${duckSVG(profile.duck, { size: 150, shadow: false })}</div>
    <div class="sp-cloud">${cloudSVG(300)}</div></div><div class="sp-blocks">${words}</div>`;
  document.body.append(s);
  let gone = false;
  const close = (soft = true) => {
    if (gone) return; gone = true;
    for (const k of ['pointerdown', 'keydown']) removeEventListener(k, go, true);
    document.removeEventListener('screen', away);
    if (!soft) { s.remove(); return; }
    dive(); s.classList.add('falling'); setTimeout(() => { s.style.pointerEvents = 'none'; }, 400);   // (the tap's own click lands here, not on the page below)
    setTimeout(() => s.remove(), 1700);
  };
  const go = e => { if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return; e.preventDefault(); close(); };
  const away = () => { if (document.body.dataset.screen !== 'front') close(false); };
  for (const k of ['pointerdown', 'keydown']) addEventListener(k, go, true);
  document.addEventListener('screen', away);
  s.focus({ preventScroll: true });
}
