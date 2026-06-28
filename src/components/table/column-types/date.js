import { toDateString } from '@/utils/date'

export const DateColumn = {
  align: 'right',
  compile (column) {
    const {
      formatter = toDateString,
      format = 'yyyy-MM-dd'
    } = column

    return ({ value }) => ({ text: formatter(value, format) })
  }
}

export const DateTimeColumn = {
  align: 'right',
  compile (column) {
    const {
      formatter = toDateString,
      format = 'yyyy-MM-dd hh:mm'
    } = column

    return ({ value }) => ({ text: formatter(value, format) })
  }
}
