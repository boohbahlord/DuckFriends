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

3. We can do a map for carnival night next for a map

(Chose "New map: Carnival Night" over upgrading Night Show: a Ferris wheel and string lights, a big top, marquee bulbs chasing around the tiles, fireworks when the votes are in.)

FOR bracket game mode, make sure whoever in charge of it will later implement the two ducks on the cloud feature for that one, and then player's ducks will both be on the cloud, and the loser duck gets nudged off by the other duck, making the loser duck fall down to the bottom of the screen and through it with a falling sound effect. WHen they nudge the duck off the cloud, there is also a quack sound effect. That feature in the cloud is the same for this game mode called "The Court"

map suggestions

how about a psychedelic visual? like a fractal sort of, a very colorful and complex one I sent some examples. I want the fractal to be animated and moving, like your falling deeper into it as it morphs and feels recursive yet different the more you fall into it, and the colors all shifts and the textures drift as moving patterns of themselves that contain themselves. Do that for the map background and ask me questions if need be

(Built as a new map, "Rabbit Hole": a Julia-set fractal zooming forever into its spiral center, with the shape slowly
morphing and the colors turning. Drawn with WebGL; a turning color wheel where WebGL is missing.)

1. "Rabbit Hole of Ducklings" is the name
2. Keep it faster i assume, we'll see.
3. The tiles should be as see through as usual unless it is a problem.

(Renamed; the fall now goes 3× deeper every 7 s instead of 11 s; tiles at 45% like Sky and Carnival Night.)

1. On the player bar have it to where the host can have a kick player option where they can kick without a vote and the player cannot cast a vote if there are only two players
2. yes and the host can use the command line to create a skip event action whenever they want as well and the code should be simple to do it and mentioned in the help section. Also anyone with sudo perms can do what the host can including change lobby settings, choose, map, and change game mode in lobby. The sudo perms are granted thru command line. Bring this to your coordinator and have them decide to delegate this work to someone who is most fitting to do it. 
3. yeah sure ig idk wat that means

Someone should be in charge of making a new feature to vote skip a round that is found below or next to vote back to lobby in the TAB menu or player list menu that u can bring up. 

Yeah is this vote to skip a turn or round btw?

add a vote to skip a turn feature that ISNT in the bracket tournament

## Story Chain, word for word (2026-10-25)

From the request that set up The Court: "Another threat will be in charge of the Story chain game. I want the thread to
wait on my call and let me decide how things happen for that one."

