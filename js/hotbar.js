/* ---------- the specials on the number keys ----------
   On a computer: a small see-through row of the ten keys (1 … 9, 0) sits in the top bar, just after the title, so it
   covers nothing; it lets every click through (a touchscreen laptop gets it too, once its keys or touchpad are used). It
   comes in with each new stage on the board and with each key pressed (that key glowing); after 5 seconds unused it slides up off the screen. Keys kept on (Shift and the key) light up green
   and stay where they are while the rest fade, so you can always see what's on. Phones have no row: holding still on the
   board brings the specials around the finger (see touch.js); a tap uses one, holding one keeps it on, and lifting the
   holding finger over one uses it too. Phones also get a round Specials button in the bottom bar's right corner: it opens
   a column of the same specials over it (a tap uses one; holding one brings a "Toggle on" box, Shift and its key on a
   computer); the column stays until the button is tapped again or somewhere else is. */
import { esc, toast } from "./ui.js";
import { KEYS, SPECIALS, specialById, looksOf, ammoHTML } from "./specials.js";

const LIFE = 5000; // how long the row (or the ring of specials) stays after its last use
const HOLD = 450;
/* an item's wait: a bar that drains from full to nothing (c = [ends, how long, now]) */
const drain = (c) =>
  c
    ? `<s class="cooldown" style="--full:${c[1]}ms;--el:${Math.max(0, c[1] - (c[0] - c[2])).toFixed(0)}ms"></s>`
    : ""; // on a phone: holding a special this long keeps it on

/* api: keys() → the ten ids (or null), kept() → the set of ids kept on, use(i, keep), cool() → for each key, null or
   [when it works again, how long it waits, now] (an item just used: its key shows a bar draining until then), duck() →
   my duck (the hammer shows as a wrench on a duck that picked it), ammo() → the handgun's shots left (dots under its key) */
