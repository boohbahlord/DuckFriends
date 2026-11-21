/* ---------- Seriat's help files (the Seriat window's read-only help/ folder) ----------
   The owner's (Nov 19 12:59Z): "the help files for numerat have a directory called "help", where simple or more complex
   help lies and their given principles or basic operators help files; the help files are text files that cannot be
   copied or deleted or changed". shell.js puts these in the Seriat folder at the start of every game (never kept in the
   profile) and refuses every change to them. Only what is built is written here (part A: values, orders, brackets,
   math, asterisks, percents; part B: line rules and limits; part C: statements).
   The owner's (Nov 19 16:12Z, with a drawing): help/ itself holds the general files, the examples (.se files) have their
   own folder, and each particular help topic its own named folder with its files (HELP_IN). */
import { LANG } from "./langname.js";

/* the folder each particular help file is in, inside help/ (the rest are help/'s own: the general ones) */
const HELP_IN = {
  numbers: [
    "values.txt",
    "tenths.txt",
    "ranges.txt",
    "lists.txt",
    "truefalse.txt",
    "about.txt",
    "percents.txt",
    "linerules.txt",
  ],
  order: ["order.txt", "repeats.txt", "brackets.txt"],
  math: ["math.txt", "asterisks.txt", "asteriskrules.txt"],
  brains: [
    "names.txt",
    "who.txt",
    "tests.txt",
    "loops.txt",
    "print.txt",
    "zones.txt",
    "move.txt",
  ],
};
/* a help file's path from the language's folder, by its name: helpAt("limits.txt") = "help/limits.txt",
   helpAt("math.txt") = "help/math/math.txt" (the mistakes point to it) */
