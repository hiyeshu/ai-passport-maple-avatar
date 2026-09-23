/**
 * [INPUT]: Depends on one captured avatar result plus pure RGB565 converters and avatar-pack compiler.
 * [OUTPUT]: Provides one immutable build artifact graph shared by repository import and HTTP delivery.
 * [POS]: Importer domain Module; prevents the CLI and hosted service from compiling different pixels.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createAvatarPack } from "./pack.mjs";
import { rgbaToRgb565, rgbaToRgb565A8 } from "./pixels.mjs";

function fromBase64(value, label) {
  if (typeof value !== "string" || !value) throw new Error(`${label} is missing`);
  return Buffer.from(value, "base64");
}

export function compileAvatarArtifacts(capture, { sample = false } = {}) {
  const screen = fromBase64(capture.screen.rgbaBase64, "profile screen RGBA");
  const builderScreen = fromBase64(
    capture.builderScreen.rgbaBase64,
    "builder screen RGBA",
  );
  const screenBinary = rgbaToRgb565(
    screen,
    capture.geometry.screen.width,
    capture.geometry.screen.height,
  );
  const builderScreenBinary = rgbaToRgb565(
    builderScreen,
    capture.geometry.screen.width,
    capture.geometry.screen.height,
  );

  const actions = capture.actions.map((action) => ({
    id: action.id,
    label: action.label,
    frameDelayMs: action.frames.length > 1 ? action.frameDelayMs : 0,
    frames: action.frames.map((frame) => ({
      sourcePng: fromBase64(frame.sourcePngBase64, `${action.id} source PNG`),
      devicePng: fromBase64(frame.devicePngBase64, `${action.id} device PNG`),
      binary: rgbaToRgb565A8(
        fromBase64(frame.deviceRgbaBase64, `${action.id} frame RGBA`),
        capture.geometry.avatar.width,
        capture.geometry.avatar.height,
      ),
      capture: frame,
    })),
    capture: action,
  }));

  const pack = createAvatarPack({
    buildId: capture.profile.buildId,
    sample,
    screen: screenBinary,
    builderScreen: builderScreenBinary,
    actions: actions.map((action) => ({
      id: action.id,
      frameDelayMs: action.frameDelayMs,
      frames: action.frames.map((frame) => frame.binary),
    })),
  });

  return Object.freeze({
    profile: capture.profile,
    backgroundPng: fromBase64(capture.screen.backgroundBase64, "Henesys PNG"),
    screenPng: fromBase64(capture.screen.pngBase64, "profile screen PNG"),
    builderScreenPng: fromBase64(capture.builderScreen.pngBase64, "builder screen PNG"),
    previewPng: fromBase64(capture.previewPngBase64, "preview PNG"),
    screenBinary,
    builderScreenBinary,
    actions,
    pack,
  });
}
