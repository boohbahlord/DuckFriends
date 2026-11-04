/* Democracy of Ducklings: the room's rules the ducks vote on, from its own lobby row (under Game Settings, above Start
   Game or Ready). The same layout as Game Settings: plain rows on the left, what the row under the pointer does on the
   right. A rule passes with 2 of 3 ducks; New host takes every duck but the host. The host turns a rule on, or hands the
   host over, directly */
import { esc, openWindow, setHTML, confirmBox } from "./ui.js";
import {
  DOD_KEYS,
  DOD_NAMES,
  DOD_MS,
  dodOn,
  dodNeed,
  dodCount,
} from "./rules.js";
import { now } from "./clock.js";
import { infoUnder } from "./gamesettings.js";

/* what each rule does, as the preview says it */
export const DOD_TEXT = {
  ready:
    "The host can't start the game and readies like everyone else. The game starts once 2 of 3 of the ducks are ready.",
  maps: "The map is always picked by Vote Maps. (Duck Cabin's games always play on Duck Cabin.)",
  modes: "The game mode is always picked by Vote Game Mode.",
  settings: "Every duck can change the game settings, not only the host.",
  sudo: "Every duck gets sudo: the host's powers in the command line and the room.",
  host: "Pick the duck to become the new host. It takes every duck's vote, and the host can't vote.",
};
const HOW =
  "A vote passes with 2 of 3 ducks and lasts 60 s. While a vote is up, the host can't start the game, only ready. A rule that is on goes off again by another vote. The host turns a rule on, or hands the host over, directly.";

/* a rule's vote, if one is up: its votes, the votes it needs and the seconds it has left */
export function dodVote(s, k) {
  const x = ((s.dod || {}).votes || {})[k];
  if (!x) return null;
  return {
    ...dodCount(s, k),
    need: dodNeed(s, k),
    left: Math.max(0, Math.ceil((x.at + DOD_MS - now()) / 1000)),
    by: x.by,
  };
}

