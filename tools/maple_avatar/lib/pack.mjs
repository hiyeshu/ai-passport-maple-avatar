/**
 * [INPUT]: Depends on fixed-size RGB565 screens and origin-aligned RGB565A8 action frames.
 * [OUTPUT]: Provides deterministic avatar.pack compilation and validation for schema version 1.
 * [POS]: Binary format Module at the importer/firmware Seam; hides offsets, alignment, and checksums.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const PACK_MAGIC = Buffer.from([0x4d, 0x49, 0x49, 0x49, 0x41, 0x4f, 0x31, 0x00]);
export const PACK_VERSION = 1;
export const PACK_HEADER_BYTES = 256;
export const PACK_FLAG_SAMPLE = 1;
export const SCREEN_WIDTH = 240;
export const SCREEN_HEIGHT = 320;
export const FRAME_WIDTH = 240;
export const FRAME_HEIGHT = 246;
export const SCREEN_BYTES = SCREEN_WIDTH * SCREEN_HEIGHT * 2;
export const FRAME_BYTES = FRAME_WIDTH * FRAME_HEIGHT * 3;
export const MAX_ACTION_FRAMES = 4;
export const ACTION_IDS = Object.freeze([
  "stand",
  "walk",
  "attack",
  "sit",
  "two_hand_stand",
  "two_hand_walk",
]);

const ACTION_TABLE_OFFSET = 64;
const ACTION_ENTRY_BYTES = 20;

function asBuffer(value, label, size) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    throw new TypeError(`${label} must be binary data`);
  }
  const bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (bytes.length !== size) {
    throw new Error(`${label} must contain ${size} bytes, received ${bytes.length}`);
  }
  return bytes;
}

function align4(value) {
  return (value + 3) & ~3;
}

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createAvatarPack({ buildId, sample = false, screen, builderScreen, actions }) {
  if (!Number.isSafeInteger(buildId) || buildId < 1 || buildId > 0xffffffff) {
    throw new Error("buildId must be an unsigned 32-bit integer");
  }
  if (!Array.isArray(actions) || actions.length !== ACTION_IDS.length) {
    throw new Error(`avatar pack requires ${ACTION_IDS.length} actions`);
  }

  const normalizedActions = actions.map((action, actionIndex) => {
    const expectedId = ACTION_IDS[actionIndex];
    if (action?.id !== expectedId) {
      throw new Error(`avatar action order must place ${expectedId} at index ${actionIndex}`);
    }
    if (!Array.isArray(action.frames) || action.frames.length < 1 || action.frames.length > MAX_ACTION_FRAMES) {
      throw new Error(`${expectedId} must contain 1-${MAX_ACTION_FRAMES} frames`);
    }
    const delay = Number(action.frameDelayMs);
    if (!Number.isInteger(delay) || delay < 0 || delay > 0xffff) {
      throw new Error(`${expectedId} frame delay is invalid`);
    }
    if (action.frames.length > 1 && delay === 0) {
      throw new Error(`${expectedId} frame delay must be positive for animation`);
    }
    return {
      id: expectedId,
      frameDelayMs: action.frames.length > 1 ? delay : 0,
      frames: action.frames.map((frame, frameIndex) =>
        asBuffer(frame, `${expectedId} frame ${frameIndex}`, FRAME_BYTES)),
    };
  });

  const payloads = [
    { key: "screen", bytes: asBuffer(screen, "screen", SCREEN_BYTES) },
    { key: "builderScreen", bytes: asBuffer(builderScreen, "builder screen", SCREEN_BYTES) },
  ];
  for (const action of normalizedActions) {
    action.frames.forEach((bytes, frameIndex) => {
      payloads.push({ key: `${action.id}:${frameIndex}`, bytes });
    });
  }

  let cursor = PACK_HEADER_BYTES;
  const offsets = new Map();
  for (const payload of payloads) {
    cursor = align4(cursor);
    offsets.set(payload.key, cursor);
    cursor += payload.bytes.length;
  }
  const totalSize = align4(cursor);
  const pack = Buffer.alloc(totalSize, 0);
  for (const payload of payloads) payload.bytes.copy(pack, offsets.get(payload.key));

  PACK_MAGIC.copy(pack, 0);
  pack.writeUInt16LE(PACK_VERSION, 8);
  pack.writeUInt16LE(PACK_HEADER_BYTES, 10);
  pack.writeUInt32LE(totalSize, 12);
  pack.writeUInt32LE(sample ? PACK_FLAG_SAMPLE : 0, 20);
  pack.writeUInt32LE(buildId, 24);
  pack.writeUInt32LE(offsets.get("screen"), 28);
  pack.writeUInt32LE(offsets.get("builderScreen"), 32);
  pack.writeUInt32LE(SCREEN_BYTES, 36);
  pack.writeUInt32LE(FRAME_BYTES, 40);
  pack.writeUInt16LE(ACTION_IDS.length, 44);
  pack.writeUInt16LE(MAX_ACTION_FRAMES, 46);
  pack.writeUInt16LE(SCREEN_WIDTH, 48);
  pack.writeUInt16LE(SCREEN_HEIGHT, 50);
  pack.writeUInt16LE(FRAME_WIDTH, 52);
  pack.writeUInt16LE(FRAME_HEIGHT, 54);

  normalizedActions.forEach((action, actionIndex) => {
    const entry = ACTION_TABLE_OFFSET + actionIndex * ACTION_ENTRY_BYTES;
    pack.writeUInt16LE(action.frames.length, entry);
    pack.writeUInt16LE(action.frameDelayMs, entry + 2);
    action.frames.forEach((_, frameIndex) => {
      pack.writeUInt32LE(offsets.get(`${action.id}:${frameIndex}`), entry + 4 + frameIndex * 4);
    });
  });

  pack.writeUInt32LE(crc32(pack.subarray(PACK_HEADER_BYTES)), 16);
  return pack;
}

function sliceAsset(pack, offset, size, label) {
  if (!Number.isInteger(offset) || offset < PACK_HEADER_BYTES || offset + size > pack.length) {
    throw new Error(`${label} is outside the avatar pack`);
  }
  if ((offset & 3) !== 0) throw new Error(`${label} is not 4-byte aligned`);
  return pack.subarray(offset, offset + size);
}

export function parseAvatarPack(value) {
  const pack = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (pack.length < PACK_HEADER_BYTES || !pack.subarray(0, PACK_MAGIC.length).equals(PACK_MAGIC)) {
    throw new Error("avatar pack magic is invalid");
  }
  const version = pack.readUInt16LE(8);
  const headerSize = pack.readUInt16LE(10);
  const totalSize = pack.readUInt32LE(12);
  if (version !== PACK_VERSION || headerSize !== PACK_HEADER_BYTES) {
    throw new Error(`avatar pack schema ${version}/${headerSize} is unsupported`);
  }
  if (totalSize !== pack.length) throw new Error("avatar pack length does not match its header");
  const expectedChecksum = pack.readUInt32LE(16);
  const actualChecksum = crc32(pack.subarray(PACK_HEADER_BYTES));
  if (expectedChecksum !== actualChecksum) throw new Error("avatar pack checksum is invalid");
  if (
    pack.readUInt32LE(36) !== SCREEN_BYTES ||
    pack.readUInt32LE(40) !== FRAME_BYTES ||
    pack.readUInt16LE(44) !== ACTION_IDS.length ||
    pack.readUInt16LE(46) !== MAX_ACTION_FRAMES ||
    pack.readUInt16LE(48) !== SCREEN_WIDTH ||
    pack.readUInt16LE(50) !== SCREEN_HEIGHT ||
    pack.readUInt16LE(52) !== FRAME_WIDTH ||
    pack.readUInt16LE(54) !== FRAME_HEIGHT
  ) {
    throw new Error("avatar pack geometry is unsupported");
  }

  const actions = ACTION_IDS.map((id, actionIndex) => {
    const entry = ACTION_TABLE_OFFSET + actionIndex * ACTION_ENTRY_BYTES;
    const frameCount = pack.readUInt16LE(entry);
    const frameDelayMs = pack.readUInt16LE(entry + 2);
    if (frameCount < 1 || frameCount > MAX_ACTION_FRAMES) {
      throw new Error(`${id} frame count is invalid`);
    }
    if (
      (frameCount === 1 && frameDelayMs !== 0) ||
      (frameCount > 1 && frameDelayMs === 0)
    ) {
      throw new Error(`${id} frame delay is invalid`);
    }
    const frames = Array.from({ length: frameCount }, (_, frameIndex) => {
      const offset = pack.readUInt32LE(entry + 4 + frameIndex * 4);
      return sliceAsset(pack, offset, FRAME_BYTES, `${id} frame ${frameIndex}`);
    });
    return { id, frameCount, frameDelayMs, frames };
  });

  return {
    version,
    totalSize,
    checksum: actualChecksum,
    flags: pack.readUInt32LE(20),
    buildId: pack.readUInt32LE(24),
    screen: sliceAsset(pack, pack.readUInt32LE(28), SCREEN_BYTES, "screen"),
    builderScreen: sliceAsset(pack, pack.readUInt32LE(32), SCREEN_BYTES, "builder screen"),
    actions,
  };
}
