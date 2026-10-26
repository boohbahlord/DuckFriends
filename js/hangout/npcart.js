/* ---------- Duck Cabin's characters: the drawings ----------
   The four cats, Justin and the shadow duck, as SVG strings in the ducks' style: side-on, outlined in the ducks' ink,
   a little 3D (lighter on top, darker underneath) with a small shadow. The cats are much smaller than a duck (a duck is
   64 tall): Oreo and Opal the smallest, Annabelle a little bigger, Bubbles the biggest. Every drawing faces right;
   flip it with scaleX(-1). Preview: tools/npc-art.html.
   catSVG(name, { pose, step, size }) → one cat. pose: 'stand' | 'walk' (step -1 … 1 swings the legs) | 'sit' | 'loaf' |
   'swipe'. The box is 100 × 80 units, the feet on y 74, scaled so the cat stands CATS[name].tall world px high (times
   size). Justin and the shadow duck are ducks: their looks go to duckSVG (js/duck.js). */
import { duckSVG } from '../duck.js';

const O = '#1c1c28';   // the ducks' ink
let N = 0;
const uid = () => 'ct' + (++N).toString(36);
const n1 = v => Math.round(v * 10) / 10;

/* each cat's coat: base fur, its patches on the body and the head (drawn inside them), legs, tail, eyes, size */
export const CATS = {
  oreo: {
    name: 'Oreo', tall: 30, len: 1, thin: 1, fur: '#f4f1ea', eye: '#7cc95a',
    body: '<path d="M20 30C30 28 46 30 58 34L66 46C52 44 38 47 26 50Z" fill="#17171d"/><ellipse cx="36" cy="52" rx="7" ry="5" fill="#17171d"/>',
    head: '<path d="M58 14H92V30C86 26 80 25 75 32C70 25 64 26 58 30Z" fill="#17171d"/>',   // a black cap with a white blaze down the nose
    sit: '<path d="M18 75C16 56 28 42 46 37L52 40C40 48 36 60 40 75Z" fill="#17171d"/>',
    legs: ['#17171d', '#17171d', '#f4f1ea', '#f4f1ea'], socks: '#f4f1ea', tail: '#17171d', tailTip: null, chin: null,
  },
  opal: {
    name: 'Opal', tall: 29, len: 1.12, thin: .86, fur: '#18181f', eye: '#e9c23a', sheen: '#4a4a5c',
    body: '', head: '', sit: '', legs: ['#18181f', '#18181f', '#18181f', '#18181f'], socks: null, tail: '#18181f', tailTip: null, chin: null,
  },
  annabelle: {
    name: 'Annabelle', tall: 34, len: 1, thin: 1, fur: '#7d7266', eye: '#b8c94a',
    /* a darker tabby: stripes down her sides, warm tortie patches, a white chin */
    body: '<g stroke="#3c342c" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M30 33C28 40 30 46 33 52"/><path d="M39 32C37 40 39 47 42 54"/><path d="M48 33C46 40 48 47 51 54"/><path d="M57 35C55 41 57 47 60 52"/></g><path d="M26 38C32 36 36 40 34 44 30 46 26 44 26 38Z" fill="#a8683a" opacity=".75"/><path d="M54 48C60 46 64 50 62 54 56 56 53 52 54 48Z" fill="#a8683a" opacity=".7"/><path d="M20 30H70V36C56 33 36 33 20 36Z" fill="#5a5047"/>',
    head: '<g stroke="#3c342c" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M70 17V23"/><path d="M75 15V22"/><path d="M80 17V23"/><path d="M62 30H67M83 30H88"/></g><path d="M80 18C85 18 88 22 87 26 84 25 81 22 80 18Z" fill="#a8683a" opacity=".8"/>',
    sit: '<g stroke="#3c342c" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M28 54C32 58 32 64 28 68"/><path d="M36 50C40 56 40 62 36 68"/><path d="M46 44C49 48 49 52 47 56"/></g><path d="M40 60C46 58 50 62 48 66 42 68 39 64 40 60Z" fill="#a8683a" opacity=".75"/>',
    legs: ['#6e645a', '#6e645a', '#7d7266', '#7d7266'], socks: null, tail: '#7d7266', tailTip: '#3c342c', chin: '#f2ede4', stripes: '#3c342c', legStripes: '#3c342c',
  },
  bubbles: {
    name: 'Bubbles', tall: 36, len: 1, thin: 1, fur: '#f6f2ea', eye: '#d9a640',
    /* orange back and head, white chest, belly and paws */
    body: '<path d="M18 30C30 27 48 29 66 34L66 42C56 41 44 43 34 44 28 45 22 44 18 42Z" fill="#e8873a"/><path d="M30 31V40M40 30V40M50 31V41" stroke="#c4672a" stroke-width="2.6" stroke-linecap="round"/>',
    head: '<path d="M58 12H92V30C86 26 82 27 79 30 77 34 73 34 71 30 68 27 64 26 58 30Z" fill="#e8873a"/><path d="M70 15V20M75 14V19M80 15V20" stroke="#c4672a" stroke-width="2" stroke-linecap="round"/>',
    sit: '<path d="M18 75C16 56 28 42 46 37L54 40C44 46 40 54 42 62 42 68 46 72 48 75Z" fill="#e8873a"/><path d="M30 50L38 54M28 58L37 61M30 66L38 68" stroke="#c4672a" stroke-width="2.6" stroke-linecap="round"/>',
    legs: ['#f6f2ea', '#f6f2ea', '#f6f2ea', '#f6f2ea'], socks: null, tail: '#e8873a', tailTip: null, chin: null, stripes: '#c4672a',
  },
};

