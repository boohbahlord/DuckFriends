# DuckFriends

A browser party game for friends on a voice call: rubber ducks walk around a board and vote with their feet. Plain
HTML, CSS and JavaScript modules, no build step. Live at https://boohbahlord.github.io/DuckFriends/ (GitHub Pages
serves `main`, so merging to `main` is deploying).

## Notes (search them, don't read them whole)
- `notes/agree-or-disagree.md`: every request the owner has made, word for word, with the decisions taken. It is long:
  search it for the request you're working on instead of reading it all. Add each new request to the end of it, word
  for word, before working on it.
- `notes/plan-request-5.md`: the older plan and the owner's answers (words like Stage, Turn, Round; specials; joining).
  Read it only when working on those parts.
- `notes/ref/`: the owner's reference pictures (board colors, the Halo Reach lobby idea).

## How it fits together
- `index.html` loads `js/main.js`; screens register with `js/router.js`.
- `js/rules.js` is the whole game as a reducer: `reduce(state, action, now)`. The host runs it. TEST rooms run it on the
  device (`js/net.js`, with computers from `js/bots.js`); online rooms run it in the host's browser over Firebase
  (`js/online.js`, rules in `database.rules.json`).
- `js/shell.js` is the command line: the language (pipes, `&&`, variables, loops) is `js/bash.js`, the text tools
  `js/textutils.js`, every `man` page `js/manual.js`, and the Help pages (HelpChat, HelpGame-How …) and the command colors
  `js/helppages.js`.
- `js/game.js` draws the board, moves your duck and handles keys (`js/keynav.js` moves through menus with the arrow keys); `js/brackets.js` is Bicker Brackets; `js/story.js` is
  Story Chain; `js/maps.js` the
  maps (Night Show, Sky, Pixel, Carnival Night, Starry Night, Rabbit Hole, Ether's Crossroads, and Duck Cabin, Hangout's
  own); `css/app.css` everything's look.
- `js/hangout/` is Hangout, on Duck Cabin (game.js keeps only a thin branch, `isHang(s)`):
  - `layout.js`: the world's numbers (regions, heights, walls, doors, where every prop stands); no drawing.
  - `world.js`: the camera, the ground, heights, walls and falls, inside or outside, depth sorting, the context button.
  - `shapes.js`: places `art.js`' drawings where `layout.js` says; `art.js`: every prop as SVG, at night (preview:
    `tools/hangout-art.html`).
  - `registry.js`: how an activity adds its rules and its screen part; `activities.js` imports them all;
    `rules.js`: `s.hang` and the `{ t: 'hang', k }` action, called from `js/rules.js`.
  - `lamp.js` the lamps (the example activity); `stage.js` the stage and its mic; `seats.js` the couches and the
    campfire's logs; `soccer.js` the soccer ball and net; `chalk.js` the chalk floor and eraser; `book.js` the guestbook.
  - `piano.js` the piano, Play and the music fade; `pianokeys.js` its keyboard mode, sound and music sheet (test
    page: `tools/piano-test.html`).
  - `pool.js` imports the water and the bouncing: `water.js` floating, ripples, splashes; `beachball.js`;
    `rubberducks.js`; `trampoline.js`; `falls.js` falling off the deck.
- `js/music.js` makes the songs on the spot; the host keeps the room's song list in the state (`s.music`), so everyone hears the
  same song at the same moment. `js/musicbar.js` is the now-playing bar (speaker, Music slider, song name).
- Game modes: Agree or Disagree (`aod`), Would You Rather (`wyr`), Bicker Brackets (`bb`), Story Chain (`sc`, plan in
  `notes/plan-story-chain.md`), Who is the Quack? (`quack`, plan in `notes/plan-imposter.md`), Lawyering (`law`), Hangout
  (`hang`, plan in `notes/plan-hangout.md`: no rounds, no stats, always on its own map, Duck Cabin, `cabin`).

## Sound without pops (every sound made in code: songs, piano, sounds)
A pop is the wave jumping. Every rule below stops one kind of jump; check each one for every new voice or sound.
- Start every note from silence and end it at silence. Its gain node starts at 0 (`g.gain.value = 0`), then
  `setValueAtTime(0, t)` and a ramp up. Fade-ins of at least 5 ms (low notes 10 to 16 ms, thumps 16 ms or more). Fades
  out over at least 10 ms; with `setTargetAtTime(0, t, tau)`, stop the source no sooner than `t + 6 * tau`.
