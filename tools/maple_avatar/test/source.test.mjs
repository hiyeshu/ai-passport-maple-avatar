/**
 * [INPUT]: Depends on node:test and the public source parsing API.
 * [OUTPUT]: Verifies accepted MXDC build links and their canonical read-only URL.
 * [POS]: Importer contract test that protects the only accepted external source boundary.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  extractCharacterProfile,
  parseBuildSource,
} from "../lib/source.mjs";

test("canonicalizes the public MXDC build link as read-only", () => {
  const source = parseBuildSource(
    "https://mxdc.dvg.cn/tools/character-builder/?build=5293"
  );

  assert.equal(source.buildId, 5293);
  assert.equal(
    source.url,
    "https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1"
  );
});

test("extracts the public build and applies explicit server and family fallbacks", () => {
  const profile = extractCharacterProfile(
    {
      initialBuild: {
        id: 5293,
        name: "蓝莓呀",
        revision: "public-revision",
        payload: { l: 30, n: "蓝莓呀" },
      },
    },
    { job: "冰雷法师" }
  );

  assert.deepEqual(profile, {
    buildId: 5293,
    name: "蓝莓呀",
    level: 30,
    job: "冰雷法师",
    family: "MiiiAo",
    server: "绿水灵",
    revision: "public-revision",
  });
});

test("enforces the profile card capacity instead of shrinking overflow text", () => {
  const build = {
    initialBuild: {
      id: 5293,
      name: "蓝莓呀",
      payload: { l: 30, n: "蓝莓呀" },
    },
  };

  assert.throws(
    () => extractCharacterProfile(build, { job: "冰雷大魔导师" }),
    /job exceeds 5 characters/
  );
  assert.throws(
    () => extractCharacterProfile({ ...build, initialBuild: { ...build.initialBuild, payload: { l: 1000 } } }, { job: "冰雷法师" }),
    /invalid level/
  );
  assert.throws(
    () => extractCharacterProfile(build, { job: "冰雷法师", family: "1234567" }),
    /family exceeds 6 characters/
  );
});

test("accepts the exact six-character and three-digit profile boundaries", () => {
  const profile = extractCharacterProfile(
    {
      initialBuild: {
        id: 5293,
        name: "角色名字六字",
        payload: { l: 999, n: "角色名字六字" },
      },
    },
    { job: "超级冰雷师", family: "家族名字六字" }
  );

  assert.equal(profile.name, "角色名字六字");
  assert.equal(profile.level, 999);
  assert.equal(profile.job, "超级冰雷师");
  assert.equal(profile.family, "家族名字六字");
});
