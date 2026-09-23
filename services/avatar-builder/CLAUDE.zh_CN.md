<p align="right">
  <strong>简体中文</strong> · <a href="CLAUDE.md">English</a>
</p>

# `services/avatar-builder/`

> L2 | 父级：[`../../CLAUDE.zh_CN.md`](../../CLAUDE.zh_CN.md)

本模块承载公开角色链接的异步构建边界：串行执行 Playwright、持久化明确任务状态并
提供不可变资源；抓取与二进制编译仍归 `tools/maple_avatar/`。

## 成员清单

| 成员 | 职责 |
| --- | --- |
| `CLAUDE.md` | 英文模块地图。 |
| `CLAUDE.zh_CN.md` | 简体中文模块地图。 |
| `README.md` | 英文 API、部署、存储与失败说明。 |
| `README.zh_CN.md` | 简体中文服务说明。 |
| `Dockerfile` | 锁定 Playwright、非 root 运行的 OCI 部署镜像。 |
| `compose.yaml` | 单 worker、持久卷、健康检查与本机端口部署。 |
| `package.json` | 服务启动与主机测试命令。 |
| `server.mjs` | 环境解析与真实抓取/编译组合根。 |
| `lib/service.mjs` | 请求校验、有界队列、状态持久化、TTL 清理与 HTTP 交付。 |
| `test/service.test.mjs` | 校验、生命周期、仅角色包清单、不可变文件与过期测试。 |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
