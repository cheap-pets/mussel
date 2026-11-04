# table-ex 单元格尺寸测量性能优化方案

来源：2026-11-04 会话分析（管线梳理 + 优化点识别）。行号以当前 worktree 为准。
基线：分支 `dev` @ `2a46f1b` + 未提交改动（scrollbar/cell-painters 等，与本方案无交集）。

审阅修订（2026-11-04）：

- P1 补 `recordsVersion` 失效源（阻塞项）与"几何值一致"跳过条件；原失效链论证不完整。
- P2 重划边界：删除 enum `_mapText` skipMap（数组 + `mappings.default` 会改变模式判定）；补三项零行为差估高优化；修正 padding 数值（默认 8×2+18=34，非 26）。
- 新增 `row-geometry-controller` 自检（P1 行为需确定性覆盖，现有自检均为纯函数模块）。
- 修正验证口径：`lastRelayout.elapsed` 含尾精算与重绘；`measureText` 计数在稳态已被缓存挡住，不能反映 P1。

## 1. 背景与现状

测量三级管线 + 三层缓存：

| 管线 | 触发 | 入口 | 成本 |
|---|---|---|---|
| 估高 | 数据/列/度量签名变化 | `computeRowHeights`（row-geometry.js:372） | O(n×cols) 纯算术，字符串估 1 行下界 |
| 精算 | 进窗逐行（滚动帧/relayout 尾部/编辑提交） | `ensureRowMeasured`（row-geometry.js:440） | 每行每列 valueOf + wrapLines |
| 绘制 | 每帧整幅 | `drawCell` → `drawTextValue`（cell-painters.js:545） | resolveCellContent 重跑 + 同一 wrapLines/ellipsize |

缓存：`measureCache`（文本宽，2000 条超限整体清空，theme.js:196）、`wrapCache`（折行结果，同策略）、`measuredRowHeights`（record 引用级真值 WeakMap，row-geometry-controller.js:65）。

已做优化（不重复劳动）：估高纯算术、`ellipsize` 二分、扫描签名跳过重扫、uniform 模式早退、rAF 滚动合帧、估高 rebuild 混入精算真值（单调不回缩）。

## 2. 目标

1. 滚动稳态帧**测量侧**成本：已精算行零重算（P1）。绘制侧 `resolveCellContent` 不在本轮范围。
2. 大数据首扫/数据替换成本：估高阶段砍掉无效求值（P2：图形列 `valueOf`、`_resolveMaxLines`、宽/inset 计算）。
3. 首折行微观成本：tokenize 正则换码点判定、shrinkToFit 二分化（P4）。
4. 行为冻结：行高/格线/折行结果与现状相同。唯一例外是 P2-1 的 0/1 行边界（默认主题下等价，见 §3 P2）。

## 3. 改动项

### P1 滚动帧跳过已精算行（主收益）

**现状**：`remeasureVisibleRows`（row-geometry-controller.js:351-396）每滚动帧对窗口 ±OVERSCAN **所有行**无条件重跑 `ensureRowMeasured`：用户回调（`_value`/`_mapText`/`_resolveMaxLines`）每帧全量重执行、wrapCache key 全串拼接、`measuredRowHeights.set` 每行每帧。canvas 测量被 wrapCache 挡住，但 JS 层全量重跑。稳态滚动（无新行进窗）纯浪费。

**原方案的缺口（审阅修订）**：跳过依赖"缓存有真值 ⇒ 几何已是该真值"，现行失效链缺两环：

1. **`recordsVersion`（records 就地修改通知通道）没有任何精算缓存失效**。树关时 `displayRows === props.records`（引用不变）、无 `spanMethod`/`autoRowSpan` 时 `spans` 恒 `null`、metrics 未变 ⇒ `isScanDirty` false 不重扫；现状靠 relayout 尾部 `remeasureVisibleRows` 重算可见行兜底（table-ex.vue:531-539）。P1 后该兜底被跳过，可见行停在旧行高，滚出再滚回仍命中旧缓存。树开时 `recordsVersion` 会重建 flatRows（rows 引用变化）触发重扫，但 `mergeMeasuredHeights` 仍按 record 混入旧精算值（max 语义），P1 跳过同样锁死旧高度——失效与 tree 开关无关。
2. **`mergeMeasuredHeights` 取 max**（controller:113-119）：rebuild 后 `geometry.heightAt(row)` 可能 **大于** 缓存值（估高 > 精算，来源是 link/自定义 render 非纯或 `_value` 两次求值不一致）。此时必须重算修正，不能仅凭"缓存有值"跳过。

