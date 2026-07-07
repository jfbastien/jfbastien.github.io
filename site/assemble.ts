import { chmod, cp, mkdir, rename, rm } from "fs/promises";
import { join } from "path";
import { webFonts } from "./fonts.ts";

const root = join(import.meta.dir, "..");
const out = join(root, "_site");
const tmp = join(root, "_site.tmp");

await rm(tmp, { recursive: true, force: true });
await mkdir(tmp);
await mkdir(join(tmp, "fonts"));

const files = [
  "index.html", "index.md", "llms.txt", "robots.txt", "sitemap.xml", "og.png", "CNAME",
  "favicon.ico", "favicon-16.png", "favicon-32.png", "favicon-64.png", "favicon-128.png", "favicon-256.png",
] as const;

const fontFiles = [
  ...webFonts.map((f) => f.file),
  "README.md",
  "supplement.json",
  "OFL-BIZ-UDGothic.txt",
  "OFL-Noto.txt",
] as const;

await Promise.all([
  ...files.map((f) => cp(join(root, f), join(tmp, f))),
  ...fontFiles.map((f) => cp(join(root, "fonts", f), join(tmp, "fonts", f))),
]);

await rm(out, { recursive: true, force: true });
await rename(tmp, out);

for (const name of files) {
  await chmod(join(out, name), 0o444);
}

console.log(`✓ _site/ assembled (${webFonts.length} webfont)`);
