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
          <mu-icon-button icon="chevronUp" @click="goPrevMonth" />
          <mu-icon-button icon="chevronDown" @click="goNextMonth" />
        </template>
      </mu-toolbar>
      <year-picker
        v-if="currentView === 'year'"
        ref="yearSelector"
        v-model="currentProxy"
        class="flex-1"
        @year-cell-click="selectYear" />
      <month-picker
        v-else-if="currentView === 'month'"
        ref="monthSelector"
        v-model="currentProxy"
        class="flex-1"
        @month-cell-click="selectMonth" />
      <date-picker
        v-else
        v-model="model"
        class="flex-1"
        :year="year"
        :month="month"
        @date-cell-click="wrapper.collapse()" />
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
    type: { type: String, default: 'date', validator: v => ['date', 'month', 'year'].includes(v) },
    modelValue: { type: [Date, String] },
    dropdownClass: null,
    ...calendarProps
  })

  const emit = defineEmits(['update:modelValue'])

  const { model } = useFieldModel(props, 'modelValue', emit)

  const {
    year,
    month,
    today,
    current,
    currentProxy,
    selected,
    setCurrent,
    goPrevMonth,
    goNextMonth,
    updateModelValue
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

  const currentButtonCaption = computed(() => $t(
    currentView.value === 'date'
      ? 'Calendar.TODAY'
      : currentView.value === 'month'
        ? 'Calendar.THIS_MONTH'
        : 'Calendar.THIS_YEAR'
  ))

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
    const { year: y, month: m } = today

    switch (currentView.value) {
      case 'date':
        updateModelValue(today)
        setCurrent({ year: y, month: m, date: 1 })
        wrapper.value.collapse()
        break
      case 'month':
        setCurrent({ year: y, month: m, date: 1 })
        selectMonth()
        break
      case 'year':
        setCurrent({ year: y, month: 0, date: 1 })
        selectYear()
        break
    }
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
    if (!yearEquals(current.value, selected.value)) {
      updateModelValue(current.value)
    }

    wrapper.value.collapse()
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
