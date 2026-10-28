/* ---------- Specials ----------
   Each special sits on a number key, 1 to 9 or 0, picked under Customize → Specials (the keys travel with the duck's look):
   - effects (electricity, flames, hearts, a poison cloud, music notes, the Loser's X, a disco ball, ducklings): their key
     shows them on the duck for 5 seconds, seen by everyone; Shift and the key keeps one on until Shift and the key again.
     They show only from the keys (the Loser's X also follows a duck that loses in brackets); the ducklings walk in a row
     behind their duck, along its path;
   - jumps: the Long jump's key does a long jump (Shift and the key: every jump is long); the Double jump's key jumps
     again in the air, once a jump, with a small see-through cloud (Shift and the key: Space does it too);
   - items, used with their key: coffee, a water gun, a hotdog, a confetti gun, a handgun whose slow bullet knocks ducks
     down (they play dead until they move), a thrown dagger that arcs down off the screen knocking down every duck in its
     way, a sound, a trombone's sour note, or confetti over everyone's screen. On a computer the handgun and the dagger
     fly toward the mouse, the weapon turning around the duck to aim; Shift and the key keeps one out, and a left click
     uses it.
   On a phone, holding still on the board brings the specials around the finger (see hotbar.js). Effects and items take
   up to three colors (Primary, Secondary, Accent) under Customize → Colors. */
import { el } from './ui.js';
import { fewer } from './gfx.js';
export { SHOT_SPEED } from './rules.js';

