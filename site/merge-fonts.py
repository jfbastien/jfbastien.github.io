#!/usr/bin/env python3
import sys
import unicodedata
from fontTools.misc.transform import Transform
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontlib import charmap, load_codepoints


def usage() -> None:
    print(
        "usage: merge-fonts.py BASE.ttf FALLBACK.ttf CODEPOINTS.txt OUT.ttf",
        file=sys.stderr,
    )


def outline(font: TTFont, glyph_name: str, transform: Transform):
    # Composites are flattened: their component names belong to the fallback.
    glyph_set = font.getGlyphSet()
    recording = DecomposingRecordingPen(glyph_set)
    glyph_set[glyph_name].draw(recording)
    pen = TTGlyphPen(None)
    recording.replay(TransformPen(pen, transform))
    return pen.glyph()


def main(argv: list[str]) -> int:
    if len(argv) != 5:
        usage()
        return 2

    base_path, fallback_path, cps_path, out_path = argv[1:]
    base = TTFont(base_path, recalcTimestamp=False)
    fallback = TTFont(fallback_path)
    if "glyf" not in fallback:
        raise SystemExit(f"{fallback_path}: no glyf table; cubic CFF outlines cannot be copied into glyf")
    cps = load_codepoints(cps_path)
    base_cmap = charmap(base)
    fallback_cmap = charmap(fallback)
    base_width = base["hmtx"]["zero"][0]

    missing = [cp for cp in cps if cp not in base_cmap]
    unavailable = [cp for cp in missing if cp not in fallback_cmap]
    if unavailable:
        formatted = ", ".join(f"U+{cp:04X}" for cp in unavailable)
        raise SystemExit(f"fallback font does not cover: {formatted}")

    base_order = list(base.getGlyphOrder())
    encoded: dict[str, list[int]] = {}
    for cp in missing:
        encoded.setdefault(fallback_cmap[cp], []).append(cp)
    rename: dict[str, str] = {}

    for name in fallback.getGlyphOrder():
        if name not in encoded:
            continue
        new_name = f"jf_fallback_{name}"
        i = 2
        while new_name in base["glyf"].glyphs or new_name in rename.values():
            new_name = f"jf_fallback_{name}_{i}"
            i += 1
        rename[name] = new_name

    for old_name, new_name in rename.items():
        base_order.append(new_name)

    base.setGlyphOrder(base_order)

    fallback_hmtx = fallback["hmtx"]
    base_glyf = base["glyf"]
    base_hmtx = base["hmtx"]

    for old_name, new_name in rename.items():
        advance, lsb = fallback_hmtx[old_name]
        encoded_cps = encoded[old_name]
        is_mark = any(unicodedata.category(chr(cp)).startswith("M") for cp in encoded_cps)
        # East Asian Wide glyphs keep their full size and take two cells.
        is_wide = any(unicodedata.east_asian_width(chr(cp)) in ("W", "F") for cp in encoded_cps)

        if is_mark or advance == 0:
            formatted = ", ".join(f"U+{cp:04X}" for cp in encoded_cps)
            if advance != 0:
                raise SystemExit(f"{formatted}: mark advances {advance} in the fallback; only a zero-advance mark can sit on the preceding cell without GPOS")
            glyph = outline(fallback, old_name, Transform())
            if glyph.numberOfContours == 0:
                # No ink, nothing to place: a zero-width format character.
                base_glyf.glyphs[new_name] = glyph
                base_hmtx.metrics[new_name] = (0, lsb)
                continue
            # Without GPOS the mark draws where the pen stops after its base.
            # Moving its ink onto the cell before the origin keeps its place on
            # that base only when the fallback centres the ink on its own origin.
            x_min, _, x_max, _ = glyph.coordinates.calcIntBounds()
            if abs(x_min + x_max) > 2:
                raise SystemExit(f"{formatted}: fallback ink spans x={x_min}..{x_max}, centred at {(x_min + x_max) / 2}, not within one unit of its origin; placing it needs GPOS")
            shift = (-base_width - x_min - x_max) // 2
            glyph.coordinates.translate((shift, 0))
            base_glyf.glyphs[new_name] = glyph
            base_hmtx.metrics[new_name] = (0, x_min + shift)
        else:
            target_width = base_width * 2 if is_wide else base_width
            scale = target_width / advance
            base_glyf.glyphs[new_name] = outline(fallback, old_name, Transform(scale, 0, 0, scale, 0, 0))
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
