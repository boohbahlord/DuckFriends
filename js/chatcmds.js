/* ---------- The command line's commands: the customization tree, its suggestions and runner ----------
   Moved out of chat.js to keep that file small (a pure move; the owner's, Nov 22). */
import { profile, save, cleanName, NAME_OK } from "./store.js";

import { activeRoom } from "./net.js";

import { boardPhases } from "./rules.js";

import { denied } from "./roomrules.js";

import { FONTS, findFont } from "./name.js";

import {
  DUCK_PATTERNS,
  DUCK_METALS,
  RAINBOW_SKIN,
  BUILDS,
  SIZES,
} from "./duck.js";

import { HATS, hatById } from "./hats.js";

import { FACES, faceById } from "./faces.js";

import { EYES } from "./eyes.js";

import { BEAKS } from "./beaks.js";

import { STYLES, styleById } from "./styles.js";

import { unlocked, lockHint } from "./unlocks.js";

import { OUTFITS, outfitById } from "./outfits.js";

import { SPECIALS, KEYS, keysOf as keysOfDuck } from "./specials.js";

import { CARD_PATTERNS, CARD_LAYOUTS, CARD_SIZES } from "./card.js";

import { normHex, paintBody } from "./color.js";

import { shareLook } from "./customize.js";

import { applySettings } from "./settings.js";

import { hooks } from "./hooks.js";

