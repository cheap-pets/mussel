/**
 * canvas-table 编辑状态机（02-design.md A5）。
 *
 * 职责：只读判定（表格级 + 列级）、编辑器组件/props 解析（enum options 由
 * mappings Object 转 [{value,label}] Array 且排除 default；text 列缺省
 * 按开值形态与 maxLines 判定 textarea/input，评审 6 P6 行级求值）、整格矩形
 * 定位（20261027 问题 3：EDITOR_GAP 内缩口径作废，全编辑器类型同矩形 =
 * editorRectOf(格矩形) 恒等映射，边框与格线直接重叠，hover 描边经
 * painter import 同一函数同源）、编辑按钮区矩形 editorButtonRectOf
 * （20261027 问题 5，painter 绘制与壳命中共用的单一事实源）、
 * 分类型提交矩阵（input 走 Enter；
 * textarea Ctrl/Cmd+Enter 显式提交、Enter 换行；
 * select/date/switch 走值变化即提交；画布 pointerdown / 容器滚动同步提交；
 * blur 延迟兜底）、Esc 取消、validate 校验（失败不关闭不失焦）、commit 幂等、
 * 值类型规整层（normalizeEditorOpenValue / normalizeCommitValue）。
 *
 * blur 延迟兜底判据（decisions「[I1 前]①」修订设计 A6：三条同时满足才提交）——
 *   ① editing 仍在；
 *   ② 焦点不在 __editor 容器内；
 *   ③ 非「焦点在 .mu-dropdown-panel 内 或 最近一次 window pointerdown 目标
 *      在 .mu-dropdown-panel 内」。mu-icon-button 为无 href 的 <a> 不可聚焦
 *      （03-review-3 Blocker 1），activeElement 判据单独不成立，故编辑开启
 *      期间在 window 捕获阶段记录 pointerdown 目标，面板内交互（日期面板
 *      月份切换等）不触发兜底提交。
 *
 * 值类型规整层（A5.5，03-review-3 问题 3 概括补全 + 本期 ④⑤）：
 *   number/currency 列（input）提交收敛为 number 或 null（非数值输入保留原
 *   字符串、交由 validate 拦截）；数值型枚举提交按编辑前值类型回写 number；
 *   textarea 数组原值 → 换行分割的字符串数组（元素一律字符串、空行保留，
 *   对象属性不随编辑保留——A8 #21）；textarea 数字原值类型保持。
 *
 * 模块隔离（A8）：不 import layout.js / theme.js / cell-painters.js（跨模块
 * 镜像常量经零依赖的 constants.js 引入）；定位所需的布局数据（rowGeometry）
 * 由组件壳经参数传入（定位只依赖格几何，gridlines/theme 参数已随 EDITOR_GAP
 * 内缩口径作废一并删除，20261027 问题 3）。
 *
 * 组件壳（canvas-table.vue）对接契约：
 * - const editor = createEditorController({ onCommit })，setup 内创建（值变化
 *   watch 随组件自释放）；onCommit 收到 { record, recordIndex, column, value }
 *   （record/column 为原始引用，非 reactive 代理），壳内 emit('update:cell-value',
 *   payload) 并 nextTick 重绘该行（A3 数据契约①，多行列含行高重估 + 锚定）；
 * - 模板（A6）：__editor 容器 v-if="editor.state.editing"、
 *   :style="editing.style"、:class（bordered === false 时挂 --borderless）、
 *   @keydown.esc="editing.onEsc"、tabindex="-1"，内部
 *   <component :is="editing.component" v-model="editing.value"
 *   :invalid="editing.invalid || null" v-bind="editing.props" v-on="editing.events" />；
 *   invalid/message 经容器 :title 显示错误文案；
 * - 打开：click 命中可编辑格（resolveCellClickOpen 判定）调 editor.open({
 *   column, record, recordIndex, editable, style, bordered, getEditorEl })，
 *   style 用 computeEditorStyle(...) 产出（布局/编辑器类型传参）；
 *   getEditorEl 返回 __editor 容器元素；聚焦由壳 focusEditor 承担（input/select/
 *   date 聚焦内部 input、textarea 聚焦 textarea 元素、switch 聚焦容器），
 *   未传 getEditorEl 时兜底判据②跳过；
 * - 画布 pointerdown（editing 中，先提交再续行命中）与容器滚动：调 editor.commit()；
 * - 卸载：editor.destroy()（onUnmounted）。
 */
