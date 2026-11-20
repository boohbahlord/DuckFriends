/* The Seriat bible in the game (the owner's, Nov 19 23:17Z: "a pixelated version of the Seriat bible that looks like the
   pages of a Word document, not separated into pages, in a window ... it pops up even above the Seriat window"). It
   shows notes/seriat-bible.md as it stands, as one long page; the site publishes that file as it is. */
import { esc, openWindow, foldHeads } from "./ui.js";
import { LANG } from "./langname.js";

const URL_ = "notes/seriat-bible.md";
let text = null;
const folded = new Set(); // (the headings I folded: they stay folded the next time it opens)

/* inline: `code`, **bold**; everything else is plain */
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

/* the few kinds of line the bible uses: headings, lists (numbered too), tables, fenced code, paragraphs */
export function bibleHTML(md) {
  const out = [],
    lines = md.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const L = lines[i];
    let m;
    if (/^\s*```/.test(L)) {
      const code = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++)
        code.push(lines[i].replace(/^\s{0,3}/, ""));
      i++;
      out.push(`<pre>${esc(code.join("\n"))}</pre>`);
    } else if ((m = /^(#{1,3}) (.*)$/.exec(L))) {
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
      i++;
    } else if (/^\|/.test(L)) {
      const rows = [];
      for (; i < lines.length && /^\|/.test(lines[i]); i++)
        if (!/^\|[\s|:-]+\|$/.test(lines[i]))
          rows.push(
            lines[i]
              .replace(/^\||\|$/g, "")
              .split(/(?<!\\)\|/)
              .map((c) => c.trim().replace(/\\\|/g, "|")),
          );
      const [head, ...body] = rows;
      out.push(
        `<div class="sbb-tab"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
      );
    } else if (/^\s*(-|\d+\.) /.test(L)) {
      const items = [];
      for (; i < lines.length && lines[i].trim() !== ""; i++) {
        if (/^\s*```/.test(lines[i])) break;
        if (/^(-|\d+\.) /.test(lines[i]))
          items.push(lines[i].replace(/^(-|\d+\.) /, ""));
        else if (/^\s+\S/.test(lines[i]) && items.length)
          items[items.length - 1] += " " + lines[i].trim();
        else if (/^\s+(-|\d+\.) /.test(lines[i]))
          items[items.length - 1] += " " + lines[i].trim();
        else break;
      }
      out.push(
        `<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`,
      );
    } else if (L.trim() === "") i++;
    else {
      const p = [];
      for (
        ;
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^(#|\||\s*```|- |\d+\. )/.test(lines[i]);
        i++
      )
        p.push(lines[i].trim());
      out.push(`<p>${inline(p.join(" "))}</p>`);
    }
  }
  return out.join("");
}

export async function openSeriatBible() {
  const open = document.querySelector(".sbb-win");
  if (open) return; // (one at a time)
  const done = openWindow(
    `<h2>${esc(LANG)} bible</h2><div class="sbb-page" tabindex="0"><p>Loading &hellip;</p></div>`,
    {
      cls: "sbb-win",
      onOpen(w) {
        const page = w.querySelector(".sbb-page");
        (text
          ? Promise.resolve(text)
          : fetch(URL_)
              .then((r) => (r.ok ? r.text() : Promise.reject()))
              .then((t) => (text = t))
        )
          .then((t) => {
            page.innerHTML = bibleHTML(t);
            foldHeads(page, "h1, h2, h3", (h) => +h.tagName[1], folded);
          })
          .catch(
            () =>
              (page.innerHTML =
                "<p>The bible would not load. Check your connection and open it again.</p>"),
          );
      },
    },
  );
  return done;
}
