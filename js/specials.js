/* ---------- Specials ----------
   One special per duck, picked under Customize → Specials (it travels with the duck's look):
   - moment specials play around the duck's head while it's the Round Lord on the cloud (and, later, when it wins and on
     the podium): electricity, flames, floating hearts, a poison cloud, music notes, confetti over the screen, or a red X
     that follows a duck that loses in brackets;
   - Long jumps: always on, more airtime;
   - E specials: press E (or the E button) on the board: coffee, a water gun, a hotdog, a confetti gun, a handgun whose
     slow bullet knocks ducks down (they play dead until they move), or a sound. */
import { el } from './ui.js';
export { SHOT_SPEED } from './rules.js';

export const SPECIALS = [
  { id: 'zap', name: 'Electricity', kind: 'moment', icon: '⚡', tip: 'Sparks crackle over your head while you are the Round Lord, when you win, and on the podium.' },
  { id: 'flames', name: 'Flames', kind: 'moment', icon: '🔥', tip: 'Your head burns with dancing flames while you are the Round Lord, when you win, and on the podium.' },
  { id: 'hearts', name: 'Hearts', kind: 'moment', icon: '💕', tip: 'Hearts float around your head while you are the Round Lord, when you win, and on the podium.' },
  { id: 'poison', name: 'Poison cloud', kind: 'moment', icon: '☠️', tip: 'A green cloud swirls around your head while you are the Round Lord, when you win, and on the podium.' },
  { id: 'notes', name: 'Music notes', kind: 'moment', icon: '🎵', tip: 'Music notes float around your head while you are the Round Lord, when you win, and on the podium.' },
  { id: 'confetti', name: 'Confetti rain', kind: 'moment', icon: '🎊', tip: 'Confetti rains over everyone\'s screen for a few seconds when your question comes up, when you win, and on the podium.' },
  { id: 'loserx', name: 'Loser\'s X', kind: 'moment', icon: '❌', tip: 'Lose in Bicker Brackets and a big red X follows your duck around.' },
  { id: 'longjump', name: 'Long jumps', kind: 'always', icon: '🦘', tip: 'Your jumps float longer and a little higher.' },
  { id: 'coffee', name: 'Coffee', kind: 'press', icon: '☕', tip: 'Press E (or the E button) on the board: your duck sips coffee from a mug.' },
  { id: 'watergun', name: 'Water gun', kind: 'press', icon: '💦', tip: 'Press E on the board: your duck sprays a water gun the way it faces.' },
  { id: 'hotdog', name: 'Hotdog', kind: 'press', icon: '🌭', tip: 'Press E on the board: your duck munches a hotdog, crumbs flying.' },
  { id: 'confgun', name: 'Confetti gun', kind: 'press', icon: '🎉', tip: 'Press E on the board: a burst of confetti the way your duck faces.' },
  { id: 'handgun', name: 'Handgun', kind: 'press', icon: '🔫', tip: 'Press E on the board: a slow bullet crosses the board; any duck it passes through plays dead until it moves. (Off when the host turns off the silly commands.)' },
  { id: 'sound', name: 'Sound', kind: 'press', icon: '🔊', tip: 'Press E on the board: everyone hears your sound.' },
];
export const specialById = id => SPECIALS.find(x => x.id === id) || null;
export const pressSpecial = id => { const x = specialById(id); return x && x.kind === 'press' ? x : null; };

/* a moment special around a duck's head (sits over the duck picture; the head is up and to the right) */
export function momentHTML(id) {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i)).join('');
  switch (id) {
    case 'zap': return `<span class="spx spx-zap">${n(3, i => `<svg viewBox="0 0 40 60" style="--i:${i}"><path d="M22 0L8 30h12L12 60l22-36H20L30 0Z"/></svg>`)}</span>`;
    case 'flames': return `<span class="spx spx-flames">${n(4, i => `<i style="--i:${i}"></i>`)}</span>`;
    case 'hearts': return `<span class="spx spx-float">${n(5, i => `<i style="--i:${i}">♥</i>`)}</span>`;
    case 'poison': return `<span class="spx spx-poison">${n(5, i => `<i style="--i:${i}"></i>`)}</span>`;
    case 'notes': return `<span class="spx spx-float spx-notes">${n(5, i => `<i style="--i:${i}">${'♪♫♩♬♪'[i]}</i>`)}</span>`;
    case 'loserx': return '<span class="spx spx-x"><svg viewBox="0 0 40 40"><path d="M8 8L32 32M32 8L8 32"/></svg></span>';
    default: return '';
  }
}

