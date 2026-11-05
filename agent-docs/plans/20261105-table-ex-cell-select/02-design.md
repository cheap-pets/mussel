# 设计

## 方案概述

为 table-ex 增加单元格选中与复制（验收 1-4），全部在重构后模块边界内落位，零 scss / index.js / 文档改动；demo 仅自检文件随新绘制项同步 2 处像素断言（改动清单末行）：

1. **选中态**：shell 声明 `selectedCell`（`{ row, col } | null`，与 hover 同级），点击不可编辑格置位、paintState 同步、分区 5 以主色 1px 内边框绘制（`paint-overlay.js`）；不可编辑格 hover 补浅灰（`--mu-border-color-soft`）1px 内边框，与可编辑格现有蓝色描边（`paintHoverEditorStroke`）互斥互补，可编辑链路零改动。
2. **纯逻辑**：新文件 `cell-selection.js`（复制排除类型清单 / 复制文本提取 / 方向键 clamp / 滚动量计算，全纯函数）。
3. **壳编排**：新 composable `use-cell-select.js`（selectCell/clearCellSelection + document 级 keydown 挂摘 + `navigator.clipboard.writeText` + 自动滚动应用 + 行列集变化清除 watch）。
4. **内省**：`getLayoutInfo()` 增 `selectedCell` 字段（additive，验证锚点，先例 getCellRect）。

键盘通道取 document 级监听（选中存在时挂、清除即摘），不给 `__sticky` 加 tabindex——不触碰焦点链，保「可编辑列现有 hover/编辑行为不变」。

触及模块边界：`src/components/table/ex/` 内 7 个文件（2 新增 + 5 修改）+ `demo/src/data/table-ex/self-checks/painter.js`（自检断言同步，3 处文本）。无新依赖、无公开 props/emits 变化、无样式文件改动。

## 遵循约定与复用

自行提取（无探索报告；依据源码、knowledge INDEX 与根 AGENTS.md）：

- **内边框几何单一事实源**：`editorRectOf` + `editorGridlineFlagsOf` + `spanRectOf`（editor.js:61-99、spans.js:206-217）——灰/蓝描边与可编辑 hover 描边、编辑浮层盒同矩形链，贴格线内侧 1px 口径复用。
- **覆盖层裁剪**（knowledge table-ex-overlay-clip-body-area）：新增绘制项一律在 `withClip` 表体区 `[0, headHeight, stickyWidth, stickyHeight - headHeight]` 内（paint-overlay.js:156 现有调用内新增 hover 描边；选中描边独立 withClip 块）。
- **自检断言同步**（knowledge canvas-pixel-assert-anchor-drift：同步清单不依赖方案文档，须 grep 全量扫）：新增 hover 绘制项改变格缘像素，全量 `grep -n "hover:" demo/src/data/table-ex/self-checks/*.js` 复核后命中 2 处恒败断言（painter.js:901、:905 采样点即被 hover 格左缘），须同批改写（改动清单末行）；其余 hover 态绘制位 10 处全量核对不受影响：:517（断言采样在邻列左缘，非被 hover 格缘）、:528（列模式采样在格内非缘）、:533/:908（hoverMode none，灰描边随覆盖层抑制）、:875/:895（可编辑蓝描边路径，谓词互补不画灰）、:961/:967（树箭头 accent，采样区距格缘 ≥3px）、:1238/:1242（空白延伸区）。
- **paintState G2-a 契约**（use-paint-state.js:4-7）：`selectedCell` 经 syncPaintState 原地同步，invalidate/redraw 即生效，不在 painter 内自持状态。
- **合并归一**（spans.js:170-180）：`resolveSpanCell(spans, { rowIndex, colIndex })` 最小 hit 形态可用（函数体仅读 isHeader/rowIndex/colIndex）；选中/移动一律存锚格坐标。
- **取值链复用**：`resolveCellContent`（cell-content.js:140-158）只读求值，emit 传 noop（先例 cell-tooltip.js:26 TOOLTIP_NOOP、cell-tooltip.js:17-23 惰性求值注释）；复制文本与 tooltip 全文同源，不引第二套取值式。
- **warn 通道**：`warn({ component: 'table-ex', message })` once 去重（table-ex.vue:306-308 devWarn 同款）。
- **组合式约定**：`useX(host)` + 返回 `Object.assign(host, api)`；shell 声明响应式状态入 host 字面量（table-ex.vue:220-277 先例）；组装顺序注释同步更新。
- **命名/路径**：目录内相对 import，文件 kebab-case，`use-*` 前缀；新文件 ≤500 行（追加约束）。
- **键盘/剪贴板平台事实**：`navigator.clipboard.writeText` 需安全上下文（localhost 合格）、user gesture 内可用、失败 reject（MDN https://developer.mozilla.org/docs/Web/API/Clipboard/writeText，平台 API 非第三方库）；`__sticky` 现无 tabindex（table-ex.vue:14-21、table-ex.scss 无 tabindex 规则）——键盘认证通道需自行建立。
- **验证环境**：demo URL 前缀 /data/（knowledge demo-page-url-data-prefix）；子 agent 无 playwright → headless Edge CDP（knowledge headless-edge-dom-verification）；交互合成事件带 clientX/clientY、浮层断言等 80ms+（knowledge table-ex-demo-interaction-verify）；像素采样点运行时从 `getCellRect` 推导、不落死值（knowledge canvas-pixel-assert-anchor-drift）；watch 驱动路径经 `__vueParentComponent.setupState` 直替（knowledge playwright-props-swap-verification 同族手法）。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| `cell-selection.js`（新，~90 行） | `CELL_COPY_EXCLUDED_TYPES`（复制排除类型清单）、`resolveCellCopyText({ columns, rows, row, col, recordsOffset })`、`resolveSelectionMove({ row, col, key, rowCount, colCount })`、`resolveSelectionScroll(layout, row, col)` | 纯决策/取值逻辑归独立模块（interactions.js 已 438 行不再塞；本关注点自成一簇） |
| `use-cell-select.js`（新，~170 行） | composable：selectCell/clearCellSelection（含 span 归一 + prev/next 格 invalidate）、document keydown 挂摘 watch（复制 + 移动）、行集/列集变化清除 watch、onUnmounted 摘除、剪贴板写入 + 失败 devWarn | 壳编排按 C1 组合式模式独立成文件 |
| `paint-overlay.js`（改，180 → ~225 行） | ① 新增 `paintHoverPlainStroke`（不可编辑格 hover 浅灰描边），挂入 `paintHoverOverlay` 现有 withClip 内、`paintHoverEditorStroke` 之后；② 新增 `paintCellSelection`（选中主色描边，独立 withClip 表体区），`paintOverlay` 内 hover 覆盖层之后、调宽参考线之前调用 | 分区 5 是 hover/选中叠加唯一归属；裁剪约定生效位置 |
| `use-paint-state.js`（改，+2 行） | paintState 字面量增 `selectedCell: null`；syncPaintState 增 `paintState.selectedCell = ctx.selectedCell.value` | G2-a 状态同步 |
| `use-cell-click.js`（改，+~12 行） | ① `finishCellClick`：openEditor 分支前置 `ctx.clearCellSelection()`，else 分支 `ctx.selectCell?.(hit.rowIndex, hit.colIndex)`；② `onClick` 表头分支增清除；③ `selectRowOnly`（beyondCols）增清除 | 点击是选中唯一入口；可编辑格进编辑时让位 |
| `table-ex.vue`（改，+~7 行） | shell 声明 `const selectedCell = shallowRef(null)` 并入 host 字面量；import + 组装步骤 9.5（usePointer 之后、useRelayout 之前）`Object.assign(host, useCellSelect(host))`；组装顺序注释更新 | 选中状态与 hover 同级的壳枢纽；步骤 9.5 前置使其清除 watch 先于 useRelayout 合并 watch flush |
| `use-table-api.js`（改，+2 行） | `getLayoutInfo()` 返回增 `selectedCell: ctx.selectedCell.value ? { ...ctx.selectedCell.value } : null` | 验证/调试内省锚点（getCellRect 同先例） |
| `demo/src/data/table-ex/self-checks/painter.js`（改，3 处） | ① :901 → 两行：左缘期望 `THEME.borderColorSoft`（'非可编辑列 hover 左缘灰描边（非主色）'）+ 内邻 (310,50) 期望 `row0Band`；② :905 → 两行：左缘期望 `THEME.borderColorSoft`（'editable 关闭 hover 左缘灰描边（无主色）'）+ 内邻 (180,50) 期望 `row0Band`；③ :857 用例名与返回摘要补「非可编辑 / editable 关闭 → 灰描边」 | 灰描边落在被 hover 格左缘，原「无描边」断言（期望行带混色）恒败；采样点 = 格左缘，见「遵循约定」自检同步条 |

