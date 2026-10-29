# mu-table-ex 合并单元格（cell spans）设计方案

日期：2026-10-29。状态：**第 2 版（终版）**，经三轮评审收敛（design-review-1/2/3），未实施。

本版为最终合入版：以 v1 结构为骨架，融合三轮评审的全部裁定。所有代码锚点已对照当前 worktree 核实。

## 1. 目标与非目标

目标：

- 纵向合并（rowspan）：多级分组报表的连续同值自动合并、显式声明合并。
- 横向合并（colspan）：小计/汇总行跨列。
- 命中、hover、选中、编辑、行高、网格线、固定列、树形、虚拟滚动、条目点击、图片加载全链路行为自洽。
- 无合并时走原实现路径，零回归。

非目标：

- 表头单元格合并（表头恒单行，无场景）。
- 不规则自由报表（表单式任意区域嵌套合并、跨表头分组）。
- 「仅组首行有值、其余为空」的 Excel 式稀疏数据：不合并也不继承值（组内空白格显示空），需要合并请预处理数据补全字段。

## 2. API 设计

### 2.1 设计原则

1. **用户只声明主格**（区域首行首列），被覆盖格由引擎推导。消除 Element/Ant「覆盖格须返回 rowSpan: 0」的易错契约。
2. **声明与几何解耦**：span 只含行列号与跨度，不含像素。列宽调整、行高精算不触发 span 重算，仅重绘。
3. **一条内部路径**：便捷入口编译为统一声明流，规范化器只消费一种输入。

### 2.2 入口 A — 列级 `autoRowSpan`

```js
// 列选项
autoRowSpan: true | string | (record) => any
```

| 取值 | 分组键 | 适用场景 |
|---|---|---|
| `true` | 该列 `valueOf(col, record)`（显示值，含 `mappings` 映射） | 重复值分组（数据已补全） |
| `'categoryId'` | `record.categoryId`（列显示仍走本列原逻辑） | 同名不同 ID、按编码分组 |
| `(record) => key` | 任意原始值 | tag/link 列、条件分组 |

规则：

1. **键比较**：`Object.is`。数组/对象等非原始值恒不相等——tag/link/button 等图形/条目列开 `true` 不会产生任何合并，构建期 dev 警告一次「该列 true 形态不会合并，请用 string 或 Function 键」。
2. **空值不参与**：`null` / `undefined` / `''` 恒不参与合并，同时作为分段边界（用于把小计行从分组中隔离）。Function 形态返回空值同语义。
3. **级联分段（默认且唯一行为）**：同表多列开启时按列序从左到右计算，右侧列的分段在左侧任一 `autoRowSpan` 列的分段起点处强制切断。「分类/子类/名称」三列全开即得正确嵌套；需跨前列边界独立合并时改用 `spanMethod`（`prevRecord` 可表达）。不提供独立分段开关。
4. **树模式**：分段在「层级变化」或「父链（祖先 key 序列）不同」处切断（父链来源见 §5.7）。同层不同父的同值子行不合并且；DFS 前序下父链不同的判定由 `parentKeys` 平行数组推导，不要求数据新增字段。
5. **范围**：仅合并当前 `records`（当前页）内、平铺序上的连续段；只做纵向。
6. **占用格切断**：`spanMethod` 已声明（含待声明，见 §2.4 列级接管）的格不参与自动分段，分段在占用格处切断、不跨过。

### 2.3 入口 B — 表格级 `spanMethod`

```js
spanMethod: (info) => Record<string, number | { rowspan?: number, colspan?: number | 'rest' }> | null

info = {
  record,       // 当前行记录
  recordIndex,  // 平铺行号（树开 = 平铺下标；与 cell-click / update:cell-value 载荷同口径）
  recordNumber, // recordsOffset + recordIndex + 1
  prevRecord,   // 上一行记录，首行 null（自定义「与上一行比较」分组用，免自持状态）
  nextRecord,   // 下一行记录，末行 null
  columns       // 已准备内部列（只读；含 key/field/_raw）
}
```

规则：

