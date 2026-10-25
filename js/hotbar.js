/* ---------- the specials on the number keys ----------
   On a computer: a small see-through row of the ten keys (1 … 9, 0) sits in the top bar, just after the title, so it
   covers nothing; it lets every click through. It comes in with each new stage on the board and with each key pressed
   (that key glowing); after 5 seconds unused it slides up off the screen. Keys kept on (Shift and the key) light up green
   and stay where they are while the rest fade, so you can always see what's on. Phones have no row: holding still on the
   board brings the specials around the finger (see touch.js); a tap uses one, holding one keeps it on, and lifting the
   holding finger over one uses it too. */
import { esc } from './ui.js';
import { KEYS, specialById } from './specials.js';

const LIFE = 5000;   // how long the row (or the ring of specials) stays after its last use
const HOLD = 450;    // on a phone: holding a special this long keeps it on

/* api: keys() → the ten ids (or null), kept() → the set of ids kept on, use(i, keep) */
export function mountHotbar(S, api) {
  const bar = document.createElement('div');
  bar.className = 'hotbar gone'; bar.setAttribute('aria-hidden', 'true');
  S.querySelector('.gbar-l').after(bar);
  let timer = 0, sel = -1, sig = '', wheel = null, wheelT = 0;

  const draw = () => {
    const k = api.keys(), on = api.kept(), now = JSON.stringify([k, [...on], sel]);
    if (now === sig) return; sig = now;
    bar.innerHTML = KEYS.map((n, i) => { const sp = specialById(k[i]);
      return `<span class="hk${sp ? '' : ' empty'}${i === sel ? ' sel' : ''}${sp && on.has(sp.id) ? ' on' : ''}"><b>${n}</b>${sp ? `<i>${sp.icon}</i>` : ''}</span>`; }).join('');
  };
  /* the row comes in (i: the key just pressed, glowing), then goes after 5 seconds unused */
  let resting = true, away = false;
  /* resting: only the keys kept on stay (none kept: the row is gone) */
  const settle = () => { const kept = resting && api.kept().size > 0;
    bar.classList.toggle('gone', away || (resting && !kept)); bar.classList.toggle('rest', !away && kept); };
  const show = (i = -1) => {
    sel = i; resting = false; away = false; draw(); settle();
    clearTimeout(timer); timer = setTimeout(() => { sel = -1; resting = true; draw(); settle(); }, LIFE);
  };
  const hide = () => { clearTimeout(timer); resting = true; away = true; settle(); closeWheel(); };

  /* ---------- phones: the specials around the finger ---------- */
  function closeWheel() { if (!wheel) return; clearTimeout(wheelT); wheel.remove(); wheel = null; }
  function openWheel(x, y) {
    closeWheel();
    const k = api.keys(), on = api.kept(), slots = k.map((id, i) => [id, i]).filter(([id]) => id);
    if (!slots.length) return false;
    const n = slots.length, r = n < 4 ? 64 : 64 + (n - 4) * 9, half = r + 30;
    const cx = Math.max(half + 6, Math.min(innerWidth - half - 6, x)), cy = Math.max(half + 6, Math.min(innerHeight - half - 6, y));
    wheel = document.createElement('div');
    wheel.className = 'sp-wheel';
    wheel.innerHTML = slots.map(([id, i], j) => {
      const a = -Math.PI / 2 + (j / n) * Math.PI * 2, sp = specialById(id);
      return `<button type="button" class="sp-wbtn${on.has(id) ? ' on' : ''}" data-i="${i}" style="left:${(cx + Math.cos(a) * r).toFixed(0)}px;top:${(cy + Math.sin(a) * r).toFixed(0)}px" aria-label="${esc(sp.name)}"><i>${sp.icon}</i><b>${KEYS[i]}</b></button>`;
    }).join('');
    wheel.opened = performance.now();
    document.body.append(wheel);
    let press = null;
    const fire = (i, keep) => { closeWheel(); api.use(i, keep); };
    wheel.addEventListener('pointerdown', e => {
      const b = e.target.closest('.sp-wbtn');
      if (!b) { e.preventDefault(); closeWheel(); return; }   // a tap beside them: they go
      e.preventDefault();
      press = { i: +b.dataset.i, id: e.pointerId, t: setTimeout(() => { const i = press.i; press = null; fire(i, true); }, HOLD) };
    });
    wheel.addEventListener('pointerup', e => { if (!press || press.id !== e.pointerId) return; clearTimeout(press.t); const i = press.i; press = null; fire(i, false); });
    wheel.addEventListener('pointercancel', () => { if (press) clearTimeout(press.t); press = null; });
    wheel.addEventListener('contextmenu', e => e.preventDefault());
    wheelT = setTimeout(closeWheel, LIFE);
    return true;
  }
  /* the finger that brought the ring up, lifted over one of them: that one */
  function lifted(e) {
    if (!wheel || performance.now() - wheel.opened < 120) return;
    const b = document.elementFromPoint(e.clientX, e.clientY);
    const btn = b && b.closest && b.closest('.sp-wbtn');
    if (btn && wheel.contains(btn)) { const i = +btn.dataset.i; closeWheel(); api.use(i, false); }
  }
  addEventListener('pointerup', lifted);

  return {
    show, hide, wheel: openWheel, closeWheel,
    refresh() { draw(); settle(); },
    destroy() { hide(); bar.remove(); removeEventListener('pointerup', lifted); },
  };
}
