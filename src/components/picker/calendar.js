import { ref, computed, watchEffect } from 'vue'
import { formatString } from '@/utils/string'

import lang from '@/langs'

import {
  equals,
  toObject,
  toString,
  getPrevMonth,
  getNextMonth
} from '@/utils/date'

const { YEAR_AND_MONTH, MONTHS } = lang.Calendar

export const calendarProps = {
  range: Boolean,
  format: String,
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

  function updateCurrent (value) {
    Object.assign(current.value, { year: value.year, month: value.month })
  }

  function prevMonth () {
    updateCurrent(getPrevMonth(year.value, month.value))
  }

  function nextMonth () {
    updateCurrent(getNextMonth(year.value, month.value))
  }

  function updateDate (cell) {
    if (model.value && equals(cell, model.value)) return

    const v = new Date(cell.year, cell.month, cell.date)

    model.value = props.format
      ? toString(v, props.format)
      : v
  }

  watchEffect(() => {
    const { year: y, month: m } = selected.value || today.value

    current.value = { year: y, month: m }
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
    updateDate,
    updateCurrent
  }
}
