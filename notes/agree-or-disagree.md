# Justin Man Games · Agree or Disagree

The spec as written down on 2026-10-23, from the request below (kept word for word at the end). Where the request said
one thing and the picture another, the picture wins for the board's colors, as asked.

## The site

- A site for party games, of which Agree or Disagree is the first. Every game has its own art (a "map preview" picture)
  with the game's symbol in the art's top left.
- Front page: **Play** and **Settings** on the left with almost no explanation; under them one short line, something like
  "A party game for friends on a voice call". A rubber duck picture on the right. Top right: **Sign in** (a profile keeps
  settings and stats; without it, a guest profile keeps them in cookies on the device).
- Play shows **Create a room** and, below it, **the rooms online** (open and private ones both listed; a private one asks
  for its passkey).
- The look: a ball pit in an indoor playground first (the cover especially), then a playground and a water park, a little
  carnival. A Twister-like page background: simple colored shapes (circles, triangles, squares and other simple shapes)
  with white space between them. White UI by default; a dark mode setting. Funny, party, almost no explanations. It fills
  the screen on computers.

## The game's symbol and art

- Symbol: three filled rectangle columns side by side with gaps, slightly see-through: left **red**, middle **yellow**,
  right **green** (the board's disagree, neutral and agree).
- Art: a rubber duck on a cloud, "Agree or Disagree" across it in the multicolored letters (below), the symbol in the
  top left.

## The board (the picture's colors, left to right)

Seven equal, symmetrical columns, each with its name written inside it:

| # | Answer             | Color        | Hex (from the picture) |
|---|--------------------|--------------|------------------------|
| 1 | Strongly disagree  | dark red     | `#880015` |
| 2 | Disagree           | red          | `#ED1C24` |
| 3 | Slightly disagree  | orange       | `#FF7F27` |
| 4 | Neutral            | yellow       | `#FFF200` |
| 5 | Slightly agree     | light green  | `#75F94D` |
| 6 | Agree              | green        | `#37D421` |
| 7 | Strongly agree     | blue         | `#00A2E8` |

- Computer: left to right as above. Phone held upright: the same columns as rows, agree at the top (strongly agree first)
  and disagree at the bottom.
- The colors are the board's background; the players' avatars stand in the column of their answer.

## Avatars

- A toy rubber duck, a little 3D, with a small shadow under it. The duck's color, a pattern, or a metal (gold, silver…)
  that shines. Or a square picture the player uploads.
- Names under the avatars, somewhat see-through.

## Players, names, customization

- Usernames: "Player 1" and so on by default; letters, numbers, dashes and underscores only; no censor. The last name
  used is kept in a cookie for every game joined or made.
- How a name shows to others: its color and its font, including the multicolored letters (each letter a different color,
  like fridge magnet letters), on any font; the childlike font can be chosen without the colors too.
- Every color choice has a paintbrush, **Invent a color**: a hex box with a circled "i" (hover or click) explaining hex.
- Player card: bigger than Halo's, the duck on its left; its background a color, a fun pattern, or an uploaded picture
  that fits the card. Right-click a player card for its options (customization, including the name, and View stats).

## Rooms and the lobby

- Open or private (passkey). Up to 8 players by default. Joining a room puts you in it at once (the lobby covers the whole
  page; an X at its top right leaves).
- Lobby laid out like Halo: Reach's custom game lobby (notes/ref/lobby-idea-halo-reach.webp):
  - the game's art at the top left;
  - the title, then Game type (locked to "Agree or Disagree" for now), Map (one choice for now), Game options (the host
    edits them), Start game;
  - the party on the right: the players in rows, names on the right of each row; click your own row to rename;
  - the buttons at the bottom left: Space ready, T text chat, right-click player card options, left click select.
- Start game counts down with a sound like Halo: Reach's lobby countdown.
- Create a room has a small **TEST** checkbox: the host sets how many computers join; they act after 30 seconds; others
  can join a test room too; a test room never touches anyone's stats.

## A round

The rounds go on until the players vote to end the game or leave.

1. **Submit questions.** Everyone writes one question (or chooses **Don't submit one**, with an "Are you sure? Yes / No").
   **Add a prompt from Notes** puts one of your notes in the box, to edit before sending. The phase ends on a time limit
   or when enough players are ready (below).
2. **Answer, one question at a time.** The questions come in a fixed rotating order or at random, one player's question
   each (the host's choice in the lobby). The player whose question it is is the **Round Lord**: their avatar shows in a
   cloud above the middle of the screen with "Round Lord" under it in the multicolored letters; they set the answer time.
   - Players answer by moving their avatar onto a column: WASD or the arrow keys, or the mouse if they turn that on, or
     (a setting) **Show multiple choice**, which jumps the avatar to the chosen column. Everyone's avatar shows on the
     board while answering.
   - Then they talk it over (voice chat outside the game), moving their avatars around.
   - The next question comes when enough players end their turn, or a timer runs out if one is set.
3. **Results.** Each player's stat box (avatar at its top left; the boxes scroll): what they chose most, the median, the
   average, and the clicks this game. During results players can move their avatars within their column (WASD, arrows).
   From the second round on, each player may vote once a round for an **all-rounds review**, shown after the round's own
   stats.

### Ending turns and timers

- A phase or turn ends when enough players have ended their turn: **3 out of 4** by default.
- Timer choices: 30, 60 or 90 seconds; off by default.
- The catch-up timer (submit questions and answering only): once enough players have ended their turn, a 15, 30 or 45
  second timer starts for the rest. Default: on, **15 seconds after 3 of 4**.

## Notes, chat, command line

- **Notes**, bottom left: question ideas, written any time.
- Text chat (T): its side is a setting (left, bottom, right or hidden, as the game allows). `@name` pings with a soft
  sound and a "!" on the chat's tab; `\@name` is a private message; `\help` lists these. Autocomplete with Tab (never
  leaving the page), arrow keys through the suggestions; names autocomplete; clicking the box suggests `\help`.
- **Command line** (Shift+T, or the symbol at the chat's bottom left): the chat button is "ABC" on a white circle; the
  command line is a retro green "$" on black. It looks like the chat. For now, customization only: `custom` lists
  `avatar`, `card`, `username`…, e.g. `custom username font "times new roman"`, `custom username "font color" red`.
  Commands are white; Tab adds the quotes around words with spaces.

## Clicks

- Every click anywhere counts; the counter sits at the bottom middle and grows across games (kept in cookies). Settings:
  scientific notation, and hide it.

## Leaving

- The pause menu at the top right, with Leave game. The browser's back (and the phone's) and closing the tab ask "Leave the
  game in progress?".

## Accounts and friends

- Sign in (GitHub was the guess; see the questions) to keep settings and stats in a profile rather than the device's
  cookies. Friends: requests, the friends list, inviting a friend who is on the site (a notice at the bottom middle).
  Friends open from the pause menu or with Shift+\ (not while typing or in a game).

## Settings

- Tabs, the basic ones ordered like Ether's Crossroads'. Fonts: the old English font, Cascadia Code Extra Light, Courier
  New, Times New Roman, Comic Sans, Georgia (and the playground font). Dyslexic mode, colorblind mode, dark mode; clicks
  shown in scientific notation; the click counter hidden; mouse moves the avatar; show multiple choice. Music later.

## Decided (2026-10-23)

- Online: **Firebase** (live room list, real-time play, sign-in, friends). The owner makes a free Firebase project and
  sends its web settings.
- Symbol colors: red, yellow, green.
- Fonts: **Fredoka** is the default text font; **Lilita One** is the playground font for the multicolored letters
  (Round Lord, the title). The font list: Fredoka, Lilita One, the old English font (Grenze Gotisch, from Ether's
  Crossroads), Cascadia Code Extra Light, Courier New, Times New Roman, Comic Sans, Georgia.

## The plan

1. The site and the game without a server: the front page (Play, Settings, the duck, the shape background), Settings
   with tabs (fonts, dark mode, dyslexic mode, colorblind mode, clicks), the art and symbol, the duck avatar (colors,
   patterns, metals, an uploaded square picture), the Halo-style lobby, the board, the whole round (submit questions,
   Round Lord, answering by moving the duck, results and the all-rounds review), Notes, the chat and the customization
   command line, the click counter, leaving safely. Playable at once in a TEST room with computers.
2. Online with Firebase: the room list (open and private with passkeys), real-time rooms for 8, the host's options.
3. Profiles: sign in, settings and stats kept in the profile, friends (requests, invites, Shift+\).
4. Later: music, maps, more games.

## Later (not now)

- Music. Maps for this game. More games on the site (each with art and a symbol).

---

## The request, word for word (2026-10-23)

(two pictures with it: notes/ref/lobby-idea-halo-reach.webp and notes/ref/board-colors-rough.png)

Add a game called "Agree or Disagree", and in the game, there is a center of neutral, to the left, there is slightly disagree, then a disagree option, and then a strongly disagree. The neutral is blue. To the right of neutral is a slightly agree, agree, and disagree. The screen on computer is left to right and on vertical orientation on mobile the agree is at the top and the disagree is at the bottom. The game has avatars that we will figure out overtime. The colors are in the background and a player asks a question and the players answer a multiple choice of how much they agree or disagree into the multiple choice that is labeled inside the boxes by name (ie; agree, strongly disagree, neutral, etc.) The players have a certain amount of time the player asking the question decides since they run the round. Afterwards, the players can discuss with their avatars on different parts of the board. The players also have a UI element somewhere in the bottom left called "Notes", and there, they can write down question ideas while they aren't busy. When prompted to write a question when it is a player's turn, there is a "Add Prompt from Notes" (written roughly like that) that allows players to add one of their note entries into the box instead of typing out something they already have in their notes, and the box can be edited or revised before submitting for game. Their is a submit question round where all players write up a question either in a time limit or a round where all or most players have to hit ready before a timer starts counting down. When the submit questions round is over, then it will have the questions sent in a consistent revolving order or a random order of one player's question each, where the option is determined by the host in the game lobby.

This is going to be an online game btw. When in game, the pause menu is at the top right, which has a leave game option,

The rooms you join can be open rooms or private with passkeys required. The open rooms and private rooms both show up in the available rooms online below the create a room setting. The create a room setting will have it to where it shows the players that have joined to the host and show the players to each other who joined. The players sit in rows with their usernames on the right, which are "Player 1" by default, but clicking YOUR row will allow it to have the name changed. You can make it to where the name carries across games by use of cookies and will keep whatever name you last entered thru all games you join or create. The room has 8 players max by default. The avatars are a toy rubber duck OR a sqaure image the player can upload as their avatar. Players can select a color on their duck, a pattern, or even metals, such as gold or silver to make the duck shine. Players can use images they upload as their avatars instead. The players will have their avatar show up in the column they voted for, and when all players vote for the turn to end or a timer goes off if that is set, then the game continues on to the next question.

Players basically have turns with three phases. The first round is writing and then submitting questions for the round, the next turn is voting on one question and then discussing the answers, and that phase the players takes turns, the first turn being how one player gets their own round to where people answer their question UNLESS they didn't submit one, which is an option to click in the submit question phase (there is a are you sure button with a yes or no option to confirm if they want to not submit a question). The turn after that is returning to the next player's submitted question for others to answer with their opinion, and they discuss results that show the avatars on the boards to represent what option they chose in "Agree or Disagree" how they discuss it outside of the game in a voice chat like discord or elsewhere.

The next phase after all of that is done will show a result that shows how often players agree or disagree within a round with their avatars to the top left of their stat box that players can scroll through. The first stat shows the mode, (which shouldn't be call a mode but is called what the player chose the most), the next stat is the medium, the average, and the number of clicks per game. (The game keeps track of how often you ever clicked in a game and is stored in cookies, the click counter will be at the bottom middle of a screen and it grows across games. The settings can change the clicks to scientific notation even if they haven't even clicked yet, clicking refers to clicking the screen randomly, which makes the counter goes up. The counter can be hidden under the settings menu in the pause menu.)

In the game, clicking the back arrow on a phone screen on browser or clicking the back arrow on browser will ask a player if they are sure they want to leave the game in progress, and so would trying to close the browser. The timer is either 30 seconds, 60 seconds, or 90 seconds. The timer is off by default and the round or phase doesnt end UNLESS a certain amount of players have voted, and the game basically needs 3/4 players to end their turns in order to go on to the next phase or turn by default, and it can be set to enable 15, 30, or 45 second timer WHEN players haven't ended their turn, so that timer goes off when other players haven't ended their turn ONLY WHEN it it is the submit question or answer question part of the turn WILL the timer turn on AFTER a certain amount of turns are ended IF the timer condition itself being self-referred to is turned on. The default is a 15 second timer after 3 out of 4 players ended their turn WHEN there is submit question phase OR the part of the turn where you answer questions.

The settings have a font setting where fonts can be selected, the old English font for my game should be an option that you can select as well as Cascadia Code Extra Light, Courier New, Times New Roman, Comic Sans, and Georgia. You can suggest new fonts or suggest to remove old fonts, as well suggest the default font. There should be a setting for dyslexic mode. The game should feel like the mix of a ball pit, a playground, a water park, or a carnival maybe, but especially the first three. The cover of the game should FEEL like a ball pit in an indoor playground maybe. We will discuss music later.

The avatar of a player shows in a cloud above the center of the screen to indicate it is their round, and they are called the "Round Lord", and it will say it under them.

If there is a child like playground font that we can make multicolored then we can use that for the part that says round lord, and it can be like different colors for each letter that says round lord on the cloud, like those colored magnets you can put into words you find on some fridges IF you cant imagine what im talking about, like something i might imagine for a Toys R Us logo IF i am not mistaken, but dont run with that example.

The rounds go on indefinitely players vote to end game or leave game. A player can cast a vote suggestion once a round to preview a total stat review of the running game, that shows the stats already mentioned by players but not just for a round but all rounds combined, and it comes after the first set of stats for that round and can only be voted in during the second round and later rounds, and it is appended to its own part after that first show of stats on the one round. The part that shows players results will allow them to move their avatars around the column they are in on their screen by just using the WASD or arrow keys. The names are visible beneath the avatars and are somewhat transparent. Players can customize how their usernames appear to players in colors AND fonts, including the color font u see for the "Round Lord" word, where the letters are all different colors in a childlike way, and that setting can be used in the color even on different kinds of fonts, but the childish font (whatever that will be, maybe multiple) can be selected without the colors as well. There is an invent color option that is a paintbrush for any color customization that allows players to use hexadecimal values to create their own color, and the hexadecimal box where you select your custom color will have a circle "i" for info that the mouse can hover over or players can click to preview the info for how hexadecimal works.

Like i said, the answers will be shown by showing where players are on the column... HMMMM, maybe the players can move on the columns with their avatars when they answer instead of clicking agree or disagree or whatever. ALSO, the players can still use their mouse to move their avatars the same as WASD if their enable it in their settings, and they can enable another setting that says to display multiple choice instead, which just teleports their avatars to the column. While players are answering, you can see their avatars on the columns. The duck avatars should look a little 3d and ALSO have a small shadow cast on their duck. The UI is naturally white, but players can enable a dark mode setting. There is also a colorblind setting and dyslexic mode setting. There will be music eventually. The players in game have a player card that can be clicked for options, such as view stats, and it will show how they have answered. There is a create a room with a checkbox called TEST, and it will spawn computers in the game that act after 30 seconds, and the test room DOES NOT affect stats on a player card WHATSOEVER! The test room simulates other players, and other players can join a test room too, and the number of computers in a test game is determined by a host. The test mode is a small check box.

I sent a screenshot that will show a very rough UI idea of how i imagine the lobby to look. When players join a lobby, they are already in the game. The host can edit options for the game in the game options before the game. The game type is locked into "Agree or Disagree", since i will add new games later. I might add maps for this game mode, but we will see, so you do not need to add that option. There is a game option menu like i said, it is called game options. The start game button creates a countdown with a sound similiar to the start game countdown in halo reach lobbies. The map preview at the top left isn't a thing yet, but you can make a picture of a duck on a cloud for art and have it say "Agree or Disagree" in the art in the multicolored letter font we talked about. The top left symbol for the game is just three colored filled rectangle columns (the left one is red, the middle is blue, and the right one is green) that sit with gaps next to each other in the top left of the art, and they are slightly transparent. Every game I add to this site will have it's own art and WILL also have a symbol in the top left of the art. The map can actually have a section with only one selection for now. The buttons are shown on the bottom left for players actually, which shows Spacebar for ready, T for text chat, right click for player card options, and left click to select. In this menu, there is an X at the top right of the lobby when you join. When you join a lobby, it covers the whole page. There is no game mode selection and the game just has a play or settings menu on the front page with almost no explanation, and you click play and can then see the create a room or join room options. The front page has a short brief explanation below the options on the left hand side, like below the play game and options, and it says "For friends in voice call or other communication" or it can say something better worded then that. There is a picture of a rubber Duck on the right side of the screen before you hit play. The theme of the game should remind of twister a little bit, like with multiple-colored dots, but maybe circles, triangles, squares, and every other simple shape in the page background with white clear space between it. The game has a funny look obviously and is a party game with brief or no explanations hardly anywhere because it is simple social time. The game should fill the screen on computers. The game lobby should be it's own while being in the perfect format of the screenshot of Halo Reaches UI, but the player cards can be bigger AND show the ducks on the left of the player card. The player card can be customized to be different colors with different fun patterns too OR can be an image the player selects that has to fit within the player card dimensions. Customization "Including player name now" is found with right clicking a player card which shows the options that way.

When can also allow the front page have an option in the top right to sign in to profile to save settings and stats to profile INSTEAD of just the guest profile which saves to cookies. I assume that will just sign a player into their github, which they can choose to create an account to their github probably. If the players have an account, there should be a friend request feature, where a player can add a friend by their friend list OR invite a friend IF they are on the game, which shows up as a notification at the bottom middle of a screen. The friends menu is accessible in the pause menu or by using the Shift+\ button IF IF IF they arent already typing in a box or in a game. In the text chat, there are private messages if a player uses the negative sign before the @ as such "\@" (the quotes dont count here), if they use the @ without the backslash then it just does a soft notification noise with an exclamation to the chat slide on the left of the screen (options can change if it is on left, bottom, right, or hidden on the screen IF the game they are in allows it, based on new game modes that might be out later), which will be told if the player types \help
If a player wants to, they can use the shift + t button to change to command line or click the bottom left of the text chat while it is open on a symbol. Text chat will simply be the ABC with a white circle behind it as a button, and the command line would be a green dollar sign in the classic green retro color and font with a black behind it to indicate command line mode, and the command line looks the same same as chat. Clicking the box will auto show the \help option which can be enter with tab or typed, and also ignored, since it is an autocomplete suggestion. The autocomplete is done with tab without it tab thru the browser ui, and the tab button will autocomplete while the arrow keys can scroll thru suggestions in the chat. The \@ button is used for private messages between one player. Autocompleting a player's name is a thing. (the player cannot have special characters in their name, only letters and numbers, but the dash is allowed, underscores are, and so is anything in the likeness of those) There is no censor on the names players can create.

The command line has a customize command, where when you type "custom", other commands appear, such as "avatar", "card", "username" and so on. Options that appear as we add them to the game get commands. So like, 'custom username font "times new roman"' or 'custom username "font color" red'. In the command line, commands have white characters, which means parts of a command needs to be quotes if there is a space, and the autocomplete will put the quotes for you

The command line should be simple and only have commands for customization for now.

The UI should be based on my UI/UX principles AND things I outlined here. Furthermore, consider things like dead space, alignment, font size, bold, underline, box size, and more. Similiar BASIC settings from ether's roads should be found in these settings and ordered similarly, like how settings have multiple tabs. There are other UI/UX princples i didnt mention because i have not much time to even scrap the ice on that here, you must know what i told you before thru thing u have written down or received. Ask me questions if need be with the multiple-choice boxes you do.

In the second screenshot, that shows the map the players walk on, and they get their avatar lock into one of the colors based on their answers. BUT it is the most crude example possible, BECUZ it is rly the roughest estimate ever, like each part should be symmetrical AND a column, and NOT what you see in the picture, or more so shows the roughest idea of the colors from left to right in that second screenshot. Now BEFFORE the colors may have been been described dif in this text, but it is hard for me to go back and change that. When you take note for this sight based on this prompt before making a plan, you can rewrite how i described the colors of the map based on the image i sent in the seond screenshot.

---

## Request 2, word for word (2026-10-24)

(three pictures with it: a cheese wedge for the cheese hat, Minecraft floating sky islands, a Minecraft forest seen from above)

REAL QUICK BEOFRE ALL OF THIS! Can my friends play as guests when using firebase AND can my nigerian gf play with me using firebase? 

It should be called DuckFriends

The board should take up most of the screen by far, like a lot more. 
Movement on the screen should be a little faster vertically (a little) and a little slower horizontally. Holding shift makes the duckies sprint. 
The patterns on the ducks should be a little bigger, so they are easier to be seen. 
The ducks don't have a full head. The image of the ducks should contract a little against the wall they walk into. The metals when selected should blank out the colors selected, and furthermore, the metals need to look more metal. 
The ball pit on the menu screen should be covering the bottom of the index page. 
The last click at zero before the game starts from the lobby in the countdown needs a high pitch last sound JUST LIKE Halo Reach has iconically. It needs to sound as much like it as possible. The patterns on the ducks need to be more visible.

There should be hate for the ducks in customization, such as a wizard hat (can be colored), a pumpkin on the head (color cant be changed), a hotdog in a bun (color cant be changed but ketchup can be added to it), an afro (the hair color can be changed), an air jordan 1 can be worn on the head (the primary and secondary color of the shoe can be customized), there can be a cheese on the head that takes inspiration after the screenshot (cannot be recolored), there can be a traditional hat for nigeran men that can have colors changed and the hat has the name of the hat it is called in nigeria, a traditional hat for Nigerian women that can be changed (named after the hat and colors can be changed), there is a sombrero hat that cannot be changed in color, a dunce hat that cannot be changed in color, a crown that can have any metal option added to it, a cardboard robot head that goes over the duck that cannot be changed, a rubber duck on the head which can be customized simply without too much detail, and a simple floating eye symbol that floats over the duck that is transparent and cannot have colors added to it. The hats are in a sliding bar to fit all the hats, but a dropdown arrow exists beside them that can be expanded or collpased.

AFTER all the ducks voted, they can ONLY sit in their box color they voted in, which is why the map needs to fill more and more of the screen.

UI ELEMENTS CANT OVERLAP, like they do when you click the notes button OR when you are in the lobby and the buttons and such overlap with things. The button controls on the bottom left should be smaller. 

Ducks also contract somewhat in their image when they walk into other ducks. Clicking space bar makes the duck jump in a way, and it is a slow and high jump that shows a circle on the ground as their shadow to indicate the jump. There is a low gravity setting for this jump. The cloud and prompt can be over the playing board and ducks can walk underneath the, which will make their UI somewhat enough transparent to tall players to see the duck. 

The stat screen at the end of rounds should stay up unless they are voted off. 

When you click the screen, the click in any reference to it should be called "Jumps" that count your jumps in game instead. This includes settings or stats or anything that mentions them.

There is also a grey mouse hate that has a small mouse on the head of a duck. 

You need to give the ducks a full head on the front page AND every other POSSIBLE instance.

Maybe make the ducks look less 2d and more third dimensional too, by a little bit. Hats can be selected as a pattern in a title card now if they player wants; it will be added onto the patterns and work like the patters. 

Jumps are only counted per jump completed, so if they click spacebar, then the jump will not count on the counter TILL they land on the ground to jump again, since it counts completed jumps, not spacebar taps. The ducks can have a little speedy look effect on them when they sprint. 

A new hat is a ribbon bow thingy which goes on the ducks that can have multiple colors. There is a baseball cap hat with color options. 

the autocomplete SHOULD show thhe @ symbol in chat as well. There is an @everyone command as well. There is a \muteping@ command to, which mutes pings, and also a \mute@ to hide messages from a player AND a \unmute@ and \unmuteping@
The help button and @ are the only ones that show in the autocomplete before you type, and typing will also show these command in the suggestion box if they share characters, so like typing \ should show a few chat commands

The new map make the background clouds everywhere while also have the map itself be a little transparent with a sun in the background, and whenever the sun sets the moon descends from the top of the screen and falls down and sets too, creating a cycle where the sun lasts for one minute and the moon for another, and one cloud in the background will have one random player's avatar. The map will have the tiles glow a little in the night when it gets dark for this new map version. The third map is a pixel map that looks a little like minecraft, where the colored columnas have the appearance of many minecraft whool blocks that build the column together, and they are transparent and show floating islands made out of blocks like u would see in Minecraft (stone blocks at the bottom, then thin two block layers of dirt blocks above that and then grass blocks at the top and maybe trees sometimes, and the second screenshot is a good example. The islands should be of differing distances, and the ground is seen from above near the bottom of the page and the horizon line with a pixel sunset that stays but breathes a little. The third screenshot shows what the ground should look like but a little more from above view please since the camera is quite low for what i imagine in that third screenshot, but it was the best i could find. 

Put better effort into the page background for this game because it is not good enough. 

There is also a setting where there is not answering section and ducks can move around freely on the board until the turn ends, this isnt default. 

The text chat should show an ABC when you are in the chat mode and then the green dollar sign when you are in command mode. Changing customization while in the pause menu or command line should be able to change appearance mid game. There should be a command to strike a player with lightning that plays a sound effect not too loud please. Lightning @player2 for example. There should also be a command for love, where you basically do Love @player1 @player2 and that will make the two players have their ducks show up in a heart that float up to the top of the screen before fading away (it shouldn't glitch with an avatar that is an image). There should be a command to die, where it basically makes the duck have X over their eyes while the image is rotated and the duck looks dead, and the effect stops when they move kill @player4 for example, and it doesnt work on players with image avatars the same way, for them it just places a big X over their image until they move. There is a hotdog command that summons a hotdog on a player that hangs around them a little while before fading away, and you basically do hotdog @player5 

Those kind of goofy commands like lightning of summoning hotdogs can be turned off by host under additional settings, which will try and hide a lot of the settings that make it harder for a host who wants something straight forward.

(and, while that was being built:) dark mode should be the default color btw not light mode, because i discovered i like it better for my eyeballs at night

### Decided from request 2
- The site is called **DuckFriends**. Dark mode is the default.
- Guests play through Firebase's anonymous sign-in. (The database ended up in us-central1; fine for the US and Nigeria.)
- Space now jumps on the board (it still readies up in the lobby); Enter ends a turn.
- Clicks became Jumps: only completed jumps (on landing) count.
- The Nigerian hats: **Fila** (men's cap) and **Gele** (women's head tie).

## Request 3 (2026-10-24): phone controls, countdown tone, Firebase
- Phone controls: a floating see-through joystick by default (hold and drag; tap jumps; two flicks the same way sprint,
  kept while the stick is held out). Settings → Controls → Touch screen → Tap to move: tap walks there (faint white
  circle), double tap jumps on the way, fast swipe sprints.
- The lobby countdown's last tone plays at zero.
- The site moved to https://boohbahlord.github.io/DuckFriends/ when the repository was renamed DuckFriends.

## Online play (how it works)
- Firebase project duckfriends-bd795; config in js/online.js; rules in database.rules.json (pasted into Realtime
  Database → Rules by the owner). Guests sign in anonymously, one guest per browser tab.
- The host's browser runs the rules; players send actions (games/{g}/acts) and duck steps (games/{g}/mv) and read the
  state (games/{g}/s). A host gone (or asleep) for ~6–16 s is replaced by the next player; a player away 30 s leaves.
- Private rooms: the game's path is a hash of the room id and passkey, so only passkey holders can find it.
- Tests: `?emu=127.0.0.1` points the site at local Firebase emulators.

## Accounts and friends (built 2026-10-24)
- Sign in with Google (top right). The profile (name, duck, card, settings, notes, jumps, stats) lives in the account:
  a device new to the account takes the account's copy; afterwards the newer copy wins. No email or Google name/picture
  is stored. Rooms keep their own per-tab guest sign-in; the account is a second Firebase connection (account.js).
- Friends (top right once signed in, lobby menu in online rooms, pause menu, Shift+\): friend code (e.g. QUACK-4821),
  add by code, Add friend on a player's card (right-click or long-press), requests, list with online status and room,
  Invite to my online room, Join theirs (a private room asks for its passkey unless invited). Invites and requests
  arrive as notices at the bottom middle.

## Request 4, word for word (2026-10-24)
(Five pictures came with it: a gele (a large burgundy, pleated, shimmering head tie fanning out around the head), Halo:
Reach's Armory menu (options on the left in a window, the Spartan preview on the right), its Colors screen (Armor
Primary / Secondary / Emblem rows beside a grid of swatches), its Helmet screen (picture tiles of variants), and a white
call duck.)

* A new hat is a birthday hat
* New hat: A word that says Hat in enlightenment era cursive
* New hat: A white glove worn like a hat (like a cartoon white glove)
* New hat: Devil Horns (it is an off bone white that cannot be changed in color
* New hat: Halo (Like an angel's halo that shine, cannot be replaced.
* New hat can be the little antenna that sticks up out of a duck's head.
* Police officer's cap
* Firefighter hat
* Doctor's headwear
* A pajama cap that points up and hangs down over the eyes
* The bucket hat (like Hunter S Thompson might wear)
* Hat to complete a wedding gown
* Hat for catholic pope 
* Hat for catholic bishop
* Military helmet (like what a US soldier would wear, to go with the military outfit that should look like WW2)

The afro needs to look more like an afro


Face (they have their own section in the customization menu

* Motorcycle helmet (like something kinda like for sport bikes)
* Glasses
* Round circle lens glasses
* Aviator sunglasses (like what hunter s thompson wore )
* Sunglasses
* Blindfold
* Bag over head
* Ski mask
* Pumpkin on the head (as opposed to the hat which puts it on the head)
* Halo reach helmet (The helmet goes on the head of the duck and isn't called halo or halo reach but is just sci fi, like the halo reach body armor outfit that matches it)
* Gas mask
* Clown nose (like the little ball made to cover some part of the beak like a clown nose)
* A blindfold for sleeping that can go with pajamas

You can suggest other face items as an idea, these have their own menu apart from hats and both face items and hate can be worn together.

The carboard box helmet needs to go to a face section along with ANYthing that covers the face substantially in the future.


I sent a screenshot of what the gele should look like since it needs changed. 
The metallic skins don't look metallic enough.
The options in the customization menu should be smaller, AND on computer, when you see the customization menu, you see the options on the left in a window and a preview of your duck on the right; just like the second screenshot. The menu should be simple though in regard to not including info from the screenshot example IF similar info cannot be added.

The board map SHOULD resemble it's map in the picture preview AND in the picture preview the colors for the columns shouldn't be visible at all for the map preview in the lobby. ALSO, in the maps, the board can be a smidgen more transparent AND the map should be contained in the whole visible page during the game not inside the board AND the background page default will be paused or cleared temporarily IF it is playing behind the image of the map, but only for the duration the image is covered. In the customization menu, the colors go in the bottom selection, like in the screenshot, and the card or "Card" goes above the color selection. The color selection menu looks like how it does in the third screenshot. The card selection doesn't have the color customization option, only the patterns AND how the player can now decide HOW the patterns appear on their card, like not just the item of the pattern but the pattern of the pattern per se. The top of the selection shows "Hat" on top, and selecting it shows a selection like you see in the fourth screenshot, but maybe the selections can be smaller and have three columns of selection to scroll through. 
There will be an outfit selection the player can choose as well, face selection, customization of their beak, the style of their duck, a customization of the eyes of their duck, the size and weight of their duck.
The beaks are in a selection like the hats, and there is a longer beak, a shorter beak, a taller beak, and a rounder beak, plus the default obv. The other beak options are a beak with teeth (like teeth of a reptile), a beak of an eagle, an elephant trunk, the beak super skinny and long beak of a pelican, a beak made of blocks, a beak made of simple 2d geometry, no beak, and a round hole in place of the beak. You can only change the color of the beak IF it is a block or 2d simple geometry beak, and those options to change their beak's colors are hidden from the color menu UNLESS they are selected.
The style of their duck includes a mallard duck (fluffier looking becuz of feathers and cannot change its colors), a white call duck with orange beak AND white feathers implied into a fluffy design which can't have it's colors changed, a rubber duck that looks like a feather velociraptor (the beak with reptile teeth goes with this one), the form of a eagle in the shape of the rubber duck (this can be matched with the eagle beak by the player themselves), the form of a pelican (the beak of a pelican is meant to be matched with this one if the payer selects it themselves), a duck form made of blocks, and a duck made of simple 2d geometry. The duck forms all take the body form of a duck BUT can have slightly different looking heads and/or necks if they arent a duck IF the appearance design all still works the same on them, and only if. The animal species that arent a duck can sometimes have their colors changed in order of primary and secondary or even accent color IF their default look is available in the color section, but certain colors cannot be changed if not specified, and these are all still rubber ducks even if they aren't ducks, but the block one and 2d geometry isnt rubber obv.
The eyes are all the eyes you would imagine that would fit the form or style of the ducks, including the lack of an eye option or just holes for eyes. There is also two different kind of bug eyes, an alien eye, a human like eye, a demon eye, coins for eyes, and multiple eyes (like too many).
The size of a duck section has two options, the make a duck more fat or more skinny, and also a total duck size (which there isn't a lot of room for a duck to become bigger or smaller, so it isn't that big of a difference), the proportions or size of a duck will effect it's hitbox or how big it's space is on the map. Maybe there is duck muscle that can be added as well.
Some outfits include: suit and tie, suit and bow tie, dress, wedding gown for women, catholic priest attire, catholic pope attire, catholic bishop attire, halo reach body armor (dont call it halo reach), military gear, wizard outfit, carboard robot outfit, basketball jersey (you can have it show Kareem's number and jersey, the classical basketball player, and their is a second jersey that has Larry Bird's team and his number too), a leather jacket, a royal robe that can be selected to go with the crown, a normal shirt, a hoodie, a traditional formal nigerian man wear that goes with the Fila, the female nigerian equivalent to go with the Gele, a muscle shirt (if that is possible to convey), blue jeans only, a doctor's outfit, a firefighters outfit, a police outfit, an outfit made of clouds, a pajama gown, a hawaiian shirt, and a disco outfit.

The order of these selection in the customization, exlucding the bottom part for card and color, will be an an order based on the place they fall on a character from top to down, so hate first, face second, eyes third, beak fourth, outfit is fifth, duck body type is sixth, and duck style is seventh (like if a mallard duck for example).

There should be a connection mode setting that can be made to help players on data OR poor connection, like the options in my other game.

* The first map should be called "Night Show"

The other map names are fine. 

The settings should better resemble the idea we are going for in the UI, and on desktop, the "Duck Friends" title should be at the center top of the screen, through not too high.

Ask me questions when need be. Also, the way that option are shown in three columns with rows based off of screenshot four is how the other options besides color will be.

## Play-test notes, word for word (2026-10-24, with a screenshot of an online question: "Answer locked ✓ 1/2 done")
"the game locked my asnwer becuz i impatiently clicked enter from the last game. There should be a ten second grace period that doesnt let people vote. 

FURTHER MORE, the thing at the bottom should change colors BASED on where you are in the board, and it should say "Vote", when the player clicks enter, it locks their vote in and will not say end turn UNTIL everyone has voted, which it will say on the cloud in those letters that fade in as an announcement (so it no longer says round lord), and when it does, it will say "Votes are in" or maybe something more clear, then it will fade away and will ask why the players chose what they chose in the cloud in text, and there will be sounds effects for how words fade in or out on the cloud. The sound will have the boop sound indicate that people can vote to end their turn because the end turn button will say end turn and become themed in either the player's dark or light mode, based on what they have. IN the cloud, it should say "Vote". 
When players are voting or in the vote phase, the board should breathe like a light slowly and slightly glow. 

Make sure that WHEN a player is jumping that they can jump over other players. In the vote phase, if the timer runs out, it locks the players vote into the column they were standing on. 

Jumping default speed is a lot faster, and low gravity mode should scale with it but still be slower then default as to feel low gravity."

Also asked during request 4: chat suggestions only once something is typed; a 30 s answer time by default; the
question box's example "Data breaching is the end of the world and everyone is IDIOTS for not talking about it! - J Man".

## Art notes, word for word (2026-10-24, with screenshots of the nightcap, police hat and gele)
"The nightgown hat has the part hanging down clipping with a line at the base of the hat. The police hat has the badge on the hat on the center instead of near the front of the cap. The gele has these dots on them that is a strange color and ought to have the dots removed.

The bucket hat does NOT look like hunter S thompson's bucket hat that you would see in fear and loathing in las vegas.

The baseball cap is not good enough becuz it's parts look like they float or even go off their object in the case of the three vertical lines in the design on the cap.

The devil horns look terrible

The motorcycle helmet doesnt look like a motorcycle helmet AND the visor isnt alligned to the right where the two eyes of the duck (the other eye unseen due to the 2d perspective. THe motorcycle helment is awful

The aviator sunglasses look NOTHING like what hunter s thompson would wear in fear and loathing in las vegas

The armored helmet has a similiar problem to the motorcycle helmet and must be redone

The sky mask doesnt need the red line on it and should leave a hole for the beak ALREADY on the avatar. THe eye hole is nice tho, just make sure that the ski mask hides the other eyes that dont show in the eye hole

Remove the cutout of the eye and the Zzzz from the sleeping eye mask and make it the color the pajamas will be

Make the clown nose on the top of the front beaks.

Make the fila look better

Have a dropdown arrow for the patterns that are of the hats so they don't clutter the card customization section

Have the eyelashes removed from the floating eye but keep it the same

Improve the white cartoon glove it looks almost nothing like a glove, and the glove should only have FIVE fingers, not six, and the five fingers inlcudes a thumb as one of those fingers"

Later: "The order of the customization options can be reordered eventually too, like the order the hats appear in or other things"

Later: "we can remove the muscle selections in body type"

## Request 5, word for word (2026-10-24, with four pictures: an LS2 full-face motorcycle helmet from the side, Master
## Chief in green Halo armor with a gold visor, the round red ✖ window button, and a small bracket diagram)
"Fat should come before chubby, with chubby being the most fat

The hat patterns should always be collapsed every time you open the menu and the player has to manually open it themselves.

The alien eye doesnt look different enough or very alien

There can be a new hat that is antenna eyes (kinda alien looking)

The helmet should be seen from the side in a way that you find in the first picture im sending, like see how the visor is only half seen from the side? Also have it be more like this shape but the visor can be simple, and the helmet doesnt have to fit around the beak

The hole for the beak in the ski mask has a line overlapping the beak that must be fixed

The armor helmet based off halo should also better sit on the head of the duck in a way similiar to the picture of the motorcycle helmet. The second picture shows how the helmet should look for the armored helmet based on halo and how the armor that goes with it should look. You can ignore the gun they are holding in the image becuz that isnt included.

Below all the special effects options is simple effects, like electricity shocking and moving on the head of the duck, moving flames, hearts that float around the duck head, a poison cloud, and music notes that float around the head of the duck. This is in the effects menu.

There is an option to set a duck on fire in the command line, which will make them temporarily burnt until about five seconds makes the burns go away.

There is a vote to kick option, where all players have to vote to kick player, seen in the player menu by holding tab. Holding tab only happens mid game to show the players, and it shows their avatars, their cards, and their names. If possible, it should also have a ping or accurate reading of their connection on their player card, and if they haven't touch their phone, keyboard, or mouse for 2 minutes, it should show Zs that float from their duck as an effect. There is an ability to click names WHILE holding tab to view stats, send friend request if they have an account, or vote to kick. The vote to kick shows a popup on screen. A player can only vote to kick one player once every two rounds. The vote to kick option asks the player if they are sure. (If the vote to kick option is too much then we can tag it on last.) Players should be able to join back private or open rooms in session and they show on the rooms section while they are in progress, and it will say "Game in progress" for games already happening. There is a button or checkmark a player can click to hide private rooms on the screen.

The question order is random by default.

When players are typing a statement in the write prompt part of the game, whatever that had last written into it will auto submit for the player without them having to click submit, since clicking submit or dont write a question simply makes it end their turn FOR that section, which can help get to the next part of the game where players vote. The timer on the top should have a meter that is filled with a color that very slowly changes colors while being inside a bar or meter that goes more and more until time is out, and this is for in game when a clock is ticking.

In free roam mode, players have a sphere shape over their duck in the color of their vote.

In the third screenshot, add shading to that X button to make it look like a ball, and keep the X on the button the same and do the same to any other window options that are round like that.

The question example in the game can be this,
"Data breaching is a serious problem, and IDIOTS don't understand what I am saying!"

The stats on a player should show their total stats across all games (except for test mode, but you can still track jumps in test mode if you want). The players stats will show options for different game modes, and those game modes can be chosen accordingly to see their total stats of all time within those game modes.

The next game mode is called "Bicker Brackets", and it basically will have the writing phase be where players submit their brackets in accordance to how many they have, and all their brackets will show up on screen together and show what they write into them in how they will appear in the game. The players write the brackets togeter. Before they write the brackets, there is a voting phase in the beginning, where players write one option each that declares the topic of the tournament, and then players click on the topic they want with the duck of the one who wrote it and their player name with the information (24 character limit). When players are done voting and the brackets now have a topic decided, each player gets a certain number of brackets for the game options in this mode BASED on if the host selects the total amount of seeds that players share (8, 12 maybe, 16, 32) OR the total is in an option that combines the total amount of seeds per player. The players can type in each of their seeds together one at a time and everyone can see each other typing together, all seeing each other's words in text box together, where everyone ending their turns will bring players into another round of typing until all are complete. THEN the seeds will be randomized against each other in a random order. When the seeds are complete and in a random order, the players will be on the map, where they can stand on the information in it's UI with the player's name and duck beside their ui element of info OR can walk over to the other side to vote for the other seed, and there is no visible board and the options are somewhat transparent. Their is a voting phases and the phase after where players discuss, just like usual. Furthermore, the players can walk anywhere on the screen almost, much like in the other game mode, the same really. During the voting phase, the screen has a very slight random color it starts on behind the UI elements and it slowly changes colors in a breathing manner, it is very transparent, and the two seeds that can be voted for glow slightly. When players finish voting, the place where the prompt is usually written will instead be the card of the seed with it's info and a multicolored word below it with an exclamation point at the end that says "Winner!" The card the other players were standing on gets an red X on it that is well done, and the option becomes a little more faded and becomes greyscale only.

After each winner it keeps going. When the seeds are eliminated in the first round of seeds so to speak, if it can be like that, such as 16 option getting narrowed to 8, then the board becomes the results that shows the seeds on a diagram, and because mobile screens are small, the pinch and zoom button can be used to increase the size of this info on mobile and walking around with their duck moves the info on the screen in the direction of their duck. When players end their turn, the next sequence of vote ends. After that, the process repeats until the last vote, and the two last options on their cards become silver, and whoever wins has their card turn gold. If a card gets to the championship round, they become silver on the board and next to the cloud, and they become gold on the board and gold in the cloud when they win the championship. The bracket will then show one last time with the colors of silver versus gold on the related cards. Then the ducks can vote to move on from the final bracket showcase before a podium shows the player who won the championship in first place where the board isn't seen anymore, that podium shows for ten seconds before stats will fill up the whole screen. It will show which player won the tournament, which player had the most wins with their seeds, which player had the most losses, which player voted for their own seeds the most, and which player had the most jumps. You can suggest other stats and ask me questions about this game. The stats stay up until voted past, and players can also vote by round two or later during the stat screen to show all stats for the whole game, which would be, which player won the most tournaments this game, which players won the most seeds overall, and so on. If a player is tied, it will just say what two players tie. 

The cards for the seeds (i think they are called seeds) in the bracket game will have a circle on the left which show their duck, the player card in the circle behind the duck, the name below the info in the card's info that extends right from the duck with info in the box (the box has it's rightmost corners rounded). The box can be the color of the player's card with it's patterns too, but the text inside it will have the dark or light theme behind it's letters so players can see it, and it's font will be the font the player chose on their card. 

Prompts in the agree or disagree game NOW have the fonts of the player they selected and so does the info below the cloud for the round lord. A mouse hover over the duck on the cloud will call them the round lord in the font the player chose in a info box.

At the end of every round, in the stat screen there is a vote to return to lobby button now, and also, there is a vote to return to lobby button ALSO in the overall game stat screen as well. A info box that is on the screen and not running off of it will reveal to players will their mouse hover over the return to lobby vote button that the chance to vote a return to lobby will ALSO be seen in the overall game stat screen, and the note of the info box is small and only shows up on the stat screen of the second round. If players don't vote to go back to lobby, then it will keep playing the rounds indefinitely. The players can vote in the tab menu for players at the bottom to start a return to lobby vote, and players can only do this once per turn. 

There is a round that is total, as in, encompassing all the rounds and ends with stat screen(s), and then there is a round that refers to a part of a round where a vote happens or writing happens, things like that. 

There should be sport ball patterns that can be seen as well in the pattern for player cards as well, specifically, basketball, baseball, football, golf balls, and soccer balls.

This game mode will look a bit like the third screenshot with the lines connecting them and being a little transparent that show up in the top left of the map preview to indicate that it is the bracket game mode, and this game mode has the top box and right box as the same color to indicate a winner, and that it's color can be green, while the bottom left box can be dark red with a normal red X over it to indicate a loser.

Give me suggestions about different seeds or bracket types, i assume each box and option in a tournament is called a seed. 

The game type still shows the cloud and the multicolored word with the title of the gamemode on the cloud in the map preview. 

A new map is the image of the jester background from my other game, and the flames from that image (like the torches or candles) moves a little and glows in this game as a new map, and it also gets the static and the lines through the image background like the game does. When that map is selected, some fonts become Cascadia code extra light and get the Ether's Kenoma UI appearance WHILE this map is being played only, furthermore, the map is called "Ether's Crossroads"

Below the settings button is another button called "My Other Website" with a "Nous Within Kenoma" subtitle in it, and clicking it takes the player to the front page of my Nous Within Kenoma website. On the Nous within Kenoma website, under the games section, there is an option for "Duck Friends", and it's description says a party game for friends, and it has the normal UI of the front page, and clicking that takes the user to the Duck Friends front page.

Add more fonts. 

The third game mode is would you rather, and basically, all players write in secret their prompt, and the prompt box has two boxes, one on the left and one on the right. The top of the box has the word already written in the default font "Would you rather...", then it shows the left box empty and the right box empty below it, and in between it is the word "OR"
The first box is "Lose every right ever and become data breached" and the second box is "Admit Justin is right about data breaching"
This is just the faded text in the box as an example like we have done before. 
The board is the text in the player's chosen font and they basically walk over to the tiles they vote for in the voting phase before getting locked in, so it has a very very similiar template to agree or disagree, and the cloud will have the "Would you rather {input 1} or {input 2}" visible.

The stats are basically which players created the most disagreement between players, which player created the least amount of disagreement between players, and then which player jumped the most. I cant think of many stat ideas for this one but you can help me. 

The tab menu in the middle of a game is the player menu, and it can be accessed thru a small button next to pause by mobile users, and when they click it once it stays up until the hit the X at the top right of it. 

The chat menu should automatically scroll down to newest messages every time it is open. 

There is a new command in chat menu called /togglesuggest and it basically toggles suggestion on or off, which will turn off autofill or suggestions in text chat (not command line), and when it is selected, every new game there will be a note at the top of text chat that says the player can toggle on or off suggestions in text chat with that. 

In command line, there is a preview stats this round and preview stats this game command, like this: 
roundstats
gamestats
totalstats

Total stats read stats of all time, game stats read the stats for this game, and round stats outputs sats for this round before the stat screen (so not just the round of a prompt but all of the players prompts or so, and this includes the stats for a whole tournament). The stat in the command line can also have this as a command option:
roundstats @player1 
totalstats @player2 @player4 
This will narrow the stats of only players selected. 
These commands for stats will only show stats to the player in the command line. Output of command line info for stats can be done as such:
send @everyone roundstats @player1 
This will show that this was sent from the command line in small font, then it will show the input used, and then it will show the output in text chat. The command example shows that i can ping a player or players after the end button when sending it to the text chat, but I can also use the private message command from command line in the ping before send to then call out ONLY specific players, like this:
send \@player2 totalstats @player3 
When players use the silly command options, who used them will be shown in the text chat in a small amount of text.
There is also the echo command in the command line online with a few basic and harmless bash commands. 
There is a way to view ping or connection in command line too, which can also be narrowed down to specific players
The chat messages show as chat bubbles over your duck now that show what they said, and they are transparent in text and bubble and fade away eventually. There is a new chat option for \mute bubble that can mute chat bubbles, and all the mute buttons can now have spaces, so that there is less clutter in the help section, so it will be like this:
\mute bubble ping text on @player2 @player3
This allows for an on or off command following mute and then the things being muted after, and the person or persons targeted on the last part. 
Mute settings only last during a single lobby and reset after. I guess we can perma mute but saying: 
\permmute 
idk if it is too much work to include permanent mute, but it has a yes or no prompt to a player when they type it, and then they have to type this to get rid of the yes or no:
-f
as in:
\permmute -f  bubble on @player5
This is something that can be checked by using this command
\show mute
\show permmute
\show players
The command line can do all of these same commands but has to use the slashes for them, but using \@ doesnt work the same because it isnt a text chat.
the host can grant sudo perms to player in command line by doing this:
sudo usermod @player2

There is a directory that commands different commands with their code written into them but inaccessible to all players in file, even the sudo users and host.

The host is always sudo and cannot undo it. 

There is a groupadd command and a usermod command
the sudo permission is needed for these commands

There is a sudo group that gets sudo commands, that the host and other sudo users can add people into

Every user does their commands in the usr directory, and every command input and output is logged into a text file that exists only in the duration of that game. The files can be read with cat command or "cat"

The -a and -G works as they ought to in bash.

There is a group called dumbasses which revokes silly commands and allows the player to only send a message once every fifteen seconds. 

groupadd can be made to create a new group with different permissions in the game for chatting or using commands. 
There is a perm that denies command line for players.

host can change in game settings from lobby mid game with these examples showing how:

sudo forgame all-timer off 
sudo forgame timer off catch-up
sudo forgame timer off answer 
sudo forgame turn-end everyone

You can write how these should work

There is a "man" command to show how things work and their flags (based on bash)

In the command screen, sudo users can mute certain things from a player in the duration of the game (permamute isnt allowed), and they simply do a command called "forgame" like this
forgame \mute on bubble ping @player7 @player2 
They can also say for how many turns (turns can be said to represent the beginning of every vote phase before the last, an entire prompt writing stage until voting occurs, or during all stat screens until voting or write prompt stage comes in)
forgame rounds8 \mute on bubble ping @player2
They can also say if a player doesnt get to in a stage (writing prompts is it's own stage, voting is it's own stage, discussion is it's own stage, stats is it's own stage, and lobby is it's own stage)
forgame stage voting lobby writing discussing stats \mute off all @player2
(the all command takes all things that would of muted a player and turns it off) 
they player can say for how many stages too 
forgame stage2 voting \mute on ping @player2

users can create text files too, like this:
touch file1
echo "hello world" > file1
cat player1/notes/file1

that means a player can do the send command based in the logic of how bash works to include a cat to then take the text output and send it to the chat, if not cat, then only the file itself sends, but you need sudo perms to read inside files

there is a directory in every user's directory called this:
perma-notes
this is a place that sudo users cannot reach to read or manipulate it's files because it requires superuser-{playername} access, which is a group that cannot be modified by a player or themselves in permission, nor can it's directory, but with this group, you get the ability to edit notes in this perma-notes directory. The notes here are kept saved unless a player uses rm on the notes, but the directory itself cannot be deleted, though note contents can be put into cat and then manipulated with bash logic and commands to then send their contents to chat. Messages above 250 characters in length will be collapsed by an arrow option that has to be clicked to expand the text, and it manually has to be clicked every time the player wants to extend the text after reopening chat. The text should have a exclamation point to the right of the arrow when it is a ping.

Pings should also have a background color glow almost behind the text when a player is pinged.

There should be a list users in group bash command too like there is in bash, as well as other things like pipes, append commands, and all of those kind of manipulations brought over.

I want suggestions for different game modes, different ideas, different commands, different settings of gamemode, and ALL of that. 

Make a plan with me and have me answer questions. Make your qestions good with context so i am not lost or thinking more hard then i should have to for something where i dont have to be. 

Continue doing the other things you were supposed to do as well for the new content add ons you stopped."

## Play-test notes on specials, styles and outfits, word for word (2026-10-24)

whenever you click the long jump special it will keep replaying everytime you click every other special

The gun is meant to shoot a bullet (like a little small object on the screen) that passes through the board and screen and hitting playing by caused the dead effect from the commands on them, all by pressing E

The preview on customization on my screen shows the effects being really far from the ducks, like literally so far away from them it is ridiculous

WHY THE FUCK DOES CLICKING A STYLE CHANGE THE BEAK OR OTHER ITEMS! IT SHOULDNT DO THAT! If the player wants the full set for a style, there can be a small little button below the style section and you can click the button to have things like eyes or beak come in to match, only then. 

Remove the fluffy stuff you tried to do around the duck for the mallard and white call duck it failed, but keep the style it is rly good, just the small bumps gotta go

SAME WITH COLORS OR ANYTHING ELSE! THE SYLE SHOULDNT CHANGE THOSE

MUSCLE SHIRT DIDNT FUCK MEAN TO GIVE THE DUCK THE DUMBEST LOOKING MUSCLE I EVER SEEN! REMOVE IT BECUZ IT IS THAT BAD

scrolling in the game needs to be more responsive

scrolling feels laggy

The army helmet straps duck look right and should be remove but the helmet can stay if it is improved

the glove still looks like shit and must be removed by this poinnt because u cant seem to get it right

the birthday hat should have the cyclinder drawn over the top of it at the bottom because u can see inside the hat dumbass. Fix the birthday hat by removing that bottom part becuz it is almost right and can be fixed

In would you rather, the round Lord simply asks "Would you rather"
That is all that shows in their text next to the cloud

i became stuck on the right side in the would you rather game that should be fixed

in the bracket game, a small list compiles on the left of the screen AND on a button that opens a window above for mobile during the bracket game so that players know the answers people have already submitted

The answers are randomized against each other after

actually no the box you write into is on the top and the ones people already submitted are below. You can write out your seeds that you are allocated while others think of theirs

they shouldnt be called seeds but should be called something else

fixing the gamemodes is priority because that is what you play

players can also see eachother's topic suggestions below the box they write into as the come along

actually the the setup i see rn for brackets is fine it just needs to be more obvious by highlighting the player cards of the ones actually writing to tell them apart from what was written

This shows that players r in two very different positions here. One is a guest im playing as from my phone and the other is me on computer. I think it is pretty obv why, because it is using a similiar system from the agree or disagree game
(with two screenshots of the bracket stage: the computer and the phone show the ducks over different parts of the bracket)

WHEN there is a tie in the brackets, the players can vote to either make a vote on the choice happen again or do a coin toss

The vote phase SHOULDNT have a timer by default because players have a chance to try and sway others to their side

what is another solution to ties? Like maybe having them go to a different rank in the bracket to go agaisnt another option later?

there should be a delay in being able to move the mouse AT ALL when you hold or click the tab button

The rooms can be named before you create them too

The bots deciding to vote should be set to five seconds on default in the test mode AND the game should stop you from being able to move when the bots move that is annoying

using items like the guns or other and any special should just be left behind in use while the player is moving that is dumb

the would u rather board should be as transparent AS the agree or disagree board, as any other board should be IF there is one

the two different sides you vote on in the bracket should have their own different and random color changing

clicking the tab button shouldnt jump around inside the browser, the tab button shouldnt be allowed to do that while duck players are playing the game

at one point in would you rather the images become invisible and then reappeared the next round, as in the board.

The board in would you rather should be just as transparent as it is in agree or disagree

fixes to  maps and items first then slow down and let me see you plan after you do those and deploy them

by items i mean specials

the crash you discovered in the vote or anything like that becomes priority

3. Idk because I feel like it should play against something it didnt tie against but i dont know how that works
4. Yeah they can only shift during the voting phase IF IF IF you mean the colors that change... (????!?!?!?!?!?!)



answer me and dont start anything, i started the project but im still confused ab what it is, your place in it, if your in it, or wtf is going on

1. When the computers start voting and they walk to their coordinates, my duck cant move.
2. the would you rather board vanished in the sky map. 
3. sure ig but explain to me simply what that means with simple example or examples
4. yes
5. yeah read that and remember the UI UX notes and remember to be consistent with the artstyle and ask me for any super new ideas, some new ideas might be okay

Whoever is in charge of the special, know this, the sound must be coming from the beak of the duck or player, not the head.
The confetti gun should come out lower, from around the front chest or something below the duck like from the left side of the  image you see in first screenshot.

the loser's X needs to be bigger and on the whole duck not above them

the gun can also be a smidgen lower but u did a good job with that one it is funny

## Imposter Duck, word for word (2026-10-25)

From a longer message about lawyering and The Court (logged with that work):

For imposter duck another thread can do that one too.

The pitch it was started from: every duck gets the same secret word except one, who gets nothing. Each player gives one
clue over voice, then the room walks to whoever they think is the imposter. The plan and the owner's answers are in
`notes/plan-imposter.md`.
