/* ---------- Numerat's help files (the Numerat window's read-only help/ folder) ----------
   The owner's (Nov 19 12:59Z): "the help files for numerat have a directory called "help", where simple or more complex
   help lies and their given principles or basic operators help files; the help files are text files that cannot be
   copied or deleted or changed". shell.js puts these in the Numerat folder at the start of every game (never kept in the
   profile) and refuses every change to them. Only what is built is written here: the plain values. This file has no
   imports. */
export const HELP = {
  "index.txt": `Numerat help
These files are read-only: you can read them here and with cat,
but they can't be changed, copied or deleted.

  values.txt     numbers as you write them in a box: 2, 2:4, 2,4
  tenths.txt     the boxes that take tenths
  truefalse.txt  the t and f boxes
  window.txt     this window: files, Run, Check, wrap, autocomplete

More pages come as more of Numerat is built.
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
  "window.txt": `The Numerat window

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
