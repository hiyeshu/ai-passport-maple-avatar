<p align="right">
  <a href="firmware-layout.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# Firmware Layout

This product fork targets an ESP32-C3 with 8 MB Flash. Application code and
replaceable avatar content intentionally live in separate partitions, so a
community user installs the firmware once and later changes only their avatar.

## Product layout

| Partition | Type/subtype | Offset | Size | Purpose |
| --- | --- | ---: | ---: | --- |
| `nvs` | data/NVS | `0x9000` | `0x6000` | ESP-IDF and application key-value storage |
| `phy_init` | data/PHY | `0xF000` | `0x1000` | PHY initialization data |
| `factory` | app/factory | `0x10000` | `0x300000` | Generic Maple Avatar application |
| `avatar` | data/`0x40` | `0x310000` | `0x4F0000` | One replaceable, CRC-checked `avatar.pack` |

The layout has no OTA slot. `avatar.pack` schema version 1 contains two
240 x 320 RGB565 screens and six ordered 240 x 246 RGB565A8 action sets.
The firmware rejects an unsupported schema, invalid geometry, out-of-bounds
offset, oversized payload, or CRC mismatch instead of rendering partial data.

The `avatar` offset is a compatibility contract shared by `partitions.csv`,
firmware verification, and the website's ESP Web Tools manifest. Do not move or
resize it without updating and releasing all three together.

## Two installation paths

### First community installation

`./tools/validate.sh --firmware` builds the generic application, creates
`build/FoloToy-AI-Passport-full.bin`, injects the reproducible sample
`main/maple_avatar/generated/avatar.pack`, and verifies the resulting bytes.
The full image is written from `0x0` and establishes the required partition
table. It is the artifact for first-time installation or an intentional
complete refresh.

### Personal avatar replacement

The hosted builder returns an ESP Web Tools manifest with exactly one part:

```json
{"path":"avatar.pack","offset":3211264}
```

That decimal offset is `0x310000`. The browser writes only the `avatar`
partition; it does not replace the application, partition table, NVS, or PHY
regions. This path is compatible only after the community firmware with this
partition layout has been installed.

## Enforced validation

```bash
./tools/validate.sh --firmware
```

The check builds in an isolated directory, creates the merged image, reads
actual offsets from `flash_args`, verifies the partition-table MD5, bounds,
labels, and non-overlap, checks application capacity, injects the sample pack,
and byte-compares that pack at the configured avatar offset.

## Flashing and stored data

> **No backup of the firmware already installed on the device is required
> before flashing new firmware.** This workflow does not retain an automatic
> rollback copy or promise that the original firmware can be restored.

The full image from `0x0` can reset NVS and PHY regions because it pads gaps
between component images. Use it for first installation or a deliberate full
refresh. For development that must preserve NVS, use compatible segmented
`idf.py flash` targets. `idf.py erase-flash` erases all user data and is
never a routine prerequisite.

A personal avatar replacement targets only `0x310000`, but power loss,
disconnects, incompatible older firmware, or browser/driver failures can still
leave an invalid pack. In that case the application shows its recovery page;
reconnect and install a valid personal pack or the verified full image.
