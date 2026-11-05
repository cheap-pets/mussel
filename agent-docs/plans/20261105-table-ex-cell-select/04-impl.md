# 实施记录

实施轮次 1（fast），按 02-design.md 终版实施清单片 1 → 片 2 → 片 3 顺序执行；交互验证（附录 A）由独立 verifier 执行，本记录仅含实施自检。基线 HEAD 9d61316，未提交（decisions.md 约束）。

## 改动文件

| 路径 | 对应设计步骤 |
|---|---|
| `src/components/table/ex/table-ex.vue` | 片 1 步骤 1：shell 声明 `selectedCell`（cursor 后）、host 字面量并入、import `useCellSelect`、组装步骤 9.5（usePointer 之后 useRelayout 之前）、组装顺序注释补位次 |
| `src/components/table/ex/use-cell-select.js`（新，219 行） | 片 1 步骤 2（selectCell/clearCellSelection + 清除 watch + onUnmounted）+ 片 2 步骤 2（document keydown 挂摘/四重守卫 + copySelection + clipboard 失败 devWarn）+ 片 3 步骤 2（moveSelection live 快照 + applySelectionScroll） |
| `src/components/table/ex/paint-overlay.js`（253 行） | 片 1 步骤 3：`paintHoverPlainStroke`（挂入 paintHoverOverlay withClip 内、editorStroke 之后，谓词与蓝描边严格互补）+ `paintCellSelection`（paintOverlay 内 hover 之后、resizeGuideX 之前，自带表体区 withClip + 越界守卫） |
| `src/components/table/ex/use-paint-state.js`（122 行） | 片 1 步骤 4：paintState 字面量增 `selectedCell: null`；syncPaintState 增同步；模块头注释/JSDoc ctx 键清单同步 |
| `src/components/table/ex/use-cell-click.js`（393 行） | 片 1 步骤 5：finishCellClick `resolveCellClickOpen` 只求值一次，openEditor 分支前置 `clearCellSelection`、else 分支 `selectCell`；onClick 表头分支清除；selectRowOnly 首行清除 |
| `src/components/table/ex/use-table-api.js`（151 行） | 片 1 步骤 6：getLayoutInfo 返回增 `selectedCell`（headHeight 后，浅拷贝）；JSDoc ctx 键补 `selectedCell` |
| `demo/src/data/table-ex/self-checks/painter.js`（3 hunk） | 片 1 步骤 7：:901/:905 两处各拆 2 行（左缘期望 `THEME.borderColorSoft` 灰描边 + 内邻期望 row0Band）；:857 用例名与返回摘要补「非可编辑/关闭 → 灰描边」 |
| `src/components/table/ex/cell-selection.js`（新，140 行） | 片 2 步骤 1（`CELL_COPY_EXCLUDED_TYPES` + `resolveCellCopyText`，类型清单先于取值链）+ 片 3 步骤 1（`resolveSelectionMove` clamp + `resolveSelectionScroll` 绝对式公式） |

确认零改动项逐一核对（`git status --short`）：index.js、table-ex.scss、interactions.js、editor.js、cell-content.js、cell-tooltip.js、painter 簇其余文件、demo 其余文件、docs、skills 均未动。

## 偏离

