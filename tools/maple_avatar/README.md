<p align="right">
  <a href="README.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# Maple Avatar importer

This build-time tool turns one public MXDC character build into preserved source
artifacts and one replaceable `avatar.pack`. Browser capture, source parsing,
pixel conversion, pack compilation, and filesystem persistence are separate.
Source drift, request failure, missing Canvas, invalid font, or invalid profile
data fails explicitly; no sample or generated artwork is substituted.

## Setup

Node.js 20 or newer and a Chromium-compatible browser are required:

```bash
cd tools/maple_avatar
npm ci
npx playwright install chromium
```

On macOS, an installed Google Chrome is discovered automatically.
`--browser PATH` and `MAPLE_AVATAR_CHROME` override discovery.

## Import

Running with no arguments reproduces the repository's approved 5293 sample and
marks it as the community sample:

```bash
npm run import
```

Every explicit user build requires a server. Family is optional because the
source does not provide it:

```bash
npm run import -- \
  'https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1' \
  --server 'SERVER_NAME' \
  --family 'FAMILY_NAME'
```

Supported servers are <code>&#x84DD;&#x8717;&#x725B;</code>,
<code>&#x8611;&#x83C7;&#x4ED4;</code>, <code>&#x7EFF;&#x6C34;&#x7075;</code>,
<code>&#x6F02;&#x6F02;&#x732A;</code>, and <code>&#x5C0F;&#x767D;&#x5154;</code>.
Name, level, and job are immutable source facts read from
`CHARACTER_BUILDER_CONFIG`; only server and family are supplied externally.

## Outputs

- `assets/images/maple-avatar/build-<id>/` preserves source frames, 240 x 246
  device frames, the Henesys background, 240 x 320 profile and builder screens,
  font subset, preview, and a SHA-256 provenance manifest.
- `main/maple_avatar/generated/avatar.pack` is the single firmware resource:
  two RGB565 screens plus six ordered RGB565A8 action sets, versioned geometry,
  a sample flag, build ID, and payload CRC32.
- The CLI and hosted service call `lib/artifacts.mjs`, so browser preview,
  download, and device installation cannot silently compile different pixels.
- One-frame actions use a zero frame delay and render statically.
- Each action centers its first base-head frame and grounds its base body foot
  at the same grass line. Every animation frame and layer keeps its source offset;
  hats, hair, pets, weapons, and effects cannot resize or recenter the body.
  Oversized effects may crop at the screen edge instead.

Run host tests without opening a browser:

```bash
npm test
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
