#!/usr/bin/env python3
import sys
from fontTools.ttLib import TTFont


def usage() -> None:
    print(
        "usage: set-font-names.py FONT.ttf FAMILY SUBFAMILY POSTSCRIPT [COPYRIGHT] [VERSION]",
        file=sys.stderr,
    )


def main(argv: list[str]) -> int:
    if not 5 <= len(argv) <= 7:
        usage()
        return 2

    font_path, family, subfamily, postscript = argv[1:5]
    copyright_notice = argv[5] if len(argv) >= 6 else None
    version = argv[6] if len(argv) >= 7 else None
    full_name = f"{family} {subfamily}"
    font = TTFont(font_path, recalcTimestamp=False)
    names = font["name"]

    values = {
        1: family,
        2: subfamily,
        3: f"jfbastien.com;{postscript}",
        4: full_name,
        6: postscript,
        16: family,
        17: subfamily,
        25: postscript.removesuffix(f"-{subfamily}"),
    }
    # nameID 0 (copyright) and 5 (version) pass through from the source font;
    # overwrite them only when a replacement is supplied. The supplement is OFL
    # fallback outlines and must not keep the primary's Berkeley Mono notice.
    if copyright_notice is not None:
        values[0] = copyright_notice
    if version is not None:
        values[5] = version

    for name_id in values:
        names.removeNames(nameID=name_id)

    for name_id, value in values.items():
        names.setName(value, name_id, 3, 1, 0x409)
        names.setName(value, name_id, 1, 0, 0)

    if "DSIG" in font:
        del font["DSIG"]

    font.recalcTimestamp = False
    font.save(font_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
