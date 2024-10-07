<template>
  <div
    ref="wrapperRef"
    class="mu-dropdown"
    @click="onTriggerClick"
    @mouseover="onTriggerMouseOver"
    @mouseleave="onTriggerMouseLeave">
    <slot />
    <Teleport v-if="dropdownReady" :to="dropdownContainer">
      <div
        ref="dropdownRef"
        v-mu-scrollbar="dropdownScrollbar"
        v-bind="dropdownBindings"
        class="mu-dropdown-panel"
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

  import { dropdownProps, dropdownEvents, useDropdown } from './hooks/dropdown'
  import { useVForComponents } from '@/hooks/v-for-components'

  defineOptions({ name: 'MusselDropdown' })

  const props = defineProps({ dropdownItems: Array, ...dropdownProps })
  const emit = defineEmits([...dropdownEvents])

  const {
    wrapperRef,
    dropdownRef,
    dropdownReady,
    dropdownVisible,
    dropdownBindings,
    dropdownContainer,
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
