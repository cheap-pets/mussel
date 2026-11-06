# 设计

## 方案概述

三项独立改动，全部位于 `src/components/table/` 与 demo，无公共 API（props/events）变更：

1. **需求 1（text 列 link 悬停）**：`TextColumn.compile` dom=false 产物增加 `link` 门控字段；canvas 绘制侧 `drawDisplayText` 消费该字段——取色改走条目链路 `linkTextColorOf` / `linkHoverColorOf`，hover 时经 `drawTextValue` 新增 `underline` 选项画 1px 下划线，并向 `onItemRect` 回报 `{ kind: 'link', index: 0, link: true }` 命中矩形，接入既有 `itemHits → updateHoverItem → applyItemCursor` 链路获得 pointer 光标。点击链路零改动（text 格无 items，`emitDomItemClick` 天然短路，仍只发 cell-click）。
2. **需求 2（button 列字段值渲染）**：`ButtonColumn.compile` 增加 `valueToButtons` 缺省包装（tag 列 `valueToTags` 同构），`getButtons` 调用透传 `(record, value)`；空组门控上提至双通道共用（`!Array.isArray(buttons) || !buttons.length → return`，与 DOM 分支现状同口径），canvas 空组产物由 `{ canvasKind: 'button', buttons: [] }` 改为无内容 → 落占位链（否则需2-6 的「落占位」在 canvas 通道无实现手段）。canvas / DOM 双通道经共享 compile 自动同口径，绘制层（`drawButton` / `domItemOf`）零改动。
3. **需求 3（格线截断）**：`paint-gridlines.js` 内 `paintRowGridlines` 行线右界 cap 至末列右缘视口 x、`paintColGridlines` 列线下界 cap 至末行底部视口 y（含 blankTail 末列右缘线）；表头底边框（承担首行顶线语义，`paint-header.js:279-280`）末线右界同式 cap 至 `contentRightX`，表头背景仍整宽（已裁定计入需求 3-b，`decisions.md`）。行满/列满时 cap 为 min() 无操作，现状不回归。DOM 通道（mu-table）列宽铺满容器（`table-layout: fixed` + `min-width: 100%` 把剩余宽分给列，`base/table.scss:22-28`），不存在「列少空白区」；表体线随 td 存在与否截断，不改。

工作区基线：button/link/list 存在未提交改动（注释清理 + link/list 条目 `caption→label` 键名迁移）。**button/tag 条目键仍为 `caption`**（`column-types/tag.js:4`、`button.js:49` 现状），需求 2 包装口径以 tag 现状 `caption` 为准，不回退任何未提交改动。

## 遵循约定与复用

无探索报告，以下约定自行从改动模块提取（均已打开源码核对）：