/* confetti over the whole screen for a few seconds (a few dozen pieces, then gone) */
export function confettiRain(ms = 5000) {
  if (document.documentElement.classList.contains('lite') || document.querySelector('.confetti-rain')) return;
  const colors = ['#ef3b3b', '#ffd23f', '#37d421', '#2fa4ff', '#9b5de5', '#ff7eb6', '#ff8c2b'];
  const node = el(`<div class="confetti-rain" aria-hidden="true">${Array.from({ length: 42 }, (_, i) =>
    `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 1.6).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 1.6).toFixed(2)}s;--r:${Math.round(Math.random() * 720 - 360)}deg"></i>`).join('')}</div>`);
  document.body.appendChild(node); setTimeout(() => node.remove(), ms);
}

/* an E special's moment, at a duck: x, y = its feet in pixels, size = the duck's size, face = 1 right or -1 left */
const MUG = '<svg viewBox="0 0 30 30"><path d="M5 9h16v13a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" fill="#f4f1ea" stroke="#1c1c28" stroke-width="1.6"/><path d="M21 12h3a3.5 3.5 0 0 1 0 7h-3" fill="none" stroke="#1c1c28" stroke-width="1.6"/><path d="M6.5 11h13" stroke="#6b3e1e" stroke-width="2.4"/><path d="M9 4c1 2-1 3 0 5M13 3c1 2-1 3 0 5M17 4c1 2-1 3 0 5" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/></svg>';
const WGUN = '<svg viewBox="0 0 40 24"><path d="M4 8h24l4-3h5v8h-5l-2 2H18l-2 7h-6l2-7H4Z" fill="#2fa4ff" stroke="#1c1c28" stroke-width="1.5" stroke-linejoin="round"/><rect x="12" y="2" width="9" height="6" rx="2" fill="#ffd23f" stroke="#1c1c28" stroke-width="1.3"/></svg>';
const PISTOL = '<svg viewBox="0 0 40 24"><path d="M4 5h30v6H17l-2 10H8l2-10H4Z" fill="#2b2d35" stroke="#0e0e14" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 11l4 4" stroke="#0e0e14" stroke-width="1.4"/></svg>';
const DOG = '<svg viewBox="0 0 40 20"><rect x="2" y="5" width="36" height="10" rx="5" fill="#eab36a" stroke="#1c1c28" stroke-width="1.4"/><rect x="5" y="7" width="30" height="6" rx="3" fill="#c0502b"/><path d="M7 9l3 2 3-2 3 2 3-2 3 2 3-2 3 2 3-2" stroke="#ffd23f" stroke-width="1.4" fill="none"/></svg>';
export function pressFX(id, x, y, size, face) {
  const head = { x: x + face * size * .2, y: y - size * .72 }, out = [];
  const at = (cls, html, px, py, extra = '') => el(`<div class="spe ${cls}" style="left:${px.toFixed(0)}px;top:${py.toFixed(0)}px;--f:${face};--s:${size.toFixed(0)}px;${extra}">${html}</div>`);
  if (id === 'coffee') out.push(at('spe-mug', MUG, head.x + face * size * .28, head.y + size * .08));
  if (id === 'hotdog') {
    out.push(at('spe-dog', DOG, head.x + face * size * .3, head.y + size * .12));
    for (let i = 0; i < 6; i++) out.push(at('spe-crumb', '', head.x + face * size * .3, head.y + size * .15, `--dx:${(Math.random() * 60 - 30).toFixed(0)}px;--dy:${(20 + Math.random() * 30).toFixed(0)}px;animation-delay:${(i * .18).toFixed(2)}s`));
  }
  if (id === 'watergun') {
    out.push(at('spe-gun', WGUN, x + face * size * .45, y - size * .45));
    for (let i = 0; i < 14; i++) out.push(at('spe-drop', '', x + face * size * .75, y - size * .5, `--dx:${(face * (90 + Math.random() * 120)).toFixed(0)}px;--dy:${(Math.random() * 40 - 10).toFixed(0)}px;animation-delay:${(i * .05).toFixed(2)}s`));
  }
  if (id === 'confgun') {
    const colors = ['#ef3b3b', '#ffd23f', '#37d421', '#2fa4ff', '#9b5de5', '#ff7eb6'];
    for (let i = 0; i < 22; i++) out.push(at('spe-conf', '', x + face * size * .45, y - size * .5, `background:${colors[i % 6]};--dx:${(face * (40 + Math.random() * 140)).toFixed(0)}px;--dy:${(-Math.random() * 120 + 20).toFixed(0)}px;--r:${Math.round(Math.random() * 540)}deg`));
  }
  if (id === 'handgun') out.push(at('spe-gun spe-pistol', PISTOL, x + face * size * .45, y - size * .45));
  if (id === 'sound') for (let i = 0; i < 3; i++) out.push(at('spe-ring', '', head.x, head.y, `animation-delay:${(i * .25).toFixed(2)}s`));
  return out;
}
export const BULLET = '<svg viewBox="0 0 24 10"><path d="M2 5h14" stroke="#ffd84a" stroke-width="2" opacity=".6"/><path d="M14 2h5a3 3 0 0 1 0 6h-5Z" fill="#c9a24a" stroke="#5a4310" stroke-width="1"/></svg>';
