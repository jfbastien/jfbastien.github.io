import subsetFont from "subset-font";
import { mkdir, cp } from "fs/promises";
import { join } from "path";
import { type Font, fonts } from "./fonts.ts";
import { launchChrome, openPage } from "./chrome.ts";

// Launch Chrome, render the page with full fonts, and use getComputedStyle
// to determine which characters each declared font covers. Handles the full
// CSS cascade including user-agent styles (e.g. <code> → monospace).
export async function extractPerFontChars(htmlPath: string): Promise<ReadonlyMap<Font, ReadonlySet<number>>> {
  const browser = await launchChrome();

  try {
    const page = await openPage(browser, htmlPath);

    const rawChars: Record<string, string> = await page.evaluate(() => {
      const result: Record<string, string> = {};

      // Build a "family|weight|style" key from computed style. The pipe
      // delimiter is safe: CSS font-family names cannot contain "|".
      function fontKey(style: CSSStyleDeclaration): string {
        const family = style.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
        return `${family}|${style.fontWeight}|${style.fontStyle}`;
      }

      function accum(key: string, text: string): void {
        if (!result[key]) result[key] = "";
        result[key] += text;
      }

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode.textContent;
        if (!text || !text.trim()) continue;
        const el = walker.currentNode.parentElement;
        if (!el) continue;
        accum(fontKey(getComputedStyle(el)), text);
      }

      for (const el of document.body.querySelectorAll("*")) {
        for (const pseudo of ["::before", "::after"] as const) {
          const style = getComputedStyle(el, pseudo);
          const content = style.content;
          if (content && content !== "none" && content !== "normal") {
            accum(fontKey(style), content.replace(/^["']|["']$/g, ""));
          }
        }
      }

      return result;
    });

    const charSets = new Map<string, Set<number>>();
    for (const font of fonts) {
      charSets.set(font.file, new Set());
    }

    for (const [key, text] of Object.entries(rawChars)) {
      const [family, weight, style] = key.split("|");
      const w = parseInt(weight, 10);
      const font = fonts.find((f) => f.family === family && f.weight === w && f.style === style);
      if (!font) {
        // Our font family at an unexpected weight/style = bug (synthetic bold, missing @font-face, etc.)
        if (fonts.some((f) => f.family === family)) {
          throw new Error(`No font file for "${family}" weight ${weight} style ${style}. Unexpected CSS cascade?`);
        }
        const unique = [...new Set(text)].sort().join("");
        console.log(`  skip "${family}" ${weight} ${style}: ${unique}`);
        continue;
      }
      const set = charSets.get(font.file)!;
      for (const ch of text) {
        set.add(ch.codePointAt(0)!);
      }
    }

    for (const font of fonts) {
      if (charSets.get(font.file)!.size === 0) {
        throw new Error(`${font.file}: 0 characters rendered. CSS rule missing or content removed?`);
      }
    }

    const result = new Map<Font, ReadonlySet<number>>();
    for (const font of fonts) {
      result.set(font, charSets.get(font.file)!);
    }
    return result;
  } finally {
    await browser.close();
  }
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
