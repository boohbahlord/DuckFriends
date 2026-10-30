/* ---------- Bugs and ideas: from Firebase into notes/bugs-and-ideas.md ----------
   The game's Report Bug or Suggest Ideas box (js/report.js) writes each report to Firebase's reports path, which no
   player can read. This runs every hour on GitHub (.github/workflows/bugs-and-ideas.yml): it signs in with the
   project's service account (the FIREBASE_SERVICE_ACCOUNT secret), reads the reports newer than the last one copied
   (its key is kept at the top of the file), and adds them to the end of notes/bugs-and-ideas.md, oldest first. It only
   reads, so nothing in the database changes. Plain Node 20, no packages.
     node tools/bugs-and-ideas.mjs
   Tests against the emulators: DB=http://127.0.0.1:9000 TOKEN=owner node tools/bugs-and-ideas.mjs */
import { createSign } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const FILE = path.join(ROOT, 'notes/bugs-and-ideas.md');
const PROJECT = 'duckfriends-bd795';
const DB = process.env.DB || `https://${PROJECT}-default-rtdb.firebaseio.com`;
const HEAD = `# Bugs and ideas

Sent from the game (Report Bug or Suggest Ideas, at the bottom of the Updates and Settings windows), oldest first.
Copied here every hour by .github/workflows/bugs-and-ideas.yml.
<!-- last: -->
`;

/* an access token for the database, from the service account's key (a signed JWT traded at Google's token endpoint) */
async function token() {
  if (process.env.TOKEN) return process.env.TOKEN;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) { console.log('::notice::No FIREBASE_SERVICE_ACCOUNT secret yet, so no reports were copied.'); process.exit(0); }
  const sa = JSON.parse(raw), now = Math.floor(Date.now() / 1000), b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email' })}`;
  const sig = createSign('RSA-SHA256').update(body).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${body}.${sig}` }) });
  const j = await r.json(); if (!j.access_token) throw new Error('No access token: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}
/* one report as markdown: its date and who, the device and browser, then the words as a quote */
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, n);
function entry(r) {
  const at = new Date(+r.at || 0).toISOString().slice(0, 16).replace('T', ' ');
  const text = clean(r.text, 1000).trim().split(/\r?\n/).map(l => '> ' + l).join('\n');
  return `\n## ${at} UTC · ${clean(r.name, 20) || 'Guest'}\n${clean(r.device, 40)} · ${clean(r.browser, 40)}\n\n${text}\n`;
}

const doc = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : HEAD;
const MARK = /<!-- last: ?([\w-]*) ?-->/, last = (doc.match(MARK) || [])[1] || '';
const q = new URLSearchParams({ orderBy: '"$key"', ...(last ? { startAt: JSON.stringify(last) } : {}), ...(process.env.DB ? { ns: `${PROJECT}-default-rtdb` } : {}) });
const res = await fetch(`${DB}/reports.json?${q}`, { headers: { Authorization: `Bearer ${await token()}` } });
if (!res.ok) throw new Error(`Reading the reports failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
const all = (await res.json()) || {}, keys = Object.keys(all).filter(k => k !== last).sort();   // (push keys sort oldest first; startAt includes the last one copied)
if (!keys.length) { console.log('No new reports.'); process.exit(0); }
const out = doc.replace(MARK, `<!-- last: ${keys[keys.length - 1]} -->`).replace(/\n*$/, '\n') + keys.map(k => entry(all[k])).join('');
fs.writeFileSync(FILE, out);
console.log(`Copied ${keys.length} new report${keys.length === 1 ? '' : 's'}.`);
