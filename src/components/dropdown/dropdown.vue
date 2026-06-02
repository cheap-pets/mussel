<template>
  <div
    ref="wrapper"
    class="mu-dropdown"
    :class="dropdownVisible && 'mu-dropdown--expanded'"
    v-on="wrapperEvents">
    <slot />
    <mu-icon v-if="dropdownIconAttrs" v-bind="dropdownIconAttrs" />
    <mu-dropdown-panel
      ref="dropdownPanel"
      v-bind="dropdownPanelAttrs"
      v-on="dropdownPanelEvents">
      <slot name="dropdown" />
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

  defineOptions({ name: 'MusselDropdown' })

  const props = defineProps({
    ...dropdownProps,
    ...optionalProps,
    dropdownIcon: [Boolean, String],
    dropdownTrigger: { ...optionalProps.dropdownTrigger, default: 'hover' }
  })

  const emit = defineEmits(dropdownEvents)

  const {
    wrapper,
    wrapperEvents,
    dropdownVisible,
    dropdownIconAttrs,
    dropdownPanel,
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
