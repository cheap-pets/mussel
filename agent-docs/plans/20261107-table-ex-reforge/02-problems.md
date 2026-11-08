# table-ex 问题清单（02-problems.md）

> 扫描基准：HEAD `ee16eb4`（2026-11-07），src/ 干净。逐信号 S1–S8 扫描；证据 = `文件:行号` 或命令输出。
> 既有重构（6034df3 批次 1+2A）已处理：三处转口、@host-* 注解、ctx 三处异义改名、editor-geometry 拆分、isSamePoint/recordNumberOf/背景带提取——本轮仅登记残留与新发问题。

## 0. 近 6 个月改动频次（热点乘数）

命令：`git log --since="6 months ago" --name-only --pretty=format: -- src/components/table/ex/ | sed '/^$/d' | sort | uniq -c | sort -rn`
（重构前文件在 ex/ 根、重构后移入子目录，同名文件已按逻辑文件归并：根 `cell-painters.js`→`cell-paint/cell-painters.js` 等。）

归并后热点（≥5 次）：cell-painters 15、table-ex.vue 13、row-geometry 11、editor 10、interactions 8、painter 7、row-geometry-controller 7、paint-body 6、paint-overlay 6、spans 6、paint-utils/paint-header/paint-gridlines/use-pointer/cell-text/text-wrap/constants/use-cell-click/use-table-api/use-tree-rows 各 5。

## 问题列表（按「检索效率影响 × 频次」降序）

### P1 [S7][B] interactions.js 六个决策域混居 + 文件头陈旧
- 证据：
  - `src/components/table/ex/interaction/interactions.js` 共 407 行（`wc -l`，全仓第 6），13 个导出分属 6 个互不消费的决策域：命中/光标（hitTest L54、resolveCursor L130、resolvePointerdown L281）、表头点击（resolveHeaderClick L186、resolveOrderByNext L147、isCheckHeaderColumn L166）、格点击（resolveCellClick L226、resolveCellClickOpen L369）、树槽（resolveTreeToggle L299）、条目（resolveItemClick L350）、调宽（resolveResizeWidth L265、RESIZE_MIN_WIDTH L14）、tooltip 门控（resolveTooltipTarget L401）。
  - 4 个 src 消费方各取不相交子集：`composables/use-cell-click.js:19`（5 个点击域符号）、`composables/use-pointer.js:16`（hitTest/resolveCursor/resolvePointerdown/resolveItemClick）、`composables/use-column-resize.js:20`（resolveResizeWidth/RESIZE_MIN_WIDTH）、`composables/use-cell-tooltip.js:25`（resolveTooltipTarget）。
  - 文件头陈旧：`interactions.js:2` 自称"只含决策函数与两个无 DOM 的工厂"，工厂（createClickGuard/createFrameScheduler）已迁 `interaction/schedulers.js:11,44`。
- 影响：「点击表头逻辑在哪」「调宽判定在哪」类检索命中 407 行混居文件；改某域影响面需人工从 13 导出中挑。频次 8（热点第 5）。

### P2 [S1][A] painter.js 尾部 cellRectAt 转口残留 + 注释失实
- 证据：`src/components/table/ex/table-paint/painter.js:418` `export { cellRectAt } from './paint-utils.js'`（纯转发，本文件无定义/包装）；L417 注释声称"自检 / interactions / editor / table-ex.vue 共用"，实测转口消费方仅 3 处：`composables/use-table-api.js:16`、`demo/src/data/table-ex/self-checks/painter.js:25`、`demo/src/data/table-ex/self-checks/spans.js:28`（interactions/editor/table-ex.vue 均已直引 paint-utils，见 02-map.md §3 边表）。
- 扫描命令（全 ex/ 唯一内部纯转发）：`grep -rn "export {.*} from\|export \*" src/components/table/ex --include="*.js"` → 仅 painter.js:418 与生态豁免的 index.js。
- 影响：import 图二跳失真（A 类）；"cellRectAt 实现在哪"答案指向 painter 而非 paint-utils.js:35。频次 7。

### P3 [S4][C] paint-overlay 描边链三站点逐字同源
- 证据：`src/components/table/ex/table-paint/paint-overlay.js:139` 注释自认"矩形链与 paintHoverEditorStroke **逐字同源**"（双证据①）；矩形链 `regionAt → spanRectOf → editorRectOf(editorGridlineFlagsOf({...8 字段}))` 在 L106-119、L146-159、L190-203 三处逐字重复，`withClip + strokeRect(rect.left+0.5, ...)` 描边块在 L126-134、L162-170、L210-217 三处逐字重复（双证据②：去空白后逐 token 相等，仅 strokeStyle/谓词变量不同）。
- 影响：hover/选中描边几何改动须 3 处同步，漏改即视觉漂移（C 类）。频次 6。系上轮 2B 遗留（agent-docs/plans/table-ex-structure-refactor-summary.md §8）。

### P4 [S4][C] row-geometry-controller 两处同源残留（上轮收敛漏网）
- 证据：
  - `src/components/table/ex/geometry/row-geometry-controller.js:268` `recordNumber: (ctx.getRecordsOffset() || 0) + row + 1` —— 与 `shared/cell-identity.js:14` `recordNumberOf` 函数体逐 token 相等；cell-identity.js:13 注释自认"原 10 处内联式收敛至此"，此处漏网（上轮记录为 :298，行号已漂移）。
  - `row-geometry-controller.js:421-434`（remeasureVisibleRows 尾部锚定补偿块）与同文件 `syncAnchoredLayout` L225-240 函数体除 `geometry`/`variableGeometry` 别名外逐 token 相等（shift 计算 → scrollTop 回写 → setLayout contentHeight/spacer 同式）——既有单一事实源未复用。