**改法**：

```js
const spans = ctx.getSpans?.() ?? null
const recordsOffset = ctx.getRecordsOffset() || 0

for (let row = start; row < end; row++) {
  const cached = measuredRowHeights.get(rows[row])

  // 几何值 === 缓存值时才等价于 updateHeight(row, 现高) 返回 0
  if (cached !== undefined && variableGeometry.heightAt(row) === cached) continue

  const height = ensureRowMeasured({
    record: rows[row],
    recordNumber: recordsOffset + row + 1,
    colWidths: cur.colWidths,
    ...base,
    row,
    spans
  })

  measuredRowHeights.set(rows[row], height)
  delta += variableGeometry.updateHeight(row, height)
}
```

同批必须补的失效源（阻塞项）：

- controller 增加 `invalidateMeasuredHeights()`，直接 `measuredRowHeights = new WeakMap()`。
- `table-ex.vue` 合并 watch（1506-1540）中 `recordsVersion` 变化时调用，位于 `relayoutAndRedraw()` 之前。
- 不复用 `invalidateMeasureCache()` 的"置空 sig、下次 relayout 清"惰性语义，避免依赖 relayout 调用顺序；列定义变化路径维持原样。
- 为什么不按行失效：`recordsVersion` 不带行号，只能整体清空；清空后 relayout 尾部只重算可见行，离屏行进窗时自然重算，成本与现状一致。

**正确性论证**：

- 失效链补齐后完备：
  - 列宽/字体/高度度量变化 → `syncMeasuredHeightCache`（controller:100-109）签名比对清空，每次 relayout 先于扫描/混入执行；
  - spans 引用变化 → 整体清空（controller:312-317）；
  - 列定义变化 → `invalidateMeasureCache` 置空 sig（controller:420-422）→ 下次 relayout 清空；
  - records 替换 → 缓存键为 record 引用，新行集无条目，自然全量精算；
  - **records 就地修改（`recordsVersion`）→ 新增整体清空**；
  - 编辑提交 → `remeasureRow`（controller:258-281）单行重算并 set。
- 跳过等价性：`geometry.heightAt(row) === cached` 时，`updateHeight(row, cached)` 返回 0，delta 贡献 0；不存在"少算了某行升高"。
- **精算值粘性契约**：P1 后缓存不再按帧刷新，就地改值必须 bump `recordsVersion`（既有数据契约，现成为行高正确性的硬依赖）；在 controller 注释与 `measuredRowHeights` 字段处标注。
- **键约束**：缓存键为 record 引用，隐含"同一引用只出现一行"。重复引用行在 spans/tree 角色不同时高度可不同（`mergeMeasuredHeights` 既有同假设；P1 会让第二行直接跳过）。正常数据引用唯一，本轮不改键。
- 绘制侧不受影响：`resolveCellContent` 每帧仍重跑（P1 只省测量侧，见 §4 后续项）。

**收益**：滚动帧测量侧 O(window×cols) → O(新进窗行×cols)。

**风险**：低，但 `recordsVersion` 失效是前置条件；漏做即引入"就地改值后行高不更新"回归。

### P2 估高阶段砍掉无效求值（大数据首扫）

**现状**（`computeRowHeights` 循环内，row-geometry.js:391-431）：每行每列无条件执行 `valueOf`（`_value` 用户函数 + `_mapText`）、`resolveMaxLinesOf`（`_resolveMaxLines`/lineClamp 回调）、`contentWidthOf`/`regionWidthOf`/`insetOf`（`treeIndents` 回调）。但估高分支（precise=false）逐路径核对后对**文本内容与宽度零消费**：

- link 列只用 `record/value/emit` 计数，不用宽；
- 数组列只用 `value.length`，不用宽；
- `textLineCountOf` 对非空文本在 `!precise` 恒 1，`maxLines` 与 `width/font/measure` 均不消费。

#### P2-1 图形/条目列免 valueOf

`GRAPHIC_ITEM_TYPES` = tag/button/check/img/image/progress（不含 link）：估高阶段行数恒 1，不调 `valueOf`。

