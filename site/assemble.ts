// Copy serving files into _site/ for deployment.

import { cp, mkdir } from "fs/promises";
import { join } from "path";

const root = join(import.meta.dir, "..");
const out = join(root, "_site");

await mkdir(out, { recursive: true });

const files = [
  "index.html", "index.md", "llms.txt", "og.png", "CNAME",
  "favicon.ico", "favicon-16.png", "favicon-32.png",
  "favicon-64.png", "favicon-128.png", "favicon-256.png",
] as const;

await Promise.all([
  ...files.map((f) => cp(join(root, f), join(out, f))),
  cp(join(root, "fonts"), join(out, "fonts"), { recursive: true }),
]);

console.log("\u2713 _site/ assembled");