export function helpAt(name) {
  for (const [d, names] of Object.entries(HELP_IN))
    if (names.includes(name)) return `help/${d}/${name}`;
  return "help/" + name;
}
const HELP_FLAT = {
  "0-start-here.txt": `${LANG}: start here
A programming language is a list of instructions a computer follows
in order, one line after another. You write what you want, ${LANG}
reads it, and the game does it. Nothing runs by guessing: it does
exactly what the line says.

Numbers come first. Everything starts from one:
  2        the number 2, always
  2:4      a random number from 2 to 4, a new one each time
  30%      a chance: 1 three times in 10, else 0

A variable is a name that holds a number, so you can use it again
and change it later. Two kinds:
  let rage = 3     your own name: you give it a value, and it stays
                   what you left it until you change it
  hp   speed       a stat of an NPC: the game already knows it, and
                   it moves by itself when the NPC is hit or healed
Your own variable is a box you fill. A stat is a meter the game fills.

Then come words that do things (go, flee, say), and tests (if) that
choose between them. The pages below add one idea each: read this one
first, then the numbers/ folder.

${LANG} help
These files are read-only: you can read them here and with cat,
but they can't be changed, copied or deleted.

Here, in help/:
  0-start-here.txt  this page (read it first)
  window.txt     the ${LANG} window: files, Run, Check, wrap, autocomplete
  files.txt      files that do things: when spawn, when hit, every 2s, use
  limits.txt     the limits every box has, and what to do past one

Folders (click one to go in):
  numbers/       values (2, 2:4, 2,4), tenths, ranges, lists, true or
                 false, about (~10), percents, line rules
  order/         2>4 in order, | and repeats, brackets
  math/          + - / ^, asterisks (*, $ letters), asterisk rules
  brains/        names and stats, who (me, nearest duck), tests (if),
                 loops, print and say, zones, moves (\\move\\)
  examples/      ready brain files (a chaser, a coward, a healer, a
                 talker, waves, a pair that share a value, a weaver):
                 copy one with cp and write its name in a spawn's
                 Brain box

Notes: # starts a note, the rest of the line is skipped.
Spaces and line breaks don't change anything: [2, 4] = [2,4].

More pages come as more of ${LANG} is built.
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
0.8:1.2 picks a tenth from 0.8 to 1.2, each time: a range with a decimal end goes
through every tenth, so 1.5:2.4 is 1.5, 1.6, 1.7 ... 2.3 or 2.4.

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
  4<2\\<2<\\|| | 9   4, 2, 4, 2, then 9 (the other way)
  >2>4\\>*>\\|| | 9   2, 4 played 0 to 9 times, then 9
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
number in quotes is only a name. '*1' means the same as '1*'.
  {[2,4]='1*'}\\>>\\|| '1*'+1     names 2 or 4, then adds 1

Too many digits for the asterisks: cut from the front
(150 into ** gives 50). Below zero: it loses its sign (-3 into * is 3).
See math/asteriskrules.txt to change that.
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

  Spawn limit                  0 to 100        (starts at 1; 0: no limit)
  Seconds between spawns       0 to 600        (starts at 4; 0: no wait)
  HP                           0.1 to 1000     (starts at 3)
  Damage                       0 to 100        (starts at 1; 0: hurts nobody)
  Speed                        0 to 5          (starts at 1; 0: stays put)
  Players' HP                  0.1 to 100
  Players' speed               0 to 5          (0: they can't walk)
  Zone width and height        1 to 40 duck lengths (start at 4)
  Zone HP each time            0.1 to 100      (starts at 1)
  Zone seconds between         0 to 60         (starts at 1; 0: every beat)
  Seconds before it comes back 0 to 600        (starts at 10; 0: at once)
  Seconds you keep it          0 to 600        (0 is for good)
  Damage to whoever takes it   0 to 100        (starts at 0)

Write a number past a limit and the box says "N at least" or
"N at most" and keeps its last good value. Fix it by writing a
number inside the limit, or by giving the line its own limit at
its start (more in numbers/linerules.txt):

  \\inc'lim=25'\\ 2:20     this line's top is 25
  \\inc'lim=***'\\ 2:900   at most 999
  \\rm'lim'\\ 2000         no limit on this line (1,000,000 at most)
  \\!inc'lim=25'\\         the whole file's top is 25

The same limits hold in NPC brains: ((speed 50)) stops that line
with "Past the limit: speed 5 at most". A param file (its first
line \\\\param\\\\) can move a limit for every one of your files.
`,
  "linerules.txt": `Line rules

Written at the start of a line, between backslashes, before the value.

Numbers in or out:
  \\'rm0'\\ 0:3       0 never comes out: the line plays again (1 to 3)
  \\'inc0'\\ 0:3      0 may come out (it can undo a rule above)
  \\'rm2'\\ 1:4       no 2
  \\'rm**'\\          no results with 2 digits
  \\'rm**:****'\\     no results with 2 to 4 digits
  \\'rm{3,[2:5]}'\\   a rule's value is ${LANG} too: no 2 to 5
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
  \\lin["**"=!]'inc1'\\  strength is a value: 10 to 99

The strongest rule wins: more ! is stronger. \\!!'inc1'\\ beats
\\!'rm1'\\. With the same number of !, the later rule wins.

  \\!'rm1'\\
  [1:5]                 2 to 5
  \\lin!!'inc1'\\ [1:5]  1 to 5

Limits: see help/limits.txt. Asterisk rules (mormax ...): math/asteriskrules.txt.
`,
  "files.txt": `Files that do things

A file is lines of statements. Its own lines play once when it
starts (Run); its when's and every's play for each NPC it runs.

  when spawn ((hp 10))         when an NPC comes in
  when hit [attack 75%, flee 25%]
  when dead print 'gone'
  when near duck 3 flee        a duck 3 or nearer (near zombie too)
  when touch say "boop"
  every [2,4]s say "brains"    each NPC, every 2 or 4 seconds
  wait 1.5                     sleep a little, then go on
  stop                         end this block now
  seed 42                      the same random numbers every run

Blocks: { } around several lines, or ; between statements:
  when spawn { go nearest duck; wait 1; attack }

Joining files:
  use 'zombie-base'    its values, blocks and when's come in too
  give rage            other files can take rage
  take rage            rage, as another file gave it
Plain value lines (2:4, >2>4 ...) work in files too.

In the game: open Build (b), pick a spawn, and on its Entities
page write the file's name in the Brain box. Its NPCs then run
the file's when's and every's. print and the file's mistakes
show in this terminal. Save the file with no mistakes and its
NPCs get the new version straight away.
A spawn with no Brain plays as before.
`,
  "names.txt": `Names

  let rage = {[1,2]+[0:*]}    rage is 1 to 11, worked out now
  let r2 = rage^2             names work anywhere a number goes
  ((hp "2rage"))              "…" multiplies: twice the rage

Stats, read and set (an NPC's, inside a when):
  hp  speed  damage  regen hp  hitbox (10 to 300, in %: how big it
                                 is to hit, and how far it reaches)
  ((hp 5))  ((hp hp-1))  ((hp 50%))   50% is half its most
  ((hitbox 150%)) or ((hitbox 150))   one and a half times its size
  ((hp 100%))                         HP to full
  ((regen hp 2))                      2 HP back each second (0 stops it)
Another NPC's: z hp, where z is one (for z in team ...):
  for z in team ((z hp z hp+1))       each one gets 1 HP more
Built-in: wave (the round), time (seconds), alive, dead, spawned.
hppct: its own HP as a percent of its most (30 is under a third).

Math words: round 2.5 (3)  up 2.1 (3)  down 2.9 (2)
            min 3 hp  max 1 speed  spawned mod 3

Blocks:
  def charge { go nearest duck; wait 1; attack }
  def hurt(n) { ((hp hp-n)) }
  when hit hurt 3
`,
  "who.txt": `Who

  me              this NPC
  nearest duck    the nearest duck (also: nearest zombie)
  all ducks       every duck (also: all zombies)
  team            the NPCs this file runs

  go nearest duck     attack     flee     (attack and flee: the
  nearest duck when no one is named)
  ((all zombies speed 2))
  for z in all zombies { ((z speed ~1.2)) }
`,
  "move.txt": `Moves

A move walks an NPC along a path you draw with arrows:
  >  right     <  left     /\\  up     \\/  down
Two together slant: >/\\ is up and right. A number after them is
how many duck lengths (1 when there is none):
  when spawn \\move\\{ >3 \\/2 <3 /\\2 }     a box, then home
  \\move\\ >/\\2 <(1+1)        no { }: the rest of the line

Parts go with ; or a new line between, inside the { }:
  to nearest duck    go there; the arrows now push the way
                     there to that side, and it still arrives
  -                  a straight part of the way (-2: two)
  @1.5               this move at 1.5 times its speed
  bend dogleg x3, weave    how each leg bends, in turn

Bends:
  shot (or straight)   a straight line          number 1
  bow                  a smooth curve           number 2
  weave                out and back across, S   number 3
  dogleg               one sharp corner, L      number 4
  mix                  bow, weave, dogleg in turn
  dogleg x3, weave     3 doglegs, then a weave, then again
  dogleg 3 times       the same as dogleg x3
  bend style           a name holding 1 to 4 (let style = 2)
A bend line on its own sets it for every move after it:
at a file's top for every NPC, inside a when for that one.

  when spawn {
    \\move\\{ to nearest duck; bend bow; /\\3 }
    attack nearest duck
  }
The move comes first; when it's done, its go, attack or flee
goes on. A new move takes over one still going. A spot it can't
get nearer to (a wall) is skipped after a moment.
`,
  "tests.txt": `Tests

Between backslashes, < and > compare (outside, they're arrows):
  \\if hppct < 30\\ flee else go nearest duck
  \\if hp == 5\\ ...      equal (one = names a value)
  \\if hp not 5\\ ...     not equal
  \\if hp in 1:5\\ ...    one of; also in [2,4,6]
  <= and >= work too
  \\if not hppct > 30\\  \\if hppct < 30 and wave > 2\\
  and, or, nand, xor
  \\if spawned mod 3 == 0\\ say "every 3rd"
`,
  "loops.txt": `Loops

  for n in 1:5 { say "wave n" }     1, 2, 3, 4, 5
  for n in [2,4] print "n"          2, then 4
  for z in all zombies { ((z speed ~1.2)) }
  while \\hppct < 30\\ { flee; wait 1 }

Every loop stops after 1,000 rounds with an error, and so does
anything that runs a long time without a wait, so a mistake can't
freeze the game.
`,
  "zones.txt": `zones
A zone's Brain box takes a file too. It runs for the zone and moves
its squares (its Potential order).

When:
  every [2,4]s step       one step on, every 2 or 4 seconds
  when enter step 2       a player steps in: two steps on
  when spawn step         one of its tabs made something in it

Words:
  step  /  step 3         its squares move on 1 (or 3) steps
  squares 3:5             how many squares work at once
  size 1.5                a square's size, in duck lengths
  order shuffle           random, absolute, shuffle, shuffleonce,
                          rows, columns, line, alternating, all
  dir right               right, left, up, down, upright, upleft,
                          downright, downleft, none
At the top of the file (outside a when) they're for every zone
that names the file.

Names (inside a when): steps, squares, size, inside (how many
players stand in it).

Any file reaches a zone by its variable name:
  ((zone 'Pit' size 2))
  \\if zone 'Pit' steps mod 3 == 0\\ print "third step"
`,
  "print.txt": `print and say

  print "Hello, world!"     shows in the terminal
  say "brains"              the NPC says it (no NPC: the terminal)

As in bash:
  "zombie $$*"     double quotes work out asterisks, $ letters and
                   names: zombie qe7. "wave n" in a for says wave 1
  'zombie $$*'     single quotes: exactly as typed
  'rage is ' rage  text, then a value beside it: rage is 7
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
  "repeats.txt": `Repeats

Write how many times between backslashed arrows, then ||.
Everything before it plays that many times; what follows | plays after.

  >2>4\\>2>\\|| | 9     2, 4, 2, 4, then 9 for good
  4<2\\<2<\\|| | 9      4, 2, 4, 2, then 9 (descending)
  >2>4>6\\>2>\\|| | 1   2, 4, 6, 2, 4, 6, then 1
  >2>4\\>*>\\|| | 9     2, 4 played 0 to 9 times, then 9
  2>4\\>>\\||           2 and 4 in order, again and again

In front of a value, the count plays just that value:
  \\>1,2>\\[2,4]        one pick of 2 or 4, played once or twice
`,
  "window.txt": `The ${LANG} window

  Files (left)   one folder at a time, as File Explorer: click a folder
                 to go in, ../ to go out, a file to open it. You start
                 in home/<you>; one up, home/ has everyone's folder.
  <- and ->      Back and Forward: the folders you were just in.
  Path bar       where you are. Type a path and Enter to go there, as
                 in Linux: .., help/math, ~/notes/${LANG.toLowerCase()}/help.
                 Anything else is searched for in the folder shown.
  New file, New directory: made in the folder shown.
                 Your files are kept on this device from game to game.
  Permissions    for your open file (or the folder shown): your own
                 Read, Write and Run, and what a player, a group or
                 everyone may do with it. Nobody can, unless you give
                 it, and given rights end when a new Sandbox starts.
                 Looking in others' folders takes canhomes (groups).
                 The terminal does the same: chmod, setfacl, getfacl.
  Their files    what a player lets you read opens here; with Write you
                 change it (they must be in the room: it saves on their
                 device), with Run you run it, or put ~name/file in a
                 spawn's Brain box.
  Run / Stop     starts the open file, or stops it.
  Check          reads the open file and lists what it can't read, with
                 the line numbers. It starts nothing.
  Wrap           long lines run off to the right; turn Wrap on to fold them.
  Autocomplete   suggestions show as you type; Tab takes the first one
                 (in the terminal too, where the arrow keys pick).
  Notes          # starts a note: Check and Run skip the rest of the line.
  Terminal       the bottom line is the command line itself: anything it can
                 do works here.
`,
};

/* every help file by its path in help/ ("numbers/values.txt"), as shell.js puts them in */
export const HELP = Object.fromEntries(
  Object.entries(HELP_FLAT).map(([f, t]) => [helpAt(f).slice(5), t]),
);

/* ---------- help/examples/ (the owner's Nov 19 15:18Z via Adam): ready brain files, read-only like help/ ----------
   Players copy one (cp) and write its name in a spawn's Brain box. Each was run through compileScript with 0 errors. */
export const EXAMPLES = {
  "weaver.se": `# A weaver: it comes at the nearest duck along a path, never in a straight line.
# Two doglegs, then a weave, over and over (see help/brains/move.txt).
bend dogleg x2, weave
when spawn {
  \\move\\{ to nearest duck; >2 /\\2 <2 \\/2 }
  attack nearest duck
}
every 6s \\move\\{ to nearest duck; /\\1 \\/1 }
`,
  "chaser.se": `# A chaser: runs at the nearest duck, and bites when it is close.
# Copy it, then write its name in a spawn's Brain box.
when spawn { ((speed 1.2:1.6)); go nearest duck }
every 2s go nearest duck
when near duck 1 attack
`,
  "coward.se": `# A coward: it chases, but flees whenever it has under 30% of its HP.
# (hppct is its HP as a percent of its most.)
every 1s \\if hppct < 30\\ flee else go nearest duck
when hit \\if hppct < 30\\ flee
`,
  "healer.se": `# A healer: every few seconds each NPC on its team gets 1 HP more.
# (z hp is NPC z's HP: see help/brains/names.txt. Each healer on the board gives its own 1 HP.)
every [3,5]s for z in team ((z hp z hp+1))
`,
  "rage-give.se": `# The first of a pair: this file makes rage and gives it to the other file.
# Put this one in one spawn's Brain box and rage-take in another's.
let rage = 2:4
give rage
when spawn ((hp "2rage"))
`,
  "rage-take.se": `# The second of a pair: it takes the rage rage-give made, and its speed follows it.
# (Give it first: when this file starts, rage-give has to have run.)
take rage
when spawn ((speed rage))
`,
  "talker.se": `# A talker: every few seconds it says one of three lines, with random letters.
# $ is a random letter, * a random digit (help/math/asterisks.txt).
every [2,4]s {
  let n = 1:3
  \\if n == 1\\ say "brains $$*" else \\if n == 2\\ say "hello $$$" else say "moan $*"
}
`,
  "waves.se": `# Waves: each NPC is faster and tougher the later the wave. wave is the round.
# Speed 1 at wave 0, up to 5 at wave 40; HP 3 plus the wave.
when spawn { ((speed min 5 1+wave/10)); ((hp 3+wave)) }
every 2s \\if wave > 3\\ go nearest duck
`,
};
