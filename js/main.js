/* ---------- the start: settings on the page, the shapes, the click counter, the first screen ---------- */
import { profile, save } from './store.js';
import { applySettings } from './settings.js';
import { shapesSVG } from './art.js';
import { $, toast } from './ui.js';
import { start } from './router.js';
import { fmtClicks } from './format.js';
import { activeRoom } from './net.js';
import './front.js';
import './rooms.js';
import './lobby.js';
import './game.js';

applySettings();

/* the shapes behind the page, redrawn to fit when the window changes size */
const drawShapes = () => { $('#shapes').innerHTML = shapesSVG(innerWidth, innerHeight); };
let rsT = null;
addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(drawShapes, 200); });
drawShapes();

/* ---------- clicks: every click anywhere counts; kept on this device across games ---------- */
const showClicks = () => { $('#clicks').innerHTML = `Clicks <b>${fmtClicks(profile.clicks)}</b>`; };
let roomClicks = 0, clickT = null;   // clicks this game go to the room a moment later, in one message
addEventListener('pointerdown', () => {
  profile.clicks++; showClicks(); save();
  const r = activeRoom(); if (!r) return;
  roomClicks++;
  if (!clickT) clickT = setTimeout(() => {
    clickT = null; const rr = activeRoom(); if (!rr) return;
    rr.send({ t: 'clicks', n: (rr.state.clicks[rr.me] || 0) + roomClicks }); roomClicks = 0;
  }, 1200);
}, true);
document.addEventListener('settings', showClicks);
showClicks();

/* ---------- Sign in (top right): profiles arrive with online play ---------- */
$('#signin').onclick = () => toast('Sign-in arrives with online play.');

start('front');
