<template>
  <mu-button-group
    v-if="splitButton"
    ref="wrapper" class="mu-dropdown" v-bind="$attrs">
    <mu-button :icon="icon" :caption="caption" @click="collapse">
      <slot />
    </mu-button>
    <mu-button
      class="mu-button mu-icon-button" :active="dropdownVisible"
      @click.stop="onTriggerClick" @mouseover="onTriggerMouseOver" @mouseleave="onTriggerMouseLeave">
      <mu-icon v-bind="dropdownIconAttrs" />
    </mu-button>
  </mu-button-group>
  <mu-button
    v-else
    ref="wrapper" class="mu-dropdown" v-bind="$attrs" :active="dropdownVisible"
    @click="onTriggerClick" @mouseover="onTriggerMouseOver" @mouseleave="onTriggerMouseLeave">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      {{ caption }}
    </slot>
    <mu-icon v-bind="dropdownIconAttrs" />
  </mu-button>
  <Teleport v-if="dropdownReady" :to="dropdownContainer">
    <div
      ref="dropdownPanel"
      v-mu-scrollbar="dropdownScrollbar"
      v-bind="dropdownPanelAttrs"
      @click="onDropdownClick"
      @mouseover.stop="onDropdownMouseOver"
      @mouseleave.stop="onDropdownMouseLeave">
      <slot name="dropdown">
        <component
          :is="el.is"
          v-for="el in items" :key="el.key"
          v-bind="el.bindings" />
      </slot>
    </div>
  </Teleport>
</template>

<script setup>
  import { dropdownProps, dropdownEvents, useDropdown } from './dropdown'
  import { useListItems } from '../list/list-items'
  import { toRef } from 'vue'

  defineOptions({ name: 'MusselDropdownButton', inheritAttrs: false })

  const props = defineProps({
    ...dropdownProps,
    icon: String,
    caption: String,
    splitButton: Boolean,
    dropdownItems: Array
  })

  const emit = defineEmits([...dropdownEvents])

  const {
    wrapper,
    dropdownPanel,
    dropdownReady,
    dropdownVisible,
    dropdownContainer,
    dropdownIconAttrs,
    dropdownPanelAttrs,
    hide: collapse,
    onTriggerClick,
    onTriggerMouseOver,
    onTriggerMouseLeave,
    onDropdownClick,
    onDropdownMouseOver,
    onDropdownMouseLeave
  } = useDropdown(props, emit)

  const { items } = useListItems(
    toRef(props, 'dropdownItems'),
    { defaultComponent: 'mu-dropdown-item' }
  )

  defineExpose({
    dropdownVisible,
    collapse
  })
</script>
