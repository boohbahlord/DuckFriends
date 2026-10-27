/* ---------- the command line: a small bash ----------
   The language itself (pipes, ; && ||, > >> < 2>, variables, $( ), wildcards, loops, aliases, !! history) is bash.js;
   the text tools (grep, sed, awk, cut, sort …) are textutils.js; every command's page and help's topics are manual.js.
   This file is the shell around them: the files, and the commands that know the game.

   The files: / holds bin (the commands; nobody can read them, not even the host) and usr; /usr/<you> is your home:
   notes/ (your files, for this game only), log (everything you ran this game and what came out, read-only) and
   perma-notes/ (kept on this device from game to game; only you, superuser-<you>, can open it; its files can be removed,
   the folder can't). Other players' homes show in /usr, but their files live on their own devices.

   The room's commands go through the host: sudo runs a command as a member of the sudo group (the host always is);
   usermod, groupadd, groupmod and groupdel need it, and so does forgame (the game's settings mid-game, and mutes that
   everyone sees). A group's perms take something away (nocmd, nochat, nosend, nofun, nomute, slow or slow30) or give part
   of the host's job (canskip, canmute, cankick, cansettings); dumbasses has nofun and slow. Anyone in sudo can run the room
   like the host (lobby settings, map, game type, start, kick) and skip the stage the game is on.

   send posts a command's output to the chat (send @everyone roundstats, send \@name totalstats @name2, roundstats | send
   @everyone); sending a file by itself shows its name, and only sudo members can open it, unless chmod let its group (g+r)
   or everyone (o+r). The chat's \mute, \permmute and \show work here too. A line sends 3 times at most, and fires 3 silly
   commands at most, a second apart. */
import { profile, save, STAT_MODES } from './store.js';
import { groupsOf, isSudo, may, denied, permOk, GROUP_PERMS, STAGE, statsFor, wyrStats, bbStats, scStats, lawStats, COLS, signed, nameOfValue, slowMs } from './rules.js';
import { modeOf, MODES } from './modes.js';
import { MAPS, mapName } from './maps.js';
import { FONTS } from './name.js';
import { specialById, keysOf, KEYS } from './specials.js';
import { styleById } from './styles.js';
import { hatById } from './hats.js';
import { outfitById } from './outfits.js';
import { runLine, expandHistory, globRe, BUILTIN_NAMES } from './bash.js';
import { TEXT, getopt, lines } from './textutils.js';
import { MAN, PERMS_TAKE, PERMS_GIVE } from './manual.js';
import { helpPage, helpIndex, HELP_NAMES, isHelpName } from './helppages.js';
import { quackStats } from './quackrules.js';
import { secret } from './unlocks.js';
import { music } from './music.js';
import { npcsHere, npcTag, npcByTag, npcById } from './npcs.js';

const tag = n => String(n || '').replace(/\s+/g, '');
const fail = (msg, code = 1) => { throw Object.assign(new Error(msg), { code }); };
const FUN = ['lightning', 'love', 'kill', 'hotdog', 'fire'];
const VERSION = (import.meta.url.match(/[?&]v=(\w+)/) || [])[1] || 'dev';
const clock = t => new Date(t).toTimeString().slice(0, 5);
const wait = (ms, ctx) => new Promise(done => { const t0 = Date.now(), k = setInterval(() => { if (Date.now() - t0 >= ms || ctx.cancelled()) { clearInterval(k); done(); } }, 50); });

