/** canvas-table 编辑状态机（02-design.md A5）：只读判定、编辑器组件/props 解析、编辑盒定位、提交矩阵与值规整层 */
import { markRaw, reactive, watch } from 'vue'
import { isFunction, isObject, isString } from '@/utils/type'

import {
  CELL_PADDING_FALLBACK,
  ROW_TOP_INSET,
  ROW_HEIGHT_FALLBACK,
  EDITOR_BUTTON_AREA
} from './constants'
import { selectOptionsFromMappings } from './mappings'
import { MuInput, MuSelect, MuDateInput, MuSwitch } from '../form/index.js'

// 模块隔离（A8）：不 import layout.js / theme.js / cell-painters.js（镜像常量经
// constants.js）；mappings.js 为零依赖共享模块可用；定位所需布局数据由组件壳传入

// 提交矩阵：input 走 Enter；textarea Ctrl/Cmd+Enter 显式提交（Enter 换行）；
// select/date/switch 值变化即提交且保持编辑态；Esc 取消；validate 失败不关闭
// 不失焦；commit 幂等；同值不重复 emit

// blur 延迟兜底判据（三条同时满足才提交）：① editing 仍在；② 焦点不在 __editor
// 容器内；③ 焦点与最近一次 window pointerdown 目标均不在 .mu-dropdown-panel 内
//（编辑开启期间捕获阶段记录 pointerdown 目标，面板内交互不触发兜底提交）

// 值类型规整层（A5.5）：number/currency input 提交收敛为 number 或 null（非数值
// 串保留交 validate 拦截）；派生 options select 数值原值按 Number 回写；textarea
// 数组原值 → 换行分割字符串数组（空行保留）；textarea 数字原值类型保持

// 组件壳（canvas-table.vue）对接契约：
// - createEditorController({ onCommit })：onCommit 收 { record, recordIndex,
//   column, value }（原始引用非 reactive 代理），壳内 emit 并 nextTick 重绘该行

// - 打开：click 命中可编辑格调 editor.open({...})；聚焦由壳 focusEditor 承担
// - 画布 pointerdown（editing 中先提交再续行）与容器滚动：调 editor.commit()
// - 卸载：editor.destroy()（onUnmounted）

/** 不可编辑的列类型（A6）；link 不可编辑（decisions [S1]）；button/progress 为 canvas 专属展示类型；image 为 img 别名 */
export const NON_EDITABLE_TYPES = ['rec_no', 'img', 'image', 'tag', 'check', 'link', 'button', 'progress']

/** 编辑器类型 → mussel 输入组件；textarea 为原生元素 tag（INPUT_TYPES.memo 约定） */
export const EDITOR_COMPONENTS = {
  input: MuInput,
  select: MuSelect,
  date: MuDateInput,
  switch: MuSwitch,
  textarea: 'textarea'
}

/** 下拉/日期面板根 class（dropdown-panel.vue，Teleport 到 body） */
export const DROPDOWN_PANEL_SELECTOR = '.mu-dropdown-panel'

/** 编辑浮层盒矩形（单一事实源：hover 描边与浮层盒同源，painter import 同一函数）。
    按格线占位内缩：topGridline/rightGridline 标示本格被行线/列线占用，占用则盒缘退至格线内侧 1px */
export function editorRectOf (rect, { topGridline = false, rightGridline = false } = {}) {
  const topInset = topGridline ? 1 : 0
  const rightInset = rightGridline ? 1 : 0

  return {
    left: rect.x,
    top: rect.y + topInset,
    width: rect.width - rightInset,
    height: rect.height - topInset
  }
}

/** 本格格线占位标志（editorRectOf 入参；painter hover 描边与 computeEditorStyle 共用）。
    topGridline = r≥1 且含 row；rightGridline = 非末列（或末列但有空白区）且含 column */
export function editorGridlineFlagsOf ({
  rowIndex, colIndex, colCount, stickyWidth = 0, contentWidth = 0, gridlines
} = {}) {
  const mode = gridlines ?? 'all'

  return {
    topGridline: rowIndex > 0 && (mode === 'all' || mode === 'row'),
    rightGridline: (colIndex < colCount - 1 || stickyWidth > (contentWidth || 0)) &&
      (mode === 'all' || mode === 'column')
  }
}

/** 编辑按钮区矩形（单一事实源：painter 绘制与壳命中共用）。右缘贴格内容区右缘，
    垂直中心 = 行线间空白中点原式（与单元格文字垂直锚同一槽位公式，不使用 rect.height） */
export function editorButtonRectOf (
  rect,
  { padding = CELL_PADDING_FALLBACK, rowHeight = ROW_HEIGHT_FALLBACK } = {}
) {
  const centerY = rect.y + ROW_TOP_INSET + (rowHeight - ROW_TOP_INSET) / 2

  return {
    x: rect.x + rect.width - padding - EDITOR_BUTTON_AREA,
    y: centerY - EDITOR_BUTTON_AREA / 2,
    width: EDITOR_BUTTON_AREA,
    height: EDITOR_BUTTON_AREA
  }
}

