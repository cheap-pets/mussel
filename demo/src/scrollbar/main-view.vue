<template>
  <div>
    <h2>
      SCROLLBAR & SCROLL-BOX
      <theme-switch />
    </h2>

    <div v-mu-scrollbar class="scroll-container" scrollbar-visible="always">
      <div class="scroll-element" />
    </div>
    <p>
      <mu-button @click="resetHeight">
        Reset Height
      </mu-button>
      <mu-button @click="setScrollTop">
        Set ScrollTop
      </mu-button>
    </p>
    <mu-scroll-box class="scroll-container">
      <div class="scroll-element" />
    </mu-scroll-box>
    <p />
    <mu-scroll-box class="scroll-container border">
      <div style="position: sticky; left: 0; right: 0; top: 0;">
        <div
          class="border"
          style="position: absolute; background-color: blue; left: 0; right: 0; top: 0; height: 40px;">
          1
        </div>
        <div
          class="border"
          style="position: absolute; background-color: red; left: 0; width: 150px; height: 2000px;">
          1
        </div>
        <div
          class="border"
          style="position: absolute; background-color: red; right: 0; width: 150px; height: 2000px;">
          3
        </div>
      </div>
      <div
        style="height: 5000px; width: 2000px; background-color: #eee; margin: 0 150px;">
        2
      </div>
    </mu-scroll-box>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  function resetHeight () {
    const el = document.querySelector('.scroll-element')
    if (el) {
      el.style.height = '1000px'
      el.style.width = '100px'
    }
  }

  function setScrollTop () {
    const el = document.querySelector('.scroll-container')
    if (el) {
      el.scrollTop = el.scrollTop + 500
    }
  }

</script>

<style>
  .scroll-container {
    will-change: scroll-position;
    position: relative;
    width: 50%;
    height: 500px;
  }

  .scroll-element {
    width: 3000px;
    height: 30000px;
    background-image: linear-gradient(45deg, yellow, red, yellow);
  }
</style>
