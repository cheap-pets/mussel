# mu-table-ex 合并单元格设计审阅 + 修订（第 1 轮）

日期：2026-10-29。审阅对象：同目录 `design.md`（下称"原设计"）。本文件可直接替换原设计 §2，并列出其他章节须同步修订的条目。

## 1. 结论

原设计的内部模型（SpansIndex / 主格声明 / 零成本快路径）成立，不推翻。问题集中在两处：

- **API 对真实场景的覆盖有硬缺口**：多级分组（分类/子类）会跨组合并；`spanMethod` 无法表达"与上一行比较"之外的大多数自定义分组，也无法定位无 `field` 列；`autoRowSpan` 的分组键只取显示值，tag/link 列与"同名不同 ID"都不可用。
- **绘制顺序与脏区归一有正确性缺口**：合并区域背景会被后续行覆盖；`{ cell }` 脏区未扩展到区域外缘，hover/编辑/条目高亮会画不出来或留残影。

修订后的 API 比原设计更小（去掉一处逐格警告、去掉一处魔法值），但表达力更强。

## 2. 问题清单

### 2.1 致命

**[致命] §2.2 入口 A：多列 `autoRowSpan` 相互独立扫描，多级分组报表合并错位。**
「分类 / 子类 / 名称」三列同时开启时，`子类` 的相同值会跨 `分类` 边界合并（如"其他/办公"在下一分类再次出现），左侧主格与右侧从格不再对齐，是分组报表最典型的用法。
建议：改为**级联分段**——按列序从左到右处理，右侧列的分段在左侧任一 `autoRowSpan` 列的分段起点处强制切断。默认行为即级联，不提供关闭开关（需要独立合并的用 `spanMethod` 表达）。见 §3.1。

**[致命] §5.1 行背景绘制顺序错误。**
`paintCellRange` 按行升序循环，`paintBodyRow` 先填整行背景再画内容。主格在自己那一行 `fillRect` 整个区域后，下方各行随后各自填行背景，把合并区域下半部分重新盖成自己的条纹/常态色。原设计"主格先铺区域底色，覆盖下方各行条纹"依赖主格最后绘制，与实际循环顺序相反。
建议：绘制拆成"全部行背景 → 区域底色重铺 → 内容"三段，主格内容放到区域底色之后。见 §4.1。

**[致命] §5.1 只处理了整幅绘制的窗口扩展，未处理脏区。**
`paintCellRegion` 的 clip 取单格矩形 `(row, col)`，`paintRowBand` / `paintColBand` 的 range 也只含命中格所在行列；`hoverRegions` / `hoverItemCells` / 编辑 veil 的 `invalidate({ cell })` 全部按**单格**失效。合并格的主格矩形是区域包围盒，按单格 clip 绘制的结果是：hover 高亮只亮一角、编辑描边被裁掉、veil 盖不住整个区域、条目矩形残留在浮层下。
建议：painter 内统一做「区域归一 + range 扩展」，作为所有脏区入口的唯一收敛点；壳侧 `invalidate` 调用不改。见 §4.2。

### 2.2 警告

**[警告] §2.2 入口 B：`spanMethod` 只能按 `field` 定位列，且同 `field` 多列有歧义。**
- 无 `field` 的 `text` / `value` 列直接被排除（dev 警告），而这类列在报表里常用于展示计算值。
- 本仓库 demo 已存在同 `field` 多列（`main-view.vue` 中两列 `field: 'name'`、两列 `field: 'level'`）。按 field 定位会产生"一处声明作用于多列"或"只作用于其中一列"的不确定语义。
建议：键解析顺序改为 `column.key` → 唯一 `field`；`field` 匹配多列时作用于全部匹配列并 dev 警告一次；无匹配列 dev 警告。见 §3.2。

