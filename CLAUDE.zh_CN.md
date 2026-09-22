<p align="right">
  <strong>简体中文</strong> · <a href="CLAUDE.md">English</a>
</p>

# CLAUDE.md

本仓库的 AI 说明以 [`AGENTS.md`](./AGENTS.zh_CN.md) 为唯一权威源（single source of truth），Claude Code 请直接按 `AGENTS.md` 执行：项目结构、构建 / 验证命令、代码约定、提交规范等均在其中。

规则有更新时改 `AGENTS.md`，不要在本文件另起一套，以免两份文档 drift。

## 项目地图

<directory>
components/bsp/ - 稳定的 ESP32-C3 板级接口与驱动。
main/ - 固件组合根；`maple_avatar/` 负责导入角色 UI、动画状态与生成的显示资源。
tools/maple_avatar/ - 可复现的 MXDC 浏览器抓取、RGB565 转换与来源清单输出链路。
assets/ - 有授权的字体材料、保留的源图与抓取清单。
tests/ - 不依赖硬件的状态机与仓库测试。
docs/ - 开发、硬件、协作与发布的权威文档。
</directory>

<config>
README.md - 本 fork 的纯中文公开入口，包含构建入口与家族声明。
sdkconfig.defaults - ESP32-C3、8 MB Flash、USB console 与 LVGL 默认配置。
partitions.csv - NVS、PHY data 与单 factory 应用分区。
dependencies.lock - 锁定的 ESP-IDF managed-component 解析结果。
main/CMakeLists.txt - Maple Avatar 应用源码与嵌入资源清单。
</config>
