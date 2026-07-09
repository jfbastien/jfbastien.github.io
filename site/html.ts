import { attrs } from "./attrs.ts";
import { type Entry, inline, parseEntries, type Section, type SiteMeta } from "./parse.ts";

export interface RenderedSection {
  readonly id: string;
  readonly title: string;
  readonly html: string;
}

const hasBlockquote = (e: Entry): boolean => e.blockquoteLines.length > 0;
const hasUnorderedList = (e: Entry): boolean => e.body.startsWith("- ") || e.body.includes("\n- ");
const hasOrderedList = (e: Entry): boolean => e.body.startsWith("0. ") || e.body.includes("\n0. ");

function slugBase(s: string): string {
  const slug = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug === "" ? "record" : slug;
}

function createSlugger(): (s: string) => string {
  const seen = new Map<string, number>();
  return (s: string): string => {
    const base = slugBase(s);
    const next = (seen.get(base) ?? 0) + 1;
    seen.set(base, next);
    return next === 1 ? base : `${base}-${next}`;
  };
}

function sentenceCaseKind(kind: string): string {
  if (kind === "github") return "GitHub";
  return kind
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeTag(datetime: string): string {
  return `<time${attrs([["datetime", datetime]])}>${Bun.escapeHTML(datetime)}</time>`;
}

function plainText(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<sup>(.*?)<\/sup>/g, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/[*_~]/g, "")
    .replace(/&amp;/g, "&")
    .trim();
}

function cellCount(md: string): number {
  return [...plainText(md)].length;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function styleVars(vars: readonly (readonly [string, string | number | undefined])[]): string | undefined {
  const rendered = vars
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `--${name}:${value}`)
    .join(";");
  return rendered === "" ? undefined : rendered;
}

function registerCells(values: readonly string[], min: number, max: number): number {
  return clamp(Math.max(0, ...values.map(cellCount)), min, max);
}

function leaderControlCells(values: readonly string[], min: number, max: number, leaderCells: number): number {
  return registerCells(values, min, max) + 1 + leaderCells;
}

function entryPlateCells(entries: readonly Entry[], min: number, max: number): number {
  return registerCells(entries.flatMap((entry) => [entry.heading, ...entry.blockquoteLines]), min, max);
}

function fieldGap(cells: number): number {
  return cells <= 18 ? 3 : 2;
}

function renderBulletItem(item: string): string {
  return `<li>${inline(item)}</li>`;
}