- 判定表达式沿用 `isTextPresentingColumn` 的补集：`!isLinkColumn(col) && typeof col.type === 'string' && GRAPHIC_ITEM_TYPES.has(col.type)`；列级预计算（P2-4），循环内直接 `count = 1`。
- `indicatesVariableMode` 对图形列恒 false（数组不触发变高），跳过取值不改变模式判定。

**行为边界（修正原方案）**：现状空值计数 0、非空 1。恒 1 与现状等价的条件是 `rowHeight ≥ 2×cellPadding + cellLineHeight`（默认 36 ≥ 8×2+18 = **34**；原文 26 有误）。低于该配置时，整行所有列都无内容（文本空 + 图形空）的行会比现状高 1 行（至 34）。默认主题无差异；自检固定该边界。

#### P2-2 `!precise` 提前（零行为差）

`textLineCountOf` 当前先求 `resolveMaxLinesOf` 再判 `!precise`；但非空文本在估高阶段恒 1，maxLines 结果不被消费。把 `if (!precise) return 1` 移到 `resolveMaxLinesOf` 之前，省每格 `_resolveMaxLines`/`lineClamp` 回调。逐字等价（仅回调调用次数与异常可见性变化）。

#### P2-3 估高免算宽度/inset（零行为差）

估高路径不消费 width（见上）。`computeRowHeights` 内删除 `contentWidthOf`/`regionWidthOf`/`insetOf` 求值（`spanRole === 'excluded'` 判定保留），省每格 `treeIndents` 回调与 colspan 区间求和。`columnLineCount` 的估高分支持不传 width（或拆出估高专用计数函数）。

#### P2-4 列级描述表预计算

循环前构建每列描述表 `{ isLink, graphicItem, maxItems, textPresenting }`，循环内免 `typeof`/Set/函数调用；文本列估高收敛为：

```js
Array.isArray(value)
  ? Math.min(value.length, maxItems)
  : (value == null || String(value) === '' ? 0 : 1)
```

与现状逐字等价（数组 / 空值 / 非空三分支）。

**删除原 P2-2（enum `_mapText` skipMap）**：理由见 §4 不做项。

**边界确认**：

- 精算阶段（`ensureRowMeasured`，precise=true）**不改**：图形列 maxLines>1 时单条 line-clamp 条目走 `drawTextValue` 多行（cell-painters.js:370-395），精算仍按 `_value`/field 文本定行高。
- 数组穿透路径：`valueOf` 保持原样（skipMap 已删），enum 映射语义不变。
- `hasArrayValues` 模式判定输入不变（图形列的数组恒不触发变高）。

**收益**：10w 行下，图形列省 `_value`，文本列省 `_resolveMaxLines`，全列省宽/inset/类型判定。注意：文本列的 `_value` 仍必须执行（数组/空值判定），原方案"映射列省一次用户回调"不成立——`_mapText` 是库内 mapper，不是用户回调。

**风险**：低。行为差异仅 P2-1 的 0/1 边界（默认主题等价）。

### P4 首折行微观优化（独立无风险）

1. **tokenize 码点判定**（text-wrap.js:48-97）：逐字符两次正则 test（`/\s/.test(ch)` + `CJK_PATTERN.test(ch)`）换 `charCodeAt(0)` 范围比较。等价集合：
   - 空白（JS `\s` 全集）：0x09-0x0D、0x20、0xA0、0x1680、0x2000-0x200A、0x2028、0x2029、0x202F、0x205F、0x3000、0xFEFF；
   - CJK（现 PATTERN 四段）：0x2E80-0x9FFF、0xF900-0xFAFF、0xFF00-0xFFEF、0xAC00-0xD7AF。
   - 两类均在 BMP，`charCodeAt(0)` 与现行为一致（surrogate 对落入原子词段，现行为相同）。tokenize 外层与内层 while（text-wrap.js:79-88）同改，建议抽 `isWhitespaceCode` / `isCjkCode` 两个局部函数。
2. **shrinkToFit 二分化**（text-wrap.js:119-126）：`measure(prefix + ELLIPSIS)` 随前缀长度单调（与 `ellipsize` 同一假设），仿 `ellipsize`（text-wrap.js:150-158）二分找最大可容纳前缀，O(n) 次测量 → O(log n)。边界与现状一致：无前缀可容纳时先测空前缀，`ELLIPSIS` 本身超宽返回 `''`，否则返回 `ELLIPSIS`。

**验证**：

