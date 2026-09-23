<p align="right">
  <a href="README.zh_CN.md">简体中文</a> · <strong>English</strong>
</p>

# Avatar builder service

This small HTTP service converts a public MXDC build into one internally
consistent preview, action set, download, and `avatar.pack`. It is intended to
run behind the same HTTPS origin as the `miiiao-avatar-builder` frontend.

## Contract

`POST /api/avatar-builds` accepts:

```json
{
  "source": "https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1",
  "server": "SERVER_NAME",
  "family": "FAMILY_NAME"
}
```

Only canonical `mxdc.dvg.cn/tools/character-builder/` public build links are
accepted by this internal API. The frontend also accepts profile links and
normalizes them before submission. Server is required,
family is optional and limited to six characters, while name, level, and job
always come from the source page. The response is `202` with a job ID.
Poll `GET /api/avatar-builds/:id` until `ready` or `failed`; a ready result
contains same-origin immutable URLs for screen, preview, six action sets, and
`avatar.pack`. The dedicated frontend writer owns the partition address and
write-safety contract; this service does not emit a generic firmware manifest
that could request a full-device erase.

There is no silent sample fallback. Source drift, browser failure, invalid data,
or restart during an unfinished job becomes an explicit failed status.

## Local run

From the repository root:

```bash
cd tools/maple_avatar && npm ci
cd ../../services/avatar-builder
npm start
```

The default endpoint is `http://127.0.0.1:8788`. Vite proxies `/api` there
while developing the frontend.

## Deployment

```bash
docker compose -f services/avatar-builder/compose.yaml up -d --build
```

The container binds only `127.0.0.1:8788`; terminate TLS and reverse-proxy
`/api/avatar-builds` at the public web gateway. The host requires outbound
HTTPS access to MXDC and font sources. Keep a single service replica unless the
queue and artifact store are replaced with shared infrastructure: one process
serializes browser capture to bound memory.

Environment controls:

- `AVATAR_MAX_QUEUE`: maximum waiting jobs, default `8`.
- `AVATAR_TTL_HOURS`: ready/failed artifact lifetime, default `24`.
- `AVATAR_OUTPUT_DIR`: persistent job directory, default `.runtime/builds`.
- `MAPLE_AVATAR_CHROME`: optional Chromium executable override.
- `PORT`: listen port, default `8788`.

No credentials are required or written into artifacts. Retain gateway rate
limits and request logs without logging private tokens or complete browser data.
The current API is intentionally stateless from the user's perspective: expired
jobs are regenerated from the original public link.

While ICP filing is pending, only the frontend is exposed on a Vercel-provided
preview domain for testing. It must not bind or redirect `miiiao.cn`, and the
device continues to show the planned `avatar.miiiao.cn` address with an explicit
pending-filing notice. The production API remains a same-origin deployment
target after filing, DNS, TLS, and the backend are ready.

## Tests

```bash
npm test
```

Repository-wide `./tools/validate.sh --static` also runs this suite.

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