function renderBodyParagraphs(body: string): string {
  if (body === "") return "";

  const lines = body.split("\n");
  const parts: string[] = [];
  let listItems: string[] = [];

  const flushList = (): void => {
    if (listItems.length === 0) return;
    const items = listItems.map(renderBulletItem).join("\n              ");
    parts.push(`<ul${attrs([["class", "bullet-list"]])}>\n              ${items}\n            </ul>`);
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (listItems.length > 0 && line === "") {
      flushList();
    } else if (listItems.length > 0) {
      listItems[listItems.length - 1] += ` ${line.trim()}`;
    } else if (line !== "") {
      parts.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();

  return parts.join("\n            ");
}

// An open-ended interval uses ISO 8601-2 notation: `2025-06/..` reads "ongoing".
function endTerm(end: string): string {
  return end === ".." ? ".." : timeTag(end);
}

function renderTerm(raw: string): string {
  const monthRange = raw.match(/^(\d{4}-\d{2})\/(\d{4}-\d{2}|\.\.)$/);
  if (monthRange) {
    const [, start, end] = monthRange;
    return `${timeTag(start)}/${endTerm(end)}`;
  }

  const yearRange = raw.match(/^(\d{4})\/(\d{4}|\.\.)$/);
  if (yearRange) {
    const [, start, end] = yearRange;
    return `${timeTag(start)}/${endTerm(end)}`;
  }

  if (/^\d{4}$/.test(raw)) {
    return timeTag(raw);
  }

  return inline(raw);
}

function metaParagraph(className: string, html: string | undefined): string {
  if (!html) return "";
  return `<p${attrs([["class", className]])}>${html}</p>`;
}

function recordAttrs(kind: string, id: string, compact = false): string {
  return attrs([
    ["class", `record record--${kind}${compact ? " record--compact" : ""}`],
    ["id", id],
  ]);
}

function fullRecordAttrs(kind: string, id: string, compact = false): string {
  return attrs([
    ["class", `record record--${kind} record--full${compact ? " record--compact" : ""}`],
    ["id", id],
  ]);
}

function renderCareerEntry(entry: Entry, slug: (s: string) => string): string {
  const [role, term] = entry.blockquoteLines;
  const id = slug(entry.heading);
  return `          <article${recordAttrs("service", id)}>
            <header${attrs([["class", "record__head"]])}>
              <h3${attrs([["class", "record__title"]])}>${inline(entry.heading)}</h3>
              ${metaParagraph("record__role", role ? inline(role) : undefined)}
              ${metaParagraph("record__term", term ? renderTerm(term) : undefined)}
            </header>
            <div${attrs([["class", "record__body"]])}>
            ${renderBodyParagraphs(entry.body)}
            </div>
          </article>`;
}

function renderEducationEntry(entry: Entry, slug: (s: string) => string): string {
  const [degree, field, term] = entry.blockquoteLines;
  const id = slug(entry.heading);
  return `          <article${recordAttrs("education", id)}>
            <header${attrs([["class", "record__head"]])}>
              <h3${attrs([["class", "record__title"]])}>${inline(entry.heading)}</h3>
              ${metaParagraph("record__degree", degree ? inline(degree) : undefined)}
              ${metaParagraph("record__field", field ? inline(field) : undefined)}
              ${metaParagraph("record__term", term ? renderTerm(term) : undefined)}
            </header>
            <div${attrs([["class", "record__body"]])}>
            ${renderBodyParagraphs(entry.body)}
            </div>
          </article>`;
}

function renderPatentEntry(entry: Entry, slug: (s: string) => string): string {
  const [title, family] = entry.blockquoteLines;
  const id = slug(plainText(entry.heading));
  const body = [
    title ? `<p${attrs([["class", "patent-title"]])}>${inline(title)}</p>` : "",
    family ? `<p${attrs([["class", "patent-family"]])}>${inline(family)}</p>` : "",
  ].filter(Boolean).join("\n              ");
  return `          <article${recordAttrs("patent", id, true)}>
            <h3${attrs([["class", "record__title"]])}>${inline(entry.heading)}</h3>
            <div${attrs([["class", "record__body"]])}>
              ${body}
            </div>
          </article>`;
}

interface DocketItem {
  readonly code: string;
  readonly href: string;
  readonly title: string;
}

function parseDocketItem(item: string): DocketItem | undefined {
  const match = item.match(/^\[([A-Z]\d+[A-Za-z0-9]*)\]\(([^)]+)\)\s+(.+)$/);
  if (!match) return undefined;
  const [, code, href, title] = match;
  return { code: code!, href: href!, title: title! };
}

function renderDocketItem(item: string, parsed: DocketItem | undefined): string {
  if (!parsed) return `<li>${inline(item)}</li>`;
  return `<li><a${attrs([["href", parsed.href]])}><span${attrs([["class", "doc-code"]])}>${Bun.escapeHTML(parsed.code)}</span><span${attrs([["class", "doc-title"]])}>${inline(parsed.title)}</span></a></li>`;
}

// Print lays each docket panel's 96ch A4 content box into two 46ch grid
// columns; a title's print measure is that column minus the derived code cell
// and its 1ch gap. Monospace makes renderer-side line counting exact.
const docketPrintColumnCells = 46;

function wrappedLineCount(text: string, measure: number): number {
  let lines = 1;
  let column = 0;
  for (const word of plainText(text).split(" ")) {
    const width = [...word].length;
    if (column > 0 && column + 1 + width > measure) {
      lines += 1;
      column = width;
    } else {
      column += column > 0 ? 1 + width : width;
    }
  }
  return lines;
}

// Print flows the docket down one column, then wraps into the second at
// the container height. Find the smallest height where the remainder
// still fits, so the two columns balance.
function balancedDocketLines(lineCounts: readonly number[]): number {
  const total = lineCounts.reduce((sum, lines) => sum + lines, 0);
  for (let height = Math.ceil(total / 2); ; height++) {
    let column = 0;
    let used = 0;
    let fits = true;
    for (const lines of lineCounts) {
      if (used + lines > height) {
        column += 1;
        used = 0;
        if (column > 1 || lines > height) {
          fits = false;
          break;
        }
      }
      used += lines;
    }
    if (fits) return height;
  }
}

function renderUnorderedListEntry(entry: Entry, slug: (s: string) => string): string {
  const id = slug(entry.heading);
  const rawItems = entry.body.split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2));
  const parsedItems = rawItems.map(parseDocketItem);
  const codeCells = registerCells(parsedItems.map((parsed) => parsed?.code ?? ""), 5, 7);
  const titleCells = docketPrintColumnCells - codeCells - 1;
  const docketLines = balancedDocketLines(
    rawItems.map((item, index) => wrappedLineCount(parsedItems[index]?.title ?? item, titleCells)),
  );
  const items = rawItems
    .map((item, index) => renderDocketItem(item, parsedItems[index]))
    .join("\n                ");
  return `          <article${fullRecordAttrs("docket", id, true)}>
            <header${attrs([["class", "record__head"]])}>
              <h4${attrs([["class", "record__title"]])}>${inline(entry.heading)}</h4>
            </header>
            <div${attrs([["class", "record__body"]])}>
              <ul${attrs([["class", "docket-list"], ["style", styleVars([["docket-code-cols", `${codeCells}ch`], ["docket-lines", docketLines]])]])}>
                ${items}
              </ul>
            </div>
          </article>`;
}

