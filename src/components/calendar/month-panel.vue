<template>
  <div class="mu-month-panel">
    <table class="mu-calendar_table" cellpadding="0" cellspacing="0">
      <tbody>
        <tr class="mu-month-panel_year-tr">
          <td @click="current.year = firstYear - 1">
            <mu-icon icon="chevronLeft" />
          </td>
          <td
            v-for="i in 5" :key="i"
            v-bind="getYearBindings(firstYear + i - 1)"
            @click="current.year = firstYear + i - 1" />
        </tr>
        <tr class="mu-month-panel_year-tr">
          <td
            v-for="i in 5" :key="i"
            v-bind="getYearBindings(firstYear + i + 4)"
            @click="current.year = firstYear + i + 4" />
          <td @click="current.year = firstYear + 10">
            <mu-icon icon="chevronRight" />
          </td>
        </tr>
        <tr class="mu-month-panel_month-tr">
          <td
            v-for="i in 6" :key="i"
            v-bind="getMonthBindings(i - 1)"
            @click="current.month = i - 1"
            @dblclick="updateModel" />
        </tr>
        <tr class="mu-month-panel_month-tr">
          <td
            v-for="i in 6" :key="i"
            v-bind="getMonthBindings(i + 5)"
            @click="current.month = i + 5"
            @dblclick="updateModel" />
        </tr>
      </tbody>
    </table>
    <div class="mu-bar">
      <mu-button :caption="THIS_MONTH" button-style="text" accent small @click="updateCurrent(today)" />
      <div class="mu-space" />
      <mu-button v-bind="btnCancel" small @click="emit('done')" />
      <mu-button v-bind="btnOk" button-style="text" small @click="updateModel" />
    </div>
  </div>
</template>

<script setup>
  import './month-panel.scss'

  import { reactive, computed, watchEffect } from 'vue'
  import { equals, toObject } from './utils'
  import { ButtonPresets } from '../button/button-presets'

  import lang from '@/langs'

  const { MONTHS_SHORT, THIS_MONTH } = lang.Calendar
  const { OK: btnOk, CANCEL: btnCancel } = ButtonPresets

  const emit = defineEmits(['done'])
  const model = defineModel({ type: Object })

  const current = reactive({})

  const firstYear = computed(() => current.year - current.year % 10)
  const today = computed(() => toObject(new Date()))

  function getYearBindings (year) {
    return {
      'data-year': year,
      selected: (year === current.year) || null,
      present: (year === today.value.year) || null
    }
  }

  function getMonthBindings (month) {
    return {
      'data-month': MONTHS_SHORT[month],
      selected: (month === current.month) || null,
      present: (current.year === today.value.year && month === today.value.month) || null
    }
  }

  function updateCurrent ({ year, month }) {
    current.year = year
    current.month = month
  }

  function updateModel () {
    if (!equals(model.value, current)) {
      model.value = { ...current }
    }

    emit('done')
  }

  watchEffect(() => Object.assign(current, model.value))
</script>
