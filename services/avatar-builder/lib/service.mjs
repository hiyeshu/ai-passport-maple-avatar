/**
 * [INPUT]: Depends on validated build requests, one injected avatar compiler, and a writable artifact directory.
 * [OUTPUT]: Provides a bounded asynchronous job queue plus HTTP status and immutable artifact delivery.
 * [POS]: Hosted builder Application Module; isolates request lifecycle from Playwright and binary details.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { MAPLE_SERVERS, parseBuildSource } from "../../../tools/maple_avatar/lib/source.mjs";

const JSON_LIMIT_BYTES = 4096;
const JOB_ID_PATTERN = /^[a-f0-9]{32}$/;
const CONTENT_TYPES = Object.freeze({
  ".json": "application/json; charset=utf-8",
  ".pack": "application/octet-stream",
  ".png": "image/png",
});

function countCharacters(value) {
  return [...String(value)].length;
}

export function validateBuildRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("请求内容必须是 JSON 对象。");
  }
  const source = parseBuildSource(value.source);
  const server = String(value.server ?? "").trim();
  const family = String(value.family ?? "").trim();
  if (!MAPLE_SERVERS.includes(server)) throw new Error("请选择有效的怀旧服区服。");
  if (countCharacters(family) > 6) throw new Error("家族名称最多 6 个字。");
  return Object.freeze({ source, server, family });
}

async function writeJsonAtomic(filename, value) {
  const temporary = `${filename}.tmp-${process.pid}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, filename);
}

function publicResult(jobId, profile, actions) {
  const root = `/api/avatar-builds/${jobId}/files`;
  return {
    profile,
    screenUrl: `${root}/screen.png`,
    previewUrl: `${root}/preview.png`,
    packUrl: `${root}/avatar.pack`,
    actions: actions.map((action) => ({
      id: action.id,
      label: action.label,
      frameDelayMs: action.frameDelayMs,
      frames: action.frames.map((_, index) => (
        `${root}/frames/${action.id}-${String(index).padStart(2, "0")}.png`
      )),
    })),
  };
}

export async function writeBuildArtifacts({ directory, jobId, build }) {
  const staging = path.join(directory, ".staging");
  await rm(staging, { recursive: true, force: true });
  await mkdir(path.join(staging, "frames"), { recursive: true });
  try {
    await Promise.all([
      writeFile(path.join(staging, "screen.png"), build.screenPng),
      writeFile(path.join(staging, "preview.png"), build.previewPng),
      writeFile(path.join(staging, "avatar.pack"), build.pack),
    ]);
    for (const action of build.actions) {
      for (let index = 0; index < action.frames.length; index++) {
        await writeFile(
          path.join(staging, "frames", `${action.id}-${String(index).padStart(2, "0")}.png`),
          action.frames[index].devicePng,
        );
      }
    }
    for (const filename of ["screen.png", "preview.png", "avatar.pack", "frames"]) {
      await rename(path.join(staging, filename), path.join(directory, filename));
    }
    await rm(staging, { recursive: true, force: true });
    return publicResult(jobId, build.profile, build.actions);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > JSON_LIMIT_BYTES) throw new Error("请求内容过大。");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("请求内容不是有效 JSON。");
  }
}

function sendJson(response, status, value) {
  const body = Buffer.from(`${JSON.stringify(value)}\n`);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": body.length,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n]+/g, " ").slice(0, 300);
}

export class AvatarBuildQueue {
  constructor({ outputRoot, buildAvatar, maxQueued = 8, idFactory }) {
    if (typeof buildAvatar !== "function") throw new TypeError("buildAvatar is required");
    this.outputRoot = outputRoot;
    this.buildAvatar = buildAvatar;
    this.maxQueued = maxQueued;
    this.idFactory = idFactory ?? (() => randomUUID().replaceAll("-", ""));
    this.jobs = new Map();
    this.pending = [];
    this.running = false;
  }

  async create(request) {
    if (this.pending.length >= this.maxQueued) throw new Error("构建队列已满，请稍后重试。");
    const id = this.idFactory();
    if (!JOB_ID_PATTERN.test(id) || this.jobs.has(id)) throw new Error("构建任务 ID 无效。");
    const now = new Date().toISOString();
    const job = { id, status: "queued", createdAt: now, updatedAt: now };
    const directory = path.join(this.outputRoot, id);
    await mkdir(this.outputRoot, { recursive: true });
    await mkdir(directory, { recursive: false });
    await this.#save(job);
    this.jobs.set(id, job);
    this.pending.push({ job, request });
    queueMicrotask(() => void this.#drain());
    return { ...job };
  }

  async get(id) {
    if (!JOB_ID_PATTERN.test(id)) return null;
    if (this.jobs.has(id)) return this.jobs.get(id);
    try {
      const job = JSON.parse(await readFile(path.join(this.outputRoot, id, "status.json"), "utf8"));
      if (job.status === "queued" || job.status === "building") {
        job.status = "failed";
        job.error = "构建服务在任务完成前重启，请重新生成。";
        await this.#save(job);
      }
      this.jobs.set(id, job);
      return job;
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async cleanupExpired({ now = Date.now(), ttlMs = 24 * 60 * 60 * 1000 } = {}) {
    await mkdir(this.outputRoot, { recursive: true });
    const entries = await readdir(this.outputRoot, { withFileTypes: true });
    let removed = 0;
    for (const entry of entries) {
      if (!entry.isDirectory() || !JOB_ID_PATTERN.test(entry.name)) continue;
      const active = this.jobs.get(entry.name);
      if (active?.status === "queued" || active?.status === "building") continue;
      try {
        const statusPath = path.join(this.outputRoot, entry.name, "status.json");
        const job = active ?? JSON.parse(await readFile(statusPath, "utf8"));
        const updatedAt = Date.parse(job.updatedAt);
        if (!Number.isFinite(updatedAt) || now - updatedAt < ttlMs) continue;
        await rm(path.join(this.outputRoot, entry.name), { recursive: true, force: true });
        this.jobs.delete(entry.name);
        removed++;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    return removed;
  }

  async #save(job) {
    job.updatedAt = new Date().toISOString();
    await writeJsonAtomic(path.join(this.outputRoot, job.id, "status.json"), job);
  }

  async #drain() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.pending.length) {
        const { job, request } = this.pending.shift();
        job.status = "building";
        await this.#save(job);
        try {
          const build = await this.buildAvatar(request);
          job.result = await writeBuildArtifacts({
            directory: path.join(this.outputRoot, job.id),
            jobId: job.id,
            build,
          });
          job.status = "ready";
        } catch (error) {
          job.status = "failed";
          job.error = safeErrorMessage(error);
        }
        await this.#save(job);
      }
    } finally {
      this.running = false;
    }
  }
}

export function createRequestHandler(queue) {
  return async function handle(request, response) {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/healthz") {
      return sendJson(response, 200, { ok: true });
    }
    if (request.method === "POST" && url.pathname === "/api/avatar-builds") {
      try {
        const job = await queue.create(validateBuildRequest(await readJsonBody(request)));
        return sendJson(response, 202, job);
      } catch (error) {
        const message = safeErrorMessage(error);
        return sendJson(response, message.includes("队列已满") ? 429 : 400, { error: message });
      }
    }

    const statusMatch = url.pathname.match(/^\/api\/avatar-builds\/([a-f0-9]{32})$/);
    if (request.method === "GET" && statusMatch) {
      const job = await queue.get(statusMatch[1]);
      return job ? sendJson(response, 200, job) : sendJson(response, 404, { error: "任务不存在。" });
    }

    const fileMatch = url.pathname.match(
      /^\/api\/avatar-builds\/([a-f0-9]{32})\/files\/(screen\.png|preview\.png|avatar\.pack|frames\/[a-z_]+-\d{2}\.png)$/,
    );
    if (request.method === "GET" && fileMatch) {
      const job = await queue.get(fileMatch[1]);
      if (!job || job.status !== "ready") return sendJson(response, 404, { error: "文件尚未就绪。" });
      try {
        const filename = path.join(queue.outputRoot, fileMatch[1], fileMatch[2]);
        const body = await readFile(filename);
        response.writeHead(200, {
          "content-type": CONTENT_TYPES[path.extname(filename)] ?? "application/octet-stream",
          "content-length": body.length,
          "cache-control": "public, max-age=31536000, immutable",
          "x-content-type-options": "nosniff",
        });
        response.end(body);
        return;
      } catch (error) {
        if (error.code === "ENOENT") return sendJson(response, 404, { error: "文件不存在。" });
        throw error;
      }
    }
    return sendJson(response, 404, { error: "接口不存在。" });
  };
}
