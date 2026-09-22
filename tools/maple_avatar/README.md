<p align="right">
  <a href="README.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# Maple Avatar importer

This build-time tool imports a real public MXDC character build into the AI
Passport firmware. Browser capture, source parsing, pixel conversion, and
filesystem output are separate modules. Any source-page drift, failed request,
missing Canvas, invalid font, or unsupported server stops the import with an
explicit error; the tool never creates substitute artwork.

## Setup

Node.js 20 or newer and a Chromium-compatible browser are required. On macOS,
the importer uses the installed Google Chrome application when present. On
other systems, or when no system browser is available, install Playwright's
pinned browser after installing dependencies.

```bash
cd tools/maple_avatar
npm ci
npx playwright install chromium
```

The explicit `--browser PATH` option and `MAPLE_AVATAR_CHROME` environment
variable override browser discovery. The browser download is unnecessary when
a compatible executable is supplied.

## Import

The approved build 5293 URL is the default:

```bash
npm run import
npm run import -- 'https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1'
```

Optional overrides are intentionally narrow:

```bash
npm run import -- 5293 --family 'MiiiAo'
```

Supported server values are <code>&#x84DD;&#x8717;&#x725B;</code>,
<code>&#x8611;&#x83C7;&#x4ED4;</code>, <code>&#x7EFF;&#x6C34;&#x7075;</code>,
<code>&#x6F02;&#x6F02;&#x732A;</code>, and <code>&#x5C0F;&#x767D;&#x5154;</code>.
The importer canonicalizes every accepted URL to read-only mode, reads
`CHARACTER_BUILDER_CONFIG`, selects the Henesys background, listens for each
same-origin layer response, and captures unique composited Canvas frames.

The fixed profile area adapts MapleStory's identity-card language for the
small display: server, level, and job use separate berry, amber, and cool-blue
attribute chips, while name and family split one blue nameplate evenly. The
background remains uninterrupted; only the chips and nameplate carry fills. Name
and family each reserve six characters, level supports `LV.999`, job supports
five characters, and server comes from the fixed enum. Overflow fails clearly
instead of shrinking text indefinitely; measured coordinates replace spaces.

## Outputs

- `assets/images/maple-avatar/build-<id>/` preserves source PNGs, device
  previews, font subset, a visual composite, and `manifest.json` provenance.
- `main/maple_avatar/generated/` contains one 240 x 320 RGB565 screen,
  132 x 173 RGB565A8 frames, generated LVGL descriptors, and CMake inventory.
  The opaque avatar is centered horizontally, its visual center sits at 61.8%
  of the 246 px scene, and its feet meet the grass-surface baseline at 232 px.
- The fixed Chinese profile text and nameplate UI are rasterized into the screen at build time.
  Runtime firmware therefore needs no broad CJK font allocation.
- An action with one unique frame has a zero frame delay and is rendered
  statically by the firmware state machine.

Run the importer host tests without downloading a browser:

```bash
npm test
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
