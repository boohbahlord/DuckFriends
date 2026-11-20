/* ---------- Sandbox: which map it plays on, and who may build (stage 1, the shell) ----------
   The owner's Sandbox (Nov 19, /mnt/project-files/sandbox/sandbox-mode-rules.txt and the 01:34Z answers): a mode under
   Special with no rounds that never ends ("Leave Sandbox" at the top left, as in round zero of Dead Ducks Arcade or in
   Hangout), on any map. The simple board maps (Agree or Disagree's kind, whatever the background) are one map: the
   plain board. The maps with a world of their own are walked whole, with everything that map has in its own mode:
   Duck Cabin as in Hangout, Dead Ducks Arcade's cabin and Downpour as in Dead Ducks Arcade, but with no rounds, no
   zombies and no end (s.options.sbMap picks one of those; empty: the board).
   This file has no imports, so every part of the game (the rules, the world's layout, the screen) can ask it. */
import { LANG } from "./langname.js";

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
  if (o && o.mode === "surv") return "l4dd"; // (Survival runs on Dead Ducks Arcade's engine: survrules.js)
  return w ? SB_WORLDS[w][0] : (o && o.mode) || "";
};
/* the map that mode is on (Dead Ducks Arcade's Downpour: "downpour") */
export const baseL4map = (o) => {
  if (!o) return "";
  if (o.mode === "surv") return "downpour"; // (Survival: Downpour only, the owner's, Nov 19 19:47Z)
  if (o.mode !== "sandbox") return o.l4map;
  const w = sbWorld(o);
  return w ? SB_WORLDS[w][1] : "";
};
/* Sandbox on a world map (it runs as Hangout or Dead Ducks Arcade does there) */
export const sbOnWorld = (s) => isSb(s) && !!sbWorld(s.options);
/* Sandbox on the board: its one phase, "sandbox" */
export const sbOnBoard = (s) => isSb(s) && !sbWorld(s.options);

/* who may build (b), make NPCs (m), write Seriat (n), set the hotbar (h), the game (g) and the players (p): the host;
   everyone when Democracy of Ducklings lets everyone change the settings (the owner's answer 2, Nov 19 01:34Z); and
   whoever the host lets (p, later: s.sb.ok = { id: true }). A new host takes the old one's place at once, since this
   asks who the host is now */
export function sbCan(s, id) {
  if (!isSb(s) || !id || !s.players[id] || s.players[id].bot) return false;
  if (id === s.hostId) return true;
  if (+s.options.sbAll === 1) return true; // (Game Settings: "Everyone can change Sandbox")
  if (+s.options.dod === 1 && ((s.dod || {}).on || {}).settings) return true; // (rules.js dodOn(s, "settings"))
  return !!(s.sb && s.sb.ok && s.sb.ok[id]);
}
/* Game Settings can also give every player just some of the windows (the owner's, Nov 19: "if all players get only a
   select few permissions onto different buttons"): option sbOk + the window's letter, 1 on. The rights (sbCan) give
   them all; Player settings (p) stays with the rights */
export const SB_RIGHTS = [
  ["b", "Build"],
  ["m", "Make an NPC"],
  ["n", LANG],
  ["h", "Hotbar"],
  ["g", "Game settings"],
];
export function sbMay(s, id, k) {
  if (!isSb(s) || !id || !s.players[id] || s.players[id].bot) return false;
  if (id === s.hostId) return true;
  if (+s.options["sbOk" + String(k).toUpperCase()] === 1) return true;
  if (
    +s.options.sbAll === 1 ||
    (+s.options.dod === 1 && ((s.dod || {}).on || {}).settings)
  )
    return true; // (game settings first: the owner's, "this is a priority over the loot and all group settings, all player settings")
  const g = groupRight(s, id, k); // (then the groups: "group settings includes permissions")
  return g == null ? sbCan(s, id) : g; // (then the player's own)
}
/* the right to window k that duck id's groups give (true) or take (false), the last of them that says; null when none
   does (neutral: it steps aside). sbgroups.js keeps the groups */
function groupRight(s, id, k) {
  const sb = s.sb || {},
    gr = sb.gr || {};
  let r = null;
  for (const g of (sb.gm || {})["p:" + id] || []) {
    const v = gr[g] && gr[g].r && gr[g].r[k];
    if (v === 1 || v === 0) r = v === 1;
  }
  return r;
}
/* a downed duck in Sandbox on Dead Ducks Arcade's maps: back up this long after it bled out (no rounds to wait for) */
export const SB_BACK_MS = 3000;
/* ---------- G's Rules (plan Phase 6) ----------
   The owner's: "Make it to where when you die, that you can spectate players in survival and Dead Ducks Arcade. Or even as
   a setting that you can put into game settings. If you, let's say, changed a rule in game settings of how many lives a
   player has ... Default setting is unlimited. You have a game setting, like, is there a down phase where they can be
   revived? Disabled by default. So they just die ... Crit can be an option that can be disabled or enabled." Kept in
   s.sb.rules ({ k: its text }), saved with the Sandbox; on the zombie maps' worlds (l4ddrules.js, spectate.js) */
export const SB_RULES = {
  lives: {
    name: "Lives (0: unlimited)",
    kind: "int",
    min: 0,
    max: 99,
    def: "0",
  },
  down: { name: "Down phase (others can revive you)", kind: "bool", def: "f" },
  crit: { name: "Crits (headshots)", kind: "bool", def: "t" },
  spec: { name: "Out of lives: watch the others", kind: "bool", def: "t" },
};
/* rule k now: a whole number (lives) or true / false */
export function sbRule(s, k) {
  const b = SB_RULES[k],
    t = String(((s && s.sb && s.sb.rules) || {})[k] ?? b.def).trim();
  if (b.kind === "bool") return !/^f/i.test(t);
  const n = Math.round(+t);
  return Number.isFinite(n) ? Math.min(b.max, Math.max(b.min, n)) : +b.def;
}
/* { t: "sbr", k, v }: whoever may change Sandbox sets rule k */
export function sbRulesAct(s, a) {
  const b = SB_RULES[a.k];
  if (!isSb(s) || !b || !sbCan(s, a.id)) return false;
  let v = String(a.v ?? "").trim();
  if (b.kind === "bool") v = /^f/i.test(v) || v === "" ? "f" : "t";
  else {
    const n = Math.round(+v);
    if (!Number.isFinite(n) || n < b.min || n > b.max) return false;
    v = String(n);
  }
  const rules = { ...((s.sb && s.sb.rules) || {}) };
  if (rules[a.k] === v) return false;
  rules[a.k] = v;
  s.sb = { ...s.sb, rules };
  return true;
}

/* ---------- Sandbox's spawns and respawns: the settings (stage 2) ----------
   ONE list of settings that a spawn, a respawn, a made NPC and a zone (SB_ZONE, below) all read. Each box keeps the text as
   it was typed and its last good text (numerat.js keep()), so a box written wrong never breaks anything.
   The owner's words for each are in the Sandbox file, "Integer or numerical options for spawn" and "true of false
   options for spawn". */
