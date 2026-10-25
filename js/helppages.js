/* ---------- the command line's Help pages: help lists them; HelpChat, HelpFile … open one ----------
   Each page: a dumb version on top, then what it is, how to, the flags and basics, and examples (each one a different
   way of using it). HelpGame has pages of its own (HelpGame-How, HelpGame-Help …). paint() colors a line of the
   command line by the kind of each command in it. */
import { esc } from './ui.js';

/* the kinds of command, each with its own color (css: .k-<kind>) */
export const KINDS = {
  help: ['help', 'man', 'apropos'],
  bash: ['echo', 'printf', 'history', 'alias', 'unalias', 'type', 'which', 'export', 'unset', 'env', 'printenv', 'source', '.', 'eval', 'read', 'xargs', 'true', 'false', 'test', '[', ':', 'sleep', 'clear', 'exit', 'logout',
    'for', 'in', 'do', 'done', 'if', 'then', 'else', 'elif', 'fi', 'while', 'until'],
  file: ['ls', 'cd', 'pwd', 'cat', 'less', 'more', 'touch', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'tree', 'find', 'stat', 'file', 'chmod', 'chgrp', 'tee', 'basename', 'dirname'],
  text: ['head', 'tail', 'wc', 'sort', 'uniq', 'grep', 'cut', 'tr', 'sed', 'awk', 'rev', 'tac', 'nl', 'fold', 'column', 'seq', 'shuf', 'expr', 'bc', 'diff', 'yes', 'paste'],
  group: ['sudo', 'whoami', 'id', 'groups', 'members', 'getent', 'usermod', 'useradd', 'userdel', 'gpasswd', 'adduser', 'deluser', 'groupadd', 'groupmod', 'groupdel', 'newgrp', 'visudo', 'su', 'passwd'],
  people: ['who', 'w', 'users', 'finger', 'last', 'write', 'ps', 'top', 'hostname', 'uname', 'date', 'cal', 'uptime', 'jumps', 'ping'],
  game: ['send', 'skip', 'kick', 'map', 'mode', 'start', 'forgame', 'roundstats', 'gamestats', 'totalstats', 'custom', 'reset'],
  silly: ['lightning', 'love', 'kill', 'hotdog', 'fire', 'ducksay', 'fortune', 'roll', 'flip'],
  chat: ['\\mute', '\\permmute', '\\show', '\\togglesuggest', '\\help', '\\clear'],
};
const KIND = {}; for (const [k, names] of Object.entries(KINDS)) for (const n of names) KIND[n] = k;
const KEYWORDS = new Set(['for', 'in', 'do', 'done', 'if', 'then', 'else', 'elif', 'fi', 'while', 'until', '!']);

/* one page from its parts */
function page(p) {
  const out = [p.title, '', 'DUMB VERSION', `  ${p.dumb}`, '', 'WHAT IT IS', ...p.what.map(t => `  ${t}`)];
  if (p.how) out.push('', 'HOW TO', ...p.how.map((t, i) => `  ${i + 1}. ${t}`));
  if (p.flags) out.push('', p.flagsTitle || 'FLAGS AND BASICS', ...p.flags.flatMap(([f, d]) => [`  \`${f}\``, `      ${d}`]));
  if (p.ex) out.push('', 'EXAMPLES', ...p.ex.flatMap(([c, d, chat]) => [`  ${chat ? 'chat>' : '$'} ${c}`, `      ${d}`]));
  if (p.more) out.push('', ...(typeof p.more === 'function' ? p.more() : p.more));
  if (p.see) out.push('', 'SEE ALSO', `  ${p.see.join('  ')}`);
  return out.join('\n');
}

