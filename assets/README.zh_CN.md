<p align="right">
  <strong>简体中文</strong> · <a href="README.md">English</a>
</p>

# 资源目录（Assets）

本目录集中存放可复用的资源（字库、图片、音乐等），按资源类型分子目录管理。每个资源放在其类型对应的子目录，并记录放置路径、命名方式、集成方式与来源/许可。二进制资源（字体、图片、音频）不属于纯 markdown 文档，请勿与文档混放。涉及版权/授权的资源需注明来源与许可。

## 字库（fonts）

可复用的字库文件与生成的字库源码放在 `fonts/`。

- 命名要能反映字族、字重、字级与格式。
- 记录来源、许可、字符范围、转换命令与目标放置路径。
- 添加字库前评估 Flash 与内部 RAM 影响；ESP32-C3 无 PSRAM。
- 不提交许可不允许分发的字库。

`fonts/NotoSansSC-OFL.txt` 保留 Maple Avatar 导入器下载的 Noto Sans SC
Semibold 字体子集所适用的 SIL Open Font License 1.1 声明。每次抓取
保存的子集仅在构建期栅格化固定资料文字，ESP32 运行时不加载它。
完整 URL 与 SHA-256 记录在对应抓取的 `manifest.json` 中。

## 图片（images）

可复用的源图与生成的显示资产放在 `images/`。

- 使用描述性命名，并记录尺寸、像素格式、转换步骤与目标路径。
- 优先采用适合 240 × 320 RGB565 显示的格式，并纳入 Flash 与内部 RAM 考量。
- 许可允许时保留可编辑源文件，并记录来源与许可。
- 图片中不得包含设备二维码秘密、凭证或个人数据。

### Maple Avatar 抓取

`images/maple-avatar/build-5293/` 是公开
[MXDC 角色方案](https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1)
的可复现抓取。项目所有者已确认这些公共资源可直接用于本实现。
导入器保留真实 Canvas 输出与射手村背景，绝不替换为 AI 生成图或占位图。

- `henesys.png`：页面原始 493 x 272 背景图。
- `frames/`：页面原尺寸的 Canvas 完整合成帧。
- `device-preview/`：按身体原点对齐的 240 x 246 透明设备动作帧。
- `screen.png`：240 x 320 RGB 背景与冒险岛风格属性签/ID 家族铭牌。
- `builder-screen.png`：240 x 320 设备内替换示例说明，保留 `avatar.miiiao.cn` 并标注“备案中，稍后开放”。
- `preview.png`：用于视觉检查的默认帧合成图。
- `device-mockup.png`：3840 x 2160 README 展示效果图，把实际生成的
  `preview.png` 直接合成到用户提供的 AI Passport 机身原图屏幕区域；屏幕外
  像素保持不变，仅用于视觉说明，不参与固件构建或硬件验证。
- `manifest.json`：源 URL、方案修订、外观 ID、动作时序、分层路径、
  尺寸与 SHA-256 来源证据。
- `ui-font.ttf`：栅格化固定资料及“ID/家族”标签时使用的 Noto Sans SC 精确子集，
  采用 SIL Open Font License 1.1。

固件资源编译为一个带版本的 `main/maple_avatar/generated/avatar.pack`：
两张 RGB565 屏幕、六组固定顺序的 RGB565A8 动作与载荷 CRC32。使用
[Maple Avatar 导入器](../tools/maple_avatar/README.zh_CN.md)
可重现抓取；浏览器或源站失败会直接失败，不会产生替代图像。

## 音乐与音效（music）

可复用的音乐与音效源码放在 `music/`。

- 记录来源、许可、采样率、位深、声道、转换命令与目标路径。
- 与当前 BSP 音频路径匹配时优先采用 16 kHz、16 位单声道 PCM。
- 嵌入音频前评估 Flash 与内部 RAM 成本；长录音应流式或分块。
- 无再分发许可不提交媒体文件。
