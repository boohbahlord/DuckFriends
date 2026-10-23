/* ---------- screens ----------
   One screen at a time (front page, rooms, lobby, game). Each screen is registered with render(arg) → element and may have
   leave() (clean up on any switch), guard() (true while leaving would drop the player out of a room) and exit() (leave the
   room). render may return nothing when it has nothing to show (no room any more); the rooms screen shows instead. The
   browser's back button walks back through the screens; inside a room it asks first. Closing the tab inside a room asks too. */
import { confirmBox } from './ui.js';

const screens = {};
let cur = null, depth = 0, asking = false;
export const register = (name, s) => { screens[name] = s; };
export const current = () => cur;
const guarded = () => !!(cur && screens[cur].guard && screens[cur].guard());

function show(name, arg) {
  if (cur && screens[cur].leave) screens[cur].leave();
  cur = name;
  const root = document.getElementById('app'), node = screens[name].render(arg);
  if (!node && name !== 'rooms') { cur = null; show('rooms'); return; }
  root.replaceChildren(node);
  root.firstElementChild.dataset.screen = name; document.body.dataset.screen = name;
  scrollTo(0, 0);
}

/* go to a screen (one step in the browser's history) */
export function go(name, arg) {
  history.pushState({ screen: name, depth: ++depth }, '');
  show(name, arg);
}
export function start(name) { history.replaceState({ screen: name, depth: 0 }, ''); show(name); }

/* the way out of a room: asks first when a game would be left */
export async function leaveTo(name, question = 'Leave the room?') {
  if (guarded() && !(await confirmBox(question))) return false;
  if (cur && screens[cur].exit) screens[cur].exit();
  go(name); return true;
}

addEventListener('popstate', async e => {
  const to = (e.state && e.state.screen) || 'front';
  if (guarded()) {
    history.pushState({ screen: cur, depth: ++depth }, '');   // stay until the player says yes
    if (asking) return; asking = true;
    const yes = await confirmBox(cur === 'game' ? 'Leave the game in progress?' : 'Leave the room?');
    asking = false;
    if (yes) { if (screens[cur].exit) screens[cur].exit(); go('rooms'); }
    return;
  }
  depth = (e.state && e.state.depth) || 0;
  show(to);
});
addEventListener('beforeunload', e => { if (guarded()) { e.preventDefault(); e.returnValue = ''; } });
