# table-ex 单元格尺寸测量性能优化方案

来源：2026-11-04 会话分析（管线梳理 + 优化点识别）。行号以当前 worktree 为准。
基线：分支 `dev` @ `b3528d7`（列类型变更已提交，源码干净）。

列类型变更修订（2026-11-05，依据 commit `b3528d7`，任务 20261105-measure-perf-apply）：

- b3528d7 落地 link 兼容壳 + list 条目列 + text.link 选项 + 数组拆行移除（A9）：link/list 均为条目列（竖排每项一行，估高/精算同走 `linkItemCountOf` render 计数，row-geometry.js:61-68/113）；text 及其余非条目列数组值恒 1 行（row-geometry.js:116，A9 落占位链）；`indicatesVariableMode` 收窄为 `isLinkColumn(col) && count > 1`（row-geometry.js:340-342）。源方案"link 行数恒 1 / 不含 link 于图形列 / link 只计数不建条目 / 文本数组 min(len, maxItems)"论据全部失效，P2-1/P2-4 及 §4 不做项已按新列类型体系重写。
- 受 b3528d7 影响的行号已逐一重核：row-geometry.js / cell-painters.js / table-ex.vue 引用更新；row-geometry-controller.js、text-wrap.js、theme.js 未被该提交触碰，行号不变。
- 改动文件清单与"不触碰"边界复核：新增"不触碰 `src/components/table/column-types/`"（刚经 b3528d7 大改，本方案全部优化落在 ex/ 消费侧，无需改列类型实现）。

交叉审改修订（2026-11-05，design-amender，基线 dev @ b3528d7）：

- P1 缓存失效改为条目快照（`recordsVersion` + 树缩进），删除"relayout 前清空 WeakMap"：树模式下 `childrenIndex` 依赖 `recordsVersion`（use-tree-rows.js:55-68），版本变化会重建 flatRows 触发重扫；relayout 前清空使 `mergeMeasuredHeights` 无旧真值，几何回落估高下界、totalHeight 回缩（违反 controller:13-15 单调不变量）。树缩进（tree 开/关、treeProps）不在任何既有失效维度内，P1 会冻结旧折行高度。
- 验证口径修正：`__valueCalls` 计数列必须位于初始水平视口外——绘制侧 `resolveCellContent` 每帧对绘制格调用 `_value`（cell-painters.js:230-236），可见列的帧增量不可能为 0；基线采集提前到任何 src 改动之前（§7 步骤 0）；变更清单补 demo main-view.vue 夹具；recordsVersion 行高验证改用 multiline 场景（默认场景 memo 列未配 multiline，文本变长不改变行高）。
- P2-2/P2-3 与 P2-4 的重叠关系补充说明（P2-4 落地后估高不再经 `textLineCountOf`/宽计算）。

交叉回应修订（2026-11-05，designer R1，回应 06-amend-1.md，改动台账 #1~#6 全部接受）：

- 逐项源码复核通过，详见 02-amend-1.md。两处精度修正：recordNumber 论据行号 list.js:117-118 → list.js:119（link 壳委托 link.js:44-58）；§6 controller 自检夹具补 `getTheme`（THEME 36/8/18/14 同 self-checks/row-geometry.js:66 口径，断言 7 的 36→52 数值依赖）。

审阅修订（2026-11-04）：

- P1 补 `recordsVersion` 失效源（阻塞项）与"几何值一致"跳过条件；原失效链论证不完整。
- P2 重划边界：删除 enum `_mapText` skipMap（数组 + `mappings.default` 会改变模式判定）；补三项零行为差估高优化；修正 padding 数值（默认 8×2+18=34，非 26）。
- 新增 `row-geometry-controller` 自检（P1 行为需确定性覆盖，现有自检均为纯函数模块）。
- 修正验证口径：`lastRelayout.elapsed` 含尾精算与重绘；`measureText` 计数在稳态已被缓存挡住，不能反映 P1。

## 1. 背景与现状

测量三级管线 + 三层缓存：

| 管线 | 触发 | 入口 | 成本 |
|---|---|---|---|
| 估高 | 数据/列/度量签名变化 | `computeRowHeights`（row-geometry.js:361） | O(n×cols) 纯算术，字符串估 1 行下界；link/list 条目列取 render 计数真值，其余列数组值恒 1 行（A9） |
| 精算 | 进窗逐行（滚动帧/relayout 尾部/编辑提交） | `ensureRowMeasured`（row-geometry.js:429） | 每行每列 valueOf + wrapLines；link/list 条目列走 render 计数（不折行，与估高同路径） |
| 绘制 | 每帧整幅 | `drawCell` → `drawTextValue`（cell-painters.js:558） | resolveCellContent 重跑 + 同一 wrapLines/ellipsize |