- `self-checks/text-wrap.js` 现有用例全跑通。
- 新增断言：NBSP（0xA0）、全角空格（0x3000）、BOM（0xFEFF）、行分隔符（0x2028）、全角标点（0xFF00 段）的分词与断行；超长词逐字断路径；maxLines 钳制末行 `'...'` 与 maxLines=1 单行省略结果逐字相同。
- 若有测量次数断言，仅"全宽下界 1 次测量"（现有用例）不受影响；钳制路径次数会变，勿新增按次数的脆弱断言。

**风险**：低。`self-checks/text-wrap.js` 覆盖 tokenize/折行/钳制语义。

### P5 顺手项（零风险）

1. `remeasureVisibleRows` 循环内 `ctx.getSpans?.()`（controller:371）与 `ctx.getRecordsOffset()`（controller:367）提循环外各一次求值（与 P1 同一处改动）。
2. `variableGeometry.visibleRange` 尾部 `while topAt(end) < target`（row-geometry.js:311）每行一次 Fenwick prefix O(log n) → 从 `first` 起按 `heights[end]` 直加 O(window)：

```js
let end = first
let acc = geometry.topAt(first)

while (end < n && acc < target) {
  acc += heights[end]
  end++
}
```

每滚动帧执行两次（`remeasureVisibleRows` 与 `recomputeViewWindows` → `computeViewRows` 各一次）。

**注**：顺序累加与 Fenwick 分组求和在分数高度下可能有末位浮点差异，仅在 `topAt(end)` 与 `target` 恰好差 ~1e-15 时改变窗口边界；整数高度自检不受影响，接受该风险。

## 4. 不做项（留痕）

| 项 | 理由 |
|---|---|
| P3 link 列 render 产物按 record 缓存（估高/绘制复用） | 用户 render 非纯（依赖 hover/外部可变状态）会静默出错，正确性风险 > 收益；P1 落地后精算处 render 已消除，剩估高 + 绘制两处为必要成本。如未来做，需 render 纯度 opt-in 协议，单独决策。 |
| 原 P2-2：enum `_mapText` skipMap | mapper 为库内映射（非用户回调），`_value` 仍执行，收益仅一次对象查找；且 value 为数组时映射产物受 `mappings.default` 影响：有 default 时显示单行文本（估高 1 行），跳过映射会按数组计 `min(len, maxItems)` 并触发变高模式判定，行高与模式双双改变。收益不匹配风险。 |
| draw 侧 `resolveCellContent` 每帧重跑 | P1 后测量侧用户回调消失，绘制侧成为滚动帧主要用户回调成本；与 P3 同属 render 纯度问题，合并决策。本轮只记录不实施。 |
| link 计数免建条目（估高专用 count 路径） | 估高对 10w 行 × link 列会构建 items + `onItemClick` 闭包，GC 压力可观；但需 `LinkColumn.compile` 额外暴露计数协议并与 render 计数保持同源，属列类型内部协议扩展，建议与 P3 纯度协议一并设计。 |
| measureCache 简易 LRU / 中间串绕开缓存 | wrapTokens 中间组合串（current+token）灌入 measureCache、2000 条整体清空存在抖动可能，但稳态窗口 ≤800 条 wrap 结果在容量内；改缓存策略影响所有消费方，收益依赖数据形态，证据不足，本轮不动。 |
| estimateLineCount CJK/拉丁分桶下界 | 系数取小会误判单行导致两行文本被截断，正确性风险；拉丁文本误入精算仅多一次全宽测量（wrapCache 可挡），收益小。 |
| `col.text` 与 `_value` 行高来源不一致（既有） | 绘制优先 `col._text`，行高只读 `_value`/field；自定义 text 列的长文本不参与行高。既有缺口，与本轮性能改动无关，单独立项。 |

## 5. 改动文件清单