import { markRaw, reactive, watch } from 'vue'
import { isFunction, isObject, isString } from '@/utils/type'

import {
  CELL_PADDING_FALLBACK,
  CELL_LINE_HEIGHT_FALLBACK,
  ROW_TOP_INSET,
  EDITOR_BUTTON_AREA
} from './constants'
import { MuInput, MuSelect, MuDateInput, MuSwitch } from '../form/index.js'

/**
 * 不可编辑的列类型（A6 只读控制；link 20261027 起恢复不可编辑——用户清单 4，
 * decisions [S1]，推翻 20261025「link 本期起可编辑」人工决定；button/progress
 * 为 canvas 专属展示类型一并排除）。
 * image 为 img 在列类型注册表的别名（column-types/index.js），一并排除。
 */
export const NON_EDITABLE_TYPES = ['rec_no', 'img', 'image', 'tag', 'check', 'link', 'button', 'progress']

/**
 * 编辑器类型 → mussel 输入组件（form/index.js 导出名，A6）。
 * textarea 为原生元素 tag 字符串（复用 form INPUT_TYPES.memo 约定：原生
 * <textarea class="mu-input"> + v-model——mussel 无独立 textarea 输入组件，
 * 人工 2 意见 2）。组件模板对 textarea 编辑器分支渲染真实 <textarea v-model>
 * 元素（vModelText 语义；经 <component :is> 渲染时 v-model 编译为 modelValue
 * prop 不生效，见 canvas-table.vue 模板注）。
 */
export const EDITOR_COMPONENTS = {
  input: MuInput,
  select: MuSelect,
  date: MuDateInput,
  switch: MuSwitch,
  textarea: 'textarea'
}

/** 下拉/日期面板根 class（dropdown-panel.vue，Teleport 到 body） */
export const DROPDOWN_PANEL_SELECTOR = '.mu-dropdown-panel'

/**
 * 编辑浮层/hover 描边矩形（单一事实源：hover 描边与浮层盒同源，painter.js
 * paintHoverEditorStroke import 同一函数——模块隔离例外沿用）。
 * 20261027 问题 3：EDITOR_GAP=4 内缩口径作废（decisions [S1]），改为恒等
 * 映射 = 整格矩形——hover 描边与编辑输入框边框直接与单元格边框重叠。
 *
 * @param {{ x: Number, y: Number, width: Number, height: Number }} rect 单元格矩形
 * @returns {{ left: Number, top: Number, width: Number, height: Number }}
 */
export function editorRectOf (rect) {
  return {
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height
  }
}

/**
 * 列定义自定义编辑按钮（column.editorButton，20261027 问题 5）的命中/绘制区
 * 矩形（单一事实源：painter 绘制与组件壳命中共用）。区右缘贴格内容区右缘
 * （right-align：x = 格右 − padding − EDITOR_BUTTON_AREA），垂直中心 = 首行
 * 行框槽位锚 rect.y + ROW_TOP_INSET + padding + lineHeight/2（与单元格文字
 * 垂直锚、树箭头中心同一公式，Q2 统一槽位式；不使用 rect.height——超高行中
 * 与多行首行同高）。图标 EDITOR_BUTTON_ICON_SIZE 居中于 EDITOR_BUTTON_AREA 区。
 *
 * @param {{ x: Number, y: Number, width: Number, height: Number }} rect 单元格矩形
 * @param {Object} [options]
 * @param {Number} [options.padding=CELL_PADDING_FALLBACK] 单元格内容区 padding
 * @param {Number} [options.lineHeight=CELL_LINE_HEIGHT_FALLBACK] 行框高（--cell-line-height 镜像缺省）
 * @returns {{ x: Number, y: Number, width: Number, height: Number }}
 */