export const SB_BOXES = {
  /* 0: no limit (the owner's, Nov 19: "Spawn limit can be turned off. It can be set to 0"), still never past the zombies'
     cap on a map (sbspawn.js limitOf) */
  limit: {
    name: "Spawn limit (0: none)",
    kind: "int",
    min: 0,
    max: 100,
    def: "1",
  }, // ("cannot exceed over 100, and 1 is the default per spawn")
  every: {
    name: "Seconds between spawns",
    kind: "tenth",
    min: 0.1,
    max: 600,
    def: "4",
  }, // ("default is four seconds"; "you can do a decimal point for time in between spawns")
  hp: { name: "HP", kind: "int", min: 1, max: 1000, def: "3" }, // (a zombie's own: l4ddrules.js L4.HP)
  damage: { name: "Damage", kind: "tenth", min: 0.1, max: 100, def: "1" }, // ("decimal form to the tenth place")
  speed: { name: "Speed", kind: "tenth", min: 0.1, max: 5, def: "1" }, // ("1 is default, 0 is not allowed ... 5 is the max")
  /* how big what it spawns is, picture and hitbox together, in percent of a duck (the owner's, Nov 19 15:47Z: "Percent is
     obviously the best way to scale size"): 10% the smallest, the biggest as tall as Mad God Justin */
  size: {
    name: "Size (%)",
    kind: "int",
    min: 10,
    max: 152,
    def: "100",
  }, // (152: Justin's drawing is 152 tall where a duck's is 120 (duck.js), times his size in his mode, mgjrules.js MGJ_SCALE 1.2)
};
export const SB_FLAGS = {
  sets: { name: "Use these settings", kind: "bool", def: "t" }, // (off: what it spawns comes as it is, sbspawn.js ownOn)
  cont: { name: "Continuous spawn", kind: "bool", def: "f" },
  /* "Auto spawn means it spawns regardless. Like it will just always keep spawning unless it's turned off ... below
     continuous spawn": no key or button needed, one each "time between spawns" while fewer than its limit are alive */
  auto: { name: "Auto spawn", kind: "bool", def: "f" },
  /* "under the colors to hide spawn, and it only hides spawn when cheat mode isn't on": its ring shows only to whoever
     has cheat mode on (sbmenu.js sbCheat); it still works */
  hide: { name: "Hide (unless cheat mode)", kind: "bool", def: "t" },
  respawn: { name: "Can respawn", kind: "bool", def: "f" },
  sprint: { name: "Can sprint", kind: "bool", def: "f" },
  jump: { name: "Can jump", kind: "bool", def: "f" },
  climb: { name: "Can climb walls", kind: "bool", def: "t" },
  /* plan Phase 3: "Inverse: a switch makes a tab act outside the zone instead of inside (or outside every zone with the
     same name or color)" */
  inv: { name: "Inverse (works outside its zone)", kind: "bool", def: "f" },
  /* plan Phase 3: "Dark outside: a switch darkens everything outside the zone while you are in it, like inside the gas
     station" */
  dark: { name: "Dark outside", kind: "bool", def: "f" },
};
/* a respawn's "Import settings" (the owner's Sandbox file): the spawn's settings it can take on, by category, in the
   spawn menu's order ("Options import in the order of the menu they come from"). What comes back there (an NPC, or a
   duck at a respawn for players) takes the respawn's values over its own spawn's */
export const SB_IMPORT = [
  ["Numbers", ["hp", "damage", "speed", "size"]],
  ["True or false", ["sprint", "jump", "climb"]],
  ["Behavior", ["target", "ignore", "avoid", "protect"]],
  ["Appearance", ["ap"]], // (its spawn's look, copied: not a box, so SB_OWN leaves it out)
];
/* what a spawn's "Use these settings" switches, and what M's defaults for a kind can change (the owner's, Nov 19: "an
   option for M that allows entities default settings to be edited ... Make sure that spawn can have settings turned
   off so entities spawn as they are, much like how respawn does it"): the same settings a respawn can import */
export const SB_OWN = SB_IMPORT.flatMap(([, fs]) => fs).filter(
  (f) => f !== "ap",
);
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
/* "There should be a no color option, which just kind of makes the spawn point maybe like a rainbow color that slowly
   changes, very slowly": a spawn or respawn of No color shares its settings with nobody */
export const SB_NOCOL = "none";
export const sbColOk = (c) => !!SB_COLORS[c] || c === SB_NOCOL;
/* the keys a spawn can't take: the windows' letters and the game's own keys */
export const SB_KEYS_TAKEN = "cbmnhgpwasdeqrtvx";
/* the spawn key works any time, the Build window up or not (the owner's answer, Nov 19 10:22Z: "no (not for sandbox
   mode anyway"); true would let it work only while the Build window is up */
export const SB_KEY_IN_BUILD = false;
/* the zone budget: the most blocks and tabs on a map, each tab counting as one (the owner's, Nov 19: "Let's say that
   there's only 50 zones allowed per game ... zone budget 0 out of 50 ... Now it says 2 out of 50") */
export const SB_POINTS = 50;
/* a block's tabs (plan Phase 2c): what a + adds. A spawn's own Entity and Player pages, and on any block a tab of each
   purpose, which works on the block's own spot, shape and size */
export const SB_TABS = [
  ["spawn", "Spawn tab"],
  ["respawn", "Respawn tab"],
  ["loot", "Loot tab"],
  ["zone", "Zone tab"],
];
/* where a block is and how it's shaped: what its tabs copy from it */
export const SB_GEO = ["x", "y", "z", "sh", "fill", "rot"];
export const SB_GEO_F = ["sh", "fill", "zw", "zh"];
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
  /* a thin rectangle is a wall (plan Phase 3): under one duck length it takes tenths, down to a fifth */
  zw: {
    name: "Width (duck lengths)",
    kind: "tenth",
    min: 0.2,
    max: 40,
    def: "4",
  },
  zh: {
    name: "Height (duck lengths)",
    kind: "tenth",
    min: 0.2,
    max: 40,
    def: "4",
  },
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
  wall: listBox("Who can't pass", ""), // (plan Phase 3, walls: the same list; nothing ticked, it stops nobody)
  /* plan Phase 4, floors (the owner's: "a given zone is given an elevation of 2 ... The lowest ... is 1", "Maybe 6", and
     "ground is the settings level, where you can stand on it and walk on it while it's of that height"): on a world a
     zone sits at its elevation, one gas station roof over the next (elevation 1: the map's own ground); with Ground on,
     its working squares are a floor (sbfloors.js) */
  fl: {
    name: "Elevation (1 is the ground)",
    kind: "int",
    min: 1,
    max: 6,
    def: "1",
  },
  gnd: { name: "Ground (stand and walk on it)", kind: "bool", def: "f" },
  /* plan Phase 4, climbing (the owner's: "another elevation type called climb ... touching the outside boundary of that
     will make it to where you can climb onto another elevation ... the same mechanism as the ladder", and "for elevation
     settings or wall settings or for ladders or for climbings ... a drop-down menu for selecting which entities or groups
     can"): who it takes climbs it, pushing into it, up to its elevation (sbClimbAt) */
  clm: listBox("Who can climb it", ""),
  /* plan Phase 4, slopes (the owner's: "The time to climb up into another elevation is based on a slope ... its length ...
     determines how long it takes to walk up it ... you say, this goes from this elevation from which it's on, and you
     input the number onto this one"): with Ground on, from its elevation at one end up to this one at the other, along
     its length toward the side picked (as it's turned), in steps of 2.5% of the gas station roof (sbfloors.js) */
  slto: {
    name: "Slope up to elevation (0: flat)",
    kind: "int",
    min: 0,
    max: 6,
    def: "0",
  },
  sldir: {
    name: "Slope rises toward",
    check: (t) => (SB_SLOPE_DIRS[String(t).trim()] ? "" : "Pick one"),
    def: "n",
  },
  /* plan Phase 3: "Outlines: show outline for chosen entities, in a chosen color; a + duplicates the row for another
     color": rows "who, who=#rrggbb; …" (sbOlRows) */
  ol: {
    name: "Outlines",
    check: (t) => (String(t).length <= 600 ? "" : "Too many rows"),
    def: "",
  },
  ent: listBox("Entities spawn here", ""), // (spawns, by their color or name: what they make comes in the zone)
  lt: listBox("Loot spawns here", ""), // (loot spots, by their color or name: their orbs lie in the zone)
  /* what its working squares show (plan Phase 3: "show an effect: one of the game's existing effects (the
     flamethrower's ground fire, and so on)"); everyone sees it, cheat mode or not */
  sfx: {
    name: "Its working squares show",
    check: (t) => (SB_SFX[String(t).trim()] ? "" : "Pick one"),
    def: "none",
  },
  /* its look (plan Phase 3: "Looks (zone purpose only): a texture from the maps (Cabin, Downpour, Euclid's Squares, the
     Kenoma looks; previews shown), a solid color with a hex picker, or an uploaded picture, always made into pixels (the
     original is never kept). See-through by 1% steps"); everyone sees it, cheat mode or not (sblooks.js) */
  lk: {
    name: "Look",
    check: (t) => (SB_LOOKS[String(t).trim()] ? "" : "Pick one"),
    def: "none",
  },
  lktex: {
    name: "Texture",
    check: (t) => (SB_LOOK_TEX[String(t).trim()] ? "" : "Pick a texture"),
    def: "cabin-wood",
  },
  lkcol: {
    name: "Color",
    check: (t) =>
      /^#[0-9a-f]{6}$/i.test(String(t).trim()) ? "" : "A color like #3a7d44",
    def: "#3a7d44",
  },
  lkpic: {
    name: "Picture",
    check: (t) =>
      /^[a-z0-9]{0,24}$/.test(String(t).trim()) ? "" : "Upload one",
    def: "",
  },
  lkop: { name: "See-through (%)", kind: "int", min: 0, max: 100, def: "0" },
};
export const SB_SLOPE_DIRS = { n: "Up", e: "Right", s: "Down", w: "Left" };
/* where (x, y) (shares of the map) is across block p, turned back by its turn: [u, v], each -0.5 to 0.5 inside it (u
   across its width, v down its height) */
