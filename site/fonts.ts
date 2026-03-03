type FontWeight = 100 | 300 | 400 | 800;
type FontStyle = "normal" | "italic";
type FontFamily = "Alegreya Sans" | "Alegreya Sans SC";

export interface Font {
  readonly file: string;
  readonly family: FontFamily;
  readonly style: FontStyle;
  readonly weight: FontWeight;
  readonly local: readonly [string, string];
}

export const fonts = [
  { file: "AlegreyaSans-Thin.woff2", family: "Alegreya Sans", style: "normal", weight: 100,
    local: ["Alegreya Sans Thin", "AlegreyaSans-Thin"] },
  { file: "AlegreyaSans-Light.woff2", family: "Alegreya Sans", style: "normal", weight: 300,
    local: ["Alegreya Sans Light", "AlegreyaSans-Light"] },
  { file: "AlegreyaSans-LightItalic.woff2", family: "Alegreya Sans", style: "italic", weight: 300,
    local: ["Alegreya Sans Light Italic", "AlegreyaSans-LightItalic"] },
  { file: "AlegreyaSans-Regular.woff2", family: "Alegreya Sans", style: "normal", weight: 400,
    local: ["Alegreya Sans Regular", "AlegreyaSans-Regular"] },
  { file: "AlegreyaSansSC-Light.woff2", family: "Alegreya Sans SC", style: "normal", weight: 300,
    local: ["Alegreya Sans SC Light", "AlegreyaSansSC-Light"] },
  { file: "AlegreyaSansSC-Regular.woff2", family: "Alegreya Sans SC", style: "normal", weight: 400,
    local: ["Alegreya Sans SC Regular", "AlegreyaSansSC-Regular"] },
  { file: "AlegreyaSansSC-ExtraBold.woff2", family: "Alegreya Sans SC", style: "normal", weight: 800,
    local: ["Alegreya Sans SC ExtraBold", "AlegreyaSansSC-ExtraBold"] },
] as const satisfies readonly Font[];

// Single source of truth: which CSS selectors use which font.
// subset.ts consumes this to extract per-font characters from generated HTML.
// style.ts encodes the same mapping as CSS rules — if a selector or weight
// changes in one place but not the other, the minMatches assertion catches it.
export interface FontRule {
  readonly selector: string;
  readonly family: FontFamily;
  readonly weight: FontWeight;
  readonly style: FontStyle;
  readonly pseudoContent?: string;
  readonly minMatches?: number;
}

export const fontRules: readonly FontRule[] = [
  { selector: "h1", family: "Alegreya Sans SC", weight: 800, style: "normal", minMatches: 1 },
  { selector: ".tagline", family: "Alegreya Sans SC", weight: 300, style: "normal", minMatches: 1 },
  { selector: "h2", family: "Alegreya Sans SC", weight: 400, style: "normal", minMatches: 1 },
  { selector: "footer", family: "Alegreya Sans SC", weight: 300, style: "normal", pseudoContent: "❧", minMatches: 1 },
  // CSS is `.grid .where p` but ultrahtml can't match 3-level descendant
  // selectors. `.where p` is equivalent: all .where divs are inside .grid.
  { selector: ".where p", family: "Alegreya Sans", weight: 100, style: "normal", minMatches: 1 },
  { selector: "h3", family: "Alegreya Sans", weight: 400, style: "normal", minMatches: 1 },
  { selector: "em", family: "Alegreya Sans", weight: 300, style: "italic" },
  { selector: "i", family: "Alegreya Sans", weight: 300, style: "italic" },
];

export function resolveFont(family: FontFamily, weight: FontWeight, style: FontStyle): Font {
  const match = fonts.find((f) => f.family === family && f.weight === weight && f.style === style);
  if (!match) throw new Error(`No font for ${family} ${weight} ${style}`);
  return match;
}

export const bodyFont: Font = resolveFont("Alegreya Sans", 300, "normal");

export function fontFaceCSS(): string {
  return fonts.map((f) =>
    `@font-face { font-family: '${f.family}'; font-style: ${f.style}; font-weight: ${f.weight}; src: local('${f.local[0]}'), local('${f.local[1]}'), url('./fonts/${f.file}') format('woff2'); font-display: fallback; }`
  ).join("\n      ");
}

export function preloadLinks(): string {
  return fonts.map((f) =>
    `<link rel="preload" as="font" type="font/woff2" href="./fonts/${f.file}" crossorigin>`
  ).join("\n    ");
}
