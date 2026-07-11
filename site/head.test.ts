import { expect, test } from "bun:test";
import { renderHead } from "./head.ts";
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

test("keeps critical screen CSS inline and delivers print CSS separately", () => {
  const head = renderHead(meta, "print.0123456789abcdef.css");

  expect(head).toContain("<style>");
  expect(head).toContain("@layer reset, tokens, base, layout, components, print-hints;");
  expect(head).toContain('<link rel=stylesheet href=./print.0123456789abcdef.css media=print>');
  expect(head).not.toContain("<style media=print>");
  expect(head).not.toContain("@page {");
  expect(head).not.toContain("as=style");
});
