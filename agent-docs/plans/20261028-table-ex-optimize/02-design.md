# 设计

## 方案概述

四条主线（对应任务目标 1-4），改动集中在 `src/components/table-ex/` 与其 demo 页：

1. **enum 移除**：table-ex 侧删除全部 enum 特有逻辑（`layout.js` 类型默认宽条目、`editor.js` 类型→编辑器映射与数值枚举提交函数、各处注释）。DOM 版 mu-table 的列类型注册表（`table/column-types/enum.js`）不动——enum 是 table-ex 不再支持的类型，传入 `type: 'enum'` 后经通用类型系统渲染属不受支持的残留路径，无兼容层（decisions.md 已确认）。
2. **text/number 列 mappings/options**：新建零依赖模块 `mappings.js` 承载映射语义。列准备期（`prepareColumn`）为 text/number 列挂 `_mapText` 显示映射求值器（`mappings` 优先，仅 `options` 时由 options 转换映射表；`column.text` 优先时不挂）与 `_plainText` 直渲短路标记；`resolveCellContent` 映射求值非空即返回 `{ text }`；`row-geometry.js` 取值链同步应用映射（行高按显示文本估高）。编辑侧：text/number 列带 mappings/options 时编辑器缺省变 `select`，options 来源优先级 `editor.props.options > column.options > mappings 派生`。
3. **性能优化（P1/P2，度量方式见测试计划 #5）**：
   - P1a：`painter.js` 单元格级 `recordKeyOf` 调用收敛为行级一次（树关时完全跳过）；
   - P1b：`drawCell` 的 `onImageLoad` 契约改为 `(row, colIndex) => void` 处理器，逐格零参闭包改为仅 img 分支内创建；
   - P2：`resolveCellContent` 纯文本列短路（免 render 调用与两个中间对象分配）。
4. **可读性 / 复杂度 / 注释**（R1-R5，验收 6 的"复杂度重构点"即此清单）：R1 抽取 `mappings.js` 消除 editor/cell-painters 双份转换逻辑；R2 `resolveCellContent` 短路化；R3 `resolveEditorType` 分支表驱动化；R4 `paintBodyRow/drawCellClipped` 参数瘦身（recordKey 行级注入）；R5 功能触及的 7 个文件注释压缩为每段 ≤ 3 行。

## 遵循约定与复用

本项目无独立探索阶段，以下约定由设计者从改动涉及模块源码提取：

- **代码**：纯 JavaScript、Vue 3 Composition API `<script setup>`；无测试框架，验证 = `npm run build` + demo 页（`http://localhost:3000/data/table-ex/`，注意 URL 前缀 `/data/`）+ demo 自检面板。
- **模块隔离（沿用既有 A8 约定）**：`cell-painters.js` 不 import `theme.js/layout.js`；`editor.js` 不 import `layout.js/theme.js/cell-painters.js`。新增 `mappings.js` 为零依赖共享模块（仅 import `@/utils/type` 的 `isObject`），被 cell-painters 与 editor 共同引用，不违反上述禁令。
- **内部列字段命名**：下划线前缀（既有 `_raw/_align/_text/_value/_render/_maxLines/_maxItems/_resolveMaxLines/_isTreeColumn`），新增 `_mapText/_plainText` 同风格；导出函数驼峰。
- **复用**：`ensureFn` / `getPixelNumber` / `resolveColumnType`（`src/components/table/utils.js`、`table/column-types/index.js`）；`isObject`（`src/utils/type`）；mu-select options 格式 = `Array<{ value, label, disabled? }>`，纯字符串项视为 `{ value }`，`-` / `{is:'-'}` 为分隔项（`src/components/form/select.js` + `docs-site/components/select.md` L30）。
- **镜像常量**：跨模块常量一律进 `constants.js`（本次无新增常量）。
- **错误处理**：无 try/catch 惯例，非法入参快失败或静默回退（如 `resolveColumnType` 回退 TextColumn），新代码同风格。
- **自检**：断言位于 `demo/src/data/table-ex/self-checks/<模块>.js`，经 `self-checks/index.js` 的 `runChecks` 聚合，页面"自检结果"面板展示；断言辅助 `prepareColumn/resolveCellContent` 等直接从源码 import。
- **像素断言防漂移**（knowledge `canvas-pixel-assert-anchor-drift`）：锚点/口径变更时 grep 旧字面值全量扫 self-checks，逐个重算精确值断言。本次 enum→text 改写的夹具均带显式 `width` 且映射产物文本不变，像素断言数值预期不变，但仍须全扫确认。
- **不更新** docs / docs-site / skills 文档（任务约束，用户确认前）。

