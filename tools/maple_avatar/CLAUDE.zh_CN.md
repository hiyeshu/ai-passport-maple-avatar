<p align="right">
  <strong>简体中文</strong> · <a href="CLAUDE.md">English</a>
</p>

# `tools/maple_avatar/`

> L2 | 父级：[`../../CLAUDE.zh_CN.md`](../../CLAUDE.zh_CN.md)

本模块是构建期导入边界。DOM 选择器留在抓取模块，二进制转换保持纯逻辑，
输出模块只写入方案范围的来源资源与固件生成目录。

## 成员清单

| 成员 | 职责 |
| --- | --- |
| `CLAUDE.md` | 英文模块地图。 |
| `CLAUDE.zh_CN.md` | 简体中文模块地图。 |
| `README.md` | 英文环境、导入、失败与输出说明。 |
| `README.zh_CN.md` | 简体中文导入器说明。 |
| `import_avatar.mjs` | 组合抓取与输出的 CLI 根。 |
| `package.json` | 锁定的 Playwright 依赖与 npm 命令。 |
| `package-lock.json` | 可复现的 npm 依赖图。 |
| `lib/capture.mjs` | Playwright DOM 适配、Canvas 帧抓取与角色铭牌屏幕合成。 |
| `lib/cli.mjs` | 纯参数解析与帮助文本。 |
| `lib/font.mjs` | Noto Sans SC TrueType 子集下载与校验。 |
| `lib/output.mjs` | 原子写入来源资源与生成固件。 |
| `lib/pixels.mjs` | 纯 RGBA 到 RGB565/RGB565A8 转换。 |
| `lib/source.mjs` | URL 信任边界、服务器枚举、资料兜底与显示容量校验。 |
| `test/cli.test.mjs` | CLI 参数边界测试。 |
| `test/font.test.mjs` | 字体请求与 CSS 解析测试。 |
| `test/layout.test.mjs` | 人物黄金比例几何与地面贴合测试。 |
| `test/output.test.mjs` | ESP-IDF 嵌入文件符号回归测试。 |
| `test/pixels.test.mjs` | 二进制像素布局测试。 |
| `test/source.test.mjs` | 源地址规范化与角色资料测试。 |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
