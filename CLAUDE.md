# DuckFriends

A browser party game for friends on a voice call: rubber ducks walk around a board and vote with their feet. Plain
HTML, CSS and JavaScript modules, no build step. Live at https://boohbahlord.github.io/DuckFriends/ (GitHub Pages
serves `main`, so merging to `main` is deploying).

## Read first
- `notes/agree-or-disagree.md`: every request the owner has made, word for word, with the decisions taken. Add each new
  request to the end of it, word for word, before working on it.
- `notes/plan-request-5.md`: the current plan and the owner's answers (words like Stage, Turn, Round; specials; joining).
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
  maps (Night Show, Sky, Pixel, Ether's Crossroads); `css/app.css` everything's look.
- `js/music.js` makes the songs on the spot; the host keeps the room's song list in the state (`s.music`), so everyone hears the
  same song at the same moment. `js/musicbar.js` is the now-playing bar (speaker, Music slider, song name).
- Game modes: Agree or Disagree (`aod`), Would You Rather (`wyr`), Bicker Brackets (`bb`), Story Chain (`sc`, plan in
  `notes/plan-story-chain.md`).

## Before each commit that touches css/ or js/
Run `python3 tools/stamp.py`. It stamps a version on every file in `index.html`, so browsers never mix old and new files.

## Testing
Serve the folder (`python3 -m http.server`) and drive it with Playwright. A TEST room can be started from the page:
`(await import('./js/net.js')).createLocalRoom({ name: 'T', test: true, computers: 3 })`, then `router.go('lobby', room)`
and `room.send({ t: 'start' })`. Check every map and both phone (portrait) and computer sizes.
Online rooms with several players: `tools/online-test` (see its README) plays them against local Firebase emulators.

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
