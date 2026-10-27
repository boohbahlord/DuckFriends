/* ---------- text chat (T) and the command line (Shift+T) ----------
   A slide at the side chosen in Settings (left, bottom, right or hidden). Closed, it is a round button: "ABC" on white for
   the chat. Open, the symbol at its bottom left switches between the chat and the command line (a green "$" on black).

   Chat: @name pings that player (a soft sound and a "!" on the chat button); \@name sends a private message; \help lists
   these. Suggestions show once something is typed (\togglesuggest turns them off); Tab completes (never leaving the
   page), the arrow keys move through them. Mutes: \mute bubble ping text on @name … (until you leave the room),
   \permmute … (kept on this device), \show mute | permmute | players. A message over 250 characters folds under an
   arrow; each new message's bubble floats over its duck on the board.

   Command line: a small bash (shell.js, bash.js): files, pipes and the other operators, variables, loops, text tools,
   stats, send, sudo and groups, forgame; and the customization, e.g. custom username font "times new roman". Words are
   split by spaces, so a choice with a space goes in quotes; Tab adds the quotes. ↑ and ↓ bring back earlier commands,
   Ctrl+R searches them, Ctrl+C stops a running command, Ctrl+L clears. A message sent from the command line shows the
   command in small print over its output; a sent file shows only its name to anyone who may not open it (only sudo,
   unless chmod let its group or everyone). */
import { el, esc, typing, windowOpen, setHTML, confirmBox } from './ui.js';
import { profile, save, cleanName, NAME_OK } from './store.js';
import { activeRoom } from './net.js';
import { boardPhases, denied, canOpen, gameMuted, slowMs } from './rules.js';
import { shellRun, shellSuggest, shellHistory } from './shell.js';
import { paint, isHelpName } from './helppages.js';
import { nameHTML, FONTS, findFont } from './name.js';
import { DUCK_PATTERNS, DUCK_METALS, BUILDS, SIZES } from './duck.js';
import { HATS, hatById } from './hats.js';
import { FACES, faceById } from './faces.js';
import { EYES } from './eyes.js';
import { BEAKS } from './beaks.js';
import { STYLES, styleById } from './styles.js';
import { OUTFITS, outfitById } from './outfits.js';
import { SPECIALS, KEYS, keysOf as keysOfDuck } from './specials.js';
import { CARD_PATTERNS, CARD_LAYOUTS, CARD_SIZES } from './card.js';
import { normHex } from './color.js';
import { shareLook } from './customize.js';
import { applySettings } from './settings.js';
import { sfx } from './sound.js';
import { hooks } from './hooks.js';

/* ---------- the command line's commands ---------- */
const COLORS = { red: '#ef3b3b', orange: '#ff8c2b', yellow: '#ffd23f', green: '#37d421', teal: '#14c6b4', blue: '#2fa4ff',
  purple: '#9b5de5', pink: '#ff7eb6', brown: '#8b5a2b', gray: '#9aa0aa', black: '#1c1c28', white: '#ffffff' };
