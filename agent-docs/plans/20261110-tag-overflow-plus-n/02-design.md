# 设计：table-ex tag 列溢出 +n 汇聚 tag（hover 显示剩余项）

## 方案概述

tag 类型列（`col.type === 'tag'`）标签横排放不下时，不再静默丢弃超出右缘的标签，而是绘制灰色 `+n` 汇聚 pill（n = 未显示标签数），hover 该 pill 弹出 tooltip 展示被折叠标签全文。三层改动，全部复用既有链路：

1. **绘制层**（`item-painters.js drawItems`）：tag 列溢出（`offset > contentWidth`）且条目全为 tag 时进入 pill 模式——找最大可容纳前缀 k（k ≥ 1，每条全宽排布，`+n` pill 计宽 = 文本 + 2×TAG_PADDING_X，pill 与末条间 gap 8px），放不下的整条隐藏计入 n；前缀 + pill 整组按既有对齐协议（itemsStartX）分布；无解（首条即放不下 pill）回退现状截断/丢弃。pill 用 drawTag 无色灰路径（`--mu-gray` / `--mu-gray-translucent`，零新增色值），并以 `kind: 'tag-overflow'` 命中矩形回报（携 `text: '+n'` 与 `title: <剩余项 '；' join>`，随绘制帧携带）。
2. **门控层**（`hit-test.js resolveTooltipTarget`）：新增可选 `itemHits` 参数——指针落在该格 tag-overflow 矩形内且 title 非空 → 目标附 `plus: true`；title:false 等既有门控先于 plus 判定不变。
3. **编排层**（`use-cell-tooltip.js`）：去重键升级为 plus 感知（pill ↔ 非 pill 同格互移须重排）；showCellTooltip plus 分支：title 协议自动形态（未设置/true）下直接展示 pill 携带的 `title`、锚点 = pill 视口矩形；非自动形态与 pill 条目缺失均落回格级路径。

格级溢出 tooltip（上一任务）零改动：hover 可见标签/空白区仍显示全部条目 join；pill hover 显示剩余项——按指针位置互斥，去重键含 plus 区分。

触及边界：5 个 src 文件 + 2 个自检文件（各新增 1 块，既有块零漂移）+ 1 个 demo 夹具文件（加 2 列，复用既有字段）。无 props/events/公共 API 变化；无 scss；不动 DOM 版 base/table、column-types、tooltip 组件本体、绘制收口。

裁决（decisions.md 待裁项；修订终审通过，实施按此）：**`+n` tooltip 受 `title: false` 控制**（连同 ''/0/自定义同口径），详见「裁决」节。

## 现状（代码调研结论）

基线 = dev @ 634e947 + 工作区上一任务未提交改动（溢出 tooltip 8 文件，已实读核对：`longText` 夹具 main-view.vue:407/:446-447、title 真值矩阵 cell-tooltip.js:220-225 均在工作区生效）。以下均为工作区实读。

### tag 横排绘制与丢弃现状

- `drawItems`（src/components/table/ex/cell-paint/item-painters.js:77-117）：`measureItem` 逐条计宽（tag = 文本 + TAG_PADDING_X×2 = 16，:213-216，单项 `Math.min(width, contentWidth)` cap）→ `layoutItemPositions`（:120-139）产出 positions/offset（offset = Σ宽 + (n−1)×gap，gap = padding 8）→ `itemsStartX` 按列 align 分布（未超宽 center 扣 rightInset / right，超宽回退左对齐，:142-151）→ 绘制循环 `if (x >= rightBound) break` **超出右缘条目直接丢弃**（:92-97），部分露出条目截断（width = min(w, rightBound − x)，:99）。
- 丢弃发生 ⇔ `offset > contentWidth`（offset ≤ contentWidth 时每条右缘 ≤ rightBound，不丢弃）——与格级溢出判定 `horizontalItemsOverflowOf`（cell-tooltip.js:55-64）同口径。
- tag 列 compile 产物恒 `kind: 'tag'`（column-types/tag.js:39-58，含 `tagOption.max` dots 条目 text `'...'`）；tag 列数组值经 `isArrayValueRejected` 放行（cell-content.js:107-114）。
- 命中矩形回报：`reportHitRect`（item-painters.js:156-177）仅 tag（pill 区，高 TAG_HEIGHT 20）与 link 回报，entry = `{ kind, index, rect, disabled, link? }`，经 paint-body `onItemRect` 原样推入（paint-body.js:312），`setItemHitGroup`（:35-43）存原数组——**entry 附加字段可存活到 paintState.itemHits**。
- 新 kind `tag-overflow` 消费面安全性（逐个核对）：
  - click-resolve `findHitItem`（:164-179）kind 透传 → `emitDomItemClick` 经 `items[item.index]` 取产物（use-cell-click.js:241），index -1 → undefined → 判空 return，**不发 cell-item-click**；`emitButtonItemClick` `buttons[-1]` 同理（:220-222）。
  - `applyItemCursor` 仅 kind link/button 置 pointer（use-pointer.js:245-247）；`isLinkEntryHovered` 仅 kind 'link'（item-painters.js:267-272）→ pill 无 hover 变色、无 pointer 光标，仅 tooltip。
  - `updateHoverItem`（use-pointer.js:187-199）会置 hoverItem 并失效该格重绘（无视觉差异，无害）。
- 灰色取色既有路径：drawTag 无 color → name `'gray'` → palette null → 边/字 `theme.gray`（`--mu-gray`，shared/theme.js:117）、底 `theme.hoverBg`（`--mu-gray-translucent`，theme.js:115）。无色 tag 自检先例：self-checks/cell-painters.js:1933-1937。
- 常量：TAG_HEIGHT 20 / TAG_PADDING_X 8 / TAG_RADIUS 4（shared/constants.js:54-58）；tag 字体 12px（item-painters.js:15 `TAG_FONT_SIZE`）。

### 溢出 tooltip 链路现状（上一任务产物）

