<p align="right">
  <a href="CLAUDE.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# `main/maple_avatar/`

> L2 | Parent: [`../../CLAUDE.md`](../../CLAUDE.md)

This module is the generic runtime player. It validates and maps one replaceable
avatar pack, renders its six actions plus the builder page, and keeps navigation
logic independent from LVGL.

## Members

| Member | Responsibility |
| --- | --- |
| `CLAUDE.md` | English module map. |
| `CLAUDE.zh_CN.md` | Simplified Chinese module map. |
| `maple_avatar_app.c` | LVGL presentation for six actions, builder/recovery pages, sample and battery badges. |
| `maple_avatar_app.h` | Presentation API and normalized button commands. |
| `maple_avatar_assets.c` | Avatar-partition adapter that validates, maps, and exposes runtime LVGL descriptors. |
| `maple_avatar_assets.h` | Stable asset dimensions and runtime lookup interface. |
| `maple_avatar_pack_format.c` | Pure schema-v1 parser, bounds checks, and CRC32 verification. |
| `maple_avatar_pack_format.h` | Binary constants, parsed views, and status API shared with host tests. |
| `maple_avatar_state.c` | Pure seven-page navigation, animation, and pause transitions. |
| `maple_avatar_state.h` | State-machine values and functions used by firmware and host tests. |
| `generated/avatar.pack` | Reproducible sample pack injected into the community full image. |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
