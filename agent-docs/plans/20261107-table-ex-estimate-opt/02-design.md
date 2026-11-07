# 设计

## 方案概述

三项互相独立的首绘优化，全部行为冻结（不改 rowHeightOf 公式、不改折行算法、绘制/交互链路零触碰）：

1. **表级估高短路**（AC1）：`row-geometry-controller.js resolveForRelayout` 在脏判定前早退——`mode === 'uniform' && spans === null && 全列为确定单行列` 时 `scanCount = 0`，直接返回 `resolveGeometry(rows, theme)`。依据：谓词 ⟹ `isVariableCandidate()` false（无变高候选列）∧ `hasArrayValues` false（无条目列，唯一产源 row-geometry.js:296-298）⟹ `rescanRowHeights` 必返回 false（controller:193）且 heights 全部弃用——该次扫描是 no-op。因此短路分支按「已扫描」写回 `lastScanRows / lastScanColumnSig / lastScanMetricsSig / lastScanSpans`（`lastScanColumns` 由 controller:324 既有行照常更新），短路后控制器状态与基线「实际执行一次 no-op 扫描」逐字段一致；不写回会让 `lastScan*` 停留在更早的列集合上（反例见「表级短路谓词与 `lastScan*` 一致性论证」）。
2. **link/list 计数通道**（AC2）：`ListColumn.compile` 的 canvas 产物挂 `render.count(record, value)` 方法（与渲染共享 `getItems`/`normalizeEntries`/`max` 闭包，构造上不可能与渲染计数分歧）；`row-geometry.js linkItemCountOf` 优先走 count，回落现状 `_render` 全产物。估高、进窗精算、编辑单行重估三条路径共用该函数，单点改动全覆盖。link.js 零改动（委托链自动携带）。
3. **估高免取值**（AC3 数据单行）：`computeRowHeights` 内当 `rowMetricsOf(theme)` 的度量满足 `rowHeight ≥ 2*padding + lineHeight`（缺省 36 ≥ 34 成立，table-ex.scss:4-6；取回退后的度量而非裸 theme 字段，与 rowHeightOf 同源）时，非条目列跳过 `valueOf`（count 0 与 1 行高等价）；度量不满足回退现状逐格取值。单行列二分：确定单行列 = `!(isEntryColumn || (_maxLines ?? 1) > 1 || multiline)`；数据单行列 = 变高候选列在场但数据全单行，由本项免取值 + 计数通道覆盖，不做表级短路（variable 模式 heights 参与几何重建与 merge，见被拒绝备选 4）。prepared 列恒有 `_resolveMaxLines`（cell-content.js:90），其值只由 `maxLines`/`multiline` 派生（:49-59、84-90），00-task 所称「无 `_resolveMaxLines`」等价于谓词中的 `_maxLines ≤ 1 ∧ !multiline`，无需额外条件。
4. **wrapCache LRU**（AC4）：`text-wrap.js createWrapCache` 内部改 Map LRU（get 触碰、set 逐条淘汰最旧），接口 `{ get, set, size }` 不变，消费方（row-geometry 精算 / cell-text 绘制 / cell-tooltip）零改动。

触及模块边界：`geometry/`（row-geometry.js、row-geometry-controller.js）、`column-types/list.js`、`shared/text-wrap.js`、demo 自检 4 文件、demo `main-view.vue`（AC1 场景载体）。无新增文件、无 API/协议变更（`.count` 为 canvas 产物附加方法，dom 通道不挂）。

## 遵循约定与复用

（无探索报告，自改动模块提取）

