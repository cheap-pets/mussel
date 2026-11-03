import { ensureFn } from '@/utils/type'

export const NumberColumn = {
  align: 'right',
  compile: (column, dom = false) => {
    const { locales = 'zh-CN', color } = column
    const getColor = ensureFn(color)

    const formatOption = {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      // useGrouping
      ...column.formatOption
    }

    const formatter = new Intl.NumberFormat(locales, formatOption)

    return ({ record, value }) => {
      const text = formatter.format(value)
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}

export const CurrencyColumn = {
  align: 'right',
  compile: (column, dom = false) => {
    const { locales = 'zh-CN', color } = column
    const getColor = ensureFn(color)

    const formatOption = {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...column.formatOption
    }

    const formatter = new Intl.NumberFormat(locales, formatOption)

    return ({ record, value }) => {
      const text = formatter.format(value)
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}