export function sbLocal(s, p, x, y, W = 1, H = 1) {
  const [rx, ry] = sbUnit(s, W, H),
    [w, h] = sbSize(p),
    a = (-sbRot(p) * Math.PI) / 180,
    dx = (x - p.x) / rx,
    dy = (y - p.y) / ry;
  return [
    (dx * Math.cos(a) - dy * Math.sin(a)) / w,
    (dx * Math.sin(a) + dy * Math.cos(a)) / h,
  ];
}
export const SB_LOOKS = {
  none: "None",
  tex: "Texture",
  col: "Solid color",
  pic: "Picture",
};
/* the maps' textures (tools/bake-looks.py cuts the tiled ones from their ground) and the maps drawn whole */
export const SB_LOOK_TEX = {
  "cabin-wood": "Cabin floor",
  "cabin-deck": "Cabin deck",
  "cabin-checks": "Cabin kitchen",
  "cabin-tiles": "Cabin bathroom",
  "cabin-grass": "Cabin grass",
  "downpour-grass": "Downpour grass",
  "downpour-roof": "Downpour roof",
  "downpour-concrete": "Downpour concrete",
  "downpour-church": "Downpour church",
  euclid: "Euclid's Squares",
  nwk: "Nous Within Kenoma",
  ec: "Ether's Crossroads",
  nwkarch: "Architectured",
  nwkten: "Ten",
  nwkchalice: "Chalice",
  nwkfool: "The Fool",
};
/* a zone's look: null with none, else { k: "tex" | "col" | "pic", v: the texture, the color or the picture's key, op:
   how see-through, 0 to 1 } */
export function sbLook(p) {
  if (!p || p.k !== "zone" || !p.f) return null;
  const v = (f) => {
      const k = p.f[f],
        t = String(k && k.ok ? k.ok : SB_ZONE[f].def).trim();
      return SB_ZONE[f].check ? (SB_ZONE[f].check(t) ? SB_ZONE[f].def : t) : t;
    },
    k = v("lk");
  if (k === "none") return null;
  const val = v(k === "tex" ? "lktex" : k === "col" ? "lkcol" : "lkpic");
  if (!val) return null;
  const op = Math.min(100, Math.max(0, Math.round(+v("lkop") || 0))) / 100;
  return { k, v: val, op };
}
export const SB_SFX = {
  none: "Nothing",
  fire: "Ground fire",
  smoke: "Smoke",
  steam: "Steam",
  sparks: "Sparks",
};
export const sbSfx = (p) => {
  const k = p && p.f && p.f.sfx,
    v = String(k && k.ok ? k.ok : "none").trim();
  return SB_SFX[v] ? v : "none";
};
/* a duck length in a world's px, for a zone's size there (on the board: 0.03 of it across, 0.08 up and down) */
export const SB_ZONE_PX = 48;
/* a block's side as dragged or typed: whole duck lengths, tenths under one, a fifth at least, 40 at most */
export const sbFitSide = (v) =>
  Math.max(0.2, Math.min(40, v < 1 ? Math.round(v * 10) / 10 : Math.round(v)));
/* ---------- every build block's shape (plan Phase 2: "Spawn, respawn, loot and zone become one thing you put down") ----------
   A block has a shape and a size (zw, zh: duck lengths; a zone starts at 4 by 4, the rest at 1 by 1) or fills the whole
   map. Square by default; the others by adding sides, stopping once it already looks round. The shape is checked on a
   grid of quarter-duck squares, the same squares it's drawn with, so what you see is exactly what it covers */
export const SB_SHAPES = {
  sq: "Square",
  tri: "Triangle",
  pent: "Pentagon",
  hex: "Hexagon",
  circle: "Circle",
};
const SIDES = { tri: 3, pent: 5, hex: 6 };
export const SB_SHAPE = {
  sh: {
    name: "Shape",
    check: (t) => (SB_SHAPES[String(t).trim()] ? "" : "Pick a shape"),
    def: "sq",
  },
  fill: { name: "Fill the map", kind: "bool", def: "f" },
};
export const SB_CELLS = 4; // (grid squares to a duck length)
export const sbShape = (p) => (p && SB_SHAPES[p.sh] ? p.sh : "sq");
export const sbFills = (p) => !!(p && p.fill);
/* its size in duck lengths, [w, h] */
export const sbSize = (p) => {
  const d = p && p.k === "zone" ? 4 : 1;
  return [(p && p.zw) || d, (p && p.zh) || d];
};
/* does a block other than a zone cover more than its own spot (bigger than one duck, or the whole map) */
export const sbSpread = (p) =>
  !!p && (sbFills(p) || sbSize(p).some((v) => v > 1) || sbShape(p) !== "sq");
/* is (u, v), from -1 to 1 across the block's box, inside its shape. A regular polygon of n sides, one corner at the
   top, stretched to fill the box (its corners' own box, BOUNDS, maps onto -1..1): a point at angle a and distance r
   from its middle is inside when r * cos(a' - pi / n) <= cos(pi / n), a' being a's place inside its own wedge of
   2 pi / n */
const BOUNDS = {};
for (const [sh, n] of Object.entries(SIDES)) {
  const c = [...Array(n)].map((_, k) => (2 * Math.PI * k) / n);
  BOUNDS[sh] = [
    Math.max(...c.map(Math.sin)), // (half its width)
    Math.max(...c.map((a) => -Math.cos(a))), // (how far down its lowest corner or edge goes)
  ];
}
export function sbInShape(sh, u, v) {
  if (sh === "circle") return u * u + v * v <= 1;
  const n = SIDES[sh];
  if (!n) return Math.abs(u) <= 1 && Math.abs(v) <= 1;
  const [hw, low] = BOUNDS[sh],
    x = u * hw,
    y = -1 + ((v + 1) / 2) * (1 + low), // (from its top corner, -1, down to its bottom, low)
    w = (2 * Math.PI) / n,
    a = Math.atan2(x, -y), // (0 straight up, at the top corner)
    off = (((a % w) + w) % w) - w / 2;
  return Math.hypot(x, y) * Math.cos(off) <= Math.cos(Math.PI / n) + 1e-9;
}
/* block p's grid: [columns, rows] of its quarter-duck squares */
export const sbCells = (p) =>
  sbSize(p).map((v) => Math.max(1, Math.round(v * SB_CELLS)));
