<template>
  <div ref="wrapperRef" class="mu-input mu-combo-box" v-bind="wrapperAttrs" :tabindex="tabindex">
    <component :is="pre.is" v-if="pre" v-bind="pre.attrs" class="mu-input_prefix" @click="onPrefixClick">
      {{ pre.content }}
    </component>
    <input v-model="value" v-bind="inputAttrs" @click="onTriggerClick">
    <mu-icon v-if="clearButtonVisible" v-bind="clearButtonAttrs" @click="onClear" />
    <mu-icon v-if="expandable" tag="a" v-bind="dropdownArrowBindings" @click="onTriggerClick" />
    <component :is="suf.is" v-if="suf" v-bind="suf.attrs" class="mu-input_suffix" @click="onSuffixClick">
      {{ suf.content }}
    </component>
    <Teleport v-if="expandable && dropdownReady" :to="dropdownContainer">
      <div
        ref="dropdownRef"
        v-bind="dropdownBindings"
        class="mu-dropdown-panel"
        @click="onDropdownClick">

      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { inputProps, inputEvents, useInput } from './hooks/input'
  import { useDropdown, dropdownProps, dropdownEvents } from '../../dropdown/hooks/dropdown'

  defineOptions({ name: 'MusselDateEdit' })

  const model = defineModel('date', { type: [Date, String, Array] })

  const props = defineProps({
    editable: Boolean,
    ...inputProps,
    ...dropdownProps
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
    clearButtonAttrs,
    clear
  } = useInput(model, props, emit)

  const {
    value,
    wrapperRef,
    dropdownRef,
    dropdownReady,
    dropdownBindings,
    dropdownContainer,
    dropdownArrowBindings,
    show: showDropdown,
    hide: hideDropdown,
    onTriggerClick,
    onDropdownClick
  } = useDropdown(model, props, emit)

  const expandable = computed(() => !props.disabled && !props.readonly)

  function onClear () {
    clear()
    hideDropdown()
  }

  defineExpose({
    showDropdown,
    hideDropdown
  })
</script>
