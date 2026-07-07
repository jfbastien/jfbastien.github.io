import { expect, test } from "bun:test";
import { screenCSS } from "./style.ts";

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
