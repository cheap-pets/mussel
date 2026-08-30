<template>
  <div
    ref="wrapperRef"
    class="mu-input"
    v-bind="wrapperAttrs"
    @click="onWrapperClick"
    @sizechange="updateDropdownPosition">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" @click.stop="onPrefixClick">
      {{ pre.content }}
    </component>
    <slot v-bind="inputAttrs">
      <input v-model="model" v-bind="inputAttrs" v-on="comboInputEvents">
    </slot>
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click.stop="clear" />
    <mu-icon v-if="dropdownIconAttrs && expandable" tag="a" v-bind="dropdownIconAttrs" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" @click.stop="onSuffixClick">
      {{ suf.content }}
    </component>
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
  import { computed } from 'vue'
  import { inputProps, inputEmits, useInput } from './input'
  import { dropdownProps, dropdownEvents, useDropdown } from '../dropdown/dropdown-wrapper'

  import MuDropdownPanel from '../dropdown/dropdown-panel.vue'

  defineOptions({ name: 'MusselComboWrapper' })

  const model = defineModel()

  const props = defineProps({
    ...inputProps,
    ...dropdownProps,
    dropdownItems: Array,
    editable: Boolean
  })

  const emit = defineEmits([
    ...inputEmits,
    ...dropdownEvents
  ])

  const {
    wrapperAttrs,
    inputAttrs,
    inputEvents,
    prefix: pre,
    suffix: suf,
    onPrefixClick,
    onSuffixClick,
    clearButtonVisible,
    clearButtonAttrs
  } = useInput(model, props, emit)

  const comboInputEvents = {
    ...inputEvents,
    click (e) {
      if (props.readonly || props.editable) {
        e.stopPropagation()
      }

      emit('click', e)
    }
  }

  const {
    wrapperRef,
    dropdownVisible,
    dropdownIconAttrs,
    dropdownPanelRef,
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

  defineExpose({
    dropdownVisible,
    expand,
    collapse
  })
</script>
