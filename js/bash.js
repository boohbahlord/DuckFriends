/* ---------- the command line's language: a small bash ----------
   A line is read the way bash reads it:
   - history first: !! (the last command), !3 (the third), !-2, !ec (the last that starts with ec), ^old^new;
   - words split by spaces; '…' keeps every character, "…" keeps spaces but fills in $NAME, $(…) and $((…)); \ keeps
     the next character; # starts a note to the end of the line;
   - commands joined by | (one's output into the next), ; (one after another), && (only if the last worked) and ||
     (only if it failed); ! in front flips whether it worked;
   - > and >> write and add to a file, < reads one in, <<< a word in, 2> and 2>> send the errors, 2>&1 the errors with the
     output, &> both into one file; /dev/null swallows what goes there;
   - NAME=value sets a variable; then $NAME, ${NAME}, $? (did the last command work: 0 yes), $(command) or `command`
     (its output), $((6 * 7)) (arithmetic), ~ (your home), {a,b} and {1..5} (one word becomes several), and * ? [ab] (file
     names that match);
   - for NAME in words; do …; done, while …; do …; done, until, and if …; then …; elif …; else …; fi.
   Nothing here knows the game: the shell (shell.js) hands in the commands, the files and the variables. To keep a line
   from running away, it runs 500 commands at most and a loop goes round 50 times at most. */

const MAX_STEPS = 500, MAX_LOOP = 50, MAX_DEPTH = 10;

export class BashError extends Error {
  constructor(msg, code = 1, fatal = false) { super(msg); this.code = code; this.fatal = fatal; }
}
const fail = (msg, code = 1) => { throw new BashError(msg, code); };
const stop = (msg, code = 1) => { throw new BashError(msg, code, true); };   // ends the whole line

/* ---------- history: !! !3 !-2 !ec ^old^new ---------- */
export function expandHistory(line, hist) {
  const sw = line.match(/^\^([^^]+)\^([^^]*)\^?$/);
  if (sw) {
    const last = hist[hist.length - 1];
    if (last === undefined) fail('✗ ^: no command before this one');
    if (!last.includes(sw[1])) fail(`✗ ^${sw[1]}^${sw[2]}: ${sw[1]} isn't in the last command`);
    return last.replace(sw[1], sw[2]);
  }
  let out = '', q = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\' && q !== "'") { out += ch + (line[i + 1] ?? ''); i++; continue; }
    if (ch === "'" && q !== '"') q = q ? '' : "'";
    else if (ch === '"' && q !== "'") q = q ? '' : '"';
    if (ch === '!' && q !== "'") {
      const rest = line.slice(i + 1); let m, ev = null, len = 0;
      if (rest[0] === '!') { ev = hist[hist.length - 1]; len = 1; if (ev === undefined) fail('✗ !!: event not found'); }
      else if ((m = rest.match(/^-?\d+/))) { const n = +m[0]; ev = n < 0 ? hist[hist.length + n] : hist[n - 1]; len = m[0].length; if (ev === undefined) fail(`✗ !${m[0]}: event not found`); }
      else if ((m = rest.match(/^[A-Za-z_\\][\w\\-]*/))) { ev = [...hist].reverse().find(h => h.startsWith(m[0])); len = m[0].length; if (ev === undefined) fail(`✗ !${m[0]}: event not found`); }
      if (ev !== null) { out += ev; i += len; continue; }
    }
    out += ch;
  }
  return out;
}

