/* ---------- the front page ----------
   The name at the top in the middle (on a phone, above the buttons); Play and Settings on the left with one short line
   under them; a ball pit across the whole bottom of the page with the duck sitting in it on the right. */
import { register, go } from './router.js';
import { el } from './ui.js';
import { pitSVG, heroDuckSVG, rainbowHTML } from './art.js';
import { openSettings } from './settings.js';

register('front', {
  render() {
    const s = el(`<section class="screen front">
      <h1 class="brand">${rainbowHTML('DuckFriends')}</h1>
      <div class="front-left">
        <div class="front-btns">
          <button type="button" class="btn big green" data-a="play">Play</button>
          <button type="button" class="btn big ghost" data-a="settings">Settings</button>
          <a class="btn big ghost site-btn" href="https://boohbahlord.github.io/Nous-Within-Kenoma/">My Other Website<small>Nous Within Kenoma</small></a>
        </div>
        <p class="front-line">Party games for friends on a voice call.</p>
      </div>
      <div class="pit" aria-hidden="true">${pitSVG('back')}<div class="hero-duck bob">${heroDuckSVG()}</div>${pitSVG('front')}</div>
    </section>`);
    s.querySelector('[data-a="play"]').onclick = () => go('rooms');
    s.querySelector('[data-a="settings"]').onclick = () => openSettings();
    return s;
  },
});
