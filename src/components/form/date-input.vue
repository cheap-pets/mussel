<template>
  <combo-wrapper
    ref="wrapper"
    v-model="comboValue"
    class="mu-date-input"
    dropdown-icon="calendar"
    :dropdown-class="['mu-date-dropdown', dropdownClass]"
    @dropdown:show="view = type">
    <template #dropdown>
      <mu-toolbar class="bg-strong p-half">
        <div v-if="type !== 'date'" class="px-1x">
          {{ caption }}
        </div>
        <mu-button v-else :active="view !== 'date'" @click="toggleMonthView">
          {{ caption }}
          <mu-icon icon="dropdownExpand" :expanded="view !== 'date' || null" />
        </mu-button>
        <mu-button class="ml-auto" :caption="presentCaption" @click="goPresent" />
        <template v-if="view === 'date'">
          <mu-icon-button icon="chevronUp" @click="goPrevMonth" />
          <mu-icon-button icon="chevronDown" @click="goNextMonth" />
        </template>
      </mu-toolbar>
      <year-picker
        v-if="view === 'year'"
        ref="yearPanel"
        v-model="modelProxy"
        @year-cell-click="wrapper.collapse()" />
      <month-picker
        v-else-if="view === 'month'"
        ref="monthPanel"
        v-model="monthProxy"
        @month-cell-click="selectMonth" />
      <date-picker
        v-else
        v-model="modelProxy"
        :year="displayYear"
        :month="displayMonth"
        @date-cell-click="wrapper.collapse()" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import { ref, shallowRef, computed } from 'vue'

  import { toDateString, monthEquals } from '@/utils/date'
  import { t as $t } from '@/langs'

  import { useFieldModel } from '../form/validation'
  import { calendarProps, useCalendar } from '../calendar/calendar'

  import ComboWrapper from './combo-wrapper.vue'
  import YearPicker from '../calendar/year-picker.vue'
  import MonthPicker from '../calendar/month-picker.vue'
  import DatePicker from '../calendar/date-picker.vue'

  defineOptions({ name: 'MusselDateInput' })

  const props = defineProps({
    ...calendarProps,
    type: {
      type: String,
      default: 'date',
      validator: v => ['date', 'month', 'year'].includes(v)
    },
    dropdownClass: null
  })

  const rawModel = defineModel({ type: [Date, String] })
  const model = useFieldModel(rawModel).modelProxy

  const {
    today,
    selected,
    monthProxy,
    modelProxy,
    displayYear,
    displayMonth,
    goPrevMonth,
    goNextMonth,
    setDisplayMonth,
    updateModelValue
  } = useCalendar(model, props)

  const wrapper = shallowRef()
  const yearPanel = shallowRef()
  const monthPanel = shallowRef()
  const view = ref()

  const comboValue = computed({
    get: () => toDateString(model.value, props.format),
    set: v => updateModelValue(v)
  })

  const startYear = computed(() =>
    view.value === 'year'
      ? yearPanel.value?.startYear
      : monthPanel.value?.startYear
  )

  const caption = computed(() =>
    view.value === 'date'
      ? $t('Datetime.YEAR_AND_MONTH', displayYear.value, $t('Datetime.MONTHS_SHORT')[displayMonth.value])
      : `${startYear.value} ~ ${startYear.value + 9}`)

  const presentCaption = computed(() => $t(
    view.value === 'date'
      ? 'Datetime.TODAY'
      : view.value === 'month'
        ? 'Datetime.THIS_MONTH'
        : 'Datetime.THIS_YEAR'
  ))

  function toggleMonthView () {
    view.value = view.value === 'date' ? 'month' : 'date'
  }

  function goPresent () {
    const { year: y, month: m } = today

    switch (view.value) {
      case 'date':
        updateModelValue(today)
        setDisplayMonth({ year: y, month: m })
        wrapper.value.collapse()
        break
      case 'month':
        setDisplayMonth({ year: y, month: m })
        selectMonth()
        break
      case 'year':
        updateModelValue({ year: y, month: 0, date: 1 })
        wrapper.value.collapse()
        break
    }
  }

  function selectMonth () {
    if (props.type === 'month') {
      if (!monthEquals(monthProxy.value, selected.value)) {
        updateModelValue(monthProxy.value)
      }

      wrapper.value.collapse()
    } else {
      view.value = props.type
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

  .mu-date-dropdown > .mu-year-picker,
  .mu-date-dropdown > .mu-month-picker,
  .mu-date-dropdown > .mu-date-picker {
    flex: 1 1 0;
  }
</style>
