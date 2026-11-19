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