缓存：`measureCache`（文本宽，2000 条超限整体清空，theme.js:196）、`wrapCache`（折行结果，同策略）、`measuredRowHeights`（record 引用级真值 WeakMap，row-geometry-controller.js:65）。

已做优化（不重复劳动）：估高纯算术、`ellipsize` 二分、扫描签名跳过重扫、uniform 模式早退、rAF 滚动合帧、估高 rebuild 混入精算真值（单调不回缩）。

## 2. 目标

1. 滚动稳态帧**测量侧**成本：已精算行零重算（P1）。绘制侧 `resolveCellContent` 不在本轮范围。
2. 大数据首扫/数据替换成本：估高阶段砍掉无效求值（P2：图形列 `valueOf`、`_resolveMaxLines`、宽/inset 计算）。
3. 首折行微观成本：tokenize 正则换码点判定、shrinkToFit 二分化（P4）。
4. 行为冻结：行高/格线/折行结果与现状相同。唯一例外是 P2-1 的 0/1 行边界（默认主题下等价，见 §3 P2）。

## 3. 改动项

### P1 滚动帧跳过已精算行（主收益）

**现状**：`remeasureVisibleRows`（row-geometry-controller.js:351-396）每滚动帧对窗口 ±OVERSCAN **所有行**无条件重跑 `ensureRowMeasured`：用户回调（`_value`/`_mapText`、lineClamp 回调）与 link/list 条目列 `render` 每帧全量重执行、wrapCache key 全串拼接、`measuredRowHeights.set` 每行每帧。canvas 测量被 wrapCache 挡住，但 JS 层全量重跑。稳态滚动（无新行进窗）纯浪费。

**原方案的缺口（审阅修订）**：跳过依赖"缓存有真值 ⇒ 几何已是该真值"，现行失效链 / 跳过判据缺三处：

1. **`recordsVersion`（records 就地修改通知通道）没有任何精算缓存失效**。树关时 `displayRows === props.records`（引用不变）、无 `spanMethod`/`autoRowSpan` 时 `spans` computed 恒 `null`（table-ex.vue:246-259，buildSpans 无合并快路径返回 null，身份不漂移）、metrics 未变 ⇒ `isScanDirty` false 不重扫；现状靠 relayout 尾部 `remeasureVisibleRows` 重算可见行兜底（table-ex.vue:532-538，调用点 536）。P1 后该兜底被跳过，可见行停在旧行高，滚出再滚回仍命中旧缓存。树开时 `recordsVersion` 会重建 flatRows（rows 引用变化）触发重扫，但 `mergeMeasuredHeights` 仍按 record 混入旧精算值（max 语义），P1 跳过同样锁死旧高度——失效与 tree 开关无关。
2. **`mergeMeasuredHeights` 取 max**（controller:113-119）：rebuild 后 `geometry.heightAt(row)` 可能 **大于** 缓存值（估高 > 精算，来源是 link/list 条目列 render 非纯——估高与精算同走 `linkItemCountOf` render 计数（row-geometry.js:61-68、113），两次调用计数不同——或 `_value` 两次求值不一致导致文本列取值漂移；文本列本身估高恒 1 行 ≤ 精算，值一致时不会越界）。此时必须重算修正，不能仅凭"缓存有值"跳过。
3. **树缩进（`treeIndents`）不在任何失效维度内**：精算宽度 = 列宽 − padding×2 − inset（row-geometry.js:454-458），inset 由 `treeIndentsOf` 读 `flatRows.levels`（use-tree-rows.js:109-118）。tree 开/关、`treeProps` 切换会重建 flatRows（displayRows 引用变化触发重扫），但同一 record 的 level 可能改变；估高对非空文本恒 1 行（row-geometry.js:90）覆盖不到宽度变化，merge 又按 record 混入旧精算值，P1 跳过会把旧折行高度冻结。现状由 relayout 尾部重算可见行自愈（调用点同上）。

**改法**：跳过判据从"几何值 === 缓存值"扩展为"几何值 + 失效维度快照全部匹配"；缓存值改为 `{ height, indent, recordsVersion }`：

```js
const spans = ctx.getSpans?.() ?? null
const recordsOffset = ctx.getRecordsOffset() || 0
const version = ctx.getRecordsVersion?.() ?? 0
const { columns, treeIndents } = base
const treeColIndex = treeIndents ? columns.findIndex(col => col._isTreeColumn) : -1
const needIndent = !!treeIndents && isVariableCandidate()
const indentOf = row =>
  needIndent && treeColIndex >= 0 ? treeIndents(treeColIndex, row) || 0 : 0

for (let row = start; row < end; row++) {
  const cached = measuredRowHeights.get(rows[row])
  const indent = indentOf(row)

  // 几何值、recordsVersion、树缩进三者都匹配时，updateHeight(row, cached.height) 才返回 0
  if (cached &&
      variableGeometry.heightAt(row) === cached.height &&
      cached.recordsVersion === version &&
      cached.indent === indent) continue

  const height = ensureRowMeasured({
    record: rows[row],
    recordNumber: recordsOffset + row + 1,
    colWidths: cur.colWidths,
    ...base,
    row,
    spans
  })

  measuredRowHeights.set(rows[row], { height, indent, recordsVersion: version })
  delta += variableGeometry.updateHeight(row, height)
}
```

