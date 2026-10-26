/* ---------- the TV: seven channels, the next one with E (or the context button) by anyone standing by it ----------
   The channels: static, the Night Show map, the fractal (Rabbit Hole of Ducklings), the Starry Night map, Ether's
   Crossroads, a duck in a bubble bath, a pixel kitten. The maps are the maps' own scenes (maps.js' SCENES), small on the
   screen; the rest are drawn here. Only the channel that is on runs, and only while the TV is on the screen (a few
   seconds after it leaves the view it stops), so the cabin runs as before. The channel is the room's (s.hang.tv), so
   everyone watches the same one; a change clicks the knob and snows for a moment. The picture lives in the TV's screen
   strip (shapes.js' tvParts, part 'screen'), laid flat on the screen's face, so it sorts with the TV. */
import { rule, activity } from './registry.js';
import { PROPS, TV, W, H } from './layout.js';
import { tvScreen } from './art.js';
import { tvScreenStrip } from './shapes.js';
import { SCENES } from '../maps.js';
import { duckSVG, DUCK_DEFAULT } from '../duck.js';
import { play, loop } from './sounds.js';

const CH = ['static', 'board', 'rabbit', 'stars', 'ec', 'bath', 'kitten'];
const REACH = 130;   // world px from the stand's middle
const F = 3;         // the picture's px for each of the screen's units (it is drawn bigger, then laid on the screen)
const TV_ID = PROPS.find(p => p.kind === 'tv').id;
const chan = s => ((s && s.hang && s.hang.tv) ?? 1) % CH.length;

rule('tv', {
  init: () => ({ tv: 1 }),   // the channel on (Night Show to start)
  act(s, a) {
    const me = s.pos[a.id]; if (!me || Math.hypot(me.x * W - TV.cx, me.y * H - TV.cy) > REACH * 2) return false;   // (only from beside it)
    s.hang.tv = (chan(s) + 1) % CH.length; return true;
  },
});

/* ---------- the channels drawn here ---------- */
/* snow: grey specks, a darker band rolling down through it */
function snowCanvas(cv) {
  cv.width = 64; cv.height = 48;
  const g = cv.getContext('2d'), img = g.createImageData(64, 48), d32 = new Uint32Array(img.data.buffer);
  let seed = (Math.random() * 4294967295) >>> 0 || 1;
  return now => {
    let s = seed;
    for (let i = 0; i < d32.length; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; const v = 40 + ((s & 255) * .8) | 0; d32[i] = (255 << 24 | v << 16 | v << 8 | v) >>> 0; }
    seed = s >>> 0 || 1; g.putImageData(img, 0, 0);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, (now / 25) % 64 - 10, 64, 9);
  };
}
function staticScene(layer) {
  const cv = document.createElement('canvas'); cv.className = 'tv-px'; layer.append(cv);
  const draw = snowCanvas(cv); let last = 0;
  return { update(now) { if (now - last < 70) return; last = now; draw(now); }, destroy() { cv.remove(); } };
}
/* a duck in a bubble bath: the game's own duck bobbing in a tub of foam, bubbles drifting up off it */
function bathScene(layer) {
  const sc = document.createElement('div'); sc.className = 'tv-bath';
  let bubbles = '';
  for (let i = 0; i < 9; i++) bubbles += `<i class="tvb-b" style="--x:${(8 + i * 10.5).toFixed(1)}%;--s:${(6 + (i * 7) % 9)}px;--d:${(2.6 + (i * 5) % 7 * .35).toFixed(2)}s;--dl:-${(i * .73).toFixed(2)}s"></i>`;
  const foam = [12, 26, 40, 54, 68, 82, 96, 110, 124, 138, 150].map((x, i) => `<circle cx="${x}" cy="${12 + (i % 2) * 3}" r="${9 + (i % 3) * 2}"/>`).join('');
  sc.innerHTML = `<div class="tvb-duck">${duckSVG(DUCK_DEFAULT, { size: 72, shadow: false })}</div>`
    + `<svg class="tvb-tub" viewBox="0 0 160 64" aria-hidden="true"><g fill="#fff" stroke="#1c1c28" stroke-width="3">${foam}</g>`
    + '<path d="M2 16H158Q156 52 128 56H32Q4 52 2 16Z" fill="#f4f2ec" stroke="#1c1c28" stroke-width="3"/><path d="M10 22H150" stroke="#dcd8cf" stroke-width="3"/>'
    + '<path d="M34 56l-4 7h10l1 -7M126 56l4 7h-10l-1 -7" fill="#d9a441" stroke="#1c1c28" stroke-width="2"/></svg>' + bubbles;
  layer.append(sc);
  return { update() {}, destroy() { sc.remove(); } };
}
/* a pixel picture of a kitten: an orange tabby's face, green eyes; it blinks now and then */
const KITTEN = ['........', '.kk.....', '.kok....', '.kpok...', '.koookkk', '.koooooo', '.kodoooo', 'kooooooo', 'koogeooo', 'koogeooo', 'kooowwwp', 'koowwwkw', '.koowwww', '..kkkkkk'];   // (the left half; the right is its mirror)
const KIT_INK = { k: '#2b1d14', o: '#f29b38', d: '#c46a1e', w: '#fff3e6', p: '#ff8fa3', g: '#5fd16b', e: '#14110f' };
function kittenScene(layer) {
  const cv = document.createElement('canvas'); cv.className = 'tv-px'; cv.width = 20; cv.height = 15; layer.append(cv);
  const g = cv.getContext('2d');
  const draw = shut => {
    g.fillStyle = '#3b2a5c'; g.fillRect(0, 0, 20, 15); g.fillStyle = '#4e3a78'; g.fillRect(0, 12, 20, 3);
    KITTEN.forEach((half, y) => {
      const row = half + [...half].reverse().join('');
      [...row].forEach((c, x) => {
        if (c === '.') return;
        g.fillStyle = shut && (c === 'g' || c === 'e') ? (y === 9 ? KIT_INK.k : KIT_INK.o) : KIT_INK[c];
        g.fillRect(x + 2, y + 1, 1, 1);
      });
    });
  };
  let blink = 0, open = true; draw(false);
  return {
    update(now) {
      if (!blink) blink = now + 2500 + Math.random() * 2500;
      if (open && now > blink) { open = false; draw(true); }
      else if (!open && now > blink + 160) { open = true; draw(false); blink = now + 2500 + Math.random() * 3000; }
    },
    destroy() { cv.remove(); },
  };
}
const MAKE = { static: staticScene, bath: bathScene, kitten: kittenScene, ...SCENES };