const shade = (k, top, bottom, a = .3) => `<linearGradient id="${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="${top}" stop-color="#fff" stop-opacity="0"/><stop offset="${bottom}" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${a}"/></linearGradient>`;
const dark = (c, k = .7) => {   // a color made darker (for the far legs)
  const v = parseInt(c.slice(1), 16), f = x => Math.round(x * k).toString(16).padStart(2, '0');
  return '#' + f(v >> 16) + f((v >> 8) & 255) + f(v & 255);
};

/* the shapes of each pose, in the 100 × 80 box (feet on y 74, the head at the right) */
const POSES = {
  stand: { body: 'M20 42C20 32 32 29 46 30C58 30 68 33 70 42C71 52 62 56 46 56C32 56 20 53 20 42Z', head: [73, 30], tail: 'M22 40C10 38 6 26 12 16',
    legs: [[26, 50], [33, 51], [58, 51], [64, 50]], legLen: 24 },
  sit: { body: 'M24 74C20 60 30 46 44 40C54 36 64 40 66 50V74Z', head: [60, 29], tail: 'M30 73C42 76 52 76 54 71',
    legs: [[55, 52], [62, 52]], legLen: 22, haunch: 'M22 73C20 62 28 52 38 53C47 54 50 64 48 74Z' },
  loaf: { body: 'M18 62C18 52 30 48 46 48C60 48 70 52 70 62C70 70 60 73 46 73C30 73 18 71 18 62Z', head: [74, 48], tail: 'M20 68C12 72 12 76 22 75', legs: [], paws: [[64, 72], [72, 72]] },
};
POSES.walk = POSES.stand; POSES.swipe = POSES.stand;

