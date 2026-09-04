<template>
  <combo-wrapper
    v-model="comboValue"
    class="mu-date-range-input"
    dropdown-icon="calendar"
    :dropdown-class="['mu-date-dropdown', dropdownClass]"
    @dropdown:show="syncCursor">
    <template #dropdown>
      <mu-toolbar class="p-half radius-control bg-strong" default-button-style="text">
        <div class="px-1x">
          {{ caption }}
        </div>
        <mu-button class="ml-auto" :caption="$t('Datetime.TODAY')" @click="goToday" />
        <mu-icon-button icon="chevronUp" @click="goPrevMonth" />
        <mu-icon-button icon="chevronDown" @click="goNextMonth" />
      </mu-toolbar>
      <date-range-picker
        ref="panel"
        v-model="rangeProxy"
        :year="displayYear"
        :month="displayMonth"
        :week-starts-on="weekStartsOn" />
    </template>
  </combo-wrapper>
</template>

<script setup>
  import { ref, shallowRef, computed, watch } from 'vue'

  import { t as $t } from '@/langs'
  import { useFieldModel } from '../form/validation'
  import { DEFAULT_FORMAT, dateProps } from '../calendar/constants'
  import {
    toDate,
    toDateObject,
    toDateString,
    getPrevMonth,
    getNextMonth
  } from '@/utils/date'

  import ComboWrapper from './combo-wrapper.vue'
  import DateRangePicker from '../calendar/date-range-picker.vue'

  defineOptions({ name: 'MusselDateRangeInput' })

  const props = defineProps({
    ...dateProps,
    format: {
      type: String,
      default: null
    },
    dropdownClass: null
  })

  const displayFormat = computed(() =>
    props.format || DEFAULT_FORMAT.date
  )

  // model 为 { startDate, endDate }，两侧类型由 valueType 决定，两侧皆空时为 null。
  const rawModel = defineModel({ type: Object, default: null })
  const model = useFieldModel(rawModel).modelProxy

  const todayObj = toDateObject(new Date())
  const displayYear = ref(todayObj.year)
  const displayMonth = ref(todayObj.month)

  const panel = shallowRef()

  const rangeProxy = computed({
    get: () => ({
      startDate: toDate(model.value?.startDate),
      endDate: toDate(model.value?.endDate)
    }),
    set: v => setRange(toDateObject(v.startDate), toDateObject(v.endDate))
  })

  const comboValue = computed({
    get () {
      const { startDate, endDate } = rangeProxy.value

      if (!startDate && !endDate) return ''

      return toDateString(startDate, displayFormat.value) +
        ' ~ ' +
        (endDate ? toDateString(endDate, displayFormat.value) : '')
    },
    set (v) {
      const [start, end] = String(v ?? '').split('~')

      setRange(toDateObject(start.trim()), toDateObject(end?.trim()))
    }
  })

  const caption = computed(() =>
    $t('Datetime.YEAR_AND_MONTH', displayYear.value, $t('Datetime.MONTHS_SHORT')[displayMonth.value])
  )

  function setRange (startDate, endDate) {
    const toValue = obj => {
      if (!obj) return null

      const date = new Date(obj.year, obj.month, obj.date)

      return props.valueType === 'string'
        ? toDateString(date, props.valueFormat)
        : date
    }

    const next = {
      startDate: toValue(startDate),
      endDate: toValue(endDate)
    }

    model.value = next.startDate || next.endDate ? next : null
  }

  function setDisplayMonth (dateObj) {
    if (dateObj) {
      displayYear.value = dateObj.year
      displayMonth.value = dateObj.month
    }
  }

  // 面板显示游标跟随开始日期（缺省时结束日期，再缺省时今天）。
  function anchorDate () {
    return toDateObject(model.value?.startDate) ||
      toDateObject(model.value?.endDate) ||
      todayObj
  }

  function syncCursor () {
    setDisplayMonth(anchorDate())
  }

  function goPrevMonth () {
    setDisplayMonth(getPrevMonth(displayYear.value, displayMonth.value))
  }

  function goNextMonth () {
    setDisplayMonth(getNextMonth(displayYear.value, displayMonth.value))
  }

  // 「今日」跳回当月，并按面板的区间点击规则选中今天。
  function goToday () {
    syncCursor()
    panel.value?.selectDate(new Date(todayObj.year, todayObj.month, todayObj.date))
  }

  // 仅在开始日期变化时跟随游标，选结束日期不打断用户当前的浏览位置。
  watch(() => model.value?.startDate, syncCursor)
</script>
