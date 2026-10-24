# DuckFriends: the plan for Request 5

Your request is saved word for word in `notes/agree-or-disagree.md`. This file is the plan: what gets built in what
order, the small choices I'll make unless you say otherwise, and my suggestions. The few real decisions are in the
questions I'm asking you in the chat.

## Your answers (2026-10-24)
- **Next after the quick fixes:** Players and rooms.
- **Words:** a *Stage* is one thing: the lobby, writing, voting, discussing or stats. A *Turn* is what happens between
  presses of End turn. A vote doesn't end a turn, so voting and discussing one prompt make up one turn. A *Round* is
  the whole collection of stages and turns.
- **Joining a game in progress:** anyone can join. They appear at once, walk and chat, and play from the next round's
  writing stage.
- **Kick:** the player is out until the room goes back to the lobby.
- **All-time stats:** kept on the device and in the Google account. Fakeable, and that's fine.
- **Bracket sizes:** any count works, with byes.
- **Specials** (replaces "Effects"): a *Specials* row in Customize. You can pick only one.
  - Selecting a special previews it on the duck.
  - Hovering, or holding a finger on it, shows a small see-through box explaining it.
  - Moment specials play when you're the Round Lord, when you win (in brackets, the winner is put on the cloud), and
    on the podium:
    - electricity, flames, floating hearts, a poison cloud, music notes;
    - confetti raining over the screen (kept light so the game doesn't lag);
    - a red X that follows your duck when you lose in brackets.
  - Always on: longer airtime on jumps.
  - Press E:
    - drink coffee from a mug;
    - a water gun that sprays;
    - eat a hotdog, with Minecraft-style eating;
    - a confetti gun;
    - a handgun with a slow bullet. A duck it hits plays dead until it moves.
    - your recorded sound: press E and everyone hears it.

## The batches

**A. Quick fixes and polish.** I'm starting on these now; none of them need an answer.
- Body: Skinny, Slim, Normal, Fat, Chubby (Chubby is the fattest).
- Hat and Face patterns are always folded shut when you open Customize.
- A truly alien eye: big, black, slanted, glossy. A new hat, **Antenna eyes**: two eyes on stalks.
- Motorcycle helmet redrawn from the side, like the LS2 picture: the visor only half seen, the chin bar forward, and
  the beak free.
- Armored helmet redrawn like the Halo helmet, sitting on the head the same way.
- Ski mask: no line across the beak.
- Round window buttons (the red ✖ and the others) shaded like little balls, with the ✖ unchanged.
- Question example: "Data breaching is a serious problem, and IDIOTS don't understand what I am saying!"
- Question order is random by default.
- Chat always opens scrolled to the newest message.
- Card patterns: basketball, baseball, football, golf ball, soccer ball (in their own fold, like the hats).
- More fonts (about 8 more; see the list at the end).
- Prompts and the line under the cloud use the writer's font. Hovering the duck on the cloud shows "Round Lord" in
  their font.
- Writing stage: whatever you've typed is sent when time runs out. Submit and "No question" just end your turn early.
- The top timer gets a meter that fills as time runs out, its color slowly drifting.
- Free roam: a see-through bubble over each duck, in the color of its vote.
- On the front page, below Settings: a **My Other Website** button with the subtitle "Nous Within Kenoma". On the Nous
  Within Kenoma site, under Games: a **Duck Friends** card, "A party game for friends".

**B. Players and rooms**
- **Player menu**: hold Tab mid-game. On a phone there's a small button next to pause; it stays open until you tap ✖.
  It shows each player's duck, card, name and connection (milliseconds and 1 to 4 bars).
- Zs float from a duck whose player hasn't touched a key, the mouse or the screen in 2 minutes.
- Click a name: View stats, Add friend (if they're signed in), Vote to kick.
- **Vote to kick**: you're asked "Are you sure?", then everyone sees a popup and everyone else has to vote yes. You
  can start one kick vote every two rounds.
- **Vote to return to lobby**:
  - It's on every round's stat screen and on the whole-game stat screen.
  - You can also start one from the player menu, once per turn.
  - On round 2's stat screen, hovering the button shows a small note that the vote is also on the whole-game screen.
  - Rounds keep coming until a return vote passes.
- **Rooms**: games in progress are listed with "Game in progress", and you can join or rejoin them. A "Hide private
  rooms" checkbox hides the private ones.
- **All-time stats**: kept per game mode, with a picker to choose the mode. Test rooms don't count, except jumps.

**C. Chat**
- Chat bubbles over the duck that sent the message. They're see-through and fade away.
- `\togglesuggest` turns suggestions off in text chat (the command line keeps its own). Each new game, a note at the
  top of the chat says how to turn them back on.
- Messages over 250 characters fold under an arrow, with a ! next to it if you're pinged. They fold again every time
  the chat reopens.
- A ping glows behind its text.
- Silly commands say in small text who used them. New silly command: `fire @name`. The duck burns, then stays charred
  for about 5 seconds.
- Mutes:
  - `\mute bubble ping text on @p2 @p3` and `\mute all off @p2`. Mutes last until the room goes back to the lobby.
  - `\permmute` asks "Are you sure?"; `-f` skips the question.
  - `\show mute`, `\show permmute`, `\show players`.

**D. Specials**: the list above.

**E. New game modes**: Would You Rather first (it's close to Agree or Disagree), then Bicker Brackets.

**F. The Ether's Crossroads map**
- The dungeon picture with the jester painting.
- The torch and candle flames flicker and glow, with the game's static and scan lines over everything.

**G. Duck styles and outfits**: batches 4 and 5. The armor matches the Halo picture.

**H. The command line**, built in three steps:
1. The basics:
   - `echo`, `ls`, `cd`, `pwd`, `cat`, `touch`, `rm`, `man`, `history`, `clear`.
   - Pipes `|` and writing to files with `>` and `>>`.
   - `grep`, `head`, `tail`, `wc`, `sort`.
   - `roundstats`, `gamestats`, `totalstats` (with @names), `ping` (with @names) and `send`.
2. Users and groups:
   - `sudo`, `usermod -aG`, `groupadd`, `groups`, and `members <group>` to list a group's users.
   - The `sudo` group (the host is always in it and can't leave) and the `dumbasses` group.
   - Custom groups with chosen permissions, and `forgame`.
3. Files:
   - `/usr/<player>/` holds your notes and a log of everything you ran this game.
   - `perma-notes`: only you can open it, it's kept on your device, and it can't be deleted.
   - `/bin` holds the commands, and nobody can read it, not even the host.

## Small choices I'll make unless you say otherwise

**Votes**
- A return-to-lobby or kick vote needs the same share as "how many players must end their turn" (the host's setting).
  A kick needs everyone except the player being kicked.
- When a return-to-lobby vote passes, the room goes straight to the lobby. The old end-of-game screen is replaced by
  the whole-game stat screen.

**Bicker Brackets**
- Topics are up to 24 characters. You can vote for your own topic, and a tie is picked at random.
- Seeds are up to 32 characters, so the card stays tidy.
- The podium shows 1st (the champion seed's writer), 2nd (the runner-up) and 3rd (both semifinal losers).

**Chat**
- Whispers (`\@name`) don't show as bubbles to everyone, only to the people they're for.
- Permanent mutes are kept on your device: by Google account if the muted player is signed in, by name if not.

**Connection, away, fire**
- Connection is measured every 5 seconds against the game server.
- Away means 2 minutes with no key, click or touch. The Zs stop the moment the player does anything.
- `fire` is a silly command. The host's silly-commands switch and the dumbasses group apply to it.

**The Ether's Crossroads map**
- The game's interface switches to the Ether & Kenoma look from your other game, set in Cascadia Code Extra Light.
  This covers panels, buttons, timer, chat and the cloud's box.
- Player names and prompts keep each player's own font.

**The `forgame` commands**
- `sudo forgame all-timer off`: every clock stops for the rest of the game (writing, answering and catch-up).
- `sudo forgame timer off catch-up` turns off one clock: `writing`, `answer` or `catch-up`.
  `sudo forgame timer on answer 60` turns one on with a time.
- `sudo forgame turn-end everyone` sets how many players must end their turn: `half`, `two-thirds`,
  `three-quarters` or `everyone`.
- More of the same kind: `order random|rotate`, `gravity low|normal`, `freeroam on|off`, `silly on|off`, and
  `forgame show` to list the current settings.
- The changes take effect at once and stay when the room goes back to the lobby, just as if the host had changed them
  there.
- Muting someone for part of a game:
  - `forgame rounds8 \mute on bubble ping @p2` lasts 8 turns.
  - `forgame stage voting writing \mute on ping @p2` applies only in those stages.
  - `forgame stage2 voting ...` applies for the next 2 voting stages.

## My suggestions

**More game modes**
1. **Most Likely To**: "Who is most likely to …?" The board's tiles are the players themselves; walk to someone.
   Stats: who got picked most for what.
2. **Who Wrote It?** Prompts show with no name. Walk to the duck you think wrote it. You score for guessing right,
   and the writer scores for fooling people.
3. **Tier It**: the Round Lord names a thing, and everyone stands on an S, A, B, C, D or F tile.
4. **Two Truths and a Lie**: a player writes three statements; stand on the lie.
5. **Over/Under**: a question with a number answer ("How many hours did I sleep?"). Stand on a number line, and
   closest wins.
6. **Fill in the Blank**: a prompt with a blank. Everyone writes an answer, then walks to the funniest.

**Bracket types and options**
- Double elimination: a loss drops a seed into a losers' bracket for a second chance.
- Blind bracket: the writers stay hidden until a seed is knocked out or wins.
- Speed bracket: 10-second votes.
- Topic source: voted (as you described), random from a built-in list, or the host types it.
- Ready-made topics: Best snack · Worst habit · Greatest movie villain · Most overrated thing · Best superpower ·
  Worst chore · Best pizza topping · Most annoying sound.
- A word note: in real tournaments each entry is an *entrant*, and its *seed* is its ranking number (seed 1 is the
  favorite). Players will understand "Seeds" fine, but "Contenders" is the exact word. Your call.

**More stats** (any mode)
- Contrarian: most often in the minority.
- Bandwagoner: most often with the majority.
- Fence-sitter: switched tiles the most before locking in.
- Quick draw: locked in fastest on average.
- Last second: locked in latest.
- Closest vote: the prompt that split the room most evenly.
- Landslide: the most one-sided prompt.
- Bicker Brackets only:
  - Kingmaker: the vote that decided the most one-vote matches.
  - Underdog: the seed that won after trailing.
  - Fan of themselves: voted for their own seeds most (as you said).

**More commands**: `whoami`, `id`, `date`, `uptime` (how long this game has run), `roll 2d6`, `flip`,
`poll "question" yes no` (a quick poll in chat), `alias`, and `emote dance|wave|spin` (your duck does it).

**More game settings**: anonymous prompts (names shown only at the stat screen), spectators, points and a
leaderboard, a soft swear filter, prompts per player per round, a discussion timer, and switches for kick votes and
return-to-lobby votes.

**New fonts I'd add**: Bangers, Press Start 2P, Pacifico, Permanent Marker, Creepster, Orbitron, Special Elite and
Cascadia Code (the Ether's Crossroads one).
