# 任务：消除 table-ex 下 eslint 错误

## 目标

`src/components/table/ex/` 全目录 eslint 报告清零：error 必须清零；warning（已知存量：complexity / max-len，集中在 canvas-kind-painters.js 等）默认一并清零。若某项仅能以大范围重构或 disable 处理，实施记录中单独说明供用户裁决，不擅自 disable。

## 基线

- 上一任务（20261108-table-bugfix-pipeline）修复改动未提交：src 8 文件 + demo 2 文件（base/table.vue、use-column-resize.js、editor.js、layout.js、click-resolve.js、spans-method.js、paint-body.js、painter.js、demo/src/data/table-advanced/main-view.vue、demo/src/data/table-ex/self-checks/painter.js）。属既有成果，不得还原、不得混入无关改动。
- demo/src/data/table-ex/self-checks/ 另有他人未提交改动（cell-painters/index/interactions/spans），不触碰。
- src/styles/background.scss、todo/misc.md 为任务外改动，不触碰。

## 验收标准

1. eslint 扫描 `src/components/table/ex/`（.js + .vue）0 error 0 warning（或保留项均有说明且经用户裁决）。
2. 行为不变：`npm run build` 通过；demo 自检 243/243（`http://localhost:3000/data/table-ex/?t=v1`）。
3. complexity 类拆分（如做）保持函数行为等价，自检断言不漂移；注释随结构调整同步。
4. 改动仅限 src/components/table/ex/ 下文件。

## 验证命令

- eslint：项目用全局 eslint 8.57.0（无局部依赖时勿安装；命令形态自行按项目 .eslintrc / package.json scripts 确认）。注意知识库条目：`demo/**` glob 会拾取 demo/dist 产物假报错，口径限 src 与 demo/src。
- `npm run build`

## 流水线

单点：implementer（primary），直修。

## 预算

- 预估派发数：1；上限：2（失败重派 1 次计内）
- 修复轮：无（单点直修，验证失败按失败重派处理）
