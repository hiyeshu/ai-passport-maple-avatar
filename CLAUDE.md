<p align="right">
  <a href="CLAUDE.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# CLAUDE.md

[`AGENTS.md`](./AGENTS.md) is the single source of truth for AI instructions in this repository. Claude Code must follow it directly for project structure, build and validation commands, coding conventions, and contribution rules.

Update `AGENTS.md` when the rules change. Do not create a second rule set here, because the two copies would drift.

## Project map

<directory>
components/bsp/ - Stable ESP32-C3 board interfaces and drivers.
main/ - Firmware composition root; `maple_avatar/` owns the imported-character UI, animation state, and generated display resources.
tools/maple_avatar/ - Reproducible MXDC browser capture, RGB565 conversion, and provenance output pipeline.
assets/ - Licensed font material plus preserved source images and capture manifests.
tests/ - Hardware-independent state-machine and repository tests.
docs/ - Authoritative development, hardware, contribution, and release documentation.
</directory>

<config>
README.md - Chinese-only public landing page for this fork, including build entry points and the family notice.
sdkconfig.defaults - ESP32-C3, 8 MB Flash, USB console, and LVGL defaults.
partitions.csv - NVS, PHY data, and single factory-application layout.
dependencies.lock - Pinned ESP-IDF managed-component resolution.
main/CMakeLists.txt - Maple Avatar application sources and embedded-resource inventory.
</config>
