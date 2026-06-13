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
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const date = ref(new Date())
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
