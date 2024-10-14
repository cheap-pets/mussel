<template>
  <div class="mu-month-picker">
    <table class="mu-month-picker_year-table mu-calendar-grid" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td @click="setFirstYear(firstYear - 10)">
            <mu-icon icon="chevronLeft" />
          </td>
          <td
            v-for="i in 5" :key="i"
            v-bind="getYearCellAttrs(firstYear + i - 1)"
            @click="onYearCellClick(firstYear + i - 1)" />
        </tr>
        <tr>
          <td
            v-for="i in 5" :key="i"
            v-bind="getYearCellAttrs(firstYear + i + 4)"
            @click="onYearCellClick(firstYear + i + 4)" />
          <td @click="setFirstYear(firstYear + 10)">
            <mu-icon icon="chevronRight" />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mu-divider" thin />
    <table class="mu-month-picker_month-table mu-calendar-grid" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td
            v-for="i in 6" :key="i"
            v-bind="getMonthCellAttrs(i - 1)"
            @click="onMonthCellClick(i - 1)" />
        </tr>
        <tr>
          <td
            v-for="i in 6" :key="i"
            v-bind="getMonthCellAttrs(i + 5)"
            @click="onMonthCellClick(i + 5)" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
  import './month-picker.scss'

  import { ref, computed, watchEffect } from 'vue'
  import { pick } from '@/utils/object'
  import { monthEquals, toObject, toString } from '../../utils/date'
  import { valueTypeProp } from './calendar'

  import lang from '@/langs'

  const { MONTHS_SHORT } = lang.Calendar

  defineOptions({ name: 'MusselMonthPicker' })

  const model = defineModel({ type: Object })

  const props = defineProps({
    valueType: valueTypeProp,
    format: { type: String, default: 'yyyy-MM' }
  })

  const emit = defineEmits([
    'yearCellClick',
    'monthCellClick'
  ])

  const firstYear = ref()
  const chosenYear = ref()

  const selected = computed(() => pick(toObject(model.value), ['year', 'month']))
  const thisMonth = computed(() => pick(toObject(new Date()), ['year', 'month']))

  const isCurrentDecade = computed(() => {
    const first = firstYear.value
    const year = chosenYear.value

    return year && first <= year && first + 10 > year
  })

  function getYearCellAttrs (year) {
    return {
      'data-year': year,
      present: (year === thisMonth.value.year) || null,
      selected: (year === chosenYear.value) || null
    }
  }

  function getMonthCellAttrs (month) {
    const year = chosenYear.value

    return {
      'data-month': MONTHS_SHORT[month],
      ...(
        isCurrentDecade.value
          ? {
            present: monthEquals({ year, month }, thisMonth.value) || null,
            selected: monthEquals({ year, month }, selected.value) || null
          }
          : { muted: '' }
      )
    }
  }

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
      const vType = props.valueType.toLowerCase()

      model.value = vType === 'object'
        ? value
        : vType === 'date'
          ? new Date(year, month)
          : toString(value, props.format)
    }

    emit('monthCellClick', year, month)
  }

  watchEffect(() => {
    chosenYear.value = toObject(model.value)?.year
  })

  watchEffect(() => {
    setFirstYear(chosenYear.value || thisMonth.value.year)
  })

  defineExpose({
    firstYear,
    setYear
  })
</script>