/* ---------- the files ---------- */
const fs = { game: '', files: {}, dirs: new Set(), meta: {}, cwd: '', old: '', log: [], hist: [], vars: {}, code: 0 };
const perma = () => (profile.permaNotes = profile.permaNotes || {});
function sync(ctx) {
  const s = ctx.room && ctx.room.state, me = ctx.meName, home = `/usr/${me}`;
  const game = s ? `${s.id}:${s.startedAt || 0}` : 'none';
  if (fs.game !== game) { fs.game = game; fs.files = {}; fs.dirs = new Set(); fs.meta = {}; fs.log = []; fs.vars = {}; }   // notes, the log and variables last one game
  if (!fs.cwd || !fs.cwd.startsWith('/')) fs.cwd = home + '/notes';
  fs.home = home;
  fs.people = s ? s.seat.map(id => tag(s.players[id].name)) : [me];
}
const norm = p => { const out = []; for (const part of p.split('/')) { if (!part || part === '.') continue; if (part === '..') out.pop(); else out.push(part); } return '/' + out.join('/'); };
const resolve = p => norm(p === '~' ? fs.home : p.startsWith('~/') ? fs.home + p.slice(1) : p.startsWith('/') ? p : fs.cwd + '/' + p);
const isPerma = path => path.startsWith(fs.home + '/perma-notes/');
/* what a path is: a folder, a file, or nothing */
function kind(path) {
  const h = fs.home, parts = path.split('/').filter(Boolean);
  if (['/', '/usr', '/bin', '/dev'].includes(path)) return 'dir';
  if (path === '/dev/null') return 'file';
  if (parts[0] === 'bin') return MINE.includes(parts[1]) && parts.length === 2 ? 'file' : null;
  if (parts[0] !== 'usr' || !parts[1]) return null;
  if (!fs.people.includes(parts[1]) && path.slice(0, h.length) !== h) return null;
  if (parts.length === 2) return 'dir';
  if (path === h + '/log') return 'file';
  if (parts.length === 3 && ['notes', 'perma-notes'].includes(parts[2])) return 'dir';
  if (isPerma(path)) return parts.length === 4 && perma()[parts[3]] !== undefined ? 'file' : null;
  if (path.startsWith(h + '/')) return fs.files[path] !== undefined ? 'file' : fs.dirs.has(path) ? 'dir' : null;
  return null;
}
/* a path to read: as given, else counted from /usr (cat player1/notes/file1) */
const findPath = p => { const a = resolve(p); if (kind(a) || p.startsWith('/')) return a; const b = norm('/usr/' + p); return kind(b) ? b : a; };
function guard(path, write) {
  const parts = path.split('/').filter(Boolean), h = fs.home;
  if (parts[0] === 'bin') fail(`✗ ${path}: Permission denied (no one can open the commands, not even the host).`);
  if (parts[0] === 'usr' && parts[1] && path.slice(0, h.length + 1) !== h + '/' && path !== h) {
    if (!fs.people.includes(parts[1])) fail(write ? `✗ ${path}: Permission denied (you can write in ${h}/notes and ${h}/perma-notes).` : `✗ ${path}: No such file or directory`);
    if (parts[2] === 'perma-notes') fail(`✗ ${path}: Permission denied (only superuser-${parts[1]} can open it).`);
    fail(`✗ ${path}: Permission denied (that is on ${parts[1]}'s own device).`);
  }
  if (write && path === h + '/log') fail('✗ log: Permission denied (the log is read-only).');
  if (write && !path.startsWith(h + '/notes/') && !isPerma(path) && path !== '/dev/null') fail(`✗ ${path}: Permission denied (you can write in ${h}/notes and ${h}/perma-notes).`);
}
function readFile(p) {
  if (p === '/dev/null' || p === '-') return '';
  const path = findPath(p), k = kind(path);
  guard(path, false);
  if (!k) fail(`✗ ${p}: No such file or directory`);
  if (k === 'dir') fail(`✗ ${p}: Is a directory`);
  if (path === fs.home + '/log') return fs.log.join('\n') + (fs.log.length ? '\n' : '');
  if (isPerma(path)) return perma()[path.split('/').pop()];
  return fs.files[path];
}
function writeFile(p, text, append) {
  if (p === '/dev/null') return;
  const path = resolve(p); guard(path, true);
  if (kind(path) === 'dir') fail(`✗ ${p}: Is a directory`);
  const parent = path.slice(0, path.lastIndexOf('/')); if (kind(parent) !== 'dir') fail(`✗ ${p}: No such file or directory`);
  const name = path.split('/').pop(); if (!/^[\w.-]{1,40}$/.test(name)) fail(`✗ ${name}: a file name is letters, numbers, ., - and _ (40 at most).`);
  const total = Object.values(fs.files).reduce((a, t) => a + t.length, 0); if (total + text.length > 200000) fail('✗ Your notes are full (200,000 characters this game).');
  fs.meta[path] = { ...(fs.meta[path] || {}), t: Date.now() };
  if (isPerma(path)) {   // kept on this device: 100,000 characters in all, so the profile still saves
    const P = perma(), next = (append && P[name] ? P[name] : '') + text, all = Object.entries(P).reduce((a, [k, t]) => a + (k === name ? 0 : t.length), 0);
    if (all + next.length > 100000) fail(`✗ ${name}: perma-notes are full (100,000 characters in all, ${Math.max(0, 100000 - all - (next.length - text.length)).toLocaleString('en-US')} left). rm a file there to make room.`);
    P[name] = next; save(); return;
  }
  fs.files[path] = (append && fs.files[path] ? fs.files[path] : '') + text;
}
function removePath(p) {
  if (isPerma(p)) { delete perma()[p.split('/').pop()]; save(); return; }
  for (const x of Object.keys(fs.files)) if (x === p || x.startsWith(p + '/')) delete fs.files[x];
  for (const x of [...fs.dirs]) if (x === p || x.startsWith(p + '/')) fs.dirs.delete(x);
}
function list(path) {
  const h = fs.home, under = pre => [...Object.keys(fs.files), ...fs.dirs].filter(f => f.startsWith(pre + '/') && !f.slice(pre.length + 1).includes('/')).map(f => f.slice(pre.length + 1) + (fs.dirs.has(f) ? '/' : '')).sort();
  if (path === '/') return ['bin/', 'dev/', 'usr/'];
  if (path === '/dev') return ['null'];
  if (path === '/usr') return fs.people.map(n => n + '/');
  if (path === '/bin') return MINE;
  if (path === h) return ['log', 'notes/', 'perma-notes/'];
  if (path === h + '/perma-notes') return Object.keys(perma()).sort();
  if (path.startsWith(h + '/')) return under(path);
  guard(path, false);
  return ['log', 'notes/', 'perma-notes/'];
}
/* file names that match a pattern (only the last part of a path may have * ? [ ]) */
function glob(pat) {
  const k = pat.lastIndexOf('/'), dirPart = pat.slice(0, k + 1), base = pat.slice(k + 1);
  if (/[*?[]/.test(dirPart)) return [];
  const dir = dirPart ? findPath(dirPart.replace(/\/$/, '') || '/') : fs.cwd;
  try {
    if (kind(dir) !== 'dir') return [];
    const re = globRe(base);
    return list(dir).map(n => n.replace(/\/$/, '')).filter(n => re.test(n) && (base.startsWith('.') || !n.startsWith('.'))).map(n => dirPart + n);
  } catch { return []; }
}
const owner = path => (path.split('/')[2] || 'root');
const size = path => { try { return kind(path) === 'file' ? readFile(path).length : 0; } catch { return 0; } };
const stamp = t => t ? new Date(t).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') : '     -      ';
function longRow(path, name) {
  const k = kind(path), m = fs.meta[path] || {};
  const perms = path.startsWith('/bin') ? '----x--x--x' : k === 'dir' ? 'drwx------' : path === fs.home + '/log' ? '-r--------' : `-rw-${m.g ? 'r' : '-'}--${m.o ? 'r' : '-'}--`;
  return [perms, owner(path), m.grp || (isPerma(path) ? 'superuser-' + owner(path) : owner(path)), size(path), stamp(m.t), name];
}

/* ---------- helpers for the commands ---------- */
const input = (rest, stdin) => rest.length ? rest.map(f => { const t = readFile(f); return t && !t.endsWith('\n') ? t + '\n' : t; }).join('') : stdin;
/* grep -r: a file, or every file in a folder and the folders in it (yours only) */
function files(p) {
  const path = p === '.' ? fs.cwd : findPath(p), k = kind(path); guard(path, false);
  if (!k) fail(`✗ ${p}: No such file or directory`);
  if (k === 'file') return [p];
  const out = [], walk = (dir, shown) => { for (const n of list(dir)) { const b = n.replace(/\/$/, ''), sub = `${dir === '/' ? '' : dir}/${b}`, sh = shown === '.' ? b : `${shown.replace(/\/$/, '')}/${b}`; if (sub.startsWith('/usr/') && !sub.startsWith(fs.home + '/') && sub !== fs.home) continue; if (sub.startsWith('/bin')) continue; if (n.endsWith('/')) walk(sub, sh); else out.push(sh); } };
  walk(path, p);
  return out;
}
const IO = { read: readFile, write: writeFile, input, files };
const who = (ctx, names) => {
  const s = ctx.room.state, ids = [];
  for (const n of names) { const id = s.seat.find(i => tag(s.players[i].name).toLowerCase() === n.replace(/^\\?@/, '').toLowerCase()); if (!id) fail(`✗ No player named ${n.replace(/^\\?@/, '')}.`); ids.push(id); }
  return ids;
};
const needRoom = ctx => { if (!ctx.room) fail('✗ That works in a room.'); return ctx.room.state; };
const noSudo = ctx => `✗ ${ctx.meName} is not in the sudoers file. This incident will be reported.`;
/* the host's job: sudo's powers take the word sudo, the host's too (sudo groupadd …); a group given the perm (canskip …)
   runs its command without it; anyone else is told they aren't in sudo */
const needPower = (x, cmd, perm) => {
  const s = needRoom(x.ctx), me = x.ctx.room.me;
  if (perm && denied(s, me, perm)) return s;
  if (isSudo(s, me)) { if (!x.sudo) fail(`✗ ${cmd}: Permission denied (put sudo in front: sudo ${(x.meta && x.meta.raw || '').trim() || cmd + ' …'})`); return s; }
  fail(x.sudo ? noSudo(x.ctx) : `✗ ${cmd}: Permission denied (only sudo${perm ? `, or a group with ${perm},` : ''} can)`);
};
const needSudo = (x, cmd) => needPower(x, cmd);
const needMay = (x, perm, what) => needPower(x, what, perm);
/* adduser and deluser: the player and the group, in either order (the @ or the group's name tells them apart) */
const userGroup = (args, s) => { const G = roomGroups(s), g = args.find(a => !a.startsWith('@') && G[a.toLowerCase()]) ?? args.findLast(a => !a.startsWith('@')), at = args.find(a => a !== g); return [at, at === undefined ? undefined : g]; };
/* what is wrong with a new group's name, if anything */
const groupNameWrong = n => n.length > 20 ? 'is too long (20 letters at most)' : /^superuser-/i.test(n) ? 'starts with superuser-, which belongs to each player' : !/^[a-z]/i.test(n) ? 'must start with a letter (a to z)' : !/^[a-z0-9_-]+$/i.test(n) ? 'can only have letters a to z, numbers, - and _' : '';
const pct = v => `${Math.round(v * 100)}%`;
const roomGroups = s => s.groups || { sudo: { perms: [], members: [] }, dumbasses: { perms: ['nofun', 'slow'], members: [] } };
const pname = (s, id) => tag(s.players[id].name);
/* rows lined up in columns, each as wide as its widest word (the window is narrow, so no wider); right: columns to the right */
const table = (rows, right = []) => {
  const w = []; for (const r of rows) r.forEach((c, i) => { w[i] = Math.max(w[i] || 0, String(c).length); });
  return rows.map(r => r.map((c, i) => i === r.length - 1 && !right.includes(i) ? String(c) : right.includes(i) ? String(c).padStart(w[i]) : String(c).padEnd(w[i])).join('  ').trimEnd()).join('\n');
};
const left = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/* ---------- the stats ---------- */
function statLines(ctx, scope, args) {
  const s = needRoom(ctx), mi = args.indexOf('-m'), mode = mi >= 0 ? args[mi + 1] : (s.options.mode || 'aod'), at = args.filter(a => a.startsWith('@'));
  if (mode === 'hang') fail('✗ Hangout keeps no stats of its own; try totalstats -m aod (or another game).');
  if (!STAT_MODES.some(([m]) => m === mode)) fail(`✗ -m ${STAT_MODES.map(([m]) => m).join(', ')}.`);
  const ids = at.length ? who(ctx, at) : s.seat.filter(id => !(s.players[id] || {}).late || scope === 'total');
  const nm = id => pname(s, id), out = [];
  if (scope === 'total') {
    out.push(`All time · ${modeOf(mode).name}:`);
    for (const id of ids) {
      const st = (id === ctx.room.me ? profile.stats : s.players[id].stats || {})[mode];
      if (!st) { out.push(`${nm(id)}: no stats yet`); continue; }
      const base = `${nm(id)}: ${st.games} games · ${st.rounds} ${mode === 'bb' ? 'tournaments' : 'rounds'} · ${st.answers} ${mode === 'bb' ? 'votes' : 'answers'} · ${st.jumps} Jumps`;
      if (mode === 'bb') out.push(`${base} · ${st.titles} won · ${st.wins} contender wins · ${st.losses} losses`);
      else if (mode === 'quack') out.push(`${base} · ${st.wins} rounds won · ${st.titles} won as the Quack · ${st.majority} votes for the real Quack`);
      else if (mode === 'law') out.push(`${base} · ${st.argued} cases argued · ${st.wins} won · ${st.losses} lost · gave up ${st.gave}`);
      else if (mode === 'wyr') out.push(`${base} · with the bigger side ${st.majority + st.minority ? pct(st.majority / (st.majority + st.minority)) : '—'}`);
      else if (mode === 'aod' && st.counts) { const top = Math.max(...st.counts), avg = st.answers ? st.counts.reduce((a, k, c) => a + k * (c - 3), 0) / st.answers : null; out.push(`${base} · chose most ${top ? st.counts.map((k, c) => k === top ? COLS[c] : '').filter(Boolean).join(', ') : '—'} · average ${avg === null ? '—' : signed(Math.round(avg * 10) / 10)}`); }
      else out.push(base);
    }
    return out.join('\n');
  }
  if (mode !== (s.options.mode || 'aod')) fail(`✗ This game is ${modeOf(s.options.mode).name}; -m works with totalstats.`);
  const round = scope === 'round' ? s.round : null, jumps = id => (s.jumps || {})[id] || 0;
  out.push(`${scope === 'round' ? `Round ${s.round + 1}` : 'This game'} · ${modeOf(mode).name}:`);
  if (mode === 'quack') {
    const past = s.wqPast || [], per = quackStats(scope === 'round' ? past.slice(-1) : past);
    for (const id of ids) { const p = per[id] || { right: 0, votes: 0, quack: 0, quackWins: 0, wins: 0 }; out.push(`${nm(id)}: ${p.right} of ${p.votes} votes for the real Quack · ${p.wins} rounds won · ${p.quack} as the Quack (${p.quackWins} won) · ${jumps(id)} jumps`); }
  } else if (mode === 'bb') {
    const past = s.bbPast || [], cur = s.bb && s.bb.rounds && s.bb.rounds.length && s.phase !== 'results' ? [s.bb] : [];
    const per = bbStats(scope === 'round' ? (cur.length ? cur : past.slice(-1)) : [...past, ...cur]);
    for (const id of ids) { const p = per[id] || { wins: 0, losses: 0, own: 0, votes: 0, king: 0, titles: 0 }; out.push(`${nm(id)}: ${p.titles} won · ${p.wins} contender wins · ${p.losses} losses · voted for their own ${p.own} · ${p.votes} votes · ${jumps(id)} Jumps`); }
  } else if (mode === 'law') {
    const per = lawStats(s, round).per;
    for (const id of ids) { const p = per[id] || { argued: 0, won: 0, lost: 0, wonDef: 0, wonOff: 0, gave: 0, votes: 0, flips: 0 }; out.push(`${nm(id)}: ${p.argued} cases argued · ${p.won} won (${p.wonDef} as defense, ${p.wonOff} as offense) · ${p.lost} lost · gave up ${p.gave} · ${p.votes} jury votes · switched sides ${p.flips} · ${jumps(id)} Jumps`); }
  } else if (mode === 'wyr') {
    const per = wyrStats(s, round).per;
    for (const id of ids) { const p = per[id] || { answers: 0, written: 0, split: 0, maj: 0, min: 0 }; out.push(`${nm(id)}: ${p.answers} answers · bigger side ${p.maj} · smaller side ${p.min}${p.written ? ` · their questions split ${pct(p.split / p.written)} evenly` : ''} · ${jumps(id)} Jumps`); }
  } else if (mode === 'sc') {
    const paras = s.sc ? s.sc.stories.flatMap(x => x.paras).filter(x => round === null || x.round === round) : [], per = scStats(paras);
    for (const id of ids) { const p = per[id] || { lines: 0, lvotes: 0, wvotes: 0 }; out.push(`${nm(id)}: ${p.lines} lines · ${p.lvotes} votes for their lines · ${p.wvotes} for their words · ${jumps(id)} Jumps`); }
  } else {
    for (const id of ids) { const st = statsFor(s, id, round); out.push(`${nm(id)}: ${st.n} answers · chose most ${st.most.length ? st.most.map(c => COLS[c]).join(', ') : '—'} · median ${signed(st.median)}${st.median !== null ? ` (${nameOfValue(st.median)})` : ''} · average ${st.avg === null ? '—' : signed(Math.round(st.avg * 10) / 10)} · ${jumps(id)} Jumps`); }
  }
  return out.join('\n');
}

/* forgame: show the settings, change them, or mute */
const STAGES = [...new Set(Object.values(STAGE))];
const SHARES = { everyone: 1, all: 1, half: .5, '2/3': .67, 'two-thirds': .67, '3/4': .75, 'three-quarters': .75 };
function forgameShow(s) {
  const o = s.options, t = v => v ? v + ' s' : 'off', sh = o.share === 1 ? 'everyone' : Object.keys(SHARES).find(k => SHARES[k] === o.share && k.includes('/')) || pct(o.share);
  const mutes = (s.gmutes || []).filter(m => m.on).map(m => `${m.who.filter(id => s.players[id] || npcById(id)).map(id => s.players[id] ? pname(s, id) : npcById(id).name).join(', ')} (${m.kinds.join(', ')}${m.turns ? `, ${m.turns} turns` : ''}${m.stages && m.stages.length ? `, in ${m.stages.join(' ')}` : ''})`);
  return [`${modeOf(o.mode).name} on ${mapName(o.map)}${s.phase === 'lobby' ? ' (in the lobby)' : o.mode === 'hang' ? ', hanging out' : `, round ${s.round + 1}`}`,
    `  timers:    writing ${t(o.submitTime)} · answer ${o.answerOff ? 'off' : t(o.answerTime)} · catch-up ${t(o.catchUp)}`,
    `  turn-end:  ${sh}`,
    `  order ${o.order} · freeroam ${o.freeRoam ? 'on' : 'off'} · gravity ${o.lowGravity ? 'low' : 'normal'} · silly ${o.fun ? 'on' : 'off'}${o.mode === 'hang' ? '' : ` · justin ${o.justin ? 'on' : 'off'}`}`,
    `  mutes for everyone: ${mutes.join('; ') || 'none'}`].join('\n');
}
function forgame(x, args) {
  const ctx = x.ctx, s = needRoom(ctx), a0 = (args[0] || '').toLowerCase(), onOff = args.find(a => /^(on|off)$/i.test(a)), on = /^on$/i.test(onOff || '');
  if (a0 === 'show' || !args.length) return forgameShow(s);
  if (s.phase === 'lobby') fail('✗ forgame works during a game (in the lobby, the Game options do this).');
  const set = v => { needMay(x, 'cansettings', 'forgame'); ctx.room.send({ t: 'forgame', set: v }); };
  if (a0 === 'all-timer') { if (!onOff) fail('✗ forgame all-timer off (or on)'); set(on ? { catchUp: 15, answerTime: 30, answerOff: 0 } : { catchUp: 0, answerTime: 0, submitTime: 0, answerOff: 1 }); return `Every timer ${on ? 'on' : 'off'} for the rest of the game.`; }
  if (a0 === 'timer') {
    const which = args.slice(1).find(a => !/^(on|off|\d+)$/i.test(a)), secs = +(args.find(a => /^\d+$/.test(a)) || 0);
    if (!onOff || !which) fail('✗ forgame timer off|on catch-up | answer | writing [seconds]');
    if (secs && ![15, 30, 45, 60, 90, 120].includes(secs)) fail('✗ seconds: 15, 30, 45, 60, 90 or 120');
    const v = { 'catch-up': { catchUp: on ? secs || 15 : 0 }, answer: on ? { answerTime: secs || 30, answerOff: 0 } : { answerTime: 0, answerOff: 1 }, writing: { submitTime: on ? secs || 90 : 0 } }[which.toLowerCase()];
    if (!v) fail('✗ catch-up, answer or writing'); set(v); return `The ${which} timer: ${on ? `on${secs ? `, ${secs} s` : ''}` : 'off'}.`;
  }
  if (a0 === 'turn-end') { const v = SHARES[(args[1] || '').toLowerCase()]; if (!v) fail('✗ forgame turn-end everyone | half | 2/3 | 3/4'); set({ share: v }); return `A turn now ends when ${v === 1 ? 'everyone is' : `${args[1]} of the players are`} done.`; }
  if (a0 === 'order') { const v = (args[1] || '').toLowerCase(); if (!['random', 'rotate'].includes(v)) fail('✗ forgame order random | rotate'); set({ order: v }); return `Questions now come in ${v === 'random' ? 'a random order' : 'turn'}.`; }
  if (['freeroam', 'silly'].includes(a0)) { if (!onOff) fail(`✗ forgame ${a0} on | off`); set({ [a0 === 'silly' ? 'fun' : 'freeRoam']: on ? 1 : 0 }); return `${a0 === 'silly' ? 'Silly commands' : 'Free roam'} ${on ? 'on' : 'off'}.`; }
  if (a0 === 'justin') { if (!onOff) fail('✗ forgame justin on | off'); if (s.options.mode === 'hang') fail('✗ Justin already lives in Duck Cabin.'); set({ justin: on ? 1 : 0 }); return `Justin ${on ? 'on: he walks the board' : 'off'}.`; }
  if (a0 === 'gravity') { const v = (args[1] || '').toLowerCase(); if (!['low', 'normal'].includes(v)) fail('✗ forgame gravity low | normal'); set({ lowGravity: v === 'low' ? 1 : 0 }); return `Gravity: ${v}.`; }
  const mi = args.findIndex(a => /^\\mute$/i.test(a)); if (mi < 0) fail(`✗ ${MAN.forgame}`);
  needMay(x, 'canmute', 'forgame');
  const pre = args.slice(0, mi), post = args.slice(mi + 1), mute = { on: false, kinds: [], who: [], turns: 0, stages: [], count: 0 };
  for (let i = 0; i < pre.length; i++) {
    const w = pre[i].toLowerCase(), r = w.match(/^(?:rounds|turns)(\d+)$/), st = w.match(/^stage(\d*)$/);
    if (r) mute.turns = +r[1];
    else if (st) { mute.count = +st[1] || 0; while (STAGES.includes((pre[i + 1] || '').toLowerCase())) mute.stages.push(pre[++i].toLowerCase()); if (!mute.stages.length) fail(`✗ stage: then ${STAGES.join(', ')}`); }
    else fail(`✗ ${pre[i]}? Before \\mute: roundsN, stage or stageN and the stages.`);
  }
  for (const w of post) {
    if (/^(on|off)$/i.test(w)) mute.on = /^on$/i.test(w);
    else if (w.startsWith('@')) { const n = !ctx.room.state.seat.some(i => tag(ctx.room.state.players[i].name).toLowerCase() === w.slice(1).toLowerCase()) && npcByTag(w.slice(1)); mute.who.push(...(n ? [n.id] : who(ctx, [w]))); }   // (Justin and the other characters too)
    else if (/^all$/i.test(w)) mute.kinds.push('bubble', 'ping', 'text');
    else if (['bubble', 'ping', 'text'].includes(w.toLowerCase())) mute.kinds.push(w.toLowerCase());
    else fail(`✗ ${w}? \\mute on|off, then bubble, ping, text or all, then @names.`);
  }
  if (!post.some(w => /^(on|off)$/i.test(w)) || !mute.kinds.length || !mute.who.length) fail('✗ \\mute on|off, then bubble, ping, text or all, then @names.');
  ctx.room.send({ t: 'forgame', mute });
  return `${mute.on ? 'Muted' : 'Unmuted'} ${[...new Set(mute.kinds)].join(', ')} for everyone${mute.turns ? `, for ${mute.turns} turns` : ''}${mute.stages.length ? `, in ${mute.count ? `the next ${mute.count} ` : 'the '}${mute.stages.join(', ')} stage${mute.count === 1 && mute.stages.length === 1 ? '' : 's'}` : ''}.`;
}

/* send: posts what a command prints (or a file, or what came through |) to the chat */
async function send(args, stdin, x) {
  const { ctx, meta, rs } = x, s = needRoom(ctx), me = ctx.room.me, targets = [];
  const toks = [...args]; while (toks.length && /^\\?@/.test(toks[0])) targets.push(toks.shift());
  if (!targets.length) fail(`✗ ${MAN.send}`);
  if (denied(s, me, 'nochat')) fail('✗ send: your group can\'t chat.');
  if (denied(s, me, 'nosend')) fail('✗ send: your group can\'t send from the command line.');
  const wait = ctx.slowLeft(); if (wait > 0) fail(`✗ send: slow down: one message every ${Math.round(slowMs(s, me) / 1000)} seconds (${Math.ceil(wait / 1000)} s).`);
  if (++rs.sends > 3) fail('✗ send: 3 sends a line at most.');
  const pub = targets.filter(t => t.startsWith('@')), priv = targets.filter(t => t.startsWith('\\@'));
  const privIds = who(ctx, priv), pubIds = pub.filter(t => t.toLowerCase() !== '@everyone');
  if (pubIds.length) who(ctx, pubIds);
  /* a file by itself: its name goes, and its words (only sudo, its group or everyone can open them, as chmod says) */
  let body, file = null, cmd, extra = {};
  if (!toks.length && !stdin && !/\|\s*send\b/.test(meta.pipeRaw || '') && !/<|<<</.test(meta.raw || '')) fail(`✗ send: nothing to send. ${MAN.send}`);
  if (!toks.length) { body = stdin; cmd = (meta.pipeRaw || '').replace(/\|\s*send\b[^|]*$/, '').trim() || 'send'; }
  else if (toks.length === 1 && !isCommand(toks[0], ctx) && kind(findPath(toks[0])) === 'file') {
    const path = findPath(toks[0]), m = fs.meta[path] || {};
    body = readFile(toks[0]); file = toks[0].split('/').pop(); cmd = toks[0];
    if (m.o) extra.pub = true; else if (m.g && m.grp) extra.grp = m.grp;
  } else if (toks.length === 1 && !isCommand(toks[0], ctx)) fail(`✗ send: ${toks[0]}: no such file or command (ls shows your files).`);
  else {
    const r = await one(toks, stdin, meta, ctx, rs);
    body = r && typeof r === 'object' ? r.out || '' : r ?? '';
    cmd = (meta.raw || '').replace(/^\s*(?:sudo\s+)?send(\s+\\*@\S+)+\s*/, '') || toks.join(' ');
  }
  body = String(body).replace(/\n+$/, '');
  if (!body.trim()) body = file ? '(empty)' : '(no output)';
  const msg = { t: 'chat', text: (pubIds.length ? pubIds.join(' ') + '\n' : '') + body, cmd, ...(file ? { file, ...extra } : {}) };
  if (pub.length) ctx.room.send(msg);
  for (const id of privIds) ctx.room.send({ ...msg, to: id });
  ctx.sent();
  return `Sent to ${targets.join(' ')}.`;
}

/* ---------- people, the room and the game ---------- */
const FORTUNES = [
  'A duck who quacks first quacks last.', 'Walk to the tile in your heart, not the tile with the most ducks.', 'Today\'s vote is tomorrow\'s argument.',
  'Even a rubber duck makes waves.', 'The Round Lord is watching. Act natural.', 'Ending your turn early is a kind of courage.',
  'Bread is temporary. Friendship is forever.', 'A jump a day keeps the lobby away.', 'Never trust a duck in a ski mask.',
  'If you disagree loudly enough, it counts as two votes. (It does not.)', 'Behind every great bracket is a contender nobody expected.',
  'Quack twice before you hit Enter.', 'The pond is wide, but the chat is wider.',
];
function ducksay(text) {
  const words = String(text).split(/\s+/).filter(Boolean), rows = [];
  let cur = '';
  for (const w of words) { if (cur && (cur + ' ' + w).length > 36) { rows.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
  if (cur || !rows.length) rows.push(cur);
  const W = Math.max(...rows.map(r => r.length));
  const box = rows.length === 1 ? [`< ${rows[0]} >`] : rows.map((r, i) => `${i === 0 ? '/' : i === rows.length - 1 ? '\\' : '|'} ${r.padEnd(W)} ${i === 0 ? '\\' : i === rows.length - 1 ? '/' : '|'}`);
  return [' ' + '_'.repeat(W + 2), ...box, ' ' + '-'.repeat(W + 2), '        \\', '         \\    __', '          \\ <(o )___', '             ( ._> /', '              `---\''].join('\n');
}
function cal(now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  const title = now.toLocaleString('en-US', { month: 'long' }) + ' ' + y, out = [title.padStart(10 + Math.ceil(title.length / 2)).trimEnd(), 'Su Mo Tu We Th Fr Sa'];
  let row = '   '.repeat(first);
  for (let d = 1; d <= days; d++) {
    row += String(d).padStart(2) + ' ';
    if ((first + d) % 7 === 0) { out.push(row.trimEnd()); row = ''; }
  }
  if (row) out.push(row.trimEnd());
  out.push(`Today: ${now.toLocaleString('en-US', { weekday: 'long' })} the ${now.getDate()}${[, 'st', 'nd', 'rd'][now.getDate() % 10 * (Math.floor(now.getDate() / 10) !== 1)] || 'th'}.`);
  return out.join('\n');
}
function psLines(s, all) {
  const o = s.options, st = STAGE[s.phase] || 'lobby', now = Date.now(), n = s.seat.length, done = s.seat.filter(id => s.done && s.done[id]).length;
  const out = ['PID WHAT     DOING', `  1 game     ${modeOf(o.mode).name} on ${mapName(o.map)}${s.phase === 'lobby' ? ', in the lobby' : o.mode === 'hang' ? ', hanging out' : `, round ${s.round + 1}`}`];
  if (s.phase !== 'lobby' && !(o.mode === 'hang' && s.phase === 'hang')) out.push(`  2 ${st.padEnd(8)} ${['answer', 'discuss', 'results', 'bracket'].includes(s.phase) || s.done ? `${done} of ${n} have ended their turn` : ''}`);
  if (s.ends && s.ends > now) out.push(`  3 timer    ${left(s.ends - now)} left`);
  if (s.catchEnds && s.catchEnds > now) out.push(`  4 catch-up ${left(s.catchEnds - now)} left for the rest`);
  if (s.vote) out.push(`  5 vote     ${s.vote.kind} vote, ${Object.keys(s.vote.yes).length} yes · ${Object.keys(s.vote.no).length} no`);
  if (all) {
    out.push('', table([['PLAYER', 'STATE'], ...s.seat.map(id => { const p = s.players[id]; return [pname(s, id), [p.bot ? 'computer' : '', p.idle ? 'away' : '', p.late ? 'plays next turn' : '', s.done && s.done[id] ? 'turn ended' : s.phase === 'lobby' ? (p.ready ? 'ready' : 'not ready') : st].filter(Boolean).join(' · ')]; })]));
  }
  return out.join('\n');
}
const pingOf = (ctx, p) => p.bot ? 'computer' : !ctx.room.online ? 'same device' : p.ms == null ? '… ms' : p.ms + ' ms';
const allJumps = st => Object.values(st || {}).reduce((a, m) => a + ((m && m.jumps) || 0), 0);
function topLines(ctx) {
  const s = needRoom(ctx), up = s.startedAt && s.phase !== 'lobby' ? Math.floor((Date.now() - s.startedAt) / 60000) : 0, J = s.jumps || {};
  const ids = [...s.seat].sort((a, b) => (J[b] || 0) - (J[a] || 0));
  return [`top - ${new Date().toTimeString().slice(0, 8)} up ${Math.floor(up / 60)}:${String(up % 60).padStart(2, '0')}, ${s.seat.length} players, ${STAGE[s.phase] || 'lobby'}`, '', table([['PLAYER', 'JUMPS', 'PING'], ...ids.map(id => [pname(s, id), J[id] || 0, pingOf(ctx, s.players[id]) + (s.players[id].idle ? ' · away' : '')])], [1])].join('\n');
}
function lastLines(s) {
  const rows = [];
  for (const m of [...(s.log || [])].reverse()) {
    if (!m.sys) continue;
    let r;
    if ((r = m.text.match(/^(.+) joined\.$/))) rows.push([tag(r[1]), 'came in', clock(m.t)]);
    else if ((r = m.text.match(/^(.+) left\.$/))) rows.push([tag(r[1]), 'left', clock(m.t)]);
    else if ((r = m.text.match(/^.+ removed (.+) from the room\.$/))) rows.push([tag(r[1]), 'removed', clock(m.t)]);
  }
  const first = (s.log || [])[0];
  return (rows.length ? table(rows) + '\n\n' : '') + `The room's log begins ${first ? clock(first.t) : 'now'}.`;
}
function finger(ctx, id) {
  const s = ctx.room.state, p = s.players[id], d = p.duck || {}, c = p.card || {}, ns = p.nameStyle || {}, sp = keysOf(d).map((id, i) => id && `${KEYS[i]} ${specialById(id).name}`).filter(Boolean).join(', ');
  const pretty = v => v ? String(v).replace(/[-_]/g, ' ') : 'none';
  return [`Login: ${pname(s, id)}${id === s.hostId ? ' (host)' : isSudo(s, id) ? ' (sudo)' : ''}${p.bot ? ' (a computer)' : ''}`,
    `Duck:  ${d.image ? 'a picture' : `${styleById(d.style).name || pretty(d.style)}, ${d.color || '?'}`} · hat ${d.hat ? (hatById(d.hat.id || d.hat) || {}).name || pretty(d.hat.id || d.hat) : 'none'} · outfit ${d.outfit ? (outfitById(d.outfit.id || d.outfit) || {}).name || pretty(d.outfit.id || d.outfit) : 'none'} · specials ${sp || 'none'}`,
    `Card:  ${c.kind === 'image' ? 'a picture' : `${c.color || '?'}, pattern ${pretty(c.pattern)}`}`,
    `Font:  ${(FONTS.find(f => f.id === ns.font) || FONTS[0]).name}${ns.rainbow ? ', rainbow' : ns.color ? ', ' + ns.color : ''}`,
    `Groups: ${[...groupsOf(s, id), 'superuser-' + pname(s, id)].join(', ')}`,
    `${p.joined ? `In the room since ${clock(p.joined)}` : 'In the room'} · ${(s.jumps || {})[id] || 0} Jumps this game · ${pingOf(ctx, p)}${p.idle ? ' · away' : ''}`].join('\n');
}

/* ---------- the commands: (args, stdin, x) → the output; x: ctx, sudo, meta, rs (this line's counts) ---------- */
const CMDS = {
  help: args => {
    const t = args.join('-').toLowerCase();
    if (!t) return helpIndex();
    if (t === 'all') return `Every command (man <command> for one):\n${[...new Set([...MINE, ...BUILTIN_NAMES])].sort().join(' ')}\nand the chat's \\mute \\permmute \\show.\nThe Help pages: ${HELP_NAMES.join(' ')}`;
    const p = (t === 'help' && helpPage('help-help')) || helpPage(t); if (p) return p;
    if (MAN[args[0]] || MAN[args[0].toLowerCase()]) return MAN[args[0]] || MAN[args[0].toLowerCase()];
    fail(`✗ help: no page ${args.join(' ')}. help lists them.`);
  },
  man: args => {
    if (args[0] === '-k') { const w = (args[1] || '').toLowerCase(); if (!w) fail('✗ man -k word'); const hit = Object.entries(MAN).filter(([k, v]) => k.includes(w) || v.toLowerCase().includes(w)); return hit.length ? hit.map(([k, v]) => `${k.padEnd(11)} - ${v.split(': ').slice(1).join(': ').split('. ')[0]}`).join('\n') : { out: `${w}: nothing appropriate.`, code: 1 }; }
    if (!args[0]) return 'What manual page do you want? man <command> (help lists them; man -k word searches).';
    return MAN[args[0]] || MAN[args[0].toLowerCase()] || helpPage(args.join('-')) || fail(`✗ No manual entry for ${args[0]} (help lists the Help pages)`);
  },
  apropos: (args, i, x) => CMDS.man(['-k', ...args], i, x),
  /* the secret codes (kept out of help, /bin and Tab): Secret <code> on|off */
  secret: (args, i, x) => { const msg = secret(args[0], (args[1] || '').toLowerCase()); if (x.ctx.look) x.ctx.look(); return msg; },
  clear: () => null,
  exit: (a, i, x) => { x.ctx.close(); return ''; },
  pwd: () => fs.cwd,
  cd: args => {
    const to = args[0] === '-' ? fs.old || fs.cwd : args[0] ? resolve(args[0]) : fs.home, k = kind(to);
    if (k !== 'dir') fail(`✗ cd: ${args[0]}: ${k ? 'Not a directory' : 'No such file or directory'}`);
    if (to.startsWith('/usr/') && to.split('/').length > 3 && !to.startsWith(fs.home)) guard(to, false);
    fs.old = fs.cwd; fs.cwd = to; return args[0] === '-' ? to : '';
  },
  ls: args => {
    const { o, rest } = getopt(args, 'al1R', 'ls'), paths = rest.length ? rest : ['.'], out = [];
    const show = (p, label) => {
      const path = p === '.' ? fs.cwd : findPath(p), k = kind(path);
      if (!k) fail(`✗ ls: cannot access '${p}': No such file or directory`);
      if (k === 'file') { out.push(o.l ? table([longRow(path, p)], [3]) : p); return; }
      let names = list(path); if (o.a) names = ['./', '../', ...names];
      if (label) out.push(`${label}:`);
      if (o.l) { out.push(`total ${names.length}`); if (names.length) out.push(table(names.map(n => longRow(n.startsWith('.') ? path : `${path === '/' ? '' : path}/${n.replace(/\/$/, '')}`, n)), [3])); }
      else out.push(names.join(o[1] ? '\n' : '  '));
      if (o.R) for (const n of names.filter(n => n.endsWith('/') && !n.startsWith('.'))) { const sub = `${path === '/' ? '' : path}/${n.slice(0, -1)}`; try { out.push(''); show(sub, sub); } catch { /* not yours */ } }
    };
    paths.forEach(p => show(p, paths.length > 1 || o.R ? (p === '.' ? fs.cwd : p) : ''));
    return out.join('\n');
  },
  touch: args => { if (!args.length) fail('✗ touch: missing file operand'); for (const a of args) { const p = resolve(a); if (!kind(p)) writeFile(a, '', true); else fs.meta[p] = { ...(fs.meta[p] || {}), t: Date.now() }; } return ''; },
  mkdir: args => {
    const { o, rest } = getopt(args, 'p', 'mkdir'); if (!rest.length) fail('✗ mkdir: missing operand');
    for (const a of rest) {
      const p = resolve(a); guard(p, true);
      if (!p.startsWith(fs.home + '/notes/')) fail(`✗ mkdir: ${a}: folders go in your notes.`);
      if (kind(p)) { if (o.p) continue; fail(`✗ mkdir: cannot create directory '${a}': File exists`); }
      const parent = p.slice(0, p.lastIndexOf('/'));
      if (kind(parent) !== 'dir') { if (!o.p) fail(`✗ mkdir: cannot create directory '${a}': No such file or directory`); let q = fs.home + '/notes'; for (const part of parent.slice(q.length + 1).split('/')) { q += '/' + part; if (kind(q) === 'file') fail(`✗ mkdir: ${q}: Not a directory`); fs.dirs.add(q); } }
      fs.dirs.add(p); fs.meta[p] = { t: Date.now() };
    }
    return '';
  },
  rmdir: args => { for (const a of args) { const p = findPath(a); guard(p, true); if (kind(p) !== 'dir' || !fs.dirs.has(p)) fail(`✗ rmdir: ${a}: ${kind(p) ? 'that folder stays' : 'No such file or directory'}`); if (list(p).length) fail(`✗ rmdir: failed to remove '${a}': Directory not empty`); fs.dirs.delete(p); } return ''; },
  rm: args => {
    const { o, rest } = getopt(args, 'rRfi', 'rm'); if (!rest.length) fail('✗ rm: missing operand');
    for (const a of rest) {
      const p = findPath(a), k = kind(p);
      if (p === fs.home + '/perma-notes' || p === fs.home + '/notes' || p === fs.home) fail(`✗ rm: ${a}: that folder stays.`);
      if (!k) { if (o.f) continue; fail(`✗ rm: cannot remove '${a}': No such file or directory`); }
      guard(p, true);
      if (k === 'dir' && !o.r && !o.R) fail(`✗ rm: cannot remove '${a}': Is a directory (rm -r)`);
      removePath(p);
    }
    return '';
  },
  cp: args => {
    const { o, rest } = getopt(args, 'rRf', 'cp'); if (rest.length < 2) fail('✗ cp: usage: cp from to');
    const dst = rest.pop(), dk = kind(resolve(dst));
    if (rest.length > 1 && dk !== 'dir') fail(`✗ cp: target '${dst}' is not a directory`);
    for (const src of rest) {
      const sp = findPath(src), sk = kind(sp); guard(sp, false);
      if (!sk) fail(`✗ cp: cannot stat '${src}': No such file or directory`);
      const to = dk === 'dir' ? resolve(dst) + '/' + sp.split('/').pop() : resolve(dst);
      if (sk === 'file') { writeFile(to, readFile(src), false); continue; }
      if (!o.r && !o.R) fail(`✗ cp: -r not specified; omitting directory '${src}'`);
      CMDS.mkdir(['-p', to]);
      for (const f of Object.keys(fs.files).filter(f => f.startsWith(sp + '/'))) { const t = to + f.slice(sp.length); CMDS.mkdir(['-p', t.slice(0, t.lastIndexOf('/'))]); writeFile(t, fs.files[f], false); }
      for (const d of [...fs.dirs].filter(d => d.startsWith(sp + '/'))) fs.dirs.add(to + d.slice(sp.length));
    }
    return '';
  },
  mv: args => {
    const { rest } = getopt(args, 'f', 'mv'); if (rest.length < 2) fail('✗ mv: usage: mv from to');
    const dst = rest.pop(), dk = kind(resolve(dst));
    for (const src of rest) {
      const sp = findPath(src); guard(sp, true);
      if (sp === fs.home + '/log' || sp === fs.home + '/notes' || sp === fs.home + '/perma-notes') fail(`✗ mv: ${src}: that stays where it is.`);
      if (!kind(sp)) fail(`✗ mv: cannot stat '${src}': No such file or directory`);
      const to = dk === 'dir' ? resolve(dst) + '/' + sp.split('/').pop() : resolve(dst);
      if (to === sp || to.startsWith(sp + '/')) fail(`✗ mv: cannot move '${src}' into itself`);
      CMDS.cp(['-r', src, to]); fs.meta[to] = { ...(fs.meta[sp] || {}), t: Date.now() }; removePath(sp);
    }
    return '';
  },
  tree: args => {
    const root = args[0] ? findPath(args[0]) : fs.cwd; if (kind(root) !== 'dir') fail(`✗ tree: ${args[0]}: not a folder`);
    const out = [args[0] || '.']; let nd = 0, nf = 0;
    const walk = (p, pre) => { let names; try { names = list(p); } catch { return; } names.forEach((n, i) => { const lastOne = i === names.length - 1, sub = `${p === '/' ? '' : p}/${n.replace(/\/$/, '')}`; out.push(pre + (lastOne ? '└── ' : '├── ') + n.replace(/\/$/, '')); if (n.endsWith('/')) { nd++; if (!sub.startsWith('/usr/') || sub.startsWith(fs.home)) walk(sub, pre + (lastOne ? '    ' : '│   ')); } else nf++; }); };
    walk(root, '');
    return out.join('\n') + `\n\n${nd} director${nd === 1 ? 'y' : 'ies'}, ${nf} file${nf === 1 ? '' : 's'}`;
  },
  find: args => {
    const start = args[0] && !args[0].startsWith('-') ? args.shift() : '.', root = start === '.' ? fs.cwd : findPath(start);
    let name = null, type = null;
    for (let i = 0; i < args.length; i++) { if (args[i] === '-name' || args[i] === '-iname') { name = globRe(args[++i] || ''); if (args[i - 1] === '-iname') name = new RegExp(name.source, 'i'); } else if (args[i] === '-type') type = args[++i]; else fail(`✗ find: unknown predicate '${args[i]}'`); }
    if (!kind(root)) fail(`✗ find: '${start}': No such file or directory`);
    const out = [], ok = (p, k) => (!name || name.test(p.split('/').pop())) && (!type || (type === 'd' ? k === 'dir' : k === 'file'));
    const walk = (p, shown) => { const k = kind(p); if (ok(p, k)) out.push(shown); if (k !== 'dir') return; let names; try { names = list(p); } catch { return; } for (const n of names) { const b = n.replace(/\/$/, ''), sub = `${p === '/' ? '' : p}/${b}`; if (sub.startsWith('/usr/') && sub.split('/').length > 3 && !sub.startsWith(fs.home)) continue; walk(sub, `${shown === '/' ? '' : shown}/${b}`); } };
    walk(root, start);
    return out.join('\n');
  },
  stat: args => {
    if (!args.length) fail('✗ stat: missing operand');
    return args.map(a => { const p = findPath(a), k = kind(p); if (!k) fail(`✗ stat: cannot stat '${a}': No such file or directory`); guard(p, false); const m = fs.meta[p] || {}, l = longRow(p, a); return [`  File: ${a}`, `  Size: ${size(p)}\t${k === 'dir' ? 'directory' : size(p) ? 'regular file' : 'regular empty file'}`, `Access: (${l[0]})  Owner: ${owner(p)}  Group: ${l[2]}`, `Modify: ${m.t ? new Date(m.t).toString().replace(/ \(.*\)$/, '') : '-'}`].join('\n'); }).join('\n');
  },
  file: args => args.map(a => { const p = findPath(a), k = kind(p); if (!k) return `${a}: cannot open (No such file or directory)`; if (p.startsWith('/bin/')) return `${a}: a DuckFriends command (nobody can open it)`; if (k === 'dir') return `${a}: directory`; guard(p, false); const t = readFile(a); return `${a}: ${t ? `text, ${lines(t).length} line${lines(t).length === 1 ? '' : 's'}` : 'empty'}`; }).join('\n'),
  chmod: args => {
    const [mode, ...files] = args; if (!mode || !files.length) fail(`✗ chmod: usage: ${MAN.chmod}`);
    const set = {}, nm = mode.match(/^[0-7]?([67])([0-7])([0-7])$/);
    if (nm) { set.g = +nm[2] >= 4; set.o = +nm[3] >= 4; }
    else for (const part of mode.split(',')) { const m = part.match(/^([ugoa]*)([+-=])([rwx]+)$/); if (!m) fail(`✗ chmod: invalid mode: '${mode}'`); if (!m[3].includes('r')) continue; const on = m[2] !== '-', who = m[1] || 'a'; if (/[ga]/.test(who)) set.g = on; if (/[oa]/.test(who)) set.o = on; }
    for (const f of files) { const p = findPath(f); guard(p, true); if (kind(p) !== 'file') fail(`✗ chmod: cannot access '${f}': No such file`); if (isPerma(p)) fail(`✗ chmod: ${f}: perma-notes stay private (only superuser-${owner(p)}).`); fs.meta[p] = { ...(fs.meta[p] || {}), ...set }; }
    return '';
  },
  chgrp: (args, i, x) => {
    const [g, ...files] = args, s = needRoom(x.ctx), me = x.ctx.room.me; if (!g || !files.length) fail('✗ chgrp: usage: chgrp group file');
    const G = roomGroups(s); if (!G[g.toLowerCase()]) fail(`✗ chgrp: invalid group: '${g}'`);
    if (!isSudo(s, me) && !groupsOf(s, me).includes(g.toLowerCase())) fail(`✗ chgrp: changing group of '${files[0]}': Operation not permitted (you aren't in ${g})`);
    for (const f of files) { const p = findPath(f); guard(p, true); if (kind(p) !== 'file') fail(`✗ chgrp: cannot access '${f}': No such file`); if (isPerma(p)) fail(`✗ chgrp: ${f}: perma-notes stay in superuser-${owner(p)}.`); fs.meta[p] = { ...(fs.meta[p] || {}), grp: g.toLowerCase() }; }
    return '';
  },
  history: args => { if (args[0] === '-c') { fs.hist = []; return ''; } const n = +args[0] || fs.hist.length, from = Math.max(0, fs.hist.length - n); return fs.hist.slice(from).map((h, i) => `${String(from + i + 1).padStart(4)}  ${h}`).join('\n'); },
  sleep: async (args, i, x) => { const n = parseFloat(args[0]); if (!(n >= 0)) fail('✗ sleep: usage: sleep seconds'); if (n > 30) fail('✗ sleep: 30 seconds at most here'); await wait(n * 1000, x.ctx); if (x.ctx.cancelled()) fail('^C', 130); return ''; },
  /* people */
  whoami: (a, i, x) => x.ctx.meName,
  id: (args, i, x) => {
    const { o, rest } = getopt(args, 'gGnu', 'id'), s = needRoom(x.ctx), [id] = rest.length ? who(x.ctx, rest) : [x.ctx.room.me], n = pname(s, id), gs = [...groupsOf(s, id), 'superuser-' + n];
    if (o.u) return n; if (o.g) return gs[0]; if (o.G) return gs.join(' ');
    return `uid=${n} gid=${gs[0]} groups=${gs.join(',')}`;
  },
  groups: (args, i, x) => { const s = needRoom(x.ctx), [id] = args.length ? who(x.ctx, args) : [x.ctx.room.me]; return [...groupsOf(s, id), 'superuser-' + pname(s, id)].join(' '); },
  members: (args, i, x) => {
    const s = needRoom(x.ctx), g = (args[0] || '').toLowerCase(); if (!g) fail('✗ members <group>');
    if (g.startsWith('superuser-')) return g.slice(10);
    if (!roomGroups(s)[g]) fail(`✗ members: no group ${g}. getent group lists them.`);
    return s.seat.filter(id => groupsOf(s, id).includes(g)).map(id => pname(s, id)).join(' ') || '(nobody)';
  },
  getent: (args, i, x) => {
    if ((args[0] || '') !== 'group') fail('✗ getent group [group]');
    const s = needRoom(x.ctx), G = roomGroups(s), line = g => `${g}:x:${s.seat.filter(id => groupsOf(s, id).includes(g)).map(id => pname(s, id)).join(',')}:${(G[g].perms || []).join(',')}`;
    if (!args[1]) return Object.keys(G).map(line).join('\n');
    const g = args[1].toLowerCase(); if (g.startsWith('superuser-')) return `${g}:x:${g.slice(10)}:`;
    if (!G[g]) return { out: '', code: 2 };
    return line(g);
  },
  users: (a, i, x) => { const s = needRoom(x.ctx); return s.seat.map(id => pname(s, id)).sort().join(' '); },
  who: (a, i, x) => { const s = needRoom(x.ctx); return table(s.seat.map(id => [pname(s, id), [id === s.hostId ? 'host' : '', isSudo(s, id) ? 'sudo' : '', s.players[id].bot ? 'computer' : ''].filter(Boolean).join(', ')])); },
  w: (a, i, x) => {
    const s = needRoom(x.ctx), up = s.startedAt && s.phase !== 'lobby' ? Math.floor((Date.now() - s.startedAt) / 60000) : 0, st = STAGE[s.phase] || 'lobby';
    return [` ${new Date().toTimeString().slice(0, 8)} up ${Math.floor(up / 60)}:${String(up % 60).padStart(2, '0')}, ${s.seat.length} players, ${st}`, table([['PLAYER', 'PING', 'WHAT'], ...s.seat.map(id => { const p = s.players[id]; return [pname(s, id) + (id === s.hostId ? '*' : ''), pingOf(x.ctx, p), [p.idle ? 'away' : '', p.late ? 'waits for the next turn' : s.done && s.done[id] ? 'ended their turn' : s.phase === 'lobby' ? (p.ready ? 'ready' : 'not ready') : st].filter(Boolean).join(' · ')]; })]), '(* the host)'].join('\n');
  },
  finger: (args, i, x) => { const s = needRoom(x.ctx), ids = args.length ? who(x.ctx, args) : [x.ctx.room.me]; return ids.map(id => finger(x.ctx, id)).join('\n\n'); },
  last: (a, i, x) => lastLines(needRoom(x.ctx)),
  write: (args, i, x) => {
    const s = needRoom(x.ctx), me = x.ctx.room.me; if (!args[0] || !args[0].startsWith('@') || args.length < 2) fail('✗ write: usage: write @name message');
    const [to] = who(x.ctx, [args[0]]);
    if (denied(s, me, 'nochat')) fail('✗ write: your group can\'t chat.');
    if (denied(s, me, 'nosend')) fail('✗ write: your group can\'t send from the command line.');
    const w = x.ctx.slowLeft(); if (w > 0) fail(`✗ write: slow down (${Math.ceil(w / 1000)} s).`);
    if (++x.rs.sends > 3) fail('✗ write: 3 sends a line at most.');
    x.ctx.room.send({ t: 'chat', to, text: args.slice(1).join(' ').slice(0, 500) }); x.ctx.sent();
    return `To ${pname(s, to)}, privately.`;
  },
  sudo: () => fail('✗ usage: sudo <command> (sudo -l: what sudo lets you do)'),
  usermod: (args, i, x) => {   // usermod [-a | -r] -G group[,group] name… (a name with or without @)
    const as = x.as || 'usermod', s = needSudo(x, as), { o, rest: at } = getopt(args, 'arG:', 'usermod');
    if (!at.length) fail(`✗ ${MAN.usermod}`);
    const groups = o.G ? String(o.G).split(',').filter(Boolean).map(g => g.toLowerCase()) : ['sudo'], G = roomGroups(s);
    for (const g of groups) { if (g.startsWith('superuser-')) fail(`✗ ${as}: ${g} can't be changed, not even by its player.`); if (!G[g]) fail(`✗ ${as}: group '${g}' does not exist (getent group lists them)`); }
    const mode = !o.G ? 'add' : o.r ? 'remove' : o.a ? 'add' : 'set', ids = who(x.ctx, at);
    for (const id of ids) { if (id === s.hostId && groups.includes('sudo') && mode !== 'add') fail(`✗ ${as}: the host is always in sudo, and that can't be undone.`); x.ctx.room.send({ t: 'usermod', target: id, groups, mode }); }
    return `${mode === 'add' ? 'Added to' : mode === 'remove' ? 'Taken out of' : 'Set to'} ${groups.join(', ')}: ${ids.map(id => pname(s, id)).join(', ')}`;
  },
  gpasswd: (args, i, x) => {   // gpasswd -a name group, gpasswd -d name group
    needSudo(x, 'gpasswd'); const { o, rest } = getopt(args, 'a:d:', 'gpasswd'), at = o.a ?? o.d, g = rest[0];
    if (!at || !g || (o.a && o.d)) fail(`✗ ${MAN.gpasswd}`);
    return CMDS.usermod([o.a ? '-aG' : '-rG', g, at], i, { ...x, as: 'gpasswd' });
  },
  adduser: (args, i, x) => { const s = needSudo(x, 'adduser'), [at, g] = userGroup(args, s); if (!at || !g) fail(`✗ ${MAN.adduser}`); return CMDS.usermod(['-aG', g, at], i, { ...x, as: 'adduser' }); },
  deluser: (args, i, x) => { const s = needSudo(x, 'deluser'), [at, g] = userGroup(args, s); if (!at || !g) fail(`✗ ${MAN.deluser}`); return CMDS.usermod(['-rG', g, at], i, { ...x, as: 'deluser' }); },
  useradd: (args, i, x) => {   // the ducks are already here: useradd -G puts one in groups, like usermod -aG
    needSudo(x, 'useradd'); const { o, rest } = getopt(args, 'G:m', 'useradd');
    if (!o.G || !rest.length) fail(`✗ ${MAN.useradd}`);
    return CMDS.usermod(['-aG', o.G, ...rest], i, { ...x, as: 'useradd' });
  },
  userdel: (args, i, x) => { needSudo(x, 'userdel'); fail('✗ userdel: ducks can\'t be deleted. kick @name removes one from the room; usermod -rG group @name takes one out of a group.'); },
  groupadd: (args, i, x) => {
    const s = needSudo(x, 'groupadd'), { o, rest } = getopt(args, 'p:', 'groupadd'), perms = String(o.p || '').split(',').filter(Boolean), name = rest[0];
    if (!name) fail(`✗ ${MAN.groupadd}`);
    const why = groupNameWrong(name); if (why) fail(`✗ groupadd: '${name}' ${why}`);
    const bad = perms.filter(p => !permOk(p)); if (bad.length) fail(`✗ groupadd: ${bad.join(', ')}? Perms: ${GROUP_PERMS.join(', ')}, slow30`);
    if (roomGroups(s)[name.toLowerCase()]) fail(`✗ groupadd: group '${name}' already exists`);
    if (Object.keys(roomGroups(s)).length >= 20) fail('✗ groupadd: 20 groups at most');
    x.ctx.room.send({ t: 'groupadd', name: name.toLowerCase(), perms }); return `Group ${name.toLowerCase()}${perms.length ? ` (${perms.join(', ')})` : ''}. Add players: sudo usermod -aG ${name.toLowerCase()} @name`;
  },
  groupmod: (args, i, x) => {
    const s = needSudo(x, 'groupmod'), { o, rest } = getopt(args, 'n:p:', 'groupmod'), g = (rest[0] || '').toLowerCase(), G = roomGroups(s);
    if (!g || (o.n === undefined && o.p === undefined)) fail(`✗ ${MAN.groupmod}`);
    if (g.startsWith('superuser-')) fail(`✗ groupmod: ${g} can't be changed, not even by its player.`);
    if (!G[g]) fail(`✗ groupmod: group '${g}' does not exist`);
    if (['sudo', 'dumbasses'].includes(g)) fail(`✗ groupmod: ${g} stays as it is.`);
    if (o.n !== undefined) { const to = String(o.n).toLowerCase(); const why = groupNameWrong(to); if (why) fail(`✗ groupmod: '${o.n}' ${why}`); if (G[to]) fail(`✗ groupmod: group '${to}' already exists`); x.ctx.room.send({ t: 'groupmod', name: g, newName: to }); return `Renamed ${g} to ${to}.`; }
    const perms = String(o.p).split(',').filter(Boolean), bad = perms.filter(p => !permOk(p)); if (bad.length) fail(`✗ groupmod: ${bad.join(', ')}? Perms: ${GROUP_PERMS.join(', ')}, slow30`);
    x.ctx.room.send({ t: 'groupmod', name: g, perms }); return `${g}'s perms: ${perms.join(', ') || 'none'}.`;
  },
  groupdel: (args, i, x) => { const s = needSudo(x, 'groupdel'), g = (args[0] || '').toLowerCase(); if (!g) fail('✗ groupdel: usage: sudo groupdel group (getent group lists them)'); if (['sudo', 'dumbasses'].includes(g)) fail(`✗ groupdel: ${g} stays.`); if (g.startsWith('superuser-')) fail(`✗ groupdel: ${g} can't be removed.`); if (!roomGroups(s)[g]) fail(`✗ groupdel: group '${g}' does not exist`); x.ctx.room.send({ t: 'groupdel', name: g }); return `Removed ${g}.`; },
  newgrp: () => MAN.newgrp.split(': ')[1],
  visudo: () => fail(`✗ visudo: ${MAN.visudo.split(': ')[1]}`),
  su: () => fail(`✗ su: ${MAN.su.split(': ')[1]}`),
  passwd: () => fail('✗ passwd: Ducks don\'t have passwords.'),
  /* the room and the game */
  hostname: (args, i, x) => {
    const s = needRoom(x.ctx); if (!args.length) return s.name || 'DuckFriends';
    needSudo(x, 'hostname');
    const n = args.join(' ').replace(/\s+/g, ' ').trim().slice(0, 32); x.ctx.room.send({ t: 'roomName', name: n }); return `The room is now ${n}.`;
  },
  uname: (args, i, x) => { const s = x.ctx.room && x.ctx.room.state; if (!args.includes('-a')) return 'DuckFriends'; return `DuckFriends pond ${VERSION} ${s ? `${modeOf(s.options.mode).name} · ${mapName(s.options.map)}` : ''} duckbash`.replace(/\s+/g, ' '); },
  date: () => new Date().toString().replace(/ \(.*\)$/, ''),
  cal: () => cal(),
  uptime: (a, i, x) => { const s = needRoom(x.ctx); if (!s.startedAt || s.phase === 'lobby') return 'The game hasn\'t started.'; const m = Math.floor((Date.now() - s.startedAt) / 60000); return `up ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}, ${s.seat.length} players, round ${s.round + 1}`; },
  ps: (args, i, x) => psLines(needRoom(x.ctx), args.some(a => /a|u|x|-e/.test(a))),
  top: async (a, i, x) => {
    const { ctx } = x; needRoom(ctx);
    if (!x.meta.screen) return topLines(ctx);   // into a pipe or a file: once
    const t0 = Date.now();
    while (!ctx.cancelled() && Date.now() - t0 < 60000) { ctx.live(lines(topLines(ctx) + '\n(Ctrl+C to stop)')); await wait(1000, ctx); }
    ctx.live([]);
    return topLines(ctx);
  },
  jumps: (args, i, x) => { const s = needRoom(x.ctx), ids = args.length ? who(x.ctx, args) : [x.ctx.room.me]; return ids.map(id => `${pname(s, id)}: ${(s.jumps || {})[id] || 0} Jumps this game · ${allJumps(id === x.ctx.room.me ? profile.stats : s.players[id].stats) + ((s.jumps || {})[id] || 0)} of all time`).join('\n'); },
  ping: (args, i, x) => { const s = needRoom(x.ctx), ids = args.length ? who(x.ctx, args) : s.seat; return ids.map(id => `${pname(s, id)}: ${pingOf(x.ctx, s.players[id])}`).join('\n'); },
  roll: args => { const m = (args[0] || '1d6').match(/^(\d{0,2})d(\d{1,3})$/i); if (!m) fail('✗ roll NdM, like roll 2d6'); const n = Math.min(20, +m[1] || 1), k = Math.max(2, +m[2]), r = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * k)); return n > 1 ? `${r.join(' + ')} = ${r.reduce((a, b) => a + b, 0)}` : String(r[0]); },
  flip: () => Math.random() < .5 ? 'Heads' : 'Tails',
  ducksay: (args, stdin) => ducksay(args.length ? args.join(' ') : stdin.trim() || 'Quack.'),
  fortune: () => FORTUNES[Math.floor(Math.random() * FORTUNES.length)],
  skip: (args, i, x) => { const s = needMay(x, 'canskip', 'skip'); if (['lobby', 'over'].includes(s.phase)) fail('✗ skip works during a game.'); if (s.options.mode === 'hang') fail('✗ skip: Hangout has nothing to skip. The pause menu takes everyone back to the lobby.'); x.ctx.room.send({ t: 'skip' }); return 'Skipped ahead.'; },
  kick: (args, i, x) => {
    const s = needMay(x, 'cankick', 'kick'); if (!args.length) fail(`✗ ${MAN.kick}`);
    const out = [];
    for (const id of who(x.ctx, args)) { if (id === s.hostId) fail('✗ kick: nobody can kick the host.'); if (id === x.ctx.room.me) fail('✗ kick: you can\'t kick yourself (leave from the pause menu).'); x.ctx.room.send({ t: 'kick', who: id }); out.push(pname(s, id)); }
    return `Removed ${out.join(', ')}.`;
  },
  map: (args, i, x) => {
    const s = needRoom(x.ctx); if (!args.length) return table(MAPS.map(m => [m[0], m[1] + (m[0] === s.options.map ? '  (now)' : '')])) + `\nHangout brings its own: Duck Cabin${s.options.map === 'cabin' ? '  (now)' : ''}`;
    const id = args.join(' ').toLowerCase(), m = MAPS.find(v => v[0] === id || v[1].toLowerCase() === id || v[1].toLowerCase().startsWith(id)); if (!m) fail(/^(cabin|duck cabin)$/.test(id) ? '✗ map: Duck Cabin comes with Hangout: sudo mode hang' : `✗ map: no map ${args.join(' ')} (map lists them)`);
    needSudo(x, 'map'); if (s.options.mode === 'hang') fail('✗ map: Hangout is always in Duck Cabin.'); if (!['lobby', 'over'].includes(s.phase)) fail('✗ map: in the lobby.');
    x.ctx.room.send({ t: 'options', options: { map: m[0] } }); return `Map: ${m[1]}.`;
  },
  mode: (args, i, x) => {
    const s = needRoom(x.ctx); if (!args.length) return table(MODES.map(m => [m.id, m.name + (m.id === s.options.mode ? '  (now)' : '')]));
    const id = args.join(' ').toLowerCase(), m = MODES.find(v => v.id === id || v.name.toLowerCase() === id || v.name.toLowerCase().startsWith(id)); if (!m) fail(`✗ mode: no game type ${args.join(' ')} (mode lists them)`);
    needSudo(x, 'mode'); if (!['lobby', 'over'].includes(s.phase)) fail('✗ mode: in the lobby.');
    x.ctx.room.send({ t: 'options', options: { mode: m.id } }); return `Game: ${m.name}.`;
  },
  start: (a, i, x) => { const s = needSudo(x, 'start'); if (!['lobby', 'over'].includes(s.phase)) fail('✗ start: the game is already going.'); x.ctx.room.send({ t: 'start' }); return 'Starting…'; },
  forgame: (args, i, x) => forgame(x, args),
  song: (args, i, x) => songs(x, args),
  songs: (args, i, x) => songs(x, []),
  roundstats: (args, i, x) => statLines(x.ctx, 'round', args),
  gamestats: (args, i, x) => statLines(x.ctx, 'game', args),
  totalstats: (args, i, x) => statLines(x.ctx, 'total', args),
  send: (args, stdin, x) => send(args, stdin, x),
};
CMDS.logout = CMDS.exit;
/* the commands in /bin: everything with a manual page */
const MINE = [...new Set([...Object.keys(CMDS), ...Object.keys(TEXT)])].filter(k => k !== 'sudo' && k !== 'secret').sort();

/* the room's songs: everyone hears the same one; the host, sudo or cansettings can take songs off the list and put them
   back. A name with a space (or ' or ?) goes in quotes, as in bash: song off "Jester's Stair" */
const qn = n => /[\s'"?*\[\]$`\\|&;<>()]/.test(n) ? `"${n}"` : n;
function songs(x, args) {
  const s = needRoom(x.ctx), off = new Set((s.music && s.music.off) || []), np = music.nowPlaying(), names = music.tracks;
  const [sub, ...rest] = args;
  if (!sub || sub === 'list' || sub === '-l') return table(names.map(n => [qn(n), off.has(n) ? 'off' : 'on', np && np.name === n ? (np.next ? '(next)' : '(playing now)') : '']));
  if (sub === 'now') return np && np.name ? `${np.next ? `Next, in ${np.in} s` : 'Playing now'}: ${np.name}` : 'No song is on.';
  if (sub !== 'on' && sub !== 'off') fail(`✗ song: usage: song [list] · song now · song on|off name… · song on|off all (man song)`);
  needMay(x, 'cansettings', `song ${sub}`);
  if (!rest.length) fail(`✗ song ${sub}: which song? song lists them. A name with spaces goes in quotes: song ${sub} "Jester's Stair"`);
  if (rest.length === 1 && rest[0].toLowerCase() === 'all') {
    x.ctx.room.send(sub === 'on' ? { t: 'songs', all: 'on' } : { t: 'songs', off: names });
    return sub === 'on' ? 'Every song is on.' : 'Every song is off: no music until song on.';
  }
  const found = [];
  for (const w of rest) {
    const n = names.find(v => v.toLowerCase() === w.toLowerCase());
    if (n) { if (!found.includes(n)) found.push(n); continue; }
    const whole = names.find(v => v.toLowerCase() === rest.join(' ').toLowerCase()) || names.find(v => v.toLowerCase().startsWith(rest.join(' ').toLowerCase()));
    fail(whole && rest.length > 1 ? `✗ song: no song named ${w}. A name with spaces goes in quotes, as in bash: song ${sub} ${qn(whole)}`
      : `✗ song: no song named ${qn(w)} (song lists them)`);
  }
  x.ctx.room.send({ t: 'songs', [sub]: found });
  const playing = np && np.name && !np.next && found.includes(np.name);
  return `${sub === 'off' ? 'Off' : 'On'}: ${found.join(', ')}${/[.?!]$/.test(found[found.length - 1]) ? '' : '.'}${sub === 'off' && playing ? ' It stops now; the next song comes in 3 seconds.' : ''}${sub === 'off' && names.every(n => off.has(n) || found.includes(n)) ? ' Every song is off now.' : ''}`;
}

/* what sudo lets you do */
function sudoList(ctx) {
  const s = needRoom(ctx), me = ctx.room.me;
  if (!isSudo(s, me)) {
    const gives = Object.keys(PERMS_GIVE).filter(p => may(s, me, p));
    return { out: `${noSudo(ctx).slice(2)}${gives.length ? `\nYour groups give you: ${gives.map(p => `${p} (${PERMS_GIVE[p]})`).join(', ')}.` : ''}`, code: 1 };
  }
  return [`${ctx.meName} may run, as sudo:`, '  usermod useradd gpasswd adduser deluser groupadd groupmod groupdel hostname', '  skip, kick, forgame, map, mode, start, song on|off', '(Type sudo first: sudo skip.)', ...(me === s.hostId ? ['(You are the host: always in sudo.)'] : [])].join('\n');
}

/* ---------- running a command ---------- */
const isCommand = (name, ctx) => !!(isHelpName(name) || CMDS[name] || TEXT[name] || BUILTIN_NAMES.includes(name) || ctx.legacyHas(String(name).toLowerCase()) || name === 'sudo');
const dq = w => /\s/.test(w) ? `"${w}"` : w;
/* one command, its words already expanded (sudo first if given) */
async function one(argv, stdin, meta, ctx, rs) {
  let sudo = false, words = argv;
  if (words[0] === 'sudo') {
    const f = words[1] || '';
    if (f === '-l' || f === '--list') return sudoList(ctx);
    if (f === '-h' || f === '--help') return MAN.sudo;
    if (f === '-v' || f === '--validate') { if (!isSudo(needRoom(ctx), ctx.room.me)) fail(noSudo(ctx)); return ''; }
    if (f === '-k' || f === '-K') return '';
    if (/^-[is]$|^--(login|shell)$/.test(f)) fail('✗ sudo: there is no sudo shell here. Put sudo in front of each command (sudo -l lists them).');
    if (/^-u|^--user/.test(f)) fail('✗ sudo: -u: there is nobody else to be here. sudo <command> runs it as sudo.');
    if (f.startsWith('-')) fail(`✗ sudo: invalid option '${f}' (sudo -l, sudo -v, sudo -h, or sudo <command>)`);
    sudo = true; words = words.slice(1); if (!words.length) fail('✗ usage: sudo <command>');
    const s = needRoom(ctx); if (!isSudo(s, ctx.room.me)) fail(noSudo(ctx));
  }
  const [c, ...args] = words, low = c.toLowerCase();
  if (/^\\(mute|permmute|show|togglesuggest)$/i.test(c)) return ctx.chat(words.map(dq).join(' '));
  const x = { ctx, sudo, meta, rs };
  if (isHelpName(c)) return helpPage([c, ...args].join('-')) || helpPage(c);   // HelpChat, HelpGame-How, HelpGame How
  if (args.includes('--help') && MAN[low] && (CMDS[low] || TEXT[low])) return `${MAN[low]}\n(man ${low} shows the same; help lists the Help pages.)`;
  if (CMDS[c] || CMDS[low]) return CMDS[c] ? CMDS[c](args, stdin, x) : CMDS[low](args, stdin, x);
  if (TEXT[c] || TEXT[low]) return (TEXT[c] || TEXT[low])(args, stdin, IO);
  if (ctx.legacyHas(low)) {
    if (FUN.includes(low)) {   // the silly commands: 3 a line at most, a second apart
      if (++rs.fun > 3) fail(`✗ ${low}: 3 silly commands a line at most.`);
      const gap = 1000 - (Date.now() - rs.funAt); if (gap > 0) await wait(gap, ctx);
      rs.funAt = Date.now();
    }
    const out = ctx.legacy([low, ...args].map(dq).join(' '));
    if (out === null) return null;
    const text = out.join('\n'); return { out: text, code: text.startsWith('✗') ? 1 : 0 };
  }
  if (BUILTIN_NAMES.includes(low)) return fail(`✗ ${c}: command not found (did you mean ${low}?)`, 127);
  fail(`✗ ${c}: command not found. help lists them.`, 127);
}

/* the game's own variables, which can't be changed */
function gameVar(name, ctx) {
  const s = ctx.room && ctx.room.state;
  switch (name) {
    case 'USER': case 'LOGNAME': return ctx.meName;
    case 'HOME': return fs.home;
    case 'PWD': return fs.cwd;
    case 'OLDPWD': return fs.old || '';
    case 'SHELL': return '/bin/duckbash';
    case 'RANDOM': return String(Math.floor(Math.random() * 32768));
    case 'HOST': return s ? pname(s, s.hostId) : '';
    case 'ROOM': return s ? s.name || '' : '';
    case 'MODE': return s ? s.options.mode || 'aod' : '';
    case 'MAP': return s ? s.options.map || 'board' : '';
    case 'ROUND': return s ? String(s.round + 1) : '';
    case 'STAGE': return s ? STAGE[s.phase] || 'lobby' : '';
    case 'PLAYERS': return s ? s.seat.map(id => pname(s, id)).join(' ') : ctx.meName;
  }
  return undefined;
}
const GAME_VARS = ['USER', 'LOGNAME', 'HOME', 'PWD', 'OLDPWD', 'SHELL', 'RANDOM', 'HOST', 'ROOM', 'MODE', 'MAP', 'ROUND', 'STAGE', 'PLAYERS'];
function env(ctx, rs) {
  return {
    exec: (argv, stdin, meta) => one(argv, stdin, meta, ctx, rs),
    has: n => isCommand(n, ctx),
    getVar: n => gameVar(n, ctx) ?? fs.vars[n],
    setVar: (n, v) => { if (GAME_VARS.includes(n)) fail(`✗ ${n}: readonly variable (the game keeps it)`); if (Object.keys(fs.vars).length >= 100 && !(n in fs.vars)) fail('✗ 100 variables at most'); v = String(v); if (v.length > 5000) fail(`✗ ${n}: a variable holds 5,000 characters at most (this was ${v.length.toLocaleString('en-US')}). Put it in a file: > notes/file`); fs.vars[n] = v; },
    unsetVar: n => { if (GAME_VARS.includes(n)) fail(`✗ unset: ${n}: cannot unset: readonly variable`); delete fs.vars[n]; },
    listVars: () => [...GAME_VARS.map(n => [n, gameVar(n, ctx)]), ...Object.entries(fs.vars)],
    aliases: (profile.aliases = profile.aliases || {}),
    saveAliases: () => save(),
    read: p => readFile(p), write: (p, t, a) => writeFile(p, t, a), glob,
    fileTest: (f, p) => { try { const path = findPath(p), k = kind(path); if (!k) return false; guard(path, false); return f === '-d' ? k === 'dir' : f === '-e' ? true : f === '-s' ? k === 'file' && readFile(p).length > 0 : k === 'file'; } catch { return false; } },
    home: fs.home, cancelled: () => ctx.cancelled(), code: fs.code,
  };
}

/* runs what was typed: the lines to show, and whether the window was cleared first */
export async function shellRun(text, ctx) {
  sync(ctx);
  let line = text;
  const res = [];
  try { line = expandHistory(text, fs.hist); if (line !== text) res.push(line); }   // bash shows what !! became
  catch (e) { return { lines: [e.message], cleared: false }; }   // (bash doesn't keep a line whose !! failed)
  fs.hist.push(line); if (fs.hist.length > 200) fs.hist.shift();
  const s = ctx.room && ctx.room.state;
  if (s && denied(s, ctx.room.me, 'nocmd')) return { lines: ['✗ Your group can\'t use the command line.'], cleared: false };
  const r = await runLine(line, env(ctx, { fun: 0, funAt: 0, sends: 0 }));
  fs.code = r.code;
  res.push(...lines(r.text));
  if (res.length > 1000) res.splice(1000, res.length, `… (${res.length - 1000} more lines)`);
  fs.log.push('$ ' + text, ...res); if (fs.log.length > 2000) fs.log.splice(0, fs.log.length - 2000);
  return { lines: res, cleared: r.cleared };
}
/* ↑ and ↓, and Ctrl+R */
export const shellHistory = () => fs.hist;

/* ---------- suggestions: commands, then files, @names, groups and each command's own words ---------- */
const FILE_CMDS = ['cat', 'less', 'more', 'ls', 'cd', 'rm', 'rmdir', 'head', 'tail', 'wc', 'sort', 'grep', 'touch', 'uniq', 'cp', 'mv', 'tree', 'find', 'stat', 'file', 'chmod', 'chgrp', 'source', '.', 'cut', 'tr', 'sed', 'awk', 'rev', 'tac', 'nl', 'fold', 'column', 'diff', 'tee', 'shuf', 'bc', 'mkdir', 'send'];
const WORDS = {
  help: ['all', ...HELP_NAMES.map(n => n.slice(4).toLowerCase())],
  forgame: ['show', 'all-timer', 'timer', 'turn-end', 'order', 'freeroam', 'gravity', 'silly', 'justin', 'on', 'off', 'catch-up', 'answer', 'writing', 'everyone', 'half', '2/3', '3/4', 'random', 'rotate', 'low', 'normal', 'stage', 'stage2', 'rounds8', ...STAGES, '\\mute', 'bubble', 'ping', 'text', 'all'],
  map: MAPS.map(m => m[0]), mode: MODES.map(m => m.id), song: ['list', 'now', 'on', 'off', 'all', ...music.tracks.map(qn)],
  chmod: ['g+r', 'g-r', 'o+r', 'o-r', 'a+r', 'a-r', '640', '644', '600'],
  totalstats: ['-m', ...STAT_MODES.map(([m]) => m)], gamestats: ['-m'], roundstats: ['-m'],
  ps: ['aux'], uname: ['-a'], sudo: ['-l'], gpasswd: ['-a', '-d'], groupmod: ['-n', '-p'], getent: ['group'], history: ['-c'], ls: ['-l', '-a', '-la', '-R'],
};
export function shellSuggest(line, ctx) {
  sync(ctx);
  const seg = line.split(/\||;|&&/).pop().replace(/^\s+/, ''), pre = line.slice(0, line.length - seg.length);
  const ws = seg.split(/\s+/), last = ws[ws.length - 1], done = ws.slice(0, -1).filter(Boolean);
  const words0 = done[0] === 'sudo' ? done.slice(1) : done, cmd = (words0[0] || '').toLowerCase();
  const from = line.length - last.length, put = w => ({ label: w, apply: () => line.slice(0, from) + w + (w.endsWith('/') ? '' : ' ') });
  const s = ctx.room && ctx.room.state, G = s ? Object.keys(roomGroups(s)) : ['sudo', 'dumbasses'];
  let opts = [];
  if (!words0.length) opts = [...HELP_NAMES, ...MINE, ...BUILTIN_NAMES.filter(b => /^\w/.test(b)), ...ctx.legacyTop(), ...Object.keys(profile.aliases || {}), '\\mute', '\\permmute', '\\show'];
  else if (ctx.legacyHas(cmd)) return ctx.legacySuggest(seg.replace(/^sudo\s+/, '')).map(x => ({ label: x.label, apply: () => pre + (done[0] === 'sudo' ? 'sudo ' : '') + x.apply() }));
  else if (last.startsWith('@') || last.startsWith('\\@')) { opts = s ? s.seat.map(id => (last.startsWith('\\') ? '\\@' : '@') + pname(s, id)) : []; if (cmd === 'send' && !last.startsWith('\\')) opts.unshift('@everyone'); if ((/^\\(mute|permmute)$/.test(cmd) || cmd === 'forgame') && s) opts.push(...npcsHere(s).map(n => '@' + npcTag(n))); }   // (the characters can be muted too)
  else if (last.startsWith('$')) opts = [...GAME_VARS, ...Object.keys(fs.vars)].map(v => '$' + v);
  else if (cmd === 'man' || cmd === 'type' || cmd === 'which') opts = Object.keys(MAN);
  else if (['usermod', 'members', 'gpasswd', 'adduser', 'deluser', 'groupdel', 'chgrp'].includes(cmd) || (cmd === 'getent' && done.length > 1) || (cmd === 'groupmod' && done.length > 1 && !/^-[np]$/.test(done[done.length - 1]))) opts = [...(WORDS[cmd] || []), ...G];
  else if (cmd === 'groupadd' || (cmd === 'groupmod' && done[done.length - 1] === '-p')) opts = ['-p', ...GROUP_PERMS, 'slow30'];
  else if (WORDS[cmd] && !(FILE_CMDS.includes(cmd) && done.length > 1)) opts = WORDS[cmd];
  if ((FILE_CMDS.includes(cmd) && !opts.length) || last.includes('/') || (cmd === 'ls' && last && !last.startsWith('-'))) {
    const slash = last.lastIndexOf('/'), dirPart = last.slice(0, slash + 1), base = dirPart ? findPath(dirPart.replace(/\/$/, '') || '/') : fs.cwd;
    try { opts = [...opts, ...(kind(base) === 'dir' ? list(base).map(n => dirPart + n) : [])]; } catch { /* not yours */ }
  }
  const p = last.toLowerCase();
  return [...new Set(opts)].filter(o => o.toLowerCase().startsWith(p) && o.toLowerCase() !== p).slice(0, 30).map(put);
}
