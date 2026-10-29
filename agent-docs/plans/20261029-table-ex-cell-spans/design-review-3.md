# mu-table-ex 合并单元格设计审阅（第 3 轮）

日期：2026-10-29。审阅对象：`design-review-2.md`（下称「修订 2」）及其对 `design-review-1.md`（「修订 1」）的裁定。所有锚点已对照当前 worktree 源码逐条核实。

## 1. 结论

修订 2 的 8 条动作清单中 **6 条可直接采纳，2 条须修正**：

- **§3.2 事实判断错误**：demo 确有重复 `field` 列（`name`、`level` 各两处）。修订 1 的原判断成立，不应删除该佐证。
- **§3.1 结论成立但反例机制与推荐方案都不成立**：「多区域合帧为整幅」路径在壳侧永远不触发（壳恒传 `immediate: true`）；反例引用的 `bandRegionsOf` 产出的是逐值单行带，不是 `[3,6)`。正确的反例来自选中态与 overlay，范围比修订 2 说的更大。

另发现 **6 处两轮均未覆盖的问题**，其中 2 处会直接导致功能失效（合并区域内条目不可点、区域内 img 加载后不重绘）。

## 2. 修订 2 逐条裁定

| 修订 2 条目 | 裁定 | 说明 |
|---|---|---|
| §3.1 脏区缺口（结论） | **成立** | 见 §3.1，反例与方案须替换 |
| §3.2 2.2-1 事实锚点错误 | **不成立** | 见 §3.2 |
| §3.3 跨列主格方向反了 | **成立** | 高估非低估；处置需补边界，见 §3.3 |
| §3.4 cellX 契约 | **成立** | 采纳 |
| §3.5 三段式波及快路径 | **成立** | 但处置改为「null 分支保留原单遍」，不必降级承诺，见 §3.4 |
| §3.6 父链落点缺失 | **成立** | 落点定案见 §3.5 |
| §3.7 图形列 true 形态警告 | **成立** | 采纳 |
| §2 已核实成立清单（10 项） | **全部成立** | 锚点复核一致 |

## 3. 须修正的两条

### 3.1 [致命] 脏区缺口：结论对，反例与方案错

**反例机制错。** 修订 2 称壳侧 `bandRegionsOf` 会产出 `[3,6)`。实际 `table-ex.vue:598-608` 对每个行号各产一条单行带：

```js
for (const value of new Set(values)) {
  if (value != null && value >= 0) regions.push({ [key]: [value, value + 1] })
}
```

hover 从区域（row 5）移到 row 3 得到的是 `{rows:[5,6)}` 与 `{rows:[3,4)}` 两条独立带，不存在 `[3,6)` 跨越。

**推荐方案 2 不可行。** 「拆多条 region 触发既有多区域合帧为整幅」依赖 `painter.js:1112-1120` 的 `flush()`，而 `flush` 只在非 immediate 入队路径执行。壳侧 `table-ex.vue:393-397` / `399-403` 恒传 `immediate: true`（G2-a 契约：持久 state 原地变更必须同步应用），因此 `flush` 路径在 table-ex 中永不触发。方案 1（归一时把 range 与 clip 一并扩展到相交区域包围盒）是唯一可行解。

**正确反例（比修订 2 更广）。** 脏区不扩展会出问题的不只是 overlay，还包括**行背景**：

| 脏源 | 现状 | 不扩展的后果 |
|---|---|---|
| `hoverMode: 'cell'` hover 移出区域（`paintHoverCell` 改画区域矩形） | `invalidate({cell: anchor})` | 区域下半高亮像素残留 |
| 可编辑格 hover 描边（`painter.js:743-766`，改画区域矩形） | `invalidate({cell: anchor})` | 描边残影 |
| 编辑 veil（`editingCell` 为 anchor） | `invalidate({cell: anchor})` | 区域下部内容未遮住，浮层下露出旧内容/旧条目 |
| **行选中**（`table-ex.vue:1272-1278` → `invalidateRow(anchor)`） | `paintRowBand` clip 收敛到 `[anchor, anchor+1)` | 区域整体底色（设计 §6「区域整块随主行选中态」）只在首行生效，其余行保持旧色 |
| **行带内区域内容** | 背景按 `rowBackgroundOf` 重算 → 若未覆盖整区则不一致 | 见下行 |

最后一行需要单独说明：行带重绘时主格内容确实会重画（锚格 pass 按「与脏行区间相交」选取，不按锚行是否在带内），但**背景**在 `paintBodyRow` 内按行填，带外的区域行不重算，于是出现「内容新、背景旧」的错位。

