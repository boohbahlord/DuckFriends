# Online test

Plays an online room with several players on one computer, to catch crashes that only show up online. Each player is a
separate browser that plays like a computer player, and they keep starting kick and back-to-lobby votes. It talks to
local Firebase emulators, never the real database.

You need Node.js and Java (for the database emulator).

```
cd tools/online-test
npm install
npx playwright install chromium
npm run emulators          # leave this running; in a second terminal:
node run.js bb 5 180 storm
```

`node run.js [mode] [players] [seconds] [scenario]`: mode is `aod`, `wyr` or `bb`; scenario is `none`, `mixed`,
`storm`, `kick`, `lobby` or `boss` (the host gives sudo, and sudo players kick and skip). Add `QUIT=1` in front to also
close the host's browser in the middle of votes, so another player has to take over.

It ends with every error any browser hit (and exits with 1 if there were any), and saves a screenshot of each player in
`shots/`.

`node walk.js [mode] [map]` (`l4dd downpour` at first) checks the players' own walk online: a host and a guest on the
map, each walking with real keys (the guest also sprints, jumps, picks its gun and fires). Both screens must show each
duck in the same spot, each must see the other move and jump, and the host must get the guest's shots. Run it before
and after changing how my duck walks, jumps or uses its hotbar (`tools/check/player.cjs` pins the same offline, frame
by frame).
