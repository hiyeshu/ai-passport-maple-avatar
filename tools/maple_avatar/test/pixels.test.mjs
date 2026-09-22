/**
 * [INPUT]: Depends on node:test and the public pixel conversion API.
 * [OUTPUT]: Verifies LVGL-compatible RGB565 and RGB565A8 byte layout.
 * [POS]: Importer contract test guarding firmware asset byte order and alpha-plane layout.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import { rgbaToRgb565, rgbaToRgb565A8 } from "../lib/pixels.mjs";

const rgba = Buffer.from([
  255, 0, 0, 255,
  0, 255, 0, 128,
]);

test("converts RGBA pixels to little-endian RGB565", () => {
  assert.deepEqual([...rgbaToRgb565(rgba, 2, 1)], [0x00, 0xf8, 0xe0, 0x07]);
});

test("stores RGB565A8 as a color plane followed by an alpha plane", () => {
  assert.deepEqual(
    [...rgbaToRgb565A8(rgba, 2, 1)],
    [0x00, 0xf8, 0xe0, 0x07, 0xff, 0x80]
  );
});
