<template>
  <div
    ref="wrapperRef"
    class="mu-input mu-select"
    v-bind="wrapperAttrs"
    :tabindex="tabindex"
    @click="onTriggerClick">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" class="mu-input_prefix" @click="onPrefixClick">
      {{ pre.content }}
    </component>
    <div
      class="mu-select_value mu-text-ellipsis"
      :placeholder="inputAttrs.placeholder">
      {{ value }}
    </div>
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click.stop="onClear" />
    <mu-icon v-if="expandable" tag="a" v-bind="dropdownArrowBindings" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" class="mu-input_suffix" @click="onSuffixClick">
      {{ suf.content }}
    </component>
    <Teleport v-if="expandable && dropdownReady" :to="dropdownContainer">
      <div
        ref="dropdownRef"
        v-mu-scrollbar="dropdownScrollbar"
        v-bind="dropdownBindings"
        class="mu-dropdown-panel"
        @click="onDropdownClick">
        <slot name="dropdown">
          <component
            :is="el.is"
            v-for="el in selectOptions" :key="el.key"
            v-bind="el.bindings" />
        </slot>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import './select.scss'

  import { inputProps, inputEvents, useInput } from './hooks/input'
  import { selectProps, selectEvents, useSelect } from './hooks/select'

  defineOptions({ name: 'MusselSelect' })

  const model = defineModel()

  const props = defineProps({
    editable: Boolean,
    ...inputProps,
    ...selectProps
  })

  const emit = defineEmits([
    ...inputEvents,
    ...selectEvents
  ])

  const {
    wrapperAttrs,
    inputAttrs,
    prefix: pre,
    suffix: suf,
    onPrefixClick,
    onSuffixClick,
    clearButtonVisible,
    clearButtonAttrs,
    clear
  } = useInput(model, props, emit)

  const {
    value,
    expandable,
    selectOptions,
    wrapperRef,
    dropdownRef,
    dropdownReady,
    dropdownBindings,
    dropdownContainer,
    dropdownArrowBindings,
    showDropdown,
    hideDropdown,
    onTriggerClick,
    onDropdownClick
  } = useSelect(model, props, emit)

  function onClear () {
    clear()
    hideDropdown()
  }

  defineExpose({
    showDropdown,
    hideDropdown
  })
</script>
