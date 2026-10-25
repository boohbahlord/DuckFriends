/* ---------- Settings ----------
   One window in the Armory's look: the sections listed on the left (General, Controls, Performance, Audio), the chosen one
   on the right. Every change applies at once and is kept. In each section the controls are grouped by kind: tiles, then
   checkmarks, then sliders. Performance starts with the connection: Default, Data saving or Poor connection (asked once,
   on the first visit). */
import { profile, save } from './store.js';
import { openWindow, esc, $$ } from './ui.js';
import { FONTS, fontCSS } from './name.js';

const S = () => profile.settings;
const TABS = [['general', 'General'], ['controls', 'Controls'], ['performance', 'Performance'], ['audio', 'Audio']];

/* puts the settings on the page */
export const NET = [['0', 'Default', 'Everything: the fonts, the moving background and the animations.'],
  ['1', 'Data saving', 'Your device\'s own fonts, nothing moving, and fewer online updates from you.'],
  ['2', 'Poor connection', 'All of Data saving, even fewer updates, and more patience before a dropped player leaves the room.']];
export const netLevel = () => Math.max(0, Math.min(2, +S().net || 0));
export function applySettings() {
  const s = S(), h = document.documentElement, net = netLevel(), still = !s.motion || net > 0;
  h.classList.toggle('lite', net > 0);
  h.classList.toggle('poor', net > 1);
  h.classList.toggle('dark', s.theme === 'dark');
  h.classList.toggle('dys', !!s.dyslexic);
  h.classList.toggle('cb', !!s.colorblind);
  h.classList.toggle('still', still);
  h.classList.toggle('moving', !still && s.shapes === 'moving');
  h.classList.toggle('noshapes', s.shapes === 'off');
  h.classList.toggle('nojumps', !!s.jumpsHidden);
  h.classList.toggle('mouse-move', !!s.mouseMove);
  h.style.setProperty('--font', fontCSS(s.font));
  h.style.setProperty('--ts', s.textSize / 100);
  h.style.setProperty('--ui', s.uiSize / 100);
  document.dispatchEvent(new CustomEvent('settings'));
}

const tiles = (key, opts, cls = '') => `<div class="row ${cls}" role="group">${opts.map(([v, label, style]) =>
  `<button type="button" class="tile" data-k="${key}" data-v="${esc(v)}" aria-pressed="${S()[key] === v}"${style ? ` style="${esc(style)}"` : ''}>${esc(label)}</button>`).join('')}</div>`;
const check = (key, label, tip) => `<label class="check"${tip ? ` data-tip="${esc(tip)}"` : ''}><input type="checkbox" data-k="${key}"${S()[key] ? ' checked' : ''}>${esc(label)}</label>`;
const slider = (key, label, min, max, step, unit = '%') => `<div class="slide"><label for="set-${key}">${esc(label)}</label>
  <input id="set-${key}" type="range" data-k="${key}" min="${min}" max="${max}" step="${step}" value="${S()[key]}"><output>${S()[key]}${unit}</output></div>`;

