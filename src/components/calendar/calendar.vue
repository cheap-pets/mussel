<template>
  <div class="mu-calendar">
    <mu-toolbar class="p-half radius-control bg-strong" default-button-style="text">
      <mu-dropdown-button
        ref="monthDropdown"
        :caption="caption"
        icon="calendar"
        class="mr-auto"
        dropdown-class="mu-date-dropdown">
        <template #dropdown>
          <month-picker
            ref="monthSelector"
            v-model="monthProxy"
            @month-cell-click="monthDropdown.collapse()" />
        </template>
      </mu-dropdown-button>
      <template v-if="!monthDropdown?.dropdownVisible">
        <mu-button :caption="$t('Datetime.TODAY')" @click="onTodayClick" />
        <mu-icon-button icon="chevronUp" @click="goPrevMonth" />
        <mu-icon-button icon="chevronDown" @click="goNextMonth" />
      </template>
    </mu-toolbar>
    <date-picker
      v-model="modelProxy"
      :class="[monthDropdown?.dropdownVisible && 'mu-date-picker--masked']"
      :year="displayYear"
      :month="displayMonth"
      :week-starts-on="weekStartsOn" />
  </div>
</template>

<script setup>
  import { shallowRef, computed } from 'vue'
  import { t as $t } from '@/langs'
  import { dateProps } from './constants'
  import { useDateCore } from './date-core'

  import DatePicker from './date-picker.vue'
  import MonthPicker from './month-picker.vue'

  defineOptions({ name: 'MusselCalendar' })

  const model = defineModel({ type: [Date, String], default: null })
  const props = defineProps({ ...dateProps })

  const {
    todayObj,
    monthProxy,
    modelProxy,
    displayYear,
    displayMonth,
    goPrevMonth,
    goNextMonth,
    setDisplayMonth,
    updateModelValue
  } = useDateCore(model, props)

  const monthDropdown = shallowRef()
  const monthSelector = shallowRef()

  const caption = computed(() => {
    const startY = monthDropdown.value?.dropdownVisible && monthSelector.value?.startYear

    return startY
      ? `${startY} ~ ${startY + 9}`
      : $t('Datetime.YEAR_AND_MONTH', displayYear.value, $t('Datetime.MONTHS_SHORT')[displayMonth.value])
  })

  function onTodayClick () {
    updateModelValue(todayObj)
    setDisplayMonth(todayObj)
  }
</script>

<style>
  .mu-calendar {
    display: flex;
    flex-direction: column;
    background-color: var(--mu-bg-normal);

    & > .mu-date-picker {
      flex: 1 1 0;
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
