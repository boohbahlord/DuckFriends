/* ---------- Sandbox: the help window of every window (the owner's, Nov 19 21:59Z and 23:10Z) ----------
   The last option of B, M, P, H and G opens a big window with pages you move through (the Seriat window has its own:
   seriatbible.js), in the same pixel page as the Seriat bible. The words are short and say what to press or drag. */
import { esc, openWindow } from "./ui.js";
import { LANG } from "./langname.js";

export const SB_HELP = {
  b: [
    [
      "Build zones",
      "Pick Zone in Build, then click or tap the map to put it down. Esc or right-click lets go. Hold Shift while you place and it keeps placing.",
    ],
    [
      "Moving what you placed",
      "Hold the left mouse on it and drag. While you hold it, the arrow keys turn it. Double-click it for handles that change its size (Esc puts them away). Hold Shift and drag across an empty spot to select everything inside; drag one of them and they all move. Backspace lets go of a selection. Right-click it for Properties, Copy and Cut (Copy all and Cut all on a selection); on an empty spot, Paste.",
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
      "Outlines",
      "In a zone's Outlines, pick who and a color: whoever it is gets that outline while inside the zone, seen through walls. + adds another row for others in another color.",
    ],
    [
      "Loot, colors and seeing zones",
      "Add a Loot tab to a zone and pick what it holds: nothing comes until you do. A new zone has no color (white); pick a color and every zone of that color shares its settings. Zones show while cheat mode or Build is on, and stay hidden otherwise. Click a heading's arrow to fold it.",
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
      "Music",
      "Music opens its own window: tick the songs that play, or turn them all on or off at once. Only the ticked ones play, the same for everyone. The save keeps the list.",
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

export function openSbHelp(key) {
  const pages = SB_HELP[key] || [];
  if (!pages.length || document.querySelector(".sbh-win")) return;
  let i = 0;
  return openWindow(
    `<h2>${esc(TITLES[key] || "Help")}: help</h2><div class="sbh-page" tabindex="0"></div><div class="sbh-nav"><button type="button" class="btn small ghost" data-prev>Back</button><span class="sbh-n"></span><button type="button" class="btn small" data-next>Next</button></div>`,
    {
      cls: "sbh-win", // (the game's own window, never the Seriat bible's white page: the owner's, Nov 20 04:46Z)
      onOpen(w) {
        const page = w.querySelector(".sbh-page"),
          prev = w.querySelector("[data-prev]"),
          next = w.querySelector("[data-next]");
        const draw = () => {
          const [t, b] = pages[i];
          page.innerHTML = `<h2>${esc(t)}</h2><p>${esc(b)}</p>`;
          w.querySelector(".sbh-n").textContent = `${i + 1} of ${pages.length}`;
          prev.disabled = i === 0;
          next.disabled = i === pages.length - 1;
        };
        prev.onclick = () => ((i = Math.max(0, i - 1)), draw());
        next.onclick = () => ((i = Math.min(pages.length - 1, i + 1)), draw());
        w.addEventListener("keydown", (e) => {
          if (e.key === "ArrowLeft") prev.click();
          if (e.key === "ArrowRight") next.click();
        });
        draw();
      },
    },
  );
}