const PAGES = {
  general: () => `
    <div class="sect"><h3>Look</h3>${tiles('theme', [['light', 'Light'], ['dark', 'Dark']])}</div>
    <div class="sect"><h3>Font</h3>${tiles('font', FONTS.map(f => [f.id, f.name, `font-family:${f.css}`]), 'tiles-font')}</div>
    <div class="sect"><h3>Reading</h3>
      <div class="row">${check('dyslexic', 'Dyslexic mode', 'Clear letters with more room between letters, words and lines.')}${check('colorblind', 'Colorblind mode', 'A board every kind of color sight tells apart, with marks in each column.')}</div>
      <div style="margin-top:.6rem">${slider('textSize', 'Text size', 80, 180, 5)}${slider('uiSize', 'UI size', 70, 140, 5)}</div></div>
    <div class="sect"><h3>Chat</h3>${tiles('chatSide', [['left', 'Left'], ['bottom', 'Bottom'], ['right', 'Right'], ['hidden', 'Hidden']])}</div>
    <div class="sect"><h3>Jumps</h3><div class="row">${check('jumpsSci', 'Scientific notation', '12,345 shows as 1.23 × 10⁴.')}${check('jumpsHidden', 'Hide the jump counter')}</div></div>`,
  controls: () => `
    <div class="sect"><h3>Your duck</h3><div class="row">${check('mouseMove', 'Mouse moves your duck', 'Click a column to walk your duck there.')}${check('multipleChoice', 'Show multiple choice', 'Buttons for the seven answers; choosing one jumps your duck there.')}</div></div>
    <div class="sect"><h3>Touch screen</h3>${tiles('touch', [['stick', 'Joystick'], ['tap', 'Tap to move']])}<div class="keys" style="margin-top:.5rem">
      <span>Joystick</span><span>Hold a finger off the buttons and drag: a see-through stick appears. Tap: jump. Flick the stick twice the same way: sprint, for as long as you hold it out.</span>
      <span>Tap to move</span><span>Tap: walk there. Quick double tap: jump, on the way too. Fast swipe: sprint that way.</span></div></div>
    <div class="sect"><h3>Keys</h3><div class="keys">
      <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows</span><span>Move your duck</span>
      <span><kbd>Shift</kbd></span><span>Sprint (hold)</span>
      <span><kbd>Space</kbd></span><span>Jump; Ready in the lobby</span>
      <span><kbd>Enter</kbd></span><span>End your turn</span>
      <span><kbd>T</kbd></span><span>Text chat</span>
      <span><kbd>Shift</kbd>+<kbd>T</kbd></span><span>Command line</span>
      <span><kbd>Tab</kbd> <kbd>↑</kbd> <kbd>↓</kbd></span><span>Complete in the chat; choose a suggestion</span>
      <span><kbd>Shift</kbd>+<kbd>\\</kbd></span><span>Friends (outside a game)</span>
      <span><kbd>Esc</kbd></span><span>Pause menu, or close a window</span>
      <span><kbd>Enter</kbd></span><span>Send your question (in its box)</span>
      <span>Right-click</span><span>A player card's options</span></div></div>`,
  performance: () => `
    <div class="sect"><h3>Connection</h3>${tiles('net', NET.map(([v, n]) => [v, n]))}<p class="small dim">They improve performance too. ${esc(NET[netLevel()][2])}</p></div>
    <div class="sect"><h3>Background shapes</h3>${tiles('shapes', [['moving', 'Moving'], ['still', 'Still'], ['off', 'Off']])}</div>
    <div class="sect"><h3>Movement</h3><div class="row">${check('motion', 'Animations', 'Ducks bob, windows pop, shapes drift. Off keeps everything still.')}</div></div>`,
  audio: () => `<div class="sect"><h3>Volume</h3>${slider('sound', 'Volume', 0, 100, 5)}${slider('sfx', 'Sound effects', 0, 100, 5)}${slider('music', 'Music', 0, 100, 5)}</div>`,
};

export function openSettings() {
  return openWindow(`<div class="armory set-arm"><div class="arm-menu"><header class="arm-h"><span class="arm-mark">◆</span><h2>Settings</h2></header>
    <ul class="arm-list set-tabs" role="tablist">${TABS.map(([k, n]) => `<li><button type="button" class="arm-row" role="tab" data-tab="${k}" aria-pressed="${S().settingsTab === k}"><span>${n}</span></button></li>`).join('')}</ul></div>
    <div class="arm-page"><h2 class="set-title"></h2><div class="tabpage"></div></div></div>`, {
    cls: 'win-armory win-settings',
    onOpen(w) {
      const page = w.querySelector('.tabpage');
      const show = k => {
        if (!PAGES[k]) k = 'general';
        S().settingsTab = k; save();
        $$('[data-tab]', w).forEach(t => t.setAttribute('aria-pressed', t.dataset.tab === k));
        w.querySelector('.set-title').textContent = TABS.find(t => t[0] === k)[1];
        page.innerHTML = PAGES[k]();
      };
      w.querySelector('.set-tabs').onclick = e => { const t = e.target.closest('[data-tab]'); if (t) show(t.dataset.tab); };
      page.addEventListener('click', e => {
        const t = e.target.closest('.tile'); if (!t) return;
        S()[t.dataset.k] = t.dataset.v; save(); applySettings();
        $$(`.tile[data-k="${t.dataset.k}"]`, page).forEach(b => b.setAttribute('aria-pressed', b === t));
        if (t.dataset.k === 'net') page.innerHTML = PAGES.performance();   // its line below says what it does
      });
      page.addEventListener('input', e => {
        const i = e.target; if (!i.dataset.k) return;
        if (i.type === 'checkbox') S()[i.dataset.k] = i.checked;
        else if (i.type === 'range') { S()[i.dataset.k] = +i.value; i.nextElementSibling.textContent = i.value + '%'; }
        save(); applySettings();
      });
      show(S().settingsTab);
    },
  });
}

/* asked once, on the first visit: Default, Data saving or Poor connection (the X keeps Default) */
export function askConnection() {
  if (S().netAsked || navigator.webdriver) return;   // (not for automated browsers)
  S().netAsked = true; save();
  openWindow(`<h2>Your connection</h2><p class="dim">Pick what fits. You can change it any time in Settings → Performance.</p>
    <div class="net-pick">${NET.map(([v, n, d]) => `<button type="button" class="tile net-tile" data-v="${v}"><b>${esc(n)}</b><span class="small dim">${esc(d)}</span></button>`).join('')}</div>`, {
    cls: 'win-small',
    onOpen: (w, close) => w.querySelector('.net-pick').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; S().net = b.dataset.v; save(); applySettings(); close(); },
  });
}
