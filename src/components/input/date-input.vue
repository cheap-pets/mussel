<template>
  <combo-wrapper
    ref="wrapper"
    v-model="value"
    class="mu-date-input"
    dropdown-icon="calendar"
    dropdown-class="mu-date-input_dropdown"
    @dropdown:show="onExpand">
    <template #dropdown>
      <div class="mu-calendar">
        <div class="mu-bar">
          <mu-button
            class="mu-calendar_caption"
            button-style="text"
            :active="selectingMonth"
            @click="selectingMonth = !selectingMonth">
            {{ caption }}
            <mu-icon icon="chevronDown" class="mu-dropdown-arrow" :expanded="selectingMonth || null" />
          </mu-button>
          <template v-if="!selectingMonth">
            <mu-button
              :caption="lang.Calendar.THIS_MONTH"
              primary button-style="text"
              @click="setCurrent(today)" />
            <mu-tool-button icon="chevronUp" @click="prevMonth" />
            <mu-tool-button icon="chevronDown" @click="nextMonth" />
          </template>
        </div>
        <month-picker
          v-if="selectingMonth"
          v-model="current"
          value-type="Object"
          @month-cell-click="onMonthCellClick" />
        <calendar-grid
          v-else
          :year="year"
          :month="month"
          :selected="selected"
          @cell-click="onDateCellClick" />
      </div>
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './date-input.scss'

  import { ref, computed } from 'vue'
  import { toString, monthEquals } from '@/utils/date'
  import { calendarProps, useCalendar } from '../calendar/calendar'

  import lang from '@/langs'
  import ComboWrapper from './combo-wrapper.vue'
  import MonthPicker from '../calendar/month-picker.vue'
  import CalendarGrid from '../calendar/calendar-grid.vue'

  defineOptions({ name: 'MusselDateInput' })

  const model = defineModel({
    type: [Date, String, Object, Array]
  })

  const props = defineProps({
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
    caption,
    selected,
    prevMonth,
    nextMonth,
    setCurrent,
    updateModelValue,
    onDateCellClick: _onDateCellClick
  } = useCalendar(model, props)

  const wrapper = ref()
  const selectingMonth = ref()

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
    wrapper.value.hideDropdown()
  }

  function onMonthCellClick () {
    if (props.type === 'month') {
      if (!monthEquals(current.value, selected.value)) {
        updateModelValue(current.value)
      }

      wrapper.value.hideDropdown()
    } else {
      selectingMonth.value = false
    }
  }
</script>
