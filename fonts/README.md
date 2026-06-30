# Font Sources

The webfont build uses variable Alegreya Sans sources vendored from:

- Repository: https://github.com/googlefonts/Alegreya-Sans
- Commit: `fcc2eebac904e0af34a67565fd2701ba67f54a3d`
- License: SIL Open Font License 1.1, see `OFL.txt`

Vendored source hashes:

```text
10401cfd3af9c3a58dc72d3ac75057b8c1ca78869449057e8351e938a17f41a4  AlegreyaSans[wght].ttf
2acdbaa8cb22cadc43e379fd7ab489e63862aab75788a7528efb73dbf587b096  AlegreyaSans-Italic[wght].ttf
```

`site/assemble.ts` subsets these sources into WOFF2 files for the exact rendered
page content. The remaining static TTFs are used by `social/generate.ts` for
the Open Graph image.
