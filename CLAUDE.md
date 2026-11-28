# DuckFriends

A browser party game for friends on a voice call: rubber ducks walk around a board and vote with their feet. Plain
HTML, CSS and JavaScript modules, no build step. Live at https://boohbahlord.github.io/DuckFriends/ (GitHub Pages serves
`main`, so merging to `main` is deploying). It is a social game first.

## The one rule (the owner's, Nov 27)
Make the goal small enough to do well, then use what someone already solved: the language's own tools, a known
algorithm, a trusted library or textbook, another game's proven method. Write the least code that does it. If a job
needs a lot of new code, stop and talk the plan over with the owner first. Everything below follows from this.
- One behavior lives in one place; modes differ by data (a breed row) or a hook, never by a copy.
- Replacing something deletes the old path.
- Files go in folders with meaningful names.

## Finding things
`notes/repomap.md` lists every file. Search (`git grep -l`) and read the part you need, not whole big files.
- `js/rules.js` is the game as a reducer, `reduce(state, action, now)`, run by the host. `js/net.js` runs TEST rooms on
  the device; `js/online.js` runs online rooms over Firebase.
- `js/game.js` draws the board and moves your duck; `js/maps.js` the maps; `css/app.css` the look.
- `js/hangout/` is Hangout on Duck Cabin. Dead Ducks Arcade (`l4dd`) plays on Downpour (`js/hangout/stationmap.js`).
- Zombies: `js/zombies.js`, `js/crowd.js`, `js/zombiepath.js`. Guns: `js/guns.js` (numbers), `js/gunart.js` (drawings).
- Sound rules: `.claude/rules/sound.md` (read before touching sound).

## Before a commit that touches css/ or js/
`npx prettier@3.6.2 --write <changed files>` (never 3.3.3), then `python3 tools/stamp.py`.

## Testing and updates
- Changes collect on the deploy branch; an update goes live as one batch with one Updates page, never one per fix.
- Test what you changed, once. `node tools/check/run.mjs <names>` runs named checks; the full run happens once per update.
- GitHub runs the quick checks on every PR. Robot reviewers: act only on real bugs, never style notes.

## Talking and writing
- Plans are a short paragraph in chat. Docs are short and dry, no pictures unless the owner is approving art.
- Workers get only the files and rules their job needs.
- Don't copy the owner's messages into notes; link the message.

## The owner's rules
- Ask before a brand-new idea (a new mode, map, mechanic or screen).
- Look: a funny party game with almost no explanations, simple colored shapes, rubber ducks with a small shadow, pixel
  art. Dark mode by default. Nothing overlaps; everything works on a phone in portrait and on a computer.
- Words: "Jumps", never "clicks". Specials, not effects. Brackets say "contenders", never "seeds".
- Never send the owner's email address anywhere.
- Code comments speak as the owner ("I want", "we decided"), never "the user" or a helper's name.
