<template>
  <div>
    <div class="flex flex-col fixed p-1x" style="inset: 0;">
      <div class="mu-bar">
        <h2>Flex-layout & Splitter</h2>
        <mu-select
          v-model="shape"
          style="width: 150px;"
          prefix="Shape:"
          :options="[
            { value: 'hidden', label: 'hidden' },
            { value: 'normal', label: 'normal' },
            { value: 'slim', label: 'slim' },
            { value: 'pill', label: 'pill' }
          ]" />
        <theme-switch style="margin-left: 16px;" />
      </div>
      <mu-split-h-box
        class="flex-1 p-1x border"
        resizable
        collapsible
        left-class="mu-bg-strong"
        left-style="min-width: 300px"
        right-class="mu-bg-strong"
        :splitter-shape="shape">
        <template #left>
          <div class="block">
            1
            <div style="width: 500px">
              Content
            </div>
          </div>
        </template>
        <template #center>
          <mu-split-v-box
            resizable
            class="block"
            top-class="border-b"
            :splitter-shape="shape">
            <template #top>
              <div class="block" style="height: 100%;">
                2A
              </div>
            </template>
            <template #center>
              <div class="block">
                2B
              </div>
            </template>
          </mu-split-v-box>
        </template>
        <template #right>
          <mu-v-box class="block" flex-center>
            3
          </mu-v-box>
        </template>
      </mu-split-h-box>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const shape = ref('pill')

</script>

<style>
  .block {
    overflow: hidden;

    width: 100%;
    height: 100%;

    font-size: 2rem;
    text-align: center;
  }
</style>
