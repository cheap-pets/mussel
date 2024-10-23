<template>
  <combo-wrapper
    ref="wrapper"
    v-model="value"
    class="mu-date-input"
    dropdown-icon="calendar"
    :dropdown-class="[dropdownClass, 'mu-calendar']"
    @dropdown:show="onExpand">
    <template #dropdown>
      <mu-toolbar>
        <div v-if="type === 'month'" class="mu-caption">
          {{ caption }}
        </div>
        <mu-button
          v-else
          class="mu-caption"
          :active="selectingMonth"
          @click="selectingMonth = !selectingMonth">
          {{ caption }}
          <mu-icon icon="chevronDown" class="mu-dropdown-arrow" :expanded="selectingMonth || null" />
        </mu-button>
        <template v-if="!selectingMonth">
          <mu-button :caption="THIS_MONTH" primary @click="setCurrent(today)" />
          <mu-tool-button icon="chevronUp" @click="prevMonth" />
          <mu-tool-button icon="chevronDown" @click="nextMonth" />
        </template>
        <mu-button
          v-else
          :caption="THIS_YEAR"
          primary button-style="text"
          @click="monthSelector.setYear(today.year)" />
      </mu-toolbar>
      <month-picker
        v-if="selectingMonth"
        ref="monthSelector"
        v-model="current"
        value-type="Object"
        @month-cell-click="onMonthCellClick" />
      <calendar-grid
        v-else
        :year="year"
        :month="month"
        :selected="selected"
        @cell-click="onDateCellClick" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './date-input.scss'

  import { ref, computed } from 'vue'
  import { formatString } from '@/utils/string'
  import { toString, monthEquals } from '@/utils/date'
  import { calendarProps, useCalendar } from '../calendar/calendar'

  import lang from '@/langs'
  import ComboWrapper from './combo-wrapper.vue'
  import MonthPicker from '../calendar/month-picker.vue'
  import CalendarGrid from '../calendar/date-table.vue'

  const { YEAR_AND_MONTH, MONTHS, THIS_YEAR, THIS_MONTH } = lang.Calendar

  defineOptions({ name: 'MusselDateInput' })

  const model = defineModel({
    type: [Date, String, Object, Array]
  })

  const props = defineProps({
    dropdownClass: null,
    type: {
      type: String,
      default: 'date',
      validator: v => ['date', 'month'].includes(v)
    },
    ...calendarProps
  })

  const {
    year,
    month,
    today,
    current,
    selected,
    prevMonth,
    nextMonth,
    setCurrent,
    updateModelValue,
    onDateCellClick: _onDateCellClick
  } = useCalendar(model, props)

  const wrapper = ref()
  const monthSelector = ref()
  const selectingMonth = ref()

  const firstYear = computed(() => monthSelector.value?.firstYear)

  const caption = computed(() =>
    selectingMonth.value
      ? `${firstYear.value} ~ ${firstYear.value + 9}`
      : formatString(YEAR_AND_MONTH, year.value, MONTHS[month.value])
  )

  const value = computed({
    get () {
      return toString(model.value, props.format)
    },
    set (v) {
      model.value = v
    }
  })

  function onExpand () {
    selectingMonth.value = props.type === 'month'
  }

  function onDateCellClick (cell) {
    _onDateCellClick(cell)
    wrapper.value.collapse()
  }

  function onMonthCellClick () {
    if (props.type === 'month') {
      if (!monthEquals(current.value, selected.value)) {
        updateModelValue(current.value)
      }

      wrapper.value.collapse()
    } else {
      selectingMonth.value = false
    }
  }
</script>
