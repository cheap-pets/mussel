# 设计

基线 `mussel-table` @ `1c8f326`。输入：00-task.md、decisions.md（3 条 [B1] 决定）、01-explore.md。本设计中引用的文件与行号均已在设计阶段逐一核对（2026-10-29）。

## 方案概述

### 问题 1：tag/button/progress 等图形组件内文本垂直偏上

**根因**（01-explore 已定位，本设计确认机制）：

- 全部单元格文本共用 `drawCell` 的槽位锚 `centerY`（`cell-painters.js:259`）与 `ctx.textBaseline = 'middle'`（:266 及各路径）。
- canvas `'middle'` 基线按 **em 方框中点**对齐；浏览器 DOM 组件（如 `.mu-tag` 的 `inline-flex + line-height:1`）按**字体 ascent/descent 行框**做光学居中。两者口径不同，CJK 字形群在 `'middle'` 下系统性偏上——与用户「文本位置偏上」描述方向一致。偏移像素量须运行时测量（见测试计划步骤 1）。
- pill/轨道/check 方框等**几何形状以 centerY 居中是正确的**（与 DOM 规格镜像，constants.js:32-38），错位仅在「字形相对基线」一层。

**修复点**：统一「文本光学居中锚」机制——文本绘制改 `alphabetic` 基线 + `fontBoundingBox` 度量半差补偿，使**字形框中点**对齐槽位 `centerY`（与 DOM 行框居中同口径）。机制按 `ctx.font` 缓存、不硬编码任何像素偏移，随主题字体自动适配。几何形状、命中矩形（`reportHitRect`）、editor 锚一律不动。

**裁定（未解问题 #3）**：选 **baseline 偏移（统一锚 helper）**。拒绝另两种：见「被拒绝的备选」A1/A2。

范围说明：表头文本同为 `'middle'`（`painter.js` 表头绘制），用户未提表头，本次不改（表头与表体文本同向偏移，无相对错位）；editor 为 DOM 浮层，无关。

### 问题 2：夹具「默认 → 多行文本」切换后格线未重绘

**根因**（代码确证，01-explore 已证实，本设计复核一致）：

- `relayoutAndRedraw`（`table-ex.vue:466-509`）结尾只做 `syncCanvasSize` + `redraw()`（:503-504），**不调用 `rowGeometry.remeasureVisibleRows()`**。relayout 后行高停留在**估高**；估高对字符串多行列恒取 1 行下界（`row-geometry.js:100-103` `if (!precise) return 1`）。
- 格线绘制是布局的纯函数：行线 `paintRowGridlines`（`painter.js:580-594`）逐行取 `rowGeometry.topAt(r)`，列线取 `colLefts/colWidths` 前缀。**行高不变 → 格线不动**。
- 精算只有三个触发点：`remeasureVisibleRows()`（仅 scrollFrame 滚动帧 `table-ex.vue:541-545` 与 `onThemeChange`:1204）、`remeasureRow`（编辑提交 nextTick :575-578）。夹具切换链路（scene radio → `stageRecords`/`stageColumns` 引用必变 → records + columns 两个 watch :1289-1303 → relayout ×2）**全程无滚动**；records watch 的 `scrollTo(0,0)` 在已在顶部时不产生 scroll 事件 → 精算永不触发 → 字符串列行高停在估高 36px → 格线不动。

**格线重绘触发链路（验收标准 2 要求的分析结论，代码事实）**：

```
行高真值来源（variable 模式）：
A 估高（relayoutAndRedraw 全链，precise:false，字符串恒 1 行）
  入口：records/columns/recordsVersion/spanMethod+orderBy/fixedLeftColumns watch、
        树三条 watch、onResize(@sizechange throttle 100ms)、
        applyTreeToggle/expandAll/collapseAll、onMounted 首帧
B 精算（ensureRowMeasured 真值，wrapLines 折行）
  入口（修复前）：① 滚动帧 scrollFrame（onScroll → rAF 合帧）
                ② onThemeChange（relayout 后显式补测，:1204）
                ③ 编辑提交 nextTick remeasureRow
格线 = f(rowGeometry.topAt, colLefts) → 格线随行高变化重绘 ⇔ B 类真值触发。
夹具切换只走 A 不走 B（无滚动）→ 格线停在估高位置；
切换后滚动 1px 即触发 B（诊断签名：格线立即跳到精算位置）。
```