/* ---------- reading a line into words and operators ---------- */
const OPS = ['2>&1', '&>>', '&>', '2>>', '2>', '>>', '<<<', '&&', '||', '|', ';', '>', '<'];
const REDIRS = ['>', '>>', '<', '<<<', '2>', '2>>', '&>', '&>>'];
/* where the ( at k closes, skipping quotes */
function closeParen(src, k) {
  let d = 0, q = '';
  for (let i = k; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\' && q === '"') i++; else if (c === q) q = ''; continue; }
    if (c === '\\') { i++; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '(') d++;
    else if (c === ')' && --d === 0) return i;
  }
  fail('✗ unexpected end of line: a ( isn\'t closed');
}
export function lex(src) {
  const toks = []; let i = 0, parts = null, start = 0, lit = '', litQ = false;
  const begin = () => { if (!parts) { parts = []; start = i; } };
  const flush = () => { if (lit) { parts.push({ t: 'lit', v: lit, q: litQ }); lit = ''; } };
  const addLit = (s, q) => { begin(); if (lit && litQ !== q) flush(); litQ = q; lit += s; };
  const addPart = p => { begin(); flush(); parts.push(p); };
  const endWord = () => { if (parts) { flush(); toks.push({ k: 'w', parts, raw: src.slice(start, i), pos: start, end: i }); parts = null; } };
  /* $… at i: a part, with i moved past it (null: a plain $) */
  const dollar = q => {
    const r = src.slice(i + 1);
    if (r[0] === '(') {
      const j = closeParen(src, i + 1);
      if (r[1] === '(' && src[j - 1] === ')') { const p = { t: 'ar', src: src.slice(i + 3, j - 1), q }; i = j + 1; return p; }
      const p = { t: 'sub', src: src.slice(i + 2, j), q }; i = j + 1; return p;
    }
    if (r[0] === '{') {   // ${name}, ${#name} (its length), ${name:-word} ${name:=word} ${name:+word} (and without the :)
      const j = src.indexOf('}', i); if (j < 0) fail('✗ unexpected end of line: a { isn\'t closed');
      const body = src.slice(i + 2, j), m = body.match(/^(#?)([A-Za-z_]\w*|\?)(?:(:?[-=+])(.*))?$/s);
      if (!m || (m[1] && m[3])) fail(`✗ \${${body}}: bad substitution`);
      i = j + 1; return { t: 'var', name: m[2], q, len: !!m[1], op: m[3] || '', arg: m[4] ?? '' };
    }
    const m = r.match(/^([A-Za-z_]\w*|\?|\$|#|\d)/);
    if (!m) return null;
    i += 1 + m[0].length; return { t: 'var', name: m[0], q };
  };
  const tick = q => { const j = src.indexOf('`', i + 1); if (j < 0) fail('✗ unexpected end of line: a ` isn\'t closed'); addPart({ t: 'sub', src: src.slice(i + 1, j), q }); i = j + 1; };
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t') { endWord(); i++; continue; }
    if (c === '\n') { endWord(); toks.push({ k: 'op', v: ';', pos: i, end: i + 1 }); i++; continue; }
    if (c === '#' && !parts) { const j = src.indexOf('\n', i); if (j < 0) break; i = j; continue; }
    if (c === '\\') {   // \x keeps x as it is; before a letter or @ the \ stays too (the game's \@name and \mute)
      const d = src[i + 1] ?? ''; addLit(/[A-Za-z@]/.test(d) ? '\\' + d : d, true); i += 2; continue;
    }
    if (c === "'") {
      const j = src.indexOf("'", i + 1); if (j < 0) fail('✗ unexpected end of line: a \' quote isn\'t closed');
      begin(); if (j === i + 1) addPart({ t: 'lit', v: '', q: true }); else addLit(src.slice(i + 1, j), true);
      i = j + 1; continue;
    }
    if (c === '"') {
      begin(); i++; let empty = true;
      while (i < src.length && src[i] !== '"') {
        const d = src[i]; empty = false;
        if (d === '\\' && '"\\$`'.includes(src[i + 1])) { addLit(src[i + 1], true); i += 2; }
        else if (d === '$') { const p = dollar(true); if (p) addPart(p); else { addLit('$', true); i++; } }
        else if (d === '`') tick(true);
        else { addLit(d, true); i++; }
      }
      if (i >= src.length) fail('✗ unexpected end of line: a " quote isn\'t closed');
      if (empty) addPart({ t: 'lit', v: '', q: true });
      i++; continue;
    }
    if (c === '$') { const p = dollar(false); if (p) addPart(p); else { addLit('$', false); i++; } continue; }
    if (c === '`') { tick(false); continue; }
    const op = OPS.find(o => src.startsWith(o, i) && (o[0] !== '2' || !parts));
    if (op) { endWord(); toks.push({ k: 'op', v: op, pos: i, end: i + op.length }); i += op.length; continue; }
    if (c === '&') fail('✗ & (running in the background) isn\'t here: ; runs one command after another.');
    if (c === '(' || c === ')') fail(`✗ syntax error near unexpected token \`${c}' (( ) groups aren't here; $( ) is)`);
    addLit(c, false); i++;
  }
  endWord();
  return toks;
}

/* ---------- reading the words into commands ---------- */
const STOPS = ['then', 'elif', 'else', 'fi', 'do', 'done'];
const plain = t => t && t.k === 'w' && t.parts.length === 1 && t.parts[0].t === 'lit' && !t.parts[0].q ? t.parts[0].v : null;
const tokText = t => !t ? 'newline' : t.k === 'op' ? t.v : t.raw;
const isAssign = t => t.k === 'w' && t.parts[0] && t.parts[0].t === 'lit' && !t.parts[0].q && /^[A-Za-z_]\w*=/.test(t.parts[0].v);
export function parse(toks, src) {
  let p = 0;
  const isOp = v => toks[p] && toks[p].k === 'op' && toks[p].v === v;
  const kw = v => plain(toks[p]) === v;
  const want = v => { if (!kw(v)) fail(`✗ syntax error near unexpected token \`${tokText(toks[p])}' (${v} was expected)`); p++; };
  const skipSemis = () => { while (isOp(';')) p++; };
  function list(stops) {
    const items = [];
    for (;;) {
      skipSemis();
      if (p >= toks.length || stops.some(kw)) break;
      items.push(andOr());
      if (p < toks.length && !isOp(';') && !stops.some(kw)) fail(`✗ syntax error near unexpected token \`${tokText(toks[p])}'`);
    }
    return { k: 'list', items };
  }
  function andOr() {
    const first = pipeline(), rest = [];
    while (isOp('&&') || isOp('||')) { const op = toks[p++].v; rest.push({ op, pl: pipeline() }); }
    return { k: 'andor', first, rest };
  }
  function pipeline() {
    let neg = false; if (kw('!')) { p++; neg = true; }
    const t0 = toks[p], cmds = [command()];
    while (isOp('|')) { p++; cmds.push(command()); }
    const last = toks[p - 1];
    return { k: 'pipe', cmds, neg, raw: t0 && last ? src.slice(t0.pos, last.end) : '' };
  }
  /* > file and the others after done or fi: for …; done > file */
  function redirsAfter() {
    const out = [];
    while (toks[p] && toks[p].k === 'op') {
      const t = toks[p];
      if (REDIRS.includes(t.v)) { const f = toks[p + 1]; if (!f || f.k !== 'w') fail(`✗ syntax error near unexpected token \`${tokText(f)}'`); out.push({ op: t.v, word: f }); p += 2; }
      else if (t.v === '2>&1') { out.push({ op: '2>&1' }); p++; }
      else break;
    }
    return out;
  }
  function command() {
    if (kw('for')) {
      p++; const name = plain(toks[p]); if (!name || !/^[A-Za-z_]\w*$/.test(name)) fail(`✗ for: \`${tokText(toks[p])}': not a valid name`); p++;
      let items = null;
      if (kw('in')) { p++; items = []; while (p < toks.length && !isOp(';') && !kw('do')) { if (toks[p].k === 'op') fail(`✗ syntax error near unexpected token \`${toks[p].v}'`); items.push(toks[p++]); } }
      skipSemis(); want('do'); const body = list(['done']); want('done');
      return { k: 'for', name, items, body, redirs: redirsAfter() };
    }
    if (kw('if')) {
      p++; const arms = []; let els = null;
      do { if (arms.length) p++; const cond = list(['then']); want('then'); arms.push([cond, list(['elif', 'else', 'fi'])]); } while (kw('elif'));
      if (kw('else')) { p++; els = list(['fi']); }
      want('fi'); return { k: 'if', arms, els, redirs: redirsAfter() };
    }
    if (kw('while') || kw('until')) {
      const until = kw('until'); p++; const cond = list(['do']); want('do'); const body = list(['done']); want('done');
      return { k: 'while', until, cond, body, redirs: redirsAfter() };
    }
    const words = [], assigns = [], redirs = [], t0 = toks[p];
    while (p < toks.length) {
      const t = toks[p];
      if (t.k === 'op') {
        if (REDIRS.includes(t.v)) { const f = toks[p + 1]; if (!f || f.k !== 'w') fail(`✗ syntax error near unexpected token \`${tokText(f)}'`); redirs.push({ op: t.v, word: f }); p += 2; continue; }
        if (t.v === '2>&1') { redirs.push({ op: '2>&1' }); p++; continue; }
        break;
      }
      if (!words.length && STOPS.includes(plain(t))) break;
      if (!words.length && isAssign(t)) { assigns.push(t); p++; continue; }
      words.push(t); p++;
    }
    if (!words.length && !assigns.length && !redirs.length) fail(`✗ syntax error near unexpected token \`${tokText(toks[p])}'`);
    const last = toks[p - 1];
    return { k: 'cmd', words, assigns, redirs, raw: t0 && last ? src.slice(t0.pos, last.end) : '' };
  }
  const ast = list([]);
  if (p < toks.length) fail(`✗ syntax error near unexpected token \`${tokText(toks[p])}'`);
  return ast;
}

/* ---------- arithmetic: $((…)), expr and bc share it ---------- */
/* + - * / % ** ( ), comparisons (1 or 0), && || !, and names of variables; int: whole numbers like bash */
export function calc(text, getVar = () => '', { int = true, scale = 0 } = {}) {
  const toks = String(text).match(/\d+\.?\d*|\.\d+|[A-Za-z_]\w*|\*\*|<=|>=|==|!=|&&|\|\||[-+*/%()<>!]|\S/g) || [];
  let i = 0;
  const peek = () => toks[i], eat = t => { if (toks[i] === t) { i++; return true; } return false; };
  const num = v => { const n = +v; if (!isFinite(n)) fail(`✗ ${text}: not a number`); return n; };
  const atom = () => {
    const t = toks[i++];
    if (t === undefined) fail(`✗ ${text}: something is missing at the end`);
    if (t === '(') { const v = or(); if (!eat(')')) fail(`✗ ${text}: a ( isn't closed`); return v; }
    if (t === '-') return -atom();
    if (t === '+') return atom();
    if (t === '!') return atom() ? 0 : 1;
    if (/^[\d.]/.test(t)) return num(t);
    if (/^[A-Za-z_]/.test(t)) { const v = String(getVar(t) ?? '').trim(); return v === '' ? 0 : /^-?\d+(\.\d+)?$/.test(v) ? +v : fail(`✗ ${t}: its value (${v}) isn't a number`); }
    fail(`✗ ${text}: syntax error near ${t}`);
  };
  const pow = () => { const b = atom(); return eat('**') ? b ** pow() : b; };
  const mul = () => {
    let v = pow();
    for (;;) {
      if (eat('*')) v *= pow();
      else if (peek() === '/' || peek() === '%') {
        const op = toks[i++], d = pow(); if (d === 0) fail('✗ division by 0');
        v = op === '%' ? v % d : int ? Math.trunc(v / d) : Math.trunc(v / d * 10 ** scale) / 10 ** scale;
      } else return v;
    }
  };
  const add = () => { let v = mul(); for (;;) { if (eat('+')) v += mul(); else if (eat('-')) v -= mul(); else return v; } };
  const cmp = () => { let v = add(); for (;;) { const t = peek(); if (!['<', '>', '<=', '>=', '==', '!='].includes(t)) return v; i++; const w = add(); v = +({ '<': v < w, '>': v > w, '<=': v <= w, '>=': v >= w, '==': v === w, '!=': v !== w })[t]; } };
  const and = () => { let v = cmp(); while (eat('&&')) { const w = cmp(); v = v && w ? 1 : 0; } return v; };
  const or = () => { let v = and(); while (eat('||')) { const w = and(); v = v || w ? 1 : 0; } return v; };
  if (!toks.length) return 0;
  const v = or(); if (i < toks.length) fail(`✗ ${text}: syntax error near ${toks[i]}`);
  return int ? Math.trunc(v) : v;
}

/* ---------- file names that match * ? [ab] ---------- */
export function globRe(pat) {
  let re = '';
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    if (c === '\\') { re += (pat[i + 1] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); i++; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '[') { const j = pat.indexOf(']', i + 2); if (j < 0) { re += '\\['; continue; } let set = pat.slice(i + 1, j); if (set[0] === '!') set = '^' + set.slice(1); re += `[${set.replace(/\\/g, '\\\\')}]`; i = j; }
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
const hasGlob = s => /[*?]|\[[^\]]+\]/.test(s);

/* {a,b,c} and {1..5}, on a word with no quotes in it */
function braces(w) {
  const m = w.match(/^(.*?)\{([^{}]*)\}(.*)$/s);
  if (!m) return [w];
  const [, pre, body, post] = m, r = body.match(/^(-?\d+)\.\.(-?\d+)$/) || body.match(/^([a-zA-Z])\.\.([a-zA-Z])$/);
  let items;
  if (r) {
    const num = /\d/.test(r[1]), a = num ? +r[1] : r[1].charCodeAt(0), b = num ? +r[2] : r[2].charCodeAt(0), step = a <= b ? 1 : -1;
    if (Math.abs(b - a) > 999) fail(`✗ {${body}}: 1000 at most`);
    items = []; for (let k = a; step > 0 ? k <= b : k >= b; k += step) items.push(num ? String(k) : String.fromCharCode(k));
  } else if (body.includes(',')) items = body.split(',');
  else return [w];
  return items.flatMap(x => braces(pre + x + post));
}

/* ---------- running ---------- */
const quoteWord = w => /^[\w@%+=:,./-]+$/.test(w) ? w : `'${w.replace(/'/g, `'\\''`)}'`;
export { quoteWord };

/* one word → the words it becomes */
async function expandWord(tok, st, { split = true, glob = true } = {}) {
  const P = tok.parts;
  if (split && P.length && P.every(x => x.t === 'lit' && !x.q)) {   // braces first, on a plain word
    const all = braces(P.map(x => x.v).join(''));
    if (all.length > 1) { const out = []; for (const w of all) out.push(...await expandWord({ parts: [{ t: 'lit', v: w, q: false }] }, st, { split, glob })); return out; }
  }
  const fields = []; let cur = null;
  const seg = (s, g) => { if (!cur) cur = { segs: [], quoted: false }; cur.segs.push({ s, g }); };
  const cut = () => { if (cur) fields.push(cur); cur = null; };
  for (let k = 0; k < P.length; k++) {
    const x = P[k];
    if (x.t === 'lit') {
      let v = x.v;
      if (!x.q && k === 0 && (v === '~' || v.startsWith('~/'))) v = st.env.home + v.slice(1);
      seg(v, !x.q); if (x.q) cur.quoted = true; continue;
    }
    let v;
    if (x.t === 'var') {
      const raw = x.name === '?' ? String(st.code) : x.name === '$' ? '4242' : x.name === '#' ? '0' : /^\d$/.test(x.name) ? (x.name === '0' ? 'duckbash' : '') : st.env.getVar(x.name);
      v = raw ?? '';
      if (x.op) {   // the default (or the alternative), with its own $names filled in
        const unset = x.op.startsWith(':') ? v === '' : raw === undefined, arg = () => x.arg.replace(/\$\{?([A-Za-z_]\w*)\}?/g, (a, n) => st.env.getVar(n) ?? '');
        if (x.op.endsWith('+')) v = unset ? '' : arg();
        else if (unset) { v = arg(); if (x.op.endsWith('=')) st.env.setVar(x.name, v); }
      }
      if (x.len) v = String([...v].length);
    }
    else if (x.t === 'sub') v = (await capture(x.src, st)).replace(/\n+$/, '');
    else v = String(calc(x.src, n => st.env.getVar(n)));
    if (x.q || !split) { seg(v, false); cur.quoted = true; continue; }
    const pieces = v.split(/[ \t\n]+/);
    pieces.forEach((pc, n) => { if (n > 0) cut(); if (pc) seg(pc, false); });
  }
  cut();
  const out = [];
  for (const f of fields) {
    const text = f.segs.map(x => x.s).join('');
    if (!text && !f.quoted) continue;
    if (glob && f.segs.some(x => x.g && hasGlob(x.s))) {
      const pat = f.segs.map(x => x.g ? x.s : x.s.replace(/[*?[\]\\]/g, '\\$&')).join('');
      const hits = st.env.glob(pat);
      if (hits.length) { out.push(...hits); continue; }
    }
    out.push(text);
  }
  return out;
}

/* runs a piece of a line and returns what it printed (for $( )) */
async function capture(src, st) {
  if (++st.depth > MAX_DEPTH) stop('✗ Too deep: $( ) inside $( ) too many times.');
  let buf = '';
  try { await execList(parse(lex(src), src), '', { out: t => { buf += t; }, err: st.sink0.err, screen: false }, st); }
  finally { st.depth--; }
  return buf;
}

const step = st => {
  if (++st.steps > MAX_STEPS) stop(`✗ That line ran ${MAX_STEPS} commands, the most one line can.`);
  if (st.env.cancelled()) stop('^C', 130);
};

async function execList(node, stdin, sink, st) {
  for (const it of node.items) await execAndOr(it, stdin, sink, st);
  return st.code;
}
async function execAndOr(node, stdin, sink, st) {
  let code = await execPipe(node.first, stdin, sink, st);
  for (const { op, pl } of node.rest) if ((op === '&&') === (code === 0)) code = await execPipe(pl, stdin, sink, st);
  return code;
}
async function execPipe(node, stdin, sink, st) {
  let { cmds } = node, code = 0, input = stdin;
  /* send in front of a pipe sends what the whole pipe prints: send @everyone cat file1 | grep duck */
  if (cmds.length > 1 && cmds[0].k === 'cmd' && cmds[0].words.length && plain(cmds[0].words[0]) === 'send') {
    const ws = cmds[0].words; let n = 1; while (n < ws.length && /^\\?@/.test(plain(ws[n]) || '')) n++;
    if (n < ws.length) {
      const first = { ...cmds[0], words: ws.slice(n), raw: '' }, rest = node.raw.replace(/^\s*send(\s+\\?@\S+)+\s*/, '');
      let buf = '';
      const inner = { out: t => { buf += t; }, err: sink.err, screen: false };
      for (let k = 0; k < cmds.length; k++) {
        const last = k === cmds.length - 1; let out = '';
        code = await execCmd(k === 0 ? first : cmds[k], input, last ? inner : { out: t => { out += t; }, err: sink.err, screen: false }, st, rest);
        input = out;
      }
      const head = { ...cmds[0], words: ws.slice(0, n), redirs: [], raw: 'send ' + ws.slice(1, n).map(w => w.raw).join(' ') };
      if (code === 0 || buf) code = await execCmd(head, buf, sink, st, rest);   // (nothing to send when it only failed)
      st.code = node.neg ? +!code : code; return st.code;
    }
  }
  for (let k = 0; k < cmds.length; k++) {
    const last = k === cmds.length - 1; let out = '';
    const to = last ? sink : { out: t => { out += t; }, err: sink.err, screen: false };
    const c = cmds[k];
    code = c.k === 'cmd' ? await execCmd(c, input, to, st, node.raw) : await withRedirs(c.redirs, input, to, st, (i2, to2) => execCompound(c, i2, to2, st));
    input = out;
  }
  st.code = node.neg ? +!code : code;
  return st.code;
}
async function execCompound(c, stdin, sink, st) {
  step(st);
  if (c.k === 'for') {
    const items = []; if (c.items) for (const w of c.items) items.push(...await expandWord(w, st));
    let code = 0, n = 0;
    for (const v of items) {
      if (++n > MAX_LOOP) { sink.err(`✗ for: stopped after ${MAX_LOOP} times.\n`); break; }
      st.env.setVar(c.name, v); code = await execList(c.body, stdin, sink, st);
    }
    return code;
  }
  if (c.k === 'if') {
    for (const [cond, body] of c.arms) if (await execList(cond, stdin, sink, st) === 0) return execList(body, stdin, sink, st);
    return c.els ? execList(c.els, stdin, sink, st) : 0;
  }
  if (c.k === 'while') {
    let code = 0, n = 0;
    for (;;) {
      const ok = await execList(c.cond, stdin, sink, st) === 0;
      if (ok === c.until) break;
      if (++n > MAX_LOOP) { sink.err(`✗ ${c.until ? 'until' : 'while'}: stopped after ${MAX_LOOP} times.\n`); break; }
      code = await execList(c.body, stdin, sink, st);
    }
    return code;
  }
  return 0;
}
const nl = t => t && !t.endsWith('\n') ? t + '\n' : t;
async function execCmd(c, stdin, sink, st, pipeRaw) {
  step(st);
  const argv = [];
  try {
    for (const w of c.words) argv.push(...await expandWord(w, st));
    for (const a of c.assigns) {
      const p0 = a.parts[0], eq = p0.v.indexOf('='), name = p0.v.slice(0, eq);
      const val = (await expandWord({ parts: [{ ...p0, v: p0.v.slice(eq + 1), q: true }, ...a.parts.slice(1)] }, st, { split: false, glob: false })).join('');
      st.env.setVar(name, val);
    }
  } catch (e) { if (e.fatal) throw e; sink.err(nl(e.message)); return (st.code = e.code ?? 1); }
  if (!argv.length && !c.redirs.length) return (st.code = 0);
  return withRedirs(c.redirs, stdin, sink, st, (input, to) => runArgv(c, argv, input, to, st, pipeRaw));
}
/* the redirections, in order (where the input comes from, where the output and the errors go), around fn(input, to) */
async function withRedirs(redirs, stdin, sink, st, fn) {
  if (!redirs || !redirs.length) return fn(stdin, sink);
  let input = stdin, outT = null, errT = null;
  const files = [];
  try {
    for (const r of redirs) {
      if (r.op === '2>&1') { errT = outT || 'out'; continue; }
      const w = (await expandWord(r.word, st, { glob: false })).join(' ');
      if (r.op === '<') { input = w === '/dev/null' ? '' : await st.env.read(w); continue; }
      if (r.op === '<<<') { input = w + '\n'; continue; }
      const append = r.op.endsWith('>>'), f = { path: w, buf: '' };
      if (w !== '/dev/null') await st.env.write(w, '', append);   // makes (or empties) the file now, as bash does
      files.push(f);
      if (r.op.startsWith('&')) { outT = f; errT = f; } else if (r.op.startsWith('2')) errT = f; else outT = f;
    }
  } catch (e) { if (e.fatal) throw e; sink.err(nl(e.message)); return (st.code = e.code ?? 1); }
  const to = {
    out: outT ? t => { outT.buf += t; } : sink.out,
    err: errT === 'out' ? sink.out : errT ? t => { errT.buf += t; } : sink.err,
    screen: !outT && sink.screen,
  };
  let code = await fn(input, to);
  for (const f of files) if (f.path !== '/dev/null') { try { await st.env.write(f.path, f.buf, true); } catch (e) { sink.err(nl(e.message)); code = 1; } }
  return (st.code = code);
}
/* one command's words, run: an alias, a builtin (sudo in front of one checks sudo first) or the game's command */
async function runArgv(c, argv, input, to, st, pipeRaw) {
  let code = 0;
  if (argv.length) {
    const name = argv[0];
    if (st.env.aliases[name] && !st.aliasing.has(name) && plain(c.words[0]) === name) {   // an alias: its words in front of the rest
      st.aliasing.add(name);
      try { const src = st.env.aliases[name] + ' ' + argv.slice(1).map(quoteWord).join(' '); code = await execList(parse(lex(src), src), input, to, st); }
      catch (e) { if (e.fatal) throw e; to.err(nl(e.message)); code = e.code ?? 1; }
      finally { st.aliasing.delete(name); }
    } else {
      try {
        let av = argv;
        if (av[0] === 'sudo' && BUILTINS[av[1]]) { await st.env.exec(['sudo', '-v'], input, { raw: c.raw, pipeRaw, screen: to.screen, err: to.err }); av = av.slice(1); }
        const b = BUILTINS[av[0]], res = b ? await b(av.slice(1), input, st, to) : await st.env.exec(av, input, { raw: c.raw, pipeRaw, screen: to.screen, err: to.err });
        if (res === null) { st.clear(); }
        else if (res && typeof res === 'object') { code = res.code ?? 0; if (res.out) to.out(res.raw ? res.out : nl(res.out)); if (res.err) to.err(nl(res.err)); }
        else if (res !== undefined && res !== '') to.out(nl(String(res)));
      } catch (e) { if (e.fatal) throw e; to.err(nl(e.message || String(e))); code = e.code ?? 1; }
    }
  }
  return (st.code = code);
}

/* ---------- the commands that belong to the language itself ---------- */
function test(a) {
  if (!a.length) return false;
  if (a[0] === '!') return !test(a.slice(1));
  const o = a.indexOf('-o'); if (o > 0) return test(a.slice(0, o)) || test(a.slice(o + 1));
  const n = a.indexOf('-a'); if (n > 0) return test(a.slice(0, n)) && test(a.slice(n + 1));
  if (a.length === 1) return a[0] !== '';
  if (a.length === 2) {
    const [f, v] = a;
    if (f === '-z') return v === '';
    if (f === '-n') return v !== '';
    if (['-e', '-f', '-d', '-s', '-r', '-w'].includes(f)) return test.files(f, v);
    fail(`✗ test: ${f}: unary operator expected`);
  }
  const [x, op, y] = a, int = v => /^-?\d+$/.test(v) ? +v : fail(`✗ test: ${v}: integer expression expected`);
  switch (op) {
    case '=': case '==': return x === y;
    case '!=': return x !== y;
    case '-eq': return int(x) === int(y); case '-ne': return int(x) !== int(y);
    case '-lt': return int(x) < int(y); case '-le': return int(x) <= int(y);
    case '-gt': return int(x) > int(y); case '-ge': return int(x) >= int(y);
    case '<': return x < y; case '>': return x > y;
  }
  fail(`✗ test: ${op}: binary operator expected`);
}
const BUILTINS = {
  true: () => ({ code: 0 }),
  false: () => ({ code: 1 }),
  ':': () => ({ code: 0 }),
  test: (a, i, st) => { test.files = st.env.fileTest; return { code: test(a) ? 0 : 1 }; },
  '[': (a, i, st) => { if (a[a.length - 1] !== ']') fail('✗ [: a ] is missing at the end'); test.files = st.env.fileTest; return { code: test(a.slice(0, -1)) ? 0 : 1 }; },
  export: (a, i, st) => {
    if (!a.length || a[0] === '-p') return st.env.listVars().map(([k, v]) => `declare -x ${k}="${v}"`).join('\n');
    for (const x of a) { const m = x.match(/^([A-Za-z_]\w*)(?:=(.*))?$/s); if (!m) fail(`✗ export: \`${x}': not a valid name`); if (m[2] !== undefined) st.env.setVar(m[1], m[2]); }
    return '';
  },
  unset: (a, i, st) => { for (const x of a) st.env.unsetVar(x); return ''; },
  env: (a, i, st) => st.env.listVars().map(([k, v]) => `${k}=${v}`).join('\n'),
  printenv: (a, i, st) => a.length ? { out: a.map(n => st.env.getVar(n)).filter(v => v !== undefined).join('\n'), code: a.every(n => st.env.getVar(n) !== undefined) ? 0 : 1 } : BUILTINS.env(a, i, st),
  alias: (a, i, st) => {
    const A = st.env.aliases;
    if (!a.length) return Object.entries(A).map(([k, v]) => `alias ${k}=${quoteWord(v)}`).join('\n');
    const out = [];
    for (const x of a) {
      const m = x.match(/^([\w.-]+)=(.*)$/s);
      if (m) { if (BUILTINS[m[1]] && ['alias', 'unalias'].includes(m[1])) fail(`✗ alias: ${m[1]} can't be changed`); A[m[1]] = m[2]; st.env.saveAliases(); }
      else if (A[x] !== undefined) out.push(`alias ${x}=${quoteWord(A[x])}`);
      else fail(`✗ alias: ${x}: not found`);
    }
    return out.join('\n');
  },
  unalias: (a, i, st) => { const A = st.env.aliases; if (a[0] === '-a') { for (const k of Object.keys(A)) delete A[k]; } else for (const x of a) { if (A[x] === undefined) fail(`✗ unalias: ${x}: not found`); delete A[x]; } st.env.saveAliases(); return ''; },
  source: async (a, i, st, to) => {
    if (!a[0]) fail('✗ source: a file name is needed (source file)');
    if (++st.depth > MAX_DEPTH) stop('✗ source: too deep (a file that sources itself?)');
    try { const src = await st.env.read(a[0]); await execList(parse(lex(src), src), i, to, st); return { code: st.code }; }
    finally { st.depth--; }
  },
  eval: async (a, i, st, to) => { const src = a.join(' '); await execList(parse(lex(src), src), i, to, st); return { code: st.code }; },
  type: (a, i, st) => {
    const out = []; let code = 0;
    for (const n of a) {
      if (st.env.aliases[n] !== undefined) out.push(`${n} is aliased to \`${st.env.aliases[n]}'`);
      else if (['if', 'then', 'else', 'elif', 'fi', 'for', 'in', 'do', 'done', 'while', 'until', '!'].includes(n)) out.push(`${n} is a shell keyword`);
      else if (BUILTINS[n] || ['cd', 'echo', 'printf', 'pwd', 'history', 'exit', 'logout'].includes(n)) out.push(`${n} is a shell builtin`);
      else if (st.env.has(n)) out.push(`${n} is /bin/${n}`);
      else { out.push(`✗ type: ${n}: not found`); code = 1; }
    }
    return { out: out.join('\n'), code };
  },
  which: (a, i, st) => { const hit = a.filter(n => st.env.has(n) || BUILTINS[n]); return { out: hit.map(n => `/bin/${n}`).join('\n'), code: hit.length === a.length ? 0 : 1 }; },
};
/* read [-r] [-p prompt] [names…]: the next line of what came in, into variables (the last takes the rest) */
BUILTINS.read = (a, input, st, to) => {
  const names = []; for (let k = 0; k < a.length; k++) { if (a[k] === '-r') continue; if (a[k] === '-p') { to.out(a[++k] ?? ''); continue; } names.push(a[k]); }
  if (!names.length) names.push('REPLY');
  const at = st.reads.get(input) || 0; if (at >= input.length) return { code: 1 };
  const end = input.indexOf('\n', at), line = input.slice(at, end < 0 ? input.length : end); st.reads.set(input, end < 0 ? input.length : end + 1);
  const ws = line.trim().split(/\s+/);
  names.forEach((n, k) => st.env.setVar(n, k === names.length - 1 ? ws.slice(k).join(' ') : ws[k] ?? ''));
  return { code: 0 };
};
/* xargs [-n N] [command words…]: runs the command with the words that came in after its own (echo by default) */
BUILTINS.xargs = async (a, input, st, to) => {
  let n = 0, k = 0; if (a[0] === '-n') { n = +a[1]; if (!(n > 0)) fail('✗ xargs: -n needs a number'); k = 2; }
  const cmd = a.slice(k).length ? a.slice(k) : ['echo'], words = input.split(/\s+/).filter(Boolean);
  if (!words.length) return { code: 0 };
  let code = 0;
  for (let at = 0; at < words.length; at += n || words.length) {
    const src = [...cmd, ...words.slice(at, at + (n || words.length))].map(quoteWord).join(' ');
    code = await execList(parse(lex(src), src), '', to, st);
  }
  return { code };
};
BUILTINS['.'] = BUILTINS.source;
export const BUILTIN_NAMES = Object.keys(BUILTINS);

/* runs a whole line. env: exec(argv, stdin, meta), has(name), getVar, setVar, unsetVar, listVars, aliases,
   saveAliases, read(path), write(path, text, append), glob(pattern), fileTest(flag, path), home, cancelled(), code (the
   last line's $?). Returns what it printed, its $? and whether the window was cleared. */
export async function runLine(src, env) {
  let screen = '', cleared = false;
  const sink = { out: t => { screen += t; }, err: t => { screen += t; }, screen: true };
  const st = { env, steps: 0, code: env.code || 0, depth: 0, aliasing: new Set(), reads: new Map(), sink0: sink, clear: () => { screen = ''; cleared = true; } };
  try { await execList(parse(lex(src), src), '', sink, st); }
  catch (e) { screen += nl(e.message || String(e)); st.code = e.code ?? 2; }
  return { text: screen, code: st.code, cleared };
}
