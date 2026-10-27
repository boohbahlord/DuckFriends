/* ---------- the blackjack table in the great room ----------
   Sit on a stool (seats.js) and the Blackjack window opens; get up (the button, a jump, Esc or the window's ×) and it
   closes. Justin's Butler deals and holds the house's chips: a computer duck, never a player (one of npc.js'
   characters, drawn by characters.js on his own stool; I asked for him by that name). House rules, as we decided: one
   deck shuffled every hand; any whole bet from 1 chip to All in (every chip you have; the window's 1, 5 and 25 chips add
   to its bet box) with no house limit; Hit, Stand or Double
   (no split, no insurance); the Butler hits to 16 and stands on every 17; a win pays 1:1, a blackjack 3:2 (rounded up
   to a whole chip), a push gives the bet back. Getting up mid-hand counts as Stand and the bet stays on the table.
   Two or more in a hand play each other, not the Butler (I asked for that), unless they voted to let him play too: then
   it's everyone against him as above. Against each other he only deals, every bet goes into one pot,
   the hand closest to 21 takes it all (a blackjack beats a 21 of three or more cards), a tie splits it in whole chips
   (an odd chip to the first in stool order), and if everyone busts the bets go back.

   The host runs the table in s.hang.bj:
     st     the stage: 'idle' (nobody seated), 'vote', 'bet', 'deal', 'play', 'dealer', 'end' (the results); t when it began
     mode   '' (none yet), 'solo' (one player: just for fun, no vote), 'chips' or 'fun' (what the vote said). A game lasts
            until everyone has got up; a second player sitting down during a solo game brings the vote.
     votes  { id: 'chips' | 'fun' } (only the seated vote; a tie is just for fun); bvotes { id: 1 } who wants the Butler
            to play too, and butler 1 when most of the seated did (a tie: he only deals); chips { id: n } (a chips game: 100 each
            to start, 100 at the next hand for whoever sits down later, and 100 more from the Butler for whoever has
            run out, with a notice: gift { id: 1 }); bets { id: n } (this hand's, doubles included)
     id     this hand's id; order: its players, in stool order; pvp 1 when they play each other (two or more); hands { id: { c: [cards], s: '' | 'stand' | 'bust' |
            'bj', d: 1 doubled, k: the stool } }; turn (an index in order) and tt when that turn began; dealer [cards] (the hole card
            -1 until the Butler turns it over); dt when the deal began (screens show its cards one by one, GAP apart);
            ct when the last card went down (the Butler's dealing pose)
     res    { id: { r: 'win' | 'bj' | 'push' | 'lose' | 'bust' | 'split' | 'back', n: chips won, below 0 lost } }
            (split: a tie for the pot; back: everyone bust, the bets went back)
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
import { duckSVG } from '../duck.js';

export const VOTE = 15000, BET = 15000, TURN = 20000, GAP = 360, DGAP = 750, END = 4500, START = 100, BETS = [1, 5, 25];
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
const fresh = () => ({ st: 'idle', t: 0, mode: '', votes: {}, bvotes: {}, butler: 0, chips: {}, bets: {}, gift: {}, id: '', order: [], pvp: 0, hands: {}, turn: -1, tt: 0, dealer: [], dt: 0, ct: 0, res: {} });
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
  b.id = Math.random().toString(36).slice(2, 9); b.order = ids; b.hands = {}; b.dealer = []; b.res = {}; b.turn = -1; b.pvp = ids.length > 1 && !b.butler ? 1 : 0;
  mem = { id: b.id, deck: shuffled(), hole: -1 };
  for (const q of players) b.hands[q.id] = { c: [mem.deck.pop()], s: '', k: q.k };
  if (!b.pvp) b.dealer.push(mem.deck.pop());   // (players against each other: the Butler deals himself nothing)
  for (const id of ids) b.hands[id].c.push(mem.deck.pop());
  if (!b.pvp) { mem.hole = mem.deck.pop(); b.dealer.push(-1); }
  Object.assign(b, { st: 'deal', t: now, dt: now, ct: now });
}
/* the cards are down: blackjacks stand; the Butler looks under an ace or a ten for his own */
function afterDeal(b, now) {
  for (const id of b.order) if (natural(b.hands[id].c)) b.hands[id].s = 'bj';
  const up = b.dealer[0];
  if (!b.pvp && (up % 13 === 0 || pts(up) === 10) && natural([up, mem.hole])) { b.dealer[1] = mem.hole; b.ct = now; settle(b, now); return; }
  b.st = 'play'; nextTurn(b, now, -1);
}
function nextTurn(b, now, from) {
  for (let i = from + 1; i < b.order.length; i++) if (!b.hands[b.order[i]].s) { b.turn = i; b.tt = now; return; }
  if (b.pvp) { settle(b, now); return; }   // (nobody to beat but each other: no Butler's turn)
  Object.assign(b, { st: 'dealer', t: now, turn: -1 });   // (the host turns the hole card over on its next heartbeat)
}
/* players against each other: the pot to the best hand (a blackjack counts 22: it beats any other 21) */
export const pot = b => Object.values(b.bets).reduce((m, n) => m + n, 0);
function settlePot(b) {
  const score = id => { const h = b.hands[id]; return h.s === 'bust' ? -1 : natural(h.c) ? 22 : total(h.c).t; };
  const best = Math.max(...b.order.map(score)), won = b.order.filter(id => best >= 0 && score(id) === best), p = pot(b);
  const share = won.length ? Math.floor(p / won.length) : 0, odd = won.length ? p - share * won.length : 0;
  for (const id of b.order) {
    const bet = b.bets[id] || 0, h = b.hands[id], i = won.indexOf(id);
    const get = best < 0 ? bet : i < 0 ? 0 : share + (i < odd ? 1 : 0);   // (whole chips: the odd ones to the first in stool order)
    const r = best < 0 ? 'back' : i < 0 ? (h.s === 'bust' ? 'bust' : 'lose') : won.length > 1 ? 'split' : best === 22 ? 'bj' : 'win';
    b.res[id] = { r, n: get - bet };
    if (b.mode === 'chips' && b.chips[id] !== undefined) b.chips[id] += get;
  }
}
function settle(b, now) {
  if (b.pvp) { settlePot(b); Object.assign(b, { st: 'end', t: now, turn: -1 }); return; }
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
    } else if (a.do === 'butler') {
      if (b.st !== 'vote') return false;
      if (a.v) b.bvotes[id] = 1; else delete b.bvotes[id];
    } else if (a.do === 'bet') {
      const n = a.v === 'all' ? b.chips[id] ?? 0 : +a.v;
      if (b.st !== 'bet' || !Number.isInteger(n) || n < 1 || b.bets[id] || (b.chips[id] ?? 0) < n) return false;
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
        b.butler = seated.filter(q => b.bvotes[q.id]).length * 2 > seated.length ? 1 : 0; b.bvotes = {};
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
  if (b.pvp) {   // (against each other: beat the best hand that's already standing, else stop at 17)
    const { t } = total(b.hands[id].c), beat = Math.max(0, ...b.order.filter(o => o !== id && ['stand', 'bj'].includes(b.hands[o].s)).map(o => natural(b.hands[o].c) ? 22 : total(b.hands[o].c).t));
    return t < 21 && (t <= beat || t < 17) ? 'hit' : 'stand';
  }
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
    if (b.st === 'vote' && !b.votes[id] && now - b.t > think) return [...(hash(id) % 4 ? [] : A({ do: 'butler', v: 1 })), ...A({ do: 'vote', v: hash(id) % 3 ? 'chips' : 'fun' })];
    if (b.st === 'bet' && !b.bets[id] && now - b.t > think) { const have = b.chips[id] ?? 0, h = hash(id + b.t); return have ? A({ do: 'bet', v: h % 12 ? Math.min(have, [5, 10, 15, 25, 30, 50][h % 6]) : 'all' }) : []; }
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
let v = null;   // { ctx, el, …parts, open, pick (the bet chosen), sig, prev (the cards each hand box shows), voted (the ducks each vote box shows), seen (cards shown), bets (bets seen), free (the board around the window) }
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
const WORD = { win: 'Win', bj: 'Blackjack!', push: 'Push', lose: 'Lose', bust: 'Bust', split: 'Split', back: 'Bets back' };
const COLORS = ['#ef3b3b', '#2fa4ff', '#37d421'], GOLD = '#ffd23f', COUNT = 700;   // (COUNT: how long a chip count takes to count up or down)
/* the chips each one has on this screen: they count up or down to the real number (v.disp) */
const shownChips = (b, id) => v.disp[id] ?? b.chips[id] ?? 0;
function countChips(b, dt) {
  let moved = false;
  for (const [id, n] of Object.entries(b.chips)) {
    const d = v.disp[id];
    if (d === undefined || d === n) { v.disp[id] = n; continue; }
    if (v.from[id] === undefined) v.from[id] = d;
    const step = Math.max(1, Math.ceil(Math.abs(n - v.from[id]) * dt / COUNT));
    v.disp[id] = d < n ? Math.min(n, d + step) : Math.max(n, d - step); moved = true;
    if (v.disp[id] === n) delete v.from[id];
  }
  for (const id of Object.keys(v.disp)) if (b.chips[id] === undefined) delete v.disp[id];
  return moved;
}
/* the hand to beat (players against each other): the best one standing; when the hand is over, the winner's (if I won,
   the next best) */
function toBeat(s, b, cards) {
  const me = v.ctx.me, score = id => natural(b.hands[id].c) ? 22 : total(b.hands[id].c).t;
  const others = b.order.filter(id => id !== me), won = others.filter(id => ['win', 'bj', 'split'].includes((b.res[id] || {}).r));
  const ids = b.st === 'end' ? (won.length ? won : others.filter(id => b.hands[id].s !== 'bust')) : others.filter(id => ['stand', 'bj'].includes(b.hands[id].s));   // (over: who won, or if that was me, the best of the rest)
  const id = ids.sort((x, y) => score(y) - score(x))[0];
  return id ? { id, list: cards.hands[id] || [] } : null;
}
const nameOf = (s, id) => { const p = s.players[id]; return p ? nameHTML(p.name, p.nameStyle) : ''; };
const totalTxt = cards => cards.length ? String(total(cards).t) : '';

/* what the window says, and which buttons it shows */
function render(s, now) {
  const b = s.hang.bj, me = v.ctx.me, cards = shownCards(b, now), chips = b.mode === 'chips', inHand = b.order.includes(me);
  const turnId = b.st === 'play' ? b.order[b.turn] : null, res = b.res[me];
  let say = '', acts = '';
  if (b.st === 'vote') {
    say = 'Play for chips?';
    const bn = atTable(s).filter(q => b.bvotes[q.id]).length;
    acts = `<button type="button" class="btn green${b.votes[me] === 'chips' ? ' on' : ''}" data-do="vote" data-v="chips">Play for chips</button><button type="button" class="btn yellow${b.votes[me] === 'fun' ? ' on' : ''}" data-do="vote" data-v="fun">Just for fun</button>`
      + `<button type="button" class="btn small bj-let${b.bvotes[me] ? ' on' : ''}" data-do="butler" data-v="${b.bvotes[me] ? 0 : 1}" aria-pressed="${!!b.bvotes[me]}">${b.bvotes[me] ? '✓' : '✗'} ${BUTLER} plays too${bn ? ` <b>${bn}</b>` : ''}</button>`;
  } else if (b.st === 'bet') {
    const have = b.chips[me] ?? 0;
    if (b.bets[me]) say = ((b.chips[me] ?? 0) === 0 ? 'All in ' : 'Bet ') + b.bets[me];
    else if (have < BETS[0]) say = 'Next hand';
    else {
      say = b.gift[me] ? '+100 chips, on the house' : 'Bet';
      if (v.amt > have) v.amt = have;
      acts = `<span class="bj-amt"><button type="button" class="btn small bj-arrow" data-do="amt" data-v="-1" aria-label="One less">▼</button><input class="bj-box" type="text" inputmode="numeric" maxlength="5" placeholder="0" aria-label="Bet"><button type="button" class="btn small bj-arrow" data-do="amt" data-v="1" aria-label="One more">▲</button></span>`
        + BETS.map((n, i) => `<button type="button" class="btn small bj-pick" data-do="add" data-v="${n}">${chipSVG(COLORS[i])}${n}</button>`).join('')
        + `<button type="button" class="btn small bj-pick" data-do="all">${chipSVG(GOLD)}All in</button><button type="button" class="btn green bj-go" data-do="bet">Bet</button>`;
    }
  } else if (b.st === 'play' && turnId === me) {
    say = 'Your turn';
    const h = b.hands[me], dbl = h.c.length === 2 && (!chips || (b.chips[me] ?? 0) >= (b.bets[me] || 0));
    acts = play3(true, dbl);
  } else if (b.st === 'play') say = inHand ? `${nameOf(s, turnId)}'s turn` : 'Next hand';
  else if (b.st === 'deal') say = inHand ? BUTLER + ' deals' : 'Next hand';
  else if (b.st === 'dealer') say = BUTLER + ' plays';
  else if (b.st === 'end') {
    say = res ? WORD[res.r] + (chips && res.n ? ` ${res.n > 0 ? '+' : '−'}${Math.abs(res.n)}` : '') : 'Next hand';
    const won = b.pvp && res && ['lose', 'bust'].includes(res.r) ? b.order.filter(id => ['win', 'bj', 'split'].includes((b.res[id] || {}).r)) : [];   // (lost the pot: who took it)
    if (won.length) say += ` · ${won.map(id => nameOf(s, id)).join(' & ')} ${won.length > 1 ? 'split it' : 'wins'}`;
  }
  if (!acts && b.st !== 'vote' && b.st !== 'bet') acts = play3(false, false);   // (not my turn: Hit, Stand and Double wait, greyed, so the window keeps its size)
  const mine = cards.hands[me] || [];
  if (v.prev.id !== b.id) v.prev = { id: b.id };
  const hand = (who, key, list, cls, note) => {   // (a card already on this screen doesn't pop in again)
    const was = v.prev[key] || []; v.prev[key] = list.slice();
    return `<div class="hang-bj-hand ${cls}"><span class="hang-bj-who">${who}${list.length ? `<b class="bj-total">${totalTxt(list)}</b>` : ''}${note || ''}</span><div class="bj-cards">${list.map((c, i) => cardHTML(c, was[i] === c ? ' old' : '')).join('') || '<span class="bj-card none"></span>'}</div></div>`;
  };
  const myNote = res ? `<span class="bj-res r-${res.r}">${WORD[res.r]}</span>` : '';
  v.say.innerHTML = say;
  v.chipsEl.hidden = !chips; if (chips) v.chipsEl.innerHTML = chipSVG(GOLD) + `<b>${shownChips(b, me)}</b>`;
  /* the vote: the two boxes show who picked what, a little duck for each (as Lawyering's votes), mine ringed */
  const pick = (o, label) => {
    const ids = atTable(s).map(q => q.id).filter(id => b.votes[id] === o && s.players[id]), was = v.voted[o] || []; v.voted[o] = ids;
    return `<div class="hang-bj-hand bj-vote${b.votes[me] === o ? ' turn' : ''}"><span class="hang-bj-who">${label}${ids.length ? `<b class="bj-total">${ids.length}</b>` : ''}</span><div class="bj-cards bj-voters">${ids.map(id => `<span class="bj-voter${was.includes(id) ? ' old' : ''}">${duckSVG(s.players[id].duck, { size: 26, shadow: false, title: s.players[id].name })}</span>`).join('') || '<span class="bj-card none"></span>'}</div></div>`;
  };
  if (b.st !== 'vote') v.voted = {};
  /* beside my hand: my bet, and against each other the pot and the best hand standing (everyone's cards, the Butler's
     too, are on the table, so the window shows only mine; I asked for that) */
  const stat = (label, val, cls = '') => `<div class="bj-stat${cls}"><span>${label}</span><b>${val}</b></div>`, top = b.pvp && b.st === 'play' && toBeat(s, b, cards);
  const stats = (inHand && chips && b.bets[me] ? stat((b.chips[me] ?? 0) === 0 ? 'All in' : 'Bet', chipSVG() + b.bets[me]) : '')
    + (b.pvp && chips && ['deal', 'play'].includes(b.st) ? stat('Pot', chipSVG(GOLD) + pot(b), ' pot') : '')
    + (top && top.list.length ? stat('To beat', String(natural(b.hands[top.id].c) ? 'BJ' : total(top.list).t)) : '');
  v.hands.innerHTML = b.st === 'vote' ? pick('chips', 'Play for chips') + pick('fun', 'Just for fun')
    : inHand ? hand('You', 'm', mine, 'mine' + (turnId === me ? ' turn' : ''), myNote) + (stats ? `<div class="bj-stats">${stats}</div>` : '') : '';
  if (v.acts.dataset.sig !== acts) { v.acts.dataset.sig = acts; v.acts.innerHTML = acts; }
  amtShow();
}
/* the bet box: what I'll bet (v.amt, 0 while empty); typing in it, its arrows, the chips that add to it */
function amtShow() {
  const box = v.acts.querySelector('.bj-box'); if (!box) return;
  if (document.activeElement !== box) box.value = v.amt ? String(v.amt) : '';
  const go = v.acts.querySelector('.bj-go'); if (go) go.disabled = !v.amt;
}
function amtSet(n) {
  const s = v.ctx.state(), have = (s.hang.bj.chips[v.ctx.me] ?? 0);
  v.amt = Math.max(0, Math.min(have, Math.floor(n) || 0)); amtShow();
  const box = v.acts.querySelector('.bj-box'); if (box) box.value = v.amt ? String(v.amt) : '';   // (also while it's being typed in)
}
function amtTyped(e) {
  const box = e.target; if (!box.classList || !box.classList.contains('bj-box')) return;
  const t = box.value.replace(/\D/g, ''); if (t !== box.value) box.value = t;
  const have = (v.ctx.state().hang.bj.chips[v.ctx.me] ?? 0), n = Math.min(have, +t || 0);
  v.amt = n; if (t && +t > have) box.value = String(have);
  const go = v.acts.querySelector('.bj-go'); if (go) go.disabled = !v.amt;
}
/* the timer under the words: the vote, the bets, a turn */
function timer(b, now) {
  const [from, len] = b.st === 'vote' ? [b.t, VOTE] : b.st === 'bet' ? [b.t, BET] : b.st === 'play' ? [b.tt, TURN] : [0, 0];
  return len ? Math.max(0, 1 - (now - from) / len) : 0;
}

/* the cards and bets on the table itself (everyone sees them, seated or not): one drawing over its top */
/* how far out from the middle things lie, in table radii: each one's hand (its total under it), their chips, a bet not
   in a pot; the Butler's hand, toward him */
const HAND = .5, BANK = .87, BET_AT = .24, DEAL = .5, CW = 26, CH = 36, FAN = 15;
const TOP = { l: BJ.cx - BJ.r - 10, t: BJ.cy - BJ.h - BJ.r - 10, w: 2 * BJ.r + 20, h: 2 * BJ.r + 20 };
function tableSVG(s, now) {
  const b = s.hang.bj, cards = shownCards(b, now), turnId = b.st === 'play' ? b.order[b.turn] : null, chips = b.mode === 'chips';
  const ox = TOP.l, oy = TOP.t + BJ.h, X = x => (x - ox).toFixed(1), Y = y => (y - oy).toFixed(1);   // (a point on the top at world (x, y) draws at (x − ox, y − oy) in this box)
  /* a card, big enough to read on the table: its rank over its suit; face down, its back */
  const card = (x, y, c, a = 0) => `<g transform="translate(${X(x)} ${Y(y)}) rotate(${a})"><rect x="${-CW / 2}" y="${-CH / 2}" width="${CW}" height="${CH}" rx="3" fill="${c < 0 ? '#3e6d8c' : '#fbfaf6'}" stroke="#1c1c28" stroke-width="1.5"/>${c < 0
    ? `<rect x="${-CW / 2 + 3}" y="${-CH / 2 + 3}" width="${CW - 6}" height="${CH - 6}" rx="1.5" fill="none" stroke="#e8d9a0" stroke-width="1.2"/>`
    : `<text class="bj-face${red(c) ? ' red' : ''}" y="-5">${RANKS[c % 13]}</text><text class="bj-face${red(c) ? ' red' : ''}" y="10">${SUITS[Math.floor(c / 13)]}</text>`}</g>`;
  const fan = (x, y, list) => list.map((c, i) => card(x + (i - (list.length - 1) / 2) * FAN, y, c, (i - (list.length - 1) / 2) * 3)).join('');
  const stack = (x, y, n, fill) => { let o = ''; for (let i = 0; i < n; i++) o += `<ellipse cx="${X(x)}" cy="${Y(y - i * 3)}" rx="6.5" ry="3.2" fill="${fill}" stroke="#1c1c28" stroke-width="1.1"/>`; return o; };
  const label = (x, y, n, cls = '') => `<text class="bj-count${cls}" x="${X(x)}" y="${Y(y)}">${n}</text>`;
  const betStack = (x, y, bet) => stack(x, y, Math.min(5, Math.ceil(bet / 10)), BETS.includes(bet) ? COLORS[BETS.indexOf(bet)] : GOLD);
  /* the total under a hand (once a card of it shows), green for a win, red for a bust or a loss */
  const under = (x, y, list, r) => list.length ? `<text class="bj-sum${r ? ' r-' + r : ''}" x="${X(x)}" y="${Y(y + CH / 2 + 9)}">${total(list).t}</text>` : '';
  const inPot = b.pvp && ['deal', 'play'].includes(b.st);
  let out = '';
  /* the Butler's hand, in front of him (his hole card face down until he turns it over) */
  if (cards.dealer.length) { const y = BJ.cy - BJ.r * DEAL; out += fan(BJ.cx, y, cards.dealer) + under(BJ.cx, y, cards.dealer); }
  /* a chips game: what each one at the table has, a gold stack and the number by their stool (it counts up or down) */
  if (chips) for (const { id, k } of atTable(s)) {
    if (b.chips[id] === undefined) continue;
    const q = bjSpot(k, BJ.r * BANK), n = shownChips(b, id);
    out += stack(q.x - 9, q.y + 4, Math.max(1, Math.min(4, Math.ceil(n / 50))), GOLD) + label(q.x, q.y + 4, n);
  }
  /* players against each other: the bets lie together in the middle, the pot */
  if (chips && inPot && pot(b)) out += stack(BJ.cx - 12, BJ.cy + 4, Math.min(6, Math.ceil(pot(b) / 25)), GOLD) + label(BJ.cx - 2, BJ.cy + 4, pot(b), ' pot');
  for (const id of b.order) {   // (in front of the stool each one was dealt at: still there if they've got up)
    const h = b.hands[id]; if (!h) continue;
    const q = bjSpot(h.k, BJ.r * HAND), list = cards.hands[id] || [], r = b.st === 'end' && b.res[id] ? b.res[id].r : '';
    if (id === turnId) out += `<ellipse cx="${X(q.x)}" cy="${Y(q.y + 4)}" rx="${CW / 2 + FAN + 6}" ry="${CH / 2 + 14}" fill="#ffd23f" opacity=".35"/>`;
    out += fan(q.x, q.y, list) + under(q.x, q.y, list, r);
    if (chips && b.bets[id] && !inPot && !(b.pvp && b.st === 'end')) { const c = bjSpot(h.k, BJ.r * BET_AT); out += betStack(c.x, c.y, b.bets[id]); }
  }
  /* a bet made before the deal */
  if (chips && b.st === 'bet') for (const { id, k } of atTable(s)) if (b.bets[id] && !b.order.includes(id)) { const c = bjSpot(k, BJ.r * BET_AT); out += betStack(c.x, c.y, b.bets[id]); }
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
  const have = b ? b.chips[v.ctx.me] ?? 0 : 0;
  if (d === 'amt') { amtSet(Math.max(1, v.amt + +btn.dataset.v)); return; }   // (the arrows: one more or one less, never under 1)
  if (d === 'add') { amtSet(v.amt + +btn.dataset.v); return; }   // (a chip adds to the box: 25 twice is 50)
  if (d === 'all') { amtSet(have); return; }
  if (d === 'bet') { if (v.amt) v.ctx.send({ t: 'hang', k: 'bj', do: 'bet', v: v.amt >= have ? 'all' : v.amt }); v.amt = 0; return; }
  if (d === 'butler') { v.ctx.send({ t: 'hang', k: 'bj', do: 'butler', v: +btn.dataset.v }); return; }
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
      <div class="hang-bj-hands"></div><div class="hang-bj-acts"></div>`;
    for (const t of ['pointerdown', 'click', 'wheel', 'touchstart']) el.addEventListener(t, e => e.stopPropagation(), { passive: true });   // (a tap on the window never walks the duck)
    board.append(el);
    const art = document.createElement('div'); art.className = 'hp hang-bj-top'; art.hidden = true;
    Object.assign(art.style, { width: TOP.w + 'px', height: TOP.h + 'px', zIndex: Math.round(BJ.cy) + 11 });   // (just over the table: a duck south of it still in front)
    board.querySelector('.hang-props').append(art);
    v = { ctx, el, art, say: el.querySelector('.hang-bj-say'), chipsEl: el.querySelector('.hang-bj-chips'), hands: el.querySelector('.hang-bj-hands'),
      acts: el.querySelector('.hang-bj-acts'), bar: el.querySelector('.hang-bj-time i'), open: false, amt: 0, sig: '', prev: {}, voted: {}, artSig: '', seen: -1, betsSeen: -1, free: null, disp: {}, from: {} };
    el.querySelector('.hang-book-x').onclick = () => getUp(ctx);
    el.addEventListener('click', press);
    el.addEventListener('input', amtTyped);
    el.addEventListener('keydown', e => { if (e.target.classList.contains('bj-box') && (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {   // (Enter bets; the arrow keys as the arrows)
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Enter') v.acts.querySelector('.bj-go')?.click(); else amtSet(Math.max(1, v.amt + (e.key === 'ArrowUp' ? 1 : -1)));
    } });
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
    countChips(b, dt * 1000);
    const artSig = b.id + '|' + n + '|' + JSON.stringify(b.bets) + '|' + b.st + b.turn + '|' + b.dealer.join() + '|' + JSON.stringify(v.disp) + atTable(s).map(q => q.id).join();
    if (artSig !== v.artSig) { v.artSig = artSig; v.art.innerHTML = tableSVG(s, now); }
    v.seen = n; v.betsSeen = bets;
    if (!v.open) return;
    const sig = JSON.stringify(b) + n + ctx.me + (v.disp[ctx.me] ?? '');
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
