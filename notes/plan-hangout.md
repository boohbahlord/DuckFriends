# Plan: Hangout on Duck Cabin

My words are in `notes/agree-or-disagree.md` ("Hangout on Duck Cabin, word for word", and the lines after it).
Read them first, word for word; this file is how we build it. Reference pictures: `notes/ref/hangout/`
(`cabin-sketch.png`, `stage-sketch.png`, `cabin-photo-front.jpg`, `cabin-photo-deck.jpg`).

## What it is
- Game mode **Hangout** (id `hang`). Map **Duck Cabin** (id `cabin`). The mode and the map are one: picking Hangout
  in the lobby puts the room on Duck Cabin, and the map picker is hidden for it. No other mode uses the cabin.
- No winning, losing, objectives, rounds, timers, stats, podium or results. Start → countdown → everyone is in the
  cabin until the room goes back to the lobby (the existing Tab-menu vote, or the host). Joiners arrive at once.
- Always night: a dark blue night outside, warm orange light from windows, lamps, the fireplace, the deck's string
  lights, the campfire and the pool's underwater lights. The photos give the cabin's shapes and wood colors (round
  orange-brown logs, a steep A-frame with a dark green shingle roof, a big triangle window, a stone chimney, an orange
  wood deck railing), drawn in the game's style: simple colored shapes with dark outlines, like the rest of the art.