/* the trombone, side on: the mouthpiece at the left end (at the beak), the slide reaching forward, the bell above it */
const BONE = ([a, b]) => {
  const tube = (d, w) => `<path d="${d}" fill="none" stroke="#5a3d00" stroke-width="${w + 1.4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${a}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 64 28"><path d="M0 12.6h3.4v4.8H0Z" fill="${b}" stroke="#5a3d00" stroke-width="1"/>${tube('M3 15H30M12 22H30', 1.8)}
    <g class="bone-slide">${tube('M24 15H52a3.5 3.5 0 0 1 0 7H24', 2.4)}<path d="M40 15v7" stroke="#5a3d00" stroke-width="1.6"/></g>
    ${tube('M12 22H8a3.5 3.5 0 0 1-3.5-3.5V9A3.5 3.5 0 0 1 8 5.5H22', 2.2)}
    <path d="M21 4.2L36 .6V11.9L21 6.8Z" fill="${a}" stroke="#5a3d00" stroke-width="1" stroke-linejoin="round"/><ellipse cx="36" cy="6.25" rx="1.8" ry="5.9" fill="${b}" stroke="#5a3d00" stroke-width="1"/>
    <path d="M24 4.6L33 2.4" stroke="#fff" stroke-width=".9" opacity=".6"/></svg>`;
};
/* the dagger, pointing right: the blade, the guard across it, the handle */
const DAGGER = ([a, b, c]) => `<svg viewBox="0 0 44 16"><path d="M14 5.2H36L43 8 36 10.8H14Z" fill="${a}" stroke="#2a2d38" stroke-width="1.2" stroke-linejoin="round"/><path d="M15 8H38" stroke="#fff" stroke-width=".9" opacity=".55"/><rect x="11" y="1.5" width="3.6" height="13" rx="1.5" fill="${c}" stroke="#2a2d38" stroke-width="1.1"/><rect x="2" y="5.6" width="9.4" height="4.8" rx="2" fill="${b}" stroke="#2a2d38" stroke-width="1.1"/><circle cx="2.4" cy="8" r="2" fill="${c}" stroke="#2a2d38" stroke-width="1"/></svg>`;
/* a duckling, facing right, in its colors (body, beak) */
export const DUCKLING = ([a, b]) => `<svg viewBox="0 0 30 26"><ellipse cx="15" cy="24.6" rx="9" ry="1.6" fill="#0005"/><path d="M4 15c0-5 5-7 10-6l3-1c0-4 3-7 6.5-6.5S29 5 28 9c-.4 2-1.6 3-2.6 3.6C27 16 25 22 16 22 8 22 4 19 4 15Z" fill="${a}" stroke="#3a2a10" stroke-width="1.2" stroke-linejoin="round"/><path d="M27.2 7.6l2.6 1.1-2.9 1.2Z" fill="${b}" stroke="#3a2a10" stroke-width=".8" stroke-linejoin="round"/><circle cx="24.4" cy="6.6" r="1.2" fill="#1c1c28"/><path d="M8 14c3 3 7 3 9 0" fill="none" stroke="#3a2a10" stroke-width="1" opacity=".55"/><path d="M4.6 13.4 1.4 11.6 4.4 16Z" fill="${a}" stroke="#3a2a10" stroke-width=".9" stroke-linejoin="round"/></svg>`;
const P = 'Primary', S2 = 'Secondary', A = 'Accent';
export const SPECIALS = [
  { id: 'zap', name: 'Electricity', kind: 'effect', icon: '⚡', tip: 'Sparks crackle over your head.', colors: [['a', P, '#fff36a'], ['b', S2, '#2fa4ff'], ['c', A, '#7fd0ff']] },
  { id: 'flames', name: 'Flames', kind: 'effect', icon: '🔥', tip: 'Your head burns with dancing flames.', colors: [['a', P, '#ff5a1a'], ['b', S2, '#ffb347'], ['c', A, '#fff2b0']] },
  { id: 'hearts', name: 'Hearts', kind: 'effect', icon: '💕', tip: 'Hearts float around your head.', colors: [['a', P, '#ff4f8b']] },
  { id: 'poison', name: 'Poison cloud', kind: 'effect', icon: '☠️', tip: 'A green cloud swirls around your head.', colors: [['a', P, '#8cff6a'], ['b', S2, '#3fae2a']] },
  { id: 'notes', name: 'Music notes', kind: 'effect', icon: '🎵', tip: 'Music notes float around your head.', colors: [['a', P, '#ffffff'], ['b', S2, '#9b5de5']] },
  { id: 'loserx', name: 'Loser\'s X', kind: 'effect', icon: '❌', tip: 'A big red X over your duck. It also follows you when you lose in Bicker Brackets.', colors: [['a', P, '#ef3b3b']] },
  { id: 'disco', name: 'Disco ball', kind: 'effect', icon: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#c9ced8" stroke="#3a3d48" stroke-width="1.4"/><g fill="none" stroke="#3a3d48" stroke-width="1" opacity=".6"><ellipse cx="15" cy="15" rx="6" ry="13"/><path d="M2 15h26M4 9h22M4 21h22"/></g><circle cx="10" cy="9" r="2.6" fill="#fff"/><path d="M22 6l1-3 1 3 3 1-3 1-1 3-1-3-3-1Z" fill="#ffe94a"/></svg>', tip: 'A disco ball spins over your head, its colored lights sweeping over you.', colors: [['a', P, '#ff4fd8'], ['b', S2, '#3fd0ff'], ['c', A, '#ffe94a']] },
  { id: 'ducklings', name: 'Ducklings', kind: 'effect', icon: '🐤', tip: 'Three little ducklings follow you in a row, wherever you walk.', colors: [['a', P, '#ffd23f'], ['b', S2, '#ff8c2b']] },
  { id: 'longjump', name: 'Long jump', kind: 'jump', icon: '🦘', tip: 'Its key does a long jump: longer and a little higher. Shift and the key: every jump is long.' },
  { id: 'double', name: 'Double jump', kind: 'jump', icon: '☁️', tip: 'In the air, its key jumps again off a little cloud, once a jump. Shift and the key: Space does it too.', colors: [['a', P, '#ffffff']] },
  { id: 'coffee', name: 'Coffee', kind: 'item', icon: '☕', tip: 'Your duck sips coffee from a mug.', colors: [['a', P, '#f4f1ea'], ['b', S2, '#6b3e1e']] },
  { id: 'watergun', name: 'Water gun', kind: 'item', icon: '💦', tip: 'Your duck sprays a water gun the way it faces.', colors: [['a', P, '#2fa4ff'], ['b', S2, '#ffd23f'], ['c', A, '#7fd0ff']] },
  { id: 'hotdog', name: 'Hotdog', kind: 'item', icon: '🌭', tip: 'Your duck munches a hotdog, crumbs flying.' },
  { id: 'confgun', name: 'Confetti gun', kind: 'item', icon: '🎉', tip: 'A burst of confetti the way your duck faces.' },
  { id: 'handgun', name: 'Handgun', kind: 'item', icon: '🔫', tip: 'A slow bullet flies toward your mouse; any duck it passes through plays dead until it moves. Shift and its key keeps it out: left click shoots. (Off when the host turns off the silly commands.)', colors: [['a', P, '#2b2d35'], ['b', S2, '#5a3a22'], ['c', A, '#c9a24a']] },
  { id: 'dagger', name: 'Dagger', kind: 'item', icon: DAGGER(['#d9dee8', '#6b3e1e', '#c9a24a']).replace('<svg ', '<svg style="transform:rotate(-40deg)" '), tip: 'Throw a dagger toward your mouse: it spins in an arc and falls off the screen, and every duck it hits plays dead until it moves. Shift and its key keeps it out: left click throws. (Off when the host turns off the silly commands.)', colors: [['a', P, '#d9dee8'], ['b', S2, '#6b3e1e'], ['c', A, '#c9a24a']] },
  { id: 'sound', name: 'Sound', kind: 'item', off: true, icon: '🔊', tip: 'Everyone hears your sound.', colors: [['a', P, '#ffffff']] },
  { id: 'trombone', name: 'Trombone', kind: 'item', icon: BONE(['#e8b73a', '#fff2b0']), tip: 'Your duck plays the trombone. Every note comes out wrong.', colors: [['a', P, '#e8b73a'], ['b', S2, '#fff2b0']] },
  { id: 'confetti', name: 'Confetti rain', kind: 'item', icon: '🎊', tip: 'Confetti rains over everyone\'s screen. It also rains when your question comes up, when you win, and on the podium.' },
];
export const specialById = id => SPECIALS.find(x => x.id === id) || null;
/* a special that's off for now (faded everywhere, can't be picked or used; a duck that has it keeps it on its key) */
export const isOff = id => !!(specialById(id) || {}).off;
export const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];   // the number keys, in the order of the row
/* a duck's ten keys: a special's id or null on each (a duck from before the keys had one special: it is on key 1) */
export function keysOf(duck) {
  const d = duck || {}, k = Array.isArray(d.keys) ? d.keys : [d.special];
  return KEYS.map((_, i) => specialById(k[i]) ? k[i] : null);
}
export const hasKey = (duck, id) => keysOf(duck).includes(id);
/* a special's colors on a duck: [Primary, Secondary, Accent], each the duck's own or the special's */
const HEX = /^#[0-9a-f]{3,8}$/i;
export function colorsOf(duck, id) {
  const sp = specialById(id), mine = ((duck || {}).spc || {})[id] || {};
  return ((sp && sp.colors) || []).map(([k, , def]) => HEX.test(mine[k]) ? mine[k] : def);
}
const vars = c => c.map((v, i) => `--k${i + 1}:${v}`).join(';');