/* is grid square (i, j) of block p inside its shape (its middle is) */
export function sbCellIn(p, i, j) {
  const [cx, cy] = sbCells(p);
  return sbInShape(
    sbShape(p),
    ((i + 0.5) / cx) * 2 - 1,
    ((j + 0.5) / cy) * 2 - 1,
  );
}
/* a duck length in shares of the map, [across, up and down] */
export const sbUnit = (s, W, H) =>
  sbOnBoard(s) ? [0.03, 0.08] : [SB_ZONE_PX / W, SB_ZONE_PX / H];
/* how far block p is turned, in degrees (plan Phase 2: "while held, the arrow keys rotate") */
export const sbRot = (p) => ((((p && p.rot) || 0) % 360) + 360) % 360;
/* block p's box, [x0, y0, x1, y1] in shares of the map (W, H: a world's size in px): around it as it's turned; the
   whole map when it fills it */
export function sbZoneBox(s, p, W = 1, H = 1) {
  if (sbFills(p)) return [0, 0, 1, 1];
  const [rx, ry] = sbUnit(s, W, H),
    [w, h] = sbSize(p),
    a = (sbRot(p) * Math.PI) / 180,
    c = Math.abs(Math.cos(a)),
    n = Math.abs(Math.sin(a)),
    hw = ((w * c + h * n) * rx) / 2,
    hh = ((w * n + h * c) * ry) / 2;
  return [p.x - hw, p.y - hh, p.x + hw, p.y + hh];
}
/* is (x, y) (shares of the map) inside block p: turned back by its rotation into its own grid, on a square inside its
   shape */
export function sbInBlock(s, p, x, y, W = 1, H = 1) {
  if (sbFills(p)) return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  const [rx, ry] = sbUnit(s, W, H),
    [w, h] = sbSize(p),
    a = (-sbRot(p) * Math.PI) / 180,
    dx = (x - p.x) / rx,
    dy = (y - p.y) / ry, // (duck lengths from its middle)
    lx = dx * Math.cos(a) - dy * Math.sin(a),
    ly = dx * Math.sin(a) + dy * Math.cos(a);
  if (Math.abs(lx) > w / 2 || Math.abs(ly) > h / 2) return false;
  const [cx, cy] = sbCells(p),
    i = Math.min(cx - 1, Math.floor((lx / w + 0.5) * cx)),
    j = Math.min(cy - 1, Math.floor((ly / h + 0.5) * cy));
  return sbCellIn(p, i, j);
}
/* ---------- what a block does over time (plan Phase 3): its squares and their potential order ----------
   A block is a grid of squares (Square size, in duck lengths); its potential order says which squares act at each step
   (one step every "Seconds between"): all at once, one after another in a direction, alternating like a checkerboard,
   true random, or shuffle (never the same square twice until every one was used). Squares at once: how many act each
   step (blank: every one). Nothing random is sent: every screen works the squares out from the step number alone, the
   same way (sbActive), so the host only counts the steps (s.sb.zs) */
export const SB_ORDERS = {
  rand: "True random",
  abs: "Absolute (random over the whole map)",
  shuf: "Shuffle (new order each round)",
  shuf1: "Shuffle once (same order each round)",
  shufrow: "Shuffle rows",
  shufcol: "Shuffle columns",
  line: "One after another",
  alt: "Alternating",
  all: "All at once",
}; // (Absolute and the shuffles: plan Phase 3, "Absolute: a pattern that is true random across the whole board, not only inside the zone. Several kinds of shuffle, not just one")
export const SB_DIRS = {
  "": "No direction",
  right: "\u2192",
  left: "\u2190",
  down: "\u2193",
  up: "\u2191",
  dr: "\u2198",
  dl: "\u2199",
  ur: "\u2197",
  ul: "\u2196",
};
export const SB_ORDER = {
  ord: {
    name: "Potential order",
    check: (t) => (SB_ORDERS[String(t).trim()] ? "" : "Pick an order"),
    def: "rand",
  },
  dir: {
    name: "Direction",
    check: (t) =>
      SB_DIRS[String(t).trim()] !== undefined ? "" : "Pick a direction",
    def: "",
  },
  n: {
    name: "Squares at once (blank: all)",
    check: (t) =>
      String(t).trim() === "" ||
      (/^\d+$/.test(String(t).trim()) && +t >= 1 && +t <= 4096)
        ? ""
        : "Blank, or 1 to 4096",
    def: "",
  },
  sq: {
    name: "Square size (duck lengths)",
    check: (t) =>
      /^\d+(\.\d+)?$/.test(String(t).trim()) && +t >= 0.25 && +t <= 20
        ? ""
        : "0.25 to 20",
    def: "1",
  },
  st: {
    name: "Seconds per step",
    check: (t) =>
      /^\d+(\.\d+)?$/.test(String(t).trim()) && +t >= 0.1 && +t <= 600
        ? ""
        : "0.1 to 600",
    def: "1",
  },
  /* how its steps go (the owner's, Nov 20 02:45Z): on their own, one every "Seconds per step", or only when something
     uses it ("the next part of the algorithm only plays when the next input is given, such as spawn says time to spawn
     another entity") */
  go: {
    name: "Steps",
    check: (t) => (SB_GOES[String(t).trim()] ? "" : "Pick how it steps"),
    def: "time",
  },
};
export const SB_GOES = {
  time: "On a timer",
  use: "One step each use",
  enter: "One step each time a player steps in",
};
/* a tab's Caller (the owner's, Nov 20 02:45Z): a Spawn, Respawn or Loot tab works only while its Caller is the variable
   name of a zone on its block (the block itself, or one of its Zone tabs); blank: the block's own name */
export const SB_CALL = {
  call: {
    name: "Caller (a zone's variable name)",
    check: (t) => (String(t).length <= 40 ? "" : "Too long"),
    def: "",
  },
  /* the zone a block leads with: the first in its order, the one that sets how it looks (the owner's, Nov 20 02:45Z: "the
     tab that is first in order determines how it appears"); blank: the block itself */
  lead: { name: "Leads with", check: () => "", def: "" },
};
export const SB_CALL_ERR = "Make tab that shares variable name or color";
const CALLED = ["spawn", "respawn", "loot"];
/* a block's or tab's variable name: its own, or its color's */
export const sbNameOf = (q) => {
  const k = q && q.f && q.f.name;
  if (k && k.ok) return String(k.ok).trim();
  return !q || q.col === SB_NOCOL
    ? "No color"
    : q.col[0].toUpperCase() + q.col.slice(1);
};
/* a new block's or tab's variable name: six numbers at random, until it's typed out (the owner's, Nov 20 04:39Z: "the
   tabs have six random numbers randomly assigned as numbers until it is typed out") */
export const sbSix = () => String(100000 + Math.floor(Math.random() * 900000));
/* the name it was given (typed, or its six numbers), or "" with none (an older one's; the Caller it had counts as one) */
const ownName = (q) => {
  const k = q && q.f && (q.f.name || q.f.call);
  return k && k.ok ? String(k.ok).trim().toLowerCase() : "";
};
/* does tab q answer to a zone (a Spawn, Respawn or Loot tab) */
export const sbNeedsCall = (q) =>
  !!q && !!q.grp && q.pg === "t" && CALLED.includes(q.k);
