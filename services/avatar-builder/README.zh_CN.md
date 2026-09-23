<p align="right">
  <strong>简体中文</strong> · <a href="README.md">English</a>
</p>

# 角色在线构建服务

这个小型 HTTP 服务把一个公开 MXDC 方案转换为内部一致的预览、动作、下载图与
`avatar.pack`。生产环境应让它与 `miiiao-avatar-builder` 前端共用同一个 HTTPS
域名。

## 接口契约

`POST /api/avatar-builds` 接收：

```json
{
  "source": "https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1",
  "server": "绿水灵",
  "family": "MiiiAo"
}
```

内部 API 只接受规范化的 `mxdc.dvg.cn/tools/character-builder/` 公开方案链接；
前端也接受角色资料链接，并在提交前把它规范化。服务器必填，家族可空且最多 6 个字；
角色名、等级和职业始终来自源页面。接口以 `202` 返回任务 ID。轮询
`GET /api/avatar-builds/:id`，直到状态为 `ready` 或 `failed`。成功结果包含
同源、不可变的资料屏、预览、六组动作与 `avatar.pack`。角色分区地址和写入安全约束
由前端专用写入器负责，服务不再生成可能触发全盘擦除的通用固件安装清单。

服务不会静默回退到示例。源页漂移、浏览器失败、资料不合法，或任务完成前服务重启，
都会成为明确的失败状态。

## 本地运行

在仓库根目录执行：

```bash
cd tools/maple_avatar && npm ci
cd ../../services/avatar-builder
npm start
```

默认监听 `http://127.0.0.1:8788`。前端开发时由 Vite 把 `/api` 代理到此端口。

## 部署

```bash
docker compose -f services/avatar-builder/compose.yaml up -d --build
```

容器只绑定 `127.0.0.1:8788`；由公网网关终止 TLS，并把
`/api/avatar-builds` 反向代理到服务。主机需允许访问 MXDC 与字体源的 HTTPS。
除非以后把队列和资源存储迁移到共享基础设施，否则保持单实例：当前进程串行抓取，
用来限制浏览器内存占用。

环境变量：

- `AVATAR_MAX_QUEUE`：最多等待任务数，默认 `8`。
- `AVATAR_TTL_HOURS`：成功/失败资源保留时长，默认 `24` 小时。
- `AVATAR_OUTPUT_DIR`：持久化任务目录，默认 `.runtime/builds`。
- `MAPLE_AVATAR_CHROME`：可选 Chromium 可执行文件覆盖。
- `PORT`：监听端口，默认 `8788`。

服务不需要凭据，也不把凭据写进资源。网关仍应设置限流；日志不得记录私密令牌或完整
浏览器数据。当前 API 对用户保持无状态：任务过期后，使用原公开链接重新生成即可。

备案期间只把前端部署到 Vercel 提供的默认预览域名用于测试，不绑定或跳转
`miiiao.cn`。设备继续显示规划入口 `avatar.miiiao.cn`，并明确标注“备案中，稍后
开放”。生产 API 仍等待备案、DNS、TLS 与后端就绪后按同源方式部署。

## 测试

```bash
npm test
```

仓库级 `./tools/validate.sh --static` 也会运行这组测试。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
