<template>
  <div v-show="visible" ref="el" class="mu-tab-panel">
    <slot />
  </div>
</template>

<script setup>
  import { shallowRef, computed, inject, onMounted, onBeforeUnmount } from 'vue'

  defineOptions({ name: 'MusselTabPanel' })

  const props = defineProps({
    icon: String,
    name: String,
    title: String,
    caption: String,
    disabled: Boolean,
    tabOrder: { type: Number, default: null }
  })

  const el = shallowRef()
  const tabs = inject('tabs', {})
  const visible = computed(() => tabs.activeTab?.value === props.name)

  defineExpose({
    visible
  })

  onMounted(() => tabs.mountTab?.(props, el.value))
  onBeforeUnmount(() => tabs.unmountTab?.(props, el.value))
</script>

<style>
  .mu-tab-panel {
    flex: 1 1 0;
    background: var(--mu-bg-normal);
  }
</style>
