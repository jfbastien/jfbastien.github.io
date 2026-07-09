import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { codepointName, fontUsage, isWideCodepoint, uniqueCodepoints } from "./font-corpus.ts";
import { webFonts } from "./fonts.ts";
import { supplementalCopyright, supplementalVersion } from "./font-meta.ts";
import { launchChrome, openPage } from "./chrome.ts";
import { createHash } from "crypto";
import { brotliDecompressSync } from "zlib";

const root = join(import.meta.dir, "..");
const htmlPath = join(root, "index.html");

interface Table {
  readonly offset: number;
  readonly length: number;
}

interface FontData {
  readonly data: Buffer;
  table(tag: string): Table;
  u16(offset: number): number;
  i16(offset: number): number;
  u32(offset: number): number;
}

abstract class ParsedFont implements FontData {
  readonly tables = new Map<string, Table>();

  constructor(readonly data: Buffer) {}

  table(tag: string): Table {
    const table = this.tables.get(tag);
    if (!table) throw new Error(`font missing ${tag} table`);
    return table;
  }

  u16(offset: number): number {
    return this.data.readUInt16BE(offset);
  }

  i16(offset: number): number {
    return this.data.readInt16BE(offset);
  }

  u32(offset: number): number {
    return this.data.readUInt32BE(offset);
  }
}

class TrueTypeFont extends ParsedFont {
  constructor(data: Buffer) {
    super(data);
    const tableCount = this.u16(4);
    for (let i = 0; i < tableCount; i++) {
      const offset = 12 + i * 16;
      const tag = this.data.subarray(offset, offset + 4).toString("ascii");
      const table = { offset: this.u32(offset + 8), length: this.u32(offset + 12) };
      if (table.offset + table.length > this.data.length) {
        throw new Error(`${tag} table extends past end of font`);
      }
      this.tables.set(tag, table);
    }
  }
}

const woff2KnownTags = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post",
  "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT",
  "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea",
  "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH",
  "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar",
  "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop",
  "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
] as const;

class Woff2Font extends ParsedFont {
  constructor(data: Buffer, tableEntries: readonly { readonly tag: string; readonly length: number }[]) {
    super(data);
    let offset = 0;
    for (const entry of tableEntries) {
      this.tables.set(entry.tag, { offset, length: entry.length });
      offset += entry.length;
    }
    if (offset > this.data.length) throw new Error("WOFF2 tables extend past decompressed data");
  }
}

function readUIntBase128(data: Buffer, state: { offset: number }): number {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    if (state.offset >= data.length) throw new Error("truncated WOFF2 UIntBase128");
    const byte = data[state.offset++]!;
    if (i === 0 && byte === 0x80) throw new Error("invalid WOFF2 UIntBase128 leading 0x80");
    if (value & 0xfe000000) throw new Error("WOFF2 UIntBase128 overflow");
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
  throw new Error("WOFF2 UIntBase128 exceeds five bytes");
}

function parseWoff2(data: Buffer): Woff2Font {
  if (data.readUInt32BE(0) !== 0x774f4632) throw new Error("not a WOFF2 font");
  const numTables = data.readUInt16BE(12);
  const totalCompressedSize = data.readUInt32BE(20);
  const compressedOffset = 48;
  let directoryOffset = compressedOffset;
  const entries: { readonly tag: string; readonly length: number }[] = [];

  for (let i = 0; i < numTables; i++) {
    const flags = data.readUInt8(directoryOffset++);
    const tagIndex = flags & 0x3f;
    const tag = tagIndex === 0x3f
      ? (() => {
          const custom = data.subarray(directoryOffset, directoryOffset + 4).toString("ascii");
          directoryOffset += 4;
          return custom;
        })()
      : woff2KnownTags[tagIndex];
    if (!tag) throw new Error(`unknown WOFF2 tag index ${tagIndex}`);

    const state = { offset: directoryOffset };
    const originalLength = readUIntBase128(data, state);
    directoryOffset = state.offset;

    const transformVersion = flags >> 6;
    const transformed = tag === "glyf" || tag === "loca"
      ? transformVersion !== 3
      : transformVersion !== 0;
    const transformedLength = transformed ? readUIntBase128(data, state) : originalLength;
    directoryOffset = state.offset;
    entries.push({ tag, length: transformedLength });
  }

  const compressed = data.subarray(directoryOffset, directoryOffset + totalCompressedSize);
  return new Woff2Font(brotliDecompressSync(compressed), entries);
}

