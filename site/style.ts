import { fontFaceCSS, fontStackCSS } from "./fonts.ts";
import { colors } from "./design-tokens.ts";
import { type SiteMeta } from "./parse.ts";

function cssString(s: string): string {
  return s.replace(/[\\"]/g, "\\$&");
}

export function screenCSS(): string {
  return `${fontFaceCSS()}

@layer reset, tokens, base, layout, components, print-hints;

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body, h1, h2, h3, h4, p, dl, dd, ol, ul { margin: 0; }
  ol, ul { padding: 0; }
}

@layer tokens {
  :root {
    color-scheme: light;
    --paper: ${colors.paper};
    --ink: ${colors.ink};
    --muted: ${colors.muted};
    --faint: ${colors.faint};
    --rule: ${colors.rule};
    --accent: ${colors.accent};
    --accent-warm: ${colors.accentWarm};
    --content-cols: 84ch;
    --panel-pad-x: 2ch;
    --panel-cols: calc(var(--content-cols) + var(--panel-pad-x) + var(--panel-pad-x));
    --gutter: clamp(1rem, 4vw, 2rem);
    --font-body: ${fontStackCSS()};
    --font-code: ${fontStackCSS()};
    --w-body: 400;
    --w-label: 500;
    --w-title: 600;
    --w-heavy: 700;
    --leader-dots: "................................................................................................................................";
    --rule-glyphs: "────────────────────────────────────────────────────────────────────────────────────────────────";
  }
}

@layer base {
  html {
    background: var(--paper);
    color: var(--ink);
    font-size: 15px;
    scroll-behavior: smooth;
  }

  body {
    min-block-size: 100svh;
    background: var(--paper);
    font-family: var(--font-body);
    font-feature-settings: "calt" 1, "liga" 1;
    font-variant-ligatures: common-ligatures contextual;
    font-variant-numeric: tabular-nums slashed-zero;
    font-weight: var(--w-body);
    line-height: 24px;
    letter-spacing: 0;
    text-rendering: optimizeLegibility;
  }

  a {
    color: inherit;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  a:hover {
    color: var(--accent);
    text-decoration-style: solid;
  }

  code,
  kbd,
  samp {
    font-family: var(--font-code);
    font-feature-settings: inherit;
    font-variant-ligatures: inherit;
    overflow-wrap: anywhere;
  }

  :where(h1, h2, h3, h4, p, li, dt, dd, a, span, time, code, kbd, samp, em, strong, sup) {
    font-size: 1rem;
    line-height: inherit;
  }

  sup {
    vertical-align: baseline;
  }

  strong {
    font-weight: var(--w-title);
  }

  em {
    font-style: oblique 12deg;
  }

  ::selection {
    background: var(--ink);
    color: var(--paper);
  }
}

@layer layout {
  .page {
    display: grid;
    gap: 2lh;
    grid-template-columns: minmax(0, 1fr);
    inline-size: var(--panel-cols);
    max-inline-size: calc(100vw - var(--gutter) - var(--gutter));
    margin-inline: auto;
    padding-block: 2lh 3lh;
  }

  .page > * {
    min-width: 0;
  }

  main {
    counter-reset: section;
    display: grid;
    gap: 2lh;
    grid-template-columns: minmax(0, 1fr);
  }

  main > * {
    min-width: 0;
  }
}

@layer components {
  .panel {
    position: relative;
    border: 0;
    box-shadow: inset 0 0 0 1px var(--rule);
    background: var(--paper);
    padding: 1lh var(--panel-pad-x);
    scroll-margin-block-start: 1lh;
  }

  .masthead {
    box-shadow: inset 0 0 0 1px var(--rule);
    padding-block: 1lh;
  }

  .panel__title {
    /* Optical exception: labels straddle the top rule so panels keep real
       CSS corners. Do not replace this with glyph corners; font metrics and
       CSS border geometry will not align reliably. */
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: var(--panel-pad-x);
    display: inline-flex;
    column-gap: 1ch;
    align-items: baseline;
    max-inline-size: calc(100% - var(--panel-pad-x) - var(--panel-pad-x));
    margin: 0;
    padding-inline: 1ch;
    transform: translateY(-50%);
    background: var(--paper);
    color: var(--accent-warm);
    font-weight: var(--w-label);
    line-height: inherit;
    text-transform: uppercase;
  }

  .panel__title > :last-child {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .masthead dl {
    display: grid;
    grid-template-columns: 9ch 24ch minmax(2ch, 1fr) 9ch max-content;
    column-gap: 1ch;
    align-items: start;
  }

  .masthead dl > div {
    display: contents;
  }

  .masthead dt {
    color: var(--muted);
    font-weight: var(--w-label);
    text-transform: uppercase;
  }

  .masthead dt::after {
    content: ":";
  }

  .masthead dd {
    min-inline-size: 0;
    margin: 0;
    overflow-wrap: normal;
    white-space: nowrap;
    word-break: normal;
  }

  .masthead :is(.name, .work, .contact) dt {
    grid-column: 1;
  }

  .masthead :is(.name, .work, .contact) dd {
    grid-column: 2;
  }

  .masthead :is(.uri, .location) dt {
    grid-column: 4;
  }

  .masthead :is(.uri, .location) dd {
    grid-column: 5;
    justify-self: end;
    text-align: end;
  }

  .masthead :is(.name, .uri) :is(dt, dd) {
    grid-row: 1;
  }

  .masthead :is(.work, .location) :is(dt, dd) {
    grid-row: 2;
  }

  .masthead .contact :is(dt, dd) {
    grid-row: 3;
  }

  .wordmark {
    font-weight: var(--w-heavy);
    text-transform: uppercase;
  }

  .masthead .work dd {
    text-transform: uppercase;
  }

  .masthead :is(.name, .work) dd {
    font-weight: var(--w-title);
  }

  .masthead .location span::before {
    content: "•";
    color: ${colors.japanRed};
    margin-inline-end: 1ch;
  }

  .masthead :is(.contact, .uri) a {
    color: var(--accent);
    font-weight: var(--w-body);
  }

  .record-index ol {
    display: grid;
    gap: 0;
    list-style: none;
  }

  .record-index li {
    display: grid;
    grid-template-columns: max-content minmax(1ch, 1fr) 2ch;
    align-items: baseline;
    column-gap: 1ch;
    overflow: hidden;
  }

  .record-index li::before {
    content: var(--leader-dots) / "";
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 0;
    overflow: hidden;
    white-space: nowrap;
    color: var(--faint);
  }

  .record-index li > :first-child {
    grid-column: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-decoration: none;
    white-space: nowrap;
  }

  .record-index li > :last-child {
    grid-column: 3;
    color: var(--muted);
    justify-self: end;
  }

  .section {
    counter-increment: section;
  }

  .section__counter {
    color: var(--muted);
    font-weight: var(--w-label);
  }

  .section__counter::before {
    content: "§" counter(section, decimal-leading-zero);
  }

  .prose {
    max-inline-size: none;
  }

  .prose p + p {
    margin-block-start: 1lh;
  }

  .records {
    display: grid;
  }

  .record {
    position: relative;
    display: grid;
    grid-template-columns: var(--record-head-cols, 22ch) minmax(0, 1fr);
    column-gap: var(--record-gap, 2ch);
    row-gap: 1lh;
    padding-block: 1lh;
  }

  .record:first-child {
    padding-block-start: 0;
  }

  .record--service + .record--service::before,
  .record--education + .record--education::before {
    content: var(--rule-glyphs) / "";
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    display: block;
    inline-size: 100%;
    overflow: hidden;
    white-space: nowrap;
    color: var(--faint);
  }

  .record--full {
    display: block;
  }

  .record--full .record__body {
    margin-block-start: 1lh;
  }

  .record--compact {
    padding-block: 0 1lh;
  }

  .record__head,
  .record__body {
    min-inline-size: 0;
  }

  .record__title {
    overflow-wrap: normal;
    hyphens: none;
    font-weight: var(--w-title);
  }

  .record__role,
  .record__degree,
  .record__field,
  .record__term {
    color: var(--muted);
    font-weight: var(--w-body);
    white-space: nowrap;
  }

  .record__term {
    font-style: oblique 12deg;
  }

  .record__body > * + * {
    margin-block-start: 1lh;
  }

  .bullet-list {
    list-style: none;
  }

  /* Hanging bullet: the 2ch "• " marker overhangs so wrapped lines align. */
  .bullet-list li {
    padding-inline-start: 2ch;
    text-indent: -2ch;
  }

  .bullet-list li::before {
    content: "• ";
  }

  .bullet-list li + li {
    margin-block-start: 1lh;
  }

  .artifact-group + .artifact-group {
    margin-block-start: 1lh;
  }

  .artifact-group__title {
    display: grid;
    grid-template-columns: max-content minmax(1ch, 1fr);
    column-gap: 1ch;
    align-items: baseline;
    margin-block: 1lh 1lh;
    color: var(--muted);
    font-weight: var(--w-label);
    overflow: hidden;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* :first-of-type, not :first-child: the section's h2 title precedes the
     first group in the DOM even though it renders on the panel rail. */
  .artifact-group:first-of-type .artifact-group__title {
    margin-block-start: 0;
  }

  .artifact-group__title::after {
    content: var(--rule-glyphs) / "";
    grid-column: 2;
    min-inline-size: 0;
    overflow: hidden;
    white-space: nowrap;
    color: var(--faint);
  }

  .artifact-ledger {
    display: grid;
    list-style: none;
  }

  .artifact-ledger > li {
    display: grid;
    grid-template-columns: 5ch var(--artifact-control-cols, 19ch) minmax(0, 1fr);
    column-gap: 1ch;
    row-gap: 0;
    align-items: baseline;
    padding-block: 0;
  }

  .artifact-ledger > li + li {
    margin-block-start: 1lh;
  }

  .artifact-year,
  .artifact-venue,
  .doc-code {
    white-space: nowrap;
  }

  .artifact-venue {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    column-gap: 1ch;
    align-items: baseline;
    min-inline-size: 0;
    color: var(--muted);
    overflow: hidden;
    white-space: nowrap;
  }

  .artifact-venue::after {
    content: var(--leader-dots) / "";
    flex: 1 1 auto;
    min-inline-size: 0;
    overflow: hidden;
    white-space: nowrap;
    color: var(--faint);
  }

  .artifact-title {
    grid-column: 3;
    grid-row: 1;
    min-inline-size: 0;
    overflow-wrap: break-word;
  }

  .artifact-note {
    display: block;
    color: var(--muted);
    font-style: oblique 12deg;
    overflow-wrap: break-word;
  }

  .artifact-title a,
  .record-index a,
  .dispatch-list a,
  .docket-list a,
  .series-title a,
  .record--patent .record__title a,
  .patent-title a,
  .patent-family a {
    text-decoration: none;
  }

  .artifact-title a:hover,
  .record-index a:hover,
  .dispatch-list a:hover,
  .series-title a:hover,
  .record--patent .record__title a:hover,
  .patent-title a:hover,
  .patent-family a:hover {
    text-decoration-line: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  .docket-list {
    display: grid;
    gap: 0;
    list-style: none;
    padding-inline-start: 0;
  }

  .docket-list > li {
    min-inline-size: 0;
  }

  .docket-list a {
    display: grid;
    grid-template-columns: var(--docket-code-cols, 6ch) 4ch minmax(0, 1fr);
    column-gap: 1ch;
    align-items: baseline;
    min-inline-size: 0;
    min-width: 0;
    text-decoration: none;
  }

  .docket-list a:hover .doc-title {
    text-decoration-line: underline;
  }

  .docket-list a::before {
    content: var(--leader-dots) / "";
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 0;
    overflow: hidden;
    white-space: nowrap;
    color: var(--faint);
  }

  .doc-code {
    grid-column: 1;
    grid-row: 1;
    min-inline-size: 0;
    color: var(--accent-warm);
    font-weight: var(--w-title);
    overflow: hidden;
  }

  .doc-title {
    grid-column: 3;
    grid-row: 1;
    min-inline-size: 0;
    overflow-wrap: break-word;
    text-decoration: none;
    text-underline-offset: 0.18em;
  }

  .series-list {
    display: grid;
    gap: 0;
    list-style: none;
    padding-inline-start: 0;
  }

  .series-list > li {
    display: grid;
    grid-template-columns: var(--series-index-cols, 2ch) 4ch minmax(0, 1fr);
    column-gap: 1ch;
    align-items: baseline;
    min-inline-size: 0;
  }

  .series-list > li::before {
    content: var(--leader-dots) / "";
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 0;
    overflow: hidden;
    white-space: nowrap;
    color: var(--faint);
  }

  .series-index {
    grid-column: 1;
    grid-row: 1;
    color: var(--accent-warm);
    font-weight: var(--w-title);
    white-space: nowrap;
  }

  .series-title {
    grid-column: 3;
    grid-row: 1;
    min-inline-size: 0;
    overflow-wrap: break-word;
  }

  .record--patent {
    grid-template-columns: var(--patent-id-cols, 15ch) minmax(0, 1fr);
    column-gap: 2ch;
    row-gap: 0;
    padding-block: 0;
  }

  .record--patent .record__title {
    grid-column: 1;
  }

  .record--patent .record__body {
    grid-column: 2;
  }

  .record--patent .record__body > * + * {
    margin-block-start: 0;
  }

  .record--patent + .record--patent {
    margin-block-start: 1lh;
  }

  .record--patent + .record--patent::before {
    /* Hairline centered in the 1lh gap between patent rows; drawn out of
       flow so text rows stay on the lh grid. */
    content: "";
    position: absolute;
    inset-block-start: -0.5lh;
    inset-inline: 0;
    border-block-start: 1px solid var(--faint);
  }

  .patent-title,
  .patent-family {
    overflow-wrap: break-word;
  }

  .patent-family {
    color: var(--muted);
  }

  .dispatch-list {
    display: grid;
    gap: 0;
    list-style: none;
  }

  .dispatch-list li {
    display: grid;
    grid-template-columns: max-content minmax(1ch, 1fr) max-content;
    column-gap: 1ch;
    align-items: baseline;
  }

  .dispatch-list li::before {
    content: var(--leader-dots) / "";
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 0;
    overflow: hidden;
    white-space: nowrap;
    color: var(--faint);
  }

  .dispatch-list > li > span:first-child {
    grid-column: 1;
    grid-row: 1;
    display: block;
    min-inline-size: 0;
    color: var(--muted);
    font-weight: var(--w-label);
    overflow: hidden;
    text-transform: uppercase;
  }

  .dispatch-list > li > span:first-child::after {
    content: none;
  }

  .dispatch-list a {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
    min-inline-size: 0;
    overflow-wrap: normal;
    text-align: end;
    white-space: nowrap;
    word-break: normal;
  }

  .site-footer {
    border-block-start: 0;
    color: var(--muted);
    text-align: center;
    scroll-margin-block-start: 1lh;
  }

  .site-footer::before {
    content: var(--rule-glyphs) / "";
    display: block;
    margin-block-end: 1lh;
    overflow: hidden;
    white-space: nowrap;
    color: var(--rule);
  }

  .site-footer__line {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 1ch;
  }

  .site-footer__item {
    white-space: nowrap;
  }

  .endmark {
    color: var(--muted);
    font-weight: var(--w-title);
    text-align: end;
  }

  .tracked {
    color: var(--accent-warm);
    font-weight: var(--w-title);
    text-transform: uppercase;
  }

  .wordmark,
  .panel__title,
  .record__title,
  .artifact-group__title {
    font-size: 1rem;
  }

  .site-footer p + p {
    margin-block-start: 1lh;
  }

  .print-only {
    display: none;
  }

  /* Viewport folds are a screen concern; print must lay out identically
     whether the print engine measures the paper or the page content box.
     Panel content narrows below 70ch here (68ch at 761-900px, 34ch below),
     so wide registers fold; print content stays ~100ch and never folds. */
  @media screen and (max-width: 900px) {
    .record,
    .record--patent {
      grid-template-columns: 1fr;
      row-gap: 1lh;
    }

    .record--patent .record__title,
    .record--patent .record__body {
      grid-column: 1;
    }

    .record--patent {
      row-gap: 0;
    }

    /* Folded docket rows fill the label line with leader dots to the
       right edge, like Dispatch; the title takes its own line. */
    .docket-list a {
      grid-template-columns: var(--docket-code-cols, 6ch) minmax(1ch, 1fr);
    }

    .doc-title {
      grid-column: 1 / -1;
      grid-row: 2;
      overflow-wrap: break-word;
    }
  }

  @media screen and (min-width: 761px) and (max-width: 900px) {
    .page {
      inline-size: 72ch;
      max-inline-size: calc(100vw - 2rem);
    }
  }

  @media screen and (max-width: 760px) {
    .page {
      gap: 2lh;
      inline-size: 36ch;
      max-inline-size: calc(100vw - 2rem);
      padding-block: 2lh 3lh;
    }

    .panel {
      padding-inline: 1ch;
    }

    .masthead dl {
      grid-template-columns: 9ch minmax(0, 1fr);
      column-gap: 1ch;
    }

    .masthead :is(.name, .uri, .work, .location, .contact) dt {
      grid-column: 1;
      grid-row: auto;
    }

    .masthead :is(.name, .uri, .work, .location, .contact) dd {
      grid-column: 2;
      grid-row: auto;
      justify-self: start;
      text-align: start;
    }

    .artifact-ledger > li {
      grid-template-columns: 5ch minmax(0, 1fr);
      gap: 0 1ch;
    }

    .artifact-title {
      grid-column: 2;
      grid-row: 2;
    }

    /* Folded series rows fill the label line with leader dots to the
       right edge, like Dispatch; the title takes its own line. */
    .series-list > li {
      grid-template-columns: var(--series-index-cols, 2ch) minmax(1ch, 1fr);
    }

    .series-title {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .dispatch-list li {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .dispatch-list li::before {
      content: none;
    }

    .dispatch-list > li > span:first-child {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      column-gap: 1ch;
    }

    .dispatch-list > li > span:first-child::after {
      content: var(--leader-dots) / "";
      grid-column: 2;
      min-inline-size: 0;
      overflow: hidden;
      white-space: nowrap;
      color: var(--faint);
    }

    .dispatch-list a {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
      overflow-wrap: anywhere;
      text-align: start;
      white-space: normal;
    }
  }

}

@layer print-hints {
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}`;
}

export function printCSS(meta: SiteMeta): string {
  return `:root {
  --paper: white;
  --ink: black;
  --muted: #555;
  --faint: #bbb;
  --rule: #000;
  --accent: #000;
  --accent-warm: #000;
}

/* The body hugs the dossier instead of the window: Safari's shrink-to-fit
   measures the document width against the paper, so a window-wide body
   makes every print scale with whatever size the window happened to be. */
html, body {
  inline-size: fit-content;
  margin-inline: auto;
  min-height: 100%;
  background: white;
  color: black;
  font-size: 8.5pt;
  line-height: 13pt;
  margin: 0;
  padding: 0;
}

@page {
  size: A4;
  margin: 15mm 15mm 20mm;

  @bottom-center {
    content: "${cssString(`${meta.name} · ${meta.tagline} · page `)}" counter(page) " of " counter(pages);
    font-family: ${fontStackCSS()};
    font-size: 8.5pt;
    color: #555;
  }
}

a {
  color: black;
  text-decoration: none;
}

.page {
  display: block;
  inline-size: auto;
  max-width: none;
  padding: 0;
}

/* .page is a block in print, so restore the panel separation the
   screen grid gap provided; without it adjacent box borders merge. */
.page > * + *,
main > * + * {
  margin-block-start: 1lh;
}

main,
.records,
.artifact-ledger {
  display: block;
}

/* Panels keep the screen box-and-straddling-title grammar; sections that
   span a page break get a complete box on every fragment. */
.panel {
  break-inside: auto;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

/* WebKit's print pipeline paints a clipped pseudo-element as invisible
   glyphs when it carries its own color; inherited ink at reduced opacity
   is the faint gray (27% black on white is exactly #bbb) and paints on
   every engine. Alt text is also restated away for the same pipeline. */
.record-index li::before,
.dispatch-list li::before,
.artifact-venue::after {
  content: var(--leader-dots);
}

.record-index li::before,
.dispatch-list li::before,
.artifact-venue::after,
.artifact-group__title::after,
.series-list > li::before {
  color: inherit;
  opacity: 0.27;
}

.artifact-group__title::after {
  content: var(--rule-glyphs);
}

.masthead,
.record-index {
  break-inside: avoid;
}

.dispatch {
  break-inside: avoid-page;
  page-break-inside: avoid;
}

/* The register is one atomic table; Chromium ignores break-inside:
   avoid-page on cloned-border boxes, so pin the break explicitly. */
#patent-register {
  break-before: page;
}

/* Deliberate whitespace on the prior page: without this break,
   Education straddles the page boundary and splits mid-register. */
#education {
  break-before: page;
}

/* WebKit truncates margins at forced page starts, which would leave the
   straddling title's upper half clipped on the previous page; a
   transparent leading border survives fragmentation and keeps the title
   inside its page on every engine. */
#education,
#patent-register {
  border-block-start: 0.5lh solid transparent;
}

.masthead .location span::before {
  color: var(--ink);
}

.record {
  break-inside: auto;
  grid-template-columns: var(--record-head-cols, 22ch) minmax(0, 1fr);
  column-gap: var(--record-gap, 2ch);
}

/* Real borders, not the screen's absolutely positioned glyph rules: an
   out-of-flow rule strands as a full glyph run on the previous page when
   its record's content is pushed across a break. A border degrades better
   (Chromium drops it at the fragment start), and atomic records were
   tried and rejected: Chromium then refuses to break between records and
   pushes whole sections. */
.record--service + .record--service,
.record--education + .record--education {
  margin-block-start: 1lh;
  border-block-start: 1px solid var(--faint);
}

.record--service + .record--service::before,
.record--education + .record--education::before {
  content: none;
}

.record--education {
  break-inside: avoid;
}

.bullet-list li + li {
  margin-block-start: 0;
}

.artifact-group + .artifact-group {
  margin-block-start: 1lh;
}

.artifact-ledger > li + li {
  margin-block-start: 0;
}

.artifact-ledger > li {
  break-inside: avoid;
}

.record--series .record__body {
  margin-block-start: 0;
}

.record--series {
  break-inside: avoid;
}

/* Two independently packed columns, not CSS multicol (WebKit's print
   pipeline ignores columns) and not a row grid (coupled row heights
   waste a line for every wrapped partner). The renderer counts each
   title's printed lines — exact in a monospace measure — and sets the
   balanced column height. */
.docket-list {
  display: flex;
  flex-flow: column wrap;
  block-size: calc(var(--docket-lines) * 1lh);
  column-gap: 4ch;
}

.docket-list > li {
  inline-size: calc((100% - 4ch) / 2);
}

.docket-list > li {
  break-inside: avoid;
}

.docket-list a {
  grid-template-columns: var(--docket-code-cols, 6ch) minmax(0, 1fr);
}

.docket-list a::before {
  content: none;
}

.doc-title {
  grid-column: 2;
}

.series-list {
  columns: auto;
  display: grid;
}

.series-list > li {
  grid-template-columns: var(--series-index-cols, 2ch) max-content minmax(1ch, 1fr) max-content;
  break-inside: avoid;
}

.series-list > li::before {
  content: var(--leader-dots);
  grid-column: 3;
  grid-row: 1;
  overflow: hidden;
  white-space: nowrap;
}

.series-title {
  grid-column: 2;
}

.series-url {
  grid-column: 4;
  justify-self: end;
  white-space: nowrap;
}

.record__head {
  break-after: avoid;
  break-inside: avoid;
}

.record--patent {
  grid-template-columns: var(--patent-id-cols, 15ch) minmax(0, 1fr);
  column-gap: 2ch;
  row-gap: 0;
  padding-block: 0;
}

/* Print keeps a dense patent register: a quarter-line above each
   hairline clears the previous row's descenders, and the following
   ID row's capitals sit safely under it. A real border, not an inset
   shadow: PDF rasterizers paint phantom side edges for offset shadows. */
.record--patent + .record--patent {
  margin-block-start: 0.25lh;
  border-block-start: 1px solid var(--faint);
}

.record--patent + .record--patent::before {
  content: none;
}

.record--patent .record__title {
  grid-column: 1;
}

.record--patent .record__body {
  grid-column: 2;
}

.record--compact:not(.record--series),
.record--patent {
  break-inside: avoid;
}

h1, h2, h3, h4 {
  break-after: avoid;
}

p, li {
  orphans: 3;
  widows: 3;
}

.print-only {
  display: block;
}

.site-footer {
  display: none;
}

.endmark {
  display: none;
}`;
}