同批必须补的失效维度（阻塞项）：

- `mergeMeasuredHeights`（controller:113-119）改取 `.height`，max 混入语义与 totalHeight 不回缩不变；`syncMeasuredHeightCache` / spans 失效路径仍是整体换新 WeakMap（值形状随清空重置）。
- `remeasureVariableRow`（controller:258-281）单行精算后用同一 `indentOf`/version 写入快照。
- controller ctx 新增 `getRecordsVersion: () => props.recordsVersion`（table-ex.vue:265-281 同处注入）；**不新增 watch，不提供 `invalidateMeasuredHeights()`**（原设计的 relayout 前清空见下条，必须删除）。

**为什么用快照而不是清空（recordsVersion）**：树模式下 `childrenIndex` 显式依赖 recordsVersion（use-tree-rows.js:55-68），版本号变化重建 flatRows → displayRows 引用变化 → 重扫 rebuild。若在 `relayoutAndRedraw()` 前清空缓存，`mergeMeasuredHeights` 无旧真值可混入，几何按估高下界重建（多行文本列 1 行），totalHeight/spacer 回缩，违反 controller 头注释 #15 单调不变量（controller:13-15），且 relayout 内无对应 scrollTop 补偿 → 内容跳动。快照让 merge 继续用旧真值保持几何单调，同时使跳过判据失效：可见行由 relayout 尾部重算（table-ex.vue:536），离屏行进窗时重算。非树模式下版本变化不触发重扫，快照同样只影响跳过判据。

**树缩进快照**：`needIndent` 仅在树开且存在变高候选列（`isVariableCandidate` 同式：`maxLines > 1` 常量或 `multiline`）时启用——条目列行数来自 render 计数、与宽度无关。其余场景 `indentOf` 恒 0，无额外回调。

**正确性论证**：

- 失效链 / 快照维度完备：
  - 列宽/字体/高度度量变化 → `syncMeasuredHeightCache`（controller:100-109）签名比对清空，每次 relayout 先于扫描/混入执行；
  - spans 引用变化 → 整体清空（controller:312-317）；
  - 列定义变化 → `invalidateMeasureCache` 置空 sig（controller:420-422）→ 下次 relayout 清空；
  - records 替换 → 缓存键为 record 引用，新行集无条目，自然全量精算；同引用重排（orderBy 排序生成新数组）在无 spans / 无树时行高与行号无关，快照仍匹配；
  - **records 就地修改（`recordsVersion`）→ 版本快照失配**（merge 仍用旧真值保持几何单调；可见行尾部重算、离屏行进窗重算）；
  - **树层级/缩进变化（tree 开/关、`treeProps` 切换）→ 缩进快照失配**；
  - 编辑提交 → `remeasureRow`（controller:403-416）variable 分支走 `remeasureVariableRow`（controller:258-281）单行重算并写入新快照。
  - `recordNumber`（`recordsOffset + row + 1`）不进入行高：link/list compile 产物签名 `({ record, value, emit })`（list.js:119；link 壳委托 ListColumn.compile，link.js:44-58 同签名）不消费 recordNumber，`recordsOffset` 变化无行高影响，不设失效维度。
- 跳过等价性：`geometry.heightAt(row) === cached.height` 且版本/缩进快照匹配时，`updateHeight(row, cached.height)` 返回 0，delta 贡献 0；不存在"少算了某行升高"。
- **条目列（link/list）精算等价性**：`columnLineCount` 对条目列不区分 precise（row-geometry.js:113，估高与精算同走 `linkItemCountOf` render 计数、不折行），首次精算入缓存的值即该行 render 计数高度；后续帧跳过与"每帧重跑 render 但计数不变时 `updateHeight` 返回 0"等价。render 非纯（两次调用计数不同）时现状本就每帧变高，P1 后冻结首帧值——与文本列 `_value` 非纯同口径，由下方粘性契约统一覆盖，不构成新的正确性缺口。
- **精算值粘性契约**：P1 后缓存不再按帧刷新，就地改值必须 bump `recordsVersion`（既有数据契约，现成为行高正确性的硬依赖）；版本快照是唯一通知通道，未 bump 时行高不随内容更新。在 controller 注释与 `measuredRowHeights` 字段处标注。
- **键约束**：缓存键为 record 引用，隐含"同一引用只出现一行"。重复引用行在 spans/tree 角色不同时高度可不同（`mergeMeasuredHeights` 既有同假设；P1 会让第二行直接跳过）。正常数据引用唯一，本轮不改键。
- 绘制侧不受影响：`resolveCellContent` 每帧仍重跑（P1 只省测量侧，见 §4 后续项）。