function isCombining(cp: number): boolean {
  return (0x0300 <= cp && cp <= 0x036f) ||
    (0x0483 <= cp && cp <= 0x0489) ||
    (0x1ab0 <= cp && cp <= 0x1aff) ||
    (0x1dc0 <= cp && cp <= 0x1dff) ||
    (0x20d0 <= cp && cp <= 0x20ff) ||
    (0xfe20 <= cp && cp <= 0xfe2f);
}

function parseFormat4(font: FontData, offset: number, cps: readonly number[]): ReadonlyMap<number, number> {
  const segCount = font.u16(offset + 6) / 2;
  const endCode = offset + 14;
  const startCode = endCode + segCount * 2 + 2;
  const idDelta = startCode + segCount * 2;
  const idRangeOffset = idDelta + segCount * 2;
  const mapped = new Map<number, number>();

  for (const cp of cps) {
    if (cp > 0xffff) continue;
    for (let i = 0; i < segCount; i++) {
      const end = font.u16(endCode + i * 2);
      if (cp > end) continue;
      const start = font.u16(startCode + i * 2);
      if (cp < start) break;

      const delta = font.i16(idDelta + i * 2);
      const rangeOffsetAt = idRangeOffset + i * 2;
      const rangeOffset = font.u16(rangeOffsetAt);
      const glyph = rangeOffset === 0
        ? (cp + delta) & 0xffff
        : (() => {
            const glyphIndexAt = rangeOffsetAt + rangeOffset + (cp - start) * 2;
            const raw = font.u16(glyphIndexAt);
            return raw === 0 ? 0 : (raw + delta) & 0xffff;
          })();

      if (glyph !== 0) mapped.set(cp, glyph);
      break;
    }
  }

  return mapped;
}

function parseFormat12(font: FontData, offset: number, cps: readonly number[]): ReadonlyMap<number, number> {
  const groupCount = font.u32(offset + 12);
  const mapped = new Map<number, number>();

  for (const cp of cps) {
    for (let i = 0; i < groupCount; i++) {
      const group = offset + 16 + i * 12;
      const start = font.u32(group);
      const end = font.u32(group + 4);
      if (cp < start) break;
      if (cp <= end) {
        mapped.set(cp, font.u32(group + 8) + cp - start);
        break;
      }
    }
  }

  return mapped;
}

function cmap(font: FontData, cps: readonly number[]): ReadonlyMap<number, number> {
  const table = font.table("cmap");
  const subtableCount = font.u16(table.offset + 2);
  const subtables: { readonly offset: number; readonly score: number }[] = [];

  for (let i = 0; i < subtableCount; i++) {
    const record = table.offset + 4 + i * 8;
    const platform = font.u16(record);
    const encoding = font.u16(record + 2);
    const offset = table.offset + font.u32(record + 4);
    const format = font.u16(offset);
    const score =
      platform === 3 && encoding === 10 && format === 12 ? 0 :
      platform === 0 && format === 12 ? 1 :
      platform === 3 && encoding === 1 && format === 4 ? 2 :
      platform === 0 && format === 4 ? 3 :
      99;
    if (score !== 99) subtables.push({ offset, score });
  }

  const remaining = new Set(cps);
  const mapped = new Map<number, number>();
  for (const subtable of subtables.sort((a, b) => a.score - b.score)) {
    if (remaining.size === 0) break;
    const format = font.u16(subtable.offset);
    const next = format === 12
      ? parseFormat12(font, subtable.offset, [...remaining])
      : parseFormat4(font, subtable.offset, [...remaining]);
    for (const [cp, glyph] of next) {
      mapped.set(cp, glyph);
      remaining.delete(cp);
    }
  }

  return mapped;
}

function advances(font: FontData): readonly number[] {
  const maxp = font.table("maxp");
  const hhea = font.table("hhea");
  const hmtx = font.table("hmtx");
  const glyphCount = font.u16(maxp.offset + 4);
  const metricCount = font.u16(hhea.offset + 34);
  const widths: number[] = [];

  for (let glyph = 0; glyph < glyphCount; glyph++) {
    const metric = glyph < metricCount ? glyph : metricCount - 1;
    widths.push(font.u16(hmtx.offset + metric * 4));
  }

  return widths;
}

function decodeUtf16BE(data: Buffer): string {
  let out = "";
  for (let offset = 0; offset + 1 < data.length; offset += 2) {
    out += String.fromCharCode(data.readUInt16BE(offset));
  }
  return out;
}

