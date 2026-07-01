<template>
  <div>
    <h2>
      CALENDAR
      <theme-switch />
    </h2>
    <div class="group" :class="[['test3'], 'test1', { test2: true }]">
      <mu-calendar v-model="date" class="calendar1" />
    </div>
    <div class="group">
      <mu-date-input v-model="date" prefix="日期选择" />
      <mu-date-input v-model="date" prefix="月份选择" type="month" format="yyyy-MM" />
      <mu-date-input v-model="date" prefix="年份选择" type="year" format="yyyy" />
    </div>
    <div class="group">
      <mu-time-input v-model="time" placeholder="时分秒" :second-step="15" prefix="时分秒" />
      <mu-time-input v-model="time" :second-step="0" prefix="时分" />
      <mu-time-input v-model="time" :minute-step="0" :second-step="0" prefix="小时" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const date = ref()
  const time = ref('09:30')
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
