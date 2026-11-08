# 设计

## 方案概述

7 项逐一核实（证据见「逐项结论」），6 项确认缺陷修复、1 项非缺陷不改。改动边界：经典 table `base/table.vue`（问题 1/2）、table-ex 绘制/几何/编辑/spans 模块（问题 3/4/5/7）、demo 验证载体 2 个文件。无公开 API 变化。

| # | 结论 | 修复点 |
|---|---|---|
| 1 | 确认缺陷 | `fixedLeftColumns: N` 实钉 N+1 列 → 恰好 N 列（`internalColumns` 固定块重写） |
| 2 | 确认缺陷 | 列指示 offset 恒 `scrollLeft` → 按实际遮挡量 `max(0, fixedWidth + scrollLeft − cellLeft)` |
| 3 | 确认缺陷 | `trimItemHits` 豁免条件方向写反 → `(row < start \|\| row >= end) && !(keepRows && keepRows.has(row))` |
| 4 | 确认缺陷 | spacerWidth 双源 → 提取 `spacerWidthOf` 共享（layout.js 导出） |
| 5 | 确认缺陷 | `rawWasArray` 死字段 → 删除 |
| 6 | 非缺陷（行为等价） | 不改代码（bool 空值 `{ text: null }` 双链等价落占位，依据见下） |
| 7 | 确认缺陷 | spanMethod 返回数组走索引串误导警告 → 数组形态单独拦截 + 准确警告 |

问题 1 取舍：代码内部（onResize 分界线、hover 遮挡计算）在"N+1 列"下自洽，但文档口径（`docs-site/components/table.md:281`「固定左侧 N 列」、`:317`「固定左侧列数」）与 table-ex 同名 prop 语义（`geometry/layout.js:313-314` `fixedCount`/`fixedWidth = colLefts[fixedCount]` 恰好 N 列）均为 N 列；"改文档承认 N+1"会使同 prop 两组件语义分裂且与 demo note 可观察行为矛盾 → 改代码。

## 逐项结论（核实证据）

### 1. 固定列 off-by-one — 确认缺陷

- 现象：`base/table.vue:184-197`，`fixedLeftColumns: N`（列均有像素宽）时 idx 0..N 全部拿 `_fixed` + `fixed-col`（`base/table.scss:64-67` sticky）+ left 定位；idx === N（`idx < fixed` 首个 false 列）被标 `last-fixed-col` 但仍 sticky。`onResize`（`table.vue:312-321`）以 last-fixed-col 右缘计 `fixedColumnsWidth` = N+1 列总宽。
- 文档与 demo：`docs-site/components/table.md:281,317`；`demo/src/data/table-advanced/main-view.vue:19,24`（note「固定左侧 N 列」+ `:fixed-left-columns="2"`，wideColumns 前 3 列 80/140/220px，现状邮箱列也被钉住）。
- table-ex 对照（N 列语义）：`geometry/layout.js:313-314`、`table-paint/paint-body.js:335`（固定区画 `[0, fixedCount)`）、`demo/src/data/table-ex/self-checks/layout.js:333` 断言「固定 2 列」。
- 历史：逻辑自 c9b8952（2026-08）即如此；0ef008b 注释「自身仍 sticky」是现状描述非设计依据，无任何文档宣称 N+1 语义。
- 消费端影响面（全部收敛在 base table 内）：`_fixed` 仅 `table.vue:187,281`；`last-fixed-col` 仅 `table.vue:312` + `table.scss:134`。修复后两者语义随"恰好 N 列"平移，无需改动。

### 2. 列指示 offset — 确认缺陷

- 坐标口径（`table.vue:279-281` 注释）：指示条随内容滚动；sticky 格 offsetLeft 已含滚动位移；普通格 `cellLeft` 为内容坐标布局位置，视口左缘 = `cellLeft − scrollLeft`，固定区右缘（视口）= `fixedWidth`。
- 正确遮挡量 = `max(0, fixedWidth + scrollLeft − cellLeft)`；代码（`table.vue:281-283`）恒取 `scrollLeft`，仅 `cellLeft === fixedWidth`（紧邻固定区首列）时相等。
- 数值例：列宽 200、cellLeft=400、fixedWidth=300、scrollLeft=150 → 实际遮挡 50，代码裁 150：指示条左缘偏右 100、宽仅 50（实际可见 150）——错位且过窄，与任务实验现象一致；深滚（cellLeft < fixedWidth）时裁剪不足，指示条延伸到固定区下方。