1. 每行调用**一次**（O(rows)），返回该行作为**主行**的声明；被覆盖格不声明、不返回。
2. **键解析**：先按 `column.key` 精确匹配；否则按 `field` 匹配。`field` 命中多列时作用于**全部匹配列**并 dev 警告一次（本仓库 demo 已存在同 field 双列写法——`main-view.vue` L386/L429 两列 `field: 'name'`、L427/L428 两列 `field: 'level'`，可编辑性/宽度互不相同，field 定位不可靠）；无匹配列忽略并 dev 警告一次。
3. **值形态**：`number` → `{ rowspan: n }` 糖；对象取 `rowspan` / `colspan`，缺省 1。`rowspan` / `colspan` 非 ≥1 整数（含 Element 风格的 `0`）→ 整条丢弃 + dev 警告。
4. **`colspan: 'rest'`**：展开到当前分区末列（主格在固定列区 = `fixedCount - 1`，滚动区 = 总末列）。数值形态超出分区末列时截断；因固定列边界截断（数值跨界）时 dev 警告一次。
5. **越界**：`row + rowspan > rowCount` 截到 `rowCount`；截断后跨度 < 2 的声明丢弃（无合并意义，不警告）。
6. **重叠**：后到声明与已登记区域有**任一格**重叠 → 整条丢弃 + dev 警告。不做部分截断（矩形差非矩形，不可表达）。
7. 树形列（`_isTreeColumn`）与 `check` 列上的声明丢弃 + dev 警告（缩进槽/每行勾选框与合并语义冲突）。
8. **异常处置**：回调抛错 → 捕获，dev 警告一次（含错误信息），该行按 `null` 处理，不中断整表绘制与交互。
9. **稳定引用**：`spanMethod` 应为稳定引用（computed/方法）；内联箭头函数在父级每次渲染时引用变化 → 每次渲染全量重算 spans + 估高重扫。文档写明。

### 2.4 两入口并存 — 列级接管

- 只要 `spanMethod` 在任一行返回了某列键，该列的 `autoRowSpan` 对**全表失效**（dev info 一次）。同一列一部分自动、一部分手写会产出不可预期的缺口，禁止混用。
- 其余列不受影响；`spanMethod` 声明的区域对 `autoRowSpan` 而言是占用格（§2.2 规则 6）。

示例——已知分组边界每 4 行合并 + 汇总行跨到末列：

```js
:span-method="({ record, recordIndex }) => {
  if (record.isTotal) return { summary: { colspan: 'rest' } }
  return recordIndex % 4 === 0 ? { category: 4 } : null
}"
```

### 2.5 必须写入用户文档的约束

- 合并组的值必须落在**组首行**：组内空白行不继承值、不显示内容。
- 合并结果依赖当前行序（records 顺序/外部排序/分页）；`orderBy` 非空且存在启用中的 `autoRowSpan` 时 dev 警告一次（排序后行序与分组无关，合并块无意义；不自动关闭，避免打断排序交互）。
- `colspan` 不跨固定列边界，跨界被夹紧到分区末列（dev 警告）。
- 合并格内容不参与行高计算；内容超出区域高度按区域可用行数省略。
- `hoverMode: 'row'` / `'column'` / `'cross'` 只高亮命中的物理行/列，不扩展到区域（行级 hover 与合并正交，会被当 bug 报，须显式写明）；`'cell'` 模式高亮整个区域。
- 合并区域内的点击载荷（`cell-click` / `update:selected-*` / 编辑提交）统一为**主行**。
- 合并区域内的选中只能由锚行表达：覆盖行 key 被受控选中时该区域无选中反馈（dev 警告一次）。
- 改 record 值且影响合并时须递增 `records-version`（就地改值 + 版本递增是既有数据通道）。

### 2.6 备选方案与不采用理由

| 备选 | 不采用理由 |
|---|---|
| Element 逐格 `spanMethod({row, column, rowIndex, columnIndex})` | O(cells) 次函数调用；覆盖格返回 0 的契约易错（漏返回即布局破碎） |
| 区域数组 prop（`spans: [{row, col, rowspan, colspan}]`） | 行号随排序/分页/树展开漂移，管理负担转嫁用户；`autoRowSpan` 无法表达 |
| 列级静态 `rowspan`/`colspan` 数值 | 仅适合同构重复行；与 spanMethod 职责重叠 |
| 独立分段开关（关闭级联） | 增加配置面；跨列边界独立合并可由 `spanMethod` + `prevRecord` 表达 |

