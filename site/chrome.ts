import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { existsSync } from "fs";
import { pathToFileURL } from "url";

const chromePaths = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
];

function findChrome(): string {
  const found = chromePaths.find((p) => p && existsSync(p));
  if (!found) throw new Error("Chrome not found. Set CHROME_PATH or install Chrome.");
  return found;
}

export function launchChrome(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    executablePath: findChrome(),
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// Navigate to a file:// URL and wait for all @font-face fonts to load.
export async function openPage(browser: Browser, htmlPath: string): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.evaluateHandle("document.fonts.ready");
  return page;
}
