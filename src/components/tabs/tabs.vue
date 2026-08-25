<template>
  <div ref="rootRef" :class="['mu-tabs', TABS_FLEX_DIRECTION_CLASS[tabPosition]]">
    <mu-tab-bar
      v-model:active-tab="activeTab"
      :tab-style="tabStyle"
      :tab-buttons="buttons"
      :tab-position="tabPosition"
      @tab-click="$emit('tabClick', $event)">
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
  import { shallowRef, computed, provide, onMounted } from 'vue'
  import { debounce } from 'throttle-debounce'

  defineOptions({ name: 'MusselTabs' })
  defineEmits(['tabClick'])

  const activeTab = defineModel('activeTab', { type: String })

  const props = defineProps({
    tabPosition: {
      type: String,
      default: 'top',
      validator: v => ['top', 'right', 'bottom', 'left'].includes(v)
    },
    tabStyle: String,
    tabButtons: Array,
    tabToolSize: String
  })

  const TABS_FLEX_DIRECTION_CLASS = {
    top: 'flex-col',
    bottom: 'flex-col-reverse',
    left: 'flex-row',
    right: 'flex-row-reverse'
  }

  const rootRef = shallowRef()
  const mountedTabs = new WeakMap()
  const mountedButtons = shallowRef([])

  const buttons = computed(() => props.tabButtons || mountedButtons.value)

  const refreshButtons = debounce(200, () => {
    const childNodes = rootRef.value?.childNodes

    mountedButtons.value = childNodes?.length
      ? Array
        .from(childNodes)
        .filter(child => mountedTabs.has(child))
        .map(child => mountedTabs.get(child))
        .sort((a, b) => a.tabOrder - b.tabOrder)
      : []
  })

  function mountTab (tabProps, tabElement) {
    if (!props.tabButtons) {
      mountedTabs.set(tabElement, tabProps)
      refreshButtons()
    }
  }

  function unmountTab (tabProps, tabElement) {
    if (!props.tabButtons) {
      mountedTabs.delete(tabElement)
      refreshButtons()
    }
  }

  function setActiveTab (tabName) {
    activeTab.value = tabName
  }

  onMounted(() => {
    if (!props.activeTab && buttons.value.length) {
      setActiveTab(buttons.value[0].name)
    }
  })

  provide('tabs', {
    activeTab,
    mountTab,
    unmountTab,
    setActiveTab
  })
</script>

<style>
  .mu-tabs {
    display: flex;
    background: var(--mu-bg-normal);

    & > .mu-tab-bar {
      flex: none;
    }
  }
</style>