## 3. 内部模型

新模块 `src/components/table/ex/spans.js`（纯函数，零 DOM，符合 layout/interactions 惯例）。

### 3.1 规范化产物 SpansIndex

```js
{
  // 主格表：row -> col -> { rowspan, colspan }
  anchors: Map<number, Map<number, { rowspan: number, colspan: number }>>,
  // 被覆盖格 -> 主格坐标（命中归一用）
  covered: Map<number, Map<number, { row: number, col: number }>>,
  // 区域列表（构建序，调试/观测用；rowFrom 有序但 rowTo 无序，不可作窗口查询依据）
  regions: Array<{ rowFrom: number, rowTo: number, colFrom: number, colTo: number,
                   row: number, col: number }>,  // rowTo/colTo 排他；row/col 为主格
  // 每行登记与之真正交叠的区域（主格行 + 全部覆盖行）：
  // 窗口相交查询、网格线分段、行带扩展的唯一索引
  rowRegions: Map<number, Array<region>>
}
```

键结构沿用 itemHits 的 `Map<row, Map<col>>` 两层风格。行号为**平铺行号**（displayRows 下标，树开时与 painter/interactions 现行口径一致）。无任何有效区域时返回 `null`（快路径标记）。

### 3.2 规范化规则（buildSpans）

按「行序 → 行内列序」贪心登记，二维格占用集：

1. 声明顺序：先 `spanMethod`（行序、行内列序），后 `autoRowSpan` 填补空位（列级接管已失效的列跳过）。
2. 展开（`'rest'`）、越界截断、固定列边界夹紧在占用检查**之前**完成；截断/夹紧后跨度 < 2 的丢弃（不警告）。
3. 声明主格已被占用，或声明矩形内任一格已被占用 → **整条丢弃**。
4. 每条丢弃带 dev 警告，同一 `(row, col, 原因)` 去重只报一次。
5. 树形列 / check 列声明丢弃（§2.3 规则 7）。
6. `autoRowSpan` 的级联分段、树父链切断、占用格切断在分段计算期完成（§2.2 规则 3/4/6）。

## 4. 组件壳接线（重算时机与行高联动）

`table-ex.vue` 内 `spans = computed`，依赖：`displayRows`、`wiredColumns`、`props.spanMethod`、`props.recordsVersion`、`props.orderBy`（防御：父级只改 orderBy 未替换 records 引用时仍重算）。

- records 替换、树展开/收起、列集变化、span-method 引用变化、recordsVersion 递增（就地改值）、orderBy 变化 → 重算 + relayout（与既有 relayout 触发点同批次，不新增独立 watch）。
- 列宽调整（widthOverrides/调宽拖拽）、行高精算回填、hover 变化 → **不**重算。
- 重算产物经 `syncPaintState` 注入 `paintState.spans`。

**行高联动**（row-geometry-controller.js）：

- `relayoutAndRedraw` 开头取一次 `spans.value`，传入 `rowGeometry.resolveForRelayout`。
- `isScanDirty`（L141-145，现行三维度：行集合引用/metricsSig/columnSig）增加 **spans 身份**（引用不等即重扫）——否则 spanMethod 变化而行集合不变时，「合并格不参与行高」不生效。
- `estimateColumnSignature`（L69-74）增加 `_autoRowSpan` 标记。
- 精算缓存（`measuredRowHeights`）随 spans 身份变化整体失效（spans 引用并入 `measureSignature` 判定或变化即清空）。

## 5. 消费点改动

### 5.1 painter.js — 绘制（null 分支两遍式）

`paintCellRange(ctx, state, rows, cols, bandToX)` 改为 null 分支隔离：

```
if (!state.spans) → 原实现逐字保留（逐行「背景带 + 逐格内容」单遍），无合并表格零改动
else → 两遍式：
  ① 逐行背景带 + 非 covered/anchor 格内容（原循环去掉 span 格）
  ② region pass：遍历与 rows 相交的 region（经 rowRegions 查询，判定 = 区域与 rows
     参数相交，不是锚行 ∈ rows）——先以锚行背景色 fillRect 区域包围盒（统一
     striped/选中底色），再绘制主格内容（区域矩形，含 itemHits 收集、veil 判定）
```

