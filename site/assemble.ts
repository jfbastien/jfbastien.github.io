// Copy all serving files into _site/ for deployment.

import { cp, mkdir } from "fs/promises";
import { join } from "path";

const root = join(import.meta.dir, "..");
const out = join(root, "_site");

await mkdir(out, { recursive: true });

const copies: readonly [string, string][] = [
  ["index.html", "index.html"],
  ["index.md", "index.md"],
  ["llms.txt", "llms.txt"],
  ["og.png", "og.png"],
  ["CNAME", "CNAME"],
  ["favicon.ico", "favicon.ico"],
  ["favicon-16.png", "favicon-16.png"],
  ["favicon-32.png", "favicon-32.png"],
  ["favicon-64.png", "favicon-64.png"],
  ["favicon-128.png", "favicon-128.png"],
  ["favicon-256.png", "favicon-256.png"],
];

await Promise.all([
  ...copies.map(([src, dest]) => cp(join(root, src), join(out, dest))),
  cp(join(root, "fonts"), join(out, "fonts"), { recursive: true }),
]);

console.log(`✓ _site/ assembled`);
