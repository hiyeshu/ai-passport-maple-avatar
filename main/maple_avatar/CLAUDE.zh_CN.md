<p align="right">
  <strong>简体中文</strong> · <a href="CLAUDE.md">English</a>
</p>

# `main/maple_avatar/`

> L2 | 父级：[`../../CLAUDE.zh_CN.md`](../../CLAUDE.zh_CN.md)

本模块负责产品 UI 与动画领域。手写代码只依赖稳定资源契约；导入器以一个构建范围
原子替换 `generated/` 全部内容。

## 成员清单

| 成员 | 职责 |
| --- | --- |
| `CLAUDE.md` | 英文模块地图。 |
| `CLAUDE.zh_CN.md` | 简体中文模块地图。 |
| `maple_avatar_app.c` | LVGL 屏幕、动画计时器、可选电量角标与标准化命令处理。 |
| `maple_avatar_app.h` | 展示层 API 与命令枚举。 |
| `maple_avatar_assets.h` | 稳定类型、全宽统一像素倍率与身体原点对齐的帧尺寸、生成数据声明。 |
| `maple_avatar_state.c` | 纯六动作动画转移与时序。 |
| `maple_avatar_state.h` | 固件与主机测试共用的状态机值与函数。 |
| `generated/assets.cmake` | 生成的嵌入文件清单。 |
| `generated/avatar_generated.c` | 生成的 LVGL 描述符、动作表与角色资料。 |
| `generated/screen.rgb565` | 生成的 240 x 320 背景与资料区。 |
| `generated/stand-00.rgb565a8` | 生成的站立帧 0。 |
| `generated/stand-01.rgb565a8` | 生成的站立帧 1。 |
| `generated/stand-02.rgb565a8` | 生成的站立帧 2。 |
| `generated/walk-00.rgb565a8` | 生成的行走帧 0。 |
| `generated/walk-01.rgb565a8` | 生成的行走帧 1。 |
| `generated/walk-02.rgb565a8` | 生成的行走帧 2。 |
| `generated/walk-03.rgb565a8` | 生成的行走帧 3。 |
| `generated/attack-00.rgb565a8` | 生成的攻击帧 0。 |
| `generated/attack-01.rgb565a8` | 生成的攻击帧 1。 |
| `generated/attack-02.rgb565a8` | 生成的攻击帧 2。 |
| `generated/sit-00.rgb565a8` | 生成的静态坐下帧。 |
| `generated/two_hand_stand-00.rgb565a8` | 生成的双手持武器站立帧 0。 |
| `generated/two_hand_stand-01.rgb565a8` | 生成的双手持武器站立帧 1。 |
| `generated/two_hand_stand-02.rgb565a8` | 生成的双手持武器站立帧 2。 |
| `generated/two_hand_walk-00.rgb565a8` | 生成的双手持武器行走帧 0。 |
| `generated/two_hand_walk-01.rgb565a8` | 生成的双手持武器行走帧 1。 |
| `generated/two_hand_walk-02.rgb565a8` | 生成的双手持武器行走帧 2。 |
| `generated/two_hand_walk-03.rgb565a8` | 生成的双手持武器行走帧 3。 |

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
