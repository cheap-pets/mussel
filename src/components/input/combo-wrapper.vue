<template>
  <div
    ref="wrapper"
    class="mu-input"
    v-bind="wrapperAttrs"
    @click="onWrapperClick"
    @sizechange="updateDropdownPosition">
    <component
      :is="pre.is"
      v-if="pre"
      v-bind="pre.attrs"
      @click.stop="onPrefixClick">
      {{ pre.content }}
    </component>
    <slot v-bind="inputAttrs">
      <input v-model="model" v-bind="inputAttrs" @click.stop="onInputClick">
    </slot>
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click.stop="clear" />
    <mu-icon v-if="dropdownIconAttrs && expandable" tag="a" v-bind="dropdownIconAttrs" />
    <component
      :is="suf.is"
      v-if="suf"
      v-bind="suf.attrs"
      @click.stop="onSuffixClick">
      {{ suf.content }}
    </component>
    <mu-dropdown-panel
      ref="dropdownPanel"
      class="mu-input__dropdown-panel"
      v-bind="dropdownPanelAttrs"
      v-on="dropdownPanelEvents">
      <slot name="dropdown" />
    </mu-dropdown-panel>
  </div>
</template>

<script setup>
  import './combo-wrapper.scss'

  import { computed } from 'vue'
  import { inputProps, inputEvents, useInput } from './input'
  import { dropdownProps, dropdownEvents, useDropdown } from '../dropdown/dropdown-wrapper'

  defineOptions({ name: 'MusselComboWrapper' })

  const model = defineModel()

  const props = defineProps({
    ...inputProps,
    ...dropdownProps,
    editable: Boolean
  })

  const emit = defineEmits([
    ...inputEvents,
    ...dropdownEvents
  ])

  const {
    wrapperAttrs,
    inputAttrs,
    prefix: pre,
    suffix: suf,
    onPrefixClick,
    onSuffixClick,
    clearButtonVisible,
    clearButtonAttrs
  } = useInput(model, props, emit)

  const {
    wrapper,
    dropdownVisible,
    dropdownIconAttrs,
    dropdownPanel,
    dropdownPanelAttrs,
    dropdownPanelEvents,
    expand,
    collapse,
    toggle: toggleDropdown,
    updateDropdownPosition
  } = useDropdown(props, emit)

  const expandable = computed(() =>
    !props.disabled &&
    !props.readonly &&
    !props.dropdownDisabled
  )

  function clear () {
    model.value = null
    collapse()
  }

  function onWrapperClick () {
    if (!props.disabled && !props.readonly) toggleDropdown()
  }

  function onInputClick () {
    if (!props.readonly && props.editable === false) toggleDropdown()
  }

  defineExpose({
    dropdownVisible,
    expand,
    collapse
  })
</script>