要点：

- 主格内容不依赖锚行是否在窗口/脏带内：区域与绘制区间相交即绘制，窗口外由既有 clip（clipIfPartial / pass 级 withClip）自然裁剪。锚行滚出窗口、区域仍可见时内容不消失——这是 region pass 存在的意义。
- 三段式背景顺序保证区域底色不被下方行背景带重盖（v1 方案在行升序循环内铺区域底色，会被后续行背景带覆盖，已废弃）。
- `paintFixedArea` 内部走 `paintCellRange`，自动获得两分支。
- **垂直锚**：主格内容垂直居中于区域：`centerY = rect.y + ROW_TOP_INSET + (regionH − ROW_TOP_INSET) / 2`。单行时与现行「行线间空白中点」公式退化一致；多行文本/条目以内容块（lines × lineHeight）居中。`drawCell` 的 centerY 锚定机制不改，仅传区域 centerY。
- **行数上限**：主格内容行数上限 = `min(col.maxLines, floor((regionH − padding×2) / lineHeight))`，绘制期求值（矩形已知），无循环依赖。
- **`rightInsetOf`**（painter.js:300-306）：主格按区域末列 `col + colspan − 1` 取右缘列线占位，否则右对齐/居中文本偏移 0.5px。

**网格线分段（paintGridlines）**：

- 行线：行 `r` 底线跳过 `rowFrom < r < rowTo`（内部行）的 `[colLefts[colFrom], colLefts[colTo]]` x 区间（从 `rowRegions` 取相交区域，O(1) 定位）。
- 列线对称：列 `c` 右缘竖线跳过 `colFrom < c < colTo` 的 y 区间。
- 无相交区域时保持整条绘制（原路径）。

**hover（paintOverlay）**：

- `hoverMode: 'cell'`：高亮/可编辑格描边/编辑按钮区矩形 = `spanRectOf` 区域矩形。
- `row` / `column` / `cross`：维持物理行/列矩形不动（正交语义，写入文档 §2.5）。
- veil：编辑中格即主格（命中已归一），`veilEditingCell` 不改。

### 5.2 painter.js — 脏区归一扩展（invalidate 入口统一收敛）

`createPainter.invalidate`（painter.js:1134-1145）入口统一处理，**顺序固定：归一 → 扩展 → 校验 → 绘制**：

- **归一**：`{cell: {row, col}}` 为 covered 格 → 改写为主格坐标。
- **扩展**：`{cell}` 与 `{rows}` 的 range **与 clip 一并扩展到相交 region 的区域包围盒**（经 rowRegions）。
- **校验**：`isRegionPaintable`（L1060-1076）以**扩展后**的 range 判定——归一扩展必须先于校验，否则锚行滚出窗口时行带/单格失效被 `rowsRegionPaintable` / `cellRegionPaintable` 拒绝。
- `{cols}` **不扩展**：`paintColBand` 带高恒为 `[headHeight, stickyHeight]` 整高、行范围取整个 viewRows（painter.js:880-910），区域内可视行全部重画，region pass 按 rows 相交自然覆盖。若将来新增部分高度的列带脏源，须同样扩展。

壳侧全部失效调用**保持原样**：`hoverRegions` / `hoverItemCells` / veil / `onCommit` 的 `invalidate({cell})` / `invalidateRow` 不改（壳侧恒传 `immediate: true`，table-ex.vue:390-403 G2-a 契约；painter 的 rAF 合帧路径在本组件永不触发，不依赖）。

必须扩展的脏源（不扩展的后果）：

| 脏源 | 现状 | 不扩展的后果 |
|---|---|---|
| `hoverMode: 'cell'` hover 移出区域 | `invalidate({cell: anchor})` | 区域下半高亮残留 |
| 可编辑格 hover 描边 | `invalidate({cell: anchor})` | 描边残影 |
| 编辑 veil | `invalidate({cell: anchor})` | 浮层下露出旧内容/旧条目 |
| 行选中（watch selected → `invalidateRow(anchor)`） | `paintRowBand` clip 收敛单行带 | 区域底色只在锚行生效，覆盖行保持旧色 |
| 行带重绘 | clip 收敛脏带 | 区域「内容新、背景旧」错位 |

