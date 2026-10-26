# 探索报告 — mussel 现状（③）

任务：`.pipeline/20261025-editable-table/00-task.md` 探索范围③。git 基线：分支 mussel-table，HEAD `04e157d`；工作区未提交改动 = canvas-table 实施产物（`git status`：`M demo/src/catalog.js`、`M src/components/index.js`、`?? src/components/canvas-table/`、`?? demo/src/data/canvas-table/`、`?? demo/src/data/canvas-table-editable/`、`?? .pipeline/`）。探索以工作区现状为准。

## 相关代码

### 1. 现有 DOM 表格 src/components/table/

| 文件 | 行数 | 职责 |
|------|------|------|
| src/components/table/table.vue | 385 | 组件壳：`<table>` DOM 渲染、props/emits、internalColumns 列准备、hover 指示条、滚动阴影 |
| src/components/table/table-row.vue | 89 | 行渲染：td 逐格 text/items 二态、title 悬浮提示 |
| src/components/table/utils.js | 19 | `ensureFn` / `getPixelNumber` / `getCellAlignClass` |
| src/components/table/table.scss | 196 | BEM 样式 + 尺寸变量 tokens |
| src/components/table/column-types/ | 12 类型文件 | 列类型注册表（index.js:16-30：text/rec_no/check/bool/enum/date/datetime/number/currency/link/tag/img/image） |

关键事实：

- **props**（table.vue:65-85）：`keyField: String`、`records: Array`、`columns: Array`、`selectedRecord: Object`、`selectedRecordKey: [String,Number]`、`headerChecked: Object`、`orderBy: String`、`recordsOffset: Number 0`、`fixedLeftColumns: Number`、`gridlines: 'none'|'all'|'row'|'column' 默认 all`、`hoverMode: 'none'|'row'|'column'|'cross'|'cell' 默认 row`、`striped: Boolean`、`placeholder: String`。
- **events**（table.vue:87-95）：`header-click(column)`、`cell-click({record, recordIndex, column})`、`cell-item-click`、`update:header-checked(column, value)`、`update:cell-value({record, column, value})`（check 列 payload 无 recordIndex，check.js:21-24）、`update:selected-record(record)`、`update:selected-record-key(key)`。
- **无 defineExpose 方法、无插槽**（空态 `mu-table--empty` 仅样式类，table.vue:129-141）。
- **排序**：完全受控。`orderBy` prop 驱动 `sortDirection` computed（table.vue:144-153，`replace(':', ' ').split(' ')` 兼容冒号/空格分隔，`desc`→down）；表头点击无条件 `emit('header-click', column._raw)`（table.vue:336-338），排序逻辑由父级执行；可排序列显示 `<mu-sort-icon>`（table.vue:29）。
- **无列宽拖拽能力**；列宽经 `<col :style="col._colStyle">`（table.vue:11，width/minWidth/maxWidth）+ `table-layout: fixed` 平分剩余空间（table.scss:23）。
- **固定列**：`position: sticky` + `left` 累计偏移（table.vue:180-193），`.last-fixed-col` 滚动后右缘强化边框（table.scss:136-138）。
- **列准备管线**（table.vue:159-203 internalColumns computed）：`resolveColumnType(el.type)`（字符串查注册表，对象/函数直接用作自定义类型，column-types/index.js:32-34）→ `_text/_value/_title/_class/_style` 均 ensureFn → `_render = type.compile ? type.compile(el) : (type.render || type)` → `col.placeholder ??= props.placeholder`（table.vue:195）。
- **取值链**（table-row.vue:43-75）：`_text(record)` 非 null 直接作为显示文本（跳过类型渲染）→ 否则 `value = _value(record) ?? record[field]` → `_render({record, recordNumber, value, emit})` 返回 `{text}` 或 `{items:[{is, text, attrs, events}], class, style, title}`。
- **列类型形态**：`{ align, width, compile(column) → render(ctx) }`。例：CheckColumn `{align:'center', width:'50px', compile}`（check.js:3-31，disabled ensureFn、`data-checked` attrs、click emit `update:cell-value`）；DateColumn `{align:'right', compile}`（date.js:3-13，formatter=toDateString、format='yyyy-MM-dd'）；NumberColumn `{align:'right', compile}`（number.js:1-18，Intl.NumberFormat）；EnumColumn `{align:'center', compile}`（enum.js:3-20，mappings Object → text）；TextColumn compile 支持 multiline/lineClamp（text.js:3-35）。
- **样式规格**（table.scss:1-19）：局部变量 `--row-height: 36px`、`--cell-padding: 8px`、`--cell-line-height: 18px`、`--head-row-height: 36px`；表头底 `--mu-bg-fill`、字重 500、底边框 `1px --mu-border-color-soft`；网格线 `--mu-border-color-soft`；选中 `--mu-primary-faint`（`--select-bg`，table.scss:14）；hover `--mu-gray-translucent`（table.scss:15）；斑马 `--mu-bg-stripe`；单元格 `font-size: inherit`（table.scss:53）。**底部投影为硬编码 rgba 双阴影**（table.scss:155，违反 --mu-* 约束的历史遗留）。
- hover 指示条为 DOM 覆盖层 + CSS 变量定位（table.vue:111-120、table.scss:162-195）；滚动/尺寸经 `@scroll` throttle 16ms + `@sizechange` throttle 100ms + `v-mu-scrollbar` 指令（table.vue:4-8）。
- **demo 遗留不一致**：`demo/src/data/table-advanced/main-view.vue:27` 传 `table-width="fit-content"`，但 table.vue props 无 `tableWidth`（attr fallthrough 到根 div，无效果）。

