import { expect, test } from "bun:test";
import { fontFaceCSS, fontForStyle, fontRulesCSS, preloadLinks } from "./fonts.ts";

test("maps used weights to the variable webfont sources", () => {
  for (const weight of [100, 300, 400, 800]) {
    expect(fontForStyle("Alegreya Sans", weight, "normal")?.file).toBe("AlegreyaSans-Variable.woff2");
  }

  expect(fontForStyle("Alegreya Sans", 300, "italic")?.file).toBe("AlegreyaSans-LightItalic.woff2");
  expect(fontForStyle("Alegreya Sans", 400, "italic")).toBeUndefined();
});

test("emits variable font faces without local font bypasses", () => {
  const css = fontFaceCSS();
  expect(css).toContain("font-weight: 100 800");
  expect(css).toContain("url('./fonts/AlegreyaSans-Variable.woff2') format('woff2')");
  expect(css).toContain("url('./fonts/AlegreyaSans-LightItalic.woff2') format('woff2')");
  expect(css).not.toContain("local(");
});

test("uses OpenType small caps for former SC text", () => {
  const css = fontRulesCSS();
  expect(css).toContain("h1 { font-weight: 800; font-variant-caps: small-caps; }");
  expect(css).toContain("h2 { font-weight: 400; font-variant-caps: small-caps; }");
  expect(preloadLinks().match(/rel=preload/g)?.length).toBe(2);
});
