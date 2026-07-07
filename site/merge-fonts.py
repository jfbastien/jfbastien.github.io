#!/usr/bin/env python3
import sys
import unicodedata
from fontTools.misc.transform import Transform
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontlib import charmap, load_codepoints


def usage() -> None:
    print(
        "usage: merge-fonts.py BASE.ttf FALLBACK.ttf CODEPOINTS.txt OUT.ttf",
        file=sys.stderr,
    )


def transform_glyph(font: TTFont, glyph_name: str, scale: float):
    glyph_set = font.getGlyphSet()
    pen = TTGlyphPen(glyph_set)
    glyph_set[glyph_name].draw(TransformPen(pen, Transform(scale, 0, 0, scale, 0, 0)))
    return pen.glyph()


def rename_components(glyph, rename: dict[str, str]) -> None:
    if not glyph.isComposite():
        return
    for component in glyph.components:
        if component.glyphName in rename:
            component.glyphName = rename[component.glyphName]


def main(argv: list[str]) -> int:
    if len(argv) != 5:
        usage()
        return 2

    base_path, fallback_path, cps_path, out_path = argv[1:]
    base = TTFont(base_path, recalcTimestamp=False)
    fallback = TTFont(fallback_path)
    cps = load_codepoints(cps_path)
    base_cmap = charmap(base)
    fallback_cmap = charmap(fallback)
    base_width = base["hmtx"].metrics.get("zero", (600, 0))[0]

    missing = [cp for cp in cps if cp not in base_cmap]
    unavailable = [cp for cp in missing if cp not in fallback_cmap]
    if unavailable:
        formatted = ", ".join(f"U+{cp:04X}" for cp in unavailable)
        raise SystemExit(f"fallback font does not cover: {formatted}")

    base_order = list(base.getGlyphOrder())
    fallback_order = fallback.getGlyphOrder()
    rename: dict[str, str] = {}

    for name in fallback_order:
        if name == ".notdef":
            continue
        if name not in fallback["glyf"].glyphs:
            continue
        new_name = f"jf_fallback_{name}"
        i = 2
        while new_name in base["glyf"].glyphs or new_name in rename.values():
            new_name = f"jf_fallback_{name}_{i}"
            i += 1
        rename[name] = new_name

    # Add every glyph in the fallback subset, including unencoded components.
    for old_name, new_name in rename.items():
        base_order.append(new_name)

    base.setGlyphOrder(base_order)

    fallback_glyf = fallback["glyf"]
    fallback_hmtx = fallback["hmtx"]
    base_glyf = base["glyf"]
    base_hmtx = base["hmtx"]

    for old_name, new_name in rename.items():
        glyph = fallback_glyf[old_name]
        rename_components(glyph, rename)

        advance, lsb = fallback_hmtx.metrics.get(old_name, (base_width, 0))
        encoded_cps = [cp for cp, name in fallback_cmap.items() if name == old_name]
        is_mark = any(unicodedata.category(chr(cp)).startswith("M") for cp in encoded_cps)
        # East Asian Wide glyphs keep their full size and take two cells.
        is_wide = any(unicodedata.east_asian_width(chr(cp)) in ("W", "F") for cp in encoded_cps)

        if is_mark or advance == 0:
            base_hmtx.metrics[new_name] = (0, lsb)
            base_glyf.glyphs[new_name] = glyph
        else:
            target_width = base_width * 2 if is_wide else base_width
            scale = target_width / advance
            base_glyf.glyphs[new_name] = transform_glyph(fallback, old_name, scale)
            base_hmtx.metrics[new_name] = (target_width, round(lsb * scale))

    for table in base["cmap"].tables:
        if not table.isUnicode():
            continue
        for cp in missing:
            table.cmap[cp] = rename[fallback_cmap[cp]]

    if "DSIG" in base:
        del base["DSIG"]

    base["maxp"].numGlyphs = len(base_order)
    base.recalcTimestamp = False
    base.save(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