function markdownHref(item: string): string | undefined {
  const match = item.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (!match) return undefined;
  return match[2]!;
}

function compactUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/\?.*$/, "")
    .replace(/\/$/, "");
}

function renderSeriesItem(item: string, index: number): string {
  const link = markdownHref(item);
  const printUrl = link
    ? `<span${attrs([["class", "series-url print-only"]])}>${Bun.escapeHTML(compactUrl(link))}</span>`
    : "";
  return `<li><span${attrs([["class", "series-index"], ["aria-hidden", true]])}>${String(index).padStart(2, "0")}</span><span${attrs([["class", "series-title"]])}>${inline(item)}</span>${printUrl}</li>`;
}

function renderOrderedListEntry(entry: Entry, slug: (s: string) => string): string {
  const id = slug(entry.heading);
  const rawItems = entry.body.split("\n")
    .filter((line) => line.startsWith("0. "))
    .map((line) => line.slice(3));
  const indexCells = Math.max(2, String(Math.max(0, rawItems.length - 1)).length);
  const items = rawItems
    .map((item, index) => renderSeriesItem(item, index))
    .join("\n                ");
  return `          <article${fullRecordAttrs("series", id, true)}>
            <header${attrs([["class", "record__head"]])}>
              <h4${attrs([["class", "record__title"]])}>${inline(entry.heading)}</h4>
            </header>
            <div${attrs([["class", "record__body"]])}>
              <ol${attrs([["start", 0], ["class", "series-list"], ["style", styleVars([["series-index-cols", `${indexCells}ch`]])]])}>
                ${items}
              </ol>
            </div>
          </article>`;
}

const publicationKinds: ReadonlyMap<string, "paper" | "talk" | "podcast"> = new Map([
  ["arXiv", "paper"],
  ["PLDI", "paper"],
  ["ASPLOS", "paper"],
  ["TACAS", "paper"],
  ["CppCast", "podcast"],
  ["NDC TechTown", "talk"],
  ["C++onSea", "talk"],
  ["C++Online", "talk"],
  ["Autosar", "talk"],
  ["C++Now", "talk"],
  ["WWDC", "talk"],
  ["LLVM", "talk"],
  ["EuroLLVM", "talk"],
  ["CppCon", "talk"],
  ["UTokyo", "talk"],
  ["SAE", "talk"],
  ["eSOL", "talk"],
]);

function publicationKind(entry: Entry): "paper" | "talk" | "podcast" {
  const kind = publicationKinds.get(entry.heading);
  if (!kind) {
    throw new Error(`Unknown Public Record venue: "${entry.heading}"; classify it in publicationKinds`);
  }
  return kind;
}

function artifactParts(body: string): { readonly title: string; readonly notes: readonly string[] } {
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  return { title: lines[0] ?? "", notes: lines.slice(1) };
}

function renderArtifactRow(entry: Entry, slug: (s: string) => string): string {
  const [year] = entry.blockquoteLines;
  const kind = publicationKind(entry);
  const { title, notes } = artifactParts(entry.body);
  const derivedNotes = kind === "podcast" && !notes.some((note) => /\bpodcast\b/i.test(note))
    ? ["Podcast."]
    : [];
  const id = slug(`${entry.heading}-${year ?? kind}`);
  const noteHtml = [...notes, ...derivedNotes]
    .map((note) => `<span${attrs([["class", "artifact-note"]])}>${inline(note)}</span>`)
    .join("");
  return `              <li${attrs([["id", id]])}>
                <span${attrs([["class", "artifact-year"]])}>${year ? renderTerm(year) : ""}</span>
                <span${attrs([["class", "artifact-venue"]])}>${inline(entry.heading)}</span>
                <span${attrs([["class", "artifact-title"]])}>${inline(title)}${noteHtml}</span>
              </li>`;
}