- 触发链：table-ex.vue `tooltipEnabled`（some(col.title !== false)，use-pointer.js:285 调度前置）→ `resolveTooltipTarget`（hit-test.js:182-188；title === false 列 → null）→ `scheduleCellTooltip`（use-cell-tooltip.js:54-78；`isSamePoint` {row,col} 去重 + TOOLTIP_SHOW_DELAY 300ms）→ `showCellTooltip`（:135-166；`resolveCellTooltip` 求值，`overflowOnly && !overflow` 不显示；锚点 = spanRectOf 格矩形经 `placeTooltipAnchor` :121-128；__overlay 原点 = canvas 视口原点，table-ex.vue:60-63 注记）→ `tooltipController.show + updatePosition`。
- title 真值矩阵（cell-tooltip.js:220-225）：`false`/`''`/`0` → null；String/Function → 自定义恒显；未设置/`null`/`true` → 自动（溢出才显示全文）。
- 全文串口径：逐项 String 化、滤空、`'；'` join（`joinTooltipText`，cell-tooltip.js:23-25）。
- 已知豁免：cell-tooltip.js eslint complexity warning（12 > 10，knowledge 条目 `table-ex-overflow-tooltip-title-protocol` 注明，不阻 exit 0）。
- cell-tooltip.js 已 import item-painters（:10）→ **item-painters 不得反向 import cell-tooltip**（成环）。

### demo 夹具与验证基建现状

- items 场景：`itemColumns` main-view.vue:795-831（现 13 列）、`itemRecords` :695-793。上一任务夹具：row1 `tagsOverflow: ['短标', '甲']`（未溢出对照，:720）、row2 `tagsOverflow` 8 标签 `'溢出标签1'..'溢出标签8'`（必然溢出，:747）；「标签（溢出）」列 index 1 /「按钮（溢出）」列 index 2（:799-800，宽 150 → 内容宽 134）。row2 tag 列当前行为 = 丢弃超出标签，本任务后该列将出现 +n pill（预期变化）。
- URL 直载 `?scene=items`（SCENE_WHITELIST main-view.vue:1039）；`window.__canvasTable.getCellRect(row, col)` 返回视口矩形 {left, top, width, height}（use-table-api.js:107-124，layout 未就绪 null）；`getLayoutInfo().colWidths` 可断言列宽序列。
- 自检基建：cell-painters.js `drawRecorded`（:145-149，recordingCtx 记 fillText(text/fillStyle)/fill/stroke + onItemRect 回报）、`fakeMeasure`（:216-218，**每非空格字符 9px、空格 2px**，'+2' = 18px）、CELL_WIDTH 160 / CELL_HEIGHT 36 / padding 8（内容宽 144、centerY 19）；`assert/assertEqual/assertArray`（:362-379）；checks 数组终于 :2736。interactions.js `resolveTooltipTarget` 块 :783-839（现有断言不传 itemHits、bodyHit 无 x/y → 新增可选参数零漂移）；checks 数组终于 :840。既有 tag 绘制块 :1925-1943 用两条短标签（2×34+8 = 76 ≤ 144 未溢出）→ pill 模式不激活，不漂移。
- 行高契约：tag 横排为单行内容，不参与行高精算；pill 不改变行数 → 无 recordsVersion / 行高影响。demo 改动为静态夹具初始化（无就地 record 变更），无需 bump。
- `.playwright-mcp` 目录与 .gitignore 已存在（上一任务核验）。

## 遵循约定与复用

知识库命中（INDEX-table.md，直接采用）：

- `table-ex-item-column-align`：tag 横排整组按 itemsStartX 分布、命中矩形 x 随对齐同步——pill 计入整组宽（groupWidth）参与对齐；新增条目绘制路径对齐口径与既有三处一致。
- `table-ex-overflow-tooltip-title-protocol`：title 真值矩阵为列级单一事实源，plus 分支不建第二套口径（经 isAutoTitle 复用）。
- `canvas-pixel-assert-anchor-drift`：行为变更与自检同批——本任务既有自检块零漂移（新参数全可选、pill 仅 tag 列溢出激活），新增块覆盖新行为；实施后 grep 旧断言无涉及。修订核对（全 self-checks 扫描）：tag 列绘制仅 cell-painters.js:786/:905/:1927 与 painter.js:816/:1006/:1692，均 1~2 条且单元格宽 ≥160（无溢出 → badge 不激活）；row-geometry.js:388/:658、spans.js:131 不绘制单元格。
- `table-ex-demo-interaction-verify` / `playwright-delay-hide-popup-testing`：浮层断言等显示延迟（显示 600ms / 收起 700-800ms）；hover→停留→断言单次调用内完成，段间先移出；条目命中区 = pill 绘制区（8px 间隙，勿取格中点联合区）。
- `demo-watch-agent-edit-cache-bust` / `eslint-demo-dist-false-positives`：Edit 后 touch 源文件；URL cache-bust；lint 限 `src`、`demo/src` 且 `--ext .js,.vue`，stylelint glob 加引号。
- 绘制收口 `table-ex-paint-cap-content-right`：pill 绘制天然收在 rightBound 内（fit 条件保证），不新增越界敏感绘制。

复用（不新建）：drawTag 灰路径、reportHitRect/onItemRect 与 itemHits 容器、resolveTooltipTarget 门控、tooltipController.show/updatePosition 与合成锚点、itemsStartX、measureOf。命名：命中 kind `tag-overflow`；tooltip 目标标记 `plus`；绘制分支开关 `tagOverflowBadge`。

