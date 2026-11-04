import { ensureFn } from '@/utils/type'

export const TextColumn = {
  compile: (column, dom = false) => {
    const getLineClamp = ensureFn(column.multiline ? column.lineClamp : 1)
    const showTitle = column.title === true || null
    const getColor = ensureFn(column.color)

    return ({ record, value }) => {
      // 空文本落占位链（falsy 值与映射期 !mapped?.text 门控同式）
      if (!value) return null

      const text = value
      const color = getColor(record, value) || null
      const title = showTitle && text
      const lineClamp = getLineClamp(record, value)

      if (!dom) {
        return {
          text,
          color,
          title
        }
      }

      const itemClass = []
      const itemStyle = []

      if (color) itemClass.push(`text-${color}`)
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
      } else {
        return {
          text,
          class: itemClass,
          style: itemStyle
        }
      }
    }
  }
}