## 改动清单（含新增或修改的测试文件）

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table-ex/mappings.js` | 新增：`isMappableColumnType` / `mappingsFromOptions` / `selectOptionsFromMappings` / `createDisplayMapper` 纯函数 | 映射语义单一事实源；editor 与 cell-painters 共用（R1） |
| `src/components/table-ex/cell-painters.js` | `prepareColumn` 挂 `_mapText`/`_plainText`；`resolveCellContent` 映射分支 + 纯文本短路（P2）；`drawCell` 新增 `colIndex` 选项、`onImageLoad` 处理器化（P1b），img 分支内建闭包；注释压缩（R5） | 目标 1/2/3/4 |
| `src/components/table-ex/editor.js` | 删 `COLUMN_TYPE_EDITORS.enum`；`resolveEditorType` text/number + 下拉来源 → select；`usesDerivedOptions`/`resolveSelectOptions` 接入 `column.options`；`normalizeNumericEnumCommit` 更名 `normalizeDerivedSelectCommit`（逻辑不变）；注释压缩 | 目标 1/2/4 |
| `src/components/table-ex/layout.js` | `TYPE_DEFAULT_WIDTHS` 删 `enum` 条目；注释压缩 | 目标 1/4 |
| `src/components/table-ex/painter.js` | `paintBodyRow` 行级求 recordKey（P1a，树关跳过）；`drawCellClipped` 传 relay 处理器 + colIndex（P1b）；注释压缩 | 目标 3/4 |
| `src/components/table-ex/row-geometry.js` | `valueOf` 应用 `_mapText`（行高按显示文本）；`isTextPresentingColumn` 注释去 enum 字样；注释压缩 | 目标 2（正确性）/4 |
| `src/components/table-ex/table-ex.vue` | 仅注释压缩（无功能改动） | 目标 4 |
| `demo/src/data/table-ex/main-view.vue` | 默认列"状态" `type:'enum'` → `type:'text'`（mappings/editor 原样）；"启用"后新增"等级"列（`type:'number'` + `options` 数值选项 + 可编辑，colIndex 9）；"全类型默认宽"场景状态列 enum → text | 目标 1 的 demo 同步改写；验收 2 的 options 用例载体 |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | enum 夹具改写为 text+mappings；新增：mappings 优先于 options、仅 options 显示转换、prepareColumn `_mapText`/`_plainText` 判定、`onImageLoad` 新契约回归 | 验收 2；防回归 |
| `demo/src/data/table-ex/self-checks/editor.js` | enum 断言改写（text+mappings → select；无 mappings/options 的 select 值变化通道夹具需补显式 `editor.type:'select'` 或 mappings，避免退化为 input）；新增：仅 options 的 select 来源与提交类型、mappings 派生路径回归、`resolveEditorType` options 优先级 | 验收 2 |
| `demo/src/data/table-ex/self-checks/layout.js` | `TYPE_DEFAULT_WIDTHS` 断言表删 enum 行（条目数断言与 check 名称 14 → 13） | 验收 1 |
| `demo/src/data/table-ex/self-checks/painter.js` | 3 处 enum 夹具（L68/L1161/L1200）改写 text+mappings（width/mappings 原样，像素断言数值不变） | 验收 1/4 |
| `demo/src/data/table-ex/self-checks/row-geometry.js` | 新增 1 条：映射文本参与**精算**行高（`ensureRowMeasured`：列配 `maxLines: 2` + 窄列长映射标签 → 行数 > 1；`computeRowHeights` 估高按设计恒 1 行下界，不作断言） | 验收 2（row-geometry 联动） |

不改动：`theme.js`、`text-wrap.js`、`tree.js`、`interactions.js`、`row-geometry-controller.js`、`use-tree-rows.js`、`use-column-resize.js`、`constants.js`、`index.js`（无新导出需注册）、`table/` 目录（DOM mu-table 的 enum 保留）、`self-checks/index.js`、`self-checks/{theme,tree,text-wrap,interactions}.js`。

## 接口 / 数据结构

### 1. `mappings.js`（新增）

```js
import { isObject } from '@/utils/type'