/* ---------- the command line's commands ---------- */
const COLORS = {
  red: "#ef3b3b",
  orange: "#ff8c2b",
  yellow: "#ffd23f",
  green: "#37d421",
  teal: "#14c6b4",
  blue: "#2fa4ff",
  purple: "#9b5de5",
  pink: "#ff7eb6",
  brown: "#8b5a2b",
  gray: "#9aa0aa",
  black: "#1c1c28",
  white: "#ffffff",
};
const colorOf = (v) => COLORS[String(v).toLowerCase()] || normHex(v);
const COLOR_HINT = [...Object.keys(COLORS), "#hex"];
/* a hat's or a beak's color, one rule for its first and second color */
const hatColor = (key, label) => (v) => {
  const c = colorOf(v),
    h = profile.duck.hat;
  if (!h) return "✗ No hat on. custom avatar hat …";
  if (!c) return bad(v);
  profile.duck.hat = { ...h, [key]: c };
  return `${label}: ${c}`;
};
const beakColor = (key, label) => (v) => {
  const c = colorOf(v);
  if (!/^(blocks|geo)$/.test(profile.duck.beak))
    return "✗ Only the block beak and the flat beak take a color.";
  if (!c) return bad(v);
  profile.duck[key] = c;
  return `${label}: ${c}`;
};
export const CMD_MAX = 2000; // the command line's longest line
const keysOf = (list) => list.map((x) => x[0]);
/* the silly commands: each names players with @; the host can turn them off (Game options → Additional settings) */
const fun = (kind, count, what) => ({ info: what, at: count, fun: true, kind });
export const TREE = {
  help: { info: "Lists the commands." },
  clear: { info: "Clears this window." },
  lightning: fun(
    "lightning",
    1,
    "Strikes a player with lightning: lightning @name",
  ),
  love: fun("love", 2, "Two players float up in a heart: love @name @name"),
  kill: fun("kill", 1, "A player plays dead until they move: kill @name"),
  hotdog: fun(
    "hotdog",
    1,
    "A hotdog hangs around a player for a while: hotdog @name",
  ),
  fire: fun(
    "fire",
    1,
    "Sets a duck on fire; it stays burnt for a few seconds: fire @name",
  ),
  reset: {
    info: "Puts your duck somewhere random: reset duck (inside your column once you have voted).",
    kids: {
      duck: {
        exec: () =>
          hooks.resetDuck ? hooks.resetDuck() : "✗ That works on the board.",
      },
    },
  },
  custom: {
    info: "Customize your duck, card or name.",
    kids: {
      avatar: {
        kids: {
          color: {
            vals: COLOR_HINT,
            run: (v) => {
              const c = colorOf(v);
              if (!c) return bad(v);
              paintBody(profile.duck, "color", c); // (a skin's flat look comes off too)
              return `Duck color: ${c}`;
            },
          },
          pattern: {
            vals: keysOf(DUCK_PATTERNS),
            run: (v) =>
              pick(
                keysOf(DUCK_PATTERNS),
                v,
                (x) =>
                  Object.assign(profile.duck, {
                    pattern: x,
                    metal: "none",
                    image: null,
                  }),
                "Duck pattern",
              ),
          },
          "pattern color": {
            vals: COLOR_HINT,
            run: (v) => {
              const c = colorOf(v);
              if (!c) return bad(v);
              profile.duck.patternColor = c;
              return `Duck pattern color: ${c}`;
            },
          },
          metal: {
            vals: keysOf([...DUCK_METALS, RAINBOW_SKIN]),
            run: (v) =>
              String(v).toLowerCase() === "rainbow" &&
              lockedMsg("skin", "m:rainbow", "Rainbow skin")
                ? lockedMsg("skin", "m:rainbow", "Rainbow skin")
                : pick(
                    keysOf([...DUCK_METALS, RAINBOW_SKIN]),
                    v,
                    (x) =>
                      Object.assign(profile.duck, { metal: x, image: null }),
                    "Duck metal",
                  ),
          },
          hat: {
            vals: ["none", ...HATS.map((h) => h.id)],
            run: (v) => {
              const k = String(v).toLowerCase();
              if (k === "none") {
                profile.duck.hat = null;
                return "Hat: none";
              }
              const h = hatById(k);
              if (!h) return bad(v);
              const no = lockedMsg("hat", h.id, h.name);
              if (no) return no;
              unJack("hat");
              profile.duck.hat = {
                ...(profile.duck.hat && profile.duck.hat.id === k
                  ? profile.duck.hat
                  : {}),
                id: k,
              };
              return `Hat: ${h.name}`;
            },
          },
          "hat color": {
            vals: COLOR_HINT,
            run: hatColor("c1", "Hat color"),
          },
          "hat color 2": {
            vals: COLOR_HINT,
            run: hatColor("c2", "Hat second color"),
          },
          "hat metal": {
            vals: keysOf(DUCK_METALS.slice(1)),
            run: (v) => {
              const h = profile.duck.hat;
              if (!h || !(hatById(h.id) || {}).metal)
                return "✗ Only the crown takes a metal.";
              return pick(
                keysOf(DUCK_METALS.slice(1)),
                v,
                (x) => {
                  profile.duck.hat = { ...h, metal: x };
                },
                "Hat metal",
              );
            },
          },
          ketchup: {
            vals: ["on", "off"],
            run: (v) => {
              const h = profile.duck.hat;
              if (!h || h.id !== "hotdog")
                return "✗ Ketchup goes on the hotdog hat.";
              if (!/^(on|off)$/i.test(v)) return bad(v);
              profile.duck.hat = { ...h, ketchup: /^on$/i.test(v) };
              return `Ketchup: ${/^on$/i.test(v) ? "on" : "off"}`;
            },
          },
          face: {
            vals: ["none", ...FACES.map((f) => f.id)],
            run: (v) => {
              const k = String(v).toLowerCase();
              if (k === "none") {
                profile.duck.face = null;
                return "Face: none";
              }
              const f = faceById(k);
              if (!f) return bad(v);
              const no = lockedMsg("face", f.id, f.name);
              if (no) return no;
              unJack("face");
              profile.duck.face = {
                ...(profile.duck.face && profile.duck.face.id === k
                  ? profile.duck.face
                  : {}),
                id: k,
              };
              return `Face: ${f.name}`;
            },
          },
          "face color": {
            vals: COLOR_HINT,
            run: (v) => {
              const c = colorOf(v),
                f = profile.duck.face;
              if (!f) return "✗ Nothing on the face. custom avatar face …";
              if (!c) return bad(v);
              profile.duck.face = { ...f, c1: c };
              return `Face color: ${c}`;
            },
          },
          eyes: {
            vals: EYES.map((x) => x.id),
            run: (v) =>
              pick(
                EYES.map((x) => x.id),
                v,
                (x) => {
                  profile.duck.eyes = x;
                },
                "Eyes",
              ),
          },
          beak: {
            vals: BEAKS.map((x) => x.id),
            run: (v) =>
              pick(
                BEAKS.map((x) => x.id),
                v,
                (x) => {
                  unJack("beak");
                  profile.duck.beak = x;
                },
                "Beak",
              ),
          },
          "beak color": {
            vals: COLOR_HINT,
            run: beakColor("beakColor", "Beak color"),
          },
          "beak color 2": {
            vals: COLOR_HINT,
            run: beakColor("beakColor2", "Beak shade"),
          },
          outfit: {
            vals: ["none", ...OUTFITS.map((x) => x.id)],
            run: (v) => {
              const k = String(v).toLowerCase().trim(),
                x = OUTFITS.find((y) => y.id === k);
              if (k !== "none" && !x) return bad(v);
              const no = x && lockedMsg("outfit", x.id, x.name);
              if (no) return no;
              unJack("outfit");
              profile.duck.outfit = x ? { id: x.id } : null;
              return `Outfit: ${x ? x.name : "none"}`;
            },
          },
          "outfit color": {
            vals: COLOR_HINT,
            run: (v) => part("outfit", outfitById, 0, v, "outfit"),
          },
          "outfit color 2": {
            vals: COLOR_HINT,
            run: (v) => part("outfit", outfitById, 1, v, "outfit"),
          },
          style: {
            vals: STYLES.map((x) => x.id),
            run: (v) => {
              const D = profile.duck,
                k = String(v).toLowerCase().trim(),
                x = STYLES.find((y) => y.id === k);
              if (!x) return bad(v);
              const no = lockedMsg("style", x.id, x.name);
              if (no) return no;
              if (x.pages && !styleById(D.style).pages) D.prevStyle = D.style; // (Jack in a Box or Dat Boi)
              D.style = x.id;
              return `Style: ${x.id}`;
            },
          },
          "style color 2": {
            vals: COLOR_HINT,
            run: (v) => styleTone("color2", v),
          },
          "style color 3": {
            vals: COLOR_HINT,
            run: (v) => styleTone("color3", v),
          },
          build: {
            vals: keysOf(BUILDS.map(([v, n]) => [n.toLowerCase(), v])),
            run: (v) => body(BUILDS, "build", v, "Build"),
          },
          size: {
            vals: keysOf(SIZES.map(([v, n]) => [n.toLowerCase(), v])),
            run: (v) => body(SIZES, "size", v, "Size"),
          },
          special: {
            vals: [
              "none",
              ...SPECIALS.filter((x) => !x.off && !x.only).map((x) => x.id),
            ],
            run: (v) => {
              // a special onto a number key: "trombone 3" (no number: the first free key); none takes them all off
              const [k, n] = String(v).toLowerCase().trim().split(/\s+/),
                x = SPECIALS.find((y) => y.id === k && !y.off && !y.only),
                keys = (profile.duck.keys = keysOfDuck(profile.duck));
              if (k === "none") {
                keys.fill(null);
                return "Specials: none";
              }
              if (!x || (n !== undefined && !KEYS.includes(n))) return bad(v);
              const was = keys.indexOf(x.id),
                i =
                  n !== undefined
                    ? KEYS.indexOf(n)
                    : was >= 0
                      ? was
                      : Math.max(0, keys.indexOf(null));
              if (was >= 0) keys[was] = null;
              keys[i] = x.id;
              return `Special: ${x.name} on key ${KEYS[i]}`;
            },
          },
        },
      },
      card: {
        kids: {
          color: {
            vals: COLOR_HINT,
            run: (v) => {
              const c = colorOf(v);
              if (!c) return bad(v);
              profile.card.color = c;
              return `Card color: ${c}`;
            },
          },
          pattern: {
            vals: keysOf(CARD_PATTERNS),
            run: (v) =>
              pick(
                keysOf(CARD_PATTERNS),
                v,
                (x) => {
                  profile.card.pattern = x;
                },
                "Card pattern",
              ),
          },
          "pattern color": {
            vals: COLOR_HINT,
            run: (v) => {
              const c = colorOf(v);
              if (!c) return bad(v);
              profile.card.patternColor = c;
              return `Card pattern color: ${c}`;
            },
          },
          layout: {
            vals: keysOf(CARD_LAYOUTS),
            run: (v) =>
              pick(
                keysOf(CARD_LAYOUTS),
                v,
                (x) => {
                  profile.card.layout = x;
                },
                "Card pattern layout",
              ),
          },
          size: {
            vals: CARD_SIZES.map(([, n]) => n.toLowerCase()),
            run: (v) => {
              const f = CARD_SIZES.find(
                ([, n]) => n.toLowerCase() === String(v).toLowerCase().trim(),
              );
              if (!f) return bad(v);
              profile.card.size = f[0];
              return `Card pattern size: ${f[1]}`;
            },
          },
        },
      },
      username: {
        kids: {
          name: {
            vals: ["<name>"],
            run: (v) => {
              const n = cleanName(v);
              if (!NAME_OK.test(n))
                return "✗ A name: letters, numbers, - and _.";
              profile.name = n;
              return `Name: ${n}`;
            },
          },
          font: {
            vals: FONTS.map((f) => f.name.toLowerCase()),
            run: (v) => {
              const f = findFont(v);
              if (!f) return bad(v);
              profile.nameStyle.font = f.id;
              return `Name font: ${f.name}`;
            },
          },
          "font color": {
            vals: ["plain", ...COLOR_HINT],
            run: (v) => {
              if (/^plain$/i.test(v)) {
                Object.assign(profile.nameStyle, { color: "", rainbow: false });
                return "Name color: plain";
              }
              const c = colorOf(v);
              if (!c) return bad(v);
              Object.assign(profile.nameStyle, { color: c, rainbow: false });
              return `Name color: ${c}`;
            },
          },
          rainbow: {
            vals: ["on", "off"],
            run: (v) => {
              if (!/^(on|off)$/i.test(v)) return bad(v);
              profile.nameStyle.rainbow = /^on$/i.test(v);
              return `Multicolored letters: ${profile.nameStyle.rainbow ? "on" : "off"}`;
            },
          },
        },
      },
    },
  },
};
const bad = (v) =>
  `✗ ${v || "Nothing"} isn't one of the choices. Tab shows them.`;