export function openDemocracy(R) {
  let page = null, // null (the rules) | host (the ducks to pick from)
    peek = null, // the row under the pointer: a rule's key, or a duck's id on the New host page
    W = null,
    off = null,
    clock = null;
  const S = () => R.state,
    isHost = () => S().hostId === R.me;
  const head = (title) =>
    `<header class="arm-h">${page ? '<button type="button" class="arm-back" data-a="back" aria-label="Back">‹</button>' : '<span class="arm-mark">◆</span>'}<h2>${esc(title)}</h2></header>`;
  const row = (attrs, label, val, on, up) =>
    `<li><button type="button" class="arm-row${up ? " dod-up" : ""}" ${attrs} aria-pressed="${on}"><span>${esc(label)}${up ? '<b class="dod-bang" aria-label="A vote is up">!</b>' : ""}</span><span class="val">${esc(val)}</span></button></li>`;
  const humans = (s) =>
    s.seat.filter((id) => !s.players[id].bot && id !== s.hostId);

  function menuHTML() {
    const s = S();
    if (page === "host") {
      const v = dodVote(s, "host"),
        n = {};
      for (const c of Object.values((v && v.by) || {})) n[c] = (n[c] || 0) + 1;
      const list = humans(s);
      return (
        head(DOD_NAMES.host) +
        `<div class="arm-body"><ul class="arm-list">${list
          .map((id) =>
            row(
              `data-to="${esc(id)}"`,
              s.players[id].name,
              n[id] ? `${n[id]}/${v.need}` : "",
              !!v && v.by[R.me] === id,
              false,
            ),
          )
          .join(
            "",
          )}</ul>${list.length ? "" : '<p class="small dim gs-none">No other duck is here to be the host.</p>'}</div>`
      );
    }
    return (
      head("Democracy of Ducklings") +
      `<div class="arm-body"><ul class="arm-list">${DOD_KEYS.map((k) => {
        const v = dodVote(s, k);
        if (k === "host")
          return row(
            'data-k="host"',
            DOD_NAMES.host,
            v ? `${v.n}/${v.need}` : "",
            false,
            !!v,
          );
        return row(
          `data-k="${k}"`,
          DOD_NAMES[k],
          v ? `${v.n}/${v.need}` : dodOn(s, k) ? "On" : "Off",
          !!v && !!v.by[R.me],
          !!v,
        );
      }).join("")}</ul></div>`
    );
  }

  /* the preview: the rule (or duck) under the pointer, its vote if one is up, and how the votes work */
  function stageHTML() {
    const s = S(),
      k =
        page === "host"
          ? "host"
          : peek && DOD_KEYS.includes(peek)
            ? peek
            : null;
    if (!k)
      return `<div class="gs-text"><h3>Democracy of Ducklings</h3><p>${esc(HOW)}</p></div>`;
    const v = dodVote(s, k),
      on = k !== "host" && dodOn(s, k),
      who =
        page === "host" && peek && s.players[peek] ? s.players[peek].name : "",
      what =
        k === "host"
          ? isHost()
            ? who
              ? `You hand the host over to ${who} at once.`
              : "You pick the new host yourself, at once."
            : "Pick a duck: your vote goes to them. Pick them again to take your vote back."
          : isHost() && !on
            ? "You turn it on at once."
            : v && v.by[R.me]
              ? "You voted. Pick it again to take your vote back."
              : on
                ? "It's on. Pick it to vote it off."
                : "Pick it to vote it on.",
      line = v
        ? `<p class="dod-now">${k === "host" && v.to && s.players[v.to] ? `${esc(s.players[v.to].name)}: ` : ""}${v.n} of ${v.need} votes · ${v.left} s left</p>`
        : "";
    return `<div class="gs-text"><h3>${esc(DOD_NAMES[k])}${on ? " · On" : ""}</h3><p>${esc(DOD_TEXT[k])}</p><p>${esc(what)}</p>${line}</div>`;
  }

  function paint(keep = true) {
    if (!W || !W.isConnected) return;
    const menu = W.querySelector(".arm-menu"),
      body = menu.querySelector(".arm-body"),
      top = keep && body ? body.scrollTop : 0;
    setHTML(menu, menuHTML());
    const nb = menu.querySelector(".arm-body");
    if (nb) nb.scrollTop = top;
    setHTML(W.querySelector(".gs-stage"), stageHTML());
    place();
  }
  /* on a phone the words go under the row they're about (gamesettings.js), or under the last row for how the votes work */
  const place = () => {
    const menu = W.querySelector(".arm-menu"),
      rows = [...menu.querySelectorAll(".arm-row")];
    infoUnder(
      W,
      rows.find((r) => (r.dataset.k || r.dataset.to) === peek) ||
        rows[rows.length - 1] ||
        null,
    );
  };
  const go = (p) => {
    page = p;
    peek = null;
    paint(false);
    const f = W.querySelector(".arm-menu .arm-back, .arm-menu .arm-row");
    if (f) f.focus();
  };
  const peekAt = (t) => {
    const r = t.closest(".arm-row"),
      p = r ? r.dataset.k || r.dataset.to || null : null;
    if (p === peek) return;
    peek = p;
    setHTML(W.querySelector(".gs-stage"), stageHTML());
    place();
  };

  return openWindow(
    `<div class="armory gs dod"><div class="arm-menu"></div><div class="arm-stage gs-stage" data-nonav></div></div>`,
    {
      cls: "win-armory win-full win-gs",
      onOpen(w) {
        W = w;
        paint(false);
        off = R.on(() => paint());
        clock = setInterval(() => {
          if (dodVoteUp(S())) paint();
        }, 1000); // (the seconds left)
        const menu = w.querySelector(".arm-menu");
        menu.addEventListener("pointerover", (e) => peekAt(e.target));
        menu.addEventListener("focusin", (e) => peekAt(e.target));
        menu.addEventListener("click", async (e) => {
          const s = S(),
            a = e.target.closest("[data-a]");
          if (a && a.dataset.a === "back") return go(null);
          const r = e.target.closest(".arm-row");
          if (!r) return;
          peekAt(r);
          if (r.dataset.k === "host") return go("host");
          if (r.dataset.k) return R.send({ t: "dod", k: r.dataset.k });
          if (r.dataset.to) {
            const p = s.players[r.dataset.to];
            if (
              isHost() &&
              !(await confirmBox(
                `Make ${p ? p.name : "them"} the host?`,
                "You stop being the host at once.",
              ))
            )
              return;
            R.send({ t: "dod", k: "host", v: r.dataset.to });
          }
        });
      },
    },
  ).then((v) => {
    if (off) off();
    clearInterval(clock);
    W = null;
    return v;
  });
}
const dodVoteUp = (s) => Object.keys((s.dod || {}).votes || {}).length > 0;
