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
- `notes/map-building-rules.md`: rules for building any walkable map (size, see-through covers, walls, holes, rooms,
  light, water, zombie paths, phone UI). Read it before building or changing a map.
- `notes/seriat-bible.md`: the Seriat language (Sandbox's number code), current rules, operators and examples.
  Read it before touching Seriat; update it the day the owner settles something.
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
  maps (Night Show, Sky, Pixel, Carnival Night, Starry Night, Rabbit Hole, Shelter Sky & Null (`collage`, `js/collage.js`), Ether's Crossroads, and Duck Cabin, Hangout's
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
- `js/report.js` is Report Bug or Suggest Ideas (Firebase's write-only `reports` path); `tools/bugs-and-ideas.mjs`, run
  hourly by `.github/workflows/bugs-and-ideas.yml`, copies new reports into `notes/bugs-and-ideas.md`.
- Game modes: Agree or Disagree (`aod`), Would You Rather (`wyr`), Bicker Brackets (`bb`), Story Chain (`sc`, plan in
  `notes/plan-story-chain.md`), Who is the Quack? (`quack`, plan in `notes/plan-imposter.md`), Lawyering (`law`), Duncelation (`dunce`,
  rules in `js/duncerules.js`, screen in `js/dunce.js`, plan in `notes/plan-duncelation.md`), Valentine's Duck Date
  (`vdd`, rules in `js/vddrules.js`, screen and the dining table's art in `js/vdd.js`, preview `tools/vdd-art.html`), Hangout
  (`hang`, plan in `notes/plan-hangout.md`: no rounds, no stats, always on its own map, Duck Cabin, `cabin`).

## Sound
Every sound made in code follows `.claude/rules/sound.md` (no pops: start and end at silence, schedule ahead, never jump a gain, headroom, check with `tools/clickcheck.js`). Read it before touching any sound.

## Before each commit that touches css/ or js/
Run `python3 tools/stamp.py`. It stamps a version on every file in `index.html`, so browsers never mix old and new files.
Format first, the owner's way: `npx prettier@3.6.2 --write <changed js/css/html/json/yml files>` and `black <changed .py files>`
(never Prettier 3.3.3: it drops numbers from arrays inside template literals).

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

## One shared module per mechanic, modes as data (the owner's core principle, Nov 20 21:47Z/21:48Z/21:52Z; why: /mnt/project-files/adam/code-health.md)
- NEVER a file per mode. Zombies, players and computer players, hits and gore, guns and their drawings, NPC brains: each
  is ONE module that every mode runs. The mode that defines it is the base (Dead Ducks Arcade for zombies, players,
  computer players and gore).
- What differs between modes is data handed to that one module, never code: a "breed" entry (Type Object pattern,
  Nystrom, Game Programming Patterns) such as `ZOMBIE_BREEDS.mgjWave = { speed, damage, swipeMs }`, or a callback the
  shared code calls at a fixed hook (Template Method / Strategy, Gang of Four), the way the social modes plug into one
  template. The shared code asks the breed; it never checks a mode's name.
- A second module for one mechanic needs a reason from real game-programming practice written at its top ("easier to
  copy" never is).
- Search (`git grep` the behavior) before writing anything; extend what exists with a breed field or a hook.
- No new scattered `?? n` defaults in game rules: numbers live in js/gamedefaults.js or the breed table.
- One owner module per state key; only it writes that key.
- Files stay under ~1,500 lines; split by mechanic.
- Replacing something deletes the old path in the same PR.
- A change to a shared mechanic is tested in every mode and screen that uses it, menus included.

## Keeping the code from breaking as we work on it (the owner's, Nov 20 21:59Z; sources: Lehman, MIT 6.031, Software Engineering at Google, SWEBOK, Parnas, Ousterhout, Feathers, Fowler)
A program that is changed grows more complex unless work is spent against it (Lehman). So, on every change:
- Pin before you touch: record what a shared mechanic does today in every mode (a characterization test or golden run)
  before changing it; the change must leave that the same unless the change is the point (Feathers).
- One check command before every deploy, across every mode, map and menu, phone and computer; red means no deploy
  (regression testing, SWEBOK).
- Restructure or add, never both in one PR (Fowler). Small steps, tested after each.
- Leave it cleaner: every PR removes at least one copy, mode-name check or scattered default from the code it touched
  (Ousterhout: strategic, not tactical).
- Hide each decision in one module and keep what other files read of it small: whatever they read, they come to
  depend on (Parnas, Hyrum's law).
- Replace means delete; run `node tools/unused-exports.mjs` after each batch.
- Measure the decay at each deploy and keep it going down: the biggest file's lines, `?? n` defaults, checks of a
  mode's name, unused exports, copies of a mechanic. A rise needs a reason in the PR.
- Keep an index of the shared modules here (mechanic, its file, its breeds and hooks) and write each decision the day
  it's made.

## Reading, writing and talking for less (the owner's, Nov 20 22:09Z; sources in /mnt/project-files/adam/ and project memory)
- Map, then narrow: `git grep -l` the behavior, then read 100 to 200 line windows; never read a file over 1,500 lines
  whole, nor `notes/agree-or-disagree.md` (about 270k tokens: search it).
- Briefs carry paths and line ranges, never pasted code; the owner's words and "done when" go first.
- Tools and tests print only failures; edits are search-and-replace, never whole-file rewrites.
- A rule with no exceptions becomes a check or a hook, not another line here.

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
- Comments inside the code (js, css, html, py, tools) speak as the owner in first person ("I want", "we decided") and say "owner" where a name is needed, never "the user", the owner's display name or a helper's name. Notes written for Claude (this file, `notes/`, memory) keep their usual voice. Word-for-word quotes, text players see and code names stay as they are.
