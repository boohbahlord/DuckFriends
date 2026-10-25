/* ---------- the command line: a small bash ----------
   Words split by spaces ("quotes" keep spaces), commands joined by | (the output of one is the input of the next), and
   > or >> at the end write (or add) the output to a file.

   The files: / holds bin (the commands; nobody can read them, not even the host) and usr; /usr/<you> is your home:
   notes/ (your files, for this game only), log (everything you ran this game and what came out, read-only) and
   perma-notes/ (kept on this device from game to game; only you, superuser-<you>, can open it; its files can be removed,
   the folder can't). Other players' homes show in /usr, but their files live on their own devices.

   The room's commands go through the host: sudo runs a command as a member of the sudo group (the host always is);
   usermod, groupadd and groupdel need it, and so does forgame (the game's timers and turn share mid-game, and mutes that
   everyone sees). A group can take away the command line (nocmd), the chat (nochat), the silly commands (nofun) or slow
   the chat to one message every 15 seconds (slow); dumbasses has nofun and slow. Anyone in sudo can run the room like the
   host (lobby settings, map, game type, start, kick) and skip the stage the game is on.

   send posts a command's output to the chat (send @everyone roundstats, send \@name totalstats @name2); sending a file
   by itself shows its name, and only sudo members can open it. The chat's \mute, \permmute and \show work here too. */
import { profile, save, STAT_MODES } from './store.js';
import { groupsOf, isSudo, denied, GROUP_PERMS, STAGE, statsFor, wyrStats, bbStats, COLS, signed, nameOfValue } from './rules.js';
import { modeOf } from './modes.js';
import { quackStats } from './quackrules.js';

const tag = n => String(n || '').replace(/\s+/g, '');
const fail = msg => { throw new Error(msg); };

/* ---------- the manual ---------- */
const MAN = {
  help: 'help: lists the commands. man <command> tells more about one.',
  man: 'man <command>: how a command works and its flags.',
  echo: 'echo [-n] words…: prints the words (-n: no new line). echo "hello world" > file1 writes a file.',
  ls: 'ls [-a] [path]: what is in a folder (-a: hidden ones too).',
  cd: 'cd [path]: go into a folder (cd alone: your home, /usr/<you>; cd .. goes up).',
  pwd: 'pwd: the folder you are in.',
  cat: 'cat [files…]: prints files one after another (with no file: what came through |).',
  touch: 'touch files…: makes empty files (in your notes, or your perma-notes).',
  mkdir: 'mkdir folder: a new folder in your notes.',
  rm: 'rm [-r] paths…: removes files (-r: a folder and what is in it). The log and perma-notes/ itself stay.',
  head: 'head [-n N] [file]: the first N lines (10).',
  tail: 'tail [-n N] [file]: the last N lines (10).',
  wc: 'wc [-l | -w | -c] [file]: counts lines, words and characters.',
  sort: 'sort [-r] [-n] [file]: sorts lines (-r: backwards, -n: by number).',
  grep: 'grep [-i] [-v] [-c] pattern [file]: the lines that match (-i: any case, -v: the ones that don\'t, -c: how many).',
  uniq: 'uniq [file]: drops a line that repeats the one before it.',
  history: 'history [-c]: what you ran (-c: forget it). ↑ and ↓ bring back earlier commands.',
  clear: 'clear: clears this window.',
  whoami: 'whoami: your name.',
  id: 'id [@name]: a name and its groups.',
  date: 'date: the date and time.',
  uptime: 'uptime: how long this game has been going.',
  roll: 'roll [NdM]: rolls dice, like roll 2d6 (one six-sided die by default).',
  flip: 'flip: heads or tails.',
  groups: 'groups [@name]: the groups someone is in (you, by default).',
  members: 'members <group>: who is in a group. getent group <group> does the same.',
  getent: 'getent group <group>: who is in a group.',
  sudo: 'sudo <command>: runs a command as a member of the sudo group. The host is always in it.',
  usermod: 'sudo usermod [-a | -r] -G group[,group] @name: -aG adds to groups, -rG takes out of them, -G alone sets exactly these. sudo usermod @name adds to sudo.',
  groupadd: `sudo groupadd [-p perm,perm] name: a new group. Perms take something away: ${GROUP_PERMS.join(', ')} (nocmd: no command line, nochat: no chat, nofun: no silly commands, slow: one message every 15 s).`,
  groupdel: 'sudo groupdel name: removes a group (not sudo or dumbasses).',
  skip: 'skip: ends the stage the game is on right now and moves on, like everyone ended their turn (the host, or anyone in sudo; no sudo word needed). Handy if the game ever gets stuck.',
  forgame: 'sudo forgame all-timer off|on · timer off|on catch-up|answer|writing · turn-end everyone|half|2/3|3/4 · and mutes everyone sees: forgame [roundsN] [stage[N] voting lobby writing discussing stats] \\mute on|off bubble ping text all @names (roundsN: for N turns; stage2 voting: the next two voting stages).',
  roundstats: 'roundstats [@names] [-m mode]: this round\'s stats (in Bicker Brackets the whole tournament), only for you to see.',
  gamestats: 'gamestats [@names] [-m mode]: this game\'s stats.',
  totalstats: 'totalstats [@names] [-m aod|wyr|bb]: all-time stats.',
  ping: 'ping [@names]: the connection to the game server, in milliseconds.',
  send: 'send @everyone | @name… | \\@name <command>: posts the command\'s output to the chat (\\@name: only to them). send @everyone file sends the file itself; only sudo members can open it.',
  '\\mute': '\\mute bubble ping text all on|off @names: hides those from you until you leave the room.',
  '\\permmute': '\\permmute [-f] … the same, kept on this device.',
  '\\show': '\\show mute | permmute | players.',
};
const MINE = Object.keys(MAN).filter(k => !k.startsWith('\\'));

