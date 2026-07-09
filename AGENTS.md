# Agent Instructions

This repository builds `jfbastien.com`, a static, semantic, single-page systems
record generated from `content.md`.

## Design Intent

The site should feel like a precise paper dossier / scientific inventory /
invoice-adjacent form. It should not feel like a web resume, terminal emulator,
dashboard, or ASCII-art page.

The source stays semantic. Decorative rules, leaders, uppercase treatment, and
spacing belong in generated HTML/CSS, not in Markdown content.

## Voice

`content.md` reads as a dossier, not a résumé; even the section names hold the
conceit (Service Record, Public Record, Patent Register). The
container makes it literal: Berkeley Mono, ruled panels, dot leaders, ISO 8601
dates. Form and prose are one instrument, meant to be read line by line by
someone who checks.

- **Nothing carries tense.** Time lives in the date columns, never in a finite
  verb. Roles are agent nouns: "Founder of", "Instigator", "Co-designer of",
  "chair of". Summaries and bullets are noun phrases ("Security through compiler
  technology"), plain present ("Where code moves the physical world"), or
  participles, active or passive ("platform driving Toyota's transformation",
  "Re-published as"). A finite past-tense verb ("reduced", "chaired",
  "co-designed") or a gerund-led summary ("Crafting", "Building") is the signal
  to rewrite. Quoted titles — patents, papers, talks — are verbatim; their
  grammar is not yours to fix. No "former", no "stepped down"; the end date is
  the whole statement.

- **Every line survives a hostile read.** The audience is standards editors,
  compiler engineers, and recruiters, often the same person. Numbers, named
  artifacts, awards, and links carry the weight; adjectives ("massive",
  "world-class") carry none. A claim that cannot be checked comes out, this
  file included.

- **Omission is a statement.** No employer heads the standards entry, no
  honorifics, no wink on the jokes. The 0-indexed lists, the interrobang, the
  loud view count are left for the reader who catches them.

- **Order is legible or it is wrong.** Service Record and Education by end date
  descending; papers and talks by year descending; the standards docket by
  impact; undated series last. An order the reader cannot reconstruct reads as
  neglect.

- **The mechanics are the message.** ISO 8601 dates and intervals
  (`YYYY-MM/YYYY-MM`, `YYYY/YYYY`, open end `YYYY-MM/..`); a standards reader
  clocks the format. Serial comma. A semicolon joins facts within a bullet; an
  em-dash attaches a highlight. A catalogue line ends in a period, unless the
  title's own `?` or `!` closes it. Abbreviate what a technical reader knows
  cold (VLIW, RCU, ISO, VP); spell out the bespoke (LLVM Security Group,
  Community Group chair). Proper nouns link to their source, and the link does
  the explaining. Rules, leaders, and uppercase come from `site/`, never typed
  into `content.md`; see Design Intent and `site/AGENTS.md`.

The register runs cold, which selects its readers. It holds only while every
line is hard; one soft verb shows like a smudge on glass.

## Visual Invariants

- Plain light paper background. No dark mode and no background pattern.
- Berkeley Mono is the visual system.
- Use mostly one font size. Create hierarchy with weight, spacing, alignment,
  rules, color, and position.
- Keep important geometry on the `ch` / `lh` grid; the aligned grid takes no
  half-steps (out-of-flow hairlines and print compaction may use sub-units). It
  should look hand-aligned on a typewriter — a reader with a ruler finds the
  columns and rows lining up, on screen and in print.
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

The generated HTML, CSS, and TypeScript are part of the work, not a byproduct;
someone will read them, so make them worth reading. Quote and escape attributes
only where required (via `attrs()`), and style from the nearest shared ancestor
rather than tagging every child. Preserve meaningful casing in source; use CSS
for uppercase presentation. The aim is quiet competence — excellence that does
not announce itself.

Aim for consistency by construction. When two similar rows render differently,
the cause is usually a duplicated code path; unify it so the two cannot diverge,
and prefer a fix that removes rules to one that adds them. Derive geometry —
register widths, the font subset, leader counts — from the content, so a new
entry renders correctly without a new special case.

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
