<template>
  <div class="mu-date-range-picker" @sizechange="onResize">
    <div class="mu-date-grid mu-date-range-picker__head">
      <span v-for="w in daysOfWeek" :key="w">{{ w }}</span>
    </div>
    <div
      class="mu-date-grid mu-date-range-picker__body"
      @mouseleave="hoveredDate = null">
      <div
        v-for="(cell, i) in cells" :key="i"
        class="mu-date-cell"
        :muted="cell.prev || cell.next"
        :present="cell.present"
        :selected="cell.selected || null"
        :in-range="cell.inRange || null"
        :range-start="cell.rangeStart || null"
        :range-end="cell.rangeEnd || null"
        @click="onCellClick(cell)"
        @mouseenter="hoveredDate = cell">
        {{ cell.date }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import { toDate, toDateObject } from '@/utils/date'
  import { useDateGrid } from './use-date-grid'

  defineOptions({ name: 'MusselDateRangePicker' })

  const emit = defineEmits(['dateCellClick'])

  // model 为 { startDate, endDate }，两侧均为 Date 或 null。
  const model = defineModel({ type: Object, default: null })
  const props = defineProps({ year: Number, month: Number, weekStartsOn: Number })

  const startRef = computed(() => toDate(model.value?.startDate))
  const { daysOfWeek, data, onResize } = useDateGrid(startRef, props)

  // 悬停预览：选了开始未选结束时，以悬停日期临时充当结束日期。
  const hoveredDate = ref(null)

  // 可比的日期键：year*10000 + month*100 + date（month 为 0 基）。
  function dayKey (obj) {
    return obj.year * 10000 + obj.month * 100 + obj.date
  }

  // 在网格基础上为落在区间内的单元格追加端点 / in-range 标记。
  const cells = computed(() => {
    const startDate = toDateObject(model.value?.startDate) || null

    let startKey = null
    let endKey = null

    if (startDate) {
      startKey = dayKey(startDate)

      const hover = hoveredDate.value
      const endDate = toDateObject(model.value.endDate) || (hover && dayKey(hover) > startKey ? hover : null)

      endKey = endDate ? dayKey(endDate) : null
    }

    return data.value.map(cell => {
      const k = dayKey(cell)

      if (k === startKey) {
        return { ...cell, selected: true, rangeStart: true, rangeEnd: k === endKey || null }
      }

      if (k === endKey) {
        return { ...cell, selected: true, rangeEnd: true }
      }

      if (startKey != null && endKey != null && startKey < k && k < endKey) {
        return { ...cell, inRange: true }
      }

      return cell
    })
  })

  /**
   * 区间点击规则：
   * - 无开始日期 → 点击日期记为开始日期；
   * - 仅有开始日期 → 点击日期早于开始日期时替换开始日期，等于或晚于时记为结束日期；
   * - 已有完整区间 → 清空当前选择，点击日期重新记为开始日期。
   */
  function selectDate (date) {
    const start = toDate(model.value?.startDate)
    const end = toDate(model.value?.endDate)

    model.value = start && end
      ? { startDate: date, endDate: null }
      : start && date >= start
        ? { startDate: start, endDate: date }
        : { startDate: date, endDate: null }
  }

  function onCellClick (cell) {
    selectDate(new Date(cell.year, cell.month, cell.date))
    emit('dateCellClick', cell)
  }

  defineExpose({ selectDate })
</script>

<style>
  .mu-date-range-picker {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .mu-date-range-picker__head,
  .mu-date-range-picker__body {
    grid-template-columns: repeat(7, 1fr);
  }

  /* 与 .mu-date-grid 的 gap 平级会受样式表顺序影响，复合选择器确保列间距清零。 */
  .mu-date-grid.mu-date-range-picker__head {
    column-gap: 0;
  }

  .mu-date-grid.mu-date-range-picker__body {
    column-gap: 0;
  }

  .mu-date-range-picker__head {
    place-items: center;
    height: 32px;
    font-weight: 600;
    color: var(--mu-text-color-soft);
  }

  .mu-date-range-picker__body {
    flex: 1;
  }

  /* 区间视觉：中间单元格铺平、端点保留外侧弧度，使区间连成完整胶囊。 */
  .mu-date-range-picker__body .mu-date-cell {
    border-radius: 0;

    &[in-range] {
      background-color: var(--mu-primary-faint);
    }

    &[range-start] {
      border-radius: var(--mu-radius-control) 0 0 var(--mu-radius-control);
    }

    &[range-end] {
      border-radius: 0 var(--mu-radius-control) var(--mu-radius-control) 0;
    }

    &[range-start][range-end] {
      border-radius: var(--mu-radius-control);
    }
  }
</style>
