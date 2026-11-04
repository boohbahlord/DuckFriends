/* ---------- Updates ----------
   What changed, newest first, one page per day, each a "Version N" (N counts the deployments of the game: the merges to main up to that day). The Updates button on the front page opens this window and shows a dot
   until the newest page has been opened on this device. I want short, plain words for players, not a list of everything. */
import { openWindow, esc } from "./ui.js";
import { rainbowHTML } from "./art.js";
import { openReport, reportLinkHTML } from "./report.js";

export const UPDATES = [
  {
    id: "2026-11-03",
    version: 138,
    date: "Nov 3, 2026",
    title: "Quacky Zombies, and Mad God Justin reworked",
    news: [
      "The scroll wheel switches between the specials in your hotbar.",
      "If you aim with the arrow keys and walk with WASD, it works in every mode now: with a weapon in your hand and the mouse sitting still, the arrow keys aim.",
      "The lobby's picture shows the picked map (Tiles and Shelter Sky & Null too), with the plain yellow duck on its cloud. Once in a while it's Justin's duck instead, the same for everyone in the room.",
      "In Game Settings, every game mode's preview is a real look at the game, on the picked map.",
      "Your HP is a red meter under your hotbar now, a block for each HP, and it glows red when you're nearly out. A thin blue bar under it shows how much sprint you have left where sprinting runs out.",
      'A little "+1 HP" or "-1 HP" floats over a duck, Justin or a zombie when it gains or loses HP. The HP in the player tag is see-through red blocks now.',
      "For Mad God Justin: Justin's HP is in blocks too, and he gets 1 HP back each time he finishes eating.",
      "For Quacky Zombies and Mad God Justin: on a computer, the other ducks' HP is in the board's bottom right corner, and goes see-through when your duck walks into it. Turn it off in Settings (Other players' HP).",
      "The guns, the hits, the quacks and the specials are louder now, about as loud as the music, and still with no pops.",
      "For Quacky Zombies: no music for now.",
      "For Mad God Justin: no music for now.",
      "A new mode in Duck Cabin, Quacky Zombies: the power's out and zombie ducks come in round after round. Hold E to board up the doors and holes or to get a downed friend up, and see how long you last.",
      "For Quacky Zombies: you get a knife (1), a pistol (2, R reloads), a bow (3), two grenades (G) and a flashlight (0). Shift sprints. On a phone they're in the slider at the bottom, like your specials.",
      "For Quacky Zombies: you earn points by hitting zombies and boarding up, then spend them with Justin's Butler by the card table (upgrades) or at the fireplace (210 for a random weapon). Your slots: a melee weapon (blue), two ranged (red), a special (purple, 4) and the grenades (white).",
      "For Mad God Justin: you have 6 HP and blink after a hit, a Jump dodges, and WASD walks while the arrow keys aim. He throws a fireball that sets ducks on fire, lights up the edges, teleports, splits in two and turns off his Xbox. There's no time limit: the fight goes on until he's beaten or every duck is out.",
      "For Mad God Justin: new in your hotbar: a bow (2), Jaime (3, he charges at Justin), the weapon you picked up (4) and a zebra cake (5) to keep him busy. To get a downed duck up, stand by it and hold E for 5 seconds (on a phone, hold the button over it).",
      "The bow is in every mode now, and every duck takes 3 hits before it goes down.",
      "A new map, Shelter Sky & Null: a black tree and a halftone duck under red clouds. Its setting in Game options turns it black and white.",
      "A new style in Customize, Dat Boi, unlocked at 1,728 Jumps, with metal ranks and a rainbow one to unlock after him.",
      "On a phone: your specials are a slider at the bottom (slide to pick one, tap it to use it, the purple square keeps it on), in every mode. The up-arrow button at the bottom right jumps (a tap on the board doesn't any more), and with something that attacks picked, the aim stick comes in under it: push it to aim, then a little further to attack.",
      "For Mad God Justin: a new setting in Game options (with Justin on): Justin has 10 HP, and whoever hurts him gets his Mad God Justin attacks for 10 seconds. Your Justin Kills show under your Jumps whenever he's in the game, and beating Mad God Justin counts as one for everyone in the fight.",
      "Game Settings fills the screen: Game mode, Map and Game Options, with a picture of each. Vote Game Mode and Vote Maps let every duck vote; Random plays a different game every round (True Random: any game, any time).",
      "Democracy of Ducklings, under Game Settings in the lobby: the ducks vote on the room's rules (the host readies too, the map and the game are always voted, everyone changes the settings, Sudo Perms, a new host). 2 of 3 ducks pass a vote; a new host takes every duck. The host can turn it off when making the room.",
      "In Customize → Specials, Remove from hotbar (at the top and the bottom of the list) takes specials off your keys with one tap each, so the slider has fewer to slide through.",
      "Four new specials to unlock: Short jump (1,728 Jumps: lower and quicker; kept on, it turns Long jump and Double jump off), Chair (kill Justin 1,123 times in Duck Cabin: throw his office chair), Zebra cake (beat Justin 72 times: throw it and Justin runs off to eat it) and Invisible duck (hit Duck Cabin's shadow duck with a thrown chair: your duck goes see-through, like it).",
      "For Quacky Zombies: the fireplace has twelve new things in it: a sniper (its bullet goes through every zombie), an SMG, an AK-47 and an LMG (hold the button down), a chain gun, a revolver, a grenade launcher, a zebra cake the zombies go for, a fireball that sets them on fire, an adrenaline shot (full speed for 20 seconds), the Long jump, and Jaime (three a round).",
      "Jaime is a special now too: unlock him by being in Mad God Justin while Jaimes stab him 36 times (anyone's). Out of Mad God Justin he goes for the duck you just hit, or else the one who just hit you, or else the nearest.",
      "For Quacky Zombies: there are drops now, sometimes a crossed-out zombie head, a bullet, a nuke, an adrenaline shot, a dollar sign or a price tag lands on the floor for 45 seconds. Walk over it for Instant Kill, Max Ammo, Nuke, Speed Boost, Double Points or a Sale at Justin's Butler.",
      "For Quacky Zombies: a jetpack is in the fireplace: switch it on, hold Space (on a phone, the jump button) to fly, Shift keeps you up there, 10 seconds of flight. It's a special too, unlocked at 20,736 Jumps (not in Mad God Justin).",
      "Four new settings in Game Settings for how ducks look in a game: Hide customization (every duck plain yellow), Rainbow Ducks (seven rainbow colors and a brown duck in Justin's costume, dealt at random), Vote colors (a duck takes the color of the tile it stands on) and Change player tag color (its name tag too).",
      "In Customize → Style, Match each style's look: turn it on and every style shows, and puts on, its own beak, eyes and colors.",
      "For Mad God Justin: he is bigger and faster, with a bigger hammer. He fires a light machine gun, an SMG and his shotgun (no more pistol), and now and then shakes red and charges a duck, sending it flying (no damage: step aside or jump). He turns off his Xbox once he's lost 20 HP and the meteor comes at 10 HP (giving him 20 back); each time his attacks come faster. His double shows up after every teleport.",
      "Arrows, bullets and throwing daggers fly a little faster in every mode.",
      "The knife stabs four times a second in every mode.",
      "For Quacky Zombies: after each round the next one waits until enough ducks press End turn, and the game starts at round 0 until enough ducks press Ready.",
      "For Quacky Zombies: a new setting, Round 16 Start: after round 0 it skips to round 16 and every duck starts with 3,000 points. It has its own stats.",
      "For Quacky Zombies: the fireplace costs 750 and every duck can spin it, even while someone else's weapon is still in the fire. The chair is in it now: three throws, and a Max Ammo gives them back.",
      "For Quacky Zombies: Justin's Butler's upgrades cost twice as much, a board is worth 5 points, the zombies are 20% slower and the ducks 5% faster.",
      "For Quacky Zombies: the drops fall from a zombie you kill and stay for a minute, into the next round too. The zebra cake draws every zombie, and they keep eating it until it's gone. The sniper's bullet goes through three zombies.",
      "For Quacky Zombies: the Long jump and the jetpack switch on and off without taking the weapon out of your hand.",
      "On a computer, the key hints at the bottom left now say that Shift and a special's number key keep it on (Customize → Specials says so too).",
      "In Customize → Colors, the colors of hats, beaks, clothes, face items and specials are folded into one More colors list, so the menu is shorter.",
      "The Jetpack, Bow, Chair, Zebra cake and Jaime have a preview in Customize → Specials now.",
    ],
    fixed: [
      "For Quacky Zombies: the deck and the balcony run smoother: the forest, the pool and the yard, which nobody can get to, aren't made at all now.",
      "For Quacky Zombies: boarding up the east wall pays points again (each opening has its own 50 points a round).",
      "For Mad God Justin: when every duck is down they all lie there dead, and the ending says Justin Wins (it no longer says time is up).",
      "For Mad God Justin: hitmarkers show on Justin (and look the same on his double), the weapon you pick up goes in hand by itself and you go back to your last one when it runs out, and a Jaime's name tag says Jaime.",
      "For Valentine's Duck Date: at the table, the weapon in your hand comes with you (it stayed on the floor where you stood).",
      "Hits hurt more on the boards and in Duck Cabin (not in Quacky Zombies or Mad God Justin): the hammer, the chair and a grenade take 3 HP, the knife 2, and a grenade throws ducks twice as far as the hammer. A knocked-down duck stays down 1 s by default (was 0.5 s). In Mad God Justin, his office chair takes 2 HP.",
      "For Mad God Justin: Justin has 12 more HP for every player.",
      "Your duck walks over ducks that are knocked down, so it can't get stuck between them (in Mad God Justin, a duck out of HP lies there for the whole fight).",
      "On a slow frame your duck no longer stops a step away from another duck: it walks right up to it.",
      "Lightning's crack starts smoothly, with no click.",
      "A turn ends once 2 of 3 players are done by default (it was 3 of 4, so with 3 players all 3 had to finish).",
      "For Quacky Zombies: the zombies (and the computers) walk faster or slower with the lobby's Walking speed, just like your duck, so on Slow they no longer keep up with you.",
      "With the music muted on the main menu, the song name no longer blinks on and off.",
      "A computer with a touch screen gets the computer's controls in every mode (the bar of weapons and specials, the key hints), not the phone's.",
      "No more broken picture icons on the map in Firefox (the candles).",
      "For Quacky Zombies: your duck walks 20% faster, sprinting goes from that, and the zombies keep the same pace next to it. The dark is a little lighter, still dark.",
      "For Quacky Zombies: the boards over the holes lie flat on their walls, and at the fireplace E takes the weapon even when you hold your knife (a ranged one swaps out your first ranged weapon).",
      "The secret code unlocks every item that can be unlocked, Dat Boi and his ranks too, and your progress toward each one keeps counting.",
    ],
  },
  {
    id: "2026-11-02",
    version: 108,
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
    version: 107,
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
    version: 106,
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
    version: 103,
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
    version: 98,
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
    version: 96,
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
    version: 87,
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
    version: 80,
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
    version: 58,
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
