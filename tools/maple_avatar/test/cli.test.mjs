/**
 * [INPUT]: Depends on the importer CLI's pure argument parser.
 * [OUTPUT]: Verifies defaults, overrides, and rejection of ambiguous options.
 * [POS]: Host test for the command-line trust boundary.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import { parseArguments } from "../lib/cli.mjs";

test("uses the approved build 5293 source by default", () => {
  const options = parseArguments([]);
  assert.equal(
    options.source,
    "https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1"
  );
});

test("accepts source and profile overrides", () => {
  assert.deepEqual(
    parseArguments(["3168", "--server", "小白兔", "--family", "MiiiAo"]),
    { source: "3168", server: "小白兔", family: "MiiiAo" }
  );
});

test("rejects unknown servers and missing option values", () => {
  assert.throws(() => parseArguments(["--server", "未知服"]), /Unsupported server/);
  assert.throws(() => parseArguments(["--family"]), /requires a value/);
});
