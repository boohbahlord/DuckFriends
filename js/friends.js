/* ---------- friends ----------
   Requests, the friends list and invites need sign-in (online play). Until then the window says so. Shift+\ opens it
   outside a game, when not typing. */
import { openWindow, typing, windowOpen } from './ui.js';
import { current } from './router.js';

export function openFriends() {
  return openWindow(`<h2>Friends</h2><p class="dim">Friend requests, your friends list and invites arrive with sign-in.</p>
    <p class="acts"><button type="button" class="btn ghost off" disabled>Sign in</button></p>`, { cls: 'win-small' });
}
addEventListener('keydown', e => {
  if (e.code !== 'Backslash' || !e.shiftKey || typing(e) || windowOpen() || current() === 'game') return;
  e.preventDefault(); openFriends();
});
