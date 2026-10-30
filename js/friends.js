/* ---------- friends ----------
   One window: your friend code, adding a friend by code, invites and requests, and the friends list with who is online
   and in which room. Invite asks a friend into your online room; Join goes to theirs. It needs a Google sign-in
   (account.js). It opens from the top right, the lobby menu, the pause menu, or Shift+\ (outside a game, when not typing).
   An invite or a friend request arriving shows as a notice at the bottom middle. */
import {
  openWindow,
  typing,
  windowOpen,
  esc,
  toast,
  notice,
  confirmBox,
  setHTML,
} from "./ui.js";
import { current, go } from "./router.js";
import {
  acct,
  onAccount,
  signIn,
  signOut,
  addByCode,
  accept,
  decline,
  unfriend,
  invite,
  dropInvite,
  myRoom,
} from "./account.js";
import { duckSVG } from "./duck.js";
import { activeRoom } from "./net.js";
import { joinOnlineRoom, whyNot } from "./online.js";
import { sfx } from "./sound.js";

const statusOf = (f) =>
  !f.on ? "Offline" : f.room ? `Online · in ${f.room.name}` : "Online";
function listsHTML() {
  const mine = myRoom(),
    invs = Object.entries(acct.invs),
    reqs = Object.entries(acct.reqs);
  const friends = Object.entries(acct.friends).sort(
    ([, a], [, b]) => b.on - a.on || a.name.localeCompare(b.name),
  );
  return `${
    invs.length
      ? `<h3>Invites</h3><ul class="fr-list">${invs
          .map(
            ([
              id,
              v,
            ]) => `<li><span class="fr-who"><b>${esc(v.name)}</b> invites you to <b>${esc(v.room.name)}</b></span>
      <span class="fr-acts"><button type="button" class="btn small green" data-join-inv="${esc(id)}">Join</button><button type="button" class="btn small ghost" data-drop-inv="${esc(id)}">Not now</button></span></li>`,
          )
          .join("")}</ul>`
      : ""
  }
    ${
      reqs.length
        ? `<h3>Requests</h3><ul class="fr-list">${reqs
            .map(
              ([
                id,
                r,
              ]) => `<li><span class="fr-who"><b>${esc(r.name)}</b> wants to be friends</span>
      <span class="fr-acts"><button type="button" class="btn small green" data-accept="${esc(id)}">Accept</button><button type="button" class="btn small ghost" data-decline="${esc(id)}">Decline</button></span></li>`,
            )
            .join("")}</ul>`
        : ""
    }
    <h3>Friends${friends.length ? ` <span class="dim small">${friends.filter(([, f]) => f.on).length} online</span>` : ""}</h3>
    ${
      friends.length
        ? `<ul class="fr-list">${friends
            .map(([id, f]) => {
              const here = mine && f.room && f.room.rid === mine.rid;
              return `<li class="${f.on ? "on" : "off"}"><span class="fr-duck">${f.look ? duckSVG(f.look, { size: 38, shadow: false, title: f.name }) : ""}</span>
        <span class="fr-who"><b>${esc(f.name)}</b><span class="small dim">${esc(here ? "Online · in your room" : statusOf(f))}</span></span>
        <span class="fr-acts">${mine && f.on && !here ? `<button type="button" class="btn small" data-invite="${esc(id)}">Invite</button>` : ""}${f.room && !here ? `<button type="button" class="btn small green" data-join="${esc(id)}">Join</button>` : ""}<button type="button" class="fr-x" data-unfriend="${esc(id)}" aria-label="Remove ${esc(f.name)}" data-tip="Remove friend">×</button></span></li>`;
            })
            .join("")}</ul>`
        : '<p class="dim small">No friends yet. Send someone your code, or in a room right-click (or long-press) a player\'s card → Add friend.</p>'
    }`;
}

