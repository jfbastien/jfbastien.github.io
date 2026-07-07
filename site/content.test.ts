import { expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { parseEntries, parseFrontMatter, splitSections } from "./parse.ts";

const raw = readFileSync(join(import.meta.dir, "..", "content.md"), "utf-8");

test("content.md parses front matter, sections, and entries", () => {
  const { meta, body } = parseFrontMatter(raw);
  expect(meta.url).toBe("https://jfbastien.com");
  const sections = splitSections(body);
  expect(sections.length).toBeGreaterThanOrEqual(5);
  for (const section of sections) {
    parseEntries(section.raw);
  }
});

test("content.md stays semantic: no hand-written leaders or box drawing", () => {
  const { body } = parseFrontMatter(raw);
  expect(body).not.toMatch(/\.{4,}/);
  expect(body).not.toMatch(/[─-╿]/);
});
