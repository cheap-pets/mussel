<template>
  <combo-wrapper
    v-model="comboValue"
    class="mu-select"
    :dropdown-items="dropdownItems"
    :dropdown-class="['mu-select__dropdown-panel', dropdownClass]"
    :dropdown-width="dropdownWidth"
    :dropdown-scrollbar="dropdownScrollbar"
    :editable="false">
    <template #dropdown>
      <slot name="dropdown" />
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

  const { comboValue, dropdownItems } = useSelect(model, props)
</script>
