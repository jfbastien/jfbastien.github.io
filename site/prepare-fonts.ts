import { createHash } from "crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { homedir, tmpdir } from "os";
import { basename, join } from "path";
import { codepointName, fontUsage, uniqueCodepoints } from "./font-corpus.ts";

const root = join(import.meta.dir, "..");
const fontsDir = join(root, "fonts");
const primaryFamily = "Berkeley Mono";
const supplementalFamily = "Dossier Mono Supplement";
const primaryTtf = "BerkeleyMonoSubset.ttf";
const primaryStaticTtf = "BerkeleyMonoSubsetStatic.ttf";
const primaryStaticBoldTtf = "BerkeleyMonoSubsetBoldStatic.ttf";
const supplementalTtf = "DossierMonoSupplement.ttf";
const primaryWoff2Base = "BerkeleyMonoSubset.woff2";
const supplementalWoff2Base = "DossierMonoSupplement.woff2";
const generatedWoff2 = /^(?:BerkeleyMonoSubset|DossierMonoSupplement)\.[0-9a-f]{16}\.woff2$/;
const requiredPrimaryAxes = ["wght", "wdth", "slnt"] as const;
const requiredPrimaryFeatures = ["calt"] as const;

interface FallbackSource {
  readonly path: string;
  readonly name: string;
  readonly instantiate?: boolean;
}

interface ManifestFont {
  readonly kind: "primary" | "supplemental";
  readonly family: string;
  readonly style: string;
  readonly weight: string;
  readonly stretch?: string;
  readonly display: "block";
  readonly file: string;
  readonly ttf: string;
  readonly staticTtf?: string;
  readonly staticBoldTtf?: string;
}

function existing(candidates: readonly string[], label: string): string {
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error(`${label} not found. Checked:\n${candidates.join("\n")}`);
  return found;
}

function discoverBerkeleySources(dir: string): readonly string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  const wanted = new Set([
    "Berkeley Mono Variable.ttf",
    "Berkeley Mono Variable.otf",
    "Berkeley Mono Variable.woff2",
  ]);

  function visit(path: string): void {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const next = join(path, entry.name);
      if (entry.isDirectory()) {
        visit(next);
      } else if (entry.isFile() && wanted.has(entry.name)) {
        found.push(next);
      }
    }
  }

  visit(dir);
  const priority = (path: string): number =>
    path.endsWith(".ttf") ? 0 :
    path.endsWith(".otf") ? 1 :
    path.endsWith(".woff2") ? 2 :
    3;
  return found.sort((a, b) => priority(a) - priority(b) || a.localeCompare(b));
}

const fontToolsPython = existing([
  process.env.FONTTOOLS_PYTHON ?? "",
  "/opt/homebrew/Cellar/fonttools/4.60.0/libexec/bin/python",
  "/opt/homebrew/bin/python3",
  "/usr/local/bin/python3",
], "Python with FontTools installed");

function run(cmd: readonly string[]): string {
  const proc = Bun.spawnSync({ cmd: [...cmd], stdout: "pipe", stderr: "pipe" });
  const stdout = new TextDecoder().decode(proc.stdout);
  const stderr = new TextDecoder().decode(proc.stderr);
  if (proc.exitCode !== 0) {
    throw new Error(`${cmd.join(" ")} failed\n${stdout}${stderr}`.trim());
  }
  return stdout;
}

interface FontInfo {
  readonly version: string;
  readonly axes: readonly { readonly tag: string; readonly min: number; readonly default: number; readonly max: number }[];
  readonly features: readonly string[];
  readonly glyphs: readonly string[];
  readonly ligatures: readonly { readonly text: string; readonly glyph: string }[];
}

function fontInfo(font: string): FontInfo {
  return JSON.parse(run([fontToolsPython, join(import.meta.dir, "font-info.py"), font])) as FontInfo;
}

function expectedLigatureGlyphs(text: string): readonly string[] {
  const info = fontInfo(berkeleySource);
  return [...new Set(info.ligatures
    .filter((ligature) => text.includes(ligature.text))
    .map((ligature) => ligature.glyph))]
    .sort();
}

function requirePrimaryVariableFont(font: string, label: string, requiredLigatureGlyphs: readonly string[]): void {
  const info = fontInfo(font);
  const axes = new Set(info.axes.map((axis) => axis.tag));
  const missingAxes = requiredPrimaryAxes.filter((axis) => !axes.has(axis));
  const features = new Set(info.features);
  const missingFeatures = requiredPrimaryFeatures.filter((feature) => !features.has(feature));
  const glyphs = new Set(info.glyphs);
  const missingLigatures = requiredLigatureGlyphs.filter((glyph) => !glyphs.has(glyph));
  const problems = [
    missingAxes.length > 0 ? `missing axes: ${missingAxes.join(", ")}` : "",
    missingFeatures.length > 0 ? `missing GSUB features: ${missingFeatures.join(", ")}` : "",
    missingLigatures.length > 0 ? `missing page ligature glyphs: ${missingLigatures.join(", ")}` : "",
  ].filter(Boolean);
  if (problems.length > 0) {
    throw new Error(`${label} is not the expected Berkeley Mono v2 variable font (${info.version}): ${problems.join("; ")}`);
  }
}