/* how tab q is tied to zone z: { name, col } (the owner's, Nov 20 04:39Z: "every tab for spawn is connected by color or
   variable or both, not by a selection"; a color only when there is one) */
export function sbTie(q, z) {
  const n = ownName(q);
  return {
    name: !!n && n === ownName(z),
    col: !!q && !!z && q.col !== SB_NOCOL && q.col === z.col,
  };
}
/* the zone tab id answers to: the first zone on its block, in the block's order, that shares its variable name or its
   color; null when none does (it does nothing then) or it answers to nobody */
export function sbCallZone(pts, id) {
  const q = pts[id];
  if (!sbNeedsCall(q) || !pts[q.grp]) return null;
  return (
    sbZonesOn(pts, q.grp).find((z) => {
      const t = sbTie(q, pts[z]);
      return t.name || t.col;
    }) || null
  );
}
/* the tabs zone zid holds: [tab id, { name, col }] for each Spawn, Respawn and Loot tab on its block that answers to it */
export function sbHeld(pts, zid) {
  const z = pts[zid];
  if (!z) return [];
  const b = z.grp || zid;
  return Object.keys(pts)
    .filter((q) => pts[q].grp === b && sbCallZone(pts, q) === zid)
    .map((q) => [q, sbTie(pts[q], z)]);
}
/* is tab id working: not one that needs a Caller, or its Caller matches */
export const sbTabLive = (pts, id) =>
  !sbNeedsCall(pts[id]) || !!sbCallZone(pts, id);