| 文件 | 改动 | 对应项 |
|---|---|---|
| `src/components/table/ex/row-geometry-controller.js` | `remeasureVisibleRows` 缓存 + 几何一致跳过；`invalidateMeasuredHeights()`；getSpans/getRecordsOffset 提循环外；粘性契约注释 | P1、P5 |
| `src/components/table/ex/table-ex.vue` | 合并 watch 的 `recordsVersion` 分支调用 `invalidateMeasuredHeights()` | P1（阻塞） |
| `src/components/table/ex/row-geometry.js` | 估高：图形列免 valueOf、`!precise` 提前、免算宽/inset、列级描述表；visibleRange 尾部直加 | P2、P5 |
| `src/components/table/ex/text-wrap.js` | tokenize 码点判定；shrinkToFit 二分 | P4 |
| `demo/src/data/table-ex/self-checks/text-wrap.js` | 补空白/CJK 边界、钳制与单行省略等价断言 | P4 验证 |
| `demo/src/data/table-ex/self-checks/row-geometry.js` | 估高等价断言（图形列 0/1 边界）；估高期零用户回调断言（`_resolveMaxLines`、`treeIndents`） | P2 验证 |
| `demo/src/data/table-ex/self-checks/row-geometry-controller.js` | **新增**：跳过 / recordsVersion 失效 / spans 变化 / 列宽变化重算断言 | P1 验证 |
| `demo/src/data/table-ex/self-checks/index.js` | 注册新模块 | P1 验证 |

不触碰：cell-painters.js（绘制消费不变）、theme.js（测量工厂不变）、layout.js、spans.js。

## 6. 验证方案

### 基线采集（改动前，playwright + 现有设施）

参照知识库 `table-ex-performance-profiling` 条目（props 直替 + `setTimeout ≥ 60ms`）。

| 指标 | 采集 | 判据 |
|---|---|---|
| 稳态滚动测量侧 | demo 场景加一列 `value: record => { window.__valueCalls++; return ... }` 计数（无需劫持内部导入）；100k 场景滚动到已见区域再滚回，采样 ≥5 帧 | 改后已见区域帧 `__valueCalls` 增量 0（改前每帧 ≈ 窗口行数） |
| 首扫成本 | `getLayoutInfo().lastRelayout.elapsed` 与 `lastPaint.elapsed` 同批记录，取 `lastRelayout - lastPaint` 近似估高段（elapsed 含尾精算 + 重绘，不能直接比）；≥3 次取中位 | 估高段中位下降，scanCount 不变 |
| 滚动绘制 | `lastPaint.elapsed` 稳态 ≥5 帧中位 | ≤ 基线 ×1.1 |
| **recordsVersion 就地改值** | 可见行 record 改长文本 + `recordsVersion++`（不滚动） | 行高/格线立即按新文本更新（P1 阻塞项专项） |
| 功能锚点 | multiline 场景 contentHeight、100k contentHeight、进窗精算后格线位置 | 数值逐一不变 |

**不要用 `measureText` 计数判断 P1**：`wrapCache` 命中后底层测量本就接近 0，计数无区分度；`ensureRowMeasured` 无稳定劫持点，运行时用上面的 `_value` 计数器，确定性覆盖走新增 controller 自检。

### 控制器自检设计（新增）

`createRowGeometryController` 无 Vue/DOM 依赖，可用假 ctx 直接断言：

- 夹具：2~3 列（一列 `_maxLines: 2` 触发变高）、10 行、假 `measure`/`wrapCache`、`getSpans: () => null`、假 `scrollEl { scrollTop: 0 }`、`getLayout` 返回 `{ viewH, colWidths, headHeight, stickyHeight }`。
- 断言 1：首次 `remeasureVisibleRows` 后用户 `_value` 调用数 = 窗口行数；再次调用增量 0。
- 断言 2：`invalidateMeasuredHeights()` 后再调用，增量恢复 = 窗口行数。
- 断言 3：`resolveForRelayout` 传入变化后的 `colWidths`（触发 `syncMeasuredHeightCache` 清空）→ 重算。
- 断言 4：`getSpans` 返回新对象 → 重算。
- 断言 5：几何高度被 rebuild 抬高（模拟 `mergeMeasuredHeights` max 命中）→ 不跳过、重算并回落。

### 回归底线

1. demo 自检全绿（`http://localhost:3000/data/table-ex/`，含新增断言与 controller 模块）。
2. `npm run build` 通过；`eslint` src 口径零 error（complexity 豁免注释保留）；`npx stylelint "src/**/*.scss"` 零报错。
3. playwright 冒烟：multiline 滚动锚定（格线不跳）、编辑提交行高重估、树展开 contentHeight 变化、recordsVersion 就地改值行高更新。

## 7. 实施顺序

P5 + P2-2/P2-3（零行为差，先落）→ P4（纯函数 + 自检）→ P1（含 `recordsVersion` 接线与 controller 自检，热路径主改动）→ P2-1/P2-4（0/1 边界，最后做以单独验证等价性）。每步跑自检后进下一步；P1 后跑滚动锚定 + recordsVersion 冒烟。
