<p align="right">
  <a href="CLAUDE.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# `tools/maple_avatar/`

> L2 | Parent: [`../../CLAUDE.md`](../../CLAUDE.md)

This module is the build-time import boundary. DOM selectors stay in capture,
binary conversion stays pure, and output writes only build-scoped provenance
assets plus the firmware-generated directory.

## Members

| Member | Responsibility |
| --- | --- |
| `CLAUDE.md` | English module map. |
| `CLAUDE.zh_CN.md` | Simplified Chinese module map. |
| `README.md` | English setup, import, failure, and output guide. |
| `README.zh_CN.md` | Simplified Chinese importer guide. |
| `import_avatar.mjs` | CLI composition root for capture and output. |
| `package.json` | Pinned Playwright dependency and npm commands. |
| `package-lock.json` | Reproducible npm dependency graph. |
| `lib/capture.mjs` | Playwright DOM adapter, Canvas-frame capture, and Maple profile-card composition. |
| `lib/cli.mjs` | Pure argument parsing and help text. |
| `lib/font.mjs` | Noto Sans SC TrueType subset download and validation. |
| `lib/output.mjs` | Atomic provenance and generated-firmware writer. |
| `lib/pixels.mjs` | Pure RGBA-to-RGB565/RGB565A8 conversion. |
| `lib/source.mjs` | URL trust boundary, server enum, profile fallbacks, and display-capacity validation. |
| `test/cli.test.mjs` | CLI argument-boundary tests. |
| `test/font.test.mjs` | Font request and CSS parsing tests. |
| `test/layout.test.mjs` | Golden-ratio avatar geometry and ground-contact test. |
| `test/output.test.mjs` | ESP-IDF embedded-file symbol regression test. |
| `test/pixels.test.mjs` | Binary pixel-layout tests. |
| `test/source.test.mjs` | Source canonicalization and profile tests. |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