export function editorButtonRectOf (
  rect,
  { padding = CELL_PADDING_FALLBACK, lineHeight = CELL_LINE_HEIGHT_FALLBACK } = {}
) {
  const centerY = rect.y + ROW_TOP_INSET + padding + lineHeight / 2

  return {
    x: rect.x + rect.width - padding - EDITOR_BUTTON_AREA,
    y: centerY - EDITOR_BUTTON_AREA / 2,
    width: EDITOR_BUTTON_AREA,
    height: EDITOR_BUTTON_AREA
  }
}

/** 列类型 → 编辑器类型缺省映射（A6；column.editor.type 显式指定优先） */
const COLUMN_TYPE_EDITORS = {
  text: 'input',
  number: 'input',
  currency: 'input',
  enum: 'select',
  date: 'date',
  datetime: 'date',
  bool: 'switch'
}

/**
 * 单元格只读判定（A6 只读控制）：
 * editable !== false（表格级总开关）&& column.editable !== false（列级强制只读）
 * && column.editor != null && 列类型不在排除清单。
 *
 * @param {Object} params
 * @param {Boolean} [params.editable=false] 表格级 editable
 * @param {Object} [params.column] 列定义（原始或已准备）
 * @returns {Boolean}
 */
export function isCellEditable ({ editable = false, column } = {}) {
  return (
    editable !== false &&
    column != null &&
    column.editable !== false &&
    column.editor != null &&
    !NON_EDITABLE_TYPES.includes(column.type)
  )
}

/**
 * text 列编辑器形态判定（评审 6 P6 行级求值）：函数形态 lineClamp 的
 * legacy 列按 record 求值（与 drawText/computeRowHeights 同源，行高与编辑器
 * 形态必然一致），否则取列配置 _maxLines/maxLines；开值为数组或 maxLines > 1
 * → 'textarea'，否则 'input'。
 */
function resolveTextLikeEditorType (column, rawValue, record) {
  const resolveMaxLines = typeof column?._resolveMaxLines === 'function'
    ? column._resolveMaxLines(record)
    : (column?._maxLines ?? column?.maxLines ?? 1)

  return Array.isArray(rawValue) || resolveMaxLines > 1 ? 'textarea' : 'input'
}

/**
 * 编辑器类型解析（A5.5）：column.editor.type 显式指定优先（非法值回退）；
 * text 列缺省按开值形态与 maxLines 判定——开值为数组或
 * column._resolveMaxLines(record) > 1（行级求值，评审 6 P6）→ 'textarea'，
 * 否则 'input'（link 列已列入 NON_EDITABLE_TYPES 不可进入编辑，20261027
 * 问题 4）；其余列按类型映射（enum → select、date/datetime → date、
 * bool → switch），未知列类型回退 input。
 *
 * @param {Object} column 列定义（组件壳传已准备内部列，含 _resolveMaxLines）
 * @param {Object} [options]
 * @param {*} [options.rawValue] 开值（open 取值链原值，未规整）
 * @param {Object} [options.record] 行记录（_resolveMaxLines 行级求值入参）
 * @returns {'input'|'select'|'date'|'switch'|'textarea'}
 */
export function resolveEditorType (column, { rawValue, record } = {}) {
  const explicit = column?.editor?.type

  if (explicit && EDITOR_COMPONENTS[explicit]) return explicit

  // 无 type 列回退 text（resolveColumnType(undefined) 同回退 TextColumn，A3.5）
  const typeName = column?.type == null ? 'text' : column.type

  if (typeName === 'text') {
    return resolveTextLikeEditorType(column, rawValue, record)
  }

  return COLUMN_TYPE_EDITORS[typeName] || 'input'
}

