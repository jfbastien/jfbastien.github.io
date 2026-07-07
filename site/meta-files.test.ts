import { expect, test } from "bun:test";
import { renderLlmsTxt, renderRobotsTxt, renderSitemapXml } from "./meta-files.ts";
import type { SiteMeta } from "./parse.ts";

const meta: SiteMeta = {
  name: "JF Bastien",
  tagline: "build & scale platforms",
  url: "https://example.test",
  email: "me@example.test",
  description: "Test description.",
  location: "日本 東京都",
  social: [
    { kind: "email", label: "me@example.test", url: "mailto:me@example.test", rel: "me" },
    { kind: "github", label: "jfbastien", url: "https://github.com/jfbastien" },
  ],
  og: { image: "https://example.test/og.png", width: 1200, height: 630 },
  twitter: { site: "@jfbastien" },
};

test("llms.txt lists the site once plus each web link", () => {
  const text = renderLlmsTxt(meta);
  expect(text).toContain("> Test description.");
  expect(text).toContain("- Website: https://example.test");
  expect(text).toContain("- jfbastien: https://github.com/jfbastien");
  expect(text).not.toContain("mailto:");
  const siteLines = text.split("\n").filter((line) => line.endsWith(": https://example.test"));
  expect(siteLines).toEqual(["- Website: https://example.test"]);
});

test("robots.txt declares content signals and the sitemap", () => {
  const text = renderRobotsTxt(meta);
  expect(text).toContain("User-agent: *\nAllow: /");
  expect(text).toContain("Content-Signal: ai-train=yes, search=yes, ai-input=yes");
  expect(text).toContain("Sitemap: https://example.test/sitemap.xml");
});

test("sitemap.xml carries the canonical root and lastmod", () => {
  const lastmod = "2026-07-06T16:00:00+09:00";
  const text = renderSitemapXml(meta, lastmod);
  expect(text).toContain("<loc>https://example.test/</loc>");
  expect(text).toContain(`<lastmod>${lastmod}</lastmod>`);
  expect(text).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
});
