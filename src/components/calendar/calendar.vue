<template>
  <div class="mu-calendar">
    <mu-toolbar class="bg-strong p-half">
      <mu-dropdown-button
        ref="monthDropdown"
        :caption="caption"
        icon="calendar"
        class="mr-auto"
        dropdown-class="mu-date-dropdown">
        <template #dropdown>
          <month-picker
            ref="monthSelector"
            v-model="currentProxy"
            class="flex-1"
            @month-cell-click="monthDropdown.collapse()" />
        </template>
      </mu-dropdown-button>
      <template v-if="!monthDropdown?.dropdownVisible">
        <mu-button :caption="$t('Calendar.TODAY')" @click="onTodayClick" />
        <mu-icon-button icon="chevronUp" @click="goPrevMonth" />
        <mu-icon-button icon="chevronDown" @click="goNextMonth" />
      </template>
    </mu-toolbar>
    <date-picker
      v-model="model"
      class="flex-1"
      :output-type="outputType"
      :class="[monthDropdown?.dropdownVisible && 'mu-date-picker--masked']"
      :year="year"
      :month="month" />
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { t as $t } from '@/langs'
  import { calendarProps, useCalendar } from './calendar'

  import DatePicker from './date-picker.vue'
  import MonthPicker from './month-picker.vue'

  defineOptions({ name: 'MusselCalendar' })

  const model = defineModel({ type: [Date, String] })
  const props = defineProps({ ...calendarProps })

  const {
    year,
    month,
    today,
    currentProxy,
    setCurrent,
    goPrevMonth,
    goNextMonth,
    updateModelValue
  } = useCalendar(model, props)

  const monthDropdown = ref()
  const monthSelector = ref()

  const firstYear = computed(() => monthSelector.value?.firstYear)

  const caption = computed(() =>
    monthDropdown.value?.dropdownVisible
      ? `${firstYear.value} ~ ${firstYear.value + 9}`
      : $t('Calendar.YEAR_AND_MONTH', year.value, $t('Calendar.MONTHS_SHORT')[month.value])
  )

  function onTodayClick () {
    updateModelValue(today)
    setCurrent(today)
  }
</script>

<style>
  .mu-calendar {
    display: flex;
    flex-direction: column;
    background-color: var(--mu-bg-normal);

    & > .mu-date-picker {
      width: 100%;
    }

    & .mu-date-cell {
      align-items: flex-start;
      justify-content: flex-start;
      padding: var(--mu-base-spacing);
      border: 1px solid var(--mu-border-color-soft);
    }
  }
</style>
