import { computed, watchEffect } from 'vue'

import { toQuarterObject } from '@/utils/date'

/**
 * 季度面板的 modelProxy 层，叠加在 date-core 之上。
 *
 * 仅 date-input.vue 这类「日期/月份/季度/年份」复合选择器才需要接入；
 * 纯日期的 calendar.vue 不引入本 hook，因而完全不承担季度相关的计算与同步。
 *
 * @param {import('vue').Ref<Date|string|null>} model
 * @param {ReturnType<typeof import('./date-core').useDateCore>} core
 */
export function useQuarterPicker (model, core) {
  const {
    todayObj,
    displayYear,
    displayQuarter,
    setDisplayQuarter
  } = core

  const quarterProxy = computed({
    get: () => model.value == null
      ? null
      : new Date(displayYear.value, displayQuarter.value * 3),
    set: v => setDisplayQuarter(toQuarterObject(v))
  })

  // model 变化时同步季度游标。
  watchEffect(() => setDisplayQuarter(
    toQuarterObject(model.value) ||
    { year: todayObj.year, quarter: Math.floor(todayObj.month / 3) }
  ))

  return { quarterProxy }
}