**收益**：滚动帧测量侧 O(window×cols) → O(新进窗行×cols)。

**风险**：低，但版本快照与树缩进快照是正确性前置；漏做即引入"就地改值 / 树开合后行高不更新"回归。

### P2 估高阶段砍掉无效求值（大数据首扫）

**现状**（`computeRowHeights` 循环内，row-geometry.js:380-420）：每行每列无条件执行 `valueOf`（`_value` 用户函数 + `_mapText`）、`resolveMaxLinesOf`（`_resolveMaxLines`/lineClamp 回调）、`contentWidthOf`/`regionWidthOf`/`insetOf`（`treeIndents` 回调）。但估高分支（precise=false）逐路径核对后对**文本内容与宽度零消费**：

- link/list 条目列走 `linkItemCountOf`（row-geometry.js:61-68）：只消费 render 计数与 maxItems，不用宽；
- 其余列数组值恒 1 行（row-geometry.js:116，A9 落占位链），不用 `value.length` 也不用宽；
- `textLineCountOf` 对非空文本在 `!precise` 恒 1，`maxLines` 与 `width/font/measure` 均不消费。

#### P2-1 图形列免 valueOf

`GRAPHIC_ITEM_TYPES` = tag/button/check/img/image/progress（不含条目列 link/list）：估高阶段行数恒 1，不调 `valueOf`。

- 判定表达式：`!isLinkColumn(col) && typeof col.type === 'string' && GRAPHIC_ITEM_TYPES.has(col.type)`（`isLinkColumn` 现覆盖 link+list，row-geometry.js:27-29；原方案"沿用 `isTextPresentingColumn` 的补集"已删除——该符号在 b3528d7 重构后不存在，图形清单改为与绘制分发逐一核对：tag/check/img 走横排 `drawItems`、progress/button 走 canvas 专属 `drawCanvasKindContent`，均单行垂直居中不折行）；列级预计算（P2-4），循环内直接 `count = 1`。
- `indicatesVariableMode`（row-geometry.js:340-342）现为 `isLinkColumn(col) && count > 1`：图形列与非条目列的数组值均不参与模式判定（A9 后 `hasArrayValues` 语义已收窄为"存在 link/list 多条目格"），跳过图形列取值不改变模式判定。

**行为边界（修正原方案）**：现状空值计数 0、非空 1。恒 1 与现状等价的条件是 `rowHeight ≥ 2×cellPadding + cellLineHeight`（默认 36 ≥ 8×2+18 = **34**；原文 26 有误）。低于该配置时，整行所有列都无内容（文本空 + 图形空）的行会比现状高 1 行（至 34）。默认主题无差异；自检固定该边界。

#### P2-2 `!precise` 提前（零行为差）

`textLineCountOf`（row-geometry.js:79-93）当前先求 `resolveMaxLinesOf`（84）再判 `!precise`（90）；但非空文本在估高阶段恒 1，maxLines 结果不被消费。把 `if (!precise) return 1` 移到 `resolveMaxLinesOf` 之前，省每格 `_resolveMaxLines`/`lineClamp` 回调。逐字等价（仅回调调用次数与异常可见性变化）。条目列与数组路径不走 `textLineCountOf`（row-geometry.js:113/116 先行返回），不受影响。P2-4 落地后非条目列估高改为内联表达式、不再经 `textLineCountOf`，本项成为该函数的防御性等价改写（保持 precise=false 语义自洽），收益由 P2-4 统一承接。

#### P2-3 估高免算宽度/inset（零行为差）

估高路径不消费 width（见上）。`computeRowHeights` 内删除 `contentWidthOf`/`regionWidthOf`/`insetOf` 求值（400-404；`spanRole === 'excluded'` 判定保留，spans 分层数据链不动），省每格 `treeIndents` 回调与 colspan 区间求和。`columnLineCount` 的估高分支持不传 width（或拆出估高专用计数函数）。既有自检"treeIndents 估高路径可用"（self-checks/row-geometry.js:591-613）只断言 heights 与零测量，回调不再被调用后仍通过（名义过时，实施时顺手改名，不改变判据）。

#### P2-4 列级描述表预计算

循环前构建每列描述表 `{ isEntry, graphicItem, maxItems }`（isEntry = link/list 条目列），循环内免 `typeof`/Set/函数调用；非条目列估高收敛为：

```js
Array.isArray(value)
  ? 1
  : (value == null || String(value) === '' ? 0 : 1)
```