function coveredCodepoints(font: string, cpsPath: string): ReadonlySet<number> {
  const raw = run([fontToolsPython, join(import.meta.dir, "font-cmap.py"), font, cpsPath]);
  return new Set((JSON.parse(raw) as string[]).map((hex) => parseInt(hex, 16)));
}

function writeText(path: string, cps: readonly number[]): void {
  writeFileSync(path, cps.map((cp) => String.fromCodePoint(cp)).join(""), "utf-8");
}

function writeRawText(path: string, text: string): void {
  writeFileSync(path, text, "utf-8");
}

function writeCps(path: string, cps: readonly number[]): void {
  writeFileSync(path, cps.map((cp) => cp.toString(16)).join("\n"), "utf-8");
}

function textCoveredBy(text: string, coverage: ReadonlySet<number>): string {
  return [...text].filter((ch) => coverage.has(ch.codePointAt(0)!)).join("");
}

function subset(
  input: string,
  textPath: string,
  output: string,
  flavor?: "woff2",
  keepNameTable = false,
  extraGlyphs: readonly string[] = [],
): void {
  const cmd = [
    "pyftsubset",
    input,
    `--text-file=${textPath}`,
    `--output-file=${output}`,
    "--layout-features=*",
    "--no-recalc-timestamp",
  ];
  if (keepNameTable) cmd.push("--name-IDs=*");
  if (extraGlyphs.length > 0) {
    cmd.push(`--glyphs=${extraGlyphs.join(",")}`);
    cmd.push("--glyph-names");
  }
  if (flavor) cmd.push(`--flavor=${flavor}`);
  run(cmd);
}

function hashedFontName(base: string, bytes: Uint8Array): string {
  if (!base.endsWith(".woff2")) throw new Error(`${base}: expected .woff2`);
  const stem = base.slice(0, -".woff2".length);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return `${stem}.${hash}.woff2`;
}

function writeHashedWoff2(stablePath: string, baseName: string): string {
  const bytes = readFileSync(stablePath);
  const hashed = hashedFontName(baseName, bytes);
  const hashedPath = join(fontsDir, hashed);
  writeFileSync(hashedPath, bytes);
  unlinkSync(stablePath);
  return hashed;
}

function cleanGeneratedFonts(): void {
  for (const file of readdirSync(fontsDir)) {
    if (
      generatedWoff2.test(file) ||
      file === primaryTtf ||
      file === primaryStaticTtf ||
      file === primaryStaticBoldTtf ||
      file === supplementalTtf
    ) {
      unlinkSync(join(fontsDir, file));
    }
  }
}

const berkeleySource = existing([
  process.env.BERKELEY_MONO_SOURCE ?? "",
  ...discoverBerkeleySources(join(homedir(), "Documents/Berkeley Mono")),
], "Berkeley Mono Variable source font");

const fallbackSources: readonly FallbackSource[] = [
  {
    name: "Noto Sans",
    path: existing([
      process.env.SUPPLEMENT_LATIN_SOURCE ?? "",
      join(homedir(), "Library/Fonts/NotoSans-Regular.ttf"),
    ], "Noto Sans fallback font"),
  },
  {
    name: "Noto Sans Symbols 2",
    path: existing([
      process.env.SUPPLEMENT_SYMBOL_SOURCE ?? "",
      join(homedir(), "Library/Fonts/NotoSansSymbols2-Regular.ttf"),
    ], "Noto Sans Symbols 2 fallback font"),
  },
  {
    name: "BIZ UDGothic",
    path: existing([
      process.env.SUPPLEMENT_JP_SOURCE ?? "",
      join(homedir(), "Downloads/BIZ_UDGothic/BIZUDGothic-Regular.ttf"),
    ], "BIZ UDGothic fallback font"),
  },
];

function isJapaneseCodepoint(cp: number): boolean {
  return (
    (cp >= 0x3040 && cp <= 0x30ff) ||
    (cp >= 0x31f0 && cp <= 0x31ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xf900 && cp <= 0xfaff)
  );
}

function isSymbolCodepoint(cp: number): boolean {
  return (
    (cp >= 0x2190 && cp <= 0x21ff) ||
    (cp >= 0x2200 && cp <= 0x22ff) ||
    (cp >= 0x25a0 && cp <= 0x25ff) ||
    (cp >= 0x27c0 && cp <= 0x2bff)
  );
}

