<template>
  <div>
    <h2>
      CALENDAR
      <theme-switch />
    </h2>
    <div class="group" :class="[['test3'], 'test1', { test2: true }]">
      <mu-calendar v-model="date" class="calendar1" value-type="object" />
    </div>
    <div class="group">
      <mu-date-input v-model="date" prefix="日期选择" />
      <mu-date-input v-model="date" prefix="月份选择" type="month" format="yyyy-MM" value-type="object" />
      <mu-date-input v-model="date" prefix="年份选择" type="year" format="yyyy" value-type="object" />
    </div>
    <div class="group">
      <mu-time-input v-model="time1" placeholder="时分选择" prefix="时分" />
      <mu-time-input v-model="time2" type="time" placeholder="时分秒选择" prefix="时分秒" />
      <mu-time-input v-model="time3" :minute-step="15" placeholder="15 分步进" prefix="步进" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const date = ref(new Date())
  const time1 = ref('09:30')
  const time2 = ref('09:30:45')
  const time3 = ref('09:00')
</script>

<style>
  .mu-combo-box {
    width: 300px;
  }

  .calendar1 {
    width: 800px;
    height: 600px;
    padding: 8px;
    border: 1px solid var(--mu-border-color);
  }
</style>
