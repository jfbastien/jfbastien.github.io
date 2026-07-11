import { expect, test } from "bun:test";
import { renderPrintStylesheet, screenCSS } from "./style.ts";
import type { SiteMeta } from "./parse.ts";

const meta: SiteMeta = {
  name: "JF Bastien",
  tagline: "build & scale platforms",
  url: "https://example.test",
  email: "me@example.test",
  description: "Test description.",
  location: "日本 東京都",
  social: [],
  og: { image: "https://example.test/og.png", width: 1200, height: 630 },
  twitter: { site: "@jfbastien" },
};

test("viewport media queries never leak into print", () => {
  // Print engines disagree on the width media queries see (paper box vs
  // content box), so any width-conditional block must be screen-scoped or
  // the print layout silently depends on the print path.
  const widthQueries = screenCSS().match(/@media[^{]*\((?:min|max)-width[^{]*/g) ?? [];
  expect(widthQueries.length).toBeGreaterThan(0);
  for (const query of widthQueries) {
    expect(query).toContain("@media screen and");
  }
});

test("fingerprints the generated print stylesheet from its emitted CSS", () => {
  const current = renderPrintStylesheet(meta);
  const changed = renderPrintStylesheet({ ...meta, tagline: "different print footer" });

  expect(current.filename).toMatch(/^print\.[a-f0-9]{16}\.css$/);
  expect(current.css).toContain("@page {");
  expect(changed.css).not.toBe(current.css);
  expect(changed.filename).not.toBe(current.filename);
});