### 2. 已实施 canvas 表格 src/components/canvas-table/（未提交，共 8 文件 3696 行）

| 文件 | 行数 | 职责 |
|------|------|------|
| canvas-table.vue | 858 | 组件壳：模板（滚动容器/canvas/sticky/overlay/编辑浮层/空态/阴影条）、props/emits/expose、watch 重绘表、拖拽接线 |
| painter.js | 836 | 绘制管线：单 canvas 5 分区、脏区 region、createPainter 有状态封装、lastPaint 统计 |
| editor.js | 507 | 编辑状态机：只读判定、编辑器组件/props 解析、定位、分类型提交矩阵、validate、blur 兜底 |
| interactions.js | 437 | 指针交互纯函数：hitTest/排序 next/表头与单元格点击动作/调宽 clamp/clickGuard/frameScheduler |
| cell-painters.js | 451 | 单元格绘制适配器：复用 table 列类型体系，text/items 落地 canvas |
| layout.js | 383 | 纯函数布局：solveWidths 宽度求解、前缀和、可视窗口、坐标↔行列换算、调宽手柄检测 |
| theme.js | 222 | --mu-* 探针读取、17 字段快照、MutationObserver 暗色感知、DPR 监听、测量缓存 |
| canvas-table.scss | 122 | BEM 样式 + 镜像 table.scss 尺寸变量 + sticky/spacer/overlay/editor 浮层 |
| index.js | 2 | 导出 |

关键事实：

