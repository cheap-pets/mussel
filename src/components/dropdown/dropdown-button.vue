<template>
  <mu-button-group v-if="splitButton" ref="wrapperRef" class="mu-dropdown" v-bind="$attrs">
    <mu-button :icon="icon" :caption="caption" @click="collapse">
      <slot />
    </mu-button>
    <mu-button v-if="dropdownIconAttrs" class="mu-button mu-icon-button" :active="dropdownVisible" v-on="wrapperEvents">
      <mu-icon v-bind="dropdownIconAttrs" />
    </mu-button>
  </mu-button-group>
  <mu-button
    v-else
    ref="wrapperRef"
    v-bind="$attrs" class="mu-dropdown" :active="dropdownVisible"
    v-on="wrapperEvents">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      {{ caption }}
    </slot>
    <mu-icon v-if="dropdownIconAttrs" v-bind="dropdownIconAttrs" />
  </mu-button>
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
</template>

<script setup>
  import {
    dropdownEvents,
    dropdownProps,
    optionalProps,
    useDropdown
  } from './dropdown-wrapper'

  import MuDropdownPanel from './dropdown-panel.vue'

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