**修复点**（参照 `onThemeChange`「relayout 后精算」先例，`table-ex.vue:1180-1207`）：`relayoutAndRedraw` 尾部的 `redraw()`（:504）替换为先例同款三连——`rowGeometry.remeasureVisibleRows()` + `recomputeViewWindows()` + `redraw()`。此后**一切 relayout 出口都保证可视行高为精算真值**，格线随之落在精算位置。`onThemeChange` 保持不动（其尾部三连变为幂等重复：精算缓存命中、`delta=0` 早退，成本可忽略；不动可降低主题链路回归风险）。

成本：variable 模式每次 relayout 增 O(可视行 × 列) 精算（onThemeChange 链路已接受过同成本；record 引用 WeakMap 缓存，重复 relayout 廉价）；uniform 模式 `remeasureVisibleRows` 零成本早退（`row-geometry-controller.js:353`），默认场景无开销。

### 问题 3：树节点 isLeaf 分级（懒）加载

**根因**：table-ex 无 isLeaf 概念。「有子级」唯一判定源 `buildChildrenIndex`（`tree.js:37-61`）＝ 被其他行 parentKey 引用；`isLeaf:false` 且无子级的节点不显示三角、不可点击展开。现有 `update:tree-expanded-keys` 在 toggle 时发全量 key 数组，无「本次展开的是哪个节点」语义，不足以承载懒加载。

**修复点**（三处裁定）：

- **裁定（未解问题 #5）isLeaf 走字段名映射**：`treeProps.isLeaf` 配置字段名，**缺省 `undefined` = 特性关闭**——对齐 tree 组件 `DEFAULT_DATA_PROPS.isLeaf: undefined`「未映射不生效」的向后兼容设计（`tree/default-options.js:8`）。映射开启后语义：`expandable = hasChildren || record[isLeaf字段] === false`；`isLeaf === true` 或未映射 → 维持现状（叶，无三角）。只有**明确 `=== false`** 才触发（与用户原话「isLeaf 明确为 false」一致，`undefined`/缺字段不算）。
- **裁定（未解问题 #4a）事件形态**：新增 `tree-expand` / `tree-collapse` 两个事件（kebab-case，对齐 table-ex 既有 `header-click`/`cell-click`/`column-resize` 命名；语义参照 tree 组件 `nodeExpand`/`nodeCollapse`：每次箭头 toggle 均发，载荷 `{ key, record, level }`）。消费方在 `tree-expand` 内自行判断是否需要加载（对齐 `demo/src/data/tree-advanced` 的 `@node-expand="loadChildren"` 消费形态）。`update:tree-expanded-keys` 维持现状。
- **裁定（未解问题 #4b）回填通道**：**就地 push + `recordsVersion++`**。组件已有该异步通道（recordsVersion watch `table-ex.vue:1307` 只 relayout 不复位滚动；records 引用替换会走 :1292 `scrollTo(0,0)` 闪回顶部）。展开集在 toggle 时已翻转并入 `treeExpanded`，回填后 `childrenIndex`/`flatRows` computed 因 records 数组就地变更而失效重建，子级行直接出现，无需二次 toggle。

实现链：`buildFlatRows` 增可选 `isLeafOf` 参数 → 产出第五个平行数组 `expandable`（`hasChildren` 语义保持纯「有子级」不变）；`tree.js` 新增导出 `expandableAt(flatInfo, row)` 共用谓词（`expandable ?? hasChildren` 旧形态回退）；三个消费点（`drawTreeAffordance` 三角绘制、`isTreeArrowSlot` 命中/光标、`paintTreeArrowAccent` hover 主色箭头）统一改用该谓词。`expandAll`（`use-tree-rows.js:169`）与 `resolveInitialExpandedKeys` 维持「仅有子级」口径不变——懒节点初始无数据，自动展开无意义，由用户逐个触发。

## 遵循约定与复用

提取自 01-explore.md「现有约定」，设计阶段复核属实：

