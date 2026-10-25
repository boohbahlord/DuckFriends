/* ---------- the player menu and the room's votes ----------
   In a game, hold Tab (or tap the 👥 button by the pause button; it stays up until its ✖) to see every player: their
   card with the duck and name, their connection, and whether they've gone quiet. Click a name for View stats, Add friend
   or Vote to kick. The arrow keys move through it (and keep it up), Enter picks. At the bottom you can start a vote to go back to the lobby, to skip the turn (not in Bicker Brackets) or to skip the round (each once a turn). A running vote shows as a
   box at the top for everyone who can vote in it. A player who hasn't touched a key, the mouse or the screen in two
   minutes shows Zs over their duck. */
import { esc, el, setHTML, confirmBox, contextMenu, toast } from './ui.js';
import { cardHTML } from './card.js';
import { voteNeeds, turnKey, isBb, may } from './rules.js';
import { now as clockNow } from './clock.js';
import { openStats } from './stats.js';
import { canAdd, requestFriend } from './account.js';
import { sfx } from './sound.js';
import { NAV_HINTS } from './keynav.js';

/* the connection as 1 to 4 bars and milliseconds */
const bars = ms => ms == null ? 0 : ms < 90 ? 4 : ms < 180 ? 3 : ms < 350 ? 2 : 1;
export function netHTML(p, online) {
  if (p.bot) return '<span class="net dim">Computer</span>';
  if (!online) return '<span class="net dim">Same device</span>';
  const b = bars(p.ms);
  return `<span class="net b${b}" data-tip="Connection: the time to the game server and back"><span class="bars">${[1, 2, 3, 4].map(i => `<i${i <= b ? ' class="on"' : ''}></i>`).join('')}</span>${p.ms == null ? '…' : `${p.ms} ms`}</span>`;
}

/* may I start this vote now? (the reason if not) */
const TWO = 'With only two players there are no kick votes.';
export function whyNotVote(s, me, kind) {
  if (kind === 'kick' && s.seat.filter(id => !s.players[id].bot).length <= 2) return TWO;
  if (s.vote) return 'A vote is already running.';
  const used = (s.voteUsed || {})[me] || {};
  if (kind === 'kick' && used.kick !== undefined && s.round - used.kick < 2) return 'You can start one kick vote every two rounds.';
  if (kind === 'lobby' && used.lobby === turnKey(s)) return 'You already started a back-to-lobby vote this turn.';
  if (kind === 'skip' && used.skip === turnKey(s)) return 'You already started a skip vote this turn.';
  if (kind === 'turn' && used.turn === turnKey(s)) return 'You already started a vote to skip this turn.';
  return '';
}
export async function startKick(R, id) {
  const s = R.state, p = s.players[id]; if (!p) return;
  const no = whyNotVote(s, R.me, 'kick'); if (no) { toast(no); return; }
  if (await confirmBox(`Vote to kick ${p.name}?`, 'Everyone else has to vote yes. You can start one kick vote every two rounds.')) R.send({ t: 'voteStart', kind: 'kick', target: id });
}
/* the host (or sudo) removes a player at once, no vote */
export const canKick = (s, me, id) => may(s, me, 'cankick') && id !== me && id !== s.hostId && !!s.players[id];
export async function hostKick(R, id) {
  const p = R.state.players[id]; if (!p || !canKick(R.state, R.me, id)) return;
  if (await confirmBox(`Kick ${p.name}?`, p.bot ? 'The computer leaves the room.' : 'They leave right away, no vote, and can\'t come back until the room goes back to the lobby.')) R.send({ t: 'kick', who: id });
}
/* the player menu's items for someone: kick (host or sudo) or a vote to kick (everyone else, with three people or more) */
export function kickItems(R, id) {
  const s = R.state, p = s.players[id]; if (!p || id === R.me) return [];
  if (canKick(s, R.me, id)) return [['Kick', () => hostKick(R, id)]];
  return p.bot || ['lobby', 'countdown', 'over'].includes(s.phase) || whyNotVote(s, R.me, 'kick') === TWO ? [] : [['Vote to kick', () => startKick(R, id)]];
}
/* Back to the lobby (or skip the round): starts the vote, or says yes to the one running */
export function lobbyVote(R, kind = 'lobby') {
  const s = R.state, v = s.vote;
  if (v && v.kind === kind) { R.send({ t: 'voteCast', n: v.n, v: true }); return; }
  const no = whyNotVote(s, R.me, kind); if (no) { toast(no); return; }
  R.send({ t: 'voteStart', kind });
}

/* the vote box at the top of the game */
export function voteHTML(s, me) {
  const v = s.vote; if (!v) return '';
  const { voters, need } = voteNeeds(s, v), yes = voters.filter(id => v.yes[id]).length, mine = v.yes[me] ? 'yes' : v.no[me] ? 'no' : '';
  const left = Math.max(0, Math.ceil((v.ends - clockNow()) / 1000)), who = s.players[v.by], target = s.players[v.target];
  const q = v.kind === 'kick' ? `Kick ${target ? esc(target.name) : 'them'}?` : v.kind === 'skip' ? 'Skip this round?' : v.kind === 'turn' ? 'Skip this turn?' : 'Go back to the lobby?';
  const can = voters.includes(me);
  return `<div class="vb-q"><b>${q}</b> <span class="dim small">${who ? `${esc(who.name)} asked · ` : ''}${yes}/${need} yes · <span class="vb-left">${left}</span> s</span></div>
    ${can ? (mine ? `<span class="small">You voted ${mine}.</span> ` : '') + `<span class="vb-acts"><button type="button" class="btn small green" data-vote="1"${mine === 'yes' ? ' disabled' : ''}>Yes</button><button type="button" class="btn small red" data-vote="0"${mine === 'no' ? ' disabled' : ''}>No</button></span>`
      : `<span class="small dim">${v.kind === 'kick' ? 'Everyone else is voting on you.' : 'Only players vote.'}</span>`}`;
}

