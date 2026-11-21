/* ---------- Sandbox: the help manual (the owner's, Nov 19 21:59Z and 23:10Z, and Nov 20 19:02Z) ----------
   The last option of B, M, P, H and G opens the help manual at that window's part. "The help manual should not be one
   long text. It should be like you click it and then there's buttons that take you to different parts of text. And the
   help manual also includes ... the help files as they are for Seriat in the Seriat coder ... in their own path where
   you click buttons and it takes you to given files or other categories": its first page is a button for each part and
   one for the Seriat help files; a part lists its topics as buttons; the Seriat files go by folder, then file, each
   shown exactly as it is in the Seriat window's help/ folder (numerathelp.js). A path at the top goes back to any page.
   The words are short and say what to press or drag (the Seriat window has its own bible: seriatbible.js). */
import { esc, openWindow } from "./ui.js";
import { LANG } from "./langname.js";
import { HELP, EXAMPLES } from "./numerathelp.js";

export const SB_HELP = {
  b: [
    [
      "Build zones",
      "Pick Zone in Build, then click or tap the map to put it down. Esc or right-click lets go. Hold Shift while you place and it keeps placing.",
    ],
    [
      "Moving what you placed",
      "Hold the left mouse on it and drag. While you hold it, the arrow keys turn it. Double-click it for handles that change its size (Esc puts them away). Hold Shift and drag across an empty spot to select everything inside; drag one of them and they all move. Backspace lets go of a selection. Right-click it for Properties, Copy, Cut, Lock, Snap, Direction and Overlay (Copy all and Cut all on a selection); on an empty spot, Paste. On a phone, hold your finger still on it for half a second.",
    ],
    [
      "Hitbox tiles and Snap",
      "A zone is made of the small hitbox tiles on the ground, the same tiles that tell where a duck stands (a duck is four tiles long). Every distance in Sandbox and Seriat is in tiles. A tile is the zone's when its shape covers 0.6 of it or more, so a circle is a little blocky at its edge. Sizes go in whole tiles. Right-click, Snap: Snap to grid (on by default) keeps the zone on the ground's tiles and turns it a quarter at a time; turned off, it goes anywhere and turns freely, and the 0.6 rule still counts. Fixed zone: no other zone on its overlay level can be put on it, and it can't be put on one. It only changes building.",
    ],
    [
      "Direction",
      "Right-click, Direction: Flip horizontally or Flip vertically mirrors the zone's shape. Rotate shows a ring with a circular arrow in the zone's middle: drag the arrow round and the zone turns to face it. Press anywhere else to put it away.",
    ],
    [
      "Overlay levels",
      "Right-click, Overlay, Set overlay level puts a zone on a level from 1 to 10. While building you only see the level you're on: Shift+O then a number key (0 is level 10), or Tools, Overlay level on a phone. New zones go on the level you're on. Nothing changes in play. Move up and Move down are not an overlay level: they only change which zone is drawn on top of the other.",
    ],
    [
      "Tabs and the zone budget",
      "In a block's window, + adds a tab: a spawn, respawn, loot or zone that works on the same block, so one block can do several things at once. Each tab counts toward the zone budget (shown in Build): 50 blocks and tabs at most.",
    ],
    [
      "Tabs and their zone",
      "A Spawn, Respawn or Loot tab works in the zone on its block (the block itself or one of its Zone tabs) that shares its variable name, its color, or both. Every new tab gets six numbers as its variable name until you type one; a tab made from a zone's Type takes that zone's name and color. A zone's Type box lists what it holds. With more than one zone on a block, Leads with (under Type) picks the one that sets its look.",
    ],
    [
      "Potential order",
      "At the end of each tab, Potential order cuts the block into squares and picks which of them work right now: true random, absolute (random over the whole map: only the picks that land in the block work), four shuffles (every square once before any repeats, in a new order each round, the same order each round, by rows or by columns), one after another (with a direction), alternating like a checkerboard, or all at once. Squares at once, Square size and Seconds per step set how many, how big and how fast; Steps: On a timer, or One step each use (each spawn, respawn or drop). In Build the working squares are drawn filled.",
    ],
    [
      "What a zone is",
      "Open a zone (E beside it, or right-click and Properties) and pick at the top what it is: just a zone, a spawn (it makes things) or a respawn (players come back there). A spawn gets a key or a spot on the hotbar in H.",
    ],
    [
      "Walls, Inverse and Dark outside",
      "In a zone, tick who can't pass to make it a wall to them (a thin zone makes a thin wall); they walk round it. Inverse makes a zone, or a tab, work outside its zone instead (and outside every zone with its name or color). Dark outside darkens everything round the zone while you stand in it.",
    ],
    [
      "Elevation and Ground",
      "On Duck Cabin and Downpour a zone has an Elevation: 1 is the ground, each one more is a gas station roof higher, up to 6. Turn Ground on and it's a floor up there: you stand on it, walk off its edge and fall, and you fall when its squares stop working under you. Falling two floors takes twice as long as one. Tick who can climb a zone and they climb it up to its elevation by walking into it, as up a ladder; let go of the stick and they hold on, walk away and they fall. Give a Ground zone a Slope up to another elevation and pick the side it rises toward: it's a ramp from its own elevation up to that one, walked at walking pace, so a longer slope takes longer. A zone up high is drawn over what's behind and under it, and goes see-through while your duck is back there. One that isn't Ground is a block: give it a look and its front side shows all the way down to the ground, like a wall. On the plain board an Elevation of 2 or more puts the zone's look over everyone.",
    ],
    [
      "A house",
      "A floor: a zone with a Look. Walls: thin zones with a Look at Elevation 3, and an invisible wall under each (Is wall, no Look); leave a gap in the front one for a door. A roof: a zone over all of it with a Look at Elevation 3 (turn Ground on to walk on it). From outside the walls and roof cover who's inside; step in and the whole house goes see-through. On the plain board: Is wall zones with a Look, and a roof at Elevation 2.",
    ],
    [
      "Outlines",
      "In a zone's Outlines, pick who and a color: whoever it is gets that outline while inside the zone, seen through walls. + adds another row for others in another color.",
    ],
    [
      "Loot, colors and seeing zones",
      "Add a Loot tab to a zone and pick what it holds: nothing comes until you do. Under Spawning: when it starts, Auto spawn (a new one after one is taken), Continuous spawn, how many lie at once, how many in the whole game (G has a limit for the whole map too), who can take it, and whether every player gets their own. What it holds has a list per kind and one with All items; tick several for one at random each time, or turn on All of them at once. Each ticked item shows its own numbers under its list; a blank box, or a switch on neutral, keeps its own. Game Settings (G) has Weapons and items: a number set there rules every copy of that item in the game, over the loot's. How it looks: an orb, as in your hand, or its hotbar picture, with a size and how see-through it is. A new zone has no color (white); pick a color and every zone of that color shares its settings. Zones show while cheat mode or Build is on, and stay hidden otherwise. Click a heading's arrow to fold it.",
    ],
  ],
  m: [
    [
      "Make an NPC",
      "Pick its look, its weapons and who it goes after. Every NPC you make is a row you can change later.",
    ],
    [
      "Brains",
      `Build a brain makes a ${LANG} file without typing. Name it in a spawn's Brain box and the NPCs it runs follow it.`,
    ],
    [
      "Defaults",
      "The four kinds (zombie, criminal, soldier and the rest) have defaults here; a spawn can change any of them for itself.",
    ],
  ],
  p: [
    [
      "God mode and Invisible",
      "God mode is the top row (key 1): enemies ignore you and you never die. It switches on unlimited ammo, unlimited items and no reloading, and you can turn each one off. Invisible is the second row: you see yourself see-through, and nobody else sees you at all. Invisible ducks walk through everyone, and everyone through them.",
    ],
    [
      "Letting players use them",
      "One row lets every player turn God mode and Invisible on for themselves. Giving it never turns them on for anyone.",
    ],
    [
      "Who may change Sandbox",
      "Open a window to every player, or give one player the rights. The host keeps them.",
    ],
    [
      "My NPCs and groups",
      "Choose who may use the NPCs and groups you made in their spawns, zones and lists (everyone, until you say no), who may change them (NPCs in M, groups in B), who may change your brain files' code, and who may change your saved NPCs on your device too (not advised). It lasts for this Sandbox only. My lists, at its foot, hides the others' NPCs and groups from your own lists.",
    ],
    [
      "Each player",
      "The last rows list every player in the room. Pick one to change their own God mode and Invisible, and nobody else's.",
    ],
  ],
  h: [
    [
      "Hotbar",
      "Use your Customize hotbar or empty it. Ten slots, keys 1 to 0. A slot holds a special, or a spawn button.",
    ],
    [
      "Loot and the host's hotbar",
      "Pick a loot item in the list, then a key to put it there. The host can lock the hotbar, make one everyone's default, and add spawn buttons.",
    ],
  ],
  g: [
    [
      "Saving",
      "Save keeps this Sandbox exactly as it is on the host's device, under its name; Save as keeps it under a new name. It also saves itself every minute, when it ends and when the host's tab closes. Next time Sandbox starts, the host picks it from the list.",
    ],
    [
      "Rules",
      "Rules opens its own window, for the zombie maps: how many lives each player has (0 is unlimited), whether there's a down phase where others can revive you (off: you just die), crits on or off, and whether a player out of lives watches the others. On the plain boards it has Board size: 100% is the screen, and a bigger board scrolls with your duck, the ducks staying their size. The save keeps them. What no menu shows (crit chance, gore, player limit) is in Seriat's settings/limits file: read-only until you turn its write on.",
    ],
    [
      "Waves and rounds",
      "Rules has Waves or rounds. Waves work as in Survival: each lasts its seconds (A wave lasts). Rounds work as in Dead Ducks Arcade: each lasts until everything it brought is down. After each comes a rest (Rest between them), then the next; How many sets the last one (0 never ends). The top of the screen says which one it is, the time a wave has left, and when the next comes. What comes in is set in the zones, not here: in a Spawn tab, turn on Comes in with waves or rounds. That spawn is pressed once as each wave or round starts, and its own start (Auto spawn, Continuous spawn, its key) only works while one is on, never in the rest. It brings whatever it spawns, zombies or any NPC with its own Brain. A Brain file reads the number now as wave, so each one can be tougher: ((hp 3+wave)).",
    ],
    [
      "Game modes",
      "Save game mode (G) keeps this Sandbox as a game mode on your device, with a name and a description; the same name replaces the old one. Test game mode starts it as players would see it, with no tools; Stop test at the top left brings your build back. The host picks a saved game mode in Game Settings, under Custom.",
    ],
    [
      "Music",
      "Music opens its own window: tick the songs that play, or turn them all on or off at once. Only the ticked ones play, the same for everyone. The save keeps the list. Import a song brings in one of yours (up to 6): it is cut to 3 minutes and made small (32 kbps, one channel), a green bar on the button shows it going in, and it plays for everyone like the game's songs. × takes it out. A save, a game mode and a shared game mode keep it.",
    ],
    [
      "Groups",
      "Groups (in Build, B, under Zone) are named sets of rules. A player or an NPC joins one when it spawns from a Spawn or Respawn tab you ticked (a red spawn and a blue respawn are different), steps into a zone, picks up a loot, or comes from a block of a variable name. Every tab also has its own Joins groups list.",
    ],
    [
      "What a group does",
      "Max HP: +30 adds 30, 30 makes it 30. Heal on joining: an amount, or 100% for full. Regen HP each second, stamina and cooldowns faster, an outline color, who its NPCs go after or leave alone, and windows it opens or closes for its players (Neutral leaves them as they are). Game settings come first, then groups. A player leaves its groups when it spawns again; an NPC when it dies. Every list names the groups under the entities.",
    ],
    [
      "My lists",
      "My lists (in Build, B, and Game settings, G) keeps made NPCs and groups out of your own lists. Nobody else's lists change.",
    ],
  ],
};
const TITLES = {
  b: "Build",
  m: "Make an NPC",
  p: "Player settings",
  h: "Hotbar",
  g: "Game settings",
};

