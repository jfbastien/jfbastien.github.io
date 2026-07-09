import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "fs";
import { chmod } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { launchChrome, openPage } from "./chrome.ts";
import { parseFrontMatter } from "./parse.ts";

const root = join(import.meta.dir, "..");
const html = join(root, "_site", "index.html");
const out = join(tmpdir(), "jfbastien-print.pdf");
const maxPages = 8;
const minNonFinalInkRatio = 0.012;
const minNonFinalTextChars = 320;
const { meta } = parseFrontMatter(readFileSync(join(root, "content.md"), "utf-8"));
const footerPrefix = `${meta.name} · ${meta.tagline} · page `;

if (!existsSync(html)) {
  throw new Error(`${html} not found; run build:assemble first`);
}

function run(cmd: readonly string[]): string {
  const proc = Bun.spawnSync({ cmd: [...cmd], stdout: "pipe", stderr: "pipe" });
  const stdout = new TextDecoder().decode(proc.stdout);
  const stderr = new TextDecoder().decode(proc.stderr);
  if (proc.exitCode !== 0) {
    throw new Error(`${cmd.join(" ")} failed\n${stdout}${stderr}`.trim());
  }
  return stdout;
}

function requireMatch(text: string, pattern: RegExp, message: string): RegExpMatchArray {
  const match = text.match(pattern);
  if (!match) throw new Error(message);
  return match;
}

function readPnmInkRatio(path: string): number {
  const data = readFileSync(path);
  let offset = 0;

  function nextToken(): string {
    while (offset < data.length) {
      const byte = data[offset]!;
      if (byte === 0x23) {
        while (offset < data.length && data[offset] !== 0x0a) offset++;
      } else if (byte <= 0x20) {
        offset++;
      } else {
        break;
      }
    }
    const start = offset;
    while (offset < data.length && data[offset]! > 0x20) offset++;
    return data.subarray(start, offset).toString("ascii");
  }

  const magic = nextToken();
  if (magic !== "P5" && magic !== "P6") throw new Error(`${path}: expected P5/P6 PNM, got ${magic}`);
  const width = Number.parseInt(nextToken(), 10);
  const height = Number.parseInt(nextToken(), 10);
  const max = Number.parseInt(nextToken(), 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || max !== 255) {
    throw new Error(`${path}: unsupported PNM header`);
  }
  if (offset >= data.length || data[offset]! > 0x20) {
    throw new Error(`${path}: missing PNM raster separator`);
  }
  offset++;

  const channels = magic === "P6" ? 3 : 1;
  const pixels = width * height;
  let ink = 0;
  for (let pixel = 0; pixel < pixels; pixel++) {
    const at = offset + pixel * channels;
    const r = data[at]!;
    const g = channels === 3 ? data[at + 1]! : r;
    const b = channels === 3 ? data[at + 2]! : r;
    if (r < 248 || g < 248 || b < 248) ink++;
  }
  return ink / pixels;
}

const browser = await launchChrome();

try {
  const page = await openPage(browser, html);
  await page.emulateMediaType("print");

  if (existsSync(out)) await chmod(out, 0o644);
  await page.pdf({
    path: out,
    printBackground: true,
    preferCSSPageSize: true,
    format: "A4",
  });
  await chmod(out, 0o444);
} finally {
  await browser.close();
}

const info = run(["mutool", "info", out]);
const pages = Number.parseInt(requireMatch(info, /^Pages:\s+(\d+)$/m, "PDF page count missing")[1]!, 10);
if (pages < 1 || pages > maxPages) {
  throw new Error(`PDF has ${pages} pages; expected 1..${maxPages}`);
}
if (/\b(?:Arial|Courier|Helvetica|Noto|Times)\b/i.test(info)) {
  throw new Error(`PDF embeds a non-Berkeley fallback font:\n${info}`);
}

const extracted = run(["mutool", "draw", "-F", "txt", "-o", "-", out]);
const pageTexts = extracted.split("\f").slice(0, pages);
if (pageTexts.length !== pages) {
  throw new Error(`PDF text extraction yielded ${pageTexts.length} pages, expected ${pages}`);
}

// Orphan checks need lines in PAGE order, not extraction order: absolutely
// positioned elements (straddling panel titles) extract out of place, so
// sort structured-text lines by their y coordinate.
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&amp;/g, "&");
}

