/**
 * [INPUT]: Depends on ESP-IDF's basename-only EMBED_FILES linker symbol contract.
 * [OUTPUT]: Verifies generated declarations match the symbols emitted by ESP-IDF 5.5.3.
 * [POS]: Host regression test for the generated C-to-CMake linkage boundary.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import { embeddedFileSymbol } from "../lib/output.mjs";

test("uses the basename for ESP-IDF embedded-file linker symbols", () => {
  assert.equal(
    embeddedFileSymbol("maple_avatar/generated/two_hand_walk-03.rgb565a8"),
    "_binary_two_hand_walk_03_rgb565a8"
  );
});
