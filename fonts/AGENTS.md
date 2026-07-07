# Font Instructions

The repo serves checked-in WOFF2 subsets only. Full source fonts are not
committed.

Primary face:

- family: `Berkeley Mono`;
- variable subset;
- must preserve `wght`, `wdth`, `slnt`, and `calt`.

Supplement face:

- family: `Dossier Mono Supplement`;
- only for glyphs Berkeley Mono does not cover;
- must preserve Berkeley Mono's 600-unit monospace cell for visible glyphs:
  half-width glyphs advance 600, East Asian wide glyphs advance exactly two
  cells (1200) at full size.

Do not put the supplement face before Berkeley Mono in normal or code stacks;
it can mask Berkeley Mono features.

Japanese supplement glyphs should come from BIZ UDGothic Regular when available.
Rare Latin/phonetic glyphs and symbols may come from the local Noto fallback
sources. Keep `fonts/supplement.json` free of local paths or purchase details.

Do not commit full source fonts, purchase-specific paths, license keys, account
IDs, or local order details.