约束遵循：+n 灰色零新增色值（经 theme 快照既有回退）；不 commit/push、不装依赖、不更新 docs/docs-site/skills。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/ex/cell-paint/item-painters.js` | drawItems 增 `tagOverflowBadge = false` 参数与 pill 分支；新增私有 `tagOverflowPlanOf` / `drawTagOverflowPill`；文件头注释 :1 补「tag 列 +n 溢出汇聚」 | +n 绘制与命中回报（A1） |
| `src/components/table/ex/cell-paint/cell-painters.js` | drawContentItems 的 drawItems 调用（:188-200）增 `tagOverflowBadge: col.type === 'tag'` | tag 列范围门控 |
| `src/components/table/ex/cell-paint/cell-tooltip.js` | 导出 `isAutoTitle(raw)`；resolveCellTooltip :225 改用（行为等价） | plus 分支与求值层同源判定自动形态 |
| `src/components/table/ex/interaction/hit-test.js` | resolveTooltipTarget 增可选 `itemHits` 参数与 plus 目标；私有 `isPointInRect` / `findTagOverflowPill`；JSDoc（:170-181）同步 | pill hover → plus 目标（A2 门控） |
| `src/components/table/ex/composables/use-cell-tooltip.js` | scheduleCellTooltip 传 itemHits；去重 :65 与过期守卫 :138 改 plus 感知比较；showCellTooltip 增 plus 分支；import 增 isAutoTitle；@host-reads :15-16 增 paintState | pill tooltip 编排（A2） |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | checks 数组末尾新增 drawItems +n 块（溢出 k=2 / title:false 仍渲染 / 未溢出 / 无解回退） | A1/A3 确定性自检 + 裁决渲染侧 |
| `demo/src/data/table-ex/self-checks/interactions.js` | checks 数组末尾新增 resolveTooltipTarget plus 块 | A2 门控自检 |
| `demo/src/data/table-ex/main-view.vue` | itemColumns :800 后插 2 列（field 复用 tagsOverflow，不加记录字段） | A1-A4 浏览器载体 |

无新增文件；无 scss 改动；无测试框架新文件。

## 接口 / 数据结构

无新增 props/events/公共 API。内部协议扩展如下（签名 + 伪代码，非完整实现）：

### 1. drawItems pill 模式（item-painters.js）

```js
export function drawItems (ctx, rect, items, {
  align, padding, theme, onImageLoad, onItemRect, measure, centerY, rightInset, hoverItem, row, colIndex,
  tagOverflowBadge = false   // 新增：tag 列（col.type === 'tag'）溢出 +n 汇聚开关
}) {
  const gap = padding
  const contentWidth = rect.width - padding * 2
  const hooks = { contentWidth, contentHeight: rect.height, padding, theme, onImageLoad, measure, row, colIndex }
  const widths = items.map(item => measureItem(ctx, item, hooks))
  const { positions, offset, visible } = layoutItemPositions(items, widths, gap)

  // tag 列 +n 溢出汇聚：溢出（丢弃将发生 ⇔ offset > contentWidth）且全 tag 时
  // 预留 pill 逐项全宽排布；无解返回 null 回退现状
  const plan = tagOverflowBadge && offset > contentWidth
    ? tagOverflowPlanOf(ctx, items, widths, gap, contentWidth, measure, theme)
    : null

  // 内容超宽时回退左对齐；pill 模式整组（前缀 + pill）按对齐协议分布
  const start = itemsStartX(rect, align, padding, plan ? plan.groupWidth : offset, visible, contentWidth, rightInset)
  const rightBound = rect.x + rect.width - padding
  const limit = plan ? plan.shown : items.length

  for (let i = 0; i < limit; i++) {
    // ……循环体 :92-116 原样不动（pill 模式下前缀全宽，截断分支不可达，保留防御）
  }

  if (plan) {
    drawTagOverflowPill(ctx, plan, start + positions[plan.shown - 1] + widths[plan.shown - 1] + gap, {
      centerY, rightBound, theme, measure, onItemRect
    })
  }
}
```

```js
/** tag 列溢出汇聚方案：k = 整组（k 条全宽 + k×gap（含 pill 前间隙）+ pill 宽）
    ≤ contentWidth 的最大前缀数（k ≥ 1；pill 宽 = `+n` 文本 + 2×TAG_PADDING_X）；
    混排非 tag 条目（自定义 tags 产物防御）或无解返回 null（回退现状截断/丢弃）。
    n 与剩余项全文在此一次算定随 plan 携带（绘制与 tooltip 同帧一致） */
function tagOverflowPlanOf (ctx, items, widths, gap, contentWidth, measure, theme) {
  if (!items.length || !items.every(item => resolveItemKind(item) === 'tag')) return null

  const measureFn = measureOf(ctx, measure)
  let prefix = 0
  let plan = null

  for (let k = 1; k < items.length; k++) {
    prefix += widths[k - 1] + gap

    const pillText = `+${items.length - k}`
    const pillWidth = measureFn(pillText, tagFontOf(theme)) + TAG_PADDING_X * 2

    if (prefix + pillWidth <= contentWidth) {
      plan = {
        shown: k,
        pillText,
        pillWidth,
        groupWidth: prefix + pillWidth,
        // 与 cell-tooltip.joinTooltipText 同口径（'；' join、滤空）；不跨文件
        // import——cell-tooltip 已 import 本模块，反向成环
        title: items.slice(k)
          .map(item => String(item.text ?? ''))
          .filter(text => text !== '')
          .join('；')
      }
    }
  }

  return plan
}
```

```js
/** +n 灰色汇聚 pill：drawTag 无 color 灰路径（边/字 theme.gray = --mu-gray、
    底 theme.hoverBg = --mu-gray-translucent，零新增色值）；命中矩形携带
    text/title（use-cell-tooltip plus 分支消费 tooltip 内容）；index -1 = 合成
    条目（emitDomItemClick 经 items[-1] 判空短路，不发 cell-item-click） */
function drawTagOverflowPill (ctx, plan, x, { centerY, rightBound, theme, measure, onItemRect }) {
  drawTag(ctx, { kind: 'tag', text: plan.pillText }, x, centerY, { maxWidth: rightBound - x, theme, measure })

  onItemRect?.({
    kind: 'tag-overflow',
    index: -1,
    rect: { x, y: centerY - TAG_HEIGHT / 2, width: plan.pillWidth, height: TAG_HEIGHT },
    disabled: false,
    text: plan.pillText,
    title: plan.title
  })
}
```

### 2. itemHits entry 扩展（paintState.itemHits，paint-body 存原数组，附加字段存活）

`{ kind: 'tag-overflow', index: -1, rect: {x, y, width, height}, disabled: false, text: '+n', title: <剩余项 '；' join> }`——每格至多一条；hidden 条目（k 之后）不绘制不回报。

### 3. resolveTooltipTarget 扩展（hit-test.js）

```js
/** 矩形命中判定（click-resolve.isItemRectHit 同式；两模块互 import 成环，就近镜像） */
function isPointInRect (x, y, rect) {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height
}

/** +n 汇聚 pill 命中：该格 tag-overflow 矩形含指针且携带非空 title（空 title =
    无剩余内容，不构成 plus 目标） */
