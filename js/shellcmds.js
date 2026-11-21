/* the shell's command table: each command's entry is (args, stdin, x) → its output. The entries are in the files that
   hold them by what they do (shell.js: help, man and the rest; shellcmdfiles.js: files and folders; shellcmdpeople.js:
   people and groups; shellcmdroom.js: the room, the game and the test commands), and every file adds its own to this one object. */
export const CMDS = {};
