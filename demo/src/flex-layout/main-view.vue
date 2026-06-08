<template>
  <div>
    <div class="flex flex-col fixed p-1x" style="inset: 0;">
      <div class="mu-bar">
        <h2>Flex-layout & Splitter</h2>
        <mu-select
          v-model="spaceFree"
          style="width: 125px;"
          :options="[
            { value: false, label: '占用空间' },
            { value: true, label: '不占空间' }
          ]" />
        <mu-select
          v-model="size"
          style="width: 125px;"
          prefix="尺寸:"
          :options="[
            { value: 'normal', label: '普通' },
            { value: 'slim', label: '较细' },
            { value: 'concealed', label: '隐蔽' }
          ]" />
        <mu-select
          v-model="shape"
          style="width: 125px;"
          prefix="形状:"
          :options="[
            { value: 'line', label: '线条' },
            { value: 'bubble', label: '气泡' }
          ]" />
        <mu-check
          v-model="stripe"
          label="显示条纹"
          :disabled="shape === 'bubble'" />
        <theme-switch style="margin-left: 16px;" />
      </div>
      <mu-split-h-box class="flex-1 p-1x" resizable :style="{ gap }">
        <template #left>
          <div class="block" style="width: 100%; height: 100%">
            1
            <div style="width: 500px">
              Content
            </div>
          </div>
        </template>
        <template #center>
          <mu-split-v-box
            resizable="top"
            :splitter-size="size"
            :splitter-shape="shape"
            style="overflow: hidden; width: 100%; min-width: 300px; height: 100%;">
            <template #top>
              <div class="block" style="height: 100%;">
                2A
              </div>
            </template>
            <template #center>
              <div class="block" style="height: 100%;">
                2B
              </div>
            </template>
          </mu-split-v-box>
        </template>
        <template #right>
          <div class="block" style="width: 100%; height: 100%;">
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

  const size = ref('full')
  const shape = ref('line')
  const stripe = ref(false)
  const spaceFree = ref(false)
  const gap = '4px'

</script>

<style>
  .block {
    overflow: hidden;

    padding: 20px;
    border: 0px solid var(--mu-border-color-soft);

    font-size: 2rem;
    text-align: center;

    background-color: var(--mu-bg-strong);
  }
</style>
