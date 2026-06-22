<template>
  <combo-wrapper
    ref="wrapper"
    v-model="value"
    class="mu-date-input"
    dropdown-icon="calendar"
    :dropdown-class="[dropdownClass, 'mu-calendar']"
    @dropdown:show="currentView = type">
    <template #dropdown>
      <mu-toolbar>
        <div v-if="type !== 'date'" class="mu-caption">
          {{ caption }}
        </div>
        <mu-button
          v-else
          class="mu-caption"
          button-style="text"
          :active="currentView !== 'date'"
          @click="toggleMonthMode">
          {{ caption }}
          <mu-icon icon="dropdownExpand" :expanded="currentView !== 'date' || null" />
        </mu-button>
        <mu-button
          button-style="text"
          :caption="currentButtonCaption"
          @click="onCurrentButtonClick()" />
        <template v-if="isDateMode">
          <mu-icon-button icon="chevronUp" @click="prevMonth" />
          <mu-icon-button icon="chevronDown" @click="nextMonth" />
        </template>
      </mu-toolbar>
      <month-picker
        v-if="currentView === 'month'"
        ref="monthSelector"
        v-model="current"
        value-type="Object"
        @month-cell-click="selectMonth" />
      <year-picker
        v-else-if="currentView === 'year'"
        ref="yearSelector"
        v-model="current"
        value-type="Object"
        @year-cell-click="selectYear" />
      <calendar-grid
        v-else
        :year="year"
        :month="month"
        :selected="selected"
        @cell-click="selectDate" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import './date-input.scss'

  import { ref, computed } from 'vue'

  import { toString, monthEquals, yearEquals } from '@/utils/date'
  import { t as $t } from '@/langs'

  import { calendarProps, useCalendar } from '../calendar/calendar'
  import { useFieldModel } from '../form/validation'

  import ComboWrapper from './combo-wrapper.vue'
  import CalendarGrid from '../calendar/date-table.vue'
  import MonthPicker from '../calendar/month-picker.vue'
  import YearPicker from '../calendar/year-picker.vue'

  defineOptions({ name: 'MusselDateInput' })

  const props = defineProps({
    dropdownClass: null,
    type: {
      type: String,
      default: 'date',
      validator: v => ['date', 'month', 'year'].includes(v)
    },
    modelValue: { type: [Date, String, Object, Array] },
    ...calendarProps
  })

  const emit = defineEmits(['update:modelValue'])

  const { model } = useFieldModel(props, 'modelValue', emit)

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
    onDateCellClick
  } = useCalendar(model, props)

  const wrapper = ref()
  const monthSelector = ref()
  const yearSelector = ref()
  const currentView = ref()

  const isDateMode = computed(() => currentView.value === 'date')
  const firstYear = computed(() =>
    currentView.value === 'year'
      ? yearSelector.value?.firstYear
      : monthSelector.value?.firstYear
  )

  const caption = computed(() =>
    currentView.value === 'date'
      ? $t('Calendar.YEAR_AND_MONTH', year.value, $t('Calendar.MONTHS')[month.value])
      : `${firstYear.value} ~ ${firstYear.value + 9}`
  )

  const currentButtonCaption = computed(() =>
    $t(currentView.value === 'date' ? 'Calendar.THIS_MONTH' : 'Calendar.THIS_YEAR')
  )

  const value = computed({
    get () {
      return toString(model.value, props.format)
    },
    set (v) {
      model.value = v
    }
  })

  function toggleMonthMode () {
    currentView.value = currentView.value === 'date' ? 'month' : 'date'
  }

  function onCurrentButtonClick () {
    if (currentView.value === 'date') {
      setCurrent(today.value)
    } else if (currentView.value === 'month') {
      monthSelector.value.setYear(today.value.year)
    } else if (currentView.value === 'year') {
      yearSelector.value.setYear(today.value.year)
    }
  }

  function selectDate (cell) {
    onDateCellClick(cell)
    wrapper.value.collapse()
  }

  function selectMonth () {
    if (props.type === 'month') {
      if (!monthEquals(current.value, selected.value)) {
        updateModelValue(current.value)
      }

      wrapper.value.collapse()
    } else {
      currentView.value = props.type
    }
  }

  function selectYear () {
    if (props.type === 'year') {
      if (!yearEquals(current.value, selected.value)) {
        updateModelValue(current.value)
      }

      wrapper.value.collapse()
    }
  }
</script>
