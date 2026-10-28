/* ---------- Justin: a yellow duck in blue jeans and glasses ----------
   His brain, run by the host (npc.js). Home is the porch (the deck, by the rocking chairs); he wanders anywhere, hangs
   round the red jeep, watches TV on the couch, eats a hotdog now and then, and always comes home. Never into the pool:
   near it he says so and walks off. His words go in the chat and his bubble (Comic Sans, on the screens).
   - E on him: the next line of a shuffled playlist (every line once, then shuffled again). Sometimes (15%) he shoots
     that duck 4 seconds later, and it plays dead.
   - On his own: a random line every 45 to 90 seconds (the playlist doesn't move).
   - The rant (about once in 10 minutes): a "shut up" line over and over, then he sprints after the ducks near him
     shooting and shouting "SHUT UP!" until one is dead.
   - Knocked down (a shot, a dagger, a ball, kill @Justin): a death line; half the time he gets up and chases that duck
     until he's shot it. Otherwise he stays down until someone revives him with E.
   - Down for any reason and nobody revives him in 2 minutes: he revives himself, just as if someone had pressed E.
   - Drinking (about once in 8 minutes): he drops; revived with E, he says the drinking line and drinks a glass.
   - The shadow duck (shadowduck.js) can get him, only if they meet up close: revived, he says his four lines 4 seconds
     apart, each bubble up 4 seconds (gone as the next comes), and E can't interrupt them (nor for 4 seconds after).
   - With a gun he keeps his distance: he walks to where his gun reaches and shoots from there. A duck he shoots can't
     move for 6 seconds.
   The lines are mine, word for word: don't change them. */
import { brain, npcAt, randomSpot, nearestOpen, stand, POOL, DOORS } from './npc.js';
import { PROPS, DECK, BJ, inPool } from './layout.js';

export const E_LINES = `Shut up.
Shut up!
SHUT UP!
Shut up, you stupid IDIOT!
GOD, you're so STUPID!
I don't care...
I'M TURNING OFF MY XBOX!
NOOOOOOOO!
I DON'T GIVE A FLIP!
I DON'T GIVE A HECK!
YOU'RE SO STUPID!
WHY DOES NOBODY CARE ABOUT DATA BREACHING!?
I'm an engineer.
I am a civil engineer.
I am... wait for it, a civil engineer.
I could buy your whole family.
I love talking about data breaching.
I hate EVERYTHING!
Why should I care? I'm a civil engineer.
You're just WRONG!
You can think that--but you're still WRONG!
You're such a stupid flipping IDIOT!
What the FLIP!
I am done.
I can't do this anymore.
Why am I here?
I hate it here.
God, you are so flipping stupid.
Do you hear yourself talking right now? Why would you say that?
You're so annoying.
Stop being SO ANNOYING!
Keep telling yourself that.
Why are you telling me this? I am literally an ENGINEER!
E N G I N E E R
I am so rich.
I love money.
Do you like my cabin?
My cabin is CRAP!
I wish my cabin was bigger.
My seventh cabin is SOOO much better!
I love food.
I don't talk to women.
I am scared of women.
Help me talk to women.
I don't understand women.
Why would I talk to a woman?
I am still not plat in Siege! HOW!?
WHY AM I NOT PLAT!?
HOW AM I ONLY GOLD!!!
Yes I am okay, no I am not angry. CAN YOU STOP ASKING ME THAT!!
Why did you ask me that?!
What is wrong with you?
What is your opinion on data breaching?
Let me explain to you why you are WRONG!
I--don't--give--a--FLIIIIIP!
...
I am going to bed.
No.
Just no.
Get some help.
I love motorcycles.
I might be a little autistic.
I accepted I am going to be alone in life.
You're heckin' stupid.
Yes, I know.
Let me explain to you why you are wrong.
You guys are being so stupid.
You still don't understand why I am right.
This is getting ridiculous, let me explain to you.
I make more money than your whole family combined.
Cheez-itz and rice.
Play Realm of the Mad God with me.
Play Siege with me.
I love Echo drones.
I hate flock cameras.
The guy who made this game is so funny, smart, and good looking.
I wish I had more to show besides money and three mansions.
Why am I so funny?
I am so unbelievably BASED!
I couldn't care less.
I am going to rotate.
I'm LITERALLY A CIVIL ENGINEER!
This bit isn't funny, just stop.
?`.split('\n');
export const DEATH_LINES = `WHAT THE FLIP!
What the FLIIIIIP!
STOP!
WHAT!?
NOOOOO!!!
STOP! IT'S NOT FUNNY!!!
STOP! IT'S NOT FUNNY!!! IT'S JUST NOT!
WHYYYY!!?!?!?!
STOOOOOOP!!!!!
I am turning off my Xbox...
I'M TURNING OFF MY XBOX!!!!
This is so STUPID!
You are such a stupid IDIOT!`.split('\n');
export const DRANK = "I drank too much, but I swear it isn't a problem.";
export const POOL_LINE = "Why would I go to the pool?! IT'S JUST WATER! I don't care!";
/* poker (poker.js): my new lines for his winning and losing, word for word, and his old ones that fit them (mostly the
   new ones); busted, he says one of his own insults or rage lines */
