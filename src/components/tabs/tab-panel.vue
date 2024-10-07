<template>
  <div v-show="activeTab === name" ref="el" class="mu-tab-panel mu-box">
    <slot />
  </div>
</template>

<script setup>
  import './tab-panel.scss'

  import { shallowRef, computed, inject, onMounted, onBeforeUnmount } from 'vue'

  defineOptions({ name: 'MusselTabPanel' })

  const props = defineProps({
    icon: String,
    name: String,
    title: String,
    caption: String,
    disabled: Boolean
  })

  const el = shallowRef()
  const tabs = inject('tabs', {})
  const activeTab = computed(() => tabs.activeTab?.value)

  onMounted(() => tabs.mountTab?.(props, el.value))
  onBeforeUnmount(() => tabs.unmountTab?.(props, el.value))
</script>
