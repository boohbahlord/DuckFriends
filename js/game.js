/* ---------- the game screen ----------
   Write a question → for each question: everyone walks their duck onto a column and ends their turn, then talks it over
   (each duck now stays inside the column it chose) → the round's results (stat boxes; ducks stay in their column) → the
   next round, until the players vote to end the game.

   The board fills the screen. The Round Lord sits on a cloud over the top of the board with the question beside it; both
   turn see-through when a duck walks under them.

   Your duck: WASD or the arrow keys walk (Shift sprints, with speed lines); Space jumps, slow and high, with a shadow left
   on the ground (low gravity makes it slower and higher; a jump counts when the duck lands); Enter ends your turn. With
   "Mouse moves your duck" a click walks it there; with "Show multiple choice" seven buttons put it on a column. Ducks
   squash a little when they push against a wall or another duck. On a touch screen a see-through joystick appears under
   a held finger, or (Settings → Controls) a tap walks the duck there; see touch.js. On a phone held upright the board
   turns: agree at the top. Your duck moves on your screen at once and is sent to the room a few times a second; the
   others glide. */
import { register, go, leaveTo } from './router.js';
import { el, esc, $, $$, openWindow, confirmBox, typing, windowOpen, onMenu, contextMenu, setHTML, toast } from './ui.js';
import { activeRoom } from './net.js';
import { COLS, SHORT, needed, playing, VOTE_GRACE, isWyr, isBb, isLaw, twoSided, boardPhases, bbMatch, roundName, colAt, colXAt, colBoundsAt, startX, wyrStats, bbStats, isSudo, canOpen,
  isSc, SC_BOARD, SC_VOTES, scZones, zoneAt, scCanVote, scLineOf, scWriter, scStats, wordAt, cleanWord, LINE_MAX,
  isCounsel, jury, lawTally, canGiveUp, lawStats, LAW_MID } from './rules.js';
import { wordsHTML, boardHTML as storyHTML, typingHTML, statsHTML as storyStatsHTML } from './story.js';
import { lawColsHTML, lawTopHTML, LAW_BANNER, counselHTML, lawStatsHTML, lawOverHTML, sideColor } from './court.js';
import { cloudHTML, matchColors, matchColsHTML, matchTopHTML, bracketHTML, bracketTopHTML, treeSize, topicHTML, topicLiveHTML, tvoteHTML, topicsHTML, seedsHTML, othersHTML, sofarHTML, podiumHTML, bbStatsHTML, allOut } from './brackets.js';
import { mountPlayers, trackIdle, lobbyVote, kickItems } from './players.js';
import { isMuted } from './chat.js';
import { pressSpecial, confettiRain, pressFX, BULLET, SHOT_SPEED } from './specials.js';
import { duckSVG, duckRoom } from './duck.js';
import { nameHTML, fontCSS } from './name.js';
import { rainbowHTML } from './art.js';
import { statBoxHTML, openStats } from './stats.js';
import { profile, save } from './store.js';
import { openSettings, netLevel } from './settings.js';
import { openCustomize, shareLook } from './customize.js';
import { pickNote } from './notes.js';
import { openFriends } from './friends.js';
import { canAdd, requestFriend } from './account.js';
import { mountDocks, DOCK_HTML, BAR_HTML } from './dock.js';
import { countJump } from './jumps.js';
import { sfx } from './sound.js';
import { mountMap } from './maps.js';
import { knockOff, bothOff } from './duel.js';
import { hooks } from './hooks.js';
import { mountTouch, stick } from './touch.js';
import { now as clockNow } from './clock.js';

let R = null, S = null, off = null, raf = 0, tick = 0, docks = null;
let shown = '';            // which phase view is up (phase|round|question)
const keys = new Set();
let me = null;             // my duck here: { x, y, j (jump start), face }
let target = null;         // where a click or a tap asked my duck to walk: { x, y, sprint, mark }
let touchOff = null, touchedAt = 0, touchTold = false;
let squash = { q: '', t: 0 }, moving = false, sprinting = false;
let lastFx = -1, hotdogs = [], follows = [];   // the silly commands seen so far; hotdogs and E specials following their ducks
let scene = null;                // the map: its world fills the page behind the game
let lastSend = 0, lastSent = '', lastBeep = -1, lastT = 0, geo = null, lastGrace = -1, sayJob = 0;
let draftT = 0;
let pm = null, idleOff = null;   // the player menu (Tab), and the away watch
let recorded = '';               // the last round counted in my all-time stats
let lastLog = -1, bubbles = {};  // chat bubbles over the ducks: { [player]: { text, until, n } }
let lastClose = 0;   // Lawyering: the closing arguments last announced
let bbZoom = 0, losers = new Set(), seedShift = 0, knocked = new Set();   // Bicker Brackets: the bracket's zoom (0: automatic); ducks wearing the Loser's X; how far the sides' colors have turned;
                                                                         // the matches whose loser is already bumped off the cloud
let scY = 0, scT = 0, scWalk = 0, scZone = '';      // Story Chain: how far the story has scrolled, the last frame, when my duck last walked, the zone it stands in
const portrait = () => matchMedia('(orientation: portrait) and (max-width: 760px)').matches;
/* on a phone held upright the board turns (agree at the top); the bracket and the story don't: they keep their own layout */
const turned = () => portrait() && !(R && (R.state.phase === 'bracket' || isSc(R.state)));
let cam = null;   // the bracket's camera: the diagram's corner on the board (dx, dy), the bracket's offset in it (ox, oy), its zoom and size

/* ---------- movement numbers (board widths or heights per second) ---------- */
const SPEED = { x: .45, y: 1.0, px: .5, py: .85, sprint: 1.75 };
const JUMP = { normal: { T: .62, H: 1.35 }, low: { T: 1.2, H: 2 } };   // seconds in the air; apex in duck heights (low gravity: floatier, still quick)
/* a duck's jump: the Long jumps special floats longer and a little higher */
const jumpCfg = (id = R && R.me) => {
  const b = JUMP[R && R.state.options.lowGravity ? 'low' : 'normal'], p = id && R && R.state.players[id];
  return p && p.duck && p.duck.special === 'longjump' ? { T: b.T * 1.4, H: b.H * 1.15 } : b;
};
const jumpZ = (j, now, id) => { if (!j) return 0; const { T, H } = jumpCfg(id), t = (now - j) / 1000 / T; return t <= 0 || t >= 1 ? 0 : 4 * H * t * (1 - t); };

/* ---------- the board ---------- */
/* Would You Rather: two tiles, each choice in its writer's font, with an OR strip between them */
function wyrColsHTML(s) {
  const q = ['answer', 'discuss'].includes(s.phase) ? s.qs[s.qi] : null, f = q ? ` style="font-family:${esc(writerFont(s))}"` : '';
  const tile = (c, t) => `<div class="col wyr-${c ? 'b' : 'a'}" data-c="${c}"><span class="wyr-txt"${f}>${q ? esc(t) : c ? 'B' : 'A'}</span></div>`;
  return `<div class="cols wyr-cols">${tile(0, q && q.a)}<div class="wyr-or"><span>OR</span></div>${tile(1, q && q.b)}</div>`;
}
/* Bicker Brackets: a match's two seeds (no board drawn), or the bracket that ducks walk over */
const bbBoardHTML = s => s.phase === 'bracket'
  ? `<div class="board bb-board bb-bracket"><div class="cols bb-cols bb-none"></div><div class="bb-diagram">${bracketHTML(s)}</div>${bracketTopHTML(s)}<div class="ducks"></div><div class="fxl"></div></div>`
  : `<div class="board bb-board">${matchColsHTML(s)}<div class="ducks"></div><div class="fxl"></div>${matchTopHTML(s, knocked.has(matchKey(s)))}</div>`;
/* Lawyering: the offense's and the defense's sides, the attorneys' circle, both attorneys on the cloud */
const lawBoardHTML = s => `<div class="board law-board">${lawColsHTML(s)}<div class="law-ring" aria-hidden="true"></div><div class="ducks"></div><div class="fxl"></div>${LAW_BANNER}
  ${['answer', 'discuss'].includes(s.phase) ? lawTopHTML(s, knocked.has(caseKey(s))) : ''}</div>`;
const boardHTML = s => isSc(s) ? storyHTML(s, R.me) : isBb(s) ? bbBoardHTML(s) : isLaw(s) ? lawBoardHTML(s) : `<div class="board">
  ${isWyr(s) ? wyrColsHTML(s) : `<div class="cols">${COLS.map((c, i) => `<div class="col c${i + 1}" data-c="${i}"><span class="col-name">${esc(c)}<span class="cb-mark">${SHORT[i]}</span></span></div>`).join('')}</div>`}
  <div class="ducks"></div><div class="fxl"></div>
  ${s.phase === 'answer' || s.phase === 'discuss' ? `<div class="topover">${lordHTML(s)}<p class="question" style="font-family:${esc(writerFont(s))}">${esc(isWyr(s) ? 'Would you rather' : s.qs[s.qi].text)}</p></div>` : ''}</div>`;   // (Would You Rather: the choices are on the tiles)

/* the board's measurements, taken again when the window or the docks change */
function measure() {
  const board = S && $('.board', S); if (!board) { geo = null; return; }
  if (isSc(R.state)) return measureStory(board);
  const cols = $('.cols', board), r = board.getBoundingClientRect(), H = cols.offsetHeight, top0 = cols.offsetTop;
  const size = Math.max(34, Math.min(100, (turned() ? H / 7 : board.offsetWidth / 7) * .62));
  const label = board.querySelector('.col-name'), labelH = turned() ? 0 : (label ? label.offsetHeight + 12 : 30);
  geo = { W: r.width, H, top0, size, labelH, left: r.left, top: r.top };
}
/* Story Chain: the rows' places in the story (its zones, in order) and the view over it */
function measureStory(board) {
  const view = $('.sc-view', board), list = $('.sc-rows', view); if (!view || !list) { geo = null; return; }
  const r = view.getBoundingClientRect(), size = Math.max(30, Math.min(56, r.height / 7));
  geo = { W: r.width, H: r.height, top0: 0, size, labelH: 0, left: r.left, top: r.top, sc: true, rows: [...list.children].map(e => ({ top: e.offsetTop, h: Math.max(1, e.offsetHeight) })), contentH: list.offsetHeight };
}
/* the story slides to keep my duck in view; while a line is typed and my duck stands still, it shows that line */
function panStory(pos, now) {
  const list = S.querySelector('.sc-rows'); if (!list || !geo || !geo.rows.length) return;
  const dt = Math.min(.1, Math.max(0, (now - (scT || now)) / 1000)); scT = now;
  const n = geo.rows.length, max = Math.max(0, geo.contentH - geo.H), last = geo.rows[n - 1];
  let want;
  if (R.state.phase === 'write' && now - scWalk > 2500) want = last.top + last.h - geo.H + geo.size * .9;   // (room for the names under the ducks)
  else if (pos) { const u = Math.max(0, Math.min(.9999, pos.y)) * n, row = geo.rows[Math.floor(u)]; want = row.top + row.h * (u % 1) - geo.H * .55; }
  else want = scY;
  want = Math.max(0, Math.min(max, want));
  scY = Math.abs(want - scY) < .5 ? want : scY + (want - scY) * Math.min(1, dt * 5);
  const tr = `translateY(${(-scY).toFixed(1)}px)`;
  if (list._tr !== tr) {
    list._tr = tr; list.style.transform = tr;
    const v = list.parentNode; v.classList.toggle('more-up', scY > 8); v.classList.toggle('more-down', scY < max - 8);   // more story above or below
  }
}
/* where a duck stands: x along the answers (0 strongly disagree … 1 strongly agree), y across */
function place(p, i, n) {
  if (geo && geo.sc) {   // Story Chain: y runs down the rows, each row the same share of it
    const k = geo.rows.length; if (!k) return { left: geo.W * p.x, top: geo.H / 2 };
    const u = Math.max(0, Math.min(.9999, p.y)) * k, row = geo.rows[Math.floor(u)];
    return { left: geo.W * p.x, top: row.top + row.h * (u % 1) - scY };
  }
  if (cam && R.state.phase === 'bracket') return { left: cam.dx + cam.ox + p.x * cam.W * cam.z, top: cam.dy + cam.oy + p.y * cam.H * cam.z };   // on the bracket itself, the same spot on every screen
  const { W, H, top0, size, labelH } = geo;
  if (p.x < 0) p = { ...p, x: startX(R.state) };   // (ducks start on the board; this only covers an old state)
  if (turned()) return { left: W * (.1 + p.y * .8), top: top0 + H * (1 - p.x) + size * .45 };
  return { left: W * p.x, top: top0 + size * 1.08 + p.y * (H - size * 1.08 - labelH) };
}
function unplace(px, py) {   // the inverse, for clicks
  const { W, H, size, labelH } = geo, cl = v => Math.max(0, Math.min(1, v));
  if (geo.sc) {
    const y = py + scY, rows = geo.rows; if (!rows.length) return { x: cl(px / W), y: .5 };
    let k = rows.findIndex(r => y < r.top + r.h); if (k < 0) k = rows.length - 1;
    return { x: cl(px / W), y: cl((k + cl((y - rows[k].top) / rows[k].h) * .999) / rows.length) };
  }
  if (cam && R.state.phase === 'bracket') return { x: cl((px - cam.dx - cam.ox) / (cam.W * cam.z)), y: cl((py - cam.dy - cam.oy) / (cam.H * cam.z)) };
  py -= geo.top0;
  if (turned()) return { x: cl(1 - (py - size * .45) / H), y: cl((px / W - .1) / .8) };
  return { x: cl(px / W), y: cl((py - size * 1.08) / (H - size * 1.08 - labelH)) };
}