function renderPublicationSection(entries: readonly Entry[], slug: (s: string) => string): string {
  const papers: Entry[] = [];
  const artifacts: Entry[] = [];
  const standards: string[] = [];
  const series: string[] = [];

  for (const entry of entries) {
    if (hasOrderedList(entry)) {
      series.push(renderOrderedListEntry(entry, slug));
    } else if (hasUnorderedList(entry) && !hasBlockquote(entry)) {
      standards.push(renderUnorderedListEntry(entry, slug));
    } else if (publicationKind(entry) === "paper") {
      papers.push(entry);
    } else {
      artifacts.push(entry);
    }
  }

  const groups: string[] = [];
  if (papers.length > 0) {
    const controlCells = leaderControlCells(papers.map((entry) => entry.heading), 4, 10, 6);
    groups.push(`        <div${attrs([["class", "artifact-group"]])}>
          <h3${attrs([["class", "artifact-group__title"]])}>Papers</h3>
          <ol${attrs([["class", "artifact-ledger artifact-ledger--papers"], ["style", styleVars([["artifact-control-cols", `${controlCells}ch`]])]])}>
${papers.map((entry) => renderArtifactRow(entry, slug)).join("\n")}
          </ol>
        </div>`);
  }
  if (artifacts.length > 0) {
    const controlCells = leaderControlCells(artifacts.map((entry) => entry.heading), 6, 18, 6);
    groups.push(`        <div${attrs([["class", "artifact-group"]])}>
          <h3${attrs([["class", "artifact-group__title"]])}>Talks</h3>
          <ol${attrs([["class", "artifact-ledger artifact-ledger--talks"], ["style", styleVars([["artifact-control-cols", `${controlCells}ch`]])]])}>
${artifacts.map((entry) => renderArtifactRow(entry, slug)).join("\n")}
          </ol>
        </div>`);
  }
  if (standards.length > 0) {
    groups.push(`        <div${attrs([["class", "artifact-group"]])}>
          <h3${attrs([["class", "artifact-group__title"]])}>Standards Docket</h3>
          <div${attrs([["class", "records"]])}>
${standards.join("\n")}
          </div>
        </div>`);
  }
  if (series.length > 0) {
    groups.push(`        <div${attrs([["class", "artifact-group"]])}>
          <h3${attrs([["class", "artifact-group__title"]])}>Ongoing Series</h3>
          <div${attrs([["class", "records"]])}>
${series.join("\n")}
          </div>
        </div>`);
  }

  return groups.join("\n");
}

function renderRecords(entries: readonly Entry[], renderEntry: (entry: Entry) => string, className = "records", style?: string): string {
  return `        <div${attrs([["class", className], ["style", style]])}>
${entries.map(renderEntry).join("\n")}
        </div>`;
}

function renderPlateSection(
  entries: readonly Entry[],
  min: number,
  max: number,
  renderEntry: (entry: Entry) => string,
): string {
  const cells = entryPlateCells(entries, min, max);
  return renderRecords(entries, renderEntry, "records", styleVars([
    ["record-head-cols", `${cells}ch`],
    ["record-gap", `${fieldGap(cells)}ch`],
  ]));
}

function renderSectionBody(section: Section, slug: (s: string) => string): string {
  const entries = parseEntries(section.raw);
  if (entries.length === 0) {
    return `        <div${attrs([["class", "prose"]])}>
          ${Bun.markdown.html(section.raw.trim()).trim()}
        </div>`;
  }

  switch (section.title) {
    case "Service Record":
      return renderPlateSection(entries, 18, 24, (entry) => renderCareerEntry(entry, slug));
    case "Education":
      return renderPlateSection(entries, 14, 20, (entry) => renderEducationEntry(entry, slug));
    case "Public Record":
      return renderPublicationSection(entries, slug);
    case "Patent Register":
      return renderRecords(
        entries,
        (entry) => renderPatentEntry(entry, slug),
        "records",
        styleVars([["patent-id-cols", `${entryPlateCells(entries, 12, 18)}ch`]]),
      );
    default:
      throw new Error(`Unknown entry section: "${section.title}"`);
  }
}

