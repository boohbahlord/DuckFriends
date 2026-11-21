/* I want the loading screen lines in js/loadlines.js to be exactly the ones I approved, so this reads the approved list
   (a file of sections, one line each) and writes the array, and nobody retypes a line. Run:
   node tools/make-loadlines.mjs /mnt/project-files/loading-lines/approved.md
   A line is { text, caption?, mono? }; the Seriat lines with code are { parts: [{ text, mono? }…], caption }. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(process.argv[2], "utf8").split("\n");
const SERIAT = "Seriat, Duck Friends' coding language";
const NOTE = / \(tone marks: check\)$/; // (a note for the checker, not part of the caption)
// a bit of Seriat code: a word with no letters that has an operator in it (the full stop that ends a sentence is not code)
const isCode = (w) => !/[A-Za-z]/.test(w) && /[<>|\\*~:[\]]/.test(w);
function seriat(line) {
  const parts = [];
  const add = (text, mono) => {
    const last = parts.at(-1);
    if (last && !!last.mono === mono) last.text += text;
    else parts.push(mono ? { text, mono } : { text });
  };
  for (const w of line.split(/( +)/)) {
    if (!isCode(w)) add(w, false);
    else {
      const [, code, stop] = /^(.*?)(\.?)$/.exec(w);
      add(code, true);
      if (stop) add(stop, false);
    }
  }
  return parts.some((p) => p.mono)
    ? { parts, caption: SERIAT }
    : { text: line, caption: SERIAT };
}
const out = [];
let section = "";
for (const raw of src) {
  if (raw.startsWith("## ")) section = raw.slice(3);
  if (!section || raw.startsWith("#") || !raw.trim()) continue;
  if (section.startsWith("Seriat")) out.push(seriat(raw));
  else if (/^Theology|^Astrology|^Math|^Science/.test(section)) {
    const i = raw.lastIndexOf(" | ");
    out.push({
      text: raw.slice(0, i),
      caption: raw.slice(i + 3).replace(NOTE, ""),
    });
  } else if (section.startsWith("Strange") && raw.endsWith("   (mono)"))
    out.push({ text: raw.slice(0, -"   (mono)".length), mono: true });
  else out.push({ text: raw });
}
const head = `/* the lines under the loading bar, one for each black loading screen (the owner approved every one, Nov 20 to 21). Made by
   tools/make-loadlines.mjs from the approved list, never typed in. text; caption (the source, below it, smaller);
   mono (a classic monospace font); or parts (the Seriat lines with code: { text, mono? }) */
export const LOAD_LINES = `;
writeFileSync(
  join(root, "js/loadlines.js"),
  head + JSON.stringify(out, null, 1) + ";\n",
);
console.log(out.length, "lines");
