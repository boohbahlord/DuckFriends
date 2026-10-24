/* ---------- the game screen ----------
   Write a question → for each question: everyone walks their duck onto a column and ends their turn, then talks it over
   (each duck now stays inside the column it chose) → the round's results (stat boxes; ducks stay in their column) → the
   next round, until the players vote to end the game.

   The board fills the screen. The Round Lord sits on a cloud over the top of the board with the question beside it; both
   turn see-through when a duck walks under them.

   Your duck: WASD or the arrow keys walk (Shift sprints, with speed lines); Space jumps, slow and high, with a shadow left
   on the ground (low gravity makes it slower and higher; a jump counts when the duck lands); Enter ends your turn. With
   "Mouse moves your duck" a click walks it there; with "Show multiple choice" seven buttons put it on a column. Ducks
   squash a little when they push against a wall or another duck. On a phone held upright the board turns: agree at the
   top. Your duck moves on your screen at once and is sent to the room a few times a second; the others glide. */
import { register, go, leaveTo } from './router.js';
import { el, esc, $, $$, openWindow, confirmBox, typing, windowOpen, onMenu, contextMenu, setHTML } from './ui.js';
import { activeRoom } from './net.js';
import { COLS, SHORT, colOf, colX, colBounds, needed } from './rules.js';
import { duckSVG } from './duck.js';
import { nameHTML } from './name.js';
import { rainbowHTML } from './art.js';
import { statBoxHTML, openStats } from './stats.js';
import { profile } from './store.js';
import { openSettings } from './settings.js';
import { openCustomize } from './customize.js';
import { pickNote } from './notes.js';
import { openFriends } from './friends.js';
import { mountDocks, DOCK_HTML, BAR_HTML } from './dock.js';
import { countJump } from './jumps.js';
import { sfx } from './sound.js';

let R = null, S = null, off = null, raf = 0, tick = 0, docks = null;
let shown = '';            // which phase view is up (phase|round|question)
const keys = new Set();
let me = null;             // my duck here: { x, y, j (jump start), face }
let target = null;         // where a click asked my duck to walk
let squash = { q: '', t: 0 }, moving = false, sprinting = false;
let lastSend = 0, lastSent = '', lastBeep = -1, lastT = 0, geo = null;
const portrait = () => matchMedia('(orientation: portrait) and (max-width: 760px)').matches;

/* ---------- movement numbers (board widths or heights per second) ---------- */
const SPEED = { x: .45, y: 1.0, px: .5, py: .85, sprint: 1.75 };
const JUMP = { normal: { T: 1.3, H: 1.5 }, low: { T: 2.6, H: 2.3 } };   // seconds in the air; apex in duck heights
const jumpCfg = () => JUMP[R && R.state.options.lowGravity ? 'low' : 'normal'];
const jumpZ = (j, now) => { if (!j) return 0; const { T, H } = jumpCfg(), t = (now - j) / 1000 / T; return t <= 0 || t >= 1 ? 0 : 4 * H * t * (1 - t); };

/* ---------- the board ---------- */
const boardHTML = s => `<div class="board">
  <div class="cols">${COLS.map((c, i) => `<div class="col c${i + 1}" data-c="${i}"><span class="col-name">${esc(c)}<span class="cb-mark">${SHORT[i]}</span></span></div>`).join('')}</div>
  <div class="lane"></div><div class="ducks"></div>
  ${s.phase === 'answer' || s.phase === 'discuss' ? `<div class="topover">${lordHTML(s)}<p class="question">${esc(s.qs[s.qi].text)}</p></div>` : ''}</div>`;