/**
 * select 是否走 mappings 派生 options（A5.5 规整层锚定输入）：select 编辑器
 * 且未显式配 editor.props.options（派生 options 的 value = mapping key 字符串，
 * 提交值类型规整需按此区分；显式 options 原样透传，属范围边界 #14 例外）。
 *
 * @param {Object} column 列定义
 * @param {String} editorType 编辑器类型
 * @returns {Boolean}
 */
export function usesDerivedOptions (column, editorType) {
  return editorType === 'select' && column?.editor?.props?.options == null
}

/**
 * 编辑开值规整（A5.5 open 链）：
 * - select + 派生 options → value == null ? value : String(value)（消除 MuSelect
 *   `in` 运算符隐式转换依赖，select.js:72-87 宽松命中）；
 * - textarea + 数组 → 元素逐个取 caption（link 对象数组取 caption、纯字符串/
 *   数字数组直接元素）后换行拼接；
 * - textarea + 非数组 → value == null ? '' : String(value)；
 * - 其余原样（input 保留 number 原型、date 原样）。
 *
 * @param {Object} params
 * @param {Object} [params.column]
 * @param {String} [params.editorType]
 * @param {*} [params.value] 开值原值
 * @returns {*} 规整后的编辑态初始值
 */
export function normalizeEditorOpenValue ({ column, editorType, value } = {}) {
  if (editorType === 'select' && usesDerivedOptions(column, editorType)) {
    return value == null ? value : String(value)
  }

  if (editorType === 'textarea') {
    return Array.isArray(value)
      ? value.map(el => el?.caption ?? el).join('\n')
      : (value == null ? '' : String(value))
  }

  return value
}

/** Number() 有限 → 数值，否则保留原值（交 validate 拦截或原类型保持） */
function toFiniteNumber (value) {
  const numeric = Number(value)

  return Number.isFinite(numeric) ? numeric : value
}

/**
 * number/currency input（①）与 textarea 数字原值（⑤）共用的数值收敛：
 * null/'' → null（先于 Number()，防 Number(null)===0 / Number('')===0），
 * 其余经 toFiniteNumber（number 原值经 Number() 恒等——含 NaN/Infinity/-0，
 * 与「typeof number 直接返回」等价，类型保持）。
 */
function normalizeNumericCommit (value) {
  if (value == null || value === '') return null

  return toFiniteNumber(value)
}

/** 派生 options select 数值原值（②）的数值收敛：仅 null → null（'' 按 Number() 转换） */
function normalizeNumericEnumCommit (value) {
  if (value == null) return null

  return toFiniteNumber(value)
}

/**
 * textarea 提交规整（④⑤）：数组原值 → value.split('\n')（数组值编辑 = 换行
 * 分割成数组，元素一律字符串、空行保留为 ''——所见即所得）；数字原值类型保持
 * （normalizeNumericCommit）；字符串原值 → 字符串原样（含换行）。
 */
function normalizeTextareaCommitValue (rawValue, value) {
  if (Array.isArray(rawValue)) return value.split('\n')

  if (typeof rawValue === 'number') return normalizeNumericCommit(value)

  return value
}

/**
 * 编辑提交值规整（A5.5 commit 链，validate 之前执行）：
 * ① input + number/currency 列：null/'' → null（先于 Number()，防
 *    Number(null)===0 / Number('')===0）；typeof number → 原样；
 *    Number(value) 有限 → Number(value)；否则保留原字符串（交 validate 拦截）；
 * ② select + 派生 options + 数值原值（typeof rawValue === 'number'）：
 *    null → null；Number(value) 有限 → Number(value)；否则 value（类型保持）；
 * ④ textarea + 数组原值 → value.split('\n')（数组值编辑 = 换行分割成数组，
 *    元素一律字符串、空行保留为 ''——所见即所得；对象数组的 color/danger/
 *    disabled 等属性不随编辑保留，父级受控流可按需回填，A8 #21）；
 * ⑤ textarea + 非数组数字原值：'' → null；Number(value) 有限 → Number(value)；
 *    否则保留原字符串（数字原值类型保持；字符串原值 → 字符串原样，含换行）；
 * ③ 其余（text/date/switch、显式 options 的 select、textarea 字符串原值）：原样。
 *
 * @param {Object} params
 * @param {Object} [params.column] 列定义
 * @param {String} [params.editorType] 编辑器类型
 * @param {*} [params.rawValue] 编辑前原值（open 时记录）
 * @param {*} [params.value] 编辑态当前值（未规整）
 * @returns {*} 规整后的提交值
 */
