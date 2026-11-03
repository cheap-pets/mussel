import { t } from '@/langs'

export const BoolColumn = {
  align: 'center',
  compile: column => {
    const {
      trueText = t('Table.BOOL_TRUE'),
      falseText = t('Table.BOOL_FALSE')
    } = column

    return ({ value }) => ({ text: value == null ? null : (value ? trueText : falseText) })
  }
}
