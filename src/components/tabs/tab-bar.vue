<template>
  <div
    :class="[
      'mu-tab-bar',
      `mu-tab-bar--${tabStyle}`,
      `mu-tab-bar--${tabPosition}`,
      ['left', 'right'].includes(tabPosition) ? 'mu-sidebar': 'mu-toolbar'
    ]">
    <slot name="prepend" />
    <mu-scroll-area ref="scrollAreaRef" :vertical="isVertical">
      <mu-tab-button
        v-for="el in tabButtons"
        :key="el.name"
        :ref="v => setTabButtonRef(el.name, v)"
        :name="el.name"
        :icon="el.icon"
        :caption="el.caption"
        :disabled="el.disabled"
        :active="activeTab === el.name"
        @click="onTabClick(el.name)" />
      <template #overflow-buttons>
        <mu-dropdown-button
          class="mu-icon-button"
          size="small"
          button-style="text"
          dropdown-icon="list"
          dropdown-style="max-height: 200px"
          dropdown-scrollbar
          :dropdown-items="dropdownItems"
          @dropdown:itemclick="onTabClick($event.action)" />
      </template>
    </mu-scroll-area>
    <slot name="append" />
  </div>
</template>

<script setup>
  import './tab-bar.scss'

  import { provide, computed, ref, watch } from 'vue'

  import MuTabButton from './tab-button.vue'
  import MuScrollArea from '../bar/scroll-area.vue'

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

  const scrollAreaRef = ref()
  const tabButtonEls = new Map()

  const isVertical = computed(() => ['left', 'right'].includes(props.tabPosition))

  const dropdownItems = computed(() =>
    props.tabButtons?.filter(el => !el.disabled).map(el => ({
      action: el.name,
      icon: el.icon,
      label: el.caption || el.name,
      disabled: el.disabled
    }))
  )

  provide('toolSize', computed(() => props.tabStyle === 'small-button' ? 'small' : undefined))

  function setTabButtonRef (name, el) {
    if (el) tabButtonEls.set(name, el.$el || el)
    else tabButtonEls.delete(name)
  }

  function onTabClick (name) {
    activeTab.value = name
    emit('tabClick', name)
  }

  watch(
    activeTab,
    name => {
      const el = name && tabButtonEls.get(name)
      if (el) scrollAreaRef.value?.scrollIntoView(el)
    },
    { flush: 'post' }
  )
</script>