// 映射值 → 显示文本：对象形态取 .text，其余原样
function mappingTextOf (value) // → isObject(value) ? value.text : value

/** 可映射列类型：type 为 undefined/null/''/'text'/'number'（对象/函数自定义类型与其余字符串类型不可映射） */
export function isMappableColumnType (type) // → Boolean

/** mu-select options 数组 → 显示映射表 { [String(value)]: label }
    规则（与 select.js optionLabels 同口径）：null/''/'-' 跳过；
    对象项 value == null 或带 is（分隔/自定义组件项）跳过；label 缺省取 value；
    纯字符串项 → { [item]: item }。非数组入参返回 null */
export function mappingsFromOptions (options) // → Object|null

/** mappings Object → mu-select options [{ value, label }]（value = key 字符串，
    label = mappingTextOf(值)，排除 'default'）——现 resolveSelectOptions 内联逻辑收敛于此 */
export function selectOptionsFromMappings (mappings) // → Array

/** 列显示映射求值器：map = column.mappings ?? mappingsFromOptions(column.options)，
    map 为空返回 null（无映射）。求值：value == null → null（空值不映射，走占位链）；
    命中 map[String(value)] → mappingTextOf；未命中 → map.default ?? 原值 */
export function createDisplayMapper (column) // → ((value) => text|原值|null) | null
```

空值语义：`value == null` 不映射；text 列经 `_plainText` 直出 null 落占位链，number 列跳过映射分支回退 `Intl` 渲染（`formatter.format(null)` 得 `0`，沿用现状）。

优先级固化在 `createDisplayMapper`：`mappings` 与 `options` 同时定义时显示映射只取 `mappings`。

### 2. `prepareColumn` 新增内部字段（cell-painters.js）

```js
col._mapText = !column.text && isMappableColumnType(column.type) ? createDisplayMapper(column) : null
col._plainText = !column.text && !column.multiline && !canvasOnlyKind &&
  (column.type == null || column.type === '' || column.type === 'text')
```

`_mapText` 在 `column.text` 存在时置 null：显示侧 `_text` 优先、不参与映射（见 §3 首行）；`row-geometry.valueOf` 无 `_text` 分支，若仍挂 `_mapText` 会按映射值估高、按 `text` 输出绘制，行高与文本分裂。两字段须在现有 `canvasOnlyKind` 求值之后挂载（`const` TDZ）。

`_plainText` 语义：非 multiline 的原生 text 列（type 缺省/''/'text'），`TextColumn.compile` 非 multiline 产物恒 `({value}) => ({text: value})`（`table/column-types/text.js` L5-6），可跳过 render 调用。不做 `resolveColumnType(type) === TextColumn` 身份判定——`column-types/index.js` 只导出 `resolveColumnType` 不再导出 TextColumn，身份判定需耦合 `column-types/text.js` 内部路径，收益仅覆盖"直接传 TextColumn 对象"的罕见形态（该形态走 render 路径结果恒等，无正确性影响）。

### 3. `resolveCellContent`（签名不变，行为扩展）

```js
export function resolveCellContent (col, { record, recordNumber, emit }) {
  const text = col._text(record)
  if (text != null) return { text }          // column.text 自定义显示优先，不参与映射

  const value = col._value(record) ?? (col.field ? record[col.field] : undefined)

  // P2 短路：纯文本列免 render 调用与中间对象（映射命中/未命中均终结于此）
  if (col._plainText) return { text: col._mapText ? col._mapText(value) : value }
  // _mapText(value) 仅在 value == null 时返回 null，其余返回映射文本或原值

  // 一般路径：映射器返回非 null（命中 / default / 原值回退）即终结，number 列不再走 Intl
  if (col._mapText) {
    const mapped = col._mapText(value)
    if (mapped != null) return { text: mapped }
  }

  const { class: _class, style: _style, title: _title, ...params } =
    col._render({ record, recordNumber, value, emit }) || {}
  return params
}
```

### 4. `drawCell` 选项契约变更（cell-painters.js / painter.js）

```js
// 旧：onImageLoad: () => void（painter 逐格创建闭包）
// 新：onImageLoad: (row, colIndex) => void 处理器；drawCell 新增选项 colIndex: Number
// 闭包创建点下沉到 img 消费分支（measureItem kind==='img' 与 drawCellImage）：
requestImage(src, onImageLoad ? () => onImageLoad(row, colIndex) : undefined)
// hooks（drawItems/measureItem/drawItem/drawCellImage）增携 row/colIndex；非 img 格零闭包分配
```

兼容性：零参闭包（`() => notified++` 形态，self-checks 现用）被以 `(row, colIndex)` 调用时行为不变。

### 5. `painter.js` 热路径

```js
// P1a：paintBodyRow 内行级一次求值（置于 record == null 早退之后；树关时为 null，drawTreeAffordance 不消费）
const recordKey = state.flatInfo ? recordKeyOf(state, record, r) : null
// 经 drawCellClipped(..., recordKey) 注入 drawCell（选项名不变）

