import { ensureFn } from '@/utils/type'
import { createDisplayMapper } from '../mappings'

export const TextColumn = {
  compile: (column, dom = false) => {
    const getLineClamp = ensureFn(column.multiline ? column.lineClamp : 1)
    const showTitle = column.title === true || null
    const mapper = createDisplayMapper(column)

    return ({ record, value }) => {
      const mapped = mapper(value)

      if (!mapped?.text) return null

      const {
        text,
        color,
        class: mClass,
        style: mStyle,
        title = showTitle && mapped.text,
        ...attrs
      } = mapped

      const lineClamp = getLineClamp(record, value)

      if (!dom) {
        return {
          text,
          color,
          title,
          ...attrs
        }
      }

      const itemClass = [mClass]
      const itemStyle = [mStyle]

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
              attrs: { class: itemClass, style: itemStyle, ...attrs }
            }
          ]
        }
      } else {
        return {
          text,
          class: itemClass,
          style: itemStyle,
          ...attrs
        }
      }
    }
  }
}
