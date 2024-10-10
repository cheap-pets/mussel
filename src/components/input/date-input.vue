<template>
  <input-wrapper
    ref="wrapper"
    v-model="value"
    class="mu-date-input"
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
              @click="updateCurrent(today)" />
            <mu-tool-button icon="chevronUp" @click="prevMonth" />
            <mu-tool-button icon="chevronDown" @click="nextMonth" />
          </template>
        </div>
        <month-picker
          v-if="selectingMonth"
          v-model="current"
          @update:model-value="selectingMonth = false" />
        <calendar-grid
          v-else
          :year="year"
          :month="month"
          :selected="selected"
          @cell-click="onDateCellClick" />
      </div>
    </template>
  </input-wrapper>
</template>

<script setup>
  import './date-input.scss'

  import { ref, computed } from 'vue'
  import { toString } from '@/utils/date'
  import { calendarProps, useCalendar } from '../picker/calendar'

  import lang from '@/langs'
  import InputWrapper from './dropdown-input-wrapper.vue'
  import CalendarGrid from '../picker/calendar-grid.vue'
  import MonthPicker from '../picker/month-picker.vue'

  defineOptions({ name: 'MusselDateInput' })

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
    selectingMonth.value = false
  }

  function onDateCellClick (cell) {
    updateDate(cell)
    wrapper.value.hideDropdown()
  }
</script>
