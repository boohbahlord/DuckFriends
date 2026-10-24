/* ---------- the lobby, laid out like Halo: Reach's custom game lobby ----------
   Left: the game's art, the room's name, who can join, Ready, then Game type (locked), Map (one for now), Game options
   (the host edits them) and Start game, with a line under them saying what the row under the pointer does. Right: the
   party, one player card per row; click your own to rename it; right-click any card for its options. Bottom left: the
   keys. The X at the top right leaves the room. */
import { register, go, leaveTo } from './router.js';
import { el, esc, $, $$, openWindow, contextMenu, onMenu, typing, windowOpen, toast, setHTML } from './ui.js';
import { activeRoom } from './net.js';
import { now } from './clock.js';
import { gameArtSVG, symbolSVG } from './art.js';
import { cardHTML } from './card.js';
import { netHTML } from './players.js';
import { OPTIONS_DEFAULT } from './rules.js';
import { profile, cleanName } from './store.js';
import { openCustomize, setName } from './customize.js';
import { openStats } from './stats.js';
import { sfx } from './sound.js';
import { mountDocks, DOCK_HTML, BAR_HTML } from './dock.js';
import { MAPS, mapMini, mapName } from './maps.js';
import { acct, onAccount, requestFriend, canAdd } from './account.js';
import { openFriends } from './friends.js';

let R = null, off = null, offAcct = null, lastCount = -1, lastSeat = 0, docks = null;

const INFO = {
  type: 'Agree or Disagree: answer each other\'s questions on a seven-column board.',
  map: 'What the board looks like: The Board, Sky or Pixel.',
  options: 'Question order, timers, and how many players end a turn.',
  start: 'Starts the game for everyone.',
  friends: 'Invite your friends to this room, or add a friend by code.',
};

/* the board as a small picture (the Map window) */
/* the Map window: three maps, each with a little picture; the host picks */
function openMaps() {
  const s = R.state, host = s.hostId === R.me, cur = s.options.map || 'board';
  return openWindow(`<h2>Map</h2>${host ? '' : '<p class="small dim" style="margin:-.3rem 0 .6rem">Only the host picks the map.</p>'}
    <div class="map-tiles">${MAPS.map(([id, name, tip]) => `<button type="button" class="tile map-tile" data-map="${id}" aria-pressed="${id === cur}" data-tip="${esc(tip)}"${host ? '' : ' aria-disabled="true"'}>${mapMini(id)}<span>${esc(name)}</span></button>`).join('')}</div>`, {
    cls: 'win-settings',
    onOpen: w => { if (host) w.querySelector('.map-tiles').onclick = e => { const b = e.target.closest('[data-map]'); if (!b) return; R.send({ t: 'options', options: { map: b.dataset.map } }); w.querySelectorAll('[data-map]').forEach(x => x.setAttribute('aria-pressed', x === b)); }; },
  });
}

/* ---------- Game options: the host edits them; everyone else sees them ---------- */
/* the options most hosts want; the rest wait under Additional settings so a straightforward host never sees them */
const OPT_TILES = [
  ['order', 'Question order', [['random', 'Random'], ['rotate', 'Rotating']]],
  ['share', 'Turn ends when done', [[.5, 'Half'], [.67, '2 of 3'], [.75, '3 of 4'], [1, 'Everyone']]],
  ['catchUp', 'Catch-up timer', [[0, 'Off'], [15, '15 s'], [30, '30 s'], [45, '45 s']]],
  ['answerTime', 'Answer timer', [[0, 'Off'], [30, '30 s'], [60, '60 s'], [90, '90 s']]],
];
const MORE_TILES = [
  ['freeRoam', 'Answering', [[0, 'Lock answers'], [1, 'Free roam']]],
  ['submitTime', 'Question time limit', [[0, 'Off'], [60, '60 s'], [90, '90 s'], [120, '120 s']]],
  ['lowGravity', 'Jumps', [[0, 'Normal'], [1, 'Low gravity']]],
  ['fun', 'Silly commands', [[1, 'On'], [0, 'Off']]],
];
let moreOpen = false;
const OPT_TIPS = {
  share: 'A phase ends once this many players have ended their turn.',
  catchUp: 'Once enough players are done, the rest get this long (writing questions and answering).',
  answerTime: 'The Round Lord\'s answer time unless they choose another.',
  submitTime: 'A time limit on writing questions.',
  freeRoam: 'Free roam: no ending your turn to lock an answer and no talk-it-over step; ducks roam until the turn ends, and where they stand then is their answer.',
  fun: 'lightning, love, kill and hotdog in the command line.',
};
const tileRows = (rows, s, ro) => rows.map(([k, label, opts]) => `<div class="sect"><h3${OPT_TIPS[k] ? ` data-tip="${esc(OPT_TIPS[k])}"` : ''}>${esc(label)}</h3><div class="row">${opts.map(([v, n]) =>
  `<button type="button" class="tile" data-k="${k}" data-v="${v}" aria-pressed="${s.options[k] === v}"${ro}>${n}</button>`).join('')}</div></div>`).join('');
