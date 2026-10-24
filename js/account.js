/* ---------- the Google account: the profile online, and friends ----------
   Signing in (top right) keeps the profile (name, duck, card, settings, notes, jumps, stats) in the account, so it follows
   the player to any device; between devices the newer copy wins. Friends need an account too. In the database:
     users/{uid}            p: the profile (JSON); code: the friend code
     pub/{uid}              what friends see: name, duck, friend code, online now, the online room they are in
     codes/{CODE}           a friend code → its account
     req/{to}/{from}        a friend request;  friends/{a}/{b}: friends, both ways
     inv/{to}/{id}          a friend's invite to their room
   No email and no Google name or picture is stored: friends see the player's own name and duck. Rooms keep their own
   guest sign-in per tab (online.js); this is a second connection. */
import { CONFIG, EMU, sdk, whyNot } from './online.js';
import { profile, onSave, replaceProfile } from './store.js';
import { who } from './who.js';
import { activeRoom } from './net.js';
import { toast } from './ui.js';

const HINT = 'df-signed-in';   // this device was signed in: connect at start
const SYNCED = 'df-acct';      // the account this device's profile last matched
const INVITE_LIFE = 10 * 60000;
export const acct = { uid: null, code: '', ready: false, friends: {}, reqs: {}, invs: {} };   // friends: uid → what they share
const fns = new Set();
export const onAccount = f => { fns.add(f); return () => fns.delete(f); };
const changed = () => fns.forEach(f => f(acct));

let A = null, appP = null, live = [], pubs = new Map(), room = null, pushT = 0, first = true;
function app() {
  return appP || (appP = (async () => {
    const { A: App, U, D } = await sdk();
    const a = App.getApps().find(x => x.name === '[DEFAULT]') || App.initializeApp(CONFIG);
    const auth = U.getAuth(a), db = D.getDatabase(a);
    if (EMU) {
      U.connectAuthEmulator(auth, `http://${EMU}:9099`, { disableWarnings: true }); D.connectDatabaseEmulator(db, EMU, 9000);
      window.__duckTestSignIn = (sub, name) => U.signInWithCredential(auth, U.GoogleAuthProvider.credential(JSON.stringify({ sub, email: `${sub}@test.dev`, email_verified: true, name })));
    }
    A = { U, D, auth, db, ref: p => D.ref(db, p), root: () => D.ref(db) };
    U.onAuthStateChanged(auth, u => { if (u && !u.isAnonymous) begin(u).catch(e => toast(whyNot(e), 6000)); else end(); });
    await auth.authStateReady();
    return A;
  })().catch(e => { appP = null; throw e; }));
}
/* at start: connect only if this device signed in before (guests never load Firebase on the front page) */
export function accountStart() {
  let hint = null; try { hint = localStorage.getItem(HINT); } catch (e) { /* blocked */ }
  if (hint) app().catch(() => {});
}

export async function signIn() {
  try { const { U, auth } = await app(); await U.signInWithPopup(auth, new U.GoogleAuthProvider()); toast('Signed in with Google.'); }
  catch (e) { toast(whyNot(e), 6000); }
}
export async function signOut() {
  if (!A || !acct.uid) return;
  const { D, ref, U, auth } = A, uid = acct.uid;
  try { localStorage.removeItem(HINT); } catch (e) { /* blocked */ }
  await D.update(ref(`pub/${uid}`), { on: null, room: null }).catch(() => {});
  await U.signOut(auth);
  toast('Signed out. This device keeps your profile as a guest.');
}

/* ---------- signed in: the profile, what friends see, friends, requests, invites ---------- */
async function begin(u) {
  if (acct.uid === u.uid) return;
  end();
  const { D, ref } = A, uid = u.uid;
  acct.uid = uid; who.acct = uid; first = true;
  const r = activeRoom(); if (r && r.online) r.send({ t: 'look', look: { acct: uid } });   // the room learns it too (Add friend)
  try { localStorage.setItem(HINT, '1'); } catch (e) { /* blocked */ }
  const v = (await D.get(ref(`users/${uid}`))).val() || {};
  let remote = null; try { remote = v.p && JSON.parse(v.p); } catch (e) { /* unreadable: this device's copy wins */ }
  // a device new to this account takes the account's profile; one already in step keeps whichever copy is newer
  let synced = null; try { synced = localStorage.getItem(SYNCED); localStorage.setItem(SYNCED, uid); } catch (e) { /* blocked */ }
  if (remote && (synced !== uid || (remote.t || 0) > (profile.t || 0))) { replaceProfile(remote); dispatchEvent(new CustomEvent('duck-profile')); }
  else pushNow();
  acct.code = v.code || await makeCode(uid);
  live.push(D.onValue(ref('.info/connected'), s => {
    if (!s.val() || acct.uid !== uid) return;
    D.update(ref(`pub/${uid}`), { on: true, room }).catch(() => {});
    D.onDisconnect(ref(`pub/${uid}/on`)).remove(); D.onDisconnect(ref(`pub/${uid}/room`)).remove();
  }));
  live.push(D.onValue(ref(`friends/${uid}`), s => follow(Object.keys(s.val() || {}))));
  live.push(D.onValue(ref(`req/${uid}`), s => {
    const was = acct.reqs; acct.reqs = s.val() || {};
    if (!first) for (const [id, r] of Object.entries(acct.reqs)) if (!was[id]) dispatchEvent(new CustomEvent('duck-request', { detail: { id, ...r } }));
    changed();
  }));
  live.push(D.onValue(ref(`inv/${uid}`), s => {
    const was = acct.invs, all = s.val() || {}, t = Date.now() - INVITE_LIFE;
    acct.invs = {};
    for (const [id, inv] of Object.entries(all)) {
      if (!inv || !inv.room || (inv.at && inv.at < t)) { D.remove(ref(`inv/${uid}/${id}`)).catch(() => {}); continue; }
      acct.invs[id] = inv;
      if (!was[id]) dispatchEvent(new CustomEvent('duck-invite', { detail: { id, ...inv } }));
    }
    changed();
  }));
  onSave.add(push);
  acct.ready = true; first = false; changed();
}
function end() {
  live.forEach(f => f()); live = [];
  pubs.forEach(f => f()); pubs.clear();
  onSave.delete(push); clearTimeout(pushT);
  Object.assign(acct, { uid: null, code: '', ready: false, friends: {}, reqs: {}, invs: {} });
  who.acct = null; changed();
}

