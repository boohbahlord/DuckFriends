/* ---------- the merchants (Dead Ducks Arcade) ----------
   The owner (Nov 18): "There are different NPCs with all the same voice lines, and they have a given name and look".
   One merchant comes at a time (round zero always, then a 25% chance a round); each one shot dies for the rest of the
   game, and another fills his place. Here is only who they are and how they look: every one is a duck look (duck.js)
   built from the hats, face items, outfits and styles players already have, so they match the game's art. The rules
   (who comes, what he sells, his lines) are l4ddrules.js'.
   looks: a merchant with more than one look shuffles them ("it is random and will be different everytime they show
   up"): the rules roll a number when he arrives, so every player sees the same one (merchantLook). extra: a piece drawn
   over the duck that no item has (Hunter's cigarette holder). The Butler and the Priest stay in the cast. */
import { duckSVG } from "./duck.js";
import { hatLayers } from "./hats.js";
import { BUTLER, PRIEST } from "./hangout/npcart.js";

/* Hunter's cigarette holder, in the duck's 120 box: a long black holder held in the beak, tilted up, a white cigarette
   with an ember, a little smoke */
const HOLDER = `<g class="m-holder">
  <path d="M104 45.6L113.4 33.4" stroke="#14141a" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M104.6 44.4L112.6 34" stroke="#55555f" stroke-width=".7" stroke-linecap="round"/>
  <path d="M113.4 33.4L116.6 29.2" stroke="#f4f1e8" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M113.4 33.4L114.4 32.1" stroke="#d9c79c" stroke-width="2.6"/>
  <circle cx="117" cy="28.7" r="1.4" fill="#ff6a1f"/><circle cx="117.2" cy="28.4" r=".6" fill="#ffd27a"/>
  <path d="M117.4 26.6C115.4 23.6 118.6 21.4 116.8 18.2C115.6 16 117.4 13.6 116.6 11.6" stroke="#d8d8de" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".55"/>
</g>`;
/* Jerome's ribbon bow, when he has it: small, on the back of his head, under his birthday hat */
const RIBBON = () =>
  `<g transform="translate(57 25) scale(.55) translate(-70 -15)">${hatLayers({ id: "bow" }).front}</g>`;