export function renderSections(sections: readonly Section[]): readonly RenderedSection[] {
  const slug = createSlugger();
  return sections.map((section) => {
    const id = slug(section.title);
    const titleId = `${id}-title`;
    const html = `      <section${attrs([
      ["class", "panel section"],
      ["id", id],
      ["aria-labelledby", titleId],
    ])}>
        <h2${attrs([["class", "panel__title"], ["id", titleId]])}><span${attrs([["class", "section__counter"], ["aria-hidden", true]])}></span><span>${Bun.escapeHTML(section.title)}</span></h2>
${renderSectionBody(section, slug)}
      </section>`;
    return { id, title: section.title, html };
  });
}

export function renderIndex(sections: readonly RenderedSection[]): string {
  const indexed = [...sections, { id: "dispatch", title: "Dispatch", html: "" }];
  const items = indexed.map((section, i) => {
    const number = String(i + 1).padStart(2, "0");
    return `          <li><a${attrs([["href", `#${section.id}`]])}>${Bun.escapeHTML(section.title)}</a><span>${number}</span></li>`;
  }).join("\n");
  return `      <nav${attrs([["class", "panel record-index"], ["aria-labelledby", "record-index-title"]])}>
        <h2${attrs([["class", "panel__title"], ["id", "record-index-title"]])}><span>Record Index</span></h2>
        <ol>
${items}
        </ol>
      </nav>`;
}

export function renderHeader(meta: SiteMeta): string {
  const primaryContact = meta.social.find((s) => s.kind === "email") ?? meta.social[0];
  const rows: readonly [term: string, value: string | undefined, className?: string][] = [
    ["Name", `<h1${attrs([["class", "wordmark"], ["id", "site-title"]])}>${Bun.escapeHTML(meta.name)}</h1>`, "name"],
    ["URI", `<a${attrs([["href", meta.url]])}>${Bun.escapeHTML(meta.url.replace(/^https?:\/\//, ""))}</a>`, "uri"],
    ["Work", Bun.escapeHTML(meta.tagline), "work"],
    ["Location", `<span${attrs([["lang", "ja"]])}>${Bun.escapeHTML(meta.location)}</span>`, "location"],
    ["Contact", primaryContact ? `<a${attrs([["href", primaryContact.url], ["rel", primaryContact.rel]])}>${Bun.escapeHTML(primaryContact.label)}</a>` : undefined, "contact"],
  ];
  const register = rows
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([term, value, className]) => `<div${attrs([["class", className]])}><dt>${Bun.escapeHTML(term)}</dt><dd>${value}</dd></div>`)
    .join("\n          ");

  return `      <header${attrs([["class", "panel masthead"], ["aria-labelledby", "site-title"]])}>
        <dl>
          ${register}
        </dl>
      </header>`;
}

export function renderDispatch(meta: SiteMeta): string {
  const contactRows = meta.social.map((s) => {
    const aAttrs = attrs([["href", s.url], ["rel", s.rel]]);
    return `          <li><span>${sentenceCaseKind(s.kind)}</span><a${aAttrs}>${Bun.escapeHTML(s.label)}</a></li>`;
  }).join("\n");

  return `      <section${attrs([["class", "panel dispatch"], ["id", "dispatch"], ["aria-labelledby", "dispatch-title"]])}>
        <h2${attrs([["class", "panel__title"], ["id", "dispatch-title"]])}><span>Dispatch</span></h2>
        <ul${attrs([["class", "dispatch-list"]])}>
${contactRows}
        </ul>
      </section>`;
}

export function renderFooter(meta: SiteMeta): string {
  return `      <p${attrs([["class", "endmark"], ["lang", "ja"], ["role", "img"], ["aria-label", "End"]])}>以上</p>
      <footer${attrs([["class", "site-footer"]])}>
        <p${attrs([["class", "tracked"]])}>End of Record</p>
        <p${attrs([["class", "site-footer__line"]])}><span${attrs([["class", "site-footer__item"]])}>${Bun.escapeHTML(meta.name)}</span><span${attrs([["class", "site-footer__item"]])}><span${attrs([["aria-hidden", true]])}>· </span>${Bun.escapeHTML(meta.tagline)}</span><span${attrs([["class", "site-footer__item"]])}><span${attrs([["aria-hidden", true]])}>· </span><a${attrs([["href", `mailto:${meta.email}`], ["rel", "me"]])}>${Bun.escapeHTML(meta.email)}</a></span></p>
      </footer>`;
}
