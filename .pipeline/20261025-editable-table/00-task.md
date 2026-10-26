# 任务：mussel 高性能可编辑表格方案设计（design-review 流水线）

## 目标

对比分析三个参考实现——stk-table-vue（`D:\workshop\github\stk-table-vue`）、kaka-grid-next（`D:\workshop\mctech\components\kaka-grid-next`）、mussel 自有的 table 与 canvas-table（前序任务已实施）——从性能、资源占用、可扩展性、开发方便程度四个维度，设计 mussel 中实现高性能可编辑表格的最佳方案，产出可独立实施的设计文档。本流水线不实施。

## 流水线与角色映射

- 流水线：design-review（前置探索 → 设计 → 独立评审 → 检查点）
- explorer → pipeline-explorer（注册副本校验通过，仅 frontmatter 差异）
- designer → pipeline-designer（注册副本校验通过，仅 frontmatter 差异）
- design-reviewer → pipeline-design-reviewer（注册副本校验通过，仅 frontmatter 差异）

## 约束（用户要求 0–5，逐条对应）

0. **先做技术选型**：先判断用 canvas 还是 DOM 绘制，给出决策依据（须基于三库对比与 mussel 现状，从性能/资源占用/可扩展性/开发便利四维度论证）。
1. **API 风格**：与现有 mussel table（`src/components/table/`）一致——props/events/方法风格、`Mu` 前缀 kebab-case 注册。
2. **绘制与性能**：样式风格参考现有 mussel table；充分考虑性能，虚拟滚动，禁止一次绘制全部表格行。
3. **列定义**：参考现有 mussel table；列头支持拖拽调整尺寸、排序。
4. **编辑**：表格级与列级均可定义只读/可编辑；单元格编辑使用 mussel 现有输入组件（可做适配层，不可完全新写一套）。
5. **canvas 路线决策**：若选 canvas，须明确"从现有 canvas-table 优化"还是"彻底重构"，并给出依据。
6. 项目代码约定：纯 JavaScript（无 TypeScript）、Vue 3 Composition API `<script setup>`、BEM（`mu-` 前缀）、颜色/间距/z-index 一律 `--mu-*` 变量（含暗色模式）、构建 UMD、Vue 为外部依赖。

## 验收标准（设计文档须可据此逐条核对）

- [ ] 给出 canvas vs DOM 的选型决策，含三库对比结论（性能/资源占用/可扩展性/开发便利四维）与 mussel 现状评估，论证充分且结论明确。
- [ ] 若选 canvas：明确"优化现有 canvas-table"或"彻底重构"决策，含现有实现能力盘点与差距分析；若选 DOM：说明与现有 table 组件的关系（改造/新建）。
- [ ] 给出完整组件 API（props / events / 方法 / 插槽策略），逐项与现有 mussel table 的对应 API 对照。
- [ ] 给出渲染架构与虚拟滚动设计：可视区窗口计算、滚动事件处理、按需重绘范围；明确禁止一次绘制全部行。
- [ ] 给出列定义结构（列宽、排序、调宽、可编辑等字段）及与现有 mussel table 列定义的映射与差异。
- [ ] 给出列头拖拽调宽与排序交互设计。
- [ ] 给出单元格编辑设计：复用 mussel 现有输入组件的适配层（定位、生命周期、数据流、校验、提交/取消），表格级/列级只读控制。
- [ ] 给出样式方案：`--mu-*` 变量取值方式（含暗色模式）、视觉规格与现有 table 对齐。
- [ ] 给出文件结构与模块划分。
- [ ] 明确范围边界：本期不支持的能力逐条列出。

## 开关状态

- 修订轮数：2（用户确认）
- 设计复核：off（默认）
- 并发数：3 → 1（探索波遇模型限流，2/3 成功；重派失败项）

## 输入

- 前序任务产物（只读参考，判断可复用性时先核对与当前工作区现状的一致性）：
  - `.pipeline/20261023-canvas-table/01-explore.md` — 旧探索报告（kaka-grid-next canvas 能力 + mussel 现有 table）
  - `.pipeline/20261023-canvas-table/02-design.md` — 旧 canvas-table 设计文档
  - `.pipeline/20261023-canvas-table/05-verify-2.md` — 实施验证 PASS 记录
- 新探索报告：`01-explore-stk.md` / `01-explore-kaka.md` / `01-explore-mussel.md`
- 设计文档：`02-design.md`
- 评审记录：`03-review-N.md`

## 探索范围（3 个 explorer 并发，范围互不重叠）