export function mountHotbar(S, api) {
  const bar = document.createElement("div");
  bar.className = "hotbar gone";
  bar.setAttribute("aria-hidden", "true");
  S.querySelector(".gbar-l").after(bar);
  let timer = 0,
    sel = -1,
    sig = "",
    wheel = null,
    wheelT = 0,
    coolT = 0,
    cools = [];
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mode-icon sp-btn";
  btn.setAttribute("aria-label", "Specials");
  btn.dataset.tip = "Specials";
  btn.innerHTML = '<span class="mi sp-cyc"><i></i><i></i></span>';
  let col = null,
    colSig = "";
  const look = (id) => looksOf(specialById(id), api.duck && api.duck());
  const dots = (id) =>
    id === "handgun" && api.ammo ? ammoHTML(api.ammo()) : "";
  /* the button shows your specials' icons in turn (none chosen: all of them; never one that's off) */
  const mine = () =>
    api.keys().filter((id) => id && specialById(id) && !specialById(id).off);
  let cycN = 0,
    cycFace = 0,
    heldI = -1;
  const face = (html) => {
    const faces = btn.querySelectorAll(".sp-cyc i");
    cycFace ^= 1;
    faces[cycFace].innerHTML = html;
    faces[cycFace].classList.add("up");
    faces[cycFace ^ 1].classList.remove("up");
  };
  /* phones: a special toggled on that is still waiting to work again shows on the button, with its bar draining */
  const btnCool = () => {
    const k = api.keys(),
      on = api.kept(),
      i = k.findIndex((id, j) => id && on.has(id) && cools[j]);
    const s = i < 0 ? "" : `${i}:${cools[i][0]}`;
    if (btn._cool === s) return;
    btn._cool = s;
    btn.querySelector(".cooldown")?.remove();
    btn.classList.toggle("cool", i >= 0);
    heldI = i;
    if (i < 0) return;
    face(look(k[i]).icon);
    btn.insertAdjacentHTML("beforeend", drain(cools[i]));
  };
  const cycle = () => {
    if (heldI >= 0) return; // (a special waiting stays on the button)
    const ids = mine(),
      list = ids.length ? ids : SPECIALS.filter((x) => !x.off).map((x) => x.id),
      sp = look(list[cycN++ % list.length]);
    const faces = btn.querySelectorAll(".sp-cyc i");
    cycFace ^= 1;
    faces[cycFace].innerHTML = sp.icon;
    faces[cycFace].classList.add("up");
    faces[cycFace ^ 1].classList.remove("up");
  };
  cycle();
  const cycT = setInterval(cycle, 1500);

  const draw = () => {
    const k = api.keys(),
      on = api.kept(),
      cd = api.cool ? api.cool() : [];
    cools = cd;
    if (col) drawCol(k, on, cd);
    btnCool();
    const now = JSON.stringify([
      k,
      [...on],
      sel,
      cd.map((c) => c && c[0]),
      api.ammo && api.ammo(),
      api.duck && !!(api.duck() || {}).wrench,
    ]);
    if (now === sig) return;
    sig = now;
    bar.innerHTML = KEYS.map((n, i) => {
      const sp = look(k[i]);
      return `<span class="hk${sp ? "" : " empty"}${sp && sp.off ? " off" : ""}${i === sel ? " sel" : ""}${sp && on.has(sp.id) ? " on" : ""}${cd[i] ? " cool" : ""}"><b>${n}</b>${sp ? `<i>${sp.icon}</i>` : ""}${drain(cd[i])}${dots(k[i])}</span>`;
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
  /* the row comes in (i: the key just pressed, glowing), then goes after 5 seconds unused */
  let resting = true,
    away = false;
  /* resting: only the keys kept on stay (none kept: the row is gone) */
  const settle = () => {
    const kept = resting && (api.kept().size > 0 || cools.some(Boolean)); // (and the items still waiting)
    bar.classList.toggle("gone", away || (resting && !kept));
    bar.classList.toggle("rest", !away && kept);
  };
  const show = (i = -1) => {
    sel = i;
    resting = false;
    away = false;
    draw();
    settle();
    clearTimeout(timer);
    timer = setTimeout(() => {
      sel = -1;
      resting = true;
      draw();
      settle();
    }, LIFE);
  };
  const hide = () => {
    clearTimeout(timer);
    resting = true;
    away = true;
    settle();
    closeWheel();
    closeCol();
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
        return `<button type="button" class="sp-wbtn${on.has(id) ? " on" : ""}${cd[i] ? " cool" : ""}${sp.off ? " off" : ""}" data-i="${i}" style="left:${(cx + Math.cos(a) * r).toFixed(0)}px;top:${(cy + Math.sin(a) * r).toFixed(0)}px" aria-label="${esc(sp.name)}"><i>${sp.icon}</i><b>${KEYS[i]}</b>${drain(cd[i])}${dots(id)}</button>`;
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
  /* ---------- phones: the Specials button and its column ---------- */
  const one = (id, i, on, cd) => {
    const sp = look(id);
    return `<button type="button" class="sp-wbtn${on.has(id) ? " on" : ""}${cd[i] ? " cool" : ""}${sp.off ? " off" : ""}" data-i="${i}" aria-label="${esc(sp.name)}"><i>${sp.icon}</i><b>${KEYS[i]}</b>${drain(cd[i])}${dots(id)}</button>`;
  };
  function drawCol(k, on, cd) {
    const now = JSON.stringify([
      k,
      [...on],
      cd.map((c) => c && c[0]),
      api.ammo && api.ammo(),
    ]);
    if (now === colSig) return;
    colSig = now;
    const ask = col.querySelector(".sp-toggle"),
      askI = ask ? +ask.dataset.i : -1;
    col.innerHTML = k
      .map((id, i) => (id && specialById(id) ? one(id, i, on, cd) : ""))
      .join("");
    if (askI >= 0) toggleBox(askI);
  }
  /* the box beside a held special: Toggle on (or off) */
  function toggleBox(i) {
    col.querySelector(".sp-toggle")?.remove();
    const b = col.querySelector(`.sp-wbtn[data-i="${i}"]`);
    if (!b || b.classList.contains("off")) return;
    const box = document.createElement("button");
    box.type = "button";
    box.className = "sp-toggle";
    box.dataset.i = i;
    box.textContent = api.kept().has(api.keys()[i])
      ? "Toggle off"
      : "Toggle on";
    b.append(box);
  }
  /* over the button, under the top bar (more of them go in a second column), and over a note at the bottom (a toast)
     that reaches into its lane */
  const place = () => {
    if (!col) return;
    const r = btn.getBoundingClientRect(),
      lane = r.left - 120;
    let floor = r.top;
    for (const t of document.querySelectorAll("#toasts .toast:not(.out)")) {
      const q = t.getBoundingClientRect();
      if (q.width && q.right > lane && q.top < floor) floor = q.top;
    }
    const top = (S.querySelector(".gbar") || btn).getBoundingClientRect()
      .bottom;
    col.style.right = Math.max(6, innerWidth - r.right).toFixed(0) + "px";
    col.style.bottom = (innerHeight - floor + 8).toFixed(0) + "px";
    col.style.maxHeight = Math.max(60, floor - top - 16).toFixed(0) + "px";
  };
  function openCol() {
    closeWheel();
    col = document.createElement("div");
    col.className = "sp-col";
    colSig = "";
    document.body.append(col);
    place();
    draw();
    drawCol(api.keys(), api.kept(), api.cool ? api.cool() : []);
    btn.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    col.tick = setInterval(() => {
      if (col) {
        drawCol(api.keys(), api.kept(), api.cool ? api.cool() : []);
        place();
      }
    }, 300); // (kept on, or off, by the room a moment later)
    let press = null;
    col.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const t = e.target.closest(".sp-toggle");
      if (t) {
        const i = +t.dataset.i;
        t.remove();
        api.use(i, true);
        return;
      }
      const b = e.target.closest(".sp-wbtn");
      if (!b) return;
      press = {
        i: +b.dataset.i,
        id: e.pointerId,
        t: setTimeout(() => {
          if (press) {
            toggleBox(press.i);
            press = null;
          }
        }, HOLD),
      };
    });
    col.addEventListener("pointerup", (e) => {
      if (!press || press.id !== e.pointerId) return;
      clearTimeout(press.t);
      const i = press.i;
      press = null;
      col.querySelector(".sp-toggle")?.remove();
      api.use(i, false);
    });
    col.addEventListener("pointercancel", () => {
      if (press) clearTimeout(press.t);
      press = null;
    });
    col.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  function closeCol() {
    if (!col) return;
    clearInterval(col.tick);
    col.remove();
    col = null;
    btn.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }
  btn.addEventListener("click", () => {
    if (col) closeCol();
    else if (!mine().length)
      toast("Pick your specials in Customize → Specials.");
    else openCol();
  });
  /* a tap anywhere else closes it */
  const outside = (e) => {
    if (col && !col.contains(e.target) && !btn.contains(e.target)) closeCol();
  };
  addEventListener("pointerdown", outside, true);
  addEventListener("resize", place);

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
  /* a keyboard, a mouse or a touchpad (a touchscreen laptop can tell the page it is only a touch screen): the row shows */
  const real = (e) => {
    if (e.type === "keydown" || e.pointerType === "mouse") {
      document.documentElement.classList.add("keyboard");
      removeEventListener("keydown", real);
      removeEventListener("pointermove", real);
    }
  };
  addEventListener("keydown", real);
  addEventListener("pointermove", real);

  return {
    show,
    hide,
    wheel: openWheel,
    closeWheel,
    button: btn,
    refresh() {
      draw();
      settle();
    },
    destroy() {
      clearTimeout(coolT);
      clearInterval(cycT);
      hide();
      closeCol();
      bar.remove();
      btn.remove();
      removeEventListener("pointerdown", outside, true);
      removeEventListener("resize", place);
      removeEventListener("pointerup", lifted);
      removeEventListener("keydown", real);
      removeEventListener("pointermove", real);
    },
  };
}
