/* I want Lighthouse's verdict in a few lines, so nobody has to open the big report: the scores, the loading times and
   the five things that cost the most time on a slow phone. Run after `lhci autorun` (it reads .lighthouseci/). */
import { readFileSync } from "node:fs";

const runs = JSON.parse(readFileSync(".lighthouseci/manifest.json", "utf8"));
const best = runs.find((r) => r.isRepresentativeRun) || runs[0];
console.log(
  Object.entries(best.summary)
    .map(([k, v]) => `${k} ${Math.round(v * 100)}`)
    .join(", "),
);
const lhr = JSON.parse(readFileSync(best.jsonPath, "utf8"));
const a = lhr.audits;
for (const id of [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "total-byte-weight",
])
  if (a[id]) console.log(`${a[id].title}: ${a[id].displayValue}`);
const slow = Object.values(a)
  .filter(
    (x) => x.score !== null && x.score < 0.9 && x.details?.overallSavingsMs > 0,
  )
  .sort((x, y) => y.details.overallSavingsMs - x.details.overallSavingsMs)
  .slice(0, 5);
for (const x of slow)
  console.log(
    `- ${x.title}: saves ${Math.round(x.details.overallSavingsMs)} ms`,
  );
