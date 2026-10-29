# 任务：mussel table-ex 组件设计（design-review 流水线）

## 目标

为 mussel 组件库设计新组件 table-ex（canvas 绘制的高性能表格），产出可独立实施、独立验证的设计文档。本流水线不实施。

## 流水线与角色映射

- 流水线：design-review（前置探索）→ impl-verify（实施 + 验证）
- explorer → pipeline-explorer（注册副本校验通过）
- designer → pipeline-designer（注册副本校验通过）
- design-reviewer → pipeline-design-reviewer（注册副本校验通过）
- implementer → pipeline-implementer（注册副本校验通过）
- verifier → pipeline-verifier（注册副本校验通过）

## 约束

1. API 风格与现有 mussel table（`src/components/table/`）一致：`Mu` 前缀 kebab-case 注册、props/events/slots/方法风格对齐现有组件。
2. 表格主体用 canvas 绘制，视觉样式参考现有 mussel table；颜色/间距/z-index 一律取 `--mu-*` 变量（含暗色模式 `.mu-root.mu-dark`），禁硬编码。
3. 性能：参考 kaka-grid-next（`D:\workshop\mctech\components\kaka-grid-next`）的虚拟滚动与绘制方式，仅绘制可视区行，禁止一次绘制全部行。
4. 列定义参考现有 mussel table；列头支持拖拽调整列宽、排序。
5. 表格级与列级均可定义只读/可编辑；单元格编辑复用 mussel 现有输入组件（如 input/select 等），可做适配层，不可新写一套输入组件。
6. 项目代码约定：纯 JavaScript（无 TypeScript）、Vue 3 Composition API `<script setup>`、BEM（`mu-table-ex__*`）、构建 UMD、Vue 为外部依赖。

## 验收标准（设计文档须可据此逐条核对）

- [ ] 给出完整组件 API（props / events / 方法 / 插槽策略），逐项与现有 mussel table 的对应 API 列出对照。
- [ ] 给出 canvas 渲染架构：图层划分（表头/表体/固定列等）、canvas 与 DOM 的职责边界、DPR 适配与尺寸响应。
- [ ] 给出虚拟滚动设计：可视区窗口计算、滚动事件处理（rAF/节流策略）、按需重绘范围（何时只需重绘某层/某区域）。
- [ ] 给出列定义结构（含列宽、排序、调宽、可编辑等字段），并说明与现有 mussel table 列定义的映射与差异。
- [ ] 给出列头拖拽调宽与排序交互设计：命中检测、光标反馈、事件序列、与排序状态的联动。
- [ ] 给出单元格编辑设计：编辑器以 DOM 浮层复用 mussel 输入组件的具体方式（定位、生命周期、数据流、校验、提交/取消），表格级/列级只读控制。
- [ ] 给出样式方案：从 `--mu-*` 变量取值的方式（含暗色模式切换的感知时机）、行高/边框/hover/选中态等视觉规格与现有 table 对齐。
- [ ] 给出文件结构与模块划分（`src/components/table-ex/` 下文件拆分与职责）。
- [ ] 明确范围边界：本期不支持的能力逐条列出。

## 开关状态

- 修订轮数：1（用户确认）
- 设计复核：off（用户确认）
- 并发数：3（默认；impl-verify I1 并行波用）
- 实施循环上限：3 轮（流水线默认）
- 设计状态：未通过评审（03-review-3：blocker 1 / major 2 / minor 5 未决）；用户指令实施 = 接受已知风险；03-review-3 未决条目按其评审建议并入实施约束（见 decisions.md）

## 输入

- 探索范围：
  ① kaka-grid-next（`D:\workshop\mctech\components\kaka-grid-next`）：canvas 绘制能力——渲染架构与图层、虚拟滚动实现、DPR/resize 处理、事件命中检测（列宽拖拽/单元格交互）、编辑器浮层机制、性能优化手段。此项为主。
  ② mussel 现有 table（`src/components/table/`）：API 风格、列定义结构、样式变量与视觉规格、现有排序/调宽/编辑能力——为 API 对齐提供事实。
- 探索报告：`01-explore.md`
- 设计文档：`02-design.md`
- 评审记录：`03-review-N.md`

## 验证命令 / 环境

- 验证命令（取自 package.json 与设计测试计划）：
  - `npm run build`（库构建，dev + prod）
  - `npx stylelint src/components/table-ex/*.scss --fix`（样式风格；先 --fix）
  - demo 页自检区断言 + playwright DOM/像素断言（按 `02-design.md` 测试计划 A1–A9 全表）
- 验证环境（取自 AGENTS.md）：
  - demo 站点：`npm run demo:build`（vite watch 模式，含 :3000 端口静态服务）；页面 `http://localhost:3000/data/table-ex/`；catalog 登记后需重启 watch 进程
  - 浏览器手段：playwright mcp，先直接访问；DOM/可访问性快照断言优先；canvas 像素用 `browser_evaluate` getImageData；坐标级交互（列缘拖拽/单元格命中）用 `browser_run_code_unsafe` 的 `page.mouse` 系列 + demo 暴露的坐标辅助
  - 无测试框架，无额外测试数据准备（demo 页自带 10 万行生成器）

## git 基线

- 分支 mussel-table，HEAD `04e157d`，工作区 clean（仅 `.pipeline/` 未跟踪；2026-10-23 impl-verify 启动时记录）。
