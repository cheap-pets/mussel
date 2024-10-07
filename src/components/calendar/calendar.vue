<template>
  <div class="mu-calendar">
    <div class="mu-bar">
      <mu-dropdown-button
        ref="monthSelector"
        dropdown-trigger="click" dropdown-class="mu-calendar_dropdown"
        class="mu-calendar_caption" button-style="text"
        icon="calendar" :caption="caption">
        <template #dropdown>
          <month-panel v-model="current" @done="monthSelector.collapse()" />
        </template>
      </mu-dropdown-button>
      <mu-button
        :caption="lang.Calendar.THIS_MONTH"
        primary button-style="text"
        @click="updateCurrent(today)" />
      <mu-tool-button icon="chevronUp" @click="prevMonth" />
      <mu-tool-button icon="chevronDown" @click="nextMonth" />
    </div>
    <div class="mu-divider" thin />
    <table
      cellpadding="0" cellspacing="0"
      class="mu-calendar_table"
      :class="{ 'mu-masked': monthSelector?.dropdownVisible }">
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
            @click="updateDate(cell)">
            {{ cell.date }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
  import './calendar.scss'

  import lang from '@/langs'
  import MonthPanel from './month-panel.vue'

  import { ref } from 'vue'
  import { equals } from './utils'
  import { calendarProps, useCalendar } from './calendar'

  defineOptions({ name: 'MusselCalendar' })

  const model = defineModel({ type: [Date, String, Array] })
  const props = defineProps({ ...calendarProps })

  const {
    data,
    today,
    current,
    caption,
    selected,
    prevMonth,
    nextMonth,
    updateDate,
    updateCurrent
  } = useCalendar(model, props)

  const monthSelector = ref()
</script>
