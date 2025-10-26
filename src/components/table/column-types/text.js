import { ensureFn } from '../utils'

export const TextColumn = {
  compile: column => {
    if (!column.multiline) {
      return ({ value }) => ({ text: value })
    }

    if (!column.lineClamp) {
      return ({ value }) => ({ class: 'mu-table__td--pre-line', text: value })
    }

    const getLineClamp = ensureFn(column.lineClamp)
    const showTitle = column.title === true || null

    return ({ record, value }) => {
      const lineClamp = getLineClamp(record, value)

      return lineClamp > 1
        ? {
            items: [
              {
                is: 'div',
                text: value,
                title: showTitle && value,
                attrs: { class: 'line-clamp', style: { '--line-clamp': lineClamp } }
              }
            ]
          }
        : lineClamp === 1
          ? { text: value }
          : { text: value, class: 'mu-table__td--pre-line' }
    }
  }
}