与现状逐字等价（A9 数组恒 1 行 / 空值 0 / 非空 1 三分支；原方案数组分支 `min(value.length, maxItems)` 已随数组拆行删除失效——非条目列数组值不再按元素数计高，row-geometry.js:116）。条目列分支保留 `linkItemCountOf` 调用（render 计数 + `min(count, maxItems)`，`maxItems = col._maxItems ?? 10`）。

**删除原 P2-2（enum `_mapText` skipMap）**：理由见 §4 不做项。

**边界确认**：

- 精算阶段（`ensureRowMeasured`，precise=true）**不改**：maxLines>1 的单条 line-clamp 条目形态走 `drawTextValue` 多行（cell-painters.js:394-410），精算仍按 `_value`/field 文本定行高；canvas 通道 tag/check 等图形产物无 `attrs.class`（`itemClassOf` 空串，cell-painters.js:656-659），不进入该形态。
- 数组穿透路径：`valueOf` 保持原样（skipMap 已删），enum 映射语义不变。
- `hasArrayValues` 模式判定输入不变（判定已收窄为 `isLinkColumn && count > 1`，图形列跳过取值与文本列数组恒 1 均不影响）。

**收益**：10w 行下，图形列省 `_value`，文本列省 `_resolveMaxLines`，全列省宽/inset/类型判定。注意：文本列的 `_value` 仍必须执行（A9 数组占位判定与空值判定），原方案"映射列省一次用户回调"不成立——`_mapText` 是库内 mapper，不是用户回调。P2-4 落地后，P2-2 的 `!precise` 提前与 P2-3 的宽/inset 求值删除由内联表达式一并取代（`textLineCountOf` 估高分支仅作防御性保留）；分步实施时 P2-2/P2-3 先落地可各自独立验证零行为差。

**风险**：低。行为差异仅 P2-1 的 0/1 边界（默认主题等价）。

### P4 首折行微观优化（独立无风险）

1. **tokenize 码点判定**（text-wrap.js:48-97；b3528d7 未触碰本文件，行号未漂移）：逐字符两次正则 test（`/\s/.test(ch)` + `CJK_PATTERN.test(ch)`）换 `charCodeAt(0)` 范围比较。等价集合：
   - 空白（JS `\s` 全集）：0x09-0x0D、0x20、0xA0、0x1680、0x2000-0x200A、0x2028、0x2029、0x202F、0x205F、0x3000、0xFEFF；
   - CJK（现 PATTERN 四段）：0x2E80-0x9FFF、0xF900-0xFAFF、0xFF00-0xFFEF、0xAC00-0xD7AF。
   - 两类均在 BMP，`charCodeAt(0)` 与现行为一致（surrogate 对落入原子词段，现行为相同）。**判定顺序必须保持空白优先**：两集合重叠（如 U+3000 IDEOGRAPHIC SPACE 同时落在 CJK 区间 `\u2E80-\u9FFF`），现实现先判 `/\s/` 再判 CJK，替换后须沿用同一 if/else-if 顺序。tokenize 外层与内层 while（text-wrap.js:79-88）同改；71 行 `!/\S/.test(current)`（current 在该点只可能是空串或纯空白累积）一并换 `isWhitespaceCode` 判定，建议抽 `isWhitespaceCode` / `isCjkCode` 两个局部函数。
2. **shrinkToFit 二分化**（text-wrap.js:119-126）：`measure(prefix + ELLIPSIS)` 随前缀长度单调（与 `ellipsize` 同一假设），仿 `ellipsize`（text-wrap.js:150-158）二分找最大可容纳前缀，O(n) 次测量 → O(log n)。边界与现状一致：无前缀可容纳时先测空前缀，`ELLIPSIS` 本身超宽返回 `''`，否则返回 `ELLIPSIS`。

**验证**：

- `self-checks/text-wrap.js` 现有用例全跑通。
- 新增断言：NBSP（0xA0）、全角空格（0x3000）、BOM（0xFEFF）、行分隔符（0x2028）、全角标点（0xFF00 段）的分词与断行；超长词逐字断路径；maxLines 钳制末行 `'...'` 与 maxLines=1 单行省略结果逐字相同。
- 若有测量次数断言，仅"全宽下界 1 次测量"（现有用例）不受影响；钳制路径次数会变，勿新增按次数的脆弱断言。

**风险**：低。`self-checks/text-wrap.js` 覆盖 tokenize/折行/钳制语义。

### P5 顺手项（零风险）

1. `remeasureVisibleRows` 循环内 `ctx.getSpans?.()`（controller:371）与 `ctx.getRecordsOffset()`（controller:367）提循环外各一次求值（与 P1 同一处改动）。
2. `variableGeometry.visibleRange` 尾部 `while topAt(end) < target`（row-geometry.js:298）每行一次 Fenwick prefix O(log n) → 从 `first` 起按 `heights[end]` 直加 O(window)：