- 纯 JavaScript、Composition API `<script setup>`；table-ex 分层：`painter.js`（背景/格线/表头/hover）→ `cell-painters.js`（单元格内容）、交互判定 `interactions.js`、壳只执行 emit 与状态更新。
- 跨模块镜像常量单一事实源 `src/components/table/ex/constants.js`（本次不新增常量）。
- painter state 契约（G2-a）：壳对 `paintState` 原地变更后必须 `syncPaintState()` + invalidate/draw 同步应用；`redraw()` 内部即 `syncPaintState + painter.draw`（table-ex.vue:422-425）。
- 共用谓词防公式漂移的既有先例：`isExpandedKey`（`tree.js:21-27`，cell-painters/painter 共用）→ 新增 `expandableAt` 同款模式；cell-painters 已有 `import { isExpandedKey } from './tree'`（:6）先例。
- `tree.js` 纯函数约定：不持有状态、不写回入参——`expandableAt`/`isLeafOf` 参数遵守。
- demo 页 URL `http://localhost:3000/data/table-ex/`；调试句柄 `window.__canvasTable`（defineExpose：getCellRect/getLayoutInfo/getTreeExpandedKeys/expandAll/collapseAll 等，main-view.vue:1319 挂载）与 `window.__ctStage()`（舞台数据快照）。
- 事件命名 kebab-case（table-ex 既有 emits 列表，table-ex.vue:147-158）。
- 无测试框架：回归 = demo 页 playwright DOM/像素断言 + demo 自检套件（`demo/src/data/table-ex/self-checks/`，调试面板「重跑自检」触发，`main-view.vue` `runChecks`）。
- 验证命令：`npm run build`（build:base + build:ex，4 次 vite build）；无 lint script，stylelint 用 `npx stylelint "src/**/*.scss"`。
- 本项目不上报 agent-task-report；完成后不更新 docs/docs-site/skills 文档（派发约束；API 变更的三处文档同步待用户确认后另行处理）。

## 改动清单（含新增或修改的测试文件）

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/ex/cell-painters.js` | 问题 1：新增文本光学居中锚 helper（模块内）；9 处 `fillText` 站点切换 `alphabetic` + 度量锚；`linkUnderlineY` 公式改「基线下 2px」。问题 3：`drawTreeAffordance`（:554）判定源改 `expandableAt` | 文本偏上根因；懒节点三角显示 |
| `src/components/table/ex/table-ex.vue` | 问题 2：`relayoutAndRedraw` 尾部 `redraw()`（:504）替换为精算三连。问题 3：emits 增 `tree-expand`/`tree-collapse`；`tryToggleTreeRow`（:846-859）向 `applyTreeToggle` 传 `{ record, level }`；`syncPaintState` 的 flatInfo（:389-395）增 `expandable` 数组 | 格线随精算行高重绘；新事件与数据通道 |
| `src/components/table/ex/tree.js` | `buildFlatRows` 增可选 `isLeafOf` 参数，产出 `expandable` 平行数组；新增导出 `expandableAt(flatInfo, row)` | isLeaf 语义单一事实源；共用判定谓词 |
| `src/components/table/ex/use-tree-rows.js` | `treeOptions` 增 `isLeaf` 字段名（`treeProps.isLeaf ?? undefined`）；`flatRows` computed 传 `isLeafOf`；`applyTreeToggle` 增可选 `meta` 参数并 emit 新事件 | 字段映射与事件发射 |
| `src/components/table/ex/interactions.js` | `isTreeArrowSlot`（:99-107）判定源改 `expandableAt`，JSDoc 同步 | 懒节点箭头槽命中与 pointer 光标 |
| `src/components/table/ex/painter.js` | `paintTreeArrowAccent`（:901）判定源改 `expandableAt` | 懒节点 hover 主色箭头 |
| `demo/src/data/table-ex/main-view.vue` | 新增「树（懒加载）」场景：radio 选项、`lazyTreeRecords` 夹具（根含 `isLeaf:false` 无子级）、`treePropsBind` 该场景加 `isLeaf: 'isLeaf'` 映射、`stageTree`/`stageRecords`/`stageColumns` 分支、`onTreeExpand`（异步就地 push 子级 + `recordsVersion++`）/`onTreeCollapse` 处理器、模板事件绑定 | 验收标准 3 的 demo 验证落点 |
| `demo/src/data/table-ex/self-checks/tree.js` | `checks` 数组追加：`buildFlatRows` `isLeafOf` 语义断言（未映射/`isLeaf:false`/`isLeaf:true`/有子级优先/展开懒节点无行变化） | isLeaf 纯函数回归 |
| `demo/src/data/table-ex/self-checks/interactions.js` | `checks` 追加：`isTreeArrowSlot` 对 `expandable` 形态与旧 `hasChildren` 形态回退的断言 | 命中判定回归与兼容保障 |

无 scss 改动（无新颜色/间距，`--mu-*` 变量约束天然满足）；constants.js 不改；`self-checks/index.js` 无需改（模块既有聚合）。

## 接口 / 数据结构

仅签名与伪代码，不含完整实现。

### 1. 文本光学居中锚（cell-painters.js 模块内，问题 1）

```js
// 缓存：Map<fontString, number>（主题字体有限，无需淘汰）
const textAnchorCache = new Map()

