<p align="right">
  <strong>简体中文</strong> · <a href="CLAUDE.md">English</a>
</p>

# `main/maple_avatar/`

> L2 | 父级：[`../../CLAUDE.zh_CN.md`](../../CLAUDE.zh_CN.md)

本模块是通用运行时播放器：校验并映射一个可替换角色包，展示六个动作与制作入口页，
同时保持导航逻辑不依赖 LVGL。

## 成员清单

| 成员 | 职责 |
| --- | --- |
| `CLAUDE.md` | 英文模块地图。 |
| `CLAUDE.zh_CN.md` | 简体中文模块地图。 |
| `maple_avatar_app.c` | 六动作、制作/恢复页、示例角标和电量角标的 LVGL 展示层。 |
| `maple_avatar_app.h` | 展示 API 与标准化按键命令。 |
| `maple_avatar_assets.c` | 校验、映射 avatar 分区并提供 LVGL 运行时描述符的存储适配器。 |
| `maple_avatar_assets.h` | 稳定资源尺寸与运行时查询接口。 |
| `maple_avatar_pack_format.c` | 纯 schema-v1 解析、边界检查与 CRC32 校验。 |
| `maple_avatar_pack_format.h` | 主机测试共用的二进制常量、解析视图与状态 API。 |
| `maple_avatar_state.c` | 纯七页面导航、动画与暂停转移。 |
| `maple_avatar_state.h` | 固件和主机测试共用的状态机值与函数。 |
| `generated/avatar.pack` | 可复现、注入社区完整镜像的示例角色包。 |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