### 3. trimItemHits — 确认缺陷

- 「锚行恒 < viewRows.end」验证成立：`regionsForRows`（`spans/spans.js:134-154`）遍历 r ∈ [from, to) 取 `rowRegions` 挂载区域；`fillRowRegions`（`spans/spans-method.js:107-114`）只对 [region.row, region.rowTo) 挂载 ⇒ 被取到的区域恒满足 region.row ≤ r < end。`row >= end && keepRows.has(row)` 为死分支；锚行滚出方向只能是 `row < start`（跨行区域自上延伸进窗口），被 `paint-body.js:52` 无条件删除。
- 现象链：region pass 绘制锚行 < start 的区域并写 `itemHits[region.row]`（`paint-body.js:181,316`）→ `endSpanFrame`（`painter.js:237`，恒传全窗口 viewRows）删除 → `resolveItemClick`（`interaction/click-resolve.js:196`，经 `resolveSpanCell` 归一到主格坐标）查空 → 区域内 link/tag/button 点击与 hover 光标丢失。
- 设计意图佐证：`demo/src/data/table-ex/main-view.vue:894-897` spans 场景注释明言「锚行可滚出窗口：验证……锚行滚出后条目/img 链路」——豁免意图存在，条件方向写反。
- 修复安全性（任务约束 3 逐点）：
  - 锚行在窗口内的正常路径：`row < start || row >= end` 均 false，不受 keepRows 影响，行为不变。
  - 无 spans 表格：keepRows = null ⇒ `!(null && …)` 恒 true，条件退化为 `row < start || row >= end`，与修复前逐字节等价（修复前同场景 `row >= end && !(null)` 亦为 `row >= end`）。
  - 绘制范围与写入一致性：`spanKeepRows.add(region.row)` 与 `drawCellClipped` 写 itemHits 在同一循环、同一列分区过滤与相交过滤之后；`record == null || !col` 提前 continue 时两者同步跳过；veil 编辑格清空组后保留空 Map 键，`resolveItemClick` 查空组得 null，符合 veil 语义。
  - 脏区局部帧（rowBand/单格）：region pass rows 被 clamp 到脏带，窗口相交但本帧未绘制的区域不进 keepRows，其 < start 锚行仍被删——与修复前行为相同（修复前无条件删），非回归；下次全量/相交帧恢复。
  - Map 增长：豁免行数 ≤ 本帧绘制区域数（与窗口相交的区域），有界，不违「长滚不增长」目标。

### 4. spacerWidth 双源 — 确认缺陷

`geometry/layout.js:334` `Math.max(colsWidth, containerWidth)` 与 `ex/composables/use-column-resize.js:55` `Math.max(colsWidth, base.stickyWidth)`；`relayout` 中 `stickyWidth = containerWidth`（`layout.js:330`）⇒ 两式等价但手工同步，漏改风险成立。

### 5. rawWasArray — 确认缺陷（死字段）

全项目 grep 仅 `editor.js:180` 定义与 00-task.md 提及；`context` 为模块内私有变量不导出；`applyCommit`（`editor.js:211`）解构未用；`editor-resolve.js:47,83,110` 均直接 `Array.isArray(rawValue)` 判定。删除安全。

### 6. bool 空值 `{ text: null }` — 非缺陷，不改

- DOM 链：`base/table-row.vue:29` `{{ cell.text ?? cell.col.placeholder }}`——`{ text: null }` 产 cell.text = null，与 text/enum/icon 产 null/undefined（`text.js:49`、`enum.js:14`、`icon.js:47`）经 `?? placeholder` 完全等价。
- canvas 链：`ex/cell-paint/cell-content.js:118-134` + `cell-paint/cell-painters.js:217` `content.text ?? col.placeholder ?? placeholder`——null 与 undefined 等价。
- 估高链不消费 `_render`（`ex/geometry/row-geometry.js:44-51` 用 `_mapText`/字段取值）。
- 历史：0e0467d 前即 `{ text: value == null ? null : … }` 形态，非新引入。协议形态偏差无任何消费者感知 ⇒ 不构成行为缺陷，不改代码。

