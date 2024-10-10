<template>
  <div class="mu-calendar">
    <div class="mu-bar">
      <mu-dropdown-button
        ref="monthDropdown"
        :caption="caption"
        icon="calendar"
        button-style="text"
        class="mu-calendar_caption"
        dropdown-class="mu-calendar_dropdown">
        <template #dropdown>
          <month-picker v-model="current" @update:model-value="monthDropdown.collapse()" />
        </template>
      </mu-dropdown-button>
      <template v-if="!monthDropdown?.dropdownVisible">
        <mu-button :caption="lang.Calendar.THIS_MONTH" primary button-style="text" @click="updateCurrent(today)" />
        <mu-tool-button icon="chevronUp" @click="prevMonth" />
        <mu-tool-button icon="chevronDown" @click="nextMonth" />
      </template>
    </div>
    <!-- <div class="mu-divider" thin /> -->
    <calendar-grid
      :class="{ 'mu-masked': monthDropdown?.dropdownVisible }"
      :year="year"
      :month="month"
      :selected="selected"
      @cell-click="updateDate" />
  </div>
</template>

<script setup>
  import './calendar.scss'

  import { ref } from 'vue'
  import { calendarProps, useCalendar } from './calendar'

  import lang from '@/langs'
  import CalendarGrid from './calendar-grid.vue'
  import MonthPicker from './month-picker.vue'

  defineOptions({ name: 'MusselCalendar' })

  const model = defineModel({ type: [Date, String, Array] })
  const props = defineProps({ ...calendarProps })

  const {
    year,
    month,
    today,
    current,
    caption,
    selected,
    prevMonth,
    nextMonth,
    updateDate,
    updateCurrent
  } = useCalendar(model, props)

  const monthDropdown = ref()
</script>
