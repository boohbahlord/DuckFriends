(() => {
  let a = 1;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const real = Math.random.bind(Math),
    dn = Date.now.bind(Date),
    pn = performance.now.bind(performance);
  window.__seed = (n) => {
    a = n >>> 0;
  };
  Math.random = () => (window.__fake ? rnd() : real());
  Date.now = () => (window.__fake ? window.__now : dn());
  performance.now = () => (window.__fake ? window.__now - 1.8e12 : pn());
  try {
    delete window.Worker;
  } catch {}
  window.Worker = undefined;
})();
