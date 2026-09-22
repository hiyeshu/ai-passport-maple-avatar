/**
 * [INPUT]: Depends on the capture adapter's screen, avatar, and profile-layout geometry.
 * [OUTPUT]: Verifies centered ground contact and the scene's lower golden-ratio focal point.
 * [POS]: Host geometry test protecting the 240 x 320 character composition.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  AVATAR_HEIGHT,
  AVATAR_WIDTH,
  AVATAR_X,
  AVATAR_Y,
  GOLDEN_RATIO,
  PROFILE_LAYOUT,
  SCENE_GROUND_Y,
  SCREEN_WIDTH,
} from "../lib/capture.mjs";

test("centers the avatar on the scene's lower golden-ratio focal point", () => {
  const sceneHeight = PROFILE_LAYOUT.panel.y;
  const centerX = AVATAR_X + AVATAR_WIDTH / 2;
  const centerY = AVATAR_Y + AVATAR_HEIGHT / 2;

  assert.equal(centerX, SCREEN_WIDTH / 2);
  assert.ok(Math.abs(centerY - sceneHeight * GOLDEN_RATIO) < 0.5);
  // Build 5293 has six transparent rows after the last opaque foot row.
  assert.equal(AVATAR_Y + AVATAR_HEIGHT - 1 - 6, SCENE_GROUND_Y);
});