```js
let end = first
let acc = geometry.topAt(first)

while (end < n && acc < target) {
  acc += heights[end]
  end++
}
```

每滚动帧执行两次（`remeasureVisibleRows`（controller:358）与 `recomputeViewWindows` → `computeViewRows`（layout.js:148）各一次）。

**注**：顺序累加与 Fenwick 分组求和在分数高度下可能有末位浮点差异，仅在 `topAt(end)` 与 `target` 恰好差 ~1e-15 时改变窗口边界；整数高度自检不受影响，接受该风险。

## 4. 不做项（留痕）

| 项 | 理由 |
|---|---|
| P3 link/list 条目列 render 产物按 record 缓存（估高/绘制复用） | 用户 render 非纯（依赖 hover/外部可变状态）会静默出错，正确性风险 > 收益；P1 落地后滚动帧精算处 render 已消除，剩首扫估高 + 绘制两处为必要成本。如未来做，需 render 纯度 opt-in 协议，单独决策。 |
| 原 P2-2：enum `_mapText` skipMap | mapper 为库内映射（非用户回调），`_value` 仍执行，收益仅一次对象查找。列变更修订：旧论据"数组计 `min(len, maxItems)` 并触发变高"已随 A9 失效（非条目列数组恒 1 行、不触发变高，row-geometry.js:116/340-342）；但数组值经 `_mapText` 命中 `mappings.default` 时现状返回 `mapped.text`（空串估 0 行），跳过映射则数组恒 1 行——0/1 行差与空映射语义差异仍在，收益不匹配风险结论不变。 |
| draw 侧 `resolveCellContent` 每帧重跑 | P1 后测量侧用户回调消失，绘制侧成为滚动帧主要用户回调成本；与 P3 同属 render 纯度问题，合并决策。本轮只记录不实施。 |
| 条目列估高免建 items（compile 暴露轻量 count 协议） | 列变更后估高/精算已走 `linkItemCountOf` 计数（row-geometry.js:61-68，不建 DOM 条目），原"link 只计数不建条目"的优化空间已部分落地；剩余成本 = 每行每列调用 compile 产物 render，仍构建 items 数组 + 每项 `onItemClick` 闭包（list.js:58-72 canvasItemOf），10w 行 × 条目列 GC 压力可观。进一步免建需 `LinkColumn`/`ListColumn.compile` 暴露计数协议并与 render 计数同源（`listOption.max` 截断与 dots 语义在 render 内，list.js:129-135），属列类型内部协议扩展，建议与 P3 纯度协议一并设计。 |
| measureCache 简易 LRU / 中间串绕开缓存 | wrapTokens 中间组合串（current+token）灌入 measureCache、2000 条整体清空存在抖动可能，但稳态窗口 ≤800 条 wrap 结果在容量内；改缓存策略影响所有消费方，收益依赖数据形态，证据不足，本轮不动。 |
| estimateLineCount CJK/拉丁分桶下界 | 系数取小会误判单行导致两行文本被截断，正确性风险；拉丁文本误入精算仅多一次全宽测量（wrapCache 可挡），收益小。 |
| `col.text` 与 `_value` 行高来源不一致（既有） | 绘制优先 `col._text`，行高只读 `_value`/field；自定义 text 列的长文本不参与行高。既有缺口，与本轮性能改动无关，单独立项。 |

## 5. 改动文件清单

| 文件 | 改动 | 对应项 |
|---|---|---|
| `src/components/table/ex/row-geometry-controller.js` | `remeasureVisibleRows` 缓存条目 `{ height, indent, recordsVersion }` + 三条件跳过；`mergeMeasuredHeights` 取 `.height`；`remeasureVariableRow` 同源写快照；getSpans/getRecordsOffset/getRecordsVersion 提循环外；粘性契约注释 | P1、P5 |
| `src/components/table/ex/table-ex.vue` | controller ctx 注入 `getRecordsVersion: () => props.recordsVersion`（P1 快照维度；合并 watch 不改） | P1（阻塞） |
| `src/components/table/ex/row-geometry.js` | 估高：图形列免 valueOf、`!precise` 提前、免算宽/inset、列级描述表；visibleRange 尾部直加 | P2、P5 |
| `src/components/table/ex/text-wrap.js` | tokenize 码点判定；shrinkToFit 二分 | P4 |
| `demo/src/data/table-ex/self-checks/text-wrap.js` | 补空白/CJK 边界、钳制与单行省略等价断言 | P4 验证 |
| `demo/src/data/table-ex/self-checks/row-geometry.js` | 估高等价断言（图形列 0/1 边界、条目列计数不受 P2 改动影响）；估高期零用户回调断言（`_resolveMaxLines`、`treeIndents`）；"treeIndents 估高路径可用"断言改名（判据不变） | P2 验证 |
| `demo/src/data/table-ex/self-checks/row-geometry-controller.js` | **新增**：跳过 / recordsVersion 快照失配 / 树缩进快照失配 / spans 变化 / 列宽变化重算断言；重扫 rebuild 后 totalHeight 不回缩（merge 保持） | P1 验证 |
| `demo/src/data/table-ex/self-checks/index.js` | 注册新模块 | P1 验证 |
| `demo/src/data/table-ex/main-view.vue` | 验证夹具（默认关闭，不改既有场景与 DOM 参照表）：性能计数列开关（列尾追加、初始水平视口外、`window.__valueCalls` 计数）；`recordsVersion++`（仅通知）按钮 | B3/B4 验证 |