- **props**（canvas-table.vue:92-116）：与 table.vue 完全同名的 13 个 props 之外新增 4 个：`emptyText: String ''`、`recordsVersion: Number 0`（异步就地修改 records 的重绘通知通道）、`editable: Boolean false`、`resizable: Boolean false`。无 `cell-item-click` 事件。
- **events**（canvas-table.vue:118-127）：table 的 7 个 + 新增 `update:order-by(String)`（`'field:asc'|'field:desc'|''`，无→asc→desc→无循环，interactions.js:86-94）、`column-resize({column, width})`。
- **方法 defineExpose**（canvas-table.vue:779-785）：`scrollToRecord(keyOrIndex)`、`refreshTheme()`、`getLayoutInfo()`（colWidths/contentWidth/contentHeight/rowHeight/headHeight/viewRows/lastPaint）、`getThemeSnapshot()`、`getCellRect(row, col)`（playwright 坐标换算用）。现有 table 无任何方法。
- **插槽**：仅 `#empty`（canvas-table.vue:27-29，优先级 empty 插槽 > emptyText）。
- **DOM 骨架**（canvas-table.vue:1-57）：`__scroll`（原生滚动 + v-mu-scrollbar）内 `__sticky`（sticky 双轴钉视口，尺寸=容器 clientWidth/Height，指针事件全绑这层）含 canvas + `__overlay`（编辑浮层/空态/阴影条，pointer-events:none）+ `__spacer`（撑出滚动范围）。
- **渲染架构**（painter.js:1-49 模块头）：单 canvas 5 分区固定顺序：1 表体滚动区（可视行×可视列）→ 2 网格线 → 3 固定左列区（整高不透明重绘）→ 4 表头区（整宽不透明重绘）→ 5 覆盖层（hover/调宽参考线）。选中/斑马底色在分区 1/3 行背景直接取值。
- **虚拟滚动**：等高行模型，`viewRows = {start: floor(scrollTop/rowH), end: min(rowCount, ceil((scrollTop+viewH)/rowH) + OVERSCAN)}`（layout.js:139-146，OVERSCAN=2）；列窗口二分查找（layout.js:160-176）；滚动 `rAF` 合帧（canvas-table.vue:349-368，interactions.js:413-437 createFrameScheduler），滚动路径不重跑 solveWidths（canvas-table.vue:318-345）。**禁止全量绘制**由 lastPaint 统计断言（painter.js:694-697）。
- **宽度求解**（layout.js:53-108）：定宽列 `widthOverrides[key] ?? col.width ?? type.width` 取 px 后 clamp [minWidth, maxWidth]；未定宽列基线 COL_FALLBACK=80；剩余宽迭代均摊（上限 3 轮，被 maxWidth 消耗的再摊）。
- **脏区重绘**（painter.js:40-48）：region 形状 `{rows:[from,to]}` / `{cols}` / `{cell:{row,col}}` / `{header:true}` / `{colFrom}`（调宽 move：该列左缘至画布右端竖带+表头整幅，防加宽残影）；脏区先 destination-out 擦除再走同一管线（半透明底色不叠混）。hover 变化仅旧/新带重绘（canvas-table.vue:436-448）；编辑提交/check 翻转 nextTick 重绘该行（canvas-table.vue:380-381、540）；选中变化旧/新行两条横带（canvas-table.vue:824-830）。
- **数据变更契约**（canvas-table.vue:789-816 watch）：①引用替换→滚动复位+relayout+整幅；②recordsVersion 递增→整幅；③渲染 props（gridlines/hoverMode/striped/orderBy/recordsOffset/placeholder）→整幅；headerChecked→表头区；columns 引用变化→清空 widthOverrides+relayout。不做 records deep watch。
- **编辑机制**（editor.js）：
  - 编辑器组件映射（editor.js:55-60）：`input: MuInput, select: MuSelect, date: MuDateInput, switch: MuSwitch`（import 自 `../form/index.js`:46）。
  - 只读判定（editor.js:86-94）：`editable !== false && column.editable !== false && column.editor != null && column.type 不在 NON_EDITABLE_TYPES`（`['rec_no','img','image','link','tag','check']`，editor.js:52）。**列必须显式配置 `editor`（true 或对象）才可编辑**。
  - 编辑器类型缺省映射（editor.js:66-74）：text/number/currency→input（number/currency 自动注入 `props:{type:'number'}`，editor.js:147-153）、enum→select、date/datetime→date、bool→switch；`column.editor.type` 显式优先。
  - 提交矩阵（editor.js:326-343 buildEvents）：input→Enter 提交/Esc 取消/blur 延迟兜底；select/date→值变化即提交（`flush:'sync'` watch，editor.js:285-297）/Esc/blur 兜底；switch→值变化提交（无 focus/blur/keydown 事件）。画布 pointerdown 先同步提交再续行命中（canvas-table.vue:469-475）；**滚动即提交**（canvas-table.vue:360）。
  - blur 延迟兜底三判据（editor.js:233-244）：editing 仍在 + 焦点不在 `__editor` 容器 + 焦点与最近 window pointerdown 目标均不在 `.mu-dropdown-panel` 内。
  - validate（editor.js:451-461）：`column.editor.validate(value, {record, column})` 返回非 true → invalid/message（透传组件 `invalid` prop + 容器 title），不关闭不失焦；commit 幂等。
  - enum options 转换（editor.js:123-132）：mappings Object → `[{value: key字符串, label}]`，排除 default；**提交值恒为 mapping key 字符串**（不按原值类型回写）。
  - 定位（editor.js:189-206 computeEditorStyle）：`left = colLefts[i] - (i < fixedCount ? 0 : scrollLeft)`、`top = headHeight + row*rowH - scrollTop`、width=列宽、height=行高；浮层样式由组件壳转 px 串（canvas-table.vue:598-602）。