/* HelpGame's own pages */
const GAME = [
  { name: 'How', short: 'how to steer a game, step by step',
    title: 'HelpGame-How · steering a game, step by step',
    dumb: 'Be host (or get sudo). Look. Change. Fix. Repeat.',
    what: [
      'How the host and sudo use the command line to run a game well: set it up in the lobby, watch it, change it while it runs, and fix it when it gets stuck. Each step names the command.',
    ],
    how: [
      'In the lobby, pick the map and the game: `map sky`, `mode wyr`, then `start`.',
      'Give a friend a hand: `sudo usermod @name` makes them sudo; or a group with only some powers: `sudo groupadd -p canskip,canmute refs` and `sudo usermod -aG refs @name`.',
      'Watch the game: `ps` (stage, turn, timers), `w` (who is still on their turn), `forgame show` (settings).',
      'Too slow? `forgame turn-end 3/4` ends a turn when 3 of 4 players are done, or `forgame timer on writing 45`.',
      'Too fast? `forgame all-timer off` turns every timer off.',
      'Stuck? `skip` moves on.',
      'Someone too loud? `forgame \\mute on text @name` mutes them for everyone; `forgame rounds2 \\mute on all @name` for two turns only.',
      'Someone ruining it? `kick @name`; they stay out until the room goes back to the lobby.',
      'Afterwards: `gamestats | send @everyone` shows everyone how it went.',
    ],
    ex: [
      ['ps aux', 'the game and every player'],
      ['forgame order rotate', 'questions in turn instead of random'],
      ['forgame freeroam on', 'ducks may walk anywhere'],
      ['forgame stage voting \\mute on bubble @name', 'their bubbles hidden while voting'],
      ['skip', 'the stage ends now'],
    ],
    see: ['HelpGame-Settings', 'HelpGame-Players', 'HelpSudo'] },
  { name: 'Help', short: 'HelpGame\'s pages, and what each is for',
    title: 'HelpGame-Help · HelpGame\'s own pages',
    dumb: 'HelpGame has little sub-helps. Here they are.',
    what: ['HelpGame has pages of its own, each about one way to steer the game. Type the name (HelpGame-How), or help game how.'],
    more: () => ['THE PAGES', ...GAME_LIST()],
    ex: [
      ['HelpGame-How', 'the whole way, step by step'],
      ['help game settings', 'the same as HelpGame-Settings'],
      ['man forgame', 'the manual page of forgame'],
    ],
    see: ['HelpGame', 'HelpHelp'] },
  { name: 'Settings', short: 'forgame: timers, turn-end, order, gravity …',
    title: 'HelpGame-Settings · changing the game while it runs',
    dumb: 'forgame = settings, but in the middle of the game, typed.',
    what: [
      '`forgame` changes the game\'s settings while it runs, for the rest of the game. Anyone can read them with `forgame show`; changing them takes the host, sudo, or a group with cansettings.',
      'In the lobby, the Game options do this instead.',
    ],
    flags: [
      ['forgame show', 'the settings'],
      ['forgame all-timer off | on', 'every timer at once'],
      ['forgame timer on|off writing|answer|catch-up [15-120]', 'one timer, and its seconds (15 30 45 60 90 120)'],
      ['forgame turn-end everyone | half | 2/3 | 3/4', 'when a turn ends'],
      ['forgame order random | rotate', 'the order of the questions'],
      ['forgame freeroam on | off', 'ducks walk anywhere'],
      ['forgame gravity low | normal', 'floaty ducks'],
      ['forgame silly on | off', 'the silly commands'],
    ],
    ex: [
      ['forgame show', 'read them'],
      ['forgame timer on answer 60', 'a minute to answer'],
      ['forgame timer off writing', 'no hurry to write'],
      ['forgame turn-end 2/3', 'turns end when two thirds are done'],
      ['forgame gravity low && forgame freeroam on', 'two at once'],
      ['forgame silly off', 'no more lightning'],
    ],
    see: ['HelpGame-How', 'HelpGame-Perms'] },
  { name: 'Lobby', short: 'map, mode, start, hostname',
    title: 'HelpGame-Lobby · setting up in the lobby',
    dumb: 'Pick where. Pick what. Press go. All typed.',
    what: ['In the lobby, the host and sudo can pick the map and the game type, rename the room and start, all from here. `map` and `mode` alone list the choices (anyone).'],
    flags: [
      ['map / map <name>', 'the maps / picks one (board sky pixel carnival stars rabbit ec)'],
      ['mode / mode <type>', 'the game types / picks one (aod wyr bb sc quack law)'],
      ['sudo hostname "name"', 'renames the room'],
      ['start', 'starts the game, like the Start button'],
    ],
    ex: [
      ['map', 'the maps'],
      ['map pixel', 'the Pixel map'],
      ['mode bb', 'Bicker Brackets'],
      ['sudo hostname "Duck Night"', 'a new room name'],
      ['map sky && mode wyr && start', 'set up and go, in one line'],
    ],
    see: ['HelpGame-How', 'HelpGame-Settings'] },
  { name: 'Players', short: 'skip, kick, mutes for everyone, who is doing what',
    title: 'HelpGame-Players · players: watch, mute, skip, kick',
    dumb: 'See who\'s slow. Hush who\'s loud. Kick who\'s mean.',
    what: [
      '`w`, `who`, `finger` and `top` show who is here and what they are doing. sudo (or groups given canskip, canmute or cankick) can move the game on, mute someone for everyone, or remove them.',
      'A mute from forgame is seen by everyone, unlike \\mute in the chat, which only hides things from you. It can last the game, a number of turns, or some stages.',
    ],
    flags: [
      ['w / who / finger @name / top', 'who is doing what / who is here / a player\'s card / by Jumps, live'],
      ['skip', 'ends the stage now (canskip)'],
      ['kick @name', 'removes a player until the next lobby (cankick)'],
      ['forgame \\mute on|off bubble ping text all @names', 'mutes for everyone (canmute)'],
      ['forgame roundsN \\mute …', 'for N turns'],
      ['forgame stage[N] voting writing … \\mute …', 'in those stages (the next N)'],
    ],
    ex: [
      ['w', 'who is still on their turn'],
      ['finger @name', 'their duck, groups and Jumps'],
      ['forgame \\mute on text @name', 'their chat hidden for everyone'],
      ['forgame rounds3 \\mute on all @name', 'everything hidden for three turns'],
      ['forgame \\mute off all @name', 'undone'],
      ['kick @name', 'gone until the lobby'],
    ],
    see: ['HelpGame-Perms', 'HelpChat'] },
  { name: 'Send', short: 'putting a command\'s output or a file in the chat',
    title: 'HelpGame-Send · sending to the chat',
    dumb: 'Make the computer say it out loud in chat.',
    what: [
      '`send` posts what a command prints to the chat, in small print with the command above it. \\@name sends it to one player only. A file sent by itself shows its name, and only sudo can open it, unless chmod says its group or everyone may.',
      'A line sends 3 times at most, and groups with nosend, nochat or slow can\'t, or must wait.',
    ],
    flags: [
      ['send @everyone <command>', 'its output to everyone'],
      ['send @a @b <command>', 'to everyone, pinging those two'],
      ['send \\@name <command>', 'privately'],
      ['<command> | send @everyone', 'what came through the pipe'],
      ['send @everyone file', 'the file itself'],
    ],
    ex: [
      ['send @everyone fortune', 'a fortune for the room'],
      ['send \\@name jumps', 'your Jumps, to one player'],
      ['gamestats | head -n 3 | send @everyone', 'part of the stats'],
      ['echo "snack break in 5" > note; chmod o+r note; send @everyone note', 'a file everyone may open'],
    ],
    see: ['HelpChat', 'HelpFile'] },
  { name: 'Stats', short: 'roundstats, gamestats, totalstats, jumps',
    title: 'HelpGame-Stats · stats',
    dumb: 'Numbers about who did what. Brag responsibly.',
    what: ['roundstats (this round), gamestats (this game) and totalstats (all time) show stats only you see. Add @names for some players, or -m and a game type for that game\'s stats.'],
    flags: [
      ['roundstats / gamestats / totalstats', 'this round / this game / all time'],
      ['… @name @name', 'only those players'],
      ['… -m aod|wyr|bb|sc|quack|law', 'one game type'],
      ['jumps [@names]', 'Jumps, this game and all time'],
    ],
    ex: [
      ['gamestats', 'this game'],
      ['totalstats -m wyr', 'all-time Would You Rather'],
      ['roundstats @name', 'one player this round'],
      ['totalstats | sort | head -n 3', 'the top of the list'],
      ['jumps', 'your Jumps'],
    ],
    see: ['HelpGame-Send', 'HelpText'] },
  { name: 'Perms', short: 'giving friends part of the host\'s job',
    title: 'HelpGame-Perms · sharing the host\'s job',
    dumb: 'Give friends some boss powers, not all of them.',
    what: [
      'sudo is all the powers. A group with a perm that gives is only some: canskip (skip), canmute (forgame \\mute), cankick (kick) and cansettings (forgame settings). Groups can take things away too: nochat, nosend, nofun, nomute, nocmd, slow.',
    ],
    flags: [
      ['canskip canmute cankick cansettings', 'give'],
      ['nocmd nochat nosend nofun nomute slow slowN', 'take away'],
      ['sudo groupadd -p perm,perm name', 'a group with them'],
      ['sudo groupmod -p perm,perm name', 'changes them'],
    ],
    ex: [
      ['sudo groupadd -p cansettings,canskip cohosts', 'co-hosts for settings and skipping'],
      ['sudo usermod -aG cohosts @name', 'a co-host'],
      ['sudo groupadd -p nocmd,slow60 timeout', 'a timeout corner'],
      ['sudo -l', 'what your groups let you do'],
    ],
    see: ['HelpGroups', 'HelpSudo'] },
];
/* the pages: name (as typed after Help), the line in help's list, the longer description (HelpDescription), the page */
const PAGES = [
  { name: 'CommandLine', group: 'Start here', short: 'never used a command line? start here',
    desc: 'For people who have never used a command line. What it is, why you would type instead of click, and your first five commands, one step at a time.',
    title: 'HelpCommandLine · the command line, from zero',
    dumb: 'You type a word, press Enter, the duck computer answers. That\'s it. That\'s the whole thing.',
    what: [
      'The command line is the black box you are typing in. Instead of buttons, you give orders with words. Each order is a command: a word like `whoami` or `ls`, sometimes with more words after it.',
      'The game answers right under what you typed. What it prints is only for you; nobody else sees it unless you `send` it to the chat.',
      'You can\'t break the game from here. The worst that happens is a ✗ line that says what went wrong.',
    ],
    how: [
      'Open it with Shift+T (or the round button at the bottom left, then the symbol beside the box until it shows a green $).',
      'Type a command, like `whoami`, and press Enter.',
      'Read the answer under it. A line that starts with ✗ means it didn\'t work, and says why.',
      'Press ↑ to bring back what you typed before, change it, and press Enter again.',
      'Press Tab while typing: it finishes the word for you and shows what can come next.',
      'Type `clear` (or press Ctrl+L) when the window is full, and `exit` (or Esc) to close it.',
    ],
    flags: [
      ['command', 'the first word: what to do (whoami, ls, echo)'],
      ['command words', 'the words after it: what to do it to (echo hello)'],
      ['command -x', 'a word with a - in front is a flag: it changes how the command works (ls -l)'],
      ['"two words"', 'quotes keep words together as one'],
      ['Tab  ↑ ↓  Ctrl+C  Ctrl+L', 'finish a word · earlier commands · stop · clear'],
    ],
    flagsTitle: 'THE PARTS OF A COMMAND',
    ex: [
      ['whoami', 'your name, as the command line knows it'],
      ['echo hello there', 'prints the words back: the simplest command'],
      ['who', 'who is in the room, with the host and sudo marked'],
      ['roll 2d6', 'rolls two dice: the 2d6 is a word that tells roll what to do'],
      ['ducksay quack', 'a duck says it'],
      ['help', 'the list of help pages, whenever you are lost'],
    ],
    see: ['HelpBasics', 'HelpHelp', 'HelpMan'] },

  { name: 'Basics', group: 'Start here', short: 'how a command is written, Tab, history, man',
    desc: 'How any command is written (name, flags, words), quotes, Tab, going back through what you ran, and where to read more. Read it after HelpCommandLine.',
    title: 'HelpBasics · how every command works',
    dumb: 'Name first, then the little -dash words, then the rest. Tab guesses. ↑ remembers. man explains.',
    what: [
      'Every command is written the same way: its name, then its flags (words that start with -), then the words it works on. `head -n 3 ideas` is head, the flag -n 3, and the file ideas.',
      'Spaces split words. Put "quotes" around words that belong together. \\ in front of a character keeps it as it is.',
      'Use `man` and a command\'s name to read everything about it (`man grep`), or put --help after it (`grep --help`). man is how you learn a command you have never seen.',
    ],
    how: [
      'Start with the name of the command: `ls`.',
      'Add a flag to change how it works: `ls -l`. Several flags can go together: `ls -la`.',
      'Add the words it should work on: `ls -l notes`.',
      'Not sure? Type the name and press Tab, or read `man ls`.',
    ],
    flags: [
      ['Tab', 'completes names, files, @players, groups, flags and help pages'],
      ['↑ ↓', 'the commands you ran before'],
      ['Ctrl+R', 'searches them (press it again to go further back)'],
      ['Ctrl+C', 'stops a running command, or drops the line you are typing'],
      ['Ctrl+L or clear', 'clears the window'],
      ['history', 'lists what you ran; !! runs the last one again'],
      ['man <command>', 'everything about one command and its flags'],
      ['<command> --help', 'the same, shorter'],
    ],
    ex: [
      ['ls -l', 'a command with a flag'],
      ['echo "hello   there"', 'quotes keep the spaces inside them'],
      ['man echo', 'the manual page of echo'],
      ['grep --help', 'the short help of any command'],
      ['history 5', 'the last five things you ran'],
      ['!!', 'runs the last command again'],
    ],
    see: ['HelpCommandLine', 'HelpOptions', 'HelpMan', 'HelpOperators'] },

  { name: 'Help', group: 'Start here', short: 'how help itself works',
    desc: 'How to find help: help, the Help pages, help <word>, man, man -k, apropos and --help, and what the colors in the command line mean.',
    title: 'HelpHelp · how to get help',
    dumb: 'Type help. Pick a word from the list. Type that word. Repeat until smart.',
    what: [
      '`help` lists the Help pages. Each page is a command of its own: type HelpChat, HelpFile and so on. Capitals don\'t matter, and `help chat` opens the same page as HelpChat.',
      'Every page starts with a dumb version, then says what it is, how to do it, the flags and basics, and examples. Each example shows a different way of using it.',
      'For one command, `man` tells everything (`man sort`), and --help after a command tells it shortly. `man -k word` finds the commands that have to do with a word.',
      'Commands are colored by kind; `help` shows which color is which.',
    ],
    how: [
      'Type `help` and find what you need in the list.',
      'Type the page\'s name: HelpGroups.',
      'Try the examples: type one exactly, then change a word of it.',
      'Stuck on one command? `man` and its name.',
    ],
    flags: [
      ['help', 'the list of Help pages and the colors'],
      ['help <page>', 'a page (help groups is HelpGroups); help game how is HelpGame-How'],
      ['help <command>', 'a command\'s manual page, if there is no page by that name'],
      ['help all', 'every command, on a few lines'],
      ['man -k word', 'the commands whose page says the word (apropos word too)'],
      ['<command> --help', 'one command\'s help'],
    ],
    ex: [
      ['help', 'the list'],
      ['HelpGroups', 'a page, by its name'],
      ['help sudo', 'the same as HelpSudo'],
      ['HelpGame-How', 'one of HelpGame\'s own pages'],
      ['man -k file', 'every command that has to do with files'],
      ['help | grep Game', 'help is text like any other: grep finds lines in it'],
    ],
    see: ['HelpDescription', 'HelpMan', 'HelpBasics'] },

  { name: 'Man', group: 'Start here', short: 'man pages: everything about one command',
    desc: 'The manual: man <command> for any command, man -k and apropos to search, --help, and how to read a manual page\'s line of flags.',
    title: 'HelpMan · the manual',
    dumb: 'man = manual. man thing = how thing works. Read it, then do it.',
    what: [
      'Every command has a manual page. `man` and a command\'s name shows it: what the command does, every flag, and an example.',
      'In a page, [square brackets] mean you may leave it out, a | between words means one or the other, and … means as many as you like. `head [-n N] [file]` works as head, head -n 3, or head -n 3 ideas.',
      'man -k searches every page for a word, when you know what you want to do but not the command\'s name.',
    ],
    how: [
      'Type `man` and the command: `man grep`.',
      'Find the flag you need in the page.',
      'Try it: `grep -i duck` with what you read.',
      'Don\'t know the name? `man -k` and a word: `man -k count`.',
    ],
    flags: [
      ['man <command>', 'the page of one command'],
      ['man -k word', 'the commands whose page has the word'],
      ['apropos word', 'the same as man -k'],
      ['<command> --help', 'the page, without opening man'],
      ['type <name>', 'what a name is: a command, a builtin, an alias or a keyword'],
      ['which <name>', 'where a command lives (/bin)'],
    ],
    ex: [
      ['man sort', 'every flag of sort'],
      ['man -k count', 'commands that count things'],
      ['apropos group', 'commands that have to do with groups'],
      ['sort --help', 'the same page as man sort'],
      ['type ls', 'what ls is'],
      ['man send | fold -w 30', 'a page, wrapped narrow'],
    ],
    see: ['HelpHelp', 'HelpOptions', 'HelpBasics'] },

  { name: 'Bash', group: 'The language', short: 'variables, $( ), loops, if, aliases, scripts',
    desc: 'The bash language this command line speaks: variables, the game\'s own variables, arithmetic, $( ), quotes, braces, loops, if, aliases, eval and source.',
    title: 'HelpBash · the language',
    dumb: 'The command line can remember things, do math and repeat itself. Like a calculator that learned to talk.',
    what: [
      'This command line speaks a small bash, the language of real command lines. Besides running commands, it can keep words in variables, do arithmetic, put one command\'s output inside another, and repeat commands with loops.',
      'Your variables last this game. The game has its own that you can read but not change: $USER $HOME $PWD $HOST $ROOM $MODE $MAP $ROUND $STAGE $PLAYERS $RANDOM.',
      'A line runs 500 commands at most, and a loop goes round 50 times at most, so nothing runs forever.',
    ],
    how: [
      'Set a variable with no spaces around =: team=red',
      'Use it with $: `echo $team`.',
      'Put a command inside another with $( ): `echo "I am $(whoami)"`.',
      'Repeat with for: `for x in a b c; do echo $x; done`.',
    ],
    flags: [
      ['name=value', 'sets a variable (export name=value too); unset name forgets it'],
      ['$name  ${name}', 'its value; "$name" keeps it one word; \'$name\' keeps the $ as it is'],
      ['${#name}  ${name:-word}', 'how many letters it has / word when it is empty (${name:=word} also sets it)'],
      ['$((6 * 7))', 'arithmetic: + - * / % ** and ( )'],
      ['$(command)', 'what a command printed, inside another command'],
      ['$?', '0 if the last command worked, more if it failed'],
      ['{a,b} {1..5}', 'become several words: a b, 1 2 3 4 5'],
      ['~', 'your home, /usr/<you>'],
      ['for … in …; do …; done', 'repeats for each word'],
      ['while …; do …; done', 'repeats while it works (until: until it works)'],
      ['… | while read x; do …; done', 'one line at a time (read puts a line in x)'],
      ['… | xargs command', 'runs the command with the words that came in'],
      ['for …; done > file', 'a loop\'s output into a file'],
      ['if …; then …; else …; fi', 'one part or the other'],
      ['alias name=\'words\'', 'your own short name for a command, kept on this device from game to game (alias lists them; unalias name forgets one, unalias -a all)'],
      ['source file', 'runs the commands written in a file, line by line'],
      ['# words', 'a note: the rest of the line is skipped'],
    ],
    ex: [
      ['team="red ducks"; echo "go $team"', 'a variable, then using it'],
      ['echo $((3 * 4 + 1))', 'arithmetic'],
      ['echo "Room $ROOM, round $ROUND, map $MAP"', 'the game\'s own variables'],
      ['for p in $PLAYERS; do echo "hi $p"; done', 'a loop over every player'],
      ['if [ "$STAGE" = lobby ]; then echo waiting; else echo playing; fi', 'if, with test\'s [ ]'],
      ['n=0; while [ $n -lt 3 ]; do n=$((n + 1)); echo $n; done', 'a while loop that counts'],
      ['echo {red,blue,green}-team', 'braces make several words'],
      ['alias zap=\'lightning\'', 'zap @name now strikes lightning'],
    ],
    see: ['HelpOperators', 'HelpOptions', 'HelpFile'] },

  { name: 'Operators', group: 'The language', short: '| > >> < && || ; and friends',
    desc: 'The symbols between commands: pipes, writing and adding to files, reading from files, errors, ; && || to chain, ! and history\'s !! and ^old^new.',
    title: 'HelpOperators · the symbols between commands',
    dumb: '| hands the answer to the next command. > puts it in a file. && means "and then, if it worked".',
    what: [
      'Operators are the symbols that join commands. A pipe | gives one command\'s output to the next, so small commands work together: one finds, the next sorts, the next counts.',
      '> and >> send output into a file instead of the screen; < reads a file in. ; && and || run commands one after another, with or without a condition.',
    ],
    how: [
      'Run a command alone first: `gamestats`.',
      'Add a pipe and a second command: `gamestats | grep Jumps`.',
      'Keep it with > instead of looking at it: `gamestats > stats1`.',
      'Chain the next step with &&: `gamestats > stats1 && cat stats1`.',
    ],
    flags: [
      ['a | b', 'a\'s output goes into b'],
      ['a > file', 'writes a\'s output into a file (replaces it)'],
      ['a >> file', 'adds it to the end of the file'],
      ['a < file', 'reads the file into a'],
      ['a <<< words', 'reads the words into a'],
      ['a 2> file', 'the errors into a file (2>> adds)'],
      ['a 2>&1', 'the errors go with the output'],
      ['a &> file', 'output and errors into the file'],
      ['/dev/null', 'swallows whatever goes there'],
      ['a ; b', 'a, then b'],
      ['a && b', 'b only if a worked'],
      ['a || b', 'b only if a failed'],
      ['! a', 'flips whether a worked'],
      ['!!  !3  !-2  !ec', 'the last command, the 3rd, the one before last, the last starting with ec'],
      ['^old^new', 'the last command again, with a word swapped'],
    ],
    ex: [
      ['roundstats | grep Jumps', 'a pipe: only the lines with Jumps'],
      ['totalstats | sort | head -n 3', 'three commands in a row'],
      ['echo "ask about pizza" >> ideas', 'adds a line to a file'],
      ['sort < ideas', 'reads the file into sort'],
      ['tr a-z A-Z <<< quack', 'a word into a command: QUACK'],
      ['cat nope 2> /dev/null || echo "no file"', 'hides the error, then says it nicely'],
      ['mkdir -p plans && echo ok', 'the second only if the first worked'],
      ['gamestats | tee stats1 | wc -l', 'tee keeps a copy and passes it on'],
    ],
    see: ['HelpBash', 'HelpText', 'HelpFile'] },

  { name: 'Options', group: 'The language', short: 'flags: the -x words that change a command',
    desc: 'Flags (options): what -x and --word mean, putting flags together, flags that take a value, and the flags you will use most.',
    title: 'HelpOptions · flags',
    dumb: 'Little words with a - in front. They tweak the command. ls is plain, ls -l is fancy.',
    what: [
      'An option, or flag, is a word that starts with - and changes how a command works. `ls` lists names; `ls -l` lists them long, with sizes and times.',
      'Flags of one letter can go together: -l -a is the same as -la. Some flags take a value right after them: -n 3 (or -n3).',
      '-- ends the flags: what comes after is a word, even if it starts with -. Each command\'s flags are in its man page.',
    ],
    how: [
      'Read a command\'s flags with `man`: `man sort`.',
      'Add one: `sort -r ideas`.',
      'Put two together: `sort -rn scores`.',
      'Give a flag its value: `head -n 2 ideas`.',
    ],
    flags: [
      ['-l -a  or  -la', 'flags of one letter, apart or together'],
      ['-n 3  or  -n3', 'a flag with a value'],
      ['--help', 'one command\'s help'],
      ['--', 'the end of the flags'],
      ['ls -l -a -R', 'long, hidden . and .., folders inside folders'],
      ['grep -i -v -c -n -w', 'any case, the lines that don\'t, count, line numbers, whole words'],
      ['sort -r -n -u -k N', 'backwards, by number, no repeats, by the Nth column'],
      ['head -n N / tail -n N', 'the first or last N lines'],
      ['wc -l -w -c', 'count lines, words or characters'],
      ['rm -r -f / cp -r / mkdir -p', 'folders too, no errors / copy a folder / make the folders on the way'],
    ],
    ex: [
      ['ls -la', 'two flags in one'],
      ['ls -l -a', 'the same, apart'],
      ['head -n 2 /usr/$USER/log', 'a flag with a value'],
      ['seq 10 | tail -n 3', 'the last three numbers'],
      ['who | grep -c sudo', 'counts the lines with sudo'],
      ['printf "3 a\\n10 b\\n2 c\\n" | sort -rn', 'biggest number first'],
    ],
    see: ['HelpMan', 'HelpBasics', 'HelpText'] },

  { name: 'Text', group: 'The language', short: 'grep, sed, awk, sort and the other text tools',
    desc: 'The text tools: finding lines (grep), sorting and counting (sort, uniq, wc), cutting columns (cut, awk), replacing (tr, sed) and the small ones.',
    title: 'HelpText · the text tools',
    dumb: 'Commands that chew on words: find some, sort them, count them, swap them.',
    what: [
      'Text tools read lines (from a file, or from a pipe |) and print them changed. Joined with |, they answer questions like "who has the most Jumps?" or "what did I type most?".',
      'grep finds lines, sort sorts them, uniq drops repeats, wc counts, head and tail keep the start or the end, cut and awk pick columns, tr and sed replace.',
    ],
    how: [
      'Get some lines: `totalstats`.',
      'Pipe them into a tool: `totalstats | sort`.',
      'Add the next tool: `totalstats | sort | head -n 3`.',
      'Look up the flags you need with `man`.',
    ],
    flags: [
      ['grep word', 'the lines with word (-i any case, -v the others, -c count)'],
      ['sort / uniq -c', 'sort lines / count repeats'],
      ['wc -l', 'how many lines'],
      ['head / tail', 'the first / last lines'],
      ['cut -d: -f1', 'the first column, split by :'],
      ['awk \'{print $2}\'', 'the second column'],
      ['tr a-z A-Z', 'swaps characters (here: capitals)'],
      ['sed \'s/old/new/g\'', 'replaces words'],
      ['grep -r word', 'the lines with word in every file in this folder and the ones in it'],
      ['rev tac nl fold column paste', 'backwards, last line first, numbers, wrap, neat columns, side by side'],
      ['seq shuf printf expr bc diff yes', 'count, shuffle, print with a pattern, math, compare, repeat'],
    ],
    ex: [
      ['totalstats | sort | head -n 3', 'the first three'],
      ['ping | sort -t: -k 2 -n', 'the connections, fastest first'],
      ['echo "I like pizza" | sed \'s/pizza/tacos/\'', 'replaces a word'],
      ['shuf -n 1 -e $PLAYERS', 'picks a random player'],
      ['history | awk \'{print $2}\' | sort | uniq -c | sort -rn', 'your favorite commands'],
      ['echo "2^10 + 3*4" | bc', 'a calculator'],
    ],
    see: ['HelpOperators', 'HelpFile', 'HelpOptions'] },

  { name: 'File', group: 'Files', short: 'make, read, copy, send and share files',
    desc: 'Files: writing and reading notes, copying, moving, removing, perma-notes that last from game to game, wildcards, and who may open a file you send (chmod, chgrp).',
    title: 'HelpFile · files',
    dumb: 'Write stuff down. Read it later. Send it to friends. Only sudo peeks unless you say so.',
    what: [
      'You have a little set of files: notes for this game, perma-notes kept on this device from game to game, and a log of everything you ran. They live on your device; other players can\'t open them.',
      'Write a file with > or touch, read it with cat, and change, copy, move or remove it with the file commands.',
      'When you send a file to the chat, only sudo can open it, unless chmod lets its group (g+r, with chgrp) or everyone (o+r) open it.',
    ],
    how: [
      'Write a line into a file: `echo "pizza night" > ideas`.',
      'Add another: `echo "duck race" >> ideas`.',
      'Read it: `cat ideas`.',
      'Let everyone open it and send it: `chmod o+r ideas && send @everyone ideas`.',
    ],
    flags: [
      ['cat file', 'shows it (-n: with line numbers)'],
      ['echo words > file / >> file', 'writes / adds a line'],
      ['touch file', 'an empty file'],
      ['cp from to (-r)', 'copies (a folder with -r)'],
      ['mv from to', 'moves or renames'],
      ['rm file (-r -f)', 'removes (a folder with -r; no errors with -f)'],
      ['ls -l', 'your files with permissions, group, size and time'],
      ['stat file / file name', 'the details of a file / what something is'],
      ['chmod g+r / o+r / a+r file', 'who may open it once sent: its group / everyone / both (- takes it back)'],
      ['chgrp group file', 'the group that chmod g+r means'],
      ['* ? [ab]', 'wildcards: any letters, one letter, one of these letters'],
    ],
    ex: [
      ['echo "bring snacks" > plan && cat plan', 'write, then read'],
      ['cp plan ~/perma-notes/', 'keeps a copy for the next games'],
      ['ls -l', 'what you have'],
      ['cat /usr/$USER/log | tail -n 4', 'the end of your log'],
      ['chgrp sudo plan; chmod g+r plan', 'the sudo group may open it when sent'],
      ['send @everyone plan', 'sends the file itself to the chat'],
      ['mv plan plan-old', 'renames it'],
      ['rm *-old', 'removes every file whose name ends in -old'],
    ],
    see: ['HelpDirectories', 'HelpGame-Send', 'HelpGroups'] },

  { name: 'Directories', group: 'Files', short: 'folders: where your files live, cd, ls, paths',
    desc: 'Folders: your home, notes/, perma-notes/, log, /usr and /bin, moving around with cd, paths like ~ . .. and /, and making folders.',
    title: 'HelpDirectories · folders',
    dumb: 'Folders are boxes for files. cd walks into a box. ls looks inside. .. walks back out.',
    what: [
      'A directory is a folder. You start in your notes folder, inside your home, /usr/<you>.',
      'Your home holds notes/ (this game\'s files and folders), perma-notes/ (kept on this device; only superuser-<you> can open it) and log (read-only).',
      '/usr shows everyone\'s home, but their files are on their own devices. /bin holds the commands; nobody can open it, not even the host.',
    ],
    how: [
      'Where are you? `pwd`.',
      'What is here? `ls`.',
      'Go into a folder: `cd ~/perma-notes`; back up: `cd ..`; home: `cd`.',
      'Make one: `mkdir games`, and see them all: `tree`.',
    ],
    flags: [
      ['pwd', 'the folder you are in'],
      ['ls [-a -l -R] [folder]', 'what is in it'],
      ['cd folder / cd .. / cd / cd -', 'in / up one / home / back to the last one'],
      ['mkdir -p a/b', 'folders (and the ones on the way)'],
      ['rmdir folder / rm -r folder', 'removes an empty folder / one with files'],
      ['tree / find', 'everything, drawn as a tree / searched by name'],
      ['/  ~  .  ..', 'the top, your home, here, one up'],
    ],
    ex: [
      ['pwd', 'where you are'],
      ['ls ~', 'your home: log, notes/, perma-notes/'],
      ['cd ~/perma-notes && ls', 'into a folder, and look'],
      ['cd -', 'back where you were'],
      ['mkdir -p games/round1 && tree', 'two folders at once, then the tree'],
      ['find ~ -name "*plan*"', 'every file with plan in its name'],
      ['ls /usr', 'everyone\'s home folder'],
      ['ls /bin | wc -l', 'how many commands there are'],
    ],
    see: ['HelpFile', 'HelpBasics'] },

  { name: 'Chat', group: 'People', short: 'the chat, and sending to it from here',
    desc: 'The text chat: pings with @, private messages with \\@, mutes, \\show, and how the command line sends to the chat (send, write).',
    title: 'HelpChat · the chat',
    dumb: 'Type words, press Enter, friends see them. @ pokes someone. \\@ whispers.',
    what: [
      'The chat is the other side of this window (T opens it; Shift+T is the command line; the symbol beside the box switches). What you type there goes to everyone in the room.',
      '@name pings a player (a soft sound and a "!"), \\@name sends privately, and the \\ commands mute people or show what is muted.',
      'From the command line, `send` posts what a command prints to the chat, and `write` sends a private message.',
    ],
    how: [
      'Press T and type a message; Enter sends it.',
      'Put @ and a name to ping someone: hi @name.',
      'Start with \\@name to whisper: only they see it.',
      'From here: `send @everyone fortune` posts a command\'s answer.',
    ],
    flags: [
      ['@name / @everyone', 'pings a player / everyone'],
      ['\\@name message', 'a private message'],
      ['\\mute bubble ping text on @name', 'hides those from you until you leave (all: everything; off: undo)'],
      ['\\permmute …', 'the same, kept on this device (it asks first; -f skips that)'],
      ['\\show mute / permmute / players', 'what you muted, and who is here'],
      ['\\togglesuggest', 'the chat\'s suggestions on or off'],
      ['\\help / \\clear', 'the chat\'s help / clears the chat on your screen'],
      ['send @everyone <command>', 'from the command line: posts what the command prints'],
      ['write @name message', 'from the command line: a private message'],
    ],
    ex: [
      ['hi everyone, ready? @everyone', 'pings the whole room', true],
      ['\\@name psst, vote red', 'only they see it', true],
      ['\\mute bubble on @name', 'hides their speech bubbles on the board', true],
      ['\\show players', 'who is in the room', true],
      ['send @everyone ducksay good luck', 'a duck wishes everyone luck'],
      ['roundstats | send @everyone', 'a pipe into send'],
      ['write @name nice one', 'a private message from here'],
    ],
    see: ['HelpGame-Send', 'HelpSilly', 'HelpGroups'] },

  { name: 'Groups', group: 'People', short: 'groups and their perms',
    desc: 'Groups: who is in what, making groups with perms that take away (nochat, slow30 …) or give part of the host\'s job (canskip, cankick …), dumbasses and superuser-<name>.',
    title: 'HelpGroups · groups and perms',
    dumb: 'Put ducks in clubs. Clubs have rules. Some clubs can\'t talk. Some clubs can kick.',
    what: [
      'Players can be in groups, and a group can have perms: rules for everyone in it. Some perms take something away, like the chat; others give part of the host\'s job, like skipping a stage.',
      'Every room has sudo (the host and whoever they trust) and dumbasses (no silly commands, one message every 15 seconds). Each player also has superuser-<name>, which nobody can change: it alone opens their perma-notes.',
      'Anyone can look at groups; only sudo makes and changes them.',
    ],
    how: [
      'See the groups: `getent group`.',
      'Make one with perms: `sudo groupadd -p nochat,slow30 shh`.',
      'Put a player in it: `sudo usermod -aG shh @name`.',
      'Take them out again: `sudo gpasswd -d @name shh`.',
    ],
    flags: [
      ['groups [@name] / id [@name]', 'someone\'s groups'],
      ['members group / getent group', 'who is in a group / every group, with members and perms'],
      ['sudo groupadd -p perm,perm name', 'a new group'],
      ['sudo groupmod -n new old / -p perms name', 'renames it / changes its perms (-p "" clears them)'],
      ['sudo groupdel name', 'removes it (not sudo or dumbasses)'],
      ['sudo usermod -aG g @name / -rG / -G', 'adds to groups / takes out / sets exactly these'],
      ['sudo gpasswd -a @name g / -d', 'adds / takes out one player'],
      ['sudo adduser @name g / deluser / useradd -G g @name', 'the same, other words'],
      ['nocmd nochat nosend nofun nomute slow slow30', 'perms that take away (slowN: 5 to 600 seconds)'],
      ['canskip canmute cankick cansettings', 'perms that give part of the host\'s job'],
    ],
    ex: [
      ['getent group', 'every group, its members and perms'],
      ['sudo groupadd -p canskip,cankick refs', 'referees, who may skip and kick'],
      ['sudo usermod -aG refs @name', 'makes someone a referee'],
      ['sudo groupadd -p slow30 chill', 'a group that chats once every 30 seconds'],
      ['sudo groupmod -p nochat,nofun chill', 'changes its perms'],
      ['members dumbasses', 'who is in the dumbasses'],
      ['sudo usermod -aG dumbasses @name', 'you know what you did'],
      ['sudo groupdel chill', 'removes it'],
    ],
    see: ['HelpSudo', 'HelpGame-Perms', 'HelpFile'] },

  { name: 'Sudo', group: 'People', short: 'sudo: running the room like the host',
    desc: 'sudo: what it is, who has it (the host always), giving it to others, sudo !!, sudo -l, and what only sudo may do.',
    title: 'HelpSudo · sudo',
    dumb: 'sudo = "do it, I\'m the boss". The host is boss. The host can make more bosses.',
    what: [
      'sudo is the group that runs the room. The host is always in it, and can put others in it so they can help.',
      'Put the word sudo in front of a command to run it as sudo: `sudo groupadd …`. If you are in sudo (the host always is), the word is optional: `groupadd …` works too.',
      'sudo can also open any file sent to the chat. If you are not in sudo, sudo commands answer with a ✗.',
    ],
    how: [
      'Check what you may do: `sudo -l`.',
      'The host gives sudo to someone: `sudo usermod @name`.',
      'Forgot sudo? `sudo !!` runs the last command again with it.',
      'Take it back: `sudo usermod -rG sudo @name` (the host keeps it, always).',
    ],
    flags: [
      ['sudo <command>', 'runs it as sudo'],
      ['sudo -l', 'what sudo lets you do'],
      ['sudo !!', 'the last command, with sudo'],
      ['sudo usermod @name', 'gives sudo'],
      ['sudo usermod -rG sudo @name', 'takes it away'],
      ['sudo hostname "name"', 'renames the room'],
      ['usermod useradd gpasswd adduser deluser groupadd groupmod groupdel hostname', 'only sudo'],
      ['skip kick forgame map mode start', 'sudo, or groups given canskip, cankick, cansettings, canmute'],
    ],
    ex: [
      ['sudo -l', 'what you may do'],
      ['sudo usermod @name', 'a second boss'],
      ['sudo hostname "Pond Party"', 'renames the room'],
      ['groupadd -p nofun quiet', 'the word sudo is optional when you are in sudo'],
      ['sudo usermod -rG sudo @name', 'takes sudo back'],
      ['who', 'who is in sudo'],
    ],
    see: ['HelpGroups', 'HelpGame', 'HelpGame-How'] },

  { name: 'Game', group: 'The game', short: 'steer the game with sudo (has its own pages)',
    desc: 'What only DuckFriends has: changing the game while it runs, skipping, kicking, mutes for everyone, the lobby\'s map and mode, stats and sending to the chat. HelpGame has its own pages: HelpGame-How, HelpGame-Help, HelpGame-Settings, HelpGame-Lobby, HelpGame-Players, HelpGame-Send, HelpGame-Stats and HelpGame-Perms.',
    title: 'HelpGame · steering the game from here',
    dumb: 'With sudo you are the game\'s remote control. Skip, kick, change timers, change gravity. Use your powers for fun.',
    what: [
      'The command line can change the game itself. The host and sudo (and groups given perms like canskip) can change settings in the middle of a game, skip a stage, kick a player, and mute someone for everyone.',
      'In the lobby, sudo picks the map and the game type and starts the game. Anyone can read the settings, the stats, and who is doing what.',
      'Use it with purpose: to fix a stuck game, to speed up or slow down, to keep a loud player in check, or to give friends a part of the host\'s job.',
    ],
    how: [
      'Read the settings: `forgame show`.',
      'Change one: `forgame timer on writing 60`.',
      'Skip a stage that is taking too long: `skip`.',
      'Read HelpGame-How for the whole way, step by step.',
    ],
    flags: [
      ['forgame show', 'the settings (anyone)'],
      ['forgame <setting> …', 'changes one mid-game (HelpGame-Settings)'],
      ['skip', 'ends the stage now and moves on'],
      ['kick @name', 'removes a player at once'],
      ['forgame \\mute on text @name', 'mutes someone for everyone (HelpGame-Players)'],
      ['map / mode / start', 'in the lobby (HelpGame-Lobby)'],
      ['send @everyone <command>', 'posts to the chat (HelpGame-Send)'],
      ['roundstats gamestats totalstats', 'stats (HelpGame-Stats)'],
    ],
    ex: [
      ['forgame show', 'how the game is set up right now'],
      ['forgame gravity low', 'every duck floats'],
      ['forgame turn-end half', 'a turn ends when half the players are done'],
      ['ps', 'what the game is running: stage, turn, timers'],
      ['w', 'who is still playing their turn'],
      ['sudo groupadd -p canskip helpers', 'a group of players who may skip too'],
    ],
    more: () => ['HELPGAME\'S OWN PAGES', ...GAME_LIST()],
    see: ['HelpSudo', 'HelpGroups', 'HelpSilly'] },

  { name: 'Silly', group: 'The game', short: 'lightning, love, kill, hotdog, fire and toys',
    desc: 'The silly commands everyone sees on the board (lightning, love, kill, hotdog, fire), their limits, how the host turns them off, and the toys (ducksay, fortune, roll, flip).',
    title: 'HelpSilly · the silly commands',
    dumb: 'Zap your friends. Set them on fire. Make them fall in love. It\'s fine, they\'re ducks.',
    what: [
      'The silly commands do something to a duck on the board that everyone sees, and the chat says in small print who did it.',
      'A line runs 3 of them at most, a second apart. The host can turn them off (Game options → Additional settings, or `forgame silly off`), and dumbasses and groups with nofun can\'t use them.',
      'The toys (ducksay, fortune, roll, flip) only print things, so they work anywhere.',
    ],
    how: [
      'Pick a duck: Tab after the command shows the names.',
      'Type the command and the name: lightning @name.',
      'Watch the board.',
    ],
    flags: [
      ['lightning @name', 'strikes a duck with lightning'],
      ['love @a @b', 'two ducks float up in a heart'],
      ['kill @name', 'a duck plays dead until it moves'],
      ['hotdog @name', 'a hotdog hangs around a duck'],
      ['fire @name', 'a duck burns, then stays charred for a while'],
      ['ducksay words / fortune / roll 2d6 / flip', 'the toys'],
    ],
    ex: [
      ['lightning @name', 'zap'],
      ['love @name @name', 'two ducks in love'],
      ['for p in $PLAYERS; do hotdog @$p; done', 'hotdogs for the first three (3 a line)'],
      ['ducksay vote red | send @everyone', 'a duck says it in the chat'],
      ['fortune', 'a duck\'s wisdom'],
      ['roll 2d6 && flip', 'dice, then a coin'],
    ],
    see: ['HelpChat', 'HelpGame-Settings'] },

  { name: 'Description', group: 'About help', short: 'what every Help page is about, in a few lines',
    desc: 'This page: what each Help page covers, in a few lines each.',
    title: 'HelpDescription · what each Help page is for',
    dumb: 'A menu of the menus.',
    what: ['Every Help page, and what it covers. Type a page\'s name to open it.'],
    more: [] },
];

