/* ---------- online rooms (Firebase) ----------
   Players sign in as guests (Firebase anonymous sign-in): no account, no email. The host's browser runs the rules, as in a
   TEST room; everyone else sends their actions and gets the state back. In the Realtime Database:
     lobby/{room}            the room list: name, host, players, phase; the game's path only when the room is open
     games/{g}/host          who runs the game; if the host is gone a few seconds, the next player in the party takes over
     games/{g}/s             the state, one JSON string per part (each player, each duck's spot, each chat line apart)
     games/{g}/acts          actions waiting for the host; games/{g}/mv/{player}: the latest step of each duck
     games/{g}/on/{player}   who is connected right now; games/{g}/hb: the host's heartbeat (a sleeping phone stops it)
   Who is the Quack?'s secret word never goes into the state: each player's Secret Card goes in games/{g}/s/cards/{player},
   locked so only that player can open it, and the picker's word comes to the host locked too (secret.js).
   A private room's path is made from its passkey, so only players who know the passkey can find it. The rules that
   enforce all this are in database.rules.json. The Firebase code loads only when online rooms are first used. */
import { reduce, safeReduce, newRoom } from './rules.js';
import { botActions } from './bots.js';
import { NAME_OK, cleanStats } from './store.js';
import { myPlayer, setActive, dropActive } from './net.js';
import { clock, now } from './clock.js';
import { who } from './who.js';
import { go } from './router.js';
import { toast } from './ui.js';
import { ready, keyOk, seal, unseal } from './secret.js';
import { cardOf } from './quackrules.js';

export const CONFIG = {
  apiKey: 'AIzaSyDh4Jx2TnY1PBlPiYnMczqzGhg-4dBFajY',
  authDomain: 'duckfriends-bd795.firebaseapp.com',
  databaseURL: 'https://duckfriends-bd795-default-rtdb.firebaseio.com',
  projectId: 'duckfriends-bd795',
  storageBucket: 'duckfriends-bd795.firebasestorage.app',
  messagingSenderId: '78303550939',
  appId: '1:78303550939:web:880847e1d1799cb1761bfe',
};
const SDK = 'https://www.gstatic.com/firebasejs/13.1.0/';
export const EMU = new URLSearchParams(location.search).get('emu');   // tests: ?emu=127.0.0.1 talks to local emulators
const STALE = 75000;          // a room whose host hasn't checked in for this long is gone
const AWAY = 30000;           // a player away this long leaves the room
const HOST_GONE = 6000;       // the host away this long: the next player takes over
const HOST_STILL = 10000;     // or the host's heartbeat stopped this long (a phone gone to sleep)

/* ---------- connecting: the SDK, a guest sign-in, the server's clock ----------
   Rooms use their own guest sign-in, one per browser tab (two tabs are two players). A Google account (account.js) is a
   second connection that keeps the profile and the friends. */
let sdkP = null;
export const sdk = () => sdkP || (sdkP = Promise.all(['app', 'auth', 'database'].map(m => import(`${SDK}firebase-${m}.js`)))
  .then(([A, U, D]) => ({ A, U, D })).catch(e => { sdkP = null; throw e; }));
let fb = null, connecting = null;
export function connect() {
  return connecting || (connecting = (async () => {
    const { A, U, D } = await sdk();
    const app = A.initializeApp(CONFIG, 'rooms'), db = D.getDatabase(app);
    const auth = U.initializeAuth(app, { persistence: U.browserSessionPersistence });
    if (EMU) { U.connectAuthEmulator(auth, `http://${EMU}:9099`, { disableWarnings: true }); D.connectDatabaseEmulator(db, EMU, 9000); }
    await Promise.all([auth.authStateReady(), ready()]);   // (and my key pair, for Secret Cards)
    if (!auth.currentUser) await U.signInAnonymously(auth);
    D.onValue(D.ref(db, '.info/serverTimeOffset'), s => { clock.offset = s.val() || 0; });
    fb = { D, db, uid: auth.currentUser.uid, ref: p => D.ref(db, p) };
    return fb;
  })().catch(e => { connecting = null; throw e; }));
}
/* what went wrong, in words the player (or the site's owner) can act on */
export function whyNot(e) {
  const c = String((e && (e.code || e.message)) || e);
  if (/popup-closed|cancelled-popup|user-cancelled/i.test(c)) return 'Sign-in was closed before it finished.';
  if (/popup-blocked/i.test(c)) return 'The browser blocked the sign-in window. Allow pop-ups for this site and try again.';
  if (/unauthorized-domain/i.test(c)) return 'This site isn\'t on Firebase\'s list: Authentication → Settings → Authorized domains → add boohbahlord.github.io.';
  if (/operation-not-allowed|admin-restricted/i.test(c)) return 'That sign-in is off in Firebase: Security → Authentication → Sign-in method.';
  if (/permission[_ -]denied/i.test(c)) return 'The database turned this down. Its rules need pasting in Firebase: Realtime Database → Rules → Publish.';
  if (/network|offline|fetch|import|load/i.test(c)) return 'No connection to the online rooms. Check the internet and try again.';
  return 'Online rooms failed: ' + c;
}

