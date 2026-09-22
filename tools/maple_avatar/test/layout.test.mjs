/**
 * [INPUT]: Depends on the pure layout module's screen, avatar, and profile-card geometry.
 * [OUTPUT]: Verifies centered ground contact, golden-ratio focus, stable body anchoring, and action-independent avatar scale.
 * [POS]: Host geometry test protecting the 240 x 320 character composition.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  AVATAR_HEIGHT,
  AVATAR_REFERENCE_HEIGHT,
  AVATAR_WIDTH,
  AVATAR_X,
  AVATAR_Y,
  GOLDEN_RATIO,
  PROFILE_LAYOUT,
  SCENE_GROUND_Y,
  SCREEN_WIDTH,
  calculateActionCanvasGeometry,
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
]];

const ATTACK_FRAMES = [[
  {
    part: "body",
    path: "attack-body.png",
    origin: [11, 27],
    map: [0, 0],
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
  ["attack-body.png", { width: 28, height: 27 }],
  ["attack-extent.png", { width: 98, height: 94 }],
]);

test("centers the avatar on the scene's lower golden-ratio focal point", () => {
  const sceneHeight = PROFILE_LAYOUT.panel.y;
  const standing = calculateFramePlacement(201, 264, 264);
  const centerX = AVATAR_X + standing.x + standing.width / 2;
  const centerY = AVATAR_Y + standing.y + standing.height / 2;

  assert.equal(centerX, SCREEN_WIDTH / 2);
  assert.ok(Math.abs(centerY - sceneHeight * GOLDEN_RATIO) < 0.5);
  assert.equal(PROFILE_LAYOUT.labels.name, "ID");
  assert.equal(AVATAR_REFERENCE_HEIGHT, 173);
  // Build 5293 has six transparent rows after the last opaque foot row.
  assert.equal(
    AVATAR_Y + standing.y + standing.height - 1 - 6,
    SCENE_GROUND_Y
  );
});

test("anchors attack frames to the standing body's world position", () => {
  const standingGeometry = calculateActionCanvasGeometry(
    STANDING_FRAMES,
    IMAGE_SIZES
  );
  const attackGeometry = calculateActionCanvasGeometry(
    ATTACK_FRAMES,
    IMAGE_SIZES
  );
  const standing = calculateFramePlacement(201, 264, 264);
  const targetAnchor = {
    x: standing.x + standingGeometry.sourceAnchor.x * standing.scale,
    y: standing.y + standingGeometry.sourceAnchor.y * standing.scale,
  };
  const attack = calculateFramePlacement(
    312,
    300,
    264,
    attackGeometry.sourceAnchor,
    targetAnchor
  );

  assert.deepEqual(
    { x: standing.x, y: standing.y, width: standing.width, height: standing.height },
    { x: 54, y: 66, width: 132, height: 173 }
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
      sourceAnchor: { x: 210, y: 273 },
    }
  );
  assert.deepEqual(
    { x: attack.x, y: attack.y, width: attack.width, height: attack.height },
    { x: -11, y: 54, width: 204, height: 197 }
  );
  assert.equal(attack.scale, standing.scale);
  assert.ok(
    Math.abs(attack.x + attackGeometry.sourceAnchor.x * attack.scale - targetAnchor.x) < 0.5
  );
  assert.ok(
    Math.abs(attack.y + attackGeometry.sourceAnchor.y * attack.scale - targetAnchor.y) < 0.5
  );
});
