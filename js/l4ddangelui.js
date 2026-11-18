/* ---------- Dead Ducks Arcade's Angel machine on every screen (the rules: l4ddangel.js) ----------
   The machine on the stage (Noah's drawing, powerart.js), glowing while it works, sparks and smoke out of its hatch
   (fx.js); then the orb over it, with its duck's name, till that duck takes it. E by it: what it does now. Its sounds:
   working (once, 5 s) and the orb coming out. l4dd.js calls these. */
import { sortY, seenFrom } from "./hangout/layout.js";
import { svgDataURL } from "./hangout/art.js";
import { play } from "./sound.js";
import { fxSparks } from "./fx.js";
import { nameHTML } from "./name.js";
import { now as clockNow } from "./clock.js";
import { angelMachineSVG, angelOrbHTML } from "./powerart.js"; // (Noah's drawings)
import { ANGEL, angelNow, angelDone, angelOf, canAngel } from "./l4ddangel.js";
import { powerOn } from "./l4ddpower.js";
import { WEAPONS, weaponName, ptsOf, slotsOf, dp } from "./l4ddrules.js";

let mc = null, // { el, img, orb, who, sig, tr, k }
  heard = { t: 0, out: 0 },
  sparkAt = 0;

/* its static (the owner's, Nov 17 17:41Z): "a transparent fuzzy grey and white static on the machine at all times". A
   small square of grey and white specks, made once, tiled over the machine and cut to its shape (css: mask), jumping
   about so it fizzes */
let staticURL = "";
function staticTile() {
  if (staticURL) return staticURL;
  const n = 96,
    c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d"),
    im = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = 120 + Math.floor(Math.random() * 136), // (grey to white)
      a = Math.random() < 0.55 ? Math.floor(Math.random() * 200) : 0; // (specks, gaps between them)
    im.data.set([v, v, v, a], i * 4);
  }
  g.putImageData(im, 0, 0);
  return (staticURL = c.toDataURL());
}