/* the profile goes up a moment after it changes; what friends see goes with it */
function push() { clearTimeout(pushT); pushT = setTimeout(pushNow, 1500); }
function pushNow() {
  if (!acct.uid) return;
  const { D, ref } = A;
  D.update(ref(`users/${acct.uid}`), { p: JSON.stringify(profile) }).catch(e => console.warn('profile', e.code));
  D.update(ref(`pub/${acct.uid}`), { name: profile.name, look: JSON.stringify(profile.duck), code: acct.code || null }).catch(() => {});
}
const WORDS = ['QUACK', 'DUCK', 'POND', 'WADDLE', 'FEATHER', 'BEAK', 'PUDDLE', 'SPLASH', 'DRAKE', 'BREAD', 'RIPPLE', 'NEST'];
async function makeCode(uid) {
  const { D, ref } = A;
  for (let i = 0; i < 8; i++) {
    const code = `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${1000 + Math.floor(Math.random() * 9000)}`;
    try { await D.set(ref(`codes/${code}`), uid); } catch (e) { continue; }   // taken: another one
    await D.update(ref(`users/${uid}`), { code }); await D.update(ref(`pub/${uid}`), { code });
    return code;
  }
  return '';
}
/* each friend's shared part, live */
function follow(ids) {
  const { D, ref } = A;
  for (const [id, off] of pubs) if (!ids.includes(id)) { off(); pubs.delete(id); delete acct.friends[id]; }
  for (const id of ids) {
    if (pubs.has(id)) continue;
    acct.friends[id] = acct.friends[id] || { name: '…' };
    pubs.set(id, D.onValue(ref(`pub/${id}`), s => {
      const v = s.val() || {};
      let look = null; try { look = v.look && JSON.parse(v.look); } catch (e) { /* no duck */ }
      acct.friends[id] = { name: v.name || 'Player', look, on: !!v.on, room: v.room || null, code: v.code || '' };
      changed();
    }, () => {}));
  }
  changed();
}
/* the online room I'm in, for friends to see (a private room's way in only goes out with invites) */
let current = null;
export const myRoom = () => current;
addEventListener('duck-room', e => {
  room = e.detail ? { rid: e.detail.rid, name: e.detail.name || 'A room', open: !!e.detail.open, ...(e.detail.open ? { g: e.detail.g } : {}) } : null;
  current = e.detail;
  if (A && acct.uid) A.D.update(A.ref(`pub/${acct.uid}`), { room }).catch(() => {});
});

/* ---------- friend actions; each resolves with a line to show ---------- */
export async function addByCode(raw) {
  if (!acct.uid) return 'Sign in first.';
  const code = String(raw || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^([A-Z]+)(\d{4})$/, '$1-$2');
  if (!/^[A-Z]+-\d{4}$/.test(code)) return 'A friend code looks like QUACK-4821.';
  const s = await A.D.get(A.ref(`codes/${code}`)).catch(() => null);
  if (!s || !s.exists()) return 'No player has that code.';
  return requestFriend(s.val());
}
export async function requestFriend(uid) {
  if (!acct.uid) return 'Sign in first.';
  if (uid === acct.uid) return 'That one is you.';
  if (acct.friends[uid]) return 'Already friends.';
  if (acct.reqs[uid]) { await accept(uid); return 'Friends now.'; }
  try { await A.D.set(A.ref(`req/${uid}/${acct.uid}`), { name: profile.name, at: A.D.serverTimestamp() }); return 'Friend request sent.'; }
  catch (e) { return whyNot(e); }
}
export const accept = uid => A.D.update(A.root(), { [`friends/${acct.uid}/${uid}`]: true, [`friends/${uid}/${acct.uid}`]: true, [`req/${acct.uid}/${uid}`]: null });
export const decline = uid => A.D.remove(A.ref(`req/${acct.uid}/${uid}`));
export const unfriend = uid => A.D.update(A.root(), { [`friends/${acct.uid}/${uid}`]: null, [`friends/${uid}/${acct.uid}`]: null });
export async function invite(uid) {
  if (!current) return 'Join an online room first.';
  const r = { rid: current.rid, name: current.name || 'A room', g: current.g, open: !!current.open };
  try { await A.D.push(A.ref(`inv/${uid}`), { from: acct.uid, name: profile.name, room: r, at: A.D.serverTimestamp() }); return `Invite sent to ${acct.friends[uid] ? acct.friends[uid].name : 'your friend'}.`; }
  catch (e) { return whyNot(e); }
}
/* a player in a room I could send a friend request to */
export const canAdd = p => !!(acct.uid && p && p.acct && p.acct !== acct.uid && !acct.friends[p.acct]);
export const dropInvite = id => acct.uid && A.D.remove(A.ref(`inv/${acct.uid}/${id}`)).catch(() => {});
