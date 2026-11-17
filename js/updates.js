/* ---------- Updates ----------
   What changed, newest first, one page per version. A version is a deploy: the finished work of a batch, merged to main
   together once (never one version per merge), "Version N" (one more than the last), with its date and a short title.
   Up to Nov 2 it was one page per day; from Nov 3 on, one page per deploy. Version 1 is the first page (Oct 25). The Updates button on the front page opens this window and shows a dot until
   the newest page has been opened on this device. I want short, plain words for players, not a list of everything. */
import { openWindow, esc } from "./ui.js";
import { rainbowHTML } from "./art.js";
import { openReport, reportLinkHTML } from "./report.js";

export const UPDATES = [
  {
    id: "v69",
    version: 69,
    date: "Nov 17, 2026",
    title: "Justin's attack hints, Tommy gun and UMP-45",
    news: [
      "For Mad God Justin: The edge lightning comes less often (every 18 s instead of 10 s) and its edges blink three times before it strikes.",
      'For Mad God Justin: Every attack now has a hint. A red wedge shows where his hammer will sweep, a red sight line shows his gun bursts, and a red cone shows his shotgun, each with a red "!" over his head.',
      "For Dead Ducks Arcade: The Tommy gun and the UMP-45 can come out of the weapon spin.",
      "For Mad God Justin: The Tommy gun and the UMP-45 can drop as pickups.",
    ],
    fixed: [],
  },
  {
    id: "v68",
    version: 68,
    date: "Nov 17, 2026",
    title: "Faster revives and Angelic pistols",
    news: [
      "For Dead Ducks Arcade: A revive now takes 5 s instead of 10.",
      "For Dead Ducks Arcade: New Quick Revive upgrade in the shop for 750 points. Your revives take 3 s until you go down.",
      "For Dead Ducks Arcade: While someone revives you, your bleed-out timer pauses.",
      "For Dead Ducks Arcade: A downed duck turns greyer as its time runs out, and it gets a pistol with endless bullets that still reloads. The pistol goes away when the duck is revived.",
      "For Dead Ducks Arcade: The Angelic pistols now take turns, one bullet at a time, and fire twice as fast as the plain pistol. They hold a 16-round magazine and take twice as long to reload, and a crit sets off a blast half a grenade's size with a weaker boom.",
      "The LMG, sniper, chain gun (most of all), shotguns and revolver shake the screen more, and explosions now shake it too (small ones less).",
      "For Mad God Justin: A revive now takes 3 s and brings the duck back at half its HP. A duck out of HP turns grey and can still fire a pistol that reloads.",
    ],
    fixed: [],
  },
  {
    id: "v67",
    version: 67,
    date: "Nov 17, 2026",
    title: "Laser Rifle pickup",
    news: [
      "For Mad God Justin: The Laser Rifle can now show up as a pickup. It never runs out, but six beams in a row overheat it for 8 seconds.",
    ],
    fixed: [],
  },
  {
    id: "v66",
    version: 66,
    date: "Nov 17, 2026",
    title: "The Laser Rifle",
    news: [
      "For Dead Ducks Arcade: New gun from the weapon spin: the Laser Rifle. Hold to fire a red beam once a second that goes through every zombie in its line (1 damage each, never a crit or a miss) and never runs out of ammo.",
      "For Dead Ducks Arcade: The Laser Rifle heats up with each beam (blocks under your duck go from red to orange). Fire one more beam once it's full and it overheats: it hisses, your duck gets scorched and shakes, and it can't fire for 8 seconds while it smokes. It steams more in the rain.",
      "For Dead Ducks Arcade: The Angelic Laser Rifle fires every 0.75 s, holds 6 beams of heat, and now and then deals 2 damage. Zombies it kills are left burnt.",
    ],
    fixed: [],
  },
  {
    id: "v65",
    version: 65,
    date: "Nov 17, 2026",
    title: "Downpour's car and Angel machine",
    news: [
      "For Dead Ducks Arcade: on Downpour, the weapon spin shows on the ground behind the car.",
    ],
    fixed: [
      "For Dead Ducks Arcade: nobody walks through Downpour's Angel machine anymore.",
    ],
  },
  {
    id: "v64",
    version: 64,
    date: "Nov 17, 2026",
    title: "Glows and meters",
    news: [
      "For Dead Ducks Arcade: Angelic weapons glow softly and breathe, with a see-through halo.",
      "For Dead Ducks Arcade: the Angelic pistols sit further apart, each with its own laser sight meeting where you aim.",
      "For Dead Ducks Arcade: between rounds, a yellow square shows where you can spin for a weapon.",
      "For Dead Ducks Arcade: the Angel machine glows red, the generator electric yellow, and the Butler and Priest gold.",
      "For Dead Ducks Arcade: the LMG's and chain gun's barrels glow hotter the longer they fire.",
      "For Dead Ducks Arcade: a thin cooldown bar under your HP shows reloads and the wait between shotgun and sniper shots.",
      "For Dead Ducks Arcade: switching weapons shows a small slider under your duck.",
    ],
    fixed: [],
  },
  {
    id: "v63",
    version: 63,
    date: "Nov 17, 2026",
    title: "The missing boom, and Downpour's flood",
    news: [
      "For Dead Ducks Arcade: on Downpour, the flood covers the whole road, the ground slopes down into it, and ducks wading it sink a little.",
    ],
    fixed: [
      "For Mad God Justin: the Angelic pistol's weaker boom and the laser gun's sounds, promised in Version 62, are really in the game now.",
    ],
  },
  {
    id: "v62",
    version: 62,
    date: "Nov 17, 2026",
    title: "Justin's fight, retuned",
    news: [
      "For Mad God Justin: ducks start with the short sword instead of the knife.",
      "For Mad God Justin: a little plus sign shows up every 30 seconds and gives +1 HP to the duck that walks over it.",
      "For Mad God Justin: the Xbox is shut off when Justin has 2/3 of his HP left, the meteor at 1/3.",
      "For Mad God Justin: a gun you pick up comes with only its one magazine (the shotgun never runs out, the LMG has 30 rounds).",
      "For Mad God Justin: the Angelic pistol's blast has its own boom, a little weaker than the grenade's.",
      "The LMG holds 100 bullets and takes twice as long to reload in every mode.",
      "For Dead Ducks Arcade: the Map page now has a Downpour row next to Duck Cabin.",
    ],
    fixed: [
      "For Dead Ducks Arcade: Downpour has a fence round the whole map, and grass instead of the dark forest floor.",
    ],
  },
  {
    id: "v61",
    version: 61,
    date: "Nov 17, 2026",
    title: "Justin's HP and late ducks",
    news: [],
    fixed: [
      "For Mad God Justin: a duck who joins in the middle of the fight now adds its share to Justin's HP, the same as a duck there from the start.",
    ],
  },
  {
    id: "v60",
    version: 60,
    date: "Nov 17, 2026",
    title: "Install from the menu",
    news: [
      "Install Duck Friends is on the main menu, under Updates. On Chrome and Edge it installs the game as an app in one press; elsewhere it says how. Inside the app it's hidden.",
    ],
    fixed: [
      "On a phone on its side, the main menu's buttons all fit on the screen.",
    ],
  },
  {
    id: "v59",
    version: 59,
    date: "Nov 17, 2026",
    title: "Loads with ad blockers",
    news: [],
    fixed: [
      "The game loads again on computers with some ad blockers, which were blocking one of its files by its name.",
    ],
  },
  {
    id: "v58",
    version: 58,
    date: "Nov 17, 2026",
    title: "Why it didn't load",
    news: [],
    fixed: [
      "If the game still can't load, the loading screen now says why under \"Tap to try again\": which file didn't arrive, or the error that stopped it.",
    ],
  },
  {
    id: "v57",
    version: 57,
    date: "Nov 17, 2026",
    title: "No more stuck loading",
    news: [],
    fixed: [
      "The game no longer gets stuck on the loading bar. If a file doesn't arrive, it fetches the game fresh and starts again by itself, and if that still fails, a tap tries again.",
    ],
  },
  {
    id: "v56",
    version: 56,
    date: "Nov 17, 2026",
    title: "Install Duck Friends",
    news: [
      "Duck Friends can be installed as an app from the site: on a phone, Chrome's menu, then Add to Home screen or Install app; on a computer, the install button at the right of the address bar. It opens in full screen without the browser's \"To exit full screen\" pop-up, and every update reaches it the next time it opens.",
    ],
    fixed: [],
  },
  {
    id: "v55",
    version: 55,
    date: "Nov 17, 2026",
    title: "A grey roof",
    news: [],
    fixed: [
      "The Duck Cabin's roof is now slate grey, so it stands out from the grass.",
    ],
  },
  {
    id: "v54",
    version: 54,
    date: "Nov 17, 2026",
    title: "Rainbows, Downpour fixes and phone aim",
    news: [
      "Dat Boi's rainbow rank is now a real rainbow that blends from color to color and keeps cycling.",
      "New skin: Rainbow, for any duck. It unlocks at 62,208 Jumps, the same as Dat Boi's rainbow rank.",
      "On a phone, the gun, its laser sight and the flashlight point the way your duck walks, and the aim stick takes over while you hold it. This is the same in every mode.",
      "For Dead Ducks Arcade: Downpour now has half as many trees, and tree leaves, roofs and the pumps' canopy turn see-through over a zombie or another player.",
      "For Dead Ducks Arcade: on Duck Cabin, the roof turns see-through over a duck or zombie inside, as on Downpour.",
      "For Dead Ducks Arcade: on Downpour, ducks and zombies swim in the deep water, slower, with guns put away.",
      "For Dead Ducks Arcade: Downpour's generator runs from the start with 8 rounds of gas.",
      "For Dead Ducks Arcade: Downpour's restroom has a toilet and a sink with a mirror, and the Angel machine stands in the chapel in place of the altar.",
    ],
    fixed: [
      "On a phone held on its side, the aim stick and the walking stick sit a little in from the screen's edges so you can push them all the way.",
      "On an upright phone in full screen, Rooms' top buttons no longer hang over the room panel.",
      "For Dead Ducks Arcade: zombies steer around trees, cars and walls and no longer get stuck, on every map.",
      "For Dead Ducks Arcade: on Downpour, things on the floor can be picked up again.",
      "For Dead Ducks Arcade: Downpour's flood is clearly water all the way across.",
      "For Dead Ducks Arcade: Downpour's walls meet at the corners, the front door is one smashed hole, and no wall lies on the ground.",
      "For Dead Ducks Arcade: the Priest is as big as a duck.",
    ],
  },
  {
    id: "v53",
    version: 53,
    date: "Nov 17, 2026",
    title: "Phones on their side",
    news: [
      "On a phone turned on its side, everything is smaller and laid out to fit the short screen.",
      "On a phone, the game goes full screen when you first tap to start. A button by the top-right buttons leaves full screen and comes back to it.",
      "The Nous Within Kenoma maps (Ether's Crossroads and every variation) now look like the book site's old amber terminal: its letters, its glow, the scanlines and the glass.",
      "Duck Cabin and Downpour now have the same pixel size as every other map.",
      "For Dead Ducks Arcade: a flashlight now lights what it points at, not just the floor. Walls, cars, fences, shelves and furniture in its beam show their detail.",
      "For Dead Ducks Arcade: Downpour's fences are chain-link and can be seen. Shine a light on them to see the links.",
      "For Dead Ducks Arcade: on a phone, the gun and its laser sight point the way the duck walks, and keep that direction when it stops.",
    ],
    fixed: [
      "The lobby countdown's last tone at 0 plays again.",
      "For Dead Ducks Arcade: on a phone, Change starting round and its texts are small now, and hide while the shop, the Priest or another window is open.",
      "For Dead Ducks Arcade: Duck Cabin's picture in the map vote is clearer.",
    ],
  },
  {
    id: "v52",
    version: 52,
    date: "Nov 16, 2026",
    title: "Downpour",
    news: [
      "For Dead Ducks Arcade: a new map, Downpour: a gas station, a flooded road and a chapel at night in the rain.",
      "For Dead Ducks Arcade: each game starts with a vote between Duck Cabin and Downpour.",
      "For Dead Ducks Arcade: on Downpour, lightning can strike zombies, and mud zombies splash mud on your screen.",
    ],
    fixed: [
      "For Dead Ducks Arcade: on a phone, the Change starting round button no longer runs under the Ready button.",
    ],
  },
  {
    id: "v51",
    version: 51,
    date: "Nov 16, 2026",
    title: "One pixel size",
    news: [
      "Every background now uses one pixel size: the main menu's ball pit no longer has bigger pixels than the room behind it.",
      "For Dead Ducks Arcade: a yellow gas meter under the power box shows how many rounds of fuel are left.",
    ],
    fixed: [
      "With Vote Mode & Map on, the results screen's bottom bar no longer grows over half the board and squeezes the controls into a thin column.",
    ],
  },
  {
    id: "v50",
    version: 50,
    date: "Nov 16, 2026",
    title: "Music is back",
    news: [
      "Music is back: our own 11 songs, now played on real instruments.",
      "What the duck? now plays on the scarier maps (Nous Within Kenoma, Shelter Sky & Null).",
      "Data saving and Poor connection play lighter copies of the songs.",
    ],
    fixed: [],
  },
  {
    id: "v49",
    version: 49,
    date: "Nov 16, 2026",
    title: "Game mode headings fold",
    news: [
      "Game Settings: on the Game mode page, Social, Social Competitive and Special list their modes right under them, and each heading's arrow folds them away.",
    ],
    fixed: [],
  },
  {
    id: "v48",
    version: 48,
    date: "Nov 16, 2026",
    title: "New zombie counts",
    news: [
      "For Dead Ducks Arcade: each round's zombies follow a new table: 12 a round in rounds 1 to 4, 24 in 5 to 8, 36 in 9 to 12, 72 in 13 to 20, plus more for each extra player, up to 100 per player and 400 in all.",
      "For Dead Ducks Arcade: zombies come twice as fast once a round is 10 seconds in.",
      "For Dead Ducks Arcade: grenades, the grenade launcher and the flamethrower don't crit, and thrown grenades never miss.",
      "For Dead Ducks Arcade: Angelic guns can't be refilled, not by Justin's Butler and not by Max Ammo.",
      'For Dead Ducks Arcade: Justin\'s Butler asks "Are you sure?" before you buy a gun.',
    ],
    fixed: [],
  },
  {
    id: "v47",
    version: 47,
    date: "Nov 16, 2026",
    title: "Crits, misses and starting rounds",
    news: [
      "For Dead Ducks Arcade: every weapon now has a crit chance: 5%, or 2.5% for the fast guns. Grenades and the grenade launcher can crit each zombie they hit. Angelic weapons crit twice as often.",
      "For Dead Ducks Arcade: hits can miss (2.5%, or 5% for the fast guns), and a bullet or arrow that misses flies on to the next zombie.",
      "For Dead Ducks Arcade: Critical Chance costs 600 points, adds 2.5%, and can be bought twice.",
      "For Dead Ducks Arcade: zombies have 3, 4 or 5 HP.",
      "For Dead Ducks Arcade: Start on round is a setting now: 1, 5, 9, 13 or 21. It replaces Round 16 Start, and every duck gets bonus points in round 0: 750, 1,750, 2,500 or 5,000.",
      "For Dead Ducks Arcade: in round 0, Change starting round (under Exit Cabin) starts a vote to start at another round. A passed vote gives the points at once.",
      "For Dead Ducks Arcade: Angelic weapons now glow dark crimson red.",
    ],
    fixed: [],
  },
  {
    id: "v46",
    version: 46,
    date: "Nov 16, 2026",
    title: "Faster zombies",
    news: [
      "For Dead Ducks Arcade: zombies come in twice as fast.",
      "For Dead Ducks Arcade: Justin's Butler also sells the fireplace's power part, for 750 points.",
      "For Dead Ducks Arcade: Attack speed can be upgraded twice.",
    ],
    fixed: [],
  },
  {
    id: "v45",
    version: 45,
    date: "Nov 16, 2026",
    title: "Bodies stay with Animations off",
    news: [],
    fixed: [
      "For Dead Ducks Arcade: with Animations off, dead zombies lie there and fade away instead of vanishing the moment they die.",
    ],
  },
  {
    id: "v44",
    version: 44,
    date: "Nov 16, 2026",
    title: "Lighter on slow devices",
    news: [
      "Low graphics, Data saving and Poor connection now lighten effects on your own screen. You get no gun smoke or screen shake, a tiny muzzle flash, half the blood, and effects drawn 30 times a second. Every player's shots still show.",
      'In Game Settings, a "Low" chip next to Gore and Heavy effects shows when your own Low graphics lighten them.',
      "Data saving and Poor connection now play fewer sounds at once and skip far-off sounds you'd barely hear.",
      "Poor connection sends your duck's spot less often while it stands still.",
      "For Dead Ducks Arcade: with Low graphics or Data saving, dead zombies leave your screen after 2 seconds, and the flamethrower's fire and the flashlights cost less to draw.",
    ],
    fixed: [],
  },
  {
    id: "v43",
    version: 43,
    date: "Nov 16, 2026",
    title: "The Angel machine",
    news: [
      "For Dead Ducks Arcade: the Angel machine on the stage. With the power on, put a gun or melee weapon in for 1,000 points. In 5 seconds it comes back as an Angelic weapon: +1 damage, 20% faster attacks and reloads, and more ammo.",
      "For Dead Ducks Arcade: Angelic weapons get extra powers. The bow and the chain gun shoot through zombies, the sniper goes through two more, and the flamethrower reaches farther and burns longer. The default pistol becomes two pistols that kill with every bullet and blow up on crits. The grenade launcher sets the ground on fire.",
      "For Dead Ducks Arcade: the Angel machine hums and sparks while it works, and the orb comes out with a shimmer.",
    ],
    fixed: [],
  },
  {
    id: "v42",
    version: 42,
    date: "Nov 16, 2026",
    title: "Trombone and fire",
    news: [
      "The Sad Trombone special plays its 'wah, wah, wah, waaah'.",
      "Fire crackles: ducks on fire, and the fire special, now have a sound.",
    ],
    fixed: [],
  },
  {
    id: "v41",
    version: 41,
    date: "Nov 16, 2026",
    title: "The power box",
    news: [
      "For Dead Ducks Arcade: the power box on the balcony works. Find its four parts (a fuse, a lever, a tool box and a gas can) at the Butler's, on a zombie in the first five rounds, or around the cabin. Press E at the box to fit them and turn the power on: the lights and the TV come on for 6 rounds.",
      "For Dead Ducks Arcade: once the power runs out, jerry cans turn up (from the fireplace, zombies, or around the cabin). Pour one in to bring the power back for as many rounds as it holds.",
      "For Dead Ducks Arcade: the power box has its sounds: parts picked up and fitted, gas poured, the power coming on and going out.",
      "Duck Cabin's power box now sounds as the power comes on and goes out.",
    ],
    fixed: [],
  },
  {
    id: "v40",
    version: 40,
    date: "Nov 16, 2026",
    title: "Hats knocked off for real",
    news: [],
    fixed: [
      "Hats and face items knocked off Blocks, 2D shape and Dat Boi ducks no longer stay on their heads.",
    ],
  },
  {
    id: "v39",
    version: 39,
    date: "Nov 16, 2026",
    title: "6 HP and coming back",
    news: [
      "In every mode but Dead Ducks Arcade, Mad God Justin and Hangout, ducks have 6 HP now.",
      "A duck that dies stays down for 3 seconds, then comes back with its body back to normal.",
      "A duck that just came back blinks and fades in for 2.5 seconds. Nothing hurts it, and its own weapons and explosives hurt nobody until then.",
      "Wounds and knocked-off hats stay until the duck dies and comes back.",
    ],
    fixed: [],
  },
  {
    id: "v38",
    version: 38,
    date: "Nov 16, 2026",
    title: "New guns and melee weapons",
    news: [
      "New: the Double barrel. Every shot is a slug that takes all the HP of whatever it hits and throws it back. Two shells, then a second to load each one.",
      "New: the Flamethrower. It reaches farther the longer you hold it, sets everything in front of you on fire, and leaves the ground burning for 5 seconds. A duck on fire sees its screen flash crimson and shake.",
      "New: the Burst rifle. Three rounds per click, 21 in a clip, as hard as the AK-47.",
      "New: the Fire axe (1 to 4 damage), the Short sword (fast, 1 damage) and the Cast iron pan (misses half its swings, but half of what lands is a crit). All three are in Customize, under Specials.",
      "The double barrel, the burst rifle and the flamethrower each have their own sounds and reloads, and the flamethrower roars while you hold it.",
      "The axe, the sword and the frying pan each swing and hit with their own sounds.",
      "For Dead Ducks Arcade: the Double barrel's crits blow the head off and go on through every zombie in their way. The Flamethrower's fire spreads from zombie to zombie, and it shares a fireplace bag with the chain gun. The Double barrel has 96 shells.",
      "For Dead Ducks Arcade: the fireplace's melee weapons come as one bag: blunt (hammer, pan) or sharp (knife, axe, short sword).",
    ],
    fixed: [],
  },
  {
    id: "v37",
    version: 37,
    date: "Nov 16, 2026",
    title: "Cats, real quacks, and Justin's entrance",
    news: [
      "For Hangout: the Duck Cabin cats meow, purr and hiss, the TV hisses quietly with static, and the power box hums.",
      "The Sound special and the cloud duel quack with real ducks.",
      "For Mad God Justin: Justin's thrown chair and controllers block bullets, and they can't be broken.",
      "For Mad God Justin: Justin isn't there for the first 3 seconds of a fight: his avatar fades in with a red glow, and only then can he attack or be hit.",
    ],
    fixed: [],
  },
  {
    id: "v36",
    version: 36,
    date: "Nov 16, 2026",
    title: "Gore",
    news: [
      "Blood is bigger and messier: more of it, bigger pixels, and pools that stay a while.",
      "Chunks of the duck itself fly out when it's hit, in its own color.",
      "Shots tear holes in clothes where they go through.",
      "Hits can knock off hats and face items. They fly off and come back on after 10 seconds. Helmets that cover the head, hair and face paint stay on.",
      "Bullets can shoot a beak off or blow an eye out, and blades and blunt hits can too.",
      "With Gore off, none of it shows except a knocked-off hat.",
      "For Dead Ducks Arcade: zombies killed by the Nuke are torn apart in a few different ways, some headless, some missing a beak and an eye.",
    ],
    fixed: [
      "For Mad God Justin: each fight counts as a game, so the vote for the next game comes back after your Vote return games (3 by default).",
      "For Mad God Justin: the stats screen has the Vote: new game now button again, next to Try again and the lobby vote.",
    ],
  },
  {
    id: "v35",
    version: 35,
    date: "Nov 16, 2026",
    title: "A much harder Justin",
    news: [
      "For Mad God Justin: Justin starts with 160 HP, plus 20 for every duck in the fight.",
      "For Mad God Justin: every gun you pick up has to reload now, the shotgun, the grenade launcher and the chain gun too. The pistol still never reloads.",
    ],
    fixed: [
      "You only see your own laser sight now, not other ducks' or Justin's.",
    ],
  },
  {
    id: "v34",
    version: 34,
    date: "Nov 16, 2026",
    title: "Pixel emoji and tips",
    news: [
      "Every emoji is now pixel art too, like the Specials icons (ducklings, coffee, the jumps).",
      "Hover tips are sharp pixel letters now.",
      "Card patterns and card pictures are pixelated.",
    ],
    fixed: [],
  },
  {
    id: "v33",
    version: 33,
    date: "Nov 16, 2026",
    title: "The Nuke, and the chain gun's push",
    news: [
      'For Dead Ducks Arcade: the Nuke sweeps grey static out over the screen in a second, flashes and leaves smoke drifting while the map stays grey for 7 s. "Nuke" shows in crimson blood letters, and every zombie is burnt and blown apart, their bodies lying there 15 s.',
      "For Dead Ducks Arcade: the Nuke roars with a ringing in your ears; boards crack and get nailed, zombies groan, the fireplace spins to a bell, buying rings the till, drops chime and jingle, and the flashlight clicks.",
      "In Duck Cabin, lamps, the power box, the fire and candles, the TV and blackjack's cards and chips all have their own sounds.",
      "Stepping onto another answer or tile makes a faint knock, a little higher toward Agree.",
      "The chain gun now pushes you slowly backwards while you fire it. Walk into your aim to hold your ground.",
      "The chain gun now holds 300 rounds.",
    ],
    fixed: [],
  },
  {
    id: "v32",
    version: 32,
    date: "Nov 16, 2026",
    title: "Sounds, Mode Rules and Nous Within Kenoma",
    news: [
      "Sounds are back, now made from real recordings with the old 32-bit games' crunchy sound: footsteps, jumping, the jetpack, the medkit, the adrenaline shot, eating and drinking.",
      "Every gun has its own shot and its own reload sound, each reload lasting as long as that gun takes to reload. The grenade launcher thumps as its grenade leaves the tube.",
      "Hits sound different by what hit: a small, big or heavy round, pellets, a knife, a hammer or chair, an arrow or a claw. Missed shots land with their own sound.",
      "The knife, hammer, chair, grenade and zebra cake each have their own swing or throw. Every explosive shares one big boom, and the meteor and the nuke shake everything with their own long rumble.",
      "Menus have faint sounds: a press for every button, on and off for switches, and windows opening and closing.",
      "The lobby countdown has its beeps back: soft ticks and a gentler last tone.",
      "Mode Rules: each game mode's settings repeat the General Rules, each Same as General until you pick one, and a pick wins in that mode only.",
      "The General Rules say they apply to all game modes and have an On/Off switch: Off fades them, and every mode plays the default rules unless its Mode Rules say otherwise.",
      "Game Settings: Game Options, Modes in Random & Vote and Save slots are on top; Vote Mode & Map, Game mode and Map sit under a line.",
      "Game Settings (Additional Settings): Gore and Heavy effects can be turned off.",
      "The game and map votes have a Vote: back to the lobby button and the pause menu (☰) at the top right.",
      "The map Ether's Crossroads is now Nous Within Kenoma, the book's page with its amber look and static.",
      "Five variations of Nous Within Kenoma sit at the bottom of the map list: Ether's Crossroads, Architectured, Ten, Chalice and the Fool. Every map's variations are at the bottom of the list.",
      "Random and the map vote's dice play the maps played least first, and a map's variations take turns, so they never crowd out the other maps.",
      "A loading screen with your duck and a bar now shows whenever the game is loading: the first time you open the page, joining or making a room, and going into any game.",
      "Press a weapon's number to pick it, press it again to put it away. No Shift needed, and the phone's toggle switch is gone: whatever is selected is what you use.",
      "Only the weapon you picked can be fired or swung. The jetpack and the grenade work only while picked.",
      "Each gun has its own muzzle flash and smoke, much bigger than before: the sniper's is long and thin, the shotgun's a wide spray, the chain gun's about a duck long.",
      "The mouse pointers are a little smaller: the arrow, the hand and the text pointer are 1.5 times their old size, redrawn sharp.",
      "The chain gun fires full-length lines in every direction in every mode, and shakes your screen while you hold it down.",
      "For Mad God Justin: the bow is now a pistol that never reloads. You start each fight holding it, with the knife on 1, and guns have laser sights.",
      "For Mad God Justin: only the powerful guns drop now: the sniper, AK-47, LMG, shotgun, grenade launcher and a rare chain gun. The medkit drops too.",
      "For Mad God Justin: a gun you pick up works as it does in Dead Ducks Arcade (magazine, R to reload, auto fire) and stays on key 4 until its shots run out. The medkit heals you to full, and holding Revive with it in hand gets a downed duck up at once.",
      "For Mad God Justin: if your own grenade launcher blast catches you, you lose half your HP, rounded down. It never downs you.",
      "For Dead Ducks Arcade: Justin isn't in this mode anymore. The Justin switch, the fireplace and the zebra cake no longer bring him in, and no zombie wears his look.",
      "For Dead Ducks Arcade: the laser sight and your bullets go toward the cursor.",
      "For Dead Ducks Arcade: if your own grenade or grenade launcher blast catches you, you lose half your HP, rounded down. It never downs you.",
      "For Dead Ducks Arcade: grenades are on key 5 now, not G.",
      "For Dead Ducks Arcade: a far-off, eerie swell plays as each new round starts, and zombie footsteps are quieter than ducks'.",
      "Dead Ducks Arcade and Duck Cabin count as one game: once everyone's down, or the ducks vote to leave the cabin, the vote comes back or Random moves on.",
    ],
    fixed: [
      "A grenade launcher grenade that flies off the side of the screen no longer reappears on top of you.",
      "For Dead Ducks Arcade: players with multicolored names now only show in a flashlight too.",
    ],
  },
  {
    id: "v31",
    version: 31,
    date: "Nov 16, 2026",
    title: "Pixel blood, smoke and sway",
    news: [
      "Blood is now pixels and flies by caliber: drops from small guns, sprays and squirts from big ones, chunks from the sniper, the chain gun and the hammer.",
      "Bullet holes go right through a duck's skin.",
      "Every gun flashes and smokes when it fires (the chain gun and the sniper most) and kicks back with a little bounce.",
      "Held weapons sway as you walk and sway their own way mid-jump.",
      "Firing shakes your screen a little (more for bigger guns), and an adrenaline shot makes you jitter and the screen wobble.",
      "Sprinting blurs the map a little.",
      "For Dead Ducks Arcade: guns have a laser sight to the end of your flashlight (not the bow), ducks and zombies in a beam are lit as bright as the beam, ducks are see-through while a jump keeps them safe, and dead zombies stay solid for 1.25 s before they fade.",
    ],
    fixed: [
      "Small duck pictures (like the players' chips under the question form) show their whole body again.",
      'On phones, the stage\'s title at the top (like "Write a question") is no longer cut off.',
    ],
  },
  {
    id: "v30",
    version: 30,
    date: "Nov 16, 2026",
    title: "Safe Keeping, and Justin in Dead Ducks Arcade",
    news: [
      "For Dead Ducks Arcade: holding a medkit while you revive someone brings them up at once, with full HP and the max HP they had bought. The medkit is used up.",
      'For Dead Ducks Arcade: new item, Safe Keeping, a halo for the purple slot. The Butler sells it for 2,500 and the fireplace can roll it. If you go down with it, you lose nothing you bought. You get up by yourself (press E when others are still standing), glowing light blue. Then you take no damage for 6 seconds while a counter runs down to "Vitals Stabilized".',
      "For Dead Ducks Arcade: with the Justin switch on (Game Settings), Justin plays on your side from the start as one more duck, with his own HP like everyone.",
      "For Dead Ducks Arcade: other players' names are small over their heads and show only when a flashlight reaches them. On phones they always show.",
    ],
  },
  {
    id: "v29",
    version: 29,
    date: "Nov 16, 2026",
    title: "Dead Ducks Arcade, and a bigger crosshair",
    news: [
      "Quacky Zombies is now called Dead Ducks Arcade.",
      "For Dead Ducks Arcade: guns carry 5 more magazines (the LMG 3 more), the bow, the shotgun and the grenade launcher 50% more ammo, and the chain gun four times as much.",
      "For Dead Ducks Arcade: Accuracy is now Critical Chance.",
      "For Dead Ducks Arcade: each weapon from the fireplace makes an item likelier on your next spin, and two items in a row make one a little less likely.",
      "For Dead Ducks Arcade: special drops come in a shuffle, every one once before any comes again (Max Ammo can always come).",
      "For Dead Ducks Arcade: Instant Kill, Double Points and Sale last 45 seconds.",
      "For Dead Ducks Arcade: the minimap is smaller and more see-through, and it's gone on phones.",
      "For Mad God Justin: reviving takes half as long.",
      "The scroll wheel switches your hotbar item in every mode, Mad God Justin too.",
      "A quick tap of Shift keeps the selected item on, or puts it away. Holding Shift still sprints.",
      "For Dead Ducks Arcade: switching slots or using something else cancels a reload.",
      "For Dead Ducks Arcade: a reloading weapon's hotbar box fills up darker until the reload is done.",
      "For Dead Ducks Arcade: a thin white bar under your sprint bar shows your reload, melee or item cooldown.",
      "For Dead Ducks Arcade: thrown and used-up items now have a 0.75 second cooldown.",
      "For Dead Ducks Arcade: switching slots shows a tiny row of your items under your duck for a moment.",
      "For Dead Ducks Arcade: points you earn pop up over your duck, and during Double Points they glow yellow.",
      "For Dead Ducks Arcade: the special drops that are on now show at the top middle, by name, with their seconds left.",
      "For Dead Ducks Arcade: Instant Kill makes the board softly glow blood red.",
      "For Dead Ducks Arcade: Sale makes the Butler and the fireplace glow gold, and it's announced in gold letters.",
      "For Dead Ducks Arcade: Max Ammo makes your hotbar flash.",
      "With Vote Mode & Map on, the stats screen says how many games are left until the next vote, and a new button, Vote: new game now, lets the room vote for a new game right away.",
    ],
    fixed: [
      "The mouse pointer and the hand are twice as big, and the crosshair three times as big.",
      "Ducks no longer flicker in the lobby when the start countdown runs.",
    ],
  },
  {
    id: "v28",
    version: 28,
    date: "Nov 16, 2026",
    title: "The pixel look",
    news: [
      "New look: the whole game is pixel art. Ducks, maps, windows and pictures share one pixel size (a duck is 32 pixels tall), with one set of colors.",
      "Every word and number uses a sharp pixel font, easy to read.",
      "Pixel mouse pointer: an arrow, a hand over buttons, and a crosshair over the board whenever you hold a weapon.",
    ],
    fixed: ["Rabbit Hole runs lighter."],
  },
  {
    id: "v27",
    version: 27,
    date: "Nov 15, 2026",
    title: "Lobby Settings",
    news: [
      "New Lobby Settings button (the gear next to the pause menu): the game settings and the Democracy of Ducklings votes, even during a game. It blinks when a setting changes and shows ! while a vote is up, and a note under the cloud says when new legislation is being passed (also in the chat).",
    ],
    fixed: [
      "Democracy of Ducklings votes now work during a game, not only in the lobby.",
    ],
  },
  {
    id: "v26",
    version: 26,
    date: "Nov 15, 2026",
    title: "Hangout in Random, with a time limit",
    news: [
      "For Hangout: Random can pick it now. You can turn it off under Modes in Random & Vote.",
      "For Hangout: new setting \"Time limit (Random & Vote)\" under Game Options: 5, 10, 15, 20 or 30 minutes, or No limit (15 at first). The time left shows at the top. When it runs out, Random's next game begins, or the votes come back when it's their turn. A Hangout the host picks has no time limit.",
      "For Hangout: after a Hangout from Random or the vote, the room's map comes back, zoom or black and white included.",
    ],
  },
  {
    id: "v25",
    version: 25,
    date: "Nov 15, 2026",
    title: "See-through walls in Quacky Zombies",
    news: [
      "For Quacky Zombies: from inside, you can see zombies beating on the boards, and those boards turn see-through. You can shoot them there.",
      "For Quacky Zombies: walls turn see-through when a player or a zombie is behind them.",
    ],
    fixed: [
      "For Quacky Zombies: shots fired while jumping or on the jetpack now go where you aim.",
      "Modes in Random & Vote now lists Hangout and Quacky Zombies too, and a game turned off is left off the vote as well as Random.",
    ],
  },
  {
    id: "v24",
    version: 24,
    date: "Nov 15, 2026",
    title: "Holes in the zombie cabin, and save slots",
    news: [
      "For Quacky Zombies: new holes in the cabin's walls (kitchen and bathroom into the top bedroom, the top bedroom into the bottom one, the hall onto the deck). Ducks and zombies walk through them, and they can't be boarded up.",
      "For Quacky Zombies: the back door is now a large hole. You can see the porch from inside and part of the room from the porch.",
      "For Quacky Zombies: the doorways on the right side of the cabin are wider.",
      "Game Settings → Save slots: save the room's settings in one of 5 slots on your device, and load them in the lobby.",
      "Game Settings → Modes in Random & Vote: turn games off so Random and the vote leave them out. During a game, every one but the game being played can change.",
    ],
    fixed: [
      "For Quacky Zombies: no ring around your name, and the name tags and HP bars under the ducks have square ends.",
      "Night Show, Starry Night and Carnival Night run smoother: their lights and skies cost the browser much less each frame.",
    ],
  },
  {
    id: "v23",
    version: 23,
    date: "Nov 15, 2026",
    title: "A frame cap",
    news: [
      "Settings → Performance → Frame rate: the game draws at most 120 frames a second at first. Type your own number (30 to 1000) in the box, or turn Frame cap off to draw as many as your screen shows.",
    ],
  },
  {
    id: "v22",
    version: 22,
    date: "Nov 15, 2026",
    title: "A roomier zombie cabin",
    news: [
      "For Quacky Zombies: a fireplace spin costs 500 points.",
      "For Quacky Zombies: the candles on the floor and the deck, the stools round the card table, the beds and the plant by the back door are gone, and nobody can jump up onto a table anymore.",
    ],
  },
  {
    id: "v21",
    version: 21,
    date: "Nov 15, 2026",
    title: "Smoother play, a minimap and attorney votes",
    news: [
      "Sound and music are off for now while we get new ones. The Music bar and the sliders stay, and keep your settings.",
      "Type fps on in the command line (or add ?fps to the address) for a small readout at the top left: frames a second and the slowest parts of each frame. fps off hides it.",
      "For Quacky Zombies: a small map at the bottom left shows the whole cabin, every duck's head, and a red dot for each zombie someone can see.",
      "For Lawyering: a new setting, Vote for attorneys (off at first). Each case, everyone votes for the defense attorney, then the offense attorney, in a window over the board. Each vote lasts 0:20, and drops to 0:05 once the room's vote share has voted. A tie is settled by chance.",
    ],
    fixed: [
      "The game does less work on every move: the rules copy the game faster, and the specials row no longer makes the browser re-measure the page each time.",
      "For Mad God Justin: the ducks, the weapons in hand and the board cost the browser about half the work they did each frame, so the fight runs smoother on slower computers.",
      "For Hangout: ducks far off the screen aren't drawn until they come near (they still walk and play as before).",
      "For Quacky Zombies: the late rounds run much smoother, with lots of zombies on screen.",
      "For Hangout: the night's dark and the fireflies cost far less work each frame, so the cabin runs smoother on slower computers.",
    ],
  },
  {
    id: "v20",
    version: 20,
    date: "Nov 15, 2026",
    title: "6 second votes, the fireplace roll and fair picks",
    news: [
      "Vote for Game Mode and Vote for Map: once the majority has voted (the room's vote share), the clock drops to 0:06 at normal speed.",
      "For Quacky Zombies: the fireplace first rolls for Justin (1 in 100), then the Jaime Bomb (1 in 50); otherwise 85% of spins give a weapon and 15% an item (Medkit, Zebra cake, Adrenaline, Long jump, Jaime, Jetpack, Fireball, Chair).",
      "When chance decides who is an attorney, the Quack, the picker, the Date or the first writer, everyone gets a turn before anyone is picked again, and the same duck is never picked twice in a row.",
    ],
  },
  {
    id: "v19",
    version: 19,
    date: "Nov 14, 2026",
    title: "Faster game mode vote",
    fixed: [
      "Vote for Game Mode: once everyone has voted, its clock drops to 0:10 and runs twice as fast, like the map vote, so nobody waits out the minute.",
    ],
  },
  {
    id: "v18",
    version: 18,
    date: "Nov 14, 2026",
    title: "Quieter music",
    news: [
      "The music is quieter, so the game's sounds come through over it. Your Music slider stays where you put it.",
    ],
  },
  {
    id: "v17",
    version: 17,
    date: "Nov 6, 2026",
    title: "A new map: The King's Festival",
    news: [
      "A new map, The King's Festival: the bare vellum page of an old medieval book, under the board.",
      "While it's played, every letter turns blackletter and the bars, buttons and meters take the burnt amber look of the Nous Within Kenoma book site.",
    ],
  },
  {
    id: "v16",
    version: 16,
    date: "Nov 4, 2026",
    title: "Trivia, Euclid's Squares, the map vote and Jaime Bomb",
    news: [
      "The scroll wheel switches between the specials in your hotbar.",
      "If you aim with the arrow keys and walk with WASD, it works in every mode now: with a weapon in your hand and the mouse sitting still, the arrow keys aim.",
      "The lobby's picture shows the picked map (Tiles and Shelter Sky & Null too), with the plain yellow duck on its cloud. Once in a while it's Justin's duck instead, the same for everyone in the room.",
      "In Game Settings, every game mode's preview is a real look at the game, on the picked map.",
      "Game Settings on a phone: what a row does shows right under it, one row at a time.",
      "Hangout is with the social games now, and Quacky Zombies is with Mad God Justin in the special ones. Duck Cabin in the Map list opens a page with just its two games.",
      "Every change to the game settings shows in the chat, with the name tag of whoever made it.",
      "New rooms start on Vote Maps.",
      "For Quacky Zombies: footsteps (the zombies' quieter, at their own pace), zombie ducks groaning, boards nailed up and torn off, a slot machine at the fireplace, a cash register at Justin's Butler, an eerie sound as each round starts, and louder guns.",
      "For Quacky Zombies: Justin's Butler sells both pistols, the knife, the shotgun and the bow. Bullets are 5 points for 2, arrows 5 points for 5. A gun you already have says Refill and fills it to the top.",
      "For Quacky Zombies: on a computer, B buys ammo for the gun in your hand at the Butler's price, from anywhere (his guns only, when it isn't full, and only if you have the points for all of it). G and B are in the keys at the bottom left now.",
      "For Quacky Zombies: Esc or an arrow key closes the Butler's window at once.",
      "For Quacky Zombies: the shotgun has no magazine: 48 shots, no reloading.",
      "For Quacky Zombies: the fireplace never shows you a weapon you already have.",
      "For Quacky Zombies: Instant Kill, Double Points and Speed Boost last a minute each, into the next round too. When a drop comes, Max Ammo is a little more likely than the others.",
      "For Quacky Zombies: a Nuke gives every duck the points for everything it kills, and each zombie it kills has a 5% chance of 250 more.",
      "For Quacky Zombies: 1 zombie in 400 is Justin.",
      "For Quacky Zombies: on a phone, the flashlight isn't in the hotbar anymore. It just stays on.",
      "For Would You Rather: Add a prompt from Notes lets you pick which box the note goes into; both boxes glow green until you tap one.",
      "On a computer, right-click a note in the Notes list and press Copy to copy its text.",
      "For Quacky Zombies: the cash register rings for ammo bought anywhere with B too.",
      "On a phone, the board takes the whole screen in every mode, upright or on its side, with the bars over it. The joystick starts wherever you put your thumb that isn't a button, on the bars too.",
      "For Quacky Zombies: every zombie has its own scars, cuts, bruises, bites or torn holes, and hits leave wounds: bullet holes (bigger from bigger guns), shotgun pellets, cuts, bruises from the hammer, arrows that stay stuck, chunks torn out, a beak shot off. A headshot blows its head off and shows a big CRIT.",
      "A new map, Euclid's Squares: bright squares, each the biggest that fits in what's left, shrinking forever into three points.",
      "Euclid's Squares can zoom into its tiny squares forever: the map vote and Random sometimes bring it zooming, or pick the map and turn on Zoom under it.",
      "For Quacky Zombies: 1 spin in 100 at the fireplace lands on Justin. He climbs out and plays with you as another player, with 1,500 points of his own, all his HP and the chain gun. He'd rather shoot than stab, keeps away from the zombies and doesn't get cornered.",
      "For Quacky Zombies and Mad God Justin: Invulnerability and Justin on the board can't be turned on, in Game Settings or the command line.",
      "A new mode, Trivia (2 players or more): everyone writes a question, multiple choice or a written answer, then the ducks walk onto the answers they think are right. Whoever wrote it grades the written answers. Genius, Dumbo, Easiest Prompts and Hardest Prompts at the end.",
      "For Bicker Brackets: when the writer is hidden, the cloud shows a multicolored ? instead.",
      "Vote Maps is a round of its own now: when the host starts, three random maps show in the lobby and everyone votes; the most votes win, and a tie is a random pick. Game Settings can show all the maps instead. With Vote Maps or Random, the lobby's picture fades from one map to the next, 10 seconds each, starting on a random one.",
      "A new Game Setting for Agree or Disagree, Would You Rather, DDR and Story Chain, End round button (off unless you turn it on): votes don't end the turn, an End round button does. It shows once enough ducks have voted, and anyone can press it.",
      "For Agree or Disagree: no answer timer by default again. Whoever writes a question can still give it one, and so can the host in Game Settings.",
      "For Trivia: each row is as tall as its answer needs, and when they don't all fit, the board slides down them as you walk, like Story Chain. The ducks on the rows are bigger.",
      "For Trivia: the answers you pick glow yellow, and the right ones turn green when they're shown.",
      "For Trivia: after each answer is shown there are 10 seconds before the next question. Anyone can press the red Stop timer to hold the clock; once everyone lets go it goes on from 5 seconds. Turn it off in Game Settings (Stop timer).",
      "Every weapon works as fast as in Quacky Zombies now, in every mode: the bullets, arrows, daggers and shotgun pellets fly faster, the hammer, dagger and shotgun can be used again sooner, and the knife and hammer swing quicker. The pistol reloads in 1.2 seconds.",
      "On a phone, the joystick starts anywhere on the board in every mode, on the answers, rows and tiles too. A tap on an answer still votes.",
      "On a phone, the board keeps its size through a turn: the top bar stays on one line, and the song bar isn't shown (the music still plays).",
      "On a phone held upright, your duck and its name tag stay on the board and never walk under the bottom bar.",
      "On a phone held upright, the bottom bar is shorter: Jumps (and Justin Kills) sit at the left above Notes and ABC, and your HP sits at the right.",
      "On a phone held upright, the cloud, its duck and the question are a little smaller, and the top bar is a little shorter.",
      "For Trivia: on a phone on its side, the form for writing a question starts at its top and scrolls, never under the bars.",
      "For Hangout: a small End Cabin button in the top left. Click it to vote, click again to take your vote back. When half of the players have voted, a 10 second timer starts on the button, and the cabin ends when it runs out.",
      "For Quacky Zombies: the same vote, called Exit Cabin.",
      "For Quacky Zombies: a headshot's neck keeps spurting blood after the head comes off.",
      "For Quacky Zombies: grenades tear zombies apart, with every chunk, cut and big hole, and blood bursts out of them. Fire leaves burn marks that stay, and Jaime's stabs leave cuts.",
      "Vote Mode & Game, on by default: after the start's countdown, a window over the whole screen to vote for the game mode (1:05), then one for the map (0:20). Click or tap once to vote, again to take it back. Once everyone has voted, the clock runs twice as fast.",
      "The map vote shows every map, and each map's other form as a map of its own: Euclid's Squares (Zoom) and Shelter Sky & Null (Black and white). A map moves while you hover it or hold it, and the one you voted for keeps moving.",
      "Both vote windows have a dice at the top: a random pick.",
      "Vote return: the votes come back every 3 games, or 1, 2, 4, 5, 6 or a random number of games, or never. Its settings sit under Vote Mode & Game on the Game mode and Map pages, with Vote for game mode and Vote for map.",
      "Democracy of Ducklings: Ducks Vote Mode & Game keeps the votes on for good, and Invite Justin brings Justin into every game he can be in. Only another vote undoes a rule, never a host.",
      "The map vote's clock drops to 0:10 once everyone has voted, then runs twice as fast.",
      "Grenades blow up 50% wider in every mode, Quacky Zombies too.",
      "1 Jaime in 20, in every mode, has dynamite strapped to his chest. He says something to Justin as he comes in, and Justin snaps back. When he gets to who he's after, he blows up: the blast is half again as wide as a grenade's and takes all the HP of every duck in it. His body flies off headless.",
      "New special: Jaime Bomb, sent every time, once every 12 seconds. It unlocks after 864 Jaimes, counting the ones you send and Jaime's hits on you.",
      "For Quacky Zombies: the fireplace gives the Jaime Bomb 1 spin in 50, and taking it unlocks it for good. Its blast kills every zombie in it.",
      "Outside Mad God Justin, a Jaime now and then goes for Justin himself. Justin answers at once with a controller or his chair, and a Jaime Bomb takes 3 of those to stop.",
      "For Mad God Justin: a Jaime Bomb takes 3 of Justin's hits to stop, and its blast takes only 3 HP off Justin. Jaime and Justin have new lines for each other.",
      "While your duck is in the game, scrolling over the board (a mouse wheel or a touchpad) only goes through your hotbar and never moves the board. Watching without a duck, it scrolls as before.",
      "New special: Jaime Guard. Jaime follows you around, and whoever hits you, he goes after with the weapon you pick for him in Customize. He has 1 HP. One at a time, once every 12 seconds.",
      "It unlocks when you reach round 30 in Quacky Zombies.",
      "Outside Quacky Zombies and Mad God Justin, hits leave wounds on ducks, the same ones the zombies get. Each wound goes away 6 to 12 seconds after the duck is up again. While it plays dead, they stay.",
      "The pistol and the bow can crit: all the duck's HP, its head blown off, a small CRIT over it, and it plays dead for 4 seconds.",
      "A duck killed by a grenade or a Jaime Bomb is torn apart, headless and burnt, and a Jaime Bomb throws it the way Jaime's body flies.",
      "The hammer knocks ducks back 50% farther.",
      "Vote Mode & Map is now the first row of Game Settings, above Game mode. Its page turns it on or off and holds Vote for game mode, Vote for map and Vote return.",
      "For Quacky Zombies: the zombies get tougher every 4 rounds instead of every 5.",
      "For Quacky Zombies: more zombies come: 25% more in rounds 1 to 4, twice as many in rounds 5 to 8, three times as many in rounds 9 to 12 and four times as many from round 13 on.",
      "For Quacky Zombies: everything Justin's Butler sells costs 20% more, ammo too (6 points for 2 bullets, 6 for 5 arrows).",
      "For Quacky Zombies: Justin's Butler has an Items tab with every item in the game, each in its own category. Tap one to see what it does and its numbers.",
      "For Quacky Zombies: dead zombies stay on the floor 3 seconds longer, and the CRIT is smaller.",
      "Ducks make quiet footsteps as they walk, in every game mode, and a jump makes a soft hup.",
      "Every gun from Quacky Zombies is now a special for every mode with the hotbar: the Sniper, SMG, AK-47, Revolver, LMG, Chain gun and Grenade launcher. Each works as it does there: the SMG, AK-47, LMG and Chain gun fire as long as the button is down, the Chain gun's shot hits at once, and the Grenade launcher's grenade goes off on the first duck it gets to.",
      "They are locked for now. How to unlock them is coming soon.",
      "For Quacky Zombies: a zombie's claw now and then leaves a cut or a bruise on your duck, and it goes away by itself 6 to 12 seconds after you're up, as wounds do in the other modes.",
      "On a computer the board now takes the whole screen too, as it does on a phone: the top bar and the bottom bar sit over it, and Duck Cabin's world goes under them, edge to edge. Notes and a side chat still sit beside it.",
      "With a weapon out, a click anywhere that isn't a button uses it, not only a click on the board.",
    ],
    fixed: [
      "For Quacky Zombies: on a phone, the jump and aim buttons no longer cover the bottom of the Butler's window.",
      "The first HP a duck loses now flashes its HP bar and makes the hit sound, the same as every HP lost after it.",
      "For Trivia: the ducks show on the rows again (they were hidden under the board), and on a computer every answer fits on the screen at once, (A) included.",
    ],
  },
  {
    id: "v15",
    version: 15,
    date: "Nov 3, 2026",
    title: "Duck looks, drops, the jetpack and HP meters",
    news: [
      "Four new settings in Game Settings for how ducks look in a game: Hide customization (every duck plain yellow), Rainbow Ducks (seven rainbow colors and a brown duck in Justin's costume, dealt at random), Vote colors (a duck takes the color of the tile it stands on) and Change player tag color (its name tag too).",
      "In Customize → Style, Match each style's look: turn it on and every style shows, and puts on, its own beak, eyes and colors.",
      "For Quacky Zombies: there are drops now, sometimes a crossed-out zombie head, a bullet, a nuke, an adrenaline shot, a dollar sign or a price tag lands on the floor for 45 seconds. Walk over it for Instant Kill, Max Ammo, Nuke, Speed Boost, Double Points or a Sale at Justin's Butler.",
      "For Quacky Zombies: a jetpack is in the fireplace: switch it on, hold Space (on a phone, the jump button) to fly, Shift keeps you up there, 10 seconds of flight. It's a special too, unlocked at 20,736 Jumps (not in Mad God Justin).",
      "For Mad God Justin: new in your hotbar: a bow (2), Jaime (3, he charges at Justin), the weapon you picked up (4) and a zebra cake (5) to keep him busy. To get a downed duck up, stand by it and hold E for 5 seconds (on a phone, hold the button over it).",
      "For Mad God Justin: he is bigger and faster, with a bigger hammer. He fires a light machine gun, an SMG and his shotgun (no more pistol), and now and then shakes red and charges a duck, sending it flying (no damage: step aside or jump). He turns off his Xbox once he's lost 20 HP and the meteor comes at 10 HP (giving him 20 back); each time his attacks come faster. His double shows up after every teleport.",
      "Arrows, bullets and throwing daggers fly a little faster in every mode.",
      "The guns, the hits, the quacks and the specials are louder now, about as loud as the music, and still with no pops.",
      "For Quacky Zombies: no music for now.",
      "For Mad God Justin: no music for now.",
      "On a computer, the key hints at the bottom left now say that Shift and a special's number key keep it on (Customize → Specials says so too).",
      "In Customize → Colors, the colors of hats, beaks, clothes, face items and specials are folded into one More colors list, so the menu is shorter.",
      "The Jetpack, Bow, Chair, Zebra cake and Jaime have a preview in Customize → Specials now.",
      "The knife stabs four times a second in every mode.",
      "For Quacky Zombies: after each round the next one waits until enough ducks press End turn, and the game starts at round 0 until enough ducks press Ready.",
      "For Quacky Zombies: a new setting, Round 16 Start: after round 0 it skips to round 16 and every duck starts with 3,000 points. It has its own stats.",
      "For Quacky Zombies: the fireplace costs 750 and every duck can spin it, even while someone else's weapon is still in the fire. The chair is in it now: three throws, and a Max Ammo gives them back.",
      "For Quacky Zombies: Justin's Butler's upgrades cost twice as much, a board is worth 5 points, the zombies are 20% slower and the ducks 5% faster.",
      "For Quacky Zombies: the drops fall from a zombie you kill and stay for a minute, into the next round too. The zebra cake draws every zombie, and they keep eating it until it's gone. The sniper's bullet goes through three zombies.",
      "For Quacky Zombies: the Long jump and the jetpack switch on and off without taking the weapon out of your hand.",
      "Your HP is a red meter under your hotbar now, a block for each HP, and it glows red when you're nearly out. A thin blue bar under it shows how much sprint you have left where sprinting runs out.",
      'A little "+1 HP" or "-1 HP" floats over a duck, Justin or a zombie when it gains or loses HP. The HP in the player tag is see-through red blocks now.',
      "For Mad God Justin: Justin's HP is in blocks too, and he gets 1 HP back each time he finishes eating.",
      "For Quacky Zombies and Mad God Justin: on a computer, the other ducks' HP is in the board's bottom right corner, and goes see-through when your duck walks into it. Turn it off in Settings (Other players' HP).",
    ],
    fixed: [
      "For Mad God Justin: hitmarkers show on Justin (and look the same on his double), the weapon you pick up goes in hand by itself and you go back to your last one when it runs out, and a Jaime's name tag says Jaime.",
      "For Mad God Justin: when every duck is down they all lie there dead, and the ending says Justin Wins (it no longer says time is up).",
      "For Quacky Zombies: boarding up the east wall pays points again (each opening has its own 50 points a round).",
      "For Quacky Zombies: the deck and the balcony run smoother: the forest, the pool and the yard, which nobody can get to, aren't made at all now.",
    ],
  },
  {
    id: "v14",
    version: 14,
    date: "Nov 3, 2026",
    title: "Fireplace weapons",
    news: [
      "For Quacky Zombies: the fireplace has twelve new things in it: a sniper (its bullet goes through every zombie), an SMG, an AK-47 and an LMG (hold the button down), a chain gun, a revolver, a grenade launcher, a zebra cake the zombies go for, a fireball that sets them on fire, an adrenaline shot (full speed for 20 seconds), the Long jump, and Jaime (three a round).",
    ],
  },
  {
    id: "v13",
    version: 13,
    date: "Nov 3, 2026",
    title: "Jaime, a tougher Justin and harder hits",
    news: [
      "Jaime is a special now too: unlock him by being in Mad God Justin while Jaimes stab him 36 times (anyone's). Out of Mad God Justin he goes for the duck you just hit, or else the one who just hit you, or else the nearest.",
    ],
    fixed: [
      "For Mad God Justin: Justin has 12 more HP for every player.",
      "Hits hurt more on the boards and in Duck Cabin (not in Quacky Zombies or Mad God Justin): the hammer, the chair and a grenade take 3 HP, the knife 2, and a grenade throws ducks twice as far as the hammer. A knocked-down duck stays down 1 s by default (was 0.5 s). In Mad God Justin, his office chair takes 2 HP.",
      "For Valentine's Duck Date: at the table, the weapon in your hand comes with you (it stayed on the floor where you stood).",
    ],
  },
  {
    id: "v12",
    version: 12,
    date: "Nov 3, 2026",
    title: "Game Settings, Democracy of Ducklings and Board Justin",
    news: [
      "For Mad God Justin: a new setting in Game options (with Justin on): Justin has 10 HP, and whoever hurts him gets his Mad God Justin attacks for 10 seconds. Your Justin Kills show under your Jumps whenever he's in the game, and beating Mad God Justin counts as one for everyone in the fight.",
      "Four new specials to unlock: Short jump (1,728 Jumps: lower and quicker; kept on, it turns Long jump and Double jump off), Chair (kill Justin 1,123 times in Duck Cabin: throw his office chair), Zebra cake (beat Justin 72 times: throw it and Justin runs off to eat it) and Invisible duck (hit Duck Cabin's shadow duck with a thrown chair: your duck goes see-through, like it).",
      "Game Settings fills the screen: Game mode, Map and Game Options, with a picture of each. Vote Game Mode and Vote Maps let every duck vote; Random plays a different game every round (True Random: any game, any time).",
      "Democracy of Ducklings, under Game Settings in the lobby: the ducks vote on the room's rules (the host readies too, the map and the game are always voted, everyone changes the settings, Sudo Perms, a new host). 2 of 3 ducks pass a vote; a new host takes every duck. The host can turn it off when making the room.",
    ],
  },
  {
    id: "v11",
    version: 11,
    date: "Nov 3, 2026",
    title: "Quacky Zombies points and phone specials",
    news: [
      "For Quacky Zombies: you earn points by hitting zombies and boarding up, then spend them with Justin's Butler by the card table (upgrades) or at the fireplace (210 for a random weapon). Your slots: a melee weapon (blue), two ranged (red), a special (purple, 4) and the grenades (white).",
      "On a phone: your specials are a slider at the bottom (slide to pick one, tap it to use it, the purple square keeps it on), in every mode. The up-arrow button at the bottom right jumps (a tap on the board doesn't any more), and with something that attacks picked, the aim stick comes in under it: push it to aim, then a little further to attack.",
      "In Customize → Specials, Remove from hotbar (at the top and the bottom of the list) takes specials off your keys with one tap each, so the slider has fewer to slide through.",
    ],
    fixed: [
      "For Quacky Zombies: the zombies (and the computers) walk faster or slower with the lobby's Walking speed, just like your duck, so on Slow they no longer keep up with you.",
      "A computer with a touch screen gets the computer's controls in every mode (the bar of weapons and specials, the key hints), not the phone's.",
      "No more broken picture icons on the map in Firefox (the candles).",
      "For Quacky Zombies: your duck walks 20% faster, sprinting goes from that, and the zombies keep the same pace next to it. The dark is a little lighter, still dark.",
      "For Quacky Zombies: the boards over the holes lie flat on their walls, and at the fireplace E takes the weapon even when you hold your knife (a ranged one swaps out your first ranged weapon).",
    ],
  },
  {
    id: "v10",
    version: 10,
    date: "Nov 3, 2026",
    title: "Quacky Zombies, Shelter Sky & Null and Dat Boi",
    news: [
      "For Mad God Justin: you have 6 HP and blink after a hit, a Jump dodges, and WASD walks while the arrow keys aim. He throws a fireball that sets ducks on fire, lights up the edges, teleports, splits in two and turns off his Xbox. There's no time limit: the fight goes on until he's beaten or every duck is out.",
      "The bow is in every mode now, and every duck takes 3 hits before it goes down.",
      "A new map, Shelter Sky & Null: a black tree and a halftone duck under red clouds. Its setting in Game options turns it black and white.",
      "A new style in Customize, Dat Boi, unlocked at 1,728 Jumps, with metal ranks and a rainbow one to unlock after him.",
      "A new mode in Duck Cabin, Quacky Zombies: the power's out and zombie ducks come in round after round. Hold E to board up the doors and holes or to get a downed friend up, and see how long you last.",
      "For Quacky Zombies: you get a knife (1), a pistol (2, R reloads), a bow (3), two grenades (G) and a flashlight (0). Shift sprints. On a phone they're in the slider at the bottom, like your specials.",
    ],
    fixed: [
      "Your duck walks over ducks that are knocked down, so it can't get stuck between them (in Mad God Justin, a duck out of HP lies there for the whole fight).",
      "On a slow frame your duck no longer stops a step away from another duck: it walks right up to it.",
      "Lightning's crack starts smoothly, with no click.",
      "A turn ends once 2 of 3 players are done by default (it was 3 of 4, so with 3 players all 3 had to finish).",
      "With the music muted on the main menu, the song name no longer blinks on and off.",
      "The secret code unlocks every item that can be unlocked, Dat Boi and his ranks too, and your progress toward each one keeps counting.",
    ],
  },
  {
    id: "2026-11-02",
    version: 9,
    date: "Nov 2, 2026",
    title: "Valentine's Duck Date",
    news: [
      "A new mode, Valentine's Duck Date (3 players or more): one duck is The Date, everyone else a Suitor. The Date writes the topic, then dates each Suitor at a fancy dining table.",
      "For Valentine's Duck Date: after each turn The Date walks onto a Suitor's tile to turn them down, or stays off the tiles to turn nobody down. The last Suitor left is the Valentine.",
      "For Valentine's Duck Date: the stats are Sweet Valentine and Most Jumps. A date timer (1 minute, with 10 seconds of grace) can be changed or turned off in the lobby.",
    ],
  },
  {
    id: "2026-11-01",
    version: 8,
    date: "Nov 1, 2026",
    title: "Mad God Justin fixes",
    news: [
      "For Mad God Justin: a handgun or a dagger you pick up has three uses, shown as dots on its key.",
      "For Mad God Justin: when Justin's meteor lands, he gets 2 or 3 HP back for every player, and the timer comes back with 30 seconds left.",
    ],
    fixed: [
      "For Mad God Justin: V stabs or uses the weapon you picked up.",
      "The meter on a knocked-down player's name shows on dark player cards too, and on Good Justin God's.",
      "Players with an imported picture get a plain meter, without the streaks.",
    ],
  },
  {
    id: "2026-10-31",
    version: 7,
    date: "Oct 31, 2026",
    title: "Cancel the start, and a loading screen",
    news: [
      "Any player can cancel a starting game with the X key or the Cancel button.",
      "The screen fades to black while the start counts down, then a loading screen shows your duck, your ping and a bar, and the game fades back in.",
      "For Mad God Justin: every 15 seconds something falls in. Walk over a weapon to use it once; lightning, fire and meteors hit him by themselves; and sometimes Good Justin God comes to help.",
      "For Mad God Justin: Justin wears devil horns in his fight, and cries when he loses. Lose to him 24 times, or lose 144 rounds, to unlock his Tears eyes.",
    ],
    fixed: [
      "Settings → Controls lists every key as it works now: V for your special, R to reload, and more.",
    ],
  },
  {
    id: "2026-10-30",
    version: 6,
    date: "Oct 30, 2026",
    title: "Duncelation and Mad God Justin",
    news: [
      "A new game, Mad God Justin: everyone gets a knife, and together you stab Justin down before the timer runs out. He shoots back.",
      "For Mad God Justin: late in the fight he calls a meteor down on everyone and comes back with a pump shotgun.",
      "For Mad God Justin: beat him 12 times at the default time (1:30) to unlock his lightning eyes.",
      "For Mad God Justin: get close to him and your knife stabs by itself, no button needed.",
      "A new game, Duncelation: defend the take you get while everyone walks to Dunce or Not a Dunce.",
      "For Duncelation: a player voted a dunce gets lightning, the LOSER podium, and the dunce hat in black and white for the rest of the game.",
      "For Duncelation: the dunce hat is now locked: be voted a dunce 12 times to wear it.",
      "Report Bug or Suggest Ideas, at the bottom of this window and of Settings.",
      "For Duncelation: End round, beside Vote. It ends the take once the defender and enough players press it.",
      "A hit sound, like Minecraft's but a quacky duck's, whenever a player (or Justin) is hit.",
      "The knife and the hammer hit anyone they touch while they swing, not only at the press.",
      "V uses the special you're holding out, or the last one you used.",
      "Knocked down: a quick see-through red flash, and a meter on your name that empties until you get back up. Justin flashes red when hit.",
      "New specials: the Shotgun (knock down 144 players) and the Grenade (360, once every 12 seconds). Any Justin counts.",
      "Unlocks now count in 12s: Long jump and Double jump at 144 Jumps, the jester at 1,728, Jack in a Box at 20,736.",
      "For Lawyering: no circle. The attorneys stay on their own side, with a sword or a shield by their name and a glow.",
      "For Lawyering and Duncelation: a player who drops out comes back to their place. Until then, Next round goes on without them.",
    ],
    fixed: [
      "On a computer, the music no longer crackles or pops while other apps (like Discord) keep it busy.",
      "Settings → Controls shows the piano's keys as they are now (the old sharp and flat keys are gone).",
    ],
  },
  {
    id: "2026-10-29",
    version: 5,
    date: "Oct 29, 2026",
    title: "Waiting for players and floating chat",
    news: [
      "A game that drops below the players it needs waits for them instead of ending.",
      "The newest chat message floats by the chat button for a moment (Settings → Chat).",
      "Justin swings a hammer now and then, and calls down lightning or fire.",
      "Lawyering is now Lawyering; Juryful of Ducklings, and Bicker Brackets can have 64 contenders.",
      "The last writers get 30 seconds once enough have sent theirs, and unvoting stops the countdown.",
      "For Hangout: no ghost while you're busy at the piano, the chalk, a table or a seat.",
      "Upcoming Updates and Release Dates, at the bottom of this window.",
    ],
    fixed: [
      "For Who is the Quack?: it never shows who is picking the secret word.",
      "Tapping on a phone no longer selects words or pops up a search.",
      "On phones, a toggled special shows its wait on the Specials button.",
    ],
  },
  {
    id: "2026-10-28",
    version: 4,
    date: "Oct 28, 2026",
    title: "Weapons, ghosts and poker",
    news: [
      "New specials: a knife, a hammer (or wrench) and a pistol that holds 7 shots; R reloads.",
      "For Hangout: a new setting turns knocked-out ducks into ghosts that can walk around; Space brings the body back.",
      "For Hangout: poker at the card table, and you can invite Justin to play.",
      "A knocked-down duck stands up by itself, so you can stay at the table.",
      "Low graphics in Settings, and the font list folds away.",
      "A Stats screen switch for every game, and Review each round for Bicker Brackets (off by default).",
      "For Story Chain: a glowing hint from the cloud and an arrow down to the secret words.",
    ],
    fixed: [
      "2/3 of votes now ends the turn at 2 of 3 players.",
      "For Bicker Brackets: it shows the right side on phones.",
      "The piano's get-up button says Esc.",
      "Colorblind mode recolors the two-sided boards.",
      "The music bar stays still when the music is turned all the way down.",
    ],
  },
  {
    id: "2026-10-27",
    version: 3,
    date: "Oct 27, 2026",
    title: "Blackjack, Jack in a Box and outfits",
    news: [
      "For Hangout: blackjack on the round table, with eight stools and Justin's Butler dealing.",
      "Jack and Jill in a Box, plus jester and clown items; locked ones show how to get them.",
      "A real pumpkin, antenna eyes and color dropdowns.",
      "Justin joins every game mode.",
    ],
    fixed: [
      "Outfit fixes: the biker jacket, Swiss cheese, the gold crown and the coolest-first metals.",
      "The wing shows under tank tops and jerseys.",
      "Fewer pops and crackles in songs and the piano.",
    ],
  },
  {
    id: "2026-10-26",
    version: 2,
    date: "Oct 26, 2026",
    title: "Power box and the dark",
    news: [
      "For Hangout: Duck Cabin has a power box: flip the lever and the lights, the TV and the music go out.",
      "For Hangout: it is darker outside, flames can be put out, and the music sounds muffled in the dark.",
    ],
    fixed: [
      "For Hangout: the Duck Cabin phone button no longer sits under tips.",
      "Key hints are hidden on touch-only phones.",
    ],
  },
  {
    id: "2026-10-25",
    version: 1,
    date: "Oct 25, 2026",
    title: "Night Show and the toy train",
    news: [
      "The Night Show room has a toy train.",
      "For Hangout: Duck Cabin's cats, Justin and the shadow duck.",
    ],
    fixed: ["Players who join mid-game play right away."],
  },
];

