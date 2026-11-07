/** 编辑器类型 / props / 开值 / 提交值规整链（自 editor.js 按关注点拆出） */
import { isObject } from '@/utils/type'

import { selectOptionsFromMappings } from '../../mappings'
import { MuInput, MuSelect, MuDateInput, MuSwitch } from '../../../form/index.js'

/** 不可编辑的列类型：link/list 条目列不可编辑（list 对齐 link，link 为其兼容壳）；
    progress 为 canvas 专属展示类型，button 仍不可编辑；image 为 img 别名；icon
    为纯展示类型 */
export const NON_EDITABLE_TYPES = ['rec_no', 'img', 'image', 'tag', 'check', 'link', 'list', 'button', 'progress', 'icon']

/** 编辑器类型 → mussel 输入组件；textarea 为原生元素 tag（INPUT_TYPES.memo 约定） */
export const EDITOR_COMPONENTS = {
  input: MuInput,
  select: MuSelect,
  date: MuDateInput,
  switch: MuSwitch,
  textarea: 'textarea'
}

const COLUMN_TYPE_EDITORS = {
  text: 'input',
  enum: 'select',
  number: 'input',
  currency: 'input',
  date: 'date',
  datetime: 'date',
  bool: 'switch'
}

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

// 编辑器类型解析：editor.type 显式合法直取；text 列（type 缺省按 text）按开值
// 形态与 maxLines 判定（行级求值）；其余按类型映射，未知列类型回退 input
export function resolveEditorType (column, { rawValue, record } = {}) {
  const explicit = column?.editor?.type

  if (explicit && EDITOR_COMPONENTS[explicit]) return explicit

  // 无 type 列回退 text（resolveColumnType(undefined) 同回退 TextColumn）
  const typeName = column?.type == null ? 'text' : column.type

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

function toFiniteNumber (value) {
  const numeric = Number(value)

  return Number.isFinite(numeric) ? numeric : value
}

function normalizeNumericCommit (value) {
  if (value == null || value === '') return null

  return toFiniteNumber(value)
}

function normalizeDerivedSelectCommit (value) {
  if (value == null) return null

  return toFiniteNumber(value)
}

function normalizeTextareaCommitValue (rawValue, value) {
  if (Array.isArray(rawValue)) return value.split('\n')

  if (typeof rawValue === 'number') return normalizeNumericCommit(value)

  return value
}

// 编辑提交值规整（validate 之前执行）：
// input + number/currency：null/'' → null（防 Number(null)===0）；数值串转 number，
// 非数值串保留交 validate 拦截；select + 派生 options + 数值原值：仅 null → null，
// Number 有限转 number 否则原样；textarea：数组 split('\n')（空行保留）/
// 数字原值类型保持 / 字符串原样；其余原样
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