function nameRecords(font: FontData): ReadonlyMap<number, string> {
  const table = font.table("name");
  const count = font.u16(table.offset + 2);
  const stringOffset = table.offset + font.u16(table.offset + 4);
  const names = new Map<number, string>();

  for (let i = 0; i < count; i++) {
    const record = table.offset + 6 + i * 12;
    const platform = font.u16(record);
    const nameId = font.u16(record + 6);
    const length = font.u16(record + 8);
    const offset = font.u16(record + 10);
    const bytes = font.data.subarray(stringOffset + offset, stringOffset + offset + length);
    const value = platform === 0 || platform === 3 ? decodeUtf16BE(bytes) : bytes.toString("latin1");
    if (platform === 3 || !names.has(nameId)) names.set(nameId, value);
  }

  return names;
}

function checkNoSourceIdentifiers(names: ReadonlyMap<number, string>, label: string): void {
  for (const value of names.values()) {
    if (/TX-02|[A-Z0-9]{8}/.test(value)) {
      throw new Error(`${label}: name table contains source identifier ${JSON.stringify(value)}`);
    }
  }
  // nameID 0 (copyright) and 5 (version) are the vendor's pass-through fields;
  // the rename overwrites the others but not these. Allow only their expected
  // shapes, so a re-issued font cannot route an identifier through a field the
  // denylist above happens to miss.
  const copyright = names.get(0) ?? "";
  const version = names.get(5) ?? "";
  if (!/^Copyright /.test(copyright)) {
    throw new Error(`${label}: nameID 0 (copyright) has unexpected shape: ${JSON.stringify(copyright)}`);
  }
  if (!/^Version \d/.test(version)) {
    throw new Error(`${label}: nameID 5 (version) has unexpected shape: ${JSON.stringify(version)}`);
  }
}

function checkSupplementalNames(font: FontData, label: string): void {
  const names = nameRecords(font);
  const expected = new Map<number, string>([
    [0, supplementalCopyright],
    [1, "Dossier Mono Supplement"],
    [2, "Regular"],
    [3, "jfbastien.com;DossierMonoSupplement-Regular"],
    [4, "Dossier Mono Supplement Regular"],
    [5, supplementalVersion],
    [6, "DossierMonoSupplement-Regular"],
    [16, "Dossier Mono Supplement"],
    [17, "Regular"],
    [25, "DossierMonoSupplement"],
  ]);

  for (const [nameId, value] of expected) {
    const actual = names.get(nameId);
    if (actual !== value) {
      throw new Error(`${label}: nameID ${nameId} is ${JSON.stringify(actual)}, expected ${JSON.stringify(value)}`);
    }
  }
  checkNoSourceIdentifiers(names, label);
}

function primaryExpectedNames(subfamily: "Regular" | "Bold"): ReadonlyMap<number, string> {
  return new Map<number, string>([
    [1, "Berkeley Mono"],
    [2, subfamily],
    [3, `jfbastien.com;BerkeleyMono-${subfamily}`],
    [4, `Berkeley Mono ${subfamily}`],
    [6, `BerkeleyMono-${subfamily}`],
    [16, "Berkeley Mono"],
    [17, subfamily],
    [25, "BerkeleyMono"],
  ]);
}

function checkPrimaryNames(font: FontData, label: string, subfamily: "Regular" | "Bold" = "Regular"): void {
  const names = nameRecords(font);
  const expected = primaryExpectedNames(subfamily);

  for (const [nameId, value] of expected) {
    const actual = names.get(nameId);
    if (actual !== value) {
      throw new Error(`${label}: nameID ${nameId} is ${JSON.stringify(actual)}, expected ${JSON.stringify(value)}`);
    }
  }
  checkNoSourceIdentifiers(names, label);
}

function checkPrimaryStaticFont(
  file: string | undefined,
  subfamily: "Regular" | "Bold",
  primaryCovered: ReadonlySet<number>,
): readonly string[] {
  if (!file) throw new Error(`primary font manifest missing static ${subfamily} TTF`);
  const path = join(root, "fonts", file);
  if (!existsSync(path)) throw new Error(`${path} missing. Run bun run font:prepare locally.`);

  const font = new TrueTypeFont(readFileSync(path));
  checkPrimaryNames(font, file, subfamily);
  const { covered, badWidth } = collectCoverage(font, file, cps);
  const missing = [...primaryCovered].filter((cp) => !covered.has(cp));
  if (missing.length > 0) {
    throw new Error(`${file}: static instance embedded in the OG image is missing ${missing.length} glyph(s) the primary serves: ${missing.map(codepointName).join(", ")}`);
  }
  return badWidth;
}

