# Seriat

**Seriat** is the number language of Sandbox. A Seriat value can stand anywhere a number goes: a spawn's HP, a zone's
step, an NPC's speed. A Seriat file (ending in `.se`) can also run an NPC's brain or a zone. Values can be fixed,
random, ordered, repeated or worked out from other values, and every value is drawn again each time it is used.

Files are written and run in the n window. **Check** finds mistakes without running a file; **Run** runs it. The
window's read-only `help/` folder has a page for every part described here, from simple to complex.

## Reading a file
- Spaces and line breaks do not change meaning: `[2, 4]` is the same as `[2,4]`.
- `#` starts a note. The rest of the line is ignored.
- A line carries on to the next while a bracket is still open.
- A value that a stat cannot take stops the file with an error that says why. A mistake never stops the game.

## Values
| Write | Means | Example results |
|---|---|---|
| `2` | always 2 | 2, 2, 2 |
| `2:4` | a random whole number from 2 to 4, new each time | 3, 2, 4 |
| `2,4` | 2 or 4, at random | 4, 4, 2 |
| `1.5:2.4` | every tenth from 1.5 to 2.4, ends included | 1.8 |
| `1.0:1.*` | 1.0 to 1.9 | 1.4 |
| `1.*` | 1 and a random tenth digit (0 to 9) | 1.7 |
| `*.*` | a random digit and a random tenth digit | 4.2 |
| `~10` | about 10: 9 to 11 | 10.4 |
| `t`, `f` | true, false | |

The `.` puts what follows it in the tenths place. Whole-number stats, such as a spawn limit, take whole numbers only;
HP, damage and speed take tenths.

## Order and repeats
- With no arrow, a pick is random.
- `2>4` plays the listed values in order: 2, then 4. `2<4` plays them the other way.
- An arrow at the start fixes where it begins: `>2>4>5` always starts at 2 (2, 4, 5, 2 …). `2>4>5` starts at a random
  one and goes on in order.
- `|` makes everything before it finish before what comes after it plays.
- A count between backslashed arrows, followed by `||`, repeats: `\>2>\||` plays twice in order, `\<2<\||` twice in
  reverse, `\>>\||` keeps repeating in order, and `\>*>\||` takes the count from input.