/* ---------- the files ---------- */
const fs = { game: '', files: {}, dirs: new Set(), cwd: '', log: [], hist: [] };
const perma = () => (profile.permaNotes = profile.permaNotes || {});
function sync(ctx) {
  const s = ctx.room && ctx.room.state, me = ctx.meName, home = `/usr/${me}`;
  const game = s ? `${s.id}:${s.startedAt || 0}` : 'none';
  if (fs.game !== game) { fs.game = game; fs.files = {}; fs.dirs = new Set(); fs.log = []; }   // notes and the log last one game
  if (!fs.cwd || !fs.cwd.startsWith('/')) fs.cwd = home + '/notes';
  fs.home = home;
  fs.people = s ? s.seat.map(id => tag(s.players[id].name)) : [me];
}
const norm = p => { const out = []; for (const part of p.split('/')) { if (!part || part === '.') continue; if (part === '..') out.pop(); else out.push(part); } return '/' + out.join('/'); };
const resolve = p => norm(p === '~' ? fs.home : p.startsWith('~/') ? fs.home + p.slice(1) : p.startsWith('/') ? p : fs.cwd + '/' + p);
/* what a path is: a folder, a file, or nothing */
function kind(path) {
  const h = fs.home, parts = path.split('/').filter(Boolean);
  if (['/', '/usr', '/bin'].includes(path)) return 'dir';
  if (parts[0] === 'bin') return MINE.includes(parts[1]) && parts.length === 2 ? 'file' : null;
  if (parts[0] !== 'usr' || !parts[1]) return null;
  if (!fs.people.includes(parts[1]) && path.slice(0, h.length) !== h) return null;
  if (parts.length === 2) return 'dir';
  if (path === h + '/log') return 'file';
  if (parts.length === 3 && ['notes', 'perma-notes'].includes(parts[2])) return 'dir';
  if (path.startsWith(h + '/perma-notes/')) return parts.length === 4 && perma()[parts[3]] !== undefined ? 'file' : null;
  if (path.startsWith(h + '/')) return fs.files[path] !== undefined ? 'file' : fs.dirs.has(path) ? 'dir' : null;
  return null;
}
/* a path to read: as given, else counted from /usr (cat player1/notes/file1) */
const findPath = p => { const a = resolve(p); if (kind(a) || p.startsWith('/')) return a; const b = norm('/usr/' + p); return kind(b) ? b : a; };
function guard(path, write) {
  const parts = path.split('/').filter(Boolean), h = fs.home;
  if (parts[0] === 'bin') fail(`✗ ${path}: Permission denied (no one can open the commands, not even the host).`);
  if (parts[0] === 'usr' && parts[1] && path.slice(0, h.length + 1) !== h + '/' && path !== h) {
    if (parts[2] === 'perma-notes') fail(`✗ ${path}: Permission denied (only superuser-${parts[1]} can open it).`);
    fail(`✗ ${path}: that is on ${parts[1]}'s own device.`);
  }
  if (write && path === h + '/log') fail('✗ The log is read-only.');
  if (write && !path.startsWith(h + '/notes/') && !path.startsWith(h + '/perma-notes/')) fail(`✗ ${path}: you can write in ${h}/notes and ${h}/perma-notes.`);
}
function readFile(p) {
  const path = findPath(p), k = kind(path);
  guard(path, false);
  if (!k) fail(`✗ ${p}: No such file or directory`);
  if (k === 'dir') fail(`✗ ${p}: Is a directory`);
  if (path === fs.home + '/log') return fs.log.join('\n');
  if (path.startsWith(fs.home + '/perma-notes/')) return perma()[path.split('/').pop()];
  return fs.files[path];
}
function writeFile(p, text, append) {
  const path = resolve(p); guard(path, true);
  if (kind(path) === 'dir') fail(`✗ ${p}: Is a directory`);
  const parent = path.slice(0, path.lastIndexOf('/')); if (kind(parent) !== 'dir') fail(`✗ ${p}: No such directory`);
  const name = path.split('/').pop(); if (!/^[\w.-]{1,40}$/.test(name)) fail(`✗ ${name}: a file name is letters, numbers, ., - and _.`);
  if (path.startsWith(fs.home + '/perma-notes/')) { const P = perma(); P[name] = (append && P[name] ? P[name] : '') + text; save(); return; }
  fs.files[path] = (append && fs.files[path] ? fs.files[path] : '') + text;
}
function list(path) {
  const h = fs.home, under = pre => [...Object.keys(fs.files), ...fs.dirs].filter(f => f.startsWith(pre + '/') && !f.slice(pre.length + 1).includes('/')).map(f => f.slice(pre.length + 1) + (fs.dirs.has(f) ? '/' : ''));
  if (path === '/') return ['bin/', 'usr/'];
  if (path === '/usr') return fs.people.map(n => n + '/');
  if (path === '/bin') return MINE;
  if (path === h) return ['log', 'notes/', 'perma-notes/'];
  if (path === h + '/perma-notes') return Object.keys(perma());
  if (path.startsWith(h + '/')) return under(path);
  guard(path, false);
  return ['log', 'notes/', 'perma-notes/'];
}

