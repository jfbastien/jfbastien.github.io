import { expect, test } from "bun:test";
import { fontFaceCSS, fontStackCSS, preloadLinks, webFonts } from "./fonts.ts";
import { clusterCompanions, isWideCodepoint, markClusterProblems } from "./font-corpus.ts";

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

test("preloads the generated webfont and exposes the stack", () => {
  expect(preloadLinks().match(/rel=preload/g)?.length).toBe(2);
  expect(fontStackCSS()).toBe("\"Berkeley Mono\", \"Dossier Mono Supplement\"");
});

test("isWideCodepoint classifies the page's East Asian Width groups", () => {
  // Wide (two 600-unit cells): CJK, kana, fullwidth Latin.
  for (const cp of [0x4e00, 0x65e5, 0x3042, 0x30a2, 0xff21]) {
    expect(isWideCodepoint(cp)).toBe(true);
  }
  // Narrow (one cell): Latin, the interrobang, the U+303F carve-out, halfwidth.
  for (const cp of [0x0041, 0x203d, 0x303f, 0xff61]) {
    expect(isWideCodepoint(cp)).toBe(false);
  }
  // BMP-only by construction; an astral-plane wide glyph would surface as a
  // bad-advance build failure in check-fonts, not here.
  expect(isWideCodepoint(0x20000)).toBe(false);
});

test("clusterCompanions returns covered codepoints that share a cluster with uncovered ones", () => {
  const covered = new Set([0x0065, 0x00e9]);
  // e + U+0305 COMBINING OVERLINE: the covered base ships with the mark.
  expect(clusterCompanions("e̅", covered)).toEqual([0x0065]);
  // Fully covered, fully uncovered, and precomposed clusters need nothing.
  expect(clusterCompanions("e", covered)).toEqual([]);
  expect(clusterCompanions("日̅", covered)).toEqual([]);
  expect(clusterCompanions("é", covered)).toEqual([]);
});

test("markClusterProblems requires one cell before a lone supplement mark", () => {
  const advances = new Map([[0x0065, 600], [0x0291, 600], [0x65e5, 1200], [0x0305, 0], [0x0489, 0]]);
  const marks = new Set([0x0305, 0x0489]);
  const problems = (text: string) => markClusterProblems(text, 600, advances, marks);
  // The page's clusters: e + U+0305 COMBINING OVERLINE, ʑ + U+0489 MILLIONS SIGN.
  expect(problems("e̅ ʑ҉")).toEqual([]);
  expect(problems("日̅")).toEqual([`"日̅" advances 1200 before its mark, expected 600`]);
  expect(problems("̅")).toEqual([`"̅" advances 0 before its mark, expected 600`]);
  expect(problems("e̅҉")).toEqual([`"e̅҉" holds 2 supplement marks`]);
  expect(problems("x̅")).toEqual([`"x̅" has U+78 x outside the supplement`]);
});