function GAME_LIST() { return GAME.flatMap(g => [`  HelpGame-${g.name}`, `      ${g.short}`]); }
/* the pages' text, built once */
const TEXT = {};
for (const p of PAGES) if (p.name !== 'Description') TEXT[p.name.toLowerCase()] = page(p);
for (const g of GAME) TEXT['game-' + g.name.toLowerCase()] = page({ ...g, title: g.title });
const DESC = PAGES.find(p => p.name === 'Description');
DESC.more = ['THE PAGES', ...PAGES.filter(p => p !== DESC).flatMap(p => [`  Help${p.name}`, `      ${p.desc}`]), ...GAME.flatMap(g => [`  HelpGame-${g.name}`, `      ${g.short}`])];
TEXT.description = page(DESC);
/* the old topic names */
const OLD = { pipes: 'operators', chaining: 'operators', variables: 'bash', files: 'file', basic: 'basics', commandline: 'commandline', 'command-line': 'commandline', dirs: 'directories', flags: 'options', groupsudo: 'sudo' };

/* Help<Page>, helpchat, help-chat, Help Game How: the page's text, or undefined */
export function helpPage(name) {
  let k = String(name || '').toLowerCase().replace(/^help[-_ ]?/, '').replace(/[_ ]+/g, '-');
  k = OLD[k] || k;
  if (TEXT[k]) return TEXT[k];
  const g = k.match(/^game-?(\w+)$/); if (g && TEXT['game-' + g[1]]) return TEXT['game-' + g[1]];
  return undefined;
}
/* every page's name, as it is typed */
export const HELP_NAMES = [...PAGES.map(p => 'Help' + p.name), ...GAME.map(g => 'HelpGame-' + g.name)];
export const isHelpName = w => /^help./i.test(w) && !!helpPage(w);

