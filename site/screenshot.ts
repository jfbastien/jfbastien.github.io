import puppeteer from "puppeteer-core";
import { existsSync } from "fs";
import { chmod } from "fs/promises";
import { join } from "path";

const root = join(import.meta.dir, "..");
const site = join(root, "_site");
const html = join(site, "index.html");
const out = join(root, "screenshot.png");

if (!existsSync(html)) {
  throw new Error(`${html} not found — run build:assemble first`);
}

const chromePaths = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
];
const executablePath = chromePaths.find((p) => p && existsSync(p));
if (!executablePath) {
  throw new Error("Chrome not found. Set CHROME_PATH or install Chrome.");
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });
  await page.goto(`file://${html}`, { waitUntil: "load" });
  await page.evaluateHandle("document.fonts.ready");

  const body = await page.$("body");
  if (!body) throw new Error("No <body> found");

  if (existsSync(out)) await chmod(out, 0o644);
  await body.screenshot({ path: out });
  await chmod(out, 0o444);
} finally {
  await browser.close();
}

const size = (await Bun.file(out).arrayBuffer()).byteLength;
console.log(`\u2713 ${out} (${(size / 1024).toFixed(0)} KB)`);
