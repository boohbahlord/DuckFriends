# The Seriat bible

The language as it stands now: every rule, operator and example in one place, with the newest answer folded in.
This is the source of truth for Claude. When the owner settles something, update this file the same day and drop the
old wording; history and word-for-word quotes live in `notes/agree-or-disagree.md` and
`/mnt/project-files/sandbox/numerat/` (owner-2026-11-19-1216.txt, owner-2026-11-19-1259.txt).

- Name: **Seriat** (owner, Nov 19 13:06Z: "seriat is good to go"). The code files are named for it too (owner, Nov 22 13:24Z: "File names for seriat get corrected to Seriat"): `js/seriat.js` values, `js/seriatrun.js` statements, `js/seriatbox.js` the boxes, `js/sbseriat.js` NPC brains, `js/seriatwin.js` the n window, `js/seriathelp.js` its help folder.
- Owner: "this code is like math, components give rise to new logical possibilities ... Make sure to test
  possibilities of the code."
- Built so far: sections 0 to 6, 8, 9 (logic words), 10 and 14, in `js/seriat.js` (values, line rules, limits) and
  `js/seriatrun.js` (statements, parts A to C, Nov 19). The boxes, the files, Check and Run in the n window all use
  them (`js/seriatbox.js` reads plain values itself and compiles the rest). Part D (`js/sbseriat.js`): a spawn's Brain
  box names a file; the file and the files it uses go to the room (`s.nb`), the host runs one brain per file, and its
  NPCs' when/every, go/attack/flee, say and stats come from it; print and mistakes go to `s.nbo`, shown in the n
  window. `hitbox` (in percent, 10% to 300%, 100% as it was; was 0.1 to 3 until V102) makes an NPC bigger to hit and its claw reach further. Readings taken where the rules didn't say: `1.*` is 1.0 to
  1.9 (`*` includes 0, owner 12:59Z); side by side groups take turns in a shuffled order, one pick from each; a
  program keeps its place in its orders between spawns, shared by every box with the same text. Line rules: the
  quotes are only marks (`\'a2 rm0'\` = `\''a2'rm0'\`); a rule's value covers every number it can give; with the
  same number of `!` the later rule wins; a `!` rule without `lin` is for the whole file, lines before it too; a
  replay keeps the orders where they were; `lim` sets the top only (the stat's lowest stays). Statements: inside
  double quotes every let/for/def name is worked out, so `say "rage is rage"` says "7 is 7" (write
  `say 'rage is ' rage`); `let` works its value out once, when it runs; `for n in 3` is 1 to 3, `for n in [2,4]` is
  each; `attack`/`flee` with no one named mean the nearest duck; `team` is the NPCs the file runs.
- **Distances are tiles** (owner Nov 21 19:13Z: one unit, tiles, everywhere players see a distance; B0, Adam's (a)):
  `when near`, the `\move\` legs and a zone's `size` read tiles, four to a duck length; touching is 4 tiles, as
  before. Files written before this read 4 times shorter (no rewriting of saved files).
- Marks: **[open]** = not settled yet; **[proposal]** = Adam's idea, the owner hasn't said yes.

## 0. Reading a file
- Spaces and line breaks don't change meaning: `[2, 4]` = `[2,4]` (owner 13:06Z: yes). Inside quotes in `print`, spaces
  are kept, bash style (section 10).
- `#` starts a note; the rest of the line is ignored (owner 12:59Z: yes).
- A line carries on while a bracket is still open (owner 13:43Z: yes): `{ [2,4]` then `+[1:3] }` on the next line
  = `{ [2,4]+[1:3] }`. `{{ }}` is gone.
- A value a stat can't take stops the file with an error that says why. Never break the game.

## 1. Values
| Write | Means | Example |
|---|---|---|
| `2` | always 2 | 2, 2, 2 |
| `2:4` | a new random whole number from 2 to 4 each time (whole numbers even where the stat takes tenths) | 3, 2, 4 |
| `2,4` | 2 or 4, true random | 4, 4, 2 |
| `1.5:2.4` | every tenth from 1.5 to 2.4: 1.5, 1.6 … 2.4 (owner, Nov 21: a range with a decimal end goes through every tenth) | 1.8 |
| `1.0:*` | 1.0 to 9 | 6.3 |
| `1.0:1.*` | 1.0 to 1.9 (how to write a tenths range) | 1.4 |
| `1.[0:9]`, `1.[0:*]` | 1 and a tenth digit 0 to 9 | 1.0 to 1.9 |
| `1.*` | 1.0 to 1.9 (the asterisk is one digit, 0 included) | 1.7 |
| `*.*` | a digit and a tenth digit | 4.2 |
| `t`, `f` | true, false | |

The `.` puts what follows in the tenths place. A range with a decimal end (`1.5:2.4`, `1.5:2`) goes through every
tenth between its ends, the ends included. Whole-number stats (spawn limit, counts) take whole numbers only.
HP, damage and speed take tenths.

## 2. Order and repeats
- No arrow: true random.
- `2>4`: the listed values in order, 2 then 4 (not every number between). `2<4`: the other way.
- An arrow first fixes the start: `>2>4>5` always starts at 2 (2, 4, 5, 2 ...). `2>4>5` starts at a random one and
  goes on in order. Built reading (not settled by the owner): `<2<4<5` always starts at 5 and goes 5, 4, 2, 5 ...
- `|`: everything before it finishes before what comes after it plays.
- Repeats, the count between backslashed arrows, then `||`: `\>2>\||` (ascending, 2 times), `\<2<\||` (descending),
  `\>n>\`, `\>*>\` (count from input), `\>>\||` (repeat in order).
- `[1,3][2,4]<`: start from the right. `[1,3][2,4]\<!<\`: keep going through every group instead of starting over.
- Side by side, `[ ]` and `( )` groups are picked in random order unless arrows say otherwise.
- `$` no longer means a random pick across `|` (see section 5 for its new meaning).

## 3. Brackets
| Write | Means | Example |
|---|---|---|
| `( )` | work this out first, as in math | `(2:4)+1` = 3 to 5 |
| `[ ]` | take ONE pick from inside, then move on | `>[2,4]>[3]` = 2 or 4, then 3 |
| `{ }` | wait until everything inside is defined. With `=` after it, the result becomes an input for later; without, it gives one of the numbers inside. Each run starts it over unless something inside repeats it | `{[2,4]='2*'}` |
| `(( ))` | set a thing to a number | `((hp 5))` = HP becomes 5 |

## 4. Math
- `+` add, `-` subtract, `/` divide, `^` power: `[6,10]/2` = 3 or 5; `[3,6]^2` = 9 or 36.
- Multiply with double quotes: `"[1,5]2"` = `"2[1,5]"` = 2 or 10. `"{1.[0:*]}2"` doubles a tenths number.
- Comparing (in `if`): inside backslashes, `<` and `>` mean less than and more than: `\if hp < 5\` (owner 13:06Z).
  Outside backslashes they stay arrows.

## 5. Asterisks: input
- `~` means "about" (owner 13:36Z: "i rly like ur idea for ~"): `~10` is 9 to 11 (give or take a tenth),
  `~1.5` is 1.4 to 1.6.
- `*` waits for input. With none, it is a random value within its digits and the stat's limit.
- One `*` is one digit, `**` two, `***` three. `*` includes 0 by default (0 to 9) (owner 12:59Z).
- Too many digits: cut from the front by default (150 into `**` gives 50). `\'ainc mormax'\`: top out instead (99).
- Too small: **[proposal, owner 13:06Z: yes]** a number below what the asterisk allows (e.g. -3 into a plain `*`) loses
  its sign by default (3); `\'ainc mormini'\` raises it to the lowest allowed instead (0).
- Negative asterisks: `-*` is a negative digit (-9 to 0). `\'ainc negbrahm'\` lets an asterisk go below zero;
  `\'ainc posbrahm'\` lets a `-*` give positives (named after Brahmagupta and Brahma).
- `$` is a letter, as `*` is a digit (owner 13:32Z): `$` = one random letter a to z, `$$` two, `$$$` three. Waits
  for input like `*`. Named the same way: `'1$'`. Mixed: `say "zombie $$*"` might say "zombie qe7".
  Lower case by default; `\'ainc caps'\` lets capitals in (owner 13:36Z: yes). Caps reaches `$` letters inside `say "..."` text too (V168).
- Named asterisks, single quotes: `'1*'` is asterisk number 1, `'2***'` asterisk number 2 with three digits. The number
  in quotes names it and is never part of the value. Double quotes are math, never names. `'*1'` means the same as `'1*'`
  (owner 23:17Z, final: keep both forms).
- `=` binds: `[2,3,5]=*+*` picks 2, 3 or 5, calls it `*`, result `*+*` (3 gives 6).
- The owner's example: `{\>1,2>\[2,[3>5],5]}='1*'\>>\||{[2,4]='2*'}\>>\||'1*'+'2*'='3*'`. The first group plays once
  or twice and gives 2, 3, 5 or 5 (`'1*'`); then 2 or 4 (`'2*'`); their sum is `'3*'`, the spawn's HP.
- `{[6,10]/2}='1*'\>>\||{"2['1*']"}`: 3 or 5, doubled.

## 6. Line rules: `\ ... \` at the start of a line
| Write | Means |
|---|---|
| `\'inc0'\` | this line may give 0 |
| `\'rm0'\` | 0 may never come out: replay the line until it doesn't (stop after 1,000 tries; then the NPC doesn't spawn and an error says why) |
| `\'rm**'\`, `\'rm**:****'\` | no 2-digit results; no 2- to 4-digit results |
| `\'ainc0'\`, `\'arm0'\` | asterisks only |
| `\''a2'inc0'\` | asterisk 2 only |
| `\'n1:4'''a2'inc0'\` | lines 1 to 4 only (any Seriat value can pick the lines: `'n[1,5,[1:4]]'`) |
| `\!'inc1'\` | the whole file. More `!` wins: `\!!'inc1'\` beats `\!'rm1'\` |
| `\lin!!'inc1'\` | `lin` = the given lines (not the whole file) at strength `!!`; saves retyping a rule on several lines. `!` before `lin` makes those lines override earlier overrides and settings (owner 12:59Z) |
| `\!a2'rm{3,[2:5]}'\` | rule values can be Seriat too |
| `\rm'lim'\` | no limit on this line (hidden cap 1,000,000) |
| `\inc'lim=25'\`, `\inc'lim=***'\` | this line's limit is 25; at most 999 |
| `\'ainc mormax'\`, `mormini`, `negbrahm`, `posbrahm` | section 5 |

**[open]** The quotes still move around between forms (`\'inc0'\` vs `\inc'lim=25'\`); Adam suggested one shape.
Math on `!` (owner 23:17Z, final): a rule's strength can be a Seriat value in brackets, `\lin["**"=!]'inc1'\` (strength
10 to 99; a trailing `=!` is optional). The value is worked out once, with a fixed seed, into a whole number >= 0; it
must be a number.

## 7. Param files
A file whose first line is `\\param\\` sets rules for every Seriat file. `\\param1\\`, `\\param2\\` ... set the
order. Reachable from Game settings (g) and the Seriat window.
Built (V168): a param file's rules count as `scope: file` rules for every other file of the same player (NPC brains,
zone files, files run from the shell). They never reach another player's files (`~Pat/...` uses Pat's own param
files). Lower numbers first; a file's own rules beat a param file's at the same strength. A param file with mistakes
is skipped (its own Check says where).

## 8. Limits per stat
Owner 13:44Z: "Limits are set automatically if the player DOESNT define them themselves, and a help file says the limits
and points to the help file on how to fix them". So: each stat has a preset limit (the game's normal ones, e.g. HP up
to Mad God Justin's highest HP, speed 0 to 5, spawn limit 1 to 100; owner Nov 20 17:25Z: zero is a real value, speed 0 stays put and is never pushed aside, damage 0 hurts nobody); a player's own `\inc'lim=..'\` or
`\rm'lim'\` replaces it. The help folder has a `limits` page listing every preset limit, which points to the page on
changing them (line rules). A "past the limit" error names the stat and the limit and points to the same page.
Built (V168): asterisks pick within the stat's box (HP 0.1 to 1000 in tenths). In NPC brains (`((hp 50))`,
`((speed 3))`), a value past the stat's limit stops that line with "Past the limit: speed 5 at most (it gave 50). See
help/limits.txt"; a line's own `\inc'lim=..'\` or `\rm'lim'\` (or a param file's) moves or lifts it. Zone files
may set zone words (squares, size) at their top level, outside any `when`. `for i in n` over a name holding a number
counts 1 to n.

## 9. Where code runs
Files run from the Run button, a shell command, or attached/imported in g; a shell command can stop them. No separate
numerat mode in the terminal. Logic words: and, or, not, nand, xor.

## 10. print
`print "Hello, world!"` and `print 'Hello, world!'`, quotes and spaces as in bash. Usable in scripts and in events for
builds (spawns, entities ...).

## 11. The n window
Line numbers always; no wrap unless Wrap is on; autocomplete on by default; Run, plus Check (finds mistakes without
running); a read-only `help/` folder (simple to complex pages, by principle and operator; can't be copied, deleted or
changed); its terminal is the full command line. Help pages cover only what's built.

## 12. Speed
Each file is turned once into a small plan when saved, so a spawn only follows a few quick steps. Plain JavaScript;
WebAssembly only if measuring with 800 NPCs shows it's needed.

## 13. Still open
1. One shape for line rules? 2. Limits (section 8). 3. The owner's long
example `\>[*+0:*]=*>\[2,4]\>>\||[5,7,9],[3,5]\>*-[1,2]>\||10`, Adam's reading: a count from 0 to a random digit,
cycling `[2,4]` that many times, then `[5,7,9]` or `[3,5]` a digit minus 1 or 2 times, 10 times.

## 14. NPC brains and joining files (owner said yes, Nov 19 13:21Z)
Every Seriat value works anywhere a number goes below: `wait 1:3`, `every [2,4]s`, `when near duck '1*'`.
1. **Events**, code that runs when something happens: `when spawn`, `when hit`, `when dead`, `when near duck 12` (tiles),
   `when touch`, `every 2s`. Owner: "Code for more, like hitbox of duck for example": every stat of a duck or NPC can be
   read and set by name, its hitbox too: `((hitbox 150%))` (= `((hitbox 150))`), `\if hitbox > 200\` (in percent, 10% to 300%,
   owner 15:52Z: bigger to hit, longer reach; a percent here is of its usual size, not of its most; live V102). Another NPC's stat is `z hp` with `z` from a loop: `for z in team ((z hp z hp+1))` (live V99).
   **[open]** the full list of stats.
   Groups (Phase 5, owner Nov 19: "a way to say 100%", "It should just be called regen HP. Or regen stamina"):
   `((hp 100%))` already fills HP to its most. New stat `regen hp`: HP back each second, up to its most
   (0 to 100, 0 stops it). Stamina is only the players' (an NPC has none), so
   "regen stamina" is a group setting, not a stat (sbgroups.js). V168: written `regen hp` as the owner named it
   (`((regen hp 2))`, `\if regen hp > 0\`, `z regen hp`); `regen` alone still reads (files written before).
2. **Actions**: `go nearest duck`, `attack`, `flee`, `wait 1.5`, `say "hi"` (quotes as in print). Moves: `\move\{ ... }` (section 18).
3. **Who**: `me`, `nearest duck`, `all zombies`, `team`: what an action or a stat applies to.
4. **Chance in percent** (owner 13:32Z: "uses percentage with percent sign"; replaces the `~` weights):
   `[attack 75%, flee 25%]` attacks 3 times in 4. Percents take any Seriat value: `[attack 60:80%, flee 20%]`.
   Under 100% in all: the rest is "do nothing". `30%` alone is true 3 times in 10.
   On a stat, a percent is of its most, and can go past 100%: `((hp 50%))` = half the most HP, `((hp 150%))` = 1.5
   times (still inside the stat's limit).
   Over 100% (owner 13:38Z: yes; no `%%`): A pick over 100% in
   all is read as shares: `[attack 150%, flee 50%]` = 3 to 1. A chance alone over 100% means "more than once":
   `150%` = once for sure, plus a 50% chance of a second time (`250%` = twice, plus 50% of a third). Kept to `[ ]`: a chance pick is still one
   pick; `( )` works a thing out and `{ }` waits. Any action takes a percent in a pick, say too: `[say "y" 30%, say "n" 20%]` (V169).
5. **Named values**: `let rage = 2:4`, then `rage` anywhere a number goes. Every Seriat principle applies to them
   (owner: "allow the seriat principles to apply to variables"): `let rage = \>1>\[2,4]`, `rage^2`, `"2rage"`.
   **[open]** owner answered "sure???"; explained again in chat.
6. **Reusable blocks**: `def charge { ... }`, then `charge` runs it. `stop` ends a block early.
7. **Joining files**: `use 'zombie-base'` pulls in another file's values and blocks; `give rage` / `take rage` share a
   value between files while the game runs.
8. **Tests**: `\if hp in 1:5\` and `else`.
9. **Loops** (owner 13:41Z: yes): `for z in all zombies { ((z speed ~1.2)) }`, `for n in 1:5 { say "wave n" }`
   (any Seriat value as the range), `while \hp < 5\ { flee }`. Every loop stops after 1,000 rounds with an error,
   so a mistake can't freeze the game. The value repeats (`\>3>\||`) stay for values.
10. **Equal, not equal** (owner 13:52Z: yes to all 7 basics): inside `\if ...\`, `==` is equal and `not` is not equal:
    `\if hp == 5\`, `\if hp not 5\`. (`=` stays "name this".)
11. **Rounding**: `round 2.5` (3), `up 2.1` (3), `down 2.9` (2).
12. **Smallest, biggest, leftover**: `min 3 hp`, `max 1 speed`, `mod`: `\if spawned mod 3 == 0\` = every 3rd spawn.
13. **Blocks with inputs**: `def hurt(n) { ((hp hp-n)) }`, then `hurt 3`.
14. **Text with values**, bash style: inside double quotes in `print`/`say`, asterisks, `$` letters and named values
    are worked out (`say "zombie $$*"` might say "zombie qe7"; every name is worked out too, so `say "rage is rage"` says "7 is 7"); inside single
    quotes the text stays exactly as typed (`say 'zombie $$*'` says "zombie $$*"). To keep a word, put it in single quotes and the value beside it: `say 'rage is ' rage`. After `print`/`say`, quotes are text; everywhere else double quotes still multiply.
15. **Same random every run**: `seed 42`. Without it, random as usual.
16. **Built-in names**: `wave` (Dead Ducks Arcade's round number, the owner's word; `round` is taken by rounding),
    `time`, `alive`, `dead`, `spawned`. `hppct` is an NPC's own HP as a percent of its most (30 means under a third), read inside a `when`: `\if hppct < 30\` (owner Nov 19 21:59Z, "change that to a percentage"; a plain `hp < 30%` would be read as a chance).
    Files end in `.se` (the owner's, Nov 19 21:59Z); old `.num` files still open.

17. **Zones** (owner Nov 20 03:10Z: yes): a zone's Brain box takes a file that runs for the zone and moves its squares
    (its Potential order). Events: `every [2,4]s step`, `when enter step 2` (a player steps in), `when spawn step` (one
    of its tabs made something in it). Words: `step` / `step n`, `squares 3:5` (squares at once), `size 6` (square
    size, tiles), `order shuffle` (random, absolute, shuffle, shuffleonce, rows, columns, line, alternating, all; absolute and the extra shuffles from V141), `dir right` (right, left, up, down,
    upright, upleft, downright, downleft, none); at a file's top they're for every zone that names it. Names inside a
    when: `steps`, `squares`, `size`, `inside` (players standing in it). Any file reaches a zone by its variable name:
    `((zone 'Pit' size 8))`, `\if zone 'Pit' steps mod 3 == 0\`. Live V136.

## 16. Worked examples (Adam, Nov 19 13:25Z, in the owner's style)
1. Speed that sticks per NPC: `{1.0:1.*}='1*'\>>\||"['1*'][1,2]"`: picks 1.0 to 1.9 (asterisk 1), then times 1 or 2,
   so 1.0 to 3.8.
2. HP in waves: `>[3,5]>[6:8]>[10,12]\>2>\|| | [20:25]`: spawns 1 to 3 get 3 or 5, then 6 to 8, then 10 or 12; that
   plays twice (6 spawns), then every later spawn gets 20 to 25.
3. Negatives with no zero: `\'ainc negbrahm'\ \'arm0'\ *+10`: the digit goes -9 to 9 but never 0, plus 10, so 1 to 19
   but never 10.
4. A file rule and a line that beats it:
   ```
   \!'rm1'\                # no 1 anywhere in this file
   [1:5]                   # 2 to 5
   \lin!!'inc1'\ [1:5]     # 1 to 5: !! beats !
   ```
5. A zombie brain:
   ```
   use 'zombie-base'
   let rage = {[1,2]+[0:*]}
   when spawn ((hp "2rage"))
   when hit [attack 75%, flee 25%]
   when near duck 3 { \if hp < 5\ flee else go nearest duck }
   every [2,4]s say "brains"
   give rage
   ```
   Rage is 1 to 11. HP is twice the rage. When hit, it attacks 3 times in 4 and flees the rest. Near a duck, under
   5 HP it runs, otherwise it chases. Every 2 or 4 seconds it says "brains". Other files can take its rage.

## 17. Seriat boxes in a zone's Act (owner, Nov 20 17:25Z; built by Solomon)
Owner: "act should be a thing in algorithim ... seriat (this is on the top of the list / seriat shows a box, then another
box appears below it, and it is a dropdown list ... seriat box input can be added again or multiple options can be
selected / the seriat boxes that await input has a small input button on the right for importing files".
Built: a zone's potential order starts with Act (Seriat, Damage, Heal, Kill, Nothing; it replaced "What it does", same
saved field `fx`). Seriat shows boxes, each a value (any Seriat value, tenths, -1000 to 1000) with "Acts on" under it
(HP, Speed, Damage, Regen HP each second, Hitbox %). Each step, for who the zone hits: HP gains the value (below 0:
loses it); the others become the value and stay so (NPCs; a duck's Speed is its walk). "+" adds a box; the import
button fills a box with the first value line of one of the player's files. Saved as one box `sa`: a line per box,
value, tab, the picked names.

## 18. Moves: `\move\{ ... }` (owner, Nov 20 07:41Z idea, 18:46Z rules; built by Solomon)
Owner (07:41Z): "a movement code for the brain ... One notation begins the movement, the other notation closes the
movement ... The numbers can indicate things like speed. The pointers can indicate directions ... when there is
destination ... that movement has a pattern it obeys ... Either left or right on the way to said end goal."
Owner (18:46Z): "there is no up or down arrows on normal keyboards ... Up = /\ Down = \/ ... a setting or variable that
changes if the direction bends in a smooth bow, a weave, a shot, or a sharp dog leg, or even like all three ... I do the
arrow into one given movement, let's say dog leg, and it has to play that 3 times before it does the next within its
movement pattern."
Built (help file `help/brains/move.txt`, example `help/examples/weaver.se`):
1. **The block**: `\move\{ ... }` inside an NPC's `when`/`every`; `\move\` with no `{` takes the rest of its line. Parts
   inside go with `;` or a new line between. `#` notes work inside.
2. **Arrows**: `>` right, `<` left, `/\` up, `\/` down. Arrows together make one slanted leg (`>/\2` = 2 right and 2 up);
   `>>` is two right. A number after them is tiles (1 when none; a duck is 4 tiles long); any Seriat value works, in `( )` when it has
   more than one piece: `>(1+1)`, `>rage`, `>2:4`. Legs go in order: `>3 \/2 <3 /\2` walks a box and comes home.
3. **`to <who>`** (`to nearest duck`, `to me`, a for's name, `to zone 'Pit'`): the way there is cut into one part per leg,
   and each leg pushes its part that far to that side (`/\12` = 12 tiles above the straight way); it still arrives.
   `-` is a part with no push (`-2`: two). With no legs it walks straight there.
4. **`@n`**: the move at n times the NPC's speed (`@1.5`).
5. **Bends** (`bend ...`, a part of the move, or a line of its own for every move after it: at a file's top for all its
   NPCs, inside a `when` for that NPC): `shot` (or `straight`, number 1), `bow` (2), `weave` (3), `dogleg` (4), `mix`
   (bow, weave, dogleg in turn). Sequenced with `x` or `times`: `bend dogleg x3, weave` = 3 doglegs, then a weave, then
   again, one bend per leg. A name or value works for the kind (`let style = 2`, `bend style`) and the count.
   Shapes, with no `to`: shot straight; bow curves out to the right of its way by a quarter of the leg; weave goes out
   and back across (an S, a sixth); dogleg one sharp corner (an L). With `to`: shot goes straight to the pushed spot and
   on; bow curves through it; weave goes out that way and back across the other; dogleg steps out first, then cuts
   across. Default bend: shot.
6. **Running**: the move comes before the NPC's `go`/`attack`/`flee`, which goes on when the move ends; a new move takes
   over one still going. A spot it gets no nearer to for 1.2 s (a wall, Speed 0) is skipped. The board never lets it
   walk off the edge. Not in boxes (a value line), only in brains.
**[open]** whether the owner wants the arrows relative to the NPC's way (left/right of travel) instead of the screen;
built as the screen (`/\` is always up).

## 19. Shuffle and escape (owner, Nov 21 16:29Z, 16:34Z, confirmed 16:38Z; settled, NOT built yet: plan step 5)
Shuffle = the bag: each value plays once, in a random order, then they all shuffle again.
| Write | Means |
|---|---|
| `2;4;6` | a shuffled "or": 2, 4 and 6 each once in a random order, then again (a comma is plain random) |
| `[2;4;6]` | the bag inside a bracket: each visit takes the next one; no repeat until all are used |
| `2;:6`, `2:;6` | every number 2 to 6 once, shuffled (`;` on either side of the colon) |
| `2:6;8` | a shuffled pick between "one from 2:6" and 8 |
| `2,4;6` | `;` binds tighter than `,` (owner 16:34Z): 2, or the bag of 4 and 6 (when the bag gave 4, it gives 6 next) |
| `\;\` | shuffle every true random after it on the line, ranges too; parts written with arrows keep their order |
| `\;3\` | the number is how many full passes through the bag before it goes back to plain random (owner: yes) |
| `\;>\`, `\<;\` | arrows inside: shuffle what comes after / before it, through every `\|` on the line |
| `>\;\` | an arrow outside: the same, but it stops at the next `\|`, as everything else does |
| `\;!\` | the whole file or box; more `!` is stronger, as in line rules |
| `\esc\` | leave the bracket it's in at once (any case: `\ESC\`) |
| `\esc2\` | leave two brackets (the number only after `esc`, never before) |
| `\esc!\` | leave every bracket it's in (absolute: not "the most", not "forever") |
- Leaving a repeat (`\>>\||`) ends the repeat and goes on after it. Leaving `{ }=` keeps what was picked before.
- The bag keeps its place between spawns, as arrows do.
- `?` stays free for a later use.
