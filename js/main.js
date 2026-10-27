/* ---------- the start: settings on the page, the background, the jump counter, the first screen ---------- */
import { applySettings, askConnection } from './settings.js';
import { backdropHTML } from './art.js';
import { profile } from './store.js';
import { $, toast } from './ui.js';
import { start, current } from './router.js';
import { showJumps } from './jumps.js';
import './front.js';
import './rooms.js';
import './lobby.js';
import './game.js';
import './music.js';
import './keynav.js';
import { acct, onAccount, accountStart, signIn } from './account.js';
import { openFriends } from './friends.js';
import { showSplash } from './splash.js';

applySettings();

/* the carnival behind the page, redrawn to fit when the window or the theme changes */
let lastBD = '';
const drawShapes = () => {
  const k = [innerWidth, innerHeight, profile.settings.theme].join(); if (k === lastBD) return; lastBD = k;
  $('#shapes').innerHTML = backdropHTML(innerWidth, innerHeight, profile.settings.theme === 'dark');
};
document.addEventListener('settings', drawShapes);
let rsT = null;
addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(drawShapes, 200); });
drawShapes();

/* the jump counter at the bottom middle */
showJumps();

/* ---------- Sign in (top right); once signed in it opens Friends, with a count of invites and requests ---------- */
const corner = $('#signin');
const paintCorner = () => {
  corner.classList.remove('off');
  if (acct.uid) {
    const n = Object.keys(acct.reqs).length + Object.keys(acct.invs).length;
    corner.innerHTML = `Friends${n ? ` <span class="badge">${n}</span>` : ''}`;
    corner.dataset.tip = 'Friends, your friend code and sign out (Shift+\\)';
  } else {
    corner.textContent = 'Sign in';
    corner.dataset.tip = 'Sign in with Google: your duck, name and settings follow you to any device, and you can have friends.';
  }
};
corner.onclick = () => acct.uid ? openFriends() : signIn();
onAccount(paintCorner); paintCorner();
/* the account's profile came in: show it */
addEventListener('duck-profile', () => {
  applySettings(); showJumps();
  if (['front', 'rooms'].includes(current())) start(current());
  toast('Signed in: your profile is here.');
});

start('front');
showSplash();
setTimeout(accountStart, 300);
setTimeout(askConnection, 600);   // once, on the first visit   // a device that signed in before connects after the first screen is up
