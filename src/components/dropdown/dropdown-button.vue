<template>
  <mu-button-group
    v-if="splitButton"
    ref="wrapper"
    class="mu-dropdown"
    v-bind="$attrs">
    <mu-button :icon="icon" :caption="caption" @click="collapse">
      <slot />
    </mu-button>
    <mu-button v-if="dropdownIconAttrs" class="mu-button mu-icon-button" :active="dropdownVisible" v-on="wrapperEvents">
      <mu-icon v-bind="dropdownIconAttrs" />
    </mu-button>
  </mu-button-group>
  <mu-button
    v-else
    ref="wrapper"
    v-bind="$attrs" class="mu-dropdown" :active="dropdownVisible"
    v-on="wrapperEvents">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      {{ caption }}
    </slot>
    <mu-icon v-if="dropdownIconAttrs" v-bind="dropdownIconAttrs" />
  </mu-button>
  <mu-dropdown-panel
    ref="dropdownPanel"
    v-bind="dropdownPanelAttrs"
    v-on="dropdownPanelEvents">
    <slot name="dropdown" />
  </mu-dropdown-panel>
</template>

<script setup>
  import {
    dropdownEvents,
    dropdownProps,
    optionalProps,
    useDropdown
  } from './dropdown-wrapper'

  defineOptions({ name: 'MusselDropdownButton', inheritAttrs: false })

  const props = defineProps({
    ...dropdownProps,
    ...optionalProps,
    icon: String,
    caption: String,
    splitButton: Boolean
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
