/* ---------- Customize: the Armory ----------
   After Halo: Reach's Armory. On a computer: a window with the menu on the left and your duck on the right, standing over
   your player card; on a phone the duck is on top. The menu runs down the duck: Hat, Face, Eyes, Beak, Body, then Skin;
   below a line come
   Name, Card and Colors. Each opens a grid of small picture tiles, three to a row; Colors opens the list of what can be
   colored beside a grid of swatches. Every change shows at once, is kept, and goes to the room you are in. */
import { profile, save, NAME_OK, cleanName, cleanStats } from './store.js';
import { openWindow, esc, toast } from './ui.js';
import { DUCK_PATTERNS, DUCK_METALS, BUILDS, SIZES, pictureToSquare, duckSVG } from './duck.js';
import { CARD_PATTERNS, CARD_LAYOUTS, CARD_SIZES, cardHTML, patternLayers } from './card.js';
import { HATS, hatById } from './hats.js';
import { FACES, faceById } from './faces.js';
import { EYES, eyeById } from './eyes.js';
import { BEAKS, beakById } from './beaks.js';
import { FONTS } from './name.js';
import { colorField } from './color.js';
import { activeRoom } from './net.js';
import { who } from './who.js';

/* sends your look to the room you are in */
export function shareLook() {
  const r = activeRoom(); if (!r) return;
  r.send({ t: 'look', look: { name: profile.name, duck: { ...profile.duck }, card: { ...profile.card }, nameStyle: { ...profile.nameStyle }, stats: cleanStats(profile.stats), ...(who.acct ? { acct: who.acct } : {}) } });
}
/* a new name: letters, numbers, dashes and underscores */
export function setName(raw) {
  const n = cleanName(raw);
  if (!NAME_OK.test(n)) return false;
  profile.name = n; save(true); shareLook(); return true;
}

/* the menu, top to bottom as on the duck; then the rest below a line */
const ROWS = [['hat', 'Hat'], ['face', 'Face'], ['eyes', 'Eyes'], ['beak', 'Beak'], ['body', 'Body'], ['skin', 'Skin'], null, ['name', 'Name'], ['card', 'Card'], ['colors', 'Colors']];
const nameOf = (list, v, none = 'None') => { const f = list.find(x => x[0] === v); return f ? f[1] : none; };
/* the body in words: only what is not normal */
const bodyName = D => [[BUILDS, D.build], [SIZES, D.size]].filter(([, v]) => +v).map(([l, v]) => nameOf(l, +v, '')).filter(Boolean).join(', ') || 'Normal';
/* a close look at the head, for eye and beak tiles */
const headPic = look => duckSVG({ ...look, image: null, hat: null, face: null, size: 0 }, { size: 58, shadow: false })
  .replace(/viewBox="[^"]*" width="[^"]*" height="[^"]*"/, 'viewBox="54 9 77 58" width="64" height="48" style="overflow:hidden"');
const valueOf = k => {
  const D = profile.duck, C = profile.card;
  return {
    hat: D.hat && hatById(D.hat.id) ? hatById(D.hat.id).name : 'None',
    face: D.face && faceById(D.face.id) ? faceById(D.face.id).name : 'None',
    eyes: eyeById(D.eyes).name,
    beak: beakById(D.beak).name,
    body: bodyName(D),
    skin: D.image ? 'Your picture' : D.metal !== 'none' ? nameOf(DUCK_METALS, D.metal) : nameOf(DUCK_PATTERNS, D.pattern, 'Plain'),
    name: profile.name,
    card: C.image ? 'Your picture' : nameOf(CARD_PATTERNS, C.pattern, 'Plain'),
    colors: '',
  }[k];
};
/* a grid of picture tiles, three to a row */
const grid = (group, items, cur) => `<div class="arm-grid" role="group">${items.map(([v, pic, label, tip]) =>
  `<button type="button" class="arm-tile" data-g="${group}" data-v="${esc(v)}" aria-pressed="${v === cur}"${tip ? ` data-tip="${esc(tip)}"` : ''}>${pic}<span>${esc(label)}</span></button>`).join('')}</div>`;
