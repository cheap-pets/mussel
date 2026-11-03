import { t } from '@/langs'
import { ensureFn } from '@/utils/type'

export const BoolColumn = {
  align: 'center',
  compile: (column, dom = false) => {
    const {
      trueText = t('Table.BOOL_TRUE'),
      falseText = t('Table.BOOL_FALSE'),
      color
    } = column

    const getColor = ensureFn(color)

    return ({ record, value }) => {
      if (value == null) return { text: null }

      const text = value ? trueText : falseText
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}
