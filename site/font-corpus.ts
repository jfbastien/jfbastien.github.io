import { existsSync } from "fs";
import { join } from "path";
import { launchChrome, openPage } from "./chrome.ts";

function htmlPath(root: string): string {
  const path = join(root, "index.html");
  if (!existsSync(path)) throw new Error(`${path} missing. Run bun run build:site first.`);
  return path;
}

export interface FontUsage {
  readonly all: string;
  readonly italic: string;
  readonly code: string;
}

export async function fontUsage(root = join(import.meta.dir, "..")): Promise<FontUsage> {
  const browser = await launchChrome();

  try {
    const page = await openPage(browser, htmlPath(root));
    const all: string[] = [];
    const italic: string[] = [];
    const code: string[] = [];

    for (const media of ["screen", "print"] as const) {
      await page.emulateMediaType(media);
      await page.evaluateHandle("document.fonts.ready");
      const usage = await page.evaluate(() => {
        function visible(el: Element | null): boolean {
          for (let node = el; node; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden") return false;
          }
          return true;
        }

        function pseudoText(el: Element, content: string): string {
          if (!content || content === "none" || content === "normal") return "";
          const pieces = [...content.matchAll(/"((?:\\.|[^"\\])*)"/g)]
            .map((match) => match[1]!.replace(/\\"/g, "\"").replace(/\\\\/g, "\\"));
          const text = pieces.length > 0 ? pieces.join("") : content;
          if (!content.includes("attr(")) return text;

          const attrs = [...content.matchAll(/attr\(\s*([^) ,]+)[^)]*\)/g)]
            .map((match) => el.getAttribute(match[1]!) ?? "");
          return `${text}\n${attrs.join("\n")}`;
        }

        function orderedMarkerValue(li: HTMLLIElement, ol: HTMLOListElement): number {
          if (li.hasAttribute("value")) return Number.parseInt(li.getAttribute("value")!, 10);
          const items = [...ol.children].filter((child): child is HTMLLIElement => child instanceof HTMLLIElement);
          const index = items.indexOf(li);
          const start = ol.hasAttribute("start") ? Number.parseInt(ol.getAttribute("start")!, 10) : 1;
          return ol.reversed ? start - index : start + index;
        }

        function markerText(el: Element): string {
          const computed = pseudoText(el, getComputedStyle(el, "::marker").content);
          if (computed) return computed;
          if (!(el instanceof HTMLLIElement)) return "";

          const parent = el.parentElement;
          if (parent instanceof HTMLOListElement) {
            const value = orderedMarkerValue(el, parent);
            return Number.isFinite(value) ? `${value}.` : "";
          }
          if (parent instanceof HTMLUListElement) return "•";
          return "";
        }

        function add(
          parts: string[],
          italicParts: string[],
          codeParts: string[],
          text: string,
          style: CSSStyleDeclaration,
          el?: Element | null,
        ): void {
          if (!text) return;
          parts.push(text);
          if (style.fontStyle !== "normal") italicParts.push(text);
          if (el?.closest("code,kbd,samp")) codeParts.push(text);
        }

        const parts: string[] = [];
        const italicParts: string[] = [];
        const codeParts: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode.textContent;
          const parent = walker.currentNode.parentElement;
          if (text && parent && visible(parent)) {
            add(parts, italicParts, codeParts, text, getComputedStyle(parent), parent);
          }
        }

        for (const el of document.body.querySelectorAll("*")) {
          if (!visible(el)) continue;
          for (const pseudo of ["::before", "::after", "::marker"] as const) {
            const style = getComputedStyle(el, pseudo);
            add(parts, italicParts, codeParts, pseudoText(el, style.content), style, el);
          }
          add(parts, italicParts, codeParts, markerText(el), getComputedStyle(el, "::marker"), el);
        }

        return { all: parts.join("\n"), italic: italicParts.join("\n"), code: codeParts.join("\n") };
      });
      all.push(usage.all);
      italic.push(usage.italic);
      code.push(usage.code);
    }

    return { all: all.join("\n"), italic: italic.join("\n"), code: code.join("\n") };
  } finally {
    await browser.close();
  }
}

export function uniqueCodepoints(text: string): readonly number[] {
  return [...new Set([...text].map((ch) => ch.codePointAt(0)!))].sort((a, b) => a - b);
}

export function codepointName(cp: number): string {
  return `U+${cp.toString(16).toUpperCase()} ${String.fromCodePoint(cp)}`;
}

// East Asian Wide / Fullwidth codepoints occupy two monospace cells.
export function isWideCodepoint(cp: number): boolean {
  return (cp >= 0x1100 && cp <= 0x115f)
    || (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f)
    || (cp >= 0xac00 && cp <= 0xd7a3)
    || (cp >= 0xf900 && cp <= 0xfaff)
    || (cp >= 0xff00 && cp <= 0xff60)
    || (cp >= 0xffe0 && cp <= 0xffe6);
}