- **样式一致性**：canvas-table.scss:3-8 镜像 table.scss 尺寸变量（--row-height 36px 等同名同值，用户同款方式覆盖）；绘制色全部取自 --mu-* 探针快照（theme.js:52-72，17 字段）；check 方框/tag pill/排序图标视觉常量镜像 DOM 规格（cell-painters.js:20-31、painter.js:54-63）。**已知视觉差异**：底部投影统一 `--mu-shadow-float` 单变量，不复刻 table.scss:155 硬编码双阴影（canvas-table.scss:55-57 注释）；check disabled 置灰底衬用 `--mu-gray-translucent` 等效替代 DOM 版 `--mu-bg-strong`（快照无该字段，cell-painters.js:364-370）。
- **主题**（theme.js）：探针 `readVar`（赋给 color 读计算值，兼容 `rgb(from ...)` 相对色）+ `readPx`/`readFont`/`readInheritedFontSize`；MutationObserver 观察 `.mu-root` + 组件根 class/style（theme.js:78-86、194-199）+ window resize（DPR 变化）；rAF 节流重读快照→relayout→整幅。`parseColor` 兼容 `color(srgb ...)` 序列化形态（theme.js:93-123）。文本测量缓存 2000 条上限整体清空（theme.js:136-151）。
- **调宽**（layout.js:290-321 + canvas-table.vue:606-683 + interactions.js:221-226）：手柄命中 4px（RESIZE_HANDLE）；仅表头区；固定列区域整体排除 + 列级 `resizable === false` 排除；min 缺省 40；move 中写 `widthOverrides[col._key]` + 临时前缀和（不重跑求解防其他列抖动）；up 时 emit `column-resize` + relayout 重跑 solveWidths；clickGuard 抑制拖拽误触 click。
- **已实现能力清单**（源码核对，与旧设计 02-design.md A1-A7 及 05-verify-2.md PASS 记录一致）：虚拟滚动（demo 10 万行，lastPaint.rowCount ≤ 视口行数+OVERSCAN）、列宽拖拽、排序图标+update:order-by、单元格编辑（4 类编辑器+validate）、check 翻转+表头全选、固定左列、hover 5 模式、gridlines 4 模式、striped、选中行、空态（插槽/emptyText）、空值 placeholder、img 异步加载（crossOrigin anonymous、200 条缓存）、DPR 适配、暗色感知、scrollToRecord 等 5 方法、demo 自检 77 项断言（demo/src/data/canvas-table/self-checks/ 7 文件）。
- **明显局限**（02-design.md A9:549-562 范围边界 12 条，源码无对应实现）：无区域选择、无键盘导航（仅 dblclick 开编辑）、无 `cell-item-click`（link/tag 仅呈现）、无 title 悬浮/列级 class·style/multiline·lineClamp、无变高行/行合并/多级表头、无列显隐/顺序拖拽/固定列调宽、无行级只读/编辑撤销、约 90 万行浏览器滚动上限、无右键/复制粘贴/小地图、无分页/树/分组、列类型 DOM 视觉子集（tag 统一灰底 pill、link 统一主色文本、enum mapping class 不生效等）。
- **技术债/已知坑**（代码注释与验证记录）：
  - editor.js 内建 `focusAfterRender` 的 `state.editing !== editing` 守卫因 reactive 代理恒真不可达，聚焦实际由组件壳 `focusEditor` 承担（canvas-table.vue:582-585 注释明示；editor.js:345-360 仍保留死代码路径）。
  - `resolveHoverDirtyRects`（interactions.js:268-327）导出但组件壳未使用（壳内 updateHover 直接用 invalidate 带）。
  - demo disabled check 夹具缺（05-verify-2.md 测试质量 1 遗留）；img 自检重复执行必 fail 1 条（首挂载判定规避，05-verify-2.md 测试质量 4）。
  - datetime 列编辑器共用 date 编辑器（editor.js:72），MuDateInput 无 datetime 精度类型（见下节），编辑值只到日期精度（除非 editor.props 显式配置）。
  - 行高与输入组件高度：`.mu-input` 固定 `width:200px; height: var(--mu-control-height-normal)`（input.scss:12-13），编辑浮层以 `> .mu-input { width/height: 100% }` 覆盖（canvas-table.scss:117-120）。

