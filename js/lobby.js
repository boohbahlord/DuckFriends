/* ---------- the lobby, laid out like Halo: Reach's custom game lobby ----------
   Left: the game's art, the room's name, who can join, Ready, then Game type (locked), Map (one for now), Game options
   (the host edits them) and Start game, with a line under them saying what the row under the pointer does. Right: the
   party, one player card per row; click your own to rename it; right-click any card for its options. Bottom left: the
   keys. The X at the top right leaves the room. */
import { register, go, leaveTo } from './router.js';
import { el, esc, $, $$, openWindow, contextMenu, onMenu, typing, windowOpen, toast, setHTML } from './ui.js';
import { activeRoom } from './net.js';
import { gameArtSVG, symbolSVG } from './art.js';
import { cardHTML } from './card.js';
import { COLS, OPTIONS_DEFAULT } from './rules.js';
import { profile, cleanName } from './store.js';
import { openCustomize, setName } from './customize.js';
import { openStats } from './stats.js';
import { sfx } from './sound.js';
import { mountDocks, DOCK_HTML, BAR_HTML } from './dock.js';

let R = null, off = null, lastCount = -1, lastSeat = 0, docks = null;

const INFO = {
  type: 'Agree or Disagree: answer each other\'s questions on a seven-column board.',
  map: 'The Board: seven columns, Strongly disagree to Strongly agree.',
  options: 'Question order, timers, and how many players end a turn.',
  start: 'Starts the game for everyone.',
};

/* the board as a small picture (the Map window) */
const boardMini = () => `<div class="mini-board">${COLS.map((c, i) => `<span class="c${i + 1}" title="${esc(c)}"></span>`).join('')}</div>`;

