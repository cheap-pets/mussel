---
name: mussel-1to4
author: Scrollbar.W
date: 2026-11-08
description: >
  将 Mussel 1（`@mctech/mussel`，Vue 2.7；含仓库内置 libs/mussel UMD 副本）升级到 Mussel 4（`mussel` 4.x，Vue 3）时使用，
  如："从 Mussel 1 / @mctech/mussel 升级到 Mussel 4"、"Vue 2 站点迁移到新版 Mussel"。
  不含全站升级方案规划（属 mussel1-site-upgrade-planner skill）；Mussel 3 升级走 mussel3to4 skill。
---

# Mussel 1 → Mussel 4 升级 Skill

> **版本检查**：
v1 侧基于 Mussel 1 仓库 `1.9`（含 0.1.x 早期版本差异说明，见 `references/overview.md`）；
v4 侧基于 MUSSEL `4.3.*`（当前 `4.3.1`），最后核对日期 **2026-11-09**。
开始前确认项目 mussel 源版本（`@mctech/mussel` 0.1.x ~ 1.x）与目标版本（`mussel` 4.x）；
若组件库源码与本文档描述出现冲突，**以源码为准**，并按实际情况订正对应文件。

## 进入条件（需全部满足）

1. 用户明确表达"升级 / 迁移 / 从 Mussel 1（`@mctech/mussel`）改到 Mussel 4"；
2. 任务目标是改写既有页面/组件/工程，而非新增功能；
3. 源代码基于 Vue 2 + `@mctech/mussel`（`package.json` 可见，或代码出现 `mu-editor`/`mu-flex-box`/`new Vue(` 等痕迹）。

> Mussel 3（`mussel` 3.x，Vue 3）→ 4 的升级**不走本流程**，改用 mussel3to4 skill。
> v1→v4 是 Vue 2 → Vue 3 + 组件库双重换代，差异远大于 V3→V4，**不得**套用 mussel3to4 的规则。
> 不确定是否属升级任务时，先询问用户，不要凭代码痕迹自动启动升级流程。

## 工作流程

- 先读 `references/overview.md`（v1 版本档次判定、变化总览、组件去向速查表）。
- 分析 / 计划 / 执行**流程**：读 `references/process.md`（分析阶段需完整读）。
- 规则按需查 `references/rules.md`：
  1 框架迁移（Vue 2→3）→ 2 全局配置 → 3 CSS 变量与类 → 4 布局系统 → 5 图标 → 6 组件迁移 → 7 无对应与移除项 → 8 新增能力。
- 写 v4 目标代码时的完整组件 API 与样式 Token，查阅 mussel-ui skill 的 `../mussel-ui/references/components/*` 与 `../mussel-ui/references/styles.md`（参见 mussel-ui skill）。
