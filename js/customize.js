/* ---------- Customize: the Armory ----------
   After Halo: Reach's Armory. On a computer: a window with the menu on the left and your duck on the right, standing over
   your player card; on a phone the duck is on top. The menu runs down the duck: Hat, Face, Eyes, Beak, Outfit, Body,
   Style, then Skin;
   below a line come
   Name, Card and Colors. Each opens a grid of small picture tiles, three to a row; Colors opens the list of what can be
   colored beside a grid of swatches. Every change shows at once, is kept, and goes to the room you are in. */
import { profile, save, NAME_OK, cleanName, cleanStats } from './store.js';
import { openWindow, esc, toast, onMenu, el, navSig, refocus } from './ui.js';
import { SPECIALS, KEYS, specialById, keysOf, colorsOf, momentHTML, puffHTML, confettiRain, pressFX, BULLET, daggerHTML } from './specials.js';
import { sfx } from './sound.js';
import { DUCK_PATTERNS, DUCK_METALS, BUILDS, SIZES, pictureToSquare, duckSVG } from './duck.js';
import { CARD_PATTERNS, CARD_LAYOUTS, CARD_SIZES, cardHTML, patternLayers } from './card.js';
import { HATS, HAT_GROUPS, hatById } from './hats.js';
import { FACES, FACE_GROUPS, faceById } from './faces.js';
import { EYES, EYE_GROUPS, eyeById } from './eyes.js';
import { BEAKS, BEAK_GROUPS, beakById } from './beaks.js';
import { STYLES, styleById } from './styles.js';
import { OUTFITS, OUTFIT_GROUPS, outfitById } from './outfits.js';
import { FONTS, fontHTML } from './name.js';
import { colorField } from './color.js';
import { activeRoom } from './net.js';
import { who } from './who.js';
import { NAV_HINTS, items } from './keynav.js';

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
const ROWS = [['hat', 'Hat'], ['face', 'Face'], ['eyes', 'Eyes'], ['beak', 'Beak'], ['outfit', 'Outfit'], ['body', 'Body'], ['style', 'Style'], ['skin', 'Skin'], null, ['name', 'Name'], ['card', 'Card'], ['specials', 'Specials'], ['colors', 'Colors']];
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
    style: styleById(D.style).name,
    outfit: D.outfit && outfitById(D.outfit.id) ? outfitById(D.outfit.id).name : 'None',
    skin: D.image ? 'Your picture' : D.metal !== 'none' ? nameOf(DUCK_METALS, D.metal) : nameOf(DUCK_PATTERNS, D.pattern, 'Plain'),
    name: profile.name,
    card: C.image ? 'Your picture' : nameOf(CARD_PATTERNS, C.pattern, 'Plain'),
    specials: (k => k.length === 1 ? specialById(k[0]).name : k.length ? `${k.length} on keys` : 'None')(keysOf(D).filter(Boolean)),
    colors: '',
  }[k];
};
/* a grid of picture tiles, three to a row */
const grid = (group, items, cur) => `<div class="arm-grid" role="group">${items.map(([v, pic, label, tip]) =>
  `<button type="button" class="arm-tile" data-g="${group}" data-v="${esc(v)}" aria-pressed="${v === cur}"${tip ? ` data-tip="${esc(tip)}"` : ''}>${pic}<span>${esc(label)}</span></button>`).join('')}</div>`;
/* a grid split into themed groups under small headings; "none" (if there) comes first, anything ungrouped last */
const grouped = (group, items, cur, groups) => {
  const by = new Map(items.map(i => [i[0], i])), used = new Set(['none']), none = items.filter(i => i[0] === 'none');
  const parts = groups.map(([label, ids]) => { const its = ids.map(id => by.get(id)).filter(Boolean); its.forEach(i => used.add(i[0])); return its.length ? `<h3>${esc(label)}</h3>${grid(group, its, cur)}` : ''; });
  const rest = items.filter(i => !used.has(i[0]));
  return (none.length ? grid(group, none, cur) : '') + parts.join('') + (rest.length ? `<h3>More</h3>${grid(group, rest, cur)}` : '');
};
let lastPage = null, lastColor = 'duck', keyFor = null;   // keyFor: the special whose key boxes are open
const openFolds = new Set();

