<template>
  <combo-wrapper
    v-model="comboValue"
    class="mu-combo-box mu-select"
    :dropdown-class="['mu-select_dropdown-panel', dropdownClass]"
    :dropdown-width="dropdownWidth"
    :dropdown-scrollbar="dropdownScrollbar"
    :editable="editable">
    <template #dropdown>
      <slot name="dropdown">
        <component
          :is="el.is"
          v-for="el in optionComponents" :key="el.key"
          v-bind="el.bindings" />
      </slot>
    </template>
  </combo-wrapper>
</template>

<script setup>
  import { selectProps, useSelect } from './select'
  import { useFieldModel } from '../form/validation'

  import ComboWrapper from './combo-wrapper.vue'

  defineOptions({ name: 'MusselComboBox' })

  const props = defineProps({ ...selectProps, editable: Boolean, modelValue: null })
  const emit = defineEmits(['update:modelValue'])

  const { model } = useFieldModel(props, 'modelValue', emit)

  const { comboValue, optionComponents } = useSelect(model, props)
</script>
