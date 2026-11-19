/* ---------- Numerat's help files (the Numerat window's read-only help/ folder) ----------
   The owner's (Nov 19 12:59Z): "the help files for numerat have a directory called "help", where simple or more complex
   help lies and their given principles or basic operators help files; the help files are text files that cannot be
   copied or deleted or changed". shell.js puts these in the Numerat folder at the start of every game (never kept in the
   profile) and refuses every change to them. Only what is built is written here (part A: values, orders, brackets,
   math, asterisks, percents; part B: line rules and limits). This file has no imports. */
export const HELP = {
  "index.txt": `Numberat help
These files are read-only: you can read them here and with cat,
but they can't be changed, copied or deleted.

Simple first:
  values.txt     numbers as you write them in a box: 2, 2:4, 2,4
  tenths.txt     tenths: 1.5, 1.0:1.*, 1.[0:9]
  truefalse.txt  the t and f boxes
  about.txt      ~10: about 10
  order.txt      2>4 in order, | and repeats
  brackets.txt   ( ) [ ] { } and lines that carry on
  math.txt       + - / ^ and "2[1,5]"
  asterisks.txt  *, **, -*, $ letters, '1*' and =
  asteriskrules.txt  mormax, mormini, negbrahm, posbrahm, caps
  linerules.txt  \\'rm0'\\, \\!'rm1'\\, lin, and a line's own limit
  percents.txt   [3 60%, 5 40%], 30%, 150%
  limits.txt     the limits every box has, and what to do past one
  window.txt     this window: files, Run, Check, wrap, autocomplete

Notes: # starts a note, the rest of the line is skipped.
Spaces and line breaks don't change anything: [2, 4] = [2,4].
More pages come as more of Numberat is built.
`,
  "values.txt": `Plain values

  2       always 2
  2:4     a new random whole number from 2 to 4, each time
  2,4     a new pick of 2 or 4, each time (true random)
  1,3:5   a list can hold a range: 1, or a number from 3 to 5
  4:2     the same as 2:4

Whole numbers, even in a box that takes tenths: 2:4 is 2, 3 or 4.
A box for whole numbers rounds what math gives it.
A box that can't read what you wrote keeps its last good value
and tells you why.
`,
  "tenths.txt": `Tenths

Boxes that take tenths (speed and damage) read 0.8, 1.5 and so on.
1.25 is read as 1.3 (the nearest tenth).
0.8:1.2 picks a tenth from 0.8 to 1.2, each time.

The . puts what follows in the tenths place:
  1.0:1.*   1.0 to 1.9
  1.[0:9]   1 and a tenth digit from 0 to 9: 1.0 to 1.9
  1.*       1.0 to 1.9 (the * is one digit, 0 to 9)
  *.*       a digit and a tenth digit: 0.0 to 9.9
  1.0:*     1.0 to 9
`,
  "truefalse.txt": `True or false

The true or false boxes take t or f (true or false also work).
`,
  "about.txt": `About: ~

  ~10     about 10: 9, 10 or 11 (give or take a tenth of it)
  ~1.5    1.4, 1.5 or 1.6
  ~[10,20]  about 10 or about 20
`,
  "order.txt": `Order and repeats

  2,4       2 or 4, true random
  2>4       in order: 2, then 4, then 2 ... (starts at a random one)
  >2>4>5    an arrow first fixes the start: 2, 4, 5, 2, 4, 5 ...
  2<4<5     the other way: 5, 4, 2 ...
  [1,3][2,4]    side by side: one pick from each, in random order
  [1,3][2,4]>   left first; [1,3][2,4]< right first

| : everything before it finishes before what comes after plays:
  >2>4 | 9          2, 4, then 9 for good

Repeats, the count between backslashed arrows, then ||:
  >2>4\\>2>\\|| | 9   2, 4, 2, 4, then 9 for good
  \\<2<\\||           the same, the other way
  \\>*>\\||           a count from 0 to 9
  \\>1,2>\\[2,4]      in front of a value: play it 1 or 2 times
The last part of a line keeps playing. An order keeps its place
from one spawn to the next.
`,
  "brackets.txt": `Brackets

  ( )   work this out first, as in math: (2:4)+1 is 3 to 5
  [ ]   take one pick from inside: >[2,4]>[3] is 2 or 4, then 3
  { }   starts over every time; holds a value to name:
        {[2,4]='2*'} names 2 or 4 as asterisk 2

A line carries on while a bracket is still open:
  { [2,4]
  +[1:3] }       is { [2,4]+[1:3] }
`,
  "math.txt": `Math

  +  add         2+3
  -  subtract    5-2
  /  divide      [6,10]/2 is 3 or 5
  ^  power       [3,6]^2 is 9 or 36
  "  multiply: inside double quotes, side by side multiplies
                 "[1,5]2" = "2[1,5]" = 2 or 10
Results keep tenths at most. Dividing by 0 is an error.
`,
  "asterisks.txt": `Asterisks and letters

  *      a digit, 0 to 9 (waits for input; with none, random)
  **     two digits, 0 to 99; *** three, 0 to 999
  -*     a negative digit, -9 to 0
  3*     3 and a digit: 30 to 39
  $      a letter a to z; $$ two, $$$ three

= names a value: [2,3,5]=*+* picks 2, 3 or 5, calls it *,
and gives *+* (3 gives 6).
Named ones, in single quotes: '1*' is asterisk number 1, '2***'
asterisk number 2 with three digits, '1$' letter number 1. The
number in quotes is only a name.
  {[2,4]='1*'}\\>>\\|| '1*'+1     names 2 or 4, then adds 1

Too many digits for the asterisks: cut from the front
(150 into ** gives 50). Below zero: it loses its sign (-3 into * is 3).
See asteriskrules.txt to change that.
`,
  "asteriskrules.txt": `Asterisk rules

Written at the start of a line, between backslashes:
  \\'ainc mormax'\\     too many digits tops out instead (150 into ** is 99)
  \\'ainc mormini'\\    below zero becomes 0 instead of losing its sign
  \\'ainc negbrahm'\\   asterisks can go below zero (-9 to 9)
  \\'ainc posbrahm'\\   a -* can give positives too
  \\'ainc caps'\\       $ letters can be capitals
`,
  "percents.txt": `Percents

  [3 60%, 5 40%]     3 six times in 10, 5 four times in 10
  [3 60:80%, 5 20%]  a percent can be any value
  [3 30%, 5 20%]     under 100% in all: the rest is nothing
  [3 150%, 5 50%]    over 100% in all: shares, 3 to 1
  30%                1 three times in 10, else 0 (true or false)
  150%               1 for sure, plus a 50% chance of 2
Give every choice a percent, or none.
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
number inside the limit, or by giving the line its own limit at
its start (more in linerules.txt):

  \\inc'lim=25'\\ 2:20     this line's top is 25
  \\inc'lim=***'\\ 2:900   at most 999
  \\rm'lim'\\ 2000         no limit on this line (1,000,000 at most)
  \\!inc'lim=25'\\         the whole file's top is 25
`,
  "linerules.txt": `Line rules

Written at the start of a line, between backslashes, before the value.

Numbers in or out:
  \\'rm0'\\ 0:3       0 never comes out: the line plays again (1 to 3)
  \\'inc0'\\ 0:3      0 may come out (it can undo a rule above)
  \\'rm2'\\ 1:4       no 2
  \\'rm**'\\          no results with 2 digits
  \\'rm**:****'\\     no results with 2 to 4 digits
  \\'rm{3,[2:5]}'\\   a rule's value is Numberat too: no 2 to 5
If a line can't give anything the rules let out, it stops after
1,000 tries and says why (the NPC doesn't spawn).

Asterisks only:
  \\'arm0'\\ *        the asterisk never gives 0 (1 to 9)
  \\'ainc0'\\         asterisks may give 0
  \\'a2 rm0'\\        asterisk 2 ('2*') only; also \\''a2'inc0'\\
  \\'ainc negbrahm'\\ \\'arm0'\\ *+10    1 to 19, never 10

Which lines:
  \\'rm1'\\           this line only
  \\!'rm1'\\          the whole file
  \\'n1:4 rm0'\\      lines 1 to 4 (any value: 'n[1,5,[2:3]]')
  \\lin!!'inc1'\\     this line, as strong as !!

The strongest rule wins: more ! is stronger. \\!!'inc1'\\ beats
\\!'rm1'\\. With the same number of !, the later rule wins.

  \\!'rm1'\\
  [1:5]                 2 to 5
  \\lin!!'inc1'\\ [1:5]  1 to 5

Limits: see limits.txt. Asterisk rules (mormax ...): asteriskrules.txt.
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
