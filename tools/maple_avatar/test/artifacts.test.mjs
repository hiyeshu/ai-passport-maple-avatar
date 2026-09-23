/**
 * [INPUT]: Depends on the shared artifact compiler and avatar-pack parser.
 * [OUTPUT]: Verifies that pack type never changes the user-visible profile or preview pixels.
 * [POS]: Host regression for clean presentation at the compiler/firmware resource seam.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import { compileAvatarArtifacts } from "../lib/artifacts.mjs";
import {
  ACTION_IDS,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  PACK_FLAG_SAMPLE,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  parseAvatarPack,
} from "../lib/pack.mjs";

function base64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function captureFixture() {
  const cleanScreen = Buffer.alloc(SCREEN_WIDTH * SCREEN_HEIGHT * 4, 0x00);
  const frame = Buffer.alloc(FRAME_WIDTH * FRAME_HEIGHT * 4, 0x00);
  return {
    profile: { buildId: 5293, name: "蓝莓呀" },
    geometry: {
      screen: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
      avatar: { width: FRAME_WIDTH, height: FRAME_HEIGHT },
    },
    screen: {
      rgbaBase64: base64(cleanScreen),
      pngBase64: base64("clean-screen"),
      backgroundBase64: base64("background"),
    },
    builderScreen: {
      rgbaBase64: base64(cleanScreen),
      pngBase64: base64("builder-screen"),
    },
    previewPngBase64: base64("clean-preview"),
    actions: ACTION_IDS.map((id) => ({
      id,
      label: id,
      frameDelayMs: 0,
      frames: [{
        sourcePngBase64: base64(`${id}-source`),
        devicePngBase64: base64(`${id}-device`),
        deviceRgbaBase64: base64(frame),
      }],
    })),
  };
}

test("keeps personal and bundled profile pixels free of example badges", () => {
  const capture = captureFixture();
  const personal = compileAvatarArtifacts(capture, { sample: false });
  const sample = compileAvatarArtifacts(capture, { sample: true });
  const personalPack = parseAvatarPack(personal.pack);
  const samplePack = parseAvatarPack(sample.pack);

  assert.equal(personal.screenPng.toString(), "clean-screen");
  assert.equal(personal.previewPng.toString(), "clean-preview");
  assert.equal(personalPack.flags, 0);
  assert.equal(personalPack.screen[0], 0x00);

  assert.equal(sample.screenPng.toString(), "clean-screen");
  assert.equal(sample.previewPng.toString(), "clean-preview");
  assert.equal(samplePack.flags, PACK_FLAG_SAMPLE);
  assert.equal(samplePack.screen[0], 0x00);
});