**[警告] §2.2 入口 B：回调信息不足。**
只给 `({ record, recordNumber, rowIndex })`，用户要实现"与上一行比较"必须自持状态（维护上一次 record），这既啰嗦又在 records 重排时容易错。
建议：签名补 `prevRecord` / `nextRecord` / `columns`；`rowIndex` 更名 `recordIndex`（与 `cell-click` / `update:cell-value` 载荷同口径）。见 §3.2。

**[警告] §2.2 入口 A：分组键只取显示值，tag / link 列完全无法合并，同名不同 ID 会误合并。**
`valueOf` 对 `link` / `tag` / `button` 列返回数组或对象，`===` 恒 false → 这些列开 `autoRowSpan` 静默无效（状态标签列合并是很常见的需求）。反过来，两个不同 ID 但显示同名的记录又会被错误合并。
建议：`autoRowSpan` 接受 `true | string | Function`：string 取记录字段作分组键，Function 返回任意键。见 §3.1。

**[警告] §2.2 入口 B：`colspan: 999` 是魔法值，且固定列截断没有任何提示。**
"跨到末列"写 999 依赖内部截断实现；`colspan` 跨固定列边界被截断时用户只看到合并宽度莫名变窄。
建议：支持 `colspan: 'rest'`（到当前分区末列）；固定列边界截断保留，但 dev 警告一次并写明文档。见 §3.2。

**[警告] §3.2 规则 4「截去重叠部分」不可实现。**
两个矩形求差通常不是矩形（后到区域被先到区域切掉拐角后剩余 L 形），无法用 `{rowspan, colspan}` 表达，实现方只能临时做非矩形裁剪，模型和绘制都会崩。
建议：改为**整条丢弃**——后到声明若与已登记区域有任一格重叠，整条丢弃 + dev 警告。判定成本 O(声明跨度)，语义确定。见 §4.3。

**[警告] §4 / §5.4：`row-geometry` 的扫描签名不感知 spans。**
`createRowGeometryController.resolveForRelayout` 的脏判定只有行集合引用 / 度量签名 / 列语义签名。当 `spanMethod` 引用变化导致 spans 变化、而行集合不变时，估高扫描被跳过，"合并格不参与行高"不会生效。
建议：`isScanDirty` 增加 spans 身份（引用不等即重扫）；`estimateColumnSignature` 增加 `_autoRowSpan` 标记；`computeRowHeights` / `ensureRowMeasured` 加可选 `spans` 入参。见 §4.4。

**[警告] §4 重算时机漏了 `recordsVersion`。**
spans 只依赖 `displayRows` / `wiredColumns` / `spanMethod`。用户就地改 `record` 值后递增 `recordsVersion` 是既有数据通道（`A3 数据契约②`），此时合并不会重算——改了分类值，合并仍按旧值。编辑提交后同理（`onCommit` 内只有 `remeasureRow` + `invalidateRow`）。
建议：`spans` computed 增加 `props.recordsVersion` 依赖；编辑提交路径复用同一次重算。见 §4.4。

**[警告] §5.1 / §8：用 `regions` 按 `rowFrom` 排序做窗口相交查询，无法提前终止。**
`rowFrom` 有序只能保证"后续 region 起点更晚"，不能保证"后续 region 终点更晚"——一个从第 0 行开始、跨 500 行的 region 会命中任意靠后的窗口。原设计的"线性/二分扫描至 rowTo ≥ 窗口顶"不成立（`rowTo` 无序）。
建议：构建期同时产出 `rowRegions: Map<row, region[]>`（含主格行与全部覆盖行），窗口查询 O(窗口行数 + 命中区域数)，网格线分段同源。见 §4.1。

**[警告] §2.2 / §5.5 树模式只按 `flatInfo.levels` 切断。**
DFS 前序下"同层级 + 同值 + 不同父"仍会合并（A 组和 B 组都有"其他"子项）。原设计把这推给用户 spanMethod，但树 + 分组是常见组合。
建议：构建期维护祖先栈，按「层级变化 或 父链不同」切断。见 §3.1。