确认零改动：`index.js`、`table-ex.scss`、`interactions.js`、`editor.js`、`cell-content.js`、`cell-tooltip.js`、painter 簇其余文件、`demo/**`（除上表自检文件）、`docs*/**`、`skills/**`、`src/components/index.ex.js`（无公开 API/用法变化；文档同步见未解问题 1）。

## 接口 / 数据结构

### 待裁定项裁定（00-task「验收标准」节要求，全部闭合）

1. **图形列清单（不参与复制）**：`['check', 'button', 'progress', 'img', 'image', 'icon']`。
   依据（canvas 实际渲染形态）：check → ✓ 方框 items（check.js compile）、button → pill/链接形态（canvasKind button）、progress → 进度条（canvasKind progress，cell-content.js:32）、img/image → 图片 items（image.js）、icon → 图标 items（icon.js）。**bool 列不入清单**：canvas 渲染为文字（bool.js compile → `{ text: trueText/falseText }`＝「是/否」），有可复制文本；用户所述「开关」是 bool 列的编辑器形态（MuSwitch）——可编辑列点击即进编辑、不进选中/复制通道，语义已覆盖。tag/link/list 有 caption 文本 → 可复制。
   图形列**仍可选中**（验收 1 未对图形列区分，选中反馈对所有不可编辑列一致）；仅 Ctrl+C 不写剪贴板。
2. **复制内容格式**＝显示文本全文（与 tooltip content 同源，cell-tooltip.js:115-155 先例）：
   - 文本路径：`String(content.text)`——enum → 映射 label；number/currency → Intl 格式化串（number.js formatter.format 产物，如 `1,234.5`）；bool → 是/否；date/datetime/text → 原串；`column.text` 自定义 → 其返回串。
   - 条目路径（tag/link/list）：条目 `text` 以 `\n` 连接（竖排条目与视觉行对应；含超限 dots `'...'`，与 tooltip 同源）。
   - 多行文本列复制完整文本（不经 maxLines 截断/省略，tooltip 全文同语义）。
   - 排除类型 / `canvasKind`（progress/button 兜底）/ 内容为空（null/undefined/`''`/占位格）→ 返回 null，**不动剪贴板**。
3. **可编辑列行为保持**：`paintHoverEditorStroke`（paint-overlay.js:86-112）与单击开编辑链（use-cell-click.js:130-132）零改动；新灰描边仅在「非可编辑格」补画（谓词＝`paintHoverEditorStroke` 绘制条件的补集：`!(state.editable && state.isCellEditableFn?.(column))`）；点击可编辑格时清除选中（编辑态自有边框/veil 视觉）。
4. **选中态清除时机**：
   - 清除：① `displayRows` 引用变化（records 替换 / 排序 / 树展开收起 / 懒加载回填）；② `wiredColumns` 引用变化；③ 点击可编辑格（进编辑）；④ 点击表头；⑤ 点击 beyondCols 空白延伸区（col=-1，R5 行级选中语义）。
   - 保留：滚动、指针离开、hover 变化、recordsVersion 就地更新（行索引不变）、主题切换、容器 resize、spans 重算（选中坐标不依赖 spans，边框矩形随下次重绘按新 spans 取区域）。
   - 越界防护：绘制侧 rowValid/colValid 守卫（paintHoverOverlay 同款，paint-overlay.js:151-152）；就地 splice 删行导致索引悬空的极端场景靠守卫不崩溃，不清除（可接受的边缘，行为与 hover 一致）。
5. **方向键边界**：clamp 停留（首行↑ / 末行↓ / 首列← / 末列→ 均原地不动，不环绕、不换行）；目标格经 `resolveSpanCell` 归一到合并区域锚格（归一后与当前相同视为原地，无操作）；**两轴自动滚动**（`resolveSelectionScroll`）：垂直——行顶 < scrollTop 则对齐顶、行底越 stickyHeight 则对齐底；水平（仅滚动区列，col ≥ fixedCount）——列左越固定区右缘则左对齐、列右越视口则右对齐；固定列恒可见不触发横向滚动。取值锚（layout.js:323-344）：固定区右缘 = `layout.fixedWidth`、视口右缘 = `layout.stickyWidth`、可视行高 = `layout.viewH`。滚动经 `scrollEl.scrollTop/scrollLeft` 赋值走既有 scroll → rAF 重绘链（use-relayout.js:133-156）。

### 新文件导出（cell-selection.js，纯函数）

