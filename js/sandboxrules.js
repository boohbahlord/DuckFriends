/* ---------- Sandbox: which map it plays on, and who may build (stage 1, the shell) ----------
   The owner's Sandbox (Nov 19, /mnt/project-files/sandbox/sandbox-mode-rules.txt and the 01:34Z answers): a mode under
   Special with no rounds that never ends ("Leave Sandbox" at the top left, as in round zero of Dead Ducks Arcade or in
   Hangout), on any map. The simple board maps (Agree or Disagree's kind, whatever the background) are one map: the
   plain board. The maps with a world of their own are walked whole, with everything that map has in its own mode:
   Duck Cabin as in Hangout, Dead Ducks Arcade's cabin and Downpour as in Dead Ducks Arcade, but with no rounds, no
   zombies and no end (s.options.sbMap picks one of those; empty: the board).
   This file has no imports, so every part of the game (the rules, the world's layout, the screen) can ask it. */

/* the worlds Sandbox can be on: the mode whose world it is, and that mode's map */
export const SB_WORLDS = {
  cabin: ["hang", ""],
  zcabin: ["l4dd", ""],
  downpour: ["l4dd", "downpour"],
};
export const SB_WORLD_NAMES = {
  cabin: "Duck Cabin",
  zcabin: "Dead Ducks Arcade's cabin",
  downpour: "Downpour",
};
export const isSb = (s) => !!s && !!s.options && s.options.mode === "sandbox";
/* Sandbox's world (a key of SB_WORLDS), or "" on the board (and in every other mode) */
export const sbWorld = (o) =>
  !!o && o.mode === "sandbox" && SB_WORLDS[o.sbMap] ? o.sbMap : "";
/* the mode whose rules and world run: the room's own, or, in Sandbox on a world, that world's mode ("sandbox" on the
   board) */
export const baseMode = (o) => {
  const w = sbWorld(o);
  return w ? SB_WORLDS[w][0] : (o && o.mode) || "";
};
/* the map that mode is on (Dead Ducks Arcade's Downpour: "downpour") */
export const baseL4map = (o) => {
  if (!o) return "";
  if (o.mode !== "sandbox") return o.l4map;
  const w = sbWorld(o);
  return w ? SB_WORLDS[w][1] : "";
};
/* Sandbox on a world map (it runs as Hangout or Dead Ducks Arcade does there) */
export const sbOnWorld = (s) => isSb(s) && !!sbWorld(s.options);
/* Sandbox on the board: its one phase, "sandbox" */
export const sbOnBoard = (s) => isSb(s) && !sbWorld(s.options);

/* who may build (b), make NPCs (m), write Numerat (n), set the hotbar (h), the game (g) and the players (p): the host;
   everyone when Democracy of Ducklings lets everyone change the settings (the owner's answer 2, Nov 19 01:34Z); and
   whoever the host lets (p, later: s.sb.ok = { id: true }). A new host takes the old one's place at once, since this
   asks who the host is now */
export function sbCan(s, id) {
  if (!isSb(s) || !id || !s.players[id] || s.players[id].bot) return false;
  if (id === s.hostId) return true;
  if (+s.options.dod === 1 && ((s.dod || {}).on || {}).settings) return true; // (rules.js dodOn(s, "settings"))
  return !!(s.sb && s.sb.ok && s.sb.ok[id]);
}
/* a downed duck in Sandbox on Dead Ducks Arcade's maps: back up this long after it bled out (no rounds to wait for) */
export const SB_BACK_MS = 3000;

/* ---------- Sandbox's spawns and respawns: the settings (stage 2) ----------
   ONE list of settings that a spawn, a respawn, a made NPC and a zone (SB_ZONE, below) all read. Each box keeps the text as
   it was typed and its last good text (numerat.js keep()), so a box written wrong never breaks anything.
   The owner's words for each are in the Sandbox file, "Integer or numerical options for spawn" and "true of false
   options for spawn". */
export const SB_BOXES = {
  limit: { name: "Spawn limit", kind: "int", min: 1, max: 100, def: "1" }, // ("cannot exceed over 100, and 1 is the default per spawn")
  every: {
    name: "Seconds between spawns",
    kind: "int",
    min: 1,
    max: 600,
    def: "4",
  }, // ("default is four seconds")
  hp: { name: "HP", kind: "int", min: 1, max: 1000, def: "3" }, // (a zombie's own: l4ddrules.js L4.HP)
  damage: { name: "Damage", kind: "tenth", min: 0.1, max: 100, def: "1" }, // ("decimal form to the tenth place")
  speed: { name: "Speed", kind: "tenth", min: 0.1, max: 5, def: "1" }, // ("1 is default, 0 is not allowed ... 5 is the max")
};
export const SB_FLAGS = {
  cont: { name: "Continuous spawn", kind: "bool", def: "f" },
  respawn: { name: "Can respawn", kind: "bool", def: "f" },
  sprint: { name: "Can sprint", kind: "bool", def: "f" },
  jump: { name: "Can jump", kind: "bool", def: "f" },
  climb: { name: "Can climb walls", kind: "bool", def: "t" },
};
/* a respawn's "Import settings" (the owner's Sandbox file): the spawn's settings it can take on, by category, in the
   spawn menu's order ("Options import in the order of the menu they come from"). What comes back there (an NPC, or a
   duck at a respawn for players) takes the respawn's values over its own spawn's */