### 5.3 条目命中与图片重绘（锚行滚出窗口场景）

- **`trimItemHits`**（painter.js:210-216）现行按 `viewRows` 裁剪——锚行滚出窗口即删该行条目命中，区域内 link/tag/button 点不中。改：增加 `keepRows` 入参（本帧 region pass **实际绘制的锚行集合**，与 itemHits 收集同一次遍历产出，不另行按 rowRegions 推导——避免双源漂移），`row ∈ keepRows` 时保留。
- **`cellRegionPaintable`**（painter.js:1051-1057）现行要求 `row ∈ [viewRows.start, viewRows.end)`——锚行在外时 `invalidateCell`（img onload 经 painter.js:1097-1103 转发）被拒，图片永不重绘。改：行列命中可视窗口**或**所属区域与窗口相交即放行（§5.2 的扩展后校验已覆盖，此处为判定口径说明）。
- `isEditorButtonHit`（table-ex.vue:719）等壳侧矩形命中用 `cellRectAt` 的点，统一换 `spanRectOf` 包装。

### 5.4 interactions.js / 组件壳 — 命中归一

`hitAt` 出口统一归一（单一接入点，避免散点遗漏）：

```js
const hit = hitTest({...})
const normalized = spans ? resolveSpanCell(spans, hit) : hit  // 浅拷贝，仅覆盖 rowIndex/colIndex
```

- 归一后 hit 供：`resolveCursor`、`updateHover`、`updateHoverItem`、`applyItemCursor`、`isEditorButtonHit`、`tryEditorButtonClick`、`finishCellClick`、`openEditorAt`、`resolveItemClick`（含 `resolveCellClick` / `resolveCellClickOpen`）。
- `resolveTreeToggle` 用**原始** hit（树列无合并，归一前后不变）。
- **cellX 契约**（显式写明，防未来踩坑）：`cellX` 语义绑定**原始命中列**内容区偏移，归一**不重算**。当前唯一消费者是树槽判定（isTreeArrowSlot）且树列恒不被归一改写，故安全；新增 cellX 消费点前必须先重算或改锚（以主格列左缘为基准重算相对偏移）。
- `x` / `y` / `beyondCols` / `resizeCol` 原样保留。
- `resolveSpanCell` / `spanRectOf` 定义在 spans.js。

### 5.5 editor.js — 编辑

- `computeEditorStyle`（editor.js:264-306）的 `cellRect` 来源换 `spanRectOf` 结果（编辑浮层覆盖整个合并区域；由组件壳传入矩形或 spans，模块不 import spans.js 亦可——实施时择一，保持 editor.js 不依赖 painter 的现状）。
- **`editorGridlineFlagsOf`**（editor.js:68-78）增加可选 `rowFrom` / `colTo` 入参（缺省回退现行 `rowIndex` / `colIndex + 1`）：
  - `topGridline` 取 `rowFrom > 0`（现行按 `rowIndex > 0` 碰巧正确——锚行即 rowFrom，显式化防锚点定义将来变化）。
  - `rightGridline` 按 `colTo − 1` 是否末列判定：colspan 区域右缘在末列且无空白尾时，按锚列判定会误缩 1px，浮层与格线错位。
- 提交 `recordIndex` = 主行号（归一已保证）；`resolveEditorType` 的 textarea 判定对主格照常生效，开值取主行记录。
- 合并格可编辑性不特殊排除：编辑主格 = 编辑主行记录该字段，语义自洽；被覆盖格无命中路径，天然不可编辑。

### 5.6 row-geometry.js — 行高

`computeRowHeights` / `ensureRowMeasured` 增加可选 `spans` 入参（null 时零成本，保持既有调用兼容），列循环按分层处理：

| 格 | 行高参与 | 模式判定（`hasArrayValues`） |
|---|---|---|
| covered 格 | 排除 | 排除 |
| 主格 rowspan > 1 | 排除 | **排除**（被排除格持有数组值不得触发变高模式升级——row-geometry.js:399-400 的 `indicatesVariableMode` 同步跳过） |
| 主格 rowspan === 1 && colspan > 1 | 按**区域宽**（`Σ colWidths[colFrom..colTo)`）参与本行 | 参与 |
| 其余（含 colspan > 1 之外的主格、普通格） | 单列宽 | 参与 |