```js
/** 复制排除类型（图形列，无文本语义；裁定 1） */
export const CELL_COPY_EXCLUDED_TYPES = ['check', 'button', 'progress', 'img', 'image', 'icon']

/**
 * 单元格复制文本（裁定 2）：resolveCellContent 只读求值（emit noop）。
 * @returns {String|null} null = 不写剪贴板（排除类型 / canvasKind / 空内容）
 */
export function resolveCellCopyText ({ columns, rows, row, col, recordsOffset = 0 })

/**
 * 方向键移动（裁定 5）：clamp 到 [0, rowCount-1] × [0, colCount-1]；
 * key ∈ ArrowUp/Down/Left/Right（其余 key → null）；rowCount/colCount ≤ 0 → null；
 * clamp 后与当前相同 → null（无操作）。
 * @returns {{ row, col } | null}
 */
export function resolveSelectionMove ({ row, col, key, rowCount, colCount })

/**
 * 选中格可见性滚动量（裁定 5）：已可见返回 null；否则返回待赋值的
 * { scrollTop?, scrollLeft? }（非负，调用方直接赋 scrollEl）。
 * layout = 调用方传入的快照（ctx.layout.value 叠加 el 的实时 scrollTop/scrollLeft，
 * 见 use-cell-select 契约——防连按时 layout 滚动值滞后误判「已可见」）。
 * 判定与取值为绝对式（不依赖当前 scroll 的增量）：
 *   top = rowGeometry.topAt(row)；h = rowGeometry.heightAt(row)
 *   vx = colLefts[col] - scrollLeft（col ≥ fixedCount 才判横向）
 *   scrollTop  = top < scrollTop ? top
 *              : (top + h > scrollTop + viewH ? top + h - viewH : 省略)
 *   scrollLeft = vx < fixedWidth ? colLefts[col] - fixedWidth
 *              : (vx + colWidths[col] > stickyWidth ? colLefts[col] + colWidths[col] - stickyWidth : 省略)
 * 固定列（col < fixedCount）恒可见，不产 scrollLeft。
 */
export function resolveSelectionScroll (layout, row, col)
```

伪代码（复制提取，签名级）：

```js
const column = columns[col]
// 类型清单必须先于取值链：check 列 items 带 text: '✓'（check.js:10-21），
// 只靠下方 items 分支会把图形列的 ✓ 复制出去
if (!column || CELL_COPY_EXCLUDED_TYPES.includes(column.type)) return null
const record = rows[row]
if (record == null) return null
const content = resolveCellContent(column, { record, recordNumber: recordsOffset + row + 1, emit: noop })
if (content.canvasKind) return null
if (Array.isArray(content.items))
  return content.items.map(i => i?.text).filter(t => t != null && String(t) !== '').map(String).join('\n') || null
return (content.text != null && String(content.text) !== '') ? String(content.text) : null
```

### use-cell-select.js 契约

```
useCellSelect 读取 host：props, scrollEl, layout, wiredColumns, displayRows, spans,
  selectedCell, invalidate, editor
返回并入 host：{ selectCell, clearCellSelection }（selectedCell 为 shell 声明，不回填）

selectCell(row, col)
  归一：const a = resolveSpanCell(spans.value, { rowIndex: row, colIndex: col })
  与当前相同 → return；否则 prev/next 各 invalidate({ cell })（合并区域由 painter
  脏区扩展到区域包围盒，painter.js:331 先例）

clearCellSelection()
  有值才清：invalidate({ cell }) + 置 null

keydown（document 级，watch(selectedCell) 非空挂 / 置空摘；onUnmounted 兜底摘）
  挂摘（幂等，防同引用重复登记/漏摘）：
    const attach = () => { document.removeEventListener('keydown', onKeydown); document.addEventListener('keydown', onKeydown) }
    document.removeEventListener('keydown', onKeydown)  // detach
  守卫（任一命中即原样放行，不 preventDefault）：
  - editor.state.editing 非空（编辑器 owns 键盘；选中与编辑互斥的兜底）
  - event.defaultPrevented
  - target 为 input/textarea/select 或 isContentEditable
  - Arrow 且带 ctrl/meta/alt；KeyC 且带 shift/alt
  处理：
  - ArrowX（无修饰）→ preventDefault + moveSelection：
    const el = ctx.scrollEl.value
    const live = el ? { ...ctx.layout.value, scrollTop: el.scrollTop, scrollLeft: el.scrollLeft } : ctx.layout.value
    resolveSelectionMove → selectCell → resolveSelectionScroll(live, row, col) → 逐键赋 el.scrollTop/scrollLeft
    （scrollEl 赋值同步可读，故连按方向键时用 el 实时值；用 layout 快照会在连续 keydown
      之间读到旧 scrollLeft，左移判定误判「已可见」而不回滚）
  - code==='KeyC' 且 (ctrlKey||metaKey) → preventDefault + copySelection：
    resolveCellCopyText → null 则跳过；navigator.clipboard?.writeText 缺失或返回 reject →
    devWarn（warn once 去重，文案固定串）

清除 watch：watch([displayRows, wiredColumns], ...) 引用变化 → clearCellSelection
```

### 绘制（paint-overlay.js 内新增，签名级）

```
paintHoverPlainStroke(ctx, state, hover)   // 不可编辑格：strokeStyle = state.theme.borderColorSoft
paintCellSelection(ctx, state)             // 选中格：strokeStyle = state.theme.primaryColor
  两者的矩形链与 paintHoverEditorStroke 逐字同源（editorRectOf(spanRectOf(layout,row,col,spans),
  editorGridlineFlagsOf({...}))，paint-overlay.js:93-107 复制参数式），线宽 1，
  strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width - 1, rect.height - 1)
  paintHoverPlainStroke：挂入 paintHoverOverlay 现有 withClip 内（表体区裁剪），
    执行序 = hoverHighlight → editorStroke（可编辑蓝）→ plainStroke（不可编辑灰，
    谓词互补恒不同时触发）→ treeArrowAccent → editButton
    谓词照抄（与 paintHoverEditorStroke 的绘制条件严格互补，勿改写）：
      const column = state.columns?.[hover.col]
      const blue = Boolean(state.editable && state.isCellEditableFn && column && state.isCellEditableFn(column))
      if (blue) return
    （state.editable 为假时全格落灰描边——全局关闭编辑即「全部列不可编辑」，与验收 1 一致；
      自检 painter.js:905 正是此态）
  paintCellSelection：paintOverlay 内 paintHoverOverlay 之后调用，自带
    withClip(ctx, [0, headHeight, stickyWidth, stickyHeight - headHeight], ...)；
    rowValid/colValid 守卫；hoverMode 任意值都绘制（选中态独立于 hover 反馈，
    hoverMode 'none' 仅抑制 hover 灰描边——随 paintHoverOverlay 现有 mode 门控）
```

### 组装（table-ex.vue，TDZ / 时序防护）