// P1b：withImageRelay 已是 (row, col) 处理器（painter.js:1229，签名不变）；drawCellClipped 改传处理器：
onImageLoad: state.onImageLoad   // relay 已在 apply() 时注入 state，不再逐格包装
```

### 6. `editor.js`

```js
export const COLUMN_TYPE_EDITORS = {
  text: 'input', number: 'input', currency: 'input',
  date: 'date', datetime: 'date', bool: 'switch'          // enum 条目删除
}

// 下拉来源判定（局部函数）：三处任一非空即有 select 来源
function hasSelectSource (column) // → editor?.props?.options != null || column?.options != null || column?.mappings != null

// resolveEditorType 分支重排：
//   ① column.editor.type 显式合法 → 直取
//   ② typeName ∈ {text, number}（type 缺省按 text）且 hasSelectSource → 'select'
//   ③ typeName === 'text' → resolveTextLikeEditorType（开值/maxLines 判 input/textarea）
//   ④ 其余 → COLUMN_TYPE_EDITORS[typeName] || 'input'

// select options 来源优先级（resolveSelectOptions）：
//   editor.props.options（原样）> column.options（原样）> selectOptionsFromMappings(column.mappings) > []

// 派生 options 判定（usesDerivedOptions，控制 String 化开值与数值回写）：
//   editorType === 'select' && editor.props.options == null && column.options == null
//   （即 options 来自 mappings key 字符串化；显式 column.options / editor.props.options 的值携带原类型，直通）

// normalizeNumericEnumCommit → 更名 normalizeDerivedSelectCommit（逻辑不变：null→null，其余 Number 有限则数值）
// normalizeCommitValue 规则 ② 调用点同步更名；规则内容不变
```

### 7. `row-geometry.js` `valueOf`

```js
function valueOf (col, record) {
  const fromFn = typeof col._value === 'function' ? col._value(record) : undefined
  const value = fromFn ?? (col.field ? record?.[col.field] : undefined)
  if (col._mapText) {
    const mapped = col._mapText(value)
    if (mapped != null) return mapped     // 估高/精算/数组判定按显示文本
  }
  return value                            // 数组原值穿透（映射未命中），isTextPresentingColumn 数组路径不受影响
}
```

### 8. demo 列定义（验收 2 载体）

```js
// 默认列"状态"（enum → text，mappings/editor 原样，编辑器缺省变 select）：
{ caption: '状态', field: 'status', type: 'text', width: 100, sortable: true,
  mappings: STATUS_MAPPINGS, editable: true, editor: true }

// 新增"等级"列（插在"启用"之后，colIndex 9，既有可编辑列 3-8 索引不变）：
const LEVEL_OPTIONS = [{ value: 1, label: '低' }, { value: 2, label: '中' }, { value: 3, label: '高' }]
{ caption: '等级', field: 'level', type: 'number', width: 90,
  options: LEVEL_OPTIONS, editable: true, editor: true }
