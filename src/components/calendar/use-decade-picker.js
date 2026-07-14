import { ref, computed, watchEffect } from 'vue'

/**
 * 十年翻页导航逻辑，为 month-picker / quarter-picker 共用。
 *
 * @param {import('vue').Ref<Date|null>} model - 仅接受 Date（null 表示未选）。
 * @param {(value: Date) => { year: number }} toSelectedObject
 *   将 model 转为 { year, ... } 对象（如 toDateObject / toQuarterObject）。
 * @param {number} currentYear - 今天的年份，用于初始十年页定位。
 */
export function useDecadePicker (model, toSelectedObject, currentYear) {
  const startYear = ref(Math.floor(currentYear / 10) * 10)
  const chosenYear = ref()

  const years = computed(() =>
    Array.from({ length: 10 }, (_, idx) => startYear.value + idx)
  )

  const isActiveDecade = computed(() => {
    const start = startYear.value
    const year = chosenYear.value

    return year && start <= year && start + 10 > year
  })

  function setStartYear (year) {
    startYear.value = Math.floor(year / 10) * 10
  }

  function onYearCellClick (year) {
    chosenYear.value = year
  }

  // model 变化时同步 chosenYear。
  watchEffect(() => {
    chosenYear.value = toSelectedObject(model.value)?.year
  })

  // chosenYear 变化时定位十年页。
  watchEffect(() => {
    setStartYear(chosenYear.value || currentYear)
  })

  return {
    startYear,
    chosenYear,
    years,
    isActiveDecade,
    setStartYear,
    onYearCellClick
  }
}
