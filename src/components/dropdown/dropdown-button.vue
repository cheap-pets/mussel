<template>
  <mu-button-group
    v-if="splitButton"
    ref="wrapperRef" class="mu-dropdown" v-bind="$attrs">
    <mu-button :icon="icon" :caption="caption" @click="collapse">
      <slot />
    </mu-button>
    <mu-button
      class="mu-button mu-icon-button" :active="dropdownVisible"
      @click.stop="onTriggerClick" @mouseover="onTriggerMouseOver" @mouseleave="onTriggerMouseLeave">
      <mu-icon v-bind="dropdownArrowBindings" />
    </mu-button>
  </mu-button-group>
  <mu-button
    v-else
    ref="wrapperRef" class="mu-dropdown" v-bind="$attrs" :active="dropdownVisible"
    @click="onTriggerClick" @mouseover="onTriggerMouseOver" @mouseleave="onTriggerMouseLeave">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      {{ caption }}
    </slot>
    <mu-icon v-if="arrow" v-bind="dropdownArrowBindings" />
  </mu-button>
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
</template>

<script setup>
  import { dropdownProps, dropdownEvents, useDropdown } from './hooks/dropdown'
  import { useVForComponents } from '@/hooks/v-for-components'

  defineOptions({ name: 'MusselDropdownButton', inheritAttrs: false })

  const props = defineProps({
    icon: String,
    caption: String,
    splitButton: Boolean,
    dropdownItems: Array,
    arrow: { type: Boolean, default: true },
    ...dropdownProps
  })

  const emit = defineEmits([...dropdownEvents])

  const {
    wrapperRef,
    dropdownRef,
    dropdownReady,
    dropdownVisible,
    dropdownBindings,
    dropdownContainer,
    dropdownArrowBindings,
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
      itemsKeyProp: 'id',
      defaultComponent: 'mu-dropdown-item'
    }
  )

  defineExpose({
    dropdownVisible,
    collapse
  })
</script>
