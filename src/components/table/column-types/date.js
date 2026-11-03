import { toDateString } from '@/utils/date'
import { ensureFn } from '@/utils/type'

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
