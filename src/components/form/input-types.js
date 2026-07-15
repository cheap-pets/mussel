export const INPUT_TYPES = {
  text: ['mu-input'],
  memo: ['textarea', { class: 'mu-input', style: 'height: 80px' }],
  date: ['mu-date-input'],
  week: ['mu-date-input', { type: 'week' }],
  month: ['mu-date-input', { type: 'month' }],
  quarter: ['mu-date-input', { type: 'quarter' }],
  year: ['mu-date-input', { type: 'year' }],
  time: ['mu-time-input'],
  color: ['mu-color-input'],
  segmented: ['mu-segmented'],
  select: ['mu-select'],
  'multi-select': ['mu-multi-select'],
  'check-group': ['mu-check-group'],
  'radio-group': ['mu-radio-group']
}