export function openFriends() {
  let off = null;
  const p = openWindow('<h2>Friends</h2><div class="fr"></div>', {
    cls: "win-friends",
    onOpen(w, close) {
      const box = w.querySelector(".fr");
      let mode = "";
      const paint = () => {
        const now = acct.uid ? "in" : "out";
        if (now !== mode) {
          mode = now;
          box.innerHTML =
            now === "out"
              ? `<p class="dim">Sign in to add friends, see who's online and invite them to your room. Your duck, name and settings follow you to any device.</p>
               <p class="acts"><button type="button" class="btn green" data-a="signin">Sign in with Google</button></p>`
              : `<div class="fr-code">Your friend code <b class="code"></b> <button type="button" class="btn small ghost" data-a="copy">Copy</button></div>
               <form class="fr-add" autocomplete="off"><input name="code" placeholder="A friend's code" maxlength="20" aria-label="A friend's code"><button type="submit" class="btn small">Add</button></form>
               <p class="fr-msg small" role="status"></p><div class="fr-lists"></div>
               <p class="fr-foot small dim">Signed in with Google · <button type="button" class="linkbtn" data-a="signout">Sign out</button></p>`;
          const f = box.querySelector(".fr-add");
          if (f)
            f.onsubmit = async (e) => {
              e.preventDefault();
              const msg = box.querySelector(".fr-msg");
              msg.textContent = "…";
              msg.textContent = await addByCode(f.code.value);
              if (/sent|Friends now/.test(msg.textContent)) f.code.value = "";
            };
        }
        if (now === "in") {
          box.querySelector(".code").textContent = acct.code || "…";
          setHTML(box.querySelector(".fr-lists"), listsHTML());
        }
      };
      paint();
      off = onAccount(paint);
      box.addEventListener("click", async (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset,
          say = (t) => {
            const m = box.querySelector(".fr-msg");
            if (m) m.textContent = t;
          };
        if (d.a === "signin") signIn();
        else if (d.a === "signout") {
          close();
          signOut();
        } else if (d.a === "copy") {
          try {
            await navigator.clipboard.writeText(acct.code);
            say("Code copied.");
          } catch (err) {
            say(`Your code: ${acct.code}`);
          }
        } else if (d.accept) {
          await accept(d.accept);
          say("Friends now.");
        } else if (d.decline) decline(d.decline);
        else if (d.invite) say(await invite(d.invite));
        else if (d.join) {
          const f = acct.friends[d.join];
          if (f && f.room) {
            close();
            joinRoom(f.room);
          }
        } else if (d.joinInv) {
          const v = acct.invs[d.joinInv];
          dropInvite(d.joinInv);
          if (v) {
            close();
            joinRoom(v.room);
          }
        } else if (d.dropInv) dropInvite(d.dropInv);
        else if (d.unfriend) {
          const f = acct.friends[d.unfriend];
          if (
            await confirmBox(
              `Remove ${f ? f.name : "this friend"}?`,
              "You can add each other again with a friend code.",
            )
          )
            unfriend(d.unfriend);
        }
      });
    },
  });
  p.then(() => off && off());
  return p;
}

/* go to a friend's room (leaving the one I'm in, after asking); a private room without an invite asks for its passkey */
export async function joinRoom(entry, passkey = "") {
  const r = activeRoom();
  if (r && r.state && r.state.id === entry.rid) {
    toast("You are in that room.");
    return;
  }
  if (r && !passkey) {
    if (!(await confirmBox("Leave this room?", `To join ${entry.name}.`)))
      return;
    r.send({ t: "leave" });
    r.close();
  }
  try {
    go("lobby", await joinOnlineRoom(entry, passkey));
  } catch (e) {
    if (/passkey/i.test(e.message)) askPass(entry, passkey ? e.message : "");
    else toast(/room/i.test(e.message) ? e.message : whyNot(e), 6000);
  }
}
function askPass(entry, note) {
  openWindow(
    `<h2>🔒 ${esc(entry.name)}</h2><form class="pass-form" autocomplete="off"><input class="passkey" placeholder="Passkey" maxlength="20" aria-label="Passkey">
    ${note ? `<p class="small bad">${esc(note)}</p>` : '<p class="small dim">A private room: ask your friend for the passkey.</p>'}<p class="acts"><button type="submit" class="btn green">Join</button></p></form>`,
    {
      cls: "win-small",
      onOpen: (w, close) => {
        const i = w.querySelector("input");
        i.focus();
        w.querySelector("form").onsubmit = (ev) => {
          ev.preventDefault();
          if (!i.value.trim()) {
            i.focus();
            return;
          }
          close();
          joinRoom(entry, i.value);
        };
      },
    },
  );
}

/* invites and requests arriving */
addEventListener("duck-invite", (e) => {
  const v = e.detail;
  sfx.ping();
  notice(`<b>${esc(v.name)}</b> invites you to <b>${esc(v.room.name)}</b>`, [
    [
      "Join",
      () => {
        dropInvite(v.id);
        joinRoom(v.room);
      },
      "green",
    ],
    ["Not now", () => dropInvite(v.id), "ghost"],
  ]);
});
addEventListener("duck-request", (e) => {
  const v = e.detail;
  sfx.ping();
  notice(`<b>${esc(v.name)}</b> wants to be friends`, [
    ["Accept", () => accept(v.id).then(() => toast("Friends now.")), "green"],
    ["Not now", () => {}, "ghost"],
  ]);
});
addEventListener("keydown", (e) => {
  if (
    e.code !== "Backslash" ||
    !e.shiftKey ||
    typing(e) ||
    windowOpen() ||
    current() === "game"
  )
    return;
  e.preventDefault();
  openFriends();
});
