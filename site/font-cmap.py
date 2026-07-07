#!/usr/bin/env python3
import json
import sys
from fontTools.ttLib import TTFont
from fontlib import charmap, load_codepoints


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: font-cmap.py FONT.ttf CODEPOINTS.txt", file=sys.stderr)
        return 2

    cmap = charmap(TTFont(argv[1]))
    requested = load_codepoints(argv[2])
    covered = [cp for cp in requested if cp in cmap]
    print(json.dumps([f"{cp:x}" for cp in covered], separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
