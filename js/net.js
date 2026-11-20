/* ---------- the room connection ----------
   The game talks to a room through one small object: room.state, room.me, room.send(action), room.on(fn), room.close().
   A TEST room lives on this device, with computers; this device is the host and runs the rules. Online rooms (online.js,
   Firebase) have the same parts, so the screens never change. */
import { safeReduce, newRoom } from "./rules.js";
import { botActions } from "./bots.js";
import { botDuck, BOT_DUCKS, PATS, any } from "./botduck.js";
import { profile, cleanStats } from "./store.js";
import { now } from "./clock.js";
import { who } from "./who.js";
import { publicKey } from "./secret.js";
import { watchKills } from "./unlocks.js";
import { useUmaps } from "./maps.js";

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
  solo = false, // (Single Player: the installed app's room with no internet, front.js)
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
    solo,
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
      useUmaps(state.umap); // (the maps the host made, for every map list and picture: maps.js)
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
function botPlayer(s) {
  const used = new Set(s.seat.map((id) => s.players[id].name));
  let n = 1;
  while (used.has("Computer-" + n)) n++;
  return {
    id: "b-" + uid(),
    name: "Computer-" + n,
    bot: true,
    duck: botDuck(),
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
