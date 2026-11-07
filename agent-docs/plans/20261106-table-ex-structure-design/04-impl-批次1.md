# 实施记录（批次 1：O1①② + O3 + O2 + O7-JSDoc）

依据：`02-design.md` §3 O1/O2/O3/O7 + §4.0 避让表 + §4.1 改动清单；约束见 `decisions.md`（use-pointer O3 已解除阻塞、轮 1 = 批次 1）。落笔顺序按 O2 节：O1（改引）→ O3（改名）→ O2（按改名后状态写声明）。

## 改动文件

路径均相对项目根 `D:\workshop\cheap-pets\mussel\`；步骤号为 `02-design.md` §4.1 改动清单 # 编号。

| # | 文件 | 步骤号 | 改动摘要 |
|---|---|---|---|
| 1 | src/components/table/ex/cell-paint/cell-painters.js | §4.1-1 | 删尾部 re-export 块（原 297–302：头注释 + 4 行 8 符号） |
| 2 | src/components/table/ex/interaction/interactions.js | §4.1-2 | 删 438 re-export（含 437 头注释）；hitTest JSDoc 补 headHeight/scrollTop/scrollLeft/colWidths/fixedLeftColumns 5 参（7→12，与签名一致）；resolveCursor 第三参 `context`→`deps`（含内部 isEditableCell 形参与 JSDoc） |
| 3 | src/components/table/ex/table-ex.vue | §4.1-3 + O2 | :81 prepareColumn 改引 `./cell-paint/cell-content`；createRowGeometryController 调用点补 1 行注释指向 @getters 声明 |
| 4 | src/components/table/ex/composables/use-cell-click.js | §4.1-4 | resolveCellContent 改引 `../cell-paint/cell-content`；ctx→host（45 处）；文件头 @host-* 块 |
| 5 | src/components/table/ex/composables/use-cell-tooltip.js | §4.1-5 | resolveCellTooltip 改引 `../cell-paint/cell-tooltip`；ctx→host（20 处）；@host-* 块 |
| 6 | src/components/table/ex/table-paint/paint-overlay.js | §4.1-6 | 仅 import 行 2：drawIconGlyph 拆出改引 `../cell-paint/icon-image.js`（drawTreeArrow 保留原引）；未提交区 57–231 未触 |
| 7 | src/components/table/ex/composables/use-column-resize.js | §4.1-7 | createClickGuard 改引 `../interaction/schedulers`；ctx→host（10 处）；@host-* 块 |
| 8 | src/components/table/ex/composables/use-relayout.js | §4.1-8 | createFrameScheduler 改引 `../interaction/schedulers`；ctx→host（34 处）；@host-* 块 |
| 9 | src/components/table/ex/composables/use-cell-select.js | §4.1-9 | ctx→host（24 处）；@host-* 块 |
| 10 | src/components/table/ex/composables/use-paint-state.js | §4.1-10 | ctx→host（27 处）；@host-* 块 |
| 11 | src/components/table/ex/composables/use-pointer.js | §4.1-11 | ctx→host（34 处，整文件 token 替换；:154 仅 `ctx.spans.value`→`host.spans.value` 标识符，见 §4.0 避让）；@host-* 块 |
| 12 | src/components/table/ex/composables/use-table-api.js | §4.1-12 | ctx→host（21 处）；@host-* 块 |
| 13 | src/components/table/ex/composables/use-table-instances.js | §4.1-13 | ctx→host（25 处）；@host-* 块 |
| 14 | src/components/table/ex/composables/use-tree-rows.js | §4.1-14 | ctx→host（20 处）；@host-* 块 |
| 15 | src/components/table/ex/spans/spans.js | §4.1-15 | buildSpans 内共享对象 `ctx`→`spanCtx`（3 处）；buildSpans 8 字段 JSDoc 核对一致（见自检） |
| 16 | src/components/table/ex/spans/spans-method.js | §4.1-16 | applySpanMethod 形参/解构 ctx→spanCtx（2 处） |
| 17 | src/components/table/ex/spans/spans-auto.js | §4.1-17 | collectAutoRowSpanColumns / applyAutoRowSpan 形参与调用 ctx→spanCtx（6 处，含 :32/:55/:121） |
| 18 | src/components/table/ex/geometry/row-geometry-controller.js | §4.1-18 | 文件头新增 `@getters` 声明（14 项注入 getter）；`ctx` 参数名按设计保留（O3 未列入） |
| 19 | demo/src/data/table-ex/self-checks/cell-painters.js | §4.1-19 | 7 符号改引源文件：prepareColumn/resolveCellContent→cell-content、resolveCellTooltip→cell-tooltip、getImageEntry/requestIconImage/drawIconGlyph→icon-image、linkHoverColorOf→item-painters；drawCell 保留 cell-painters 原引 |
| 20 | demo/src/data/table-ex/self-checks/painter.js | §4.1-20 | 仅 import 行 27 拆分：prepareColumn→cell-content、requestIconImage→icon-image；断言区 89–101/1416–1676 未触 |
| 21 | demo/src/data/table-ex/self-checks/spans.js | §4.1-21 | prepareColumn 改引 `cell-paint/cell-content.js` |
| 22 | demo/src/data/table-ex/self-checks/interactions.js | §4.1-22 | createClickGuard/createFrameScheduler 拆出改引 `interaction/schedulers.js` |

O2 声明块落点：10 个 composable 均在文件头模块注释之后、import 之前插入独立 JSDoc 块（`@host-reads` / `@host-writes`（Object.assign 回填成员）/ `@host-calls`（含提供方标注，壳= host 字面量成员））。

## 偏离

1. **§4.1-1/2：连删两条 re-export 专属头注释**（cell-painters.js 原 297、interactions.js 原 437）。设计写"删 299–302 / 删 438"；两条注释（"导出面原位保持"）描述的正是被删的 re-export 块，块删后语义失效且会误导检索，故随块同删。零逻辑改动。
2. **§4.1-3 之外 table-ex.vue 多 1 行注释**：O2 节明文要求"table-ex.vue:337–355 调用点注释指向该声明"，§4.1 清单表格 #3 未单列此项，按 O2 节执行（仅注释行）。
3. **O2 块与既有函数级 `@param {Object} host host 袋（读取…）` 枚举并存**：设计未要求删除既有 @param 枚举，为最小改动予以保留；后续如嫌双处维护可收敛为 @host-* 单源。

## 自检

- `npm run build`（项目根）：exit 0；build:base + build:ex 共 4 段 vite build 全部 `✓ built`（330 modules；dist/mussel.ex.js 738.52 kB / min 332.60 kB）。
- O3 断言：`grep -rn "\bctx\b" src/components/table/ex/composables/` = 0；`grep -rn "\bctx\b" src/components/table/ex/spans/` = 0（O3 节判据）；spanCtx 落点 11 处；`grep -c "\bcontext\b" interactions.js` = 0，deps 落点 = isEditableCell(117/118/122) + resolveCursor JSDoc/签名/函数体（127–141）。
- O2 断言：`@host-reads` / `@host-writes` 各 10 文件命中；`@getters` 1 处（row-geometry-controller.js:20，14 项）。
- buildSpans 8 字段 JSDoc 核对（O2，仅核对不改）：@param records/columns/spanMethod/flatInfo/fixedCount/recordsOffset/orderBy/warn 与解构顺序（spans.js:64–73）逐项一致。
- 对外 API 冻结：`git diff -- src/components/table/ex/table-ex.vue` 仅 2 行（import 行 + 注释行）；grep diff 中 `defineProps|defineEmits|defineExpose` 零命中。
- 避让策略（§4.0）执行核验：use-pointer.js 改动全部为 `\bctx\b`→`host` token 替换（sed `s/\bctx\b/host/g`，无重排/格式化），:154 现为 `…props.hoverMode || 'row', host.spans.value)) host.invalidate(region)`；paint-overlay.js 仅 import 行（原行 2，1 行→2 行）；paint-gridlines.js 本批零触（其 diff 8 行全为前一任务未提交改动）；demo painter.js 仅 import 行。
- O1 收口核对：全仓剩余 `cell-paint/cell-painters` import 仅 drawTreeArrow（paint-overlay）与 drawCell（paint-body、demo cell-painters），均为 cell-painters 自身定义；剩余 `interaction/interactions` import 均为决策函数自身导出。
- 未运行：demo self-checks 页面断言、探针基线采集/比对、`git diff` 探针逐字比对——按派发属验证员职责。
- 项目无 lint/typecheck 脚本（package.json 无 `lint`/`eslint` script），以 build 代替。

## 遗留

- `src/components/table/ex/table-ex.vue:222` 注释仍写"单一 ctx 载体"——O3 改名范围未含 table-ex.vue 注释文案（清单仅列 import 行），未动；建议批次 2A/3 触及该文件时顺手改为"单一 host 载体"。
- `row-geometry-controller.js` 的注入参名 `ctx` 保留（O3 未列入；O2 以 @getters 声明其注入面）——grep `ctx` 全库仍余 canvas 绘制函数与该参数两种合法语义，符合设计预期终态。
- 批次 1 涉及的 4 个含前任务未提交改动的文件（use-pointer / paint-overlay / demo painter / paint-gridlines）在单 commit 提交时会一并包含前任务 diff（§4.0 已声明为清理偏好，非阻塞）。
