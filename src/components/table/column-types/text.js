import { ensureFn } from '@/utils/type'

// dom 通道落地：单行产物 { text, class, style }；lineClamp > 1 包 div 条目
// （pre-line/line-clamp + --line-clamp 样式，与原实现同构）
function domRenderOf ({ text, title, color, isLink, lineClamp }) {
  const itemClass = []
  const itemStyle = []

  if (color) itemClass.push(`text-${color}`)
  if (isLink) itemClass.push('mu-table__cell-link')
  if (lineClamp !== 1) itemClass.push('pre-line')

  if (lineClamp > 1) {
    itemClass.push('line-clamp')
    itemStyle.push({ '--line-clamp': lineClamp })

    return {
      items: [
        {
          is: 'div',
          text,
          title,
          attrs: { class: itemClass, style: itemStyle }
        }
      ]
    }
  }

  return {
    text,
    class: itemClass,
    style: itemStyle
  }
}

export const TextColumn = {
  compile: (column, dom = false) => {
    const getLineClamp = ensureFn(column.multiline ? column.lineClamp : 1)
    const showTitle = column.title === true || null
    const getColor = ensureFn(column.color)
    // link 选项（20261104-table-column-type）：true 时按 link 样式渲染——链色
    // 缺省 primary、DOM 产物追加 mu-table__cell-link（cursor + hover 下划线）；
    // canvas 端仅链色文本（无 hover 下划线/条目命中，点击仍走 cell-click）。
    // danger 不支持（红色用 color:'danger' 表达）
    const isLink = column.link === true

    return ({ record, value }) => {
      // 空文本/数组值落占位链（falsy 值与映射期 !mapped?.text 门控同式；数组值
      // A9 起不再被 text 列接受）
      if (!value || Array.isArray(value)) return null

      const text = value
      const color = getColor(record, value) || null
      const title = showTitle && text
      const lineClamp = getLineClamp(record, value)

      if (!dom) {
        return {
          text,
          color: isLink ? (color || 'primary') : color,
          title
        }
      }

      return domRenderOf({ text, title, color: isLink ? (color || 'primary') : color, isLink, lineClamp })
    }
  }
}