/* the parts of the manual, in order */
const PARTS = ["b", "m", "p", "h", "g"];
/* the Seriat help files by folder: help/'s own files first, then each folder's, then the examples */
function folders() {
  const out = new Map([["", []]]);
  for (const path of Object.keys(HELP)) {
    const i = path.lastIndexOf("/"),
      d = i < 0 ? "" : path.slice(0, i);
    if (!out.has(d)) out.set(d, []);
    out.get(d).push(path);
  }
  out.set(
    "examples",
    Object.keys(EXAMPLES).map((n) => "examples/" + n),
  );
  return out;
}
const fileText = (path) =>
  path.startsWith("examples/") ? EXAMPLES[path.slice(9)] : HELP[path];
/* the help manual, at window key's part (none: its first page) */
export function openSbHelp(key) {
  if (document.querySelector(".sbh-win")) return;
  /* where I am: a list of pages from the first, each { k: "home" | "part" | "topic" | "files" | "dir" | "file", … } */
  const home = { k: "home", t: "Help" },
    seriat = { k: "files", t: `${LANG} help files` },
    partOf = (p) => ({ k: "part", p, t: TITLES[p] }),
    stack = [home];
  if (SB_HELP[key]) stack.push(partOf(key));
  const btn = (i, label) =>
    `<button type="button" class="btn small ghost sbh-go" data-go="${i}">${esc(label)}</button>`;
  return openWindow(
    `<nav class="sbh-path" aria-label="Where you are"></nav><div class="sbh-page" tabindex="0"></div>`,
    {
      cls: "sbh-win", // (the game's own window, never the Seriat bible's white page: the owner's, Nov 20 04:46Z)
      onOpen(w) {
        const page = w.querySelector(".sbh-page"),
          path = w.querySelector(".sbh-path");
        let go = []; // (the pages this page's buttons lead to)
        const draw = () => {
          const at = stack[stack.length - 1];
          path.innerHTML = stack
            .map((s, i) =>
              i === stack.length - 1
                ? `<b>${esc(s.t)}</b>`
                : `<button type="button" class="sbh-crumb" data-back="${i}">${esc(s.t)}</button>`,
            )
            .join(`<span aria-hidden="true">›</span>`);
          go = [];
          const list = (pages) => {
            go = pages;
            return `<div class="sbh-list">${pages.map((q, i) => btn(i, q.t)).join("")}</div>`;
          };
          if (at.k === "home")
            page.innerHTML = list([...PARTS.map(partOf), seriat]);
          else if (at.k === "part")
            page.innerHTML = list(
              SB_HELP[at.p].map(([t], i) => ({ k: "topic", p: at.p, i, t })),
            );
          else if (at.k === "topic") {
            const pages = SB_HELP[at.p],
              [t, b] = pages[at.i],
              near = [
                at.i > 0 && ["Previous", at.i - 1],
                at.i < pages.length - 1 && ["Next", at.i + 1],
              ].filter(Boolean);
            go = near.map(([, i]) => ({
              k: "topic",
              p: at.p,
              i,
              t: pages[i][0],
              swap: true,
            }));
            page.innerHTML = `<h2>${esc(t)}</h2><p>${esc(b)}</p><div class="sbh-nav">${near.map(([l], i) => btn(i, `${l}: ${go[i].t}`)).join("")}</div>`;
          } else if (at.k === "files")
            page.innerHTML = list(
              [...folders().keys()].map((d) => ({
                k: "dir",
                d,
                t: d ? `help/${d}/` : "help/",
              })),
            );
          else if (at.k === "dir")
            page.innerHTML = list(
              folders()
                .get(at.d)
                .map((f) => ({
                  k: "file",
                  f,
                  t: f.slice(f.lastIndexOf("/") + 1),
                })),
            );
          else if (at.k === "file")
            page.innerHTML = `<pre class="sbh-file">${esc(fileText(at.f) || "")}</pre>`;
          page.scrollTop = 0;
        };
        w.addEventListener("click", (e) => {
          const b = e.target.closest("[data-go], [data-back]");
          if (!b) return;
          if (b.dataset.back != null) stack.length = +b.dataset.back + 1;
          else {
            const q = go[+b.dataset.go];
            if (!q) return;
            if (q.swap) stack[stack.length - 1] = q;
            else stack.push(q);
          }
          draw();
          page.focus();
        });
        draw();
      },
    },
  );
}
