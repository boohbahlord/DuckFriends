/* The Night Show's room (also behind the title screen): the light-up Twister floor is the room's floor, and everything
   stands on it in the same perspective as its dots. On the back wall a window with a waxing crescent moon and a tree
   outside; on the floor a toy playground on each side wrapped in string lights, piles of wooden letter blocks by the
   window, and a track across the room where a glowing toy train full of ducks rolls by. Everything is lit from below by
   the floor, casts a soft shadow on it and shows a faint reflection in it.
   playroom() draws the pieces: the still part, the bulbs (four sets that light in turn, so the light runs along the
   strings), the blocks' letters (four colors that take turns, one set of blocks after another) and the train (its body,
   its wheels that turn and its puffs of smoke). art.js lays them out as pictures that only fade or move. */
import { duckSVG, mix } from './duck.js';

const rnd = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const PAL = ['#ef3b3b', '#2fa4ff', '#ffd23f', '#37d421', '#9b5de5', '#ff8c2b'];
const FLOOR = ['#ef3b3b', '#2fa4ff', '#ffd23f', '#37d421'];
const BULB = ['#ffe9a8', '#ff9de2', '#9be8ff', '#b8ff9c'];
const f = v => v.toFixed(1);
const pts = a => a.map(p => f(p[0]) + ' ' + f(p[1])).join('L');