/**
 * 文本光学居中锚：canvas 'middle' 按 em 方框中点，与 DOM 行框（ascent/descent）
 * 居中口径不同，CJK 系统性偏上。改以 alphabetic 基线 + fontBoundingBox 度量
 * 半差补偿，使字形框中点对齐 centerY。
 * 度量不可得（fontBoundingBoxAscent/Descent 缺失）时回退 'middle' 原行为。
 * 偏移按字体取整缓存（与既有整数锚一致，避免亚像素模糊）。
 * @returns {{ y: Number, baseline: 'alphabetic' | 'middle' }}
 */
function centeredTextAnchor (ctx, centerY) // 伪代码：
  // offset = round((m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2)
  // 度量可得 → { y: centerY + offset, baseline: 'alphabetic' }
  // 度量缺失 → { y: centerY, baseline: 'middle' }
```

消费站点（9 处 fillText，全部「先设 `ctx.font`，再取锚，再 fillText」）：

| 站点 | 位置 | 形状几何（不动） |
|---|---|---|
| `drawTextValue` 多行循环 | :473-478（首行取锚，后续 `+= lineHeight`） | — |
| `drawTextValue` 单行省略 | :495 | — |
| `drawArrayLines` | :514-522（首行取锚） | — |
| `drawItemText` | :812 | link 下划线 :818 随新锚 |
| `drawCheck` ✓ 字形 | :862 | check 方框绘制与 CHECK_SIZE 规格不动 |
| `drawTag` 文本 | :901 | pill 矩形 :887 不动 |
| `drawLinkEntry` | :923 | 下划线同随新锚 |
| `drawProgress` 百分比 | :1021 | 轨道 :1028 不动 |
| `drawButtonPill` 文本 | :1139 | pill 矩形 :1120 不动 |

```js
// linkUnderlineY（drawItemText 与 drawLinkEntry 共用，:782-784）：
// 原 anchorY + round(fontSize*0.35) + 2 按 'middle' 锚标定；锚改 alphabetic 后
// 公式改为「基线下 2px」（CJK descent ≈ 0.12em < 2px，不下穿字形）
function linkUnderlineY (anchorY) // → anchorY + 2（fontSize 参数移除）
```

### 2. relayoutAndRedraw 尾部（table-ex.vue，问题 2）

```js
// :503-504 原为 syncCanvasSize(next.stickyWidth, next.stickyHeight); redraw()
syncCanvasSize(next.stickyWidth, next.stickyHeight)
rowGeometry.remeasureVisibleRows()   // variable 模式精算可视行（uniform 零成本早退）；
                                     // 内部按锚行补偿 scrollTop 并 setLayout 更新 contentHeight/spacerHeight
recomputeViewWindows()               // 以最终几何重算可视窗口
redraw()                             // 整幅重绘（格线取精算行高）
```

`onThemeChange`（:1180-1207）不动：其尾部三连在 relayout 内部已执行一遍后成为幂等重复（精算缓存命中、`delta=0` 早退）。

### 3. tree.js（问题 3）

```js
/**
 * buildFlatRows 增可选参数 isLeafOf（record => boolean|null；未传 = 特性关闭）。
 * 产物新增第五个平行数组 expandable：
 *   expandable[i] = hasChildren.has(key) || isLeafOf?.(record) === false
 * hasChildren 语义不变（纯「被 parentKey 引用」）；rows/levels/parentKeys 不变。
 */
