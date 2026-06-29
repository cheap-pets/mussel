<template>
  <div class="mu-year-picker mu-date-grid">
    <div class="mu-date-cell" @click="setFirstYear(firstYear - 10)">
      <mu-icon icon="chevronLeft" />
    </div>
    <div
      v-for="y in years"
      :key="y"
      :present="y === thisYear || null"
      :selected="y === chosenYear || null"
      class="mu-date-cell"
      @click="onYearCellClick(y)">
      {{ y }}
    </div>
    <div class="mu-date-cell" @click="setFirstYear(firstYear + 10)">
      <mu-icon icon="chevronRight" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watchEffect } from 'vue'
  import { toDateObject, toDateString } from '../../utils/date'

  defineOptions({ name: 'MusselYearPicker' })

  const model = defineModel({ type: [Date, String] })

  const props = defineProps({
    format: { type: String, default: 'yyyy' },
    outputType: { type: String, default: 'date', validator: v => ['date', 'string'].includes(v) }
  })

  const emit = defineEmits([
    'yearCellClick'
  ])

  const firstYear = ref()
  const chosenYear = ref()

  const thisYear = computed(() => new Date().getFullYear())
  const selected = computed(() => toDateObject(model.value)?.year)
  const years = computed(() => Array.from({ length: 10 }, (_, idx) => firstYear.value + idx))

  function setFirstYear (year) {
    firstYear.value = parseInt(year / 10) * 10
  }

  function setYear (year) {
    setFirstYear(year)
    chosenYear.value = year
  }

  function onYearCellClick (year) {
    chosenYear.value = year

    if (year !== selected.value) {
      model.value = props.outputType === 'date'
        ? new Date(year, 0)
        : toDateString({ year, month: 0 }, props.format)
    }

    emit('yearCellClick', year)
  }

  watchEffect(() => {
    chosenYear.value = toDateObject(model.value)?.year
  })

  watchEffect(() => {
    setFirstYear(chosenYear.value || thisYear.value)
  })

  defineExpose({
    firstYear,
    setYear
  })
</script>

<style>
  .mu-year-picker {
    grid-template-columns: repeat(4, 1fr);
  }
</style>