/** 列类型 → 编辑器类型缺省映射（column.editor.type 显式指定优先） */
const COLUMN_TYPE_EDITORS = {
  text: 'input',
  number: 'input',
  currency: 'input',
  date: 'date',
  datetime: 'date',
  bool: 'switch'
}

/** 单元格只读判定：editable !== false && column.editable !== false && column.editor != null && 类型不在排除清单 */
export function isCellEditable ({ editable = false, column } = {}) {
  return (
    editable !== false &&
    column != null &&
    column.editable !== false &&
    column.editor != null &&
    !NON_EDITABLE_TYPES.includes(column.type)
  )
}

/** text 列编辑器形态判定（行级求值）：开值为数组或 maxLines > 1 → 'textarea'，否则 'input' */
function resolveTextLikeEditorType (column, rawValue, record) {
  const resolveMaxLines = typeof column?._resolveMaxLines === 'function'
    ? column._resolveMaxLines(record)
    : (column?._maxLines ?? column?.maxLines ?? 1)

  return Array.isArray(rawValue) || resolveMaxLines > 1 ? 'textarea' : 'input'
}

/** 下拉来源判定：editor.props.options / column.options / column.mappings 任一非空 */
function hasSelectSource (column) {
  return column?.editor?.props?.options != null ||
    column?.options != null ||
    column?.mappings != null
}

// 编辑器类型解析（A5.5）：① editor.type 显式合法直取；② text/number 列（type 缺省
// 按 text）带下拉来源 → 'select'；③ text 列按开值形态与 maxLines 判定（行级求值）；
// ④ 其余按类型映射，未知列类型回退 input
export function resolveEditorType (column, { rawValue, record } = {}) {
  const explicit = column?.editor?.type

  if (explicit && EDITOR_COMPONENTS[explicit]) return explicit

  // 无 type 列回退 text（resolveColumnType(undefined) 同回退 TextColumn）
  const typeName = column?.type == null ? 'text' : column.type

  if ((typeName === 'text' || typeName === 'number') && hasSelectSource(column)) {
    return 'select'
  }

  if (typeName === 'text') {
    return resolveTextLikeEditorType(column, rawValue, record)
  }

  return COLUMN_TYPE_EDITORS[typeName] || 'input'
}

/** select 是否走 mappings 派生 options：未显式配 editor.props.options / column.options
    （派生 options 的 value = mapping key 字符串，提交值类型规整需按此区分） */
export function usesDerivedOptions (column, editorType) {
  return editorType === 'select' &&
    column?.editor?.props?.options == null &&
    column?.options == null
}

/** 编辑开值规整：select + 派生 options → String 化（消除 MuSelect `in` 隐式转换依赖）；
    textarea 数组取 caption 换行拼接；textarea 非数组 → String / ''；其余原样 */
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

/** number/currency 与 textarea 数字原值共用收敛：null/'' → null（防 Number(null)===0），其余 toFiniteNumber */
function normalizeNumericCommit (value) {
  if (value == null || value === '') return null

  return toFiniteNumber(value)
}

/** 派生 options select 数值原值的收敛：仅 null → null（'' 按 Number() 转换） */
function normalizeDerivedSelectCommit (value) {
  if (value == null) return null

  return toFiniteNumber(value)
}

/** textarea 提交规整：数组原值 split('\n')（空行保留）；数字原值类型保持；字符串原样 */
function normalizeTextareaCommitValue (rawValue, value) {
  if (Array.isArray(rawValue)) return value.split('\n')

  if (typeof rawValue === 'number') return normalizeNumericCommit(value)

  return value
}

// 编辑提交值规整（A5.5，validate 之前执行）：
// ① input + number/currency：null/'' → null；number 原样；数值串转 number；
//    非数值串保留（交 validate 拦截）

// ② select + 派生 options + 数值原值：null → null；Number 有限转 number；否则原样
// ④/⑤ textarea：数组 split / 数字类型保持 / 字符串原样；③ 其余原样
export function normalizeCommitValue ({ column, editorType, rawValue, value } = {}) {
  if (editorType === 'input' && (column?.type === 'number' || column?.type === 'currency')) {
    return normalizeNumericCommit(value)
  }

  if (editorType === 'select' && usesDerivedOptions(column, editorType) && typeof rawValue === 'number') {
    return normalizeDerivedSelectCommit(value)
  }

  if (editorType === 'textarea') return normalizeTextareaCommitValue(rawValue, value)

  return value
}

/** select 编辑器 options 接线：editor.props.options（原样）> column.options（原样）
    > mappings 派生（排除 default，value = key 字符串）；全缺省返回 [] */
