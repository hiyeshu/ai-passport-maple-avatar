<p align="right">
  <strong>简体中文</strong> · <a href="firmware-layout.md">English</a>
</p>

# 固件布局

本产品 fork 面向带 8 MB Flash 的 ESP32-C3。应用代码与可替换角色内容分别放在
独立分区中，因此社区用户只需安装一次固件，之后只更换自己的角色。

## 产品布局

| 分区 | 类型/子类型 | 偏移 | 大小 | 用途 |
| --- | --- | ---: | ---: | --- |
| `nvs` | data/NVS | `0x9000` | `0x6000` | ESP-IDF 与应用键值存储 |
| `phy_init` | data/PHY | `0xF000` | `0x1000` | PHY 初始化数据 |
| `factory` | app/factory | `0x10000` | `0x300000` | 通用 Maple Avatar 应用 |
| `avatar` | data/`0x40` | `0x310000` | `0x4F0000` | 一个可替换、带 CRC 校验的 `avatar.pack` |

该布局没有 OTA 槽。`avatar.pack` schema version 1 包含两张 240 x 320 RGB565
屏幕和六组固定顺序的 240 x 246 RGB565A8 动作。格式版本、尺寸、资源偏移、总长度
或 CRC 不合法时，固件会拒绝整个包，不渲染残缺数据。

`avatar` 偏移是 `partitions.csv`、固件校验器与网页专用角色写入器共同遵守的兼容
契约。若未同时更新并发布三者，不得移动或调整该分区。

## 两条安装路径

### 首次安装社区固件

`./tools/validate.sh --firmware` 构建通用应用、生成
`build/FoloToy-AI-Passport-full.bin`，注入可复现的
`main/maple_avatar/generated/avatar.pack` 示例，并校验最终字节。完整镜像从
`0x0` 写入并建立所需分区表，适用于首次安装或有意完整刷新。

### 更换个人角色

在线制作服务只返回校验过的 `avatar.pack`。网页专用写入器再次校验 magic、schema、
总长度、CRC 与 build ID，然后使用唯一的写入目标：

```json
{"path":"avatar.pack","offset":3211264,"eraseAll":false}
```

十进制偏移对应 `0x310000`。写入器不提供全盘擦除入口；浏览器只写 `avatar` 分区，
不替换应用、分区表、NVS 或 PHY。只有设备已经安装采用本布局的社区固件时，这条路径
才兼容。

## 强制验证

```bash
./tools/validate.sh --firmware
```

脚本在隔离目录中构建并合并镜像，从 `flash_args` 读取真实偏移，校验分区表 MD5、
边界、标签与不重叠，检查应用容量，注入示例角色包，并在配置的 avatar 偏移做逐字节
比对。

## 烧录与已存数据

> **烧录新固件前，无需备份设备内原有固件。** 本流程不保留自动回滚副本，也不承诺
> 可以恢复原固件。

从 `0x0` 写入的完整镜像会填充各组件间空隙，可能重置 NVS 与 PHY 区域；仅用于
首次安装或明确的完整刷新。日常开发若要保留 NVS，应使用分区兼容的
`idf.py flash` 分段目标。`idf.py erase-flash` 会擦除全部用户数据，不得作为常规
前置步骤。

个人角色更新只写 `0x310000`，但断电、断连、旧固件不兼容或浏览器/驱动失败仍可能
留下无效角色包。此时应用会显示恢复页面；重新连接并安装有效个人包，或重新安装已验证
的完整镜像即可。