export function buildFlatRows (records, { keyOf, parentKeyOf, expandedKeys, childrenIndex, isLeafOf })

/**
 * 行可展开判定（三角显示 / 箭头槽命中 / hover 主色箭头共用，防公式漂移）：
 * flatInfo.expandable 缺省回退 flatInfo.hasChildren（旧形态兼容——
 * 组件壳恒提供 expandable，回退面向自检夹具等旧构造者）。
 */
export function expandableAt (flatInfo, row) // → Boolean
```

### 4. use-tree-rows.js / table-ex.vue（问题 3）

```js
// treeOptions 增字段（缺省 undefined = isLeaf 特性关闭，tree 组件同款兼容语义）
const treeOptions = computed(() => ({
  key: props.treeProps?.key ?? props.keyField ?? 'id',
  parentKey: props.treeProps?.parentKey ?? 'parentId',
  isLeaf: props.treeProps?.isLeaf ?? undefined
}))

// flatRows computed 增传：
//   isLeafOf: treeOptions.value.isLeaf ? record => record?.[treeOptions.value.isLeaf] : null

// applyTreeToggle 增可选 meta（壳的 tryToggleTreeRow 由 hit.rowIndex 已知 record/level，免 O(n) 反查）：
function applyTreeToggle (key, meta = {})
// toggle 翻转后、emit('update:tree-expanded-keys', ...) 之后追加：
//   next.has(key) ? emit('tree-expand', { key, record: meta.record, level: meta.level })
//                 : emit('tree-collapse', { key, record: meta.record, level: meta.level })

// table-ex.vue：
//   defineEmits 增 'tree-expand'、'tree-collapse'
//   tryToggleTreeRow 内：applyTreeToggle(toggle.key, {
//     record, level: flatRows.value?.levels?.[hit.rowIndex] ?? 0 })
//   syncPaintState 的 flatInfo 增：expandable: flatRows.value.expandable
```

事件载荷：`{ key, record, level }`——`key` 树键（treeProps.key 口径）、`record` 原始行数据引用、`level` 0-based 层级（消费方构造子级 parentKey 用）。

### 5. demo 夹具（main-view.vue，问题 3 验证落点）

```js
// 懒加载树夹具：根 A/B 为 isLeaf:false 无子级（懒节点）；根 C 普通叶。
// id 取 200001+ 与既有树夹具（1..90003）隔离，防受控展开集跨场景串键
const lazyTreeRecords = [
  { id: 200001, pid: null, name: '懒加载根 A', count: 11, date: '2026-10-01', isLeaf: false },
  { id: 200002, pid: null, name: '懒加载根 B', count: 22, date: '2026-10-02', isLeaf: false },
  { id: 200003, pid: null, name: '普通叶根 C', count: 33, date: '2026-10-03' }
]
let lazyChildSeq = 0

function onTreeExpand (payload) {
  logEvent('tree-expand', payload)
  // 消费方范式（对齐 tree-advanced loadChildren）：isLeaf:false 且未回填过才加载
  if (payload.record?.isLeaf !== false) return
  if (lazyTreeRecords.some(r => r.pid === payload.key)) return

  setTimeout(() => {
    for (let i = 1; i <= 3; i++) {
      lazyTreeRecords.push({
        id: 200101 + lazyChildSeq++,
        pid: payload.key,
        name: `子节点 ${String(payload.key).slice(-1)}-${i}`,
        count: i, date: '2026-10-29'
      })
    }
    recordsVersion.value++          // 就地 push + 版本号 → relayout，不滚动复位
    logEvent('懒加载回填（recordsVersion++）', { parent: payload.key })
  }, 300)
}

