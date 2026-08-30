<template>
  <div
    ref="wrapperRef"
    class="mu-dropdown"
    :class="dropdownVisible && 'mu-dropdown--expanded'"
    v-on="wrapperEvents">
    <slot />
    <mu-icon v-if="dropdownIconAttrs" v-bind="dropdownIconAttrs" />
    <mu-dropdown-panel
      v-if="!dropdownPanel"
      ref="dropdownPanelRef"
      v-bind="dropdownPanelAttrs"
      v-on="dropdownPanelEvents">
      <template v-if="$slots['dropdown-header']" #header>
        <slot name="dropdown-header" />
      </template>
      <template v-if="$slots['dropdown-items']" #items>
        <slot name="dropdown-items" />
      </template>
      <template v-else-if="$slots.dropdown" #default>
        <slot name="dropdown" />
      </template>
      <template v-if="$slots['dropdown-footer']" #footer>
        <slot name="dropdown-footer" />
      </template>
    </mu-dropdown-panel>
  </div>
</template>

<script setup>
  import {
    dropdownEvents,
    dropdownProps,
    optionalProps,
    useDropdown
  } from './dropdown-wrapper'

  import MuDropdownPanel from './dropdown-panel.vue'

  defineOptions({ name: 'MusselDropdown' })

  const props = defineProps({
    ...dropdownProps,
    ...optionalProps,
    dropdownIcon: [Boolean, String],
    dropdownTrigger: { ...optionalProps.dropdownTrigger, default: 'hover' }
  })

  const emit = defineEmits(dropdownEvents)

  const {
    wrapperRef,
    wrapperEvents,
    dropdownVisible,
    dropdownIconAttrs,
    dropdownPanelRef,
    dropdownPanelAttrs,
    dropdownPanelEvents,
    expand,
    collapse
  } = useDropdown(props, emit)

  defineExpose({
    dropdownVisible,
    expand,
    collapse
  })
</script>

<style>
  .mu-dropdown {
    display: inline-flex;
    align-items: center;
  }
</style>
