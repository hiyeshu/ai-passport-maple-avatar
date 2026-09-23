#!/usr/bin/env python3
"""
[INPUT]: Depends on an ESP-IDF build directory and the generated sample avatar.pack.
[OUTPUT]: Adds the sample pack to the configured avatar partition in the merged 0x0 image.
[POS]: Release-image assembly Adapter; keeps community firmware immediately previewable.
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from __future__ import annotations

import sys
from pathlib import Path

from verify_firmware import PARTITION_TABLE_SIZE, parse_partition_table


ROOT = Path(__file__).resolve().parents[1]


def merge_avatar_pack(build_dir: Path, pack_path: Path) -> Path:
    merged_path = build_dir / "FoloToy-AI-Passport-full.bin"
    table_path = build_dir / "partition_table" / "partition-table.bin"
    if not merged_path.is_file() or not table_path.is_file() or not pack_path.is_file():
        raise ValueError("merged firmware, partition table, or avatar pack is missing")

    table = table_path.read_bytes()
    if len(table) < PARTITION_TABLE_SIZE:
        table = table.ljust(PARTITION_TABLE_SIZE, b"\xff")
    partitions, _ = parse_partition_table(table)
    matches = [item for item in partitions if item.label == "avatar"]
    if len(matches) != 1 or matches[0].kind != 1 or matches[0].subtype != 0x40:
        raise ValueError("partition table must contain one data/0x40 avatar partition")
    partition = matches[0]
    pack = pack_path.read_bytes()
    if not pack or len(pack) > partition.size:
        raise ValueError(
            f"avatar pack is {len(pack)} bytes; partition limit is {partition.size}"
        )

    merged = bytearray(merged_path.read_bytes())
    required_size = partition.offset + len(pack)
    if len(merged) < required_size:
        merged.extend(b"\xff" * (required_size - len(merged)))
    merged[partition.offset:required_size] = pack
    merged_path.write_bytes(merged)
    return merged_path


def main() -> int:
    build_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "build").resolve()
    pack_path = Path(
        sys.argv[2]
        if len(sys.argv) > 2
        else ROOT / "main" / "maple_avatar" / "generated" / "avatar.pack"
    ).resolve()
    try:
        output = merge_avatar_pack(build_dir, pack_path)
    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(f"Merged avatar pack: {pack_path.stat().st_size} bytes into {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
