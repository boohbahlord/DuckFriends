# Numerat: the language (working notes)

Sources, newest wins: the owner's file (`/mnt/project-files/sandbox/sandbox-mode-rules-clean.txt` lines 74-140,
175-177, 293-305), the owner's answers of Nov 19 10:22Z and 10:30Z, and the owner's long notation message of Nov 19
12:16Z (word for word in `/mnt/project-files/sandbox/numerat/owner-2026-11-19-1216.txt` and at the end of
`notes/agree-or-disagree.md`). Owner: "this code is like math, components give rise to new logical possibilities ...
Make sure to test possibilities of the code." Status: notation still being settled with the owner; only the plain
values (part 1) are built (`js/numerat.js`). Owner 12:59Z: "we need more discussion prob since numerat is a big deal"
(answers word for word in `/mnt/project-files/sandbox/numerat/owner-2026-11-19-1259.txt`). Section 14 holds those
answers; they win over anything above.

## 1. Values
| Write | Means |
|---|---|
| `2` | always 2 |
| `2:4` | a random number from 2 to 4, picked again each time. Whole numbers only, even where the stat takes tenths |
| `2,4` | 2 or 4, true random |
| `0 or *`, `0:*` | ways to let 0 in where `*` alone wouldn't |
| `1.[0:9]`, `1.*`, `*.*` | tenths: the `.` puts what follows in the tenths place. `1.*` = 1.1 to 1.9 |

A box for a whole-number stat takes whole numbers only. A file that gives a stat a value it can't take stops with an
error that says why (owner 10:22Z, answer 3).

## 2. Order and repeats
- No arrow: true random. `2>4` = 2 for the first spawn, 4 for the next (the listed values, not every number between).
  `2<4` the other way.