### 7. spanMethod 数组形态 — 确认缺陷（误导警告）

`spans/spans-method.js:260` `typeof declared !== 'object'` 放行数组 → `:262` `Object.keys` 产索引串 → `resolveDeclColumns`（`:131-164`）按 key/field 匹配必不中 → 每键一条「键 "0" 无匹配列」警告（`:149`）。文档口径（`docs-site/components/table-ex.md:243-246`）仅支持 null/对象，无数组合法声明 ⇒ 非有意行为，属形态校验漏洞；行为结果（忽略）与口径一致，仅警告误导。

## 遵循约定与复用

无探索报告，自行提取（源自涉案模块现状）：

- 纯函数模块约定：`geometry/layout.js` 全纯函数不持状态 → `spacerWidthOf` 同风格导出（问题 4）。
- 警告约定：`spans.js:29-40` `createWarner`（key 级去重）→ 问题 7 新警告走 `emitWarn`，key 取 `spanMethod:array`（全局一条，文案无行级差异不逐行刷）。
- 注释风格：中文块注、`path:line` 可核；`table.vue` / `paint-body.js` 头注随行为同步改写。
- demo 自检：`self-checks/*.js` 导出 `checks` 数组（`{ name, fn }`），`index.js:34-35` 聚合；新增断言仅在数组末尾追加。
- BEM/`mu-` 前缀、Vue 3 `<script setup>`、纯 JS——本次无新增样式与组件。

## 改动清单（含新增或修改的测试文件）

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/base/table.vue` | internalColumns 固定块重写（恰好 N 列）+ 注释改写；setColHoverIndicator offset 公式 + 注释改写 | 问题 1、2 |
| `src/components/table/ex/table-paint/paint-body.js` | `trimItemHits` 判定条件 + 头注（L46-47「仅豁免 row ≥ end」口径）更新 | 问题 3 |
| `src/components/table/ex/geometry/layout.js` | 新增导出 `spacerWidthOf(colsWidth, containerWidth)`；`relayout` L334 改引用 | 问题 4 |
| `src/components/table/ex/composables/use-column-resize.js` | L55 改引用 `spacerWidthOf`（import 补项） | 问题 4 |
| `src/components/table/ex/editing/editor.js` | L180 删 `rawWasArray: Array.isArray(rawValue)` | 问题 5 |
| `src/components/table/ex/spans/spans-method.js` | L260 补 `Array.isArray(declared)` 拦截 + `emitWarn('spanMethod:array', …)` | 问题 7 |
| `demo/src/data/table-advanced/main-view.vue` | 固定列演示 mu-table 加 `hover-mode="cross"` | 问题 1/2 验证载体（现状默认 row 模式无列指示） |
| `demo/src/data/table-ex/self-checks/painter.js` | checks 数组末尾追加 1 条 trimItemHits 断言（追加式，不动他人未提交改动） | 问题 3 回归测试 |

不改动：`column-types/bool.js`（问题 6 非缺陷）；`table.scss`、`onResize`、docs-site 文档（文档口径本为 N 列，修复后代码与文档一致）。

## 接口 / 数据结构

无公开 API 变化。内部新增：

```js
// geometry/layout.js
/** spacer 宽度：横向滚动范围由最宽元素撑出，内容宽与容器宽取大（relayout 与
    拖拽临时几何共用，单一事实源） */
export function spacerWidthOf (colsWidth, containerWidth) {
  return Math.max(colsWidth, containerWidth)
}
```

`internalColumns` 固定块（问题 1 目标形态，伪代码级实现）：

```js
if (left != null) {
  const widthPx = getPixelNumber(width)

  if (idx >= fixed) {
    left = null                       // fixedLeftColumns 之外首个列退出固定区
  } else {
    col._fixed = true
    col._ctrlStyle = { left: `${left}px` }
    col._ctrlClass.push('fixed-col')

    if (!widthPx || idx === fixed - 1 || idx === props.columns.length - 1) {
      col._ctrlClass.push('last-fixed-col')  // 末个固定列：fixedWidth 计算锚 + 分界线
    }

    if (widthPx) left += widthPx
    else left = null                  // 无像素宽列自身仍 sticky，但累加终止
  }
}
```

行为矩阵：全宽 `fixed=N` → 恰好 N 列 sticky，last-fixed-col = 第 N 列；`fixed` 内遇无宽列 → 该列仍 sticky 并终止（同旧行为）；`fixed ≥ 列数` → 全列 sticky 且末列标 last-fixed-col（旧实现无标记致 fixedColumnsWidth 不更新，顺带修正，属同缺陷边界）。

`setColHoverIndicator`（问题 2）：

```js
const offset = column._fixed
  ? 0
  : Math.max(0, fixedWidth + scrollLeft - cellLeft)
