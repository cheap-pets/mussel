<template>
  <div ref="thisEl" class="mu-tabs" :style="sizeStyle" :tab-position="tabPosition">
    <mu-tab-bar
      v-model:active-tab="activeTab"
      v-bind="tabBar"
      :tab-style="tabStyle"
      :tab-buttons="buttons"
      :tab-position="tabPosition">
      <template #prepend>
        <slot name="tab-bar-prepend" />
      </template>
      <template #append>
        <slot name="tab-bar-append" />
      </template>
    </mu-tab-bar>
    <slot />
  </div>
</template>

<script setup>
  import './tabs.scss'

  import { ref, shallowRef, computed, provide, onMounted, nextTick } from 'vue'
  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselTabs' })

  const activeTab = defineModel('activeTab', { type: String })

  const props = defineProps({
    tabBar: Object,
    tabButtons: Array,
    tabStyle: {
      type: String,
      default: 'button',
      validator: v => ['button', 'small-button', 'simple', 'card', 'border-card'].includes(v)
    },
    tabPosition: {
      type: String,
      default: 'top',
      validator: v => ['top', 'right', 'bottom', 'left'].includes(v)
    },
    ...sizeProps
  })

  const thisEl = shallowRef()
  const mountedButtons = ref(new WeakMap())

  const buttons = computed(() =>
    !thisEl.value || props.tabButtons
      ? props.tabButtons
      : Array
        .from(thisEl.value.childNodes)
        .filter(child => mountedButtons.value.has(child))
        .map(child => mountedButtons.value.get(child))
  )

  const { sizeStyle } = useSize(props)

  function mountTab (tabProps, tabElement) {
    if (!props.tabButtons) {
      mountedButtons.value.set(tabElement, tabProps)
    }
  }

  function unmountTab (tabProps, tabElement) {
    if (!props.tabButtons) {
      mountedButtons.value.delete(tabElement)
    }
  }

  function setActiveTab (tabName) {
    activeTab.value = tabName
  }

  onMounted(() => nextTick(() => {
    if (!props.activeTab && buttons.value.length) {
      setActiveTab(buttons.value[0].name)
    }
  }))

  provide('tabs', {
    activeTab,
    mountTab,
    unmountTab,
    setActiveTab
  })
</script>
