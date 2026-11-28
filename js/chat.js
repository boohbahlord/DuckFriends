/* ---------- text chat (T) ----------
   A slide at the side chosen in Settings (left, bottom, right or hidden). Closed, it is a round button: "ABC" on white.

   Chat: @name pings that player (a soft sound and a "!" on the chat button); \@name sends a private message; \help lists
   these. Suggestions show once something is typed (\togglesuggest turns them off); Tab completes (never leaving the
   page), the arrow keys move through them. Mutes: \mute bubble ping text on @name … (until you leave the room),
   \permmute … (kept on this device), \show mute | permmute | players. A message over 250 characters folds under an
   arrow; each new message's bubble floats over its duck on the board. */
import { el, esc, typing, windowOpen, setHTML } from "./ui.js";
import { profile } from "./store.js";
import { activeRoom } from "./net.js";

import { denied, slowMs } from "./roomrules.js";
import { secret } from "./unlocks.js";
import { shareLook } from "./customize.js";

import { nameHTML, fontHTML } from "./name.js";
import { sfx } from "./sound.js";

import { settingText } from "./gamesettings.js";

import { DOD_NEWS } from "./lobbysettings.js";

import { npcById, seen } from "./npcs.js";
import {
  HELP,
  chatCommand,
  chatSuggest,
  isMuted,
  byTag,
  tag,
} from "./chatmutes.js";

export { isMuted, tag } from "./chatmutes.js";

/* a settings change in the chat, after the name tag of whoever made it: "changed Map to Tiles and Turn ends when done to
   2 of 3", or "put the game settings back to the defaults" */
function optsWords(m) {
  if (m.reset) return "put the game settings back to the defaults.";
  const all = Object.entries(m.opts)
    .filter(
      ([k]) =>
        !((k === "map" && m.opts.mapPick) || (k === "mode" && m.opts.modePick)),
    ) // (a vote or Random says it)
    .map(([k, v]) => settingText(k, v))
    .filter(Boolean)
    .map(([n, v]) => `${n} to ${v}`);
  if (!all.length) return "changed the game settings.";
  const list =
    all.length < 3
      ? all.join(" and ")
      : `${all.slice(0, -1).join(", ")} and ${all[all.length - 1]}`;
  return `changed ${list}.`;
}

/* ---------- the widget ---------- */
const ui = {
  open: false,
  ping: false,
  notes: [],
  long: new Set(),
  game: "",
  chatFrom: 0,
  dodRoom: "",
  dodVotes: [],
}; // notes: chat lines only you see; long: unfolded long messages; chatFrom: clear hides the chat before it, on your screen
const mentionRe = (n) =>
  new RegExp(
    `(^|[^\\\\\\p{L}\\p{N}_-])@(${tag(n).replace(/[-]/g, "\\-")}|everyone)(?![\\p{L}\\p{N}_-])`,
    "iu",
  );

/* the chat comes in two parts that the screen places: the round button (in the bottom bar) and the panel (in a dock at the
   side chosen in Settings, so it never covers anything) */