**[警告] §2.2 / §6：`orderBy` 生效时静默产生无意义合并。**
点击表头排序后，行序与分组无关，`autoRowSpan` 会把不相邻也相等的值合并成随机块，视觉上像渲染 bug。
建议：`orderBy` 非空且存在启用中的 `autoRowSpan` 时 dev 警告一次（不自动关闭，避免打断排序交互）。见 §3.4。

### 2.3 小问题

- **[小问题] §5.1 `rightInsetOf`**：`rightInset`（右缘列线占 1px）取的是 `colIndex`，合并格的右缘应是 `col + colspan - 1`。否则右对齐/居中文本偏移 0.5px。
- **[小问题] §5.2 归一化清单漏了 cursor 与编辑按钮**：`onPointerMove` 里 `resolveCursor` / `applyItemCursor` / `isEditorButtonHit` 都用原始 `hit.colIndex`，且 `isEditorButtonHit` 用 `cellRectAt`。合并格内的光标形态与编辑按钮命中会与绘制不一致。归一化必须在所有消费点之前（或统一在 `hitAt` 出口归一）。
- **[小问题] §A1 `getCellRect(row, col)`**：对主格应返回区域矩形，对覆盖格应映射到主格，否则 playwright 坐标级验证与 `getCellRect` 文档语义不符。
- **[小问题] §11 文件表笔误**：`src/components/table/cell-painters.js` → `src/components/table/ex/cell-painters.js`。
- **[小问题] §1 非目标缺一条**：真实数据常见的"仅组首行有值、其余为空"（Excel 空白填充）不合并也不继承值。应写进非目标并给出数据预处理建议，避免用户反复试错。

### 2.4 疑问（需确认，不阻塞）

- **[疑问] §5.2 与 §5.1 hover 模式语义不一致**：`hoverMode: 'row'` 时覆盖行只高亮该物理行，但点击选中主行、区域整块变为选中色。两种反馈对同一区域给出不同行归属。建议保持该行为（行级 hover 与合并正交），但必须写入文档，否则会被当 bug 报。

## 3. 修订后的 §2 API 设计（建议直接替换原文）

### 3.1 入口 A — 列级 `autoRowSpan`

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

1. **键比较**：`Object.is`。数组 / 对象等非原始值恒不相等（`true` 形态下 tag/link/button 列因此不合并；需要合并请传 `string` 或 Function）。
2. **空值不参与**：`null` / `undefined` / `''` 恒不参与合并。Function 返回上述值表示该行不参与合并，同时作为分段边界（用于把"小计行"从分组中隔离）。
3. **级联分段（默认且唯一行为）**：同表多列开启 `autoRowSpan` 时，按列序从左到右计算，右侧列的分段在左侧任一 `autoRowSpan` 列的分段起点处切断。
   - 「分类 / 子类 / 名称」三列同时开启即得到正确嵌套，无需额外配置。
   - 需要跨前列边界独立合并时，改用 `spanMethod`（`prevRecord` 可表达）。
4. **树模式**：分段在「层级变化」或「父链（祖先 key 序列）不同」处切断。祖先链由 DFS 前序遍历的栈推导，不额外要求数据字段。
5. **范围**：仅合并当前 `records`（当前页）内、平铺序上的连续段；不限固定列分区（只做纵向）。
6. `spanMethod` 已占用（或待占用）的格不参与自动分段：分段在占用格处切断，不跨过去。

### 3.2 入口 B — 表格级 `spanMethod`

```js
spanMethod: (info) => Record<string, number | { rowspan?: number, colspan?: number }> | null

info = {
  record,         // 当前行记录
  recordIndex,    // 平铺行号（树开 = 平铺下标；排序/展开后变化）
  recordNumber,   // recordsOffset + recordIndex + 1（与事件载荷同口径）
  prevRecord,     // 上一行记录，首行为 null
  nextRecord,     // 下一行记录，末行为 null
  columns         // 已准备内部列（只读；含 key/field/_raw）
}
```

规则：

