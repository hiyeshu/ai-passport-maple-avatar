/**
 * [INPUT]: 依赖纯布局模块的屏幕、角色和铭牌几何。
 * [OUTPUT]: 验证草地落点、黄金比例焦点、动作锚点及装饰无关的统一人物尺度。
 * [POS]: 保护 240 x 320 角色构图的主机几何回归测试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  AVATAR_HEIGHT,
  AVATAR_DISPLAY_SCALE,
  AVATAR_WIDTH,
  AVATAR_X,
  AVATAR_Y,
  GOLDEN_RATIO,
  PROFILE_LAYOUT,
  SCENE_GROUND_Y,
  SCREEN_WIDTH,
  calculateActionCanvasGeometry,
  calculateActionBodyTarget,
  calculateFramePlacement,
} from "../lib/layout.mjs";

const STANDING_FRAMES = [[
  {
    debug: "body",
    path: "stand-body.png",
    origin: [16, 31],
    map: [22, 64],
  },
  {
    debug: "extent",
    path: "stand-extent.png",
    origin: [12, 18],
    map: [0, 0],
  },
  {
    debug: "head",
    path: "head.png",
    origin: [19, 17],
    map: [18, 17],
  },
]];

const WIDE_WEAPON_FRAMES = [[
  STANDING_FRAMES[0][0],
  STANDING_FRAMES[0][2],
  {
    debug: "capOverHair",
    path: "wide-cap.png",
    origin: [19, 22],
    map: [14, 12],
  },
  {
    debug: "weapon",
    path: "wide-weapon.png",
    origin: [66, 28],
    map: [26, 49],
  },
]];

const SITTING_FRAMES = [[
  {
    debug: "body",
    path: "sit-body.png",
    origin: [19, 28],
    map: [19, 60],
  },
  STANDING_FRAMES[0][2],
]];

const ATTACK_FRAMES = [[
  {
    part: "body",
    path: "attack-body.png",
    origin: [11, 27],
    map: [0, 0],
  },
  {
    part: "head",
    path: "attack-head.png",
    origin: [19, 17],
    map: [-9, -41],
  },
  {
    part: "extent",
    path: "attack-extent.png",
    origin: [67, 88],
    map: [0, 0],
  },
]];

const IMAGE_SIZES = new Map([
  ["stand-body.png", { width: 21, height: 31 }],
  ["stand-extent.png", { width: 61, height: 82 }],
  ["head.png", { width: 39, height: 35 }],
  ["wide-cap.png", { width: 47, height: 32 }],
  ["wide-weapon.png", { width: 45, height: 41 }],
  ["sit-body.png", { width: 25, height: 25 }],
  ["attack-body.png", { width: 28, height: 27 }],
  ["attack-head.png", { width: 39, height: 35 }],
  ["attack-extent.png", { width: 98, height: 94 }],
]);

test("keeps the same body centered and sized when a weapon extends left", () => {
  const normal = calculateActionCanvasGeometry(STANDING_FRAMES, IMAGE_SIZES);
  const wide = calculateActionCanvasGeometry(WIDE_WEAPON_FRAMES, IMAGE_SIZES);
  const normalTarget = calculateActionBodyTarget(normal);
  const wideTarget = calculateActionBodyTarget(wide);
  const normalPlacement = calculateFramePlacement(
    normal.sourceWidth, normal.sourceHeight, normal.sourceAnchor, normalTarget
  );
  const widePlacement = calculateFramePlacement(
    wide.sourceWidth, wide.sourceHeight, wide.sourceAnchor, wideTarget
  );
  const bodyX = (geometry, placement) =>
    placement.x + geometry.sourceAnchor.x * placement.scale;

  assert.equal(normal.bodyAnchor.x, wide.bodyAnchor.x);
  assert.deepEqual(normalTarget, { x: 127, y: 233 });
  assert.deepEqual(wideTarget, normalTarget);
  assert.equal(normalPlacement.scale, widePlacement.scale);
  assert.ok(Math.abs(bodyX(normal, normalPlacement) - bodyX(wide, widePlacement)) <= 1);
  assert.equal(widePlacement.x + (-40 - wide.left) * 3 * widePlacement.scale, 3);
});

test("grounds a sitting pose by its body foot rather than its map origin", () => {
  const normal = calculateActionCanvasGeometry(STANDING_FRAMES, IMAGE_SIZES);
  const sitting = calculateActionCanvasGeometry(SITTING_FRAMES, IMAGE_SIZES);
  const normalTarget = calculateActionBodyTarget(normal);
  const sittingTarget = calculateActionBodyTarget(sitting);
  const sittingPlacement = calculateFramePlacement(
    sitting.sourceWidth,
    sitting.sourceHeight,
    sitting.sourceAnchor,
    sittingTarget
  );
  const sittingBody = SITTING_FRAMES[0][0];
  const logicalFootBottom =
    sittingBody.map[1] - sittingBody.origin[1] + IMAGE_SIZES.get(sittingBody.path).height;
  const deviceFootBottom = sittingPlacement.y +
    (logicalFootBottom - sitting.top) * 3 * sittingPlacement.scale;

  assert.equal(deviceFootBottom, SCENE_GROUND_Y + 1);
  assert.equal(sitting.bodyGroundOffset, -3);
  assert.deepEqual(sittingTarget, { x: 121, y: 239 });
  assert.equal(normalTarget.x, 127);
});

for (const decoration of [
  { name: "left weapon", origin: [66, 28], map: [26, 49], size: [45, 41] },
  { name: "right cape", origin: [0, 20], map: [55, 40], size: [90, 55] },
  { name: "tall hat", origin: [19, 95], map: [14, 12], size: [47, 110] },
  { name: "low effect", origin: [0, 0], map: [0, 100], size: [50, 90] },
]) {
  test(`keeps anatomy fixed when a ${decoration.name} expands the Canvas`, () => {
    const path = `decoration-${decoration.name}.png`;
    const frames = [[
      STANDING_FRAMES[0][0],
      STANDING_FRAMES[0][2],
      {
        debug: decoration.name,
        path,
        origin: decoration.origin,
        map: decoration.map,
      },
    ]];
    const sizes = new Map(IMAGE_SIZES).set(path, {
      width: decoration.size[0],
      height: decoration.size[1],
    });
    const geometry = calculateActionCanvasGeometry(frames, sizes);
    const target = calculateActionBodyTarget(geometry);
    const placement = calculateFramePlacement(
      geometry.sourceWidth,
      geometry.sourceHeight,
      geometry.sourceAnchor,
      target
    );
    const deviceHeadX = placement.x +
      (geometry.headCenter.x - geometry.left) * 3 * placement.scale;
    const deviceFootBottom = placement.y +
      (geometry.bodyAnchor.y - geometry.top) * 3 * placement.scale;

    assert.equal(placement.scale, AVATAR_DISPLAY_SCALE);
    assert.equal(deviceHeadX, SCREEN_WIDTH / 2);
    assert.equal(deviceFootBottom, SCENE_GROUND_Y + 1);
  });
}

test("centers the avatar on the scene's lower golden-ratio focal point", () => {
  const sceneHeight = PROFILE_LAYOUT.panel.y;
  const geometry = calculateActionCanvasGeometry(STANDING_FRAMES, IMAGE_SIZES);
  const standing = calculateFramePlacement(
    geometry.sourceWidth,
    geometry.sourceHeight,
    geometry.sourceAnchor,
    calculateActionBodyTarget(geometry)
  );
  const centerX = AVATAR_X + standing.x + standing.width / 2;
  const centerY = AVATAR_Y + standing.y + standing.height / 2;

  assert.equal(centerX, SCREEN_WIDTH / 2);
  assert.ok(Math.abs(centerY - sceneHeight * GOLDEN_RATIO) < 2);
  assert.equal(PROFILE_LAYOUT.labels.name, "ID");
  assert.equal(AVATAR_DISPLAY_SCALE, 2 / 3);
  // Build 5293 has six transparent rows after the last opaque foot row.
  assert.equal(
    AVATAR_Y + standing.y + standing.height - 1 - 6,
    SCENE_GROUND_Y
  );
});

test("centers the attack head and grounds its body without moving animation frames", () => {
  const standingGeometry = calculateActionCanvasGeometry(
    STANDING_FRAMES,
    IMAGE_SIZES
  );
  const attackGeometry = calculateActionCanvasGeometry(
    ATTACK_FRAMES,
    IMAGE_SIZES
  );
  const targetAnchor = calculateActionBodyTarget(standingGeometry);
  const attackTarget = calculateActionBodyTarget(attackGeometry);
  const standing = calculateFramePlacement(
    201, 264, standingGeometry.sourceAnchor, targetAnchor
  );
  const attack = calculateFramePlacement(
    312,
    300,
    attackGeometry.sourceAnchor,
    attackTarget
  );

  assert.deepEqual(attackTarget, { x: 137, y: 233 });

  assert.deepEqual(
    { x: standing.x, y: standing.y, width: standing.width, height: standing.height },
    { x: 53, y: 63, width: 134, height: 176 }
  );
  assert.deepEqual(
    standingGeometry,
    {
      left: -15,
      top: -21,
      width: 67,
      height: 88,
      sourceWidth: 201,
      sourceHeight: 264,
      bodyAnchor: { x: 22, y: 64 },
      bodyGroundOffset: 0,
      headCenter: { x: 18.5, y: 17.5 },
      sourceAnchor: { x: 111, y: 255 },
    }
  );
  assert.deepEqual(
    attackGeometry,
    {
      left: -70,
      top: -91,
      width: 104,
      height: 100,
      sourceWidth: 312,
      sourceHeight: 300,
      bodyAnchor: { x: 0, y: 0 },
      bodyGroundOffset: 0,
      headCenter: { x: -8.5, y: -40.5 },
      sourceAnchor: { x: 210, y: 273 },
    }
  );
  assert.deepEqual(
    { x: attack.x, y: attack.y, width: attack.width, height: attack.height },
    { x: -3, y: 51, width: 208, height: 200 }
  );
  assert.equal(attack.scale, standing.scale);
  const visibleHeadX = (geometry, placement) =>
    placement.x + (geometry.headCenter.x - geometry.left) * 3 * placement.scale;
  assert.equal(visibleHeadX(standingGeometry, standing), SCREEN_WIDTH / 2);
  assert.equal(visibleHeadX(attackGeometry, attack), SCREEN_WIDTH / 2);
  assert.ok(
    Math.abs(attack.x + attackGeometry.sourceAnchor.x * attack.scale - attackTarget.x) < 0.5
  );
  assert.ok(
    Math.abs(attack.y + attackGeometry.sourceAnchor.y * attack.scale - attackTarget.y) < 0.5
  );
});
