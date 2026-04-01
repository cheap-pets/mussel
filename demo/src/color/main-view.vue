<template>
  <div>
    <h2>Colors</h2>
    <div>
      <div>
        <h3 class="mu-text-color-subtitle">
          BASE
        </h3>
        <div
          v-for="color in baseColors"
          :key="color"
          :style="{ backgroundColor: `var(--mu-${color})`, color: '#fff' }"
          class="color-block">
          {{ color }}
        </div>
      </div>
      <div>
        <h3 class="mu-text-color-subtitle">
          NEUTRAL
        </h3>
        <div
          v-for="n in 10"
          :key="n"
          :style="{ backgroundColor: `var(--mu-gray-${n - 1})`, color: n < 6 ? '#000' : '#fff' }"
          class="color-block">
          gray-{{ n - 1 }}
        </div>
        <div class="color-block" style="background-color: var(--mu-gray-translucent); color: var(--mu-gray);">
          translucent
        </div>
      </div>
      <div>
        <h3 class="mu-text-color-subtitle">
          PRIMARY
        </h3>
        <div
          v-for="n in 10"
          :key="n"
          :style="{ backgroundColor: `var(--mu-primary-color-${n - 1})`, color: n < 6 ? '#000' : '#fff' }"
          class="color-block">
          primary-{{ n - 1 }}
        </div>
        <div class="color-block" style="background-color: var(--mu-primary-translucent); color: var(--mu-primary-color);">
          translucent
        </div>
      </div>
      <div>
        <h3 class="mu-text-color-subtitle">
          SECONDARY
        </h3>
        <div
          v-for="n in 10"
          :key="n"
          :style="{ backgroundColor: `var(--mu-secondary-color-${n - 1})`, color: n < 6 ? '#000' : '#fff' }"
          class="color-block">
          secondary-{{ n - 1 }}
        </div>
        <div class="color-block" style="background-color: var(--mu-secondary-translucent); color: var(--mu-secondary-color);">
          translucent
        </div>
      </div>
      <div>
        <h3 class="mu-text-color-subtitle">
          SUCCESS
        </h3>
        <div
          v-for="n in 10"
          :key="n"
          :style="{ backgroundColor: `var(--mu-success-color-${n - 1})`, color: n < 6 ? '#000' : '#fff' }"
          class="color-block">
          success-{{ n - 1 }}
        </div>
        <div class="color-block" style="background-color: var(--mu-success-translucent); color: var(--mu-success-color);">
          translucent
        </div>
      </div>
      <div>
        <h3 class="mu-text-color-subtitle">
          WARNING
        </h3>
        <div
          v-for="n in 10"
          :key="n"
          :style="{ backgroundColor: `var(--mu-warning-color-${n - 1})`, color: n < 6 ? '#000' : '#fff' }"
          class="color-block">
          warning-{{ n - 1 }}
        </div>
        <div class="color-block" style="background-color: var(--mu-warning-translucent); color: var(--mu-warning-color);">
          translucent
        </div>
      </div>
      <div>
        <h3 class="mu-text-color-subtitle">
          DANGER
        </h3>
        <div
          v-for="n in 10"
          :key="n"
          :style="{ backgroundColor: `var(--mu-danger-color-${n - 1})`, color: n < 6 ? '#000' : '#fff' }"
          class="color-block">
          danger-{{ n - 1 }}
        </div>
        <div class="color-block" style="background-color: var(--mu-danger-translucent); color: var(--mu-danger-color);">
          translucent
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  const baseColors = ['red', 'pink', 'grape', 'violet', 'indigo', 'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange']
</script>

<style>
  .color-block {
    display: inline-block;
    width: 100px;
    height: 100px;
    margin: 8px;
    line-height: 100px;
    text-align: center;
    color: #000;
  }
</style>