let current = null;
export function chatWidget() {
  const btn = el(
    `<button type="button" class="chat-btn mode-icon" aria-label="Text chat (T)" data-tip="Text chat (T)"><span class="mi">ABC</span><span class="bang" hidden>!</span></button>`,
  );
  const panel = el(`<section class="chat-panel dock-panel" hidden>
      <header><h3 class="chat-title">Chat</h3><button type="button" class="win-x chat-x" aria-label="Close the chat">×</button></header>
      <div class="chat-log" aria-live="polite"></div>
      <ul class="chat-sugg" role="listbox" hidden></ul>
      <form class="chat-row" autocomplete="off">
        <input class="chat-in" maxlength="500" spellcheck="false" aria-label="Message">
      </form>
    </section>`);
  const w = { btn, panel };
  const log = panel.querySelector(".chat-log"),
    inp = panel.querySelector(".chat-in"),
    sugg = panel.querySelector(".chat-sugg");
  let sel = 0,
    list = [],
    lastN = 0;
  const room = () => activeRoom();

  const addNote = (text, float) => {
    ui.notes.push({ t: Date.now(), mine: true, text }); // (a line only I see; float: the chat's button floats it too while the chat is closed)
    drawLog();
    if (float && !ui.open && room())
      showFloat(room().state, room().me, { sys: true, text });
  };
  const drawLog = () => {
    const r = room(),
      s = r && r.state;
    if (!s) {
      setHTML(log, "");
      return;
    }
    const me = r.me,
      name = (id) =>
        s.players[id]
          ? nameHTML(s.players[id].name, s.players[id].nameStyle)
          : '<span class="dim">Gone</span>';
    const lines = [
      ...s.log
        .filter((m) => m.t >= ui.chatFrom)
        .filter((m) =>
          m.npc
            ? !isMuted(s, m.npc, "text") &&
              (!(npcById(m.npc) || {}).cat || seen.has(m.n))
            : m.sys ||
              ((!m.to || m.to === me || m.from === me) &&
                !(m.from !== me && isMuted(s, m.from, "text"))),
        ),
      ...ui.notes.filter((m) => m.t >= ui.chatFrom),
    ].sort((a, b) => a.t - b.t);
    const html = lines
      .map((m) => {
        if (m.mine) return `<p class="sys note">${esc(m.text)}</p>`;
        if (m.opts)
          return `<p class="sys">${name(m.by)} ${esc(optsWords(m))}</p>`;
        if (m.buy && s.players[m.by])
          return `<p class="sys">${name(m.by)} ${esc(m.buy)}</p>`; // (a merchant's sale: the buyer's tag, then what it bought)
        if (m.sys)
          return `<p class="sys${m.small ? " small" : ""}">${esc(m.text)}</p>`;
        if (m.npc)
          return `<p class="npc npc-${esc(m.npc)}"><span class="npc-name">${esc(m.name || m.npc)}</span>: <span class="npc-said">${esc(m.text)}</span></p>`; // Duck Cabin's characters
        const meName = s.players[me] && s.players[me].name,
          hit =
            m.from !== me &&
            meName &&
            (m.to === me || mentionRe(meName).test(m.text)) &&
            !isMuted(s, m.from, "ping");
        /* over 250 characters: folded under an arrow (a ! beside it if it pings you), open until the chat closes */
        const long = m.text.length > 250,
          open = long && ui.long.has(m.n);
        const text = esc(
          long && !open ? m.text.slice(0, 250).trimEnd() + "…" : m.text,
        ).replace(
          /(\\?)@([\p{L}\p{N}_-]+)/gu,
          (a, b, n) => `<b class="at">${b}@${n}</b>`,
        );
        const fold = long
          ? `<button type="button" class="fold" data-n="${m.n}" aria-expanded="${open}" aria-label="${open ? "Fold" : "Show all"}">${open ? "▾" : "▸"}</button>${hit ? '<b class="fold-bang">!</b>' : ""} `
          : "";
        const priv = m.to
          ? `<span class="tag-priv">${m.from === me ? `to ${s.players[m.to] ? esc(s.players[m.to].name) : "?"}` : "private"}</span> `
          : "";
        return `<p class="${m.to ? "priv" : ""}${hit ? " hit" : ""}${long ? " long" : ""}">${fold}${priv}${name(m.from)}: ${text}</p>`;
      })
      .join("");
    const atEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    setHTML(
      log,
      html || '<p class="dim small">Say hi. \\help lists what chat can do.</p>',
    );
    if (atEnd) log.scrollTop = 1e9;
  };
  const drawSugg = () => {
    sugg.hidden = !list.length || document.activeElement !== inp;
    sugg.innerHTML = list
      .slice(0, 8)
      .map(
        (x, i) =>
          `<li role="option" data-i="${i}" aria-selected="${i === sel}">${esc(x.label)}</li>`,
      )
      .join("");
  };
  const refresh = () => {
    const r = room();
    list = !inp.value ? [] : chatSuggest(inp.value, r && r.state, r && r.me); // only once something is typed
    sel = Math.min(sel, Math.max(0, list.length - 1));
    drawSugg();
  };
  const openPanel = () => {
    ui.open = true;
    panel.hidden = false;
    btn.setAttribute("aria-pressed", "true");
    ui.ping = false;
    btn.querySelector(".bang").hidden = true;
    if (w.onToggle) w.onToggle(); // the dock opens first, so the box can take the focus
    drawLog();
    log.scrollTop = 1e9;
    inp.focus();
    refresh(); // always open on the newest message
  };
  const closePanel = () => {
    ui.open = false;
    ui.long.clear();
    panel.hidden = true;
    btn.setAttribute("aria-pressed", "false");
    inp.blur();
    if (w.onToggle) w.onToggle();
  };
  w.openChat = openPanel;
  w.close = closePanel;

  btn.onclick = () => (ui.open ? closePanel() : openPanel());
  panel.querySelector(".chat-x").onclick = closePanel;
  inp.addEventListener("focus", refresh);
  inp.addEventListener("click", refresh);
  inp.addEventListener("input", () => {
    sel = 0;
    refresh();
  });
  inp.addEventListener("blur", () => setTimeout(drawSugg, 120));
  sugg.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    e.preventDefault();
    inp.value = list[+li.dataset.i].apply();
    sel = 0;
    refresh();
  });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (list.length) {
        inp.value = list[sel].apply();
        sel = 0;
        refresh();
      }
      return;
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && list.length) {
      e.preventDefault();
      sel =
        (sel + (e.key === "ArrowDown" ? 1 : -1) + Math.min(8, list.length)) %
        Math.min(8, list.length);
      drawSugg();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    }
  });
  log.addEventListener("click", (e) => {
    const b = e.target.closest(".fold");
    if (!b) return;
    const n = +b.dataset.n;
    if (ui.long.has(n)) ui.long.delete(n);
    else ui.long.add(n);
    drawLog();
  });
  const submit = async (text) => {
    const r = room(),
      note = (...t) => {
        t.forEach(addNote);
        refresh();
      };
    /* clear clears the chat on your screen, help is the chat's help */
    if (/^\\?clear$/i.test(text)) {
      ui.chatFrom = Date.now();
      return note(
        "Chat cleared on your screen (everyone else still sees theirs).",
      );
    }
    if (/^\\?help$/i.test(text) || /^\\help\b/i.test(text))
      return note(...HELP);
    const sc = text.match(/^secret\s+(\S+)\s*(\S*)/i);
    if (sc) {
      const said = secret(sc[1], sc[2].toLowerCase());
      shareLook(); // (a code turned off takes locked things off)
      return note(said);
    } // (a secret code never goes to the room's chat)
    const said = await chatCommand(text, r);
    if (said !== null) {
      drawLog();
      return note(said);
    }
    if (!r) return note("Chat works in a room.");
    if (denied(r.state, r.me, "nochat"))
      return note(
        +r.state.options.noChat
          ? "Chat is off in this room."
          : "Your group can't chat.",
      );
    const slow = slowMs(r.state, r.me);
    if (slow && Date.now() - (ui.lastSent || 0) < slow)
      return note(
        `Slow down: one message every ${Math.round(slow / 1000)} seconds (${Math.ceil((slow - (Date.now() - ui.lastSent)) / 1000)} s).`,
      );
    ui.lastSent = Date.now();
    const pm = text.match(/^\\@([\p{L}\p{N}_-]+)\s+(.+)$/u);
    if (pm) {
      const to = byTag(r.state, pm[1]);
      if (!to) return note(`No player named ${pm[1]}.`);
      r.send({ t: "chat", to, text: pm[2] });
    } else if (/^\\@/.test(text))
      return note("A private message: \\@name, a space, then the message.");
    else r.send({ t: "chat", text });
    refresh();
  };
  panel.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const text = inp.value.trim();
    inp.value = "";
    sel = 0;
    if (!text) {
      closePanel();
      return;
    }
    return submit(text);
  };

  /* the newest message floats by the chat button for a few seconds (Settings → Chat → Floating messages, on unless turned
     off), see-through and in its writer's font; so do the room's rule changes, silly commands and group changes others
     make. One at a time, never while the chat is open, and it lets every tap through */
  let float = null;
  const floatable = (s, me, m) => {
    if (m.npc || m.mine) return false;
    if (m.sys) return !!m.float && m.by !== me;
    return (
      !!s.players[m.from] &&
      m.from !== me &&
      (!m.to || m.to === me) &&
      !isMuted(s, m.from, "text")
    );
  };
  const showFloat = (s, me, m) => {
    if (!float) {
      float = el('<div class="chat-float" aria-hidden="true"></div>');
      document.body.append(float);
    }
    const p = s.players[m.from],
      text =
        m.text.length > 160 ? m.text.slice(0, 160).trimEnd() + "…" : m.text;
    float.innerHTML = m.opts
      ? `<span class="cf-sys">${s.players[m.by] ? nameHTML(s.players[m.by].name, s.players[m.by].nameStyle) : "The host"} ${esc(optsWords(m))}</span>`
      : m.sys
        ? `<span class="cf-sys">${esc(m.text)}</span>`
        : `<b class="cf-name">${nameHTML(p.name, p.nameStyle)}</b>: <span class="cf-text">${fontHTML((p.nameStyle || {}).font, esc(text))}</span>`;
    const r = btn.getBoundingClientRect(),
      right = r.width && r.left > innerWidth / 2; // (by the button, wherever Settings put it)
    float.style.left =
      r.width && !right
        ? `${Math.max(8, r.left).toFixed(0)}px`
        : right
          ? "auto"
          : "8px";
    float.style.right = right
      ? `${Math.max(8, innerWidth - r.right).toFixed(0)}px`
      : "auto";
    float.style.bottom = `${Math.max(8, r.width ? innerHeight - r.top + 8 : 8).toFixed(0)}px`;
    float.classList.remove("on");
    void float.offsetWidth;
    float.classList.add("on"); // (the fade starts over for a newer one)
  };

  /* new messages: pings for @you; a "!" on the closed button */
  const onState = (s) => {
    const r = room();
    if (!r) return;
    /* a Democracy of Ducklings vote starting: a line in the chat (the note under the cloud says the same) */
    const dv = Object.keys((s.dod && s.dod.votes) || {}),
      dk = `${s.id}`;
    if (ui.dodRoom === dk && dv.some((k) => !ui.dodVotes.includes(k)))
      addNote(DOD_NEWS);
    ui.dodRoom = dk;
    ui.dodVotes = dv;
    const g = s.startedAt ? `${s.id}:${s.startedAt}` : ""; // each new game: a note on the chat's suggestions
    if (g && g !== ui.game) {
      ui.game = g;
      addNote(
        `New game. \\togglesuggest turns the chat's suggestions ${profile.settings.chatSuggest === false ? "back on" : "off"}.`,
      );
    }
    if ((s.logN || 0) !== lastN) {
      const fresh = s.log.filter((m) => m.n > lastN);
      lastN = s.logN || 0;
      const meName = s.players[r.me] && s.players[r.me].name;
      const hit = fresh.some(
        (m) =>
          !m.sys &&
          m.from !== r.me &&
          !isMuted(s, m.from, "text") &&
          !isMuted(s, m.from, "ping") &&
          (m.to === r.me || (meName && mentionRe(meName).test(m.text))),
      );
      if (hit) {
        sfx.ping();
        if (!ui.open) {
          ui.ping = true;
          btn.querySelector(".bang").hidden = false;
        }
      }
      const fl =
        !ui.open &&
        profile.settings.chatFloat !== false &&
        btn.isConnected &&
        [...fresh].reverse().find((m) => floatable(s, r.me, m));
      if (fl) showFloat(s, r.me, fl);
      drawLog();
    }
  };
  const r0 = room();
  if (r0) lastN = r0.state.logN || 0;
  const unsub = r0 ? r0.on(onState) : () => {};
  w.destroy = () => {
    unsub();
    if (float) float.remove();
    float = null;
    if (current === w) current = null;
  };
  w.isOpen = () => ui.open;
  w.note = (text) => addNote(text, true);
  if (ui.open) {
    panel.hidden = false;
    btn.setAttribute("aria-pressed", "true");
  }
  if (ui.ping) btn.querySelector(".bang").hidden = false;
  current = w;
  return w;
}
export const chatNote = (text) => current && current.note(text); // (a line of the chat only I see: game.js)
/* T opens the chat (not while typing or with a window open) */
addEventListener("keydown", (e) => {
  if (
    e.code !== "KeyT" ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey ||
    typing(e) ||
    windowOpen()
  )
    return;
  if (!current) return;
  e.preventDefault();
  current.openChat();
});
