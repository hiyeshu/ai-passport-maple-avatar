/**
 * [INPUT]: Depends on captured Canvas data, profile metadata, and pure pixel converters.
 * [OUTPUT]: Writes provenance PNGs and one versioned avatar.pack while retaining curated build sidecars.
 * [POS]: Repository persistence Adapter; hosted and local builds share artifacts.mjs instead of generated C.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { compileAvatarArtifacts } from "./artifacts.mjs";

const PRESERVED_BUILD_SIDECARS = Object.freeze(["device-mockup.png"]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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

export async function writeCapture({ repoRoot, source, capture, font, sample = false }) {
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

  for (const filename of PRESERVED_BUILD_SIDECARS) {
    try {
      await copyFile(
        path.join(assetDirectory, filename),
        path.join(assetTemp, filename)
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  try {
    const { screen: screenGeometry, avatar: avatarGeometry } = capture.geometry;
    const artifacts = compileAvatarArtifacts(capture, { sample });
    await writeFile(path.join(assetTemp, "henesys.png"), artifacts.backgroundPng);
    await writeFile(path.join(assetTemp, "screen.png"), artifacts.screenPng);
    await writeFile(path.join(assetTemp, "builder-screen.png"), artifacts.builderScreenPng);
    await writeFile(path.join(assetTemp, "preview.png"), artifacts.previewPng);
    await writeFile(path.join(assetTemp, "ui-font.ttf"), font.bytes);

    const actionManifest = [];

    for (const action of artifacts.actions) {
      const frameManifest = [];
      for (let frameIndex = 0; frameIndex < action.frames.length; frameIndex++) {
        const frame = action.frames[frameIndex];
        const suffix = String(frameIndex).padStart(2, "0");
        const sourceName = `${action.id}-${suffix}.png`;
        await writeFile(path.join(assetTemp, "frames", sourceName), frame.sourcePng);
        await writeFile(path.join(assetTemp, "device-preview", sourceName), frame.devicePng);
        frameManifest.push({
          index: frameIndex,
          canvasHash: frame.capture.hash,
          sourceWidth: frame.capture.sourceWidth,
          sourceHeight: frame.capture.sourceHeight,
          devicePlacement: frame.capture.devicePlacement,
          sourcePng: `frames/${sourceName}`,
          sourceSha256: sha256(frame.sourcePng),
          devicePng: `device-preview/${sourceName}`,
          deviceSha256: sha256(frame.devicePng),
          rgb565a8Sha256: sha256(frame.binary),
        });
      }
      actionManifest.push({
        id: action.id,
        label: action.label,
        rendererAction: action.capture.rendererAction,
        pose: action.capture.pose,
        declaredFrameCount: action.capture.declaredFrameCount,
        capturedFrameCount: action.frames.length,
        frameDelayMs: action.frameDelayMs,
        static: action.frames.length <= 1,
        alignment: action.capture.alignment,
        layerPaths: action.capture.layerPaths,
        frames: frameManifest,
      });
    }

    await writeFile(path.join(firmwareTemp, "avatar.pack"), artifacts.pack);

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
        builderPage: {
          url: "avatar.miiiao.cn",
          status: capture.builderScreen.statusText,
        },
      },
      background: {
        name: "Henesys",
        sourceUrl: capture.screen.backgroundUrl,
        width: capture.screen.backgroundWidth,
        height: capture.screen.backgroundHeight,
        file: "henesys.png",
        sha256: sha256(artifacts.backgroundPng),
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
      avatarPack: {
        schemaVersion: 1,
        file: "../../../main/maple_avatar/generated/avatar.pack",
        bytes: artifacts.pack.length,
        sha256: sha256(artifacts.pack),
        sample,
      },
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
