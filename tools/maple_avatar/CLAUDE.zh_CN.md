<p align="right">
  <strong>简体中文</strong> · <a href="CLAUDE.md">English</a>
</p>

# `tools/maple_avatar/`

> L2 | 父级：[`../../CLAUDE.zh_CN.md`](../../CLAUDE.zh_CN.md)

本模块是抓取与编译边界。浏览器集成、来源校验、纯像素处理、二进制打包和仓库写入
彼此分离；CLI 与在线服务共用同一个资源编译器。

## 成员清单

| 成员 | 职责 |
| --- | --- |
| `CLAUDE.md` | 英文模块地图。 |
| `CLAUDE.zh_CN.md` | 简体中文模块地图。 |
| `README.md` | 英文环境、导入、失败与输出说明。 |
| `README.zh_CN.md` | 简体中文导入器说明。 |
| `import_avatar.mjs` | 抓取与仓库输出的本地 CLI 组合根。 |
| `package.json` | 锁定的 Playwright 依赖与 npm 命令。 |
| `package-lock.json` | 可复现的 npm 依赖图。 |
| `lib/artifacts.mjs` | CLI 与在线服务共用的不可变资源图。 |
| `lib/capture.mjs` | Playwright 适配、人体锚点对齐 Canvas 抓取、资料屏与制作入口屏。 |
| `lib/cli.mjs` | 纯参数解析、示例默认值与显式服务器边界。 |
| `lib/font.mjs` | Noto Sans SC 字体子集下载与校验。 |
| `lib/layout.mjs` | 纯角色铭牌几何、固定逻辑像素倍率与头部/身体/脚底锚点定位。 |
| `lib/output.mjs` | 原子写入来源资源与示例 `avatar.pack` 的仓库适配器。 |
| `lib/pack.mjs` | 确定性 schema-v1 角色包编译/解析与 CRC32 实现。 |
| `lib/pixels.mjs` | 纯 RGBA 到 RGB565/RGB565A8 转换。 |
| `lib/source.mjs` | MXDC URL 信任边界、服务器枚举、来源事实与显示容量校验。 |
| `test/artifacts.test.mjs` | 资源边界的纯净展示与包类型隔离测试。 |
| `test/cli.test.mjs` | CLI 默认值与参数边界测试。 |
| `test/font.test.mjs` | 字体请求与 CSS 解析测试。 |
| `test/layout.test.mjs` | 黄金比例、坐姿贴地、装饰外框与动作锚点回归测试。 |
| `test/pack.test.mjs` | 角色包确定性、偏移、格式与损坏测试。 |
| `test/pixels.test.mjs` | 二进制像素布局测试。 |
| `test/source.test.mjs` | 来源规范化与角色资料测试。 |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
