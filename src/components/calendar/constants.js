import { inject } from 'vue'

export const DEFAULT_FORMAT = {
  date: 'yyyy-MM-dd',
  week: 'yyyy-Www',
  month: 'yyyy-MM',
  quarter: 'yyyy-Qq',
  year: 'yyyy'
}

export const dateProps = {
  valueType: {
    type: String,
    default: 'date',
    validator: v => ['date', 'string'].includes(v)
  },
  valueFormat: {
    type: String,
    default: 'yyyy-MM-dd'
  },
  weekStartsOn: {
    type: Number,
    default: () => inject('$mussel').options.calendar?.weekStartsOn || 0,
    validator: v => [0, 1, 2, 3, 4, 5, 6].includes(v)
  },
  min: [Date, String],
  max: [Date, String]
}

export const timeStepProp = {
  type: Number,
  default: 5,
  validator: v => [0, 1, 5, 10, 15, 30].includes(v)
}
