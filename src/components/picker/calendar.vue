<template>
  <div class="mu-calendar" @sizechange="onResize">
    <div class="mu-bar">
      <mu-button
        v-if="dropdown"
        class="mu-calendar_caption" button-style="text" :active="selectingMonth"
        @click="selectingMonth = !selectingMonth">
        {{ caption }}
        <mu-icon icon="chevronDown" class="mu-dropdown-arrow" :expanded="selectingMonth || null" />
      </mu-button>
      <mu-dropdown-button
        v-else
        ref="monthPicker"
        dropdown-trigger="click" dropdown-class="mu-calendar_dropdown"
        class="mu-calendar_caption" button-style="text"
        icon="calendar" :caption="caption"
        @dropdown:show="selectingMonth = true"
        @dropdown:hide="selectingMonth = false">
        <template #dropdown>
          <mu-month-picker v-model="current" @done="monthPicker.collapse()" />
        </template>
      </mu-dropdown-button>
      <template v-if="!selectingMonth">
        <mu-button
          :caption="lang.Calendar.THIS_MONTH"
          primary button-style="text"
          @click="updateCurrent(today)" />
        <mu-tool-button icon="chevronUp" @click="prevMonth" />
        <mu-tool-button icon="chevronDown" @click="nextMonth" />
      </template>
    </div>
    <div class="mu-divider" thin />
    <mu-month-picker
      v-if="dropdown && selectingMonth"
      v-model="current"
      @done="selectingMonth = false" />
    <table
      v-else
      cellpadding="0" cellspacing="0"
      class="mu-calendar_table"
      :class="{ 'mu-masked': selectingMonth }">
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

  import { ref, inject } from 'vue'
  import { equals } from '../../utils/date'
  import { calendarProps, useCalendar } from './calendar'

  import lang from '@/langs'

  defineOptions({ name: 'MusselCalendar' })

  const model = defineModel({ type: [Date, String, Array] })
  const props = defineProps({ ...calendarProps })

  const dropdown = inject('dropdown', null)

  const {
    daysOfWeek,
    data,
    today,
    current,
    caption,
    selected,
    selectingMonth,
    prevMonth,
    nextMonth,
    updateDate,
    updateCurrent,
    onResize
  } = useCalendar(model, props)

  const monthPicker = ref()
</script>