export function normalizeCommitValue ({ column, editorType, rawValue, value } = {}) {
  if (editorType === 'input' && (column?.type === 'number' || column?.type === 'currency')) {
    return normalizeNumericCommit(value)
  }

  if (editorType === 'select' && usesDerivedOptions(column, editorType) && typeof rawValue === 'number') {
    return normalizeNumericEnumCommit(value)
  }

  if (editorType === 'textarea') return normalizeTextareaCommitValue(rawValue, value)

  return value
}

/**
 * enum 编辑器 options 接线（02-design.md A6 resolveSelectOptions）：
 * editor.props.options 显式配置优先（原样透传）；否则由 column.mappings
 * Object 转换——Object.entries 过滤 default（兜底映射非可选项）后映射为
 * [{ value, label }]，value 恒为 mapping key 字符串（decisions「[I1 前]⑦」），
 * label 取映射值的 text（对象形态）或值本身。
 * 无 mappings 且未显式配 options 时返回 []（编辑器照开、下拉为空，不视为错误）。
 *
 * @param {Object} column 列定义
 * @returns {Array<{ value: String, label: String }>}
 */
export function resolveSelectOptions (column) {
  const explicit = column?.editor?.props?.options

  if (explicit) return explicit

  return Object
    .entries(column?.mappings || {})
    .filter(([key]) => key !== 'default')
    .map(([value, v]) => ({ value, label: isObject(v) ? v.text : v }))
}

/**
 * 编辑器 props 解析：column.editor.props 透传为基础，缺省注入——
 * number/currency 列经缺省映射到 input 时注入 { type: 'number' }（显式
 * editor.type 不注入）；select 且未显式配 options 时注入
 * resolveSelectOptions 产物。
 *
 * @param {Object} column 列定义
 * @returns {Object} 合并后的 props
 */
export function resolveEditorProps (column) {
  const props = { ...(isObject(column?.editor) ? column.editor.props : {}) }
  const editorType = resolveEditorType(column)

  if (
    editorType === 'input' &&
    !column?.editor?.type &&
    (column?.type === 'number' || column?.type === 'currency')
  ) {
    props.type ??= 'number'
  }

  if (editorType === 'select' && props.options == null) {
    props.options = resolveSelectOptions(column)
  }

  return props
}

/**
 * 编辑浮层定位计算（20261027 问题 3：矩形 = 整格，相对 __overlay 原点 =
 * canvas 视口原点）：全编辑器类型共用同一矩形 = editorRectOf(格矩形) 恒等
 * 映射——输入框覆盖整个单元格区域，外框与格线直接重叠；hover 编辑描边
 * （painter.js）import 同一 editorRectOf，描边与浮层盒同源。
 * - 固定列不随滚动偏移；数值经 Vue :style 绑定前由组件壳转 px 串；
 * - bordered 判定：switch 恒 false；textarea 恒 true（mu-input 边框提供编辑态
 *   边界，borderless 类不适用于多行文本）；其余按 border !== false（缺省 true）
 *   ——仅切换容器 --borderless 类（边框/底色可见性），矩形不受影响；
 * - gridlines/theme 参数已随 EDITOR_GAP 内缩口径作废一并删除（20261027
 *   问题 3），定位只依赖格几何。
 *
 * @param {Object} params
 * @param {Number} params.colIndex 列号
 * @param {Number} params.rowIndex 行号
 * @param {Number[]} params.colLefts 列前缀和（layout.js）
 * @param {Number[]} params.colWidths 列宽数组（layout.js）
 * @param {Number} [params.headHeight=0]
 * @param {Number} [params.scrollTop=0]
 * @param {Number} [params.scrollLeft=0]
 * @param {Number} [params.fixedCount=0] 固定列数
 * @param {Object} params.rowGeometry 行几何实例（topAt/heightAt，必传——C4 删
 *   rowHeight 等高内联回退，uniform 模式传 createUniformRowGeometry 产物）
 * @param {String} [params.editorType='input'] 编辑器类型（仅 bordered 判定消费）
 * @param {Boolean} [params.border=true] 编辑器边框配置（switch/textarea 忽略）
 * @returns {{ left: Number, top: Number, width: Number, height: Number, bordered: Boolean }}
 */