function features(font: FontData): readonly string[] {
  const table = font.table("GSUB");
  const majorVersion = font.u16(table.offset);
  const minorVersion = font.u16(table.offset + 2);
  if (majorVersion !== 1) throw new Error(`unsupported GSUB version ${majorVersion}.${minorVersion}`);
  const featureListOffset = font.u16(table.offset + 6);
  const featureList = table.offset + featureListOffset;
  const featureCount = font.u16(featureList);
  const out: string[] = [];
  for (let i = 0; i < featureCount; i++) {
    const record = featureList + 2 + i * 6;
    out.push(font.data.subarray(record, record + 4).toString("ascii"));
  }
  return out;
}

function axisTags(font: FontData): readonly string[] {
  const table = font.table("fvar");
  const axisCount = font.u16(table.offset + 8);
  const axisSize = font.u16(table.offset + 10);
  const axes = table.offset + font.u16(table.offset + 4);
  const tags: string[] = [];
  for (let i = 0; i < axisCount; i++) {
    const offset = axes + i * axisSize;
    tags.push(font.data.subarray(offset, offset + 4).toString("ascii"));
  }
  return tags;
}

function checkPrimaryFeatures(font: FontData, label: string): void {
  const axes = axisTags(font);
  for (const axis of ["wght", "wdth", "slnt"]) {
    if (!axes.includes(axis)) throw new Error(`${label}: missing variable axis ${axis}`);
  }
  const gsubFeatures = features(font);
  if (!gsubFeatures.includes("calt")) {
    throw new Error(`${label}: missing GSUB calt feature`);
  }
}

function expectedAdvance(cp: number): number {
  return isCombining(cp) ? 0 : isWideCodepoint(cp) ? 1200 : 600;
}

function checkHashInName(file: string): void {
  const match = file.match(/^(.+)\.([0-9a-f]{16})\.woff2$/);
  if (!match) throw new Error(`${file}: expected content-hashed .woff2 filename`);
  const [, , expected] = match;
  const actual = createHash("sha256")
    .update(readFileSync(join(root, "fonts", file)))
    .digest("hex")
    .slice(0, 16);
  if (actual !== expected) {
    throw new Error(`${file}: hash prefix ${expected} does not match content ${actual}`);
  }
}

interface SupplementManifest {
  readonly version: 1;
  readonly glyphs: readonly {
    readonly codepoint: string;
    readonly char: string;
    readonly source: string;
  }[];
}

function supplementManifest(): SupplementManifest {
  const path = join(root, "fonts", "supplement.json");
  if (!existsSync(path)) throw new Error(`${path} missing. Run bun run font:prepare locally.`);
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as SupplementManifest;
  if (parsed.version !== 1) throw new Error(`${path}: unsupported supplement manifest version`);
  for (const glyph of parsed.glyphs) {
    if (!/^U\+[0-9A-F]{4,6}$/.test(glyph.codepoint)) {
      throw new Error(`${path}: invalid codepoint ${JSON.stringify(glyph.codepoint)}`);
    }
    if (glyph.char.length === 0) {
      throw new Error(`${path}: empty char for ${glyph.codepoint}`);
    }
    if (glyph.source.includes("/") || glyph.source.includes("\\")) {
      throw new Error(`${path}: source must be a family name, not a path: ${glyph.source}`);
    }
  }
  return parsed;
}

function collectCoverage(font: FontData, fontName: string, cps: readonly number[]): {
  readonly covered: ReadonlySet<number>;
  readonly badWidth: readonly string[];
} {
  const glyphs = cmap(font, cps);
  const widths = advances(font);
  const covered = new Set<number>();
  const badWidth: string[] = [];

  for (const [cp, glyph] of glyphs) {
    if (glyph <= 0 || glyph >= widths.length) continue;
    covered.add(cp);
    const adv = widths[glyph]!;
    const expected = expectedAdvance(cp);
    if (adv !== expected) {
      badWidth.push(`${fontName}: ${codepointName(cp)} advance ${adv}, expected ${expected}`);
    }
  }

  return { covered, badWidth };
}

const usage = await fontUsage(root);
const cps = uniqueCodepoints(usage.all).filter((cp) => cp >= 0x20);
const italicCps = uniqueCodepoints(usage.italic).filter((cp) => cp >= 0x20);
const covered = new Set<number>();
const coveredByKind = new Map<string, ReadonlySet<number>>();
const badWidth: string[] = [];