- ① stk-table-vue（`D:\workshop\github\stk-table-vue`）：渲染方式（canvas/DOM/混合）与架构分层、虚拟滚动实现、列定义与 API 风格、列头交互（调宽/排序）、单元格编辑机制与编辑器实现、性能优化手段、资源占用特征、可扩展性（自定义渲染/插槽）、代码量与依赖。
- ② kaka-grid-next（`D:\workshop\mctech\components\kaka-grid-next`）：同上维度。旧探索报告 `01-explore.md` 已覆盖部分 canvas 绘制能力，本报告侧重补齐对比维度（性能策略细节、编辑机制、API 设计、可扩展性、依赖与体积）。
- ③ mussel 现状（`D:\workshop\cheap-pets\mussel`）：`src/components/table/`（API 风格、列定义、排序/调宽能力、样式规格）；`src/components/canvas-table/`（已实施 canvas 表格的实现现状：模块划分、各文件职责与体量、已实现能力、编辑机制、已知局限——对照旧设计文档与验证记录）；mussel 输入组件清单（可复用为编辑器的组件及其 props/事件接口）；相关 demo（`demo/src/data/canvas-table/`、`demo/src/data/canvas-table-editable/`）。

## 验证命令 / 环境

- 验证命令：
  - `npm run build`（库构建，全流程仅 S1 单次执行）
  - `npx stylelint src/components/canvas-table/*.scss src/styles/link.scss --fix`（样式风格；先 --fix）
  - demo 页自检面板（9 组断言）+ playwright DOM/像素断言（按 `02-design.md` 测试计划全表）
- 验证环境（取自 AGENTS.md 与前序任务实践）：
  - demo 站点：`npm run demo:build`（rollup watch 模式，含 :3000 静态服务）；页面 `http://localhost:3000/data/canvas-table/` 与 `http://localhost:3000/data/canvas-table-editable/`
  - 浏览器手段：playwright mcp，先直接访问；DOM/可访问性快照断言优先；canvas 像素用 `browser_evaluate` getImageData；坐标级交互用 `browser_run_code_unsafe` 的 `page.mouse` 系列 + demo 暴露的坐标辅助（getCellRect）
  - 无测试框架，无额外测试数据准备（demo 页自带数据生成器）

## 实施约束（03-review-7 未决项并入，评审建议口径）

1. painter 读行集合用 `state.displayRows ?? state.records` 缺省回退（G2 中间态壳未组装 displayRows 时行为不变）；G2 判据按此口径。
2. G1-a 自检夹具不依赖 `prepareColumn` 扩展（手写 `_maxLines`/`_resolveMaxLines`/`_maxItems` 字段），或把依赖闭包的断言移至 G2 自检。
3. 树箭头槽命中 cellX 统一为内容区相对口径（列缘偏移再减 padding），A4.3 用 hit.cellX；自检/测试点击坐标 = `getCellRect().x + padding + level×16 + 8`（箭头中心），补"箭头右半可 toggle"断言。
4. **maxLines 溢出末行字符统一 `'...'`（三个半角点，用户原文），不采用 `'…'`（U+2026）**；设计文档中 '…' 口径按此改（maxItems dots 本就是 `'...'`）。
5. textarea 编辑器样式保证编辑/非编辑文本左缘一致（`padding-left: 0` 或按 `padding − 1 − 边框` 反算）；test #7 补 textarea 文本左缘断言。
6. 树形列行高 contentWidth = 列宽 − 2×padding − (16×level + 16)。
7. link disabled 判定用存在性（`attrs.disabled != null && attrs.disabled !== false`），绘制取色与命中/发事件两处一致。
8. self-checks 文件计数按实际（6 个断言文件 + index.js）。
9. defaultExpandLevel 解析时机：首次入场解析 + treeProps 变化 / tree 关闭→开启首开重解析。
10. A2.2 契约⑤接入点表述："themeWatcher 通知 → 组件壳 onChange 处理器（relayout 前）"，theme.js 仅发信号。
11. G2 判据中"DOM 版 mu-table 参照段 link 对象数组渲染正常"移至 G3 判据（main-view.vue 夹具在 G3 落地）。

## git 基线（impl-verify 启动时）

- 分支 mussel-table，HEAD `04e157d`。工作区含前序 canvas-table 任务未提交实施产物（`src/components/canvas-table/`、`src/components/index.js`、`demo/src/catalog.js`、`demo/src/data/canvas-table*`、`.gitignore`）——为本设计的研究对象与演进基础，按任务内现状处理，不提交/暂存；`.pipeline/` 未跟踪。