/* block b's zones in their order: the one it leads with first (its "lead"), then the block itself, then its Zone tabs */
export function sbZonesOn(pts, b) {
  const base = pts[b];
  if (!base) return [];
  const all = [
      b,
      ...Object.keys(pts).filter(
        (z) => pts[z].grp === b && pts[z].pg === "t" && pts[z].k === "zone",
      ),
    ],
    lead = base.f && base.f.lead && base.f.lead.ok;
  return lead && all.includes(lead) && lead !== b
    ? [lead, ...all.filter((z) => z !== lead)]
    : all;
}
/* zone zid used once (a spawn made, a duck back, an orb dropped): one step on when it steps by use */
export function sbUsed(s, zid, by = "use") {
  const p = ((s.sb && s.sb.pts) || {})[zid];
  if (!p || sbGo(p) !== by) return;
  const zs = (s.sb && s.sb.zs) || {};
  s.sb = { ...s.sb, zs: { ...zs, [zid]: (zs[zid] || 0) + 1 } };
}
const ordTxt = (p, f) => {
  const k = p && p.f && p.f[f];
  return k && k.ok != null && k.ok !== "" ? String(k.ok) : SB_ORDER[f].def;
};
export const sbGo = (p) => {
  const g = ordTxt(p, "go").trim();
  return SB_GOES[g] ? g : "time";
};
export const sbOrd = (p) => {
  const o = ordTxt(p, "ord").trim();
  return SB_ORDERS[o] ? o : "rand";
};
const MAX_SIDE = 64; // (squares along a side at most: a big square size takes over past it)
/* block p's squares: { nx, ny, w, h (duck lengths), cells: the squares inside its shape, as i + j * nx } */
export function sbGrid(s, p, W = 1, H = 1) {
  let [w, h] = sbSize(p);
  if (sbFills(p)) {
    const [rx, ry] = sbUnit(s, W, H);
    [w, h] = [1 / rx, 1 / ry];
  }
  const sq = Math.max(+ordTxt(p, "sq") || 1, w / MAX_SIDE, h / MAX_SIDE),
    nx = Math.max(1, Math.round(w / sq)),
    ny = Math.max(1, Math.round(h / sq)),
    cells = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      if (
        sbFills(p) ||
        sbInShape(
          sbShape(p),
          ((i + 0.5) / nx) * 2 - 1,
          ((j + 0.5) / ny) * 2 - 1,
        )
      )
        cells.push(i + j * nx);
  if (!cells.length) cells.push(Math.floor(nx / 2) + Math.floor(ny / 2) * nx);
  return { nx, ny, w, h, cells };
}
/* a number from 0 to 1 that only ever depends on its inputs (the same on every screen) */
const hash = (...v) => {
  let x = 2166136261;
  for (const n of v) {
    x ^= n | 0;
    x = Math.imul(x, 16777619);
    x ^= x >>> 13;
    x = Math.imul(x, 0x5bd1e995);
    x ^= x >>> 15;
  }
  return (x >>> 0) / 4294967296;
};
const idNum = (id) =>
  [...String(id)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
const KEEP = new Map();
/* which of block id's squares act at step k: a Set of i + j * nx, or null when they all do */
export function sbActive(s, id, p, k, W = 1, H = 1) {
  const ord = sbOrd(p),
    g = sbGrid(s, p, W, H),
    N = g.cells.length,
    want = ordTxt(p, "n").trim(),
    n = want ? Math.min(N, Math.max(1, +want || 1)) : N;
  if (ord === "all" || (n >= N && ord !== "alt" && ord !== "abs")) return null;
  const key = `${id} ${ord} ${ordTxt(p, "dir")} ${n} ${g.nx}x${g.ny} ${N} ${k}`;
  if (KEEP.has(key)) return KEEP.get(key);
  const seed = idNum(id);
  let on;
  if (ord === "abs") {
    /* Absolute: the whole map is cut into squares of its size, and at each step each of them acts by chance, n of
       them on average for as many squares as the block has; the block acts on those of its squares that land on one */
    const [rx, ry] = sbUnit(s, W, H),
      sw = g.w / g.nx,
      sh = g.h / g.ny,
      NX = Math.max(1, Math.ceil(1 / rx / sw)),
      NY = Math.max(1, Math.ceil(1 / ry / sh)),
      odds = n / Math.max(N, NX * NY),
      a = (sbRot(p) * Math.PI) / 180;
    on = new Set(
      g.cells.filter((c) => {
        const lx = ((c % g.nx) + 0.5) * sw - g.w / 2,
          ly = (Math.floor(c / g.nx) + 0.5) * sh - g.h / 2,
          x = sbFills(p)
            ? 0.5 + lx / g.w
            : p.x + (lx * Math.cos(a) - ly * Math.sin(a)) * rx,
          y = sbFills(p)
            ? 0.5 + ly / g.h
            : p.y + (lx * Math.sin(a) + ly * Math.cos(a)) * ry,
          I = Math.floor(x * NX),
          J = Math.floor(y * NY);
        return hash(seed, k, I, J) < odds;
      }),
    );
  } else if (ord === "alt") {
    /* a checkerboard that flips every step ("Squares at once" left out: half of them) */
    on = new Set(
      g.cells.filter((c) => ((c % g.nx) + Math.floor(c / g.nx) + k) % 2 === 0),
    );
  } else if (ord === "rand") {
    on = new Set(
      g.cells
        .map((c) => [hash(seed, k, c), c])
        .sort((a, b) => a[0] - b[0])
        .slice(0, n)
        .map((x) => x[1]),
    );
  } else {
    /* one after another, or shuffle: a walk through every square, n at a time; shuffle deals a new order each round */
    let walk;
    if (ord === "line") {
      const d = ordTxt(p, "dir").trim(),
        { nx, ny } = g,
        at = (c) => {
          const i = c % nx,
            j = Math.floor(c / nx),
            I = /left|l$/.test(d) ? nx - 1 - i : i,
            J = /up|^u/.test(d) ? ny - 1 - j : j;
          if (d === "up" || d === "down") return [J, I]; // (rows first: the line moves up or down)
          if (d.length === 2) return [I + J, J]; // (a diagonal: corner to corner)
          return [I, J]; // (right, left, or none: column by column)
        };
      walk = [...g.cells].sort((a, b) => {
        const A = at(a),
          B = at(b);
        return A[0] - B[0] || A[1] - B[1];
      });
    } else {
      /* the shuffles: a new deal each round, one deal kept, or whole rows or columns dealt in a new order each round
         (each row left to right, each column top to bottom) */
      const round = ord === "shuf1" ? 0 : Math.floor((k * n) / N),
        line = (c) =>
          ord === "shufrow"
            ? Math.floor(c / g.nx)
            : ord === "shufcol"
              ? c % g.nx
              : -1;
      walk = g.cells
        .map((c) => [
          line(c) < 0 ? hash(seed, round, c) : hash(seed, round, line(c), -1),
          ord === "shufrow"
            ? c % g.nx
            : ord === "shufcol"
              ? Math.floor(c / g.nx)
              : 0,
          c,
        ])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .map((x) => x[2]);
    }
    const from = (k * n) % N;
    on = new Set();
    for (let i = 0; i < n; i++) on.add(walk[(from + i) % N]);
  }
  if (KEEP.size > 400) KEEP.clear();
  KEEP.set(key, on);
  return on;
}
/* the square of block p that (x, y) (shares of the map) is on, i + j * nx, or -1 off it */
export function sbCellAt(s, p, x, y, W = 1, H = 1) {
  const g = sbGrid(s, p, W, H);
  let lx, ly;
  if (sbFills(p)) {
    lx = x - 0.5;
    ly = y - 0.5;
    lx *= g.w;
    ly *= g.h;
  } else {
    const [rx, ry] = sbUnit(s, W, H),
      a = (-sbRot(p) * Math.PI) / 180,
      dx = (x - p.x) / rx,
      dy = (y - p.y) / ry;
    lx = dx * Math.cos(a) - dy * Math.sin(a);
    ly = dx * Math.sin(a) + dy * Math.cos(a);
  }
  if (Math.abs(lx) > g.w / 2 || Math.abs(ly) > g.h / 2) return -1;
  const i = Math.min(g.nx - 1, Math.floor((lx / g.w + 0.5) * g.nx)),
    j = Math.min(g.ny - 1, Math.floor((ly / g.h + 0.5) * g.ny));
  return i + j * g.nx;
}
/* the step block id is on now (the host counts them: sbzone.js) */
export const sbStep = (s, id) => ((s && s.sb && s.sb.zs) || {})[id] || 0;
/* is (x, y) on one of block p's squares that act now (its whole shape when they all do) */
export function sbActsAt(s, id, p, x, y, W = 1, H = 1) {
  const on = sbActive(s, id, p, sbStep(s, id), W, H);
  return !on || on.has(sbCellAt(s, p, x, y, W, H));
}
/* ---------- walls (plan Phase 3: "Walls: a switch: \"who can't pass\", a dropdown where you tick several entity kinds
   and groups. A thin rectangle is a wall.") ----------
   A zone's "Who can't pass" list stops whoever it takes on its working squares (all of them unless its potential
   order says otherwise). What already stands in one when it comes (placed on it, or a square that just started
   working) may walk out of it; nothing walks in. On a world a wall stands on its own floor, as tall as two floors. */
const WALL_LOW = 40,
  WALL_HIGH = 200; // (world px below and above its floor that it still stops)
const listOf = (p, f) =>
  String((p.f && p.f[f] && p.f[f].ok) || "")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
/* does list `who` (a behavior list's words) take w: { duck: its name } or an NPC { k: its kind, sp: its spawn } */
export function sbWhoTakes(s, who, w) {
  if (who.includes("everything")) return true;
  if (w.duck != null)
    return (
      who.includes("players") ||
      (!!w.duck && who.includes(String(w.duck).trim().toLowerCase()))
    );
  if (who.includes(w.k || "zombie")) return true;
  const q = ((s.sb && s.sb.pts) || {})[w.sp];
  return (
    !!q && (who.includes(q.col) || who.includes(sbNameOf(q).toLowerCase()))
  );
}
/* the zones that are walls to w, once for a whole beat: [{ id, p }] */
export function sbWalls(s, w) {
  const out = [];
  for (const [id, p] of Object.entries((s && s.sb && s.sb.pts) || {}))
    if (p.k === "zone" && p.f && p.f.wall && p.f.wall.ok) {
      if (sbWhoTakes(s, listOf(p, "wall"), w)) out.push({ id, p });
    }
  return out;
}
/* plan Phase 4: the climb zone w (as sbWhoTakes) is at (x, y, shares of the map) with its feet at z (world px) under its
   top: { top: its height, x, y: its middle } (the highest when several), or null */
export function sbClimbAt(s, w, x, y, z, W = 1, H = 1) {
  if (!isSb(s) || sbOnBoard(s)) return null;
  let best = null;
  for (const [id, p] of Object.entries((s.sb && s.sb.pts) || {})) {
    if (p.k !== "zone" || !p.f || !p.f.clm || !p.f.clm.ok) continue;
    const top = p.z || 0;
    if (top < (+z || 0) - 0.5 || (best && best.top >= top)) continue; // (a climb whose top is under my feet: not mine)
    if (!sbWhoTakes(s, listOf(p, "clm"), w)) continue;
    if (!sbInWorking(s, id, p, x, y, W, H)) continue;
    best = { top, x: p.x, y: p.y };
  }
  return best;
}
/* the walls to each NPC, worked out once a beat for each kind and spawn: wallsOf(o) */
export function sbNpcWalls(s) {
  const seen = new Map();
  return (o) => {
    const k = (o.k || "zombie") + "|" + o.sp;
    if (!seen.has(k)) seen.set(k, sbWalls(s, { k: o.k, sp: o.sp }));
    return seen.get(k);
  };
}
/* the zombie maps' and Duck Cabin's walkers (l4ddrules.js stepZombie): stops(z, x, y, zz) tests a small step (they turn
   round a wall as round anything in the way) and go(z, x, y, zz) takes it round the wall, as sbWallGo; null when no
   zone is a wall. W, H: the world's size; l4: the zombie maps' own zombies (their k is the roof they're up) */
export function sbZombieWall(s, W, H, l4 = false) {
  if (!isSb(s) || sbOnBoard(s)) return null;
  if (
    !Object.values((s.sb && s.sb.pts) || {}).some(
      (p) => p.f && p.f.wall && p.f.wall.ok,
    )
  )
    return null;
  const npcWalls = sbNpcWalls(s),
    wallsOf = (z) => npcWalls(l4 ? { k: "zombie", sp: z.sp } : z);
  return {
    stops: (z, x, y, zz) => {
      const ws = wallsOf(z);
      return (
        ws.length > 0 &&
        sbWallStops(s, ws, z.x / W, z.y / H, x / W, y / H, zz, W, H)
      );
    },
    go: (z, x, y, zz, ok) => {
      const ws = wallsOf(z);
      if (!ws.length) return [x, y];
      const [u, v] = sbWallGo(
        s,
        ws,
        z.x / W,
        z.y / H,
        x / W,
        y / H,
        zz,
        W,
        H,
        z,
        ok && ((a, b) => ok(a * W, b * H)),
      );
      return [u * W, v * H];
    },
  };
}
/* the walls (of list `walls`) that (x, y) at height z stands in (shares; z: world px) */
function wallsAt(s, walls, x, y, z, W, H) {
  const out = [];
  for (const { id, p } of walls) {
    if (!sbOnBoard(s)) {
      const dz = (+z || 0) - (p.z || 0);
      if (dz <= -WALL_LOW || dz >= WALL_HIGH) continue;
    }
    if (sbWorksAt(s, id, p, x, y, z, W, H, sbInv(p), false)) out.push(id);
  }
  return out;
}
/* is (x, y) in block p on one of its squares working now (an inverse one: outside every zone it goes with) */
export function sbInWorking(s, id, p, x, y, W = 1, H = 1) {
  return sbInBlock(s, p, x, y, W, H) && sbActsAt(s, id, p, x, y, W, H);
}
/* does a wall stop a step from (x0, y0) to (x1, y1): any spot along it in a wall that (x0, y0) isn't in. The step is
   looked at every tenth of a duck length, so a thin wall stops a long step too */
export function sbWallStops(s, walls, x0, y0, x1, y1, z, W = 1, H = 1) {
  if (!walls.length) return false;
  const [rx, ry] = sbUnit(s, W, H),
    n = Math.min(
      12,
      Math.max(1, Math.ceil(Math.hypot((x1 - x0) / rx, (y1 - y0) / ry) / 0.1)),
    ),
    was = wallsAt(s, walls, x0, y0, z, W, H);
  for (let i = 1; i <= n; i++) {
    const at = wallsAt(
      s,
      walls,
      x0 + ((x1 - x0) * i) / n,
      y0 + ((y1 - y0) * i) / n,
      z,
      W,
      H,
    );
    if (at.some((id) => !was.includes(id))) return true;
  }
  return false;
}
/* where something walking from (x0, y0) toward (x1, y1) ends up, the walls let it: the whole step, or along one way
   only (it slides along the wall). An NPC o (given) goes round it instead (also(x, y): false where something else
   stops it): along the wall, the same way (o.ws, 1 or -1)
   till its way is free, the other way at a corner */
export function sbWallGo(
  s,
  walls,
  x0,
  y0,
  x1,
  y1,
  z,
  W = 1,
  H = 1,
  o = null,
  also = null,
) {
  if (!walls.length) return [x1, y1];
  const free = (x, y) =>
      (x !== x0 || y !== y0) &&
      !sbWallStops(s, walls, x0, y0, x, y, z, W, H) &&
      (!also || also(x, y)), // (also: what else may stop it, the map's own solids)
    dx = x1 - x0,
    dy = y1 - y0,
    [rx, ry] = sbUnit(s, W, H),
    ux = dx / rx,
    uy = dy / ry,
    l = Math.hypot(ux, uy); // (the step in duck lengths)
  if (free(x1, y1)) {
    if (o && o.ws && l && free(x0 + (ux / l) * rx, y0 + (uy / l) * ry))
      delete o.ws; // (round it: a duck length ahead is clear)
    return [x1, y1];
  }
  if (o) {
    if (!l) return [x0, y0];
    if (!o.ws && dx && dy)
      for (const t of [
        [x0 + Math.sign(dx) * l * rx, y0],
        [x0, y0 + Math.sign(dy) * l * ry],
      ])
        if (free(...t)) {
          o.ws =
            t[0] === x0 ? Math.sign(dy * ux) || 1 : -Math.sign(dx * uy) || 1;
          return t; // (slid along one way, the whole step: its speed kept, and that way kept)
        }
    for (let k = 0; k < 2; k++) {
      const side = o.ws || (o.i % 2 ? 1 : -1),
        px = -uy * side,
        py = ux * side, // (a right angle to its way)
        tries = [
          [x0 + px * rx, y0 + py * ry],
          Math.abs(py) >= Math.abs(px)
            ? [x0, y0 + Math.sign(py) * l * ry]
            : [x0 + Math.sign(px) * l * rx, y0], // (straight along the wall, when the right angle leans into it)
        ];
      o.ws = side;
      for (const t of tries) if (free(...t)) return t;
      o.ws = -side; // (a corner: the other way)
    }
    return [x0, y0];
  }
  for (const [x, y] of [
    [x1, y0],
    [x0, y1],
  ])
    if (free(x, y)) return [x, y];
  return [x0, y0];
}
/* the middles of block id's working squares (all of them when they all act), in shares, at most `most` of them spread
   evenly: where its effect shows (game.js) */
export function sbCellMids(s, id, p, W, H, most = 120) {
  const g = sbGrid(s, p, W, H),
    on = sbActive(s, id, p, sbStep(s, id), W, H),
    list = on ? [...on] : g.cells,
    every = Math.max(1, Math.ceil(list.length / most)),
    [rx, ry] = sbUnit(s, W, H),
    a = (sbRot(p) * Math.PI) / 180,
    out = [];
  for (let i = 0; i < list.length; i += every) {
    const c = list[i],
      lx = ((c % g.nx) + 0.5) / g.nx - 0.5,
      ly = (Math.floor(c / g.nx) + 0.5) / g.ny - 0.5;
    if (sbFills(p)) out.push({ x: lx + 0.5, y: ly + 0.5, c });
    else {
      const X = lx * g.w,
        Y = ly * g.h;
      out.push({
        x: p.x + (X * Math.cos(a) - Y * Math.sin(a)) * rx,
        y: p.y + (X * Math.sin(a) + Y * Math.cos(a)) * ry,
        c,
      });
    }
  }
  return out;
}
/* a spot at random in one of block p's acting squares, in shares, or null when they all act */
function actingSpot(s, p, W, H) {
  const pts = (s && s.sb && s.sb.pts) || {},
    id = Object.keys(pts).find((q) => pts[q] === p);
  if (!id) return null;
  const on = sbActive(s, id, p, sbStep(s, id), W, H);
  if (!on || !on.size) return null;
  const g = sbGrid(s, p, W, H),
    list = [...on],
    c = list[Math.floor(Math.random() * list.length)],
    lx = ((c % g.nx) + Math.random()) / g.nx - 0.5,
    ly = (Math.floor(c / g.nx) + Math.random()) / g.ny - 0.5;
  if (sbFills(p)) return { x: lx + 0.5, y: ly + 0.5 };
  const [rx, ry] = sbUnit(s, W, H),
    a = (sbRot(p) * Math.PI) / 180,
    X = lx * g.w,
    Y = ly * g.h;
  return {
    x: p.x + (X * Math.cos(a) - Y * Math.sin(a)) * rx,
    y: p.y + (X * Math.sin(a) + Y * Math.cos(a)) * ry,
  };
}
/* block p's outline as points round its edge, in shares of the map ({ x, y }; W, H as sbZoneBox): its shape's edge,
   looked for along n rays from its middle, turned as it is */
const RIMS = new Map();
export function sbOutline(s, p, W = 1, H = 1, n = 48) {
  const sh = sbShape(p),
    key = sh + n;
  if (!RIMS.has(key)) {
    const rim = [];
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n,
        c = Math.cos(a),
        d = Math.sin(a);
      let lo = 0,
        hi = Math.SQRT2;
      for (let k = 0; k < 14; k++) {
        const m = (lo + hi) / 2;
        if (sbInShape(sh, m * c, m * d)) lo = m;
        else hi = m;
      }
      rim.push([lo * c, lo * d]); // (-1 … 1 across its box)
    }
    RIMS.set(key, rim);
  }
  const [rx, ry] = sbUnit(s, W, H),
    [w, h] = sbSize(p),
    t = (sbRot(p) * Math.PI) / 180;
  return RIMS.get(key).map(([u, v]) => {
    const X = (u * w) / 2,
      Y = (v * h) / 2;
    return {
      x: p.x + (X * Math.cos(t) - Y * Math.sin(t)) * rx,
      y: p.y + (X * Math.sin(t) + Y * Math.cos(t)) * ry,
    };
  });
}
/* ---------- Outlines (plan Phase 3) ----------
   A zone's Outlines rows: whoever a row takes, standing where the zone works, shows an outline in that row's color (the
   first row that takes it, of the first zone it stands in) */