// 场景接线：
//   radio options 增 { value: 'tree-lazy', label: '树（懒加载）' }
//   stageTree：scene 'tree-lazy' 亦为真（沿用 treeOn 开关）
//   treePropsBind：scene 'tree-lazy' → { key: 'id', parentKey: 'pid', isLeaf: 'isLeaf' }
//   stageRecords：'tree-lazy' → lazyTreeRecords；stageColumns：→ treeColumns
//   模板：@tree-expand="onTreeExpand" @tree-collapse="onTreeCollapse"（后者仅 logEvent）
```

## 被拒绝的备选

**A1（问题 1）调整 centerY 公式整体下移（如 `centerY + 1`）**：centerY 同时锚定 pill/轨道/check 方框/树箭头/命中矩形/编辑按钮——这些几何形状与 DOM 规格镜像本已居中，整体下移会把形状一并带偏，文本相对形状的错位原样保留；且硬编码像素量随字体/字号主题漂移。拒绝。

**A2（问题 1）逐绘制路径手调常量**：9 处站点各自维护偏移量，无单一事实源，违反项目「共用单函数防公式漂移」约定（linkUnderlineY 注释 :781 自证此约定）。拒绝。

**A3（问题 2）仅在 records/columns watch 尾部补精算三连**：治标——树 toggle、spanMethod/orderBy、onResize、recordsVersion 等其余 relayout 出口同属「估高后无精算」缺陷类（01-explore 链路分析）；且每个 watch 重复同段代码。改在 `relayoutAndRedraw` 尾部一处收口，与 onThemeChange 先例构成一致不变式「relayout 出口 = 可视行精算」。拒绝分散修补。

**A4（问题 3）复用 `update:tree-expanded-keys` 作为懒加载信号**：payload 为全量 key 数组，消费方须 diff 前后集合才能得知「本次展开哪个节点」，且无法区分展开/收起；tree 组件先例（nodeExpand/nodeCollapse 带 node 载荷）已证明专用事件是既有范式。拒绝。

**A5（问题 3）替换 records 引用回填子级**：records watch（table-ex.vue:1289-1294）先 `scrollTo(0,0)` 再 relayout——长表滚动中加载会闪回顶部；组件已备 recordsVersion 通道（「异步就地修改 records 后的通知通道」注释 :1305-1307）专为该场景。拒绝。

**A6（问题 3）事件名用 `node-expand`/`node-collapse`（与 tree 组件字面一致）**：table-ex 事件既有命名模式为 `<区域>-<动作>`（header-click/cell-click/cell-item-click/column-resize），树区域前缀 `tree-` 与 `update:tree-expanded-keys`/`expandAll` 的 tree 命名空间一致；`node-*` 在 table-ex 语境下引入未出现过的「node」概念。拒绝（语义仍参照 tree 组件，见裁定 #4a）。

## 风险与回滚

- **问题 1**：影响全部单元格文本渲染（9 站点）与 link 悬停下划线位置。度量 API（`fontBoundingBoxAscent/Descent`，Chrome 87+/Firefox 116+/Safari 11.1+）不可得时按 `{ y: centerY, baseline: 'middle' }` 回退，行为等同修复前；风险集中在视觉微调，demo 像素断言把关。回滚 = revert `cell-painters.js` 单文件。
- **问题 2**：variable 模式每次 relayout 增可视行精算成本（先例已接受；uniform 零成本）；`remeasureVisibleRows` 内部锚定补偿与 onThemeChange/applyTreeToggle 的外部锚定补偿叠加——已推演为幂等（第二次 delta=0 早退），实施时以树场景 toggle + 主题切换 + 100k 行滚动做回归目视。回滚 = 尾部三连还原为 `redraw()` 单行。
- **问题 3**：`flatInfo` 形态扩展 + 旧形态回退（`expandable ?? hasChildren`），自检夹具不破；新事件纯增量，无既有行为变更；`expandAll`/初始展开不包含懒节点为有意行为（方案概述已述）。回滚 = revert tree.js / use-tree-rows.js / table-ex.vue / cell-painters.js / interactions.js / painter.js 六文件相关 hunk。
- 共同：无 scss/API 破坏性变更；`npm run build` 4 次 vite build 全量把关；三问题改动集中于 table/ex 模块，互不阻塞但文件重叠（cell-painters、table-ex.vue），按派发串行实施。
- 文档（skills/docs/docs-site 三处）不在本次范围：`tree-expand`/`tree-collapse`/`treeProps.isLeaf` 属 API 变更，实施后提示用户确认再同步。

## 测试计划

验证环境：`npm run demo:build`（rollup watch）+ `http://localhost:3000/data/table-ex/`；playwright MCP（优先 DOM/canvas 数据断言，非必要不截图）。已知坑（知识库）：后台页 rAF/RO 停发——问题 2 的滚动帧断言须页面在前台；canvas 像素断言不锚固定坐标，用 ink 检测。