**结论：`{cell}` 与 `{rows}` 两类脏区都必须扩展到相交区域包围盒；`{cols}` 类不需要**（`paintColBand` 的带高恒为整个可视行范围，区域内所有行都会被重画）。若将来新增部分高度的列带脏源，须同样扩展。

### 3.2 [警告] demo 确有重复 field，修订 1 的判断成立

`demo/src/data/table-ex/main-view.vue`（`createDefaultColumns`）：

- `name`：L386 `{ caption:'名称', field:'name', sortable:true }` 与 L429 `{ caption:'覆盖文本', field:'name', text: record => ... }`
- `level`：L427 `{ caption:'等级', field:'level', type:'number', options:LEVEL_OPTIONS }` 与 L428 `{ caption:'锁定宽', field:'level', resizable:false }`

另有全列集 L661/L673 同 `field: 'name'`。修订 2「无重复 field、无 `level` 列」与源码不符。

**处置**：恢复修订 1 的表述，并把「key 优先」规则的理由从「潜在场景防御」升级为「本仓库 demo 已存在，且同 field 双列是 `text`/`value` 覆盖列与锁定宽列的既有写法」。这恰恰说明按 `field` 定位不可靠——L429 是可编辑性、宽度都不同的另一列。

## 4. 修订 2 中须补边界的处置

### 4.1 [警告] §3.3 跨列主格按区域宽——需限定 rowspan == 1

方向修正成立（单列宽 → 折行更多 → 行高高估）。但「跨列主格按区域宽参与行高」只对 `rowspan === 1` 成立：`rowspan > 1` 的主格已经被整体排除，不存在宽度口径。规则应写成：

- `rowspan > 1` → 不参与任何行行高；
- `rowspan === 1 && colspan > 1` → 按区域宽（`Σ colWidths[colFrom..colTo)`）参与本行行高；
- 其余 → 单列宽。

另需同步：`computeRowHeights` 的 `hasArrayValues` 模式判定（`row-geometry.js:400`）也要跳过被排除的合并格，否则一个被排除的合并格持有数组值会无端触发变高模式升级。

### 4.2 [小问题] §3.5 三段式：用 null 分支保住原路径，而非降级承诺

修订 2 建议把「零回归」降级为「像素等价，以自检验证」。更省事也更强的做法是**用 null 分支隔离**：

```
paintCellRange(rows, cols, bandToX):
  if (!spans) → 原实现逐字保留（逐行背景 + 内容，单遍）
  else       → 两遍：① 逐行背景 + 非锚格内容  ② 与 rows 相交区域的锚格内容
```

无 spans 时走原代码路径，零重排、零行为差异，「零回归」承诺不必降级，同时也不需要关键帧像素对照（保留全量自检即可）。有 spans 时多一遍空循环级开销。

## 5. 两轮均未覆盖的新发现

### 5.1 [致命] `trimItemHits` 会删掉窗口外锚行行的条目命中

`painter.js:210-216` 在每批绘制结束按 `viewRows` 裁剪 `itemHits`：

```js
for (const row of itemHits.keys()) {
  if (row < start || row >= end) itemHits.delete(row)
}
```

而区域 pass 允许锚行在窗口外绘制（这正是它存在的意义）。一旦锚行滚出窗口、区域仍可见，锚行对应的条目矩形被裁掉 → 可见区域内的 link/tag/button 点不中。

**处置**：`trimItemHits` 增加 `keepRows` 入参（与窗口相交区域的锚行集合），`row ∈ keepRows` 时保留。

### 5.2 [致命] 区域内 img 加载完成后不重绘

`cell-painters.js` 的 img 分支回调 `onImageLoad(row, colIndex)`，经 `painter.js:1097-1103` 转成 `api.invalidateCell(row, col)`；`cellRegionPaintable`（`painter.js:1051-1057`）要求 `row ∈ [viewRows.start, viewRows.end)`。锚行滚出窗口时返回 false，图片永不重绘，区域里出现「永远加载中」的空缺。

**处置**：`cellRegionPaintable` 改为「行列命中可视窗口**或**所属区域与窗口相交」。

### 5.3 [警告] 选中态在覆盖行不可表达

`isSelectedRow`（`painter.js:149-157`）按物理行判定。`rowBackgroundOf(coveredRow)` 返回锚行背景，因此：

- 锚行被选中 → 整个区域显示选中色（预期）；
- 覆盖行被程序置为选中（父级 `selectedRecordKey` 指向 row 6）→ 区域显示**普通背景**，选中态在视觉上完全丢失。

点击无法产生该状态（命中已归一），但 `scrollToRecord` / 受控写入可以。

**处置**：写入文档「合并区域内的选中只能由锚行表达，覆盖行 key 被选中时该区域无选中反馈」；或在实现里对覆盖行选中做一次 dev 警告。

