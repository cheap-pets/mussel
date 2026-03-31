<template>
  <div>
    <h2>
      CALENDAR
      <mu-switch
        v-model="darkMode"
        active-label="Dark"
        inactive-label="Light"
        @update:model-value="onUIModeChange" />
    </h2>
    <div class="group" :class="[['test3'], 'test1', { test2: true }]">
      <mu-calendar v-model="date" class="calendar1" value-type="object" />
    </div>
    <div class="group">
      <mu-date-input v-model="date" />
      <mu-date-input v-model="date" type="month" format="yyyy-MM" value-type="object" />
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const darkMode = ref(false)
  const date = ref(new Date())

  function onUIModeChange () {
    document.querySelector('.mu-root').classList.toggle('mu-dark')
  }
</script>

<style scoped>
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
