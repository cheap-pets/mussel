<template>
  <div class="mu-week-picker" @sizechange="onResize">
    <div class="mu-date-grid mu-week-picker__head">
      <span v-for="w in daysOfWeek" :key="w">{{ w }}</span>
    </div>
    <div
      class="mu-date-grid mu-week-picker__body"
      @mouseleave="hoveredRow = null">
      <div
        v-for="(cell, i) in data" :key="i"
        class="mu-date-cell"
        :muted="cell.prev || cell.next"
        :present="cell.present"
        :row-hover="cell.rowIndex === hoveredRow || null"
        :row-selected="cell.rowIndex === selectedRow || null"
        @click="onCellClick(cell)"
        @mouseenter="hoveredRow = cell.rowIndex">
        {{ cell.date }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import { dateEquals, toDateObject } from '@/utils/date'
  import { useDateGrid } from './use-date-grid'

  defineOptions({ name: 'MusselWeekPicker' })

  const emit = defineEmits(['dateCellClick'])
  const model = defineModel({ type: Date, default: null })
  const props = defineProps({ year: Number, month: Number, weekStartsOn: Number })

  const { daysOfWeek, displayDate, data, onResize } = useDateGrid(model, props)

  // 当前悬停的行索引，mouseleave 时清空。
  const hoveredRow = ref(null)

  // 选中行：在网格中定位与 model 值匹配的单元格，取其行号。
  const selectedRow = computed(() => {
    const selected = toDateObject(model.value)
    if (!selected) return null

    const cell = data.value.find(c =>
      c.year === selected.year &&
      c.month === selected.month &&
      c.date === selected.date
    )

    return cell?.rowIndex ?? null
  })

  // 行选：点击任意单元格选中整行，返回该行第一天的日期。
  // 若第一天属于上月（首行偏移），则返回当月 1 号。
  function onCellClick (cell) {
    const firstInRow = data.value[cell.rowIndex * 7]
    const { year: y, month: m } = displayDate.value

    const result = firstInRow.prev
      ? new Date(y, m, 1)
      : new Date(firstInRow.year, firstInRow.month, firstInRow.date)

    if (!dateEquals(result, model.value)) {
      model.value = result
    }

    emit('dateCellClick', cell)
  }
</script>

<style>
  .mu-week-picker {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .mu-week-picker--masked {
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgb(0 0 0 / 10%);
    }
  }

  .mu-week-picker__head,
  .mu-week-picker__body {
    grid-template-columns: repeat(7, 1fr);
  }

  .mu-week-picker__head {
    column-gap: 0;
    place-items: center;

    height: 32px;

    font-weight: 600;
    color: var(--mu-text-color-soft);
  }

  .mu-week-picker__body {
    flex: 1;
    column-gap: 0;
  }

  /* 行选模式：禁用单元格独立的 hover 高亮，改由 [row-hover] 统一控制整行。 */
  .mu-week-picker__body .mu-date-cell:hover {
    background-color: transparent;
  }

  .mu-week-picker__body .mu-date-cell[row-hover] {
    background-color: var(--mu-gray-translucent);
  }

  .mu-week-picker__body .mu-date-cell[row-selected] {
    color: var(--mu-primary-color);
    background-color: var(--mu-primary-translucent);
  }

  /* 行选视觉：仅每行首尾单元格保留对应侧的边框弧度，中间单元格拉直，
     使整行高亮连成一个完整的胶囊。 */
  .mu-week-picker__body .mu-date-cell {
    border-radius: 0;

    &:nth-child(7n + 1) {
      border-radius: var(--mu-radius-control) 0 0 var(--mu-radius-control);
    }

    &:nth-child(7n) {
      border-radius: 0 var(--mu-radius-control) var(--mu-radius-control) 0;
    }
  }
</style>