不触碰（列变更修订复核）：cell-painters.js（b3528d7 已大改，但本方案只改估高侧 row-geometry.js，绘制消费不变）、`src/components/table/column-types/`（link/list/text 刚经 b3528d7 重写，P2 的条目列优化全部落在 ex/ 消费侧 `linkItemCountOf`，无需改列类型实现）、theme.js（测量工厂不变）、layout.js、spans.js。`demo/src/data/table-ex/main-view.vue` 仅新增默认关闭的验证夹具，既有场景列集/数据与 DOM 参照表不动。

自检兼容：b3528d7 后 `self-checks/row-geometry.js` 已含 A9 列类型断言（条目计数真值、文本数组恒 1 行、hasArrayValues 判定收窄，self-checks/row-geometry.js:279-434）；P2 新增断言不得与"估高路径零测量""render 每格 1 次"（:352）等既有判据冲突——图形列免 valueOf 只减 `valueOf` 调用，不影响 render 计数断言。

## 6. 验证方案

### 基线采集（改动前，playwright + 现有设施）

基线必须先于任何 src 改动采集：先落 §5 的 demo 夹具（性能计数列开关、recordsVersion 通知按钮，默认关闭），再采基线；两轮同夹具、同浏览器 / DPR / 舞台尺寸（默认 960×420）、同数据。参照知识库 `table-ex-performance-profiling` 条目（props 直替 + `setTimeout ≥ 60ms`）。

| 指标 | 采集 | 判据 |
|---|---|---|
| 稳态滚动测量侧 | 默认场景（100k）打开"性能计数列"开关：列尾追加 `{ caption: '__perf', value: record => { window.__valueCalls++; return record.name }, width: 4000 }`（`RECORD_COUNT` main-view.vue:355；默认列 main-view.vue:399-489）。该列左缘 = 前序列宽和（默认列集 ≈ 1944px）> 舞台宽 960，`scrollLeft = 0` 时不进入 `viewCols`，绘制侧不调用其 `_value`；**必须在初始水平视口外**——`resolveCellContent` 每帧对绘制格调用 `_value`（cell-painters.js:230-236），可见计数列的帧增量不可能为 0。采样：滚动到目标段等 2 帧 → `window.__valueCalls = 0` → 保持 `scrollTop` 不变，逐帧派发 5 次 `scroll` 事件（每次间隔一帧，采样前后 `getLayoutInfo().viewRows` 不变）→ 读 5 次帧增量 | 改后 5 帧增量全 0；改前每帧 ≈ `viewRows.count` |
| 首扫成本 | 默认场景 100k：重载页面 3 次（或数据规模 few↔full 切换 3 次）触发 3 次全量扫描，每次读 `getLayoutInfo().lastRelayout.elapsed - lastPaint.elapsed` 近似估高段（`lastPaint` 取自同一次 relayout 内的同步 redraw；`elapsed` 含尾精算 + 重绘，不能直接比），≥3 次取中位 | 估高段中位下降；两轮 `lastRelayout.scanCount` 均 = 100000 |
| 滚动绘制 | 同一稳态帧序列的 `lastPaint.elapsed` 中位 | ≤ 基线 ×1.1 |
| **recordsVersion 就地改值** | multiline 场景：`window.__ctStage().records[1].long10 = LONG_TEXT` 就地改长文本 → 点"recordsVersion++"按钮（不滚动）→ 等 ≥300ms（watch + relayout） | `getLayoutInfo().contentHeight` 与本行 `getCellRect(...).height` 增大、格线随动（P1 阻塞项专项）。默认场景 memo 列未配 multiline（main-view.vue:438-461），文本变长不改行高；既有 `onAsyncMutate` 只改短 memo，均不可用于此断言 |
| 功能锚点 | multiline 场景 contentHeight、100k contentHeight、进窗精算后格线位置；items 场景 list/link 条目行高（条目数 > 1）与 data/table 页面（DOM 版共用 column-types）渲染不变 | 数值逐一不变；条目列与 DOM 版无回归（B5） |

