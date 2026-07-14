import { ref, computed, watchEffect } from 'vue'

import {
  toDate,
  dateEquals,
  toDateObject,
  toDateString,
  toQuarterObject,
  getPrevMonth,
  getNextMonth
} from '@/utils/date'

export const dateProps = {
  valueFormat: { type: String, default: 'yyyy-MM-dd' },
  min: [Date, String],
  max: [Date, String]
}

// The pickers (date/month/quarter/year) operate on Date objects only.
// When the public model is a String, we format the value with `valueFormat`
// before emitting; the type to emit is inferred from `typeof model.value`.
const isStringModel = model => typeof model?.value === 'string'

export function useDate (model, props) {
  const today = toDateObject(new Date())

  const displayYear = ref(today.year)
  const displayMonth = ref(today.month)
  const displayQuarter = ref(Math.floor(today.month / 3))

  const selected = computed(() => toDateObject(model.value))
  const selectedQuarter = computed(() => toQuarterObject(model.value))

  // The inner pickers always see a Date.
  const modelProxy = computed({
    get: () => toDate(model.value),
    set: v => updateModelValue(v)
  })

  const monthProxy = computed({
    get: () => model.value == null
      ? null
      : new Date(displayYear.value, displayMonth.value),
    set: v => setDisplayMonth(toDateObject(v))
  })

  const quarterProxy = computed({
    get: () => model.value == null
      ? null
      : new Date(displayYear.value, displayQuarter.value * 3),
    set: v => setDisplayQuarter(toQuarterObject(v))
  })

  function setDisplayMonth (dateObj) {
    if (dateObj) {
      displayYear.value = dateObj.year
      displayMonth.value = dateObj.month
    }
  }

  function setDisplayQuarter (quarterObj) {
    if (quarterObj) {
      displayYear.value = quarterObj.year
      displayQuarter.value = quarterObj.quarter
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
      : isStringModel(model)
        ? toDateString(value, props.valueFormat)
        : new Date(value.year, value.month, value.date ?? 1)
  }

  watchEffect(() => setDisplayMonth(selected.value || today))
  watchEffect(() => setDisplayQuarter(selectedQuarter.value || {
    year: today.year,
    quarter: Math.floor(today.month / 3)
  }))

  return {
    today,
    selected,
    modelProxy,
    monthProxy,
    quarterProxy,
    displayYear,
    displayMonth,
    displayQuarter,
    setDisplayMonth,
    setDisplayQuarter,
    goPrevMonth,
    goNextMonth,
    updateModelValue
  }
}
