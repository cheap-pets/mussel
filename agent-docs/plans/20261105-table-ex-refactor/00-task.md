# 任务：table-ex 代码结构拆分（dev-pipeline，用户指定流水线）

## 目标
重构 `src/components/table/ex/`：将大文件按功能关注点拆分为小文件。
拆分目标：agent 做特定功能优化（如某类列的编辑功能优化）时，能更少/更快读取代码。

## 现状（行数，wc -l @ e3c55ea）
| 文件 | 行数 |
|---|---|
| cell-painters.js | 1756 |
| table-ex.vue | 1633 |
| painter.js | 1449 |
| spans.js | 716 |
| editor.js | 567 |
| row-geometry.js | 509 |
| interactions.js | 508 |
其余文件均 ≤500 行；`column-types/` 已按列类型分文件（最大 155 行），不在拆分范围。

## 约束
- 纯重构：行为、公开 API、组件注册名、样式表现均不变
- 拆分后 `src/components/table/ex/` 内每个文件 ≤500 行
- 遵循项目代码约定（根 AGENTS.md：纯 JS、Composition API、BEM、`--mu-*` 变量、就近 import）
- 覆盖样式拆分注意：同特异性覆盖规则须随被覆盖选择器同文件置尾（knowledge: css-split-equal-specificity-order）
- 完成后由实施角色提交一次 commit（格式 `🔨: <描述>`，subject ≤80 字符）
- 后续将新增「单元格选中/复制/键盘导航」功能（另行设计），拆分分组可为其预留合理归属，但本任务不实现

## 验收标准
1. `src/components/table/ex/` 下所有源码文件 ≤500 行（wc -l 复核）
2. 冒烟：库构建无报错；demo 页 `http://localhost:3000/data/table-ex/` 正常渲染、无控制台错误，滚动/编辑入口等基本交互正常
3. 详细检查不在本流水线内（用户留待下个流水线）

## 验证命令 / 环境
- 行数：`wc -l src/components/table/ex/*`
- 构建：`npm run build`；demo 站点：本机 3000 端口（watch 模式可能已在运行；未运行则 `npm run demo:build`）
- 子 agent 无 playwright mcp：DOM/console 断言用 headless Edge（knowledge: project/headless-edge-dom-verification.md）

## 项目知识（先读 agent-docs/knowledge/INDEX.md，按需读条目，命中即采用）
- 重构安全网：project/table-ex-refactor-frozen-probe.md（行为快照冻结基线，逐字比对；探针交付前删除）
- 样式拆分：project/css-split-equal-specificity-order.md
- demo 验证：project/table-ex-demo-interaction-verify.md、project/demo-page-url-data-prefix.md

## 流水线与槽位（用户指定）
primary 设计拆分方式 → peer 修订 → fast 实施 + 检验（简单冒烟，详细检查留给下个流水线）
- designer → pipeline-primary；design-amender → pipeline-peer；implementer / verifier → pipeline-fast
- 评审模型：异构；验证：独立实例
- 未指定开关按 standard（修复轮 R=2）；用户流水线未含确认门 → 设计过审即实施

## 预算
- 派发 d ≤ 6（预估 4：设计 1 + 修订 1 + 实施 1 + 冒烟 1）
- 修复轮「整体」k ≤ 2；peer OBJECT、或修复轮耗尽 → 停下问用户

## 基线
git e3c55ea (dev)，`git status --short`：clean（2026-11-05 建目录时快照）
