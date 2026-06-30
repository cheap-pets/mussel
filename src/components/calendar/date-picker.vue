<template>
  <div class="mu-date-picker" @sizechange="onResize">
    <div class="mu-date-grid mu-date-picker__head">
      <span v-for="w in daysOfWeek" :key="w">{{ w }}</span>
    </div>
    <div class="mu-date-grid mu-date-picker__body">
      <div
        v-for="(cell, i) in data" :key="i"
        class="mu-date-cell"
        :muted="cell.prev || cell.next"
        :present="cell.present"
        :selected="cell.selected"
        @click="onCellClick(cell)">
        {{ cell.date }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { shallowRef, computed } from 'vue'
  import { throttle } from 'throttle-debounce'
  import { t as $t } from '@/langs'

  import {
    dateEquals,
    monthEquals,
    toDateObject,
    toDateString,
    getPrevMonth,
    getNextMonth,
    getMonthFirstDay,
    getMonthDaysCount
  } from '@/utils/date'

  const emit = defineEmits(['dateCellClick'])

  const model = defineModel({ type: [Date, String] })

  const props = defineProps({
    year: Number,
    month: Number,
    outputType: { type: String, default: 'date', validator: v => ['date', 'string'].includes(v) }
  })

  const daysOfWeek = shallowRef($t('Datetime.DAYS_OF_WEEK_SHORT'))

  const data = computed(() => {
    const today = toDateObject(new Date())
    const selected = toDateObject(model.value)

    const { year: y, month: m } =
      props.year != null && props.month != null
        ? props
        : selected || today

    const first = getMonthFirstDay(y, m)
    const count = getMonthDaysCount(y, m)

    const prev = getPrevMonth(y, m)
    const next = getNextMonth(y, m)
    const prevCount = getMonthDaysCount(prev.year, prev.month)

    const isCurrentMonth = monthEquals({ year: y, month: m }, today)
    const isDisplayMonth = monthEquals({ year: y, month: m }, selected)

    const cells = []

    function buildCell (v) {
      if (v < 1) {
        return { prev: true, ...prev, date: prevCount + v }
      }

      if (v > count) {
        return { next: true, ...next, date: v - count }
      }

      const cell = { year: y, month: m, date: v }

      if (isCurrentMonth && v === today.date) {
        cell.present = true
      }

      if (isDisplayMonth && v === selected.date) {
        cell.selected = true
      }

      return cell
    }

    let i = 1

    while (true) {
      const v = i - first
      const cell = buildCell(v)

      cells.push(cell)

      if (i % 7 === 0 && v >= count) break

      i++
    }

    return cells
  })

  function onCellClick (cell) {
    if (!dateEquals(cell, model.value)) {
      const date = new Date(cell.year, cell.month, cell.date)

      model.value = props.outputType === 'date'
        ? date
        : toDateString(date, props.format)
    }

    emit('dateCellClick', cell)
  }

  const onResize = throttle(300, event => {
    daysOfWeek.value = event.target.clientWidth >= 480
      ? $t('Datetime.DAYS_OF_WEEK')
      : $t('Datetime.DAYS_OF_WEEK_SHORT')
  })
</script>

<style>
  .mu-date-picker {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .mu-date-picker--masked {
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgb(0 0 0 / 10%);
    }
  }

  .mu-date-picker__head,
  .mu-date-picker__body {
    grid-template-columns: repeat(7, 1fr);
  }

  .mu-date-picker__head {
    place-items: center;
    height: 32px;
    font-weight: 600;
    color: var(--mu-text-color-soft);
  }

  .mu-date-picker__body {
    flex: 1;
  }
</style>
