/* ---------- what this device remembers ----------
   The guest profile: the last name used (also in a cookie, so it carries into every room), the duck, the player card, how
   the name looks, the notes, the settings, the jumps and the stats. Everything else is in localStorage under one key. A
   signed-in profile (later) will keep the same object online. */
import { DUCK_DEFAULT } from './duck.js';

const KEY = 'jmg-profile-1';
export const SETTINGS_DEFAULT = {
  v: 2, theme: 'dark', font: 'fredoka', textSize: 100, uiSize: 100, dyslexic: false, colorblind: false,
  motion: !matchMedia('(prefers-reduced-motion: reduce)').matches, mouseMove: false, multipleChoice: false, touch: 'stick', jumpsSci: false, jumpsHidden: false, chatSide: 'left',
  shapes: 'moving', sound: 100, sfx: 100, settingsTab: 'general', net: '0', netAsked: false, hidePrivate: false,
};
export const PROFILE_DEFAULT = {
  name: 'Player 1', duck: { ...DUCK_DEFAULT },
  card: { kind: 'color', color: '#2fa4ff', pattern: 'none', patternColor: '#ffffff', layout: 'tiled', size: 'm', image: null },
  nameStyle: { font: 'fredoka', color: '', rainbow: false },   // color '' = the theme's text color
  notes: [], jumps: 0, stats: {}, settings: { ...SETTINGS_DEFAULT },
};

/* all-time stats, one set per game mode (test rooms don't count, except their jumps); others see them too, so a
   shared copy keeps only these numbers */
export const STAT_MODES = [['aod', 'Agree or Disagree'], ['wyr', 'Would You Rather']];
export function cleanStats(o) {
  const out = {}, n = v => Math.max(0, Math.min(1e9, Math.floor(+v || 0)));
  for (const [m] of STAT_MODES) {
    const x = (o && o[m]) || {};
    out[m] = { games: n(x.games), rounds: n(x.rounds), answers: n(x.answers), jumps: n(x.jumps), counts: Array.from({ length: 7 }, (_, i) => n((x.counts || [])[i])), majority: n(x.majority), minority: n(x.minority) };
  }
  return out;
}

/* a name: letters, numbers, dashes and underscores, 1 to 20 of them */
export const NAME_OK = /^[\p{L}\p{N}_\-]{1,20}$/u;
export const cleanName = s => String(s || '').replace(/[^\p{L}\p{N}_\-]/gu, '').slice(0, 20);

const cookie = {
  get(k) { const m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; },
  set(k, v) { document.cookie = `${k}=${encodeURIComponent(v)}; max-age=31536000; path=/; SameSite=Lax`; },
};

function load() {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { p = {}; }
  const out = normalize(p);
  const c = cookie.get('jmg-name'); if (c && NAME_OK.test(c)) out.name = c;
  if (!NAME_OK.test(out.name)) out.name = 'Player 1';
  return out;
}
/* a saved profile (this device's or the account's) with every part filled in */
function normalize(p) {
  const out = { ...structuredClone(PROFILE_DEFAULT), ...p };
  out.settings = { ...SETTINGS_DEFAULT, ...(p.settings || {}) };
  if ((p.settings || {}).v !== 2) {   // settings saved before DuckFriends: dark becomes the default; clicks became jumps
    const o = p.settings || {};
    Object.assign(out.settings, { v: 2, theme: 'dark', jumpsSci: !!o.clicksSci, jumpsHidden: !!o.clicksHidden });
    delete out.settings.clicksSci; delete out.settings.clicksHidden; delete out.clicks;
  }
  out.duck = { ...DUCK_DEFAULT, ...(p.duck || {}) };
  delete out.duck.muscle;   // (muscles were tried and taken out)
  if (out.duck.hat && out.duck.hat.id === 'robot') { out.duck.face = { id: 'box' }; out.duck.hat = null; }   // the cardboard box became a Face item
  out.card = { ...PROFILE_DEFAULT.card, ...(p.card || {}) };
  out.nameStyle = { ...PROFILE_DEFAULT.nameStyle, ...(p.nameStyle || {}) };
  if (out.nameStyle.color === '#1c1c28') out.nameStyle.color = '';   // the old default, unreadable in dark mode
  if (!NAME_OK.test(out.name)) out.name = 'Player 1';
  out.stats = { ...cleanStats(p.stats), lastGame: String((p.stats || {}).lastGame || '') };   // lastGame: the game last counted
  return out;
}

export const profile = load();
export const onSave = new Set();   // others keeping a copy (the signed-in account, online)
let saveT = null;
const write = () => {
  clearTimeout(saveT); saveT = null;
  try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (e) { /* full or blocked: the game goes on */ }
  cookie.set('jmg-name', profile.name); onSave.forEach(f => f());
};
export function save(now) {
  clearTimeout(saveT);
  profile.t = Date.now();   // when it last changed: the newer copy wins between devices
  if (now) write(); else saveT = setTimeout(write, 250);
}
addEventListener('pagehide', () => { if (saveT) write(); });

/* the account's copy comes in: it replaces this device's (keeping when it changed) */
export function replaceProfile(p) {
  const n = normalize(p);
  for (const k of Object.keys(profile)) if (!(k in n)) delete profile[k];
  Object.assign(profile, n);
  try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (e) { /* the game goes on */ }
  cookie.set('jmg-name', profile.name);
}