- **compile 双通道约定**：`column-types/*.js` 的 `compile(column, dom)` 双分支产物；取值链 `ensureFn(column.xxx || 缺省包装)` + `(record, value)` 透传——范本 `tag.js:23,30`（`ensureFn(column.tags || valueToTags)`、`getTags(record, value)`）、`link.js:24`。包装函数形态：对象元素原样保留、标量包 `{ caption: el }`、单值包单元素数组、`value == null` 返回 undefined（`tag.js:9-17`）。
- **canvas 下划线/取色复用**：`linkUnderlineY`（`ex/cell-paint/cell-text.js:153`，基线下 2px）、`linkTextColorOf` / `linkHoverColorOf`（`ex/cell-paint/item-painters.js:53,67`）、`isLinkEntryHovered`（`item-painters.js:266`，kind+index+`item.link !== false`+非 disabled 谓词）。
- **itemHits 协议**：绘制期 `onItemRect({ kind, index, rect, disabled, link? })` 回报（`item-painters.js:159`、`link-items.js:62`、`canvas-kind-painters.js:163`）；消费端 `resolveItemClick`（`interaction/interactions.js:344-383`）、光标 `applyItemCursor`（`composables/use-pointer.js:175`，kind 'link'/'button' 且非 disabled 且 `link !== false` → pointer）。注意 `drawCell` 收到的 `hoverItem` 是按格缩减的 `{ kind, index, disabled }`（`table-paint/paint-body.js:240-246`），判定只用 kind/index。
- **命中矩形行框口径**：`{ x, y: centerY - lineHeight/2, width, height: n × lineHeight }`（`link-items.js:66`、`item-painters.js:166-168`）。
- **格线绘制**：视口换算 `viewportColX` / `viewportRowY`（`table-paint/paint-utils.js:26-31`）；blankTail 派生式 `layout.stickyWidth > layout.contentWidth`（`paint-body.js:233`、`paint-gridlines.js:114` 同式）。`rowGeometry.totalHeight` / `rowCount` 为双模式统一接口（`geometry/row-geometry.js:183,238`）。
- **色值**：一律 `theme.colors[色名]` 谱系查表，禁硬编码（本轮无新色值）。
- **demo 约定**：`demo/src/data/<name>/main-view.vue` + `demo-page` / `demo-section`（title/note/wide）；提示行样式复用本页既有 `.ex-basic__tip`。图标名用已注册的 `clock`（`src/icons/tabler-icons.js:38`，`/table/` demo `table/main-view.vue:395` 已用）。
- **注释风格**：改动处中文注释注明出处/决策依据，与模块内现状一致。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/column-types/text.js` | compile dom=false 产物增加 `link: isLink || null` 字段；同步 `text.js:41-43` 与 `demo/src/data/table-ex/main-view.vue:784` 的「canvas 仅链色文本/无 hover 下划线」注释为现状 | 需求 1：绘制/交互层需 link 门控信息；旧注释与实现冲突（证据 `text.js:43`、`demo/src/data/table-ex/main-view.vue:784`） |
| `src/components/table/ex/cell-paint/cell-text.js` | `drawTextValue` options 增加 `underline`；返回值增加实绘文本块矩形 | 需求 1：下划线绘制 + 命中矩形来源 |
| `src/components/table/ex/cell-paint/cell-painters.js` | `drawDisplayText` 消费 `content.link`：条目口径取色、hover 下划线、`onItemRect` 回报；`drawCell` 调用点透传 `hoverItem` / `onItemRect`（签名不变） | 需求 1：canvas 通道 hover 行为 |
| `src/components/table/column-types/button.js` | compile 增加 `valueToButtons` 缺省包装；`getButtons(record, value)` 透传；空组门控（`!Array.isArray(buttons) \|\| !buttons.length`）上提至双通道分支之前（canvas 空组不再产 `canvasKind: 'button'`）；文件头与 `button.js:81-82` 的签名/门控注释同步 | 需求 2：仅配 field 的字段值渲染 + 空值落占位（需2-6；canvas 无占位链，`drawCell` 在 canvasKind 分发处直接返回，`cell-painters.js:86-91`） |
| `src/components/table/ex/table-paint/paint-gridlines.js` | 行线右界 cap、列线下界 cap（含 blankTail 线与分段绘制路径） | 需求 3：格线截断 |
| `src/components/table/ex/table-paint/paint-header.js` | `paintHeader` 末线宽度由 `W`（stickyWidth）改 `Math.min(W, contentRightX)`（contentRightX 与 paint-gridlines 同式，`viewportColX` 本文件已导入 `:190`）；表头背景仍整宽 | 需求 3-b：表头底边框承担首行顶线语义，已裁定计入截断（`decisions.md`） |
| `demo/src/data/table-ex-basic/main-view.vue` | 列类型段：链接文本列 ×2、field 按钮列 ×2、既有按钮列改 `(record, value) => value`、cell-click / cell-item-click 日志行；新增「格线截断」section（行少/列少夹具） | 三需求的 demo 验证夹具 |

测试文件：无测试框架，不新增；验证经 demo + playwright（见测试计划）。

## 接口 / 数据结构

均为内部接口/产物扩展，无公共 API 变更。

**1. TextColumn.compile dom=false 产物**（`text.js:57-62`）

```
// 变更前 { text, color, title } → 变更后
{ text, color, title, link: isLink || null }
```

`resolveCellContent` 仅解构 `class/style/title`（`cell-content.js:154`），`link` 落入 params 原样透出。`isPlainTextColumn` 已排除 `link !== true`（`cell-content.js:80`），短路路径不受影响。

**2. drawTextValue 签名扩展**（`cell-text.js:99`）

```
drawTextValue (ctx, rect, display, align, {
  padding, theme, color, measure, wrapCache, maxLines, centerY, rightInset,
  underline // 新增 Boolean，缺省 falsy：true 时每实绘行下 1px 下划线
})
// 返回值（新增）：{ x, y, width, height } | undefined
//   实绘文本块行框外接矩形：y = centerY - lineHeight/2，
//   height = 实绘行数 × lineHeight，width = 最宽实绘行宽（省略后），
//   x 按 align 反推（left=anchorX / center=anchorX-w/2 / right=anchorX-w）；
//   未绘制任何文本（空串/零宽）返回 undefined
```

- 单行路径：下划线宽 = `min(ellipsize 宽, contentWidth)`（与 `drawLinkEntry` 的 `drawn` 同式，`link-items.js:23`）；y = `linkUnderlineY(anchor.y)`。
- 多行路径：每行下划线（宽 = 该行 measure 宽，走注入 measure 缓存），y = `linkUnderlineY(该行 anchor.y)`——对齐 DOM `text-decoration` 多行逐行下划线。
- 下划线 x 与文本起点同口径（`textAnchorX` 对 center/right 返回的是锚点而非左缘，`cell-text.js:85-91,125,148`）：left = `textAnchorX(...)`；center = 该 x − 行宽/2；right = 该 x − 行宽。缺此换算时 center/right 对齐列的线会从锚点向右溢出格内文本区。
- 既有两个调用方（`cell-painters.js:159` line-clamp 路径、`:215` drawDisplayText）不传 `underline`、忽略返回值，行为不变。

**3. drawDisplayText link 分支**（`cell-painters.js:205`，模块内私有函数，参数追加 `hoverItem, onItemRect`）

```js
// 伪代码
const isCellLink = content.link === true
const hovered = isCellLink && isLinkEntryHovered(hoverItem, CELL_LINK_ITEM, 0) // CELL_LINK_ITEM = { link: true } 模块常量
const color = isCellLink
  ? (hovered ? linkHoverColorOf : linkTextColorOf)({ color: content.color, link: true }, theme)
  : (content.color && theme?.colors?.[content.color]?.color)   // 非 link 路径原样

