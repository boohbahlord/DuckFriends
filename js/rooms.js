/* ---------- Play: create a room, and the rooms online below it ----------
   Until online play is on, every room is a TEST room on this device: the host picks how many computers join. Open or
   private (with a passkey) and the online list come with online play; they show faded so the layout stays the same. */
import { register, go } from './router.js';
import { el, esc } from './ui.js';
import { profile } from './store.js';
import { createLocalRoom } from './net.js';
import { gameArtSVG, symbolSVG } from './art.js';
import { MAX_DEFAULT } from './rules.js';

const ONLINE = false;   // turns on with Firebase
const last = { computers: 3, max: MAX_DEFAULT };

register('rooms', {
  render() {
    const s = el(`<section class="screen rooms">
      <header class="bar"><button type="button" class="btn ghost" data-a="back">‹ Back</button>
        <h1 class="bar-title">${symbolSVG(30)} Agree or Disagree</h1></header>
      <div class="rooms-grid">
        <form class="panel create" autocomplete="off">
          <div class="art-wrap">${gameArtSVG({ width: 480, duck: profile.duck })}</div>
          <div class="create-body">
          <h2>Create a room</h2>
          <div class="field"><label for="rm-name">Room name</label><input id="rm-name" maxlength="32" value="${esc(profile.name)}'s room"></div>
          <div class="row" role="group" aria-label="Who can join">
            <button type="button" class="tile" data-open="1" aria-pressed="true"${ONLINE ? '' : ' aria-disabled="true" data-tip="Rooms other players can join open with online play."'}>Open</button>
            <button type="button" class="tile" data-open="0" aria-pressed="false"${ONLINE ? '' : ' aria-disabled="true" data-tip="Rooms other players can join open with online play."'}>Private</button>
            <input class="passkey" placeholder="Passkey" maxlength="20" hidden aria-label="Passkey">
          </div>
          <div class="row">
            <label class="check" data-tip="Computers fill the room. Nothing in a TEST room counts toward stats."><input type="checkbox" name="test" checked${ONLINE ? '' : ' disabled'}>TEST</label>
            <label class="numfield">Computers <select name="computers">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option${n === last.computers ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="numfield">Players up to <select name="max">${[2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map(n => `<option${n === last.max ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
          </div>
          <button type="submit" class="btn big green create-go">Create</button>
          </div>
        </form>
        <section class="panel online">
          <h2>Rooms online</h2>
          <div class="room-list"><p class="dim empty">${ONLINE ? 'No rooms open right now.' : 'Online rooms open with online play.'}</p></div>
        </section>
      </div>
    </section>`);
    const f = s.querySelector('form'), pass = s.querySelector('.passkey');
    s.querySelector('[data-a="back"]').onclick = () => history.back();
    s.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      s.querySelectorAll('[data-open]').forEach(x => x.setAttribute('aria-pressed', x === b));
      pass.hidden = b.dataset.open === '1'; if (!pass.hidden) pass.focus();
    });
    const sync = () => { f.computers.closest('label').hidden = !f.test.checked; };
    f.test.onchange = sync; sync();
    f.onsubmit = e => {
      e.preventDefault();
      last.computers = +f.computers.value; last.max = +f.max.value;
      const room = createLocalRoom({
        name: f.querySelector('#rm-name').value.trim() || `${profile.name}'s room`, test: f.test.checked,
        computers: Math.min(last.computers, last.max - 1), max: last.max,
        open: s.querySelector('[data-open="1"]').getAttribute('aria-pressed') === 'true', passkey: pass.value,
      });
      go('lobby', room);
    };
    return s;
  },
});