### 3. 可复用输入组件清单 src/components/form/

导出名全集（form/index.js:1-17）：MuInput、MuSearchInput、MuInputGroup、MuSelect、MuMultiSelect、MuComboBox、MuOption、MuDateInput、MuDateRangeInput、MuTimeInput、MuColorInput、MuSwitch、MuCheck、MuCheckGroup、MuRadio、MuRadioGroup、MuSegmented（+ MuForm/MuFormRow/MuFormField）。

编辑器适配相关的核心组件接口：

| 组件 | v-model | 关键 props | 事件 | 备注 |
|------|---------|-----------|------|------|
| MuInput（input.vue:14-38） | `defineModel()` | inputProps（input.js:7-21：invalid/readonly/disabled/placeholder/prefix/suffix/tabindex/clearable/size small·normal·large/pill）+ `type: String` | inputEmits（input.js:23-33：input/focus/blur/keydown/**enter/esc**/click/prefixClick/suffixClick）；enter/esc 由 keydown keyCode 13/27 转发（input.js:66-71） | 根 `.mu-input` 固定 200×32（input.scss:12-13） |
| MuSelect（select.vue:25-39） | `defineModel()` | selectProps（select.js:4-11：**options: Array**、optionKey 'value'、valueMode 'normal'/'composite'、dropdownClass/dropdownWidth 'anchor'/dropdownScrollbar）+ inputProps | 经 combo-wrapper 转发 inputEmits | options 形状 `[{value, label}]`（select.js:24-32）；非 editable 时显示 value→label 映射文本（select.js:72-87） |
| MuDateInput（date-input.vue:74-95） | `defineModel({type:[Date,String]})` | dateProps + `format`（缺省 DEFAULT_FORMAT[type]）+ `type: 'date'|'week'|'month'|'quarter'|'year'`（**无 datetime**，date-input.vue:83-86 validator）+ dropdownClass | 同上 | 面板 Teleport body，含月份导航等按钮（date-input.vue:10-23） |
| MuSwitch（switch.vue:8-45） | `defineModel()` | icon/activeIcon/inactiveIcon/label/activeLabel/inactiveLabel/activeValue(默认 true)/inactiveValue(默认 false)/disabled | **无事件**；根是普通 div 无 focus/blur/keydown（switch.vue:2） | click 切换即写 model |
| MuMultiSelect（multi-select.vue:54-61） | `defineModel()`（数组） | multiSelectProps（multi-select.js:5）+ disabled/readonly | 同 combo | 值为多选数组 |
| MuTimeInput（time-input.vue:40-49） | `defineModel({type:String})` | format 'HH:mm:ss'/minuteStep/secondStep/dropdownWidth/dropdownClass | 同 combo | — |
| MuComboBox（combo-box.vue:33-38） | `defineModel()` | selectProps + editable | 同 combo | 可输入下拉 |
| MuSearchInput（search-input.vue:22-31） | modelValue | inputProps + prefix ':icon=search' + clearable + debounceDelay 500 | 同 input | — |

共性事实：

