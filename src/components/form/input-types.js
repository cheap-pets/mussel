export const INPUT_COMPONENTS = {
  text: ['mu-input'],
  memo: ['textarea', { class: 'mu-input', style: 'height: 80px' }],
  date: ['mu-date-input'],
  month: ['mu-date-input', { type: 'month', format: 'yyyy-MM', valueType: 'string' }],
  segmented: ['mu-segmented'],
  select: ['mu-select'],
  'multi-select': ['mu-multi-select'],
  'check-group': ['mu-check-group'],
  'radio-group': ['mu-radio-group']
}
