import { attrs } from "./attrs.ts";

type FontWeight = 100 | 300 | 400 | 800;
type FontStyle = "normal" | "italic";
type FontFamily = "Alegreya Sans";
type FontWeightRange = readonly [min: FontWeight, max: FontWeight];
type FontWeightSpec = FontWeight | FontWeightRange;

interface FontVariationAxisRange {
  readonly min: number;
  readonly max: number;
  readonly default?: number;
}

export interface Font {
  readonly file: string;
  readonly sourceFile: string;
  readonly family: FontFamily;
  readonly style: FontStyle;
  readonly weight: FontWeightSpec;
  readonly variationAxes?: Readonly<Record<string, number | FontVariationAxisRange>>;
}

export const fonts = [
  {
    file: "AlegreyaSans-Variable.woff2",
    sourceFile: "AlegreyaSans[wght].ttf",
    family: "Alegreya Sans",
    style: "normal",
    weight: [100, 800],
    variationAxes: { wght: { min: 100, max: 800, default: 300 } },
  },
  {
    file: "AlegreyaSans-LightItalic.woff2",
    sourceFile: "AlegreyaSans-Italic[wght].ttf",
    family: "Alegreya Sans",
    style: "italic",
    weight: 300,
    variationAxes: { wght: 300 },
  },
] as const satisfies readonly Font[];

// Which CSS selectors override the body font. fontRulesCSS() generates
// CSS from this table; Chrome-based subsetting discovers actual usage
// independently via getComputedStyle at render time.
interface FontRule {
  readonly selector: string;
  readonly family: FontFamily;
  readonly weight: FontWeight;
  readonly caps?: "small-caps";
  readonly pseudoContent?: string;
}

const fontRules: readonly FontRule[] = [
  { selector: "h1", family: "Alegreya Sans", weight: 800, caps: "small-caps" },
  { selector: ".tagline", family: "Alegreya Sans", weight: 300, caps: "small-caps" },
  { selector: "h2", family: "Alegreya Sans", weight: 400, caps: "small-caps" },
  { selector: "footer", family: "Alegreya Sans", weight: 300, caps: "small-caps", pseudoContent: "❧" },
  { selector: ".where p", family: "Alegreya Sans", weight: 100 },
  { selector: "h3", family: "Alegreya Sans", weight: 400 },
];

const bodyFont: Font = (() => {
  const f = fontForStyle("Alegreya Sans", 300, "normal");
  if (!f) throw new Error("Body font Alegreya Sans 300 normal missing from fonts[]");
  return f;
})();

function fontWeightMatches(spec: FontWeightSpec, weight: number): boolean {
  if (typeof spec === "number") return spec === weight;
  return spec[0] <= weight && weight <= spec[1];
}

function fontWeightCSS(spec: FontWeightSpec): string {
  return typeof spec === "number" ? `${spec}` : `${spec[0]} ${spec[1]}`;
}

export function fontForStyle(family: string, weight: number, style: string): Font | undefined {
  return fonts.find((f) =>
    f.family === family && f.style === style && fontWeightMatches(f.weight, weight)
  );
}

export function fontRulesCSS(): string {
  const rules: string[] = [];
  rules.push(`body { font-family: "${bodyFont.family}"; font-weight: 300; }`);
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
    if (r.caps) {
      props.push(`font-variant-caps: ${r.caps}`);
    }
    if (props.length > 0) {
      rules.push(`${r.selector} { ${props.join("; ")}; }`);
    }
  }
  return rules.join("\n      ");
}

export function fontFaceCSS(): string {
  return fonts.map((f) =>
    `@font-face { font-family: '${f.family}'; font-style: ${f.style}; font-weight: ${fontWeightCSS(f.weight)}; src: url('./fonts/${f.file}') format('woff2'); font-display: fallback; }`
  ).join("\n      ");
}

export function preloadLinks(): string {
  return fonts.map((f) =>
    `<link${attrs([["rel", "preload"], ["as", "font"], ["type", "font/woff2"], ["href", `./fonts/${f.file}`], ["crossorigin", true]])}>`
  ).join("\n    ");
}