内容超出区域高度由绘制期行数上限兜底（§5.1），不回流行高。

### 5.7 tree.js / use-tree-rows.js — 父链输出

- `buildFlatRows`（tree.js:100-127）显式栈项（现行仅 `{record, level}`，L84-87 `pushChildren`）补 `parentKey` 字段，产出 `parentKeys: Array<key|null>` 平行数组（与 rows/levels 同序；根行为 null）。
- `use-tree-rows` 的 `flatRows` / `flatInfo` 透出 `parentKeys`。
- `buildSpans` 树模式消费：分段在 `levels` 变化或 `parentKeys` 祖先链不同的行切断。
- 单一事实源：不在 spans 构建期另行 DFS 推导。

### 5.8 选中与事件载荷

- `isSelectedRow` / `rowBackground`（painter.js:149-165）不改判定逻辑：区域底色由 region pass 以锚行背景重铺，锚行选中 → 区域整块选中色；点击区域任意处（归一后）选中锚行。
- 覆盖行 key 被受控选中（父级直接写 `selectedRecordKey`）→ 区域无选中反馈，dev 警告一次（§2.5）。
- `cell-click` / `update:selected-record-key` / `update:selected-record` / 编辑提交载荷统一主行，不携带原始命中行。

## 6. 交叉功能约束矩阵

| 功能 | 行为 |
|---|---|
| 排序（orderBy 受控） | 不清空合并；行序变化经 records 引用/recordsVersion/orderBy 触发重算；orderBy + autoRowSpan dev 警告一次 |
| 分页（recordsOffset） | 合并限当前页；recordNumber 口径不变 |
| 固定列（fixedLeftColumns） | colspan 不得跨界（夹紧 + 警告）；rowspan 与固定区重绘兼容（paintFixedArea 走两遍式） |
| 调宽（resizable） | 不重算 spans；区域宽随列宽伸缩，内容按区域重排/省略 |
| striped | 区域整块取锚行背景（含斑马态） |
| 行选中 | 区域整块随锚行选中态；覆盖行被选中无反馈（警告）；失效行带扩展到区域 |
| 行高变高模式 | rowspan>1 主格与 covered 格不参与行高与模式判定；colspan 主格按区域宽；内容按区域高折行居中 |
| 编辑 | 浮层 = 区域矩形（格线内缩按区域外缘）；veil 主格；提交主行 |
| 条目点击（link/tag/button） | 条目矩形属主格坐标系；命中归一后反查；锚行滚出窗口 keepRows 保命中 |
| img 列 | 锚行在窗口外时 invalidateCell 放行（区域相交判定），图片正常重绘 |
| hover | cell 模式 = 区域矩形；row/column/cross = 物理行/列（正交，文档写明） |
| 树形 | 平铺行号口径；父链切断；树形列/check 列声明丢弃 |
| beyondCols 空白区 | 不参与合并 |

## 7. dev 警告清单（开发构建，按 `(row, col, 原因)` 去重）

| 场景 | 级别 |
|---|---|
| spanMethod 声明与已登记区域重叠 / 主格已占用 → 整条丢弃 | warn |
| 树形列 / check 列声明丢弃 | warn |
| 键解析：field 命中多列（作用于全部） | warn 一次/列 |
| 键解析：无匹配列 | warn 一次/键 |
| rowspan/colspan 非 ≥1 整数（含 0） | warn |
| colspan 数值跨固定列边界被夹紧 | warn |
| 图形/条目列 `autoRowSpan: true` 不产生合并 | warn 一次/列 |
| 列级接管：spanMethod 返回某列键 → 该列 autoRowSpan 全表失效 | info 一次/列 |
| orderBy 非空且存在 autoRowSpan | warn 一次 |
| 覆盖行 key 被受控选中，区域无选中反馈 | warn 一次 |
| spanMethod 抛异常（含错误信息，该行按 null） | warn |

## 8. 性能预算

