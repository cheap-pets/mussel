import { ref, computed, watchEffect } from 'vue'
import { formatString } from '@/utils/string'
import { pick } from '@/utils/object'

import lang from '@/langs'

import {
  equals,
  toObject,
  toString,
  getPrevMonth,
  getNextMonth
} from '@/utils/date'

const { YEAR_AND_MONTH, MONTHS } = lang.Calendar

export const valueTypeProp = {
  type: String,
  default: 'date',
  validator: v => ['date', 'string', 'object'].includes(v?.toLowerCase?.())
}

export const calendarProps = {
  range: Boolean,
  format: String,
  valueType: valueTypeProp,
  min: [Date, String],
  max: [Date, String]
}

export function useCalendar (model, props) {
  const current = ref()

  const today = computed(() => toObject(new Date()))
  const selected = computed(() => toObject(model.value))

  const year = computed(() => current.value.year)
  const month = computed(() => current.value.month)

  const caption = computed(() =>
    formatString(YEAR_AND_MONTH, year.value, MONTHS[month.value])
  )

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
    const vType = props.valueType.toLowerCase()

    model.value = vType === 'object'
      ? value
      : vType === 'date'
        ? new Date(value.year, value.month, value.date)
        : toString(value, props.format)
  }

  function onDateCellClick (cell) {
    if (!equals(cell, selected.value)) {
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
    caption,
    current,
    selected,
    prevMonth,
    nextMonth,
    setCurrent,
    onDateCellClick,
    updateModelValue
  }
}
