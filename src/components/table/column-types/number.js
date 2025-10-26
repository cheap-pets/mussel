export const NumberColumn = {
  align: 'right',
  compile (column) {
    const { locale = 'zh-CN' } = column

    const formatOption = {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      // useGrouping
      ...column.formatOption
    }

    const formatter = new Intl.NumberFormat(locale, formatOption)

    return ({ value }) => ({ text: formatter.format(value) })
  }
}

export const CurrencyColumn = {
  align: 'right',
  compile (column) {
    const { locales = 'zh-CN' } = column

    const formatOption = {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...column.formatOption
    }

    const formatter = new Intl.NumberFormat(locales, formatOption)

    return ({ value }) => (
      {
        text: formatter.format(value)
      }
    )
  }
}