export function angelMount(ctx, layer) {
  mc = { el: document.createElement("div"), sig: "", tr: "", k: 0, orbSig: "" };
  mc.el.className = "l4-am";
  /* its name on the front of its base, in my book site's lettering (the owner's, Nov 17 17:41Z: "the angel machine now
     says angel machine in the font and lettering of the nous within kenoma site"): the site's terminal letters (VT323,
     css/app.css "NWK VT") in its burnt amber, glowing */
  mc.el.innerHTML =
    '<img alt="" draggable="false"><span class="l4-am-static" aria-hidden="true"></span><span class="l4-am-label">Angel Machine</span><div class="l4-am-orb" hidden><div class="l4-am-ball"></div><span class="gduck-name l4-am-who"></span></div>';
  mc.img = mc.el.querySelector("img");
  mc.fizz = mc.el.querySelector(".l4-am-static");
  mc.fizz.style.backgroundImage = `url(${staticTile()})`;
  mc.orb = mc.el.querySelector(".l4-am-orb");
  layer.append(mc.el);
  heard = { t: 0, out: 0 };
}
export function angelUnmount() {
  mc?.el.remove();
  mc = null;
}
/* a new state: the machine's sound as a weapon goes in (by anyone) */
export function angelSee(s) {
  const m = angelNow(s);
  if (m && m.t !== heard.t) {
    if (heard.t || clockNow() - m.t < 1000)
      play("angelWork", { x: ANGEL.X, y: ANGEL.Y });
    heard.t = m.t;
  }
}
/* every frame: the machine, its glow, its sparks, the orb */
export function angelDraw(ctx) {
  if (!mc) return;
  const Wd = ctx.world,
    sc = Wd.sc,
    s = ctx.state(),
    m = angelNow(s),
    now = clockNow(),
    working = !!m && !angelDone(m, now),
    p = Wd.toScreen(ANGEL.X, ANGEL.Y, ANGEL.Z),
    hide =
      !seenFrom(ANGEL.X, ANGEL.Y, Wd.inside) || // (only from inside its building: from outside, its roof stays)
      !Wd.onView(p.left - 80 * sc, p.top - 170 * sc, 160 * sc, 190 * sc);
  if (mc.el.hidden !== hide) mc.el.hidden = hide;
  /* the orb's sound, once, as it comes out (heard even off the screen) */
  if (m && angelDone(m, now) && heard.out !== m.t) {
    if (now - (m.t + ANGEL.WORK) < 2000)
      play("angelOrb", { x: ANGEL.X, y: ANGEL.Y });
    heard.out = m.t;
  }
  if (hide) return;
  const sig = String(working);
  if (sig !== mc.sig) {
    mc.sig = sig;
    mc.img.src = svgDataURL(angelMachineSVG({ working }));
    const m = `url("${mc.img.src}")`;
    mc.fizz.style.maskImage = mc.fizz.style.webkitMaskImage = m; // (the static only on the machine itself)
    mc.el.classList.toggle("working", working);
  }
  /* Downpour: see-through, as the walls are, while it hides my duck behind it (the owner's, Nov 17 12:29Z: "when it
     covers your duck"; 17:41Z: never for anyone else) */
  const key = Math.round(sortY(ANGEL.X, ANGEL.Y, ANGEL.Z)) + 10,
    thru =
      dp() &&
      Wd.hides(
        p.left - 60 * sc,
        p.top - 140 * sc,
        p.left + 60 * sc,
        p.top,
        key,
      );
  if (mc.thru !== thru) {
    mc.thru = thru;
    mc.el.classList.toggle("thru", thru);
  }
  const tr = `translate(${p.left.toFixed(1)}px, ${p.top.toFixed(1)}px)`;
  if (mc.tr !== tr) {
    mc.tr = tr;
    mc.el.style.transform = tr;
    mc.el.style.zIndex = key;
  }
  if (mc.k !== sc) {
    mc.k = sc;
    mc.el.style.setProperty("--k", sc.toFixed(3));
  }
  /* while it works: sparks out of its hatch, a few a frame */
  const t = performance.now();
  if (working && t - sparkAt > 60) {
    sparkAt = t;
    fxSparks(p.left, p.top, 70 * sc, 2);
  }
  /* done: the orb over it, its duck's name under it */
  const done = !!m && !working,
    osig = done ? m.w + m.by : "";
  if (osig !== mc.orbSig) {
    mc.orbSig = osig;
    mc.orb.hidden = !done;
    if (done) {
      const P = s.players[m.by] || {};
      mc.orb.querySelector(".l4-am-ball").innerHTML = angelOrbHTML(m.w);
      mc.orb.querySelector(".l4-am-who").innerHTML = nameHTML(
        P.name || "",
        P.nameStyle || {},
      );
    }
  }
}
/* E by the machine */
export function angelTarget(pos, s, near) {
  const d = Math.hypot(ANGEL.E[0] - pos.x, ANGEL.E[1] - pos.y);
  return d < near && pos.inside !== false ? { kind: "angel", d } : null;
}
export function angelLabel(s, me, held) {
  const m = angelNow(s),
    now = clockNow();
  if (m) {
    if (!angelDone(m, now))
      return `Working… ${Math.max(1, Math.ceil((m.t + ANGEL.WORK - now) / 1000))}`;
    return m.by === me
      ? `Take the Angelic ${weaponName(m.w)}`
      : `${(s.players[m.by] || {}).name || "Someone"}'s Angelic ${weaponName(m.w)}`;
  }
  if (!powerOn(s)) return "Angel machine · needs power";
  if (!held || !slotsOf(s, me).includes(held) || !canAngel(held, WEAPONS))
    return "Angel machine · guns and melee weapons";
  if (angelOf(s, me, held)) return `The ${weaponName(held)} is Angelic`;
  return `Make the ${weaponName(held)} Angelic · ${ANGEL.PRICE.toLocaleString("en-US")}`;
}
/* E: the weapon in hand goes in, or my orb comes out; a buzz and big words when it can't (say) */
export function angelTap(ctx, held, say) {
  const s = ctx.state(),
    me = ctx.me,
    m = angelNow(s),
    now = clockNow();
  if (m) {
    if (m.by !== me) return say("That orb isn't yours");
    if (!angelDone(m, now)) return;
    return ctx.send({ t: "hang", k: "l4", do: "angel", hand: held });
  }
  if (!powerOn(s)) return say("It needs power");
  if (!held || !canAngel(held, WEAPONS))
    return say("Only guns and melee weapons");
  if (angelOf(s, me, held)) return say("It's Angelic already");
  if (ptsOf(s, me) < ANGEL.PRICE) return say("Not enough points");
  ctx.send({ t: "hang", k: "l4", do: "angel", hand: held });
}
