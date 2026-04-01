<template>
  <div>
    <H2>
      GESTURE
      <theme-switch />
    </H2>
    <div class="group">
      <h3>TAP, PRESS, PAN</h3>
      <div
        class="mu-bordered gesture-box"
        @tap="onTap"
        @press="onPress"
        @panmove="onPanMove">
        <div class="gradient-background"></div>
      </div>
      <div class="log-area">
        <div v-for="(log, i) in logs" :key="i" class="log-entry">{{ log }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const logs = ref([])

  function addLog (message) {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.unshift(`[${timestamp}] ${message}`)
    if (logs.value.length > 20) logs.value.pop()
  }

  function onTap (event) {
    addLog(`tap: ${JSON.stringify(event.detail.gestureState)}`)
  }

  function onPress (event) {
    addLog(`press: ${JSON.stringify(event.detail.gestureState)}`)
  }

  function onPanMove (event) {
    addLog(`panmove: totalX = ${event.detail.gestureState.totalX}`)
  }

</script>

<style>
  .gesture-box {
    width: 200px;
    height: 200px;
    padding: 0;
    overflow: auto;
    cursor: pointer;
  }

  .gradient-background {
    height: 1000px;
    background-image: linear-gradient(#e66465, #9198e5);
  }

  .log-area {
    margin-top: 20px;
    padding: 10px;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--mu-border-color);
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    background: var(--mu-background-color);
  }

  .log-entry {
    padding: 4px 0;
    border-bottom: 1px solid var(--mu-border-color);
  }

  .log-entry:last-child {
    border-bottom: none;
  }
</style>