/* what's coming: the owner sets each date (blank: "Date to be announced"); a thing leaves this list once it's out */
export const UPCOMING = [];

const KEY = "duckfriends-updates-seen";
export const seenUpdate = () => {
  try {
    return localStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
};
export const hasNewUpdate = () => seenUpdate() !== UPDATES[0].id;
const markSeen = () => {
  try {
    localStorage.setItem(KEY, UPDATES[0].id);
  } catch (e) {
    /* blocked */
  }
};

const list = (cls, head, items = []) =>
  items.length
    ? `<h3 class="up-h ${cls}">${head}</h3><ul class="up-list">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
    : "";

export function openUpdates() {
  markSeen();
  return openWindow(
    `<h2 class="up-title">${rainbowHTML("Updates")}</h2>
    <div class="up-nav"><button type="button" class="btn ghost up-arrow" data-d="1" aria-label="Older update">◀</button>
      <div class="up-head"><b class="up-ver"></b><span class="up-date"></span><span class="up-name"></span></div>
      <button type="button" class="btn ghost up-arrow" data-d="-1" aria-label="Newer update">▶</button></div>
    <div class="up-body"></div><p class="up-count dim"></p>
    <p class="up-count"><button type="button" class="linkbtn" data-a="upcoming">Upcoming Updates and Release Dates</button></p>${reportLinkHTML()}`,
    {
      cls: "win-updates",
      onOpen(w) {
        let i = 0;
        const show = (n) => {
          i = Math.max(0, Math.min(UPDATES.length - 1, n));
          const u = UPDATES[i];
          w.querySelector(".up-ver").textContent = `Version ${u.version}`;
          w.querySelector(".up-date").textContent = u.date;
          w.querySelector(".up-name").textContent = u.title;
          const body = w.querySelector(".up-body");
          body.innerHTML =
            list("new", "New", u.news) + list("fix", "Fixed", u.fixed);
          body.scrollTop = 0; // each version starts at its top
          w.querySelector(".up-count").textContent =
            `${i + 1} of ${UPDATES.length}`;
          w.querySelector('[data-d="1"]').disabled = i === UPDATES.length - 1;
          w.querySelector('[data-d="-1"]').disabled = i === 0;
        };
        w.querySelectorAll(".up-arrow").forEach(
          (b) => (b.onclick = () => show(i + +b.dataset.d)),
        );
        w.querySelector('[data-a="upcoming"]').onclick = openUpcoming;
        w.querySelector('[data-a="report"]').onclick = openReport;
        const key = (e) => {
          if (!w.isConnected) return removeEventListener("keydown", key, true);
          if (e.key === "ArrowLeft") {
            show(i + 1);
            e.preventDefault();
          } else if (e.key === "ArrowRight") {
            show(i - 1);
            e.preventDefault();
          }
        };
        addEventListener("keydown", key, true);
        show(0);
      },
    },
  );
}

/* what's coming next, and when (over the Updates window; its X or Esc goes back to it) */
export function openUpcoming() {
  return openWindow(
    `<h2 class="up-title">${rainbowHTML("Upcoming")}</h2>
    <div class="up-body">${UPCOMING.length ? `<ul class="up-list">${UPCOMING.map((u) => `<li><b>${esc(u.title)}</b><br><span class="dim small">${u.date ? `Release date: ${esc(u.date)}` : "Release date to be announced"}</span></li>`).join("")}</ul>` : '<p class="dim">Nothing announced yet.</p>'}</div>`,
    { cls: "win-updates" },
  );
}