- 全部 `defineModel()`（Vue 3.4 v-model）；`useFieldModel` 包装（validation.js:58-71）——无 `formField` inject 时为纯透传，**表格浮层内可安全使用**。
- MuSelect/MuDateInput/MuTimeInput/MuMultiSelect/MuComboBox 均基于 combo-wrapper（combo-wrapper.vue:40-119）：根 class `mu-input`、内部含真实 `<input>` 元素（combo-wrapper.vue:11-13 默认插槽）——canvas-table 编辑聚焦 `el.querySelector('input')?.focus()`（canvas-table.vue:594）依赖此结构。
- 下拉面板 Teleport 到 body、根 class `mu-dropdown-panel`（dropdown-panel.vue:2,8）——blur 兜底判定（editor.js:63 DROPDOWN_PANEL_SELECTOR）依赖此 class。
- `invalid` prop 为 Boolean（input.js:8），canvas-table 以 `:invalid="editing.invalid || null"` 透传（canvas-table.vue:48）。

### 4. demo

- **demo/src/data/canvas-table/**（main-view.vue 872 行 + main.js + self-checks/ 7 文件）：10 万行确定性数据生成器（main-view.vue:267-288）；全部 props/events/夹具（空态三变体、容器拖拽手柄、editable/resizable 开关、--row-height 与根字号覆盖、mu-dark 挂根、scrollToRecord/refreshTheme 按钮）；DOM 版 mu-table 并排参照（前 20 行，main-view.vue:151-164）；自检面板 77 项 + 重绘统计 + 主题快照；`window.__canvasTable` 调试句柄（main-view.vue:250、685）。组件经相对路径本地 import（main-view.vue:244），不依赖全局注册。catalog 已登记（demo/src/catalog.js:117）。
- **demo/src/data/canvas-table-editable/**（main-view.vue 225 行）：24 行商品数据；编辑列定义示例（`editable: true, editor: true` / `editor: {type:'input', props:{type:'number'}}` / `editor: {validate}`，main-view.vue:88-138）；只读列（未声明 editable，含 value 函数计算列）；受控数据流（`update:cell-value` 处理器就地改 `record[column.field]`，main-view.vue:160-168）；`recordsVersion` 异步通知；展示型排序（父级按 orderBy 排序 computed）。catalog 已登记（demo/src/catalog.js:122）。
- **demo/src/data/table/、table-advanced/**：现有 mu-table 用法参照（排序/check/固定列/操作列/分页偏移/自定义类型）。

### 5. 注册与共享文件改动

- `src/components/index.js:21` import + `:58` 注册 `MuCanvasTable`（与 MuTable 同款单组件注册，index.js:54-60）。
- `demo/src/catalog.js` data 分类两处登记（:117、:122）。

## 现有约定

- **命名**：注册名 `Mu` 前缀 PascalCase（`MuCanvasTable` → `<mu-canvas-table>`），内部名 `MusselXxx`（`defineOptions({ name })`）；CSS BEM `mu-` 前缀（`mu-canvas-table__editor`、修饰符 `--y-scrolled`）。
- **目录**：`src/components/<name>/` = `xxx.vue` + `xxx.scss`（就近 import，组件 `<script setup>` 内 `import './xxx.scss'`）+ `index.js`（`export { default }` + 具名导出），经 `src/components/index.js` 注册。
- **代码**：纯 JavaScript、Vue 3 `<script setup>` Composition API、shallowRef 持 DOM ref、computed 派生；`throttle-debounce` 包（table.vue:55、canvas-table.vue:61）；`@/utils/key-builder` 的 `autoIncrementKeyBuilder` 生成稳定 key。
- **状态管理**：无 store；组件内 props 单向 + `update:*` 受控事件风格（`update:selected-record-key`、`update:cell-value`、canvas-table 新增 `update:order-by`）；数据变更由父级执行（组件不直改 record，02-design.md 拒绝备选 #8）。
- **可复用工具**：`../table/utils.js`（ensureFn/getPixelNumber/getCellAlignClass）、`../table/column-types/index.js`（resolveColumnType）被 canvas-table 跨目录复用（cell-painters.js:17-18、layout.js:11-12）；`v-mu-scrollbar` 指令；全局 `sizechange` 事件（src/events/resize.js，ResizeObserver 驱动）。
- **错误处理**：探针读取 try/catch 保留上次快照（theme.js:168-173）；painter 未识别 region 形状按整幅兜底（painter.js:661-664）；编辑 commit/cancel 幂等。
- **测试方式**：无测试框架（package.json 无 test script）；demo 页面（`http://localhost:3000/<path>/`）+ playwright DOM/像素断言 + demo 内置 self-checks 断言面板。
- **文档三处同步**（AGENTS.md）：skills/mussel-ui/references/、docs/quick-reference_*.md、docs-site/——canvas-table 尚未同步（02-design.md S4 延后，需用户确认）。

## 约束与风险

- **canvas-table 全部为未提交工作区产物**（untracked），设计决策"优化 vs 重构"直接影响这 3696 行的处置；`.pipeline/` 同为 untracked。
- **canvas-table 依赖 table/ 的内部模块**（`../table/utils`、`../table/column-types`）：改动 table 列类型体系会波及 canvas-table 取值/绘制链。
- **编辑器复用依赖 form 组件内部结构**：combo-wrapper 根 class `mu-input` 与内部真实 `<input>`（聚焦查询）、`.mu-dropdown-panel` Teleport 面板 class（blur 兜底判定）、MuInput 200×32 固定尺寸（浮层 100% 覆盖）——form 组件结构变更会破坏 editor.js 适配层。
- **MuSwitch 无 focus/blur/keydown**（switch.vue:2 根是 div）：编辑器矩阵的 switch 专用路径（容器 tabindex=-1 承接 Esc）不可移除。
- **MuDateInput 无 datetime 类型**：datetime 列编辑精度只到日期。
- **enum 编辑提交值恒为 mapping key 字符串**（editor.js:19-20 注释、decisions I1前⑦）：数值型 enum 原 record 值编辑后类型变为 string。
- **MuInput type='number' 的 v-model 值类型**：原生 input v-model 默认产出字符串（无 `.number` 修饰）——number/currency 列经缺省映射编辑提交后 record 值可能由 number 变 string（推测，未实验验证）。
- **样式一致性遗留差异**：底部投影（--mu-shadow-float vs table.scss:155 硬编码双阴影）、check disabled 底衬（--mu-gray-translucent vs --mu-bg-strong）——已知的对齐偏差，非遗漏。
- **demo 遗留无效用法**：table-advanced demo 的 `table-width="fit-content"` 传给不存在的 prop。
- **z-index**：组件内部仅用 `--mu-z-index-above`；下拉面板自带 `--mu-z-index-popup`（Teleport body）。
- **约 90 万行浏览器滚动高度上限**（等高 36px 模型，02-design.md A3）：超出未定义行为，无压缩滚动。

## 验证方式

- 构建：`npm run build`（vite dev + prod 两次，UMD、Vue external）；验证记录：05-verify-2.md（exit 0，dist/mussel.js 511.72 kB / min 256.60 kB）。
- 样式：`npx stylelint "src/components/canvas-table/*.scss" --fix`（05-verify-2.md exit 0）。
- 无单元测试框架；验证 = demo 页 + playwright：`http://localhost:3000/data/canvas-table/`（自检面板 77 项、调试句柄 `window.__canvasTable`）、`http://localhost:3000/data/canvas-table-editable/`；rollup watch 模式常驻（3000 端口，直接访问不用重新打包）。
- demo 页按 `demo/src/<name>/` 组织（main-view.vue + main.js），catalog 登记（`demo/src/catalog.js`，增删页面需重启 demo:build）。

## 未解问题

1. 【用户决策类】canvas-table 未提交产物的处置（保留演进 / 重构弃置）——属设计决策非探索可解，事实基础见"约束与风险"第 1 条。
2. 【补探索/实验类】MuInput `type:'number'` 编辑提交值的实际类型（string vs number）及 number/currency 列编辑后 record 类型漂移影响——需最小实验确认（推测为 string）。
3. 【补探索类】`--mu-bg-strong` 未纳入 theme 快照导致 check disabled 底衬用 `--mu-gray-translucent` 等效——是否补齐该字段属设计层裁量，事实见 cell-painters.js:364-370 注释。
4. 【用户决策类】canvas-table 三处文档（skills/docs/docs-site）未同步（02-design.md S4 延后项）——新设计若复用该组件需一并规划。