- An arrow first fixes the start: `>2>4>5` always starts at 2; `2>4>5` starts at a random one and goes on in order.
- `|`: everything before it finishes before what comes after it plays (kept, owner 10:30Z).
- `||`, and the repeat count now written between backslashed arrows: `\>2>\||` (ascending, 2 times), `\<2<\||`
  (descending), `\>n>\`, `\>*>\` (a count from input). Replaces the old `>>2||` / `<<2||`.
- `$` is gone (owner 10:30Z: "sure").
- `[1,3][2,4]<` starts from the right. `\<!<\` keeps going through every group instead of starting over.

## 3. Brackets
| Write | Means |
|---|---|
| `( )` | work this out first, as in math: `(2:4)+1` (owner 10:30Z, C: "Okay") |
| `[ ]` | take ONE pick from inside, then move on: `>[2,4]>[3]` = 2 or 4, then 3 |
| `{ }` | wait until everything inside is defined. Followed by `=`, its result becomes an input for later; without `=`, it gives one of the numbers inside. Each run starts it over unless something inside repeats it |
| `(( ))` | sets a thing to a number: `((hp 5))` = HP becomes 5 (kept, owner 10:30Z) |
| `{{ }}` | everything between, over several lines, counts as one line |

Side by side, `[ ]` and `( )` groups are picked in random order unless arrows say otherwise.

## 4. Math
`+` add, `-` subtract, `/` divide, `^` power (`[3,6]^2` = 9 or 36), and multiplication in double quotes:
`"[1,5]2"` = `"2[1,5]"` = 2 or 10. A number that doesn't fit its asterisks is cut to fit (owner: "the amount of
asterixes cutoff additional digits").

## 5. Asterisks: input
- `*` waits for input from a file. If nothing gives it a value, it is a random digit within the stat's limit.
- One `*` is one digit, `**` two (up to 99), `***` three (up to 999).
- Zero: the owner's 12:16Z message says both "1-9" and "maybe zero is already included in asterix by default".
  Open (question 2).
- Named asterisks, in single quotes: `'1*'` (or `'*1'`) is asterisk number 1; `'2***'` is asterisk number 2, three
  digits. The number in quotes is the name, never part of the value. Double quotes are math, never names.
- `=` binds: `[2,3,5]=*+*` picks 2, 3 or 5, calls it `*`, and the result is `*+*` (3 gives 6).
- The owner's example: `{\>1,2>\[2,[3>5],5]}='1*'\>>\||{[2,4]='2*'}\>>\||'1*'+'2*'='3*'`. The first group plays once
  or twice and gives 2, 3, 5 or 5; that is `'1*'`. Then 2 or 4 is `'2*'`. Their sum is `'3*'`, the spawn's HP.

## 6. Line rules: `\ ... \` at the start of a line
| Write | Means |
|---|---|
| `\'inc0'\` | this line's asterisks may give 0 |
| `\'rm0'\` | 0 may never come out: replay the line until it doesn't. If it can't, the NPC doesn't spawn and an error says why |
| `\'rm**'\`, `\'rm**:****'\` | no 2-digit results; no 2- to 4-digit results |
| `\!'inc1'\` | for the whole file. More `!` wins: `\!!'inc1'\` beats `\!'rm1'\` |
| `\lin!!'inc1'\` | this line only, at strength `!!` |
| `\'ainc0'\`, `\'arm0'\` | asterisks only |
| `\''a2'inc0'\` | asterisk 2 only |
| `\'n1:4'''a2'inc0'\` | lines 1 to 4 only (any Numerat value can pick the lines) |
| `\rm'lim'\` | no limit on this line (hidden cap 1,000,000) |
| `\inc'lim=25'\` | this line's limit is 25 |

## 7. Param files
A file whose first line is `\\param\\` sets rules for every Numerat file. `\\param1\\`, `\\param2\\` … set the order
when there are several. Reachable from Game settings (g) and from the Numerat window.

## 8. Limits for each stat (owner: "limits are preset as usual unless player does something")
Proposed, waiting for the owner's OK: HP 0.1 to Mad God Justin's highest HP (hpOf in js/mgjrules.js with a full
room); damage 0.1 to 50; speed 0.1 to 5; spawn limit 1 to 100; time between spawns 0.5 s to 10 min.

## 9. Editor and command line
- The n window stays VS Code-like. Add: word wrap on/off at the top; colors by kind (numbers, brackets, asterisks,
  line rules, math, words); `nano <file>` in the terminal opens the same editor.
- `man numerat`, plus a man page for every command. `ls` colors files by type.
- Missing from the owner's list, worth adding in-game: less, nano, watch, du, df, ln, tar/zip (in-game files only).
  Not possible in a browser game: curl, wget, ssh, scp, rsync, git, make, gcc, python3.

## 10. Speed (owner: "i wanted it written in binary")
A browser can't run raw machine code; its fast option is WebAssembly. Plan: when a file is saved, Numerat is turned
once into a small ready-made plan (compiled), so each spawn only follows a few quick steps. Replays from `rm` stop
after 1,000 tries per line, with an error. Measure with 800 NPCs; move the runner to WebAssembly only if it's slow.

## 11. Problems found in the 12:16Z message
1. `[6,10]/2` gives 3 or 5, not "4 or 5" (the later example does say 3 or 5).
2. `\inc'lim=***\` and `\inc'lim={***+[+0,+1]}\` are missing their closing `'`.
3. In the `{{ }}` example, `("('*2')2)=` is missing its closing `"`.
4. `{\>>\{'**1'}+[+0,-1]}='2***'` gives 0 to 98 (or 99), never 100: `**` stops at 99.
5. "* could be 1-10": one digit stops at 9.
6. `1.0:*` reads two ways: 1.0 to 1.9, or 1.0 to 9.
7. The quotes move around in line rules: `\'inc0'\`, `\inc'lim=25'\`, `\!a2'rm{...}'\`, `\''a2'inc0'\`.
8. `\lin["**"=!]'inc1'\` (doing math on `!`) has no clear meaning.
9. `<` and `>` are arrows, so `if` has no way to compare ("HP is under 5").
10. "Cut to fit" is unclear: 150 into `**` could become 50 (drop the front digit) or 99 (top out).
11. With spaces allowed, `{{` and `{ {` would mean different things.
12. I couldn't read `\>[*+0:*]=*>\[2,4]\>>\||[5,7,9],[3,5]\>*-[1,2]>\||10` for sure. My reading: a count from 0 to
    a random digit, cycling `[2,4]` that many times, then `[5,7,9]` or `[3,5]` a digit minus 1 or 2 times, 10 times.

## 12. Suggestions
- Spaces and line breaks don't matter, except inside quotes. `[2, 4]` = `[2,4]`.
- One shape for every line rule: `\'<which lines> <which asterisk> <command><value>'\` with spaces, e.g. `\'inc0'\`,
  `\'a2 inc0'\`, `\'n1:4 a2 inc0'\`, `\'inc lim=25'\`, `\'rm lim'\`. File-wide = `!` in front; more `!` = stronger.
  That makes `lin` unneeded: no `!` already means this line only.
- Words for comparing, since `<` `>` are taken: `is`, `not`, `over`, `under` (`if hp under 5 ...`), next to
  and, or, nand, xor.
- `#` for a note to yourself: the rest of the line is ignored.
- Drop: math on `!` (8), the `'*1'` order (keep only `'1*'`), and the second way to write tenths (6).
- Name: the owner's file first spelled it "Numberat". Other forms: Zumberat (owner's), Numberat, Numerata. I check
  any picked name isn't already taken before switching.

## 13. Questions for the owner (short list)
1. Line rules: one shape, as in 12?
2. Does `*` include 0 by default?
3. Cut to fit: 150 into `**` becomes 50 or 99?
4. `1.0:*`: 1.0 to 1.9, or 1.0 to 9?
5. Comparing in `if` with words (`over`, `under`, `is`)?
6. A name: Zumberat, Numberat, or keep Numerat?
7. The limits in section 8.

## 14. Owner's answers, Nov 19 12:59Z (these win)
1. `lin` stays: it saves retyping a rule for several lines (not the whole file). `!` before `lin` makes those lines
   override earlier overrides or settings.
2. `*` includes 0 by default.
3. Cut to fit: 150 into `**` gives 50 by default. `\'ainc mormax'\` makes it top out instead (99). `mormini` is the
   inverse, meaning left to me. Proposal: a number too small for its asterisks (e.g. -3 into a plain `*`) loses its
   sign by default (3), the mirror of losing front digits; `mormini` raises it to the smallest allowed (0) instead.
   - `-*`: an asterisk can be made negative with the minus sign.
   - `\'ainc negbrahm'\` lets an asterisk go below zero (named after Brahmagupta and Brahma).
   - `\'ainc posbrahm'\` lets a negative asterisk `-*` give positives.
4. `1.0:*` = 1.0 to 9. Tenths are written `1.0:1.*`.
5. Comparing in `if`: owner didn't follow the question; re-explained in plain words (waiting).
6. `#` notes: yes.
7. Spaces: owner asked why they'd be ignored; explained (waiting). New: `print "Hello, world!"` / `print 'Hello,
   world!'`, quotes and spaces as in bash, usable in scripts and events (spawns, entities ...).
8. Name: owner likes "Numberat"; quick search found no software or trademark by that exact name (not a legal check).

Also asked for (n window): a help file and a read-only `help` directory (simple to complex help, by principle and
operator; can't be copied, deleted or changed), a way to test code without running it besides Run, line numbers
always shown, no wrap unless text wrap is on, autocomplete on by default, and anything the bottom-left terminal can do
works in the n terminal. WebAssembly: owner wants to know the difference it makes.
