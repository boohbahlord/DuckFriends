/* ---------- the blackjack table in the great room ----------
   Sit on a stool (seats.js) and the Blackjack window opens; get up (the button, a jump, Esc or the window's ×) and it
   closes. Justin's Butler deals and holds the house's chips: a computer duck, never a player (one of npc.js'
   characters, drawn by characters.js on his own stool; I asked for him by that name). House rules, as we decided: one
   deck shuffled every hand; bets of 10, 25 or 50 with no house limit; Hit, Stand or Double (no split, no insurance);
   the Butler hits to 16 and stands on every 17; a win pays 1:1, a blackjack 3:2 (rounded up to a whole chip), a push
   gives the bet back. Getting up mid-hand counts as Stand and the bet stays on the table.

   The host runs the table in s.hang.bj:
     st     the stage: 'idle' (nobody seated), 'vote', 'bet', 'deal', 'play', 'dealer', 'end' (the results); t when it began
     mode   '' (none yet), 'solo' (one player: just for fun, no vote), 'chips' or 'fun' (what the vote said). A game lasts
            until everyone has got up; a second player sitting down during a solo game brings the vote.
     votes  { id: 'chips' | 'fun' } (only the seated vote; a tie is just for fun); chips { id: n } (a chips game: 100 each
            to start, 100 at the next hand for whoever sits down later, and 100 more from the Butler for whoever has
            run out, with a notice: gift { id: 1 }); bets { id: n } (this hand's, doubles included)
     id     this hand's id; order: its players, in stool order; hands { id: { c: [cards], s: '' | 'stand' | 'bust' |
            'bj', d: 1 doubled, k: the stool } }; turn (an index in order) and tt when that turn began; dealer [cards] (the hole card
            -1 until the Butler turns it over); dt when the deal began (screens show its cards one by one, GAP apart);
            ct when the last card went down (the Butler's dealing pose)
     res    { id: { r: 'win' | 'bj' | 'push' | 'lose' | 'bust', n: chips won, below 0 lost } }
   A card is 0 … 51: c % 13 its rank (0 an ace, 9 a ten, 10 … 12 jack, queen, king), floor(c / 13) its suit (♠ ♥ ♦ ♣).
   The deck stays with the host (mem), never in the room's state, so nobody can read the next card or the hole card;
   a host who takes over mid-hand shuffles what isn't on the table. */
import { rule, activity } from './registry.js';
import { BJ, bjSpot } from './layout.js';
import { brain, stand } from './npc.js';
import { butlerSVG } from './npcart.js';
import { seatOf, SEATS, getUp } from './seats.js';
import { play } from './sounds.js';
import { nameHTML } from '../name.js';
import { rainbowHTML } from '../art.js';

export const VOTE = 15000, BET = 15000, TURN = 20000, GAP = 360, DGAP = 750, END = 4500, START = 100, BETS = [10, 25, 50];
const STOOLS = new Map(SEATS.filter(q => q.p.kind === 'stool').map(q => [q.id, q]));
const BUTLER = "Justin's Butler";

/* ---------- the cards ---------- */
const pts = c => { const r = c % 13; return r === 0 ? 1 : r >= 9 ? 10 : r + 1; };
/* a hand's best total (an ace counts 11 when that doesn't bust it: soft) */
export function total(cards) {
  let t = 0, ace = false;
  for (const c of cards || []) if (c >= 0) { t += pts(c); if (c % 13 === 0) ace = true; }
  return ace && t <= 11 ? { t: t + 10, soft: true } : { t, soft: false };
}
const natural = cards => cards.length === 2 && total(cards).t === 21;
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITS = ['♠', '♥', '♦', '♣'];
const red = c => { const u = Math.floor(c / 13); return u === 1 || u === 2; };