/* an effect around a duck's head (sits over the duck picture; the head is up and to the right) */
export function momentHTML(id, duck) {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i)).join(''), st = `style="${vars(colorsOf(duck, id))}"`;
  switch (id) {
    case 'zap': return `<span class="spx spx-zap" ${st}>${n(3, i => `<svg viewBox="0 0 40 60" style="--i:${i}"><path d="M22 0L8 30h12L12 60l22-36H20L30 0Z"/></svg>`)}</span>`;
    case 'flames': return `<span class="spx spx-flames" ${st}>${n(4, i => `<i style="--i:${i}"></i>`)}</span>`;
    case 'hearts': return `<span class="spx spx-float" ${st}>${n(5, i => `<i style="--i:${i}">♥</i>`)}</span>`;
    case 'poison': return `<span class="spx spx-poison" ${st}>${n(5, i => `<i style="--i:${i}"></i>`)}</span>`;
    case 'notes': return `<span class="spx spx-float spx-notes" ${st}>${n(5, i => `<i style="--i:${i}">${'♪♫♩♬♪'[i]}</i>`)}</span>`;
    case 'loserx': return `<span class="spx spx-x" ${st}><svg viewBox="0 0 40 40"><path d="M8 8L32 32M32 8L8 32"/></svg></span>`;
    case 'disco': return `<span class="spx spx-disco" ${st}><i class="disco-beams"></i>${n(5, i => `<i class="disco-spot" style="--i:${i}"></i>`)}<i class="disco-string"></i><svg class="disco-ball" viewBox="0 0 30 30"><defs><radialGradient id="dball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9ced8"/><stop offset="1" stop-color="#6c7280"/></radialGradient></defs><circle cx="15" cy="15" r="13" fill="url(#dball)" stroke="#3a3d48" stroke-width="1"/><g fill="none" stroke="#3a3d48" stroke-width=".7" opacity=".55"><ellipse cx="15" cy="15" rx="6" ry="13"/><ellipse cx="15" cy="15" rx="11" ry="13"/><path d="M2 15h26M4 9h22M4 21h22M8 4.2h14M8 25.8h14"/></g><circle cx="10" cy="9" r="2.2" fill="#fff" opacity=".9"/></svg></span>`;
    case 'ducklings': return `<span class="spx spx-ducklings" ${st}>${n(3, i => `<i style="--i:${i}">${DUCKLING(colorsOf(duck, id))}</i>`)}</span>`;   // (a still row, for the menus; on the board they follow their duck's path)
    default: return '';
  }
}