- `buildSpans`：O(rows × 声明数 + Σ覆盖格)；autoRowSpan 为 O(rows) 单列扫描 × 开启列数；rowRegions 构建 O(区域面积)（≤ 格总数）。
- 每帧绘制：covered/anchor 查询 O(1)；region 遍历 O(窗口行数 + 命中区域数)（rowRegions 逐行取并集，rowTo 无序问题不存在）；网格线分段同源。
- 无 spans：`paintCellRange` 走原实现分支（逐字保留），所有查询点一次 null 判断短路——**零回归承诺成立**，不以「像素等价」降级。
- 脏区扩展只在有相交 region 时发生，扩展后的重画幂等，单次交互成本可接受。

## 9. 自检（demo/src/data/table-ex/self-checks/spans.js，及同步）

纯函数同步断言：

1. 级联分段：三列 `autoRowSpan`，同一子类值跨分类时产出两段。
2. `autoRowSpan: 'field'` 与 Function 键；Function 返回 `undefined` 作分段边界（小计行隔离）。
3. tag 列 `autoRowSpan: true` 不合并 + 警告。
4. 树：同层不同父同值不合并；层级变化处切断（parentKeys）。
5. spanMethod 键解析：key 优先、field 唯一命中、多列命中警告、无命中警告。
6. `colspan: 'rest'` 展开到分区末列；数值跨界夹紧 + 警告。
7. 重叠整条丢弃；越界截断；`rowspan: 0` 忽略；截断后跨度 < 2 丢弃不警告。
8. `resolveSpanCell`：covered → anchor、anchor/普通格原样、null spans 短路；浅拷贝仅改 rowIndex/colIndex（cellX/x/y 不变断言）。
9. `spanRectOf`：等高/变高、单行退化 = `cellRectAt`、colspan 区域矩形。
10. 行高分屧行为：rowspan>1 主格与 covered 格不计入且不触发 hasArrayValues；colspan 主格按区域宽计入。
11. `rowRegions`：窗口查询结果 = 所有与窗口相交的 region（含锚行在窗口上方的跨行长区域）。
12. spanMethod 异常：抛错行按 null，整表构建不中断。
13. `editorGridlineFlagsOf` rowFrom/colTo 入参：区域右缘在末列不误缩；缺省回退现行行为。

demo（`demo/src/data/table-ex/main-view.vue` 新增示例组）+ 浏览器断言：

14. hover 从合并区域移出后区域无残影（cell 模式）。
15. 锚行滚出窗口、区域仍可见：区域内条目可点、img 加载后重绘。
16. 锚行选中后覆盖行底色随动（行带脏区扩展）；覆盖行受控选中出现警告。
17. 三级分组报表（分类/子类/名称）全开 autoRowSpan + 组内小计行（spanMethod + 'rest'）+ 首列固定。
18. 合并格单击选中/编辑/条目点击，事件日志验证载荷为主行。
19. 树 + autoRowSpan：展开收起后跨父不合并。
20. 打开排序：合并随行序重算 + dev 警告。

无 spans 回归：既有 painter/interactions/row-geometry/editor 自检全量通过（null 分支走原实现）。

## 10. 实施分期

- **P0（rowspan 全链路）**：spans.js（autoRowSpan 三形态 + 级联 + 树父链、spanMethod rowspan）、null 分支两遍式 + region pass、网格线行线分段、背景统一、脏区归一扩展（含校验时序）、命中归一 + cellX 契约、编辑矩形 + rowFrom、行高分层数据链、trimItemHits keepRows / cellRegionPaintable 区域判定、tree.js parentKeys、自检 1–4/7–12/14–16/19–20 + 既有回归。
- **P1（colspan）**：'rest' 展开与固定列夹紧、editorGridlineFlagsOf colTo、列线分段、汇总行 demo（自检 5/6/13/17 中 colspan 相关）。
- 文档三处同步（skills/mussel-ui/references、docs/quick-reference、docs-site）在 P0+P1 完成并经用户确认后进行。

## 11. 涉及文件

