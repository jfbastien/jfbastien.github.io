# Font Instructions

The repo serves checked-in WOFF2 subsets only. Full source fonts are not
committed.

Primary face:

- family: `Berkeley Mono`;
- variable subset;
- must preserve `wght`, `wdth`, `slnt`, and `calt`.

Supplement face:

- family: `Dossier Mono Supplement`;
- holds only the page glyphs Berkeley Mono lacks, the Berkeley Mono characters
  that share a grapheme cluster with one of them (so the cluster shapes in one
  face), and the `0` that anchors the cell width;
- must preserve Berkeley Mono's 600-unit monospace cell for visible glyphs:
  half-width glyphs advance 600, East Asian wide glyphs advance exactly two
  cells (1200) at full size;
- carries no GPOS for its marks: a mark or zero-advance fallback glyph
  advances 0; when it has ink, the build centres that ink on the preceding cell
  (x = -300) only if the fallback draws it centred on its own origin, within
  one unit, and otherwise fails, as it does for a mark the fallback advances;
- leaves a mark's vertical position as the fallback draws it, unchecked; an
  enclosing mark may overhang its cell;
- needs a page cluster holding such a mark to advance exactly one cell before
  it and to hold no second one;
- copies fallback outlines flattened, never as composites.

Do not put the supplement face before Berkeley Mono in normal or code stacks;
it can mask Berkeley Mono features.

Japanese supplement glyphs should come from BIZ UDGothic Regular when available.
Rare Latin/phonetic glyphs and symbols may come from the local Noto fallback
sources. Keep `fonts/supplement.json` free of local paths or purchase details.

Do not commit full source fonts, purchase-specific paths, license keys, account
IDs, or local order details.