- 影响：同上（C 类，一处改另一处漏）。频次 7。

### P5 [S2/S3][A] @host-* 注解缺口 + 审计脚本缺失（完成判据未闭合）
- 证据：
  - 注解缺口 2 处（机器审计 + 人工核对）：`composables/use-pointer.js:234` 使用 `host.flatRows.value` 但文件头 @host-reads（L7-9）未声明 flatRows；`composables/use-table-api.js:108` 使用 `host.canvasEl.value` 但 @host-reads（L7-8）未声明 canvasEl。
  - 审计脚本不存在：全仓无 @host-* 审计/门禁脚本（`ls scripts/` 无该目录；grep 全仓 `host-reads` 仅命中 10 个 composable 源文件）。signals.md S2/S3 完成判据要求"审计脚本零缺失"，当前注解正确性无机制保障。
- 影响：host 袋隐式依赖的显式化声明可信度不可验证（A 类残留）。

### P6 [S7][B] row-geometry.js 双域混居（几何工厂 × 行高估算）
- 证据：`src/components/table/ex/geometry/row-geometry.js` 452 行（全仓第 3）；L1-2 文件头自述"行几何策略：等高/变高双模式统一接口"，但 L58-137（linkItemCountOf/measuredLineCountOf/textLineCountOf/columnLineCount）与 L300-452（computeRowHeights/ensureRowMeasured/indicatesVariableMode/regionWidthOf）为行高**估高/精算算法**域，占全文件约 55%，超出头述职责。两域唯一消费方均为 row-geometry-controller.js:13-20（符号组互不交叉：工厂组 createUniform/VariableRowGeometry/computeAnchorShift vs 估算组 computeRowHeights/ensureRowMeasured/isEntryColumn）。
- 影响：「变高行高怎么算」检索命中几何工厂文件，需在 452 行内再分域。频次 11（热点第 3）。

### P7 [S8][D] 参数形态超标（21 函数位置参数 >5；4 袋 >10 字段）
- 证据：机器扫描（tmp-s8scan.cjs，袋按 1 参计）+ 人工核对，清单见 02-map.md §6.2/§6.1。极值：drawButtonPill 13 参（canvas-kind-painters.js:263）、drawCellClipped 12 参（paint-body.js:285）、drawCell 袋 19 字段、computeEditorStyle 袋 17 字段、hitTest 袋 12 字段、relayout 袋 11 字段。
- 影响：调用点语义不可目检（D 类）。按 means.md，S8 不开专项批次（未引发实际缺陷），接触调用点时顺带。

### P8 [S7 软线不成立→R6 保留项] 四个 400-600 行单域文件
- 证据：table-ex.vue 474（script 块 405，L70-474；模板仅 69 行；职责单一 = 壳组装 12 步 L286-452）、row-geometry-controller.js 465（单导出 createRowGeometryController L45，状态机闭包）、painter.js 418（绘制管线 + createPainter，同一域）、item-painters.js 412（条目绘制单域，L1 头自述单职责）。
- 判定：均 >400 软线但**不伴随**文件头多职责或互不消费符号组（signals.md S7 判据不满足），不构成 S7 命中；按 SKILL.md R6 需作为「已确认保留的 400-600 行条目」交用户确认（见 design 不做清单）。

### P9 [S6][B] createRowGeometryController 的 ctx 与 canvas ctx 同形异义
- 证据：`geometry/row-geometry-controller.js:45` 参数名 `ctx`（14 getter 袋）；ex/ 内 `ctx` 高频 460 次，其中绝大多数为 canvas 2d context（painter 系文件，平台 API 豁免）。controller 的 ctx 为上轮改名（ctx→host/spanCtx/deps）后仅存的非豁免双义 ctx。
- 影响：grep "ctx" 在 controller 语义混入 canvas 语境（B 类轻微）。

### P10 [S5 残余][A] editor-geometry.js 目录归属语义（不做候选）
- 证据：`table-paint/paint-overlay.js:4`、`interaction/edit-button.js`、`composables/use-cell-click.js:21` 三个 L3 消费方 import `editing/editor-geometry.js`（editing/ 为 L2 目录）；该模块仅依赖 constants（闭包轻），环依赖 NONE（实测）。重载荷 form 链已在上轮 2A 切断（editor.js 仅 L8-15 import editor-resolve）。
- 判定：S5 失真模式（反向边拖入重闭包）已消除，剩余仅目录语义；不构成 S5 命中。

## 未命中信号记录（可复现）

- S1 其余：`grep -rn "export \*\|export {.*} from" src/components/table/ex` → 仅 painter.js:418（P2）+ index.js（生态豁免：与 button/index.js 同款 `export { default as MuXxx } from './xxx.vue'`，公共入口，登记于 design）。
- S4 其余：paintBodyRow（paint-body.js:83）与 paintBodyRowSpans（L118）循环体近同构但非逐 token 相等、无注释自认同源（双证据不满足，不判 S4）；锚定补偿跨文件 3 变体（use-tree-rows.js:141-173 record 锚 / use-table-instances.js:36-63 row 锚 / controller 行号锚）同上不判，仅 controller 同文件内 P4 成立。
- S5：环依赖 DFS 实测 NONE；无下层→上层重闭包边（P10 为目录语义残余）。
- S2 host 袋 / S3 paintState：机制保留（上轮决策），注解面缺口见 P5。