/* confetti over the whole screen for a few seconds (a few dozen pieces, then gone) */
export function confettiRain(ms = 5000) {
  if (document.documentElement.classList.contains('lite') || document.querySelector('.confetti-rain')) return;
  const colors = ['#ef3b3b', '#ffd23f', '#37d421', '#2fa4ff', '#9b5de5', '#ff7eb6', '#ff8c2b'];
  const node = el(`<div class="confetti-rain" aria-hidden="true">${Array.from({ length: fewer(42) }, (_, i) =>
    `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 1.6).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 1.6).toFixed(2)}s;--r:${Math.round(Math.random() * 720 - 360)}deg"></i>`).join('')}</div>`);
  document.body.appendChild(node); setTimeout(() => node.remove(), ms);
}

/* the double jump's little cloud, left in the air where the second jump began: x, y = the duck's feet in pixels */
export function puffHTML(x, y, size, color) {
  return `<div class="spe spe-puff" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--s:${size.toFixed(0)}px;--k1:${color}"><svg viewBox="0 0 60 30"><g><circle cx="16" cy="18" r="10"/><circle cx="30" cy="13" r="12"/><circle cx="44" cy="18" r="10"/><rect x="14" y="16" width="32" height="12" rx="6"/></g></svg></div>`;
}

/* an item's moment, at a duck: x, y = its feet in pixels, size = the duck's size, face = 1 right or -1 left, duck = its
   look (for the item's colors) */