/* ---------- the room list ---------- */
export async function watchRooms(fn, fail) {
  const { D, ref } = await connect();
  let last = [];
  const show = () => { const t = now(); fn(last.filter(r => r.at > t - STALE)); };
  const off = D.onValue(ref('lobby'), snap => {
    last = []; const t = now();
    snap.forEach(c => {
      const v = c.val(); if (!v || !v.host) return;
      if (v.at < t - 180000) D.remove(c.ref).catch(() => {});   // long gone: tidy it away
      else last.push({ rid: c.key, ...v });
    });
    last.sort((a, b) => (a.phase === 'lobby' ? 0 : 1) - (b.phase === 'lobby' ? 0 : 1) || b.at - a.at);
    show();
  }, fail);
  const t = setInterval(show, 15000);
  return () => { off(); clearInterval(t); };
}

/* a private room's path: made from the room and its passkey, so the passkey is the way in */
async function privatePath(rid, passkey) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`duckfriends|${rid}|${passkey.trim().toLowerCase()}`));
  return 'p' + [...new Uint8Array(b)].slice(0, 16).map(x => x.toString(16).padStart(2, '0')).join('');
}
const randomId = n => [...crypto.getRandomValues(new Uint8Array(n))].map(x => 'abcdefghijkmnpqrstuvwxyz23456789'[x % 32]).join('');

/* create a room: this device is its host */
export async function createOnlineRoom({ name, open, passkey = '', max, options }) {
  const { D, ref, uid } = await connect();
  const rid = 'r' + randomId(10), g = open ? 'o' + randomId(16) : await privatePath(rid, passkey);
  const state = newRoom({ id: rid, name, host: myPlayer(uid), test: false, open, passkey: '', max, options });
  const enc = encode(state), up = { host: uid, rid, [`on/${uid}`]: true };
  for (const [k, v] of Object.entries(enc)) up['s/' + k] = v;
  await D.update(ref('games/' + g), up);
  return startRoom({ g, rid, name, open, state, host: true, passkey: open ? '' : passkey.trim() });
}

/* join a room from the list (a private one needs its passkey) */
export async function joinOnlineRoom(entry, passkey = '') {
  const { D, ref } = await connect();
  const g = entry.g || await privatePath(entry.rid, passkey);
  const snap = await D.get(ref(`games/${g}/host`)).catch(() => null);
  if (!snap || !snap.exists()) throw new Error(entry.g ? 'That room has closed.' : 'Wrong passkey.');
  const room = startRoom({ g, rid: entry.rid, name: entry.name || '', open: entry.open !== false, state: null, host: false, passkey: passkey.trim() });
  return room.joined();
}

/* ---------- the state in the database: one JSON string per part ---------- */
const EACH = ['players', 'pos', 'cards'];
function encode(s) {
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    if (v === undefined || k === 'hidden') continue;   // (the host's secrets stay with the host)
    if (EACH.includes(k)) for (const [id, x] of Object.entries(v || {})) out[`${k}/${id}`] = JSON.stringify(x);
    else if (k === 'log') for (const line of v) out[`log/n${line.n}`] = JSON.stringify(line);
    else out[k] = JSON.stringify(v);
  }
  return out;
}
function decode(v) {
  if (!v || !v.seat) return null;
  const s = {};
  for (const [k, raw] of Object.entries(v)) {
    if (k === 'ack') continue;
    if (EACH.includes(k)) { s[k] = {}; for (const [id, r] of Object.entries(raw)) s[k][id] = JSON.parse(r); }
    else if (k === 'log') s.log = Object.values(raw).filter(Boolean).map(r => JSON.parse(r)).sort((a, b) => a.n - b.n);
    else s[k] = JSON.parse(raw);
  }
  s.players = s.players || {}; s.pos = s.pos || {}; s.log = s.log || [];
  return s;
}
const keyOf = s => s ? [s.phase, s.round, s.qi].join('|') : '';