- shell 第 0 步 host 字面量增 `selectedCell`（插在 `hoverItem`/`cursor` 相邻处，table-ex.vue:179-184 同段）；`shallowRef` 已在 table-ex.vue:71 导入，无需改 import 行。
- 步骤 9.5：`Object.assign(host, useCellSelect(host))`——须在 usePaintState（步骤 6，invalidate）之后、useRelayout（步骤 10）之前：清除 watch 的 flush 序先于 relayout 合并 watch（Vue pre watcher 按创建 id 排序）；同 tick 内先清旧选中格再整幅重绘，避免 relayout 帧残留蓝边。
- **9.5 可读键全部先于该步就位**（逐项核对，勿调整步骤序）：`props`/`scrollEl`/`preparedColumns`（步骤 0）、`displayRows`/`wiredColumns`（步骤 2）、`spans`（table-ex.vue:325）、`invalidate`/`syncPaintState`（步骤 6）、`editor`（步骤 7）、`layout`（shallowRef 步骤 0 声明，useRelayout 运行时写值）。useCellSelect 内不得在 setup 期解构尚未赋值的成员，一律运行时经 `ctx.<key>` 读取。
- 清除 watch 非 immediate → setup 期不触达 `invalidate`（此时 painter 为 null 也安全：`invalidate` 返回 false）。
- `selectedCell` 只在 shell 声明、不回填 host（避免覆盖新引用）；useCellSelect 只返回 `{ selectCell, clearCellSelection }`。
- useCellClick（步骤 8）经 `ctx.selectCell?.()` / `ctx.clearCellSelection?.()` 惰性读取（运行时点击必在 setup 完成后，键已就位）。

### 依赖方向（无环，build 即时暴露）

```
cell-content ← cell-selection ← use-cell-select ← table-ex.vue（shell）
paint-overlay（既有依赖不变，仅内部新增函数）
```

## 被拒绝的备选

1. **tabindex 挂 `__sticky` + 元素级 keydown**：Safari 点击不聚焦 div（键盤断路）；进 Tab 序改变页面焦点链，威胁「可编辑列现有编辑行为不变」（编辑器 focus/blur 兜底链对焦点敏感，editor.js blur 判据）；新增焦点框视觉副作用。拒绝，改 document 级挂摘监听。
2. **复制走 `document.execCommand('copy')` + copy 事件**：已废弃 API，且依赖真实选区；headless 验证不稳。拒绝，用 `navigator.clipboard.writeText`（验证侧用 writeText 包装捕获入参，见附录 A）。
3. **条目分隔符用 `'；'`（tooltip 同款）**：竖排条目（link/list 每条独占一行）视觉即行，`\n` 与粘贴语义一致（ Excel/文本编辑器逐行落格）。拒绝 `'；'`（tooltip 内部用法不变，两处语义不同：提示串 vs 剪贴板内容）。
4. **图形列不可选中**：验收 1 的 hover/点击选中未区分图形列，仅验收 3 将图形列排除出复制；选中反馈对所有不可编辑列一致更可预期（check 列选中 + 翻转并存，互不干扰）。拒绝。
5. **hover 灰色取 `borderColorNormal`（--mu-gray-7）**：偏深近似格线，与「浅灰」不符且易与 gridline 混淆；取 `borderColorSoft`（--mu-gray-4，root.scss:50）为边框谱系最浅档。
6. **选中态存 painter 内部**：违背 G2-a「paintState 单一状态源、原地变更后 invalidate 即生效」契约（use-paint-state.js:4-7），且 demo 内省（getLayoutInfo）读不到。拒绝。

## 风险与回滚

- **单向门：无**。不改公开 props/emits/注册名/样式/依赖；getLayoutInfo 增字段为 additive（消费方按需读取，缺省行为不变）。
- **双向门**：本任务不提交（decisions.md），工作区改动待用户确认后单 commit（`✨: table-ex 单元格选中与复制`），回滚 = 丢弃工作区 / revert。爆炸半径 = table-ex 组件（demo 3 个引用页中 table-ex 主页直接消费新行为；basic/scene 页零改动零回归面）。
- 主要风险与对策：
  1. **document keydown 拦截面**：仅在选中存在期间挂监听，且编辑态/表单控件/defaultPrevented/修饰键四重守卫放行；处理后一律 preventDefault（Arrow 阻页面滚动、Ctrl+C 阻浏览器默认复制，属特性语义）。多实例同时持有选中时均响应（罕见边缘，行为可预期，记录在此）。
  2. **剪贴板环境限制**：非安全上下文（http 非 localhost / file://）`navigator.clipboard` 缺失 → devWarn once、静默降级，不影响选中/移动。验证环境 localhost:3000 合格。
  3. **灰描边全域生效**：所有现存 table-ex 使用方的不可编辑格 hover 新增视觉（即验收 1 需求本身）；`editable=false` 的使用方全格皆新增灰描边（全局关闭编辑 = 全部列不可编辑，见「绘制」谓词）。**自检受影响 2 处**（此前判断「不覆盖」有误）：`demo/src/data/table-ex/self-checks/painter.js:901`（'非可编辑列无描边'，采样 (300,50) = 被 hover 的金额列左缘）与 `:905`（'editable 关闭无描边'，采样 (60,50) = 被 hover 的名称列左缘）在新增灰描边后恒败（期望 row0Band≈(245,245,245)，实际 borderColorSoft=(232,236,241)，容差 2）→ 按改动清单末行同批改写。其余 hover 态断言采样点不在被 hover 格边缘，实测复核列表见「遵循约定」自检同步条。
  4. **paintState 漏同步**：`selectedCell` 只进 syncPaintState 一处；invalidate/redraw 全经 syncPaintState（use-paint-state.js:91-109），整幅/脏区两路径均覆盖。
  5. **滚动链竞态**：方向键移动先 invalidate（旧 scrollTop 下重绘）再赋 scrollTop → scroll 事件 rAF 重绘校正；两帧内收敛，无残影（同帧微任务序，无中间上屏）。验证断言在按键后 sleep ≥100ms。
  6. **行数预算**：改动后估算 paint-overlay ~225 / use-cell-click ~393 / table-ex.vue ~458 / 新文件 ~90+~170，全部 ≤500；超限即停（WC 复核为每片完成判据）。
  7. **hover 与选中叠加**：同格同时 hover + 选中时灰描边先画、蓝描边后画覆盖（paintOverlay 调用序固定），最终观感为蓝；无叠加闪烁（同帧整幅/脏区路径一致）。
  8. **剪贴板无焦点环境**：headless 页面可能无 document focus，`navigator.clipboard.writeText` 会 reject（NotAllowedError，与安全上下文无关）；验证以预置 `writeText` 包装捕获入参为准（附录 A 页内段），不依赖系统剪贴板、`Browser.grantPermissions` 与 `readText`。生产侧该 reject 走 devWarn once 降级，不影响选中/移动。

## 测试计划

