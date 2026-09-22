# AI Passport Maple Avatar

把公开的冒险岛角色方案导入 FoloToy AI Passport，在 240 × 320 屏幕上展示真实纸娃娃动画、射手村背景与角色铭牌。

## 适配硬件

本项目面向开源可穿戴设备 [FoloToy AI Passport](https://github.com/FoloToy/ai-passport) 开发。

![AI Passport Maple Avatar 整机效果示意](assets/images/maple-avatar/build-5293/device-mockup.png)

> 上图为整机效果示意：机身保留用户提供的硬件原图，只替换正面屏幕区域；屏幕内容来自本项目实际生成的 240 × 320 UI，最终显示效果以设备实机为准。

## 当前角色

![蓝莓呀纸娃娃预览](assets/images/maple-avatar/build-5293/preview.png)

- 素材来源：[MXDC 公开角色方案 5293](https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1)
- 角色资料：绿水灵 · LV.30 · 冰雷法师 · 蓝莓呀 · MiiiAo
- 默认背景：射手村
- 动作：站立、行走、攻击、坐下、双手持武器站立、双手持武器行走

导入器通过 Playwright 读取页面的 `CHARACTER_BUILDER_CONFIG`，抓取真实 Canvas 动画帧与背景，再转换为 ESP32 可直接读取的 RGB565 / RGB565A8 资源。抓取失败会明确终止，不生成替代角色图。

## 制作自己的角色

1. 打开[冒险小册子角色构建器](https://mxdc.dvg.cn/tools/character-builder/)，点击“新建角色”。
2. 搭配角色外观与装备，填写角色名称，选择职业并填写等级。
3. 保存方案后点击“分享链接”，复制包含 `build` 编号的角色链接。
4. 区服与家族不在角色构建器中设置，而是在导入时通过 `--server` 和 `--family` 填写：

```bash
cd tools/maple_avatar
npm run import -- \
  'https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1' \
  --server '绿水灵' \
  --family 'MiiiAo'
```

区服支持：`蓝蜗牛`、`蘑菇仔`、`绿水灵`、`漂漂猪`、`小白兔`。角色名与家族最多各 6 个字符，等级最高为 999，职业最多 5 个字符。

## 交互与界面

- 动画默认播放；只有一帧的动作自动静态展示。
- 上 / 下键切换动作，OK 键暂停或继续动画。
- 电量可读取时显示，无法读取时自然隐藏。
- 服务器、等级、职业使用莓红、琥珀、冷蓝属性签；ID（角色名）与家族各占蓝色铭牌的一半。
- 角色名与家族各预留 6 个字符，等级支持到 `LV.999`，职业支持 5 个字符。
- 人物位于场景的黄金比例视觉中心，脚底落在草坪表面。

## 开发与验证

导入素材需要 Node.js 20 或更高版本，以及 Chromium 兼容浏览器：

```bash
cd tools/maple_avatar
npm ci
npm run import
```

固件使用 ESP-IDF 5.5.3。完成环境激活后，在仓库根目录运行：

```bash
./tools/validate.sh
```

该命令会执行仓库静态检查、主机测试、ESP-IDF 固件构建与合并固件校验。更完整的抓取、转换和来源说明见 [Maple Avatar 导入器](tools/maple_avatar/README.zh_CN.md) 与 [资源清单](assets/README.zh_CN.md)。

## 来源与许可

本项目基于 [FoloToy 官方 ai-passport 仓库](https://github.com/FoloToy/ai-passport)开发。代码沿用仓库的 MIT License；字体与角色素材的来源、哈希和许可信息记录在对应的 [`manifest.json`](assets/images/maple-avatar/build-5293/manifest.json) 与资源说明中。

## 致谢

感谢 [冒险小册子](https://mxdc.dvg.cn/) 提供纸娃娃工具。

## 家族声明

MiiiAo是从 冒险岛世界Artale亚服 迁移至 冒险岛怀旧服绿水灵 的原生家族，家族名称为原创。

现绿水灵出现近似名家族【MiiAo】并非我们分会，双方无任何从属关系，本家族不开设分会。

如MiiAo家族后续发生纠纷、抢图、行骗等各类负面事件，均与MiiiAo家族及全体成员无关，请大家注意区分，避免误会。
