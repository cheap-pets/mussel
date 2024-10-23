<template>
  <div ref="wrapper" class="mu-input" v-bind="wrapperAttrs" @click="toggleDropdown">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" @click.stop="onPrefixClick">
      {{ pre.content }}
    </component>
    <slot v-bind="inputAttrs">
      <input v-model="model" v-bind="inputAttrs" @click.stop="onInputClick">
    </slot>
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click.stop="clear" />
    <mu-icon v-if="expandable" tag="a" v-bind="dropdownIconAttrs" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" @click.stop="onSuffixClick">
      {{ suf.content }}
    </component>
    <Teleport v-if="expandable && dropdownReady" :to="dropdownContainer">
      <div
        ref="dropdownPanel"
        v-mu-scrollbar="dropdownScrollbar"
        v-bind="dropdownPanelAttrs"
        class="mu-combo-box_dropdown-panel"
        @click="onDropdownClick">
        <slot name="dropdown" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { pickBy } from '@/utils/object'
  import { inputProps, inputEvents, useInput } from './input'
  import { dropdownProps, dropdownEvents, useDropdown } from '../dropdown/dropdown'

  defineOptions({ name: 'MusselComboWrapper' })

  const emit = defineEmits([...inputEvents, ...dropdownEvents])
  const model = defineModel()

  const props = defineProps({
    ...inputProps,
    ...pickBy(
      dropdownProps,
      key => !['dropdownTrigger', 'dropdownPositioned'].includes(key)
    ),
    editable: Boolean
  })

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
    dropdownPanel,
    dropdownReady,
    dropdownContainer,
    dropdownIconAttrs,
    dropdownPanelAttrs,
    hide: collapse,
    toggle: toggleDropdown,
    onDropdownClick
  } = useDropdown(props, emit)

  const expandable = computed(() => !props.disabled && !props.readonly)

  function clear () {
    model.value = null
    collapse()
  }

  function onInputClick () {
    if (!props.readonly && props.editable === false) toggleDropdown()
  }

  defineExpose({
    collapse,
    toggleDropdown
  })
</script>