/* ---------- drawing the ducks (every frame: jumps and glides) ---------- */
const SQ = { l: ['0% 100%', .8, 1.12], r: ['100% 100%', .8, 1.12], u: ['50% 0%', 1.12, .84], d: ['50% 100%', 1.14, .82] };
function drawDucks(now = clockNow()) {
  const board = S && $('.board', S); if (!board || !R || !geo) return;
  const s = R.state, layer = $('.ducks', board), size = geo.size;
  const posOf = id => id === R.me && me ? me : s.pos[id];
  if (s.phase === 'bracket') panTree(posOf(R.me)); else cam = null;   // (the camera first: ducks stand on the bracket)
  if (geo.sc) panStory(me, now);
  const ids = s.seat.filter(id => s.pos[id]), lane = ids.filter(id => posOf(id).x < 0);
  const boxes = [];
  for (const id of ids) {
    const p = s.players[id], pos = posOf(id); if (!p) continue;
    let d = layer.querySelector(`[data-pid="${id}"]`);
    if (!d) {
      d = el(`<div class="gduck${id === R.me ? ' mine' : ''}" data-pid="${esc(id)}"><span class="gduck-ring"></span><div class="gduck-shadow"></div><div class="gduck-lift"><span class="gduck-bubble"></span><span class="gduck-zz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span><span class="gduck-fire" aria-hidden="true"><i></i><i></i><i></i></span><span class="gduck-say"></span><div class="gduck-body"></div><svg class="gduck-x" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 7L33 33M33 7L7 33"/></svg><span class="gduck-name"></span><span class="gduck-done" hidden>✓</span></div></div>`);
      layer.append(d);
    }
    const sig = JSON.stringify([p.duck, p.name, p.nameStyle, !!p.dead]);   // a new look shows at once, mid-game too
    if (d._sig !== sig) {
      d._sig = sig;
      d.querySelector('.gduck-body').innerHTML = duckSVG(p.duck, { size: 64, shadow: false, title: p.name, dead: !!p.dead });
      d.querySelector('.gduck-name').innerHTML = nameHTML(p.name, p.nameStyle);
    }
    const at = place(pos, lane.indexOf(id), lane.length), z = jumpZ(pos.j, now, id) * size;
    const mine = id === R.me;
    const face = mine && me ? me.face : (d._x !== undefined && Math.abs(pos.x - d._x) > .0005 ? Math.sign(pos.x - d._x) : d._face || 1);
    d._face = face || 1; d._x = pos.x;
    const q = mine ? (now - squash.t < 170 ? squash.q : '') : (pos.q || '');
    const fx = turned() ? 1 : d._face, mq = fx < 0 ? ({ l: 'r', r: 'l' }[q] || q) : q, [org, sx, sy] = SQ[mq] || ['50% 100%', 1, 1];
    const tr = `translate(${at.left.toFixed(1)}px, ${at.top.toFixed(1)}px)`, lift = `translateY(${(-z).toFixed(1)}px)`;
    const deadPose = p.dead && !(p.duck && p.duck.image);
    const body = `scaleX(${fx})${deadPose ? ' rotate(-100deg) translateY(-12%)' : ''}`, squish = `scale(${sx}, ${sy})`, sh = (1 - Math.min(.6, z / (size * 3.2))).toFixed(3);
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
    d.classList.toggle('idle', !!p.idle);   // gone quiet: Zs float up
    const lx = losers.has(id); if (d._lx !== lx) { d._lx = lx; d.classList.toggle('loser', lx); }   // the Loser's X special
    const say = bubbles[id], saying = !!say && now < say.until;   // their newest chat message, for a few seconds
    if (saying) { const sb = d.querySelector('.gduck-say'); if (sb._n !== say.n) { sb._n = say.n; sb.textContent = say.text; } }
    if (d._saying !== saying) { d._saying = saying; d.classList.toggle('saying', saying); }
    /* free roam: a see-through bubble in the color of the column the duck stands on (its vote) */
    const bub = s.options.freeRoam && s.phase === 'answer' && pos.x >= 0 ? colAt(s, pos.x) : -1;
    if (d._bub !== bub) { d._bub = bub; d.classList.toggle('bubbled', bub >= 0); if (bub >= 0) d.style.setProperty('--bub', isBb(s) ? `var(--seed-${bub ? 'b' : 'a'})` : isWyr(s) ? `var(--wyr-${bub ? 'b' : 'a'})` : `var(--c${bub + 1})`); }
    /* Lawyering: a ring on the ground in the color of the side a juror stands on, faint until they vote for it */
    const ring = lawRing(s, id, pos);
    if (d._ring !== ring) { d._ring = ring; if (ring) d.dataset.ring = ring; else delete d.dataset.ring; }
    boxes.push({ l: at.left - size / 2, r: at.left + size / 2, t: at.top - size - z, b: at.top - z });
  }
  layer.querySelectorAll('.gduck').forEach(d => { if (!s.pos[d.dataset.pid]) d.remove(); });
  /* the handgun's bullets, flying across the board */
  const fxl = $('.fxl', board), live = new Set();
  for (const sh of s.shots || []) {
    const x = sh.x0 + sh.dir * SHOT_SPEED * (now - sh.t) / 1000; if (x < -.3 || x > 1.3) continue;   // (it flies on past the board)
    live.add(String(sh.n));
    let b = fxl.querySelector(`.bullet[data-n="${sh.n}"]`);
    if (!b) { b = el(`<div class="bullet" data-n="${sh.n}">${BULLET}</div>`); if (sh.dir < 0) b.classList.add('left'); fxl.append(b); }
    const a = place({ x, y: sh.y }, 0, 1); b.style.transform = `translate(${a.left.toFixed(1)}px, ${(a.top - size * .41 - 7).toFixed(1)}px)`;   // out of the gun's barrel (the bullet is 14px tall)
  }
  fxl.querySelectorAll('.bullet').forEach(b => { if (!live.has(b.dataset.n)) b.remove(); });
  let mark = layer.querySelector('.touch-mark');
  if (target && target.mark) {
    if (!mark) { mark = el('<div class="touch-mark"></div>'); layer.prepend(mark); }
    const a = place(target, 0, 1), tr = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px)`;
    if (mark._tr !== tr) { mark._tr = tr; mark.style.transform = tr; }
    mark.classList.remove('gone'); mark.classList.toggle('sprint', !!target.sprint);
  } else if (mark) mark.classList.add('gone');
  // hotdogs hang around their duck, then fade; an E special (mug, gun, spray) stays with its duck while it walks
  hotdogs = hotdogs.filter(h => { if (now > h.until || !s.pos[h.id]) { h.el.remove(); return false; } return true; });
  for (const h of hotdogs) {
    const pos = posOf(h.id), at = place(pos, lane.indexOf(h.id), lane.length), z = jumpZ(pos.j, now, h.id) * size;
    h.el.style.transform = `translate(${(at.left + size * .62).toFixed(1)}px, ${(at.top - size * .9 - z).toFixed(1)}px)`;
    h.el.classList.toggle('going', now > h.until - 900);
  }
  follows = follows.filter(f => { if (now > f.until || !s.pos[f.id]) { f.el.remove(); return false; } return true; });
  for (const f of follows) {
    const pos = posOf(f.id), at = place(pos, lane.indexOf(f.id), lane.length), z = jumpZ(pos.j, now, f.id) * size;
    const tr = `translate(${at.left.toFixed(1)}px, ${(at.top - z).toFixed(1)}px)`;
    if (f.el._tr !== tr) { f.el._tr = tr; f.el.style.transform = tr; }
  }
  if (geo.sc) { storyMarks(s, board); return; }
  // the column under my duck lights up
  const myCol = me && me.x >= 0 ? colAt(s, me.x) : -1;
  board.querySelectorAll('.col').forEach(c => c.classList.toggle('here', +c.dataset.c === myCol));
  const vb = S.querySelector('.vote-btn'); if (vb && vb.dataset.col !== String(myCol)) { vb.dataset.col = myCol; if (isLaw(s)) setHTML($('.gact', S), gactHTML(s)); }   // (Lawyering: Vote, Voted or Change vote)
  placeRing(board);
  // the Round Lord and the question turn see-through over ducks
  for (const o of board.querySelectorAll('.topover .lord, .topover .question')) {
    const r = o.getBoundingClientRect(), L = r.left - geo.left, T = r.top - geo.top;
    const hit = boxes.some(b => b.r > L && b.l < L + r.width && b.b > T && b.t < T + r.height);
    o.classList.toggle('see-through', hit);
  }
}
/* ---------- Lawyering: the attorneys' circle ---------- */
/* its half width and half height: a circle filling the strip between the sides; on a phone held upright the strip runs
   across the screen, so the circle stretches along it and both attorneys fit side by side */
const ringR = () => turned() ? [geo.W * .8 * .26, geo.H * (LAW_MID[1] - LAW_MID[0]) * .46] : Array(2).fill(geo.W * (LAW_MID[1] - LAW_MID[0]) * .46);
function placeRing(board) {
  const ring = board.querySelector('.law-ring'); if (!ring || !geo) return;
  const c = place({ x: .5, y: .5 }, 0, 1), [rx, ry] = ringR(), st = `${(c.left - rx).toFixed(1)},${(c.top - geo.size * .3 - ry).toFixed(1)},${(2 * rx).toFixed(1)},${(2 * ry).toFixed(1)}`;
  if (ring._st === st) return;
  ring._st = st; const [l, t, w, h] = st.split(',');
  Object.assign(ring.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
}
/* an attorney's feet stay inside the circle */
function inRing(x, y) {
  const c = place({ x: .5, y: .5 }, 0, 1), a = place({ x, y }, 0, 1), [rx, ry] = ringR().map(r => Math.max(4, r - geo.size * (turned() ? .42 : .3)));
  const dx = a.left - c.left, dy = a.top - c.top, k = Math.hypot(dx / rx, dy / ry);
  if (k <= 1) return [x, y];
  const u = unplace(c.left + dx / k, c.top + dy / k); return [u.x, u.y];
}
const attorney = () => isLaw(R.state) && !!R.state.law && isCounsel(R.state, R.me) && ['answer', 'discuss'].includes(R.state.phase);
/* a juror's ring: 'a' or 'b' (the side), with ' faint' until they've voted for that side */
function lawRing(s, id, pos) {
  const L = s.law; if (!isLaw(s) || !L || !['answer', 'discuss'].includes(s.phase) || isCounsel(s, id) || (s.players[id] || {}).late) return '';
  const v = L.votes[id], c = s.phase === 'answer' ? (pos.x >= 0 ? colAt(s, pos.x) : -1) : v ?? -1;
  return c < 0 ? '' : (c ? 'b' : 'a') + (v === c ? '' : ' faint');
}
const caseKey = s => [s.startedAt, s.round, s.qi].join();

/* Story Chain: the row under my duck lights up while voting, and the Vote button wears its color */
function storyMarks(s, board) {
  const zones = scZones(s), z = me ? zoneAt(s, me.y, zones) : null, k = zones.indexOf(z), vote = SC_VOTES.includes(s.phase);
  const can = vote && scCanVote(s, R.me, z);   // (a row you can't vote for lights up grey)
  board.querySelectorAll('.sc-row').forEach(r => { const on = vote && z !== 'H' && +r.dataset.z === k; r.classList.toggle('here', on); r.classList.toggle('nope', on && !can); });
  if (z === scZone) return;
  scZone = z;
  const l = scLineOf(s, z), who = l ? l.line.by : /^W:/.test(z || '') ? z.slice(2) : null, p = who && s.players[who];
  S.style.setProperty('--vb', p ? (p.card && p.card.color) || '#8a8fa3' : ({ 'C:cont': 'var(--green)', 'C:new': 'var(--blue)', 'C:lobby': 'var(--orange)' })[z] || 'var(--green)');
  if (vote) setHTML($('.gact', S), gactHTML(s));   // (your own line or word can't be voted for)
}
/* the ducks walk on the bracket itself (x, y across the whole bracket), so everyone sees them over the same matches; the
   bracket slides to keep my duck in view */
const bracketZoom = (box, b) => { const { W, H } = treeSize(b); return { W, H, fit: Math.min(1, box.clientWidth / W, box.clientHeight / H) }; };
function panTree(pos) {
  const box = S.querySelector('.bb-diagram'), tree = box && box.firstElementChild; if (!tree || !geo) { cam = null; return; }
  const { W, H, fit } = bracketZoom(box, R.state.bb), z = bbZoom || Math.max(fit, .55), bw = box.clientWidth, bh = box.clientHeight;
  const p = pos && pos.x >= 0 ? pos : { x: .5, y: .5 };
  const follow = (size, view, f) => size <= view ? (view - size) / 2 : Math.max(view - size, Math.min(0, view / 2 - f * size));   // centered on my duck, never past the edges
  const ox = follow(W * z, bw, p.x), oy = follow(H * z, bh, p.y);
  cam = { dx: box.offsetLeft, dy: box.offsetTop, ox, oy, z, W, H };
  const tr = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${z.toFixed(3)})`;
  if (tree._tr !== tr) { tree._tr = tr; tree.style.transform = tr; }
}
function zoom(how) {
  const box = S && S.querySelector('.bb-diagram'); if (!box) return;
  const { fit } = bracketZoom(box, R.state.bb), z = bbZoom || Math.max(fit, .55);
  bbZoom = how === 'fit' ? fit : Math.max(.2, Math.min(2.5, z * (how === 'in' ? 1.25 : .8)));
}