| 文件 | 改动 |
|---|---|
| `src/components/table/ex/spans.js` | 新增：buildSpans（级联/父链/占用/整条丢弃）、spanRectOf、resolveSpanCell、SpansIndex（anchors/covered/regions/rowRegions） |
| `src/components/table/ex/table-ex.vue` | spanMethod prop、spans computed（含 recordsVersion/orderBy 依赖）、paintState 注入、hitAt 出口归一、编辑矩形接线 |
| `src/components/table/ex/painter.js` | paintCellRange null 分支两遍式、region pass、网格线分段、rightInsetOf 区域末列、hover/编辑按钮区域矩形、invalidate 入口归一扩展（先于校验）、trimItemHits keepRows、cellRegionPaintable 区域相交判定 |
| `src/components/table/ex/interactions.js` | 消费侧注释更新（归一在壳侧 hitAt 出口） |
| `src/components/table/ex/editor.js` | computeEditorStyle 矩形来源、editorGridlineFlagsOf 增 rowFrom/colTo |
| `src/components/table/ex/row-geometry.js` | computeRowHeights / ensureRowMeasured 可选 spans 入参、行高分层数据链、hasArrayValues 跳过 |
| `src/components/table/ex/row-geometry-controller.js` | isScanDirty 增 spans 身份、estimateColumnSignature 增 _autoRowSpan、精算缓存随 spans 失效 |
| `src/components/table/ex/cell-painters.js` | prepareColumn 挂 `_autoRowSpan`、drawCell 区域 centerY 与行数上限（区域高入参） |
| `src/components/table/ex/tree.js` | buildFlatRows 栈项补 parentKey、产出 parentKeys 平行数组 |
| `src/components/table/ex/use-tree-rows.js` | flatRows/flatInfo 透出 parentKeys |
| `demo/src/data/table-ex/self-checks/spans.js` | 新增自检（§9） |
| `demo/src/data/table-ex/self-checks/tree.js` | parentKeys 断言同步 |
| `demo/src/data/table-ex/main-view.vue` | 合并示例组（§9 demo） |

---

### 附：v1 → v2 关键决策变更记录（实施者须知）

| v1 方案 | v2 终案 | 原因 |
|---|---|---|
| spanMethod 按 field 定位、rowIndex 签名 | key 优先→field（多列命中作用全部+警告）、recordIndex/prevRecord/nextRecord/columns 签名 | demo 已有同 field 双列；「与上一行比较」免自持状态 |
| autoRowSpan 仅 true | true / string / Function 三形态 + 级联分段 + 树父链切断 + 图形列警告 | 多级分组跨组错位；tag/link 列不可用；同名不同 ID 误合并 |
| colspan: 999 魔法值 | `colspan: 'rest'` + 跨固定列夹紧警告 | 魔法值依赖内部截断实现 |
| 逐格冲突丢弃 | 列级接管（该列 autoRowSpan 全表失效） | 同列半自动半手写产出不可预期缺口 |
| 重叠「截去重叠部分」 | 整条丢弃 | 矩形差非矩形，不可实现 |
| 绘制窗口下探（行循环起点下探） | region pass 两遍式（null 分支保原路径） | 窗口下探解决不了背景被后续行带重盖；原路径逐字保留保零回归 |
| 主格绘制时铺区域底色（行循环内） | ①全行背景 → ②区域底色 → ③内容与 region pass | 行升序循环下主格底色被下方行背景带覆盖 |
| regions 按 rowFrom 有序线性扫描 | rowRegions 每行登记 | rowFrom 有序 ⇏ rowTo 有序，线性提前终止不成立 |
| 脏区未处理 | invalidate 入口统一归一扩展，先于 isRegionPaintable 校验；{cols} 不扩展（整高带自然覆盖） | hover/veil/选中/行带背景的残影与错位；锚行滚出窗口被 paintable 拒绝 |
| hitTest 后散点归一 | hitAt 出口统一归一 + cellX 契约显式化 | resolveCursor/编辑按钮等消费原始 hit 的遗漏 |
| 合并格内容不参与行高（一刀切） | 分层：rowspan>1 排除、colspan 主格按区域宽 | colspan 主格按单列宽会高估行高 |
| 估高脏判定不感知 spans | isScanDirty 增 spans 身份 + hasArrayValues 跳过被排除格 | spans 变化行集合不变时不重扫；数组值误触发变高升级 |
| — | trimItemHits keepRows、cellRegionPaintable 区域相交、editorGridlineFlagsOf rowFrom/colTo、覆盖行选中警告、orderBy 依赖、spanMethod 异常处置 | 三轮评审新发现（锚行滚出窗口的条目/img/描边/选中链路） |
