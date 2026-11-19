# Testing standard (brief)

Owner, Nov 19 01:36Z: we find the bugs, not the owner. Owner, 01:43Z: "Testing should be brief and resource
efficient. Emphasis on brief." So: few tests, the right ones, mostly automated.
Drawn from ISO/IEC/IEEE 29119, the ISTQB Foundation syllabus v4.0, Myers' _The Art of Software Testing_,
Kaner, Bach & Pettichord's _Lessons Learned in Software Testing_, and Schultz & Bryant's _Game Testing: All in One_.

## Why syntax checks alone are not enough
This game has no compiler (plain JavaScript). `node --check`, eslint and the module load check catch typos and
broken imports only. They pass while a weapon draws knife-sized or a button sits off center. So every change also
gets a short run of the game itself.

## Every PR (minutes, not hours)
1. **Automatic**: node --check, eslint, module load, css brace balance, then a headless script that starts the
   touched mode and fails on any console error.
2. **The owner's words**: a short list, one line per owner sentence the change covers: what to do, what must
   happen. Run each once. Expected result written first (Myers).
3. **Edges only where a number or a state is involved** (ISTQB): at, below and above a limit (e.g. NPC cap 800);
   every way into and out of a window or phase once; for rights, host / everyone (Democracy) / normal player.
4. **Where it shows**: Chromium on phone upright and computer, checked by code (errors, element boxes, overlaps).
   Firefox only for keys, sound or layout; phone sideways only for layout; online 2 players only when what players
   share changes.
5. **Regression, smallest form**: one script that starts each mode once with 0 errors.

## Who
The worker runs it and puts 3 to 6 lines in the PR: what passed, what didn't, what wasn't tested. Adam re-runs
the risky lines himself before the next stage starts. The owner sees results only.

## Stage gates
A stage waits until the stages under it passed and merged (order in `/mnt/project-files/sandbox/README.md`).

## Bug report (one per bug, short)
Steps, expected (owner's words), actual, setup (browser, device, map, role), how often, severity
(1 crash or stuck, 2 broken, 3 wrong, 4 polish). After one bug, poke the area around it: bugs cluster (Myers).

## Bug hunting: the first layer (owner, Nov 19 17:15Z: "You should have principles on how to search and find for bugs")
The owner kept finding basic bugs that a first pass should have caught (a stuck phone joystick while building a zone,
the board moving while placing a spawn, a chair that never threw). Before any PR, and in a bug-hunt session, the
worker plays the feature like a player and runs this checklist. It comes from Whittaker's _How to Break Software_
(input and state attacks), Bach's SFDPOT heuristic and session-based testing (Kaner, Bach & Pettichord), Myers
(bugs cluster) and Schultz & Bryant (game-flow and controls testing).

1. **Every control, every way in** (Function, Operations): each button, key and menu row of the feature is used once
   with the mouse, once with its key, and once by touch on a phone. A thing that only works one way is a bug.
2. **Use it as the owner would, start to finish** (a tour): open, pick, place, change, use, close, and use it again.
   Then the same while moving, while holding a weapon, while down, and as a non-host.
3. **Interrupt it** (Whittaker's state attacks): open another window, press Esc, rotate the phone, lift the finger
   mid-drag, switch weapon, die, or leave the game in the middle of the action. Afterwards, everything (joystick,
   keys, camera, board) must work as before. Stuck input is severity 1.
4. **Do it twice, do it fast, undo it**: double taps, the same key again, place two in a row, delete and place again.
5. **Bad and edge input** (Data): empty, 0, the limit, past the limit, decimals, letters where numbers go, very long
   text. Every number box and every limit the owner gave gets checked at, below and above.
6. **Does anything move that shouldn't** (Structure): screenshots before and after the action at phone and PC sizes;
   board, bars and buttons stay put, nothing overlaps, nothing goes off screen.
7. **On every surface it lives on** (Platform): board, Duck Cabin, Downpour (for Sandbox), PC and phone, and Firefox
   when keys, touch or layout are involved.
8. **Did it actually do the thing** (oracle): check the result in the state (`window._r.state`), not just that no
   error appeared. "No console errors" is not a pass.
9. **Bugs cluster**: after finding one, spend five minutes on everything next to it.

The PR note lists which of 1 to 8 were run and what failed. Adam re-runs 3 and 8 himself before a deploy.