function openOptions() {
  const s = R.state, host = s.hostId === R.me, ro = host ? '' : ' aria-disabled="true"';
  return openWindow(`<h2>Game options</h2>${host ? '' : '<p class="small dim" style="margin:-.3rem 0 .6rem">Only the host changes these.</p>'}
    ${tileRows(OPT_TILES, s, ro)}
    <details class="more"${moreOpen ? ' open' : ''}><summary>Additional settings</summary>
    ${tileRows(MORE_TILES, s, ro)}
    ${s.test ? `<div class="sect"><h3 data-tip="How long computers wait before they act each phase.">Computers wait</h3><div class="row">${[5, 15, 30, 60].map(v =>
      `<button type="button" class="tile" data-k="botWait" data-v="${v}" aria-pressed="${s.options.botWait === v}"${ro}>${v} s</button>`).join('')}</div></div>` : ''}
    </details>
    <div class="sect"><h3>Room</h3><div class="row">
      <label class="numfield">Players up to <select data-k="max"${host ? '' : ' disabled'}>${[2, 3, 4, 5, 6, 7, 8, 10, 12, 16].filter(n => n >= s.seat.length).map(n => `<option${n === s.max ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      ${s.test ? `<label class="numfield">Computers <select data-k="computers"${host ? '' : ' disabled'}>${Array.from({ length: s.max }, (_, n) => n).filter(n => n <= s.max - 1).map(n => `<option${n === s.seat.filter(id => s.players[id].bot).length ? ' selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
    </div></div>
    ${host ? '<p class="acts"><button type="button" class="btn ghost" data-a="reset">Defaults</button></p>' : ''}`, {
    cls: 'win-settings',
    onOpen(w, close) {
      w.querySelector('details.more').addEventListener('toggle', e => { moreOpen = e.target.open; });
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

/* ---------- a player card's options (a click, a right-click or a long press) ----------
   Your own card: View stats, Customize, and your name in a box below them, to type a new one right there. */
function cardMenu(pid, x, y) {
  const s = R.state, p = s.players[pid]; if (!p) return;
  const mine = pid === R.me, items = [['View stats', () => openStats(s, pid, R.me)]];
  if (mine) items.push(['Customize', () => openCustomize()]);
  if (s.hostId === R.me && p.bot && (s.phase === 'lobby' || s.phase === 'over')) items.push(['Remove computer', () => R.send({ t: 'kick', who: pid })]);
  if (canAdd(p)) items.push(['Add friend', async () => toast(await requestFriend(p.acct))]);
  contextMenu(x, y, items, !mine ? {} : {
    footer: `<label class="ctx-name"><span class="small dim">Name</span><input maxlength="20" spellcheck="false" value="${esc(profile.name)}" aria-label="Your name"></label>`,
    onMount(m, close) {
      const inp = m.querySelector('.ctx-name input'), was = profile.name;
      const done = () => { if (inp.value !== was && !setName(inp.value)) toast('A name needs at least one letter or number.'); $('.party-list', S)._html = ''; paint(); };
      inp.oninput = () => { const c = cleanName(inp.value); if (c !== inp.value) { inp.value = c; inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 300); } };
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); done(); close(); } if (e.key === 'Escape') { e.stopPropagation(); close(); } e.stopPropagation(); };
      inp.onchange = done;
    },
  });
}

/* ---------- drawing ---------- */
let S = null;   // the screen
function paint() {
  if (!R || !S) return;
  const s = R.state, host = s.hostId === R.me, mine = s.players[R.me];
  if (!mine) return;
  $('.lobby-title', S).textContent = s.name;
  const bots = s.seat.filter(id => s.players[id].bot).length;
  $('.lobby-sub', S).textContent = [s.test ? 'TEST room' : s.open ? 'Open room' : R.passkey ? `Private room · passkey: ${R.passkey}` : 'Private room',
    bots ? `${bots} computer${bots === 1 ? '' : 's'}, acting after ${s.options.botWait} s` : '', host ? 'You are the host' : ''].filter(Boolean).join(' · ');
  const st = $('.lobby-status', S);
  if (s.phase === 'countdown') {
    const left = Math.max(0, Math.ceil((s.ends - now()) / 1000));
    setHTML(st, `<span class="count">Starting in <b>${left}</b></span>${host ? '<button type="button" class="btn red" data-a="cancel">Cancel</button>' : ''}`);
  } else {
    setHTML(st, `<button type="button" class="ready-btn${mine.ready ? ' on' : ''}" data-a="ready" aria-pressed="${!!mine.ready}">${mine.ready ? 'Ready ✓' : 'Not ready'}</button>`);
  }
  const startRow = $('[data-m="start"]', S);
  startRow.setAttribute('aria-disabled', String(!host || s.phase === 'countdown'));
  $('.val', startRow).textContent = host ? (s.phase === 'countdown' ? '' : `${s.seat.filter(id => s.players[id].ready).length}/${s.seat.length} ready`) : 'The host starts';
  $('[data-m="options"] .val', S).textContent = host ? 'Edit' : 'View';
  $('[data-m="map"] .val', S).textContent = mapName(s.options.map);
  const fr = $('[data-m="friends"] .val', S);
  if (fr) fr.textContent = acct.uid ? `${Object.values(acct.friends).filter(f => f.on).length} online` : 'Sign in';
  const art = $('.lobby-art', S), artSig = (s.options.map || 'board') + JSON.stringify(profile.duck);   // the picture shows the chosen map
  if (art._sig !== artSig) { art._sig = artSig; art.innerHTML = gameArtSVG({ width: 480, duck: profile.duck, map: s.options.map || 'board', mapLabel: mapName(s.options.map) }); }
  $('.party-count', S).textContent = `In lobby ${s.seat.length}/${s.max}`;
  const list = $('.party-list', S);
  if (!list.querySelector('input.rename')) setHTML(list, s.seat.map(id => cardHTML(s.players[id], { me: id === R.me, host: id === s.hostId, ready: !!s.players[id].ready, extra: R.online && !s.players[id].bot ? `<span class="pcard-net">${netHTML(s.players[id], true)}</span>` : '' })).join(''));
  if (s.seat.length > lastSeat && lastSeat) sfx.pop();
  lastSeat = s.seat.length;
}

function onState(s) {
  if (!S) return;
  if (!['lobby', 'countdown'].includes(s.phase)) { if (lastCount > 0) sfx.count(true); lastCount = -1; go('game', R); return; }   // the countdown's last tone, at zero
  if (s.phase === 'countdown') {
    const left = Math.max(0, Math.ceil((s.ends - now()) / 1000));
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
  leave() { if (off) off(); off = null; if (offAcct) offAcct(); offAcct = null; if (docks) docks.destroy(); docks = null; clearInterval(S && S._tick); S = null; removeEventListener('keydown', key); },
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
          <button type="button" role="menuitem" data-m="map"><span>Map</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="options"><span>Game options</span><span class="val"></span></button>
          <button type="button" role="menuitem" data-m="start" class="start"><span>Start game</span><span class="val"></span></button>
          ${R.online ? '<button type="button" role="menuitem" data-m="friends"><span>Friends</span><span class="val"></span></button>' : ''}
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
      if (m === 'map') openMaps();
      if (m === 'options') openOptions();
      if (m === 'start' && b.getAttribute('aria-disabled') !== 'true') R.send({ t: 'start' });
      if (m === 'friends') openFriends();
    };
    S.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if (a && a.dataset.a === 'ready') toggleReady();
      if (a && a.dataset.a === 'cancel') R.send({ t: 'cancel' });
      const c = e.target.closest('.party .pcard');
      if (c && !e.target.closest('input')) { const r = c.getBoundingClientRect(); cardMenu(c.dataset.pid, Math.min(e.clientX, r.right - 20), r.bottom - 6); }
    });
    onMenu(S.querySelector('.party'), (x, y, e) => { const c = e.target.closest && e.target.closest('.pcard'); if (c) cardMenu(c.dataset.pid, x, y); });
    off = R.on(onState); offAcct = onAccount(() => paint());
    addEventListener('keydown', key);
    S._tick = setInterval(() => { if (R && R.state.phase === 'countdown') onState(R.state); }, 250);
    queueMicrotask(paint);
    return S;
  },
});
