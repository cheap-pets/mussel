<template>
  <div class="mu-quarter-picker gap-half">
    <div class="mu-date-grid flex-3">
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
    <div class="flex-divider flex-divider--stroke-1" />
    <div class="mu-date-grid flex-1">
      <div
        v-for="(label, q) in quarters" :key="q"
        :muted="!isActiveDecade || null"
        :present="q === currentQuarter || null"
        :selected="q === selectedQuarter || null"
        class="mu-date-cell"
        @click="onQuarterCellClick(q)">
        {{ label }}
      </div>
    </div>
  </div>
</template>

<script setup>
  // 季度选择器：model 仅接受 Date 对象（null 表示未选）。
  // 当外层 model 为 String 时，由 useDate 负责序列化/反序列化。
  import { computed } from 'vue'

  import { t as $t } from '@/langs'
  import { toQuarterObject, quarterEquals } from '@/utils/date'
  import { useDecadePicker } from './use-decade-picker'

  defineOptions({ name: 'MusselQuarterPicker' })

  const emit = defineEmits(['quarterCellClick'])
  const model = defineModel({ type: Date, default: null })

  const quarters = $t('Datetime.QUARTERS_SHORT')

  const today = new Date()
  const current = { year: today.getFullYear(), quarter: Math.floor(today.getMonth() / 3) }
  const selected = computed(() => toQuarterObject(model.value))

  const {
    startYear,
    chosenYear,
    years,
    isActiveDecade,
    setStartYear,
    onYearCellClick
  } = useDecadePicker(model, toQuarterObject, current.year)

  const currentQuarter = computed(() =>
    isActiveDecade.value && chosenYear.value === current.year && current.quarter
  )

  const selectedQuarter = computed(() =>
    isActiveDecade.value && chosenYear.value === selected.value?.year && selected.value?.quarter
  )

  function onQuarterCellClick (quarter) {
    if (!isActiveDecade.value) return

    const year = chosenYear.value

    if (!quarterEquals({ year, quarter }, selected.value)) {
      model.value = new Date(year, quarter * 3)
    }

    emit('quarterCellClick', year, quarter)
  }

  defineExpose({ startYear })
</script>

<style>
  .mu-quarter-picker {
    display: flex;
    flex-direction: column;

    & > .mu-date-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    & > .mu-date-grid:last-child {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
