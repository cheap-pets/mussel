import { ref, shallowRef, computed, watchEffect } from 'vue'
import { formatString } from '@/utils/string'

import lang from '@/langs'

import {
  getMonthFirstDay,
  getMonthDaysCount,
  toObject,
  toString,
  equals
} from '@/utils/date'

const { YEAR_AND_MONTH, MONTHS, DAYS_OF_WEEK, DAYS_OF_WEEK_SHORT } = lang.Calendar

export const calendarProps = {
  range: Boolean,
  format: String,
  min: [Date, String],
  max: [Date, String]
}

function getPrevMonth (year, month) {
  return month > 0
    ? { year, month: month - 1 }
    : { year: year - 1, month: 11 }
}

function getNextMonth (year, month) {
  return month < 11
    ? { year, month: month + 1 }
    : { year: year + 1, month: 0 }
}

export function useCalendar (model, props) {
  const current = ref()
  const selectingMonth = ref()
  const daysOfWeek = shallowRef(DAYS_OF_WEEK_SHORT)

  const today = computed(() => toObject(new Date()))
  const selected = computed(() => toObject(model.value))

  const year = computed(() => current.value.year)
  const month = computed(() => current.value.month)

  const caption = computed(() =>
    formatString(YEAR_AND_MONTH, year.value, MONTHS[month.value])
  )

  const data = computed(() => {
    const y = year.value
    const m = month.value

    const first = getMonthFirstDay(y, m)
    const count = getMonthDaysCount(y, m)

    const prev = getPrevMonth(y, m)
    const next = getNextMonth(y, m)
    const prevCount = getMonthDaysCount(prev.year, prev.month)

    const rows = []

    let i = 1
    let row = []

    while (true) {
      const v = i - first
      const isPrev = v < 1
      const isNext = v > count

      row.push(
        isPrev
          ? { ...prev, date: prevCount + v, prev: true }
          : isNext
            ? { ...next, date: v - count, next: true }
            : { year: y, month: m, date: v }
      )

      if (i % 7 === 0) {
        rows.push(row)

        if (v < count) row = []
        else break
      }

      i++
    }

    return rows
  })

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

  function onResize (event) {
    daysOfWeek.value = event.target.clientWidth >= 480
      ? DAYS_OF_WEEK
      : DAYS_OF_WEEK_SHORT
  }

  watchEffect(() => {
    const { year: y, month: m } = selected.value || today.value

    current.value = { year: y, month: m }
  })

  return {
    daysOfWeek,
    data,
    today,
    caption,
    current,
    selected,
    selectingMonth,
    prevMonth,
    nextMonth,
    updateDate,
    updateCurrent,
    onResize
  }
}