```

## 被拒绝的备选

1. **保留 enum 作为 text+mappings 的语法糖（兼容层）**——decisions.md 明确"enum 直接移除、不做兼容层"，不得推翻。
2. **删除 `table/column-types/enum.js`（注册表整体移除）**——该注册表由 DOM 版 mu-table 共用（`table/column-types/index.js` 导出 EnumColumn），删除破坏 mu-table 既有用户，超出任务范围（目标 1 限定 `src/components/table-ex/`，验收 1 限定 table-ex 源码）。
3. **mappings/options 扩展到全部列类型**——任务限定 text/number；currency/date/bool 等类型的 render 语义（格式化、开关）与映射的叠加次序未定义，扩展属范围外臆测。
4. **`resolveCellContent` 结果按 record 缓存（WeakMap）**——失效维度多（编辑提交就地改 record、hover 无关但 items 数组重建、record 字段外部突变），缓存正确性成本高于收益；短路方案（P2）以更小改动拿到主要收益。
5. **`onImageLoad` 按"列类型是否 img"短路闭包创建**——自定义类型 render 也可产出 `is:'img'` 条目，按类型白名单会丢失这些格的 onload 重绘；采用全列统一 `(row, colIndex)` 处理器 + img 分支内建闭包，语义无损。
6. **注释精简扩展到未被功能触及的 8 个模块（theme/text-wrap/tree/interactions/row-geometry-controller/use-*/constants）**——验收 6 只约束"改动代码"；全量重写引入大 diff 审查面，且 theme.js 相对色求值等注释是防错知识锚点，压缩风险大于收益。若 amender 认为目标 4 要求全量覆盖，可追加纯注释步骤（见未解问题 3）。

## 风险与回滚

| 风险 | 缓解 |
|---|---|
| `onImageLoad`/`colIndex` 契约变更破坏自检或未知消费方 | grep 全仓 `onImageLoad`：仅 cell-painters/painter 与 self-checks/cell-painters 三处；同批更新；零参闭包天然兼容 |
| 映射文本参与估高改变行高（新特性列）：长标签在窄列折行 | 属预期正确性行为；估高/精算/绘制三链同源 `_mapText`，不会分裂；列配置视为静态（`estimateColumnSignature` 不含 mappings，与既有 text/value 函数同口径，运行期改 mappings 不触发重扫）；demo 等级列 width 90 足够单行 |
| enum 移除后残留路径（外部仍传 `type:'enum'`）：显示经 table 注册表照常渲染、编辑器回退 input、宽度走 `_fallback` | decisions.md 确认无兼容层；设计文档明示为不受支持路径，不加警告代码 |
| P1/P2 收益小、被度量噪声淹没 | 判据定为"无回退"（中位数 ≤ 基线 ×1.10，超出复测一轮），改进为方向性期望而非硬承诺 |
| 注释压缩误删算法不变量说明（Fenwick、估高签名、锚定补偿） | 保留压缩表述（≤3 行/段）指向关键点；评审重点核对 |
| 像素断言随改写漂移（knowledge 陷阱） | enum→text 夹具显式 width 且映射文本不变，断言数值预期不变；注意 `_align` 由 center 变 left（EnumColumn.align='center'，TextColumn 无 align），现有断言未采样这些格的文字坐标；实施时仍 grep `'enum'` 与旧字面值全扫 self-checks 逐一核对 |
| 回滚 | 改动收敛于单分支连续提交，`git revert` 整批回滚；demo watch 自动重建，无迁移/数据风险 |

## 测试计划

验证环境：优先 playwright mcp；不可用时以 `npm run build` + 代码检查兜底并在报告注明，浏览器依赖项标 UNVERIFIED。demo 页 URL：`http://localhost:3000/data/table-ex/`。