export function openCustomize(page = lastPage) {
  if (page === 'duck') page = null;   // (the old tab name)
  return openWindow(`<div class="armory"><div class="arm-menu"></div><div class="arm-stage" data-nonav><div class="arm-duck"></div><div class="arm-card"></div><p class="hints arm-keys">${NAV_HINTS}</p></div></div>`, {
    cls: 'win-armory',
    onOpen(w) {
      openFolds.clear(); keyFor = null;
      const menu = w.querySelector('.arm-menu'), duckBox = w.querySelector('.arm-duck'), cardBox = w.querySelector('.arm-card');
      const me = () => ({ id: 'me', name: profile.name, duck: profile.duck, card: profile.card, nameStyle: profile.nameStyle });
      /* the big duck; while an effect's color is being picked, the effect plays around its head */
      const stage = () => {
        const sp = colorSpecial();
        duckBox.innerHTML = `<span class="arm-pic">${duckSVG(profile.duck, { size: 220, title: profile.name })}${sp && sp.kind === 'effect' ? `<span class="sp-fx">${momentHTML(sp.id, profile.duck)}</span>` : ''}</span>`;   // (effects sit on the duck, not on the whole panel)
        cardBox.innerHTML = cardHTML(me(), { size: 52 });
      };
      const colorSpecial = () => lastPage === 'colors' && lastColor.startsWith('sp-') ? specialById(lastColor.split('-')[1]) : null;
      let prevT = 0;
      /* a special, shown once on the big duck the way it works in a game (an effect for 5 seconds) */
      const preview = id => {
        const sp = specialById(id), pic = duckBox.querySelector('.arm-pic'), svg = pic && pic.querySelector('svg'); if (!sp || !svg) return;
        const w = svg.getBoundingClientRect(), b = pic.getBoundingClientRect();
        const x = w.left - b.left + w.width * .5, y = w.bottom - b.top - w.width * .06;
        if (sp.kind === 'effect') {
          pic.querySelectorAll('.sp-prev-fx').forEach(e => e.remove());
          const fx = el(`<span class="sp-fx sp-prev-fx">${momentHTML(id, profile.duck)}</span>`); pic.append(fx); setTimeout(() => fx.remove(), 5000);
        }
        if (sp.kind === 'jump') {   // one hop (two for the double jump, with its cloud), not one on every redraw after
          const cls = id === 'double' ? 'hop2' : 'hop';
          duckBox.classList.remove('hop', 'hop2'); void duckBox.offsetWidth; duckBox.classList.add(cls); clearTimeout(duckBox._hop); duckBox._hop = setTimeout(() => duckBox.classList.remove(cls), 1500);
          if (id === 'double') setTimeout(() => { const pf = el(puffHTML(x, y - w.width * .42, w.width, colorsOf(profile.duck, 'double')[0])); pic.append(pf); sfx.puff(); setTimeout(() => pf.remove(), 1000); }, 480);
        }
        if (sp.kind === 'item') {
          if (id === 'confetti') { confettiRain(3500); return; }
          const els = pressFX(id, x, y, w.width, 1, profile.duck);
          /* the handgun: its slow bullet crosses the whole preview */
          if (id === 'handgun') els.push(el(`<div class="spe spe-shot" style="left:${(x + w.width * .62).toFixed(0)}px;top:${(y - w.width * .48).toFixed(0)}px;--dx:${Math.round(duckBox.getBoundingClientRect().right - b.left - x + 40)}px">${BULLET(colorsOf(profile.duck, 'handgun')[2])}</div>`));
          /* the dagger: thrown from the beak, it spins up and over and falls away */
          if (id === 'dagger') els.push(el(`<div class="spe spe-dthrow" style="left:${(x + w.width * .4).toFixed(0)}px;top:${(y - w.width * .55).toFixed(0)}px;--s:${w.width.toFixed(0)}px;--dx:${Math.round(duckBox.getBoundingClientRect().right - b.left - x)}px"><b><i>${daggerHTML(profile.duck)}</i></b></div>`));
          pic.append(...els); setTimeout(() => els.forEach(e => e.remove()), 2400);
          ({ coffee: sfx.sip, hotdog: sfx.chomp, watergun: sfx.splash, confgun: sfx.pop, handgun: sfx.bang, dagger: sfx.swish, sound: sfx.quack, trombone: sfx.trombone })[id]?.();
        }
      };
      const changed = (redraw = true) => {
        save(); stage(); shareLook(); if (redraw) show(lastPage, true);
        const sp = colorSpecial(); if (sp && sp.kind !== 'effect') { clearTimeout(prevT); prevT = setTimeout(() => preview(sp.id), 350); }   // an item's new color, shown on the duck
      };
      const head = title => `<header class="arm-h">${lastPage ? '<button type="button" class="arm-back" data-a="back" aria-label="Back">‹</button>' : '<span class="arm-mark">◆</span>'}<h2>${esc(title)}</h2></header>`;
      const upload = (label, onPic) => `<label class="arm-tile arm-up" tabindex="0" data-up-for="${onPic}" data-tip="A square picture works best">${'<span class="up-ico">⇪</span>'}<span>${esc(label)}</span><input type="file" accept="image/*" hidden data-up="${onPic}"></label>`;

      const show = (k, keep) => {
        const scroll = keep ? (menu.querySelector('.arm-body') || {}).scrollTop || 0 : 0;
        const prev = lastPage; lastPage = k || null;
        if (!keep) stage();   // (the Specials page shows the special on the big duck)
        const D = profile.duck, C = profile.card, N = profile.nameStyle;
        let html = '';
        if (!k) {
          html = head('Customize') + `<div class="arm-body"><ul class="arm-list">${ROWS.map(r => r ? `<li><button type="button" class="arm-row" data-p="${r[0]}"><span>${esc(r[1])}…</span><span class="val">${esc(valueOf(r[0]) || '')}</span></button></li>` : '<li class="arm-line" aria-hidden="true"></li>').join('')}</ul></div>`;
        } else if (k === 'hat') {
          const pic = id => duckSVG({ ...D, image: null, face: null, hat: id ? { ...(D.hat && D.hat.id === id ? D.hat : {}), id } : null }, { size: 58, shadow: false });
          const hd = D.hat && hatById(D.hat.id);
          html = head('Hat') + `<div class="arm-body">${grouped('hat', [['none', pic(null), 'No hat'], ...HATS.map(h => [h.id, pic(h.id), h.name, h.tip])], hd ? hd.id : 'none', HAT_GROUPS)}
            ${hd ? `<div class="arm-opts">${hd.ketchup ? `<label class="check"><input type="checkbox" data-o="ketchup"${D.hat.ketchup ? ' checked' : ''}>Ketchup</label>` : ''}
              ${hd.metal ? `<div class="row small-tiles">${DUCK_METALS.slice(1).map(([v, n]) => `<button type="button" class="tile" data-g="hmetal" data-v="${v}" aria-pressed="${(D.hat.metal || 'gold') === v}">${esc(n)}</button>`).join('')}</div>` : ''}
              ${hd.colors ? '<p class="small dim">Its colors are under Colors.</p>' : ''}${hd.tip ? `<p class="small dim">${esc(hd.name)}: ${esc(hd.tip)}</p>` : ''}</div>` : ''}
            ${D.image ? '<p class="small dim">Hats show on the duck, not on a picture.</p>' : ''}</div>`;
        } else if (k === 'face') {
          const pic = id => duckSVG({ ...D, image: null, face: id ? { id } : null }, { size: 58, shadow: false });
          html = head('Face') + `<div class="arm-body">${grouped('face', [['none', pic(null), 'Nothing'], ...FACES.map(f => [f.id, pic(f.id), f.name, f.tip])], D.face ? D.face.id : 'none', FACE_GROUPS)}
            <p class="small dim">Face items go over the face, hat or no hat. More are coming.</p></div>`;
        } else if (k === 'eyes') {
          html = head('Eyes') + `<div class="arm-body">${grouped('eyes', EYES.map(x => [x.id, headPic({ ...D, eyes: x.id }), x.name, x.tip]), eyeById(D.eyes).id, EYE_GROUPS)}
            <p class="small dim">A face item over the eyes hides them.</p></div>`;
        } else if (k === 'beak') {
          const bd = beakById(D.beak);
          html = head('Beak') + `<div class="arm-body">${grouped('beak', BEAKS.map(x => [x.id, headPic({ ...D, beak: x.id }), x.name, x.tip]), bd.id, BEAK_GROUPS)}
            ${bd.colors ? '<p class="small dim">Its colors are under Colors.</p>' : ''}</div>`;
        } else if (k === 'body') {
          const pic = look => duckSVG({ ...D, image: null, ...look }, { size: 58, shadow: false });
          html = head('Body') + `<div class="arm-body arm-bodies"><h3>Build</h3>${grid('build', BUILDS.map(([v, n]) => [String(v), pic({ build: v }), n]), String(+D.build || 0))}
            <h3>Size</h3>${grid('size', SIZES.map(([v, n]) => [String(v), pic({ size: v }), n]), String(+D.size || 0))}
            <p class="small dim">A bigger or fatter duck takes more room on the board; a small or skinny one slips by.</p></div>`;
        } else if (k === 'outfit') {
          const pic = id => duckSVG({ ...D, image: null, hat: null, face: null, outfit: id ? { ...(D.outfit && D.outfit.id === id ? D.outfit : {}), id } : null }, { size: 58, shadow: false });
          const od = D.outfit && outfitById(D.outfit.id);
          html = head('Outfit') + `<div class="arm-body">${grouped('outfit', [['none', pic(null), 'No outfit'], ...OUTFITS.map(o => [o.id, pic(o.id), o.name, o.tip])], od ? od.id : 'none', OUTFIT_GROUPS)}
            ${od ? `<p class="small dim">${esc(od.name)}${od.tip ? `: ${esc(od.tip)}` : '.'}${od.colors ? ' Its colors are under Colors.' : ''}</p>` : '<p class="small dim">An outfit goes over the body, whatever the style.</p>'}</div>`;
        } else if (k === 'style') {
          /* each style on your duck as it is: picking one changes nothing else; the button below brings in the style's
             matching beak, eyes and colors, only when you want them */
          const st = styleById(D.style), mb = st.match && beakById(st.match), me = st.eyes && eyeById(st.eyes);
          const matched = (!mb || D.beak === st.match) && (!me || D.eyes === st.eyes) && (st.colors || []).every(([c, , v]) => (D[c] || '').toLowerCase() === v.toLowerCase());
          const what = [mb ? `the ${mb.name.toLowerCase()}` : '', me ? `the ${me.name.toLowerCase()}` : '', st.colors ? 'its colors' : ''].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1');
          html = head('Style') + `<div class="arm-body">${grid('style', STYLES.map(x => [x.id, duckSVG({ ...D, image: null, style: x.id }, { size: 58, shadow: false }), x.name, x.tip]), st.id)}
            ${st.tip ? `<p class="small dim">${esc(st.tip)}</p>` : ''}${what && !matched ? `<p><button type="button" class="btn ghost small" data-a="matchstyle" data-tip="Puts on ${esc(what)}.">Match the ${esc(st.name.toLowerCase())} look</button></p>` : ''}
            ${st.colors ? '<p class="small dim">Its colors are under Colors.</p>' : ''}</div>`;
        } else if (k === 'specials') {
          /* your ten keys on top (tap one to take its special off); then every special, each with a preview button; a
             special's tile opens a box for each key right under it */
          const keys = keysOf(D), open = specialById(keyFor), phone = !matchMedia('(any-pointer: fine)').matches;   // (only a touch screen: a touchscreen laptop has a touchpad too)
          const box = (n, i, id, attrs) => `<button type="button" class="sp-key${id ? ' full' : ''}" data-i="${i}" ${attrs}><b>${n}</b>${id ? `<i>${specialById(id).icon}</i>` : ''}</button>`;
          const tiles = kind => SPECIALS.filter(x => x.kind === kind).map(x => {
            const at = keys.indexOf(x.id), opened = x.id === keyFor;
            return `<div class="sp-tile"><button type="button" class="arm-tile" data-g="special" data-v="${x.id}" aria-pressed="${at >= 0}" aria-expanded="${opened}" data-tip="${esc(x.tip)}"><span class="sp-icon">${x.icon}</span><span>${esc(x.name)}</span>${at >= 0 ? `<b class="sp-on">${KEYS[at]}</b>` : ''}</button>
              <button type="button" class="sp-prev" data-a="preview" data-v="${x.id}" aria-label="Preview ${esc(x.name)}" data-tip="Show it on your duck">▶</button></div>
              ${opened ? `<div class="sp-keys sp-pick" role="group" aria-label="Put ${esc(x.name)} on a key">${KEYS.map((n, i) => box(n, i, keys[i], `data-a="setkey" aria-pressed="${keys[i] === x.id}" aria-label="Key ${n}${keys[i] ? `: ${esc(specialById(keys[i]).name)}` : ''}"`)).join('')}</div>` : ''}`;
          }).join('');
          html = head('Specials') + `<div class="arm-body arm-specials"><h3>Your keys</h3><div class="sp-keys sp-mine">${KEYS.map((n, i) => box(n, i, keys[i], keys[i] ? `data-a="unkey" data-tip="Take ${esc(specialById(keys[i]).name)} off key ${n}" aria-label="Key ${n}: ${esc(specialById(keys[i]).name)}"` : `aria-label="Key ${n}: empty" disabled`)).join('')}</div>
            <p class="small dim sp-now">${open ? `${esc(open.name)}: ${esc(open.tip)} Pick its key.` : phone ? 'Tap a special, then the key to put it on. In a game, hold still on the board to use them.' : 'Pick a special, then the key to put it on. In a game, press its key; Shift and the key keeps it on.'}</p>
            <h3>Effects</h3><div class="arm-grid sp-grid">${tiles('effect')}</div>
            <h3>Jumps</h3><div class="arm-grid sp-grid">${tiles('jump')}</div>
            <h3>Items</h3><div class="arm-grid sp-grid">${tiles('item')}</div>
            <p class="small dim">Their colors are under Colors.</p></div>`;
        } else if (k === 'skin') {
          const pic = look => duckSVG({ ...D, hat: null, face: null, image: null, ...look }, { size: 58, shadow: false });
          const cur = D.image ? 'pic' : D.metal !== 'none' ? 'm:' + D.metal : 'p:' + D.pattern;
          html = head('Skin') + `<div class="arm-body">${grid('skin', [
            ...DUCK_PATTERNS.map(([v, n]) => ['p:' + v, pic({ pattern: v, metal: 'none' }), n]),
            ...DUCK_METALS.slice(1).map(([v, n]) => ['m:' + v, pic({ metal: v }), n]),
          ], cur).replace('</div>', `${upload(D.image ? 'Change picture' : 'Your picture', 'duck')}${D.image ? `<button type="button" class="arm-tile" data-a="nopic" aria-pressed="true"><img src="${esc(D.image)}" alt=""><span>Back to the duck</span></button>` : ''}</div>`)}
            <p class="small dim">A metal or a picture takes the place of the duck's color. The pattern's color is under Colors.${styleById(D.style).fixed || styleById(D.style).flat ? ` (Your ${esc(styleById(D.style).name.toLowerCase())} shows its own look; patterns and metals show on the other styles.)` : ''}</p></div>`;
        } else if (k === 'name') {
          html = head('Name') + `<div class="arm-body"><div class="row"><input class="cz-name" maxlength="20" value="${esc(profile.name)}" spellcheck="false" aria-label="Name"></div>
            <p class="small dim">Letters, numbers, - and _.</p>
            ${grid('nfont', FONTS.map(f => [f.id, `<b class="font-pic">${fontHTML(f.id, esc(profile.name.slice(0, 8)))}</b>`, f.name]), N.font)}
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
          html = head('Colors') + `<div class="arm-body arm-colors"><ul class="arm-list ctargets">${T.map(([id, label]) => id ? `<li><button type="button" class="arm-row" data-c="${id}" aria-pressed="${id === cur[0]}"><span>${esc(label)}</span></button></li>` : `<li class="arm-sub">${esc(label)}</li>`).join('')}</ul>
            <div class="cpick"><p class="small dim cnote">${esc(cur[4] || '')}</p></div></div>`;
        }
        const f = document.activeElement, had = menu.contains(f) && navSig(f), from = had && f.dataset.a === 'back' && prev;   // (the focus stays on the same tile, or the row just come back to)
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
        if (k === 'specials' && keyFor && prev === 'specials') menu.querySelector('.sp-pick')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });   // a tile's key boxes, in sight
        if (from) menu.querySelector(`[data-p="${from}"]`)?.focus({ preventScroll: true });
        else if (had) refocus(menu, had, items(menu));
      };
      /* what can be colored now (a target shows only when it is in use) */
      function colorTargets() {
        const D = profile.duck, C = profile.card, N = profile.nameStyle, hd = D.hat && hatById(D.hat.id), out = [];
        const st = styleById(D.style);
        if (st.colors) for (const [key, label, def] of st.colors) out.push([key, label, D.metal !== 'none' || D.image ? '' : D[key] || def, c => { D[key] = c; D.metal = 'none'; D.image = null; }, 'Picking a color takes off a metal or a picture.']);
        else if (!st.fixed) out.push(['duck', 'Duck', D.metal !== 'none' || D.image ? '' : D.color, c => { D.color = c; D.metal = 'none'; D.image = null; }, 'Picking a color takes off a metal or a picture.']);
        if (D.pattern !== 'none' && D.metal === 'none' && !D.image) out.push(['dpat', 'Duck pattern', D.patternColor, c => { D.patternColor = c; }, 'The color of the pattern on your duck.']);
        for (const [key, label, def] of (hd && hd.colors) || []) out.push(['hat-' + key, `${hd.name}: ${label}`, D.hat[key] || def, c => { D.hat = { ...D.hat, [key]: c }; }, '']);
        const bd = beakById(D.beak);
        for (const [key, label, def] of bd.colors || []) out.push([key, label, D[key] || def, c => { D[key] = c; }, '']);
        const od = D.outfit && outfitById(D.outfit.id);
        for (const [key, label, def] of (od && od.colors) || []) out.push(['outfit-' + key, `${od.name}: ${label}`, D.outfit[key] || def, c => { D.outfit = { ...D.outfit, [key]: c }; }, '']);
        const fd = D.face && faceById(D.face.id);
        for (const [key, label, def] of (fd && fd.colors) || []) out.push(['face-' + key, `${fd.name}: ${label}`, D.face[key] || def, c => { D.face = { ...D.face, [key]: c }; }, '']);
        out.push(['card', 'Card', C.color, c => { C.color = c; }, 'The color behind your card\'s pattern.']);
        if (C.pattern !== 'none' && !C.image) out.push(['cpat', 'Card pattern', C.patternColor, c => { C.patternColor = c; }, 'The pattern\'s color (for a hat pattern, the hat\'s).']);
        out.push(['name', 'Name', N.color, c => { N.color = c; N.rainbow = false; }, 'Plain fits light and dark.']);
        /* the specials on your keys that take colors, under their own heading (the Long jump takes none) */
        const sps = keysOf(D).filter(id => id && specialById(id).colors);
        if (sps.length) out.push(['', 'Specials']);
        for (const id of sps) {
          const sp = specialById(id), now = colorsOf(D, id);
          sp.colors.forEach(([key, label], j) => out.push([`sp-${id}-${key}`, `${sp.name}: ${label}`, now[j], c => { D.spc = { ...(D.spc || {}), [id]: { ...((D.spc || {})[id] || {}), [key]: c } }; }, id === 'double' ? 'The cloud stays see-through.' : '']));
        }
        return out;
      }
      menu.addEventListener('click', e => {
        const D = profile.duck, C = profile.card, N = profile.nameStyle;
        const row = e.target.closest('.arm-row[data-p]'); if (row) { show(row.dataset.p); return; }
        const tgt = e.target.closest('.arm-row[data-c]'); if (tgt) { lastColor = tgt.dataset.c; show('colors', true); stage(); const sp = colorSpecial(); if (sp && sp.kind !== 'effect') preview(sp.id); return; }
        const a = e.target.closest('[data-a]');
        if (a) {
          if (a.dataset.a === 'back') { keyFor = null; show(null); return; }
          if (a.dataset.a === 'preview') { preview(a.dataset.v); return; }
          if (a.dataset.a === 'setkey') { const keys = keysOf(D), i = +a.dataset.i, was = keys.indexOf(keyFor); if (was >= 0) keys[was] = null; keys[i] = keyFor; D.keys = keys; keyFor = null; changed(); return; }   // (one key per special: it moves)
          if (a.dataset.a === 'unkey') { const keys = keysOf(D); keys[+a.dataset.i] = null; D.keys = keys; changed(); return; }
          if (a.dataset.a === 'nopic') { D.image = null; changed(); return; }
          if (a.dataset.a === 'nocard') { C.image = null; changed(); return; }
          if (a.dataset.a === 'plainname') { N.color = ''; N.rainbow = false; changed(); return; }
          if (a.dataset.a === 'matchstyle') { const st = styleById(D.style); if (st.match) D.beak = st.match; if (st.eyes) D.eyes = st.eyes; for (const [c, , v] of st.colors || []) D[c] = v; if (st.colors) { D.metal = 'none'; D.image = null; } changed(); return; }
        }
        const t = e.target.closest('[data-g]'); if (!t) return;
        const v = t.dataset.v;
        ({
          hat: () => { D.hat = v === 'none' ? null : { ...(D.hat && D.hat.id === v ? D.hat : {}), id: v }; },
          hmetal: () => { D.hat = { ...D.hat, metal: v }; },
          face: () => { D.face = v === 'none' ? null : { id: v }; },
          eyes: () => { D.eyes = v; },
          beak: () => { D.beak = v; },
          outfit: () => { D.outfit = v === 'none' ? null : { ...(D.outfit && D.outfit.id === v ? D.outfit : {}), id: v }; },
          style: () => { D.style = v; },   // (nothing else changes; Match the … look brings in the rest)
          build: () => { D.build = +v; },
          size: () => { D.size = +v; },
          special: () => { keyFor = keyFor === v ? null : v; },   // its key boxes open (or shut) under it
          skin: () => { D.image = null; if (v.startsWith('m:')) D.metal = v.slice(2); else { D.metal = 'none'; D.pattern = v.slice(2); } },
          nfont: () => { N.font = v; },
          cpat: () => { C.pattern = v; C.image = null; },
          clay: () => { C.layout = v; },
          csize: () => { C.size = v; },
        })[t.dataset.g]();
        changed();
      });
      /* on a phone: hold a tile for its explanation */
      onMenu(menu, (x, y, e) => {
        const t = e.target.closest && e.target.closest('[data-tip]'); if (!t) return;
        document.querySelectorAll('.tipbox').forEach(b => b.remove());
        const box = el(`<div class="tipbox" role="tooltip">${esc(t.dataset.tip)}</div>`); document.body.append(box);
        box.style.left = Math.max(8, Math.min(innerWidth - box.offsetWidth - 8, x - box.offsetWidth / 2)) + 'px';
        box.style.top = Math.max(8, y - box.offsetHeight - 14) + 'px';
        setTimeout(() => box.remove(), 2800);
      });
      duckBox.addEventListener('click', () => { const sp = lastPage === 'specials' ? specialById(keyFor) : colorSpecial(); if (sp) preview(sp.id); });
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
