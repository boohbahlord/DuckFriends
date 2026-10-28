/* ---------- secrets between two browsers ----------
   Who is the Quack? online: every player can read the room's state, so a Secret Card (and the secret word on its way to
   the host) travels locked. Each browser makes a key pair when it first goes online and puts the public half in its
   player record; two browsers get the same key from one's private half and the other's public half, so only those two
   can open what one locks for the other. */
const C = globalThis.crypto && crypto.subtle;
let pair = null, pub = null, making = null;
const keys = new Map();   // their public key → our shared key
export function ready() {
  return making || (making = (async () => {
    if (!C) return null;   // (no Web Crypto: an insecure page)
    pair = await C.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    const j = await C.exportKey('jwk', pair.publicKey);
    pub = { x: j.x, y: j.y };
    return pub;
  })().catch(() => null));
}
export const publicKey = () => pub;
export const keyOk = k => !!k && typeof k.x === 'string' && typeof k.y === 'string' && k.x.length < 64 && k.y.length < 64;
function sharedKey(them) {
  const id = them.x + '.' + them.y;
  if (!keys.has(id)) keys.set(id, C.importKey('jwk', { kty: 'EC', crv: 'P-256', x: them.x, y: them.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
    .then(k => C.deriveKey({ name: 'ECDH', public: k }, pair.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])));
  return keys.get(id);
}
const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
/* lock something for them, or open what they locked for me */
export async function seal(them, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await C.encrypt({ name: 'AES-GCM', iv }, await sharedKey(them), new TextEncoder().encode(JSON.stringify(obj)));
  return b64(iv) + '.' + b64(new Uint8Array(ct));
}
export async function unseal(them, box) {
  const [iv, ct] = String(box).split('.');
  const pt = await C.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await sharedKey(them), unb64(ct));
  return JSON.parse(new TextDecoder().decode(pt));
}

/* other secrets the host hands out the same way (poker's two cards each): functions of the room's state that give
   { sig, items: { player id: what only they may see } } or nothing */
export const handouts = new Set();