const colorOf = v => COLORS[String(v).toLowerCase()] || normHex(v);
const COLOR_HINT = [...Object.keys(COLORS), '#hex'];
const CMD_MAX = 2000;   // the command line's longest line
const keysOf = list => list.map(x => x[0]);
/* the silly commands: each names players with @; the host can turn them off (Game options → Additional settings) */
const fun = (kind, count, what) => ({ info: what, at: count, fun: true, kind });
const TREE = {
  help: { info: 'Lists the commands.' },
  clear: { info: 'Clears this window.' },
  lightning: fun('lightning', 1, 'Strikes a player with lightning: lightning @name'),
  love: fun('love', 2, 'Two players float up in a heart: love @name @name'),
  kill: fun('kill', 1, 'A player plays dead until they move: kill @name'),
  hotdog: fun('hotdog', 1, 'A hotdog hangs around a player for a while: hotdog @name'),
  fire: fun('fire', 1, 'Sets a duck on fire; it stays burnt for a few seconds: fire @name'),
  reset: { info: 'Puts your duck somewhere random: reset duck (inside your column once you have voted).', kids: { duck: { exec: () => (hooks.resetDuck ? hooks.resetDuck() : '✗ That works on the board.') } } },
  custom: {
    info: 'Customize your duck, card or name.',
    kids: {
      avatar: { kids: {
        color: { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!c) return bad(v); Object.assign(profile.duck, { color: c, metal: 'none', image: null }); return `Duck color: ${c}`; } },
        pattern: { vals: keysOf(DUCK_PATTERNS), run: v => pick(keysOf(DUCK_PATTERNS), v, x => Object.assign(profile.duck, { pattern: x, metal: 'none', image: null }), 'Duck pattern') },
        'pattern color': { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!c) return bad(v); profile.duck.patternColor = c; return `Duck pattern color: ${c}`; } },
        metal: { vals: keysOf(DUCK_METALS), run: v => pick(keysOf(DUCK_METALS), v, x => Object.assign(profile.duck, { metal: x, image: null }), 'Duck metal') },
        hat: { vals: ['none', ...HATS.map(h => h.id)], run: v => { const k = String(v).toLowerCase(); if (k === 'none') { profile.duck.hat = null; return 'Hat: none'; } const h = hatById(k); if (!h) return bad(v); profile.duck.hat = { ...(profile.duck.hat && profile.duck.hat.id === k ? profile.duck.hat : {}), id: k }; return `Hat: ${h.name}`; } },
        'hat color': { vals: COLOR_HINT, run: v => { const c = colorOf(v), h = profile.duck.hat; if (!h) return '✗ No hat on. custom avatar hat …'; if (!c) return bad(v); profile.duck.hat = { ...h, c1: c }; return `Hat color: ${c}`; } },
        'hat color 2': { vals: COLOR_HINT, run: v => { const c = colorOf(v), h = profile.duck.hat; if (!h) return '✗ No hat on. custom avatar hat …'; if (!c) return bad(v); profile.duck.hat = { ...h, c2: c }; return `Hat second color: ${c}`; } },
        'hat metal': { vals: keysOf(DUCK_METALS.slice(1)), run: v => { const h = profile.duck.hat; if (!h || !(hatById(h.id) || {}).metal) return '✗ Only the crown takes a metal.'; return pick(keysOf(DUCK_METALS.slice(1)), v, x => { profile.duck.hat = { ...h, metal: x }; }, 'Hat metal'); } },
        ketchup: { vals: ['on', 'off'], run: v => { const h = profile.duck.hat; if (!h || h.id !== 'hotdog') return '✗ Ketchup goes on the hotdog hat.'; if (!/^(on|off)$/i.test(v)) return bad(v); profile.duck.hat = { ...h, ketchup: /^on$/i.test(v) }; return `Ketchup: ${/^on$/i.test(v) ? 'on' : 'off'}`; } },
        face: { vals: ['none', ...FACES.map(f => f.id)], run: v => { const k = String(v).toLowerCase(); if (k === 'none') { profile.duck.face = null; return 'Face: none'; } const f = faceById(k); if (!f) return bad(v); profile.duck.face = { ...(profile.duck.face && profile.duck.face.id === k ? profile.duck.face : {}), id: k }; return `Face: ${f.name}`; } },
        'face color': { vals: COLOR_HINT, run: v => { const c = colorOf(v), f = profile.duck.face; if (!f) return '✗ Nothing on the face. custom avatar face …'; if (!c) return bad(v); profile.duck.face = { ...f, c1: c }; return `Face color: ${c}`; } },
        eyes: { vals: EYES.map(x => x.id), run: v => pick(EYES.map(x => x.id), v, x => { profile.duck.eyes = x; }, 'Eyes') },
        beak: { vals: BEAKS.map(x => x.id), run: v => pick(BEAKS.map(x => x.id), v, x => { profile.duck.beak = x; }, 'Beak') },
        'beak color': { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!/^(blocks|geo)$/.test(profile.duck.beak)) return '✗ Only the block beak and the flat beak take a color.'; if (!c) return bad(v); profile.duck.beakColor = c; return `Beak color: ${c}`; } },
        'beak color 2': { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!/^(blocks|geo)$/.test(profile.duck.beak)) return '✗ Only the block beak and the flat beak take a color.'; if (!c) return bad(v); profile.duck.beakColor2 = c; return `Beak shade: ${c}`; } },
        outfit: { vals: ['none', ...OUTFITS.map(x => x.id)], run: v => { const k = String(v).toLowerCase().trim(), x = OUTFITS.find(y => y.id === k); if (k !== 'none' && !x) return bad(v); profile.duck.outfit = x ? { id: x.id } : null; return `Outfit: ${x ? x.name : 'none'}`; } },
        'outfit color': { vals: COLOR_HINT, run: v => part('outfit', outfitById, 0, v, 'outfit') },
        'outfit color 2': { vals: COLOR_HINT, run: v => part('outfit', outfitById, 1, v, 'outfit') },
        style: { vals: STYLES.map(x => x.id), run: v => pick(STYLES.map(x => x.id), v, x => { profile.duck.style = x; }, 'Style') },
        'style color 2': { vals: COLOR_HINT, run: v => styleTone('color2', v) },
        'style color 3': { vals: COLOR_HINT, run: v => styleTone('color3', v) },
        build: { vals: keysOf(BUILDS.map(([v, n]) => [n.toLowerCase(), v])), run: v => body(BUILDS, 'build', v, 'Build') },
        size: { vals: keysOf(SIZES.map(([v, n]) => [n.toLowerCase(), v])), run: v => body(SIZES, 'size', v, 'Size') },
        special: { vals: ['none', ...SPECIALS.filter(x => !x.off).map(x => x.id)], run: v => {   // a special onto a number key: "trombone 3" (no number: the first free key); none takes them all off
          const [k, n] = String(v).toLowerCase().trim().split(/\s+/), x = SPECIALS.find(y => y.id === k && !y.off), keys = profile.duck.keys = keysOfDuck(profile.duck);
          if (k === 'none') { keys.fill(null); return 'Specials: none'; }
          if (!x || (n !== undefined && !KEYS.includes(n))) return bad(v);
          const was = keys.indexOf(x.id), i = n !== undefined ? KEYS.indexOf(n) : was >= 0 ? was : Math.max(0, keys.indexOf(null));
          if (was >= 0) keys[was] = null; keys[i] = x.id;
          return `Special: ${x.name} on key ${KEYS[i]}`;
        } },
      } },
      card: { kids: {
        color: { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!c) return bad(v); profile.card.color = c; return `Card color: ${c}`; } },
        pattern: { vals: keysOf(CARD_PATTERNS), run: v => pick(keysOf(CARD_PATTERNS), v, x => { profile.card.pattern = x; }, 'Card pattern') },
        'pattern color': { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!c) return bad(v); profile.card.patternColor = c; return `Card pattern color: ${c}`; } },
        layout: { vals: keysOf(CARD_LAYOUTS), run: v => pick(keysOf(CARD_LAYOUTS), v, x => { profile.card.layout = x; }, 'Card pattern layout') },
        size: { vals: CARD_SIZES.map(([, n]) => n.toLowerCase()), run: v => { const f = CARD_SIZES.find(([, n]) => n.toLowerCase() === String(v).toLowerCase().trim()); if (!f) return bad(v); profile.card.size = f[0]; return `Card pattern size: ${f[1]}`; } },
      } },
      username: { kids: {
        name: { vals: ['<name>'], run: v => { const n = cleanName(v); if (!NAME_OK.test(n)) return '✗ A name: letters, numbers, - and _.'; profile.name = n; return `Name: ${n}`; } },
        font: { vals: FONTS.map(f => f.name.toLowerCase()), run: v => { const f = findFont(v); if (!f) return bad(v); profile.nameStyle.font = f.id; return `Name font: ${f.name}`; } },
        'font color': { vals: ['plain', ...COLOR_HINT], run: v => {
          if (/^plain$/i.test(v)) { Object.assign(profile.nameStyle, { color: '', rainbow: false }); return 'Name color: plain'; }
          const c = colorOf(v); if (!c) return bad(v); Object.assign(profile.nameStyle, { color: c, rainbow: false }); return `Name color: ${c}`;
        } },
        rainbow: { vals: ['on', 'off'], run: v => { if (!/^(on|off)$/i.test(v)) return bad(v); profile.nameStyle.rainbow = /^on$/i.test(v); return `Multicolored letters: ${profile.nameStyle.rainbow ? 'on' : 'off'}`; } },
      } },
    },
  },
};
const bad = v => `✗ ${v || 'Nothing'} isn't one of the choices. Tab shows them.`;
/* build and size go by name ("chubby", "a bit big") */
function body(list, key, v, label) { const f = list.find(([, n]) => n.toLowerCase() === String(v).toLowerCase().trim()); if (!f) return bad(v); profile.duck[key] = f[0]; return `${label}: ${f[1]}`; }
/* an outfit's own colors (c1, c2), by their place in its list */
function part(key, byId, n, v, what) {
  const on = profile.duck[key], d = on && byId(on.id), col = d && (d.colors || [])[n], c = colorOf(v);
  if (!on) return `✗ No ${what} on. custom avatar ${what} …`;
  if (!col) return `✗ ${d.name} has no ${n ? "second " : ""}color to change.`;
  if (!c) return bad(v); profile.duck[key] = { ...on, [col[0]]: c }; return `${d.name}: ${col[1]}: ${c}`;
}
/* a style's second or third color (its first is the duck's color) */
function styleTone(key, v) {
  const st = styleById(profile.duck.style), col = (st.colors || []).find(x => x[0] === key), c = colorOf(v);
  if (!col) return `✗ The ${st.name.toLowerCase()} has no color like that.`;
  if (!c) return bad(v); Object.assign(profile.duck, { [key]: c, metal: 'none', image: null }); return `${col[1]}: ${c}`;
}
function pick(list, v, set, label) { const x = list.find(k => k === String(v).toLowerCase()); if (!x) return bad(v); set(x); return `${label}: ${x}`; }