const block = drawTextValue(ctx, rect, display, col._align, {
  padding, theme, color, measure, wrapCache, maxLines, centerY, rightInset,
  underline: hovered
})

if (isCellLink && block) {
  onItemRect?.({ kind: 'link', index: 0, rect: block, disabled: false, link: true })
}
```

- 取色：compile 对 link 列已缺省 `color || 'primary'`（`text.js:60`），伪条目 `{ color, link: true }` 过 `linkTextColorOf` / `linkHoverColorOf` 得到与条目链路一致的谱系色（含 hover 层）。
- 命中回报恒发生（非仅 hover 时），`itemHits` 驱动 `updateHoverItem` → hover 态与 pointer 光标；`hoverMode: 'none'` 时 `updateHoverItem` 恒 null（`use-pointer.js:158`），自动抑制。
- 点击零新增：text 格无 items，`emitDomItemClick` 在 `canvasItem` 判空处返回（`use-cell-click.js:237-239`），不发 cell-item-click；随后 `resolveCellClick` 照发 cell-click，payload 不变。
- 占位文本无 link：value 空时 compile 返回 null（`text.js:50`）→ `content.link` undefined。

**4. ButtonColumn.compile**（`button.js:70-79`）

```js
// tag.js valueToTags 同构（键名随 tag/button 现状用 caption）
function valueToButtons (record, value) {
  if (value != null) {
    return Array.isArray(value)
      ? value.map(el => (el != null && typeof el === 'object' ? el : { caption: el }))
      : [{ caption: value }]
  }
}

const getButtons = ensureFn(column.buttons || valueToButtons)   // 原 ensureFn(column.buttons)

