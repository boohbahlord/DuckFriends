/* ---------- the start: settings on the page, the background, the jump counter, the first screen ---------- */
import { applySettings } from './settings.js';
import { backdropSVG } from './art.js';
import { profile } from './store.js';
import { $, toast } from './ui.js';
import { start } from './router.js';
import { showJumps } from './jumps.js';
import './front.js';
import './rooms.js';
import './lobby.js';
import './game.js';

applySettings();

/* the carnival behind the page, redrawn to fit when the window or the theme changes */
let lastBD = '';
const drawShapes = () => {
  const k = [innerWidth, innerHeight, profile.settings.theme].join(); if (k === lastBD) return; lastBD = k;
  $('#shapes').innerHTML = backdropSVG(innerWidth, innerHeight, profile.settings.theme === 'dark');
};
document.addEventListener('settings', drawShapes);
let rsT = null;
addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(drawShapes, 200); });
drawShapes();

/* the jump counter at the bottom middle */
showJumps();

/* ---------- Sign in (top right): accounts come later; online rooms work for guests ---------- */
$('#signin').onclick = () => toast('Online rooms need no account: everyone plays as a guest. Accounts and friends come later.');

start('front');
