/**
 * [INPUT]: Depends on the public avatar-pack compiler and parser interface.
 * [OUTPUT]: Verifies deterministic layout, action metadata, and corruption rejection.
 * [POS]: Host contract test for the binary seam shared by the importer and firmware.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTION_IDS,
  FRAME_BYTES,
  PACK_FLAG_SAMPLE,
  SCREEN_BYTES,
  createAvatarPack,
  parseAvatarPack,
} from "../lib/pack.mjs";

function fixture() {
  return {
    buildId: 5293,
    sample: true,
    screen: Buffer.alloc(SCREEN_BYTES, 0x11),
    builderScreen: Buffer.alloc(SCREEN_BYTES, 0x22),
    actions: ACTION_IDS.map((id, actionIndex) => ({
      id,
      frameDelayMs: actionIndex === 3 ? 0 : 180 + actionIndex * 10,
      frames: Array.from(
        { length: actionIndex === 3 ? 1 : (actionIndex % 4) + 1 },
        (_, frameIndex) => Buffer.alloc(FRAME_BYTES, actionIndex * 8 + frameIndex),
      ),
    })),
  };
}

test("one pack drives the screen, builder page, and six actions", () => {
  const bytes = createAvatarPack(fixture());
  const pack = parseAvatarPack(bytes);

  assert.equal(pack.buildId, 5293);
  assert.equal(pack.flags, PACK_FLAG_SAMPLE);
  assert.equal(pack.totalSize, bytes.length);
  assert.deepEqual(pack.screen, Buffer.alloc(SCREEN_BYTES, 0x11));
  assert.deepEqual(pack.builderScreen, Buffer.alloc(SCREEN_BYTES, 0x22));
  assert.deepEqual(
    pack.actions.map(({ id, frameCount }) => ({ id, frameCount })),
    ACTION_IDS.map((id, actionIndex) => ({
      id,
      frameCount: actionIndex === 3 ? 1 : (actionIndex % 4) + 1,
    })),
  );
  assert.equal(pack.actions[2].frames[1][0], 17);
});

test("a payload mutation is rejected instead of displaying corrupt pixels", () => {
  const bytes = createAvatarPack(fixture());
  bytes[bytes.length - 1] ^= 0xff;
  assert.throws(() => parseAvatarPack(bytes), /checksum/i);
});

test("the compiler rejects an action order the firmware cannot interpret", () => {
  const input = fixture();
  [input.actions[0], input.actions[1]] = [input.actions[1], input.actions[0]];
  assert.throws(() => createAvatarPack(input), /action order/i);
});

test("the compiler rejects animated actions without a frame delay", () => {
  const input = fixture();
  input.actions[1].frameDelayMs = 0;
  assert.throws(() => createAvatarPack(input), /frame delay/i);
});

test("the parser rejects a zero-delay multi-frame header", () => {
  const bytes = createAvatarPack(fixture());
  bytes.writeUInt16LE(0, 64 + 20 + 2);
  assert.throws(() => parseAvatarPack(bytes), /frame delay/i);
});