function contentLinesInPageOrder(pageXml: string): string[] {
  const lines: { readonly y: number; readonly text: string }[] = [];
  for (const line of pageXml.matchAll(/<line bbox="[\d.]+ ([\d.]+) [\d.]+ [\d.]+"[^>]*>(.*?)<\/line>/gs) ?? []) {
    const text = decodeEntities([...line[2]!.matchAll(/<char[^>]* c="([^"]*)"/g)].map((m) => m[1]!).join("")).trim();
    if (text !== "" && !text.startsWith(footerPrefix)) {
      lines.push({ y: Number.parseFloat(line[1]!), text });
    }
  }
  return lines.sort((a, b) => a.y - b.y).map((line) => line.text);
}

const structured = run(["mutool", "draw", "-F", "stext", "-o", "-", out]);
const pageXmls = [...structured.matchAll(/<page [^>]*>(.*?)<\/page>/gs)].map((m) => m[1]!);
if (pageXmls.length !== pages) {
  throw new Error(`PDF structured text yielded ${pageXmls.length} pages, expected ${pages}`);
}

// These patterns pin literal strings from content.md because only extracted
// text survives into the PDF — no DOM structure. When content.md gains a new
// short artifact note or metadata line, extend these patterns or the orphan
// check silently narrows.
const orphanPageStartPatterns: readonly (readonly [RegExp, string])[] = [
  [/^\.+$/, "leader continuation"],
  [/^\d{4}(?:-\d{2})?\/(?:\d{4}(?:-\d{2})?|\.\.)$/, "date metadata"],
  [/^(?:Podcast|Conference keynote|Best paper award)\.$/, "artifact note"],
  [/^(?:Re-published\b|328k views!)/, "artifact note"],
  [/^(?:EMAIL|WEB|X|MASTODON|BLUESKY|GITHUB)\b/, "dispatch row"],
];

const orphanPageEndPatterns: readonly (readonly [RegExp, string])[] = [
  [/^§\d{2}\s+\p{Lu}/u, "section heading"],
  [/^(?:PAPERS|TALKS|STANDARDS DOCKET|ONGOING SERIES|DISPATCH)$/, "group heading"],
];

for (let index = 0; index < pages; index++) {
  const expected = `${footerPrefix}${index + 1} of ${pages}`;
  if (!pageTexts[index]!.includes(expected)) {
    throw new Error(`PDF page ${index + 1} missing footer: ${expected}`);
  }

  const lines = contentLinesInPageOrder(pageXmls[index]!);
  const first = lines[0] ?? "";
  const last = lines[lines.length - 1] ?? "";
  for (const [pattern, label] of orphanPageStartPatterns) {
    if (pattern.test(first)) {
      throw new Error(`PDF page ${index + 1} starts with orphaned ${label}: ${first}`);
    }
  }
  for (const [pattern, label] of orphanPageEndPatterns) {
    if (pattern.test(last)) {
      throw new Error(`PDF page ${index + 1} ends with orphaned ${label}: ${last}`);
    }
  }
}
if (pageTexts.some((text) => text.includes("End of Record"))) {
  throw new Error("print output includes the screen footer");
}
if (pageTexts.some((text) => /\bURL\b/.test(text))) {
  throw new Error("print output includes repeated URL labels");
}
if (!pageTexts.some((text) => text.includes("youtu.be/FU5Tl_Zdtmw"))) {
  throw new Error("print series register is missing compact YouTube URLs");
}
if (!pageTexts.some((text) => text.includes("tlbh.it/006_fuzz.html"))) {
  throw new Error("print series register is missing compact TLB hit URLs");
}

const rasterDir = mkdtempSync(join(tmpdir(), "jfbastien-print-pages-"));
try {
  run(["mutool", "draw", "-q", "-r", "24", "-F", "pnm", "-o", join(rasterDir, "page-%d.pnm"), out]);
  const rasters = readdirSync(rasterDir).filter((name) => name.endsWith(".pnm")).sort();
  if (rasters.length !== pages) {
    throw new Error(`PDF raster audit rendered ${rasters.length} pages, expected ${pages}`);
  }
  for (let index = 0; index < pages - 1; index++) {
    const pageNumber = index + 1;
    const textChars = pageTexts[index]!.replace(/\s+/g, "").length;
    const inkRatio = readPnmInkRatio(join(rasterDir, `page-${pageNumber}.pnm`));
    if (textChars < minNonFinalTextChars || inkRatio < minNonFinalInkRatio) {
      throw new Error(
        `PDF page ${pageNumber} is too sparse: ${textChars} text chars, ${(inkRatio * 100).toFixed(2)}% ink`,
      );
    }
  }
} finally {
  rmSync(rasterDir, { recursive: true, force: true });
}

console.log(`✓ ${out} (${(Bun.file(out).size / 1024).toFixed(0)} KB, ${pages} pages audited)`);
