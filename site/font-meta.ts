// The Dossier Mono Supplement is a Berkeley Mono metrics shell filled with OFL
// fallback outlines (Noto Sans, Noto Sans Symbols 2, BIZ UDGothic). Its name
// table must credit those sources, not Berkeley Mono's vendor. prepare-fonts.ts
// writes these into nameID 0 and 5 via set-font-names.py, and check-fonts.ts
// asserts them, so the generated copyright and its check cannot drift.
export const supplementalCopyright =
  "Copyright 2022 The Noto Project Authors. Copyright 2022 The BIZ UDGothic Project Authors. Fallback glyphs under the SIL Open Font License 1.1; monospace cell metrics based on Berkeley Mono. Assembled for jfbastien.com.";
export const supplementalVersion = "Version 1.000";
