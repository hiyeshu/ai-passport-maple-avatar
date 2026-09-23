<p align="right">
  <a href="CLAUDE.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# `services/avatar-builder/`

> L2 | Parent: [`../../CLAUDE.md`](../../CLAUDE.md)

This module hosts the asynchronous public-link build boundary. It serializes
Playwright work, persists explicit job states, and serves immutable artifacts;
capture and binary compilation remain in `tools/maple_avatar/`.

## Members

| Member | Responsibility |
| --- | --- |
| `CLAUDE.md` | English module map. |
| `CLAUDE.zh_CN.md` | Simplified Chinese module map. |
| `README.md` | English API, deployment, storage, and failure guide. |
| `README.zh_CN.md` | Simplified Chinese service guide. |
| `Dockerfile` | Pinned Playwright, non-root OCI deployment image. |
| `compose.yaml` | Single-worker deployment, persistent volume, health check, and loopback port. |
| `package.json` | Service start and host-test commands. |
| `server.mjs` | Environment parsing and real capture/compiler composition root. |
| `lib/service.mjs` | Request validation, bounded queue, status persistence, TTL cleanup, and HTTP delivery. |
| `test/service.test.mjs` | Validation, lifecycle, pack-only artifact, immutable file, and expiry tests. |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
