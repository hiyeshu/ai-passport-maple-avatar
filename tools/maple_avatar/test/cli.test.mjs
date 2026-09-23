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
  assert.equal(options.server, "绿水灵");
  assert.equal(options.family, "MiiiAo");
  assert.equal(options.sample, true);
});

test("accepts source and profile overrides", () => {
  assert.deepEqual(
    parseArguments(["3168", "--server", "小白兔", "--family", "MiiiAo"]),
    {
      source: "3168",
      server: "小白兔",
      family: "MiiiAo",
      sample: false,
    }
  );
});

test("marks only the repository fixture as a sample", () => {
  assert.equal(parseArguments(["3168", "--server", "绿水灵"]).sample, false);
  assert.equal(
    parseArguments(["3168", "--server", "绿水灵", "--sample"]).sample,
    true,
  );
});

test("rejects unknown servers and missing option values", () => {
  assert.throws(() => parseArguments(["--server", "未知服"]), /Unsupported server/);
  assert.throws(() => parseArguments(["--family"]), /requires a value/);
});