| 验收标准 | 归属片 | 手段 | 检查方式 |
|---|---|---|---|
| 1a. 不可编辑格 hover 浅灰内边框 | 片 1 | 浏览器（CDP 附录 A） | 默认场景：pointermove 悬停 (0,2)（名称列，不可编辑）→ sleep 150ms → 按**描边矩形口径**采样四缘（附录 A `strokeRectOf`：左 x、右 x+w−1−ri、上 y+ti、下 y+h−1；ti=row>0、ri=col<末列）全部 = `borderColorSoft`（±12/通道）；`pointerleave` → 四缘回到行带/底色（`!hasBorder`） |
| 1b. 点击选中蓝色内边框 | 片 1 | 浏览器（CDP） | click (0,2) → 四缘（同上口径）= `primaryColor`；`getLayoutInfo().selectedCell` 字段级等于 `{row:0,col:2}` |
| 2. 选中格 Ctrl+C 复制 | 片 2 | 浏览器（CDP + 剪贴板包装，见附录 A 页内段） | click (0,2) → keydown(code=KeyC, ctrlKey) → `window.__copyCalls` 末项 === `'记录 000001'`（包装法：不依赖系统剪贴板 / grantPermissions / readText） |
| 3. 图形列不复制 | 片 2 | 浏览器（CDP） | click (0,0)（check 列）→ selectedCell={0,0}、蓝缘存在 → ctrl+C → `__copyCalls.length` 不增；**enum 列须走键盘**（col 9 等级列 editable:true，click 会开编辑器而不选中，main-view.vue:477-484）：click (0,2) + ArrowRight ×7 → (0,9) → ctrl+C → 末项 === `'低'`（行 0 level=1 映射，可复算） |
| 4a. 方向键移动相邻格 | 片 3 | 浏览器（CDP） | 选中 (0,2)：↓ → {1,2}、`hasBorder(1,2,BLUE)` 且 `!hasBorder(0,2,BLUE)`（旧格消失）；→ → {1,3}（可编辑列只可经键盘选中，蓝缘 + ctrl+C 末项 === `'待处理'`，行 1 status=pending） |
| 4b. 边界 clamp | 片 3 | 浏览器（CDP） | 默认场景：↑ 于 row0 / ← 于 col0 原地（selectedCell 不变、无滚动增量）；few 规模（3 行，`setupState.dataScale='few'`）：选中 (2,2) ↓ 原地；→ 至末列（`getLayoutInfo().colWidths.length-1` = 16）再 → 原地 |
| 4c. 无选中不处理 | 片 3 | 浏览器（CDP） | 脚本首段（页面刚加载、未点击）：↓/→ → selectedCell 仍 null、`scrollEl.scrollTop/scrollLeft` 无增量 |
| 4d. 冻结列跨界 + 自动滚动 | 片 3 | 浏览器（CDP） | `setupState.fixedLeftInput='2'` 后 ← 从 col2 到 col0：固定区格仍出蓝缘、`scrollEl.scrollLeft` 恒 0（在 full 规模、切换 few 之前执行）；↓ ×20（可视行 ≈6）后 selectedCell.row===20、`scrollEl.scrollTop > 0`、目标格 `getCellRect(20,2)` 行顶 ≥ headHeight 且行底 ≤ canvas 高；横向：末列连按后 `scrollEl.scrollLeft > 0` 且末列左右缘均在画布内 |
| 5. 可编辑列行为不变（追加约束） | 片 1 + 终验 | 浏览器（CDP） | pointermove 悬停 (0,3)（状态列可编辑）→ 缘 = primaryColor（蓝，非灰）；click (0,3) → 150ms 内 `.mu-table-ex__editor` 存在且事件日志增量 >0（先例断言，20261105-table-ex-refactor 2c）；先选中 (0,2) 再 click (0,3) → editor 出现且 selectedCell=null |
| 6. 清除时机（裁定 4） | 片 1 + 终验 | 浏览器（CDP） | 选中 (0,2) 后表头 click（金额列 col 5，非 sortable，避免排序扰动）→ null 且旧格蓝缘消失；再选中后切 few 规模（displayRows 引用变化）→ null；few 下 click (1,0) check 格：翻转后 selectedCell={1,0}（就地更新不清除） |
| 7. 回归：自检全绿 / 无 console 错误 | 每片 + 终验 | 浏览器（CDP） | `.ct-check-item--fail` 计数 = 0（含改动清单末行同步后的「hover 编辑感知」用例）；`Runtime.exceptionThrown` / `console.error` 空 |
| 8. 行数 ≤500（追加约束） | 每片 + 终验 | 命令 | `wc -l src/components/table/ex/cell-selection.js src/components/table/ex/use-cell-select.js src/components/table/ex/paint-overlay.js src/components/table/ex/use-cell-click.js src/components/table/ex/table-ex.vue` 全部 ≤500 |
| 9. 库构建 | 每片 + 终验 | 命令 | `npm run build` 退出码 0 |
| 10. lint | 终验 | 命令 | 改前采集 `eslint src/components/table/ex demo/src/data/table-ex/self-checks/painter.js` 基线；改后 0 error 且 warning ≤ 基线（knowledge eslint-demo-dist-false-positives：勿对 demo/** 全量跑，demo/dist 会假报错） |
| 11. 目录边界 / 不提交 | 终验 | 命令 | `git status --short` 仅 `src/components/table/ex/`、`demo/src/data/table-ex/self-checks/painter.js` + 任务目录；无 commit（decisions.md） |

前置门（每片浏览器断言前，Git Bash，项目根执行；全失败即停，禁止旧包断言）：

```bash
# 1) demo 未运行时后台启动 watch 构建（记录 PID 供收尾；程序在后台会持续刷新 dist）
curl -sf -o /dev/null http://localhost:3000/data/table-ex/ || { npm run demo:build >/tmp/demo-build.log 2>&1 & DEMO_PID=$!; echo $DEMO_PID > /tmp/demo-build.pid; }
# 2) 轮询到「源文件不新于产物」且页面可访问（上限 120s）
for i in $(seq 1 60); do
  if [ -f demo/dist/assets/catalog.js ] && [ -z "$(find src/components/table/ex demo/src/data/table-ex/self-checks -newer demo/dist/assets/catalog.js)" ] \
     && curl -sf -o /dev/null http://localhost:3000/data/table-ex/; then
    FRESH=1; break
  fi
  sleep 2
done
test "${FRESH:-}" = 1 || { echo "STALE_OR_DOWN"; exit 1; }
```

`find` 同时纳入 `demo/src/data/table-ex/self-checks`（自检文件改动也须进新包，否则断言跑旧逻辑）。

### 附录 A：verifier 脚本（headless Edge CDP，临时，交付前删除）

启动（Git Bash；端口冲突换 9334；记录 PID 供 taskkill 收尾）：

```bash
rm -rf /tmp/edge-cellsel && mkdir -p /tmp/edge-cellsel
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --no-first-run \
  --remote-debugging-port=9333 --remote-allow-origins=* \
  --user-data-dir=/tmp/edge-cellsel "http://localhost:3000/data/table-ex/" &
```

`<任务目录>/verify-cell-select.mjs`（node ≥22，全局 WebSocket/fetch；传输层与 20261105-table-ex-refactor 附录 A 同构）：

```js
const port = 9333
// 片内运行（片 1 / 片 1+2）时改为该片断言键数组（如 ['hoverGray', 'hoverGone', ...]）；
// 片 3 与终验保持 null（全量）。片键集见各片「行为判据」
const SLICE_KEYS = null
const deadline = Date.now() + 15000
let target = null
while (!target && Date.now() < deadline) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    target = list.find(t => t.type === 'page' && t.url.includes('/data/table-ex/'))
  } catch {}
  if (!target) await new Promise(r => setTimeout(r, 300))
}
if (!target) { console.error('FAIL: no page target'); process.exit(1) }

const ws = new WebSocket(target.webSocketDebuggerUrl)
let seq = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return }
  if (msg.method === 'Runtime.exceptionThrown') errors.push('exception')
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('console.error')
})
await new Promise(r => ws.addEventListener('open', r))
const send = (method, params = {}) => new Promise(r => {
  const id = ++seq
  pending.set(id, r)
  ws.send(JSON.stringify({ id, method, params }))
})
await send('Runtime.enable')

const expression = `(async () => {
  /* ← 页内段：见下方「页内段」代码块，逐字粘入 */
})()`
const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
const det = res.result?.exceptionDetails
if (det) errors.push('evaluate-exception: ' + (det.exception?.description || det.text))
const out = res.result?.result?.value || {}
if (out.ready === false) { console.error('FAIL: page not ready'); process.exit(1) }
const failed = Object.entries(out)
  .filter(([k, v]) => v !== true && (!SLICE_KEYS || SLICE_KEYS.includes(k)))
  .map(([k]) => k)
console.log(JSON.stringify({ failed, errors, out }, null, 2))
ws.close()
if (failed.length || errors.length) process.exit(1)
```