1. 每行调用一次（O(rows)），返回该行作为**主行**的声明；被覆盖格不声明、不返回。
2. **键解析**：先按 `column.key` 精确匹配；否则按 `field` 匹配。`field` 命中多列时作用于全部匹配列并 dev 警告一次；无匹配列时忽略并 dev 警告一次。
3. **值形态**：`number` → `{ rowspan: n }`；对象取 `rowspan` / `colspan`，缺省 1。`rowspan` / `colspan` 非 ≥1 整数（含 `0`）→ 整条丢弃 + dev 警告。
4. **`colspan: 'rest'`**：到当前分区末列（无固定列 = 到总末列）。数值超出分区末列时截断，且因固定列边界截断时 dev 警告一次。
5. **越界**：`row + rowspan > rowCount` 截到 `rowCount`；截断后跨度 < 2 的声明丢弃（无实际合并意义，不警告）。
6. **重叠**：后到声明与已登记区域有任一格重叠 → 整条丢弃 + dev 警告（见 §4.3）。
7. 树形列（`_isTreeColumn`）与 `check` 列上的声明丢弃 + dev 警告（缩进槽 / 每行勾选框与合并冲突）。
8. 声明顺序：先 `spanMethod`（行序、行内列序），后 `autoRowSpan` 填补空位。

### 3.3 两入口并存

- 列级接管：只要 `spanMethod` 在任一行返回了某个列键，该列的 `autoRowSpan` 对全表失效（dev info 一次）。
- 其余列不受影响；`spanMethod` 声明的区域对 `autoRowSpan` 而言是占用格（见 §3.1 规则 6）。
- 不采用原设计的"逐格冲突丢弃 + 逐格警告"：同一列一部分自动、一部分手写会产出不可预期的缺口。

### 3.4 必须写入文档的约束

- 合并组的值必须落在**组首行**：组内空白行不继承值，也不显示内容。
- 合并结果依赖当前行序（`records` 顺序 / 外部排序 / 分页）；`orderBy` 生效时 dev 警告一次。
- `colspan` 不跨固定列边界；跨界的 `colspan` 会被夹紧到分区末列。
- 合并格内容不参与行高计算；内容超出区域高度时按"区域可用行数"省略。
- `hoverMode: 'row'` 只高亮命中的物理行，`row` / `column` / `cross` 模式不扩展到区域；`cell` 模式高亮整个区域。
- 合并区域内的点击载荷（`cell-click` / `update:selected-*` / 编辑提交）统一为主行。

## 4. 内部模型与绘制修订

### 4.1 绘制顺序（取代原设计的"绘制窗口扩展"）

原设计靠"把行循环起点下探到最小 `rowFrom`"解决窗口外主格，副作用是大 rowspan 时每帧多画 O(组大小) 行，且仍解决不了背景覆盖问题。改为按分区拆段：

```
paintCellRange(rows, cols):
  1. 行背景：按 rows 循环整带填充（不变）
  2. 区域底色：遍历与 rows 相交的 regions，以主行背景色 fillRect 区域包围盒
  3. 内容：按 rows 循环逐格绘制，跳过 covered 与 anchor；
     随后对与 rows 相交的每个 region 绘制主格内容（区域矩形，含 itemHits 收集、veil 判定）
  4. 网格线（分区 2，见下）
```

要点：

- 主格内容不再依赖其所在行是否在窗口内：只要区域与窗口相交就绘制，绘制位置固定，窗口外的部分由 clip 裁掉。滚动时主格行移出窗口，合并格文字不会消失。
- 不需要行/列窗口扩展，无 O(组大小) 帧成本。
- `covered` / `anchors` 查询为 O(1)；区域集合查询见下。

**区域查询结构**：`buildSpans` 额外产出

```js
rowRegions: Map<row, Array<region>>   // 主格行 + 每个覆盖行都有且仅有真正交叠的 region
```

