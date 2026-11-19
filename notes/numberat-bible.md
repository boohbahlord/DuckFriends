# The Numberat bible

The language as it stands now: every rule, operator and example in one place, with the newest answer folded in.
This is the source of truth for Claude. When the owner settles something, update this file the same day and drop the
old wording; history and word-for-word quotes live in `notes/agree-or-disagree.md` and
`/mnt/project-files/sandbox/numerat/` (owner-2026-11-19-1216.txt, owner-2026-11-19-1259.txt).

- Name: **Numberat** (owner, Nov 19 13:06Z: "numberat is good to go"). Code names (`js/numerat.js`, `numeratwin.js`) stay.
- Owner: "this code is like math, components give rise to new logical possibilities ... Make sure to test
  possibilities of the code."
- Built so far: sections 0 to 5 and the percent picks (14.4), in `js/numberat.js` (part A, Nov 19). The boxes, the
  files and Check in the n window all use it (`js/numerat.js` reads plain values itself and compiles the rest). Next:
  line rules and limits (part B), then section 14 (part C). Readings taken where the rules didn't say: `1.*` is 1.0 to
  1.9 (`*` includes 0, owner 12:59Z); side by side groups take turns in a shuffled order, one pick from each; a
  program keeps its place in its orders between spawns, shared by every box with the same text.
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
| `1.0:*` | 1.0 to 9 | 6.3 |
| `1.0:1.*` | 1.0 to 1.9 (how to write a tenths range) | 1.4 |
| `1.[0:9]`, `1.[0:*]` | 1 and a tenth digit 0 to 9 | 1.0 to 1.9 |
| `1.*` | 1.0 to 1.9 (the asterisk is one digit, 0 included) | 1.7 |
| `*.*` | a digit and a tenth digit | 4.2 |
| `t`, `f` | true, false | |

The `.` puts what follows in the tenths place. Whole-number stats (spawn limit, counts) take whole numbers only.
HP, damage and speed take tenths.