function findTagOverflowPill (hit, itemHits) {
  const rects = itemHits?.get(hit.rowIndex)?.get(hit.colIndex)

  return rects?.find(entry =>
    entry?.kind === 'tag-overflow' && entry.title && isPointInRect(hit.x, hit.y, entry.rect)
  ) ?? null
}

export function resolveTooltipTarget ({ hit, columns, hoverMode, editingCell, resizing = false, itemHits } = {}) {
  if (!isBodyCellHit(hit) || hoverMode === 'none' || resizing) return null
  if (isEditingCell(editingCell, hit)) return null
  if (columns?.[hit.colIndex]?.title === false) return null

  // +n 汇聚 pill（tag 列溢出）：命中 → 目标附 plus 标记；title:false 已在上一行整体拦截
  const pill = findTagOverflowPill(hit, itemHits)

  return { row: hit.rowIndex, col: hit.colIndex, ...(pill ? { plus: true } : null) }
}
```

JSDoc（:170-181）增：`@param {Map} [params.itemHits] painter 条目命中矩形集合（paintState.itemHits；tag-overflow pill 命中检测用，缺省无 plus）`；@returns 补「命中 +n 汇聚 pill 时附 `plus: true`」。

### 4. isAutoTitle 导出（cell-tooltip.js）

```js
/** title 协议自动形态（未设置/true）：溢出才提示全文；false/''/0 与自定义
    String·Function 均非自动（use-cell-tooltip +n pill 分支同源判定） */
export function isAutoTitle (raw) {
  return raw === true || raw == null
}
```

resolveCellTooltip :225 `if (raw !== true && raw != null) return resolveTooltipCustomTitle(col, record)` 改为 `if (!isAutoTitle(raw)) return resolveTooltipCustomTitle(col, record)`（行为等价）。

### 5. use-cell-tooltip.js 修改点

- 新增本地 helper（isSamePoint 仅比 row/col，pill ↔ 非 pill 同格互移须重排）：

```js
/** plus 感知格身份比较（isSamePoint 单一事实源之上叠加 plus 维度） */
function isSameTooltipCell (a, b) {
  return isSamePoint(a, b) && Boolean(a?.plus) === Boolean(b?.plus)
}

/** +n pill 条目查找（绘制帧携带，每格至多一条） */
function findPlusEntry (itemHits, cell) {
  return itemHits?.get(cell.row)?.get(cell.col)?.find(entry => entry?.kind === 'tag-overflow') ?? null
}
```

- `scheduleCellTooltip`：resolveTooltipTarget 参数对象（:57-63）增 `itemHits: host.paintState.itemHits`；:65 `isSamePoint(next, tooltipCell)` → `isSameTooltipCell(next, tooltipCell)`。
- `showCellTooltip`：:138 过期守卫改 `isSameTooltipCell(tooltipCell, cell)`；在 `const tip = resolveCellTooltip(...)` 之前插入：

```js
  // +n 汇聚 pill（title 协议自动形态专属）：内容 = 绘制帧携带的剩余项全文，
  // 锚点 = pill 视口矩形（canvas 视口坐标，与 spanRectOf 同坐标系）；非自动
  // 形态（false/''/0/自定义）与 pill 条目缺失（数据/几何已变）均落回格级路径
  if (cell.plus && isAutoTitle(context.col.title)) {
    const entry = findPlusEntry(host.paintState.itemHits, cell)

    if (entry?.title) {
      placeTooltipAnchor(entry.rect)
      tooltipController.show(tooltipAnchorEl.value, { content: entry.title, placement: 'top', trigger: 'hover' })
      tooltipController.updatePosition()

      return
    }
  }