/* what a player may send, and only as themselves */
const REMOTE = new Set(['join', 'leave', 'look', 'ready', 'submit', 'draft', 'pick', 'wqWord', 'tieVote', 'usermod', 'groupadd', 'groupdel', 'forgame', 'move', 'end', 'voteReview', 'voteStart', 'voteCast', 'ping', 'idle', 'use', 'fx', 'jumps', 'chat', 'options', 'roomName', 'kick', 'skip', 'start', 'cancel', 'toLobby']);
const LOOK = ['name', 'duck', 'card', 'nameStyle', 'acct', 'net', 'stats', 'pk'];
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o && o[k] !== undefined && o[k] !== null).map(k => [k, o[k]]));
function clean(a, by) {
  if (!a || typeof a !== 'object' || !REMOTE.has(a.t)) return null;
  a = { ...a, id: by };
  if (a.t === 'join') {
    a.p = { duck: {}, card: {}, nameStyle: {}, ...pick(a.p, LOOK), id: by, bot: false };
    if (!NAME_OK.test(a.p.name)) a.p.name = 'Player';
    const acct = a.p.acct; if (typeof acct === 'string' && acct.length < 129) a.p.acct = acct; else delete a.p.acct;
    a.p.net = [0, 1, 2].includes(a.p.net) ? a.p.net : 0;
    a.p.stats = cleanStats(a.p.stats);
    if (!keyOk(a.p.pk)) delete a.p.pk; else a.p.pk = { x: a.p.pk.x, y: a.p.pk.y };
  }
  if (a.t === 'look') {
    a.look = pick(a.look, LOOK);
    if (a.look.name !== undefined && !NAME_OK.test(a.look.name)) delete a.look.name;
    if (a.look.acct !== undefined && !(typeof a.look.acct === 'string' && a.look.acct.length < 129)) delete a.look.acct;
    if (a.look.stats !== undefined) a.look.stats = cleanStats(a.look.stats);
    if (a.look.pk !== undefined) { if (keyOk(a.look.pk)) a.look.pk = { x: a.look.pk.x, y: a.look.pk.y }; else delete a.look.pk; }
  }
  if (a.t === 'wqWord') a = { t: a.t, id: by, word: String(a.word || '').slice(0, 60), cat: String(a.cat || '').slice(0, 60), draft: !!a.draft };
  return a;
}
/* a guess at my own action's result, shown until the host's answer comes back; the host alone ends phases */
function predict(s, a) {
  if (['chat', 'fx', 'join', 'leave'].includes(a.t)) return s;
  let p; try { p = reduce(s, a, now()); } catch (e) { return s; }   // (the host has the last word anyway)
  return keyOf(p) === keyOf(s) ? p : { ...s, done: { ...s.done, [a.id]: true } };
}