let lastPage = null, lastColor = 'duck';
const openFolds = new Set();

export function openCustomize(page = lastPage) {
  if (page === 'duck') page = null;   // (the old tab name)
  return openWindow(`<div class="armory"><div class="arm-menu"></div><div class="arm-stage"><div class="arm-duck"></div><div class="arm-card"></div></div></div>`, {
    cls: 'win-armory',
    onOpen(w) {
      openFolds.clear();
      const menu = w.querySelector('.arm-menu'), duckBox = w.querySelector('.arm-duck'), cardBox = w.querySelector('.arm-card');
      const me = () => ({ id: 'me', name: profile.name, duck: profile.duck, card: profile.card, nameStyle: profile.nameStyle });
      const stage = () => { duckBox.innerHTML = duckSVG(profile.duck, { size: 220, title: profile.name }); cardBox.innerHTML = cardHTML(me(), { size: 52 }); };
      const changed = (redraw = true) => { save(); stage(); shareLook(); if (redraw) show(lastPage, true); };
      const head = title => `<header class="arm-h">${lastPage ? '<button type="button" class="arm-back" data-a="back" aria-label="Back">‹</button>' : '<span class="arm-mark">◆</span>'}<h2>${esc(title)}</h2></header>`;
      const upload = (label, onPic) => `<label class="arm-tile arm-up" data-tip="A square picture works best">${'<span class="up-ico">⇪</span>'}<span>${esc(label)}</span><input type="file" accept="image/*" hidden data-up="${onPic}"></label>`;

      const show = (k, keep) => {
        const scroll = keep ? (menu.querySelector('.arm-body') || {}).scrollTop || 0 : 0;
        lastPage = k || null;
        const D = profile.duck, C = profile.card, N = profile.nameStyle;
        let html = '';
        if (!k) {
          html = head('Customize') + `<div class="arm-body"><ul class="arm-list">${ROWS.map(r => r ? `<li><button type="button" class="arm-row" data-p="${r[0]}"><span>${esc(r[1])}…</span><span class="val">${esc(valueOf(r[0]) || '')}</span></button></li>` : '<li class="arm-line" aria-hidden="true"></li>').join('')}</ul></div>`;
        } else if (k === 'hat') {
          const pic = id => duckSVG({ ...D, image: null, face: null, hat: id ? { ...(D.hat && D.hat.id === id ? D.hat : {}), id } : null }, { size: 58, shadow: false });
          const hd = D.hat && hatById(D.hat.id);
          html = head('Hat') + `<div class="arm-body">${grid('hat', [['none', pic(null), 'No hat'], ...HATS.map(h => [h.id, pic(h.id), h.name, h.tip])], hd ? hd.id : 'none')}
            ${hd ? `<div class="arm-opts">${hd.ketchup ? `<label class="check"><input type="checkbox" data-o="ketchup"${D.hat.ketchup ? ' checked' : ''}>Ketchup</label>` : ''}
              ${hd.metal ? `<div class="row small-tiles">${DUCK_METALS.slice(1).map(([v, n]) => `<button type="button" class="tile" data-g="hmetal" data-v="${v}" aria-pressed="${(D.hat.metal || 'gold') === v}">${esc(n)}</button>`).join('')}</div>` : ''}
              ${hd.colors ? '<p class="small dim">Its colors are under Colors.</p>' : ''}${hd.tip ? `<p class="small dim">${esc(hd.name)}: ${esc(hd.tip)}</p>` : ''}</div>` : ''}
            ${D.image ? '<p class="small dim">Hats show on the duck, not on a picture.</p>' : ''}</div>`;
        } else if (k === 'face') {
          const pic = id => duckSVG({ ...D, image: null, face: id ? { id } : null }, { size: 58, shadow: false });
          html = head('Face') + `<div class="arm-body">${grid('face', [['none', pic(null), 'Nothing'], ...FACES.map(f => [f.id, pic(f.id), f.name, f.tip])], D.face ? D.face.id : 'none')}
            <p class="small dim">Face items go over the face, hat or no hat. More are coming.</p></div>`;
        } else if (k === 'eyes') {
          html = head('Eyes') + `<div class="arm-body">${grid('eyes', EYES.map(x => [x.id, headPic({ ...D, eyes: x.id }), x.name, x.tip]), eyeById(D.eyes).id)}
            <p class="small dim">A face item over the eyes hides them.</p></div>`;
        } else if (k === 'beak') {
          const bd = beakById(D.beak);
          html = head('Beak') + `<div class="arm-body">${grid('beak', BEAKS.map(x => [x.id, headPic({ ...D, beak: x.id }), x.name, x.tip]), bd.id)}
            ${bd.colors ? '<p class="small dim">Its colors are under Colors.</p>' : ''}</div>`;
        } else if (k === 'body') {
          const pic = look => duckSVG({ ...D, image: null, ...look }, { size: 58, shadow: false });
          html = head('Body') + `<div class="arm-body arm-bodies"><h3>Build</h3>${grid('build', BUILDS.map(([v, n]) => [String(v), pic({ build: v }), n]), String(+D.build || 0))}
            <h3>Size</h3>${grid('size', SIZES.map(([v, n]) => [String(v), pic({ size: v }), n]), String(+D.size || 0))}
            <p class="small dim">A bigger or fatter duck takes more room on the board; a small or skinny one slips by.</p></div>`;
        } else if (k === 'skin') {
          const pic = look => duckSVG({ ...D, hat: null, face: null, image: null, ...look }, { size: 58, shadow: false });
          const cur = D.image ? 'pic' : D.metal !== 'none' ? 'm:' + D.metal : 'p:' + D.pattern;
          html = head('Skin') + `<div class="arm-body">${grid('skin', [
            ...DUCK_PATTERNS.map(([v, n]) => ['p:' + v, pic({ pattern: v, metal: 'none' }), n]),
            ...DUCK_METALS.slice(1).map(([v, n]) => ['m:' + v, pic({ metal: v }), n]),
          ], cur).replace('</div>', `${upload(D.image ? 'Change picture' : 'Your picture', 'duck')}${D.image ? `<button type="button" class="arm-tile" data-a="nopic" aria-pressed="true"><img src="${esc(D.image)}" alt=""><span>Back to the duck</span></button>` : ''}</div>`)}
            <p class="small dim">A metal or a picture takes the place of the duck's color. The pattern's color is under Colors.</p></div>`;
        } else if (k === 'name') {
          html = head('Name') + `<div class="arm-body"><div class="row"><input class="cz-name" maxlength="20" value="${esc(profile.name)}" spellcheck="false" aria-label="Name"></div>
            <p class="small dim">Letters, numbers, - and _.</p>
            ${grid('nfont', FONTS.map(f => [f.id, `<b class="font-pic" style="font-family:${esc(f.css)}">${esc(profile.name.slice(0, 8))}</b>`, f.name]), N.font)}
            <label class="check"><input type="checkbox" data-o="rainbow"${N.rainbow ? ' checked' : ''}>Multicolored letters</label>
            <p class="small dim">The name's color is under Colors.</p></div>`;
        } else if (k === 'card') {
          const pat = (v, layout = C.layout, size = C.size) => `<span class="pat-pic" style="${esc(`background:${v !== 'none' ? patternLayers(v, C.patternColor || '#ffffff', layout, size) + ', ' : ''}${C.color}`)}"></span>`;
          const cur = C.image ? '' : C.pattern, kind = k => CARD_PATTERNS.filter(([v]) => k ? v.startsWith(k + ':') : !v.includes(':'));
          /* hat, face and ball patterns fold away under their own arrows, shut each time Customize opens */
          const fold = (k, label) => `<details class="arm-fold" data-fold="${k}"${openFolds.has(k) ? ' open' : ''}><summary>${label}</summary>${grid('cpat', kind(k).map(([v, n]) => [v, pat(v), n]), cur)}</details>`;
          html = head('Card') + `<div class="arm-body"><h3>Pattern</h3>${grid('cpat', kind('').map(([v, n]) => [v, pat(v), n]), cur)}${fold('ball', 'Ball patterns')}${fold('hat', 'Hat patterns')}${fold('face', 'Face patterns')}
            ${C.pattern !== 'none' && !C.image ? `<h3>How it sits</h3>${grid('clay', CARD_LAYOUTS.map(([v, n]) => [v, pat(C.pattern, v), n]), C.layout || 'tiled')}
            <h3>Size</h3><div class="row small-tiles">${CARD_SIZES.map(([v, n]) => `<button type="button" class="tile" data-g="csize" data-v="${v}" aria-pressed="${(C.size || 'm') === v}">${n}</button>`).join('')}</div>` : ''}
            <h3>Picture</h3><div class="arm-grid">${upload(C.image ? 'Change picture' : 'Your picture', 'card')}${C.image ? `<button type="button" class="arm-tile" data-a="nocard" aria-pressed="true"><img src="${esc(C.image)}" alt=""><span>Remove picture</span></button>` : ''}</div>
            <p class="small dim">The card's colors are under Colors.</p></div>`;
        } else if (k === 'colors') {
          const T = colorTargets(), cur = T.find(t => t[0] === lastColor) || T[0]; lastColor = cur[0];
          html = head('Colors') + `<div class="arm-body arm-colors"><ul class="arm-list ctargets">${T.map(([id, label]) => `<li><button type="button" class="arm-row" data-c="${id}" aria-pressed="${id === cur[0]}"><span>${esc(label)}</span></button></li>`).join('')}</ul>
            <div class="cpick"><p class="small dim cnote">${esc(cur[4] || '')}</p></div></div>`;
        }
        menu.innerHTML = html;
        const body = menu.querySelector('.arm-body'); if (body) body.scrollTop = scroll;
        if (k === 'colors') {
          const T = colorTargets(), cur = T.find(t => t[0] === lastColor);
          const pick = menu.querySelector('.cpick');
          if (cur[0] === 'name') pick.insertAdjacentHTML('afterbegin', `<div class="row"><button type="button" class="tile" data-a="plainname" aria-pressed="${!N.color && !N.rainbow}" data-tip="Dark letters on light, light letters on dark.">Plain</button></div>`);
          pick.insertBefore(colorField(cur[2], c => { cur[3](c); changed(false); menu.querySelectorAll('[data-a="plainname"]').forEach(b => b.setAttribute('aria-pressed', 'false')); }, { grid: true }), pick.querySelector('.cnote'));
        }
        if (k === 'name') {
          const inp = menu.querySelector('.cz-name');
          inp.oninput = () => { const c = cleanName(inp.value); if (c !== inp.value) { inp.value = c; inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 300); } if (c && setName(c)) { stage(); menu.querySelectorAll('.font-pic').forEach(b => { b.textContent = c.slice(0, 8); }); } };
        }
      };
      /* what can be colored now (a target shows only when it is in use) */
      function colorTargets() {
        const D = profile.duck, C = profile.card, N = profile.nameStyle, hd = D.hat && hatById(D.hat.id), out = [];
        out.push(['duck', 'Duck', D.metal !== 'none' || D.image ? '' : D.color, c => { D.color = c; D.metal = 'none'; D.image = null; }, 'Picking a color takes off a metal or a picture.']);
        if (D.pattern !== 'none' && D.metal === 'none' && !D.image) out.push(['dpat', 'Duck pattern', D.patternColor, c => { D.patternColor = c; }, 'The color of the pattern on your duck.']);
        for (const [key, label, def] of (hd && hd.colors) || []) out.push(['hat-' + key, `${hd.name}: ${label}`, D.hat[key] || def, c => { D.hat = { ...D.hat, [key]: c }; }, '']);
        const bd = beakById(D.beak);
        for (const [key, label, def] of bd.colors || []) out.push([key, label, D[key] || def, c => { D[key] = c; }, '']);
        const fd = D.face && faceById(D.face.id);
        for (const [key, label, def] of (fd && fd.colors) || []) out.push(['face-' + key, `${fd.name}: ${label}`, D.face[key] || def, c => { D.face = { ...D.face, [key]: c }; }, '']);
        out.push(['card', 'Card', C.color, c => { C.color = c; }, 'The color behind your card\'s pattern.']);
        if (C.pattern !== 'none' && !C.image) out.push(['cpat', 'Card pattern', C.patternColor, c => { C.patternColor = c; }, 'The pattern\'s color (for a hat pattern, the hat\'s).']);
        out.push(['name', 'Name', N.color, c => { N.color = c; N.rainbow = false; }, 'Plain fits light and dark.']);
        return out;
      }
      menu.addEventListener('click', e => {
        const D = profile.duck, C = profile.card, N = profile.nameStyle;
        const row = e.target.closest('.arm-row[data-p]'); if (row) { show(row.dataset.p); return; }
        const tgt = e.target.closest('.arm-row[data-c]'); if (tgt) { lastColor = tgt.dataset.c; show('colors', true); return; }
        const a = e.target.closest('[data-a]');
        if (a) {
          if (a.dataset.a === 'back') { show(null); return; }
          if (a.dataset.a === 'nopic') { D.image = null; changed(); return; }
          if (a.dataset.a === 'nocard') { C.image = null; changed(); return; }
          if (a.dataset.a === 'plainname') { N.color = ''; N.rainbow = false; changed(); return; }
        }
        const t = e.target.closest('[data-g]'); if (!t) return;
        const v = t.dataset.v;
        ({
          hat: () => { D.hat = v === 'none' ? null : { ...(D.hat && D.hat.id === v ? D.hat : {}), id: v }; },
          hmetal: () => { D.hat = { ...D.hat, metal: v }; },
          face: () => { D.face = v === 'none' ? null : { id: v }; },
          eyes: () => { D.eyes = v; },
          beak: () => { D.beak = v; },
          build: () => { D.build = +v; },
          size: () => { D.size = +v; },
          skin: () => { D.image = null; if (v.startsWith('m:')) D.metal = v.slice(2); else { D.metal = 'none'; D.pattern = v.slice(2); } },
          nfont: () => { N.font = v; },
          cpat: () => { C.pattern = v; C.image = null; },
          clay: () => { C.layout = v; },
          csize: () => { C.size = v; },
        })[t.dataset.g]();
        changed();
      });
      menu.addEventListener('toggle', e => { const k = e.target.dataset && e.target.dataset.fold; if (k) e.target.open ? openFolds.add(k) : openFolds.delete(k); }, true);
      menu.addEventListener('change', async e => {
        const o = e.target.dataset.o, up = e.target.dataset.up;
        if (o === 'ketchup') { profile.duck.hat = { ...profile.duck.hat, ketchup: e.target.checked }; changed(); }
        if (o === 'rainbow') { profile.nameStyle.rainbow = e.target.checked; changed(); }
        if (up) {
          try { const d = await pictureToSquare(e.target.files[0], 160); if (up === 'duck') profile.duck.image = d; else profile.card.image = d; changed(); }
          catch (err) { toast(err.message); }
        }
      });
      stage(); show(page);
    },
  });
}
