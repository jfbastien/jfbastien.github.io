import { expect, test } from "bun:test";
import { fontFaceCSS, fontStackCSS, webFonts } from "./fonts.ts";

test("serves generated Berkeley Mono webfonts", () => {
  expect(webFonts).toHaveLength(2);
  expect(webFonts[0].kind).toBe("primary");
  expect(webFonts[0].file).toMatch(/^BerkeleyMonoSubset\.[0-9a-f]{16}\.woff2$/);
  expect(webFonts[0].family).toBe("Berkeley Mono");
  expect(webFonts[0].style).toBe("oblique 0deg 16deg");
  expect(webFonts[0].weight).toBe("100 900");
  expect(webFonts[0].stretch).toBe("60% 100%");
  expect(webFonts[0].staticBoldTtf).toBe("BerkeleyMonoSubsetBoldStatic.ttf");
  expect(webFonts[1].kind).toBe("supplemental");
  expect(webFonts[1].file).toMatch(/^DossierMonoSupplement\.[0-9a-f]{16}\.woff2$/);
  expect(webFonts[1].family).toBe("Dossier Mono Supplement");
});

test("emits font face without local font bypasses", () => {
  const css = fontFaceCSS();
  expect(css).toContain("font-family: 'Berkeley Mono'");
  expect(css).toContain("font-family: 'Dossier Mono Supplement'");
  expect(css).toContain("font-style: oblique 0deg 16deg");
  expect(css).toContain("font-stretch: 60% 100%");
  expect(css).not.toContain("local(");
  for (const font of webFonts) {
    expect(css).toContain(`url('./fonts/${font.file}') format('woff2')`);
  }
});

test("exposes the two-face font stack", () => {
  expect(fontStackCSS()).toBe("\"Berkeley Mono\", \"Dossier Mono Supplement\"");
});
