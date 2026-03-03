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

// Which CSS selectors override the body font. fontRulesCSS() generates
// CSS from this table; Chrome-based subsetting discovers actual usage
// independently via getComputedStyle at render time.
interface FontRule {
  readonly selector: string;
  readonly family: FontFamily;
  readonly weight: FontWeight;
  readonly pseudoContent?: string;
}

const fontRules: readonly FontRule[] = [
  { selector: "h1", family: "Alegreya Sans SC", weight: 800 },
  { selector: ".tagline", family: "Alegreya Sans SC", weight: 300 },
  { selector: "h2", family: "Alegreya Sans SC", weight: 400 },
  { selector: "footer", family: "Alegreya Sans SC", weight: 300, pseudoContent: "❧" },
  { selector: ".where p", family: "Alegreya Sans", weight: 100 },
  { selector: "h3", family: "Alegreya Sans", weight: 400 },
];

const bodyFont: Font = (() => {
  const f = fonts.find((f) => f.family === "Alegreya Sans" && f.weight === 300 && f.style === "normal");
  if (!f) throw new Error("Body font Alegreya Sans 300 normal missing from fonts[]");
  return f;
})();

export function fontRulesCSS(): string {
  const rules: string[] = [];
  rules.push(`body { font-family: "${bodyFont.family}"; font-weight: ${bodyFont.weight}; }`);
  for (const r of fontRules) {
    const props: string[] = [];
    if (r.family !== bodyFont.family) {
      props.push(`font-family: "${r.family}"`);
    }
    if (r.weight !== bodyFont.weight) {
      props.push(`font-weight: ${r.weight}`);
    }
    if (r.pseudoContent) {
      rules.push(`${r.selector}::before { content: "${r.pseudoContent}"; }`);
    }
    if (props.length > 0) {
      rules.push(`${r.selector} { ${props.join("; ")}; }`);
    }
  }
  return rules.join("\n      ");
}

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
