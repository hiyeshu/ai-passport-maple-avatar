<p align="right">
  <a href="README.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# Assets

This directory stores reusable fonts, images, music, and sound effects, organized by asset type.

Keep each asset in the matching subdirectory and document its destination, naming, integration method, and source/license. Do not mix binary assets with Markdown documentation.

## Fonts

Store reusable font files and generated font sources in `fonts/`.

- Use descriptive names that include the family, weight, size, and format when relevant.
- Document the source, license, character range, conversion command, and expected destination.
- Check Flash and internal-RAM impact before adding a font; the ESP32-C3 has no PSRAM.
- Do not commit fonts whose license does not permit redistribution.

`fonts/NotoSansSC-OFL.txt` preserves the SIL Open Font License 1.1 notice for
the Noto Sans SC semibold subsets downloaded by the Maple Avatar importer. The
subset stored with each capture is used only at build time to rasterize the
fixed profile lines; it is not loaded by the ESP32 at runtime. Exact URLs and
SHA-256 values are recorded in that capture's `manifest.json`.

## Images

Store reusable source images and generated display assets in `images/`.

- Use descriptive names and document dimensions, pixel format, conversion steps, and destination.
- Prefer formats suitable for the 240 × 320 RGB565 display and account for Flash and internal RAM.
- Preserve editable sources where licensing permits, and record the source and license.
- Never commit device QR secrets, credentials, or personal data in images.

### Maple Avatar capture

`images/maple-avatar/build-5293/` is a reproducible capture of the public
[MXDC character build](https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1).
The project owner confirmed that these public resources may be used directly
for this implementation. The importer preserves the real Canvas output and
Henesys background; it never substitutes AI-generated or placeholder art.

- `henesys.png`: the page's original 493 x 272 background file.
- `frames/`: original composited Canvas frames at their page dimensions.
- `device-preview/`: body-origin-aligned 240 x 246 transparent device frames.
- `screen.png`: 240 x 320 RGB background with MapleStory-inspired attribute chips and name/family nameplate.
- `builder-screen.png`: 240 x 320 in-device instructions retaining `avatar.miiiao.cn` and marking it as pending ICP filing.
- `preview.png`: visual inspection composite for the default frame.
- `device-mockup.png`: 3840 x 2160 README presentation mockup directly
  compositing the generated `preview.png` into the screen region of the
  user-supplied AI Passport hardware image. Pixels outside the screen remain
  unchanged; this is not a firmware input or hardware-validation result.
- `manifest.json`: source URL, build revision, appearance IDs, action timing,
  layer paths, dimensions, and SHA-256 provenance.
- `ui-font.ttf`: exact Noto Sans SC subset used to rasterize fixed profile
  text and the name/family labels under the SIL Open Font License 1.1.

Firmware resources are compiled into one versioned
`main/maple_avatar/generated/avatar.pack`: two RGB565 screens and six ordered
RGB565A8 action sets with a payload CRC32. Reproduce the capture with the
[Maple Avatar importer](../tools/maple_avatar/README.md); a browser or source
failure is fatal and does not produce replacement imagery.

## Music and sound effects

Store reusable music and sound-effect sources in `music/`.

- Document the source, license, sample rate, bit depth, channels, conversion command, and destination.
- Prefer 16 kHz, 16-bit mono PCM when it matches the current BSP audio path.
- Check Flash and internal-RAM cost before embedding audio; stream or chunk long recordings.
- Do not commit media without redistribution permission.