/* ---------- the silly commands: lightning, love, kill, hotdog ---------- */
const HOTDOG = `<svg viewBox="-34 -24 68 30" width="100%"><path d="M-24-13C-26-18-20-21-12-19L14-19C22-21 27-17 25-12Z" fill="#e2a65a" stroke="#1c1c28" stroke-width="1.6"/><rect x="-31" y="-17" width="62" height="10" rx="5" fill="#c0502b" stroke="#1c1c28" stroke-width="1.6"/><path d="M-24-13l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3" stroke="#f2c230" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-27-9C-28-1-20 2-10 2L10 2C20 2 28-1 27-9C18-6-18-6-27-9Z" fill="#eab36a" stroke="#1c1c28" stroke-width="1.6"/></svg>`;
function playFx(f) {
  const s = R.state, fxl = S && $('.fxl', S); if (!fxl || !geo) return;
  const now = clockNow(), size = geo.size, posOf = id => id === R.me && me ? me : s.pos[id];
  const spot = id => { const p = posOf(id); return p ? place(p.x < 0 ? { ...p, x: .5 } : p, 0, 1) : null; };
  if (f.kind === 'lightning') {
    const at = spot(f.who[0]); if (!at) return;
    let d = `M${at.left + (Math.random() - .5) * 40} 0`, y = 0;
    const x0 = at.left, yEnd = at.top - size * .6;
    while (y < yEnd - 30) { y += 24 + Math.random() * 30; d += `L${(x0 + (Math.random() - .5) * 46).toFixed(1)} ${Math.min(y, yEnd).toFixed(1)}`; }
    d += `L${x0} ${yEnd}`;
    const bolt = el(`<svg class="fx-bolt" width="${geo.W}" height="${geo.top0 + geo.H}"><path d="${d}" stroke="#fff6b0" stroke-width="7" fill="none" stroke-linejoin="bevel" opacity=".55"/><path d="${d}" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linejoin="bevel"/></svg>`);
    const flash = el('<div class="fx-flash"></div>');
    fxl.append(bolt, flash); setTimeout(() => { bolt.remove(); flash.remove(); }, 700);
    const dk = S.querySelector(`.gduck[data-pid="${f.who[0]}"]`); if (dk) { dk.classList.add('zapped'); setTimeout(() => dk.classList.remove('zapped'), 1400); }
    sfx.zap();
  } else if (f.kind === 'love') {
    const a = spot(f.who[0]), b = spot(f.who[1]); if (!a || !b) return;
    const pa = s.players[f.who[0]], pb = s.players[f.who[1]];
    const x = (a.left + b.left) / 2, y = Math.min(a.top, b.top) - size * .4;
    const heart = el(`<div class="fx-heart" style="left:${x}px;top:${y}px;--rise:${(-y - 40).toFixed(0)}px"><svg viewBox="0 0 100 90" class="fx-heart-bg"><path d="M50 86C14 60 2 42 4 26 6 10 20 2 32 3c8 1 14 6 18 13 4-7 10-12 18-13 12-1 26 7 28 23 2 16-10 34-46 60z" fill="#ff4f8b" stroke="#fff" stroke-width="3"/></svg>
      <div class="fx-heart-ducks">${pa ? duckSVG(pa.duck, { size: 40, shadow: false, title: pa.name }) : ''}${pb ? duckSVG({ ...pb.duck }, { size: 40, shadow: false, title: pb.name }).replace('<svg ', '<svg style="transform:scaleX(-1)" ') : ''}</div></div>`);
    fxl.append(heart); setTimeout(() => heart.remove(), 4200);
    sfx.love();
  } else if (f.kind === 'kill') {
    sfx.bonk();
  } else if (f.kind === 'use') {   // an E special at its duck, moving with it (drawDucks places it each frame)
    if (!spot(f.by)) return;
    const wrap = el('<div class="spe-follow"></div>');
    wrap.append(...pressFX(f.what, 0, 0, size, f.face || 1));
    fxl.append(wrap); follows.push({ id: f.by, el: wrap, until: now + 2200 });
    ({ coffee: sfx.sip, hotdog: sfx.chomp, watergun: sfx.splash, confgun: sfx.pop, handgun: sfx.bang, sound: sfx.quack })[f.what]?.();
  } else if (f.kind === 'fire') {   // flames for a moment, then charred; the burns fade in a few seconds
    const dk = S.querySelector(`.gduck[data-pid="${f.who[0]}"]`); if (!dk) return;
    clearTimeout(dk._fireT); clearTimeout(dk._burnT);
    dk.classList.remove('burnt'); dk.classList.add('onfire');
    dk._fireT = setTimeout(() => { dk.classList.remove('onfire'); dk.classList.add('burnt'); }, 1600);
    dk._burnT = setTimeout(() => { dk.classList.remove('burnt'); dk.classList.add('unburn'); dk._burnT = setTimeout(() => dk.classList.remove('unburn'), 2600); }, 4000);
    sfx.fire();
  } else if (f.kind === 'hotdog') {
    const node = el(`<div class="fx-hotdog" style="width:${(size * .8).toFixed(0)}px">${HOTDOG}</div>`);
    fxl.append(node); hotdogs.push({ id: f.who[0], el: node, until: now + 7000 });
    sfx.hotdog();
  }
}

/* ---------- my duck ---------- */
const onBoardPhase = () => R && boardPhases(R.state).includes(R.state.phase);
const locked = () => isSc(R.state) ? SC_VOTES.includes(R.state.phase) && !!R.state.done[R.me] : R.state.phase === 'answer' && R.state.done[R.me] && !R.state.options.freeRoam && !isLaw(R.state);   // an ended turn holds its answer (not in free roam; a juror may change their vote)
const late = () => !!(R.state.players[R.me] || {}).late;   // joined mid-round: walks anywhere, plays from the next writing stage
const roams = () => ['answer', 'bracket'].includes(R.state.phase) || isSc(R.state) || late();   // anywhere on the board (else inside my column)
const canWalk = () => onBoardPhase() && !locked() && !(!roams() && R.state.lock[R.me] === undefined);
function xBounds() {
  const s = R.state;
  if (roams()) return [.03, .97];
  return colBoundsAt(s, s.lock[R.me]);
}
function sendMove(force) {
  if (!me) return;
  const now = performance.now(), q = clockNow() - squash.t < 170 ? squash.q : '';
  const msg = [me.x.toFixed(4), me.y.toFixed(4), me.j, q, sprinting && moving].join();
  if (!force && (now - lastSend < (R.online ? [90, 140, 220][netLevel()] : 60) || msg === lastSent)) return;   // online: less often (Data saving, Poor connection: less still)
  lastSend = now; lastSent = msg;
  R.send({ t: 'move', x: me.x, y: me.y, j: me.j || 0, q, sp: sprinting && moving });
}
/* would my duck at (x, y) push into another duck on the ground? (both in the air or either in the air: no) A bigger or
   fatter duck takes more room, a small or skinny one less. */
