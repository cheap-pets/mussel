import { ensureFn } from '@/utils/type'

// dom 通道落地：单行产物 { text, class, style }；lineClamp > 1 包 div 条目
// （pre-line/line-clamp + --line-clamp 样式）
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
    // link: true 按 link 样式渲染：链色缺省 primary、DOM 产物追加
    // mu-table__cell-link（cursor + hover 下划线）；canvas 产物携带 link 门控字段，
    // drawDisplayText 悬停谱系取色 + 下划线 + pointer 光标；点击仍走 cell-click
    // （不发 cell-item-click）。danger 不支持（红色用 color:'danger' 表达）
    const isLink = column.link === true

    return ({ record, value }) => {
      // falsy 值与数组落占位链（数组不被 text 列接受）
      if (!value || Array.isArray(value)) return null

      const text = value
      const color = getColor(record, value) || null
      const title = showTitle && text
      const lineClamp = getLineClamp(record, value)

      if (!dom) {
        // link 门控字段（绘制/交互层消费，非 link 列恒 null）；占位产物无 link，
        // drawDisplayText 不会误报命中
        return {
          text,
          color: isLink ? (color || 'primary') : color,
          title,
          link: isLink || null
        }
      }

      return domRenderOf({ text, title, color: isLink ? (color || 'primary') : color, isLink, lineClamp })
    }
  }
}
