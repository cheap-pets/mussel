<template>
  <div>
    <div class="flex flex-col fixed p-1x" style="inset: 0;">
      <div class="mu-bar">
        <h2>Flex-layout & Splitter</h2>
        <mu-select
          v-model="shape"
          style="width: 130px;"
          prefix="形状:"
          :options="[
            { value: 'hidden', label: '隐藏' },
            { value: 'normal', label: '普通' },
            { value: 'slim', label: '细条' },
            { value: 'pill', label: '胶囊' },
            { value: 'slim-pill', label: '窄胶囊' },
          ]" />
        <mu-select
          v-model="gap"
          style="width: 115px;"
          prefix="间距:"
          :options="[
            { value: '0', label: '0' },
            { value: '4px', label: '4px' },
            { value: '8px', label: '8px' },
          ]" />
        <theme-switch style="margin-left: 16px;" />
      </div>
      <mu-split-h-box
        class="flex-1 p-1x border"
        resizable
        left-class="mu-bg-strong"
        right-class="mu-bg-strong"
        :splitter-shape="shape"
        :style="{ gap }">
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
            class="block"
            resizable
            :splitter-shape="shape"
            :style="{ gap }"
            style="min-width: 300px;">
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
          <div class="block">
            3
          </div>
        </template>
      </mu-split-h-box>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const shape = ref('normal')
  const gap = ref('4px')

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