for (const webFont of webFonts) {
  const webFontPath = join(root, "fonts", webFont.file);
  const ttfPath = join(root, "fonts", webFont.ttf);

  if (!existsSync(webFontPath)) {
    throw new Error(`${webFontPath} missing. Run bun run font:prepare locally.`);
  }
  if (!existsSync(ttfPath)) {
    throw new Error(`${ttfPath} missing. Run bun run font:prepare locally.`);
  }
  checkHashInName(webFont.file);

  const ttfFont = new TrueTypeFont(readFileSync(ttfPath));
  const woff2Font = parseWoff2(readFileSync(webFontPath));
  const ttf = collectCoverage(ttfFont, webFont.ttf, cps);
  const woff2 = collectCoverage(woff2Font, webFont.file, cps);

  if (webFont.kind === "supplemental") {
    checkSupplementalNames(ttfFont, webFont.ttf);
    checkSupplementalNames(woff2Font, webFont.file);
  } else if (webFont.kind === "primary") {
    checkPrimaryNames(ttfFont, webFont.ttf);
    checkPrimaryNames(woff2Font, webFont.file);
    checkPrimaryFeatures(ttfFont, webFont.ttf);
    checkPrimaryFeatures(woff2Font, webFont.file);
    badWidth.push(...checkPrimaryStaticFont(webFont.staticTtf, "Regular", woff2.covered));
    badWidth.push(...checkPrimaryStaticFont(webFont.staticBoldTtf, "Bold", woff2.covered));
  }

  ttf.covered.forEach((cp) => covered.add(cp));
  coveredByKind.set(webFont.kind, woff2.covered);
  badWidth.push(...ttf.badWidth, ...woff2.badWidth);

  const ttfOnly = [...ttf.covered].filter((cp) => !woff2.covered.has(cp));
  const woff2Only = [...woff2.covered].filter((cp) => !ttf.covered.has(cp));
  if (ttfOnly.length > 0 || woff2Only.length > 0) {
    const parts = [];
    if (ttfOnly.length > 0) parts.push(`TTF-only codepoints in ${webFont.ttf}: ${ttfOnly.map(codepointName).join(", ")}`);
    if (woff2Only.length > 0) parts.push(`WOFF2-only codepoints in ${webFont.file}: ${woff2Only.map(codepointName).join(", ")}`);
    throw new Error(parts.join("\n"));
  }
}

const missing = cps.filter((cp) => !covered.has(cp)).map(codepointName);
const primaryCovered = coveredByKind.get("primary") ?? new Set<number>();
const expectedSupplementCps = cps.filter((cp) => !primaryCovered.has(cp)).sort((a, b) => a - b);
const actualSupplementCps = supplementManifest().glyphs
  .map((glyph) => Number.parseInt(glyph.codepoint.slice(2), 16))
  .sort((a, b) => a - b);
if (JSON.stringify(actualSupplementCps) !== JSON.stringify(expectedSupplementCps)) {
  throw new Error(
    `fonts/supplement.json does not match visible glyphs missing from Berkeley Mono:\n` +
    `expected ${expectedSupplementCps.map(codepointName).join(", ")}\n` +
    `actual ${actualSupplementCps.map(codepointName).join(", ")}`,
  );
}

if (missing.length > 0 || badWidth.length > 0) {
  const parts = [];
  if (missing.length > 0) parts.push(`Missing glyphs:\n${missing.join("\n")}`);
  if (badWidth.length > 0) parts.push(`Non-monospace glyphs:\n${badWidth.join("\n")}`);
  throw new Error(parts.join("\n\n"));
}

if (!existsSync(htmlPath)) {
  throw new Error(`${htmlPath} missing. Run bun run build:site before font:check.`);
}

