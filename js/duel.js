/* ---------- the cloud duel: two ducks share the cloud, and the winner bumps the loser off ----------
   Bicker Brackets puts both contenders' writers on the cloud while a match is voted on; once the votes are in, the
   winner waddles over, bumps the loser (a quack) and the loser tumbles off the cloud and falls through the bottom of the
   screen (a slide-whistle fall), while the winner settles in the middle. Lawyering uses it the same way for its two
   attorneys, and on a hung jury both jump off the cloud together (bothOff).
   The cloud itself comes from duelCloudHTML (brackets.js); knockOff plays the bump on it. */
import { sfx } from './sound.js';

const html = document.documentElement;
/* lord = the duel's .lord element; loser = 0 (left duck) or 1 (right duck); done() runs when it's over */
export function knockOff(lord, loser, done = () => {}) {
  const lose = lord && lord.querySelector(`.duel-duck[data-side="${loser}"]`), win = lord && lord.querySelector(`.duel-duck[data-side="${1 - loser}"]`);
  if (!lose || !win) { done(); return; }
  const settle = () => { lord.classList.add('knocked'); done(); };
  if (html.classList.contains('still') || !lose.animate) { settle(); return; }
  const dir = loser ? 1 : -1, gap = Math.abs(lose.getBoundingClientRect().left - win.getBoundingClientRect().left);
  // the winner waddles over and bumps
  win.firstElementChild.animate([{ transform: 'none' }, { transform: `translateX(${dir * gap * .42}px) rotate(${dir * 8}deg)`, offset: .7 }, { transform: 'none' }],
    { duration: 520, easing: 'ease-in-out' });
  setTimeout(() => {
    sfx.quack();
    // the loser flies off the cloud: a copy of it, fixed to the screen, falls through the bottom
    const r = lose.getBoundingClientRect(), copy = lose.cloneNode(true);
    copy.classList.remove('lord-duck'); copy.classList.add('duel-falling');
    Object.assign(copy.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
    document.body.append(copy); lose.style.visibility = 'hidden';
    const drop = innerHeight - r.top + r.height * 1.5;
    copy.animate([
      { transform: 'none' },
      { transform: `translate(${dir * r.width * .9}px, ${-r.height * .45}px) rotate(${dir * 35}deg)`, offset: .18 },
      { transform: `translate(${dir * r.width * 1.6}px, ${drop}px) rotate(${dir * 280}deg)` },
    ], { duration: 1500, easing: 'cubic-bezier(.35, 0, .7, .4)' }).onfinish = () => copy.remove();
    setTimeout(() => sfx.fall(), 200);
    setTimeout(settle, 360);
  }, 360);
}

/* a falling copy of a duck on the cloud, fixed to the screen: it hops out to its side, then drops through the bottom */
function drop(duck, dir, hop) {
  const r = duck.getBoundingClientRect(), copy = duck.cloneNode(true);
  copy.classList.remove('lord-duck'); copy.classList.add('duel-falling');
  Object.assign(copy.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
  document.body.append(copy); duck.style.visibility = 'hidden';
  const fall = innerHeight - r.top + r.height * 1.5;
  copy.animate([
    { transform: 'none' },
    { transform: `translate(${dir * r.width * .7}px, ${-r.height * hop}px) rotate(${dir * 20}deg)`, offset: .24 },
    { transform: `translate(${dir * r.width * 1.5}px, ${fall}px) rotate(${dir * 260}deg)` },
  ], { duration: 1600, easing: 'cubic-bezier(.35, 0, .7, .4)' }).onfinish = () => copy.remove();
}
/* nobody won: both ducks jump off the cloud together, one to each side */
export function bothOff(lord, done = () => {}) {
  const ducks = [0, 1].map(k => lord && lord.querySelector(`.duel-duck[data-side="${k}"]`));
  const settle = () => { lord.classList.add('knocked'); done(); };
  if (!ducks[0] || !ducks[1]) { done(); return; }
  if (html.classList.contains('still') || !ducks[0].animate) { settle(); return; }
  sfx.quack();
  ducks.forEach((d, k) => drop(d, k ? 1 : -1, .9));
  setTimeout(() => sfx.fall(), 260);
  setTimeout(settle, 400);
}
