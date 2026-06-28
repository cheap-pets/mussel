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
        :present="dateEquals(cell, today) || null"
        :selected="dateEquals(cell, selected) || null"
        @click="$emit('cellClick', cell)">
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
    toDateObject,
    getPrevMonth,
    getNextMonth,
    getMonthFirstDay,
    getMonthDaysCount
  } from '@/utils/date'

  defineEmits(['cellClick'])

  const props = defineProps({ year: Number, month: Number, selected: Object })

  const daysOfWeek = shallowRef($t('Calendar.DAYS_OF_WEEK_SHORT'))

  const today = computed(() => toDateObject(new Date()))

  const data = computed(() => {
    const y = props.year
    const m = props.month

    const first = getMonthFirstDay(y, m)
    const count = getMonthDaysCount(y, m)

    const prev = getPrevMonth(y, m)
    const next = getNextMonth(y, m)
    const prevCount = getMonthDaysCount(prev.year, prev.month)

    const cells = []

    let i = 1

    while (true) {
      const v = i - first
      const isPrev = v < 1
      const isNext = v > count

      cells.push(
        isPrev
          ? { ...prev, date: prevCount + v, prev: true }
          : isNext
            ? { ...next, date: v - count, next: true }
            : { year: y, month: m, date: v }
      )

      if (i % 7 === 0 && v >= count) break

      i++
    }

    return cells
  })

  const onResize = throttle(300, event => {
    daysOfWeek.value = event.target.clientWidth >= 480
      ? $t('Calendar.DAYS_OF_WEEK')
      : $t('Calendar.DAYS_OF_WEEK_SHORT')
  })
</script>

<style>
  .mu-date-picker {
    position: relative;
    display: flex;
    flex-direction: column;

    &--masked {
      pointer-events: none;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgb(0 0 0 / 10%);
      }
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
