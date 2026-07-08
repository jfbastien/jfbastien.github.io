import { readFileSync } from "fs";
import { join } from "path";

export interface WebFont {
  readonly kind: "primary" | "supplemental";
  readonly file: string;
  readonly ttf: string;
  readonly staticTtf?: string;
  readonly staticBoldTtf?: string;
  readonly family: string;
  readonly style: string;
  readonly weight: string;
  readonly stretch?: string;
  readonly display: "block";
}

interface FontManifest {
  readonly version: 1;
  readonly fonts: readonly WebFont[];
}

function readManifest(): FontManifest {
  const path = join(import.meta.dir, "..", "fonts", "manifest.json");
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as FontManifest;
  if (parsed.version !== 1) throw new Error(`${path}: unsupported font manifest version`);
  if (parsed.fonts.length === 0) throw new Error(`${path}: no web fonts`);
  return parsed;
}

export const webFonts: readonly WebFont[] = readManifest().fonts;

export function fontFaceCSS(): string {
  return webFonts.map((f) => {
    const stretch = f.stretch ? ` font-stretch: ${f.stretch};` : "";
    return `@font-face { font-family: '${f.family}'; font-style: ${f.style}; font-weight: ${f.weight};${stretch} src: url('./fonts/${f.file}') format('woff2'); font-display: ${f.display}; }`;
  }).join("\n");
}

export function fontStackCSS(): string {
  return [...new Set(webFonts.map((f) => f.family))].map((family) => `"${family}"`).join(", ");
}