function bumps(x, y, now) { return crowd(x, y, now).b; }
/* how far into other ducks my duck at (x, y) would be: d is 0 when clear, up to 1 when right on top of one */
function crowd(x, y, now) {
  const out = { d: 0, b: null };
  if (!geo || jumpZ(me.j, now, R.me) > 0) return out;   // in the air: over everyone
  const s = R.state, a = place({ x, y }, 0, 1), rx = geo.size * .44, ry = geo.size * .2, ka = duckRoom((s.players[R.me] || {}).duck);
  for (const id of s.seat) {
    if (id === R.me || !s.pos[id] || s.pos[id].x < 0) continue;
    const o = s.pos[id]; if (jumpZ(o.j, now, id) > 0) continue;
    const kb = duckRoom((s.players[id] || {}).duck);
    const b = place(o, 0, 1), dx = (a.left - b.left) / (rx * (ka.x + kb.x)), dy = (a.top - b.top) / (ry * (ka.y + kb.y)), d = 1 - (dx * dx + dy * dy);
    if (d > out.d) { out.d = d; out.b = b; }
  }
  return out;
}
function loop(t) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - (lastT || t)) / 1000); lastT = t;
  if (!S || !R) return;
  const now = clockNow();
  if (!geo) measure();
  if (me && onBoardPhase()) step(dt, now);
  if (scene) scene.update(now);
  shiftSides(R.state, now);
  drawDucks(now);
}
function step(dt, now) {
  const s = R.state;
  // a jump lands: it counts now
  if (me.j && (now - me.j) / 1000 >= jumpCfg().T) { me.j = 0; countJump(); sendMove(true); }
  const k = c => keys.has(c);
  const up = k('KeyW') || k('ArrowUp'), down = k('KeyS') || k('ArrowDown'), left = k('KeyA') || k('ArrowLeft'), right = k('KeyD') || k('ArrowRight');
  let hx = (right ? 1 : 0) - (left ? 1 : 0), vy = (down ? 1 : 0) - (up ? 1 : 0);   // on screen: right, down
  if (!hx && !vy && (stick.x || stick.y)) { hx = stick.x; vy = stick.y; }       // the joystick: slower near its middle
  if (hx || vy) target = null;
  sprinting = k('ShiftLeft') || k('ShiftRight') || stick.sprint || !!(target && target.sprint);
  let ax, ay;   // in board terms
  if (turned()) { ax = -vy; ay = hx; } else { ax = hx; ay = vy; }
  if (target && me.x >= 0) {
    const [lo, hi] = xBounds(); target.x = Math.max(lo, Math.min(hi, target.x));
    const dx = target.x - me.x, dy = target.y - me.y, dist = Math.hypot(dx, dy);
    if (target.best === undefined || dist < target.best - .002) { target.best = dist; target.since = now; }
    if (dist < .008 || now - target.since > 700) target = null;   // there, or held up by another duck
    else { ax = dx / dist; ay = dy / dist; }
  }
  moving = !!(ax || ay) && canWalk();
  /* a jump can end inside another duck (in the air they pass over each other); on the ground they ease apart */
  const other = canWalk() && bumps(me.x, me.y, now);
  if (other && !moving) {
    const a = place(me, 0, 1), dx = a.left - other.left || (Math.random() - .5), dy = a.top - other.top || (Math.random() - .5), d = Math.hypot(dx, dy);
    const [lo0, hi0] = xBounds();
    me.x = Math.max(lo0, Math.min(hi0, me.x + dx / d * .22 * dt));
    me.y = Math.max(0, Math.min(1, me.y + dy / d * .55 * dt));
    sendMove(); return;
  }
  if (!moving) { sendMove(); return; }
  if (me.x < 0) { me.x = .5; me.y = Math.max(.75, me.y); }   // the first step onto the board starts at Neutral, near the front
  let onTree = cam && s.phase === 'bracket' ? [geo.W / (cam.W * cam.z), geo.H / (cam.H * cam.z)] : [1, 1];   // (on the bracket: the same speed on the screen)
  if (geo && geo.sc && geo.rows.length) { const k = geo.rows.length, row = geo.rows[Math.min(k - 1, Math.floor(Math.max(0, Math.min(.9999, me.y)) * k))]; onTree = [1, geo.H * .9 / SPEED.y / (row.h * k)]; scWalk = now; }   // (the story: the same speed on the screen in any row)
  const mul = sprinting ? SPEED.sprint : 1;
  const sx = (turned() ? SPEED.px : SPEED.x) * mul * onTree[0], sy = (turned() ? SPEED.py : SPEED.y) * mul * onTree[1];
  const [lo, hi] = xBounds();
  let nx = me.x + ax * sx * dt, ny = me.y + ay * sy * dt, q = '';
  const scr = (dx, dy) => turned() ? (dx > 0 ? 'u' : dx < 0 ? 'd' : dy > 0 ? 'r' : 'l') : (dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u');
  if (nx < lo || nx > hi) { q = scr(Math.sign(ax), 0); nx = Math.max(lo, Math.min(hi, nx)); }
  if (ny < 0 || ny > 1) { q = q || scr(0, Math.sign(ay)); ny = Math.max(0, Math.min(1, ny)); }
  if (attorney()) { const [rx, ry] = inRing(nx, ny); if (rx !== nx || ry !== ny) { q = q || scr(Math.sign(ax), Math.sign(ay)); nx = rx; ny = ry; } }   // the attorneys argue from the circle
  // other ducks: try both steps, then each alone; a blocked step squashes against them. A step is blocked only when it
  // goes further into a duck, so a duck that walked onto mine (computers walk through everyone) never pins it
  const here = crowd(me.x, me.y, now).d, into = (x, y) => { const d = crowd(x, y, now).d; return d > 0 && d > here - 1e-6; };
  if (into(nx, ny)) {
    if (!into(nx, me.y)) { q = q || scr(0, Math.sign(ay)); ny = me.y; }
    else if (!into(me.x, ny)) { q = q || scr(Math.sign(ax), 0); nx = me.x; }
    else { q = q || scr(Math.sign(ax), Math.sign(ay)); nx = me.x; ny = me.y; }
  }
  if (q) squash = { q, t: now };
  if (ax) me.face = Math.sign(ax);
  me.x = nx; me.y = ny;
  sendMove();
}
/* reset duck: somewhere random on the board, or inside your column once you have voted (never inside another duck) */
function resetDuck() {
  if (!me || !onBoardPhase() || !geo) return '✗ That works on the board.';
  if (isSc(R.state) && locked()) return '✗ Your vote holds your duck there.';
  const s = R.state, inCol = s.phase === 'bracket' || isSc(s) ? null : s.phase !== 'answer' ? s.lock[R.me] : (s.done[R.me] && !s.options.freeRoam ? colAt(s, me.x) : null);
  if (inCol === undefined) return '✗ No answer, no column to go back to.';
  const [lo, hi] = attorney() ? [.47, .53] : inCol === null ? [.04, .96] : colBoundsAt(s, inCol), now = clockNow();
  let x = me.x, y = me.y;
  for (let k = 0; k < 30; k++) { x = lo + Math.random() * (hi - lo); y = attorney() ? .4 + Math.random() * .2 : Math.random(); if (!bumps(x, y, now)) break; }
  me.x = x; me.y = y; me.j = 0; target = null;
  R.send({ t: 'move', x, y, j: 0, reset: true });
  return inCol === null ? 'Duck reset: somewhere new.' : 'Duck reset: somewhere new in your column.';
}
function jump() {
  if (!me || !onBoardPhase() || me.j) return;
  me.j = clockNow(); sendMove(true);
}
function jumpTo(c) {
  if (!canWalk() || R.state.phase !== 'answer') return;
  const x = colXAt(R.state, c);
  me.face = x >= (me.x < 0 ? .5 : me.x) ? 1 : -1;
  me.x = x; if (me.y === undefined || me.y < 0) me.y = .5; target = null;
  sendMove(true);
}
/* what ducks stand in: the board, or the story's view */
const origin = board => board && (isSc(R.state) ? $('.sc-view', board) : board);
function boardClick(e) {
  if (!profile.settings.mouseMove || !canWalk() || !geo || performance.now() - touchedAt < 900) return;
  const board = origin(e.target.closest('.board')); if (!board || e.target.closest('.topover, .sc-write')) return;
  const r = board.getBoundingClientRect();
  target = unplace(e.clientX - r.left, e.clientY - r.top);
  if (me.x < 0) { me.x = .5; me.y = .9; }
}
/* touch: walk to a spot on the screen (a faint white circle marks it), and where my duck is on the screen */
function walkTo(cx, cy, sprint) {
  if (!me || !canWalk()) return;
  if (!geo) measure(); const board = S && origin($('.board', S)); if (!board || !geo) return;
  const r = board.getBoundingClientRect();
  target = { ...unplace(cx - r.left, cy - r.top), sprint, mark: true };
}
function duckAt() {
  const board = S && origin($('.board', S)); if (!board || !geo || !me) return null;
  const r = board.getBoundingClientRect(), a = place(me, 0, 1);
  return { x: r.left + a.left, y: r.top + a.top };
}

/* ---------- the cloud's words: letters that fade in (with a sparkle) and out (with a breath) ---------- */
function say(text, small = false) {
  const el = S && $('.topover .lord-say', S); if (!el) return;
  let i = 0;
  el.className = 'lord-say' + (small ? ' small' : '');
  el.innerHTML = text.split(' ').map(w => `<span class="w">${[...w].map(ch => `<span style="animation-delay:${(i++ * 38)}ms">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  sfx.letters(text.length);
}
function unsay() { const el = S && $('.topover .lord-say', S); if (!el || !el.textContent) return; el.classList.add('out'); sfx.fade(); }
const pause = ms => new Promise(ok => setTimeout(ok, ms));
/* a question starts: "Vote" once voting opens; the votes are in: the news, then the question to talk over */
async function announce(phase) {
  const job = ++sayJob;
  if (phase === 'answer' || (isSc(R.state) && ['lvote', 'wvote'].includes(phase))) { await pause(Math.max(250, graceLeftMs(R.state))); if (job === sayJob) say(isLaw(R.state) ? 'Who will convince?' : 'Vote'); return; }
  if (phase === 'closing') { sfx.boop(); say('Reconsider?'); return; }
  if (phase === 'tie') { sfx.boop(); say('Tie!'); return; }
  if (phase !== 'discuss') return;
  sfx.boop();   // End turn is open
  await pause(350); if (job !== sayJob) return;
  if (isLaw(R.state)) {   // the verdict, then the winner bumps the loser off the cloud
    const L = R.state.law || {}, w = L.w === 0 ? L.off : L.w === 1 ? L.def : null, p = w && R.state.players[w];
    say(L.w === -1 ? 'Hung jury!' : `${p ? p.name : 'The ' + (L.w ? 'defense' : 'offense')} convinced the jury!`);
    await pause(3200); if (job !== sayJob) return;
    unsay(); await pause(650); if (job !== sayJob) return;
    say('Who argued it best?', true); return;
  }
  say('The votes are in!');
  await pause(2400); if (job !== sayJob) return;
  unsay();
  await pause(650); if (job !== sayJob) return;
  say(isBb(R.state) ? 'Why that one?' : 'Why did you choose what you chose?', true);
}

/* ---------- the views ---------- */
/* a question shows in its writer's font */
const writerFont = s => { const q = s.qs[s.qi], p = q && s.players[q.by]; return fontCSS(p && p.nameStyle && p.nameStyle.font); };
const lordHTML = s => cloudHTML(s.players[s.qs[s.qi].by] || null);

function viewSubmit(s) {
  const mineDone = s.done[R.me], sent = (s.subs || []).find(q => q.by === R.me);
  const what = isLaw(s) ? 'topic' : 'question';
  return `<div class="submit-wrap">${mineDone ? `<div class="panel submit-card done-card"><h2>${sent ? `${isLaw(s) ? 'Topic' : 'Question'} sent ✓` : `No ${what} this round`}</h2>
      ${sent ? `<p class="q-echo">${esc(sent.text)}</p>` : ''}<p class="dim">Waiting for the others.</p></div>`
    : isLaw(s) ? `<form class="panel submit-card" autocomplete="off"><h2>Your topic</h2>
      <p class="small dim">Someone else will have to defend it, so make it worth arguing about. Nobody sees it until its case.</p>
      <textarea maxlength="200" rows="3" placeholder="Pineapple belongs on pizza." aria-label="Your topic"></textarea>
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`
    : `<form class="panel submit-card" autocomplete="off"><h2>Your question</h2>
      ${isWyr(s) ? `<p class="wyr-head">Would you rather…</p><div class="wyr-pair">
        <textarea class="wyr-in" data-side="a" maxlength="100" rows="3" placeholder="Lose every right ever and become data breached" aria-label="The first choice"></textarea>
        <span class="wyr-or-word">OR</span>
        <textarea class="wyr-in" data-side="b" maxlength="100" rows="3" placeholder="Admit Justin is right about data breaching" aria-label="The second choice"></textarea></div>`
      : `<textarea maxlength="200" rows="3" placeholder="Data breaching is a serious problem, and IDIOTS don't understand what I am saying!" aria-label="Your question"></textarea>`}
      <div class="row"><button type="button" class="btn ghost" data-a="notes">Add a prompt from Notes</button></div>
      <div class="sect"><h3 data-tip="How long everyone gets to answer your question.">Answer time</h3><div class="row">${[[0, 'Off'], [30, '30 s'], [60, '60 s'], [90, '90 s']].map(([v, n]) =>
        `<button type="button" class="tile" data-time="${v}" aria-pressed="${v === s.options.answerTime}">${n}</button>`).join('')}</div></div>
      <p class="acts"><button type="submit" class="btn green">Send</button><button type="button" class="btn ghost" data-a="none">Don't submit one</button></p></form>`}
    <div class="who">${whoHTML(s)}</div></div>`;
}
const whoHTML = s => s.seat.map(id => `<span class="who-chip${s.done[id] ? ' done' : ''}">${duckSVG(s.players[id].duck, { size: 26, shadow: false })}${nameHTML(s.players[id].name, s.players[id].nameStyle)}${s.done[id] ? ' ✓' : ''}</span>`).join('');

/* the stat boxes: this round's, then every round's once the review vote passes (redrawn as jumps and votes come in) */
function statsHTML(s) {
  if (isSc(s)) return storyStatsHTML(s);
  if (isWyr(s)) return wyrStatsHTML(s);
  if (isLaw(s)) return s.phase === 'over' ? lawOverHTML(s) : lawStatsHTML(s);
  const boxes = r => s.seat.map(id => statBoxHTML(s, id, r)).join('');
  if (s.phase === 'over') return boxes(null);
  return `<h2>Round ${s.round + 1}</h2><div class="statboxes">${boxes(s.round)}</div>
    ${s.review ? `<h2 class="all-h">All rounds</h2><div class="statboxes">${boxes(null)}</div>` : ''}`;
}
/* Would You Rather's stats: the round's awards (ties named together), then each player's sides */
function wyrStatsHTML(s) {
  const nm = id => s.players[id] ? nameHTML(s.players[id].name, s.players[id].nameStyle) : 'Gone';
  const block = round => {
    const { per, questions } = wyrStats(s, round), ids = Object.keys(per).filter(id => s.players[id]);
    /* the best (or the least) of a number; everyone tied at the top is named */
    const top = (f, low = false, ok = () => true) => { const xs = ids.filter(ok).map(id => [id, f(per[id])]); if (!xs.length) return null; const v = low ? Math.min(...xs.map(x => x[1])) : Math.max(...xs.map(x => x[1])); return { v, who: xs.filter(x => x[1] === v).map(x => x[0]) }; };
    const writers = id => per[id].written > 0, avg = p => p.split / p.written;
    const jx = s.seat.map(id => [id, (s.jumps || {})[id] || 0]), jv = Math.max(0, ...jx.map(x => x[1])), jumps = jv ? { v: jv, who: jx.filter(x => x[1] === jv).map(x => x[0]) } : null;
    const award = (title, r, line) => r && r.who.length ? `<div class="award"><h3>${esc(title)}</h3><p>${r.who.map(nm).join(r.who.length > 2 ? ', ' : ' and ')}${r.who.length > 1 ? ' <span class="dim">(tie)</span>' : ''}</p><p class="small dim">${line(r.v)}</p></div>` : '';
    const most = top(avg, false, writers), least = top(avg, true, writers), contra = top(p => p.min), band = top(p => p.maj);
    return `<div class="awards">${award('Started the most disagreement', most && most.v > 0 ? most : null, v => v >= .999 ? 'Their questions split the room right down the middle.' : `Their questions split the room the most evenly (${Math.round(v * 100)}% of an even split).`)}
      ${award('Started the least disagreement', least && most && least.v !== most.v ? least : null, v => v === 0 ? 'Everyone picked the same side on their questions.' : `Their questions split the room the least (${Math.round(v * 100)}% of an even split).`)}
      ${award('Contrarian', contra && contra.v ? contra : null, v => `On the smaller side ${v} time${v === 1 ? '' : 's'}.`)}
      ${award('Bandwagoner', band && band.v ? band : null, v => `With the bigger side ${v} time${v === 1 ? '' : 's'}.`)}
      ${award('Most jumps', jumps, v => `${v} jump${v === 1 ? '' : 's'}.`)}</div>
      <div class="wyr-qs panel">${questions.map(q => `<p class="small"><span class="dim">${q.by && s.players[q.by] ? esc(s.players[q.by].name) : '?'}:</span> ${esc(q.text)} <b class="wyr-split"><span class="a">${q.A}</span> · <span class="b">${q.B}</span></b></p>`).join('')}</div>`;
  };
  return `<h2>Round ${s.round + 1}</h2>${block(s.round)}${s.review ? `<h2 class="all-h">All rounds</h2>${block(null)}` : ''}`;
}
const viewResults = s => `<div class="results"><div class="stage">${boardHTML(s)}</div><aside class="statpanel"></aside></div>`;
const viewOver = s => `<div class="over"><h1 class="over-title">${rainbowHTML('Game over')}</h1>
    <p class="dim">${s.round + 1} round${s.round ? 's' : ''} · ${s.history.length} ${isLaw(s) ? 'case' : 'question'}${s.history.length === 1 ? '' : 's'}</p>
    <div class="statboxes grid"></div></div>`;

/* my all-time stats: a round counts once its stats are up (not in test rooms), a game with its first round I played */
function recordRound(s) {
  const key = `${s.id}:${s.startedAt}:${s.round}`; if (key === recorded) return; recorded = key;
  if (s.test) return;
  const st = profile.stats[(s.options && s.options.mode) || 'aod'];
  if (isLaw(s)) {   // Lawyering: my cases argued, won, lost and given up, and my jury votes
    const p = lawStats(s, s.round).per[R.me];
    if (!st || !p || !(p.argued || p.votes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) { profile.stats.lastGame = game; st.games++; }
    st.rounds++; st.answers += p.votes; st.argued += p.argued; st.wins += p.won; st.losses += p.lost; st.gave += p.gave;
    save(); shareLook(); return;
  }
  if (isSc(s)) {   // Story Chain: my lines, and the votes for my lines and my secret word
    const p = scStats(s.sc.stories.flatMap(x => x.paras).filter(x => x.round === s.round))[R.me];
    if (!st || !p || !(p.lines || p.lvotes || p.wvotes)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) { profile.stats.lastGame = game; st.games++; }
    st.rounds++; st.answers += p.lines; st.wins += p.lvotes; st.titles += p.wvotes;
    save(); shareLook(); return;
  }
  if (isBb(s)) {   // Bicker Brackets: my votes in matches, my seeds' wins and losses, and a tournament won
    const t = (s.bbPast || []).slice(-1), p = bbStats(t)[R.me];
    if (!st || !p || !(p.votes || p.wins || p.losses)) return;
    const game = `${s.id}:${s.startedAt}`;
    if (profile.stats.lastGame !== game) { profile.stats.lastGame = game; st.games++; }
    st.rounds++; st.answers += p.votes; st.wins += p.wins; st.losses += p.losses; st.titles += p.titles;
    save(); shareLook(); return;
  }
  const mine = s.history.filter(h => h.round === s.round && h.a[R.me] !== undefined);
  if (!st || !mine.length) return;
  const game = `${s.id}:${s.startedAt}`;
  if (profile.stats.lastGame !== game) { profile.stats.lastGame = game; st.games++; }
  st.rounds++; st.answers += mine.length;
  if (isWyr(s)) { const p = wyrStats(s, s.round).per[R.me] || {}; st.majority += p.maj || 0; st.minority += p.min || 0; }   // which side I was on
  else for (const h of mine) st.counts[h.a[R.me]]++;
  save(); shareLook();
}

/* my E special's button (E on a keyboard) */
function useHTML(s) {
  const sp = pressSpecial(((s.players[R.me] || {}).duck || {}).special);
  if (!sp || !onBoardPhase() || !(me && me.x >= 0)) return '';
  return `<button type="button" class="btn ghost ebtn" data-a="use" data-tip="${esc(sp.name)}: ${esc(sp.tip)}">${sp.icon} <kbd>E</kbd></button>`;
}
/* the bottom bar's middle: what you can do now, with my E special's button at the start of the row */
function gactHTML(s) {
  const act = actHTML(s), use = useHTML(s), row = '<div class="act-row">';
  return use && act.includes(row) ? act.replace(row, row + use) : act + use;
}
function useSpecial() {
  const s = R.state; if (!me || me.x < 0 || !onBoardPhase() || !pressSpecial(((s.players[R.me] || {}).duck || {}).special)) return;
  R.send({ t: 'use', face: turned() ? 1 : (me.face || 1) });
}

const graceLeftMs = s => s.phase === 'answer' || (isSc(s) && SC_VOTES.includes(s.phase)) ? Math.max(0, s.at + VOTE_GRACE * 1000 - clockNow()) : 0;
const graceLeft = s => Math.ceil(graceLeftMs(s) / 1000);
/* the middle of the bottom bar: what you can do now, and how many are done */
function actHTML(s) {
  const on = playing(s), n = on.length, d = on.filter(id => s.done[id]).length, need = needed(s), mine = s.done[R.me];
  if (late() && s.phase !== 'submit') return `<span class="progress">You joined mid-round: walk around and chat. You play from the next ${isBb(s) ? 'tournament' : 'writing stage'}. · ${d}/${n} done</span>`;
  const count = `<span class="progress">${d}/${n} done${need < n ? ` · ${need} needed` : ''}</span>`;
  if (isSc(s)) return storyActHTML(s, d, n, need, count);
  if (['submit', 'topic', 'tvote', 'seeds', 'counsel'].includes(s.phase)) return count;
  if (s.phase === 'podium') return '';
  if (s.phase === 'tie') {   // the tied match: vote again or toss a coin (a choice can change until everyone has chosen)
    const v = (s.bb.tie || {}).votes || {}, n = k => Object.values(v).filter(x => x === k).length, mineV = v[R.me];
    return `<div class="act-row"><button type="button" class="btn${mineV === 'again' ? ' green' : ' ghost'}" data-a="tieagain" aria-pressed="${mineV === 'again'}">Vote again · ${n('again')}</button><button type="button" class="btn${mineV === 'coin' ? ' yellow' : ' ghost'}" data-a="tiecoin" aria-pressed="${mineV === 'coin'}">Coin toss · ${n('coin')}</button>${count}</div>`;
  }
  if (s.phase === 'bracket') return `<div class="act-row"><button type="button" class="btn theme-btn${mine ? ' done' : ''}" data-a="end">${mine ? 'Waiting ✓' : s.bb.champ != null ? 'On to the podium' : 'Next match'} <kbd>Enter</kbd></button>${count}</div>`;
  if (s.phase === 'answer' && isLaw(s) && s.law) return lawActHTML(s);
  if (s.phase === 'answer') {
    /* Vote: the button takes the color of the column you stand on; no voting in the first seconds; once locked it waits
       for everyone (End turn comes after, when the votes are in) */
    const onBoard = (me && me.x >= 0), wait = graceLeft(s), col = onBoard ? colAt(s, me.x) : -1;
    const votes = `<span class="progress">${d}/${n} voted${need < n ? ` · ${need} needed` : ''}</span>`;
    const q = s.qs[s.qi], m = bbMatch(s);
    const choices = m ? [[s.bb.seeds[m.a].text, 'bb-a'], [s.bb.seeds[m.b].text, 'bb-b']] : isWyr(s) ? [[q.a, 'wyr-a'], [q.b, 'wyr-b']] : COLS.map((c, i) => [c, `c${i + 1}`]);
    const mc = profile.settings.multipleChoice && (!mine || s.options.freeRoam) ? `<div class="mc">${choices.map(([c, k], i) => `<button type="button" class="mc-b ${k}" data-col="${i}">${esc(c)}</button>`).join('')}</div>` : '';
    const label = wait ? `Vote in ${wait}` : s.options.freeRoam ? (mine ? 'Ready ✓' : 'Ready') : mine ? 'Voted ✓' : 'Vote';
    const off = wait || !onBoard || col < 0 || (mine && !s.options.freeRoam);
    return `${mc}<div class="act-row"><button type="button" class="btn vote-btn${mine ? ' voted' : ''}" data-a="end" data-col="${col}"${off ? ' disabled' : ''}${s.options.freeRoam ? ' data-tip="Free roam: keep moving; where you stand when the turn ends is your vote."' : ''}>${label}${off ? '' : ' <kbd>Enter</kbd>'}</button>${votes}</div>`;
  }
  if (s.phase === 'discuss') return `<div class="act-row"><button type="button" class="btn theme-btn${mine ? ' done' : ''}" data-a="end">${mine ? 'Waiting ✓' : 'End turn'} <kbd>Enter</kbd></button>${count}</div>`;
  if (s.phase === 'results') {
    const rv = s.seat.filter(id => s.reviewVotes[id]).length, lv = s.vote && s.vote.kind === 'lobby';
    return `<div class="act-row"><button type="button" class="btn${mine ? ' yellow' : ' green'}" data-a="end">${mine ? 'Waiting ✓' : isBb(s) ? 'Next tournament' : 'Next round'} <kbd>Enter</kbd></button>
      ${s.round >= 1 && !s.review ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? ' disabled' : ''} data-tip="Adds every round's stats after this round's. One vote each round.">All-rounds review ${rv}/${need}</button>` : ''}
      <button type="button" class="btn ${lv ? 'red' : 'ghost'}" data-a="lobbyvote"${s.round === 1 ? ' data-tip="You can also vote to go back to the lobby on the all-rounds stats screen."' : ''}>${lv ? 'Vote yes: back to the lobby' : 'Vote: back to the lobby'}</button>${count}</div>`;
  }
  if (s.phase === 'over') return `<div class="act-row">${isSudo(s, R.me) ? '<button type="button" class="btn green" data-a="lobby">Back to the lobby</button>' : '<span class="dim">The host takes everyone back to the lobby.</span>'}<button type="button" class="btn ghost" data-a="leave">Leave</button></div>`;
  return '';
}

/* Lawyering: an attorney argues (and, behind in closing arguments, may give up); a juror votes for the side they stand on,
   and can change it at any time */
function lawActHTML(s) {
  const L = s.law, j = jury(s), voted = j.filter(id => L.votes[id] !== undefined).length, [o, d] = lawTally(s);
  const tally = L.close ? `<span class="progress">Offense ${o} · Defense ${d}</span>` : `<span class="progress">${voted}/${j.length} voted</span>`;
  if (isCounsel(s, R.me)) {
    const give = canGiveUp(s, R.me) ? '<button type="button" class="btn red" data-a="giveup" data-tip="In honor of the better argument (or in shame): the other side wins the case.">Give up</button>' : '';
    return `<div class="act-row"><span class="law-you">You're the ${L.off === R.me ? 'offense' : 'defense'} attorney: convince them!</span>${give}${tally}</div>`;
  }
  const onBoard = me && me.x >= 0, wait = graceLeft(s), col = onBoard ? colAt(s, me.x) : -1, mine = L.votes[R.me];
  const label = wait ? `Vote in ${wait}` : mine !== undefined && (col < 0 || mine === col) ? 'Voted ✓' : mine !== undefined ? 'Change vote' : 'Vote';
  const off = !!wait || col < 0 || mine === col;
  const names = [L.off, L.def].map(id => (s.players[id] || { name: '?' }).name);
  const mc = profile.settings.multipleChoice ? `<div class="mc">${names.map((n, i) => `<button type="button" class="mc-b law-${i ? 'b' : 'a'}" data-col="${i}">${i ? 'Defense' : 'Offense'}: ${esc(n)}</button>`).join('')}</div>` : '';
  return `${mc}<div class="act-row"><button type="button" class="btn vote-btn${mine !== undefined ? ' voted' : ''}" data-a="end" data-col="${col}"${off ? ' disabled' : ''}>${label}${off ? '' : ' <kbd>Enter</kbd>'}</button>${tally}</div>`;
}

/* Story Chain: whose line it is, or Vote (stand on a line, a word or a choice; not your own) */
function storyActHTML(s, d, n, need, count) {
  if (s.phase === 'words') return count;
  if (s.phase === 'write') return '';   // (the top bar says which line it is; the writer's window has Send)
  const onBoard = me && me.x >= 0, wait = graceLeft(s), z = onBoard ? zoneAt(s, me.y) : null, mine = s.done[R.me], ok = !!z && scCanVote(s, R.me, z);
  const l = scLineOf(s, z), own = !ok && (s.phase === 'lvote' ? l && l.now && l.line.by === R.me : s.phase === 'wvote' && z === 'W:' + R.me);
  const label = wait ? `Vote in ${wait}` : mine ? 'Voted ✓' : own ? (s.phase === 'lvote' ? 'Your line' : 'Your word') : 'Vote', off = wait || !ok || mine;
  const review = s.phase === 'results' && s.round >= 1 && !s.review ? `<button type="button" class="btn purple" data-a="review"${s.reviewVotes[R.me] ? ' disabled' : ''} data-tip="Adds every round's stats and the finished stories. One vote each round.">All-rounds review ${s.seat.filter(id => s.reviewVotes[id]).length}/${need}</button>` : '';
  return `<div class="act-row"><button type="button" class="btn vote-btn sc-vote${mine ? ' voted' : ''}" data-a="end"${off ? ' disabled' : ''}>${label}${off ? '' : ' <kbd>Enter</kbd>'}</button><span class="progress">${d}/${n} voted${need < n ? ` · ${need} needed` : ''}</span>${review}</div>`;
}
const TITLES = { submit: 'Write a question', answer: 'Vote', discuss: 'Talk it over', results: 'Results', over: '', topic: 'Write a topic', tvote: 'Pick the topic', tie: 'A tie', seeds: 'Write the contenders', bracket: 'The bracket', podium: 'The podium', words: 'Write a secret word', write: 'Write the story', lvote: 'Favorite line', wvote: 'Favorite secret word' };
const LAW_TITLES = { submit: 'Write a topic', counsel: 'Pick the attorneys', answer: 'Court is in session', discuss: 'The verdict' };
/* what the middle of the screen shows */
function viewHTML(s) {
  if (isLaw(s) && s.phase === 'counsel') return '<div class="law-counsel-wrap"></div>';
  if (isLaw(s) && s.phase === 'results') return '<div class="bb-results"><div class="statpanel law-statpanel"></div></div>';
  if (isSc(s)) {
    if (s.phase === 'words') return wordsHTML(s, R.me, whoHTML(s));
    if (s.phase === 'results') return `<div class="results sc-results"><div class="stage">${boardHTML(s)}</div><aside class="statpanel"></aside></div>`;
    if (SC_BOARD.includes(s.phase)) return `<div class="stage">${boardHTML(s)}</div>`;
  }
  if (isBb(s)) switch (s.phase) {
    case 'topic': return topicHTML(s, R.me, whoHTML(s));
    case 'tvote': return tvoteHTML(s, R.me);
    case 'seeds': return seedsHTML(s, R.me);
    case 'podium': return podiumHTML(s);
    case 'results': return '<div class="bb-results"><div class="statpanel bb-statpanel"></div></div>';
  }
  return s.phase === 'submit' ? viewSubmit(s) : s.phase === 'results' ? viewResults(s) : s.phase === 'over' ? viewOver(s) : `<div class="stage">${boardHTML(s)}</div>`;
}
/* the moment specials that fire on their own: confetti over the screen for the Round Lord, a match's winner and the champion */
function celebrate(s) {
  let p = null;
  if (s.phase === 'answer' && !isBb(s) && !isLaw(s)) p = s.players[(s.qs[s.qi] || {}).by];
  if (s.phase === 'discuss' && isLaw(s) && s.law && s.law.w >= 0) p = s.players[s.law.w ? s.law.def : s.law.off];
  const m = isBb(s) && bbMatch(s);
  if (s.phase === 'discuss' && m && m.w != null && !s.options.bbBlind) p = s.players[s.bb.seeds[m.w].by];
  if (s.phase === 'podium' && s.bb && s.bb.champ != null) p = s.players[s.bb.seeds[s.bb.champ].by];
  if (p && p.duck && p.duck.special === 'confetti') confettiRain();
}
/* Bicker Brackets: who wears the Loser's X (their seed just lost, or all of theirs are out), and the colors of the
   match's two sides (the writers' cards) */
function bbMarks(s) {
  losers = new Set();
  if (isLaw(s) && s.law) {   // Lawyering: the losing attorney wears the Loser's X; the sides' colors are the attorneys' cards
    const L = s.law, lost = s.phase === 'discuss' && L.w != null ? (L.w === -1 ? [L.off, L.def] : [L.w ? L.off : L.def]) : [];
    for (const id of lost) { const p = s.players[id]; if (p && p.duck && p.duck.special === 'loserx') losers.add(id); }
    S.style.setProperty('--law-a', sideColor(s.players[L.off])); S.style.setProperty('--law-b', sideColor(s.players[L.def]));
    return;
  }
  if (!isBb(s) || !s.bb) return;
  const m = bbMatch(s), justLost = s.phase === 'discuss' && m && m.w != null ? s.bb.seeds[m.w === m.a ? m.b : m.a] : null;
  for (const id of s.seat) { const p = s.players[id]; if (p && p.duck && p.duck.special === 'loserx' && ((justLost && justLost.by === id) || allOut(s, id))) losers.add(id); }
  if (m) { const [ca, cb] = matchColors(s, seedShift); S.style.setProperty('--seed-a', ca); S.style.setProperty('--seed-b', cb); }
}
/* while a match is voted on, its two sides slowly turn through the colors (together, so they stay apart); when the vote
   ends they keep the colors they stopped on */
function shiftSides(s, now) {
  if (!isBb(s) || s.phase !== 'answer' || !bbMatch(s) || !document.documentElement.classList.contains('moving')) return;
  const deg = Math.round(Math.max(0, now - s.at) / 1000 * 4) % 360;   // 4° a second: once around in a minute and a half
  if (deg === seedShift) return;
  seedShift = deg; bbMarks(s);
}
const matchKey = s => s.bb ? [s.startedAt, s.bb.r, s.bb.m].join() : '';
/* Bicker Brackets: the championship's votes are in, so the champion bumps the loser off the cloud (once) */
function duel(s) {
  if (isLaw(s)) {   // Lawyering: the winning attorney bumps the loser off; a hung jury: both jump
    const L = s.law, key = caseKey(s);
    if (s.phase !== 'discuss' || !L || L.w == null || knocked.has(key)) return;
    knocked.add(key);
    const lord = S.querySelector('.law-top .lord.duel');
    setTimeout(() => { if (lord && lord.isConnected) (L.w === -1 ? bothOff(lord) : knockOff(lord, L.w ? 0 : 1)); }, 900);
    return;
  }
  const m = isBb(s) && s.phase === 'discuss' && s.bb.r === s.bb.rounds.length - 1 && bbMatch(s), key = matchKey(s);
  if (!m || m.w == null || knocked.has(key)) return;
  knocked.add(key);
  const lord = S.querySelector('.bb-top .lord.duel');
  setTimeout(() => { if (lord.isConnected) knockOff(lord, m.w === m.a ? 1 : 0); }, 900);
}
/* the colors of the most-voted tile (or tiles, when they tie), as the board shows them */
function topColors(s) {
  const n = {}; for (const id of s.seat) { const c = s.lock[id]; if (c >= 0) n[c] = (n[c] || 0) + 1; }
  const most = Math.max(0, ...Object.values(n));
  return Object.keys(n).filter(c => n[c] === most).map(c => { const t = S.querySelector(`.board .cols > .col[data-c="${c}"]`); return t ? getComputedStyle(t).getPropertyValue('--c').trim() : ''; }).filter(Boolean);
}
function paint(force) {
  if (!S || !R) return;
  const s = R.state, key = [s.phase, s.round, s.qi].join('|');
  if (force || key !== shown) {
    const was = shown; shown = key;
    const fresh = s.pos[R.me] ? { ...s.pos[R.me], face: 1 } : null;
    if (s.phase === 'answer' || s.phase === 'results' || s.phase === 'bracket' || (isSc(s) && SC_BOARD.includes(s.phase)) || !me) me = fresh && { ...fresh, j: me && me.j || 0 };
    scZone = null;
    target = null;
    const main = $('.gmain', S);
    main.dataset.phase = s.phase;
    S.classList.toggle('wyr', isWyr(s)); S.classList.toggle('bb', isBb(s)); S.classList.toggle('sc', isSc(s)); S.classList.toggle('law', isLaw(s));
    if (s.phase === 'answer') seedShift = 0;   // a vote starts on the match's own colors
    bbMarks(s);
    main.innerHTML = viewHTML(s);
    if (!scene) scene = mountMap($('.map-layer', S), s);
    announce(s.phase);
    celebrate(s);
    duel(s);
    scene.board($('.board', main));
    if (was && s.phase !== was.split('|')[0] && s.phase !== 'discuss') sfx.done();
    if (was && was.split('|')[0] === 'answer' && s.phase === 'discuss') scene.cheer(topColors(s));   // the votes are in
    if (s.phase === 'answer' && !touchTold && matchMedia('(hover: none) and (pointer: coarse)').matches) {   // a touch screen: how to move, once
      touchTold = true;
      toast(profile.settings.touch === 'tap' ? 'Tap: walk there · Double tap: jump · Fast swipe: sprint' : 'Hold and drag: walk · Tap: jump · Flick twice: sprint', 5000);
    }
    $('.round', S).textContent = s.phase === 'over' ? '' : `Round ${s.round + 1}${isSc(s) ? (s.phase === 'write' ? ` · Line ${s.sc.turn + 1} of ${s.sc.order.length}` : '') : isBb(s) ? (bbMatch(s) ? ` · ${roundName(s.bb, s.bb.r)}` : '') : s.qs.length && ['answer', 'discuss', 'counsel'].includes(s.phase) ? ` · ${isLaw(s) ? 'Case' : 'Question'} ${s.qi + 1} of ${s.qs.length}` : ''}`;
    $('.phase', S).textContent = (isLaw(s) && LAW_TITLES[s.phase]) || TITLES[s.phase] || '';
    lastClose = s.law && s.law.close || 0;
    geo = null;
  }
  if (s.phase === 'submit' || s.phase === 'topic' || s.phase === 'words') { setHTML($('.who', S), whoHTML(s)); if (s.done[R.me] && $('form.submit-card', S)) paint(true); }
  if (isSc(s) && s.phase === 'write') {   // the line as it's typed (the writer sees their own straight from the box)
    if (scWriter(s) !== R.me) { const t = $('.sc-typing', S), was = t && t._html; setHTML(t, typingHTML(s)); if (t && t._html !== was) geo = null; }
    else if (s.done[R.me] && $('form.sc-write', S)) paint(true);
  }
  if (s.phase === 'topic') setHTML($('.bb-topic-live', S), topicLiveHTML(s, R.me));   // everyone's topics as they come
  if (s.phase === 'tvote') setHTML($('.bb-topics', S), topicsHTML(s, R.me));
  if (s.phase === 'seeds') {   // everyone's words as they type them, and the seeds so far
    if (s.done[R.me] && $('form.bb-write', S)) paint(true);
    setHTML($('.bb-others', S), othersHTML(s, R.me)); setHTML($('.bb-sofar .bb-grid', S), sofarHTML(s));
    $('.bb-sofar h3', S).textContent = s.bb.seeds.length ? `Already written (${s.bb.seeds.length})` : '';
    $('.bb-now', S).hidden = !$('.bb-others', S).children.length;
  }
  if (isBb(s) && s.phase === 'discuss') bbMarks(s);
  if (isLaw(s) && s.phase === 'counsel') setHTML($('.law-counsel-wrap', S), counselHTML(s, R.me, whoHTML(s)));
  if (isLaw(s) && s.phase === 'answer' && s.law) {   // closing arguments: the banner, and the cloud asks the jury to reconsider
    const close = s.law.close || 0, bn = $('.law-banner', S);
    if (bn) bn.classList.toggle('on', !!close);
    if (close && close !== lastClose) { lastClose = close; announce('closing'); }
  }
  // the host keeps my duck in bounds (an ended turn, the column after answering); take its word for where I am
  if (me && s.pos[R.me] && onBoardPhase()) {
    const p = s.pos[R.me];
    if (locked()) { me.x = p.x; me.y = p.y; }   // an ended turn holds its answer
    else if (!roams() && me.x >= 0 && s.lock[R.me] !== undefined) { const [lo, hi] = colBoundsAt(s, s.lock[R.me]); me.x = Math.max(lo, Math.min(hi, me.x)); }   // inside my column (not back to where the host last saw me: online that pulled the duck back while it walked)
  }
  const lordSig = !isBb(s) && !isLaw(s) && (s.phase === 'answer' || s.phase === 'discuss') ? JSON.stringify(s.players[s.qs[s.qi].by] || null) : '';
  const lord = $('.topover .lord', S);
  if (lord && lord._sig !== undefined && lord._sig !== lordSig) { const words = lord.querySelector('.lord-say'); lord.outerHTML = lordHTML(s); $('.topover .lord .lord-say', S).replaceWith(words); }
  if ($('.topover .lord', S)) $('.topover .lord', S)._sig = lordSig;
  setHTML($('.gact', S), gactHTML(s));
  pm.paint();
  /* new chat messages float over their sender's duck (whispers only for the two of you; muted bubbles stay hidden) */
  if (lastLog < 0) lastLog = s.logN || 0;
  if ((s.logN || 0) > lastLog) {
    for (const m of s.log) if (m.n > lastLog && !m.sys && s.players[m.from] && (!m.to || m.to === R.me || m.from === R.me) && !isMuted(s, m.from, 'bubble') && !isMuted(s, m.from, 'text'))
      bubbles[m.from] = { text: !canOpen(s, R.me, m) ? `📄 ${m.file}` : m.text.length > 90 ? m.text.slice(0, 90).trimEnd() + '…' : m.text, until: clockNow() + 5500, n: m.n };   // (a sent file opens only for sudo, unless chmod let its group or everyone)
    lastLog = s.logN || 0;
  }
  if (lastFx < 0) lastFx = s.fxN || 0;
  if ((s.fxN || 0) > lastFx) { const fresh = (s.fx || []).filter(f => f.n > lastFx); lastFx = s.fxN; if (onBoardPhase()) { if (!geo) measure(); fresh.forEach(playFx); } }
  if (s.phase === 'results') {
    recordRound(s);
    const panel = $('.statpanel', S), had = panel._html && panel._html.includes('all-h');
    setHTML(panel, statsHTML(s));
    if (s.review && !had) panel.querySelector('.all-h').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (s.phase === 'over') setHTML($('.over .statboxes', S), statsHTML(s));
  if (isBb(s) && s.phase === 'results') { recordRound(s); setHTML($('.bb-statpanel', S), bbStatsHTML(s)); }
  showTimer();
}

function showTimer() {
  const s = R && R.state, t = S && $('.timer', S); if (!s || !t) return;
  if (s.phase === 'answer' || (isSc(s) && SC_VOTES.includes(s.phase))) { const g = graceLeft(s); if (g !== lastGrace) { lastGrace = g; setHTML($('.gact', S), gactHTML(s)); } }   // the Vote button counts down
  const now = clockNow(), ends = [s.ends, s.catchEnds].filter(Boolean), end = ends.length ? Math.min(...ends) : 0;
  const meter = $('.tmeter', S);
  if (s.phase === 'podium') { const pl = $('.pod-left', S); if (pl) pl.textContent = `The stats in ${Math.max(0, Math.ceil((s.ends - now) / 1000))} s`; }
  if (!end || !['submit', 'answer', 'topic', 'tvote', 'seeds', 'words', 'write', 'counsel'].includes(s.phase)) { t.textContent = ''; t.className = 'timer'; if (meter) meter.hidden = true; return; }
  const left = Math.max(0, Math.ceil((end - now) / 1000)), catching = s.catchEnds && end === s.catchEnds, closing = isLaw(s) && s.law && s.law.close && end === s.law.close;
  /* the meter fills as the time runs out; its color drifts slowly (css) */
  const from = closing ? s.law.close - (+s.options.lawClose || 60) * 1000 : catching ? s.catchEnds - s.options.catchUp * 1000 : s.at, frac = Math.max(0, Math.min(1, (now - from) / Math.max(1, end - from)));
  if (meter) { meter.hidden = false; const w = (frac * 100).toFixed(1) + '%'; if (meter._w !== w) { meter._w = w; meter.firstChild.style.width = w; } meter.classList.toggle('low', left <= 5); }
  if (['submit', 'topic', 'seeds', 'words', 'write'].includes(s.phase) && left <= 2 && draftT) sendDraft(true);   // the last words make it in
  t.textContent = `${closing ? 'Closing ' : catching ? 'Catch-up ' : ''}${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  t.className = 'timer' + (catching ? ' catch' : '') + (left <= 5 ? ' low' : '');
  if (left <= 5 && left > 0 && left !== lastBeep) { lastBeep = left; sfx.tick(); }
}

/* what I've typed goes to the host after a short pause, so it's sent in for me if time runs out */
function sendDraft(now = false) {
  clearTimeout(draftT); draftT = 0;
  const go = () => {
    draftT = 0;
    if (R && isSc(R.state)) { const inp = S && $(R.state.phase === 'write' ? '.sc-in' : '.sc-win', S); if (inp && ['words', 'write'].includes(R.state.phase)) R.send({ t: 'draft', text: inp.value }); return; }   // (everyone sees a line as it's typed)
    if (R && isBb(R.state)) { const inp = S && $('form.bb-write .bb-in', S); if (inp && ['topic', 'seeds'].includes(R.state.phase)) R.send({ t: 'draft', text: inp.value }); return; }   // (everyone sees a seed as it's typed)
    const f = S && $('form.submit-card', S); if (!f || !R || R.state.phase !== 'submit') return;
    const t = f.querySelector('.tile[aria-pressed="true"]'), time = t ? +t.dataset.time : R.state.options.answerTime, side = k => (f.querySelector(`.wyr-in[data-side="${k}"]`) || {}).value || '';
    R.send(isWyr(R.state) ? { t: 'draft', a: side('a'), b: side('b'), time } : { t: 'draft', text: f.querySelector('textarea').value, time });
  };
  if (now) go(); else draftT = setTimeout(go, R && ['seeds', 'topic', 'write'].includes(R.state.phase) ? (R.state.phase === 'write' ? 180 : 220) : 700);   // (the others see these as they're typed)
}

/* the writer types: the letters left, Send once the secret word is in, and their line in the story at once */
function storyTyped(box) {
  if (/\n/.test(box.value)) box.value = box.value.replace(/\s*\n\s*/g, ' ');
  const f = box.form, text = box.value, word = (R.state.sc.assign[R.me] || {}).word, has = wordAt(text, word) >= 0;
  f.querySelector('.sc-left').textContent = `${LINE_MAX - text.length} left`;
  const need = f.querySelector('.sc-need'); need.textContent = has ? '✓ Secret word in' : 'Put your secret word in it'; need.classList.toggle('ok', has);
  f.querySelector('button[type="submit"]').disabled = !(has && text.trim());
  const t = $('.sc-typing', S); if (t) { setHTML(t, typingHTML({ ...R.state, drafts: { [R.me]: { text } } })); geo = null; }
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
  if (e.key === 'Escape' && !windowOpen() && !typing(e)) { e.preventDefault(); if (pm.isOpen()) pm.close(); else openPause(); return; }
  if (e.key === 'Tab') { e.preventDefault(); if (!windowOpen() && !typing(e)) pm.keydown(e); return; }   // hold Tab: the players (Tab never moves the browser's focus in a game)
  if (typing(e) || windowOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
  if (MOVE_KEYS.includes(e.code) && onBoardPhase()) { if (!e.code.startsWith('Shift')) e.preventDefault(); keys.add(e.code); return; }
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) jump(); return; }
  if (e.code === 'KeyE' && !e.repeat && onBoardPhase()) { e.preventDefault(); useSpecial(); return; }
  if ((e.code === 'Equal' || e.code === 'Minus') && R.state.phase === 'bracket') { e.preventDefault(); zoom(e.code === 'Equal' ? 'in' : 'out'); return; }
  if (e.code === 'Enter' && !e.repeat) { e.preventDefault(); act('end'); }
}
const keyup = e => { keys.delete(e.code); if (e.key === 'Tab' && pm) pm.keyup(e); };
const blur = () => keys.clear();
const resized = () => { geo = null; };

/* ---------- what the buttons do ---------- */
async function act(a) {
  const s = R.state;
  switch (a) {
    case 'end':
      if (isSc(s)) { if (SC_VOTES.includes(s.phase) && me && me.x >= 0 && !graceLeft(s)) { sendMove(true); R.send({ t: 'end', y: me.y }); } break; }   // (where I stand is my vote)
      if (s.phase === 'answer' && (!(me && me.x >= 0) || graceLeft(s))) return;
      if (s.phase === 'answer') sendMove(true);
      if ([...boardPhases(s), 'results'].includes(s.phase)) R.send({ t: 'end' });
      break;
    case 'tieagain': R.send({ t: 'tieVote', v: 'again' }); break;
    case 'giveup': if (await confirmBox('Give up the case?', 'The other side wins it.')) R.send({ t: 'giveUp' }); break;
    case 'tiecoin': R.send({ t: 'tieVote', v: 'coin' }); break;
    case 'zoomin': zoom('in'); break;
    case 'zoomout': zoom('out'); break;
    case 'zoomfit': zoom('fit'); break;
    case 'bbnone': if (await confirmBox('Are you sure?', 'No topic from you this time.')) R.send({ t: 'submit', text: '' }); break;
    case 'bbskip': if (await confirmBox('Skip this one?', 'You won\'t have a contender in this spot.')) R.send({ t: 'submit', text: '' }); break;
    case 'review': R.send({ t: 'voteReview' }); break;
    case 'lobbyvote': lobbyVote(R); break;
    case 'use': useSpecial(); break;
    case 'players': if (pm.isOpen()) pm.close(); else pm.open(true); break;
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
    if (off) off(); off = null; if (docks) docks.destroy(); docks = null; cancelAnimationFrame(raf); clearInterval(tick); S = null; shown = ''; me = null; geo = null; keys.clear(); lastFx = -1; hotdogs = []; follows = [];
    if (pm) pm.destroy(); pm = null; if (idleOff) idleOff(); idleOff = null; lastLog = -1; bubbles = {};
    if (scene) scene.destroy(); scene = null; hooks.resetDuck = null; sayJob++; lastGrace = -1; if (touchOff) touchOff(); touchOff = null; bbZoom = 0; losers = new Set(); knocked = new Set(); scY = 0; scT = 0; scZone = '';
    removeEventListener('keydown', keydown); removeEventListener('keyup', keyup); removeEventListener('blur', blur); removeEventListener('resize', resized);
  },
  render(arg) {
    R = arg || activeRoom(); if (!R) return null;
    S = el(`<section class="screen game docked">
      <header class="gbar"><div class="gbar-l"><span class="round"></span><span class="phase"></span></div>
        <div class="gbar-r"><span class="tmeter" hidden><i></i></span><span class="timer"></span><button type="button" class="btn ghost iconbtn" data-a="players" aria-label="Players" data-tip="Players (hold Tab)">👥</button><button type="button" class="btn ghost iconbtn" data-a="pause" aria-label="Pause menu" data-tip="Pause menu (Esc)">☰</button></div></header>
      <div class="map-layer"></div><div class="gmain"></div>${DOCK_HTML}${BAR_HTML('<div class="gact"></div>')}</section>`);
    docks = mountDocks(S, HINTS);
    pm = mountPlayers(S, () => R); idleOff = trackIdle(() => R);
    hooks.resetDuck = resetDuck;
    touchOff = mountTouch(S, { active: () => onBoardPhase() && !windowOpen(), jump, walkTo, duckAt, getTarget: () => target, setTarget: t => { target = t; } });
    S.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') touchedAt = performance.now(); }, true);
    S.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (b && !b.disabled) { if (b.dataset.a === 'pause') openPause(); else act(b.dataset.a); return; }
      const mc = e.target.closest('[data-col]'); if (mc) { jumpTo(+mc.dataset.col); return; }
      const tc = e.target.closest('[data-topic]'); if (tc) { R.send({ t: 'pick', i: +tc.dataset.topic }); return; }
      const lc = e.target.closest('.law-cand'); if (lc) { R.send({ t: 'counsel', role: lc.dataset.role, who: lc.dataset.who }); return; }
      const tile = e.target.closest('.submit-card .tile[data-time]');
      if (tile) { $$('.submit-card .tile[data-time]', S).forEach(t => t.setAttribute('aria-pressed', t === tile)); sendDraft(); }
      boardClick(e);
    });
    S.addEventListener('submit', e => {
      if (e.target.matches('.sc-wordform')) {   // a secret word
        e.preventDefault();
        const inp = e.target.querySelector('.sc-win'), w = cleanWord(inp.value);
        if (!w) { inp.focus(); return; }
        clearTimeout(draftT); draftT = 0; R.send({ t: 'submit', text: w }); return;
      }
      if (e.target.matches('.sc-write')) {   // a line, with the secret word in it
        e.preventDefault();
        const box = e.target.querySelector('.sc-in'), text = box.value.trim(), word = (R.state.sc.assign[R.me] || {}).word;
        if (!text || wordAt(text, word) < 0) { box.focus(); const need = e.target.querySelector('.sc-need'); need.classList.remove('shake'); void need.offsetWidth; need.classList.add('shake'); return; }
        clearTimeout(draftT); draftT = 0; R.send({ t: 'submit', text }); return;
      }
      if (e.target.matches('.bb-write')) {   // a topic or a seed
        e.preventDefault();
        const inp = e.target.querySelector('.bb-in'), text = inp.value.trim();
        if (!text) { inp.focus(); return; }
        clearTimeout(draftT); draftT = 0; R.send({ t: 'submit', text }); return;
      }
      if (!e.target.matches('.submit-card')) return;
      e.preventDefault();
      const f = e.target, t = f.querySelector('.tile[aria-pressed="true"]'), time = t ? +t.dataset.time : R.state.options.answerTime;
      if (isWyr(R.state)) {   // both choices, or nothing
        const [a, b] = ['a', 'b'].map(k => f.querySelector(`.wyr-in[data-side="${k}"]`));
        const empty = [a, b].find(x => !x.value.trim()); if (empty) { empty.focus(); return; }
        R.send({ t: 'submit', a: a.value.trim(), b: b.value.trim(), time }); return;
      }
      const text = f.querySelector('textarea').value.trim();
      if (!text) { f.querySelector('textarea').focus(); return; }
      R.send({ t: 'submit', text, time });
    });
    S.addEventListener('input', e => {
      if (e.target.matches('.sc-in')) { storyTyped(e.target); sendDraft(); return; }
      if (e.target.matches('.sc-win')) { const v = e.target.value.replace(/\s+/g, ''); if (v !== e.target.value) e.target.value = v; sendDraft(); return; }   // (one word)
      if (e.target.matches('.submit-card textarea, .bb-in')) sendDraft();   // (both Would You Rather boxes too)
    });
    S.addEventListener('keydown', e => {   // a topic to vote for, picked with Enter or Space
      if (e.target.matches('[data-topic]') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); R.send({ t: 'pick', i: +e.target.dataset.topic }); }
    });
    S.addEventListener('keydown', e => {   // Enter sends the question (Shift+Enter for a new line) or the story's line (one line, so no new lines)
      if (e.target.matches('.submit-card textarea') && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); e.target.form.requestSubmit(); }
      if (e.target.matches('.sc-in') && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); e.target.form.requestSubmit(); }
    });
    onMenu(S, (x, y, e) => {
      const d = e.target.closest && e.target.closest('.gduck, .statbox'); if (!d || stick.shown) return;
      const p = R.state.players[d.dataset.pid];
      contextMenu(x, y, [['View stats', () => openStats(R.state, d.dataset.pid, R.me)], ...(canAdd(p) ? [['Add friend', async () => toast(await requestFriend(p.acct))]] : []),
        ...(p ? kickItems(R, d.dataset.pid) : [])]);
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
