/**
 * [INPUT]: Depends on Node HTTP/client primitives and the injectable hosted-builder service Module.
 * [OUTPUT]: Verifies twelve-slot family input, serialized jobs, structured action failures, pack-only artifacts, and public HTTP lifecycle.
 * [POS]: Host contract test for the browser-to-builder-to-avatar-pack path.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AvatarBuildQueue,
  createRequestHandler,
  validateBuildRequest,
} from "../lib/service.mjs";

const JOB_ID = "0123456789abcdef0123456789abcdef";

function fakeBuild() {
  return {
    profile: {
      buildId: 5293,
      name: "蓝莓呀",
      level: 30,
      job: "冰雷法师",
      server: "绿水灵",
      family: "MiiiAo",
    },
    screenPng: Buffer.from("screen"),
    previewPng: Buffer.from("preview"),
    pack: Buffer.from("avatar-pack"),
    actions: [{
      id: "stand",
      label: "站立",
      frameDelayMs: 350,
      frames: [{ devicePng: Buffer.from("frame") }],
    }],
  };
}

async function waitUntilReady(queue) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const job = await queue.get(JOB_ID);
    if (job.status === "ready" || job.status === "failed") return job;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("job did not finish");
}

test("validates source, server, and optional family at the API boundary", () => {
  const request = validateBuildRequest({ source: "5293", server: "绿水灵", family: "" });
  assert.equal(request.source.url, "https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1");
  assert.equal(request.family, "");
  assert.throws(
    () => validateBuildRequest({ source: "5293", server: "测试服", family: "" }),
    /有效的怀旧服区服/,
  );
  assert.equal(
    validateBuildRequest({ source: "5293", server: "绿水灵", family: "MiiiAoFamily" }).family,
    "MiiiAoFamily",
  );
  assert.equal(
    validateBuildRequest({ source: "5293", server: "绿水灵", family: "W".repeat(12) }).family,
    "W".repeat(12),
  );
  assert.throws(
    () => validateBuildRequest({ source: "5293", server: "绿水灵", family: "家族名字七个字" }),
    /最多 6 个汉字或 12 个英文字母/,
  );
  assert.throws(
    () => validateBuildRequest({ source: "5293", server: "绿水灵", family: "ABCDEFGHIJKLM" }),
    /最多 6 个汉字或 12 个英文字母/,
  );
});

test("writes only generated preview and pack artifacts", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "avatar-service-"));
  try {
    const queue = new AvatarBuildQueue({
      outputRoot: root,
      buildAvatar: async () => fakeBuild(),
      idFactory: () => JOB_ID,
    });
    await queue.create(validateBuildRequest({ source: "5293", server: "绿水灵" }));
    const job = await waitUntilReady(queue);
    assert.equal(job.status, "ready");
    assert.equal(job.result.packUrl, `/api/avatar-builds/${JOB_ID}/files/avatar.pack`);
    assert.equal("installManifestUrl" in job.result, false);
    assert.equal(
      (await readFile(path.join(root, JOB_ID, "avatar.pack"))).toString(),
      "avatar-pack",
    );
    assert.equal(
      await queue.cleanupExpired({ now: Date.now() + 25 * 60 * 60 * 1000 }),
      1,
    );
    assert.equal(await queue.get(JOB_ID), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("persists a verified appearance failure without losing the legacy error text", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "avatar-failure-"));
  try {
    const queue = new AvatarBuildQueue({
      outputRoot: root,
      buildAvatar: async () => {
        const error = new Error("攻击动作无法生成：请在小册子更换「透明手套」后重试。");
        error.code = "ACTION_ASSET_UNAVAILABLE";
        error.action = "攻击";
        error.item = { id: "1082102", name: "透明手套" };
        error.upstreamStatus = 422;
        throw error;
      },
      idFactory: () => JOB_ID,
    });
    await queue.create(validateBuildRequest({ source: "18632", server: "绿水灵" }));
    const job = await waitUntilReady(queue);

    assert.equal(job.status, "failed");
    assert.equal(job.error, "攻击动作无法生成：请在小册子更换「透明手套」后重试。");
    assert.deepEqual(job.failure, {
      code: "ACTION_ASSET_UNAVAILABLE",
      action: "攻击",
      item: { id: "1082102", name: "透明手套" },
      upstreamStatus: 422,
    });
    const persisted = JSON.parse(await readFile(path.join(root, JOB_ID, "status.json"), "utf8"));
    assert.deepEqual(persisted.failure, job.failure);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("serves the asynchronous build lifecycle and immutable artifacts", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "avatar-http-"));
  const queue = new AvatarBuildQueue({
    outputRoot: root,
    buildAvatar: async () => fakeBuild(),
    idFactory: () => JOB_ID,
  });
  const server = createServer(createRequestHandler(queue));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const created = await fetch(`${origin}/api/avatar-builds`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "5293", server: "绿水灵", family: "MiiiAo" }),
    });
    assert.equal(created.status, 202);
    assert.equal((await created.json()).status, "queued");
    const job = await waitUntilReady(queue);
    assert.equal(job.status, "ready");
    const status = await fetch(`${origin}/api/avatar-builds/${JOB_ID}`);
    assert.equal((await status.json()).result.profile.name, "蓝莓呀");
    const pack = await fetch(`${origin}/api/avatar-builds/${JOB_ID}/files/avatar.pack`);
    assert.equal(pack.headers.get("cache-control"), "public, max-age=31536000, immutable");
    assert.equal(Buffer.from(await pack.arrayBuffer()).toString(), "avatar-pack");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(root, { recursive: true, force: true });
  }
});
