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
      <quarter-picker
        v-else-if="view === 'quarter'"
        ref="quarterPanel"
        v-model="quarterProxy"
        @quarter-cell-click="selectQuarter" />
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

  import { t as $t } from '@/langs'
  import { useFieldModel } from '../form/validation'
  import { DEFAULT_FORMAT, dateProps, useDate } from '../calendar/date-hook'
  import { toDateString, toQuarterObject, toQuarterString, monthEquals, quarterEquals } from '@/utils/date'

  import ComboWrapper from './combo-wrapper.vue'
  import YearPicker from '../calendar/year-picker.vue'
  import QuarterPicker from '../calendar/quarter-picker.vue'
  import MonthPicker from '../calendar/month-picker.vue'
  import DatePicker from '../calendar/date-picker.vue'

  defineOptions({ name: 'MusselDateInput' })

  const props = defineProps({
    ...dateProps,
    format: { type: String, default: null },
    type: {
      type: String,
      default: 'date',
      validator: v => ['date', 'month', 'quarter', 'year'].includes(v)
    },
    dropdownClass: null
  })

  const displayFormat = computed(() =>
    props.format || DEFAULT_FORMAT[props.type]
  )

  const rawModel = defineModel({ type: [Date, String] })
  const model = useFieldModel(rawModel).modelProxy

  const {
    today,
    selected,
    monthProxy,
    quarterProxy,
    modelProxy,
    displayYear,
    displayMonth,
    displayQuarter,
    goPrevMonth,
    goNextMonth,
    setDisplayMonth,
    setDisplayQuarter,
    updateModelValue
  } = useDate(model, props)

  const wrapper = shallowRef()
  const yearPanel = shallowRef()
  const monthPanel = shallowRef()
  const quarterPanel = shallowRef()
  const view = ref()

  const comboValue = computed({
    get: () => props.type === 'quarter'
      ? formatQuarter(model.value)
      : toDateString(model.value, displayFormat.value),
    set: v => updateModelValue(v)
  })

  const startYear = computed(() => {
    switch (view.value) {
      case 'year':
        return yearPanel.value?.startYear
      case 'month':
        return monthPanel.value?.startYear
      case 'quarter':
        return quarterPanel.value?.startYear
      default:
        return null
    }
  })

  const caption = computed(() =>
    view.value === 'date'
      ? $t('Datetime.YEAR_AND_MONTH', displayYear.value, $t('Datetime.MONTHS_SHORT')[displayMonth.value])
      : `${startYear.value} ~ ${startYear.value + 9}`)

  const presentCaption = computed(() => $t(
    view.value === 'date'
      ? 'Datetime.TODAY'
      : view.value === 'month'
        ? 'Datetime.THIS_MONTH'
        : view.value === 'quarter'
          ? 'Datetime.THIS_QUARTER'
          : 'Datetime.THIS_YEAR'
  ))

  function toggleMonthView () {
    view.value = view.value === 'date' ? 'month' : 'date'
  }

  function formatQuarter (value) {
    const obj = toQuarterObject(value)

    return obj && toQuarterString(obj.year, obj.quarter, displayFormat.value)
  }

  function goPresent () {
    const { year: y, month: m } = today

    switch (view.value) {
      case 'date':
        updateModelValue(new Date(y, m, today.date))
        setDisplayMonth({ year: y, month: m })
        wrapper.value.collapse()
        break
      case 'month':
        setDisplayMonth({ year: y, month: m })
        selectMonth()
        break
      case 'quarter':
        setDisplayQuarter({ year: y, quarter: Math.floor(m / 3) })
        selectQuarter()
        break
      case 'year':
        updateModelValue(new Date(y, 0, 1))
        wrapper.value.collapse()
        break
    }
  }

  function selectMonth () {
    if (props.type === 'month') {
      const year = displayYear.value
      const month = displayMonth.value

      if (!monthEquals({ year, month }, selected.value)) {
        updateModelValue(new Date(year, month))
      }

      wrapper.value.collapse()
    } else {
      view.value = props.type
    }
  }

  function selectQuarter () {
    const year = displayYear.value
    const quarter = displayQuarter.value

    if (!quarterEquals({ year, quarter }, selected.value)) {
      updateModelValue(new Date(year, quarter * 3))
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

  .mu-date-dropdown > .mu-year-picker,
  .mu-date-dropdown > .mu-month-picker,
  .mu-date-dropdown > .mu-quarter-picker,
  .mu-date-dropdown > .mu-date-picker {
    flex: 1 1 0;
  }
</style>
