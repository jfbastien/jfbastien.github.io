# Agent Instructions

This repository builds `jfbastien.com`, a static, semantic, single-page systems
record generated from `content.md`.

## Design Intent

The site should feel like a precise paper dossier / scientific inventory /
invoice-adjacent form. It should not feel like a web resume, terminal emulator,
dashboard, or ASCII-art page.

The source stays semantic. Decorative rules, leaders, uppercase treatment, and
spacing belong in generated HTML/CSS, not in Markdown content.

## Visual Invariants

- Plain light paper background. No dark mode and no background pattern.
- Berkeley Mono is the visual system.
- Use mostly one font size. Create hierarchy with weight, spacing, alignment,
  rules, color, and position.
- Keep important geometry on the `ch` / `lh` grid.
- Prefer local registers over generic cards:
  - masthead register;
  - service and education records;
  - paper/talk catalogues;
  - standards docket;
  - series register;
  - patent register;
  - dispatch register.
- Local register widths should be derived from content where practical.
- Dot leaders mean alignment: label, one space, dots, one space, value.
- Do not hand-write dot leaders, box drawing, or spaced-out uppercase in
  `content.md`.
- Scientific authority comes from constraint and comparison: precise local
  registers, aligned fields, useful references, and deterministic provenance.
  Do not add fake technical symbols, formulas, revision theater, or decorative
  metadata to make the page seem scientific.

## Link Policy

- Prose links are visibly underlined on screen.
- Catalogue/register links are visually clean until hover.
- Print should not add generic link underlines or global URL expansion. Add
  print-only URLs only where they materially help, such as public series rows.

## Quality Bar

The generated HTML, CSS, and TypeScript should be pleasant to inspect. Use the
`attrs()` helper for attributes. Preserve meaningful casing in source; use CSS
for uppercase presentation.

Before considering work complete, run:

```sh
bun run check
```

Regenerate font subsets only when page glyphs or font sources change:

```sh
bun run font:prepare
```

Do not commit full source fonts, purchase identifiers, license keys, or local
account details.
