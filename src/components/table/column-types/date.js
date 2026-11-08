import { toDateString } from '@/utils/date'
import { ensureFn } from '@/utils/type'

// 双通道色形态：dom 落 text-{color} 类，canvas 携带色名（绘制层查 theme.colors）
export const DateColumn = {
  align: 'right',
  compile: (column, dom = false) => {
    const {
      formatter = toDateString,
      format = 'yyyy-MM-dd',
      color
    } = column
    const getColor = ensureFn(color)

    return ({ record, value }) => {
      const text = formatter(value, format)
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}

export const DateTimeColumn = {
  align: 'right',
  compile: (column, dom = false) => {
    const {
      formatter = toDateString,
      format = 'yyyy-MM-dd hh:mm',
      color
    } = column
    const getColor = ensureFn(color)

    return ({ record, value }) => {
      const text = formatter(value, format)
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}