| 验收标准 | 手段 | 具体检查 |
|---|---|---|
| 1. 图形列型文本垂直居中（tag/button/progress） | 浏览器（playwright evaluate，canvas 像素） | 场景「条目/新列型」：① `window.__canvasTable.getCellRect(row, col)` 取 tag 列（列 2）/progress 列（列 3）/button 列（列 4）单元格矩形；② `canvas.getContext('2d').getImageData` 按设备像素比采样该矩形；③ 检测文本 ink 行区间（亮度阈值区分文字与 pill 半透明底/轨道），算 ink 垂直中心；④ 参照中心 = centerY 公式值（`rect.y + 1 + (rowHeight−1)/2`，rowHeight 由 `getLayoutInfo().rowHeight` 或主题 36px）。断言 `abs(ink中心 − centerY) ≤ 1px`。修复前先测一次记录偏移量与方向（复现数据，预期偏上 ≥1px） |
| 1-回归. 多行文本/link 悬停下划线 | 浏览器 | 多行文本场景目视 + link 列 hover（page.mouse 移入）后下划线像素检查：位于字形下方、不脱节不穿字 |
| 2. 夹具切「多行文本」格线随行高重绘 | 浏览器（playwright evaluate） | ① 切场景后（等 nextTick + 2×rAF）读 `getLayoutInfo()`：`rowGeometryMode === 'variable'` 且 `contentHeight` 即为精算值（与下述③一致）；② 格线像素断言：getImageData 检测表头下第 1、2 条行格线 y 坐标，与精算行高累加值吻合；③ 复现对照（修复前同法）：切换后 `contentHeight` 为估高值，`scrollTop += 1` 触发 scrollFrame 后跳为精算值——两值留痕即「格线何时重绘」的实证 |
| 3. isLeaf 懒加载 | 浏览器（playwright） | 场景「树（懒加载）」：① 像素断言：懒根 A/B 行（第 1、2 行）树形列箭头槽（getCellRect + padding + level×16 区域）有 ink 三角、普通叶根 C 行无；② `page.mouse.click` 箭头槽中心 → 事件日志（.ct-event-log）出现 `tree-expand` 且 detail 含 key/record/level；③ 等 400ms（异步回填）→ `window.__ctStage().records.length` 由 3 增至 9、`getLayoutInfo().contentHeight` 增大、`.mu-table-ex__scroll` 的 `scrollTop === 0`（不闪顶）；④ 再次点击同一箭头 → `tree-collapse` 日志 + 行数回退 3；⑤ 自检套件重跑通过（tree/interactions 新增断言 + 既有断言全绿） |
| 4. 构建 + stylelint | 命令 | `npm run build`（4 次 vite build 零错误）；`npx stylelint "src/**/*.scss"` 无新增错误（本次无 scss 改动，基线应零输出） |

## 实施步骤

无并行组（三问题文件重叠，00-task.md 规定串行）。

1. **复现确认 + demo 懒加载夹具**（文件集合：`demo/src/data/table-ex/main-view.vue` 仅 demo 侧改动——lazyTreeRecords/场景接线/事件处理器；无 src 改动。产物 = 三问题复现数据，记入实施记录）
   - 前置：`:3000` 未监听则 `npm run demo:build` 启动。
   - 问题 1：按测试计划表第 1 行的像素测量法，测 tag/button/progress 三列文本 ink 中心相对 centerY 的偏移量与方向（**像素级比对方案**：getImageData ink 行区间 vs centerY 公式参照，留痕数值）。
   - 问题 2：切「多行文本」记 `contentHeight`（估高）→ `scrollTop += 1` → 再记（精算），留痕两值与 `rowGeometryMode`。
   - 问题 3：新夹具下确认现状症状——懒根 A/B（isLeaf:false 无子级）**不显示三角**、点击箭头槽位置**无 tree-expand 事件**（事件日志无条目）。修复前 `treeProps.isLeaf` 映射与 `@tree-expand` 绑定均被组件忽略（未知字段/未声明事件），夹具即复现载体。
   - 完成判据：三问题复现数据齐；若问题 1 实测偏移 < 0.5px（'middle' 在目标浏览器已居中），记入实施记录并继续（修复机制按度量居中，与实测结论不冲突但需回报用户表述出入）。
   - 依赖：无。
