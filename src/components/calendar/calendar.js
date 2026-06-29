import { ref, computed, watchEffect } from 'vue'
import { pick } from '@/utils/object'

import {
  dateEquals,
  toDateObject,
  toDateString,
  getPrevMonth,
  getNextMonth
} from '@/utils/date'

export const calendarProps = {
  format: String,
  min: [Date, String],
  max: [Date, String],
  outputType: { type: String, default: 'date', validator: v => ['date', 'string'].includes(v) }
}

export function useCalendar (model, props) {
  const current = ref()

  const currentProxy = computed({
    get () {
      return new Date(current.value.year, current.value.month)
    },
    set (value) {
      const object = toDateObject(value)
      if (object) setCurrent(object)
    }
  })

  const today = toDateObject(new Date())
  const selected = computed(() => toDateObject(model.value))

  const year = computed(() => current.value.year)
  const month = computed(() => current.value.month)

  function setCurrent (dateObj) {
    Object.assign(current.value, dateObj)
  }

  function goPrevMonth () {
    setCurrent(getPrevMonth(year.value, month.value))
  }

  function goNextMonth () {
    setCurrent(getNextMonth(year.value, month.value))
  }

  function updateModelValue (value) {
    if (dateEquals(value, model.value)) return

    model.value = props.outputType === 'date'
      ? new Date(value.year, value.month, value.date ?? 1)
      : toDateString(value, props.format)
  }

  watchEffect(() => {
    current.value = pick(selected.value || today, ['year', 'month'])
  })

  return {
    year,
    month,
    today,
    current,
    selected,
    currentProxy,
    goPrevMonth,
    goNextMonth,
    setCurrent,
    updateModelValue
  }
}
