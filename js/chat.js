/* ---------- text chat (T) and the command line (Shift+T) ----------
   A slide at the side chosen in Settings (left, bottom, right or hidden). Closed, it is a round button: "ABC" on white for
   the chat. Open, the symbol at its bottom left switches between the chat and the command line (a green "$" on black).

   Chat: @name pings that player (a soft sound and a "!" on the chat button); \@name sends a private message; \help lists
   these. Suggestions show once something is typed; Tab completes (never leaving the page), the arrow keys move through
   them.

   Command line: customization only for now, e.g. custom username font "times new roman". Words are split by spaces, so a
   choice with a space goes in quotes; Tab adds the quotes. */
import { el, esc, typing, windowOpen, setHTML } from './ui.js';
import { profile, save, cleanName, NAME_OK } from './store.js';
import { activeRoom } from './net.js';
import { nameHTML, FONTS, findFont } from './name.js';
import { DUCK_PATTERNS, DUCK_METALS } from './duck.js';
import { HATS, hatById } from './hats.js';
import { FACES, faceById } from './faces.js';
import { CARD_PATTERNS } from './card.js';
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
        ketchup: { vals: ['on', 'off'], run: v => { const h = profile.duck.hat; if (!h || h.id !== 'hotdog') return '✗ Ketchup goes on the hotdog hat.'; if (!/^(on|off)$/i.test(v)) return bad(v); profile.duck.hat = { ...h, ketchup: /^on$/i.test(v) }; return `Ketchup: ${/^on$/i.test(v) ? 'on' : 'off'}`; } },
        face: { vals: ['none', ...FACES.map(f => f.id)], run: v => { const k = String(v).toLowerCase(); if (k === 'none') { profile.duck.face = null; return 'Face: none'; } const f = faceById(k); if (!f) return bad(v); profile.duck.face = { ...(profile.duck.face && profile.duck.face.id === k ? profile.duck.face : {}), id: k }; return `Face: ${f.name}`; } },
        'face color': { vals: COLOR_HINT, run: v => { const c = colorOf(v), f = profile.duck.face; if (!f) return '✗ Nothing on the face. custom avatar face …'; if (!c) return bad(v); profile.duck.face = { ...f, c1: c }; return `Face color: ${c}`; } },
      } },
      card: { kids: {
        color: { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!c) return bad(v); profile.card.color = c; return `Card color: ${c}`; } },
        pattern: { vals: keysOf(CARD_PATTERNS), run: v => pick(keysOf(CARD_PATTERNS), v, x => { profile.card.pattern = x; }, 'Card pattern') },
        'pattern color': { vals: COLOR_HINT, run: v => { const c = colorOf(v); if (!c) return bad(v); profile.card.patternColor = c; return `Card pattern color: ${c}`; } },
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
  if (!['answer', 'discuss', 'results'].includes(s.phase)) return '✗ That works on the board.';
  const who = [];
  for (const a of args) {
    const id = byTag(s, a.replace(/^@/, ''));
    if (!id) return `✗ No player named ${a.replace(/^@/, '')}.`;
    who.push(id);
  }
  if (who.length < node.at) return `✗ ${node.info}`;
  r.send({ t: 'fx', kind: node.kind, who: who.slice(0, node.at) });
  const nm = who.slice(0, node.at).map(id => s.players[id].name).join(' and ');
  return { lightning: `⚡ ${nm}`, love: `♥ ${nm}`, kill: `✖ ${nm} plays dead`, hotdog: `🌭 for ${nm}` }[node.kind];
}

/* ---------- the chat's suggestions ---------- */
/* chat commands: nothing shows before typing; typing narrows them (\\ shows every \\ command); names complete
   after @ and after each \\…@ */