页内段（粘入上块 `expression` 内；全部断言返回布尔，node 侧要求全 true）：

```js
  const out = {}
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  // 就绪门（mount 时序）：占位 __canvasTable 只有 getCellRect；真实实例在 onMounted 替换
  for (let i = 0; i < 100 && typeof window.__canvasTable?.getLayoutInfo !== 'function'; i++) await sleep(100)
  const inst = window.__canvasTable
  const sticky = document.querySelector('.mu-table-ex__sticky')
  const canvas = document.querySelector('.mu-table-ex__canvas')
  const scrollEl = document.querySelector('.mu-table-ex__scroll')
  if (typeof inst?.getLayoutInfo !== 'function' || !sticky || !canvas || !scrollEl) return { ready: false }
  // 自检面板就位（runSelfChecks 在 onMounted 同步执行，DOM 下一 tick 渲染）
  for (let i = 0; i < 100 && document.querySelectorAll('.ct-check-item--pass').length === 0; i++) await sleep(100)

  // 剪贴板包装（主案）：捕获组件实际 writeText 入参；不依赖 document focus / grantPermissions / readText
  window.__copyCalls = []
  if (navigator.clipboard) navigator.clipboard.writeText = t => { window.__copyCalls.push(String(t)); return Promise.resolve() }

  const parse = s => (s.match(/\d+(\.\d+)?/g) || []).map(Number)
  const near = (a, b, tol = 12) => a && b && [0, 1, 2].every(i => Math.abs(a[i] - b[i]) <= tol)
  const dpr = () => canvas.width / canvas.getBoundingClientRect().width
  const px = (x, y) => { const d = canvas.getContext('2d').getImageData(Math.round(x * dpr()), Math.round(y * dpr()), 1, 1).data; return [d[0], d[1], d[2]] }
  const theme = inst.getThemeSnapshot()
  const BLUE = parse(theme.primaryColor)
  const GRAY = parse(theme.borderColorSoft)
  const canvasH = () => canvas.getBoundingClientRect().height

  // 描边矩形 = editorRectOf(spanRectOf(...), editorGridlineFlagsOf(...))，gridlines 恒 'all'（demo 未传）：
  // 顶内缩 ti（row>0）、右内缩 ri（col<末列）；strokeRect(x+0.5, y+0.5, w-1, h-1)
  // → 左缘采样 x、上缘 y+ti、右缘 x+w-1-ri、下缘 y+h-1
  const strokeRectOf = (r, c) => {
    const t = inst.getCellRect(r, c)
    const li = inst.getLayoutInfo()
    const blankTail = canvas.getBoundingClientRect().width > li.contentWidth
    const ti = r > 0 ? 1 : 0
    const ri = (c < li.colWidths.length - 1 || blankTail) ? 1 : 0   // = editorGridlineFlagsOf 口径
    return { x: t.x, y: t.y + ti, w: t.width - ri, h: t.height - ti }
  }
  const bands = (r, c) => {
    const s = strokeRectOf(r, c)
    return [[s.x, s.y + s.h / 2], [s.x + s.w - 1, s.y + s.h / 2], [s.x + s.w / 2, s.y], [s.x + s.w / 2, s.y + s.h - 1]]
  }
  const hasBorder = (r, c, color) => inst.getCellRect(r, c) != null && bands(r, c).every(([x, y]) => near(px(x, y), color))

  const hover = (r, c) => { const t = inst.getCellRect(r, c)
    sticky.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: t.left + t.width / 2, clientY: t.top + t.height / 2 })) }
  const clickAt = (cx, cy) => { const o = { bubbles: true, cancelable: true, clientX: cx, clientY: cy }
    sticky.dispatchEvent(new PointerEvent('pointerdown', o))
    sticky.dispatchEvent(new PointerEvent('pointerup', o))
    sticky.dispatchEvent(new MouseEvent('click', o)) }
  const click = (r, c) => { const t = inst.getCellRect(r, c); clickAt(t.left + t.width / 2, t.top + t.height / 2) }
  const key = (k, opts = {}) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }))
  const copy = () => key('c', { code: 'KeyC', ctrlKey: true })
  const sel = () => inst.getLayoutInfo()?.selectedCell ?? null
  const isSel = (r, c) => { const s = sel(); return s != null && s.row === r && s.col === c }
  const resetScroll = async () => { scrollEl.scrollLeft = 0; scrollEl.scrollTop = 0; await sleep(250) }

  // A0 无选中不处理（验收 4c；页面刚加载的原始状态）
  out.a0Selected = sel() === null
  const top0 = scrollEl.scrollTop, left0 = scrollEl.scrollLeft
  key('ArrowDown'); key('ArrowRight'); await sleep(150)
  out.a0Noop = sel() === null && scrollEl.scrollTop === top0 && scrollEl.scrollLeft === left0

  // A1 hover 灰（验收 1a）
  hover(0, 2); await sleep(150)
  out.hoverGray = hasBorder(0, 2, GRAY)
  sticky.dispatchEvent(new PointerEvent('pointerleave'))
  await sleep(150)
  out.hoverGone = !hasBorder(0, 2, GRAY)

  // A2 点击选中蓝（验收 1b）
  click(0, 2); await sleep(150)
  out.selBlue = hasBorder(0, 2, BLUE)
  out.selected = isSel(0, 2)

  // A2b 表头清除（标准 6 前半）：金额列 col 5 非 sortable（避免排序扰动）
  const headerPoint = c => { const li = inst.getLayoutInfo()
    const x = li.colWidths.slice(0, c).reduce((a, b) => a + b, 0) + li.colWidths[c] / 2
    const b = canvas.getBoundingClientRect()
    return { cx: b.left + x, cy: b.top + li.headHeight / 2 } }   // 仅在 scrollLeft=0 时成立（此处成立）
  const hp = headerPoint(5)
  clickAt(hp.cx, hp.cy); await sleep(150)
  out.headerClears = sel() === null && !hasBorder(0, 2, BLUE)

  // A3 复制（验收 2）
  click(0, 2); await sleep(150)
  copy(); await sleep(150)
  out.copied = window.__copyCalls[window.__copyCalls.length - 1] === '记录 000001'

  // A4 图形列不复制（验收 3）
  const calls0 = window.__copyCalls.length
  click(0, 0); await sleep(150)
  out.checkSelected = isSel(0, 0) && hasBorder(0, 0, BLUE)
  copy(); await sleep(150)
  out.checkNotCopied = window.__copyCalls.length === calls0
  click(0, 2); await sleep(150)
  for (let i = 0; i < 7; i++) key('ArrowRight')    // col9 等级列 editable：只能键盘选中（click 会开编辑器）
  await sleep(200)
  out.enumSelected = isSel(0, 9)
  copy(); await sleep(150)
  out.enumCopied = window.__copyCalls[window.__copyCalls.length - 1] === '低'
  await resetScroll()                               // 键盘横移可能已横滚，后续 click 需视口内

  // A5 方向键移动（验收 4a）
  click(0, 2); await sleep(150)
  key('ArrowDown'); await sleep(200)
  out.movedDown = isSel(1, 2) && hasBorder(1, 2, BLUE) && !hasBorder(0, 2, BLUE)
  key('ArrowRight'); await sleep(200)
  out.movedRight = isSel(1, 3)
  copy(); await sleep(150)
  out.editableColCopied = window.__copyCalls[window.__copyCalls.length - 1] === '待处理'

  // A6 边界 clamp（验收 4b；此点 scroll 仍为 0,0——A5 未触发滚动，可断言零增量）
  click(0, 2); await sleep(120)
  key('ArrowUp'); await sleep(150)
  out.topClamp = isSel(0, 2) && scrollEl.scrollTop === 0
  click(0, 0); await sleep(120)
  key('ArrowLeft'); await sleep(150)
  out.leftClamp = isSel(0, 0) && scrollEl.scrollTop === 0 && scrollEl.scrollLeft === 0

  // A6b 冻结列（验收 4d 前半）：fixedLeftInput 为 ref（demo main-view.vue:1018），setupState 直替
  let comp = document.querySelector('.ct-stage').__vueParentComponent
  while (comp && !('dataScale' in (comp.setupState || {}))) comp = comp.parent
  comp.setupState.fixedLeftInput = '2'; await sleep(300)
  click(0, 2); await sleep(150)
  key('ArrowLeft'); key('ArrowLeft'); await sleep(200)
  out.fixedCol = isSel(0, 0) && hasBorder(0, 0, BLUE) && scrollEl.scrollLeft === 0
  comp.setupState.fixedLeftInput = '0'; await sleep(300)

  // A6c 纵向自动滚动（验收 4d 后半）：可视行 ≈ 6，↓ ×20
  click(0, 2); await sleep(150)
  for (let i = 0; i < 20; i++) key('ArrowDown')
  await sleep(350)
  const rr = inst.getCellRect(20, 2)
  const liNow = inst.getLayoutInfo()
  out.vScroll = isSel(20, 2) && scrollEl.scrollTop > 0 && rr.y >= liNow.headHeight && rr.y + rr.height <= canvasH()

  // A7 清除时机（标准 6）：切 few → null；边界 clamp；横向滚动；check 就地更新不清除
  comp.setupState.dataScale = 'few'; await sleep(350)
  out.clearedOnRowsChange = sel() === null
  click(2, 2); await sleep(150)
  key('ArrowDown'); await sleep(150)
  out.bottomClamp = isSel(2, 2)
  const lastCol = inst.getLayoutInfo().colWidths.length - 1
  click(2, 0); await sleep(150)
  for (let i = 0; i <= lastCol + 2; i++) key('ArrowRight')
  await sleep(350)
  const lr = inst.getCellRect(2, lastCol)
  out.rightClamp = isSel(2, lastCol)
  out.hScroll = scrollEl.scrollLeft > 0 && lr.x >= 0 && lr.x + lr.width <= canvas.getBoundingClientRect().width + 0.5
  await resetScroll()
  click(1, 0); await sleep(250)                     // check 翻转走 update:cell-value 就地改 record（不换数组）
  out.keptOnInPlaceEdit = isSel(1, 0)

  // A8 可编辑列行为不变（标准 5）
  click(0, 2); await sleep(120)                     // 先选中
  hover(0, 3); await sleep(150)
  out.editableHoverBlue = hasBorder(0, 3, BLUE) && !hasBorder(0, 3, GRAY)
  const logs0 = document.querySelectorAll('.ct-event-log__item').length
  click(0, 3); await sleep(250)
  out.editorOpens = !!document.querySelector('.mu-table-ex__editor') &&
    document.querySelectorAll('.ct-event-log__item').length > logs0
  out.editorClearsSelection = sel() === null

  // A9 回归：自检全绿（含同步后的「hover 编辑感知」用例）
  out.selfChecks = document.querySelectorAll('.ct-check-item--fail').length === 0 &&
    document.querySelectorAll('.ct-check-item--pass').length > 10

  return out
```

