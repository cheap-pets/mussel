import { ensureFn } from '@/utils/type'

// list 列（20261104-table-column-type）：条目列，仅接受数组值；元素默认按文本行
// 渲染，每项单行、超长省略；column 级 link: true 时整列按 link 样式渲染（整列
// 全 text 或全 link，条目级 link 键不参与渲染）；所有条目点击 emit
// ('cell-item-click', { record, column, item })。link 列为兼容壳（link.js），
// 内部构造 list 语义列对象后委托本实现（A7：共用同一实现代码）

// 缺省取值链：仅接受数组 value（A4；标量/对象落占位链）。单值包装只存在于
// link 兼容壳的 valueToLinks（保 links: 12345 夹具），本类型缺省不包装
function defaultListItems (record, value) {
  return Array.isArray(value) ? value : undefined
}

// 条目归一：对象元素原样保留（payload 原引用传出，任意属性不丢）、primitive 包
// { label: el }；label ?? caption 为 null/'' 的条目过滤
function normalizeEntries (rawItems) {
  const entries = []
  const labels = []

  for (const el of rawItems) {
    const entry = el != null && typeof el === 'object' ? el : { label: el }
    const label = entry.label

    if (label == null || label === '') continue

    entries.push(entry)
    labels.push(label)
  }

  return { entries, labels }
}

// color 仅 link 列条目消费（非 link 列条目恒正文色）：entry.color ?? listOption.color ?? 'primary'
function entryColorOf (entry, isLink, columnColor) {
  return isLink ? (entry?.color ?? columnColor ?? 'primary') : null
}

function entryDisabledOf (entry, columnDisabled) {
  return (entry?.disabled ?? columnDisabled) || null
}

// canvas 通道条目：复用 kind 'link' 命中/hover 链（painter 侧零分发改动）；
// link 字段为样式/hover 门控依据（A6 点击所有条目，hover 仅 link 列条目）
function canvasItemOf (entry, label, {
  isLink, columnColor, columnDisabled, showTitle, columnRef, record, emit
}) {
  const isDots = entry == null

  return {
    kind: 'link',
    link: isLink,
    text: isDots ? '...' : label,
    title: showTitle && label,
    color: entryColorOf(entry, isLink, columnColor),
    disabled: entryDisabledOf(entry, columnDisabled),
    onItemClick: () => emit('cell-item-click', { record, column: columnRef, item: isDots ? '...' : entry })
  }
}

// dom 通道条目：DOM 形态（is/class/style/events/attrs）。不复用 .mu-link 类
// （atomic 导入序下其 color 会覆盖 text-{color}，样式走 .mu-table__list-cell）
function domItemOf (entry, label, options) {
  const { isLink, columnColor, columnDisabled, showTitle, columnRef, record, emit, _class, _style } = options
  const isDots = entry == null

  const itemClass = [isLink ? `text-${entryColorOf(entry, isLink, columnColor)}` : null, _class]
  const item = {
    is: isLink ? 'a' : 'span',
    text: isDots ? '...' : label,
    title: showTitle && label,
    attrs: { class: itemClass, style: _style },
    events: {}
  }

  const disabled = entryDisabledOf(entry, columnDisabled)

  if (disabled) item.attrs.disabled = ''

  // 所有条目（含纯文本条目与 dots）点击派发（A6）；dots payload 值 '...'
  item.events.click =
    () => emit('cell-item-click', { record, column: columnRef, item: isDots ? '...' : entry })

  return item
}

export const ListColumn = {
  compile: (column, dom = false) => {
    const getItems = ensureFn(column.listItems || defaultListItems)
    const { listOption = {} } = column
    const { max, color: columnColor, disabled: columnDisabled } = listOption

    const getItemClass = ensureFn(listOption.class)
    const getItemStyle = ensureFn(listOption.style)

    const showTitle = column.title === true || null

    // link 生效值 = column.link === true（列级单点，整列全 text 或全 link，
    // 人工-1 [1-1]）：条目对象遗留 link 键不参与渲染，随任意属性原样保留传出
    const isLink = column.link === true

    // payload column = 原始列引用（link 兼容壳传入派生对象 _raw 指回原列；
    // canvas 侧 prepareColumn 产物同挂 _raw）
    const columnRef = column._raw ?? column

    return ({ record, value, emit }) => {
      const rawItems = getItems(record, value)

      // 非数组（含标量）落占位链（A4）
      if (!Array.isArray(rawItems)) return

      const { entries, labels } = normalizeEntries(rawItems)

      if (!entries.length) return

      const dotsIndex = max > 0 && entries.length > max ? max - 1 : null
      const shown = max ? entries.slice(0, max) : entries

      // dots 条目 entry 置 null（无条目对象，payload 值 '...'、title = 被截断条目 join）
      const itemArgs = (entry, idx) => [
        idx === dotsIndex ? null : entry,
        idx === dotsIndex ? labels.slice(idx).join('\n\n') : labels[idx]
      ]

      // 列级透传参数（canvasItemOf / domItemOf 共用形状）
      const options = { isLink, columnColor, columnDisabled, showTitle, columnRef, record, emit }

      if (!dom) {
        return {
          items: shown.map((entry, idx) => canvasItemOf(...itemArgs(entry, idx), options))
        }
      }

      return {
        class: 'mu-table__list-cell',
        items: shown.map((entry, idx) =>
          domItemOf(...itemArgs(entry, idx), { ...options, _class: getItemClass(record), _style: getItemStyle(record) })
        )
      }
    }
  }
}
