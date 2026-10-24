/* ---------- Play: create a room, and the rooms online beside it ----------
   An online room (open, or private with a passkey) is hosted by this browser through Firebase; anyone can join it from
   the list. A TEST room stays on this device, filled with computers; nothing in it counts toward stats. */
import { register, go, backTo } from './router.js';
import { el, esc, openWindow } from './ui.js';
import { profile, save } from './store.js';
import { createLocalRoom } from './net.js';
import { createOnlineRoom, joinOnlineRoom, watchRooms, whyNot } from './online.js';
import { gameArtSVG, symbolSVG } from './art.js';
import { MAX_DEFAULT } from './rules.js';

const last = { computers: 3, max: MAX_DEFAULT, test: false };
let unwatch = null, busy = false;
const PHASE = { lobby: 'In the lobby', countdown: 'Starting', over: 'Game over' };   // anything else: Game in progress (anyone can join)

register('rooms', {
  leave() { if (unwatch) unwatch(); unwatch = null; },
  render() {
    const s = el(`<section class="screen rooms">
      <header class="bar"><button type="button" class="btn ghost" data-a="back">‹ Back</button>
        <h1 class="bar-title">${symbolSVG(30)} Rooms</h1></header>
      <div class="rooms-grid">
        <form class="panel create" autocomplete="off">
          <div class="art-wrap">${gameArtSVG({ width: 480, duck: profile.duck })}</div>
          <div class="create-body">
          <h2>Create a room</h2>
          <div class="field"><label for="rm-name">Room name</label><input id="rm-name" maxlength="32" value="${esc(profile.name)}'s room"></div>
          <div class="row who" role="group" aria-label="Who can join">
            <button type="button" class="tile" data-open="1" aria-pressed="true" data-tip="Anyone can join from the list.">Open</button>
            <button type="button" class="tile" data-open="0" aria-pressed="false" data-tip="Listed with a lock; joining takes the passkey.">Private</button>
            <input class="passkey" placeholder="Passkey" maxlength="20" hidden aria-label="Passkey">
          </div>
          <div class="row">
            <label class="check" data-tip="On this device only, filled with computers. Nothing in a TEST room counts toward stats."><input type="checkbox" name="test"${last.test ? ' checked' : ''}>TEST</label>
            <label class="numfield">Computers <select name="computers">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option${n === last.computers ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="numfield">Players up to <select name="max">${[2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map(n => `<option${n === last.max ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
          </div>
          <button type="submit" class="btn big green create-go">Create</button>
          <p class="create-msg small" role="status" hidden></p>
          </div>
        </form>
        <section class="panel online">
          <div class="online-h"><h2>Rooms online</h2><label class="check small"><input type="checkbox" class="hide-priv"${profile.settings.hidePrivate ? ' checked' : ''}>Hide private rooms</label></div>
          <div class="room-list"><p class="dim empty">Connecting…</p></div>
        </section>
      </div>
    </section>`);
    const f = s.querySelector('form'), pass = s.querySelector('.passkey'), msg = s.querySelector('.create-msg'), list = s.querySelector('.room-list');
    const say = (text, bad = true) => { msg.hidden = !text; msg.textContent = text || ''; msg.classList.toggle('bad', bad); };
    s.querySelector('[data-a="back"]').onclick = () => backTo('front');
    s.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
      s.querySelectorAll('[data-open]').forEach(x => x.setAttribute('aria-pressed', x === b));
      pass.hidden = b.dataset.open === '1'; if (!pass.hidden) pass.focus();
    });
    const sync = () => { f.computers.closest('label').hidden = !f.test.checked; s.querySelector('.who').hidden = f.test.checked; };
    f.test.onchange = sync; sync();
    f.onsubmit = async e => {
      e.preventDefault();
      if (busy) return;
      last.computers = +f.computers.value; last.max = +f.max.value; last.test = f.test.checked;
      const name = f.querySelector('#rm-name').value.trim() || `${profile.name}'s room`;
      const open = s.querySelector('[data-open="1"]').getAttribute('aria-pressed') === 'true';
      if (last.test) {
        go('lobby', createLocalRoom({ name, test: true, computers: Math.min(last.computers, last.max - 1), max: last.max }));
        return;
      }
      if (!open && !pass.value.trim()) { say('A private room needs a passkey.'); pass.focus(); return; }
      busy = true; f.querySelector('.create-go').disabled = true; say('Creating…', false);
      try { const room = await createOnlineRoom({ name, open, passkey: pass.value, max: last.max }); go('lobby', room); }
      catch (err) { say(whyNot(err)); }
      finally { busy = false; f.querySelector('.create-go').disabled = false; }
    };
    /* the list: open rooms join at a click; private ones ask for the passkey */
    let rooms = [];
    const rowHTML = r => {
      const full = r.n >= r.max;
      return `<button type="button" class="room-row" data-rid="${esc(r.rid)}"${full ? ' disabled' : ''}>
        <span class="rr-name">${r.open ? '' : '<span class="lock" aria-label="Private">🔒</span> '}${esc(r.name)}</span>
        <span class="rr-host dim">${esc(r.hostName || '')}</span>
        <span class="rr-n">${r.n}/${r.max}</span>
        <span class="rr-phase${PHASE[r.phase] ? ' dim' : ' live'}">${full ? 'Full' : PHASE[r.phase] || 'Game in progress'}</span></button>`;
    };
    const shownRooms = () => profile.settings.hidePrivate ? rooms.filter(r => r.open) : rooms;
    const paintList = () => { const r = shownRooms(); list.innerHTML = r.length ? r.map(rowHTML).join('') : `<p class="dim empty">${rooms.length ? 'Only private rooms right now.' : 'No rooms open right now. Create one and your friends will see it here.'}</p>`; };
    s.querySelector('.hide-priv').onchange = e => { profile.settings.hidePrivate = e.target.checked; save(); if (!busy) paintList(); };
    const join = async (r, passkey = '') => {
      if (busy) return; busy = true;
      const row = list.querySelector(`[data-rid="${r.rid}"] .rr-phase`); if (row) row.textContent = 'Joining…';
      try { const room = await joinOnlineRoom(r, passkey); go('lobby', room); }
      catch (err) { busy = false; paintList(); askOrSay(r, err); return; }
      busy = false;
    };
    const askOrSay = (r, err) => {
      const text = /passkey/i.test(err.message) ? err.message : /room/i.test(err.message) ? err.message : whyNot(err);
      if (!r.open && /passkey/i.test(text)) askPass(r, text); else say(text);
    };
    const askPass = (r, note = '') => openWindow(`<h2>🔒 ${esc(r.name)}</h2><form class="pass-form" autocomplete="off">
        <input class="passkey" placeholder="Passkey" maxlength="20" aria-label="Passkey">${note ? `<p class="small bad">${esc(note)}</p>` : ''}
        <p class="acts"><button type="submit" class="btn green">Join</button></p></form>`, {
      cls: 'win-small',
      onOpen: (w, close) => {
        const i = w.querySelector('input'); i.focus();
        w.querySelector('form').onsubmit = ev => { ev.preventDefault(); if (!i.value.trim()) { i.focus(); return; } close(); join(r, i.value); };
      },
    });
    list.onclick = e => {
      const b = e.target.closest('.room-row'); if (!b || b.disabled) return;
      const r = rooms.find(x => x.rid === b.dataset.rid); if (!r) return;
      if (r.open) join(r); else askPass(r);
    };
    if (unwatch) unwatch();
    unwatch = () => {};
    const mine = unwatch;
    watchRooms(r => { rooms = r; if (!busy) paintList(); }, err => { list.innerHTML = `<p class="bad small">${esc(whyNot(err))}</p>`; })
      .then(off => { if (unwatch === mine) unwatch = off; else off(); })
      .catch(err => { list.innerHTML = `<p class="bad small">${esc(whyNot(err))}</p>`; });
    return s;
  },
});
