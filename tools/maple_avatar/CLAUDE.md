<p align="right">
  <a href="CLAUDE.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# `tools/maple_avatar/`

> L2 | Parent: [`../../CLAUDE.md`](../../CLAUDE.md)

This module is the capture and compilation boundary. Browser integration,
source validation, pure pixels, binary packaging, and repository persistence
remain separate; the CLI and hosted service share the same artifact compiler.

## Members

| Member | Responsibility |
| --- | --- |
| `CLAUDE.md` | English module map. |
| `CLAUDE.zh_CN.md` | Simplified Chinese module map. |
| `README.md` | English setup, import, failure, and output guide. |
| `README.zh_CN.md` | Simplified Chinese importer guide. |
| `import_avatar.mjs` | Local CLI composition root for capture and repository output. |
| `package.json` | Pinned Playwright dependency and npm commands. |
| `package-lock.json` | Reproducible npm dependency graph. |
| `lib/artifacts.mjs` | Shared immutable artifact graph for CLI and hosted service. |
| `lib/action-diagnostic.mjs` | Bounded, read-only action-layer probes that identify one verified blocking appearance or preserve a generic failure. |
| `lib/browser-controls.mjs` | Browser launch and source-page control helpers shared by capture. |
| `lib/capture.mjs` | Playwright adapter, anatomy-centered Canvas capture, action-failure handoff, fixed-size family rendering, profile screen, and live builder-entry screen. |
| `lib/cli.mjs` | Pure argument parsing, sample defaults, and explicit-server boundary. |
| `lib/font.mjs` | Noto Sans SC subset download and validation. |
| `lib/layout.mjs` | Pure profile-card geometry, fixed logical-pixel scaling, and head/body/foot anchoring. |
| `lib/output.mjs` | Atomic provenance writer with twelve-slot family capacity and sample `avatar.pack` persistence. |
| `lib/pack.mjs` | Deterministic schema-v1 pack compiler/parser and CRC32 implementation. |
| `lib/pixels.mjs` | Pure RGBA-to-RGB565/RGB565A8 conversion. |
| `lib/source.mjs` | MXDC URL trust boundary, server enum, source facts, and twelve-slot family input. |
| `test/artifacts.test.mjs` | Clean presentation and pack-type separation tests at the artifact seam. |
| `test/action-diagnostic.test.mjs` | Unique-culprit, ambiguity, candidate-cap, and time-budget regression tests. |
| `test/cli.test.mjs` | CLI defaults and argument-boundary tests. |
| `test/font.test.mjs` | Font request and CSS parsing tests. |
| `test/layout.test.mjs` | Golden-ratio, seated ground-contact, decorative-extents, and action-anchor regressions. |
| `test/pack.test.mjs` | Pack determinism, offsets, schema, and corruption tests. |
| `test/pixels.test.mjs` | Binary pixel-layout tests. |
| `test/source.test.mjs` | Source canonicalization and twelve-slot profile-input tests. |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
