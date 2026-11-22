/* ---------- the specials on the number keys ----------
   On a computer: a row of my specials (1 … 9, 0; a key with nothing on it isn't shown) sits in the bottom bar's right
   corner, under the board, so it covers nothing; it lets every click through (a touchscreen laptop gets it too, once its
   keys or touchpad are used). It stays there all through a stage on the board: the key just pressed glows for a moment,
   keys kept on (Shift and the key) wear a green ring, and an item waiting to work again shows its bar draining. Phones
   have no row: holding still on the board brings the specials around the finger (see touch.js); a tap uses one, holding
   one keeps it on, and lifting the holding finger over one uses it too. Phones also get the specials as a slider in the
   bottom middle (as in my sketch): three slots, the middle one bigger, which is the one picked. Sliding left or right
   picks another (a longer slide goes past more of them), a tap on the middle one uses it, a tap on a side one picks it,
   (there is no square to switch one on: the one picked is the one toggled, the owner's, Nov 16). */
import { esc } from "./ui.js";
import { heldTag, nameOf, ARMS } from "./guns.js";
import {
  KEYS,
  specialById,
  looksOf,
  ammoHTML,
  pistolIcon,
} from "./specials.js";

const LIFE = 5000; // how long a key just pressed glows (and the ring of specials stays on a phone)
const HOLD = 450;
/* an item's wait: a bar that drains from full to nothing (c = [ends, how long, now]) */
const drain = (c) =>
  c
    ? `<s class="cooldown" style="--full:${c[1]}ms;--el:${Math.max(0, c[1] - (c[0] - c[2])).toFixed(0)}ms"></s>`
    : ""; // on a phone: holding a special this long keeps it on

/* api: keys() → the ten ids (or null), kept() → the set of ids kept on, use(i, keep), cool() → for each key, null or
   [when it works again, how long it waits, now] (an item just used: its key shows a bar draining until then), duck() →
   my duck (the hammer shows as a wrench on a duck that picked it), ammo() → the handgun's shots left (dots under its key),
   dots(id) → the dots under a key, when the game has its own (Mad God Justin: the uses left of a weapon picked up),
   select(i) → the slider picked key i, tap(i) → its middle one was tapped, current() → the id the game wants in the slider's middle (or null), caption(id) → the small text over the slider (or none).
   A game with slots of its own (Quacky Zombies) gives look(id) → { id, name, icon, off, keep, cls } for each (keep:
   false, the square can't switch it; cls, the slot's color) and sig() → what changes how they look. own(id) → the same for
   only some slots (Sandbox's spawn buttons), null for the rest, which look as specials do */
