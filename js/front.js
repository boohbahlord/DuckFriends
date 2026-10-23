/* ---------- the front page ----------
   Play and Settings on the left with one short line under them; the duck in a ball pit on the right. */
import { register, go } from './router.js';
import { el } from './ui.js';
import { heroSVG, rainbowHTML } from './art.js';
import { openSettings } from './settings.js';

register('front', {
  render() {
    const s = el(`<section class="screen front">
      <div class="front-left">
        <h1 class="brand">${rainbowHTML('Justin Man Games')}</h1>
        <div class="front-btns">
          <button type="button" class="btn big green" data-a="play">Play</button>
          <button type="button" class="btn big ghost" data-a="settings">Settings</button>
        </div>
        <p class="front-line">A party game for friends on a voice call.</p>
      </div>
      <div class="hero">${heroSVG()}</div>
    </section>`);
    s.querySelector('[data-a="play"]').onclick = () => go('rooms');
    s.querySelector('[data-a="settings"]').onclick = () => openSettings();
    return s;
  },
});
