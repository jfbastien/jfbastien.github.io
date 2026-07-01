import { expect, test } from "bun:test";
import { contentHashedFontFile } from "./subset.ts";

test("content-hashes generated woff2 font filenames", () => {
  const a = contentHashedFontFile("AlegreyaSans-Variable.woff2", new Uint8Array([1, 2, 3]));
  const b = contentHashedFontFile("AlegreyaSans-Variable.woff2", new Uint8Array([1, 2, 4]));

  expect(a).toMatch(/^AlegreyaSans-Variable\.[0-9a-f]{16}\.woff2$/);
  expect(b).toMatch(/^AlegreyaSans-Variable\.[0-9a-f]{16}\.woff2$/);
  expect(a).not.toBe(b);
});

test("rejects unexpected generated font extensions", () => {
  expect(() => contentHashedFontFile("AlegreyaSans-Variable.ttf", new Uint8Array())).toThrow(
    "expected .woff2 font output",
  );
});
