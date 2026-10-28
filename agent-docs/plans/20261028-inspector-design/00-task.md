# 任务：设计 mussel-inspector 组件

## 目标

为 Mussel 组件库设计新组件 `mussel-inspector`（属性检查器，Inspector）：可视化搭建/后台配置场景的标准化属性配置面板。本轮仅产出设计文档，不实施；设计经人工审核后再决定后续。

## 参考需求文档

- `ref-inspector.md`（源自 `/Users/scrollbar/Downloads/inspector.md`）：仅作需求参考，**不照搬**；API、UI 风格、代码惯例须遵循 mussel 现有约定，充分复用已有实现。

## 约束

- 探索范围：`form`、`mu-table` 及各输入组件用法；**不参考 canvas-table**。
- 遵循项目代码约定：纯 JavaScript、Composition API `<script setup>`、`Mu` 前缀 kebab-case 注册、BEM + `mu-` 前缀、颜色/间距/z-index 用 `--mu-*` 变量、组件目录 `src/components/<name>/`（xxx.vue + xxx.scss + index.js）经 `src/components/index.js` 统一注册。
- 无测试框架，通过 demo 页面验证组件行为（`demo/src/<name>/`，访问 `http://localhost:3000/<name>/`）。
- 不修改源码，不提交仓库。

## 验收标准（对设计文档）

1. 设计可直接用于独立实施与独立验证：改动清单、接口/数据结构、测试计划、实施步骤齐备且相互一致。
2. 设计中引用的现有组件、文件、符号真实存在，路径正确。
3. 覆盖需求文档核心功能：fields 扁平字段映射渲染（type → mussel 现有输入组件）、可选分组、值回显、change 事件（含合并后完整数据）、空状态、全局与字段级禁用、empty/header 插槽。
4. API 符合 mussel 组件惯例（命名、事件、插槽、props 风格与现有组件一致）。

## 验证命令

无（纯设计任务）。实施后的验证方式在设计文档「测试计划」中给出（demo 页面 + build）。

## 开关状态

- 流水线：design-review（交叉方式，临时组合执行）；本轮仅探索 + 设计 + 一轮交叉审改，不实施。
- 评审方式：交叉（design-amender）。
- 修订轮数：2（X 审改 1 次 + R 设计者回应 1 次；R 返回后即进检查点，不自动循环）。
- 并发数：1（全串行）。

## 角色映射

- explorer → `pipeline-explorer`
- designer → `pipeline-designer`（GLM-5.3）
- design-amender → `pipeline-design-amender`（deepseek-flash；与 designer 模型不同 ✓）
