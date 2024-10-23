<template>
  <div
    ref="wrapper"
    class="mu-dropdown"
    @click="onTriggerClick"
    @mouseover="onTriggerMouseOver"
    @mouseleave="onTriggerMouseLeave">
    <slot />
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
  </div>
</template>

<script setup>
  import { toRef } from 'vue'
  import { useListItems } from '../list/list-items'
  import { dropdownProps, dropdownEvents, useDropdown } from './dropdown'

  defineOptions({ name: 'MusselDropdown' })

  const props = defineProps({
    ...dropdownProps,
    dropdownItems: Array,
    dropdownTrigger: { ...dropdownProps.dropdownTrigger, default: 'hover' }
  })

  const emit = defineEmits([...dropdownEvents])

  const {
    wrapper,
    dropdownPanel,
    dropdownReady,
    dropdownVisible,
    dropdownContainer,
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