窗口查询 = 遍历 `rows.from..rows.to` 取并集。`regions` 仍按 `rowFrom` 有序保留（构建期顺序、调试用），但不作为窗口查询依据（`rowTo` 无序，无法提前终止）。

**网格线分段**：行线 `r` 跳过 `rowFrom < r < rowTo` 的 `[colLefts[colFrom], colLefts[colTo]]` 区间；列线对称。相交区域从 `rowRegions` 取，O(1) 定位。

**`rightInsetOf`**：合并格按 `col + colspan - 1` 计算右缘列线占位。

### 4.2 脏区归一（painter 内唯一收敛点）

新增 `expandRegionForSpans(layout, spans, region)`，在 `paintCellRange` / `paintRowBand` / `paintColBand` / `paintCellRegion` / `paintFixedArea` 入口调用：

- `{ cell: { row, col } }`：若为覆盖格 → 归一为主格，range 取区域行/列；clip 仍取原脏格矩形（只重画脏区，其余部分保持已有像素）。
- `{ rows: [a, b) }`：扩展为「所有与 `[a,b)` 相交的 region 的行并集」——但按 §4.1，行背景与内容已由 region pass 处理，**无需扩展**；仅需保证 region pass 使用 `[a,b)` 而非 `layout.viewRows`。
- `{ cols: [a, b) }`：同上，`colspan` 主格内容由 region pass 处理，无需列扩展。
- `isRegionPaintable` 的 `{ cell }` 校验改用归一后的主格坐标。

结论：**只有 `{ cell }` 需要真正的坐标归一，行/列脏带靠 region pass 自然正确**。壳侧 `hoverRegions` / `hoverItemCells` / veil / `onCommit` 的 `invalidate` 调用全部保持原样。

### 4.3 冲突与重叠规则

`buildSpans` 按「行序 → 行内列序」贪心登记，占用集为二维格标记：

1. `spanMethod` 声明先登记，`autoRowSpan` 后登记。
2. 声明主格已被占用 → 整条丢弃。
3. 声明的矩形区域内任一格已被占用 → 整条丢弃（不做部分截断）。
4. 越界截断、`'rest'` 展开、固定列边界夹紧在占用检查之前完成；夹紧后跨度 < 2 的丢弃。
5. 每条丢弃都带 dev 警告（除"截断后跨度 < 2"），警告去重：同一 `(row, col, 原因)` 只报一次。

### 4.4 重算与行高

- `spans = computed` 依赖：`displayRows`、`wiredColumns`、`props.spanMethod`、`props.recordsVersion`。
- `relayoutAndRedraw` 开头取一次 `spans.value`，同时传给 `computeLayout`（无需改布局）与 `rowGeometry.resolveForRelayout`；spans 变化必须进入估高脏判定（引用比较）。
- `computeRowHeights` / `ensureRowMeasured` 增加可选 `spans`：跳过 covered 格与「跨行（`rowspan > 1`）」的主格；仅跨列（`colspan > 1`）的主格仍参与本行行高（宽度口径按单列宽，属已知低估，不影响正确性）。
- `ensureRowMeasured` 的结果缓存键仍是 record 引用，但缓存需随 spans 变化整体失效（spans 身份入 `measureSignature` 或随 `measuredHeightsSig` 一起清空）。
- 编辑提交路径：`onCommit` 内 `recordsVersion` 若由父级递增则自动重算；若父级未递增（就地改值且未通知），文档需说明"改值影响合并时需递增 `records-version`"。

### 4.5 归一化接入点（组件壳）

`hitAt` 出口统一归一，避免遗漏：

```js
const hit = hitTest({...})
const normalized = spans ? resolveSpanCell(spans, hit) : hit   // 仅改 rowIndex/colIndex
```