export const MERCHANTS = [
  {
    id: "brah",
    name: "Brah",
    tip: "The motorcyclist",
    looks: [
      {
        color: "#ff8c2b",
        face: { id: "moto" },
        outfit: { id: "leather", pants: "jeans" },
      },
    ],
  },
  {
    id: "hunter",
    name: "Hunter",
    tip: "Bucket hat, aviators, a Hawaiian shirt and a cigarette holder",
    looks: [
      {
        color: "#ffd23f",
        hat: { id: "bucket" },
        face: { id: "aviators" },
        outfit: { id: "hawaiian" },
      },
    ],
    extra: HOLDER,
  },
  {
    id: "babatunde",
    name: "Babatunde",
    tip: "Agbada and fila",
    looks: [
      {
        color: "#ffd23f",
        hat: { id: "fila", c1: "#1f5e8a", c2: "#e8b84a" },
        outfit: { id: "agbada", c1: "#1f5e8a", c2: "#e8b84a" },
      },
    ],
  },
  {
    id: "omowunmi",
    name: "Omowunmi",
    tip: "Iro, buba and gele",
    looks: [
      {
        color: "#ffd23f",
        hat: { id: "gele", c1: "#c8761a" },
        outfit: { id: "iro", c1: "#7a1f2b", c2: "#e8b84a" },
      },
    ],
  },
  {
    id: "dyson",
    name: "Dyson",
    tip: "Muscle shirt and cheese, or the rainbow Dat Boi",
    looks: [
      { color: "#ffd23f", hat: { id: "cheese" }, outfit: { id: "muscle" } },
      { style: "datboi", rank: "rainbow" },
    ],
  },
  {
    id: "alien",
    name: "25291791441265",
    tip: "The alien in the Lakers jersey",
    looks: [
      {
        color: "#4fd02a",
        hat: { id: "antennae", c1: "#7ad151" },
        eyes: "alien",
        beak: "hole",
        outfit: { id: "lakers" },
      },
    ],
  },
  {
    id: "charles",
    name: "Charles",
    tip: "The eagle under the floating eye",
    looks: [
      {
        style: "eagle",
        color: "#1c1c22",
        color2: "#f5f2ea",
        eyes: "eagle",
        beak: "eagle",
        hat: { id: "eye" },
      },
    ],
  },
  {
    id: "thomas",
    name: "Thomas",
    tip: "The wizard",
    looks: [
      {
        color: "#f4f4f0",
        hat: { id: "wizard" },
        outfit: { id: "wizard" },
      },
    ],
  },
  {
    id: "barry",
    name: "Barry",
    tip: "Dressed in cardboard",
    looks: [
      {
        color: "#ffd23f",
        face: { id: "box" },
        outfit: { id: "robot" },
      },
    ],
  },
  {
    id: "queen",
    name: "Queen Elizabeth",
    tip: "Crown and royal robe",
    looks: [
      {
        color: "#f4f4f0",
        hat: { id: "crown", metal: "gold" },
        outfit: { id: "royal" },
      },
    ],
  },
  {
    id: "fool",
    name: "The Fool",
    tip: "The jester",
    looks: [
      {
        color: "#ffd23f",
        hat: { id: "jester" },
        outfit: { id: "jester" },
      },
    ],
  },
  {
    id: "lucifer",
    name: "Lucifer",
    tip: "The whole clown: wig, paint and costume",
    looks: [
      {
        color: "#f4f4f0",
        hat: { id: "clownwig" },
        face: { id: "clownpaint" },
        outfit: { id: "clown" },
      },
    ],
  },
  {
    id: "jack",
    name: "Jack",
    tip: "Jack in the Box",
    looks: [{ style: "jack" }],
  },
  {
    id: "jill",
    name: "Jill",
    tip: "Jill in the Box",
    looks: [{ style: "jack", jill: true }],
  },
  {
    id: "rick",
    name: "Rick",
    tip: "The police officer",
    looks: [
      {
        color: "#ffd23f",
        hat: { id: "police" },
        outfit: { id: "police" },
      },
    ],
  },
  {
    id: "bob",
    name: "Bob",
    tip: "Disco suit, afro and shades",
    looks: [
      {
        color: "#ff8c2b",
        hat: { id: "afro", c1: "#2b1a10" },
        face: { id: "shades" },
        outfit: { id: "disco", c1: "#d4a017" },
      },
    ],
  },
  {
    id: "veronica",
    name: "Veronica",
    tip: "A shirt and jeans, nothing else",
    looks: [
      {
        color: "#ffd23f",
        outfit: { id: "shirt", c1: "#c8102e", pants: "jeans" },
      },
    ],
  },
  {
    id: "johnny",
    name: "Johnny",
    tip: "Doctor, police or firefighter, a new one each time; no hair",
    looks: [
      {
        color: "#f4f4f0",
        hat: { id: "doctor" },
        outfit: { id: "doctor" },
      },
      {
        color: "#f4f4f0",
        hat: { id: "police" },
        outfit: { id: "police" },
      },
      {
        color: "#f4f4f0",
        hat: { id: "fire" },
        outfit: { id: "firefighter" },
      },
    ],
  },
  {
    id: "blocky",
    name: "Blocky Blockus",
    tip: "The block duck",
    looks: [
      { style: "blocks", color: "#ffd23f", eyes: "block", beak: "blocks" },
    ],
  },
  {
    id: "pp",
    name: "Pp",
    tip: "The 2D duck",
    looks: [{ style: "geo", color: "#2fa4ff", eyes: "flat", beak: "geo" }],
  },
  {
    id: "kyle",
    name: "Kyle",
    tip: "The pelican",
    looks: [{ style: "pelican", eyes: "pelican", beak: "pelican" }],
  },
  {
    id: "gibby",
    name: "Gibby",
    tip: "The raptor",
    looks: [{ style: "raptor", eyes: "raptor", beak: "teeth" }],
  },
  {
    id: "jerome",
    name: "Jerome",
    tip: "The white call duck in a birthday hat, sometimes a ribbon bow too",
    looks: [
      { style: "call", hat: { id: "birthday" } },
      { style: "call", hat: { id: "birthday" }, ribbon: true },
    ],
  },
  {
    id: "andy",
    name: "Andy",
    tip: "The mallard in a military helmet",
    looks: [{ style: "mallard", hat: { id: "helmet" } }],
  },
  {
    id: "butler",
    name: "Justin's Butler",
    tip: "Duck-sized now",
    looks: [BUTLER],
  },
  {
    id: "priest",
    name: "The Priest",
    tip: "Downpour's chapel",
    looks: [PRIEST],
  },
];
export const merchantById = (id) => MERCHANTS.find((m) => m.id === id) || null;
/* the look he has this time: roll is the number the rules rolled when he arrived (any whole number) */
export const merchantLook = (m, roll = 0) =>
  m.looks[Math.abs(Math.floor(+roll || 0)) % m.looks.length];
/* the merchant as a duck SVG (duckSVG's options: size, shadow, dead, gone …) */
export function merchantSVG(m, roll = 0, o = {}) {
  const L = merchantLook(m, roll),
    extra =
      (m.extra && !o.dead ? m.extra : "") +
      (L.ribbon && !(o.gone && o.gone.hat) ? RIBBON() : "") +
      (o.extra || "");
  return duckSVG(L, { title: m.name, ...o, extra });
}
