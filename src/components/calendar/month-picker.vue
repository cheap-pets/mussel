<template>
  <div class="mu-month-picker gap-half">
    <div class="mu-date-grid flex-1">
      <div class="mu-date-cell" @click="setFirstYear(firstYear - 10)">
        <mu-icon icon="chevronLeft" />
      </div>
      <div
        v-for="y in years" :key="y"
        :present="y === thisMonth.year || null"
        :selected="y === chosenYear || null"
        class="mu-date-cell"
        @click="onYearCellClick(y)">
        {{ y }}
      </div>
      <div class="mu-date-cell" @click="setFirstYear(firstYear + 10)">
        <mu-icon icon="chevronRight" />
      </div>
    </div>
    <div class="flex-divider flex-divider--pill" />
    <div class="mu-date-grid flex-1">
      <div
        v-for="(label, m) in months" :key="m"
        :muted="!isCurrentDecade || null"
        :present="isCurrentDecade && monthEquals({ year: chosenYear, month: m }, thisMonth) || null"
        :selected="isCurrentDecade && monthEquals({ year: chosenYear, month: m }, selected) || null"
        class="mu-date-cell"
        @click="onMonthCellClick(m)">
        {{ label }}
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watchEffect } from 'vue'

  import { monthEquals, toDateObject, toDateString } from '@/utils/date'
  import { pick } from '@/utils/object'
  import { t as $t } from '@/langs'
  import { outputTypeProp } from './calendar'

  defineOptions({ name: 'MusselMonthPicker' })

  const model = defineModel({ type: [Date, String] })

  const props = defineProps({
    outputType: outputTypeProp,
    format: { type: String, default: 'yyyy-MM' }
  })

  const emit = defineEmits([
    'yearCellClick',
    'monthCellClick'
  ])

  const firstYear = ref()
  const chosenYear = ref()

  const selected = computed(() => pick(toDateObject(model.value), ['year', 'month']))
  const thisMonth = computed(() => pick(toDateObject(new Date()), ['year', 'month']))

  const isCurrentDecade = computed(() => {
    const first = firstYear.value
    const year = chosenYear.value

    return year && first <= year && first + 10 > year
  })

  const years = computed(() => Array.from({ length: 10 }, (_, idx) => firstYear.value + idx))
  const months = $t('Calendar.MONTHS_SHORT')

  function setFirstYear (year) {
    firstYear.value = parseInt(year / 10) * 10
  }

  function setYear (year) {
    setFirstYear(year)
    chosenYear.value = year
  }

  function onYearCellClick (year) {
    chosenYear.value = year
    emit('yearCellClick', year)
  }

  function onMonthCellClick (month) {
    if (!isCurrentDecade.value) return

    const year = chosenYear.value
    const value = { year, month }

    if (!monthEquals(value, selected.value)) {
      const vType = props.outputType.toLowerCase()

      model.value = vType === 'date'
        ? new Date(year, month)
        : toDateString(value, props.format)
    }

    emit('monthCellClick', year, month)
  }

  watchEffect(() => {
    chosenYear.value = toDateObject(model.value)?.year
  })

  watchEffect(() => {
    setFirstYear(chosenYear.value || thisMonth.value.year)
  })

  defineExpose({
    firstYear,
    setYear
  })
</script>

<style>
  .mu-month-picker {
    display: flex;
    flex-direction: column;

    & > .mu-date-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }
</style>