export const WIN_LINES = `YES!
YES! YES!
OMG YES!!
I'M SO GOOD AT THIS GAME!
YEESSSS!!!!!!!
HOLY FLIP!!!!!
I'M SO GOOD!
I love life.
HOW AM I SO GOOD!?!
YOU SUCK!!!
YOU ARE SO BAD!!!
HOW ARE YOU THIS BAD AT THE GAME!!!
You are such an IDIOT!!! HAHAHA!!!
Why do you even try?
You can't beat me.
You should give up.
I'm not even trying.
I always win.
HAHA! IDIOT!
Just quit the game at this point, YOU'RE SO BAD!`.split('\n');
export const LOSE_LINES = `HOW DID I LOSE!?!
NOOOOO!!!!!!
WHAT THE FLIIIIIP!!!!!
I CAN'T BELIEVE THIS STUPID GAME!!!
HOW!!?!!?
THIS IS SO STUPID!!!!
AAAAAAHHHHH!!!!!!!
AAHH!!! AHHH!!!! AAAHH!!!!!
I AM GOING TO END IT!!!!
WHAT THE FLIIIIIP!!!!!!! HOW!?!?!?
I CAN'T TAKE THIS STUPID GAME!!!!
One more time... AND I'M TURNING OFF MY XBOX!!!!!
NOOOOOOOOOOO!!!!!!!!
WHYYYY!?!?!!!?!?!?!?!!
Why am I alive.
I am going to end it.
I hate life.
I HATE MY STUPID LIFE!!!
AAHHH!!!! AAHAH!! WHHAAAA!!!!!
AH!!! AH!!! AH!!!! AH!!! AHH!!!!!
I am going to cry.
WHY AM I DOING THIS TO MYSELF!?!!?!?
STAAHHHP!!!!!!!!!
STOP!!!
STOP IT!!!
STOP!!! STOP!!! STOP!!! STOP!!!!
STOP!!! STOP!!! STOP!!! STAAAHHPP!!!!
Get some help.
IT'S NOT FUNNY!!!!
IT'S NOT FUUUUHHHNNNY!!!!!`.split('\n');
const pick = (...ls) => ls.map(l => { if (!E_LINES.includes(l) && !DEATH_LINES.includes(l)) throw new Error('not his line: ' + l); return l; });
export const OLD_WIN = pick('Shut up, you stupid IDIOT!', "GOD, you're so STUPID!", "YOU'RE SO STUPID!", 'I could buy your whole family.', "You're such a stupid flipping IDIOT!", 'Keep telling yourself that.', 'I am so rich.', 'I love money.', "You're heckin' stupid.", 'Yes, I know.', 'You guys are being so stupid.', 'I make more money than your whole family combined.', 'Why am I so funny?', 'I am so unbelievably BASED!');
export const OLD_LOSE = pick("I'M TURNING OFF MY XBOX!", 'NOOOOOOOO!', 'NOOOOO!!!', 'I DON\'T GIVE A FLIP!', 'I hate EVERYTHING!', 'What the FLIP!', 'I am done.', "I can't do this anymore.", 'Why am I here?', 'I hate it here.', 'I--don\'t--give--a--FLIIIIIP!', '...', "I couldn't care less.", 'WHYYYY!!?!?!?!', 'STOOOOOOP!!!!!', 'I am turning off my Xbox...', 'This is so STUPID!');
export const BUST_LINES = pick('SHUT UP!', 'Shut up, you stupid IDIOT!', "GOD, you're so STUPID!", "YOU'RE SO STUPID!", "You're such a stupid flipping IDIOT!", 'God, you are so flipping stupid.', "I'M TURNING OFF MY XBOX!", 'I hate EVERYTHING!', 'I am done.', 'I--don\'t--give--a--FLIIIIIP!', "I'M TURNING OFF MY XBOX!!!!", 'This is so STUPID!', 'You are such a stupid IDIOT!');
export const SHADOW_LINES = ['I literally got killed by a black duck!', 'WAIT!', 'HE WAS LITERALLY BLACK!', 'NOT RACIALLY OF COURSE!'];
const SHUT_UPS = E_LINES.filter(l => /^shut up/i.test(l));
const RANT_SHOUT = 'SHUT UP!';

