/* ---------- poker at the blackjack table (Texas Hold'em) ----------
   The seated players' start vote at the table (blackjack.js) can pick Poker; then this file runs the table until
   everyone gets up. I asked for it this way: the same round table; each player buys in once with 100 chips, only during
   the first 3 hands, and plays with those chips until the game ends (no more from the house: out of chips, you're out,
   and watch from your stool or get up until the next game); the game ends when one has every chip at the end of a hand,
   or when the hand limit is reached, and the most chips wins; 2 cards each, face down, and 5 shared ones in the middle (3, then 1, then 1); blinds
   before each hand from the two after the dealer; Fold, Check or Call, Raise with the blackjack bet box. Everyone's
   cards lie on the table in front of their stool (mine face up on my screen), so the window shows only what's mine.
   Picking Poker opens the setup first: who deals (the Butler, or we take turns), whether the Butler plays too, whether
   Justin is invited (the table's vote may already have), the blinds, blinds going up, the turn time and a hand limit.
   The first one seated sets it up.
   Each new hand, everyone seated picks Play or Sit out.

   The host runs it in s.hang.pk:
     st     'off' (blackjack's table), 'setup', 'join' (Play or Sit out), 'deal', 'bet', 'show' (the showdown), 'wait'
            ("Waiting for other players": fewer than two can play), 'over' (the game's over: won lists the winners, the
            most chips, all of them on a tie); t
     by     who sets it up; set { deal: 'butler' | 'turns', butler 0 | 1, justin 0 | 1, blinds 1 | 5 (the small blind;
            the big one is twice it), up 0 | 1 (blinds double every 10 hands), time 20 | 40 (s a turn), limit 0 | 10 | 25 }
     chips  { id: n } (the Butler's and Justin's too: 'butler', 'justin'); 0 is out; none (came after the buy-in) watches
     join   { id: 'play' | 'out' } this hand's answers; n the hands dealt so far; dealer the dealer's id
     id     this hand's id; order: its players in stool order; k { id: stool } (-1: the Butler's own stool)
     board  the shared cards turned up so far; round 0 … 3 (before the flop, the flop, the turn, the river)
     p      { id: { s: '' | 'fold' | 'all', bet: this round's, in: the whole hand's, a: what they last did (words) } }
     high   the bet to match this round; min the smallest raise; turn (an index in order) and tt when it began
     show   { id: [2 cards] } the hands turned over at the showdown; res { id: { won: chips, name: their hand } }; best
            the winning 5 cards (they light up)
   A player's 2 cards stay with the host (mem, as blackjack's hole card), never in the room's state, so nobody reads
   another's cards; each player's own pair reaches only them. */
import { rule, activity } from './registry.js';
import { BJ, bjSpot } from './layout.js';
import { atTable, cardHTML, chipSVG, tableCard, amtHTML, amtShow, amtTyped, amtPress, amtKeys, nameOf, BUTLER, GOLD, TOP, GAME, tableFocus, hash, START } from './blackjack.js';
import { seatOf, getUp } from './seats.js';
import { rainbowHTML } from '../art.js';
import { activeRoom } from '../net.js';
import { handouts } from '../secret.js';
import { jPoker } from './justin.js';
import { play as sound } from './sounds.js';

export const JOIN = 12000, SHOW = 6000, OVER = 10000;
const HAND_K = .78, HOLE = .66, ROW_Y = -8, ROW_K = .86, CARD_GAP = 25, POT_Y = 22, BANK_AT = .92, NAMES = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];

