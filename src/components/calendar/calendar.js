import { ref, computed, watchEffect } from 'vue'
import { pick } from '@/utils/object'

import {
  dateEquals,
  toDateObject,
  toDateString,
  getPrevMonth,
  getNextMonth
} from '@/utils/date'

export const outputTypeProp = {
  type: String,
  default: 'date',
  validator: v => ['date', 'string', 'object'].includes(v)
}

export const calendarProps = {
  outputType: outputTypeProp,
  format: String,
  // range: Boolean,
  min: [Date, String],
  max: [Date, String]
}

export function useCalendar (model, props) {
  const current = ref()

  const today = computed(() => toDateObject(new Date()))
  const selected = computed(() => toDateObject(model.value))

  const year = computed(() => current.value.year)
  const month = computed(() => current.value.month)

  function setCurrent (value) {
    Object.assign(current.value, { year: value.year, month: value.month })
  }

  function prevMonth () {
    setCurrent(getPrevMonth(year.value, month.value))
  }

  function nextMonth () {
    setCurrent(getNextMonth(year.value, month.value))
  }

  function updateModelValue (value) {
    const vType = props.outputType.toLowerCase()

    model.value = vType === 'object'
      ? value
      : vType === 'date'
        ? new Date(value.year, value.month, value.date ?? 1)
        : toDateString(value, props.format)
  }

  function onDateCellClick (cell) {
    if (!dateEquals(cell, selected.value)) {
      updateModelValue(pick(cell, ['year', 'month', 'date']))
    }
  }

  watchEffect(() => {
    current.value = pick(selected.value || today.value, ['year', 'month'])
  })

  return {
    year,
    month,
    today,
    current,
    selected,
    prevMonth,
    nextMonth,
    setCurrent,
    onDateCellClick,
    updateModelValue
  }
}
