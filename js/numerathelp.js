/* ---------- Numerat's help files (the Numerat window's read-only help/ folder) ----------
   The owner's (Nov 19 12:59Z): "the help files for numerat have a directory called "help", where simple or more complex
   help lies and their given principles or basic operators help files; the help files are text files that cannot be
   copied or deleted or changed". shell.js puts these in the Numerat folder at the start of every game (never kept in the
   profile) and refuses every change to them. Only what is built is written here: the plain values. This file has no
   imports. */
export const HELP = {
  "index.txt": `Numberat help
These files are read-only: you can read them here and with cat,
but they can't be changed, copied or deleted.

  values.txt     numbers as you write them in a box: 2, 2:4, 2,4
  tenths.txt     the boxes that take tenths
  truefalse.txt  the t and f boxes
  limits.txt     the limits every box has, and what to do past one
  ranges.txt     the colon: 2:4, 1.0:1.*
  lists.txt      the comma: 2,4
  order.txt      the arrows and |: 2>4, >2>4>5
  repeats.txt    play something again: \\>2>\\||
  brackets.txt   ( ) [ ] { }
  math.txt       + - / ^ and multiplying
  about.txt      ~10, about this much
  asterisks.txt  * is a digit, $ is a letter, '1*' names one
  chance.txt     percent picks: [3 60%, 5 40%], 30%
  asrules.txt    \\'ainc ...'\\ rules for asterisks
  window.txt     this window: files, Run, Check, wrap, autocomplete

More pages come as more of Numberat is built.
`,
  "values.txt": `Plain values

  2       always 2
  2:4     a new random whole number from 2 to 4, each time
  2,4     a new pick of 2 or 4, each time (true random)
  1,3:5   a list can hold a range: 1, or a number from 3 to 5
  4:2     the same as 2:4

A box for whole numbers takes whole numbers only.
A box that can't read what you wrote keeps its last good value
and tells you why.
`,
  "tenths.txt": `Tenths

Boxes that take tenths (speed and damage) read 0.8, 1.5 and so on.
1.25 is read as 1.3 (the nearest tenth).
0.8:1.2 picks a tenth from 0.8 to 1.2, each time.
`,
  "truefalse.txt": `True or false

The true or false boxes take t or f (true or false also work).
`,
  "limits.txt": `Limits

Every box has limits. They are set for you automatically: if you
don't define a limit yourself, the box uses the one below.

  Spawn limit                  1 to 100        (starts at 1)
  Seconds between spawns       1 to 600        (starts at 4)
  HP                           1 to 1000       (starts at 3)
  Damage                       0.1 to 100      (starts at 1)
  Speed                        0.1 to 5        (starts at 1)
  Players' HP                  1 to 100
  Players' speed               0.1 to 5
  Zone width and height        1 to 40 duck lengths (start at 4)
  Zone HP each time            0.1 to 100      (starts at 1)
  Zone seconds between         0.1 to 60       (starts at 1)
  Seconds before it comes back 1 to 600        (starts at 10)
  Seconds you keep it          0 to 600        (0 is for good)
  Damage to whoever takes it   0 to 100        (starts at 0)

Write a number past a limit and the box says "N at least" or
"N at most" and keeps its last good value. Fix it by writing a
number inside the limit. Writing your own limit will come with the
line rules; until then these are the limits.
`,
  "ranges.txt": `Ranges (the colon)

  2:4       a new random whole number from 2 to 4, each time
  1.0:1.*   a tenth from 1.0 to 1.9
  1.[0:9]   1 and a tenth digit from 0 to 9 (the same thing)

Examples
  3:6       3, 4, 5 or 6
  0.1:0.5   a tenth from 0.1 to 0.5 (in a box that takes tenths)
  4:2       the same as 2:4
`,
  "lists.txt": `Lists (the comma)

  2,4       2 or 4, a true random pick each time
  1,3:5     1, or a number from 3 to 5

Examples
  5,10,20   5, 10 or 20
  [2,4]     one pick of 2 or 4, then on to the next part
`,
  "order.txt": `Order (the arrows and |)

With no arrow, every pick is random.
  2>4       the listed values in order: 2, then 4 (not the ones between)
  2<4       the other way round
  >2>4>5    an arrow first fixes the start: 2, 4, 5, 2, 4 ...
  2>4>5     starts at a random one, then goes on in order
  |         everything before it finishes, then what comes after it

Examples
  >[2,4]>[3]   2 or 4, then 3, then 2 or 4 again ...
  >3>6|10      3, then 6, then 10 from then on
`,
  "repeats.txt": `Repeats

Between backslashed arrows, write how many times; then ||.
  >[3,5]\\>2>\\||   in order, 2 times
  \\>1,2>\\[2,4]    the count in front: play the group once or twice
  \\>>\\||          repeat in order

Examples
  >[3,5]\\>2>\\||     3 or 5, in order, 2 times
  <[3,5]\\<2<\\||     the same, descending
  >[3,5]\\>>\\||      3 or 5, then again in order
`,
  "brackets.txt": `Brackets

  ( )   work this out first, as in math: (2:4)+1 is 3 to 5
  [ ]   take ONE pick from inside, then move on: [2,4]
  { }   wait until everything inside is defined, then give its result
  (( )) set a thing to a number (comes with the game's stats)

Spaces and line breaks don't change meaning: [2, 4] is [2,4].
A line carries on while a bracket is still open.
Side by side, [1,3][2,4] take turns in a shuffled order, one pick each.
`,
  "math.txt": `Math

  +  add     -  subtract     /  divide     ^  power
  "..."      multiply, with double quotes

Examples
  [6,10]/2     3 or 5
  [3,6]^2      9 or 36
  "[1,5]2"     2 or 10
  (2:4)+1      3 to 5
`,
  "about.txt": `About (the wave)

  ~10    9 to 11
  ~1.5   1.4 to 1.6

"Around this much", without writing the range.
`,
  "asterisks.txt": `Asterisks and letters

  *      one digit, 0 to 9 (waits for input; with none, a random one)
  **     two digits
  -*     a negative digit, -9 to 0
  $      one letter a to z ($$ two, $$$ three)
  '1*'   asterisk number 1: named so it can be used again
  =      names what came before it

Examples
  [2,3,5]=*+*              2, 3 or 5, then added to itself
  {[2,4]}='1*'\\>>\\||'1*'+'1*'   2 or 4, kept as asterisk 1, then doubled
  '1$'                    a letter, named 1

A number with too many digits is cut from the front: 150 into ** is 50.
`,
  "chance.txt": `Chance (percent)

  [3 60%, 5 40%]    3 six times in ten, 5 four times in ten
  [3 60:80%, 5 20%] a percent can be a range too
  30%               true 3 times in 10
  150%              once for sure, plus a 50% chance of a second time

Examples
  [3 75%, 5 25%]    3 three times in four
  250%              twice, plus a 50% chance of a third
`,
  "asrules.txt": `Asterisk rules

Put one at the start of a line, between backslashes:
  \\'ainc mormax'\\     too many digits top out (99) instead of being cut
  \\'ainc mormini'\\    too small a number is raised to the lowest allowed
  \\'ainc negbrahm'\\   asterisks can go below zero
  \\'ainc posbrahm'\\   a -* can give positives
  \\'ainc caps'\\       $ letters can be capitals

Examples
  \\'ainc mormax'\\ **     two digits, never cut down
  \\'ainc negbrahm'\\ *+10   -9 to 9, plus 10
Other line rules come as more of Numberat is built.
`,
  "window.txt": `The Numberat window

  Files (left)   New file, New directory; click a file to open it.
                 Your files are kept on this device from game to game.
  Run / Stop     starts the open file, or stops it.
  Check          reads the open file and lists what it can't read, with
                 the line numbers. It starts nothing.
  Wrap           long lines run off to the right; turn Wrap on to fold them.
  Autocomplete   suggestions show as you type; Tab takes the first one
                 (in the terminal too, where the arrow keys pick).
  Notes          Check skips blank lines and lines that start with #.
  Terminal       the bottom line is the command line itself: anything it can
                 do works here.
`,
};