export function mountHotbar(S, api) {
  const bar = document.createElement("div");
  bar.className = "hotbar gone";
  bar.setAttribute("aria-hidden", "true"); // (game.js puts it in the bottom bar's right corner, with the slider)
  let timer = 0,
    sel = -1,
    sig = "",
    wheel = null,
    wheelT = 0,
    coolT = 0,
    tipT = 0,
    tip = 0; // ("Press H" over the bar: flash())
  const look = (id) => {
    if (api.look) return api.look(id);
    const own = api.own && api.own(id); // (a slot the game draws itself, the rest the specials: Sandbox's spawn buttons)
    if (own) return own;
    const duck = api.duck && api.duck(),
      sp = looksOf(specialById(id), duck);
    return sp && sp.id === "handgun"
      ? { ...sp, icon: pistolIcon(duck) } // (as the one in my hand, not the emoji)
      : sp;
  };
  /* Sandbox's hotbar is "full and empty" (the owner's answer, Nov 19 01:57Z): every slot shows from the start, an empty
     one as an empty square, on a computer and in a phone's slider (api.full() → true); in the slider an empty slot is
     HOLE and its number */
  const full = () => !!(api.full && api.full()),
    HOLE = "empty:",
    hole = (id) => typeof id === "string" && id.startsWith(HOLE),
    lookS = (id) =>
      hole(id) ? { id, name: "Empty slot", icon: "", cls: "empty" } : look(id);
  const dots = (id) =>
    api.dots
      ? api.dots(id)
      : id === "handgun" && api.ammo
        ? ammoHTML(api.ammo())
        : "";

  const draw = () => {
    const k = api.keys(),
      on = api.kept(),
      cd = api.cool ? api.cool() : [];
    drawSlide(k, on, cd);
    const now = JSON.stringify([
      k,
      [...on],
      sel,
      cd.map((c) => c && c[0]),
      api.ammo && api.ammo(),
      api.duck && !!(api.duck() || {}).wrench,
      k.map(dots),
      api.sig && api.sig(),
      tip,
    ]);
    bar.classList.toggle("full", full());
    if (now === sig) return;
    sig = now;
    bar.innerHTML = KEYS.map((n, i) => {
      const sp = look(k[i]);
      return `<span class="hk${sp ? "" : " empty"}${sp && sp.off ? " off" : ""}${i === sel ? " sel" : ""}${sp && on.has(sp.id) ? " on" : ""}${cd[i] && !cd[i][3] ? " cool" : ""}"><b>${n}</b>${sp ? `<i>${sp.icon}</i>` : ""}${drain(cd[i])}${dots(k[i])}</span>`;
    }).join("");
    if (tip)
      bar.insertAdjacentHTML("beforeend", `<em class="hk-tip">Press H</em>`);
    /* when the next one is ready again, its bar goes */
    const left = cd.filter(Boolean).map(([end, , t]) => end - t);
    clearTimeout(coolT);
    if (left.length)
      coolT = setTimeout(
        () => {
          draw();
          settle();
        },
        Math.min(...left) + 40,
      );
  };
  /* the row stays while a stage is on the board (away: off the board, it fades); a key pressed glows for 5 seconds */
  let away = true;
  const settle = () => {
    bar.classList.toggle("gone", away);
    slide.classList.toggle("gone", away);
  };
  const show = (i = -1) => {
    sel = i;
    away = false;
    draw();
    settle();
    clearTimeout(timer);
    timer = setTimeout(() => {
      sel = -1;
      draw();
    }, LIFE);
  };
  const hide = () => {
    clearTimeout(timer);
    away = true;
    settle();
    closeWheel();
  };

  /* ---------- phones: the specials around the finger ---------- */
  function closeWheel() {
    if (!wheel) return;
    clearTimeout(wheelT);
    wheel.remove();
    wheel = null;
  }
  function openWheel(x, y) {
    closeWheel();
    const k = api.keys(),
      on = api.kept(),
      cd = api.cool ? api.cool() : [],
      slots = k.map((id, i) => [id, i]).filter(([id]) => id);
    if (!slots.length) return false;
    const n = slots.length,
      r = n < 4 ? 64 : 64 + (n - 4) * 9,
      half = r + 30;
    const cx = Math.max(half + 6, Math.min(innerWidth - half - 6, x)),
      cy = Math.max(half + 6, Math.min(innerHeight - half - 6, y));
    wheel = document.createElement("div");
    wheel.className = "sp-wheel";
    wheel.innerHTML = slots
      .map(([id, i], j) => {
        const a = -Math.PI / 2 + (j / n) * Math.PI * 2,
          sp = look(id);
        return `<button type="button" class="sp-wbtn${on.has(id) ? " on" : ""}${cd[i] && !cd[i][3] ? " cool" : ""}${sp.off ? " off" : ""}" data-i="${i}" style="left:${(cx + Math.cos(a) * r).toFixed(0)}px;top:${(cy + Math.sin(a) * r).toFixed(0)}px" aria-label="${esc(sp.name)}"><i>${sp.icon}</i><b>${KEYS[i]}</b>${drain(cd[i])}${dots(id)}</button>`;
      })
      .join("");
    wheel.opened = performance.now();
    document.body.append(wheel);
    let press = null;
    const fire = (i, keep) => {
      closeWheel();
      api.use(i, keep);
    };
    wheel.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".sp-wbtn");
      if (!b) {
        e.preventDefault();
        closeWheel();
        return;
      } // a tap beside them: they go
      e.preventDefault();
      press = {
        i: +b.dataset.i,
        id: e.pointerId,
        t: setTimeout(() => {
          const i = press.i;
          press = null;
          fire(i, true);
        }, HOLD),
      };
    });
    wheel.addEventListener("pointerup", (e) => {
      if (!press || press.id !== e.pointerId) return;
      clearTimeout(press.t);
      const i = press.i;
      press = null;
      fire(i, false);
    });
    wheel.addEventListener("pointercancel", () => {
      if (press) clearTimeout(press.t);
      press = null;
    });
    wheel.addEventListener("contextmenu", (e) => e.preventDefault());
    wheelT = setTimeout(closeWheel, LIFE);
    return true;
  }
  /* ---------- phones: the slider of specials ---------- */
  const slide = document.createElement("div");
  slide.className = "sp-phone gone";
  slide.innerHTML =
    '<small class="sp-cap"></small><div class="sp-slide" role="listbox" aria-label="Specials"><div class="sp-track"></div></div>';
  const track = slide.querySelector(".sp-track"),
    capEl = slide.querySelector(".sp-cap");
  /* over the slider, the one in the middle in very small text: the game's own words for it (api.caption(id): Dead
     Ducks Arcade's, l4ddbar.js), else any weapon's or item's name, with a gun's caliber, in every mode (guns.js
     heldTag, by the board's names) */
  const caption = () => {
    const t =
      (cur &&
        (api.caption
          ? api.caption(cur)
          : ARMS[cur]
            ? heldTag(cur, nameOf(cur, "board"))
            : "")) ||
      "";
    if (capEl.textContent !== t) capEl.textContent = t;
  };
  let list = [], // [id, key index] of each special on my keys, in key order
    cur = null, // the id in the middle
    pos = 0, // where the slider is: the list index in the middle (between two while a finger slides it)
    slideSig = "",
    listSig = "",
    lastWant = null;
  /* the screen's size, kept here: reading innerWidth or innerHeight makes the browser lay the page out first, and
     lay() ran every frame in a swarm, when the page is never settled (the owner's phone measure, Nov 20: 645 ms of
     8 s at 4x). It changes only on a resize; a slot's step likewise */
  let vw = innerWidth,
    vh = innerHeight,
    stepAt = "",
    stepPx = 0;
  const resized = () => {
    vw = innerWidth;
    vh = innerHeight;
  };
  addEventListener("resize", resized);
  const STEP = () => {
    const k = `${vw}x${vh}`;
    if (k === stepAt && stepPx) return stepPx;
    const v =
      parseFloat(getComputedStyle(slide).getPropertyValue("--step")) *
      parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (!v) return 36; // (not on the page yet: not kept)
    stepAt = k;
    return (stepPx = v);
  };
  const curI = () => list.findIndex(([id]) => id === cur);
  /* each slot along the row: the one in the middle bigger, the two beside it smaller, the rest out of sight */
  let laid = ""; // what the last lay() placed: the same slots at the same spot on the same screen need no new layout
  let built = 0; // (counts the times the row's slots were made new: a patched slot keeps its place)
  const lay = () => {
    const key = `${built}|${pos}|${vw}x${vh}`;
    if (key === laid) return; // (it ran on every paint and asked the browser for a fresh style each time: slow)
    laid = key;
    const step = STEP();
    track.querySelectorAll(".sp-slot").forEach((b, j) => {
      const d = j - pos,
        a = Math.abs(d);
      b.style.transform = `translateX(${(d * step).toFixed(1)}px) scale(${(1 + 0.32 * Math.max(0, 1 - a)).toFixed(3)})`;
      b.style.opacity = a > 1.6 ? 0 : a > 1.1 ? ((1.6 - a) * 2).toFixed(2) : 1;
      b.classList.toggle("mid", a < 0.5);
      b.tabIndex = a < 0.5 ? 0 : -1;
    });
  };
  /* picks the one in the middle (the game is told, so in Mad God Justin the knife, the bow or the medkit goes in hand) */
  const pick = (j, tell = true) => {
    if (!list.length) return;
    j = Math.max(0, Math.min(list.length - 1, j));
    const was = cur;
    cur = list[j][0];
    pos = j;
    track.classList.remove("sliding");
    lay();
    caption();
    if (tell && cur !== was && api.select) api.select(list[j][1]);
    if (cur !== was) peekSwitch(false, was);
  };
  /* phones, with the slider on my duck (every mode but Dead Ducks Arcade, which has its own: l4dd.js peek; the owner's,
     Nov 18 20:58Z, "every"): the switch in a small box under my duck, the slider in little, scrolling from the one I
     had to the one picked, the one in the middle bigger, then fading out quickly, as on a computer in Dead Ducks Arcade
     (css .l4-peek). again: shown even with nothing switched (a swipe on my duck at the end of the row). api.tag() → my
     name tag (only a game that wants the box gives it) */
  let peekWas = null;
  function peekSwitch(again, prev = null) {
    if (!api.tag || getComputedStyle(slide).display === "none") return;
    const to = curI(),
      tag = api.tag();
    if (to < 0 || !tag) return;
    if (peekWas === null && !again) {
      peekWas = prev === null ? cur : prev;
      if (prev === null) return;
    } // (not when the game starts: only a switch; the very first switch shows too, from the one I had)
    if (cur === peekWas && !again) return;
    const from = list.findIndex(([id]) => id === peekWas);
    peekWas = cur;
    let el = tag.querySelector(".l4-peek");
    if (!el) {
      el = document.createElement("span");
      el.className = "l4-peek";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML =
        '<span class="sp-slide"><span class="sp-track"></span></span>';
      tag.append(el);
    }
    const tr = el.querySelector(".sp-track");
    tr.innerHTML = list
      .map(([id]) => {
        const sp = lookS(id);
        return `<span class="sp-slot${sp.cls ? " " + sp.cls : ""}"><i>${sp.icon}</i></span>`;
      })
      .join("");
    const at = (k) =>
      tr.querySelectorAll(".sp-slot").forEach((b, j) => {
        const a = Math.abs(j - k);
        b.style.transform = `translateX(calc(var(--step) * ${j - k})) scale(${(1 + 0.32 * Math.max(0, 1 - a)).toFixed(3)})`;
        b.style.opacity = a > 1.6 ? 0 : 1;
        b.classList.toggle("mid", a < 0.5);
      });
    tr.classList.add("sliding"); // (at the old slot at once, then it scrolls)
    at(from < 0 ? to : from);
    void tr.offsetWidth;
    tr.classList.remove("sliding");
    at(to);
    el.classList.remove("go");
    void el.offsetWidth;
    el.classList.add("go");
  }
  function drawSlide(k, on, cd) {
    /* what I hold, and the FIRST empty slot only, to scroll to when I want nothing in hand (the owner's, Nov 19 21:59Z:
       1, 2, 3 and 0 full, so it goes 3, then 4, then 0). Not in a game with slots of its own (Quacky Zombies) */
    let gap = !!api.look;
    list = [];
    KEYS.forEach((_, i) => {
      if (k[i] && look(k[i])) list.push([k[i], i]);
      else if (!gap) {
        gap = true;
        list.push([HOLE + i, i]);
      }
    });
    slide.classList.toggle("none", !list.length);
    const sig = JSON.stringify([
      list,
      [...on],
      cd.map((c) => c && c[0]),
      k.map(dots),
      api.duck && !!(api.duck() || {}).wrench,
      api.sig && api.sig(),
    ]);
    if (sig !== slideSig) {
      slideSig = sig;
      const html = list.map(([id, i]) => {
          const sp = lookS(id);
          return `<button type="button" class="sp-slot${sp.cls ? " " + sp.cls : ""}${on.has(id) ? " on" : ""}${cd[i] && !cd[i][3] ? " cool" : ""}${sp.off ? " off" : ""}" role="option" aria-label="${esc(sp.name)}"><i>${sp.icon}</i>${drain(cd[i])}${dots(id)}</button>`;
        }),
        ids = JSON.stringify(list);
      /* the same slots with other numbers (a shot fired, a reload going, a cooldown): each slot that changed is
         patched where it stands, never rebuilt, so the row sits still while I fire or reload (the owner's, Nov 18) */
      if (ids === listSig && track.children.length === html.length)
        html.forEach((h, j) => {
          const b = track.children[j];
          if (b._h === h) return;
          const n = document.createElement("template");
          n.innerHTML = h;
          const t = n.content.firstChild,
            mid = b.classList.contains("mid");
          b.className = t.className + (mid ? " mid" : "");
          b.innerHTML = t.innerHTML;
          b._h = h;
        });
      else {
        listSig = ids;
        built++;
        track.innerHTML = html.join("");
        [...track.children].forEach((b, j) => (b._h = html[j]));
      }
    }
    /* the one in the middle stays (gone from my keys, like a medkit used: the nearest one) */
    const want = api.current && api.current();
    if (want !== lastWant) {
      lastWant = want;
      if (want && list.some(([id]) => id === want) && cur !== want) {
        cur = want;
        peekSwitch(false);
      }
    } // (the game put another in hand: Mad God Justin's keys 1 to 3)
    if (curI() < 0 && list.length)
      pick(Math.min(Math.round(pos), list.length - 1), !!cur);
    else if (!track.classList.contains("sliding")) {
      pos = Math.max(0, curI());
      lay();
    }
    caption();
  }
  /* a finger on the slider: it follows the finger; let go, the nearest one is picked. A tap: the middle one is used,
     one beside it is picked */
  let drag = null;
  slide.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".sp-slide") || !list.length) return;
    e.preventDefault();
    try {
      slide.setPointerCapture(e.pointerId);
    } catch {}
    drag = {
      id: e.pointerId,
      x: e.clientX,
      from: pos,
      moved: 0,
      slot: e.target.closest(".sp-slot"),
    };
  });
  slide.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved < 6) return;
    track.classList.add("sliding");
    pos = Math.max(
      -0.35,
      Math.min(list.length - 0.65, drag.from - dx / STEP()),
    );
    lay();
  });
  const let_go = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.moved >= 6 || e.type !== "pointerup") {
      pick(Math.round(pos));
      return;
    }
    const j = d.slot ? [...track.children].indexOf(d.slot) : -1;
    if (j < 0) return;
    if (j === curI()) {
      (api.tap || api.use)(list[j][1], false);
      show(list[j][1]);
    } else pick(j);
  };
  slide.addEventListener("pointerup", let_go);
  slide.addEventListener("pointercancel", let_go);
  slide.addEventListener("contextmenu", (e) => e.preventDefault());
  const slideT = setInterval(() => {
    if (!away) draw();
  }, 300);

  /* the finger that brought the ring up, lifted over one of them: that one */
  function lifted(e) {
    if (!wheel || performance.now() - wheel.opened < 120) return;
    const b = document.elementFromPoint(e.clientX, e.clientY);
    const btn = b && b.closest && b.closest(".sp-wbtn");
    if (btn && wheel.contains(btn)) {
      const i = +btn.dataset.i;
      closeWheel();
      api.use(i, false);
    }
  }
  addEventListener("pointerup", lifted);
  /* (a keyboard, a mouse or a touchpad shows the row: pointer.js) */

  return {
    show,
    hide,
    wheel: openWheel,
    closeWheel,
    slider: slide,
    row: bar,
    current: () => (hole(cur) ? null : cur),
    /* phones: the slider is on my duck, out of sight (the owner's, Nov 18 15:18Z: "The hotbar should
       be on the player's [duck] for now on in mobile and swiping on their duck shows the selection AND it fades away
       like it does on PC"): a swipe on my duck picks the one beside the picked one (d: 1 the next, -1 the one before),
       as sliding the slider one slot would, and the switch shows under my duck (peekSwitch, or l4dd.js peek); a tap on my
       duck uses the picked one, as a tap on the slider's middle one did */
    nudge(d) {
      if (!list.length) return;
      const was = cur;
      pick(Math.max(0, curI()) + d);
      if (cur === was) peekSwitch(true); // (the end of the row: the box shows all the same)
    },
    tapMid() {
      const j = curI();
      if (j < 0) return;
      (api.tap || api.use)(list[j][1], false);
      show(list[j][1]);
    },
    refresh() {
      draw();
      settle();
    },
    /* an empty key pressed (P5, the owner's, Nov 21 18:59Z: "if the player clicks their hotbar and it's empty, it like
       flashes with a text over their hotbar saying to click H"): "Press H" flashes over the bar */
    flash() {
      tip++;
      draw(); // (the key pressed shows already: useKey)
      clearTimeout(tipT);
      tipT = setTimeout(() => {
        tip = 0;
        draw();
      }, 1800);
    },
    destroy() {
      clearTimeout(coolT);
      clearTimeout(tipT);
      clearInterval(slideT);
      hide();
      bar.remove();
      slide.remove();
      removeEventListener("pointerup", lifted);
      removeEventListener("resize", resized);
    },
  };
}
