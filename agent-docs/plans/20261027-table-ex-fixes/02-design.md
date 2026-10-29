# 设计输入：table-ex 六项缺陷

> 用户裁决「直接实施」：本文件为用户问题清单的逐字转录 + 范围/验证约束，见 decisions.md。根因定位与修复方案由实施者完成。

## 问题清单（用户原文）

1. 固定列时，若发生滚动，固定列的 header 背景没有覆盖滚动列的 header，造成滚动列 header 的文字仍绘制在固定列的 header 上。
2. check 列的列头 checkbox 未居中。
3. 可编辑单元格，内部 hover 边框，与单元格边框的边距，四周不相等，上方和右侧比下方和左侧少一像素。可能是把格线一像素计算在边距内了。
4. 单元格文字的居中，也检查一下，可能会有与上一条一样的原因。同时，多行文本单元格的首行文字，应与其他格文字对齐。
5. 当表格宽度，超过所有列的宽度和时，在多余的宽度部分，虽然有格线，但鼠标无法 hover 和选中行。
6. 修复其他 eslint 检查到的问题。

## 改动清单（范围约束）

- 允许改动：`src/components/table-ex/**`、`demo/src/data/table-ex/**`
- 禁止改动：上述之外的任何源码；文档（skills/、docs-site/、docs/，未经用户确认不更新）；构建配置；依赖
- 根因预期分布（供定位起点，实施者核实后不受限于此预测，仅受范围约束）：
  - 问题 1 → painter.js 固定区绘制顺序/裁剪（paintFixedArea、表头绘制）
  - 问题 2 → cell-painters.js 或 painter.js 的表头 check 绘制（drawHeaderCheck）
  - 问题 3 → editor.js 浮层定位（EDITOR_GAP 口径，格线 1px 未从边距扣除）
  - 问题 4 → cell-painters.js 文字绘制（水平居中 x 计算、多行首行 y 计算）
  - 问题 5 → interactions.js 命中测试 / layout.js 行几何（空白区超出列宽总和时行命中失效）
  - 问题 6 → 两目录存量风格问题，`eslint --fix` 优先

## 测试计划

| 标准 | 手段 |
|---|---|
| R1 固定列表头 | 浏览器：demo 页开固定列 + 横向滚动，页面 JS 取固定表头区域像素断言无滚动列文字；self-checks 补断言 |
| R2 check 表头居中 | 浏览器/像素：checkbox 绘制矩形中心 == 表头格几何中心（±0.5px）；self-checks 补断言 |
| R3 hover 边框等距 | 浏览器/像素：编辑浮层内边框四边与格边框距离相等；self-checks 补断言 |
| R4 文字居中/多行首行 | 浏览器/像素：居中列文字中心 vs 格中心；多行首行 y 与单行格 y 对齐；self-checks 补断言 |
| R5 空白区 hover/选中 | 浏览器：表格宽于列宽总和时，鼠标移入/点击空白区，断言 hover 高亮与选中行为；self-checks 补断言 |
| R6 eslint | 命令：`npx eslint src/components/table-ex/ demo/src/data/table-ex/` → 0 error 0 warning |
| R0 回归 | 浏览器：自检面板全部断言通过 |

- 实施者须为 R1–R5 各补充至少一条 self-checks 断言（目录 `demo/src/data/table-ex/self-checks/`，项目既有惯例）；新增断言数记入实施记录。
- 修复若改变既有断言的像素口径，允许同步修正夹具，须在实施记录「偏离/说明」中写明。

## 实施步骤

1. 逐项定位问题 1–5 根因（读 painter/cell-painters/editor/interactions/layout），在 demo 页复现确认。
2. 逐项实施修复（问题 4 与 3 同源则合并修复并说明）。
3. eslint 清零：先 `npx eslint <两目录> --fix`，余量手动修复。
4. 补充/修正 self-checks 断言。
5. 自检：lint + 自检面板全量断言 + R1–R5 逐项像素/交互验证，结果记入实施记录。

## 约束与上下文

- 不得回退既有性能优化：text-wrap 共享 ellipsize 缓存、hover 脏区去重、paintFixedArea 行区间收敛、估高扫描签名跳过（见 `agent-docs/handoff/handoff-table-ex-optimization-remaining-20261026.md`）。
- EDITOR_GAP 口径先例：`agent-docs/plans/20261025-editable-table/02-design.md`（4px 等距内缩）。
- 已删除 demo 模块 `demo/src/data/table-ex-editable/`（本任务第一步，用户指令），相关交接文档中该路径引用已失效；编辑链路验证走 `demo/src/data/table-ex/` 自身。
- 纯 JavaScript，无 TypeScript；改动遵循 BEM/`--mu-*` 变量等既有约定（AGENTS.md）。
- 不执行 git commit/push。