export function computeEditorStyle ({
  colIndex,
  rowIndex,
  colLefts,
  colWidths,
  headHeight = 0,
  scrollTop = 0,
  scrollLeft = 0,
  fixedCount = 0,
  rowGeometry,
  editorType = 'input',
  border = true
} = {}) {
  const bordered = editorType === 'switch'
    ? false
    : (editorType === 'textarea' ? true : border !== false)

  const cellRect = {
    x: colLefts[colIndex] - (colIndex < fixedCount ? 0 : scrollLeft),
    y: headHeight + rowGeometry.topAt(rowIndex) - scrollTop,
    width: colWidths[colIndex],
    height: rowGeometry.heightAt(rowIndex)
  }
  const rect = editorRectOf(cellRect)

  return {
    left: rect.left,
    top: rect.top,
    width: Math.max(rect.width, 0),
    height: Math.max(rect.height, 0),
    bordered
  }
}

/**
 * 目标元素是否位于下拉/日期面板内（Teleport 到 body 的 .mu-dropdown-panel）。
 * 非元素目标（window / 已移除节点上的调用等）安全返回 false。
 *
 * @param {Element} [target]
 * @returns {Boolean}
 */
export function isInDropdownPanel (target) {
  return target?.closest?.(DROPDOWN_PANEL_SELECTOR) != null
}

/**
 * blur 延迟兜底的提交判定（纯函数，decisions「[I1 前]①」三条判据）：
 * ① editing 仍在（已清空 → 不提交，点选下拉项的值变化提交先于本兜底）；
 * ② 焦点在 __editor 容器内 → 不提交；
 * ③ 焦点或最近 window pointerdown 目标在 .mu-dropdown-panel 内 → 不提交
 *    （面板内交互：下拉项选择、日期面板月份切换等）。
 *
 * @param {Object} params
 * @param {Object} [params.editing] 当前编辑态（null = 已关闭）
 * @param {Element} [params.activeElement] document.activeElement
 * @param {Element} [params.editorEl] __editor 容器元素
 * @param {Element} [params.lastPointerdownTarget] 编辑开启期间最近 window pointerdown 目标
 * @returns {Boolean} true = 提交
 */
export function resolveBlurFallback ({
  editing,
  activeElement,
  editorEl,
  lastPointerdownTarget
} = {}) {
  if (!editing) return false
  if (editorEl && activeElement && editorEl.contains(activeElement)) return false
  if (isInDropdownPanel(activeElement) || isInDropdownPanel(lastPointerdownTarget)) return false

  return true
}

const UNCHANGED = Symbol('unchanged')

/**
 * 创建编辑控制器（编辑状态机实例，组件壳 setup 内创建并持有）。
 * state.editing 为编辑浮层的响应式视图状态；column/record/recordIndex 上下文
 * 保存在控制器内部原始引用中，emit payload 不经 reactive 代理（父级收到的
 * record/column 与自身数据引用一致）。
 *
 * @param {Object} [options]
 * @param {Function} [options.onCommit] 提交回调，入参
 *   { record, recordIndex, column, value }；组件壳内 emit('update:cell-value')
 *   并 nextTick 重绘该行
 * @returns {{
 *   state: { editing: Object|null },
 *   open: Function,
 *   commit: Function,
 *   cancel: Function,
 *   destroy: Function,
 *   getLastPointerdownTarget: Function
 * }}
 */
