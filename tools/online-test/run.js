/* ---------- the online test: several players in one online room, on this computer ----------
   Opens a few browsers (each its own guest player), makes an online room against the local Firebase emulators, and lets
   every player play like a computer would while they start kick, back-to-lobby and skip-the-round votes, and the host (or sudo) kicks
   and skips. Any error in any browser is printed at the end. See README.md for setting it up.

     node run.js [mode] [players] [seconds] [scenario]
       mode      aod | wyr | bb                                   (aod)
       players   2 … 8                                            (4)
       seconds   how long to play                                 (120)
       scenario  none | mixed | storm | kick | lobby | boss        (mixed)
                 none: no votes · mixed: now and then · storm: votes all the time · kick: kick votes that mostly pass ·
                 lobby: back-to-lobby and skip-the-round votes only · boss: the host gives sudo, and sudo players kick and skip
     QUIT=1 node run.js …   also closes the host's browser in the middle of votes, so another player takes over */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FB = path.dirname(require.resolve('firebase/package.json'));
const [mode = 'aod', N = '4', SECS = '120', SCEN = 'mixed'] = process.argv.slice(2);
const PORT = +process.env.PORT || 8123, URL = `http://127.0.0.1:${PORT}/index.html?emu=127.0.0.1`;
const errors = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* the site, served from the repo */
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

/* runs inside each browser: plays as a person (with the computers' moves), and votes */
const PLAYER = scen => {
  window.__phases = 0;
  (async () => {
    const net = await import('/js/net.js'), bots = await import('/js/bots.js'), rules = await import('/js/rules.js'), pm = await import('/js/players.js');
    let lastAt = 0, lastKey = '';
    setInterval(() => {
      try {
        const R = net.activeRoom(); if (!R || !R.state) return;
        const s = R.state, me = R.me; if (!s.players[me]) return;
        const key = [s.phase, s.round, s.qi].join('|');
        if (key !== lastKey) { lastKey = key; lastAt = Date.now(); window.__phases++; }
        // play: what a computer in my place would do now
        const fake = structuredClone(s);
        for (const id of fake.seat) fake.players[id].bot = id === me;
        fake.options.botWait = 1; fake.at = Math.min(fake.at, Date.now() - 1500);
        for (const a of bots.botActions(fake, Date.now())) if (a.id === me && a.t !== 'ready') R.send(a);
        if (['discuss', 'results', 'bracket'].includes(s.phase) && !s.done[me] && Date.now() - lastAt > 2500 + Math.random() * 3000) R.send({ t: 'end', v: true });
        if (s.phase === 'results' && s.round >= 1 && !s.reviewVotes[me] && Math.random() < .05) R.send({ t: 'voteReview' });
        if (scen === 'none' || ['lobby', 'countdown', 'over'].includes(s.phase)) return;
        const others = s.seat.filter(id => id !== me && !s.players[id].bot), boss = rules.isSudo(s, me);
        // the host (or sudo): give sudo, kick, skip
        if (scen === 'boss' && boss) {
          if (me === s.hostId && others.length && Math.random() < .01) R.send({ t: 'usermod', target: others[Math.floor(Math.random() * others.length)], groups: ['sudo'], mode: 'add' });
          if (Math.random() < .004) R.send({ t: 'skip' });
          if (others.length > 2 && Math.random() < .002) R.send({ t: 'kick', who: others[Math.floor(Math.random() * others.length)] });
        }
        // votes
        if (s.vote) {
          const v = s.vote, { voters } = rules.voteNeeds(s, v);
          if (voters.includes(me) && !v.yes[me] && !v.no[me] && Math.random() < .15) R.send({ t: 'voteCast', n: v.n, v: Math.random() < (scen === 'kick' ? .8 : .45) });
        } else if (Math.random() < (scen === 'storm' ? .05 : .006)) {
          if (scen !== 'lobby' && others.length && Math.random() < .6) { const t = others[Math.floor(Math.random() * others.length)]; if (!pm.whyNotVote(s, me, 'kick')) R.send({ t: 'voteStart', kind: 'kick', target: t }); }
          else { const kind = ['skip', 'lobby', 'turn'][Math.floor(Math.random() * 3)]; if (!pm.whyNotVote(s, me, kind)) pm.lobbyVote(R, kind); }
        }
      } catch (e) { console.error('TEST', e && e.stack || e); }
    }, 300);
  })();
};

