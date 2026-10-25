/* ---------- the stage: a round platform 95 high in the great room, its stairs, a mic stand that does nothing ----------
   Seen in 3/4, a round stage is in front of a duck at one place and behind it at another, so one z-index can't be
   right for all of it. It is drawn (art.js' stage) in thin upright strips, each sorted by the stage's front edge at that
   strip: a duck behind that edge (on the floor) is covered by the strip, everything it wears and shows with it; a duck
   in front of the edge covers it, even jumping. A duck standing on the stage (or its stairs) is in front of all the
   strips (layout.js' sortY puts it there), and in front of or behind the mic by where it stands. The strips are narrow
   where the edge curves fast (equal angles round the circle), so the cut follows the rim closely.
   Getting up: walking, only by the stairs (steps of 12 at most); jumping, only when the jump is that high at that moment
   (world.js: a plain jump peaks at 86, short of the stage's 95; a long or double jump clears it).
   The world doesn't draw the stage, its stairs or the mic itself (their props are marked layer 'none' here). */
import { activity } from './registry.js';
import { PROPS, STAGE, sortY } from './layout.js';
import * as A from './art.js';

const OWN = ['stage', 'stagestairs', 'mic'];
for (const p of PROPS) if (OWN.includes(p.kind)) p.layer = 'none';   // (drawn here, in strips)

const { cx, cy, r, h: Z } = STAGE, N = 30, EXT = 14;   // strips; how far round a strip its key looks (half a duck's width)
const rimY = x => cy + Math.sqrt(Math.max(0, r * r - (x - cx) ** 2));   // the stage's front edge at x (on the floor)
/* the parts: { l, t, w, h } on the screen in world px (t already raised by its height), z-index key, html */
function parts() {
  const out = [], st = A.stage({ w: 2 * r, d: 2 * r, z: Z }), bh = 2 * r + Z, top = cy + r - bh;
  const img = svg => `<img src="${A.svgDataURL(svg)}" width="${2 * r}" height="${bh}" alt="" draggable="false">`, pic = img(st.back) + img(st.front);   // (pictures: one drawing, cheap to show 30 times)
  out.push({ l: cx - r, t: top, w: 2 * r, h: bh, key: cy - r, html: pic });   // the whole stage under the strips (no seams between them)
  for (let i = 0; i < N; i++) {
    const x0 = cx - r * Math.cos(Math.PI * i / N), x1 = cx - r * Math.cos(Math.PI * (i + 1) / N);
    const key = Math.floor(Math.min(rimY(Math.max(cx - r, x0 - EXT)), rimY(Math.min(cx + r, x1 + EXT))));
    out.push({ l: x0, t: top, w: x1 - x0, h: bh, key, cls: 'hang-strip',
      html: `<div class="hang-strip-in" style="width:${2 * r}px;transform:translateX(${(cx - r - x0).toFixed(2)}px)">${pic}</div>` });
  }
  const S = STAGE, sw = S.sx1 - S.sx0, sd = S.sy1 - S.sy0, stairs = A.stageStairs({ w: sw, d: sd, z: Z, steps: S.n });
  out.push({ l: S.sx0, t: S.sy1 - sd - Z, w: sw, h: sd + Z, key: cy + r, html: stairs.back });   // (the treads: under whoever is on them)
  out.push({ l: S.sx0, t: S.sy1 - sd - Z, w: sw, h: sd + Z, key: S.sy1, html: stairs.front });   // (the rail on its open side)
  const mx = cx, my = cy - 40, mw = 56, mh = 120;
  out.push({ l: mx - mw * .45, t: my - Z - (mh - 6), w: mw, h: mh, key: Math.round(sortY(mx, my, Z)), html: A.micStand({ w: mw, h: mh }) });
  return out;
}

let els = [];
activity({
  id: 'stage',
  mount(ctx) {
    A.useHangArtCSS();
    const box = ctx.world.board.querySelector('.hang-props');
    els = parts().map(p => {
      const e = document.createElement('div');
      e.className = 'hp hang-stage-part' + (p.cls ? ' ' + p.cls : '');
      Object.assign(e.style, { width: p.w + 'px', height: p.h + 'px', zIndex: p.key + 10 });
      e.innerHTML = p.html; e.hidden = true; box.append(e);
      return { ...p, e };
    });
  },
  unmount() { for (const p of els) p.e.remove(); els = []; },
  draw(now, ctx) {
    const W = ctx.world, sc = W.sc, scs = sc.toFixed(4), shown = W.inside, vw = W.vw, vh = W.vh;
    for (const p of els) {
      const a = W.toScreen(p.l, p.t), vis = shown && a.left < vw + 30 && a.left + p.w * sc > -30 && a.top < vh + 30 && a.top + p.h * sc > -30;
      if (p.e.hidden !== !vis) p.e.hidden = !vis;
      if (!vis) continue;
      const tr = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px) scale(${scs})`;
      if (p.e._tr !== tr) { p.e._tr = tr; p.e.style.transform = tr; }
    }
  },
});