export function catSVG(name, { pose = 'stand', step = 0, size = 1 } = {}) {
  const C = CATS[name] || CATS.oreo, P = POSES[pose] || POSES.stand, id = uid();
  const sc = C.tall / 63 * size, len = C.len, thin = C.thin;
  /* Opal: a bit longer and skinnier, from the middle of her body (the head stays the same) */
  const bodyT = len !== 1 || thin !== 1 ? ` transform="translate(46 ${pose === 'sit' ? 74 : 56}) scale(${len} ${thin}) translate(-46 -${pose === 'sit' ? 74 : 56})"` : '';
  const [hx, hy] = P.head, hxL = hx + (pose === 'sit' ? 0 : (len - 1) * 26);
  const ln = w => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  /* the legs: far pair first and darker; walking swings them in turn; a swipe lifts the near front paw */
  const legs = [], fars = [];
  (P.legs || []).forEach(([x, y], i) => {
    const near = i % 2 === 1, front = i >= 2 || pose === 'sit';
    let a = pose === 'walk' ? (i === 0 || i === 3 ? 1 : -1) * step * 22 : 0;
    if (pose === 'swipe' && front && near) a = -105;
    const xx = pose === 'sit' ? x : 46 + (x - 46) * len, c = near ? C.legs[i] : dark(C.legs[i], .72), L = P.legLen;
    const sock = C.socks && near ? `<rect x="${xx - 3}" y="${y + L - 7}" width="6" height="7" rx="3" fill="${C.socks}"/>` : '';
    const g = `<g transform="rotate(${n1(a)} ${n1(xx)} ${y})"><rect x="${n1(xx - 3.2)}" y="${y}" width="6.4" height="${L}" rx="3.2" fill="${c}" ${ln(2)}/>${sock}${C.legStripes && near ? `<path d="M${n1(xx - 3)} ${y + 8}h6M${n1(xx - 3)} ${y + 13}h6" stroke="${C.legStripes}" stroke-width="1.6"/>` : ''}</g>`;
    (near ? legs : fars).push(g);
  });
  const paws = (P.paws || []).map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="${C.legs[3]}" ${ln(1.8)}/>`).join('');
  /* the tail: an ink line under a fur line, its tip darker for the tabby */
  const tail = `<path d="${P.tail}" fill="none" ${ln(9)}/><path d="${P.tail}" fill="none" stroke="${C.tail}" stroke-width="5.4" stroke-linecap="round"/>${C.tailTip ? `<path d="${P.tail}" fill="none" stroke="${C.tailTip}" stroke-width="5.4" stroke-linecap="round" stroke-dasharray="4 5"/>` : ''}`;
  /* the head looks at us: ears, eyes, a pink nose and whiskers */
  const r = 13, eyeW = name === 'annabelle' ? 2.4 : 2.7;
  const ear = s => `<path d="M${hxL + s * 4} ${hy - r + 4}L${hxL + s * 11} ${hy - r - 9}L${hxL + s * 13} ${hy - r + 6}Z" fill="${C.fur}" ${ln(2)}/><path d="M${hxL + s * 6} ${hy - r + 3}L${hxL + s * 10.5} ${hy - r - 4}L${hxL + s * 11.5} ${hy - r + 5}Z" fill="#e89aa8" opacity=".85"/>`;
  const eye = ex => `<ellipse cx="${ex}" cy="${hy}" rx="${eyeW + .6}" ry="3.4" fill="${C.eye}" ${ln(1.2)}/><ellipse cx="${ex}" cy="${hy}" rx=".9" ry="2.8" fill="#111"/><circle cx="${ex + .9}" cy="${hy - 1.3}" r=".8" fill="#fff"/>`;
  const whisk = `<g stroke="#fff" stroke-opacity=".75" stroke-width=".9"><path d="M${hxL - 4} ${hy + 6}L${hxL - 15} ${hy + 4}M${hxL - 4} ${hy + 7}L${hxL - 15} ${hy + 8}M${hxL + 4} ${hy + 6}L${hxL + 15} ${hy + 4}M${hxL + 4} ${hy + 7}L${hxL + 15} ${hy + 8}"/></g>`;
  const headShape = `M${hxL - r} ${hy + 1}C${hxL - r} ${hy - 10} ${hxL - 7} ${hy - r} ${hxL} ${hy - r}C${hxL + 7} ${hy - r} ${hxL + r} ${hy - 10} ${hxL + r} ${hy + 1}C${hxL + r} ${hy + 9} ${hxL + 7} ${hy + 12} ${hxL} ${hy + 12}C${hxL - 7} ${hy + 12} ${hxL - r} ${hy + 9} ${hxL - r} ${hy + 1}Z`;
  const headPatch = C.head ? `<g transform="translate(${hxL - 75} ${hy - 28})">${C.head}</g>` : '';
  const chin = C.chin ? `<ellipse cx="${hxL}" cy="${hy + 9}" rx="6" ry="3.4" fill="${C.chin}"/>` : '';
  const sheen = C.sheen ? `<path d="M28 36C38 32 52 32 62 35" stroke="${C.sheen}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>` : '';
  const headSheen = C.sheen ? `<path d="M${hxL - 7} ${hy - 9}C${hxL - 2} ${hy - 12} ${hxL + 3} ${hy - 12} ${hxL + 7} ${hy - 9}" stroke="${C.sheen}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>` : '';
  const bodyPatch = pose === 'stand' || pose === 'walk' || pose === 'swipe' ? C.body : pose === 'loaf' ? `<g transform="translate(0 16)">${C.body}</g>` : C.sit;
  const swipe = pose === 'swipe' ? `<path d="M${hxL + 6} ${hy + 4}C${hxL + 22} ${hy + 10} ${hxL + 24} ${hy + 26} ${hxL + 14} ${hy + 38}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8" stroke-dasharray="1 5"/>` : '';
  const W = 100 * size * C.tall / 63, H = 80 * size * C.tall / 63;
  return `<svg class="cat cat-${name}" viewBox="0 0 100 80" width="${n1(W)}" height="${n1(H)}" overflow="visible" role="img" aria-label="${C.name}">
<defs>${shade(id + 's', .35, .55)}<clipPath id="${id}b"><path d="${P.body}"${bodyT}/>${P.haunch ? `<path d="${P.haunch}"/>` : ''}</clipPath><clipPath id="${id}h"><path d="${headShape}"/></clipPath></defs>
<ellipse cx="${pose === 'sit' ? 46 : 46}" cy="74.5" rx="${n1(30 * len)}" ry="4.5" fill="#000" opacity=".24"/>
${tail}${fars.join('')}
<path d="${P.body}" fill="${C.fur}"${bodyT} ${ln(2.6)}/>${P.haunch ? `<path d="${P.haunch}" fill="${C.fur}"/>` : ''}
<g clip-path="url(#${id}b)"><g${bodyT}>${bodyPatch}${sheen}</g><rect width="100" height="80" fill="url(#${id}s)"/></g>${P.haunch ? `<path d="${P.haunch}" fill="none" ${ln(2.2)}/>` : ''}
${legs.join('')}${paws}
${ear(-1)}${ear(1)}
<path d="${headShape}" fill="${C.fur}" ${ln(2.4)}/>
<g clip-path="url(#${id}h)">${headPatch}${headSheen}${chin}<rect x="${hxL - r}" y="${hy - r}" width="${2 * r}" height="${2 * r}" fill="url(#${id}s)"/></g>
${eye(hxL - 5)}${eye(hxL + 5)}
<path d="M${hxL - 1.6} ${hy + 4.4}H${hxL + 1.6}L${hxL} ${hy + 6.2}Z" fill="#f08aa0" ${ln(.8)}/><path d="M${hxL} ${hy + 6.2}C${hxL - .6} ${hy + 8} ${hxL - 2.4} ${hy + 8.2} ${hxL - 3} ${hy + 7.2}M${hxL} ${hy + 6.2}C${hxL + .6} ${hy + 8} ${hxL + 2.4} ${hy + 8.2} ${hxL + 3} ${hy + 7.2}" fill="none" stroke="${O}" stroke-width=".9" stroke-linecap="round"/>
${whisk}${swipe}</svg>`;
}

/* ---------- the ducks ---------- */
/* Justin: a yellow duck in blue jeans and glasses */
export const JUSTIN = { color: '#ffd23f', face: { id: 'glasses' }, outfit: { id: 'jeans' } };
/* the shadow duck: all black, only its eyes catch a little light */
export const SHADOW = { color: '#0c0c12' };
export const justinSVG = (o = {}) => duckSVG(JUSTIN, { title: 'Justin', ...o });
export const shadowSVG = (o = {}) => duckSVG(SHADOW, { title: '', shadow: false, ...o })
  .replace(/#ff9a1f/g, '#22222c').replace(/#f07f0e/g, '#1a1a22').replace(/#c45f00/g, '#0a0a0e');   // (a black beak too)

/* the glass of clear liquid Justin drinks after he's revived */
export const glassSVG = () => `<svg viewBox="0 0 20 28" width="20" height="28" aria-hidden="true"><path d="M3 3H17L15 26H5Z" fill="#cfe8ff" fill-opacity=".25" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/><path d="M4.2 11H15.8L15 25H5Z" fill="#e8f6ff" fill-opacity=".55"/><path d="M6 6L7 22" stroke="#fff" stroke-width="1.2" opacity=".7" stroke-linecap="round"/></svg>`;
