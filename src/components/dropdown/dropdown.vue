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
            v-for="el in computedItems" :key="el.key"
            v-bind="el.bindings" />
        </slot>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import './dropdown.scss'

  import { dropdownProps, dropdownEvents, useDropdown } from './dropdown'
  import { useVForComponents } from '@/hooks/v-for-components'

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

  const { computedItems } = useVForComponents(
    props,
    {
      itemsProp: 'dropdownItems',
      defaultComponent: 'mu-dropdown-item'
    }
  )

  defineExpose({
    dropdownVisible,
    collapse
  })
</script>