// render 闭包内
const buttons = getButtons(record, value) ?? []               // 原 getButtons(record)
// 空组门控上提（原仅 dom=true 分支有，button.js:92）：双通道共用
if (!Array.isArray(buttons) || !buttons.length) return
```

- canvas 空组产物变化：原 `{ canvasKind: 'button', buttons: [], link }` → 无内容（`resolveCellContent` 返回 `{}`，`cell-content.js:154-157`）；`drawCell` 的 canvasKind 分发（`cell-painters.js:86-91`）不再命中，落 `drawDisplayText` 占位链 `content.text ?? col.placeholder ?? placeholder`（`cell-painters.js:209`）。与 DOM 分支现状（`button.js:92` 返回 undefined → `<td>{{ cell.text ?? cell.col.placeholder }}`，`base/table-row.vue:33`）同口径。
- 空组此前本就不绘制不命中（`drawButton` 门控，`canvas-kind-painters.js:131`），故 cursor/hover/点击链路无回归；差异仅在「有 placeholder 时空格变为占位文字」。
- `column.buttons` 显式配置（含数组/函数）优先，非空行为不变；A9 门控已放行 button 列数组值（`cell-content.js:135`）。
- 无效条目过滤沿用：canvas `ellipsizeButton` null 哨兵（`canvas-kind-painters.js:200-226`）、DOM `domItemOf` 返回 null（`button.js:54`）。全无效条目组（非空数组）双通道仍不绘制也不落占位（DOM `items: []` 走 items 分支，canvas 哨兵终止），与空组区分。

**5. paint-gridlines / paint-header 截断**（纯内部）

```js
// paintGridlines 内（W 求值后）：
const n = layout.colWidths.length
const contentRightX = n ? viewportColX(layout, n - 1) + (layout.colWidths[n - 1] || 0) : 0
const rowLineW = Math.min(W, contentRightX)            // 行线右界（paintRowGridlines 与 paintSegmentedHLine 的 W 入参）

// paintColGridlines 内：
const contentBottomY = layout.rowGeometry.rowCount > 0
  ? Math.min(layout.stickyHeight,
      layout.headHeight + layout.rowGeometry.totalHeight - layout.scrollTop)
  : layout.stickyHeight                                  // 空表维持现状（已裁定，decisions.md）
// 整线与分段两路径的 yTo / 高度计算以 contentBottomY 替换 layout.stickyHeight

