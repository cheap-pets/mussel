<template>
  <div
    ref="wrapper"
    class="mu-input"
    v-bind="wrapperAttrs"
    :tabindex="tabindex"
    @click="onTriggerClick">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" @click.stop="onPrefixClick">
      {{ pre.content }}
    </component>
    <slot name="input" v-bind="inputAttrs" />
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click.stop="clear" />
    <mu-icon v-if="expandable" tag="a" v-bind="dropdownArrowAttrs" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" @click.stop="onSuffixClick">
      {{ suf.content }}
    </component>
    <Teleport v-if="expandable && dropdownReady" :to="dropdownContainer">
      <div
        ref="dropdownPanel"
        v-mu-scrollbar="dropdownScrollbar"
        v-bind="dropdownPanelAttrs"
        class="mu-input_dropdown-panel"
        @click="onDropdownClick">
        <slot name="dropdown" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { inputProps, inputEvents, useInput } from './input'
  import { useDropdown, dropdownEvents } from '../dropdown/dropdown'

  defineOptions({ name: 'MusselDropdownInputWrapper' })

  const emit = defineEmits([...inputEvents, ...dropdownEvents])
  const model = defineModel()

  const props = defineProps({
    ...inputProps,
    editable: Boolean,
    displayValue: String,
    dropdownHost: null,
    dropdownClass: null,
    dropdownStyle: null,
    dropdownAttrs: Object,
    dropdownScrollbar: [Boolean, String]
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
    dropdownArrowAttrs,
    dropdownPanelAttrs,
    hide: hideDropdown,
    onTriggerClick,
    onDropdownClick
  } = useDropdown(props, emit)

  const expandable = computed(() => !props.disabled && !props.readonly)

  function clear () {
    model.value = null
    hideDropdown()
  }

  defineExpose({
    hideDropdown,
    onTriggerClick
  })
</script>