/* splits a line into words ("two words" in quotes stay one); last = the word being typed, from = where it starts */
function words(line) {
  const out = []; let cur = '', q = false, any = false, from = 0;
  [...line].forEach((ch, i) => {
    if (!any && !/\s/.test(ch)) from = i;
    if (ch === '"') { q = !q; any = true; return; }
    if (/\s/.test(ch) && !q) { if (any) out.push(cur); cur = ''; any = false; from = i + 1; return; }
    cur += ch; any = true;
  });
  return { done: out, last: cur, from: any ? from : line.length };
}
const quote = w => /\s/.test(w) ? `"${w}"` : w;

/* what fits next on the command line */
/* a name as it is typed after @: without its spaces ("Player 1" is @Player1) */
export const tag = n => String(n || '').replace(/\s+/g, '');
const npcTag = (s, t) => ['justin', 'annabelle', 'bubbles', 'oreo', 'opal'].find(n => n === tag(t).toLowerCase() && s.hang.npc[n]);   // Duck Cabin's characters
const byTag = (s, t) => s.seat.find(i => tag(s.players[i].name).toLowerCase() === tag(t).toLowerCase());
const funOn = () => { const r = activeRoom(); return !r || !!r.state.options.fun; };
const names = () => { const r = activeRoom(); return r ? r.state.seat.map(id => '@' + tag(r.state.players[id].name)) : []; };
function cmdSuggest(line) {
  const { done, last, from } = words(line);
  let node = { kids: TREE }, given = 0;
  for (const w of done) {
    if (node.kids) { node = node.kids[w.toLowerCase()]; if (!node) return []; }
    else if (node.at && given < node.at - 1) given++;
    else return [];
  }
  const opts = node.kids ? Object.keys(node.kids).filter(k => !(node.kids[k].fun && !funOn())) : node.at ? names() : node.vals ? node.vals.filter(v => !v.startsWith('<') && v !== '#hex') : [];
  const p = last.toLowerCase();
  return opts.filter(o => o.toLowerCase().startsWith(p) && o.toLowerCase() !== p).map(o => ({ label: quote(o), apply: () => line.slice(0, from) + quote(o) + ' ' }));
}
function runCommand(line) {
  const { done, last } = words(line.trim()); const w = last ? [...done, last] : done;
  if (!w.length) return [];
  const top = w[0].toLowerCase();
  if (top === 'help') return ['Commands:', ...Object.entries(TREE).filter(([, n]) => !(n.fun && !funOn())).map(([k, n]) => `  ${k} · ${n.info}`), 'custom avatar · card · username, e.g. custom username font "times new roman"'];
  if (top === 'clear') return null;
  if (TREE[top] && TREE[top].fun) return [runFun(TREE[top], w.slice(1))];
  let node = { kids: TREE }, path = [];
  for (let i = 0; i < w.length; i++) {
    if (node.kids) {
      const next = node.kids[w[i].toLowerCase()];
      if (!next) return [`✗ ${w[i]}? Try: ${Object.keys(node.kids).map(quote).join(', ')}`];
      node = next; path.push(w[i].toLowerCase()); continue;
    }
    const msg = node.run(w.slice(i).join(' '));
    if (!msg.startsWith('✗')) { save(); shareLook(); applySettings(); }
    return [msg];
  }
  if (node.exec) return [node.exec()];
  if (node.kids) return [`${path.join(' ')}: ${Object.keys(node.kids).map(quote).join(', ')}`];
  return [`${path.join(' ')}: ${(node.vals || []).map(quote).join(', ')}`];
}

