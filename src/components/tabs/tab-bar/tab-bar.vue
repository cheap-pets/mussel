<template>
  <div class="mu-bar mu-tab-bar" :class="[`mu-tab-bar--${tabPosition}`, `mu-tab-bar--${tabStyle}`]">
    <slot name="prepend" />
    <div class="mu-tab-bar__buttons">
      <mu-tab-button
        v-for="el in tabButtons"
        :key="el.name"
        :active="activeTab === el.name"
        v-bind="el"
        @click="onTabClick(el.name)" />
    </div>
    <slot name="append" />
  </div>
</template>

<script setup>
  import './index.scss'

  import MuTabButton from './tab-button.vue'

  defineOptions({ name: 'MusselTabBar' })

  defineProps({
    tabButtons: Array,
    tabStyle: {
      type: String,
      default: 'button',
      validator: v => ['button', 'small-button', 'simple'].includes(v)
    },
    tabPosition: {
      type: String,
      default: 'top',
      validator: v => ['top', 'bottom', 'left', 'right'].includes(v)
    }
  })

  const emit = defineEmits(['tabClick'])
  const activeTab = defineModel('activeTab', { type: String })

  function onTabClick (name) {
    activeTab.value = name
    emit('tabClick', name)
  }
</script>
