"""Shared helpers for the fontTools scripts in site/."""
from fontTools.ttLib import TTFont


def load_codepoints(path: str) -> list[int]:
    cps: list[int] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                cps.append(int(line, 16))
    return cps


def charmap(font: TTFont) -> dict[int, str]:
    cmap: dict[int, str] = {}
    for table in font["cmap"].tables:
        if table.isUnicode():
            cmap.update(table.cmap)
    return cmap
