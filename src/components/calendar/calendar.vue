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
            v-model="current"
            class="flex-1"
            output-type="Object"
            @month-cell-click="monthDropdown.collapse()" />
        </template>
      </mu-dropdown-button>
      <template v-if="!monthDropdown?.dropdownVisible">
        <mu-button :caption="$t('Calendar.THIS_MONTH')" @click="setCurrent(today)" />
        <mu-icon-button icon="chevronUp" @click="prevMonth" />
        <mu-icon-button icon="chevronDown" @click="nextMonth" />
      </template>
    </mu-toolbar>
    <date-picker
      class="flex-1"
      :class="[monthDropdown?.dropdownVisible && 'mu-date-picker--masked']"
      :year="year"
      :month="month"
      :selected="selected"
      @cell-click="onDateCellClick" />
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { t as $t } from '@/langs'
  import { calendarProps, useCalendar } from './calendar'

  import DatePicker from './date-picker.vue'
  import MonthPicker from './month-picker.vue'

  defineOptions({ name: 'MusselCalendar' })

  const model = defineModel({ type: [Date, String, Object, Array] })
  const props = defineProps({ ...calendarProps })

  const {
    year,
    month,
    today,
    current,
    selected,
    prevMonth,
    nextMonth,
    setCurrent,
    onDateCellClick
  } = useCalendar(model, props)

  const monthDropdown = ref()
  const monthSelector = ref()

  const selectingMonth = computed(() => monthDropdown.value?.dropdownVisible)
  const firstYear = computed(() => monthSelector.value?.firstYear)

  const caption = computed(() =>
    selectingMonth.value
      ? `${firstYear.value} ~ ${firstYear.value + 9}`
      : $t('Calendar.YEAR_AND_MONTH', year.value, $t('Calendar.MONTHS_SHORT')[month.value])
  )
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
      padding: var(--mu-base-spacing);
      border: 1px solid var(--mu-border-color-soft);
    }
  }
</style>
