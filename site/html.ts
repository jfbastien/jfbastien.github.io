// Section-specific HTML renderers.
// Pure functions producing HTML that matches the hand-authored index.html.

import { type Entry, type Section, type SiteMeta, inline, parseEntries } from "./parse.ts";

// --- Entry type discrimination ---

const hasBlockquote = (e: Entry): boolean => e.blockquoteLines.length > 0;
const hasUnorderedList = (e: Entry): boolean => e.body.startsWith("- ") || e.body.includes("\n- ");
const hasOrderedList = (e: Entry): boolean => e.body.startsWith("0. ") || e.body.includes("\n0. ");

// --- Body rendering: each non-blank line → <p>, list items → <ul> ---

function renderBodyParagraphs(body: string): string {
  if (body === "") return "";

  const lines = body.split("\n");
  const parts: string[] = [];
  let listItems: string[] = [];

  const flushList = (): void => {
    if (listItems.length === 0) return;
    const items = listItems.map((item) => `<li>${inline(item)}`).join("\n                ");
    parts.push(`<ul>\n                ${items}\n              </ul>`);
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (listItems.length > 0 && line === "") {
      flushList();
    } else if (listItems.length > 0) {
      listItems.push(line);
    } else if (line !== "") {
      parts.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();

  return parts.join("\n              ");
}

// --- Entry renderers ---

function renderFullEntry(entry: Entry): string {
  const whereParts = [
    `<h3>${inline(entry.heading)}</h3>`,
    ...entry.blockquoteLines.map((line) => `<p>${inline(line)}</p>`),
  ];
  return `          <div class=entry>
            <div class=where>${whereParts.join("\n              ")}
            </div>
            <div class=what>
              ${renderBodyParagraphs(entry.body)}
            </div>
          </div>`;
}

function renderShortEntry(entry: Entry): string {
  return `          <div class="short entry">
            <div class=where><h3>${inline(entry.heading)}</h3>
              <p>${Bun.escapeHTML(entry.blockquoteLines[0])}</p>
            </div>
            <div class=what>
              ${renderBodyParagraphs(entry.body)}
            </div>
          </div>`;
}

function renderListEntry(entry: Entry): string {
  const items = entry.body.split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => `<li>${inline(l.slice(2))}`)
    .join("\n                ");
  return `          <div class=entry>
            <div class=where><h3>${inline(entry.heading)}</h3>
            </div>
            <div class=what>
              <ul>
                ${items}
              </ul>
            </div>
          </div>`;
}

function renderNumberedEntry(entry: Entry): string {
  const items = entry.body.split("\n")
    .filter((l) => l.startsWith("0. "))
    .map((l) => `<li>${inline(l.slice(3))}`)
    .join("\n                ");
  return `          <div class=entry>
            <div class=where><h3>${inline(entry.heading)}</h3>
            </div>
            <div class=what>
              <ol start="0">
                ${items}
              </ol>
            </div>
          </div>`;
}

function renderPatentEntry(entry: Entry): string {
  const whatParts = [`<p class=patent-title>${inline(entry.blockquoteLines[0])}</p>`];
  if (entry.blockquoteLines.length > 1) {
    whatParts.push(`<p class=patent-filings>${inline(entry.blockquoteLines[1])}</p>`);
  }
  return `          <div class="entry patent">
            <div class=where><h3>${inline(entry.heading)}</h3></div>
            <div class=what>
              ${whatParts.join("\n              ")}
            </div>
          </div>`;
}

// --- Section renderers ---

function renderProse(section: Section): string {
  return `      <article>
        <h2>${Bun.escapeHTML(section.title)}</h2>
        ${Bun.markdown.html(section.raw.trim()).trim()}
      </article>`;
}

function gridSection(title: string, entries: readonly Entry[], renderEntry: (e: Entry) => string): string {
  return `      <article>
        <h2>${Bun.escapeHTML(title)}</h2>
        <div class=grid>
${entries.map(renderEntry).join("\n")}
        </div>
      </article>`;
}

function renderPublications(section: Section): string {
  const entries = parseEntries(section.raw);
  return gridSection(section.title, entries, (entry) => {
    if (hasOrderedList(entry)) return renderNumberedEntry(entry);
    if (hasUnorderedList(entry) && !hasBlockquote(entry)) return renderListEntry(entry);
    return renderShortEntry(entry);
  });
}

// --- Section dispatch (known titles only — unknown throws) ---

const sectionRenderers: Record<string, (section: Section) => string> = {
  "Work Experience": (s) => gridSection(s.title, parseEntries(s.raw), renderFullEntry),
  "Education": (s) => gridSection(s.title, parseEntries(s.raw), renderFullEntry),
  "Selected Publications & Public Speaking": renderPublications,
  "Patents": (s) => gridSection(s.title, parseEntries(s.raw), renderPatentEntry),
};

export function renderSection(section: Section): string {
  const hasH3 = parseEntries(section.raw).length > 0;
  if (!hasH3) return renderProse(section);

  const renderer = sectionRenderers[section.title];
  if (!renderer) throw new Error(`Unknown section with entries: "${section.title}"`);
  return renderer(section);
}

// --- Header + Footer ---

export function renderHeader(meta: SiteMeta): string {
  const socialLines = meta.social.map((s) => {
    const rel = s.rel ? ` rel="${s.rel}"` : "";
    return `        <p> ${s.icon} <a href="${s.url}"${rel}>${Bun.escapeHTML(s.label)}</a></p>`;
  });
  return `    <header>
      <h1>${Bun.escapeHTML(meta.name)}</h1>
      <div>
        <p>${Bun.escapeHTML(meta.tagline)}</p>
${socialLines.join("\n")}
      </div>
    </header>`;
}

export function renderFooter(meta: SiteMeta): string {
  return `    <footer>
      <p>${Bun.escapeHTML(meta.name)} · ${Bun.escapeHTML(meta.tagline)} · <a href="mailto:${meta.email}" rel="me">${Bun.escapeHTML(meta.email)}</a></p>
    </footer>`;
}
