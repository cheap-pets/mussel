<template>
  <combo-wrapper
    ref="wrapper"
    v-model="value"
    class="mu-date-input"
    dropdown-icon="calendar"
    :dropdown-class="['mu-date-dropdown', dropdownClass]"
    @dropdown:show="currentView = type">
    <template #dropdown>
      <mu-toolbar class="bg-strong p-half">
        <div v-if="type !== 'date'" class="px-1x">
          {{ caption }}
        </div>
        <mu-button v-else :active="currentView !== 'date'" @click="toggleMonthMode">
          {{ caption }}
          <mu-icon icon="dropdownExpand" :expanded="currentView !== 'date' || null" />
        </mu-button>
        <mu-button
          class="ml-auto"
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
        class="flex-1"
        output-type="Object"
        @month-cell-click="selectMonth" />
      <year-picker
        v-else-if="currentView === 'year'"
        ref="yearSelector"
        v-model="current"
        class="flex-1"
        output-type="Object"
        @year-cell-click="selectYear" />
      <date-picker
        v-else
        class="flex-1"
        :year="year"
        :month="month"
        :selected="selected"
        @cell-click="selectDate" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import { toDateString, monthEquals, yearEquals } from '@/utils/date'
  import { t as $t } from '@/langs'

  import { useFieldModel } from '../form/validation'
  import { calendarProps, useCalendar } from '../calendar/calendar'

  import ComboWrapper from './combo-wrapper.vue'
  import YearPicker from '../calendar/year-picker.vue'
  import MonthPicker from '../calendar/month-picker.vue'
  import DatePicker from '../calendar/date-picker.vue'

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
      ? $t('Calendar.YEAR_AND_MONTH', year.value, $t('Calendar.MONTHS_SHORT')[month.value])
      : `${firstYear.value} ~ ${firstYear.value + 9}`
  )

  const currentButtonCaption = computed(() =>
    $t(currentView.value === 'date' ? 'Calendar.THIS_MONTH' : 'Calendar.THIS_YEAR')
  )

  const value = computed({
    get () {
      return toDateString(model.value, props.format)
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

<style>
  .mu-date-dropdown {
    display: flex;
    flex-direction: column;
    gap: var(--mu-half-spacing);

    min-width: 300px;
    max-width: 400px;
    height: 250px;

    & > .mu-bar {
      border-radius: var(--mu-common-border-radius);
    }
  }
</style>