/* ---------- the hands ---------- */
const val = c => c % 13 === 0 ? 14 : c % 13 + 1;   // (an ace is high, and low in A-2-3-4-5)
const plural = n => ({ 11: 'Jacks', 12: 'Queens', 13: 'Kings', 14: 'Aces' })[n] || n + 's';
/* the best 5 of these cards: { r: [the kind, then what breaks a tie], name, five } */
export function bestHand(cards) {
  const list = cards.filter(c => c >= 0); let best = null;
  const pick = (from, k, out = [], at = 0) => {
    if (out.length === k) { const h = rate(out); if (!best || cmp(h.r, best.r) > 0) best = h; return; }
    for (let i = at; i < from.length; i++) pick(from, k, [...out, from[i]], i + 1);
  };
  if (list.length >= 5) pick(list, 5); else if (list.length) best = rate(list);
  return best;
}
export const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); return 0; };
function rate(five) {
  const vs = five.map(val).sort((a, b) => b - a), n = {};
  for (const x of vs) n[x] = (n[x] || 0) + 1;
  const groups = Object.entries(n).map(([x, k]) => [k, +x]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const flush = five.length === 5 && five.every(c => Math.floor(c / 13) === Math.floor(five[0] / 13));
  const u = [...new Set(vs)], wheel = u.join() === '14,5,4,3,2', straight = five.length === 5 && u.length === 5 && (vs[0] - vs[4] === 4 || wheel), top = wheel ? 5 : vs[0];
  const of = groups.map(g => g[1]);
  if (straight && flush) return { r: [8, top], name: top === 14 ? 'Royal flush' : 'Straight flush', five };
  if (groups[0][0] === 4) return { r: [7, ...of], name: 'Four ' + plural(of[0]), five };
  if (groups[0][0] === 3 && groups[1] && groups[1][0] === 2) return { r: [6, ...of], name: 'Full house', five };
  if (flush) return { r: [5, ...vs], name: 'Flush', five };
  if (straight) return { r: [4, top], name: 'Straight', five };
  if (groups[0][0] === 3) return { r: [3, ...of], name: 'Three ' + plural(of[0]), five };
  if (groups[0][0] === 2 && groups[1] && groups[1][0] === 2) return { r: [2, ...of], name: 'Two pair', five };
  if (groups[0][0] === 2) return { r: [1, ...of], name: 'Pair of ' + plural(of[0]), five };
  return { r: [0, ...vs], name: NAMES[0], five };
}

/* ---------- the rules (the host) ---------- */
export const fresh = () => ({ st: 'off', t: 0, by: '', set: { deal: 'butler', butler: 0, justin: 0, blinds: 1, up: 0, time: 20, limit: 0 }, chips: {}, join: {}, n: 0, dealer: '', won: [],
  id: '', order: [], k: {}, board: [], round: 0, p: {}, high: 0, min: 0, turn: -1, tt: 0, show: {}, res: {}, best: [] });
const clone = o => JSON.parse(JSON.stringify(o));
const SETS = { deal: ['butler', 'turns'], butler: [0, 1], justin: [0, 1], blinds: [1, 5], up: [0, 1], time: [20, 40], limit: [0, 10, 25] };
export const BUYIN = 3;
/* can one still buy in: during the first 3 hands (up to the third one's Play or Sit out) */
const buyIn = pk => pk.n < BUYIN - 1 || (pk.n === BUYIN - 1 && ['setup', 'wait', 'join'].includes(pk.st));
/* who's still in the game (has chips; the Butler while he plays), and who can play the next hand (and is at the table) */
const holders = pk => Object.keys(pk.chips).filter(id => pk.chips[id] > 0 && (id !== 'butler' || pk.set.butler));
const ready = (s, pk) => [...atTable(s).map(q => q.id), ...(pk.set.butler ? ['butler'] : []), ...(pk.k.justin !== undefined ? ['justin'] : [])].filter(id => (pk.chips[id] ?? 0) > 0);
export const blindNow = pk => pk.set.blinds * (pk.set.up ? 2 ** Math.floor(pk.n / 10) : 1);   // (the small blind; the big one is twice it)
/* the host's deck and everyone's two cards for the hand it's dealing */
let mem = { id: '', deck: [], holes: {} };
function shuffled() {
  const d = []; for (let c = 0; c < 52; c++) d.push(c);
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
const computer = id => id === 'butler' || id === 'justin';
/* poker picked in the table's vote (blackjack.js): the setup; everyone buys in with the same 100 (justin: the vote
   invited him) */
export function start(s, seated, now, justin = false) {
  const pk = fresh(), person = seated.find(q => s.players[q.id] && !s.players[q.id].bot); Object.assign(pk, { st: 'setup', t: now, by: (person || seated[0]).id });   // (a person sets it up, not a computer)
  pk.set.butler = seated.length === 1 ? 1 : 0;   // (alone: the Butler plays, unless they turn him off)
  pk.set.justin = justin ? 1 : 0;
  for (const { id } of seated) pk.chips[id] = START;
  s.hang.pk = pk;
}
/* the next hand: everyone seated with chips picks Play or Sit out ("Waiting for other players" when fewer than two can
   play); the game's over when one has every chip */
function toJoin(s, pk, now) {
  Object.assign(pk, { st: 'join', t: now, order: [], p: {}, board: [], show: {}, res: {}, best: [], turn: -1, high: 0, round: 0, join: {} });
  if (buyIn(pk)) for (const id of [...atTable(s).map(q => q.id), ...(pk.set.butler ? ['butler'] : [])]) if (pk.chips[id] === undefined) pk.chips[id] = START;
  if (pk.n && holders(pk).length < 2) return over(pk, now);
  if (ready(s, pk).length < 2) Object.assign(pk, { st: 'wait', t: now });
}
/* the game's over: the most chips wins (a tie: all of them) */
function over(pk, now) {
  const ids = Object.keys(pk.chips).filter(id => id !== 'butler' || pk.set.butler), top = Math.max(0, ...ids.map(id => pk.chips[id]));
  Object.assign(pk, { st: 'over', t: now, won: top > 0 ? ids.filter(id => pk.chips[id] === top) : [], order: [], p: {}, board: [], show: {}, res: {}, best: [], turn: -1, join: {} });
}
/* one puts chips in (no more than they have: then they're all in) */
function put(pk, id, n) {
  const p = pk.p[id], k = Math.max(0, Math.min(n, pk.chips[id] ?? 0));
  pk.chips[id] -= k; p.bet += k; p.in += k;
  if (!pk.chips[id]) p.s = 'all';
  return k;
}
function deal(s, pk, ids, now) {
  const at = new Map(atTable(s).map(q => [q.id, q.k])), k = id => id === 'butler' ? -1 : id === 'justin' ? pk.k.justin : at.get(id);
  const order = ids.slice().sort((a, b) => k(a) - k(b)), n = order.length;
  const last = order.indexOf(pk.dealer), d = (last + 1) % n, dealer = order[last < 0 ? 0 : d];
  pk.id = Math.random().toString(36).slice(2, 9); pk.order = order; pk.dealer = dealer; pk.p = {}; pk.k = { ...(pk.k.justin !== undefined ? { justin: pk.k.justin } : {}) };
  for (const id of order) { pk.k[id] = k(id); pk.p[id] = { s: '', bet: 0, in: 0, a: '' }; }
  mem = { id: pk.id, deck: shuffled(), holes: {} };
  for (const id of order) mem.holes[id] = [mem.deck.pop(), mem.deck.pop()];
  const di = order.indexOf(dealer), sb = order[n === 2 ? di : (di + 1) % n], bb = order[n === 2 ? (di + 1) % n : (di + 2) % n], small = blindNow(pk);
  pk.p[sb].a = 'Blind ' + put(pk, sb, small); pk.p[bb].a = 'Blind ' + put(pk, bb, 2 * small);
  if (order.includes('justin')) jPoker.say('hand');
  Object.assign(pk, { st: 'deal', t: now, ct: now, round: 0, board: [], high: Math.max(pk.p[sb].bet, pk.p[bb].bet), min: 2 * small, show: {}, res: {}, best: [], turn: order.indexOf(bb) });
}
const live = pk => pk.order.filter(id => pk.p[id].s !== 'fold');
const canAct = pk => live(pk).filter(id => pk.p[id].s !== 'all');
/* the next one to act after index i, or -1 when this round of bets is done */
function nextUp(pk, i) {
  const n = pk.order.length;
  for (let j = 1; j <= n; j++) {
    const id = pk.order[(i + j) % n], p = pk.p[id];
    if (p.s === '' && (!p.acted || p.bet < pk.high)) return (i + j) % n;
  }
  return -1;
}
function advance(s, pk, now) {
  if (live(pk).length === 1) return showdown(pk, now);   // (everyone else folded)
  const t = nextUp(pk, pk.turn);
  if (t >= 0 && !(canAct(pk).length === 1 && pk.p[pk.order[t]].bet >= pk.high)) { pk.turn = t; pk.tt = now; return; }
  /* the round's over: the bets join the pot, the next shared cards go down */
  for (const id of pk.order) Object.assign(pk.p[id], { bet: 0, acted: 0 });
  Object.assign(pk, { high: 0, min: 2 * blindNow(pk), round: pk.round + 1, ct: now });
  if (pk.round > 3) return showdown(pk, now);
  pk.board.push(...mem.deck.splice(-(pk.round === 1 ? 3 : 1)));
  if (canAct(pk).length < 2) { while (pk.board.length < 5) pk.board.push(mem.deck.pop()); return showdown(pk, now); }   // (all in: the rest of the cards, then the showdown)
  for (const id of pk.order) if (pk.p[id].s === '') pk.p[id].a = '';
  pk.turn = nextUp(pk, pk.order.indexOf(pk.dealer)); pk.tt = now;
}
/* the pots (a side pot for each all-in), to the best hands; a tie splits, the odd chip to the first after the dealer */
function showdown(pk, now) {
  const inn = live(pk), c = Object.fromEntries(pk.order.map(id => [id, pk.p[id].in])), hands = {};
  for (const id of inn) hands[id] = bestHand([...mem.holes[id], ...pk.board]);
  const won = Object.fromEntries(pk.order.map(id => [id, 0])), from = pk.order.indexOf(pk.dealer) + 1;
  const seatOrder = [...pk.order.slice(from), ...pk.order.slice(0, from)];
  let prev = 0;
  for (const lvl of [...new Set(Object.values(c))].filter(x => x > 0).sort((a, b) => a - b)) {
    const slice = pk.order.reduce((m, id) => m + Math.min(c[id], lvl) - Math.min(c[id], prev), 0);
    let can = inn.filter(id => c[id] >= lvl); if (!can.length) can = inn;
    const top = can.reduce((m, id) => !m.length || cmp(hands[id].r, hands[m[0]].r) > 0 ? [id] : cmp(hands[id].r, hands[m[0]].r) === 0 ? [...m, id] : m, []);
    const share = Math.floor(slice / top.length); let odd = slice - share * top.length;
    for (const id of seatOrder) if (top.includes(id)) { won[id] += share + (odd > 0 ? 1 : 0); odd--; }
    prev = lvl;
  }
  pk.res = {}; pk.show = {};
  for (const id of pk.order) { pk.chips[id] += won[id]; pk.res[id] = { won: won[id], name: inn.length > 1 && hands[id] ? hands[id].name : '' }; }
  if (inn.length > 1) { for (const id of inn) pk.show[id] = mem.holes[id]; const w = inn.filter(id => won[id] > 0).sort((a, b) => cmp(hands[b].r, hands[a].r))[0]; pk.best = w ? hands[w].five : []; }
  if (pk.res.justin) jPoker.say(pk.res.justin.won > pk.p.justin.in ? 'win' : 'lose');
  Object.assign(pk, { st: 'show', t: now, turn: -1 });
}
/* after the showdown: Justin out of chips shoots the richest player and leaves (he gets no chips from the house) */
function justinAfter(s, pk, now) {
  if (pk.k.justin === undefined || (pk.chips.justin ?? 0) > 0) return;
  const rich = atTable(s).map(q => q.id).sort((a, b) => (pk.chips[b] ?? 0) - (pk.chips[a] ?? 0))[0];
  jPoker.bust(s, rich, now);
  delete pk.k.justin; delete pk.chips.justin;
}
/* what one does on their turn: fold, call (or check), raise by n (or all in) */
function play(s, pk, id, d, v, now) {
  const p = pk.p[id], owe = Math.max(0, pk.high - p.bet), have = pk.chips[id] ?? 0;
  if (d === 'fold') { p.s = 'fold'; p.a = 'Fold'; }
  else if (d === 'call') { const k = put(pk, id, owe); p.a = p.s === 'all' ? 'All in' : owe ? 'Call ' + k : 'Check'; }
  else if (d === 'raise') {
    const by = v === 'all' ? have - owe : Math.floor(+v);
    if (!(by > 0) || owe + by > have || (by < pk.min && owe + by < have)) return false;   // (a raise is at least the last one, unless it's all in)
    put(pk, id, owe + by); if (by >= pk.min) pk.min = by;
    pk.high = Math.max(pk.high, p.bet);
    for (const o of pk.order) if (o !== id) pk.p[o].acted = 0;
    p.a = p.s === 'all' ? 'All in' : (pk.high > by + owe || owe ? 'Raise ' : 'Bet ') + by;
  } else return false;
  p.acted = 1;
  advance(s, pk, now);
  return true;
}
/* the computers (the Butler, Justin, TEST rooms): a rough strength of their hand, then fold, call or raise (Justin a
   little worse than the rest: he calls a bit too often, so he loses a little more than he wins) */
function strength(cards, board) {
  if (cards.length < 2) return .3;
  if (!board.length) { const [a, b] = cards.map(val).sort((x, y) => y - x), suited = Math.floor(cards[0] / 13) === Math.floor(cards[1] / 13); return a === b ? .5 + a / 30 : (a + b) / 30 + (suited ? .05 : 0) + (a - b === 1 ? .03 : 0); }
  const h = bestHand([...cards, ...board]); return [.15, .42, .62, .74, .8, .85, .92, .97, 1][h.r[0]] + (h.r[1] || 0) / 200;
}
export function brainMove(pk, id, cards, rand = Math.random) {
  const p = pk.p[id], owe = Math.max(0, pk.high - p.bet), have = pk.chips[id] ?? 0, pot = potOf(pk), st = strength(cards, pk.board), r = rand();
  const raise = k => ({ do: 'raise', v: Math.min(have - owe, Math.max(pk.min, Math.round(pot * k))) });
  if (id === 'justin') {   // (only a little bad, as I asked: sensible most hands, small raises, all in only on a strong hand, the odd silly call)
    const big = 2 * blindNow(pk), small = Math.min(have - owe, Math.max(pk.min, Math.round(big * (1 + rand() * 2))));
    const can = small >= pk.min && small <= 3 * big && have > owe + small;
    if (st >= .85 && r < .35 && have > owe) return { do: 'raise', v: 'all' };
    if (can && ((st > .7 && r < .4) || r < .05)) return { do: 'raise', v: small };
    if (!owe || st > owe / (pot + owe) + .05) return { do: 'call' };
    return { do: r < .15 && owe <= have * .3 ? 'call' : 'fold' };
  }
  if (st > .78 && r < .6 && have > owe + pk.min) return raise(.5);
  if (r < .07 && have > owe + pk.min) return raise(.4);   // (a bluff)
  if (!owe || st > owe / (pot + owe) + .15) return { do: 'call' };
  return { do: 'fold' };
}
/* a TEST room's computer (bots.js) at the poker table */
export function pkBot(s, id, now) {
  const pk = (s.hang || {}).pk; if (!pk) return [];
  const think = 900 + hash(id + pk.st + pk.id + pk.turn + pk.round) % 1600, A = o => [{ t: 'hang', k: 'pk', id, ...o }];
  if (pk.st === 'setup' && pk.by === id && now - pk.t > think) return A({ do: 'start' });   // (a computer left setting it up: the defaults)
  if (pk.st === 'join' && pk.chips[id] > 0 && !pk.join[id] && now - pk.t > think) return A({ do: 'join', v: hash(id + pk.n) % 7 ? 'play' : 'out' });
  if (pk.st === 'bet' && pk.order[pk.turn] === id && now - pk.tt > think) return A(brainMove(pk, id, holesOf(pk, id)));
  return [];
}
/* one's two cards: the host's deck, or (online) what the host locked for me */
function holesOf(pk, id) {
  if (mem.id === pk.id && mem.holes[id]) return mem.holes[id];
  const R = activeRoom(); if (!R || R.me !== id || !R.secretCard) return [];
  const c = R.secretCard(R.state); return c && c.pk === pk.id ? c.c : [];
}
export const myCards = (pk, me) => pk.show[me] || holesOf(pk, me);
handouts.add(s => { const pk = s.hang && s.hang.pk; return pk && pk.id && mem.id === pk.id && ['deal', 'bet'].includes(pk.st) ? { sig: pk.id, items: Object.fromEntries(Object.entries(mem.holes).map(([id, c]) => [id, { pk: pk.id, c }])) } : null; });

rule('pk', {
  init: () => ({ pk: fresh() }),
  /* { t: 'hang', k: 'pk', do: 'set' | 'start' | 'join' | 'fold' | 'call' | 'raise', … } */
  act(s, a, now) {
    const pk0 = s.hang.pk; if (!pk0 || pk0.st === 'off') return false;
    const pk = clone(pk0), id = a.id; if (!atTable(s).some(q => q.id === id)) return false;
    if (a.do === 'set') {
      const opts = SETS[a.key], val = opts && opts.find(o => String(o) === String(a.v));
      if (val === undefined || !(pk.st === 'setup' && pk.by === id || pk.st === 'wait' && a.key === 'butler' && (buyIn(pk) || pk.chips.butler > 0))) return false;
      pk.set[a.key] = val;
      if (pk.st === 'wait' && val) toJoin(s, pk, now);
    } else if (a.do === 'start') {
      if (pk.st !== 'setup' || pk.by !== id) return false;
      if (pk.set.justin) { const k = jPoker.sit(s, atTable(s).map(q => q.k), now); if (k >= 0) { pk.k.justin = k; pk.chips.justin = START; } }
      toJoin(s, pk, now);
    } else if (a.do === 'join') {
      if (pk.st !== 'join' || !['play', 'out'].includes(a.v) || !(pk.chips[id] > 0)) return false;   // (out of chips, or came after the buy-in: watching)
      pk.join[id] = a.v;
    } else if (['fold', 'call', 'raise'].includes(a.do)) {
      if (pk.st !== 'bet' || pk.order[pk.turn] !== id || pk.p[id].s || mem.id !== pk.id) return false;   // (the deck is the host's)
      if (!play(s, pk, id, a.do, a.v, now)) return false;
    } else return false;
    s.hang.pk = pk; return true;
  },
  tick(s, now) {
    if (!s.hang.pk) { s.hang.pk = fresh(); return true; }
    const pk0 = s.hang.pk; if (pk0.st === 'off') return false;
    const pk = clone(pk0), at = atTable(s), here = new Set(at.map(q => q.id));
    if (!at.length) { jPoker.leave(s, now); s.hang.pk = fresh(); return true; }   // everyone got up: the game is over
    if (buyIn(pk)) for (const { id } of at) if (pk.chips[id] === undefined) pk.chips[id] = START;   // (sat down in time to buy in)
    if (pk.id && mem.id !== pk.id && ['deal', 'bet'].includes(pk.st)) {   // (a new host: the cards went with the old one, so the bets go back and the hand starts again)
      for (const id of pk.order) pk.chips[id] = (pk.chips[id] ?? 0) + (pk.p[id] ? pk.p[id].in : 0);
      toJoin(s, pk, now);
    }
    if (pk.k.justin !== undefined && !jPoker.here()) {   // (Justin knocked down at the table: he's out, his chips with him)
      delete pk.k.justin; delete pk.chips.justin;
      if (pk.p.justin && pk.p.justin.s === '' && pk.st === 'bet') { pk.p.justin.s = 'fold'; pk.p.justin.a = 'Fold'; if (pk.order[pk.turn] === 'justin') advance(s, pk, now); }
    }
    switch (pk.st) {
      case 'setup': if (!here.has(pk.by)) pk.by = at[0].id; break;
      case 'wait': if (ready(s, pk).length > 1 || (pk.n && holders(pk).length < 2)) toJoin(s, pk, now); break;
      case 'join': {
        const asked = at.filter(q => pk.chips[q.id] > 0 && !pk.join[q.id]);
        if (asked.length && now - pk.t < JOIN) break;
        const ids = ready(s, pk).filter(id => computer(id) || pk.join[id] === 'play');
        if (ids.length < 2) { toJoin(s, pk, now); break; }   // (not enough playing: ask again)
        deal(s, pk, ids, now); break;
      }
      case 'deal': if (now - pk.t >= 360 * 2 * pk.order.length) { pk.st = 'bet'; pk.turn = nextUp(pk, pk.turn); pk.tt = now; if (pk.turn < 0) { pk.turn = pk.order.length - 1; advance(s, pk, now); } } break;
      case 'bet': {
        for (const id of pk.order) if (!computer(id) && !here.has(id) && pk.p[id].s === '' && pk.order[pk.turn] !== id) { pk.p[id].s = 'fold'; pk.p[id].a = 'Fold'; }   // (got up: folded)
        const id = pk.order[pk.turn]; if (!id) break;
        if (computer(id)) { if (now - pk.tt > 1100 + hash(pk.id + pk.turn + pk.round) % 1400) { const m = brainMove(pk, id, mem.holes[id] || []); if (!play(s, pk, id, m.do, m.v, now)) play(s, pk, id, 'call', 0, now); } break; }
        if (!here.has(id) || now - pk.tt >= pk.set.time * 1000) play(s, pk, id, pk.high > pk.p[id].bet ? 'fold' : 'call', 0, now);   // (got up, or out of time: check, else fold)
        break;
      }
      case 'show': if (now - pk.t >= SHOW) { justinAfter(s, pk, now); pk.n++; if (pk.set.limit && pk.n >= pk.set.limit) over(pk, now); else toJoin(s, pk, now); } break;
      case 'over': if (now - pk.t >= OVER) { jPoker.leave(s, now); Object.assign(pk, fresh()); } break;
    }
    if (JSON.stringify(pk) === JSON.stringify(pk0)) return false;
    s.hang.pk = pk; return true;
  },
  /* someone left the room: their chips go with them (in a hand, they've folded) */
  left(s, id) {
    const pk0 = s.hang.pk; if (!pk0) return;
    const pk = clone(pk0); delete pk.chips[id]; delete pk.join[id];
    if (pk.p[id] && pk.p[id].s === '') { pk.p[id].s = 'fold'; pk.p[id].a = 'Fold'; }
    s.hang.pk = pk;
  },
});

/* ---------- on the screen: the window, and the table ---------- */
let v = null;   // { ctx, el, …parts, open, amt (the raise), sig }
const on = s => { const pk = s.hang && s.hang.pk; return !!pk && pk.st !== 'off'; };
const seated = s => { const q = seatOf(s, v && v.ctx.me); return q && q.p.kind === 'stool' ? q : null; };
const who = (s, id) => id === 'butler' ? BUTLER : id === 'justin' ? 'Justin' : nameOf(s, id);
const toCall = (pk, id) => Math.max(0, pk.high - ((pk.p[id] || {}).bet || 0));
const potOf = pk => Object.values(pk.p).reduce((m, q) => m + (q.in || 0), 0);
const seg = (key, opts, cur, edit) => `<div class="pkr-seg" role="group">${opts.map(([val, label]) => `<button type="button" class="btn small${String(cur) === String(val) ? ' on' : ''}" data-do="set" data-k="${key}" data-v="${val}"${edit ? '' : ' disabled'}>${label}</button>`).join('')}</div>`;

function render(s, now) {
  const pk = s.hang.pk, me = v.ctx.me, p = pk.p[me], inHand = pk.order.includes(me), turnId = pk.st === 'bet' ? pk.order[pk.turn] : null;
  let say = '', body = '', acts = '';
  if (pk.st === 'setup') {
    const edit = pk.by === me, many = atTable(s).length > 1, x = pk.set;
    say = edit ? 'Set up the game' : `${who(s, pk.by)} sets it up`;
    body = `<div class="pkr-setup">`
      + (many ? `<span>Who deals</span>${seg('deal', [['butler', BUTLER], ['turns', 'We take turns']], x.deal, edit)}` : '')
      + `<span>${BUTLER} plays</span>${seg('butler', [[1, 'Yes'], [0, 'No']], x.butler, edit)}`
      + `<span>Invite Justin</span>${seg('justin', [[1, 'Yes'], [0, 'No']], x.justin, edit)}`
      + `<span>Blinds</span>${seg('blinds', [[1, '1 / 2'], [5, '5 / 10']], x.blinds, edit)}`
      + `<span>Blinds go up</span>${seg('up', [[0, 'Off'], [1, 'Every 10 hands']], x.up, edit)}`
      + `<span>Turn time</span>${seg('time', [[20, '20 s'], [40, '40 s']], x.time, edit)}`
      + `<span>Hands</span>${seg('limit', [[0, 'No limit'], [10, '10'], [25, '25']], x.limit, edit)}</div>`;
    acts = edit ? `<button type="button" class="btn green" data-do="start">Start</button>` : '';
  } else if (pk.st === 'wait') {
    say = 'Waiting for other players';
    if (!pk.set.butler && (buyIn(pk) || pk.chips.butler > 0)) acts = `<button type="button" class="btn yellow" data-do="set" data-k="butler" data-v="1">Play the Butler</button>`;
  } else if (pk.st === 'join') {
    const a = pk.join[me], small = blindNow(pk), mine = pk.chips[me];
    say = mine === 0 ? "You're out · watching" : mine === undefined ? 'Watching · join the next game' : a ? (a === 'play' ? 'Playing this hand' : 'Sitting out') : 'New hand';
    if (mine > 0) acts = `<div class="pkr-row"><button type="button" class="btn green${a === 'play' ? ' on' : ''}" data-do="join" data-v="play">Play</button><button type="button" class="btn yellow${a === 'out' ? ' on' : ''}" data-do="join" data-v="out">Sit out</button></div>`;
    body = `<p class="pkr-note">Hand ${pk.n + 1}${pk.set.limit ? ' of ' + pk.set.limit : ''} · Blinds ${small} / ${2 * small}</p>`;
  } else if (pk.st === 'over') {   // (the winner, and everyone's chips, most first)
    const won = pk.won || [], name = id => id === me ? 'You' : who(s, id);
    say = won.length ? `Game over · ${won.map(name).join(' & ')} ${won.length > 1 ? 'tie' : won[0] === me ? 'win' : 'wins'}` : 'Game over';
    const rows = Object.keys(pk.chips).filter(id => id !== 'butler' || pk.set.butler).sort((a, b) => pk.chips[b] - pk.chips[a]);
    body = `<div class="pkr-setup pkr-final">${rows.map(id => `<span>${name(id)}</span><b>${chipSVG(GOLD)}${pk.chips[id]}</b>`).join('')}</div>`;
  } else {
    const cards = myCards(pk, me), h = bestHand([...cards, ...pk.board]), r = pk.res[me], owe = toCall(pk, me), mineTurn = turnId === me;
    if (pk.st === 'show') {
      const won = Object.keys(pk.res).filter(id => pk.res[id].won > 0);
      say = r && r.won > 0 ? `You win ${r.won}` + (won.length > 1 ? ' (split)' : '') : won.length ? `${won.map(id => who(s, id)).join(' & ')} ${won.length > 1 ? 'split it' : 'wins'}` : '';
      if (won.length && pk.res[won[0]].name) say += ` · ${pk.res[won[0]].name}`;
    } else say = !inHand ? (pk.chips[me] === 0 ? "You're out · watching" : pk.chips[me] === undefined ? 'Watching · join the next game' : 'Next hand') : mineTurn ? 'Your turn' : turnId ? `${who(s, turnId)}'s turn` : pk.st === 'deal' ? (pk.set.deal === 'butler' ? BUTLER : who(s, pk.dealer)) + ' deals' : '';
    const stat = (label, val, cls = '') => `<div class="bj-stat${cls}"><span>${label}</span><b>${val}</b></div>`;
    body = inHand ? `<div class="hang-bj-hand mine pkr-mine${mineTurn ? ' turn' : ''}${p && p.s === 'fold' ? ' out' : ''}"><span class="hang-bj-who">You${pk.st === 'show' ? (r && r.won > 0 ? `<span class="pkr-did won">+${r.won}</span>` : '') : p && p.a ? `<span class="pkr-did">${p.a}</span>` : ''}</span><div class="bj-cards">${cards.map(c => cardHTML(c, ' old')).join('') || '<span class="bj-card none"></span>'}</div><span class="pkr-name">${h && cards.length ? h.name : ''}</span></div>`
      + `<div class="bj-stats">${stat('Pot', chipSVG(GOLD) + potOf(pk), ' pot')}${pk.st === 'bet' && p && p.s !== 'fold' ? stat('To call', String(owe)) : ''}</div>` : '';
    if (inHand && pk.st !== 'show') {
      const can = mineTurn && p && !p.s, up = can && raiseMax(pk, me) > 0;
      acts = `<div class="pkr-row"><button type="button" class="btn red" data-do="fold"${can ? '' : ' disabled'}>Fold</button><button type="button" class="btn green" data-do="call"${can ? '' : ' disabled'}>${owe ? 'Call ' + Math.min(owe, pk.chips[me] ?? 0) : 'Check'}</button></div><div class="pkr-row pkr-raise${up ? '' : ' off'}">${amtHTML(pk.high ? 'Raise' : 'Bet', 'yellow')}</div>`;
    }
  }
  v.say.innerHTML = say;
  v.chipsEl.innerHTML = chipSVG(GOLD) + `<b>${pk.chips[me] ?? 0}</b>`; v.chipsEl.hidden = pk.chips[me] === undefined;
  v.body.innerHTML = body;
  if (v.acts.dataset.sig !== acts) { v.acts.dataset.sig = acts; v.acts.innerHTML = acts; }
  for (const b of v.acts.querySelectorAll('.pkr-raise.off button, .pkr-raise.off input')) b.disabled = true;
  const box = v.acts.querySelector('.bj-box'); v.min = pk.min; if (box && pk.st === 'bet') box.placeholder = 'min ' + Math.min(pk.min, raiseMax(pk, me) || pk.min);   // (the smallest raise, so a new player knows)
  amtShow(v);
}
/* the most I can raise by: my chips after calling (more than that is All in) */
const raiseMax = (pk, id) => Math.max(0, (pk.chips[id] ?? 0) - toCall(pk, id));
function timer(pk, now) {
  const [from, len] = pk.st === 'join' ? [pk.t, JOIN] : pk.st === 'bet' ? [pk.tt, pk.set.time * 1000] : [0, 0];
  return len ? Math.max(0, 1 - (now - from) / len) : 0;
}

/* the table: the shared cards in a row (the ones still to come as faint outlines), the pot under them; each one's two
   cards in front of their stool (smaller, face down but mine), what they last did under them, their chips by the
   stool; the dealer's D. At the showdown the hands still in turn over and the winning 5 light up. */
export function pokerSVG(s, now, me) {
  const pk = s.hang.pk, ox = TOP.l, oy = TOP.t + BJ.h, X = x => +(x - ox).toFixed(1), Y = y => +(y - oy).toFixed(1);
  const turnId = pk.st === 'bet' ? pk.order[pk.turn] : null, best = new Set(pk.best || []);
  const text = (x, y, t, cls) => `<text class="${cls}" x="${X(x)}" y="${Y(y)}">${t}</text>`;
  const stack = (x, y, n) => { let o = ''; for (let i = 0; i < n; i++) o += `<ellipse cx="${X(x)}" cy="${Y(y - i * 3)}" rx="6.5" ry="3.2" fill="${GOLD}" stroke="#1c1c28" stroke-width="1.1"/>`; return o; };
  /* where one's words go: under their cards; low at the sides, toward the middle (in) */
  const labelAt = q => { const dy = q.y - BJ.cy; return dy > 20 && dy < 60 ? { x: q.x - Math.sign(q.x - BJ.cx) * 42, y: q.y + 6, in: 1 } : { x: q.x, y: q.y + 21 }; };
  const spot = (id, d) => pk.k[id] === -1 ? { x: BJ.cx, y: BJ.cy - BJ.r * d * .95, a: 0 } : bjSpot(pk.k[id], BJ.r * d);
  let out = '';
  if (pk.st === 'wait') return `<svg class="hg" viewBox="0 0 ${TOP.w} ${TOP.h}" width="${TOP.w}" height="${TOP.h}" overflow="visible" aria-hidden="true">${text(BJ.cx, BJ.cy, 'Waiting for', 'pkr-wait')}${text(BJ.cx, BJ.cy + 18, 'other players', 'pkr-wait')}</svg>`;
  /* the shared cards */
  if (['deal', 'bet', 'show'].includes(pk.st)) for (let i = 0; i < 5; i++) {
    const x = X(BJ.cx + (i - 2) * CARD_GAP), y = Y(BJ.cy + ROW_Y), c = pk.board[i];
    out += c === undefined ? `<rect class="pkr-slot" x="${+(x - 13 * ROW_K).toFixed(1)}" y="${+(y - 18 * ROW_K).toFixed(1)}" width="${26 * ROW_K}" height="${36 * ROW_K}" rx="3"/>` : tableCard(x, y, c, 0, ROW_K, best.has(c) ? 'pkr-best' : '');
  }
  const pot = potOf(pk);
  if (pot && pk.st !== 'show') out += stack(BJ.cx - 13, BJ.cy + POT_Y, Math.min(4, Math.ceil(pot / 20))) + text(BJ.cx - 3, BJ.cy + POT_Y, pot, 'bj-count pot');
  if (pk.st === 'show' && Object.keys(pk.show).length) { const w = pk.order.find(id => pk.res[id] && pk.res[id].won > 0 && pk.res[id].name); if (w) out += text(BJ.cx, BJ.cy + POT_Y, pk.res[w].name, 'pkr-act won pkr-win'); }   // (the winning hand, under the shared cards)
  /* everyone's chips by their stool */
  if (pk.chips.butler !== undefined && pk.set.butler) { const q = { x: BJ.cx, y: BJ.cy - BJ.r * HOLE * .95 }; out += stack(q.x + 27, q.y + 4, Math.max(1, Math.min(4, Math.ceil(pk.chips.butler / 50)))) + text(q.x + 36, q.y + 4, pk.chips.butler, 'bj-count'); }   // (the Butler's, beside his cards)
  for (const { id, k } of [...atTable(s), ...(pk.k.justin !== undefined ? [{ id: 'justin', k: pk.k.justin }] : [])]) if (pk.chips[id] !== undefined) { const h = bjSpot(k, BJ.r * HOLE), low = h.y - BJ.cy > 60, q = low ? { x: h.x + Math.sign(h.x - BJ.cx) * 30, y: h.y - 4 } : bjSpot(k, BJ.r * BANK_AT), l = q.x < BJ.cx - 20; out += stack(q.x + (l ? 9 : -9), q.y + 4, Math.max(1, Math.min(4, Math.ceil(pk.chips[id] / 50)))) + text(q.x, q.y + 4, pk.chips[id], 'bj-count' + (l ? ' end' : '')); }   // (by the rim; at the near side, beside the cards; on the left, the count reads toward the stool)
  /* each hand */
  for (const id of pk.order) {
    const q = spot(id, HOLE), p = pk.p[id] || {}, r = pk.res[id], shown = pk.show[id] || (id === me ? myCards(pk, me) : null);
    const cls = p.s === 'fold' ? 'pkr-fold' : r && r.won > 0 ? 'pkr-won' : '';
    if (id === turnId) out += `<ellipse cx="${X(q.x)}" cy="${Y(q.y + 4)}" rx="24" ry="26" fill="#ffd23f" opacity=".35"/>`;
    out += `<g class="${cls}">` + [0, 1].map(i => { const c = shown ? shown[i] : -1; return tableCard(X(q.x + (i - .5) * 12), Y(q.y), c ?? -1, (i - .5) * 6, HAND_K, pk.st === 'show' && best.has(c) ? 'pkr-best' : ''); }).join('') + '</g>';
    /* what they did (at the showdown: what they won), under the cards (low at the sides: toward the middle) */
    const word = pk.st === 'show' ? (r && r.won > 0 ? '+' + r.won : '') : p.a || '', w = labelAt(q);
    if (word) out += text(w.x, w.y, word, 'pkr-act' + (r && r.won > 0 ? ' won' : p.s === 'fold' ? ' fold' : ''));
    /* the dealer's D, at the end of that line (away from the middle; for the low side ones, toward it) */
    if (id === pk.dealer && pk.st !== 'show') { const half = word.length * 3 + 11, dir = w.in ? -1 : Math.sign(q.x - BJ.cx) || 1;
      out += `<g transform="translate(${X(w.x + (word ? dir * half : 0))} ${Y(w.y)})"><circle r="7.5" fill="#fbfaf6" stroke="#1c1c28" stroke-width="1.4"/><text class="pkr-d" y=".5">D</text></g>`; }
  }
  return `<svg class="hg" viewBox="0 0 ${TOP.w} ${TOP.h}" width="${TOP.w}" height="${TOP.h}" overflow="visible" aria-hidden="true">${out}</svg>`;
}
GAME.poker = { on, start, bot: pkBot, svg: (s, now, me) => pokerSVG(s, now, me), mine: myCards };

function press(e) {
  const btn = e.target.closest('[data-do]'); if (!btn || btn.disabled || !v) return;
  const d = btn.dataset.do, s = v.ctx.state(), pk = s.hang.pk, have = raiseMax(pk, v.ctx.me), send = o => v.ctx.send({ t: 'hang', k: 'pk', ...o });
  if (amtPress(v, d, btn, have)) return;
  if (d === 'set') send({ do: 'set', key: btn.dataset.k, v: btn.dataset.v });
  else if (d === 'start' || d === 'fold' || d === 'call') send({ do: d });
  else if (d === 'join') send({ do: 'join', v: btn.dataset.v });
  else if (d === 'bet') { const max = raiseMax(pk, v.ctx.me), by = Math.max(v.amt, pk.min); if (v.amt) send({ do: 'raise', v: by >= max ? 'all' : by }); v.amt = 0; }   // (under the smallest raise: the smallest raise)
}
function esc_(e) { if (e.key === 'Escape' && v && v.open && !document.querySelector('.win-back, .ctx')) { e.preventDefault(); e.stopPropagation(); getUp(v.ctx); } }

activity({
  id: 'pk',
  mount(ctx) {
    const el = document.createElement('div');
    el.className = 'hang-bj hang-pk'; el.hidden = true;
    el.innerHTML = `<div class="hang-book-head hang-bj-head"><h3 class="hang-bj-title">${rainbowHTML('Poker', { seed: 9 })}</h3><p class="hang-bj-say" aria-live="polite"></p><span class="hang-bj-chips" hidden></span><button type="button" class="win-x hang-book-x" aria-label="Get up">×</button></div>
      <div class="hang-bj-time"><i></i></div><div class="hang-bj-hands pkr-body"></div><div class="hang-bj-acts pkr-acts"></div>`;
    for (const t of ['pointerdown', 'click', 'wheel', 'touchstart']) el.addEventListener(t, e => e.stopPropagation(), { passive: true });   // (a tap on the window never walks the duck)
    ctx.world.board.append(el);
    v = { ctx, el, say: el.querySelector('.hang-bj-say'), chipsEl: el.querySelector('.hang-bj-chips'), body: el.querySelector('.pkr-body'), acts: el.querySelector('.pkr-acts'), bar: el.querySelector('.hang-bj-time i'), open: false, amt: 0, sig: '', free: null };
    el.querySelector('.hang-book-x').onclick = () => getUp(ctx);
    el.addEventListener('click', press);
    const have = () => raiseMax(v.ctx.state().hang.pk, v.ctx.me);   // (the box holds what I can raise by, no more)
    el.addEventListener('input', e => amtTyped(v, e, have()));
    el.addEventListener('keydown', e => amtKeys(v, e, have()));
    addEventListener('keydown', esc_, true);
  },
  unmount() { if (!v) return; removeEventListener('keydown', esc_, true); v.el.remove(); v = null; },
  focus(ctx) { return v && v.open ? tableFocus(ctx, v) : null; },
  step(dt, now, ctx) {
    if (!v) return;
    const s = ctx.state(), pk = s.hang && s.hang.pk; if (!pk) return;
    const want = on(s) && !!seated(s);
    /* a card sound for each card going down, a chip sound for each bet, near the table */
    const cards = (pk.st === 'deal' ? Math.min(2 * pk.order.length, Math.floor((now - pk.t) / 360) + 1) : pk.id ? 2 * pk.order.length : 0) + pk.board.length, pot = potOf(pk);
    if (v.seen !== undefined && ctx.world.inside) { if (cards > v.seen) sound('card', { x: BJ.cx, y: BJ.cy }); if (pot > v.pot && pk.st !== 'deal') sound('chips', { x: BJ.cx, y: BJ.cy }); }
    v.seen = cards; v.pot = pot;
    if (want !== v.open) { v.open = want; v.el.hidden = !want; v.sig = ''; v.free = null; v.el.classList.toggle('side', ctx.world.vw > ctx.world.vh); }
    if (!v.open) return;
    const sig = JSON.stringify(pk) + ctx.me + myCards(pk, ctx.me).join();
    if (sig !== v.sig) { v.sig = sig; render(s, now); if (v.free && v.el.offsetHeight > v.free.h + 1) v.free = null; }
    const k = timer(pk, now); v.bar.style.transform = `scaleX(${k.toFixed(3)})`; v.bar.parentNode.classList.toggle('off', !k);
  },
});
