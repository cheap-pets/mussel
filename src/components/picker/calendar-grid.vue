<template>
  <table class="mu-calendar_date-grid mu-calendar-grid" @sizechange="onResize">
    <thead>
      <th v-for="v in daysOfWeek" :key="v">
        {{ v }}
      </th>
    </thead>
    <tbody>
      <tr v-for="(row, i) in data" :key="i">
        <td
          v-for="(cell, j) in row" :key="j"
          :muted="cell.prev || cell.next"
          :present="equals(cell, today) || null"
          :selected="equals(cell, selected) || null"
          @click="$emit('cellClick', cell)">
          {{ cell.date }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
  import lang from '@/langs'

  import { shallowRef, computed } from 'vue'
  import { throttle } from 'throttle-debounce'

  import {
    equals,
    toObject,
    getPrevMonth,
    getNextMonth,
    getMonthFirstDay,
    getMonthDaysCount
  } from '@/utils/date'

  const { DAYS_OF_WEEK, DAYS_OF_WEEK_SHORT } = lang.Calendar

  defineEmits(['cellClick'])

  const props = defineProps({ year: Number, month: Number, selected: Object })

  const daysOfWeek = shallowRef(DAYS_OF_WEEK_SHORT)

  const today = computed(() => toObject(new Date()))

  const data = computed(() => {
    const y = props.year
    const m = props.month

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

  const onResize = throttle(300, event => {
    daysOfWeek.value = event.target.clientWidth >= 480
      ? DAYS_OF_WEEK
      : DAYS_OF_WEEK_SHORT
  })
</script>
