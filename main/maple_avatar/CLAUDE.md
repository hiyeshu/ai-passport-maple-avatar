<p align="right">
  <a href="CLAUDE.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# `main/maple_avatar/`

> L2 | Parent: [`../../CLAUDE.md`](../../CLAUDE.md)

This module owns the product UI and animation domain. Handwritten code consumes
only the stable asset contract; the importer replaces the `generated/` contents
as one build-scoped unit.

## Members

| Member | Responsibility |
| --- | --- |
| `CLAUDE.md` | English module map. |
| `CLAUDE.zh_CN.md` | Simplified Chinese module map. |
| `maple_avatar_app.c` | LVGL screen, animation timer, optional battery badge, and normalized command handling. |
| `maple_avatar_app.h` | Presentation API and command enumeration. |
| `maple_avatar_assets.h` | Stable types, full-width reference-scale and body-origin-aligned frame dimensions, and generated-data declarations. |
| `maple_avatar_state.c` | Pure six-action animation transitions and timing. |
| `maple_avatar_state.h` | State-machine values and functions used by firmware and host tests. |
| `generated/assets.cmake` | Generated embedded-file inventory. |
| `generated/avatar_generated.c` | Generated LVGL descriptors, action tables, and profile metadata. |
| `generated/screen.rgb565` | Generated 240 x 320 background and profile panel. |
| `generated/stand-00.rgb565a8` | Generated standing frame 0. |
| `generated/stand-01.rgb565a8` | Generated standing frame 1. |
| `generated/stand-02.rgb565a8` | Generated standing frame 2. |
| `generated/walk-00.rgb565a8` | Generated walking frame 0. |
| `generated/walk-01.rgb565a8` | Generated walking frame 1. |
| `generated/walk-02.rgb565a8` | Generated walking frame 2. |
| `generated/walk-03.rgb565a8` | Generated walking frame 3. |
| `generated/attack-00.rgb565a8` | Generated attack frame 0. |
| `generated/attack-01.rgb565a8` | Generated attack frame 1. |
| `generated/attack-02.rgb565a8` | Generated attack frame 2. |
| `generated/sit-00.rgb565a8` | Generated static sitting frame. |
| `generated/two_hand_stand-00.rgb565a8` | Generated two-hand standing frame 0. |
| `generated/two_hand_stand-01.rgb565a8` | Generated two-hand standing frame 1. |
| `generated/two_hand_stand-02.rgb565a8` | Generated two-hand standing frame 2. |
| `generated/two_hand_walk-00.rgb565a8` | Generated two-hand walking frame 0. |
| `generated/two_hand_walk-01.rgb565a8` | Generated two-hand walking frame 1. |
| `generated/two_hand_walk-02.rgb565a8` | Generated two-hand walking frame 2. |
| `generated/two_hand_walk-03.rgb565a8` | Generated two-hand walking frame 3. |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
