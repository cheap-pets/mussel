<template>
  <div
    :class="[
      'mu-tab-bar',
      `mu-tab-bar--${tabStyle}`,
      `mu-tab-bar--${tabPosition}`,
      ['left', 'right'].includes(tabPosition) ? 'mu-sidebar': 'mu-toolbar'
    ]">
    <slot name="prepend" />
    <div class="mu-tab-bar__buttons">
      <mu-tab-button
        v-for="el in tabButtons"
        :key="el.name"
        :name="el.name"
        :icon="el.icon"
        :caption="el.caption"
        :disabled="el.disabled"
        :active="activeTab === el.name"
        @click="onTabClick(el.name)" />
    </div>
    <slot name="append" />
  </div>
</template>

<script setup>
  import './index.scss'

  import { provide, computed } from 'vue'

  import MuTabButton from './tab-button.vue'

  defineOptions({ name: 'MusselTabBar' })

  const props = defineProps({
    tabButtons: Array,
    tabStyle: {
      type: String,
      default: 'button',
      validator: v => ['button', 'small-button', 'simple', 'card'].includes(v)
    },
    tabPosition: {
      type: String,
      default: 'top',
      validator: v => ['top', 'bottom', 'left', 'right'].includes(v)
    }
  })

  const activeTab = defineModel('activeTab', { type: String })
  const emit = defineEmits(['tabClick'])

  provide('toolSize', computed(() => props.tabStyle === 'small-button' ? 'small' : undefined))

  function onTabClick (name) {
    activeTab.value = name
    emit('tabClick', name)
  }
</script>