export const SB_OL_DEF = "#ffd23f";
export function sbOlRows(p) {
  const t = String((p && p.f && p.f.ol && p.f.ol.ok) || "");
  return t
    .split(";")
    .map((r) => {
      const [who, c] = r.split("=");
      return [
        String(who || "")
          .toLowerCase()
          .split(/[\s,]+/)
          .filter(Boolean),
        /^#[0-9a-f]{6}$/i.test(String(c || "").trim())
          ? String(c).trim().toLowerCase()
          : SB_OL_DEF,
      ];
    })
    .filter(([who]) => who.length);
}
let OLS = { s: null, zl: [] }; // (the zones with outlines, worked out once for each state)
/* the outline color of w (as sbWhoTakes) at (x, y), height z (shares; world px), or "" */
export function sbOlColor(s, w, x, y, z, W = 1, H = 1) {
  if (!isSb(s) || !s.sb) return "";
  if (OLS.s !== s.sb) {
    OLS = { s: s.sb, zl: [] };
    for (const [id, p] of Object.entries(s.sb.pts || {}))
      if (p.k === "zone" && p.f && p.f.ol && p.f.ol.ok) {
        const rows = sbOlRows(p);
        if (rows.length) OLS.zl.push({ id, p, rows });
      }
  }
  for (const { id, p, rows } of OLS.zl) {
    if (!sbWorksAt(s, id, p, x, y, z, W, H)) continue;
    for (const [who, c] of rows) if (sbWhoTakes(s, who, w)) return c;
  }
  return "";
}
export const sbHasOl = (s) =>
  isSb(s) && !!s.sb && (sbOlColor(s, {}, -9, -9, 0), OLS.zl.length > 0);