/* the board's measurements, taken again when the window or the docks change */
function measure() {
  const board = S && $('.board', S); if (!board) { geo = null; return; }
  const r = board.getBoundingClientRect(), cols = $('.cols', board), laneH = $('.lane', board).offsetHeight, H = cols.offsetHeight, top0 = cols.offsetTop;
  const size = Math.max(34, Math.min(96, (portrait() ? H / 7 : r.width / 7) * .62));
  const label = board.querySelector('.col-name'), labelH = portrait() ? 0 : (label ? label.offsetHeight + 12 : 30);
  geo = { W: r.width, H, top0, laneH, size, labelH, left: r.left, top: r.top };
}
/* where a duck stands: x along the answers (0 strongly disagree … 1 strongly agree), y across; x < 0 = the lane below */
function place(p, i, n) {
  const { W, H, top0, laneH, size, labelH } = geo;
  if (p.x < 0) return { left: W * (i + 1) / (n + 1), top: top0 + H + laneH * .62 };
  if (portrait()) return { left: W * (.1 + p.y * .8), top: top0 + H * (1 - p.x) + size * .45 };
  return { left: W * p.x, top: top0 + size * 1.08 + p.y * (H - size * 1.08 - labelH) };
}
function unplace(px, py) {   // the inverse, for clicks
  const { W, H, size, labelH } = geo, cl = v => Math.max(0, Math.min(1, v));
  py -= geo.top0;
  if (portrait()) return { x: cl(1 - (py - size * .45) / H), y: cl((px / W - .1) / .8) };
  return { x: cl(px / W), y: cl((py - size * 1.08) / (H - size * 1.08 - labelH)) };
}

/* ---------- drawing the ducks (every frame: jumps and glides) ---------- */
const SQ = { l: ['0% 100%', .8, 1.12], r: ['100% 100%', .8, 1.12], u: ['50% 0%', 1.12, .84], d: ['50% 100%', 1.14, .82] };
function drawDucks(now = Date.now()) {
  const board = S && $('.board', S); if (!board || !R || !geo) return;
  const s = R.state, layer = $('.ducks', board), size = geo.size;
  const posOf = id => id === R.me && me ? me : s.pos[id];
  const ids = s.seat.filter(id => s.pos[id]), lane = ids.filter(id => posOf(id).x < 0);
  const boxes = [];
  for (const id of ids) {
    const p = s.players[id], pos = posOf(id); if (!p) continue;
    let d = layer.querySelector(`[data-pid="${id}"]`);
    if (!d) {
      d = el(`<div class="gduck${id === R.me ? ' mine' : ''}" data-pid="${esc(id)}"><div class="gduck-shadow"></div><div class="gduck-lift"><div class="gduck-body"></div><span class="gduck-name"></span><span class="gduck-done" hidden>✓</span></div></div>`);
      layer.append(d);
    }
    const sig = JSON.stringify([p.duck, p.name, p.nameStyle, !!p.dead]);   // a new look shows at once, mid-game too
    if (d._sig !== sig) {
      d._sig = sig;
      d.querySelector('.gduck-body').innerHTML = duckSVG(p.duck, { size: 64, shadow: false, title: p.name, dead: !!p.dead });
      d.querySelector('.gduck-name').innerHTML = nameHTML(p.name, p.nameStyle);
    }
    const at = place(pos, lane.indexOf(id), lane.length), z = jumpZ(pos.j, now) * size;
    const mine = id === R.me;
    const face = mine && me ? me.face : (d._x !== undefined && Math.abs(pos.x - d._x) > .0005 ? Math.sign(pos.x - d._x) : d._face || 1);
    d._face = face || 1; d._x = pos.x;
    const q = mine ? (now - squash.t < 170 ? squash.q : '') : (pos.q || '');
    const fx = portrait() ? 1 : d._face, mq = fx < 0 ? ({ l: 'r', r: 'l' }[q] || q) : q, [org, sx, sy] = SQ[mq] || ['50% 100%', 1, 1];
    const tr = `translate(${at.left.toFixed(1)}px, ${at.top.toFixed(1)}px)`, lift = `translateY(${(-z).toFixed(1)}px)`;
    const body = `scaleX(${fx})`, squish = `scale(${sx}, ${sy})`, sh = (1 - Math.min(.6, z / (size * 3.2))).toFixed(3);
    if (d._tr !== tr) { d._tr = tr; d.style.transform = tr; d.style.zIndex = Math.round(at.top); }
    if (d._sz !== size) { d._sz = size; d.style.setProperty('--sz', size + 'px'); }
    if (d._lift !== lift) { d._lift = lift; d.querySelector('.gduck-lift').style.transform = lift; }
    if (d._sh !== sh) { d._sh = sh; d.querySelector('.gduck-shadow').style.transform = `translateX(-50%) scale(${sh})`; }
    if (d._body !== body) { d._body = body; d.querySelector('.gduck-body').style.transform = body; }
    const pic = d.querySelector('.gduck-body svg');
    if (pic && pic._sq !== squish + org) { pic._sq = squish + org; pic.style.transformOrigin = org; pic.style.transform = squish; }
    d.classList.toggle('sprint', mine ? sprinting && moving : !!pos.sp);
    d.classList.toggle('air', z > 1);
    d.classList.toggle('left', d._face < 0);
    d.querySelector('.gduck-done').hidden = !s.done[id];
    boxes.push({ l: at.left - size / 2, r: at.left + size / 2, t: at.top - size - z, b: at.top - z });
  }
  layer.querySelectorAll('.gduck').forEach(d => { if (!s.pos[d.dataset.pid]) d.remove(); });
  // the column under my duck lights up
  const myCol = me && me.x >= 0 ? colOf(me.x) : -1;
  board.querySelectorAll('.col').forEach(c => c.classList.toggle('here', +c.dataset.c === myCol));
  // the Round Lord and the question turn see-through over ducks
  for (const o of board.querySelectorAll('.topover .lord, .topover .question')) {
    const r = o.getBoundingClientRect(), L = r.left - geo.left, T = r.top - geo.top;
    const hit = boxes.some(b => b.r > L && b.l < L + r.width && b.b > T && b.t < T + r.height);
    o.classList.toggle('see-through', hit);
  }
}