The idea as pitched: the group builds a story one line per player, each player has a secret word to sneak into their
line, and at the end everyone walks onto their favorite line. Asked (not the owner's words): 1. where the secret words
come from, 2. what a writer sees, 3. how it starts, 4. length and timer, 5. the ending, 6. voting for your own line.
The answers:

1. Players write the secret word yeah. 
2. They see the whole story so far, and each line added by a player has a small version of their duck under the sentence with a line under the sentence in the color from their player card, and the sentences by a player are in their font. The sentences are typed in and all players can see them get typed in before the player hits send. It is not timed but the lobby has options to time it.
3. A random player writes the opening line. Random players write the secret word that gets used once per sentence. At the end, the secret words are revealed at the end, by being in a player's box with their card design and the word inside with the dark or light theme ui behind the text so it is readable, all next to their ducks who wrote it below the story. The sentence getting typed glows a little. After every player gets a turn writing, and voting on the sentences and secret words revealed during the vote, then they can either vote to go back to lobby, vote to continue story (which starts a new paragraph with a random starting order of player turns AND random allocation of secret words again), or vote to write new story (they keep playing the same game and move to new round but with new story). No timer on any of this.
4. The length is one sentence each with a character limit not too short. Tell me the character limit you choose and then write out examples of sentences that use the near max limit.
5. The ending is player's walk up and down the screen (which scrolls up and down like it would on mobile) and stand on the sentence they like the most and vote on that sentence. AFTERWARD, they then vote on their favorite secret word. Each player is randomly assigned a secret word not their own. The Players ALL write the sentences, vote on the favorite sentences, vote on favorite secret words, look at stats, and THEN go back to writing the NEXT paragraph, since each new round is a new paragraph.
6. You cannot vote for your own line no or your secret word. 


Ducks can walk around on screen while it is being typed, but the game shows a window to the player writing that they have to submit an answer for with the secret word showed in the window as well. The font of the secret word is NOT the font of the player that wrote it only WHEN it is revealed to the player who will write it, BUT the WHOLE sentence the player writes WILL be in their font. 

Stats include who got the most votes for their sentences, the most votes for their word, who took the longest writing, and the most jumps.

Asked (not the owner's words): the 160-letter limit with example sentences, and six small questions with suggestions
(the word must be in the line; the words show after the line vote; votes end by the usual share; what next is three
spots with a coin toss for a tie; one word up to 20 letters; old paragraphs stay above, faded, and finished stories
show on the all-rounds review). The answer, word for word:

that is good

## Lawyering, word for word (2026-10-25)

what are some gamemode ideas in the likeness of these ones rn ? like for convo

we can do something a little different from these maybe, maybe some convo, maybe something to stir arguments or debates, and even ideas that are more gamey or fun

For assigned sides, that game will be called lawyering.
FOR THAT ONE, players write topics they want defended AND another player is randomly assigned to defend it. The lobby settings allow a host to decide IF the player chooses an attorney for their topic or if players vote for their attorney, but the default is it is randomly assigned. Then the offense attorney is randomly assigned by default WHICH could also be the person who wrote the prompt, then the cloud will say "Who will convince?"
The two disagreeing will be in a circle in the center that changes colors, and the offense attorney will be on the side with the sword (left) and the defense attorney will be on the side with the shield. The players can walk either left or right to choose who is right. The defense side is colored after the defendant's player card and has their pattern on the board (which is transparent as always), and the other player has their side with their player card color and pattern, and players stand on their side if they agree with the offense attorney. Players can stand on either side and vote, and it takes as long as needed for players to vote, and only players voting and not debating can vote. The players that vote can then have a timer go off, and their vote can still change and it will say "reconsider?" as a timer counts down. The game will say with a banner that this is their last chance to convince in a way better worded then that, and this timer only happens IF the majority of players ARENT on one side, and then the losing side can have a "Give Up" option with the vote button if they are losing when that one minute timer goes off on the end, which ends that round and the player who won the debate is declared a winner and shown in the clouds while the loser player has a greyscale over their side of the board and it's color and pattern.

FOR bracket game mode, make sure whoever in charge of it will later implement the two ducks on the cloud feature for that one, and then player's ducks will both be on the cloud, and the loser duck gets nudged off by the other duck, making the loser duck fall down to the bottom of the screen and through it with a falling sound effect. WHen they nudge the duck off the cloud, there is also a quack sound effect. That feature in the cloud is the same for this game mode called "The Court"

The chat bubble will say, "The Court Case, {Player 1} is defending this idea: {input topic here}."
Everyone gets to write a topic and doesnt see eachother's answers.

Someone should be in charge of making a new feature to vote skip a round that is found below or next to vote back to lobby in the TAB menu or player list menu that u can bring up.

Another threat will be in charge of the Story chain game. I want the thread to wait on my call and let me decide how things happen for that one.

For imposter duck another thread can do that one too.

The stats can be suggested to me before action last after most of your work and u can suggest ideas and ill suggest ones and well decide together on that one

(Lawyering plan shown: https://claude.ai/artifact/KyJJNkC4FSt6EbxERffFec. The answers below go with its eight steps of "How a round plays".)

1. Yes, but everyone gets to write something and every prompt gets a chance to be debated
2. Yes
3. Yes
4. Yes they can move around while they vote and can go to the other side and change their vote at any time, which puts a circle of the color of the tile voted on AND the circle changes to the color of every revote, voting is done by clicking the vote button when on that side. Until they vote, the circle is faded out a little. The attorneys cannot vote BUT in the counter when all voted but there isnt a majority, one of the attorneys can vote "Give Up" in honor of the better argument or shame at their own.
5. Yes
6. Yes, so if an attorney starts winning only during this last minute, then they cannot give up.
7. yes, unless they tie, then both ducks both jump off the cloud together and the whole tile becomes grey.
8. Once every topic has it's case and stats are done then yes the next case, and stat screen still shows a vote to go back to lobby like ALL games should during the stat screen OR a button to show stats for the WHOLE game if it is the second round or more


Help me do the stats now actually

1.
2.

(Taken as: mode name Lawyering, each topic a Court Case; closing arguments whenever the jury is split; when the minute
runs out the bigger side wins; Give Up is for the attorney who is not ahead; a tie at the end: both ducks jump off the
cloud and the whole board goes grey. Stat ideas sent; the stats get built once picked.)

1. Yes 2. No 3. No 4. No 5. Yes 6. No 7. Yes 8. Yes (Just call it "Unconvinced") 9. No 10. Yes (Call it "Hard Topic") 11. Yes 12. Yes

(Stats built: Best Lawyer, Landslide, Flip-Flopper, Unconvinced, Hard Topic, Turned on Their Own Idea, Most Jumps.
After the bug test: on a phone the attorneys start side by side in the circle, which stretches along its strip; the
verdict fits under the cloud; names in the case bubble never break mid-word.)

## Computers voting in brackets, word for word (2026-10-25)

the ai in test needs a new thread for brackets to make it vote instead of walking back and forth without voting.  

The kicking a duck off the cloud in brackets SHOULD ONLY happen at the end of the championship game

Decided: in a two-sided vote (brackets and Would You Rather) a computer with no strong lean picked a side at random on
every step, so it paced around the middle; now it picks once per match and votes. (The cloud kick is another thread's.)

## Story Chain: fonts the same size (2026-10-25)

whoever the did the story game needs to make the fonts appear as the same size

Decision: every player's font in Story Chain is scaled so its letters stand as tall as the others' (font-size-adjust,
with a measured size for each font).

## More bash in the command line, word for word (2026-10-25)

remember to put a lot of bash that can work in it among implied nuances i talked about to first repo worker. First repo worker, work on giving them as much detail as possible if it isnt you working on that rn

The code for bash needs to have a help command that has other types of help listed in it, which includes bash basics, using certain things like pipe, append, or many things like that, and even unique commands and how they work in this game. The basics must mention man commands

things LIKE pipes and appending too since im not going to name them all here

remember there is a lot of stuff i described for groups

(Planned in the Claude Doc "Command line: more bash". Chose "Build sections 1 to 4": help topics, the bash
operators, text and file tools, groups and new perms, people/room/game commands. Not now: emote, quack, poll, wall,
nano.)

## Imposter Duck, word for word (2026-10-25)

From a longer message about lawyering and The Court (logged with that work):

For imposter duck another thread can do that one too.

The pitch it was started from: every duck gets the same secret word except one, who gets nothing. Each player gives one
clue over voice, then the room walks to whoever they think is the imposter. The plan and the owner's answers are in
`notes/plan-imposter.md`.

The owner's answer to the first plan, word for word (2026-10-25):

The tile should have the duck avatar on it, and it updates with any customization the player makes mid game, and players walk onto that tile to vote who is the imposter. The clue round has a 12 second grace period and players END THEIR OWN clue round, and if they dont end it, then every other player has to. The player whose turn it is gets their tile highlighted and they are seen in the clouds. The tile is the same color as the one in their player card. After every player has had a clue, the tile changes to two sides, either another round of clues (right side) or "Vote Out the Quack" (left side)

When they choose to do another round of clues, things resume like usual. When one is voted out, their tile becomes a greyscale and so do their avatar temporarily and they can't give any clues or vote. 

The cards the players are shown are called the "Secret Cards", and one player randomly decides the secret word secretly before players load into the game.

The stats should be which player voted correct the most times (only IF any did, then it says none)

Give me some suggestions for the stats please

The owner's answers to the five questions left, word for word (2026-10-25):

1. Yeah, they see the category not the word. 
2. No that doesnt even work because then if they guess right everyone knows it is them because the players dont need to guess a word they already know
3. Yeah they win when only one is left, and when they win, the duck who ISNT the quack will have the dead effect from the silly commands and temporarily can't move as they and their tile turns greyscale and the player who was the quack gets their card flipped over, and it shows "You are the quack". The card shows only the category AND the sentence which reveals they are the quack. Also, the game should be called, "Who is the Quack?" 
4. Yes
5. No.

## Music (thread "Plan Duck Friends music", 2026-10-24/25)

We are adding music to Duck Friends 

1. (c)
2. I think we can listen to my directions because i am going to be pulling from many different places at once and THEN directing you thru it with detailed instructions and maybe even getting songs from nous within kenoma and just changing their scale to see how it sounds because maybe it can be used for this game.
3. No it doesnt have to be the case that music gets quieter, it can stay the same volume but it should be playing loudly anyways


Dont make music yet but do bring song from nous within kenoma and let me play the song files here in chat and think of which ones can be repurposed and how

(1 (c) = music in the lobby, a loop during rounds, and a win tune.)

You can put Lantern in the Fog into the game as is right now. Song have 20 seconds of space between each time they play and will play randomly with the first most songs being the least likely to play again while also being random

You can try and make candle vigil in major and another time in lydian and let me see how it sounds, let me know when it is done

we can do the lydian version and call it "bubble bath in the sky" (with proper capitalization)
Put it in the game code and we come up with some other ideas, just wait on me after u put this into game, dont deploy yet im not sayinng that tho

Make something that sounds like those two combined plus a hint or reminder of hollow knight, minecraft, and maybe some very old silent hill stuff somewhat. Those ideas combine with those two songs we just added, and we make the rhythm not too boring or predictable. The timbre should be like Minecraft. It will be in lydian and another time in dorian. It will sound like bioluminescent soft crescendos like nostalgia and happy melancholy, the bass is muffled and the sound fades in and out from hollow to filled, with dynamics that make some instruments go quieter or softer while some sounds go in left ear and make their way to the right. The sound sometimes bobs a little before putting it's head down and walking away quietly in hollow, before the timing gives quiet and things begin to come in and return for play again, become full with earned melody and sounds chiming with glee.

yeah put Glow into the game for the music very nice.

Now we are going to make a song that pulls a little from halo 3 odst's "rain", and it wont have any weather sound effects like that song tho, none of that. It also pulls from everything i just told you AND this song. This next one is going to breathe like long leg circus jests who go up an infinite stair of blocks that grows further and further out, with each step of foot needing to go further, before it stops,  and fades in like a melancholy hollow in meaning but mimicking joy, until maybe a little warmth is found and earned, and then if starts to fall away, the sounds switching between left and right audio of headphones as it lowers in volumes slowly, the warmth still heard, but becoming holly and falling while becoming far, until it quiets. The song was in Lydain, then Major at the happy point, but now it comes in with minor, picking up faster, and then slowing again, taking some breathes, and speeding up again, all while convery a breathey melody convey of explanation about the loss, confusion, and sadness, with dynamics and muffle without harsh but desparation, all while trying to imitate joy as well, all the while looking happy, all the while it is trying to look as if it isnt a sad one who witnessed too much who is made to sounds cheery for a duck game that it knows it has to cheer up for. It does do it's job at being happy, but it is missing something. It begins to work it's way down, falling away too, but fading more so. It lets go and gives up, becomes false joy. 

This is for a game about ducks btw.

when u put glow in, use dorian

like i mean that glow goes in the game as dorian

Jester's Stair is great too we can put that in the game for sure

Next is a spring box bouncy joville joyfully joying in joke joyously, like repetition swing swing and swinging, bouncy bouncy bouncy happy how could it be so happy so much major! it is flushed with fuzzy warmth in a sound like that, a little different timbre then the other songs, like a happy version of hollow knight, while still takinng inspiration from everything. Good timing, lots lots of dynamics, fuzzy wuzzy bliss like rubbing ur face while lovey. Every swells and sometimes even sings in soundful joy and praise of living, almost kinda so good it makes u cry kind of good, like an "omg..." it is like a kid's birthday not bad, no pain this time, just peace, maybe hope is okay to believe. The song can be called Spring in a Box
It flowers also and dances a little, with time for things to quiet down before coming back again

## Who is the Quack? stats, word for word (2026-10-25)

Asked which of the suggested stats to add (Bloodhound, Master of Disguise, Wrongly Accused, Quick Quack and the rest):

"InvestiDucker" is the replaced one for bloodhound and we can do that idea. 
Wrongly accused doesnt show up in round stats but in game stats if that makes sense.
Quick Quack only shows up on game stats not round stats.
Duckguise is the replacement for master of disguise, and it only shows up in game stats not round stats. That is all

(Built: InvestiDucker, first onto the real Quack's tile in a vote the most times, in the round's stats and the whole
game's; Wrongly Accused, voted out the most while innocent; Quick Quack, ended their own clue turn fastest on average;
Duckguise, won the most as the Quack, then lasted the most clue laps as the Quack; those three in the whole game's
stats only.)

## Arrow keys in the menus, word for word (2026-10-25)

using arrow keys should allow for navigation through the UI in the TAB menu, pause menu, and other menus, and clicking enter should select them and shift+enter right clicks them

This way, tab menu is easier to navigate, this is shown only in lobby, customization, or below the tab player card.

(Read as: the arrow keys work in every menu, and a small hint of the keys shows only in the lobby, in Customize, and
under the player cards in the TAB menu. In a game the arrows still walk the duck unless a menu is open.)

## The help command and clear, word for word (2026-10-25)

the clear command isnt working and the help command is not a help command

HELP COMMAND SHOULD FUCKING HELP! 

When using help command, then it should show different things it can help you with. THEN every example should show different ways of using it. 

Different commands should be highlighted differently to imply different kinds or types of commands.

AGAIN, THE HELP LIST GIVES MORE COMMANDS FOR DIFFERENT TYPE OF HELP COMMANDS, such as 
HelpChat
HelpFile
HelpSilly
HelpBasics
HelpGroups
HelpSudo
HelpOperators
HelpCommandLine (for people who dont understand command lines)
HelpDirectories
HelpBash
HelpOptions
HelpMan
HelpHelp
HelpDescription (gives descriptions to every kind of help)
HelpGame (shows how the command line can be used with sudo perms to manipulate the game meaningfully and purposely, has it's own commnads, such as HelpGame-How or HelpGame-Help)

There needs to be sentences and descriptions, basic flags for practicality, how to, and examples. There can be a made stupid vers too at the top of every help

(Decisions: every Help page starts with a "dumb version", then what it is, how to, flags and examples, each example a
different way of using it. Commands are colored by their kind in the command line. HelpGame has its own pages:
HelpGame-How, HelpGame-Help and more. clear also works when typed in the chat.)

## Lobby note, word for word (2026-10-25)
"the game has the ping stat cover the "You" tag on the lobby screen. Maybe make the ping stat smaller"

## The host and sudo, word for word (2026-10-25)

i as host was said to not be in the sudo catgeory this is a glitch

(Decision: the host and sudo never need to type the word sudo; groupadd works like sudo groupadd for them. Anyone else
who tries is told only the host and sudo can.)
(Also from the bug tester, through the coordinator: `usermod -a -G sudo @name` gave the usage message. Now usermod,
gpasswd, adduser and deluser take names with or without @, and flags work split (-a -G), joined (-aG) or long
(--append --groups), in every command.)

## Who is the Quack?: the Quack kicked or leaving, word for word (2026-10-25)

Asked "Should a kick end the round like that, or just remove them quietly and draw a new word?":

You decide

(Decided: when a Quack is kicked or leaves mid-round, nobody learns who it was or the word. The cloud says "A duck
left, so here's a new word." and the round starts over with a new word and a new Quack, the same way it does when a
new host takes over. The round doesn't count in the stats.)

## Fonts the same size everywhere (2026-10-25)

With how the player has dif fonts, make them all be the same size in chat or whatnot, they shouldnt have some bigger then others that is jst sloppy

Decision: the Story Chain font scaling now applies wherever a player's font shows: names (chat, cards, over the ducks,
the people list), the questions and choices they wrote, bracket topics and contenders, court cases, and the font picker.

## Story Chain: writing without voting (2026-10-25)

The game can make it to where the writing game can continue without a voting round as a setting that is turned on by default when there is only two players and turned off by default when there are four players, that way the voting becomes meaningful.

Decision: a Story Chain lobby option, Voting: Auto (the default) / On / Off. Auto skips the line and secret word votes
with 2 players and votes with 3 or more (asked the owner about 3; voting kept on meanwhile). With no voting, a finished
paragraph goes straight to the stats and the Continue / New story / Lobby choice, where the secret words show lit up in
their lines.

## The host and sudo, again, word for word (2026-10-25)

no u dont understand i typed sudo into a useradd command and it was saying i need to be apart of the sudo group to use that command! WHY THE FUCK R U SO STUPID

(Cause: online, when the host's phone sleeps or the tab goes quiet for about 16 seconds, the next player takes over as
host, and the first host was left with no sudo. Decision: a host who loses the role that way keeps sudo, and the chat
says so. useradd -G group name now works (like usermod -aG), and userdel says how to remove a duck.)

## The command line bug test (2026-10-25)

(From the coordinator, after a full bug test of the command line; the report is bugtest/2026-10-25-command-line.md in the
project files.) The command line bug test is done. Please fix all of it in a PR on top of #57 and hold it for my batch.
Also fix the 12 low ones in the report.

Decision: the backslash now stays in front of a letter or @ (`send \@name`, `\mute`, `forgame \mute …`, `man \mute`);
perma-notes hold 100,000 characters in all and say so when full; finger names hats and outfits; `help help` opens
HelpHelp; `send @everyone` alone shows how to use it; and the 12 small ones (history, `tail -n -5`, group name errors,
`adduser group player`, `sudo -v -h -i -u`, `sudo true`, /usr paths, `${#var}` `${var:-x}`, read, xargs, paste,
`grep -r`, a redirect after a loop, `yes`, names without spaces, long lines say they were cut). A group with nosend
can't use `write` either. Aliases stay on the device from game to game, like a .bashrc (the coordinator decided while
the owner was asleep); HelpBash and man alias say so.

## Music: phones, the slider, quieter, crackling, Spring in a Box (2026-10-25)

Your timbre sounds like fart and shit, completely undo the thick level of fuzz, i didnt literally mean fuzz distortion, i meant fuzzy feeling. Tho muffle can lighly come in before leaving back and forth

dont have crazy distortion all over it doesnt fit the game

I assume ur impoving the last song? becuz it doesnt sound very good

no u can do what u said ab the sounds files for phone, but make them only like that on phone version not pc

just do away with the swing in spring in the box becuz i dont like that part and revamp it to take more inspiration from the songs we already made and more inspiration from hollow knight. It really needs to feel distinct tho and also have better flow and more meaningful sounds

like do away with the odd meter i mean

or the swing meter

music can be less loud by default \

whenever i opened discord app while on game lobby the music in the browser game become crackly rly bad sometimes idky

(Also from the bug tester, through the coordinator: the Music slider at 0 and back started a new song.)

Decisions: on a phone the notes' tails end sooner and a few faint layers (octave shimmers, the music box's halo, a
second detuned saw) are left out, about half the work; a computer plays everything in full. The Music slider at 0 and
back (or leaving the room and coming back) picks the same song up where it was. All music is a little quieter at 100%
(about 4 dB); saved slider settings are kept. Against crackling: the music asks the browser for a roomier sound buffer,
and on a computer each next song is written out ahead while the one before plays, then played from that recording,
which takes almost no work. The first song is written out as soon as the page opens, and the lobby waits for it (15
seconds at most); a song not ready in time plays live. Spring in a Box is being
reworked with straight time and more Hollow Knight.

Asked to listen to the new Spring in a Box (straight time, a bowed voice over a rippling harp, felt piano answers, a
music box spring, a choir at the "omg"):

yeah you can put that in the game

(Done: Spring in a Box is the fifth song.)

(Follow-up from the coordinator: Firefox can't pause an offline render to add notes, so the notes are now set down in
4-second pieces a moment apart before the render starts; Firefox plays recorded songs too.)

## Bicker Brackets on a phone in Firefox, word for word (2026-10-25)

WHAT THE FUCK IS THIS SHIT MY GIRLFRIEND IS EXPIERANCING ON HER FIREFOX

(Her screenshots matched the Data saving setting, which draws everything in the phone's own fonts. Fixed: in Data
saving, players' names are no longer shrunk for their chosen font (they had dropped to about 6px); Firefox no longer
cuts off a multicolored name that fits ("BoohbahL…"). From the bug tester, round 3: on a phone the cloud moves down a
little when its duck wears a hat, so the hat never pokes into the title; on a phone the podium's steps show the places
and the full contender cards line up under them.)

(Bug report passed on by the coordinator: on a short landscape phone (844×390), the Who is the Quack? tiles get
squashed into thin strips and the names overlap.)

(Done: on a phone held sideways, the cloud, the Secret Card and the category stand in a column on the left, and the
tiles, or the "Vote out the Quack" and "Another round of clues" sides, take the rest of the board at full height. The
ducks are sized to stand under their tile's name. In every mode, the bottom bar on a sideways phone is one row, so the
board keeps its height.)

(Follow-up from the bug test, through the coordinator: on a slow machine Glow, Spring in a Box and Jester's Stair took 2
to 3.6 times their length to build. Phones now play the music at a sample rate of 16 kHz (every song is filtered below
4.2 kHz anyway), with simpler heavy voices (one oscillator for the pads, the felt piano and the bass; no vibrato; no
sub-octaves, tines or detuned twins) and shorter tails: the three heavy songs take about a fifth of the work they take
on a computer. Computers are unchanged.)

## Joining mid-game, word for word (2026-10-25)

Someone make someone who joins mid game able to vote and play everyone else

(Done: a player who joins a game in progress plays at once, in every mode, instead of waiting for the next round's
writing stage. Agree or Disagree and Would You Rather: they vote on the question that's up (in the writing stage they
write one; on the stats screen they can be ready). Bicker Brackets: they vote on the match that's up, or the next one
(the seeds were already shared out, so they don't write one that tournament). Story Chain: they get a line at the end
of the paragraph being written, with a game word, and vote on lines, words and what's next. Lawyering: they help pick
the attorneys, or join the jury and vote. Who is the Quack?: while the word is picked, during the clues, or while the
room chooses between voting and more clues, they get a tile and a Secret Card with the word (never the Quack, once the
cards are dealt) and vote like everyone. Only while the room talks a turn over, or is in the middle of voting out a
Quack, do they walk and chat until the next question, match, case or lap of clues, because a tile added mid-vote would
move the tiles under everyone's feet.)

## Music: Ducklings in a Row (2026-10-25)

give me all the instructions i gave you and paste them down to another agent and have them come up with an idea for a song that is novel but builds off of these. Send them the primpts i wrote you not the songs, then let them write a song idea and ill look at it and consider if i want to send it back to u

(Done: a fresh agent read only the owner's music requests, word for word, and wrote "Ducklings in a Row": a mother
duck's waddle tune on felt piano copied as a round by her ducklings, a music box and a harp; D Mixolydian lifting to D
major. In /mnt/project-files/music/song-ideas/.)

where is the ducklings in a row song at?

make it a song i thought u started on the song while i was sleeping

yeah we can put this song in the game

(Done: Ducklings in a Row is the sixth song. Still water, the mother leads, the row grows with a music box two bars
behind and a harp four bars behind, the reeds (muffled, a heartbeat, one duckling unanswered), found (D major, strings,
choir, chimes), and home.)

After that, suggest to me some scales, modes, or rtythyms, and new timbres for the next song, and ill choose what i like before we send it off to the other agent to make a song idea
## Specials on the number keys, word for word (2026-10-25)

We need a new concept, there is a new map where ducks can just hangout without any game or winning.

The camera stays centered on your duck as they walk around and the area is so big that it goes beyond the visual scree, much like in the writing mode where you can walk down to the secret word area, but now it is every direction.

For the special's menu, the ducks can assign them to a number key, any one of them (1-9 & 0), and the ones that are an effect like fire ONLY show up for five seconds when clicked. The long jump is now simply a button on the number key where it is located, and ONLY clicking it there will turn on a long jump. Using the shift button and number key will toggle on the effects or long jump to keep them on. The number key row is small and only shows in a top left part that DOESN'T block any UI or game elements and is transparent even when buttons are clicked, but the slot selected and clicked by it's corresponding number key has a slight glow around it.. Not using it for a long enough time makes it disapear in 5 seconds, and that can make it fade away off the screen. Mobile can assign them to slots as well, and they access them by holding down on the screen (their equivalent of right click), which brings the options onto their screen to use. 

On mobile, the screen has the number key row not existent on their ui screen. 

Dont start the playground yet, but someone work on the specials menu. When the customization menu, the special choices will have a preview button, which shows them on your avatar, and then then clicking the tile normally and not the preview option inside of them brings up a box for each number key it can be assigned to, BUT the boxes do NOT open another window.

IN THE COLORS MENU, there is a section for coloring certain specials, such as the different colors of the water gun (Primary, Secondary, or Accent), the gun, the flame effect, the electricity, and so on. The long jump doesn't have a color effect. 

There is new special called double jump, and the double jump has a small cloud effect in midair when the second jump is spent, and it can't be used again till the players falls back down. The double jump effect can be colored too but is transparent enough to not block important things. 

We also need more ideas for different specials.

One special is a trombone, and it always plays it's sound as a note wrongfully played that is meant to sound silly.

the trombone should be played at it's mouthpiece at the beak of the player

(The hangout map waits. Plan shown for the specials: each special sits on a key, 1 to 9 or 0, and the old special moves
to key 1. An effect shows around the duck for 5 seconds for everyone; Shift and its key keeps it on until Shift and the
key again. The long jump's key does a long jump; Shift and the key keeps long jumps on. The double jump's key (or Space,
kept on) jumps again in the air, once a jump, with a see-through cloud. Items are used with their key; E repeats the
last key. On a computer the see-through row of keys sits top left, the pressed key glows, and the row slides away after
5 seconds unused; phones have no row: holding still on the board brings the specials around the finger (tap to use,
hold to keep on; holding a duck still opens its player menu). Customize → Specials: a preview button in each tile; the
tile itself opens ten key boxes under it, inside the menu. Colors gets a Specials section. Sixteen more special ideas
were offered for the owner to pick from.)

## Music: faint crackles (2026-10-25)

there is cackles in some songs in the computer game that are faint but bothersome, like it should be checked out by another agent maybe if possible, if not i understand

(Done: every song was written out and searched for clicks in Chromium and Firefox. The songs themselves were clean
apart from the needle crackle that Lantern in the Fog, Glow and Jester's Stair carried under them (from Ether's
Crossroads, very faint); it's gone, the soft hiss stays. A real click was found and fixed: hiding the page for a moment
(another tab or window) and coming back made the song click and play twice for a second; now it fades out and back in.
Each song's recording fades out at its very end, Chrome writes the next song out about 2.5 times faster (less work for
the computer while a song plays), and a song not ready in time is no longer written out a second time.)

there is cackling in all of these songs.

(Found: no clipping; the crackle is the little burst of noise at the start of notes, there to sound like a hammer, a
mallet or a breath. The felt piano's hammer and the wood knock now swell in over 5 ms, softer and darker, and the brush
is a little darker; the seven new songs' own instruments get the same in their thread.)

## Music: seven new songs from the owner's picks (2026-10-25)

Offered: scales A1 major pentatonic, A2 whole tone, A3 Lydian dominant, A4 harmonic major, A5 Hirajoshi; rhythms B1
3-3-2, B2 half time, B3 3 against 2, B4 waltz, B5 fast harp ripples over a slow tune; timbres C1 kalimba, C2 marimba,
C3 celesta, C4 ocarina or soft flute, C5 glass harmonica, C6 water drops and bubbles, C7 tuned rubber duck squeaks.

First song: named "Infinite Pond"
A2
B2 
C5
Breathey dynamics

Second song: named "Outer Space Swim Commute"
A3
B5
C3

Third song: named "Waddle before you paddle"
A4
B4
C1

Fourth song: named "Bouncy Chicks"
A1
B3
C2

Fifth song: named "Pond-erful Ruffles"
A5
B1
C4

Sixth Song: named "What the duck?"
Scale is like the main menu music of bioshock
https://www.youtube.com/watch?v=cMjThJwdwo0
It is horror themed and plays rarely, like only once in three rounds of all the songs, and it randomly comes in somewhere between those songs for the third round. No weather effects but it can be ambient and tense.

The seventh song will take inspiration from pair bound from bioshock 2 soundtrack and then use a mixture of all these new instrumentals and take turns with them while each part of the song switches to very different modes, have key changes, but switches up between all the patterns of B1-5 without using the instrumens those rythyms mention. 

The song needs multiple agents to work and and a coordinator to inform them of the task, since three agents will be working on songs at the same time. Another two agents will be writing scripts. One agent will be coordinating.

(Started: a coordinator agent briefs two writers, who write the seven song ideas, and three composers, who build and
render them; test renders go to the owner first. Song 6's rare-play rule is for when it goes into the game.)

Is there any songs dont yet?

HOW THE FUCK IS THEIR NOT EVEN ONE SONG DONE YET THIS IS RIDICOLOUS

yes and u can continue working on the others after

(Six songs were done by then and were posted for listening: Infinite Pond, Outer Space Swim Commute, Waddle before
you paddle, Bouncy Chicks, Pond-erful Ruffles, What the duck?. Song 7 was still being composed.)

there is cackling in all of these songs.

The instrument needs to be changed into something different for ponderful ruffles ... 

Give me instrument suggestions becuz the lead melody sucks until it is muffled in some parts, it can remain in the parts it is muffled in? maybe not. It can be another wind instrument maybe too

im still looking thru the songs btw

Make infinite pond have a different main instrument and make it into a type of lydian

I liked feather bound btw and i think we can use all of these songs

(The crackle was soft noise bursts at the start of notes (mallets, felt ticks, the ocarina's breath); they were made much
softer and darker. Ruffles' lead: the owner was offered a bamboo flute (shakuhachi), clarinet, pan flute or koto.)

## Specials: the number-key row (2026-10-25)

(From a longer message; its music bar and song parts are logged with the music work.)

The number key ui in the top left IS NOT SEEN YET and i wanna know why. Furthermore, using shift+number key SHOULD have the item have a visual representation on the number key that it is toggled, where only abilities like double jump, long jump, or electric become toggled.

(Why: the row only came in for 5 seconds when the board first came up in a game, then waited for a number key, and a
duck with no specials on its keys never got it at all. Now it shows its ten keys even when they're empty, comes in again
with each new stage on the board and with any number key, and still slides away after 5 seconds unused. A key kept on
with Shift turns green with a lit dot, and stays in its place while the rest of the row fades, so you can always see
what's on. Only effects (like electricity) and the jumps keep on; items are just used. Phones still have no row: their
ring of specials shows kept ones green.)

## Music: the music bar, and everyone hears the same song (2026-10-25)

(From the same message as the number-key row above; with a picture of the top bar, a small box drawn just after the
stage's name and a big box over the play area.)

I think there should be a bar in the small box i drew here OR somewhere small in the big box, and it should contain the song name that is playing for the song for the player. 

ALL PLAYERS should hear the same songs at the same time, and maybe when they click off the tab in their browser the song only temporarily mutes before music audio is unmuted when the tab is clicked again. There should be a speaker symbol (not emoji) that can be clicked to mute the song or hovered over to show the volume slider revealed to it's right (basically kinda like a shortcut to the settings audio menu but for music), and it can be slid up or down to increase volume above default or below it. the default volume has a line in the meter to indicate default. The name of the song shows there. All players here the same song at the same time together when in a lobby ALWAYS because it is live and not player specific.

[…] The commands allowed certain songs to be removed from the queue with a toggle on or off command for specific songs, and songs are named in quotes IF there is a white character or space in the title in the commands, as per the rules of bash.

(Built: a small bar in the top bar and the lobby's: a drawn speaker, a music note and the song's name (between two
songs, the next one, dimmed). The number-key row took the small box after the stage's name, so the bar sits at the right
of the top bar, before the timer; on a phone it gets its own short row under the title. Clicking the speaker mutes the
music for that player; hovering it shows the Music slider in the name's place, to the speaker's right (a tap on a phone),
0 to 200% with a line at the default (100%). Settings → Audio's Music slider goes to 200% too, with the same line. The
host's game picks the songs and keeps them in the room's state with a start time and a seed, so everyone hears the same
song at the same moment (online within about a tenth of a second), in the lobby and in the game. A hidden tab goes quiet
and, back in view, comes in where everyone is. Command line: `song` lists the songs (on or off, the one playing), `song
off "Jester's Stair" Glow` and `song on …` (host, sudo or cansettings; names with spaces in quotes as in bash; `song on
all`, `song off all`); a song turned off while it plays stops and the next comes in 3 seconds.)

## Hangout on Duck Cabin, word for word (2026-10-25)

For number one, there is a stage that a duck can get on with a mic there, and it overlapse the duck in perspective when they are behind it and disappears behind the parts of the duck that hides it when they are in front of it somehow (Such as jumping up from below the podium while not on it).

There is a soccer ball that can be kicked around yeah, and there is one soccer net on the far right of the gamemode. Remember it is a large map that can be walked through.

There is a chalk floor that is written into by using the fingers on touch screen OR the mouse on the game, by clicking and dragging mouse. The chalk board has an eraser next to it that if you stand on it and use the end turn or vote button, it will say "Erase", and clicking it erases whatever was on it. The board should have a chalk above the eraser that players click to start drawing. Players can write into it at the same time. 

There are couches somewhere in the center of the room that the vote button will say "Sit" as an option, and clicking that allows the duck to be sitting on the sofa, and the sofa can hold up to as many ducks as the amount of cushions, and there is no movement on the sofa. Clicking or using movement just puts you onto another cushion of the sofa IF the adjacent cushion is unoccupied.

there is piano keys somewhere which can be walked onto to play notes OR the player can go into keyboard mode. The keyboard mode has four octaves, and the controls are ctrl will flat a note by a half step and shift will sharp a note played by a half step. The black keys on keyboard can only be played IF you use this ctrl or shift button, and the keyboard on the screen will glow when tapped. Every interval of half step glows a different color (minor 2nd, major 3rd, augmented fourth) of the rainbow, and chords that play together base their color off of the previous note either currently played on the keyboard OR the last not played. The notes are player with these options:

lowest octive: 1 2 3 4 5 6 7 
second lowest (second availible octive): q w e r t y u 
third octive: g h j k l ; ' 
fourth octive: v b n m , . /

When a note is an interval PLUS it's octive, then that notation can be written ON the key.

The keyboard has a part that says play in the vote or end turn button, and clicking it will open up the piano mode. 

ON MOBILE the player will have the four keys show up on their screen and show the colors and everything here and they just click the keys.

Players cannot move when playing the piano on the board. It is a large piano that shows the notes to everyone. It also shows a column of a musical sheet above the piano that shows the notes being played there. 

When a player is playing the piano, their duck teleports to be in front of the keyboard, out of the way of the Play Piano button, and each player has their own teleportation spot, and who teleports where while not being able to move when playing the piano is determined by which spot is unoccupied.

There is a pool the ducks descend into somewhere with slight water physics, like splashing effects or water moving around when they move. There is a beach ball that stays in the pool or only outside of the pool if it was knocked out of it. The beach ball cannot go too far off from the pool. The pool is large and there is a little pull rope that splits the pool in half, and it doesn't effect ducks at all since they move past it, and it appears beneatht the ducks AND all their customization, skins, effects, clothes, and styles, not letting the pool rope go over them. Little small rubber ducks can be seen in the pool that stay in the pool, and they move with the water. 

Ducks can also use a trampoline somewhere.

This all takes place in a very large wood cabin with a fireplace somewhere in it. The board is based on the ground, and there is no visible map because the map AND game mode are one in this gamemode. The pool is outside of the wood cabin, there is a riased porch deck ducks go down to go to the pool, a campfire outside, trees in the forest at the outskirt of the cabin, and a red tj jeep from the early 2000s or whenever it came out in it's cult classic look parked on a dirt path somewhere outside the main entrance. The image shows more info. 

A lot of good perspective work and good code will need to be done for this new board and gamemode for hanging out. AND there can be a book players share inside the cabin. 

Maybe the cabin has bedrooms and a kitchen, as well as a bathroom. Maybe an upstairs? ???? 

Multiple agents will need to work on this. 

We can call the game mode "Hangout" and the map is "Duck Cabin"

The music fades away and becomes muted as soon as someone clicks the play piano button, and instead the music bar that shows who is playing music simply becomes "Piano", and the music fades back in 10 seconds after someone gets up and off the piano.

There is no stats or rounds.

(Two drawings came with it, in notes/ref/hangout/: cabin-sketch.png, the cabin at night on a hill: a dark roof, warm
orange windows, a door from the cabin onto a raised deck with warm lights; "Going inside the building reveals the
inside, and going to the front or backdoor (the backdoor leads to the deck) will show the outside fittingly"; "There
are some lightposts outside that flicker a little and have a warm orange glow to them in the dark outside, but scarcely
placed"; "The jeep is on the highground and the front door doesn't need an stair to get to because it is level to the
highground"; "The entrance is to the left behind this 2d view"; "The pool below that is downhill has lights in the pool
under the water that makes it shine in contrast to the dark, and a few lights around the pool"; "Stairs lead downhill
off the raised deck high above ground. Jumping off the deck makes a falling effect and the ducks fall for long time
here"; "The darker green here is the decline where the ground goes downhill"; "The pool is found downhill away from the
deck". And stage-sketch.png, a round raised stage with a mic stand and side stairs: "The duck and ALL of it's
customization it wears, including effects, get covered by it when they are behind it"; "The mic is a prop and does
nothing, it is for decoration"; "The stairs OR jumping are the only way onto the stage because it is a raised platform,
and you need a certain amount of jump height and/or air time FROM the jump to get onto the raised platform of the
stage.")

delegate the tasks to many workers

This cabin is good inspiration

(Two photos of a log cabin came with it, notes/ref/hangout/cabin-photo-front.jpg and cabin-photo-deck.jpg: round
orange-brown logs, a steep A-frame roof with a dark green shingle roof, a big triangle window over the door, a stone
chimney, a wraparound deck with an orange wood railing and stairs down to the right, wooded hillside behind.)

(Building with several workers; the plan and the parts are in notes/plan-hangout.md. Open questions taken with these
picks until the owner says otherwise: one big floor first (living room, kitchen, two bedrooms, bathroom), upstairs
later; the book is a guestbook; Shift sharps, Alt (Option) flats, since Ctrl+W/T/N belong to the browser and would
close the game; each duck's chalk is its body color; the Sit/Play button turns to "Get up", and a jump gets up too.)

remember it is night time in the map though

(Duck Cabin is always night: the photos give the cabin's shapes and wood colors, lit warm by its windows, lamps and
lights against a dark blue night.)

and it is sourrounded by forest trees

(The forest rings the whole map: trees on every side, thick at the edges, where the world ends.)

Make the space bar flat and C is sharp AS WELL and then to escape the piano click Escape.

The keys and what they do are shown in an orderly fashion to the player

(Piano keyboard mode: Space flats as well as Alt, C sharps as well as Shift, Escape gets up from the piano; a neat
legend of the four rows and these keys shows on the keyboard on a computer.)

## A starry night sky map, word for word (2026-10-25)

Someone make a map of a starry night sky that is detailed and breathtaking as can be, and it rolls across the sky beautifully and moves. The map is just a very starry night sky.

Yeah, i like these two new versions of the song a lot, now we can just add them to the game BUT make sure any high pitch notes or flutes arent too shriekish or ear piercing along with any other notes, like round the sound a little on some of those notes if need be too. THEN we NEED to deal with any popping noises still

(Done: high notes in every voice are a touch softer, as the ear hears them louder; the pan flute and the ocarina are
darker; the whole mix has a soft dip at 3 kHz, where shrill notes hurt. Every song measured 2.5 to 6.5 dB less shrill at
its sharpest moment, at the same loudness. No hard clicks were found in any recording; the low notes of the kalimba,
marimba and harps and the thump drum now come in a little slower, as a round "dum" instead of a pop, and a note played
live whose moment has just gone by starts with its full soft shape. The owner was asked where they still hear pops.)

## Specials: dagger, aiming, ducklings, disco ball (2026-10-25)

dagger is one, and it throws a dagger that eventually curves down and falls off screen, causing the dead effect on every duck it hits. 

ALSO NOW the direction of your mouse ON PC determines the direction the bullet or dagger goes into, and the dagger or gun moves around the duck when it is aimed. You can toggle the gun or dagger to keep it out and simply use left quick to use the weapon while it is out.

Ducklings is a good idea for one

disco ball is good

Round lord doesnt play the effects anymore tbh.

(Done: the Dagger is a new item. Its key throws it toward the mouse: it spins in a low arc, never over a duck's head, so
every duck in its way plays dead until it moves, then it falls down off the screen. The handgun's bullet flies toward
the mouse too. While aiming, the gun or the dagger turns around the duck to point at the mouse, and everyone sees it.
Shift and the key keeps the weapon out (its key turns green); then a left click on the board shoots or throws, and Shift
and the key puts it away. Both stay off when the host turns off the silly commands. Phones have no mouse: a weapon
fires the way the duck faces. Ducklings: three little ducklings walk in a row behind you along your path. Disco ball: a
disco ball spins over your head, its colored beams and spots sweeping over you. Both are effects (5 seconds, or kept on
with Shift) and take Primary, Secondary and Accent colors; the Dagger takes three colors too. The Round Lord's cloud,
the winner of a match and the podium no longer play the first effect on a duck's keys; effects only come from the keys.)

## The host types sudo too (2026-10-25)

the host should still have to use sudo btw

Decision: the host stays in sudo for good (never "not in the sudoers file"), but like every sudo player types the word:
`sudo groupadd …`, `sudo skip`, `sudo map sky`, `sudo song off Glow`. Without it, a sudo command answers "Permission
denied (put sudo in front: sudo groupadd …)", and `sudo !!` fixes it. A group given a perm (canskip, canmute, cankick,
cansettings) still types its command alone, since it isn't in sudo. The Help pages and man pages show sudo in front.

## Specials: the number-key row on a touchscreen laptop (2026-10-25)

i have a laptop with a stupid touchscreen built into the  laptop monitor i cant turn off, but maybe that is what is hiding the number key display for the specials

(Yes: the row hid on any screen that told the page it was a touch screen, and a touchscreen laptop in Edge can say that.
Now it hides only when there is no mouse or touchpad at all, and it shows anyway as soon as a key is pressed or a
touchpad or mouse moves. Phones and tablets still have no row. Customize → Specials uses the same check for its words.)

(From the specials thread, the owner: "i have a laptop with a stupid touchscreen built into the  laptop monitor i cant
turn off, but maybe that is what is hiding the number key display for the specials". The music took such a laptop for a
phone and played the lighter phone versions of the songs; now only a device with no mouse or touchpad at all gets them.)

## Music bar: the default line stays at 100% (2026-10-25)

also the bar that shows where the default percent is has moved around into places not 100% volume

(The music bar's slider box stretched to the song name's width, so its line sat past 100% when the name was long. Now
the box is exactly the slider's width, and the line is on 100% for any song name; the Settings → Audio line was already
on it. Checked in Chromium and Firefox, phone and computer.)

## Specials: cooldown bars on the number keys (2026-10-25)

There is a cooldown bar that shows on the player's number keys UNTIL they can use certain items again, like the dagger or the gun and other things

(Done: every item waits a moment before its key works again: the handgun 3 seconds, the dagger 2, confetti rain 15, the
others 1.5. While it waits, its key dims and a yellow bar along its bottom drains to nothing; the key stays on the screen
until it is ready, even after the rest of the row slides away. A phone's ring of specials shows the same bar.)

## Night Show: the rolling lights come back (2026-10-25)

The night show map and the background on the Duck Friends screen should have the lights rolling in a diagnal fashion, where each individual light breathes but they breath in patterns to make larger patterns that mesmerize, like they use to before they were changed

(A speed-up for the background had drawn all the floor's dots as one picture, so the whole floor breathed at once. Now
each row of dots of one color is its own small picture again, each a little after the last, so the light rolls across
the floor in diagonal waves like before; the string lights twinkle in three sets instead of all together. Same on the
title screen and the Night Show map; still smooth (60 frames a second) on a slowed-down phone and in Firefox.)

## Night Show: a glowing playroom on the back wall (2026-10-25)

The night show needs the background to have something feeling up it's empty space. How about a very colorful indoor playground that glows and wrapped in lights with wooden block letters stacked and changing colors, colors that glow in more patterns, and there is a window casting a waxing crescent with a tree seen from outside

(First try: a neon playground, letter blocks and a window drawn flat on the back wall. The owner, word for word:
"everything added to the night show needs to be made better, more detailed and better blended into the page, it feels
very post hawk and shoved in, and the playground just kinda floats... ewww" / "How about we make a detailed toy train run
into the screen from the left and go thru into the right while glowing and carrying ducks on it" / "we can keep the window
and moon" / "everything must look like they belong" / "maybe the lights on the floor IS the floor" / "and the window and
everything can be adjusted to show as such".

Second try, waiting for the owner's look: the light-up dots are the room's floor and reach the wall; a baseboard where
the wall meets it, and the wall glows in the floor's colors near the bottom. The playgrounds (striped tent roofs, decks,
climbing walls, nets, a tube, slides, all wrapped in running string lights) and the letter blocks stand on the floor in
the same perspective as its dots, lit from below by it, with soft shadows and faint reflections in the shiny floor; the
window and moon stay, reflected in the floor too. A track crosses the floor, and a toy train (an engine with a duck
driving, three open cars with two ducks each, glowing lights, a headlight, turning wheels, smoke) rolls in from the
left and out to the right about every 26 seconds. Code: js/playroom.js.)

## Sound: stop the pops, starting with the Hangout piano (2026-10-25)

We need a worker or agent to look up a rubric on how to make our audio AI to STOP PRODUCING BAD AUDIO THAT FUCKING POPS ALL THE TIME! Like the new piano in hangout room for example

Simply, look up how to make audio that claude code or opus or just claude to not create popping sounds that hurt the listener of audio, find the right way to look that question up, then find what people say they did to train their ai to solve the problem, and then find rubrics for this issue as well

(Found in the piano: each key was set to start only 4 ms ahead. A note set to start in the past skips its fade-in and
clicks, and in Chrome can even begin up to 30 times too loud for a moment; Firefox's clock only moves between tasks, so
it is often a few ms behind. The piano's limiter also turns quiet sound up by itself, so 8 or more ringing notes went
over the top and clipped. Now: keys start 20 ms ahead, every envelope starts from silence even if set late, and a soft
ceiling keeps the piano under full scale. The sound rules went into CLAUDE.md ("Sound without pops"), and
tools/clickcheck.js finds clicks in a rendered sound.)

## Request (2026-10-26): Story Chain voting with 3 players

> 3 player games in story chain do not vote i think i told them

Decision: Story Chain's Voting option on Auto now turns voting on only with 4 or more players (it was 3). 2 and 3
player games just keep writing. On and Off still force it either way. The lobby's tip says so.


## Request (2026-10-26): Hangout fix-up ("project distill"), 15 pictures (11 screenshots, Wrangler photos, two stage sketches)

> (2026-10-26 00:40Z)
>
> These pictures are for project distill. We need to rid of perspective issues or even outright mistakes in production. (My text is messing up so i cant reliably finish this message from a UI error I am having on my end that arises from all these screenshots in the message box. Will send the message for now but we aren't acting yet and this is a rough plan for MY OWN prompt. Do not think anything of it or mind.)
>
> The target is the new hangout game mode.
>
> 1. First, we are going over simple perspective issues.
> Then we are going over solutions
> 2. Second, we are going over production mistakes
> Then we are talking about correction solutions for production mistakes
> 3. Third, we are going after missing productions
> Then we are adding those missing production pieces
> 4. Fourth, we are talking about new ideas to add to the map

> (2026-10-26 04:17Z)
>
> "1. First, we are going over simple perspective issues.
> Then we are going over solutions"
>
> Goal number one (1) goes in two parts, the diagnosis and the treatment plan.
>
> These are the screenshots about what I caught, numbered by their fraction, such as {number} of eleven: 1/11, 2/11, 3/11, 4/11, 7/11, 8/11, 9/11, 10/11, 11/11
>
> These perspective issues either violate the logic of the perspective or the actual appearance of an object's substance itself, the former and latter could be said to be mixed though, not necessarily different or very distinct, but understanding this mixture might help. An example is 1/11 (or screenshot image one of eleven), where the refrigerator has a handle at the top of it. This violates both in a way that mixes the two, where it is as much an error in the form of an objects as it is an error in the perspective an object it references and mimicks in a failed robo-emmanation of it's maker birthed by human.
>
> The following is OR statements where multiple can be true.
> Certain surfaces are not to be (like a square or other shape image part of a surface that makes up a component or surface of a component of a larger surface), or are of parts within them that might not to be, or of a disarray of surfaces, surfaces that are of too much length or width, or surfaces that overlap or hide behind other parts in a disorder that is not correctly portraying it's object, or objects or their parts are sitting in places they ought not to for the given perspective or logic of their form imitated, or duplicating parts or the whole from a differing perpsective.
>
> Those are examples of things to look for, roughly worded with some inspiration from greek metaphysics and ontology.
>
> 1/11: The top of the fridge has a handle where it should not be, and the bottom part of the fridge is missing a handle. An issue of perspective implied by the wrong application of a component.
>
> but the good thing is the little colored squares look like posted notes OR magnetized pictures for a fridge, very nice detail.
>
> 2/11: The tea kettle on the stove should be sitting directly on top of the stove burner, not off the back end of a burner. Misplacement is all with the tea kettle.
>
> The kitchen cabinets on top i think they are called, their top end is too long and back AND they sit right behind the counter INSTEAD of above them. Could be raised up higher like kitchen cabinets are when they are above kitchen counters.
>
> The fruits are not sitting inside of their bowl but are sitting in front of it, so the order of the overlap or which objects go behind another is messed up.
>
> The kitchen counter on the left doesn't overlap the stove, which might be fine, BUT it is inconsistent BECAUSE the one on the right DOES. The kitchen counter on the right and how it's edge overhangs a little should be changed to resemble the overhang on the left i am referring too.
>
> Make the back of the chairs stand up so long in height (the back being where a human rests their back. the design there is fine for the chairs, the back part above the seat is just too up high, do NOT make it too short in fix, be conservative). Allow chairs to be sat in.
>
> The kitchen needs a door that resembles all of the doors inside of the building (entrances and exits look different)
>
> 3/11 The couches are mostly fine, but the back of them at the bottom left and right corners have columns that are faded in the same design and format of the arms of the sofa, but on their back end, that must be corrected but having the corners resemble the other back part of the couch it ought to blend with, keeping the design and structure of the couch.
>
> (Do we want the carpet to look like that? Ill leave it up to Solomon)
>
> 4/11 The musical sheet the player plays into should be removed to keep things simple. It clips through and violates almost every rule, standing tall more like an interstate sign rather then anything possibly logical, much like a fever dream logic. Ugly at least, laughably horrendous at most.
>
> 7/11 The right side of the steps are missing a part of the rail, but my Microsoft paint drawing DID NOT even include a rail on the steps, if I dont recall. Just remove that part of the steps.
>
> 8/11 The lights clip into and under other components on the round end or round edges of the stage top or around it's corners, this is terrible. The solution is to have lights sit on top of these components, because objects should have their most simplest shapes done first, then any very simple texture, then deails or detail objects (detail objects are added onto a larger collection of simpler objects last), and they should be done in an order of operation (order of operation is very important phrase to remember with certain things when planning and executing anything with details or complexity enough) that preserves the perspective and artistic purpose through a preventative design system. For example, the details of an object are different then it's texture, and the detail object additions go last UNLESS it violates the higher order principles which say the form of an object IS NOT being achieved in perspective by this order of operation, which means context AND other hierarchy of principles can be used. Principles help simplify and bring order to a process while turning lead into gold. Note, Solomon can ask questions from Adam sometimes, but the extent of the number of questions is decided by Adam BECAUSE of the principles on plan usage, quality, time cost, and cost of work.
>
> 9/11 The bathtub is duplicated from two different perspectives, with the bottommost bathtub duplicated being the less desirable perspective. Items should conform to the perspective of the camera unless a reason or context says otherwise. The mini tiny rubber duck in the well-done topmost bath has it's beak facing the wrong way, make the beak come out from the left of the mini tiny rubber duck head not it's right. The topmost tub is alright but can be improved if need be, because it is hard to judge with the bottom tub duplicate in the way, but we can leave the decision up to Solomon.
>
> The toilet is terrible, like a dissociated drug experience of ketamine or other nmda antagonist, we must redo the toilet until it's parts look as it should from the camera's perspective, furthermore, the toilet is facing the wall it is up against... Which is so insane that most wouldn't even think of the idea.
>
> 10/11: The bed has it's backboard standing a little tall, especially from the given perspective it betrays, since the bed looks as if it is seen from a high up view, but the headboard looks as if it is from a front facing view, so yeah the headboard must be very short in height until it agrees in consistency with the rest of the bed's conveyed perspective. The bed should be able to be jumped onto btw, same with every bed and table, but not the kitchen counters.
>
> The duck against the wall is me, and it shows how walls become transparent when i touch them EVEN THOUGH nothing can hide behind them... Only walls that a player is hidden behind should become transparent to show their location, not every wall.
>
> 11/11: The bottom right perspective as seen from the camera shows a mix match of disorder in overlay or layers. The front end of a TJ Jeep wranger gets a slight bit narrower AS those small small overhang cover the wheels slightly, but they arent so wide and they dont come out further then the total width of the vehicle as seen here... The vehicles width should be mostly consistent to the front and back at the wheels and their slight small small overhang WHILE the front hood that houses the engine narrows only a little towards the front for a jeep wrangler tj. Lots of layering issues of objects though like i said and the vehicle has a random bar going over the side of the wheel when the image examples im sending and my friend's tj jeep wrangler doesnt have that.
>
> The Lights throughout the building seem scattered, and I dont like that. The stage completely ignored my request. I want the stage coming against one of the right walls and to have the stair parallel and up against that wall, so a rail isnt needed. I want the stage to have the mic to it's left end. The mic is only overlapped if a duck is in front of it. There is a fourth image that is a good instruction to what i want for the stage.
>
> The large piano on the ground before the piano should be removed, and only the actual piano should remain below the one on the ground that will be removed.
>
> The room should have the objects in other places more organized and the chalk board should have an eraser that can be clicked to erase only small parts AND the white X beside the chalk board will erase the whole board when used, replacing the old function of the eraser.
>
> Items inside the building should be in places that make more sense.
>
> The beach ball should be in the pool and only stay in the pool and cannot get out of it. If the beach ball hits the right wall or left wall of the swimming pool then it makes a pinging sound and becomes a glow of either dark blue on wall side and bright pink on the other.
>
> There should be a transformer outside that can be clicked enter on to cut power to ALL the lights in the map, and everything becomes very dark, but it can be turned back on in ten seconds with a cooldown that shows on the transformer. The transformer has the sound of a transformer turning off and it's switch being flipped down, and all the electric going off has a sound too that everyone can hear. The map should be a map separate from the game mode, but selecting either the map or the game mode ONLY shows the other as the only option and auto selects the other.  The trampoline has to not add to jump counter to prevent jump counter farming that isnt earned.
>
> Their should be a TV in front of the couches that can be changed, each channel having a different visual. One channel is TV static, another is the Night Show map, another is the fractal map, another is the starry night map, and another is the ether's crossroads map, and another is a duck in a bubble bath, and another is a pixel picture of a kitten. The videos or anything like that should be made to be compressed or any other method to make the map run better. Some lights outside flicker sometimes randomly, and some itty bitty lights on the porch that hang off of it will flicker sometimes too. There should be more decorations WITH good perspective. Doors are needed, and the front door near the jeep should be able to be seen from the inside and a top down perspective of the door needs to be seen for bother entrance and exit doors of the cabin for when players are on the other side of the door, AND it needs to be perspective consistent, as in, the top down perspective has a small difference from the wall line to indicate simple door, but the bottom side of the front door or the porch door still needs to have that perspective that the door at the porch has from the deck view WHEN below the door.
>
> The windows in the cabin on the north wall from the inside show the night sky instead of the grass of the ground.
>
> The chimney when your inside is right up against the wall, BUT when you go outside the front door where you can see the chimney come out of the roof, it is now further back, away from the wall it came from, this disobeys it's coordinates and must become consistent with it's origin from it's exit in coordinate.
>
> The floorboards are boring and need to look better.
>
> When the lights go off from the transformer, the candle lights, natural lantern lights, or fireplace are still on, but clicking E on this turns them off with a sound effect in proportion to its object. (E is for minor interaction, which will now be the button you click to interact with everything on this map, from the piano, book, transformer, taking a seat, and so on, BUT mobile can still use their turn or vote button UNLESS they enable the click to interact button in their control settings menu.
>
> The grass can look better and we can add occasional night bugs (the ones that glow in the dark or create light, fireflies maybe?)
>
> There can also be four cat NPCs, one named Bubbles, another named Annabelle, another named Opal, and another named Oreo. I'll send pictures of those cats if I can. They will wonder inside the house, but sometimes Annebelle will go outside the front door and wonder around the front before going back inside.
>
> Annabelle is friendly and will approach some ducks, and they will have an e to interact to pet them, which makes them purr. They meow also.
>
> Bubbles will be an orange and white cat, and he is shy and will choose one player randomly to bond with, and he will only be pet a little by the random player he chose to like before he walks away from them or gets scared by another player fast approaching. Slowly approaching bubbles can stop him from running away or have a 25% he stops moving. 50% chance that if players pet bubbles (even if bubbles likes the player) he runs away. Oreo will sprint sometimes randomly around and then sometimes meow before a swipe effect is seen on screen and a player gets a dead effect. Oreo will attack other cats too but never Annabelle, and if Annabelle sees Oreo attacking any other cat close enough then Annabelle will swipe at Oreo and give them dead effect. Bubbles never attacks but will attack Oreo if they get to close or try to swipe at them. Opal hides and runs away from everyone but Bubbles, and they like to follow bubbles when no one is close near by. Oreo is nicer to Opal. No one can give dead effect to the cats and trying to doesnt work. Commands cannot be used on cats. The cats are much smaller then the ducks. Oreo and Opal are smallest and of similar size, Bubbles and Annabelle are only slightly bigger. Annebelle sometimes sits on the couch or jumps onto tables, and so does Oreo.
>
> Outside, there is a shadow duck that is all black and hides in the dark or in the outskirt of the map, they randomly fade away and in again, stalking the players furthest out and away from the cabin.
>
> Outside there is a duck named Justin, and he wears Blue Jeans and glasses as a yellow duck, and he can be clicked with E to say random things, here are the things he can say:
>
> Shut up.
>
> Shut up!
>
> SHUT UP!
>
> Shut up, you stupid IDIOT!
>
> GOD, you're so STUPID!
>
> I don't care...
>
> I'M TURNING OFF MY XBOX!
>
> NOOOOOOOO!
>
> I DON'T GIVE A FLIP!
>
> I DON'T GIVE A HECK!
>
> YOU'RE SO STUPID!
>
> WHY DOES NOBODY CARE ABOUT DATA BREACHING!?
>
> I'm an engineer.
>
> I am a civil engineer.
>
> I am... wait for it, a civil engineer.
>
> I could buy your whole family.
>
> I love talking about data breaching.
>
> I hate EVERYTHING!
>
> Why should I care? I'm a civil engineer.
>
> You're just WRONG!
>
> You can think that--but you're still WRONG!
>
> You're such a stupid flipping IDIOT!
>
> What the FLIP!
>
> I am done.
>
> I can't do this anymore.
>
> Why am I here?
>
> I hate it here.
>
> God, you are so flipping stupid.
>
> Do you hear yourself talking right now? Why would you say that?
>
> You're so annoying.
>
> Stop being SO ANNOYING!
>
> Keep telling yourself that.
>
> Why are you telling me this? I am literally an ENGINEER!
>
> E N G I N E E R
>
> I am so rich.
>
> I love money.
>
> I love food.
>
> I don't talk to women.
>
> I am scared of women.
>
> Help me talk to women.
>
> I don't understand women.
>
> Why would I talk to a woman?
>
> I am still not plat in Siege! How!?
>
> WHY AM I NOT PLAT!?
>
> HOW AM I ONLY GOLD!
>
> Yes I am okay, no I am not angry. CAN YOU STOP ASKING ME THAT!
>
> Why did you ask me that?
>
> What is wrong with you?
>
> What is your opinion on data breaching?
>
> Let me explain to you why you are WRONG!
>
> I--don't--give--a--FLIIIIIP!
>
> ...
>
> I am going to bed.
>
> No.
>
> Just no.
>
> Get some help.
>
> I love motorcycles.
>
> I might be a little autistic.
>
> I accepted I am going to be alone in life.
>
> You're heckin' stupid.
>
> Yes, I know.
>
> Let me explain to you why you are wrong.
>
> You guys are being so stupid.
>
> You still don't understand why I am right.
>
> This is getting ridiculous, let me explain to you.
>
> I make more money than your whole family combined.
>
> Cheez-itz and rice.
>
> Play Realm of the Mad God with me.
>
> Play Siege with me.
>
> I love Echo drones.
>
> I hate flock cameras.
>
> The guy who made this game is so funny, smart, and good looking.
>
> I wish I had more to show besides money and three mansions.
>
> Why am I so funny?
>
> I am so unbelievably BASED!
>
> I couldn't care less.
>
> I am going to rotate.
>
> I'm LITERALLY A CIVIL ENGINEER!
>
> This bit isn't funny, just stop.
>
> ?
>
>
>
>
>
> Okay those are all his lines, and he is on the porch outside and his avatar will randomly eat a hotdog sometimes. ALSO, all his lines will go in random order and will only play once until all of them are played, like a randomized playlist, and at the end of each playlist, they play again. He can wonder around anywhere in the map but eventually comes back to the porch without getting stuck on anything. He also sometimes watches TV while sitting on the couch.
>
> The TV channels can be changed by click e to interact on the TV.
>
> The TV is a small box television like a lot of ppl had in the 90s or 2000s still.
>
> Sometimes the duck named Justin wonders to the red jeep and hangs around it. Justin sometimes tries to shoot his gun at a player randomly to kill them after four seconds of them clicking e to interact with him. Sometimes Justin will randomly say one of his words randomly without actually it effecting the playlist of words, and his random qoutes by himself apart from interaction are always random and not in a playlist, and smetimes when he says one of the shut up variations on his own, he will repeat it multiple times over and over before trying to kill everyone near him with a gun while chasing them until they are dead, and this event will have him saying shut up in all caps and an exclamation until a player is dead.
>
> We can also input an audio for Justin's voice but I haven't sent the audio of me for the voice acting yet.
>
> If you kill Justin, he will say one of these things
>
> WHAT THE FLIP!
>
> What the FLIIIIIP!
>
> STOP!
>
> WHAT!?
>
> NOOOOO!!!
>
> STOP! IT'S NOT FUNNY!!!
>
> STOP! IT'S NOT FUNNY!!! IT'S JUST NOT!
>
> WHYYYY!!?!?!?!
>
> STOOOOOOP!!!!!
>
> I am turning off my Xbox...
>
> I'M TURNING OFF MY XBOX!!!!
>
> This is so STUPID!
>
> You are such a stupid IDIOT!
>
> There is a 50% chance Justin will get up and chase you to shoot you if you knock him down.
>
> Justin sprints when he chases after players while he shoots at them when he is targeting them.
>
> There is a chance Justin randomly dies sometimes and then will remain dead until someone revives them, then he will say,
>
> I drank too much, but I swear it isn't a problem.
>
> When he says that, he will drink a glass of an unknown clear liquid.
>
> Justin randomly eats hotdogs.
>
> Justin never goes into the pool, if he gets too close to the pool he will say:
>
> Why would I go to the pool?! IT'S JUST WATER! I don't care!
>
> After he says that, he will walk away from the pool, and he says it when he is near it.
>
> Justin will sometimes chase the shadow duck if he is close enough and sees him, but will never kill the shadow duck, and the shadow duck will chase him and Justin dies when he is touched, and the shadow duck fades away again. Justin needs revived when he is killed by the shadow duck. When he is revived with an e to interact from dying from the shadow duck, he says these, and when he says them, it will be chat messages a few seconds apart and it will not be able to be interupted with an e to interact to make him talk until he is done saying these things with a 5 second grace period that follows after the last message until you can interact with him to make him talk like usual. THis is what he will say when revived from being killed from the shadow duck,
>
> I literally got killed by a black duck!
>
> WAIT!
>
> HE WAS LITERALLY BLACK!
>
> NOT RACIALLY OF COURSE!
>
> Justin will type in chat with all his messages that show in his chat bubble that all of his words will be seen in, and his character's font is comic sans.
>
> The cats can have their meows seen in text chat and chat bubbles too.
>
> The raw message here can be sent to Solomon and the different plans made by Adam. We can discuss making a new worker too.

Decision: Adam's plan, "Hangout fix-up plans" (https://claude.ai/artifact/MNESfvTTB9pEgVxjEybW8g), the owner's go
("Solomon can start when he wants"). Goal 1 (perspective fixes, art only) first, then goal 2 (stage, layout, lights,
walls, chalk, chimney, windows, floor), goal 3a (E to interact, doors, map and mode pairing, chairs), goal 3b (TV,
transformer, beach ball, flicker, decorations); goal 4 (cats, Justin, shadow duck, fireflies) by Noah. On Duck Cabin E
is interact and R repeats the last special; hits use the existing plays-dead look.
Goal 1, done: fridge handle off its top and onto its bottom door; kettle on a burner; upper cabinets shallower and
raised over the counters; fruit in the bowl; counters without side overhangs; chair backs trimmed; couch bases run
across the corners; the music sheet column removed (the keyboard mode's own sheet stays); the stage stairs' rail
removed; one tub seen from above, its duck facing left; the toilet redrawn against the bathroom's east wall facing the
room; a low headboard; the jeep without the bar over its wheels, its wheels and flares inside its width. The rug stays.
## Menu music, the music bar everywhere, a pause menu in the lobby, word for word (2026-10-26)

Miles Jr needs to have music also be able to play on the main menu and the room section menu just for that player alone, and it randomly plays the happier songs (happy doesnt only mean major) without any 20 second timer between songs, and the song names show up in the little meter too

That song meter should also show in the lobby AND the pause menu needs to be in the lobby IF we can have someone offload the pause in main menu task either for someone free later OR we can have Miles Jr do it becuz why not

the song bare is also everywhere else in the game is my point

Decision: the main menu and Rooms play music for that player alone, picked at random from the happier songs (Spring in a
Box, Ducklings in a Row, Bouncy Chicks, Waddle before you paddle, Outer Space Swim Commute, Bubble Bath in the Sky,
Pond-erful Ruffles, Infinite Pond, Glow), back to back with no gap. The music bar shows there too, top right, left of
Sign in (on a phone's Rooms the word "Rooms" hides so it fits); the lobby and the game already had it. Entering a room
fades the menu song out and the room's synced song in. The lobby gets a pause menu (Esc or the ☰ button): Resume,
Customize, Settings, Friends, Leave room. A pause menu on the main menu is left for later.

## Menu music only after Play, and a tap-to-start screen, word for word (2026-10-26)

> miles is such a fucking idiot they had such a simple fucking job. So, the music DOESNT play on the menu of the index page UNLESS you click play! HOW THE FUCK DID THEY FUCK THAT UP !

> The click to start should just be a duck on a cloud with the words in the multicolored look on letter blocks below the cloud, and clicking the screen makes the duck fall through the cloud with a falling sound effect that makes the screen go transparent until it fades, revealing the screen

Decision: browsers hold all sound until the page is first used, so the page now opens on a start screen: your duck on a
cloud, "TAP TO START" in the multicolored letters on wooden letter blocks. A tap, a click or a key anywhere drops the duck
through the cloud with a soft puff and a falling slide whistle; the screen turns see-through and fades, showing the
front page, and the menu music starts on that same tap. The music also wakes on any later tap, mouse button or key
(a finger's tap only counts once it lifts), starts by itself in a browser that allows it, and until it can, the music
bar shows "tap anywhere" before the song's name. The first menu song waits at its start until it can be heard.

## Request (2026-10-26 05:38Z): the toilet
"The toilet is not good enough, it looks awful" / "Like its noy even a toilet" / "Thats what i mean, its not even in the
correct structure of a toilet"

Decision: redrawn as a classic toilet seen from the front (tank on the wall with a flush handle, the lid up against it,
the round seat with water, the bowl down to its foot), moved to the bathroom's north wall between the tub and the sink
so it faces the room. Rides along with goal 2 (PR #99).

## Request (2026-10-26 05:53Z): doors, log ends, couches, TV (two pictures: a screenshot with the log ends circled, a sketch)
"I circled some of th3se, but these are NOT supposed to be there whenever a door is in between, check your work because
those are door level and thus covered by doors, so there is no reason or way they would be showing from above like that,
because it doesnt come out from the top like that, fix ever instance of that in the first screenshot i refer to.

You can barely even see the doors inside either. Also i cant see the door but instead of screenshotting it, compare it to
yhe standard of yhe door as seen from outside on the balcony, and see if it matches up in art.

The sofas need a little distance from eachother and a coffee table on the rug in front of them. The TV needs to face
them diagonally if they are arranged like that also. The sofa face the wall should be one cushion shorter, so it becomes
a two seater. The sofas and it's rugs need to be somewhere away from the stage because the TV cant go in fron of yhe
stage.

The sofas can go in the bottom right of the room IF there is room for the door to the balcony.

I send something in image 2 about the new plan for the couches, tv location, new coffee table, new end table, and where
they all go together and how. Make sure to ask adam ab certain things"

Sketch text: "The couches and the rug (represented by the red circle) should go to the bottom right here. The TVs location
is roughly speaking and the Coffee table can experiment with different orientations. We need suggestions about how to
fill up all the dead space of the room." Labels: "TV Here.", "Coffee table (Can be shaped differently, it should have
papers and drinks on it)", "End table."

Decisions (Adam): the couch seen from the back becomes the south couch, a 2-seater; the east couch faces west, 3 seats if
it fits; a duck's width between them at the corner for the end table. TV on a low stand on the floor, turned 45° to face
the L. Dead space: bookshelf and armchair by the fireplace; a sittable card table with 2 chairs in the middle; coat rack,
boots and welcome mat by the front door; two potted plants; a wall clock and two small pictures on the north wall.
No log-end rings at interior doorways; inside doors drawn to match the deck door.

## Request (2026-10-26 05:58Z): the toilet's shape (four reference pictures)
"The bottom of your toilet has a weird shape, just below the bowl in the neck of it that goes into the ground, look at
these pictures for reference. Also, your back of the toilet goes way up high AND extends far below down past it's
back...look at these pictures to see what i mean, esp the last one which you should nodel after."

Decision: redrawn after the last picture (a plain line drawing): a shorter tank with a lid band, a button and a lever,
right behind a closed round seat; a round bowl; a short foot widening to the floor.

## Request (2026-10-26 06:09Z–06:11Z): the inside doors (a screenshot of the live great-room door, open)
"THIS DOOR OPENING LIKE THIS IN THE LIVE VERSION I FOUND IS COMPLETELY UNACCEPTABLE"
"THAT DOOR IN THE SCREENSHOT LOOKS LIKE AN ABSOLUTELY TERRIBLE AND INNACURATE SIDEWAYS DOOR! MANE IT ONE DOOR ONLY NOT
TWO AND BORROW FROM THE ONE OUTSIDE FROM THE PORCH FOR INSPIRATION OR COPY" / "Make* not mane / Typo on my end"

Decision: the great room's double door to the hall is one door (y 1275–1425). Every inside door copies the porch's door
(orange frame, dark door, lit four-pane window, low panel, brass knob); shut, seen a little from its side; open, swung
60° into the room like the porch door hanging open, not a flat face lying across the room.

## Request (2026-10-26, live bugs from the phone, Chrome on Android)
> Glitches when i walk around the trampoline on mobile that distorts it

> IT SHOWS IM IN THE WATER BUT IM CLEARLY NOT! THIS IS AN OBVIOUS LAYERING ISSUE!

> This light next to the pool doesnt look like it is centered on the light, maybe im just crazy

> WHAT KIND OF LAZY BULLSHIT IS THIS!? WHY IS IT HANGING OVER THE WALL LIKE THIS?! LOOK AT THE CIRCLE I DREW OVER IT

Decisions:
- Trampoline: black noisy blocks over it on a phone. It was the only moving piece without a layer of its own (Chrome made
  one for it only because it overlapped others). It, the beach ball, the rubber ducks and the mat's dip now have their own
  layer, like every other prop.
- Pool: the water's near strip (40 deep, as deep as the water is under the ground) is hidden under the near coping on the
  screen, but a duck could swim into it and showed over the coping. Swimmers, the rubber ducks and the beach ball now stay
  north of it; a duck dropping in from the south side stays at the coping's edge on the screen as it drops.
- Lamp posts: their glow was on the ground in front of the post's foot, well under the lantern. It is now centered on the
  lantern (160 over the ground).
- Walls: a north-south wall that starts at an east-west wall (the bathroom | bedroom wall, the hall walls, the corners)
  drew its top up past the other wall's top. It now starts at that top's front edge, so the east-west wall runs on over
  the corner.

## Request (2026-10-26 06:35Z): Justin and the shadow duck fixes (a phone screenshot)

> Justin's font isn't comic sans AT ALL!
>
> Justin and the shadow duck shouldn't fight ! NOT UNLESS THEY MEET EACHOTHER VERY CLOSELY!
>
> When justin shoots at a player, they dont run up to touch them, instead, they keep emough distance to use their gun.
>
> When a player is shot by Justin, they cannot move for six seconds.
>
> When justin is talking after being revived from a fight with the shadow duck, he must have a lot more time for his chat bubbles to stay before they go
>
> Justin got chased by the shadow duck when he was only on the porch and the duck stopped when he could sit dowb... wtf?
>
> Make it to where the shadow duck cant go into any place where there is light AND make the shadow duck slightly transparent.
>
> The shadow duck should avoid the campfire always unless it's fire is put out.
>
> The shadow duck never chases people if they run away.
>
> Justin chases the shadow duck very very rarely only when close enough to them and he has to find them by accident.

Decisions:
- Font: phones have no Comic Sans, so Comic Neue (a free look-alike, assets/fonts) comes with the game; computers with
  Comic Sans still use it.
- They only tangle when they meet within about 170 px, both in the dark. Then the shadow duck lunges at him, or (12%) he
  spots it by accident and chases it, and it fades before he gets close.
- Justin with his gun stops where it reaches (about 300 px off) and shoots from there. A duck he shoots can't move or
  jump for 6 seconds.
- His four lines after the shadow duck: 5 seconds apart, each bubble up 7 seconds.
- The shadow duck never goes into the cabin, onto the deck, or into the light of a lamppost, a window or the campfire
  (its paths are blocked there; a put-out fire would be s.hang.fire === 0, there's no way to put it out yet). It's a
  little see-through (78% at most). A duck that runs away from it isn't followed: it fades away.

## Request (2026-10-26 06:52Z)
> WHO THE FUCK WOULD EVER GIVE U A PASS ON THOSE DOORS!?! THOSE DOORS ARENT EVEN FUCKING STANDING! YK WAT JUST REMOVE THE DOORS INSIDE ITS NOT EVEN WORTH IT BECAUSE U CANT EVEN! ONLY LEAVE THE DOOR TO THE FRONT ENTRANC3 AND TO THE BALCONY!
>
> Also, justin should have his thing say his name under his duck like he is another player.
>
> I have a screenshot, u are missing a wall here it looks like in the corner AND the end table has a little cabinet drawer that shouldnt be showing because i dont want it there. The reason i dont want it there, if ur wondering, is because it is on the wrong side, which means its out of view and u dont have to worry about adding it somewhere, we can just remove that one little cabinet fron the end table.
> I put a highlighter around the very small part for u to remove

Decisions:
- Every inside door is gone (layout.js OPENINGS: open gaps). Only the front door and the back door to the deck stay.
- Justin's name shows under him in a pill like a player's; while he sits on a couch it goes over his head, as a seated
  player's does.
- The missing wall: a north-south wall's south end over the south wall's low line (and at an open doorway) showed only its
  top, so it looked cut short. Its end now shows down to the floor, as a plain log face (no rings).
- The end table's drawer is gone.

## Request (2026-10-26 14:31Z)
> Wat is this supposed to be?? Remove that texture from the end of the wall and others like that becuase the logs wouldn't stand upwards there!
>
> Keep the wall there in the sqme texture aa everything.

Decision: a north-south wall's end at a doorway or over the south wall's low line is now the wall's own wood (the cut
top's color and stripe) running on down to the floor, with no log texture.

## Request (2026-10-26 14:33Z)
> WHY is the player names UI spaced differently and look differently!?!? STOP RECREATING THE WHEEL AND USE THE CODE ALREADY MADE TO MAKE THE PLAYER NAME UI THE SAME BELOW THE DUCKS

Decision: Justin's name is now the players' own name element (game.js' .gduck-name with name.js' nameHTML, same font,
size and pill), placed under his drawing exactly as a player's is (measured: same font, same gap on phone and computer).
It looks like any other player's name; your own has the blue ring because it's yours.

## Request (2026-10-26 14:35Z)
> Simone check that mobile vers of fonts are close enough to their missing counter parts they mimick from pc, because someone tried to mimick comic sans with fucking cursive at one point some fucking how!

Decisions: every font a phone lacks now has a close stand-in on the site (assets/fonts): Courier New → Courier Prime,
Times New Roman → Tinos, Georgia → Gelasio, Comic Sans → Comic Neue. No stack ends in `cursive` any more where the font
isn't a script (Comic Sans, Permanent Marker, Justin's words end in sans-serif). The site's own fonts (Grenze Gotisch for
Old English, Cascadia, Bangers, Pacifico …) already load on every device.

## Request (2026-10-26 14:51Z, about Justin's lines after the shadow duck: 5 seconds apart, each bubble up 7 seconds)
> THIS SOUNDS LIKE A MADE GLITCH! THE FUCKING UI COULD OVERLAP! ALSO 7 SECONDS IS WAY TOO LONG!
> WHY CANT THE NUMBERS BE THE SAME?

Decision: one number, 4 seconds: each line shows 4 seconds and the next comes 4 seconds after it, so one bubble is gone
as the next shows (justin.js LINE).

Follow-up (2026-10-26 ~15:05Z, a phone check of every wall end and of Justin seated, after the owner's "check what else
a change touches"): the cabin's two outside corners on the south side still showed log-end rings (the corner's low line
starts exactly at the wall, so it wasn't seen as "over the low line"); they're now the wall's own wood like the rest.
Seated, Justin's name sat too high; it now sits over his head where a seated player's does (the top of the duck's square,
not the hat room above it). The extra dimming of his name while he's down is gone (players' names don't dim).

## Request (2026-10-26 15:17Z): Duck Cabin visual fixes, 16 phone screenshots (numbered 1-17, no 16)
> 1/17: In screenshot 1/17 of what i sent, the door knob needs to be a little more alligned to the right so it isn't on the window.
>
> 2/17 There is a visual glitch visual from the balcony on mobile (where these screenshots are from).
>
> 3-7/17 In 3 to 7 of 7 screenshots, THERE IS NO DOOR OR EVEN LACK OF A DOOR! THERE IS A FUCKING WALL IN PLACE OF THE DOOR! I TOLD SOLOMON TO REMOVE THE DOORS AND HAVE OPEN PARTS OF WALLS THAT ARE EASY TO SEE AND HE FUCKING PUT WALLS WHERE THE FUCKING DOORWAYS PLAYERS WALK THROUGH ARE! The doorways shouldnt hide the player when they walk through them behind the lower wall because even tho that perspective makes since, it makes the visible opening of the doorway small and betrays a lot of common patterns in top down camera perspectives like this. This isn't speaking for walls this is speakingn for doorsways, like in screenshot 7, the long wall below being transparent is fine, but the doorway is extremely small AND puts you at the very bottom of the hallway to open it INSTEAD of the doorway being symmetrically availible through the center
>
> 8/17 THE DOOR ISN'T THE SAME SIZE OR ANYTHING AS THE OTHER DOOR AT ALL !
>
> iT SHOULD BE THE SIZE WITH A DOORWAY OR DOORFRAM SHAPE AND SIZE JUST LIKE THE FUCKING FRONT BALCONY DOOR BECAUSE THIS IS STUPID INCONSISTEN!
>
> 9/17 WTF IS THAT YELLOW LINE ON BOTH SIDES OF THE PIANO BELOW THE CANDLES?! REMOVE IT
>
> 10/17 HOW MANY DIFFERENT WAYS DID I SAY TO NOT LAZILY OVERLAP OBJECTS LIKE THIS!? IF OBJECTS MAKE UP A LARGER OBJECTS, THEN THEIR FUCKING DETAILS GET CREATED FOR THEIR CONTEXT LAST ! THE FUCKING LIGHT DO NOT CONINTUE UNDER THE FUCKING STAIRS! THEY BETTER END BEFORE THEY GET UNDER THE STAIRS IN A NATURAL WAY
>
> THE FUCKING BOOKS ARE NO CLIPPING FROM THE INSIDE RIGHT OF THE SHELF TO OVERLAP THE FUCKING SHELF!
>
> 12/17 This one isn't that bad, but, the bottom of  the stairs from the balcony should have little sqaure accents that indicate the stairs are being supported at their ends, further more, if we can very very naturally have the stairs get colored a slightly differe tone or color when it gets far away enough from the light to indicate it is getting darker on the way down the stairs, that would be nice, i think the stairs just need to be darker on the way down only slightly thouhg, please dont overdo.
>
> 13-14/17 WHY DO WE KEEP MAKING THE SAME MISTAKE WITH THE BOTTOM RIGHT TIRE!? DO WE NOT REMEMBER THE EXAMPLE I GAVE!? The tire on the back isnt round, which might be okay.. probably not, but, there are gaps in it's form because the cause didnt understand that adding cornering to sqaures in a box doesnt make the box shape itself the round form of a wheel. The headlights on the jeep wrangler here have a different size on on in compared to the other that is really bad, they can be the slightest different in size maybe, just make the larger lighter much closer to size as the smaller one in width on the front, while still keeping it bigger and of the same height on the front.
>
> 15/17 We can move the faucet down to the center left top of the tub, which means that it vertically moves down a few notches is all.
>
> 17/17 The tv has an invisible wall at the corners that must be removed because the ducks should be able to be in front of the TV or behind it. ALSO DID WE REALLY JUST IGNORE MY ENTIRE IDEA ABOUT THERE BEING THINGS THAT PLAY ON THAT TV? I WANTED IT TO BE CLICK TO INNTERACT TO CHANGE CHANNELS!

## 2026-10-26 15:27Z: piano rows (second part of a message with the mobile specials button)
> FOR THE PIANO, the notes are now this for each row
>
> Low octive: 1234567890-=
> Second lowest octive: qwertyuiop[]
> Second highest octive: asdfghjkl;' (enter button)
> Highest octive: (shift button) zxcvbnm,./ (space bar button)

Decision: each row is one chromatic octave (12 keys from C), so black keys have their own keys; ShiftLeft is the first note
of the top row and Space the last; the old Shift/C sharp and Space/Alt flat modifiers are gone; notes spelled with sharps;
all 48 keys (Enter, Shift, Space too; the numpad's Enter as well) are kept from the game and the browser while the keyboard is open.

## 2026-10-26 15:37Z: cowboy hat
> Someone can add a cowboy hat to the game hats

Decision: a recolorable Cowboy hat (hat and band colors) in the "Hair, hats and caps" group, in the same outlined style as the sombrero and bucket hat.

## Request (2026-10-26 15:27Z): a Specials button for phones (the piano part went to another thread)

> The bottom right of a mobile players screen should have a button they click to bring up a vertical column of all their specials they have selected, and they can use them from there, and holding down a special gives the box option to click "Toggle on", which works how it would for PC when you toggle it on obv, same feature, just a UI solution for mobile players.

Decisions:
- A round Specials button (the Notes/chat button's style) in the bottom bar's right corner, only where the row of keys
  is hidden (no mouse or touchpad, or a window under 760 px). Computers see no change.
- Tapping it opens a column of your chosen specials over it, the same buttons as the finger-held ring (icons, key
  numbers, cooldown bars, green when kept on); it stays open until the button is tapped again or anywhere else is. On a
  short screen (a phone on its side) it goes into a second column instead of over the top bar.
- A tap uses a special; holding one half a second shows a "Toggle on" box beside it ("Toggle off" when it's on), which
  keeps it on like Shift and its key. The finger-held ring still works.
- A handgun or dagger kept out (Toggle on) fires toward where you tap the board, the way a click does; nothing new was
  built for it.

## Request (2026-10-26 15:47Z): the Sound special, faded for now

> there can be a small easy step where we make the sound option faded out and unable to be selected until i get around to how i want that to work

Decisions:
- Sound (🔊) is faded in Customize → Specials and can't be put on a key (tap, click or keyboard); no new words.
- A duck that already has it keeps it on its key, but the key, the hotbar, the ring and the phone column show it faded,
  and it does nothing. Computer players never pick it.

## Request (2026-10-26 15:50Z): the Specials button's icon

> The special button should have the symbol of any special the player has just taking turns appearing, and if they have no specials selected, it takes turns through all the specials. If a player doesn't have specials equiped, then clicking it will tell them that specials are chosen in the customization menu.

Decisions:
- The button shows your specials' icons in turn, one every 1.5 s with a short cross-fade (no fade with reduced motion);
  with none chosen it goes through all the specials. The faded Sound is left out of both. The button's size never changes.
- With none chosen, a tap shows the tip "Pick your specials in Customize → Specials."

## 2026-10-26 (Hangout goal 3b, from the owner's fix-up request above): the beach ball's walls, flickering lights
> "The beach ball should be in the pool and only stay in the pool and cannot get out of it. If the beach ball hits the right wall or left wall of the swimming pool then it makes a pinging sound and becomes a glow of either dark blue on wall side and bright pink on the other." / "Some lights outside flicker sometimes randomly, and some itty bitty lights on the porch that hang off of it will flicker sometimes too."

Decision (Adam): the ball's walls are the pool's edges (it never leaves); the west wall rings a low ping and glows dark blue, the east wall a high ping and glows pink, fading in about a second, seen and heard by everyone (the hit is counted in the ball's own state). Every 20 to 60 seconds, one of the six lampposts or the porch's string lights stutters (2 to 4 quick dips in half a second), the same moment for everyone.

## 2026-10-26: the phone interact button on Duck Cabin (from Adam, owner in class)
Asked: on phones only, the context button (Sit, Play, Read, Next channel) is its own button where the Vote button sits, shown only when something is in reach; with a Vote button showing it moves right above it with a clear gap; it never covers Vote, Specials, the controls hint, the music bar or Jumps. Computers don't change.
Decision: the button already sits in the bar's Vote place and shows only in reach, so no new button or style. Hangout never shows a Vote button (it has no votes), so the stacking rule (`.act-row:has(.hang-btn)` first) is only a guard. Fixed the real collision: on a phone on its side the tip toast sat over the button; toasts now rise above the bar (and above the stack if both buttons show).

## 2026-10-26: no key hints in buttons on phones (from Adam)
Asked: on a phone with no keyboard, hide the key hints inside buttons (the "E" on Sit, the "Enter" on Vote), the way the hotbar hides on touch-only devices; computers and phones with a keyboard keep them.
Decision: one CSS rule next to the hotbar's, with the same test (`any-pointer: fine`, and the `keyboard` class once a key or mouse is used).

## 2026-10-26: the power box, the blackout, the darker outside (from Adam's plan "Duck Cabin: blackjack, darkness and power", owner in class)
Asked: outside by the cabin's side wall, a power box on a post with a big red lever and a small humming transformer. E pulls the lever: every electric light goes out (lamps, windows, string lights, porch lights, lamp posts, pool lights, stage lights, the TV); it can go back on after 10 seconds, a ring on the box counting down. Natural light stays (the campfire, the fireplace, candles, lanterns, fireflies), and E puts out each candle, lantern or fire with its own sound. Outside gets much darker wherever no light reaches; the campfire, the pool, around the jeep, the deck and the lamp posts' pools stay lit, and in a blackout only natural light counts, so the pool and the deck go dark too. After 7 seconds in the dark, my own music muffles until I'm back in the light or inside.
Decision: the box stands by the west wall (it's dark there); "Cut power" / "Power on" (no button while the ring counts down). The darkness is one soft layer over the world with the lights cut out of it (ducks in the dark are dimmer too); a blackout also dims the inside, but for the fireplace, the piano's candles and the kitchen lantern. E puts out (and lights again) the campfire, the hearth fire, the mantel candles, the piano candles, the kitchen table's lantern and the deck table's lantern; putting out the campfire also lets the shadow duck closer, as the blackout does with the lampposts.

## 2026-10-27: comments in the code speak as the owner
> any notes in files should have me referred to as owner, have notes be spoken in first person as if we are all me
>
> inside the code i mean

> Yes, the notes within the code i mean, not any claude note for claude or ill fucking kill you

Decision: only the comments inside the code speak as the owner, in first person ("I want", "we decided"), and say "owner" where a name is needed: never "the user", the owner's display name or a helper's name. CLAUDE.md, notes/ and memory are notes for Claude and keep their usual voice, as do word-for-word quotes, text players see and code names. Changed: the comments in js/hangout/justin.js, js/hangout/layout.js and js/online.js. (A first pass also rewrote CLAUDE.md, notes/ and the log; it was put back.) The rule is one line in CLAUDE.md, under "The owner's rules".

the muscle shirt shouldnt cover the duck's wing (owner, Grunt thread; screenshot /mnt/project-files/grunt/owner-muscle-shirt-wing.png)

## 2026-10-27: holding Tab stops the mouse
> "My guess is that while Tab is held, your duck shouldn’t walk toward the mouse." Yeah we can do that AND ALSO the problem is that in default controls, when i hold down tab, i cant move my mouse properly to the player screen, like it stops moving or only moves a little before stopping while i hold down tab, which is kinda broken.

Decision: the code never re-renders the Tab menu on key repeat (it ignores e.repeat) and nothing blocks the pointer, so the stopped mouse is most likely the laptop touchpad switching itself off while a key is held (Windows does this). So a quick tap of Tab (under 350 ms) now keeps the menu up until Tab again or Esc; a long hold works as before (gone on release). While Tab is held, a click on the board no longer walks the duck. Tested in Chromium and Firefox on a computer. Hint in the menu reads "Hold Tab or tap it once, or tap 👥."

(Follow-up to the Tab fix: Alt+Tab's Tab keydown is ignored, and the held menu closes when the window loses focus, since the keyup never arrives then. A tapped, kept-open menu survives a blur. Tested in Chromium and Firefox.)

Decision: every note and comment that talks about the owner or speaks for the team now speaks as me, the owner, in first person ("I want", "we decided", "my rules"); where a name is needed it is "owner". Never "the user", my display name or a helper's name. Untouched: word-for-word quotes (this log, Justin's lines), text players see, and code names (shell.js `owner(path)` is a file's owner; "its owner's style" in card.js and name.js is the player's). Comments that speak about no one stay as they are. The rule is one line in CLAUDE.md, under "My rules".

## Request (2026-10-27 17:08Z): Justin in every game mode

> make the Justin NPC able to be added to game modes as an option availible to the hose, so like, in would you rather or what not. They basically can only be added as a spectator, like they dont change the votes, BUT they cant look as if they are voting, so for example, in agree or disagree, he always takes the position that is the most opposite of what someone else or the majority takes, so he will either strongly disagree when players agree, or strongly agree with a statement all players disagree with. He isnt voting, he just walks to the tile that shows his oppinion. The same goes for anything, like brackets, would you rather, lawyering, who's the quack, and so on. His NPC is a joke if you couldn't tell. Anyways, he can be enabled in additional settings. He still randomly shoots other players and will randomly chat in game with his saying already selected like once every 15-30 seconds. There is a bash command to turn justin on and off as well.

## Request (2026-10-27 17:32Z, point 2 of 8; the others went to other threads): the go on Justin in every mode

> 2. Players can shoot Justin back; he can be added as a spectator who walks around and pretends to be a part of the game while not effecting it in every game mode AND he doesn't get a card or the ability to write prompts. Also, the click E to interact with Justin is only an option available in the cabin. (Justin should run around less often in cabin and also sit still when you start talking to him for at least 5 seconds after clicking e to interact.

Decisions:
- Additional settings has a Justin tile (Off by default; not in Hangout, where he already lives), and `sudo forgame justin on | off`
  works mid-game (in `forgame show`, `man forgame` and HelpBash).
- He isn't a player: never in the seats, positions, done counts, votes, results, stats, brackets, Secret Cards, writing
  or the Tab list. No check mark, vote bubble or Lawyering ring.
- Where he walks: Agree or Disagree, the strong end against the room's average (all on Neutral: a strong end at random);
  two sides (Would You Rather, the brackets' matches, the Lawyering jury, Quack's vote or more clues), the side with fewer
  ducks; Quack's accusing, the duck the fewest stand on; Story Chain's votes, the line or word with the fewest ducks. He
  looks every 2 to 3 seconds and walks only when that changes; on a tie he stays. Elsewhere he wanders.
- He says one of his lines every 15 to 30 seconds (each once before any repeats), in the chat and his bubble. With the
  silly commands on, every 45 to 90 seconds he fires the handgun's slow bullet at a random duck (never in Quack's reveal);
  a duck it hits plays dead until it moves.
- Players can shoot him back on the boards: a bullet, a dagger or `kill @Justin` knocks him down with one of his death
  lines, and he gets up by himself after about 5 seconds. E on Justin works only in Duck Cabin.
- Duck Cabin: he waits about twice as long between walks, rants and chases come about half as often, and E on him keeps
  him still for at least 5 seconds (longer while his lines run).

## Request (2026-10-27 20:17Z): jersey name and number visible
"Have someone make the logo of the jersey number and logo in the sport outfits visible, maybe moving them to the front and making them small"
- Decided: on the Lakers #33 and Celtics #33 jerseys the team name now arcs over a small 33 on the chest (right of the
  wing, under the head), so neither covers them, on every body (Rubber builds, metals, Raptor, Pelican, Mallard, Blocks,
  2D shapes). Ducks drawn under 48 px (avatars, chips) leave the name and number out, since they'd only be a smudge.

## Request (2026-10-27 20:34Z to 20:35Z): the outfit fix list
> the leather jacket either needs to be redone or removed
>
> The bottom hang below the outfit for pajamas needs to be removed
>
> The shoes on the disco outfit need to be removed
>
> the back bump behind the bridal outfit in the second screenshot needs removed
>
> The priest outfit based on catholic priests doesnt have the signature priest collar
>
> The back of the box outfit is missing a part
>
> The fourth screenshot shows the suit with a bow and tie, and i really like it, because of how it has the perspective for the tie in the middle done right, where most of it is seen only in half, because it is facing away in perpendicular to the camera perspective. If someone could better word that for me for the plan in how well done the suit and tie is done that would be good.
>
> The little white circle on the outfits that are meant to imply highlight or shine should be removed

> the crown should look more golden and shiny like the golden skin does

> the cheese needs to be improved a little

- Plan (Adam): https://claude.ai/artifact/3YHfbdhJnySZFEFLxKZLSy. The standard, from the suit: the duck is side-on, so
  anything on the chest's centre line (a tie, a zip, buttons, a collar's opening) sits on the body's front edge with only
  its near half showing, curving away with the body; clothes follow the outline, the far side stays hidden; nothing hangs
  outside the outline unless a real garment would show there; no white shine spots on cloth or hats.
- Built in PR #127 (Solomon the 2nd): all nine; sheets in project files outfit-fixes/sheets/.

## Request (2026-10-27 21:00Z and 21:03Z): thinner block lines, and see new items first
> The block style of duck should have very very small lines between the duck, because they are too big.

> i want to see the new items before they are added to the game.

- Decided (Adam, 21:05Z): every new or redrawn item is shown to the owner as a picture, and nothing merges until the
  owner OKs it. In #127: the round white shine dots also come off hats of felt, cloth, straw, paper and cheese (metal,
  glass and glossy plastic keep real reflections); on Blocks, no red block edges past the clothes, and the lines between
  blocks become very thin while the blocks still read as blocks at 26 px.

## Request (2026-10-27 21:07Z): the leather jacket's bottom part
> Make this bottom part be either blue jeans with that belt, or nothing and no belt (like how shirt doesnt have pants on the duck),all of which can be edited in a little option on the selection tile for the leather jacket of either pants or no pants to go with it . I think the cheese might be fine then

- Decided (Solomon the 2nd): the jacket ends at the hip. Under its tile (right below its grid) two small buttons pick
  Jeans (blue jeans, with the belt at the jacket's hem; the default) or No pants (no belt, the duck's own body, as
  under the shirt). Stored as `outfit.pants` ('jeans' / 'none'); outfits can now list such options (`opts`).

## Request (2026-10-27 21:00Z, part): the metals
> The skins should have the metals placed in an order based on how cool the metals are, with rose gold coming just before gold. Gold and rose gold is above chrome obv. Silver i think would be below chrome or above it? Make silver look better, it just looks  like a lesser chrome.

- Decided (Adam): coolest first: Rose gold, Gold, Chrome, Silver, Bronze (the crown's picker follows). Silver becomes a
  real polished silver: softer and a little warmer than chrome, with a satin horizon instead of chrome's black one
  (new METAL values only). Built in PR #127.
## Request (2026-10-27 21:00Z): customization list (pumpkin, antenna eyes, jester, Jack in a Box, metals, blocks, Secret, clown, locks, color dropdowns)
"the pumpkin should look less like oranges clustered together and look more like an actual pumpkin 

The antenna eyes should have their eyes change with whatever eye is used in the eye customization setting

There should be a jester hat that becomes unlocked when a player gets to one thousand jumps. The jester's body becomes unlocked with one thousand jumps too. At ten thousand jumps, a player unlocks the jack in a box, which is not a duck, but a box with the guy on the inside always out, and the jack in the box can only be customized in color or eyes, not in hat or outfit or size or skin or anything like that. The jack in the box cannot close. The jack in the box kinda has the guy from the box bounce a little with every jump, and there is another version of the jack in the box that can be selected in the setting button on his selection in styles that make him a woman named "Jill in a Box" The first picture of the jester is for the outfit and so is the second, as POSSIBLE inspiration. The hat should have four parts at the top not two. 

The skins should have the metals placed in an order based on how cool the metals are, with rose gold coming just before gold. Gold and rose gold is above chrome obv. Silver i think would be below chrome or above it? Make silver look better, it just looks  like a lesser chrome. 

The block style of duck should have very very small lines between the duck, because they are too big. 

There is a secret code box in terminal called "Secret", and typing in certain codes after it allow for secret things to be unlocked, for example, typing in "Secret 1357911 on" will unlock all the jester outfits and jack in the box permanently UNLESS the toggle is off, by typing this into terminal, "Secret 1357911 off".

There should be a clown wig and clown costume that you unlock with the game telling you that you dont know how to unlock it, and you unlock it by killing Justin with a weapon in special ten times, and it only tells you how you unlocked it once you did it. There is also clown paint option that is unlocked too. Hovering over a selected item should tell you about what you need to unlock it while a lock symbol is at the top left of it, and it becomes faded and unlocked (the lock becomes unlocked) when the requirement is met. While the lock is on an item, it is slightly faded and cannot be used, but selecting it will show a preview of it, but the selection is in red, and clicking out of that menu in customization will deselect it automatically and make it go back to the previous item.

Selecting items you cannot wear while wearing jack in the box will turn the duck back to normal and deselect the jack in a box option.

The many extra colors in the color menu that show up for certain items with too many option get collapsed into drop down menus that have to be clicked on to open their options"

Rule (2026-10-27 21:03Z): "i want to see the new items before they are added to the game."
- Decided (Adam): split into part A (Noah: pumpkin, antenna eyes, color dropdowns, start now) and part B (jester, Jack
  and Jill in a Box, clown, locks, Secret; waits for the owner's go). Every new or redrawn item is shown to the owner as a
  picture, and nothing merges until the owner OKs it.
- Part A: one squat ribbed pumpkin with a bent stem, vine and leaf; each antenna ball draws the eye picked under Eyes
  (X eyes when dead, plain balls for no eyes); on the Colors page an item with 2 or more colors folds them under its name
  (shut each time Customize opens; the fold holding the color being picked opens).

## Request (owner, 2026-10-27 22:12Z): cats' chat only on screen, NPCs mutable
"Cats shouldnt have their texts in chat UNLESS they are sharing a screen with a player

NPCs should be able to be muted with any command like usual"

## Request (owner, 2026-10-27 22:13Z): Annabelle dislikes only with 4 or more players
"annabelle no longer finds a single player to dislike UNLESS there are at LEAST four players in the game"

## Request (owner, 2026-10-27 22:16Z): Justin's water line not so often
"justin cant keep saying what he does about the water unless it has been a few mins at least. 

BY THE WAY! my laptop has 16gb of ram but will default to the no dedicated memory gpu UNTIL it is in charger, SO when i play the game without the dedicated 4 gb of vram, i notice how laggy it feels on cabin"

## Request (owner, 2026-10-27 22:25Z): shadow duck rarer and more see-through
"the shadow duck should become visible very rarely and be more transparent"

## Request (owner, 2026-10-27 22:29Z): every Duck Cabin death lasts as long as Justin's
"On cabin, all player remain dead for as long as they did when justin kills them"
