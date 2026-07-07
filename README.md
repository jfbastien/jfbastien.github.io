# jfbastien.com

Static, semantic, single-page systems record for JF Bastien.

The site is generated from `content.md` by the TypeScript code in `site/`.
The visual system is a Berkeley Mono paper dossier: one-size typography,
content-derived registers, generated leaders/rules, and print-aware output.

Useful commands:

```sh
bun run build
bun run check
bun run font:prepare
```

Local prerequisites for `bun run build` / `bun run check`: Chrome (or
`CHROME_PATH`), `mutool` from mupdf-tools, and `pngquant`. CI installs pinned
versions of the same tools.

`bun run font:prepare` is local and intentional. It regenerates checked-in
subsets from licensed local font sources; full source fonts are not committed.
