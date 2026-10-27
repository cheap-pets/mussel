# 实施记录：S5（canvas-table.vue 壳接线）

模式：串行集成步骤 / 步骤 S5。白名单：`src/components/canvas-table/canvas-table.vue`（仅此文件）。
依赖：G1-a（constants/editor）、G1-b（cell-painters）、G1-c（theme/interactions/scss）、S4（painter）已全部合入，按其已落地 API 对接（`editorButtonRectOf`、`cellRectAt`、`resolveItemClick` 返回含 `disabled`、painter state 契约 `hoverItem`/`editingCell`、`computeEditorStyle` 新签名无 gridlines/theme）。

## 改动摘要

净变更 +164/−3，全部在 canvas-table.vue，对应设计问题 3/5/6/7：

- **import**：`./editor` 增具名导入 `editorButtonRectOf`（painter 已 import 同一函数，壳命中判定共用单一事实源）；`cellRectAt` 沿用既有 `./painter` 导入。
- **问题 7（hoverItem 状态接线）**：
  - 新增 `const hoverItem = shallowRef(null)`（`{ row, col, kind, index, disabled } | null`）；paintState 字面量与 `syncPaintState` 各增 `hoverItem` 字段，**总开关归一 `props.hoverMode === 'none' ? null : hoverItem.value`**（条目 hover 色在表体 pass 绘制、不经 paintOverlay 门控，切 none 后指针不动也立即失效）。
  - 新增 `isSameHoverItem`（row/col/kind/index/disabled 全等）、`hoverItemCells`（prev/next 两格按行列号去重）、`updateHoverItem(hit)`：经既有 `resolveItemClick({ hit, itemHits: paintState.itemHits })` 求值（disabled 由 G1-c 透传），变化时写 `hoverItem.value`/`paintState.hoverItem` 后对去重格逐格 `invalidate({ cell })`。
  - **接线位置按设计**：`onPointerMove` 内、`updateHover(hit)` 之外（updateHover 同格提前 return，同格内条目间移动必须在此单独求值失效）；`onPointerLeave` 追加 `updateHoverItem(null)`（清 hoverItem + 旧格重绘，防移出画布后 hover 色残留）。
  - 新增 `applyItemCursor(hit)`：`resolveCursor` 结果先落位后覆盖——`hit.resizeCol < 0 && !hit.isHeader` 门控内，hoverItem kind ∈ { link, button } 且非 disabled → `pointer`（tag/check 不覆盖）。
- **问题 5（编辑按钮命中/光标）**：
  - 新增 `isEditorButtonHit(hit, col)`：列配 `editorButton.icon` 且指针落在 `editorButtonRectOf(cellRectAt(layout, row, col), { padding: snapshot.cellPadding, lineHeight: snapshot.cellLineHeight })` 区矩形内，半开区间内联判定（与 interactions.isItemRectHit 同口径，未新增跨模块导出）。
  - 新增 `tryEditorButtonClick(hit, record, col)`：命中则 `col.editorButton.onClick?.({ record, recordIndex: hit.rowIndex, column: col._raw ?? col })`（payload 按「接口」节，column 传原始列引用）并返回 true。**onClick 中判定位置按设计：`!col` 早退之后、树槽判定之前**——不选中行、不发 cell-click、不开编辑。抽独立函数系 eslint complexity ≤10 约束（onClick 内联为 11，抽出后 9；与 `tryToggleTreeRow` 同型）。
  - `applyItemCursor` 末段：指针在编辑按钮区 → `cursor.value = 'pointer'`（覆盖 resolveCursor 的 text/default；col-resize 与表头不覆盖）。
- **问题 3（computeEditorStyle 删参）**：`openEditorAt` 调用删除 `gridlines: props.gridlines` 与 `theme: themeWatcher?.snapshot` 两行（G1-a 新签名只依赖格几何）。
- **问题 6（veil 开关接线）**：
  - 新增壳内 `let editingCellRef = null`（editor 控制器不加字段）；paintState 字面量与 `syncPaintState` 各增 `editingCell` 字段，由 `editingCellRef` 归一。
  - **openEditorAt 成功后置 veil**：先 `editingCellRef = { row, col }`，旧格 `editingCellRef` 非空则 `invalidate({ cell: prevCell })` 恢复（此时已不在 veil），再 `invalidate({ cell: editingCellRef })` 置 veil；同一 tick「commit 旧格 + open 新格」时关闭 watch 尚未 flush（old/new 均非 null），旧格恢复由本处失效直接完成。
  - **编辑关闭全路径 watch**：新增 `watch(() => editor.state.editing)`，仅 `newValue == null` 时执行「取 `editingCellRef` → 清 `editingCellRef` → `invalidate({ cell })`」（**清先于失效**，syncPaintState 归一 `paintState.editingCell = null` 后该格恢复内容渲染）；无条件清除会抹掉同 tick 新格 veil。覆盖 commit/cancel/blur 兜底/值变化提交/滚动与画布 pointerdown 提交全部关闭路径。watch 回调含 `if (!painter)` 空值防护（卸载路径，`paintState.editingCell` 置 null 后直接返回）。