/* ---------- a room: host or player, and the switch between them ---------- */
function startRoom({ g, rid, name, open, state: first, host, passkey }) {
  const { D, ref, uid: me } = fb, path = p => ref(`games/${g}/${p}`);
  const fns = new Set(), subs = [];
  let state = first, auth = first, mode = '', closed = false, hostUid = host ? me : null;
  let written = first ? encode(first) : {}, extra = {}, flushT = 0, loop = 0, clientOff = null, hostOffs = [];
  let seq = 0, pending = [], lastMove = null, ackSeen = {}, seen = false, online = new Set(), hostGoneAt = 0, away = {}, beatAt = 0, beatSig = '', taking = false, hb = 0, hbAt = 0;
  let sealed = { sig: '', cards: {} }, myBox = '', myCard = null;   // Who is the Quack?: the Secret Cards I locked (host), mine opened (player)
  const quiet = e => console.warn('DuckFriends online:', e && (e.code || e.message));   // a write turned down (the host role moved on)
  const emit = a => { if (state) fns.forEach(f => f(state, a)); };
  const fail = e => { if (!closed) toast(whyNot(e), 6000); };

  /* the host: applies actions, runs the timers and the computers, writes what changed */
  const apply = a => {
    if (!a) return;
    const next = safeReduce(state, a, now());   // (an action that throws is skipped, so the room keeps going)
    if (next === state) return;
    state = next; emit(a); dirty();
  };
  const dirty = () => { if (!flushT) flushT = setTimeout(flush, 40); };
  /* the host locks each player's Secret Card for them (once a deal) */
  async function cardsFor(s) {
    const w = s.wq, ids = s.hidden && w && w.deal ? w.ids.filter(id => id !== me && s.players[id] && keyOk(s.players[id].pk)) : [];
    const sig = ids.length ? w.deal + ':' + ids.map(id => id + s.players[id].pk.x).join() : '';
    if (sig !== sealed.sig) {
      const cards = {};
      for (const id of ids) { const c = cardOf(s, id); if (c) cards[id] = await seal(s.players[id].pk, c).catch(() => null); }
      sealed = { sig, cards };
    }
    return sealed.cards;
  }
  async function flush() {
    flushT = 0; if (mode !== 'host' || !state) return;
    const cards = await cardsFor(state).catch(() => ({}));
    if (mode !== 'host' || !state) return;
    const enc = encode(state), up = extra; extra = {};
    for (const [id, box] of Object.entries(cards)) if (box) enc['cards/' + id] = JSON.stringify(box);
    for (const [k, v] of Object.entries(enc)) if (written[k] !== v) up['s/' + k] = v;
    for (const k of Object.keys(written)) if (!(k in enc)) up['s/' + k] = null;
    written = enc;
    if (Object.keys(up).length) await D.update(ref('games/' + g), up).catch(quiet);
    if (state.hostId !== me && !closed) {   // the host role moved on: the next player hosts
      await D.remove(ref('lobby/' + rid)).catch(() => {});
      if (state.hostId) await D.set(path('host'), state.hostId).catch(quiet);
      becomeClient();
    }
  }
  const lobbyEntry = () => {
    const h = state.players[me];
    return { host: me, name: String(state.name || 'Room').slice(0, 40), hostName: h ? h.name : '', open: !!state.open, n: state.seat.length, max: state.max, phase: state.phase, at: D.serverTimestamp(), ...(state.open ? { g } : {}) };
  };
  const beat = () => {
    beatAt = now(); beatSig = [state.name, state.seat.length, state.max, state.phase].join('|');
    D.set(ref('lobby/' + rid), lobbyEntry()).catch(quiet);
    D.onDisconnect(ref('lobby/' + rid)).remove();
  };
  function hostTick() {
    const t = now();
    apply({ t: 'tick', id: me });
    for (const a of botActions(state, t)) apply(a);
    for (const id of state.seat) {   // players away too long leave
      if (state.players[id].bot || id === me) continue;
      if (online.has(id)) { delete away[id]; continue; }
      away[id] = away[id] || t;
      if (t - away[id] > (state.players[id].net === 2 ? AWAY * 3 : AWAY)) { delete away[id]; apply({ t: 'leave', id }); }   // more patience with a poor connection
    }
    if (t - beatAt > 30000 || beatSig !== [state.name, state.seat.length, state.max, state.phase].join('|')) beat();
    if (t - hbAt > 2000) { hbAt = t; D.set(path('hb'), D.serverTimestamp()).catch(quiet); }
  }
  async function becomeHost() {
    if (closed || mode === 'host' || taking) return;
    if (!auth) {   // taking over before the state arrived: read it first
      taking = true;
      const snap = await D.get(path('s')).catch(() => null);
      taking = false;
      auth = snap && decode(snap.val()); ackSeen = (snap && snap.val() && snap.val().ack) || {};
      if (!auth || closed || mode === 'host') return;
    }
    if (clientOff) { clientOff(); clientOff = null; }
    mode = 'host'; pending = []; lastMove = null; seen = true;
    written = encode(auth); state = auth;
    if (state.hostId !== me) { state = structuredClone(state); state.hostId = me; }
    hostOffs = [
      D.onChildAdded(path('acts'), snap => {
        const v = snap.val() || {};
        let a = null; try { a = JSON.parse(v.a); } catch (e) { /* not an action */ }
        if (typeof v.by === 'string' && a && a.t === 'wqWord' && typeof a.box === 'string') {   // the secret word, locked for me: opened first
          const p = state.players[v.by];
          if (p && keyOk(p.pk)) unseal(p.pk, a.box).then(o => apply(clean({ t: 'wqWord', word: o.word, cat: o.cat, draft: a.draft }, v.by))).catch(quiet);
          if (v.q) extra['s/ack/' + v.by] = v.q;
        } else if (typeof v.by === 'string') { apply(clean(a, v.by)); if (v.q) extra['s/ack/' + v.by] = v.q; }
        extra['acts/' + snap.key] = null; dirty();
      }, fail),
      ...['onChildAdded', 'onChildChanged'].map(on => D[on](path('mv'), snap => {
        let a = null; try { a = JSON.parse(snap.val()); } catch (e) { /* not a move */ }
        if (a && a.t === 'move' && a.k === keyOf(state)) apply(clean(a, snap.key));
      }, fail)),
    ];
    loop = setInterval(hostTick, 200);
    emit(); dirty(); beat();
  }
  function becomeClient() {
    if (closed || mode === 'client') return;
    if (mode === 'host') { clearInterval(loop); hostOffs.forEach(f => f()); hostOffs = []; }
    mode = 'client';
    clientOff = D.onValue(path('s'), snap => {
      const v = snap.val();
      auth = decode(v); ackSeen = (v && v.ack) || {};
      if (!auth) return;
      if (auth.players[me]) seen = true;
      else if (seen) { gone(auth.banned && auth.banned[me] ? 'You were removed from the room until it goes back to the lobby.' : 'You left the room: the host removed you, or you were away too long.'); return; }
      rebuild();
    }, fail);
  }
  /* the host's state plus my actions it hasn't answered yet */
  function rebuild() {
    let s = auth; if (!s) return;
    const ack = ackSeen[me] || 0;
    pending = pending.filter(p => p.q > ack);
    for (const p of pending) s = predict(s, p.a);
    if (lastMove && lastMove.k === keyOf(s)) { try { s = reduce(s, lastMove, now()); } catch (e) { /* the host's state stands */ } }
    state = s; emit();
    openCard(s);
  }
  /* my Secret Card, locked for me by the host */
  function openCard(s) {
    const box = s.cards && s.cards[me], host = s.players[s.hostId];
    if (!box || box === myBox || !host || !keyOk(host.pk)) return;
    myBox = box;
    unseal(host.pk, box).then(c => { if (myBox === box) { myCard = c; emit(); } }).catch(quiet);
  }
  function gone(msg) {
    if (closed) return;
    room.close(); toast(msg, 6000); go('rooms');
  }

  /* who is here; the host gone a few seconds: the first player still here takes over */
  subs.push(D.onValue(path('on'), snap => { online = new Set(Object.keys(snap.val() || {})); }, fail));
  subs.push(D.onValue(path('hb'), snap => { hb = snap.val() || 0; }, fail));
  subs.push(D.onValue(path('host'), snap => {
    hostUid = snap.val();
    if (hostUid === null && mode === 'client' && seen) { gone('The room has closed.'); return; }
    if (hostUid === me) becomeHost(); else if (hostUid) becomeClient();
  }, fail));
  const watch = setInterval(() => {
    if (mode !== 'client' || !auth || !hostUid) return;
    if (online.has(hostUid) && !(hb && now() - hb > HOST_STILL)) { hostGoneAt = 0; return; }
    hostGoneAt = hostGoneAt || now();
    const can = id => id !== hostUid && !auth.players[id].bot && online.has(id);
    const next = auth.seat.find(id => can(id) && auth.players[id].net !== 2) || auth.seat.find(can);   // a good connection hosts first
    if (now() - hostGoneAt > HOST_GONE && next === me) D.set(path('host'), me).catch(() => { /* someone else took it first */ });
  }, 1000);
  /* my connection: how long a small write takes to reach the server and come back, told to the room when it changes */
  let lastMs = -999, msAt = 0;
  const pinger = setInterval(async () => {
    if (closed || !seen) return;
    const t0 = performance.now();
    try { await D.set(path('on/' + me), true); } catch (e) { return; }
    const ms = Math.round(performance.now() - t0);
    if (Math.abs(ms - lastMs) >= 15 || now() - msAt > 30000) { lastMs = ms; msAt = now(); room.send({ t: 'ping', ms }); }
  }, 5000);
  /* here while connected; a reconnect says so again */
  subs.push(D.onValue(ref('.info/connected'), snap => {
    if (!snap.val() || closed) return;
    D.set(path('on/' + me), true); D.onDisconnect(path('on/' + me)).remove();
    if (mode === 'host') beat();
  }));

  const room = {
    me, online: true, passkey,
    get state() { return state; },
    send(a) {
      if (closed) return;
      a = { ...a, id: me };
      if (mode === 'host') { apply(a); return; }
      if (a.t === 'wqWord') {   // the secret word goes to the host locked
        const host = state && state.players[state.hostId]; if (!host || !keyOk(host.pk)) return;
        seal(host.pk, { word: a.word, cat: a.cat }).then(box => { const q = ++seq; pending.push({ q, a: { t: 'wqWord', id: me, draft: !!a.draft } }); D.push(path('acts'), { by: me, q, a: JSON.stringify({ t: 'wqWord', draft: !!a.draft, box }) }).catch(quiet); }).catch(quiet);
        return;
      }
      if (a.t === 'move') {
        if (!state) return;
        a.k = keyOf(state); lastMove = a;
        D.set(path('mv/' + me), JSON.stringify(a)).catch(quiet);
        let next = state; try { next = reduce(state, a, now()); } catch (e) { /* the host's state stands */ }
        if (next !== state) { state = next; emit(a); }
        return;
      }
      const q = ++seq; pending.push({ q, a });
      D.push(path('acts'), { by: me, q, a: JSON.stringify(a) }).catch(quiet);
      const next = state && predict(state, a); if (next && next !== state) { state = next; emit(a); }
    },
    on(f) { fns.add(f); return () => fns.delete(f); },
    setComputers() { /* computers play in TEST rooms only */ },
    /* my Secret Card for this deal (the host reads it straight from its own state) */
    secretCard(s) { if (s.hidden) return cardOf(s, me); return myCard && s.wq && myCard.deal === s.wq.deal ? myCard : null; },
    /* resolves once the host has seated me */
    joined() {
      return new Promise((ok, no) => {
        const t0 = Date.now();
        room.send({ t: 'join', p: myPlayer(me) });
        const t = setInterval(() => {
          if (closed) { clearInterval(t); no(new Error('Left.')); return; }
          if (seen) { clearInterval(t); ok(room); return; }
          if (Date.now() - t0 > 12000) {
            clearInterval(t); const full = auth && auth.seat.length >= auth.max, out = auth && auth.banned && (auth.banned[me] || (who.acct && auth.banned['acct:' + who.acct]));
            room.close(); no(new Error(out ? 'You were removed from that room until it goes back to the lobby.' : full ? 'That room is full.' : 'The room didn\'t answer. Its host may be away.'));
          }
        }, 150);
      });
    },
    close() {
      if (closed) return;
      const wasHost = mode === 'host';
      if (wasHost) {   // leave the party in my own state, hand the room on (or close it) and stop
        clearTimeout(flushT); flushT = 0;
        const humans = state.seat.filter(id => id !== me && !state.players[id].bot);
        if (!humans.length) { D.remove(ref('games/' + g)).catch(() => {}); D.remove(ref('lobby/' + rid)).catch(() => {}); }
        else {
          if (state.players[me]) state = reduce(state, { t: 'leave', id: me }, now());
          const enc = encode(state), up = { ...extra };
          for (const [k, v] of Object.entries(enc)) if (written[k] !== v) up['s/' + k] = v;
          for (const k of Object.keys(written)) if (!(k in enc)) up['s/' + k] = null;
          D.update(ref('games/' + g), up).then(() => D.remove(ref('lobby/' + rid)))
            .then(() => D.set(path('host'), state.hostId || humans[0])).catch(() => {});
        }
        clearInterval(loop); hostOffs.forEach(f => f());
      }
      closed = true;
      if (clientOff) clientOff();
      subs.forEach(f => f()); clearInterval(watch); clearInterval(pinger);
      D.remove(path('on/' + me)).catch(() => {}); D.onDisconnect(path('on/' + me)).cancel();
      if (wasHost) D.onDisconnect(ref('lobby/' + rid)).cancel();
      fns.clear(); dropActive(room);
      dispatchEvent(new CustomEvent('duck-room', { detail: null }));
    },
  };
  setActive(room);
  if (host) becomeHost(); else becomeClient();
  dispatchEvent(new CustomEvent('duck-room', { detail: { rid, g, name, open } }));
  return room;
}