export function resolveSelectOptions (column) {
  const explicit = column?.editor?.props?.options

  if (explicit) return explicit

  const fromColumn = column?.options

  if (fromColumn) return fromColumn

  return selectOptionsFromMappings(column?.mappings)
}

/** 编辑器 props 解析：column.editor.props 透传；number/currency 缺省 input 注入
    { type: 'number' }；select 未显式配 options 时注入 resolveSelectOptions 产物 */
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

/** 编辑浮层定位（矩形相对 __overlay 原点 = canvas 视口原点）：全编辑器类型共用同一
    矩形（与 hover 描边同源同位）；固定列不随滚动偏移；bordered：switch false / textarea true / 其余 border !== false */
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
  border = true,
  gridlines,
  stickyWidth = 0,
  contentWidth = 0
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
  const rect = editorRectOf(cellRect, editorGridlineFlagsOf({
    rowIndex,
    colIndex,
    colCount: colWidths.length,
    stickyWidth,
    contentWidth,
    gridlines
  }))

  return {
    left: rect.left,
    top: rect.top,
    width: Math.max(rect.width, 0),
    height: Math.max(rect.height, 0),
    bordered
  }
}

/** 目标元素是否位于下拉/日期面板内（Teleport 到 body 的 .mu-dropdown-panel） */
export function isInDropdownPanel (target) {
  return target?.closest?.(DROPDOWN_PANEL_SELECTOR) != null
}

/** blur 兜底提交判定（纯函数三判据）：editing 已清空 / 焦点在 __editor 内 / 焦点或
    最近 pointerdown 目标在 .mu-dropdown-panel 内 → 不提交 */
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

/** 创建编辑控制器（组件壳 setup 内创建并持有）。state.editing 为浮层响应式视图状态；
    column/record 上下文保存在内部原始引用中，emit payload 不经 reactive 代理 */
export function createEditorController ({ onCommit } = {}) {
  const state = reactive({ editing: null })

  // rawValue/rawWasArray 为 textarea 数组开值/提交规整的锚定输入（A5.5 ④⑤）
  let context = null
  let getEditorEl = null
  let blurTimer = 0
  let lastPointerdownTarget = null
  // 本编辑会话最近一次已提交值（UNCHANGED = 尚未提交过）：关闭通道提交经此去重
  let emittedValue = UNCHANGED

  const onWindowPointerdown = event => {
    lastPointerdownTarget = event.target
  }

  // 值变化提交（select/date/switch）：提交 emit 但保持编辑态；input/textarea 键入
  // 不触发提交。flush:'sync' 保证点选下拉项先于 blur 延迟兜底完成提交
  const stopValueWatch = watch(
    () => {
      const editing = state.editing

      return editing?.commitOnValueChange ? editing.value : UNCHANGED
    },
    (value, oldValue) => {
      if (value === UNCHANGED || oldValue === UNCHANGED || value === oldValue) return

      applyCommit()
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

  /** 分类型事件合成：enter/esc/blur 由 mussel 输入组件转发；switch 根是普通 div
      无 focus/blur/keydown（事件空对象，esc 挂容器）；textarea Ctrl/Cmd+Enter 提交 */
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

  /** 打开编辑器（触发点 = 单击）。已在编辑时先同步提交上一格（幂等；校验未通过
      被拦下时保持现有编辑、不开新格） */
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

    // 当前显示值经 column.value 取值（非格式化文本）；rawValue 锚定形态判定与提交规整
    const rawValue = column._value?.(record) ??
      (column.field != null ? record?.[column.field] : undefined)
    const editorType = resolveEditorType(column, { rawValue, record })

    context = { column, record, recordIndex, rawValue, rawWasArray: Array.isArray(rawValue) }
    getEditorEl = editorElGetter ?? null
    emittedValue = UNCHANGED

    const editing = {
      editorType,
      // markRaw：组件定义/元素 tag 不进入响应式包装（保持组件身份）
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

    // 编辑开启期间记录 window 级 pointerdown 目标（blur 兜底判据③）
    lastPointerdownTarget = null
    window.addEventListener('pointerdown', onWindowPointerdown, true)

    return true
  }

  /** 应用提交（值规整 → validate → emit 去重），不关闭编辑：值变化通道与关闭通道
      共用；校验失败置 invalid/message 不 emit；去重按「规整值 ≠ 最近已提交值」 */
  function applyCommit () {
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

    // 值变化通道编辑保持开启：成功提交须解除上一轮校验失败的 invalid/message
    state.editing.invalid = false
    state.editing.message = ''

    if (value !== emittedValue) {
      emittedValue = value

      onCommit?.({ record, recordIndex, column, value })
    }

    return true
  }

  /** 提交并关闭（幂等）：applyCommit 校验通过后关闭；校验失败不关闭、不失焦 */
  function commit () {
    if (!applyCommit()) return false

    state.editing = null
    teardown()

    return true
  }

  /** 取消（幂等）：直接关闭，不发事件 */
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