### 5.4 [警告] spans 依赖缺 `orderBy`；内联 `spanMethod` 每次父渲染全量重算

- `spans` 只依赖 `displayRows` / `wiredColumns` / `spanMethod` / `recordsVersion`。若父级只改 `orderBy` 而未替换 `records`（例如由外部渲染器排序后复用同一数组引用），`spanMethod` 闭包里的排序状态变了但 `spans` 不重算。
- 反之，`spanMethod` 若写成内联箭头（最常见写法），每次父级渲染引用都变 → 每次渲染全量重算 spans + 估高重扫。

**处置**：`spans` 依赖补 `props.orderBy`；文档写明「`spanMethod` 应稳定引用，内联写法会在父级每次渲染时触发全量重算」。

### 5.5 [小问题] `editorGridlineFlagsOf` 右缘按锚列判定，colspan 区域右侧多缩 1px

`editor.js:68-78` 的 `rightGridline` 用 `colIndex < colCount - 1`。合并格右缘属于 `colFrom + colspan - 1`：若区域右缘正好是末列且无空白尾，按锚列判定会误认为「非末列」→ 编辑浮层右侧缩 1px，与格线错位。

`topGridline` 同理应取 `rowFrom > 0`（锚行即 rowFrom，当前写法碰巧正确，但须显式化以免将来改动锚点定义时出错）。

**处置**：`editorGridlineFlagsOf` 增加可选 `rowFrom` / `colTo` 入参（缺省回退现有 `rowIndex` / `colIndex + 1`）。

### 5.6 [小问题] `spanMethod` 抛异常未定义

设计未说明回调抛错的处置。建议：捕获 → dev 警告一次 → 该行按 `null` 处理，不中断整表绘制与交互。

## 6. 合入 design v2 的最终动作清单

按序执行，产出 `design.md` 第 2 版：

1. **[修订 1 §3/§4/§5 为基底]** 保留级联分段、`true | string | Function`、`colspan: 'rest'`、`recordIndex`/`prevRecord`/`nextRecord`/`columns`、列级接管、重叠整条丢弃。
2. **§4.2 重写为统一的脏区扩展规则**（本文 §3.1）：`{cell}` / `{rows}` 归一后 range 与 clip 一并扩展到相交区域包围盒；`{cols}` 不扩展并注明理由；删除修订 1 的「clip 仍取原脏格矩形」「行/列脏带无需扩展」两句。
3. **§4.1 改为 null 分支两遍式**（本文 §4.2）：无 spans 走原实现，零回归承诺保留。
4. **2.2-1 恢复 demo 重复 field 佐证**（本文 §3.2），`key` 优先 + 多列命中警告保留。
5. **§4.4 跨列主格按区域宽参与行高，限定 `rowspan === 1`**（本文 §4.1），并补 `hasArrayValues` 跳过规则。
6. **§4.5 补 `cellX` 契约**：语义绑定原始命中列，归一不重算；新增消费者前必须重算或改锚。
7. **§3.1 规则 4 落地**：`buildFlatRows` 增出 `parentKeys` 平行数组（`tree.js:100-140` 的显式栈已带父子关系，`pushChildren` 补传父 key），`use-tree-rows` 透出，`buildSpans` 消费。写入 §11 文件清单。
8. **§3.1 规则 1 补图形/条目列 `true` 形态 dev 警告**。
9. **补 §5.1 `trimItemHits` keepRows**（本文 §5.1）与 **§5.2 `cellRegionPaintable` 区域相交判定**（本文 §5.2）。
10. **补选中覆盖行语义**（本文 §5.3）到约束清单。
11. **`spans` 依赖补 `orderBy`**，文档补 `spanMethod` 稳定引用要求（本文 §5.4）。
12. **`editorGridlineFlagsOf` 增 `rowFrom` / `colTo` 入参**（本文 §5.5）。
13. **补 `spanMethod` 异常处置**（本文 §5.6）。
14. **§7 警告清单补**：同 field 多列、固定列截断、orderBy + autoRowSpan、列级接管、图形列 true、覆盖行被选中。
15. **§9 自检追加**：
    - hover 从区域移出后区域无残影（cell 模式）；
    - 锚行滚出窗口、区域仍可见时，区域内条目可点、img 可重绘；
    - 锚行选中后覆盖行底色随动（行带脏区扩展）；
    - 跨列主格按区域宽估高（`rowspan === 1`）；
    - 无 spans 表格绘制路径与原实现逐像素一致（null 分支回归）。
16. **§11 文件表补**：`tree.js`（parentKeys）、`use-tree-rows.js`（透出）、`demo/src/data/table-ex/self-checks/tree.js`（若有 parentKeys 断言则同步）。
