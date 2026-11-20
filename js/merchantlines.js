/* ---------- what the merchants say (Dead Ducks Arcade) ----------
   The owner's, Nov 18 13:46Z: "The dialog of the seller is the same universally, saying one of these automatically when
   you walk up to them ... the dialog is shuffled". Every merchant has the same three lists: walking up to him (GREET),
   hurt by a player and still alive (HURT, once, then he runs), and leaving as the zombies come back (LEAVE). Babatunde
   and Omowunmi mix Yoruba lines into theirs (OWN: Adam's, Nov 18, kept with their tone marks exactly as written).
   The rules shuffle each list as a bag: every line once before any comes again (l4ddrules.js merchantSays) */
const GREET = [
  "What can I get for you?",
  "Anything you would like?",
  "You are looking good today.",
  "Interested in buying anything?",
  "You like what I'm selling?",
  "You need anything?",
  "These are some good prices aren't they?",
  "Easy sell.",
  "You got a zombie problem?",
];
const HURT = [
  "Stop that!",
  "You want anything or not!?",
  "You aren't going to get anything if you keep this up.",
  "Stop!",
  "Try that again!",
  "Don't shoot!",
  "I am trying to help!",
  "What the hell!?",
  "Please don't shoot!",
];
const LEAVE = [
  "Gotta go!",
  "Nice doing business with you.",
  "I need to get out of here.",
  "It's not safe here anymore.",
  "I am packing my bags.",
  "I wish you luck!",
  "I am hitting the road.",
  "Have a fun time!",
  "I am not staying.",
  "I cannot deal with zombies.",
  "I hate zombies.",
  "The zombies are here!",
  "Run!",
  "No! Not them again!",
  "Get out while you still can!",
];
/* the Yoruba lines (in English: Welcome! / Greetings at the market! / Are you well? / Father has returned! / I came from
   the King's market. / Ile-Ife is where we come from. / My mother is the Iyaloja. / An elder doesn't sit in the market
   and let a baby's head hang crooked. / I am a child of Oyo. / Please, stop! / What is wrong with you?! / Don't shoot! /
   Goodbye! / I'm going! / Be careful! / God will keep you.) */
const YORUBA = {
  greet: ["Ẹ kú àbọ̀!", "Ẹ kú ọjà o!", "Ṣé àlàáfíà ni?"],
  hurt: ["Ẹ dákun!", "Kí ló dé?!", "Ẹ má yìnbọn!"],
  leave: ["Ó dàbọ̀!", "Mo ń lọ!", "Ẹ ṣọ́ra o!", "Ọlọ́run á pa yín mọ́."],
};
const OWN = {
  babatunde: {
    greet: [
      ...YORUBA.greet,
      "Bàbá ti padà dé!",
      "Láti Ọjà Ọba ni mo ti wá.",
      "Ilé-Ifẹ̀ ni orírun wa.",
    ],
    hurt: YORUBA.hurt,
    leave: YORUBA.leave,
  },
  omowunmi: {
    greet: [
      ...YORUBA.greet,
      "Ìyálọ́jà ni ìyá mi.",
      "Àgbà kì í wà lọ́jà kí orí ọmọ tuntun wọ́.",
      "Ọmọ Ọ̀yọ́ ni mí.",
    ],
    hurt: YORUBA.hurt,
    leave: YORUBA.leave,
  },
};
/* merchant id's lines of one kind ("greet", "hurt" or "leave"): everyone's, and his own */
export const linesOf = (id, kind) => [
  ...{ greet: GREET, hurt: HURT, leave: LEAVE }[kind],
  ...((OWN[id] || {})[kind] || []),
];