/* a silly command: needs a room, the host's yes, the board, and its players by @name */
function runFun(node, args) {
  const r = activeRoom();
  if (!r) return '✗ That works in a game.';
  const s = r.state;
  if (!s.options.fun) return '✗ The host turned the silly commands off.';
  if (denied(s, r.me, 'nofun')) return '✗ Your group can\'t use the silly commands.';
  if (!boardPhases(s).includes(s.phase)) return '✗ That works on the board.';
  const who = [];
  for (const a of args) {
    const id = byTag(s, a.replace(/^@/, '')), npc = !id && (s.hang || {}).npc && npcTag(s, a.replace(/^@/, ''));
    if (npc === 'justin' && node.kind === 'kill') { r.send({ t: 'hang', k: 'npc', who: 'justin', do: 'kill' }); return '✖ Justin plays dead'; }   // (Duck Cabin's Justin: kill works on him)
    if (npc) return npc === 'justin' ? `✗ ${node.kind} doesn't work on Justin.` : '✗ The cats don\'t listen to commands.';
    if (!id && s.justin && s.options.justin && tag(a.replace(/^@/, '')).toLowerCase() === 'justin') {   // (the Justin option: on the boards)
      if (node.kind !== 'kill') return `✗ ${node.kind} doesn't work on Justin.`;
      r.send({ t: 'fx', kind: 'kill', who: [], justin: 1 }); return '✖ Justin plays dead';
    }
    if (!id) return `✗ No player named ${a.replace(/^@/, '')}.`;
    who.push(id);
  }
  if (who.length < node.at) return `✗ ${node.info}`;
  r.send({ t: 'fx', kind: node.kind, who: who.slice(0, node.at) });
  const nm = who.slice(0, node.at).map(id => s.players[id].name).join(' and ');
  return { lightning: `⚡ ${nm}`, love: `♥ ${nm}`, kill: `✖ ${nm} plays dead`, hotdog: `🌭 for ${nm}`, fire: `🔥 ${nm}` }[node.kind];
}

/* ---------- the chat's suggestions ---------- */
/* chat commands: nothing shows before typing; typing narrows them (\\ shows every \\ command); names complete
   after @ and after each \\…@ */
const CHAT_CMDS = ['\\help', '\\@', '\\mute', '\\permmute', '\\show', '\\togglesuggest'];
const MUTE_WORDS = ['bubble', 'ping', 'text', 'all', 'on', 'off', '-f'], SHOW_WORDS = ['mute', 'permmute', 'players'];
function chatSuggest(line, s, me) {
  if (profile.settings.chatSuggest === false) return [];   // \togglesuggest
  const mw = line.match(/^\\(mute|permmute|show)\s+(?:[^@]*\s)?([a-z-]*)$/i);   // \mute bubble ping on …
  if (mw) {
    const opts = mw[1].toLowerCase() === 'show' ? SHOW_WORDS : MUTE_WORDS.filter(w => w !== '-f' || mw[1].toLowerCase() === 'permmute'), p = mw[2].toLowerCase(), pre = line.slice(0, line.length - mw[2].length);
    return opts.filter(o => o.startsWith(p) && o !== p).map(o => ({ label: o, apply: () => pre + o + ' ' }));
  }
  const m = line.match(/((?:\\(?:mute|permmute)\s[^@]*)?\\?@)([\p{L}\p{N}_-]*)$/u);
  if (m && s) {
    const p = m[2].toLowerCase(), pre = line.slice(0, line.length - m[0].length);
    const people = s.seat.filter(id => id !== me && tag(s.players[id].name).toLowerCase().startsWith(p)).map(id => tag(s.players[id].name));
    const opts = m[1] === '@' && 'everyone'.startsWith(p) ? ['everyone', ...people] : people;
    const out = opts.map(n => ({ label: m[1] + n, apply: () => pre + m[1] + n + ' ' }));
    return out.filter(o => o.label.toLowerCase() !== line.slice(pre.length).toLowerCase().trim());
  }
  if (line === '') return [];   // nothing until something is typed
  if (line.startsWith('\\') && !line.includes(' ')) return CHAT_CMDS.filter(c => c.startsWith(line) && c !== line).map(c => ({ label: c, apply: () => c }));
  return [];
}
const HELP = ['The chat\'s help (HelpChat in the command line tells more):', '@name: pings a player (a soft sound and a "!"); @everyone pings everyone', '\\@name message: a private message',
  '\\mute bubble ping text on @name @name2: mute what you list (all = everything; off undoes it) until you leave the room',
  '\\permmute … the same, kept on this device (it asks first; -f skips the question)', '\\show mute · \\show permmute · \\show players',
  '\\togglesuggest: suggestions in the chat on or off', 'clear (or \\clear): clears the chat on your screen', 'Shift+T or the symbol at the bottom left: the command line', 'Tab: complete; ↑ ↓: choose'];

/* ---------- mutes: what you hide from a player (their text, their pings, their bubbles over the board) ----------
   For this room only (gone when you leave it), or for good on this device (by their Google account if they're signed
   in, else by name). The old \mute@name lists became permanent mutes. */