- 行高单一事实源：`rowHeightOf` 公式（row-geometry.js:129-131）与 `rowMetricsOf` 回退（:133-139）；fast path 只跳输入取值，不触碰公式。
- 折行单一事实源：`wrapLines` + 注入 measure/wrapCache（text-wrap.js 模块头 :1-12）；LRU 只换缓存结构，值仍是 key 的纯函数。
- compile 双通道约定：`compile(column, dom)`（base/table.vue:180 dom 调用 `compile(el, true)`；ex 侧 cell-content.js:43 `compile(column)`）；`.count` 仅挂 canvas（`!dom`）产物。
- 计数口径分层：render 内层 max（listOption.max → `shown = entries.slice(0, max)`，list.js:111-112）→ 消费侧 `_maxItems`（`Math.min(count, maxItems)`，row-geometry.js:61；`_maxItems` 来自 `column.maxItems` 钳制 1–10，cell-content.js:85）。count 通道保持同分层。
- 现状事实：函数形态 `column.maxLines`（无 multiline）今即被忽略（cell-content.js:84 `clampLimit(NaN) → null` + :58 落 `() => 1`），与本设计无关、不改。
- 自检漂移须同批改（agent-docs/knowledge/project/canvas-pixel-assert-anchor-drift.md）；计数断言冷键防预热（table-ex-counter-assert-warm-cache.md）。
- demo 断言通道：`window.__canvasTable.getLayoutInfo().lastRelayout = { elapsed, scanCount, rebuild }`（use-relayout.js:111、main-view.vue:352-354）；`window.__ctStage()` 舞台数据（main-view.vue:360）。读 `lastRelayout` 遵循既有约定：先复位触发源、两 tick、有效性判据（main-view.vue `onMeasureTreeSort`），不得以对象引用判新。
- demo 性能计数列 `window.__valueCalls`（main-view.vue:519-528）在 scan 期语义随免取值变为 0（仅精算期有值）；repo 内无断言消费，profiling 知识页口径留待任务收尾按用户确认更新。