function sourcePreference(cp: number): readonly string[] {
  if (isJapaneseCodepoint(cp)) return ["BIZ UDGothic", "Noto Sans", "Noto Sans Symbols 2"];
  if (isSymbolCodepoint(cp)) return ["Noto Sans Symbols 2", "Noto Sans", "BIZ UDGothic"];
  return ["Noto Sans", "Noto Sans Symbols 2", "BIZ UDGothic"];
}

const tmp = mkdtempSync(join(tmpdir(), "jfb-fonts-"));

try {
  mkdirSync(fontsDir, { recursive: true });
  cleanGeneratedFonts();

  const usage = await fontUsage(root);
  const ligatureGlyphs = expectedLigatureGlyphs(usage.all);
  requirePrimaryVariableFont(berkeleySource, "Berkeley Mono source", ligatureGlyphs);
  const cps = uniqueCodepoints(usage.all).filter((cp) => cp >= 0x20);
  const italicCps = uniqueCodepoints(usage.italic).filter((cp) => cp >= 0x20);
  const codeCps = uniqueCodepoints(usage.code).filter((cp) => cp >= 0x20);
  const allCpsPath = join(tmp, "all-cps.txt");
  writeCps(allCpsPath, cps);

  const berkeleyCovered = coveredCodepoints(berkeleySource, allCpsPath);
  const primaryCps = cps.filter((cp) => berkeleyCovered.has(cp));
  const supplementalSeedCps = [...new Set([
    0x20,
    0x30,
    ...codeCps.filter((cp) => berkeleyCovered.has(cp)),
  ])].sort((a, b) => a - b);
  const missingItalic = italicCps.filter((cp) => !berkeleyCovered.has(cp));
  if (missingItalic.length > 0) {
    throw new Error(`Oblique-rendered page glyphs missing from Berkeley Mono:\n${missingItalic.map(codepointName).join("\n")}`);
  }
  const missing = cps.filter((cp) => !berkeleyCovered.has(cp));

  const primaryText = join(tmp, "primary.txt");
  writeRawText(primaryText, textCoveredBy(usage.all, berkeleyCovered));
  subset(berkeleySource, primaryText, join(fontsDir, primaryTtf), undefined, false, ligatureGlyphs);
  run([
    fontToolsPython,
    join(import.meta.dir, "set-font-names.py"),
    join(fontsDir, primaryTtf),
    primaryFamily,
    "Regular",
    "BerkeleyMono-Regular",
  ]);
  run([
    fontToolsPython,
    "-m",
    "fontTools.varLib.instancer",
    join(fontsDir, primaryTtf),
    "wght=400",
    "wdth=100",
    "slnt=0",
    "--static",
    "--no-recalc-timestamp",
    "-o",
    join(fontsDir, primaryStaticTtf),
  ]);
  run([
    fontToolsPython,
    join(import.meta.dir, "set-font-names.py"),
    join(fontsDir, primaryStaticTtf),
    primaryFamily,
    "Regular",
    "BerkeleyMono-Regular",
  ]);
  run([
    fontToolsPython,
    "-m",
    "fontTools.varLib.instancer",
    join(fontsDir, primaryTtf),
    "wght=700",
    "wdth=100",
    "slnt=0",
    "--static",
    "--no-recalc-timestamp",
    "-o",
    join(fontsDir, primaryStaticBoldTtf),
  ]);
  run([
    fontToolsPython,
    join(import.meta.dir, "set-font-names.py"),
    join(fontsDir, primaryStaticBoldTtf),
    primaryFamily,
    "Bold",
    "BerkeleyMono-Bold",
  ]);
  subset(join(fontsDir, primaryTtf), primaryText, join(tmp, primaryWoff2Base), "woff2", true, ligatureGlyphs);
  const primaryWoff2 = writeHashedWoff2(join(tmp, primaryWoff2Base), primaryWoff2Base);
  requirePrimaryVariableFont(join(fontsDir, primaryTtf), "Berkeley Mono subset TTF", ligatureGlyphs);
  requirePrimaryVariableFont(join(fontsDir, primaryWoff2), "Berkeley Mono subset WOFF2", ligatureGlyphs);

  const staticBerkeley = join(tmp, "berkeley-static.ttf");
  run([
    fontToolsPython,
    "-m",
    "fontTools.varLib.instancer",
    berkeleySource,
    "wght=400",
    "wdth=100",
    "slnt=0",
    "--static",
    "--no-recalc-timestamp",
    "-o",
    staticBerkeley,
  ]);

  const supplementalSeedText = join(tmp, "supplemental-seed.txt");
  writeText(supplementalSeedText, supplementalSeedCps);
  const supplementalSeed = join(tmp, "supplemental-seed.ttf");
  subset(staticBerkeley, supplementalSeedText, supplementalSeed);

  let currentSupplemental = supplementalSeed;
  let fallbackCount = 0;
  const supplementalGlyphs: { readonly codepoint: string; readonly char: string; readonly source: string }[] = [];
  const fallbackCoverage = new Map(fallbackSources.map((source) => [source.name, coveredCodepoints(source.path, allCpsPath)]));
  const groups = new Map<string, number[]>();
  const uncovered: number[] = [];

  for (const cp of missing) {
    const sourceName = sourcePreference(cp)
      .find((name) => fallbackCoverage.get(name)?.has(cp));
    if (!sourceName) {
      uncovered.push(cp);
      continue;
    }
    const group = groups.get(sourceName) ?? [];
    group.push(cp);
    groups.set(sourceName, group);
  }

  if (uncovered.length > 0) {
    const formatted = uncovered.map((cp) => `U+${cp.toString(16).toUpperCase()}`).join(", ");
    throw new Error(`no supplemental source covers: ${formatted}`);
  }

  for (const [index, source] of fallbackSources.entries()) {
    const group = groups.get(source.name) ?? [];
    if (group.length === 0) continue;

    supplementalGlyphs.push(...group.map((cp) => ({
      codepoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      char: String.fromCodePoint(cp),
      source: source.name,
    })));

    const sourceFont = source.instantiate ? join(tmp, `fallback-${index}-static.ttf`) : source.path;
    const groupTextPath = join(tmp, `fallback-${index}.txt`);
    const groupCpsPath = join(tmp, `fallback-${index}-cps.txt`);
    const groupSubset = join(tmp, `fallback-${index}-subset.ttf`);
    const nextSupplemental = join(tmp, `supplemental-${index}.ttf`);

    writeText(groupTextPath, group);
    writeCps(groupCpsPath, group);

    if (source.instantiate) {
      run([
        fontToolsPython,
        "-m",
        "fontTools.varLib.instancer",
        source.path,
        "wght=400",
        "--static",
        "--no-recalc-timestamp",
        "-o",
        sourceFont,
      ]);
    }

    subset(sourceFont, groupTextPath, groupSubset);
    run([
      fontToolsPython,
      join(import.meta.dir, "merge-fonts.py"),
      currentSupplemental,
      groupSubset,
      groupCpsPath,
      nextSupplemental,
    ]);

    currentSupplemental = nextSupplemental;
    fallbackCount += group.length;
    console.log(`  supplemental glyphs: ${group.length} from ${source.name}`);
  }

  const supplementalText = join(tmp, "supplemental.txt");
  writeText(supplementalText, [...new Set([...missing, ...supplementalSeedCps])].sort((a, b) => a - b));
  subset(currentSupplemental, supplementalText, join(fontsDir, supplementalTtf), undefined, true);
  run([
    fontToolsPython,
    join(import.meta.dir, "set-font-names.py"),
    join(fontsDir, supplementalTtf),
    supplementalFamily,
    "Regular",
    "DossierMonoSupplement-Regular",
  ]);
  subset(join(fontsDir, supplementalTtf), supplementalText, join(tmp, supplementalWoff2Base), "woff2", true);
  const supplementalWoff2 = writeHashedWoff2(join(tmp, supplementalWoff2Base), supplementalWoff2Base);

  const manifestFonts: readonly ManifestFont[] = [
    {
      kind: "primary",
      family: primaryFamily,
      style: "oblique 0deg 16deg",
      weight: "100 900",
      stretch: "60% 100%",
      display: "block",
      file: primaryWoff2,
      ttf: primaryTtf,
      staticTtf: primaryStaticTtf,
      staticBoldTtf: primaryStaticBoldTtf,
    },
    {
      kind: "supplemental",
      family: supplementalFamily,
      style: "normal",
      weight: "400",
      display: "block",
      file: supplementalWoff2,
      ttf: supplementalTtf,
    },
  ];

  writeFileSync(
    join(fontsDir, "manifest.json"),
    `${JSON.stringify({ version: 1, fonts: manifestFonts }, null, 2)}\n`,
    "utf-8",
  );
  writeFileSync(
    join(fontsDir, "supplement.json"),
    `${JSON.stringify({ version: 1, glyphs: supplementalGlyphs.sort((a, b) => a.codepoint.localeCompare(b.codepoint)) }, null, 2)}\n`,
    "utf-8",
  );

  console.log(`✓ fonts/${primaryWoff2}`);
  console.log(`✓ fonts/${supplementalWoff2}`);
  console.log(`  Berkeley source: ${basename(berkeleySource)}`);
  console.log(`  primary codepoints: ${primaryCps.length}`);
  console.log(`  supplemental codepoints: ${fallbackCount}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