/* ---------- helpers for the commands ---------- */
const lines = t => t === '' ? [] : String(t).replace(/\n$/, '').split('\n');
const flags = (args, known) => { const f = {}, rest = []; for (let i = 0; i < args.length; i++) { const a = args[i]; if (/^-[a-zA-Z]+$/.test(a) && [...a.slice(1)].every(c => known.includes(c))) { for (const c of a.slice(1)) f[c] = true; if (a.endsWith('n') && known.includes('n') && /^\d+$/.test(args[i + 1] || '')) f.N = +args[++i]; } else rest.push(a); } return { f, rest }; };
const input = (rest, stdin) => rest.length ? rest.map(readFile).join('\n') : stdin;
const who = (ctx, names) => {
  const s = ctx.room.state, ids = [];
  for (const n of names) { const id = s.seat.find(i => tag(s.players[i].name).toLowerCase() === n.replace(/^\\?@/, '').toLowerCase()); if (!id) fail(`✗ No player named ${n.replace(/^\\?@/, '')}.`); ids.push(id); }
  return ids;
};
const needRoom = ctx => { if (!ctx.room) fail('✗ That works in a room.'); return ctx.room.state; };
const needSudo = (ctx, sudo) => { const s = needRoom(ctx); if (!sudo) fail(`✗ That needs sudo: sudo ${ctx.cmd}`); if (!isSudo(s, ctx.room.me)) fail(`✗ ${ctx.meName} is not in the sudoers file. This incident will be reported.`); return s; };
const pct = v => `${Math.round(v * 100)}%`;