- The world is far bigger than the screen in every direction; the camera stays centered on your duck (eased a little,
  clamped at the world's edges). Forest trees ring the whole map; the world ends inside the trees.
- Everything that works on a board works here: walking (WASD, arrows, mouse-click walk, the phone joystick and
  tap-to-walk), Shift sprint, Space jump, long and double jumps, the specials row and keys, chat bubbles, the player
  menu, the docks, the music bar, the command line.
- One context button where the Vote / End turn button sits: it shows only near something to use and says what it
  does: **Sit**, **Play** (piano), **Erase**, **Read** (the book), **Get up**. Enter presses it. Jumping also gets up.

## Picks taken for my open questions (change them if I answer differently)
1. One big floor first: the great room, a kitchen, two bedrooms, a bathroom. An upstairs loft comes later.
2. The book is a guestbook: Read opens it; anyone writes a line (up to 120 letters), everyone sees it, kept while the
   room is open (newest 60 lines).
3. Piano: Shift sharps, **Alt (Option on a Mac) flats**. Not Ctrl: Ctrl+W, Ctrl+T, Ctrl+N belong to the browser and
   would close the tab or open one (W and T are on the second octave).
4. Each duck's chalk is its own body color.
5. Couch and piano: the button says "Get up"; a jump gets up too.

## The view and the world
- A 3/4 top-down view like the existing boards: x across, y is depth (down the screen = toward the viewer). A thing
  at world (x, y) with height h draws at screen (x, y − h). Everything is depth-sorted by its foot y (z-index), so a
  duck behind the stage, a couch back or a tree is covered by it, and in front of it covers it. Tall props are split
  into a back part and a front part where needed (the stage's front rim, the couch back, the piano body, the pool's
  near wall, the deck railing).
- World size 6000 × 4400 world px. A duck is about 64 world px tall (the board's duck size). The camera's scale
  makes about 1300 world px fit across a computer screen and about 520 across a phone held upright, so ducks look the
  same size as on the boards.
- Heights (world px, 0 = the highground, the cabin floor and the deck): the downhill ground is −240; the slope
  between them falls smoothly. The stage is +95. A duck can step up 12 px without jumping; higher needs stairs or a
  jump whose height at that moment clears the edge (a plain jump reaches about 86 px, a long jump about 99, a double
  jump more: so the stage needs a long or a double jump, or its stairs). Walking off an edge falls; off the deck it is
  a long fall (240 px) with a little "whee" and a puff on landing.
- Positions stay normalized (`move` x, y in 0..1 of the world) so `rules.js`' move action and online sync keep
  working; the height a duck stands at is worked out from the layout on every screen.

## Layout (world px; x, y of the top-left corner, then width × depth). `js/hangout/layout.js` owns the real numbers.
- Forest ring: 0..300 in from every edge, trees everywhere, not walkable past 150 in. More trees dot the outside.
- Highground (h 0): the north half, y 0..1900.
- Dirt path: from the west edge (x 300, y 700) east to the front door, 150 deep. The **red jeep** (early-2000s
  boxy two-door soft-top: round headlights, slotted grille, flat fenders, spare tire on the back, no logo or brand
  name) is parked on it near x 700, y 560, facing the cabin. Lampposts (warm, flickering a little, few of them) along
  the path and around the pool.
- **The cabin**: x 1300..4300, y 600..2200 (3000 × 1600). Front door in the north wall at x 2000 (level with the
  highground, no stairs). Back door in the south wall at x 2800 onto the deck. Outside you see the roof and walls
  (windows glowing); stepping in through a door hides the roof and walls in front and shows the inside; stepping out
  shows the outside again. Ducks inside are hidden from ducks outside (their shapes show in a lit window at most), and
  the other way round.
  - Great room x 1300..3300 (2000 × 1600): the **fireplace** in the north wall at x 2300 (stone, a warm flicker); the
    **couches** in the middle facing it (a 3-cushion couch at x 2050..2550, y 1350, and a 2-cushion couch to its
    side); the **floor piano** along the west side (big walkable keys x 1400..2300, y 1850..2150, the piano body and
    the music-sheet column above it on the wall/stand behind); the **stage** in the north-east corner (round, about
    500 across, centered x 3000, y 1050, +95 high, stairs on its east side, a mic stand on it that does nothing);
    the **chalk floor** in the north-west corner (x 1400..2000, y 700..1250) with the eraser and the chalk beside it
    (the chalk above the eraser); the **book** on a small stand near x 2700, y 1550; rugs, a lamp or two.
  - East wing x 3300..4300: a hall along x 3300..3500; the **kitchen** (x 3500..4300, y 600..1100: counters, a fridge,
    a stove, a table); the **bathroom** (x 3500..3900, y 1100..1500: tub, sink, toilet); **bedroom 1** (x 3900..4300,
    y 1100..1650) and **bedroom 2** (x 3500..4300, y 1650..2200): beds, rugs, a lamp. Doors are gaps in the walls.
- **The deck**: x 2200..4300, y 2200..2600, h 0, raised high over the slope: an orange wood railing on its open sides
  (not walkable through), warm string lights, two rocking chairs and a little table. **Stairs** at its east end go
  down south to the downhill ground (x 4300..4500, y 2200..2900, h 0 → −240). Jumping over the railing falls.
- The slope (the darker green): y 1900..2800 outside the deck, from h 0 down to −240; under the deck the ground is
  already low.
- Downhill (h −240), y 2800..4400:
  - **The pool**: x 3000..4800, y 3100..3900, its water 40 below the ground. Lights under the water make it glow;
    a few lights around it. A **lane rope** splits it in half (x 3900, north to south): drawn under every duck and
    everything a duck wears or shows. **Little rubber ducks** float in it and drift with the water. A **beach ball**
    that stays in or near the pool (if knocked out it rolls back toward it; never more than about 250 px from the
    edge). Ducks walk down the pool's steps or jump in: they float (bob, slower, ripples around them, a splash going
    in and jumping out).
  - **The campfire**: x 1500, y 3300, with log seats around it (sit on them like a couch: one duck a log end).
  - **The trampoline**: x 5200, y 3000: landing on it bounces the duck high (each bounce a little higher, up to
    about 3 duck heights); walking off ends it.
- **The soccer field**: the highground's east end x 4500..5800, y 400..1800, painted lines, the **soccer net** at
  the far east (x 5650, y 950..1450); the **soccer ball** starts mid-field. A duck walking into the ball kicks it the
  way it walks (sprinting kicks harder, a jump over it doesn't touch it); it bounces off the forest edge and the net's
  posts, rolls into the net and settles. No score is kept; a goal gives a small confetti burst and a horn.

## Activities
- **Stage**: covers ducks behind it (everything they wear and show), is covered by ducks in front of it; jumping up
  from below the stage while not on it, the duck's lower part is hidden behind the stage's front. On it a duck stands
  at +95. Stairs or a long/double jump to get up. The mic is decoration.
- **Couches**: near one, the button says **Sit**; the duck sits on the nearest free cushion. No walking while seated:
  a move key (or a tap/click to the side) hops to the next cushion that way if it is free. **Get up** (or a jump)
  stands it up in front of the couch.
- **Chalk floor**: the chalk tile's button (or clicking the chalk) picks up the chalk: then dragging the mouse or a
  finger on the chalk floor draws, in your body color; anyone holding chalk draws at the same time. Walking away or
  pressing it again puts the chalk down. Standing on the eraser, the button says **Erase**: it clears the floor for
  everyone. Strokes are shared through the room (simplified points, a cap on how much is kept, oldest drop first).
- **Floor piano**: walking onto a key plays its note for everyone (the key lights). Near the piano the button says
  **Play**: keyboard mode. The duck moves to the first free seat spot in front of the keyboard (one spot per player,
  out of the Play button's way) and can't move until Get up. Keyboard mode:
  - Four octaves of white keys (C D E F G A B), lowest to highest: `1 2 3 4 5 6 7`, `q w e r t y u`,
    `g h j k l ; '`, `v b n m , . /`. Shift + key sharps it a half step, Alt + key flats it; black keys are played only
    that way on a computer. Read keys by `e.code` so Shift and Alt don't change them; stop the browser's own use of the
    keys while playing (but never fight Ctrl/Cmd shortcuts). Also: Space flats as well as Alt, C sharps as well as
    Shift, Escape gets up; a neat legend of the rows and these keys shows on the keyboard on a computer.
  - Each key glows as it is played, on the screen and on the big piano that everyone sees. The glow's color is the
    interval from the previous note (the note still held, else the last one played): the twelve half-step intervals
    take twelve colors around the rainbow (minor 2nd, major 2nd, … major 7th; the same note or an octave white). A
    chord takes its colors from that previous note. When the interval is more than an octave, the key shows its name
    on it as the interval plus octaves (for example "M3 +1 oct").
  - Above the big piano, a column of music staff shows the notes being played, scrolling up, seen by everyone.
  - Phones: the four octaves show on the screen as four rows of keys (one octave a row, lowest at the bottom), black
    keys between them tappable directly, the same glow colors; nothing else of the board is in the way.
  - Music: when anyone presses Play the room's music fades out and the music bar says "Piano"; 10 seconds after the
    last player gets up, the music fades back in.
  - The piano's sound: a warm piano voice, short attack ramped over at least 5 ms, no noise burst (see the music
    crackle notes); notes from other players play on every screen.
- **Book (guestbook)**: near it the button says **Read**: a small page opens over the board (not a new window) with
  the lines written so far and a line to write in. Closing it or walking away closes it.
- **Pool, beach ball, rubber ducks, trampoline, soccer ball**: above.

## How the code is laid out
- `js/hangout/` holds the mode: `layout.js` (the world: regions, heights, walls, doors, props' places), `world.js`
  (the camera, the heightmap and collisions, inside/outside, depth sorting, drawing the world), `art.js` (the drawings:
  SVG strings per prop, night-lit), and one file per activity (`piano.js`, `pianokeys.js`, `chalk.js`, `couch.js`,
  `stage.js`, `pool.js`, `balls.js`, `book.js`, `trampoline.js`). `js/hangout/rules.js` holds the mode's reducer
  parts (`s.hang`), called from `js/rules.js` (`case 'hang'` and the host's `tick`).
- `game.js` gets a Hangout branch the way Story Chain has one (`isHang(s)`): the board is the world, `place`/
  `unplace` go through the camera, drawing ducks adds height and depth, `step` asks the world for walls and heights.
  Keep the branch thin; the work lives in `js/hangout/`.
- Each activity registers with the world: `{ id, near(pos) → { label, act } | null, draw(now), step(dt, now),
  onState(s) }`; the world asks every activity for the context button and runs their draw/step each frame.
- Shared state lives in `s.hang` (sitting, piano seats, chalk strokes, the book, the balls). Balls are simulated by
  the host in its 200 ms tick (`x, y, vx, vy, t`), and every screen moves them on from that between ticks.
  Actions from players go through one action, `{ t: 'hang', k: '<what>', … }`, checked by the host.
- Online: `database.rules.json` may need nothing (state goes in as encoded strings); check it. Keep `s.hang` small:
  chalk strokes simplified and capped, the book capped.

## Build order (several workers; each on its own branch, merged in order)
1. In parallel: **Foundation** (mode, lobby, world, camera, heights, walls, inside/outside, depth, context button,
   activity registry, `s.hang`, placeholder shapes), **Art** (`js/hangout/art.js` and a preview page), **Piano
   keyboard** (`js/hangout/pianokeys.js`: the keyboard mode's keys, colors, labels, sound and the sheet column, built
   and tested on its own page).
2. After the foundation is in, in parallel: **Water and bouncing** (pool, beach ball, rubber ducks, falling off the
   deck, the trampoline), **Stage, couches and soccer**, **Chalk and the book**, **Piano in the cabin** (the floor
   keys, Play, seats, sharing notes, the music fade, the art from step 1 put in the world).
3. Last: one pass that plays it all together (TEST room and online with several players), on Chromium and Firefox,
   phone upright and computer, and fixes what's left.

## Done means
- Every piece above works on a computer and on a phone held upright, in a TEST room and online with several players.
- Nothing overlaps the UI; the specials row, the music bar and the docks still work. Run `python3 tools/stamp.py`.
- Help, `man` pages, the lobby tip and CLAUDE.md mention Hangout and Duck Cabin in the house style.