2. **实施三项修复**（文件集合：改动清单其余 8 文件——src 六文件 + `self-checks/tree.js` + `self-checks/interactions.js`；main-view.vue 剩余改动为零（步骤 1 已就位））
   - 顺序建议：问题 3 纯函数层（tree.js → interactions/painter/cell-painters 判定源）→ 问题 3 接线层（use-tree-rows/table-ex.vue/自检）→ 问题 2（table-ex.vue 三连）→ 问题 1（cell-painters.js 文本锚）。
   - 完成判据：demo 页按步骤 1 同口径复测——三问题现象消失（文本 ink 中心 |偏移| ≤ 1px；切场景 contentHeight 即精算值；懒根显示三角且点击→回填→展开全链走通）；调试面板「重跑自检」全绿。
   - 依赖：步骤 1。
3. **验证命令与全量回归**（文件集合：无新改动）
   - `npm run build`；`npx stylelint "src/**/*.scss"`。
   - playwright 按测试计划表逐条执行验收标准 1-3 断言；自检套件重跑。
   - 完成判据：验收标准 1-4 全部通过。
   - 依赖：步骤 2。

## 未解问题

对 01-explore.md「未解问题」的逐条回应（#3/#4/#5 为派发要求的设计裁定，已同步写入方案概述）：

1. 【运行验证｜问题 2】`:3000` 未监听 → 归入实施步骤 1 前置（启动 `npm run demo:build`）；「格线位置未变化」与代码推演（数组列估高非 36px）的出入，以步骤 1 实测双值（估高/精算 contentHeight）对齐症状——修复覆盖「字符串多行列估 1 行」这一确证根因，实测若显示另有列型未重算，回方案处理。
2. 【用户澄清｜问题 1】badge → 已由 decisions.md 裁定去除（调度者转写误加），以 canvas 实际存在的 tag/button/progress 列型为准。已结。
3. 【设计决策｜问题 1】**裁定：baseline 偏移（统一文本光学居中锚 `centeredTextAnchor`）**。理由：偏移属「字形相对基线」层，形状几何本已正确；统一锚保持单一事实源、随字体度量自适应、无硬编码像素。偏移方向/像素量由步骤 1 实测留痕（机制本身不依赖该值）。已裁定。
4. 【设计决策｜问题 3】**裁定：新增 `tree-expand`/`tree-collapse` 事件（载荷 `{ key, record, level }`，语义参照 tree 组件 nodeExpand/nodeCollapse——每次 toggle 均发、消费方自判是否加载）；懒加载回填通道 = 就地 push + `recordsVersion++`（不走 records 引用替换，避免 :1292 scrollTo(0,0) 闪顶）**。已裁定。
5. 【设计决策｜问题 3】**裁定：isLeaf 走 `treeProps.isLeaf` 字段名映射，缺省 `undefined` = 特性关闭**（对齐 tree 组件 `DEFAULT_DATA_PROPS.isLeaf: undefined` 未映射不生效的兼容语义）；仅 `=== false` 且无子级触发三角与展开。已裁定。

设计后新增残留（非阻塞）：

6. `fontBoundingBoxAscent/Descent` 在目标浏览器集（内部 Chrome 基座）可用性视为既定；若实施发现缺失，helper 回退 `'middle'` 原行为并在实施记录注明（问题 1 验收届时以实测为准上报）。
7. 表头文本 `'middle'` 锚未在本范围（用户未提表头）；若后续需要，`centeredTextAnchor` 可直接复用于 painter.js 表头绘制。