/* ---------- Inverse (plan Phase 3) ----------
   A zone or a tab whose Inverse is on works outside its zone: outside every zone with the same variable name or the
   same color, too (a zone with no color goes only with the ones sharing its name). On a world, still on its floor */
export const sbInv = (p) => {
  const k = p && p.f && p.f.inv;
  return !!k && /^t/i.test(String(k.ok || "").trim());
};
const named = (q) => !!(q.f && q.f.name && q.f.name.ok);
/* zone p and the zones that go with it */
export function sbZoneKin(s, p) {
  const out = [p],
    nm = named(p) && sbNameOf(p).toLowerCase();
  for (const q of Object.values((s.sb && s.sb.pts) || {}))
    if (
      q !== p &&
      q.k === "zone" &&
      ((nm && named(q) && sbNameOf(q).toLowerCase() === nm) ||
        (p.col && p.col !== SB_NOCOL && q.col === p.col))
    )
      out.push(q);
  return out;
}
const onFloor = (s, p, z) =>
  sbOnBoard(s) || Math.abs((+z || 0) - (p.z || 0)) < 40;
/* is (x, y) at height z (shares; world px) where zone id, p, works: inside it on a working square, or for an Inverse
   one (inv) outside it and the zones that go with it, on its floor */
export function sbWorksAt(
  s,
  id,
  p,
  x,
  y,
  z,
  W = 1,
  H = 1,
  inv = sbInv(p),
  floor = true,
) {
  if (floor && !onFloor(s, p, z)) return false; // (floor false: the caller has its own, a wall's)
  if (inv) return !sbZoneKin(s, p).some((q) => sbInBlock(s, q, x, y, W, H));
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H);
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  return sbInWorking(s, id, p, x, y, W, H);
}
/* a spot at random outside zone p and its kin (an Inverse tab's), anywhere on the map a duck can stand */
function outSpot(s, p, W, H, ok) {
  const board = sbOnBoard(s),
    kin = sbZoneKin(s, p),
    z = p.z || 0;
  for (let i = 0; i < 60; i++) {
    const x = +(board ? 0.01 + Math.random() * 0.98 : Math.random()).toFixed(4),
      y = +(board ? 0.03 + Math.random() * 0.94 : Math.random()).toFixed(4);
    if (kin.some((q) => sbInBlock(s, q, x, y, W, H))) continue;
    if (!ok || ok(x, y, z)) return { x, y, z };
  }
  return { x: p.x, y: p.y, z };
}
/* a spot at random inside zone p, { x, y, z }: on the board within its edges; on a world one a duck can stand on (ok(x, y,
   z), in shares), or the zone's middle, where its builder stood. inv (an Inverse tab): anywhere outside it */
export function sbZoneSpot(s, p, W = 1, H = 1, ok = null, inv = false) {
  if (inv) return outSpot(s, p, W, H, ok);
  const [x0, y0, x1, y1] = sbZoneBox(s, p, W, H),
    board = sbOnBoard(s),
    z = p.z || 0;
  for (let i = 0; i < 24; i++) {
    const on = actingSpot(s, p, W, H); // (its potential order: only the squares that act now)
    let x = on ? on.x : x0 + Math.random() * (x1 - x0),
      y = on ? on.y : y0 + Math.random() * (y1 - y0);
    if (board) {
      x = Math.min(0.99, Math.max(0.01, x));
      y = Math.min(0.97, Math.max(0.03, y));
    }
    // (rounded to 4 places, never out past the zone's edge: the rounding could take it 0.00005 outside)
    x = Math.min(
      Math.floor(x1 * 1e4) / 1e4,
      Math.max(Math.ceil(x0 * 1e4) / 1e4, +x.toFixed(4)),
    );
    y = Math.min(
      Math.floor(y1 * 1e4) / 1e4,
      Math.max(Math.ceil(y0 * 1e4) / 1e4, +y.toFixed(4)),
    );
    if (!sbInBlock(s, p, x, y, W, H)) continue; // (in its box but outside its shape)
    if (!ok || ok(x, y, z)) return { x, y, z };
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
    .filter(([pid, q]) =>
      !sbTabLive(pts, pid)
        ? false // (a tab whose Caller names no zone)
        : q.k === "respawn"
          ? forMe(said(q, "who", q.col))
          : (q.k === "spawn" || q.k === "zone") &&
            ["t", "true"].includes(said(q, "pon", "f")) &&
            forMe(said(q, "pwho", "players")),
    )
    .map(([pid, q]) => ({ ...q, id: pid }));
  const q = rs.length ? rs[Math.floor(Math.random() * rs.length)] : null,
    zid = q && sbCallZone(pts, q.id);
  if (zid) {
    const at = sbZoneSpot(s, pts[zid], W, H, ok, sbInv(q)); // (where its zone's algorithm says; Inverse: outside it)
    sbUsed(s, zid);
    return { ...q, ...at };
  }
  return q && (q.k === "zone" || sbSpread(q))
    ? { ...q, ...sbZoneSpot(s, q, W, H, ok) }
    : q; // (a zone, or a block bigger than its spot: anywhere in its shape)
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
    check: (t) => (String(t).length <= 300 ? "" : "Too many"),
    /* nothing at first: a new loot tab drops nothing until I pick what it holds (the owner's, Nov 20 02:37Z: "When you
       click a loot tab, it does not spawn the loot in it automatically") */
    def: "",
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
/* gear an orb can hold on Dead Ducks Arcade's maps: the flashlight. In Sandbox a duck there has none until it takes one
   (the owner's, Nov 19: every zombie mechanic "besides flashlight, but flashlight can be added as loot"); it keeps it
   for good, in s.sb.fl */
export const SB_GEAR = { flashlight: "Flashlight" };
export const sbNoLight = (s, id) =>
  isSb(s) && baseMode(s.options) === "l4dd" && !((s.sb && s.sb.fl) || {})[id];