export const SB_IMPORT = [
  ["Numbers", ["hp", "damage", "speed"]],
  ["True or false", ["sprint", "jump", "climb"]],
  ["Behavior", ["target", "ignore", "avoid", "protect"]],
];
/* a spawn's Players tab: ducks spawn here (they start, join and come back from being down here) when it's on, the ones
   its "who" names (players, or their names), with its HP and speed; blank is the game's own */
export const SB_PLAYER = {
  pon: { name: "Players spawn here", kind: "bool", def: "f" },
  php: { name: "Players' HP", kind: "int", min: 1, max: 100, blank: true },
  pspd: {
    name: "Players' speed",
    kind: "tenth",
    min: 0.1,
    max: 5,
    blank: true,
  },
};
/* what can spawn (the owner's Sandbox file): a zombie; a Blank NPC (a duck with a random look: "randomize appearance" is
   on by default); Justin (as he is in the cabin); a duck from Test Mode (a computer's look and name, and no vote: it
   isn't a player). Made NPCs come with stage 3. The zombie maps take only zombies for now (their guns hit only theirs) */
export const SB_WHAT = {
  zombie: "Zombie",
  blank: "Blank NPC",
  justin: "Justin",
  test: "Test NPC",
};
export const SB_WHAT_ZMAPS = ["zombie"];
/* a spawn's four behavior lists: each takes Players, Everything, a kind (SB_WHAT) and a spawn by its name or color */
export const SB_ACTS = {
  target: "Target",
  ignore: "Ignore",
  avoid: "Avoid",
  protect: "Protect",
};
/* the colors a spawn can have (the board's own): its ring on the screen, and which respawns take its NPCs */
export const SB_COLORS = {
  red: "#ff4d4d",
  blue: "#3f8cff",
  green: "#3fae2a",
  yellow: "#ffd23f",
  purple: "#9b5de5",
  orange: "#ff8c2b",
  pink: "#ff6fb5",
  white: "#f4f6fb",
};
/* the keys a spawn can't take: the windows' letters and the game's own keys */
export const SB_KEYS_TAKEN = "cbmnhgpwasdeqrtvx";
/* the spawn key only works while the Build window is up (the head planner's pick until the owner answers "UNLESS the
   letter is pressed outside of build mode"): false lets it work any time */
export const SB_KEY_IN_BUILD = true;
/* the most spawns and respawns on a map */
export const SB_POINTS = 60;
/* ---------- Sandbox's board zones (stage 5) ----------
   The owner's Sandbox file, "Board Build": "A large sqaure amount of pixels CAN be used to overwrite the board with an
   effect (not an actual solid). It is transparent and assigned any color that the spawns or respawns has." A zone can be
   where players, entities or loot spawn; it can damage, heal (each at its own rate) or kill. Its settings work as a
   spawn's do, its colors as theirs. "Sections colored from board build is invisible": a zone is seen only while the
   Build window is up (sbspawnview.js). A zone is a point as a spawn is ({ k: "zone", …, zw, zh: its size in duck
   lengths } in s.sb.pts), with these boxes */
export const SB_FX = {
  none: "Nothing",
  damage: "Damage",
  heal: "Heal",
  kill: "Kill",
};
const listBox = (name, def) => ({
  name,
  check: (t) => (String(t).length <= 200 ? "" : "200 letters at most"),
  def,
});
export const SB_ZONE = {
  zw: { name: "Width (duck lengths)", kind: "int", min: 1, max: 40, def: "4" },
  zh: { name: "Height (duck lengths)", kind: "int", min: 1, max: 40, def: "4" },
  fx: {
    name: "What it does",
    check: (t) =>
      SB_FX[String(t).trim()] ? "" : "Nothing, damage, heal or kill",
    def: "none",
  },
  amt: { name: "HP each time", kind: "tenth", min: 0.1, max: 100, def: "1" },
  rate: {
    name: "Seconds between",
    kind: "tenth",
    min: 0.1,
    max: 60,
    def: "1",
  }, // ("they can heal or damage at different rates")
  zwho: listBox("Who it hits", "players"), // (Players, Everything, a kind, a spawn by its color or name, a player's name)
  ent: listBox("Entities spawn here", ""), // (spawns, by their color or name: what they make comes in the zone)
  lt: listBox("Loot spawns here", ""), // (loot spots, by their color or name: their orbs lie in the zone)
};
/* a duck length in a world's px, for a zone's size there (on the board: 0.03 of it across, 0.08 up and down) */
export const SB_ZONE_PX = 48;
/* zone p's rectangle, [x0, y0, x1, y1] in shares of the map (W, H: a world's size in px) */
export function sbZoneBox(s, p, W = 1, H = 1) {
  const [rx, ry] = sbOnBoard(s)
      ? [0.03, 0.08]
      : [SB_ZONE_PX / W, SB_ZONE_PX / H],
    hw = ((p.zw || 4) * rx) / 2,
    hh = ((p.zh || 4) * ry) / 2;
  return [p.x - hw, p.y - hh, p.x + hw, p.y + hh];
}
/* a spot at random inside zone p, { x, y, z }: on the board within its edges; on a world one a duck can stand on (ok(x, y,
   z), in shares), or the zone's middle, where its builder stood */