剪贴板断言只用包装法（已并入页内段）：`__copyCalls` 记录组件实际 `writeText` 入参；图形列断言 = 调用数不增。不读真实系统剪贴板、不调 `Browser.grantPermissions`（headless 无 document focus 时 `writeText` 会 reject，见风险 8）。

数据切换 / 冻结列均用 `setupState` 直替（`dataScale` main-view.vue:1009、`fixedLeftInput` :1018；vue `<script setup>` 的 setupState 对 ref 赋值即写 .value；赋值后 sleep ≥300ms 再断言）。不点 radio（`.mu-radio` 内部结构随组件实现变动，selector 不稳）。

收尾：`taskkill //F //PID <PID>`；删除 `verify-cell-select.mjs` 与 `/tmp/edge-cellsel`。

## 实施步骤

### 片 1：hover 灰边框 + 点击选中蓝边框（验收 1、5、6 部分）

- 行为判据：附录 A 的 `hoverGray / hoverGone / selBlue / selected / headerClears / editableHoverBlue / editorOpens / editorClearsSelection / selfChecks` 全 true；可编辑格 hover 蓝 / 点击开编辑与改前一致；改动文件 ≤500 行。
- 步骤（按序执行；行号为改前锚点）：
  1. `table-ex.vue`：① :184 `const cursor = ref('default')` 后加 `const selectedCell = shallowRef(null)`；② host 字面量 :220-277 在 `hoverItem,` 后加 `selectedCell,`；③ import 区 :86-92 加 `import { useCellSelect } from './use-cell-select'`；④ :385（`const { onPointerMove, ... } = pointerApi`）之后、:387 步骤 10 之前插入：
     ```js
     // 9.5 单元格选中（selectedCell 已在 shell 声明，本步不回填）
     Object.assign(host, useCellSelect(host))
     ```
     ⑤ :84-85 组装顺序注释补 `useCellSelect` 位次（9 与 10 之间）。
  2. 新建 `use-cell-select.js`：按「use-cell-select.js 契约」实现 `selectCell` / `clearCellSelection` / `watch([displayRows, wiredColumns])` 清除 / `onUnmounted`；keydown 监听部分本片不实现（片 2 补，勿留半成品监听）。
  3. `paint-overlay.js`：按「绘制」节新增 `paintHoverPlainStroke`（挂入 paintHoverOverlay 的 withClip 内、editorStroke 之后）与 `paintCellSelection`（paintOverlay 内 hover 块之后、resizeGuideX 块之前）。
  4. `use-paint-state.js`：:50 `resizeGuideX: null` 后加 `selectedCell: null`；syncPaintState 末尾（:87 后）加 `paintState.selectedCell = ctx.selectedCell.value`；模块头状态清单注释同步。
  5. `use-cell-click.js`：① `finishCellClick` 内把 `resolveCellClickOpen(...)` 结果赋给 `const { openEditor } = ...` 只求值一次，`if (openEditor) { ctx.clearCellSelection?.(); openEditorAt(...) } else { ctx.selectCell?.(hit.rowIndex, hit.colIndex) }`；② `onClick` 表头分支 :155-159 在 `emitHeaderClick(col)` 前加 `ctx.clearCellSelection?.()`；③ `selectRowOnly`（:137）首行加 `ctx.clearCellSelection?.()`。
  6. `use-table-api.js`：`getLayoutInfo` 返回对象（:80-90）在 `headHeight` 后加 `selectedCell: ctx.selectedCell.value ? { ...ctx.selectedCell.value } : null`；上方 JSDoc 的 ctx 键列表补 `selectedCell`。
  7. `demo/src/data/table-ex/self-checks/painter.js`：按改动清单末行改 :901 / :905 两处（各拆成 2 行断言）+ :857 用例名与返回摘要。
  8. 验证：`npm run build`（退出码 0）→ 前置门 → 跑附录 A 全脚本，node 侧 `SLICE_KEYS` 置为片 1 键集（= 行为判据列出的 9 键；其余键本片必然 false，来自未实现的片 2/3，被过滤不影响判定）→ `wc -l` 复核本片 6 个文件 ≤500。
