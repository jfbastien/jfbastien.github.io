// Font manifest — single source of truth for @font-face declarations and preload hints.

type FontStyle = "normal" | "italic";

interface Font {
  readonly file: string;
  readonly family: string;
  readonly style: FontStyle;
  readonly weight: number;
  readonly local: readonly [string, string];
}

const fonts = [
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
