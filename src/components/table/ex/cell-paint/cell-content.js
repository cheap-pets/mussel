/** 列准备与取值链：prepareColumn / resolveCellContent / 行数上限 */
import { ensureFn } from '@/utils/type'
import { resolveColumnType } from '../../column-types'
import { createDisplayMapper } from '../../mappings'
import { EnumColumn } from '../../column-types/enum'
import { MAX_LINES_LIMIT } from '../shared/text-wrap'
import { cellLineHeightOf } from './cell-text'

// 取值链（与 DOM 版同款：base/table.vue internalColumns 列准备、base/table-row.vue cells 取值）：
// - 列准备：resolveColumnType → _text/_value 均 ensureFn → _render（compile | render | 类型本身）；
//   另挂 _maxLines/_maxItems/_resolveMaxLines/_isTreeColumn/_mapText/_plainText

// - 取值：_text(record) 非 null 直接作为显示文本；否则 value = _value(record) ?? record[field]，
//   纯文本列短路免 render，其余调 _render；class/style 为 DOM 通道字段忽略，canvas 通道
//   条目自带 kind 协议字段（link/tag），颜色经平铺 color/danger 直取不走 class 解析
//   （column.title 经 _title 由 resolveCellTooltip 消费，tooltip 求值见模块尾）

// - _mapText 为 enum 类型独有（EnumColumn.compile 内 mapper 为双端单一事实源，此处仅供
//   row-geometry 估高取显示文本，不参与绘制取值）

// 绘制锚（Q2 统一垂直锚，与 lineHeight 解耦）：centerY = Math.round(rect.y +
// ROW_TOP_INSET + (rowHeight − ROW_TOP_INSET)/2 + 0.01)（行线间空白中点四舍五入，
// .5 恒向上，+0.01 浮点容差），多行后续行 += lineHeight；水平居中锚扣 rightInset

// 模块隔离（A8）：不 import theme.js / layout.js；主题色与 colors 经 drawCell 的
// theme 快照参数传入；table/mappings.js 为零依赖共享模块（mu-table 同源），不违反禁令

// canvas 专属类型（A3.3）：不入 table 列类型注册表，prepareColumn 在
// resolveColumnType 之前分发，drawCell 按 canvasKind 走 drawProgress；
// button 已入注册表（column-types/button，20261105-column-button-type），
// 经 compile 产 canvasKind: 'button' 同走 drawCanvasKindContent 分发
const CANVAS_ONLY_TYPES = { progress: true }

// —— 列准备（table.vue internalColumns 的 canvas 等价物，仅保留绘制所需字段） ——

/** maxLines/maxItems 配置值钳制（1–10；非法值回退 fallback） */
function clampLimit (value, fallback) {
  const n = Math.round(Number(value))

  return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_LINES_LIMIT) : fallback
}

// _render 构建：canvas 专属类型（progress）不经 resolveColumnType 产物
// （回退 TextColumn 会绘制文本），直接产出 canvasKind render；普通类型 compile 优先，
// 其次类型对象/函数自身作为 render
function createColumnRender (column, type, canvasOnlyKind) {
  if (canvasOnlyKind === 'progress') {
    const getProgressOption = ensureFn(column.progressOption)

    return ({ record, value }) => ({
      canvasKind: 'progress',
      value,
      progressOption: getProgressOption(record) ?? {}
    })
  }

  return type.compile ? type.compile(column) : (type.render || type)
}

/** 行数上限求值闭包构建（maxLines 常量优先 → multiline+lineClamp 行级求值 → 单行）：
    产物 _resolveMaxLines(record) 为 drawText、行高计算、editor textarea 判定同源；
    不在列准备期求值（无 record，行高/绘制分裂） */
function resolveMaxLinesBuilder (column, maxLines) {
  if (maxLines != null) return () => maxLines

  if (column.multiline) {
    const getLineClamp = ensureFn(column.lineClamp)

    return record => clampLimit(getLineClamp(record) ?? MAX_LINES_LIMIT, MAX_LINES_LIMIT)
  }

  return () => 1
}

/** 纯文本直渲短路判定（P2）：非 multiline 原生 text 列且无 color（带 color 列必须
    走 compile 产 color，短路直渲产物只有 { text }，染色会丢失）；text.link 列
    （column.link === true）同样排除——链色需 compile 产 color，直渲会丢 */
