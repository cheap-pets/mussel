import { ref, computed, watchEffect } from 'vue'

import {
  dateEquals,
  toDateObject,
  toDateString,
  getPrevMonth,
  getNextMonth
} from '@/utils/date'

import { outputTypeProp } from './props'

export const calendarProps = {
  format: { type: String, default: 'yyyy-MM-dd' },
  outputType: outputTypeProp,
  min: [Date, String],
  max: [Date, String]
}

export function useCalendar (model, props) {
  const today = toDateObject(new Date())

  const displayYear = ref(today.year)
  const displayMonth = ref(today.month)

  const selected = computed(() => toDateObject(model.value))

  const modelProxy = computed({
    get: () => model.value,
    set: v => updateModelValue(v)
  })

  const monthProxy = computed({
    get: () => new Date(displayYear.value, displayMonth.value),
    set: v => setDisplayMonth(toDateObject(v))
  })

  function setDisplayMonth (dateObj) {
    if (dateObj) {
      displayYear.value = dateObj.year
      displayMonth.value = dateObj.month
    }
  }

  function goPrevMonth () {
    setDisplayMonth(getPrevMonth(displayYear.value, displayMonth.value))
  }

  function goNextMonth () {
    setDisplayMonth(getNextMonth(displayYear.value, displayMonth.value))
  }

  function updateModelValue (value) {
    value = toDateObject(value)

    if (dateEquals(value, model.value)) return

    model.value = !value
      ? null
      : props.outputType === 'date'
        ? new Date(value.year, value.month, value.date ?? 1)
        : toDateString(value, props.format)
  }

  watchEffect(() => setDisplayMonth(selected.value || today))

  return {
    today,
    selected,
    modelProxy,
    monthProxy,
    displayYear,
    displayMonth,
    goPrevMonth,
    goNextMonth,
    setDisplayMonth,
    updateModelValue
  }
}
