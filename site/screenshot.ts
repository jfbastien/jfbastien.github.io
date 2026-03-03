import { existsSync } from "fs";
import { chmod } from "fs/promises";
import { join } from "path";
import { launchChrome, openPage } from "./chrome.ts";

const root = join(import.meta.dir, "..");
const html = join(root, "_site", "index.html");
const out = join(root, "screenshot.png");

if (!existsSync(html)) {
  throw new Error(`${html} not found — run build:assemble first`);
}

const browser = await launchChrome();

try {
  const page = await openPage(browser, html);
  await page.setViewport({ width: 1280, height: 960 });

  const body = await page.$("body");
  if (!body) throw new Error("No <body> found");

  if (existsSync(out)) await chmod(out, 0o644);
  await body.screenshot({ path: out });
  await chmod(out, 0o444);
} finally {
  await browser.close();
}

console.log(`\u2713 ${out} (${(Bun.file(out).size / 1024).toFixed(0)} KB)`);
