/* ---------- Duck Cabin's props, drawn: placeholders until art.js's drawings take their places ----------
   DRAW[kind](prop) → an SVG string the size of the prop's box (prop.box: w × h world px, viewBox "0 0 w h"). In a box
   with no box of its own, the prop's top is the band 0 … d and its front face d … d + h. Night colors: lit warm where
   a light falls, dark blue-green elsewhere; simple shapes with dark outlines. Parts that glow carry class "lit" (a lamp
   switched off dims them: .hp.off .lit) and flames class "flick" (they flicker). To use a new drawing for a kind, put it
   in DRAW (world.js draws whatever DRAW says, when the prop first comes into view). */
const INK = '#1c1c28';
const svg = (p, body) => `<svg viewBox="0 0 ${p.box.w.toFixed(1)} ${p.box.h.toFixed(1)}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`;
const r = (x, y, w, h, fill, o = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${o}/>`;
const ol = (sw = 3) => `stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"`;
/* a box: its top face (0 … d) and its front face (d … d + h) */
const box = (p, top, front, sw = 3, extra = '') => r(1.5, 1.5, p.w - 3, p.d - 1.5, top, ol(sw)) + (p.h > 0 ? r(1.5, p.d, p.w - 3, p.h - 1.5, front, ol(sw)) : '') + extra;
const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0) % 1000 / 1000; };
/* round orange-brown logs stacked on a face: x, y, w, h */
const logs = (x, y, w, h, c = '#a65a26', line = '#6e3a17') => r(x, y, w, h, c) + Array.from({ length: Math.floor(h / 22) }, (_, i) => `<path d="M${x} ${y + 22 * (i + 1)}H${x + w}" stroke="${line}" stroke-width="2.5" opacity=".8"/>`).join('');
const glowDot = (x, y, rr, c = '#ffcf70') => `<circle class="lit" cx="${x}" cy="${y}" r="${rr * 2.2}" fill="${c}" opacity=".25"/><circle class="lit" cx="${x}" cy="${y}" r="${rr}" fill="${c}" stroke="${INK}" stroke-width="1.5"/>`;

