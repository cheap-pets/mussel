<template>
  <div class="mu-month-picker">
    <table class="mu-calendar-grid" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td @click="setFirstYear(firstYear - 10)">
            <mu-icon icon="chevronLeft" />
          </td>
          <td
            v-for="i in 5" :key="i"
            v-bind="getYearCellAttrs(firstYear + i - 1)"
            @click="selectYear(firstYear + i - 1)" />
        </tr>
        <tr>
          <td
            v-for="i in 5" :key="i"
            v-bind="getYearCellAttrs(firstYear + i + 4)"
            @click="selectYear(firstYear + i + 4)" />
          <td @click="setFirstYear(firstYear + 10)">
            <mu-icon icon="chevronRight" />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mu-divider" thin />
    <table class="mu-calendar-grid" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td
            v-for="i in 6" :key="i"
            v-bind="getMonthCellAttrs(i - 1)"
            @click="selectMonth(i - 1)" />
        </tr>
        <tr>
          <td
            v-for="i in 6" :key="i"
            v-bind="getMonthCellAttrs(i + 5)"
            @click="selectMonth(i + 5)" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
  import './month-picker.scss'

  import { ref, computed, watchEffect } from 'vue'
  import { toObject } from '../../utils/date'

  import lang from '@/langs'

  const { MONTHS_SHORT } = lang.Calendar

  defineOptions({ name: 'MusselMonthPicker' })

  const model = defineModel({ type: Object })

  const currentYear = ref()
  const firstYear = ref()

  const today = computed(() => toObject(new Date()))

  const isCurrentDecade = computed(() => {
    const first = firstYear.value
    const year = currentYear.value

    return year && first <= year && first + 10 > year
  })

  function getYearCellAttrs (year) {
    return {
      'data-year': year,
      present: (year === today.value.year) || null,
      selected: (year === currentYear.value) || null
    }
  }

  function getMonthCellAttrs (month) {
    return {
      'data-month': MONTHS_SHORT[month],
      present: (
        isCurrentDecade.value &&
        currentYear.value === today.value.year &&
        month === today.value.month
      ) || null,
      selected: (
        isCurrentDecade.value &&
        currentYear.value === model.value?.year &&
        month === model.value?.month
      ) || null,
      muted: !isCurrentDecade.value || null
    }
  }

  function setFirstYear (value) {
    firstYear.value = value
  }

  function selectYear (value) {
    currentYear.value = value
  }

  function selectMonth (value) {
    if (isCurrentDecade.value) {
      model.value = { year: currentYear.value, month: value }
    }
  }

  watchEffect(() => {
    currentYear.value = model.value?.year
  })

  watchEffect(() => {
    firstYear.value =
      parseInt((currentYear.value || today.value.year) / 10) * 10
  })

</script>