```

- import 行 :26 增 `isAutoTitle`；文件头 @host-reads（:15-16）补 `paintState`。

### 边界清单（实施与验证共同口径）

- **n 计数**：n = items.length − k（宽度溢出整条隐藏数，pill 文本 `+n`；n 以 compile 产物条目计，非原始 tag 数据条数）；`tagOption.max` 的 compile 层截断不参与 n（items 已是 slice 后产物，其 dots `'...'` 条目属显示集合、计宽占位）；无解回退分两态：仅有 1 条且超宽（measureItem cap 至 contentWidth）→ offset === contentWidth 不构成溢出 → 无 pill 亦无格级 tooltip（drawTag 自身省略截断，现状）；首条即放不下 pill 且条目 ≥ 2 → k=0 → plan null → 回退现状截断/丢弃（无 pill，格级溢出 tooltip 兜底全部条目）。
- **pill 与对齐/命中/间隙**：pill 与末条间隙 = gap = padding（8px）；pill 计入 groupWidth 参与 itemsStartX 对齐（右对齐列 pill 右缘 = 内容区右缘——浏览器验证定位依据）；命中区 = pill 绘制区（y = centerY ± TAG_HEIGHT/2）；hidden 条目无命中矩形（不可点、不参与 hoverItem）；pill 自身可命中（kind `'tag-overflow'`、index -1）——点击不发 cell-item-click（`items[-1]` 判空），且 `finishCellClick` 不早退，仍续行格点击/选中/开编辑链（use-cell-click.js:118-148，现状链）。
- **tooltip 内容格式**：剩余项 text 逐项 String 化、滤空、`'；'` join（与格级全文同字面）。
- **与 title 协议优先级**：pill 命中 + 自动形态 → plus 内容（锚点 pill 矩形）；pill 命中 + 非自动 → 落回格级路径（自定义文本照显、`''`/`0` 求值层归 null、`false` 门控层已拦）；非 pill 区域 → 格级溢出 tooltip（上一任务行为，含未设 title 默认开启）。
- **未溢出回退**：offset ≤ contentWidth → plan 恒 null，绘制/回报/门控/plus 全不触发（A3）。
- **编辑格 veil**：清空该格 itemHits（paint-body veilEditingCell :241）→ pill 命中消失；isEditingCell 门控同时拦截。
- **滚动/relayout/列宽拖拽**：既有 hideCellTooltip / delayHideCellTooltip 收口，pill title 为绘制帧快照不跨失效帧消费。
- **hoverMode none / resizing / 表头 / 越界**：门控 null 先于 plus 判定。
- **合并格**：hit 经 resolveSpanCell 归一锚格，itemHits 键 = 绘制行（锚行），一致；tooltipContextOf 按锚行记录求值（现状）。
- **固定列**：pill 随固定区重绘回报，坐标视口系，trimItemHits 行级修剪同既有条目。

## 被拒绝的备选

1. **compile 层截断产 +n 条目**（tag.js 仿 tagOption.max dots）：compile 无 contentWidth（列宽/主题/树缩进未知），无法判定"放不下"；且 DOM/canvas 双通道会被同时改掉，超出"table-ex（canvas）"任务范围。拒绝。
2. **截断末条 + pill 混合**（首条超宽时截断该条并仍显示 pill）：引入 pill 前条目省略与最小宽边界，n 计数需区分"截断显示"与"隐藏"，口径复杂化；现状回退已覆盖：多条目下格级溢出 tooltip 兜底全部条目，唯一条目超宽为既有截断无提示（与本任务无关）。拒绝。
3. **条目级通用 per-item tooltip**（复用 item.title 字段泛化 hover 提示）：上一任务已拒绝（命中协议与锚点粒度扩大）；本任务仅 +n 单点，经 itemHits 携带内容，不扩大命中协议。拒绝。
4. **+n tooltip 绕过 title 协议**（pill 自带提示不受 title:false 控制）：违反列级单一事实源与 A4 共存要求，见「裁决」。拒绝。

## 风险与回滚

- **行为扩面（任务目标本身）**：所有 `type: 'tag'` 列溢出格从"丢弃"变"+n pill"——demo items 场景「标签（溢出）」row2、「标签（彩色）」row4（12 标签）等将出现 pill，预期内；未溢出与单条超宽格行为不变。
- **itemHits entry 附加字段**（text/title 进入公共数据结构）：消费面已逐个核对（现状节），index -1 保证点击派发判空短路；自检断言锁定形状。
- **pill title 生命周期**：绘制帧快照，数据/几何变更经既有 hideCellTooltip 链路收口；自检 + 浏览器覆盖。
- **eslint complexity**：drawItems 增分支可能触 warning（不阻 exit 0，cell-tooltip complexity 12 先例）；实现按本设计拆 tagOverflowPlanOf / drawTagOverflowPill 控制单函数复杂度，勿内联进 drawItems。
- **合并风险**：全为既有文件局部修改，无签名破坏（新参数全可选）——**双向门**。爆炸半径 = tag 列横排绘制 + tooltip 触发链（5 个 src 文件）；demo 侧为自检新增块与夹具列。回滚 = revert 改动清单 8 文件；注意 main-view.vue 与两个自检文件同时含上一任务未提交改动，回滚只撤销本任务新增块/列，不整文件还原。
- **验证依赖**：同上一任务——$mussel.tooltip 控制器经 demo 完整 install 注册；页面来自 `npm run demo:build` watch（src 与 demo/src 改动均靠它重建）；面板不出现时先查控制器与 watch 重建，不要改设计。

## 测试计划

| 验收标准 | 归属片 | 手段 | 具体检查方式 |
|---|---|---|---|
| A1 pill 渲染 + n 计数（逐一数清，含 8px 间隙） | 片2（步骤 2.1）+ 片3 | 自检（确定性）+ 浏览器 | 自检（确定性测量，n 精确断言）：fakeMeasure 下 4 条 43px tag、内容宽 144 → k=2、pill '+2'、pill x = 59+43+8 = 110（末条右缘 + 8px 间隙）、宽 34、title = '丙丙丙；丁丁丁'（见步骤 2.1 断言全文）；同块另断言 title:false 列仍回报 pill（裁决渲染侧）。浏览器（渲染存在性）：`?scene=items&bust=<ts>`，`getCellRect(1, 3)`（row2「标签（+n）」列）取 r，单次调用内 `mouse.move(r.left + r.width - 20, r.top + r.height / 2)`（右对齐列 pill 右缘 = 内容区右缘，右移 8px padding 再内进 12px 必落 pill 带内）→ 等 600ms → `.mu-tooltip-panel` 存在且 computed display ≠ 'none'——pill 命中矩形只在绘制时回报，命中即证明 pill 已渲染 |
| A2 pill tooltip = 剩余项全文（分隔格式一致） | 片3（步骤 3.1） | 浏览器 | 接 A1 同一面板断言 textContent：`parts = textContent.split('；')`，逐项 `/^溢出标签\d$/`、序号连续递增、`parts[0]` ≠ '溢出标签1'（k ≥ 1 恒显示首条）、`parts.at(-1) === '溢出标签8'`、`parts.length` ∈ [1,7]；join 分隔符与格级全文同为 '；' |
| A3 未溢出无 +n | 片2 + 片3 | 自检 + 浏览器 | 自检：2 条 43px（offset 94 ≤ 144）→ 无 tag-overflow 回报、无 '+' 文本（步骤 2.1）。浏览器：先按验证环境要点第 1 条中性移出并等面板收起，再 `getCellRect(0, 3)`（row1 '短标/甲' 未溢出）pill 位（r.left + r.width - 20）hover → 等 700ms → 面板 display 'none' 或不存在 |
| A4 协议共存不回归 | 片3 + 终验 | 浏览器 | 1) `getLayoutInfo().colWidths.length === 15` 且前五 `[120,150,150,150,150]`；2) **title:false 抑制 +n**（裁决行为）：`getCellRect(1, 4)`（「标签（+n·title:false）」列，pill 渲染已由 2.1 自检断言）pill 位 hover → 600ms → 无面板；3) tag 溢出格级 tooltip 回归：`getCellRect(1, 1)` 于 `r.left + 40`（首条标签带内）hover → 600ms → textContent === '溢出标签1；溢出标签2；溢出标签3；溢出标签4；溢出标签5；溢出标签6；溢出标签7；溢出标签8'（8 项全量 join，上一任务行为；逐字比对，勿用省略号）；4) button 溢出回归：`getCellRect(1, 2)` 中心 hover → 600ms → '短；这是一条超长按钮文字标题溢出提示夹具'；5) 文本溢出回归：`?scene=default&bust=<ts>`，`getCellRect(1, 4)` hover → 600ms → longText 全文，`getCellRect(1, 5)` hover → 800ms → 无面板 |
| A5 自检 + lint | 片2 + 终验 | 浏览器 + 命令 | 打开 `?bust=<ts>` 等 `.ct-check-item` 渲染：`.ct-check-item--fail` 数 0 且头部 `自检结果（N/N 通过）` 两数相等（只认 onMounted 首跑，勿点「重跑自检」；interactions/cell-painters 失败基本可断定本改动引入）。命令：`npx eslint --ext .js,.vue src demo/src` 退出码 0（--ext 必带）；`npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` 退出码 0（glob 必加引号）；两者均全局安装，npx 直调勿 npm i，npm warn/notice 为噪声 |

验证环境要点：

1. **面板指针拦截（假 FAIL 首要来源）**：tooltip 面板显示中 `pointer-events: auto`（tooltip-panel.scss:66-67 `[pop-up]`，popup.js:41 入场设置），且面板恒在锚点上方（placement top，间距 4px：tooltip-panel.vue:56、:132-136）——pill 锚点位于行 1 时，面板覆盖行 0 中部。落在面板上的移动不产生表格 pointermove，面板自身 `@mouseover.stop` 又清 `delayHide` 计时（tooltip-panel.vue:12-13），该面板不会自行收起。故**每段 hover 前**：`mouse.move(5, 5)`（页面左上角，舞台之外）→ 等 ≥ 800ms（HIDE_DELAY 300 + 退场过渡 ~100）→ 断言 `.mu-tooltip-panel` computed `display === 'none'`（或节点不存在）→ 再进入下一段。
2. 先探活 :3000，不通后台 `npm run demo:build`；任何 Edit 过的 `src/**`、`demo/src/**` 文件 `touch <绝对路径>` 等重建；URL 一律 cache-bust。
3. **页面就绪**：等 `.ct-check-item` 出现且 `window.__canvasTable.getCellRect(row, col)` 返回非 null（layout 未就绪返回 null，use-table-api.js:107-125；`__canvasTable` 于 onMounted 赋值，main-view.vue:1564-1568）后再取 `r`，勿对 null 取 `.left`。
4. hover→停留→断言单次调用内完成；坐标越视口先 `.ct-stage` scrollIntoView 再重取（滚动后旧坐标失效）。
5. playwright mcp 优先；不可用 Edge headless `--dump-dom` 兜底（对 dump HTML 断言 `.mu-tooltip-panel` display 与文本——但 pill 定位 hover 依赖坐标，兜底仅能验 A4-2)/5) 等非坐标项，如实注明）。

## 实施步骤

### 片1：src 绘制 + 门控 + 编排（逻辑层）

- **1.1 item-painters.js：drawItems pill 模式**
  - 文件：`src/components/table/ex/cell-paint/item-painters.js`
  - 内容：按「接口 / 数据结构」§1——签名增 `tagOverflowBadge = false`；`layoutItemPositions` 调用后插 plan 求值；start 行 offset 实参改 `plan ? plan.groupWidth : offset`；循环上限 `const limit = plan ? plan.shown : items.length`（循环体 :92-116 不动）；循环后 pill 绘制调用；新增 `tagOverflowPlanOf` / `drawTagOverflowPill`（伪代码见 §1，注意 title join 注释说明与 joinTooltipText 镜像关系与防环原因）；文件头 :1 注释补 tag 列 +n 溢出汇聚；drawItems 上方注释（:75-76「超出右缘的条目丢弃」）补「（tagOverflowBadge 时改绘 +n 汇聚 pill）」，与新行为一致。
  - 完成判据：`grep -c "tagOverflowBadge" src/components/table/ex/cell-paint/item-painters.js` ≥ 2；`grep -c "tag-overflow" src/components/table/ex/cell-paint/item-painters.js` ≥ 1；`npx eslint --ext .js,.vue src` 退出码 0。
  - 依赖：无。
- **1.2 cell-painters.js：范围门控**
  - 文件：`src/components/table/ex/cell-paint/cell-painters.js`
  - 内容：drawContentItems 的 drawItems 调用（:188-200）实参增一行 `tagOverflowBadge: col.type === 'tag'`。
  - 完成判据：`grep -n "tagOverflowBadge: col.type === 'tag'" src/components/table/ex/cell-paint/cell-painters.js` 命中 1。
  - 依赖：1.1（参数存在）。
- **1.3 cell-tooltip.js：isAutoTitle**
  - 文件：`src/components/table/ex/cell-paint/cell-tooltip.js`
  - 内容：按 §4 导出 isAutoTitle（置于 joinTooltipText 附近）；:225 行改用。
  - 完成判据：`grep -c "isAutoTitle" src/components/table/ex/cell-paint/cell-tooltip.js` ≥ 2（`export function isAutoTitle` 定义 + :225 调用；§4 代码只产生 2 处，勿为凑 3 处另加注释）；`grep -n "raw !== true && raw != null" 同文件` 0 命中。
  - 依赖：无。
- **1.4 hit-test.js：plus 目标**
  - 文件：`src/components/table/ex/interaction/hit-test.js`
  - 内容：按 §3 新增两个私有函数 + resolveTooltipTarget 扩展 + JSDoc 同步。
  - 完成判据：`grep -c "findTagOverflowPill" src/components/table/ex/interaction/hit-test.js` ≥ 2；`grep -n "plus: true" 同文件` 命中 1；eslint 退出 0。
  - 依赖：无。
- **1.5 use-cell-tooltip.js：plus 编排**
  - 文件：`src/components/table/ex/composables/use-cell-tooltip.js`
  - 内容：按 §5——helper 两条、scheduleCellTooltip 传参与去重、showCellTooltip 过期守卫 + plus 分支、import 与 @host-reads 注记。
  - 完成判据：`grep -c "isSameTooltipCell" src/components/table/ex/composables/use-cell-tooltip.js` === 3；`grep -n "isAutoTitle" 同文件` 命中 2（import + 分支）；`grep -c "isSamePoint(next, tooltipCell)"` 0 命中；eslint 退出 0。
  - 依赖：1.3、1.4。

### 片2：自检新增块（确定性断言）

- **2.1 cell-painters.js：drawItems +n 块**
  - 文件：`demo/src/data/table-ex/self-checks/cell-painters.js`（checks 数组 `]`（:2736）前追加：上一元素收尾 `}` 后先补 `,` 再粘块；块内缩进 2 空格）
  - 块全文（夹具计算：'甲甲甲' 类 3 字 = 27 + 16 = 43/条；'+2' = 2 字 18 + 16 = 34；4 条 offset = 4×43+3×8 = 196 > 144 溢出；k=2：43+8+43+8 = 102 prefix + 34 = 136 ≤ 144；k=3：153 + 34 > 144 ✗）：

```js
  {
    name: 'drawItems：tag 列 +n 溢出汇聚（全宽前缀 + 灰 pill +n、n = 隐藏数、命中回报；未溢出/无解回退）',
    fn: () => {
      const col = prepareColumn({ field: 'v', type: 'tag' })
      const rects = []
      const { calls } = drawRecorded(
        col,
        { v: ['甲甲甲', '乙乙乙', '丙丙丙', '丁丁丁'] },
        { measure: fakeMeasure, onItemRect: r => rects.push(r) }
      )

      assertArray(calls.fillText.map(c => c.text), ['甲甲甲', '乙乙乙', '+2'], '前缀 2 条全宽 + pill \'+2\'（隐藏 2 条）')

      const pill = rects.find(r => r.kind === 'tag-overflow')

      assert(pill, '应回报 tag-overflow 命中矩形')
      assertEqual(pill.text, '+2', 'pill 文本 = 隐藏条数 n')
      assertEqual(pill.title, '丙丙丙；丁丁丁', 'pill title = 剩余项全文 \'；\' join')
      assertEqual(pill.index, -1, '合成条目 index -1（点击派发判空短路）')
      assert(pill.disabled === false, 'pill 非禁用')
      assertArray([pill.rect.x, pill.rect.width], [110, 34], 'pill x = 末条右缘 102 + 8px 间隙 = 110、宽 = 18 + 16 内距')
      assertEqual(calls.fillText[2].fillStyle, cssColorOf(THEME.gray), 'pill 文字灰（--mu-gray）')
      assertEqual(calls.fill[2].fillStyle, cssColorOf(THEME.hoverBg), 'pill 底 hoverBg（gray translucent 等价）')

      // 裁决：pill 渲染不受 title 控制（title:false 列仍出 +n，仅抑制其 tooltip）
      const noTitle = []

      drawRecorded(prepareColumn({ field: 'v', type: 'tag', title: false }), { v: ['甲甲甲', '乙乙乙', '丙丙丙', '丁丁丁'] }, { measure: fakeMeasure, onItemRect: r => noTitle.push(r) })

      assert(noTitle.some(r => r.kind === 'tag-overflow'), 'title:false 列仍回报 +n pill（渲染不受 title 控制）')

      // 未溢出：2×43 + 8 = 94 ≤ 144 → 无 pill、常规回报不变
      const fits = []

      drawRecorded(col, { v: ['甲甲甲', '乙乙乙'] }, { measure: fakeMeasure, onItemRect: r => fits.push(r) })

      assert(!fits.some(r => r.kind === 'tag-overflow'), '未溢出不回报 pill')
      assertArray(fits.map(r => `${r.kind}:${r.index}`), ['tag:0', 'tag:1'], '常规条目回报不受影响')

      // 无解回退：首条 cap 144 后 144 + 8 + 34 > 144 → k=0 → 现状截断/丢弃
      const fallback = drawRecorded(col, { v: ['甲'.repeat(20), '乙乙乙'] }, { measure: fakeMeasure })
      const fallbackRects = []

      drawRecorded(col, { v: ['甲'.repeat(20), '乙乙乙'] }, { measure: fakeMeasure, onItemRect: r => fallbackRects.push(r) })

      assertEqual(fallback.calls.fillText.length, 1, '回退：仅首条省略截断，乙乙乙丢弃（现状）')
      assert(fallback.calls.fillText[0].text.endsWith('...'), '首条省略截断（现状行为）')
      assert(!fallbackRects.some(r => r.kind === 'tag-overflow'), '回退不回报 pill')

      return '溢出 k=2 + pill(+2) 计宽/位置/回报；title:false 仍渲染 pill；未溢出无 pill；无解回退现状'
    }
  }
```

  - 完成判据：touch + 等 rebuild → 打开 `http://localhost:3000/data/table-ex/?bust=<ts>`，自检面板无 `.ct-check-item--fail` 且新块名出现在通过列表。
  - 依赖：片1（1.1/1.2 未做时该块必败）。
- **2.2 interactions.js：resolveTooltipTarget plus 块**
  - 文件：`demo/src/data/table-ex/self-checks/interactions.js`（checks 数组 `]`（:840）前追加）
  - 块全文：

```js
  {
    name: 'resolveTooltipTarget：+n 汇聚 pill（tag-overflow 矩形含指针 → {row,col,plus:true}；title:false 拦截 / 空 title·矩形外·itemHits 缺省 → 无 plus）',
    fn: () => {
      const columns = [{}, { title: true }, { title: false }]
      const pillEntry = {
        kind: 'tag-overflow',
        index: -1,
        rect: { x: 40, y: 100, width: 34, height: 20 },
        disabled: false,
        text: '+2',
        title: '丙；丁'
      }
      // col 0/1 = 自动形态；col 2 = title:false（门控拦截）；col 4 未配置列
      // （title 未设置 = 自动形态）但条目 title 为空串 → 空 title 分支
      const itemHits = new Map([
        [3, new Map([[0, [pillEntry]], [1, [pillEntry]], [2, [pillEntry]], [4, [{ ...pillEntry, title: '' }]]])]
      ])
      const base = { columns, hoverMode: 'row', editingCell: null, resizing: false, itemHits }
      const hit = colIndex => ({ isHeader: false, colIndex, rowIndex: 3, x: 50, y: 110 })
      const flat = target => target && [target.row, target.col, Boolean(target.plus)]

      assertArray(flat(resolveTooltipTarget({ ...base, hit: hit(0) })), [3, 0, true], 'pill 命中（未设置 title）→ plus 目标')
      assertArray(flat(resolveTooltipTarget({ ...base, hit: hit(1) })), [3, 1, true], 'title:true 列 pill 命中 → plus 目标')
      assertEqual(resolveTooltipTarget({ ...base, hit: hit(2) }), null, 'title:false 列 pill 命中仍 null（门控先于 plus）')
      assertArray(flat(resolveTooltipTarget({ ...base, hit: hit(4) })), [3, 4, false], '空 title pill（无剩余内容）→ 常规目标')
      assertArray(flat(resolveTooltipTarget({ ...base, hit: { ...hit(0), x: 10 } })), [3, 0, false], '同格 pill 矩形外 → 常规目标')
      assertArray(flat(resolveTooltipTarget({ ...base, itemHits: undefined, hit: hit(0) })), [3, 0, false], 'itemHits 缺省无 plus（回归）')
      assertEqual(resolveTooltipTarget({ ...base, hit: hit(0), resizing: true }), null, '拖拽中整体 null（含 pill）')

      return 'pill 命中 plus / title:false 抑制 / 空 title·矩形外·缺省无 plus'
    }
  }
```

  - 完成判据：同 2.1（自检全绿 + 新块通过）。
  - 依赖：片1（1.4）。

### 片3：demo 夹具（浏览器可验载体）

- **3.1 main-view.vue：items 场景加 2 列**
  - 文件：`demo/src/data/table-ex/main-view.vue`
  - 内容：「按钮（溢出）」列（:800）之后插入（field 复用 tagsOverflow，零记录改动；新列序 3/4，初始视口内 720 ≤ 960）：

```js
    // +n 夹具（20261110-tag-overflow-plus-n）：tag 列溢出 +n 汇聚 pill。右对齐使
    // pill 右缘恒贴内容区右缘（hover 定位确定性，itemsStartX right 分支）；
    // title:false 对照列验证 +n tooltip 受 title 协议抑制（设计裁决）；field 复用
    // tagsOverflow（row1 未溢出 / row2 8 标签溢出，与「标签（溢出）」列同源）
    { caption: '标签（+n）', field: 'tagsOverflow', type: 'tag', width: 150, align: 'right' },
    { caption: '标签（+n·title:false）', field: 'tagsOverflow', type: 'tag', width: 150, align: 'right', title: false }
```

  - 完成判据：A1-A4 浏览器断言全过（见测试计划）；既有 items 夹具行为不变、自检无失败行。
  - 依赖：片1。

### 终验：lint + 全量回归（集成）

- **4 终验**：`npx eslint --ext .js,.vue src demo/src` 与 `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` 退出码均 0；A1-A4 全量复验一遍（新 cache-bust URL：`?scene=items` 跑 A1/A2/A3/A4-1~4、`?scene=default` 跑 A4-5、自检面板跑 A5）。依赖：2.1、2.2、3.1。

实施注意（全部步骤适用）：任何 Edit 过的文件 `touch <绝对路径>` 等 watch 重建；访问带 cache-bust；每轮验证前重取 `getCellRect`；不 commit/push/装依赖；自检面板只认 onMounted 首跑结果；本任务改动与上一任务未提交改动同文件叠加（main-view.vue、两个自检文件），只增不改上一任务内容。

## 裁决（decisions.md 待裁项，designer 裁定，修订时终审）

**`+n` tooltip 受 `title: false` 控制（抑制）**，且与完整 title 真值矩阵同口径：

| `column.title` | pill hover 行为 |
|---|---|
| 未设置 / `null` / `true`（自动形态） | 显示剩余项全文（本任务新行为，锚点 pill 矩形） |
| `false` | 不提示（门控层整体拦截，与格级一致） |
| `''` / `0` | 无 plus 专属内容；落回格级路径 → 求值层归 null → 不提示 |
| String / Function | 无 plus 专属内容；落回格级路径 → 恒显示自定义文本（锚点格矩形） |

理由：

1. **协议一致性**：title 协议 v2 是列级 tooltip 单一事实源（上一任务确立）；`title: false` 语义 = "本列不要 tooltip"。若 +n 绕过，显式关闭的列仍会弹出提示，违反 A4"共存不冲突"。
2. **实现零额外分支**：`title: false` 在门控层先于 plus 判定拦截；`''`/`0`/自定义经 `isAutoTitle` 单点判定落回格级路径——不建第二套真值口径（上一任务明确原则："不在门控层建第二套真值口径"）。
3. **先例**：tag.js compile 的 dots `'...'` 条目 title 仅 `column.title === true` 才携带（column-types/tag.js:26、:44）——条目级提示从未宽于列协议。
4. **诉求不矛盾**：title:false 列仍渲染 +n pill 本身（渲染不受 title 控制），可见汇总但无 hover 提示，"关闭提示"语义完整。

**修订终审（design-amender）：裁决成立，按上表实施。** 关键是把「渲染」与「提示」分开：pill 绘制不带任何 title 判断（`tagOverflowBadge: col.type === 'tag'`，cell-painters.js:188-200 实参），title 协议只作用于 tooltip 的触发（hit-test 门控）与内容选择（`isAutoTitle` 分支）；不建第二套真值口径，也不让显式关闭提示的列重新弹出提示。渲染侧由步骤 2.1 新增断言锁定（title:false 列仍回报 `tag-overflow`），抑制侧由 A4-2 浏览器断言锁定。

## 未解问题

无阻塞级未解问题。文末 2 条非阻塞注记，修订终审处置如下：

1. **防御分支（混排非 tag 条目 → plan null 回退现状）不加自检**：处置 = 维持。修订核实（无公共构造路径的依据）：`col.type === 'tag'` 时 `_render` 恒为 `TagColumn.compile` 产物（cell-content.js:29、:91；tag.js:37-59 恒产 `kind:'tag'`，含 dots 条目），非 'tag' 的 type 不会传入 `tagOverflowBadge: col.type === 'tag'`（cell-painters.js:188-200）。`items.every(...)` 仅作防御，保留代码 + 注释即可，不设自检、不阻塞。
2. **k 依赖运行环境字体**：处置 = 维持浏览器断言与 k 无关（A2 只断言剩余项后缀连续：`parts[0] ≠ '溢出标签1'`、`parts.at(-1) === '溢出标签8'`、`parts.length ∈ [1,7]`）。修订补 k ≥ 1 的确定性依据（比原注更宽裕）：k=1 只需 1 条 tag + 8px 间隙 + pill ≤ 内容宽 134；即使 CJK 按 10px/字计，'溢出标签1'（4×10 + 数字 6 + 内距 16 = 62）+ 8 + pill '+7'（≈13 + 16 = 29）≈ 99 ≤ 134 恒成立；k=0 需首条即放不下（首条 > ≈96px ≈ 6 个 CJK），8 条夹具不触发。