const inRoom = p => p.evaluate(async () => { const net = await import('/js/net.js'); const R = net.activeRoom(); return R && R.state ? { me: R.me, host: R.state.hostId === R.me, phase: R.state.phase, round: R.state.round, vote: R.state.vote && R.state.vote.kind, n: R.state.seat.length } : null; }).catch(() => null);

(async () => {
  await new Promise(ok => server.listen(PORT, '127.0.0.1', ok));
  const browser = await chromium.launch({ args: ['--no-proxy-server'] });
  const pages = [];
  for (let i = 0; i < +N; i++) {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 750 } });
    // the Firebase SDK from node_modules instead of gstatic.com (the same files)
    await ctx.route(/www\.gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z]+\.js)$/, (route, req) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(FB, req.url().match(/(firebase-[a-z]+\.js)$/)[1])) });
    });
    const page = await ctx.newPage(); page.__i = i;
    page.on('pageerror', e => errors.push(`[player ${i + 1}] ${e.stack || e}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`[player ${i + 1}] console: ${m.text()}`); });
    await page.goto(URL); await sleep(800);
    pages.push(page);
  }
  const info = await pages[0].evaluate(async mode => {
    const o = await import('/js/online.js'), r = await import('/js/router.js');
    let detail = null; addEventListener('duck-room', e => { if (e.detail) detail = e.detail; });
    r.go('lobby', await o.createOnlineRoom({ name: 'Online test', open: true, max: 8, options: { mode } }));
    return detail;
  }, mode);
  const join = p => p.evaluate(async entry => { const o = await import('/js/online.js'), r = await import('/js/router.js'); r.go('lobby', await o.joinOnlineRoom(entry)); }, info);
  for (const p of pages.slice(1)) await join(p);
  await sleep(1500);
  for (const p of pages) await p.evaluate(PLAYER, SCEN);
  console.log(`${mode}, ${N} players, ${SECS} s, ${SCEN}${process.env.QUIT ? ', host quits mid-vote' : ''}`);

  const t0 = Date.now(); let shown = 0;
  while (Date.now() - t0 < +SECS * 1000) {
    await sleep(2000);
    for (const p of pages) {
      const st = await inRoom(p);
      if (st && st.host && st.phase === 'lobby') await p.evaluate(async () => (await import('/js/net.js')).activeRoom().send({ t: 'start' })).catch(() => {});
      if (!st) await join(p).catch(() => {});   // removed: try to come back (works once the room is back in the lobby)
      if (st && st.host && st.vote && process.env.QUIT && pages.length > 2 && Math.random() < .5) {
        console.log(`  closing the host's browser (player ${p.__i + 1}) during a vote`);
        pages.splice(pages.indexOf(p), 1); await p.context().close(); break;
      }
    }
    if (Date.now() - shown > 15000) {
      shown = Date.now();
      const all = await Promise.all(pages.map(inRoom));
      console.log(`  ${Math.round((Date.now() - t0) / 1000)} s  ` + all.map(s => s ? `${s.host ? 'H' : 'p'} ${s.phase} r${s.round + 1}${s.vote ? ' vote:' + s.vote : ''} ${s.n}p` : 'out').join(' | '));
    }
  }
  const phases = await Promise.all(pages.map(p => p.evaluate(() => window.__phases).catch(() => -1)));
  console.log('stages seen by each player:', phases.join(', '));
  const out = path.join(__dirname, 'shots'); fs.mkdirSync(out, { recursive: true });
  for (const p of pages) await p.screenshot({ path: path.join(out, `${mode}-${SCEN}-player${p.__i + 1}.png`) }).catch(() => {});
  const uniq = [...new Set(errors)];
  console.log(uniq.length ? `ERRORS: ${uniq.length}` : 'No errors.'); uniq.slice(0, 60).forEach(e => console.log(e));
  await browser.close(); server.close();
  process.exit(uniq.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