/* the host's deck for the hand it's dealing */
let mem = { id: '', deck: [], hole: -1 };
function shuffled(out = []) {
  const d = []; for (let c = 0; c < 52; c++) if (!out.includes(c)) d.push(c);
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
/* a host that took over mid-hand: the cards not on the table, shuffled, and the hole card from them */
function rebuild(b) {
  const seen = [...b.dealer, ...Object.values(b.hands).flatMap(h => h.c)].filter(c => c >= 0);
  mem = { id: b.id, deck: shuffled(seen), hole: -1 };
  if (b.dealer[1] === -1) mem.hole = mem.deck.pop();
}

/* ---------- the rules (the host) ---------- */
const fresh = () => ({ st: 'idle', t: 0, mode: '', votes: {}, chips: {}, bets: {}, gift: {}, id: '', order: [], hands: {}, turn: -1, tt: 0, dealer: [], dt: 0, ct: 0, res: {} });
const clone = b => JSON.parse(JSON.stringify(b));
/* who sits at the table, in stool order: [{ id, k }] */
export function atTable(s) {
  const out = [];
  for (const [key, v] of Object.entries((s.hang || {}).seats || {})) { const q = STOOLS.get(key); if (q && v && s.players[v[0]]) out.push({ id: v[0], k: q.p.n }); }
  return out.sort((a, b) => a.k - b.k);
}
export const dealEnd = b => b.dt + GAP * (2 * b.order.length + 2);

/* the next hand: the vote first if a group sat down; the bets in a chips game; else straight to the deal */
function nextHand(b, seated, now) {
  if (!seated.length) { Object.assign(b, fresh()); return; }
  Object.assign(b, { order: [], hands: {}, dealer: [], res: {}, bets: {}, gift: {}, turn: -1 });   // (the last hand's cards off the table)
  if (seated.length > 1 && (b.mode === '' || b.mode === 'solo')) { Object.assign(b, { st: 'vote', t: now, votes: {} }); return; }
  if (!b.mode) b.mode = 'solo';
  if (b.mode !== 'chips') { deal(b, seated, now); return; }
  for (const { id } of seated) {
    if (b.chips[id] === undefined) b.chips[id] = START;
    else if (b.chips[id] < BETS[0]) { b.chips[id] += START; b.gift[id] = 1; }
  }
  Object.assign(b, { st: 'bet', t: now });
}
/* deal to these players ([{ id, k }]: k their stool, where their cards go on the table) */
function deal(b, players, now) {
  const ids = players.map(q => q.id);
  b.id = Math.random().toString(36).slice(2, 9); b.order = ids; b.hands = {}; b.dealer = []; b.res = {}; b.turn = -1;
  mem = { id: b.id, deck: shuffled(), hole: -1 };
  for (const q of players) b.hands[q.id] = { c: [mem.deck.pop()], s: '', k: q.k };
  b.dealer.push(mem.deck.pop());
  for (const id of ids) b.hands[id].c.push(mem.deck.pop());
  mem.hole = mem.deck.pop(); b.dealer.push(-1);
  Object.assign(b, { st: 'deal', t: now, dt: now, ct: now });
}
/* the cards are down: blackjacks stand; the Butler looks under an ace or a ten for his own */
function afterDeal(b, now) {
  for (const id of b.order) if (natural(b.hands[id].c)) b.hands[id].s = 'bj';
  const up = b.dealer[0];
  if ((up % 13 === 0 || pts(up) === 10) && natural([up, mem.hole])) { b.dealer[1] = mem.hole; b.ct = now; settle(b, now); return; }
  b.st = 'play'; nextTurn(b, now, -1);
}
function nextTurn(b, now, from) {
  for (let i = from + 1; i < b.order.length; i++) if (!b.hands[b.order[i]].s) { b.turn = i; b.tt = now; return; }
  Object.assign(b, { st: 'dealer', t: now, turn: -1 });   // (the host turns the hole card over on its next heartbeat)
}
function settle(b, now) {
  const d = total(b.dealer).t, dbj = natural(b.dealer);
  for (const id of b.order) {
    const h = b.hands[id], p = total(h.c).t, bet = b.bets[id] || 0;
    const r = h.s === 'bust' ? 'bust' : natural(h.c) && !h.d ? (dbj ? 'push' : 'bj') : dbj ? 'lose' : d > 21 || p > d ? 'win' : p < d ? 'lose' : 'push';
    const n = r === 'win' ? bet : r === 'bj' ? Math.ceil(bet * 1.5) : r === 'push' ? 0 : -bet;
    b.res[id] = { r, n };
    if (b.mode === 'chips' && b.chips[id] !== undefined && n >= 0) b.chips[id] += bet + n;
  }
  Object.assign(b, { st: 'end', t: now, turn: -1 });
}

rule('bj', {
  init: () => ({ bj: fresh() }),
  /* { t: 'hang', k: 'bj', do: 'vote' | 'bet' | 'hit' | 'stand' | 'double', v } */
  act(s, a, now) {
    const b0 = s.hang.bj; if (!b0) return false;
    const b = clone(b0), id = a.id, seated = atTable(s).some(q => q.id === id);
    if (!seated) return false;
    if (a.do === 'vote') {
      if (b.st !== 'vote' || !['chips', 'fun'].includes(a.v)) return false;
      b.votes[id] = a.v;
    } else if (a.do === 'bet') {
      const n = +a.v;
      if (b.st !== 'bet' || !BETS.includes(n) || b.bets[id] || (b.chips[id] ?? 0) < n) return false;
      b.chips[id] -= n; b.bets[id] = n;
    } else if (['hit', 'stand', 'double'].includes(a.do)) {
      if (b.st !== 'play' || b.order[b.turn] !== id) return false;
      const h = b.hands[id]; if (!h || h.s) return false;
      if (a.do === 'stand') h.s = 'stand';
      else {
        if (mem.id !== b.id) return false;   // (the deck is the host's: anyone else waits for the host's answer)
        if (a.do === 'double') {
          if (h.c.length !== 2) return false;
          if (b.mode === 'chips') { const bet = b.bets[id] || 0; if ((b.chips[id] ?? 0) < bet) return false; b.chips[id] -= bet; b.bets[id] = bet * 2; }
          h.d = 1;
        }
        h.c.push(mem.deck.pop()); b.ct = now;
        const t = total(h.c).t;
        if (t > 21) h.s = 'bust'; else if (t === 21 || h.d) h.s = 'stand';
      }
      if (h.s) nextTurn(b, now, b.turn); else b.tt = now;   // (each card brings a fresh 20 s)
    } else return false;
    s.hang.bj = b; return true;
  },
  tick(s, now) {
    if (!s.hang.bj) { s.hang.bj = fresh(); return true; }
    const b0 = s.hang.bj, b = clone(b0), seated = atTable(s), at = new Set(seated.map(q => q.id));
    if (b.id && mem.id !== b.id && ['deal', 'play', 'dealer'].includes(b.st)) rebuild(b);
    if (!seated.length && b.st !== 'idle') Object.assign(b, fresh());   // everyone got up: the game is over
    switch (b.st) {
      case 'idle': if (seated.length) nextHand(b, seated, now); break;
      case 'vote': {
        if (seated.length < 2) { b.mode = 'solo'; b.votes = {}; nextHand(b, seated, now); break; }
        const v = seated.map(q => b.votes[q.id]).filter(Boolean);
        if (v.length < seated.length && now - b.t < VOTE) break;
        const c = v.filter(x => x === 'chips').length;
        b.mode = c > v.length - c ? 'chips' : 'fun'; b.votes = {}; b.chips = {};
        nextHand(b, seated, now); break;
      }
      case 'bet': {
        const can = seated.filter(q => (b.chips[q.id] ?? 0) >= BETS[0] || b.bets[q.id]);
        if (!can.every(q => b.bets[q.id]) && now - b.t < BET) break;
        const players = seated.filter(q => b.bets[q.id]);
        if (players.length) deal(b, players, now); else b.t = now;   // (nobody bet: the Butler waits for bets again)
        break;
      }
      case 'deal': if (now >= dealEnd(b)) afterDeal(b, now); break;
      case 'play': {
        const id = b.order[b.turn], h = b.hands[id];
        if (h && !h.s && (!at.has(id) || now - b.tt >= TURN)) { h.s = 'stand'; nextTurn(b, now, b.turn); }   // (got up, or out of time: Stand)
        break;
      }
      case 'dealer': {
        if (b.dealer[1] === -1) { b.dealer[1] = mem.hole; b.ct = now; break; }
        if (now - b.ct < DGAP) break;
        const live = b.order.some(id => b.hands[id].s === 'stand');   // (all bust or blackjack: he needn't draw)
        if (live && total(b.dealer).t < 17) { b.dealer.push(mem.deck.pop()); b.ct = now; } else settle(b, now);
        break;
      }
      case 'end': if (now - b.t >= END) nextHand(b, seated, now); break;
    }
    if (JSON.stringify(b) === JSON.stringify(b0)) return false;
    s.hang.bj = b; return true;
  },
  /* someone left the room: their chips and their vote go with them (a hand they're in still settles) */
  left(s, id) {
    const b0 = s.hang.bj; if (!b0) return;
    const b = clone(b0); delete b.chips[id]; delete b.votes[id]; s.hang.bj = b;
  },
});

/* ---------- Justin's Butler ---------- */
/* is the Butler dealing right now (a card going down): his pose */
function dealing(s, now) {
  const b = s.hang && s.hang.bj; if (!b) return false;
  return now - (b.ct || 0) < 380 || (b.st === 'deal' && now < dealEnd(b));
}
const CARD_HELD = `<span class="hang-npc-held card"><svg viewBox="0 0 14 20" aria-hidden="true"><rect x="1" y="1" width="12" height="18" rx="2" fill="#3e6d8c" stroke="#1c1c28" stroke-width="1.6"/><rect x="3.5" y="3.5" width="7" height="13" rx="1" fill="none" stroke="#e8d9a0" stroke-width="1"/></svg></span>`;
brain('butler', {
  kind: 'duck', name: BUTLER, sat: true,
  init: now => ({ w: stand(BJ.bx, BJ.by, now), a: '', f: 1, z: BJ.sh }),
  tick: () => false,
  svg: pose => butlerSVG({ size: 64 }) + (pose === 'deal' ? CARD_HELD : ''),
  look: (s, now) => dealing(s, now) ? 'deal' : '',
});

/* ---------- the computers (bots.js, TEST rooms) ---------- */
const hash = t => { let h = 7; for (const ch of String(t)) h = (h * 31 + ch.charCodeAt(0)) | 0; return h >>> 0; };
/* simple basic strategy against the Butler's up card */
function basic(b, id) {
  const h = b.hands[id], { t, soft } = total(h.c), up = b.dealer[0] % 13 === 0 ? 11 : pts(b.dealer[0]);
  const dbl = h.c.length === 2 && (b.mode !== 'chips' || (b.chips[id] ?? 0) >= (b.bets[id] || 0)) ? 'double' : 'hit';
  if (soft) return t >= 19 ? 'stand' : t === 18 ? (up >= 9 ? 'hit' : up >= 3 && up <= 6 ? dbl : 'stand') : up >= 5 && up <= 6 ? dbl : 'hit';
  if (t >= 17) return 'stand';
  if (t >= 13) return up <= 6 ? 'stand' : 'hit';
  if (t === 12) return up >= 4 && up <= 6 ? 'stand' : 'hit';
  return t === 11 ? dbl : t === 10 ? (up <= 9 ? dbl : 'hit') : t === 9 ? (up >= 3 && up <= 6 ? dbl : 'hit') : 'hit';
}
/* a computer, while a person sits at the table: [actions] when it's seated there (it votes, bets and plays after a
   moment's thought; it gets up a while after the last person left); { seat, x, y } when it wants a free stool
   (most of them do: it walks to (x, y) and sits); null otherwise */
export function bjBot(s, id, now) {
  const b = (s.hang || {}).bj; if (!b) return null;
  const seated = atTable(s), mine = seated.some(q => q.id === id), people = seated.some(q => !s.players[q.id].bot);
  const think = 900 + hash(id + b.st + b.id + b.turn) % 1800, A = (o) => [{ t: 'hang', k: 'bj', id, ...o }];
  if (mine) {
    if (!people) return Math.random() < .03 ? [{ t: 'hang', k: 'sit', seat: '', id }] : [];
    if (b.st === 'vote' && !b.votes[id] && now - b.t > think) return A({ do: 'vote', v: hash(id) % 3 ? 'chips' : 'fun' });
    if (b.st === 'bet' && !b.bets[id] && now - b.t > think) { const ok = BETS.filter(n => n <= (b.chips[id] ?? 0)); return ok.length ? A({ do: 'bet', v: ok[hash(id + b.t) % ok.length] }) : []; }
    if (b.st === 'play' && b.order[b.turn] === id && now - b.tt > think) return A({ do: basic(b, id) });
    return [];
  }
  if (!people || hash(id) % 10 > 6) return null;
  const me = s.pos[id]; if (!me) return null;
  const taken = new Set(Object.keys((s.hang || {}).seats || {})), x = me.x * 6000, y = me.y * 4400;
  const free = [...STOOLS.values()].filter(q => !taken.has(q.id)).sort((a, c) => Math.hypot(a.up[0][0] - x, a.up[0][1] - y) - Math.hypot(c.up[0][0] - x, c.up[0][1] - y));
  return free.length ? { seat: free[0].id, x: free[0].up[0][0], y: free[0].up[0][1] } : null;
}

/* ---------- on the screen: the window, and the cards on the table ---------- */
let v = null;   // { ctx, el, …parts, open, pick (the bet chosen), sig, prev (the cards each hand box shows), seen (cards shown), bets (bets seen), free (the board around the window) }
const mySeat = s => { const q = seatOf(s, v && v.ctx.me); return q && q.p.kind === 'stool' ? q : null; };
/* how many of the deal's cards are down on this screen: the deal goes round twice (each player, then the Butler) */
const dealtBy = (b, now) => b.st === 'deal' ? Math.max(0, Math.floor((now - b.dt) / GAP) + 1) : Infinity;
function shownCards(b, now) {
  const n = b.order.length, k = dealtBy(b, now), out = { dealer: [], hands: {} };
  b.order.forEach((id, j) => { out.hands[id] = (b.hands[id] ? b.hands[id].c : []).filter((c, i) => i > 1 || (i ? n + 1 + j : j) < k); });
  out.dealer = b.dealer.filter((c, i) => i > 1 || (i ? 2 * n + 1 : n) < k);
  return out;
}
const cardHTML = (c, cls = '') => c < 0 ? `<span class="bj-card back${cls}"></span>` : `<span class="bj-card${red(c) ? ' red' : ''}${cls}"><b>${RANKS[c % 13]}</b><i>${SUITS[Math.floor(c / 13)]}</i></span>`;
const chipSVG = (c = '#ef3b3b') => `<svg class="bj-chip" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.6" fill="${c}" stroke="#1c1c28" stroke-width="1.6"/><circle cx="10" cy="10" r="5" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2.4 2"/></svg>`;
const play3 = (on, dbl) => `<button type="button" class="btn green" data-do="hit"${on ? '' : ' disabled'}>Hit</button><button type="button" class="btn red" data-do="stand"${on ? '' : ' disabled'}>Stand</button><button type="button" class="btn yellow" data-do="double"${dbl ? '' : ' disabled'}>Double</button>`;
const WORD = { win: 'Win', bj: 'Blackjack!', push: 'Push', lose: 'Lose', bust: 'Bust' };
const nameOf = (s, id) => { const p = s.players[id]; return p ? nameHTML(p.name, p.nameStyle) : ''; };
const totalTxt = cards => cards.length ? String(total(cards).t) : '';

/* what the window says, and which buttons it shows */
function render(s, now) {
  const b = s.hang.bj, me = v.ctx.me, cards = shownCards(b, now), chips = b.mode === 'chips', inHand = b.order.includes(me);
  const turnId = b.st === 'play' ? b.order[b.turn] : null, res = b.res[me];
  let say = '', acts = '';
  if (b.st === 'vote') {
    say = 'Play for chips?';
    acts = `<button type="button" class="btn green${b.votes[me] === 'chips' ? ' on' : ''}" data-do="vote" data-v="chips">Play for chips</button><button type="button" class="btn yellow${b.votes[me] === 'fun' ? ' on' : ''}" data-do="vote" data-v="fun">Just for fun</button>`;
  } else if (b.st === 'bet') {
    const have = b.chips[me] ?? 0;
    if (b.bets[me]) say = 'Bet ' + b.bets[me];
    else if (have < BETS[0]) say = 'Next hand';
    else {
      say = b.gift[me] ? '+100 chips, on the house' : 'Bet';
      if (v.pick > have) v.pick = BETS.filter(n => n <= have).pop();
      acts = BETS.map((n, i) => `<button type="button" class="btn small bj-pick${v.pick === n ? ' on' : ''}" data-do="pick" data-v="${n}"${n > have ? ' disabled' : ''}>${chipSVG(['#ef3b3b', '#2fa4ff', '#37d421'][i])}${n}</button>`).join('') + `<button type="button" class="btn green" data-do="bet">Bet</button>`;
    }
  } else if (b.st === 'play' && turnId === me) {
    say = 'Your turn';
    const h = b.hands[me], dbl = h.c.length === 2 && (!chips || (b.chips[me] ?? 0) >= (b.bets[me] || 0));
    acts = play3(true, dbl);
  } else if (b.st === 'play') say = inHand ? `${nameOf(s, turnId)}'s turn` : 'Next hand';
  else if (b.st === 'deal') say = inHand ? BUTLER + ' deals' : 'Next hand';
  else if (b.st === 'dealer') say = BUTLER + ' plays';
  else if (b.st === 'end') say = res ? WORD[res.r] + (chips && res.n ? ` ${res.n > 0 ? '+' : '−'}${Math.abs(res.n)}` : '') : 'Next hand';
  if (!acts && b.st !== 'vote' && b.st !== 'bet') acts = play3(false, false);   // (not my turn: Hit, Stand and Double wait, greyed, so the window keeps its size)
  const mine = cards.hands[me] || [], dl = cards.dealer;
  if (v.prev.id !== b.id) v.prev = { id: b.id };
  const hand = (who, key, list, cls, note) => {   // (a card already on this screen doesn't pop in again)
    const was = v.prev[key] || []; v.prev[key] = list.slice();
    return `<div class="hang-bj-hand ${cls}"><span class="hang-bj-who">${who}${list.length ? `<b class="bj-total">${totalTxt(list)}</b>` : ''}${note || ''}</span><div class="bj-cards">${list.map((c, i) => cardHTML(c, was[i] === c ? ' old' : '')).join('') || '<span class="bj-card none"></span>'}</div></div>`;
  };
  const myNote = (inHand && chips && b.bets[me] ? `<span class="bj-bet">${chipSVG()}${b.bets[me]}</span>` : '') + (res ? `<span class="bj-res r-${res.r}">${WORD[res.r]}</span>` : '');
  v.say.innerHTML = say;
  v.chipsEl.hidden = !chips; if (chips) v.chipsEl.innerHTML = chipSVG('#ffd23f') + (b.chips[me] ?? 0);
  v.hands.innerHTML = hand(BUTLER, 'd', dl, 'dealer') + hand('You', 'm', mine, 'mine' + (turnId === me ? ' turn' : ''), myNote);
  v.others.innerHTML = b.order.filter(id => id !== me && s.players[id]).map(id => {
    const list = cards.hands[id] || [], r = b.res[id];
    return `<li class="${id === turnId ? 'turn' : ''}">${nameOf(s, id)}<b class="bj-total">${totalTxt(list)}</b>${chips && b.bets[id] ? `<span class="bj-bet">${chipSVG()}${b.bets[id]}</span>` : ''}${r ? `<span class="bj-res r-${r.r}">${WORD[r.r]}</span>` : ''}</li>`;
  }).join('');
  if (v.acts.dataset.sig !== acts) { v.acts.dataset.sig = acts; v.acts.innerHTML = acts; }
}
/* the timer under the words: the vote, the bets, a turn */
function timer(b, now) {
  const [from, len] = b.st === 'vote' ? [b.t, VOTE] : b.st === 'bet' ? [b.t, BET] : b.st === 'play' ? [b.tt, TURN] : [0, 0];
  return len ? Math.max(0, 1 - (now - from) / len) : 0;
}

/* the cards and bets on the table itself (everyone sees them, seated or not): one drawing over its top */
const TOP = { l: BJ.cx - BJ.r - 10, t: BJ.cy - BJ.h - BJ.r - 10, w: 2 * BJ.r + 20, h: 2 * BJ.r + 20 };
function tableSVG(s, now) {
  const b = s.hang.bj, cards = shownCards(b, now), turnId = b.st === 'play' ? b.order[b.turn] : null;
  const ox = TOP.l, oy = TOP.t + BJ.h;   // (a point on the top at world (x, y) draws at (x − ox, y − oy) in this box)
  const card = (x, y, c, a = 0) => `<g transform="translate(${(x - ox).toFixed(1)} ${(y - oy).toFixed(1)}) rotate(${a})"><rect x="-7" y="-10" width="14" height="20" rx="2" fill="${c < 0 ? '#3e6d8c' : '#fbfaf6'}" stroke="#1c1c28" stroke-width="1.4"/>${c < 0 ? '<rect x="-4.5" y="-7.5" width="9" height="15" rx="1" fill="none" stroke="#e8d9a0" stroke-width="1"/>' : `<path d="M-3 -1l3 -3l3 3l-3 3Z" fill="${red(c) ? '#d23b33' : '#1c1c28'}"/>`}</g>`;
  const fan = (x, y, list) => list.map((c, i) => card(x + (i - (list.length - 1) / 2) * 9, y, c, (i - (list.length - 1) / 2) * 5)).join('');
  let out = fan(BJ.cx, BJ.cy - BJ.r * .45, cards.dealer);
  for (const id of b.order) {   // (in front of the stool each one was dealt at: still there if they've got up)
    const h = b.hands[id]; if (!h) continue;
    const q = bjSpot(h.k, BJ.r * .62), c = bjSpot(h.k, BJ.r * .84);
    if (id === turnId) out += `<circle cx="${(q.x - ox).toFixed(1)}" cy="${(q.y - oy).toFixed(1)}" r="17" fill="#ffd23f" opacity=".35"/>`;
    out += fan(q.x, q.y, cards.hands[id] || []);
    const bet = b.bets[id]; if (b.mode === 'chips' && bet) for (let i = 0; i < Math.min(5, Math.ceil(bet / 10)); i++) out += `<ellipse cx="${(c.x - ox).toFixed(1)}" cy="${(c.y - oy - i * 3).toFixed(1)}" rx="6.5" ry="3.2" fill="${['#ef3b3b', '#2fa4ff', '#37d421'][BETS.indexOf(bet) < 0 ? 2 : BETS.indexOf(bet)]}" stroke="#1c1c28" stroke-width="1.1"/>`;
  }
  return `<svg class="hg" viewBox="0 0 ${TOP.w} ${TOP.h}" width="${TOP.w}" height="${TOP.h}" overflow="visible" aria-hidden="true">${out}</svg>`;
}

function open(ctx) {
  v.open = true; v.el.hidden = false; v.sig = ''; v.free = null;
  v.el.classList.toggle('side', ctx.world.vw > ctx.world.vh);   // (a wide screen: on the left, as the guestbook; tall: along the bottom)
}
function close() { if (!v || !v.open) return; v.open = false; v.el.hidden = true; }
function esc_(e) { if (e.key === 'Escape' && v && v.open && !document.querySelector('.win-back, .ctx')) { e.preventDefault(); e.stopPropagation(); getUp(v.ctx); } }   // (before the game's own Escape: the pause menu)
function press(e) {
  const btn = e.target.closest('[data-do]'); if (!btn || btn.disabled || !v) return;
  const d = btn.dataset.do, s = v.ctx.state(), b = s.hang.bj;
  if (d === 'pick') { v.pick = +btn.dataset.v; v.sig = ''; return; }
  if (d === 'bet') { v.ctx.send({ t: 'hang', k: 'bj', do: 'bet', v: v.pick }); return; }
  if (d === 'vote') { v.ctx.send({ t: 'hang', k: 'bj', do: 'vote', v: btn.dataset.v }); return; }
  if (b && b.st === 'play') v.ctx.send({ t: 'hang', k: 'bj', do: d });
}

activity({
  id: 'bj',
  mount(ctx) {
    const board = ctx.world.board, el = document.createElement('div');
    el.className = 'hang-bj'; el.hidden = true;
    el.innerHTML = `<div class="hang-book-head hang-bj-head"><h3 class="hang-bj-title">${rainbowHTML('Blackjack', { seed: 5 })}</h3><p class="hang-bj-say" aria-live="polite"></p><span class="hang-bj-chips" hidden></span><button type="button" class="win-x hang-book-x" aria-label="Get up">×</button></div>
      <div class="hang-bj-time"><i></i></div>
      <div class="hang-bj-hands"></div><ul class="hang-bj-others"></ul><div class="hang-bj-acts"></div>`;
    for (const t of ['pointerdown', 'click', 'wheel', 'touchstart']) el.addEventListener(t, e => e.stopPropagation(), { passive: true });   // (a tap on the window never walks the duck)
    board.append(el);
    const art = document.createElement('div'); art.className = 'hp hang-bj-top'; art.hidden = true;
    Object.assign(art.style, { width: TOP.w + 'px', height: TOP.h + 'px', zIndex: Math.round(BJ.cy) + 11 });   // (just over the table: a duck south of it still in front)
    board.querySelector('.hang-props').append(art);
    v = { ctx, el, art, say: el.querySelector('.hang-bj-say'), chipsEl: el.querySelector('.hang-bj-chips'), hands: el.querySelector('.hang-bj-hands'), others: el.querySelector('.hang-bj-others'),
      acts: el.querySelector('.hang-bj-acts'), bar: el.querySelector('.hang-bj-time i'), open: false, pick: BETS[0], sig: '', prev: {}, artSig: '', seen: -1, betsSeen: -1, free: null };
    el.querySelector('.hang-book-x').onclick = () => getUp(ctx);
    el.addEventListener('click', press);
    addEventListener('keydown', esc_, true);
  },
  unmount() { if (!v) return; removeEventListener('keydown', esc_, true); v.el.remove(); v.art.remove(); v = null; },
  step(dt, now, ctx) {
    if (!v) return;
    const s = ctx.state(), b = s.hang && s.hang.bj; if (!b) return;
    const seat = mySeat(s);
    if (seat && !v.open) open(ctx); else if (!seat && v.open) close();
    /* the cards on this screen: a card sound for each one going down, a chip sound for each bet, near the table */
    const shown = shownCards(b, now), n = shown.dealer.length + Object.values(shown.hands).reduce((m, l) => m + l.length, 0), bets = Object.keys(b.bets).length;
    if (n > v.seen && v.seen >= 0 && ctx.world.inside) play('card', { x: BJ.cx, y: BJ.cy });
    if (bets > v.betsSeen && v.betsSeen >= 0 && ctx.world.inside) play('chips', { x: BJ.cx, y: BJ.cy });
    const artSig = b.id + '|' + n + '|' + JSON.stringify(b.bets) + '|' + b.st + b.turn + '|' + b.dealer.join();
    if (artSig !== v.artSig) { v.artSig = artSig; v.art.innerHTML = tableSVG(s, now); }
    v.seen = n; v.betsSeen = bets;
    if (!v.open) return;
    const sig = JSON.stringify(b) + n + v.pick + ctx.me;
    if (sig !== v.sig) { v.sig = sig; render(s, now); if (v.free && v.el.offsetHeight > v.free.h + 1) v.free = null; }   // (grown taller: the camera finds the board left above it again)
    const k = timer(b, now); v.bar.style.transform = `scaleX(${k.toFixed(3)})`; v.bar.parentNode.classList.toggle('off', !k);
  },
  draw(now, ctx) {
    if (!v) return;
    const Wd = ctx.world, a = Wd.toScreen(TOP.l, TOP.t), sc = Wd.sc;
    const vis = Wd.inside && a.left < Wd.vw + 30 && a.left + TOP.w * sc > -30 && a.top < Wd.vh + 30 && a.top + TOP.h * sc > -30;
    if (v.art.hidden !== !vis) v.art.hidden = !vis;
    if (vis) { const tr = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px) scale(${sc.toFixed(4)})`; if (v.art._tr !== tr) { v.art._tr = tr; v.art.style.transform = tr; } }
  },
  /* seated at the table: the camera looks at the table (its middle, from the Butler's name down to the front stools),
     in the middle of the board the window leaves free */
  focus(ctx) {
    if (!v || !v.open) return null;
    const Wd = ctx.world;
    if (!v.free || v.free.vw !== Wd.vw || v.free.vh !== Wd.vh) {
      v.el.classList.toggle('side', Wd.vw > Wd.vh);   // (turned round: the window moves too)
      const r = v.el.getBoundingClientRect(), o = Wd.board.getBoundingClientRect(), side = v.el.classList.contains('side');
      v.free = side ? { vw: Wd.vw, vh: Wd.vh, h: r.height, x: (r.right - o.left + Wd.vw) / 2, y: Wd.vh / 2 } : { vw: Wd.vw, vh: Wd.vh, h: r.height, x: Wd.vw / 2, y: (r.top - o.top) / 2 };
      if (!r.width) v.free = null;
    }
    const f = v.free || { x: Wd.vw / 2, y: Wd.vh / 2 }, top = BJ.by - BJ.sh - 64 - 34, bottom = bjSpot(3, BJ.sr).y + BJ.st + 10;
    return { x: BJ.cx - (f.x - Wd.vw / 2) / Wd.sc, y: (top + bottom) / 2 - (f.y - Wd.vh / 2) / Wd.sc };
  },
});
