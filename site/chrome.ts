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

// Print CSS deliberately does not block a screen load. Before producing a PDF
// or inspecting print-only text, require its external stylesheet to be ready.
// A file:// page gives each stylesheet an opaque origin, so CSSOM cssRules is
// intentionally unreadable; the existing print-only paper token proves that
// the linked sheet loaded and applies instead.
export async function emulatePrintMedia(page: Page): Promise<void> {
  await page.emulateMediaType("print");
  try {
    await page.waitForFunction(() => {
      const link = document.querySelector<HTMLLinkElement>('link[rel~="stylesheet"][media="print"]');
      return link !== null
        && link.sheet !== null
        && getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() === "white";
    }, { timeout: 5_000 });
  } catch (error) {
    const state = await page.evaluate(() => {
      const link = document.querySelector<HTMLLinkElement>('link[rel~="stylesheet"][media="print"]');
      return {
        found: link !== null,
        href: link?.href ?? null,
        media: link?.media ?? null,
        mediaMatches: matchMedia("print").matches,
        hasSheet: link !== null && link.sheet !== null,
        paper: getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
      };
    });
    throw new Error(`Print stylesheet did not become ready: ${JSON.stringify(state)}`, { cause: error });
  }
  await page.evaluateHandle("document.fonts.ready");
}
