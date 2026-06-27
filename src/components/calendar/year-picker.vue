<template>
  <div class="mu-year-picker">
    <table class="mu-date-grid">
      <tbody>
        <tr>
          <td @click="setFirstYear(firstYear - 10)">
            <mu-icon icon="chevronLeft" />
          </td>
          <td
            v-for="i in 3" :key="i"
            v-bind="getYearCellAttrs(firstYear + i - 1)"
            @click="onYearCellClick(firstYear + i - 1)" />
        </tr>
        <tr>
          <td
            v-for="i in 4" :key="i"
            v-bind="getYearCellAttrs(firstYear + i + 2)"
            @click="onYearCellClick(firstYear + i + 2)" />
        </tr>
        <tr>
          <td
            v-for="i in 3" :key="i"
            v-bind="getYearCellAttrs(firstYear + i + 6)"
            @click="onYearCellClick(firstYear + i + 6)" />
          <td @click="setFirstYear(firstYear + 10)">
            <mu-icon icon="chevronRight" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
  import './year-picker.scss'

  import { ref, computed, watchEffect } from 'vue'
  import { toObject, toString } from '../../utils/date'
  import { valueTypeProp } from './calendar'

  defineOptions({ name: 'MusselYearPicker' })

  const model = defineModel({ type: Object })

  const props = defineProps({
    valueType: valueTypeProp,
    format: { type: String, default: 'yyyy' }
  })

  const emit = defineEmits([
    'yearCellClick'
  ])

  const firstYear = ref()
  const chosenYear = ref()

  const selected = computed(() => toObject(model.value)?.year)
  const thisYear = computed(() => new Date().getFullYear())

  function getYearCellAttrs (year) {
    return {
      'data-year': year,
      present: (year === thisYear.value) || null,
      selected: (year === chosenYear.value) || null
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

    if (year !== selected.value) {
      const vType = props.valueType.toLowerCase()

      model.value = vType === 'object'
        ? { year, month: 0 }
        : vType === 'date'
          ? new Date(year, 0)
          : toString({ year, month: 0 }, props.format)
    }

    emit('yearCellClick', year)
  }

  watchEffect(() => {
    chosenYear.value = toObject(model.value)?.year
  })

  watchEffect(() => {
    setFirstYear(chosenYear.value || thisYear.value)
  })

  defineExpose({
    firstYear,
    setYear
  })
</script>