## 2. Order and repeats
- No arrow: true random.
- `2>4`: the listed values in order, 2 then 4 (not every number between). `2<4`: the other way.
- An arrow first fixes the start: `>2>4>5` always starts at 2 (2, 4, 5, 2 ...). `2>4>5` starts at a random one and
  goes on in order.
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
  Lower case by default; `\'ainc caps'\` lets capitals in (owner 13:36Z: yes).
- Named asterisks, single quotes: `'1*'` is asterisk number 1, `'2***'` asterisk number 2 with three digits. The number
  in quotes names it and is never part of the value. Double quotes are math, never names. (Keep `'1*'`; `'*1'`
  **[open]**, Adam suggested dropping it.)
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
| `\'n1:4'''a2'inc0'\` | lines 1 to 4 only (any Numberat value can pick the lines: `'n[1,5,[1:4]]'`) |
| `\!'inc1'\` | the whole file. More `!` wins: `\!!'inc1'\` beats `\!'rm1'\` |
| `\lin!!'inc1'\` | `lin` = the given lines (not the whole file) at strength `!!`; saves retyping a rule on several lines. `!` before `lin` makes those lines override earlier overrides and settings (owner 12:59Z) |
| `\!a2'rm{3,[2:5]}'\` | rule values can be Numberat too |
| `\rm'lim'\` | no limit on this line (hidden cap 1,000,000) |
| `\inc'lim=25'\`, `\inc'lim=***'\` | this line's limit is 25; at most 999 |
| `\'ainc mormax'\`, `mormini`, `negbrahm`, `posbrahm` | section 5 |

**[open]** The quotes still move around between forms (`\'inc0'\` vs `\inc'lim=25'\`); Adam suggested one shape.
**[open]** `\lin["**"=!]'inc1'\` (math on `!`) has no clear meaning yet.

## 7. Param files
A file whose first line is `\\param\\` sets rules for every Numberat file. `\\param1\\`, `\\param2\\` ... set the
order. Reachable from Game settings (g) and the Numberat window.

## 8. Limits per stat
Owner 13:44Z: "Limits are set automatically if the player DOESNT define them themselves, and a help file says the limits
and points to the help file on how to fix them". So: each stat has a preset limit (the game's normal ones, e.g. HP up
to Mad God Justin's highest HP, speed 0.1 to 5, spawn limit 1 to 100); a player's own `\inc'lim=..'\` or
`\rm'lim'\` replaces it. The help folder has a `limits` page listing every preset limit, which points to the page on
changing them (line rules). A "past the limit" error names the stat and the limit and points to the same page.

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
1. `'*1'`: keep or drop? 2. One shape for line rules? 3. Math on `!`? 4. Limits (section 8). 5. The owner's long
example `\>[*+0:*]=*>\[2,4]\>>\||[5,7,9],[3,5]\>*-[1,2]>\||10`, Adam's reading: a count from 0 to a random digit,
cycling `[2,4]` that many times, then `[5,7,9]` or `[3,5]` a digit minus 1 or 2 times, 10 times.

## 14. NPC brains and joining files (owner said yes, Nov 19 13:21Z)
Every Numberat value works anywhere a number goes below: `wait 1:3`, `every [2,4]s`, `when near duck '1*'`.
1. **Events**, code that runs when something happens: `when spawn`, `when hit`, `when dead`, `when near duck 3`,
   `when touch`, `every 2s`. Owner: "Code for more, like hitbox of duck for example": every stat of a duck or NPC can be
   read and set by name, its hitbox too: `((hitbox 1.5))`, `\if hitbox > 2\`. **[open]** the full list of stats.
2. **Actions**: `go nearest duck`, `attack`, `flee`, `wait 1.5`, `say "hi"` (quotes as in print).
3. **Who**: `me`, `nearest duck`, `all zombies`, `team`: what an action or a stat applies to.
4. **Chance in percent** (owner 13:32Z: "uses percentage with percent sign"; replaces the `~` weights):
   `[attack 75%, flee 25%]` attacks 3 times in 4. Percents take any Numberat value: `[attack 60:80%, flee 20%]`.
   Under 100% in all: the rest is "do nothing". `30%` alone is true 3 times in 10.
   On a stat, a percent is of its most, and can go past 100%: `((hp 50%))` = half the most HP, `((hp 150%))` = 1.5
   times (still inside the stat's limit).
   Over 100% (owner 13:38Z: yes; no `%%`): A pick over 100% in
   all is read as shares: `[attack 150%, flee 50%]` = 3 to 1. A chance alone over 100% means "more than once":
   `150%` = once for sure, plus a 50% chance of a second time (`250%` = twice, plus 50% of a third). Kept to `[ ]`: a chance pick is still one
   pick; `( )` works a thing out and `{ }` waits.
5. **Named values**: `let rage = 2:4`, then `rage` anywhere a number goes. Every Numberat principle applies to them
   (owner: "allow the numberat principles to apply to variables"): `let rage = \>1>\[2,4]`, `rage^2`, `"2rage"`.
   **[open]** owner answered "sure???"; explained again in chat.
6. **Reusable blocks**: `def charge { ... }`, then `charge` runs it. `stop` ends a block early.
7. **Joining files**: `use 'zombie-base'` pulls in another file's values and blocks; `give rage` / `take rage` share a
   value between files while the game runs.
8. **Tests**: `\if hp in 1:5\` and `else`.
9. **Loops** (owner 13:41Z: yes): `for z in all zombies { ((z speed ~1.2)) }`, `for n in 1:5 { say "wave n" }`
   (any Numberat value as the range), `while \hp < 5\ { flee }`. Every loop stops after 1,000 rounds with an error,
   so a mistake can't freeze the game. The value repeats (`\>3>\||`) stay for values.
10. **Equal, not equal** (owner 13:52Z: yes to all 7 basics): inside `\if ...\`, `==` is equal and `not` is not equal:
    `\if hp == 5\`, `\if hp not 5\`. (`=` stays "name this".)
11. **Rounding**: `round 2.5` (3), `up 2.1` (3), `down 2.9` (2).
12. **Smallest, biggest, leftover**: `min 3 hp`, `max 1 speed`, `mod`: `\if spawned mod 3 == 0\` = every 3rd spawn.
13. **Blocks with inputs**: `def hurt(n) { ((hp hp-n)) }`, then `hurt 3`.
14. **Text with values**, bash style: inside double quotes in `print`/`say`, asterisks, `$` letters and named values
    are worked out (`say "zombie $$*"` might say "zombie qe7"; `say "rage is rage"` says "rage is 7"); inside single
    quotes the text stays exactly as typed (`say 'zombie $$*'` says "zombie $$*"). A value can also sit outside the
    quotes: `say "rage is " rage`. After `print`/`say`, quotes are text; everywhere else double quotes still multiply.
15. **Same random every run**: `seed 42`. Without it, random as usual.
16. **Built-in names**: `wave` (Dead Ducks Arcade's round number, the owner's word; `round` is taken by rounding),
    `time`, `alive`, `dead`, `spawned`.

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