/* ---------- Game options: the host edits them; everyone else sees them ---------- */
const OPT_TILES = [
  ['order', 'Question order', [['rotate', 'Rotating'], ['random', 'Random']]],
  ['share', 'Turn ends when done', [[.5, 'Half'], [.67, '2 of 3'], [.75, '3 of 4'], [1, 'Everyone']]],
  ['catchUp', 'Catch-up timer', [[0, 'Off'], [15, '15 s'], [30, '30 s'], [45, '45 s']]],
  ['answerTime', 'Answer timer', [[0, 'Off'], [30, '30 s'], [60, '60 s'], [90, '90 s']]],
  ['submitTime', 'Question time limit', [[0, 'Off'], [60, '60 s'], [90, '90 s'], [120, '120 s']]],
  ['lowGravity', 'Jumps', [[0, 'Normal'], [1, 'Low gravity']]],
];
const OPT_TIPS = {
  share: 'A phase ends once this many players have ended their turn.',
  catchUp: 'Once enough players are done, the rest get this long (writing questions and answering).',
  answerTime: 'The Round Lord\'s answer time unless they choose another.',
  submitTime: 'A time limit on writing questions.',
};
function openOptions() {
  const s = R.state, host = s.hostId === R.me, ro = host ? '' : ' aria-disabled="true"';
  return openWindow(`<h2>Game options</h2>${host ? '' : '<p class="small dim" style="margin:-.3rem 0 .6rem">Only the host changes these.</p>'}
    ${OPT_TILES.map(([k, label, opts]) => `<div class="sect"><h3${OPT_TIPS[k] ? ` data-tip="${esc(OPT_TIPS[k])}"` : ''}>${esc(label)}</h3><div class="row">${opts.map(([v, n]) =>
      `<button type="button" class="tile" data-k="${k}" data-v="${v}" aria-pressed="${s.options[k] === v}"${ro}>${n}</button>`).join('')}</div></div>`).join('')}
    ${s.test ? `<div class="sect"><h3 data-tip="How long computers wait before they act each phase.">Computers wait</h3><div class="row">${[5, 15, 30, 60].map(v =>
      `<button type="button" class="tile" data-k="botWait" data-v="${v}" aria-pressed="${s.options.botWait === v}"${ro}>${v} s</button>`).join('')}</div></div>` : ''}
    <div class="sect"><h3>Room</h3><div class="row">
      <label class="numfield">Players up to <select data-k="max"${host ? '' : ' disabled'}>${[2, 3, 4, 5, 6, 7, 8, 10, 12, 16].filter(n => n >= s.seat.length).map(n => `<option${n === s.max ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      ${s.test ? `<label class="numfield">Computers <select data-k="computers"${host ? '' : ' disabled'}>${Array.from({ length: s.max }, (_, n) => n).filter(n => n <= s.max - 1).map(n => `<option${n === s.seat.filter(id => s.players[id].bot).length ? ' selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
    </div></div>
    ${host ? '<p class="acts"><button type="button" class="btn ghost" data-a="reset">Defaults</button></p>' : ''}`, {
    cls: 'win-settings',
    onOpen(w, close) {
      if (!host) return;
      w.addEventListener('click', e => {
        const t = e.target.closest('.tile[data-k]');
        if (t) { R.send({ t: 'options', options: { [t.dataset.k]: t.dataset.k === 'order' ? t.dataset.v : +t.dataset.v } }); $$(`.tile[data-k="${t.dataset.k}"]`, w).forEach(b => b.setAttribute('aria-pressed', b === t)); }
        if (e.target.closest('[data-a="reset"]')) { R.send({ t: 'options', options: { ...OPTIONS_DEFAULT } }); close(); openOptions(); }
      });
      w.addEventListener('change', e => {
        const k = e.target.dataset.k;
        if (k === 'max') R.send({ t: 'options', options: {}, max: +e.target.value });
        if (k === 'computers') R.setComputers(+e.target.value);
      });
    },
  });
}

/* ---------- a player card's options (right-click, or a long press) ---------- */
function cardMenu(pid, x, y) {
  const s = R.state, p = s.players[pid]; if (!p) return;
  const mine = pid === R.me, items = [];
  if (mine) items.push(['Customize', () => openCustomize()], ['Change name', () => renameInline()]);
  items.push(['View stats', () => openStats(s, pid, R.me)]);
  if (s.hostId === R.me && p.bot && (s.phase === 'lobby' || s.phase === 'over')) items.push(['Remove computer', () => R.send({ t: 'kick', who: pid })]);
  contextMenu(x, y, items);
}

/* click your own card: its name becomes a box */
function renameInline() {
  const card = $(`.party .pcard[data-pid="${R.me}"]`); if (!card || card.querySelector('input')) return;
  const lab = card.querySelector('.pcard-label'), was = profile.name;
  const inp = el(`<input class="rename" maxlength="20" spellcheck="false" aria-label="Your name">`); inp.value = was;
  lab.replaceChildren(inp); inp.focus(); inp.select();
  let done = false;
  const finish = ok => {
    if (done) return; done = true;
    if (ok && inp.value !== was && !setName(inp.value)) toast('A name needs at least one letter or number.');
    inp.remove(); $('.party-list', S)._html = ''; paint();
  };
  inp.oninput = () => { const c = cleanName(inp.value); if (c !== inp.value) { inp.value = c; inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 300); } };
  inp.onkeydown = e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') { e.stopPropagation(); finish(false); } };
  inp.onblur = () => finish(true);
}

/* ---------- drawing ---------- */
let S = null;   // the screen
function paint() {
  if (!R || !S) return;
  const s = R.state, host = s.hostId === R.me, mine = s.players[R.me];
  if (!mine) return;
  $('.lobby-title', S).textContent = s.name;
  const bots = s.seat.filter(id => s.players[id].bot).length;
  $('.lobby-sub', S).textContent = [s.test ? 'TEST room' : s.open ? 'Open room' : 'Private room',
    bots ? `${bots} computer${bots === 1 ? '' : 's'}, acting after ${s.options.botWait} s` : '', host ? 'You are the host' : ''].filter(Boolean).join(' · ');
  const st = $('.lobby-status', S);
  if (s.phase === 'countdown') {
    const left = Math.max(0, Math.ceil((s.ends - Date.now()) / 1000));
    setHTML(st, `<span class="count">Starting in <b>${left}</b></span>${host ? '<button type="button" class="btn red" data-a="cancel">Cancel</button>' : ''}`);
  } else {
    setHTML(st, `<button type="button" class="ready-btn${mine.ready ? ' on' : ''}" data-a="ready" aria-pressed="${!!mine.ready}">${mine.ready ? 'Ready ✓' : 'Not ready'}</button>`);
  }
  const startRow = $('[data-m="start"]', S);
  startRow.setAttribute('aria-disabled', String(!host || s.phase === 'countdown'));
  $('.val', startRow).textContent = host ? (s.phase === 'countdown' ? '' : `${s.seat.filter(id => s.players[id].ready).length}/${s.seat.length} ready`) : 'The host starts';
  $('[data-m="options"] .val', S).textContent = host ? 'Edit' : 'View';
  $('.party-count', S).textContent = `In lobby ${s.seat.length}/${s.max}`;
  const list = $('.party-list', S);
  if (!list.querySelector('input.rename')) setHTML(list, s.seat.map(id => cardHTML(s.players[id], { me: id === R.me, host: id === s.hostId, ready: !!s.players[id].ready })).join(''));
  if (s.seat.length > lastSeat && lastSeat) sfx.pop();
  lastSeat = s.seat.length;
}

function onState(s) {
  if (!S) return;
  if (!['lobby', 'countdown'].includes(s.phase)) { go('game', R); return; }
  if (s.phase === 'countdown') {
    const left = Math.max(0, Math.ceil((s.ends - Date.now()) / 1000));
    if (left !== lastCount) { sfx.count(left === 0); lastCount = left; }
  } else lastCount = -1;
  paint();
}

/* Space: ready */
function key(e) {
  if (!S || typing(e) || windowOpen()) return;
  if (e.code === 'Space' && !e.repeat) { e.preventDefault(); toggleReady(); }
}
const toggleReady = () => { R.send({ t: 'ready' }); sfx.tick(); };

register('lobby', {
  guard: () => !!activeRoom(),
  exit() { const r = activeRoom(); if (r) { r.send({ t: 'leave' }); r.close(); } },
  leave() { if (off) off(); off = null; if (docks) docks.destroy(); docks = null; clearInterval(S && S._tick); S = null; removeEventListener('keydown', key); },
  render(arg) {
    R = arg || activeRoom(); if (!R) return null;
    if (!['lobby', 'countdown'].includes(R.state.phase)) { setTimeout(() => go('game', R)); }
    S = el(`<section class="screen lobby docked">
      <header class="lbar"><button type="button" class="win-x lobby-x" aria-label="Leave the room" data-tip="Leave the room">×</button></header>
      <div class="gmain lmain">
      <div class="lobby-left">
        <div class="lobby-art">${gameArtSVG({ width: 480, duck: profile.duck })}</div>
        <h1 class="lobby-title"></h1>
        <p class="lobby-sub dim"></p>
        <div class="lobby-status"></div>
        <div class="lmenu" role="menu">
          <button type="button" role="menuitem" data-m="type" aria-disabled="true"><span>Game type</span><span class="val">${symbolSVG(20)} Agree or Disagree</span></button>
          <button type="button" role="menuitem" data-m="map"><span>Map</span><span class="val">The Board</span></button>
          <button type="button" role="menuitem" data-m="options"><span>Game options</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="start" class="start"><span>Start game</span><span class="val"></span></button>
        </div>
        <p class="lmenu-info dim">${INFO.start}</p>
      </div>
      <aside class="party"><header><h2>Party</h2><span class="party-count dim"></span></header><div class="party-list"></div></aside>
      </div>${DOCK_HTML}${BAR_HTML()}
    </section>`);
    docks = mountDocks(S, '<kbd>Space</kbd> Ready <kbd>T</kbd> Chat <kbd>Right-click</kbd> Card options <kbd>Click</kbd> Select');
    lastSeat = 0;
    S.querySelector('.lobby-x').onclick = () => leaveTo('rooms');
    const info = S.querySelector('.lmenu-info');
    S.querySelector('.lmenu').addEventListener('pointerover', e => { const b = e.target.closest('[data-m]'); if (b) info.textContent = INFO[b.dataset.m]; });
    S.querySelector('.lmenu').addEventListener('focusin', e => { const b = e.target.closest('[data-m]'); if (b) info.textContent = INFO[b.dataset.m]; });
    S.querySelector('.lmenu').onclick = e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      const m = b.dataset.m;
      if (m === 'type') toast('Agree or Disagree is the only game for now.');
      if (m === 'map') openWindow(`<h2>Map</h2><button type="button" class="tile map-tile" aria-pressed="true">${boardMini()}<span>The Board</span></button>`, { cls: 'win-small' });
      if (m === 'options') openOptions();
      if (m === 'start' && b.getAttribute('aria-disabled') !== 'true') R.send({ t: 'start' });
    };
    S.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (a && a.dataset.a === 'ready') toggleReady();
      if (a && a.dataset.a === 'cancel') R.send({ t: 'cancel' });
      const c = e.target.closest('.party .pcard');
      if (c && c.dataset.pid === R.me && !e.target.closest('input')) renameInline();
    });
    onMenu(S.querySelector('.party'), (x, y, e) => { const c = e.target.closest && e.target.closest('.pcard'); if (c) cardMenu(c.dataset.pid, x, y); });
    off = R.on(onState);
    addEventListener('keydown', key);
    S._tick = setInterval(() => { if (R && R.state.phase === 'countdown') onState(R.state); }, 250);
    queueMicrotask(paint);
    return S;
  },
});
