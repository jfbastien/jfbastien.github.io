import { chmod, cp, mkdir, rename, rm } from "fs/promises";
import { join } from "path";
import { extractPerFontChars, type SubsetResult, subsetFonts } from "./subset.ts";

const root = join(import.meta.dir, "..");
const out = join(root, "_site");
const tmp = join(root, "_site.tmp");

await rm(tmp, { recursive: true, force: true });
await mkdir(tmp);

const files = [
  "index.html", "index.md", "llms.txt", "robots.txt", "sitemap.xml", "og.png", "CNAME",
  "favicon.ico", "favicon-16.png", "favicon-32.png",
  "favicon-64.png", "favicon-128.png", "favicon-256.png",
] as const;

const charMap = await extractPerFontChars(join(root, "index.html"));

const [, results] = await Promise.all([
  Promise.all(files.map((f) => cp(join(root, f), join(tmp, f)))),
  subsetFonts(join(root, "fonts"), join(tmp, "fonts"), charMap),
]);

async function rewriteFontUrls(htmlPath: string, results: readonly SubsetResult[]): Promise<void> {
  let html = await Bun.file(htmlPath).text();
  for (const r of results) {
    const logicalUrl = `./fonts/${r.font.file}`;
    if (!html.includes(logicalUrl)) throw new Error(`${htmlPath}: missing font URL ${logicalUrl}`);
    html = html.replaceAll(logicalUrl, `./fonts/${r.outputFile}`);
    if (html.includes(logicalUrl)) throw new Error(`${htmlPath}: failed to replace font URL ${logicalUrl}`);
  }
  await chmod(htmlPath, 0o644);
  await Bun.write(htmlPath, html);
  await chmod(htmlPath, 0o444);
}

await rewriteFontUrls(join(tmp, "index.html"), results);

// Replace _site/ with assembled tmp dir
await rm(out, { recursive: true, force: true });
await rename(tmp, out);

// Size report
let totalOrig = 0;
let totalSubset = 0;
for (const r of results) {
  const orig = (r.originalSize / 1024).toFixed(0);
  const sub = (r.subsetSize / 1024).toFixed(1);
  console.log(`  ${r.outputFile}: ${orig} KB \u2192 ${sub} KB (${r.chars} chars)`);
  totalOrig += r.originalSize;
  totalSubset += r.subsetSize;
}
console.log(`\u2713 _site/ assembled (fonts: ${(totalOrig / 1024).toFixed(0)} KB \u2192 ${(totalSubset / 1024).toFixed(0)} KB)`);