const MUG = ([a, b]) => `<svg viewBox="0 0 30 30"><path d="M5 9h16v13a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" fill="${a}" stroke="#1c1c28" stroke-width="1.6"/><path d="M21 12h3a3.5 3.5 0 0 1 0 7h-3" fill="none" stroke="#1c1c28" stroke-width="1.6"/><path d="M6.5 11h13" stroke="${b}" stroke-width="2.4"/><path d="M9 4c1 2-1 3 0 5M13 3c1 2-1 3 0 5M17 4c1 2-1 3 0 5" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/></svg>`;
const WGUN = ([a, b]) => `<svg viewBox="0 0 40 24"><path d="M4 8h24l4-3h5v8h-5l-2 2H18l-2 7h-6l2-7H4Z" fill="${a}" stroke="#1c1c28" stroke-width="1.5" stroke-linejoin="round"/><rect x="12" y="2" width="9" height="6" rx="2" fill="${b}" stroke="#1c1c28" stroke-width="1.3"/></svg>`;
const PISTOL = ([a, b]) => `<svg viewBox="0 0 40 24"><path d="M17 11l-2 10H8l2-10Z" fill="${b}" stroke="#0e0e14" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 5h30v6H4Z" fill="${a}" stroke="#0e0e14" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 11l4 4" stroke="#0e0e14" stroke-width="1.4"/></svg>`;
const DOG = '<svg viewBox="0 0 40 20"><rect x="2" y="5" width="36" height="10" rx="5" fill="#eab36a" stroke="#1c1c28" stroke-width="1.4"/><rect x="5" y="7" width="30" height="6" rx="3" fill="#c0502b"/><path d="M7 9l3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2" stroke="#ffd23f" stroke-width="1.4" fill="none"/></svg>';
export function pressFX(id, x, y, size, face, duck) {
  const head = { x: x + face * size * .2, y: y - size * .72 }, beak = { x: x + face * size * .38, y: y - size * .6 }, out = [], c = colorsOf(duck, id);
  const at = (cls, html, px, py, extra = '') => el(`<div class="spe ${cls}" style="left:${px.toFixed(0)}px;top:${py.toFixed(0)}px;--f:${face};--s:${size.toFixed(0)}px;${extra}">${html}</div>`);
  if (id === 'coffee') out.push(at('spe-mug', MUG(c), head.x + face * size * .28, head.y + size * .08));
  if (id === 'hotdog') {
    out.push(at('spe-dog', DOG, head.x + face * size * .3, head.y + size * .12));
    for (let i = 0, n = fewer(6); i < n; i++) out.push(at('spe-crumb', '', head.x + face * size * .3, head.y + size * .15, `--dx:${(Math.random() * 60 - 30).toFixed(0)}px;--dy:${(20 + Math.random() * 30).toFixed(0)}px;animation-delay:${(i * .18).toFixed(2)}s`));
  }
  if (id === 'watergun') {
    out.push(at('spe-gun', WGUN(c), x + face * size * .45, y - size * .38));
    for (let i = 0, n = fewer(14); i < n; i++) out.push(at('spe-drop', '', x + face * size * .75, y - size * .43, `--dx:${(face * (90 + Math.random() * 120)).toFixed(0)}px;--dy:${(Math.random() * 40 - 10).toFixed(0)}px;animation-delay:${(i * .05).toFixed(2)}s;--k1:${c[2]}`));
  }
  if (id === 'confgun') {
    const colors = ['#ef3b3b', '#ffd23f', '#37d421', '#2fa4ff', '#9b5de5', '#ff7eb6'];
    for (let i = 0, n = fewer(22); i < n; i++) out.push(at('spe-conf', '', x + face * size * .42, y - size * .28, `background:${colors[i % 6]};--dx:${(face * (40 + Math.random() * 140)).toFixed(0)}px;--dy:${(-Math.random() * 120 + 20).toFixed(0)}px;--r:${Math.round(Math.random() * 540)}deg`));
  }
  if (id === 'handgun') out.push(at('spe-gun spe-pistol', PISTOL(c), x + face * size * .45, y - size * .38));
  if (id === 'sound') for (let i = 0; i < 3; i++) out.push(at('spe-ring', '', beak.x, beak.y, `animation-delay:${(i * .25).toFixed(2)}s;--k1:${c[0]}`));
  if (id === 'trombone') {   // the mouthpiece at the beak's tip; a sour note wobbles out of the bell
    out.push(at('spe-bone', BONE(c), x + face * size * .44, y - size * .58));
    for (let i = 0; i < 3; i++) out.push(at('spe-sour', '♪', x + face * size * .78, y - size * .78, `animation-delay:${(.15 + i * .3).toFixed(2)}s;--dx:${(face * (18 + i * 10)).toFixed(0)}px`));
  }
  return out;
}
/* the handgun or the dagger in a duck's hand, pointing right (the game turns it toward where it aims) */
export function heldHTML(id, duck) { const c = colorsOf(duck, id); return id === 'dagger' ? DAGGER(c) : PISTOL(c); }
export const daggerHTML = duck => DAGGER(colorsOf(duck, 'dagger'));
/* the handgun's bullet, in the shooter's Accent color */
export const BULLET = (c = '#c9a24a') => `<svg viewBox="0 0 24 10"><path d="M2 5h14" stroke="#ffd84a" stroke-width="2" opacity=".6"/><path d="M14 2h5a3 3 0 0 1 0 6h-5Z" fill="${c}" stroke="#5a4310" stroke-width="1"/></svg>`;