// paintHeader 内（W = layout.stickyWidth；表头背景 fillRect(0, 0, W, headHeight) 仍整宽）：
const n = layout.colWidths.length
const contentRightX = n ? viewportColX(layout, n - 1) + (layout.colWidths[n - 1] || 0) : 0
ctx.fillRect(0, headHeight - 1, Math.min(W, contentRightX), 1)   // 末线右界 cap（与 paintGridlines 同式）
```

- 推演无回归：行满/列满或滚动溢出时 `contentRightX >= stickyWidth`、`contentBottomY >= stickyHeight`，min() 无操作；固定列区 pass（`paintArea` 传 `maxWidth = fixedWidth`，`paint-body.js:321`）中 `contentRightX >= fixedWidth` 恒成立，cap 无操作；全固定列时两者相等。`paintHeader` 无 maxWidth 入参（整表头一次绘制），列满/滚动溢出时同式 min() 无操作。
- `topAt(rowCount) === totalHeight` 双模式成立（`row-geometry.js:175-184, 230-239`），与 `contentHeight` 派生同源（`layout.js:321`）。
- 固定/滚动分界强化线（`paint-body.js:324-327`，scrollLeft > 0.5 时）非格线，不改。
- 表头底边框（`paint-header.js:279-280`，`fillRect(0, headHeight-1, W, 1)`）承担「首行顶线 r=0」语义（`paint-gridlines.js:91-92` 注释口径），**已裁定计入需求 3-b 截断**（用户裁定，`decisions.md`）：末线宽度 cap 至 `contentRightX`（上式），表头背景仍整宽（`theme.bgFill`，`paint-header.js:272-273` 不动）。cap 后末线右缘 = 末列右缘线（`paintHeaderColLine`，`paint-header.js:188-191`，blankTail 补画）的右缘，口径与 paint-gridlines 行线一致。
- 表头列分隔线（`paint-header.js:186-230`）为列间垂直线，止于各列右缘，不超末列右缘，不截断。

## 被拒绝的备选

1. **需求 1：text+link 格改道条目绘制链路**（compile dom=false 产 `items: [{ kind: 'link', text, color }]`，复用 `drawItems` 的 hover/命中）。拒绝：`drawItems` 为横排单行省略（`item-painters.js:79`），`multiline + lineClamp + link` 组合会从多行折行退化为单行省略（DOM 通道该组合存在且正常，`table/main-view.vue:332`）；且条目链路的 `onItemClick` 语义需额外绕开 cell-item-click，改动面反而更大。
2. **需求 2：在 canvas 侧 `drawButton` 内做字段值包装**。拒绝：双通道行为一致要求包装在 compile 层（DOM 通道 `domItemOf` 同源消费），绘制层包装只覆盖 canvas，两通道口径分叉。
3. **需求 3：在 `relayout` 产出 `contentBottom` / `contentRight` 字段供 painter 消费**。拒绝：视口坐标随 scrollTop/scrollLeft 变化，paint 时现算才是正确口径；扩 layout 契约影响面大于收益。

## 风险与回滚

- **单向/双向门**：全部双向门（行为扩展，无 API/数据结构破坏）；无共享文件生成物。
- **需求 1**：`drawTextValue` 返回值与 `underline` 为增量，既有调用方不受影响；demo 自检（`demo/src/data/table-ex/self-checks/`）无 text link 产物形状断言；`canvasKind === 'button'` 断言存在（`self-checks/cell-painters.js:972`）但夹具 `buttons` 均为非空，空组上提不触及。未知色名 + link 的常驻色从 textColor 回退变为 primaryColor 谱系回退（`linkTextColorOf` 口径），属需求明示的对齐方向。
- **需求 2**：`column.buttons` 缺省时新增字段值渲染；显式配置的非空产物逐字不变。空组（缺省，或配置返回空数组/非数组）由「不绘制」改为「落占位文字」（表/列均无 placeholder 时仍为空），与 DOM 现状同口径——`/table-ex/` 列宽 section 的仅 field 按钮列（`demo/src/data/table-ex/main-view.vue:852`）将开始渲染 `buttons` 字段，属需求 2 的预期变化。全无效条目组（非空数组）双通道仍空，见接口 4。
- **需求 3**：min() cap 在行满/列满无操作；风险点为 fixed 区 pass 与 blankTail 线（已推演无操作/按需求截断）；`paintHeader` 末线 cap 同式（列满/滚动溢出时 `contentRightX >= stickyWidth` 无操作），表头背景仍整宽。R5 空白延伸区的行 hover 带与点击选中走 paintOverlay/interactions，与格线无关。
- **回滚**：按改动清单逆向编辑逐文件回退。**不得用 `git checkout` 回滚**——`button.js`、`link.js`、`list.js`、demo 等文件含未提交基线改动（decisions.md 约束：不回退既有改动）。
- **并行风险**：三片共享 demo 文件，实施串行（见实施步骤），无并行冲突。

## 测试计划

环境：rollup watch 常开，直访 `http://localhost:3000/table-ex-basic/`（不重复打包）；playwright mcp；canvas 内容截图辅助、像素探针（`evaluate` + `getImageData`）优先。像素探针坐标换算：画布物理尺寸 = CSS × dpr（`use-relayout.js:34-38`），绘制 `ctx.setTransform(dpr…)`（`painter.js:249-251`），故 `getImageData` 用 `cssX × canvas.width / canvas.clientWidth`（本机 dpr 常为 2），直接按 CSS 坐标取样会读错像素。