- 文件集合：table-ex.vue、use-cell-select.js、paint-overlay.js、use-paint-state.js、use-cell-click.js、use-table-api.js、demo/src/data/table-ex/self-checks/painter.js。
- 依赖片：无。

### 片 2：Ctrl+C 复制（验收 2、3）

- 行为判据：`copied / checkSelected / checkNotCopied / enumSelected / enumCopied` 全 true（含 enum 映射 label、check 列不动剪贴板）；图形列仍可选中。
- 步骤：
  1. 建 `cell-selection.js`：`CELL_COPY_EXCLUDED_TYPES` + `resolveCellCopyText`（伪代码见「接口」节，类型清单必须最先判）。
  2. `use-cell-select.js`：按「use-cell-select.js 契约」实现 document keydown（attach/detach 幂等 + 四重守卫）与 `copySelection`（`navigator.clipboard?.writeText(text)`，缺失或 reject → devWarn once）。
  3. 验证：build → 前置门 → 附录 A 全脚本，node 侧 `SLICE_KEYS` = 片 1 键集 + `copied/checkSelected/checkNotCopied/enumSelected/enumCopied` → `wc -l`。
- 文件集合：cell-selection.js、use-cell-select.js。
- 依赖片：片 1。

### 片 3：方向键移动 + 边界 + 自动滚动（验收 4）

- 行为判据：`movedDown / movedRight / editableColCopied / topClamp / leftClamp / fixedCol / vScroll / clearedOnRowsChange / bottomClamp / rightClamp / hScroll / keptOnInPlaceEdit` 全 true。
- 步骤：
  1. `cell-selection.js`：`resolveSelectionMove` + `resolveSelectionScroll`（JSDoc 内公式）。
  2. `use-cell-select.js`：`moveSelection`（`live` 快照取 el 实时 scroll，见契约；select 后赋值 scrollTop/scrollLeft）。
  3. 验证：build → 前置门 → 附录 A 全脚本（不过滤，node 退出码 0）→ `wc -l`。
- 文件集合：cell-selection.js、use-cell-select.js。
- 依赖片：片 2（同一监听通道）。

### 集成（终验，无新增文件）

- 行为判据：验收 1-4 + 标准 5-11 全通过。
- 步骤：
  1. `wc -l` 全目录（ex/ 下全部文件 ≤500，追加约束口径；新文件估算 cell-selection ~90 / use-cell-select ~170，超 500 才停）。
  2. `npm run build`（退出码 0）。
  3. 前置门 → 附录 A 全量脚本（node 退出码 0；含 console 错误空、自检 fail=0）。
  4. `git diff -- demo/src/data/table-ex/self-checks/painter.js` 复核仅 3 处 hunk（两处断言 + 用例名/摘要），无额外改动。
  5. `eslint src/components/table/ex demo/src/data/table-ex/self-checks/painter.js`（0 error / warning ≤ 改前基线）；`git status --short` 边界核对；确认无 commit。
  6. 删除 `verify-cell-select.mjs` 与临时目录；停掉前置门启动的 demo watch（`kill $(cat /tmp/demo-build.pid)`，若由本任务启动）。
- 文件集合：无（核对全部）。
- 依赖片：片 1、2、3。

## 未解问题

1. **文档同步范围（decisions.md [设计/1] 已裁定，非未决）**：本任务无公开 props/emits 变化，`getLayoutInfo` 增 `selectedCell` 字段属调试内省（getCellRect 先例未见于用户文档）。按 decisions.md [设计/1] 采默认不动文档（三处：skills/references、quick-reference、docs-site）；实施与验证均不检查文档一致性。