/* build and size go by name ("chubby", "a bit big") */
function body(list, key, v, label) {
  const f = list.find(
    ([, n]) => n.toLowerCase() === String(v).toLowerCase().trim(),
  );
  if (!f) return bad(v);
  profile.duck[key] = f[0];
  return `${label}: ${f[1]}`;
}
/* an outfit's own colors (c1, c2), by their place in its list */
function part(key, byId, n, v, what) {
  const on = profile.duck[key],
    d = on && byId(on.id),
    col = d && (d.colors || [])[n],
    c = colorOf(v);
  if (!on) return `✗ No ${what} on. custom avatar ${what} …`;
  if (!col) return `✗ ${d.name} has no ${n ? "second " : ""}color to change.`;
  if (!c) return bad(v);
  profile.duck[key] = { ...on, [col[0]]: c };
  return `${d.name}: ${col[1]}: ${c}`;
}
/* a style's second or third color (its first is the duck's color) */
function styleTone(key, v) {
  const st = styleById(profile.duck.style),
    col = (st.colors || []).find((x) => x[0] === key),
    c = colorOf(v);
  if (!col) return `✗ The ${st.name.toLowerCase()} has no color like that.`;
  if (!c) return bad(v);
  Object.assign(profile.duck, { [key]: c, metal: "none", image: null });
  return `${col[1]}: ${c}`;
}
/* a locked item (unlocks.js) can't be put on from here either; Jack in a Box turns back into the duck when a part his
   style doesn't take is picked */