- Schedule ahead. Never set a start, a stop or a gain change at `currentTime` or before it: set late, the fade-in is
  skipped and the note clicks (in Chrome it can even start far too loud). Live notes: `currentTime + 0.02` or more
  (Firefox's `currentTime` only moves between tasks). A note-off uses the same lead as its note-on.
- Never jump a gain or a filter. No `.value =` and no `setValueAtTime` to a new level on something that is sounding.
  To change a level that is moving, hold it first (`cancelAndHoldAtTime(t)`, or `cancelScheduledValues(t)` then
  `setValueAtTime(param.value, t)`), then ramp. Exponential ramps can't reach 0: ramp to 0.0001, or use setTargetAtTime.
- Noise at a note's start (hammers, chiffs, breath, sticks) is heard as crackling: ramp it in over 5 ms or more, keep it
  quiet and dark (filtered), or leave it out.
- Leave headroom. The sum of everything playing stays under 1: lower each voice, and end the chain with a soft ceiling
  (see `chain()` in `js/hangout/pianokeys.js`). A `DynamicsCompressorNode` adds its own make-up gain, so it is not a
  limiter on its own.
- Recordings: a buffer that starts or ends away from 0, or a loop that doesn't meet itself, clicks. Fade the first and
  last few ms.
- Keep it light. Every oscillator costs work 44,100 times a second; too many at once and the sound stutters
  (crackles). Cap the voices, stop sources once silent, and prefer a recorded buffer for many repeats.
- Check it: render the sound offline and run `findClicks` from `tools/clickcheck.js` (0 clicks, 0 clipped). Render it
  late too (an `OfflineAudioContext.suspend()`, then schedule a few ms in the past) to prove a late note stays quiet.

## Before each commit that touches css/ or js/
Run `python3 tools/stamp.py`. It stamps a version on every file in `index.html`, so browsers never mix old and new files.

## Testing
Serve the folder (`python3 -m http.server`) and drive it with Playwright. A TEST room can be started from the page:
`(await import('./js/net.js')).createLocalRoom({ name: 'T', test: true, computers: 3 })`, then `router.go('lobby', room)`
and `room.send({ t: 'start' })`. Check every map and both phone (portrait) and computer sizes.
Online rooms with several players: `tools/online-test` (see its README) plays them against local Firebase emulators.

Pick the test tier from the size of the change:
- **Quick** (a tweak to one part: art, words, a bar, a small bug): the screen it touched, Chromium on phone and
  computer. Firefox too only if it touches keys, sound or layout.
- **Standard** (a new feature inside an existing mode): that mode in Chromium and Firefox, phone and computer. Online
  with 2 players only if it changes what players share.
- **Full** (a new mode or map, or a big rewrite): the whole tour (every map, both browsers, phone and computer, online)
  once at the end; after its fixes, re-check only the spots that changed.
Check with code before pictures (console errors, overlaps, the right element showing); keep screenshots to a handful.

## Using limits well
- Do only the ask. Say it back in one line; offer extras as one-line questions instead of doing them.
- Medium effort by default. High effort only for new art, new music, game design and a bug that a first try at medium
  didn't fix.
- At most 2 helper agents per thread, on parts that don't share files, unless the owner asks for more.
- One merge window: ready PRs wait, then merge together after one shared test and one deploy.
- A quick question ("is it live?") gets a quick look, not a full test.

## The owner's rules
- Function first: fix what's broken in the game modes before adding new things.
- Show a plan and wait for a go before big changes. Ask before any brand-new idea (a new mode, map, mechanic or
  screen); small touches in the existing style are fine.
- Look and feel: a funny party game with almost no explanations. Twister-like simple colored shapes, rubber ducks that
  look a little 3D with a small shadow, the multicolored letters for titles. Keep new art consistent with what's there.
- Dark mode is the default.
- UI elements never overlap. Mind dead space, alignment, font size, weight and box size. Everything must work on a phone
  in portrait as well as on a computer.
- Boards are see-through over the maps, Would You Rather and brackets as much as Agree or Disagree.
- Words: "Jumps", never "clicks". Specials, not effects. In brackets, players see "contenders", never "seeds" (the code still says seeds).
- Never send the owner's email address anywhere.
