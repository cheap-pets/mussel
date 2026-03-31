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
        <mu-switch
          v-model="darkMode"
          active-label="Dark"
          inactive-label="Light"
          style="margin-left: 16px;"
          @update:model-value="onUIModeChange" />
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

  const darkMode = ref(false)
  const size = ref('full')
  const shape = ref('line')
  const stripe = ref(false)
  const spaceFree = ref(false)
  const gap = '4px'

  const onUIModeChange = () => {
    document.querySelector('.mu-root').classList.toggle('mu-dark')
  }
</script>

<style scoped>
  .block {
    padding: 20px;
    overflow: hidden;
    border: 0px solid var(--mu-border-color-muted);
    background-color: var(--mu-bg-strong);
    text-align: center;
    font-size: 2rem;
  }
</style>