/* ---------- my duck ---------- */
const onBoardPhase = () => R && ['answer', 'discuss', 'results'].includes(R.state.phase);
const canWalk = () => onBoardPhase() && !(R.state.phase === 'answer' && R.state.done[R.me]) && !(R.state.phase !== 'answer' && R.state.lock[R.me] === undefined);
function xBounds() {
  const s = R.state;
  if (s.phase === 'answer') return [.03, .97];
  return colBounds(s.lock[R.me]);
}
function sendMove(force) {
  if (!me) return;
  const now = performance.now(), q = Date.now() - squash.t < 170 ? squash.q : '';
  const msg = [me.x.toFixed(4), me.y.toFixed(4), me.j, q, sprinting && moving].join();
  if (!force && (now - lastSend < 60 || msg === lastSent)) return;
  lastSend = now; lastSent = msg;
  R.send({ t: 'move', x: me.x, y: me.y, j: me.j || 0, q, sp: sprinting && moving });
}
/* would my duck at (x, y) push into another duck on the ground? (both in the air or either in the air: no) */
function bumps(x, y, now) {
  if (!geo || jumpZ(me.j, now) > geo.size * .3) return null;
  const s = R.state, a = place({ x, y }, 0, 1), rx = geo.size * .44, ry = geo.size * .2;
  for (const id of s.seat) {
    if (id === R.me || !s.pos[id] || s.pos[id].x < 0) continue;
    const o = s.pos[id]; if (jumpZ(o.j, now) > geo.size * .3) continue;
    const b = place(o, 0, 1), dx = (a.left - b.left) / (2 * rx), dy = (a.top - b.top) / (2 * ry);
    if (dx * dx + dy * dy < 1) return b;
  }
  return null;
}
function loop(t) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - (lastT || t)) / 1000); lastT = t;
  if (!S || !R) return;
  const now = Date.now();
  if (!geo) measure();
  if (me && onBoardPhase()) step(dt, now);
  drawDucks(now);
}
function step(dt, now) {
  const s = R.state;
  // a jump lands: it counts now
  if (me.j && (now - me.j) / 1000 >= jumpCfg().T) { me.j = 0; countJump(); sendMove(true); }
  const k = c => keys.has(c);
  const up = k('KeyW') || k('ArrowUp'), down = k('KeyS') || k('ArrowDown'), left = k('KeyA') || k('ArrowLeft'), right = k('KeyD') || k('ArrowRight');
  sprinting = k('ShiftLeft') || k('ShiftRight');
  let hx = (right ? 1 : 0) - (left ? 1 : 0), vy = (down ? 1 : 0) - (up ? 1 : 0);   // on screen: right, down
  if (hx || vy) target = null;
  let ax, ay;   // in board terms
  if (portrait()) { ax = -vy; ay = hx; } else { ax = hx; ay = vy; }
  if (target && me.x >= 0) {
    const dx = target.x - me.x, dy = target.y - me.y, dist = Math.hypot(dx, dy);
    if (dist < .008) target = null; else { ax = dx / dist; ay = dy / dist; }
  }
  moving = !!(ax || ay) && canWalk();
  if (!moving) { sendMove(); return; }
  if (me.x < 0) { me.x = .5; me.y = Math.max(.75, me.y); }   // the first step onto the board starts at Neutral, near the front
  const mul = sprinting ? SPEED.sprint : 1, sx = (portrait() ? SPEED.px : SPEED.x) * mul, sy = (portrait() ? SPEED.py : SPEED.y) * mul;
  const [lo, hi] = xBounds();
  let nx = me.x + ax * sx * dt, ny = me.y + ay * sy * dt, q = '';
  const scr = (dx, dy) => portrait() ? (dx > 0 ? 'u' : dx < 0 ? 'd' : dy > 0 ? 'r' : 'l') : (dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u');
  if (nx < lo || nx > hi) { q = scr(Math.sign(ax), 0); nx = Math.max(lo, Math.min(hi, nx)); }
  if (ny < 0 || ny > 1) { q = q || scr(0, Math.sign(ay)); ny = Math.max(0, Math.min(1, ny)); }
  // other ducks: try both steps, then each alone; a blocked step squashes against them
  if (bumps(nx, ny, now)) {
    if (!bumps(nx, me.y, now)) { q = q || scr(0, Math.sign(ay)); ny = me.y; }
    else if (!bumps(me.x, ny, now)) { q = q || scr(Math.sign(ax), 0); nx = me.x; }
    else { q = q || scr(Math.sign(ax), Math.sign(ay)); nx = me.x; ny = me.y; }
  }
  if (q) squash = { q, t: now };
  if (ax) me.face = Math.sign(ax);
  me.x = nx; me.y = ny;
  sendMove();
}
function jump() {
  if (!me || !onBoardPhase() || me.j) return;
  me.j = Date.now(); sendMove(true);
}
function jumpTo(c) {
  if (!canWalk() || R.state.phase !== 'answer') return;
  me.face = colX(c) >= (me.x < 0 ? .5 : me.x) ? 1 : -1;
  me.x = colX(c); if (me.y === undefined || me.y < 0) me.y = .5; target = null;
  sendMove(true);
}
function boardClick(e) {
  if (!profile.settings.mouseMove || !canWalk() || !geo) return;
  const board = e.target.closest('.board'); if (!board || e.target.closest('.topover')) return;
  const r = board.getBoundingClientRect();
  target = unplace(e.clientX - r.left, e.clientY - r.top);
  if (me.x < 0) { me.x = .5; me.y = .9; }
}

/* ---------- the views ---------- */
function lordHTML(s) {
  const q = s.qs[s.qi], p = s.players[q.by];
  return `<div class="lord"><div class="lord-sit">
    <div class="lord-duck">${p ? duckSVG(p.duck, { size: 80, shadow: false, title: p.name, dead: !!p.dead }) : ''}</div>
    <svg class="cloud-svg" viewBox="0 0 200 84" aria-hidden="true">
      <g fill="#dcebf8"><circle cx="50" cy="52" r="28"/><circle cx="92" cy="40" r="34"/><circle cx="140" cy="48" r="30"/><circle cx="170" cy="62" r="20"/><circle cx="26" cy="64" r="18"/><rect x="26" y="52" width="148" height="30" rx="15"/></g>
      <g fill="#fff"><circle cx="50" cy="48" r="26"/><circle cx="92" cy="36" r="32"/><circle cx="140" cy="44" r="28"/><circle cx="170" cy="58" r="18"/><circle cx="26" cy="60" r="16"/><rect x="28" y="50" width="144" height="26" rx="13"/></g>
      <ellipse cx="84" cy="24" rx="16" ry="6" fill="#fff" opacity=".9"/></svg></div>
    <div class="lord-label">${rainbowHTML('Round Lord')}</div>
    <div class="lord-name">${p ? nameHTML(p.name, p.nameStyle) : 'Gone'}</div></div>`;
}

function viewSubmit(s) {
  const mineDone = s.done[R.me], sent = (s.subs || []).find(q => q.by === R.me);
  return `<div class="submit-wrap">${mineDone ? `<div class="panel submit-card done-card"><h2>${sent ? 'Question sent ✓' : 'No question this round'}</h2>
      ${sent ? `<p class="q-echo">${esc(sent.text)}</p>` : ''}<p class="dim">Waiting for the others.</p></div>`
    : `<form class="panel submit-card" autocomplete="off"><h2>Your question</h2>
      <textarea maxlength="200" rows="3" placeholder="Pineapple belongs on pizza." aria-label="Your question"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <div class="sect"><h3 data-tip="How long everyone gets to answer your question.">Answer time</h3><div class="row">${[[0, 'Off'], [30, '30 s'], [60, '60 s'], [90, '90 s']].map(([v, n]) =>
        `<button type="button" class="tile" data-time="${v}" aria-pressed="${v === s.options.answerTime}">${n}</button>`).join('')}</div></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`}
    <div class="who">${whoHTML(s)}</div></div>`;
}
const whoHTML = s => s.seat.map(id => `<span class="who-chip${s.done[id] ? ' done' : ''}">${duckSVG(s.players[id].duck, { size: 26, shadow: false })}${nameHTML(s.players[id].name, s.players[id].nameStyle)}${s.done[id] ? ' ✓' : ''}</span>`).join('');

/* the stat boxes: this round's, then every round's once the review vote passes (redrawn as jumps and votes come in) */
function statsHTML(s) {
  const boxes = r => s.seat.map(id => statBoxHTML(s, id, r)).join('');
  if (s.phase === 'over') return boxes(null);
  return `<h2>Round ${s.round + 1}</h2><div class="statboxes">${boxes(s.round)}</div>
    ${s.review ? `<h2 class="all-h">All rounds</h2><div class="statboxes">${boxes(null)}</div>` : ''}`;
}
const viewResults = s => `<div class="results"><div class="stage">${boardHTML(s)}</div><aside class="statpanel"></aside></div>`;
const viewOver = s => `<div class="over"><h1 class="over-title">${rainbowHTML('Game over')}</h1>
    <p class="dim">${s.round + 1} round${s.round ? 's' : ''} · ${s.history.length} question${s.history.length === 1 ? '' : 's'}</p>
    <div class="statboxes grid"></div></div>`;

/* the middle of the bottom bar: what you can do now, and how many are done */
function actHTML(s) {
  const n = s.seat.length, d = s.seat.filter(id => s.done[id]).length, need = needed(s), mine = s.done[R.me];
  const count = `<span class="progress">${d}/${n} done${need < n ? ` · ${need} needed` : ''}</span>`;
  if (s.phase === 'submit') return count;
  if (s.phase === 'answer') {
    const onBoard = (me && me.x >= 0);
    const mc = profile.settings.multipleChoice && !mine ? `<div class="mc">${COLS.map((c, i) => `<button type="button" class="mc-b c${i + 1}" data-col="${i}">${esc(c)}</button>`).join('')}</div>` : '';
    return `${mc}<div class="act-row"><button type="button" class="btn green" data-a="end"${mine || !onBoard ? ' disabled' : ''}>${mine ? 'Answer locked ✓' : 'End turn'} <kbd>Enter</kbd></button>${count}</div>`;
  }
  if (s.phase === 'discuss') return `<div class="act-row"><button type="button" class="btn${mine ? ' yellow' : ' green'}" data-a="end">${mine ? 'Waiting ✓' : 'Next question'} <kbd>Enter</kbd></button>${count}</div>`;
  if (s.phase === 'results') {
    const rv = s.seat.filter(id => s.reviewVotes[id]).length, ev = s.seat.filter(id => s.endVotes[id]).length;
    return `<div class="act-row"><button type="button" class="btn${mine ? ' yellow' : ' green'}" data-a="end">${mine ? 'Waiting ✓' : 'Next round'} <kbd>Enter</kbd></button>
      ${s.round >= 1 && !s.review ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? ' disabled' : ''} data-tip="Adds every round's stats after this round's. One vote each round.">All-rounds review ${rv}/${need}</button>` : ''}
      <button type="button" class="btn ${s.endVotes[R.me] ? 'red' : 'ghost'}" data-a="endgame">${s.endVotes[R.me] ? 'Voted to end' : 'Vote to end the game'} ${ev}/${need}</button>${count}</div>`;
  }
  if (s.phase === 'over') return `<div class="act-row">${s.hostId === R.me ? '<button type="button" class="btn green" data-a="lobby">Back to the lobby</button>' : '<span class="dim">The host takes everyone back to the lobby.</span>'}<button type="button" class="btn ghost" data-a="leave">Leave</button></div>`;
  return '';
}

const TITLES = { submit: 'Write a question', answer: 'Answer', discuss: 'Talk it over', results: 'Results', over: '' };
function paint(force) {
  if (!S || !R) return;
  const s = R.state, key = [s.phase, s.round, s.qi].join('|');
  if (force || key !== shown) {
    const was = shown; shown = key;
    const fresh = s.pos[R.me] ? { ...s.pos[R.me], face: 1 } : null;
    if (s.phase === 'answer' || s.phase === 'results' || !me) me = fresh && { ...fresh, j: me && me.j || 0 };
    target = null;
    const main = $('.gmain', S);
    main.dataset.phase = s.phase;
    main.innerHTML = s.phase === 'submit' ? viewSubmit(s) : s.phase === 'results' ? viewResults(s) : s.phase === 'over' ? viewOver(s) : `<div class="stage">${boardHTML(s)}</div>`;
    if (was && s.phase !== was.split('|')[0]) sfx.done();
    $('.round', S).textContent = s.phase === 'over' ? '' : `Round ${s.round + 1}${s.qs.length && ['answer', 'discuss'].includes(s.phase) ? ` · Question ${s.qi + 1} of ${s.qs.length}` : ''}`;
    $('.phase', S).textContent = TITLES[s.phase] || '';
    geo = null;
  }
  if (s.phase === 'submit') { setHTML($('.who', S), whoHTML(s)); if (s.done[R.me] && $('form.submit-card', S)) paint(true); }
  // the host keeps my duck in bounds (an ended turn, the column after answering); take its word for where I am
  if (me && s.pos[R.me] && onBoardPhase()) {
    const p = s.pos[R.me];
    if ((s.phase === 'answer' && s.done[R.me]) || (s.phase !== 'answer' && (p.x !== me.x && Math.abs(p.x - me.x) > .02))) { me.x = p.x; me.y = p.y; }
    if (s.phase === 'discuss' && me.x >= 0 && s.lock[R.me] !== undefined) { const [lo, hi] = colBounds(s.lock[R.me]); me.x = Math.max(lo, Math.min(hi, me.x)); }
  }
  const lordSig = s.phase === 'answer' || s.phase === 'discuss' ? JSON.stringify(s.players[s.qs[s.qi].by] || null) : '';
  const lord = $('.topover .lord', S);
  if (lord && lord._sig !== undefined && lord._sig !== lordSig) lord.outerHTML = lordHTML(s);
  if ($('.topover .lord', S)) $('.topover .lord', S)._sig = lordSig;
  setHTML($('.gact', S), actHTML(s));
  if (s.phase === 'results') {
    const panel = $('.statpanel', S), had = panel._html && panel._html.includes('all-h');
    setHTML(panel, statsHTML(s));
    if (s.review && !had) panel.querySelector('.all-h').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (s.phase === 'over') setHTML($('.over .statboxes', S), statsHTML(s));
  showTimer();
}

function showTimer() {
  const s = R && R.state, t = S && $('.timer', S); if (!s || !t) return;
  const now = Date.now(), ends = [s.ends, s.catchEnds].filter(Boolean), end = ends.length ? Math.min(...ends) : 0;
  if (!end || !['submit', 'answer'].includes(s.phase)) { t.textContent = ''; t.className = 'timer'; return; }
  const left = Math.max(0, Math.ceil((end - now) / 1000)), catching = s.catchEnds && end === s.catchEnds;
  t.textContent = `${catching ? 'Catch-up ' : ''}${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  t.className = 'timer' + (catching ? ' catch' : '') + (left <= 5 ? ' low' : '');
  if (left <= 5 && left > 0 && left !== lastBeep) { lastBeep = left; sfx.tick(); }
}

/* ---------- the pause menu (top right, or Esc) ---------- */
function openPause() {
  if (windowOpen()) return;
  openWindow(`<h2>Paused</h2><div class="pause-list">
    <button type="button" class="btn green" data-a="resume">Resume</button>
    <button type="button" class="btn ghost" data-a="custom">Customize</button>
    <button type="button" class="btn ghost" data-a="settings">Settings</button>
    <button type="button" class="btn ghost" data-a="friends">Friends</button>
    <button type="button" class="btn red" data-a="leave">Leave game</button></div>
    <p class="small dim" style="margin-top:.8rem">The game keeps going while this is open.</p>`, {
    cls: 'win-small',
    onOpen: (w, close) => w.querySelector('.pause-list').onclick = e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      close();
      ({ resume() {}, custom: () => openCustomize(), settings: () => openSettings(), friends: () => openFriends(), leave: () => leaveTo('rooms', 'Leave the game in progress?') })[a.dataset.a]();
    },
  });
}

/* ---------- keys ---------- */
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
function keydown(e) {
  if (!S) return;
  if (e.key === 'Escape' && !windowOpen() && !typing(e)) { e.preventDefault(); openPause(); return; }
  if (typing(e) || windowOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (MOVE_KEYS.includes(e.code) && onBoardPhase()) { if (!e.code.startsWith('Shift')) e.preventDefault(); keys.add(e.code); return; }
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) jump(); return; }
  if (e.code === 'Enter' && !e.repeat) { e.preventDefault(); act('end'); }
}
const keyup = e => keys.delete(e.code);
const blur = () => keys.clear();
const resized = () => { geo = null; };