export function playroom(w, h, dark) {
  const r = rnd(91), hz = h * .46, K = (h - hz) * 1.05, K2 = w * .16, cx = w / 2, S = Math.max(K2, K * .5);
  const fy = z => hz + K / z;                                                       // the floor at depth z
  const back = ([x, y], z, d) => [cx + (x - cx) * z / (z + d), hz + (y - hz) * z / (z + d)];   // the same point d deeper
  const defs = [];
  let gid = 0;
  const grad = (stops, x2 = 0, y2 = 1, kind = 'linear') => {
    const id = 'pg' + (++gid), st = stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
    defs.push(kind === 'radial' ? `<radialGradient id="${id}">${st}</radialGradient>` : `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${st}</linearGradient>`);
    return `url(#${id})`;
  };
  const poly = (p, fill, extra = '') => `<path d="M${pts(p)}Z" fill="${fill}"${extra}/>`;
  const amb = c => dark ? mix(c, 0, .22) : c;                                       // the room is dim
  const lit = (c, tint) => grad([[0, mix(amb(c), 255, .18)], [.55, amb(c)], [1, mix(amb(c), tint, dark ? .45 : .25)]]);   // lit from the floor below
  /* a box standing at depth z: its front from x0 to x1 and from y1 (bottom) up to y0, d deep. We see its front, the
     side facing the middle of the room, and its top when it is below our eyes (its underside when above) */
  const box = (x0, x1, y0, y1, z, d, c, tint = '#b48cff') => {
    const FL = [x0, y1], FR = [x1, y1], TL = [x0, y0], TR = [x1, y0], B = p => back(p, z, d);
    let s = '';
    if (x1 < cx) s += poly([FR, TR, B(TR), B(FR)], grad([[0, mix(amb(c), 0, .35)], [1, mix(amb(c), tint, .3)]]));
    else if (x0 > cx) s += poly([TL, FL, B(FL), B(TL)], grad([[0, mix(amb(c), 0, .35)], [1, mix(amb(c), tint, .3)]]));
    if (y0 > hz) s += poly([TL, TR, B(TR), B(TL)], mix(amb(c), 255, .28));
    else if (y1 < hz) s += poly([FL, FR, B(FR), B(FL)], mix(amb(c), tint, .5));
    return s + `<rect x="${f(x0)}" y="${f(y0)}" width="${f(x1 - x0)}" height="${f(y1 - y0)}" fill="${lit(c, tint)}"/>`;
  };
  /* a round post from y0 up to y1 at x, r thick */
  const post = (x, y0, y1, rr, c) => `<rect x="${f(x - rr)}" y="${f(y1)}" width="${f(rr * 2)}" height="${f(y0 - y1)}" rx="${f(rr * .4)}" fill="${grad([[0, mix(amb(c), 0, .4)], [.35, mix(amb(c), 255, .3)], [.6, amb(c)], [1, mix(amb(c), 0, .45)]], 1, 0)}"/>`;
  /* string lights: a thin wire along the points with bulbs every gap; the bulbs go in four sets */
  const bulbs = [[], [], [], []], wires = [];
  let bk = 0, bmin = h, bmax = 0;
  const lights = (p, gap, rr) => {
    wires.push(`<path d="M${pts(p)}" stroke="${dark ? '#2b2440' : '#6b6478'}" stroke-width="${f(Math.max(.8, rr * .35))}" fill="none" opacity=".8"/>`);
    for (let i = 1, acc = 0; i < p.length; i++) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], d = Math.hypot(x1 - x0, y1 - y0);
      for (; acc <= d; acc += gap) {
        const t = acc / d, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; bk = (bk + 1) % 4; bmin = Math.min(bmin, y - rr * 3); bmax = Math.max(bmax, y + rr * 3);
        bulbs[bk].push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr * 2.4)}" fill="${BULB[(bk + i) % 4]}" opacity=".25"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${BULB[(bk + i) % 4]}"/><circle cx="${f(x - rr * .3)}" cy="${f(y - rr * .3)}" r="${f(rr * .35)}" fill="#fff"/>`);
      }
      acc -= d;
    }
  };
  /* a soft shadow on the floor and a faint reflection in it, for anything standing on the floor at y */
  const shadow = (x0, x1, y, ry) => `<ellipse cx="${f((x0 + x1) / 2)}" cy="${f(y + ry * .2)}" rx="${f((x1 - x0) / 2 * 1.08)}" ry="${f(ry)}" fill="${grad([[0, '#000', dark ? .55 : .25], [1, '#000', 0]], 0, 0, 'radial')}"/>`;
  const fade = grad([[0, '#fff', 1], [1, '#fff', 0]]);
  const reflect = (svg, y, y0, x0, x1, k) => { const id = 'pgm' + (++gid); defs.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="${f(x0)}" y="${f(y)}" width="${f(x1 - x0)}" height="${f(y - y0)}"><rect x="${f(x0)}" y="${f(y)}" width="${f(x1 - x0)}" height="${f((y - y0) * .55)}" fill="${fade}"/></mask>`);
    return `<g mask="url(#${id})" opacity="${k}"><g transform="translate(0 ${f(y * 2)}) scale(1 -1)">${svg}</g></g>`; };

  defs.push(`<filter id="pgglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(Math.max(1.2, S * .004))}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  const out = [];
  /* ---------- the back wall: lit from below by the floor, a baseboard where it meets the floor ---------- */
  const rainbow = grad(FLOOR.concat(FLOOR, FLOOR).map((c, i, a) => [(i / (a.length - 1)).toFixed(3), c]), 1, 0);
  const upfade = 'pgup'; defs.push(`<linearGradient id="${upfade}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="pgupm" maskUnits="userSpaceOnUse" x="0" y="${f(hz * .55)}" width="${w}" height="${f(hz * .45)}"><rect x="0" y="${f(hz * .55)}" width="${w}" height="${f(hz * .45)}" fill="url(#${upfade})"/></mask>`);
  out.push(`<rect x="0" y="${f(hz * .55)}" width="${w}" height="${f(hz * .45)}" fill="${rainbow}" mask="url(#pgupm)" opacity="${dark ? .16 : .1}"/>`);
  const bb = Math.max(4, h * .014);
  out.push(`<rect x="0" y="${f(hz - bb)}" width="${w}" height="${f(bb)}" fill="${dark ? '#2a2150' : '#d9d3ef'}"/><rect x="0" y="${f(hz - bb)}" width="${w}" height="${f(Math.max(1, bb * .18))}" fill="${dark ? '#5a4c94' : '#fff'}" opacity=".7"/>`
    + `<rect x="0" y="${f(hz)}" width="${w}" height="${f(bb * 2.5)}" fill="${grad([[0, '#000', dark ? .45 : .12], [1, '#000', 0]])}"/>`);

  /* ---------- the window and the moon ---------- */
  const uw = hz - h * .2, ww = Math.min(uw * .78, w * .36), wh = uw * .7, wx = cx - ww / 2, wy = hz - uw * .14 - wh, ft = ww * .07;
  const mr = ww * .1, mx = wx + ww * .7, my = wy + wh * .3;
  let win = `<rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" fill="${grad(dark ? [[0, '#0a1238'], [1, '#2a2f6e']] : [[0, '#5b74c9'], [1, '#f0a7c8']])}"/>`;
  for (let i = 0; i < 14; i++) win += `<circle cx="${f(wx + r() * ww)}" cy="${f(wy + r() * wh * .75)}" r="${f(.6 + r() * 1.1)}" fill="#fff" opacity="${(.4 + r() * .5).toFixed(2)}"/>`;
  win += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(mr * 2.4)}" fill="${grad([[.3, '#fff3c4', .35], [1, '#fff3c4', 0]], 0, 0, 'radial')}"/><path d="M${f(mx)} ${f(my - mr)}A${f(mr)} ${f(mr)} 0 1 1 ${f(mx)} ${f(my + mr)}A${f(mr * .62)} ${f(mr)} 0 1 0 ${f(mx)} ${f(my - mr)}Z" fill="#fff3c4" transform="rotate(-18 ${f(mx)} ${f(my)})"/>`;
  const tx = wx + ww * .26, ty = wy + wh, tc = dark ? '#0a1420' : '#3b6b4a', tl = dark ? '#10241f' : '#5f9a5c';
  win += `<path d="M${f(tx - ww * .05)} ${f(ty)}C${f(tx - ww * .03)} ${f(ty - wh * .3)} ${f(tx - ww * .02)} ${f(ty - wh * .45)} ${f(tx + ww * .02)} ${f(ty - wh * .62)}L${f(tx + ww * .06)} ${f(ty - wh * .6)}C${f(tx + ww * .04)} ${f(ty - wh * .4)} ${f(tx + ww * .05)} ${f(ty - wh * .25)} ${f(tx + ww * .07)} ${f(ty)}Z" fill="${tc}"/>`
    + `<path d="M${f(tx)} ${f(ty - wh * .42)}L${f(tx + ww * .2)} ${f(ty - wh * .55)}M${f(tx)} ${f(ty - wh * .5)}L${f(tx - ww * .16)} ${f(ty - wh * .66)}" stroke="${tc}" stroke-width="${f(ww * .025)}" stroke-linecap="round"/>`;
  [[0, .7, .2], [-.15, .66, .14], [.17, .6, .15], [.06, .82, .15], [-.08, .86, .12], [.25, .74, .11], [-.2, .52, .11]].forEach(([dx, dy, rr]) => {
    win += `<circle cx="${f(tx + dx * ww)}" cy="${f(ty - dy * wh)}" r="${f(rr * ww)}" fill="${tl}"/><circle cx="${f(tx + dx * ww + rr * ww * .3)}" cy="${f(ty - dy * wh - rr * ww * .3)}" r="${f(rr * ww * .55)}" fill="${dark ? '#1d3d36' : '#7cb874'}" opacity=".7"/>`;
  });
  defs.push(`<clipPath id="pgwin"><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}"/></clipPath>`);
  const wood = dark ? '#8a5a35' : '#c98a4b';
  const windowSVG = `<rect x="${f(wx - ww * .5)}" y="${f(wy - wh * .35)}" width="${f(ww * 2)}" height="${f(wh * 1.7)}" fill="${grad([[0, '#9fb8ff', dark ? .16 : .1], [1, '#9fb8ff', 0]], 0, 0, 'radial')}"/>`
    + `<g clip-path="url(#pgwin)">${win}<rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(ft * .9)}" fill="#000" opacity=".25"/><rect x="${f(wx)}" y="${f(wy)}" width="${f(ft * .7)}" height="${f(wh)}" fill="#000" opacity=".2"/></g>`
    + `<g fill="none" stroke="${wood}" stroke-width="${f(ft)}"><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" rx="${f(ft * .4)}"/><path d="M${f(cx)} ${f(wy)}V${f(wy + wh)}M${f(wx)} ${f(wy + wh * .5)}H${f(wx + ww)}" stroke-width="${f(ft * .55)}"/></g>`
    + `<rect x="${f(wx - ft * .5)}" y="${f(wy - ft * .5)}" width="${f(ww + ft)}" height="${f(wh + ft)}" rx="${f(ft * .6)}" fill="none" stroke="${mix(wood, 255, .25)}" stroke-width="${f(Math.max(1, ft * .12))}" opacity=".6"/>`
    + `<rect x="${f(wx - ft * 1.3)}" y="${f(wy + wh + ft * .3)}" width="${f(ww + ft * 2.6)}" height="${f(ft * .9)}" rx="${f(ft * .3)}" fill="${grad([[0, mix(wood, 255, .3)], [1, wood]])}"/>`
    + `<rect x="${f(wx - ft * 1.3)}" y="${f(wy + wh + ft * 1.2)}" width="${f(ww + ft * 2.6)}" height="${f(ft * .8)}" fill="${grad([[0, '#000', .3], [1, '#000', 0]])}"/>`;
  out.push(windowSVG);
  /* the window's reflection in the shiny floor, and the moonlight falling on it */
  out.push(reflect(`<g clip-path="url(#pgwin)">${win}</g><g fill="none" stroke="${wood}" stroke-width="${f(ft)}"><rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}"/></g>`, hz, wy, wx - ft, wx + ww + ft, dark ? .22 : .12));

  /* ---------- the toy playgrounds, standing on the floor on each side ---------- */
  const zp = 5.2, side = (w - ww) / 2, compact = w < h || side < 400;
  const up = Math.min(S / zp, side / (compact ? 5.2 : 10.6)), yb = fy(zp), dzu = .45 * up * zp / S;
  const play = s => {
    const X = dx => s < 0 ? dx * up : w - dx * up, xs = (a, b) => [Math.min(X(a), X(b)), Math.max(X(a), X(b))], Y = dy => yb - dy * up;
    const [cPost, cDeck, cRoof, cRoof2, cTube, cSlide] = s < 0 ? [PAL[0], PAL[1], PAL[2], PAL[0], PAL[3], PAL[2]] : [PAL[1], PAL[4], PAL[3], PAL[1], PAL[4], PAL[0]];
    const tint = s < 0 ? '#ff9fd8' : '#9fd8ff';
    let g = '';
    const tower = (a, b, deck, top, roof, second) => {
      const D = 2.4 * dzu, pr = up * .13;
      const P2 = (dx, dy, d) => back([X(dx), Y(dy)], zp, d);
      /* the back posts, then the climbing wall, the deck, the front posts, the rails and net, the roof */
      for (const dx of [a + .25, b - .25]) { const [px, py0] = P2(dx, 0, D), [, py1] = P2(dx, top, D); g += post(px, py0, py1, pr * zp / (zp + D), mix(cPost, 0, .25)); }
      const [x0, x1] = xs(a + .25, b - .25), [dx0, dx1] = xs(a, b);
      g += box(x0, x1, Y(deck), Y(0), zp + D * .1, D * .08, cDeck, tint);
      for (let i = 0; i < 6; i++) { const hx = x0 + (x1 - x0) * (.12 + r() * .76), hy = Y(deck * (.1 + r() * .75)); g += `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(up * .13)}" ry="${f(up * .1)}" fill="${PAL[(i + (s > 0 ? 2 : 0)) % 6]}"/><ellipse cx="${f(hx - up * .03)}" cy="${f(hy - up * .03)}" rx="${f(up * .05)}" ry="${f(up * .035)}" fill="#fff" opacity=".5"/>`; }
      g += box(dx0 - up * .15, dx1 + up * .15, Y(deck + .32), Y(deck), zp, D, cDeck, tint);
      for (const dx of [a + .25, b - .25]) g += post(X(dx), Y(0), Y(top), pr, cPost);
      g += `<path d="M${f(x0)} ${f(Y(deck + .95))}H${f(x1)}M${f(x0)} ${f(Y(deck + 1.45))}H${f(x1)}" stroke="${amb(cPost)}" stroke-width="${f(up * .09)}" stroke-linecap="round"/>`;
      let net = ''; for (let i = 0; i <= 8; i++) { const xa = x0 + (x1 - x0) * i / 8; net += `M${f(xa)} ${f(Y(deck + .32))}L${f(Math.min(x1, xa + (x1 - x0) / 8))} ${f(Y(deck + .95))}M${f(xa)} ${f(Y(deck + .32))}L${f(Math.max(x0, xa - (x1 - x0) / 8))} ${f(Y(deck + .95))}`; }
      g += `<path d="${net}" stroke="${dark ? '#d8d0ff' : '#ffffff'}" stroke-width="${f(Math.max(.7, up * .025))}" opacity=".45"/>`;
      if (roof === 'peak') {
        const FL = [dx0 - up * .3, Y(top)], FR = [dx1 + up * .3, Y(top)], mid = (FL[0] + FR[0]) / 2, apex = back([mid, Y(top + 1.5)], zp, D / 2), B = p => back(p, zp, D);
        const inner = s < 0 ? [FR, B(FR), apex] : [FL, B(FL), apex];
        g += poly(inner, mix(amb(cRoof), 0, .3));
        const stripes = second ? 6 : 4, [c1, c2] = second ? [cTube, PAL[2]] : [cRoof, cRoof2];
        for (let i = 0; i < stripes; i++) { const p0 = [FL[0] + (FR[0] - FL[0]) * i / stripes, FL[1]], p1 = [FL[0] + (FR[0] - FL[0]) * (i + 1) / stripes, FL[1]]; g += poly([p0, p1, apex], i % 2 ? amb(c2) : amb(c1)); }
        if (second) g += `<path d="M${f(apex[0])} ${f(apex[1])}V${f(apex[1] - up * .8)}" stroke="${dark ? '#bbb' : '#777'}" stroke-width="${f(up * .05)}"/><path d="M${f(apex[0])} ${f(apex[1] - up * .8)}L${f(apex[0] - s * up * .55)} ${f(apex[1] - up * .62)}L${f(apex[0])} ${f(apex[1] - up * .45)}Z" fill="${amb(PAL[5])}"/>`;
        g += poly([FL, FR, apex], grad([[0, '#fff', .28], [1, '#fff', 0]]));
        g += `<circle cx="${f(apex[0])}" cy="${f(apex[1] - up * .12)}" r="${f(up * .14)}" fill="${amb(PAL[2])}"/>`;
        lights([FL, apex, FR], up * .3, up * .055);
        lights(s < 0 ? [FR, B(FR)] : [FL, B(FL)], up * .3, up * .05);
      } else {
        const ex = (dx0 + dx1) / 2, erx = (dx1 - dx0) / 2 + up * .25, ery = up * 1.35, rimY = Y(top);
        g += `<ellipse cx="${f(ex)}" cy="${f(rimY)}" rx="${f(erx)}" ry="${f(up * .12)}" fill="${mix(amb(cRoof), tint, .35)}"/>`;
        g += `<path d="M${f(ex - erx)} ${f(rimY)}A${f(erx)} ${f(ery)} 0 0 1 ${f(ex + erx)} ${f(rimY)}Z" fill="${grad([[0, mix(amb(cRoof), 255, .35)], [.6, amb(cRoof)], [1, mix(amb(cRoof), tint, .4)]], .3, 1)}"/>`;
        g += `<ellipse cx="${f(ex - erx * .35)}" cy="${f(rimY - ery * .6)}" rx="${f(erx * .25)}" ry="${f(ery * .14)}" fill="#fff" opacity=".35" transform="rotate(-25 ${f(ex - erx * .35)} ${f(rimY - ery * .6)})"/>`;
        g += `<path d="M${f(ex)} ${f(rimY - ery)}V${f(rimY - ery - up * .8)}" stroke="${dark ? '#bbb' : '#777'}" stroke-width="${f(up * .05)}"/><path d="M${f(ex)} ${f(rimY - ery - up * .8)}L${f(ex + s * -up * .55)} ${f(rimY - ery - up * .62)}L${f(ex)} ${f(rimY - ery - up * .45)}Z" fill="${amb(PAL[5])}"/>`;
        lights(Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (1 - i / 12); return [ex + Math.cos(t) * erx, rimY - Math.sin(t) * ery]; }), up * .3, up * .055);
      }
      lights([[dx0 - up * .15, Y(deck + .16)], [dx1 + up * .15, Y(deck + .16)]], up * .32, up * .05);
      for (const dx of [a + .25, b - .25]) lights(Array.from({ length: Math.round(top * 2.2) }, (_, i) => [X(dx) + (i % 2 ? pr : -pr), Y(i / 2.2)]), up * .28, up * .045);
      return [dx0, dx1];
    };
    /* the slide: its far rail, its bed and its near rail, from a deck down to the floor */
    const slide = (from, to, deck) => {
      const C = Array.from({ length: 11 }, (_, i) => { const t = i / 10, e = t < .85 ? (1 - Math.cos(Math.PI * t / .85)) / 2 : 1; return [X(from + (to - from) * t), Y(deck - (deck - .25) * e)]; });
      const z = zp + 1.2 * dzu, Bk = C.map(p => back(p, z, dzu * 1.1)), rail = up * .28, low = C.map(([x, y]) => [x, y + rail]);
      g += poly(Bk.concat(Bk.map(([x, y]) => [x, y - rail * .7]).reverse()), mix(amb(cSlide), 0, .3));
      g += poly(C.concat(Bk.slice().reverse()), grad([[0, mix(amb(cSlide), 255, .25)], [1, mix(amb(cSlide), tint, .35)]]));
      g += poly(C.map(([x, y]) => [x, y - rail * .3]).concat(low.slice().reverse()), lit(cSlide, tint));
      g += `<path d="M${pts(C.map(([x, y]) => [x, y - rail * .3]))}" stroke="#fff" stroke-width="${f(Math.max(1, up * .04))}" fill="none" opacity=".4"/>`;
      lights(C.map(([x, y]) => [x, y - rail * .5]), up * .32, up * .05);
      return [Math.min(C[0][0], C[10][0]), Math.max(C[0][0], C[10][0])];
    };
    const spans = [];
    spans.push(tower(.5, 3.3, 2.0, 4.0, 'peak'));
    if (compact) spans.push(slide(3.4, 5.2, 2.3));
    else {
      /* the tube across to the second tower, with round windows */
      const [a0, a1] = xs(3.2, 5.1), ty0 = Y(3.3), ty1 = Y(2.3);
      g += `<rect x="${f(a0)}" y="${f(ty0)}" width="${f(a1 - a0)}" height="${f(ty1 - ty0)}" fill="${grad([[0, mix(amb(cTube), 255, .35)], [.3, amb(cTube)], [1, mix(amb(cTube), tint, .4)]])}"/>`;
      for (const ex of [a0, a1]) g += `<ellipse cx="${f(ex)}" cy="${f((ty0 + ty1) / 2)}" rx="${f(up * .14)}" ry="${f((ty1 - ty0) / 2 + up * .06)}" fill="${mix(amb(cTube), 255, .2)}"/>`;
      for (let i = 0; i < 3; i++) { const ox = a0 + (a1 - a0) * (.2 + i * .3), oy = (ty0 + ty1) / 2, orr = (ty1 - ty0) * .3; g += `<ellipse cx="${f(ox)}" cy="${f(oy)}" rx="${f(orr * .85)}" ry="${f(orr)}" fill="${dark ? '#100c24' : '#fff'}" opacity=".75" stroke="${mix(amb(cTube), 255, .3)}" stroke-width="${f(orr * .25)}"/>`; }
      lights([[a0, ty0 + up * .05], [a1, ty0 + up * .05]], up * .3, up * .05);
      spans.push(tower(5.0, 7.4, 2.0, 3.7, 'peak', true));
      spans.push(slide(7.5, 10.3, 2.3));
    }
    const x0 = Math.min(...spans.flat()), x1 = Math.max(...spans.flat());
    return { svg: g, x0, x1 };
  };
  const L = play(-1), R = play(1);
  out.push(shadow(L.x0, L.x1, yb, up * .5) + shadow(R.x0, R.x1, yb, up * .5));
  out.push(reflect(L.svg + R.svg, yb, yb - up * 5.5, 0, w, dark ? .2 : .1));
  out.push(`<ellipse cx="${f((L.x0 + L.x1) / 2)}" cy="${f(yb)}" rx="${f((L.x1 - L.x0) * .6)}" ry="${f(up * .9)}" fill="${grad([[0, '#ff7fd0', dark ? .2 : .08], [1, '#ff7fd0', 0]], 0, 0, 'radial')}"/><ellipse cx="${f((R.x0 + R.x1) / 2)}" cy="${f(yb)}" rx="${f((R.x1 - R.x0) * .6)}" ry="${f(up * .9)}" fill="${grad([[0, '#7fc8ff', dark ? .2 : .08], [1, '#7fc8ff', 0]], 0, 0, 'radial')}"/>`);
  out.push(L.svg + R.svg);

  /* ---------- the letter blocks: a pile on each side of the window, nearer than the playgrounds ---------- */
  const zb = 4.2, ybk = fy(zb), b = Math.min(S / zb * .9, (side - ft * 2 - 8) / 4.5), dzb = .45 * b * zb / S;
  const woodC = dark ? ['#a8743f', '#c99257', '#7a5129', '#8d6034'] : ['#e0a865', '#f2c58a', '#b77d42', '#c98d52'];
  const letters = [[], [], [], []].map(() => [[], [], [], []]);
  let blocks = '', col = 0, lmin = h, lmax = 0, pileBoxes = [];
  const piles = [{ x1: wx - ft * 1.6 - b * .3, rows: ['DUCK', 'FUN', 'GO'], s: -1 }, { x0: wx + ww + ft * 1.6 + b * .3, rows: ['ABC', 'XY', 'Z'], s: 1 }];
  piles.forEach(pl => {
    const n0 = pl.rows[0].length, left = pl.x0 !== undefined ? pl.x0 : pl.x1 - n0 * b;
    let pile = '';
    pl.rows.forEach((word, row) => {
      const n = word.length, start = left + (n0 - n) * b / 2;
      const order = [...word].map((ch, i) => i); if (start + n * b / 2 > cx) order.reverse();   // draw toward the middle last
      order.forEach(i => {
        const ch = word[i], x = start + i * b + (r() - .5) * b * .06, y = ybk - (row + 1) * b, top = row === pl.rows.length - 1;
        const FL = [x, y + b], FR = [x + b, y + b], TL = [x, y], TR = [x + b, y], B = p => back(p, zb, dzb);
        const sideF = x + b < cx ? [FR, TR, B(TR), B(FR)] : x > cx ? [TL, FL, B(FL), B(TL)] : null;
        pile += (sideF ? poly(sideF, woodC[2]) : '') + poly([TL, TR, B(TR), B(TL)], woodC[1])
          + `<rect x="${f(x)}" y="${f(y)}" width="${f(b)}" height="${f(b)}" fill="${grad([[0, mix(woodC[0], 255, .12)], [.6, woodC[0]], [1, mix(woodC[0], '#b48cff', dark ? .3 : .15)]])}"/>`
          + `<path d="M${f(x + b * .1)} ${f(y + b * .3)}h${f(b * .8)}M${f(x + b * .05)} ${f(y + b * .72)}h${f(b * .7)}M${f(x + b * .2)} ${f(y + b * .5)}h${f(b * .55)}" stroke="${woodC[3]}" stroke-width="${f(b * .025)}" opacity=".55"/>`
          + `<rect x="${f(x + b * .02)}" y="${f(y + b * .02)}" width="${f(b * .96)}" height="${f(b * .96)}" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="${f(b * .04)}"/>`
          + `<text x="${f(x + b / 2 + b * .03)}" y="${f(y + b * .79)}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${f(b * .66)}" text-anchor="middle" fill="#000" opacity=".3">${ch}</text>`;
        const g = (col + row) % 4, c0 = (col * 5 + row * 2) % 6;
        lmin = Math.min(lmin, B(TL)[1] - 2); lmax = Math.max(lmax, y + b + 2);
        for (let p = 0; p < 4; p++) {
          const c = PAL[(c0 + p) % 6];
          let L2 = `<rect x="${f(x + b * .08)}" y="${f(y + b * .08)}" width="${f(b * .84)}" height="${f(b * .84)}" rx="${f(b * .06)}" fill="none" stroke="${c}" stroke-width="${f(b * .07)}"/><text x="${f(x + b / 2)}" y="${f(y + b * .76)}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${f(b * .66)}" text-anchor="middle" fill="${c}">${ch}</text>`;
          if (top) {   // the top of the top block shows a letter too, lying flat
            const BL = B(TL), BR = B(TR), m = [BR[0] - BL[0], BR[1] - BL[1], TL[0] - BL[0], TL[1] - BL[1], BL[0], BL[1]].map(v => v.toFixed(2)).join(' ');
            L2 += `<g transform="matrix(${m})"><text x=".5" y=".78" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size=".7" text-anchor="middle" fill="${PAL[(c0 + p + 2) % 6]}">${'QWERTYUIOPLKJHGFDSAZXCVBNM'[(col * 7) % 26]}</text></g>`;
          }
          letters[g][p].push(L2);
        }
        col++;
      });
    });
    const px0 = left - b * .1, px1 = left + n0 * b + b * .4;
    pileBoxes.push([px0, px1]);
    blocks += shadow(px0, px1, ybk, b * .35) + reflect(pile, ybk, ybk - b * 3.2, px0 - b, px1 + b, dark ? .25 : .12) + pile;
  });
  out.push(blocks);

  /* ---------- the train track across the floor ---------- */
  const zt = 3.1, ut = Math.min(S / zt, w / 11), ry = fy(zt), dzt = .5;
  const ryb = back([0, ry], zt, dzt)[1];
  let track = '';
  for (let x = -ut; x < w + ut; x += ut * .55) {
    const a = [x - ut * .09, ry + ut * .06], b2 = [x + ut * .09, ry + ut * .06], A = back(a, zt, dzt + .15), B2 = back(b2, zt, dzt + .15);
    track += poly([a, b2, B2, A], dark ? '#4a3524' : '#a9825c');
  }
  const rail = yy => `<rect x="0" y="${f(yy - ut * .035)}" width="${w}" height="${f(ut * .07)}" fill="${grad([[0, '#e8ecff'], [.5, dark ? '#7d84a8' : '#9aa0b8'], [1, '#3a3f5a']])}"/>`;
  track = `<rect x="0" y="${f(ryb - ut * .1)}" width="${w}" height="${f(ry - ryb + ut * .25)}" fill="#000" opacity="${dark ? .25 : .08}"/>` + track + rail(ryb) + rail(ry);
  out.push(track);

  return {
    defs: defs.join(''), still: out.join('') + wires.join(''), stillTop: Math.min(h * .12, bmin), stillBottom: ry + ut * .4,
    bulbs, bulbTop: bmin, bulbBottom: bmax, letters, letterTop: lmin, letterBottom: lmax,
    train: trainParts(ut, ry, w, dark)
  };
}