```

## 被拒绝的备选

- 问题 1 改文档承认 N+1：与 table-ex 同名 prop（恰好 N 列）语义分裂，文档无法自洽；demo note 与用户可观察行为（第 3 列被钉）矛盾。拒绝。
- 问题 1 仅改 fixedColumnsWidth 计算不动 sticky 集：钉住列数本身是缺陷本体，视觉行为不变等于未修。拒绝。
- 问题 3 改为「keepRows 行永不删」或去掉 trim：失去「长滚不增长」防护（`paint-body.js:46` 头注目标），且本帧未绘制的区域条目残留不可控。拒绝。
- 问题 7 数组静默 continue：消除误导警告但误用失去反馈。拒绝。
- 问题 2 指示条改视口坐标 sticky 定位：改动面大（DOM 结构 + 全部 hover 路径），非最小修复。拒绝。
- 问题 6 `return null` 统一形态：零行为收益的清理，超出本任务「仅改核实为缺陷项」边界。拒绝（备选记录于未解问题）。

## 风险与回滚（含合并风险）

- 全部为行为修复，无数据/接口迁移，单向门：无。全部双向门（git revert 单提交即回滚）。
- 爆炸半径：
  - 片 1：经典 table 使用 `fixed-left-columns` 或 column/cross/cell hover 的场景（消费方仅 demo/文档站示例；dist 使用方按语义修复后更符合文档）。
  - 片 2：table-ex 有合并单元格（spans 非 null）且锚行滚出窗口上方时的条目命中；无 spans 表格零变化（条件退化等价，见逐项结论 3）。
  - 片 3：table-ex 拖拽调宽（几何等价替换）、编辑链（删死字段）、spanMethod 误用警告文案。
- 合并风险：`demo/src/data/table-ex/self-checks/` 存在他人未提交改动（cell-painters/index/interactions/painter/spans 五文件 M 状态）——本任务对该目录仅 painter.js 末尾追加，冲突面最小化；实施时不得重排他人条目。

## 测试计划

| 验收标准 | 片 | 手段 | 检查方式 |
|---|---|---|---|
| 1. 7 项逐项结论 | 终验 | `人工` | 本文档「逐项结论」逐条有 `path:line` 证据；6/7 附行为/安全推导 |
| 2. 修复正确 + 注释同步 | 片 1/2/3 | `人工` | 代码评审：改动清单 8 文件 diff，注释与行为一致 |
| 3. npm run build | 终验 | `命令` | `npm run build` 退出码 0 |
| 4a. 固定列/列指示回归 | 片 1 | `浏览器` | `/data/table-advanced/?t=<ts>`：见步骤 1.2/1.3 判据 |
| 4b. spans 命中回归 | 片 2 | `浏览器` | `/data/table-ex/?scene=spans&t=<ts>`：见步骤 2.3 判据 |
| 4c. 杂项回归 | 片 3 | `浏览器` | `/data/table-ex/` 自检面板全绿 + 拖拽调宽 + spans 场景名称列编辑提交 |
| 4d. 经典 table 回归 | 终验 | `浏览器` | `/data/table/?t=<ts>` hover cross 表列指示、bool 列显示正常 |
| 5. 不扩大范围 | 终验 | `命令` | `git status --short` 仅含改动清单 8 文件（+ 任务外既有未提交项不新增触碰） |

## 实施步骤

### 片 1：固定列语义与列指示（base table）

- 1.1 验证载体先行：`demo/src/data/table-advanced/main-view.vue` 固定列 mu-table 加 `hover-mode="cross"`。判据：demo 页该表 hover 出现列指示条。文件：demo/src/data/table-advanced/main-view.vue。依赖：无。
- 1.2 `internalColumns` 固定块重写 + 注释（形态见「接口」节）。判据（DOM 断言）：表格横向滚动后，第 1/2 列 th 的 `getBoundingClientRect().left` 不随 scrollLeft 变化，第 3 列（邮箱）随之左移；表头第 2 列含 `last-fixed-col` 类、第 3 列不含 `fixed-col` 类。文件：src/components/table/base/table.vue。依赖：无。
- 1.3 `setColHoverIndicator` offset 公式 + 注释。判据（DOM 断言）：滚至中部（第 4+ 列部分被固定区遮挡）hover 该列表头/单元格，读指示条元素 `--hover-col-left`/`--hover-col-width` 计算属性：left = 固定区右缘（第 2 列右缘 x），width = 该列可见宽（`列右缘视口 x − 固定区右缘`）。文件：src/components/table/base/table.vue。依赖：1.1、1.2。

### 片 2：spans 锚行命中保留（table-ex）

- 2.1 回归断言先行（修复前须红）：`self-checks/painter.js` checks 末尾追加——自建夹具（link 列 + spanMethod 行 0 rowspan=15），`makeState` 传 `spans`、`itemHits: new Map()`、`scrollTop` 使 viewRows.start > 0 且区域与窗口相交，`painter.draw` 后断言 `state.itemHits.get(0)` 的条目组存在（锚行 0 < start 仍保留）；同断言附无 spans 对照（itemHits 窗口外行删除不变）。判据：修复前该断言失败、修复后通过。文件：demo/src/data/table-ex/self-checks/painter.js（末尾追加，不动他人改动）。依赖：无。
- 2.2 `trimItemHits` 条件 + 头注更新。判据：自检面板该断言绿、其余 painter 断言不回归。文件：src/components/table/ex/table-paint/paint-body.js。依赖：2.1。
- 2.3 demo e2e：`/data/table-ex/?scene=spans` 纵向滚动使某分组（分类/子类/名称合并区，组高 8 行）锚行滚出容器顶，点击区域内「链接」条目 → 页面事件日志出现 cell-item-click 载荷；hover 该链接 cursor 为 pointer。判据：点击命中（修复前 miss）。文件：无（纯验证）。依赖：2.2。

### 片 3：table-ex 杂项修复

- 3.1 `spacerWidthOf` 提取 + 两处引用。判据：`npm run build` 通过；`/data/table-ex/` 拖拽任一列调宽后横向滚动条范围随内容宽增长（spacer 撑宽正常）。文件：geometry/layout.js、composables/use-column-resize.js。依赖：无。
- 3.2 删 `rawWasArray`。判据：`git grep rawWasArray` 0 命中（除任务文档）；spans 场景点击名称列进入编辑、Esc 取消、修改提交链正常。文件：editing/editor.js。依赖：无。
- 3.3 数组形态拦截 + 警告。判据：临时在自检或控制台调用 `buildSpans` 传返回数组的 spanMethod，警告文案为「spanMethod 返回值须为 { 列键: 跨度 } 对象，收到数组，该行忽略」且仅一条（key 去重）；对象/ null 路径断言不回归（self-checks/spans.js 既有断言绿）。文件：spans/spans-method.js。依赖：无。

### 终验

- 4.1 `npm run build`。
- 4.2 demo 回归：`/data/table/`（4d）、`/data/table-advanced/`（4a 复核）、`/data/table-ex/?scene=spans`（4b/4c 复核）、`/data/table-ex/` 自检面板全绿。
- 4.3 范围核对：`git status --short` 与改动清单一致。依赖：片 1、2、3 全部完成。

## 未解问题

1. 问题 6 bool 空值产物形态统一（`bool.js:16` 改 `return null`，1 行零行为变化）：本次结论为非缺陷不改；若用户要求协议形态统一，另批处理。
2. 片 2 demo e2e 的「锚行滚出窗口」精确滚动量依赖舞台实际行高，验证时以区域首行 `getBoundingClientRect().top < 容器 top` 为准（DOM 断言），不做固定像素脚本。