## 改动清单（含新增或修改的测试文件）

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/ex/shared/text-wrap.js` | `createWrapCache` 内部改 Map LRU：get 命中 delete+set 触碰；set 时已存在则重插，超限逐条淘汰最旧（`cache.keys().next().value`）；接口与 `WRAP_CACHE_LIMIT` 不变 | AC4 |
| `src/components/table/column-types/list.js` | `ListColumn.compile` 返回值改为命名函数 `render`，在 compile 作用域内、`return render` 前按 `if (!dom) render.count = (record, value) => …` 挂**一次**（不得写进渲染函数体，否则每次绘制重建闭包）——复用闭包 `getItems`/`normalizeEntries`/`max`；非数组/空 entries 返 0，否则返回 `(max ? entries.slice(0, max) : entries).length`——与渲染 `shown` 同表达式 list.js:111-112，**不得写成 `Math.min(entries.length, max)`**：`max` 为负/小数/字符串时 `slice` 截断语义不同 | AC2 |
| `src/components/table/ex/geometry/row-geometry.js` | ① 导出 `isEntryColumn(col)`（现内部 `isLinkColumn` 别名导出，实现不动）；② `linkItemCountOf` 在 `typeof col._render?.count === 'function'` 时走 `Math.min(count(record, value) || 0, maxItems)`，否则回落现状全产物路径；③ `computeRowHeights`：循环前由 `rowMetricsOf(theme)` 算 `flat = metrics.rowHeight ≥ metrics.padding*2 + metrics.lineHeight`，flat 时非条目列跳过 `valueOf`（count 记 0；非条目列 `hasArrayValues` 恒 false，判定可略）；非 flat 走现状分支。complexity 豁免注释已存在（:316-317） | AC2、AC3 |
| `src/components/table/ex/geometry/row-geometry-controller.js` | `resolveForRelayout` 在 `isScanDirty` 判定前插入短路：`mode === 'uniform' && !spans && columns.every(col => !isEntryColumn(col) && !((col._maxLines ?? 1) > 1) && !col.multiline)` → 写回 `lastScanRows / lastScanColumnSig / lastScanMetricsSig / lastScanSpans` 后返回 `{ geometry: resolveGeometry(rows, theme), scanCount: 0, rebuild: false }`；置于 `if (columnsChanged) lastScanColumns = columns` 之后，spans 缓存重置与 `syncMeasuredHeightCache` 照常先行 | AC1 |
| `demo/src/data/table-ex/self-checks/text-wrap.js` | 改写 :279「整体清空」检查为 LRU 语义（size ≤ limit、最旧淘汰、get 触碰改变淘汰序），断言重复折行命中缓存（同 key 二次 get 免 measure——经注入计数 measure 断言） | AC4 安全网 |
| `demo/src/data/table-ex/self-checks/row-geometry.js` | 新增：① count 通道——带 `.count` 的 `_render` 估高/精算计数正确且 render 主体不被调用（spy）；无 `.count` 回落现状；② 免取值——flat 夹具（36/8/18）`_value` spy 调用数 0、heights 全 rowHeight；非 flat 夹具（如 rowHeight 30）逐格取值、空值行与非空行行高差保留（现状） | AC2、AC3 安全网 |
| `demo/src/data/table-ex/self-checks/row-geometry-controller.js` | 新增：① 确定单行列 → 首次 resolveForRelayout `scanCount = 0`、mode 保持 uniform、rows 替换后仍 0；② 条件破坏（列加 link / 出现变高候选 / spans 非 null / mode 已 variable）→ 恢复全量扫 `scanCount = n`；③ uniform 表编辑引入多条目 → `remeasureUniformRow` 升级 variable → relayout 全量重扫（升级路径完整） | AC1 安全网 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | 新增：`ListColumn.compile` canvas 产物 `.count` 语义断言（数组过滤、`listOption.max` 截断含负/小数/字符串 max、非数组 0）；dom 产物（`compile(col, true)`）无 `.count`；`LinkColumn.compile` 产物 `.count` 覆盖单值 1 条 / 数组 / 空标签过滤 | AC2 安全网 |
| `demo/src/data/table-ex/main-view.vue` | 新增 `single` 场景：`const singleLineColumns = createAlternateColumns()`（稳定引用）、radio 选项、初始场景读 `new URLSearchParams(location.search).get('scene')` 白名单校验后回退 `default`；`stageColumns` 加 `case 'single'`（records/spans/tree/fixed 走既有 default 分支） | AC1/AC6 场景载体：`mode` 只升不降，「替换列」路径无法回到 uniform |

AC1 场景为何必须新增：`mode` 只升不降（controller:125-130、193-195），默认场景含 list 列且前 5 行 3 条目（main-view.vue:397-399）→ 首绘即升级 variable；此后点「替换列」只换列不降模式，短路谓词恒假，`scanCount = 0` 不可达。`single` 场景以 100000 行 + `createAlternateColumns()`（check/rec_no/name/count/memo 全确定单行列，main-view.vue:506-514）新载入；该场景不参与 canvas/DOM 参照对照（参照表绑定默认 `columns`）。

## 接口 / 数据结构

**`render.count(record, value) → Number`**（list.js canvas 产物附加方法）

```js
// 伪代码：与渲染同闭包，语义 = render 产物 items.length 的免构建等价
render.count = (record, value) => {
  const rawItems = getItems(record, value)
  if (!Array.isArray(rawItems)) return 0            // render 返 undefined → count 0（list.js:105）
  const { entries } = normalizeEntries(rawItems)     // label null/'' 过滤（list.js:16-31）
  if (!entries.length) return 0                      // render 返 undefined → count 0（list.js:109）
  const shown = max ? entries.slice(0, max) : entries // 与渲染同一表达式（list.js:112）
  return shown.length                               // ≡ render 产物 items.length（list.js:124/130）
}
```

消费侧（row-geometry.js `linkItemCountOf`）保持外层钳制：`Math.min(col._render.count(record, value) || 0, maxItems)`，先以 `typeof col._render?.count === 'function'` 守卫（`_render` 可能是对象形态的类型产物）。等价性由共享 `getItems`/`normalizeEntries`/`max` 闭包与同一 `shown` 表达式构造保证——负/小数/字符串 `max` 下 `slice` 截断语义也一致；自定义类型 / 手写 `_render` 夹具无 `.count` → 回落现状路径。`count` 不接收 `recordNumber`：list/link 渲染本身不解构该字段（list.js:102），估高期传入 row 的既有错位（row-geometry.js:357，未加 recordsOffset）不参与计数，语义无变化。

**表级短路谓词与 `lastScan*` 一致性论证**（review 点 1/6）

- 谓词输入仅三个：`mode`、`spans` 引用、列语义（`type/_maxLines/multiline`，均由 `prepareColumn` 一次性派生、列对象不可变）。
- 关键事实：谓词成立时该次扫描是 no-op——`isVariableCandidate()` false（无 `_maxLines>1`/`multiline`）∧ `hasArrayValues` false（无条目列，唯一产源 row-geometry.js:296-298）⟹ `rescanRowHeights` 返回 false（controller:193）且 heights 弃用。
- 因此短路分支写回 `lastScanRows / lastScanColumnSig / lastScanMetricsSig / lastScanSpans`（`lastScanColumns` 已由 controller:324 更新）后，控制器状态与基线「实际执行一次 no-op 扫描」逐字段相同；此后任何输入变化照常经 `isScanDirty`（controller:146-151）触发重扫，不会漏扫，且与基线完全一致。
- 反例（说明「不写回」为何需要更长论证，故不采用）：只要 `lastScan*` 留在更早一次扫描的输入上，就存在 `isScanDirty` 为 false 而谓词已变假的状态——① spans 引用回退到上次扫描用过的同一 SpansIndex（`lastScanSpans === spans`）；② 列集合 A（含 link，行集合 R，扫后仍 uniform）→ B（全单行，短路：`lastScanColumns=B` 但 `lastScanColumnSig=sig(A)`）→ 回到 A（`columnsChanged` 真但 `columnSig===lastScanColumnSig`，行集合 R 未变）。两例结论上仍等价（行集合与语义未变、无条目列/变高候选可升级），但论证依赖额外前提；写回后不再需要。
- `mode` 变 variable 只能来自 `upgradeToVariable`（controller:125-130，强制 `lastScanRows = null`）或 `rescanRowHeights` 自身，两条路径都使后续 `isScanDirty` 为真。
- 编辑路径：`remeasureUniformRow`（controller:207-221）判定 `hasArrayValues` 后调用 `upgradeToVariable` + 全量 relayout；升级第一动作即 `lastScanRows = null`，短路不截断该路径。
- `recordsVersion` 通道不受影响：scan 签名不含 recordsVersion（基线同样不因就地改值重扫）；uniform 模式无精算快照，升级后首轮精算为空缓存全量计算。
- spans 分层语义（spanHeightRoleOf，spans.js:219-229：covered 格 / rowspan>1 主格 excluded）仅影响哪些格参与行高——uniform 模式 heights 弃用，与短路无耦合；本设计仍保守将 `spans === null` 列入条件（对齐 AC1 口径，理由见被拒绝备选 1）。

**免取值等价论证**（review 点 2）

`rowHeightOf(lines) = max(rowHeight, 2p + lines·lh)`（row-geometry.js:129-131）。非条目列 count ∈ {0, 1}（估高路径：文本列恒 1 行下界、空值 0、数组值恒 1）：两值行高相等 ⟺ `rowHeight ≥ 2p + lh`。该不等式成立时非条目列是否取值不影响 heights[row]，且 `hasArrayValues` 对非 link 列恒 false（row-geometry.js:296-298）——跳过 `valueOf` 后逐行 `lines` 只剩条目列真值，行为逐字节一致。不等式不成立（自定义紧凑主题，如 rowHeight 30 < 34）走现状分支。`flat` 与 `rowHeightOf` 的度量同取 `rowMetricsOf(theme)`（:133-139，含缺省回退），不读裸 theme 字段。树缩进 `treeIndents` 估高本就不消费（仅精算宽度用，row-geometry.js:141-144 注释），无交互。主题切换链：字体/度量变化经 `syncMeasuredHeightCache`（controller:89-98）整体清空精算快照并因 metricsSig 变化重扫；颜色-only 切换不触发行高重算；`flat` 每次 `computeRowHeights` 按当前 theme 重算，切换后判定与基线一致。

**度量不等式的取值来源**：`rowHeight/cellPadding/cellLineHeight` 探针读 `--row-height/--cell-padding/--cell-line-height`（theme.js:118-121），组件缺省 36/8/18（table-ex.scss:4-6），demo 覆盖通道 `--row-height: 48px`（main-view.vue:14）亦满足。

**wrapCache LRU**（接口不变）

```js
{ get(key), set(key, value), get size }   // get 命中触碰（delete + set 重插）；set 已存在键重插，超限淘汰最旧一条
```

淘汰必须是**单步** `if (cache.size >= limit) cache.delete(cache.keys().next().value)`，不得用 `while`——`limit ≤ 0` 时 `while` 在空表上死循环（现状 clear-all 在 limit=0 时仍可写入，text-wrap.js:291-293）。`wrapLines` 的双重 `cache.get`（text-wrap.js:275）在 LRU 下两次触碰、无害不改。值是 key 纯函数（text+font+width+maxLines；`measure` 对同参数返回同宽由 theme.js createMeasureCache 保证），淘汰仅导致重算，结果逐字节一致（AC4）。主题切换经 `onThemeChange` 整体重建 wrapCache（use-table-instances.js:50），本项不改变该失效链。

**scanCount 可观测性**：短路 → `resolveForRelayout` 返回 `scanCount: 0` → `lastRelayout.scanCount`（use-relayout.js:111）→ demo `getLayoutInfo()` 断言通道现成，无需新增暴露。

## 被拒绝的备选

1. **spans ≠ null 也纳入表级短路**：代码分析支持行为等价（uniform 模式 heights 弃用、`hasArrayValues` 仅产自 link 列、span 排除只影响参与集合），但 spans 分层是行为冻结约束下最精巧的区域（00-task 约束：spans 语义不得破坏），v1 收窄到 AC1 口径「无 spans」，扩展留待有 spanned 单行表性能诉求时另案验证。
2. **计数通道走独立 `type.count` 协议**（compile 外加 count 入口，或从 list.js 另导 `listItemCount(column, record, value)`）：需在 link.js 抽取派生列构造逻辑供 compile/count 共享（link.js:27-39 的 `listItems` 闭包在 compile 内构建），并新增 geometry→column-types 直接依赖；改动面与语义分歧面更大。改为 compile 产物挂方法，与渲染共享同一闭包，计数口径由构造保证。
3. **measureCache / imageCache 同批 LRU 化**（theme.js:184-199、icon-image.js:21 同款 clear-all）：超出 AC4 范围；measureCache 淘汰策略变化会改变 measureText 调用分布（自检计数断言口径），风险外溢，不动。
4. **数据单行表也做表级短路**（变高候选列 + 无条目列 + flat 度量 → 全行 rowHeight 免整扫）：variable 模式下 heights 参与几何重建与 `mergeMeasuredHeights` 真值混入（controller:103-109、163-169），跳扫须重建等高数组并保留 merge 语义，等价论证链长；且免取值 fast path 已把每行成本降为纯算术（条目列计数 + 一次 max），收益边际，不做。
5. **把短路放进脏判定/扫描内部**（`isScanDirty` 早返回 false，或 `rescanRowHeights` 内跳过 `computeRowHeights`）：前者不跳过扫描且 `scanCount` 仍为 `rows.length`（不满足 AC1）；后者可在更新 `lastScan*` 后跳过，但「本次未扫描」的语义无法回传给 `scanCount`，须另设标记。放在 `resolveForRelayout` 出口是唯一同时满足「不执行 `computeRowHeights`」与「`scanCount = 0`」的位置，且几何返回值与 `resolveGeometry` 天然同源。
6. **LRU 其他实现**（双向链表 + Map、两代缓存、FIFO）：双向链表多一份结构、收益相同；两代缓存淘汰粒度是整代，不满足 AC4「逐条淘汰」；FIFO 不区分热点，长文本滚动场景命中率低于 LRU。Map 插入序 + `delete/set` 触碰是最小改动且均摊 O(1)。

## 风险与回滚

- 合并风险：**全部双向门**——无 API/数据格式变更（`.count` 附加方法、`isEntryColumn` 新导出均为增量），回滚 = revert 上述 9 文件。爆炸半径：估高/精算计数、折行缓存两域，安全网 = demo 自检（11 模块）+ playwright 场景断言。
- 计数与渲染分歧：构造上共享闭包 + 同一 `shown` 表达式消除；残留风险 = 未来 list.js 改渲染逻辑时遗漏 count——自检 ①（render 主体不被调用 + 计数正确，含负/小数/字符串 `max`）与 ④（compile 产物断言）锁口径。
- 免取值依赖度量不等式：若未来 `rowHeightOf` 公式或度量变量含义变化，等价前提失效——自检 ② 双夹具（flat 免取值 / 非 flat 逐格取值）锁前提；fast path 判定与 `rowHeightOf` 同文件就近放置并注释互指。
- LRU get 触碰开销：绘制热路径每次命中多两次 Map 操作（O(1)），相对免折行重算收益可忽略；如反噬可只对 set 淘汰、get 不触碰（退化为 FIFO）——不预留开关，实测再说。
- 短路误判（漏扫导致行高错）：仅当谓词把变高场景误判为确定单行才可能；谓词与 `isVariableCandidate`（controller:83-85）同构取否定 + 条目列排除，自检 ② 覆盖全部条件破坏路径。
- 短路收益边界：只覆盖 uniform 模式。默认性能场景（含 list 列）首绘仍全量扫（AC6 断言 100000）；`mode` 只升不降，勿把短路当数据单行表的通用优化（对应被拒绝备选 4）。
- 回滚顺序：三项互相独立，可单独 revert（片内 9 文件按改动清单对应行拆分）。

## 测试计划

（实施粒度 = 整体，单片；跨行为与全局检查标「终验」）

| 验收标准 | 归属 | 手段 | 检查方式 |
|---|---|---|---|
| 1 确定单行表 scanCount=0、行为一致 | 单片 | `浏览器` + 自检 | playwright：载入 `/data/table-ex/?scene=single`（100000 行、全确定单行列、新实例）→ `lastRelayout.scanCount === 0`、`rowGeometryMode === 'uniform'`；切数据规模 few/empty 再回 full（records 引用替换 → 脏）仍 0；行高（`getCellRect`）与「步骤 0 采集的优化前基线」逐值一致、滚动不跳。自检：controller 新增 ①② |
| 2 计数通道、交互不变 | 单片 | 自检 + `浏览器` | 自检：row-geometry ①（估高/精算计数正确 + render 主体零调用 spy；`max` 负/小数/字符串下计数 = 渲染 items.length）、cell-painters ④（compile 产物断言）。playwright：items 场景复用既有 e2e 断言——list/link 点击 `cell-item-click` 日志、hover 命中区（pill 区非整格，多 pill 不取联合中点）、dots 截断条目点击 payload |
| 3 数据单行行为不变 | 单片 | 自检 + `浏览器` | 自检：row-geometry ②（flat `_value` 零调用 + heights 全 rowHeight；非 flat 现状保持）。playwright：multiline 场景首屏行高快照（`getCellRect` 多行行 > 36）、深滚后 scrollTop 无跳变（锚定）、`__ctStage().records[i]` 就地改长文本 + 「通知 recordsVersion」→ 行高更新（精算缓存快照链不变） |
| 4 wrapCache LRU 逐字节一致、命中 | 单片 | 自检 | text-wrap 自检查：limit=3 填 5 → size 3 且最旧 2 条 get 为 undefined、新键在缓存；get 触碰后插入淘汰序变化；同 key 重复 wrapLines 第二次注入 measure 零调用（命中）；同一输入在淘汰重算前后 `lines`/`lineCount` 逐字相等（冷键加随机小数防预热）；`createWrapCache(0)` 不挂死且 size ≤ 1（单步淘汰） |
| 5 自检全过 + playwright DOM/a11y | 终验 | `浏览器` | demo `/data/table-ex/` 自检面板 11 模块全绿（index.js 现有 11 个模块，含 4 个改动文件的新旧断言）；playwright DOM/可访问性快照断言（不截图） |
| 6 10 万行可交互 + 分场景 scanCount | 终验 | `浏览器` | default 场景（100000 行）：加载可交互（无长任务卡死，事件日志可响应滚动/点击）；`getLayoutInfo().lastRelayout.scanCount` 按场景断言——default 首绘 = 100000（含 list 列，扫描执行但免取值）；点「替换列」= 100000（列签名变脏，mode 已 variable 不短路，与 AC1 的 0 形成对照）；`?scene=single` 首绘/换行数 = 0。读值遵循 `lastRelayout` 既有读取约定（复位 + 两 tick + 有效性判据，参照 main-view.vue `onMeasureTreeSort`） |

lint：`npx stylelint "src/**/*.{scss,css,vue}" --fix`（本片无 scss 改动，预期零差异）。

## 实施步骤

单片整体（预设「实施粒度：整体」），步骤有序、每步可独立验证：

0. **demo AC1 场景 + 优化前基线**：`main-view.vue` 增 `single` 场景（稳定 `singleLineColumns`、radio 选项、`?scene=` 初始值白名单）→ 载入 `?scene=single`（100000 行；此时短路未实现）采集基线：`lastRelayout.scanCount === 100000`、首屏 `getCellRect` 行高与绘制快照。完成判据：场景可载入、DOM/行高基线可复现。文件集合：`demo/src/data/table-ex/main-view.vue`。依赖：无。
1. **wrapCache LRU**：改 `text-wrap.js createWrapCache` + 改写/新增 `self-checks/text-wrap.js` 断言。完成判据：demo 自检 text-wrap 模块全绿（LRU 淘汰/触碰/命中断言过）。文件集合：`src/components/table/ex/shared/text-wrap.js`、`demo/src/data/table-ex/self-checks/text-wrap.js`。依赖：无。
2. **计数通道产物**：`list.js` compile 挂 `render.count` + `self-checks/cell-painters.js` 产物断言。完成判据：cell-painters 模块全绿（count 语义/无 dom 挂载/LinkColumn 委托断言过）。文件集合：`src/components/table/column-types/list.js`、`demo/src/data/table-ex/self-checks/cell-painters.js`。依赖：无。
3. **计数通道消费 + 免取值**：`row-geometry.js`（`isEntryColumn` 导出、`linkItemCountOf` 优先 count、`computeRowHeights` flat 分支）+ `self-checks/row-geometry.js` 断言。完成判据：row-geometry 模块全绿（spy 断言 count 路径估高/精算 render 主体零调用；flat/非 flat 双夹具过；既有夹具——手写 `_render` 无 count——回落路径不回归）。文件集合：`src/components/table/ex/geometry/row-geometry.js`、`demo/src/data/table-ex/self-checks/row-geometry.js`。依赖：步骤 2（`.count` 产物）。
4. **表级短路**：`row-geometry-controller.js` 早退 + `self-checks/row-geometry-controller.js` 断言。完成判据：controller 模块全绿（短路/条件破坏/升级路径断言过；既有 scanCount 断言不回归）；`?scene=single` 重载后 `scanCount = 0` 且行高与步骤 0 基线逐值一致。文件集合：`src/components/table/ex/geometry/row-geometry-controller.js`、`demo/src/data/table-ex/self-checks/row-geometry-controller.js`。依赖：步骤 3（`isEntryColumn` 导出）。
5. **终验**：demo 自检 11 模块全绿 + playwright 场景断言（测试计划 1–6 全项）+ stylelint。完成判据：验收标准 1–6 逐条通过。文件集合：无新增改动（仅验证）。依赖：步骤 0–4。

## 未解问题

无。00-task「背景」5 条发现全部源码复核通过：首绘链（use-table-instances.js:80 → use-relayout.js:58/85 → controller:326/328 → row-geometry.js:318）、uniform heights 弃用与 hasArrayValues 唯一产源（controller:193、row-geometry.js:296-298）、link/list 三次 _render（估高 row-geometry.js:357 / 精算 :122 / 绘制 cell-content.js:134-135）、wrapCache 2000 整体清空（text-wrap.js:16、286-299）、remeasureVisibleRows uniform 早退（controller:351）。
