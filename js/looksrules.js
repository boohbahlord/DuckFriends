/* ---------- the duck-look settings' rules (the host's part; the drawing is in looks.js) ----------
   No drawing here, so the rules can use it: which settings are on, the eight Rainbow Ducks looks dealt at the start,
   and the brown duck in Justin's costume, whose knock-downs never count as Justin kills. */
/* red, orange, yellow, green, blue, indigo, violet, then Justin's brown */
export const RAINBOW = [
  "#e8312f",
  "#ff8a1f",
  "#ffd23f",
  "#3fbf4a",
  "#2f7fe8",
  "#4b3fc2",
  "#9b4dd6",
];
export const BROWN = "#8a5a32";
export const FAKE_JUSTIN = RAINBOW.length; // the eighth look

const inGame = (s) => !!s && s.phase !== "lobby" && s.phase !== "over"; // (the lobby and the room after a game show every duck as it is)
export const hidesLooks = (s) => inGame(s) && !!s.options.hideLooks;
export const rainbowOn = (s) => hidesLooks(s) && !!s.options.rainbowDucks;
export const voteColorOn = (s) =>
  inGame(s) &&
  !!s.options.voteColor &&
  !rainbowOn(s) &&
  !["mgj", "hang", "l4dd"].includes(s.options.mode);
export const tagColorOn = (s) => voteColorOn(s) && !!s.options.tagColor;

/* the brown duck in Justin's costume is a player, not Justin: knocking it down never counts as a Justin kill */
export const fakeJustin = (s, id) =>
  rainbowOn(s) && !!s.rainbow && s.rainbow[id] === FAKE_JUSTIN;

/* the host deals the eight looks when the game starts: shuffled, and shuffled again for every eight ducks */
export function dealRainbow(s) {
  if (!s.options.hideLooks || !s.options.rainbowDucks) {
    delete s.rainbow;
    return;
  }
  s.rainbow = {};
  let bag = [];
  for (const id of s.seat) {
    if (!bag.length) bag = shuffled();
    s.rainbow[id] = bag.pop();
  }
}
/* someone who joins mid-game gets the look the fewest ducks have */
export function rainbowJoin(s, id) {
  if (!s.rainbow || id in s.rainbow) return;
  const n = Array(FAKE_JUSTIN + 1).fill(0);
  for (const k of Object.values(s.rainbow)) n[k]++;
  const least = Math.min(...n),
    picks = n.map((c, k) => (c === least ? k : -1)).filter((k) => k >= 0);
  s.rainbow[id] = picks[Math.floor(Math.random() * picks.length)];
}
const shuffled = () => {
  const a = Array.from({ length: FAKE_JUSTIN + 1 }, (_, k) => k);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