function isPlainTextColumn (column, canvasOnlyKind) {
  return !column.text && !column.multiline && !canvasOnlyKind &&
    column.color == null && column.link !== true &&
    (column.type == null || column.type === '' || column.type === 'text')
}

// 列定义 → 内部列：解析缺省 align、ensureFn 化 text/value、构建 render、canvas 专属
// 类型分发、挂 maxLines/maxItems/树形列标记与映射字段；placeholder 继承表格级
export function prepareColumn (column, { placeholder } = {}) {
  const col = { ...column, _raw: column }

  const type = resolveColumnType(column.type)

  const { align = type.align } = column

  col._align = align ?? 'left'
  col._text = ensureFn(column.text)
  col._value = ensureFn(column.value)
  // title 列协议（tooltip 求值闭包，base/table.vue internalColumns 的 _title 同款；
  // 原始字段经 {...column} 保留，resolveTooltipTarget 按其真值做门控）
  col._title = ensureFn(column.title)

  // 多行/条目上限（clampLimit 钳制 1–10，非法值回退）
  col._maxLines = column.maxLines != null ? clampLimit(column.maxLines, null) : null
  col._maxItems = clampLimit(column.maxItems ?? MAX_LINES_LIMIT, MAX_LINES_LIMIT)
  col._isTreeColumn = column.treeNode === true
  // 合并单元格列级声明（02-design.md §2.2）：true（显示值键）| string 字段键 |
  // Function 键，spans.buildSpans 消费（spans.js 不 import 本模块，取值链自持）
  col._autoRowSpan = column.autoRowSpan
  col._resolveMaxLines = resolveMaxLinesBuilder(column, col._maxLines)

  const canvasOnlyKind = CANVAS_ONLY_TYPES[column.type] ? column.type : null

  col._render = createColumnRender(column, type, canvasOnlyKind)

  // 显示映射 enum 类型独有（EnumColumn.compile 内 mapper 为双端单一事实源，此处仅供
  // row-geometry 估高取显示文本）；无映射源不挂恒等 mapper
  col._mapText = !column.text && type === EnumColumn &&
    (column.mappings != null || column.options != null)
    ? createDisplayMapper(column)
    : null
  col._plainText = isPlainTextColumn(column, canvasOnlyKind)

  col.placeholder ??= placeholder

  return col
}

/** A9 统一数组门控（decisions）：数组值仅条目列（link/list/tag/button——tag/button
    的值本身即条目数组）与非字符串 type 自定义列消费；其余列（type null/''/其他
    字符串：text/number/date/bool/enum/check/img/progress 等）落空内容 → 占位链 */
function isArrayValueRejected (col, value) {
  if (!Array.isArray(value)) return false

  const t = col.type

  return (t == null || t === '' || typeof t === 'string') &&
    t !== 'link' && t !== 'list' && t !== 'tag' && t !== 'button'
}

// 单元格内容解析（table-row.vue cells computed 的纯函数等价物）：返回 { text } /
// { items } / { canvasKind, ... }（皆空 = 空内容，绘制落 placeholder）
export function resolveCellContent (col, { record, recordNumber, emit }) {
  const text = col._text(record)

  if (text != null) return { text }

  // value 传字符串等非函数值经 ensureFn 包装后恒为函数，不会抛错
  const value = col._value(record) ?? (col.field ? record[col.field] : undefined)

  // A9 门控置于 _plainText 短路之前，直渲路径一并覆盖
  if (isArrayValueRejected(col, value)) return {}

  // P2 短路：纯文本列免 render 调用与中间对象（无 color 才短路，染色列走 compile 产 color）
  if (col._plainText) return { text: value }

  const { class: _class, style: _style, title: _title, ...params } =
    col._render({ record, recordNumber, value, emit }) || {}

  return params
}

function maxLinesOf (col, record) {
  if (typeof col._resolveMaxLines === 'function') return col._resolveMaxLines(record)

  return col._maxLines ?? 1
}

/** 行数上限（§5.1）：regionHeight 缺省（普通格）恒 maxLines；合并主格按区域可用
    行数钳制——内容超出区域高度按区域行数省略，不回流行高 */
export function capMaxLinesOf (col, record, regionHeight, padding, theme) {
  const maxLines = maxLinesOf(col, record)

  if (regionHeight == null) return maxLines

  return Math.min(maxLines, Math.floor((regionHeight - padding * 2) / cellLineHeightOf(theme)))
}
