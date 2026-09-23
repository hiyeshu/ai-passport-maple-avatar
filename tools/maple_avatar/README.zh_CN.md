<p align="right">
  <strong>简体中文</strong> · <a href="README.md">English</a>
</p>

# Maple Avatar 导入器

这个构建期工具把一个公开 MXDC 角色方案转换为保留的来源素材和一个可替换的
`avatar.pack`。浏览器抓取、来源解析、像素转换、角色包编译与文件写入彼此分离。
源页漂移、请求失败、Canvas 缺失、字体无效或资料不合法时会明确失败，不会回退到
示例或生成替代图。

## 环境

需要 Node.js 20 或更高版本与 Chromium 兼容浏览器：

```bash
cd tools/maple_avatar
npm ci
npx playwright install chromium
```

macOS 会自动发现已安装的 Google Chrome。`--browser PATH` 与
`MAPLE_AVATAR_CHROME` 可以覆盖自动发现。

## 导入

无参数命令专门用于复现仓库已确认的 5293 示例，并把角色包标记为社区示例：

```bash
npm run import
```

导入任意用户方案时必须显式选择服务器；家族可留空，因为源页面本身不提供：

```bash
npm run import -- \
  'https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1' \
  --server '绿水灵' \
  --family 'MiiiAo'
```

支持 `蓝蜗牛`、`蘑菇仔`、`绿水灵`、`漂漂猪`、`小白兔`。角色名、等级和
职业是从 `CHARACTER_BUILDER_CONFIG` 读取的不可修改来源事实；外部只补充服务器
和家族。

## 输出

- `assets/images/maple-avatar/build-<id>/` 保留源帧、240 x 246 设备帧、射手村
  背景、240 x 320 资料屏和制作入口屏、字体子集、预览图与 SHA-256 来源清单。
- `main/maple_avatar/generated/avatar.pack` 是唯一固件资源：两张 RGB565 屏幕、
  六组固定顺序的 RGB565A8 动作、带版本的尺寸、示例标记、build ID 与载荷 CRC32。
- CLI 和在线服务都调用 `lib/artifacts.mjs`，因此网页预览、下载和设备安装不会
  悄悄编译成不同像素。
- 只有一帧的动作使用零帧延迟，固件静态展示。

无需打开浏览器即可运行主机测试：

```bash
npm test
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