/* ---------- on the screen ---------- */
let el = null, pic = null, host = null, snow = null, scene = null, on = -1, seen = 0, last = -1, burst = 0, hiss = null;
function attach(strip) {
  const sc = tvScreen(), [x0] = tvScreenStrip(), k = Math.SQRT1_2 / F;
  pic = document.createElement('div'); pic.className = 'tv-pic';
  pic.style.cssText = `width:${sc.w * F}px;height:${sc.h * F}px;transform:matrix(${k.toFixed(4)}, ${(-k).toFixed(4)}, 0, ${(1 / F).toFixed(4)}, ${(sc.x - x0).toFixed(2)}, ${sc.y.toFixed(2)})`;
  pic.innerHTML = '<div class="tv-ch"></div><canvas class="tv-snow tv-px"></canvas><i class="tv-glass"></i>';
  strip.append(pic);
  host = pic.querySelector('.tv-ch'); snow = snowCanvas(pic.querySelector('.tv-snow'));
}
function stop() { if (scene) scene.destroy(); scene = null; on = -1; if (host) host.textContent = ''; }
function quiet() { if (hiss) hiss.stop(); hiss = null; }

activity({
  id: 'tv',
  near(pos, ctx) {
    if (!pos.inside) return null;
    const d = Math.hypot(pos.x - TV.cx, pos.y - TV.cy);
    return d < REACH ? { label: 'Next channel', d, act: () => ctx.send({ t: 'hang', k: 'tv' }) } : null;
  },
  onState(s) {
    const c = chan(s);
    if (last >= 0 && c !== last) { burst = performance.now() + 350; play('tvClick', { x: TV.cx, y: TV.cy }); }
    last = c;
  },
  draw(now, ctx) {
    const w = ctx.world;
    if (!el || !el.isConnected) { el = w.board.querySelector(`.hp[data-prop="${TV_ID}"][data-part="screen"]`); pic = null; scene = null; on = -1; if (el) attach(el); }
    const vis = !!el && !el.hidden && w.inside;
    if (vis) seen = now;
    else if (on >= 0 && now - seen > 3000) stop();
    const c = chan(ctx.state());
    if (vis && on !== c) { stop(); on = c; scene = MAKE[CH[c]](host); }
    if (vis && scene) scene.update(now);
    if (pic) {
      const snowing = vis && performance.now() < burst;
      if (snowing) snow(now);
      if (pic._snow !== snowing) { pic._snow = snowing; pic.classList.toggle('snowing', snowing); }
    }
    /* the static channel hisses, softly, while you're in the cabin with it */
    if (vis && CH[c] === 'static') { if (!hiss) hiss = loop('static', { x: TV.cx, y: TV.cy, k: .7 }); } else quiet();
  },
  unmount() { stop(); quiet(); if (pic) pic.remove(); el = pic = host = null; last = -1; },
});
