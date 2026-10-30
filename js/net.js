/* ---------- the room connection ----------
   The game talks to a room through one small object: room.state, room.me, room.send(action), room.on(fn), room.close().
   A TEST room lives on this device, with computers; this device is the host and runs the rules. Online rooms (online.js,
   Firebase) have the same parts, so the screens never change. */
import { safeReduce, newRoom } from "./rules.js";
import { STYLES } from "./styles.js";
import { OUTFITS } from "./outfits.js";
import { botActions } from "./bots.js";
import { profile, cleanStats } from "./store.js";
import { HATS } from "./hats.js";
import { FACES } from "./faces.js";
import { EYES } from "./eyes.js";
import { BEAKS } from "./beaks.js";
import { now } from "./clock.js";
import { who } from "./who.js";
import { publicKey } from "./secret.js";
import { watchKills, isLocked } from "./unlocks.js";

const uid = () => Math.random().toString(36).slice(2, 10);
export const myPlayer = (id) => ({
  id,
  name: profile.name,
  duck: { ...profile.duck },
  card: { ...profile.card },
  nameStyle: { ...profile.nameStyle },
  bot: false,
  net: +profile.settings.net || 0,
  stats: cleanStats(profile.stats),
  ...(who.acct ? { acct: who.acct } : {}),
  ...(publicKey() ? { pk: publicKey() } : {}),
});

let active = null;
export const activeRoom = () => active;
/* an online room (online.js) becomes the active one */
export function setActive(room) {
  if (active && active !== room) active.close();
  if (room && active !== room) watchKills(room);
  active = room;
}
export function dropActive(room) {
  if (active === room) active = null;
}

export function createLocalRoom({
  name,
  test = true,
  computers = 3,
  max,
  options,
  open = true,
  passkey = "",
}) {
  if (active) active.close();
  const me = "p-" + uid();
  let state = newRoom({
    id: "r-" + uid(),
    name,
    host: myPlayer(me),
    test,
    open,
    passkey,
    max,
    options,
  });
  const fns = new Set();
  const room = {
    me,
    local: true,
    get state() {
      return state;
    },
    send(a) {
      if (!a.id) a.id = me;
      const next = safeReduce(state, a, now());
      if (next === state) return;
      state = next;
      fns.forEach((f) => f(state, a));
    },
    on(f) {
      fns.add(f);
      return () => fns.delete(f);
    },
    close() {
      clearInterval(loop);
      fns.clear();
      if (active === room) active = null;
    },
    /* TEST rooms: add or remove computers (lobby only) */
    setComputers(n) {
      const bots = state.seat.filter((id) => state.players[id].bot);
      for (let i = bots.length; i < n && state.seat.length < state.max; i++)
        room.send({ t: "join", id: "b-" + uid(), p: botPlayer(state) });
      for (let i = bots.length - 1; i >= n; i--)
        room.send({ t: "kick", id: me, who: bots[i] });
    },
  };
  /* the host's heartbeat: timers and computers */
  const loop = setInterval(() => {
    room.send({ t: "tick", id: me });
    for (const a of botActions(state, now())) room.send(a);
  }, 200);
  active = room;
  watchKills(room);
  if (test) room.setComputers(computers);
  return room;
}

/* a computer player: "Computer N", a random duck and card */
const BOT_DUCKS = [
  "#ffd23f",
  "#ff8c2b",
  "#ef3b3b",
  "#ff7eb6",
  "#9b5de5",
  "#2fa4ff",
  "#14c6b4",
  "#8ee03c",
  "#f4f4f0",
  "#3b3f4a",
];
const PATS = [
  "none",
  "none",
  "dots",
  "stripes",
  "stars",
  "hearts",
  "checks",
  "waves",
];
const METALS = [
  "none",
  "none",
  "none",
  "none",
  "gold",
  "silver",
  "bronze",
  "rose",
  "chrome",
];
const any = (a) => a[Math.floor(Math.random() * a.length)];
/* now and then a computer is a mallard, an eagle or the like, in that style's colors */
function botStyle() {
  if (Math.random() > 0.3) return {};
  const st = any(STYLES.slice(1).filter((x) => !isLocked("style", x.id))); // (computers never wear what players unlock)
  return {
    style: st.id,
    ...Object.fromEntries((st.colors || []).map(([k, , c]) => [k, c])),
    ...(st.match ? { beak: st.match } : {}),
  };
}
function botPlayer(s) {
  const used = new Set(s.seat.map((id) => s.players[id].name));
  let n = 1;
  while (used.has("Computer-" + n)) n++;
  return {
    id: "b-" + uid(),
    name: "Computer-" + n,
    bot: true,
    duck: {
      color: any(BOT_DUCKS),
      pattern: any(PATS),
      patternColor: "#ffffff",
      metal: any(METALS),
      image: null,
      hat:
        Math.random() < 0.5
          ? {
              id: any(HATS.filter((x) => !isLocked("hat", x.id))).id,
              ketchup: Math.random() < 0.5,
            }
          : null,
      face:
        Math.random() < 0.25
          ? { id: any(FACES.filter((x) => !isLocked("face", x.id))).id }
          : null,
      eyes: Math.random() < 0.3 ? any(EYES).id : "default",
      beak: Math.random() < 0.25 ? any(BEAKS).id : "default",
      build: Math.random() < 0.4 ? any([-1, -0.5, 0.5, 1]) : 0,
      size: Math.random() < 0.3 ? any([-1, -0.5, 0.5, 1]) : 0,
      keys: [
        Math.random() < 0.35
          ? any([
              "zap",
              "flames",
              "hearts",
              "poison",
              "notes",
              "longjump",
              "double",
              "trombone",
            ])
          : null,
      ],
      outfit:
        Math.random() < 0.3
          ? { id: any(OUTFITS.filter((x) => !isLocked("outfit", x.id))).id }
          : null,
      ...botStyle(),
    },
    card: {
      kind: "color",
      color: any(BOT_DUCKS),
      pattern: any(PATS),
      patternColor: "#ffffff",
      image: null,
    },
    nameStyle: { font: "fredoka", color: "", rainbow: Math.random() < 0.2 },
  };
}
