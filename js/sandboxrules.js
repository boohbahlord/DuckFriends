/* ---------- Sandbox: which map it plays on, and who may build (stage 1, the shell) ----------
   The owner's Sandbox (Nov 19, /mnt/project-files/sandbox/sandbox-mode-rules.txt and the 01:34Z answers): a mode under
   Special with no rounds that never ends ("Leave Sandbox" at the top left, as in round zero of Dead Ducks Arcade or in
   Hangout), on any map. The simple board maps (Agree or Disagree's kind, whatever the background) are one map: the
   plain board. The maps with a world of their own are walked whole, with everything that map has in its own mode:
   Duck Cabin as in Hangout, Downpour as in Dead Ducks Arcade, but with no rounds, no
   zombies and no end (s.options.sbMap picks one of those; empty: the board).
   This file has no imports, so every part of the game (the rules, the world's layout, the screen) can ask it. */
import { LANG } from "./langname.js";
import { TILE } from "./units.js";

/* the worlds Sandbox can be on: the mode whose world it is */
export const SB_WORLDS = { cabin: "hang", downpour: "l4dd" };
export const SB_WORLD_NAMES = { cabin: "Duck Cabin", downpour: "Downpour" };
export const isSb = (s) => !!s && !!s.options && s.options.mode === "sandbox";
/* Sandbox's world (a key of SB_WORLDS), or "" on the board (and in every other mode) */
export const sbWorld = (o) =>
  !!o && o.mode === "sandbox" && SB_WORLDS[o.sbMap] ? o.sbMap : "";
/* the mode whose rules and world run: the room's own, or, in Sandbox on a world, that world's mode ("sandbox" on the
   board) */
export const baseMode = (o) => {
  const w = sbWorld(o);
  if (o && o.mode === "surv") return "l4dd"; // (Survival runs on Dead Ducks Arcade's engine: survrules.js)
  return w ? SB_WORLDS[w] : (o && o.mode) || "";
};
/* Sandbox on a world map (it runs as Hangout or Dead Ducks Arcade does there) */
export const sbOnWorld = (s) => isSb(s) && !!sbWorld(s.options);
/* Sandbox on the board: its one phase, "sandbox" */
export const sbOnBoard = (s) => isSb(s) && !sbWorld(s.options);

/* who may build (b), make NPCs (m), write Seriat (n), set the hotbar (h), the game (g) and the players (p): the host;
   everyone when Democracy of Ducklings lets everyone change the settings (the owner's answer 2, Nov 19 01:34Z); and
   whoever the host lets (p, later: s.sb.ok = { id: true }). A new host takes the old one's place at once, since this
   asks who the host is now */
/* a made game mode being played (or tested: sbsave.js, gmodes.js): nobody changes the Sandbox, as players see it */
export const sbPlaying = (s) => isSb(s) && !!s.gmPlay;
export function sbCan(s, id) {
  if (!isSb(s) || !id || !s.players[id] || s.players[id].bot) return false;
  if (s.gmPlay) return false; // (a made game mode: no tools)
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
  if (s.gmPlay) return false; // (a made game mode: no tools)
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
  /* a real-build test of a zombie game (Nov 20): "Nothing ends the game when everyone is out of lives ... We need
     a 'When everyone is out' row (game over / back to lobby / restart)". Keep playing is how it always was */
  out: {
    name: "When everyone is out of lives",
    kind: "pick",
    opts: [
      ["keep", "Keep playing"],
      ["over", "Game over"],
      ["lobby", "Back to the lobby"],
      ["again", "Start over"],
    ],
    def: "keep",
  },
  /* the owner's, Nov 20 18:46Z: "waves or rounds in sandbox ... Waves are based off of survival, rounds are based off of
     Dead Ducks Arcade ... the zones themselves, when a certain like setting or format is selected, that a new section
     shows up to actually connect them to certain event causes in the game settings file for waves or rounds", and 19:02Z:
     zones keep their own start conditions; "comes in with waves or rounds" only says when (sbspawn.js wavesTick). A wave
     lasts its seconds; a round lasts until everything its spawns brought is down. Then a rest, then the next */
  wr: {
    name: "Waves or rounds",
    kind: "pick",
    opts: [
      ["off", "None"],
      ["waves", "Waves (as Survival: a wave lasts its time)"],
      ["rounds", "Rounds (as Dead Ducks Arcade: until all are down)"],
    ],
    def: "off",
  },
  wrn: {
    name: "How many (0: no end)",
    kind: "int",
    min: 0,
    max: 999,
    def: "0",
  },
  wlen: {
    name: "A wave lasts (seconds)",
    kind: "int",
    min: 5,
    max: 900,
    def: "60",
  },
  wrest: {
    name: "Rest between them (seconds)",
    kind: "int",
    min: 0,
    max: 600,
    def: "20",
  },
  /* the owner's, Nov 19 21:59Z: "There should be a board size limit that changes the size of the map ... we'll do
     percentage instead, right? 100% is the minimum. But ... if the map is bigger, the camera follows the duck as they
     move around like it does in Downpour or Cabin". The plain boards only (the worlds have their own size) */
  size: {
    name: "Board size % (100 is the smallest)",
    kind: "int",
    min: 100,
    max: 400,
    def: "100",
    board: true,
  },
  /* plan Phase 7, the owner's: "set in the game settings if their game mode can allow for map selection". The boards
     only: a game mode made on Downpour or a cabin is always played there */
  pickmap: {
    name: "Game mode: players pick the map",
    kind: "bool",
    def: "f",
    board: true,
  },
  /* plan Phase 6: "anything the menus don't show lives in a read-only-by-default settings folder in Seriat" (the owner's,
     Nov 19 21:59Z: "Crit percent chance could be in a file that the players can change, among other settings", gore,
     and "you can change the limit for the amount of players within a game mode in the file ... 8 players max, which is
     the normal ... or you can make it 4 players max"; "it's 2 players max for the actual game mode when it's made, not
     for the actual sandbox itself that makes the game mode"). Seriat's settings/limits (shell.js), never G's window */
  critp: {
    name: "crit chance",
    kind: "int",
    min: 0,
    max: 100,
    def: "own",
    own: true, // ("own": each weapon's own chance)
    file: true,
  },
  /* plan, Loot 1: "Loot limit ... G has the same limit for the whole map": the most orbs every loot block together lays
     in a whole game */
  lootmax: {
    name: "Loot limit on the whole map (0: none)",
    kind: "int",
    min: 0,
    max: 1000,
    def: "0",
  },
  /* the owner's, Nov 19 (A14): "whenever it comes to making a map locked to a game mode ... the background image with
     the game mode and the template used and everything has to be set to Noose within Konoma full variant". The look
     the whole game wears over whatever map it's on, as Survival wears the book's (maps.js mountMap) */
  look: {
    name: "Game mode: its look",
    kind: "pick",
    opts: [
      ["own", "The map's own"],
      ["nwk", "Nous Within Kenoma"],
      ["ec", "Ether's Crossroads"],
      ["nwkarch", "Architectured"],
      ["nwkten", "Ten"],
      ["nwkchalice", "Chalice"],
      ["nwkfool", "The Fool"],
    ],
    def: "own",
  },
  gore: { name: "gore", kind: "bool", def: "t", file: true },
  most: {
    name: "player limit",
    kind: "int",
    min: 2,
    max: 8,
    def: "8",
    file: true,
  },
};
/* rule k now: a whole number (lives) or true / false */
export function sbRule(s, k) {
  const b = SB_RULES[k],
    t = String(((s && s.sb && s.sb.rules) || {})[k] ?? b.def).trim();
  if (b.kind === "bool") return !/^f/i.test(t);
  if (b.kind === "pick") return b.opts.some(([v]) => v === t) ? t : b.def;
  if (b.own && /^own$/i.test(t)) return -1; // (each weapon's own)
  const n = Math.round(+t);
  return Number.isFinite(n) ? Math.min(b.max, Math.max(b.min, n)) : +b.def;
}
/* how many times bigger Sandbox's plain board is than the screen's (Board size %), 1 everywhere else */
export const sbBoardK = (s) =>
  sbOnBoard(s) ? Math.max(1, sbRule(s, "size") / 100) : 1;