**不要用 `measureText` 计数判断 P1**：`wrapCache` 命中后底层测量本就接近 0，计数无区分度；`ensureRowMeasured` 无稳定劫持点，运行时用上面的 `_value` 计数器，确定性覆盖走新增 controller 自检。

### 控制器自检设计（新增）

`createRowGeometryController` 无 Vue/DOM 依赖，可用假 ctx 直接断言：

- 夹具：3 列（一列 `_maxLines: 2` 且 `_isTreeColumn: true` 的多行树形列，8 字长文本可折行；一列 `type: 'list'` + 手写 `_render` 条目列，与 self-checks/row-geometry.js:52-54 `listRenderOf` 同式；一列专用 `_value` 计数列）；10 行；假 `measure`（等宽 10px）/`wrapCache`；`getTheme: () => THEME`（与 self-checks/row-geometry.js:66 同口径 rowHeight 36 / cellPadding 8 / cellLineHeight 18 / fontSize 14，断言 7 的 36 → 52 依赖该值：8 字 ×10px = 80，inset 0 → 内容宽 84 ≥ 80 单行 36，inset 16 → 68 < 80 两行 52）；`getSpans: () => null`（断言 4 用 `buildSpans` 构造的真实 SpansIndex）；`getRecordsVersion: () => state.recordsVersion`；`treeIndents: (colIndex, row) => (colIndex === 0 ? 16 * state.levels[row] : 0)`（fixture 自定）；假 `scrollEl { scrollTop: 0 }`；`getLayout` 返回 `{ viewH, colWidths: [100, 100, 100], headHeight, stickyHeight }`；`getColumnKey: col => col?.field ?? ''`。
- 断言 1：首次 `remeasureVisibleRows` 后专用计数列 `_value` 调用数 = 窗口行数；再次调用增量 0。
- 断言 2：`state.recordsVersion++` 后（rows 引用不变、`resolveForRelayout` 不重扫）再调用，增量恢复 = 窗口行数。
- 断言 3：`resolveForRelayout` 传入变化后的 `colWidths`（触发 `syncMeasuredHeightCache` 清空；假 `getLayout()` 的 `colWidths` 同步更新后再 remeasure）→ 重算。
- 断言 4：`getSpans` 返回新 SpansIndex（remeasure 时同一实例）→ `resolveForRelayout` → 重算。
- 断言 5：几何高度被直接抬高（`controller.geometry.updateHeight(row, 100)`，模拟 `mergeMeasuredHeights` max 命中）→ 不跳过、重算并回落。
- 断言 6（列变更修订追加）：条目列 `_render` 计数稳定时跳过后高度不变；`recordsVersion++` 后重算并反映新计数（非纯 render 的粘性契约）——覆盖 link/list 条目列的跳过等价路径。
- 断言 7（交叉审改追加）：树缩进变化（`state.levels` 改，rows 引用/版本不变）→ 缩进快照失配 → 重算，且高度随折行宽度变化（缩进 0 → 16 时行高 36 → 52）。
- 断言 8（交叉审改追加）：rows 引用替换为同 record 对象的新数组（模拟树重建/排序）触发重扫 rebuild → merge 后 `totalHeight` 不低于重扫前，随后 `remeasureVisibleRows` 增量 0（缓存快照未被清空）。

### 回归底线

1. demo 自检全绿（`http://localhost:3000/data/table-ex/`，含 b3528d7 既有断言与新增断言、controller 模块，0 FAIL）。
2. `npm run build` 通过；`eslint` src 口径零 error（complexity 豁免注释保留）；`npx stylelint "src/**/*.scss"` 零报错。
3. playwright 冒烟：multiline 滚动锚定（格线不跳）、编辑提交行高重估、树展开 contentHeight 变化、recordsVersion 就地改值行高更新、data/table 页面（DOM 版，共用 column-types）条目列渲染不变。

## 7. 实施顺序

0. 夹具与基线（不改 src）：先落 §5 的 demo 夹具（性能计数列开关、recordsVersion 通知按钮，默认关闭），按 §6 采集并留存基线（稳态 `__valueCalls`、首扫 `lastRelayout - lastPaint`、`lastPaint`、multiline/100k contentHeight、items 条目行高）；基线未采到不得进入 src 改动。
1. P5 + P2-2/P2-3（零行为差，先落）。
2. P4（纯函数 + 自检）。
3. P1（controller 快照维度 + ctx `getRecordsVersion` 注入 + controller 自检，热路径主改动）。
4. P2-1/P2-4（同批落地：描述表 graphicItem/分支收敛一体改动；行为差异仅 P2-1 的 0/1 边界，最后做以单独验证等价性；P2-4 条目列分支与 A9 数组分支均零行为差）。

每步跑自检后进下一步；P1 后跑滚动锚定 + recordsVersion 冒烟；终验按 §6 全量复采并与步骤 0 基线对比。
