#!/usr/bin/env python3
import json
import sys
from fontTools.ttLib import TTFont
from fontlib import charmap


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: font-info.py FONT", file=sys.stderr)
        return 2

    font = TTFont(argv[1])
    axes = []
    if "fvar" in font:
        axes = [
            {
                "tag": axis.axisTag,
                "min": axis.minValue,
                "default": axis.defaultValue,
                "max": axis.maxValue,
            }
            for axis in font["fvar"].axes
        ]

    features = []
    ligatures = []
    if "GSUB" in font and font["GSUB"].table.FeatureList:
        gsub = font["GSUB"].table
        features = sorted({record.FeatureTag for record in gsub.FeatureList.FeatureRecord})
        cmap = charmap(font)
        glyph_to_char = {}
        for codepoint, glyph_name in cmap.items():
            glyph_to_char.setdefault(glyph_name, chr(codepoint))

        lookup_list = gsub.LookupList
        feature_lookup_indices = set()
        for record in gsub.FeatureList.FeatureRecord:
            if record.FeatureTag not in {"calt", "liga", "dlig"}:
                continue
            feature_lookup_indices.update(record.Feature.LookupListIndex)

        seen_ligatures = set()

        def add_ligature(text: str, glyph: str) -> None:
            key = (text, glyph)
            if key in seen_ligatures:
                return
            seen_ligatures.add(key)
            ligatures.append({"text": text, "glyph": glyph})

        for lookup_index in sorted(feature_lookup_indices):
            lookup = lookup_list.Lookup[lookup_index]
            if lookup.LookupType != 4:
                continue
            for subtable in lookup.SubTable:
                for first_glyph, records in subtable.ligatures.items():
                    chars = [glyph_to_char.get(first_glyph)]
                    if chars[0] is None:
                        continue
                    for record in records:
                        seq = chars + [glyph_to_char.get(component) for component in record.Component]
                        if all(seq):
                            add_ligature("".join(seq), record.LigGlyph)

        for glyph in font.getGlyphOrder():
            if ".lig" not in glyph:
                continue
            base = glyph.split(".lig", 1)[0]
            pieces = [glyph_to_char.get(part) for part in base.split("_")]
            if all(pieces):
                add_ligature("".join(pieces), glyph)

    print(json.dumps({
        "family": font["name"].getDebugName(1),
        "subfamily": font["name"].getDebugName(2),
        "version": font["name"].getDebugName(5),
        "axes": axes,
        "features": features,
        "glyphs": font.getGlyphOrder(),
        "ligatures": sorted(ligatures, key=lambda item: (item["text"], item["glyph"])),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