/* a duck's length on the board, in shares of it: 0.03 across, 0.08 up and down (on a bigger board, k times less) */
export function boardDuck(s) {
  const k = sbBoardK(s);
  return k === 1 ? BOARD_DUCK : [0.03 / k, 0.08 / k];
}
const BOARD_DUCK = [0.03, 0.08];
/* { t: "sbr", k, v }: whoever may change Sandbox sets rule k */
export function sbRulesAct(s, a) {
  if (a.k === "it") return itemRuleAct(s, a);
  const b = Object.hasOwn(SB_RULES, a.k) ? SB_RULES[a.k] : null;
  if (!isSb(s) || !b || !sbCan(s, a.id)) return false;
  let v = String(a.v ?? "").trim();
  if (b.kind === "bool") v = /^f/i.test(v) || v === "" ? "f" : "t";
  else if (b.kind === "pick") {
    if (!b.opts.some(([o]) => o === v)) return false;
  } else if (b.own && /^own$/i.test(v)) v = "own";
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
/* ---------- G's rows for every weapon and item (plan, Loot 5) ----------
   "G: has the same rows for every weapon and item, and \"Breaks when empty\" can be set for all items or for one. Any
   row set there rules every copy of that item in the game." Which wins: G, then groups, then loot, then the player's;
   a row left blank (or a switch on neutral) steps aside. Kept in s.sb.it = { "<item>_<row>": its text }, and
   "all_brk" for every item; { t: "sbr", k: "it", f, v } sets one ("" clears it) */
function itemRuleAct(s, a) {
  const m = /^(all|[a-z0-9]{1,24})_([a-z]+)$/.exec(String(a.f || "")),
    b = m && Object.hasOwn(SB_ITEM, m[2]) ? SB_ITEM[m[2]] : null;
  if (!isSb(s) || !b || !sbCan(s, a.id)) return false;
  if (m[1] === "all" && m[2] !== "brk") return false;
  const v = String(a.v ?? "")
    .trim()
    .slice(0, 12);
  if (v && !itemOk(b, v)) return false;
  const it = { ...((s.sb && s.sb.it) || {}) };
  if ((it[a.f] || "") === v) return false;
  if (v) it[a.f] = v;
  else delete it[a.f];
  s.sb = { ...s.sb, it };
  return true;
}
/* is v good for item row b (a plain number here, or a percent where it takes one; t or f for a switch) */
function itemOk(b, v) {
  if (b.kind === "bool") return /^[tf]$/.test(v);
  if (b.pct) return !b.check(v);
  if (!/^\d+(\.\d)?$/.test(v)) return false;
  if (b.kind === "int" && !/^\d+$/.test(v)) return false;
  return +v >= b.min && +v <= b.max;
}
/* G's text for item w's row k (its own, or every item's for Breaks when empty), or "" */
export function sbItemG(s, w, k) {
  const it = (s && s.sb && s.sb.it) || {};
  return it[`${w}_${k}`] || (k === "brk" ? it.all_brk || "" : "");
}
/* item w's numbers as G sets them: the loot's form (sbloot.js modsOf), every row null where G leaves it */
const NO_MODS = Object.freeze({});
export function sbItemMods(s, w) {
  if (!s || !s.sb || !s.sb.it) return NO_MODS; // (G sets nothing: the quick way, read every shot)
  const t = (k) => sbItemG(s, w, k),
    tf = (k) => (t(k) ? t(k) === "t" : null),
    n = (k) => (t(k) && +t(k) > 0 ? +t(k) : null),
    d = sbPct(t("dmg")),
    a = sbPct(t("ammo"));
  return {
    dmg: d && d.v != null ? d.v : null,
    dmgP: d && d.p != null ? d.p : null,
    ammo: a && a.v != null ? Math.round(a.v) : null,
    ammoP: a && a.p != null ? a.p : null,
    n: n("n") && Math.round(n("n")),
    inf: tf("inf"),
    rl: tf("rl"),
    brk: tf("brk"),
    cool: n("sps") ? 1000 / n("sps") : n("cd") ? n("cd") * 1000 : null,
  };
}
/* mods a over b: each row a sets wins (G over loot) */
export const sbModsOver = (a, b) => {
  const out = { ...b };
  for (const [k, v] of Object.entries(a || {})) if (v != null) out[k] = v;
  return out;
};
/* gore off: the room's Gore setting, or Sandbox's settings file (gore = false) */
export const noGoreOf = (s) =>
  !!+s.options.noGore || (isSb(s) && !sbRule(s, "gore"));
/* Seriat's settings/limits: the file rules as "name = value" lines */
export function sbSettingsText(s) {
  return (
    "# Sandbox settings that no menu shows. Read-only: turn on write (Permissions, or chmod u+w limits) to change one.\n" +
    "# crit chance: 0 to 100 (%), or own (each weapon's own). gore: true or false. player limit: 2 to 8.\n" +
    Object.entries(SB_RULES)
      .filter(([, b]) => b.file)
      .map(
        ([k, b]) =>
          `${b.name} = ${String(((s && s.sb && s.sb.rules) || {})[k] ?? b.def)
            .replace(/^t$/, "true")
            .replace(/^f$/, "false")}`,
      )
      .join("\n") +
    "\n"
  );
}
/* the file read back: [[k, value]] for each "name = value" line naming a file rule (the rest is left alone) */
export function sbSettingsRead(text) {
  const by = Object.fromEntries(
      Object.entries(SB_RULES)
        .filter(([, b]) => b.file)
        .map(([k, b]) => [b.name, k]),
    ),
    out = [];
  for (const line of String(text).split("\n")) {
    const m = /^\s*([a-z ]+?)\s*=\s*(\S+)\s*$/i.exec(line.replace(/#.*/, ""));
    if (m && by[m[1].toLowerCase()]) out.push([by[m[1].toLowerCase()], m[2]]);
  }
  return out;
}

/* ---------- Sandbox's spawns and respawns: the settings (stage 2) ----------
   ONE list of settings that a spawn, a respawn, a made NPC and a zone (SB_ZONE, below) all read. Each box keeps the text as
   it was typed and its last good text (seriatbox.js keep()), so a box written wrong never breaks anything.
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
    min: 0, // (0: no wait, one each beat up to its limit; zero is real, the owner's, Nov 20 17:25Z)
    max: 600,
    def: "4",
  }, // ("default is four seconds"; "you can do a decimal point for time in between spawns")
  hp: { name: "HP", kind: "tenth", min: 0.1, max: 1000, def: "3" }, // (a zombie's own: l4ddrules.js L4.HP; tenths: the owner's "I agree with the HP decimal system", any HP above 0 keeps it standing)
  damage: { name: "Damage", kind: "tenth", min: 0, max: 100, def: "1" }, // ("decimal form to the tenth place"; 0: it hurts nobody)
  /* "1 is default ... 5 is the max"; 0 was not allowed until the owner's Nov 20 17:25Z: "the seriat input for things should
     also be able to have a value of zero with it's own unique meaning, such as movement. Spawns or respawns dont move off
     their position anymore to make room, since their movement being zero means zero": 0 never walks and is never pushed
     aside (sbspawn.js, sbcabin.js, l4ddrules.js separate) */
  speed: { name: "Speed", kind: "tenth", min: 0, max: 5, def: "1" },
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
  /* the owner's, Nov 20 18:46Z and 19:02Z: a spawn that comes in with G's waves or rounds: pressed once as each one starts,
     and its own start (auto, continuous, its key) only works while one is on (sbspawn.js wavesTick) */
  wr: { name: "Comes in with waves or rounds (G)", kind: "bool", def: "f" },
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
/* what M sets for an NPC, a kind's defaults or one I made (the owner's, Nov 20 17:25Z: "in ai behaviors, things like ai
   should be able to have very similiar options to spawn IN their UI settings for M"): a spawn's own settings, and its
   Brain */
export const SB_MSET = [...SB_OWN, "brain"];
/* a spawn's Players tab: ducks spawn here (they start, join and come back from being down here) when it's on, the ones
   its "who" names (players, or their names), with its HP and speed; blank is the game's own */
export const SB_PLAYER = {
  pon: { name: "Players spawn here", kind: "bool", def: "f" },
  php: { name: "Players' HP", kind: "tenth", min: 0.1, max: 100, blank: true }, // (tenths, as HP's)
  pspd: {
    name: "Players' speed",
    kind: "tenth",
    min: 0, // (0: they can't walk; blank: the game's own)
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
export const SB_GEO = ["x", "y", "z", "sh", "fill", "rot", "ns", "fh", "fv"];
export const SB_GEO_F = ["sh", "fill", "zw", "zh"];
/* ---------- Sandbox's board zones (stage 5) ----------
   The owner's Sandbox file, "Board Build": "A large sqaure amount of pixels CAN be used to overwrite the board with an
   effect (not an actual solid). It is transparent and assigned any color that the spawns or respawns has." A zone can be
   where players, entities or loot spawn; it can damage, heal (each at its own rate) or kill. Its settings work as a
   spawn's do, its colors as theirs. "Sections colored from board build is invisible": a zone is seen only while the
   Build window is up (sbspawnview.js). A zone is a point as a spawn is ({ k: "zone", …, zw, zh: its size in duck
   lengths } in s.sb.pts), with these boxes */
/* a zone's Act, in its potential order (the owner's, Nov 20 17:25Z: "act should be a thing in algorithim ... damage (from a
   dropdown list) heal (from dropdown list) seriat (this is on the top of the list"): what each of its steps does to who
   it hits. Seriat: its Seriat boxes (SB_ZONE.sa) */
export const SB_FX = {
  seriat: "Seriat",
  damage: "Damage",
  heal: "Heal",
  kill: "Kill",
  none: "Nothing",
};
/* what a zone's Seriat box acts on, each picked under it ("another box appears below it, and it is a dropdown list ...
   multiple options can be selected"): HP gains the value (less than 0: loses it); the rest become it, and stay so after
   (an NPC's; a duck's Speed too: its walk) */
export const SB_SA_ON = {
  hp: "HP",
  speed: "Speed",
  damage: "Damage",
  regen: "Regen HP each second",
  hitbox: "Hitbox (%)",
};
/* a zone's Seriat boxes, kept in one box (sa): a line each, its value, a tab, then what it acts on (comma separated) */
export const sbSaRows = (p) =>
  String((p && p.f && p.f.sa && p.f.sa.ok) || "")
    .split("\n")
    .map((l) => {
      const [v = "", on = ""] = l.split("\t");
      return { v, on: on.split(",").filter((k) => SB_SA_ON[k]) };
    })
    .filter((r, i, all) => r.v.trim() || r.on.length || all.length === 1);
export const sbSaText = (rows) =>
  rows
    .map((r) => `${String(r.v).replace(/[\t\n]/g, " ")}\t${r.on.join(",")}`)
    .join("\n");
const listBox = (name, def) => ({
  name,
  check: (t) => (String(t).length <= 200 ? "" : "200 letters at most"),
  def,
  len: 200, // (its text kept up to this long: sbspawn.js withField; a plain box keeps 80)
});
const sideBox = (name) => ({
  name,
  kind: "int",
  per: TILE,
  min: 1,
  max: 160,
  def: "16",
}); // (per: duck lengths in one)
export const SB_ZONE = {
  /* a thin rectangle is a wall (plan Phase 3), down to one hitbox tile: typed in whole tiles (the owner's, Nov 21
     19:13Z: distances in tiles, never duck lengths), four to a duck length; kept as duck lengths (p.zw, p.zh) */
  zw: sideBox("Width (tiles)"),
  zh: sideBox("Height (tiles)"),
  fx: {
    name: "Act",
    check: (t) =>
      SB_FX[String(t).trim()] ? "" : "Seriat, damage, heal, kill or nothing",
    def: "none",
  },
  sa: {
    name: "Seriat",
    check: (t) => (String(t).length <= 800 ? "" : "800 letters at most"),
    def: "",
    len: 800,
  },
  amt: { name: "HP each time", kind: "tenth", min: 0.1, max: 100, def: "1" },
  rate: {
    name: "Seconds between",
    kind: "tenth",
    min: 0, // (0: every beat)
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
    name: "Elevation (0 is the ground)",
    kind: "half", // (tenths and half tenths: 0.05 is a twentieth of a gas station roof up)
    min: 0,
    max: 6,
    def: "0",
  },
  gnd: { name: "Ground (stand and walk on it)", kind: "bool", def: "f" },
  /* the owner's floor-is-lava idea: "you fall down, and the bottom elevation, the ground level, level 1, is set to do maybe
     max damage. So you hit that ground, boom, you're dead": what landing on it from a fall does (blank: nothing; "max":
     all of it). A fall: more than about one floor (SB_LAND_MIN) */
  land: {
    name: "Landing on it from a fall hurts (HP, or max)",
    check: (t) => {
      const v = String(t).trim().toLowerCase();
      if (!v || v === "max") return "";
      return /^\d+(\.\d)?$/.test(v) && +v > 0 && +v <= 1000
        ? ""
        : "Blank, max, or 0.1 to 1000";
    },
    def: "",
  },
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
    kind: "half",
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
    len: 600,
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
  sfxz: {
    name: "Shown",
    check: (t) => (SB_SFX_Z[String(t).trim()] ? "" : "Pick one"),
    def: "above",
  },
  sfxpic: {
    name: "Its picture",
    check: (t) =>
      /^[a-z0-9]{0,24}$/.test(String(t).trim()) ? "" : "Upload one",
    def: "",
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
/* the specials' effects a zone's squares can show (the owner's: "It could be effect from the specials, only an effect";
   specials.js momentHTML draws them), and an uploaded picture ("an image can be uploaded as well ... compressed into
   pixels ... takes up the size") */
export const SB_SFX_SP = {
  sp_zap: "Electricity",
  sp_flames: "Flames",
  sp_hearts: "Hearts",
  sp_poison: "Poison cloud",
  sp_notes: "Music notes",
  sp_loserx: "Loser's X",
  sp_disco: "Disco ball",
};
export const SB_SFX = {
  none: "Nothing",
  fire: "Ground fire",
  smoke: "Smoke",
  steam: "Steam",
  sparks: "Sparks",
  ...SB_SFX_SP,
  pic: "A picture",
};
export const sbSfx = (p) => {
  const k = p && p.f && p.f.sfx,
    v = String(k && k.ok ? k.ok : "none").trim();
  return SB_SFX[v] ? v : "none";
};
/* the owner's: "Effects can be chosen to either happen below all entities or above" (never over the map's own roofs) */
/* a fall, world px down from its top (about a floor; game.js's bonk) */
export const SB_LAND_MIN = 90;
/* is there a zone here that hurts whoever lands on it from a fall (game.js: then my falls are sent) */
export const sbLands = (s) =>
  isSb(s) &&
  Object.values((s.sb && s.sb.pts) || {}).some(
    (p) => p.k === "zone" && p.f && p.f.land && p.f.land.ok,
  );
export const SB_SFX_Z = {
  above: "Above everything",
  below: "Below everything",
};
export const sbSfxZ = (p) => {
  const k = p && p.f && p.f.sfxz;
  return k && k.ok === "below" ? "below" : "above";
};
/* a duck length in a world's px, for a zone's size there (on the board: 0.03 of it across, 0.08 up and down) */
export const SB_ZONE_PX = 48;
/* a block's side as dragged or typed, in whole hitbox tiles (the owner's, Nov 20 19:09Z: "Zones can have their size
   adjusted like they did before and be different sizes and shapes. But how they do that is based on the smallest units
   that build up their size. And those units are based on the tiles that check for hitbox"): a quarter of a duck length
   each, one tile at least, 40 duck lengths at most */
export const sbFitSide = (v) =>
  Math.max(TILE, Math.min(40, Math.round(v / TILE) * TILE));
/* ---------- every build block's shape (plan Phase 2: "Spawn, respawn, loot and zone become one thing you put down") ----------
   A block has a shape and a size (zw, zh: duck lengths; a zone starts at 4 by 4, the rest at 1 by 1) or fills the whole
   map. Square by default; the others by adding sides, stopping once it already looks round. It is made of the hitbox
   tiles its shape covers 0.6 of (sbTiles), the same tiles it's drawn with, so what you see is exactly what it covers */
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
export const sbShape = (p) => (p && SB_SHAPES[p.sh] ? p.sh : "sq");
export const sbFills = (p) => !!(p && p.fill);
/* its size in duck lengths, [w, h] */
export const sbSize = (p) => {
  const d = p && p.k === "zone" ? 4 : 1;
  return [sbFitSide(+(p && p.zw) || d), sbFitSide(+(p && p.zh) || d)]; // (in whole tiles, a size from before too)
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
/* a duck length in shares of the map, [across, up and down] */
export const sbUnit = (s, W, H) =>
  sbOnBoard(s) ? boardDuck(s) : [SB_ZONE_PX / W, SB_ZONE_PX / H];
/* how far block p is turned, in degrees (plan Phase 2: "while held, the arrow keys rotate") */
export const sbRot = (p) => ((((p && p.rot) || 0) % 360) + 360) % 360;
/* a spot in duck lengths from block p's middle, before its turn, in shares of the map (one that fills the map: from
   the map's middle) */
function toMap(s, p, g, lx, ly, W, H) {
  if (sbFills(p)) return { x: lx / g.w + 0.5, y: ly / g.h + 0.5 };
  const [rx, ry] = sbUnit(s, W, H),
    a = (sbRot(p) * Math.PI) / 180;
  return {
    x: p.x + (lx * Math.cos(a) - ly * Math.sin(a)) * rx,
    y: p.y + (lx * Math.sin(a) + ly * Math.cos(a)) * ry,
  };
}
/* (x, y) in shares of the map, in duck lengths from block p's middle, turned back into its own grid */
function toBlock(s, p, g, x, y, W, H) {
  if (sbFills(p)) return [(x - 0.5) * g.w, (y - 0.5) * g.h];
  const [rx, ry] = sbUnit(s, W, H),
    a = (-sbRot(p) * Math.PI) / 180,
    dx = (x - p.x) / rx,
    dy = (y - p.y) / ry;
  return [
    dx * Math.cos(a) - dy * Math.sin(a),
    dx * Math.sin(a) + dy * Math.cos(a),
  ];
}
/* block p's box, [x0, y0, x1, y1] in shares of the map (W, H: a world's size in px): around its squares as it's turned;
   the whole map when it fills it */
export function sbZoneBox(s, p, W = 1, H = 1) {
  if (sbFills(p)) return [0, 0, 1, 1];
  const [a, b, c, d] = sbTiles(p).box,
    q = [
      [a, b],
      [c, b],
      [c, d],
      [a, d],
    ].map(([u, v]) => toMap(s, p, null, u, v, W, H)),
    xs = q.map((o) => o.x),
    ys = q.map((o) => o.y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
/* is (x, y) (shares of the map) inside block p: on one of its tiles (sbTiles: the ones its shape covers 0.6 of) */
export function sbInBlock(s, p, x, y, W = 1, H = 1) {
  if (sbFills(p)) return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  return onTile(p, ...toBlock(s, p, null, x, y, W, H));
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
    name: "Square size (tiles)",
    check: (t) =>
      /^\d+$/.test(String(t).trim()) && +t >= 1 && +t <= 80 ? "" : "1 to 80",
    def: "4",
  },
  st: {
    name: "Seconds per step",
    check: (t) =>
      /^\d+(\.\d+)?$/.test(String(t).trim()) && +t >= 0.1 && +t <= 600
        ? ""
        : "0.1 to 600",
    def: "1",
  },
  /* where its steps start (a real-build test of my floor-is-lava idea, "blinking floor tiles ... with
     two alternating tabs": two Alternating tabs gave the same checkerboard). 1 on one of them: the other half */
  off: {
    name: "Starts at step (0: the first)",
    check: (t) => (/^\d{1,3}$/.test(String(t).trim()) ? "" : "0 to 999"),
    def: "0",
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
/* Direction in the right-click menu (the owner's, Nov 20 18:46Z: "flip horizontally ... flip vertically, kind of like how
   it is in Microsoft Paint"): [-1 or 1 across, -1 or 1 up and down] its shape is mirrored by, inside its box */
export const sbFlips = (p) => [p && p.fh ? -1 : 1, p && p.fv ? -1 : 1];
/* Overlay (the owner's, Nov 20 18:46Z): its overlay level, 1 to 10 ("for visual organization, where it automatically hides
   the zones" of the other levels while building; nothing else), and its place in the drawing order, a number: higher is
   drawn on top ("up and down is not an overlay group. It's simply changing the order in which zones sit on top of each
   other"). Put down later is on top until Move up or Move down says otherwise */
export const SB_OV_MOST = 10;
export const sbOv = (p) =>
  Math.min(SB_OV_MOST, Math.max(1, Math.round(+(p && p.ov) || 1)));
export const sbOrder = (id, p) =>
  p && Number.isFinite(p.zo) ? p.zo : +String(id).replace(/\D/g, "") || 0;
/* ---------- the hitbox tiles (the owner's, Nov 20 18:46Z and 19:02Z) ----------
   "the zones are literally based off of the hitbox things on the ground ... they should snap to the hitbox things on
   the ground as their units"; "it's based on the hitbox tiles that detects where the ducks are before determining if
   they take damage. The thing that we already use in the game": the small squares a block always checked a duck's spot
   on (a quarter of a duck: 12 px on a world), one size for every block. A block is cut into these tiles from its top
   left corner, and a tile is the block's when its shape covers 0.6 of it or more ("0.6 or more, then it will take up
   that tile hitbox"): only those tiles are the block, so it's walked on, stops, hurts and is drawn only there, and a
   tile sticking out past its edge by less than 0.4 is still all of it. A block thinner than a tile has one tile that
   thin. With Snap on (the default) its corner sits on the ground's tile lines, one every tile from the map's top left
   corner, and it turns a quarter at a time, so its tiles are the ground's tiles (sbSnapSpot). Its potential order's
   squares (Square size) are made of its tiles (TILE, above) */
export const SB_TAKE = 0.6;
const SAMPLES = 6, // (points across a tile each way, to tell how much of it the shape covers)
  MAX_TILES = 256, // (tiles along a side at most: a bigger block has bigger tiles)
  TILES = new Map();
/* block p's tiles: { nx, ny, tw, th (a tile's size, duck lengths), w, h (its size), set: the tiles that are its, as
   i + j * nx counted from its top left corner, box: [x0, y0, x1, y1] around them, duck lengths from its middle } */
export function sbTiles(p) {
  const [w, h] = sbSize(p),
    sh = sbShape(p),
    t = Math.max(TILE, w / MAX_TILES, h / MAX_TILES),
    [fu, fv] = sbFlips(p),
    key = `${sh} ${w} ${h} ${t} ${fu} ${fv}`;
  let g = TILES.get(key);
  if (g) return g;
  if (TILES.size > 300) TILES.clear();
  const axis = (v) => (v <= t + 1e-9 ? [1, v] : [Math.ceil(v / t - 1e-6), t]),
    [nx, tw] = axis(w),
    [ny, th] = axis(h),
    set = new Set();
  let best = 0,
    most = -1;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      let n = 0;
      for (let b = 0; b < SAMPLES; b++)
        for (let a = 0; a < SAMPLES; a++) {
          const x = (i + (a + 0.5) / SAMPLES) * tw,
            y = (j + (b + 0.5) / SAMPLES) * th;
          if (
            x <= w &&
            y <= h &&
            sbInShape(sh, fu * ((x / w) * 2 - 1), fv * ((y / h) * 2 - 1))
          )
            n++;
        }
      if (n >= SB_TAKE * SAMPLES * SAMPLES - 1e-9) set.add(i + j * nx);
      if (n > most) [most, best] = [n, i + j * nx];
    }
  if (!set.size) set.add(best); // (never nothing: the tile it covers most)
  const is = [...set].map((c) => c % nx),
    js = [...set].map((c) => Math.floor(c / nx));
  g = {
    nx,
    ny,
    tw,
    th,
    w,
    h,
    set,
    box: [
      -w / 2 + Math.min(...is) * tw,
      -h / 2 + Math.min(...js) * th,
      -w / 2 + (Math.max(...is) + 1) * tw,
      -h / 2 + (Math.max(...js) + 1) * th,
    ],
  };
  TILES.set(key, g);
  return g;
}
/* is (lx, ly), duck lengths from block p's middle before its turn, on one of its tiles */
const onTile = (p, lx, ly) => {
  const g = sbTiles(p),
    i = Math.floor((lx + g.w / 2) / g.tw),
    j = Math.floor((ly + g.h / 2) / g.th);
  return i >= 0 && j >= 0 && i < g.nx && j < g.ny && g.set.has(i + j * g.nx);
};
const MAX_SIDE = 64; // (squares along a side at most: a big square size takes over past it)
const GRIDS = new Map();
/* block p's potential order squares (Square size, duck lengths, from its top left corner): { nx, ny, w, h (the
   squares' whole size), ox, oy (their middle from the block's middle, before its turn), sq, cells: the squares holding
   one of its tiles, as i + j * nx, set: the same as a Set } */
export function sbGrid(s, p, W = 1, H = 1) {
  let [w, h] = sbSize(p);
  const fill = sbFills(p);
  if (fill) {
    const [rx, ry] = sbUnit(s, W, H);
    [w, h] = [1 / rx, 1 / ry];
  }
  const sq = Math.max(
      (+ordTxt(p, "sq") || 4) * TILE, // (typed in tiles)
      w / MAX_SIDE,
      h / MAX_SIDE,
    ),
    key = `${fill ? "fill" : sbShape(p)} ${w} ${h} ${sq} ${sbFlips(p)}`;
  let g = GRIDS.get(key);
  if (g) return g;
  if (GRIDS.size > 300) GRIDS.clear();
  const cells = [];
  if (fill) {
    /* the whole map: every square, stretched to fit it */
    const nx = Math.max(1, Math.round(w / sq)),
      ny = Math.max(1, Math.round(h / sq));
    for (let c = 0; c < nx * ny; c++) cells.push(c);
    g = { nx, ny, w, h, ox: 0, oy: 0, sq, cells };
  } else {
    const axis = (v) =>
        v <= sq + 1e-9 ? [1, v] : [Math.ceil(v / sq - 1e-6), sq],
      [nx, cw] = axis(w),
      [ny, ch] = axis(h),
      t = sbTiles(p),
      has = new Set();
    for (const c of t.set) {
      const x = ((c % t.nx) + 0.5) * t.tw,
        y = (Math.floor(c / t.nx) + 0.5) * t.th;
      has.add(
        Math.min(nx - 1, Math.floor(x / cw)) +
          Math.min(ny - 1, Math.floor(y / ch)) * nx,
      );
    }
    cells.push(...[...has].sort((a, b) => a - b));
    g = {
      nx,
      ny,
      w: nx * cw,
      h: ny * ch,
      ox: (nx * cw - w) / 2,
      oy: (ny * ch - h) / 2,
      sq,
      cells,
    };
  }
  g.set = new Set(cells);
  GRIDS.set(key, g);
  return g;
}
/* square c of grid g: its middle, in duck lengths from its block's middle, before the block's turn */
export const sbCellMid = (g, c) => [
  ((c % g.nx) + 0.5) * (g.w / g.nx) - g.w / 2 + g.ox,
  (Math.floor(c / g.nx) + 0.5) * (g.h / g.ny) - g.h / 2 + g.oy,
];
/* does block p snap to the ground's tile lines: Snap on (the default; the right-click menu turns it off), and not one
   that fills the map */
export const sbSnaps = (p) => !!p && !p.ns && !sbFills(p);
/* block p's spot { x, y } (shares of the map) with its tiles on the ground's: the corner its tiles start from (its top
   left one, wherever its turn puts it) moved to the nearest tile line each way, or to the other one beside it when the
   nearest would take it off the map */
export function sbSnapSpot(s, p, W = 1, H = 1) {
  if (!sbSnaps(p)) return { x: p.x, y: p.y };
  const [rx, ry] = sbUnit(s, W, H),
    [w, h] = sbSize(p),
    t = sbTiles(p).tw,
    a = (sbRot(p) * Math.PI) / 180,
    lx = -w / 2,
    ly = -h / 2,
    cx = p.x / rx + lx * Math.cos(a) - ly * Math.sin(a),
    cy = p.y / ry + lx * Math.sin(a) + ly * Math.cos(a),
    [x0, y0, x1, y1] = sbZoneBox(s, p, W, H);
  /* one way: the step to the nearest line, else to the other line beside it, kept on the map if it was */
  const way = (c, u, lo, hi) => {
    const r = Math.round(c / t) * t - c,
      o = r > 0 ? r - t : r + t;
    for (const d of [r, o]) {
      const m = d * u;
      if (
        lo < -1e-4 ||
        hi > 1 + 1e-4 ||
        (lo + m >= -1e-4 && hi + m <= 1 + 1e-4)
      )
        return m;
    }
    return 0;
  };
  return {
    x: +(p.x + way(cx, rx, x0, x1)).toFixed(6),
    y: +(p.y + way(cy, ry, y0, y1)).toFixed(6),
  };
}
/* do blocks p and q share a tile: each one's tile middles looked for in the other (only where their boxes meet) */
export function sbOverlap(s, p, q, W = 1, H = 1) {
  const A = sbZoneBox(s, p, W, H),
    B = sbZoneBox(s, q, W, H),
    e = 1e-6;
  if (
    A[2] <= B[0] + e ||
    B[2] <= A[0] + e ||
    A[3] <= B[1] + e ||
    B[3] <= A[1] + e
  )
    return false;
  const mids = (P, Q, [x0, y0, x1, y1]) => {
    const t = sbTiles(P);
    for (const c of t.set) {
      const { x, y } = toMap(
        s,
        P,
        null,
        -t.w / 2 + ((c % t.nx) + 0.5) * t.tw,
        -t.h / 2 + (Math.floor(c / t.nx) + 0.5) * t.th,
        W,
        H,
      );
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      if (sbInBlock(s, Q, x, y, W, H)) return true;
    }
    return false;
  };
  return mids(p, q, B) || mids(q, p, A);
}
/* a snapping block's turn: a quarter at a time (any turn from before goes to the nearest quarter first) */
export const sbSnapTurn = (rot, by) =>
  (((Math.round((rot + Math.sign(by) * 90) / 90) * 90) % 360) + 360) % 360;
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
  k += +ordTxt(p, "off") || 0;
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
      odds = n / Math.max(N, NX * NY);
    on = new Set(
      g.cells.filter((c) => {
        const { x, y } = toMap(s, p, g, ...sbCellMid(g, c), W, H),
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
/* the square of block p that (x, y) (shares of the map) is on, i + j * nx (inside its shape or not), or -1 off them */
export function sbCellAt(s, p, x, y, W = 1, H = 1) {
  const g = sbGrid(s, p, W, H),
    [lx, ly] = toBlock(s, p, g, x, y, W, H),
    X = lx - g.ox,
    Y = ly - g.oy;
  if (Math.abs(X) > g.w / 2 || Math.abs(Y) > g.h / 2) return -1;
  const i = Math.min(g.nx - 1, Math.floor((X / g.w + 0.5) * g.nx)),
    j = Math.min(g.ny - 1, Math.floor((Y / g.h + 0.5) * g.ny));
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
   working) may walk out of it; nothing walks in. On a world a wall stands on its own floor, as tall as two floors; a
   wall up high that isn't Ground is a block and reaches down to the ground (row 161: one zone per wall of a house). */
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
      // a wall up high that isn't Ground is a block down to the ground (as it's drawn, row 161): it stops the ground too
      const block = (p.z || 0) > 0.5 && !(p.f && p.f.gnd && p.f.gnd.ok === "t");
      if ((!block && dz <= -WALL_LOW) || dz >= WALL_HIGH) continue;
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
    out = [];
  for (let i = 0; i < list.length; i += every) {
    const c = list[i];
    out.push({ ...toMap(s, p, g, ...sbCellMid(g, c), W, H), c });
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
    [mx, my] = sbCellMid(g, c);
  return toMap(
    s,
    p,
    g,
    mx + (Math.random() - 0.5) * (g.w / g.nx),
    my + (Math.random() - 0.5) * (g.h / g.ny),
    W,
    H,
  );
}
/* block p's outline as points round its edge, in shares of the map ({ x, y }; W, H as sbZoneBox): its shape's edge,
   looked for along n rays from its middle, turned as it is */
const RIMS = new Map();
export function sbOutline(s, p, W = 1, H = 1, n = 48) {
  const sh = sbShape(p),
    key = sh + n,
    [fu, fv] = sbFlips(p);
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
    const X = (fu * u * w) / 2,
      Y = (fv * v * h) / 2;
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
    check: (t) => (String(t).length <= 1500 ? "" : "Too many"),
    len: 1500, // (every item ticked in All items fits)
    /* nothing at first: a new loot tab drops nothing until I pick what it holds (the owner's, Nov 20 02:37Z: "When you
       click a loot tab, it does not spawn the loot in it automatically") */
    def: "",
  },
  /* plan, Loot 1 (the owner's, Nov 19 22:57Z: "There should be an auto spawn for loot instead of comes back. There can be
     a continuous spawn. There can be a spawn limit ... There should be a limit on loot"): when it starts, then Auto spawn
     (a new one its time after one is taken), Continuous spawn and Seconds between spawns, Spawn limit (SB_BOXES, SB_FLAGS:
     the same boxes as a spawn's), the Loot limit, who can take it and whether every player gets their own */
  lst: {
    name: "Starts",
    check: (t) => (SB_LOOT_STARTS[String(t).trim()] ? "" : "Pick when"),
    def: "start",
  },
  again: {
    name: "Seconds before a new one comes",
    kind: "int",
    min: 0, // (0: at once)
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
  back: { name: "Auto spawn", kind: "bool", def: "t" }, // (its key is still "back", so older saves keep theirs)
  llim: {
    name: "Loot limit (0: none)",
    kind: "int",
    min: 0,
    max: 1000,
    def: "0",
  }, // (the most this block lays in a whole game; G has one for the whole map, SB_RULES lootmax)
  ltake: listBox("Who can take it", "players"), // (Players, Everything, a kind, a spawn, a player's name, a group: sbWhoTakes)
  lown: { name: "Every player gets their own", kind: "bool", def: "f" }, // (off: the first to reach it takes it)
  inf: { name: "Unlimited ammo (every gun)", kind: "bool", def: "f" },
  /* plan, Loot 2: "When several are ticked: the orb gives one of them at random, with equal chances, or gives all of them
     at once" */
  lall: { name: "All of them at once", kind: "bool", def: "f" },
  /* plan, Loot 4: "The item lying on the ground can look like the orb in its kind's color (the default), like it looks in
     your hand, or like its hotbar picture ... It has a size, and it can be see-through in 1% steps" */
  lshow: {
    name: "Shown as",
    check: (t) => (SB_LOOT_SHOWS[String(t).trim()] ? "" : "Pick one"),
    def: "orb",
  },
  lsize: { name: "Size (%)", kind: "int", min: 25, max: 400, def: "100" },
  lop: { name: "See-through (%)", kind: "int", min: 0, max: 95, def: "0" },
  look: {
    name: "Looks like",
    check: (t) => (String(t).length <= 24 ? "" : "24 letters at most"),
    def: "",
  },
};
/* ---------- each picked item's numbers (plan, Loot 3) ----------
   The owner's, Nov 19 22:33Z to 22:57Z: "below its particular drop-down list will the weapon then show its numbers",
   damage "as a number or a percent", "how much amount of a thing is in given loot", ammo "by number ... You can type
   percentages ... based off of Dead Ducks Arcade" (the bow's 100% is 300), "a button that you can click for unlimited
   ammo, which is already selected for the laser", "reload enabled or disabled", "Cooldown ... like 0.1", "bullets per
   second", and "can break when they run out of ammo". A loot block keeps them as boxes named "i_", the item, "_", the
   row ("i_ak_dmg": never a dot, which an online room's keys can't hold); blank is the item's own */
const pctBox = (name, max) => ({
  name,
  check: (t) => {
    const v = String(t).trim();
    if (!v) return "";
    const m = /^(\d+(\.\d)?)%$/.exec(v);
    if (m) return +m[1] > 0 && +m[1] <= 1000 ? "" : "1% to 1000%";
    return /^\d+(\.\d)?$/.test(v) && +v > 0 && +v <= max
      ? ""
      : `A number up to ${max}, or a percent`;
  },
  def: "",
  pct: true,
});
export const SB_ITEM = {
  dmg: pctBox("Damage (number or %)", 1000),
  n: {
    name: "How many you get",
    kind: "int",
    min: 1,
    max: 99,
    def: "",
    blank: true,
  },
  ammo: pctBox("Ammo (number, or % of its own)", 9999),
  inf: { name: "Unlimited ammo", kind: "bool", def: "", blank: true },
  rl: { name: "Reload", kind: "bool", def: "", blank: true },
  cd: {
    name: "Cooldown (s)",
    kind: "tenth",
    min: 0.1,
    max: 60,
    def: "",
    blank: true,
  },
  sps: {
    name: "Shots per second",
    kind: "tenth",
    min: 0.1,
    max: 30,
    def: "",
    blank: true,
  },
  brk: { name: "Breaks when empty", kind: "bool", def: "", blank: true },
};
/* box f's settings when it is an item's row ("i_ak_dmg"), or null */
export const sbItemBox = (f) => {
  const m = /^i_([a-z0-9]{1,24})_([a-z]+)$/.exec(String(f));
  return m && Object.hasOwn(SB_ITEM, m[2]) ? SB_ITEM[m[2]] : null;
};
/* a % box's value: { v } a number, { p } a percent, or null (blank or wrong) */
export function sbPct(t) {
  const v = String(t == null ? "" : t).trim(),
    m = /^(\d+(\.\d)?)(%?)$/.exec(v);
  if (!m) return null;
  return m[3] ? { p: +m[1] } : { v: +m[1] };
}
/* how a loot orb shows on the ground (plan, Loot 4) */
export const SB_LOOT_SHOWS = {
  orb: "An orb",
  hand: "As in your hand",
  hotbar: "Its hotbar picture",
};
/* when a loot block starts laying orbs (plan, Loot 1: "Starts: at the start of the game, or on an event ... a player
   steps into the zone, an entity spawns"): its zone is the one its tab answers to, or its own shape */
export const SB_LOOT_STARTS = {
  start: "Game starts",
  enter: "Player steps in",
  spawn: "Something spawns",
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
}; // (an orb's word for each; then the zombies' own name for it)
/* gear an orb can hold on Dead Ducks Arcade's maps: the flashlight. In Sandbox a duck there has none until it takes one
   (the owner's, Nov 19: every zombie mechanic "besides flashlight, but flashlight can be added as loot"); it keeps it
   for good, in s.sb.fl */
export const SB_GEAR = { flashlight: "Flashlight" };
export const sbNoLight = (s, id) =>
  isSb(s) && baseMode(s.options) === "l4dd" && !((s.sb && s.sb.fl) || {})[id];
