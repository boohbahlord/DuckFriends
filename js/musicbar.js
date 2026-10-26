/* ---------- the music bar: the song the room hears, a speaker and the music's volume ----------
   In the game's top bar and the lobby's. The speaker mutes the music (for me only; the room's song goes on); hovering it (on a
   phone, tapping the bar) shows the Music slider to the speaker's right, in the song name's place, so nothing moves:
   the same slider as in Settings → Audio, with a line where the default is. Between two songs it shows the next one, dimmed. */
import { profile, save, SETTINGS_DEFAULT } from './store.js';
import { music } from './music.js';
import { applySettings } from './settings.js';
import { esc } from './ui.js';

const S = () => profile.settings;
const MAX = 200;
/* the speaker: a yellow box and cone; its waves say how loud (none at 0, one below the default, two at it, three above),
   and a red cross when muted */
export function speakerSVG(v, muted) {
  const n = muted || v <= 0 ? 0 : v < 100 ? 1 : v === 100 ? 2 : 3;
  const waves = [3.6, 6.6, 9.6].slice(0, n).map(r => { const d = (r * .7).toFixed(2), x = (11.4 + r * .7).toFixed(2);
    return `<path d="M${x} ${(12 - +d).toFixed(2)}A${r} ${r} 0 0 1 ${x} ${(12 + +d).toFixed(2)}" />`; }).join('');
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><g class="spk-body"><path d="M3 9.2h3.6L11.8 5v14l-5.2-4.2H3z" /></g>
    <g class="spk-waves">${waves}</g>${muted || v <= 0 ? '<g class="spk-x"><path d="M15.4 9.4l5.2 5.2M20.6 9.4l-5.2 5.2" /></g>' : ''}</svg>`;
}
const NOTE = '<svg class="mbar-note" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 12.2V3.2l7-1.6v8.6" /><ellipse cx="4.4" cy="12.3" rx="2.3" ry="1.8" /><ellipse cx="11.4" cy="10.6" rx="2.3" ry="1.8" /></svg>';

export const musicBarHTML = () => `<div class="mbar" hidden>
  <button type="button" class="mbar-spk" aria-label="Mute the music" data-tip="Music: mute · hover for its volume"></button>
  <span class="mbar-main"><span class="mbar-song" tabindex="-1">${NOTE}<span class="mbar-name"></span></span>
    <span class="mbar-vol"><input type="range" min="0" max="${MAX}" step="5" aria-label="Music volume"><i class="mbar-def" aria-hidden="true"></i></span></span>
</div>`;

/* wires up a bar made by musicBarHTML; returns its clean-up */
export function mountMusicBar(root) {
  const bar = root.querySelector('.mbar'); if (!bar) return () => {};
  const spk = bar.querySelector('.mbar-spk'), vol = bar.querySelector('input'), song = bar.querySelector('.mbar-song'), name = bar.querySelector('.mbar-name');
  let shown = '', openT = 0;
  const paintSpk = () => {
    const v = S().music, m = !!S().musicMute, sig = `${v}|${m}`;
    if (spk._sig !== sig) { spk._sig = sig; spk.innerHTML = speakerSVG(v, m); spk.classList.toggle('muted', m || v <= 0); spk.setAttribute('aria-label', m ? 'Unmute the music' : 'Mute the music'); spk.setAttribute('aria-pressed', m); }
    if (document.activeElement !== vol) vol.value = v;
    vol.setAttribute('aria-valuetext', `${v}%`); vol.title = `${v}%`;
  };
  const paintSong = () => {
    const np = music.nowPlaying();
    bar.hidden = !np;
    if (!np) return;
    const sig = np.name ? `${np.name}|${np.next}|${!!np.wait}` : '-';
    if (sig === shown) return; shown = sig;
    song.classList.toggle('next', !!(np.next || np.wait)); song.classList.toggle('none', !np.name);
    name.innerHTML = np.name ? (np.wait ? `<span class="mbar-up">tap anywhere</span> ` : np.next ? `<span class="mbar-up">next</span> ` : '') + esc(np.name) : 'No songs on';
    song.title = np.wait ? `${np.name}: the browser starts sound once you tap, press a key or use the mouse anywhere` : np.name ? (np.next ? `Next: ${np.name}` : np.name) : 'Every song is off (song on all)';
  };
  /* on a touch screen there's no hovering: a tap shows the slider for a few seconds */
  const open = () => { bar.classList.add('open'); clearTimeout(openT); openT = setTimeout(() => bar.classList.remove('open'), 4000); };
  spk.addEventListener('click', e => {
    S().musicMute = !S().musicMute; save(); applySettings();
    if (e.detail) spk.blur();   // (a click leaves no focus behind: Space still jumps)
  });
  bar.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') open(); });
  vol.addEventListener('input', () => { S().music = +vol.value; S().musicMute = false; save(); applySettings(); open(); });
  vol.addEventListener('pointerup', () => vol.blur());   // (and arrow keys go back to moving the duck)
  vol.addEventListener('change', () => { if (Math.abs(+vol.value - SETTINGS_DEFAULT.music) <= 5) { S().music = SETTINGS_DEFAULT.music; save(); applySettings(); } });   // near the line: right on it
  song.addEventListener('pointerdown', () => open());
  document.addEventListener('settings', paintSpk);
  const t = setInterval(paintSong, 500);
  paintSpk(); paintSong();
  return () => { clearInterval(t); clearTimeout(openT); document.removeEventListener('settings', paintSpk); };
}

/* the front page and Rooms: the bar sits in the top-right corner, left of Sign in, so the two never overlap; returns its clean-up */
export function mountCornerMusicBar() {
  const corner = document.querySelector('.corner-tr'); if (!corner) return () => {};
  const t = document.createElement('template'); t.innerHTML = musicBarHTML(); const bar = t.content.firstElementChild;
  corner.prepend(bar); const off = mountMusicBar(corner);
  return () => { off(); bar.remove(); };
}
