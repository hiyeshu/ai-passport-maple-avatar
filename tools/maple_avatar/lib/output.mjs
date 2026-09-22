/**
 * [INPUT]: Depends on captured Canvas data, profile metadata, and pure pixel converters.
 * [OUTPUT]: Writes provenance assets plus generated LVGL binaries, descriptors, and CMake inventory.
 * [POS]: Importer persistence boundary; atomically replaces only build-scoped and generated outputs.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from "node:crypto";
import {
  mkdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { rgbaToRgb565, rgbaToRgb565A8 } from "./pixels.mjs";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function cString(value) {
  return JSON.stringify(String(value));
}

export function embeddedFileSymbol(relativePath) {
  return `_binary_${path.basename(relativePath).replace(/[^A-Za-z0-9]/g, "_")}`;
}

async function replaceDirectory(tempDirectory, destination) {
  const backup = `${destination}.backup-${process.pid}`;
  await rm(backup, { recursive: true, force: true });
  try {
    await rename(destination, backup);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(tempDirectory, destination);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    try {
      await rename(backup, destination);
    } catch {}
    throw error;
  }
}

function generatedSource(capture, firmwareFiles) {
  const declarations = [];
  const descriptors = [];
  const frameTables = [];
  const actionRows = [];

  const backgroundPath = "maple_avatar/generated/screen.rgb565";
  const backgroundSymbol = embeddedFileSymbol(backgroundPath);
  declarations.push(
    `extern const uint8_t ${backgroundSymbol}_start[] asm("${backgroundSymbol}_start");`
  );
  descriptors.push(`const lv_image_dsc_t g_maple_avatar_screen = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_SCREEN_WIDTH,
    .header.h = MAPLE_AVATAR_SCREEN_HEIGHT,
    .header.stride = MAPLE_AVATAR_SCREEN_WIDTH * 2,
    .data_size = MAPLE_AVATAR_SCREEN_WIDTH * MAPLE_AVATAR_SCREEN_HEIGHT * 2,
    .data = ${backgroundSymbol}_start,
};`);

  capture.actions.forEach((action) => {
    const frameNames = [];
    action.frames.forEach((frame, frameIndex) => {
      const file = firmwareFiles.find(
        (candidate) => candidate.actionId === action.id && candidate.frameIndex === frameIndex
      );
      const symbol = embeddedFileSymbol(file.relativePath);
      const descriptorName = `s_${action.id}_frame_${frameIndex}`;
      declarations.push(`extern const uint8_t ${symbol}_start[] asm("${symbol}_start");`);
      descriptors.push(`static const lv_image_dsc_t ${descriptorName} = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = ${symbol}_start,
};`);
      frameNames.push(`&${descriptorName}`);
    });
    frameTables.push(
      `static const lv_image_dsc_t *const s_${action.id}_frames[] = { ${frameNames.join(", ")} };`
    );
    actionRows.push(`    {
        .id = ${cString(action.id)},
        .label = ${cString(action.label)},
        .frame_count = ${action.frames.length},
        .frame_delay_ms = ${action.frames.length > 1 ? action.frameDelayMs : 0},
        .frames = s_${action.id}_frames,
    }`);
  });

  return `/**
 * [INPUT]: Generated from the public MXDC build URL by tools/maple_avatar/import_avatar.mjs.
 * [OUTPUT]: Provides immutable LVGL image descriptors, action assets, and profile metadata.
 * [POS]: Generated firmware data adapter; do not edit by hand.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "maple_avatar_assets.h"

#include <stdint.h>

${declarations.join("\n")}

${descriptors.join("\n\n")}

${frameTables.join("\n")}

_Static_assert(MAPLE_AVATAR_ACTION_COUNT == ${capture.actions.length},
               "generated action table must match maple_avatar_action_t");

const maple_avatar_action_assets_t g_maple_avatar_actions[MAPLE_AVATAR_ACTION_COUNT] = {
${actionRows.join(",\n")}
};

const maple_avatar_profile_t g_maple_avatar_profile = {
    .build_id = ${capture.profile.buildId},
    .server = ${cString(capture.profile.server)},
    .level = ${capture.profile.level},
    .job = ${cString(capture.profile.job)},
    .name = ${cString(capture.profile.name)},
    .family = ${cString(capture.profile.family)},
};
`;
}

function generatedCmake(firmwareFiles) {
  const files = firmwareFiles.map((file) => `    "${file.relativePath}"`).join("\n");
  return `# [INPUT]: Generated from captured RGB565/RGB565A8 binary assets.
# [OUTPUT]: Exposes MAPLE_AVATAR_EMBED_FILES to the main component build.
# [POS]: Generated CMake inventory; do not edit by hand.
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
set(MAPLE_AVATAR_EMBED_FILES
${files}
)
`;
}

export async function writeCapture({ repoRoot, source, capture, font }) {
  const assetParent = path.join(repoRoot, "assets/images/maple-avatar");
  const assetDirectory = path.join(assetParent, `build-${capture.profile.buildId}`);
  const firmwareDirectory = path.join(repoRoot, "main/maple_avatar/generated");
  const assetTemp = `${assetDirectory}.tmp-${process.pid}`;
  const firmwareTemp = `${firmwareDirectory}.tmp-${process.pid}`;

  await rm(assetTemp, { recursive: true, force: true });
  await rm(firmwareTemp, { recursive: true, force: true });
  await mkdir(path.join(assetTemp, "frames"), { recursive: true });
  await mkdir(path.join(assetTemp, "device-preview"), { recursive: true });
  await mkdir(firmwareTemp, { recursive: true });

  try {
    const { screen: screenGeometry, avatar: avatarGeometry } = capture.geometry;
    const backgroundBytes = Buffer.from(capture.screen.backgroundBase64, "base64");
    const screenPng = Buffer.from(capture.screen.pngBase64, "base64");
    const screenRgba = Buffer.from(capture.screen.rgbaBase64, "base64");
    const previewPng = Buffer.from(capture.previewPngBase64, "base64");
    await writeFile(path.join(assetTemp, "henesys.png"), backgroundBytes);
    await writeFile(path.join(assetTemp, "screen.png"), screenPng);
    await writeFile(path.join(assetTemp, "preview.png"), previewPng);
    await writeFile(path.join(assetTemp, "ui-font.ttf"), font.bytes);

    const backgroundBinary = rgbaToRgb565(
      screenRgba,
      screenGeometry.width,
      screenGeometry.height
    );
    await writeFile(path.join(firmwareTemp, "screen.rgb565"), backgroundBinary);
    const firmwareFiles = [
      {
        relativePath: "maple_avatar/generated/screen.rgb565",
        bytes: backgroundBinary.length,
        sha256: sha256(backgroundBinary),
      },
    ];
    const actionManifest = [];

    for (const action of capture.actions) {
      const frameManifest = [];
      for (let frameIndex = 0; frameIndex < action.frames.length; frameIndex++) {
        const frame = action.frames[frameIndex];
        const suffix = String(frameIndex).padStart(2, "0");
        const sourcePng = Buffer.from(frame.sourcePngBase64, "base64");
        const devicePng = Buffer.from(frame.devicePngBase64, "base64");
        const deviceRgba = Buffer.from(frame.deviceRgbaBase64, "base64");
        const sourceName = `${action.id}-${suffix}.png`;
        const binaryName = `${action.id}-${suffix}.rgb565a8`;
        await writeFile(path.join(assetTemp, "frames", sourceName), sourcePng);
        await writeFile(path.join(assetTemp, "device-preview", sourceName), devicePng);
        const binary = rgbaToRgb565A8(
          deviceRgba,
          avatarGeometry.width,
          avatarGeometry.height
        );
        await writeFile(path.join(firmwareTemp, binaryName), binary);

        const relativePath = `maple_avatar/generated/${binaryName}`;
        firmwareFiles.push({
          relativePath,
          actionId: action.id,
          frameIndex,
          bytes: binary.length,
          sha256: sha256(binary),
        });
        frameManifest.push({
          index: frameIndex,
          canvasHash: frame.hash,
          sourceWidth: frame.sourceWidth,
          sourceHeight: frame.sourceHeight,
          sourcePng: `frames/${sourceName}`,
          sourceSha256: sha256(sourcePng),
          devicePng: `device-preview/${sourceName}`,
          deviceSha256: sha256(devicePng),
          firmwareFile: relativePath,
          firmwareSha256: sha256(binary),
        });
      }
      actionManifest.push({
        id: action.id,
        label: action.label,
        rendererAction: action.rendererAction,
        pose: action.pose,
        declaredFrameCount: action.declaredFrameCount,
        capturedFrameCount: action.frames.length,
        frameDelayMs: action.frames.length > 1 ? action.frameDelayMs : 0,
        static: action.frames.length <= 1,
        layerPaths: action.layerPaths,
        frames: frameManifest,
      });
    }

    await writeFile(
      path.join(firmwareTemp, "avatar_generated.c"),
      generatedSource(capture, firmwareFiles)
    );
    await writeFile(
      path.join(firmwareTemp, "assets.cmake"),
      generatedCmake(firmwareFiles)
    );

    const manifest = {
      schemaVersion: 1,
      source: {
        url: source.url,
        buildId: source.buildId,
        revision: capture.profile.revision,
        pageTitle: capture.pageTitle,
      },
      profile: capture.profile,
      appearance: capture.appearance,
      ui: {
        width: screenGeometry.width,
        height: screenGeometry.height,
        scene: capture.geometry.scene,
        avatar: avatarGeometry,
        variant: capture.screen.layout.variant,
        infoPanel: capture.screen.layout.panel,
        chips: capture.screen.layout.chips,
        nameplate: capture.screen.layout.nameplate,
        capacity: {
          nameCharacters: 6,
          familyCharacters: 6,
          maximumLevel: 999,
          jobCharacters: 5,
          server: "fixed-enum",
        },
        line1: capture.screen.line1,
        line2: capture.screen.line2,
        chipFontSize: capture.screen.chipFontSize,
        fieldLabelFontSize: capture.screen.fieldLabelFontSize,
        nameFontSize: capture.screen.nameFontSize,
        familyFontSize: capture.screen.familyFontSize,
        displaysBuildId: false,
      },
      background: {
        name: "Henesys",
        sourceUrl: capture.screen.backgroundUrl,
        width: capture.screen.backgroundWidth,
        height: capture.screen.backgroundHeight,
        file: "henesys.png",
        sha256: sha256(backgroundBytes),
      },
      font: {
        family: "Noto Sans SC",
        weight: 600,
        cssUrl: font.cssUrl,
        sourceUrl: font.fontUrl,
        file: "ui-font.ttf",
        sha256: font.sha256,
        license: "SIL Open Font License 1.1",
        licenseFile: "../../../fonts/NotoSansSC-OFL.txt",
      },
      actions: actionManifest,
      firmwareFiles,
    };
    await writeFile(
      path.join(assetTemp, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`
    );

    await mkdir(assetParent, { recursive: true });
    await replaceDirectory(assetTemp, assetDirectory);
    await replaceDirectory(firmwareTemp, firmwareDirectory);
    return { assetDirectory, firmwareDirectory, manifest };
  } catch (error) {
    await rm(assetTemp, { recursive: true, force: true });
    await rm(firmwareTemp, { recursive: true, force: true });
    throw error;
  }
}
