#!/usr/bin/env node
/**
 * [INPUT]: Depends on HTTP requests, Playwright capture, shared artifact compiler, and local persistent storage.
 * [OUTPUT]: Runs the same-origin asynchronous avatar build API used by avatar.miiiao.cn.
 * [POS]: Hosted service Composition Root; environment configuration lives here and domain logic stays injectable.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileAvatarArtifacts } from "../../tools/maple_avatar/lib/artifacts.mjs";
import { captureAvatar } from "../../tools/maple_avatar/lib/capture.mjs";
import { downloadUiFont } from "../../tools/maple_avatar/lib/font.mjs";
import { AvatarBuildQueue, createRequestHandler } from "./lib/service.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8788);
const OUTPUT_ROOT = path.resolve(
  process.env.AVATAR_OUTPUT_DIR || path.join(HERE, ".runtime", "builds"),
);

async function buildAvatar({ source, server, family }) {
  const { capture } = await captureAvatar({
    source,
    server,
    family,
    browserPath: process.env.MAPLE_AVATAR_CHROME,
    fontProvider: downloadUiFont,
  });
  return compileAvatarArtifacts(capture, { sample: false });
}

const queue = new AvatarBuildQueue({
  outputRoot: OUTPUT_ROOT,
  buildAvatar,
  maxQueued: Number(process.env.AVATAR_MAX_QUEUE || 8),
});
const artifactTtlMs = Number(process.env.AVATAR_TTL_HOURS || 24) * 60 * 60 * 1000;
await queue.cleanupExpired({ ttlMs: artifactTtlMs });
const cleanupTimer = setInterval(
  () => queue.cleanupExpired({ ttlMs: artifactTtlMs }).catch((error) => {
    process.stderr.write(`avatar artifact cleanup failed: ${error.stack || error}\n`);
  }),
  60 * 60 * 1000,
);
cleanupTimer.unref();
const handler = createRequestHandler(queue);
const server = createServer((request, response) => {
  handler(request, response).catch((error) => {
    response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    response.end(`${JSON.stringify({ error: "服务暂时不可用。" })}\n`);
    process.stderr.write(`avatar builder request failed: ${error.stack || error}\n`);
  });
});
server.headersTimeout = 15_000;
server.requestTimeout = 15_000;

server.listen(PORT, "0.0.0.0", () => {
  process.stdout.write(`Avatar builder listening on http://0.0.0.0:${PORT}\n`);
});