export function sbZoneSpot(s, p, W = 1, H = 1, ok = null) {
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    board = sbOnBoard(s),
    z = p.z || 0;
  for (let i = 0; i < 12; i++) {
    let x = x0 + Math.random() * (x1 - x0),
      y = y0 + Math.random() * (y1 - y0);
    if (board) {
      x = Math.min(0.99, Math.max(0.01, x));
      y = Math.min(0.97, Math.max(0.03, y));
    }
    if (!ok || ok(x, y, z)) return { x: +x.toFixed(4), y: +y.toFixed(4), z };
  }
  return { x: p.x, y: p.y, z };
}

/* where duck id comes back (or starts, or joins) in Sandbox: a respawn whose "who" box says players or its name, a
   spawn whose Players tab is on for it, or a zone whose players spawn there (one of them at random; in a zone a spot in
   it at random: W, H, ok as for sbZoneSpot), as { id, …the point }, or null (where it would anyway) */
export function sbPlayerSpot(s, id, W = 1, H = 1, ok = null) {
  const pts = (s && s.sb && s.sb.pts) || {},
    name = String((s.players[id] || {}).name || "")
      .trim()
      .toLowerCase(),
    said = (q, f, def) => {
      const k = q.f && q.f[f];
      return String(k && k.ok ? k.ok : def).toLowerCase();
    },
    names = (t) => t.split(",").map((w) => w.trim()),
    forMe = (t) =>
      t.split(/[\s,]+/).includes("players") ||
      (!!name && names(t).includes(name));
  const rs = Object.entries(pts)
    .filter(([, q]) =>
      q.k === "respawn"
        ? forMe(said(q, "who", q.col))
        : (q.k === "spawn" || q.k === "zone") &&
          ["t", "true"].includes(said(q, "pon", "f")) &&
          forMe(said(q, "pwho", "players")),
    )
    .map(([pid, q]) => ({ ...q, id: pid }));
  const q = rs.length ? rs[Math.floor(Math.random() * rs.length)] : null;
  return q && q.k === "zone" ? { ...q, ...sbZoneSpot(s, q, W, H, ok) } : q;
}

/* ---------- Sandbox's loot orbs (stage 4b) ----------
   The owner's Sandbox file, "Loot Spawns": "Spawn Orbs can be placed on the ground and what they are is a dropdown menu
   with drop down arrows PER category of loot", "multiple selections selected at a time to incidicate randomness", "also
   include special drops from zombies", "how often they spawn, and even if they respawn", "if they are temporary,
   unlimited, unlimited ammo, different damage (maybe loot can even deal damage to players)", and "Loot can have
   different appearances based on other loot or image can be imported" (2 MB at most, the owner's, Nov 19 01:57Z).
   A loot point is a point as a spawn is ({ k: "loot", … } in s.sb.pts), with these boxes */
export const SB_LOOT = {
  loot: {
    name: "What it holds",
    check: (t) =>
      String(t)
        .split(/[\s,]+/)
        .filter(Boolean).length
        ? String(t).length <= 300
          ? ""
          : "Too many"
        : "Pick at least one",
    def: "hotdog, maxammo",
  },
  again: {
    name: "Seconds before it comes back",
    kind: "int",
    min: 1,
    max: 600,
    def: "10",
  },
  keep: {
    name: "Seconds you keep it (0: for good)",
    kind: "int",
    min: 0,
    max: 600,
    def: "0",
  },
  hurt: {
    name: "Damage to whoever takes it",
    kind: "tenth",
    min: 0,
    max: 100,
    def: "0",
  },
  back: { name: "Comes back", kind: "bool", def: "t" },
  inf: { name: "Unlimited ammo", kind: "bool", def: "f" },
  look: {
    name: "Looks like",
    check: (t) => (String(t).length <= 24 ? "" : "24 letters at most"),
    def: "",
  },
};
/* the zombies' special drops an orb can hold (l4ddrules.js DROPS): on Dead Ducks Arcade's maps only, for now (on the
   others nothing would use them yet) */
export const SB_DROPS = {
  maxammo: ["ammo", "Max Ammo"],
  nuke: ["nuke", "Nuke"],
  instakill: ["kill", "Instant Kill"],
  doublepoints: ["double", "Double Points"],
  speedboost: ["speed", "Speed Boost"],
  sale: ["sale", "Sale"],
}; // (an orb's word for each, never a special's id: the Double jump is "double"; then the zombies' own name for it)
/* an uploaded picture for an orb: a data URL no longer than this (the online actions' own cap is 200,000 letters) */
export const SB_IMG_MAX = 150000;
