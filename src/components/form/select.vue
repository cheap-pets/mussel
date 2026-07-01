<template>
  <combo-wrapper
    v-model="comboValue"
    class="mu-select"
    :dropdown-class="['mu-select__dropdown-panel', dropdownClass]"
    :dropdown-width="dropdownWidth"
    :dropdown-scrollbar="dropdownScrollbar"
    :editable="false">
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
  import ComboWrapper from './combo-wrapper.vue'

  import { selectProps, useSelect } from './select'
  import { useFieldModel } from '../form/validation'

  defineOptions({ name: 'MusselSelect' })

  const props = defineProps({ ...selectProps })

  const rawModel = defineModel()
  const model = useFieldModel(rawModel).modelProxy

  const { comboValue, optionComponents } = useSelect(model, props)
</script>
