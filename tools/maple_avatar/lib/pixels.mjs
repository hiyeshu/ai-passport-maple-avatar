/**
 * [INPUT]: Depends on RGBA8888 buffers captured from browser Canvas.
 * [OUTPUT]: Provides uncompressed LVGL RGB565 and RGB565A8 firmware buffers.
 * [POS]: Pure asset-conversion module, independent from browser capture and filesystem output.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
function validateRgba(rgba, width, height) {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error(`Invalid image dimensions: ${width}x${height}`);
  }
  const expected = width * height * 4;
  if (!rgba || rgba.length !== expected) {
    throw new Error(`Expected ${expected} RGBA bytes, received ${rgba?.length ?? 0}`);
  }
}

function rgb565(red, green, blue) {
  return ((red & 0xf8) << 8) | ((green & 0xfc) << 3) | (blue >> 3);
}

export function rgbaToRgb565(rgba, width, height) {
  validateRgba(rgba, width, height);
  const pixelCount = width * height;
  const output = Buffer.allocUnsafe(pixelCount * 2);
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    const inputOffset = pixel * 4;
    output.writeUInt16LE(
      rgb565(rgba[inputOffset], rgba[inputOffset + 1], rgba[inputOffset + 2]),
      pixel * 2
    );
  }
  return output;
}

export function rgbaToRgb565A8(rgba, width, height) {
  validateRgba(rgba, width, height);
  const pixelCount = width * height;
  const output = Buffer.allocUnsafe(pixelCount * 3);
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    const inputOffset = pixel * 4;
    output.writeUInt16LE(
      rgb565(rgba[inputOffset], rgba[inputOffset + 1], rgba[inputOffset + 2]),
      pixel * 2
    );
    output[pixelCount * 2 + pixel] = rgba[inputOffset + 3];
  }
  return output;
}