1. 设计「use-cell-select.js 契约」（片 2/3 步骤 2）：问题——按契约直写后 eslint complexity 超限（onKeydown 20、moveSelection 11，约束「warning ≤ 基线 6」）。证据：eslint 输出（首轮自检 8 warnings，其中 2 条来自新文件）。处理——仅做函数分解不改语义：onKeydown 守卫与动作解析拆为 `isArrowKeyOf`/`arrowActionOf`/`copyActionOf`/`keyActionOf`，滚动赋值拆为 `applySelectionScroll`；守卫条件逐条与契约一致（editor.editing / defaultPrevented / 表单 target / 箭头带 ctrl·meta·alt 放行 / KeyC 带 shift·alt 放行）。第二次 lint 后仍余 `keyActionOf` complexity 13 → 再拆（isArrowKeyOf 独立函数）后归零。属实现结构细节，契约未钉死函数划分，行为无变化。
2. 设计「裁定 5」与「use-cell-select.js 契约」在合并区域移动存在措辞张力（契约字面序：resolveSelectionMove → selectCell → resolveSelectionScroll(live, row, col)；裁定 5：目标格归一后与当前相同视为原地「无操作」）：目标格为当前选中区域的覆盖格时，按契约字面会在 selectCell 幂等返回后仍以**原始目标列**计算滚动量（多余滚动）。处理——按裁定 5（decisions 确认约束优先）收敛：moveSelection 内先 `anchorOf`（resolveSpanCell）归一，与当前相同即整体返回（不失效、不滚动），滚动量以归一后锚格坐标计算。证据：裁定 5 原文「目标格经 resolveSpanCell 归一到合并区域锚格（归一后与当前相同视为原地，无操作）」。
3. 行数估算偏差（非行为）：cell-selection 90→140、use-cell-select 170→219、paint-overlay 225→253，均在 ≤500 约束内。

## 自检

| 命令 | 结果 |
|---|---|
| `wc -l`（改动 7 文件） | cell-selection 140 / use-cell-select 219 / paint-overlay 253 / use-cell-click 393 / table-ex.vue 463 / use-paint-state 122 / use-table-api 151，全部 ≤500（测试计划 8） |
| `npm run build`（共 3 次：初版 / complexity 重构后 / moveSelection 修正后） | 退出码 0，dev + prod 双构建通过（测试计划 9） |
| `eslint src/components/table/ex demo/src/data/table-ex/self-checks/painter.js` | 0 error；6 warnings 全部位于未触及文件（canvas-kind-painters / cell-tooltip / item-painters，基线即有），新代码 0 新增 warning（测试计划 10） |
| `git status --short` | 仅 `src/components/table/ex/`（5 改 2 新）+ `demo/src/data/table-ex/self-checks/painter.js` + agent-docs/plans/ 任务目录；无 commit（测试计划 11） |
| `git diff -- demo/src/data/table-ex/self-checks/painter.js` | 仅 3 hunk（用例名 + 两处断言改写 + 返回摘要），无额外改动（集成步骤 4） |
| demo watch 新鲜度轮询（catalog.js vs `src/components/table/ex` + self-checks，设计前置门同款判定） | FRESH——demo watch（运行中，非本任务启动）已吸收全部改动，demo 包编译通过（自检文件语法/导入经 watch 构建验证） |
| hover 态自检采样点全量复核（设计「遵循约定」枚举 :517/:528/:533/:875/:895/:908/:961/:967/:1238/:1242） | 逐点对照源码：采样点均不在被 hover 格描边缘或经 hoverMode none/蓝描边路径排除，不受新增灰描边影响，无需同步 |

## 遗留

- 附录 A 交互断言（验收 1-4 + 标准 5-7 行为项）未在本轮执行——按派发由独立 verifier 执行；本轮自检仅命令侧（构建/lint/行数/边界/diff hunk）。
- 剪贴板失败 devWarn 文案为实施自定固定串（设计只约束「文案固定串」）：`单元格复制未写入剪贴板：navigator.clipboard 不可用或写入被拒绝（不影响选中与方向键移动）`，warn once 去重。
- demo watch（:3000）为任务开始前已在运行的外部进程，未停止；集成步骤 6 的收尾（停 watch / 删 verify 脚本与临时目录）适用对象为验证侧自启进程，本任务未启动任何后台进程（无 /tmp/demo-build.pid）。
- 方向键 colCount 取 `wiredColumns.length`（与 layout.colWidths 长度恒等：colWidths 由 preparedColumns 解出，wiredColumns 同源列集）；设计契约未钉死该取值来源，如验证发现树模式列集差异可改取 `layout.colWidths.length`。