| # | 验收标准 | 手段 | 检查方式 |
|---|---|---|---|
| 1 | table-ex 源码无 enum 处理逻辑 | `命令` | `grep -rn "enum" src/components/table-ex/` 0 命中（含注释；Windows bash 下 `grep -rn enum D:/workshop/cheap-pets/mussel/src/components/table-ex/ \|\| echo CLEAN`） |
| 2 | text/number 列 mappings 显示映射生效且优先；options 作编辑下拉；仅 options 时显示按转换映射 | `浏览器` + demo 自检 | ① 自检面板（页面加载自动跑）0 failed：新增断言含——`prepareColumn({type:'text', mappings:{a:'甲'}, options:[{value:'a',label:'乙'}]})` 取值 `a` → `resolveCellContent` text `'甲'`（优先级）；仅 `options:[{value:1,label:'低'}]` + 值 1 → `'低'`、未命中值 5 → `resolveCellContent` text = `5`（原值回退，绘制经 `String()` 为 `'5'`）；`type:'number'` + `mappings:{2:'中'}` 值 2 → `'中'`（number 列映射）；`resolveEditorType` 三来源 → `'select'`；`resolveSelectOptions` 优先级；number+options 提交值保持 number。② playwright 交互（知识 `table-ex-demo-interaction-verify`）：默认舞台 960px 下等级列（colIndex 9）左缘 ≈964px，初始在画布视口外——复位 scrollTop=0 后按 `getLayoutInfo().colWidths` 前缀和求左缘，设 `.mu-table-ex__scroll` 的 scrollLeft 使该列可见（等 ≥80ms，以 `getCellRect(0,9).x ∈ [0, canvas.clientWidth)` 自检）→ 取格中心坐标 → 派发带 clientX 的 pointerdown/pointerup/click → 等 ≥80ms → `.mu-table-ex__editor` 内 `.mu-select` 存在 → 点击 `.mu-select` 展开 → `.mu-dropdown-panel .mu-option` 文本 = 低/中/高 → 点"中" → 事件日志 `.ct-event-log__item` 首条含 `"value":2` → 点击名称列（colIndex 2，非编辑格）提交关闭。③ 复位 scrollLeft=0 后，状态列（colIndex 3）同法开下拉，选项 = 启用/待处理/已归档（mappings 派生、无 default） |
| 3 | `npm run build` 通过 | `命令` | `npm run build` 退出码 0 |
| 4 | demo 页渲染正常：映射列显示映射值；可编辑下拉列编辑态正常 | `浏览器` | ① 页面自检面板 0 failed。② 像素采样（知识 `table-ex-performance-profiling`：数暗像素 lum<100）：scrollLeft=0 时 `getCellRect(0,3)`（'启用'）格内暗像素 > 30；横滚至 colIndex 9 可见（口径同 #2②）后 `getCellRect(0,9)`（'低'）> 30；空值占位列（colIndex 13）横滚至可见后对照格 < 10。③ 交互同 #2 ②③ |
| 5 | 性能优化点度量方式列明；实施后复核无回退 | `浏览器`（playwright evaluate 采样脚本） | 度量方法（M1/M2，impl 步骤 0 采基线、verify 复测同法；`host` = `.mu-table-ex` 元素）：默认场景 100k 行，复位 `scrollTop/scrollLeft=0`，连续 7 次 `host.__vueParentComponent.props.records = host.__vueParentComponent.props.records.slice()`，每次后等 100ms 读 `__tableEx.getLayoutInfo()` 的 `lastPaint.elapsed`（M1，P1/P2 收益面；等级列左缘 964px 在视口外不参与绘制，基线/改后可视列一致）与 `lastRelayout.elapsed`（M2，mapping 进入估高扫描的成本面；按 `elapsed / (行数 × props.columns.length)` 归一化，抵消 S8 新增等级列带来的 +1 列扫描量），并核对 `lastRelayout.scanCount = 100000`（防签名命中跳过扫描），各取中位数。判据：改后中位数 ≤ 基线 ×1.10；超出复测一轮取较优，仍超出记回退（FAIL）。M1 预期方向下降；M2 预期持平（status 1 列映射 + 新增等级 1 列） |
| 6 | 改动代码注释每段 ≤3 行；复杂度重构点有说明 | `命令` + `人工` | 复杂度重构点 = R1-R5（见方案概述第 4 条）。注释检查：node 脚本扫描 7 个改动源文件的连续 `//` 行块与 `/* */` 块，任一块 >3 行输出文件:行号，要求 0 输出（脚本由实施落在临时命令行，不入库）。`人工`：评审抽样核对压缩后注释未丢失关键算法锚点 |

## 实施步骤

流水线并发数 1（全串行执行）；G 组标注仅表示文件集合不相交、逻辑互不依赖。

- **S0 性能基线采集**（依赖：无；文件：无改动）
  完成判据：改动前 HEAD（7113e14 分支 mussel-table）上按测试计划 #5 的 M1/M2 各得一组基线中位数，记录进实施报告（demo watch 已在跑，直接访问页面采样）。
- **S1 新建 `mappings.js`**（依赖 S0——任何源码改动前必须先采基线）
  完成判据：文件存在且仅依赖 `@/utils/type`；`npm run build` 通过（未引用不破坏构建）。文件集合：`src/components/table-ex/mappings.js`。