/* ---------- the stats ---------- */
function statLines(ctx, scope, args) {
  const s = needRoom(ctx), mi = args.indexOf('-m'), mode = mi >= 0 ? args[mi + 1] : (s.options.mode || 'aod'), at = args.filter(a => a.startsWith('@'));
  if (!STAT_MODES.some(([m]) => m === mode)) fail(`✗ -m aod, wyr, bb or quack.`);
  const ids = at.length ? who(ctx, at) : s.seat.filter(id => !(s.players[id] || {}).late || scope === 'total');
  const nm = id => s.players[id].name, out = [];
  if (scope === 'total') {
    out.push(`All time · ${modeOf(mode).name}:`);
    for (const id of ids) {
      const st = (id === ctx.room.me ? profile.stats : s.players[id].stats || {})[mode];
      if (!st) { out.push(`${nm(id)}: no stats yet`); continue; }
      const base = `${nm(id)}: ${st.games} games · ${st.rounds} ${mode === 'bb' ? 'tournaments' : 'rounds'} · ${st.answers} ${mode === 'bb' ? 'votes' : 'answers'} · ${st.jumps} jumps`;
      if (mode === 'bb') out.push(`${base} · ${st.titles} won · ${st.wins} contender wins · ${st.losses} losses`);
      else if (mode === 'quack') out.push(`${base} · ${st.wins} rounds won · ${st.titles} won as the Quack · ${st.majority} votes for the real Quack`);
      else if (mode === 'wyr') out.push(`${base} · with the bigger side ${st.majority + st.minority ? pct(st.majority / (st.majority + st.minority)) : '—'}`);
      else { const top = Math.max(...st.counts), avg = st.answers ? st.counts.reduce((a, k, c) => a + k * (c - 3), 0) / st.answers : null; out.push(`${base} · chose most ${top ? st.counts.map((k, c) => k === top ? COLS[c] : '').filter(Boolean).join(', ') : '—'} · average ${avg === null ? '—' : signed(Math.round(avg * 10) / 10)}`); }
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
    for (const id of ids) { const p = per[id] || { wins: 0, losses: 0, own: 0, votes: 0, king: 0, titles: 0 }; out.push(`${nm(id)}: ${p.titles} won · ${p.wins} contender wins · ${p.losses} losses · voted for their own ${p.own} · ${p.votes} votes · ${jumps(id)} jumps`); }
  } else if (mode === 'wyr') {
    const per = wyrStats(s, round).per;
    for (const id of ids) { const p = per[id] || { answers: 0, written: 0, split: 0, maj: 0, min: 0 }; out.push(`${nm(id)}: ${p.answers} answers · bigger side ${p.maj} · smaller side ${p.min}${p.written ? ` · their questions split ${pct(p.split / p.written)} evenly` : ''} · ${jumps(id)} jumps`); }
  } else {
    for (const id of ids) { const st = statsFor(s, id, round); out.push(`${nm(id)}: ${st.n} answers · chose most ${st.most.length ? st.most.map(c => COLS[c]).join(', ') : '—'} · median ${signed(st.median)}${st.median !== null ? ` (${nameOfValue(st.median)})` : ''} · average ${st.avg === null ? '—' : signed(Math.round(st.avg * 10) / 10)} · ${jumps(id)} jumps`); }
  }
  return out.join('\n');
}

/* forgame: settings, or mutes */
const STAGES = [...new Set(Object.values(STAGE))];
function forgame(ctx, args, sudo) {
  const s = needRoom(ctx); if (!isSudo(s, ctx.room.me)) fail(`✗ ${ctx.meName} is not in the sudoers file. This incident will be reported.`);
  if (s.phase === 'lobby') fail('✗ forgame works during a game.');
  const a0 = (args[0] || '').toLowerCase(), onOff = args.find(a => /^(on|off)$/i.test(a)), on = /^on$/i.test(onOff || '');
  if (a0 === 'all-timer') { if (!onOff) fail('✗ forgame all-timer off (or on)'); ctx.room.send({ t: 'forgame', set: on ? { catchUp: 15, answerTime: 30, answerOff: 0 } : { catchUp: 0, answerTime: 0, submitTime: 0, answerOff: 1 } }); return `Every timer ${on ? 'on' : 'off'} for the rest of the game.`; }
  if (a0 === 'timer') {
    const which = args.slice(1).find(a => !/^(on|off)$/i.test(a)); if (!onOff || !which) fail('✗ forgame timer off catch-up | answer | writing');
    const set = { 'catch-up': { catchUp: on ? 15 : 0 }, answer: on ? { answerTime: 30, answerOff: 0 } : { answerTime: 0, answerOff: 1 }, writing: { submitTime: on ? 90 : 0 } }[which.toLowerCase()];
    if (!set) fail('✗ catch-up, answer or writing'); ctx.room.send({ t: 'forgame', set }); return `The ${which} timer: ${on ? 'on' : 'off'}.`;
  }
  if (a0 === 'turn-end') { const v = { everyone: 1, all: 1, half: .5, '2/3': .67, '3/4': .75 }[(args[1] || '').toLowerCase()]; if (!v) fail('✗ forgame turn-end everyone | half | 2/3 | 3/4'); ctx.room.send({ t: 'forgame', set: { share: v } }); return `A turn now ends when ${v === 1 ? 'everyone is' : `${args[1]} of the players are`} done.`; }
  const mi = args.findIndex(a => /^\\mute$/i.test(a)); if (mi < 0) fail(`✗ ${MAN.forgame}`);
  const pre = args.slice(0, mi), post = args.slice(mi + 1), mute = { on: false, kinds: [], who: [], turns: 0, stages: [], count: 0 };
  for (let i = 0; i < pre.length; i++) {
    const w = pre[i].toLowerCase(), r = w.match(/^(?:rounds|turns)(\d+)$/), st = w.match(/^stage(\d*)$/);
    if (r) mute.turns = +r[1];
    else if (st) { mute.count = +st[1] || 0; while (STAGES.includes((pre[i + 1] || '').toLowerCase())) mute.stages.push(pre[++i].toLowerCase()); if (!mute.stages.length) fail(`✗ stage: then ${STAGES.join(', ')}`); }
    else fail(`✗ ${pre[i]}? Before \\mute: roundsN, stage or stageN and the stages.`);
  }
  for (const w of post) {
    if (/^(on|off)$/i.test(w)) mute.on = /^on$/i.test(w);
    else if (w.startsWith('@')) mute.who.push(...who(ctx, [w]));
    else if (/^all$/i.test(w)) mute.kinds.push('bubble', 'ping', 'text');
    else if (['bubble', 'ping', 'text'].includes(w.toLowerCase())) mute.kinds.push(w.toLowerCase());
    else fail(`✗ ${w}? \\mute on|off, then bubble, ping, text or all, then @names.`);
  }
  if (!post.some(w => /^(on|off)$/i.test(w)) || !mute.kinds.length || !mute.who.length) fail('✗ \\mute on|off, then bubble, ping, text or all, then @names.');
  ctx.room.send({ t: 'forgame', mute });
  return `${mute.on ? 'Muted' : 'Unmuted'} ${[...new Set(mute.kinds)].join(', ')} for everyone${mute.turns ? `, for ${mute.turns} turns` : ''}${mute.stages.length ? `, in ${mute.count ? `the next ${mute.count} ` : 'the '}${mute.stages.join(', ')} stage${mute.count === 1 && mute.stages.length === 1 ? '' : 's'}` : ''}.`;
}

/* ---------- the commands: (args, stdin, ctx, sudo) → the output ---------- */
const CMDS = {
  help: () => ['The commands (man <command> for more):', MINE.filter(k => k !== 'help').join(' '), 'and the chat\'s \\mute \\permmute \\show; ' + 'custom, reset and the silly commands (lightning love kill hotdog fire): help them with man custom.', 'Pipes |, and > or >> into a file. ↑ ↓ bring back earlier commands.', 'Host (or sudo): skip moves the game on to the next stage. sudo usermod @name gives someone sudo, so they can run the room too.'].join('\n'),
  man: args => args[0] ? (MAN[args[0]] || (args[0] === 'custom' ? 'custom avatar | card | username …: customize your duck, card or name (Tab shows the choices).' : fail(`✗ No manual entry for ${args[0]}`))) : MAN.man,
  echo: args => (args[0] === '-n' ? args.slice(1) : args).join(' '),
  pwd: () => fs.cwd,
  cd: args => { const p = args[0] ? resolve(args[0]) : fs.home, k = kind(p); if (k !== 'dir') fail(`✗ cd: ${args[0]}: ${k ? 'Not a directory' : 'No such file or directory'}`); fs.cwd = p; return ''; },
  ls: args => { const { f, rest } = flags(args, 'al'), p = rest[0] ? findPath(rest[0]) : fs.cwd, k = kind(p); if (!k) fail(`✗ ls: ${rest[0]}: No such file or directory`); if (k === 'file') return rest[0]; const out = list(p); return (f.a ? ['./', '../', ...out] : out).join('  '); },
  cat: (args, stdin) => input(args, stdin),
  touch: args => { if (!args.length) fail('✗ touch file'); for (const a of args) { const p = resolve(a); if (!kind(p)) writeFile(a, '', true); } return ''; },
  mkdir: args => { if (!args.length) fail('✗ mkdir folder'); for (const a of args) { const p = resolve(a); guard(p, true); if (!p.startsWith(fs.home + '/notes/')) fail('✗ Folders go in your notes.'); if (kind(p)) fail(`✗ mkdir: ${a}: File exists`); fs.dirs.add(p); } return ''; },
  rm: args => {
    const { f, rest } = flags(args, 'rf'); if (!rest.length) fail('✗ rm file');
    for (const a of rest) {
      const p = findPath(a), k = kind(p);
      if (p === fs.home + '/perma-notes' || p === fs.home + '/notes') fail(`✗ rm: ${a}: that folder stays.`);
      guard(p, true);
      if (!k) fail(`✗ rm: ${a}: No such file or directory`);
      if (k === 'dir' && !f.r) fail(`✗ rm: ${a}: Is a directory (rm -r)`);
      if (p.startsWith(fs.home + '/perma-notes/')) { delete perma()[p.split('/').pop()]; save(); continue; }
      for (const x of Object.keys(fs.files)) if (x === p || x.startsWith(p + '/')) delete fs.files[x];
      for (const x of [...fs.dirs]) if (x === p || x.startsWith(p + '/')) fs.dirs.delete(x);
    }
    return '';
  },
  head: (args, stdin) => { const { f, rest } = flags(args, 'n'); return lines(input(rest, stdin)).slice(0, f.N || 10).join('\n'); },
  tail: (args, stdin) => { const { f, rest } = flags(args, 'n'); return lines(input(rest, stdin)).slice(-(f.N || 10)).join('\n'); },
  wc: (args, stdin) => { const { f, rest } = flags(args, 'lwc'), t = input(rest, stdin), n = [lines(t).length, t.split(/\s+/).filter(Boolean).length, t.length]; return (f.l ? [n[0]] : f.w ? [n[1]] : f.c ? [n[2]] : n).join(' '); },
  sort: (args, stdin) => { const { f, rest } = flags(args, 'rn'), ls = lines(input(rest, stdin)).sort((a, b) => f.n ? parseFloat(a) - parseFloat(b) : a.localeCompare(b)); return (f.r ? ls.reverse() : ls).join('\n'); },
  uniq: (args, stdin) => lines(input(args, stdin)).filter((l, i, a) => i === 0 || l !== a[i - 1]).join('\n'),
  grep: (args, stdin) => {
    const { f, rest } = flags(args, 'ivc'); if (!rest.length) fail('✗ grep pattern [file]');
    let re; try { re = new RegExp(rest[0], f.i ? 'i' : ''); } catch { fail(`✗ grep: ${rest[0]}: not a pattern`); }
    const hit = lines(input(rest.slice(1), stdin)).filter(l => re.test(l) !== !!f.v); return f.c ? String(hit.length) : hit.join('\n');
  },
  history: args => { if (args[0] === '-c') { fs.hist = []; return ''; } return fs.hist.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'); },
  whoami: (a, i, ctx) => ctx.meName,
  id: (args, i, ctx) => { const s = needRoom(ctx), [id] = args.length ? who(ctx, args) : [ctx.room.me], n = tag(s.players[id].name); return `uid=${n} groups=${[...groupsOf(s, id), 'superuser-' + n].join(',')}`; },
  date: () => new Date().toString().replace(/ \(.*\)$/, ''),
  uptime: (a, i, ctx) => { const s = needRoom(ctx); if (!s.startedAt || s.phase === 'lobby') return 'The game hasn\'t started.'; const m = Math.floor((Date.now() - s.startedAt) / 60000); return `up ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}, ${s.seat.length} players, round ${s.round + 1}`; },
  roll: args => { const m = (args[0] || '1d6').match(/^(\d{0,2})d(\d{1,3})$/i); if (!m) fail('✗ roll NdM, like roll 2d6'); const n = Math.min(20, +m[1] || 1), k = Math.max(2, +m[2]), r = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * k)); return n > 1 ? `${r.join(' + ')} = ${r.reduce((a, b) => a + b, 0)}` : String(r[0]); },
  flip: () => Math.random() < .5 ? 'Heads' : 'Tails',
  groups: (args, i, ctx) => { const s = needRoom(ctx), [id] = args.length ? who(ctx, args) : [ctx.room.me]; return [...groupsOf(s, id), 'superuser-' + tag(s.players[id].name)].join(' '); },
  members: (args, i, ctx) => {
    const s = needRoom(ctx), g = (args[0] || '').toLowerCase(); if (!g) fail('✗ members <group>');
    if (g.startsWith('superuser-')) return g.slice(10);
    const G = s.groups || {}; if (!G[g] && g !== 'sudo' && g !== 'dumbasses') fail(`✗ No group ${g}. groups lists yours.`);
    return s.seat.filter(id => groupsOf(s, id).includes(g)).map(id => tag(s.players[id].name)).join(' ') || '(nobody)';
  },
  getent: (args, i, ctx) => { if ((args[0] || '') !== 'group' || !args[1]) fail('✗ getent group <group>'); return `${args[1]}:x:${CMDS.members([args[1]], i, ctx).replace(/ /g, ',')}`; },
  usermod: (args, i, ctx, sudo) => {
    needSudo(ctx, sudo); const { f, rest } = flags(args, 'arG'), at = rest.filter(a => a.startsWith('@')), gl = rest.filter(a => !a.startsWith('@')).join(',').split(',').filter(Boolean).map(g => g.toLowerCase());
    if (!at.length) fail(`✗ ${MAN.usermod}`);
    const groups = f.G ? gl : ['sudo'], G = ctx.room.state.groups || { sudo: 1, dumbasses: 1 };
    for (const g of groups) if (!G[g]) fail(`✗ usermod: group '${g}' does not exist`);
    const mode = !f.G ? 'add' : f.r ? 'remove' : f.a ? 'add' : 'set';
    for (const id of who(ctx, at)) ctx.room.send({ t: 'usermod', target: id, groups, mode });
    return `${mode === 'add' ? 'Added to' : mode === 'remove' ? 'Taken out of' : 'Set to'} ${groups.join(', ')}: ${at.map(a => a.slice(1)).join(', ')}`;
  },
  groupadd: (args, i, ctx, sudo) => {
    needSudo(ctx, sudo); const pi = args.indexOf('-p'), perms = pi >= 0 ? (args[pi + 1] || '').split(',').filter(Boolean) : [], name = args.filter((a, k) => k !== pi && k !== pi + 1)[0];
    if (!name || !/^[a-z][a-z0-9_-]{0,19}$/i.test(name)) fail(`✗ ${MAN.groupadd}`);
    const bad = perms.filter(p => !GROUP_PERMS.includes(p)); if (bad.length) fail(`✗ ${bad.join(', ')}? Perms: ${GROUP_PERMS.join(', ')}`);
    if ((ctx.room.state.groups || {})[name.toLowerCase()]) fail(`✗ groupadd: group '${name}' already exists`);
    ctx.room.send({ t: 'groupadd', name: name.toLowerCase(), perms }); return `Group ${name.toLowerCase()}${perms.length ? ` (${perms.join(', ')})` : ''}. Add players: sudo usermod -aG ${name.toLowerCase()} @name`;
  },
  groupdel: (args, i, ctx, sudo) => { needSudo(ctx, sudo); const g = (args[0] || '').toLowerCase(); if (['sudo', 'dumbasses'].includes(g)) fail(`✗ ${g} stays.`); if (!(ctx.room.state.groups || {})[g]) fail(`✗ No group ${g}.`); ctx.room.send({ t: 'groupdel', name: g }); return `Removed ${g}.`; },
  forgame: (args, i, ctx) => forgame(ctx, args),
  skip: (args, i, ctx) => {
    const s = needRoom(ctx); if (!isSudo(s, ctx.room.me)) fail('✗ Only the host (or sudo) can skip.');
    if (['lobby', 'over'].includes(s.phase)) fail('✗ skip works during a game.');
    ctx.room.send({ t: 'skip' }); return 'Skipped ahead.';
  },
  roundstats: (args, i, ctx) => statLines(ctx, 'round', args),
  gamestats: (args, i, ctx) => statLines(ctx, 'game', args),
  totalstats: (args, i, ctx) => statLines(ctx, 'total', args),
  ping: (args, i, ctx) => { const s = needRoom(ctx), ids = args.length ? who(ctx, args) : s.seat; return ids.map(id => { const p = s.players[id]; return `${p.name}: ${p.bot ? 'computer' : !ctx.room.online ? 'same device' : p.ms == null ? '… ms' : p.ms + ' ms'}`; }).join('\n'); },
};

