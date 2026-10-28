# 任务：canvas-table 优化

## 目标

1. 列定义调整（`src/components/canvas-table/`）：
   - 移除 enum 列类型。
   - 文本（text）、数值（number）列支持 `mappings` 或 `options` 定义：
     - `mappings`：单元格显示内容映射，优先于 `options`。
     - `options`：编辑状态的下拉选项，格式参见 mu-select 的 options 属性（`src/components/select/`）。
     - 仅定义 `options` 时，内部转换为映射表，同时用作单元格显示内容映射。
2. 性能优化。
3. 代码可读性优化，降低复杂度。
4. 注释精简：简化函数说明，仅解释关键变量与复杂算法，每段注释 ≤ 3 行。

## 约束

- 纯 JavaScript、Vue 3 Composition API；沿用现有代码风格（BEM、`--mu-*` 变量）；不新增依赖。
- enum 直接移除，不做兼容层；demo 页如有 enum 用法同步改写为 mappings/options。
- 不更新 docs / docs-site / skills 文档（用户确认前）。

## 验收标准

1. canvas-table 源码中无 enum 类型处理逻辑。
2. text / number 列：`mappings` 显示映射生效且优先；`options` 作为编辑下拉选项生效；仅定义 `options` 时单元格显示按其转换的映射。
3. `npm run build` 通过。
4. demo 页 `http://localhost:3000/canvas-table/` 渲染正常：映射列显示映射值；可编辑下拉列编辑态正常。
5. 性能优化点在设计文档中列明度量方式；实施后按该方式复核，无回退。
6. 改动代码注释每段 ≤ 3 行；复杂度重构点在设计文档有说明。

## 验证命令

- `npm run build`
- demo：`http://localhost:3000/canvas-table/`（3000 端口 watch 服务通常已在运行，先直接访问，不重复打包）
- 验证方法参考：`agent-docs/knowledge/project/canvas-table-performance-profiling.md`、`canvas-table-demo-interaction-verify.md`、`canvas-pixel-assert-anchor-drift.md`

## 基线

- 分支 mussel-table，工作区 clean（2026-10-28，HEAD 7113e14）。
- canvas-table 约 8000 行：canvas-table.vue 1342 / cell-painters.js 1307 / painter.js 1300 / editor.js 831 / interactions.js 482 / layout.js 481 / row-geometry.js 493 / row-geometry-controller.js 399 / theme.js 356 / tree.js 253 / text-wrap.js 296 / use-tree-rows.js 231 / use-column-resize.js 136 / constants.js 48。
- demo 页：`demo/src/data/canvas-table/`。

## 验证环境

- 无测试框架；构建 + demo 页验证。
- 浏览器验证优先 playwright mcp；不可用时以 build + 代码检查兜底并在报告中注明，相关标准标 UNVERIFIED（环境豁免由调度者裁定）。
- [2026-10-28 调度者确认] 本环境（主会话与子智能体）无 playwright mcp 工具；3000 端口服务未运行。需浏览器的验收标准（4、5 及测试计划中浏览器手段项）按"环境豁免"处理：判 UNVERIFIED + 需人工，不因此判 FAIL；可自动化部分（build、静态检查、服务可起则 HTTP 检查）须全部执行。

## 流水线与角色

- 流水线：自定义——design → amender → design 复审 → impl → verify；FAIL 最多再 2 轮 impl+verify，耗尽即停、汇报用户。
- design → pipeline-designer；amender → pipeline-design-amender；impl → pipeline-implementer；verify → pipeline-verifier。
- 无独立探索阶段，设计者自行从源码提取约定并注明。

## 开关状态

- 并发数 1（全串行）。
- impl+verify 循环上限：额外 2 轮（用户指定）。