export const DRAW = {
  wall(p) {
    const out = p.side === 's', face = p.only === 'in' || p.side === 'n' ? '#8a5530' : '#a65a26';
    let b = r(1.5, 1.5, p.w - 3, p.d, '#4a2e1a', ol()) + logs(1.5, p.d, p.w - 3, p.h - 1.5, face) + r(1.5, p.d, p.w - 3, p.h - 1.5, 'none', ol());
    if (out) {
      for (const wx of p.windows || []) { const x = wx - p.x - 70; b += r(x, p.d + 34, 140, 92, '#ffc45e', `class="lit" ${ol(4)}`) + `<path d="M${x + 70} ${p.d + 34}v92M${x} ${p.d + 80}h140" stroke="${INK}" stroke-width="4"/>`; }
      for (let x = 40; x < p.w - 20; x += 64) b += glowDot(x, p.d + 14 + (Math.round(x / 64) % 2) * 6, 5, ['#ffcf70', '#ff9a4a', '#fff0b0'][Math.round(x / 64) % 3]);   // the string lights
    }
    return svg(p, b);
  },
  stub: p => svg(p, r(1.5, 1.5, p.w - 3, p.d + p.h - 3, '#5b3a22', ol(2))),
  doorway: p => svg(p, r(1.5, 1.5, p.w - 3, p.d, '#4a2e1a', ol()) + logs(1.5, p.d, p.w - 3, 40) + r(14, p.d + 40, p.w - 28, p.h - 41, '#ffb24a', `class="lit" ${ol()}`) + `<path d="M14 ${p.d + p.h - 1}V${p.d + 40}H${p.w - 14}V${p.d + p.h - 1}" fill="none" ${ol(5)}/>`),
  roof(p) {
    const w = p.box.w, h = p.box.h, m = w / 2, top = 260, lo = 260;   // (C.rise: the ridge runs north–south down the middle)
    const shingles = (x0, x1) => { let s = ''; for (let x = x0 + 50; x < x1; x += 50) { const k = (x - x0) / (x1 - x0), y0 = x0 ? k * top : top - k * top, y1 = h - (x0 ? lo - k * lo : k * lo); s += `<path d="M${x} ${y0.toFixed(1)}V${y1.toFixed(1)}" stroke="#16301f" stroke-width="3" opacity=".7"/>`; } return s; };
    const gable = `<path d="M40 ${h - 40}L${m} ${h - 300}L${w - 40} ${h - 40}Z" fill="#a65a26" ${ol()}/>` + `<path d="M${m - 150} ${h - 60}L${m} ${h - 250}L${m + 150} ${h - 60}Z" class="lit" fill="#ffc45e" ${ol(4)}/><path d="M${m} ${h - 250}V${h - 60}M${m - 100} ${h - 110}H${m + 100}" stroke="${INK}" stroke-width="4"/>`;
    const west = `<path d="M2 ${top}L${m} 2V${h - lo}L2 ${h - 2}Z" fill="#22402c" ${ol()}/>`, east = `<path d="M${m} 2L${w - 2} ${top}V${h - 2}L${m} ${h - lo}Z" fill="#2c5238" ${ol()}/>`;
    const chim = `<rect x="1000" y="10" width="90" height="190" fill="#6b6f7a" ${ol()}/><path d="M1000 60h90M1000 110h90M1000 160h90M1045 10v50M1025 60v50M1065 110v50" stroke="#4d5059" stroke-width="3"/>`;
    return svg(p, gable + west + shingles(0, m) + east + shingles(m, w) + `<path d="M${m} 2V${h - lo}" stroke="#16301f" stroke-width="8"/>` + chim);
  },
  fireplace: p => svg(p, box(p, '#5d6170', '#6b6f7a') + r(p.w / 2 - 70, p.d + 60, 140, p.h - 62, '#2a1a12', ol()) + `<g class="flick"><path d="M${p.w / 2 - 50} ${p.d + p.h - 4}q20-70 50-90q-5 40 20 50q10-30 30-35q0 50-10 75z" fill="#ff8a2a" class="lit"/><path d="M${p.w / 2 - 20} ${p.d + p.h - 4}q15-40 25-50q5 30 20 50z" fill="#ffd23f" class="lit"/></g>`),
  rug: p => svg(p, r(4, 4, p.w - 8, p.d - 8, p.id === 'rug1' ? '#6b2632' : '#2f3f6b', `rx="24" ${ol()}`) + r(28, 28, p.w - 56, p.d - 56, 'none', `rx="14" stroke="#e8c27a" stroke-width="4" opacity=".55"`)),
  couch(p) {
    const n = p.seats || 3, cw = (p.w - 40) / n;
    return svg(p, box(p, '#2f5d84', '#26496a') + Array.from({ length: n }, (_, i) => r(20 + i * cw + 4, 14, cw - 8, p.d - 30, '#3a72a0', `rx="10" ${ol(2)}`)).join('') + r(1.5, p.d - 18, p.w - 3, 18, '#21405e', ol(2)));
  },
  lamp: p => svg(p, `<path d="M${p.w / 2} ${p.d + p.h - 4}V30" stroke="${INK}" stroke-width="5"/><ellipse cx="${p.w / 2}" cy="${p.d + p.h - 4}" rx="${p.w / 2 - 2}" ry="7" fill="#3a2a1e" ${ol(2)}/><path d="M4 40L${p.w - 4} 40L${p.w - 12} 4L12 4Z" class="lit" fill="#ffd27a" ${ol(2.5)}/>`),
  pianokeys(p) {
    const n = 28, kw = p.w / n; let s = r(1.5, 1.5, p.w - 3, p.d - 3, '#f2efe6', ol());
    for (let i = 1; i < n; i++) s += `<path d="M${(i * kw).toFixed(1)} 2V${p.d - 2}" stroke="${INK}" stroke-width="2"/>`;
    for (let i = 0; i < n - 1; i++) if (![2, 6].includes(i % 7)) s += r(((i + 1) * kw - kw * .3).toFixed(1), 2, (kw * .6).toFixed(1), p.d * .58, '#22222c');
    return svg(p, s);
  },
  piano: p => svg(p, box(p, '#2a2026', '#1e171b') + r(20, p.d + 18, p.w - 40, 10, '#f2efe6', ol(1.5))),
  sheet: p => svg(p, r(p.w / 2 - 4, 30, 8, p.d + p.h - 32, '#3a2a1e', ol(2)) + r(6, 6, p.w - 12, p.h * .7, '#f4efe2', ol(2.5)) + Array.from({ length: 6 }, (_, i) => `<path d="M14 ${30 + i * 30}h${p.w - 28}M14 ${36 + i * 30}h${p.w - 28}M14 ${42 + i * 30}h${p.w - 28}" stroke="#8a8fa3" stroke-width="1.2"/>`).join('')),
  stage(p) {
    const R = p.w / 2, h = p.h;
    return svg(p, `<path d="M1.5 ${R}A${R - 1.5} ${R - 1.5} 0 0 0 ${p.w - 1.5} ${R}V${R + h}A${R - 1.5} ${R - 1.5} 0 0 1 1.5 ${R + h}Z" fill="#5e3a1f" ${ol()}/>`
      + Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (i + 1) / 10, x = R - Math.cos(a) * (R - 2), y = R + Math.sin(a) * (R - 2); return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}v${h}" stroke="#3e2512" stroke-width="3"/>`; }).join('')
      + `<circle cx="${R}" cy="${R}" r="${R - 1.5}" fill="#9a6a3c" ${ol()}/>` + Array.from({ length: 7 }, (_, i) => `<path d="M${20 + i * 66} ${R - Math.sqrt(Math.max(0, R * R - (20 + i * 66 - R) ** 2)) + 8}V${R + Math.sqrt(Math.max(0, R * R - (20 + i * 66 - R) ** 2)) - 8}" stroke="#7a5230" stroke-width="2.5"/>`).join('')
      + `<circle cx="${R}" cy="${R}" r="${R - 14}" fill="none" stroke="#c48a52" stroke-width="3" opacity=".6"/>`);
  },
  stagestairs(p) {   // down toward the front: step k's top at height h(1 − k/n), its riser in front of it
    const n = 8, dd = p.d / n; let s = '';
    for (let k = 0; k < n; k++) { const hk = p.h * (1 - k / n), y = k * dd + p.h - hk; s += r(1.5, y.toFixed(1), p.w - 3, dd.toFixed(1), '#9a6a3c', ol(2)) + r(1.5, (y + dd).toFixed(1), p.w - 3, hk.toFixed(1), '#5e3a1f', ol(2)); }
    return svg(p, s);
  },
  mic: p => svg(p, `<path d="M${p.w / 2} ${p.d + p.h - 4}V24M${p.w / 2} 24l10-14" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><ellipse cx="${p.w / 2}" cy="${p.d + p.h - 4}" rx="16" ry="5" fill="#2a2a33" ${ol(2)}/><rect x="${p.w / 2 + 4}" y="2" width="12" height="18" rx="6" fill="#4a4d5a" ${ol(2)}/>`),
  chalkfloor: p => svg(p, r(3, 3, p.w - 6, p.d - 6, '#23302a', `rx="8" stroke="#8a5530" stroke-width="10"`) + r(3, 3, p.w - 6, p.d - 6, 'none', `rx="8" ${ol()}`)),
  chalk: p => svg(p, r(2, 2, p.w - 4, p.d - 4, '#6e4a2a', `rx="6" ${ol(2)}`) + r(14, p.d / 2 - 5, p.w - 28, 10, '#f4f4f0', `rx="4" ${ol(1.5)}`)),
  eraser: p => svg(p, r(3, 3, p.w - 6, p.d - 6, '#c9b48a', `rx="8" ${ol(2)}`) + r(10, p.d - 26, p.w - 20, 16, '#3d3d48', `rx="4"`)),
  book: p => svg(p, `<path d="M8 ${p.d + p.h - 2}L${p.w / 2} ${p.d}L${p.w - 8} ${p.d + p.h - 2}" fill="none" ${ol(3)}/>` + `<path d="M2 ${p.d + 6}L${p.w / 2} 0L${p.w - 2} ${p.d + 6}L${p.w / 2} ${p.d + 16}Z" fill="#f4efe2" ${ol(2)}/><path d="M${p.w / 2} 0V${p.d + 16}" stroke="#7a2a35" stroke-width="3"/>`),
  counter: p => svg(p, box(p, '#cfc4b0', '#7a4a2a') + Array.from({ length: Math.floor(p.w / 60) }, (_, i) => r(10 + i * 60, p.d + 12, 48, p.h - 24, 'none', `rx="4" stroke="#4e2e18" stroke-width="2"`)).join('')),
  stove: p => svg(p, box(p, '#3a3d48', '#2c2e37') + [[28, 22], [p.w - 28, 22], [28, p.d - 22], [p.w - 28, p.d - 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#1c1c28" stroke="#ff7a3a" stroke-width="2" opacity=".85"/>`).join('') + r(14, p.d + 16, p.w - 28, p.h - 32, '#1c1c28', `rx="6" stroke="#4d5059" stroke-width="2"`)),
  fridge: p => svg(p, box(p, '#c4cad6', '#d8dde6') + `<path d="M4 ${p.d + p.h * .38}H${p.w - 4}M${p.w - 20} ${p.d + 16}v40M${p.w - 20} ${p.d + p.h * .38 + 14}v40" stroke="${INK}" stroke-width="3"/>`),
  table: p => svg(p, `<path d="M14 ${p.d}V${p.d + p.h - 2}M${p.w - 14} ${p.d}V${p.d + p.h - 2}" stroke="${INK}" stroke-width="7"/>` + r(1.5, 1.5, p.w - 3, p.d, '#8a5530', ol()) + r(1.5, p.d, p.w - 3, 12, '#5e3a1f', ol(2))),
  'deck-table': p => DRAW.table(p),
  tub: p => svg(p, box(p, '#e8ecf2', '#d4d9e2') + r(14, 12, p.w - 28, p.d - 24, '#7ec8e3', `rx="16" ${ol(2)}`)),
  sink: p => svg(p, box(p, '#e8ecf2', '#9aa2b2') + `<ellipse cx="${p.w / 2}" cy="${p.d / 2}" rx="${p.w / 2 - 16}" ry="${p.d / 2 - 10}" fill="#b8c4d4" ${ol(2)}/>`),
  toilet: p => svg(p, r(10, 1.5, p.w - 20, 22, '#e8ecf2', ol(2)) + `<ellipse cx="${p.w / 2}" cy="${p.d - 18}" rx="${p.w / 2 - 4}" ry="${p.d / 2 - 12}" fill="#f4f6fa" ${ol(2)}/>` + r(14, p.d - 6, p.w - 28, p.h - 4, '#d4d9e2', ol(2))),
  bed: p => svg(p, box(p, '#e8e2d4', '#6e4a2a') + r(14, 14, p.w - 28, 56, '#f8f6f0', `rx="14" ${ol(2)}`) + r(1.5, 90, p.w - 3, p.d - 91, p.id === 'bed1' ? '#7a3a8a' : '#2f7a6b', ol(2.5))),
  rail(p) {
    const ns = p.w < p.d; let s = r(1, 1, p.w - 2, p.d - 1, '#e08a3c', ol(2));
    if (ns) s += r(1, p.d, p.w - 2, p.h - 1, '#c46f2a', ol(2));
    else { s += r(1, p.d + p.h - 8, p.w - 2, 7, '#c46f2a', ol(1.5)); for (let x = 6; x < p.w - 2; x += 22) s += `<path d="M${x} ${p.d}V${p.d + p.h - 2}" stroke="#c46f2a" stroke-width="7"/><path d="M${x} ${p.d}V${p.d + p.h - 2}" stroke="${INK}" stroke-width="1.5" opacity=".5"/>`; }
    return svg(p, s);
  },
  rocker: p => svg(p, `<path d="M4 ${p.d + p.h - 6}Q${p.w / 2} ${p.d + p.h + 6} ${p.w - 4} ${p.d + p.h - 10}" fill="none" stroke="${INK}" stroke-width="6"/>` + r(8, p.d + 20, p.w - 16, 14, '#d0772f', ol(2)) + r(8, 2, p.w - 16, p.d + 22, '#e08a3c', ol(2)) + `<path d="M20 6v${p.d + 12}M${p.w / 2} 6v${p.d + 12}M${p.w - 20} 6v${p.d + 12}" stroke="#a85a20" stroke-width="3"/>`),
  jeep(p) {   // the red jeep: boxy two-door, soft-top, round headlights at the front (east), the spare tire on the back
    const b = p.d, w = p.w, h = p.h;
    return svg(p, r(4, 6, w - 8, b - 10, '#c22a26', `rx="10" ${ol()}`) + r(18, 14, w * .48, b - 26, '#22222a', `rx="8" ${ol(2)}`) + r(w * .62, 18, w * .3, b - 34, '#a8201d', `rx="6" ${ol(2)}`)
      + r(4, b - 6, w - 8, h - 30, '#d4302b', `rx="8" ${ol()}`) + r(18, b - 4, w * .48, h * .42, '#22222a', `rx="4" ${ol(2)}`) + `<path d="M${w * .58} ${b}V${b + h - 34}" stroke="${INK}" stroke-width="3"/>`
      + [w * .2, w * .8].map(x => `<circle cx="${x}" cy="${b + h - 26}" r="24" fill="#1c1c22" ${ol()}/><circle cx="${x}" cy="${b + h - 26}" r="9" fill="#8a8fa3"/>`).join('')
      + `<circle cx="10" cy="${b + 34}" r="20" fill="#1c1c22" ${ol(2)}/>` + glowDot(w - 12, b + 18, 9, '#fff3c0'));
  },
  post: p => svg(p, `<path d="M${p.w / 2} ${p.d + p.h - 4}V40" stroke="${INK}" stroke-width="8"/><path d="M${p.w / 2} ${p.d + p.h - 4}V40" stroke="#3a3d48" stroke-width="4"/>` + r(3, 8, p.w - 6, 34, '#ffcf70', `class="lit flick" ${ol(2.5)}`) + `<path d="M0 8H${p.w}L${p.w / 2} -2Z" fill="#2a2a33"/>`),
  campfire: p => svg(p, `<ellipse cx="${p.w / 2}" cy="${p.d + p.h - 18}" rx="${p.w / 2 - 4}" ry="${p.d / 2 - 4}" fill="#3a2a22" ${ol()}/>` + `<path d="M20 ${p.d + p.h - 20}L${p.w - 20} ${p.d + p.h - 34}M20 ${p.d + p.h - 34}L${p.w - 20} ${p.d + p.h - 20}" stroke="#6e4a2a" stroke-width="10" stroke-linecap="round"/>`
    + `<g class="flick"><path d="M${p.w / 2 - 32} ${p.d + p.h - 26}q10-60 32-80q0 34 18 44q6-20 16-24q4 40-6 60z" fill="#ff8a2a" class="lit" ${ol(2)}/><path d="M${p.w / 2 - 12} ${p.d + p.h - 26}q6-30 14-40q6 24 14 40z" fill="#ffd23f" class="lit"/></g>`),
  log: p => svg(p, r(2, 2, p.w - 4, p.d + p.h - 4, '#7a4a26', `rx="18" ${ol()}`) + `<ellipse cx="${p.w - 16}" cy="${(p.d + p.h) / 2}" rx="12" ry="${(p.d + p.h) / 2 - 6}" fill="#c48a52" ${ol(2)}/>`),
  trampoline: p => svg(p, `<ellipse cx="${p.w / 2}" cy="${p.d / 2}" rx="${p.w / 2 - 4}" ry="${p.d / 2 - 4}" fill="#2f7ad8" ${ol()}/><ellipse cx="${p.w / 2}" cy="${p.d / 2}" rx="${p.w / 2 - 26}" ry="${p.d / 2 - 22}" fill="#1c1c28"/>`),
  goal(p) {   // the soccer goal faces west: its posts at the mouth (left), the net running back (right)
    const fy = p.d + p.h - 4, ny = 130, net = [];
    for (let y = 20; y < fy - 10; y += 26) net.push(`M12 ${y}L${p.w - 14} ${y + 40}`);
    for (let x = 30; x < p.w - 10; x += 26) net.push(`M${x} ${10 + x * .3}V${fy - (x * .5)}`);
    return svg(p, `<path d="${net.join('')}" stroke="#e8ecf2" stroke-width="1.6" opacity=".55" fill="none"/><path d="M12 ${fy}V10M12 ${ny}V${ny - 120}M12 10V${p.box.h - 4}" stroke="#f4f6fa" stroke-width="8" stroke-linecap="round"/><path d="M${p.w - 14} 50V${fy}" stroke="#c4cad6" stroke-width="5"/>`);
  },
  tree(p) {
    const w = p.box.w, h = p.box.h, s = p.size || 1, k = hash(p.id), tone = [['#1d4a30', '#245a38', '#2e6b45'], ['#173d2a', '#1f4f34', '#2a5e3e'], ['#20452f', '#2a5838', '#33704a']][Math.floor(k * 3)];
    const ty = h - 16 - 70 * s, cr = w * .3;
    return svg(p, `<ellipse cx="${w / 2}" cy="${h - 10}" rx="${w * .3}" ry="10" fill="#000" opacity=".25"/>` + r(w / 2 - 11 * s, ty - 10, 22 * s, 70 * s + 18, '#4a2f1c', `rx="6" ${ol(2.5)}`)
      + `<g ${ol(3)}><circle cx="${w / 2}" cy="${ty - cr * 1.2}" r="${cr * 1.25}" fill="${tone[0]}"/><circle cx="${w / 2 - cr * .7}" cy="${ty - cr * .55}" r="${cr}" fill="${tone[1]}"/><circle cx="${w / 2 + cr * .7}" cy="${ty - cr * .6}" r="${cr * .95}" fill="${tone[1]}"/><circle cx="${w / 2 + (k - .5) * cr}" cy="${ty - cr * 1.9}" r="${cr * .8}" fill="${tone[2]}"/></g>`);
  },
};
