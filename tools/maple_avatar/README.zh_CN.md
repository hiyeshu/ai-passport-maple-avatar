<p align="right">
  <strong>简体中文</strong> · <a href="README.md">English</a>
</p>

# Maple Avatar 导入器

这个构建期工具把公开 MXDC 角色方案的真实素材导入 AI Passport 固件。
浏览器抓取、源数据解析、像素转换与文件输出分成独立模块。源页结构漂移、
请求失败、Canvas 缺失、字体无效或服务器不支持时，导入会给出明确错误并停止；
工具绝不生成替代图。

## 环境

需要 Node.js 20 或更高版本与 Chromium 兼容浏览器。macOS 上存在 Google Chrome
时会直接使用。其它系统或未安装系统浏览器时，安装依赖后再下载锁定的
Playwright 浏览器。

```bash
cd tools/maple_avatar
npm ci
npx playwright install chromium
```

`--browser PATH` 与 `MAPLE_AVATAR_CHROME` 环境变量会覆盖自动发现。已提供兼容
可执行文件时，不需要下载 Playwright 浏览器。

## 导入

默认使用已确认的 5293 方案链接：

```bash
npm run import
npm run import -- 'https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1'
```

可选覆盖项保持最小：

```bash
npm run import -- 5293 --server '绿水灵' --family 'MiiiAo'
```

支持的服务器是 `蓝蜗牛`、`蘑菇仔`、`绿水灵`、`漂漂猪`、`小白兔`。导入器会把所有
可接受 URL 规范化为只读模式，读取 `CHARACTER_BUILDER_CONFIG`，选中射手村背景，
监听每个同源分层响应，并抓取唯一的 Canvas 完整合成帧。
每个响应中的真实 `map` 与 `origin` 坐标用于还原动作画布边界和身体锚点；若页面
画布与计算结果不一致，导入会明确失败。

固定资料区采用适配小屏的冒险岛角色铭牌语言：服务器、等级、职业分别使用
莓红、琥珀、冷蓝属性签，ID（角色名）与家族各占蓝色铭牌的一半。背景不铺整块遮罩，
只由属性签和铭牌自身保证可读性。角色名、家族各预留
6 个字符，等级支持到 `LV.999`，职业支持 5 个字符，服务器来自固定枚举。
超出容量会明确终止导入，不会无限缩小文字；布局也不使用空格模拟对齐。

## 输出

- `assets/images/maple-avatar/build-<id>/` 保留源 PNG、设备预览、字体子集、
  视觉合成图与 `manifest.json` 来源清单。
- `main/maple_avatar/generated/` 包含一张 240 x 320 RGB565 屏幕图、
  240 x 246 RGB565A8 场景动作帧、生成的 LVGL 描述符与 CMake 清单。所有动作统一
  使用站立 Canvas 高度作为像素倍率基准；攻击画布只扩展横向范围，不再缩小
  人物。站立动作先确定设备空间中的身体锚点，后续动作把真实来源身体原点映射到
  同一个位置，不再按不对称的整张 Canvas 居中。透明动作层覆盖完整 246 px 场景，
  保留攻击锚点下方的像素；站立人物的不透明视觉中心位于场景区的 61.8% 高度，
  脚底落在 232 px 的草坪表面线。
- 固定中文角色资料与铭牌 UI 在构建期栅格化进屏幕图，因此固件运行时不需要分配大型中文字库。
- 某动作只有一张唯一帧时，帧延迟为零，固件状态机会静态展示。

无需下载浏览器即可运行导入器主机测试：

```bash
npm test
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
