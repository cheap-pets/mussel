<template>
  <div>
    <mu-v-box position="fixed fit" padding="1x">
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
      <mu-h-box flex="1" :style="{ gap }" padding="1x">
        <div
          class="block" flex="0" collapsible
          style="min-width: 200px;"
          recover-size="auto">
          1
          <div style="width: 500px">
            Content
          </div>
        </div>
        <mu-flex-splitter
          :size="size"
          :shape="shape"
          :stripe="stripe"
          :space-free="spaceFree" />
        <mu-v-box
          flex="1" collapsible
          style="overflow: hidden; min-width: 300px;"
          :style="{ gap }">
          <div class="block" flex="1">
            2A
          </div>
          <mu-flex-splitter
            :size="size"
            :shape="shape"
            :stripe="stripe"
            :space-free="spaceFree" />
          <div class="block" flex="1">
            2B
          </div>
        </mu-v-box>
        <mu-flex-splitter
          :size="size"
          :shape="shape"
          :stripe="stripe"
          :space-free="spaceFree" />
        <div class="block" flex="1">
          3
        </div>
      </mu-h-box>
    </mu-v-box>
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
