// Section-specific HTML renderers.
// Each renderer is a pure function producing HTML that matches the hand-authored index.html.

import { type Entry, type Section, type SiteMeta, inline, parseEntries } from "./parse.ts";

// --- Entry type discrimination ---

function hasBlockquote(entry: Entry): boolean {
  return entry.blockquoteLines.length > 0;
}

function hasUnorderedList(entry: Entry): boolean {
  return entry.body.includes("\n- ") || entry.body.startsWith("- ");
}

function hasOrderedList(entry: Entry): boolean {
  return entry.body.includes("\n0. ") || entry.body.startsWith("0. ");
}

// --- Inline markdown for body paragraphs ---

function renderBodyParagraphs(body: string): string {
  if (body === "") return "";

  const lines = body.split("\n");
  const parts: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = (): void => {
    if (listItems.length > 0) {
      const items = listItems.map((item) => `<li>${inline(item)}`).join("\n                ");
      parts.push(`<ul>\n                ${items}\n              </ul>`);
      listItems = [];
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("- ")) {
      inList = true;
      listItems.push(line.slice(2));
    } else if (inList && line === "") {
      flushList();
    } else if (inList) {
      listItems.push(line);
    } else if (line !== "") {
      parts.push(`<p>${inline(line)}</p>`);
    }
  }

  flushList();

  return parts.join("\n              ");
}

// --- Full entry renderer (Work Experience, Education) ---

function renderFullEntry(entry: Entry): string {
  const whereLines = [
    `<h3>${inline(entry.heading)}</h3>`,
    ...entry.blockquoteLines.map((line) => `<p>${inline(line)}</p>`),
  ];
  const whereContent = whereLines.join("\n              ");
  const whatContent = renderBodyParagraphs(entry.body);

  return `          <div class=entry>
            <div class=where>${whereContent}
            </div>
            <div class=what>
              ${whatContent}
            </div>
          </div>`;
}

// --- Short publication entry (has blockquote = year, paragraphs) ---

function renderShortEntry(entry: Entry): string {
  const year = Bun.escapeHTML(entry.blockquoteLines[0]);
  const whatContent = renderBodyParagraphs(entry.body);

  return `          <div class="short entry">
            <div class=where><h3>${inline(entry.heading)}</h3>
              <p>${year}</p>
            </div>
            <div class=what>
              ${whatContent}
            </div>
          </div>`;
}

// --- List entry (C++ Committee style — unordered list, no blockquote) ---

function renderListEntry(entry: Entry): string {
  const lines = entry.body.split("\n").filter((l) => l.startsWith("- "));
  const items = lines.map((line) => `<li>${inline(line.slice(2))}`).join("\n                ");

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

// --- Numbered list entry (Tokyo C++, TLB hit — ordered list starting at 0) ---

function renderNumberedEntry(entry: Entry): string {
  const lines = entry.body.split("\n").filter((l) => /^0\. /.test(l));
  const items = lines.map((line) => `<li>${inline(line.slice(3))}`).join("\n                ");

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

// --- Patent entry ---

function renderPatentEntry(entry: Entry): string {
  const title = entry.blockquoteLines[0];
  const filingsLine = entry.blockquoteLines.length > 1 ? entry.blockquoteLines[1] : null;

  const headingHtml = inline(entry.heading);
  const whatParts = [`<p class=patent-title>${inline(title)}</p>`];
  if (filingsLine) {
    whatParts.push(`<p class=patent-filings>${inline(filingsLine)}</p>`);
  }

  return `          <div class="entry patent">
            <div class=where><h3>${headingHtml}</h3></div>
            <div class=what>
              ${whatParts.join("\n              ")}
            </div>
          </div>`;
}

// --- Section renderers ---

function renderProse(section: Section): string {
  const bodyHtml = Bun.markdown.html(section.raw.trim());
  // Strip the wrapping <p>...</p> and re-wrap with our indentation
  const innerParagraphs = bodyHtml.trim();
  return `      <article>
        <h2>${Bun.escapeHTML(section.title)}</h2>
        ${innerParagraphs}
      </article>`;
}

function renderFullEntrySection(section: Section): string {
  const entries = parseEntries(section.raw);
  const entriesHtml = entries.map(renderFullEntry).join("\n");

  return `      <article>
        <h2>${Bun.escapeHTML(section.title)}</h2>
        <div class=grid>
${entriesHtml}
        </div>
      </article>`;
}

function renderPublications(section: Section): string {
  const entries = parseEntries(section.raw);
  const entriesHtml = entries.map((entry) => {
    if (hasOrderedList(entry)) return renderNumberedEntry(entry);
    if (hasUnorderedList(entry) && !hasBlockquote(entry)) return renderListEntry(entry);
    return renderShortEntry(entry);
  }).join("\n");

  return `      <article>
        <h2>${Bun.escapeHTML(section.title)}</h2>
        <div class=grid>
${entriesHtml}
        </div>
      </article>`;
}

function renderPatents(section: Section): string {
  const entries = parseEntries(section.raw);
  const entriesHtml = entries.map(renderPatentEntry).join("\n");

  return `      <article>
        <h2>${Bun.escapeHTML(section.title)}</h2>
        <div class=grid>
${entriesHtml}
        </div>
      </article>`;
}

// --- Section dispatch ---

export function renderSection(section: Section): string {
  const entries = parseEntries(section.raw);
  const hasH3 = entries.length > 0;

  if (!hasH3) return renderProse(section);
  if (section.title === "Work Experience") return renderFullEntrySection(section);
  if (section.title === "Education") return renderFullEntrySection(section);
  if (section.title === "Selected Publications & Public Speaking") return renderPublications(section);
  if (section.title === "Patents") return renderPatents(section);

  // Unknown section with entries — fall back to full entry
  return renderFullEntrySection(section);
}

// --- Header ---

export function renderHeader(meta: SiteMeta): string {
  const socialLines = meta.social.map((s) => {
    const relAttr = s.rel ? ` rel="${s.rel}"` : "";
    return `        <p> ${s.icon} <a href="${s.url}"${relAttr}>${Bun.escapeHTML(s.label)}</a></p>`;
  });

  return `    <header>
      <h1>${Bun.escapeHTML(meta.name)}</h1>
      <div>
        <p>${Bun.escapeHTML(meta.tagline)}</p>
${socialLines.join("\n")}
      </div>
    </header>`;
}

// --- Footer ---

export function renderFooter(meta: SiteMeta): string {
  return `    <footer>
      <p>${Bun.escapeHTML(meta.name)} · ${Bun.escapeHTML(meta.tagline)} · <a href="mailto:${meta.email}" rel="me">${Bun.escapeHTML(meta.email)}</a></p>
    </footer>`;
}