const lockedMsg = (kind, id, name) =>
  unlocked(kind, id) ? null : `✗ ${name} is locked. ${lockHint(kind, id)}`;
const unJack = (page) => {
  const D = profile.duck,
    st = styleById(D.style);
  if (st.pages && !st.pages.includes(page))
    D.style = D.prevStyle && D.prevStyle !== D.style ? D.prevStyle : "rubber";
};
function pick(list, v, set, label) {
  const x = list.find((k) => k === String(v).toLowerCase());
  if (!x) return bad(v);
  set(x);
  return `${label}: ${x}`;
}

/* splits a line into words ("two words" in quotes stay one); last = the word being typed, from = where it starts */
function words(line) {
  const out = [];
  let cur = "",
    q = false,
    any = false,
    from = 0;
  [...line].forEach((ch, i) => {
    if (!any && !/\s/.test(ch)) from = i;
    if (ch === '"') {
      q = !q;
      any = true;
      return;
    }
    if (/\s/.test(ch) && !q) {
      if (any) out.push(cur);
      cur = "";
      any = false;
      from = i + 1;
      return;
    }
    cur += ch;
    any = true;
  });
  return { done: out, last: cur, from: any ? from : line.length };
}
const quote = (w) => (/\s/.test(w) ? `"${w}"` : w);

/* what fits next on the command line */
/* a name as it is typed after @: without its spaces ("Player 1" is @Player1) */
export const tag = (n) => String(n || "").replace(/\s+/g, "");
const npcTag = (s, t) =>
  ["justin", "annabelle", "bubbles", "oreo", "opal"].find(
    (n) => n === tag(t).toLowerCase() && s.hang.npc[n],
  ); // Duck Cabin's characters
export const byTag = (s, t) =>
  s.seat.find(
    (i) => tag(s.players[i].name).toLowerCase() === tag(t).toLowerCase(),
  );
