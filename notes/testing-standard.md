# Testing standard (Sandbox and every big change)

The owner (Nov 19 01:36Z): testing is "too expensive and costly for me", so we find the bugs before the owner does.
This file is how. It is built from respected sources, not one person's tips:

- **ISO/IEC/IEEE 29119** (the international software testing standard): part 2 the test process (plan, design,
  run, report, with entry and exit criteria), part 3 the documents (test plan, test cases, incident report,
  completion report), part 4 the test design techniques.
- **ISTQB Certified Tester Foundation Level syllabus v4.0** (the most widely used tester qualification): the seven
  testing principles, independence of testing, black-box techniques (equivalence partitions, boundary values,
  decision tables, state transitions), experience-based testing, risk-based testing, regression and confirmation
  testing.
- **Glenford Myers, _The Art of Software Testing_** (the classic book): a test is run to find errors, not to show the
  program works; every test case states its expected result before it runs; test invalid and unexpected input as
  well as valid; where one bug is found, more are nearby; never plan a test assuming no bugs will be found.
- **Kaner, Bach & Pettichord, _Lessons Learned in Software Testing_**, and **Session-Based Test Management**
  (Jonathan and James Bach): exploratory testing in timed sessions with a written charter and notes.
- **Schultz & Bryant, _Game Testing: All in One_** (the standard game QA textbook): test flow diagrams for game
  states, combinatorial (pairwise) tables for settings, and the rule that a bug report must let anyone reproduce it.
- **_Software Engineering at Google_** (Winters, Manshreck, Wright): small fast automated checks first, then a few
  big end-to-end runs; a test that fails at random gets fixed, never ignored.

## 1. Who tests what (independence, ISTQB)
1. **The worker who built it** runs the stage's tests (sections 3 to 6) and puts the **test report** (section 8)
   in the PR body. A PR without one is not ready.
2. **Adam tests it again independently** before anything merges: the traceability table (section 3) on at least
   the risky rows, plus the regression set (section 6). Adam never just reads the worker's report.
3. **The owner** gets the result, not the testing. Only things only the owner can judge go to the owner (look,
   feel, a design choice), and as text.

## 2. Stage gates (29119 entry and exit criteria)
A stage may **start** only when:
- the stages it builds on have passed their exit gate and are merged on Adam's branch (see the order in
  `/mnt/project-files/sandbox/README.md`);
- the worker has read the owner's spec lines and answers for that stage and listed them in the test plan.

A stage is **done** only when:
- every row of its traceability table passes;
- 0 console errors and 0 unhandled promise rejections in every run;
- no open severity 1 or 2 bug (section 7), and every severity 3 bug is either fixed or told to Adam;
- the regression set passes;
- Adam's independent run passes.
Then the next stage that waits on it may start. A later stage never builds on an untested one.

## 3. Test basis: the owner's words (traceability)
Before writing code, the worker turns every owner sentence for the stage into rows:

| # | Owner's words (quote, file + line) | Test: steps | Expected result | Pass? |
|---|---|---|---|---|

Sources, in this order: `sandbox-mode-rules.txt`, then the owner's 01:34Z answers (end of
`notes/agree-or-disagree.md`), then Adam's decisions under them, then the plan doc. Where two disagree, the
newest owner words win; if still unclear, ask Adam before building, not after.
Every row states its expected result **before** it is run (Myers). A row that can't be tested is a question, not a
pass.

## 4. Test design techniques (29119-4, ISTQB chapter 4). Use each that fits:
- **Equivalence partitions + boundary values** for every number: test below, at and above each limit. Example:
  NPC cap 800 means 799, 800, 801 and a burst of many at once; HP 0, 1, max, max+1; damage ranges at their ends
  ("2,4" must only ever give 2 or 4); empty, one, very long text; negative and non-numbers typed into boxes.
- **State transitions** for anything with states, drawn as a small diagram (Game Testing's test flow diagram):
  key windows (closed, held, kept, closed by a tap, switched to another key, Esc, window loses focus while held);
  Sandbox phases (start, playing, Leave vote, back to lobby); duck states (alive, down, back up). Test every arrow
  and at least one wrong arrow (a key pressed in a state where it should do nothing).
- **Decision tables** for rights: host / Democracy "all can change settings" on or off / host handed over / a
  player given rights / normal player. Every column is a test.
- **Pairwise tables** for setups (too many to test all): browser (Chromium, Firefox) × device (computer, phone
  upright, phone sideways, touchscreen laptop = computer UI) × map kind (simple board, Duck Cabin, zombie cabin,
  Downpour) × room (TEST offline, online 2 players) × role. Pairwise covers every pair at least once.
- **Error guessing / known trouble spots** from this project's own history (`notes/bugs-and-ideas.md`, memory):
  overlaps on phone, things drawn the wrong size, keys stuck after focus loss, joiners mid-game, Play again not
  resetting, a new host after the host leaves, service-worker updates, Firefox's sound timing.
- **Exploratory sessions** (SBTM): after the scripted rows, one 30 to 60 minute session per stage with a written
  charter ("Explore X with Y to find Z"), notes of what was tried, bugs, and questions.

## 5. Kinds of checks per stage
- **Function**: the traceability rows.
- **Online**: what one player does, the others see the same (tools/online-test, 2 players; 3 when rights or host
  change are involved). Joining mid-Sandbox and leaving mid-Sandbox.
- **Load**: the worst case the owner allows (800 NPCs, many orbs, many zones) keeps the game playable: measure
  frame time and note it in the report.
- **Layout** (owner's rule: nothing overlaps): code checks of element boxes on phone upright, sideways and
  computer, not only pictures.
- **Sound**: any new sound passes `tools/clickcheck.js` (CLAUDE.md "Sound without pops").
- **Save data**: anything saved survives a reload and an update, and bad saved data never breaks the game.

## 6. Regression set (ISTQB regression + confirmation testing)
After every fix: re-run the failing test (confirmation), then the regression set:
- each existing mode starts and plays a round with 0 errors: Agree or Disagree, Would You Rather, Bicker Brackets,
  Story Chain, Who is the Quack?, Trivia, Hangout, Dead Ducks Arcade (Quacky Zombies), Mad God Justin;
- Single Player opens; lobby, Game Settings and the vote round open; the command line answers `help`;
- phone upright and sideways layout probes (`v89.cjs`-style) and one online 2-player run.
Automate these as scripts and keep them; a script that fails at random is fixed, not skipped.

## 7. Bug reports (29119-3 incident report; Game Testing)
One bug, one report:
- **Title**: what breaks, where ("Leave Sandbox stays after the host leaves, online").
- **Steps** from a fresh start, numbered, short enough for anyone to repeat.
- **Expected**, with the owner's words it comes from. **Actual**.
- **Setup**: browser, device size, map, room kind, role, build version.
- **How often**: every time / N of M tries.
- **Severity**: 1 crash, stuck or data lost; 2 a feature doesn't work or breaks the owner's rule; 3 works but
  wrong (looks, numbers, words); 4 polish.
- **Evidence**: console text, a state dump; a picture only when the bug is how it looks.
Bugs cluster (Myers): after finding one, test the area around it harder.

## 8. Test report in every PR (29119-3 completion report)
- Stage, what was tested, on what setups (the pairwise table).
- Traceability table with pass/fail.
- Bugs found and fixed; bugs still open with severity.
- Exploratory session charter + notes.
- Load numbers. What was NOT tested and why.
