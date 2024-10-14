<template>
  <div class="mu-calendar">
    <mu-toolbar>
      <mu-dropdown-button
        ref="monthDropdown"
        :caption="caption"
        icon="calendar"
        class="mu-caption"
        dropdown-class="mu-calendar_dropdown">
        <template #dropdown>
          <month-picker
            ref="monthSelector"
            v-model="current"
            value-type="Object"
            @month-cell-click="monthDropdown.collapse()" />
        </template>
      </mu-dropdown-button>
      <template v-if="!monthDropdown?.dropdownVisible">
        <mu-button :caption="THIS_MONTH" primary @click="setCurrent(today)" />
        <mu-tool-button icon="chevronUp" @click="prevMonth" />
        <mu-tool-button icon="chevronDown" @click="nextMonth" />
      </template>
    </mu-toolbar>
    <date-table
      :class="{ 'mu-masked': monthDropdown?.dropdownVisible }"
      :year="year"
      :month="month"
      :selected="selected"
      @cell-click="onDateCellClick" />
  </div>
</template>

<script setup>
  import './calendar.scss'

  import { ref, computed } from 'vue'
  import { formatString } from '@/utils/string'
  import { calendarProps, useCalendar } from './calendar'

  import lang from '@/langs'
  import DateTable from './date-table.vue'
  import MonthPicker from './month-picker.vue'

  const { YEAR_AND_MONTH, MONTHS, THIS_MONTH } = lang.Calendar

  defineOptions({ name: 'MusselCalendar' })

  const model = defineModel({ type: [Date, String, Object, Array] })
  const props = defineProps({ ...calendarProps })

  const {
    year,
    month,
    today,
    current,
    selected,
    prevMonth,
    nextMonth,
    setCurrent,
    onDateCellClick
  } = useCalendar(model, props)

  const monthDropdown = ref()
  const monthSelector = ref()

  const selectingMonth = computed(() => monthDropdown.value?.dropdownVisible)
  const firstYear = computed(() => monthSelector.value?.firstYear)

  const caption = computed(() =>
    selectingMonth.value
      ? `${firstYear.value} ~ ${firstYear.value + 9}`
      : formatString(YEAR_AND_MONTH, year.value, MONTHS[month.value])
  )
</script>