export const funOn = () => {
  const r = activeRoom();
  return !r || !!r.state.options.fun;
};
const names = () => {
  const r = activeRoom();
  return r ? r.state.seat.map((id) => "@" + tag(r.state.players[id].name)) : [];
};
export function cmdSuggest(line) {
  const { done, last, from } = words(line);
  let node = { kids: TREE },
    given = 0;
  for (const w of done) {
    if (node.kids) {
      node = node.kids[w.toLowerCase()];
      if (!node) return [];
    } else if (node.at && given < node.at - 1) given++;
    else return [];
  }
  const opts = node.kids
    ? Object.keys(node.kids).filter((k) => !(node.kids[k].fun && !funOn()))
    : node.at
      ? names()
      : node.vals
        ? node.vals.filter((v) => !v.startsWith("<") && v !== "#hex")
        : [];
  const p = last.toLowerCase();
  return opts
    .filter((o) => o.toLowerCase().startsWith(p) && o.toLowerCase() !== p)
    .map((o) => ({
      label: quote(o),
      apply: () => line.slice(0, from) + quote(o) + " ",
    }));
}
export function runCommand(line) {
  const { done, last } = words(line.trim());
  const w = last ? [...done, last] : done;
  if (!w.length) return [];
  const top = w[0].toLowerCase();
  if (top === "help")
    return [
      "Commands:",
      ...Object.entries(TREE)
        .filter(([, n]) => !(n.fun && !funOn()))
        .map(([k, n]) => `  ${k} · ${n.info}`),
      'custom avatar · card · username, e.g. custom username font "times new roman"',
    ];
  if (top === "clear") return null;
  if (TREE[top] && TREE[top].fun) return [runFun(TREE[top], w.slice(1))];
  let node = { kids: TREE },
    path = [];
  for (let i = 0; i < w.length; i++) {
    if (node.kids) {
      const next = node.kids[w[i].toLowerCase()];
      if (!next)
        return [
          `✗ ${w[i]}? Try: ${Object.keys(node.kids).map(quote).join(", ")}`,
        ];
      node = next;
      path.push(w[i].toLowerCase());
      continue;
    }
    const msg = node.run(w.slice(i).join(" "));
    if (!msg.startsWith("✗")) {
      save();
      shareLook();
      applySettings();
    }
    return [msg];
  }
  if (node.exec) return [node.exec()];
  if (node.kids)
    return [
      `${path.join(" ")}: ${Object.keys(node.kids).map(quote).join(", ")}`,
    ];
  return [`${path.join(" ")}: ${(node.vals || []).map(quote).join(", ")}`];
}

/* a silly command: needs a room, the host's yes, the board, and its players by @name */
function runFun(node, args) {
  const r = activeRoom();
  if (!r) return "✗ That works in a game.";
  const s = r.state;
  if (!s.options.fun) return "✗ The host turned the silly commands off.";
  if (denied(s, r.me, "nofun"))
    return "✗ Your group can't use the silly commands.";
  if (!boardPhases(s).includes(s.phase)) return "✗ That works on the board.";
  const who = [];
  for (const a of args) {
    const id = byTag(s, a.replace(/^@/, "")),
      npc = !id && (s.hang || {}).npc && npcTag(s, a.replace(/^@/, ""));
    if (npc === "justin" && node.kind === "kill") {
      r.send({ t: "hang", k: "npc", who: "justin", do: "kill" });
      return "✖ Justin plays dead";
    } // (Duck Cabin's Justin: kill works on him)
    if (npc)
      return npc === "justin"
        ? `✗ ${node.kind} doesn't work on Justin.`
        : "✗ The cats don't listen to commands.";
    if (
      !id &&
      s.justin &&
      s.options.justin &&
      tag(a.replace(/^@/, "")).toLowerCase() === "justin"
    ) {
      // (the Justin option: on the boards)
      if (node.kind !== "kill") return `✗ ${node.kind} doesn't work on Justin.`;
      r.send({ t: "fx", kind: "kill", who: [], justin: 1 });
      return "✖ Justin plays dead";
    }
    if (!id) return `✗ No player named ${a.replace(/^@/, "")}.`;
    who.push(id);
  }
  if (who.length < node.at) return `✗ ${node.info}`;
  r.send({ t: "fx", kind: node.kind, who: who.slice(0, node.at) });
  const nm = who
    .slice(0, node.at)
    .map((id) => s.players[id].name)
    .join(" and ");
  return {
    lightning: `⚡ ${nm}`,
    love: `♥ ${nm}`,
    kill: `✖ ${nm} plays dead`,
    hotdog: `🌭 for ${nm}`,
    fire: `🔥 ${nm}`,
  }[node.kind];
}