/* the toy train: an engine with a duck driving and three open cars full of ducks, facing right. Drawn in its own frame:
   the rail is at y = 2.6 units. The wheels and the smoke are separate small pictures that turn and rise. */
function trainParts(ut, ry, w, dark) {
  const U = v => v * ut, Ry = U(2.6), defs = [];
  let gid = 0;
  const grad = (stops, x2 = 0, y2 = 1, kind = 'linear') => {
    const id = 'tr' + (++gid), st = stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
    defs.push(kind === 'radial' ? `<radialGradient id="${id}">${st}</radialGradient>` : `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${st}</linearGradient>`);
    return `url(#${id})`;
  };
  const amb = c => dark ? mix(c, 0, .12) : c, glossy = c => grad([[0, mix(amb(c), 255, .35)], [.25, amb(c)], [.8, amb(c)], [1, mix(amb(c), '#b48cff', .35)]]);
  const rect = (x, y, wd, ht, fill, rx = 0, extra = '') => `<rect x="${f(U(x))}" y="${f(Ry - U(y))}" width="${f(U(wd))}" height="${f(U(ht))}" rx="${f(U(rx))}" fill="${fill}"${extra}/>`;
  const topFace = (x, y, wd, c) => `<path d="M${f(U(x))} ${f(Ry - U(y))}L${f(U(x + .08))} ${f(Ry - U(y + .16))}L${f(U(x + wd - .08))} ${f(Ry - U(y + .16))}L${f(U(x + wd))} ${f(Ry - U(y))}Z" fill="${mix(amb(c), 255, .3)}"/>`;
  const bulbsOn = (x0, x1, y, n) => Array.from({ length: n }, (_, i) => { const x = U(x0 + (x1 - x0) * (i + .5) / n), c = ['#ffe9a8', '#ff9de2', '#9be8ff', '#b8ff9c'][i % 4]; return `<circle cx="${f(x)}" cy="${f(Ry - U(y))}" r="${f(U(.09))}" fill="${c}" opacity=".3"/><circle cx="${f(x)}" cy="${f(Ry - U(y))}" r="${f(U(.045))}" fill="${c}"/>`; }).join('');
  const duck = (color, x, y, size) => duckSVG({ color }, { size: U(size), shadow: false }).replace('<svg class="duck"', `<svg x="${f(U(x))}" y="${f(Ry - U(y))}"`);
  const cars = [['#ffd23f', ['#2fa4ff', '#ff8fc8']], ['#37d421', ['#ffd23f', '#9b5de5']], ['#9b5de5', ['#ff8c2b', '#37d421']]];
  let body = '', under = '', x = .2;
  const wheels = [];
  cars.forEach(([c, ducks], k) => {
    /* an open car: the inside, two ducks, then the near wall with its rim, panels, rivets and lights */
    body += rect(x + .1, 1.22, 2.2, .2, mix(amb(c), 0, .6));
    ducks.forEach((dc, i) => { body += duck(dc, x + .02 + i * .95, 2.12, 1.4); });
    body += rect(x + .1, 1.05, 2.2, .65, glossy(c), .06) + rect(x + .04, 1.12, 2.32, .12, mix(amb(c), 255, .25), .05) + topFace(x + .04, 1.12, 2.32, c);
    for (let i = 0; i < 3; i++) body += rect(x + .25 + i * .72, .95, .55, .45, 'none', .05, ` stroke="${mix(amb(c), 0, .3)}" stroke-width="${f(U(.03))}"`);
    body += rect(x + .1, .42, 2.2, .1, dark ? '#1b1830' : '#3a3550') + bulbsOn(x + .15, x + 2.25, 1.06, 9);
    under += `<ellipse cx="${f(U(x + 1.2))}" cy="${f(Ry + U(.05))}" rx="${f(U(1.6))}" ry="${f(U(.35))}" fill="${grad([[0, c, dark ? .45 : .2], [1, c, 0]], 0, 0, 'radial')}"/>`;
    wheels.push([x + .55, .22], [x + 1.85, .22]);
    if (k) body += rect(x - .2, .55, .35, .08, '#333');
    x += 2.55;
  });
  body += rect(x - .2, .55, .35, .08, '#333');
  /* the engine */
  const e = x, red = '#ef3b3b', blue = '#2fa4ff', gold = '#ffd23f';
  body += rect(e + .05, .55, 3.15, .18, dark ? '#24203a' : '#3a3550', .04) + rect(e + .05, .5, 3.15, .04, gold);
  body += rect(e + .1, 1.7, 1.05, 1.15, glossy(blue), .06);
  body += rect(e + .28, 1.5, .7, .5, grad([[0, '#fff6c8'], [1, '#ffcf6b']]), .08);
  body += `<g clip-path="url(#trcab)">${duck('#ffd23f', e + .2, 1.62, 1.0)}</g>`;
  defs.push(`<clipPath id="trcab"><rect x="${f(U(e + .28))}" y="${f(Ry - U(1.5))}" width="${f(U(.7))}" height="${f(U(.5))}" rx="${f(U(.08))}"/></clipPath>`);
  body += rect(e + .28, 1.5, .7, .5, 'none', .08, ` stroke="${mix(amb(blue), 0, .35)}" stroke-width="${f(U(.05))}"`);
  body += rect(e, 1.85, 1.25, .17, glossy(red), .05) + topFace(e, 1.85, 1.25, red) + bulbsOn(e + .05, e + 1.2, 1.76, 6);
  body += rect(e + 1.15, 1.3, 1.85, .75, grad([[0, mix(amb(red), 255, .4)], [.3, amb(red)], [.85, mix(amb(red), 0, .2)], [1, mix(amb(red), '#b48cff', .3)]]), .3);
  for (const bx of [1.5, 2.1, 2.7]) body += rect(e + bx, 1.3, .07, .75, gold);
  body += `<ellipse cx="${f(U(e + 3.0))}" cy="${f(Ry - U(.92))}" rx="${f(U(.12))}" ry="${f(U(.37))}" fill="${mix(amb(red), 0, .4)}"/>`;
  body += `<path d="M${f(U(e + 2.5))} ${f(Ry - U(1.3))}L${f(U(e + 2.45))} ${f(Ry - U(1.85))}L${f(U(e + 2.85))} ${f(Ry - U(1.85))}L${f(U(e + 2.8))} ${f(Ry - U(1.3))}Z" fill="${dark ? '#2a2640' : '#3a3550'}"/>` + rect(e + 2.4, 1.92, .5, .1, gold, .04);
  body += `<ellipse cx="${f(U(e + 1.95))}" cy="${f(Ry - U(1.3))}" rx="${f(U(.22))}" ry="${f(U(.2))}" fill="${gold}"/><ellipse cx="${f(U(e + 1.9))}" cy="${f(Ry - U(1.4))}" rx="${f(U(.07))}" ry="${f(U(.05))}" fill="#fff" opacity=".6"/>`;
  body += `<path d="M${f(U(e + 3.05))} ${f(Ry - U(.55))}L${f(U(e + 3.5))} ${f(Ry - U(.02))}L${f(U(e + 3.05))} ${f(Ry - U(.02))}Z" fill="${amb(gold)}"/><path d="M${f(U(e + 3.15))} ${f(Ry - U(.4))}V${f(Ry - U(.05))}M${f(U(e + 3.28))} ${f(Ry - U(.26))}V${f(Ry - U(.05))}" stroke="${mix(gold, 0, .4)}" stroke-width="${f(U(.03))}"/>`;
  /* the headlight and its beam */
  const hx = U(e + 3.08), hy = Ry - U(1.42);
  const beam = `<path d="M${f(hx)} ${f(hy - U(.08))}L${f(hx + U(3))} ${f(hy - U(.5))}L${f(hx + U(3))} ${f(Ry + U(.2))}L${f(hx)} ${f(hy + U(.08))}Z" fill="${grad([[0, '#fff3c4', dark ? .35 : .15], [1, '#fff3c4', 0]], 1, 0)}"/><ellipse cx="${f(hx + U(1.9))}" cy="${f(Ry + U(.08))}" rx="${f(U(1.3))}" ry="${f(U(.22))}" fill="${grad([[0, '#fff3c4', dark ? .3 : .12], [1, '#fff3c4', 0]], 0, 0, 'radial')}"/>`;
  body += rect(e + 2.95, 1.55, .22, .25, gold, .04) + `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(U(.16))}" fill="#fff3c4" opacity=".35"/><circle cx="${f(hx)}" cy="${f(hy)}" r="${f(U(.085))}" fill="#fffbe6"/>`;
  under += `<ellipse cx="${f(U(e + 1.7))}" cy="${f(Ry + U(.05))}" rx="${f(U(2))}" ry="${f(U(.38))}" fill="${grad([[0, red, dark ? .45 : .2], [1, red, 0]], 0, 0, 'radial')}"/>`;
  wheels.push([e + .55, .25], [e + 1.5, .36], [e + 2.35, .36]);
  body += `<path d="M${f(U(e + 1.5))} ${f(Ry - U(.36))}H${f(U(e + 2.35))}" stroke="${gold}" stroke-width="${f(U(.06))}" stroke-linecap="round"/>`;
  const len = e + 3.5, W = U(len + 3.2), H = U(3.8);
  const glow = dark ? ` filter="url(#trglow)"` : '';
  defs.push(`<filter id="trglow" x="-5%" y="-10%" width="110%" height="120%"><feGaussianBlur stdDeviation="${f(U(.05))}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  defs.push(`<linearGradient id="trfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="trm" maskUnits="userSpaceOnUse" x="0" y="${f(Ry)}" width="${f(W)}" height="${f(U(1.2))}"><rect x="0" y="${f(Ry)}" width="${f(W)}" height="${f(U(1.2))}" fill="url(#trfade)"/></mask>`);
  const reflection = `<g mask="url(#trm)" opacity="${dark ? .22 : .1}"><g transform="translate(0 ${f(Ry * 2 + U(.1))}) scale(1 -1)">${body}</g></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}" height="${f(H)}"><defs>${defs.join('')}</defs>`
    + `<ellipse cx="${f(U(len / 2))}" cy="${f(Ry + U(.04))}" rx="${f(U(len / 2 + .2))}" ry="${f(U(.12))}" fill="#000" opacity="${dark ? .5 : .25}"/>${under}${beam}${reflection}<g${glow}>${body}</g></svg>`;
  const wheel = (rr, c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 2 2"><circle r=".96" fill="#1b1a26"/><circle r=".8" fill="${amb(c)}"/>${[0, 60, 120].map(a => `<path d="M-.78 0H.78" stroke="${mix(c, 0, .45)}" stroke-width=".14" transform="rotate(${a})"/>`).join('')}<circle r=".22" fill="${mix(c, 255, .4)}"/><circle cx=".45" cy="-.45" r=".12" fill="#fff" opacity=".7"/></svg>`;
  return { svg, W, H, top: ry - Ry, ut, wheels: wheels.map(([wx, rr]) => ({ x: U(wx), y: Ry - U(rr), r: U(rr), svg: wheel(rr, rr > .3 ? '#ef3b3b' : '#ffd23f') })), smoke: { x: U(e + 2.65), y: Ry - U(1.95) } };
}
