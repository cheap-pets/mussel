# 任务简报：table-ex 固定列选择框覆盖修复 + 合并单元格 hover 背景

## 目标

1. 修复缺陷：有固定列时，点击选中固定列右侧单元格并水平滚动至固定列覆盖区，选择框错误覆盖在固定列上方。
2. hover 行为：hover 在发生合并（rowspan/colspan）的单元格上时，hover 背景应覆盖整个合并区域（跨合并的行或列），而非仅单个物理格。

## 基线（git）

- 分支 dev，HEAD a4460ce，工作区干净（建目录时 `git status --short` 无输出）。

## 约束

- 范围限 `src/components/table/ex/`（canvas 表格）相关模块与 demo 夹具（`demo/src/data/table-ex*/`）。
- 纯 JavaScript 无 TypeScript；CSS 变量 `--mu-*`，禁硬编码色值（canvas 侧走 theme 色板）。
- 不提交、不安装依赖；span 既有模块 `src/components/table/ex/spans/spans.js`（regionAt/spanRectOf）优先复用。
- demo 验证场景若现有夹具不足，实施时可补夹具（固定列 + 合并单元格 + 选中）。

## 验收标准

1. 固定列覆盖：选中固定列右侧单元格 → 水平滚动使该格进入固定列覆盖区 → 选择框不覆盖固定列区域（被固定列遮挡/裁剪）。
2. 合并 hover：hover 合并单元格区域内任一物理格 → hover 背景覆盖整个合并区域（regionAt/spanRectOf 口径）。
3. 回归：无固定列选择框、合并 cell hover 高亮、普通 hover 带行为不变。

## 验证命令与环境

- `npm run build` 构建通过。
- demo 页 http://localhost:3000/（rollup watch + serve 常驻运行中）；场景页 `demo/src/data/table-ex/`。
- canvas 为像素绘制：verifier 优先 playwright mcp 截图验证；mcp 不可用或身份阻塞 → 构建验证 + 代码走查，剩余项标"需人工"。

## 流水线与开关

- 流水线：用户指定自定义组合 = 设计打磨（cross 变体：D1 → X ×1 → R ×1，不自动循环）→ 实施循环（I1 → I2 终验）× n，n ≤ 2（键=整体，R=2）。
- 实施粒度：整体；规范审查：关；TDD：关；确认门：自动（用户已定义全流程并授权实施）。
- 设计状态允许"末轮 R 后未经 X 复审"直接实施（用户指定流程，取代 cross 标准 AGREE 门）。

## 槽位映射

- designer → pipeline-primary；design-amender → pipeline-peer（评审模型：异构）。
- implementer / verifier → pipeline-fast（用户指定；验证为同槽位独立实例，用户知情指定）。

## 预算

- 预估派发数 7 = 3（设计）+ 2（实施+终验）+ 2（修复轮预留）。
- 修复轮 `整体 k/R`：0/2；派发上限 = ceil(7 × 1.5) = 11。

## 追加验收（人工修订 1，2026-11-06）

4. hover 编辑描边裁剪：有固定列时，滚动区格 A 部分滚入固定列覆盖区（如一半被遮挡），hover A → hover 编辑描边（蓝/灰）仅可见段绘制，不压固定列覆盖区（内容文本与点击选中描边保持被遮挡为现状正常）。
5. 合并格线残影：跨列合并格 B（如跨 1/2/3 列），在 B 上方或下方相邻行的端列（1、3 列）hover 后，B 内部被合并掉的格线不得显现；hover 过 B 后消失属现状行为。
5. column 列带合并格线：hoverMode=column，跨列合并 B（如跨 1/2/3 列）——在 B 上方或下方相邻行的首/末列 hover 后，B 中间被合并掉的格线不得显示；hover 过 B 后格线状态正确（无残留、无常驻多余线）。
