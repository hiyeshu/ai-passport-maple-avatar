/**
 * [INPUT]: 依赖来源 Canvas 尺寸、分层 map/origin 坐标与设备布局约束。
 * [OUTPUT]: 对外提供屏幕/铭牌常量、动作画布几何计算与装备无关的头部/身体/脚底定位函数。
 * [POS]: maple_avatar 导入器的纯布局内核，被浏览器抓取器与主机回归测试消费。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const SCREEN_WIDTH = 240;
export const SCREEN_HEIGHT = 320;
export const AVATAR_WIDTH = SCREEN_WIDTH;
export const AVATAR_HEIGHT = 246;
export const AVATAR_X = 0;
export const AVATAR_Y = 0;
export const GOLDEN_RATIO = 0.618;
export const SCENE_GROUND_Y = 232;

const SOURCE_RENDER_SCALE = 3;
const DEVICE_PIXELS_PER_LOGICAL_PIXEL = 2;
const SOURCE_PADDING = 3;
export const AVATAR_DISPLAY_SCALE =
  DEVICE_PIXELS_PER_LOGICAL_PIXEL / SOURCE_RENDER_SCALE;

export const PROFILE_LAYOUT = Object.freeze({
  variant: "maple-profile-card-v2",
  labels: { name: "ID", family: "家族" },
  panel: { x: 0, y: 246, width: 240, height: 74 },
  chips: [
    { key: "server", x: 8, y: 250, width: 59, height: 21 },
    { key: "level", x: 72, y: 250, width: 56, height: 21 },
    { key: "job", x: 133, y: 250, width: 99, height: 21 },
  ],
  nameplate: { x: 8, y: 277, width: 224, height: 37, dividerX: 120 },
});

export function calculateFramePlacement(
  sourceWidth,
  sourceHeight,
  sourceAnchor,
  targetAnchor
) {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new TypeError("Frame dimensions must be positive numbers");
  }

  const scale = AVATAR_DISPLAY_SCALE;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  for (const [label, point] of [
    ["source", sourceAnchor],
    ["target", targetAnchor],
  ]) {
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) {
      throw new TypeError(`${label} anchor must contain finite x and y values`);
    }
  }
  return {
    x: Math.round(targetAnchor.x - sourceAnchor.x * scale),
    y: Math.round(targetAnchor.y - sourceAnchor.y * scale),
    width,
    height,
    scale,
  };
}

export function calculateActionBodyTarget(geometry) {
  if (
    !Number.isFinite(geometry?.bodyAnchor?.x) ||
    !Number.isFinite(geometry?.bodyGroundOffset) ||
    !Number.isFinite(geometry?.headCenter?.x)
  ) {
    throw new Error("Action has no valid body, head, or ground anchor for alignment");
  }
  return {
    x: SCREEN_WIDTH / 2 -
      (geometry.headCenter.x - geometry.bodyAnchor.x) * DEVICE_PIXELS_PER_LOGICAL_PIXEL,
    y: SCENE_GROUND_Y + 1 -
      geometry.bodyGroundOffset * DEVICE_PIXELS_PER_LOGICAL_PIXEL,
  };
}

function layerPoint(layer, key) {
  const point = layer?.[key];
  const x = Number(point?.[0] ?? 0);
  const y = Number(point?.[1] ?? 0);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Character layer ${key} is invalid`);
  }
  return { x, y };
}

function bodyLayer(frame) {
  return (
    frame.find((layer) => layer?.part === "body" || layer?.debug === "body") ||
    frame.find((layer) => layer?.z === "body")
  );
}

function headLayer(frame) {
  return (
    frame.find((layer) => layer?.part === "head" || layer?.debug === "head") ||
    frame.find((layer) => layer?.z === "head")
  );
}

export function calculateActionCanvasGeometry(frames, imageSizes) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error("Character action has no frames");
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let bodyAnchor;
  let bodyGroundOffset = -Infinity;
  let headCenter;

  for (const [frameIndex, frame] of frames.entries()) {
    if (!Array.isArray(frame) || frame.length === 0) {
      throw new Error("Character action contains an empty frame");
    }
    const body = bodyLayer(frame);
    if (!body) throw new Error("Character action frame has no body anchor");
    const frameBodyAnchor = layerPoint(body, "map");
    if (
      bodyAnchor &&
      (bodyAnchor.x !== frameBodyAnchor.x || bodyAnchor.y !== frameBodyAnchor.y)
    ) {
      throw new Error("Character body anchor changes within one action");
    }
    bodyAnchor ||= frameBodyAnchor;
    const referenceHead = frameIndex === 0 ? headLayer(frame) : undefined;

    for (const layer of frame) {
      if (!layer?.path) throw new Error("Character layer path is missing");
      const size = imageSizes instanceof Map
        ? imageSizes.get(layer.path)
        : imageSizes?.[layer.path];
      if (
        !Number.isFinite(size?.width) ||
        !Number.isFinite(size?.height) ||
        size.width <= 0 ||
        size.height <= 0
      ) {
        throw new Error(`Character layer dimensions are missing for ${layer.path}`);
      }
      const map = layerPoint(layer, "map");
      const origin = layerPoint(layer, "origin");
      const x = map.x - origin.x;
      const y = map.y - origin.y;
      if (layer === body) {
        bodyGroundOffset = Math.max(
          bodyGroundOffset,
          y + size.height - frameBodyAnchor.y
        );
      }
      if (layer === referenceHead) {
        headCenter = {
          x: x + size.width / 2,
          y: y + size.height / 2,
        };
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + size.width);
      maxY = Math.max(maxY, y + size.height);
    }
  }

  const left = minX - SOURCE_PADDING;
  const top = minY - SOURCE_PADDING;
  const width = Math.ceil(maxX - minX) + SOURCE_PADDING * 2;
  const height = Math.ceil(maxY - minY) + SOURCE_PADDING * 2;
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new Error("Character action Canvas geometry is invalid");
  }

  return {
    left,
    top,
    width,
    height,
    sourceWidth: width * SOURCE_RENDER_SCALE,
    sourceHeight: height * SOURCE_RENDER_SCALE,
    bodyAnchor,
    bodyGroundOffset,
    headCenter,
    sourceAnchor: {
      x: (bodyAnchor.x - left) * SOURCE_RENDER_SCALE,
      y: (bodyAnchor.y - top) * SOURCE_RENDER_SCALE,
    },
  };
}