const WALK = 300, SPRINT = 620;
const SHOOT_ODDS = .15, SHOOT_AFTER = 4000;           // E, then 4 seconds later, sometimes a shot
const SAY_EVERY = [45, 90], RANT_EVERY = [840, 1560], DRINK_EVERY = [360, 600], HOTDOG_EVERY = [120, 240];   // seconds
const RANGE = 360, AIM = 1100, KEEP = 260;            // how far his gun reaches; between his shots (ms); how far off he stays
const LINE = 4000, HEARD = 5000;   // each shadow line: shown this long, and the next one this long after (never two bubbles at once); E on him: he stays still at least this long
const sec = (rand, [a, b]) => (a + rand() * (b - a)) * 1000;
/* home: the porch, by the rocking chairs; the jeep; the couches (TV) */
const HOME = (() => { const r = PROPS.filter(p => p.kind === 'rocker'); return r.length ? [Math.round((r[0].x + r[r.length - 1].x) / 2 + 40), Math.round(r[0].y + r[0].d + 70)] : [Math.round((DECK.x0 + DECK.x1) / 2), Math.round((DECK.y0 + DECK.y1) / 2)]; })();
const JEEP = PROPS.find(p => p.kind === 'jeep');
const COUCHES = PROPS.filter(p => p.kind === 'couch');
const poolNear = (x, y, r) => x > POOL.x0 - r && x < POOL.x1 + r && y > POOL.y0 - r && y < POOL.y1 + r;
const DRY = { dry: true };
let mm = null;   // what he's up to (the host's own notes)
export const resetJustin = () => { mm = null; };
const shuffle = (rand, a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function notes(c) {
  if (!mm) mm = { mode: 'home', next: c.now + 4000, say: c.now + sec(c.rand, SAY_EVERY), rant: c.now + sec(c.rand, RANT_EVERY), drink: c.now + sec(c.rand, DRINK_EVERY), hotdog: c.now + sec(c.rand, HOTDOG_EVERY), list: [], pool: 0, shots: [], lock: 0, lines: [] };
  return mm;
}
/* the next line of the playlist (shuffled again once it's all been said) */
function nextLine(c) { if (!mm.list.length) mm.list = shuffle(c.rand, E_LINES.map((_, i) => i)); return E_LINES[mm.list.shift()]; }
const down = (me, c, cause) => { c.stop(me); me.a = 'dead'; mm.mode = 'dead'; mm.cause = cause; mm.target = null; mm.downAt = c.now; };
const SELF_REVIVE = 120000;   // nobody revived him: up by himself after 2 minutes
/* up again (E on him, or by himself): the drinking line and a glass, or the shadow duck's lines */
function revive(me, c) {
  me.a = ''; mm.mode = 'home'; mm.next = c.now + 3000;
  if (mm.cause === 'drink') { c.say('justin', DRANK); me.a = 'drink'; mm.mode = 'drinking'; mm.until = c.now + 3500; }
  else if (mm.cause === 'shadow') { mm.lines = [...SHADOW_LINES]; mm.lineAt = c.now; mm.lock = Infinity; }
}
const pickSpot = c => {
  const r = c.rand();
  if (r < .25 && JEEP) return nearestOpen(JEEP.x + JEEP.w / 2 + (c.rand() - .5) * 300, JEEP.y + JEEP.d + 60 + c.rand() * 80, DRY, 6);
  return randomSpot(c.rand, (x, y) => !poolNear(x, y, 300), DRY);
};
/* chasing someone with the gun: he sprints, and shoots when they're close enough */
function chase(me, c, at, shout) {
  const d = c.ducks.find(q => q.id === mm.target);
  if (!d || d.dead) {   // got them (or they left): a rant ends at the first dead duck
    if (mm.mode === 'rant' && d && d.dead) { mm.mode = 'home'; mm.next = c.now + 3000; mm.target = null; c.stop(me); return true; }
    const n = c.ducks.filter(q => !q.dead).sort((a, b) => c.dist(at, a) - c.dist(at, b))[0];
    if (mm.mode === 'rant' && n && c.dist(at, n) < 1400 && c.now < mm.until) { mm.target = n.id; return false; }
    mm.mode = 'home'; mm.next = c.now + 2000; mm.target = null; return false;
  }
  if (c.now > mm.until) { mm.mode = 'home'; mm.next = c.now + 2000; mm.target = null; return false; }
  let ch = false;
  if (shout && c.now > (mm.shout || 0)) { mm.shout = c.now + 1500; c.say('justin', RANT_SHOUT); ch = true; }
  const dist = c.dist(at, d);
  if (dist < RANGE && c.now > (mm.aim || 0)) {
    mm.aim = c.now + AIM; me.f = d.x > at.x ? 1 : -1;
    if (c.rand() < .6) c.kill('justin', d.id, 'gun'); else c.fx('justin', d.id, 'miss');
    ch = true;
  }
  /* never up close: to where his gun reaches, then he stands and shoots */
  if (dist < RANGE * .85) { if (at.moving) { c.stop(me); me.a = 'gun'; ch = true; } }
  else if (c.now > (mm.chase || 0)) {
    mm.chase = c.now + 600; const k = KEEP / dist, to = nearestOpen(d.x + (at.x - d.x) * k, d.y + (at.y - d.y) * k, DRY, 4) || [d.x, d.y];
    if (c.go(me, to[0], to[1], SPRINT, DRY)) { me.a = 'gun'; ch = true; }
  }
  return ch;
}

brain('justin', {
  kind: 'duck', name: 'Justin',
  init: now => ({ w: { p: [HOME], t: now, v: 1 }, a: '', f: -1 }),
  tick(me, c) {
    notes(c); const at = npcAt(me, c.now); if (!at) return false;
    let ch = false;
    /* lines in a row (after the shadow duck got him): one every 4 seconds, nothing interrupts them */
    if (mm.lines.length && c.now >= mm.lineAt) { c.say('justin', mm.lines.shift(), LINE); mm.lineAt = c.now + LINE; if (!mm.lines.length) mm.lock = c.now + LINE; ch = true; }
    /* a shot promised 4 seconds after an E */
    for (const sh of mm.shots.filter(q => c.now >= q.at)) {
      mm.shots = mm.shots.filter(q => q !== sh);
      const d = c.ducks.find(q => q.id === sh.who);
      if (d && !d.dead && mm.mode !== 'dead' && c.dist(at, d) < RANGE * 1.4) { me.f = d.x > at.x ? 1 : -1; me.a = 'gun'; c.kill('justin', d.id, 'gun'); mm.gunDown = c.now + 1500; ch = true; }
    }
    if (mm.mode === 'poker') { if (mm.poker) { c.say('justin', mm.poker); mm.poker = ''; } return ch; }   // (at the poker table: he sits, and says what poker.js gives him)
    if (mm.mode === 'bust') return bust(me, c) || ch;
    if (me.a === 'gun' && mm.mode !== 'chase' && mm.mode !== 'rant' && c.now > (mm.gunDown || 0)) { me.a = ''; ch = true; }
    if (mm.mode === 'dead') {
      if (mm.cause === 'player' && mm.getUp && c.now > mm.getUp) {   // up again, and after them
        mm.getUp = 0; me.a = 'gun'; mm.mode = 'chase'; mm.target = mm.by; mm.until = c.now + 25000; return true;
      }
      if (mm.cause === 'player' && c.now > mm.until) { me.a = ''; mm.mode = 'home'; mm.next = c.now + 2000; return true; }   // (down a while, then up by himself)
      if (c.now - (mm.downAt ?? c.now) >= SELF_REVIVE) { revive(me, c); return true; }
      return ch;
    }
    if (mm.mode === 'drinking') { if (c.now > mm.until) { me.a = ''; mm.mode = 'home'; mm.next = c.now + 2000; return true; } return ch; }
    if (mm.mode === 'chase') return chase(me, c, at, false) || ch;
    if (mm.mode === 'rant') {
      if (mm.shuts > 0) { if (c.now > mm.shutAt) { mm.shuts--; mm.shutAt = c.now + 1300; c.say('justin', mm.shut); return true; } return ch; }
      return chase(me, c, at, true) || ch;
    }
    if (mm.mode === 'shadow') return ch;   // (shadowduck.js moves him)
    if (c.now < (mm.hold || 0)) return ch;   // (someone's talking to him: he stays put)
    /* the pool: never in it */
    if (poolNear(at.x, at.y, 220) || inPool(at.x, at.y)) {
      if (c.now > mm.pool) { mm.pool = c.now + 180000; c.say('justin', POOL_LINE); ch = true; }
      const to = nearestOpen(at.x + (at.x < (POOL.x0 + POOL.x1) / 2 ? -500 : 500), Math.min(at.y, POOL.y0) - 300, DRY, 8);
      if (to && c.go(me, to[0], to[1], WALK, DRY)) { me.a = ''; mm.mode = 'wander'; mm.next = c.now + 3000; return true; }
    }
    /* now and then: a random line, a hotdog, the drinking, the rant */
    if (c.now > mm.say) { mm.say = c.now + sec(c.rand, SAY_EVERY); c.say('justin', E_LINES[Math.floor(c.rand() * E_LINES.length)]); ch = true; }
    if (c.now > mm.drink && !at.moving) { mm.drink = c.now + sec(c.rand, DRINK_EVERY); down(me, c, 'drink'); return true; }
    if (c.now > mm.rant && c.ducks.some(d => !d.dead && c.dist(at, d) < 1000)) {
      mm.rant = c.now + sec(c.rand, RANT_EVERY);
      c.stop(me); me.a = ''; delete me.z; mm.mode = 'rant'; mm.shut = SHUT_UPS[Math.floor(c.rand() * SHUT_UPS.length)]; mm.shuts = 3 + Math.floor(c.rand() * 3); mm.shutAt = c.now;
      const n = c.ducks.filter(q => !q.dead).sort((a, b) => c.dist(at, a) - c.dist(at, b))[0]; mm.target = n && n.id; mm.until = c.now + 40000;
      return true;
    }
    if (c.now > mm.hotdog && !at.moving && me.a !== 'tv') { mm.hotdog = c.now + sec(c.rand, HOTDOG_EVERY); me.a = 'eat'; mm.eatEnd = c.now + 4000; return true; }
    if (me.a === 'eat' && c.now > mm.eatEnd) { me.a = ''; ch = true; }
    if (at.moving || c.now < mm.next || me.a === 'eat') return ch;
    /* where next: home most of the time; the jeep, anywhere, or TV on the couch */
    const home = Math.hypot(at.x - HOME[0], at.y - HOME[1]) < 120;
    if (mm.mode === 'tv') { me.a = ''; delete me.z; }
    if (mm.mode === 'toTv') { const p = mm.couch; me.w = { p: [[Math.round(p.x + p.w / 2 + (c.rand() - .5) * p.w * .5), Math.round(p.y + p.d * .45)]], t: c.now, v: 1 }; me.z = Math.round(p.h * .55); me.a = 'tv'; me.f = 1; mm.mode = 'tv'; mm.next = c.now + 30000 + c.rand() * 40000; return true; }
    if (!home) { if (c.go(me, HOME[0], HOME[1], WALK, DRY)) { me.a = ''; mm.mode = 'home'; mm.next = c.now + 40000 + c.rand() * 80000; return true; } mm.next = c.now + 1000; return ch; }
    const r = c.rand();
    if (r < .2 && COUCHES.length) {
      const p = COUCHES[Math.floor(c.rand() * COUCHES.length)], beside = nearestOpen(p.x + p.w / 2, p.y + p.d + 30, DRY, 6);
      if (beside && c.go(me, beside[0], beside[1], WALK, DRY)) { me.a = ''; mm.mode = 'toTv'; mm.couch = p; mm.next = c.now; return true; }
    }
    const to = pickSpot(c);
    if (to && c.go(me, to[0], to[1], WALK, DRY)) { me.a = ''; mm.mode = 'wander'; mm.next = c.now + 10000 + c.rand() * 30000; return true; }
    mm.next = c.now + 1000; return ch;
  },
  act(me, a, c, by) {
    notes(c);
    if (a.do !== 'talk') return false;
    if (mm.mode === 'dead') { revive(me, c); return true; }   // revived
    if (mm.lines.length || c.now < mm.lock) return false;   // (still saying his piece)
    if (mm.mode === 'rant' || mm.mode === 'chase' || mm.mode === 'bust') return false;
    if (mm.mode === 'poker') { c.say('justin', nextLine(c)); return true; }   // (at the table he stays put, and never shoots)
    const line = nextLine(c); c.say('justin', line); me.f = by.x > (npcAt(me, c.now) || by).x ? 1 : -1;
    /* he stops and listens: at least 5 seconds, longer while his line is up */
    if (mm.mode !== 'tv') { if ((npcAt(me, c.now) || {}).moving) c.stop(me); if (mm.mode === 'toTv') mm.mode = 'wander'; }
    mm.hold = c.now + Math.max(HEARD, 2500 + line.length * 60); mm.next = Math.max(mm.next, mm.hold);
    if (c.rand() < SHOOT_ODDS) mm.shots.push({ who: by.id, at: c.now + SHOOT_AFTER });
    return true;
  },
  hit(me, by, c) {
    notes(c);
    if (mm.mode === 'dead') return false;
    down(me, c, 'player'); mm.by = by; mm.until = c.now + 30000;
    c.say('justin', DEATH_LINES[Math.floor(c.rand() * DEATH_LINES.length)]);
    mm.getUp = c.rand() < .25 ? c.now + 2500 : 0;   // (now and then he gets up and goes after them)
    return true;
  },
});
/* for the shadow duck: is he up and about outside, and get him */
export const justinFree = () => !!mm && !['poker', 'bust', 'dead', 'rant', 'chase', 'shadow', 'shadowChase', 'drinking', 'tv', 'toTv'].includes(mm.mode) && !mm.lines.length;
export function justinGot(me, c) { notes(c); down(me, c, 'shadow'); c.say('justin', DEATH_LINES[Math.floor(c.rand() * DEATH_LINES.length)]); }
export function justinSees(me, c, x, y) { notes(c); if (!justinFree()) return false; mm.mode = 'shadowChase'; return c.go(me, x, y, SPRINT, DRY); }
export { DOORS };

/* ---------- at the poker table (poker.js runs the game; these are its calls, on the host) ----------
   Invited, he teleports onto a free stool (the one farthest from the players) and sits there facing the table; a line
   at each new hand, a winning or losing one at the showdown. Out of chips: he pulls his gun on the richest player, shoots
   (they play dead 6 seconds), says an insult or a rage line and walks off. When the game ends he gets up and goes home. */
const STOOLS = PROPS.filter(p => p.kind === 'stool');
const any = l => l[Math.floor(Math.random() * l.length)];
const recOf = s => s.hang && s.hang.npc && s.hang.npc.justin;
const setRec = (s, fn) => { const r = recOf(s); if (!r) return; const o = { ...r }; fn(o); s.hang.npc = { ...s.hang.npc, justin: o }; };
export const jPoker = {
  /* onto a stool: its number, or -1 (none free, or he isn't here) */
  sit(s, taken, now) {
    if (!recOf(s)) return -1;
    notes({ now, rand: Math.random });
    const gap = k => Math.min(...taken.map(n => Math.min(Math.abs(k - n), 8 - Math.abs(k - n))), 9);
    const p = STOOLS.filter(q => !taken.includes(q.n) && !(s.hang.seats || {})[q.id + ':0']).sort((a, b) => gap(b.n) - gap(a.n))[0];
    if (!p) return -1;
    const x = p.x + p.w / 2, y = p.y + p.d / 2;
    setRec(s, o => { o.w = stand(x, y, now); o.z = p.z + p.h; o.a = 'cards'; o.f = Math.sign(BJ.cx - x) || 1; o.seat = p.id + ':0'; });
    Object.assign(mm, { mode: 'poker', poker: '', target: null, shots: [], lines: [], hold: 0 });
    return p.n;
  },
  /* still in his seat (knocked down, he's out of the game) */
  here: () => !!mm && mm.mode === 'poker',
  /* what he says: 'hand' (a new hand), 'win', 'lose' */
  say(kind) {
    if (!mm || mm.mode !== 'poker') return;
    mm.poker = kind === 'win' ? any(Math.random() < .7 ? WIN_LINES : OLD_WIN) : kind === 'lose' ? any(Math.random() < .7 ? LOSE_LINES : OLD_LOSE) : any(E_LINES);
  },
  /* out of chips: the shot at `who` (a player's id), then off */
  bust(s, who, now) {
    if (!mm || mm.mode !== 'poker') return;
    setRec(s, o => { delete o.seat; o.a = 'gun'; });
    Object.assign(mm, { mode: 'bust', target: who, bustAt: now + 900, step: 0 });
  },
  /* the game is over: up, and home */
  leave(s, now) {
    if (!mm || mm.mode !== 'poker') return;
    setRec(s, o => { delete o.seat; o.a = ''; });
    Object.assign(mm, { mode: 'home', next: now + 1500 });
  },
};
/* busted: the gun out, the shot, his line, then he walks off */
function bust(me, c) {
  if (c.now < mm.bustAt) return false;
  const at = npcAt(me, c.now);
  if (mm.step === 0) {
    const d = c.ducks.find(q => q.id === mm.target);
    if (d && at) { me.f = d.x > at.x ? 1 : -1; me.a = 'gun'; if (!d.dead) c.kill('justin', d.id, 'gun'); }
    Object.assign(mm, { step: 1, bustAt: c.now + 1300 }); return true;
  }
  if (mm.step === 1) { c.say('justin', any(BUST_LINES)); Object.assign(mm, { step: 2, bustAt: c.now + 2500 }); return true; }
  me.a = ''; mm.mode = 'home'; mm.next = c.now; return true;
}