/* help alone: the pages by group, the colors, and tips */
export function helpIndex() {
  const out = ['help · what do you need help with?', '', 'DUMB VERSION', '  Type one of the green words below and press Enter. Capitals don\'t matter.'];
  let g = '';
  for (const p of PAGES) {
    if (p.group !== g) { g = p.group; out.push('', g.toUpperCase()); }
    out.push(`  Help${p.name}`, `      ${p.short}`);
  }
  out.push('', 'COLORS', '  Each kind of command has its own color:',
    '  `help` `man` `HelpBasics`', '      help and manuals',
    '  `echo` `for` `alias` `clear`', '      bash itself',
    '  `ls` `cd` `cat` `chmod`', '      files and folders',
    '  `grep` `sort` `sed` `wc`', '      text tools',
    '  `sudo` `groups` `usermod`', '      groups and sudo',
    '  `who` `w` `ps` `ping`', '      people and the room',
    '  `send` `forgame` `skip` `map`', '      the game',
    '  `lightning` `ducksay` `roll`', '      silly commands and toys',
    '  `\\mute` `\\show`', '      the chat\'s commands',
    '  `-n` `|` `>` `$USER` `"words"`', '      flags, operators, variables and quotes',
    '', 'TIPS',
    '  help chat opens HelpChat too. help game how opens HelpGame-How.',
    '  `man` and a command tells all about it; so does --help after it.',
    '  `help all` lists every command. `HelpDescription` says what each page is for.');
  return out.join('\n');
}

