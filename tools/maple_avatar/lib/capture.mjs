/**
 * [INPUT]: Depends on Playwright, a public MXDC build URL, and a TrueType UI subset.
 * [OUTPUT]: Captures real Canvas frames, Henesys, and a 240x320 Maple profile-card image.
 * [POS]: Browser adapter; owns all DOM selectors and fails explicitly when the source page drifts.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { existsSync } from "node:fs";

import { chromium } from "playwright";

import { extractCharacterProfile } from "./source.mjs";

export const SCREEN_WIDTH = 240;
export const SCREEN_HEIGHT = 320;
export const AVATAR_WIDTH = 132;
export const AVATAR_HEIGHT = 173;
export const AVATAR_X = 54;
export const AVATAR_Y = 66;
export const GOLDEN_RATIO = 0.618;
export const SCENE_GROUND_Y = 232;

export const PROFILE_LAYOUT = Object.freeze({
  variant: "maple-profile-card-v2",
  panel: { x: 0, y: 246, width: 240, height: 74 },
  chips: [
    { key: "server", x: 8, y: 250, width: 59, height: 21 },
    { key: "level", x: 72, y: 250, width: 56, height: 21 },
    { key: "job", x: 133, y: 250, width: 99, height: 21 },
  ],
  nameplate: { x: 8, y: 277, width: 224, height: 37, dividerX: 120 },
});

export const ACTION_SPECS = Object.freeze([
  { id: "stand", label: "站立" },
  { id: "walk", label: "行走" },
  { id: "attack", label: "攻击" },
  { id: "sit", label: "坐下" },
  { id: "two_hand_stand", label: "双手持武器站立" },
  { id: "two_hand_walk", label: "双手持武器行走" },
]);

const DEFAULT_CHROME_PATH =
  process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "";

function browserLaunchOptions(explicitPath) {
  const executablePath = explicitPath || process.env.MAPLE_AVATAR_CHROME || DEFAULT_CHROME_PATH;
  if (executablePath && existsSync(executablePath)) {
    return { headless: true, executablePath };
  }
  return { headless: true };
}

async function selectDropdownOption(page, triggerPrefix, label) {
  await page.locator(`button[aria-label^="${triggerPrefix}"]`).click();
  const option = page.getByRole("menuitemradio", { name: label, exact: true });
  await option.waitFor({ state: "visible", timeout: 5000 });
  await option.click();
}

async function dismissReleaseNotes(page) {
  const close = page.getByRole("button", { name: "关闭更新日志", exact: true });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.locator(".builder-release-overlay").waitFor({ state: "hidden", timeout: 5000 });
  }
}

async function captureScreen(page, profile, fontBytes) {
  return page.evaluate(
    async ({ profileData, fontBase64, width, height, layout }) => {
      const bytesToBase64 = (bytes) => {
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        }
        return btoa(binary);
      };
      const dataUrlBytes = (dataUrl) => dataUrl.slice(dataUrl.indexOf(",") + 1);

      const root = document.querySelector(".character-animation");
      if (!root) throw new Error("Character preview root was not found");
      const backgroundCss = getComputedStyle(root).backgroundImage;
      const backgroundMatch = backgroundCss.match(/url\(["']?(.*?)["']?\)/);
      if (!backgroundMatch) throw new Error("Henesys background URL was not found");
      const backgroundUrl = new URL(backgroundMatch[1], location.href).href;

      const backgroundResponse = await fetch(backgroundUrl, {
        credentials: "same-origin",
        referrer: location.href,
      });
      if (!backgroundResponse.ok) {
        throw new Error(`Henesys background download failed: HTTP ${backgroundResponse.status}`);
      }
      const backgroundBytes = new Uint8Array(await backgroundResponse.arrayBuffer());
      const backgroundBlob = new Blob([backgroundBytes], { type: "image/png" });
      const backgroundObjectUrl = URL.createObjectURL(backgroundBlob);

      try {
        const font = new FontFace(
          "MapleAvatarUI",
          `url(data:font/ttf;base64,${fontBase64}) format("truetype")`,
          { weight: "600" }
        );
        await font.load();
        document.fonts.add(font);
        await document.fonts.ready;

        const image = new Image();
        image.src = backgroundObjectUrl;
        await image.decode();

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;
        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = Math.ceil(image.naturalWidth * scale);
        const drawHeight = Math.ceil(image.naturalHeight * scale);
        ctx.drawImage(
          image,
          Math.floor((width - drawWidth) / 2),
          Math.floor((height - drawHeight) / 2),
          drawWidth,
          drawHeight
        );

        const roundedRect = (x, y, boxWidth, boxHeight, radius, fill, stroke) => {
          ctx.beginPath();
          ctx.roundRect(x, y, boxWidth, boxHeight, radius);
          ctx.fillStyle = fill;
          ctx.fill();
          if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        };
        const drawText = ({
          text,
          x,
          baseline,
          align = "center",
          preferredSize,
          minimumSize,
          maxWidth,
          color = "#ffffff",
        }) => {
          let size = preferredSize;
          do {
            ctx.font = `600 ${size}px MapleAvatarUI`;
            if (ctx.measureText(text).width <= maxWidth || size <= minimumSize) break;
            size--;
          } while (size >= minimumSize);
          ctx.textAlign = align;
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
          ctx.fillText(text, x + 1, baseline + 1);
          ctx.fillStyle = color;
          ctx.fillText(text, x, baseline);
          return size;
        };

        const line1 = `${profileData.server}   LV.${profileData.level}   ${profileData.job}`;
        const line2 = `${profileData.name}   ${profileData.family}`;
        const chipStyles = {
          server: { fill: "rgba(130, 51, 82, 0.97)", stroke: "rgba(225, 129, 164, 0.96)" },
          level: { fill: "rgba(143, 92, 24, 0.97)", stroke: "rgba(239, 193, 93, 0.96)" },
          job: { fill: "rgba(35, 83, 105, 0.96)", stroke: "rgba(120, 178, 201, 0.94)" },
        };
        const chipText = {
          server: profileData.server,
          level: `LV.${profileData.level}`,
          job: profileData.job,
        };
        for (const chip of layout.chips) {
          roundedRect(
            chip.x + 1,
            chip.y + 2,
            chip.width,
            chip.height,
            4,
            "rgba(0, 0, 0, 0.44)"
          );
          roundedRect(
            chip.x,
            chip.y,
            chip.width,
            chip.height,
            4,
            chipStyles[chip.key].fill,
            chipStyles[chip.key].stroke
          );
          drawText({
            text: chipText[chip.key],
            x: chip.x + chip.width / 2,
            baseline: chip.y + 15,
            preferredSize: 11,
            minimumSize: 11,
            maxWidth: chip.width - 8,
          });
        }

        const plate = layout.nameplate;
        roundedRect(
          plate.x + 1,
          plate.y + 2,
          plate.width,
          plate.height,
          5,
          "rgba(0, 0, 0, 0.48)"
        );
        roundedRect(
          plate.x,
          plate.y,
          plate.width,
          plate.height,
          5,
          "rgba(20, 53, 79, 0.98)",
          "rgba(143, 187, 210, 0.96)"
        );
        ctx.fillStyle = "rgba(188, 221, 236, 0.35)";
        ctx.fillRect(plate.x + 4, plate.y + 3, plate.width - 8, 1);
        ctx.fillStyle = "rgba(144, 183, 202, 0.62)";
        ctx.fillRect(plate.dividerX, plate.y + 6, 1, plate.height - 12);

        drawText({
          text: "姓名",
          x: plate.x + 10,
          baseline: plate.y + 12,
          align: "left",
          preferredSize: 9,
          minimumSize: 9,
          maxWidth: plate.dividerX - plate.x - 18,
          color: "#bcd4df",
        });
        const nameSize = drawText({
          text: profileData.name,
          x: plate.x + 10,
          baseline: plate.y + 31,
          align: "left",
          preferredSize: 15,
          minimumSize: 15,
          maxWidth: plate.dividerX - plate.x - 18,
        });
        drawText({
          text: "家族",
          x: plate.dividerX + 9,
          baseline: plate.y + 12,
          align: "left",
          preferredSize: 9,
          minimumSize: 8,
          maxWidth: 24,
          color: "#bcd4df",
        });
        const familySize = drawText({
          text: profileData.family,
          x: plate.dividerX + 9,
          baseline: plate.y + 31,
          align: "left",
          preferredSize: 15,
          minimumSize: 15,
          maxWidth: plate.x + plate.width - plate.dividerX - 18,
        });
        const rgba = ctx.getImageData(0, 0, width, height).data;

        return {
          backgroundUrl,
          backgroundBase64: bytesToBase64(backgroundBytes),
          backgroundWidth: image.naturalWidth,
          backgroundHeight: image.naturalHeight,
          pngBase64: dataUrlBytes(canvas.toDataURL("image/png")),
          rgbaBase64: bytesToBase64(rgba),
          line1,
          line2,
          layout,
          chipFontSize: 11,
          fieldLabelFontSize: 9,
          nameFontSize: nameSize,
          familyFontSize: familySize,
        };
      } finally {
        URL.revokeObjectURL(backgroundObjectUrl);
      }
    },
    {
      profileData: profile,
      fontBase64: fontBytes.toString("base64"),
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      layout: PROFILE_LAYOUT,
    }
  );
}

async function captureVisibleFrames(page, expectedCount, frameDelayMs) {
  const durationMs = Math.min(
    12000,
    Math.max(1400, expectedCount * Math.max(frameDelayMs, 100) * 2 + 700)
  );
  return page.evaluate(
    async ({ expected, duration, targetWidth, targetHeight }) => {
      const bytesToBase64 = (bytes) => {
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        }
        return btoa(binary);
      };
      const dataUrlBytes = (dataUrl) => dataUrl.slice(dataUrl.indexOf(",") + 1);
      const hashRgba = (rgba) => {
        let hash = 2166136261;
        for (let index = 0; index < rgba.length; index++) {
          hash ^= rgba[index];
          hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, "0");
      };
      const frameFromCanvas = (source) => {
        const sourceContext = source.getContext("2d", { willReadFrequently: true });
        const sourceRgba = sourceContext.getImageData(0, 0, source.width, source.height).data;
        const hash = hashRgba(sourceRgba);

        const device = document.createElement("canvas");
        device.width = targetWidth;
        device.height = targetHeight;
        const deviceContext = device.getContext("2d", { willReadFrequently: true });
        deviceContext.imageSmoothingEnabled = false;
        const scale = Math.min(targetWidth / source.width, targetHeight / source.height);
        const drawWidth = Math.max(1, Math.round(source.width * scale));
        const drawHeight = Math.max(1, Math.round(source.height * scale));
        deviceContext.clearRect(0, 0, targetWidth, targetHeight);
        deviceContext.drawImage(
          source,
          Math.floor((targetWidth - drawWidth) / 2),
          targetHeight - drawHeight,
          drawWidth,
          drawHeight
        );
        const deviceRgba = deviceContext.getImageData(0, 0, targetWidth, targetHeight).data;
        return {
          hash,
          sourceWidth: source.width,
          sourceHeight: source.height,
          sourcePngBase64: dataUrlBytes(source.toDataURL("image/png")),
          devicePngBase64: dataUrlBytes(device.toDataURL("image/png")),
          deviceRgbaBase64: bytesToBase64(deviceRgba),
        };
      };

      const canvas = document.querySelector("canvas.character-animation-canvas");
      const image = document.querySelector(".character-animation-fallback img");
      if (!canvas || !image) throw new Error("Character Canvas or fallback image is missing");

      const canvasVisible = () => {
        const style = getComputedStyle(canvas);
        return style.display !== "none" && canvas.width > 0 && canvas.height > 0;
      };
      if (!canvasVisible()) {
        await image.decode();
        const fallback = document.createElement("canvas");
        fallback.width = image.naturalWidth;
        fallback.height = image.naturalHeight;
        fallback.getContext("2d").drawImage(image, 0, 0);
        return [frameFromCanvas(fallback)];
      }

      const frames = [];
      const seen = new Set();
      const started = performance.now();
      return new Promise((resolve, reject) => {
        const sample = () => {
          try {
            const frame = frameFromCanvas(canvas);
            if (!seen.has(frame.hash)) {
              seen.add(frame.hash);
              frames.push(frame);
              if (frames.length >= expected) {
                resolve(frames);
                return;
              }
            }
            if (performance.now() - started >= duration) {
              if (frames.length === 0) reject(new Error("Canvas produced no frame"));
              else resolve(frames);
              return;
            }
            requestAnimationFrame(sample);
          } catch (error) {
            reject(error);
          }
        };
        requestAnimationFrame(sample);
      });
    },
    {
      expected: Math.max(1, expectedCount),
      duration: durationMs,
      targetWidth: AVATAR_WIDTH,
      targetHeight: AVATAR_HEIGHT,
    }
  );
}

async function captureAction(page, spec, firstAction) {
  const layersPromise = page.waitForResponse(
    (response) => response.url().includes("/api/character_layers.php"),
    { timeout: 30000 }
  );

  if (firstAction) {
    const toggle = page.getByRole("switch", { name: "角色动画" });
    if ((await toggle.getAttribute("aria-checked")) === "true") await toggle.click();
    await toggle.click();
  } else {
    await selectDropdownOption(page, "角色动作", spec.label);
  }

  const response = await layersPromise;
  if (!response.ok()) {
    throw new Error(`${spec.label} layer request failed: HTTP ${response.status()}`);
  }
  const layers = await response.json();
  if (!layers || layers.success !== true) {
    throw new Error(`${spec.label} layer response was not successful`);
  }

  await page.waitForFunction(
    (label) => document.querySelector("canvas.character-animation-canvas")?.getAttribute("aria-label")?.includes(label),
    spec.label,
    { timeout: 10000 }
  );
  await page.waitForTimeout(250);

  const declaredCount = Array.isArray(layers.frames) ? layers.frames.length : 0;
  const frameDelayMs = Number.isFinite(layers.frame_delay) ? layers.frame_delay : 0;
  const frames = await captureVisibleFrames(page, Math.max(1, declaredCount), frameDelayMs);
  if (declaredCount > 1 && frames.length === 0) {
    throw new Error(`${spec.label} declared animation frames but Canvas capture was empty`);
  }

  const layerPaths = Array.from(
    new Set(
      (layers.frames || [])
        .flatMap((frame) => frame || [])
        .map((layer) => layer?.path)
        .filter(Boolean)
    )
  ).sort();
  const endpoint = new URL(response.url());
  return {
    id: spec.id,
    label: spec.label,
    rendererAction: String(layers.action || endpoint.searchParams.get("action") || ""),
    pose: String(layers.pose || ""),
    declaredFrameCount: declaredCount,
    frameDelayMs,
    layerPaths,
    frames,
  };
}

async function composePreview(page, screenPngBase64, avatarPngBase64) {
  return page.evaluate(
    async ({ screenPng, avatarPng, x, y, width, height }) => {
      const load = async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        return image;
      };
      const screen = await load(screenPng);
      const avatar = await load(avatarPng);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(screen, 0, 0);
      ctx.drawImage(avatar, x, y);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    {
      screenPng: screenPngBase64,
      avatarPng: avatarPngBase64,
      x: AVATAR_X,
      y: AVATAR_Y,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    }
  );
}

export async function captureAvatar({
  source,
  server,
  family,
  fontProvider,
  browserPath,
}) {
  if (typeof fontProvider !== "function") {
    throw new Error("A UI font provider is required for deterministic text rendering");
  }
  const browser = await chromium.launch(browserLaunchOptions(browserPath));
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      locale: "zh-CN",
    });
    const page = await context.newPage();
    await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(
      () => Boolean(window.CHARACTER_BUILDER_CONFIG?.initialBuild?.payload),
      null,
      { timeout: 30000 }
    );
    await page.locator(".character-animation").waitFor({ state: "attached", timeout: 30000 });
    await dismissReleaseNotes(page);

    const config = await page.evaluate(() => window.CHARACTER_BUILDER_CONFIG);
    if (Number(config.initialBuild.id) !== source.buildId) {
      throw new Error(
        `Loaded build ${config.initialBuild.id}, expected ${source.buildId}`
      );
    }
    const job = (await page.locator(".character-preview-job").innerText()).trim();
    const profile = extractCharacterProfile(config, { server, family, job });
    const fontText = `${profile.server} LV.${profile.level} ${profile.job} 姓名 ${profile.name} 家族 ${profile.family}`;
    const font = await fontProvider(fontText);
    if (!font?.bytes?.length) {
      throw new Error("The UI font provider returned no font bytes");
    }

    await selectDropdownOption(page, "角色预览背景", "射手村");
    await page.waitForFunction(
      () => document.querySelector(".character-animation")?.classList.contains("character-background-henesys"),
      null,
      { timeout: 5000 }
    );
    const screen = await captureScreen(page, profile, font.bytes);

    const actions = [];
    for (let index = 0; index < ACTION_SPECS.length; index++) {
      actions.push(await captureAction(page, ACTION_SPECS[index], index === 0));
    }
    const previewPngBase64 = await composePreview(
      page,
      screen.pngBase64,
      actions[0].frames[0].devicePngBase64
    );

    return {
      capture: {
        pageTitle: await page.title(),
        profile,
        geometry: {
          screen: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
          scene: {
            height: PROFILE_LAYOUT.panel.y,
            goldenFocalY: Math.round(PROFILE_LAYOUT.panel.y * GOLDEN_RATIO),
            groundY: SCENE_GROUND_Y,
          },
          avatar: {
            x: AVATAR_X,
            y: AVATAR_Y,
            width: AVATAR_WIDTH,
            height: AVATAR_HEIGHT,
          },
        },
        appearance: {
          gender: String(config.initialBuild.payload.g || ""),
          class: String(config.initialBuild.payload.c || ""),
          fashion: config.initialBuild.payload.f || {},
        },
        screen,
        actions,
        previewPngBase64,
      },
      font,
    };
  } finally {
    await browser.close();
  }
}