const KINDS = ['text', 'ping', 'bubble'];
const session = { room: '', by: {} };
const perm = () => {
  if (!profile.permMutes) {
    profile.permMutes = {};
    for (const n of profile.muted || []) profile.permMutes['name:' + n] = { ...profile.permMutes['name:' + n], text: true };
    for (const n of profile.mutedPings || []) profile.permMutes['name:' + n] = { ...profile.permMutes['name:' + n], ping: true };
    delete profile.muted; delete profile.mutedPings;
  }
  return profile.permMutes;
};
const keysOfPlayer = p => p ? [...(p.acct ? ['acct:' + p.acct] : []), 'name:' + tag(p.name).toLowerCase()] : [];
const sessionMutes = () => { const r = activeRoom(), id = r ? r.state.id : ''; if (session.room !== id) { session.room = id; session.by = {}; } return session.by; };
/* is this player's text, ping or bubble muted for me? */
export function isMuted(s, id, kind) {
  const p = s && s.players[id]; if (!p) return false;
  const a = sessionMutes(), b = perm();
  return gameMuted(s, id, kind) || keysOfPlayer(p).some(k => (a[k] && a[k][kind]) || (b[k] && b[k][kind]));   // (forgame's mutes hide it for everyone)
}
/* \mute | \permmute: the kinds, then on or off, then the players */
function setMutes(line, permanent, s, me) {
  const ws = line.trim().split(/\s+/).slice(1).filter(w => w !== '-f');
  const kinds = ws.filter(w => [...KINDS, 'all'].includes(w.toLowerCase())).map(w => w.toLowerCase());
  const onOff = ws.find(w => /^(on|off)$/i.test(w)), at = ws.filter(w => w.startsWith('@'));
  if (!kinds.length || !onOff || !at.length) return `${permanent ? '\\permmute' : '\\mute'}: what (bubble, ping, text or all), on or off, then @names. Like \\mute bubble ping on @${tag(s.players[s.seat.find(i => i !== me) || me].name)}`;
  const list = kinds.includes('all') ? KINDS : kinds, on = /^on$/i.test(onOff), store = permanent ? perm() : sessionMutes(), done = [];
  for (const a of at) {
    const id = byTag(s, a.slice(1)); if (!id || id === me) { done.push(`✗ ${a}?`); continue; }
    const k = keysOfPlayer(s.players[id])[0];
    store[k] = { ...store[k] }; for (const kind of list) { if (on) store[k][kind] = true; else delete store[k][kind]; }
    if (!Object.keys(store[k]).length) delete store[k];
    done.push(s.players[id].name);
  }
  if (permanent) save();
  return `${on ? 'Muted' : 'Unmuted'} ${list.join(', ')}${permanent ? ' for good (this device)' : ' (until you leave the room)'}: ${done.join(', ')}.`;
}
function showMutes(s, permanent) {
  const store = permanent ? perm() : sessionMutes(), rows = Object.entries(store);
  if (!rows.length) return permanent ? 'No permanent mutes.' : 'No mutes in this room.';
  const nameOf = k => { const id = s && s.seat.find(i => keysOfPlayer(s.players[i]).includes(k)); return id ? s.players[id].name : k.replace(/^(name|acct):/, k.startsWith('acct:') ? 'account ' : ''); };
  return rows.map(([k, v]) => `${nameOf(k)}: ${Object.keys(v).join(', ')}`).join(' · ');
}
function showPlayers(s, online) {
  return s.seat.map(id => { const p = s.players[id]; return [`${p.name}${id === s.hostId ? ' (host)' : ''}`, p.bot ? 'computer' : online ? (p.ms == null ? '… ms' : p.ms + ' ms') : 'same device', p.idle ? 'away' : '', p.late ? 'plays next turn' : ''].filter(Boolean).join(' · '); }).join('\n');
}

/* the chat's own commands (\togglesuggest, \show, \mute, \permmute), from the chat or the command line; null: not one */
async function chatCommand(text, r) {
  if (/^\\togglesuggest\s*$/i.test(text)) {
    profile.settings.chatSuggest = profile.settings.chatSuggest === false; save();
    return `Chat suggestions ${profile.settings.chatSuggest ? 'on' : 'off'}. \\togglesuggest switches them again.`;
  }
  if (!/^\\(show|mute|permmute|unmute|muteping|unmuteping)/i.test(text)) return null;
  if (!r) return 'That works in a room.';
  const sh = text.match(/^\\show\s+(\S+)\s*$/i);
  if (sh) { const k = sh[1].toLowerCase(); return k === 'mute' ? showMutes(r.state, false) : k === 'permmute' ? showMutes(r.state, true) : k === 'players' ? showPlayers(r.state, r.online) : '\\show mute, \\show permmute or \\show players'; }
  if (/^\\show\s*$/i.test(text)) return '\\show mute, \\show permmute or \\show players';
  const old = text.match(/^\\(un)?(mute|muteping)@([\p{L}\p{N}_-]+)\s*$/iu);   // the old way still works: permanent, like before
  if (old) return setMutes(`x ${old[2].toLowerCase() === 'mute' ? 'text' : 'ping'} ${old[1] ? 'off' : 'on'} @${old[3]}`, true, r.state, r.me);
  const mu = text.match(/^\\(mute|permmute)\b/i);
  if (!mu) return null;
  if (denied(r.state, r.me, 'nomute')) return 'Your group can\'t mute others.';
  const permanent = mu[1].toLowerCase() === 'permmute';
  if (permanent && !/\s-f(\s|$)/i.test(text) && /\s@/.test(text) && !(await confirmBox('Mute for good?', 'This stays on this device until you undo it (\\permmute … off @name). -f skips this question.'))) return 'Nothing muted.';
  return setMutes(text, permanent, r.state, r.me);
}
/* what the command line needs from here: the room, your name, these commands and the customization ones */
function shellCtx() {
  const r = activeRoom(), s = r && r.state, me = s && s.players[r.me];
  return {
    room: r, meName: tag(me ? me.name : profile.name),
    chat: async text => (await chatCommand(text, r)) ?? `✗ ${text.split(' ')[0]}?`,
    legacyHas: name => !!TREE[name] && name !== 'help' && name !== 'clear',
    legacyTop: () => Object.keys(TREE).filter(k => k !== 'help' && k !== 'clear' && !(TREE[k].fun && !funOn())),
    legacy: line => runCommand(line), legacySuggest: line => cmdSuggest(line),
    /* while a command runs: Ctrl+C stops it, top shows its lines live, exit closes the window */
    cancelled: () => ui.cancel, live: ls => { if (current && current.live) current.live(ls); }, close: () => { if (current && current.close) current.close(); },
    slowLeft: () => { const ms = s ? slowMs(s, r.me) : 0; return ms ? ms - (Date.now() - (ui.lastSent || 0)) : 0; }, sent: () => { ui.lastSent = Date.now(); },
  };
}

