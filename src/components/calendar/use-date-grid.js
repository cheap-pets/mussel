import { ref, computed } from 'vue'
import { throttle } from 'throttle-debounce'

import { t as $t } from '@/langs'

import {
  monthEquals,
  toDateObject,
  getPrevMonth,
  getNextMonth,
  getMonthFirstDay,
  getMonthDaysCount
} from '@/utils/date'

/**
 * 日期网格的显示基础，为 date-picker / week-picker 共用。
 *
 * 负责星期表头轮转、全称/简称随宽度切换，以及按显示年月构建含
 * prev / next / present 标记与 rowIndex 的单元格网格。
 *
 * 不涉及选中策略——单选（date-picker）与行选（week-picker）由各 picker
 * 自行处理，使本 hook 保持纯粹。
 *
 * @param {import('vue').Ref<Date|null>} model
 * @param {{ year?: number, month?: number, weekStartsOn?: number }} props
 */
export function useDateGrid (model, props) {
  // 按一周起始日轮转星期表头（基准数组固定以周日开头）。
  function rotateDays (arr) {
    const d = props.weekStartsOn ?? 0
    return d ? [...arr.slice(d), ...arr.slice(0, d)] : arr
  }

  // fullToggle 随容器宽度切换全称/简称，weekStartsOn 变化时自动轮转。
  const fullToggle = ref(false)

  const daysOfWeek = computed(() =>
    rotateDays(fullToggle.value
      ? $t('Datetime.DAYS_OF_WEEK')
      : $t('Datetime.DAYS_OF_WEEK_SHORT'))
  )

  // 解析当前显示的年月：优先使用 props，否则跟随选中值或今天。
  const displayDate = computed(() => {
    const todayObj = toDateObject(new Date())
    const selected = toDateObject(model.value)

    return props.year != null && props.month != null
      ? { year: props.year, month: props.month }
      : selected || todayObj
  })

  const data = computed(() => {
    const todayObj = toDateObject(new Date())

    const { year: y, month: m } = displayDate.value

    const first = getMonthFirstDay(y, m)
    const offset = (first - (props.weekStartsOn ?? 0) + 7) % 7
    const count = getMonthDaysCount(y, m)

    const prev = getPrevMonth(y, m)
    const next = getNextMonth(y, m)
    const prevCount = getMonthDaysCount(prev.year, prev.month)

    const isCurrentMonth = monthEquals({ year: y, month: m }, todayObj)

    function buildCell (v, rowIndex) {
      if (v < 1) {
        return { prev: true, ...prev, date: prevCount + v, rowIndex }
      }

      if (v > count) {
        return { next: true, ...next, date: v - count, rowIndex }
      }

      const cell = { year: y, month: m, date: v, rowIndex }

      if (isCurrentMonth && v === todayObj.date) {
        cell.present = true
      }

      return cell
    }

    const cells = []
    let i = 1

    while (true) {
      const v = i - offset
      const rowIndex = Math.floor((i - 1) / 7)
      cells.push(buildCell(v, rowIndex))

      if (i % 7 === 0 && v >= count) break

      i++
    }

    return cells
  })

  // fullToggle 随容器宽度切换全称/简称。
  const onResize = throttle(300, event => {
    fullToggle.value = event.target.clientWidth >= 480
  })

  return {
    fullToggle,
    daysOfWeek,
    displayDate,
    data,
    onResize
  }
}