## 偏离

设计问题 6 接线 step 1 的字面顺序作了一步调序（语义不变）：

- **设计原文**：`先 invalidate({ cell: editingCellRef }) 恢复旧格内容；再 editingCellRef = { row, col }、paintState.editingCell = editingCellRef、invalidate({ cell })`。
- **问题与证据**：`invalidate()` 每次先调 `syncPaintState()`，后者按设计改动清单以 `editingCellRef` 归一 `paintState.editingCell`。若按原文先 invalidate 后更新 `editingCellRef`，第一次失效时 `paintState.editingCell` 仍指向旧格 → 旧格照常被 veil 跳绘，「恢复旧格内容」落空（同理，问题 6 step 2 原文「invalidate → 清 editingCellRef」也会把待恢复格再次画成空白）。派发追加约束的转述「openEditorAt 后置 paintState.editingCell + invalidate({cell})；编辑关闭全路径 watch → 清 editingCell + invalidate({cell})」均为「先更新、后失效」语序。
- **落地**：开启路径 = 更新 `editingCellRef` → invalidate 旧格（恢复）→ invalidate 新格（veil）；关闭路径 = 清 `editingCellRef` → invalidate 该格（恢复）。设计要求的所有语义（旧格恢复、新格 veil、同 tick commit+open 不误清新格、卸载防护）逐条保持，仅步内先后序对调，无方案变化。

其余无偏离。两点边界内说明：① `paintState.editingCell` 未在 openEditorAt/watch 内直接赋值，统一经 `syncPaintState` 从 `editingCellRef` 归一（设计改动清单行明示 syncPaintState 为接线点，且 invalidate 内部必然经过）；② 编辑按钮 cursor/onClick 未按 hoverMode=none 门控——设计问题 5 对两处仅写「覆盖 resolveCursor」「命中则回调 → return」无条件语，none 抑制条款明示针对绘制（paintHoverOverlay 门控），按字面落地。

## 自检

| 判据 | 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint src/components/canvas-table/canvas-table.vue` | **0 error / 0 warning**，exit 0（中途修复：editor import 块 vue/script-indent 7 处、onClick complexity 11→抽 `tryEditorButtonClick` 后 9） |
| SFC 编译 + 模块图解析 | /tmp 最小 vite 构建（复用项目 pluginVue/pluginSvg/alias/$colors 注入同参，产物写 /tmp 未触碰仓库）：canvas-table.vue 单入口 → 150 modules transformed，built 成功（`editorButtonRectOf`/`cellRectAt` 具名导入、`./editor`/`./painter` 图解析均验证） | PASS（临时文件已清理） |
| paintState 两新字段（无 tree/topAlignCols） | 静态核对：paintState 字面量与 syncPaintState 仅增 `hoverItem`/`editingCell`；全文 grep 无 tree/topAlignCols 新字段 | PASS |
| computeEditorStyle 调用删参 | 全文 grep：`gridlines: props.gridlines` 仅剩 paintState 字面量一处（既有字段）；:1010 调用点无 gridlines/theme 实参 | PASS |
| onPointerMove/onClick 新命中路径 | 静态核对：onPointerMove = resolveCursor → updateHoverItem → updateHover → applyItemCursor（条目 pointer / 编辑按钮区 pointer，col-resize 与表头不覆盖）；onClick = `!col` 早退之后、`tryToggleTreeRow` 之前插 `tryEditorButtonClick` → return，payload `{ record, recordIndex: hit.rowIndex, column: col._raw ?? col }` | PASS |
| veil 开关接线时序推演 | 逐路径走查：① Esc/commit/blur 兜底/滚动提交 → editing=null → watch 仅 null 时清 editingCellRef + invalidate（恢复渲染）；② 同 tick commit+open：watcher 单次 flush old/new 均非 null → 不清，旧格由 openEditorAt 失效恢复、新格置 veil；③ open 失败（validate 拦截）：opened=false 不动 veil，旧格编辑态保持；④ 卸载：watch 内 `!painter` 防护 | PASS |
| 白名单 | `git status`：本轮仅 canvas-table.vue 增改（树中 badge.*/props.js 等为前序既有在途状态，未触碰；G1/S4 各文件本轮未动） | PASS |

## 遗留

- 页面级验证（A1–A11）不在本组判据，待 G2 各组 self-checks 落地后由 V 集成验证执行；本步落地后 painter 侧 `hoverItem`/`editingCell` 契约开始有真实数据源（S4 前 hoverItem/editingCell 缺省 undefined 与现状等效）。
- 编辑按钮、veil、条目悬停的浏览器断言（A5/A6/A7）依赖 demo main-view.vue 的 editorButton 夹具与事件日志（G2-1），当前 demo 未配夹具，页面点击路径无法先行自验。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（沿用 G1/S4 环境备注；本地 node_modules 缺 eslint-config-standard）。
