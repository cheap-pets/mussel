<template>
  <div class="mu-month-picker gap-half">
    <div class="mu-date-grid flex-1">
      <div class="mu-date-cell" @click="setStartYear(startYear - 10)">
        <mu-icon icon="chevronLeft" />
      </div>
      <div
        v-for="y in years" :key="y"
        :present="y === current.year || null"
        :selected="y === chosenYear || null"
        class="mu-date-cell"
        @click="onYearCellClick(y)">
        {{ y }}
      </div>
      <div class="mu-date-cell" @click="setStartYear(startYear + 10)">
        <mu-icon icon="chevronRight" />
      </div>
    </div>
    <div class="flex-divider flex-divider--pill" />
    <div class="mu-date-grid flex-1">
      <div
        v-for="(label, m) in months" :key="m"
        :muted="!isActiveDecade || null"
        :present="m === currentMonth || null"
        :selected="m === selectedMonth || null"
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
  import { outputTypeProp } from './props'

  defineOptions({ name: 'MusselMonthPicker' })

  const emit = defineEmits(['monthCellClick'])
  const model = defineModel({ type: [Date, String] })

  const props = defineProps({
    format: { type: String, default: 'yyyy-MM' },
    outputType: outputTypeProp
  })

  const current = pick(toDateObject(new Date()), ['year', 'month'])
  const selected = computed(() => pick(toDateObject(model.value), ['year', 'month']))

  const startYear = ref(parseInt(current.year / 10) * 10)
  const chosenYear = ref()

  const years = computed(() => Array.from({ length: 10 }, (_, idx) => startYear.value + idx))
  const months = $t('Datetime.MONTHS_SHORT')

  const isActiveDecade = computed(() => {
    const start = startYear.value
    const year = chosenYear.value

    return year && start <= year && start + 10 > year
  })

  const currentMonth = computed(() =>
    isActiveDecade.value && chosenYear.value === current.year && current.month
  )

  const selectedMonth = computed(() =>
    isActiveDecade.value && chosenYear.value === selected.value?.year && selected.value?.month
  )

  function setStartYear (year) {
    startYear.value = parseInt(year / 10) * 10
  }

  function onYearCellClick (year) {
    chosenYear.value = year
  }

  function onMonthCellClick (month) {
    if (!isActiveDecade.value) return

    const year = chosenYear.value
    const value = { year, month }

    if (!monthEquals(value, selected.value)) {
      model.value = props.outputType
        ? new Date(year, month)
        : toDateString(value, props.format)
    }

    emit('monthCellClick', year, month)
  }

  watchEffect(() => {
    chosenYear.value = toDateObject(model.value)?.year
  })

  watchEffect(() => {
    setStartYear(chosenYear.value || current.year)
  })

  defineExpose({ startYear })
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