/* ---------- running a line ---------- */
function lex(line) {
  const out = []; let cur = '', q = '', any = false;
  const push = () => { if (any) out.push({ w: cur }); cur = ''; any = false; };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === q) q = ''; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; any = true; continue; }
    if (/\s/.test(ch)) { push(); continue; }
    if (ch === '|') { push(); out.push({ op: '|' }); continue; }
    if (ch === '>') { push(); if (line[i + 1] === '>') { out.push({ op: '>>' }); i++; } else out.push({ op: '>' }); continue; }
    cur += ch; any = true;
  }
  if (q) fail('✗ A quote isn\'t closed.');
  push(); return out;
}
/* one command (sudo first if given), with what came through the pipe */
function one(words, stdin, ctx) {
  let sudo = false;
  if (words[0] === 'sudo') { sudo = true; words = words.slice(1); if (!words.length) fail('✗ sudo <command>'); const s = needRoom(ctx); if (!isSudo(s, ctx.room.me)) fail(`✗ ${ctx.meName} is not in the sudoers file. This incident will be reported.`); }
  const [c, ...args] = words, name = c.toLowerCase();
  ctx.cmd = words.join(' ');
  if (/^\\(mute|permmute|show|togglesuggest)$/i.test(c)) return ctx.chat(words.join(' '));
  if (CMDS[name]) return CMDS[name](args, stdin, ctx, sudo);
  if (ctx.legacyHas(name)) { const out = ctx.legacy(words.join(' ')); return out === null ? null : out.join('\n'); }
  fail(`✗ ${c}: command not found. help lists them.`);
}
async function pipeline(text, ctx) {
  const toks = lex(text); if (!toks.length) return '';
  let redirect = null;
  const k = toks.findIndex(t => t.op === '>' || t.op === '>>');
  if (k >= 0) { const f = toks[k + 1]; if (!f || f.op || toks.length > k + 2) fail('✗ > then a file name, at the end.'); redirect = { file: f.w, append: toks[k].op === '>>' }; toks.splice(k); }
  const stages = [[]]; for (const t of toks) { if (t.op === '|') stages.push([]); else stages[stages.length - 1].push(t.w); }
  if (stages.some(st => !st.length)) fail('✗ Nothing on one side of |.');
  let out = '';
  for (let i = 0; i < stages.length; i++) { out = await one(stages[i], out, ctx); if (out === null) return null; out = String(out ?? ''); }
  if (redirect) { writeFile(redirect.file, out + (out && !out.endsWith('\n') ? '\n' : ''), redirect.append); return ''; }
  return out;
}
/* send: posts a command's output (or a file) to the chat */
async function send(text, ctx) {
  const s = needRoom(ctx), toks = text.trim().split(/\s+/).slice(1), targets = [];
  while (toks.length && /^\\?@/.test(toks[0])) targets.push(toks.shift());
  if (!targets.length || !toks.length) fail(`✗ ${MAN.send}`);
  if (denied(s, ctx.room.me, 'nochat')) fail('✗ Your group can\'t chat.');
  const rest = text.trim().replace(/^send\s+/, '').split(/\s+/).slice(targets.length).join(' '), pub = targets.filter(t => t.startsWith('@')), priv = targets.filter(t => t.startsWith('\\@'));
  const privIds = who(ctx, priv), pubIds = pub.filter(t => t.toLowerCase() !== '@everyone');
  if (pubIds.length) who(ctx, pubIds);
  /* a file by itself: its name goes, and its words (only sudo members can open them) */
  let body, file = null;
  if (toks.length === 1 && !CMDS[toks[0].toLowerCase()] && !ctx.legacyHas(toks[0].toLowerCase()) && kind(findPath(toks[0])) === 'file') { body = readFile(toks[0]); file = toks[0].split('/').pop(); }
  else if (toks.length === 1 && !CMDS[toks[0].toLowerCase()] && !ctx.legacyHas(toks[0].toLowerCase())) fail(`✗ ${toks[0]}: no such file or command (ls shows your files).`);
  else { body = await pipeline(rest, ctx); if (body === null) body = ''; }
  if (!String(body).trim()) body = file ? '(empty)' : '(no output)';
  const msg = { t: 'chat', text: (pubIds.length ? pubIds.join(' ') + '\n' : '') + body, cmd: rest, ...(file ? { file } : {}) };
  if (pub.length) ctx.room.send(msg);
  for (const id of privIds) ctx.room.send({ ...msg, to: id });
  return `Sent to ${targets.join(' ')}.`;
}