/* the player menu, mounted in the game screen */
export function mountPlayers(S, getR) {
  const box = el(`<div class="pmenu" hidden role="dialog" aria-label="Players"><header><h2>Players</h2><button type="button" class="win-x pm-x" aria-label="Close">✖</button></header>
    <div class="pm-list"></div><footer class="pm-foot"></footer></div>`);
  const vbox = el('<div class="votebox" role="status" hidden></div>');
  S.append(box, vbox);
  let sticky = false, lastVote = 0;
  const render = () => {
    const R = getR(); if (!R || box.hidden) return;
    const s = R.state;
    setHTML(box.querySelector('.pm-list'), s.seat.map(id => {   // (only when something in it changed: every move repaints the game)
      const p = s.players[id]; if (!p) return '';
      const tags = [p.idle ? '<span class="pm-tag idle">💤 Away</span>' : '', p.late ? '<span class="pm-tag">Plays from the next round</span>' : ''].join('');
      return `<div class="pm-row" data-pid="${esc(id)}" tabindex="0">${cardHTML(p, { host: id === s.hostId, me: id === R.me, size: 44 })}<div class="pm-side">${netHTML(p, R.online)}${tags}</div></div>`;
    }).join(''));
    const btn = (kind, words) => {   // start the vote, or say yes to the one running
      const no = whyNotVote(s, R.me, kind), running = s.vote && s.vote.kind === kind;
      return `<button type="button" class="btn ghost" data-pa="${kind}vote"${no && !running ? ` disabled data-tip="${esc(no)}"` : ''}>${running ? 'Vote yes: ' : 'Start a vote: '}${words}</button>`;
    };
    setHTML(box.querySelector('.pm-foot'), `<span class="pm-votes">${btn('lobby', 'back to the lobby')}${isBb(s) ? '' : btn('turn', 'skip this turn')}${btn('skip', 'skip this round')}</span>
      <span class="small dim">Hold Tab, or tap 👥. Click a name for more.</span><span class="hints pm-keys">${NAV_HINTS}</span>`);
  };
  const open = (stay = false) => { sticky = sticky || stay; box.hidden = false; render(); };
  const close = () => { sticky = false; box.hidden = true; };
  box.querySelector('.pm-x').onclick = close;
  box.addEventListener('click', e => {
    const R = getR(); if (!R) return;
    if (e.target.closest('[data-pa="lobbyvote"]')) { lobbyVote(R); return; }
    if (e.target.closest('[data-pa="skipvote"]')) { lobbyVote(R, 'skip'); return; }
    if (e.target.closest('[data-pa="turnvote"]')) { lobbyVote(R, 'turn'); return; }
    rowMenu(e);
  });
  /* a player's options: a click, a right-click, or Enter / Shift+Enter on the row */
  const rowMenu = e => {
    const R = getR(), row = e.target.closest('.pm-row'); if (!R || !row) return;
    const id = row.dataset.pid, p = R.state.players[id]; if (!p) return;
    e.preventDefault();
    contextMenu(e.clientX, e.clientY, [
      ['View stats', () => openStats(R.state, id, R.me)],
      ...(canAdd(p) ? [['Add friend', async () => toast(await requestFriend(p.acct))]] : []),
      ...kickItems(R, id),
    ]);
  };
  box.addEventListener('contextmenu', rowMenu);
  /* moving through it with the arrow keys keeps it up after Tab is let go (until Esc or its ✖) */
  box.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) sticky = true; });
  vbox.addEventListener('click', e => {
    const b = e.target.closest('[data-vote]'); const R = getR(); if (!b || !R || !R.state.vote) return;
    R.send({ t: 'voteCast', n: R.state.vote.n, v: b.dataset.vote === '1' });
  });
  const paint = () => {
    const R = getR(); if (!R) return;
    const v = R.state.vote;
    vbox.hidden = !v;
    if (v) { setHTML(vbox, voteHTML(R.state, R.me)); if (v.n !== lastVote) { lastVote = v.n; sfx.boop(); } }
    render();
  };
  const tick = setInterval(() => { const R = getR(), t = vbox.querySelector('.vb-left'); if (R && R.state.vote && t) t.textContent = Math.max(0, Math.ceil((R.state.vote.ends - clockNow()) / 1000)); }, 500);
  /* Tab: up while held (unless it was opened to stay) */
  const keydown = e => { if (e.key !== 'Tab') return; e.preventDefault(); if (!e.repeat && box.hidden) open(); };
  const keyup = e => { if (e.key === 'Tab' && !sticky) close(); };
  return { open, close, paint, keydown, keyup, isOpen: () => !box.hidden, destroy() { clearInterval(tick); box.remove(); vbox.remove(); } };
}

/* gone quiet: no key, click, touch or mouse move in two minutes */
const IDLE_MS = 120000;
export function trackIdle(getR) {
  let last = Date.now(), told = false;
  const poke = () => { last = Date.now(); if (told) { told = false; const R = getR(); if (R) R.send({ t: 'idle', v: false }); } };
  const evs = ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart'];
  evs.forEach(k => addEventListener(k, poke, { passive: true, capture: true }));
  const t = setInterval(() => { if (!told && Date.now() - last > IDLE_MS) { const R = getR(); if (R) { told = true; R.send({ t: 'idle', v: true }); } } }, 5000);
  return () => { clearInterval(t); evs.forEach(k => removeEventListener(k, poke, { capture: true })); };
}