/* ---------- what the buttons do ---------- */
async function act(a) {
  const s = R.state;
  switch (a) {
    case 'end':
      if (s.phase === 'answer' && !(me && me.x >= 0)) return;
      if (s.phase === 'answer') sendMove(true);
      if (['answer', 'discuss', 'results'].includes(s.phase)) R.send({ t: 'end' });
      break;
    case 'review': R.send({ t: 'voteReview' }); break;
    case 'endgame': R.send({ t: 'voteEnd' }); break;
    case 'lobby': R.send({ t: 'toLobby' }); break;
    case 'leave': leaveTo('rooms', 'Leave the room?'); break;
    case 'notes': { const t = await pickNote(); const box = $('.submit-card textarea', S); if (t && box) { box.value = t; box.focus(); } break; }
    case 'none': if (await confirmBox('Are you sure?', 'No question from you this round.')) R.send({ t: 'submit', text: '' }); break;
  }
}

const HINTS = '<kbd>WASD</kbd> Move <kbd>Shift</kbd> Sprint <kbd>Space</kbd> Jump <kbd>Enter</kbd> End turn';
register('game', {
  guard: () => !!activeRoom(),
  exit() { const r = activeRoom(); if (r) { r.send({ t: 'leave' }); r.close(); } },
  leave() {
    if (off) off(); off = null; if (docks) docks.destroy(); docks = null; cancelAnimationFrame(raf); clearInterval(tick); S = null; shown = ''; me = null; geo = null; keys.clear();
    removeEventListener('keydown', keydown); removeEventListener('keyup', keyup); removeEventListener('blur', blur); removeEventListener('resize', resized);
  },
  render(arg) {
    R = arg || activeRoom(); if (!R) return null;
    S = el(`<section class="screen game docked">
      <header class="gbar"><div class="gbar-l"><span class="round"></span><span class="phase"></span></div>
        <div class="gbar-r"><span class="timer"></span><button type="button" class="btn ghost iconbtn" data-a="pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button></div></header>
      <div class="gmain"></div>${DOCK_HTML}${BAR_HTML('<div class="gact"></div>')}</section>`);
    docks = mountDocks(S, HINTS);
    S.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (b && !b.disabled) { if (b.dataset.a === 'pause') openPause(); else act(b.dataset.a); return; }
      const mc = e.target.closest('[data-col]'); if (mc) { jumpTo(+mc.dataset.col); return; }
      const tile = e.target.closest('.submit-card .tile[data-time]');
      if (tile) $$('.submit-card .tile[data-time]', S).forEach(t => t.setAttribute('aria-pressed', t === tile));
      boardClick(e);
    });
    S.addEventListener('submit', e => {
      if (!e.target.matches('.submit-card')) return;
      e.preventDefault();
      const f = e.target, text = f.querySelector('textarea').value.trim();
      if (!text) { f.querySelector('textarea').focus(); return; }
      const t = f.querySelector('.tile[aria-pressed="true"]');
      R.send({ t: 'submit', text, time: t ? +t.dataset.time : R.state.options.answerTime });
    });
    S.addEventListener('keydown', e => {   // Enter sends the question (Shift+Enter for a new line)
      if (e.target.matches('.submit-card textarea') && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); e.target.form.requestSubmit(); }
    });
    onMenu(S, (x, y, e) => {
      const d = e.target.closest && e.target.closest('.gduck, .statbox'); if (!d) return;
      contextMenu(x, y, [['View stats', () => openStats(R.state, d.dataset.pid, R.me)]]);
    });
    off = R.on(s => {
      if (!S) return;
      if (s.phase === 'lobby' || s.phase === 'countdown') { go('lobby', R); return; }
      paint();
    });
    addEventListener('keydown', keydown); addEventListener('keyup', keyup); addEventListener('blur', blur); addEventListener('resize', resized);
    raf = requestAnimationFrame(loop);
    tick = setInterval(showTimer, 250);
    requestAnimationFrame(() => paint(true));
    return S;
  },
});
