# Webfont Subsets

This directory contains generated font subsets for `jfbastien.com`.

The site serves checked-in WOFF2 subsets only:

- `BerkeleyMonoSubset.<hash>.woff2`
  - primary Berkeley Mono variable face;
  - preserves `wght`, `wdth`, `slnt`, and `calt`;
  - served as `Berkeley Mono`.
- `DossierMonoSupplement.<hash>.woff2`
  - supplemental monospaced face for page glyphs Berkeley Mono does not cover;
  - generated from a Berkeley Mono metrics shell plus fallback outlines;
  - served as `Dossier Mono Supplement`.

The local TTF subsets are used by checks and Open Graph generation:

- `BerkeleyMonoSubset.ttf`
- `BerkeleyMonoSubsetStatic.ttf`
- `BerkeleyMonoSubsetBoldStatic.ttf`
- `DossierMonoSupplement.ttf`

`supplement.json` is generated provenance: it records which visible missing
glyphs came from which fallback source. It is not an input allowlist.

Full source fonts are intentionally not committed.

## Local Sources

Set `BERKELEY_MONO_SOURCE` to a licensed Berkeley Mono variable source when
regenerating the subsets.

Fallback outlines come from local OFL fonts:

- `SUPPLEMENT_LATIN_SOURCE` for Noto Sans;
- `SUPPLEMENT_SYMBOL_SOURCE` for Noto Sans Symbols 2;
- `SUPPLEMENT_JP_SOURCE` for BIZ UDGothic Regular.

Set those variables if the fonts are not installed in the local locations known
to `site/prepare-fonts.ts`.

The fallback licenses are in `OFL-Noto.txt` and `OFL-BIZ-UDGothic.txt`.

## Rebuild

```sh
bun run font:prepare
```

The command renders the page, extracts visible screen/print text and
CSS-generated text, then subsets only what the page actually uses. Decorative
leaders, rules, closing marks, and Japanese location text are included because
they render on the page, not because a separate allowlist names them.

Do not commit full source fonts, purchase identifiers, license keys, or local
account details.
