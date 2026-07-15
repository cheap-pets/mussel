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
  import { computed } from 'vue'

  import { monthEquals, toDateObject } from '@/utils/date'
  import { t as $t } from '@/langs'
  import { useDecadePicker } from './use-decade-picker'

  defineOptions({ name: 'MusselMonthPicker' })

  const emit = defineEmits(['monthCellClick'])
  const model = defineModel({ type: Date, default: null })

  const today = new Date()
  const current = { year: today.getFullYear(), month: today.getMonth() }
  const selected = computed(() => toDateObject(model.value))
  const months = $t('Datetime.MONTHS_SHORT')

  const {
    startYear,
    chosenYear,
    years,
    isActiveDecade,
    setStartYear,
    onYearCellClick
  } = useDecadePicker(model, toDateObject, current.year)

  const currentMonth = computed(() =>
    isActiveDecade.value && chosenYear.value === current.year && current.month
  )

  const selectedMonth = computed(() =>
    isActiveDecade.value && chosenYear.value === selected.value?.year && selected.value?.month
  )

  function onMonthCellClick (month) {
    if (!isActiveDecade.value) return

    const year = chosenYear.value

    if (!monthEquals({ year, month }, selected.value)) {
      model.value = new Date(year, month)
    }

    emit('monthCellClick', year, month)
  }

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
