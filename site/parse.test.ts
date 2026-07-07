import { expect, test } from "bun:test";
import { inline, parseEntries, parseFrontMatter, splitSections } from "./parse.ts";

const validFrontMatter = `---
name: JF Bastien
tagline: build & scale platforms
url: https://example.test
email: me@example.test
description: Test description.
location: 日本 東京都
social:
  - kind: email
    label: me@example.test
    url: mailto:me@example.test
    rel: me
og:
  image: https://example.test/og.png
  width: 1200
  height: 630
twitter:
  site: "@jfbastien"
---

## Profile

Prose.
`;

test("parses valid front matter and body", () => {
  const { meta, body } = parseFrontMatter(validFrontMatter);
  expect(meta.name).toBe("JF Bastien");
  expect(meta.og.width).toBe(1200);
  expect(meta.social[0]!.rel).toBe("me");
  expect(body.trimStart()).toStartWith("## Profile");
});

test("rejects content without a front matter fence", () => {
  expect(() => parseFrontMatter("## Profile\n")).toThrow("must start with --- front matter fence");
});

test("rejects an unclosed front matter fence", () => {
  expect(() => parseFrontMatter("---\nname: JF\n")).toThrow("no closing --- fence");
});

test("rejects wrongly typed front matter fields", () => {
  const wrongType = validFrontMatter.replace("name: JF Bastien", "name: 42");
  expect(() => parseFrontMatter(wrongType)).toThrow('"name" must be a string');

  const missingOg = validFrontMatter.replace(/og:\n(?:  .*\n)*/,"");
  expect(() => parseFrontMatter(missingOg)).toThrow('"og" must be an object');
});

test("rejects body content before the first section heading", () => {
  expect(() => splitSections("stray prose\n\n## Profile\ntext\n")).toThrow("unexpected content before first ## heading");
});

test("splits sections and entries", () => {
  const sections = splitSections("## Records\n\n### Apple\n> Role\n\nBody.\n");
  expect(sections).toHaveLength(1);
  const entries = parseEntries(sections[0]!.raw);
  expect(entries).toEqual([{ heading: "Apple", blockquoteLines: ["Role"], body: "Body." }]);
});

test("rejects an entry heading with no body", () => {
  expect(() => parseEntries("### Dangling")).toThrow("### entry with no body");
});

test("inline rejects block-level and multi-paragraph markdown", () => {
  expect(inline("plain *emphasis*")).toBe("plain <em>emphasis</em>");
  expect(() => inline("one\n\ntwo")).toThrow("multi-paragraph");
  expect(() => inline("- list item")).toThrow("expected <p> wrapper");
});