const browser = await launchChrome();
try {
  const page = await openPage(browser, htmlPath);
  const client = await page.target().createCDPSession();
  await client.send("DOM.enable");
  await client.send("CSS.enable");

  const browserResult = await page.evaluate(
    (hexes, families) => {
      const bodyFamily = getComputedStyle(document.body).fontFamily;
      const loadedFaces = [...document.fonts]
        .filter((face) => families.includes(face.family.replace(/^["']|["']$/g, "")))
        .map((face) => `${face.family} ${face.style} ${face.weight} ${face.status}`);
      const missing: string[] = [];

      for (const hex of hexes) {
        const cp = Number.parseInt(hex, 16);
        const ch = String.fromCodePoint(cp);
        const ok = families.some((family) =>
          document.fonts.check(`400 15px "${family}"`, ch) ||
          document.fonts.check(`700 15px "${family}"`, ch) ||
          document.fonts.check(`oblique 12deg 400 15px "${family}"`, ch) ||
          document.fonts.check(`oblique 12deg 700 15px "${family}"`, ch)
        );
        if (!ok) missing.push(`U+${hex.toUpperCase()} ${ch}`);
      }

      return { bodyFamily, loadedFaces, missing };
    },
    cps.map((cp) => cp.toString(16)),
    webFonts.map((font) => font.family),
  );

  if (!browserResult.bodyFamily.includes("Berkeley Mono")) {
    throw new Error(`body font-family did not use Berkeley Mono stack: ${browserResult.bodyFamily}`);
  }
  if (browserResult.loadedFaces.length !== webFonts.length) {
    throw new Error(`browser loaded ${browserResult.loadedFaces.length} custom faces, expected ${webFonts.length}`);
  }
  if (browserResult.loadedFaces.some((face) => !face.endsWith(" loaded"))) {
    throw new Error(`browser custom fonts not loaded: ${browserResult.loadedFaces.join(", ")}`);
  }
  if (browserResult.missing.length > 0) {
    throw new Error(`Served WOFF2 fonts do not cover:\n${browserResult.missing.join("\n")}`);
  }

  const obliqueCovered = new Set<number>();
  for (const font of webFonts) {
    if (!font.style.startsWith("oblique")) continue;
    for (const cp of coveredByKind.get(font.kind) ?? []) obliqueCovered.add(cp);
  }
  const missingItalic = italicCps
    .filter((cp) => !obliqueCovered.has(cp))
    .map(codepointName);
  if (missingItalic.length > 0) {
    throw new Error(`Oblique-rendered page glyphs missing from oblique-capable webfont:\n${missingItalic.join("\n")}`);
  }

  interface DomNode {
    readonly nodeId: number;
    readonly nodeType: number;
    readonly nodeName: string;
    readonly nodeValue?: string;
    readonly attributes?: readonly string[];
    readonly children?: readonly DomNode[];
  }

  function directText(node: DomNode): boolean {
    return (node.children ?? []).some((child) =>
      child.nodeType === 3 && (child.nodeValue ?? "").trim() !== ""
    );
  }

  function nodeLabel(node: DomNode): string {
    const attrs = node.attributes ?? [];
    const idIndex = attrs.indexOf("id");
    const classIndex = attrs.indexOf("class");
    const id = idIndex >= 0 ? `#${attrs[idIndex + 1]}` : "";
    const className = classIndex >= 0
      ? `.${(attrs[classIndex + 1] ?? "").trim().replace(/\s+/g, ".")}`
      : "";
    return `${node.nodeName.toLowerCase()}${id}${className}`;
  }

  function nodeSnippet(node: DomNode): string {
    return (node.children ?? [])
      .filter((child) => child.nodeType === 3)
      .map((child) => child.nodeValue ?? "")
      .join("")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);
  }

  function textNodes(node: DomNode): readonly DomNode[] {
    const found: DomNode[] = [];
    const visit = (current: DomNode): void => {
      if (directText(current)) found.push(current);
      for (const child of current.children ?? []) visit(child);
    };
    visit(node);
    return found;
  }

  async function platformFonts(media: "screen" | "print"): Promise<readonly string[]> {
    await page.emulateMediaType(media);
    const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true }) as { root: DomNode };
    const fallback = new Set<string>();

    for (const node of textNodes(root)) {
      const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId: node.nodeId }) as {
        fonts: readonly {
          readonly familyName: string;
          readonly glyphCount: number;
          readonly isCustomFont: boolean;
        }[];
      };
      for (const font of fonts) {
        if (font.glyphCount > 0 && !font.isCustomFont) {
          fallback.add(`${media}: ${nodeLabel(node)} "${nodeSnippet(node)}" used ${font.familyName} (${font.glyphCount} glyphs)`);
        }
      }
    }

    return [...fallback];
  }

  const fallbackFonts = [
    ...await platformFonts("screen"),
    ...await platformFonts("print"),
  ];
  if (fallbackFonts.length > 0) {
    throw new Error(`Browser rendered body text with non-served fonts:\n${fallbackFonts.join("\n")}`);
  }
} finally {
  await browser.close();
}

console.log(`✓ ${webFonts.length} served Berkeley Mono font files cover ${cps.length} codepoints on the 600-unit cell grid`);
