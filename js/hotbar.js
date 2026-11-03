/* ---------- the specials on the number keys ----------
   On a computer: a row of my specials (1 … 9, 0; a key with nothing on it isn't shown) sits in the bottom bar's right
   corner, under the board, so it covers nothing; it lets every click through (a touchscreen laptop gets it too, once its
   keys or touchpad are used). It stays there all through a stage on the board: the key just pressed glows for a moment,
   keys kept on (Shift and the key) wear a green ring, and an item waiting to work again shows its bar draining. Phones
   have no row: holding still on the board brings the specials around the finger (see touch.js); a tap uses one, holding
   one keeps it on, and lifting the holding finger over one uses it too. Phones also get the specials as a slider in the
   bottom middle (as in my sketch): three slots, the middle one bigger, which is the one picked. Sliding left or right
   picks another (a longer slide goes past more of them), a tap on the middle one uses it, a tap on a side one picks it,
   and the purple square to its right keeps the picked one on (Shift and its key on a computer). */
import { esc } from "./ui.js";
import { KEYS, specialById, looksOf, ammoHTML } from "./specials.js";

const LIFE = 5000; // how long a key just pressed glows (and the ring of specials stays on a phone)
const HOLD = 450;
/* an item's wait: a bar that drains from full to nothing (c = [ends, how long, now, "more"]); "more": the item can be
   used already, and the bar (in its second color) charges one more (Mad God Justin's Jaimes) */
const drain = (c) =>
  c
    ? `<s class="cooldown${c[3] ? " more" : ""}" style="--full:${c[1]}ms;--el:${Math.max(0, c[1] - (c[0] - c[2])).toFixed(0)}ms"></s>`
    : ""; // on a phone: holding a special this long keeps it on

/* api: keys() → the ten ids (or null), kept() → the set of ids kept on, use(i, keep), cool() → for each key, null or
   [when it works again, how long it waits, now] (an item just used: its key shows a bar draining until then), duck() →
   my duck (the hammer shows as a wrench on a duck that picked it), ammo() → the handgun's shots left (dots under its key),
   dots(id) → the dots under a key, when the game has its own (Mad God Justin: the uses left of a weapon picked up),
   select(i) → the slider picked key i, tap(i) → its middle one was tapped, current() → the id the game wants in the slider's middle (or null) */
export function mountHotbar(S, api) {
  const bar = document.createElement("div");
  bar.className = "hotbar gone";
  bar.setAttribute("aria-hidden", "true"); // (game.js puts it in the bottom bar's right corner, with the slider)
  let timer = 0,
    sel = -1,
    sig = "",
    wheel = null,
    wheelT = 0,
    coolT = 0;
  const look = (id) => looksOf(specialById(id), api.duck && api.duck());
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
    ]);
    if (now === sig) return;
    sig = now;
    bar.innerHTML = KEYS.map((n, i) => {
      const sp = look(k[i]);
      return `<span class="hk${sp ? "" : " empty"}${sp && sp.off ? " off" : ""}${i === sel ? " sel" : ""}${sp && on.has(sp.id) ? " on" : ""}${cd[i] && !cd[i][3] ? " cool" : ""}"><b>${n}</b>${sp ? `<i>${sp.icon}</i>` : ""}${drain(cd[i])}${dots(k[i])}</span>`;
    }).join("");
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
  /* ---------- phones: the slider of specials, and the square that keeps one on ---------- */
  const slide = document.createElement("div");
  slide.className = "sp-phone gone";
  slide.innerHTML =
    '<div class="sp-slide" role="listbox" aria-label="Specials"><div class="sp-track"></div></div>' +
    '<button type="button" class="sp-keep" aria-label="Toggle on" aria-pressed="false"><i></i></button>';
  const track = slide.querySelector(".sp-track"),
    keep = slide.querySelector(".sp-keep");
  let list = [], // [id, key index] of each special on my keys, in key order
    cur = null, // the id in the middle
    pos = 0, // where the slider is: the list index in the middle (between two while a finger slides it)
    slideSig = "",
    lastWant = null;
  const STEP = () =>
    parseFloat(getComputedStyle(slide).getPropertyValue("--step")) *
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 36;
  const curI = () => list.findIndex(([id]) => id === cur);
  /* each slot along the row: the one in the middle bigger, the two beside it smaller, the rest out of sight */
  const lay = () => {
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
    drawKeep();
    if (tell && cur !== was && api.select) api.select(list[j][1]);
  };
  const drawKeep = () => {
    const sp = cur && look(cur),
      on = !!cur && api.kept().has(cur);
    keep.classList.toggle("on", on);
    keep.disabled = !sp || !!sp.off;
    keep.setAttribute("aria-pressed", String(on));
    keep.setAttribute("aria-label", on ? "Toggle off" : "Toggle on");
  };
  function drawSlide(k, on, cd) {
    list = k.map((id, i) => [id, i]).filter(([id]) => id && specialById(id));
    slide.classList.toggle("none", !list.length);
    const sig = JSON.stringify([
      list,
      [...on],
      cd.map((c) => c && c[0]),
      k.map(dots),
      api.duck && !!(api.duck() || {}).wrench,
    ]);
    if (sig !== slideSig) {
      slideSig = sig;
      track.innerHTML = list
        .map(([id, i]) => {
          const sp = look(id);
          return `<button type="button" class="sp-slot${on.has(id) ? " on" : ""}${cd[i] && !cd[i][3] ? " cool" : ""}${sp.off ? " off" : ""}" role="option" aria-label="${esc(sp.name)}"><i>${sp.icon}</i>${drain(cd[i])}${dots(id)}</button>`;
        })
        .join("");
    }
    /* the one in the middle stays (gone from my keys, like a medkit used: the nearest one) */
    const want = api.current && api.current();
    if (want !== lastWant) {
      lastWant = want;
      if (want && list.some(([id]) => id === want)) cur = want;
    } // (the game put another in hand: Mad God Justin's keys 1 to 3)
    if (curI() < 0 && list.length)
      pick(Math.min(Math.round(pos), list.length - 1), !!cur);
    else if (!track.classList.contains("sliding")) {
      pos = Math.max(0, curI());
      lay();
    }
    drawKeep();
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
  keep.addEventListener("click", () => {
    const j = curI();
    if (j < 0) return;
    api.use(list[j][1], true);
    setTimeout(drawKeep, 80); // (kept on, or off, by the room a moment later)
  });
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
    current: () => cur,
    refresh() {
      draw();
      settle();
    },
    destroy() {
      clearTimeout(coolT);
      clearInterval(slideT);
      hide();
      bar.remove();
      slide.remove();
      removeEventListener("pointerup", lifted);
      removeEventListener("keydown", real);
      removeEventListener("pointermove", real);
    },
  };
}
