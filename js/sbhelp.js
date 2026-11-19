/* ---------- Sandbox: the help window of every window (the owner's, Nov 19 21:59Z and 23:10Z) ----------
   The last option of B, M, P, H and G opens a big window with pages you move through (the Seriat window has its own:
   seriatbible.js), in the same pixel page as the Seriat bible. The words are short and say what to press or drag. */
import { esc, openWindow } from "./ui.js";
import { LANG } from "./langname.js";

export const SB_HELP = {
  b: [
    [
      "Build blocks",
      "Pick a thing in Build, then click or tap the map to put it down. Esc or right-click lets go. Hold Shift while you place and it keeps placing.",
    ],
    [
      "Moving what you placed",
      "Hold the left mouse on it and drag. Use the arrow keys to turn it. Right-click it for Properties, Copy and Cut; on an empty spot, Paste.",
    ],
    [
      "Spawns and respawns",
      "A spawn makes things; a respawn is where players come back. Press E beside one to change it, then give it a key or put it on the hotbar in H.",
    ],
    [
      "Loot and zones",
      "Loot is an orb that gives what it holds to whoever walks over it. A zone is a box that does something to whoever stands in it. Both hide from players while cheat mode is off.",
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
      "Game settings",
      `Settings for this Sandbox: where ${LANG} files are brought in to run.`,
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
    `<h2>${esc(TITLES[key] || "Help")}: help</h2><div class="sbb-page sbh-page" tabindex="0"></div><div class="sbh-nav"><button type="button" class="btn small ghost" data-prev>Back</button><span class="sbh-n"></span><button type="button" class="btn small" data-next>Next</button></div>`,
    {
      cls: "sbb-win sbh-win",
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