export function createEditorController ({ onCommit } = {}) {
  const state = reactive({ editing: null })

  // emit payload 用的原始上下文（不经 reactive 代理，见上方 JSDoc）；
  // rawValue/rawWasArray 为 textarea 数组开值/提交规整的锚定输入（A5.5 ④⑤）
  let context = null
  let getEditorEl = null
  let blurTimer = 0
  let lastPointerdownTarget = null

  const onWindowPointerdown = event => {
    lastPointerdownTarget = event.target
  }

  // 值变化提交（select/date/switch；A5.5 提交矩阵）。input/textarea 类型的
  // source 恒为 UNCHANGED，键入不触发提交（textarea Enter 换行不提交）；open/
  // close 的状态切换经 oldValue === UNCHANGED 守卫跳过。flush:'sync' 保证点选
  // 下拉项的模型更新在 blur 延迟兜底（宏任务）之前同步完成提交，延迟任务发现
  // editing 已空跳过（commit 幂等，双通道不重复 emit）。
  const stopValueWatch = watch(
    () => {
      const editing = state.editing

      return editing?.commitOnValueChange ? editing.value : UNCHANGED
    },
    (value, oldValue) => {
      if (value === UNCHANGED || oldValue === UNCHANGED || value === oldValue) return

      commit()
    },
    { flush: 'sync' }
  )

  function clearTimers () {
    if (blurTimer) {
      clearTimeout(blurTimer)
      blurTimer = 0
    }
  }

  function teardown () {
    window.removeEventListener('pointerdown', onWindowPointerdown, true)
    lastPointerdownTarget = null

    clearTimers()

    context = null
    getEditorEl = null
  }

  /**
   * 分类型事件合成（A5.5 提交矩阵）。enter/esc/blur 由 mussel 输入组件转发
   * （input.js inputEvents：keydown keyCode 13 → enter、27 → esc）；switch
   * 根是普通 div 无 focus/blur/keydown，事件为空对象（esc 挂 __editor 容器）；
   * textarea 为原生元素：keydown 承接 Ctrl/Cmd+Enter 显式提交（Enter 裸按
   * 换行不提交）、esc 冒泡至 __editor 容器、blur 兜底同 input。
   */
  function buildEvents (editorType) {
    if (editorType === 'input') {
      return {
        enter: () => commit(),
        esc: () => cancel(),
        blur: () => scheduleBlurFallback()
      }
    }

    if (editorType === 'textarea') {
      return {
        keydown: event => {
          if (event?.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event?.preventDefault?.()
            commit()
          }
        },
        esc: () => cancel(),
        blur: () => scheduleBlurFallback()
      }
    }

    if (editorType === 'select' || editorType === 'date') {
      return {
        esc: () => cancel(),
        blur: () => scheduleBlurFallback()
      }
    }

    return {}
  }

  function scheduleBlurFallback () {
    if (blurTimer) clearTimeout(blurTimer)

    blurTimer = setTimeout(() => {
      blurTimer = 0

      if (
        resolveBlurFallback({
          editing: state.editing,
          activeElement: document.activeElement,
          editorEl: getEditorEl?.() ?? null,
          lastPointerdownTarget
        })
      ) {
        commit()
      }
    }, 0)
  }

  /**
   * 打开编辑器（A5.5 打开流程，触发点 = 单击，A5.2）。已在编辑时先同步提交
   * 上一格（幂等；校验未通过被拦下时保持现有编辑、不开新格）。
   *
   * @param {Object} params
   * @param {Object} params.column 已准备内部列（_value 取当前值；原始列亦可）
   * @param {Object} params.record
   * @param {Number} params.recordIndex
   * @param {Boolean} [params.editable=false] 表格级 editable
   * @param {Object} [params.style] computeEditorStyle 产物（转 px 串后）
   * @param {Boolean} [params.bordered=true] computeEditorStyle 判定的边框形态
   *   （bordered === false 时容器挂 --borderless 类，switch 无边框）
   * @param {Function} [params.getEditorEl] () => __editor 容器元素
   * @returns {Boolean} 是否打开
   */
  function open ({
    column,
    record,
    recordIndex,
    editable = false,
    style,
    bordered = true,
    getEditorEl: editorElGetter
  }) {
    if (!isCellEditable({ editable, column })) return false

    if (state.editing) commit()
    if (state.editing) return false

    // 当前显示值经 column.value 取值，非格式化文本（取值链同 cell-painters
    // resolveCellContent / row-geometry valueOf）；rawValue 锚定编辑器形态
    // 判定（A5.5）与提交规整（A5.5 ④⑤）
    const rawValue = column._value?.(record) ??
      (column.field != null ? record?.[column.field] : undefined)
    const editorType = resolveEditorType(column, { rawValue, record })

    context = { column, record, recordIndex, rawValue, rawWasArray: Array.isArray(rawValue) }
    getEditorEl = editorElGetter ?? null

    const editing = {
      editorType,
      // markRaw：组件定义/元素 tag 不进入响应式包装（保持组件身份，避免深度代理开销）
      component: markRaw(EDITOR_COMPONENTS[editorType]),
      props: resolveEditorProps(column),
      events: buildEvents(editorType),
      // input 键入不提交；textarea Enter 换行不提交（Ctrl/Cmd+Enter 显式提交）
      commitOnValueChange: editorType !== 'input' && editorType !== 'textarea',
      value: normalizeEditorOpenValue({ column, editorType, value: rawValue }),
      style,
      bordered,
      invalid: false,
      message: '',
      onEsc: () => cancel()
    }

    state.editing = editing

    // 编辑开启期间记录 window 级 pointerdown 目标（decisions「[I1 前]①」）
    lastPointerdownTarget = null
    window.addEventListener('pointerdown', onWindowPointerdown, true)

    return true
  }

  /**
   * 提交（幂等）：值规整（A5.5 normalizeCommitValue）→ validate（规整后值）→
   * 关闭 → onCommit({ record, recordIndex, column, value })。校验失败置
   * invalid/message（透传 mussel 组件 invalid 态、容器 title 显示文案），不关闭、
   * 不失焦。
   *
   * @returns {Boolean} 是否实际提交
   */
  function commit () {
    if (!state.editing || !context) return false

    const { column, record, recordIndex, rawValue } = context
    const editorType = state.editing.editorType
    const value = normalizeCommitValue({
      column,
      editorType,
      rawValue,
      value: state.editing.value
    })

    const validate = isObject(column?.editor) ? column.editor.validate : null

    if (isFunction(validate)) {
      const result = validate(value, { record, column })

      if (result !== true) {
        state.editing.invalid = true
        state.editing.message = isString(result) ? result : ''

        return false
      }
    }

    // 先清空再 emit：值变化与 blur 延迟兜底等并发通道经「editing 已清空」
    // 跳过（commit 幂等，双通道不重复 emit）
    state.editing = null
    teardown()
    onCommit?.({ record, recordIndex, column, value })

    return true
  }

  /**
   * 取消（幂等）：直接关闭，不发事件。
   *
   * @returns {Boolean} 是否实际关闭
   */
  function cancel () {
    if (!state.editing) return false

    state.editing = null
    teardown()

    return true
  }

  /** 编辑开启期间最近 window pointerdown 目标（自检/调试观测用） */
  function getLastPointerdownTarget () {
    return lastPointerdownTarget
  }

  /** 卸载清理：关闭编辑、移除 window 监听与定时器、停止值变化 watch */
  function destroy () {
    state.editing = null
    teardown()
    stopValueWatch()
  }

  return {
    state,
    open,
    commit,
    cancel,
    destroy,
    getLastPointerdownTarget
  }
}
