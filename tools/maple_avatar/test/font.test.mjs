/**
 * [INPUT]: Depends on node:test and the public font URL parsing API.
 * [OUTPUT]: Verifies deterministic subset requests and strict CSS source extraction.
 * [POS]: Offline contract test for build-time typography provenance.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import { buildFontCssUrl, extractFontUrl } from "../lib/font.mjs";

test("builds an exact Noto Sans SC subset request", () => {
  const url = new URL(buildFontCssUrl("绿水灵 蓝莓呀"));
  assert.equal(url.origin, "https://fonts.googleapis.com");
  assert.equal(url.searchParams.get("family"), "Noto Sans SC:wght@600");
  assert.equal(url.searchParams.get("text"), "绿水灵 蓝莓呀");
});

test("extracts only a declared TrueType font URL", () => {
  assert.equal(
    extractFontUrl("src: url(https://fonts.gstatic.com/l/font?kit=abc) format('truetype');"),
    "https://fonts.gstatic.com/l/font?kit=abc"
  );
});
