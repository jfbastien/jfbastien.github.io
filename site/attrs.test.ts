import { expect, test } from "bun:test";
import { attr, attrs } from "./attrs.ts";

test("emits unquoted values when HTML permits them", () => {
  expect(attr("href", "https://jfbastien.com/og.png")).toBe(" href=https://jfbastien.com/og.png");
  expect(attr("crossorigin")).toBe(" crossorigin");
});

test("quotes values that need HTML quotes", () => {
  expect(attr("content", "width=device-width,minimum-scale=1")).toBe(
    ' content="width=device-width,minimum-scale=1"',
  );
  expect(attr("class", "short entry")).toBe(' class="short entry"');
  expect(attr("data-empty", "")).toBe(' data-empty=""');
});

test("escapes attribute values before deciding quote form", () => {
  expect(attr("title", "<tag>")).toBe(" title=&lt;tag&gt;");
  expect(attr("href", "https://example.com/?a=1&b=2")).toBe(
    ' href="https://example.com/?a=1&amp;b=2"',
  );
});

test("omits false and undefined values", () => {
  expect(attrs([["class", "print-only"], ["hidden", false], ["id", undefined]])).toBe(
    " class=print-only",
  );
});
