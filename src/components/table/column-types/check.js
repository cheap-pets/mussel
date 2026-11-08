import { ensureFn } from '@/utils/type'

export const CheckColumn = {
  align: 'center',
  width: '50px',
  // compile 无 dom 参数：check 条目双通道共用 DOM 形态产物，canvas 侧
  // resolveItemKind 按 mu-table__cell-check 类名回退识别（item-painters.js）
  compile: column => {
    const disabledFn = ensureFn(column.disabled)

    return ({ record, value, emit }) => ({
      items: [
        {
          is: 'div',
          text: '✓',
          attrs: {
            class: 'mu-table__cell-check',
            disabled: disabledFn(record, value) || null,
            'data-checked': value || null
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
