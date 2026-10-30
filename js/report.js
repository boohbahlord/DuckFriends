/* ---------- Report Bug or Suggest Ideas ----------
   Small text at the bottom of the Updates and Settings windows opens a big box (1,000 letters at most, counted as you
   type) and Submit. Each report goes to Firebase's reports path, which players can write to but never read
   (database.rules.json): the date (the server's clock), the player's name or "Guest" when they aren't signed in (never
   an email), the device and the browser. Both come from the browser itself (the user agent, the touch points and the
   pointer), so nothing asks for permission. A GitHub job (.github/workflows/bugs-and-ideas.yml) copies new reports into
   notes/bugs-and-ideas.md every hour. One report a minute from each player (the rules check it). */
import { openWindow, toast, esc } from './ui.js';
import { rainbowHTML } from './art.js';
import { profile, NAME_OK } from './store.js';
import { acct } from './account.js';
import { connect } from './online.js';

export const REPORT_MAX = 1000;

/* Phone, Tablet, Computer, or Touchscreen laptop or computer */
export function deviceOf(ua = navigator.userAgent, touch = navigator.maxTouchPoints || 0, fine = matchMedia('(any-pointer: fine)').matches) {
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1) || (/Android/.test(ua) && !/Mobile/.test(ua)) || /Tablet|Silk|Kindle/.test(ua)) return 'Tablet';   // (an iPad says it's a Mac, but a Mac has no touch screen)
  if (/Mobi|iPhone|iPod|Android|Windows Phone/.test(ua)) return 'Phone';
  return touch > 0 && fine ? 'Touchscreen laptop or computer' : 'Computer';
}
export function browserOf(ua = navigator.userAgent) {
  const v = re => { const m = ua.match(re); return m ? ' ' + m[1].split('.')[0] : ''; };
  if (/Edg(A|iOS)?\//.test(ua)) return 'Edge' + v(/Edg(?:A|iOS)?\/([\d.]+)/);
  if (/OPR\/|Opera/.test(ua)) return 'Opera' + v(/OPR\/([\d.]+)/);
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet' + v(/SamsungBrowser\/([\d.]+)/);
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox' + v(/(?:Firefox|FxiOS)\/([\d.]+)/);
  if (/Chrome\/|CriOS\//.test(ua)) return 'Chrome' + v(/(?:Chrome|CriOS)\/([\d.]+)/);
  if (/Safari\//.test(ua)) return 'Safari' + v(/Version\/([\d.]+)/);
  return 'Other browser';
}
/* the name on a report: the profile's name when signed in, else Guest (a name is never an email: NAME_OK has no @) */
const reporter = () => acct.uid && NAME_OK.test(profile.name || '') ? profile.name : 'Guest';

export function openReport() {
  return openWindow(`<h2 class="up-title">${rainbowHTML('Report Bug or Suggest Ideas')}</h2>
    <form class="report" autocomplete="off"><p class="small dim">What went wrong (and how), or what you'd like to see. Sent with your name${acct.uid ? '' : ' (Guest, since you aren\'t signed in)'}, the date, your device and your browser.</p>
      <textarea class="report-in" maxlength="${REPORT_MAX}" rows="9" aria-label="Your report or idea" placeholder="When I jump on a phone…"></textarea>
      <p class="report-foot"><span class="report-count dim small" aria-live="polite">0/${REPORT_MAX}</span><button type="submit" class="btn green" disabled>Submit</button></p></form>`, {
    cls: 'win-report',
    onOpen(w, close) {
      const f = w.querySelector('form'), box = f.querySelector('textarea'), count = f.querySelector('.report-count'), send = f.querySelector('[type=submit]');
      const typed = () => { count.textContent = `${box.value.length}/${REPORT_MAX}`; send.disabled = !box.value.trim(); };
      box.addEventListener('input', typed);
      f.onsubmit = async e => {
        e.preventDefault();
        const text = box.value.trim().slice(0, REPORT_MAX); if (!text) return;
        send.disabled = true; send.textContent = 'Sending…';
        try {
          const { D, db, uid } = await connect();   // (the same guest sign-in as online rooms)
          const key = D.push(D.ref(db, 'reports')).key;
          await D.update(D.ref(db), {
            [`reports/${key}`]: { at: D.serverTimestamp(), uid, name: reporter(), device: deviceOf(), browser: browserOf(), text },
            [`reportsLast/${uid}`]: D.serverTimestamp(),
          });
          close(true); toast('Thanks! Your report is in.');
        } catch (err) {
          send.textContent = 'Submit'; typed();
          toast(/permission/i.test(String(err && (err.code || err.message))) ? 'One report a minute: try again in a moment.' : 'It didn\'t send. Check your connection and try again.', 4000);
        }
      };
      box.focus();
    },
  });
}
/* the small text at the bottom of a window */
export const reportLinkHTML = () => `<p class="up-count report-link"><button type="button" class="linkbtn" data-a="report">${esc('Report Bug or Suggest Ideas')}</button></p>`;
