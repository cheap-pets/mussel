<template>
  <div class="mu-bar mu-tab-bar" :style="sizeStyle">
    <slot name="prepend" />
    <div class="mu-tab-bar_buttons">
      <mu-tab-button
        v-for="el in tabButtons"
        :key="el.name"
        :active="activeTab === el.name"
        v-bind="el"
        @click="activeTab = el.name" />
    </div>
    <slot name="append" />
  </div>
</template>

<script setup>
  import './index.scss'

  import { useSize } from '@/hooks/size'

  import MuTabButton from './tab-button.vue'

  defineOptions({ name: 'MusselTabBar' })

  const activeTab = defineModel('activeTab', { type: String })

  const props = defineProps({
    width: String,
    tabButtons: Array
  })

  const { sizeStyle } = useSize(props)
</script>