/* runs what was typed; returns the lines to show (null: clear the window) */
export async function shellRun(text, ctx) {
  sync(ctx);
  fs.hist.push(text); if (fs.hist.length > 200) fs.hist.shift();
  let out;
  try {
    const s = ctx.room && ctx.room.state;
    if (s && denied(s, ctx.room.me, 'nocmd')) fail('✗ Your group can\'t use the command line.');
    out = /^send(\s|$)/.test(text.trim()) ? await send(text, ctx) : await pipeline(text, ctx);
  } catch (e) { out = e.message || String(e); }
  if (out === null) return null;
  const res = lines(out);
  fs.log.push('$ ' + text, ...res); if (fs.log.length > 2000) fs.log.splice(0, fs.log.length - 2000);
  return res;
}
/* ↑ and ↓ */
export const shellHistory = () => fs.hist;

/* ---------- suggestions: commands, then files, @names, groups and forgame's words ---------- */
export function shellSuggest(line, ctx) {
  sync(ctx);
  const seg = line.split('|').pop().replace(/^\s+/, ''), pre = line.slice(0, line.length - seg.length);
  const ws = seg.split(/\s+/), last = ws[ws.length - 1], done = ws.slice(0, -1).filter(Boolean);
  const words0 = done[0] === 'sudo' ? done.slice(1) : done, cmd = (words0[0] || '').toLowerCase();
  const from = line.length - last.length, put = w => ({ label: w, apply: () => line.slice(0, from) + w + (w.endsWith('/') ? '' : ' ') });
  let opts = [];
  if (!words0.length) opts = [...MINE, ...ctx.legacyTop(), '\\mute', '\\permmute', '\\show'];
  else if (ctx.legacyHas(cmd)) return ctx.legacySuggest(seg.replace(/^sudo\s+/, '')).map(x => ({ label: x.label, apply: () => pre + (done[0] === 'sudo' ? 'sudo ' : '') + x.apply() }));
  else if (last.startsWith('@') || last.startsWith('\\@')) { const s = ctx.room && ctx.room.state; opts = s ? s.seat.map(id => (last.startsWith('\\') ? '\\@' : '@') + tag(s.players[id].name)) : []; if (cmd === 'send' && !last.startsWith('\\')) opts.unshift('@everyone'); }
  else if (cmd === 'man') opts = Object.keys(MAN);
  else if (['usermod', 'members'].includes(cmd) || (cmd === 'getent' && done.length > 1)) opts = Object.keys((ctx.room && ctx.room.state.groups) || { sudo: 1, dumbasses: 1 });
  else if (cmd === 'getent') opts = ['group'];
  else if (cmd === 'groupadd') opts = ['-p', ...GROUP_PERMS];
  else if (cmd === 'forgame') opts = ['all-timer', 'timer', 'turn-end', 'on', 'off', 'catch-up', 'answer', 'writing', 'everyone', 'half', '2/3', '3/4', 'stage', 'stage2', 'rounds8', ...STAGES, '\\mute', 'bubble', 'ping', 'text', 'all'];
  else if (['totalstats', 'gamestats', 'roundstats'].includes(cmd)) opts = ['-m', 'aod', 'wyr', 'bb', 'quack'];
  else if (['cat', 'ls', 'cd', 'rm', 'head', 'tail', 'wc', 'sort', 'grep', 'touch', 'uniq'].includes(cmd) || last.includes('/')) {
    const slash = last.lastIndexOf('/'), dirPart = last.slice(0, slash + 1), base = dirPart ? findPath(dirPart.replace(/\/$/, '') || '/') : fs.cwd;
    try { opts = kind(base) === 'dir' ? list(base).map(n => dirPart + n) : []; } catch { opts = []; }
  }
  const p = last.toLowerCase();
  return opts.filter(o => o.toLowerCase().startsWith(p) && o.toLowerCase() !== p).slice(0, 30).map(put);
}
