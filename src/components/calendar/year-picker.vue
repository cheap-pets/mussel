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
  import { toDateObject } from '@/utils/date'

  defineOptions({ name: 'MusselYearPicker' })

  const emit = defineEmits(['yearCellClick'])
  const model = defineModel({ type: Date, default: null })

  const currentYear = (new Date()).getFullYear()
  const startYear = ref(Math.floor(currentYear / 10) * 10)

  const selected = computed(() => toDateObject(model.value)?.year)
  const years = computed(() => Array.from({ length: 10 }, (_, idx) => startYear.value + idx))

  function setStartYear (year) {
    if (year >= 0) {
      startYear.value = Math.floor(year / 10) * 10
    }
  }

  function onYearCellClick (year) {
    if (year !== selected.value) {
      model.value = new Date(year, 0)
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
