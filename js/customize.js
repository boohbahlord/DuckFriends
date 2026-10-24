/* ---------- Customize: your duck, your player card, your name ----------
   One window with three tabs and your card at the top showing every change at once. Changes are kept on this device
   and sent to the room you are in. */
import { profile, save, NAME_OK, cleanName } from './store.js';
import { openWindow, esc, toast } from './ui.js';
import { DUCK_COLORS, DUCK_PATTERNS, DUCK_METALS, pictureToSquare } from './duck.js';
import { CARD_PATTERNS, cardHTML } from './card.js';
import { FONTS } from './name.js';
import { colorField } from './color.js';
import { activeRoom } from './net.js';

const TABS = [['duck', 'Duck'], ['card', 'Card'], ['name', 'Name']];
let lastTab = 'duck';

/* sends your look to the room you are in */
export function shareLook() {
  const r = activeRoom(); if (!r) return;
  r.send({ t: 'look', look: { name: profile.name, duck: { ...profile.duck }, card: { ...profile.card }, nameStyle: { ...profile.nameStyle } } });
}
/* a new name: letters, numbers, dashes and underscores */
export function setName(raw) {
  const n = cleanName(raw);
  if (!NAME_OK.test(n)) return false;
  profile.name = n; save(true); shareLook(); return true;
}

const tiles = (group, opts, cur) => `<div class="row">${opts.map(([v, label]) =>
  `<button type="button" class="tile" data-g="${group}" data-v="${esc(v)}" aria-pressed="${v === cur}">${esc(label)}</button>`).join('')}</div>`;

export function openCustomize(tab = lastTab) {
  return openWindow(`<h2>Customize</h2><div class="cz-preview"></div>
    <div class="tabs" role="tablist">${TABS.map(([k, n]) => `<button type="button" class="tab" data-tab="${k}">${n}</button>`).join('')}</div>
    <div class="cz-page"></div>`, {
    cls: 'win-settings win-cz',
    onOpen(w) {
      const prev = w.querySelector('.cz-preview'), page = w.querySelector('.cz-page');
      const me = () => ({ id: 'me', name: profile.name, duck: profile.duck, card: profile.card, nameStyle: profile.nameStyle });
      const paint = () => { prev.innerHTML = cardHTML(me(), { size: 64 }); };
      const changed = () => { save(); paint(); shareLook(); };
      const upload = (label, onPic) => {
        const b = document.createElement('label'); b.className = 'btn ghost upload';
        b.innerHTML = `${esc(label)}<input type="file" accept="image/*" hidden>`;
        b.querySelector('input').onchange = async e => {
          try { onPic(await pictureToSquare(e.target.files[0], 160)); changed(); show(lastTab); } catch (err) { toast(err.message); }
        };
        return b;
      };
      const section = (title, ...nodes) => { const s = document.createElement('div'); s.className = 'sect'; s.innerHTML = `<h3>${esc(title)}</h3>`; nodes.forEach(n => s.append(typeof n === 'string' ? document.createRange().createContextualFragment(n) : n)); page.append(s); return s; };

      const show = k => {
        lastTab = k; page.replaceChildren();
        w.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === k));
        const D = profile.duck, C = profile.card, N = profile.nameStyle;
        if (k === 'duck') {
          /* a metal replaces the color and the pattern, so with a metal on they show nothing chosen */
          const metal = D.metal !== 'none';
          section('Color', colorField(metal ? '' : D.color, c => { const was = D.metal; D.color = c; D.metal = 'none'; D.image = null; changed(); if (was !== 'none') show('duck'); }, { swatches: DUCK_COLORS.map(x => x[1]) })).classList.toggle('muted', metal);
          section('Pattern', tiles('dpat', DUCK_PATTERNS, metal ? '' : D.pattern), colorField(D.patternColor, c => { D.patternColor = c; changed(); })).classList.toggle('muted', metal);
          section('Metal', tiles('dmetal', DUCK_METALS, D.metal));
          const pic = section('Picture', upload(D.image ? 'Change picture' : 'Upload a square picture', d => { D.image = d; }));
          if (D.image) { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn ghost'; x.textContent = 'Back to the duck'; x.onclick = () => { D.image = null; changed(); show('duck'); }; pic.append(' ', x); }
        } else if (k === 'card') {
          section('Color', colorField(C.color, c => { C.color = c; changed(); }));
          section('Pattern', tiles('cpat', CARD_PATTERNS, C.pattern), colorField(C.patternColor, c => { C.patternColor = c; changed(); }));
          const pic = section('Picture', upload(C.image ? 'Change picture' : 'Upload a picture', d => { C.image = d; }));
          if (C.image) { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn ghost'; x.textContent = 'Remove picture'; x.onclick = () => { C.image = null; changed(); show('card'); }; pic.append(' ', x); }
        } else {
          const nm = section('Name', `<div class="row"><input class="cz-name" maxlength="20" value="${esc(profile.name)}" spellcheck="false" aria-label="Name"><span class="small dim">Letters, numbers, - and _</span></div>`);
          const inp = nm.querySelector('input');
          inp.oninput = () => { const c = cleanName(inp.value); if (c !== inp.value) { inp.value = c; inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 300); } if (c && setName(c)) paint(); };
          section('Font', `<div class="tiles-font">${FONTS.map(f => `<button type="button" class="tile" data-g="nfont" data-v="${f.id}" aria-pressed="${f.id === N.font}" style="font-family:${esc(f.css)}">${esc(f.name)}</button>`).join('')}</div>`);
          section('Color', `<div class="row"><button type="button" class="tile cz-auto" aria-pressed="${!N.color && !N.rainbow}" data-tip="Dark letters on light, light letters on dark.">Plain</button>
            <label class="check"><input type="checkbox" class="cz-rainbow"${N.rainbow ? ' checked' : ''}>Multicolored letters</label></div>`,
            colorField(N.color, c => { N.color = c; N.rainbow = false; page.querySelector('.cz-rainbow').checked = false; page.querySelector('.cz-auto').setAttribute('aria-pressed', 'false'); changed(); }));
          page.querySelector('.cz-rainbow').onchange = e => { N.rainbow = e.target.checked; if (N.rainbow) page.querySelector('.cz-auto').setAttribute('aria-pressed', 'false'); changed(); };
          page.querySelector('.cz-auto').onclick = () => { N.color = ''; N.rainbow = false; changed(); show('name'); };
        }
      };
      page.addEventListener('click', e => {
        const t = e.target.closest('.tile[data-g]'); if (!t) return;
        const v = t.dataset.v, D = profile.duck;
        ({ dpat: () => { D.pattern = v; D.metal = 'none'; D.image = null; setTimeout(() => show('duck')); }, dmetal: () => { D.metal = v; D.image = null; setTimeout(() => show('duck')); },
          cpat: () => { profile.card.pattern = v; }, nfont: () => { profile.nameStyle.font = v; } })[t.dataset.g]();
        page.querySelectorAll(`.tile[data-g="${t.dataset.g}"]`).forEach(b => b.setAttribute('aria-pressed', b === t));
        changed();
      });
      w.querySelector('.tabs').onclick = e => { const t = e.target.closest('.tab'); if (t) show(t.dataset.tab); };
      paint(); show(tab);
    },
  });
}