| 验收标准 | 片 | 手段 | 检查方式 |
|---|---|---|---|
| 需1-1 link:true hover 下划线 + pointer，移出消失 | 片1 | 浏览器 | 列类型表「链接文本」列：hover 单元格文字，截图对比出现 1px 下划线且文本变 hover 谱系色（`primary` 有 `--mu-primary-color-4` 层，`theme.js:93-101`）；`evaluate` 断言 `.mu-table-ex__sticky` 的 `style.cursor === 'pointer'`（光标样式绑在 sticky 壳而非 canvas，`table-ex.vue:16-17,415-417`）；移出后截图复比对、cursor 复位 |
| 需1-2 点击仍 cell-click，payload 不变 | 片1 | 浏览器 | 点击链接文本单元格，日志行记录 `cell-click` payload 含 `{ record, recordIndex, column }` 且无 `cell-item-click` |
| 需1-3 未配 link / link:false 无下划线、光标不变 | 片1 | 浏览器 | hover「文本」「映射」列（未配 link）：截图无下划线、cursor 非 pointer |
| 需1-4 DOM 通道不受影响 | 终验 | 浏览器 | 访问 `/table/`：text.link 三列（`table/main-view.vue:330-332`）渲染与 hover 下划线现状不变 |
| 需2-1 字符串数组渲染按钮 | 片2 | 浏览器 | 「按钮(field)」列行1（`['编辑','删除','复制']`）：三个 pill 按钮，caption 为各字段值（截图） |
| 需2-2 单字符串渲染单按钮 | 片2 | 浏览器 | 同列行2（`'查看'`）：单个按钮 |
| 需2-3 对象数组 caption/icon/color/disabled 生效 | 片2 | 浏览器 | 「按钮(field 对象)」列行1（`{caption,color}` / `{icon:'clock'}` / `{caption,disabled}`）：文本/图标/色/置灰各自可见（截图） |
| 需2-4 已配置 column.buttons 回归 | 片2 | 浏览器 | 既有「按钮」列（现改 `(record, value) => value`）：行1 渲染 `编辑`（缺省色）+ `删除`（red），行2 渲染 `详情`（indigo），与 `typeRecords.buttons` 值一致且无缺条 |
| 需2-5 buttons 函数收到 (record, value) | 片2 | 浏览器 | 「按钮」列以 value 渲染出按钮即证明第二参生效（若未传 value 则该列恒空） |
| 需2-6 空值/null 落占位 | 片2 | 浏览器 | 「按钮(field)」列行3（`actions: null`）：无按钮，显示占位 `--`（列配 `placeholder: '--'`） |
| 需3-a 行少：垂直格线止于末行底部 | 片3 | 浏览器 | 格线截断表（3 行 × 320px 高）：`evaluate` 像素探针——末行底部以下、列线 x 处取样为背景色（以相邻真实格线像素为参照）；截图辅助 |
| 需3-b 列少：水平格线止于末列右侧（含表头底边框） | 片3 | 浏览器 | 同表（3 窄列，列宽和 < 容器宽）：末列右缘以右、体行线 y 处取样为背景色；末列右缘以右、表头底边框 y（headHeight−1）处取样为背景色（已裁定计入截断，`decisions.md`）；表头背景仍整宽（表头中部 y、末列右缘以右取样为表头背景色）；末列右缘线本身仍存在 |
| 需3-c 行满/列满铺满容器不回归 | 片3 | 浏览器 | 基础用法表（200 行、flex 列铺满）：行线延伸至容器右缘、列线延伸至容器底缘（像素探针取样为格线色）；`/table-ex/` 自检页无报错 |
| 编译检查 | 终验 | 命令 | `npm run build` 通过 |

demo 夹具（片1/片2 落列类型 section，片3 新增 section）：

- `typeRecords` 增加：`site: 'mussel.site'`（两行）；`actions: ['编辑','删除','复制']`（行1）、`'查看'`（行2）、`null`（行3，需补一条记录）；`actionObjs: [{ caption: '保存', color: 'green' }, { icon: 'clock' }, { caption: '锁定', disabled: true }]`（行1）。
- `typeColumns` 增加：`{ caption: '链接文本', field: 'site', link: true, width: 120 }`、`{ caption: '链接文本(色)', field: 'site', link: true, color: 'teal', width: 130 }`、`{ caption: '按钮(field)', field: 'actions', type: 'button', width: 160, placeholder: '--' }`、`{ caption: '按钮(field 对象)', field: 'actionObjs', type: 'button', width: 180 }`；既有「按钮」列 `buttons` 改 `(record, value) => value`。
- 列类型表挂 `@cell-click` / `@cell-item-click` 日志（`ref` + `.ex-basic__tip` 行）。
- 新 section「格线截断（行少 / 列少）」：`sparseColumns` 3 定宽列（约 90/110/90）、`sparseRecords` 3 行、`style="height: 320px"`、`wide`。

## 实施步骤

三片共享 demo 文件（`table-ex-basic/main-view.vue`），**串行实施，不标并行组**。每片行为判据可独立在 demo 页观察。

