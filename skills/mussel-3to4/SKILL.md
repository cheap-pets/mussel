---
name: mussel-3to4
author: Scrollbar.W
date: 2026-11-08
description: >
  将 Mussel 3（`mussel` 3.x / `@mctech/mussel3`，Vue 3）升级到 Mussel 4 时使用，
  如："升级到 Mussel 4"、"迁移到新版 Mussel"、"把 V3 改成 V4"。
  不含 Mussel 1（Vue 2）站点升级（走 mussel1to4 skill）与全站升级方案规划。
---

# Mussel 3 → Mussel 4 升级 Skill

> **版本检查**：
v4 侧本文档及 `references/` 基于 MUSSEL `4.3.*`（当前 `4.3.1`），最后核对日期 **2026-11-08**。
开始前确认项目 mussel 源版本（3.x）与目标版本（4.x）；若组件库源码与本文档描述出现冲突，**以源码为准**，并按实际情况订正对应文件。

## 进入条件（需全部满足）

1. 用户明确表达"升级 / 迁移 / 把 V3 改成 V4"；
2. 任务目标是改写既有页面/组件，而非新增功能；
3. 目标源文件当前按 Mussel 3 编写（`package.json` 中 mussel < 4，或文件本身使用 `mu-editor`、`mu-box`、`theme:`、`mu-tree-view` 四类 V3 模式）。

> 不确定是否属升级任务时，先询问用户，不要凭代码痕迹自动启动升级流程。
> 默认 UI 任务（新建 / 修改 / Review V4 代码）走 mussel-ui skill；如复用了 V3 代码片段，直接用 V4 写法实现即可，不要触发升级流程。

## 工作流程

- 分析 / 计划 / 执行**流程**：读 `references/process.md`（分析阶段需完整读）。
- 执行阶段按处理类别跳转 `references/rules.md` 对应「迁移规则 N」按需查，不必整文件重读：
  1 全局配置 → 2 CSS 变量与 CSS 类 → 3 布局系统 → 4 图标 → 5 组件迁移 → 6 新增组件。
- 写 v4 目标代码时的完整组件 API 与样式 Token，查阅 mussel-ui skill 的 `../mussel-ui/references/components/*` 与 `../mussel-ui/references/styles.md`（参见 mussel-ui skill）。
