import { parse, type Node } from "ultrahtml";
import { querySelectorAll } from "ultrahtml/selector";
import subsetFont from "subset-font";
import { mkdir, cp } from "fs/promises";
import { join } from "path";
import { type Font, fonts, fontRules, bodyFont, resolveFont } from "./fonts.ts";

const TEXT_NODE = 2; // ultrahtml Node.type: 1=element, 2=text, 3=comment

function textContent(node: Node): string {
  if (node.type === TEXT_NODE) return (node as unknown as { value: string }).value;
  if ("children" in node) return ((node as unknown as { children: Node[] }).children).map(textContent).join("");
  return "";
}

export function extractPerFontChars(html: string): ReadonlyMap<Font, ReadonlySet<number>> {
  const ast = parse(html);
  const charSets = new Map<string, Set<number>>();

  for (const font of fonts) {
    charSets.set(font.file, new Set());
  }

  for (const rule of fontRules) {
    const font = resolveFont(rule.family, rule.weight, rule.style);
    const matched = querySelectorAll(ast, rule.selector);

    if (rule.minMatches !== undefined && matched.length < rule.minMatches) {
      throw new Error(
        `"${rule.selector}" matched ${matched.length} elements (expected ≥${rule.minMatches}). ` +
        `CSS/HTML drift between style.ts and fonts.ts fontRules?`,
      );
    }

    const set = charSets.get(font.file)!;
    for (const node of matched) {
      for (const ch of textContent(node)) {
        set.add(ch.codePointAt(0)!);
      }
    }

    if (rule.pseudoContent) {
      for (const ch of rule.pseudoContent) {
        set.add(ch.codePointAt(0)!);
      }
    }
  }

  // Body font (Light 300) gets every rendered character — scope to <body> to
  // exclude <head> content (CSS text, JSON-LD, meta attributes).
  const bodyEls = querySelectorAll(ast, "body");
  const bodyText = bodyEls.length > 0 ? textContent(bodyEls[0]) : textContent(ast);
  const bodySet = charSets.get(bodyFont.file)!;
  for (const ch of bodyText) {
    bodySet.add(ch.codePointAt(0)!);
  }

  // Fail-fast: every font must have characters. A font with 0 chars means a
  // selector stopped matching or italic text was removed — either way, the
  // font shouldn't be shipped (and preloaded) empty.
  for (const font of fonts) {
    const set = charSets.get(font.file)!;
    if (set.size === 0) {
      throw new Error(`${font.file}: 0 characters extracted. Broken selector or unused font?`);
    }
  }

  const result = new Map<Font, ReadonlySet<number>>();
  for (const font of fonts) {
    result.set(font, charSets.get(font.file)!);
  }
  return result;
}

export interface SubsetResult {
  readonly font: Font;
  readonly originalSize: number;
  readonly subsetSize: number;
  readonly chars: number;
}

export async function subsetFonts(
  fontsDir: string,
  outDir: string,
  charMap: ReadonlyMap<Font, ReadonlySet<number>>,
): Promise<readonly SubsetResult[]> {
  await mkdir(outDir, { recursive: true });

  const results: SubsetResult[] = [];
  for (const [font, codepoints] of charMap) {
    const srcBuf = await Bun.file(join(fontsDir, font.file)).arrayBuffer();
    const text = [...codepoints].map((cp) => String.fromCodePoint(cp)).join("");
    const subset = await subsetFont(Buffer.from(srcBuf), text, {
      targetFormat: "woff2",
    });

    if (subset.length === 0) {
      throw new Error(`${font.file}: subset produced empty output`);
    }

    await Bun.write(join(outDir, font.file), subset);
    results.push({
      font,
      originalSize: srcBuf.byteLength,
      subsetSize: subset.length,
      chars: codepoints.size,
    });
  }

  await cp(join(fontsDir, "OFL.txt"), join(outDir, "OFL.txt"));
  return results;
}
