# 设计 — table-ex

任务：`agent-docs/plans/20261023-table-ex/00-task.md`。探索报告：`01-explore.md`。决策：`decisions.md`（仅流程开关，无技术约束）。

## 方案概述

新增组件 `MuTableEx`（内部名 `MusselTableEx`）：单 canvas 分区绘制 + 原生滚动容器（sticky canvas + 尺寸撑高 spacer）承载虚拟滚动，DOM 只负责边框/滚动条/编辑浮层/空态。视觉与 API 对齐现有 `MuTable`；颜色/字体/尺寸全部经隐藏探针元素从 `--mu-*` 计算样式读取，MutationObserver 感知暗色切换；单元格编辑以组件模板内的 Vue 浮层挂载 mussel 输入组件（`MuInput`/`MuSelect`/`MuDateInput`/`MuSwitch`）；列头支持拖拽调宽与展示型排序（沿用 `header-click` 语义，新增 `update:order-by` 便捷事件）。

### 验收标准对照索引

| # | 验收标准 | 对应章节 |
|---|---------|---------|
| A1 | 完整组件 API + 与现有 table 逐项对照 | [接口 / API](#接口--数据结构) |
| A2 | canvas 渲染架构：图层/DOM 边界/DPR/尺寸响应 | [渲染架构](#a2-渲染架构图层划分dom-职责边界dpr-与尺寸响应) |
| A3 | 虚拟滚动：窗口计算/滚动事件/按需重绘 | [虚拟滚动与重绘范围](#a3-虚拟滚动与重绘范围) |
| A4 | 列定义结构与映射差异 | [列定义结构](#a4-列定义结构) |
| A5 | 列头拖拽调宽与排序交互 | [列头交互](#a5-列头交互命中检测调宽排序) |
| A6 | 单元格编辑：Vue 浮层/生命周期/数据流/校验/只读控制 | [单元格编辑](#a6-单元格编辑) |
| A7 | 样式方案：--mu-* 取值/暗色感知/视觉规格 | [样式与主题](#a7-样式与主题) |
| A8 | 文件结构与模块划分 | [文件结构](#a8-文件结构) |
| A9 | 范围边界 | [范围边界（本期不支持）](#a9-范围边界本期不支持) |
| — | 改动清单 / 备选 / 风险 / 测试 / 步骤 | 见下文各节 |

## 遵循约定与复用

提取自探索报告（`01-explore.md` 两节"现有约定"），并经本次源码核对：

- 命名：注册名 `MuTableEx` / `<mu-table-ex>`，内部名 `MusselTableEx`（`defineOptions`）；CSS BEM `mu-table-ex__*`，修饰符 `--gridlines-*` 等（对齐 `table.scss`）。
- 文件结构：`src/components/table-ex/` 下 `table-ex.vue + table-ex.scss（就近 import）+ index.js`，在 `src/components/index.js` 注册（现有单组件注册先例：`MuTable` 直接 import 后经 `_install({ MuTags, MuBadge, MuTable, ... })`，`src/components/index.js:18-58`）。
- 代码：纯 JS、`<script setup>` Composition API、ref/computed + props/emit、`throttle-debounce` 包（table.vue 已用）。
- 复用（跨组件 import，路径已核对存在）：
  - `../table/utils.js` 的 `ensureFn / getPixelNumber / getCellAlignClass`
  - `../table/column-types/index.js` 的 `resolveColumnType`（复用类型注册表与用户自定义列类型对象，取得 `align/width` 缺省）
  - `@/utils/key-builder` 的 `autoIncrementKeyBuilder`（records/columns 无 key 时生成稳定 key）
  - `v-mu-scrollbar` 指令（`./scrollbar/directive.js`）——滚动容器皮肤，table.vue 同款用法
  - 全局 `sizechange` 事件（`src/events/resize.js`，ResizeObserver 驱动）——容器尺寸变化感知
  - CSS 变量 JS 读取先例：`getComputedStyle(el).getPropertyValue('--mu-menu-item_height')`（`menu.vue:128`）
- z-index 变量清单（已补读 `src/styles/root.scss:127-132` 核对）：`--mu-z-index-float: 1`（兼容保留）、`--mu-z-index-above: 1`、`--mu-z-index-layer: 10`、`--mu-z-index-modal: 100`、`--mu-z-index-popup: 1000`、`--mu-z-index-ontop: 10000`。本组件内部只用 `--mu-z-index-above`（浮层压过 canvas）；输入组件下拉面板自身 Teleport 到 body 且带 `--mu-z-index-popup`（`dropdown-panel.scss:3`），无需干预。

## 改动清单（含新增或修改的测试文件）

| 文件 | 改动 | 原因 |
|------|------|------|
| `src/components/table-ex/table-ex.vue` | 新增 | 组件壳：模板（滚动容器/canvas/sticky 层/编辑浮层/空态/阴影）、props/events/组合各模块 |
| `src/components/table-ex/table-ex.scss` | 新增 | BEM 样式 + 局部尺寸变量（`--row-height` 等，镜像 `table.scss:2-15`） |
| `src/components/table-ex/index.js` | 新增 | 组件导出 |
| `src/components/table-ex/theme.js` | 新增 | `--mu-*` 探针读取、暗色切换 MutationObserver、缓存与 `withAlpha` |
| `src/components/table-ex/layout.js` | 新增 | 列宽解析/前缀和、可视窗口计算、命中检测（行/列/调宽手柄） |
| `src/components/table-ex/cell-painters.js` | 新增 | 各列类型 canvas 单元格绘制适配器 |
| `src/components/table-ex/painter.js` | 新增 | 绘制管线：分区顺序、网格线、表头、固定列、覆盖层、文本测量缓存 |
| `src/components/table-ex/editor.js` | 新增 | 编辑状态机：打开/提交/取消/定位/校验/编辑器组件解析 |
| `src/components/table-ex/interactions.js` | 新增 | 指针交互：hover、选中、排序点击、列宽拖拽、check 点击 |
| `src/components/index.js` | 修改 | import 并注册 `MuTableEx`（共享文件 → 集成步骤） |
| `demo/src/data/table-ex/main-view.vue` + `main.js` | 新增 | 验证页（测试计划全表断言的夹具来源，逐项列出）：10 万行数据生成器 + 事件日志区 + 调试面板（自检结果区 / 重绘计数与 lastPaint 统计 / 主题快照打印）；数据与状态夹具——空态开关（records=[] / `empty` 插槽 / `emptyText` 三变体）、容器尺寸拖拽手柄（右下角改容器 width/height）、`fixedLeftColumns` 输入框、`editable` 开关（含 false 变体）、validate 列（editor.validate 返回错误文案）、`recordsVersion` 异步按钮（模拟延迟就地改 record 后递增）、`--row-height` 覆盖开关（容器 class 内联覆盖）与根字号覆盖、`mu-dark` 挂组件根变体开关、`scrollToRecord(key)` 输入框+按钮、`refreshTheme` 按钮；`window.__tableEx = 组件实例`（A1/A2 断言经 `browser_evaluate` 调用方法与 getLayoutInfo） |
| `demo/src/data/table-ex/self-checks/`（`index.js` + 按模块一文件） | 新增 | demo 自检断言：G0 建骨架（各模块占位空文件），G1/G2 各步填充对应模块断言（保证各步文件集合不相交、可并行） |
| `demo/src/catalog.js` | 修改 | `data` 分类登记 `data/table-ex` 页（增删页面需重启 demo:build；G0 即登记，见实施步骤） |
| `skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/` | 修改（延后） | 组件 API 文档同步。按项目 AGENTS.md"完成代码实现后，未经用户确认，不更新文档"，列为实施后经用户确认的独立步骤，不在本流水线 |

无测试框架（package.json 无 test script）；测试文件即 demo 验证页，见测试计划。

## 接口 / 数据结构

### A1. API（与现有 mussel table 逐项对照）

组件：`MuTableEx` / `<mu-table-ex>`，`defineOptions({ name: 'MusselTableEx' })`。

#### props 对照

| prop | 类型/默认 | 与现有 table 对照 |
|------|----------|------------------|
| `keyField` | `String` | 相同 |
| `records` | `Array, () => []` | 相同；引用变化时滚动复位到顶部（table.vue:358-366 同款 watch） |
| `columns` | `Array, () => []` | 结构见 [列定义结构](#a4-列定义结构)；新增 `editable/resizable/editor` 三字段，其余字段沿用 |
| `selectedRecord` | `Object` | 相同 |
| `selectedRecordKey` | `[String, Number]` | 相同 |
| `headerChecked` | `Object` | 相同（check 列表头 ✓ 图形改由 canvas 绘制） |
| `orderBy` | `String`，`'field:asc'` 格式 | 相同（`table.vue:144-153` 同款解析） |
| `recordsOffset` | `Number, 0` | 相同（rec_no 列起始序号） |
| `fixedLeftColumns` | `Number` | 语义相同；实现从 `position: sticky` 改为 canvas 固定区重绘 |
| `gridlines` | `'none'|'all'|'row'|'column'`，默认 `all` | 相同（canvas 画线，颜色 `--mu-border-color-soft`） |
| `hoverMode` | `'none'|'row'|'column'|'cross'|'cell'`，默认 `row` | 相同；实现从 DOM 指示条改为 canvas 覆盖层绘制 |
| `striped` | `Boolean` | 相同（`--mu-bg-stripe` 交替行底） |
| `placeholder` | `String` | 相同（空单元格占位文本的表格级缺省：`col.placeholder ??= props.placeholder`，table.vue:195 同款；canvas 对空值格绘制占位文本，非空态文案） |
| `emptyText` | `String, ''` | **新增**：空态文案。现有 table 无空态文案节点（`mu-table--empty` 仅样式类，table.vue:129-141）；渲染优先级 `empty` 插槽 > `emptyText` |
| `recordsVersion` | `Number, 0` | **新增**：数据版本号，递增即整幅重绘。父级异步就地修改 records 后的通知通道（见 A3 数据契约；组件不做 deep watch） |
| `editable` | `Boolean, false` | **新增**：表格级可编辑总开关 |
| `resizable` | `Boolean, false` | **新增**：表格级列宽拖拽总开关（现有 table 无调宽能力） |

#### events 对照

| event | payload | 与现有 table 对照 |
|-------|---------|------------------|
| `header-click` | `column`（原始列定义对象） | 相同：除 check ✓ 表头外的所有表头点击均 emit（`th @click` 无条件派发，table.vue:20、:336-338 同款，不限定可排序列）；点击排序图标区域同样触发。**check ✓ 表头只发 `update:header-checked` 不发本事件**（对齐 table.vue:25 `@click.stop` 的既有行为） |
| `cell-click` | `{ record, recordIndex, column }` | 相同。**check 列点击同样触发**：emit `update:cell-value` 后继续执行单元格点击流程（选中 + `cell-click`，对齐 check.js click 不 stopPropagation + td `@click` 冒泡行为，check.js:20-25、table-row.vue:11、table.vue:344-356 已核对）；disabled check 仅跳过翻转 emit，选中与 `cell-click` 照发（DOM 版 `[disabled]` 仅 `pointer-events: none`，点击仍命中 td，style.scss:29-33） |
| `update:header-checked` | `(column, value)` | 相同（check 列表头点击） |
| `update:cell-value` | `{ record, recordIndex, column, value }` | 语义扩展：check 列点击翻转（现有能力）与编辑器提交（新增）共用此事件，命名沿用现有风格。emit 后组件在 `nextTick` 主动重绘该行——父级在事件处理器内就地修改 `record[field]`（`demo/src/data/table-advanced/main-view.vue:197-204` 现有用法）即刻可见，见 A3 数据契约 |
| `update:selected-record` | `record` | 相同 |
| `update:selected-record-key` | `key` | 相同 |
| `update:order-by` | `String`（如 `'name:desc'`，清空为 `''`） | **新增**：点击可排序列时按 `无 → asc → desc → 无` 循环计算下一状态并 emit，父级 `v-model:order-by` 即可获得完整排序交互；`header-click` 仍照发保持兼容。排序仍为展示型（父级执行实际排序），与现有 table 语义一致 |
| `column-resize` | `{ column, width }` | **新增**：列宽拖拽结束（mouseup）时 emit |
| `cell-item-click` | — | **不支持**（见范围边界：link/tag 项点击） |

#### 方法（`defineExpose`；现有 table 无方法暴露，此为新增能力）

| 方法 | 说明 |
|------|------|
| `scrollToRecord(keyOrIndex)` | 滚动到指定记录（keyField 值或行号），不可见时置于视口顶部 |
| `refreshTheme()` | 手动重读 `--mu-*` 变量并 `relayout()` + 整幅重绘（暗色切换感知的兜底 API；尺寸类变量如 `--row-height` 覆盖后也经此通道重算布局） |
| `getLayoutInfo()` | 只读布局快照 `{ colWidths: Number[], contentWidth, contentHeight, rowHeight, headHeight, viewRows: {start, end, count}, lastPaint: { rowStart, rowEnd, rowCount, elapsed } }`（测试与调试用，见测试计划 A2/A3/A4；`lastPaint` 由 painter 每次绘制后更新，为"仅绘制可视区行"的验收断言来源） |

#### 插槽

| 插槽 | 说明 |
|------|------|
| `empty` | 空态自定义内容（现有 table 无插槽）。空态文案优先级：`empty` 插槽 > `emptyText` prop；`placeholder` 不用于空态，保持其现有"空单元格占位文本"语义 |

### A4. 列定义结构

沿用现有字段（`table.vue:159-203` 已核对）：`field / caption / type / width / minWidth / maxWidth / align / sortable / text / value / title / class / style / placeholder` 及类型专属字段（`mappings / format / formatOption / links / tags / disabled / headerCheckbox` 等）。新增三字段：

```js
{
  field: 'name',
  caption: '名称',
  type: 'text',            // 沿用 resolveColumnType 注册表（含自定义类型对象）
  width: 160, minWidth: 80, maxWidth: 400,   // 沿用；width 支持 number | '50px'
  align: 'left', sortable: true,             // 沿用

  editable: true,          // 新增：列级只读控制。缺省继承表格级 editable；false 强制只读
  resizable: false,        // 新增：列级禁用调宽（表格级 resizable 开启时生效）
  editor: true | {         // 新增：编辑器配置；缺省（undefined）= 该列不可编辑
    type: 'input',         //   'input' | 'select' | 'date' | 'switch'，缺省按 column.type 映射：
                           //   text/number/currency→input、enum→select、date/datetime→date、bool→switch
    props: { ... },        //   透传给对应 mussel 组件的 props（如 options、placeholder、clearable）
    validate: (value, { record, column }) => true | '错误文案'   // 可选
  }
}
```

**与现有 table 列定义的映射与差异**：

- **取值与渲染管线（复用现有列类型体系，非重新实现）**：文本类语义完全兼容——既有列定义原样传入即可得到与现有 table 一致的单元格文本。实现方式与 `table.vue` 同款（`table.vue:164-178` 已核对）：列准备阶段对每列 `resolveColumnType(col.type)`（字符串查注册表，**对象/函数直接用作自定义类型**，index.js:32-34），`render = type.compile ? type.compile(col) : (type.render || type)`，并构建 `ensureFn` 化的 `_text/_value`（`table.vue:170-171` 同款，**`value` 同样 ensureFn**——文档允许 String|Function，字面调用会抛错）。单元格取值链逐行对齐 `table-row.vue:44-69`：
  1. `col._text(record)` 返回非 null → 直接作为显示文本（跳过类型渲染）；
  2. 否则 `value = col._value(record) ?? record[col.field]`；
  3. 调 `render({ record, recordNumber, value, emit })`，canvas 落地规则（`table-row.vue` 的 items/text 渲染在 canvas 的等价物）：
     - 返回 `text` → 按列 align 绘制文本。**内置类型 number/currency（Intl.NumberFormat）、date/datetime（formatter+format）、enum（mapping 取 `text`，enum.js:18）、bool（mappings 是/否/null）、rec_no（`render({ recordNumber })`，record-number.js:4，`recordNumber = recordsOffset + index + 1`，table.vue:40 同款）与自定义列类型返回 text 的全部天然覆盖**；
     - 返回 `items` → 按条目 `is` 落地：check（`div`+`✓`）画 ✓ 方框，`attrs.disabled`（ensureFn，check.js:16）置灰且点击不翻转；link（`a`）以 `--mu-primary-color` 绘制各条目 `text`；tag（`span.mu-tag`）绘制灰底 pill（底 `--mu-gray-translucent`、边框 `--mu-border-color-normal`）+ 文本；img（`attrs.src`）异步 Image 绘制（`crossOrigin='anonymous'`，见风险表）；
     - 返回的 `class/style/title` 为 DOM 通道字段，canvas 忽略。
  不支持子集见范围边界 #12（mapping 样式、tag/link 视觉变体等）。
- 差异 ①：`width` 缺省列的宽度算法——现有 table 靠 `table-layout: fixed` 平分剩余空间；table-ex 由 `layout.js` 统一求解（见 A3 宽度求解），考虑 `minWidth/maxWidth` 约束。
- 差异 ②：`class / style / headerClass / headerStyle / title` 为 DOM 通道字段，canvas 单元格绘制不消费（不报错、静默忽略）；`title` 悬浮提示本期不支持（范围边界）。
- 差异 ③：`multiline / lineClamp` 依赖 DOM 多行截断，canvas 等高行模型下单行省略，本期忽略该配置（范围边界）。

### A2. 渲染架构（图层划分、DOM 职责边界、DPR 与尺寸响应）

#### DOM 骨架

```
div.mu-table-ex                 ← 根：外框 1px var(--mu-border-color-normal)、圆角、position:relative
  div.mu-table-ex__scroll       ← 原生滚动容器：overflow:auto + v-mu-scrollbar（mussel 滚动条皮肤）
    div.mu-scrollbar__tracks        ← v-mu-scrollbar attach 注入（scrollbar.js:105 insertBefore(tracks, el.firstChild)）；
                                      position:sticky !important、0 尺寸（scrollbar.scss:19-31），不参与滚动几何
    div.mu-table-ex__sticky     ← 除注入 tracks 外的第一个子元素（静态位置=内容顶部，sticky 才能钉住视口）
      canvas.mu-table-ex__canvas
      div.mu-table-ex__overlay  ← absolute inset:0; z-index:var(--mu-z-index-above)；编辑浮层/空态/阴影挂这层
        div.mu-table-ex__editor       （编辑时存在，见 A6）
        div.mu-table-ex__empty        （records 为空时存在）
        div.mu-table-ex__header-shadow / __bottom-shadow（y-scrolled/y-overflowed 类控制 box-shadow，复用 table.scss 投影方案）
    div.mu-table-ex__spacer     ← __sticky 之后的流内兄弟，撑出剩余滚动范围
```

- 滚动几何：`__sticky` 是滚动容器内**除 `v-mu-scrollbar` 注入的 `.mu-scrollbar__tracks` 外的第一个流内子元素**（实际 DOM 顺序 `[.mu-scrollbar__tracks, __sticky, __spacer]`；tracks 为 0 尺寸 sticky 元素，`__sticky` 静态位置仍在内容顶部；`position: sticky; top: 0; left: 0` 双轴钉住视口），`width/height = 容器 clientWidth/Height`；`__spacer` 是其后的流内兄弟，`width = max(列总宽, clientWidth)`，`height = max(0, 内容总高（表头高 + 行数×行高） − 容器视口高)`（clamp 0，records 少于视口时不产生负值）。两元素高度相加 = 内容总高，scrollTop 滚动范围恰为 `表头高 + 总行高 − 视口高`，canvas 视口原点恒对应数据坐标 `(scrollLeft, scrollTop)`。滚轮/触控板/键盘/拖滚动条全部走原生滚动（kaka `Scrollable.ts:9-16` 同结论），无需自实现。
- canvas 与 DOM 职责边界：

| 职责 | 承载 |
|------|------|
| 外框、圆角、行高/内边距等可覆盖变量 | DOM（scss） |
| 滚动条、滚动交互 | DOM（原生 + v-mu-scrollbar） |
| 表头/表体单元格内容、网格线、斑马纹、hover、选中底色、排序图标、check 图形、固定列分隔 | canvas |
| 表头投影/底部投影 | DOM 阴影条（box-shadow 变量无法进 canvas，用 DOM 保变量纯度） |
| 单元格编辑、空态 | DOM 浮层 |

#### 图层划分（单 canvas，绘制顺序分区，非多 canvas）

采用 kaka 验证过的"单 canvas + 绘制顺序层"（`Layers.ts`、`RenderPipeline.ts` 模式）：

1. **表体滚动区**：可视行 × 可视列（不含固定列区域），逐格背景→内容
2. **网格线**：按 `gridlines` 画横/竖线
3. **固定左列区**：从最左到 `fixedLeftColumns` 宽度，整高不透明重绘（盖住滚过的表体），`x-scrolled` 时右侧画 `1px var(--mu-border-color-strong)` 分隔（对齐 `table.scss:136-138`）
4. **表头区**：整宽不透明重绘（`--mu-bg-fill` 底、caption、排序图标、check 表头），盖住下方所有层
5. **覆盖层**：hover 高亮（`--mu-gray-translucent`，按 hoverMode 画行/列/交叉/单元格矩形）、调宽拖拽参考线（1px `--mu-primary-color`）

选中行底色（`--mu-primary-faint`）与斑马纹（`--mu-bg-stripe`）在步骤 1/3 画格背景时直接取值，不做覆盖层。

#### DPR 适配（决策：标准直乘，拒绝属性劫持）

```js
// resize/dpr 变化时
const dpr = window.devicePixelRatio || 1
canvas.width = Math.round(cssW * dpr)      // cssW/cssH = 滚动容器 clientWidth/Height
canvas.height = Math.round(cssH * dpr)
canvas.style.width = cssW + 'px'
canvas.style.height = cssH + 'px'
// 每次绘制前统一设置，不依赖累积 scale
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
```

不采用 kaka `hiDPI.ts` 的 width/height 属性劫持（monkey-patch 侵入 `getAttribute/setAttribute/drawImage`，与本组件内 ctx 直用的心智模型冲突）；标准直乘仅 4 行，且 `ctx.setTransform` 每帧重置避免累积误差。dpr 在每次尺寸响应时重读（外接屏迁移通常伴随 window resize → 容器 sizechange）。

#### 尺寸响应与 relayout()（统一布局重算入口）

`relayout()`（layout.js）是唯一的布局重算入口，顺序固定：

```
relayout():
  1. 重读探针尺寸变量（rowHeight / headHeight / cellPadding / cellLineHeight，覆盖 --row-height 等后经此通道生效）
  2. 重读容器 clientWidth/Height → 同步 __sticky 尺寸
  3. 列宽求解（含 minWidth/maxWidth，见 A3 宽度求解）→ 更新 colLefts[] 前缀和与列总宽
  4. 同步 spacer 宽高（width = max(列总宽, clientWidth)；height = max(0, 内容总高 − 视口高)）
  5. 重算可视窗口（rowStart/rowEnd/colStart/colEnd）
调用方随后统一整幅重绘
```

触发点（全部经 relayout，不再各自为政）：

- 容器挂 `@sizechange`（mussel 全局事件，`src/events/resize.js`），throttle 100ms（对齐 table.vue `onResize`）：relayout → 重设 canvas 物理尺寸（DPR 直乘）→ 整幅重绘。**容器高度变化同样走此路径**——spacer 高度与可视窗口在 relayout 内重算。
- window `resize`：重读 devicePixelRatio，变化则 relayout → 重设 canvas 物理尺寸 → 整幅重绘（跨 DPI 迁移时容器 CSS 尺寸可能不变、sizechange 不触发）。
- 主题刷新（MutationObserver 回调与 `refreshTheme()`）：重读 snapshot → relayout → 整幅重绘（`--row-height` 等尺寸变量覆盖经此生效）。
- `watch(records)` 引用变化：滚动复位 → relayout → 整幅重绘。
- `watch(columns)` 引用变化：列准备（compile/render 构建）→ relayout → 整幅重绘。
- 列宽拖拽 up（A5）：emit `column-resize` → relayout → 整幅重绘。
- 首帧在 `onMounted` + `nextTick` 后执行一次 relayout + 绘制（canvas 需已入文档布局）。

### A3. 虚拟滚动与重绘范围

#### 窗口计算（layout.js）

- **等高行模型**：行高取 `.mu-table-ex` 上的 `--row-height`（探针解析为 px 数，缺省 36px，与 table.scss 一致）。行定位 O(1)：`rowIndex = floor((y - headH + scrollTop) / rowH)`——比 kaka 变高行的线性扫描（`HitTest.ts:66-75`）简化一个量级。变高行本期不支持（范围边界）。
- **列前缀和**：`layout.js` 维护 `colLefts[]`（每列左缘累计 x）与 `colsWidth`（总宽）；列宽变化（拖拽/容器 resize 重分配）时增量更新受影响下标之后的前缀和。
- **可视窗口**：

```js
rowStart = floor(scrollTop / rowH)
rowEnd   = min(rowCount, ceil((scrollTop + viewH) / rowH) + OVERSCAN)   // OVERSCAN = 2，模块内常量
colStart = 二分查找 colLefts：最后一个 left - scrollLeft <= 0 的列
colEnd   = 二分查找 colLefts：第一个 left - scrollLeft >= viewW 的列（固定列区域单独处理）
```

- **滚动事件处理**：`scroll` 事件 → 记录 pending → `requestAnimationFrame` 合帧（同帧多次 scroll 只绘一次，kaka `ScrollSync.ts:110-122` 结论）；rAF 回调里整幅重绘（约 20-30 行 × 可视列，成本可控）。
- **浏览器高度上限**：36px 行高下 ~90 万行内安全，本期不做 kaka 的比例压缩（`Scrollable.ts:141-153`）；范围边界声明上限。

#### 宽度求解（layout.js `solveWidths(containerW)`，统一算法）

```
1. 定宽列：width ?? type.width（resolveColumnType 缺省）经 getPixelNumber 取 px，
   clamp 到 [col.minWidth ?? 0, col.maxWidth ?? Infinity]
2. 未定宽列初始宽 w = clamp(80, col.minWidth ?? 80, col.maxWidth ?? Infinity)
   （80 为模块常量 COL_FALLBACK，未配 minWidth 时的下限）
3. remain = containerW − Σ定宽列
   remain > 0：均摊给未定宽列（各列 + remain/未定宽数）；摊入后逐列 clamp 到 maxWidth，
   被 clamp 消耗的宽度再摊给其余未定宽列，迭代至无 clamp 消耗或剩余列为空（上限 3 轮，未收敛列保持当前值）
   remain ≤ 0：保持步骤 2 宽度（总宽超出容器 → 横向滚动）
```

调用时机：仅经 `relayout()`（A2 触发点清单）与列宽拖拽 up（拖拽列此时已显式定宽，其余未定宽列重跑求解重新瓜分剩余空间，保持"未定宽列填满容器"的分配不变量；拖拽 move 中不重求解，避免其他列实时抖动）。

#### 按需重绘范围（脏区策略）

| 触发 | 重绘范围 |
|------|---------|
| 滚动 | 整幅（rAF 合帧） |
| hover 行/列变化 | 仅旧行+新行两条横带（列 hover 则两条竖带）：`ctx.save(); ctx.beginPath(); ctx.rect(...); ctx.clip()` 后走完整绘制流程，restore |
| 选中行变化 | 旧行 + 新行两条横带（选中底色在画格背景时取值） |
| 编辑提交 / check 点击（emit `update:cell-value`） | `nextTick` 后该行整行重绘（父级在事件处理器内同步就地修改 `record[field]` 的常见用法即刻可见，见下方数据契约）；painter 内部另备 `invalidateCell(row, col)` 供精细使用 |
| 列宽拖拽 move 中 | **该列左缘**至视口右端的竖带 + 表头整幅（每帧）。左界取该列左缘而非右缘：列宽变化同时影响该列内容截断与右侧所有列位置，取 `min(旧右缘, 新右缘)` 会在加宽时遗留 `[旧右缘, 新右缘]` 旧像素残影，取列左缘则一并覆盖该列重绘需求 |
| 渲染相关 props 变化 | watch → 对应重绘：`gridlines / hoverMode / striped / fixedLeftColumns / orderBy / selectedRecord / selectedRecordKey / recordsVersion` → 整幅；**`columns`（引用变化）→ 列准备 + relayout + 整幅**；**`headerChecked` → 表头区整幅**（受控 ✓ 状态变化即重绘，父级点击表头 ✓ 后立即可见）；**`recordsOffset` → 整幅**（rec_no 列文本变化）；**`placeholder` → 整幅**（空值格占位重绘）；**`keyField` → 选中 key 解析变化 → 旧/新选中行两条横带**。`columns` 为配置数据，仅 watch 引用变化不做 deep（与 records 同理，主流用法是引用替换） |
| 排序/records 替换/主题刷新/resize/dpr | 整幅（经 relayout，见 A2） |
| img 列图片异步加载完成 | 该单元格（`Image.onload` → invalidateCell，kaka 异步格绘制模式；`Image` 创建时设 `crossOrigin = 'anonymous'`，见风险表） |

#### 数据变更重绘契约（records 不做 deep watch）

10 万行级 records 的 deep watch 不可接受，组件不监听 record 内部字段。三条通道覆盖全部合法用法，A1 已同步标注：

1. **同步就地修改（默认支持）**：父级在 `update:cell-value` 等事件处理器内直接改 `record[field]`——组件 emit 后 `nextTick` 主动重绘该行，改动即刻可见。
2. **异步就地修改**：请求返回等延迟改动完成后，父级递增 `recordsVersion` → watch 触发整幅重绘。
3. **引用替换**：`watch(records)` 引用变化 → 滚动复位 + 更新 spacer 高度 + 整幅重绘。

性能措施（采纳 kaka 已验证的 P0，`docs/performance/optimization-recommendations.md`）：

- 完全可见的单元格跳过 `save/clip/restore`，仅视口边缘/固定区分界处的部分可见格才 clip（kaka 实测整屏重绘 -17.5%~-20%）。
- 文本测量缓存：`Map<text + '\u0000' + font, width>`，容量上限 2000 条，超限清空（LRU 过重不做）。
- **绘制统计 `lastPaint`**：painter 每次绘制结束写入 `{ rowStart, rowEnd, rowCount（实际绘制行数）, colStart, colEnd, elapsed }`，经 `getLayoutInfo().lastPaint` 与 demo 调试面板暴露——这是验收 #3"仅绘制可视区行、禁止一次绘制全部行"的机器可查证据（A3 断言 `rowCount ≤ 可视行数 + OVERSCAN`）。

不采纳：滚动位移 `drawImage` 自拷贝平移优化（见被拒绝的备选）。

### A5. 列头交互（命中检测、调宽、排序）

#### 命中检测（interactions.js，事件统一绑在 `__sticky` 层）

指针坐标 → 相对 canvas 的 `(x, y)`（`getBoundingClientRect` 差值换算，不用 `offsetX` 以防子元素干扰）：

```js
isHeader  = y < headH
colIndex  = 二分查找 colLefts：x + scrollLeft 落入的列（固定列区域直接线性查前 N 列）
rowIndex  = floor((y - headH + scrollTop) / rowH)
// 调宽手柄：isHeader 且距某列右缘 <= 4px（kaka offset=5 收紧为 4，触屏不分放开大）
resizeCol = resizable 启用时：col.right - x <= 4 ? colIndex : (x - col.left <= 4 ? colIndex - 1 : -1)
           命中列或其左邻列任一属于固定列区域（index < fixedLeftColumns，含分界两侧）或列 resizable === false 时返回 -1
           —— 固定列本期整体不可调宽（允许调宽需联动固定区宽度与滚动区列前缀和重排，无现有能力对齐负担，见范围边界 #6）
```

事件序列：

```
pointermove  → resizeCol >= 0 ? cursor = 'col-resize' : (sortable 列内 ? 'pointer' : 'default')
               行/列 hover 索引变化 → 脏带重绘（rAF）
pointerdown（表头手柄）→ 开始拖拽：绑 window 级 pointermove/pointerup（kaka BaseMouseDownMover 模式）
  move  → newWidth = clamp(pointerX - colLeft + scrollLeft, col.minWidth ?? 40, col.maxWidth ?? Infinity)
          更新前缀和 → 重绘"该列左缘至视口右端"竖带 + 表头整幅（左界=列左缘，防加宽残影，见 A3 重绘表）→ 画参考线（不 emit）
  up    → 解绑 → emit('column-resize', { column, width }) → relayout（拖拽列显式定宽，其余未定宽列重跑宽度求解，见 A3）→ 整幅重绘
  up 后的 click → 丢弃（拖拽误触抑制，kaka EventBinding.ts:360-366 模式：拖拽期间置 flag，click 时消费并清除）
click（表头任意列，非手柄区，非 check ✓ 表头）→ emit('header-click', column)——除 check ✓ 表头外均发（table.vue:20 无条件语义；check ✓ 表头对齐 table.vue:25 @click.stop 只发 update:header-checked）
          可排序列另按 orderBy 当前值计算 next（无→asc→desc→无）并 emit('update:order-by', next)
          排序图标方向由 orderBy prop 驱动（table.vue:144-153 同款解析），无本地排序状态
click（表体单元格）→ 选中该行（update:selected-record(-key)）+ emit('cell-click', {...})
click（check 列）→ disabled(record) 为真：跳过翻转 emit，仍继续单元格点击流程（选中 + cell-click）；
                   否则 emit('update:cell-value', { record, recordIndex, column, value: !value })（沿用 check.js 语义）
                   后**同样继续单元格点击流程**（选中 + cell-click，对齐 check.js click 无 stopPropagation + td 冒泡）→ nextTick 重绘该行
click（表头 check ✓）→ 仅 emit('update:header-checked', column, !checked)，不发 header-click
dblclick（可编辑单元格）→ 打开编辑器（A6）
```

排序图标（canvas 绘制，复刻 `icon/sort-icon.vue` 视觉）：caption 右侧留 18px，画上下两个小三角（path 形状同 SVG），激活方向填充 `--mu-primary-color`、非激活填充 `--mu-gray`；`sortable` 列 caption 区域 cursor: pointer。

### A6. 单元格编辑

#### 浮层挂载方式（决策：组件模板内渲染，非 createApp/单例 DOM）

编辑器是 `table-ex.vue` 模板的响应式片段，不是 kaka 的原生 `<input>` 单例 appendChild：

```html
<div class="mu-table-ex__editor" v-if="editing" :style="editing.style"
     tabindex="-1" @pointerdown.stop @click.stop @dblclick.stop
     @keydown.esc="editing.onEsc">
  <!-- 容器级 keydown.esc：switch 无自身 keydown 的专用路径（input/select/date 组件自身 esc 转发优先，容器级兜底不冲突：commit 幂等） -->
  <component
    :is="editing.component"        <!-- MuInput | MuSelect | MuDateInput | MuSwitch（form/index.js 导出名已核对） -->
    v-model="editing.value"
    :invalid="editing.invalid || null"
    v-bind="editing.props"         <!-- column.editor.props -->
    v-on="editing.events" />       <!-- 按类型合成，见下方提交矩阵：
                                       input → { keydown enter 提交, keydown esc 取消, blur 延迟兜底 }
                                       select/date → { keydown esc 取消, blur 延迟兜底 }（提交由值变化 watch 驱动）
                                       switch → {}（无 focus/blur/keydown 事件；esc 挂在上方容器，容器已 tabindex=-1） -->
</div>
```

理由：编辑器与表格同属一个 Vue 应用，模板内 `<component :is>` 天然获得响应式 props、v-model、暗色变量继承、组件自身弹层（MuSelect/MuDateInput 下拉 Teleport body + `--mu-z-index-popup`，天然压过 canvas）；无需独立 app 上下文、无需手动销毁。同一时刻至多编辑一格，单实例即可。`__editor` 定位 `absolute`，落在 `__overlay`（z-index `--mu-z-index-above`）内，压过 canvas。

事件隔离（两层，画布交互是 click 语义、仅拦 pointerdown 不够）：

- 浮层侧：`__editor` 拦截 `pointerdown / click / dblclick` 冒泡（画布监听在 `__sticky` 上）。
- 画布侧：editing 期间落在画布的 pointerdown 不屏蔽命中，而是**先同步 commit 再继续正常处理**——点击其他单元格一步完成"提交 + 选中新行"（kaka SELECTED_CELL 变化即提交的同款语义）。

#### 定位

`editing.style = { left, top, width, height }`（px，相对 `__overlay` 原点，即 canvas 视口原点）：

```js
left  = (colIndex < fixedCount ? colLefts[colIndex]                    // 固定列：不随滚动偏移
                             : colLefts[colIndex] - scrollLeft)
top   = headH + rowIndex * rowH - scrollTop
width = colWidth；height = rowH
```

编辑器控件自身尺寸必须随单元格填充（`.mu-input` 固定 `width: 200px; height: var(--height)=32px`，input.scss:12-13，不覆盖会溢出单元格并拦截相邻格点击），`table-ex.scss` 补：

```scss
.mu-table-ex__editor {
  display: flex;            // switch 等小控件垂直居中，不强制拉伸
  align-items: center;
  overflow: hidden;         // 控件意外溢出不外泄

  > .mu-input {             // MuInput 根；MuSelect/MuDateInput 根为 combo-wrapper，同为 .mu-input（combo-wrapper.vue:4）
    width: 100%;
    height: 100%;
  }
}
```

#### 生命周期与数据流

```
打开：dblclick 可编辑格 → 解析只读规则（见下）→ 编辑器解析（column.editor 配置）
      → editing.value = 当前显示值（经 column.value 取值，非格式化文本）
      → input/select/date：ref 查询内部真实 input 元素（combo-wrapper.vue:12），setTimeout 0 后 .focus()
      → switch：聚焦 __editor 容器（tabindex=-1），承接 keydown.esc
提交（分类型矩阵——MuSwitch 根是普通 div 无 focus/blur/keydown 事件（switch.vue:2）；MuSelect/MuDateInput
      点下拉项时序是 input 先 blur 再 click（下拉项未阻止 mousedown 默认行为，dropdown-item.vue:2），
      故 blur 不能是唯一提交源）：
  input  ：Enter（input.js:69 转发）/ 画布 pointerdown（同步）/ 容器滚动 / blur 延迟兜底
  select ：值变化（v-model watch，选中下拉项即提交）/ 画布 pointerdown / 滚动 / blur 延迟兜底
  date   ：值变化 / 画布 pointerdown / 滚动 / blur 延迟兜底
  switch ：值变化（click 切换即提交）/ 画布 pointerdown / 滚动
  blur 延迟兜底 = blur 后 setTimeout 0（宏任务），届时同时满足三条才提交：
    ① editing 仍在；② 焦点不在 __editor 内；
    ③ 焦点不在下拉面板内——MuSelect/MuDateInput 面板 Teleport 到 body（dropdown-panel.vue:2），
       不在 __editor 子树，判定 `document.activeElement?.closest('.mu-dropdown-panel')`（面板根统一 class
       `mu-dropdown-panel`，dropdown-panel.vue:8）。日期面板点月份切换按钮（date-input.vue:14-23 的
       mu-button/mu-icon-button）后焦点落在面板内 → 不满足 ③ → 不提交、编辑器保持，月份导航与继续选日可用。
  点下拉项的时序：blur（延迟任务排队）→ click 选项 → model 更新 → watch（微任务，先于宏任务）提交并清空
  editing → 延迟任务发现 editing 已空直接跳过。commit 幂等（editing 已清空则 no-op），双通道不会重复 emit。
  提交时 validate（若配置）通过 → emit('update:cell-value', { record, recordIndex, column, value }) → 关闭
  → nextTick 主动重绘该行（父级同步就地修改 record 即刻可见，见 A3 数据契约；组件不直接改数据，
  与现有 check 列语义一致）
取消：Esc（input/select/date：组件转发 esc，input.js:70；switch：__editor 容器 keydown）→ 直接关闭，不发事件
校验失败：editing.invalid = true（透传 mussel 组件 invalid 态）+ title 显示错误文案，不关闭、不失焦
滚动即提交：与 kaka 一致（SELECTED_CELL/SCROLL 均提交，InlineInputEditor.ts:113-124）——浮层随滚动位移会漂出单元格，跟随重定位成本高于收益，且 kaka 已验证该交互可接受
```

#### 只读控制（表格级与列级）

```js
cellEditable = props.editable !== false              // 表格级总开关（缺省 false）
  && column.editable !== false                       // 列级 false 强制只读
  && column.editor != null                           // 必须配置 editor（true 或对象）
  && column.type 不在 ['rec_no', 'img', 'link', 'tag', 'check']  // check 列点击即翻转，无编辑器
```

编辑器类型缺省映射：`text/number/currency → MuInput`（number/currency 透传 `props: { type: 'number' }`）、`enum → MuSelect`、`date/datetime → MuDateInput`、`bool → MuSwitch`（无 focus/blur/keydown 事件，走"值变化即提交 + 容器 Esc"专用路径，见上表）；`column.editor.type` 显式指定优先。

**enum 编辑器 options 接线（mappings 是 Object，MuSelect.options 是 Array，必须转换）**——editor 解析层规则：

```js
// MuSelect.options 声明为 Array（select.js:5），column.mappings 是 { key: text | { text, ... } }（enum.js:8-16）
resolveSelectOptions (column) {
  if (column.editor?.props?.options) return          // 显式配置优先，原样透传
  const entries = Object.entries(column.mappings || {})
    .filter(([key]) => key !== 'default')            // default 是无匹配兜底映射，不是可选项
  return entries.map(([value, v]) => ({ value, label: isObject(v) ? v.text : v }))
  // isObject 复用 @/utils/type:42；产出 [{ value, label }] 形状即 MuSelect options 契约
}
```

无 mappings 且未显式配 options 时编辑器仍打开、下拉为空（与 MuSelect 对空 options 的行为一致），不视为错误。

### A7. 样式与主题

#### `--mu-*` 取值方式（决策：探针元素 + 计算样式，非静态 theme 对象）

`theme.js` 核心机制——kaka 的 theme 静态值方案直接违反约束 #2，不采用：

```js
// 组件挂载时在 __sticky 层内放入探针（继承 .mu-root/.mu-dark 及任何中间层覆盖）：
// <div aria-hidden="true" style="position:absolute; visibility:hidden; pointer-events:none; width:0; height:0">
const probe = …

function readVar (name) {
  probe.style.color = `var(${name})`                       // 赋给真实属性，浏览器完成求值
  return getComputedStyle(probe).color                     // 'rgb(r, g, b)' / 'rgba(...)'，canvas fillStyle 直接可用
}
function readPx (name) {
  probe.style.height = `var(${name})`
  return parseFloat(getComputedStyle(probe).height)        // 必须可布局，故探针用 visibility:hidden 而非 display:none
}
function readFont (name) {
  return getComputedStyle(probe).getPropertyValue(name).trim()   // 字体族 token 是普通字符串，不走 color 求值路径
}
function readInheritedFontSize () {
  return parseFloat(getComputedStyle(probe).fontSize)      // 探针不设置 font-size，读继承链计算值
}
```

关键点：`--mu-bg-muted`、`--mu-gray-translucent` 等大量变量值是 `rgb(from var(--mu-gray-19) r g b / 0.04)` 相对色语法（`root.scss:34,53-55`），`getPropertyValue()` 只返回 token 串、canvas 不可用；**赋给 `color` 等真实属性再读计算值**才得到浏览器求值后的 `rgba()` 字符串。这是 mussel 已有读取先例（`menu.vue:128`）的安全扩展。

主题快照（绘制期间不重复触发 reflow）：

```js
const snapshot = {
  textColor: readVar('--mu-text-color-normal'),
  borderColor: readVar('--mu-border-color-normal'), borderColorSoft: readVar('--mu-border-color-soft'),
  borderColorStrong: readVar('--mu-border-color-strong'),
  bgNormal: readVar('--mu-bg-normal'), bgFill: readVar('--mu-bg-fill'), bgStripe: readVar('--mu-bg-stripe'),
  selectBg: readVar('--mu-primary-faint'), hoverBg: readVar('--mu-gray-translucent'),
  primaryColor: readVar('--mu-primary-color'), gray: readVar('--mu-gray'),
  fontSize: readInheritedFontSize(),                // 继承父链字号（对齐 table.scss:53 font-size: inherit，用户改根字号时跟随）
  fontFamily: readFont('--mu-font-sans'),
  rowHeight: readPx('--row-height'), headHeight: readPx('--head-row-height'),
  cellPadding: readPx('--cell-padding'), cellLineHeight: readPx('--cell-line-height')
}
// withAlpha(color, a)：解析 'rgb()/rgba()' → `rgba(r, g, b, a)`，供覆盖层透明度叠加
```

局部变量在 `table-ex.scss` 镜像 `table.scss:2-15`（`--row-height: 36px` 等），用户可用同款方式覆盖。

#### 暗色切换感知时机（决策：MutationObserver + 手动 API 双通道）

暗色切换即 `.mu-root` 上 `mu-dark` class 增删（`root.scss:88`，变量全在 `.mu-root`/`.mu-dark` 两个作用域内，无中间层暗色变量）：

```js
const roots = new Set([
  componentRootEl.closest('.mu-root') || document.documentElement,
  componentRootEl                                   // mu-dark 也可能直接挂在本组件根上，两个目标都观察
])
const observer = new MutationObserver(scheduleRefresh)   // 回调 rAF 节流：重读 snapshot → 整幅重绘
for (const el of roots) {
  observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] })
}
```

- 兜底：`refreshTheme()` 方法暴露（用户在 `.mu-root` 之外用其他机制换肤时调用）。
- 拒绝的方案：轮询对比（常驻开销）、CSS `@property` 注册触发 transition event（改动 root.scss 全局变量注册，影响面大）。
- 编辑浮层为 DOM，变量切换自动生效，无需处理。

#### 视觉规格（与 table.scss 逐项对齐）

| 项 | 值 |
|----|----|
| 外框 | DOM：`1px solid var(--mu-border-color-normal)` |
| 行高/表头高 | `--row-height: 36px` / `--head-row-height: 36px`（局部变量，探针读取） |
| 单元格文本 | 字号继承父链（探针读 computed `font-size`，对齐 table.scss:53 `font-size: inherit`）+ `--mu-font-sans`，行内单行省略（measureText > 列宽-padding 时截断加 '…'），`line-height` 用于垂直居中：(rowH - lineH)/2 为基线偏移 |
| 内边距 | 左右 `--cell-padding: 8px` |
| 表头 | 底 `--mu-bg-fill`、字重 500、底边框 `1px var(--mu-border-color-soft)` |
| 表体底 | `--mu-bg-normal`；斑马纹偶行 `--mu-bg-stripe` |
| 网格线 | `1px var(--mu-border-color-soft)`，按 gridlines prop |
| 选中行 | 底色 `--mu-primary-faint` |
| hover | `--mu-gray-translucent` 覆盖层 |
| 固定列分隔 | 横向滚动时右缘 `1px var(--mu-border-color-strong)` |
| 表头/底部投影 | DOM 阴影条，均取 `var(--mu-shadow-float)`（y-scrolled / y-overflowed 类驱动，canvas 不画）。注：现有 table.scss:155 底部投影为硬编码 rgba 双阴影，违反约束 #2（颜色禁硬编码），table-ex 不复刻，统一用 `--mu-shadow-float` 单变量（视觉略轻，属对齐差异而非遗漏） |
| 空态 | `mu-table-ex--empty` + `empty` 插槽 / `emptyText` prop（`placeholder` 仅用于空单元格占位，不用于空态），居中 `--mu-text-color-subtle` |

### A8. 文件结构

```
src/components/table-ex/
├── table-ex.vue    # 组件壳：模板骨架、props/emits/暴露方法、模块组合、watch/onMounted 生命周期
├── table-ex.scss   # BEM 样式 + 局部尺寸变量（镜像 table.scss tokens）+ 探针/浮层/阴影样式 + __editor 填充样式（.mu-input 100%/100%）
├── index.js            # export { default } 与组件名导出（对齐其他组件目录惯例）
├── theme.js            # 探针读取、主题快照、MutationObserver、withAlpha、文本测量缓存
├── layout.js           # relayout() 统一布局重算（sticky/spacer 尺寸、探针尺寸变量重读）、solveWidths 宽度求解（minWidth/maxWidth clamp + 剩余宽迭代分配）、colLefts 前缀和、可视窗口、坐标↔行列换算、调宽手柄检测
├── cell-painters.js    # 复用现有列类型体系：resolveColumnType + compile/render（table.vue:164-178 同款，含自定义类型对象/函数），取值链 _text(record) 优先 → _value(record) ?? record[field]（均 ensureFn）→ render({record, recordNumber, value, emit}) 落地：text 类直绘（number/currency/date/datetime/enum/bool/rec_no 格式化与 mapping 文本天然覆盖）；items 落地——check ✓+disabled 置灰、link 主色文本、tag 灰底 pill、img 异步 Image（crossOrigin）；class/style/title 忽略
├── painter.js          # 绘制入口 draw(state)：分区顺序、网格线、表头、固定列、覆盖层；脏区 clip 调度；setTransform；lastPaint 绘制统计（rowStart/rowEnd/rowCount/elapsed）
├── editor.js           # 编辑状态机：只读判定、编辑器组件/props 解析（enum options 由 mappings 转换：Object.entries → [{value, label}]，排除 default）、定位计算、commit/cancel/validate、blur 兜底面板识别（.mu-dropdown-panel）
└── interactions.js     # 指针事件绑定：hover/选中/排序（表头点击发 header-click，check ✓ 表头除外）/调宽拖拽（固定列排除；move 脏区自列左缘起，up 后 relayout 重跑宽度求解）/check 点击（disabled 仅跳过翻转，选中与 cell-click 照发，翻转后亦续行）/dblclick 开编辑/editing 中画布 pointerdown 先同步提交再续行命中，rAF 合帧
```

模块间通信：`table-ex.vue` 持有共享 reactive state（scrollTop/scrollLeft、hover 索引、选中 key、editing 状态、layout 数据、theme 快照），以参数传入各模块纯函数；各模块不直接相互 import（除 painter → cell-painters、painter → theme 工具），便于并行实施。

### A9. 范围边界（本期不支持）

1. 单元格/区域范围选择（kaka Selection 体系）——仅保留行选中（与现有 table 一致）。
2. 键盘导航（方向键移动选中、Tab 切换编辑格、F2/Enter 直接键入开编辑）——仅 dblclick 开编辑。
3. `cell-item-click`：link 列链接点击、tag 列标签交互（canvas 文本无 DOM 元素）；link/tag 仅呈现。
4. `title` 悬浮提示、`class/style/headerClass/headerStyle` 列级样式、`multiline/lineClamp` 多行截断。
5. 行高不等的变高行；行合并、表头多级分组合并。
6. 列的显示/隐藏/顺序拖拽（仅宽度拖拽，且固定列区域整体不可调宽——调宽需联动固定区宽度与滚动区列前缀和重排，本期不做）。
7. 行级只读（仅表格级 + 列级）；编辑历史/撤销。
8. 数据量超浏览器滚动高度上限的压缩滚动（36px 行高下限约 90 万行，超出为未定义行为）。
9. 右键菜单、Excel 复制粘贴、小地图（kaka Minimap）等叠加层。
10. 分页/树形数据/分组聚合（父级自行处理 records）。
11. 触屏长按放宽调宽阈值等触屏专项优化（交互可用，体验不调优）。
12. 列类型 DOM 视觉子集（canvas 落地的固定形态，配置存在但不生效、不报错）：enum mapping 的 `class/style`；tag 的 `tagOption.pill/flat/color` 视觉变体（统一灰底 pill；`max` 截断与 `+N` 合并逻辑在 compile 内、天然支持）；link 的 `linkOption.danger/disabled` 视觉（统一主色文本）；自定义列类型返回 `items` 时仅支持上述 text/check/link/tag/img 五类落地，其余 `is` 忽略。文本类语义（格式化、mapping 文本、tags/links 文本）不受影响，见 A4 取值与渲染管线。

## 被拒绝的备选（含理由）

1. **多 canvas 图层（表头/固定列/表体各自独立 canvas 叠放）**：免滚动时重绘表头，但引入跨 canvas DPR 对齐、边缘缝隙、层级与命中分发复杂度；表头重绘成本仅 O(可视列数)（几十格），单 canvas + 绘制顺序分区已被 kaka（单 canvas + DrawLayers 顺序层）在数万行场景验证。选单 canvas。
2. **kaka hiDPI 属性劫持方案**：monkey-patch canvas width/height/getAttribute/drawImage，对使用方不可见、与本组件直接操作 ctx 的代码相互干扰，且直乘方案仅 4 行、无兼容性损失。选标准直乘。
3. **kaka 式隐藏原生滚动 + canvas 自绘滚动条**：需自绘滚动条外观与交互（kaka CustomScrollbar + MusselScrollbar 探测 `window.mussel`），而 mussel 自有 `v-mu-scrollbar` 指令 + `sizechange` 基础设施，原生滚动容器 + sticky canvas 零成本复用皮肤且保留原生滚动语义（键盘、触控板惯性、无障碍）。选原生滚动容器。
4. **编辑器用独立 `createApp` 挂载或 Teleport body**：脱离组件上下文需手动传 app context（注册的 mussel 组件、暗色 root 需重新查询）、手动销毁；模板内 `<component :is>` 单实例即满足"同一时刻只编辑一格"，且下拉等弹层由组件自身 Teleport。选模板内浮层。
5. **滚动位移 `drawImage` 自拷贝平移优化（kaka ScrollSync 策略）**：等高 36px 行下整屏重绘约 20-30 行，实测大概率满足帧预算；自拷贝引入旧画面残留（hover/选中态需额外擦除）与异步图片格的一致性复杂度。v1 不做，列为后续 profile 后的性能备选（探索报告"不建议未 profile 前优化"结论一致）。
6. **暗色感知用 CSS `@property` + transition 触发重绘**：需给全部被 canvas 消费的变量加全局 `@property` 注册，改动 `root.scss` 影响全库；MutationObserver 仅观察 class/style 属性，成本可忽略。选 MutationObserver。
7. **canvas 颜色改从构建期 `$colors` map 导入静态色（kaka theme 模式）**：直接违反任务约束 #2（禁硬编码、暗色须跟随 `--mu-*`），且丢失用户运行时覆盖变量的能力。拒绝。
8. **编辑提交由组件直接改写 `record[field]`**：现有 table 的 `update:cell-value` 语义为父级负责数据变更（check 列先例），受控数据流便于父级拦截/校验/请求。选 emit 不直改。
9. **blur 作为唯一提交源（kaka 原生 input 单例模式的直接移植）**：MuSwitch 根是普通 div 无 blur；MuSelect/MuDateInput 点下拉项时 input 先 blur（dropdown-item.vue:2 未阻止 mousedown 默认行为），立即提交会卸载编辑器、选项 click 丢失。改为分类型提交矩阵（值变化即时提交优先）+ blur 延迟兜底（commit 幂等）。
10. **列宽拖拽 up 后不重跑宽度求解（拖拽列定宽、其余列不动，允许右侧留白/横向滚动）**：拖窄后容器右侧留白观感差，且破坏"未定宽列瓜分剩余空间填满容器"的初始分配不变量。选 up 后重跑 solveWidths（move 中不跑，避免其他列随拖拽实时抖动）。
11. **cell-painters 重新实现各列类型的取值与格式化（不依赖 table/column-types）**：number/currency/date/enum 等格式化与 mapping 逻辑出现两份实现，与现有 table 行为漂移且双份维护。选复用 `resolveColumnType + compile/render` 管线（table.vue:164-178 同款），canvas 只做 text/items 的图形落地，DOM 视觉子集差异显式列入范围边界 #12。

## 风险与回滚

| 风险 | 影响 | 缓解 |
|------|------|------|
| 双轴 sticky（`__sticky` 于注入 tracks 之后的流内首位 + `__spacer` 随后）在个别浏览器边界行为 | 滚动时 canvas 偏移错位 | demo 页覆盖横纵滚动组合用例（S3 含 DOM 顺序断言：`__sticky` 是除 `.mu-scrollbar__tracks` 外的第一个子元素、在 `__spacer` 之前）；Chromium/Firefox/WebKit 均支持双轴 sticky（kaka 未用此模式是因自绘滚动条，非兼容性问题）；失败回退方案：`__sticky` 改 absolute + scroll 事件 rAF 内同步 transform（结构顺序与对外接口均不变） |
| blur 延迟兜底与值变化提交的时序竞争（点下拉项时 blur 先于 click） | 重复提交或提交丢失 | 值变化提交经 watch（微任务）先于 blur 延迟任务（宏任务）；commit 幂等（editing 已清空则 no-op）；A6 测试用例专测该序列（enum/date 点选提交恰一次） |
| 日期/下拉面板 Teleport 到 body，浮层拦截与 blur 判定覆盖不到面板内部交互 | 月份切换等面板内操作触发 blur 误提交、编辑器误关 | blur 兜底第 ③ 判据（activeElement 在 `.mu-dropdown-panel` 内不提交，见 A6）；A6 用例"面板切换月份后仍可继续选日"专测 |
| 探针 `getComputedStyle` 在大量变量下首帧开销 | 首帧延迟 | 快照仅在挂载/主题变更/尺寸变化时读取（非每帧），约 20 次读取一次 reflow 批次，可忽略 |
| `rgb(from ...)` 相对色在低版本浏览器（Chrome <119）不支持 | 变量求值失败、颜色回退 | 与现有 table 的 DOM 渲染退化行为一致（root.scss 本身依赖该语法），不额外处理；探针读不到时保留上一次快照 |
| img 列异步加载与虚拟滚动竞态（行滚出后 onload） | 重绘已不可见格 | invalidateCell 前校验行仍在窗口内 |
| 跨域图片（无 CORS 头）污染 canvas | `getImageData` 断言抛 SecurityError、整幅自检失效 | Image 统一 `crossOrigin='anonymous'`（A3 已写）；加载失败按空格处理不绘制；demo/自检 img 用例一律用 data URI 或同源图片（不用 dummyimage.com 跨域图）；A5–A7 的像素采样断言所在页面不出现跨域图 |
| 单 canvas 整幅重绘在极端列数（200+ 列）下帧率 | 滚动掉帧 | OVERSCAN=2 已限行数；列数压力先接受，drawImage 平移备选已留（拒绝备选 #5） |
| 回滚 | — | 全部为新增文件 + 2 处共享文件改动（`src/components/index.js` 注册、`demo/src/catalog.js` 登记），revert 即移除；不触碰现有 table 任何文件 |

## 测试计划

无测试框架（AGENTS.md），经 demo 页（`http://localhost:3000/data/table-ex/`，事件日志区与调试面板为 demo 文件自带，见改动清单与 G0）+ playwright DOM 断言验证。验收标准逐条：

| 验收标准 | 手段 | 检查方式 |
|---------|------|---------|
| A1 API 对照 | `浏览器` | demo 页挂载组件；点击单元格/表头，日志区依次出现 `cell-click`、`update:selected-record-key`、`header-click`（**非排序列**表头点击同样出现）、`update:order-by`、`column-resize`、`update:cell-value`。**check ✓ 表头点击只出现 `update:header-checked`、无 `header-click`**；**check 单元格点击同时出现 `update:cell-value` + `cell-click` + `update:selected-record-key`**；**点击表头 ✓（父级受控更新 headerChecked）后画布表头 ✓ 图形立即变化**（像素采样）；**替换 columns 数组（引用变化）后列头/列宽更新**。方法（经 `window.__tableEx` 与页面按钮）：`scrollToRecord(某 key)` 后 `browser_evaluate` 断言 scrollTop 对准该行顶部；`refreshTheme()` 调用后画布仍正常重绘且快照打印更新。空态：records=[] 时 `#empty` 插槽内容 DOM 断言可见；无插槽时 `emptyText` 渲染；`placeholder` 传入后空值格呈现占位文本（像素采样） |
| A2 渲染架构/DPR | `浏览器` | 浏览器缩放 150%（devicePixelRatio 变化 + window resize 路径）与容器拖拽改尺寸（右下角手柄，含**高度方向**）用例：`browser_evaluate` 读 `canvas.width / getBoundingClientRect().width` 比值 ≈ 1.5；缩放后表格线与文字无模糊（截图人工核对一次）。DOM 快照断言：`__scroll` 子元素顺序为 `[.mu-scrollbar__tracks, __sticky, __spacer]`（即 `__sticky` 是除注入 tracks 外的第一个子元素）。**容器高度经手柄变化后 spacer 高度与 scrollHeight 按 relayout 重算**（`browser_evaluate` 断言 spacer 高 = max(0, contentH − 新视口高)） |
| A3 虚拟滚动 | `浏览器` | demo 页 10 万行数据；`browser_evaluate` 设 `scrollTop` 跳跃滚动，DOM 断言 spacer 高度 = 表头高 + 100000×行高 − 容器视口高（与 `getLayoutInfo().contentHeight` 互核）；**每帧仅绘制可视区行：滚动后 `getLayoutInfo().lastPaint.rowCount ≤ ceil(视口高/行高) + OVERSCAN(2)`**（10 万行数据下若实现画全量必超）；**少量行（3 行）与空 records 时 spacer 高度 clamp 为 0**。滚动流畅（人工）；hover 变化时仅脏带重绘（demo 调试面板"重绘计数/lastPaint"）。数据契约：demo 事件处理器内就地改 record → 该格即刻更新；异步路径递增 `recordsVersion` 后整幅更新 |
| A4 列定义 | `浏览器` | demo 页列定义含 width 缺省列/字符串宽度/**minWidth 与 maxWidth 列**/`text` 函数覆盖列/**`value` 传字符串的列**/rec_no 列/check disabled 行/**enum/number/currency/date 列**；`browser_evaluate` 读 `getLayoutInfo().colWidths` 核对宽度求解：未定宽列 ≥ 各自 minWidth、≤ maxWidth、总宽收敛；`value` 字符串列不抛错且取值正确；`text` 覆盖列显示覆盖文本；**enum 列显示 mappings 映射文本、number/currency 显示千分位/货币格式、date 显示格式化文本**（像素采样/DOM 版 table 并排比对）；rec_no 序号含 recordsOffset；disabled check 点击无 `update:cell-value` **但仍有 `cell-click` 与选中**（日志核对） |
| A5 调宽与排序 | `浏览器` | playwright `browser_drag` 拖非固定列缘 ±：`getLayoutInfo().colWidths` 变化、拖后 click 不触发排序（日志无 header-click）；**拖拽 move 中该列右侧无旧像素残影**（拖拽中像素采样该列右缘外一格区域非上一列内容）；**拖宽/拖窄 up 后其余未定宽列重新分配**（colWidths 再读核对：定宽列=拖后值，未定宽列重新瓜分剩余宽，总宽=容器宽无留白）；固定列区缘拖拽无效果且无 col-resize 光标；点击排序列：图标方向（canvas 像素采样主色三角）与 `update:order-by` 载荷——**连续点击三次依次 `asc` → `desc` → `''`** |
| A6 编辑 | `浏览器` | dblclick 文本格 → DOM 快照断言 `__editor` 容器出现且 getBoundingClientRect 与单元格重合、**其内 `.mu-input` 尺寸 = 容器尺寸（100% 填充，200×32 固定值被覆盖）**；输入+Enter → `update:cell-value` 载荷正确、浮层消失、demo 就地改 record 后该格像素更新；Esc 取消不发事件；**enum 列开 MuSelect → 下拉面板有可选项（mappings 转换）**，点下拉项 → 提交恰一次且载荷为所选项（blur 不吞点击）；date 列同；**date 列打开面板切换月份（prev/next 按钮）后编辑器不关闭、仍可选日期提交**；bool 列 click 切换即提交、容器 Esc 取消；点击另一单元格一步完成提交+选中新行；点击页面空白（blur 延迟兜底）提交；validate 失败 → `.mu-input[invalid]` 存在且浮层不关闭；表格 `editable=false` 时 dblclick 无浮层；滚动中打开的编辑器自动提交关闭 |
| A7 样式/暗色 | `浏览器` | demo 页暗色切换按钮（toggle 根节点 mu-dark，含"mu-dark 挂组件根"的变体开关）：切换后 500ms 内 canvas 像素采样背景色变化（`browser_evaluate` getImageData）；表头底/网格线/选中/hover 色值与 DOM 版 table 同页并排人工比对一次；覆盖 `--row-height`（开关切换后 relayout 生效：行高变化、spacer 高度同步）与根字号（字号跟随）的用例生效 |
| A8 文件结构 | `命令` | `ls src/components/table-ex/` 与结构一致；`npm run build` 通过 |
| A9 范围边界 | `人工` | 对照清单逐条确认 demo 与文档无对应实现 |
| 构建/风格 | `命令` | `npx stylelint src/components/table-ex/*.scss --fix` 无错误；`npm run build` 通过 |

## 实施步骤

有序；文件集合不相交且无依赖的步骤标并行组。demo 骨架（G0）先行创建，G1/G2 各步的验证均经 demo 自检区（`self-checks/<module>.js` 断言渲染在页面"自检结果"面板），不依赖后置步骤。

| # | 步骤 | 文件集合 | 依赖 | 完成判据 |
|---|------|---------|------|---------|
| G0 | demo 骨架：页面（静态结构 + 10 万行数据生成器 + 事件日志区 + 调试面板：自检结果区 / 重绘计数与 lastPaint 统计 / 主题快照打印）+ **全部测试夹具与调试入口（改动清单 demo 行逐项：空态三变体开关、容器尺寸手柄、fixedLeftColumns 输入、editable 开关、validate 列、recordsVersion 异步按钮、--row-height 与根字号覆盖开关、mu-dark 挂组件根变体、scrollToRecord 输入+按钮、refreshTheme 按钮、`window.__tableEx` 实例句柄）** + 自检骨架（`self-checks/index.js` 引用各模块占位文件，页面渲染断言结果）+ catalog 登记 | `demo/src/data/table-ex/main-view.vue`、`main.js`、`self-checks/index.js` 与各占位文件、`demo/src/catalog.js` | — | 重启 `npm run demo:build` 后 `http://localhost:3000/data/table-ex/` 可访问；面板/日志区/全部夹具控件渲染；数据生成器断言通过；`window.__tableEx` 可访问（值为占位 null 亦可，S1 起为实例） |
| G1-a | `theme.js` + 对应自检 | `theme.js`、`self-checks/theme.js` | G0 | build 通过；demo 自检区 theme 断言全绿（readVar/readFont/readPx 输出 `rgb()/rgba()` 与 px 数、withAlpha、缓存上限）。**自检的尺寸变量来自自检容器内联声明（如 `style="--row-height: 36px"`），不依赖 S1 的 table-ex.scss**（该文件此时尚不存在） |
| G1-b | `layout.js` + 对应自检 | `layout.js`、`self-checks/layout.js` | G0 | build 通过；demo 自检区 layout 断言全绿（solveWidths 宽度求解含 min/max clamp 与迭代分配 / 混合列宽前缀和 / 窗口起止索引 / 命中检测 / 手柄检测含固定列排除 / relayout 对外暴露的计算纯函数） |
| G1-c | `cell-painters.js` + 对应自检 | `cell-painters.js`、`self-checks/cell-painters.js` | G0 | build 通过；demo 自检区断言全绿（离屏 canvas 各类型 painter 非空像素；取值链 text→value→field（含 value 传字符串）、rec_no 的 recordNumber、check disabled；enum mapping 文本、number/currency/date 格式化文本、自定义类型对象 render 返回 text、link/tag/items 落地） |
| G2-a | `painter.js` + 对应自检（在位 canvas 渲染） | `painter.js`、`self-checks/painter.js` | G1-a/b/c | build 通过；demo 自检 canvas 渲染出完整表格（文字/网格线/表头/固定列/覆盖层）；lastPaint 统计字段有值且 rowCount 与窗口一致 |
| G2-b | `interactions.js` 纯逻辑 + 自检（DOM 绑定接线留 S1） | `interactions.js`、`self-checks/interactions.js` | G1-b | build 通过；demo 自检区断言全绿（命中检测 / 排序 next / 调宽 clamp 与 move 脏区左界=列左缘 / check disabled 跳过翻转但续行点击流程 / 拖拽误触抑制） |
| G2-c | `editor.js` 状态机 + 自检 | `editor.js`、`self-checks/editor.js` | G1-b | build 通过；demo 自检区断言全绿（打开 / 分类型提交矩阵 / 取消 / 校验 / 定位计算 / **enum options 由 mappings Object 转换为 `[{value,label}]` Array 且排除 default** / blur 兜底面板判定条件 ③） |
| S1 | 组件壳与样式 + demo 接入真实组件（替换 G0 占位，接 interactions/editor DOM 绑定）。**main-view.vue 经相对路径本地 `import MusselTableEx from '../../../../src/components/table-ex/index.js'` 使用（`<script setup>` 局部可用），不依赖 S2 的全局注册**（demo app 的 install 来自 `src/index.js` → `components/index.js`，S2 前全局名不存在） | `table-ex.vue`、`table-ex.scss`、`index.js`、`main-view.vue` | G2-a/b/c | demo 手工全功能跑通（本地 import 渲染）；stylelint 通过 |
| S2（集成） | 组件库注册 | `src/components/index.js` | S1 | `npm run build` 通过；全站其他 demo 页无回归 |
| S3 | 验证：按测试计划执行 playwright + 像素采样 + `npm run build` | 无新文件 | S2 | 测试计划全表通过 |
| S4（延后） | 文档同步（需用户确认后执行） | `skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/` | S3 | 三处文档含 MuTableEx 条目且与实现一致 |

## 未解问题

无设计层未解问题。探索报告 4 项未解问题的处置：#1/#2/#3 已在本文档决策（探针+MutationObserver / 标准直乘 / 模板内浮层）；#4（z-index 清单）已补读 `src/styles/root.scss:127-132` 核对完毕。实施期待确认 1 项非设计问题：S4 文档同步的启动时机（按项目规约需用户确认）。

## 评审回应（第 1 轮）

| 评审条目 | 结论 | 处理 |
|---------|------|------|
| B1 sticky/spacer 结构与高度口径矛盾 | 接受 | A2 DOM 骨架重排：`__sticky` 改为 `__scroll` 流内第一个子元素（静态位置=内容顶部），`__spacer` 其后；滚动几何段统一口径——spacer 高 = 内容总高（表头高+行数×行高）− 容器视口高，两元素相加=内容总高；测试计划 A3 断言同步改为该口径，A2 补 DOM 顺序断言；风险表 sticky 行改述（回退方案结构顺序不变） |
| B2 demo 路径与 catalog/vite 规则冲突 | 接受 | 目录改 `demo/src/data/table-ex/`，URL 改 `http://localhost:3000/data/table-ex/`；改动清单、测试计划、实施步骤（G0/S2）已全部同步；经核对 `demo/src/catalog.js`（path 以分类 `data/` 开头）与现有 `demo/src/data/table/` 目录结构属实 |
| B3 编辑器事件隔离不足 / blur 吞下拉点击 | 接受 | A6 重写：`__editor` 拦截 pointerdown/click/dblclick 三类冒泡（画布交互是 click 语义）；画布侧 editing 中 pointerdown 先同步 commit 再续行命中（点击其他格一步完成提交+选中）；提交改分类型矩阵——input 走 Enter/画布/滚动/blur 延迟兜底，select/date 走值变化即时提交，blur 统一降级为延迟兜底（宏任务，editing 已清空则跳过，commit 幂等），时序论证已写入（点下拉项：blur 排队→click→watch 微任务先提交→延迟任务跳过）；拒绝备选 #9 记录"blur 唯一提交源"被拒理由 |
| B4 records 就地变更无重绘触发 | 接受 | A3 新增"数据变更重绘契约"小节：①同步就地修改（默认）——emit `update:cell-value` 后 nextTick 重绘该行；②异步就地修改——新增 `recordsVersion` prop（A1 已列），递增整幅重绘；③引用替换——原 watch；不 deep watch 的理由（10 万行）已写明。A1 `update:cell-value` 行、A3 重绘表（补 check 点击/编辑提交行、渲染 props 变化行）、测试计划 A3/A6 补对应用例 |
| M1 placeholder 语义偏离 | 接受 | `placeholder` 恢复现有语义：空单元格占位文本的表格级缺省（`col.placeholder ??= props.placeholder`，table.vue:195，经核对属实），canvas 对空值格绘制占位文本；空态文案改用新增 `emptyText` prop（现有 table 无空态文案节点，标注为新增能力），优先级 `empty` 插槽 > `emptyText`；插槽表与测试计划 A1 同步 |
| M2 测试依赖不存在的接口/调试开关 | 接受 | 新增 `getLayoutInfo()` 方法（只读布局快照 `{colWidths, contentWidth, contentHeight, rowHeight, headHeight}`），A3/A4/A5 断言改用它；事件日志区与调试面板（自检结果区/重绘计数开关/主题快照打印）写入改动清单 demo 行与 G0 步骤判据；A1 补方法（scrollToRecord/refreshTheme 经 A7 验证）与 `empty` 插槽/`emptyText` 的验证手段 |
| M3 G1/G2 判据依赖后置 demo | 接受 | 实施步骤重排：新增 G0（demo 骨架 + 自检骨架 + catalog 登记）先行；G1/G2 各步判据改为"build 通过 + demo 自检区该模块断言全绿"，各步文件集合含自己的 `self-checks/<module>.js`（互不相交，并行组成立）；DOM 绑定类接线（interactions 绑定器、editor 与组件壳联调）明确留 S1；原 S2 拆为 S1（demo 接入真实组件）与 S2（components/index.js 注册） |
| M4 MuSwitch 无 focus/blur/keydown | 接受 | A6 提交矩阵为 switch 定义专用路径：`__editor` 容器加 `tabindex="-1"`、打开时聚焦、承接 keydown.esc 取消；提交走值变化（click 切换即提交）/画布 pointerdown/滚动，不依赖 blur/Enter；模板 `v-on="editing.events"` 按类型合成（switch 为空对象）；测试计划 A6 补 bool 用例 |
| M5 cell-painters 未覆盖 text/rec_no/check disabled | 接受 | A4"完全兼容"条目补取值链：`column.text(record)`（ensureFn，非 null 优先，跳过类型渲染）→ `column.value(record) ?? record[field]` → 类型绘制，逐行对齐 table-row.vue:44-69；rec_no 走 `render({ recordNumber })`（record-number.js 无 compile，经核对属实），recordNumber = recordsOffset + index + 1；check 列 disabled（ensureFn）判定：置灰绘制 + 点击不 emit；A8 cell-painters 职责、测试计划 A4 同步 |
| m1 fontFamily 误用 readVar | 接受 | theme.js 新增 `readFont(name) = getComputedStyle(probe).getPropertyValue(name).trim()`（字体族是普通 token 串，不走 color 求值路径）；快照 fontFamily 改用 readFont |
| m2 MutationObserver 未观察组件根 | 接受 | 代码改为 `roots = new Set([closest('.mu-root') \|\| document.documentElement, componentRootEl])`，两个目标均 observe（Set 去重组件根即 .mu-root 的情形）；测试计划 A7 补"mu-dark 挂组件根"变体用例 |
| m3 dpr 跨屏迁移不更新 | 接受 | A2 尺寸响应新增 window `resize` 监听：仅重读 devicePixelRatio，变化则重设物理尺寸 + 整幅重绘；`refreshTheme()` 注明兼作手动兜底；测试计划 A2 用浏览器缩放（同时触发 dpr 变化与 window resize）覆盖该路径 |
| m4 单元格字号应继承 | 接受 | 快照 fontSize 改为 `readInheritedFontSize()`：探针不设 font-size、直接读 computed fontSize（继承链生效），对齐 table.scss:53 `font-size: inherit`；视觉规格表"单元格文本"行与 A7 测试用例（覆盖根字号）同步 |
| m5 header-click 应对所有表头点击 | 接受 | A5 事件序列改为：表头任意列点击均 `emit('header-click', column)`（table.vue:20 无条件语义），可排序列另发 `update:order-by`；A1 对照行、测试计划 A1（非排序列表头点击也出现）同步 |
| m6 固定列调宽策略不明 | 接受 | 命中检测改为固定列区域整体排除（命中列或左邻列任一 index < fixedLeftColumns 即返回 -1，含分界两侧）；理由（调宽需联动固定区宽度与滚动区前缀和重排）写入 A5 与范围边界 #6；测试计划 A5 补固定列缘拖拽无效用例 |

未被评审点名但受本次修订联动的同步处：改动清单（demo 路径 + self-checks 目录）、被拒绝备选 #9、风险表 blur 时序行、方案概述无实质变化。

## 评审回应（第 2 轮）

逐条对应 `03-review-2.md`（blocker 2 / major 10 / minor 10），全部接受，无"不接受"项。

| 评审条目 | 结论 | 处理 |
|---------|------|------|
| B1 enum 编辑器 mappings(Object) 误传 MuSelect.options(Array) | 接受 | A6 编辑器映射段新增 `resolveSelectOptions`：`editor.props.options` 显式优先；否则 `Object.entries(column.mappings)` 过滤 `default`（兜底映射非可选项）转 `[{ value, label: isObject(v) ? v.text : v }]`（isObject 复用 `@/utils/type:42`）；无 mappings 且无显式 options 时编辑器照开、下拉为空不视为错误。G2-c 判据补 enum options 转换断言；A6 测试补"下拉面板有可选项" |
| B2 `__sticky` 首子断言与 `v-mu-scrollbar` 注入 tracks 冲突 | 接受 | A2 DOM 骨架补 `.mu-scrollbar__tracks`（`scrollbar.js:105` insertBefore(tracks, el.firstChild)，0 尺寸 sticky，不参与滚动几何）；滚动几何段与 A2 测试断言改为"`__scroll` 子元素顺序为 `[.mu-scrollbar__tracks, __sticky, __spacer]`"；风险表 sticky 行同步改述 |
| M1 重绘触发遗漏 columns/headerChecked/recordsOffset/placeholder/keyField | 接受 | A3 重绘表 props watch 行逐项补齐：`columns`（引用变化 → 列准备 + relayout + 整幅）、`headerChecked`（→ 表头区整幅）、`recordsOffset`（→ 整幅）、`placeholder`（→ 整幅）、`keyField`（→ 旧/新选中行横带）；columns 仅 watch 引用不做 deep 的理由已写。A1 测试补"受控 headerChecked 更新后 ✓ 立即变化"与"替换 columns 后列头/列宽更新"断言 |
| M2 尺寸/主题变化未重算 sticky/spacer/可视窗口 | 接受 | A2 重写为"尺寸响应与 relayout()"：`relayout()` 五步（重读探针尺寸变量 → sticky 尺寸 → 列宽求解/前缀和 → spacer 宽高 → 可视窗口），触发点统一收口（sizechange / window resize / 主题刷新 / records / columns / 拖拽 up / 首帧）；`refreshTheme()` 说明补 relayout；A2 测试补容器高度变化后 spacer/scrollHeight 重算断言；A7 `--row-height` 覆盖用例补"relayout 生效、spacer 同步" |
| M3 测试计划依赖的 demo 夹具未列入改动清单与 G0 | 接受 | 改动清单 demo 行逐项列出全部夹具与调试入口（空态三变体、容器尺寸手柄、fixedLeftColumns 输入、editable 开关、validate 列、recordsVersion 异步按钮、--row-height/根字号覆盖、mu-dark 挂根变体、scrollToRecord 输入+按钮、refreshTheme 按钮、`window.__tableEx` 句柄）；G0 步骤任务与判据同步；`refreshTheme` 用例写入 A1（调用后正常重绘+快照更新），纠正上轮回应"经 A7 验证"的失实表述 |
| M4 未断言"仅绘制可视区行" | 接受 | A3 性能措施补 `lastPaint` 统计（rowStart/rowEnd/rowCount/colStart/colEnd/elapsed），painter 每次绘制后写入，经 `getLayoutInfo().lastPaint` 与调试面板暴露；A3 测试断言 `rowCount ≤ ceil(视口高/行高) + OVERSCAN(2)`（10 万行下画全量必超）；G2-a 判据补"lastPaint 有值且与窗口一致" |
| M5 "完全兼容"未覆盖自定义类型/格式化/mapping/tag-link 选项 | 接受 | A4"取值与渲染管线"整段重写：复用 `resolveColumnType + compile/render`（table.vue:164-178 同款，自定义类型对象/函数直接支持），`render({record, recordNumber, value, emit})` 返回 text 直绘（number/currency/date/datetime/enum/bool/rec_no 格式化与 mapping 文本天然覆盖）、返回 items 按 `is` 落地（check/link/tag/img）；class/style/title 忽略。不支持子集（mapping 样式、tag pill/flat/color、link danger/disabled、自定义 items 的其余 is）逐条列入范围边界 #12；"完全兼容"降级为"文本类语义完全兼容"；被拒绝备选 #11 记录"重新实现绘制"被拒理由；G1-c 判据与 A4 测试补对应断言 |
| M6 宽度求解缺 minWidth/maxWidth；拖拽后未定宽列重分配未定义 | 接受 | A3 新增"宽度求解"小节：定宽列 clamp [minWidth ?? 0, maxWidth ?? ∞]，未定宽列基线 80 clamp 后均摊剩余宽、maxWidth 消耗迭代再摊（上限 3 轮），remain ≤ 0 保持并横向滚动；调用时机仅 relayout 与拖拽 up（拖拽列显式定宽后其余未定宽列重跑求解，保持填满容器不变量；move 中不跑防抖动）；被拒绝备选 #10 记录"up 后不重跑"被拒理由；A4 测试补 min/max 收敛与总宽断言、A5 测试补"up 后未定宽列重新分配、无留白"断言；A8 layout.js 职责同步 |
| M7 日期/下拉面板 Teleport 使 blur 兜底误提交 | 接受 | A6 blur 兜底判据改为三条，新增 ③：`document.activeElement?.closest('.mu-dropdown-panel')` 为真则不提交（面板根统一 class，dropdown-panel.vue:8；月份切换按钮点击后焦点在面板内，date-input.vue:14-23）；下拉项不可聚焦场景由值变化微任务先提交覆盖（已补充说明）；风险表新增一行；A6 测试补"面板切换月份后编辑器不关闭、仍可选日期" |
| M8 check 点击未续行单元格点击流程 | 接受 | A5 事件序列重写：check 点击 emit `update:cell-value` 后**继续单元格点击流程**（选中 + cell-click，对齐 check.js click 无 stopPropagation + td @click 冒泡，已核对源码）；disabled 仅跳过翻转，选中/cell-click 照发（DOM 版 `[disabled]` 仅 pointer-events:none）；A1 cell-click 对照行与测试补"check 点击三事件同现"断言；A4 disabled 用例改为"无 update:cell-value 但有 cell-click 与选中" |
| M9 列宽拖拽 move 脏区留残影 | 接受 | 脏区左界改为**该列左缘**（列宽变化影响该列截断与右侧所有列位置；`min(旧右缘,新右缘)` 仍漏该列自身重绘需求，列左缘一并覆盖）：A3 重绘表、A5 move 事件行同步并写明理由；A5 测试补"拖拽中该列右缘外无旧像素残影"采样断言；G2-b 判据补"move 脏区左界=列左缘" |
| M10 编辑器控件 200×32 固定尺寸不随单元格填充 | 接受 | A6 定位段补 scss：`__editor` 设 flex/align-items:center/overflow:hidden，子级 `.mu-input`（MuInput 根；MuSelect/MuDateInput 根为 combo-wrapper 同类名，combo-wrapper.vue:4）`width/height: 100%`；A6 测试断言改为"`__editor` 容器 rect 与单元格重合 + 其内 .mu-input 尺寸=容器（100% 填充）"；A8 table-ex.scss 职责同步 |
| m1 check 表头 header-click 措辞与 `@click.stop` 不符 | 接受 | A1 header-click 对照行、A5 事件序列明确：check ✓ 表头只发 `update:header-checked`（对齐 table.vue:25）；其余表头点击均发 `header-click`；A1 测试补该断言 |
| m2 spacer 高度未 clamp 负值 | 接受 | A2 滚动几何 spacer 高度改 `max(0, ...)`；A3 测试补"3 行数据与空 records 时 spacer 高 0"用例 |
| m3 switch 容器级 keydown 未在模板展示 | 接受 | A6 模板片段 `__editor` div 补 `@keydown.esc="editing.onEsc"` 并注明与组件自身 esc 转发的关系（commit 幂等不冲突） |
| m4 底部投影引用 table.scss:155 硬编码 rgba | 接受 | 不复刻硬编码：A7 视觉规格表底部投影改用 `--mu-shadow-float` 单变量，注明与现有 table 的双阴影存在视觉差异及理由（约束 #2 禁硬编码） |
| m5 img 跨域污染 canvas 未处理 | 接受 | A3 img 行补 `crossOrigin='anonymous'`；风险表新增跨域图片行（加载失败按空格绘制；demo/自检 img 用例用 data URI/同源，不用 dummyimage.com；像素采样页不含跨域图） |
| m6 G1-a theme 自检依赖 S1 才创建的局部变量 | 接受 | G1-a 判据写明：自检尺寸变量来自**自检容器内联声明**（`style="--row-height: 36px"`），不依赖 table-ex.scss（该文件 S1 才创建） |
| m7 S1 demo 接入先于 S2 全局注册，全局标签解析失败 | 接受 | S1 步骤明确 main-view.vue 经相对路径 `../../../../src/components/table-ex/index.js` 本地 import 使用（`<script setup>` 局部可用），不依赖全局注册；S2 保持仅注册 + 构建校验 |
| m8 A5 排序循环断言与实现循环不一致 | 接受 | A5 测试改为"连续点击三次依次 `asc` → `desc` → `''`"，与实现的 无→asc→desc→无 循环首态一致 |
| m9 column.value 未写 ensureFn | 接受 | A4 取值链明确列准备阶段构建 `_text/_value` 均 ensureFn（table.vue:170-171 同款），`value` 传字符串不抛错；A4 测试补"value 传字符串的列"用例；A8 cell-painters 职责同步 |
| m10 A7 视觉规格空态行仍写 placeholder | 接受 | A7 视觉规格空态行改"`empty` 插槽 / `emptyText` prop"，并注明 placeholder 仅用于空单元格占位 |

本轮修订联动同步处（未被单点点名）：A2 骨架注释、A3 重绘表 img 行、getLayoutInfo 返回结构（补 viewRows/lastPaint）、被拒绝备选 #10/#11、风险表 3 行、实施步骤 G0/G1-a/G1-b/G1-c/G2-a/G2-b/G2-c/S1 判据、测试计划 A1–A7 全表。