`resolveSpanCell(spans, hit)` 返回浅拷贝，仅覆盖 `rowIndex` / `colIndex`；`x` / `y` / `cellX` / `beyondCols` / `resizeCol` 原样保留。归一后的 hit 供：`resolveCursor`、`updateHover`、`updateHoverItem`、`applyItemCursor`、`isEditorButtonHit`、`tryEditorButtonClick`、`finishCellClick`、`openEditorAt`、`resolveItemClick`。`resolveTreeToggle` 用原始 hit（树列无合并）。

## 5. 原设计须同步修订的章节

| 章节 | 修订内容 |
|---|---|
| §2.2 入口 A | 见 §3.1（级联、三种取值、树父链、占用格切断） |
| §2.2 入口 B | 见 §3.2（键解析、`recordIndex`、`prevRecord`/`nextRecord`/`columns`、`'rest'`） |
| §2.2 并存段 | 见 §3.3（列级接管替代逐格警告） |
| §2.3 备选表 | 补一行：「独立分段开关」不采用——改为级联默认 + spanMethod 表达 |
| §3.1 SpansIndex | 增加 `rowRegions`；`anchors` 需保留 `colspan` 供 `rightInset` 使用 |
| §3.2 规则 4 | 见 §4.3（整条丢弃） |
| §3.2 规则 6 | 补充 `autoRowSpan` 在占用格处断开 |
| §4 重算时机 | 补 `recordsVersion`；补 `spans` 入行高签名 |
| §5.1 绘制 | 见 §4.1，删除"绘制窗口扩展"，改为三段式 + region pass |
| §5.1 rightInset | 按区域末列 |
| §5.1 固定列 | `paintFixedArea` 同样走三段式，无需"行带扩展" |
| §5.2 命中 | 归一化移到 `hitAt` 出口，补 cursor / 编辑按钮消费点 |
| §5.4 行高 | 见 §4.4（仅跨行主格排除；跨列主格仍参与） |
| §5.5 树形 | 按父链切断，不只按 level |
| §6 矩阵 | 「hover cell 模式」= 区域；行/列模式 = 物理行/列（写入约束） |
| §7 警告清单 | 补：同 field 多列歧义、固定列截断、orderBy + autoRowSpan、列级接管 |
| §9 自检 | 见下 |
| §10 分期 | P0 增加"级联分段 + 区域底色/内容 pass"；P1 的"列窗口左扩"删除 |
| §11 文件表 | 修正 `cell-painters.js` 路径 |

## 6. 补充自检 / demo 用例

自检（`demo/src/data/table-ex/self-checks/spans.js`）：

1. 级联分段：三列 `autoRowSpan`，同一子类值跨分类时产出两段。
2. `autoRowSpan: 'field'` 与 Function 键；Function 返回 `undefined` 作为分段边界。
3. tag 列 `autoRowSpan: true` 不合并（数组键恒不等）。
4. 树：同层不同父的同值不合并；层级变化处切断。
5. `spanMethod` 键解析：`key` 优先、`field` 唯一命中、多列命中警告、无命中警告。
6. `colspan: 'rest'` 展开到分区末列；固定列边界夹紧。
7. 重叠整条丢弃；越界截断；`rowspan: 0` 忽略。
8. `resolveSpanCell`：covered → anchor，anchor / 普通格原样，`null` spans 短路。
9. `spanRectOf`：等高/变高、单行退化 = `cellRectAt`；`colspan` 区域矩形。
10. 行高：跨行主格与 covered 格不计入；跨列主格计入。
11. `rowRegions`：窗口查询结果 = 所有与窗口相交的 region（含从窗口上方开始的跨行长区域）。

demo（`demo/src/data/table-ex/main-view.vue` 新增示例组）：

- 三级分组报表（分类 / 子类 / 名称）全开 `autoRowSpan` + 组内小计行（`spanMethod` + `colspan: 'rest'`）+ 首列固定。
- 状态 tag 列用 Function 键合并。
- 合并格单击选中 / 编辑 / 条目点击，事件日志验证载荷为主行。
- 树 + `autoRowSpan`：展开收起后跨父不合并。
- 打开排序，验证合并随行序重算并出现 dev 警告。