**片1（需求 1，text link 悬停）** — 依赖：无

1. `text.js`：dom=false 产物加 `link: isLink || null`。文件：`column-types/text.js`。
2. `cell-text.js`：`drawTextValue` 加 `underline` 选项（单/多行逐行下划线）与文本块矩形返回值。文件：`ex/cell-paint/cell-text.js`。
3. `cell-painters.js`：`drawDisplayText` 参数追加 `hoverItem, onItemRect`，实现 link 分支（取色 / 下划线 / 命中回报）；`drawCell` 调用点透传两参（含 `drawContentItems` 后的 `drawDisplayText` 调用，`cell-painters.js:103-106`）。文件：`ex/cell-paint/cell-painters.js`。
4. demo：列类型段加链接文本列与数据、cell-click / cell-item-click 日志。
   - 完成判据：demo「链接文本」列 hover 出下划线 + pointer，移出消失；点击仅日志 cell-click 且 payload 含 record/recordIndex/column；「文本」列 hover 无变化。对应验收：需1-1/2/3。

**片2（需求 2，button 字段值渲染）** — 依赖：无（与片1 无文件交集，因 demo 共享仍串行）

1. `button.js`：`valueToButtons` + `ensureFn(column.buttons || valueToButtons)` + `getButtons(record, value)`；`!Array.isArray(buttons) || !buttons.length → return` 上提至 `!dom` / `dom` 分支之前（canvas 空组改落占位链）；文件头与 `:81-82` 注释同步。文件：`column-types/button.js`。
2. demo：field 按钮列 ×2、数据（字符串数组/单字符串/对象数组/null）、既有按钮列改 `(record, value) => value`。
   - 完成判据：四种字段值形态按需2-1/2/3/6 渲染（`actions: null` 行 canvas 落列级占位 `--`；DOM 同口径见 `base/table-row.vue:33`，本 demo 无 DOM 夹具）；既有按钮列渲染不变（需2-4/5）。

**片3（需求 3，格线截断）** — 依赖：无（同上串行）

1. `paint-gridlines.js`：`paintGridlines` 计算 `contentRightX` cap 行线 W；`paintColGridlines` 计算 `contentBottomY` 替换整线/分段路径的 `stickyHeight`（rowCount > 0 门控）。文件：`ex/table-paint/paint-gridlines.js`。
2. `paint-header.js`：`paintHeader` 末线宽度 cap 至 `contentRightX`（同式计算；表头背景仍整宽）。文件：`ex/table-paint/paint-header.js`。
3. demo：新增「格线截断」section。
   - 完成判据：行少表垂直格线止于末行底部、水平格线（含表头底边框）止于末列右侧，表头背景仍整宽；基础用法表格线铺满不变。对应验收：需3-a/b/c。

**终验** — 依赖：片1、片2、片3

1. 测试计划全表 playwright 过一遍（含 `/table/`、`/table-ex/` 回归）；2. `npm run build` 通过。
   - 完成判据：表内全部条目通过。

## 未解问题

1. **需求 3 空表口径**（已裁定维持现状，`decisions.md`，无需再议，仅留记录）：0 行时垂直格线保留全高（`rowCount > 0` 门控）——00-task 验收只判「行少/列少」「行满/列满」两态，空表不在判据内。若后续改按字面口径（行高之和 0 < 容器高 ⇒ 应截断），去掉门控后 `contentBottomY = headHeight + totalHeight - scrollTop` 在 0 行时等于 `headHeight`（表体无列线，与 DOM 无 td 行一致，`base/table-row.vue` 无 body 边框）。
2. **需求 1 hover 色谱系回退差异**（已按默认执行，仅留记录）：未知色名 + link 的常驻色从 textColor 回退变为 primary 谱系回退（对齐条目链路的必然结果，需求明示对齐 `linkTextColorOf` 口径）；已知色名/缺省 primary 无差异。不需决策。

已裁决记录：异议 1（表头底边框计入需求 3-b，`paintHeader` 末线 cap 至 `contentRightX`、表头背景仍整宽）— 用户裁定采纳 amender 建议修法 a，见 `decisions.md`；已落入方案概述 §3、改动清单、接口 5、风险与回滚、测试计划需3-b、实施步骤片3。