- **G2（依赖 S1，组内步骤文件集合两两不相交）**
  - **S2 `cell-painters.js` + `row-geometry.js`**：`prepareColumn` 挂 `_mapText`/`_plainText`、`resolveCellContent` 短路与映射分支、`drawCell` colIndex/onImageLoad 契约、img 分支闭包下沉、`row-geometry.valueOf` 映射、两文件注释压缩。完成判据：`grep -n "onImageLoad" src/components/table-ex/cell-painters.js` 显示处理器仅在 img 分支内建闭包；`npm run build` 通过（全仓 onImageLoad 收敛在 S6 验证；本步后 painter.js:417 仍为兼容的零参闭包，属预期中间态）。文件集合：`cell-painters.js`、`row-geometry.js`。
  - **S3 `editor.js`**：enum 条目删除、`hasSelectSource`/`resolveEditorType` 重排、`usesDerivedOptions`/`resolveSelectOptions` 接 `column.options`、`normalizeDerivedSelectCommit` 更名、注释压缩。完成判据：`grep -n "enum" src/components/table-ex/editor.js` 0 命中。文件集合：`editor.js`。
  - **S4 `layout.js`**：`TYPE_DEFAULT_WIDTHS` 删 enum、注释压缩。完成判据：grep 0 命中。文件集合：`layout.js`。
  - **S5 `table-ex.vue`**：注释压缩（无功能改动）。完成判据：注释扫描脚本 0 输出。文件集合：`table-ex.vue`。
- **S6 `painter.js`**（依赖 S2：drawCell 新契约先落地）
  完成判据：`recordKeyOf` 调用点从 drawCellClipped 移至 paintBodyRow；`withImageRelay` 仍是 `(row, col)` 处理器（签名不变，painter.js:1229）；`grep -rn "onImageLoad" src demo/src/data/table-ex/self-checks` 仅剩新契约调用点（cell-painters 处理器 + painter 直传 `state.onImageLoad` + self-checks 回调）；`npm run build` 通过。文件集合：`painter.js`（含注释压缩）。
- **S7 集成构建检查**（依赖 S2-S6；共享判据步骤）
  完成判据：`npm run build` 通过 + `grep -rn "enum" src/components/table-ex/` 0 命中 + 注释扫描脚本对 7 个源文件 0 输出。
- **S8 demo 同步**（依赖 S2-S6）
  文件集合：`main-view.vue`、`self-checks/{cell-painters,editor,layout,painter,row-geometry}.js`。
  完成判据：`grep -rn "enum" demo/src/data/table-ex/` 0 命中；按 knowledge `canvas-pixel-assert-anchor-drift` 全扫 self-checks 中 enum 相关旧字面值（`'启用'`、width 100 断言等）逐一核对像素断言；等级列插入后 colWidths 断言（若有按列数的）同步。
- **S9 验证**（依赖 S7、S8）
  完成判据：按测试计划 #1-#6 逐项执行并记录；M1/M2 复测无回退；playwright 不可用时按任务约定标注 UNVERIFIED 并注明。

## 未解问题

1. **mappings-only（无 options）的 text 列编辑器缺省改为 select**：任务未明说此形态的编辑器形态；本设计按"完整替代 enum"选定 select（demo 状态列即此形态，行为与改前 enum 列一致）。若 amender 认为应保持 input（编辑原值、仅显示映射），改 `hasSelectSource` 去掉 `column.mappings` 一项即可，影响面：editor.js 单函数 + demo 状态列需配 `editor:{type:'input'}` 或接受 input 编辑。**amender 裁定（2026-10-28）：维持 select**——任务以 mappings/options 完整替代 enum，demo 状态列原 enum 行为即 select 编辑，改为 input 会使该列编辑退化。关闭。
2. **`type:'enum'` 残留路径的处置**：table-ex 不再识别 enum，但 table 注册表仍含 EnumColumn，传入后显示仍会映射（渲染层残留）而编辑器回退 input。本设计不加 console.warn（无兼容层）；是否需要显式拒绝请 amender 裁定。**amender 裁定：不加 warn/拒绝代码**——decisions.md 已定不做兼容层，验收 1 只要求 table-ex 源码无 enum 处理逻辑；残留路径已在风险表记录。关闭。
3. **注释精简是否覆盖未被功能触及的 8 个模块**：本设计限定功能触及的 7 个文件（见被拒绝备选 6）；若按目标 4 字面全量覆盖，需追加纯注释步骤（S5 扩围），请 amender 裁定。**amender 裁定：维持 7 个功能触及文件**——验收 6 限定"改动代码注释"，未触及模块不在范围。关闭。
4. **知识库过期条目**：`agent-docs/knowledge/INDEX.md` 中"prepareColumn({type:'enum'}) 缺 mappings 即抛"陷阱在本次改动后失效（text 列不抛）。知识沉淀在任务收尾由主会话按 project-knowledge 流程处理，不属本设计写入范围。**amender 裁定：不属本设计范围，保持。关闭。**