/* ---------- colors: a line of the command line, as HTML ---------- */
export const kindOf = w => {
  if (!w) return '';
  if (isHelpName(w)) return 'help';
  return KIND[w] || KIND[w.toLowerCase()] || '';
};
const span = (k, t) => `<span class="k-${k}">${esc(t)}</span>`;
const TOK = /(\s+)|('[^']*'?|"(?:\\.|[^"\\])*"?)|(<[a-z][\w|-]*>)|(\$\(\(|\$\(|\)\)|&&|\|\||2>&1|2>>|2>|&>|>>|<<<|[|;&<>()])|(\$\{[^}]*\}?|\$[\w?#@*!$]+)|(\\?@[\p{L}\p{N}_-]+)|(#.*)|([^\s'"|;&<>()$]+|\$)/uy;
/* a command, colored: each command word by its kind, then flags, operators, variables, quotes and @names */
export function paintCode(src) {
  let out = '', cmd = true, after = '';   // cmd: the next word is a command; after: the command before (send waits for its @names)
  TOK.lastIndex = 0;
  let m;
  while (TOK.lastIndex < src.length && (m = TOK.exec(src))) {
    const [all, ws, q, ph, op, v, at, note, word] = m;
    if (ws) out += esc(ws);
    else if (q) { out += span('str', q); cmd = false; }
    else if (op) {
      out += span('op', op);
      if (/^(\||\|\||&&|;|&|\(|\$\(|\$\(\()$/.test(op)) { cmd = true; after = ''; }
      else if (/[<>]/.test(op)) cmd = false;
    } else if (v) { out += span('var', v); cmd = false; }
    else if (ph) out += span('ph', ph);
    else if (at) { out += span('at', at); if (after === 'send') cmd = true; }
    else if (note) out += span('note', note);
    else if (word) {
      const k = kindOf(word);
      if (word === 'in' && after === 'for') { out += span('bash', word); after = ''; continue; }
      if (k === 'chat') { out += span('chat', word); cmd = false; continue; }
      if (cmd && /^[A-Za-z_]\w*=/.test(word)) { const i = word.indexOf('='); out += span('var', word.slice(0, i)) + span('op', '=') + esc(word.slice(i + 1)); continue; }
      if (cmd && (k || KEYWORDS.has(word))) {
        out += span(k || 'bash', word);
        cmd = KEYWORDS.has(word) ? !['for', 'in'].includes(word) : ['sudo', 'time'].includes(word);
        after = word;
        continue;
      }
      if (cmd && word.startsWith('!')) { out += span('op', word); cmd = false; continue; }
      if (/^-/.test(word)) out += span('flag', word);
      else if (['man', 'type', 'which', 'help'].includes(after) && k) out += span(k, word);
      else out += esc(word);
      if (after === 'send') { cmd = false; after = ''; }
      else cmd = false;
    } else { out += esc(all); }
    if (all === '') break;
  }
  if (TOK.lastIndex < src.length) out += esc(src.slice(TOK.lastIndex));
  return out;
}
/* what is typed in the chat: \commands and @names */
const paintChat = t => esc(t).replace(/^(\\(?:mute|permmute|show|togglesuggest|help|clear))\b/i, '<span class="k-chat">$1</span>').replace(/(\\?@[\p{L}\p{N}_-]+)/gu, '<span class="k-at">$1</span>');
/* words in sentences: `code` and the Help pages */
const paintProse = t => t.split(/(`[^`]+`)/).map(part => part.length > 2 && part.startsWith('`') && part.endsWith('`') ? paintCode(part.slice(1, -1))
  : esc(part).replace(/\bHelp[A-Za-z]+(?:-[A-Za-z]+)?\b/g, w => isHelpName(w) ? `<span class="k-help">${w}</span>` : w)).join('');
export function paint(line) {
  if (line === '') return ' ';
  const n = line.match(/^ */)[0].length;   // indented: a hanging indent, so a wrapped line stays under its start
  if (n && n < line.length) return `<span class="ind" style="--i:${Math.min(n, 12)}">${paint1(line.slice(n))}</span>`;
  return paint1(line);
}
function paint1(line) {
  let m;
  if ((m = line.match(/^(\s*)\$ (.*)$/))) return `${m[1]}<span class="k-prompt">$</span> ${paintCode(m[2])}`;
  if ((m = line.match(/^(\s*)chat> (.*)$/))) return `${m[1]}<span class="k-prompt">chat&gt;</span> ${paintChat(m[2])}`;
  if (/^[A-Z][A-Z' ]{2,}$/.test(line)) return `<b class="k-head">${esc(line)}</b>`;
  if ((m = line.match(/^(Help[\w-]*|help) · (.*)$/))) return `<b class="k-title">${paintProse(m[1])} · ${esc(m[2])}</b>`;
  if (line.startsWith('✗')) return `<span class="k-err">${paintProse(line)}</span>`;
  return paintProse(line);
}