/* ---------- the widget ---------- */
const ui = { open: false, mode: 'chat', ping: false, cmd: [], notes: [], long: new Set(), game: '', running: false, cancel: false, live: [], chatFrom: 0 };   // cmd: the command line's lines; notes: chat lines only you see; long: unfolded long messages; chatFrom: clear hides the chat before it, on your screen
const mentionRe = n => new RegExp(`(^|[^\\\\\\p{L}\\p{N}_-])@(${tag(n).replace(/[-]/g, '\\-')}|everyone)(?![\\p{L}\\p{N}_-])`, 'iu');

/* the chat comes in two parts that the screen places: the round button (in the bottom bar) and the panel (in a dock at the
   side chosen in Settings, so it never covers anything) */
let current = null;
export function chatWidget() {
  const btn = el(`<button type="button" class="chat-btn mode-icon" aria-label="Text chat (T)" data-tip="Text chat (T)"><span class="mi">ABC</span><span class="bang" hidden>!</span></button>`);
  const panel = el(`<section class="chat-panel dock-panel" hidden>
      <header><h3 class="chat-title">Chat</h3><button type="button" class="win-x chat-x" aria-label="Close the chat">×</button></header>
      <div class="chat-log" aria-live="polite"></div>
      <ul class="chat-sugg" role="listbox" hidden></ul>
      <form class="chat-row" autocomplete="off">
        <button type="button" class="mode-btn mode-icon" aria-label="Chat mode; switch to the command line (Shift+T)" data-tip="Chat · click for the command line (Shift+T)"><span class="mi">ABC</span></button>
        <input class="chat-in" maxlength="500" spellcheck="false" aria-label="Message">
      </form>
    </section>`);
  const w = { btn, panel };
  const log = panel.querySelector('.chat-log'), inp = panel.querySelector('.chat-in'), sugg = panel.querySelector('.chat-sugg');
  const modeBtn = panel.querySelector('.mode-btn');
  let sel = 0, list = [], lastN = 0;
  const room = () => activeRoom();

  const drawLog = () => {
    const r = room(), s = r && r.state;
    if (ui.mode === 'cmd') { setHTML(log, [...ui.cmd, ...ui.live].map(l => `<p class="cmd-line${l.startsWith('$ ') ? ' echo' : ''}">${paint(l)}</p>`).join('') || '<p class="dim small">Type help and press Enter. New to this? HelpCommandLine.</p>'); log.scrollTop = 1e9; return; }
    if (!s) { setHTML(log, ''); return; }
    const me = r.me, name = id => s.players[id] ? nameHTML(s.players[id].name, s.players[id].nameStyle) : '<span class="dim">Gone</span>';
    const lines = [...s.log.filter(m => m.t >= ui.chatFrom).filter(m => m.sys || ((!m.to || m.to === me || m.from === me) && !(m.from !== me && isMuted(s, m.from, 'text')))), ...ui.notes.filter(m => m.t >= ui.chatFrom)].sort((a, b) => a.t - b.t);
    const html = lines.map(m => {
      if (m.mine) return `<p class="sys note">${esc(m.text)}</p>`;
      if (m.sys) return `<p class="sys${m.small ? ' small' : ''}">${esc(m.text)}</p>`;
      if (m.npc) return `<p class="npc npc-${esc(m.npc)}"><span class="npc-name">${esc(m.name || m.npc)}</span>: <span class="npc-said">${esc(m.text)}</span></p>`;   // Duck Cabin's characters
      const meName = s.players[me] && s.players[me].name, hit = m.from !== me && meName && (m.to === me || mentionRe(meName).test(m.text)) && !isMuted(s, m.from, 'ping');
      /* over 250 characters: folded under an arrow (a ! beside it if it pings you), open until the chat closes */
      const long = m.text.length > 250, open = long && ui.long.has(m.n);
      const text = esc(long && !open ? m.text.slice(0, 250).trimEnd() + '…' : m.text).replace(/(\\?)@([\p{L}\p{N}_-]+)/gu, (a, b, n) => `<b class="at">${b}@${n}</b>`);
      const fold = long ? `<button type="button" class="fold" data-n="${m.n}" aria-expanded="${open}" aria-label="${open ? 'Fold' : 'Show all'}">${open ? '▾' : '▸'}</button>${hit ? '<b class="fold-bang">!</b>' : ''} ` : '';
      const priv = m.to ? `<span class="tag-priv">${m.from === me ? `to ${s.players[m.to] ? esc(s.players[m.to].name) : '?'}` : 'private'}</span> ` : '';
      /* from the command line: the command in small print, then its output (a file: only sudo members see inside) */
      if (m.cmd) {
        const sealed = !canOpen(s, me, m);
        return `<p class="from-cmd${m.to ? ' priv' : ''}${hit ? ' hit' : ''}${long ? ' long' : ''}">${fold}${priv}${name(m.from)} <span class="cmd-tag">from the command line: <code>$ ${m.file ? 'send ' : ''}${esc(m.cmd)}</code></span>${m.file ? `<span class="cmd-file">📄 ${esc(m.file)}${sealed ? ` <span class="dim">(only sudo${m.grp ? ` and ${esc(m.grp)}` : ''} can open it)</span>` : ''}</span>` : ''}${sealed ? '' : `<span class="cmd-out">${text}</span>`}</p>`;
      }
      return `<p class="${m.to ? 'priv' : ''}${hit ? ' hit' : ''}${long ? ' long' : ''}">${fold}${priv}${name(m.from)}: ${text}</p>`;
    }).join('');
    const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    setHTML(log, html || '<p class="dim small">Say hi. \\help lists what chat can do.</p>');
    if (atEnd) log.scrollTop = 1e9;
  };
  const drawSugg = () => {
    sugg.hidden = !list.length || document.activeElement !== inp;
    sugg.innerHTML = list.slice(0, 8).map((x, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}">${esc(x.label)}</li>`).join('');
  };
  const refresh = () => {
    const r = room();
    list = !inp.value ? [] : ui.mode === 'cmd' ? shellSuggest(inp.value, shellCtx()) : chatSuggest(inp.value, r && r.state, r && r.me);   // only once something is typed
    sel = Math.min(sel, Math.max(0, list.length - 1)); drawSugg();
  };
  /* the round symbol shows the mode you are in: ABC on white for the chat, a green $ on black for the command line */
  const setMode = m => {
    ui.mode = m; panel.dataset.mode = btn.dataset.mode = modeBtn.dataset.mode = m;
    panel.querySelector('.chat-title').textContent = m === 'cmd' ? 'Command line' : 'Chat';
    for (const b of [modeBtn, btn]) b.querySelector('.mi').textContent = m === 'cmd' ? '$' : 'ABC';
    modeBtn.dataset.tip = m === 'cmd' ? 'Command line · click for the text chat (T)' : 'Chat · click for the command line (Shift+T)';
    modeBtn.setAttribute('aria-label', m === 'cmd' ? 'Command line mode; switch to the text chat (T)' : 'Chat mode; switch to the command line (Shift+T)');
    btn.dataset.tip = m === 'cmd' ? 'Command line (Shift+T)' : 'Text chat (T)';
    inp.setAttribute('aria-label', m === 'cmd' ? 'Command' : 'Message');
    inp.maxLength = m === 'cmd' ? CMD_MAX : 500;   // a command line can be longer than a chat message
    drawLog(); refresh();
  };
  const openPanel = m => {
    ui.open = true; panel.hidden = false; btn.setAttribute('aria-pressed', 'true');
    ui.ping = false; btn.querySelector('.bang').hidden = true;
    if (w.onToggle) w.onToggle();   // the dock opens first, so the box can take the focus
    setMode(m || ui.mode); log.scrollTop = 1e9; inp.focus(); refresh();   // always open on the newest message
  };
  const closePanel = () => { ui.open = false; ui.long.clear(); panel.hidden = true; btn.setAttribute('aria-pressed', 'false'); inp.blur(); if (w.onToggle) w.onToggle(); };
  w.openChat = openPanel;
  w.close = closePanel;
  /* a command's live lines (top), shown under it until it ends */
  w.live = ls => { ui.live = ls; if (ui.mode === 'cmd') drawLog(); };

  btn.onclick = () => ui.open ? closePanel() : openPanel();
  panel.querySelector('.chat-x').onclick = closePanel;
  modeBtn.onclick = () => { setMode(ui.mode === 'cmd' ? 'chat' : 'cmd'); inp.focus(); };
  inp.addEventListener('focus', refresh);
  inp.addEventListener('click', refresh);
  inp.addEventListener('input', () => { sel = 0; refresh(); });
  inp.addEventListener('paste', e => {   // a pasted line that is too long: say it was cut
    const t = (e.clipboardData || {}).getData ? e.clipboardData.getData('text') : '', max = inp.maxLength;
    if (max > 0 && inp.value.length - (inp.selectionEnd - inp.selectionStart) + t.length > max && ui.mode === 'cmd') { ui.cmd.push(`✗ That line is longer than ${max.toLocaleString('en-US')} characters, so its end was cut off.`); drawLog(); }
  });
  inp.addEventListener('blur', () => setTimeout(drawSugg, 120));
  sugg.addEventListener('mousedown', e => { const li = e.target.closest('li'); if (!li) return; e.preventDefault(); inp.value = list[+li.dataset.i].apply(); sel = 0; refresh(); });
  let back = -1, search = null;   // the command line's ↑ ↓: how far back in its history; Ctrl+R: what is searched for
  inp.addEventListener('keydown', e => {
    if (ui.mode === 'cmd' && e.ctrlKey && !e.altKey && !e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === 'c' && inp.selectionStart === inp.selectionEnd) {   // stop the running command, or drop the line (copying still works)
        e.preventDefault();
        if (ui.running) ui.cancel = true; else { ui.cmd.push('$ ' + inp.value + '^C'); inp.value = ''; drawLog(); refresh(); }
        return;
      }
      if (k === 'l') { e.preventDefault(); ui.cmd = []; drawLog(); return; }
      if (k === 'r') {   // each press goes further back through the commands that have the words typed
        e.preventDefault();
        const h = shellHistory(); if (search === null) search = { q: inp.value, at: h.length };
        let i = search.at - 1; while (i >= 0 && !h[i].includes(search.q)) i--;
        if (i >= 0) { search.at = i; inp.value = h[i]; } return;
      }
    }
    if (e.key !== 'Control') search = null;
    if (e.key === 'Tab') { e.preventDefault(); if (list.length) { inp.value = list[sel].apply(); sel = 0; refresh(); } return; }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && ui.mode === 'cmd' && !list.length) {
      const h = shellHistory(); if (!h.length) return;
      e.preventDefault(); back = e.key === 'ArrowUp' ? Math.min(h.length - 1, back + 1) : Math.max(-1, back - 1);
      inp.value = back < 0 ? '' : h[h.length - 1 - back]; return;
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && list.length) { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + Math.min(8, list.length)) % Math.min(8, list.length); drawSugg(); return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePanel(); }
  });
  log.addEventListener('click', e => { const b = e.target.closest('.fold'); if (!b) return; const n = +b.dataset.n; if (ui.long.has(n)) ui.long.delete(n); else ui.long.add(n); drawLog(); });
  const submit = async text => {
    if (ui.mode === 'cmd') {
      if (ui.running) { ui.cmd.push('$ ' + text, '✗ A command is still running (Ctrl+C stops it).'); drawLog(); return; }
      ui.cmd.push('$ ' + text); back = -1; search = null;
      ui.running = true; ui.cancel = false; drawLog();
      const at = ui.cmd.length;   // its lines go right under it, above anything typed while it ran
      let res;
      try { res = await shellRun(text, shellCtx()); } finally { ui.running = false; ui.cancel = false; ui.live = []; }
      if (res.cleared) ui.cmd = [...res.lines]; else ui.cmd.splice(Math.min(at, ui.cmd.length), 0, ...res.lines);
      if (ui.cmd.length > 300) ui.cmd.splice(0, ui.cmd.length - 300);
      drawLog(); refresh(); return;
    }
    const r = room(), note = (...t) => { ui.notes.push(...t.map(text => ({ t: Date.now(), mine: true, text }))); drawLog(); refresh(); };
    /* the command line's words, typed in the chat: clear clears the chat on your screen, help is the chat's help, and a
       Help page opens in the command line */
    if (/^\\?clear$/i.test(text)) { ui.chatFrom = Date.now(); return note('Chat cleared on your screen (everyone else still sees theirs).'); }
    if (/^\\?help$/i.test(text) || /^\\help\b/i.test(text)) return note(...HELP);
    if (isHelpName(text.split(/\s+/)[0])) { setMode('cmd'); return submit(text); }
    const said = await chatCommand(text, r);
    if (said !== null) { drawLog(); return note(said); }
    if (!r) return note('Chat works in a room.');
    if (denied(r.state, r.me, 'nochat')) return note('Your group can\'t chat.');
    const slow = slowMs(r.state, r.me);
    if (slow && Date.now() - (ui.lastSent || 0) < slow) return note(`Slow down: one message every ${Math.round(slow / 1000)} seconds (${Math.ceil((slow - (Date.now() - ui.lastSent)) / 1000)} s).`);
    ui.lastSent = Date.now();
    const pm = text.match(/^\\@([\p{L}\p{N}_-]+)\s+(.+)$/u);
    if (pm) {
      const to = byTag(r.state, pm[1]);
      if (!to) return note(`No player named ${pm[1]}.`);
      r.send({ t: 'chat', to, text: pm[2] });
    } else if (/^\\@/.test(text)) return note('A private message: \\@name, a space, then the message.');
    else r.send({ t: 'chat', text });
    refresh();
  };
  panel.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const text = inp.value.trim(); inp.value = ''; sel = 0;
    if (!text) { closePanel(); return; }
    return submit(text);
  };

  /* new messages: pings for @you; a "!" on the closed button */
  const onState = s => {
    const r = room(); if (!r) return;
    const g = s.startedAt ? `${s.id}:${s.startedAt}` : '';   // each new game: a note on the chat's suggestions
    if (g && g !== ui.game) { ui.game = g; ui.notes.push({ t: Date.now(), mine: true, text: `New game. \\togglesuggest turns the chat's suggestions ${profile.settings.chatSuggest === false ? 'back on' : 'off'}.` }); if (ui.mode === 'chat') drawLog(); }
    if ((s.logN || 0) !== lastN) {
      const fresh = s.log.filter(m => m.n > lastN);
      lastN = s.logN || 0;
      const meName = s.players[r.me] && s.players[r.me].name;
      const hit = fresh.some(m => !m.sys && m.from !== r.me && !isMuted(s, m.from, 'text') && !isMuted(s, m.from, 'ping') && (m.to === r.me || (meName && mentionRe(meName).test(m.text))));
      if (hit) { sfx.ping(); if (!ui.open) { ui.ping = true; btn.querySelector('.bang').hidden = false; } }
      if (ui.mode === 'chat') drawLog();
    }
  };
  const r0 = room(); if (r0) lastN = r0.state.logN || 0;
  const unsub = r0 ? r0.on(onState) : () => {};
  w.destroy = () => { unsub(); if (current === w) current = null; };
  w.isOpen = () => ui.open;
  setMode(ui.mode);
  if (ui.open) { panel.hidden = false; btn.setAttribute('aria-pressed', 'true'); }
  if (ui.ping) btn.querySelector('.bang').hidden = false;
  current = w;
  return w;
}

/* T opens the chat, Shift+T the command line (not while typing or with a window open) */
addEventListener('keydown', e => {
  if (e.code !== 'KeyT' || e.ctrlKey || e.metaKey || e.altKey || typing(e) || windowOpen()) return;
  if (!current) return;
  e.preventDefault(); current.openChat(e.shiftKey ? 'cmd' : 'chat');
});
