import { ensureFn } from '../utils'

export const CheckColumn = {
  align: 'center',
  width: '50px',
  compile: column => {
    const disabledFn = ensureFn(column.disabled)

    return ({ record, value, emit }) => ({
      items: [
        {
          is: 'div',
          text: '✓',
          attrs: {
            class: 'mu-table__cell-check',
            'data-disabled': disabledFn(record, value),
            'data-checked': value
          },
          events: {
            click () {
              emit(
                'update:cell-value',
                { record, column, value: !value }
              )
            }
          }
        }
      ]
    })
  }
}
