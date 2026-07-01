<template>
  <div class="mu-year-picker mu-date-grid">
    <div class="mu-date-cell" @click="setStartYear(startYear - 10)">
      <mu-icon icon="chevronLeft" />
    </div>
    <div
      v-for="y in years"
      :key="y"
      :present="y === currentYear || null"
      :selected="y === selected || null"
      class="mu-date-cell"
      @click="onYearCellClick(y)">
      {{ y }}
    </div>
    <div class="mu-date-cell" @click="setStartYear(startYear + 10)">
      <mu-icon icon="chevronRight" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watchEffect } from 'vue'
  import { toDateObject, toDateString } from '../../utils/date'
  import { outputTypeProp } from './props'

  defineOptions({ name: 'MusselYearPicker' })

  const emit = defineEmits(['yearCellClick'])
  const model = defineModel({ type: [Date, String] })

  const props = defineProps({
    format: { type: String, default: 'yyyy' },
    outputType: outputTypeProp
  })

  const currentYear = (new Date()).getFullYear()
  const startYear = ref(parseInt(currentYear / 10) * 10)

  const selected = computed(() => toDateObject(model.value)?.year)
  const years = computed(() => Array.from({ length: 10 }, (_, idx) => startYear.value + idx))

  function setStartYear (year) {
    if (year >= 0) {
      startYear.value = parseInt(year / 10) * 10
    }
  }

  function onYearCellClick (year) {
    if (year !== selected.value) {
      model.value =
        props.outputType === 'date'
          ? new Date(year, 0)
          : toDateString({ year, month: 0 }, props.format)
    }

    emit('yearCellClick', year)
  }

  watchEffect(() => setStartYear(selected.value || currentYear))

  defineExpose({ startYear })
</script>

<style>
  .mu-year-picker {
    grid-template-columns: repeat(4, 1fr);
  }
</style>
