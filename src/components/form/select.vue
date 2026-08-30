<template>
  <combo-wrapper
    v-model="comboValue"
    class="mu-select"
    :dropdown-items="dropdownItems"
    :dropdown-class="['mu-select__dropdown-panel', dropdownClass]"
    :dropdown-width="dropdownWidth"
    :dropdown-scrollbar="dropdownScrollbar"
    :editable="false">
    <template v-if="$slots['dropdown-header']" #dropdown-header>
      <slot name="dropdown-header" />
    </template>
    <template v-if="$slots['dropdown-items']" #dropdown-items>
      <slot name="dropdown-items" />
    </template>
    <template v-else-if="$slots.dropdown" #dropdown>
      <slot name="dropdown" />
    </template>
    <template v-if="$slots['dropdown-footer']" #dropdown-footer>
      <slot name="dropdown-footer" />
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
