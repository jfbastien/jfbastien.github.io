# Site Generator Instructions

`site/` contains the static generator, renderer, CSS, layout audit, font checks,
and print audit.

## Renderer Rules

- Preserve semantic HTML: `section`, `article`, `header`, `nav`, `dl`, `ul`,
  `ol`, `time`, and related elements.
- Use `attrs()` for generated attributes so HTML remains minimal and correctly
  escaped.
- Do not add presentational dots, box drawing, or uppercase spelling to
  Markdown content.
- Avoid generic helpers that impose one section's punctuation or spacing on a
  different form type. Prefer explicit renderers for service, education,
  papers/talks, docket, series, patents, and dispatch.
- Derive local register widths from content where practical, then expose them as
  CSS custom properties.

## CSS Rules

- Keep the one-size typography direction unless explicitly changed.
- Use `ch` for horizontal form geometry and `lh` for vertical rhythm.
- Use non-layout-affecting borders (`box-shadow`/`outline`) when borders would
  disrupt the grid.
- Avoid arbitrary spacing; prefer whole line-height rows.
- Do not use page-wide texture or grid backgrounds.

## Leader Policy

- Record Index and Dispatch may use full flexible dot leaders because their
  values align to the right edge.
- Papers and Talks use short bounded leaders, preferably around `6ch`. They
  should never become index-style dot runways.
- Paper/Talk venue cells must fill any unused control-column space with the same
  generated leader dots; do not leave blank padding between a short venue label
  and its dots.
- Do not split one Paper/Talk leader across multiple pseudo-elements or grid
  columns. The venue/control cell is the single leader source.
- Docket and Series rows use short fixed leaders, usually `4ch`.
- When a register folds on narrow viewports (value moves below its label),
  the label line's leader fills to the right edge, like Dispatch.
- Patent rows are identifier registers, not label/value rows; do not add dot
  leaders by default.

## Masthead Register Policy

- On desktop, identity/contact fields live on the left and URI/location fields
  are right-anchored.
- Do not let the right register drift into a centered second column.
- On mobile, use a simple label/value register.

## Panel Rail Policy

- Panel boxes need real CSS corners.
- Do not fake corners with box glyphs; CSS borders and font metrics will not
  align reliably across browsers, zoom, and print.
- If a section title sits on the top rail, draw the real CSS box edge first and
  mask or overlay the title. Do not leave hybrid rails with missing corners.
- Panel titles may straddle the top rule as an accepted optical exception.

## Print Surface Policy

Print/PDF is a separate surface, not just the screen page rendered on paper.
Scientific authority comes from constraint and comparison, not fake technical
theater.

- Keep one semantic HTML document.
- Screen and print share the real CSS box plus straddling-title grammar; print
  uses `box-decoration-break: clone` so multi-page fragments remain closed
  forms instead of broken screen panels.
- Print may compact the registers inside those boxes, but section titles should
  still define the boxes they name.
- Judge print from rendered PDF pages, not only from CSS or audit pass.
- Avoid orphaned metadata, date, note, and section-title lines at page starts or
  bottoms.
- Avoid sparse non-final pages, broken box fragments, and URL noise.
- Page footers belong to `@page`; hide the screen footer in print.
- Print URLs only where they materially help, especially public series rows.

## Audits

`layout-check.ts` should catch overflow, wrapping, off-grid columns, off-grid
rows, and accidental font-size escapes.

`print-audit.ts` should catch page count issues, missing footers, fallback fonts,
sparse non-final pages, and print-only URL regressions.