- `[1,3][2,4]<` starts from the right. `[1,3][2,4]\<!<\` keeps going through every group instead of starting over.
- Groups side by side, `[ ]` or `( )`, are picked in a random order unless arrows say otherwise.
- An ordered value keeps its place between spawns.

## Brackets
| Write | Means | Example |
|---|---|---|
| `( )` | work this out first, as in math | `(2:4)+1` gives 3 to 5 |
| `[ ]` | take one pick from inside, then move on | `>[2,4]>[3]` gives 2 or 4, then 3 |
| `{ }` | wait until everything inside is defined; with `=` after it, the result becomes a named input for later | `{[2,4]='2*'}` |
| `(( ))` | set a stat to a value | `((hp 5))` sets HP to 5 |

## Math
- `+` adds, `-` subtracts, `/` divides and `^` raises to a power: `[6,10]/2` gives 3 or 5, `[3,6]^2` gives 9 or 36.
- Double quotes multiply: `"[1,5]2"` and `"2[1,5]"` both give 2 or 10.
- Inside backslashes, `<` and `>` compare: `\if hp < 5\`. Outside backslashes they are arrows.
- `round 2.5` gives 3, `up 2.1` gives 3, `down 2.9` gives 2.
- `min`, `max` and `mod` give the smallest, the biggest and the leftover: `\if spawned mod 3 == 0\` is true on every
  third spawn.

## Input: asterisks and letters
- `*` is one digit waiting for input; `**` is two digits, `***` three. With no input it is a random digit, 0 included,
  inside the stat's limit.
- A number with too many digits is cut from the front: 150 into `**` gives 50. The line rule `\'ainc mormax'\` tops
  it out instead (99).
- A negative number into a plain `*` loses its sign (-3 gives 3). `\'ainc mormini'\` raises it to the lowest allowed
  value instead (0).
- `-*` is a negative digit (-9 to 0). `\'ainc negbrahm'\` lets an asterisk go below zero; `\'ainc posbrahm'\` lets a
  `-*` give positive digits.
- `$` is a letter as `*` is a digit: `$` is one random letter a to z, `$$` two, `$$$` three. `\'ainc caps'\` allows
  capitals.
- Single quotes name an asterisk: `'1*'` is asterisk number 1, `'2***'` asterisk number 2 with three digits. The number
  in quotes is its name, never part of its value. `'*1'` means the same as `'1*'`.
- `=` binds a pick to a name: `[2,3,5]=*+*` picks 2, 3 or 5 and adds it to itself.
- Example: `{[6,10]/2}='1*'\>>\||{"2['1*']"}` gives 3 or 5, then doubles it.

## Line rules
A rule between backslashes at the start of a line changes what that line may give.

| Write | Means |
|---|---|
| `\'inc0'\` | the line may give 0 |
| `\'rm0'\` | the line never gives 0: it is drawn again until it doesn't (after 1,000 tries the spawn is skipped with an error) |
| `\'rm**'\`, `\'rm**:****'\` | no 2-digit results; no 2- to 4-digit results |
| `\'ainc0'\`, `\'arm0'\` | the same, for asterisks only |
| `\''a2'inc0'\` | for asterisk 2 only |
| `\'n1:4'''a2'inc0'\` | for lines 1 to 4 only (any Seriat value can pick the lines) |
| `\!'inc1'\` | for the whole file |
| `\lin!!'inc1'\` | for the given lines, at strength `!!` |
| `\rm'lim'\` | no limit on this line (a hidden cap of 1,000,000 remains) |
| `\inc'lim=25'\` | this line's limit is 25 |

More `!` makes a rule stronger: `\!!'inc1'\` beats `\!'rm1'\`. With the same strength, the later rule wins. A rule
without `lin` that has `!` covers the whole file, lines before it too. A rule's strength can itself be a Seriat value:
`\lin["**"=!]'inc1'\` has a strength from 10 to 99. Rule values can be Seriat too: `\!a2'rm{3,[2:5]}'\`.

## Param files
A file whose first line is `\\param\\` sets rules for every other Seriat file of the same player: NPC brains, zone files
and files run from the command line. `\\param1\\`, `\\param2\\` and so on set their order, lower numbers first. A file's
own rules beat a param file's at the same strength. A param file with mistakes is skipped. Param files are reached from
Game settings (g) and the n window.

## Limits
Each stat has a preset limit: for example HP from 0.1 to 1000, speed from 0 to 5, a spawn limit from 1 to 100. Zero is a
real value: speed 0 stays put, damage 0 hurts no one. A value past a stat's limit stops that line with an error that
names the stat and its limit, such as "Past the limit: speed 5 at most (it gave 50)". The help page `help/limits.txt`
lists every preset limit. A line rule (`\inc'lim=..'\` or `\rm'lim'\`), on the line or in a param file, moves or lifts
a limit.

## Distances
Distances are in tiles, four tiles to a duck's length. Two bodies touch at 4 tiles.

## Running files
A file runs from the n window's Run button, from a command in the n window's terminal, or when attached to a spawn or a
zone. A command can stop it. `print "Hello, world!"` writes a line to the n window's output; quotes and spaces work as in
bash.

## NPC brains
A spawn's Brain box names a file. The file runs for every NPC that spawn makes.

### Events
Code that runs when something happens: `when spawn`, `when hit`, `when dead`, `when near duck 12` (tiles), `when touch`
and `every 2s`. Any Seriat value works where a number goes: `every [2,4]s`, `when near duck 3:5`.

### Actions
- `go nearest duck`, `attack`, `flee`, `wait 1.5`, `say "hi"`.
- `attack` and `flee` with no one named mean the nearest duck.
- Moves: `\move\{ … }` (see Moves).

### Who
`me`, `nearest duck`, `all zombies`, and `team` (the NPCs the file runs) name what an action or a stat applies to.

### Stats
Every stat can be read and set by name: `((hp 5))`, `((speed 3))`, `\if hp < 5\`. `hitbox` is in percent of the usual
size, 10% to 300%: `((hitbox 150%))` makes an NPC bigger to hit and its reach longer. `regen hp` gives HP back each
second up to its most (0 to 100; 0 stops it). Another NPC's stat is read through a loop name: `for z in team ((z hp z hp+1))`.

On a stat, a percent is of its most: `((hp 50%))` is half the most HP, `((hp 150%))` one and a half times, still inside
the stat's limit.

### Chance
A pick with percents chooses by chance: `[attack 75%, flee 25%]` attacks 3 times in 4. Percents take any Seriat value:
`[attack 60:80%, flee 20%]`. Below 100% in all, the rest is "do nothing". `30%` alone is true 3 times in 10. Over 100%
in all, the percents are shares: `[attack 150%, flee 50%]` is 3 to 1. A chance alone over 100% happens more than once:
`150%` is once for sure plus a 50% chance of a second time. Any action can take a percent in a pick:
`[say "y" 30%, say "n" 20%]`.

### Names and blocks
- `let rage = 2:4` names a value, worked out once when it runs. Every Seriat rule applies to it: `rage^2`, `"2rage"`.
- `def charge { … }` makes a block; `charge` runs it, and `stop` ends it early. `def hurt(n) { ((hp hp-n)) }` takes an
  input: `hurt 3`.
- `use 'zombie-base'` brings in another file's values and blocks. `give rage` and `take rage` share a value between
  files while the game runs.

### Tests and loops
- `\if hp in 1:5\` … `else` …
- Inside `\if …\`, `==` is equal and `not` is not equal: `\if hp == 5\`, `\if hp not 5\`. `=` names a value.
- Logic words: `and`, `or`, `not`, `nand`, `xor`.
- `for z in all zombies { ((z speed ~1.2)) }`; `for n in 1:5 { say "wave n" }` (`for n in 3` is 1 to 3, `for n in
  [2,4]` each of 2 and 4); `while \hp < 5\ { flee }`. A loop stops after 1,000 rounds with an error.

### Text
Inside double quotes after `print` or `say`, asterisks, `$` letters and names are worked out: `say "zombie $$*"` might
say "zombie qe7", and `say "rage is rage"` says "7 is 7". Inside single quotes the text stays exactly as typed. To keep a
word, put it in single quotes and the value beside it: `say 'rage is ' rage`.

### Built-in names
- `wave`: Dead Ducks Arcade's round number.
- `time`, `alive`, `dead`, `spawned`.
- `hppct`: the NPC's own HP as a percent of its most: `\if hppct < 30\`.
- `seed 42` makes the random draws the same on every run.

## Zones
A zone's Brain box takes a file that runs for the zone and moves its squares.
- Events: `every [2,4]s step`, `when enter step 2` (a player steps in), `when spawn step` (one of the zone's tabs made
  something in it).
- Words: `step` or `step n`, `squares 3:5` (squares at once), `size 6` (square size, in tiles), `order` (random,
  absolute, shuffle, shuffleonce, rows, columns, line, alternating, all) and `dir` (right, left, up, down, upright,
  upleft, downright, downleft, none). At a file's top they apply to every zone that names the file.
- Names inside a `when`: `steps`, `squares`, `size`, `inside` (the players standing in it).
- Any file reaches a zone by its variable name: `((zone 'Pit' size 8))`, `\if zone 'Pit' steps mod 3 == 0\`.

### Act
A zone's Act can be Seriat, Damage, Heal, Kill or Nothing. Seriat shows value boxes, each with "Acts on" under it (HP,
Speed, Damage, Regen HP each second, Hitbox %). Each step, for everyone the zone hits, HP gains the value (or loses it,
below 0); the other stats become the value. "+" adds a box; the import button fills a box with the first value line of
one of the player's files.

## Moves
`\move\{ … }` inside an NPC's `when` or `every` walks a path. `\move\` with no `{` takes the rest of its line. Parts are
split by `;` or a new line.
- Arrows: `>` right, `<` left, `/\` up, `\/` down. Arrows together make one slanted leg: `>/\2` is 2 right and 2 up.
  The number after them is tiles (1 when none) and can be any Seriat value, in `( )` when it has more than one piece:
  `>(1+1)`, `>rage`. Legs play in order: `>3 \/2 <3 /\2` walks a box and comes home.
- `to <who>` (`to nearest duck`, `to me`, a loop's name, `to zone 'Pit'`) cuts the way there into one part per leg; each
  leg pushes its part that far to its side, and the move still arrives. `-` is a part with no push. With no legs it
  walks straight there.
- `@1.5` moves at 1.5 times the NPC's speed.
- Bends: `bend shot` (or `straight`, 1), `bow` (2), `weave` (3), `dogleg` (4) and `mix` (bow, weave and dogleg in
  turn). `bend dogleg x3, weave` plays 3 doglegs, then a weave, one bend per leg. A bend line at a file's top covers all
  its NPCs; inside a `when`, that NPC. The default is `shot`.
- A move comes before the NPC's `go`, `attack` or `flee`, which carry on when it ends. A new move replaces one still
  going. A spot the NPC gets no nearer to for 1.2 seconds is skipped, and it never walks off the board.

## Examples
Speed that differs per NPC, 1.0 to 3.8:
```
{1.0:1.*}='1*'\>>\||"['1*'][1,2]"
```
HP in waves: spawns 1 to 3 get 3 or 5, then 6 to 8, then 10 or 12; that plays twice, then every later spawn gets 20 to 25:
```
>[3,5]>[6:8]>[10,12]\>2>\|| | [20:25]
```
Negative digits with no zero, plus 10 (1 to 19, never 10):
```
\'ainc negbrahm'\ \'arm0'\ *+10
```
A file rule and a line that beats it:
```
\!'rm1'\                # no 1 anywhere in this file
[1:5]                   # 2 to 5
\lin!!'inc1'\ [1:5]     # 1 to 5: !! beats !
```
A zombie brain. Rage is 1 to 11 and HP twice the rage. When hit, it attacks 3 times in 4 and flees otherwise. Near a
duck, below 5 HP it runs, otherwise it chases. Every 2 or 4 seconds it says "brains". Other files can take its rage.
```
use 'zombie-base'
let rage = {[1,2]+[0:*]}
when spawn ((hp "2rage"))
when hit [attack 75%, flee 25%]
when near duck 3 { \if hp < 5\ flee else go nearest duck }
every [2,4]s say "brains"
give rage
```