const CHAT_CMDS = ['\\help', '\\@', '\\mute@', '\\unmute@', '\\muteping@', '\\unmuteping@'];
function chatSuggest(line, s, me) {
  const m = line.match(/((?:\\(?:un)?(?:mute|muteping))?\\?@)([\p{L}\p{N}_-]*)$/u);
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
const HELP = ['@name: pings a player (a soft sound and a "!"); @everyone pings everyone', '\\@name message: a private message',
  '\\mute@name: hide their messages · \\unmute@name', '\\muteping@name: their pings stay quiet · \\unmuteping@name',
  'Shift+T or the symbol at the bottom left: the command line', 'Tab: complete; ↑ ↓: choose'];
/* who you muted, by name, kept on this device */
const muted = () => (profile.muted = profile.muted || []);
const quiet = () => (profile.mutedPings = profile.mutedPings || []);

/* ---------- the widget ---------- */
const ui = { open: false, mode: 'chat', ping: false, cmd: [], notes: [] };   // cmd: the command line's lines; notes: chat lines only you see
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
        <input class="chat-in" maxlength="300" spellcheck="false" aria-label="Message">
      </form>
    </section>`);
  const w = { btn, panel };
  const log = panel.querySelector('.chat-log'), inp = panel.querySelector('.chat-in'), sugg = panel.querySelector('.chat-sugg');
  const modeBtn = panel.querySelector('.mode-btn');
  let sel = 0, list = [], lastN = 0;
  const room = () => activeRoom();

  const drawLog = () => {
    const r = room(), s = r && r.state;
    if (ui.mode === 'cmd') { setHTML(log, ui.cmd.map(l => `<p class="cmd-line${l.startsWith('$ ') ? ' echo' : ''}">${esc(l)}</p>`).join('') || '<p class="dim small">Type help.</p>'); log.scrollTop = 1e9; return; }
    if (!s) { setHTML(log, ''); return; }
    const me = r.me, name = id => s.players[id] ? nameHTML(s.players[id].name, s.players[id].nameStyle) : '<span class="dim">Gone</span>';
    const hidden = new Set(muted()), nameOf = id => (s.players[id] ? tag(s.players[id].name).toLowerCase() : '');
    const lines = [...s.log.filter(m => m.sys || ((!m.to || m.to === me || m.from === me) && !(m.from !== me && hidden.has(nameOf(m.from))))), ...ui.notes].sort((a, b) => a.t - b.t);
    const html = lines.map(m => {
      if (m.mine) return `<p class="sys note">${esc(m.text)}</p>`;
      if (m.sys) return `<p class="sys">${esc(m.text)}</p>`;
      const meName = s.players[me] && s.players[me].name, hit = m.from !== me && meName && mentionRe(meName).test(m.text);
      const text = esc(m.text).replace(/(\\?)@([\p{L}\p{N}_-]+)/gu, (a, b, n) => `<b class="at">${b}@${n}</b>`);
      return `<p class="${m.to ? 'priv' : ''}${hit ? ' hit' : ''}">${m.to ? `<span class="tag-priv">${m.from === me ? `to ${s.players[m.to] ? esc(s.players[m.to].name) : '?'}` : 'private'}</span> ` : ''}${name(m.from)}: ${text}</p>`;
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
    list = !inp.value ? [] : ui.mode === 'cmd' ? cmdSuggest(inp.value) : chatSuggest(inp.value, r && r.state, r && r.me);   // only once something is typed
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
    drawLog(); refresh();
  };
  const openPanel = m => {
    ui.open = true; panel.hidden = false; btn.setAttribute('aria-pressed', 'true');
    ui.ping = false; btn.querySelector('.bang').hidden = true;
    if (w.onToggle) w.onToggle();   // the dock opens first, so the box can take the focus
    setMode(m || ui.mode); inp.focus(); refresh();
  };
  const closePanel = () => { ui.open = false; panel.hidden = true; btn.setAttribute('aria-pressed', 'false'); inp.blur(); if (w.onToggle) w.onToggle(); };
  w.openChat = openPanel;

  btn.onclick = () => ui.open ? closePanel() : openPanel();
  panel.querySelector('.chat-x').onclick = closePanel;
  modeBtn.onclick = () => { setMode(ui.mode === 'cmd' ? 'chat' : 'cmd'); inp.focus(); };
  inp.addEventListener('focus', refresh);
  inp.addEventListener('click', refresh);
  inp.addEventListener('input', () => { sel = 0; refresh(); });
  inp.addEventListener('blur', () => setTimeout(drawSugg, 120));
  sugg.addEventListener('mousedown', e => { const li = e.target.closest('li'); if (!li) return; e.preventDefault(); inp.value = list[+li.dataset.i].apply(); sel = 0; refresh(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); if (list.length) { inp.value = list[sel].apply(); sel = 0; refresh(); } return; }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && list.length) { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + Math.min(8, list.length)) % Math.min(8, list.length); drawSugg(); return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePanel(); }
  });
  panel.querySelector('form').onsubmit = e => {
    e.preventDefault();
    const text = inp.value.trim(); inp.value = ''; sel = 0;
    if (!text) { closePanel(); return; }
    if (ui.mode === 'cmd') {
      ui.cmd.push('$ ' + text);
      const res = runCommand(text);
      if (res === null) ui.cmd = []; else ui.cmd.push(...res);
      if (ui.cmd.length > 200) ui.cmd.splice(0, ui.cmd.length - 200);
      drawLog(); refresh(); return;
    }
    const r = room(), note = (...t) => { ui.notes.push(...t.map(text => ({ t: Date.now(), mine: true, text }))); drawLog(); refresh(); };
    if (/^\\help\b/i.test(text)) return note(...HELP);
    const mc = text.match(/^\\(un)?(mute|muteping)@([\p{L}\p{N}_-]+)\s*$/iu);
    if (mc) {
      const list = mc[2].toLowerCase() === 'mute' ? muted() : quiet(), n = tag(mc[3]).toLowerCase(), had = list.includes(n);
      if (mc[1]) { if (had) list.splice(list.indexOf(n), 1); } else if (!had) list.push(n);
      save(); drawLog();
      return note(`${mc[3]}: ${mc[2].toLowerCase() === 'mute' ? (mc[1] ? 'messages show again' : 'messages hidden') : (mc[1] ? 'pings sound again' : 'pings stay quiet')}.`);
    }
    if (!r) return note('Chat works in a room.');
    const pm = text.match(/^\\@([\p{L}\p{N}_-]+)\s+(.+)$/u);
    if (pm) {
      const to = byTag(r.state, pm[1]);
      if (!to) return note(`No player named ${pm[1]}.`);
      r.send({ t: 'chat', to, text: pm[2] });
    } else if (/^\\@/.test(text)) return note('A private message: \\@name, a space, then the message.');
    else r.send({ t: 'chat', text });
    refresh();
  };

  /* new messages: pings for @you; a "!" on the closed button */
  const onState = s => {
    const r = room(); if (!r) return;
    if ((s.logN || 0) !== lastN) {
      const fresh = s.log.filter(m => m.n > lastN);
      lastN = s.logN || 0;
      const meName = s.players[r.me] && s.players[r.me].name;
      const off = new Set([...muted(), ...quiet()]), nm = id => (s.players[id] ? tag(s.players[id].name).toLowerCase() : '');
      const hit = fresh.some(m => !m.sys && m.from !== r.me && !off.has(nm(m.from)) && (m.to === r.me || (meName && mentionRe(meName).test(m.text))));
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
