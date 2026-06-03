<template>
  <div ref="thisEl" class="mu-tabs" :tab-position="tabPosition">
    <mu-tab-bar
      v-model:active-tab="activeTab"
      v-bind="tabBarAttrs"
      :tab-style="tabStyle"
      :tab-buttons="buttons"
      :tab-position="tabPosition"
      @button-click="$emit('buttonClick', $event)">
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
  import { useCompatible } from '../common/compatible'
  import { debounce } from 'throttle-debounce'

  defineOptions({ name: 'MusselTabs' })
  defineEmits(['buttonClick'])

  useCompatible('tabs')

  const activeTab = defineModel('activeTab', { type: String })

  const props = defineProps({
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
    tabBarAttrs: Object,
    tabButtons: Array
  })

  const thisEl = shallowRef()
  const mountedButtons = ref(new WeakMap())
  const buttonsUpdateKey = ref(0)

  const buttons = computed(() =>
    props.tabButtons || (
      thisEl.value && buttonsUpdateKey.value
        ? Array
          .from(thisEl.value.childNodes)
          .filter(child => mountedButtons.value.has(child))
          .map(child => mountedButtons.value.get(child))
          .sort((a, b) => a.tabOrder - b.tabOrder)
        : []
    )
  )

  const increaseButtonsUpdateKey = debounce(200, () => buttonsUpdateKey.value++)

  function mountTab (tabProps, tabElement) {
    if (!props.tabButtons) {
      mountedButtons.value.set(tabElement, tabProps)
      increaseButtonsUpdateKey()
    }
  }

  function unmountTab (tabProps, tabElement) {
    if (!props.tabButtons) {
      mountedButtons.value.delete(tabElement)
      increaseButtonsUpdateKey()
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
