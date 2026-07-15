import { ref, computed, watchEffect } from 'vue'

import {
  toDate,
  dateEquals,
  toDateObject,
  toDateString,
  getPrevMonth,
  getNextMonth
} from '@/utils/date'

/**
 * 日期选择的核心状态：日期 / 月份面板共享的显示游标与模型读写。
 *
 * - 维护 displayYear / displayMonth（日期/月份游标）与 displayQuarter
 *   （季度游标，仅作为状态容器，同步逻辑见 quarter-picker.js）；
 * - 暴露 modelProxy（内层 picker 始终拿到 Date）与 monthProxy（月份面板）；
 * - 仅同步月份游标。季度游标的 watchEffect 收拢在 quarter-picker.js，
 *   使纯日期场景（calendar.vue）完全不承担季度开销。
 *
 * @param {import('vue').Ref<Date|string|null>} model
 * @param {object} props - 需包含 valueType / valueFormat。
 */
export function useDateCore (model, props) {
  const todayObj = toDateObject(new Date())
  const displayYear = ref(todayObj.year)
  const displayMonth = ref(todayObj.month)
  const displayQuarter = ref(Math.floor(todayObj.month / 3))

  const selected = computed(() => toDateObject(model.value))

  // 内层 picker 永远拿到 Date。
  const modelProxy = computed({
    get: () => toDate(model.value),
    set: v => updateModelValue(v)
  })

  // month-picker 的 modelProxy：选中后回写显示游标。
  const monthProxy = computed({
    get: () => model.value == null
      ? null
      : new Date(displayYear.value, displayMonth.value),
    set: v => setDisplayMonth(toDateObject(v))
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
      : props.valueType === 'string'
        ? toDateString(value, props.valueFormat)
        : new Date(value.year, value.month, value.date ?? 1)
  }

  // model 变化时同步月份游标（date / month 面板的基础模式）。
  watchEffect(() => setDisplayMonth(selected.value || todayObj))

  return {
    todayObj,
    selected,
    modelProxy,
    monthProxy,
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
